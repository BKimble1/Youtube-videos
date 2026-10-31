# Future Got Weird: Myostatin, the muscle growth limiter

## V1 (review)

**Deliverable.** `exports/FGW_Myostatin_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 737 frames, 24.567 s.
It is H.264 CRF 16 with AAC 320 kb/s audio. **It is not published.**

**Report and QA.** `production/V1_REPORT.md`, with evidence in `qa/v1/`. The shot plan and the transition list
are in `production/SHOT_PLAN_V1.md`.

**Narration.** `production/NARRATION_LOCKED.txt`, word for word. It was one ElevenLabs run (two takes) with the channel
narrator voice. The only edit is shortening seven sentence gaps, 1.59 s in all. Provenance is in
`audio/narration/voice_provenance.json`.

**Picture.** Deterministic Remotion/SVG, in the FGW vector finish: ink contours, cel shading and an upper-left key
light. There are four worlds, joined by continuous zooms through cutaways:

| World | What it holds | Source |
|---|---|---|
| The character (cm) | The side-view rig: the humerus, elbow and shoulder are fixed and only the soft-tissue profiles swell. It includes the seam tear, the skin cutaway, the elbow cutaway (biceps, tendon, radius, ulna) and the translucent view. | `source/src/art/person.tsx` |
| The muscle (u) | Fascicles → fibres → sarcomeres → one fibre's myofibrils, nucleus, receptors, myostatin, antibodies | `source/src/art/micro.tsx` |
| The bull (cm) | The Belgian Blue, its step, the hide cutaway, the silhouette comparison | `source/src/art/bull.tsx` |
| The lab (cm) | The researcher, the dish and sample, the pipette and drop | `source/src/art/lab.tsx` |

`source/src/story.ts` holds the timeline (every beat keyed to measured word times), all states and the one camera.
`source/src/Scene.tsx` holds the depth layers and the nesting.

**Sound.** Everything is synthesised and placed from the picture's events: `tools/make_audio.py`, `audio/cues.json`
and `audio/sfx_log_mix_v1.json`.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    python3 tools/make_narration.py                       # take -> narration master (gap edits), timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1                    # effects + music + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts MyostatinV1 ../exports/FGW_Myostatin_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Myostatin_V1_REVIEW_1080x1920.mp4 qa/v1

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

The ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases:
`tools/asr_sherpa.py <audio> <model_root>`.
