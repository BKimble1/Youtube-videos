#!/usr/bin/env python3
"""Generate script/CUE_SHEET.md from audio/cues.json (exported from the picture's own TypeScript modules)
plus the per-shot staging notes below. Frame ranges are start-inclusive / end-exclusive at 30 fps.
Usage: python3 tools/make_cue_sheet.py"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = json.load(open(ROOT / 'audio' / 'cues.json'))
W = json.load(open(ROOT / 'audio' / 'narration' / 'narration_words_final.json'))['words']
FPS = D['fps']

NOTES = {
    's01': ('Street, man stumbling, right hand clutching chest, near knee buckling; dog behind on the right, slack teal leash; blue band on the LEFT wrist at his side', 'Medium-low 3/4 (z 1.20), slight push', 'Street.tsx, Man.tsx, Dog.tsx, StreetShots.tsx'),
    's02': ('Drops to his knees, left hand reaches to brace, collapses onto his side on the grass; left arm drops toward camera revealing the band; dog startles a step back', 'Follows the fall down to the wrist (ease in-out), z 1.24 -> 1.30', 'StreetShots.tsx FALL keys'),
    's03': ('Accelerating zoom along the forearm with a camera roll that lands the forearm at the close-up angle; cut on motion to the close-up; lands on the watch by ~2.2 s; VITAL SCAN green with a slight red edge warning; his pained face beyond; dive through the glass', 'z 1.3 -> 7.5 (ease-in) + roll, cut at f60, settle to the opening wrist framing (z 1.5), slow push, dive ease-in to z ~15', 'WristClose.tsx, Watch.tsx'),
    's04': ('Inside the band: reservoir beads; pull back to the lengthwise cutaway (skin, yellow fat, tissue, red vessel); micro-port needles extend; three followable beads and a dense stream cross skin and fat into the vessel and turn up the arm', 'z 3.4 -> 1.62 (ease-out) reveal, then ease toward the vessel entry (z 2.4)', 'CrossSection.tsx, Beads.tsx'),
    's05': ('Tracking inside the vessel: near wall cut away, red cells at three depths, sensors faster than the cells, two foreground beads pass close and soft', 'Constant track right, z 1.0', 'Vessel.tsx'),
    's06': ('Sensors leave the stream and dock on the lower wall; scan rings reach the tissue cells; two cells shrink and grey (the story\'s "cellular decay") and are flagged amber; pull out', 'Ease to a stop and tilt down (z 1.25), quick pull-out to z 0.62 with a 10-frame crossfade to the body map', 'Vessel.tsx'),
    's07': ('Body map from the forearm out to the whole body; liver and kidneys flag amber on "organs begin to fail"; push into the heart; regular beat -> chaotic quiver and "RHYTHM: LETHAL" card; a signal runs down his LEFT arm to the band', 'z 2.6 -> 1.0 -> 2.3 (heart) -> follow the arm to the wrist (z 2.6)', 'Body.tsx'),
    's08': ('Match cut to the SAME watch on the SAME arm; screen switches to crimson at the cut, CALCULATING, then 00:02:14 appears and starts counting down; his distress in the background', 'Pull back from z 2.3 to the wrist framing (z 1.5, ease-out), slow push', 'WristClose.tsx, lib/device.ts'),
    's09': ('Close crop on the countdown digits, hold for reading, then a small pull back to his face and hand', 'z 1.64 -> 2.9 over 14 frames, hold ~1.4 s, ease back to z 1.3', 'WristClose.tsx'),
    's10': ('One expanding blue wave leaves the watch; HELP ALERT SENT slides in over the running timer; a signal bead rises out of frame toward the dispatch cue', 'Settle on the watch (z 1.5), slight tilt up at the end', 'Shots.tsx S08_10'),
    's11': ('Top-down map of the same neighbourhood: the pin drops over him, a data packet (location + heart-pulse marks) travels to a rooftop response point; cut to the drone spinning up and lifting off a rooftop pad (pad framed above the caption lane); TIME COMPRESSED tag', 'Gentle drift on the map; near-static low angle for the lift-off, slight tilt up with the drone', 'Map.tsx, Drone.tsx, Shots.tsx S11'),
    's12': ('The drone crosses the same street and slows to hover above him; a dotted path links it to a location pin over the man', 'Wide (z 0.62) easing in to z 0.86 as it arrives', 'Street.tsx, Drone.tsx'),
    's13': ('Wrist insert: the micro-port pip lights, a tiny automated injection; callout shows blue droplets dispersing in the vessel (no drug, no dose); STABILIZING; the timer freezes at 00:01:52; pull back to fingers moving and slower breathing; the drone hovers soft-focus above', 'Push to z 2.0 over 18 frames, then ease back to z 1.4', 'WristClose.tsx, Shots.tsx InjectInset'),
    's14': ('He pushes up on both hands, swings his legs round toward the camera and sits on the grass: near knee raised, left forearm with the band resting on it, right hand planted behind; breathing heavily; pain -> relief; the band turns green; the dog comes round and sits behind him; the drone hovers nearby', 'Pull back through the street: z 1.3 -> 1.0', 'Shots.tsx recoveryState (leg foreshortening in Man.tsx)'),
    's15': ('Same wrist framing as the opening, now with him sitting: the screen reads exactly "Life Expectancy: 42 Years"; rack focus to his apprehensive face on the question', 'Ease to the opening wrist framing (z 1.5); rack focus by blur', 'WristClose.tsx (sitting background)'),
    's16': ('One localized screen glitch: slices shift and a clear "?" for 9 frames; the readout restores; hold on the opening wrist composition to the end', 'Static on the opening wrist framing', 'Watch.tsx glitch state'),
}


def t(f):
    return f'{f / FPS:6.2f}'


def main():
    shots = D['shots']
    cues = D['cues']
    caps = D['captions']
    lines = ['# Cue sheet: The Death Clock (final)', '',
             f"Generated by `tools/make_cue_sheet.py` from `audio/cues.json` (exported by `source/scripts/export_cues.ts` from the same TypeScript modules the picture renders). {D['total_frames']} frames at {FPS} fps = {D['total_frames'] / FPS:.3f} s. Ranges are start-inclusive / end-exclusive.", '',
             '## Device states', '']
    dv = D['device']
    for k in ['edgeIn', 'redAt', 'timerAt', 'alertAt', 'compress0', 'compress1', 'injectAt', 'freezeAt', 'recoverAt', 'glitchAt']:
        lines.append(f'- `{k}`: frame {dv[k]} ({dv[k] / FPS:.2f} s)')
    lines.append(f"- countdown: 00:02:14 at frame {dv['timerAt']}; story time runs x{dv['compressRate']} inside the montage (frames {dv['compress0']}-{dv['compress1']}); frozen at frame {dv['freezeAt']} reading {D['countdown_at'][str(dv['freezeAt'])]:.1f} s (shown 00:01:52); never reaches zero.")
    lines += ['', '## Shots', '']
    for sid, (a, b) in shots.items():
        words = ' '.join(w['text'] for w in W if a / FPS <= w['start'] < b / FPS)
        cs = [c['text'] for c in caps if a / FPS <= c['start'] < b / FPS]
        sfx = [f"{c['id']}@{c['f']}" for c in cues if a <= c['f'] < b and c['kind'] != 'clock']
        ticks = sum(1 for c in cues if a <= c['f'] < b and c['kind'] == 'clock')
        act, cam, src = NOTES[sid]
        lines += [f'### {sid.upper()}  frames [{a}, {b})  {t(a)}-{t(b)} s', '',
                  f'- **VO:** {words or "(no speech)"}',
                  f'- **Action:** {act}',
                  f'- **Camera:** {cam}',
                  f'- **Source:** {src}',
                  f'- **Captions:** {" | ".join(cs) or "(none start here)"}',
                  f'- **Sound:** {", ".join(sfx) or "-"}' + (f'; {ticks} clock ticks' if ticks else ''), '']
    (ROOT / 'script').mkdir(exist_ok=True)
    (ROOT / 'script' / 'CUE_SHEET.md').write_text('\n'.join(lines))
    print('wrote script/CUE_SHEET.md')


if __name__ == '__main__':
    main()
