# Brain Cells Playing DOOM: V1 review report

**File:** `exports/FGW_Brain_Cells_DOOM_V1_REVIEW_1080x1920.mp4`. It is a review cut and not publish-ready (see
"Remaining limits").

## Measurements

From `qa/v1/render_qa.json` and `qa/v1/final_asr.json`.

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, yuv420p H.264 (CRF 16, BT.709); AAC 48 kHz stereo; 91.5 MB |
| Runtime | **29.00 s exactly (870 frames)**. Speech runs 0.00–28.03 s. |
| Decode | A full decode gives no errors. |
| Narration | Transcribed from the delivered MP4's own audio. Whisper base.en WER **0.000**. Zipformer WER 0.024, all spellings ("neurans", "fidio"), no wrong words. |
| Loudness | −14.01 LUFS integrated, true peak −1.59 dBTP. The limiter does at most 2.6 dB of gain reduction. |
| Voice vs. effects | Game 14 dB under; music 19 dB under; culture 22 dB under; UI and whooshes 23–24 dB under; room 29 dB under. Everything ducks under the words. |
| Motion | The longest near-static run is 3 frames (0.1 s). |
| Large frame changes | 4, all planned (the push into the chip, the two rides, the pull out of the chip). None is unplanned. |
| Loop | Frame 869 → 0 has the same framing, the same enemy and the same corridor. The shot lands on frame 0. The MAD of 39.9 is the muzzle flash. |
| Hidden game cuts | At 9.0 and 24.0 s, the game screen's area on the frame is 0 for ±0.1 s (`tools/export_cues.ts`). |

## Narration

The locked text is used verbatim: ElevenLabs Test Voice, `eleven_v4`, one run of two takes. Take 2 is used sample for
sample, with no edits. Provenance is in `audio/narration/voice_provenance.json`.

## Scenes

- **0–1.2 s, the hook.**
  - Frame 0: the gun fires point-blank at a horned brute in a brick corridor.
  - A second shot follows at 0.3 s, then the camera pulls back through the monitor.
  - Below the monitor: the control-software monitor, then the white CL1 with pink media bottles.
  - The camera then dives into its lid: headstage → MEA carrier with contact pads → well of pink medium → gold
    electrode grid → a mat of living neurons.
- **1.2–3.0 s.**
  - Electrode 26 is stimulated (cyan pulses arrive along its lead; rings spread).
  - Distinct neurons fire, and a volley hits the FIRE electrodes.
  - The camera rides the amber recording out through the pads, headstage, cable and PC to the DECODE panel, where FIRE
    lights.
  - The command rides up into the game and the enemy goes down.
- **3.0–5.0 s.**
  - A two-shot of game, software and CL1, with a lens on the living culture beside the CL1: one composition, joined by
    cables.
  - The game turns (TURN lights). The encoder sends a cyan pulse down the cable into the chip, and the FIRE group
    answers on "shoot".
- **5–7.6 s, "Scientists actually did it".** A continuous pull-back from the cells out to the whole lab: the bench,
  wall cabinets, shelves of glassware, the PC tower, the game running. A label reads "CL1 biological computer".
- **7.6–9.4 s, "not inside someone's head".** A push into the CL1's clear enclosure, with labels for the nutrient
  medium, the pump and the 37 °C temperature.
- **9.4–11.1 s, "growing on a chip".**
  - A microscope iris and focus pull into a phase-contrast view of neurons on the electrodes.
  - A cross-section slides in beneath, aligned to the electrodes on a cut line: neurons on electrodes on a glass chip.
- **11.1–19.3 s, the loop.**
  - Up to the game, where an enemy enters on the left.
  - The ENCODE panel reads "enemy LEFT" and shows the stimulation pattern.
  - Ride cyan into the INPUT electrodes. Out to the whole array, with INPUT, MOVE, TURN and FIRE outlined.
  - Volleys in each group on "fire back".
  - Ride amber to the RECORD raster and DECODE panel, then both screens. MOVE, TURN and FIRE light on the words, and
    the game steps, turns and shoots.
- **19.3–23.4 s, the reality check.**
  - A push to the game, which plays the reality check for laughs: a wild turn past the target, two shots into the
    wall, an enemy from the right, a slow wrong-way turn, the player is hit, an overshooting shot misses, then a kill.
  - On "normal computer" the camera pulls back to the hardware. The PC is labelled "runs the game", "encoder +
    decoder" and "learning algorithm"; the CL1 is labelled "living neurons".
- **23.4–25.9 s, "the weirdest part is real".** A dive to a close-up of the culture, with network bursts on "real".
- **25.9–29.0 s, "This video game controller is alive".**
  - A pull-out to the bench, with the lens on the culture and gameplay running.
  - On "alive" the camera eases toward the lens, which grows, rings in amber and fills with a burst of firing.
  - FIRE decodes, the camera whips up into the game (a shot at 28.55), and the film lands on the frame-0 framing.

