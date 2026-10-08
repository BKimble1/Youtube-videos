# S9: builder and director-review reports

## Director review after the light-path fix

Merged into `source/` on 2026-10-08 (not committed). Sheets in this folder are the review's final sheets from `qa/pathfix_rev/S9/clip_r3/dense/`: `S9_sheet01.jpg`, `S9_sheet02.jpg`, `S9_sheet03.jpg`, `motion.json`, `motion_S9.png`, `S9_phone40_final.jpg`.

I reviewed S9 in the isolated copy at `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S9`. I found and fixed four defects over three fix-and-check rounds. Each round I rendered the half-res clip, read the dense sheets and checked full-res stills, including at 40% size. `npx tsc --noEmit -p .` passes, every assert is still a throw, and every cue still comes from `at()`. S9's sound cues did not change.

### Defects found and fixed (all in `src/scenes/S9_Payoff.tsx`)

1. **The push still read as dragging (lead override 2).**
   - **Cause:** the back-view staging was right, but his left hand target sat almost on his left shoulder, so the arm was folded shut (hand about 15 px from the shoulder). The arm solver then swung that upper arm from −15° to +95° with every step. Mid-push he looked like he was reaching after the screen.
   - **Hands:** I moved them to 0.62 m (left, at the hip) and 0.92 m (right, reaching across at chest height). The upper arm now stays between −44° and −34° and only the elbow flexes.
   - **Body:** during the push he is now placed on his body point instead of his rear foot (new `pushWalkAt`). Planted feet stay on their footprints (I tracked the shoes frame by frame: no sliding).
   - **Posture:** a deeper crouch (`PUSH_SINK` 14) and more hunch.
   - **Result:** with the sound off he now reads as walking the screen back to the wall. He has his back to us during the push and faces us again for the dust-off, the smug beat and J4.
2. **A new 0.93 s freeze (frames 11423–11450) on "careful timing and math".** Nothing moved except the small blob. This wasn't in the baseline: the smaller set-scaled figures no longer give enough idle motion. I added a planned reaction (`GULP`): he gulps and peeks out past the screen toward her sensor until the clue lights. The motion report now flags only the end-card holds, as in the baseline.
3. **The scene failed to load if the narration runs 20% faster.** At 0.8× timing the "PlanCard in before the first pulse" assert threw (the card was 4 frames late). The card's entry is now `CARD_IN = min(RISE_END − 8, P3_0 − 14)`. With word timings scaled to 0.8× and 1.2×, the module loads with every assert passing.
4. **The "paths now stop at the partition" beat was weak at phone size.** The crosses on the partition were 20 px and faded out just as the readout went blank. They are now 26 px (`CROSS_S`) and stay up until 6 frames after the readout goes blank, so the blocked light and the blank screen are on screen together.

### Checks that passed

- **Light paths:** no light on or above the partition's top band. The W3 leg goes behind the far end about 250 px below its top corner. The plan card is in sync with the room, readable, and clear of both characters and all labels; it is never shown during S9.3 or R4. The 2 m partition is clearly taller than both of them.
- **R4 (11570–11621):** the camera is locked, there are no overlays, and the first 4 and last 4 frames are static. Renders made in the same call are bit-identical. The renderer itself sometimes varies (up to 7/255 on about 300 floor pixels at the bottom); I confirmed this by rendering the same frame three times.
- **Text and frame:** "slowed down" is 32 px and "likely location" is 36 px. Nothing but feet falls in the bottom 12%, and nothing is clipped.
- **Cuts and J4:** the cut in from S8 and the end-card wipe are unchanged. J4 reads.
- **Against the pre-fix sheets in `qa/scene_review/S9`:** nothing regressed.

### Remaining limitations

- In the room view only about 50–70 px of each wall-to-him leg is visible, entering the gap. "Around the end" relies on the plan card and his saffron rim flash; this is the risk the plan itself names.
- The `CAM_W` framing is tight: his shoes at the start of the push and the pushed screen's top are each about 12 px from the frame edge. Neither is clipped.
- At 0.8× timing the plan card starts leaving about 2 frames before the last echo lands, and only about 17 frames separate the busted beat from the end-card wipe.
- J4 is a lean past the near end. From this front-left camera the partition can't stand between them (same as the baseline).
- The readout inset pops out with an overshoot at frame 11497. That is its designed exit and matches the baseline.

### SFX cues

They did not change. `rcues_S9.json` matches the merged `audio/sfx/v2/cues.json` for all nine scenes; S9 has 43 cues. The sound pass already pending from the merge's footstep change still needs to run.

### Files changed

- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/rev_S9/src/scenes/S9_Payoff.tsx` (only this file; no `S9_*.tsx` component changed)

### Final sheets

- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S9/clip_r3/dense/S9_sheet01.jpg`, `S9_sheet02.jpg`, `S9_sheet03.jpg`, `motion.json`
- Phone-size (40%) key frames: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S9/S9_phone40_final.jpg`
- Full-res final stills: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S9/full3/`
- Before my fixes: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S9/clip/dense/` and `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/pathfix_rev/S9/full0/`
- Cue export: `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rcues_S9.json`

## Before the light-path fix

### Builder

S9 Payoff is built in `work/S9/source`, and `npx tsc --noEmit -p .` passes. I did six still rounds and three full scene-clip renders. The only still runs the motion report flags are the end-card holds (11785 onward), and those are the intended end-screen hold.

**Shot by shot** (provisional timeline frames)
- **S9.1, s45 (11173–11253):** room view, tilt 0, `CAM_ROOM`. The guesser stands at H behind the partition looking nervous: paws up, a sweat drop, eyes darting toward the checker. She stands by the sensor on its tripod, arms crossed, deadpan. On "friend" he notices us and gives a sheepish grin and a tiny wave, and she side-eyes him.
- **S9.2, s46:**
  - On "Being" the camera rises to `RAISED_TILT` and frames at `CAM_W` (950, 520, ×1.22). This is the only camera move in the scene, and the camera stays locked after it.
  - Two slowed round trips run: S→W3→H→W3→S and S→W4→H→W4→S. Each has scatter fans, and the pulse reaches him on "away" (he flinches). The "slowed down" chip is up while they run.
  - On "careful", a magnified readout appears top-left: a teal bezel showing a small plan view. A teal ring marks the real sensor. The likely-location blob grows on "math", and on "clues" it lights up with a "likely location" label (36 px). He deflates.
  - The sensor's own small screen shows the same blob.
- **S9.3, s47 plus the 4.5 s hold:**
  - He gets the idea on "hide" and starts walking on "he'd". He walks toward the camera to the partition's near end with his feet planted on plan footprints.
  - **R4 = {from: 11570, to: 11621}:** both hands go on the near end, he squats briefly, then pushes it 0.65 m back along z in three shuffle steps. It hits the wall at speed (thunk) and wobbles. The partition and all the optics use `movedLayout()`, which ends with z0 = 0. The camera is locked, and the first and last 4 frames are held still; the start window is bit-identical, the end window differs by under 4 levels of anti-aliasing.
  - A new pulse: the light still reaches W3, but what scatters toward him stops at the partition, and the straight route toward W4 is blocked. Coral crosses mark both stops on the partition. In the readout the blob blinks out and the screen goes blank (readout_off).
  - He steps clear, dusts his hands, and stands smug with his eyes shut. The checker strolls to the left of the near end with her arms crossed and leans round it, deadpan. He opens his eyes and looks busted. The beat holds about 1.1 s.
- **S9.4, s48:** a hard-edged wipe to warm yellow #FFC744. FUTURE / GOT / WEIRD pop in on their words (logo_hit on "Future"), in Fredoka 132 px with GOT in coral. "The strange future, explained." follows on "the" and "explained", in Nunito 52 px with a teal underline under "explained". Everything sits in the top third, so the lower two thirds are clear for end-screen elements. It holds to 12091.

**Files**
- `src/scenes/S9_Payoff.tsx`: exports `S9Payoff`, `SFX` and `R4`
- `src/components/v02/S9_Room.tsx`: a copy of the S1 tripod stand, `movedLayout`/`boxOf`/`behindBox`, and a walk-in-depth helper with planted feet (`planWalk`/`walkDistance`/`walkAt`/`walkContacts`)
- `src/components/v02/S9_Readout.tsx`: the magnified readout and the sensor's small screen
- `src/components/v02/S9_EndCard.tsx`: the end card

**Deviations from the storyboard**
- **Only two wall spots, W3 and W4, instead of "several".** At `RAISED_TILT`, the W1→H and W2→H legs graze the partition's far top corner on screen. That breaks the storyboard rule "clear of the screen's silhouette", and S1 made the same choice for the same reason.
- **One raised framing for S9.2 and S9.3,** slightly lower and wider than `CAM_RAISED`. His feet at the near end and both partition positions have to stay in frame during the push.
- **The push is staged around the frontal rig.** He stands just right of the near end, with his torso drawn behind the end strip and both arms drawn in front of it.
- **No "dust hands" sound kind exists,** so cloth_rustle is used. Room tone runs only until the end card, not over the card.

**Known limitations**
- On screen the W→H legs pass just beside the partition's far top corner. It is geometrically correct, but "through the gap" reads less clearly than it would with a floor trace.
- The rigs are not shortened by the raised view, so they stand taller than the partition on screen. That makes J4 read as "she leans past its end" rather than truly peeking round it.
- The checker's lean and the busted reaction sit in the bottom 12 % (feet only). No text is there.
- The post-push beats compress if the hold shrinks (down to 0.6×). If the real pause is much shorter than 4.5 s, the end-card wipe will cover part of J4.
- The magnified readout covers the plant, and its leaf tips peek above the bezel.

**SFX:** 39 cues, sorted by frame.

**Contact sheets I inspected** (final):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S9/clip/dense/S9_sheet01.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S9/clip/dense/S9_sheet02.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S9/clip/dense/S9_sheet03.jpg`
- dense strips `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S9/clip/seq_walk_push.png` and `seq_j4.png` (from the second clip render; the later changes to the blocked pulse and her stride are checked in r6full)
- full-resolution stills in `qa/scenes/S9/r5full` and `qa/scenes/S9/r6full`

