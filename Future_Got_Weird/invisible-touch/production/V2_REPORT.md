# Invisible Touch V2: review report

**Status.** This is a review render. It is **not declared publishable**: it was rendered from source and inspected
from the file, but nobody has watched it in real time with sound (this environment has no playback).

How it was inspected:

- every-3rd-frame hook sheet;
- every-0.5 s contact sheet;
- frame steps at all seven cuts and match cuts;
- the loop seam;
- native-resolution stills;
- a muted phone-size sheet;
- ASR of the delivered audio.

The audit of V1 and the shot plan written before any V2 code are in `production/V2_AUDIT_AND_PLAN.md`.

## Deliverable

| Item | Value |
|---|---|
| File | `exports/FGW_Invisible_Touch_V2_REVIEW_1080x1920.mp4` |
| Video | 1080×1920, 30 fps, H.264 (CRF 16, yuv420p, BT.709), **934 frames** |
| Runtime | **31.133 s**: the narration master's length, unchanged from V1 |
| Audio | AAC 48 kHz. **−14.0 LUFS** integrated, **−1.6 dBTP**. Effects peak at −29.1 LUFS momentary, against the voice's −12.6. |
| Composition | `InvisibleTouchV2` (`source/src/v2/`). V1 (`InvisibleTouch`) is untouched and still renders. |

## Narration (unchanged)

The narration is identical to V1. It is the same master file, `audio/narration/FGW_Invisible_Touch_narration_V1.wav`:
the approved 101 words, verbatim, in the ElevenLabs Test Voice. The word timings are in
`production/WORD_TIMINGS.md`.

| Source | Zipformer WER | Whisper WER |
|---|---|---|
| MP4 audio | **0.000** | 0.059 |
| Voice stem | 0.000 | 0.000 |
| The final line cut from the MP4 | Correct | Correct ("your skin can still feel it") |

The MP4's Whisper miss is the recogniser's last window, which also holds the loop's click. The mix's narration lag
against the master is **0 samples**.

## Scene timing (measured shot boundaries)

| # | Time (s) | Frames | Words | Composition |
|---|---|---|---|---|
| 1 | 0.00–0.50 | 0–14 | "This button" | Extreme close-up of the fingertip in dark air; a cyan pulse and a tactile click on frame 0. |
| 2 | 0.50–1.07 | 15–31 | "doesn't" | A 55° orbit round the fingertip: empty air on every side. The finger lifts and settles. |
| 3 | 1.07–1.90 | 32–56 | "exist." | Pull back and drop: the array rises into frame below the hand, then a gap-level view; the light strip comes up behind the air gap. |
| 4 | 1.90–3.07 | 57–91 | "But you can FEEL it." | **Cut:** wide three-quarter of the guesser at the bench. On "FEEL" a **dashed button outline** appears under the fingertip and dissolves; he smiles. |
| 5 | 3.07–5.23 | 92–156 | "Look. Nothing is touching his finger." | A dive down to gap level, then a glide right to left along the glowing gap under the fingertip. |
| 6 | 5.23–6.90 | 157–206 | "So why can he feel a button?" | A rise to the fingertip from just below the pad; pulses on "feel" and "button". |
| 7 | 6.90–8.23 | 207–246 | "Under his hand, hundreds of" | A dive past the pad onto the array; **macro tracking across the cans** firing in coherent phase rings. |
| 8 | 8.23–9.13 | 247–273 | "tiny speakers" | Pull up to the whole 16 × 16 grid; the rings converge under the finger. |
| 9 | 9.13–10.80 | 274–323 | "fire ultrasound waves. They meet" | Swing to the side section; the camera rises with **translucent wavefront bands** built from delayed wavelets. |
| 10 | 10.80–12.33 | 324–369 | "at one exact spot," | **Convergence rays** grow from each emitter to the focus; the crests meet; a flare on "exact". |
| 11 | 12.33–13.27 | 370–397 | "making his skin feel" | Fingertip macro: a faint ripple and slight flattening of the pad (not a dent). |
| 12 | 13.27–14.07 | 398–421 | "pressure." | **A dive into the cross-section:** the cutaway opens and fills the frame; receptors fire and a signal runs up the nerve. |
| 13 | 14.07–15.07 | 422–451 | "Move that spot, and you" | Pull back out; the cutaway collapses; the hand opens flat and glides; the focus slides along the palm. |
| 14 | 15.07–17.50 | 452–524 | "can make an invisible button feel like it's moving." | **Cut: top-down** over the hand and array. The focal point circles under the palm; the array's rings follow it; a dashed button outline rides the point, then dissolves. |
| 15 | 17.50–18.43 | 525–552 | "No glove." | **Cut:** every overlay off; a low angle from the other side on the bare hand in clean air. |
| 16 | 18.43–19.63 | 553–588 | "No physical button." | **Cut:** high three-quarter wide from the other side; a press on nothing; then the hand sweeps left and the camera follows. |
| 17 | 19.63–21.45 | 589–643 | "Now imagine reaching into thin air" | **Match cut into the car** on the moving hand (the same screen point, scale and pose). The pull-back reveals a parked night cockpit. |
| 18 | 21.45–23.37 | 644–700 | "and feeling the controls of your car." | The floating control arc blooms (CONCEPT). The finger turns the climate dial from 21° to 25°; each detent clicks, with a pulse at the contact point. The camera drifts and rolls slightly. |
| 19 | 23.37–24.63 | 701–738 | "Or pressing a floating button" | The camera travels through the floating dial into the fingertip. |
| 20 | 24.63–26.07 | 739–781 | "without touching a screen." | **Match cut on the fingertip into a lobby:** a floating destination keypad (CONCEPT DISPLAY) over a pedestal array (ULTRASOUND ARRAY). Pressing 7 fills the key, the readout shows "7 → CAR B", B ▲ lights, and the doors part behind the keypad. |
| 21 | 26.07–27.47 | 782–823 | "And here's the weird part." | **Finger-position match cut** back to the real array; pull back; the hand opens flat over the array. |
| 22 | 27.47–29.17 | 824–874 | "You can't actually grab it." | A medium shot holding hand and face: the fist closes through the glowing focus, which stays visible over the fingers; nothing is caught; a puzzled look. |
| 23 | 29.17–30.30 | 875–908 | "But your skin can still feel" | Push down to the hand: it opens and a pulse returns on the skin; the fingers flicker. |
| 24 | 30.30–31.13 | 909–933 | "it." | The return to the opening close-up (the same camera path, dip and pulse). Frame 933 flows into frame 0. |

