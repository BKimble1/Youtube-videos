#!/usr/bin/env python3
"""Emphasis and pace report for a narration take: loudness of the punch words against the take's mean word,
their pitch and length, the speech span, wpm and pauses. usage: tools/emphasis.py <audio> <words.json>"""
import json, sys, subprocess, numpy as np
SR = 48000
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
W = json.load(open(sys.argv[2])); words, P = W['words'], W['pauses']
def rms(a, b): s = y[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9)
def f0(a, b):
    s = y[int(a * SR):int(b * SR)]; n = 1920
    if len(s) < n + 10: return 0
    best, bi = 0, 0
    for i in range(0, len(s) - n, 480):
        e = (s[i:i + n] ** 2).sum()
        if e > best: best, bi = e, i
    x = s[bi:bi + n] - s[bi:bi + n].mean(); ac = np.correlate(x, x, 'full')[n - 1:]
    lo, hi = int(SR / 400), int(SR / 70); return SR / (lo + np.argmax(ac[lo:hi]))
mean = np.mean([rms(w['start'], w['end']) for w in words])
out = {}
for k in ['THIS', 'TONGUE.', 'AIM.', 'CLICK.', 'SEE', 'SHUT.']:
    w = [w for w in words if w['word'] == k][0]
    out[k] = {'rel_db': round(float(rms(w['start'], w['end']) - mean), 1), 'f0': int(f0(w['start'], w['end'])), 'dur': round(w['end'] - w['start'], 2)}
span = words[-1]['end'] - words[0]['start']
print(json.dumps({'emphasis': out, 'span_s': round(span, 2), 'wpm': round(len(words) / span * 60, 1), 'pause_total_s': round(sum(b - a for a, b in P), 2), 'max_pause': round(max(b - a for a, b in P), 2)}))
