# Future Got Weird Short 2: The Zombie Snail Parasite

## V2 (current, release candidate)

**Deliverable.** `exports/FGW_Zombie_Snail_V2_1080x1920.mp4`: 1080×1920, 30 fps, 746 frames, 24.875 s.
**It is not published.** It is not marked final until someone watches it in real time.

**Report and QC.** `production/V2_REPORT.md`, with evidence in `qa/v2/`.

**What V2 changes.** It is a major visual and retention upgrade over V1:
- a startling extreme close-up as the first frame;
- anatomical cutaways of the eyestalk and the body;
- a fast, foot-anchored bird strike;
- a camera that follows the parasite through the bird;
- another snail that touches the dropping, then blooms into frame 0.

**Unchanged.** The narration and word timings.

**Source.** `source/src/`, composition `ZombieSnailV2`; mix `mix_v2`.

## V1 (superseded)

**Deliverable.** `exports/FGW_Zombie_Snail_V1_1080x1920.mp4`: native 1080×1920, 30 fps, 746 frames, 24.875 s,
H.264 CRF 16, AAC 320 kb/s. **It is not published.**

**Script.** `production/NARRATION_LOCKED.txt`: the approved narration, word for word. The one change, "crawls" became
"grows", was approved before production (option A).

**QC.** `QA_REPORT.md` is the timestamped quality-control report. Its evidence is in `qa/v1/`: measured motion,
loop seam and hook figures, ASR of the final track, frame-by-frame strips of the hook, dive, landing, peck and loop,
and an every-second overview.

**Narration.** One ElevenLabs run (two takes) with the channel narrator voice. The take is used untouched. Its provenance
is in `audio/narration/voice_provenance.json`.

**Source.** Remotion, at commit `902b269`, composition `ZombieSnailV1`. The source tree now holds V2.

| Path | What it holds |
|---|---|
| `story.ts` | Timeline (every beat keyed to measured word times), character states and the camera |
| `Scene.tsx` | Depth layers projected by a dolly camera, with depth of field |
| `art/snail.tsx`, `art/stalk.tsx` | The amber snail and the healthy/infected eyestalk |
| `art/bird.tsx` | The songbird |
| `art/env.tsx` | Leaves, twigs, dropping, caterpillar, forest |
| `art/micro.tsx` | Egg, sac interior, snail and bird interiors |

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    python3 tools/make_narration.py                       # take -> narration master, timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1                    # effects + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts ZombieSnailV1 ../exports/FGW_Zombie_Snail_V1_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases:
`tools/asr_sherpa.py <audio> <model_root>`.
