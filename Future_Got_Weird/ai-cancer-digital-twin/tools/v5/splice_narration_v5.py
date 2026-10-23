#!/usr/bin/env python3
"""V5 narration: the approved V2 narration with ONE sentence re-delivered — "This is where artificial intelligence changes the
game." (1:07) — in the same voice and model, with a calmer, intrigued delivery. Nothing else is touched.
The replacement take was generated with the preceding approved sentence for natural intonation; only the target sentence
is used. Both cut points sit in silence at the same generator noise floor (about -87 dBFS) with 10 ms crossfades, and the
new "This" lands exactly where the old one did (67.57 s), so every later word keeps its time.
    python3 tools/v5/splice_narration_v5.py      (run from the episode folder)
Outputs: v5/audio/narration/narration_v5.wav, source/public/audio/narration_v5.mp3, source/src/v2/data/narration_v5.json"""
import json, subprocess, io, numpy as np, soundfile as sf
SR = 48000
CUT_A, CUT_B = 67.30, 70.50           # film time: silence after "next?" … silence before the breath into "Imagine"
TAKE = 'v5/audio/narration/b3fix_t1.mp3'
TAKE_THIS, FILM_THIS = 4.08, 67.57    # the new "This" (take time) is placed on the old "This" (film time)
NEW = [('This', 4.08, 4.24), ('is', 4.32, 4.40), ('where', 4.48, 4.64), ('artificial', 4.72, 5.12), ('intelligence', 5.20, 5.84),
       ('changes', 5.92, 6.32), ('the', 6.36, 6.40), ('game.', 6.48, 7.12)]   # eleven_scribe_v1 alignment of the take

n, sr = sf.read('v2/audio/narration/narration_v2.wav'); assert sr == SR
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', TAKE, '-f', 'wav', '-ac', '1', '-ar', str(SR), '-acodec', 'pcm_f32le', '-'])
y = sf.read(io.BytesIO(raw))[0]
off = FILM_THIS - TAKE_THIS
a, b = int(CUT_A * SR), int(CUT_B * SR)
piece = y[int((CUT_A - off) * SR):int((CUT_A - off) * SR) + (b - a)].copy()
assert len(piece) == b - a
xf = int(0.01 * SR)
out = n.copy()
out[a:b] = piece
out[a:a + xf] = n[a:a + xf] * np.linspace(1, 0, xf) + piece[:xf] * np.linspace(0, 1, xf)
out[b - xf:b] = piece[-xf:] * np.linspace(1, 0, xf) + n[b - xf:b] * np.linspace(0, 1, xf)
sf.write('v5/audio/narration/narration_v5.wav', out, SR, subtype='PCM_24')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'v5/audio/narration/narration_v5.wav', '-b:a', '192k', 'source/public/audio/narration_v5.mp3'], check=True)

d = json.load(open('source/src/v2/data/narration_v2.json'))
for key in ('words', 'script_words'):
    ws = d[key]
    i0 = next(i for i, w in enumerate(ws) if w['text'] == 'This' and 67 < w['start'] < 68)
    for k, (txt, s, e) in enumerate(NEW):
        assert ws[i0 + k]['text'].strip('.').lower() == txt.strip('.').lower(), (ws[i0 + k], txt)
        ws[i0 + k]['start'] = round(s + off, 3); ws[i0 + k]['end'] = round(min(e + off, CUT_B), 3)
d['v5_note'] = 'one sentence re-delivered at 67.57 s (tools/v5/splice_narration_v5.py); all other words identical to V2'
json.dump(d, open('source/src/v2/data/narration_v5.json', 'w'), indent=1)
diff = np.abs(out - n); idx = np.where(diff > 1e-6)[0]
print('changed samples span', round(idx[0] / SR, 3), '-', round(idx[-1] / SR, 3), 's; length', len(out) / SR)
