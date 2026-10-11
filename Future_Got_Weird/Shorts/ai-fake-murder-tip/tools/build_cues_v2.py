#!/usr/bin/env python3
"""The single clock for V2 'AI Sent Police a Fake Murder Tip'.

Reads  audio/narration_v2/narration_v2_alignment.json   (Scribe word times of the chosen, edited narration)
       audio/narration_v2/narration_v2_final_48k.wav    (to refine sentence-final word ends from the actual audio)
Writes audio/cues_v2.json, source/src/v2/cues.ts, FGW_AI_Fake_Murder_Tip_V2.srt

Every scene start, motion beat, effect, music pocket and caption derives from a word of the narration (plus a small offset in seconds
where an anticipation is wanted). Nothing else in the V2 project carries timing.   Run: python3 tools/build_cues_v2.py
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
    # B1 immediate act (ink): the AI pointer is already travelling; contact on "sent"
    'b1.press': S[1],
    'b1.sent': S[1] + 0.07,
    'b1.police': S[2],            # POLICE TIP header pulses on "police"
    'b1.fake': S[4],              # FAKE stamp lands on "fake"
    'b1.zoom': S[6],              # the message box of the pressed window expands into the quoted excerpt as "tip." ends
    # B2 invented sighting: literal excerpt, three lines on the spoken words, highlight on "matching the description"
    'b2.start': S[7] - 0.20,
    'b2.line1': S[7],
    'b2.line2': S[11] - 0.04,
    'b2.line3': S[13] - 0.02,
    'b2.hl0': S[12],
    'b2.hl1': V[14],
    # B3 first reveal (cream): transition on "Except…", checker inspects, stamp on "no"
    'b3.start': S[15] - 0.05,
    'b3.checker': S[15] + 0.08,
    'b3.scan0': S[16] - 0.04,
    'b3.stamp': S[19],
    'b3.brow': S[19] + 0.22,
    'b3.look': S[20] - 0.02,
    'b3.back': V[20] - 0.20,
    'b3.blink': V[20] - 0.02,
    # B4 why it happened: test context, then the real form
    'b4.start': S[21] - 0.28,
    'b4.chip1': S[21],
    'b4.chip2': S[25] - 0.04,
    'b4.hop1': S[25] + 0.06,
    'b4.hop2': S[26] - 0.02,
    'b4.hop3': V[26] + 0.12,
    'b4.grow': S[27] - 0.06,
    'b4.real': S[30],
    'b4.form': S[31] + 0.02,
    # B5 outcome: the form folds into the envelope, travels, is diverted into SPAM
    'b5.fold': S[33] - 0.02,
    'b5.go': S[34] - 0.04,
    'b5.inbox': S[36],
    'b5.divert': S[37] - 0.06,
    'b5.land': V[38] - 0.08,
    'b5.latch': V[38] + 0.05,
    'b5.tray': S[39] - 0.06,
    'b5.never': S[40],
    'b5.eyes': S[39],
    # B6 meaning (ink)
    'b6.start': V[43] + 0.02,
    'b6.bubble': S[44] - 0.06,
    'b6.attr': S[44] + 0.05,
    'b6.squiggle': S[46],
    'b6.tail': S[51] - 0.04,
    'b6.btn': S[54] - 0.04,
    'b6.arrive': S[55] + 0.06,
    'b6.unlock': S[55] + 0.10,
    'loop.build': SPEECH_END + 0.36,
    'voice.end': SPEECH_END,
    # music pockets (seconds)
    'pocket1.in': S[16] - 0.36,
    'pocket1.out': S[20] - 0.10,
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
out_caps = [{'from': f(c['start']), 'to': f(c['end']), 'words': c['words'], 'em': [i - c['a'] for i in c['em']], 'emAt': [f(t) for t in c['emAt']], 'pop': c['pop']} for c in caps]

# ---------------------------------------------------------------------------------------- outputs
cues = {'fps': FPS, 'total_frames': TOTAL, 'events_sec': {k: round(v, 3) for k, v in EV_SEC.items()}, 'events': EV,
        'captions': [{'start': round(c['start'], 3), 'end': round(c['end'], 3), 'text': ' '.join(c['words']), 'accent': [W[i]['text'] for i in c['em']]} for c in caps],
        'words': [{'i': i, 'text': w['text'], 'start': S[i], 'end': E[i], 'voice_end': V[i]} for i, w in enumerate(W)]}
json.dump(cues, open(f'{ROOT}/audio/cues_v2.json', 'w'), indent=1)
os.makedirs(f'{ROOT}/source/src/v2', exist_ok=True)
ts = ['// GENERATED by tools/build_cues_v2.py from audio/narration_v2/narration_v2_alignment.json. Do not edit by hand.',
      "export type Cap = {from: number; to: number; words: string[]; em: number[]; emAt: number[]; pop: boolean};",
      f'export const TOTAL = {TOTAL};',
      'export const EV = ' + json.dumps(EV, indent=1) + ' as const;',
      'export const CAPS: Cap[] = ' + json.dumps(out_caps) + ';',
      'export const WORD_START: number[] = ' + json.dumps([round(s, 3) for s in S]) + ';',
      'export const WORD_END: number[] = ' + json.dumps([round(v, 3) for v in V]) + ';',
      'export const WORDS: string[] = ' + json.dumps([w['text'] for w in W]) + ';']
open(f'{ROOT}/source/src/v2/cues.ts', 'w').write('\n'.join(ts) + '\n')


def srt_t(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


with open(f'{ROOT}/FGW_AI_Fake_Murder_Tip_V2.srt', 'w') as fh:
    for i, c in enumerate(caps, 1):
        words = c['words']; text = ' '.join(words)
        if len(words) >= 4:
            k = (len(words) + 1) // 2
            text = ' '.join(words[:k]) + '\n' + ' '.join(words[k:])
        fh.write(f'{i}\n{srt_t(c["start"])} --> {srt_t(c["end"])}\n{text}\n\n')

# ---------------------------------------------------------------------------------------- self-checks
assert ' '.join(w['text'] for w in W) == ' '.join(sum([c['words'] for c in caps], [])), 'caption words must equal the transcript in order'
for c in caps: assert c['end'] >= V[c['b']] - 1e-9, ('cue ends before its final word', c['words'])
names = list(EV_SEC)
print('events', len(EV), '| captions', len(caps), '| total', TOTAL, f'frames ({TOTAL / FPS:.3f} s) | first word at {S[0]:.2f} s | speech end {SPEECH_END:.3f} s')
for k in ['b1.press', 'b2.start', 'b3.start', 'b3.stamp', 'b4.start', 'b5.fold', 'b5.divert', 'b5.land', 'b6.start', 'b6.arrive', 'loop.build']:
    print(f'  {k:12s} {EV_SEC[k]:6.2f}s  f{EV[k]}')
