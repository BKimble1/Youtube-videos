# S6: builder and director-review reports

## Builder

I built S6 (s30–s35) as six shots, every beat cued from narration words, and `npx tsc --noEmit -p .` passes in my copy. One thing to know first: `timeline.json` was replaced partway through (S6 is now 7104–8798, not 7359–9037). Because every cue comes from `at()`, nothing needed re-timing, but my first stills round used the old frame numbers and is wasted.

**Shot by shot (cue words in quotes)**
- **S6.1 (s30), museum close-up.** The empty fourth plinth in `PLINTH` colours, with a sliver of the "2021" exhibit at the left and the velvet rope in the foreground (slight parallax).
  - The checker's arm, in its coral sleeve with the rig's mitt, enters on "study published".
  - It sets the small sensor down on its grip on "2026": tiny clink, contact marks, a teeter after she lets go.
  - The plate reads "published 2026" after contact and adds "MIT + Dartmouth" on "MIT".
  - One eased push-in toward the sensor ends before the label lands on "time-of-flight". The label reads "time-of-flight sensors", with "(LiDAR)" added on "LiDAR".
  - On "found", the readout wakes up. On "phones" and "gadgets", two icon badges pop in: a phone and a robot vacuum.
- **S6.2 (s31).** A generic blue phone, no brand, slides in on "Don't". Its screen shows "raw data" as small arrival-time readouts.
  - "not on your phone (yet):" appears on "yet".
  - A padlock drops after "keep", the data greys out, and the shackle snaps shut on "private". "raw data kept private" follows.
- **S6.3 (s32), three problem cards.**
  - Card 1: a dim beam with a pale pulse and a fainter, smaller echo. Label "weak laser → fainter echo", plus a "slowed down" chip.
  - Card 2: the `S6_ResearchModule` slab, whose 10×10 dots ripple in on "hundred" and pulse on "listening". Label "smartphone-grade device / (team's own) · ≈ 100 pixels".
  - Card 3: the checker reaches on "hold" and lifts the sensor off its tripod stand. It jiggles on "jiggles" while she stays deadpan. Label "held in hand → jiggles".
- **S6.4 (s33), burst.** Six dim, grainy plan "frames" pop in with shutter clicks, starting at the cut and running through "cameras". Each has its own timing noise and wider bands, so its blob is broad and displaced.
  - On "stack" they slide into a pile ("many quick, dim frames").
  - On "into one" they merge into a crisp card ("one better estimate"). The chip "our analogy: night mode" sits on screen, with an "illustrative" chip.
- **S6.5 (s34), smear.** The estimate card grows into the plan at `CAM_PLAN_ACT`, with a "frame 1/2" chip.
  - On "jiggles" the sensor jiggles and the wall points shift 3 cm. On "person moves" he steps from H_A to hiddenB and frame 2's bands appear.
  - On "Plain averaging", a coral smear about 0.7 m long forms, labelled "plain averaging → smear (illustrative)". The long-exposure photo of the guesser walking lands on "long".
- **S6.6 (s35), split.** The smear clears, he steps back to H_A, and the plan splits into two panels before the title chip "one unknown at a time" lands on "one".
  - Left, "move the sensor through known positions": the sensor slides on a rail from A to B1, leaving a dashed outline at A. B1's wall points ("listening spots") pop in, their arcs draw, their bands fade in, and the patch shrinks inside a dashed outline of the old one.
  - Right, "keep the sensor still": on "step", the bands and the cloud follow him from H_A to hiddenB, with a dashed outline of the old patch and a small trail.

**Geometry.** All bands and clouds use `layout.json` frame A, frame B1, H_A, hiddenB and the one-bin half-width (±3.75 cm), computed with `possibleCloud`. `assertPath` checks every S→W→H→W→S path at module load.

**Deviations from the storyboard, and why**
- **Smear method.** "Plain averaging" averages each wall point's band membership across the two frames, then combines the wall points as `possibleCloud` does. This is my own helper, `averagedCloud`, built on the kit's `bandMembership`. Frame 2 also has the sensor jiggle shift the wall points by 3 cm, which is illustrative and not in the layout; without it the smear breaks into pieces instead of reading as one long smear.
- **B1's wall markers** are drawn about 7 cm inside the wall edge as a second row. A and B1 sample nearly the same spots at x ≈ 1.55/1.58 and 1.76 m, so the diamonds would otherwise hide each other. The bands themselves are exact.
- **Card 3 label.** The storyboard leaves it blank; I added "held in hand → jiggles" to match card 1.
- **Phone and gadget icons** on "found in phones and gadgets" are not in the storyboard. I added them to fill a 2.5 s hold.
- **No checker in the split panels.** Her token fades out because the B1 sensor position is where she stands, and the left panel uses a rail (known positions, per claim C35) rather than her hand.
- **Clouds are drawn with my own shape** (`CloudShape`, ink and cream outline) instead of the kit's `PossibleCloud`, because the kit's version doesn't read on top of the guesser's token.

**Known limitations**
- S5 isn't built yet, so the shelf look in S6.1 (plinths, the "2021" plaque, the rope) is a guess at continuity and may need matching.
- The tripod stand is my own `S6_Stand`, not whatever S1 draws.
- The right-panel step is only 11 cm (about 53 px), so the cloud moving is a small motion. The dashed outline and trail help, but it is subtle.
- The `SFX_KINDS` list has no "rattle", so the jiggle uses `partition_wobble` at +8 semitones.
- There is one ambience for the whole scene (`amb_museum`), although most of S6 is graphics and plan views.

**SFX:** 26 events, including the ambience and 6 shutter clicks.

**QA:** the final dense pass shows 18 still runs, all designed reading holds of 0.83–1.63 s (the longest was 2.53 s before I added the icons). No pops or resets.

