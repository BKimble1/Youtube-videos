# Future Got Weird: Wi-Fi Can See Through Walls

## V10 (final polish)

**Status (28 Oct 2026):** final, rendered natively at 1080×1920, 30 fps, and checked from the file. It is V9 with three
targeted changes: the opening gesture starts at 0.22 s with the skeleton in exact sync, the skeleton's glow is about
20% softer with stronger caption backing, and the downward movement now runs continuously across the replay cut.

| Deliverable | File |
|---|---|
| **V10 final:** 1080×1920, 30 fps, 1094 frames, 36.48 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V10_FINAL_1080x1920.mp4` |
| Change log, checks | `production/V10_CHANGELOG.md` |
| Editable source | `source/src/v10/` (joins in `source/src/Film.tsx`) |
| QA, mix, timing | `qa/v10/`, `audio/mix/FGW_WiFi_Walls_V10_mix.wav`, `audio/v10_events.json` (`tools/v10/*`) |
| Stills | `stills/FGW_WiFi_V10_*.png` |

`source/` now builds V10. V4–V9's scene code stays in `source/src/v4/` to `v9/`.

## V9 (first-three-seconds and clarity pass)

**Status (28 Oct 2026):** V9 review rendered natively at 1080×1920, 30 fps, and checked from the file. **Not published;
the 4K master has not been made.** It keeps the approved narration (same recording, words, order and timing).

The changes:
- **Opening:** a closer opening of him, the concrete wall and the live screen, with the screen's estimate drawn as a
  generic glowing body. On "behind" he flinches, arms over his head; then he curls into a ball; on "watch you" he
  peeks, and the screen matches each move.
- **Mechanism:** one held radio → wall → him → receiver path, with bold cyan out, a white hit and a yellow echo.
- **Separate study:** the SEPARATE STUDY sign is removed, and the street gains a person-level move.
- **197 result:** a clean "ALMOST EVERYONE IDENTIFIED CORRECTLY" replaces the 197-tile grid.
- **Return visit:** a high-angle view with an animated signature lock (SAME ID: #12).
- **Ending:** the WI-FI echoes start under him, and the loop join keeps the waves continuous.

Remaining limitations are listed at the end of the change log.

| Deliverable | File |
|---|---|
| V9 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V9_REVIEW_1080x1920.mp4` |
| Change log, checks, limitations | `production/V9_CHANGELOG.md` |
| Editable source (V9 scenes) | `source/src/v9/` (joins in `source/src/Film.tsx`; the glowing body in `source/src/art/skeleton.tsx`) |
| Probes, measured QA | `qa/v9/` (`tools/v9/*`) |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V9_mix.wav`, `audio/v9_events.json` (`tools/v9/events.ts`, `tools/v9/make_audio9.py`) |
| Stills | `stills/FGW_WiFi_V9_*.png` |

V9's scene code is in `source/src/v9/`.

## V8 (targeted visual polish)

**Status (28 Oct 2026):** V8 review rendered natively at 1080×1920, 30 fps, and checked from the file. **Not published;
the 4K master has not been made.** It keeps V7's narration recording, words, order, timing and voice. The changes:

- **Opening:** a stable shared composition with one big mirrored gesture (forearms over his head).
- **Mechanism:** a clearer one-pulse mechanism whose echo now reaches the receiver.
- **Creepy turn:** joints only.
- **Separate identity study:** a SEPARATE STUDY cue, and large STORED SAMPLES → NEW SAMPLE → MATCH: #12 with generic
  avatars.
- **197 payoff:** 197 and ALMOST EVERYONE read first, labelled as a schematic illustration.
- **Return visit:** LATER, with SAVED RECORD → NEW SIGNAL → SAME ID.
- **Ending:** a labelled CAMERA vs WI-FI comparison and an exact crouch-to-crouch loop join after the closing caption.

Remaining limitations are listed at the end of the change log.

| Deliverable | File |
|---|---|
| V8 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V8_REVIEW_1080x1920.mp4` |
| Change log, checks, limitations | `production/V8_CHANGELOG.md` |
| Editable source (V8 scenes) | `source/src/v8/` (joins in `source/src/Film.tsx`) |
| Probes, measured QA, voice clarity | `qa/v8/` (`tools/v8/*`) |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V8_mix.wav`, `audio/v8_events.json` (`tools/v8/events.ts`, `tools/v8/make_audio8.py`) |
| Stills | `stills/FGW_WiFi_V8_*.png` |

V8's scene code is in `source/src/v8/`.

## V7 (targeted visual revision)

**Status (28 Oct 2026):** V7 review rendered at 1080×1920 and checked from the file. **Not published. The 4K master
has not been made yet.** It keeps V6's narration, voice, story order and runtime, with these revisions:

- **Hook:** frame 0 is him already ducking behind the wall, the large screen's skeleton ducking with him. Then a
  lateral reveal, the lean, the joint lock and the STILL accent with a peek.
- **Mechanism:** follows one pulse to him and back.
- **Skeleton payoff:** the skeleton is built point by point, then his hand and the skeleton's hand close up.
- **Escalation:** the screen opens into the street.
- **Café experiment:** a split screen of his gait and the receiver matching it.
- **Study:** four participants matched on the data wall, then a wall-size 197 display.
- **Payoff:** the laptop shows his picture.
- **Ending:** the CCTV picture against the Wi-Fi receiver, then a match cut on his duck into frame 0.

Remaining known defects are listed at the end of the change log.

| Deliverable | File |
|---|---|
| V7 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V7_REVIEW_1080x1920.mp4` |
| Change log and remaining defects | `production/V7_CHANGELOG.md` |
| Source (V7 scenes) | `source/src/v7/` (joins in `source/src/Film.tsx`) |
| Probes, measured QA | `qa/v7/` (`tools/v7/cam_probe.ts`, `face_probe.ts`, `rig_probe7.ts`, `pop_scan.py`) |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V7_mix.wav`, `audio/v7_events.json` (`tools/v7/events.ts`, `tools/v7/make_audio7.py`) |
| Stills | `stills/FGW_WiFi_V7_*.png` |

V7's scene code is in `source/src/v7/`.

## V6 (cinematic stability and character rig pass)

**Status (28 Oct 2026):** V6 review rendered and checked from the file. **Not published.** It keeps V5's narration,
voice, subtitles, story order, runtime and characters, with steadier cameras:
- **Camera motion:** mean camera motion is down from 15.3 to 3.85 px per frame, and frames moving 15 px or more are
  down from 409 to 42.
- **Café geometry:** every café shot is from the street side, so he always walks screen-left.
- **Street CCTV:** a fixed camera on the lamp post.
- **Ending:** the camera and Wi-Fi comparison shares one frame, then a still, seamless return to frame 0.
- **Eyes:** glances are eased.

Remaining known defects are listed at the end of the change log.

| Deliverable | File |
|---|---|
| V6 review: 1080×1920, 30 fps, 1094 frames, 36.47 s, H.264 + AAC | `exports/FGW_WiFi_ThroughWalls_V6_REVIEW_1080x1920.mp4` |
| Change log and remaining defects | `production/V6_CHANGELOG.md` |
| Source (V6 scenes) | `source/src/v6/` (joins in `source/src/Film.tsx`) |
| Camera, face and rig probes, measured QA | `qa/v6/` (`tools/v6/cam_probe.ts`, `face_probe.ts`, `rig_probe6.ts`, `pop_scan.py`) |
| Mix, sound-event timing | `audio/mix/FGW_WiFi_Walls_V6_mix.wav`, `audio/v6_events.json` (`tools/v6/events.ts`, `tools/v6/make_audio6.py`) |
| Stills | `stills/FGW_WiFi_V6_*.png` |

V6's scene code is in `source/src/v6/`.

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

V5's scene code is in `source/src/v5/` (to build it, point `Film.tsx`'s imports back at it).

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
