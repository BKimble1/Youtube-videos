#!/usr/bin/env python3
"""Selected takes -> narration master (48 kHz, 24-bit, mono), word timings (audio + Remotion data).
Speech is untouched: no time-stretch, no pitch change, no splice inside a word. Each take is used whole from its
first onset (less 40 ms) to its last sound (plus 80 ms). Between blocks there is a fixed silence, and at a few
sentence ends inside a block the take's own pause is lengthened (silence inserted at the middle of a measured pause
below -50 dBFS, 10 ms fades) so the picture can finish a physical action before the next line. Every hold is listed
in HOLDS with its reason, and recorded in the meta file.
Word times: local sherpa-onnx Zipformer token timestamps matched to the locked words; the first word after a pause
is snapped to the measured waveform onset; word ends are the last loud 10 ms frame before the next word."""
import json, subprocess, hashlib, sys, os, difflib
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, blocks, words, norm
os.chdir(ROOT)
SR = 48000
MODELS = os.environ.get('SHERPA_MODELS', '/tmp/claude-0/models')
TAKES = [('audio/narration/takes/b1_t3_OlHd.mp3', 'OlHdXnnbPsqGvZgGz2YZ'),
         ('audio/narration/takes/b2_t4_rLLk.mp3', 'rLLkPnbRlfhsTftlQtPz'),
         ('audio/narration/takes/b3_t4_tvdB.mp3', 'tvdBpLCoAMm9cOzRe6vA'),
         ('audio/narration/takes/b4_t3_7oOE.mp3', '7oOEkLVoePxjNJzpPQue')]
LEAD = 0.25                      # frame 0 already shows the cut; the voice follows almost at once
GAPS = [1.25, 1.9, 1.6]          # between blocks: cab -> two arms; STEEL ARMS reveal -> safety; rollout goal -> ending
TAIL = 3.0                       # after the last word: the final grip and cut resolve
# (last two words of the sentence, total pause length in s, why)
HOLDS = [
    ('terrible combination.', 1.05, 'the held branch hangs over the rails before the pull-back begins'),
    ("have legs.", 0.75, 'the camera reaches the empty space below the torso'),
    ('every movement.', 0.75, 'push into the cab window'),
    ("person's control.", 0.85, 'the lifted piece is set down clear of the track'),
    ('is pushing.', 0.80, 'the handle pushes back against the hand'),
    ('the risk.', 0.85, 'the worker is replaced by the machine at the same target'),
    ('interesting part.', 0.65, 'travel from the paused saw to the controls'),
]
z = os.path.join(MODELS, 'sherpa-onnx-zipformer-en-2023-06-26')
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4)

def dec(p, sr):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()

def level(y, sr):
    win = sr // 100; n = len(y) // win
    return 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)

def align(path, dw):
    """word starts/ends (s, take time) for the display words dw"""
    y16 = dec(path, 16000)
    db = level(y16, 16000); loud = db > -45; n = len(db)
    pauses, i = [], 0
    while i < n:
        if not loud[i]:
            j = i
            while j < n and not loud[j]: j += 1
            if j - i >= 12 and i > 0 and j < n: pauses.append((i / 100, j / 100))
            i = j
        else: i += 1
    cuts = [0.0] + [(a + b) / 2 for a, b in pauses] + [len(y16) / 16000]
    hyp = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        s = rec.create_stream(); s.accept_waveform(16000, y16[int(a * 16000):int(b * 16000)]); rec.decode_stream(s)
        first = True
        for tok, ts in zip(s.result.tokens, s.result.timestamps):
            if tok.startswith(('▁', ' ')) or first:
                hyp.append([tok.lstrip('▁ '), a + ts]); first = False
            else:
                hyp[-1][0] += tok
    hw = [norm(h[0]) for h in hyp]
    lw = [norm(w) for w in dw]
    sm = difflib.SequenceMatcher(None, lw, hw, autojunk=False)
    st = [None] * len(lw)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        for k in range(i1, i2):
            if op == 'equal': st[k] = hyp[j1 + k - i1][1]
            elif j2 > j1: st[k] = hyp[j1 + int((k - i1) * (j2 - j1) / (i2 - i1))][1]
    for k in range(len(st)):  # deletions: interpolate
        if st[k] is None: st[k] = st[k - 1] + 0.15 if k else 0.0
    # snap the first word after a pause to the measured onset
    for k in range(len(st)):
        for a, b in pauses:
            if a - 0.05 <= st[k] <= b + 0.25 and (k == 0 or st[k - 1] < a): st[k] = b; break
    for k in range(1, len(st)): st[k] = max(st[k], st[k - 1] + 0.04)
    en = []
    for k in range(len(st)):
        nxt = st[k + 1] if k + 1 < len(st) else len(y16) / 16000
        e = int(nxt * 100) - 1
        while e > int(st[k] * 100) and not loud[min(e, n - 1)]: e -= 1
        en.append(max(st[k] + 0.05, (e + 1) / 100))
    return st, en, pauses

