#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The approved words are production/NARRATION_LOCKED.txt, verbatim. The take is used whole and unedited: it reads in
24.5 s, inside the 24-27 s target, so no pause is shortened and no word is touched (no stretch, pitch or gain change).
Word times are measured on the take with the local Zipformer aligner (tools/align_zipformer.py). The aligner squeezes
the last three words into the final syllable, so those three are set from the waveform (energy and spectral centroid
at 20 ms: the /s/ of "soccer" from 23.62 s, the /b/ closure of "ball" at 23.92 s, the voice gone by 24.32 s).

usage: python3 tools/make_narration.py
"""
import json, subprocess, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW

SR = 48000
FPS = 30
TAKE_ID = os.environ.get('FGW_TAKE', 't1_Ldgt')
TAKE = f'audio/narration/takes/{TAKE_ID}.mp3'
MASTER = 'audio/narration/FGW_Ankle_Knee_narration.wav'
ALIGN = f'audio/narration/takes/{TAKE_ID}_zipformer.json'
# the loop tail after the last word: the approach to impact that frame 0 completes
TAIL = float(os.environ.get('FGW_TAIL', '0.68'))
FIX = {81: (23.38, 23.55), 82: (23.56, 23.62), 83: (23.62, 23.92), 84: (23.94, 24.32)}  # 1-based word index -> (start, end)
os.chdir(ROOT)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(5, ['ankle']), (4, ['working', 'knee']), (4, ['bone', 'cancer']), (6, ['remove']), (6, ['save', 'foot']),
          (7, ['halfway', 'around']), (6, ['thigh']), (6, ['pointing', 'behind']), (5, ['backward', 'ankle']),
          (7, ['same', 'way']), (4, ['woke']), (6, ['wiggle', 'toes']), (4, ['learned']), (5, ['new', 'leg']),
          (5, ['same', 'foot']), (4, ['soccer', 'ball'])]
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


def write_timeline(W):
    speech_end = W[-1]['end']
    duration = round(round((speech_end + TAIL) * FPS) / FPS, 3)
    caps = captions(W, duration)
    tl = {'fps': FPS, 'frames': int(round(duration * FPS)), 'duration': duration, 'take': TAKE_ID, 'captions': caps, 'words': W}
    os.makedirs('source/src/data', exist_ok=True)
    json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

    def ts(t):
        ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    os.makedirs('captions', exist_ok=True)
    with open('captions/FGW_Ankle_Knee.srt', 'w') as f:
        for k, c in enumerate(caps):
            end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
            f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
    return tl


import numpy as np, soundfile as sf
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
if not os.path.exists(ALIGN):
    subprocess.run([sys.executable, 'tools/align_zipformer.py', TAKE, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
assert [w['word'] for w in W] == DW
for k, (a, b) in FIX.items():
    W[k - 1]['start'], W[k - 1]['end'] = a, b
tl = write_timeline(W)
pad = np.zeros(int(round(tl['duration'] * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_end_s': W[-1]['end'], 'duration_s': tl['duration'], 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
