# Production state — Why This Robot Has No Pinky (Atlas Short)

Branch: `claude/pensive-mendel-3j0xsc`. **Not published. Not uploaded. Not scheduled. Do not publish.**

## Status: V4 COMPLETE for production (final presentation and pacing pass); awaiting human audiovisual review (not performed)

V1 (`v1/`), V2 (`v2/`) and V3 (`v3/`; commit `da6ce9c`) are preserved. V4 changes presentation and pace only: no new script, cast, generated asset or rebuild; the 88 spoken words, story, palette, hand rig and corrected grips are unchanged.

- [x] Persistent `Source:` strips, tag pills and loop layers deleted; Atlas / Boston Dynamics named once in the opener; citations moved to the description (`packaging_draft.md`) and `claim_ledger.md`.
- [x] Type system: Montserrat ExtraBold captions (measured wrapping, ≤ 760 px, ≤ 2 lines, clipped 4-frame rise, emphasis on aligned words) and Barlow Condensed ExtraBold headlines; ON PURPOSE plate removed; fonts bundled and proven at render time.
- [x] Caption ends rebuilt from the alignment (final-word coverage, 60–120 ms hold or clean handoff); validators for transcript equality, start lag, coverage, reading rate, line fit, replay boundary.
- [x] Shots: opener (bigger title/gear/ring, thumb clear of the post, fading forearm), tape-wrap-led experiment, bigger verdict mark, whole-hand → thumb-joint loupe → `13 WAYS TO MOVE`, three capability shots, bigger tradeoff assembly (tag → footprint → wrench), closer workstation with `BUILT TO WORK` finished before the second hand returns, simple `HUMAN` reference, dominant `NOT IN BUDGET`.
- [x] Transitions: tape wipe, stamp iris, receipt tear kept; other cuts are 5-frame edge wipes.
- [x] Held-grip audit now includes the **drill trigger**: V3's lever swung the wrong way (V4 `Tool4`, fingertip on lever 27/27 frames).
- [x] Pace: default cut 31.87 s (narration 1.05× pitch-preserving + eight planned gap trims, one old→new map for everything); original-pace cut 34.60 s also delivered; music bed rebuilt to the exact duration; loudness −14.6 LUFS / −1.4 dBTP.
- [x] Renders (clean + captioned × two paces, native 1080 × 1920), SRTs, cover, `QA_REPORT.md`, `qa/v4/*`, `script.md`, `claim_ledger.md`, `credits.md`, `README.md`, `packaging_draft.md`, `handoff/V4_Final_Presentation_and_Pacing_Prompt.md`.

## Remaining (human) — none of these has happened
1. One full phone playback **with sound** — above all: does the **1.05× retimed narration** sound natural? (Never auditioned by ear. If it sounds rushed, use the `…_OriginalPace_…` files.)
2. One **muted** phone playback of the captioned MP4.
3. **Two repeats back-to-back** (picture exact by construction; the audio reset has never been heard).
4. **Current Shorts UI overlay** check of captions and critical details (only a conservative mock was checked).
5. Optionally confirm the primary pages first-hand (not re-read here; C05 relies on the owner's V2 audit).
6. The upload decision, including which cut — and keeping the description's source and reconstruction note (the picture no longer carries them).

## Notes
- No Runway job and no new ElevenLabs generation.
- Audio and MP4 stored as ordinary Git blobs via scoped `.gitattributes` (LFS uploads Forbidden here).
- V4 source lives in `source/src/v4/` (+ `src/cues_v4_{fast,orig}.ts`); the pace is a bundle-time switch (`REMOTION_PACE=orig`). `Short` / `ShortCaptioned` are aliases of V4.
- The encode of V4 is not bit-reproducible run to run (see `qa/v4/determinism_check.txt`); the picture is.
