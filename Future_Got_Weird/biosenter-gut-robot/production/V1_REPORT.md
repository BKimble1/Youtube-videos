# BIOSENTER Gut Robot: V1 production report

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V1_REVIEW_1080x1920.mp4`. This is a review cut and is not
published.

- **Video:** 1080×1920, 30 fps, 789 frames (26.30 s), H.264 CRF 16, yuv420p, BT.709.
- **Audio:** AAC, 48 kHz stereo.
- **Full-resolution output:** the review MP4 is the native-resolution output. No 4K master was made for V1.

## What was built

- **Narration.** The locked words, verbatim, in the channel voice: ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`,
  `eleven_v4`, inline tags only. There was one run of two takes. Take 1 was chosen on measured emphasis ("spikes" +13
  semitones; a beat between "SIX" and "FEET"; a rising "crawling through it"). It is used untouched, and speech starts
  on frame 0.
  - **Length.** The natural read is 25.4 s, so the film is 26.3 s, shorter than the brief's 29–34 s estimate, because
    the brief says not to stretch it.
  - **Check.** On the delivered MP4's own audio, Whisper has a WER of 0.000. Zipformer has 0.026: its spelling
    "travelled" and one inserted "if", most likely an effect heard as a syllable.
  - **Records.** `audio/narration/voice_provenance.json`, with word times in `word_timings.csv` and
    `source/src/data/timeline.json`.
- **One 3D world, drawn as vector SVG.** It uses the house 3D-projection approach from Eel Escape V4 (`core/three.ts`).
  Every shot projects the same models through its own camera.
  - **The robot (`robot/geom.ts`, `robot/state.ts`).** One canonical body plan: tail cap and tether, a tail anchor
    with a kirigami sleeve, a collar, a four-chamber extender, a collar, a head anchor, and a head cap with the central
    channel and lens.
    - **Shading.** Smooth gradient bands, with navy ink contours whose visibility comes from an exact self-occlusion
      test.
    - **Kirigami flaps.** 2 × 96 flaps hinge out of the sleeve past 60% inflation, with a spring overshoot.
    - **Steering.** The chambers on the outside of a bend glow harder.
  - **The crawl.** One deterministic schedule in world time drives S7, S1, S2 and S3. S7 is the crawl just before frame
    0, so the loop is continuous by construction. The tail moves only while the body contracts, and the head only while
    it extends.
  - **The gut (`world/gut.ts`).** A half-pipe cutaway with irregular circular folds, wet glints, and layered cut faces
    (mucosa with villi, submucosa, two muscle layers, serosa). The wall is pushed out wherever an anchor presses it,
    the villi lean under traction, and neighbouring loops pack the cavity with true parallax.
- **Shots.**

  | Shot | Time (s) | What it shows |
  |---|---|---|
  | S1 | 0–3.5 | Alongside the crawl, ahead of the head. It pushes in on the head anchor. |
  | S2 | 3.5–6.85 | The macro: the flat sleeve, the balloon swelling, the scales popping on "pop" (5.38 s), the wall giving. |
  | S3 | 6.85–11.55 | A continuous pull-back to the cutaway through one full cycle into a bend. |
  | S4 | 11.55–16.83 | A zoom-out that hands the 3D tunnel to a 2D pig diagram at matched place, width and angle. The robot travels a highlighted stretch with one tick per foot, and "6+ FEET" lands on "FEET". |
  | S5 | 16.83–19.45 | Biopsy forceps bite a tiny sample, which leaves a notch; then a needle releases a small, local dye bloom. |
  | S6 | 19.45–21.15 | The same robot in a clear test tube on a lab bench, tethered to a four-line pneumatic controller, still moving. |
  | S7 | 21.15–26.3 | Back in the tunnel; it crawls on into frame 0. |

- **Sound (`tools/make_audio.py`).** Everything is synthesised and placed from the picture's own exported event times
  (`audio/cues.json`), 61 events in all.
  - **Effects:** pneumatic inflation with a rubber creak, release hisses, extension flow, wet contraction slides, the
    kirigami click ripples (the macro pop is the accent), a zoom whoosh, foot ticks, the "6+ FEET" impact, forceps and
    needle sounds, a fluid bloop, and a controller beep.
  - **Ambience:** gut, diagram and lab beds, cut with the picture.
  - **Music:** an original loop of 11 bars of 4/4 in D minor over the exact film length, with pad, pulse bass and
    sparse plucks.
  - **Master chain:** the channel's (voice compressor, voice-keyed ducking, circular true-peak limiter).
  - **Measurements:** −14.01 LUFS, −1.6 dBTP, effects 18 dB and music 16.4 dB under the voice, and a seamless loop.
    Stems are in `audio/mix/stems/`.
- **Captions.** The channel treatment (Nunito Black, white, key words in yellow), in screen space. Their height is
  chosen per shot, and `tools/keepout.ts` verifies them on every frame: the caption never covers more than 4% of the
  shot's focal moving part, and in practice it covers 0%. The whole robot is never more than 15% covered (the worst
  frame is 9.2%, during the S1 push-in).

## QA performed on the rendered file (not just the code)

All evidence is in `qa/v1/`.

- **`render_qa.json`.** All 789 frames decode with no errors. There are no unplanned large frame changes: the only
  ones are the 4 planned cuts, the planned pull-back and zoom, and the scale pops. The loop seam's frame difference is
  4.4, against a median of 2.2.
