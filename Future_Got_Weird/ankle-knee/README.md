# Future Got Weird: Doctors Turned His Ankle Into a Knee

**Deliverable.** `exports/FGW_Ankle_Knee_1080x1920.mp4`: 1080×1920, 30 fps, 25.0 s (750 frames), H.264 yuv420p BT.709,
AAC 48 kHz stereo. It has picture, synchronized captions, the locked narration, effects and ambience. It loops: the
last frame flows into frame 0. **Not published.**

**Report.** `production/REPORT.md` covers the shot breakdown, the brief checklist, the measurements and the known
weaknesses. The evidence is in `qa/final/`.

**Narration.** `production/NARRATION_LOCKED.txt` is used word for word, read by the channel narrator (ElevenLabs "Test
Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`). It was one run of two takes, and take 1 is used whole with no edits.
Provenance is in `audio/narration/voice_provenance.json`. The picture is timed to the measured word times
(`source/src/data/timeline.json`).

**Picture.** Deterministic Remotion/SVG in the Weird Crew finish: navy ink contours, cel gradients from the upper-left
key light, the crew Head, five-digit Hands and limb construction (`source/src/dc/`, copied from Bone Glue; the only
addition is a short "crop" hairstyle on the Head). Wyatt always faces screen-left. His **right** leg, nearest the camera, is
the rotationplasty leg in every shot.

| Module | What it draws | Source |
|---|---|---|
| Wyatt | Side-view kid rig. The rotationplasty leg: his own foot, turned around, sits in the socket with the heel forward at knee height and the toes down and back. Bending the "knee" is that foot flexing at the ankle. Also the cutaway socket, pylon, forward-facing cleats, the bare post-op leg with its dressing, and the gown | `source/src/art/wyatt.tsx` |
| lower leg 3D | A lofted shin stub, foot, toes, ankle bones and toenails. It turns about the shin's long axis (orthographic, lens slightly above) for the half-turn, and the turn ring shows which way | `source/src/art/leg3d.tsx` |
| illustration | The original leg on a clinical plate with the rest of him as a ghost. X-ray knee window and tumour, cut lines, the bloodless removal, the half-turn, the join, the far knee alignment, and the prosthesis fit | `source/src/art/illus.tsx` |
| pitch | Perspective turf to a knee-height horizon, the goal, trees, grass tufts, and the end-on bench | `source/src/art/pitch.tsx` |
| ball | A truncated-icosahedron ball spinning in the picture plane | `source/src/art/ball.tsx` |
| recovery | The room, the bed and backrest, the blanket over the other leg, and the foam wedge with the foot hanging free | `source/src/art/bed.tsx` |

`source/src/story.ts` holds the timeline: every beat is keyed to a word, along with every camera and every pose.
`source/src/motion.ts` holds the footfall plans and the leg IK. `source/src/Scene.tsx` composes the shots.

**Sound.** All sound is synthesised and placed from the picture's own events (`tools/export_cues.ts` →
`audio/cues.json` → `tools/make_audio.py`). That covers the ball strike just after frame 0 (the loop's accent), light cleat scuffs on
every landing, a slowed whoosh under the slow-motion follow-through, soft illustration cues, the bench knock, and restrained
field, plate and room ambience. There is no music. The narration stays in front: voice −16.3 LUFS, the whole mix −13.3 LUFS, −1.6 dBTP.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa releases) into /tmp/asr: sherpa-onnx-zipformer-en-2023-06-26, sherpa-onnx-whisper-base.en
    python3 tools/make_narration.py              # take -> master, word timeline, caption chunks, SRT
    (cd source && npm ci)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v2           # -> source/public/audio/mix_v2.wav
    (cd source && npx remotion render src/index.ts AnkleKnee ../exports/FGW_Ankle_Knee_1080x1920.mp4 --props='{"audio":"mix_v2","captions":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Ankle_Knee_1080x1920.mp4 qa/final
    python3 tools/asr_sherpa.py exports/FGW_Ankle_Knee_1080x1920.mp4 /tmp/asr qa/final/asr_final_mix.json

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`. Module tests: `src/test/rig.entry.tsx`
(the rig in four poses) and `src/test/leg3d.entry.tsx` (the half-turn at 30° steps).
