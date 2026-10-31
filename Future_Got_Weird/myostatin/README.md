# Future Got Weird: Myostatin, the muscle growth limiter

## V6 (substantial visual revision, current)

**Deliverable.** `exports/FGW_Myostatin_V6_REVIEW_1080x1920.mp4`: native 1080×1920, 30 fps, 737 frames, 24.567 s.
**It is not published.**

**Report.** `production/V6_REPORT.md`, with evidence in `qa/v6/`. The source is composition `MyostatinV6`, mix `mix_v6`.
New in the source: `source/src/art/fibre.tsx` (bundle, receptor, protein, inhibitor) and `source/src/art/cow.tsx`
(a cow with one muscle parameter, matte shading).

**What changed.**
- The growth is the opening event, with a soft tissue reveal into the muscle.
- One bundle and one docking interaction show the brake.
- The cow develops its muscles on screen.
- The inhibitor completes the same mechanism.
- One continuous failed curl.
- An exact loop.

## V5 (visual clarity, anatomy and storytelling pass, superseded; commit `3ab289a`)

**Deliverable.** `exports/FGW_Myostatin_V5_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 737 frames, 24.567 s.
**It is not published.**

**Report.** `production/V5_REPORT.md`, with evidence in `qa/v5/`. The source is composition `MyostatinV5`, mix `mix_v5`.

**What changed.**
- A rebuilt shoulder: a rounded deltoid cap with the sleeve wrapping it.
- Two different micro visits that show myostatin as a signal: it binds, a signal runs to the nucleus and growth stops. Then antibodies block it and the fibres thicken.
- A continuous path through tissue into the cow's muscle and out through its shoulder.
- A staged lab: a scientist behind the bench, gripping the syringe, dispensing a drop.
- A pull-out through his biceps; confidence, strain and disappointment through the curl.
- An exact loop.

## V4 (final retention pass, superseded; commit `72f3c8e`)

**Deliverable.** `exports/FGW_Myostatin_V4_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 737 frames, 24.567 s.
**It is not published.**

**Report.** `production/V4_REPORT.md`, with evidence in `qa/v4/`. The source is composition `MyostatinV4`, mix `mix_v4`.
New in the source: `source/src/art/micro3d.tsx` (parallax fibre layers, the 3D bundle, the whole-muscle cross-section).

**What changed.**
- Inside the muscle by 1.5 s.
- Distinct micro events: a tracked molecule, binding, the brake signal, a restrained bulge, a misshapen molecule, and a 3D turn into a cross-section.
- Fuller facial acting.
- The cow walks; the scientist works a syringe.
- An exact loop.

## V3 (final review, superseded; commit `49f84fe`)

**Deliverable.** `exports/FGW_Myostatin_V3_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 737 frames, 24.567 s.
**It is not published.**

**Report.** `production/V3_REPORT.md`, with evidence in `qa/v3/`. The source is composition `MyostatinV3`, mix `mix_v3`.

**What changed.**
- A tight opening on the arm, swelling within 0.5 s.
- Muscular (not balloon) arm anatomy and a slimmer torso.
- The brake shown on, then off, with fibres visibly thickening.
- A pull-out through the bull's shoulder and a continuous sweep around it, with a more bovine head.
- An ending that goes into the muscle and back out, and closes on the tight opening view.

## V2 (review, superseded; commit `27ec6ab`)

**Deliverable.** `exports/FGW_Myostatin_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 737 frames, 24.567 s.
**It is not published.**

**Report.** `production/V2_REPORT.md`, with evidence in `qa/v2/`. The source is composition `MyostatinV2`, mix `mix_v2`
(`python3 tools/make_audio.py mix_v2`).

**What changed.**
- A fixed three-quarter face and torso.
- An opening that is already flexing and swelling.
- A short round trip into the muscle and back out.
- A rebuilt, compact Belgian Blue reached by an anatomical match cut.
- One controlled curl that fails, ending in a flex that lands on frame 0.

The narration is unchanged.

## V1 (review, superseded)

The source is at commit `80637db`, composition `MyostatinV1`.

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
    python3 tools/make_audio.py mix_v6                    # effects + music + mix -> source/public/audio/mix_v6.wav
    (cd source && npm ci && npx remotion render src/index.ts MyostatinV6 ../exports/FGW_Myostatin_V6_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v6","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qa_render.py exports/FGW_Myostatin_V6_REVIEW_1080x1920.mp4 qa/v6

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

The ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases:
`tools/asr_sherpa.py <audio> <model_root>`.
