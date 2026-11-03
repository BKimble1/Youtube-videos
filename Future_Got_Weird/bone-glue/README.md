# Future Got Weird: the oyster-inspired bone glue

## V2 (current review cut)

**Deliverable.** `exports/FGW_Bone_Glue_V2_REVIEW_NO_NARRATION_1080x1920.mp4` contains the complete picture, captions,
effects and music, but **not the narration**. The take files are served from a host this environment's network policy
blocks. Once the narration is added, the file becomes `exports/FGW_Bone_Glue_V2_REVIEW_1080x1920.mp4` (steps below).
**It is not published.**

**Report.** `production/V2_REPORT.md` covers the format, the measurements, the brief checklist and the remaining
issues. Its evidence is in `qa/v2/`. The beat plan and the module contracts are in `production/V2_PLAN.md`. V1 and its
report (`production/V1_REPORT.md`, `qa/v1/`) are kept for comparison.

**Narration.** The text is `production/NARRATION_LOCKED.txt`, word for word, read in the channel narrator voice
(ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, connector defaults, one run of two takes). Provenance
and download status are in `audio/narration/voice_provenance.json`.

**Picture.** The picture is deterministic Remotion/SVG in the Weird Crew vector finish (navy ink, cel shading,
upper-left key light). It uses one wrist world in millimetres (the patient's right forearm, palm up;
`source/src/art/anatomy.ts`), drawn as depth layers through a pinhole dolly (`source/src/camera.tsx`). The film makes
one matched excursion to an oyster.

| Module | What it draws | Source |
|---|---|---|
| fracture geometry | The three seams (transverse, styloid, the wedge's diagonal), their broken faces and gaps, the wedge fragment's pose, the glue band runs, and the new-bone growth fronts | `source/src/art/seams.ts` |
| fracture and glue | The distal radius, the displaced wedge and its exposed bed, the probe seating it, and the adhesive filling the gap between the broken faces (gloss, then satin once set) | `source/src/art/fracture.tsx` |
| healing | Hematoma, then soft callus, then pale woven bone advancing from both faces while the glue thins into islands and disappears, then remodelling to mature bone | `source/src/art/heal.tsx` |
| wet wound | A translucent blood-tinted sheet and one stronger wash flowing across the bonded seam, with the glue edges redrawn sealed to both faces | `source/src/art/wet.tsx` |
| surgeon and instruments | The gloved hands, the positioning probe (left hand) and the cannula applicator (right hand), with contact shadows | `source/src/art/surgeon.tsx`, `instruments.tsx` |
| arm, skeleton, room | The palm-up hand and forearm, the incision, retractors, sutures, scar and cutaway window, the bones under the skin, the drape and follow-up table | `source/src/art/arm.tsx`, `skeleton.tsx`, `room.tsx` |
| oyster | An oyster cemented to a boulder in a current, with a section window onto shell, cement and rock that matches the glue band | `source/src/art/oyster.tsx` |

`source/src/story.ts` holds the timeline, with every beat keyed to the word times, and the single camera.
`source/src/Scene.tsx` composes the depth layers. The loop is a push back into the opening's bone framing, then a cut to
frame 0. There is no wipe.

**Sound.** All sound is synthesised and placed from the picture's events (`tools/make_audio.py`, `audio/cues.json`).

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa releases): sherpa-onnx-zipformer-en-2023-06-26 and sherpa-onnx-whisper-base.en into /tmp/asr
    # download the takes (flow vPJoRVyy04Q4iSyAc8Cy) to audio/narration/takes/t1_tsOx.mp3, t2_RlHD.mp3
    python3 tools/make_narration.py                 # take -> narration master, timeline, captions, SRT
                                                    # (--provisional: timeline from the take's Scribe word times)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v2              # effects + music + mix -> source/public/audio/mix_v2.wav
    (cd source && npm ci && npx remotion render src/index.ts BoneGlueV2 ../exports/FGW_Bone_Glue_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v2","captions":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Bone_Glue_V2_REVIEW_1080x1920.mp4 qa/v2
    # current no-narration cut: FGW_NO_VOICE=1 python3 tools/make_audio.py mix_v2_novoice, then render with "audio":"mix_v2_novoice"

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

Module test entries are in `source/src/test/*.entry.tsx`. Render one with
`npx remotion still src/test/<name>.entry.tsx <Comp> out.png`. `camtest.entry.tsx` draws the wrist world at any time
through any camera, for framing studies.
