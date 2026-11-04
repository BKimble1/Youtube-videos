# Future Got Weird: This Eel Escapes Through the Fish That Ate It

## V4 (current: the review cut with a new shot sequence)

**Deliverable:** `exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`, not published. Same narration and specifications as
V3.

V4 replaces V3's single reframed side profile with a new sequence of distinct settings and perspectives:

- the rear three-quarter at the gill, and the flashback gulp;
- the X-ray tank and a newly drawn stomach;
- the throat passage and the gill arches;
- the poke into open water, over the back, and the trapped head;
- the low view of the release, the tracking swim, and the reed wipe.

**Where to look:**

- **Report:** `production/V4_REPORT.md`.
- **Build brief and contracts:** `production/V4_BRIEF.md`.
- **Source:** `source/src/v4/` (composition `EelEscapeV4`).
- **Evidence:** `qa/v4/`.

**Rebuild V4:**

    npx --prefix source esbuild tools/v4/export_cues.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/c.js && node /tmp/c.js
    python3 tools/v4/make_audio_v4.py mix_v4
    COMP=EelEscapeV4 tools/render_resilient.sh mix_v4 exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4 source/out/frames_v4
    python3 tools/qa_render.py exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4 qa/v4 v4

**Checks:**

- `tools/v4/keepout.ts`: captions never on the eel or the gill gap.
- `tools/v4/verify_kin.ts`: the tail leads, the head clears once, and the eel never re-enters the predator.

## V3 (the earlier delivery cut)

**Deliverable:** `exports/FGW_Eel_Escape_V3_FINAL_1080x1920.mp4`. It is not published.

- **Video:** 1080×1920, 30 fps, 744 frames, 24.80 s, H.264 CRF 16, yuv420p, BT.709.
- **Audio:** AAC, 48 kHz stereo (320 kb/s target).
- **Contents:** narration, burned-in captions, underwater ambience and effects.

**Report:** `production/V3_REPORT.md` covers what was built, the measurements, the brief checklist, the two review
rounds and the remaining limits. Its evidence is in `qa/v3/`.

**Narration:** `production/NARRATION_LOCKED.txt`, word for word.

- **Voice:** the channel narrator, ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, directed with
  inline tags only.
- **Takes:** one run of two takes; take 1 is used untouched.
- **Timing:** speech starts on frame 1 and ends at 23.77 s.
- **Provenance:** `audio/narration/voice_provenance.json`.

**Picture:** deterministic Remotion/SVG in the Weird Crew vector finish: navy ink of constant width, cel shading,
light from the upper left.

- **Geometry:** one fish-local world (`source/src/anatomy.ts`): the predator, a dark sleeper, faces left; the
  escape route runs from the stomach up the esophagus, through the gill slit and out under the gill cover.
- **The eel (`source/src/eel.ts`):** one connected animal at every frame.
  - Inside the fish, every point slides along the route, so the tail tip leads.
  - Outside, the body is an elastic rod rooted at the gill exit.
  - After the single release, it is a free swimmer anchored at mid-body.
- **Timing (`source/src/story.ts`):** every beat is keyed to the measured word times.

| Module | What it draws | Source |
|---|---|---|
| Predator and X-ray | Exterior (body, breathing gill cover, gill gap, fins, eye, closed mouth) and an illustrated radiograph on the identical outline | `source/src/art/fish.tsx`, `xray.tsx` |
| Inside | Throat, esophagus, distended stomach, gill arches with filaments, the cutaway window and its cut faces | `source/src/art/inside.tsx` |
| Eel | Tapered round body, head with eye and mouth, pectoral fin, ribbon fin, cel shading, section joins | `source/src/art/eelArt.tsx` |
| Water | Stream bed, light, drifting motes in depth, contact shadow, the water rush at the release | `source/src/art/water.tsx` |
| Composition | Depth order, translucent reveal, X-ray wipe, three-quarter cutaway, lens sweep and loop wipe, captions | `source/src/Scene.tsx`, `Captions.tsx` |

**Sound:** synthesised and placed from the picture's own events (`tools/make_audio.py`, `audio/cues.json`). It is
underwater ambience plus restrained effects, with one clear accent: the water rush when the head clears.

**Science and sources:** `production/SCIENCE_NOTES.md` (Hasegawa et al., *Current Biology*, 2024).
**Transition list:** `production/TRANSITIONS.md`. **Module contracts:** `production/BUILD_BRIEF.md`.

## Earlier review cuts (superseded)

- `exports/FGW_Eel_Escape_V1_REVIEW_1080x1920.mp4`: the first integrated render, with measured QA in `qa/v1/`.
- `exports/FGW_Eel_Escape_V2_REVIEW_1080x1920.mp4`: after the first four-lens review, with QA in `qa/v2/`.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa GitHub releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26 and
    #   sherpa-onnx-whisper-base.en, unpacked into /tmp/asr
    python3 tools/make_narration.py              # take -> narration master, word timeline, captions, SRT
    python3 tools/make_audio.py mix_v3           # re-exports audio/cues.json from story.ts, then effects + mix
    (cd source && npm ci && npx remotion render src/index.ts EelEscapeV1 ../exports/FGW_Eel_Escape_V3_FINAL_1080x1920.mp4 \
      --props='{"audio":"mix_v3","captions":true}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p \
      --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    # or, resumable after an interruption (JPEG frames in chunks, then one x264 encode with the same settings):
    tools/render_resilient.sh mix_v3 exports/FGW_Eel_Escape_V3_FINAL_1080x1920.mp4
    python3 tools/qa_render.py exports/FGW_Eel_Escape_V3_FINAL_1080x1920.mp4 qa/v3

**Working sheets:** `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

**Module test entries:** `source/src/test/*.entry.tsx`. Render one with
`npx remotion still src/test/<name>.entry.tsx <Comp> out.png`.
