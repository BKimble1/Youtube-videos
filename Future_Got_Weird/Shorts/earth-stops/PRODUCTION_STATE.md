# Production state — Earth Stops. You Don't. (V3 review cut)

Branch `claude/fgw-earth-stops-short` (from Atlas tip `3634cc5`). **The complete V3 review cut (24.8 s, loops) is built and exported; production is paused for the owner's one whole-film review. Not published. Not uploaded. Not scheduled. No pull request opened. No final-ready claim. Nobody — including me — has watched it in real time or listened to it.** Checkpoints (branches; tag pushes are refused by the remote): V2 `f6f000b` (`claude/fgw-earth-stops-v2-checkpoint-f6f000b`, `checkpoints/v5/`), V1 `701648d` (`claude/fgw-earth-stops-v1-checkpoint-701648d`, `checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

## Done
- V3 per the owner's single V3 brief: brake trigger and first-second danger, loose objects → wind → ocean escalation, one explanation, one globe comparison, a loop that returns to frame 0: `V3_REPORT.md` (change log with final timecodes, brief-vs-built, creative assessment), `script/STORYBOARD.md`.
- Script (55 words, the brief's text), claim-specific ledger and source table that records who opened what (Claude opened nothing): `script/SCRIPT.md`, `CLAIM_LEDGER.md`, `SOURCES.md`.
- Test Voice take B cut at its own pauses (no stretch), Scribe word times, 14 caption cues and a clean SRT: `audio/v6/voice/NARRATION_PROVENANCE.md`, `qa/v6/CAPTION_SYNC.json`.
- Sound: 101 events with a job each (5 new + 7 reused ElevenLabs one-shots, procedural Foley), a loop-continuous bed, controlled silences, selective ducking, an audible-in-the-gaps optional swell as a separate stem, a no-music mix: `audio/v6/v3/`, `credits.md`.
- Exports (`exports/v6/`): review master, no-music mix, labeled 540 × 960 preview, silent, voice-only (wav/mp3/mp4), SFX-only, music-only, stems, script, SRT, metadata. QA: `QA_NOTES_V3.md`, `qa/v6/`.
- Runway: no new generation (the V1 clip host is still refused; nothing to inspect).

## Needs the owner (nobody has done these)
1. **Watch** `FGW_EarthStops_V3_Review_1080x1920.mp4` (or the labeled preview) on a phone, muted first (the silent file), then with sound; answer the six questions in `V3_REPORT.md` §5 (trigger readable? danger in the first second? consequences grow? the coast earns its scale? the explanation rewards attention? the final movement connects to the next play?).
2. **Listen** to the voice, the SFX-only track and the mixes (phone speaker, headphones, mono); start with the **no-music** mix. First checks: 0.3–0.7 s ("stopped" against the lock clack), 2.3–2.5 s, 10.2–10.6 s (the silence before the wave) and the loop point. Every level is a design target from measurement.
3. Check the live **Shorts UI** (`qa/v6/UI_OVERLAY_V3.png` is an approximate layout only).
4. **Sources**: accept the reviewer's reads or open the pages (`script/SOURCES.md`); Claude opened none. Allow the blocked hosts if Claude should re-check.
5. **Rights**: confirm the ElevenLabs plan's licence for the voice and the generated one-shots; no music is licensed. Rights must be confirmed before any recommendation to publish commercially.
6. Decide the open script items in `script/CLAIM_LEDGER.md` (spoken "initially"? "just over a thousand"? the woman's unresolved fate).
7. Say which **Atlas / murder-tip files were uploaded** (analytics and runtime conclusions stay conditional).
8. Give the next revision brief, or approve a path to publication (not authorised yet).

## Commit record (all on `claude/fgw-earth-stops-short`, pushed)
V3 work-in-progress `99297ba`. The V3 review commit and the documentation-only commit that records its hash follow it in `git log`.

## Not authorised yet
Publishing, uploading, scheduling; pull requests; licensed music; further Runway spend.
