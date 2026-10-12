# Production state — Earth Stops. You Don't. (V4 review cut)

Branch `claude/fgw-earth-stops-short` (from Atlas tip `3634cc5`). **The complete V4 review cut (20.5 s, loops) is built and exported; production is paused for the owner's one whole-film review. Not published. Not uploaded. Not scheduled. No pull request opened. No final-ready claim. Nobody — including me — has watched it in real time or listened to it.** Checkpoints (branches; tag pushes are refused by the remote): V3 `243eb4d` (`claude/fgw-earth-stops-v3-checkpoint-243eb4d`, `checkpoints/v6/`), V2 `f6f000b` (`checkpoints/v5/`), V1 `701648d` (`checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

## Done
- V4 per the owner's single V4 brief: a final animation and pacing pass on V3 — continuous in-shot animation with one focal event at a time, a rebuilt coast (boat on the water surface, pier that visibly breaks, flood and drain transition), an acted first second, and narration with no long pauses: `V4_REPORT.md` (change log with final timecodes, brief-vs-built, creative assessment), `script/STORYBOARD.md`.
- Script (64 words), claim-specific ledger and source table that records who opened what (Claude opened nothing): `script/SCRIPT.md`, `CLAIM_LEDGER.md`, `SOURCES.md`.
- Test Voice take A with its between-phrase silences shortened (nothing inside a word touched), Scribe word times, 16 caption cues rebuilt from the voice timeline and a clean SRT: `audio/v7/voice/NARRATION_PROVENANCE.md`, `qa/v7/CAPTION_SYNC.json`.
- Sound: 101 events with a job each (no new generation; V2/V3 ElevenLabs one-shots reused with procedural Foley), a loop-continuous bed, one controlled silence, selective ducking, the optional swell as a separate stem, a no-music mix: `audio/v7/v4/`, `credits.md`.
- Exports (`exports/v7/`): review master, no-music mix, labeled 540 × 960 preview, silent, voice-only (wav/mp3/mp4), SFX-only, music-only, stems, script, SRT, metadata. QA: `QA_NOTES_V4.md`, `qa/v7/`.
- Runway: no generation. V3 and earlier exports are byte-identical to their checkpoints.

## Needs the owner (nobody has done these)
1. **Watch** `FGW_EarthStops_V4_Review_1080x1920.mp4` (or the labeled preview) on a phone, muted first (the silent file), then with sound; answer the questions in `V4_REPORT.md` §5 (does the opening stay alive and read? is the danger acted? does each shot keep one focal event moving? does the coast earn its scale? is the pacing tight without being rushed? does the ending connect to the next play?).
2. **Listen** to the voice, the SFX-only track and the mixes (phone speaker, headphones, mono); start with the **no-music** mix. First checks: 0.4–0.7 s ("stopped" against the lock), 7.9–8.7 s (*debris through the streets* against the awning), 11.0–11.4 s (*coast.* against the wave hit), the loop point, and whether the 0.10–0.45 s breaths feel natural. Every level is a design target from measurement.
3. **Runtime**: the film is 20.5 s, below the brief's editorial 23–24 s (64 words at the voice's natural pace plus short breaths); decide whether that is right or whether you want longer beats.
4. Check the live **Shorts UI** (`qa/v7/UI_OVERLAY_V4.png` is an approximate layout only).
5. **Sources**: accept the reviewer's reads or open the pages (`script/SOURCES.md`); Claude opened none. Allow the blocked hosts if Claude should re-check.
6. **Rights**: confirm the ElevenLabs plan's licence for the voice and the generated one-shots; no music is licensed. Rights must be confirmed before any recommendation to publish commercially.
7. Decide the open script items in `script/CLAIM_LEDGER.md` (spoken "initially"? "just over a thousand"? the woman's unresolved fate? "keeps moving into the coast" illustrated for a west-facing shore only).
8. Say which **Atlas / murder-tip files were uploaded** (analytics and runtime conclusions stay conditional).
9. Give the next revision brief, or approve a path to publication (not authorised yet).

## Commit record (all on `claude/fgw-earth-stops-short`, pushed)
V4 work-in-progress `6e806ce` → `77fccbb` → **V4 review cut with the final render, exports, QA and documents `bad7f7d`** (**`exports/v7/` is from this commit**; its review master's sha256 starts `b263d15e…`) → a documentation-only commit recording these hashes.

## Not authorised yet
Publishing, uploading, scheduling; pull requests; licensed music; further Runway spend.
