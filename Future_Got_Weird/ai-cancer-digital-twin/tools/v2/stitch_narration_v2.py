#!/usr/bin/env python3
"""V2 narration: join the chosen take of each block (v2/audio/narration/voice_provenance_v2.json) with short section
gaps, shift each take's word alignment onto the film timeline, and align the approved script text to those words.
    python3 tools/v2/stitch_narration_v2.py
Outputs: v2/audio/narration/narration_v2.wav, source/public/audio/narration_v2.mp3, source/src/v2/data/narration_v2.json"""
import json, subprocess, io, re, os, numpy as np, soundfile as sf
SR = 48000
LEAD, GAP, TAIL = 0.35, 0.55, 3.4      # voice starts 0.35 s in (picture already moving on frame 0); hold for the final image
D = 'v2/audio/narration/'
prov = json.load(open(D + 'voice_provenance_v2.json'))
blocks = [(b, f"{b.lower()}_{v['chosen']}.mp3") for b, v in prov['takes'].items()]

def load(f):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', D + 'takes/' + f, '-f', 'wav', '-ac', '1', '-ar', str(SR), '-acodec', 'pcm_f32le', '-'])
    return sf.read(io.BytesIO(raw))[0]

def bounds(y):
    hop = SR // 100
    env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2) + 1e-12) for i in range(0, len(y) - hop, hop)])
    on = np.where(20 * np.log10(env) > -45)[0]
    return on[0] * hop / SR, (on[-1] + 1) * hop / SR

out, words, pieces, t = [np.zeros(int(LEAD * SR))], [], [], LEAD
for bi, (b, f) in enumerate(blocks):
    y = load(f)
    s0, s1 = bounds(y)
    a, e = max(0, s0 - 0.04), min(len(y) / SR, s1 + 0.1)
    seg = y[int(a * SR):int(e * SR)].copy()
    fi, fo = int(0.01 * SR), int(0.08 * SR)
    seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    for w in json.load(open(D + f'words/{b.lower()}.json'))['words']:
        if w['text'].startswith('['):
            continue
        words.append({'text': w['text'], 'start': round(max(t, t + w['start'] - a), 3), 'end': round(t + w['end'] - a, 3), 'block': b})
    pieces.append({'block': b, 'take': f, 'take_range_s': [round(a, 3), round(e, 3)], 'start': round(t, 3), 'length': round(e - a, 3)})
    out.append(seg); t += e - a
    if bi < len(blocks) - 1:
        out.append(np.zeros(int(GAP * SR))); t += GAP
out.append(np.zeros(int(TAIL * SR))); t += TAIL
y = np.concatenate(out)
sf.write(D + 'narration_v2.wav', y, SR, subtype='PCM_24')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'narration_v2.wav', '-b:a', '192k', 'source/public/audio/narration_v2.mp3'], check=True)

script = open('v2/production/SCRIPT_V2_APPROVED.txt').read()
toks = script.split()
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('’', "'"))
aligned, j = [], 0
for tk in toks:
    want, got, st = norm(tk), '', None
    while got != want:
        if j >= len(words) or not want.startswith(got + norm(words[j]['text'])):
            raise SystemExit(f'alignment failed at "{tk}" vs "{words[j]["text"] if j < len(words) else "EOF"}"')
        got += norm(words[j]['text']); st = words[j]['start'] if st is None else st; en = words[j]['end']; j += 1
    aligned.append({'text': tk, 'start': st, 'end': en})
assert j == len(words)
os.makedirs('source/src/v2/data', exist_ok=True)
json.dump({'duration': round(t, 3), 'lead': LEAD, 'gap': GAP, 'tail': TAIL, 'pieces': pieces, 'words': words, 'script_words': aligned},
          open('source/src/v2/data/narration_v2.json', 'w'), indent=1)
print('duration', round(t, 3), 'last word end', words[-1]['end'], 'words', len(words), 'script tokens', len(aligned), '(script has', len(toks), ')')
