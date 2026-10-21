"""Assemble the V2 narration from the picked Test Voice takes and the Scribe word timings.
Inputs: audio/v2/picks_concat.wav (+ _offsets.json), audio/v2/scribe/picks_concat_words.json, audio/v2/plan.json
Outputs: source/public/audio/v2/narration.wav, source/src/v2/data/narr.json (sections, lines, words on the film timeline)."""
import json, re
import numpy as np
import soundfile as sf

ROOT = __file__.rsplit('/tools/', 1)[0]
A = ROOT + '/audio/v2/'
x, SR = sf.read(A + 'picks_concat.wav', dtype='float32')
offs = json.load(open(A + 'picks_concat_offsets.json'))['offsets']
words = [w for w in json.load(open(A + 'scribe/picks_concat_words.json'))['words'] if w['type'] == 'word']
plan = json.load(open(A + 'plan.json'))
order = [s['id'] for s in plan['sections']]
ends = {k: (offs[order[i + 1]] - 1.0 if i + 1 < len(order) else len(x) / SR - 1.0) for i, k in enumerate(order)}


def quiet_point(seg, a, b):
    """Index (in seg) of the quietest 20 ms window between times a and b (section-local seconds)."""
    w = int(0.02 * SR)
    i0, i1 = int(a * SR), max(int(a * SR) + w + 1, int(b * SR))
    best, bi = 1e9, (i0 + i1) // 2
    for i in range(i0, i1 - w, w // 2):
        e = float(np.mean(seg[i:i + w] ** 2))
        if e < best:
            best, bi = e, i + w // 2
    return bi


out, t = [], 0.0
secs, lines, wout = [], [], []
for s in plan['sections']:
    k = s['id']
    lead = s['lead']
    out.append(np.zeros(int(round(lead * SR)), np.float32)); t += lead
    seg = x[int(round(offs[k] * SR)):int(round(ends[k] * SR))]
    sw = [dict(w, s=w['start'] - offs[k], e=w['end'] - offs[k]) for w in words if offs[k] - 0.05 <= w['start'] < ends[k]]
    # trim the take's own leading silence to 60 ms before the first word
    cut0 = max(0, int((sw[0]['s'] - 0.06) * SR))
    seg = seg[cut0:]
    for w in sw:
        w['s'] -= cut0 / SR; w['e'] -= cut0 / SR
    last = int(min(len(seg), (sw[-1]['e'] + 0.25) * SR))
    seg = seg[:last]
    # beats: insert silence at the quietest point of the pause after the named word
    inserts = []
    for word, nth, dur in s['beats']:
        norm = lambda v: re.sub(r'[^a-z0-9]', '', v.lower())
        idx = [i for i, w in enumerate(sw) if norm(w['text']) == norm(word)][nth]
        a = sw[idx]['e']; b = sw[idx + 1]['s'] if idx + 1 < len(sw) else a + 0.2
        inserts.append((quiet_point(seg, a, b), dur))
    inserts.sort()
    pieces, prev, shift = [], 0, []
    for p, dur in inserts:
        pieces += [seg[prev:p], np.zeros(int(round(dur * SR)), np.float32)]
        shift.append((p / SR, dur)); prev = p
    pieces.append(seg[prev:])
    seg = np.concatenate(pieces)
    def m(tl):
        return t + tl + sum(d for p, d in shift if p <= tl)
    secs.append({'id': k, 's': round(t, 3), 'e': round(t + len(seg) / SR, 3)})
    # lines = sentences
    cur, li = [], 0
    for w in sw:
        cur.append(w)
        if re.search(r'[.?!]$', w['text']) or w is sw[-1]:
            lid = f'{k}_{li:02d}'
            lines.append({'id': lid, 'sec': k, 's': round(m(cur[0]['s']), 3), 'e': round(m(cur[-1]['e']), 3), 'text': ' '.join(c['text'] for c in cur)})
            for c in cur:
                wout.append({'line': lid, 'w': c['text'], 's': round(m(c['s']), 3), 'e': round(m(c['e']), 3)})
            cur, li = [], li + 1
    out.append(seg); t += len(seg) / SR
out.append(np.zeros(int(plan['tail'] * SR), np.float32)); t += plan['tail']
y = np.concatenate(out)
import os
os.makedirs(ROOT + '/source/public/audio/v2', exist_ok=True)
os.makedirs(ROOT + '/source/src/v2/data', exist_ok=True)
sf.write(ROOT + '/source/public/audio/v2/narration.wav', y, SR, subtype='PCM_24')
json.dump({'duration': round(t, 3), 'sections': secs, 'lines': lines, 'words': wout}, open(ROOT + '/source/src/v2/data/narr.json', 'w'), indent=0)
print(f'duration {t:.2f}s ({int(t // 60)}:{t % 60:05.2f}), {len(lines)} lines, {len(wout)} words')
for s in secs:
    print(s)
