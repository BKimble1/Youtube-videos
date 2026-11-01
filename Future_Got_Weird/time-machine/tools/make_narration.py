#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The take runs 20.2 s and the brief asks for a 22-25 s Short whose picture needs room for the black-hole reveal, the
family reveal and the loop. So the only edit is to LENGTHEN some of the silent gaps between sentences (measured below
-45 dBFS): digital silence is inserted in the middle of each silent run with a 12 ms equal-power crossfade. Every word
is used sample for sample: no time-stretch, no pitch or gain change, no words added, removed or reordered.
Word times are re-measured on the edited master (tools/align_zipformer.py), not shifted.
"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t2_aRMY.mp3'
ALIGN_TAKE = 'audio/narration/takes/t2_aRMY_zipformer.json'
MASTER = 'audio/narration/FGW_TimeMachine_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
LEAD = 0.15                                   # the time-warp hit lands on frame 0, the first word just after it
TAIL = 1.52                                   # room for the black hole to become the opening frame
# extra silence (s) added to the pause that ends before each word
ADD = {"You'd": 0.25, 'But': 0.25, 'And': 0.30, 'Your': 0.35, 'Because': 0.60, 'You': 0.35}
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
A = json.load(open(ALIGN_TAKE))
W0 = A['words']

def next_word(t):
    return next(w for w in W0 if w['start'] >= t - 0.02)

X = int(0.012 * SR)
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
pieces, cur, log = [], 0, []
for a, b in A['pauses']:
    nw = next_word(b)['word'].strip(',.')
    # 'Your' and 'You' occur more than once: only the sentence starts after a full stop get air
    prev = [w for w in W0 if w['end'] <= a + 0.02][-1]['word']
    if nw not in ADD or not prev.endswith('.'):
        continue
    mid = int((a + b) / 2 * SR)
    pieces.append(y[cur:mid]); cur = mid
    pieces.append(np.zeros(int(ADD[nw] * SR), np.float32))
    log.append({'before_word': nw, 'gap_s': round(b - a, 3), 'added_s': ADD[nw]})
pieces.append(y[cur:])
out = pieces[0].copy()
for p in pieces[1:]:
    p = p.copy()
    if len(p) > X and len(out) > X:
        out[-X:] = out[-X:] * (1 - fi) + p[:X] * fi
        out = np.concatenate([out, p[X:]])
    else:
        out = np.concatenate([out, p])
out = np.concatenate([np.zeros(int(LEAD * SR), np.float32), out])
tmp = 'audio/narration/_edited_take.wav'
sf.write(tmp, out, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(9, ['black', 'hole']), (6, ['future']), (9, ['one', 'hour']), (4, ['earth']), (4, ['years']),
          (5, ['returned']), (5, ['old']), (6, ['gone']), (7, ['space']), (4, ['time'])]
assert sum(c[0] for c in CHUNKS) == len(W), (sum(c[0] for c in CHUNKS), len(W))
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.6, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
os.remove(tmp)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
os.makedirs('captions', exist_ok=True)
with open('captions/FGW_TimeMachine_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'edited_s': round(len(out) / SR, 3), 'gap_edits': log, 'added_total_s': round(sum(g['added_s'] for g in log), 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W)}, indent=1))