## Significant transitions

All transitions are continuous camera moves through one world; the full list with verdicts is in
`production/TRANSITIONS.md`.

- **Muzzle flash → monitor pull-back** (0.25 s).
- **Monitor → CL1 → chip → culture,** one dive of about 1,500× (0.72–1.20 s).
- **Stimulation in and recording out are rides along the real signal path,** from the electrode lead to the carrier
  pad, the headstage, the cable, the PC and the screen. The camera's width tracks the token's distance from its
  start or target, so every frame of a ride shows where the signal is.
- **The decoder → game handoff** is a command pulse rising from the lit lamp into the game.
- **The final whip** goes into the frame-0 framing (28.05–28.9 s).

## Review passes

- **Frame-stepped** every 3rd frame of the hook (`qa/v1/hook_0-2.5s_every_3rd_frame.png`), around every large change
  (`qa/v1/strips_jumps.png`) and at sixteen more transitions (`qa/v1/strip_transitions.png`). There are no one-frame
  resets, detached objects or wrong-way zoom reversals.
- **Captions** were checked in every phrase at three points each (`qa/v1/caption_check.png`). They sit in screen
  space at y = 300.
  - Moving the "inside someone's head" phrase to the lower band covered the CL1's touchscreen and labels, so it was
    reverted.
- **Phone-size contact sheet** (`qa/v1/contact_every_0.5s.png`): the decoder words, the group labels and the "alive"
  lens read at thumbnail size.
- **Loop:** `qa/v1/strip_loop_seam.png` and `loop_seam_last3_first3.png`.
- **Not done:** a real-time audio listen. This environment has no playback. The sound was judged by measurement
  (levels, ducking, ASR) only.

## Changes made during this pass (after the first render)

1. **Signal rides.** The camera width now scales with the distance along the route, so the cable, the PC and the CL1
   stay legible. Before, the middle of each ride was a blurred close-up of tubes and vent holes.
2. **Hook dive.** It is slower at its peak: it now takes 0.48 s (previously 0.40 s), on a cubic ease.
3. **The tech-room enemy.** It now enters inside the view, and the ENCODE panel no longer reads an enemy hidden in an
   alcove.
4. **Decoder framing.** It now includes the RECORD raster.
5. **The ride out to the software.** It is shortened.
6. **"Alive".** The lens is larger and the camera moves to it.
7. **Wall props.** They are brought into the wide shot.
8. **Mix.** The music and neuron layers are up 2 dB.

## Remaining limits (factual and visual)

- **The gameplay is an original illustrative recreation,** not DOOM or Freedoom art and not the experiment's footage.
  - The bezel says so in small print ("illustrative recreation · not experiment footage"). It reads in the wide and
    two-shots, but is tiny on a phone.
  - Consider a clearer on-screen note for the clumsy section before publishing.
- **The CL1's look is an informed reconstruction** (white, shoebox-sized, clear enclosure, life support inside). No
  dimensions or official drawing were found. The touchscreen placement and the internal layout are ours.
- **Some electrode details are assumptions:**
  - the mapping of channel to physical position;
  - the 200 µm pitch and 30 µm electrodes;
  - which nine electrodes encode.
  
  The electrode groups for MOVE, TURN and FIRE come from the public demo code.
- **Two simplifications in the picture:**
  - Activity is slowed for visibility (real spikes last about 1 ms; the loop runs at 10 Hz).
  - Neuron density is reduced (about 400 per mm² are drawn).
- **The separate PC is an assumption.** The film shows the decoder and learning software on a separate PC. The demo's
  exact hardware arrangement wasn't documented in the sources reached, and the CL1 can compute on its own.
- **The sources weren't read directly.** Scientific American, Smithsonian and the Cortical Labs pages were blocked by
  this environment's network policy, so their facts came through search summaries and the demo code. Re-check the
  numbers (about 200,000 neurons) and the claims against the articles before publishing.
- **Fast moves.** The hook's dive and rides are fast by design: about 2× zoom per frame at the peak. That is legible
  frame by frame, but it should be judged at full speed on a phone.
- **Caption overlaps.** At y = 300, some phrases cross the control monitor's header text (2.2–2.55, 8.4–9.3, 11.4–12.3
  and 15.6–16.4 s). The active lamps and the "LEFT" readout are never covered.
- **The sound has not been listened to** in real time.
- **The partial MP4.** The first push contained a partial MP4 that was committed while still encoding. A history
  rewrite to remove it was blocked, so the blob remains in this branch's history (about 66 MB).
