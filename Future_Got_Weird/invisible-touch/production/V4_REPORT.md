# Invisible Touch V4: final retention, motion and loop polish (review report)

**Status:** review render, **not declared publish-ready**. Every check below was run on the exported file, but
**this environment has no audio playback**. The "listen through" the brief asks for was replaced by measurement:
ASR, levels, the seam sample step and a gap scan. A human real-time listen on a phone is still required.

The audit and the five fixes were written before any editing (`production/V4_AUDIT.md`). Source:
`source/src/v4/`, composition `InvisibleTouchV4`. V1–V3 still render unchanged.

## Deliverable

`exports/FGW_Invisible_Touch_V4_REVIEW_1080x1920.mp4`

**Exact duration:** 31.133 s video (934 frames at 30 fps) and 31.133 s audio.

## Changes from V3 (timestamps are measured word onsets)

| Time (s) | V3 | V4 |
|---|---|---|
| **0.00–0.12** | Fingertip static; a flat ring around it, in the air. | **The finger reaches in** (frame 0 is mid-motion), and two faint crests converge from below onto the pad. |
| **0.12–0.45** | — | **Contact:** a bright point *on the skin*, ripples clipped to the fingertip's own surface, two short "feel" marks, an involuntary flinch and an ultra-subtle click, all on the same frame (4). There is no button, ring or barrier. |
| 0.45–1.90 | Drop to gap level; second pulse on "exist". | Kept. The pulse is now the on-skin version. |
| 1.90–3.05 | Three-quarter wide, conceptual outline on FEEL. | Kept. The pulse on FEEL is now on the skin. |
| **3.05–7.0** | Four near-identical views of the fingertip over a strip of cans. | **Three distinct views:**<ol><li>A high three-quarter shot with hand, device and gap in one frame (3.1–4.3 s).</li><li>A low path beneath the finger, swinging under it at gap height (4.3–6.1 s), with pulses on "feel" and "button".</li><li>A dive down into the array, whose cans start firing in a coordinated pattern (6.1–7.0 s).</li></ol> |
| **all lab shots** | Cans seen edge-on had rectangular sides and read as keyboard keycaps. | **Round transducer cans** everywhere: a dark recessed seat, a curved metallic base and side, and consistent 16 × 16 spacing. |
| **10.8–11.9** | Straight dashed "rays" from each emitter (laser-like). | **Rays removed.** Only the converging wavefronts and bands, ending at one spot at the skin. |
| **13.1–14.3** | A full-screen skin panel matched on the glow. | **The camera dives into the same fingertip** at the focal spot. The finger's own outline opens locally: epidermis and dermis follow its contour, plus the distal phalanx, Meissner corpuscles and Merkel discs at the focus, a Pacinian corpuscle, and a nerve fibre back along the finger with a signal running on it. Then it pulls back out on the same axis. There is no dent; the pad only flutters. |
| **15.1–17.5** | Two near-identical overhead circle shots held 2.4 s. | **An A → B → C mini-demonstration.**<ul><li>Overhead (15.1–16.3 s): the spot jumps fingertip → knuckles → palm. Each stop has a small burst and a faint tick, and the array's rings re-steer to each point.</li><li>Oblique tracking (16.3–17.5 s): the spot continues palm heel → knuckles → fingertip, with a bright point and a local ring at each stop.</li></ul> |
| 17.5–19.6 | NO GLOVE / NO PHYSICAL BUTTON. | Kept: overlays removed, then the press on nothing and the reach. |
| **19.6–26.1** | Fan, volume and an arc of icons; the interaction was split across framings; the PLAY path passed near the yoke. | **One climate micro-story in a single shot.** The finger touches the dial's rim and a pulse lands at the contact. On each of four detents the readout goes 21° → 25° and the dial arc and cabin light lines warm from cyan to amber, all in the same frame. Fan and volume icons are removed. The dial and the PLAY button sit **directly above the console array** (a clear path), with one small CONCEPT tag. Then a brief second beat: a mid-air PLAY press beside the physical dash screen, which he never touches, and the screen shows "♪ PLAYING" on the press frame. |
| **26.1–29.2** | Repeated side poses; the fist read as a clench. | **Pinch payoff.** A dashed "imaginary button" ring sits between thumb and index. The fingers pinch closed **through** it: its back arc is behind the fingers and its front arc in front, with no slowing. It fades and the hand is empty. |
| **29.2–31.13** | The pulse returns, then a move to the opening pose. | **A final pulse on the skin with a flinch.** Then the hand lifts back and **reaches in again using the same function as frame 0**, so position, silhouette, velocity, camera path, light (the strip fades out) and the converging crests continue straight into frame 0. |
| **Seam captions** | The last caption cleared, then the first popped on at frame 0. | **The first caption is pre-built.** It fades in over the last 0.25 s at its own position, so it is already on screen across the seam. |
| **Sound** | — | The click and pulse sit on the contact frame. A soft airy riser runs from after the last word **across the seam** into that contact. Faint ticks mark the A → B → C stops. The PLAY tick and chime are kept. |

