# Credits and asset provenance — V3 Final

Nothing new was generated, bought or uploaded for V3.

- **Narration:** unchanged V2 take — ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, take 1, generation `zTuvi1a9TkNymbtaUEb4`, pauses shortened in V2 (`audio/narration_v2/`). The working file is byte-identical to the V2 commit `70a6451` (sha256 `6000cf2f…c658`). No new take, no repair, no speed change. **No ElevenLabs operation was run in V3** (the connector's upload/finalize tools were denied earlier in this conversation and were not retried through any other route).
- **Alignment:** V2's Scribe alignment (`audio/narration_v2/narration_v2_alignment.json`), unchanged; V3's cue table is derived from it by `tools/build_cues_v3.py`.
- **Sound effects:** only the first 0.14 s of V1's ElevenLabs click generation (`MSUurm2embnHeRYCmycP`, `audio/sfx/raw_click.wav`) is reused. Everything else (very low tap, light paper ×2, dry stamp tap, muted folder thud, button tick) is local synthesis in `tools/build_audio_v3.py`. Placements: `audio/sfx_log_v3.csv`.
- **Music:** original local synthesis (same material as V2, re-balanced): muted pulse + two-note plucked motif, 114.286 BPM, 10 bars = 21.000 s, no samples, no vocals.
- **Cast:** the channel's native vector rig and approved checker (gray bob, round glasses, coral cardigan, pencil behind the ear), unchanged, drawn larger and without a portrait box. No new character.
- **Runway:** not used (0 credits). **ChatGPT artwork:** none.
- **Fonts (SIL OFL, `@fontsource` 5.3.0):** Montserrat 800, Barlow Condensed 800.
- **Code:** Remotion 4.0.533 / React 19.1.0 / TypeScript 5.8.3, pinned by `source/package-lock.json` (unchanged).
