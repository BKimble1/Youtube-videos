#!/usr/bin/env python3
"""Temporal continuity scan of a rendered film: every frame, every consecutive pair, motion-compensated.

Pixel difference alone cannot tell a glitch from legitimate motion, so for every frame t this measures what the
MOTION does not explain:
  - dense optical flow (DIS, on a 540x960 grey copy) from t-1 to t and from t+1 to t;
  - each neighbour is warped onto frame t along that flow;
  - fwd(t) = |I_t - warp(I_{t-1})|   (a change into t that the motion does not explain: a pop, a swap, a reset)
  - flk(t) = min(fwd(t), bwd(t)) with bwd(t) = |I_t - warp(I_{t+1})|
                                      (a pixel inconsistent with BOTH neighbours: a one-frame flicker)
Both are summarised over 16x16-pixel blocks (at 540x960). A frame is FLAGGED when its worst-block score or its count
of bad blocks is far above the robust local level (rolling median over +-15 frames), outside planned cuts.

Cuts come from the film's own scene table (audio/cues.json); a frame within one frame of a cut is a cut, not a glitch.

usage: python3 tools/temporal_qa.py <video> <out_dir> [--crops]
writes <out_dir>/temporal_scan.csv (all frames), temporal_report.json, and with --crops a sheet per flagged frame
(t-1 | t | t+1 | fwd heatmap | flicker heatmap) for visual review."""
import json, os, sys, subprocess
import numpy as np
import cv2

src, out = sys.argv[1], sys.argv[2]
CROPS = '--crops' in sys.argv
os.makedirs(out, exist_ok=True)
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 540, 960
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                     capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n = len(F)
B = 16
G = [cv2.cvtColor(f, cv2.COLOR_RGB2GRAY) for f in F]
CJ = json.load(open(os.path.join(EP, 'audio/cues.json')))
S = CJ['SCENES']
fps = 30
cut_frames = sorted(int(round(S[k] * fps)) for k in ('s2', 's5', 's6', 's7'))
# the 3D -> 2D handover (cross-fade) and the loop seam are continuity regions handled separately
handover = (int(11.75 * fps), int(12.75 * fps))
# TEXT EVENTS are legitimate one-frame changes: a caption replacing another (and its 2-frame fade-in), and the "6+ FEET"
# pop. On those frames ONLY the text's own box is excluded from the measurement; the rest of the picture is still scanned.
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
CAPS = TL['captions']
def hide_of(k):
    c = CAPS[k]
    if k == len(CAPS) - 1: return c['hide']
    nx = CAPS[k + 1]['show']
    return nx if nx > c['hide'] and nx - c['hide'] < 0.12 else c['hide']
def cap_at(t):
    for k, c in enumerate(CAPS):
        if t >= (0 if k == 0 else c['show']) and t < hide_of(k): return k
    return -1
def cap_y(show):
    return 1560 if 16.8 <= show < 21.15 else 300
