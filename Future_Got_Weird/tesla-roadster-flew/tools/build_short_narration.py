#!/usr/bin/env python3
"""Build the Short's narration track and word list from the selected take.

The footage doesn't let us count five vehicles (claim ledger C7), so the line "It even cleared five of Tesla's own
vehicles — a Semi included." (17.60–21.45 s in take 4) is replaced by the pickup "It even cleared a row of Teslas —
a Semi included." (same voice and model). Every other word keeps its time, so all picture cues stay put.
Outputs: source/public/short/narration_short.wav, source/src/data/short_words.json"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TAKE = os.path.join(ROOT, 'audio/short/takes/short_t4_KPLc.mp3')
PICKUP = os.path.join(ROOT, 'audio/short/takes/pickup_rowofteslas_t1_BfOG.mp3')
CUT = (17.60, 21.45)        # silence-bounded span of the five-vehicle line in take 4 (pauses at 17.19–17.67 and 21.41–21.93)
PICK_SPAN = (0.0, 3.36)     # pickup speech (its trailing pause starts at 3.31 s)
AT = 17.62
# pickup word times (Scribe alignment, ends trimmed to the measured pauses at 1.91 s and 3.31 s)
PICK_WORDS = [('It', 0.08, 0.24), ('even', 0.36, 0.48), ('cleared', 0.56, 0.72), ('a', 0.80, 0.88), ('row', 0.96, 1.04),
              ('of', 1.12, 1.20), ('Teslas,', 1.28, 1.91), ('a', 2.28, 2.32), ('Semi', 2.36, 2.72), ('included.', 3.00, 3.31)]

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def fade(x, n=int(0.012 * SR)):
    x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n); return x

take, pick = load(TAKE), load(PICKUP)
a, b = int(CUT[0] * SR), int(CUT[1] * SR)
seg = fade(pick[int(PICK_SPAN[0] * SR):int(PICK_SPAN[1] * SR)])
fill = np.zeros(b - a, np.float32)
off = int((AT - CUT[0]) * SR)
fill[off:off + len(seg)] = seg[:len(fill) - off]
y = np.concatenate([take[:a], fill, take[b:]])
out = os.path.join(ROOT, 'source/public/short/narration_short.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', out], input=y.tobytes(), check=True)

# words: take 4's alignment (tags dropped, first word and the 0.81 span corrected from the energy envelope)
src = json.load(open(os.path.join(ROOT, 'audio/short/scribe/short_t4_KPLc_words.json')))['words']
words = []
for w in src:
    t = w['text']
    if t.startswith('[') or t.endswith(']') or t == '—':
        continue
    o = {'w': t, 's': round(w['start'], 3), 'e': round(w['end'], 3)}
    if t == 'Tesla' and o['s'] < 0.5: o['s'] = 0.04
    if t == '0.81': o['s'], o['e'] = 31.0, 31.9
    if t == 'seconds?': o['s'], o['e'] = 31.95, 32.5
    if CUT[0] - 0.05 <= o['s'] < CUT[1]:
        continue
    words.append(o)
words += [{'w': t, 's': round(AT + s, 3), 'e': round(AT + e, 3)} for t, s, e in PICK_WORDS]
words.sort(key=lambda o: o['s'])
json.dump({'take': 'short_t4_KPLc + pickup_rowofteslas_t1_BfOG at 17.62 s', 'voice_id': 'kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4',
           'generation_ids': ['KPLcYkFqAPKyhZ70hjOg', 'BfOGGu4lZ1cCiHFFYGiT'], 'duration': round(len(y) / SR, 3),
           'note': 'Scribe returned forced alignments to the prompt text; first word and the 0.81 span corrected from the energy envelope.',
           'words': words}, open(os.path.join(ROOT, 'source/src/data/short_words.json'), 'w'), indent=1)
print(f'{out}: {len(y) / SR:.2f}s, {len(words)} words')
