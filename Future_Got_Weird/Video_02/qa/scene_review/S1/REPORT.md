# S1: builder and director-review reports

## Review round 2 fixes (D02 residual, N01, N02, N03)

Built in `work/fix2_S1` on 2026-10-08 against the fix-2 shared pass; not merged or committed. Files: `src/scenes/S1_ColdOpen.tsx` and a new `src/components/v02/S1_Knockout.tsx`. Every module-load check still throws on failure, `tsc` passes, all nine scene modules load, and the S1 cue sheet (29 cues) is byte-identical to `audio/sfx/v2/cues.json`: no SFX cue moved.

**D02 residual (lead R2-L1).**
- The in-room wall-spot diamond is now lit only while a pulse is at the wall: from 3 frames before to 10 frames after the S1.5 pulse reaches or leaves W3 (954, 1061), the race's out and back (1181, 1223), and while the S1.7 detour tape runs (1700–1725). Lit means a saffron fill plus the wall glow.
- The rest of the time, including the long S1.4 and S1.6–S1.7 holds, it is an ink outline at 0.5 opacity with no fill and no glow. It appears quietly when the S1.4 route reaches the wall. The card's spot is unchanged.
- The mask around her is raised from 24/32 to 35/35 world px. That gives at least 40 screen px at zoom 1.15. Measured: glow 40.3 px from her head and 47.8 px from her pencil tip, with 84 % of the glow shown (the check needs at least 75 %). The fans measure 40.2 and 53.4 px; their checks are raised from 20/29 to 32 px.
- Her mark is not moved; it is shared with S2, S3 and S9.

