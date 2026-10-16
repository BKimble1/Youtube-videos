#!/usr/bin/env python3
"""Companion v2, step 1: tighten the pauses in each chosen Test Voice take (no time-stretch, no pitch change) and
carry the independent Scribe word timings across.
Pauses are found with silencedetect (-38 dB, >=120 ms). Sentence-length pauses (>=0.33 s) become SENT s, shorter ones
at most COMMA s; each cut sits in the middle of the silence with a 12 ms crossfade.
Inputs: audio/companion_v2/picks.txt (take names in order), takes/<name>.mp3, scribe/picks_words.json (one Scribe pass
over all picks joined with 1.5 s gaps). Outputs: tight/<block>.wav (48 kHz mono) and tight/<block>.json (words with
times in the tightened file)."""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'companion_v2')
SR = 48000
SENT = float(os.environ.get('SENT', 0.38)); COMMA = float(os.environ.get('COMMA', 0.20))
XF = 0.012

def decode(path, sr):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

picks = open(os.path.join(ROOT, 'picks.txt')).read().split()
words = [w for w in json.load(open(os.path.join(ROOT, 'scribe', 'picks_words.json')))['words'] if w['type'] == 'word']
# block offsets inside the Scribe file: decoded lengths (44.1 kHz, as joined) + 1.5 s gaps
offs, t = [], 0.0
for p in picks:
    offs.append(t)
    t += len(decode(os.path.join(ROOT, 'takes', p + '.mp3'), 44100)) / 44100 + 1.5
offs.append(1e9)

for bi, p in enumerate(picks):
    block = p.split('_')[0]
    src = os.path.join(ROOT, 'takes', p + '.mp3')
    x = decode(src, SR)
    dur = len(x) / SR
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
        target = SENT if L >= 0.33 else min(L, COMMA)
        cut = L - target
        if cut <= 0.005:
            continue
        mid = (s + e) / 2
        a, b = mid - cut / 2, mid + cut / 2
        keep.append((cur, a)); tn += a - cur
        anchors.append((b, tn)); cur = b
    keep.append((cur, off)); tn += off - cur
    n = int(XF * SR)
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    pieces = []
    for i, (a, b) in enumerate(keep):
        seg = x[int(a * SR):int(b * SR)].copy()
        if i > 0: seg[:n] *= ramp
        if i < len(keep) - 1: seg[-n:] *= ramp[::-1]
        pieces.append(seg)
    y = np.concatenate(pieces)
    def remap(tt):
        k = max(i for i, (o, _) in enumerate(anchors) if o <= tt + 1e-6) if tt >= anchors[0][0] else 0
        return anchors[k][1] + (tt - anchors[k][0])
    bw = [{'w': w['text'], 's': round(remap(w['start'] - offs[bi]), 3), 'e': round(remap(w['end'] - offs[bi]), 3)}
          for w in words if offs[bi] - 0.3 <= w['start'] < offs[bi + 1] - 0.3]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le',
                    os.path.join(ROOT, 'tight', block + '.wav')], input=y.tobytes(), check=True)
    json.dump({'take': p, 'dur': round(len(y) / SR, 3), 'words': bw}, open(os.path.join(ROOT, 'tight', block + '.json'), 'w'), indent=0)
    print(f'{block}: {dur:.2f}s -> {len(y)/SR:.2f}s, {len(keep)-1} pauses tightened, {len(bw)} words, first {bw[0]["w"]}@{bw[0]["s"]}, last {bw[-1]["w"]}@{bw[-1]["e"]}')
