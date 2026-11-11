# Future Got Weird: Scientists Built a Cyborg Bug Factory

## V4 (final review cut: minimalist polish)

**Status (11 Nov 2026):** rendered natively and fully checked from the file. The verdict is **READY**; nobody has
watched it in real time with sound here. See `production/V4_REPORT.md`.

V4 is V3 with:
- every HUD, label, panel, card and banner removed; only the subtitles (with sparing emphasis) and one verified
  "68 SECONDS" graphic (fix → release) remain;
- a rebuilt robot comparison, with bigger parts, close tracking and a direct cut to the legs;
- an earthquake insect that is easier to follow;
- gentler camera moves.

The narration is unchanged.

| Deliverable | File |
|---|---|
| V4 final review: 1080×1920, 30 fps, 946 frames, 31.533 s | `exports/FGW_Cyborg_Bug_Factory_V4_FINAL_REVIEW_1080x1920.mp4` |
| Report | `production/V4_REPORT.md` |
| Mix | `audio/mix/FGW_Cyborg_Bug_Factory_MIX_V4.wav`, `audio/mix/mix_measure_mix_v4.json` |
| QA | `qa/v4/` |
| Source | `source/src/v4/` (composition `CyborgBugFactoryV4`; still `Sheet4`) |

Rebuild V4:

    python3 tools/make_audio_v4.py mix_v4
    (cd source && npx remotion render src/index.ts CyborgBugFactoryV4 ../exports/FGW_Cyborg_Bug_Factory_V4_FINAL_REVIEW_1080x1920.mp4 \
        --props='{"audio":"mix_v4","captions":true}' --image-format=png --crf=16 --x264-preset=slow --pixel-format=yuv420p \
        --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_render_v4.py exports/FGW_Cyborg_Bug_Factory_V4_FINAL_REVIEW_1080x1920.mp4 qa/v4

---

## V3 (review cut, superseded)

**Status (11 Nov 2026):** V3 was rendered from source and checked from the file. **It is not published.** The
recommendation is NOT READY until one human viewing with sound has been done; every factual claim is verified. See
`production/V3_REPORT.md`.

V3 retells the approved narration (unchanged) as a story about a machine that makes cyborg insects:
- an extreme-macro opening of the arm installing a module, with industrial camera HUDs;
- the paper's workstation: one slider platform with rods A and B, a backpack holder, a scan → grasp → implant → latch →
  release cycle, and a 68 s step bar (fix → release);
- a robot-built-from-parts comparison that match-cuts to the insect's legs;
- a rebuilt crevice earthquake scene;
- an ending where the machine starts the next cycle and lands on frame 0.

| Deliverable | File |
|---|---|
| V3 review: 1080×1920, 30 fps, 946 frames, 31.533 s | `exports/FGW_Cyborg_Bug_Factory_V3_REVIEW_1080x1920.mp4` |
| Report | `production/V3_REPORT.md` |
| Verification | `research/SCIENCE_NOTES.md`, V2 and V3 updates |
| Mix | `audio/mix/FGW_Cyborg_Bug_Factory_MIX_V3.wav`, `audio/mix/mix_measure_mix_v3.json`, `audio/sfx_log_mix_v3.json` |
| QA | `qa/v3/` |
| Source | `source/src/v3/` (composition `CyborgBugFactoryV3`; still `Sheet3`) |

Rebuild V3:

    python3 tools/make_audio_v3.py mix_v3
    (cd source && npx remotion render src/index.ts CyborgBugFactoryV3 ../exports/FGW_Cyborg_Bug_Factory_V3_REVIEW_1080x1920.mp4 \
        --props='{"audio":"mix_v3","captions":true}' --image-format=png --crf=16 --x264-preset=slow --pixel-format=yuv420p \
        --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_render_v3.py exports/FGW_Cyborg_Bug_Factory_V3_REVIEW_1080x1920.mp4 qa/v3

---

## V2 (review cut, superseded)

**Status (11 Nov 2026):** V2 was rendered from source and checked from the file. **It is not published.** The
recommendation is NOT READY until one human viewing with sound has been done; there are no factual blockers. See
`production/V2_REPORT.md`.

V2 is a complete visual rebuild on the same approved narration (V1 master, unchanged). It adds:
- a dark lab;
- a payoff-first opening (a cyborg steered in a narrow passage);
- a match cut into the installation;
- a control demo;
- a physical robot-vs-insect comparison that flows continuously into the earthquake rubble;
- an ending that is the opening cyborg's own route, so the loop is continuous by construction.

| Deliverable | File |
|---|---|
| V2 review: 1080×1920, 30 fps, 946 frames, 31.533 s | `exports/FGW_Cyborg_Bug_Factory_V2_REVIEW_1080x1920.mp4` |
| Report (changes, verification, QA, loop, issues, recommendation) | `production/V2_REPORT.md` |
| Narration map | `production/V2_NARRATION_MAP.md` |
| Verification (first-hand, with quotes) | `research/SCIENCE_NOTES.md`, V2 update |
| Mix (same narration) | `audio/mix/FGW_Cyborg_Bug_Factory_MIX_V2.wav`, `audio/mix/mix_measure_mix_v2.json`, `audio/sfx_log_mix_v2.json` |
| QA | `qa/v2/`, including `loop_seam_x5.mp4`, `first_3s_every_frame.png`, `phone_size_beats.png` |
| Source | `source/src/v2/` (composition `CyborgBugFactoryV2`; still `Sheet2`) |

Rebuild V2:

    python3 tools/make_audio_v2.py mix_v2
    (cd source && npx remotion render src/index.ts CyborgBugFactoryV2 ../exports/FGW_Cyborg_Bug_Factory_V2_REVIEW_1080x1920.mp4 \
        --props='{"audio":"mix_v2","captions":true}' --image-format=png --crf=16 --x264-preset=slow --pixel-format=yuv420p \
        --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_render_v2.py exports/FGW_Cyborg_Bug_Factory_V2_REVIEW_1080x1920.mp4 qa/v2

To make a contact sheet: `cd source && ./sheet2.sh out.png "f1,f2,..." [captions] [cols]`.

---

## V1 (review cut, superseded)

**Status (11 Nov 2026):** V1 was rendered from source and checked from the file. Nobody has watched it in real time
with sound; this environment has no audio or video output. **It is not published.** The report is
`production/V1_REPORT.md`.

| Deliverable | File |
|---|---|
| V1 review: 1080×1920, 30 fps, 946 frames, 31.533 s, captions burned in, loops back into frame 0 | `exports/FGW_Cyborg_Bug_Factory_V1_REVIEW_1080x1920.mp4` |
| Final narration (approved script, verbatim; ElevenLabs Test Voice, take 2) | `audio/narration/FGW_Cyborg_Bug_Factory_narration_V1.wav`; provenance in `audio/narration/voice_provenance.json` |
| Mix, levels and effects log | `audio/mix/FGW_Cyborg_Bug_Factory_MIX_V1.wav`, `audio/mix/mix_measure_mix_v1.json`, `audio/sfx_log_mix_v1.json` |
| Caption timing (word times and phrase captions); SRT | `captions/FGW_Cyborg_Bug_Factory_V1_timing.json`; `captions/FGW_Cyborg_Bug_Factory_V1.srt` |
| Scientific verification notes | `research/SCIENCE_NOTES.md` |
| Production review | `production/V1_REPORT.md` |
| QA evidence | `qa/` |
| Locked narration | `production/NARRATION_LOCKED.txt` |
| Source (Remotion) | `source/src/` (composition `CyborgBugFactoryV1`; still `Sheet`) |

## How it is built

- **One world, one rig.** The picture is programmatic 2.5D vector art in the Weird Crew finish: navy ink contours,
  gradient fills from an upper-left key light and restrained gloss. The 3D drawing core in `source/src/core/` is
  carried over unchanged from Zombie Ant, which inherited it from Dead Spider; Cyborg Cockroach V5 and Dead Spider V6
  are not in this repository. Everything is in millimetres and seen through one perspective camera model.
- **The cockroach** is a single reusable rig in `source/src/roach/`:
  - a Madagascar hissing cockroach;
  - six IK-solved legs, with feet locked to the ground through each stance in a tripod gait;
  - support for terrain;
  - drawn in a fixed anatomical plate order.
- **The backpack** is `source/src/kit/backpack.tsx`. **The arm** (IK from the tool point) is `source/src/kit/arm.tsx`.
- **The lab** is `source/src/kit/lab.tsx`. One schedule, `source/src/story.ts`, drives the conveyor, the tray, the arm,
  the carriers' clamps, every insect and every backpack. The hook, the 68-second time-lapse, the attach and steer
  close-ups, the factory overhead and the loop are all the same mechanism at different times.
- **The shot list** is `source/src/scenes/Shots.tsx`. A–C are one continuous camera path in the lab. D (the split
  comparison), E (the factory overhead) and F (the earthquake zone) follow deliberate cuts. G returns to the lab and
  cranes into the exact frame-0 view.
- **The loop.** At the end of the film the next insect on the station plays the hook's pre-roll (story `LOOP_K`), so the
  last frame flows into frame 0.

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    # ASR models (k2-fsa GitHub releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26 and sherpa-onnx-whisper-base.en, unpacked in $ASR_ROOT
    ASR_ROOT=/path/to/models python3 tools/make_narration.py      # take -> narration master, word timeline, captions, SRT
    python3 tools/make_audio.py mix_v1                             # effects + music + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts CyborgBugFactoryV1 ../exports/FGW_Cyborg_Bug_Factory_V1_REVIEW_1080x1920.mp4 \
        --props='{"audio":"mix_v1","captions":true}' --image-format=png --crf=16 --x264-preset=slow --pixel-format=yuv420p \
        --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_render.py exports/FGW_Cyborg_Bug_Factory_V1_REVIEW_1080x1920.mp4 qa/v1

To make a working contact sheet: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.
