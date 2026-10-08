# S7: builder and director-review reports

## Director review after the light-path fix

Merged into `source/` on 2026-10-08 (not committed). Sheets in this folder are the review's final sheets from `qa/pathfix_rev/S7/clip_final/dense/`: `S7_sheet01.jpg`, `S7_sheet02.jpg`, `S7_sheet03.jpg`, `S7_sheet04.jpg`, `motion.json`, `motion_S7.png`, `final_stills_sheet.jpg`.

I found and fixed five defects in S7, over three fix-and-verify rounds. Every assert is still a throw and every cue still comes from `at()`, and S7's sound cues did not change. The only file changed is `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S7/src/scenes/S7_Results.tsx`; nothing in `source/` was touched and nothing is committed.

**Checks:**
- **Typecheck:** `npx tsc --noEmit -p .` passes.
- **Module load:** `collect_sfx.mjs` loads all nine scenes and every assert passes.
- **Cuts:** frames 8794–8806 and 10143–10149 are pixel-identical to `qa/cuts/r1`. Frame 10155 differs in 0.14% of pixels (max 23/255) in one vertical strip. That frame belongs to S8, which is byte-identical to `source/`, so it is render variation. The merge report saw the same thing.
- **Against the pre-fix baseline:** sheets 1, 2 and 4 match (the board beats, the museum, both cuts). The still-time report is the same: 5.3% still, longest hold 1.2 s.

**Defects fixed (frames are global):**
1. **The light path read as going through the partition (S7.3).** In the room, the wall-to-board leg shows from the wall spot to the partition's far edge, then only as a ~16 px stub at the board, with no plan card. I added the "seen from above" plan card in the left column. It shows the same four pulses on the same schedule (thin, then fat), plus the wall spot, the board and strip, both people and the sensor. It is on screen from the room's first frame (9379), before the first pulse reaches the wall, and leaves at 9581–9589, before "our clip" takes the column at 9593. I also marked the gap at the wall on the floor, the same way S1, S3 and S9 do. The "far more light" label moved below the card. New throws check that the card is in before the first pulse, stays until the fat return is back at the sensor, is gone before "our clip", clears her hair by at least 20 px, and that the label clears the "slowed down" chip. At phone size the fat return clearly reads as fatter in the card.
2. **The shoo covered the sensor and its readout (9678–9719).** This came from moving the sensor down to 0.95 m. It also read as a raised fist, and a straight-arm point put her hand on the partition's edge. It is now an arm raised toward him that flicks down and out three times. The stand now paints over her for the whole shot except the button press, as S1 and S9 already do. New throws check that the shoo hand stays above the box and at least 24 px short of the partition.
3. **Her reach back after the button press swept her forearm across the readout (~9746–9755).** She is now in front of the stand only for the press itself (9733–9745). The draw order switches while her hand hovers above the box, so nothing pops, and a throw checks that.
4. **In the s39 walk his hair touched the film strip's shadow (9880, 9940).** The hair height in the code was too low (456 instead of the measured 466). With the fix the s39 zoom is 1.09 → 1.055.
5. **The readout was hidden during the shoo**, which made the empty-room scan setup unreadable. This is fixed by items 2 and 3.

**What I checked and found fine:** labels meet the size rules and stay clear of the bottom 12%; the strip press and the button tap keep the existing contact checks (within 1 px); the partition top band never carries light; the partition stays opaque. In the pulse beat, the far panels stand clearly above both people. The museum floor is `C.paperDeep`.

**Remaining limitations:**
- **In s39 his head shows above the nearest panel's top while he stands behind it.** This comes from the room projection, not the set heights. The near end is 2.15 m out and its top draws about 80 px lower than his head. The partition is only about 120 px wide on screen, narrower than he is, so no spot on the hidden side can hide him and keep the screen visibly taller. It reads as him peeking out from behind, as in the pre-fix version. Fixing it would mean restaging the walk or changing the camera angle.
- **He is cut off by the right frame edge during the shoo push-in (about 9686–9697).** His face stays in frame. The scan framing is built so that he is out of frame at his waiting spot, and it was like this before the fix.
- **The reflective strip is on the board's camera-facing side, but the light reaches the board from behind.** The board's arrival flash and the bounce ring hide this in the room; the plan card doesn't show which side the strip is on.
- **The plan card is my addition for S7.** The plan listed it only for S1, S3 and S9.2, so the lead should approve it.
- **The 10155 pixel difference** is S8 render variation, not something this review introduced.

**S7 sound cues:** unchanged. The export to `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rcues_S7.json` has 69 S7 cues, identical to `audio/sfx/v2/cues.json`, and S1–S9 all match it, so no sound pass is needed for S7.

