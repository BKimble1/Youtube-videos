# Production state — Why This Robot Has No Pinky (Atlas Short)

Branch: `claude/pensive-mendel-3j0xsc`. **Not published. Not uploaded. Not scheduled. Do not publish.**

## Status: V3 COMPLETE for production (final focused polish); awaiting human audiovisual review (not performed)

V1 (`v1/`) and V2 (`v2/`, SHA-256 of the clean MP4 `d09bf1dd…4ffd`, the file the owner reassessed) are preserved. V3 repairs the visible defects from the owner's reassessment; it does not add a new script, cast, generated asset or rebuild.

- [x] P0 TURN grip: reachable wrist/cube geometry, pad tips solved onto the cube edges, grip closed before the turn; per-frame contact audit (`tools/check_contacts.mjs`) — worst gap 3.0 px (V2 geometry measured 18–100 px).
- [x] P0 opening: front-view four-digit hand pinching a gear at frame 0; four digits distinct by ~0.8 s; dashed fifth slot into empty space; the same function drives the closing pre-roll.
- [x] P1 lanes and labels (public tags `RECONSTRUCTION` / `COMPANY-REPORTED ABILITY` / `ILLUSTRATION`; taxonomy moved to `claim_ledger.md`), shot-owned `PINCH.` / `TURN.` / `PRESS.`, `BUILT TO WORK` clear of the arm, cool-paper stage for B04 and the turn.
- [x] P2 exploded stack tied to the fifth slot with one consequence label at a time; five-row receipt without the guide.
- [x] Captions: 23 cues timed to the alignment, two-word beats split out, emphasis from aligned word time, fade-in from zero, last cue ends before the tear.
- [x] Audio: music bed made loop-periodic (124.855 BPM, 18 bars, circular tails), no end fade; 29 effect events (same budget as V2); −14.6 LUFS WAV / −14.6 LUFS, −1.4 dBTP in the MP4.
- [x] Renders (clean + captioned), SRT, cover, `QA_REPORT.md`, `qa/v3/V3_DEFECT_LOG.md`, `qa/v3/automated_checks.txt`, `handoff/V3_Reassessment_and_Prompt.md`, `script.md`, `claim_ledger.md`, `credits.md`, `README.md`, `packaging_draft.md`.

## Remaining (human) — none of these has happened
1. One full phone playback **with sound** (voice, *thirteen*/*actuators*, effects, retimed music bed; can each action be followed).
2. One **muted** phone playback of the captioned MP4 (hook, premise, experiment, tradeoff, conclusion).
3. **Two repeats back-to-back** (picture exact by construction; the music bed is periodic, but the audio reset has never been heard).
4. **Current Shorts UI overlay** check of captions and critical details.
5. Optionally confirm the primary pages first-hand (not re-read in this environment; C05 relies on the owner's V2 audit).
6. The upload decision (not made here).

## Notes
- No Runway job and no new ElevenLabs generation; narration reused unchanged.
- Audio and MP4 stored as ordinary Git blobs via scoped `.gitattributes` (LFS uploads Forbidden here).
- V3 source lives in `source/src/v3/` (a fork of `src/v2/`, which still renders as `ShortV2`); the dev-only `ProbeV3` composition renders the opener function alone.
