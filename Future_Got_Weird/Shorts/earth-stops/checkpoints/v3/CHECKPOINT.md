# Checkpoint v3 — the hybrid hook H1 and the proposed script, as delivered at `dea9b81`

Preserved before the full V1 film was built ("Preserve checkpoints").

| | |
|---|---|
| Git commit | `dea9b8194f99f284a418e584761454a657890a01` (`Earth Stops: hybrid hook H1 (6.0 s, voice + procedural SFX), script, claim ledger, sources, storyboard`) |
| Pushed checkpoint branch | `claude/fgw-earth-stops-hook-h1-checkpoint-dea9b81` (verified on `origin` to point at `dea9b81`) |
| Git tag | **Not created.** Tag pushes are refused by the remote (same as earlier checkpoints). The commit hash and the branch are the reference. |
| Restore everything as it was | `git checkout dea9b81` (or `git checkout claude/fgw-earth-stops-hook-h1-checkpoint-dea9b81`) |
| Restore one file | `git show dea9b81:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| Older checkpoints | `a885fd5` prototypes (`checkpoints/v2/`), `0783b00` v1 (`checkpoints/v1/`) |

## What is preserved (unchanged: `git diff dea9b81 -- exports/v3 audio/v3 qa/v3` is empty)
| File (`exports/v3/`) | sha256 |
|---|---|
| `FGW_EarthStops_Hook_H1_SFXOnly_1080x1920.mp4` | `46e549f2f810d25783b0e565a576ac8ba75b5fb2d6fc272adc28147738072fe0` |
| `FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4` | `b00d13d6f50cc1e4721de3b7e3cdfffb1a017df77de93742c7b5725c9afda1b0` |
| `FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4` | `f5b79c32fd5b64b125311ebec31983b9422c65498f04b999820713718f4b754c` |
| `FGW_EarthStops_Hook_H1_VoiceOnly_1080x1920.mp4` | `2ed8c0092cdd9b2747a27bd4c7e6efee4ebcea1b5d9831ade1e08eb444766173` |
| `FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4` | `db66849b9e667422ea02577fbe81736e57a3951f6f7449ce0b4ec56fdd0cfa08` |

Also preserved at that commit: the H1 hook source (`source/src/v2/choreoH.ts`, `SceneH.tsx`, `GlobeH.tsx`, `OpeningH1.tsx`), `HOOK_H1_REPORT.md`, the H1 script proposal with the bus (`script/SCRIPT.md` at that commit; a copy lives on as `script/SCRIPT_PROPOSAL_H1.md`), the H1-era claim ledger, sources and storyboard, and the Test Voice hook audition (`audio/v3/`).

## What changed after the checkpoint (V1 work, on `claude/fgw-earth-stops-short`)
- Additive, backward-compatible edits to shared files: `v2/OpeningH1.tsx` (exports `pop`, `popScale`, `ArrowShape`, `Chip`; optional `tilde` prop so the speed plate reads `~1,000`), `v2/GlobeH.tsx` (optional `pin`, `halo`), `v2/SceneH.tsx` (optional scene-time override `st`), `v2/Fx2.tsx` (exports `Puff`), `v2/Street2.tsx` (exports `Building`, `STYLES`), `source/src/Root.tsx` (new compositions `FilmV1`, `FilmV1-Clean`), `tools/foley_lib.py` (new functions only).
- The hook inside V1 is the H1 hook with that one `~` change and a new narration take whose S1–S2 timing matches the old take; the H1 files in `exports/v3/` are untouched.
