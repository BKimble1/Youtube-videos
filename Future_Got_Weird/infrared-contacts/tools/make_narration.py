#!/usr/bin/env python3
"""Final narration: ElevenLabs take 4 (Test Voice, eleven_v4), resampled to 48 kHz mono and placed at 0 s so speech
begins on frame 0 (the take's first word starts at 0.03 s). One short silence extension inside an existing pause, at
the story's move outward from the eye to the train compartment, and a short tail that lands the loop. No
time-stretching, pitch or EQ change: every spoken sample is the take's.
Also writes the word timeline, caption chunks (2-5 words) and the SRT.
Outputs: audio/narration/FGW_Infrared_Contacts_narration_final.wav (48k/24-bit), source/public/audio/narration.wav,
         audio/narration/words_final.json, source/src/data/timeline.json, captions/FGW_Infrared_Contacts_V1.srt"""
import json, os, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TAKE = 'audio/narration/takes/take4.mp3'
LEAD = 0.0
# (time in the take, inserted seconds): inside the measured 0.40 s pause after "actually see." (22.96-23.36)
INSERTS = [(23.12, 0.22)]  # before "So you could look": the camera pulls out of the eye into the carriage
TAIL = 0.55                # after "can see.": the last pulse resolves into the opening eye framing
FPS = 30

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
words = json.load(open(os.path.join(EP, 'audio/narration/takes/take4_words.json')))['words']
speech_end = 28.92  # measured end of the final "see" (asr_takes speech span)

def shift(t):
    return t + LEAD + sum(d for at, d in INSERTS if t >= at)

parts, prev = [np.zeros(int(round(LEAD * SR)))], 0
for at, d in INSERTS:
    i = int(round(at * SR))
    seg = y[prev:i]
    assert np.abs(seg[-480:]).max() < 0.01, f'insert at {at} is not in silence'
    parts += [seg, np.zeros(int(round(d * SR)))]
    prev = i
end_i = int(round((speech_end + 0.08) * SR))
parts.append(y[prev:end_i])
out = np.concatenate(parts)
f = int(0.06 * SR); out[-f:] *= np.linspace(1, 0, f)
total_s = shift(speech_end) + TAIL
frames = int(round(total_s * FPS)); total_s = frames / FPS
out = np.concatenate([out, np.zeros(int(round(total_s * SR)) - len(out))])
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'audio/narration/FGW_Infrared_Contacts_narration_final.wav'), out, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'source/public/audio/narration.wav'), out, SR, subtype='PCM_24')

W = [dict(w, start=round(shift(w['start']), 3), end=round(shift(max(w['end'], w['start'] + 0.08)), 3)) for w in words]
for w in W:
    for k in ('db', 'f0', 'rel_db', 'rel_f0'): w.pop(k, None)
json.dump({'take': TAKE, 'lead_s': LEAD, 'inserts': INSERTS, 'duration_s': total_s, 'frames': frames, 'words': W},
          open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

# caption chunks: (text, emphasis words shown in yellow). Text is the approved narration, split into short phrases.
CH = [('If you put these contacts in,', []), ('you could see flashing lights', []), ('with your eyes completely shut.', ['completely', 'shut']),
      ('You see, your eyes normally', []), ('can’t detect infrared.', ['infrared']), ('But these lenses contain', []),
      ('tiny particles', []), ('that absorb that invisible light', ['invisible']), ('and turn it into', []), ('colors you can see.', []),
      ('And while your eyelids block', []), ('much of the visible light', []), ('around you,', []),
      ('infrared can still pass through.', ['infrared']), ('It reaches the lens underneath,', []), ('gets converted,', []),
      ('and becomes a flash', ['flash']), ('you can actually see.', []), ('So you could look', []), ('completely asleep…', []),
      ('while someone flashes you', []), ('a secret code', ['secret', 'code']), ('nobody around you can see.', [])]
caps, k = [], 0
for text, emph in CH:
    n = len(text.split())
    ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W), (k, len(W))
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.03), 3)
    c['hide'] = round(nxt - 0.03 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
TL = {'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': W}
json.dump(TL, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Infrared_Contacts_V1.srt'), 'w') as fh:
    for i, c in enumerate(caps):
        fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {W[0]["start"]:.2f}-{W[-1]["end"]:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
