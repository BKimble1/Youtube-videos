# Future Got Weird: Tesla's Roadster reveal (Oct 15, 2026)

Production brief: a 38–45 s Short first, then a 3–4 min companion explainer. Both are hybrids: real Tesla demo footage
as evidence, plus the channel's own warm vector animation for the explanations.

## Status

| Piece | State |
|---|---|
| **Short** (42.1 s, 9:16) | Script, narration, animation, captions, sound and render pipeline are done. **Final render blocked: the official Tesla footage can't be reached from this environment.** Only a placeholder review copy exists, and it is not for upload. See `QA_REPORT.md` and `footage/CUT_SHEET.md` |
| **Companion** (≈3:38, 16:9) | **Paused at the owner's request** until the Short is final. Done: script, six narration blocks (Test Voice), stitched track and word timings, shot list (`source/src/data/companion_shots.json`), panels (`source/src/companion/Panels.tsx`). Not done: the timeline composition, effects, render, QA, thumbnail |

## Files

| What | Where |
|---|---|
| Claim ledger (facts, sources, corrections to the brief) | `research/claim_ledger.md` |
| Short script, storyboard, take choice | `script/short_script.md` |
| Companion script | `script/companion_script.md` |
| Footage needed: source URL, windows, slot lengths, hand-off | `footage/CUT_SHEET.md` |
| Clip ledger (filled at ingest) | `footage/CLIP_LEDGER.md` |
| Narration takes / alignments | `audio/short/`, `audio/companion/` (ElevenLabs flow `8baHNxGa4ViVC2FKXh4s`) |
| Remotion source | `source/src/` (composition `Short`; footage slots in `source/src/data/footage.json`) |
| Captions (upload) | `captions/FGW_Roadster_Short.srt` |
| Title, description, pinned comment | `upload/UPLOAD_TEXT_SHORT.md` |
| QA | `QA_REPORT.md`, `qa/` |

## Finish the Short once the footage arrives

    cd Future_Got_Weird/tesla-roadster-flew
    (cd source && npm ci)
    python3 tools/ingest_footage.py --replay <replay.mp4> --cuts footage/cuts.json   # or: --clips <dir of F1_…F6_….mp4>
    # inspect qa/footage/*.png, then set cx/cy/zoom per slot in source/src/data/footage.json
    python3 tools/check_footage.py short                                            # must report 6/6
    bash tools/render_short.sh                                                      # → exports/FGW_Roadster_Short_FINAL.mp4 (−14 LUFS, −1.5 dBTP)

Stills for inspection: `cd source && COMP=Short node stills.mjs ../qa/<dir> t:<seconds> …`.
Regenerated files (effects WAV, companion narration WAV, renders, Tesla clips) are Git-ignored. Rebuild them with
`tools/make_sfx_short.py`, `tools/stitch_companion.py` and the render script.
