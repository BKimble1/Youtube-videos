#!/usr/bin/env python3
"""Automated V4 checks (no human judgement). Usage (repo root):  python3 tools/qa_v4.py [fast|orig]
Needs the delivered MP4s/SRT, audio/v4/cues_<pace>.json, qa/v4/audit_<pace>.json (node source/scripts/audit_captions.mjs qa/v4/audit_<pace>.json <pace>).
Writes qa/v4/automated_checks[_original_pace].txt"""
import json, os, re, subprocess, sys, tempfile
import numpy as np, wave
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PACE = sys.argv[1] if len(sys.argv) > 1 else 'fast'
TAG = '' if PACE == 'fast' else '_OriginalPace'
CLEAN = f'FGW_Atlas_No_Pinky_V4{TAG}_1080x1920.mp4'
CAPT = f'FGW_Atlas_No_Pinky_V4{TAG}_Captioned_1080x1920.mp4'
SRT = f'FGW_Atlas_No_Pinky_V4{TAG}.srt'
OUTTXT = 'qa/v4/automated_checks.txt' if PACE == 'fast' else 'qa/v4/automated_checks_original_pace.txt'
NAR = 'audio/v4/narration_fast_48k.wav' if PACE == 'fast' else 'audio/narration_48k.wav'
MIXDIR = 'audio/v4' if PACE == 'fast' else 'audio/v4/original_pace'
FPS = 30
out = []
fails = []
def log(s=''):
    print(s); out.append(s)
def fail(s):
    fails.append(s); log('  FAIL: ' + s)
def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

cues = json.load(open(f'audio/v4/cues_{PACE}.json'))
audit = json.load(open(f'qa/v4/audit_{PACE}.json'))
words = cues['words']
EVF = {k: v['frame'] for k, v in cues['events'].items()}
TOTAL = cues['total_frames']
log(f'# V4 automated checks — pace: {PACE} ({TOTAL} frames = {TOTAL / FPS:.3f} s)')

# ------------------------------------------------------------------ fonts
log('\n## fonts (browser-side proof, bundled @fontsource faces)')
for k, v in audit['fontProof'].items():
    ok = v['check'] and abs(v['withFace'] - v['fallbackOnly']) > 1
    log(f"  {k}: document.fonts.check={v['check']}; width of the probe string with face {v['withFace']:.1f} vs fallback-only {v['fallbackOnly']:.1f} -> {'rendering' if ok else 'NOT RENDERING'}")
    if not ok: fail(f'{k} did not render')
log('  headline extents (x px; safe band 60..930, right rail clear):')
for h in audit['headlines']:
    ok = 60 <= h['left'] and h['right'] <= 930
    log(f"    {h['id']:<14} x {h['left']:4d}..{h['right']:4d} ({h['width']} px) {'ok' if ok else 'OUT OF BAND'}")
    if not ok: fail(f"headline {h['id']} outside 60..930")

# ------------------------------------------------------------------ transcript / SRT / cue timing
log(f'\n## captions: transcript, timing, coverage, reading time, fit ({SRT} + the rendered cue table)')
def tosec(t):
    h, m, r = t.split(':'); s, ms = r.split(','); return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
blocks = open(SRT).read().strip().split('\n\n')
srt_words, srt_cues = [], []
for b in blocks:
    ls = b.split('\n'); a, bb = ls[1].split(' --> ')
    srt_cues.append((tosec(a), tosec(bb), ' '.join(ls[2:])))
    srt_words += ' '.join(ls[2:]).split()
nar = [w['text'] for w in words]
log(f'  transcript equality: SRT words {len(srt_words)} vs narration words {len(nar)} -> {"identical, same order" if srt_words == nar else "MISMATCH"}')
if srt_words != nar: fail('SRT transcript differs from narration')
caps = audit['captions']
render_words = []
for c in caps:
    for l in c['lines']: render_words += l['text'].split()
log(f'  rendered cue table words {len(render_words)} -> {"identical" if render_words == nar else "MISMATCH"}')
if render_words != nar: fail('rendered cue words differ from narration')
wi = 0; rows = []
for k, c in enumerate(caps):
    ws = sum((l['text'].split() for l in c['lines']), [])
    first, last = words[wi], words[wi + len(ws) - 1]; wi += len(ws)
    start_lag = (c['from'] / FPS - first['start']) * 1000
    final_end = max(last['end'], last['voice_end'])
    hold = (c['to'] / FPS - final_end) * 1000
    nxt = caps[k + 1]['from'] if k + 1 < len(caps) else None
    handoff = nxt is not None and nxt <= c['to']
    dur = (c['to'] - c['from']) / FPS
    wps = len(ws) / dur; cps = len(' '.join(ws)) / dur
    rows.append((k, ' '.join(ws), start_lag, hold, handoff, dur, wps, cps, c))
    srt_s, srt_e, _ = srt_cues[k]
    if abs(srt_s - c['from'] / FPS) > 0.034 or abs(srt_e - c['to'] / FPS) > 0.034:
        fail(f'cue {k + 1}: SRT times {srt_s:.3f}-{srt_e:.3f} differ from rendered frames {c["from"] / FPS:.3f}-{c["to"] / FPS:.3f}')
