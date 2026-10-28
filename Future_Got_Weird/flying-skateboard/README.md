# Future Got Weird: Flying Skateboard (Song Xingyu / 神奇阿宇 "Amazing Ayu")

## V2 review (28 Oct 2026)

**Status:** V2 is rendered and checked from the file. **Not published.** As with V1, nobody has watched it in real time or listened to it here: there is no playback in this environment. `production/QA_REPORT_V2.md` lists what was checked, against the V2 brief's QC list.

| Deliverable | File |
|---|---|
| **V2 review video**: 1080×1920, 30 fps, 1077 frames, 35.90 s, H.264 High CRF 16 + AAC 320 kb/s, captions burned in, seamless loop | `exports/FGW_Flying_Skateboard_V2_REVIEW_1080x1920.mp4` |
| Narration | unchanged from V1 (the same WAV, sample for sample) |
| V2 mix, measurements, effect cue list | `audio/mix/FGW_Flying_Skateboard_V2_mix.wav`, `audio/mix/mix_measure_v2.json`, `audio/sfx_cues_v2.json`, `audio/mix/stems_v2/` |
| V2 picture timing for the mix | `audio/cues_v2.json` (`tools/export_cues_v2.ts`) |
| Contact sheets (from the MP4) | `qa/v2_review_sheet_*.png`: first three seconds, fire, balance, payoff, loop, every cut, every second |
| QA measurements | `qa/v2_review_qa.json` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS_V2.md` |
| Where V2 follows its brief over the verified facts | `production/SOURCE_NOTES.md` (section "V2") |
| QA summary | `production/QA_REPORT_V2.md` |
| Remotion project | `source/` (composition `FlyingSkateboardV2`; V2 code in `source/src/v2/`, new assets `art/Monitor.tsx`, `fx/Section.tsx`, `env/Gorge.tsx`) |

V2 rebuild (after the V1 steps for narration):

```sh
source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec2.cjs && NODE_PATH=source/node_modules node /tmp/ec2.cjs audio/cues_v2.json
python3 tools/make_audio_v2.py              # writes source/public/audio/mix_v2.wav and audio/mix/
(cd source && npx remotion render src/index.ts FlyingSkateboardV2 ../exports/FGW_Flying_Skateboard_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=medium --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
python3 tools/qa.py exports/FGW_Flying_Skateboard_V2_REVIEW_1080x1920.mp4 qa/v2_review audio/cues_v2.json
```
V2 working stills: `cd source && ./sheet2.sh out.png "t1,t2,..." [captions]`.

## V1 review (27 Oct 2026)

**Status:** the first complete version is rendered and checked from the file. **Not published.** Nobody has watched it in real time or listened to it here: there is no playback in this environment. `production/QA_REPORT.md` lists exactly what was checked, what was fixed and what remains.

| Deliverable | File |
|---|---|
| **V1 review video**: 1080×1920, 30 fps, 1077 frames, 35.90 s, H.264 High CRF 16 + AAC 320 kb/s, captions burned in, seamless loop | `exports/FGW_Flying_Skateboard_V1_REVIEW_1080x1920.mp4` |
| Locked narration (verbatim) | `production/NARRATION_APPROVED.txt` |
| Final narration (48 kHz, 24-bit, mono) and word timings | `audio/narration/FGW_Flying_Skateboard_narration_V1.wav`, `audio/narration/FGW_Flying_Skateboard_V1_words.json` |
| Both takes, Scribe transcripts, voice provenance | `audio/narration/takes/`, `audio/narration/voice_provenance.json` |
| Mix (48 kHz, 24-bit, stereo), measurements, effect cue list | `audio/mix/FGW_Flying_Skateboard_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json` |
| Captions | `captions/FGW_Flying_Skateboard_V1.srt` (also burned in) |
| Contact sheets (from the MP4) | `qa/v1_review_sheet_*.png`: first three seconds, fire, balance, payoff, loop, every second |
| QA measurements | `qa/v1_review_qa.json` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Sources, accuracy, what could not be verified | `production/SOURCE_NOTES.md` |
| QA summary | `production/QA_REPORT.md` |
| Remotion project | `source/` (composition `FlyingSkateboardV1`) |

Narration: the channel narrator, ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), take 1 of 2. It was chosen for its stronger measured emphasis on FLY, FIRE, CANYON and PAY YOU.

## How it is built

- **A projected 3D set, drawn as 2D vector art** (`source/src/eng/`): a perspective lens, near-plane clipping, hulls and sphere patches.
  - Every shape is drawn in the crew finish: a key-light gradient and a thin ink contour from the channel's own `dc/` primitives.
  - Camera moves therefore get real parallax and perspective, and the board keeps one geometry from every angle.
- **Cast and assets** (`source/src/art/`):
  - `Board.tsx`: the electric board, ten ducted fans, the one locked definition (`BD`);
  - `JetBoard.tsx`: the five-turbojet prototype;
  - `rig.ts`: the pilot's 3D joint rig (planted feet, IK legs and arms, spine following the centre of mass);
  - `Pilot.tsx`: his drawing (helmet and visor, jacket, gloves, earpiece, wrist phone, controller).
- **Sets** (`source/src/env/`): `River.tsx` (Yangtze at Badong: gorge ridges, terraced town, the bridge, water), `Field.tsx` (the practice field and shed), `Workshop.tsx`, `Canyon.tsx`.
- **Effects** (`source/src/fx/`): airflow, fire, exhaust, smoke, recirculation, wipes.
- **Story** (`source/src/story/`):
  - `flight.ts`: flight dynamics in which the body leads and the board's pitch and roll are a lagged response;
  - `shots.tsx`: the shot list; every boundary comes from the measured narration via `T('phrase')` in `time.ts`;
  - `cam.ts`: Hermite camera splines, so moves carry their velocity through keys;
  - `capPlace.ts`: automatic caption placement.
- **Sound** (`tools/make_audio.py`): an original synthesised score (D minor, 72 beats that wrap at the loop) and synthesised effects, placed from the picture's cue export (`tools/export_cues.ts`). Voice at −17 LUFS, mix at −14 LUFS.

## Rebuild

```sh
cd Future_Got_Weird/flying-skateboard
python3 -m pip install numpy scipy soundfile pyloudnorm pillow
(cd source && npm ci)                       # Remotion 4.0.533; remotion.config.ts points at the preinstalled Chromium
python3 tools/make_narration.py             # take 1 -> final WAV, word timings, timeline.json, SRT
source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
python3 tools/make_audio.py                 # writes source/public/audio/mix_v1.wav and audio/mix/
(cd source && npx remotion render src/index.ts FlyingSkateboardV1 ../exports/FGW_Flying_Skateboard_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=medium --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
python3 tools/qa.py exports/FGW_Flying_Skateboard_V1_REVIEW_1080x1920.mp4 qa/v1_review
```

Working stills:
- `cd source && ./sheet.sh out.png "t1,t2,..." [captions]` renders up to 12 film times at full resolution, downsampled.
- The `FilmStill` composition renders one time (`--props='{"t":2.5,"captions":false}'`).
- `RigTest` shows the pilot and board from eight angles.

A clean (caption-free) version: `--props='{"audio":"mix_v1","captions":false}'`.
