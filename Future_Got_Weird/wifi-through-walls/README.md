# Future Got Weird: Wi-Fi Can See Through Walls

## V5 (targeted final revision)

**Status (28 Oct 2026):** V5 review rendered and checked from the file. **Not published.** It keeps the same
narration, voice, captions, story order, ending question and runtime as V4. The revisions:

- **Opening:** his arm move is matched by the skeleton within the first second; then the move to the wall, his face,
  and the echoes' path through the concrete to the screen.
- **Mechanism:** one connected path, with raw traces until "AI creates".
- **Demo:** his action, then the reconstruction, then the side-by-side comparison.
- **Café experiment:** the push in at the router, then a split screen of him walking with the receiver's laptop
  matching his steps.
- **Study:** the corridor walk becomes the matching screen, and the results are tiles of people. The zoom into his
  tile becomes him walking past the café.
- **Payoff:** a window cutaway to the match, then back to him, unaware.
- **Ending:** the CCTV picture, then the Wi-Fi receiver with no camera, then screen to screen into frame 0.

| Deliverable | File |
|---|---|
| V5 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V5_REVIEW_1080x1920.mp4` |
| Change log | `production/V5_CHANGELOG.md` |
| Source (V5 scenes) | `source/src/v5/` (joins in `source/src/Film.tsx`) |
| Rig probe, measured QA | `qa/v5/` (`tools/v5/rig_probe5.ts`, `tools/v5/pop_scan.py`) |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V5_mix.wav`, `audio/v5_events.json` (`tools/v5/events.ts`, `tools/v5/make_audio5.py`) |
| Stills | `stills/FGW_WiFi_V5_*.png` |

`source/` now builds V5. V4's scene code stays in `source/src/v4/` (to build it, point `Film.tsx`'s imports back at
it).

## V4 (polish pass)

**Status (28 Oct 2026):** V4 review rendered and checked from the file. **Not published.** Same narration, voice,
story order and ending question. Every shot is rebuilt:

- **Opening:** a cross-section of a concrete wall, with him on one side and the detector already tracking him on the
  other. The camera travels through the wall.
- **Mechanism:** tracked radio packets and echoes, not rings or diagrams.
- **Live demo:** a right-hand raise and a turn, step and crouch, all matched by the skeleton.
- **Café:** the skeleton becomes a silhouette that walks into a café street. The café experiment runs on its own
  router and receiver.
- **197 study:** a corridor of walkers, then the matching screen and the grid.
- **Café, reverse angle:** seen again from inside.
- **Ending:** CCTV versus Wi-Fi, then back into frame 0.

| Deliverable | File |
|---|---|
| V4 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V4_REVIEW_1080x1920.mp4` |
| Change log | `production/V4_CHANGELOG.md` |
| Source (V4 scenes) | `source/src/v4/` (joins in `source/src/Film.tsx`) |
| Rig probe | `qa/v4/rig_probe.json` (`tools/v4/rig_probe4.ts`) |
| Measured QA of the MP4 | `qa/v4/V4_qa.json`, `qa/v4/V4_motion_scan.json`, `qa/v4/V4_asr_mp4.json` |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V4_mix.wav`, `audio/v4_events.json` (`tools/v4/events.ts`), `tools/v4/make_audio4.py` |
| Stills | `stills/FGW_WiFi_V4_*.png` |

V4's scene code is in `source/src/v4/` (the composition id is still `WiFiWallsV1`). To rebuild V4, run the same steps as in
**Rebuild** below, with these substitutions:

- Sound timing: `tools/v4/events.ts` → `audio/v4_events.json`.
- Mix: `python3 -I tools/v4/make_audio4.py`.
- Output name: `..._V4_REVIEW_...`.

## V3 (visual rebuild)

**Status (28 Oct 2026):** V3 review rendered and checked from the file. **Not published.** Same narration, voice, story
order and ending question. V3 rebuilds the picture:

- A new hook: he ducks behind a concrete wall while the radio's skeleton keeps tracking him, beside a security
  camera's picture that has lost him.
- Wave physics through the concrete, and the receiver reacting to the echoes.
- A progressively built skeleton and one coherent hand raise.
- A light-match escalation into an ordinary Wi-Fi router.
- A café with a visible signal → signature → compare → match chain.
- Two distinct study participants, then the 197 grid.
- An ending that compares the camera with Wi-Fi and loops into frame 0.

| Deliverable | File |
|---|---|
| V3 review: 1080×1920, 30 fps, 1094 frames, 36.47 s | `exports/FGW_WiFi_ThroughWalls_V3_REVIEW_1080x1920.mp4` |
| Change log, shot list as built, checks, limits | `production/V3_CHANGELOG.md` |
| Source (V3 scenes) | `source/src/v3/` (joins in `source/src/Film.tsx`) |
| Rig probe | `qa/v3/rig_probe.json` (`tools/v3/rig_probe3.ts`) |
| Measured QA of the MP4 | `qa/v3/V3_qa.json`, `qa/v3/V3_motion_scan.json`, `qa/v3/V3_asr_mp4.json`, `qa/v3/V3_phone_ui_sheet.png` |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V3_mix.wav`, `audio/v3_events.json` (`tools/v3/events.ts`), `audio/cues.json` |
| Stills | `stills/FGW_WiFi_V3_*.png` |

`source/` now builds V3 (the composition id is still `WiFiWallsV1`). The V1 and V2 MP4s are in `exports/`, and their
source is in the git history.

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
(cd source && npx esbuild ../tools/v3/events.ts --bundle --platform=node --outfile=/tmp/ev.js && node /tmp/ev.js ../audio/v3_events.json)   # sound-event timing from the picture
python3 -I tools/make_audio.py                   # writes source/public/audio/mix.wav (not committed)
cd source && npx remotion render src/index.ts WiFiWallsV1 ../exports/FGW_WiFi_ThroughWalls_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
cd .. && python3 -I tools/qa.py exports/FGW_WiFi_ThroughWalls_V3_REVIEW_1080x1920.mp4 qa/v3/V3
python3 -I tools/asr_mix.py exports/FGW_WiFi_ThroughWalls_V3_REVIEW_1080x1920.mp4 <sherpa-onnx model root> qa/v3/V3_asr_mp4.json
```

ASR models (sherpa-onnx `zipformer-en-2023-06-26` and `whisper-base.en`) come from the k2-fsa GitHub releases.
Contact sheets while working: `cd source && ./sheet.sh out.png "f1,f2,..." [true]`.
Media are plain git blobs (the episode `.gitattributes` turns LFS off, as in the other FGW episodes).
