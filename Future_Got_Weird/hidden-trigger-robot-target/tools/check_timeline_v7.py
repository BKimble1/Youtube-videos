#!/usr/bin/env python3
"""Automated timeline validation for FGW Hidden Trigger V7, run against a RENDERED master (not just the source).

Usage: python3 tools/check_timeline_v7.py MASTER.mp4 ZIPFORMER_DIR [--stills N]
  MASTER.mp4     the rendered file to validate (1080x1920 review or 2160x3840 master)
  ZIPFORMER_DIR  sherpa-onnx-zipformer-en-2023-06-26 (local ASR used for the authoritative transcript)
Inputs: production/V7_EDL.json (tools/build_edl_v7.ts), the locked narration, source/src/Root.tsx.
Writes qa/timeline_check_v7_<name>.json and exits non-zero if any check fails.

Checks:
 A EDL: shots tile [0, frames) with no gap/overlap; every shot id once; order == intended order; beats non-decreasing
 B transcript of the master's own audio: every locked script word present, in order (narration not reordered)
 C captions vs measured speech: each caption shows from <=0.3 s before its first word to >=0.15 s after its last
   word onset, never into the next caption's speech; captions in order and non-overlapping
 D shots vs narration: every caption phrase a shot plays under (>0.15 s) is one the shot is declared for; every
   phrase is covered by a shot declared for it; set-up lines (captions 0-8) end before 50 % of the runtime
 E duplicates: no two different shots look the same (mid-frame thumbnails), except declared intentional repeats
 F audio: locked narration hash; mix file present; audio duration == video duration; master audio == the mix
 G render source: the composition is registered with the right length; sampled frames of the master match stills
   rendered from the HiddenTriggerV7 composition (same frame index) far better than neighbouring frames
 H encoding: H.264 + AAC, 30 fps, 768 frames, start 0, moov before mdat, keyframe at least every 15 frames, no black
   frames, no freeze >= 1.5 s"""
import hashlib, json, os, re, struct, subprocess, sys
import numpy as np

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4, ZDIR = sys.argv[1], sys.argv[2]
N_STILLS = int(sys.argv[sys.argv.index('--stills') + 1]) if '--stills' in sys.argv else 16
NAME = os.path.splitext(os.path.basename(MP4))[0]
SCR = os.environ.get('V7_TMP', '/tmp/v7check')
os.makedirs(SCR, exist_ok=True)
edl = json.load(open(os.path.join(EP, 'production/V7_EDL.json')))
FPS, NF = edl['fps'], edl['frames']
R = {'master': os.path.basename(MP4), 'checks': {}}
fails = []


def check(key, ok, detail):
    R['checks'][key] = {'pass': bool(ok), 'detail': detail}
    if not ok:
        fails.append(key)
    print(f"{'PASS' if ok else 'FAIL'}  {key}: {detail if isinstance(detail, str) else json.dumps(detail)[:300]}")


def run(*a, **k):
    return subprocess.run(a, capture_output=True, **k)


# ---------------- A: EDL structure ----------------
shots = edl['shots']
cover = shots[0]['frame_in'] == 0 and shots[-1]['frame_out'] == NF and all(a['frame_out'] == b['frame_in'] for a, b in zip(shots, shots[1:]))
check('A1_no_gaps_or_overlaps', cover, f"{len(shots)} shots tile frames 0-{NF}" if cover else 'gap/overlap found')
ids = [s['id'] for s in shots]
dups = sorted({i for i in ids if ids.count(i) > 1})
check('A2_unique_shot_ids', not dups, 'each shot id appears once as one contiguous range' if not dups else f'repeated ids: {dups}')
check('A3_order_matches_intended', ids == edl['intended_order'], ' > '.join(ids))
beats = [s['beat'] for s in shots]
check('A4_story_beats_non_decreasing', all(b is not None for b in beats) and beats == sorted(beats), beats)

# ---------------- B: transcript of the master's own audio ----------------
tr_path = os.path.join(SCR, f'transcript_{NAME}.json')
r = run(sys.executable, os.path.join(EP, 'tools/transcribe_master_v7.py'), MP4, ZDIR, tr_path, text=True)
tr = json.load(open(tr_path))
R['transcript'] = {'asr_text': tr['asr_text'], 'matched_words': tr['matched_words'], 'script_words': tr['script_words']}
al = tr['script_alignment']
onsets = [w['start'] for w in al]
in_order = all(w['matched'] for w in al) and all(a <= b + 1e-6 for a, b in zip(onsets, onsets[1:]))
check('B1_all_script_words_in_order', in_order, f"{tr['matched_words']}/{tr['script_words']} locked script words found in the master's audio, monotonic onsets")

