#!/usr/bin/env python3
"""Final narration for Glass Climbing.

The channel voice (ElevenLabs "Test Voice") could not be generated: the ElevenLabs workspace had 128 credits and each
take needed 819 (see audio/narration/voice_provenance.json). The stand-in is one Runway eleven_v4 take (preset voice
"Benjamin"), used verbatim. Processing, in order:
  1. decode to 48 kHz mono;
  2. shorten the two longest sentence gaps (after "Spider-Man" and before "But there's a catch") to 0.36 s by
     removing silence from the middle of the gap with 10 ms crossfades. No word is cut, nothing is stretched or
     pitch-shifted, and no other gap is touched;
  3. place speech at 0 s and add a short tail for the loop.
Then the edited file is force-aligned again (tools/align.py) so every cue uses the measured word times of the audio that
is actually in the film, and the caption phrases and SRT are written from those words.
Outputs: audio/narration/FGW_Glass_Climbing_narration_final.wav (48k/24-bit), audio/narration/words_final.json,
         source/src/data/timeline.json, captions/FGW_Glass_Climbing_V1.srt"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, norm
from align import timeline

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/benjamin.mp3'
TAIL = 0.7  # after "contact": the failed brick test finishes and the glass specimen arrives for the loop
GAP = 0.36
TRIM_AFTER = ['man', 'repeat']  # the word before each gap to shorten

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
tw = json.load(open(os.path.join(EP, 'audio/narration/takes/benjamin_words.json')))['words']
edits = []
for i in range(len(tw) - 1):
    if tw[i]['word'] in TRIM_AFTER and tw[i + 1]['start'] - tw[i]['end'] > GAP + 0.05:
        a, b = tw[i]['end'], tw[i + 1]['start']
        cut = (b - a) - GAP
        mid = (a + b) / 2
        edits.append((mid - cut / 2, mid + cut / 2))
x = 0.01
out, pos = [], 0
for s0, s1 in edits:
    i0, i1, n = int(s0 * SR), int(s1 * SR), int(x * SR)
    seg = y[pos:i0].copy()
    tail = y[i1:i1 + n]
    seg[-n:] = seg[-n:] * np.linspace(1, 0, n) + tail * np.linspace(0, 1, n)
    out.append(seg)
    pos = i1 + n
out.append(y[pos:])
y2 = np.concatenate(out)
tmp = os.path.join(EP, 'audio/narration/takes/benjamin_edited.wav')
sf.write(tmp, y2, SR, subtype='PCM_24')
tl = timeline(tmp)
W = tl['words']
speech_end = W[-1]['end']
end_i = min(len(y2), int(round((speech_end + 0.12) * SR)))
y3 = y2[:end_i].copy()
f = int(0.06 * SR); y3[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
y3 = np.concatenate([y3, np.zeros(int(round(total_s * SR)) - len(y3))])
sf.write(os.path.join(EP, 'audio/narration/FGW_Glass_Climbing_narration_final.wav'), y3, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'edits_removed_s': [[round(a, 3), round(b, 3)] for a, b in edits], 'duration_s': total_s, 'frames': frames,
           'pocketsphinx_transcript': tl['pocketsphinx_transcript'], 'words': W}, open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

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
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Glass_Climbing_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'edits {edits}')
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
