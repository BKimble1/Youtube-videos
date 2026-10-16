# Future Got Weird: Tesla's Roadster reveal (Oct 15, 2026)

Production brief: a 38–45 s Short first, then a 3–4 min companion explainer. Both are hybrids: real Tesla demo footage
as evidence, plus the channel's own warm vector animation for the explanations.

## Status

| Piece | State |
|---|---|
| **Short** (31.1 s, 9:16, 30 fps) | **FINAL v4** (owner's final pass): `exports/FGW_Roadster_Short_FINAL_v4.mp4`, composition `ShortV4`, `bash tools/render_short_v4.sh`. Script and changes: `script/short_v4_final.md`; QA: `QA_REPORT.md`. Not uploaded: publishing is the owner's action. v3 (`ShortV3`) and v2 (`Short`) are superseded |
| **Companion** (3:34.2, 16:9) | Review copy v1 rendered but **on hold**: its suction and thruster panels still use the rejected box car. To be rebuilt with the v3 traced Roadster and real-footage vectors. Thumbnail draft: `tools/render_thumbnail.sh` |

Nothing has been uploaded or published. The footage release `roadster-footage-2026-10-15` is still a draft.

**Before upload.**

1. Listen once to FINAL v4 before uploading. The checks were measurements and transcription, not a human listen.
2. Recheck Tesla's live Roadster page for the Rocket road-use wording and the trim names (claim ledger C10, C11).

## Files

| What | Where |
|---|---|
| Claim ledger (facts, sources, corrections to the brief, footage checks) | `research/claim_ledger.md` |
| Short FINAL v4 script, timeline, changes | `script/short_v4_final.md` (v3: `script/short_v3_script.md`) |
| Companion script | `script/companion_script.md` |
| Clip ledger (source recordings, exact in/out of every footage shot) | `footage/CLIP_LEDGER.md` |
| Cut lists (in-points, 9:16 crops) | `footage/cuts_short.json`, `footage/cuts_companion.json` |
| Original footage hand-off sheet | `footage/CUT_SHEET.md` |
| Narration takes and alignments | `audio/short/`, `audio/companion/` (ElevenLabs flow `8baHNxGa4ViVC2FKXh4s`) |
| Remotion source | `source/src/` (compositions `ShortV3` in `short3/`, `Short` (v2), `Companion`, `Thumbnail`) |
| Captions (upload) | `captions/FGW_Roadster_Short_FINAL_v4.srt`, `captions/FGW_Roadster_Companion.srt` |
| Title, description, pinned comment, chapters | `upload/` |
| QA | `QA_REPORT.md`, `qa/evidence/` |

## Rebuild from a fresh checkout

    cd Future_Got_Weird/tesla-roadster-flew
    (cd source && npm ci)
    # the owner's recordings → footage/release/rec_<time>.mp4 (draft release roadster-footage-2026-10-15)
    python3 tools/ingest_footage.py --cuts footage/cuts_short.json
    python3 tools/ingest_footage.py --cuts footage/cuts_companion.json
    python3 tools/check_footage.py short && python3 tools/check_footage.py companion
    bash tools/cut_v3_clips.sh               # Short v3 clips (spans in footage/CLIP_LEDGER.md)
    bash tools/render_short_v4.sh            # → exports/FGW_Roadster_Short_FINAL_v4.mp4 (−14 LUFS, −1.5 dBTP)
    TAG=v1 bash tools/render_companion.sh    # → exports/FGW_Roadster_Companion_REVIEW_v1.mp4 (−15 LUFS, −1.5 dBTP)

Stills for inspection: `cd source && COMP=ShortV4 node stills.mjs ../qa/<dir> t:<seconds> …` (or `COMP=Companion`).
Frame sheets of a source window: `bash tools/scan_window.sh <file> <start> <dur> <fps> <out.png>`.
Regenerated files (Tesla clips, effects and narration WAVs, renders, frame sheets) are Git-ignored. The render
scripts rebuild the WAVs.
