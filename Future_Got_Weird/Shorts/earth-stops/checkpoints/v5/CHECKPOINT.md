# Checkpoint v5 — the complete V2 review cut, as delivered at `f6f000b`

Preserved before the V3 production pass ("Earth Stops V3: Claude Production Prompt", prepared 12 Oct 2026).

| | |
|---|---|
| Git commit | `f6f000bf051f0beb3be84c8e16477b84fb3abf55` (the V2 review cut, 25.33 s; head of the V2 work, "V2 report: record commit hashes") |
| Pushed checkpoint branch | `claude/fgw-earth-stops-v2-checkpoint-f6f000b` (verified on `origin` to point at `f6f000b`) |
| Git tag | **Not created.** Tag pushes are refused by the remote. The commit hash and the branch are the reference. |
| Restore everything as it was | `git checkout f6f000b` (or `git checkout claude/fgw-earth-stops-v2-checkpoint-f6f000b`) |
| Restore one file | `git show f6f000b:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| Earlier checkpoints | `701648d` V1 (`checkpoints/v4/`), `dea9b81` hook H1 (`checkpoints/v3/`), `a885fd5` prototypes (`checkpoints/v2/`), `0783b00` v1 (`checkpoints/v1/`) |

## What is preserved (unchanged in V3: `git diff f6f000b -- exports/v5 audio/v5 qa/v5` is empty; `source/src/film2/` has the one additive caption-offset change listed below)
| File (`exports/v5/`) | sha256 |
|---|---|
| `FGW_EarthStops_V2_Review_1080x1920.mp4` | `1a02a113dd8c966efb094cc008093d95fa12268e75daa248e6fac9b4eb3b1ca6` |
| `FGW_EarthStops_V2_ReviewNoMusic_1080x1920.mp4` | `1e7a279fb03ad2484e70cf67538435f947e524054c920cf8ef01c8c9e610b91f` |
| `FGW_EarthStops_V2_Silent_1080x1920.mp4` | `3f67d41d8225c97a01cc6ad6b1f08cae9e77f09a7e07bf6f632d4f8a34d6303e` |
| `FGW_EarthStops_V2_SFXOnly_1080x1920.mp4` | `ad156126e509b696e8a47d6daf47b4ab82d3fbaa914d67dbe8e1b68c6b7f15be` |
| `FGW_EarthStops_V2_MusicOnly_1080x1920.mp4` | `409920361a3de305951fe512ed3f6dee2a2858705179afb8d383779aa18d9e27` |
| `FGW_EarthStops_V2_VoiceOnly_1080x1920.mp4` | `ade33dbd1e22127750ba46cdd7eb2e81a729c5e4f23845cdf9ee4890f83c3f1e` |
| `FGW_EarthStops_V2_VoiceOnly_48k.wav` | `bdec6ccd6455e25216c53a759f2b2ef351486960f5ba80574bef71aa6c40c69c` |
| `FGW_EarthStops_V2_VoiceOnly_48k.mp3` | `6eb2a783a427b7f42a114b8f30b99b767070b3788face19a2ddebbc78af96a9e` |
Also preserved: the V2 source (`source/src/film2/*`, compositions `FilmV2`, `FilmV2-Clean`), V2 audio (`audio/v5/`), V2 QA (`qa/v5/`), `V2_REPORT.md`, `QA_NOTES_V2.md`, and the V2 documents copied to `script/history/` (`SCRIPT_V2_f6f000b.md`, `CLAIM_LEDGER_V2_f6f000b.md`, `SOURCES_V2_f6f000b.md`, `STORYBOARD_V2_f6f000b.md`).

## What changed after the checkpoint (V3 work, on `claude/fgw-earth-stops-short`)
- **New**: `source/src/film3/*` (compositions `FilmV3`, `FilmV3-Clean`), `audio/v6/`, `qa/v6/`, `exports/v6/`, V3 documents. `source/src/Root.tsx` adds the two V3 compositions (V1's and V2's are unchanged).
- **Additive edits to shared files** (V2 output unchanged: the new props default to the old behaviour): `source/src/v2/Street2.tsx` (optional `palms`, `lamps`, `sky`, `skyTint` props), `source/src/film2/ui.tsx` (captions accept an optional per-cue `dy`).