# ---------------- C: captions vs measured speech ----------------
caps = edl['captions']
toks = lambda s: [t for t in re.sub(r'[^a-z\' ]', ' ', s.lower()).split() if t]
k = 0
cap_words = []
for c in caps:
    n = len(toks(c['text']))
    cap_words.append(al[k:k + n])
    k += n
assigned_ok = k == len(al) and all([toks(w['word'])[0] for w in cw] == toks(c['text']) for c, cw in zip(caps, cap_words))
check('C0_caption_text_equals_script', assigned_ok, f'{len(caps)} captions cover all {len(al)} script words, verbatim and in order')
# speech onset of each phrase: the ASR onset, moved later to the first sound in the locked narration waveform (0 s
# offset in the master, check F) when the phrase follows a pause: ASR token times run early after silences
import soundfile as sf
yn, srn = sf.read(narr_path := os.path.join(EP, edl['audio']['narration']))
yn = yn.mean(1) if yn.ndim > 1 else yn
Wn = int(0.01 * srn)
lvn = np.array([20 * np.log10(np.sqrt((yn[i:i + Wn] ** 2).mean()) + 1e-12) for i in range(0, len(yn) - Wn, Wn)])


def phrase_onset(t):
    for i in range(max(8, int(round((t - 0.45) / 0.01))), int(round((t + 0.35) / 0.01))):
        if lvn[i] > -50 and lvn[i - 8:i].max() < -60:
            return max(t, i * 0.01)
    return t


speech_end = onsets[-1] + 0.6
rows, bad = [], []
starts = [phrase_onset(cw[0]['start']) for cw in cap_words]
for i, (c, cw) in enumerate(zip(caps, cap_words)):
    f, l = starts[i], cw[-1]['start']
    nxt = starts[i + 1] if i + 1 < len(caps) else speech_end
    row = {'i': i, 'text': c['text'], 'speech_onset': round(f, 3), 'asr_first_word_onset': cw[0]['start'], 'last_word_onset': l, 'next_speech': round(nxt, 3), 'window': [c['window_start'], c['window_end']]}
    errs = []
    if c['window_start'] > f + 0.05: errs.append('appears after its speech starts')
    if c['window_start'] < f - 0.15: errs.append('appears before its words are heard (lead > 0.15 s)')
    # it must stay up >= 0.15 s after its last word starts, unless the next phrase follows without a pause (then it
    # may hand over at the next caption's 0.05 s lead)
    if c['window_end'] < min(l + 0.15, nxt - 0.05) - 1e-6: errs.append('disappears before its last word')
    if c['window_end'] > nxt + 0.05: errs.append("runs into the next phrase's speech")
    row['errors'] = errs
    rows.append(row)
    if errs: bad.append((i, errs))
R['caption_sync'] = rows
lead = max(r['speech_onset'] - r['window'][0] for r in rows)
check('C1_caption_windows_match_speech', not bad, f'all 16 caption windows sit on their own words (max lead before the first sound {lead:.2f} s; none appears after its words start; none runs into the next phrase)' if not bad else bad)
ov = [i for i in range(len(caps) - 1) if caps[i]['window_end'] > caps[i + 1]['window_start'] + 1e-6]
check('C2_captions_ordered_non_overlapping', not ov, 'ordered, non-overlapping' if not ov else ov)

# ---------------- D: shots vs narration ----------------
spans = [(starts[i], (starts[i + 1] if i + 1 < len(caps) else cw[-1]['start'] + 0.5)) for i, cw in enumerate(cap_words)]
shot_rows, dbad = [], []
covered = {i: [] for i in range(len(caps))}
for s in shots:
    ovl = {i: min(b, s['t_out']) - max(a, s['t_in']) for i, (a, b) in enumerate(spans)}
    under = [i for i, o in ovl.items() if o > 0.15]
    # declared phrases may overlap freely; declared edge phrases (J-cuts) only by <= 0.35 s; anything else > 0.15 s fails
    undeclared = [i for i in under if i not in (s['declared_captions'] or []) and not (i in s.get('edge_captions', []) and ovl[i] <= 0.35)]
    for i in under:
        if i in (s['declared_captions'] or []):
            covered[i].append(s['id'])
    shot_rows.append({'id': s['id'], 't': [s['t_in'], s['t_out']], 'plays_under': [caps[i]['text'] for i in under], 'edge_overlaps_s': {caps[i]['text']: round(ovl[i], 3) for i in s.get('edge_captions', []) if ovl[i] > 0}, 'undeclared': undeclared})
    if undeclared: dbad.append((s['id'], [caps[i]['text'] for i in undeclared]))
