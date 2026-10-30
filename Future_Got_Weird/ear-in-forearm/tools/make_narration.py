#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.
The take's speech is untouched (no splice inside a word, no time-stretch, no pitch or gain change). Two edits, both
in the take's own digital silence:
  - the 66 ms of silence before "Doctors" is trimmed to 10 ms, so the first word starts on frame one;
  - the sentence gap after "nerves." is lengthened by 0.30 s (0.41 -> 0.71 s): the beat where the finished ear is
    revealed on her head, before the last line. Every other pause is left as spoken.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets). One fix by waveform:
the aligner put "it." after the pause that follows it; "around it." is one run of speech (11.40-11.86 s in the take).
usage: python3 tools/make_narration.py"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t2_irmO.mp3'
ALIGN = 'audio/narration/takes/t2_irmO_zipformer.json'
LEAD_KEEP = 0.010
GAP_AFTER = {'nerves.': 0.30}
TAIL = float(os.environ.get('FGW_TAIL', '0.80'))  # after the last word: the push back into the opening composition
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
words = [dict(w) for w in json.load(open(ALIGN))['words']]
# the aligner's one mistake (see docstring)
k = next(i for i, w in enumerate(words) if w['word'] == 'around')
assert words[k + 1]['word'] == 'it.'
words[k]['end'] = 11.66
words[k + 1]['start'], words[k + 1]['end'] = 11.66, 11.86

onset = int(np.argmax(np.abs(y) > 10 ** (-50 / 20)))
lead = max(0, onset - int(LEAD_KEEP * SR))
assert np.abs(y[:lead]).max() < 10 ** (-60 / 20)
z = y[lead:]
shift0 = lead / SR
inserts = []  # (take time, seconds inserted)
for w in words:
    if w['word'] in GAP_AFTER:
        at = w['end'] + 0.15  # inside the gap, well clear of the word's decay
        seg = y[int(at * SR) - 2400:int(at * SR) + 2400]
        assert 20 * np.log10(np.abs(seg).max() + 1e-12) < -60, w
        inserts.append((at, GAP_AFTER[w['word']]))
for at, d in sorted(inserts, reverse=True):
    i = int(round((at - shift0) * SR))
    z = np.concatenate([z[:i], np.zeros(int(round(d * SR)), np.float32), z[i:]])

def move(t):
    return round(t - shift0 + sum(d for at, d in inserts if t > at), 3)
W = [{'word': w['word'], 'start': max(0.0, move(w['start'])), 'end': move(w['end'])} for w in words]
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(4, ['ear']), (4, ['forearm']), (7, []), (5, []), (5, ['rib', 'cartilage']), (7, []), (7, []), (2, []), (8, []), (6, []),
          (3, ['months']), (6, ['here'])]
assert sum(c[0] for c in CHUNKS) == len(W), (sum(c[0] for c in CHUNKS), len(W))
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
os.makedirs('audio/narration', exist_ok=True)
wav = 'audio/narration/FGW_Ear_Forearm_narration_V1.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'lead_trim_s': round(shift0, 4), 'inserted_silence': [{'take_t': a, 'seconds': d} for a, d in inserts], 'words': W},
          open('audio/narration/FGW_Ear_Forearm_V1_words.json', 'w'), indent=1)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
os.makedirs('captions', exist_ok=True)
with open('captions/FGW_Ear_Forearm_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3), 'lead_trim_s': round(shift0, 4),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
