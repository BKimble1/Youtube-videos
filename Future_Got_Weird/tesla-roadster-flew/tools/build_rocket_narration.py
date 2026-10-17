#!/usr/bin/env python3
"""Rocket Short narration: place the sentences of the tightened Test Voice take (audio/rocket/tight/<take>.wav, made by
tools/tighten_rocket.py) on the film timeline. Sentences keep their recorded order and delivery; a few gaps are widened
where the picture needs a beat (the match into the cutaway, the tank's protective frame closing, the correction landing,
the dust wipe, the touchdown). No time-stretch, no pitch change. Each block is cut in the middle of its silence.
usage: build_rocket_narration.py [take]   (default r_t1)
Outputs: source/public/rocket/narration.wav (48 kHz mono) and source/src/data/rocket_words.json"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
take = sys.argv[1] if len(sys.argv) > 1 else 'r_t1'
SR = 48000
LEAD = 0.04   # the first word starts on frame 1 or 2
# extra seconds of silence after the sentence ending with this word (picture beats); everything else stays as recorded
EXTRA = {'catch.': 0.12, 'protection.': 0.20, 'too.': 0.25, 'flying.': 0.20, 'problems.': 0.15}
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

# sentence blocks
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

out, placed, t_out = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
XF = int(0.008 * SR)
for k, blk in enumerate(blocks):
    a, b = cuts[k], cuts[k + 1]
    seg = x[int(a * SR):int(b * SR)].copy()
    if k > 0: seg[:XF] *= np.linspace(0, 1, XF)
    if k < len(blocks) - 1: seg[-XF:] *= np.linspace(1, 0, XF)
    for i in blk:
        w = words[i]
        placed.append({'w': w['w'], 's': round(t_out + w['s'] - a, 3), 'e': round(t_out + w['e'] - a, 3), 'b': k})
    out.append(seg); t_out += len(seg) / SR
    gap = EXTRA.get(words[blk[-1]]['w'], 0.0)
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
VERIFY = os.path.join(ROOT, 'audio/rocket/scribe/placed_verify.json')
norm = lambda x: re.sub(r'[^a-z0-9]', '', x.lower())
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
json.dump({'take': tight['take'], 'dur': round(end, 3), 'extra': EXTRA, 'words': placed},
          open(os.path.join(ROOT, 'source/src/data/rocket_words.json'), 'w'), indent=0)
span = placed[-1]['e'] - placed[0]['s']
print(f'narration.wav {end:.2f}s, {len(placed)} words, {60 * len(placed) / span:.0f} wpm over {span:.2f}s')
for k, blk in enumerate(blocks):
    ws = [w for w in placed if w['b'] == k]
    print(f"  {ws[0]['s']:6.2f}-{ws[-1]['e']:6.2f}  {' '.join(w['w'] for w in ws)}")
