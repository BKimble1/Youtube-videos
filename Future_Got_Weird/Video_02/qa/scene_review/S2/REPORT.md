# S2: builder and director-review reports

## Builder

S2 (s09–s12) is built: four shots in `S2Mirror`, all cued from narration words. `npx tsc --noEmit -p .` passes. I did four render-inspect-fix rounds; the last motion pass reports no still runs over 0.8 s.

**Mirror point check.** I reflected H (2.6, 0.85) across the wall line z = 0 and intersected S→H′ with the wall. The point is x = 2.1386 m, so the storyboard's 2.14 is right. The scene checks this every run: the two angles must be equal, the point must sit inside the mirror panel, and `assertPath` must pass. The sensor→mirror leg crosses the partition plane at z ≈ 0.26 m, inside the gap.

**Shot by shot**
- **S2.1, bench close-up (plan view).**
  - A painted panel slides in. On "plain wall" a torch lights a patch that sweeps along it.
  - On "Start with a mirror" a mirror slides in and tings, the torch swivels to it, and the camera pushes in.
  - On "Light" one slowed ray bounces off the mirror at "same". The normal and two ticked arcs draw, then "in = out" lands at "arrived".
  - On "so the picture" a postcard of the guesser replaces the torch. Three coloured rays bounce as a parallel bundle, and the picture reappears whole, mirrored, by "whole".
- **S2.2, raised room view.**
  - Cut on "Put" to CAM_RAISED moved up to `cy` 395, so the wall above their heads is in frame.
  - On "here" a framed mirror slides down onto the wall at x 1.9–2.6 m and tings. The camera pushes in past the checker, who looks up at the mirror.
  - A slowed pulse runs sensor → mirror point → him, and he looks busted on "friend".
  - On "visible" he ducks in 4 frames, squashes and holds. His reflection ducks too, leaving only his hair and eyes peeking at the bottom of the glass.
- **S2.3, the paint up close.**
  - On "A painted wall" the mirror slides off and he stands up, relieved (a sigh).
  - A magnifier pops onto the bare wall and irises open into a cross-section of the paint. "rough up close" lands on "close".
  - "throws light": one ray in, a cosine-weighted spray out. "each spot": two neighbouring spots spray too. "less like a mirror": a dashed ghost of the mirror's one reflected ray appears and fades. "more like a tiny lamp": three waves run out along every ray. That line is not captioned.
- **S2.4, postcard, then room.**
  - The postcard falls in on "picture" with the "metaphor" chip, gets a postmark on "postcard", and shreds on "shredded". The pieces tumble into a pile, and the camera pushes in on it during "waiting to be sorted".
  - Cut to the raised room on "worse". An inset keeps the pile, and on "bits" a piece showing his eyes and grin lifts out.
  - Three paths draw on: head, shoulder and feet, each to a different wall spot, then to the sensor. All pass the plan-view check and stay at least 14 px clear of the partition on screen.
  - On "Everything" coloured pulses run the paths and merge into one plain blip on "blend". On "What" the blip drops into a row of timing bars, and "what survives: timing" lands.

**Deviations and why**
- **Reflection position:** the reflection sits at the sensor's mirror point (its chin at x 2.139 m), not where this camera would see it. At tilt 0.4 a true camera-view reflection would put his head above the wall top. It is also placed where the sensor "sees" him, which is the point of the line.
- **"Over the shoulder":** the rigs only face the camera, so this is a push past the checker (left foreground, looking at the mirror), not a true over-the-shoulder shot.
- **S2.4 path heights:** the people are drawn full height while the raised view squashes heights. So the paths start at the drawn head, shoulder and foot, using an adjusted 3D height. Timing uses real body heights: the three path lengths are 2.458, 2.439 and 2.492 m, all within one 250 ps bin. The scene throws an error if they ever differ by more than 7.5 cm.
- **Path look:** the wall spots end up high (1.9, 1.9 and 1.2 m) because they must be visible, equal length and clear of the partition. On screen the legs pass above the partition's top, the same look S1 uses.
- **Additions not in the storyboard:**
  - the torch and lit-patch opening on the bench
  - the postcard used for "the picture stays whole"
  - the confetti inset in the room
  - pulses coloured by body part
  - faint background bars and a "time →" axis label (34 px)
- **Shared-file copy:** `S2_SensorStand.tsx` is a copy of S1's stand so the prop and its placement match. You may want to keep only one.

**Known limitations**
- The receiving frame in S2.1 is a stand-in for "what you'd see in the mirror". A plain card would not physically form an image.
- The paint grains are magnified for illustration, with no scale shown.
- The flash ring where the pulse hits the mirror briefly overlaps the reflection's chin.
- I checked timing robustness only from the derived cue frames, not with renders: with the scene's words compressed to 0.8× and stretched to 1.2×, every beat stays in order and the final label lands 34 frames before the scene ends at 0.8×.

**Sound:** 24 cue-sheet entries (`amb_room` once, plus 23 physical events). All kinds come from `SFX_KINDS`.