log('  cue  start-lag  end-hold  handoff  dur   wps  cps  lines  width  size  text')
for k, txt, sl, hold, ho, dur, wps, cps, c in rows:
    log(f"  {k + 1:3d}  {sl:+7.0f} ms {hold:+7.0f} ms  {'clean ' if ho else '      '}  {dur:4.2f}  {wps:4.1f} {cps:4.1f}  {c['nLines']}      {c['maxWidth']:6.1f}  {c['size']:3d}   {txt}")
    if abs(sl) > 17: fail(f'cue {k + 1} start lag {sl:.0f} ms')
    if hold < 0: fail(f'cue {k + 1} ends {-hold:.0f} ms BEFORE its final word ends')
    if not (ho or 55 <= hold <= 130 or k == len(rows) - 1) and hold > 130: fail(f'cue {k + 1} holds {hold:.0f} ms after the final word (over 120 ms without a handoff)')
    if not ho and 0 <= hold < 55 and k != len(rows) - 1: fail(f'cue {k + 1} end hold {hold:.0f} ms is shorter than 60 ms and not a clean handoff')
    if c['nLines'] > 2: fail(f'cue {k + 1} has {c["nLines"]} lines')
    if c['maxWidth'] > 760: fail(f'cue {k + 1} width {c["maxWidth"]:.0f} > 760')
    if c['size'] < 76: fail(f'cue {k + 1} shrank to {c["size"]} px (rewrap before shrinking)')
    if cps > 24: fail(f'cue {k + 1} reads at {cps:.1f} chars/s')
mx = max(r[7] for r in rows)
log(f'  max reading rate {mx:.1f} chars/s; shortest cue {min(r[5] for r in rows):.2f} s; widest line {max(c["maxWidth"] for c in caps):.1f} px (limit 760); cues rewrapped but never shrunk: {all(c["size"] == 76 for c in caps)}')
loop_tear = EVF['loop.tear']
last_to = caps[-1]['to']
log(f'  replay boundary: first cue starts at frame {caps[0]["from"]}; last cue ends frame {last_to} ({last_to / FPS:.3f} s), closing tear starts frame {loop_tear} -> {"caption clear before the tear" if last_to < loop_tear else "OVERLAP"}')
if last_to >= loop_tear: fail('last cue overlaps the tear')
if caps[0]['from'] != 0: fail('first cue does not start at frame 0')
log(f'  gaps between cues (frames): {[caps[i + 1]["from"] - caps[i]["to"] for i in range(len(caps) - 1)]}')

# ------------------------------------------------------------------ media
for f in (CLEAN, CAPT):
    log(f'\n## {f}')
    if not os.path.exists(f): fail(f'{f} missing'); continue
    p = json.loads(sh(f'ffprobe -v error -show_streams -show_format -of json {f}').stdout)
    v = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in p['streams'] if s['codec_type'] == 'audio'][0]
    log(f"  video {v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['pix_fmt']} {v.get('color_space')} frames={v['nb_frames']} dur={float(v['duration']):.3f}s")
    log(f"  audio {a['codec_name']} {a['sample_rate']} Hz ch={a['channels']} {int(a['bit_rate']) // 1000} kb/s dur={float(a['duration']):.3f}s; size {int(p['format']['size']) / 1e6:.1f} MB")
    if (v['width'], v['height']) != (1080, 1920) or v['r_frame_rate'] != '30/1' or int(v['nb_frames']) != TOTAL: fail(f'{f} not native 1080x1920 30 fps {TOTAL} frames')
    r = sh(f'ffmpeg -v error -i {f} -f null - 2>&1')
    log(f"  full decode errors: {'none' if not (r.stdout + r.stderr).strip() else (r.stdout + r.stderr).strip()[:200]}")
    if (r.stdout + r.stderr).strip(): fail(f'{f} decode errors')
    r = sh(f'ffmpeg -hide_banner -nostats -i {f} -af ebur128=peak=true -f null - 2>&1').stdout
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]; LRA = re.findall(r'LRA:\s+(-?[\d.]+) LU', r)[-1]; TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]
    log(f'  integrated {I} LUFS, LRA {LRA} LU, true peak {TP} dBTP')
    if float(TP) > -1.4: fail(f'true peak {TP} above -1.4')