**Final sheets** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S7/`):
- `clip_final/dense/S7_sheet01.jpg` … `S7_sheet04.jpg`, `clip_final/dense/motion_S7.png`
- `clip_final/S7_clip.mp4`
- `final_stills_sheet.jpg`, from the full-res stills in `full_final/`
- earlier rounds for comparison: `clip/` and `full_r0/` (as merged), `clip_r1/`, `clip_r2/`, `full_r1/`, `full_r2b/`, `full_r3/`, `cuts_r2/`

## Before the light-path fix

### Builder

(see workflow journal)

### Director review

I reviewed S7 and found eight defects plus two small ones. All are fixed and checked over two fix-and-render rounds. `npx tsc --noEmit -p .` passes and the final clip renders cleanly (still share 5.3%, longest still 1.2 s).

**Defects found and fixed** (in `src/scenes/S7_Results.tsx` unless noted)

1. **Light path crossing the partition (S7.3):** the pulse trail had a gap cut into it right above the partition's far top corner, so the light read as passing behind or through the partition. The hiding test used a 1.7 m box, but the drawn panels are arched and 9 cm lower at the corner. The path is now tested against the partition as drawn, the same way S1 and S3 do it. The scene also now stops with an error if the path ever comes within 18 px of the partition. Clearance is currently 21.3 px and the trail is unbroken.
2. **Checker hiding the sensor (empty-room scan):** in the zoomed-in scan shot, her right side and hanging arm covered the sensor and its readout. The coral highlight was drawn on her sleeve and the dotted callout lines led to a hidden screen. She now stands 0.2 m further left in this scene. Her depth and all light paths are unchanged, and the sensor and readout are fully visible.
3. **Front view overflowing its card (S7.2):** the 560 px U image ran about 10 px past the card's right edge. It now sits 24 px inside. I also narrowed the "one position: an arc" callout so it no longer touches the image.
4. **"16 listening spots" next to only 4 dots (S7.1):** each dot seen from above is 4 spots stacked up the wall. A "×4" tag now pops under each column on "sixteen". This is accurate to the data, which only has x and z (`S7_Plots.tsx`, new `stackTag` prop).
5. **Shoo read as a raised fist and partly covered the sensor:** it is now a sweep. Her hand comes up beside her head, then swings out toward him three times, staying above the sensor. Sound cues moved 2 frames to match the outward swing.
6. **Too much at once during the push-in:** the "our clip" card was still sliding out while the camera pushed in and the shoo began. The card now leaves 1 s after the stamp lands. The push starts just before "And" and settles as the first shoo swing lands.
7. **Scan panel early:** the "empty-room scan" panel appeared 2 frames before her finger reached the button. It now appears on contact.
8. **Film strip dropping mid-move (S7.4):** it fell in while the camera was still pulling back. It now drops once the move has nearly settled.
9. **Minor:**
   - The tick on the sensor's own screen popped off during the S7.4 pull-back; it now stays on.
   - The "independent reproduction" plaque text ran edge to edge; it now has padding and stays inside the plinth.
   - The 2000 px camera move between the two evidence boards (S7.1 to S7.2) took 18 frames and read as a whip; it now takes 24.

**Checked and fine:** every cue still comes from the narration words, nothing is hard-coded, and nothing is random. All on-screen text meets the size rules and stays out of the caption band. Labels match the storyboard and claims C02, C12 and C32–C38. The hand touches the strip on "reflective". The guesser is correctly half-hidden by the partition's near panel in S7.4. The sound sheet has 69 entries, all inside the scene; it lost one film tick because the strip now drops later.

**Remaining limitations**
- The wall-to-board light leg passes about 21 px above the partition's far top corner on screen instead of visibly through the gap. That is the same path and framing S1 and S3 use. A path that really runs through the gap would need a lower path height or a new framing across all three scenes; that's your call.
- S7.4 shows our kit sensor and room while the chip reports the authors' 30 frames/s result in ordinary clothes. The chip line "a different capture from our clip" is the only thing keeping those apart.
- The museum set is plain and its push-in is about 10%.
- The front-view U panel is scaled per view and the colour ramp favours low values, as the builder disclosed; the data values are unchanged.

**Files**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S7/source/src/scenes/S7_Results.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S7/source/src/components/v02/S7_Plots.tsx`

**Final contact sheets** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S7/dir2/`)
- `clip/dense/S7_sheet01.jpg`
- `clip/dense/S7_sheet02.jpg`
- `clip/dense/S7_sheet03.jpg`
- `clip/dense/S7_sheet04.jpg`
- `clip/dense/motion_S7.png`
- `clip/S7_clip.mp4`
- `stills/` (full-scale check stills)

The baseline before my fixes is in `qa/scenes/S7/dir0/`, and round 1 is in `qa/scenes/S7/dir1/`.
