# Cyborg Cockroach V2: change log and handoff

Review file: `exports/FGW_Cyborg_Cockroach_V2_REVIEW_1080x1920.mp4` (1080x1920, 30 fps, 936 frames = 31.2 s, loops).
Composition `CyborgCockroachV2` (`source/src/v2/Film2.tsx`). Captions SRT: `captions/FGW_Cyborg_Cockroach_V2.srt`.
Mix: `audio/mix/FGW_Cyborg_Cockroach_V2_mix.wav`. Shot plan and rules: `production/V2_SHOT_PLAN.md`.

## Locked from V1 (unchanged)

- Narration: the same ElevenLabs WAV and word timings (`source/src/data/timeline.json`). The mixer checks the voice
  stem against the source (correlation 1.0); nothing was rerecorded, rewritten or time-stretched.
- The story, the science and the ending lines.

## What changed

**Look.** The V1 renderers (3D-shaded insect, perspective lab and rubble) are gone. The insect is redrawn as flat
Weird Crew 2D: `v2/roach/Roach2D.tsx` + `Gear2D.tsx` draw V1's mm skeleton (tripod gait, planted feet, antennae,
breathing) through orthographic views with flat cel shading and the crew ink line. Lab in the finished Shorts' style
(`v2/sets/Lab2.tsx`), rubble in flat layered concrete with a daylight shaft (`v2/shots/e/art.tsx`). Crew rigs reused:
operator, gloved hands, survivor.

**Edit.** 29 shots instead of 14 (`v2/cuts2.ts`), a new development every 0.7-1.5 s, each shot with one motivated
move (or none). Transitions are built from shapes and actions:

| Cut | Link |
|---|---|
| A2 -> A3 | the remote's red button -> the backpack's red LED (same spot, size) |
| A3 -> A4 | the board -> the operator watching the arena |
| B1 -> B2 | the pack keeps its screen position as the view goes overhead |
| B3 -> B4 | the walking pack -> the board seen from above |
| B4 -> B5 | one continuous camera (pulse to antenna, then the turn) |
| C2 -> C3 | push through the observer's lens into its feed |
| C3 -> C4 | the feed becomes the operator's monitor |
| D2 -> D3 | the firing framing opens into the cutaway |
| D6 -> E1 | the dark lab gap -> the same-shaped opening in the rubble |
| F5 -> A1 | loop: same camera, same walk, her hand where the target stands |

**Beats.**

- 0-1.8 s: macro hook. The cyborg cockroach fills the frame, still walking in, coil glowing. The line parts, the spring snaps and the needle sinks into the silicone at 0.90 s, with recoil and synced click, spring and thock.
- 1.8-4.5 s: the gloved thumb presses the button, match cut to the LED, the signal runs to the coil, the operator nods.
- 4.5-10.5 s: gloved hands fit the backpack on the living insect, then it walks in a tripod gait. A pulse runs the LEFT wire to the antenna-base electrode, and it turns right round a foam block.
- 10.5-15.5 s: two insects, two jobs (injector vs camera). Push into the lens, the ground-level camera POV down a foam course, then the feed on the operator's monitor.
- 15.5-20.6 s: line-up, ECU firing on "fire", a section through the silicone (gas drives the plunger, the dose blooms), and back to the animal among other spent lab targets.
- 20.6-25.2 s: into the gap, then the collapsed-building interior with parallax layers, concrete, rebar, dust and a daylight shaft. The medic crosses below her pocket. One small label: "Future rescue concept".
- 25.2-29.7 s: her face follows falling grit and a scrape, the insect's antennae and head come out of a crack, she recoils, then she sees the injector and her fear turns to cautious hope.
- 29.7-31.2 s: close: the cyborg cockroach walks at the viewer's eye line toward her open fingertips (gap kept, needle never at her). The final frame matches frame 0.

**Captions.** Rebuilt from the exact locked words in hand-phrased chunks (1-4 words), whole frames, snapped to cuts. Yellow emphasis on ten words only. Placed per shot (top band or low band) clear of faces, needles, contacts and the insect's head.

**Sound.** The same narration, a restrained synthesized tonal bed under it (shifts at "But the plan", warms at the recognition; no third-party music), and 103 cues read from the animation:

- tripod foot ticks grouped by touchdown;
- button click;
- coil sizzle, line click, spring and thock (both firings);
- steering pulses;
- seal click and gas fizz in the cutaway;
- air passes into the gap and through the lens;
- grit, creaks and rubble.

## Runway

Not used. The Runway connector authenticates, but its asset download host refused requests (HTTP 403) from this environment, so no generated media could be retrieved. No Runway generation was run and no credits were spent. Everything in V2 is drawn in code.

## Known remaining issues

See the end of this file (updated after the review render).
