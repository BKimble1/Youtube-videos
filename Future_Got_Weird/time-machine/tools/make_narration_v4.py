#!/usr/bin/env python3
"""V4 take -> narration master (48 kHz, 24-bit, mono), word timeline (source/src/data/timeline_v4.json), SRT.

The V4 take is a new ElevenLabs read of the same locked words (same voice, a little more energy). The only edit TIGHTENS
silent gaps between phrases that run longer than the pacing needs (measured below -45 dBFS): samples are removed from
the middle of each over-long silent run with a 12 ms equal-power crossfade. Every word is used sample for sample: no
time-stretch, no pitch or gain change, no words added, removed or reordered. Word times are re-measured on the edited
master (tools/align_zipformer.py), not shifted.
usage: python3 tools/make_narration_v4.py <take.mp3|wav>"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = sys.argv[1]
MASTER = 'audio/narration/FGW_TimeMachine_narration_V4.wav'
ALIGN = 'audio/narration/master_v4_zipformer.json'
ASR_ROOT = os.environ.get('ASR_ROOT', '/tmp/asr')
LEAD = 0.12                                   # the first word just after frame 0
TAIL = 1.40                                   # the loop: the push into the watch, the cut, the pull-back to frame 0
# the longest silence (s) allowed before each sentence start (after a full stop); the reveals keep a beat more air
MAX_GAP = {"You'd": 0.42, 'But': 0.48, 'And': 0.52, 'Your': 0.55, 'Because': 0.62, 'You': 0.50}
MAX_COMMA = 0.30                              # inside a sentence
os.chdir(ROOT)

def load(path):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                        capture_output=True, check=True).stdout, np.float32).copy()

y = load(TAKE)
tmp_al = 'audio/narration/_v4_take_align.json'
subprocess.run([sys.executable, 'tools/align_zipformer.py', TAKE, ASR_ROOT, tmp_al], check=True, capture_output=True)
A = json.load(open(tmp_al)); os.remove(tmp_al)
W0 = A['words']

X = int(0.012 * SR)
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
cuts, log = [], []
for a, b in A['pauses']:
    after = [w for w in W0 if w['start'] >= b - 0.05]
    before = [w for w in W0 if w['end'] <= a + 0.05]
    if not after or not before:
        continue
    nw, prev = after[0]['word'].strip(',.'), before[-1]['word']
    cap = MAX_GAP.get(nw, 0.45) if prev.endswith('.') else MAX_COMMA
    gap = b - a
    if gap <= cap:
        continue
    rm = gap - cap
    mid = (a + b) / 2
    cuts.append((int((mid - rm / 2) * SR), int((mid + rm / 2) * SR)))
    log.append({'before_word': nw, 'gap_s': round(gap, 3), 'removed_s': round(rm, 3)})
pieces, cur = [], 0
for s0, s1 in cuts:
    pieces.append(y[cur:s0]); cur = s1
pieces.append(y[cur:])
out = pieces[0].copy()
for p in pieces[1:]:
    p = p.copy()
    if len(p) > X and len(out) > X:
        out[-X:] = out[-X:] * (1 - fi) + p[:X] * fi
        out = np.concatenate([out, p[X:]])
    else:
        out = np.concatenate([out, p])
# trim the take's own leading silence to LEAD
lead_now = W0[0]['start']
out = out[max(0, int((lead_now - 0.02) * SR)):]
out = np.concatenate([np.zeros(int(LEAD * SR), np.float32), out])
tmp = 'audio/narration/_edited_take_v4.wav'
sf.write(tmp, out, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, ASR_ROOT, ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

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
# the last caption leaves before the push into the watch completes (the loop frame is text-free until the fade-in)
caps[-1]['hide'] = round(min(caps[-1]['hide'], speech_end + 0.45), 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
os.remove(tmp)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
json.dump(tl, open('source/src/data/timeline_v4.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
os.makedirs('captions', exist_ok=True)
with open('captions/FGW_TimeMachine_V4.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'take': TAKE, 'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'edited_s': round(len(out) / SR, 3), 'gap_edits': log, 'removed_total_s': round(sum(g['removed_s'] for g in log), 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W)}, indent=1))
