# Lightning Laser V2: QA report

File: `exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4`. Every check below reads the rendered file itself, not the
source. **Not published.**

This environment has no display or speakers, so nobody has watched the video in real time with sound. Playback was
checked through four stand-ins:
- frame strips taken from the MP4;
- contact sheets;
- a frame-difference motion scan;
- two speech recognisers run on the file's own audio.

## File (`qa/v2/FGW_Lightning_Laser_V2_REVIEW_qa.json`)

| Check | Result |
|---|---|
| Resolution (measured from the stream, not the filename) | **1080 × 1920**, H.264 High, yuv420p, BT.709 |
| Frame rate / frames | **30/1**, 1005 frames counted (33.50 s of picture; container 33.515 s including AAC padding) |
| Loudness | −14.0 LUFS integrated, LRA 2.8 LU, true peak −1.6 dBFS |
| Black segments / freezes ≥ 0.5 s | none / none |
| Audio vs the mix (`source/public/audio/mix_v2.wav`) | 0.0 ms lag |
| Loop seam | last→first frame change 3.07, against 1.1–2.6 for the last five frames. The leader, rain and drift continue on one clock, and the 3× loop file plays it twice in a row. |
| Size | 32 MB |

## Narration (`qa/v2/FGW_Lightning_Laser_V2_REVIEW_asr.json`)

- **Same voice file as V1**, gain only: the voice stem correlates 1.000000 with the source (`audio/mix/mix_v2_measure.json`).
- **whisper-base.en: WER 0.000** against the locked script.
- **zipformer: WER 0.020.** The only differences are two "laser" → "lazer" spellings.
- **Voice over the rest:** +24.3 dB in the phone band while speech is active.

## Frame-level review (strips in `qa/v2/strips/`, from the MP4)

| Range | Strip | Checked | Result |
|---|---|---|---|
| 2.5–4.1 s | `op.png` (every 2nd frame) | Operator reach, contact and press, then the restrike | Her hand travels to the ARM cap and the index tip lands on it. The cap depresses, then the LEDs ramp and the gauge swings. The arm stays above the panel face, and the desk sits in front of her torso. Her face is lit at 3.53 and 3.83 and the glasses flash. No intersections found. |
| 4.1–6.5 s | `vig.png` (every 3rd frame) | Stance, strike, skeleton, jolt, rise | Feet are planted and the legs never cross. Arms hang beside the thighs before the strike. The skeleton frames sit inside the same outline (skull in the head, bones along the limbs). The jolt is one move, then a settle. The camera tilts past his head and dissolves into the air view, with no blank frames. |
| 0–2.6 s | `hook.png` | Hook | Leader with branches and a white core at the open. The telescope is revealed at 0.95 s, then the wide connection flash lights the cloud base at 1.75 s. |
| 7.7–11.5 s | `fire.png` | Firing sequence | FIRE press, then the enclosure cutaway (packets, flaring amplifier, mirror and duct), the exit window in the rain with the tilt up, the mast-side pickup of one packet, and the push into its glow. Then M2 opens on the packet. |
| 11.3–19.3 s | `micro.png` | Molecular scenes | Four different compositions (race, close-up, column, leader). The hand-off to the 3D channel matches on lean and colour. |
| 19–25.7 s | `tower.png` | Tower | The dolly-out reaches a wide establishing view by 20.2 s. The low angle beneath the tower shows the leader climbing. Then the side view and connection, and the wide view with the bracket on the guided section only. |
| 25.5–31 s | `rod.png` | Rod comparison | The distant strike is behind the hills, not near the house. The bracket runs from the ridge to the tip. The tip ends at the R3 tower-tip screen point (matched cut). |
| 30.5–33.5 s, 32.9–33.49 s, 0–0.6 s | `end.png`, `seam.png`, `open.png` | Ending and loop | Low telescope view, then the field building at the tip and the new leader climbing into frame 0. |

The QA rounds found and fixed these:
- **T1:** it never reached a wide view. It now pulls back to a wide establishing view.
- **T2:** the leader wasn't visible because the extreme low angle compressed the bolt into the vanishing point. The camera was raised and pulled back.
- **M2 and M5:** they tracked at about 30 px per frame across a dense field. The tracking speeds were halved (M2 now about 16 mean change per frame).
- **Close pulses:** packets passing near the lens were smeared into large capsules. They are now faded out.
- **F4:** it panned downward, away from the beam. It now follows one packet upward.

## Motion scan (`qa/v2/motion_scan_v2.json`)

- Mean frame change is 6.19.
- The spikes sit at the planned cuts and at the flashes: the connections at 1.75 s and 21.85 s, the restrike at 3.53 s, and the strike at 4.52–4.57 s.
- No random shakes or zooms.
- The sustained high values belong to motivated moves: the M4 pull-back, and M5's tracking and pull-out (about 20–28).

## Known limitations and judgement calls

- **No real-time playback with speakers here.** Please watch the review, and the 3× loop file `qa/v2/FGW_Lightning_Laser_V2_REVIEW_loop_x3.mp4`, at full speed with sound.
- **F2 and F3 are 0.72 s each.** That's the caption's length. Both read in the strips, but they are quick.
- **Pulse rate.** The drawn rate is about 9 per second. The real 1,000 per second can't be shown at 30 fps, and the narration states the real figure.
- **Clouds.** The 3D views use the same blurred-puff cloud deck as before. They read as layered storm cloud, but they are stylised.
- **Rod scene.** Nothing marks a protected zone. The scene only shows the rod's metal ends at its tip, and it doesn't show a strike near the house.
- **4K master.** No 2160 × 3840 master was rendered for V2 (`./tools/build_all_v2.sh master` makes one).
