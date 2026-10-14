# QA: The Death Clock V3

## What was actually checked

This environment cannot play video or audio. **Nobody has watched V3 at speed or listened to any of it: not the narration, the mix or the loop seam.**
- **ElevenLabs:** used through the connected account to generate the narration takes and to transcribe them blind.
- **Runway:** not used.
- **Playback:** no playback tool was available.

Every finding below comes from a measurement, or from frames decoded from the encoded files in `exports/v3/`.

| Check | Method | Result |
|---|---|---|
| Format and duration | ffprobe on the encoded files | **Final:** 1080×1920, 30/1 fps, **1350 frames, 45.000 s**, H.264 CRF 16 with AAC 320k 48 kHz, rendered natively from the project source. **Review:** 540×960, the same 1350 frames, 45.013 s (AAC end padding); it is a downscale of the final. |
| End fade and black frames | ffmpeg `blackdetect` on the final; the last frames decoded | No black segments (`blackdetect`, d 0.02 s, pixel threshold 0.10). The last frame is the red 00:02:14 callback on the band. There is no fade and no tail. |
| Picture, whole film | Contact sheets of every 6th frame of the final MP4 (`qa/v3/sheet_*.jpg`, 225 frames), read sheet by sheet. Every frame of the trunk wipe (29.53–30.30 s, `qa/v3/wipe_frames_886-909.jpg`) and of the loop join (the last 4 and first 4 frames). Full-resolution stills of frames 12, 470, 696, 714 and 1240. | See the timecoded notes. One defect was found and fixed (the wipe, below). |
| Phone size and interface | 17 frames at 360×640 with an approximate Shorts interface overlay (`qa/v3/phone_ui_overlay.jpg`). The overlay geometry is an estimate, not the platform spec. | Inside the working area: the captions, the countdown, the heart, the EMERGENCY sign, "42 Years", the "?" and the callback. |
| Cuts, pops, flash frames | Frame-difference scan of the final MP4 (`tools/motion_scan.py`, `qa/v3/MOTION_SCAN.json`) | Flags only the hard cuts at frames 8, 748 and 864; the match cut at frame 727 does not flag. Mean frame difference 10.2 of 255. The first render also flagged frames 897, 898 and 905 (the wipe defect below); after the fix and the re-render they no longer flag. |
| Loop seam | `tools/seam_check_v3.py`: `qa/v3/seam/seam_check_x3.mp4` (the last 1.5 s plus the first 1.5 s, three times, picture and sound), `seam_frames.jpg`, `SEAM_CHECK.json` | **Picture.** The push carries straight through the join with continuous framing, scale and direction (`seam_frames.jpg`). The wrap pair (frame 1349 to 0) differs by 14.9 of 255, against a median of 5.3 over the last frames and a maximum of 13.5 over frames 0-7. The step is the red warning ring and small shake landing on frame 0 with the transient (designed); there is no snap in framing and no duplicate frame. **Sound** (mix WAV): sample step at the join 0.0020 (typical 0.0034 over the last second), so no click. RMS is −20.1 dB over the last 100 ms and −13.1 dB over the first 100 ms (the single warning transient at frame 0). The narration stem is at −83 dB across the join: 0.52 s of voice silence from "know?" to "This". **The seam clip has not been played or heard.** |
| Countdown and device states | `source/scripts/check_device3.ts`, every frame (`qa/v3/DEVICE_CHECK.json`) | **PASS.** One origin: red 00:02:14 at frame 0. It counts at film speed whenever the band is in picture: 00:02:12 at 2.6 s, 00:01:54 when the warning lands at 20.4 s, 00:01:50 at 24.2 s. Story time is compressed only while the map, the hospital and the flight are on screen (frames 726–925): 00:00:42 at the injection, held at 00:00:40 from 33.1 s. The display never increases and never reaches zero. Green is fully on from 37.0 s and stays until one glitch window (44.27–44.53 s). The red callback 00:02:14 starts at 44.57 s, and the last frame matches frame 0. |
| Captions vs script | `tools/make_srt_v3.py` asserts that the 38 chunks join to the five script blocks exactly, with no overlaps. The SRT in `exports/v3` is copied from `captions/FGW_DeathClock_V3.srt`. | **PASS**. The captions follow the script ("want to"), not the take's spoken "wanna". |
| TTS text vs script | `tools/check_tts_text.py script/narration_v3.json audio/narration_v3/tts_input.txt` | **PASS**: 5/5 blocks are exact. Only `[fast]`, `[interested]` and `[curious]` were added. |
| Narration words | Blind ElevenLabs Scribe transcription of the selected take C4 | All 136 words in order, except one: the take says **"wanna"** where the script has "want to" (the final question). |
| Narration pace and gaps | Voice activity on the narration stem, plus the word alignment (`audio/narration_v3/VOICE_EDIT_LOG.json`) | **Voice onset:** 0.04 s (first aligned word at 0.12 s). **Last word "know?":** ends 44.52 s. **Pace:** 183.5 wpm over the whole span including every gap; about 209 wpm inside phrases. **Gap edit:** 21 gaps measured on the stem, 0.14–0.32 s after the edit. 16 were shortened by removing silence only (2.38 s in total), with no time-stretch or pitch change. By word-alignment boundaries the longest gap is 0.38 s (42.06 s, "once. \| If"). |
| Loudness, peaks | ebur128 on the mix WAV (`qa/v3/AUDIO_QA.json`) and on the final MP4's audio | **Mix:** −15.0 LUFS integrated, LRA 1.7 LU, −1.7 dBTP. Final MP4: −15.0 LUFS, LRA 1.7 LU, true peak −1.8 dBTP. Review MP4: −15.0 LUFS, −1.6 dBTP. The stems sum to the mix (max error 2.4e-7). The limiter (−1.8 dBFS ceiling) reduced at most 1.24 dB. |
| Voice over bed | Short-window narration level against music plus effects, during speech | **Speech-weighted margin:** minimum 10.3 dB, 5th percentile 14.6 dB, median 19.3 dB. **Broadband:** minimum 5.8 dB, median 13.3 dB. The tightest windows are at 20.0 s ("back to his wrist", under the warning landing), 23.3 s ("matters. His", under the transmission pulse) and 35.3 s ("steadies as he sits up"). |
| Rig prototype gate | `qa/v3/prototype/collapse_frames_8-56.jpg` and `elbow_bends.jpg` were rendered and inspected before the rig was used in the film | Arm and leg contours are continuous through the joints, with no round caps. The feet stay planted through the collapse, and the hand stays planted after contact. |

