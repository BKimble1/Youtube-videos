#!/usr/bin/env python3
"""The single clock for V3 Final 'AI Sent Police a Fake Murder Tip' (same approved narration and Scribe alignment as V2).

Reads  audio/narration_v2/narration_v2_alignment.json   (Scribe word times of the chosen, edited narration)
       audio/narration_v2/narration_v2_final_48k.wav    (to refine sentence-final word ends from the actual audio)
Writes audio/cues_v3.json, source/src/v3/cues.ts, captions/FGW_AI_Fake_Murder_Tip_V3_Final.srt

Every scene start, motion beat, effect, music pocket and caption derives from a word of the narration (plus a small offset in seconds
where an anticipation is wanted). Nothing else in the V2 project carries timing.   Run: python3 tools/build_cues_v3.py
"""
import json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
data = json.load(open(f'{ROOT}/audio/narration_v2/narration_v2_alignment.json'))
W = data['words']
assert len(W) == 58, len(W)
S = [w['start'] for w in W]
E = [w['end'] for w in W]

# ---- display text: the locked script's own words and punctuation (Scribe normalises case and punctuation)
SCRIPT = ('AI sent police a fake murder tip. It claimed it remembered someone matching a description. Except… the page had no description. '
          'Claude did this while testing websites. It used a real police tip form. The spam filter caught it. Investigators never got the tip. '
          'AI making things up is one problem. Giving it a submit button is another.').split()
norm = lambda t: ''.join(ch for ch in t.lower() if ch.isalnum())
assert len(SCRIPT) == 58 and all(norm(a) == norm(b['text']) for a, b in zip(SCRIPT, W)), 'script words must match the aligned words'
for a, b in zip(SCRIPT, W): b['text'] = a

# ---- refine word ends from the audio: a silence (10 ms RMS < -38 dBFS, >= 120 ms) that starts inside/just after a word ends that word
with wave.open(f'{ROOT}/audio/narration_v2/narration_v2_final_48k.wav') as w:
    sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
