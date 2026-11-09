# Invisible Touch V3: targeted polish (review report)

**Status.** This is a review render, **not declared publishable**. It was rendered from source and inspected from the
file:

- frame steps at all eight cuts;
- native-resolution stills;
- first and last frames side by side;
- a three-loop concatenation;
- a muted phone-size sheet;
- ASR of the delivered audio.

Nobody has watched or heard it in real time: this environment has no playback.

**What is unchanged from V2:**
- the narration master (the approved 101 words, verbatim) and the voice;
- the character rig;
- the core scientific explanation;
- every V2 scene not named in the changelog below (the three-quarter wide, the side section and convergence rays,
  the top-down moving point, "No glove" and "No physical button").

Source: `source/src/v3/` (composition `InvisibleTouchV3`). V1 and V2 still render unchanged.

## 1. Deliverable

`exports/FGW_Invisible_Touch_V3_REVIEW_1080x1920.mp4`

## 2. Changelog from V2 (timestamps are the measured word onsets)

| Time (s) | V2 | V3 |
|---|---|---|
| **0.00–0.45** | ECU with a pulse; the finger static. | The fingertip **flinches** off the pulse in dark air: a quick 3-unit lift and settle, the index extending a touch. The pulse is already mid-ring on frame 0, and a tactile click sits on frame 0. |
| **0.45–1.10** | A long orbit; the array appears at about 1.4 s. | **The real gap is revealed by 1.0 s.** The camera drops from the ECU to gap level: the fingertip above, the array below, and backlit empty air between. |
| **1.10–1.90** | Pulled back, no second beat. | **A second pulse and flinch on "exist"** with the gap and array in full view: the finger reacts to nothing. |
| 1.90–3.05 | Three-quarter wide with the button outline. | Unchanged: the one establishing shot. |
| **3.05–5.20** | Dive to gap level and glide along the gap: another hand-over-array view. | **Worm's-eye from the array's front edge:** cans in the foreground, the fingertip high above in empty air ("Nothing is touching his finger"). |
| **5.20–6.90** | A rise to the fingertip: another hand-over-array view. | **In the same worm's-eye view, the cans start firing and faint converging crests rise toward the fingertip;** the pulse lands on "feel" and "button". This is the mechanism's first appearance, not a repeat. |
| 6.90–9.13 | Dive from the fingertip onto the cans; pull-up. | The camera rises off the front edge and tilts down across the emitter field (the dive now starts from the worm's-eye, 0.85 s), then pulls up to the whole grid. |
| 9.13–13.08 | Side section, rays, fingertip macro. | Unchanged. |
| **13.08–14.05** | A flat circular cutaway that grew over the finger. | **A graphic match cut on the focal glow** into a new illustrated skin slab, entering at the pad's exact screen position, glow size and surface angle, then settling upright. Its layers are shaded: friction-ridge underside, epidermis, dermis with papillae, Meissner corpuscles, Merkel discs, fat, a Pacinian corpuscle and nerve fibres. Crests arrive from below; the surface gives by a few pixels (no dent); receptors respond; a signal runs up the fibres; a TOUCH RECEPTORS tag. It then **matches back** onto the fingertip's focus and the film cuts back to the hand. |
| 14.05–15.07 | Pull-back from the collapsing cutaway. | The pull-back from the fingertip macro (no cutaway to collapse). |
| 15.07–19.63 | Top-down moving point; "No glove"; "No physical button". | Unchanged. |
| **19.63–26.05** | Car (19.6–24.6): repeated seated medium shots. Lobby (24.6–26.0): a floating keypad whose dark backing read as a physical screen. | **The lobby is removed; the car is the climax**, in six compositions driven by the hand. (1) The match cut carries the moving hand. (2) A **wide cockpit reveal** as the concept controls bloom. (3) The camera **travels with the hand** to the dial. (4) A **tight floating-dial response**: 22° → 25°, a detent click and a pulse at the exact contact point each step, crests rising from the console array. (5) The camera **follows the fingertip** as it glides to a floating PLAY button; the console's **ULTRASOUND ARRAY** and the **CONCEPT** controls are tagged together. (6) **"without touching a screen."**: a mid-air press of the floating button, beside the car's physical dash touchscreen, which he never touches. The screen lights "♪ PLAYING" (a tick, a pulse and a soft chime). Then a push into the fingertip for the next match. |
| 26.05–27.45 | Match back from the lobby. | A **finger-position match cut from the car** back to the real array; the hand opens flat over it. |
| **27.45–29.15** | The fist closed; the glow was over the fingers. | **A dashed "where a button would be" ring** appears at the focus. Its back arc is drawn behind the hand and its front arc over it, so the closing fingers **visibly pass through its plane** with no slowing and no contact; then it fades. |
| **29.15–31.13** | The pulse returns; a camera move to the opening. | The pulse returns with a **flinch** (touch, not impact). **The last second rebuilds frame 0**: the same camera path and dolly speed, pose, finger flinch, pulse phase (the same pulse event, 0.12 s before the loop), device and wall geometry, and lighting (the light strip fades out to the hook's dark air). |
| **30.84 → 0.00** | The last caption stayed up to the last frame, so the seam swapped one caption for another. | **The last caption clears 0.2 s after the last word.** The seam goes from no caption to "This button DOESN'T EXIST." arriving with the first word. |
| Captions | — | Zones re-planned: the hook and worm's-eye top, the mechanism by scene, the car low over the door sill. No caption sits on the hand, the dial or the press. |
| Sound | The lobby key, chime and door slide. | Lobby sounds removed. Added: the PLAY press (tick, pulse, soft chime), the hook's second pulse, the worm's-eye pulses, and a receptor texture under the slab. The opening click and loop bridge are kept. |

## 3. Exact render duration and technical check

| Check | Result |
|---|---|
| Container | H.264 High, 1080×1920, 30 fps, yuv420p, BT.709; AAC 48 kHz stereo |
| Duration | **31.133 s video and 31.133 s audio, 934 frames** |
| Decode | Clean (full decode, no errors) |
| Frames | 934 of 934 |
| Black frames | 0 |
| Loudness | **−14.0 LUFS** integrated, **−1.6 dBTP** true peak. Effects peak at −29.1 LUFS momentary, against the voice's −12.6. |
| Narration | Zipformer WER **0.000** on the MP4. Whisper WER 0.059, only on its last window, which also holds the loop's click; the final line transcribes correctly on its own. The voice stem is WER 0 on both models. Mix narration lag against the master: **0 samples**. |
| Longest near-static run | 4 frames |
| Cuts (all planned) | 57 (wide), 393 (slab in), 422 (slab out), 452 (top-down), 525 (No glove), 553 (No button), 589 (car match), 782 (lab match). Frame steps: `qa/v3/transition_bursts.png`. |
| In-shot camera moves with large frame change | The hook drop (23–26); the dive into the worm's-eye (108–112); the tilt down across the cans (216–244: smooth, but dense can texture); the pull-up to the grid (251–259). |
| Loop seam | The mean difference between last and first frames is **2.55/255** (V2: 4.36). The difference is the first caption appearing. Side by side: `qa/v3/first_last_side_by_side.png`. Three loops (`qa/v3/FGW_Invisible_Touch_V3_loop_x3.mp4`, 2,802 frames): both seams continue the camera, pose, pulse ring and light (`qa/v3/loop_x3_seams.png`). |

## 4. Frank pass/fail

| Area | Verdict | Notes |
|---|---|---|
| **Opening (0–3 s)** | **Pass** | Frame 0 shows the fingertip flinching at an illustrative pulse in empty dark air. By 1.0 s the gap and the array are in one clean composition, and on "exist" a second pulse lands with the empty gap in view. There is no physical button anywhere and no intro pause. |
| **Scientific accuracy** | **Pass** | Delayed emitters build converging crests; the touch is a localised, modulated pressure (a few pixels of give, a ripple, receptors firing). Every button shape is dashed, see-through and brief. The fingers pass through the focus; there is no barrier, resistance or levitation. The car is parked and its controls are tagged CONCEPT; the console array is tagged separately. The paper references in `SCIENCE_NOTES.md` were still not re-verified online. |
| **Anatomy** | **Pass with reservations** | Five digits; joint order (MCP, PIP, DIP) correct; nails dorsal; elbows and shoulders continuous; faces stable. Reservations: the fist is blocky; the top-down hand is the flatter back-view hand; the three-quarter wides use a billboarded figure (correct in silhouette, but it does not turn in 3D). |
| **Car climax** | **Pass, provisionally** | Six distinct compositions driven by the hand: a wide reveal, travel to the control, a tight response, a glide to the button, and a mid-air press beside an untouched physical screen. The tactile pulses sit on the contact frames. Provisional because the cockpit is still flat 2D (side cutaway): the "angles" are framings, not true camera rotations. |
| **Final loop** | **Pass** | The last second rebuilds frame 0 (camera, dolly speed, pose, flinch, pulse phase, geometry, light). The caption clears before the seam. Both seams in the three-loop file are continuous. |
| **Publishable?** | **Not yet** | Needs one real-time viewing with sound on a phone before publishing. |

## Outstanding flaws (explicit)

1. Not watched or heard in real time: pace, the click and riser, and the PLAY chime are judged only from measurement.
2. The runtime is 31.13 s, 0.13 s over 31 s, because the approved narration master was kept unchanged.
3. The tilt down across the 256 cans (7.0–8.2 s) is smooth but texturally busy; on a phone it may still feel fast.
4. The car is a 2D side cutaway. The six compositions differ by framing and travel, not by true perspective change; the
   seated guesser's near arm is plain.
5. The skin slab is a schematic illustration. Its top edge fades into the dark panel, and the receptor tag sits on the
   slab's left edge.
6. The fist and the top-down hand are the weakest hand drawings.
7. The billboarded guesser in the three-quarter wides does not rotate with the camera.

## Rebuild

```sh
(cd source && npx esbuild ../tools/v3/export_cues3.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c3.cjs) && node /tmp/c3.cjs audio/cues_v3.json
python3 tools/v3/make_audio_v3.py mix_v3
COMP=InvisibleTouchV3 tools/render_resilient.sh mix_v3 exports/FGW_Invisible_Touch_V3_REVIEW_1080x1920.mp4 source/out/frames_v3
python3 tools/v3/qa_render_v3.py exports/FGW_Invisible_Touch_V3_REVIEW_1080x1920.mp4 qa/v3
python3 tools/v3/transition_bursts_v3.py exports/FGW_Invisible_Touch_V3_REVIEW_1080x1920.mp4 qa/v3/transition_bursts.png 57,393,422,452,525,553,589,782
```

Contact sheets: `cd source && ./sheet3.sh out.png "f1,f2,..."`.
