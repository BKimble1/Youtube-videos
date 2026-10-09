# Video 02 v1 baseline (frozen before the v2 editorial pass)

The v2 pass edits this folder in place; v1 stays recoverable exactly.

| Item | Where v1 lives |
|---|---|
| Source that rendered the v1 films | commit `4eb4d50` (scenes/kit; last source change), with the final sound at `9842227`; the whole v1 state including docs is commit `40183b0` (branch `claude/new-session-h21vtg`). Restore: `git checkout 40183b0 -- Future_Got_Weird/Video_02` |
| v1 script, selection, timeline | `script/` and `source/src/data/timeline.json` at `40183b0` (48 lines, 1,111 words, 404.01 s, 12,120 frames) |
| v1 narration takes | `audio/narration/v2/takes/` (all v1 takes are kept; v2 adds new sections under new ids) and `backup/v02/sources/` |
| v1 rendered audio (narration, mix, stems) | `backup/v02/rendered/` (FLAC, sample-exact) |
| v1 films | `backup/v02/films/` (MASTER_4K `aa867101…`, UPLOAD_1080p `c75dba9d…`, PREVIEW_720p), manifest sha256 `e4ccfb4e35dc3fa1…` |
| v1 reviews | `qa/DEFECT_LOG.md`, `qa/REVIEW_R2.md`, `qa/REVIEW_R3.md`, `STATUS.md` (v1) |

The v2 brief is `v2/REVISION_BRIEF.md`. v2 deliverables carry `_v2_` in their names and get their own backup group.
