# S5: builder and director-review reports

## Builder

S5 (history shelf, s25–s29) is built: `npx tsc --noEmit -p .` passes, and the first frame is pixel-identical to S4's current last frame (I rendered S4's frame 5691 from `work/S4/source` and diffed it: 0 differing pixels). I did four render-and-fix rounds of stills plus three full clip renders. My last two edits (bigger "5 frames/s" readout and rope sign text) came after the final clip render; I checked them in full-resolution stills only.

**Shot by shot (cue words in quotes; every beat is built from `at()` calls, with `min`/`max` clamps for timing changes)**
- **S5.1 (s25–s26)**
  - From frame 2, S4's plan board (room plan at tilt 1, framed by CAM_PLAN_ACT, with tokens, sensor glyph and the teal blob) rolls up from the bottom. As it rolls it shrinks to 80 %, so the roll's spiral ends come into view and the museum shows behind it.
  - The scroll drops onto a wooden wall ledge with a squash, a bounce and a little roll.
  - On "2012" the camera trucks to the 2012 · MIT plinth at 1.4× zoom. The exhibit is a lab table filled edge to edge: laser, a rod with two mirrors, a big streak-camera box on a riser, a coral screen, a tiny wooden mannequin, and a small wall.
  - "recovering": the beam goes laser → mirror → mirror → wall, then wall → mannequin → wall → camera, each bounce thinner and paler.
  - "3D": a sketchy teal 3D outline of the mannequin rises out of the exhibit.
  - "mannequin": a ring goes round it. "around": the camera's direct line to it stops at the screen with a cross.
  - Labels "ultrafast laser" and "streak camera" pop on their words. "lab equipment": a saffron bracket runs along the whole table. "filled": the equipment hops left to right.
  - Chip: "illustration based on Velten et al. 2012".
- **S5.2 (s27)**
  - The camera trucks to 2018 · Stanford. A compact laser + detector unit aims at a small board.
  - "swept": the S4 wall-spot diamond hops a 5×3 raster across the board. "like": three slow single-spot stops.
  - "math … simpler": scribbles on the laptop collapse into one short line.
  - "reflective": light goes from the spot to an exit-sign pictogram behind a screen, a strong return comes back, and the sign glints.
  - "rebuilding": the picture forms on the laptop in 30 frames (one second), then "1 s" appears.
  - "Measuring": the wall clock's hand sweeps to 6.8 minutes while the raster runs again.
  - Chips: "illustration", "reflective exit sign: ≈ 1 s to rebuild", "≈ 7 min to measure".
- **S5.3 (s28)**
  - The camera trucks to 2021 · Wisconsin + Milan.
  - "Wisconsin": the strip detector's cells light up and the monitor turns on.
  - "sped": the big laser fires at a small wall.
  - "live": a ball rolls behind the screen, and the monitor shows a blobby picture redrawn every 6 frames (exactly 5 per second).
  - "five": a "5 frames/s" readout appears, filling one box per video frame.
  - Labels "powerful laser" and "custom detector". Chips: "illustration", "live · ordinary objects".
- **S5.4 (s29)**
  - "Impressive": the camera pulls back to the three exhibits.
  - "But": the velvet rope snakes across post by post (4 clips). "research": the "research equipment" sign drops onto it and swings.
  - "One team": the camera trucks to the end shot. On "tracked" the side card pops in; the tiny board blinks on "cheap" and pings on "sensor".
  - End shot (hand-off to S6, a cut): the 2021 plinth on the left, the empty fourth plinth in the centre (screen x ≈ 990), and the stool and card on the right, all behind the rope.

**Files**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/scenes/S5_History.tsx` (`S5History`, `SFX`)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/components/v02/S5_Board.tsx` (the S4 plan board and the scroll)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/components/v02/S5_Museum.tsx` (gallery, plinths in the shared plinth colours, posts, rope, sign, stool, side card)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/components/v02/S5_Exhibits.tsx` (the three exhibits, wall clock, mannequin and its 3D sketch, wall labels)

