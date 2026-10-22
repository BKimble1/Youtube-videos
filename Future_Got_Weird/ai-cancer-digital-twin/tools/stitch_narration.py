# Build the locked narration from one take per block (selection in audio/narration/voice_provenance.json → "selected").
# Each take is trimmed at its measured speech onset/offset (waveform), joined with fixed section gaps, and the Scribe
# word timings are shifted onto the new timeline. Captions use the locked script text, aligned to these words.
import json, subprocess, io, re, numpy as np, soundfile as sf
SR = 48000
LEAD = 0.30          # voice starts 0.30 s into the film (the mechanism is already moving on frame 0)
GAP = 0.80           # silence between sections (beyond each take's own trimmed breath)
TAIL = 3.2           # hold after the last word for the final image + music release
SEL = ['b1_t1_eCYL.mp3', 'b2_t1_T6K5.mp3', 'b3_t1_g0oU.mp3', 'b4_t1_6bgw.mp3', 'b5_t1_10My.mp3', 'b6_t1_0Gav.mp3']
offs = {o['take']: o for o in json.load(open('audio/narration/candidates_offsets.json'))}
allw = [w for w in json.load(open('audio/narration/candidates_words.json'))['words'] if w.get('type', 'word') == 'word']

def load(f):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', 'audio/narration/takes/' + f, '-f', 'wav', '-ac', '1', '-ar', str(SR), '-acodec', 'pcm_f32le', '-'])
    return sf.read(io.BytesIO(raw))[0]

def bounds(y):
    # 10 ms RMS envelope; speech = above -45 dBFS
    hop = SR // 100
    env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2) + 1e-12) for i in range(0, len(y) - hop, hop)])
    on = np.where(20 * np.log10(env) > -45)[0]
    return on[0] * hop / SR, (on[-1] + 1) * hop / SR

out, words, pieces, t = [np.zeros(int(LEAD * SR))], [], [], LEAD
for bi, f in enumerate(SEL):
    y = load(f)
    s0, s1 = bounds(y)
    a, b = max(0, s0 - 0.04), min(len(y) / SR, s1 + 0.12)
    seg = y[int(a * SR):int(b * SR)].copy()
    fi, fo = int(0.01 * SR), int(0.08 * SR)
    seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    o = offs[f]
    for w in allw:
        if o['offset'] - 0.5 <= w['start'] < o['offset'] + o['dur'] + 0.5:
            ws, we = w['start'] - o['offset'], w['end'] - o['offset']
            words.append({'text': w['text'], 'start': round(max(t, t + ws - a), 3), 'end': round(t + we - a, 3), 'block': f'B{bi + 1}'})
    pieces.append({'block': f'B{bi + 1}', 'take': f, 'take_range_s': [round(a, 3), round(b, 3)], 'start': round(t, 3), 'length': round(b - a, 3)})
    out.append(seg); t += b - a
    if bi < len(SEL) - 1:
        out.append(np.zeros(int(GAP * SR))); t += GAP
out.append(np.zeros(int(TAIL * SR))); t += TAIL
y = np.concatenate(out)
sf.write('audio/narration/narration.wav', y, SR, subtype='PCM_24')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/narration/narration.wav', '-b:a', '192k', 'source/public/audio/narration.mp3'], check=True)

# locked script → caption tokens aligned to the Scribe words (compounds like "immune-cell" span two Scribe words)
script = open('production/SCRIPT_LOCKED.txt').read()
toks = [x for x in re.split(r'\s+|(?<=—)|(?=—)', script) if x and x != '—']
toks = [x.replace('—', '') for x in toks]
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('’', "'"))
aligned, j = [], 0
for tk in toks:
    want, got, st = norm(tk), '', None
    while got != want:
        if j >= len(words) or not want.startswith(got + norm(words[j]['text'])):
            raise SystemExit(f'alignment failed at "{tk}" vs "{words[j]["text"] if j < len(words) else "EOF"}"')
        got += norm(words[j]['text']); st = words[j]['start'] if st is None else st; en = words[j]['end']; j += 1
    aligned.append({'text': tk, 'start': st, 'end': en})
assert j == len(words), (j, len(words))
json.dump({'duration': round(t, 3), 'lead': LEAD, 'gap': GAP, 'tail': TAIL, 'pieces': pieces, 'words': words, 'script_words': aligned},
          open('source/src/data/narration_words.json', 'w'), indent=1)
print('duration', round(t, 3), 'speech end', words[-1]['end'], 'words', len(words), 'script tokens', len(aligned))
