#!/usr/bin/env python3
"""V6 narration for Glass Climbing: the channel narrator (ElevenLabs "Test Voice", kk5XaSLo2XAw0sKM98zU, eleven_v4),
regenerated on 26 Oct 2026 with the approved words verbatim (audio/narration/voice_provenance.json, "v6"). Take 2
(y6pd) is used as generated: decoded to 48 kHz mono, speech at 0 s, nothing cut, stretched or pitch-shifted; a tail
is added after the last word for the fall and the catch. The file is force-aligned (tools/align.py) and the caption
phrases are written from the measured words.
Outputs: audio/narration/FGW_Glass_Climbing_narration_v6.wav (48k/24-bit), audio/narration/words_v6.json,
         source/src/data/timeline_v6.json, captions/FGW_Glass_Climbing_V6.srt"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from script import LOCKED, norm
from align import timeline

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/v6_t2_y6pd.mp3'
TAIL = 1.5  # after "contact": the fall and the catch on the glass

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
tmp = os.path.join(EP, 'audio/narration/takes/v6_t2_y6pd_48k.wav')
sf.write(tmp, y, SR, subtype='PCM_24')
tl = timeline(tmp)
W = tl['words']
speech_end = W[-1]['end']
end_i = min(len(y), int(round((speech_end + 0.15) * SR)))
y3 = y[:end_i].copy()
f = int(0.06 * SR); y3[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
y3 = np.concatenate([y3, np.zeros(int(round(total_s * SR)) - len(y3))])
sf.write(os.path.join(EP, 'audio/narration/FGW_Glass_Climbing_narration_v6.wav'), y3, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'edits_removed_s': [], 'duration_s': total_s, 'frames': frames,
           'pocketsphinx_transcript': tl['pocketsphinx_transcript'], 'words': W}, open(os.path.join(EP, 'audio/narration/words_v6.json'), 'w'), indent=1)

# Caption phrases: the approved narration in short spoken chunks (text exactly as approved, in order).
CH = [('If you pressed these pads', ['pads']), ('against a glass wall,', ['glass']), ('you could lift your feet', ['lift', 'feet']), ('off the ground—', []),
      ('and climb it like Spider-Man.', ['spiderman']),
      ('Their surfaces are covered', []), ('in microscopic wedges.', ['microscopic', 'wedges']),
      ('As you pull downward,', ['downward']), ('the wedges bend flat', ['flat']), ('against the glass.', []),
      ('This brings them so close', ['close']), ('that tiny molecular attractions', ['molecular']), ('can hold your entire weight.', ['entire', 'weight']),
      ('Special springs spread the load,', ['springs']), ('so one little patch', ['patch']), ('doesn’t have to hold you up alone.', ['alone']),
      ('Then, you shift your weight', ['shift']), ('onto the other pad.', []), ('The first releases,', ['releases']), ('letting you reach', []), ('higher and repeat.', ['higher']),
      ('But there’s a catch.', ['catch']),
      ('They need a smooth surface', ['smooth']), ('to grip.', []),
      ('So you can climb glass—', ['glass']), ('but switch to rough brick,', ['rough', 'brick']), ('and those microscopic wedges', []), ('can’t make the same contact.', ['contact'])]
assert ''.join(t for t, _ in CH).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''), 'captions must be the approved narration verbatim'
assert norm(' '.join(t for t, _ in CH)) == [w['word'] for w in W]
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text)); ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline_v6.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Glass_Climbing_V6.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
