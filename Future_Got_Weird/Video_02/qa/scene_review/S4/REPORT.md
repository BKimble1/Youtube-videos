# S4: builder and director-review reports

## Director review after the light-path fix

Merged into `source/` on 2026-10-08 (not committed). Sheets in this folder are the review's final sheets from `qa/pathfix_rev/S4/clip3/dense/`: `S4_sheet01.jpg`, `S4_sheet02.jpg`, `S4_sheet03.jpg`, `S4_sheet04.jpg`, `S4_sheet05.jpg`, `motion.json`, `motion_S4.png`.

I found and fixed four defects in S4, over three render-and-fix rounds. Everything that worked before still works: the plan view, the pulses, the labels and the S4→S5 cut are pixel-identical to the baseline. S4's sound cues are unchanged. `tsc` passes, and `collect_sfx.mjs` loads all nine modules with no assert thrown.

**Defects found and fixed**
1. **The sensor on the tripod did not shrink with the set during the fold. This came from the merge.** `S4_Stand` still sized the sensor with the old full-height scale and hung it from a fixed column height. Mid-fold (4050–4060) the people shrank but the sensor didn't: it grew to the size of her head and rose to her shoulders, above the 0.95 m light plane.
   - I rebuilt `S4_Stand` on the S1 stand's design: it now scales with the set like the people, and its working face sits exactly on the sensor point at every tilt.
   - S4's tripod now also looks the same as the one in S1, S2, S3 and S9.
   - The overhead sensor icon in the plan view is unchanged, so the S5 hand-off frames stay identical.
2. **The 2 m partition's top almost touched the top of the frame in the opening.** It was about 12 px from the edge at the shared room framing. S4 now opens on that framing lowered by 36 screen px (`CAM_OPEN`), and the fold starts from there.
   - The partition top now has about 48 px of headroom, and both people stay the same size on screen.
   - The far panel stands clearly above both heads, by roughly 90–130 px, and the partition's near foot stays in frame.
3. **Her sleeve covered about a third of the sensor's readout, and her hand sat loosely on the tripod hub, then slid off it during the fold.**
   - S1 already draws the stand in front of her. S4 now does the same, and a new check that throws at module load confirms the drawing order at every tilt where the people are visible.
   - Her stand-side hand is now held on the tripod's centre column every frame, so it reads as holding the stand and stays on it through the fold.
4. **When the two wall spots slid together and back apart (around 5032 and 5158), a grey copy of the spot marker sat half on top of the lit one.** The old fade threshold let two markers show while still overlapping. The original-position marker now fades in only once the two are fully apart.

I also added a guard, and a check that throws, so no light pulse can start before the fold lands. Light only ever appears in the flat plan view, so the "around the end" rule has nothing to check in S4.

**Checks with the sound off and at 40% size**
- Every storyboard shot S4.1–S4.7 reads.
- Labels and chips meet the size rules and stay out of the bottom 12%.
- The 2 m partition is visibly taller than both people in the opening and during the fold.
- Nothing is cut off by the frame, and nothing pops.

**Remaining limitations**
- **The people shrink with the room during the fold.** This is by plan: at tilt 0.45–0.6 they are about 40% of their opening size before they fade.
- **Known shared-component behaviour, not changed:**
  - a grey wall-top band shows for about 3 frames;
  - people and their overhead tokens are see-through together mid-fold (about 4060–4070);
  - the fade's slight shrink moves her hand a little off the column while she is mostly transparent.
- **Limitations already noted in the last review, unchanged:**
  - the "likely location" blob reads as a thin leaf (S5 has to match it);
  - "not a photograph" is on screen only briefly at the end;
  - the second arc sweeps fast;
  - the face inset covers the room's top-right corner while the camera is raised.
