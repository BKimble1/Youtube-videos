# Future Got Weird: SpaceX Wants to Catch Its ENTIRE Rocket

**Status: V1 review cut (1920×1080, 30 fps). Not published. 4K master not rendered (waits for owner review).**
Narration is a **temporary local voice (espeak-ng)**, not the FGW ElevenLabs narrator — see `FGW_Starship_Dual_Catch_QA.md`.

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
