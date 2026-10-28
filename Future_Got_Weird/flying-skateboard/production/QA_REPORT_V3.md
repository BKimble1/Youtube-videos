# Flying Skateboard V3: self-QC report

**File:** `exports/FGW_Flying_Skateboard_V3_REVIEW_1080x1920.mp4`.
- Measured with `tools/qa.py`; the results are in `qa/v3_review_qa.json`.
- Every sheet in `qa/v3_review_sheet_*.png` is made from the MP4 itself.

**Not checked here:** real-time playback and listening. There is no playback in this environment, so motion was judged from dense frame sheets (every 0.5 s across the whole film, plus the beat times below) and from the measured frame-to-frame change. It still needs one watch on a phone, with sound, before publishing.

## Specs (measured from the file)

| | |
|---|---|
| Video | H.264 High, **1080×1920 decoded** (ffprobe), 30/1 fps, yuv420p, BT.709, 1077 frames, 35.90 s, 7.6 Mb/s |
| How it was made | Rendered natively at 2160×3840 (Remotion `--scale=2`), then downsampled with Lanczos to 1080×1920. It is not an upscale: every output pixel averages four rendered ones. |
| Audio | AAC 48 kHz stereo; −14.01 LUFS integrated; sample peak −2.48 dBFS. Voice at −17 LUFS, 14.9 dB above music and effects in the speech band. |
| Decode | Full decode, no errors |
| Black frames / frozen stretches over 1 s | None / none |
| Loop junction (last frame against frame 0, mean absolute difference) | 3.47, against a median frame-to-frame step of 7.98: the jump back to frame 0 is smaller than an ordinary frame step |
| Largest frame step | Frame 280 (9.33 s): the fan-to-jet-intake match on "But" (an intended match cut) |

## First three seconds (`qa/v3_review_sheet_hook_beats.png`)

| Brief beat | Result |
|---|---|
| 0–0.45: open mid-crossing; camera slightly below and ahead; rider against the river and distant cliffs; props spinning; small tilt; knees and shoulders adjusting; no intro pose, fade or logo | Met. Frame 0 is mid-flight 8.5 m over the Yangtze. The camera is just below deck level, ahead of him on his toe side; behind him are the near-bank beach and the cliff-banded hills. The deck has a small roll; his hips and knees are mid-correction (lean and side shift, crouch up). |
| 0.45–1.15: alongside; bank passes behind; water moving below; clearly airborne; rider large | Met. The camera swings to his side, the bank and the downstream bridge slide behind him, and the water streams below. He is about 40 % of the frame height. |
| 1.15–1.90: down and slightly behind; ten-propeller underside; rotors turning; plausible airflow, not rings | Met. The underside shows all ten ducts with stator arms, the battery and the wiring. The air wisps sweep back with the forward speed. No rings anywhere in V3. |
| 1.90–2.65: high three-quarter; distance to the water clear; lean and correction; rider not tiny | Met. His shadow lies on the water well below him, and he stays about 25–30 % of the frame height. |
| 2.65–3.50: lateral follow; steep bank or canyon country ahead; ends closing on the underside | Met. The far-bank town and cliffs are ahead; the camera closes under the board at 3.4 s. |
| Every move connected | Met. One camera spline over one flight path, with no cuts in 0–6.42 s. |

## Transitions (`qa/v3_review_sheet_cuts.png`: the frame before and after every boundary)

| Time | Join | Read |
|---|---|---|
| 6.42 s | Fan from below (river) to the same fan from above (riverside flat) | Spinning disc to spinning disc, same size and place |
| 9.31 s | Fan from below to jet intake from above | Rotor to compressor face, same size |
| 13.64 s | Scorched compressor to new electric fan | Same framing, top-down |
| 15.48 s | Board on the bench to the board on the field | Same framing |
| 22.48 s | Over-the-shoulder ride to the board phone close-up | Cut to a detail of the same action |
| 25.36, 25.85, 26.34 s | Practice moments: takeoff, overhead S-curve, the riverside flat | Deliberate cuts; each is a new composition, place or time of day |
| 26.90 s | Low pass on the flat to high behind as he crosses the shoreline | Same flight, new angle |
| 28.40 s | Alongside over the water to the wide view near the far bank | Same direction of travel; a time-compressing cut |
| 31.79 s | Rear view down the gorge to his own view over the river | Forward motion continues; it lands on the hook's flight path |
| 35.9 s to 0 s | The loop | Same camera key, path, pose, light and location |