**Deviations from the storyboard and the brief**
- **Cheap-sensor side card:** I kept it, because s29's narration and claim C45 need a picture. Your direction didn't mention it. It sits on a stool past the fourth plinth, outside the rope and outside S6's close-up. The fourth plinth stays empty. Card text: "2021 / hidden objects tracked / with a cheap sensor / Callenberg et al. · illustration". The storyboard's parentheses are dropped.
- **Rope length:** the rope runs across all four plinths, not only the three exhibits, to match the rope S6 draws in front of the empty plinth.
- **Extra chips:** I added "illustration" chips for 2018 and 2021, and split the 2018 chip in two.
- **Text and walls:** plaques are two lines ("2012" / "MIT"). The exit sign is a pictogram with no lettering. The 2018 "wall" is a board facing the camera, so the raster can be seen.
- **2018 framing:** the 2018 close-up is at 1.28× zoom instead of 1.4×, so the clock above its board fits in the shot.
- **No travelling pulses:** light is drawn as static lines, not moving pulses, so there is no "slowed down" chip.

**S6 continuity mismatches.** The lead will need to reconcile these; S6 should copy from my files to match:
- S6's 2021 neighbour puts the laser and monitor on the right, its plaque reads only "2021", and its rope hangs higher (attached at y 640; mine at y 700 with a 100 px sag).
- My layout in world px: plinths at x 1100/2060/3020/3980, slab top 512, plaque top 586, floor 930, posts in the gaps.

**Known limitations**
- The motion report lists 11 still runs of 0.9–2.0 s, 14.6 s in all. Most contain small changes the detector misses (labels, rings, thin light lines). The longest, 2.0 s, is the end hold before the cut, which only has the board's blink and ping.
- The mannequin is tiny (about 140 px on screen). Neighbouring plinths and rope posts show at the edges of the close-ups.
- The monospace font puts a wide gap after the "5" in "5 frames/s".
- In the wide shot, plaque second lines are about 30 px, at the edge of the size rule.

**Sound:** 34 SFX entries, including one museum ambience for the whole scene.