## Validation on the exported file

**Frames inspected** (sheets are in `qa/v4/`):
- 0.0, 0.2, 0.5, 1.0, 2.0, 3.0, 5, 8, 11, 13, 15, 17, 20, 22, 24, 26, 28 and 30 s: `review_timestamps_0-30s.png`;
- the opening every other frame: `opening_0-0.75s.png`;
- the car interaction and the oblique demo: `car_interaction_and_oblique.png`;
- both sides of all 7 cuts: `transition_bursts.png`;
- a muted phone-size sheet: `phone_size_muted_every1.5s.png`.

**Seam:**
- `seam_last8_first8.png` and `seam2_last8_first8.png` are taken from `FGW_Invisible_Touch_V4_loop_x3.mp4` (three
  loops, 2,802 frames).
- The last 8 frames run straight into the first 8: the reach continues, the caption fades in, and the pulse lands at
  contact.
- Last-to-first frame mean difference: 2.61/255, which is mostly the caption fading in.

**Technical:**
- Clean full decode, 934 of 934 frames, 0 black frames.
- Longest near-static run: 3 frames.
- No in-shot camera move reaches cut-level change. The largest in-shot change is in the dive into the array, which is
  smooth.

**Audio:**

| Check | Result |
|---|---|
| Loudness | −14.0 LUFS integrated, −1.5 dBTP |
| Effects vs voice | Effects peak at −33.0 LUFS momentary, against the voice's −12.6 |
| Narration, MP4 | Zipformer WER **0.000**. Whisper WER 0.059, on its last window only (it contains the loop riser); the last line alone transcribes correctly. |
| Narration, voice stem | WER 0.000 on both models |
| Lag vs master | **0 samples** |
| Seam | Last→first sample step 0.013, against speech steps up to 0.89: no pop. Both edges sit at about −40 dBFS (room tone and riser), never silence. |
| Gaps | The longest stretch below −45 dBFS anywhere is 0.04 s. |

## Pass/fail

| Area | Verdict |
|---|---|
| Hook clarity | **Pass.** The finger reaches into empty air, the sensation is drawn on the skin rather than as a touchscreen ring, it flinches, and the gap is revealed by 1.0–1.8 s. |
| 3–7 s repetition | **Pass.** Three distinct, purposeful views. |
| Array reads as science | **Pass.** Round cans, no keycaps, no laser rays. |
| Skin beat integration | **Pass.** Dives in and out of the same fingertip. |
| Moving sensation demo | **Pass.** A → B → C overhead, then an oblique continuation. |
| Car payoff | **Pass, with the caveat that it is 2D.** One interaction in one shot, with finger, target, pulse and response aligned and the array path clear; it is still a flat side-cutaway cockpit. |
| Ending and loop | **Pass.** The pinch goes through the button outline, the pulse is felt, the reach-in matches frame 0, the caption is pre-built, and the audio bridges the seam. |
| Narration and captions | **Pass** on measurement. |
| Publish-ready | **Not declared.** It needs one real-time listen and watch on a phone. |

## Remaining flaws (honest)

1. **Not heard or watched in real time.** In particular, nobody has judged whether the click is subtle enough or the
   riser is too present.
2. **31.133 s:** 0.13 s over the brief's ~31 s, because the approved narration was kept unchanged.
3. **The car is a 2D side cutaway.** The seated figure's near arm is plain, and the cockpit has no true perspective.
4. **The oblique demonstration (16.3–17.5 s) is short** at about 1.2 s; its three stops come quickly.
5. **The fingertip cutaway is schematic.** Receptor sizes are exaggerated for legibility, and on a phone the receptors
   read only as "small yellow and green structures at the spot".
6. **The pinch's curled middle, ring and little fingers are simplified** (cartoon blocks behind the index), and the
   top-down hand remains the flatter back-view hand.
7. **The billboarded figure** in the three-quarter wides does not rotate in 3D.

## Rebuild

```sh
(cd source && npx esbuild ../tools/v4/export_cues4.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c4.cjs) && node /tmp/c4.cjs audio/cues_v4.json
python3 tools/v4/make_audio_v4.py mix_v4
COMP=InvisibleTouchV4 tools/render_resilient.sh mix_v4 exports/FGW_Invisible_Touch_V4_REVIEW_1080x1920.mp4 source/out/frames_v4
python3 tools/v4/qa_render_v4.py exports/FGW_Invisible_Touch_V4_REVIEW_1080x1920.mp4 qa/v4
python3 tools/v4/transition_bursts_v4.py exports/FGW_Invisible_Touch_V4_REVIEW_1080x1920.mp4 qa/v4/transition_bursts.png 57,452,490,525,553,589,782
```
