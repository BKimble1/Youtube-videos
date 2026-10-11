#!/usr/bin/env python3
"""The single clock for 'AI Invented a Murder Tip. Then Hit Send.'

Reads  audio/narration/narration_alignment.json   (Scribe word times + measured sentence-final voice ends)
Writes audio/cues.json, source/src/cues.ts, FGW_AI_Fake_Murder_Tip_V1.srt

Every scene start, motion beat, sound effect, music pocket and caption is derived here from a word of the narration
(plus a small offset in seconds where an anticipation is wanted). Nothing else in the project carries its own timing.
Run:  python3 tools/build_cues.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
TOTAL = 840            # 28.000 s; speech ends 27.0 s, the last ~1 s is the loop tail (closing match cut into frame 0)
data = json.load(open(f'{ROOT}/audio/narration/narration_alignment.json'))
W = data['words']
assert len(W) == 70
S = [w['start'] for w in W]                                        # word starts
E = [w['end'] for w in W]                                          # Scribe word ends (padded on sentence-final words)
V = [w.get('voice_end', min(w['end'], S[i + 1] if i + 1 < len(W) else w['end'])) for i, w in enumerate(W)]  # best end of speech


def f(sec):
    return int(round(sec * FPS))


# ---------------------------------------------------------------------------------------- events: name -> seconds
EV_SEC = {
    # B1  immediate hook (0-4.1 s): the AI cursor is already moving; press on "submitted"; POLICE TIP header on "real"
    'b1.fake': S[4],
    'b1.press': E[2],
    'b1.sent': E[2] + 0.04,
    'b1.real': S[9],
    # B2  evaluation workspace (browser-card match cut from the form)
    'b2.start': S[12] - 0.40,
    'b2.hop1': S[14],       # marker lands on card 1 ("evaluation,")
    'b2.hop2': S[17],       # card 2 ("testing")
    'b2.hop3': S[19] - 0.02,  # card 3 = the police page ("webpages.")
    'b2.light': S[19] + 0.24,
    # B3  the invented statement and the missing description
    'b3.start': S[20] - 0.34,
    'b3.type0': S[21],      # "claimed": soft keyboard cluster starts, text builds
    'b3.type1': S[27] - 0.05,
    'b3.match': S[25],      # "matching a description" highlight
    'b3.pocket': V[27],     # music pocket opens (gap before the reveal)
    'b3.lift': S[28],       # "The page ...": highlight lifts, page scrolls up to the case block
    'b3.tap': S[31],        # "even": the dry error tap and the outline snaps around the empty field
    'b3.react': S[34],      # "suspect.": the checker reaction follows the spoken reveal (never before)
    'b3.blink': S[34] + 0.40,
    'b3.out': S[35] - 0.10,
    # B4  submission consequence
    'b4.start': S[35] - 0.10,
    'b4.press': S[38] + 0.06,
    'b4.fold': S[38] + 0.10,
    'b4.send': S[38] + 0.28,
    'b4.arrive': S[39],     # envelope reaches the inbox ("Luckily,") - arrives BEFORE the folder responds
    'b4.flag': S[42],       # "flagged": the diverter swats it
    'b4.land': S[44] + 0.06,  # "spam.": lands in the SPAM folder
    'b4.latch': S[44] + 0.40,
    'b4.pocket0': S[44] - 0.28,  # music pocket around the spam reveal
    'b4.pocket1': S[45],
    'b4.tray': S[45],       # "Investigators": the empty tray appears
    'b4.never': S[46],      # "never": the blocked route
    # B5  evidence and date
    'b5.start': S[49] - 0.14,
    'b5.date1': S[49] + 0.12,
    'b5.line': S[50],
    'b5.date2': S[53],
    # B6  meaning and loop
    'b6.start': S[54] - 0.36,
    'b6.bubble1': S[54],
    'b6.things': S[56],
    'b6.bubble2': S[62],
    'b6.morph': S[66] - 0.08,
    'b6.button': S[67],
    'b6.arrive': V[69] - 0.12,
    'loop.build': V[69] + 0.20,   # the tip form grows around the button; frame 0 is the finished state
    'voice.end': V[69],
}
EV = {k: f(v) for k, v in EV_SEC.items()}

# ---------------------------------------------------------------------------------------- captions
# (first word, last word, emphasis word indices, pop 5 % on the emphasis)
CAP_DEF = [
    (0, 2, [], False), (3, 6, [4], True), (7, 11, [9], True),
    (12, 14, [], False), (15, 19, [], False),
    (20, 23, [], False), (24, 27, [27], False),
    (28, 31, [30, 31], True), (32, 34, [34], True),
    (35, 38, [38], False),
    (39, 44, [44], True), (45, 48, [46], False),
    (49, 53, [53], False),
    (54, 58, [57, 58], False), (59, 61, [61], False),
    (62, 64, [], False), (65, 69, [66, 67], True),
]
HOLD = 0.09            # seconds a phrase stays after its final word ends (60-120 ms), unless the next phrase hands off sooner
HANDOFF = 0.20         # if the next phrase starts within this many seconds after the end, hand off cleanly (no blank)
caps = []
for k, (a, b, em, pop) in enumerate(CAP_DEF):
    start = S[a]
    end = V[b] + HOLD
    caps.append({'a': a, 'b': b, 'start': start, 'end': end, 'em': em, 'pop': pop})
for k, c in enumerate(caps):
    if k + 1 < len(caps):
        nxt = caps[k + 1]['start']
        if c['end'] > nxt:                 # never overlap the next phrase
            c['end'] = nxt
        elif nxt - c['end'] < HANDOFF:     # clean handoff
            c['end'] = nxt
    c['words'] = [W[i]['text'] for i in range(c['a'], c['b'] + 1)]
    c['emAt'] = [S[i] for i in c['em']]

out_caps = [{'from': f(c['start']), 'to': f(c['end']), 'words': c['words'], 'em': [i - c['a'] for i in c['em']],
             'emAt': [f(t) for t in c['emAt']], 'pop': c['pop']} for c in caps]

# ---------------------------------------------------------------------------------------- outputs
os.makedirs(f'{ROOT}/audio', exist_ok=True)
cues = {'fps': FPS, 'total_frames': TOTAL, 'events_sec': {k: round(v, 3) for k, v in EV_SEC.items()}, 'events': EV,
        'captions': [{'start': round(c['start'], 3), 'end': round(c['end'], 3), 'text': ' '.join(c['words']), 'em': [W[i]['text'] for i in c['em']]} for c in caps],
        'words': [{'i': i, 'text': w['text'], 'start': S[i], 'end': E[i], 'voice_end': V[i]} for i, w in enumerate(W)]}
json.dump(cues, open(f'{ROOT}/audio/cues.json', 'w'), indent=1)

ts = ['// GENERATED by tools/build_cues.py from audio/narration/narration_alignment.json. Do not edit by hand.',
      "export type Cap = {from: number; to: number; words: string[]; em: number[]; emAt: number[]; pop: boolean};",
      f'export const TOTAL = {TOTAL};',
      'export const EV = ' + json.dumps(EV, indent=1) + ' as const;',
      'export const CAPS: Cap[] = ' + json.dumps(out_caps) + ';',
      'export const WORD_START: number[] = ' + json.dumps([round(s, 3) for s in S]) + ';',
      'export const WORD_END: number[] = ' + json.dumps([round(v, 3) for v in V]) + ';',
      'export const WORDS: string[] = ' + json.dumps([w['text'] for w in W]) + ';']
open(f'{ROOT}/source/src/cues.ts', 'w').write('\n'.join(ts) + '\n')


def srt_t(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


with open(f'{ROOT}/FGW_AI_Fake_Murder_Tip_V1.srt', 'w') as fh:
    for i, c in enumerate(caps, 1):
        words = c['words']
        text = ' '.join(words)
        if len(words) >= 5:  # two balanced lines for the longer phrases
            k = (len(words) + 1) // 2
            text = ' '.join(words[:k]) + '\n' + ' '.join(words[k:])
        fh.write(f'{i}\n{srt_t(c["start"])} --> {srt_t(c["end"])}\n{text}\n\n')

# ---------------------------------------------------------------------------------------- self-checks
assert ' '.join(w['text'] for w in W) == ' '.join(sum([c['words'] for c in caps], [])), 'caption words must equal the transcript in order'
for c in caps:
    assert c['end'] >= V[c['b']] - 1e-9, ('cue ends before its final word', c['words'])
print('events', len(EV), '| captions', len(caps), '| total frames', TOTAL, f'({TOTAL / FPS:.3f} s)')
print('last voice end', round(V[69], 3), 's -> tail', round(TOTAL / FPS - V[69], 3), 's')
