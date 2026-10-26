# QA report: Robots Are Learning to Copy Our Faces (V1)

## Limits of this review

This environment has no audio or video playback.
- **Nobody has watched the film in real time or listened to it.**
- Every check below was made on the rendered files: frames, frame strips, contact sheets, stream metadata and audio
  measurements, or on the source.
- The "normal speed, with sound" pass the editing rules ask for has **not** been done; it is the first thing to do
  before publishing.
- The research hosts were blocked (see `SOURCE_NOTES.md`), so the paper figures and demo videos were not inspected.

## Export metadata (ffprobe, from the files)

| | Review | Master |
|---|---|---|
| File | `exports/FGW_Robot_Faces_V1_REVIEW_1920x1080.mp4` | `exports/FGW_Robot_Faces_V1_MASTER_3840x2160.mp4` |
| Video | H.264 High, 1920×1080, 30/1 fps, yuv420p, bt709, 6,440 frames | H.264 High, 3840×2160 (rendered at 2× from the vectors, not upscaled), 30/1 fps, yuv420p, bt709, 6,440 frames |
| Audio | AAC, 48 kHz, stereo, 320 kb/s target | the same mix: −14.2 LUFS, −1.5 dBTP, 0 ms offset from the narration |
| Duration | 214.667 s (the narration master is 214.667 s) | 214.667 s; no black frames; the same single 2.6 s low-motion stretch at 32.3 s |
| SHA-256 | `cc3e0157fb98b0b46a181640a6ba0ab89bca3287c25ca2cd8e2082a36df95a86` | `2597024b29a71e16e8fa51e26b170079b4b819f039e75f9ce0f119405d3b3829` (118.6 MB) |

## Audio (measured)

**Loudness.** Measured from the review file with ffmpeg ebur128:
- −14.2 LUFS integrated;
- LRA 3.4 LU;
- true peak −1.5 dBTP.

The mix tool measured −14.21 LUFS and −1.46 dBTP. The look-ahead limiter's deepest gain reduction was 2.85 dB.

**Music.** It sits 17.5 dB below the voice (RMS during speech).

**Sync.** The speech envelope of the export cross-correlates with the selected narration at a 0 ms lag
(r = 0.92), so the audio stream is the timing master, not shifted.

**Narration.**
- The locked 617 words, verbatim, in five paragraph-group takes used whole: no internal edits, no time-stretch.
- Scribe words match the text one for one. This is a timing source: it appears to align to the generation text.
- A PocketSphinx free-recognition WER of 0.22 on the export is expected for this voice and model; it is a supporting
  check only.
- No sentence was found missing or altered in any take.

**Pace.** 175 wpm over the speech span (hook block about 202 wpm). That is faster than the brief's 150–160: the
connector's eleven_v4 node exposes no speed control, and relaxed-pace tags were the only lever. The runtime is
therefore 3:34.7, not about 4:00, and it was not stretched.

**Not checked by ear.** Sibilance, join quality, the hook take's energy, and any pronunciation (Columbia, the "B" and
"W" letters, "2026") have not been listened to.

## Captions

The SRT has 67 cues and matches the locked text word for word (asserted by `tools/make_srt.py`):
- every cue starts on a measured word onset (0 ms offset);
- no cues overlap;
- at most two lines of 42 characters.

The captions are external, as in the other long-form episodes; nothing is burned in.

## Picture checks performed

- **Contact sheets** every 2.5 s of the draft and every 6 s of the review. Three pages of the draft; the review's
  phone sheet is `qa/review/review_phone_sheet.png`.
- **Frame strips** of ±2 frames at all 13 shot boundaries (`qa/review/strips/`).
- **Native-resolution frames** at the hook (0, 4.5, 9.8 s), the mirror reveal (19.8 s), the x-ray (25.6 s), the mouth
  panels (33.5 s), the timing chart (170.5 s) and the ending (212.5 s).
- **State continuity** at every boundary (`tools/state_continuity.ts`).
  - The two continuous boundaries (77.15 and 206.5 s) and the matched mirror cut have no parameter jumps.
  - Every other yaw change is a new camera or setup.
- **Black frames:** none. **Freeze detector** (very sensitive setting, n = 0.0008, ≥ 2.5 s): one 2.6 s stretch at
  32.3 s, where only the person's mouth moves through "banana" (intended).
- **Determinism.** Every animated value is a pure function of the frame (no `Math.random`, no accumulated state), so
  seeking to any frame renders identically.
  - Spot check: frame 3000 rendered alone (`FilmStill`, t = 100 s) against the same frame decoded from the review
    gives a PSNR of 37.1 dB, i.e. identical within H.264 loss. Frame 3015 of the review gives 18.2 dB, so the
    test does tell frames apart.
  - One frame was checked, not all.

## Defects found and fixed in V1

**Hook**
- Arms that crossed the chest; legs visible under a shallow bench.
- The corner push aimed at the foreshortened corner.
- The corner lattice read as stubble.

**Rig**
- The back-of-head view drew the face mask and lips over the shell.
- The mechanism shot's support had a negative post length, so the head sat on its own base.

**Cuts**
- Fade-ins from an empty frame at 32.32 s and 115.48 s, which read as a dissolve.
- An empty frame at 115.5–117.3 s.
- An in–out–in camera before the callback, with a sliver of the robot at the frame edge.
- The notebook vanished across the continuous 206.5 s boundary.
- State jumps at the hook→mirror match, skin→watch and watch→result.

**Overlays**
- The self-model strip was off-screen; the pipeline boxes covered the head.
- The 2024 model cards were over the robot; the "Schematic" tag was over the monitor.

**Idle holds**
- The robot panel at 33–39 s now watches the person's panel (a gaze, a brow and blinks).
- The chart's tail at 171–176.7 s now has a slow push.

## Remaining limitations (V1)

- **Not seen in motion with sound.** Comprehension, pacing and voice continuity are unverified at normal speed.
- **The robot is an interpretation.** Its blue-violet face, ear hubs, back hatch and neck support are drawn from the
  brief's description and press summaries, not from the paper's images. It may differ in detail from the real head.
- **Facial animation:**
  - the robot's 3/4 mouth compresses strongly on its far side;
  - the corner lattice is dense at extreme close-ups;
  - the visitor's head comes from a Crew rig whose mouth set is simple, so "banana" is legible but stylised;
  - the robot never shows teeth (none are drawn).
- **Low motion.** Several explanation holds are calm: the cards, and the replay at 50–53 s.
- **Phone size.** The faces and actions read, but the 22–26 px corner tags are too small to read at thumbnail size.
- **Pace.** 175 wpm; runtime 3:34.7 (see above).
- **Pre-existing type errors.** `tsc` reports errors in the copied `dc/` rig (`string | null` props). They are
  unchanged upstream code and do not affect rendering; this episode's own files typecheck.
