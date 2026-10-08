# S3: builder and director-review reports

## Director review after the light-path fix

Merged into `source/` on 2026-10-08 (not committed). Sheets in this folder are the review's final sheets from `qa/pathfix_rev/S3/clip_r3/dense/`: `S3_sheet01.jpg`, `S3_sheet02.jpg`, `S3_sheet03.jpg`, `motion.json`, `motion_S3.png`, `final_stills_sheet.jpg`, `final_cut_pair_2873_2874.png`.
- `final_cut_pair_2873_2874.png` was rendered in the S3 review copy, whose S2 did not yet have the S2 review's card takeover. In the merged tree frame 2873 is the full-frame "what survives: timing" card; the merged pair is in `qa/cuts/r2/`.

I reviewed the whole of S3 in `work/rev_S3` and found six defects, all now fixed. I verified them over three render rounds, each with full-res stills and a half-res clip with dense sheets. tsc passes, the module loads with every assert still throwing, and S3's sound cues are unchanged.

**What still works from the pre-fix version:** the S3.3 evidence board is unchanged, and all its text sits above the caption band. The motion report is back to the baseline's 9 still runs, all of them designed holds on the board.

**Path shots:** the light goes round the far end by way of the wall, never over or through the screen. The plan card is in before the route draws, runs in sync with the room and clears the people by at least 20 px. The 2 m screen stands well above both heads, and no text falls in the bottom 12%.

**Defects found and fixed**
1. **Jump cut from S2 into S3.** S3 opened on a different framing at almost the same zoom, so both characters jumped about 500 px sideways, and her arms changed from crossed to hanging down.
   - S3 now opens on S2's last framing exactly (`{cx: 585, cy: 470, zoom: 1.2}`, S2's `CAM_D`), and both characters start in S2's final poses: his sweat drop and gaze, her crossed arms and raised brow. At the cut only S2's graphics disappear.
   - One eased move on "Follow the path that matters" then raises the view and pushes in to the path framing.
   - The plan card comes in as soon as the room has moved out of its column (frame 2903). It is fully in before the route draws (2917–2939), and the dots launch at 2943.
2. **Her forearm covered the sensor's readout.** She now keeps her arms crossed, as in S2 and as the art critic recommends, so the readout stays in plain view.
3. **The "sensor" label sat across the partition's far edge**, the edge the light goes behind. There was no spot for it that cleared both her and that edge, so I removed it, as the art critic suggested. The sensor still fires visibly on "sensor".
4. **The ripple ring at the person was drawn as a saffron hoop across his shirt** (about 3001–3015). The rings are now hidden wherever they overlap either person. His arrival cue is the rim flash, plus the ring in the plan card.
5. **The gap at the wall was not marked in the room**, unlike S1 and S9.
   - I added the kit's ink gap marker on the floor. It shows from the route preview until the dot is home and stays clear of the tripod.
   - The dashed route used to stop about 20 px short of the far edge because of the dash pattern. It now ends on a dot at that edge, so it visibly goes in behind the end.
6. **Regression in S3.2: the plant poked out around the arrivals card.** With the rescaled plant, its blue pot stuck out under the card and a leaf tip showed at its right edge. The card is now 808 × 778 px, covers the whole plant and stays about 85 px clear of her.

**Two acted beats to replace new dead air.** Her crossed arms removed some idle motion, which left about 0.9 s of stillness on "once, off the wall" and on "Our friend's echo".
- She glances up at the wall on "off the wall".
- He gets worried, sweat drop back, on "Our friend's", relaxes when his small block lands, then turns smug on "tiny".

**Remaining limitations**
- **S2's end camera is copied, not shared.** S3's opening camera is a copy of S2's `CAM_D`, which S2 doesn't export. If S2 changes its end framing, S3 has to follow. A shared `HANDOFF.S2S3` in `lib/shots.ts` would be cleaner, but that's a shared-file change for you.
- **"Around the end" depends on the card.** In the room, only about 70 px of the wall-to-him leg is visible before it goes behind the far end. The read relies on the gap marker, the route's end dot, the rim flash and the plan card, as the plan itself warned.
- **The characters are about 17% smaller than in the baseline** (screen scale 1.75 against 2.10). The framing is capped by the 2 m screen's top and the card column, so I couldn't get the size back.
- **The plant is cropped at the left frame edge during the path shot.** It's set dressing, but it is cut by the frame.
- **Her pose changes across the board wipe into S4.** She has her arms crossed in S3 and arms down when S4 opens. The board covers the change, so it isn't a continuous shot.

**SFX:** S3's cues did not change: 15 cues, identical to both the working and the committed `cues.json`, exported to `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rcues_S3.json`. S9 still differs from the committed file, which is the merge's known footstep change.

**Files changed** (nothing else differs from `source/src`, and nothing is committed):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S3/src/scenes/S3_Echo.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S3/src/components/v02/S3_BlockCard.tsx`

**Final sheets**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/clip_r3/dense/S3_sheet01.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/clip_r3/dense/S3_sheet02.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/clip_r3/dense/S3_sheet03.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/clip_r3/dense/motion_S3.png`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/final_stills_sheet.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/final_cut_pair_2873_2874.png`
- Full-res stills are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S3/final_full/`. The pre-fix renders are in `clip/` and `r0full/`, and rounds 1–2 in `clip_r1/`, `clip_r2/`, `r1full/` and `r2full/`.

