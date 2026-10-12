# Checkpoint v4 — the complete V1 review cut, as delivered at `701648d`

Preserved before the V2 production pass ("Preserve V1 (`701648d`) and the `dea9b81` hook checkpoint").

| | |
|---|---|
| Git commit | `701648ded2c56568cba0fc9d64f7491e0a50732f` (the V1 review cut, 34.5 s) |
| Pushed checkpoint branch | `claude/fgw-earth-stops-v1-checkpoint-701648d` (verified on `origin` to point at `701648d`) |
| Git tag | **Not created.** Tag pushes are refused by the remote. The commit hash and the branch are the reference. |
| Restore everything as it was | `git checkout 701648d` (or `git checkout claude/fgw-earth-stops-v1-checkpoint-701648d`) |
| Restore one file | `git show 701648d:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| Earlier checkpoints | `dea9b81` hook H1 (`checkpoints/v3/`), `a885fd5` prototypes (`checkpoints/v2/`), `0783b00` v1 (`checkpoints/v1/`) |

## What is preserved (unchanged in V2: `git diff 701648d -- exports/v4 audio/v4 qa/v4 source/src/film source/src/v2` is empty)
| File (`exports/v4/`) | sha256 |
|---|---|
| `FGW_EarthStops_V1_Review_1080x1920.mp4` | `f1ef8341e489acb4e9fafc61318ee9ec96198b9ceb0e7d92cd7282a7de0583ab` |
| `FGW_EarthStops_V1_SFXOnly_1080x1920.mp4` | `f82293efaebe71c438e74b2712c96d8bcf8dafc3c3739ede9898d649145021a9` |
| `FGW_EarthStops_V1_Silent_1080x1920.mp4` | `2034d43e68b9dd0b05c7b0c17a49b8dc727dd24053f8a3c2038141b1d926eed1` |
| `FGW_EarthStops_V1_VoiceOnly_1080x1920.mp4` | `d80e4953faf131b78bbc6a474306ee4623bb04f25d59d20165958a0bdb3672a4` |
| `FGW_EarthStops_V1_VoiceOnly_48k.wav` | `ca65e731c8a4453525170e2b91aaecf15a85d84f69f9de262bc6a5867b4f2494` |
Also preserved: the V1 source (`source/src/film/*`, compositions `FilmV1`, `FilmV1-Clean`), V1 audio (`audio/v4/`), V1 QA (`qa/v4/`), `V1_REPORT.md`, `QA_NOTES_V1.md`, and the V1 documents copied to `script/history/` (`SCRIPT_V1_701648d.md`, `CLAIM_LEDGER_V1_701648d.md`, `SOURCES_V1_701648d.md`, `STORYBOARD_V1_701648d.md`).

## What changed after the checkpoint (V2 work, on `claude/fgw-earth-stops-short`)
- **New**: `source/src/film2/*` (composition `FilmV2`, `FilmV2-Clean`), `audio/v5/`, `qa/v5/`, `exports/v5/`, V2 documents. `source/src/Root.tsx` adds the two V2 compositions (V1's are unchanged).
- **Overwritten tools (same file names as the prototype-era scripts)**: `tools/build_cues_v2.mjs`, `tools/build_audio_v2.py`, `tools/qa_v2.py` are now the **V2 film** tools; the prototype-era (E-A v2 / E-C) versions are in git history at `a885fd5`.
- The V1 hook scene (`source/src/v2/SceneH.tsx`, `choreoH.ts`) is reused unchanged by V2 with an 11-frame scene-time offset.
