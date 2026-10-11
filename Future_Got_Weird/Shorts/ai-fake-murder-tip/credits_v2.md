# Credits and asset provenance — V2

- **Narration:** ElevenLabs Test Voice (workspace voice `kk5XaSLo2XAw0sKM98zU`, verified in the connected account on 11 Oct 2026), model `eleven_v4`, **take 1 of max 2**, single call, one variation, same flow as V1 (https://elevenlabs.io/app/flows/YRJES0rtiDnnRnqvLyEF; generation `zTuvi1a9TkNymbtaUEb4`, raw 21.44 s). No speed parameter exists for `eleven_v4`/`eleven_v3` on this connector (schema inspected), so nothing was sped up; pacing was shaped by script punctuation only. The take was then edited: nine long pauses shortened by cutting the middle of each silence (`tools/trim_narration_v2.py`, log in `audio/narration_v2/narration_v2_edit_log.json`) → 19.76 s; no word was touched and nothing was time-stretched.
- **Alignment:** ElevenLabs Scribe (`eleven_scribe_v1`), generation `LqipbBW0W3LYKTfvZdvL` (≈ 108.7 credits), run on the *edited* narration; raw words in `audio/narration_v2/narration_v2_alignment_raw.json`.
- **Sound effects:** **no new generations.** Reused from V1 (ElevenLabs `eleven_text_to_sound_v2`): click `MSUurm2embnHeRYCmycP`, soft keys `haBoLSzmaSL3derspB2P`, dry knock `bWexHbNzr58FBFIrElMl` (shortened to a tick), send accent `TQz0aA9DN35IHv1fnW8l`, subdued latch `glJY9PvlBHhdr5ZOAAxk`. Local synthesis: restrained low tap, folder thump, five tiny page/flap/unlock ticks. Placements: `audio/sfx_log_v2.csv`.
- **Music:** original local synthesis (`tools/build_audio_v2.py`): muted pulse + two-note plucked motif, 114.286 BPM, 10 bars = 21.000 s, no samples, no vocals.
- **Cast:** the channel's native vector rig and approved checker (gray bob, round glasses, coral cardigan, pencil behind the ear) from `components/Character.tsx` + `cast.ts`, unchanged. No new character.
- **Runway:** not used (0 credits) — `runway/RUNWAY_V2.md`.
- **ChatGPT artwork:** none needed; the checker pose is a native-rig pose and every other object is editable SVG in Remotion.
- **Fonts (SIL OFL, `@fontsource` 5.3.0):** Montserrat 800 (captions, UI labels), Barlow Condensed 800 (headlines). No third display face.
- **Code:** Remotion 4.0.533 / React 19.1.0 / TypeScript 5.8.3, pinned by `source/package-lock.json` (unchanged).