### Director review

I reviewed S9 and fixed 10 defects, all in `src/scenes/S9_Payoff.tsx`. `npx tsc --noEmit -p .` passes. I ran three render rounds (half-res clip, dense sheets and full-res stills each time). The motion report now shows only the intended end-card holds (11785 onward).

**Defects found and fixed**
1. **Light paths didn't visibly use the gap (S9.2).** In the raised view the W3/W4→H legs pass right beside the partition's far top corner, so they read as going over the top. I added S1's dashed white gap marker between the partition's far end and the wall, from the end of the camera rise until the paths fade. Now the light reads as going through the opening, matching the S1.4 look.
2. **The readout showed the partition in the wrong place after the push.** Both the magnified readout and the sensor's small screen still drew the partition at its old spot, with a gap at the wall. They now draw it at its moved position, so after the push the readout shows the gap closed.
3. **The blocked pulse was too fast and too short.** It ran at 0.11 m/frame, about 1.7× the S9.2 pulses, which are also labelled "slowed down". The readout also went blank only about 4 frames after the pulse stopped. The pulse now runs at the S9.2 speed. The readout blanking, the path fade, the readout's close and her walk all start after the pulse has stopped, so the order reads: light blocked, screen goes blank, she walks.
4. **J4 was crowded and off-model.** She ended right on top of the tripod with the sensor beside her ear, and after the lean her head nearly touched his shoulder. Her stop moved from x 1.56 to 1.73 and his step-clear from 2.62 to 2.76. Her head now clears both the sensor and the near end, and there is space between the two characters.
5. **Layering error on the walk.** On the walk to the near end his left arm and hand were drawn in front of the partition while he was behind it. He is now layered behind the partition for the whole walk.
6. **The teal ring was left floating.** It stayed on the sensor after the push while she walked past the stand. It now fades out before she sets off.
7. **Plant leaves poked out above the readout bezel.** The readout box was moved up and enlarged to 96, 28, 420 × 386, so no leaf shows above it.
8. **Missing footsteps.** His step clear after the push had no sound. I added two `footstep_wood` cues from `tripContacts`, using the same plan as the animation.
9. **No sound on the joke.** I added `uh_oh` on the busted beat ("three or four comic reactions" in the direction). There are now 41 SFX cues, sorted and all inside the scene.
10. **A timing knock-on.** Her walk start had been tied to when the readout closes. At 1.2× timing her walk could start late, so it is now cued from the blank (`max(o(32), BLANK)`).

**Checks that passed**
- R4 = {from: 11570, to: 11621}, locked camera. Both static windows are bit-identical: 11570 to 11573 and 11617 to 11620 both show 0 pixel difference.
- No `Math.random` or `Date`, and no absolute frame numbers in the scene file.
- With all word timings scaled to 0.8× and 1.2×, every beat stays in order and finishes before the end-card wipe.
- Labels:
  - "slowed down" is up whenever a pulse runs.
  - "likely location" is 36 px.
  - The end-card wording and colours match the storyboard and `Sets.tsx`.
  - No critical text falls in the bottom 12 %.
- Claims C04 and C19 are consistent with what is shown: a likely location, not a picture, and light that goes around rather than through.

**Remaining limitations**
- **Two wall spots instead of several.** At the raised view the W1 and W2 legs cross the partition's silhouette on screen; this is the same choice S1 made.
- **W→H legs still pass close to the far top corner.** The gap marker softens this but doesn't remove it.
- **J4 is a lean past the near end, not a true peek round it.** The rigs aren't shortened by the raised view, so they stand taller than the partition.
- **The blocked W3 bounce stops right at the wall.** W3 is about 3.5 cm from the closed partition, so the coral cross sits on the wall spot itself. It is correct, but the bounce is barely visible.
- **At 0.8× timing the payoff gets tight.** Her walk speeds up to 5 frames per step, and only about 11 frames remain between the busted beat and the end-card wipe.
- **Some dense strips the builder listed weren't there.** `seq_walk_push.png` and `seq_j4.png` were not in `qa/scenes/S9/clip`.

**Final sheets** (in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S9/dir3_clip/dense/`)
- `S9_sheet01.jpg`
- `S9_sheet02.jpg`
- `S9_sheet03.jpg`
- `motion.json`

Full-res stills are in `qa/scenes/S9/dir1` (before), `dir2`, `dir3` and `dir4`. The walk and J4 strips are `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/strip/{guesser_walk,checker_walk}.png`.
