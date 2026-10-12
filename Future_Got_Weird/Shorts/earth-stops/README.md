# Earth Stops. You Don't. — opening prototypes (Future Got Weird Short)

**Status: opening prototypes only (owner-approved scope: `handoff/OWNER_APPROVAL_PROTOTYPE.md`, then `handoff/OWNER_APPROVAL_V2_REVISION.md`). Not a Short. Not uploaded, not scheduled, do not publish.** No script, narration, music or Runway work exists. Production is paused for the owner's decision between the two alternatives below.

Native **1080 × 1920, 30 fps**, **75 frames = 2.50 s** each. Branch `claude/fgw-earth-stops-short`, created from the Atlas tip `3634cc5` (`claude/pensive-mendel-3j0xsc`). Atlas and murder-tip work is untouched.

**Start with `PROTOTYPE_V2_REPORT.md`** (what was done, comparison, recommendation, exactly what was and was not inspected).

## The two alternatives (v2)
| | E-A v2 | E-C (minimal) |
|---|---|---|
| Idea | She is already mid-fling at frame 0. Side-view hero, tapered coffee stream, a riderless bicycle that keeps going against lamp posts and a palm that never move; the camera brakes at 0.67–1.13 s and the street goes still | A globe is the visible cause: it spins (blurred), stops dead at 0.27 s with a coral pulse, and she (same scene, same hero, same coffee) is flung from 0.30 s; the camera brakes at 1.0–1.47 s |
| Silent | `exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4` | `exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4` |
| With procedural SFX | `exports/v2/FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4` | `exports/v2/FGW_EarthStops_EC1_Opening_SFX_1080x1920.mp4` |
| No WHAT IF tag | `..._EA2_Opening_Silent_NoMarker_...mp4` | `..._EC1_Opening_Silent_NoMarker_...mp4` |
Exact export metadata (verbatim ffprobe, sha256, commands): `exports/v2/EXPORT_METADATA.json` and `.md`.

## Files
| Path | What |
|---|---|
| `PROTOTYPE_V2_REPORT.md` | v2 report, comparison, recommendation, inspected / not inspected |
| `PRODUCTION_STATE.md` | state, open decisions, recommended next step |
| `checkpoints/v1/` | **v1 checkpoint**: commit `0783b00` (in the pushed branch history), sha256 of the v1 mp4s, verbatim copies of the v1 docs |
| `FGW_EarthStops_EA_Opening_*.mp4`, `exports/FGW_EarthStops_EA_Opening_Silent_NoMarker_*.mp4` | v1 deliverables, unchanged |
| `qa/v2/` | `QA_MEASUREMENTS_V2.json`, `AUDIO_MEASUREMENTS_V2.json`, `probe_ea2.json`, `probe_liquid_v2.json`, `sheets/` (all 75 frames of each clip, phone-width key frames, spectrograms), `keyframes/` (full-res), `lab/PoseLab2_0000.png` (side-pose test vs approved reference) |
| `audio/v2/` | `cues_<variant>.json`, per-variant `sfx/*.wav`, `stems/*.wav` (incl. `effects_<variant>.wav`), `SFX_LOG.csv` |
| `source/` | editable Remotion project (pinned deps, lockfile); v2 code in `source/src/v2/`, v1 in `source/src/opening/` |
| `tools/` | v2: `build_cues_v2.mjs`, `build_audio_v2.py`, `foley_lib.py`, `qa_v2.py`, `qa_audio_v2.py`, `probe_ea2.mjs`, `probe_liquid_v2.mjs`, `export_metadata_v2.py` · v1: `*_opening.*`, `probe_choreo.mjs` |
| `credits.md`, `handoff/` | provenance; the owner's approval records |

## Rebuild (v2)
```bash
cd source && npm ci                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3 (+ fontsource 5.3.0)
npx tsc --noEmit
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # headless *shell* is required
F="--crf=16 --x264-preset=slow --color-space=bt709 --browser-executable=$HS --concurrency=4 --muted"
for c in EA2 EC1 EA2-NoMarker EC1-NoMarker; do npx remotion render src/index.ts $c ../qa/v2/render/${c}_silent_raw.mp4 $F; done   # then copy to exports/v2/ with the names in EXPORT_METADATA.md
cd ..
node tools/build_cues_v2.mjs ea2 && python3 tools/build_audio_v2.py ea2     # cues from the same choreography as the picture; numpy-only Foley
node tools/build_cues_v2.mjs ec1 && python3 tools/build_audio_v2.py ec1
ffmpeg -y -i exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4 -i audio/v2/ea2/stems/effects_ea2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v2/FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4   # likewise EC1
python3 tools/qa_v2.py && python3 tools/qa_audio_v2.py && node tools/probe_liquid_v2.mjs qa/v2/probe_liquid_v2.json && python3 tools/export_metadata_v2.py
node source/scripts/frames.mjs <outDir> EA2 0,12,30 1                     # individual frames (run from source/: node scripts/frames.mjs ...)
```
Compositions: `EA2`, `EA2-NoMarker`, `EC1`, `EC1-NoMarker`, stills `PoseLab2` (side-pose test) and `PoseLab`; the v1 compositions (`OpeningEA`, `OpeningEA-NoMarker`, `OpeningEA-Bike`, `DirTest-*`) still render. Composition ids cannot contain underscores. To reproduce v1 exactly: `git checkout 0783b00`.

## How v2 is built
- `src/v2/events2.json` (E-A) and `eventsEC.json` (E-C, `t0 = 10`) are the timed-event tables; `choreo2.ts` / `choreoEC.ts` make every position (hero joints, mug, 46 coffee parcels, camera, zoom, bicycle) a pure function of the frame. The picture, `probe_ea2.mjs`, `probe_liquid_v2.mjs` and the audio cue builder read the same functions.
- `side.tsx`: side/three-quarter rig of the same cast member (forward kinematics, hips-on-ground foot planting). `props.tsx`: mug. `Street2.tsx`: facades, curb, anchored lamps/palms, pan-blur that scales with camera speed (none when the camera is still). `Fx2.tsx`: dust, skid marks, stains, tapered coffee ribbon + droplets. `Bike2.tsx`: bicycle. `Opening2.tsx`: `Scene2` (one frame of the street scene) and the E-A composition. `Globe.tsx` + `OpeningEC.tsx`: the E-C globe and the scaled, clipped street panel.
- `src/components/Character.tsx` is the Atlas rig plus optional `legL`/`legR`/`footFlat` (v1); the v2 side rig is a new component that uses the same `Look` (colours) and segment lengths.
- Fonts: Barlow Condensed (tag). The Atlas caption system is carried by `src/fonts4.ts` and the Atlas tip; it is not used until there is narration to caption.

## Claims
The prototypes state no numbers and no scientific claims on screen. The only implicit claim is the premise (an impossible instant stop of the solid Earth; loose objects keep their motion), stipulated as hypothetical by the in-scene WHAT IF tag. E-C additionally draws a stylised planet with abstract landmasses (not a map). A claim ledger belongs to the script stage.