**Contact sheets inspected (final clip):** `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S5/clip/dense/S5_sheet01.jpg` to `S5_sheet04.jpg`, with `motion.json` beside them. Full-resolution checks of the last edits are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S5/r4full/`.

## Director review

I reviewed S5 against the storyboard, the direction and claims C20–C25 and C45, then did three fix-and-verify rounds with stills and a full half-res clip render after each. I found 8 defects and fixed them all; `npx tsc --noEmit -p .` passes.

The opening hand-off is correct. I rendered S4's frame 5691 from `work/S4/source` and diffed it against S5's frame 5692: 0 differing pixels. The determinism check found no `Math.random` or `Date` calls.

**Defects found**
1. **S5→S6 cut (biggest problem).** The builder's report says the side card and stool sit outside S6's close-up, but they don't. S6's opening frame (`CAM_PLINTH_WIDE`) shows S5 world x up to 4860. The stool was at x 4740 and the card covered x 4380–5100, but S6 doesn't draw them, so both vanished at the cut. I rendered S6's frame 7104 to confirm.
2. **2018 laptop popped off.** It switched off abruptly (on/off, no fade) at frame 6565, during the truck to 2021, while it was still in view.
3. **Label didn't match narration or C24.** It read "custom detector"; the line says "custom detectors" and the 2021 setup used two detector arrays.
4. **Perpetual motion.** The 2021 ball rolled back and forth for about 13 s, through the wide shot, until the scene ended.
5. **Cheap-sensor beat hard to see.** The blink on "cheap" was a 3 px dot on screen, and the ping on "sensor" was faint.
6. **"Exit sign" beat didn't read.** There was a 1.8 s still run over "reflective exit sign, rebuilding", and the small sign was never singled out.
7. **"Took about a second" was hard to see.** The only sign was a small blob slowly growing on the laptop screen.
8. **Timing at −20 % narration.** I simulated every beat at 0.8×, 0.9×, 1.1× and 1.2× timings. At 0.8× the board's ping ran 1 frame past the scene end, and the table bracket started after "filled".

**Fixes made**
1. **S6 cut:**
   - The stool and card move to x 5290 (card width 660, so x 4960–5620). That is past the rope's last post and outside every S6 framing, including S6's push-in, which reaches x 4937.
   - The end framing is now `{cx 4620, cy 440, zoom 0.8}`: the roped-off empty fourth plinth on the left, the stool and card on the right. Card text is now about 38 px on screen.
   - The last truck runs up to 40 frames and ends on "hidden", before the card pops in.
   - This drops the builder's end shot (2021 plinth left, empty plinth centred). The plinth now shifts from screen x ≈ 450 to ≈ 1040 across the cut. The viewer's eye is on the card at that moment, so I judged the shift acceptable.
2. **Laptop:** it stays on and keeps the rebuilt picture and "1 s", which also shows in the wide shot.
3. **Label:** now reads "custom detectors" (box widened to 292).
4. **Ball:** it eases to rest at x 214 during the pull-back. S6's still copy of the exhibit has the ball at the same spot.
5. **Cheap sensor:** the board hops 16 px on "cheap". The status light is bigger. The ping is now three dark-coral arcs that travel further. Its length is clamped so it ends before the scene does.
6. **Exit sign:** it hops and swells once on "exit sign" (cue-derived and clamped, with a `pop_tick` sound). The reflected light clears just before the hop, so its end point doesn't detach from the moving sign.
7. **Rebuild:** a progress bar on the laptop fills over exactly the 30-frame rebuild, then stays full. "1 s" moved up 8 px to sit clear of the bar.
8. **Timing:** the table bracket's start is clamped to 10 frames before the hops, and the ping length is clamped as above. The simulation now passes at all five speeds; the only remaining warning is the bracket still finishing as the hops begin at 0.8× and 0.9×.

The motion report went from 11 still runs totalling 14.6 s to 10 totalling 12.7 s. The longest is now 1.8 s. There are now 35 sound entries (34 plus the sign hop).

**Remaining limitations**
- The longest remaining still runs are designed holds: arrival at 2012 (1.2 s), "camera: lab equipment that filled a" (1.8 s, while the labels and table bracket draw on), and the end hold (1.8 s, with the board's hop and ping).
- The mannequin (about 140 px) and the exit sign (about 60×46 px) are still small. Neighbouring exhibits show at the edges of the close-ups.
- The 2021 detector cells and monitor keep flickering at 5 frames/s for the rest of the scene. They're out of frame at the end.
- Plaque second lines are about 30 px in the wide shot.
- The rising 3D outline briefly passes in front of the 2012 wall.
- S6 still matches: its rope (y 700, sag 100), posts and 2021 exhibit already follow S5's files. If S6 ever widens past S5 x 4940, it would need the stool and card.

**Files changed** (the builder's originals are backed up in `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/orig/`):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/scenes/S5_History.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/components/v02/S5_Museum.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/work/S5/source/src/components/v02/S5_Exhibits.tsx`

`S5_Board.tsx` is unchanged.

**Final sheets** (`motion.json` sits beside them):
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S5/dir3/dense/S5_sheet01.jpg` to `S5_sheet04.jpg`
- Final clip: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/scenes/S5/dir3/S5_clip.mp4`
- Earlier rounds: `qa/scenes/S5/dir0/` (before my fixes), `dir1/`, `dir2/`, with stills in `d0` to `d3`.
- The cut check is `qa/scenes/S5/cut_d1.jpg`; `s6check/` and `s4check/` hold the hand-off frames I rendered.
