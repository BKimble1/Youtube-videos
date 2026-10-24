#!/usr/bin/env python3
"""Final narration: the single ElevenLabs take (Test Voice, eleven_v4; see audio/narration/voice_provenance.json),
decoded to 48 kHz mono and placed at 0 s, so speech begins on frame 0 (first word at 0.10 s). No edits,
time-stretching, pitch or EQ: every sample is the take's. A short tail after "moth silk." lets the last beat land and
runs into the loop.
Writes the word timeline, caption phrases (synchronised to the measured words) and the SRT.
Outputs: audio/narration/FGW_Moth_Silk_narration_final.wav (48k/24-bit), audio/narration/words_final.json,
         source/src/data/timeline.json, captions/FGW_Moth_Silk_Web_Shooter.srt"""
import json, os, subprocess
import numpy as np, soundfile as sf
from script import LOCKED, norm

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/take1.mp3'
TAIL = 0.6  # after the last word: the final close view settles on the firing diagonal, then the loop

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
tl = json.load(open(os.path.join(EP, 'audio/narration/takes/take1_words.json')))
W = tl['words']
speech_end = tl['speech'][1]
end_i = min(len(y), int(round((speech_end + 0.08) * SR)))
out = y[:end_i].copy()
f = int(0.05 * SR); out[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
out = np.concatenate([out, np.zeros(int(round(total_s * SR)) - len(out))])
sf.write(os.path.join(EP, 'audio/narration/FGW_Moth_Silk_narration_final.wav'), out, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'duration_s': total_s, 'frames': frames, 'words': W}, open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

# Caption phrases: the locked narration split into short spoken phrases (text exactly as locked, in order).
CH = [('Imagine firing liquid', []), ('at a criminal—', ['criminal']), ('and watching it turn into a web', ['web']), ('that catches them.', ['catches']),
      ('Scientists have taken', []), ('the first step toward that.', ['first', 'step']),
      ('They start with silk', ['silk']), ('from moth cocoons', ['moth', 'cocoons']), ('and dissolve it into a liquid.', ['liquid']),
      ('As it shoots', []), ('through a special nozzle,', ['nozzle']), ('a surrounding layer of acetone', ['acetone']), ('triggers the silk to harden.', ['harden']),
      ('A sticky fiber', ['sticky']), ('forms in midair.', ['midair']), ('It hits the metal', ['metal']), ('and attaches.', ['attaches']),
      ('Then you pull—', ['pull']), ('and the blade lifts', ['lifts']), ('out of the sand.', ['sand']),
      ('In lab tests,', []), ('these fibers lifted over', []), ('eighty times their own weight.', ['eighty', 'times']),
      ('The beginnings', []), ('of a real web shooter…', ['web', 'shooter']), ('made from moth silk.', ['moth', 'silk'])]
# verbatim: the phrases, joined, are the locked text character for character (only line breaks differ)
assert ''.join(t for t, _ in CH).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''), 'captions must be the locked narration verbatim'
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
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Moth_Silk_Web_Shooter.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
