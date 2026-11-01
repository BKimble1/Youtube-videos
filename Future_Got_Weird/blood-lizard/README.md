# Future Got Weird: the blood-shooting horned lizard

## V1 (current)

**Deliverable.** `exports/FGW_Blood_Lizard_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, H.264 + AAC, 630 frames,
21.000 s. **It is not published.**

**Report.** `production/V1_REPORT.md`, with evidence in `qa/v1/`. The source is composition `BloodLizardV1`, mix `mix_v1`.

**Narration.** `production/NARRATION_LOCKED.txt`, word for word. It is the channel narrator voice on ElevenLabs
(`audio/narration/voice_provenance.json`).

**Picture.** Deterministic Remotion/SVG in the FGW vector finish: ink contours, cel shading, an upper-left key light,
depth layers through one pinhole camera.

| File | What it holds |
|---|---|
| `source/src/art/lizard.tsx` | Texas horned lizard in light 3D, projected from a raised camera: a disc body with paired blotches, spines and a lateral fringe; a crown of horns; sprawled legs with a gait; an eye with swelling lids and the pore. |
| `source/src/art/sinus.tsx` | The cutaway inside the head: eyeball, sinus, artery, vein, muscle band, tiny vessels, blood cells, pressure and the rupture. |
| `source/src/art/coyote.tsx` | The coyote: body and four jointed legs, neck, a hinged jaw, and acting controls for ears, squint, lip, wrinkle, tongue and shake. |
| `source/src/art/jet.tsx` | The blood stream along a ballistic arc, with its front and the splash at the target. |
| `source/src/art/desert.tsx` | The desert floor depth layers. |
| `source/src/story.ts` | The word-keyed timeline, the slow-motion clock, every state and the one camera. |
| `source/src/Scene.tsx` | Layers and composition. |

**Sound.**
- `tools/make_audio.py`: synthesised beds, heartbeat, vessel stretch, rupture, impact and music, plus generated
  animal sounds and foley from `audio/sfx_el/` (provenance in its README).
- Effects are placed from `audio/cues.json`, which is exported from the story.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    python3 tools/make_narration.py                 # take -> narration master (one gap edit) and word timeline
    (cd source && npm ci)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1              # effects + music + mix -> source/public/audio/mix_v1.wav
    (cd source && npx remotion render src/index.ts BloodLizardV1 ../exports/FGW_Blood_Lizard_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1"}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Blood_Lizard_V1_REVIEW_1080x1920.mp4 qa/v1

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [cols]`. Rig stills: composition `Test`.

The ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases, in
`/tmp/asr`.