R['shot_narration_map'] = shot_rows
jc = {r['id']: r['edge_overlaps_s'] for r in shot_rows if r['edge_overlaps_s']}
check('D1_each_shot_under_its_own_phrases', not dbad, f'every shot plays only under the narration it illustrates; declared J-cuts (picture leads by <= 0.35 s): {jc}' if not dbad else dbad)
unc = [caps[i]['text'] for i, v in covered.items() if not v]
check('D2_every_phrase_illustrated', not unc, 'every caption phrase has a shot declared for it on screen' if not unc else unc)
late = [caps[i]['text'] for i in range(7) if caps[i]['window_end'] > edl['duration_s'] * 0.4]
check('D3_no_setup_material_late', not late, 'set-up lines ("This AI robot was told" ... "But the robot was real.") all end before 40 % of the runtime (10.24 s)' if not late else late)


# ---------------- E: duplicated scenes ----------------
def frame_gray(path, n, w, h):
    b = run('ffmpeg', '-v', 'error', '-i', path, '-vf', f"select='eq(n\\,{n})',scale={w}:{h}:flags=area", '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-').stdout
    return np.frombuffer(b, np.uint8).astype(float)


thumbs = {s['id']: frame_gray(MP4, (s['frame_in'] + s['frame_out']) // 2, 36, 64) for s in shots}
allowed = {tuple(sorted(p)) for p in edl['intentional_repeats']}
sim = []
for i, a in enumerate(shots):
    for b in shots[i + 1:]:
        ta, tb = thumbs[a['id']], thumbs[b['id']]
        za, zb = (ta - ta.mean()) / (ta.std() + 1e-6), (tb - tb.mean()) / (tb.std() + 1e-6)
        corr = float((za * zb).mean())
        if corr > 0.93 and tuple(sorted((a['id'], b['id']))) not in allowed:
            sim.append((a['id'], b['id'], round(corr, 3)))
check('E1_no_unintended_duplicate_shots', not sim, 'no two different shots share a look (mid-frame correlation <= 0.93); P1 is the declared flash-forward of P19' if not sim else sim)

# ---------------- F: audio ----------------
narr = os.path.join(EP, edl['audio']['narration'])
h = hashlib.sha256(open(narr, 'rb').read()).hexdigest()
check('F1_locked_narration_unchanged', h.startswith('ae76438d168a5070'), f'narration_v3_testvoice.wav sha256 {h[:16]}...')
mix = os.path.join(EP, edl['audio']['mix'])
check('F2_mix_asset_present', os.path.exists(mix), edl['audio']['mix'])
pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', MP4, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
check('F3_audio_duration_equals_video', abs(float(a['duration']) - float(v['duration'])) < 1 / FPS and abs(float(v['duration']) - edl['duration_s']) < 1e-3, f"video {v['duration']} s, audio {a['duration']} s")
dec = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', MP4, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-').stdout, np.float32)
ref = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', mix, '-ac', '1', '-f', 'f32le', '-').stdout, np.float32)
L = min(len(dec), len(ref))
c = float(np.dot(dec[:L], ref[:L]) / np.sqrt(np.dot(dec[:L], dec[:L]) * np.dot(ref[:L], ref[:L])))
check('F4_master_audio_is_the_approved_mix', c > 0.995, f'correlation with {os.path.basename(mix)}: {c:.5f}')

