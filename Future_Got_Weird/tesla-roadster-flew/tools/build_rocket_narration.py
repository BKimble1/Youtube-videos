#!/usr/bin/env python3
"""Rocket Short narration: place the sentences of the tightened Test Voice takes (audio/rocket/tight/<take>.wav, made by
tools/tighten_rocket.py) on the film timeline. Sentences keep their recorded delivery; a few gaps are widened where the
picture needs a beat. No time-stretch, no pitch change. Each sentence block is cut in the middle of its silences.
The final pass splices three re-recorded lines (same voice, model and tags, recorded in the full script's context) into
the approved take: the hook ("This Tesla can jump. But its air supply isn't endless."), the hover line ("Hovering means
pushing against the car's entire weight.") and the CTA ("It also drives upside down. Tap the linked breakdown.").
The spliced take gets one overall gain, measured on the sentences both takes share, so its own dynamics stay.
usage: build_rocket_narration.py [take]   (one take, as recorded) or with no argument the final-pass PLAN below
Outputs: source/public/rocket/narration.wav (48 kHz mono) and source/src/data/rocket_words.json"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LEAD = 0.04   # the first word starts on frame 1 or 2
# final pass: (take, sentence index in that take) for each sentence of the film, in order
PLAN = [('fp_t4', 0), ('fp_t4', 1), ('r_t1', 2), ('r_t1', 3), ('fp_t4', 4), ('r_t1', 5), ('r_t1', 6), ('r_t1', 7),
        ('r_t1', 8), ('r_t1', 9), ('r_t1', 10), ('r_t1', 11), ('r_t1', 12), ('fp_t4', 13), ('fp_t4', 14)]
BASE = 'r_t1'   # the approved take; the other take is level-matched to it
if len(sys.argv) > 1:
    PLAN = None
    one = sys.argv[1]
# extra seconds of silence after the sentence ending with this word (picture beats); everything else stays as recorded
EXTRA = {'endless.': 0.10, 'weight.': 0.12, 'protection.': 0.20, 'too.': 0.25, 'flying.': 0.20, 'problems.': 0.15}
VERIFY = os.path.join(ROOT, 'audio/rocket/scribe', 'placed_verify_fp.json' if PLAN else 'placed_verify.json')


def load_take(take):
    tight = json.load(open(os.path.join(ROOT, 'audio/rocket/tight', take + '.json')))
    words = tight['words']
    wav = os.path.join(ROOT, 'audio/rocket/tight', take + '.wav')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    sil = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=n=-40dB:d=0.06', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', sil)]
    en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', sil)]
    gaps = list(zip(st, en))
    blocks, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        if w['w'][-1] in '.?!':
            blocks.append(cur); cur = []
    cuts = [0.0]
    for a, b in zip(blocks, blocks[1:]):
        want = (words[a[-1]]['e'] + words[b[0]]['s']) / 2
        g = min(gaps, key=lambda g: abs((g[0] + g[1]) / 2 - want))
        cuts.append((g[0] + g[1]) / 2)
    cuts.append(len(x) / SR)
    return {'take': tight['take'], 'words': words, 'x': x, 'blocks': blocks, 'cuts': cuts}


def active_rms(seg):
    act = seg[np.abs(seg) > 0.02]
    return float(np.sqrt(np.mean(act ** 2))) if len(act) else 1e-6


takes = {t: load_take(t) for t in ({p[0] for p in PLAN} if PLAN else {one})}
if not PLAN:
    PLAN = [(one, k) for k in range(len(takes[one]['blocks']))]
# one gain per spliced take: active-speech RMS over the sentences both takes have (same text), relative to the base take
gain = {t: 1.0 for t in takes}
norm = lambda x: re.sub(r'[^a-z0-9]', '', x.lower())
txt = lambda T, k: ' '.join(norm(T['words'][i]['w']) for i in T['blocks'][k])
for t in takes:
    if t == BASE or BASE not in takes:
        continue
    A, B = takes[BASE], takes[t]
    shared = [(ka, kb) for ka in range(len(A['blocks'])) for kb in range(len(B['blocks'])) if txt(A, ka) == txt(B, kb)]
    seg = lambda T, k: T['x'][int(T['cuts'][k] * SR):int(T['cuts'][k + 1] * SR)]
    ra = active_rms(np.concatenate([seg(A, ka) for ka, _ in shared]))
    rb = active_rms(np.concatenate([seg(B, kb) for _, kb in shared]))
    gain[t] = ra / rb
    print(f'{t}: gain {20 * np.log10(gain[t]):+.2f} dB to match {BASE} over {len(shared)} shared sentences')

out, placed, t_out = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
XF = int(0.008 * SR)
joins = []
for k, (take, kb) in enumerate(PLAN):
    T = takes[take]
    a, b = T['cuts'][kb], T['cuts'][kb + 1]
    seg = T['x'][int(a * SR):int(b * SR)].copy() * gain[take]
    if k > 0: seg[:XF] *= np.linspace(0, 1, XF)
    if k < len(PLAN) - 1: seg[-XF:] *= np.linspace(1, 0, XF)
    blk = T['blocks'][kb]
    for i in blk:
        w = T['words'][i]
        placed.append({'w': w['w'], 's': round(t_out + w['s'] - a, 3), 'e': round(t_out + w['e'] - a, 3), 'b': k, 'take': take})
    if k > 0: joins.append([round(t_out, 3), PLAN[k - 1][0], take])
    out.append(seg); t_out += len(seg) / SR
    gap = EXTRA.get(T['words'][blk[-1]]['w'], 0.0)
    if gap:
        out.append(np.zeros(int(gap * SR), np.float32)); t_out += gap
y = np.concatenate(out)
os.makedirs(os.path.join(ROOT, 'source/public/rocket'), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le',
                os.path.join(ROOT, 'source/public/rocket/narration.wav')], input=y.tobytes(), check=True)
end = len(y) / SR
# Word times: the take's own alignment drifts late at some sentence ends (up to 0.3 s), so when an independent Scribe
# transcription of this placed file exists (audio/rocket/scribe/placed_verify.json: the file uploaded as plain audio,
# not aligned to the prompt) and it has the same words, its times are used. The script's own text and punctuation stay.
if os.path.exists(VERIFY):
    vd = json.load(open(VERIFY))
    vw = [w for w in (vd['words'] if isinstance(vd, dict) else vd) if w.get('type', 'word') == 'word']
    if len(vw) == len(placed) and all(norm(a['w']) == norm(b['text']) for a, b in zip(placed, vw)):
        for a, b in zip(placed, vw):
            a['s'], a['e'] = round(b['start'], 3), round(b['end'], 3)
        print('word times: independent transcription (all', len(vw), 'words match the script)')
    else:
        print('WARNING: verification transcript does not match the placed words; keeping aligner times')
for w in placed:
    w['e'] = round(min(w['e'], end - 0.02), 3)
json.dump({'takes': {t: T['take'] for t, T in takes.items()}, 'plan': PLAN, 'gain_db': {t: round(20 * np.log10(g), 2) for t, g in gain.items()}, 'dur': round(end, 3), 'extra': EXTRA, 'joins': joins, 'words': placed},
          open(os.path.join(ROOT, 'source/src/data/rocket_words.json'), 'w'), indent=0)
span = placed[-1]['e'] - placed[0]['s']
print(f'narration.wav {end:.2f}s, {len(placed)} words, {60 * len(placed) / span:.0f} wpm over {span:.2f}s')
for k in range(len(PLAN)):
    ws = [w for w in placed if w['b'] == k]
    print(f"  {ws[0]['s']:6.2f}-{ws[-1]['e']:6.2f}  {' '.join(w['w'] for w in ws)}")
