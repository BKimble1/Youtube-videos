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

## QA (review render)

`tools/qa.py` (`qa/FGW_Cyborg_Cockroach_V2_REVIEW_qa.json`, `_motion.json`, `_phone_sheet.png`):

- 1080x1920 h264 yuv420p bt709, 30 fps, 936 frames, 31.2 s; keyframes every 0.5 s at most.
- Audio: -14.2 LUFS integrated, true peak -1.5 dBTP, voice 22.8 dB over the rest in the phone band. The file's audio matches the mix (correlation 0.99998, offset 0 ms).
- Whisper transcript of the file: word error rate 0 against the locked script.
- Caption windows: 23/23 OK.
- Motion: every non-cut motion spike is intentional (the D2 snap at frame 498). No low-motion holds remain (the first render had a 13-frame near-hold in B1 at 5.8-6.2 s, fixed by running the push through the cut).
- Inspected frame by frame: 0-89 (hook, firing at frame 27, remote, LED match cut) and 876-935 (realization, final approach, loop into frame 0). The F5 caption was moved to the top band, off her fingertips.

## Known remaining issues

- **C1 (two insects):** at that width the observer's camera reads as a small dark box with a blue lens. The difference between the two insects is made explicit only by C2's push to the lens.
- **Scale cheats (forced perspective):**
  - The insect is drawn larger than true scale in the wide human shots (A4, C4, E1, F3, F4) so it stays readable.
  - In F5, her hand is at true scale relative to the macro insect, so only her fingertips are in frame.
- **D6 -> E1:** the cut matches the gap's shape and position, not the insect's size. D6 ends with the insect large; E1 opens with it small inside the opening.
- **Hands:** in B1/B2 the cartoon gloved fingers rest along the pack's edge, slightly onto the shell, while they hold it.
- **Antennae in A1:** antennae that touch the silicone lie on its far face and show through the translucent target (by design), so they read faintly.
- **Loop:** frame 935 (rubble) to frame 0 (lab) is a location change by design. The insect's pose, size and screen position carry across the cut.
