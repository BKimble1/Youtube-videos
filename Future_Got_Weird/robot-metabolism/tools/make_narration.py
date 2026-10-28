#!/usr/bin/env python3
"""Robot Metabolism narration: the channel narrator (ElevenLabs "Test Voice", kk5XaSLo2XAw0sKM98zU, eleven_v4), one
take (audio/narration/takes/t1_sFSG.mp3, kept untouched). Edits, all in digital silence (no word touched, no stretch or
pitch change):
  * 30 ms of empty lead-in removed (the first consonant starts at ~40 ms);
  * the pause after "beside it…" shortened by removing 0.12 s from the middle of its silence (10 ms crossfades), so the
    hesitation before "could" is ~0.2 s;
  * a 0.8 s tail after "part" for the final image to read.
The edited file is re-aligned (tools/align.py) and caption phrases are built from the measured words.
Outputs: audio/narration/FGW_Robot_Metabolism_narration_V1.wav (48 kHz/24-bit mono), audio/narration/words_V1.json,
         source/src/data/timeline.json, captions/FGW_Robot_Metabolism_V1.srt"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, norm
from align import timeline

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_sFSG.mp3'
LEAD_CUT = 0.03
CUTS = [(23.27, 23.39)]      # seconds in the raw take: silence between "it…" and "could"
TAIL = 0.8

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
xf = int(0.01 * SR)
for a, b in sorted(CUTS, reverse=True):
    i, j = int(a * SR), int(b * SR)
    seg = y[i - xf:i] * np.linspace(1, 0, xf) + y[j - xf:j] * np.linspace(0, 1, xf)   # silence either side
    y = np.concatenate([y[:i - xf], seg, y[j:]])
y = y[int(LEAD_CUT * SR):]
tmp = os.path.join(EP, 'audio/narration/takes/t1_sFSG_edited.wav')
sf.write(tmp, y, SR, subtype='PCM_24')
tl = timeline(tmp)
W = tl['words']
speech_end = W[-1]['end']
end_i = min(len(y), int(round((speech_end + 0.15) * SR)))
y3 = y[:end_i].copy()
f = int(0.06 * SR); y3[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
y3 = np.concatenate([y3, np.zeros(int(round(total_s * SR)) - len(y3))])
out_wav = os.path.join(EP, 'audio/narration/FGW_Robot_Metabolism_narration_V1.wav')
sf.write(out_wav, y3, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'lead_cut_s': LEAD_CUT, 'removed_silence_raw_s': CUTS, 'duration_s': total_s, 'frames': frames,
           'speech': tl['speech'], 'wpm': tl['wpm'], 'pocketsphinx_transcript': tl['pocketsphinx_transcript'],
           'pocketsphinx_wer_vs_locked': tl['pocketsphinx_wer_vs_approved'], 'words': W},
          open(os.path.join(EP, 'audio/narration/words_V1.json'), 'w'), indent=1)

# Caption phrases: the locked narration in short spoken chunks (text exactly as locked, in order).
CH = [('This robot uses other robots', ['other', 'robots']), ('as spare body parts.', ['spare', 'body', 'parts']),
      ('It’s built from motorized rods', []), ('that stretch and shrink,', []), ('with magnets at their ends.', ['magnets']),
      ('A person controls the movements,', []), ('guiding another rod into place.', []),
      ('Once it connects,', []), ('that extra piece', []), ('becomes a walking stick,', ['walking', 'stick']),
      ('helping the robot', []), ('move faster downhill.', []),
      ('And if a part stops working,', []), ('it can drop it', []), ('and attach a replacement.', ['replacement']),
      ('So that broken robot beside it…', []), ('could become its next body part.', ['body', 'part'])]
assert ''.join(t for t, _ in CH).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''), 'captions must be the locked narration verbatim'
assert norm(' '.join(t for t, _ in CH)) == [w['word'] for w in W]
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text)); ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end'], 'w0': k - n})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W},
          open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Robot_Metabolism_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}; {tl["wpm"]} wpm')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