out = [np.zeros(int(LEAD * SR), np.float32)]
t = LEAD
allw, meta_blocks, holds_done = [], [], []
for bi, (p, gid) in enumerate(TAKES):
    dw = words(blocks()[bi])
    st, en, pauses = align(p, dw)
    y = dec(p, SR)
    lv = level(y, SR)
    on = np.where(lv > -50)[0]
    a = max(0, min(int((st[0] - 0.04) * SR), on[0] * 480 - int(0.04 * SR)))
    b = min(len(y), max(int(en[-1] * SR), on[-1] * 480 + 480) + int(0.08 * SR))
    seg = y[a:b].copy()
    # holds: lengthen the pause after the listed sentence ends
    ins = []  # (take time of insertion, seconds inserted)
    for k, w in enumerate(dw[:-1]):
        for hw_, total, why in HOLDS:
            if ' '.join(dw[max(0, k - 1):k + 1]) == hw_:
                g0, g1 = en[k], st[k + 1]
                cur = g1 - g0
                if total > cur:
                    m = (g0 + g1) / 2
                    q = y[int((m - 0.03) * SR):int((m + 0.03) * SR)]
                    assert 20 * np.log10(np.sqrt((q ** 2).mean()) + 1e-9) < -50, (w, 'not silent at the insertion point')
                    ins.append((m, total - cur)); holds_done.append({'after': hw_, 'block': bi + 1, 'was_s': round(cur, 3), 'now_s': total, 'why': why})
    pieces, last = [], a
    for m, d in sorted(ins):
        i = int(m * SR)
        pieces.append(y[last:i]); pieces.append(np.zeros(int(d * SR), np.float32)); last = i
    pieces.append(y[last:b])
    seg = np.concatenate(pieces)
    f = int(0.01 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)

    def tmap(x):  # take time -> film time
        return t + (x - a / SR) + sum(d for m, d in ins if m < x)
    for k, w in enumerate(dw):
        allw.append({'word': w, 'block': bi, 'start': round(tmap(st[k]), 3), 'end': round(tmap(en[k]), 3)})
    meta_blocks.append({'block': bi + 1, 'take': p, 'generation_id': gid, 'src_in': round(a / SR, 3), 'src_out': round(b / SR, 3),
                        'film_start': round(t, 3), 'inserted_s': round(sum(d for _, d in ins), 3)})
    out.append(seg); t += len(seg) / SR
    if bi < len(GAPS):
        out.append(np.zeros(int(GAPS[bi] * SR), np.float32)); t += GAPS[bi]
out.append(np.zeros(int(TAIL * SR), np.float32))
y = np.concatenate(out)
nfr = int(np.ceil(len(y) / SR * 30))
y = np.concatenate([y, np.zeros(int(round(nfr / 30 * SR)) - len(y), np.float32)])
dst = 'audio/narration/FGW_Chainsaw_Robot_narration_V1.wav'
sf.write(dst, y, SR, subtype='PCM_24')
sha = hashlib.sha256(open(dst, 'rb').read()).hexdigest()
sp = allw[-1]['end'] - allw[0]['start']
meta = {'file': dst, 'sha256': sha, 'duration_s': round(len(y) / SR, 4), 'frames_30fps': nfr, 'words': len(allw),
        'speech_s': [allw[0]['start'], allw[-1]['end']], 'wpm_over_speech_span': round(len(allw) / sp * 60, 1),
        'lead_s': LEAD, 'gaps_s': GAPS, 'tail_s': TAIL, 'holds': holds_done, 'blocks': meta_blocks}
json.dump(meta, open('audio/narration/narration_V1_meta.json', 'w'), indent=1)
json.dump(allw, open('audio/narration/FGW_Chainsaw_Robot_V1_words.json', 'w'), indent=0)
os.makedirs('source/src/data', exist_ok=True)
json.dump({'fps': 30, 'frames': nfr, 'words': allw}, open('source/src/data/narration_words.json', 'w'))
print(json.dumps({k: v for k, v in meta.items() if k not in ('blocks',)}, indent=1))
