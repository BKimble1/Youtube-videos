#!/usr/bin/env python3
"""Companion v3, step 2: place narration phrases on the film timeline (audio/companion_v3/plan.json).
A phrase is a run of words from one tightened block; it is cut at the middle of the pause before its first word and
after its last word (or at the block's own edges), (at most 0.14 s before / 0.24 s after), with 10 ms fades, and placed so its first word starts at `at`.
Writes source/public/companion3/narration.wav (48 kHz stereo) and source/src/data/companion3_words.json
(every word with film-time start/end and its phrase id). Fails if two phrases would overlap."""
import json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
A = os.path.join(ROOT, 'audio', 'companion_v3')
SR = 48000
PRE, POST = 0.14, 0.24
plan = json.load(open(os.path.join(A, 'plan.json')))['phrases']

def load(block):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(A, 'tight', block + '.wav'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy(), json.load(open(os.path.join(A, 'tight', block + '.json')))

cache = {}
out_words, spans = [], []
total = max(p[4] for p in plan) + 20
track = np.zeros(int(total * SR), np.float32)
for pid, block, i0, i1, at in plan:
    if block not in cache:
        cache[block] = load(block)
    x, meta = cache[block]
    W = meta['words']
    # cut in the pause before/after the phrase, but never more than PRE before its first word or POST after its last
    a = 0.0 if i0 == 0 else max((W[i0 - 1]['e'] + W[i0]['s']) / 2, W[i0]['s'] - PRE)
    b = len(x) / SR if i1 == len(W) - 1 else min((W[i1]['e'] + W[i1 + 1]['s']) / 2, W[i1]['e'] + POST)
    seg = x[int(a * SR):int(b * SR)].copy()
    n = int(0.010 * SR)
    seg[:n] *= np.linspace(0, 1, n); seg[-n:] *= np.linspace(1, 0, n)
    shift = at - W[i0]['s']
    t0 = a + shift
    spans.append((t0, b + shift, pid))
    track[int(t0 * SR):int(t0 * SR) + len(seg)] += seg
    for w in W[i0:i1 + 1]:
        out_words.append({'w': w['w'], 's': round(w['s'] + shift, 3), 'e': round(w['e'] + shift, 3), 'p': pid})
spans.sort()
for (a0, b0, p0), (a1, b1, p1) in zip(spans, spans[1:]):
    assert a1 >= b0 - 1e-3, f'{p0} ({a0:.2f}-{b0:.2f}) overlaps {p1} ({a1:.2f}-{b1:.2f})'
end = spans[-1][1]
track = track[:int((end + 0.5) * SR)]
os.makedirs(os.path.join(ROOT, 'source', 'public', 'companion3'), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', '-c:a', 'pcm_s16le',
                os.path.join(ROOT, 'source', 'public', 'companion3', 'narration.wav')], input=track.tobytes(), check=True)
json.dump({'words': out_words, 'phrases': [[p, round(a, 3), round(b, 3)] for a, b, p in spans]},
          open(os.path.join(ROOT, 'source', 'src', 'data', 'companion3_words.json'), 'w'))
for a, b, p in spans:
    print(f'{p:5s} {a:7.2f} - {b:7.2f}')
print(f'narration ends {end:.2f}s; {len(out_words)} words')
