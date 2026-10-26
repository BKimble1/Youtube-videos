#!/usr/bin/env python3
"""Lightning Laser narration: the channel narrator (ElevenLabs "Test Voice", kk5XaSLo2XAw0sKM98zU, eleven_v4), take 1
(gUxd) used as generated: decoded to 48 kHz mono, nothing cut, stretched or pitch-shifted; zero-padded to a whole
number of frames (1005 at 30 fps = 33.50 s). The file is force-aligned (tools/align.py) and the caption phrases are
written from the measured words.
Outputs: audio/narration/FGW_Lightning_Laser_narration.wav (48k/24-bit), audio/narration/words.json,
         source/src/data/timeline.json, captions/FGW_Lightning_Laser_V1.srt"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, norm
from align import timeline

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/ll_t1_gUxd.mp3'
FRAMES = 1005

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
total_s = FRAMES / FPS
assert len(y) <= int(round(total_s * SR)), 'the take must fit in the film (never cut)'
y = np.concatenate([y, np.zeros(int(round(total_s * SR)) - len(y))])
out = os.path.join(EP, 'audio/narration/FGW_Lightning_Laser_narration.wav')
sf.write(out, y, SR, subtype='PCM_24')
tl = timeline(out)
W = tl['words']
json.dump({'take': TAKE, 'edits': 'none (zero padding after the take only)', 'duration_s': total_s, 'frames': FRAMES,
           'pocketsphinx_transcript': tl['pocketsphinx_transcript'], 'words': W}, open(os.path.join(EP, 'audio/narration/words.json'), 'w'), indent=1)

# Caption phrases: the approved narration in short spoken chunks (text exactly as approved, in order).
CH = [('They fired a laser', ['laser']), ('into a thunderstorm—', ['thunderstorm']), ('and the lightning followed it.', ['followed']),
      ('You see, air normally resists', ['resists']), ('the flow of electricity.', []),
      ('But this machine fired', ['machine']), ('a thousand laser pulses', ['thousand']), ('every second,', []),
      ('stripping electrons', ['electrons']), ('from air molecules', ['molecules']), ('and heating a narrow channel', ['heating']), ('through the sky.', []),
      ('That gave electricity', []), ('an easier path to travel.', ['easier', 'path']),
      ('So when lightning erupted upward', ['upward']), ('from a nearby tower,', ['tower']), ('part of the bolt', []), ('followed that channel', ['channel']),
      ('for over 160 feet.', ['160', 'feet']),
      ('A normal lightning rod', ['rod']), ('only reaches as high', []), ('as its metal tip.', ['tip']),
      ('But these scientists extended one', ['extended']), ('into the sky—', ['sky']),
      ('using the air itself.', ['air', 'itself'])]
assert ''.join(t for t, _ in CH).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''), 'captions must be the approved narration verbatim'
assert norm(' '.join(t for t, _ in CH)) == [w['word'] for w in W]
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text)); ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else None
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    if nxt is None:  # the last phrase clears just before the loop seam, so the opening phrase appears on a clean frame
        c['hide'] = round(min(total_s - 0.1, c['end'] + 0.25), 3)
    else:
        c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
json.dump({'fps': FPS, 'frames': FRAMES, 'duration': total_s, 'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Lightning_Laser_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({FRAMES} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
