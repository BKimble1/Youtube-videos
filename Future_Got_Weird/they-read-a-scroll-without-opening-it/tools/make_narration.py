#!/usr/bin/env python3
"""Assemble the narration timing master from the eight selected Test Voice takes.

- Each take is used whole from its in-point to its last word, with no time-stretch or pitch change.
- Every selected take reads its block cleanly from the start, so no take is trimmed before its first word (SRC_IN is empty).
- Planned pauses are added only by inserting silence at the quietest point of an existing gap between two sentences
  (INSERT). No word is cut or moved inside a sentence.
- Word timings come from PocketSphinx forced alignment of each take against its locked words (tools/align.py).
  An onset after a pause is snapped to the measured waveform onset, so a cue never leads the sound.
Writes the 48 kHz/24-bit master, word timings, metadata and source/src/data/narration_words.json."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import blocks, words as disp_words
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
raw = json.load(open('audio/narration/align_blocks.json'))   # tools/align.py (PocketSphinx forced alignment)
TAKES = [f"audio/narration/takes/{raw[str(i)]['take']}.mp3" for i in range(8)]
SRC_IN = {int(k): v['src_in'] for k, v in raw.items() if v['src_in'] > 0}          # trims before the clean read (see the docstring)
LEAD = 0.30                                    # frame 0 already shows the sheet unrolling
GAPS = [1.00, 1.20, 1.20, 1.30, 1.80, 1.40, 1.50]    # silence between blocks
TAIL = 3.60                                    # the still-rolled scroll holds after the last word
# extra silence after word k of block b (0-based within the block), keyed by the sentence it follows
INSERT = {
    # (block, word as written, occurrence within the block): seconds of silence added after that word
    (1, 'book.', 1): 0.60, (1, 'seventy-nine.', 1): 0.60, (1, 'it.', 1): 0.50, (1, 'been.', 1): 0.60,
    (2, 'left.', 1): 0.60, (2, 'map.', 1): 0.60, (2, 'spiral.', 1): 0.70,
    (3, 'around.', 1): 0.80, (3, 'together?', 1): 0.90, (3, 'page.', 1): 1.00,      # the wrong-layer demonstration
    (4, 'messy.', 1): 0.60, (4, 'flatten.', 1): 0.60, (4, 'page.', 1): 0.90,        # "Now they had a page. | It looked almost blank."
    (5, 'too.', 1): 0.60, (5, 'identical.', 1): 0.70, (5, 'patches.', 1): 0.50, (5, 'letter.', 1): 0.70,
    (5, 'time.', 1): 0.80, (5, 'smudge.', 1): 0.60,
    (6, 'it.', 1): 0.60, (6, 'reveal.', 1): 0.70, (6, 'directly.', 1): 0.70, (6, 'up.', 1): 0.90,   # the matched comparison
    (7, 'feet.', 1): 0.60, (7, 'columns.', 1): 0.50, (7, 'missing.', 1): 0.70, (7, 'study.', 1): 0.60,
    (7, 'translation.', 1): 0.60, (7, 'do.”', 1): 1.30, (7, 'ago.', 1): 0.80, (7, 'scroll.', 1): 0.90,  # the translated fragment holds
}

def dec(p):
    b = subprocess.run(stdin=subprocess.DEVNULL, args=['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()

def level_db(y, win=480):
    n = len(y) // win
    return 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)

out = [np.zeros(int(LEAD * SR), np.float32)]
t = LEAD
allw, offsets, inserted = [], [], []
for bi, p in enumerate(TAKES):
    y = dec(p)
    ws = raw[str(bi)]['words']
    lv = level_db(y)
    a = int(SRC_IN[bi] * SR) if bi in SRC_IN else max(0, int((ws[0]['start'] - 0.06) * SR))
    if bi not in SRC_IN:
        on = np.where(lv > -50)[0]
        a = min(a, max(0, on[0] * 480 - int(0.04 * SR)))
    on = np.where(lv > -50)[0]
    b = min(len(y), max(int(ws[-1]['end'] * SR), on[-1] * 480 + 480) + int(0.06 * SR))
    dw = disp_words(blocks()[bi])
    assert len(dw) == len(ws), (bi, len(dw), len(ws))
    # word times inside the take (snapped onsets)
    tw = []
    for k, (w, d) in enumerate(zip(ws, dw)):
        s, e = w['start'], w['end']
        i0 = int(s * SR / 480)
        for j in range(max(12, i0 - 15), min(len(lv), i0 + 12)):
            if lv[j] > -48 and lv[j - 12:j].max() < -55:
                if j * 480 / SR <= s + 0.06 and (k == 0 or j * 480 / SR > ws[k - 1]['start'] + 0.12): s = j * 480 / SR
                break
        tw.append([d, s, e])
    # cut points for inserted silences: the quietest 10 ms window between the two words
    cuts = []
    seen = {}
    for k, (d, s, e) in enumerate(tw[:-1]):
        seen[d] = seen.get(d, 0) + 1
        key = (bi, d, seen[d])
        if key in INSERT:
            g0, g1 = int(e * 100), int(tw[k + 1][1] * 100)
            j = g0 + int(np.argmin(lv[g0:max(g1, g0 + 1)])) if g1 > g0 else g0
            cuts.append((j * 480, INSERT[key], k, d))
    pieces, prev = [], a
    for c, dur, k, d in cuts:
        pieces.append((prev, c)); prev = c
    pieces.append((prev, b))
    off = t - a / SR
    shift_after = []                     # (word index from which the extra delay applies, delay)
    acc = 0.0
    for pi, (p0, p1) in enumerate(pieces):
        seg = y[p0:p1].copy()
        f = int(0.01 * SR)
        g = int(0.005 * SR)
        seg[:f if pi == 0 else g] *= np.linspace(0, 1, f if pi == 0 else g)
        seg[-(f if pi == len(pieces) - 1 else g):] *= np.linspace(1, 0, f if pi == len(pieces) - 1 else g)
        out.append(seg); t += len(seg) / SR
        if pi < len(cuts):
            dur = cuts[pi][1]
            out.append(np.zeros(int(dur * SR), np.float32)); t += dur; acc += dur
            shift_after.append((cuts[pi][2] + 1, acc))
            inserted.append({'block': bi, 'after': cuts[pi][3], 'seconds': dur, 'at_src_s': round(cuts[pi][0] / SR, 3)})
    for k, (d, s, e) in enumerate(tw):
        extra = max([v for (kk, v) in shift_after if k >= kk], default=0.0)
        allw.append({'word': d, 'block': bi, 'start': round(s + off + extra, 3), 'end': round(e + off + extra, 3)})
    offsets.append({'block': bi, 'take': p, 'generation_id': raw[str(bi)]['generation_id'], 'src_in': round(a / SR, 3), 'src_out': round(b / SR, 3), 'start': round(off + a / SR, 3)})
    if bi < len(GAPS):
        out.append(np.zeros(int(GAPS[bi] * SR), np.float32)); t += GAPS[bi]
out.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
y = np.concatenate(out)
nfr = int(np.ceil(len(y) / SR * 30))
y = np.concatenate([y, np.zeros(int(round(nfr / 30 * SR)) - len(y), np.float32)])
lv = level_db(y)
for i, w in enumerate(allw):
    nxt = allw[i + 1]['start'] if i + 1 < len(allw) else len(y) / SR
    a0, b0 = int(w['start'] * 100), min(len(lv), int(max(w['end'], nxt) * 100))
    loud = [j for j in range(a0, b0) if lv[j] > -40]
    w['end'] = round(min(nxt, (loud[-1] + 1) / 100) if loud else w['end'], 3)
NAME = 'audio/narration/FGW_Scroll_narration_V1.wav'
sf.write(NAME, y, SR, subtype='PCM_24')
sha = hashlib.sha256(open(NAME, 'rb').read()).hexdigest()
meta = {'file': NAME, 'sha256': sha, 'duration_s': round(len(y) / SR, 4), 'frames_30fps': nfr, 'speech_s': [allw[0]['start'], allw[-1]['end']],
        'words': len(allw), 'lead_s': LEAD, 'gaps_s': GAPS, 'tail_s': TAIL, 'inserted_pauses': inserted, 'blocks': offsets}
meta['wpm_over_speech_span'] = round(len(allw) / (allw[-1]['end'] - allw[0]['start']) * 60, 1)
json.dump(meta, open('audio/narration/narration_V1_meta.json', 'w'), indent=1)
json.dump(allw, open('audio/narration/FGW_Scroll_V1_words.json', 'w'), indent=0)
os.makedirs('source/src/data', exist_ok=True)
json.dump({'fps': 30, 'frames': nfr, 'words': allw}, open('source/src/data/narration_words.json', 'w'))
print(json.dumps({k: v for k, v in meta.items() if k != 'blocks'}, indent=1))