- **The S3→S4 wipe (S3's transition):** at frame 3953 a sliver of her hand shows at the wipe's edge. It's minor.
- **The tripod now exists as five copies** (S1, S2, S3, S4, S9). Merging them into one shared component is a shared-file change, so that's your call.

**Sound cues:** unchanged. `collect_sfx` writes S4 38 cues to `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rcues_S4.json`. S4 is identical to both the working `audio/sfx/v2/cues.json` and the committed version, and the whole output file equals the working file.

**What stayed the same:**
- Frames 4140, 4200, 5688, 5691, 5692, 5694 and 5700 are pixel-identical to `qa/pathfix_r0` and `qa/cuts/r1`.
- Final sheets 02, 03 and 05 are identical to the pre-fix sheets in `qa/scene_review/S4/`. Sheet 04 differs only in the sliding-spot tiles, and sheet 01 only in the opening and fold rows.
- Frames 3953–3962 changed, as intended: the framing and the tripod.

**Files changed** (only these two, in the review copy):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S4/src/scenes/S4_Geometry.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S4/src/components/v02/S4_Stand.tsx`

**Final sheets and stills** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S4/`):
- `clip3/dense/S4_sheet01.jpg` … `S4_sheet05.jpg`, `motion_S4.png`, `motion.json` (longest hold 1.73 s, 11 holds of 0.8 s or more), and `clip3/S4_clip.mp4`
- Earlier rounds: `clip/dense/` (the merged tree before my fixes) and `clip2/dense/`
- Full-res stills: `final_full/` (3954, 3962, 4027, 4040, 4056, 4060, 4140, 4200, 5032, 5158), `r0full/` (before the fixes), `r3full/`, `r5slide/`
- Half-res frames for the cut comparison: `final_half/` and `cut_half/`

## Before the light-path fix

### Builder

I built S4 (shots S4.1–S4.7) and `npx tsc --noEmit -p .` passes in my copy. I did five render-inspect-fix rounds (stills, then two full scene-clip QA passes) and checked the end frame, which matches the hand-off.

**Timeline changed under me.** Partway through, `src/data/timeline.json` in my copy switched to the measured v2 narration (S4 is now 3954–5692). Every beat is derived from `at()` cues and gaps are capped with `Math.min`, so the scene followed the new timing with no hard-coded frames.

