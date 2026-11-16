#!/usr/bin/env python3
"""Forced alignment of each selected take against its locked block text with PocketSphinx (US English model, 10 ms
frames). Only the locked words are aligned. Writes audio/narration/align_blocks.json."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import blocks, norm, words
from pocketsphinx import Decoder
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXTRA = {'papyrus': 'P AH P AY R AH S'}
# selected takes (see audio/narration/voice_provenance.json for the screen and the reasons)
VER = os.environ.get('VER', 'V1')
SEL = ['b1_t2_qhtK', 'b2_t4_ClVs', 'b3_t4_9UKo', 'b4_t3_h2uR', 'b5_t1_CyiZ', 'b6_t4_L92a', 'b7_t1_QNKd', 'b8_t1_MW6d']
TAKES_DIR = 'audio/narration/takes'
if VER == 'V3':
    SEL = ['b1_t1_a4YP', 'b2_t2_RxCP', 'b3_t1_2lDg', 'b4_t2_9rIt', 'b5_t1_yvch', 'b6_t1_OAbf', 'b7_t1_Nw9B', 'b8_t1_ydKB']
    TAKES_DIR = 'audio/narration/takes_v3'
GEN = {'b1_t2_qhtK': 'qhtK8WN7Q5tHRn7CVQub', 'b2_t4_ClVs': 'ClVs4McvhXrpVh1pWSsY', 'b3_t4_9UKo': '9UKouFEOsysmTJeOhfBm',
       'b4_t3_h2uR': 'h2uRmSwD8w3T3iciQcoz', 'b5_t1_CyiZ': 'CyiZN5IgQuhMYyIyzStb', 'b6_t4_L92a': 'L92apwwoG7MixviGY0Wh',
       'b7_t1_QNKd': 'QNKdI2NlRSgaTRdkT31g', 'b8_t1_MW6d': 'MW6ddlACJNjTONwaOppa',
       'b1_t1_a4YP': 'a4YP4EogHXTcwjx4jo0P', 'b2_t2_RxCP': 'RxCPcoKWVrcyyMPzMi0r', 'b3_t1_2lDg': '2lDgsp3nEwZK90wSNIpG', 'b4_t2_9rIt': '9rItDAkMgoXj2NtC8ovF',
       'b5_t1_yvch': 'yvch5UD9Ke4E14k4ERfD', 'b6_t1_OAbf': 'OAbf1DN5lGKrDurdQtQi', 'b7_t1_Nw9B': 'Nw9BunvgVkGjK3WysZqS', 'b8_t1_ydKB': 'ydKBjTc7thz27pcBzRIM'}
SRC_IN = {}
out = {}
for bi, b in enumerate(blocks()):
    tk = SEL[bi]
    take = f"{TAKES_DIR}/{tk}.mp3"
    a = SRC_IN.get(bi, 0.0)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-i', take, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, stdin=subprocess.DEVNULL).stdout
    d = Decoder(loglevel='FATAL')
    for w, ph in EXTRA.items(): d.add_word(w, ph, True)
    disp = words(b)
    toks = [norm(w) for w in disp]
    d.set_align_text(' '.join(t for ts in toks for t in ts))
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    segs = [(s.word, a + s.start_frame / 100, a + (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ('<sil>', '<s>', '</s>', '[NOISE]')]
    res, k = [], 0
    for w, ts in zip(disp, toks):
        grp = segs[k:k + len(ts)]; k += len(ts)
        res.append({'text': w, 'start': round(grp[0][1], 3), 'end': round(grp[-1][2], 3)})
    assert k == len(segs), (bi, k, len(segs))
    out[str(bi)] = {'take': tk, 'generation_id': GEN[tk], 'src_in': a, 'words': res}
    print(bi + 1, tk, len(res), 'words', res[0]['start'], res[-1]['end'])
json.dump(out, open('audio/narration/align_blocks.json' if VER == 'V1' else f'audio/narration/align_blocks_{VER.lower()}.json', 'w'), indent=0)
