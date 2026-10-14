#!/usr/bin/env python3
"""V3: generate script/CUE_SHEET_V3.md from audio/v3/cues.json (exported by source/scripts/export_cues3.ts from the
same TypeScript modules the picture renders) plus the per-unit staging notes below, and the narration gap edit
(audio/narration_v3/VOICE_EDIT_LOG.json). Frames are start-inclusive / end-exclusive.
Usage: python3 tools/make_cue_sheet_v3.py"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = json.load(open(ROOT / 'audio' / 'v3' / 'cues.json'))
W = json.load(open(ROOT / 'audio' / 'narration_v3' / 'narration_words_final.json'))['words']
G = json.load(open(ROOT / 'audio' / 'narration_v3' / 'VOICE_EDIT_LOG.json'))
FPS = D['fps']

# unit id -> (camera / transition, source)
NOTES = {
    'U01': ('Extreme close on the glass (z ~11.6), the push that ended the previous play carries on; one red ring and a shake on frame 0', 'Aftermath3.tsx (loopF: frames 0-7 continue frames 1350+), lib/device3.ts'),
    'U02': ('Cut to a low three-quarter (z 1.34 -> 1.5) on the collapse', 'Opening.tsx COLLAPSE keys, planted-foot IK (Man.tsx), lib/limb.tsx'),
    'U03': ('Holds the contact; the camera settles lower (z 1.56)', 'Opening.tsx collapseState'),
    'U04': ('Follows the bracing wrist into the band (z 1.56 -> 7.2); the band reads upright in portrait', 'Journey3.tsx camOpen, Device.tsx (upright UI)'),
    'U05': ('Macro on the band (z 7.2 -> 7.8) with a small hand-held energy during each buzz', 'Journey3.tsx buzz(), handAt (dig)'),
    'U06': ('Tilt round the case: roll 0 -> 90 deg about the arm axis while the camera moves to the side (z 12.5); backdrop isolates the arm', 'Device.tsx roll, Scene.tsx Backdrop'),
    'U07': ('The window opens with a bright moving cut edge (ease in-out); push onto the port (z 13 -> 20)', 'Interior.tsx SectionLayers (moving edge), PortModule'),
    'U08': ('Follows the narrow stream to the vessel; the hero sensor rings (z 24 -> 30)', 'Interior.tsx StreamDraw, VesselTube'),
    'U09': ('Dive across the near wall into the lumen (z 33 -> ~190), flow turned to screen-up', 'Journey3.tsx diveCam'),
    'U10': ('Rides with the hero, which overtakes the flow; a red cell passes in front; the vessel bends; the camera closes in and backs off', 'Journey3.tsx rideCam, heroS (overtaking), occluder'),
    'U11': ('Closes in on the changed cell; scan ring; the cell greys and wrinkles on "decay"', 'Interior.tsx VesselTube (wall cells)'),
    'U12': ('Four amber signals leave the hero; the camera follows the lead signal up the vessel and out (z ~190 -> 2.5); invisible switch to the see-through arm deep in the lumen', 'Journey3.tsx pullCam, signalS, overAll (vessel glow)'),
    'U13': ('On the chest (z 3.3 -> 4.2): an oval window opens on the torso (rim, far wall, parallax); the liver dims under amber sensors', 'Cutaway.tsx ChestCut, CutEdge'),
    'U14': ('Onto the heart (z 4.6 -> 5.6): regular beat, then an irregular, quivering rhythm; sensors turn red', 'Interior.tsx Heart2 (chaos)'),
    'U15': ('Follows the red pulse down the same arm (z 3.6) into the red screen (z 5.2 -> 7.0); red ring on arrival', 'Journey3.tsx camBody, VesselTube pulse'),
    'U16': ('Tight on the countdown (z 8.6 -> 9.2): 00:01:54 -> 00:01:52; buzz; screen light on the skin', 'lib/device3.ts'),
    'U17': ('Pull back to a face-and-band two-shot (z 2.2): fingers dig in, eyes to the street and back; the blue transmission pulse lifts off and the camera tilts up with it', 'Journey3.tsx CRIT_KEYS, exprAt, extra (tx pulse)'),
    'U18': ('Top-down map: the pulse runs from his location to the hospital block (0.7 s)', 'Dispatch.tsx MapBlip'),
    'U19': ('Wide on the hospital (sign high, ambulance bay low), the pulse comes down into the dock beacon; push in to the dock (z 0.72 -> 1.25)', 'Dispatch.tsx HospitalBay, hospCam'),
    'U20': ('Holds while the latch opens, the rotors spin up and the drone rises and banks right', 'Dispatch.tsx hospDrone, rotorPhase'),
    'U21': ('Tracks the drone over the neighbourhood (parallax layers); a foreground tree trunk passes the lens: the flyover ahead of it, his lawn behind it (never a fully covered frame)', 'Dispatch.tsx Flyover, TrunkWipe'),
    'U22': ('The drone arrives beside him (data link); push onto the band (z 6.5), the case turns, the section re-opens, onto the port (z 18-20)', 'Aftermath3.tsx camAt, SectionLayers treat, PortModule blue'),
    'U23': ('Along the vessel, back out to the arm and chest (z 3.6 -> 5.2): the blue pulse climbs the arm, the heart settles; the window closes as he breathes out', 'Aftermath3.tsx overAll (blue pulse), ChestCut (chaos -> 0)'),
    'U24': ('Medium (z 2.2 -> 1.9): weight onto the arm, the push, the torso rises round the hips, the hand leaves the grass', 'Aftermath3.tsx BODY keys'),
    'U25': ('Onto the raised band (z 4.2 -> 9.4): green replaces red; "Life Expectancy: 42 Years" large', 'Aftermath3.tsx camAt'),
    'U26': ('Face-and-band medium (z 2.4): unease, gaze to camera and back', 'Aftermath3.tsx exprAt'),
    'U27': ('Push into the glass (z 2.3 -> 9.4 -> 11.6 at frame 7 of the next play) with a slow roll; "?" glitch; red 00:02:14 callback; the loop', 'Aftermath3.tsx camAt, lib/device3.ts'),
}


def t(f):
    return f'{f / FPS:6.2f}'


def main():
    ca = D['countdown_at']
    b = D['beats']
    lines = ['# Cue sheet: The Death Clock V3', '',
             f"Generated by `tools/make_cue_sheet_v3.py` from `audio/v3/cues.json` (exported by `source/scripts/export_cues3.ts` from the same TypeScript modules the picture renders). {D['total_frames']} frames at {FPS} fps = {D['total_frames'] / FPS:.3f} s; frame {D['total_frames'] - 1} leads into frame 0. Ranges are start-inclusive / end-exclusive.", '',
             '## Countdown and device states', '',
             f"- one origin: red 00:02:14 at frame 0, counting at film speed (00:02:12 on the macro at frame {b['macro']}, 00:01:54 when the heart's warning lands at frame {b['red']}, 00:01:50 at frame {b['map0'] - 1})",
             f"- while the location, the hospital, the drone and the flight are on screen (frames {D['device']['gap0']}-{D['device']['gap1']}) the band is not in picture and story time is compressed; at the injection (frame {b['act0']}) it reads 00:00:42",
             f"- HELP ALERT SENT from frame {b['tx0']}; held (blue, TIMER HELD / STABILIZING) from frame {b['hold']} at 00:00:40; never reaches zero",
             f"- green \"Life Expectancy: 42 Years\" from frame {b['green']}; one \"?\" glitch frames {b['glitch']}-{b['glitch'] + b['glitchLen'] - 1}; red 00:02:14 callback from frame {b['callback']} (the loop bridge)",
             f"- countdown values at key frames: " + ', '.join(f"{k}: {v:.1f} s" for k, v in ca.items()),
             '', '## Narration gaps (silence-only edit)', '',
             f"Take C4, {G['speech_span_s']:.2f} s from first to last word after the edit ({G['wpm_over_span']} wpm over the span), longest gap {G['max_gap_s']:.2f} s, tail {G['tail_s']:.2f} s + 0.04 s lead-in = {G['loop_seam_silence_s']:.2f} s across the loop point.", '',
             '| Between (take time) | Recorded | Final | Note |', '|---|---|---|---|']
    for g in G['gaps']:
        lines.append(f"| {g['between_s'][0]:.2f}-{g['between_s'][1]:.2f} s | {g['original_s']:.2f} s | {g['final_s']:.2f} s | {g['note']} |")
    lines += ['', '## Units', '']
    for uid, desc, a, bb in D['units']:
        words = ' '.join(w['text'] for w in W if a / FPS <= w['start'] < bb / FPS)
        cs = [c['text'] for c in D['captions'] if a / FPS <= c['start'] < bb / FPS]
        sfx = [f"{c['id']}@{c['f']}" for c in D['cues'] if a <= c['f'] < bb and c['kind'] not in ('clock', 'heartbeat')]
        ticks = sum(1 for c in D['cues'] if a <= c['f'] < bb and c['kind'] == 'clock')
        beats = sum(1 for c in D['cues'] if a <= c['f'] < bb and c['kind'] == 'heartbeat')
        cam, src = NOTES[uid]
        extra = '; '.join(x for x in [f'{ticks} clock ticks' if ticks else '', f'{beats} heartbeats' if beats else ''] if x)
        lines += [f'### {uid}  frames [{a}, {bb})  {t(a)}-{t(bb)} s', '',
                  f'- **Action:** {desc}',
                  f'- **VO:** {words or "(no word starts here)"}',
                  f'- **Camera / transition:** {cam}',
                  f'- **Source:** {src}',
                  f'- **Captions:** {" | ".join(cs) or "(none start here)"}',
                  f'- **Sound:** {", ".join(sfx) or "-"}' + (f'; {extra}' if extra else ''), '']
    m = D['music']
    lines += ['## Music sections (s)', '', ', '.join(f'{k} {v:.2f}' if isinstance(v, float) else f'{k} {v}' for k, v in m.items()), '',
              'The bed is cyclic: every oscillator is a whole multiple of 1/45 Hz and 45.0 s is exactly 75 beats at 100 bpm, so the tension under the red callback is the tension that opens the film.', '']
    (ROOT / 'script').mkdir(exist_ok=True)
    (ROOT / 'script' / 'CUE_SHEET_V3.md').write_text('\n'.join(lines))
    print('wrote script/CUE_SHEET_V3.md')


if __name__ == '__main__':
    main()
