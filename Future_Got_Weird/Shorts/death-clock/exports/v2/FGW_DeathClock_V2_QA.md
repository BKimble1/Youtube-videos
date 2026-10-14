# QA: The Death Clock V2

## What was actually checked

This environment cannot play video or audio in real time. **Nobody has watched V2 at speed or listened to it.** Every finding below comes from a measurement or from still frames decoded from the encoded files in `exports/v2/`.

| Check | Method | Result |
|---|---|---|
| Format and duration | ffprobe on the encoded files | Final: 1080×1920, 30/1 fps, 1364 frames, 45.467 s, H.264 + AAC 320k 48 kHz. Review: 540×960, the same 1364 frames, 45.482 s (AAC end padding). Rendered natively from the project source; the review copy is a downscale of the final, not the other way round. |
| Picture, whole film | Contact sheets of every 6th frame decoded from the final MP4 (`qa/v2/sheet_*.jpg`), read sheet by sheet. Dense sheets (every 3–5 frames) around each transition from review renders. Full-resolution stills of the fall, medium shot, macro, x-ray, chain and ending. | See the timecoded notes |
| Phone size and interface | 18 frames at 360×640 with an approximate Shorts interface overlay (`qa/v2/phone_ui_overlay.jpg`). The overlay geometry is an estimate, not the platform spec. | Captions, countdown, HELP ALERT SENT, STABILIZING, "42 Years" and the "?" sit inside the working area. The caption lane was raised 40 px after this check showed second lines touching the title block. |
| Cuts, pops, flash frames | Frame-difference scan of the final MP4 (`tools/motion_scan.py`) | Flags only frame 747 (the cut from the digits to his face), 983–992 (the dive into the hub on the map and the cut to the lift-off), and 1066 (the cut to his arrival shot). Each is deliberate. Earlier renders also flagged two over-fast camera moves (frames 590–591, 1144–1149); both were retimed and no longer flag. Mean frame difference 7.5 of 255. |
| Countdown and device states | `source/scripts/check_device.ts`, every frame (`qa/v2/DEVICE_CHECK.json`) | **PASS**. 00:02:14 appears once, at frame 639 (21.30 s, on "calculates"). The display only ever steps down by one second (15 steps) and never reaches zero. It is held at 00:01:59 from frame 1114. State order: crimson (597), alert (871), held/blue (1126), green (1214). Green stays fully on to the end. One glitch window, frames 1314–1321, inside the green readout. |
| Captions vs script | `tools/make_srt_v2.py` asserts the 31 caption chunks join to the five locked blocks exactly. The SRT in `exports/v2` is byte-identical to `captions/FGW_DeathClock_V2.srt`. | **PASS** |
| TTS text vs script | `tools/check_tts_text.py script/narration_locked.json audio/narration_v2/tts_input.txt` | **PASS**: 5/5 blocks exact; only `[matter of fact]` and `[curious]` were added |
| Narration words | Blind `eleven_scribe_v1` transcription of the selected take | All 98 words, in order |
| Loudness, peaks | ffmpeg ebur128 on the MP4 audio; `qa/v2/AUDIO_QA.json` from the WAVs | Final MP4: −15.0 LUFS integrated, LRA 3.3 LU, true peak −1.7 dBTP. Review MP4: −15.0 LUFS, −1.6 dBTP. Stems sum to the mix (max error 2.4e-7). |
| Voice over bed | Short-window narration level against music + effects during speech | Speech-weighted margin: minimum 10.7 dB, median 18.1 dB (broadband: minimum 6.4 dB, median 12.1 dB). Tightest at 37.3 s ("consciousness", under the treatment wave), then 35.9 s and 31.5 s. |

## Against the V2 brief