## Before the light-path fix

### Builder

I built S3 (s13–s16) in my copy. The type-check passes, and I did four render-inspect-fix rounds plus a final check of the motion clip. Nothing is committed.

### What I built, shot by shot

**S3.1 (s13), raised room view at the shared raised tilt, no full fold**
- **Camera push:** on "Follow the path that matters" the camera pushes in from S1's raised framing to a closer one at the same tilt. It is computed from the projected points so it shows both heads, the sensor, the wall spot and the partition's far end. A faint dashed route draws on at the same time.
- **The trip:** 24 light dots leave the sensor on "sensor" and travel sensor, wall, person, wall, sensor at one constant slowed speed. Each stop lands within a few frames of its word, and a ring spreads at each stop.
- **The light path:**
  - It uses wall spot W3, picked with S1's clearance test, so the wall-to-person leg passes the partition's far end at the gap.
  - The path is checked with `assertPath`, and the dots are hidden where the partition, the stand or a person covers them.
  - The two legs that retrace each other run in separate lanes.
- **The losses:** at each bounce most dots scatter away and fade (24, then 8, then 3, then 1, seeded). Later legs are paler. A tally card, "light still on the path", greys the dots out as they are lost.
- **Labels:** stop names (sensor, wall, person) pop on their words, plus the chip "slowed down · illustrative".
- **"Each bounce spreads the light":** scatter fans appear at the wall spot and at him. On "most of it is lost" they leave.
- **Cast:** he follows the dots with his eyes, flinches on "person" and relaxes into smug on "lost". She glances at the wall spot and raises a brow when the one dot comes home.

**S3.2 (s14)**
- The camera pulls back to S1's side framing, then the "arrivals at the sensor" card (marked "illustrative") slides in.
- Nine teal blocks drop into one time slot, labelled "1 bounce · wall" on "once".
- One saffron block lands late, labelled "3 bounces · him" on "three".
- On "tiny" the block gets a ring, he gives his smuggest look, and she glances at him.
- The two slots come from the room's illustrative timings (6.3 ns and 13.5 ns), shown without numbers.

**S3.3 (s15–s16), evidence board**
- **The board:** it slides over and lands on "This", from `ams_wall_vs_echo.json` (centre zone).
  - Headline "Real measurements".
  - Chip "same team · a different sensor (3×3 zones) and hidden object" on "same".
  - Source chip "authors' released raw data · Somasundaram et al., Nature 2026".
  - The 3×3-zone sensor icon pops on "sensor", with "plotted: the centre zone".
- **The plot:** a linear axis from zero, "time after the wall's echo (ns)". The data are drawn as straight lines between the 128 bins, no smoothing. The curve draws to the spike on "wall's big echo", then across the flat tail on "a few nanoseconds later".
- **The magnifier:** it appears on "bump" and slides over the tail. On "zoom" its inside stretches in height from ×1 to ×250. The tab always shows the factor actually being used, the time axis is unchanged, and zero stays on the baseline.
- **Callouts:**
  - "hundreds of times weaker (this capture)" on "hundreds".
  - The bump is ringed on "That bump".
  - A dimension line from the wall echo to the bump reads "3.7 ns" on "timing".
  - "≈ 1.1 m extra path" with "3.7 ns × 30 cm per ns" appears on "farther".
- The board holds through the wipe into S4.

### How the numbers are checked
Every number is computed from the counts. The module throws if any disagrees with the file's `zone_measures`:

| What | Value |
|---|---|
| Wall peak | bin 30 |
| Bump | bin 72, 3.696 ns after the wall echo |
| Extra path | 1.108 m (file: 110.8 cm) |
| Peak ÷ bump's excess over the local floor | 575.7 |
| Zoom | 250: puts the bump at about 55% of the plot height, rounded to a multiple of 50 |

### Files
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/scenes/S3_Echo.tsx` (`S3Echo`, `SFX`)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_EchoBoard.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_BlockCard.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_ZoneBox.tsx`: S7's ZoneBox design copied exactly, plus a mark on the centre zone.
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_SensorStand.tsx`: a copy of S1's tripod stand, so the cut matches.

### Deviations from the storyboard
- **Closer framing in S3.1.** At S1's wide raised framing the 24-dot cluster was about 40 px wide and didn't read. The push keeps the same raised tilt and the gap at the partition's far end.
- **Additions not in the storyboard:**
  - The "light still on the path" tally and the stop-name tags, so the losses read with the sound off.
  - The card title "arrivals at the sensor", and the identifiers "wall" and "him" on the "1 bounce" / "3 bounces" labels.
- **Linear axis only on the board.** The research notes suggested a "log scale" chip. The brief asks for a linear axis with a magnifier, so I labelled the axis "counts (linear scale)" and left out the log view.
- **The 576× ratio isn't printed.** It is a measure we chose for this one capture, so the board says only "hundreds of times weaker (this capture)".

### Known limitations
- The block stack (9 to 1) is far from the real ratio. It is labelled "illustrative".
- The test that hides dots behind the people is approximate, so a scattered dot can graze a shoulder edge.
- S2 isn't built yet, so S3 opens with him wary, hands on hips, without knowing S2's last pose.
- The motion report lists 9 still runs (12.5 s), all on the evidence board. They are designed holds while callouts are read; the longest is 2.3 s, on "hundreds of times weaker. That bump".

### Sound
15 cues: room ambience; the sensor pulse; three bounce ticks; the echo return; the card sliding in; four block drops; a smug exhale; the board's paper slap; the magnifier slide; the marker circle.

### Contact sheets inspected
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/clip/dense/S3_sheet01.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/clip/dense/S3_sheet02.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/clip/dense/S3_sheet03.jpg`
- Motion graph: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/clip/dense/motion_S3.png`
- Stills: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/` in `r1`, `r2`, `r3full`, `r4full` and `r5`.

