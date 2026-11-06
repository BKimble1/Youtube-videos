# Future Got Weird: Brain Cells Playing DOOM

## V2: final polish (current)

**Deliverable:** `exports/FGW_Brain_Cells_DOOM_V2_FINAL_REVIEW_1080x1920.mp4`. It is not yet published.

- **Format:** the same as V1 (1080×1920, 30 fps, 870 frames, 29.00 s; −14 LUFS).
- **What changed:** a targeted camera polish in `source/src/story.ts`:
  - the hook (0–5 s) and the ending (23–29 s) now use one eased move per beat;
  - two of the middle's scale changes are smoothed;
  - activity and sound cues were retimed to match.
- **What did not change:** the narration, the voice take, the art, the game and the sound design.
- **Report and QC checklist:** `production/V2_REPORT.md`. Transitions: `production/TRANSITIONS.md`. Evidence:
  `qa/v2/`.
- **V1's camera path** is in commit `b171a07`; the V1 MP4 stays in `exports/`.

## V1: the review cut

**Deliverable:** `exports/FGW_Brain_Cells_DOOM_V1_REVIEW_1080x1920.mp4`. It is not yet published.

- **Video:** 1080×1920, 30 fps, 870 frames, 29.00 s; H.264 CRF 16, yuv420p, BT.709.
- **Audio:** AAC, 48 kHz stereo, at −14 LUFS with true peak ≤ −1.5 dBTP.

**Where to look:**

- **Report:** `production/V1_REPORT.md` (what was built, the measurements, the review and the known limits).
- **Science and sources:** `production/SCIENCE_NOTES.md`.
- **Transition list:** `production/TRANSITIONS.md`.
- **Evidence:** `qa/v1/`.

**Narration:** `production/NARRATION_LOCKED.txt`, word for word.

- **Voice:** the channel narrator, ElevenLabs "Test Voice" `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, directed with inline
  tags only.
- **Takes:** one run of two takes. Take 2 is used untouched.
- **Timing:** speech runs 0.00–28.03 s.
- **Provenance:** `audio/narration/voice_provenance.json`.

**Picture:** deterministic Remotion, mixing SVG and canvas, in the Weird Crew vector finish: navy ink of constant
width, one warm upper-left key light. There are no cuts: one camera travels one connected world, keyed to the measured
word times.

| Module | What it draws | Source |
|---|---|---|
| Game | An original retro raycaster (procedural textures, an original horned brute and gun, a pixel HUD) and a scripted, illustrative playthrough. It is not DOOM art and not footage of the experiment. | `source/src/game/` |
| Culture | The 8×8 MEA (60 sites, 59 live) with its leads, carrier and well; the neurons (somata, tapering dendrites, axons); spikes, stimulation (cyan, inbound) and recording (amber, outbound); a phase-contrast look | `source/src/micro/` |
| Lab | The wall, bench, game monitor, control-software monitor (ENCODE, RECORD, DECODE), PC tower, and the CL1 with its clear enclosure, media, pump, headstage and touchscreen | `source/src/lab/` |
| Story | The camera path (zooms, signal rides), activity events, decoder commands, the lens, the microscope iris and section, labels | `source/src/story.ts` |
| Composition | Layers, nested chip mapping, overlays, captions | `source/src/Scene.tsx`, `Captions.tsx` |

**Sound:** synthesised and placed from the picture's own events (`tools/make_audio.py`, `audio/cues.json`). It has
these layers:

- retro shots and growls, quieter and muffled when we are inside the chip;
- spike "pops" and stimulation ticks;
- decoder blips and whooshes;
- lab air and the CL1's pump;
- a quiet pad and pulse at 120 bpm, 58 beats long, so it loops with the film.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    # ASR models (k2-fsa GitHub releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26 and
    #   sherpa-onnx-whisper-base.en, unpacked into /tmp/asr
    python3 tools/make_narration.py          # take -> narration master, word timeline, captions, SRT
    (cd source && npm ci)
    npx --prefix source esbuild tools/export_cues.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/c.js && node /tmp/c.js
    python3 tools/make_audio.py mix_v2
    tools/render_resilient.sh mix_v2 exports/FGW_Brain_Cells_DOOM_V2_FINAL_REVIEW_1080x1920.mp4 source/out/frames_v2
    python3 tools/qa_render.py exports/FGW_Brain_Cells_DOOM_V2_FINAL_REVIEW_1080x1920.mp4 qa/v2 v2
    # (V1: check out b171a07, then mix_v1 / frames_v1 / qa/v1)

**Working sheets:** `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

**Module tests:** `source/src/test/game.entry.tsx` (gameplay grid) and `micro.entry.tsx` (culture views).

**Media storage:** media are stored as plain Git blobs (`.gitattributes`), because Git LFS uploads are unavailable in
this environment. This is the same rule as the other FGW episodes.
