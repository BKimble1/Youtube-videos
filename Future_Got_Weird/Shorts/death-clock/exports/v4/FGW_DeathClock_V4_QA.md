# QA: The Death Clock V4

## What was actually checked

**Nothing in V4 has been played back at speed or listened to: not the picture in motion, the narration, the mix, the new effects or the loop seam.** This environment has no playback. Every finding below is either a measurement or comes from frames decoded from the encoded files in `exports/v4/`. Sound statements are measurements only and do not certify sound or voice quality. No ElevenLabs or Runway generation was made for V4.

## Deliverables (measured with ffprobe)

| File | Measured |
|---|---|
| `FGW_DeathClock_V4_Final_1080x1920.mp4` | 1080×1920, 30/1 fps, **1350 frames, 45.000 s** (video stream and container). H.264 (BT.709) with AAC 48 kHz. Rendered from the project source. |
| `FGW_DeathClock_V4_Review.mp4` | 540×960, the same 1350 frames. The container reads 45.013 s because of AAC end padding. A downscale of the final. |
| `FGW_DeathClock_V4_Captions.srt` | 38 cues, byte-identical to the V3 SRT. Caption text, timing and style are unchanged. |
| `FGW_DeathClock_V4_Narration.txt`, `audio/FGW_DeathClock_V4_Narration_48k.wav` | Byte-identical to V3 (same recording, same text). |
| `audio/` stems and mix | The narration and music stems are V3's, sha256-equal. Only the effects stem is new. The stems sum to the mix with 0 LSB error. |
| `FGW_DeathClock_V4_Cover_1080x1920.png` | `DeathClockClean` frame 30 (no captions). |

## Corrections against the V4 brief (timecodes are s and frames at 30 fps)

| V3 finding | V4 correction | Where to see it | How it was checked |
|---|---|---|---|
| The leash was attached to his sleeve and wrist | The leash is a separate prop (`art/Leash.tsx`): collar, slack hang, touchdown, cord lying on the grass, released handle with a contact shadow. It is drawn once for every street shot and never touches him. The hang settles into the cord without a kink. | 0.27–1.9 s (8–56) and every later wide | Frames decoded from the master (sheets every 2nd frame) and a geometry probe of the gap to his silhouette |
| Arm and chest anatomy superimposed (bowl window, sleeve strip) | Two separate reveals with one authority (`lib/reveal4.ts`, arm × chest = 0 on every frame):<br>• **Arm:** a section on the forearm, 3.97–15.13 s (119–454). It closes with a single edge, leaving nothing behind after 15.10 s (453).<br>• **Chest:** a separate window on the front thorax, 15.6–19.3 s (468–579) and 32.9–34.4 s (987–1031). It is opaque on every frame and opens and closes by scaling, never by fading.<br>• **Heart:** between the two lungs, with the liver under the right dome. Nothing is drawn over the arm. | 14.7–15.2 s; 15.4–19.5 s; 32.9–34.5 s | Every frame at the opens and closes; geometry probe; `check_captions4` |
| Device side view as a long rail; sensing as a thin line and beads | Compact case geometry shared by front, side and underside views (`art/Device.tsx`). In the sensor shot (5.9–8.7 s, 177–262):<br>• a shutter opens;<br>• the port touches the skin with a dimple;<br>• the cartridge releases a sparse stream that merges with the flow.<br>The orphan guide line, and the bright cut-edge stroke at 5.9–6.0 s, are removed. | 3.5–8.7 s (104–262) | Decoded frames; `check_device3` |
| Dispatch transitions abrupt | • **Map → hospital:** the map beacon matches into the dock beacon at 24.93 s (747/748).<br>• **Wide → rooftop:** one continuous approach.<br>• **Takeoff:** latch → spin-up → lift → travel, in that order.<br>• **Rooftop → neighbourhood:** the drone's screen position, scale and pitch match across 28.8 s (863/864).<br>• **Trunk wipe:** one trunk fully covers the frame at 29.9 s (897–898), so no frame shows two scenes.<br>• **Drone through the wipe:** position, pitch and speed are continuous behind the trunk, then a braking flare into the hover. | 24.2–30.6 s (726–918) | Every frame at each boundary; screen-position and velocity probes |
| Drone over his hair | The hover is above-left of his head, with at least 60 px of sky between the drone and every roof outline from 30.2 s (906). Clearance above his hair is about 75 world units or more (a geometric estimate; the gap is plainly wide in the frames). A soft ground shadow on the lawn follows the drone. The dashed data line over his body is removed; the drone blinks and the band's ring answers at 30.3 s (909). | 29.97–30.6 s | Geometric probe and decoded frames |
| Treatment chain unclear | • **Approach:** 30.7–31.3 s (921–939). The hand fades into the section backdrop with a soft straight edge during the case roll; there is no circular cut. In the underside close-up (941–986) the far end of the case falls into shadow away from the port, so the profile does not read as a long rail.<br>• **Actuation:** 31.37–31.7 s (941–951). Shutter, actuator, contact and dimple.<br>• **Entry:** 31.53–32.4 s (946–972). The section opens continuously from the contact point. A narrow channel runs from the port into the vessel; the pulse follows it and enters the flow.<br>• **Internal response:** the pulse is tracked in the vessel, then match-cut at 32.9 s (986/987) into the separate chest view. There it enters the right atrium through the one vena cava, and the beat settles from irregular to regular: uneven twitches, then regular beats of about a 10% squeeze from 33.5 s (1005).<br>• **Retract:** 32.43–32.83 s (973–985). The actuator retracts and the port closes. | 30.7–34.4 s | Every frame of 938–990; per-frame difference with no spike (the old pop at 952 is gone); 986/987 position probe |
| Loop ring pop and framing at frame 0 | One camera trajectory and one periodic alarm state in loop time. The ring is emitted at 1344, 6 and 18, concentric with the glass and never over the digits. The screen's ECG trace is continuous through 1349 → 0. | 44.8 s → 0.6 s | `seam_check_v4`; every frame of 1310–1349 and 0–45 |

