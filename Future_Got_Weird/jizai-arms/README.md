# Future Got Weird: Six Robotic Arms (JIZAI ARMS)

A YouTube Short (9:16) on the University of Tokyo's JIZAI ARMS.

## V1 (5 Nov 2026): review render

**Not final and not published.** Nobody has watched it in real time with sound.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 930 frames, **31.000 s**, captions burned in, −14.1 LUFS | `exports/FGW_JIZAI_Arms_V1_REVIEW_1080x1920.mp4` |
| Report: brief QA checklist, scenes, limitations | `production/V1_REPORT.md` |
| Shot and transition list | `production/V1_TRANSITIONS.md` |
| Sources, claim ledger, design basis | `production/SOURCE_NOTES.md` |
| Locked narration (verbatim) | `production/NARRATION_LOCKED.txt` |
| Narration master and word times | `audio/narration/FGW_JIZAI_narration_V1.wav`, `audio/narration/FGW_JIZAI_words_V1.json` |
| Voice provenance (Test Voice, take 1 of 2) | `audio/narration/voice_provenance.json` |
| Mix, measurements, effect cues | `audio/mix/FGW_JIZAI_V1_mix.wav`, `audio/mix/mix_measure_v1.json`, `audio/sfx_cues_v1.json` |
| QA evidence | `qa/v1/` (render QA, ASR, sheets, bursts, loop junction), `qa/verify_rig_v1.json` |
| Source | `source/` (Remotion 4.0.533, composition `JizaiV1`) |

### How it is built

- **One 3D world.** Every joint lives in centimetres in one 3D world, seen through a real orbit and dolly camera
  (`source/src/r3/m3.tsx`).
- **Weird Crew parts.** It is drawn with the channel's own vector parts, copied from Glass Climbing's `src/dc`: the
  crew Head, Hand, Limb, gradient primitives and ink contours.
- **Rig modules:**
  - `r3/body.tsx`: a cast member. The torso is a loft of elliptical cross-sections, so its silhouette and the tee's
    stripes wrap with the camera. Arms are two-bone IK. The harness straps lie on the torso surface.
  - `r3/robot.tsx`: the JIZAI arm. An FK chain runs from the terminal (yaw drum, shoulder, elbow, wrist pitch and
    roll) to a black articulated hand, with IK and a wrist solver. The half-scale controller is the same rig at
    scale 0.5.
  - `r3/harness.tsx`: the base unit with six terminals.
  - `r3/env.tsx`: the lab.
  - `r3/stage.tsx`: a depth-sorted frame.
- **Shots.** `film/s1.ts`, `film/s2to4.ts` and `film/s56.ts` hold time-keyed tracks on the narration clock.

### Rebuild

```sh
cd Future_Got_Weird/jizai-arms
(cd source && npm ci)
python3 tools/make_narration.py   # master + word times (from the take; needs t1_words_raw.json from tools/align_zipformer.py)
python3 tools/make_audio.py       # mix -> audio/mix and source/public/audio/mix_v1.wav
cd source && npx remotion render src/index.ts JizaiV1 /tmp/v.mp4 --props='{"captions":true,"audio":false}' --muted --image-format=png --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4
cd .. && ffmpeg -i /tmp/v.mp4 -i audio/mix/FGW_JIZAI_V1_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest exports/FGW_JIZAI_Arms_V1_REVIEW_1080x1920.mp4
python3 tools/qa_render.py exports/FGW_JIZAI_Arms_V1_REVIEW_1080x1920.mp4 qa/v1 <sherpa-onnx model root>
```

**Rig QA:**

```sh
source/node_modules/.bin/esbuild tools/qa/verify_rig.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/vr.js && node /tmp/vr.js qa/verify_rig_v1.json
```

**Contact sheets of film times:** `cd source && ./probe.sh out.png "0,1.5,10.3" 5 300`.
