"""Assemble the V5 narration (no new generation): the V4 assembly with three more recap sentences removed (S9_00, S9_05,
S9_06) and the closing line placed straight after "the tower takes the load." —
as before:  the new opening (N0), the V2 recording with the brief's sentence cuts and tightened
pauses, and the new closing line (N9 replaces S9_07). No word is stretched, sped up or pitch-shifted; edits fall in the
quiet between sentences, with 12 ms fades.

Inputs : source/public/audio/v2/narration.wav + source/src/v2/data/narr.json (V2 recording on its own timeline),
         audio/v4/takes/{N0,N9} picks (audio/v4/picks.json) + audio/v4/scribe/{N0,N9}_words.json
Outputs: source/public/audio/v5/narration.wav, source/src/v5/data/narr.json, audio/v5/edit_list.json
"""
import json, os, re, subprocess
import numpy as np
import soundfile as sf

ROOT = __file__.rsplit('/tools/', 1)[0]
SR = 48000
V2, _sr = sf.read(f'{ROOT}/source/public/audio/v2/narration.wav', dtype='float32')
assert _sr == SR
if V2.ndim > 1:
    V2 = V2.mean(1)
N2 = json.load(open(f'{ROOT}/source/src/v2/data/narr.json'))
L2 = {l['id']: l for l in N2['lines']}
picks = json.load(open(f'{ROOT}/audio/v4/picks.json'))['picks']

# ---- what is cut (brief §3), by line id ----
CUT = ['S0_00', 'S0_01', 'S0_02', 'S1_00', 'S1_01', 'S1_02', 'S1_03', 'S1_04', 'S1_05', 'S1_06', 'S1_07',  # replaced by N0
       'S3_01', 'S3_06', 'S3_07', 'S3_08', 'S4_07', 'S4_08', 'S4_09', 'S5_06', 'S5_07',
       'S6_04', 'S6_05', 'S6_06', 'S7_05', 'S8_06', 'S9_07',                                              # S9_07 → N9
       'S9_00', 'S9_05', 'S9_06']                                                                         # V5 recap cuts
# ---- pauses after a line (seconds of silence between the last word and the next first word) ----
SECTION_GAP = 0.9   # between chapters (V2/V3 had 1.4–2.2 s)
JOIN_GAP = 0.6      # where a cut removed the sentences in between
CAP = 0.85          # longest ordinary pause inside a paragraph
HOLD = {            # deliberate beats kept longer for picture
    'N0_07': 0.8,   # hook → "Look closely at that first catch"
    'S4_02': 0.9, 'S4_03': 1.6,   # the real flip develops under "Watch the change."
    'S6_01': 1.3, 'S6_02': 1.3,   # each error example plays out and resets
    'S6_03': 1.3,
    'S8_05': 1.4,   # breath before the final approach begins
    'S9_03': 1.0,   # the upright rotation completes in clear air
    'S9_04': 2.4,   # load transferred, engines off, settled — then the payoff line over the end screen
}


