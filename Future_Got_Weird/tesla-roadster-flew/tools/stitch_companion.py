#!/usr/bin/env python3
"""Stitch the selected companion takes into one narration track and write global word times.
Outputs: source/public/companion/narration_companion.wav, source/src/data/companion_words.json"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LEAD = 0.5   # footage breathes before the first word
GAPS = {'b1': 0.8, 'b2': 0.9, 'b3': 0.9, 'b4': 0.9, 'b5': 1.0, 'b6': 0.0}
TAIL = 4.2   # source card after the last word
# B1 and B5 were re-voiced after the footage showed the stream's 0-60 timer stopping at 1.00 s (claim ledger C8).
TAKES = [('b1', 'b1v2_t1_HylM', 'b1v2'), ('b2', 'b2_t1_w2Kg', 'b2'), ('b3', 'b3_t1_GBiZ', 'b3'), ('b4', 'b4_t1_obgt', 'b4'),
         ('b5', 'b5v2_t1_k6sE', 'b5v2'), ('b6', 'b6_t1_EcCM', 'b6')]
# Spans removed from a take (seconds in that take). B2: "And in the driver's seat? An Optimus robot, which Engadget reports
# was only there for show. The stunts were programmed into the car." — the supplied footage can't show it (claim C13).
DROPS = {'b2': [(25.32, 33.36)]}
# Same-length line swaps (take span -> pickup speech placed at `at`). B2: "five Tesla vehicles" -> "a row of Teslas" (claim C7).
REPLACE = {'b2': [dict(span=(21.60, 25.20), take='b2pickup_rowofteslas_t1_jOAN', src=(0.0, 3.50), at=21.62,
                       words=[('It', 0.06, 0.18), ('even', 0.24, 0.40), ('hopped', 0.44, 0.68), ('over', 0.73, 0.92), ('a', 0.98, 1.04),
                              ('row', 1.08, 1.26), ('of', 1.30, 1.40), ('Teslas,', 1.47, 2.12), ('a', 2.36, 2.42), ('Semi', 2.46, 2.80),
                              ('included.', 2.86, 3.44)])]}

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

parts, words, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
blocks = []
for b, take, wfile in TAKES:
    x = load(os.path.join(ROOT, 'audio/companion/takes', take + '.mp3'))
    w = json.load(open(os.path.join(ROOT, 'audio/companion/scribe', wfile + '_words.json')))['words']
    drops = DROPS.get(b, [])
    x = x.copy()
    for r in REPLACE.get(b, []):
        p = load(os.path.join(ROOT, 'audio/companion/takes', r['take'] + '.mp3'))[int(r['src'][0] * SR):int(r['src'][1] * SR)].copy()
        n = int(0.012 * SR); p[:n] *= np.linspace(0, 1, n); p[-n:] *= np.linspace(1, 0, n)
        i0, i1, j = int(r['span'][0] * SR), int(r['span'][1] * SR), int(r['at'] * SR)
        x[i0:i1] = 0; x[j:j + len(p)] = p[:i1 - j]
        w = [k for k in w if not (r['span'][0] <= k['start'] < r['span'][1])] + \
            [{'text': t, 'start': r['at'] + a, 'end': r['at'] + e} for t, a, e in r['words']]
    w = sorted(w, key=lambda k: k['start'])
    def shift(tt):  # take time -> time after drops (None if inside a dropped span)
        d = 0.0
        for a0, a1 in drops:
            if tt >= a1: d += a1 - a0
            elif tt >= a0: return None
        return tt - d
    for a0, a1 in reversed(drops):
        n = int(0.01 * SR); i0, i1 = int(a0 * SR), int(a1 * SR)
        x = np.concatenate([x[:i0 - n], x[i0 - n:i0] * np.linspace(1, 0, n, dtype=np.float32), x[i1:i1 + n] * np.linspace(0, 1, n, dtype=np.float32), x[i1 + n:]])
    for k in w:
        s = k['text']
        if s.startswith('[') or s.endswith(']') or s in ('—', '-'):
            continue
        s0, e0 = shift(k['start']), shift(k['end'])
        if s0 is None:
            continue
        if e0 is None:  # the alignment runs a word's end into a dropped span; end it where the drop starts
            e0 = shift(max(a0 for a0, a1 in drops if a0 <= k['end'])) or s0
        words.append({'w': s, 's': round(t + s0, 3), 'e': round(t + e0, 3), 'b': b})
    blocks.append({'block': b, 'take': take, 'start': round(t, 3), 'len': round(len(x) / SR, 3)})
    parts.append(x); t += len(x) / SR
    gap = GAPS[b]
    parts.append(np.zeros(int(gap * SR), np.float32)); t += gap
parts.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
y = np.concatenate(parts)
os.makedirs(os.path.join(ROOT, 'source/public/companion'), exist_ok=True)
out = os.path.join(ROOT, 'source/public/companion/narration_companion.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', out], input=y.tobytes(), check=True)
json.dump({'voice_id': 'kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4', 'duration': round(t, 3), 'blocks': blocks, 'words': words},
          open(os.path.join(ROOT, 'source/src/data/companion_words.json'), 'w'), indent=0)
print(f'{out}: {t:.2f}s, {len(words)} words')
for bl in blocks:
    print(bl)
