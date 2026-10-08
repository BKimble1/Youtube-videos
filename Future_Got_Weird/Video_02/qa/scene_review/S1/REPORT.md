# S1: builder and director-review reports

## Builder

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

## Director review

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
- **Pan shows outside the room:** the pan exposes paper outside the open-sided room set. That is how the room set is built, and the cards sit there.
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
