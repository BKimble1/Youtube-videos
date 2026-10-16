# Future Got Weird: Tesla's Roadster reveal (Oct 15, 2026)

Production brief: a 38–45 s Short first, then a 3–4 min companion explainer. Both are hybrids: real Tesla demo footage
as evidence, plus the channel's own warm vector animation for the explanations.

## Status

| Piece | State |
|---|---|
| **Short** (36.7 s, 9:16) | **Review copy v3** (owner revision): bright Roadster in frame 0, the traced-car suction diagram, airborne vectors on real plumes, the Semi payoff, the 0.81 graphic over the live run, and a loop. Composition `ShortV3`. Awaiting the owner's approval and one listen. Then run `bash tools/render_short_v3.sh --final`. Script and change list: `script/short_v3_script.md`. Review copy v2 (`Short`) is superseded |
| **Companion** (3:34.2, 16:9) | Review copy v1 rendered but **on hold**: its suction and thruster panels still use the rejected box car. To be rebuilt with the v3 traced Roadster and real-footage vectors. Thumbnail draft: `tools/render_thumbnail.sh` |

Nothing has been uploaded or published. The footage release `roadster-footage-2026-10-15` is still a draft.

**Owner decisions before FINAL.**

1. Listen once to Short v3: the voice (pauses tightened, no time-stretch), the real event sound under the hop and the
   live launch, and the effects. Auditions are in `audio/short_v3/auditions/` if you want a different voice.
2. Recheck Tesla's live Roadster page for the Rocket road-use wording and the trim names (claim ledger C10, C11).

## Files

| What | Where |
|---|---|
| Claim ledger (facts, sources, corrections to the brief, footage checks) | `research/claim_ledger.md` |
| Short v3 script, shot list, change list | `script/short_v3_script.md` (v2: `script/short_script.md`) |
| Companion script | `script/companion_script.md` |
| Clip ledger (source recordings, exact in/out of every footage shot) | `footage/CLIP_LEDGER.md` |
| Cut lists (in-points, 9:16 crops) | `footage/cuts_short.json`, `footage/cuts_companion.json` |
| Original footage hand-off sheet | `footage/CUT_SHEET.md` |
| Narration takes and alignments | `audio/short/`, `audio/companion/` (ElevenLabs flow `8baHNxGa4ViVC2FKXh4s`) |
| Remotion source | `source/src/` (compositions `ShortV3` in `short3/`, `Short` (v2), `Companion`, `Thumbnail`) |
| Captions (upload) | `captions/FGW_Roadster_Short_v3.srt`, `captions/FGW_Roadster_Companion.srt` |
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
    TAG=v3 bash tools/render_short_v3.sh     # → exports/FGW_Roadster_Short_REVIEW_v3.mp4 (−14 LUFS, −1.5 dBTP)
    TAG=v1 bash tools/render_companion.sh    # → exports/FGW_Roadster_Companion_REVIEW_v1.mp4 (−15 LUFS, −1.5 dBTP)

Stills for inspection: `cd source && COMP=ShortV3 node stills.mjs ../qa/<dir> t:<seconds> …` (or `COMP=Companion`).
Frame sheets of a source window: `bash tools/scan_window.sh <file> <start> <dur> <fps> <out.png>`.
Regenerated files (Tesla clips, effects and narration WAVs, renders, frame sheets) are Git-ignored. The render
scripts rebuild the WAVs.
