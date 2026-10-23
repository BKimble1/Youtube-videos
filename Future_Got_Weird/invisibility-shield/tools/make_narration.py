#!/usr/bin/env python3
"""Final narration: ElevenLabs take 3 (Test Voice, eleven_v4), decoded to 48 kHz mono and placed at 0 s, so speech
begins on frame 0 (the take's first word starts at 0.05 s). No edits, time-stretching, pitch or EQ: every sample is the
take's. A short tail after "the entire time." lets the last beat land and runs into the loop.
Writes the word timeline, caption phrases (synchronised to the measured words) and the SRT.
Outputs: audio/narration/FGW_Invisibility_Shield_narration_final.wav (48k/24-bit), source/public/audio/narration.wav,
         audio/narration/words_final.json, source/src/data/timeline.json, captions/FGW_Invisibility_Shield_V1.srt"""
import json, os, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/take3.mp3'
TAIL = 0.66  # after the last word: the shield settles low and the next lift begins

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
tl = json.load(open(os.path.join(EP, 'audio/narration/takes/take3_words.json')))
W = tl['words']
speech_end = tl['speech'][1]
end_i = int(round((speech_end + 0.06) * SR))
out = y[:end_i].copy()
f = int(0.05 * SR); out[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
out = np.concatenate([out, np.zeros(int(round(total_s * SR)) - len(out))])
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'audio/narration/FGW_Invisibility_Shield_narration_final.wav'), out, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'source/public/audio/narration.wav'), out, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'duration_s': total_s, 'frames': frames, 'words': W}, open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

# Caption phrases: the approved narration split into short spoken phrases (text exactly as approved, in order).
CH = [('If you raised this shield,', ['shield']), ('someone looking straight at you', []), ('could watch your body disappear.', ['disappear']),
      ('You see, its surface', []), ('is covered in tiny lenses.', ['lenses']),
      ('They spread the light', []), ('coming from your body sideways,', ['sideways']),
      ('while smearing the background', ['smearing']), ('across the space', []), ('where you’re standing.', []),
      ('From the right position,', []), ('your outline disappears', []), ('into a blurred patch of scenery.', ['blurred']),
      ('So you could reach one hand', []), ('around the edge…', ['edge']),
      ('and make it look like a hand', []), ('is floating in midair.', ['floating', 'midair']),
      ('Then lower the shield…', []), ('and reveal you were standing', []), ('right in front of them', []), ('the entire time.', ['entire', 'time'])]
approved = open(os.path.join(EP, 'production/NARRATION_APPROVED.txt'), encoding='utf-8').read().split()
assert ' '.join(t for t, _ in CH).split() == approved, 'captions must be the approved narration verbatim'
caps, k = [], 0
for text, emph in CH:
    n = len(text.split()); ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Invisibility_Shield_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
