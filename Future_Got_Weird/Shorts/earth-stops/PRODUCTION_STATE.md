# Production state — Earth Stops. You Don't. (V5 review cut)

Branch `claude/fgw-earth-stops-short` (from Atlas tip `3634cc5`). **The complete V5 review cut (20.5 s, loops) is built and exported; production is paused for the owner's one whole-film review. Not published. Not uploaded. Not scheduled. No pull request opened. No final-ready claim. Nobody — including me — has watched it in real time or listened to it.** Checkpoints (branches; tag pushes are refused by the remote): V4 `2fb391a` (`claude/fgw-earth-stops-v4-checkpoint-2fb391a`, `checkpoints/v7/`), V3 `243eb4d` (`checkpoints/v6/`), V2 `f6f000b` (`checkpoints/v5/`), V1 `701648d` (`checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

## Done
- V5 per the owner's single V5 brief: a targeted clarity pass on V4 — the opening now shows a grounded step becoming a loss of footing (a world-pinned planted foot, a crouch, the cup tipping, the foot dragged off, coffee escaping, both feet clear at 0.97 s), the wind shot has one additional adult carried east before the awning takes over, and the effects are locally reduced under *stopped*, *debris through the streets* and the final /st/ of *coast.*: `V5_REPORT.md` (change log with final timecodes, brief-vs-built, creative assessment), `script/STORYBOARD.md`.
- Everything else is V4: the words, the voice take, the pauses, the captions, the boat/wave/pier, the flood, the explanation and the loop are unchanged (picture-identical outside f20–47 and f197–224 by measurement; the voice-only mp3 is byte-identical).
- Script (64 words), claim ledger and source table (Claude opened nothing): `script/SCRIPT.md`, `CLAIM_LEDGER.md`, `SOURCES.md`.
- Sound: 109 log entries (no new generation; reused V2/V3 one-shots plus procedural Foley; four speech-protection windows), a loop-continuous bed, the optional swell as a separate stem, a no-music mix: `audio/v8/v5/`, `credits.md`.
- Exports (`exports/v8/`): review master, no-music mix, labeled 540 × 960 preview, silent, voice-only (wav/mp3/mp4), SFX-only, music-only, stems, script, SRT, metadata. QA: `QA_NOTES_V5.md`, `qa/v8/`.
- Runway: no generation. ElevenLabs: no generation. V1–V4 exports are byte-identical to their checkpoints.

## Needs the owner (nobody has done these)
1. **Watch** `FGW_EarthStops_V5_Review_1080x1920.mp4` (or the labeled preview) at normal speed on a phone, muted first (the silent file), then with sound; answer the questions in `V5_REPORT.md` §5 and `QA_NOTES_V5.md` §C (does the opening read as footing being lost? is the planted foot noticed? does the second person read as a person and as another consequence? does the awning still take over?).
2. **Listen** to the no-music mix on a phone speaker and headphones at 0.5–1.0 s (*stopped*), 7.9–9.1 s (*debris through the streets*) and 11.1–11.4 s (*coast.*): **intelligibility is unverified by ear**; judge whether the reductions are audible and whether the crash still lands. Every level is a design target from measurement.
3. Check the live **Shorts UI** (`qa/v8/UI_OVERLAY_V5.png` is an approximate layout only).
4. **Confirm the second person's look** (the approved "regular person" in the side rig built for the opening woman).
5. **Sources**: accept the reviewer's reads or open the pages (`script/SOURCES.md`); Claude opened none.
6. **Rights**: confirm the ElevenLabs plan's licence for the voice and the generated one-shots; no music is licensed. Rights must be confirmed before any recommendation to publish commercially.
7. Decide the open script items in `script/CLAIM_LEDGER.md` (spoken "initially"? "just over a thousand"? the woman's unresolved fate? "keeps moving into the coast" shown for a west-facing shore only; the second person's look).
8. Say which **Atlas / murder-tip files were uploaded** (analytics and runtime conclusions stay conditional).
9. Give the next revision brief, or approve a path to publication (not authorised yet).

## Commit record (all on `claude/fgw-earth-stops-short`, pushed)
V4 `2fb391a` (checkpoint branch) → V5 review cut with the final render, exports, QA and documents (see `git log`; the hashes are recorded at the foot of `V5_REPORT.md` after the final push). **`exports/v8/` is from the commit that adds `QA_NOTES_V5.md`.**

## Not authorised yet
Publishing, uploading, scheduling; pull requests; licensed music; further Runway spend; voice regeneration.