| Requirement | Where to see it | Status |
|---|---|---|
| Script verbatim, 45–47 s | 98 words, 5 blocks; 45.467 s | Met |
| Less theatrical, connected delivery; purposeful pauses | `[matter of fact]` take (164.8 wpm over the speech span). Gaps inside sentences are 0.18–0.70 s. The nine lengthened pauses are listed with what fills them in `script/CUE_SHEET_V2.md`. First word at 0.12 s. | Measured only; **not heard** |
| Badges removed; one brief plain cue | "FICTIONAL FUTURE DEVICE", unboxed, upper-left, 0.13–1.47 s | Met |
| Coherent fall, no pose reset | 0.0–1.7 s: chest clutch, knee buckle, the left hand reaches and plants (1.6 s), he rolls onto his side; the camera follows the wrist down, with no camera roll | Met in decoded frames |
| Attached arm, consistent hand | 1.9–2.5 s: face, shoulder, sleeve, elbow, forearm, band and hand in one shot, then the camera travels down that arm onto the band. In every view the band is on the left wrist, the hand is seen from the back with the thumb on the upper side, and the band sits behind the wrist joint. | Met; hands are the crew's chunky cartoon hands |
| Device redesign | Slim cobalt case, dark glass with a lit bevel, side control toward the hand, strap wrapping the wrist (its far edge visible past the outline, contact shadows on the skin), screen light on the skin, recessed underside module | Met |
| Body journey (8 steps) | Macro 2.5 s → tip round the wrist 3.0–3.8 s → section opens 3.6–4.7 s → port extends, touches, streams, retracts 4.6–7.5 s → hero sensor ring 8.3 s, passes behind a red cell ~10.9 s, reaches the wall, the cell changes on "decay" 13.4 s, local signal 13.5 s → pull back into the same man 14.4–15.8 s → liver 16–17 s → heart 17.4–18.7 s, irregular from 18.7 s → the signal runs down the arm onto the band 19.0–19.8 s | Met |
| Red 00:02:14 readable | 21.3–24.8 s on the macro, then a push onto the seconds | Met |
| Chain through the countdown stretch | 24.9 s cut to his eyes opening; the camera follows his gaze down; the wrist turns toward him and the hand clenches (25.3–26.5 s); the diagnostic bar fills (27.3–28.6 s); HELP ALERT SENT 28.7 s; the ring leaves 28.9 s | Met |
| Compact dispatch in the same neighbourhood; tight drone sequence | The ring opens onto the map (his figure and dog on his lawn); the alert travels to the hub; the pin drops; the route draws; dive into the hub; lift-off 33.0 s; his data docks 34.2 s; crossing 34.7–35.5 s; arrival over him 35.5–36.1 s | Met |
| Full-frame treatment, no inset | 36.1–38.3 s: the drone's light finds the band, the camera tips to the underside section, the port presses, one blue pulse runs down the channel into the vessel, a wave travels along it and the blood behind it brightens. Back on the band face, the timer is held in blue ("TIMER HELD · STABILIZING"), about 38.5–38.9 s. | Met |
| Recovery with mechanics, green UI | Deep breath; the support hand meets the grass at 39.3 s; the elbow loads; the torso rises; the band turns green during the push (40.1 s); he sits at 41.0 s | Met |
| Ending | "Life Expectancy: 42 Years" in green toward his gaze (41.1–42.6 s), attention to his worried face (42.4–43.4 s), "?" on the band at 43.8 s near "know?", his uneasy look at the camera, dip to black over the last 0.5 s | Met |
| Thinner outlines; one art system | Contours at 0.36 of the V1 width; the interiors use the same gradient and gloss primitives | Met |
| No crossfades between shots | Shots change by cuts, camera moves and one circular ring-wipe (a clip, not a dissolve). The two switches between drawings happen inside the vessel and match (decoded frames 434–437). | Met |
| Captions | Fredoka Bold 70 px, white with a thin dark stroke and a small shadow, no plaque; 2–5 words, at most two lines; six emphasised words; one lane (centre y 1450). Kept off the digits, heart, injection path and face in every sheet. | Met in decoded frames |
| Sound design | Per the brief's table: restrained fall Foley; one swish and a small mechanism for the reveal; stream ticks and flow; a regular pulse, then a fibrillation, a sensing response and the warning pair; ticks only while the band is on screen; a distinct send, receive and pin; rotors that pan with the drone; actuator, pulse, wave, breath and ground contact; the music thins under the question; one glitch; a low final beat | Built and measured; **not heard** |

## Timecoded notes (final)