### Shot by shot (cue words in quotes)
- **S4.1 (s17):** Room view at CAM_ROOM: the checker stands beside the sensor on its tripod, reading the readout; the guesser stands smug behind the partition and glances up as the camera starts to rise. The fold runs from "room" to "with" (56 frames, eased). The people and the stand fade into tokens and the overhead sensor glyph. The "simplified picture (2D)" and "illustrative" chips appear on "simplification", and the first chip stays through s22. The sensor flashes and listens at W1 twice, on "flashes" and again on "spot", at the shared slowed pulse speed with a "slowed down" chip. Labels: "flashes and listens" / "at one spot".
- **S4.2 (s18–19):** On "Measure" the label "extra delay 8.85 ns" appears (the layout's delay value). On "how far" the ruler swings out from W1 to |W1 H| and "1.33 m" appears at its tip. On "Not which direction" it wavers ("which way?"), then on "Just how far" it sweeps the candidate arc. On "anywhere" faint copies of his token appear along the arc. Labels: "distance known" / "direction unknown". In the face inset he is nervous at first, gives a relieved sigh with eyes shut on "direction", then leans on the partition with his hand on its edge (J3a).
- **S4.3 (s20):** W4 appears and flashes on "listen". On "Another delay" a second ruler swings out through the gap, and on "another arc" it sweeps the arc. On "On this side" the camera rises (CAM_BACK, my own framing) to show the back halves crossing again behind the wall. They are crossed out, turn grey, and get the label "behind the wall: impossible" on "cross". On "one place" a ring marks his token and the inset shows him busted (J3b, with the uh-oh sting).
- **S4.4 (s21):** The camera returns to CAM_PLAN_ACT. On "fuzzy" each arc splits into three faint arcs, and by "band" they thicken into ±3.75 cm bands (labelled "illustrative band (±3.75 cm)"). On "overlap" the patch fills in, and a ring marks it on "small patch".
- **S4.5 (s22):** On "These two spots" the two spots slide close (W1→W2, W4→W3) and the patch grows long. The bands, arcs and patch are recomputed every frame from the moving spot positions. On "Spread" they slide back to W1/W4 and the patch shrinks. Labels: "close → long and blurry", then "spread out → smaller".
- **S4.6 (s23):** On "weighs many spots" all four spots flash. On "trying" 222 seeded candidate dots scatter over the hidden side. A comparison card ("measured" vs "predicted" echo-time ticks, computed from the layout) shows one candidate that misses (✗) and one that matches (✓ on "match"). Poor matches fade out; the survivors spawn new dots that settle on him. The card "assumption: one small object" appears on "assumptions", and a dashed ring marks the assumed object on "kind".
- **S4.7 (s24):** On "answer" the cluster settles into the likely-location blob, built from all four bands. Labels "likely location", "rough shape" and "not a photograph" appear on their words. A photo frame drops over him on "Not" and is crossed out on "photograph".
- **End state:** Labels clear from end−17 to end−10, then the last 10 frames hold: tilt 1, CAM_PLAN_ACT, the board, plant, both tokens, the sensor glyph at S, and the blob drawn over the guesser's token. Only S5 needs these details to match the cut: checker token faces the sensor (about 83°), guesser token faces 200°, sensor glyph aims at x = 1.85 m on the wall, and the blob uses the two-level teal style.

### Deviations from the storyboard, and why
- **Fold camera:** a straight CAM_ROOM→CAM_PLAN_ACT glide cut the characters' heads off mid-fold. The camera now pans over the first 80% of the tilt and zooms over the last 65%, landing exactly on CAM_PLAN_ACT.
- **Extra camera move in S4.3:** the crossing behind the wall is off-frame at CAM_PLAN_ACT, so the camera rises to CAM_BACK for that beat.
- **Tripod stand:** no shared stand component existed, so I made `S4_Stand`. S1 and S3 will likely build their own, so you may want to unify them.
- **Drawing order:** the diagram draws over the guesser token (otherwise the crossing, patch and blob were hidden under him). The checker token sits above the diagram.
- **Second ruler:** it swings out at 108° and sweeps right to left so it doesn't cover his token.
- **Additions not in the storyboard:**
  - the "extra delay 8.85 ns" and "1.33 m" labels (layout values, covered by the "illustrative" chip);
  - the "slowed down" chip;
  - the faint copies of him along the arc;
  - the patch ring, the four-spot flashes and the dashed "one small object" ring;
  - the echo comparison card.
- **Omitted:** the W1–W4 name labels, to declutter.

### Known limitations
- The motion report lists 13 still runs of 0.8 s or more (16 s in total); the longest is 2.2 s, the hold on the assumption ring between "kind of object" and "answer". Most are deliberate holds in the plan view.
- The kit's grey wall-top phase still shows briefly near the end of the fold.
- The ruler's "which way?" waver briefly crosses the partition and his token.
- "not a photograph" is on screen for only about 0.8 s, because the scene ends 19 frames after s24's last word.
- The W2/W3 patch runs up to the wall; that is the honest overlap for this layout.

### Sound
`SFX` has 35 entries: room tone for the whole scene, the fold landing, chips, pulse / bounce / echo sounds for each flash (varied in pitch and gain), ruler extensions, arc draws, the relieved sigh, the uh-oh sting, marker circles, no/yes indicators, three thinning ticks, card flicks, the stamp and the frame's swish.

### Files
New, in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S4/source/src/`:
- `scenes/S4_Geometry.tsx` (the scene; exports `S4Geometry` and `SFX`)
- `components/v02/S4_Stand.tsx` (the sensor on its tripod)
- `components/v02/S4_Inset.tsx` (the face inset)
- `components/v02/S4_Parts.tsx` (ruler, labels, echo card, assumption card, photo frame, marks)

QA, in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S4/`:
- final contact sheets I inspected: `clip/dense/S4_sheet01.jpg` to `S4_sheet05.jpg`
- motion report: `clip/dense/motion_S4.png`, `clip/dense/motion.json`
- stills: `r1`, `r2`, `r3`, `r4`, `r5` and `r5full`

### Director review

I found 9 defects in S4 and fixed all of them in `S4_Geometry.tsx`. None of the fixes needed changes to the shared S4 component files. I re-rendered the clip three times to check (dir1, dir2, dir3). `npx tsc --noEmit -p .` passes. S4's last frame is pixel-identical to S5's first frame, and the last 10 frames hold still.

**Defects found and fixed**
1. **Fold popped mid-move.** With the kit's steep ease, the people turned into tokens in about 8 frames. I changed it to a gentler sine-like ease over 60 frames (`room−6` to "with"). The crossfade now takes about 14 frames and heads stay in frame.
2. **First ruler (W1) ended on the partition.** At 72° its tip sat on the partition, so "1.33 m" read as the distance to the partition. It now starts at 77°, about 40 px clear.
3. **The "which way?" waver gave away his direction.** It swung through the partition and pointed at him (about 50°). It now hesitates only away from him (77°→96° and back).
4. **"1.33 m" came loose from the ruler.** It stayed put while the ruler moved, and the ruler then cut across it. The label now follows the ruler tip and fades out before the swing.
5. **The rulers were drawn above everything.** I moved them into the floor-diagram layer with the arcs, so they pass under the partition, plant, sensor and operator token.
6. **Second ruler (W4) brushed the partition end.** At 108° it was only 4 px clear. It now goes straight out at 90°, into the space between the partition and him.
7. **Back halves started drawing during the camera rise.** They now start at 60% of the move, and the cross-out still lands on "cross".
8. **Up to six diamonds on the wall in s22,** some half-overlapping during the slide. W2 and W3 now only appear for the four-spot flash in s23. The W1/W4 home markers stay hidden until the sliding lit spot has moved off them.
9. **Long holds and timing:**
   - **"all the same distance" (2.2 s hold):** the ruler, at the same length, now taps three of the faint copies of him in turn (145°, 92°, 58°). The copy it touches gets slightly darker, and each tap has a soft tick (SFX goes from 35 to 38 entries).
   - **"what kind of object" (2.2 s hold):** the dashed ring now draws wide (0.44 m) and closes to 0.26 m.
   - **Photo frame:** it is now struck out on "Not" instead of after "photograph", so the crossed-out frame stays up about twice as long.
   - **Margin:** "close → long and blurry" sat on the right 5% margin, so I moved it 14 px left.

Longest still is now 1.73 s, down from 2.2 s, and total still time is 12.5 s, down from 16 s. I checked the remaining text sizes, the caption band and the accuracy wording against the storyboard and C13–C19, and found no other problems. The light paths go through the gap, nothing uses `Math.random` or `Date`, and no frame numbers are hard-coded. One thing I flagged as a possible flash at f4936 on the contact sheet was only a downscaling artifact; the actual frames are clean.

**Remaining limitations**
- **The likely-location blob reads as a thin teal leaf over his token** rather than a distinct blob. It can't change in S4 alone: S5's `PlanBoard` copies the exact field and drawing order, so changing it would break the matching cut.
- **Kit behaviour I left alone:** the grey wall-top phase still shows for about 3 frames near the end of the fold, and the people and tokens briefly show see-through together mid-fold.
- **Short ending:** "not a photograph" is up for about 0.8 s and the crossed-out frame for about 0.4 s, because the scene ends 19 frames after the last word.
- **Second arc sweeps fast** (about 20 frames), limited by the gap before "On this side".
- **Face inset at the raised camera:** it stays in a fixed screen position, so while the camera is raised it covers the room's top-right corner. Nothing important is there.
- **Holds I kept on purpose** (≤1.73 s): the settle after the fold, the "busted" reaction, the long patch, and the empty board on "In practice".

**Final sheets** are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S4/dir3/dense/`: `S4_sheet01.jpg` to `S4_sheet05.jpg`, `motion_S4.png` and `motion.json`. The clip is `dir3/S4_clip.mp4`. The hand-off stills are `qa/scenes/S4/dir_hand/05691_5691.png` and `qa/scenes/S4/dir_hand_s5/05692_5692.png`. The baseline render is in `qa/scenes/S4/dir0/`, and the builder's original files are backed up in the scratchpad (`s4dir/orig/`).
