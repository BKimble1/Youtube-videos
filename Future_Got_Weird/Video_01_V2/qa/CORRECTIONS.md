# Video 01 · corrections log

Corrections to factual content, quotations or attributions (on screen, in the narration, the captions, the thumbnail
or the description). Visual polish is in `../V3_CHANGELOG.md`. Add an entry for any correction made after
publishing, with the date, what was wrong, what changed and where (pinned comment, description, re-upload).

## Before publishing (V3 final pass, 2026-10-08)

| Where | What was wrong | Correction | Source |
|---|---|---|---|
| Thumbnail (`source/src/Thumbnails.tsx`) | Re-rendering from the V2 source dropped "CMU) is entitled:" from the quoted ChatGPT answer and left a parenthesis open; thumbnail C also printed the DeepSeek/Llama years before their titles | The slip text is assembled in the published order, verbatim | arXiv:2509.04664v1, Table 1 |
| Description (pass-2 text) | "with a title, a year, sometimes a university": all three published answers name a university | "with a title, a year and a university" | Table 1 |
| Description (pass-2 text) | "the two questions that catch a made-up answer in under a minute": no source for the time, and "catch" overpromises | "the two questions that help catch a made-up answer" | — |
| Description (pass-2 text) | Sources linked the arXiv abstract page and a Microsoft Research copy of the thesis; no later publication | Pinned arXiv HTML v1 (source of the example and Table 2), the CMU CSD thesis URL, and the later Nature article by the same authors | owner brief; `../research/CLAIM_LEDGER_V3.md` |
| Description credits (pass-2 text) | Named the pass-2 narration voice | "AI-generated voice made with ElevenLabs (Eleven v4)" | `script/narration_segments.json` |
| S4 footer at "And the confidence comes with it" (1:55–2:01) | Could be read as the model reporting a measured confidence | Footer adds "confident wording, not a measured confidence"; narration unchanged | paper §3.1 / Fig. 2 (calibration is a separate matter) |
| S5 off-by-one beat (2:15.8) | A scaled, doubled copy of the "1" was multiplied over the genuine CMU title page | The genuine page is shown unaltered; a separate outline marks the digit | CMU-CS-01-132 title page |
| Captions | Four cues merged the end of one sentence with the start of the next segment; several ended before their last word | Regenerated with the fixed builder (`tools/build_timeline.py`) | narration timing |

No spoken line needed correcting: every one of the 36 segments is supported as worded (`../research/CLAIM_LEDGER_V3.md`).

## After publishing

(none yet)
