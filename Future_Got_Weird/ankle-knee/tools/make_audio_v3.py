#!/usr/bin/env python3
"""V3: effects, ambience and mix for the Ankle Knee Short (the approved take, with sentence gaps over 0.30 s tightened by make_narration_v3.py). Everything is synthesised here (no samples, no music). The
narration master is used sample for sample (gain, a gentle compressor and a limiter only) and stays in front.

Effects are placed from the picture's own events (audio/cues_v3.json, exported from v3/story3.ts by tools/export_cues_v3.ts):
  ball strike   two strikes: the opening contact (1.12 s) and the closing kick; a rising whoosh carries the first ball
                into the lens and the scan, the second flies off toward the goal
  cleats        a grass scuff and a soft thud on each landing the rig makes (pylon tick on the prosthetic side), the
                plant after the lace, the left support cleat set beside the ball
  middle        monitor tick and a low push into the scan, a low pulse and a ping for the ringed bone, air on the
                dissolve, cut-line ticks, a soft lift as the middle separates, a chime for the kept foot, an airy swish
                shaped like the half-turn, a soft knock as the shin seats on the thigh
  rehab         gym tone, hands tightening on the rails, socket/liner and cloth as he bends
  recovery      room tone, a small stir, fabric as the toes crease the blanket; the lace slides and is pulled snug
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio_v3.py [mix_name]"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v3'
cj = json.load(open(os.path.join(EP, 'audio/cues_v3.json')))
DUR, T = cj['DUR'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2026)
LOG = []

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = (np.arange(len(sig)) + i) % N  # the film loops
    buf[idx] += sig * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def win(a, b, fade=0.03):
    """1 inside [a, b) with short fades (loop-aware for a > b)"""
    w = np.zeros(N)
    ia, ib = int(a * SR), int(b * SR)
    if ia < ib: w[ia:ib] = 1
    else: w[ia:] = 1; w[:ib] = 1
    k = int(fade * SR)
    return np.convolve(np.concatenate([w[-k:], w, w[:k]]), np.ones(k) / k, 'same')[k:-k]

# ---------------- generators
def thump(dur, f0, f1, click=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.3)) + click * lp(noise(n), 900) * np.exp(-tt / 0.012))
def slap(dur=0.05, lo=500, hi=3800):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), lo, hi) * np.exp(-tt / 0.009))
def tick(dur=0.03, f=3600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-tt / 0.0015) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def scuff(dur=0.09):
    n = int(dur * SR); tt = np.arange(n) / SR
    g = (rng.random(n) < 0.05).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.5 + 2.0 * g, 1400, 7000) * np.exp(-tt / (dur * 0.35)))
def sweep(dur, lo0, lo1, hi0, hi1, shape=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    return norm(lp(out, 9000)) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
def rustle(dur=0.4, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)
def knock(f=180, dur=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + 0.3 * bp(noise(n), 300, 1500) * np.exp(-tt / 0.012))
def tone(f, dur, partials=((1, 1, 0.6), (2.0, 0.25, 0.4), (3.0, 0.1, 0.25))):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in partials)) * env(n, 0.01, dur * 0.4)
def chirp(f0, f1, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * tt / dur) ** 2

sfx = np.zeros(N)
CUTS = cj['CUTS']
def span(name):
    for k, (s0, nm) in enumerate(CUTS):
        if nm == name: return s0, (CUTS[k + 1][0] if k + 1 < len(CUTS) else DUR)
S = {nm: span(nm) for _, nm in CUTS}
S1, S2 = cj['STRIKE1'], cj['STRIKE2']
def strike(at, gain=-13, name='ball strike'):
    place(sfx, thump(0.32, 150, 62, 0.35), at, name, gain)
    place(sfx, slap(0.05), at, None, gain - 4)
    place(sfx, tick(0.02, 2600), at + 0.002, None, gain - 14)
def cleat(at, name, gain=-24, pro=False):
    place(sfx, scuff(0.1), at - 0.01, name, gain)
    place(sfx, thump(0.12, 110, 70, 0.1), at, None, gain - 6)
    if pro: place(sfx, tick(0.02, 3400), at + 0.01, None, gain - 14)
# ---- the opening: the turned ankle flexes, the leg swings through, the strike, the ball rushes at the lens
place(sfx, rustle(0.3, 2000, 6000), 0.0, 'toes flex in the socket (skin on the liner)', -38)
place(sfx, sweep(0.75, 300, 800, 1500, 4500, 0.8), 0.32, 'the prosthetic leg swings through', -29)
place(sfx, scuff(0.1), 0.05, 'support cleat set in the turf', -30)
strike(S1, -16, 'ball strike (opening)')
place(sfx, sweep(0.7, 150, 400, 900, 3500, 0.6), S1 + 0.03, 'the ball comes at the lens (rising whoosh)', -24)
# ---- scan: the ball becomes the scan; the lens pushes into the knee; the diseased section is ringed
place(sfx, tick(0.03, 2200), S['scan'][0] + 0.01, 'the ball becomes the scan (monitor tick)', -32)
place(sfx, sweep(1.0, 120, 260, 600, 1600, 1.2), S['scan'][0] + 0.05, 'push into the knee scan (low air)', -34)
place(sfx, thump(0.8, 60, 48, 0.0) * np.sin(np.linspace(0, 5 * np.pi, int(0.8 * SR))) ** 2, T['bone'] - 0.05, 'diseased bone (low pulse)', -31)
place(sfx, tone(1046.5, 0.5), T['cancer'] + 0.2, 'the diseased section is ringed (soft ping)', -40)
# ---- anatomy: the scan dissolves into the drawing, cut lines, the middle separates, the foot is kept
place(sfx, sweep(0.5, 400, 900, 2500, 5000, 1.0), S['anat'][0] - 0.1, 'scan dissolves into the drawing (air)', -38)
place(sfx, tick(0.025, 3000), T['surgeons'] + 0.2, 'cut line', -34)
place(sfx, tick(0.025, 3300), T['surgeons'] + 0.4, 'cut line', -34)
place(sfx, sweep(0.8, 250, 600, 1500, 3500, 1.0), T['remove'] - 0.05, 'the middle section separates (soft)', -32)
place(sfx, sweep(0.6, 200, 500, 1200, 3000, 1.0), T['knee2'] + 0.1, 'the lens travels with the kept shin and foot', -36)
place(sfx, tone(880, 0.9) + 0.6 * tone(1318.5, 0.9), T['save'] - 0.1, 'the foot is kept (soft chime)', -37)
# ---- the half-turn (three-quarter view): an airy swish shaped like the turn's speed
n0, n1 = int((T['they'] + 0.12) * SR), int((T['around'] + 0.2) * SR)
u = np.linspace(0, 1, n1 - n0)
air = norm(bp(noise(n1 - n0), 700, 5000)) * np.sin(np.pi * u) ** 1.5
sfx[n0:n1] += db(-31) * air
LOG.append({'t': round(T['they'] + 0.12, 3), 'sfx': 'the half-turn (airy swish)', 'gain_db': -31})
# ---- attach: the shin rises into line and seats on the thigh
place(sfx, sweep(0.7, 200, 500, 1000, 2500, 1.0), T['attached'] - 0.1, 'the shin rises into line', -36)
place(sfx, knock(240, 0.2), T['thigh'] + 0.05, 'the shin seats on the thigh (soft knock)', -28)
for k in range(3): place(sfx, tick(0.015, 5000), T['thigh'] + 0.25 + 0.08 * k, 'stitches' if k == 0 else None, -40)
# ---- rehab proof shot: toes flex pointing back, the bend
place(sfx, rustle(0.35, 1200, 5000), T['pointing'], 'his toes flex in the socket', -38)
place(sfx, knock(520, 0.12), T['that'] - 0.02, 'hands tighten on the rails', -34)
place(sfx, tick(0.03, 1800), T['that'], None, -37)
place(sfx, rustle(0.6, 800, 3000), cj['bend'][0] + 0.05, 'the bend (socket and liner creak)', -35)
place(sfx, rustle(0.5, 900, 3500), cj['bend'][0], 'trainers and cloth as he lowers', -38)
# ---- recovery: the toes press the blanket (fabric), a first stir, the smile
place(sfx, rustle(0.3, 900, 4500), T['woke'] + 0.05, 'a first small stir', -40)
place(sfx, rustle(0.45, 600, 3500), T['wiggle'] - 0.02, 'toes press a crease into the blanket (fabric)', -30)
place(sfx, rustle(0.3, 500, 2500), cj['FACE_T'] + 0.1, 'he shifts on the pillow', -42)
# ---- the lace tug, the plant
place(sfx, rustle(0.25, 2500, 8000), S['lace'][0] + 0.03, 'lace slides through the eyelets', -34)
place(sfx, slap(0.04, 900, 4000), S['lace'][1] - 0.06, 'the lace pulled snug (tug)', -24)
place(sfx, tick(0.02, 2200), S['lace'][1] - 0.04, None, -30)
cleat(cj['plant'], 'the prosthetic cleat plants on turf', -21, True)
# ---- the closing approach and kick
for L in cj['lands']:
    if abs(L['t'] - S2) < 0.2: continue  # the swing brushing low into the ball, not a landing
    cleat(L['t'], f"cleat lands ({L['foot']})", -24, L['foot'] == 'prosthetic')
cleat(S2 - 0.5, 'left support cleat plants beside the ball', -22)
place(sfx, sweep(0.3, 300, 900, 1800, 5000, 0.8), S2 - 0.28, 'the leg swings into the ball', -28)
strike(S2, -16, 'ball strike (closing)')
place(sfx, sweep(0.9, 900, 300, 5000, 1500, 1.2), S2 + 0.03, 'the ball flies off toward the goal', -31)

# ---- ambience beds: the pitch, the scan, the plate, the rehab room, the recovery room
wind = circ(lambda x: lp(x, 500), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * t / DUR * 3))
leaves = circ(lambda x: bp(x, 2500, 7000), noise(N)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / DUR * 7) ** 2)
field = 0.8 * norm(wind) + 0.12 * norm(leaves)
for k in range(10):
    at = rng.random() * DUR
    place(field, chirp(3200 + 800 * rng.random(), 4200 + 900 * rng.random(), 0.07) * 0.05, at)
room = circ(lambda x: lp(x, 260), noise(N)) * 0.7 + 0.18 * np.sin(2 * np.pi * 60 * t) + 0.06 * np.sin(2 * np.pi * 120 * t)
clean = circ(lambda x: bp(x, 150, 900), noise(N))
gym = circ(lambda x: bp(x, 200, 1500), noise(N))
w_field = win(*S['open']) + win(*S['plant']) + win(*S['kick'])
amb = db(-22) * norm(field) * w_field + db(-30) * norm(room) * win(*S['scan']) + db(-37) * norm(clean) * (win(*S['anat']) + win(*S['turn']) + win(*S['attach']))
amb += db(-31) * norm(gym) * win(*S['rehab']) + db(-29) * norm(room) * (win(*S['foot']) + win(*S['face'])) + db(-30) * norm(lp(field, 900)) * win(*S['lace'])

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Ankle_Knee_narration_V3.wav'))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]; out[i] = y
    return x * np.minimum(out, minimum_filter1d(need, size=3))
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
sfx = sfx * db(8.0)
sfx_d = sfx * (1 - 0.3 * np.clip(venv * 3, 0, 1))
mix = voice + sfx_d + amb * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix = limit(mix * g, -1.6)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Ankle_Knee_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('amb', amb * duck * g)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'voice_lufs_in_mix': lufs_of(voice * g),
       'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'amb_lufs_in_mix': lufs_of(amb * duck * g), 'voice_max_gain_reduction_db': round(grmin, 2),
       'duration_s': DUR, 'effects': len(LOG), 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
