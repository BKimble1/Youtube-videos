#!/usr/bin/env python3
"""Single audio-derived cue table for the Atlas Short.

Reads audio/narration_alignment.json (Scribe word times + ffmpeg-measured voice ends) and writes:
  audio/cues.json                  authoritative cue table (seconds + frames)
  source/src/cues.ts               same table for Remotion
  FGW_Atlas_No_Pinky.srt           captions from the real alignment
Event times are hand-placed against named words (W[i] = start of word i, E[i] = end of word i).
Run:  python3 tools/build_cues.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
al = json.load(open(f'{ROOT}/audio/narration_alignment.json'))
words = al['words']
vad = al['measured_voice_ends_seconds']
W = [w['start'] for w in words]


def voice_end(i):
    return vad.get(words[i]['text'], words[i]['end']) if words[i]['text'] in vad else words[i]['end']


TOTAL_S = 34.60
TOTAL = round(TOTAL_S * FPS)  # 1038

# ---- beats (seconds). Paragraph n of the script -> Bn. Boundaries sit in the gaps between spoken paragraphs.
BEATS = [
    ('B01', 'Missing-position hook', 0.00, 3.20),
    ('B02', 'Taped-hand reenactment', 3.20, 8.10),
    ('B03', 'Decision stamp', 8.10, 10.30),
    ('B04', 'Motion-count explanation', 10.30, 16.30),
    ('B05', 'Capability illustrations', 16.30, 20.30),
    ('B06', 'Optional-component tradeoff', 20.30, 26.40),
    ('B07', 'Tool docking payoff', 26.40, 29.65),
    ('B08', 'Cosmetic expectation', 29.65, 31.30),
    ('B09', 'Budget joke and return pose', 31.30, TOTAL_S),
]

# ---- named events (seconds)
EV = {
    # B01
    'B01.hand.splay_contact': 0.20,
    'B01.gap.marker': W[3] - 0.04,          # circle pops on "no"
    'B01.gap.pulse': W[4],                  # "pinky"
    'B01.punch_in': 0.85,
    'B01.label.purpose': W[5] + 0.02,       # "On purpose."
    'B01.tape.enter': voice_end(6) + 0.0,   # tape leading edge leaves the gap marker as "purpose" ends
    # B02
    'B02.wipe.rip': 2.90,
    'B02.tape.contact': W[12] - 0.05,       # "taped" -> strip wraps ring + pinky
    'B02.cup.grasp': 5.95,
    'B02.cup.contact': 6.95,                # set-down lands on "together"
    'B02.knob.detent': 7.45,
    'B02.day.dial': W[21] + 0.10,           # "day."
    'B02.label.day': W[19],
    # B03
    'B03.card.slide': 8.12,
    'B03.verdict.stamp': W[24] + 0.00,      # "Leave" — lands right after the verbal pocket
    'B03.card.drop': 10.02,
    # B04
    'B04.label.digits': W[31] - 0.08,       # "four"
    'B04.hl.thumb': W[31],
    'B04.hl.index': W[31] + 0.20,
    'B04.hl.middle': W[31] + 0.40,
    'B04.hl.ring': W[31] + 0.60,
    'B04.count.thirteen': W[34],            # "thirteen"
    'B04.motion.thumb': W[38] + 0.0,        # "Independent"
    'B04.motion.splay': W[39] + 0.12,
    'B04.motion.curl': W[41] - 0.25,
    'B04.motion.hold': voice_end(41) - 0.05,
    # B05
    'B05.washer.pinch': 17.50,
    'B05.iris.rotate': 17.98,
    'B05.object.rotate': 18.16,
    'B05.iris.trigger': 18.92,
    'B05.trigger.press': 19.14,
    'B05.trigger.contact': 19.36,
    'B05.card.morph': 20.02,
    # B06
    'B06.option.reveal': W[54] + 0.05,
    'B06.actuator.1': 21.70,
    'B06.actuator.2': 22.10,
    'B06.actuator.3': 22.50,
    'B06.tray.cost': W[63],
    'B06.tray.space': W[65],
    'B06.tray.service': W[69] - 0.03,
    # B07
    'B07.rim.match': 26.40,
    'B07.label.built': W[75] - 0.05,
    'B07.tool.dock': 28.30,
    'B07.checker.nod': W[77] - 0.08,
    # B08
    'B08.reference.card_pass': W[78] + 0.0,
    # B09
    'B09.receipt.entry': W[82] + 0.0,
    'B09.checker.deadpan': W[84],
    'B09.budget.tag_contact': voice_end(87) + 0.12,
    'B09.hand.return_pose': 33.95,
    # extra physical events used by the sound mix (all tied to on-screen motion)
    'B01.label.tok': W[5] + 0.02,
    'B03.card.land': 8.42,
    'B03.card.tilt': 9.45,
    'B05.card.pop': 20.02,
    'B07.hand.arrive': 26.75,
    'B07.hand.release': 28.45,
    'B08.pinch.contact': 29.90,
    'B08.turn.start': 30.30,
    'B08.trigger.click': 30.67,
    'B09.hand.open': 33.45,
}

# ---- music pockets (mix ducking beyond speech-ducking), seconds
POCKETS = {'D01': (W[22] + 0.2, W[24] + 0.05),   # before the verdict: thin music
           'D02': (W[82] - 0.25, voice_end(87) + 0.3)}  # before the final joke


def fr(t):
    return int(round(t * FPS))


# ---- captions: short phrases, <= 2 lines of <= 30 chars
GROUPS = [(0, 4), (5, 6), (7, 9), (10, 17), (18, 21), (22, 23), (24, 26), (27, 29), (30, 32), (33, 37), (38, 41),
          (42, 47), (48, 53), (54, 58), (59, 61), (62, 63), (64, 65), (66, 69), (70, 77), (78, 81), (82, 87)]


def wrap(text, width=30):
    """One line if it fits; otherwise the most balanced two-line split (no orphan words)."""
    if len(text) <= width:
        return text
    ws = text.split()
    best = min(range(1, len(ws)), key=lambda k: max(len(' '.join(ws[:k])), len(' '.join(ws[k:]))))
    a, b = ' '.join(ws[:best]), ' '.join(ws[best:])
    assert max(len(a), len(b)) <= width + 2, (text, a, b)
    return a + '\n' + b


caps = []
for gi, (a, b) in enumerate(GROUPS):
    text = ' '.join(w['text'] for w in words[a:b + 1])
    start = words[a]['start']
    end = voice_end(b) + 0.14
    if gi + 1 < len(GROUPS):
        end = min(end, words[GROUPS[gi + 1][0]]['start'] - 0.04)
    caps.append({'start': round(start, 3), 'end': round(end, 3), 'text': wrap(text)})


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


srt = '\n'.join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n" for i, c in enumerate(caps))
open(f'{ROOT}/FGW_Atlas_No_Pinky.srt', 'w').write(srt)

out = {
    'fps': FPS, 'total_seconds': TOTAL_S, 'total_frames': TOTAL,
    'narration_file': 'audio/narration_48k.wav', 'narration_seconds': al['audio_duration_seconds'],
    'beats': [{'id': i, 'name': n, 'start_s': s, 'end_s': e, 'start_frame': fr(s), 'end_frame': fr(e)} for i, n, s, e in BEATS],
    'events': {k: {'t': round(v, 3), 'frame': fr(v)} for k, v in EV.items()},
    'pockets': {k: {'start_s': round(a, 3), 'end_s': round(b, 3)} for k, (a, b) in POCKETS.items()},
    'captions': caps,
    'words': [{'text': w['text'], 'start': w['start'], 'end': w['end'], 'frame': fr(w['start'])} for w in words],
}
json.dump(out, open(f'{ROOT}/audio/cues.json', 'w'), indent=1, ensure_ascii=False)

ts_lines = ['// GENERATED by tools/build_cues.py from audio/narration_alignment.json — do not edit by hand.',
            f'export const FPS = {FPS};', f'export const TOTAL_FRAMES = {TOTAL};', '']
ts_lines.append('export const BEATS = {')
for i, n, s, e in BEATS:
    ts_lines.append(f"  {i}: {{start: {fr(s)}, end: {fr(e)}}},")
ts_lines.append('} as const;\n')
ts_lines.append('/** Absolute frames of named physical/story events. */')
ts_lines.append('export const EV = {')
for k, v in EV.items():
    ts_lines.append(f"  '{k}': {fr(v)},")
ts_lines.append('} as const;\n')
ts_lines.append('/** Word start frames, in script order (88 words). */')
ts_lines.append('export const WORD_FRAMES = [' + ', '.join(str(fr(w['start'])) for w in words) + '] as const;\n')
ts_lines.append('export const CAPTIONS: {from: number; to: number; text: string}[] = [')
for c in caps:
    ts_lines.append(f"  {{from: {fr(c['start'])}, to: {fr(c['end'])}, text: {json.dumps(c['text'], ensure_ascii=False)}}},")
ts_lines.append('];')
open(f'{ROOT}/source/src/cues.ts', 'w').write('\n'.join(ts_lines) + '\n')
print('frames', TOTAL, 'events', len(EV), 'captions', len(caps))
for c in caps:
    print(f"{c['start']:6.2f}-{c['end']:6.2f}  {c['text']!r}")
