# Flying Skateboard V5: QC report

**File:** `exports/FGW_Flying_Skateboard_V5_REVIEW_1080x1920.mp4` (build J). Measured with `tools/qa.py`; the results are in `qa/v5_review_qa.json`, and every sheet in `qa/v5_review_sheet_*.png` is made from the MP4.

**Status: REVIEW, not final.**
- Every check below was made on frames decoded from the rendered files.
- The camera numbers were measured on the decoded frames.
- No one has watched it in real time with sound, which this environment can't do. Mark it final only after one real-time viewing on a phone, with sound.

## Specs (measured from the file)

| | |
|---|---|
| Video | H.264 High, **1080×1920 decoded**, 30/1 fps, yuv420p, BT.709, 1077 frames, 35.90 s |
| How it was made | Rendered at 2160×3840, then downsampled with Lanczos (not an upscale) |
| Audio | AAC 48 kHz stereo; −14.02 LUFS, sample peak −2.5 dBFS. Voice is 15.1 dB above music and effects in the speech band; the narration is sample-identical to the V1 take. |
| Decode errors, black frames, freezes over 1 s | None |
| Loop junction (last frame against frame 0, mean absolute difference) | 2.92, against neighbouring steps of about 2.8–3.2. Head, feet, arm motion and the 4 px/frame pan all continue across the seam. |
| Largest frame step | Frame 675, the intended cut to the deck-phone close-up |

## How it was checked

1. **Every frame:**
   - A regional single-frame pop scan (8×6 cells; a cell that changes much more than in its neighbouring frames). On build J all 19 candidates are caption changes, in the two caption bands, at the caption show times. No picture pops.
   - Helmet outline stability over the 857 frames where the rider is seen (`source/src/dev/helmetFilm.ts`):
     - The median change per frame is 0.07 % of the head's disc for the shell and 0.02 % for the visor.
     - The largest steps are runs of similar size, so they are deliberate head moves (worst step / larger neighbour = 1.4). None is an isolated pop.
2. **Four rounds of independent frame-by-frame review of the rendered file.**
   - Each round had:
     - one inspector per section;
     - a skeptic re-checking every medium or high finding;
     - a coverage critic;
     - camera motion measured by phase correlation.
   - Rounds 1–3 ran on builds A–H; everything they confirmed was fixed and re-rendered.
   - Round 4 ran on build I:
     - It re-checked all 25 defects confirmed in round 3; 22 were fixed and 3 partly fixed or still present.
     - It also found the low items listed below.
     - Its fire, camera, lift and wrist-phone findings were fixed in build J.
3. **Build J** was then checked on its own frames:
   - contact sheets of the changed shots (workshop 9.4–13.4 s, lift 7.13–9.3 s);
   - the pop scan;
   - the lift tilt, measured: it eases from 0 to about 12 px/frame and back to 0, with no hitch;
   - the workshop top view and fire view, measured: no background drift (one held angle each).

## Brief acceptance criteria

| Criterion | Result |
|---|---|
| Helmet and rig stability (absolute priority) | **Pass.** The shell, visor, stripe, ear, earbud and chin strap keep their shape and size in every frame. Head turns are smooth and rotate about the neck. The neck meets the jacket with no gap, and the collar opening is opaque. |
| Feet and body | **Pass.** Both feet stay planted with no sliding in every shot (every-frame feet crops). Arms, shoes and trousers are opaque in every frame, and their draw order changes only where the shapes merely touch. No knee inversion, and no missing hands. |
| Balancing 16–25 s | **Pass.** Small deck tilt → knees and hips → arms → settle. Balance is never faked with camera motion. |
| Camera | **Pass on build J.** No whips, snap zooms, push-pull or roll. Screen direction is consistent and the horizon level. Round 4 flagged two slow workshop drifts as orbits and a hitch in the lift tilt; all three were fixed and re-measured in build J. |
| Transitions | **Pass,** with the small items below. All cuts are clean, and every caption change near a cut lands on the cut frame. |
| Captions | **Pass.** No caption covers the face anywhere. "YOUR PRICE?" is large and clear of the helmet. |
| Loop | **Pass.** |
| Look | **Pass.** Flat 2D vector crew style, nothing 3D or plastic, no AI callouts. |

## Remaining problems (explicit)

All are low severity; none involves the helmet, the feet or the camera rules.

1. **23.67–24.2 s, earbud close-up:** where the near shoulder's sleeve cap meets the jacket's corner at the bottom-right frame edge, the jacket outline has a small notch and bump. Its edge shifts once, at 23.77 s. It is orange on orange at the frame edge. Raising the framing to push the corner out of shot cropped the head badly, so the framing was kept.
2. **10.77–11.73 s, engine close-up:** the hanging jet casings have small outline "ears" at their top corners and hooks at their bottom corners. It is a static drawing glitch, visible at 1:1.
3. **22.5–23.03 s, deck-phone close-up:** the shoes at the left and right frame edges show a light-grey sole band with a straight top edge and a thin hooked sliver where the leg is cut off.
4. **0.37–0.47 s, hook:** his screen-right arm starts its first move with no ease-in (the elbow drops 22 px in one frame). It is in sync with the body bob but reads as a slight snap.
5. **13.93–14.5 s, workshop:** the second caption line "to electric." sits over the window. The window now shows sky behind a dark frame, so the outlined white text stays readable, but the composition is tight until the pull-back lowers the window.
6. **12.9–13.25 s, fire:** build J joins the flame along its climb into one band. As it dies, the last flickers are small separate tongues for a few frames.
7. **Earlier notes still true:**
   - **Accuracy:** the river crossing and the canyon are one connected flight, while the verified sources describe separate demonstrations (`SOURCE_NOTES.md`).
   - **Board:** its geometry is grounded in the reported specifications, not traced from footage.
