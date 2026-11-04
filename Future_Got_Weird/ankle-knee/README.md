# Future Got Weird: Doctors Turned His Ankle Into a Knee

## V4 (current review cut)

**Deliverable.** `exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4` (1080×1920, 24.17 s, narrated). **Not published.**
The report is `production/V4_REPORT.md` and the evidence is in `qa/v4_review/`. V4 keeps the V3 narration master verbatim.

What V4 rebuilds:
- **The opening:** a decisive low frame, contact on frame 2, a spinning-ball wipe into the reveal, and the proof on "working knee".
- **Surgery:** close X-ray, illustration, and one continuous half-turn with the thigh fixed.
- **Rehab:** three views (toes in the socket, both joints bending together, one step).
- **Recovery:** the wiggle, the notice, and a foot-to-socket match back on the field.
- **The return to the field:** the part of the kick the opening skips, cut low so the last frame loops into frame 0 (`source/src/v4/`).

    source/node_modules/.bin/esbuild tools/export_cues_v4.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec4.cjs && NODE_PATH=source/node_modules node /tmp/ec4.cjs audio/cues_v4.json
    python3 tools/make_audio_v4.py mix_v4
    (cd source && npx remotion render src/index.ts AnkleKneeV4 ../exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v4","captions":true,"v4":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    FGW_CUES=audio/cues_v4.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V4_REVIEW_1080x1920.mp4 qa/v4_review
    # sheets: cd source && ./sheet4.sh out.png "f1,f2,..." [captions] [cols]

## V3 (previous review cut)

**Deliverable.** `exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4` (1080×1920, 24.17 s, narrated). **Not published.**
Its report is `production/V3_REPORT.md`, with the evidence in `qa/v3_review/`. V3 uses the same approved take, with only the dead air
between sentences tightened (0.77 s). It is re-timed so the kick lands at 1.12 s, and it keeps V2's ball-to-scan transition. The middle is
rebuilt as three distinct surgery views (scan → matched anatomy → three-quarter turn → attach), with a rehab proof shot and bend.
The ending runs recovery foot → face → lace → plant → a wide kick to the goal (`source/src/v3/`).

    python3 tools/make_narration_v3.py
    source/node_modules/.bin/esbuild tools/export_cues_v3.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec3.cjs && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
    python3 tools/make_audio_v3.py mix_v3
    (cd source && npx remotion render src/index.ts AnkleKneeV3 ../exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true,"v3":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    FGW_CUES=audio/cues_v3.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V3_REVIEW_1080x1920.mp4 qa/v3_review
    # sheets: cd source && ./sheet3.sh out.png "f1,f2,..." [captions] [cols]

## V2 (previous review cut)

**Deliverable.** `exports/FGW_Ankle_Knee_V2_REVIEW_1080x1920.mp4` (1080×1920, 25.0 s, narrated). **Not published.**
Its report is `production/V2_REPORT.md`, with the evidence in `qa/v2_review/`. V2 reuses the approved narration master unchanged.
It rebuilds the picture: a new opening on the backward foot, a scene of its own for every narration beat (scan, anatomy, the half-turn, the
reveal, the rehab rails, recovery, the lace, the step, the closing kick), and a redrawn Wyatt (`source/src/v2/`).

    (cd source && npx remotion render src/index.ts AnkleKneeV2 ../exports/FGW_Ankle_Knee_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v2r","captions":true,"v2":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec2.cjs && NODE_PATH=source/node_modules node /tmp/ec2.cjs audio/cues_v2.json
    python3 tools/make_audio_v2.py mix_v2r
    FGW_CUES=audio/cues_v2.json python3 tools/qa_render.py exports/FGW_Ankle_Knee_V2_REVIEW_1080x1920.mp4 qa/v2_review
    # sheets: cd source && ./sheet2.sh out.png "f1,f2,..." [captions] [cols];  poses + silhouettes: src/test/poses2.entry.tsx

## V1

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
