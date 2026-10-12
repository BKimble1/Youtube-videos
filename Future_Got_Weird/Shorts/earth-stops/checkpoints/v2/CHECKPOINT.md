# Checkpoint v2 — the two opening prototypes (E-A v2, E-C), as delivered at `a885fd5`

Preserved on request ("Preserve `a885fd5` as the prototype checkpoint") before the hybrid hook (H1), script, ledger and storyboard were added.

| | |
|---|---|
| Git commit | `a885fd506ced2ffbde33254dd743874f33c4dd4a` (`Earth Stops: point the v1 checkpoint at commit 0783b00 (the tag could not be pushed)`) |
| Pushed checkpoint branch | `claude/fgw-earth-stops-prototype-checkpoint-a885fd5` (verified on `origin` to point at `a885fd5`) |
| Git tag | **Not created on the remote.** Tag pushes were refused earlier in this session (v1 checkpoint, same behaviour). The commit hash and the checkpoint branch are the reference. |
| Restore everything as it was | `git checkout a885fd5` (or `git checkout claude/fgw-earth-stops-prototype-checkpoint-a885fd5`) |
| Restore one file | `git show a885fd5:Future_Got_Weird/Shorts/earth-stops/<path> > <path>` |
| v1 checkpoint (older) | `0783b00`, see `checkpoints/v1/CHECKPOINT.md` |

## What is preserved (unchanged since `a885fd5`: `git diff a885fd5 -- <path>` is empty)
| Path | sha256 |
|---|---|
| `exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4` | `2bf5b9b655b93faa3d531709ff6918f690c925fb139637e08730de306f78fc63` |
| `exports/v2/FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4` | `49621b02b92e2497bf847d2cf707ca459cf1a0d0148004a4fb3254b93f88e5d1` |
| `exports/v2/FGW_EarthStops_EA2_Opening_Silent_NoMarker_1080x1920.mp4` | `76c132ba2778702d5be1278a8a320be7afd7cb38042bca3b856330f1c92db87e` |
| `exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4` | `a8d2490da98fe1582d8ff91ba68e80bc0c6057aeaa5358ad5dd00e8f1bb37e96` |
| `exports/v2/FGW_EarthStops_EC1_Opening_SFX_1080x1920.mp4` | `a8a637d8788b1b37dc546c44a7b6fc2229c16aded54d9dd086b14ac00818ca6e` |
| `exports/v2/FGW_EarthStops_EC1_Opening_Silent_NoMarker_1080x1920.mp4` | `be833ee9f85991615bceacfd21d172a1cde3153ef674a221ab9bdde1c11551f3` |

The v2 source (`source/src/v2/choreo2.ts`, `choreoEC.ts`, `Opening2.tsx`, `OpeningEC.tsx`, …), the v2 audio and QA (`audio/v2/`, `qa/v2/`) and `PROTOTYPE_V2_REPORT.md` are unchanged. Edits made to shared files **after** the checkpoint are additive and backward-compatible: `source/src/Root.tsx` (new `HookH1` compositions), `source/src/v2/Fx2.tsx` (`GroundFx` gains optional `shoeX`, `slideUntil`), `source/src/v2/Bike2.tsx` (`BikeWorld` gains optional `at`), `tools/foley_lib.py` (new functions only). The v2 compositions still typecheck (`npx tsc --noEmit` passes); I did not re-render them to compare bytes.

## Why the v2 prototypes were superseded
The owner chose a hybrid ("E-C's causal connection plus E-A v2's larger street action") on 12 Oct 2026; the hybrid is the H1 hook in `exports/v3/`. E-A v2 and E-C remain for reference.