- **Frame sheets.**
  - `contact_every_0.5s.png`: the whole film.
  - `hook_0-2.5s_every_3rd_frame.png`: the hook.
  - `loop_last22_first8.png`: the loop.
  - `cut_and_pop_final.png`: frame-stepped through the S1 → S2 cut and the macro pop.
  - `cuts_S5_S6_S7.png`: the S4 → S5, S5 → S6 and S6 → S7 cuts, frame-stepped (from the render before the S1 → S2 cut fix; these cuts are unchanged).
- **`final_asr.json`.** The narration transcribed from the MP4's own audio (see above).
- **`keepout.txt`.** The caption check: it passes.

**Defects found in review and fixed before this render:**

- The captions covered the robot in S1, S3 and S5. The framing was changed and the per-shot caption zones added.
- The steering bend in S5 pushed the head through the wall line. The bend was reduced and the shot reframed.
- The S5 shot was diagonal. The camera now rolls to the gut's heading.
- The biopsy notch showed a black speck. It is now filled with raw tissue.
- The contact shadow ran past the tip.
- A stray X-shaped contour came from the chamber lobes. The contours are now chosen robustly.
- Contours drew over domes that hid them. Ink now uses an occlusion test.
- One frame at the S1 → S2 cut kept the previous caption at the top. The cut moved to 3.50 s.
- The scales seen edge-on read as thin needles. They now keep the sleeve's thickness and draw above the outline.

**Not done.** There was no real-time listening, because this environment has no audio playback. The sound was judged
by measurement (levels, ASR, event logs) only.

## Known limitations and remaining issues

1. **The science sources were not re-checked.** news.mit.edu and doi.org are blocked in this environment. The facts
   follow the brief. See `production/SCIENCE_NOTES.md` for the checklist line to finish before publishing.
2. **The runtime is 26.3 s**, under the 29–34 s estimate, because the natural voiceover is 25.4 s.
3. **A 1.1 s near-static hold** at 15.7–16.8 s: the pig diagram after "6+ FEET". The robot's glyph inches in place, and
   there is a slow push.
4. **The macro's first 0.7 s** (3.5–4.2 s) shows the flat sleeve sliding at the frame's left edge before the balloon
   swells into frame.
5. **The pig glyph is small** at full-pig scale (it has a halo). The trail and ticks are thin on a phone.
6. **Fine banding** can show along the fold flanks in the closest wall views.
7. **The tunnel rims** (the cut faces) read as pale stripes along the trench in S1 and S7.

## Exact commands

```
python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
# ASR models (k2-fsa GitHub releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26, sherpa-onnx-whisper-base.en -> /tmp/asr
(cd source && npm ci)
python3 tools/make_narration.py                       # take -> master, word timeline, captions, SRT
npx --prefix source esbuild tools/export_cues.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/c.js && node /tmp/c.js audio/cues.json
python3 tools/make_audio.py mix_v1                    # effects + music + master -> source/public/audio/mix_v1.wav
npx --prefix source esbuild tools/keepout.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/k.js && node /tmp/k.js
tools/render_resilient.sh mix_v1 exports/FGW_BIOSENTER_GUT_ROBOT_V1_REVIEW_1080x1920.mp4
python3 tools/qa_render.py exports/FGW_BIOSENTER_GUT_ROBOT_V1_REVIEW_1080x1920.mp4 qa/v1
```

The render is equivalent to a single Remotion command, with the same frames and x264 settings:

```
cd source && npx remotion render src/index.ts BiosenterV1 ../exports/FGW_BIOSENTER_GUT_ROBOT_V1_REVIEW_1080x1920.mp4 \
  --props='{"audio":"mix_v1","captions":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p \
  --color-space=bt709 --audio-codec=aac --audio-bitrate=320k
```

**Working stills:** `cd source && ./sheet.sh out.png "f1,f2,..." [cols]`.

## Proposed V2 improvements (from the actual render)

1. **Science pass.** Match the kirigami cut pattern, scale count, chamber layout and tool geometry to the paper's
   figures once it can be read.
2. **The macro's opening.** Start the S2 macro already framed on the whole anchor (or slide it in from frame centre),
   so 3.5–4.2 s isn't half-empty. Consider a small shift of the light over the sleeve as it stretches, to sell the
   cut pattern opening.
3. **The scales in profile.** Model each flap with real thickness (a short prism), so it reads as a scale from every
   angle, and add a contact shadow where the tips meet the mucus.
4. **The pig beat.** Make the glyph and trail larger, follow the robot with a gentle push along the coil, and fill
   the 1.1 s hold (for example, the highlighted stretch pulses once as "6+ FEET" lands).
5. **The tunnel finish.** Darken and soften the rim cut faces in S1 and S7 (or hide them behind foreground tissue
   silhouettes), give the neighbouring loops fold texture and a soft blur by depth, and add a few drifting particles
   for parallax.
6. **The tools.** Frame the tool action larger (the cups and the needle are small on a phone), and give the dye a
   brief visible stream before it blooms.
7. **Runtime.** If the 29–34 s target matters, approve a slower read or added pauses in the narration. The picture
   would then gain beats rather than stretched shots.
8. **Sound.** Do a listening pass on real speakers and phones (the levels are measured, not heard). Consider a
   distinctive "zip" layer on the macro pop and a slightly stronger musical lift into the loop.
9. **A 4K master**, if needed for upload (the pipeline is resolution-independent SVG).
