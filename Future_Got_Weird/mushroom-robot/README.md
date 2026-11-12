# Future Got Weird: FGW_Mushroom_Robot (V5 current)

## V5: final animation repair, faster storytelling, publication polish (current)

**Status (12 Nov 2026):** V5 final render, not yet watched in real time. The full report is in
`production/V5_REPORT.md`: the V4 glitch causes, the code-level fixes, tests A–D, the 24-beat timeline, defects and the
score (8.8/10).

| Deliverable | File |
|---|---|
| V5 final: 1080×1920, 30 fps, 850 frames, 28.333 s | `exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4` |
| 0.25× QA copy | `qa/v5/FGW_Mushroom_Robot_V5_QA_0.25x_540x960.mp4` |
| Tests A–C (static cameras, no cuts) | `qa/v5/tests/` |
| Geometry audit (PASS) | `qa/v5/geometry_audit.json` |
| Source | `source/src/v5/` (composition `MushroomRobotV5`) |

### Rebuild V5

    cd Future_Got_Weird/mushroom-robot
    source/node_modules/.bin/esbuild tools/v5/geom_audit.ts --bundle --platform=node --format=cjs --outfile=/tmp/ga5.cjs && node /tmp/ga5.cjs qa/v5/geometry_audit.json
    source/node_modules/.bin/esbuild tools/v5/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.tsx=tsx --outfile=/tmp/ec5.cjs && NODE_PATH=source/node_modules node /tmp/ec5.cjs audio/cues_v5.json
    python3 tools/v5/make_audio_v5.py mix_v5
    (cd source && npx remotion render src/index.ts MushroomRobotV5 ../exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4 --props='{"audio":"mix_v5"}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && for C in V5TestA-threequarter V5TestB-overhead V5TestB-low V5TestC-uv; do npx remotion render src/index.ts $C ../qa/v5/tests/$C.mp4 --scale=0.5; done)
    python3 tools/v5/qa_render_v5.py exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4 qa/v5
    python3 tools/asr_sherpa.py exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4 /tmp/asr qa/v5/final_asr.json

---

## V4: structural animation repair and high-retention pacing (kept as delivered)

**Status (12 Nov 2026):** V4 final review render, not published. The full report is in `production/V4_REPORT.md`: the
V3 root causes, the rig architecture, Stage A/B validation, the 23-shot timeline, QA and the score (8.5/10).

| Deliverable | File |
|---|---|
| V4 final review MP4: 1080×1920, 30 fps, 850 frames, 28.333 s | `exports/FGW_Mushroom_Robot_V4_FINAL_REVIEW_1080x1920.mp4` |
| 0.25× QA copy | `qa/v4/FGW_Mushroom_Robot_V4_QA_0.25x_540x960.mp4` |
| Stage A continuous-walk diagnostics | `qa/v4/stageA/` |
| Stage B geometry audit (PASS) | `qa/v4/geometry_audit.json` |
| Source | `source/src/v4/` (composition `MushroomRobotV4`; shot list `v4/shots.ts`) |

### Rebuild V4

    cd Future_Got_Weird/mushroom-robot
    source/node_modules/.bin/esbuild tools/v4/geom_audit.ts --bundle --platform=node --format=cjs --outfile=/tmp/ga4.cjs && node /tmp/ga4.cjs qa/v4/geometry_audit.json
    source/node_modules/.bin/esbuild tools/v4/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.tsx=tsx --outfile=/tmp/ec4.cjs && NODE_PATH=source/node_modules node /tmp/ec4.cjs audio/cues_v4.json
    python3 tools/v4/make_audio_v4.py mix_v4
    (cd source && npx remotion render src/index.ts MushroomRobotV4 ../exports/FGW_Mushroom_Robot_V4_FINAL_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v4"}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && for C in DiagA1 DiagA2 DiagA3; do npx remotion render src/index.ts $C ../qa/v4/stageA/$C.mp4 --scale=0.5; done)
    python3 tools/v4/qa_render_v4.py exports/FGW_Mushroom_Robot_V4_FINAL_REVIEW_1080x1920.mp4 qa/v4
    python3 tools/asr_sherpa.py exports/FGW_Mushroom_Robot_V4_FINAL_REVIEW_1080x1920.mp4 /tmp/asr qa/v4/final_asr.json

---

## V3: mechanical animation, storytelling and final polish (kept as delivered)

**Status (12 Nov 2026):** V3 final review render, not published. The full report is in `production/V3_REPORT.md`:
change log, stability QA, science review, remaining defects and the score (8/10).

| Deliverable | File |
|---|---|
| V3 final review MP4: 1080×1920, 30 fps, 850 frames, 28.333 s | `exports/FGW_Mushroom_Robot_V3_FINAL_REVIEW_1080x1920.mp4` |
| V3 mix (-14.08 LUFS, -1.60 dBTP) | `audio/mix/FGW_Mushroom_Robot_MIX_V3.wav` |
| Geometry audit (every half frame: PASS) | `qa/v3/geometry_audit.json` |
| Render QA, every-frame sheets, ASR | `qa/v3/` |
| Source | `source/src/v3/` (composition `MushroomRobotV3`) |

### Rebuild V3

    cd Future_Got_Weird/mushroom-robot
    source/node_modules/.bin/esbuild tools/v3/geom_audit.ts --bundle --platform=node --format=cjs --outfile=/tmp/ga3.cjs && node /tmp/ga3.cjs qa/v3/geometry_audit.json
    source/node_modules/.bin/esbuild tools/v3/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.tsx=tsx --outfile=/tmp/ec3.cjs && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
    python3 tools/v3/make_audio_v3.py mix_v3
    (cd source && npx remotion render src/index.ts MushroomRobotV3 ../exports/FGW_Mushroom_Robot_V3_FINAL_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3"}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --image-format=jpeg --jpeg-quality=95 --concurrency=4)
    python3 tools/v3/qa_render_v3.py exports/FGW_Mushroom_Robot_V3_FINAL_REVIEW_1080x1920.mp4 qa/v3
    python3 tools/asr_sherpa.py exports/FGW_Mushroom_Robot_V3_FINAL_REVIEW_1080x1920.mp4 /tmp/asr qa/v3/final_asr.json

---

## V2: stability, cleanup and polish (kept as delivered)

**Status (12 Nov 2026):** V2 review render, not published. The full report is in `production/V2_REPORT.md`: changes,
the geometry and clipping QA, remaining defects and the score.

| Deliverable | File |
|---|---|
| V2 review MP4: 1080×1920, 30 fps, 850 frames, 28.333 s | `exports/FGW_Mushroom_Robot_V2_REVIEW_1080x1920.mp4` |
| V2 mix (-14.08 LUFS, -1.60 dBTP) | `audio/mix/FGW_Mushroom_Robot_MIX_V2.wav` |
| Geometry audit (every half frame: PASS) | `qa/v2/geometry_audit.json` |
| Render QA, every-frame sheets, ASR | `qa/v2/` |
| Source | `source/src/v2/` (composition `MushroomRobotV2`) |

### Rebuild V2

    cd Future_Got_Weird/mushroom-robot
    source/node_modules/.bin/esbuild tools/v2/geom_audit.ts --bundle --platform=node --format=cjs --outfile=/tmp/ga.cjs && node /tmp/ga.cjs qa/v2/geometry_audit.json
    source/node_modules/.bin/esbuild tools/v2/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.tsx=tsx --outfile=/tmp/ec2.cjs && NODE_PATH=source/node_modules node /tmp/ec2.cjs audio/cues_v2.json
    python3 tools/v2/make_audio_v2.py mix_v2
    (cd source && npx remotion render src/index.ts MushroomRobotV2 ../exports/FGW_Mushroom_Robot_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v2"}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --image-format=jpeg --jpeg-quality=95 --concurrency=4)
    python3 tools/v2/qa_render_v2.py exports/FGW_Mushroom_Robot_V2_REVIEW_1080x1920.mp4 qa/v2
    python3 tools/asr_sherpa.py exports/FGW_Mushroom_Robot_V2_REVIEW_1080x1920.mp4 /tmp/asr qa/v2/final_asr.json

---

## V1 (kept as delivered)

**Status (12 Nov 2026):** V1 review render, checked as frames and measurements. Not published. Nobody has watched it
in real time with sound.

| Deliverable | File |
|---|---|
| Review MP4: 1080×1920, 30 fps, 850 frames, 28.333 s, H.264 CRF 16 + AAC 320 kb/s, 48 kHz stereo | `exports/FGW_Mushroom_Robot_V1_REVIEW_1080x1920.mp4` |
| Narration master (48 kHz, 24-bit mono) and voice provenance | `audio/narration/FGW_Mushroom_Robot_narration_V1.wav`, `audio/narration/voice_provenance.json` |
| Mix (-14.08 LUFS integrated, -1.60 dBTP) | `audio/mix/FGW_Mushroom_Robot_MIX_V1.wav`, `audio/mix/mix_measure_mix_v1.json` |
| Captions (SRT, not burned in) | `captions/FGW_Mushroom_Robot_V1.srt` |
| Science notes and accuracy checklist (with sources) | `production/SCIENCE_NOTES.md` |
| Transition list | `production/TRANSITIONS.md` |
| QA evidence (measurements, contact sheets, hook, loop seam, transitions, ASR) | `qa/v1/` |
| Source (Remotion 4.0.533; composition `MushroomRobotV1`) | `source/src/` |

## Narration (locked, verbatim)

The words are in `production/NARRATION_LOCKED.txt`. The voice is ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`,
`eleven_v4`), the channel narrator.

- **Generation:** one run of two takes. Take 1 is used.
- **Edit:** only the silent gaps between sentences were shortened (1.93 s removed in total). No word was stretched,
  pitched or changed.
- **Pace:** speech runs from 0.00 to 27.77 s at 179 wpm.
- **Check:** the delivered MP4's own audio transcribes with WER 0.000 on sherpa-onnx Zipformer and on Whisper
  base.en (`qa/v1/final_asr.json`).

## How it is built

- **World A, the robot.** One fixed 3D layout drawn through a pinhole camera every frame (`robot.ts`, `cam3d.ts`,
  `RobotWorld.tsx`).
  - The walker is a five-legged soft pneumatic robot.
  - Each detected fungal spike drives one gait cycle, a rear-to-front ripple.
  - Feet are planted per step and never slide.
  - Legs keep their length (at most +23% at peak swing and inflation).
  - The walker follows a closed path that returns to the start in both position and heading. The camera is a
    periodic spline. Together these make the last frame continue into frame 0.
  - A box distance field keeps every leg out of the pipette-tip box: minimum clearance 0.20 cm, which is the paw on
    its face.
- **World B, the macro view and signal chain** (`SignalWorld.tsx`).
  - It uses the same seeded mycelium network as the dome (`mycelium.ts`), entered through a dissolve registered to
    the robot shot's own projection.
  - One spike is followed down a continuous path: electrode → AMP → FILTER → SPIKE DETECT → VALVE → air line.
  - The air line crossing the lens wipes back to the leg it inflates.
- **Sound** (`tools/make_audio.py`). Everything is synthesised and placed from exported picture events
  (`audio/cues.json`):
  - spike crackles;
  - valve ticks and air hisses on every leg actuation, and soft pats on every landing;
  - stage blips and the solenoid clack in the chain;
  - the lamp's click and hum;
  - the splat, the plastic knock and the tip rattle;
  - a quiet room tone and a restrained fungal texture.

  The effects duck under the voice and sit 17 dB below it in RMS.

### Rebuild

    cd Future_Got_Weird/mushroom-robot
    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow   # ASR models in /tmp/asr (k2-fsa asr-models releases)
    (cd source && npm ci)
    python3 tools/make_narration.py
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1
    (cd source && npx remotion render src/index.ts MushroomRobotV1 ../exports/FGW_Mushroom_Robot_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":false}' --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --image-format=jpeg --jpeg-quality=95 --concurrency=4)
    python3 tools/qa_render.py exports/FGW_Mushroom_Robot_V1_REVIEW_1080x1920.mp4 qa/v1
    python3 tools/asr_sherpa.py exports/FGW_Mushroom_Robot_V1_REVIEW_1080x1920.mp4 /tmp/asr qa/v1/final_asr.json

To burn in captions, render with `--props='{"audio":"mix_v1","captions":true}'`. For contact sheets, run
`cd source && node sheet.mjs MushroomRobotV1 out.png 0,30,60 4 0.4`.

## Scene-by-scene timing (as rendered)

| t (s) | Narration (measured) | Picture |
|---|---|---|
| 0.00–2.50 | "If you give a mushroom robot legs, it can actually walk." (0.00–3.24) | Frame 0: the whole walker mid-step, with cyan spike flashes in the culture under its mesh dome. The camera pushes to the front legs (1.25), rises over the hub and dives into the dome. |
| 2.50–2.82 | | Matched dissolve: the dome's culture becomes the macro view of the same network. |
| 2.82–5.75 | "Scientists grew living fungus into a robot's electronics." (3.43–6.49) | Macro threads with growing tips and streaming cytoplasm. Labels: "living mycelium" (3.25–5.25) and the source tag (3.1–6.6). The camera pulls back to both electrodes and the leads into the board. |
| 5.75–7.83 | "And every time the fungus fired…" (6.69–7.83) | "electrode" label. Spike waves reach the electrodes (5.88, 6.95), then the camera moves in to electrode 1. |
| 7.83–9.28 | "…an electrical signal..." (8.11–9.16) | Following the spike. The waveform changes from raw (noisy) at the start, to amplified at AMP (8.38), clean at FILTER (8.59) and digital at SPIKE DETECT (8.82). The VALVE opens (9.16) and air enters the line. |
| 9.28–9.58 | | The air line passes the lens: wipe to the leg. |
| 9.51–10.9 | "The robot moved." (9.51–10.51) | The leg inflates and the walker takes a clumsy, oversized step with a wobble, then the camera pulls back. |
| 10.77–12.5 | "But here's where it gets weird." | The UV lamp swings in on its arm and the scope strip slides in. |
| 12.51–16.2 | "They shined ultraviolet light on the fungus. And the robot changed how it walked." (12.42–16.37) | The lamp clicks on and the culture turns violet. On the scope, spikes become larger and more frequent from 12.95 s, then steps come faster and higher (eight steps at 0.4 s spacing). The lamp goes off at 16.22. |
| 16.15–18.4 | "So this thing has no brain." (16.56–18.38) | Overhead: the hub holds only the culture and electronics. On "brain" the soft legs buckle and the walker splats, then recovers. |
| 18.12–19.2 | "No eyes." (18.58–19.21) | Fast swoop to a low side view. It walks into the pipette-tip box (contact at 18.90): knock and tip rattle. |
| 19.4–21.65 | "And absolutely no idea where it's going." (19.39–21.63) | Two more steps paw at the box, then it pivots away (20.85). High wide view with its footprint track. |
| 21.65–24.6 | "But the mushroom is literally controlling its legs." (21.90–24.59) | Orbit around the whole robot with parallax (box, beaker, lab). Every step shows spike → hub LEDs → air channel in the leg. |
| 24.6–28.33 | "Which means scientists basically gave a fungus a body." (24.78–27.77) | The camera eases into the opening framing. The last full step lands on "body" (27.22–27.9). The final frames lead into frame 0. |

## Animation QA findings

**Measured:**
- `qa/v1/render_qa.json`: no decode errors, 850 frames.
- Every large frame-to-frame change falls in a planned move or transition. The longest near-static run is 4 frames.
- Last frame vs first frame: mean absolute difference 4.25, against a median of 8.21 between neighbouring frames.
- Path closure error below 1e-13 cm; heading closes after exactly 2π.

**Checked as frames:**
- the every-0.5 s sheet;
- the hook at every 3rd frame, muted;
- the transition bursts (match, the 5 s macro pull-back, the wipe);
- the loop seam.

**Fixed during QA:**
- An event out of order (a wrong word index) that stretched legs to 18 cm.
- A leg clipping 0.57 cm into the box after the pivot.
- Pipette tips that read as mushrooms.
- An off-frame monitor.
- A prop stack in the foreground of the UV shot.
- Glow blowing out at macro zoom (4.9–5.1 s).
- Labels clipped at the frame edge.
- Leg roots showing as flat stubs over the hub.

**Unresolved:**
1. A rear leg seen end-on during its swing reads as a lump behind the dome (0.0–0.25 s, about 27.3 s). The geometry
   is correct, but the silhouette is unclear at phone size.
2. The outline kinks on the inside of tightly bent legs in close-ups (for example 1.4 s): the offset outline
   self-intersects.
3. The front-leg socket collar can read as a dark strut when a leg points toward the camera (1.4–1.6 s).
4. Composition is loose in the robot-world wide shots. The walker sits in the lower-middle and the top third is lab
   wall. It is smallish in the UV and orbit shots.
5. The swoop from overhead to the side view (18.12–18.66: 134° of yaw and 72° of pitch in 0.54 s) is the fastest move
   and may disorient. It needs a real-time viewing.
6. Spike propagation is drawn as expanding rings, which look artificial in the macro shots.
7. The in-world monitor is in frame only around 13.9–14.7 s. UV causality is carried by an overlay scope strip, an
   inset-style graphic, which departs from earlier FGW episodes.
8. No burned-in captions (per the brief's "no unnecessary subtitles"). Muted viewers get no words after the hook.
   The SRT and a `captions` prop are ready.
9. In the first two seconds with the sound off, the walking robot and the cyan flashes read, but the culture in the
   dome is small until about 1.5 s.
10. Nothing has been heard. There is no audio playback here, so the take was chosen by ASR and timing, and the mix
    was checked by measurement only.

## Publish-readiness: 6/10

Not ready to publish.

**What works:**
- The science is careful and the narration is verbatim.
- The mechanism reads clearly: fungus → electrode → processing → valve → leg.
- UV causality is shown in order.
- The geometry and the loop are verified.

**Before publishing:**
- Watch it at real-time speed with sound.
- Check the ⚠ items in `production/SCIENCE_NOTES.md` against the paper; it could not be opened from this environment.
- Tighten the wide-shot composition and the end-on leg silhouette.
- Decide on captions.
