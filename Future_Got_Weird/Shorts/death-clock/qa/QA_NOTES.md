# QA notes: The Death Clock v1 (Weird Crew style)

## What was inspected, and how

This environment cannot play video or audio in real time, so **nobody has watched or listened to this Short at speed.** Every check below is either a measurement or a look at still frames decoded from the encoded files in `exports/v1/`.

| Check | Method | Result |
|---|---|---|
| Picture, whole film | Contact sheets of every 6th frame, decoded from the exported captioned master (`qa/v1/sheet_*.jpg`), read sheet by sheet | See shot notes |
| Clean version | Frames 180, 660, 900 and 1270 decoded from the clean export | No narration captions. FUTURE CONCEPT label, TIME COMPRESSED tag and all device UI present. |
| Cover | `FGW_DeathClock_v1_Cover_1080x1920.png` (frame 596 of the clean export) viewed at full size | Band in the foreground with crimson **00:02:14** legible; his pained face (the guesser) in soft focus behind; FUTURE CONCEPT label |
| Phone-size readability | 16 frames at 360×640 with an approximate Shorts UI overlay (`qa/v1/phone_ui_overlay.jpg`). The overlay geometry is an estimate, not the platform spec. | Captions, countdown, HELP ALERT SENT, STABILIZING, "42 Years" and the "?" glitch all sit inside the working area (x 90–900, y 180–1480) |
| FUTURE CONCEPT label | `tools/check_label.py` on both exports, every frame: label text versus pill contrast | **PASS** on 1373/1373 frames in each; minimum contrast 145 of 255 (`qa/v1/label_master.json`, `label_clean.json`) |
| Pops, flash frames | Frame-difference scan of the exported master (`qa/v1/motion_scan.json`) | No flash frames. Every flagged spike is a cut or a deliberate move (see "Motion scan"). |
| Countdown logic | `source/scripts/check_device.ts`, all 1373 frames | **PASS**: one origin at 00:02:14 (frame 579, 19.30 s), never increases, only 1-second steps, frozen at 00:01:52 from frame 1056, never reaches zero, one contiguous glitch window (frames 1291–1298). Output in `qa/DEVICE_CHECK.json`. |
| Captions vs. locked narration | `tools/make_srt.py` asserts the 31 caption chunks join to the five locked blocks exactly; the exported SRT is byte-identical to `captions/FGW_DeathClock.srt` | **PASS** |
| TTS text vs. locked narration | `tools/check_tts_text.py` | **PASS**, 5/5 blocks exact |
| Narration words | Blind Scribe transcription of the selected take | All 98 words, in order |
| Loudness and peaks | ffmpeg ebur128 on the audio of both exported MP4s (AAC 320k); the WAV mix and stems in `qa/AUDIO_QA.json` | Both MP4s: −14.9 LUFS, LRA 5.8 LU, true peak −1.7 dBTP. Stems sum to the mix (max error 2.4e-7). |
| Voice over bed | Short-window narration level against everything else, during speech | Speech-weighted margin: min 7.8 dB, median 18.3 dB. Tightest at 36.3 s ("lose consciousness", over heartbeat), then 35.3 s and 42.1 s. |
| Durations | ffprobe | Master and clean: 1373 video frames, 45.767 s, audio 45.766 s. Review 540×960: same 1373 frames, its AAC track 45.781 s (encoder end padding). |
| Cues after the restyle | Re-exported `audio/cues.json` after the art and motion changes and compared it byte for byte | Identical: shot timing, device states, captions and sound cues are unchanged, so the existing mix, stems and SRT still apply |

**Not verified:**
- Listening: voice tone and naturalness, pronunciation of "nano-sensors", "cellular decay" and "life expectancy", whether the lengthened pauses sound natural, SFX realism, and how the mix feels against the picture.
- Motion at real speed. The spline and follow-through changes were checked in stills and with the frame-difference scan. Nobody has judged the smoothness, the sit-up or the camera pushes at speed.
- Colour and brightness on actual phones, and the real YouTube interface overlay.

## Style pass (owner's direction: Weird Crew style, more dimensional gradients, shiny highlights, expressive faces, smoother movement)

- **Cast.** The man is now the Weird Crew's guesser from the approved cast sheet: red spiky hair, peach skin, coral cheeks, white tee with saffron stripes, navy trousers and white shoes. He has the crew face construction (white-sclera eyes with ink pupils, thick ink brows, hook nose, drawn mouth) and an ink contour on every part. He was compared side by side with the cast sheet (`cast_rig_check.png`).
- **Dimensional gradients and gloss.** Gradient form shading comes from one key light, with a cool bounce light on the shadow side. Highlights: glossy streaks on the hair spikes, two catchlights per eye, forehead, cheekbones, nose, fingertips, shoes, band, watch shell and drone.
- **Expressions.** Pain with clenched teeth and half lids; a wince with squeezed "> <" eyes and crow's feet; a gasp with small pupils and an open mouth with tongue; relief with a soft smile; unease with raised inner brows and the gaze down. Sweat drops and worry lines appear while he is in pain.
- **Movement.**
  - Keyframes run through a monotone cubic spline, so moves no longer stop at every key. The knees and side land as contacts.
  - Springs drive follow-through: the head trails the torso, the hair spikes swing behind the head, and the dog's ears perk with overshoot while its tail settles and wags.
  - The cameras with several marks flow through them. The digit-crop and injection pushes were lengthened and softened.