## Defect found in the final inspection, fixed and re-rendered

- **Trunk wipe (V3 master, first render, frames 896–905):**
  - The occluder was wider than the frame and switched scenes at a fixed frame, so the arrival shot appeared ahead of the edge (frame 897).
  - It then vanished in one frame while still covering about 45% of the picture (frame 905).
  - Both showed as spikes in the motion scan.
- **Fix:**
  - The occluder is now a tree trunk close to the lens, narrower than the frame (760 of 1080 px).
  - It passes right to left at constant speed: the flyover stays ahead of its leading edge and his lawn appears behind its trailing edge.
  - The flyover keeps its speed until the trunk has passed, and the trunk clears the frame before the cut.
  - No frame is fully covered (`shots/Dispatch.tsx`, `TrunkWipe`).
  - The whole master was re-rendered from source, and every frame of the new wipe was inspected (frames 886-909 decoded from the final MP4).

## Against the V3 brief

| Requirement | Where to see it | Status |
|---|---|---|
| New 136-word narration, the first sentence exact, fast and nearly continuous, same voice, no V2 audio, no large stretch | Take C4 (ElevenLabs, the same Test Voice as V1 and V2), generated fresh. Silence-only gap edit; 183.5 wpm over the span. One spoken contraction ("wanna"), recorded in `NARRATION_PROVENANCE.md`. | Measured only; **not heard** |
| 45.0–45.4667 s, native 30 fps, at most 1364 frames, no black tail | 1350 frames, 45.000 s; the last frame is the red callback | Met |
| Red 00:02:14 legible in the first frames, distress, the first word at frame 0 | Frames 0–7: the red digits fill the centre with a warning ring, and his fingers and legs are behind. Voice onset 0.04 s. | Met in decoded frames |
| First six seconds: collapse with the hand planting, follow the wrist into the band, vibration and fingers, tilt to the port | 0.27–1.87 s collapse (hips land 1.17 s, hand plants 1.30 s); 1.33–2.60 s follow the wrist; 2.60–3.97 s buzz and fingers; 3.97–5.27 s tilt to the port; 5.27 s cut edge | Met in decoded frames |
| No exposed joint shapes; calmer acting; believable fall | Continuous limbs (`lib/limb.tsx`) and one outer contour per figure. Pain expressions without a grin, with smaller sweat drops. | Met in decoded frames; the motion is **not watched at speed** |
| Mechanism: section with a moving edge, stream, hero sensor, red cell, bend, changed cell, scan, signal | 5.3–15.4 s | Met |
| Torso cutaway with depth, one organ change, irregular heart, pulse down the arm into the red screen | 15.4–20.9 s. An oval chest window (rim, far wall, parallax) clipped to his body; the liver dims; the heart quivers; the red pulse runs down the same arm into the band. | Met |
| Critical seconds: fingers, eyes, vibration, light on the skin, transmission pulse | 20.9–24.2 s | Met |
| Hospital launch bay (sign, glass stairwell, dock, latch, rotors, rise, bank, travel, arrival); the drone only assists | 24.2–30.9 s. The band delivers the treatment, and no beam or light is shown treating him. | Met |
| Anchored transitions, no dissolves | Shared anchors at every boundary in the brief's table: the wrist, the case tilt, the sensor across the wall, the signal up the vessel, the pulse down the arm, the transmission pulse into the dock beacon, the trunk wipe, the internal pulse into his breath, and the glass into the callback. There are four hard cuts and no crossfades: frame 8, into the collapse; frame 727, to the map, matched on the pulse's screen position; frame 748, to the hospital; frame 864, to the flyover. | Met |
| Treatment, the heart settles, recovery, uneasy reaction to the green readout; "potentially" kept | 30.9–42.4 s. "potentially" is in the voice and the caption. | Met |
| Loop: no fade, a shared component, "?" glitch into the red callback, cyclic sound, seam check | One camera trajectory through the loop point (`loopF`). The device state and its flash phase are continuous, and the music is cyclic on the 1/45 Hz grid. | Picture measured; **seam not heard** |
| Captions rebuilt on the new alignment | 38 chunks from the measured word times, in one lane | Met |
| One brief unboxed fiction cue, hypothetical packaging, no badges, no drug names or doses, no spoken disclaimer | "FICTIONAL FUTURE DEVICE" upper left, 0.13–1.47 s; `upload/PACKAGING_V3.md` | Met |

