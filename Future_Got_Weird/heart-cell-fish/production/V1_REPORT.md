# The Fish Made From Human Heart Cells: V1 report

**Deliverable:** `exports/FGW_HEARTFISH_V1_REVIEW_1080x1920.mp4`. Not published.

- **Video:** H.264, 1080 × 1920, 60 fps, 1802 frames, 30.03 s, CRF 16, yuv420p, BT.709, about 7.8 Mb/s.
- **Audio:** AAC 48 kHz stereo.
- **Captions:** burned in, in the channel style.
- **Loop:** the film loops to frame 0.

**Viewing:** nobody has watched it in real time with sound; this environment has no playback. Every claim below is
measured from the file or from the source.

## What was built

- **Narration.** The channel narrator, ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`).
  - The locked words verbatim, with inline direction tags only: quick and intrigued on the opening, a little slower and
    clear on the final reveal.
  - One run of two takes. Both transcribe word for word in WhisperX.
  - Take 1 is used sample for sample (28.64 s, the brisker read).
  - Speech starts at 0.06 s; the gaps between sentences are the take's own (0.4–0.6 s).
- **Sync.** The locked words are force-aligned with WhisperX (wav2vec2). The schedule (`source/src/lib.ts`) names
  every shot boundary by its word, so caption timing, picture beats and sound cues share one clock at 60 fps.
- **The fish.** One 3D model after the 2022 prototype (`source/src/fish/`), 14 mm at true scale:
  - paper front and tail, a gelatin hinge, a cardiomyocyte sheet on both faces, the G-node and the clear floater fin;
  - it bends only at the hinge, with a little recoil of the front;
  - it swims by the antagonistic cycle, kept at or below about one body length per second;
  - it is drawn through any camera: side, overhead cutaway, below, or X-ray.
- **Cast.** The scientist is the crew's guesser in his lab outfit (coat, glasses, gloves), on the existing rig
  (`source/src/dc/`, unchanged). The rig's hands hold the tweezers between the digits.
- **New assets:**
  - the tank in 3D (grid floor, caustics, light shafts, motes, shadow, refraction, wake);
  - the microscope cardiomyocytes;
  - the heart, used as both the painted model and the living organ;
  - the lab set: window, clock, glass tank, heart model on a stand, work mat.
- **Sound** (`tools/make_audio.py`, synthesised):
  - **Placement:** every event is exported from the shots' own timing (`tools/export_cues.ts`, 104 events).
  - **Fish and bench:** tail strokes, the contraction thumps, the stretch creak, the trigger tick, the tweezers' click.
  - **Lab, cells and heart:** the cells' pulse, the time-lapse nights, the pipette, the heart's lub-dub.
  - **Camera:** whooshes on the camera moves.
  - **Ambience:** four kinds, cut with the picture.
  - **Music:** a restrained bed (a soft pad and a sparse pluck), 12 bars fitted to the film so it loops.

Shot by shot: `production/SHOTS_AND_TRANSITIONS.md`. Science, sources and simplifications: `production/SCIENCE_NOTES.md`.

## Measurements (from the delivered file; `qa/qa.json`)

| Check | Result |
|---|---|
| Format | 1080 × 1920, 60/1 fps, 1802 frames, 30.04 s container, h264 yuv420p bt709, AAC 48 kHz stereo, no decode errors |
| Speech | WhisperX (small.en) on the MP4's own audio: **WER 0.0** against the locked narration; speech from 0.03 s |
| Mix | −14.0 LUFS integrated, −1.5 dBTP (4× oversampled), limiter at most 2.65 dB. Voice sample-aligned to the master (lag 0). Effects 19.3 dB and music 20.7 dB under the voice. Loop seam jump 0.0007. (`audio/mix/mix_measure_mix.json`) |
| Motion | Median frame step 1.61. Every step above 30 is a planned cut or deliberate fast move: the match cut at 4.77 s, the pull-back to the scientist (5.32–5.47 s), the zooms into and out of the cells (6.10, 7.15–7.20 s), the cut to the time-lapse (19.55 s), the cut to the living heart (26.98–27.02 s) and the heart-to-fish match (28.50 s). |
| Stillness | The longest near-static run is 1.25 s (21.82 s): the locked-off time-lapse while the small fish crosses. No other run is longer. |
| Loop | Last frame against frame 0: 3.12, about two median steps. The last frame is one frame before frame 0 on a moving pull-back, so this is the size of one step of that move. Frames: `qa/loop_last_first.png`. |
| Text | 21 captions; no em dash or en dash in any displayed text |
| Transitions | Frame bursts around every shot change: `qa/bursts/`. Phone-size sheet: `qa/phone_sheet_every1s.png`. |

## Review passes and what they changed

1. **Shot by shot, while building** (contact sheets of separately rendered stills, `source/stills.mjs`):
   - The low follow (shot 9) was too far and seen from directly behind; it is now closer and three-quarter from below.
   - Swirls near the lens ballooned; they are now capped.
   - The scientist's hands covered his face; the held fish moved out in front of him.
   - The time-lapse framing was a thin strip. The tank interior is now drawn in 3D from the lab camera, so the
     time-lapse plays through the glass and the pull-out leaves through it in one move.
   - The time-lapse fish never entered frame: a word lookup took the first "actually", not the second.
   - The living heart sat on the model's stand; it now cuts to a dark field.
   - The final push landed on a coronary groove; it now lands on the left-ventricle wall, rolled so the fibres lie level.
   - Stretched-side paling was strong enough to flicker on every stroke; it was reduced.
2. **Pacing:**
   - The rise to overhead was brought forward so both sheets show on "both sides".
   - Shot 7 pushes in on the stretched side, so the overhead cutaway changes framing every 1–2 s, not once in 6 s.
3. **First full render** (frame bursts, motion scan, ASR):
   - The wall clock sat behind the captions during the pan; it moved up the wall.
   - The heart-to-fish match was loose; it was tightened (a deeper push into pure ventricle wall, the fish's sheet
     filling the frame, heart flecks matched to the fish's).
   - The film was re-rendered.
4. **Final file:** a muted pass at phone size, plus the measurements above.

## Known limits (next pass)

1. **The match cut's colour.** At 28.50 s the fish's muscle sheet reads a little pinker and lighter than the heart's
   wall. It is the same family of red with the same level fibres, but not an exact colour match.
2. **The time-lapse fish is small** (about 200 px long on a 1080 px frame) so the speed reads at true scale. The
   tissue's colour change reads; its thickening is subtle at this size.
3. **"It doesn't even need a motor."** The film shows the absence: the body turns to glass with only the two sheets.
   Nothing contrasts it with a motor.
4. **The low follow (shot 9)** seen from below shows the sheets in shadow and slightly pale between strokes.
5. **The assembly (shot 3)** is a simplification (a tail piece docking with tweezers), and the fish is 14 mm, so in the
   wide frame it is a small pale shape at the tweezers' tip. That is deliberate (scale), but easy to miss.
6. **The Harvard press page** could not be reached from this environment. The science is checked against the paper
   (the PMC author manuscript), not the press release.
7. **Sound** was chosen by measurement, not by ear: levels, placement and loudness are verified, taste is not.