- **Matching.** The dog, the watch, the drone, the street set pieces (thinner lines) and the cutaway's device carry the crew contour. Captions and labels use the channel's Fredoka font, and the label pills are sized from the measured text.
- **Bug found and fixed during the style pass.** At 37.2–37.4 s the right arm swung over his head as he started to sit up (the earlier v1 render had shown it too). The world-space hand targets started at the world origin, so blending to them dragged the hand up and to the left. They now start where the hand will be planted. Checked in stills at frames 1112–1124.

## Shot notes (timecodes in the final film)

| Time | Shot | Observed in decoded frames | Status |
|---|---|---|---|
| 0.00–0.80 s | S01 | First frame: the guesser stumbling, right hand clutching his chest, pained face with sweat, blue band on the LEFT wrist, dog behind on the right, label top-left with his hair clear of it. First word at 0.12 s. | OK |
| 0.80–1.70 s | S02 | Knees buckle, a bracing hand, then onto his side with eyes squeezed shut; band toward camera; the dog steps back, ears up | OK |
| 1.70–2.00 s | S03a | Accelerating zoom with a roll toward the wrist | OK |
| 2.00–3.77 s | S03b | Close-up: outlined forearm, hand and watch; VITAL SCAN green, then a slight red edge; his pained face in soft focus; dive into the glass | OK |
| 3.77–8.20 s | S04 | Outlined device module, cutaway (skin, yellow fat, tissue, red vessel), micro-port needles, sensors cross into the vessel; "MICROSCOPIC NANO-SENSORS" emphasis caption | OK |
| 8.20–13.80 s | S05–S06 | Vessel ride; docking; two cells grey and flag amber on "cellular decay"; pull-out | OK |
| 13.80–18.00 s | S07 | Body map; organs flag amber; heart quivers, "RHYTHM: LETHAL"; signal runs down the left arm | OK |
| 18.00 s | cut | Match cut to the same watch: one frame of green, then crimson over 4 frames | OK |
| 18.0–21.1 s | S08 | CALCULATING, then **00:02:14 at 19.30 s**, counting down; gasping face behind | OK |
| 21.1–24.9 s | S09 | Close crop on the digits (now a 24-frame push); "DOWN TO THE EXACT SECOND." below the case | OK |
| 24.9–28.0 s | S10 | Blue pulse wave, HELP ALERT SENT, signal bead | OK |
| 28.0–30.4 s | S11 | Map, pin, data packet; drone lifts off a rooftop pad with the caption on the wall below; TIME COMPRESSED from 29.13 s, fully inside its pill | OK |
| 30.4–33.6 s | S12 | Drone crosses the street and hovers over him; dotted link to a location pin. The dog stands just behind him, partly overlapping his hips in depth. | OK, minor |
| 33.6–37.0 s | S13 | Injection inset with blue droplets; STABILIZING slides up as HELP ALERT SENT slides out (2–3 frames of both, clipped by the screen); timer frozen at 00:01:52 | OK |
| 37.0–40.0 s | S14 | Pushes up on both hands, legs come round toward the camera, sits on the grass; the band turns green at 38.33 s; the dog sits beside him with its head visible; drone hovers | OK |
| 40.0–43.0 s | S15 | Opening wrist framing with him sitting: "Life Expectancy: / 42 Years" legible 40.0–41.9 s, then a rack focus to his uneasy face on the question | OK |
| 43.0–45.77 s | S16 | One localized glitch, "?" for 8 frames (43.03–43.27 s); readout restores; hold on the opening wrist composition | OK |

## Motion scan (exported master)
Flagged frames that are not shot boundaries are all deliberate:
- 808: the blue alert wave leaving the watch.
- 886: the cut from the map to the lift-off inside S11.
- 1018–1020: the injection push.
- 1070–1074: the pull-back after the freeze.
- 1260: the rack focus.

The digit-crop push in S09, flagged in the previous render, no longer exceeds the threshold. Mean frame difference is 5.5 out of 255.

## Remaining limitations (not fixed)
- **Sit-up transition (37.6–38.2 s).** The legs swinging toward the camera are a 2D approximation using foreshortening. For about 0.3 s his knees are tucked under him with his feet low in frame.
- **S12 depth overlap.** The dog stands behind him and partly overlaps his hips in the wide shot.
- **Diagrams stay soft.** The cutaway tissue, vessel, body map and neighbourhood map have no ink contours; only the device in the cutaway is outlined.
- **Leash and UI lines.** The leash is a drawn cord, and the ECG traces and dotted signal path are UI lines.
- **Opening pace.** The first sentence runs about 207 wpm in the selected take, a little above the 180–195 guide (see `audio/narration/NARRATION_PROVENANCE.md`).
- **Voice-to-bed margin.** At 36.3 s the margin is 7.8 dB. Measurement suggests it is intelligible; it has not been checked by ear.
