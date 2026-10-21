# Future Got Weird: SpaceX Wants to Catch Its ENTIRE Rocket

**Status: V2 review cut (1920×1080, 30 fps), ElevenLabs Test Voice narration, real SpaceX footage inserts. Not published.
4K master not rendered (waits for owner review).** V1 (temporary espeak voice) is kept recoverable: composition `Main`,
`backup/v1/`, and all V1 files below the V2 section.

## V2 (current)

| Deliverable | Where |
|---|---|
| Review video | `exports/FGW_Starship_Dual_Catch_V2_REVIEW_1080p.mp4` (Git-ignored); checksummed parts in `backup/v2/` (`RESTORE.txt`) |
| Change note (runtime, voice, footage, open issues) | `FGW_Starship_Dual_Catch_V2_CHANGE_NOTE.md` |
| Final narration text with timecodes | `script/v2_narration_final.md` (generation prompts with direction tags: `script/v2_narration.json`) |
| Captions (measured word timing) | `captions/FGW_Starship_Dual_Catch_V2.srt` |
| QA (measured) | `qa/v2/qa_v2_results.json`, sheets and join strips in `qa/v2/review/` |
| Editable source | `source/src/v2/` — composition `MainV2`; hardware model sheet `V2Lab` (props `{"page":0|1|2}`) |

### V2 source layout (`source/src/v2/`)

- `vehicles.tsx` — `Ship` and `Booster` as true cylinders seen from any azimuth (`az`): heat-shield tile band, forward and
  aft flaps with deflection, support fittings, ring welds, 3 sea-level + 3 vacuum Raptors, local reentry heating;
  `Booster` V3 (three larger fins, catch features, integrated hot-stage ring) or Flight 5-era (four fins, catch pins);
  `ShipEngineView` (end-on engine plane) and `FinTopView` (oblique top view of the grid fins).
- `cam3.ts` — small orthographic 3D camera (yaw/pitch/roll) shared by the tower, arms, mount and vehicles.
- `site.tsx` — lattice mast, carriage, two deep trussed arms (swing and carriage travel are separate parameters), receiving
  rails, retracted quick-disconnect arm, Pad 2-style mount over a flame trench, tank farm, hardstand, horizon.
- `scene.tsx` — skies, clouds, Earth limb, sea, credits, the few on-screen words.
- `timeline.tsx` — shot timeline with cut/fade/dip/flash and the tower-column wipe; `Footage` (real clips, per-shot crop,
  gentle grade, no interpolation). `HAS_OCEAN_CLIP` switches the ocean-return slot to `03_Flight14_OceanReturn_4K.mp4`.
- `time.ts` + `data/narr.json` — every cue is a measured word time from the narration.
- `shots/` — `s0s1` (hook, two vehicles), `s2s3` (what catches it, orbit/reentry), `s4s5s6` (flip, the machine, three
  changes), `s7s8s9` (approach decision, why, finale + end card), `common.tsx`.

### Rebuild V2

    cd Future_Got_Weird/spacex-wants-to-catch-its-entire-rocket
    pip install numpy scipy soundfile pyloudnorm
    bash tools/v2_fetch_footage.sh                 # real clips from the "Flight-Footage" release, SHA-256 checked
    python3 tools/v2_concat_picks.py               # picked takes (audio/v2/picks.json) → picks_concat.wav
    python3 tools/v2_build_voice.py                # placement plan (audio/v2/plan.json) + Scribe words → narration.wav, narr.json
    python3 tools/v2_audio_mix.py                  # score + effects + voice → source/public/audio/v2/mix.wav (−15 LUFS)
    python3 tools/v2_make_srt.py                   # captions + script/v2_narration_final.md
    (cd source && npm ci)
    bash tools/v2_render.sh                        # chunked 1080p render + mux → exports/FGW_Starship_Dual_Catch_V2_REVIEW_1080p.mp4
    python3 tools/v2_qa.py                         # measurements, contact sheets, join strips

Re-rendering pictures never calls ElevenLabs: the takes are cached in `audio/v2/takes/` (generation ids in the file names)
and the Scribe word timing in `audio/v2/scribe/`.

