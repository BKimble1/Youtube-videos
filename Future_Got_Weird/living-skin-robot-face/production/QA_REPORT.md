# QA report: This Robot Is Wearing Living Human Skin

Results are in `qa/final_review_qa.json` and `qa/final_master_qa.json`. The images in `qa/` are:
- `final_*_phone_ui_sheet.png`: 28 frames at 360×640 under an approximate Shorts UI mask;
- `strips/all_cuts.png`: ±3 frames around all 15 cuts;
- `review_v1_*`: the first review cut, kept for comparison.

## Measured on the rendered files (both pass)

**Container.**
- 1080×1920 and 2160×3840.
- 30/1 fps, 816 frames, 27.200 s.
- yuv420p, BT.709 tags, H.264 High.
- AAC 48 kHz stereo, ~317 kb/s.
- A keyframe every 0.5 s.

**Loudness (ffmpeg ebur128 on the MP4).**
- −14.5 LUFS integrated, true peak −2.4 dBTP, LRA 6.0 LU.
- In the phone band (400 Hz–5 kHz) the voice is 15.4 dB above music and effects during speech.

**Picture checks.**
- blackdetect: no black segments.
- freezedetect: nothing frozen for 1 s or more.

**Sync.**
- The MP4 audio cross-correlates with the mix at 0.0 ms offset (r = 0.99972).

**Words.**
- Whisper base.en on the MP4's own audio track returns the locked narration exactly, all 76 words in order.
- Each of the 21 caption windows was transcribed separately: 19 match.
- The two misses are short-window recognition errors, and the full transcript has both phrases correct:
  - "This robot skin is a-" for "This robot's skin";
  - "Get stranger" for "gets stranger".

**Loop seam.**
- The last→first frame step is 0.84 (mean absolute luma difference, caption band excluded), against 0.79–0.92 for
  normal frame steps.
- The only other change at the seam is the first caption returning with the voice.
- The smile phase, camera (position and velocity), yaw and lighting are continuous.
- The motor-tug sound spans the seam.
- The audio sample step at the seam is 0.006, against a 0.007 median step.

## Inspected by me (still frames of the actual render)

- 3 fps contact sheets of the whole cut.
- Frame strips across every cut.
- Phone-size frames under the UI mask.
- Full-resolution frames at the dive, the pull-back, the repair and the cover.

**Defects found and fixed before the final export:**
- The opening was mis-framed: the mouth corner sat at the frame edge.
- The section window and the pinpoint were too small at phone size.
- The motor positions disagreed between the front view and the cross-section; the motors are now behind the block
  in both.
- The pull deformation was too subtle to read.
- The silicone layer separated from the base while being pulled.
- One cue used the wrong occurrence of "skin", so the closing section cut landed 11 s early.
- The wound-contraction field flipped sign at the wound centre, tearing cells into rectangles.
- There was a visible seam between the two tissue bands in the repair view.
- A migrating cell was squeezed needle-thin.
- The integrated patch outline floated above the finger.
- The matched pull-back jumped about 35° on the cut. Cause: it matched against deformed tissue; it now matches
  relaxed tissue.
- Collagen fibres and nucleoli vanished after that cut. Cause: stroke scale was sampled at a compressed crease; it is
  now sampled locally.
- The pull-back started at full speed; it now accelerates.
- The loudness meter read mono instead of the delivered stereo, so the first master measured −11.9 LUFS. It is now
  −14.5.
- The finger was too small and clipped at the frame edge.
- "DAY 0 →" was too small to read at phone size.

**Accuracy checks on the picture:**
- Mouth: one crease and two anchor sites stay attached through every deformation. The smile is a single
  displacement field, so pores, folds, sheen and the window all move together.
- No teeth, lips, blinking eyes, living facial muscles or blood vessels.
- The incision has no blood.
- The patch is a translucent sheet laid on by tweezers, not a magic effect.
- The repair has intermediate days. At DAY 7 the graft is still visible.
- The face is never cut or repaired.

## Not done / open items (please read)

1. **Not listened to and not watched in real time.** This environment has no audio or video output. Voice quality,
   effect character and the music's mood are verified only by measurement (ASR, loudness, phone-band masking). The
   take was chosen by measured stress, not by ear. A headphone and phone-speaker listen is still needed.
2. **The source pages could not be opened.** The network policy blocked the University of Tokyo, doi.org, Crossref
   and NCBI hosts. Facts were checked through search-result summaries of the papers, the preprint, the Matter
   commentary and news coverage. Before publishing, confirm against the press-release PDF:
   - the actuator type ("motors");
   - the appearance of the smiling setup.
3. **No experiment footage is used.** No media licence could be reviewed. Everything is original illustration and is
   labelled as such.
4. **Runtime is 27.2 s, not 28–31 s** (see README): the locked words at the requested pace are 25.8 s of speech.
5. **Tone cross-over frames.** During the two dives, 2–3 frames pass through a muddy mid-tone while the palette moves
   from warm tissue to teal. They go by at the fastest point of the zoom.
6. **Face appearance.** The prototype is drawn from the brief's description and the coverage summaries, not traced
   from the press figures, which could not be opened. It is deliberately simple; compare it with the real photo.

No claims are made about click-through, retention or views.
