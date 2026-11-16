#!/usr/bin/env python3
"""V2 narration master: take v2_t2_Om6V (ElevenLabs Test Voice, eleven_v4, stronger emphasis on AIM, CLICK, SHUT).
Edits are limited to shortening the silent gaps between phrases (each gap measured below -45 dBFS for >= 0.15 s):
the excess is removed from the quietest stretch inside the gap with a 12 ms equal-power crossfade. Every word is used
sample for sample (no stretch, pitch or gain change). The comic beat before "With their mouth SHUT" keeps 0.34 s.
Word times are then measured again on the edited master (tools/align_zipformer.py), not shifted by arithmetic."""
import json, subprocess, os, hashlib
import numpy as np, soundfile as sf
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(EP)
SR = 48000
TAKE = 'audio/narration/takes/v2_t2_Om6V.mp3'
A = json.load(open('audio/narration/takes/v2_t2_Om6V_words.json'))
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
words = A['words']
def next_word(t): return next(w['word'] for w in words if w['start'] >= t - 0.02)
TARGET, KEEP = 0.20, {'With': 0.34, 'Seriously.': 0.24}
lv = 20 * np.log10(np.abs(y) + 1e-9)
cuts = []  # (start_sample, n_remove)
for a, b in A['pauses']:
    nw = next_word(b)
    keep = KEEP.get(nw, TARGET)
    excess = (b - a) - keep
    if excess <= 0.01: continue
    # remove `excess` centred on the quietest 10 ms window of the gap's middle
    i0, i1 = int((a + 0.06) * SR), int((b - 0.06) * SR)
    n = int(excess * SR)
    seg = np.abs(y[i0:i1]); k = np.convolve(seg, np.ones(480) / 480, 'same')
    c = i0 + int(np.argmin(k)) if len(k) else (i0 + i1) // 2
    s0 = max(int(a * SR) + 600, min(c - n // 2, int(b * SR) - 600 - n))
    cuts.append((s0, n, round(b - a, 3), keep, nw))
out, prev = [], 0
X = int(0.012 * SR)
for s0, n, _, _, _ in cuts:
    out.append(y[prev:s0]); prev = s0 + n
out.append(y[prev:])
# join with equal-power crossfades
z = out[0]
for seg in out[1:]:
    t = np.linspace(0, np.pi / 2, X)
    z = np.concatenate([z[:-X], z[-X:] * np.cos(t) + seg[:X] * np.sin(t), seg[X:]])
DURATION = float(os.environ.get('FGW_DUR', '0'))
speech_end = len(z) / SR
os.makedirs('audio/narration', exist_ok=True)
tmp = 'audio/narration/_v2_tight.wav'
sf.write(tmp, z, SR, subtype='PCM_24')
subprocess.run(['python3', 'tools/align_zipformer.py', tmp, '/tmp/asr', 'audio/narration/v2_words.json'], check=True, capture_output=True)
W = json.load(open('audio/narration/v2_words.json'))['words']
DUR = round(np.ceil((W[-1]['end'] + 1.55) * 30) / 30, 4) if not DURATION else DURATION
N = int(round(DUR * SR))
z = np.concatenate([z, np.zeros(max(0, N - len(z)), np.float32)])[:N]
MASTER = 'audio/narration/FGW_MouthPad_narration_V2.wav'
sf.write(MASTER, z, SR, subtype='PCM_24'); os.remove(tmp)
tl = {'fps': 30, 'frames': int(round(DUR * 30)), 'duration': DUR, 'take': 'v2_t2_Om6V', 'words': W}
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)
span = W[-1]['end'] - W[0]['start']
print(json.dumps({'master': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'duration': DUR, 'frames': tl['frames'],
                  'speech': [W[0]['start'], W[-1]['end']], 'wpm': round(len(W) / span * 60, 1), 'removed_s': round(sum(c[1] for c in cuts) / SR, 2),
                  'gaps': [{'before': c[4], 'was': c[2], 'now': c[3]} for c in cuts]}, indent=1))