V2 4K master (after approval): `cd source && npx remotion render src/index.ts MainV2 /tmp/v2_4k.mp4 --props='{"audio":false}' --scale=2 --crf=17 --color-space=bt709 --concurrency=2`
(render in chunks with `--frames` as in `tools/v2_render.sh`), then mux `public/audio/v2/mix.wav`. The 4K clip
`02_Flight14_Reentry_4K.mp4` is native 4K; the Flight 5 clip is 1080p and will be upscaled in a 4K master.

---

## V1 (superseded, kept for recovery)

V1: review cut 6:54, temporary local voice (espeak-ng) — see `FGW_Starship_Dual_Catch_QA.md`.

| Deliverable | Where |
|---|---|
| Review video | `exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4` (Git LFS) |
| Subtitles (measured timing) | `captions/FGW_Starship_Dual_Catch_V1.srt` |
| Thumbnail 1280×720 | `thumbnail/FGW_Starship_Dual_Catch_Thumbnail.png` (alt layout `thumbnail/thumb_B.png`) |
| Narration script (timed) | `FGW_Starship_Dual_Catch_Script.md` (source text `script/narration.json`) |
| Sources, claim ledger, reference bible, hooks, titles | `FGW_Starship_Dual_Catch_Sources.md` |
| QA report | `FGW_Starship_Dual_Catch_QA.md`, measurements `qa/qa_results.json`, sheets `qa/sheets/` |
| Editable source | `source/` (Remotion 4, React, SVG; composition `Main`, stills `ThumbA`, `ThumbB`, `AssetSheet`) |

## Source layout (`source/src/`)

- `assets/vehicles.tsx` — `Booster` (V3 three-fin / V1 four-fin), `Ship` (profile / belly / three views), `Plume`, catch-point constants.
- `assets/tower.tsx` — `TowerFrame`, `Carriage`, `Arm`, `Tower`, `Mount`, `Ground`, `PlanView`, `VehiclePlan`.
- `assets/env.tsx` — `Frame`, `World` camera (metres → px), parallax, skies, clouds, sea, Earth, stars.
- `kit/` — deterministic timing (`anim.ts`: narration line/word times), labels/chips (`ui.tsx`), the catch set-piece (`catch.tsx`), shot timeline + transitions (`timeline.tsx`).
- `shots/` — `Hook`, `Stack`, `BoosterSec`, `OrbitSec` (incl. reentry), `TowerSec`, `EndSec` (risks + payoff).
- Every shot boundary and animation cue is derived from the measured narration (`src/data/narration_*.json`), so a new voice track re-times the whole film automatically.

## Rebuild

    cd Future_Got_Weird/spacex-wants-to-catch-its-entire-rocket
    pip install numpy scipy soundfile espeakng-loader pyloudnorm
    python3 tools/tts_espeak.py                       # temporary voice + word timings -> audio/narration/
    cp audio/narration/narration_{lines,words}.json source/src/data/
    python3 tools/audio_mix.py                        # score + effects + mix -> source/public/audio/mix.wav (-15 LUFS)
    python3 tools/speech_mask.py                      # speech-band voice-vs-bed check
    python3 tools/make_srt.py                         # captions from measured word timings
    (cd source && npm ci)
    (cd source && npx remotion render src/index.ts Main ../exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4 --props='{"audio":"mix"}' --crf=18 --color-space=bt709 --audio-bitrate=320k)
    (cd source && npx remotion still src/index.ts ThumbA ../thumbnail/FGW_Starship_Dual_Catch_Thumbnail.png)
    python3 tools/qa.py                               # measured QA + contact sheets

Stills: `cd source && SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.

### Swapping in the approved narrator

Generate the same lines (`script/narration.json`) with the FGW ElevenLabs Test Voice, stitch them with the scripted
gaps, write `audio/narration/narration_review.wav` plus `narration_lines.json` / `narration_words.json` in the same
format (e.g. from an ElevenLabs/Scribe transcription with word times), then rerun the mix, SRT and render steps.
