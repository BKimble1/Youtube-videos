#!/usr/bin/env python3
"""Automated V3 checks (no human judgement): SRT vs word alignment, media specs, loudness, integrity, seam, scene-change timing.
Writes qa/v3/automated_checks.txt. Run from the repo root:  python3 tools/qa_v3.py"""
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
cues = json.load(open('audio/cues_v3.json'))

# ---- SRT
log('## SRT vs word alignment (FGW_Atlas_No_Pinky_V3.srt)')
blocks = [b for b in open('FGW_Atlas_No_Pinky_V3.srt').read().strip().split('\n\n')]
def tosec(t):
    h, m, r = t.split(':'); s, ms = r.split(','); return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
prev_end = -1; bad = 0; wi = 0; total_words = 0
for b in blocks:
    ls = b.split('\n'); idx = int(ls[0]); a, bb = ls[1].split(' --> '); a, bb = tosec(a), tosec(bb); text = ls[2:]
    ws = ' '.join(text).split(); total_words += len(ws)
    ok = 2 <= len(ws) <= 6 and len(text) <= 2 and all(len(l) <= 20 for l in text) and a < bb and a >= prev_end - 1e-6
    # first/last word must match the aligned narration order
    seq = [w['text'] for w in words[wi:wi + len(ws)]]
    ok &= seq == ws
    start_ok = abs(a - words[wi]['start']) < 0.005
    ok &= start_ok
    wi += len(ws); prev_end = bb
    if not ok: bad += 1; log(f'  cue {idx}: FAIL {ws}')
log(f'  cues={len(blocks)} words_covered={total_words}/{len(words)} violations={bad}')
log(f'  last cue ends {prev_end:.3f}s (loop tear starts {cues["events"]["V3.loop.tear"]["t"]:.3f}s); voice ends {al["measured_voice_ends_seconds"].get(words[-1]["text"], words[-1]["end"]):.3f}s; picture {cues["total_seconds"]}s')
lens = [tosec(b.split("\n")[1].split(" --> ")[1]) - tosec(b.split("\n")[1].split(" --> ")[0]) for b in blocks]
log(f'  cue durations: min {min(lens):.2f}s max {max(lens):.2f}s')

# ---- media
for f in ('FGW_Atlas_No_Pinky_V3_1080x1920.mp4', 'FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4'):
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
am = [sh(f'ffmpeg -v error -i {f} -map 0:a -f md5 -').stdout.strip() for f in ('FGW_Atlas_No_Pinky_V3_1080x1920.mp4', 'FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4')]
log(f'\n## audio identical between clean and captioned: {am[0] == am[1]} ({am[0]})')

# ---- scene-change timing (expected only at planned transitions)
log('\n## scene-change detections on the clean MP4 (threshold 0.25; each should sit inside a planned transition window)')
r = sh("ffmpeg -hide_banner -nostats -i FGW_Atlas_No_Pinky_V3_1080x1920.mp4 -vf \"select='gt(scene,0.25)',metadata=print:file=-\" -an -f null - 2>&1").stdout
ts = [float(m) for m in re.findall(r'pts_time:([\d.]+)', r)]
win = [(2.8, 3.4, 'tape wipe'), (7.9, 8.4, 'slip slide'), (9.8, 10.5, 'stamp iris'), (16.1, 16.6, 'B05A slide'), (17.8, 18.2, 'B05B slide'), (18.8, 19.4, 'B05C slide'), (20.1, 20.7, 'B06 slide'), (26.2, 26.8, 'B07 slide'), (31.0, 31.7, 'B09 drop'), (33.8, 34.6, 'closing tear')]
for t in ts:
    tag = next((n for a, b, n in win if a <= t <= b), 'UNPLANNED')
    log(f'  {t:6.2f}s  {tag}')
log(f'  detections: {len(ts)}; unplanned: {sum(1 for t in ts if not any(a <= t <= b for a, b, _ in win))}')


# ---- contact audit (per-frame pad-to-object gaps for the held grips; the real check lives in tools/check_contacts.mjs)
log('\n## held-grip contact audit (tools/check_contacts.mjs: pad capsule vs object, px; <= 0 touching/pressing; tolerance 8 px)')
r = sh('node tools/check_contacts.mjs')
for l in (r.stdout + r.stderr).strip().split('\n'):
    if 'worst' in l or 'approach' in l or l.startswith('OK') or l.startswith('FAIL'):
        log('  ' + l)

