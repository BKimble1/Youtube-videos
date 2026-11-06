# Brain Cells Playing DOOM: V2 final polish report

**File:** `exports/FGW_Brain_Cells_DOOM_V2_FINAL_REVIEW_1080x1920.mp4`. It is not published.

This is a targeted polish of V1, not a rebuild. All of the changes are in the camera path and its timing
(`source/src/story.ts`). The narration, the voice take, the art, the game script and the sound design are unchanged.
The mix was rebuilt from the same code, so the effects follow the retimed picture events.

## Measurements

From `qa/v2/render_qa.json` and `audio/mix/mix_measure_mix_v2.json`.

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, yuv420p H.264 (CRF 16, BT.709); AAC 48 kHz stereo; 75.1 MB |
| Runtime | **29.00 s (870 frames)**, the same as V1 |
| Decode | A full decode gives no errors. `blackdetect` and `freezedetect` find nothing. |
| Narration | The same master, used sample for sample. The voice-band correlation of the delivered audio with the narration master is 0.9905 at 0 ms lag (V1: 0.9904); V1 vs. V2 audio is 0.9974 (`qa/v2/narration_check.json`). Captions and the word timeline are unchanged. |
| Loudness | −14.0 LUFS integrated, true peak −1.6 dBTP. The limiter does at most 2.6 dB of reduction (V1 also 2.6). |
| Voice vs. effects | Game 14 dB under; music 19 dB under; culture 22 dB under; UI and whooshes 23–24 dB under; room 29 dB under (the same as V1 within 0.2 dB). |
| Motion, 0–5 s (hook) | Mean frame-to-frame change 9.8 (V1: 35.8). 95th percentile 21.9 (V1: 74.6). Frames above 60: 0 (V1: 16). |
| Motion, 5–23 s | Mean 15.1 (V1: 16.6). Frames above 60: 10 (V1: 15). |
| Motion, 23–29 s | Mean 24.1 (V1: 24.4). Frames above 60: 3 (V1: 5). |
| Largest single-frame changes | Every frame above V1's jump threshold (87.6) is gone: 0 (V1: 4). With V2's own lower threshold, all 13 flagged frames are planned moves (rides, scale changes); none is unplanned (`qa/v2/render_qa.json`). |
| Static | The longest near-static run is 3 frames (0.1 s). |
| Loop | Frame 869 has the frame-0 framing with no flash; frame 0 fires. The MAD of 39.9 is the muzzle flash. The audio seam differs by 0.004. |

## What changed

### Hook, 0–5 s (rebuilt camera, same picture elements)

V1 opened with a pull back through the monitor, then a dive of about 1,500× into the chip, then a stimulation close-up,
then a ride out to the decoder and a rise into the game. That made five scale changes in 3 seconds, and a zoom out
followed by a zoom in.

V2 makes one move per beat, every move eased, with no reversal inside a beat:

| Time (s) | Move | What it shows |
|---|---|---|
| 0–0.7 | One slow push (7%) toward the horned brute, decelerating | The gun fires on frame 0 and again at 0.3 s |
| 0.7–1.75 | One pure zoom out about the shared point | The game monitor, then the control software and the CL1. A lens on the living culture opens beside the CL1, with a dashed link to the chip. |
| 1.75–3.45 | The camera holds this wide frame and drifts slightly | Causal chain, all in one frame: electrode 26 is stimulated (1.45), the FIRE group answers (1.85), the amber recording travels out of the CL1 along the cable (1.95–2.4), DECODE lights FIRE (2.38), the command rises into the game (2.45–2.68), the shot lands (2.7) |
| 3.45–4.45 | One pure zoom into the game | The DECODE lamps stay in frame beneath it; FIRE decodes at 4.72 |
| 4.45–5.35 | A slight drift | Two shots (5.0 and 5.6 s), each with its own FIRE decode |

The V1 close-ups at the start (the dive into the chip, the stimulation close-up, the ride at µm scale) are gone from the
hook. The same events now play inside the wide frame, so cause and effect read in one view.

### Middle, 5–23 s (not redesigned)

The V1 path is kept, with the same framings and order. The two fastest scale changes in the film were smoothed by
retiming them inside the same narration words:

- **Microscope → chip → game (10.7–11.75 s).** The segments now run 0.50 s and 0.55 s (previously 0.46 s and 0.69 s),
  with a cubic ease in place of the quintic one. The peak zoom speed fell by about 25%.
- **Stimulation dive into the INPUT electrodes (12.15–12.95 s).** It now lasts 0.80 s (previously 0.48 s), and the
  peak zoom speed fell by about 40%. The pulse now lands on "them" (12.97 s) instead of 0.2 s before it. The
  stimulation event moved with it (12.80 → 12.93 s).

### Ending, 23–29 s (rebuilt camera)

V1 dived to the cells, pulled back to the bench, eased toward the lens, then whipped up into the game. That was two
reversals in 5 seconds.

V2 has one connected path:

| Time (s) | Move | What it shows |
|---|---|---|
| 23.45–25.05 | One pure zoom in about the chip | From the hardware into the living culture. The monitors exit upward and nothing sweeps across the frame. The network bursts land after the camera arrives (24.75 and 24.8, on "real"). |
| 25.05–25.75 | A small drift | To the FIRE electrode lead |
| 25.75–26.95 | Ride the recorded activity out | Electrode → pads → headstage → cable → PC → DECODE |
| 26.95–27.95 | Settle on the "alive" composition | The game, the software and the CL1 together, with the lens on the living culture fully in frame. The lens rings and bursts on "alive". |
| 27.95–28.9 | One pure zoom into the game | FIRE decodes, then the shot at 28.55 |
| 28.9–29.0 | Hold on the frame-0 framing | The loop's next frame is the muzzle flash at frame 0 |

There is no fade to black, no title card and no extra zoom at the end.

### Activity and sound (timing only)

These were moved to match the new camera:

- the hook stimulation (1.2 → 1.45 s), the FIRE response (1.52 → 1.85) and the second FIRE response (4.78 → 4.40);
- the ending bursts (24.05/24.85 → 24.75/24.80) and the ending FIRE response (26.25 → 25.55);
- the hook's DECODE FIRE lamp (it starts at 2.38 instead of 2.24);
- a new FIRE command pulse at 4.72, so that the 5.0 s shot has a visible decode.

`tools/export_cues.ts` re-exported `audio/cues.json`, and `tools/make_audio.py mix_v2` rebuilt the mix, so every
stimulation, burst, ride whoosh and lamp tick sits on its new frame. The game shots are unchanged.

## Accuracy

- **Encoding:** the neurons receive the game state only as encoded stimulation (the ENCODE panel, then cyan pulses).
  They never see the screen.
- **Decoding:** the software (RECORD → DECODE) turns their activity into MOVE, TURN and FIRE. The PC labels
  ("encoder + decoder", "learning algorithm") stay.
- **No claim of skill or awareness:** nothing in the picture or text suggests the cells are conscious or good at the
  game. The clumsy section is unchanged.

## QC checklist

1. **Camera:** every move is one eased segment (cubic or quintic, zero speed at both ends). There are no zoom reversals inside a beat and no punch zooms. Each push and pull in the hook and ending is a pure zoom about the point both framings share, so nothing slides sideways across the frame; the only lateral moves are short drifts and the settle at 26.95–27.95. Verified with `qa/v2/hook_0-2.5s_every_3rd_frame.png` and `strip_transitions.png`.
2. **Pacing:** a change lands every 0.3–0.75 s through the hook:
   - shots at 0 and 0.3;
   - the reveal at 0.7–1.75;
   - stimulation at 1.45;
   - the FIRE response at 1.85;
   - the recording travelling at 1.95–2.4;
   - the decode at 2.38;
   - the command at 2.45;
   - the hit at 2.7;
   - the push at 3.45;
   - the decode at 4.72;
   - shots at 5.0 and 5.6.
   
   The middle keeps V1's beat rate.
3. **Hook beats:**
   - 0–0.7: the encounter with the weapon firing, one controlled push;
   - 0.7–2: one zoom out reveals the living culture and its link to the game;
   - 2–3.5: the causal chain in one frame;
   - 3.5–5: one push back into the gameplay.
4. **Middle:** not redesigned. Spatial order and framings are the same as V1; two scale changes are smoothed.
5. **Ending:**
   - 23–25: one push to the neurons;
   - 25–27: ride the activity through the interface to the decoder;
   - 27–29: the game and the living culture together on "is alive", then FIRE and a shot.
   
   No fade to black and no final extra zoom.
6. **Loop:** the last frame matches frame 0's framing, and frame 0's shot completes the firing action (`qa/v2/loop_last22_first8.png`).
7. **Narration:** word for word, the same take, sample for sample (correlation check above). No added or replacement lines.
8. **Sound:** the same design and levels. Cue-driven effects follow the retimed events, because the cues were re-exported from the picture.
9. **Accuracy:**
   - the cells receive encoded stimulation;
   - software decodes their activity;
   - no consciousness or skill is implied.
10. **Technical:** 1080×1920, 29.00 s, clean decode, −14.0 LUFS, −1.6 dBTP. There are no black or frozen frames.

## Remaining limits

- **No real-time listen.** The sound was judged by measurement only; this environment has no playback.
- **The two signal rides are still fast.** The stimulation dive (12.15–12.95) and the ride out to the software
  (14.85–15.62) cover about 1,000× in under a second. They are the film's "powers of ten" moves and are now the
  fastest moments in it. Judge them at full speed on a phone.
- **V1's other limits still apply** (`production/V1_REPORT.md`, "Remaining limits"):
  - the illustrative game;
  - the reconstructed look of the CL1;
  - the electrode assumptions;
  - the sources, which were not read directly;
  - the caption overlaps with the monitor header.
