# Dead Spider V5: micro-finalization notes

V5 is a conservative pass on V4. The source is `source/src/v5/`, a copy of `v4/` with small targeted changes, and the
composition is `DeadSpiderV5`. The output is `exports/FGW_Dead_Spider_V5_FINAL_1080x1920.mp4`.

**Unchanged:**
- the narration (the approved V2 WAV, sample for sample; stem correlation 1.000);
- caption text and timing;
- the runtime of 30.200 s;
- the opening, the explanation scenes and the spider design.

## Changes

1. **The final pickup (26–30 s).**
   - **Distinct bodies.** The second dead spider is now a pale, sandy-grey individual. Before, it was a slightly paler
     brown that merged with the dark-brown gripper. The two bodies now separate clearly on a phone screen.
   - **The grab and lift view.** It moved from a 24° high angle at 52 mm to a low three-quarter at 10°, 38 mm. The
     dark gripper reads above, the pale spider inside its curled legs, and a visible gap with its own shadow on the
     mat once it lifts.
   - **Timing.** The lift now starts at 28.9 s, after all eight legs touch the second spider at 28.73–28.78 s. It
     leaves the mat at 28.99 s and reaches full height at 29.55 s. The completed lift then holds for about 0.65 s as
     the camera rises slightly.
   - **The last frame.** The needle runs straight down the frame onto the pair over the dark mat, echoing frame 0. It
     no longer uses frame 0's top-down angle, because from there the two spiders read as one pile.
2. **Captions in the Shorts safe area.**
   - The caption box is narrowed to x 110–870, clear of the right-hand action buttons.
   - Bottom captions are centred at y 1500 (one line) or 1470 (two lines), clear of the title and channel band. Before,
     they were centred at y 1540 in a full-width box.
   - Two explanation captions sit at the top (y 380–400) so they do not cover the leg on the leaf.
   - The text, timing and style are unchanged.
3. **Sound.** The V4 mix with cue times updated for the new lift (`tools/make_audio_v5.py`, `audio/cues_v5.json`):
   77 restrained effects, −15.0 LUFS, true peak −2.9 dBTP.

## QA (on the exported file; `qa/v5/`)

**File.** Native 1080×1920 render from the vector source (not an upscale), 30 fps, 906 frames, 30.200 s, H.264 High
CRF 14, yuv420p bt709; AAC 48 kHz stereo, 320 kb/s.

**Audio and transcript.**
- No black frames.
- Transcript: Zipformer and Whisper each have WER 0.011. The only difference is "they'd" heard as "they", as in the
  approved take.

**Contact and lift.**
- All eight legs touch the block (21.71–21.76 s) before it lifts.
- All eight legs touch the second spider (28.73–28.78 s) before it lifts.

**Frame change.** Every jump over the threshold is on a planned cut or inside a continuous camera move. The largest
inside a move is 33.9, in the 0.5 s ride down the needle at 21.1 s.

**Captions.** They clear every tracked action point, apart from transients of 1–8 frames during camera moves
(`caption_check.json`).

**Frame pages.**
- `first4s_*`: every frame of the opening;
- `final_grab_784`: every frame of the payoff;
- `payoff_full.png`: full-size key frames;
- `every10th.png`;
- `loop_first_last.png`.

**Loop.** The first-to-last frame difference is 53.5, against 22.6 in V4: the final angle was changed for readability.
The link back to the opening is compositional: the needle straight down the frame, a dark mat, and a spider at the
centre.

**Not done.** Nobody has watched or listened in real time. This environment has no display or speakers.
