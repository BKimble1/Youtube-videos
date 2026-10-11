#!/usr/bin/env python3
"""V3 cue table + captions. Same narration/alignment as V1; new shot events and 3-6 word caption cues.

Reads  audio/narration_alignment.json
Writes audio/cues_v3.json, source/src/cues_v3.ts, FGW_Atlas_No_Pinky_V3.srt
V1/V2 files are untouched. Run:  python3 tools/build_cues_v3.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
al = json.load(open(f'{ROOT}/audio/narration_alignment.json'))
words = al['words']
vad = al['measured_voice_ends_seconds']
W = [w['start'] for w in words]


def vend(i):
    return vad.get(words[i]['text'], words[i]['end'])


TOTAL_S = 34.60
TOTAL = round(TOTAL_S * FPS)  # 1038, unchanged from V1
fr = lambda t: int(round(t * FPS))

# shot boundaries (seconds). Beat ids keep the script mapping B01..B09.
BEATS = [('B01', 0.00, 3.20), ('B02', 3.20, 8.00), ('B03', 8.00, 10.30), ('B04', 10.30, 16.30), ('B05', 16.30, 20.25),
         ('B06', 20.25, 26.38), ('B07', 26.38, 29.65), ('B08', 29.65, 31.25), ('B09', 31.25, TOTAL_S)]

EV = {
    # B01 opener (frame 0 is already mid-action; the same scene plays at negative frames as the loop pre-roll)
    'V3.open.click': 0.37, 'V3.open.drop': 0.67, 'V3.open.reveal': 0.58, 'V3.gap.pop': W[3] - 0.08, 'V3.gap.pulse': W[4],
    'V3.label.purpose': W[5] + 0.02, 'V3.tape.wipe': 2.80,
    # B02 overhead experiment
    'V3.exp.wiggle': 3.70, 'V3.exp.push': 4.85, 'V3.exp.wrap': W[12] - 0.05, 'V3.exp.mug.grasp': 5.85, 'V3.exp.mug.set': 6.90,
    'V3.exp.knob.turn': 7.13, 'V3.exp.knob.detent': 7.42, 'V3.exp.day.done': 7.70, 'V3.label.day': W[19],
    # B03 decision slip
    'V3.slip.in': 8.00, 'V3.stamp.hover': 8.90, 'V3.stamp.hit': W[24], 'V3.iris.b04': 9.90,
    # B04 mechanism macro
    'V3.b04.badge1': W[31], 'V3.b04.badge2': W[31] + 0.18, 'V3.b04.badge3': W[31] + 0.36, 'V3.b04.badge4': W[31] + 0.54,
    'V3.b04.count': W[34], 'V3.b04.thumb': 12.95, 'V3.b04.splay': 13.72, 'V3.b04.curl1': 14.56, 'V3.b04.curl2': 14.95, 'V3.b04.curl3': 15.34,
    # B05 capabilities
    'V3.b05.pinch': 17.33, 'V3.b05.grip': 18.05, 'V3.b05.cut_b': 17.85, 'V3.b05.turn': 18.28, 'V3.b05.cut_c': 18.98, 'V3.b05.press': 19.14, 'V3.b05.contact': 19.36,
    'V3.b05.drive': 19.40, 'V3.b05.drive_end': 20.05,
    # B06 exploded hardware diagram
    'V3.b06.slide': 20.25, 'V3.b06.title': W[54] + 0.05, 'V3.b06.ghost': W[55], 'V3.b06.mod1': 21.70, 'V3.b06.mod2': 22.10, 'V3.b06.mod3': 22.50,
    'V3.b06.cost': W[63], 'V3.b06.space': W[65], 'V3.b06.service': W[69] - 0.03,
    # B07 / B08 workstation
    'V3.b07.slide': 26.38, 'V3.b07.label': W[75] + 0.12, 'V3.b07.place': 28.30, 'V3.b07.ok': 28.42, 'V3.b07.nod': W[77] - 0.08,
    'V3.b08.human': W[78], 'V3.b08.pick': 29.95, 'V3.b08.place': 30.62, 'V3.b08.ok': 30.72,
    # B09 receipt gag + closing tear into the opener
    'V3.b09.drop': 31.25, 'V3.b09.print': W[82], 'V3.b09.stamp': 33.30, 'V3.b09.click': vend(87) + 0.12, 'V3.loop.tear': 33.88,
}

# caption cues: (first_word, last_word, emphasis_word or None). 3-6 words each, <= 2 lines of <= 20 characters (checked by tools/qa_v3.py).
# V3: dramatic two-word beats get their own cue so a phrase is never shown before it is spoken; emphasis is timed to the aligned word.
GROUPS = [(0, 4, 4), (5, 6, 6), (7, 11, None), (12, 16, 12), (17, 21, 21), (22, 23, 23), (24, 26, 26), (27, 32, 31), (33, 37, 34), (38, 41, 41),
          (42, 47, 47), (48, 49, 48), (50, 53, 51), (54, 58, 55), (59, 61, 59), (62, 63, 63), (64, 65, 65), (66, 69, 69), (70, 75, 75), (76, 77, 76),
          (78, 81, 81), (82, 84, None), (85, 87, 87)]
MAXC = 20


def wrap(ws):
    t = ' '.join(ws)
    if len(t) <= MAXC:
        return [ws]
    best = min(range(1, len(ws)), key=lambda k: max(len(' '.join(ws[:k])), len(' '.join(ws[k:]))))
    a, b = ws[:best], ws[best:]
    assert max(len(' '.join(a)), len(' '.join(b))) <= MAXC, (t, a, b)
    return [a, b]


caps = []
for gi, (a, b, em) in enumerate(GROUPS):
    ws = [w['text'] for w in words[a:b + 1]]
    lines = wrap(ws)
    start = words[a]['start']
    end = vend(b) + 0.14
    if gi + 1 < len(GROUPS):
        end = min(end, words[GROUPS[gi + 1][0]]['start'] - 0.04)
    else:
        end = min(vend(b) + 0.50, EV['V3.loop.tear'] - 0.07)
    caps.append({'start': round(start, 3), 'end': round(end, 3), 'lines': [' '.join(l) for l in lines], 'em': (em - a) if em is not None else None, 'em_at': round(words[em]['start'], 3) if em is not None else None})


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


open(f'{ROOT}/FGW_Atlas_No_Pinky_V3.srt', 'w').write('\n'.join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n" + '\n'.join(c['lines']) + '\n' for i, c in enumerate(caps)))

out = {'fps': FPS, 'total_seconds': TOTAL_S, 'total_frames': TOTAL, 'narration_file': 'audio/narration_48k.wav',
       'beats': [{'id': i, 'start_s': s, 'end_s': e, 'start_frame': fr(s), 'end_frame': fr(e)} for i, s, e in BEATS],
       'events': {k: {'t': round(v, 3), 'frame': fr(v)} for k, v in EV.items()}, 'captions': caps,
       'pockets': {'D01': {'start_s': round(W[22] + 0.2, 3), 'end_s': round(W[24] + 0.05, 3)}, 'D02': {'start_s': round(W[82] - 0.25, 3), 'end_s': round(vend(87) + 0.3, 3)}}}
json.dump(out, open(f'{ROOT}/audio/cues_v3.json', 'w'), indent=1, ensure_ascii=False)

ts_lines = ['// GENERATED by tools/build_cues_v3.py from audio/narration_alignment.json — do not edit by hand.', f'export const TOTAL_V3 = {TOTAL};', '',
            'export const B3 = {']
for i, s, e in BEATS:
    ts_lines.append(f"  {i}: {{start: {fr(s)}, end: {fr(e)}}},")
ts_lines.append('} as const;\n')
ts_lines.append('export const V3 = {')
for k, v in EV.items():
    ts_lines.append(f"  '{k[3:]}': {fr(v)},")
ts_lines.append('} as const;\n')
ts_lines.append('/** Caption cues: lines, and the index of the one emphasised word in the joined text (null = none). */')
ts_lines.append('export const CAPTIONS_V3: {from: number; to: number; lines: string[]; em: number | null; emAt: number | null}[] = [')
for c in caps:
    ts_lines.append(f"  {{from: {fr(c['start'])}, to: {fr(c['end'])}, lines: {json.dumps(c['lines'], ensure_ascii=False)}, em: {json.dumps(c['em'])}, emAt: {fr(c['em_at']) if c['em_at'] is not None else 'null'}}},")
ts_lines.append('];')
open(f'{ROOT}/source/src/cues_v3.ts', 'w').write('\n'.join(ts_lines) + '\n')
print('v3 events', len(EV), 'caption cues', len(caps))
for c in caps:
    print(f"{c['start']:6.2f}-{c['end']:6.2f} {' / '.join(c['lines'])!r} em={c['em']}")