This gives 24 compositions in three places (lab, car, lobby) and four modes (real, macro, cutaway, top-down). The
longest near-static run anywhere is **3 frames**.

## V1 → V2 improvements

1. **The first 3 seconds.**
   - Frame 0 is darker and tighter, with no light bar crossing the fingertip.
   - A wider (55°) orbit.
   - A pull-back that drops to gap level, so the air gap glows against the light strip by 1.6 s.
   - A distinct three-quarter wide with a **conceptual button outline** on "FEEL".
2. **Distinct compositions instead of one repeated angle.**
   - V1 reused the side-on hand-over-bench angle five times.
   - V2 adds three-quarter wides from both sides, a glide along the gap, a macro track over the cans, a top-down
     shot, a low under-hand view, and a medium shot that holds hand and face together.
3. **Clearer science.**
   - The array's firing is shown as coherent phase rings in macro.
   - The wavefronts are translucent bands.
   - Rays from every emitter make the convergence geometry explicit.
   - The receptor cutaway opens until it fills the frame and is readable on a phone.
4. **"Invisible button moving"** gets a genuinely new top-down shot. The array's rings visibly recentre under the
   moving point.
5. **The car is rebuilt as a futuristic cockpit:**
   - a night city through the windscreen;
   - ambient light lines and a pillar-to-pillar display showing P and PARKED;
   - an edge-on yoke;
   - a floating arc of three controls;
   - a temperature that changes on each detent;
   - a gently moving camera instead of V1's near-static hold.
6. **The lobby is rebuilt.** A floating destination keypad sits right in front of the elevator, with real feedback:
   the key fills, the readout assigns car B, the indicator lights, and the doors part with warm light.
7. **Transitions.**
   - Every change of place is now a match cut on the hand or fingertip: lab → car, car → lobby, and lobby → lab
     (which was a plain cut in V1). The geometry was verified: the fingertip sits at the same screen point and scale
     on both sides of each cut.
   - The tilt to the face is gone; the grab is one composition holding hand and face.
8. **Sound.**
   - An opening tactile click that is also the loop's last event, so the seam is one sound.
   - A soft airy riser bridging into it.
   - A flare on "exact".
   - A hologram shimmer as the car's controls bloom.
   - The lobby key tick, a soft chime and the doors' slide.
