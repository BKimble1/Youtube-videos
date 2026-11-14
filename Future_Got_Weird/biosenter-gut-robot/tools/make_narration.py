#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.
The approved words are production/NARRATION_LOCKED.txt, verbatim. The take is used sample for sample (no gap edits,
no time-stretch, pitch or gain change); it is only padded with silence to the film length. Word times are measured on
the take itself (tools/align_zipformer.py).
usage: python3 tools/make_narration.py"""
import json, subprocess, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW
import numpy as np, soundfile as sf

SR, FPS = 48000, 30
TAKE_ID = os.environ.get('FGW_TAKE', 't1_zFXV')
TAKE = f'audio/narration/takes/{TAKE_ID}.mp3'
MASTER = 'audio/narration/FGW_BIOSENTER_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
LEAD = 0.0     # speech starts at frame 0: the hook is the first word
TAIL = 0.94    # after the last word, the robot crawls into the lens and the loop closes
os.chdir(ROOT)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(4, []), (5, ['crawls']), (6, ['tiny', 'spikes']), (6, []), (5, ['grip']), (3, ['inflatable']), (3, []),
          (4, ['snake']), (5, ['pigs']), (4, []), (5, ['six', 'feet']), (6, ['tissue']), (3, ['liquid']),
          (3, ['experimental']), (3, []), (5, ['gut']), (6, ['crawling'])]
assert sum(c[0] for c in CHUNKS) == len(DW), (sum(c[0] for c in CHUNKS), len(DW))


def captions(W, duration):
    caps, i = [], 0
    for nw, emph in CHUNKS:
        ws = W[i:i + nw]; i += nw
        caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
    for c in caps:
        c['show'] = round(max(0.0, c['start'] - 0.04), 3)
    for k, c in enumerate(caps):
        nxt = caps[k + 1]['show'] if k + 1 < len(caps) else duration
        c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)
    return caps


y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
subprocess.run([sys.executable, 'tools/align_zipformer.py', TAKE, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
for w in W:
    w['start'] = round(w['start'] + LEAD, 3); w['end'] = round(w['end'] + LEAD, 3)
duration = round(round((W[-1]['end'] + TAIL) * FPS) / FPS, 3)
frames = int(round(duration * FPS))
caps = captions(W, duration)
tl = {'fps': FPS, 'frames': frames, 'duration': duration, 'take': TAKE_ID, 'captions': caps, 'words': W}
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)


def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_BIOSENTER_Gut_Robot_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
pad = np.zeros(int(round(duration * SR)), np.float32)
n0 = int(LEAD * SR)
pad[n0:n0 + len(y)] = y[:len(pad) - n0]
sf.write(MASTER, pad, SR, subtype='PCM_24')
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_end_s': W[-1]['end'], 'duration_s': duration, 'frames': frames, 'words': len(W)}, indent=1))