## Timecoded notes (final, decoded frames)

| Time (s) | What the decoded frames show |
|---|---|
| 0.00–0.27 | Extreme close on the band: red 00:02:14, a red warning ring on frame 0 and a glow on the skin. The push carries on from the previous play's last frames. |
| 0.27–1.87 | Cut to a low three-quarter view: eyes squeezed, a hand to his chest. The knees give over planted feet and the hips land at 1.17 s. The left hand reaches and plants at 1.30 s, the elbow gives and locks, and the dog reacts. The fiction cue is in the upper left. |
| 1.33–2.60 | The camera follows the bracing wrist down the forearm into the band, whose layout stands upright on the vertical arm (00:02:12). |
| 2.60–3.97 | Macro on the band: it buzzes and the fingers press into the grass (00:02:11, 00:02:10). |
| 3.97–5.27 | The case turns about the arm to its underside, and a dark backdrop isolates the arm: the recessed port. |
| 5.27–6.87 | A bright edge sweeps the section open under the band (skin, fat, muscle, vessel); the port extends. |
| 6.87–8.80 | The stream crosses into the vessel; one hero sensor rings. |
| 8.80–10.20 | Dive across the near wall into the lumen. |
| 10.20–11.77 | The hero overtakes the flow; a red cell passes in front of it; the vessel bends. |
| 11.77–13.33 | Closes in on the changed wall cell; the scan ring fires at 13.4 s and the cell greys. |
| 13.33–15.43 | Amber signals leave; the camera follows the lead signal up the vessel. The walls become the see-through arm (14.6–14.8 s), then the man at 15.0 s. |
| 15.43–17.03 | An oval window opens on his chest under the near arm; the liver dims under amber sensors. |
| 17.03–18.83 | The heart beats, then quivers irregularly; its sensors turn red. |
| 18.83–20.87 | The red pulse runs down the same arm (19.0–20.2 s) into the band: red ring, 00:01:54. |
| 20.87–22.57 | Tight on the red countdown (00:01:54 to 00:01:52), with screen light on the skin. |
| 22.57–24.23 | Face-and-band two-shot (the top of his hair cropped): fingers dig in, eyes move. The transmission pulse leaves the band, and the camera tilts up with it to the street. |
| 24.23–25.13 | Map: the pulse runs from his location to the hospital block (0.7 s). |
| 25.13–27.10 | Hospital: EMERGENCY sign, glass stairwell with a staff member, dock, ambulance bay below. The pulse comes down into the dock beacon, and the camera pushes in. |
| 27.10–28.80 | The latch opens, the rotors blur, and the drone rises clear and banks. |
| 28.80–30.30 | Flyover with parallax. A foreground trunk passes the lens (29.67–30.30 s): the flyover ahead of it, his lawn and the arriving drone behind it. |
| 30.30–30.90 | The drone hovers beside him on the left. |
| 30.90–32.90 | Push onto the band (00:00:42, blue ring). The case turns and the section re-opens; the port injects one blue pulse into the vessel. |
| 32.90–34.57 | Back out: the blue pulse climbs the see-through arm and the heart settles. The band is held at 00:00:40 (TIMER HELD · STABILIZING), and the window closes. |
| 34.57–36.60 | He breathes out, the hand loads, the torso rises and he sits up. His far hand rests on his chest. |
| 36.60–40.37 | The wrist rises to camera: green replaces red, and "Life Expectancy: 42 Years" is large and level (37.0–40.0 s). |
| 40.37–42.43 | Medium two-shot: unease, gaze to camera and back, hand on his chest. |
| 42.43–45.00 | Push into the glass: "?" glitch at 44.27–44.53 s, then the red 00:02:14 callback from 44.57 s. The last frame leads into frame 0. |