Files are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S6/source/src/`:
- `scenes/S6_Small.tsx` (`S6Small`, `SFX`)
- `components/v02/S6_Plinth.tsx`
- `components/v02/S6_Phone.tsx`
- `components/v02/S6_ResearchModule.tsx`
- `components/v02/S6_Stand.tsx`
- `components/v02/S6_PlanView.tsx`
- `components/v02/S6_Photo.tsx`

Final contact sheets and motion report are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S6/clip2/dense/`:
- `S6_sheet01.jpg` … `S6_sheet05.jpg`
- `motion.json`
- `motion_S6.png`

Stills rounds are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S6/`: `r2`, `r3`, `r4`, `r5`, the earlier dense pass in `clip/`, and the half-res render `clip2/S6_clip.mp4`.

## Director review

I reviewed S6 and fixed it in two verify rounds. The story now reads with the sound off, nothing pops or opens on an empty frame, and `npx tsc --noEmit -p .` passes. I changed only `S6_Small.tsx`, `S6_Plinth.tsx` and `S6_PlanView.tsx`.

**Defects found and fixed**

1. **S6.1, the arm looked like a coral pole.** About 1000 px of straight sleeve came in from the right edge, roughly 18 times its own width. It now comes down from above at about 38°, so only a forearm's length shows, and the cardigan sleeve is fuller with a cuff line.
2. **S6.1 didn't match S5's shelf.** S5 now exists in `work/S5`, so I matched it: S5's plinth size and plaque, the "2021 / Wisconsin + Milan" neighbour with S5's 2021 exhibit as it is in S5's last frame, the pools of light, and the rope posts and spans where S5 has them. The opening framing moves slightly left so the "2021" plaque reads.
3. **S6.1, the gadget badges** touched the label card and the plinth slab. Moved them clear.
4. **S6.2, "raw data kept private"** was on screen for only about 0.6 s before the cut. It now lands with the padlock, giving about 1.3 s.
5. **S6.2 and S6.3, empty frames at the cuts** (about 2–3 frames of bare paper each). The phone and the first card are now already moving in on the cut frame.
6. **S6.3, empty screen.** Cards 2 and 3 arrived 4.5 s and 9.5 s after the cut, leaving up to two-thirds of the frame empty. All three cards are now dealt on "These sensors are tough customers"; each lights up on its cue and the ones still to come wait dimmed. I also added an "illustrative" chip for the beam diagram, and made the pulse and the faint echo larger so the contrast reads.
7. **S6.3 card 3, hand detached from the arm.** The elbow was raised behind the sensor box, so the forearm was hidden and the hand looked separate. With the elbow down, the hand visibly holds the grip.
8. **S6.4, blank frames** at the cut (7956–7957). The first frame now pops before the cut.
9. **S6.4, composition.** The small frames sat in the left half, and the result card sat at the right with the left 55% empty. The six frames now land scattered and tilted across the whole screen, slide into a centred pile on "stack", and become one larger centred card on "into one", which then grows into the S6.5 plan.
10. **S6.4, layering.** The "many quick, dim frames" label sat over a frame that was still sliding in. It now waits until the pile has settled.
11. **S6.6, the checker faded out of the shot**, leaving the sensor floating unheld in both panels. She now stays. Left panel: on "Move" she lets go, her arm comes back, and she steps out before the sensor slides on the rail to B1, which is where she stood. Right panel: she keeps holding the sensor still.
12. **S6.6, no cue for where to look.** Both panels were identical, and the right one sat idle for 7 s. The right panel is now dimmed while the left is being described and lights up on "Keep". Both panel cameras moved slightly so the B1 stop and the checker fit.
13. **S6.6, B1 arc segments** first appeared as a stray stroke far from both the new spots and the person. They now grow outward from the hidden spot.

All new beats are derived from the existing word cues. The SFX list still has 26 events; the shutter clicks are clamped so none plays before the cut.

**Remaining limitations**
- **S5 continuity (needs your call):** S5's last frame shows an end-of-shelf stool and side card that would fall at about S6 x 1360–2080, which is inside the S6.1 frame. S6 leaves them out because the "time-of-flight sensors" label uses that wall. Either S5 frames them out before the cut, or we accept the jump.
- **S5 copies in `S6_Plinth.tsx`:** the 2021 exhibit and the plinth sizes are static copies of S5's still-changing code. If S5 changes them, these need updating.
- **Right-panel step:** the layout step from H_A to hiddenB is only 11 cm, so the cloud follows him with a small motion; the dashed outline and trail help.
- **Right-panel crop:** the checker is about one-third cut off by the right panel's left edge.
- **Kept from the builder:**
  - B1's markers are a second row just below the wall line.
  - The jiggle sound is `partition_wobble` at +8 semitones, since there is no rattle kind.
  - One `amb_museum` ambience runs for the whole scene.
  - The plan's large potted plant shows in every frame, as in the kit's room.
- **Still runs:** 18 holds of 0.83–1.63 s, all designed reading holds.

**Files**
- Final contact sheets: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S6/dir2/dense/S6_sheet01.jpg` … `S6_sheet05.jpg`, plus `motion.json` and `motion_S6.png`
- Clip: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S6/dir2/S6_clip.mp4`
- Earlier rounds in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S6/`:
  - `dir0` (baseline clip) and `d1` (baseline stills), with full-resolution checks in `d1full`
  - `dir1` (round-1 clip) and `d2` (round-1 stills)
  - `d3` (cut-frame stills)
- Edited files in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S6/source/src/`:
  - `scenes/S6_Small.tsx`
  - `components/v02/S6_Plinth.tsx`
  - `components/v02/S6_PlanView.tsx` (adds a `rot` prop)