### Defects found by the final QA passes, fixed and re-rendered

| Defect (previous master) | Fix |
|---|---|
| **4.07–4.13 s (122–124) and 30.97–31.0 s (929–930), high.** The hand was cut by a hard-edged shrinking circle and left a round patch of skin for one frame. | A soft linear sweep (1.5R edge), timed to the case roll: 124–137 and 928–939. The thumb contour fades with it, and the forearm falls into shadow past the band. |
| **15.6 s, 19.3 s, 34.37 s (468, 579, 1031).** One translucent frame of the chest window over the shirt. | The window is opaque on every frame it is visible and opens and closes by scale only. |
| **15.0–15.07 s (450–452).** A detached fat fragment as the arm section closed. | All layers close with one edge. |
| **Chest layout.** The heart was against the window's front edge, with the liver under the apex as a dark patch. | The heart is central between the lungs. The liver is under the right dome and dims to grey-brown. There is one vena cava, and the trace no longer runs across the lung. |
| **9.9–10.3 s (296–309).** The dive end reversed the cell flow within 4 frames. | The camera follows a smoothed track; the turn is spread over about 15 frames. |
| **6.9–8.7 s (206–262).** An orphan guide line ahead of and after the sensor beads. | Removed; only each bead's short wake remains. |
| **23.5 s (706).** The transmission glow washed over the digits; the ring was drawn over the sleeve. | The glow is kept off the screen and the ring stays on the skin. |
| **31.67–31.73 s (950–952).** The treatment section popped open (frame difference 20 against about 2). | The section opens continuously from the contact point. |
| **29.87–29.93 s (896–898).** The trunk wipe showed a split screen with mismatched ground. The drone jumped behind the trunk and sat on a roof ridge, and it had no ground shadow. | A full-cover trunk, continuous drone motion with a braking flare, a higher hover clear of the roof, and a lawn shadow. |
| **Near sleeve top (V4 regression).** It had a translucent strip and run-on outlines. | A clean, opaque sleeve top. |
| **Opening cue.** It faded in across the 7/8 cut, over the close-up sleeve. | It starts on the cut at frame 8. |
| **10.57–10.77 s (317–323), carried over from V3.** A near-side red cell shot up the screen against the flow, across the hero sensor. | The hero now sweeps past it: it drifts down with the other cells (316–322). |
| **30.13–30.4 s (904–912), second pass.** The drone still hovered just over the roof peak. | The hover moved up-left of his head. There is at least 60 px of sky above the roof from 906; 903–905 are 14, 36 and 54 px while it climbs. |
| **32.53–32.87 s (976–986).** The whole underside of the case read as a long bright rail. | The far end falls into shadow away from the port (941–986). The camera and the 986/987 match are unchanged. |
| **33.3–34.3 s (1000–1030).** The heartbeat settling was barely visible (about 3–4% area). | The contraction is legible: twitches of about 4–6%, then beats of about 9–10% (geometry and render measurements). The beat frames, which the sound uses, are unchanged. |
| **34.7–35.0 s (1042/1043), carried over from V3.** The right hand popped from flat to upright and the arm re-routed. | One continuous reach around the shoulder. The hand turns at most 24°/frame (29° at 1046/1047). |
| **36.6–36.9 s (1097–1106), carried over from V3.** The push into the green close-up stalled, surged and stalled. | One eased push for the band's position and zoom. The close-up arrives about 4 frames later, and its speed never reverses. |
| **0.27–1.17 s (8–35), director's note: he briefly appeared to float in the collapse.** | The hips used to glide at a steady ~16 units/frame onto an invisible chair. Now the legs fail progressively: the hips accelerate from the cut (7 units/frame) into the landing at frame 35 (about 33 units/frame). The camera follows only half of the drop and catches up after the impact. Frames 0–7 (the loop's cold open), the landing frame, the hand plant at 39 and the settle are unchanged. |
| **25–29 s, director's note: the drone launch could be quicker.** | The camera reaches the rooftop at 26.53 s (796, was about 829). The latch opens at 26.57 s (797, was 813), the spin-up takes 13 frames instead of 22, and the drone lifts off at 27.07 s (812, was 837). It is nose-down and travelling from 27.67 s (830), so it is moving on "launches". The 863/864 cut stays matched in screen position, scale, pitch and roll, and everything from the trunk wipe (890) on is unchanged. The latch and rotor sounds moved with the picture. The EMERGENCY sign now slides partly out of frame at the cut as the camera follows the drone. |
| **ECG.** The R spike blinked out at 1339 and 1344. | Denser trace sampling. |