There are no white wipes, whip pans or camera shake, and none of the cuts comes from nowhere.

## Rider anatomy (every sheet, with extra checks on crouches, turns and close-ups)

| Check | Result |
|---|---|
| Both feet planted; pressure; separation | Both ankles are locked to the deck in every shot (`rig.ts`), shoulder-width apart. The feet close-up shows heel- and toe-side shifts with the deck tilting under them. |
| Knees and ankles | Two-bone IK, knees over the toes, no intersections seen in any sheet. Crouch depth follows each correction. |
| Arms | IK from the shoulders; elbows hang down and back, with no detached or inverted elbows seen. The controller hand and the wrist phone stay on their forearms. |
| Hands and gloves | One glove shape throughout |
| Helmet, visor, face | The helmet, visor, stripe and earbud are drawn on the head frame and move only with the head (the listening tilt is a head rotation). Nothing slid or flickered in the sheets. |
| Body reacts to the board | The hips lead, the shoulders counter-lean, the arms counterbalance, and the head holds the horizon. The board's attitude is a lagged response to the body. |
| Board | One geometry (`BD`) in every shot. Ten ducts in two rows of five in every view, including the build-up on the bench. |
| Rotors | Same five-blade fans and motion blur in every view; the stator arms show from below |
| Motion during speech | No frozen stretches; every shot has camera and subject motion |
| Glitch check | The camera exits his helmet straight up while his head is below the frame, so nothing pops in. The rider's-eye view draws his full legs, so no limbs appear or vanish. |

## Training-scene variety (`qa/v3_review_sheet_training.png`, one frame every 0.6 s)

1. **Problem:** low front three-quarter, orbiting to profile.
2. **Mechanics:** shoes, ankles and deck close up, dollying along the heel edge.
3. **Rider's view:** a crane up his back into an over-the-shoulder ride over the ground.
4. **Devices:** board phone (artificial horizon), wrist phone (amber level icon), earbud cue, then the correction from a medium shot.
5. **Progression:** an unsteady takeoff (close side view, morning); an overhead S-curve with its path traced in the grass; a low-angle pass on the riverside flat; the run over the shoreline onto the river.

That is five places or times of day and no repeated composition. The backyard field is on screen from 15.5 to 26.3 s, but it is seen from a different camera (low front, profile, heel edge, over-the-shoulder, top-down) in each beat.

## The ending loop (`qa/v3_review_sheet_loop.png`)
- **Rider's view at 31.8 s:** past the deck's toe edge to the water 8 m below, with his shadow on it.
- **Exterior:** out over his shoulder, then round beside him above the river.
- **"YOUR PRICE?" (34.78–35.56 s):** 112 px Nunito 900 with a heavy stroke, high in the sky; it never overlaps the rider.
- **Last moving shot:** lands on frame 0's camera key on the same flight path (`hook3(t − 35.9)`), with continuous camera velocity across the cut.
- **Light, location and pose match:** measured loop difference 3.47, below an ordinary frame step.
- **No CTA or outro.**

## Known residuals
1. **The river crossing and the canyon are one connected flight.** This was requested in the V2 brief; the verified details say they were separate flights. See `SOURCE_NOTES.md`.
2. **The riverside practice flat is staging,** not a documented location. It is used for the lift and the later practice moments.
3. **The 28.4 s cut is a time-compressing cut** (alongside him near the near bank, to the wide view near the far bank). It keeps the same direction of travel.
4. **About 0.25 s of open water at 32.6–32.9 s,** as the camera lifts out of his helmet before his shoulder comes into view.
5. **Board geometry** is still reference-grounded on the reported specifications, not traced from footage (as in V1 and V2).
