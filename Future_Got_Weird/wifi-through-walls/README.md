# Future Got Weird: Wi-Fi Can See Through Walls

## V2 (targeted animation rebuild)

**Status (27 Oct 2026):** V2 review rendered and checked from the file. **Not published.** Same story, narration,
characters and sets as V1; the character animation was rebuilt (FK arms, a new planted-foot walk cycle, a new retreat,
squat, hand raise and ending reach), the café and corridor walkers were reduced and re-staged, the lab-to-café cut became a
signal transition, and footsteps were added to the mix.

| Deliverable | File |
|---|---|
| V2 review: 1080×1920, 30 fps, 1094 frames, 36.47 s | `exports/FGW_WiFi_ThroughWalls_V2_REVIEW_1080x1920.mp4` |
| Change log (what was fixed, shot by shot) | `production/V2_CHANGELOG.md` |
| Rig probe (every walker and every lab frame: foot slip, ankle miss, bone length, elbow direction) | `qa/v2/rig_probe.json` (`tools/v2/rig_probe.ts`) |
| Measured QA of the MP4 | `qa/v2/V2_qa.json`, `qa/v2/V2_motion_scan.json`, `qa/v2/V2_asr_mp4.json`, `qa/v2/V2_phone_ui_sheet.png` |
| Mix and footsteps | `audio/mix/FGW_WiFi_Walls_V2_mix.wav`, `audio/footsteps.json` (`tools/v2/footsteps.ts`), `audio/cues.json` |
| Stills | `stills/FGW_WiFi_V2_*.png` |

`source/` now builds V2 (the composition id is still `WiFiWallsV1`); V1 is in the git history and its MP4 in `exports/`.

## V1

**Status (27 Oct 2026):** V1 review rendered from source and checked from the file (`production/V1_REPORT.md`: checks,
scorecard, remaining issues). **Not published.** Nobody has watched it in real time with sound.

| Deliverable | File |
|---|---|
| V1 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, captions burned in, seamless loop | `exports/FGW_WiFi_ThroughWalls_V1_REVIEW_1080x1920.mp4` |
| Report, scorecard, limitations | `production/V1_REPORT.md` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Approved narration (verbatim) | `production/NARRATION_APPROVED.txt` |
| Final narration (ElevenLabs Test Voice, eleven_v4) and its record | `audio/narration/FGW_WiFi_Walls_narration_final.wav`, `audio/narration/voice_provenance.json`, `audio/narration/takes/` |
| Mix and measurements | `audio/mix/FGW_WiFi_Walls_V1_mix.wav`, `audio/mix/mix_measure.json` |
| Timing data | `audio/narration/words_final.json`, `source/src/data/timeline.json`, `audio/cues.json`, `captions/FGW_WiFi_Through_Walls_V1.srt` |
| Stills | `stills/` (first frame, 1.5 s hook, skeleton reveal, Wi-Fi identification, final frame) |
| Research and accuracy notes | `research/SOURCE_NOTES.md` |
| Upload description draft | `production/UPLOAD_DESCRIPTION_DRAFT.md` |
| QA evidence | `qa/review/` |
| Editable project | `source/` (Remotion 4.0.533; composition `WiFiWallsV1`) |

## Source layout

| Path | What |
|---|---|
| `source/src/Film.tsx`, `Root.tsx` | the composition: lab → café → corridor → café → lab; stills `FilmStill`, `Sheet` (contact sheet), `PoseTest` (working) |
| `source/src/dc/` | the Weird Crew guesser's rig (Death Clock, via Glass Climbing); only addition: `hairStyle` for other people |
| `source/src/world/` | the pinhole camera and flat-plane drawing used by every set |
| `source/src/art/` | character cards, the walk (planted feet), the RF-Pose skeleton (from the rig's own joints) |
| `source/src/scenes/` | `Lab` (hook, A–D, I) with `labSet`/`labHero`; `Cafe` (E, F, H) with `cafeSet`; `Corridor` (G) |
| `source/src/Captions.tsx`, `captions.ts` | channel caption style and per-caption height |
| `tools/` | `make_narration.py`, `align.py`, `script.py`, `make_audio.py`, `qa.py`, `motion_scan.py`, `asr_takes.py`, `asr_mix.py` |

## Rebuild

```sh
cd source && npm ci     # remotion.config.ts points at the preinstalled Chromium headless shell
cd .. && python3 -I tools/make_narration.py      # only if the take or caption chunks change
python3 -I tools/make_audio.py                   # writes source/public/audio/mix.wav (not committed)
cd source && npx remotion render src/index.ts WiFiWallsV1 ../exports/FGW_WiFi_ThroughWalls_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
cd .. && python3 -I tools/qa.py exports/FGW_WiFi_ThroughWalls_V2_REVIEW_1080x1920.mp4 qa/v2/V2
python3 -I tools/asr_mix.py exports/FGW_WiFi_ThroughWalls_V2_REVIEW_1080x1920.mp4 <sherpa-onnx model root> qa/v2/V2_asr_mp4.json
```

ASR models (sherpa-onnx `zipformer-en-2023-06-26` and `whisper-base.en`) come from the k2-fsa GitHub releases.
Contact sheets while working: `cd source && ./sheet.sh out.png "f1,f2,..." [true]`.
Media are plain git blobs (the episode `.gitattributes` turns LFS off, as in the other FGW episodes).