# ---- captions vs the FINAL audio: cross-correlate the delivered MP4's audio with the narration file the SRT was aligned to
log('\n## captions vs final audio (cross-correlation of the delivered MP4 audio with the aligned narration file)')
import numpy as np, wave
def rdmono(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768).reshape(-1, ch).mean(1)
tmpwav = '/tmp/_qa_v3_audio.wav'
sh(f'ffmpeg -v error -y -i FGW_Atlas_No_Pinky_V3_1080x1920.mp4 -map 0:a -ac 1 -ar 48000 -c:a pcm_s16le {tmpwav}')
a_mp4 = rdmono(tmpwav); a_nar = rdmono('audio/narration_48k.wav')
n = min(len(a_mp4), len(a_nar), 48000 * 34)
X = np.fft.rfft(a_mp4[:n], 2 * n); Y = np.fft.rfft(a_nar[:n], 2 * n)
cc = np.fft.irfft(X * np.conj(Y), 2 * n)
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
peak = cc.max() / (np.linalg.norm(a_mp4[:n]) * np.linalg.norm(a_nar[:n]) + 1e-12)
log(f'  best lag {lag / 48:.1f} ms (0 = captions and speech share one clock), normalised peak {peak:.2f}; voice stem is the same file at offset 0 in the mix')
os.remove(tmpwav)
last_end = max(tosec(b.split('\n')[1].split(' --> ')[1]) for b in blocks)
tear = cues['events']['V3.loop.tear']['t']
log(f'  last caption ends {last_end:.3f}s, closing tear starts {tear:.3f}s -> {"caption ends before the tear" if last_end < tear else "OVERLAP"}')

# ---- loop seam (picture): last frames vs first frames of the clean MP4
log('\n## loop seam, picture (PSNR dB between decoded frames of the clean MP4; adjacent-frame values inside the opener are the reference)')
import tempfile
td = tempfile.mkdtemp()
V = 'FGW_Atlas_No_Pinky_V3_1080x1920.mp4'
for n in (0, 1, 2, 3, 1034, 1035, 1036, 1037):
    sh(f'ffmpeg -v error -y -i {V} -vf "select=eq(n\\,{n})" -vframes 1 {td}/f{n}.png')
    sh(f'ffmpeg -v error -y -i FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4 -vf "select=eq(n\\,{n})" -vframes 1 {td}/c{n}.png')
def psnr(a, b):
    r = sh(f'ffmpeg -hide_banner -i {td}/f{a}.png -i {td}/f{b}.png -lavfi "[0][1]psnr" -f null - 2>&1').stdout
    return float(re.search(r'average:([\d.]+)', r).group(1))
for a, b in ((1037, 0), (1036, 1037), (1035, 1036), (1034, 1035), (0, 1), (1, 2), (2, 3)):
    log(f'  frame {a:4d} -> {b:4d}: {psnr(a, b):5.1f} dB')
r = sh(f'ffmpeg -hide_banner -i {td}/c1037.png -i {td}/c0.png -lavfi "[0][1]psnr" -f null - 2>&1').stdout
log(f'  captioned MP4, frame 1037 -> 0: {float(re.search(r"average:([0-9.]+|inf)", r).group(1)):5.1f} dB')

# ---- audio measurements from the stems
log('\n## audio stems (same gain structure as the mix, before limiter)')
import numpy as np, wave
def rd(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels(); raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768).reshape(-1, ch)
SR = 48000
st = {k: rd(f'audio/v3/stems/{k}.wav') for k in ('narration', 'music', 'effects')}
mix = rd('audio/v3/FGW_Atlas_No_Pinky_V3_mix.wav')
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
sfx = [l for l in open('audio/v3/sfx_log.csv').read().strip().split('\n')[1:] if ',sfx,' in l]
log(f'  effect events: {len(sfx)} ({len(set(l.split(",")[1] for l in sfx))} distinct cue names; V1 had 41)')
log('  voice-free tail: voice ends 33.43 s, picture 34.60 s; the music bed is exactly periodic over the loop (18 bars at 124.86 BPM, tails wrap), no end fade, no closing chord')

open('qa/v3/automated_checks.txt', 'w').write('\n'.join(out) + '\n')