FEET = CJ['pig']['feet']
def text_mask(t):
    """blocks (16 px at 540x960) to ignore at frame t"""
    m = np.zeros((H // B, W // B), bool)
    ks = {cap_at((t + d) / fps) for d in (-1, 0, 1)}
    fading = any(0 <= t / fps - CAPS[k]['show'] < 0.1 for k in range(len(CAPS)))
    if len(ks) > 1 or fading:
        for k in ks:
            if k < 0: continue
            y = cap_y(CAPS[k]['show'] + 0.01) / 2
            m[max(0, int((y - 62) // B)):int((y + 62) // B) + 1, int(50 // B):int(440 // B) + 1] = True
    if FEET - 0.05 <= t / fps <= FEET + 0.7:
        m[int((740 - 75) // B):int((740 + 75) // B) + 1, int(60 // B):int(480 // B) + 1] = True
    return m

# DIS optical flow (Kroeger et al.): unlike Farneback it tracks large motions over smooth, low-texture surfaces (a test on
# the S5 pan: Farneback reported 0 px of motion on a 22 px/frame pan; DIS 11-20 px, matching the camera maths)
DIS = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
DIS.setFinestScale(0); DIS.setPatchSize(12); DIS.setPatchStride(4); DIS.setGradientDescentIterations(25); DIS.setVariationalRefinementIterations(10)
def flow(a, b):
    return DIS.calc(G[a], G[b], None)

def warp(img, fl):
    # fl maps pixels of the TARGET frame to where they came from in img
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return cv2.remap(img, xx + fl[..., 0], yy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

def resid(t, s):
    """|I_t - I_s warped onto t| (colour, mean over channels)"""
    fl = flow(t, s)  # flow from t to s: for each pixel of t, where it is in s
    w = warp(F[s].astype(np.float32), fl)
    return np.abs(F[t].astype(np.float32) - w).mean(axis=2)

def blocks(r):
    h, w = (H // B) * B, (W // B) * B
    return r[:h, :w].reshape(h // B, B, w // B, B).mean(axis=(1, 3))

rows = []
FWD, FLK = {}, {}
for t in range(n):
    fwd = resid(t, t - 1) if t > 0 else np.zeros((H, W), np.float32)
    bwd = resid(t, t + 1) if t < n - 1 else np.zeros((H, W), np.float32)
    flk = np.minimum(fwd, bwd) if 0 < t < n - 1 else np.zeros((H, W), np.float32)
    bf, bk = blocks(fwd), blocks(flk)
    tm = text_mask(t)
    bf[tm] = 0; bk[tm] = 0
    FWD[t], FLK[t] = bf, bk
    raw_mad = float(np.abs(F[t].astype(np.float32) - F[t - 1].astype(np.float32)).mean()) if t > 0 else 0.0
    rows.append({'frame': t, 't': round(t / fps, 3), 'raw_mad': round(raw_mad, 3),
                 'fwd_p99': round(float(np.percentile(bf, 99)), 3), 'fwd_max': round(float(bf.max()), 3), 'fwd_bad': int((bf > 12).sum()),
                 'flk_p99': round(float(np.percentile(bk, 99)), 3), 'flk_max': round(float(bk.max()), 3), 'flk_bad': int((bk > 8).sum())})
    if t % 100 == 0: print('frame', t, file=sys.stderr)

def kind(t):
    if any(abs(t - c) <= 1 for c in cut_frames): return 'cut'
    if handover[0] <= t <= handover[1]: return 'handover'
    if t == 0 or t == n - 1: return 'loop-seam'
    return ''
arr = {k: np.array([r[k] for r in rows], float) for k in ('fwd_max', 'fwd_bad', 'flk_max', 'flk_bad', 'fwd_p99', 'flk_p99')}
def local(x, t, r=15):
    lo, hi = max(0, t - r), min(n, t + r + 1)
    idx = [i for i in range(lo, hi) if i != t and not kind(i)]
    return float(np.median(x[idx])) if idx else 0.0
flagged = []
for t in range(1, n - 1):
    r = rows[t]; r['kind'] = kind(t)
    reasons = []
    # a pop/swap: an unexplained change much larger than this stretch's own level, and large in absolute terms
    if r['fwd_max'] > max(18, 2.2 * local(arr['fwd_max'], t)) and r['fwd_bad'] >= 2: reasons.append('unexplained change (pop/swap)')
    if r['fwd_bad'] > max(6, 3 * local(arr['fwd_bad'], t)): reasons.append('many changed blocks')
    # a flicker: inconsistent with both neighbours
    if r['flk_max'] > max(12, 2.2 * local(arr['flk_max'], t)) and r['flk_bad'] >= 2: reasons.append('one-frame flicker')
    r['flag'] = '; '.join(reasons)
    if reasons and not r['kind']: flagged.append(t)
rows[0]['kind'] = 'loop-seam'; rows[-1]['kind'] = 'loop-seam'; rows[0]['flag'] = rows[-1]['flag'] = ''
# the loop seam: last -> first, same metric
fl = DIS.calc(G[0], G[n - 1], None)
seam = blocks(np.abs(F[0].astype(np.float32) - warp(F[n - 1].astype(np.float32), fl)).mean(axis=2))
m0 = np.zeros_like(seam, bool)
y0 = cap_y(CAPS[0]['show'] + 0.01) / 2
m0[max(0, int((y0 - 62) // B)):int((y0 + 62) // B) + 1, int(50 // B):int(440 // B) + 1] = True  # the first caption appears on frame 0
seam[m0] = 0
# where in frame: the worst block of each flagged frame
def where(t, M):
    i, j = np.unravel_index(np.argmax(M[t]), M[t].shape)
    return {'x': int(j * B * 2 + B), 'y': int(i * B * 2 + B)}  # in 1080x1920 pixels
with open(os.path.join(out, 'temporal_scan.csv'), 'w') as f:
    keys = ['frame', 't', 'kind', 'raw_mad', 'fwd_p99', 'fwd_max', 'fwd_bad', 'flk_p99', 'flk_max', 'flk_bad', 'flag']
    f.write(','.join(keys) + '\n')
    for r in rows: f.write(','.join(str(r.get(k, '')).replace(',', ';') for k in keys) + '\n')
groups = []
for t in flagged:
    if groups and t - groups[-1][-1] <= 2: groups[-1].append(t)
    else: groups.append([t])
rep = {'file': os.path.basename(src), 'frames': n, 'pairs_compared': n - 1, 'cuts': cut_frames, 'handover': handover,
       'flagged_frames': flagged, 'flagged_groups': [[g[0], g[-1]] for g in groups],
       'flagged_detail': [{'frame': t, 't': rows[t]['t'], 'flag': rows[t]['flag'], 'fwd_max': rows[t]['fwd_max'], 'fwd_bad': rows[t]['fwd_bad'],
                           'flk_max': rows[t]['flk_max'], 'flk_bad': rows[t]['flk_bad'], 'worst_fwd_at': where(t, FWD), 'worst_flk_at': where(t, FLK)} for t in flagged],
       'loop_seam': {'fwd_max': round(float(seam.max()), 2), 'fwd_bad': int((seam > 12).sum())},
       'median_over_film': {k: round(float(np.median(v[[i for i in range(n) if not kind(i)]])), 3) for k, v in arr.items()}}
json.dump(rep, open(os.path.join(out, 'temporal_report.json'), 'w'), indent=1)
print(json.dumps({k: rep[k] for k in ('frames', 'pairs_compared', 'flagged_groups', 'loop_seam', 'median_over_film')}, indent=1))
if CROPS:
    os.makedirs(os.path.join(out, 'flagged'), exist_ok=True)
    def heat(M):
        m = cv2.resize(np.clip(M / 30.0, 0, 1).astype(np.float32), (W, H), interpolation=cv2.INTER_NEAREST)
        return (cv2.applyColorMap((m * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)[..., ::-1])
    for g in groups:
        t = g[int(np.argmax([rows[k]['fwd_max'] + rows[k]['flk_max'] for k in g]))]
        strip = np.concatenate([F[t - 1], F[t], F[t + 1], heat(FWD[t]), heat(FLK[t])], axis=1)
        cv2.imwrite(os.path.join(out, 'flagged', f'f{t:03d}.png'), cv2.resize(strip, (strip.shape[1] // 2, H // 2))[..., ::-1])
