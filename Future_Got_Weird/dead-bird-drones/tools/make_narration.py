#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The words are production/NARRATION_V2.txt, verbatim. The take is used sample for sample: no gap edits, no time-stretch,
pitch or gain change (it is only padded with silence to the film length). Word times are measured on the master with
tools/align_zipformer.py (sherpa-onnx zipformer token times snapped to waveform onsets).

usage: python3 tools/make_narration.py
"""
import json, subprocess, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW

SR = 48000
FPS = 30
TAKE_ID = os.environ.get('FGW_TAKE', 't2_dTuc')
TAKE = f'audio/narration/takes/{TAKE_ID}.mp3'
MASTER = 'audio/narration/FGW_Dead_Bird_Drones_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '1.00'))   # silence after the last word: the loop seam before "If" restarts at 0.00 s
os.chdir(ROOT)

# caption chunks (2-5 words each, phrase level): (number of words, emphasised words: at most one word or short phrase)
CHUNKS = [(5, ['motor']), (4, ['dead', 'bird']), (4, []), (2, ['fly']),
          (3, ['drones']), (4, ['preserved']), (3, ['machinery']), (3, ['feathers']),
          (3, ['gearbox']), (4, ['spinning']), (3, ['flapping']),
          (3, ['goal']), (3, ['wildlife']), (3, ['disturbance']),
          (3, []), (3, ['swimming']), (4, ['duck']),
          (3, []), (3, ['watching']), (4, ['dead'])]
assert sum(c[0] for c in CHUNKS) == len(DW), (sum(c[0] for c in CHUNKS), len(DW))
assert all(2 <= c[0] <= 5 for c in CHUNKS)


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
    with open('captions/FGW_Dead_Bird_Drones_V1.srt', 'w') as f:
        for k, c in enumerate(caps):
            end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
            f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
    return tl


import numpy as np, soundfile as sf
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
tmp = 'audio/narration/_take48k.wav'
sf.write(tmp, y, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
os.remove(tmp)
A = json.load(open(ALIGN)); A['audio'] = MASTER; json.dump(A, open(ALIGN, 'w'), indent=1)
W = A['words']
tl = write_timeline(W)
pad = np.zeros(int(round(tl['duration'] * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_start_s': W[0]['start'], 'speech_end_s': W[-1]['end'], 'duration_s': tl['duration'], 'frames': tl['frames'],
                  'words': len(W), 'captions': len(tl['captions']), 'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