### Director review

I reviewed S3 and did three fix-and-verify rounds; the scene now works. The biggest problem was the push-in on s13: the shot no longer showed the gap the light goes through, and that is fixed. `npx tsc --noEmit -p .` passes and nothing is committed. Every on-screen number matches the data file and `research/claims.csv`: 3.696 ns after the wall echo, 110.8 cm extra path, a 576× ratio (shown only as "hundreds"), and a zoom of ×250.

**Defects found and fixed**
1. **S3.1 push lost the gap (biggest problem).** The push went to zoom 1.95 and framed the characters only down to the knees. That cut out the floor between the partition's far end and the wall, so the view no longer read as a raised room and the light appeared to go over the partition. The camera is now framed from the projected geometry at zoom 1.6: both characters head to feet, the stand, and the floor from the wall base to the partition's far foot. The dot radius went up (8.5 → 10, as a named constant) so the dots still read at the new zoom.
2. **Dots drawn over the partition.** The sideways offsets that put the two retracing legs in separate lanes could push dots on his side onto the partition's top corner, and the scatter fans crossed its top edge. Those dots and both fans are now clipped by the partition's outline.
3. **Stop rings drawn on top of the people.** The wall-spot ring crossed her head and pencil, the sensor ring crossed her arm, and the ring at him covered his whole torso. The rings are now hidden where a person is in front of them.
4. **Labels in the wrong place.** The "sensor" label sat on her forearm; it is now beside the sensor box. The "wall" label overlapped the dot cluster; it is raised. The "person" label floated 300 px from his head; it is now beside it.
5. **S3.2 card.** Plant leaf tips poked up over the top of the card. The card now starts higher (y 136 → 56).
6. **S3.2 → S3.3 changeover.** The board covered his smug look on "tiny" almost at once. It now starts a little later and slides in from the left, so it replaces the card first and covers him last. It still lands before "real data".
7. **Board overlaps and small text.**
   - The "3.7 ns" label was crowded against the wall-echo spike and its label. It now sits under the measuring line, in clear space.
   - The y-axis label sat inside the 5% margin, against the card edge. It has been moved in.
   - The axis numbers were 32 px; they are now 34 px, the body-text size.

**Checked and found fine**
- Every beat is cued from narration words; frames are not hard-coded.
- Everything is a pure function of the frame, with seeded randomness only.
- Nothing pops, flashes or resets; nobody walks, so no feet slide.
- All required labels and accuracy chips are present with the storyboard wording, outside the caption band.
- The data are plotted as straight lines between points, with no smoothing, and the magnifier tab always shows the zoom factor actually in use.

**Remaining limitations**
- Seen from the raised angle, the wall-to-person leg crosses just above the partition's far top corner, the same way as in S1's accepted shots. The floor gap is now visible, but someone watching without sound may still read the light as going over the partition. I kept S1's convention rather than add a floor trace in this one scene; say if you want one.
- The plot axes stay empty for about 4.5 s while the conditions chips build ("This is real data … hidden object"). I kept this as a designed hold so the curve can draw on "wall's big echo".
- The motion report still lists 9 still stretches (12.5 s in total, the longest 2.3 s), all on the board while callouts are read. The flat tail draws along the baseline with very little visible movement.
- The checks that hide dots behind people are still approximate, so a faded scatter dot can graze a shoulder edge.
- S2 isn't built, so the opening pose and framing from S2 are untested. The scene still opens on S1's raised framing.
- I did not test the cues under ±20% timing changes. My only new timing dependency is the board's start, and it is derived from the cue words.

The cue sheet still has 15 sounds.

**Files changed (all S3-owned)**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/scenes/S3_Echo.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_EchoBoard.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S3/source/src/components/v02/S3_BlockCard.tsx`

**Final contact sheets and motion graph**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/dir1/clip4/dense/S3_sheet01.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/dir1/clip4/dense/S3_sheet02.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/dir1/clip4/dense/S3_sheet03.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/dir1/clip4/dense/motion_S3.png`

Full-resolution stills from each round are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S3/dir1/` (`base`, `r1`–`r5`), and earlier clips are in `clip`, `clip2` and `clip3` there.
