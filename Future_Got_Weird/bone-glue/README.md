# Future Got Weird: the oyster-inspired bone glue

## V1 (first complete review cut, current)

**Deliverable.** `exports/FGW_Bone_Glue_V1_REVIEW_1080x1920.mp4` — see `production/V1_REPORT.md` for its exact
format, measurements and status (including the narration status). **It is not published.**

**Report.** `production/V1_REPORT.md`, with evidence in `qa/v1/`. The shot plan and the transition list are in
`production/SHOT_PLAN_V1.md`; the builders' contracts are in `production/BUILD_BRIEF.md`.

**Narration.** `production/NARRATION_LOCKED.txt`, word for word, in the channel narrator voice (ElevenLabs "Test
Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, connector defaults, one run of two takes). Provenance and the download
status are in `audio/narration/voice_provenance.json`.

**Picture.** Deterministic Remotion/SVG in the Weird Crew vector finish (navy ink, cel shading, upper-left key light).
One wrist world in millimetres (the patient's right forearm, palm up, hand pointing up the frame; `source/src/art/anatomy.ts`),
drawn as depth layers through a pinhole dolly (`source/src/camera.tsx`), plus one matched excursion to an oyster:

| Module | What it draws | Source |
|---|---|---|
| bone | the fractured distal radius (four fragments, seated by the clamp), the adhesive bead that fills and bridges the cracks, the wet wound, hematoma → soft callus → hard callus → glue resorption → remodelling | `source/src/art/bone.tsx` |
| arm, skeleton | the palm-up hand and forearm, the incision and its rim, the translucent/soft cutaway window, sutures and scar; ulna, carpals, metacarpals, phalanges | `source/src/art/arm.tsx`, `source/src/art/skeleton.tsx` |
| surgeon, instruments, room | the Weird Crew surgeon (cap, mask, gown, gloved grips), the syringe-type applicator and the pointed reduction clamp, the draped arm board, the follow-up table, the room | `source/src/art/surgeon.tsx`, `instruments.tsx`, `room.tsx` |
| oyster | an oyster cemented to a rock underwater, with a current surge | `source/src/art/oyster.tsx` |
| loop | the surgeon's sleeve sweeping across the lens (the reset happens behind it) | `source/src/GloveWipe.tsx` |

`source/src/story.ts` holds the timeline (every beat keyed to measured word times) and the one camera;
`source/src/Scene.tsx` the depth layers.

**Sound.** Everything is synthesised and placed from the picture's events (`tools/make_audio.py`, `audio/cues.json`).

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa releases): sherpa-onnx-zipformer-en-2023-06-26 and sherpa-onnx-whisper-base.en into /tmp/asr
    python3 tools/make_narration.py                 # take -> narration master, timeline, captions, SRT
                                                    # (--provisional: timeline from the take's Scribe word times)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1              # effects + music + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts BoneGlueV1 ../exports/FGW_Bone_Glue_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Bone_Glue_V1_REVIEW_1080x1920.mp4 qa/v1

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`. Module test entries:
`source/src/test/*.entry.tsx` (`npx remotion still src/test/<name>.entry.tsx <Comp> out.png`).