## Measurements on the final files

| Check | Method | Result |
|---|---|---|
| Format and duration | ffprobe | 1350 frames, 45.000 s, 30/1, 1080×1920 |
| Black frames, fades | ffmpeg `blackdetect` (d 0.02 s, pixel threshold 0.10) | None. The last frame is the red 00:02:14 callback. |
| Countdown and device states | `source/scripts/check_device3.ts`, every frame (`qa/v4/DEVICE_CHECK.json`) | **PASS.**<br>• One origin: 00:02:14 at frame 0.<br>• 00:01:54 when the warning lands (612) and 00:01:50 at 24.2 s (726).<br>• 00:00:42 at the injection (927), held at 00:00:40 from 993.<br>• Story time is compressed only over 726–889, while the band is out of picture. |
| Captions vs subjects | `source/scripts/check_captions4.ts`, every frame (`qa/v4/CAPTION_CHECK.json`) | **PASS.** No caption over the digits, port, slug, heart, eyes or hero sensor (24 px margin).<br>The script also notes, without counting it as a collision, that the treatment captions sit over the case body at 941–986. |
| Cuts, pops | `tools/motion_scan.py` (`qa/v4/MOTION_SCAN.json`) | Mean frame difference 8.7. Spikes:<br>• at the expected cuts: 8, 177, 748, 864, 987;<br>• at 573: the fast pull-out from the chest. It is a smooth rise and fall (13 → 35.7 → 8.5), identical to the previous master, not a pop.<br>The previous spike at 952 is gone. |
| Contact sheets | `tools/qa_sheets.py`, every 6th frame (`qa/v4/sheet_*.jpg`), plus a phone-size overlay (`qa/v4/phone_ui_overlay.jpg`) | See the final inspection below. |
| Loop seam, picture | `tools/seam_check_v4.py` (`qa/v4/seam/`) | The 1349 → 0 pair differs by 4.84 (of 255), against a median of 5.12 over the last second; frames 0–7 reach at most 4.54. No black, frozen or duplicated frame. |
| Loop seam, sound (measured, **not heard**) | `seam_check_v4.py`, per-frame RMS | The mix steps +2.8 dB across 1349 → 0, against V3's 7.6 dB (target under 3 dB). Most of it is the V3 music stem's downbeat at frame 0 (+5.5 dB on that stem). The alarm onsets in the effects are spaced 12.7 frames across the join, at −6.2 and +6.5 frames. |
| Loudness | ebur128 on the final MP4's audio, the review MP4 and the mix WAV | **Final MP4:** −15.0 LUFS, LRA 1.7 LU, peak −1.8 dBFS.<br>**Review MP4:** −15.0 LUFS, −1.6 dBFS.<br>**Mix WAV:** −15.06 LUFS, −1.76 dBTP; V3 was −15.05 / −1.74. No re-normalisation and no new limiter. |
| Voice over bed (measured) | `tools/qa_audio_v4.py` (`qa/v4/AUDIO_QA.json`) | **Broadband margin:** minimum 5.8 dB, median 13.5.<br>**Speech-weighted margin:** minimum 10.3 dB, median 19.3.<br>Both minimums equal V3's. The tightest windows are at 20.0 s, 23.3 s and 35.3 s. |
| Narration unchanged | sha256 | The narration and music stems, the narration WAV, the text and the SRT are identical to V3. |

