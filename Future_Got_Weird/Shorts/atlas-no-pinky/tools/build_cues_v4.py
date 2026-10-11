#!/usr/bin/env python3
"""V4 cue tables for both paces ('fast' = retimed narration, 'orig' = original narration).
Reads  audio/narration_alignment.json and the old->new time map (tools/timemap_v4.py)
Writes audio/v4/cues_{fast,orig}.json, source/src/cues_v4_{fast,orig}.ts, FGW_Atlas_No_Pinky_V4.srt (fast), FGW_Atlas_No_Pinky_V4_OriginalPace.srt.
Event times are authored once on the ORIGINAL narration clock and pushed through the map; opener events are absolute (they follow the picture, not the speech).
Run:  python3 tools/build_cues_v4.py"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import timemap_v4 as T

ROOT = T.ROOT
FPS = T.FPS
words, W = T.WORDS, [w['start'] for w in T.WORDS]
vend = T.voice_end
OLD_TOTAL = 34.6
fr = lambda t: int(round(t * FPS))

ABS = {'open.click': 0.37, 'open.drop': 0.67, 'open.reveal': 0.58}      # opener physical beats: absolute seconds, not mapped
EV_OLD = {
    'gap.pop': W[3] - 0.08, 'gap.pulse': W[4], 'label.purpose': W[6], 'tape.wipe': 2.80,
    # B02 overhead experiment
    'exp.wiggle': 3.70, 'exp.push': 4.85, 'exp.wrap': W[12] - 0.05, 'exp.mug.grasp': 5.85, 'exp.mug.set': 6.90,
    'exp.knob.turn': 7.13, 'exp.knob.detent': 7.42, 'exp.day.done': 7.70, 'label.day': W[19],
    # B03 decision slip
    'slip.in': 8.00, 'stamp.hover': W[24] - 0.13 - 0.34, 'stamp.hit': W[24] - 0.13, 'iris.b04': 9.90,
    # B04 mechanism: whole hand -> push into the thumb joint -> back out to independent finger motion
    'b04.badge1': W[31], 'b04.badge2': W[31] + 0.18, 'b04.badge3': W[31] + 0.36, 'b04.badge4': W[31] + 0.54,
    'b04.push': W[33] - 0.12, 'b04.count': W[34], 'b04.thumb': 12.95, 'b04.thumb2': 13.55, 'b04.pull': 14.30,
    'b04.curl1': 14.56, 'b04.curl2': 14.95, 'b04.curl3': 15.34, 'b04.open': 15.72,
    # B05 capabilities
    'b05.pinch': 17.33, 'b05.grip': 18.05, 'b05.cut_b': 17.85, 'b05.turn': 18.28, 'b05.cut_c': 18.98, 'b05.press': 19.14, 'b05.contact': 19.36,
    'b05.drive': 19.40, 'b05.drive_end': 20.05,
    # B06 exploded hardware
    'b06.slide': 20.25, 'b06.title': W[54] + 0.05, 'b06.ghost': W[55], 'b06.mod1': 21.70, 'b06.mod2': 22.10, 'b06.mod3': 22.50,
    'b06.cost': W[63], 'b06.space': W[65], 'b06.service': W[69] - 0.03,
    # B07 / B08 workstation
    'b07.slide': 26.38, 'b07.label': W[75] + 0.12, 'b07.place': 28.30, 'b07.ok': 28.42, 'b07.nod': W[77] - 0.08,
    'b08.human': W[79], 'b08.pick': W[77] + 0.42,
    # B09 receipt + closing tear
    'b09.drop': 31.25, 'b09.print': W[82], 'b09.stamp': W[87] - 0.07, 'b09.click': vend(87) + 0.12,
}
# caption cues: (first word, last word, [emphasised word indices], pop). 2-6 words; the renderer wraps by MEASURED glyph widths (<= 760 px, 2 lines).
GROUPS = [(0, 4, [3, 4], False), (5, 6, [6], True), (7, 11, [], False), (12, 16, [14, 16], False), (17, 21, [], False), (22, 23, [], False), (24, 26, [], False),
          (27, 32, [31], True), (33, 34, [34], True), (35, 37, [], False), (38, 41, [], False), (42, 47, [], False), (48, 49, [], False), (50, 53, [], False),
          (54, 58, [], False), (59, 61, [59, 60], False), (62, 63, [63], True), (64, 65, [65], True), (66, 69, [69], True), (70, 75, [], False), (76, 77, [], False),
          (78, 81, [], False), (82, 84, [], False), (85, 87, [87], True)]
HOLD_MAX = 0.12   # hold after the final word when the gap to the next cue supports it
LAST_BEFORE_TEAR = 0.06


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def build(pace):
    m = T.build(pace)
    f = (lambda t: T.tm(m, t)) if pace == 'fast' else (lambda t: t)
    total_s = m['total_s']
    ev = {k: f(v) for k, v in EV_OLD.items()}
    ev.update(ABS)
    ev['b08.place'] = ev['b08.pick'] + 20 / 30   # carry (3+12 frames) + drop (5): fixed in frames so the choreography is identical at both paces
    ev['b08.ok'] = ev['b08.pick'] + 23 / 30
    ev['loop.tear'] = total_s - 0.72
    nw = [dict(text=w['text'], start=f(w['start']), end=f(w['end']), voice_end=f(vend(i)), old_start=w['start']) for i, w in enumerate(words)]
    caps = []
    for gi, (a, b, ems, pop) in enumerate(GROUPS):
        start = nw[a]['start']
        scribe_end = max(nw[b]['end'], nw[b]['voice_end'])
        # cue end, frame-aligned: 60-120 ms after the final word's measured end, or a clean handoff when the next cue starts before that hold is over
        lo_f = math.ceil((scribe_end + 0.06) * FPS - 1e-9)
        hi_f = math.floor((scribe_end + 0.12) * FPS + 1e-9)
        if gi + 1 < len(GROUPS):
            nxt_f = fr(nw[GROUPS[gi + 1][0]]['start'])
            end_f = nxt_f if nxt_f <= hi_f else hi_f      # longest allowed hold: the most reading time the narration's own pace permits
            assert end_f / FPS >= scribe_end - 1e-9 or nxt_f == end_f, 'cue must cover its final word or hand off'
        else:
            end_f = min(hi_f, math.floor((ev['loop.tear'] - LAST_BEFORE_TEAR) * FPS))
            assert end_f / FPS >= scribe_end - 1e-6, 'last cue must cover the final word'
        end = end_f / FPS
        caps.append(dict(start=start, end=end, words=[w['text'] for w in nw[a:b + 1]], em=[e - a for e in ems], em_at=[fr(nw[e]['start']) for e in ems], pop=pop,
                         first=a, last=b, final_word_end=scribe_end))
    # a gap of one frame or less between consecutive cues is a rounding artefact, not a deliberate beat: hand off cleanly (no blank frame)
    for c, n in zip(caps, caps[1:]):
        if 0 < fr(n['start']) - fr(c['end']) <= 1:
            c['end'] = n['start']
    pockets = {'D01': {'start_s': f(W[22] + 0.2), 'end_s': f(W[24] + 0.05)}, 'D02': {'start_s': f(W[82] - 0.25), 'end_s': f(vend(87) + 0.3)}}
    out = dict(pace=pace, fps=FPS, total_seconds=total_s, total_frames=fr(total_s), speed=m['speed'], knots=m['knots'], events={k: {'t': round(v, 4), 'frame': fr(v)} for k, v in ev.items()},
               words=nw, captions=[{k: (round(v, 4) if isinstance(v, float) else v) for k, v in c.items()} for c in caps], pockets=pockets)
    os.makedirs(f'{ROOT}/audio/v4', exist_ok=True)
    json.dump(out, open(f'{ROOT}/audio/v4/cues_{pace}.json', 'w'), indent=1, ensure_ascii=False)
    srt = '\n'.join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n" + ' '.join(c['words']) + '\n' for i, c in enumerate(caps))
    srt_name = 'FGW_Atlas_No_Pinky_V4.srt' if pace == 'fast' else 'FGW_Atlas_No_Pinky_V4_OriginalPace.srt'
    open(f'{ROOT}/{srt_name}', 'w').write(srt)
    P = pace.upper()
    L = [f'// GENERATED by tools/build_cues_v4.py ({pace} pace) — do not edit by hand.', f'export const CUES_{P} = {{', f'  total: {fr(total_s)},', f'  speed: {m["speed"]},',
         f'  map: {json.dumps([[round(a, 5), round(b, 5)] for a, b in m["knots"]])} as [number, number][],', '  ev: {']
    for k, v in ev.items():
        L.append(f"    '{k}': {fr(v)},")
    L.append('  } as Record<string, number>,')
    L.append('  caps: [')
    for c in caps:
        L.append(f"    {{from: {fr(c['start'])}, to: {fr(c['end'])}, words: {json.dumps(c['words'], ensure_ascii=False)}, em: {json.dumps(c['em'])}, emAt: {json.dumps(c['em_at'])}, pop: {json.dumps(c['pop'])}}},")
    L.append('  ] as {from: number; to: number; words: string[]; em: number[]; emAt: number[]; pop: boolean}[],')
    L.append('};')
    open(f'{ROOT}/source/src/cues_v4_{pace}.ts', 'w').write('\n'.join(L) + '\n')
    return out


if __name__ == '__main__':
    for pace in ('fast', 'orig'):
        o = build(pace)
        print(pace, 'total', round(o['total_seconds'], 3), 's', o['total_frames'], 'frames; cues', len(o['captions']), '; events', len(o['events']))
    o = json.load(open(f'{ROOT}/audio/v4/cues_fast.json'))
    for c in o['captions']:
        print(f"{c['start']:6.2f}-{c['end']:6.2f}  {' '.join(c['words'])!r}  em={c['em']}")