| Time | What the decoded frames show |
|---|---|
| 0.00–1.70 | Distress from frame 0 (chest clutch, sweat, band visible on the left wrist), the cue top-left, the dog reacting; the knees hit at 1.13 s, the hand plants, he rolls onto his side |
| 1.70–2.53 | Medium on his face and the attached arm, then the camera slides along the sleeve and forearm onto the band: green VITAL SCAN |
| 2.53–4.70 | The case turns about the wrist to its side; a dark backdrop replaces the lawn behind the arm; the section opens from the port: skin, fat lobules, tissue, the vessel |
| 4.60–8.30 | The port barrel slides down and touches the skin; a narrow stream runs to the vessel; the sensors spread with the flow; the port retracts |
| 8.30–14.40 | Dive into the vessel (flow turned to screen-up); the ringed hero sensor among red cells, passing behind one; approaches the wall; the wall cell greys and wrinkles on "decay"; amber signal ring |
| 14.40–16.10 | Pull back out of the same vessel into the x-ray of his forearm, upper arm and chest, his head and hair in frame |
| 16.10–19.00 | The liver dims under amber-flagged sensors; the heart beats, then quivers; its sensors turn red |
| 19.00–24.90 | The red pulse travels down the arm; the band turns crimson with a red ring; CALCULATING; 00:02:14 on "calculates"; push onto the seconds |
| 24.90–29.70 | His eyes open and drop to the band; the wrist turns and the hand clenches; the diagnostic bar fills; HELP ALERT SENT; the blue ring opens onto the map |
| 29.70–33.07 | Map of the same streets: his figure and dog, the alert reaching the hub, the pin drop, the route |
| 33.07–36.10 | Rooftop lift-off, his data docking, crossing the street, arrival over him with a light cone onto the band |
| 36.10–38.90 | Underside treatment section; blue pulse; wave along the vessel; the held timer on the band face |
| 38.90–41.10 | Deep breath, hand to grass, push up, green band, sitting; the dog sits; the drone backs off |
| 41.10–45.47 | 42 Years readout; tilt to his face; "?" glitch; uneasy look; dip to black |

## Unresolved or limited (not fixed)

- **Nothing has been heard.** Voice tone, naturalness, the joins at the nine lengthened pauses, pronunciation, effect realism and the music's feel are unverified.
- **Nothing has been watched at speed.** Smoothness of the camera journeys, the speed of the dive (8.3–9.5 s) and pull-back (14.4–15.8 s), and whether the 0.9 s heart-to-band sweep (19.0–19.8 s) reads are judged from frames only.
- **The tip round the wrist is the case rotating about the arm while the background is replaced by a backdrop.** It is not a true 3D camera orbit of the whole scene.
- **The x-ray upper arm reads as a translucent sleeve tube**, and his clutching right forearm shows as a short stick where it enters the x-rayed chest.
- **The final "?" is small**: about 50 px tall on the band in the face-and-band two-shot.
- **The diagnostic bar is small** on the band in the medium framing.
- **The sit-up still uses 2D foreshortening for the legs** (about 40.1–40.7 s).
- **The countdown runs at film speed through the rescue montage** (about 16 s from 00:02:14 to the hold). The montage is edited and makes no real-world response-time claim, but a viewer could read it as the drone arriving within 16 s.
- **Phone interface overlay is approximate.** It has not been checked on a device or in the YouTube app.
- **The cover candidate** (frame 790) has plain lawn in its lower 40%.

## Remaining listening checks (for the owner)

1. Opening line: is it interested and direct, without V1's trailer gravitas? Does "exactly" land?
2. The long emergency-services sentence (29.7–37.7 s): one connected phrase? Is "potentially" intact?
3. Pauses at 2.6, 8.3, 13.8, 24.8, 28.7 and 37.7 s: do they sound intended with the picture and effects in them?
4. Pronunciation of "nano-sensors", "cellular decay", "life expectancy".
5. The fall Foley (0–1.7 s) and the warning pair (19.8 s): restrained, not cinematic?
6. Rotor pan and Doppler across 33.0–36.1 s; the hover ducked under the narration.
7. Narration over the treatment wave at 37.3 s (the tightest measured margin).
8. The final question at 43.3–44.0 s: does it sound like a question, with "know" intact? Does the ending (glitch, last beat, dip to black) feel deliberate on a phone speaker and on headphones?