**Text sizes:** "in = out" is about 73 px on screen, "rough up close" 56, "what survives: timing" 52, "metaphor" 36/34, "time →" 34. Nothing sits in the bottom 12 %.

Files are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S2/source/src/`:
- `scenes/S2_Mirror.tsx`
- `components/v02/S2_Bench.tsx`
- `components/v02/S2_Section.tsx`
- `components/v02/S2_Postcard.tsx`
- `components/v02/S2_SensorStand.tsx`

Final contact sheets, in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/clip/dense/`:
- `S2_sheet01.jpg`
- `S2_sheet02.jpg`
- `S2_sheet03.jpg`
- `motion.json`

Stills from the rounds are in `qa/scenes/S2/r1`, `r1b`, `r2`, `r3` and `r3full` under the same Video_02 folder.

## Director review

I reviewed S2 against the storyboard, the direction and the brief, and fixed 8 defects in two rounds of changes, each checked with a new render. The fixes are all in `src/scenes/S2_Mirror.tsx`; no shared files were touched. `npx tsc --noEmit -p .` passes, and the motion report shows no still runs.

**Checked and correct**
- The mirror point is right: x = 2.139 m, the angles are equal, and the scene re-checks this every run.
- Every cue comes from a narration word. With word timings compressed to 0.8× and stretched to 1.2×, every beat stays in order and the final label still lands 34 frames (0.8×) and 58 frames (1.2×) before the scene ends.
- Everything is driven by the frame number with seeded randomness only.
- Text sizes pass the rule and nothing sits in the bottom 12 %.
- The claims match research/claims.csv (C08, C09, C10).
- The duck at J2 works: a 4-frame drop, a squash, a hold, and the reflection ducks too.

**Defects found and fixed**
1. **No "slowed down" label on any slowed pulse (brief rule).** I added S1's saffron "slowed down" pill (32 px, top right) to the bench ray, the mirror pulse and the S2.4 pulses. Each fades out after its pulse.
2. **Magnifier in the wrong place (S2.2→S2.3).** It landed on top of the partition, and its handle crossed his shoulder. It now sits on the bare wall where the mirror hung, with a smaller lens and the handle pointing up-left into empty wall.
3. **"less like a mirror" didn't read with the sound off.** The comparison ray was a thin grey dotted line. It is now a bold blue dashed ray with a white edge and a blue pulse dot, and it leaves just before the lamp waves start.
4. **Push onto the confetti pile was badly framed.** The push left the pile in the lower third with 55 % of the frame empty. It now ends with the pile centred.
5. **Empty left third of the frame for about 2 s in S2.4.** The confetti inset left on "Everything" but the timing card only arrived on "many". The inset now stays until the timing card slides in.
6. **"Head, shoulder, feet" didn't read.** The paths start behind his body, so their starting points were hidden; the foot path seemed to start at his knee. Small coloured markers now pop on at his hair edge, shoulder and shoe as each path draws.
7. **The timing bars implied his echo was the biggest return.** The faint background bars were made-up data, and his blip became the tallest bar. That would contradict S3.2, where his echo is tiny next to the wall echo. The card is now a row of 12 empty time slots, and the blip fills the one it arrives in. This is my main change to the builder's design.
8. **The blip crossed the checker's body on its way to the card.** It is now tossed up and over her head, then drops into its slot.

**Remaining limitations**
- **Feet path hugs the partition.** In S2.4 the foot-to-wall leg runs 18 px from the partition's top edge on screen. I searched every wall spot and both feet. Under the equal-length rule (within one 250 ps bin) and the on-screen visibility needed, there is nothing better, so I kept the builder's layout.
- **Paths look like they go over the partition.** In the raised view, legs that pass through the gap appear above the partition's top on screen. This is the same accepted look as S1.
- **Accepted from the builder:**
  - The reflection's chin, not its chest, sits at the mirror point.
  - "Over the shoulder" is a push past the checker.
  - The dashed receiving card on the bench is a stand-in.
  - The paint grains are magnified with no scale shown.
  - The flash ring overlaps the reflection's chin.
- **Small overlaps and edges.**
  - The blip's toss briefly passes the checker's pencil tip.
  - The bench's right edge shows during the bench push.
  - The left side of the raised room shows paper outside the room, as in S1.
- **Duplicate file.** `src/components/v02/S2_SensorStand.tsx` copies S1's stand; the lead should keep only one when merging.
- **Sound.** The cue sheet is unchanged at 24 entries; the new elements have no sound.

**Final contact sheets**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/dir2/clip/dense/S2_sheet01.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/dir2/clip/dense/S2_sheet02.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/dir2/clip/dense/S2_sheet03.jpg`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/dir2/clip/dense/motion.json`

Clip: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S2/dir2/clip/S2_clip.mp4`. Earlier rounds are in `qa/scenes/S2/dir0` (baseline), `dir1` and `dir2` (stills and the blip-toss frames).