## Final inspection of the re-rendered master

Three rounds of independent frame inspection ran on the encoded masters. All of them decoded frames from the MP4s only and compared each master with the one before it:
1. Six inspectors: four ranges, the loop seam, and acceptance against the brief.
2. Four inspectors, one per range, after the first fixes.
3. Two inspectors on every frame of the ranges changed last (298–332, 880–990, 987–1117), plus an every-6th-frame regression scan of the whole film.

The final round confirmed every fix in the tables above and found no regressions. Every defect it rated high or medium is fixed.

**Material unresolved defects: none found in the frames.** These minor points remain. They are recorded for completeness and none breaks a brief condition:
- **The drone's skid grazes the near roof slope (30.03–30.07 s, 901–902)** for about 2 frames as it comes out from behind the trunk and climbs. From 903 the gap is clear sky.
- **The near-side red cell passes quickly (10.53–10.77 s, 316–323).** It is about 5× faster than the background cells, as foreground parallax. Its direction is now correct.
- **The heart rests between beats (33.87–34.2 s, 1016–1026).** It holds still between the clear beat at 1005 and the next at 1027; the 22-frame spacing is the scheduled rhythm.
- **Pale traces of the fading hand (4.37–4.47 s and 31.03–31.17 s).** As the hand fades into the backdrop, a faint thumb ghost shows at 131–134 and a light haze at 931–935. There is no circle or edge.
- **The backdrop arrives as a vignette (3.8–4.03 s, 114–121).** It reads slightly like an oval spotlight, with a pale shirt halo beside the forearm for a few frames.
- **A small hard-edged pale rectangle under the band (23.53–23.57 s, 706–707)** shows for 2 frames as the transmission glow starts. The digits stay clear.
- **The chest trace ends in a small sensor bead on the window rim (15.7–19.3 s).** The wire into the heart is gone.
- **A thumb-like stub of his right hand shows beside the near sleeve in the seated wides.** Carried over from V3.
- **The map → hospital cut (24.9 s) flips from the top-down map to the front view.** The beacon and the dock line up in position and size.
- **The readout change during the push (36.73–36.8 s).** 00:00:40 and "42 Years" overlap for about 2 frames as the screen changes from red to green.

## Remaining checks that need listening (not done here)

1. **Loop join:** play `qa/v4/seam/seam_check_x3.mp4` and judge 1349 → 0 three times. The V3 music stem has a soft downbeat on frame 0 (+2.8 dB in the mix). It may be heard as a restart.
2. **"This" under the alarm:** the alarm at the head (emissions at 1344 and 6), heard against the first word, "This".
3. **Treatment sounds:** the treatment pulse (31.87–32.33 s), heard under "an automatic injection" and ducked under it.
4. **Sensor-bead ticks:** heard under "microscopic nano-sensors" (6.9–8.4 s).
5. **Rotor:** continuity over 28.7–31.3 s (860–940), including the new drone path through the trunk wipe (the rotor pan and distance follow it).
6. **Mechanism sounds:** the latch pin and servo at 26.57 s (797), the latch click at 26.83 s (805) and the rotor spin-up from 26.6 s (798), now under "reach a nearby hospital". Also the shutter at 31.37 s, actuator 31.5 s, contact 31.6 s, retract 32.43 s and port close 32.83 s.
7. **Narration:** confirm it is unchanged from V3. It is byte-identical, but the voice quality has not been certified by listening.
