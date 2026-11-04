#!/usr/bin/env python3
"""Forced alignment of each selected take against its locked block text with PocketSphinx (US English model, 10 ms
frames). Scribe aligns to the generation prompt, which includes the direction tag, so its timings drift where a take
opens with a spoken tag or a false start (B6). This alignment uses only the locked words, read from each take's
in-point. Writes audio/narration/align_blocks.json, with Scribe compared in qa/align_vs_scribe.json."""
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import blocks, norm, words
from pocketsphinx import Decoder
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXTRA = {'rajesh': 'R AA JH EY SH', "receiver's": 'R IH S IY V ER Z', 'stocco': 'S T AA K OW', "stocco's": 'S T AA K OW Z',
         "teammate's": 'T IY M M EY T S', 'touchpad': 'T AH CH P AE D'}
SRC_IN = {0: 2.80, 4: 3.20, 5: 5.05}
S = json.load(open('audio/narration/scribe_blocks_raw.json'))
out, cmp = {}, {}
for bi, b in enumerate(blocks()):
    take = f"audio/narration/takes/{S[str(bi)]['take']}.mp3"
    a = SRC_IN.get(bi, 0.0)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-i', take, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    d = Decoder(loglevel='FATAL')
    for w, ph in EXTRA.items(): d.add_word(w, ph, True)
    # one token per displayed word (a displayed word that normalises to two tokens, e.g. "falling-block", keeps both)
    disp = words(b)
    toks = [norm(w) for w in disp]
    d.set_align_text(' '.join(t for ts in toks for t in ts))
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    segs = [(s.word, a + s.start_frame / 100, a + (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ('<sil>', '<s>', '</s>', '[NOISE]')]
    segs = [(w.split('(')[0], s0, e0) for w, s0, e0 in segs]
    res, k = [], 0
    for w, ts in zip(disp, toks):
        grp = segs[k:k + len(ts)]; k += len(ts)
        res.append({'text': w, 'start': round(grp[0][1], 3), 'end': round(grp[-1][2], 3)})
    assert k == len(segs), (bi, k, len(segs))
    out[str(bi)] = {'take': S[str(bi)]['take'], 'generation_id': S[str(bi)]['generation_id'], 'src_in': a, 'words': res}
    diff = [r['start'] - s['start'] for r, s in zip(res, S[str(bi)]['words'])]
    cmp[bi + 1] = {'median_abs_ms': round(float(np.median(np.abs(diff))) * 1000), 'max_abs_ms': round(float(np.max(np.abs(diff))) * 1000),
                   'worst': S[str(bi)]['words'][int(np.argmax(np.abs(diff)))]['text']}
json.dump(out, open('audio/narration/align_blocks.json', 'w'), indent=0)
os.makedirs('qa', exist_ok=True)
json.dump(cmp, open('qa/align_vs_scribe.json', 'w'), indent=1)
print(json.dumps(cmp))
