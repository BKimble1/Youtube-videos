# Checkpoint v7 — the complete V4 review cut, as delivered at `2fb391a`

Preserved before the V5 final clarity pass ("Future Got Weird — Earth Stops V5 Final Clarity Prompt", prepared 12 Oct 2026).

| | |
|---|---|
| Git commit | `2fb391afab9e8137f3fb3bbdc7ad1c5787ecacda` (head of the V4 work, "V4: record commit hashes in the report and production state"; the V4 render and exports are from `bad7f7d`, its parent) |
| Pushed checkpoint branch | `claude/fgw-earth-stops-v4-checkpoint-2fb391a` (verified on `origin` with `git ls-remote`: it points at `2fb391a`) |
| Git tag | **Not created.** Tag pushes are refused by the remote. The commit hash and the branch are the reference. |
| Restore everything as it was | `git checkout 2fb391a` (or `git checkout claude/fgw-earth-stops-v4-checkpoint-2fb391a`) |
| Restore one file | `git show 2fb391a:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| Earlier checkpoints | `243eb4d` V3 (`checkpoints/v6/`), `f6f000b` V2 (`checkpoints/v5/`), `701648d` V1 (`checkpoints/v4/`), `dea9b81` hook H1 (`checkpoints/v3/`), `a885fd5` prototypes (`checkpoints/v2/`), `0783b00` v1 (`checkpoints/v1/`) |

## What is preserved (unchanged in V5: `git diff 2fb391a --stat -- exports/v7 audio/v7 qa/v7 source/src/film4` is empty)
| File (`exports/v7/`) | sha256 |
|---|---|
| `FGW_EarthStops_V4_Review_1080x1920.mp4` | `b263d15eb9f6f1e5838b94ccaf9b246f13c0fb9f8df1866f97337db35b64781f` |
| `FGW_EarthStops_V4_ReviewNoMusic_1080x1920.mp4` | `ad35806c57b5f4f7d129f161e813738eff8b051346b4bde0b341aa608f44d608` |
| `FGW_EarthStops_V4_Review_Preview_540x960_labeled.mp4` | `f08e986a4e931ad40b1c19343cb488bf4a703244047856b7cddd453032829ad2` |
| `FGW_EarthStops_V4_Silent_1080x1920.mp4` | `4b5fef2fb78ef77cfcaeb13758d487230125b254f31d4b41a0f231d76be5b9f4` |
| `FGW_EarthStops_V4_SFXOnly_1080x1920.mp4` | `d109928d25318e51bf151f8854ceb4e4522a90578dd24fdb1efbcdd7b5d4b75c` |
| `FGW_EarthStops_V4_MusicOnly_1080x1920.mp4` | `778eb04b7a8290a0fa78fc7bf15228b16455b7187e3b0b839f638bf1f9a4033c` |
| `FGW_EarthStops_V4_VoiceOnly_1080x1920.mp4` | `804de6eae8d7720ea705ea44375a6a660bd0735ae297c619a7e7f842a780ebb1` |
| `FGW_EarthStops_V4_VoiceOnly_48k.wav` | `8a723c7e6f2dbe860be906b23d0d27f2de1fb59d8b9a5fd3201f0d5da149ef4b` |
| `FGW_EarthStops_V4_VoiceOnly_48k.mp3` | `5a3df0fd2ef55762ced336e4ebb0cebb9c42421a53e45c9f29f285975f6962fa` |
Also preserved: the V4 source (`source/src/film4/*`, compositions `FilmV4`, `FilmV4-Clean`), V4 audio (`audio/v7/`), V4 QA (`qa/v7/`), `V4_REPORT.md`, `QA_NOTES_V4.md`, `handoff/OWNER_APPROVAL_V4.md`, and the V4 documents copied to `script/history/` (`SCRIPT_V4_2fb391a.md`, `CLAIM_LEDGER_V4_2fb391a.md`, `SOURCES_V4_2fb391a.md`, `STORYBOARD_V4_2fb391a.md`).

## What changed after the checkpoint (V5 work, on `claude/fgw-earth-stops-short`)
- **New**: `source/src/film5/*` (compositions `FilmV5`, `FilmV5-Clean`), `audio/v8/`, `qa/v8/`, `exports/v8/`, V5 documents. `source/src/Root.tsx` registers the two V5 compositions (V1–V4 compositions unchanged).
