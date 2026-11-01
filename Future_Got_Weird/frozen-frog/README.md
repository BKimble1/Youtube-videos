# Future Got Weird: The Frog That Freezes and Revives

## V2 (review, current)

**Deliverable.** `exports/FGW_Frozen_Frog_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 735 frames, 24.5 s.
**It is not published.**

**Report.** `production/V2_REPORT.md`, with evidence in `qa/v2/`. The brief-by-brief changes and the transition list
are in `production/SHOT_PLAN_V2.md`. The source is composition `FrozenFrogV2`, mix `mix_v2`
(`python3 tools/make_audio.py mix_v2`). The narration is unchanged.

**What changed.**
- A living, moving opening with a sweeping ice wave.
- The final heartbeat at 1.336 s, followed by a hard audio cut.
- An ice spear threatening one cell.
- A bloodstream view of glowing glucose and the same cell's protection, in a new composition.
- A legible passage of days.
- A powerful first pulse, with circulation racing back out.
- The eyes opening.
- A leap toward the camera that lands in frame 0's composition.

## V1 (review, superseded; commit `7398f50`)

**Deliverable.** `exports/FGW_Frozen_Frog_V1_REVIEW_1080x1920.mp4`: native 1080×1920, 30 fps, 735 frames, 24.5 s,
H.264 (CRF 16, yuv420p, BT.709) with AAC 320 kb/s audio. **It is not published.**

**Report and QA.** `production/V1_REPORT.md`, with evidence in `qa/v1/`. The shot plan and transition list are in
`production/SHOT_PLAN_V1.md`.

**Narration.** `production/NARRATION_LOCKED.txt`, word for word. It is one ElevenLabs run (two takes) in the channel
narrator voice. Take 2 is used sample for sample, with no edits. Provenance is in `audio/narration/voice_provenance.json`.

**Picture.** Deterministic Remotion/SVG in the FGW vector finish: ink contours, matte cel shading and an upper-left key
light. There are no Runway or other generated plates. Two nested worlds are joined by continuous zooms:

| World | What it holds | Source |
|---|---|---|
| The forest and the frog (mm) | The wood-frog rig (the mask, lip stripe, eardrum, dorsolateral folds, leg bars, webbed feet, frost, clouded lens, meltwater, the hop) and the forest floor (litter, a snowpack drawn as a cross-section, snowfall, melt, shoots). Every layer repeats with the hop's length, for an exact loop. | `source/src/art/frog.tsx`, `source/src/art/forest.tsx` |
| The cutaway (mm, body frame) | The three-chambered heart in its pericardium, the liver and gall bladder, lungs, gut, spine, back and belly muscle, vessels, faceted cavity ice, and the sugar leaving the liver. | `source/src/art/anatomy.tsx` |
| The tissue (u = 2 µm) | A muscle cross-section with a capillary (oval, nucleated frog red cells), extracellular ice plates, water leaving the cells, glucose rings, transporters, and ice needles that stop at the membrane. | `source/src/art/micro.tsx` |

`source/src/story.ts` holds the timeline (every beat keyed to measured word times), all states, the heartbeat schedule
and the one camera. `source/src/Scene.tsx` holds the depth layers, the nesting and the screen-space light grades.

**Sound.** Everything is synthesised and placed from the picture's events: `tools/make_audio.py`, `audio/cues.json`
and `audio/sfx_log_mix_v1.json`.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    python3 tools/make_narration.py                       # take -> narration master, word timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1                    # effects + beds + pad + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts FrozenFrogV1 ../exports/FGW_Frozen_Frog_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Frozen_Frog_V1_REVIEW_1080x1920.mp4 qa/v1

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

The ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases:
`tools/asr_sherpa.py <audio> <model_root>`.