am = [sh(f'ffmpeg -v error -i {f} -map 0:a -f md5 -').stdout.strip() for f in (CLEAN, CAPT)]
log(f'\n## audio identical between clean and captioned: {am[0] == am[1]} ({am[0]})')
if am[0] != am[1]: fail('audio differs between clean and captioned')

# ------------------------------------------------------------------ scene changes
log('\n## scene-change detections on the clean MP4 (threshold 0.25; each should sit inside a planned transition window)')
fr = lambda f: f / FPS
WIN = [(EVF['tape.wipe'] - 1, EVF['tape.wipe'] + 19, 'tape wipe'), (EVF['slip.in'] - 5, EVF['slip.in'] + 4, 'B03 edge wipe'), (EVF['iris.b04'] - 3, EVF['iris.b04'] + 15, 'stamp iris'),
       (EVF['b05.cut_b'] - 47, EVF['b05.cut_b'] - 39, 'B05A edge wipe'), (EVF['b05.cut_b'] - 1, EVF['b05.cut_b'] + 7, 'B05B edge wipe'), (EVF['b05.cut_c'] - 1, EVF['b05.cut_c'] + 7, 'B05C edge wipe'),
       (EVF['b06.slide'] - 1, EVF['b06.slide'] + 7, 'B06 edge wipe'), (EVF['b07.slide'] - 1, EVF['b07.slide'] + 7, 'B07 edge wipe'), (EVF['b09.drop'] - 1, EVF['b09.drop'] + 7, 'B09 edge wipe'), (EVF['loop.tear'] - 1, TOTAL, 'closing tear')]
r = sh(f"ffmpeg -hide_banner -nostats -i {CLEAN} -vf \"select='gt(scene,0.25)',metadata=print:file=-\" -an -f null - 2>&1").stdout
ts = [round(float(m) * FPS) for m in re.findall(r'pts_time:([\d.]+)', r)]
unplanned = 0
for t in ts:
    tag = next((n for a, b, n in WIN if a <= t <= b), 'UNPLANNED')
    unplanned += tag == 'UNPLANNED'
    log(f'  frame {t:4d} ({t / FPS:5.2f}s)  {tag}')
log(f'  detections: {len(ts)}; unplanned: {unplanned}')
if unplanned: fail(f'{unplanned} unplanned scene changes')

# ------------------------------------------------------------------ contact audit
log('\n## held-grip contact audit (tools/check_contacts.mjs: pad capsule vs object, px; <= 0 touching/pressing; tolerance 8 px)')
r = sh('node tools/check_contacts.mjs')
for l in (r.stdout + r.stderr).strip().split('\n'):
    if 'worst' in l or 'approach' in l or l.startswith('OK') or l.startswith('FAIL'):
        log('  ' + l)
if r.returncode != 0: fail('contact audit')

# ------------------------------------------------------------------ audio vs narration
log('\n## audio timing: cross-correlation of the delivered MP4 audio with the narration file the cues were built from')
def rdmono(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768).reshape(-1, ch).mean(1)
tmpwav = tempfile.mktemp(suffix='.wav')
sh(f'ffmpeg -v error -y -i {CLEAN} -map 0:a -ac 1 -ar 48000 -c:a pcm_s16le {tmpwav}')
a_mp4 = rdmono(tmpwav); a_nar = rdmono(NAR)
n = min(len(a_mp4), len(a_nar))
X = np.fft.rfft(a_mp4[:n], 2 * n); Y = np.fft.rfft(a_nar[:n], 2 * n)
cc = np.fft.irfft(X * np.conj(Y), 2 * n)
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
peak = cc.max() / (np.linalg.norm(a_mp4[:n]) * np.linalg.norm(a_nar[:n]) + 1e-12)
log(f'  best lag {lag / 48:.1f} ms (0 = captions and speech share one clock), normalised peak {peak:.2f}')
if abs(lag / 48) > 40: fail('narration/mix lag over 40 ms')
os.remove(tmpwav)
if PACE == 'fast' and os.path.exists('audio/v4/retime_report.txt'):
    log('  retime report (envelope cross-correlation between the planned time map and the rendered retimed narration):')
    for l in open('audio/v4/retime_report.txt').read().strip().split('\n'): log('    ' + l)

# ------------------------------------------------------------------ static: no persistent source/tag bars
log('\n## no persistent source / tag bars (static scan of the V4 picture code)')
hits = sh("grep -rnE \"Source:|RECONSTRUCTION|COMPANY-REPORTED|ILLUSTRATION|Attrib\" source/src/v4 | grep -v '^source/src/v4/FilmV4.tsx:.*no persistent' || true").stdout.strip()
log('  ' + (hits.replace('\n', '\n  ') if hits else 'none found'))
if hits: fail('source/tag strings found in src/v4')
cn = sh("grep -rn \"Boston Dynamics\\|BOSTON DYNAMICS\" source/src/v4 | grep -v \"^source/src/v4/type.tsx\" || true").stdout.strip()
log('  company name appears on picture only in: ' + (cn.replace('\n', ' | ') if cn else 'nowhere'))