def load_take(fn):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{ROOT}/audio/v4/takes/{fn}', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def fade(x, n=int(0.012 * SR)):
    x = x.copy()
    n = min(n, len(x) // 2)
    r = np.linspace(0, 1, n, dtype=np.float32)
    x[:n] *= r
    x[-n:] *= r[::-1]
    return x


def clean(w):
    return w.strip()


# new lines: split the opening take into sentences on the Scribe words (tags dropped)
def new_lines(key, ids_texts):
    W = [w for w in json.load(open(f'{ROOT}/audio/v4/scribe/{key}_words.json'))['words'] if not w['text'].startswith('[')]
    out, i = [], 0
    for lid, text in ids_texts:
        n = len(text.replace('—', ' ').split())
        ws = W[i:i + n]
        # Scribe keeps "too—after" as one token
        while ' '.join(w['text'] for w in ws).replace('—', ' ').split() != text.replace('—', ' ').split() and i + n < len(W):
            n -= 1
            ws = W[i:i + n]
            if n <= 0:
                raise SystemExit(f'cannot align {lid}')
        out.append({'id': lid, 'text': text, 'words': [{'w': clean(w['text']), 's': w['start'], 'e': w['end']} for w in ws]})
        i += n
    assert i == len(W), (key, i, len(W))
    return out


N0 = new_lines('N0', [
    ('N0_00', 'SpaceX has already caught the booster.'),
    ('N0_01', 'Now Elon Musk says Flight Fifteen will try to catch the spacecraft too—after it comes back from orbit.'),
    ('N0_02', 'He announced it on October twentieth: both stages, one mission.'),
    ('N0_03', 'Super Heavy is the booster underneath.'),
    ('N0_04', 'Starship is the spacecraft on top.'),
    ('N0_05', 'They launch together, then return separately.'),
    ('N0_06', 'The hard part is that second catch.'),
    ('N0_07', 'Miss badly, and the rocket could take the catcher with it.'),
])
N9 = new_lines('N9', [('N9_00', "That's the Flight Fifteen challenge: bring both stages home. Flying them again is the payoff.")])
xN0, xN9 = load_take(picks['N0']), load_take(picks['N9'])

# ---- blocks: a run of consecutive kept V2 lines copied as one piece of audio (no edit inside) ----
order = [l['id'] for l in N2['lines']]
kept = [i for i in order if i not in CUT]
blocks, cur = [], []
for lid in kept:
    if cur:
        prev = cur[-1]
        adjacent = order.index(lid) == order.index(prev) + 1
        same_sec = L2[lid]['sec'] == L2[prev]['sec']
        natural = L2[lid]['s'] - L2[prev]['e']
        if adjacent and same_sec and natural <= CAP and prev not in HOLD:
            cur.append(lid)
            continue
        blocks.append(cur)
    cur = [lid]
blocks.append(cur)

PRE, POST = 0.10, 0.22   # audio kept before the first / after the last word of a block (breath in, decay out)
pieces = []  # (kind, audio, words-with-local-times, line records, gap_after)
# opening
for k, l in enumerate(N0):
    a = max(0, l['words'][0]['s'] - PRE)
    b = l['words'][-1]['e'] + POST
    if k + 1 < len(N0):
        b = min(b, (l['words'][-1]['e'] + N0[k + 1]['words'][0]['s']) / 2)
    if k > 0:
        a = max(a, (N0[k - 1]['words'][-1]['e'] + l['words'][0]['s']) / 2)
    nat = N0[k + 1]['words'][0]['s'] - l['words'][-1]['e'] if k + 1 < len(N0) else HOLD['N0_07']
    pieces.append(dict(src='N0', a=a, b=b, lines=[l], gap=min(HOLD.get(l['id'], nat), max(nat, 0.25))))
for bl in blocks:
    l0, l1 = L2[bl[0]], L2[bl[-1]]
    i_next = order.index(bl[-1]) + 1
    nxt = L2[order[i_next]] if i_next < len(order) else None
    prv = L2[order[order.index(bl[0]) - 1]] if order.index(bl[0]) > 0 else None
    a = l0['s'] - PRE if not prv else max(l0['s'] - PRE, (prv['e'] + l0['s']) / 2)
    b = l1['e'] + POST if not nxt else min(l1['e'] + POST, (l1['e'] + nxt['s']) / 2)
    nxt_kept = kept[kept.index(bl[-1]) + 1] if kept.index(bl[-1]) + 1 < len(kept) else None
    if bl[-1] in HOLD:
        gap = HOLD[bl[-1]]
    elif nxt_kept is None:
        gap = 0.8
    elif L2[nxt_kept]['sec'] != l1['sec']:
        gap = SECTION_GAP
    elif order.index(nxt_kept) != i_next:
        gap = JOIN_GAP
    else:
        gap = min(CAP, L2[nxt_kept]['s'] - l1['e'])
    lines = []
    for lid in bl:
        ws = [w for w in N2['words'] if w['line'] == lid]
        lines.append({'id': lid, 'text': L2[lid]['text'], 'words': [{'w': w['w'], 's': w['s'], 'e': w['e']} for w in ws]})
    pieces.append(dict(src='V2', a=a, b=b, lines=lines, gap=gap))
    if bl[-1] == 'S9_04':
        n9 = N9[0]
        pieces.append(dict(src='N9', a=max(0, n9['words'][0]['s'] - PRE), b=n9['words'][-1]['e'] + 0.3, lines=[n9], gap=0.0))

# ---- lay the pieces on the new timeline ----
LEAD = 0.25
out, t = [np.zeros(int(LEAD * SR), np.float32)], LEAD
lines_out, words_out, edits = [], [], []
for p in pieces:
    srcx = {'V2': V2, 'N0': xN0, 'N9': xN9}[p['src']]
    seg = fade(srcx[int(p['a'] * SR):int(p['b'] * SR)])
    first_word = p['lines'][0]['words'][0]['s']
    t0 = t + (first_word - p['a'])  # where the first word lands
    off = t - p['a']
    for l in p['lines']:
        ws = [dict(line=l['id'], w=w['w'], s=round(w['s'] + off, 3), e=round(w['e'] + off, 3)) for w in l['words']]
        words_out += ws
        sec = l['id'][:2] if l['id'][0] == 'S' else ('S0' if l['id'].startswith('N0') else 'S9')
        lines_out.append(dict(id=l['id'], sec=sec, s=ws[0]['s'], e=ws[-1]['e'], text=l['text']))
    edits.append(dict(src=p['src'], src_in=round(p['a'], 3), src_out=round(p['b'], 3), film_in=round(t, 3), lines=[l['id'] for l in p['lines']]))
    out.append(seg)
    t += len(seg) / SR
    last_word_end = p['lines'][-1]['words'][-1]['e'] + off
    tail = t - last_word_end
    pad = max(0.0, p['gap'] - tail - (0.10 if p is not pieces[-1] else 0))  # next piece starts PRE (≈0.1 s) before its first word
    out.append(np.zeros(int(round(pad * SR)), np.float32))
    t += round(pad * SR) / SR
y = np.concatenate(out)
dur = len(y) / SR
secs = []
for sid in sorted({l['sec'] for l in lines_out}, key=lambda s: int(s[1:])):
    ls_ = [l for l in lines_out if l['sec'] == sid]
    secs.append(dict(id=sid, s=round(min(l['s'] for l in ls_) - 0.06, 3), e=round(max(l['e'] for l in ls_) + 0.05, 3)))
os.makedirs(f"{ROOT}/source/public/audio/v5", exist_ok=True)
os.makedirs(f'{ROOT}/source/src/v5/data', exist_ok=True)
sf.write(f'{ROOT}/source/public/audio/v5/narration.wav', y, SR, subtype='PCM_24')
json.dump(dict(duration=round(dur, 3), sections=secs, lines=lines_out, words=words_out), open(f'{ROOT}/source/src/v5/data/narr.json', 'w'), indent=0)
json.dump(dict(cut=CUT, section_gap=SECTION_GAP, join_gap=JOIN_GAP, cap=CAP, hold=HOLD, edits=edits), open(f'{ROOT}/audio/v5/edit_list.json', 'w'), indent=1)
print(f'narration {dur:.2f} s, {len(lines_out)} lines, {len(words_out)} words, {len(edits)} pieces')
for l in lines_out:
    print(f"{l['id']:6} {l['s']:7.2f} {l['e']:7.2f}  {l['text'][:70]}")