## Unresolved or limited

- **Nothing has been heard.** Unverified:
  - the voice's tone and pace
  - the shortened sentence joins
  - pronunciations and "wanna"
  - effect realism, the music's feel and the loop seam
- **Nothing has been watched at speed.** These are judged from frames only:
  - the smoothness of the collapse
  - the dive (8.8–10.2 s)
  - the pull-back out of the vessel (13.3–15.4 s)
  - the 0.7 s map
  - the trunk wipe
- **The tilt round the case is the case rotating about the arm, with the background replaced by a backdrop.** It is not a full 3D orbit of the scene.
- **The see-through arm shows the sleeve as translucent white over the vessel** (15–20 s and 33–34 s).
- **His far hand on his chest during the recovery is seen in profile** (34.6–42.4 s). It reads as a hand to the chest in stills; check it at speed.
- **The opening fiction cue crosses his red hair** at about 0.4 s and is less legible there.
- **The countdown is compressed off picture through the dispatch** (00:01:50 to 00:00:42). The picture makes no claim about real response times.
- **The phone interface overlay is approximate.** It has not been checked on a device or in the YouTube app.
- **The cover candidate** (frame 690, caption-free) crops the top of his hair, and the digits are small at thumbnail size.

## Remaining listening checks (for the owner)

1. **Frame 0:** does "This device" (onset 0.04 s) start cleanly over the single warning transient? Is the read interested rather than announcer-like?
2. **Pace:** fast and connected but clear on a phone speaker? Are the shortened sentence joins natural rather than clipped or breathless? They are at 2.44, 4.95, 15.09, 22.24, 23.85, 34.21, 36.26, 40.04 and 42.06 s.
3. **Pronunciation:** "nano-sensors", "cellular decay", "lethal rhythm", "potentially", "life expectancy, forty-two years".
4. **"would you wanna know?"** (43.6–44.5 s): acceptable natural speech, or regenerate the last line?
5. **Loop seam** (`qa/v3/seam/seam_check_x3.mp4`): "know?" ends, 0.52 s of voice silence, then the warning transient and "This device". Natural, with no clipped syllable and no double alarm? Does the music run on without a dip?
6. **Mix on a phone speaker:** is the voice clear at the tightest margins (20.0 s, 23.3 s, 35.3 s)? Are the collapse Foley, buzzes, rotors, trunk swish and glitch specific but restrained?