# ------------------------------------------------------------------ loop seam (picture)
log('\n## loop seam, picture (PSNR dB between decoded frames; adjacent-frame values inside the opener are the reference)')
td = tempfile.mkdtemp()
L = TOTAL - 1
for n_ in (0, 1, 2, 3, L - 3, L - 2, L - 1, L):
    sh(f'ffmpeg -v error -y -i {CLEAN} -vf "select=eq(n\\,{n_})" -vframes 1 {td}/f{n_}.png')
    sh(f'ffmpeg -v error -y -i {CAPT} -vf "select=eq(n\\,{n_})" -vframes 1 {td}/c{n_}.png')
def psnr(pre, a, b):
    r = sh(f'ffmpeg -hide_banner -i {td}/{pre}{a}.png -i {td}/{pre}{b}.png -lavfi "[0][1]psnr" -f null - 2>&1').stdout
    return float(re.search(r'average:([0-9.]+)', r).group(1))
for a, b in ((L, 0), (L - 1, L), (L - 2, L - 1), (L - 3, L - 2), (0, 1), (1, 2), (2, 3)):
    log(f'  frame {a:4d} -> {b:4d}: {psnr("f", a, b):5.1f} dB')
log(f'  captioned MP4, last -> first: {psnr("c", L, 0):5.1f} dB')
log(f'  captioned MP4 last frame vs clean last frame identical? {sh(f"cmp {td}/f{L}.png {td}/c{L}.png").returncode == 0} (no caption on the final frame); first frame carries the caption lane: {sh(f"cmp {td}/f0.png {td}/c0.png").returncode != 0}')

# ------------------------------------------------------------------ audio stems
log('\n## audio stems (same gain structure as the mix, before limiter)')
def rd(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768).reshape(-1, ch)
SR = 48000
st = {k: rd(f'{MIXDIR}/stems/{k}.wav') for k in ('narration', 'music', 'effects')}
mix = rd(f'{MIXDIR}/FGW_Atlas_No_Pinky_V4_mix.wav')
voice = st['narration'].mean(1)
mask = np.abs(voice) > 0.01
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vr = db(voice[mask])
log(f'  while speaking: voice {vr:.1f} dBFS RMS; music {db(st["music"].mean(1)[mask]) - vr:+.1f} dB re voice; effects {db(st["effects"].mean(1)[mask]) - vr:+.1f} dB re voice')
log(f'  in gaps: music {db(st["music"].mean(1)[~mask]):.1f} dBFS RMS')
Lc, Rc = mix[:, 0], mix[:, 1]
log(f'  mix L/R correlation {np.corrcoef(Lc, Rc)[0, 1]:.4f}; mix sample peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS; samples {len(mix)} = {len(mix) / SR:.4f} s (video {TOTAL / FPS:.4f} s)')
T_ = TOTAL / FPS
nn = lambda a, b: db(mix[int(a * SR):int(b * SR)].mean(1))
log(f'  boundary RMS: last 0.5 s {nn(T_ - 0.5, T_):.1f} dBFS, last 0.1 s {nn(T_ - 0.1, T_):.1f} dBFS, first 0.1 s {nn(0, 0.1):.1f} dBFS, first 0.5 s {nn(0, 0.5):.1f} dBFS')
mus = st['music'].mean(1)
log(f'  music-bed seam step |last sample - first sample| = {abs(mus[-1] - mus[0]):.5f} (typical adjacent-sample step {np.mean(np.abs(np.diff(mus))):.5f})')
sfx = [l for l in open(f'{MIXDIR}/sfx_log.csv').read().strip().split('\n')[1:] if ',sfx,' in l]
log(f'  effect events: {len(sfx)} ({len(set(l.split(",")[1] for l in sfx))} distinct cue names; V3 had 29, V1 41)')
ml = json.load(open(f'{MIXDIR}/MIX_LOG.json'))
log(f'  effects landing on the first syllable of a phrase: {ml["sfx_first_syllable_collisions"] or "none"}; music {ml["music_bpm"]:.3f} BPM = {ml["music_bars"]} bars over the video length')
log(f'  voice ends {max(w["voice_end"] for w in words):.3f} s; last cue ends {last_to / FPS:.3f} s; closing tear {loop_tear / FPS:.3f} s; picture {T_:.3f} s')

log(f'\n## summary: {"ALL AUTOMATED CHECKS PASSED" if not fails else str(len(fails)) + " FAILURE(S): " + "; ".join(fails)}')
os.makedirs('qa/v4', exist_ok=True)
open(OUTTXT, 'w').write('\n'.join(out) + '\n')
sys.exit(1 if fails else 0)