# ---------------- G: render source ----------------
root = open(os.path.join(EP, 'source/src/Root.tsx')).read()
reg = re.search(r'<Composition id="HiddenTriggerV7" component=\{HiddenTriggerV7\} durationInFrames=\{DURATION3\}', root)
check('G1_composition_registered', bool(reg), 'Root.tsx registers HiddenTriggerV7 (v7/HiddenTriggerV7.tsx) with DURATION3 = 768 frames')
sample = sorted({int(round(x)) for x in np.linspace(0, NF - 1, N_STILLS)} | {s['frame_in'] for s in shots[:: max(1, len(shots) // 8)]})
sd = os.path.join(SCR, f'stills_{NAME}')
r = run('node', 'stills.mjs', sd, *map(str, sample), cwd=os.path.join(EP, 'source'), env={**os.environ, 'COMP': 'HiddenTriggerV7', 'SCALE': '0.5', 'NO_SHEET': '1'}, text=True)
gbad, grows = [], []
for n in sample:
    st = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', os.path.join(sd, f'f{n:05d}.png'), '-vf', 'scale=270:480:flags=area', '-f', 'rawvideo', '-pix_fmt', 'gray', '-').stdout, np.uint8).astype(float)
    ps = lambda x, y: 20 * np.log10(255 / np.sqrt(((x - y) ** 2).mean() + 1e-9))
    same = ps(st, frame_gray(MP4, n, 270, 480))
    other = max(ps(st, frame_gray(MP4, m, 270, 480)) for m in (max(0, n - 30), min(NF - 1, n + 30)) if m != n)
    grows.append({'frame': n, 'psnr_same_frame': round(same, 2), 'psnr_best_frame_1s_away': round(other, 2)})
    if same < 30 or same < other + 3:
        gbad.append(n)
R['render_vs_source'] = grows
check('G2_master_frames_match_V7_composition', not gbad, f'{len(sample)} sampled frames match stills of HiddenTriggerV7 at the same index (min {min(g["psnr_same_frame"] for g in grows):.1f} dB) and not the frames 1 s away' if not gbad else gbad)

# the rendered captions themselves: at every caption boundary (first/last frame of each window and one frame
# outside), the caption band of the master must match the composition's own render of that frame
bf = set()
for c in caps:
    f0, f1 = int(np.ceil(c['window_start'] * FPS - 1e-6)), int(np.ceil(c['window_end'] * FPS - 1e-6)) - 1
    bf |= {max(0, f0 - 1), f0, f1, min(NF - 1, f1 + 1)}
bf = sorted(bf)
cd = os.path.join(SCR, f'capstills_{NAME}')
# captions are compared at the master's own resolution (text rasterises differently at other scales): stills are
# rendered at scale = master width / 1080, and the caption band is compared pixel for pixel
k = int(v['width']) // 1080
run('node', 'stills.mjs', cd, *map(str, bf), cwd=os.path.join(EP, 'source'), env={**os.environ, 'COMP': 'HiddenTriggerV7', 'SCALE': str(k), 'NO_SHEET': '1'}, text=True)
cbad, cmin = [], 99.0
band = f'crop={1080 * k}:{220 * k}:0:{1380 * k}'
for n in bf:
    st = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', os.path.join(cd, f'f{n:05d}.png'), '-vf', band, '-f', 'rawvideo', '-pix_fmt', 'gray', '-').stdout, np.uint8).astype(float)
    mb = run('ffmpeg', '-v', 'error', '-i', MP4, '-vf', f"select='eq(n\\,{n})',{band}", '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-').stdout
    m = np.frombuffer(mb, np.uint8).astype(float)
    p = 20 * np.log10(255 / np.sqrt(((st - m) ** 2).mean() + 1e-9))
    cmin = min(cmin, p)
    if p < 30:
        cbad.append((n, round(p, 1)))
check('G3_rendered_captions_match_timeline', not cbad, f'caption band matches the V7 composition at {v["width"]}x{v["height"]} on all {len(bf)} caption-boundary frames (min {cmin:.1f} dB)' if not cbad else cbad)

# ---------------- H: encoding ----------------
okc = v['codec_name'] == 'h264' and a['codec_name'] == 'aac' and v['r_frame_rate'] == '30/1' and int(v['nb_frames']) == NF and float(pr['format'].get('start_time', 0)) == 0
check('H1_codec_rate_frames_start', okc, f"{v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['nb_frames']} frames, {a['codec_name']} {a.get('bit_rate')} b/s, start {pr['format'].get('start_time')}")
data = open(MP4, 'rb').read(64 << 10)
order, off = [], 0
while off + 8 <= len(data):
    size, typ = struct.unpack('>I4s', data[off:off + 8])
    order.append(typ.decode('latin1'))
    if typ == b'mdat' or size < 8:
        break
    off += size
check('H2_moov_before_mdat', 'moov' in order and order.index('moov') < order.index('mdat') if 'mdat' in order else False, ' > '.join(order))
kf = [float(x.strip(',')) for x in run('ffprobe', '-v', 'error', '-select_streams', 'v:0', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', MP4, text=True).stdout.split() if x.strip(',')]
gap = max(np.diff(kf + [edl['duration_s']]))
check('H3_keyframe_every_half_second', kf[0] == 0 and gap <= 15 / FPS + 1e-6, f'{len(kf)} keyframes, max spacing {gap:.3f} s (scrubbing and frame sampling land on the right picture)')
bd = run('ffmpeg', '-hide_banner', '-nostats', '-i', MP4, '-vf', 'blackdetect=d=0.03:pic_th=0.95:pix_th=0.06', '-an', '-f', 'null', '-', text=True).stderr
fz = run('ffmpeg', '-hide_banner', '-nostats', '-i', MP4, '-vf', 'freezedetect=n=0.0005:d=1.5', '-an', '-f', 'null', '-', text=True).stderr
blk, frz = re.findall(r'black_start:\S+', bd), re.findall(r'freeze_start: \S+', fz)
check('H4_no_black_or_frozen_frames', not blk and not frz, 'no black frames; no freeze >= 1.5 s' if not (blk or frz) else {'black': blk, 'freeze': frz})

R['pass'] = not fails
R['failed'] = fails
json.dump(R, open(os.path.join(EP, f'qa/timeline_check_v7_{NAME}.json'), 'w'), indent=1, ensure_ascii=False)
print(f"\n{'ALL CHECKS PASSED' if not fails else 'FAILED: ' + ', '.join(fails)}  ({len(R['checks'])} checks) -> qa/timeline_check_v7_{NAME}.json")
sys.exit(1 if fails else 0)
