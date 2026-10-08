# S8: builder and director-review reports

## Builder

S8 is built. `npx tsc --noEmit -p .` passes in my copy and nothing is committed. I did seven render-and-fix rounds: stills r1–r4, two full-resolution checks, and three scene clips. The geometry guards pass, and the beats stay in order when the S8 word timings are scaled anywhere from 0.8× to 1.2×.

**What I built, shot by shot** (scene file `src/scenes/S8_Warehouse.tsx`, component `S8Warehouse`)
- **S8.1 (s40), Runway R3:** locked wide front view with the "illustration" chip. The robot waits far left, with two idle pings and a blink during "What might this be good for?". It sets off on "Picture", rolls toward the corner and slows to a stop on "corner".
  - `export const R3 = {from: 10209, to: 10322}`. The first and last 6 frames are identical by construction (the frame is frozen), with no ping or blink inside the window.
- **S8.2 (s41):** one tilt from the front view to the plan view, with the camera move.
  - On "junction" the wall section at the junction lights up teal and the "potential use" chip appears.
  - On "sensor" pulses fan out to the wall and scatter, with the "slowed down" chip.
  - The person (`CAST.person`, shown as a plan token) comes through the doors on "might".
  - A second pulse goes robot → wall → person → wall → robot, with later legs thinner and paler. On "out" a dotted direct line stops at the racking with an X.
  - When the echo returns, a faint blob appears round the person.
- **S8.3 (s42):** tilt back to a medium front view; the blob becomes a patch on the floor under the person.
  - The robot eases off again. "something moving" pins to the blob, the robot squints (the anticipation), then brakes at the stop line on "say slow down".
  - "slow down" appears, then on "who's" a "?" grows on the blob and "not who" appears. The robot and the person look at each other.
  - The person walks slowly enough to stay out of the robot's direct view until it has stopped.
- **S8.4 (s43):** a paper board slides down on "plenty" and the four tiles set up in turn. Each tile plays on its word:
  - "short range": pulses fade before a far wall.
  - "dark or shiny walls": a dark wall swallows a pulse; a shiny wall bounces one away.
  - "bright sunlight": the sun floods the robot's sensor and it squints.
  - "fast math on small hardware": a heap of numbers pours in beside a tiny sweating chip.
  - "early-stage prototype (authors)" lands below the grid on "early-stage".
- **S8.5 (s44):** the board lifts and the person has gone. The robot creeps on with cautious eyes and its bumper meets a carton just after "collisions", then it backs off. A "bumper" label appears, the robot pings once on "clue", and "not a safety system" pins to its sensor head.

**Files created** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S8/source/src/components/v02/`)
- `S8_PersonToken.tsx`: the person's plan token, copied from the dev comp because `Tokens.tsx` has no person token.
- `S8_Props.tsx`: the blob, the carton, impact marks and the labels.
- `S8_Vignettes.tsx`: the 2×2 board.

**Deviations from the storyboard**
- **Robot restarts:** R3 has to end still, so the robot stops short of the stop line (x = 2.0 m) and then eases forward again before braking in S8.3.
- **Carton:** it appears only after the board lifts (time has passed), so the bumper physically does the stopping. I kept it out of S8.1–S8.3 so the brake reads as caused by the blob, not the box.
- **Person and blob:** the person is visible to the camera, so we know who it is while the robot doesn't. The blob sits on the floor as a likely location and the "?" floats just above it.
- **Labels:**
  - "slow down · not who" became two stacked pills, because one row would have run past the right margin.
  - The three S8.3 pills are 40 px (body size, not the 44 px critical size) for the same width reason. "not a safety system" is 44 px.
  - I added "slowed down" (the brief's rule for pulses) and "bumper" (it names the thing).

**Known limitations**
- **R3 overlay:** the R3 window includes the static "illustration" chip, because the Runway insert covers all overlays. You may want to put it back over the insert.
- **Robot overlap:** the kit robot's three-quarter cheat makes its nose overlap the carton's side face at contact.
- **Person's pace:** the walk is slow (34 frames per step, up to 40 at 1.2× timing).
- **Holds:** the motion report lists 1.4 s on the opening question, 0.8 s on the R3 end freeze, 1.17 s before "short", 1.17 s after the tag, and 0.93 s at the end. All are intended holds.

**SFX:** 33 entries, built from the same cue constants.

Final sheets I inspected, in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S8/clip_final/dense/`:
- `S8_sheet01.jpg`
- `S8_sheet02.jpg`
- `S8_sheet03.jpg`
- `motion_S8.png`

Full-resolution checks are in `qa/scenes/S8/r5_full/` and `qa/scenes/S8/r6_full/`.

## Director review

I found seven defects in S8 and fixed six; the seventh is a kit transition artefact left as a limitation. I did two render-and-verify rounds after the fixes. `npx tsc --noEmit -p .` passes, the beats stay in order with the S8 timings scaled anywhere from 0.8× to 1.2×, and nothing is committed.

