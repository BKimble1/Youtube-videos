#!/usr/bin/env python3
"""Rocket Short: tighten the pauses in one Test Voice take and carry its word timings across.
No time-stretch. Pauses are found with silencedetect (-38 dB, >= 120 ms): sentence-length pauses (>= 0.30 s) become SENT s,
shorter ones at most COMMA s; each cut sits mid-silence with a 12 ms crossfade, so breaths at the edges of a pause stay.
usage: tighten_rocket.py <take.mp3> <scribe_words.json> <out_basename>   env: SENT (0.27), COMMA (0.15)
Outputs: audio/rocket/tight/<out>.wav (48 kHz mono) and audio/rocket/tight/<out>.json (words, times in the tightened file)."""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'rocket')
SR = 48000
SENT = float(os.environ.get('SENT', 0.27)); COMMA = float(os.environ.get('COMMA', 0.15))
XF = 0.012
src, words_path, out = sys.argv[1:4]

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
dur = len(x) / SR
d = json.load(open(words_path))
words = [w for w in (d['words'] if isinstance(d, dict) else d) if w.get('type', 'word') == 'word' and not w['text'].startswith('[')]
sil = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', sil)]
en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', sil)]
env = np.convolve(np.abs(x), np.ones(480) / 480, 'same')
thr = 10 ** (-38 / 20)
on = max(0.0, np.argmax(env > thr) / SR - 0.02)
off = min(dur, (len(env) - np.argmax(env[::-1] > thr)) / SR + 0.06)
keep, anchors, cur, tn = [], [(on, 0.0)], on, 0.0
for s, e in zip(st, en):
    if s <= on + 0.02 or e >= off - 0.02:
        continue
    L = e - s
    target = SENT if L >= 0.30 else min(L, COMMA)
    cut = L - target
    if cut <= 0.005:
        continue
    mid = (s + e) / 2
    a, b = mid - cut / 2, mid + cut / 2
    keep.append((cur, a)); tn += a - cur
    anchors.append((b, tn)); cur = b
keep.append((cur, off)); tn += off - cur
n = int(XF * SR)
rmp = np.linspace(0, 1, n, dtype=np.float32)
pieces = []
for i, (a, b) in enumerate(keep):
    seg = x[int(a * SR):int(b * SR)].copy()
    if i > 0: seg[:n] *= rmp
    if i < len(keep) - 1: seg[-n:] *= rmp[::-1]
    pieces.append(seg)
y = np.concatenate(pieces)

def remap(t):
    k = max(i for i, (o, _) in enumerate(anchors) if o <= t + 1e-6) if t >= anchors[0][0] else 0
    return anchors[k][1] + (t - anchors[k][0])

bw = [{'w': w['text'], 's': round(max(0, remap(w['start'])), 3), 'e': round(remap(w['end']), 3)} for w in words]
os.makedirs(os.path.join(ROOT, 'tight'), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le',
                os.path.join(ROOT, 'tight', out + '.wav')], input=y.tobytes(), check=True)
json.dump({'take': os.path.basename(src), 'dur': round(len(y) / SR, 3), 'sent': SENT, 'comma': COMMA, 'words': bw},
          open(os.path.join(ROOT, 'tight', out + '.json'), 'w'), indent=0)
span = bw[-1]['e'] - bw[0]['s']
print(f'{out}: {dur:.2f}s -> {len(y) / SR:.2f}s, {len(keep) - 1} pauses tightened, {len(bw)} words, {60 * len(bw) / span:.0f} wpm over {span:.2f}s')