**N01 (lead R2-L5).**
- **Timing:** "gap" pops 10 frames after the wall spot (810, against 800), once the route has gone behind the far end (805). "blocked" leaves 8 frames before the spot.
- **Leader path:** the leader leaves the pill's right edge, elbows at x 580.5 and runs straight down, ending on the GapMarker's dashed threshold inside the slot. Measured clearances: 12.8 px from the partition as drawn, 20.9 px from the glow's rim and 41.3 px from the diamond.
- **Drawing and landing:** it draws down over 12 frames (813–825). Its end dot pops at 821, and the patch outline pulses once (3→5→3 px, ink) as it lands.
- **Knock-out:** the leader sits in the backdrop and is knocked out 16 px around every stroke, dot and ring of light on screen. That covers the W→H slot crossing (the route and the pulse's trail), the S1.5 fans, the pulse train and its rings, and the blocked line, so the light passes over a gap in the leader.
- **No pops:** near light that is fading out, the leader is drawn at 1 − opacity/0.25, so it heals instead of popping back. Specks shorter than 14 px are drawn fainter in proportion to their length.
- **Load checks:** every frame from 813 to 1030 is checked: light ≥ 16 px away (measured 16.0), top stub ≥ 40 px (measured 99), the leader still ends at the floor point, and the end dot is clear of light.
- **Replica check:** the light geometry the knock-out reads (`S1_Knockout`) was checked against the real `LightPath`/`ScatterFan`/`Route` SVG output over frames 790–1032: strokes within 0.03 px, dots and rings exact, opacities exact.

**N02.** The pan now uses `PAN_EASE = Easing.bezier(0.5, 0, 0.5, 1)`. PAN0, PAN_END, RACE0 and every cue are unchanged. A load check keeps per-frame screen motion at or under 44 px; the modelled worst case is 42.3 px at the frame edge. Phase correlation on the renders gives a peak of 40 px a frame, down from 56 before.

**N03.**
- From PAN0 (1120) on, the room is drawn with `extendLeft = HANDOFF_S2S3_EXTEND` (3.2 m), the set S2.4 and S3 use at this framing.
- **Load checks:** the room's open left end is out of frame at 1119 and 1120 (right-most x −97). The extended end stays out of frame to the scene's end (right-most x −460). The extension matches HANDOFF_S2S3_EXTEND.
- **Pixel check:** frames 1119 and 1120 differ from the source tree only inside the wall-spot box (x 486–559, y 362–412), so the switch-on shows nothing.
- The tilt-0 CAM_ROOM shots keep their dollhouse end. Frame 0 matches the source except bottom-tile renderer noise (25 px, at most 5/255), and frame 600 is pixel-identical.

**Known limitation (R2-L1):** her pencil still points at the wall spot from about 66–75 px away. Her mark (LAYOUT.operator) and the wall pick W3 are fixed by the shared geometry, and a film-wide pencil swap was declined. While a pulse is at the wall, the lit spot and glow sit about 40 px from her pencil tip. For the rest of S1.4–S1.7 the marker is a faint outline, so the "pencil sparkle" reading is limited to those short light events.

**Evidence (qa/fix2/S1/):**
- Comparisons: `cmp_N01_before_after.jpg` (821/880/907/962/985), `cmp_D02_0.4.jpg` (960/1300/1760 at 0.4 scale), `cmp_N03_1300_vs_3300.jpg`, `cmp_1825_before_after.jpg`, `r2_phone480.jpg`, `r2_outline_pulse.jpg`.
- Half-res clip `clip/S1_clip.mp4` with dense sheets `clip/dense/S1_sheet01–06.jpg` and `motion.json` (no still runs).
- Every-frame sheets of the changed ranges: `dense_changed/n01_every_frame_*.jpg`, `dense_changed/pan_every_frame_1112_1171.jpg`, `dense_changed/s16_s17_every10_1180_1830.jpg`.


## Director review after the light-path fix

Merged into `source/` on 2026-10-08 (not committed). Sheets in this folder are the review's final sheets from `qa/pathfix_rev/S1/clip_r2/dense/`: `S1_sheet01.jpg`, `S1_sheet02.jpg`, `S1_sheet03.jpg`, `S1_sheet04.jpg`, `S1_sheet05.jpg`, `S1_sheet06.jpg`, `motion.json`, `motion_S1.png`.

I reviewed the whole of S1 and fixed six defects over two fix-and-verify rounds. Every module-load check still throws on failure, S1's sound cues are unchanged, and the final half-res clip has no still runs. I only edited `work/rev_S1/src/scenes/S1_ColdOpen.tsx`; `source/` is untouched.

**What already passed (no regression from the pre-fix sheets in `qa/scene_review/S1/`):**
- **Light path:** the light never goes over or through the partition. The wall-to-him leg slips behind the partition's far end beside the wall, at least 48 px below the corner. His outline ends it, with the saffron rim flash.
- **Plan card:** it shows the same blocked line, route and pulse frame for frame, and is in before the blocked line draws. It stays 90 px clear of him and 342–600 px from every label.
- **Partition height:** it is clearly taller than both people (2.0 m against 1.7 m).
- **Unchanged parts:** the tap (hand on the box, under 1 px error), the board, the cut out to S2 and the R1 window all match the baseline. In R1 the static frames differ by at most 7/255 on 64 pixels, the same renderer noise as before.

**Defects found and fixed:**
1. **The lit wall spot sat on her pencil.** The glow's edge was 12 px from her head and touched her saffron pencil tip from S1.4 to the end of the scene. On a phone it read as light coming off her head.
   - The glow is now 0.18 × 0.12 m instead of the plan's 0.24 × 0.16 m.
   - From the cut back onward her head tilts 4° away from it, which is invisible because it happens at a hard cut.
   - A new check runs on every frame the glow shows: it must stay at least 18 px from her head and 24 px from the pencil tip. It measures 23 px and 33 px.
2. **The glow stayed lit with no light for about 25 s.** It now shows only while light is drawn at the wall: with the S1.5 trails, during the S1.6 race, and while the S1.7 tape runs. The small diamond marker stays throughout.
3. **The S1.7 room stubs looked like a beam from her pencil.** These are the short visible pieces of the detour, about 70 px long. They were a double saffron line running straight on from the pencil, and stayed on screen for 3 s.
   - I removed them. This departs from the plan's "stubs glow in sync".
   - The room now follows the card's tape instead: the wall spot glows while the tape runs, and his rim flashes when the tape reaches him (frame 1713, checked at load).
4. **No reaction when the light reaches him.** S3 and S9 both have a flinch at that moment; S1 did not. He now flinches (blink, wide eyes, small hop) on "person" at frame 1007, and gives a smaller one during the race at frame 1200.
5. **Dead 1.2 s hold at frames 696–731** ("The light doesn't go through"). His eyes now follow the creeping ghost line and he braces until the thunk. The motion report now lists no still runs at all.
6. **The S1.6 label touched the room's floor edge.** "time-of-flight sensor: times its own light's round trip" now sits on a cream box. Its bottom is at y 932, checked against the 950 caption band.

I also factored the room's tilt and camera into `roomTilt` and `roomCam` so the checks read the same values the render uses.

**Remaining limitations:**
- In the room view the wall-to-him leg is mostly hidden, which is honest. "Around the end" depends on the visible stub into the slot, the "gap" label, the rim flash and the plan card.
- The cards cover the plant pot (accepted before). The bare paper the S1.6 pan used to show beyond the room is gone since review round 2 (N03, above).
- At tilt 0 the near panels sit lower on screen than his hair, because nearer things sit lower in this view. The far panel at his depth is clearly above both heads.
- The tripod overlaps her right hand.
- There is an empty slot for about 8 frames when the ruler card swaps for the plan card.
- The plan card (shared position) sits 40 px from the top-right frame edge, inside the 5% margin. That margin rule applies to critical text; the card is a diagram.
- The wall spot is still physically close to her head; the spot's position is fixed by the light geometry. See the round-2 known limitation above.

**SFX:** S1 is unchanged, still 29 cues, identical to the pre-review copy and to `audio/sfx/v2/cues.json`. All nine scenes load with their checks passing, and `tsc` passes. Output: `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rcues_S1.json`

**File changed:** `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S1/src/scenes/S1_ColdOpen.tsx`. The pre-review copy is backed up at `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rev_S1/S1_ColdOpen.orig.tsx`.

**Final sheets:**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S1/clip_r2/dense/S1_sheet01.jpg` to `S1_sheet06.jpg`, with `motion.json` alongside
- Full-res final stills: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S1/full_r2/`
- Earlier rounds: `qa/pathfix_rev/S1/clip/` and `full_r0/` (merged state before my fixes), `clip_r1/` and `full_r1/` (round 1)

## Before the light-path fix

### Builder

I built S1 (s01–s08) shot by shot, cued from the narration words. `npx tsc --noEmit -p .` passes in my copy. I did four render-inspect-fix rounds (stills in `r1`–`r4full`) and two full clip renders.

**Timeline change:** while I was working, `timeline.json` was replaced by the measured narration. S1 now runs from frame 0 to 1826. All beats are cued from words, so they followed the change.

**R1:** `export const R1 = {from: 0, to: 92}`. Frames 0–6 are pixel-identical. In the end window, 86 and 91 differ only along one anti-aliased floor edge (at most 12/255 on one channel), which looks like renderer noise.

**Wall sample:** the scene uses W3. When the module loads, `pickWall()` runs `assertPath` and measures the gap on screen at the raised tilt between the drawn partition and the S→W and W→H legs. It throws if the gap is under 18 px. W3 clears by about 21 px (from my replica of that test) and its echo delay is 7.16 ns.

**Shots**
- **S1.1 (s01), frames 0–158:** locked wide room view. The guesser tiptoes four steps in from the right with planted feet, arriving on "behind", then settles smug with his weight shifted. After R1 the checker glances at him and her dashed sight line stops at the partition with an X. A smug exhale lands on "pleased".
- **S1.2 (s02):** an 8% push toward the sensor. The checker taps the sensor on "sensor" and the readout blinks on, showing a tiny top-view tracking plot. A pale field-of-view wedge and a lit patch appear on the wall on "pointed"/"plain". The guesser wiggles an eyebrow on "him".
- **S1.3 (s03):** on "And" the readout swings up into the full-screen taped evidence board, landing on "yet" (frame 300, about 10 s in, so the title promise is met).
  - The board draws `tracking_topdown.json` with x mirrored: 16 wall points, sensor, partition, and `ours_xz` stepping through the 475 frames without smoothing, plus a frame counter that never mentions seconds.
  - Field-of-view wedge on "aimed"; a blocked sensor-to-estimate line on "never".
  - On-screen text: headline "Real measurements · published 2026"; "estimated position"; conditions "authors' released data / evaluation-kit sensor, held still / processed with the authors' code"; source "Somasundaram et al., Nature 2026 · plot mirrored to match our room". No "retroreflective" or "ordinary clothes" anywhere.
  - Hard cut back after "directly": he is buffing his nails, then freezes mid-smirk.
- **S1.4 (s04):** the camera rises to tilt 0.4. A ghost straight line from the sensor hits the partition on "through", with a thunk, a wobble and a "blocked" label. He relaxes, then the dashed route S→W3→H draws on "around the end" and he looks worried.
- **S1.5 (s05):** chips "slowed down" and "invisible flash (shown for clarity)". The sensor charges on "fires" and the pulse leaves on "flash", arriving back on the final "sensor" at constant speed. There are scatter fans at the wall and at him, later legs are thinner and paler, and the readout fills as the pulse travels.
- **S1.6 (s06–s07):** the camera pans aside and the arrival timeline card comes in.
  - A single flash: the quick teal echo lands first, the saffron one about 7 ns later, with "≈ 7 ns later" and "illustrative".
  - A webcam appears in a circle inset with a spinning question mark, shrugs, and gives a sad blip.
  - It is replaced by the sensor close-up (two windows, stopwatch on the readout, a mini round trip) with "time-of-flight sensor: times its own light's round trip". The real sensor is ringed.
- **S1.7 (s08):** a ruler card reading "1 nanosecond ≈ 30 cm ≈ 1 ft", with a pulse running along it. On "timing is distance", seven beads (one per 30 cm) mark the detour wall→him→wall, so the count matches "≈ 7 ns". A pill reads "extra delay → extra distance". On "where he is" he glances at the wall, uneasy.

**Deviations from the storyboard**
- **Raised framing:** I used CAM_RAISED with the centre 47 px higher (same zoom). The kit draws the figures at full height at tilt 0.4, so the shared framing cut off his hair.
- **Pan for s06–s08:** the camera pans 280 px to free the left side for the cards.
- **Conditions chip as a box:** it is the storyboard wording, set as a three-line box because one pill would not fit. I also added the guard-rail fine print from OPENING_EVIDENCE.
- **No `stored_xz`:** the optional faint authors' track is not drawn, to keep the board clean.
- **Stand in front of the checker:** I gave the tripod a depth that puts it in front of her, because her cutout is wider than her body and covered the sensor.
- **Paths drawn over the set:** they are hidden only where the drawn partition or the sensor box covers them. The fans are also hidden behind the two figures.
- **Beads instead of a one-way ruler:** a one-way tape from the wall to him would show about 3.6 ns, which would contradict the "≈ 7 ns" on the timeline.

**Known limitations**
- In the raised view the wall-to-him leg passes about 21 px above the partition's far top corner. It may read as going over the partition rather than around its end.
- The sensor sits at the chibi rig's chin height, so her tapping arm crosses at chin level.
- The guesser crosses his arms during the pan.
- Two designed holds remain (1.2 s and 0.9 s).
- I made one small change after the last clip render: the "slowed down" chip now stays up through the race. I checked it in a full-resolution still, not in a new clip.

**SFX:** 29 cues (ambience, 5 tiptoe steps, rustles, exhale, readout beeps, hum, paper slap, "uh-oh", thunk and wobble, pulse and bounce ticks, echo, block drops, webcam blip, card flick, ruler extends).

Files are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S1/source/src/`:
- scenes/S1_ColdOpen.tsx
- components/v02/S1_SensorStand.tsx
- components/v02/S1_TrackingBoard.tsx
- components/v02/S1_Props.tsx

Contact sheets I inspected: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/clip/dense/S1_sheet01.jpg` to `S1_sheet06.jpg`, plus `motion.json`. Final full-resolution stills: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/r4full/`.

### Director review

I reviewed S1 and fixed six defects over three render and check rounds. `npx tsc --noEmit -p .` passes. The final half-res clip shows the same two short holds the builder reported (1.2 s at "corners. The light doesn't go through", 0.9 s at "billionth of a second. So"), and nothing pops or resets. The biggest open problem is unchanged: in the raised view the wall→him light path still passes just above the partition's top corner. I marked the gap, which helps, but the geometry still puts the line above the corner.

**Defects found and fixed**
1. **Sensor hidden behind the checker (all of S1.4–S1.7).** The builder said the stand was drawn in front of her. In fact she was painted on top of it, so in the raised view her arm covered half the sensor: the box that fires the pulse and is ringed in S1.6. The stand is now painted in front of her from the cut back after the board onwards. The switch is hidden by that hard cut, and a check at load time confirms it holds at every tilt the scene uses.
2. **Tap pose.** Her forearm folded across her chin and mouth. She now presses the readout's buttons with her elbow down, and her hand touches the box.
3. **"Busted" beat unreadable.** He buffed his nails for only 7 frames before freezing. That is now 14 frames, worked out from the cue words, and he still freezes before s04 starts.
4. **The light path read as going over the partition.** On "around the end" the opening between the partition's far end and the wall is now drawn as a pale dashed shape labelled "gap". The route and the pulse visibly pass through it, and it fades once the pulse reaches him.
5. **The beads in S1.7 were unclear.** The 7 beads overlapped in pairs and didn't connect to the ruler card. They are replaced by the detour wall→him→wall drawn as a saffron line out and back, with an ink tick for every nanosecond of path and the first piece labelled "1 ns", as on the ruler card. Two in-between versions, a thick tape and a folded strip, looked like a stick he was holding, so I dropped them.
6. **Text.**
   - "≈ 7 ns later" went from 40 to 44 px and is now calculated from the two arrival times instead of typed in.
   - On the board, "seen from above" and "a position estimate, not an image" went from 32 to 34 px.
   - I added the fine-print line "what the person wore: not documented", which `OPENING_EVIDENCE.md` recommends.

I checked every on-screen claim against `claims.csv` (C02, C03, C06, C07) and found nothing wrong. Nothing critical sits in the caption band, and there is no `Math.random` or `Date`.

**R1** is still `{from: 0, to: 92}`. In both still windows (frames 0–6 and 86–91) the frames differ by at most 7/255 on 64 pixels, which is renderer noise.

**Changes from the storyboard:** I added the "gap" label and the opening. The S1.7 detour is a ticked light path instead of a single straight ruler.

**Remaining limitations**
- **Light path over the corner:** the geometry is still the cause. The only fix is moving the wall spot lower, which changes the delay numbers and the continuity with S3. S3 copies S1's camera, wall-spot choice and path drawing, so S3 and S8 need the same treatment.
- **Card covers the plant:** after the pan, the race card covers the plant's leaves and the pot shows underneath. Video 01 lays cards over the scene the same way, so I left it.
- **Smaller ones:** the field-of-view wedge in S1.2 is mostly behind the checker's head, though the lit patch on the wall shows. He crosses his arms during the pan. The stand's tripod now overlaps her right hand.

**Files changed** (the builder's originals are backed up in `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/orig/`):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S1/source/src/scenes/S1_ColdOpen.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S1/source/src/components/v02/S1_Props.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S1/source/src/components/v02/S1_TrackingBoard.tsx`

**Final contact sheets:** `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/dir5/clip/dense/S1_sheet01.jpg` to `S1_sheet06.jpg`, with `motion.json` alongside.

**Full-resolution stills:**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/dir5/full/` (final)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/dir3/full/` (gap, board, ring)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S1/dir1/full/` (baseline before fixes)
