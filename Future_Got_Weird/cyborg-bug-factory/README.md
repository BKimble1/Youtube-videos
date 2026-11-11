# Future Got Weird: Scientists Built a Cyborg Bug Factory

## V1 (review cut)

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
