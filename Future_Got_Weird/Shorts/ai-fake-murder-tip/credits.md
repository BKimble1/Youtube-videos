# Credits and asset provenance — V1

- **Narration:** ElevenLabs Test Voice (workspace voice `kk5XaSLo2XAw0sKM98zU`, "Test Voice For Youtube."; not a clone claim; no owner identity exposed), model `eleven_v4`, take 1 of max 2 (single call, one variation). Flow: https://elevenlabs.io/app/flows/YRJES0rtiDnnRnqvLyEF (generation `qc11KL9gB7nC3rd8r5MN`). Alignment: ElevenLabs Scribe (`eleven_scribe_v1`), generation `j5smGbHyp7S8ku3e4xcu`.
- **Sound effects (5 generations, `eleven_text_to_sound_v2`, one variation each, same flow):** click `MSUurm2embnHeRYCmycP` · soft keys `haBoLSzmaSL3derspB2P` · dry error tap `bWexHbNzr58FBFIrElMl` · send accent `TQz0aA9DN35IHv1fnW8l` · spam latch `glJY9PvlBHhdr5ZOAAxk` (the generated "thump" was too quiet; a local synthesised thump replaces it). Raw files and slices: `audio/sfx/`, `audio/sfx_log.csv`. Seven tiny card/marker ticks are local synthesis. Cost: 5 × 16.665 ElevenLabs credits.
- **Music:** original local synthesis (`tools/build_audio.py`): plucked/mallet bed, 128.571 BPM, 15 bars = 28.000 s, no samples, no vocals. The earlier channel bed generated in Runway (`FGW CanYouHurt bed.mp3`) was **not** reused: its host is blocked in this session.
- **Cast:** the channel's native vector rig and approved checker (gray bob, round glasses, coral cardigan, pencil) from `components/Character.tsx` + `cast.ts`, copied unchanged from `claude/pensive-mendel-3j0xsc` (Atlas Short V4 kit). No new character, no new AI mascot.
- **Runway:** not used (no generation, no credits spent) — see `runway/RUNWAY_ATTEMPT.md`.
- **ChatGPT artwork:** none needed; all new objects are editable SVG in Remotion.
- **Fonts (SIL OFL, bundled via `@fontsource` 5.3.0, proven at render time):** Montserrat 800 and 600 (captions, UI labels), Barlow Condensed 800 (headlines).
- **Code:** Remotion 4.0.533 / React 19.1.0 / TypeScript 5.8.3, pinned by `source/package-lock.json` (unchanged from the Atlas kit apart from the package name).
- **Reference research:** Atlas V4 prompt and QA (`claude/pensive-mendel-3j0xsc`) for type system, caption rules and QA method.