**Defects found**
1. **S8.3, story contradicts the line (worst).** On "who's" the robot's eyes swung to the person, the person looked back with an "o" mouth, and the person had walked into the robot's direct view. Muted, it read as "the robot can see him", which undercuts "not enough to say who's there".
2. **S8.3, the "?" was unreadable.** It sat between the person's legs, small and mostly hidden.
3. **S8.2, label over the light paths.** The "slowed down" pill (at 1000, 872) sat on top of the first ping's fan, covering the lowest leg and its scatter.
4. **S8.3, text below critical size.** The "something moving / slow down / not who" pills were 40 px, under the 44 px rule for the scene's key label.
5. **S8.4 "fast math" tile, overprinted digits.** The late digits landed on top of heap digits ("92", "12", "57" printed over each other).
6. **S8.4 "bright sunlight" tile, double transparency.** The light wedge and the glow disc each had their own opacity, so their overlap showed a darker crescent.
7. **Minor framing and overlap.**
   - The S8.1 robot started about 45 px from the left frame edge.
   - The plan view left the right 28 % of the frame as empty paper.
   - The ping arcs on "clue" swept under the "not a safety system" pill.

**Fixes made**
- **S8_Warehouse.tsx, the person:** the walk now ends at z = WH_PERSON_HIDDEN_MAX_Z − 0.1, so the person is never in the robot's direct view. The pace comes from the cues (34 frames per step now, 31–40 across 0.8–1.2×), and the last foot lands just after the robot stops.
- **S8_Warehouse.tsx, the reaction:** the person stops on hearing the brake, then on "who's" turns and tilts toward the corner, brows up, a brief "o", then a flat mouth. They are listening, not seeing.
- **S8_Warehouse.tsx, the robot:** it keeps its cautious squint and only peers at the corner.
- **S8_Warehouse.tsx, the "?":** it is now a thought bubble over the robot's sensor head on "who's", using a new `S8ThinkBubble` in `S8_Props.tsx`.
- **S8_Warehouse.tsx, labels and framing:**
  - The S8.3 pills are now 44 px and placed with a computed width, so they stay inside the 5 % margin (right edge about 1821 px).
  - "slowed down" moved into the top guard-rail chip row (x = 632), clear of every light path.
  - The plan camera moved from cx 1170 to 1060, which balances the frame.
  - The R3 start pose moved from x = 0.25 m instead of 0.0, so it sits about 110 px from the edge. R3 is still 10209–10322.
  - The "clue" arcs are shorter and stay below the "not a safety system" pill.
  - I added one sound cue, a soft tick when the "?" bubble pops. The cue sheet has 33 entries, all valid kinds.
- **S8_Vignettes.tsx:** the late digits are now placed just outside the heap so none overlaps another (the tightest pair is about 28 px apart). The sunlight wedge and disc share one group opacity, so they read as one flat patch.

**Checked and OK:** the R3 start and end frames are pixel-identical (10209 vs 10214, 10316 vs 10321), and repeat renders of 10209 and 10600 are identical. Every drawn path keeps its straight-segment and racking guards. Every cue comes from `at()`, and labels and claims match the storyboard and C39–C41.

**Remaining limitations**
- **R3 overlay (needs the lead):** the Runway insert covers the whole picture, so the "illustration" chip would be hidden or garbled during R3. Either re-draw the chip above `InsertLayer` in Main, or hide the chip in the start and end frames sent to Runway.
- **Tilt crossfade:** at mid-tilt (around 10509) the person shows as a translucent ghost, and their arm is briefly drawn over the S1 racking top. This comes from the shared warehouse helpers (`whFigureMix` / `whRigStyle`), which I can't edit.
- **Carton contact:** the robot's three-quarter front overlaps the carton's side face by a few pixels. It reads as contact.
- **Holds:** the motion report lists these quiet stretches, all intended:
  - 1.4 s on the opening question.
  - 0.8 s on the R3 end freeze.
  - 1.17 s before "short".
  - 1.4 s on "The researchers call it", where only the falling digits move.
  - 1.17 s after the tag.
  - 0.93 s at the end.
- **Walk pace:** the person's walk is a slow stroll.

**Final sheets** are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S8/dir_r2/clip/dense/`:
- `S8_sheet01.jpg`
- `S8_sheet02.jpg`
- `S8_sheet03.jpg`
- `motion_S8.png`

Full-resolution checks are in `qa/scenes/S8/dir_r0/full/` (baseline), `qa/scenes/S8/dir_r1/`, and `qa/scenes/S8/dir_r2/` (including `repeat/`).

Files are in /home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S8/source/src:
- scenes/S8_Warehouse.tsx
- components/v02/S8_Props.tsx
- components/v02/S8_Vignettes.tsx
