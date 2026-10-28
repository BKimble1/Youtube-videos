# Flying Skateboard V2: QA report

File: `exports/FGW_Flying_Skateboard_V2_REVIEW_1080x1920.mp4`. Measured with `tools/qa.py`, with the results in `qa/v2_review_qa.json`; the sheets in
`qa/v2_review_sheet_*.png` are made from the MP4 itself.

**Not checked here:** real-time playback and listening. This environment has no playback, so motion was judged from dense frame sheets, the measured frame-to-frame change, and the full-resolution working stills (`source/sheet2.sh`). It still needs one watch on a phone, with sound, before publishing.

## Specs (measured from the file)

| | |
|---|---|
| Video | H.264 High, 1080×1920 (true; not upscaled), 30/1 fps, yuv420p, BT.709, 1077 frames, 35.904 s, 8.0 Mb/s |
| Audio | AAC, 48 kHz stereo, 317 kb/s; −14.02 LUFS integrated, sample peak −2.49 dBFS |
| Decode | full decode, no errors |
| Black frames | none |
| Frozen stretches (no visual change for more than 1 s) | none |
| Loop junction (last frame against frame 0, mean absolute difference) | 1.44, against a median frame-to-frame step of 5.97: the jump back to frame 0 is smaller than an ordinary frame step |
| Largest frame step | frame 280 (9.33 s): the fan → jet-intake match on "But" (an intended match cut) |
| Mix | voice −17 LUFS, 14.8 dB above everything else in the 400 Hz–5 kHz band while he speaks. Score, rotor oscillators and filtered noise wrap across the loop |

## The V2 brief's QC list

| Check | Result |
|---|---|
| **Propeller count and geometry** | One definition (`BD`) everywhere: ten ducts in two rows of five, the same positions in the hook, the under-board count, the cutaway (the section opens in duct 5, a real duct in the row), the field, the bench build (empty sockets dark, then ten seated) and the payoff. The jet prototype keeps five engines, 2-1-2, through the whole test |
| **Hands, feet, knees, elbows** | Feet planted on the same deck positions in every shot; two-bone IK legs and arms, knees over the toes, no reversed elbows seen in any sheet. The balance shots move through ankles, knees, hips, spine, shoulders and arms (`problemFlight` → pose) |
| **Helmet, face, clothing** | The same helmet, smoked visor, orange jacket with stripe, gloves, dark trousers and white shoes in every shot, the workshop inventor included. The earbud and wrist phone are present throughout |
| **Impossible physics** | The board's attitude is a lagged response to the body (it never moves on its own to balance). Tilt is integrated into drift (`simulate`, 120 Hz). The hook is one continuous trajectory (no teleporting); the payoff runs from the river into the gorge mouth on one path. The fire starts at a fuel fitting and spreads along that line; the inventor steps back |
| **Static holds** | No frozen run longer than 1 s; every shot has camera motion and subject motion |
| **White wipes and hard cuts** | No wipes. Changes of place are matches: the water ring → the dust ring, fan → intake, compressor → electric fan, bench → field, high-angle gorge → high-angle river. The cuts within a scene are to a different view of the same action (feet, phone, earbud). `qa/v2_review_sheet_cuts.png` shows the frame before and after every boundary |
| **Small rider compositions** | The rider is large except in three short wides: the pull-back at 0.8–1.5 s, the river establishing shot at 27.67–28.1 s, and the high-angle canyon view at 30.96–32.1 s, where he is about 5–8 % of frame height. Each lasts under 1.2 s, and he stays readable (orange jacket, white helmet) |
| **Loop** | `ENDK`'s last key is exactly `HOOKA[0]`, on the same `hookFlight` trajectory (τ = t − 35.9 s), with the same water time and motion blur. The last frame differs from frame 0 by less than one ordinary frame step. Audio wraps without a seam step (sample jump 0.044, within ordinary sample-to-sample variation of the noise beds) |

## Fixed during V2 review

- Loop: the ending's final camera key did not match the new opening key. Both are now ck(252, −19, 4.6, 60, 0, −3).
- Workshop: the inventor was out of frame. He was moved to the near side of the stand, so he is visible lowering the last engine and stepping back from the fire.
- Bench:
  - Too tight, and the spare unit's path was off-screen.
  - The unit now sits beside the new frame, and the camera swings round the subject (`swingCam`) instead of sliding through the wall.
  - The unit slides, hops into its socket and seats; the other nine follow.
- Cutaway: the legs covered the section window. The camera is now lower and further out, so the window and the streamlines read.
- Feet close-up: widened, so the board edge and both feet read.
- Canyon high angle: was all water. It now shows the wall, the water below and the rider, and the following match into the ending starts closer.
- Smoke: thinned as the camera dives into the compressor, so the match to the electric fan reads.
- Water motion blur: only at the hook and the loop junction, where the camera speed justifies it.
- Mix: the spray bed under frame 0 now fades in at the end of the film, so it wraps without a level step.

## Known residuals (for V3 or a decision)

1. **The canyon is now one connected flight from the river.** The V2 brief asked for this, but V1's verified facts say the two flights were separate demonstrations. See `SOURCE_NOTES.md` (V2) for how to restore the separation.
2. **Tripod phones** are a V2-brief staging device. The verified phones (in the board and on the wrist) are both still shown; see `SOURCE_NOTES.md`.
3. **Ending to frame 0:** the ending opens with a match from the high-angle view in the gorge to the same framing over the open river. It is a match cut between two places, not a continuous move; the ending's own flight is the hook's trajectory and lands on frame 0.
4. At about 4.3–4.7 s the caption "You see, ten powerful" sits over the board's underside during the duct count. It is readable, but it covers some ducts.
5. The spare fan unit on the bench trails a short red power lead from its hub, which reads a little like a stray line.
6. At the loop point the caption changes from none (after "YOUR PRICE?") to "This skateboard" at frame 0. This is the same as V1, and the narration starts at 0.13 s.
7. Board geometry is still reference-grounded on reported specifications, not traced from footage (as in V1).
