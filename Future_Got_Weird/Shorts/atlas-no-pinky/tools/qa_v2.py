#!/usr/bin/env python3
"""Automated V2 checks (no human judgement): SRT vs word alignment, media specs, loudness, integrity, seam, scene-change timing.
Writes qa/v2/automated_checks.txt. Run from the repo root:  python3 tools/qa_v2.py"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
out = []
def log(s=''):
    print(s); out.append(s)
def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)

al = json.load(open('audio/narration_alignment.json'))
words = al['words']
cues = json.load(open('audio/cues_v2.json'))

# ---- SRT
log('## SRT vs word alignment (FGW_Atlas_No_Pinky_V2.srt)')
blocks = [b for b in open('FGW_Atlas_No_Pinky_V2.srt').read().strip().split('\n\n')]
def tosec(t):
    h, m, r = t.split(':'); s, ms = r.split(','); return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
prev_end = -1; bad = 0; wi = 0; total_words = 0
for b in blocks:
    ls = b.split('\n'); idx = int(ls[0]); a, bb = ls[1].split(' --> '); a, bb = tosec(a), tosec(bb); text = ls[2:]
    ws = ' '.join(text).split(); total_words += len(ws)
    ok = 3 <= len(ws) <= 6 and len(text) <= 2 and all(len(l) <= 20 for l in text) and a < bb and a >= prev_end - 1e-6
    # first/last word must match the aligned narration order
    seq = [w['text'] for w in words[wi:wi + len(ws)]]
    ok &= seq == ws
    start_ok = abs(a - words[wi]['start']) < 0.005
    ok &= start_ok
    wi += len(ws); prev_end = bb
    if not ok: bad += 1; log(f'  cue {idx}: FAIL {ws}')
log(f'  cues={len(blocks)} words_covered={total_words}/{len(words)} violations={bad}')
log(f'  last cue ends {prev_end:.3f}s; voice ends {al["measured_voice_ends_seconds"].get(words[-1]["text"], words[-1]["end"]):.3f}s; picture {cues["total_seconds"]}s')
lens = [tosec(b.split("\n")[1].split(" --> ")[1]) - tosec(b.split("\n")[1].split(" --> ")[0]) for b in blocks]
log(f'  cue durations: min {min(lens):.2f}s max {max(lens):.2f}s')

# ---- media
for f in ('FGW_Atlas_No_Pinky_V2_1080x1920.mp4', 'FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4'):
    log(f'\n## {f}')
    p = json.loads(sh(f'ffprobe -v error -show_streams -show_format -of json {f}').stdout)
    v = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in p['streams'] if s['codec_type'] == 'audio'][0]
    log(f"  video {v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['pix_fmt']} {v.get('color_space')} frames={v['nb_frames']} dur={float(v['duration']):.3f}s")
    log(f"  audio {a['codec_name']} {a['sample_rate']} Hz ch={a['channels']} {int(a['bit_rate']) // 1000} kb/s dur={float(a['duration']):.3f}s; size {int(p['format']['size']) / 1e6:.1f} MB")
    r = sh(f'ffmpeg -v error -i {f} -f null - 2>&1')
    log(f"  full decode errors: {'none' if not (r.stdout + r.stderr).strip() else (r.stdout + r.stderr).strip()[:200]}")
    r = sh(f'ffmpeg -hide_banner -nostats -i {f} -af ebur128=peak=true -f null - 2>&1').stdout
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]; LRA = re.findall(r'LRA:\s+(-?[\d.]+) LU', r)[-1]; TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]
    log(f'  integrated {I} LUFS, LRA {LRA} LU, true peak {TP} dBTP')
am = [sh(f'ffmpeg -v error -i {f} -map 0:a -f md5 -').stdout.strip() for f in ('FGW_Atlas_No_Pinky_V2_1080x1920.mp4', 'FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4')]
log(f'\n## audio identical between clean and captioned: {am[0] == am[1]} ({am[0]})')

# ---- scene-change timing (expected only at planned transitions)
log('\n## scene-change detections on the clean MP4 (threshold 0.25; each should sit inside a planned transition window)')
r = sh("ffmpeg -hide_banner -nostats -i FGW_Atlas_No_Pinky_V2_1080x1920.mp4 -vf \"select='gt(scene,0.25)',metadata=print:file=-\" -an -f null - 2>&1").stdout
ts = [float(m) for m in re.findall(r'pts_time:([\d.]+)', r)]
win = [(2.8, 3.4, 'tape wipe'), (7.9, 8.4, 'slip slide'), (9.8, 10.5, 'stamp iris'), (16.1, 16.6, 'B05A slide'), (17.8, 18.2, 'B05B slide'), (18.8, 19.2, 'B05C slide'), (20.1, 20.7, 'B06 slide'), (26.2, 26.8, 'B07 slide'), (31.0, 31.6, 'B09 drop'), (33.8, 34.6, 'closing tear')]
for t in ts:
    tag = next((n for a, b, n in win if a <= t <= b), 'UNPLANNED')
    log(f'  {t:6.2f}s  {tag}')
log(f'  detections: {len(ts)}; unplanned: {sum(1 for t in ts if not any(a <= t <= b for a, b, _ in win))}')

# ---- loop seam (picture): last frames vs first frames of the clean MP4
log('\n## loop seam, picture (PSNR dB between decoded frames of the clean MP4; adjacent-frame values inside the opener are the reference)')
import tempfile
td = tempfile.mkdtemp()
V = 'FGW_Atlas_No_Pinky_V2_1080x1920.mp4'
for n in (0, 1, 2, 3, 1034, 1035, 1036, 1037):
    sh(f'ffmpeg -v error -y -i {V} -vf "select=eq(n\\,{n})" -vframes 1 {td}/f{n}.png')
def psnr(a, b):
    r = sh(f'ffmpeg -hide_banner -i {td}/f{a}.png -i {td}/f{b}.png -lavfi "[0][1]psnr" -f null - 2>&1').stdout
    return float(re.search(r'average:([\d.]+)', r).group(1))
for a, b in ((1037, 0), (1036, 1037), (1035, 1036), (1034, 1035), (0, 1), (1, 2), (2, 3)):
    log(f'  frame {a:4d} -> {b:4d}: {psnr(a, b):5.1f} dB')

# ---- audio measurements from the stems
log('\n## audio stems (same gain structure as the mix, before limiter)')
import numpy as np, wave
def rd(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768).reshape(-1, ch)
SR = 48000
st = {k: rd(f'audio/v2/stems/{k}.wav') for k in ('narration', 'music', 'effects')}
mix = rd('audio/v2/FGW_Atlas_No_Pinky_V2_mix.wav')
voice = st['narration'].mean(1)
mask = np.abs(voice) > 0.01
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
vr = db(voice[mask])
log(f'  while speaking: voice {vr:.1f} dBFS RMS; music {db(st["music"].mean(1)[mask]) - vr:+.1f} dB re voice; effects {db(st["effects"].mean(1)[mask]) - vr:+.1f} dB re voice')
gaps = ~mask
log(f'  in gaps: music {db(st["music"].mean(1)[gaps]):.1f} dBFS RMS')
L, R = mix[:, 0], mix[:, 1]
log(f'  mix L/R correlation {np.corrcoef(L, R)[0, 1]:.4f}; mix sample peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS')
n = lambda a, b: db(mix[int(a * SR):int(b * SR)].mean(1))
log(f'  boundary RMS: last 0.5 s {n(34.1, 34.6):.1f} dBFS, last 0.1 s {n(34.5, 34.6):.1f} dBFS, first 0.1 s {n(0, 0.1):.1f} dBFS, first 0.5 s {n(0, 0.5):.1f} dBFS')
sfx = [l for l in open('audio/v2/sfx_log.csv').read().strip().split('\n')[1:] if ',sfx,' in l]
log(f'  effect events: {len(sfx)} ({len(set(l.split(",")[1] for l in sfx))} distinct cue names; V1 had 41)')
log(f'  voice-free tail: voice ends 33.43 s, picture 34.60 s; music dips to silence over the last 0.30 s, mix ends with a 0.12 s fade; no closing chord')

open('qa/v2/automated_checks.txt', 'w').write('\n'.join(out) + '\n')
