#!/usr/bin/env python3
"""Final narration: ElevenLabs take 2 (Test Voice, eleven_v4), resampled to 48 kHz mono, placed at +0.10 s so the
motor tug transient on frame 0 leads the first word, with three short silence extensions inside existing pauses
(scene changes that need a beat to register). No time-stretching, pitch or EQ change: every spoken sample is the take's.
Also writes the shifted word timeline, caption chunks (2-5 words) and the SRT.
Outputs: audio/narration/FGW_Living_Skin_narration_final.wav (48k/24-bit), source/public/audio/narration.wav,
         audio/narration/words_final.json, source/src/data/timeline.json, captions/FGW_Living_Skin.srt"""
import json, os, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TAKE = 'audio/narration/takes/take2.mp3'
LEAD = 0.10
# (time in the take, inserted seconds): each inside a measured pause of >= 0.40 s
INSERTS = [(9.76, 0.30),   # before "But an earlier experiment" (second hook: scene + sound texture change)
           (18.82, 0.20),  # before "Cells grew into the patch" (DAY 0 -> DAY 7 needs a readable beat)
           (21.80, 0.20)]  # before "The machine isn't alive"
TAIL = 0.72                # after "is": the cellular detail resolves into the surface, the smile restarts
FPS = 30

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
words = json.load(open(os.path.join(EP, 'audio/narration/takes/take2_words.json')))['words']
speech_end = words[-1]['end']

def shift(t):
    return t + LEAD + sum(d for at, d in INSERTS if t >= at)

parts, prev = [np.zeros(int(round(LEAD * SR)))], 0
for at, d in INSERTS:
    i = int(round(at * SR))
    seg = y[prev:i]
    assert np.abs(seg[-480:]).max() < 0.01, f'insert at {at} is not in silence'
    parts += [seg, np.zeros(int(round(d * SR)))]
    prev = i
end_i = int(round((speech_end + 0.06) * SR))
parts.append(y[prev:end_i])
out = np.concatenate(parts)
# short fade on the cut tail (after the measured end of "is"), then the tail of silence
f = int(0.06 * SR); out[-f:] *= np.linspace(1, 0, f)
total_s = shift(speech_end) + TAIL
frames = int(round(total_s * FPS)); total_s = frames / FPS
out = np.concatenate([out, np.zeros(int(round(total_s * SR)) - len(out))])
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'audio/narration/FGW_Living_Skin_narration_final.wav'), out, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'source/public/audio/narration.wav'), out, SR, subtype='PCM_24')

W = [dict(w, start=round(shift(w['start']), 3), end=round(shift(w['end']), 3)) for w in words]
for w in W: w.pop('db', None); w.pop('f0', None); w.pop('rel_db', None); w.pop('rel_f0', None)
json.dump({'take': TAKE, 'lead_s': LEAD, 'inserts': INSERTS, 'duration_s': total_s, 'frames': frames, 'words': W},
          open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

# caption chunks: (first word index, text, emphasis words shown in yellow)
CH = [("This robot's skin", []), ('is alive.', ['alive']), ('They grew it from', []), ('human cells…', ['human', 'cells']),
      ('then attached it', []), ('to a mechanical face', []), ('and made it smile.', []), ('Tiny anchors hold the skin', []),
      ('while motors pull underneath.', []), ('But an earlier experiment', []), ('gets stranger.', []),
      ('They cut living skin', []), ('on a robotic finger…', []), ('added a collagen patch…', []), ('and gave the tissue', []),
      ('seven days to repair.', ['seven', 'days']), ('Cells grew into the patch,', []), ('helping close the damage.', []),
      ('The machine isn’t alive.', []), ('But the skin', []), ('it’s wearing is.', [])]
caps, k = [], 0
for text, emph in CH:
    n = len(text.split())
    ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W), (k, len(W))
# display windows: hold to the next caption when the gap is short; never before the first word is heard
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.03), 3)
    c['hide'] = round(nxt - 0.03 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
cue = lambda word, n=1: [w for w in W if w['word'] == word][n - 1]['start']
TL = {'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}
json.dump(TL, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Living_Skin.srt'), 'w') as fh:
    for i, c in enumerate(caps):
        fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