9. **Captions.** Zones were re-planned per scene, so captions no longer sit on the device during the mechanism
   (8–13 s) or on the hand in the top-down shot.

## Scientific accuracy

The full checklist is `production/SCIENCE_NOTES.md`, which carries a V2 section.

- **Array.** It has 256 transducers, all drawn. The phase rings are a slowed visual stand-in for the per-emitter
  phase: the real 40 kHz pattern is far too fast to see.
- **Focusing.** Each emitter's wavelet is delayed so all crests reach the focus together; the rays and bands make
  this explicit.
- **Touch.** The focus presses lightly on the skin and is modulated. This is shown as a faint ripple and a slight
  flattening of the pad: a pressure or vibration sensation, never a dent.
- **No solid object.** The **button outlines are dashed, glowing and see-through**, appear briefly and dissolve;
  they are labelled by style as an idea. The fist closes through the focus without slowing; the glow stays visible
  over the fingers; nothing is caught.
- **No levitation, barrier or resistance** is shown anywhere.
- **Concepts are labelled.** The car is parked (P, PARKED, a still city) and its controls are tagged CONCEPT. The
  lobby separates CONCEPT DISPLAY from ULTRASOUND ARRAY. No real product or brand is shown.

## Measured QA

Evidence is in `qa/v2/`:

- `render_qa.json`
- `transition_bursts.png`: the seven cuts
- `loop_*`
- `contact_every_0.5s.png`
- `hook_0-2.5s_every_3rd_frame.png`
- `phone_size_muted_every1.5s.png`
- `final_asr.json`, `voice_stem_asr.json`

Results:

| Check | Result |
|---|---|
| Decode | Clean |
| Frames | 934 of 934 |
| Black frames | 0 |
| Longest near-static run | 3 frames |
| Loop seam (last versus first frame) | Mean difference 4.36/255, mostly the caption text changing. The picture, camera path and pulse continue across the seam (`qa/v2/loop_*`). |

All large frame-to-frame changes fall either at the seven planned cuts or inside deliberate camera moves:

| Shot | Frames | Move |
|---|---|---|
| 7 | 212–243 | The dive and the track over the cans. The frame-step sheet shows a smooth tilt; the high number comes from the dense texture of 256 cans moving. |
| 8 | 250–258 | The pull-up to the grid. |
| 13 | 425–431 | The pull-back out of the cutaway. |
| 20 | 750–779 | The lobby's pull-back and push-in. |

## Honest remaining issues

1. **Not watched or heard in real time.** Pace, the energy of the dive, and how loud the click and riser feel are
   judged only from measurements and frames.
2. **Still 0.13 s over the 31 s target.** The narration master was kept unchanged, as instructed.
3. **The dive and macro track (6.9–8.2 s) are busy.** The camera move is smooth, but 256 cans sweeping through the
   frame are dense, high-contrast texture; on a phone it may feel fast.
4. **The top-down hand is the rig's back-view hand drawn flat** at palm height. It reads, but it is flatter than the
   profile hand, and the focal point is drawn over it as an x-ray (labelled by style, not by text).
5. **Billboarded figure in the three-quarter wides.** The guesser stays undistorted and is pinned at the fingertip,
   but he does not turn in true 3D with the camera.
6. **The car is much improved but still simple.** The seat and the near arm are plain shapes; the near arm hangs
   large for the first half-second after the match cut.
7. **The fist is cartoon-simplified,** with blocky curled fingers in profile.
8. **The lobby closes with a quick push into the fingertip** (about 0.3 s) to set up the match cut back to the lab.
9. **Science references** are from background knowledge and were not re-verified online (see
   `production/SCIENCE_NOTES.md`).

## Rebuild

```sh
(cd source && npx esbuild ../tools/v2/export_cues2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c2.cjs) && node /tmp/c2.cjs audio/cues_v2.json
python3 tools/v2/make_audio_v2.py mix_v2
COMP=InvisibleTouchV2 tools/render_resilient.sh mix_v2 exports/FGW_Invisible_Touch_V2_REVIEW_1080x1920.mp4 source/out/frames_v2
python3 tools/v2/qa_render_v2.py exports/FGW_Invisible_Touch_V2_REVIEW_1080x1920.mp4 qa/v2
python3 tools/v2/transition_bursts_v2.py exports/FGW_Invisible_Touch_V2_REVIEW_1080x1920.mp4 qa/v2/transition_bursts.png 57,452,525,553,589,739,782
```

Contact sheets: `cd source && ./sheet2.sh out.png "f1,f2,..."`.