win = int(0.010 * sr); n = len(x) // win
db = 20 * np.log10(np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
sil = []; i = 0
while i < n:
    if db[i] < -38.0:
        j = i
        while j < n and db[j] < -38.0: j += 1
        if (j - i) * 0.010 >= 0.12: sil.append(i * 0.010)
        i = j
    else: i += 1
V = []
for k in range(len(W)):
    nxt = S[k + 1] if k + 1 < len(W) else E[k]
    v = min(E[k], nxt)
    for s0 in sil:
        if S[k] + 0.05 <= s0 <= E[k] + 0.35 and s0 < nxt: v = s0; break
    V.append(round(max(v, S[k] + 0.05), 3))
SPEECH_END = V[-1]

TOTAL = 630            # 21.000 s: speech ends ~19.5 s, the last ~1.4 s returns the closing button geometry to the opening state


def f(sec): return int(round(sec * FPS))


# ---------------------------------------------------------------------------------------- events: name -> seconds
EV_SEC = {
    # ---- opening (ink): the whole premise is on frame 0; contact on "sent"; the submitted tip lifts, folds into an AI-marked envelope, travels, opens into the quote paper
    'h.ai': S[0], 'h.sent': S[1], 'h.police': S[2], 'h.a': S[3], 'h.fake': S[4], 'h.murder': S[5], 'h.tip': S[6],   # spoken words of the integrated headline caption
    'o.press': 0.40,
    'o.sent': 0.49,
    'o.lift': 0.55,
    'o.fold': 0.72,
    'o.env': 0.95,
    'o.travel': 1.25,
    'o.clear': 1.92,
    'o.open': 2.04,
    # ---- B2 the fabricated memory: the opened paper IS the quote surface; two phrase groups, one highlight
    'b2.paper': 2.15,
    'b2.line1': S[7] - 0.02,
    'b2.group2': S[11] - 0.04,
    'b2.hl0': S[12],
    'b2.hl1': V[14],
    # ---- B3 the contradiction (cream): the checker pulls the source page on "Except", scans, the label lands on "no description"
    'b3.start': S[15] - 0.05,
    'b3.pull': S[15],
    'b3.scan0': S[16] - 0.04,
    'b3.stamp': S[19] - 0.06,
    'b3.brow': S[19] + 0.20,
    'b3.look': S[20] - 0.04,
    'b3.back': V[20] - 0.20,
    'b3.blink': V[20] - 0.02,
    # ---- B4 test context -> the real form: three large pages pass under the AI pointer
    'b4.start': S[21] - 0.28,
    'b4.pageA': S[21] - 0.20,
    'b4.chip1': S[21],
    'b4.pageB': S[25] - 0.18,
    'b4.chip2': S[25] - 0.04,
    'b4.pageC': V[26] - 0.08,
    'b4.reach': S[27] - 0.12,
    'b4.grow': S[27] - 0.05,
    'b4.real': S[30],
    # ---- B5 outcome: the same envelope into SPAM
    'b5.fold': S[33] - 0.02,
    'b5.go': S[34] - 0.04,
    'b5.inbox': S[36],
    'b5.divert': S[37] - 0.06,
    'b5.land': V[38] - 0.08,
    'b5.latch': V[38] + 0.05,
    'b5.tray': S[39] - 0.06,
    'b5.never': S[40],
    # ---- B6 takeaway (ink)
    'b6.start': V[43] + 0.02,
    'b6.paper': S[44] - 0.06,
    'b6.contain': S[45],
    'b6.squiggle': S[46],
    'b6.tag': S[51] - 0.04,
    'b6.btn': S[54] - 0.04,
    'b6.arrive': S[55] + 0.06,
    'b6.enable': S[55] + 0.10,
    'b6.path': S[56],
    'loop.build': SPEECH_END + 0.36,
    'voice.end': SPEECH_END,
    # ---- music pockets (seconds): deep dip from just before "Except" through the missing-description reveal; shallow dip at the spam outcome
    'pocket1.in': S[15] - 0.14,
    'pocket1.out': V[20] + 0.10,
    'pocket2.in': V[37] - 0.10,
    'pocket2.out': S[39] + 0.30,
}
EV = {k: f(v) for k, v in EV_SEC.items()}

# ---------------------------------------------------------------------------------------- captions
# (first word, last word, accent word indices, pop)
CAP_DEF = [
    (0, 2, [2], False), (3, 6, [4], True),
    (7, 10, [], False), (11, 14, [12], False),
    (15, 15, [], False), (16, 20, [19, 20], True),
    (21, 23, [], False), (24, 26, [25], False),
    (27, 30, [30], False), (31, 33, [31], False),
    (34, 38, [35], True), (39, 43, [40], False),
    (44, 47, [], False), (48, 50, [], False),
    (51, 55, [54, 55], True), (56, 57, [], False),
]
HOLD = 0.09; LAST_HOLD = 0.36; HANDOFF = 0.20
caps = []
for k, (a, b, em, pop) in enumerate(CAP_DEF):
    caps.append({'a': a, 'b': b, 'start': S[a], 'end': V[b] + (LAST_HOLD if k == len(CAP_DEF) - 1 else HOLD), 'em': em, 'pop': pop})
for k, c in enumerate(caps):
    if k + 1 < len(caps):
        nxt = caps[k + 1]['start']
        if c['end'] > nxt or nxt - c['end'] < HANDOFF: c['end'] = nxt
    c['words'] = [W[i]['text'] for i in range(c['a'], c['b'] + 1)]
    c['emAt'] = [S[i] for i in c['em']]
INTEGRATED = {0, 1}   # the first sentence is the giant opening headline: no lane caption under it (the SRT still carries it)
out_caps = [{'from': f(c['start']), 'to': f(c['end']), 'words': c['words'], 'em': [i - c['a'] for i in c['em']], 'emAt': [f(t) for t in c['emAt']], 'pop': c['pop'], 'integrated': k in INTEGRATED} for k, c in enumerate(caps)]

# ---------------------------------------------------------------------------------------- outputs
cues = {'fps': FPS, 'total_frames': TOTAL, 'events_sec': {k: round(v, 3) for k, v in EV_SEC.items()}, 'events': EV,
        'captions': [{'start': round(c['start'], 3), 'end': round(c['end'], 3), 'text': ' '.join(c['words']), 'accent': [W[i]['text'] for i in c['em']]} for c in caps],
        'words': [{'i': i, 'text': w['text'], 'start': S[i], 'end': E[i], 'voice_end': V[i]} for i, w in enumerate(W)]}
json.dump(cues, open(f'{ROOT}/audio/cues_v3.json', 'w'), indent=1)
os.makedirs(f'{ROOT}/source/src/v3', exist_ok=True)
ts = ['// GENERATED by tools/build_cues_v2.py from audio/narration_v2/narration_v2_alignment.json. Do not edit by hand.',
      "export type Cap = {from: number; to: number; words: string[]; em: number[]; emAt: number[]; pop: boolean; integrated: boolean};",
      f'export const TOTAL = {TOTAL};',
      'export const EV = ' + json.dumps(EV, indent=1) + ' as const;',
      'export const CAPS: Cap[] = ' + json.dumps(out_caps) + ';',
      'export const WORD_START: number[] = ' + json.dumps([round(s, 3) for s in S]) + ';',
      'export const WORD_END: number[] = ' + json.dumps([round(v, 3) for v in V]) + ';',
      'export const WORDS: string[] = ' + json.dumps([w['text'] for w in W]) + ';']
open(f'{ROOT}/source/src/v3/cues.ts', 'w').write('\n'.join(ts) + '\n')


def srt_t(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


with open(f'{ROOT}/captions/FGW_AI_Fake_Murder_Tip_V3_Final.srt', 'w') as fh:
    # the first sentence is one SRT cue (it is the giant opening headline in the picture); every later phrase keeps its own cue
    cues_srt = [(caps[0]['start'], caps[1]['end'], 'AI sent police\na fake murder tip.')]
    for c in caps[2:]:
        words = c['words']; text = ' '.join(words)
        if len(words) >= 4:
            k = (len(words) + 1) // 2
            text = ' '.join(words[:k]) + '\n' + ' '.join(words[k:])
        cues_srt.append((c['start'], c['end'], text))
    for i, (a_, b_, text) in enumerate(cues_srt, 1):
        fh.write(f'{i}\n{srt_t(a_)} --> {srt_t(b_)}\n{text}\n\n')

# ---------------------------------------------------------------------------------------- self-checks
assert ' '.join(w['text'] for w in W) == ' '.join(sum([c['words'] for c in caps], [])), 'caption words must equal the transcript in order'
for c in caps: assert c['end'] >= V[c['b']] - 1e-9, ('cue ends before its final word', c['words'])
names = list(EV_SEC)
print('events', len(EV), '| captions', len(caps), '| total', TOTAL, f'frames ({TOTAL / FPS:.3f} s) | first word at {S[0]:.2f} s | speech end {SPEECH_END:.3f} s')
for k in ['o.press', 'o.travel', 'o.open', 'b2.line1', 'b3.start', 'b3.stamp', 'b4.start', 'b5.fold', 'b5.divert', 'b5.land', 'b6.start', 'b6.arrive', 'b6.path', 'loop.build']:
    print(f'  {k:12s} {EV_SEC[k]:6.2f}s  f{EV[k]}')
