#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.
The brief asks for a continuous, urgent read without extended pauses. The take's speech is untouched (no splice inside
a word, no time-stretch, no pitch or gain change); only the long silent gaps between phrases are shortened, by removing
the middle of each gap (the removed audio is below -45 dBFS, the take's own room silence), with a 10 ms crossfade:
  after a sentence (. ) -> at most 0.28 s; after a dash beat (…) -> at most 0.24 s; 'DIES…' keeps 0.34 s (the death
  needs a beat of stillness); 'leaf…' 0.30 s (the turn into the reveal). Comma pauses are left as spoken.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets), shifted by the removed
silence. ElevenLabs Scribe's timings of the same take are kept as a cross-reference (they lag up to ~0.4 s)."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t1_aaJ0.mp3'
ALIGN = 'audio/narration/takes/t1_aaJ0_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.42'))  # after the last word: the push through the leaf into the loop
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
al = json.load(open(ALIGN))
words = al['words']

def cap_for(w):
    if w.startswith('DIES'): return 0.34
    if w.startswith('leaf'): return 0.30
    if w.endswith('.'): return 0.28
    if w.endswith('…'): return 0.24
    return None
# each gap between consecutive words that is a measured pause
cuts = []  # (t0, t1) in take time, removed
for k in range(len(words) - 1):
    a, b = words[k]['end'], words[k + 1]['start']
    c = cap_for(words[k]['word'])
    if c is None or b - a <= c: continue
    seg = y[int(a * SR):int(b * SR)]
    peak = 20 * np.log10(np.abs(seg).max() + 1e-9)
    rms_db = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
    assert rms_db < -45, (words[k]['word'], rms_db)
    m = (a + b) / 2
    cuts.append((round(m - (b - a - c) / 2, 4), round(m + (b - a - c) / 2, 4), words[k]['word'], round(b - a, 3), c, round(float(peak), 1)))

XF = int(0.010 * SR)
out, last = [], 0
for t0, t1, *_ in cuts:
    i0, i1 = int(t0 * SR), int(t1 * SR)
    out.append(y[last:i0 - XF])
    fade = np.linspace(0, 1, 2 * XF, dtype=np.float32)
    out.append(y[i0 - XF:i0 + XF] * (1 - fade) + y[i1 - XF:i1 + XF] * fade)
    last = i1 + XF
out.append(y[last:])
z = np.concatenate(out)

def shift(t):
    s = 0.0
    for t0, t1, *_ in cuts:
        if t >= t1: s += t1 - t0
        elif t > t0: s += t - t0
    return round(t - s, 3)
W = [{'word': w['word'], 'start': shift(w['start']), 'end': shift(w['end'])} for w in words]
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(7, ['ant']), (7, ['zombie']), (4, []), (4, []), (5, ['muscles']), (5, []), (4, ['climb']), (5, []), (4, ['go']), (3, ['dies']),
          (7, ['started']), (6, []), (4, []), (5, ['head']), (5, []), (3, []), (4, ['below']), (5, []), (6, []), (6, [])]
assert sum(c[0] for c in CHUNKS) == len(W), sum(c[0] for c in CHUNKS)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(z), len(pad))] = z[:len(pad)]
wav = 'audio/narration/FGW_Zombie_Ant_narration_V1.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'removed_silence': [{'from': c[0], 'to': c[1], 'after': c[2], 'gap_was': c[3], 'gap_now': c[4], 'peak_dbfs': c[5]} for c in cuts], 'words': W},
          open('audio/narration/FGW_Zombie_Ant_V1_words.json', 'w'), indent=1)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Zombie_Ant_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3), 'removed_s': round(sum(c[1] - c[0] for c in cuts), 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1), 'gaps': [(c[2], c[3], c[4]) for c in cuts]}, indent=1))
