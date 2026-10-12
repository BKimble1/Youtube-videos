# Checkpoint v6 — the complete V3 review cut, as delivered at `243eb4d`

Preserved before the V4 final animation-and-pacing pass ("Future Got Weird — Earth Stops V4 Final Animation and Pacing Prompt", prepared 12 Oct 2026).

| | |
|---|---|
| Git commit | `243eb4d2907e8dbb7b35ea1a6c162811fe239274` (the V3 review cut, 24.8 s; head of the V3 work, "V3: record commit hashes in the report and production state"; the V3 exports are from `e6fa93a`, an ancestor) |
| Pushed checkpoint branch | `claude/fgw-earth-stops-v3-checkpoint-243eb4d` (verified on `origin` with `git ls-remote`: it points at `243eb4d`) |
| Git tag | **Not created.** Tag pushes are refused by the remote. The commit hash and the branch are the reference. |
| Restore everything as it was | `git checkout 243eb4d` (or `git checkout claude/fgw-earth-stops-v3-checkpoint-243eb4d`) |
| Restore one file | `git show 243eb4d:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| Earlier checkpoints | `f6f000b` V2 (`checkpoints/v5/`), `701648d` V1 (`checkpoints/v4/`), `dea9b81` hook H1 (`checkpoints/v3/`), `a885fd5` prototypes (`checkpoints/v2/`), `0783b00` v1 (`checkpoints/v1/`) |

## What is preserved (unchanged in V4: `git diff 243eb4d --stat -- exports/v6 audio/v6 qa/v6` is empty)
| File (`exports/v6/`) | sha256 |
|---|---|
| `FGW_EarthStops_V3_Review_1080x1920.mp4` | `1fdf5196b90158d50df404b55c2d00337149ac49eaab3782ddb4570841465ea9` |
| `FGW_EarthStops_V3_ReviewNoMusic_1080x1920.mp4` | `f54fa7cd5a712b43bb7d3baab37c71409a7cd0dce48d83da448a6366ecd0d924` |
| `FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4` | `fbd4b4043b13ddfaa301edc3d60333af03f2ff9c6b7703a23917cdfac2ea12d7` |
| `FGW_EarthStops_V3_Silent_1080x1920.mp4` | `6c3f3c1615350e4683fe0511785b0e078035889c5d4ffab181ea3638eb4d112a` |
| `FGW_EarthStops_V3_SFXOnly_1080x1920.mp4` | `83312234c4ed9e6c8ce9889499a8efb06af7674f1193bc030f7ebcd3258a9f4e` |
| `FGW_EarthStops_V3_MusicOnly_1080x1920.mp4` | `557cc3fd52fb4e44bbb23d60173a96b05a32a8bd9f16ca09c2ef28229afcf0e9` |
| `FGW_EarthStops_V3_VoiceOnly_1080x1920.mp4` | `3b867590478129c3f654d86b33a5343fa12dfeb0414030ca4a1314aa1b0bd7a7` |
| `FGW_EarthStops_V3_VoiceOnly_48k.wav` | `40deaf771f17c2b379b071e051fc9d508e0671e39039cd675ad506503b3a4ada` |
| `FGW_EarthStops_V3_VoiceOnly_48k.mp3` | `93f545f2296fd0460f5a480f0f8c77292445153472d73a59187bf4a152346e3c` |
Also preserved: the V3 source (`source/src/film3/*`, compositions `FilmV3`, `FilmV3-Clean`), V3 audio (`audio/v6/`), V3 QA (`qa/v6/`), `V3_REPORT.md`, `QA_NOTES_V3.md`, `handoff/OWNER_APPROVAL_V3.md`, and the V3 documents copied to `script/history/` (`SCRIPT_V3_243eb4d.md`, `CLAIM_LEDGER_V3_243eb4d.md`, `SOURCES_V3_243eb4d.md`, `STORYBOARD_V3_243eb4d.md`).

## What changed after the checkpoint (V4 work, on `claude/fgw-earth-stops-short`)
- **New**: `source/src/film4/*` (compositions `FilmV4`, `FilmV4-Clean`), `audio/v7/`, `qa/v7/`, `exports/v7/`, V4 documents. `source/src/Root.tsx` registers the two V4 compositions (V1–V3 compositions unchanged).
- **Additive edit to a shared file** (V1–V3 output unchanged: the new pose fields default to the old behaviour): `source/src/v2/side.tsx` (optional `bun`, `squint`, `mouthScale` pose fields for the V4 acting).
