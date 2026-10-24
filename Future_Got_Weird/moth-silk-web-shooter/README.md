# Future Got Weird: Real Web Fluid

## V5 (final animation, pacing and quality pass on the locked narration)

**Status (24 Oct 2026):** the V5 review (1080×1920) was rendered from source and checked from the file; the native
2160×3840 master is being rendered after the review passed (`production/V5_REPORT.md`, which lists the remaining problems).
**Not published.** Nobody has watched it in real time with sound.

| Deliverable | File |
|---|---|
| V5 review: 1080×1920, 30 fps, 952 frames, 31.73 s, captions burned in | `exports/FGW_Real_Web_Fluid_V5_REVIEW_1080x1920.mp4` |
| V5 master: 2160×3840 native (rendered at 2×) | `exports/FGW_Real_Web_Fluid_V5_MASTER_2160x3840.mp4` |
| Report and shot list | `production/V5_REPORT.md`, `production/V5_SHOTS_AND_TRANSITIONS.md` |
| V5 mix (unchanged narration, new effects) and cues | `audio/mix/FGW_Moth_Silk_V5_mix.wav`, `audio/cues_v5.json`, `audio/sfx_cues_v5.json` |
| Source | `source/src/v5/` (composition `RealWebFluidV5`; stills `FilmStillV5`, `SheetV5`) |

Rebuild V5: as V3 with `v5` in place of `v3` (`tools/v5/export_cues_v5.ts`, `tools/v5/make_audio_v5.py`,
`tools/v5/cap_check5.ts`, composition `RealWebFluidV5`, audio `mix_v5`). Contact sheets: `cd source && ./sheet5.sh out.png "f1,f2,..." [true]`.

---

## V4 (momentum and timing pass on the locked narration)

**Status (24 Oct 2026):** the V4 review (1080×1920) and the native 2160×3840 master are rendered from source and
checked from the files (`production/V4_REPORT.md`, which lists the remaining problems). **Not published.** Nobody has
watched it in real time with sound.

| Deliverable | File |
|---|---|
| V4 review: 1080×1920, 30 fps, 952 frames, 31.73 s, captions burned in | `exports/FGW_Real_Web_Fluid_V4_REVIEW_1080x1920.mp4` |
| V4 master: 2160×3840 native (rendered at 2×) | `exports/FGW_Real_Web_Fluid_V4_MASTER_2160x3840.mp4` |
| Report and shot list | `production/V4_REPORT.md`, `production/V4_SHOTS_AND_TRANSITIONS.md` |
| V4 mix (unchanged narration, retargeted effects) and cues | `audio/mix/FGW_Moth_Silk_V4_mix.wav`, `audio/cues_v4.json`, `audio/sfx_cues_v4.json` |
| Source | `source/src/v4/` (composition `RealWebFluidV4`; stills `FilmStillV4`, `SheetV4`) |

Rebuild V4: as V3 with `v4` in place of `v3` (`tools/v4/export_cues_v4.ts`, `tools/v4/make_audio_v4.py`,
`tools/v4/cap_check4.ts`, composition `RealWebFluidV4`, audio `mix_v4`). Contact sheets: `cd source && ./sheet4.sh out.png "f1,f2,..."`.

---

## V3 (final visual pass on the locked V1 narration)

**Status (24 Oct 2026):** the V3 review (1080×1920) and the native 2160×3840 master are rendered from source and
checked from the files (`production/V3_REPORT.md`, which lists the remaining problems). **Not published.** Nobody has
watched it in real time with sound.

| Deliverable | File |
|---|---|
| V3 review: 1080×1920, 30 fps, 952 frames, 31.73 s, captions burned in | `exports/FGW_Real_Web_Fluid_V3_REVIEW_1080x1920.mp4` |
| V3 master: 2160×3840 native (rendered at 2×) | `exports/FGW_Real_Web_Fluid_V3_MASTER_2160x3840.mp4` |
| Report: what was inspected, what changed, checks, remaining problems | `production/V3_REPORT.md` |
| Shots, transitions, one-second audit | `production/V3_SHOTS_AND_TRANSITIONS.md` |
| V3 mix (unchanged narration, rebuilt effects) and cues | `audio/mix/FGW_Moth_Silk_V3_mix.wav`, `audio/cues_v3.json`, `audio/sfx_cues_v3.json` |
| Source | `source/src/v3/` (composition `RealWebFluidV3`; stills `FilmStillV3`, `SheetV3`) |

Rebuild V3:

    cd Future_Got_Weird/moth-silk-web-shooter
    source/node_modules/.bin/esbuild tools/v3/export_cues_v3.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec3.cjs && node /tmp/ec3.cjs audio/cues_v3.json
    python3 tools/v3/make_audio_v3.py      # -> source/public/audio/mix_v3.wav
    source/node_modules/.bin/esbuild tools/v3/cap_check3.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/cc3.cjs && node /tmp/cc3.cjs qa/v3/caption_check.json
    (cd source && npx remotion render src/index.ts RealWebFluidV3 ../exports/FGW_Real_Web_Fluid_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts RealWebFluidV3 ../exports/FGW_Real_Web_Fluid_V3_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix_v3","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=3)
    QA_MIX=source/public/audio/mix_v3.wav python3 tools/qa.py exports/FGW_Real_Web_Fluid_V3_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v3/review

Contact sheets while working: `cd source && ./sheet3.sh out.png "frame1,frame2,..." [true]`. Staging probes:
`tools/v3/probe_bridge.ts`, `probe_lab.ts`, `probe_open.ts`.

---

## V2 (visual rebuild on the locked V1 narration)

**Status (24 Oct 2026):** the V2 review (1080×1920) and the native 2160×3840 master are rendered from source and
checked from the files (`production/V2_REPORT.md`, which lists the remaining problems). **Not published.** Nobody has
watched it in real time with sound.

| Deliverable | File |
|---|---|
| V2 review: 1080×1920, 30 fps, 952 frames, 31.73 s, captions burned in | `exports/FGW_Real_Web_Fluid_V2_REVIEW_1080x1920.mp4` |
| V2 master: 2160×3840 native (rendered at 2×) | `exports/FGW_Real_Web_Fluid_V2_MASTER_2160x3840.mp4` |
| Captions (unchanged text and timing) | `captions/FGW_Moth_Silk_Web_Shooter.srt` |
| Report: references inspected, what changed, checks, remaining problems | `production/V2_REPORT.md` |
| Shots, transitions, one-second audit | `production/V2_SHOTS_AND_TRANSITIONS.md` |
| V2 mix (unchanged narration, rebuilt effects) and cues | `audio/mix/FGW_Moth_Silk_V2_mix.wav`, `audio/cues_v2.json`, `audio/sfx_cues_v2.json` |
| Source | `source/src/v2/` (composition `RealWebFluidV2`; stills `FilmStillV2`, `SheetV2`, `ModelSheetV2`); Death Clock's art system in `source/src/v2/dc/` |

Rebuild V2:

    cd Future_Got_Weird/moth-silk-web-shooter
    source/node_modules/.bin/esbuild tools/v2/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
    python3 tools/v2/make_audio_v2.py      # -> source/public/audio/mix_v2.wav
    source/node_modules/.bin/esbuild tools/v2/cap_check.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/cc.cjs && node /tmp/cc.cjs qa/v2/caption_check.json
    (cd source && npx remotion render src/index.ts RealWebFluidV2 ../exports/FGW_Real_Web_Fluid_V2_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts RealWebFluidV2 ../exports/FGW_Real_Web_Fluid_V2_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=3)
    QA_MIX=source/public/audio/mix_v2.wav python3 tools/qa.py exports/FGW_Real_Web_Fluid_V2_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v2/review

Contact sheets while working: `cd source && ./sheet2.sh out.png "frame1,frame2,..." [true]`.

---

## V1

**Status (24 Oct 2026):** a review cut (1080×1920) and a native 2160×3840 master are rendered from the source
composition and checked from the files (`production/QA_REPORT.md`, which lists the unresolved defects). **Not published. Nothing on the channel was
touched.** Nobody has watched it in real time with sound: this environment has no display or speakers.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 952 frames, 31.73 s, H.264 CRF 16 + AAC 320 kb/s, burned-in captions | `exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×, not upscaled), the same cut | `exports/FGW_Real_Web_Fluid_MASTER_2160x3840.mp4` |
| Captions (26 cues, verbatim, from the measured words) | `captions/FGW_Moth_Silk_Web_Shooter.srt` |
| QA report: checks, results, unresolved defects | `production/QA_REPORT.md` |
| Shot list and transition list | `production/TRANSITIONS.md` |
| Sources, depiction choices, boundaries | `production/SOURCE_NOTES.md` |
| Locked narration (the only authoritative text) | `production/NARRATION_APPROVED.txt` |
| Voice record (voice id, prompt, take, hash, ASR checks) | `audio/narration/voice_provenance.json` |
| Narration and mix | `audio/narration/FGW_Moth_Silk_narration_final.wav`, `audio/mix/FGW_Moth_Silk_mix.wav` |
| Effects list and sound cues from the picture | `audio/sfx_cues.json`, `audio/cues.json` |
| Editable project | `source/` (Remotion 4.0.533, composition `RealWebFluid`; stills `FilmStill`, `Sheet`, `ModelSheet`) |

## Cast and assets (what was reused, what is new)

- **Protagonist:** the Weird Crew "person" from Video 01 (`can-you-hurt-something-that-isnt-alive/.../components/cast.ts`),
  in the turnaround rig of Invisibility Shield V4-V6 (`invisibility-shield/source/src/v6/{Crew6,cast6,geo6,poses6,steps6}`),
  copied to `source/src/rig/` with her design unchanged. New costume options, drawn in the same construction: an open lab
  coat, clear safety glasses and nitrile gloves (lab), long sleeves; the street outfit is her standard one.
- **Runner:** the Crew cast has no antagonist, so, like the V4-V6 guard, he is built only from Crew parts (crew head with
  crop hair, mitt hands, stroke limbs, trapezoid torso) with one new costume: zip jacket, beanie, domino mask.
- **Not found in this repository:** the "recent contact-lens Short" (Infrared Contacts) is referenced in
  `invisibility-shield/audio/narration/voice_provenance.json` but its project is not in the repo, so nothing was taken
  from it. The last script this brief builds on (the steel-blade opening) is not in the repo either.
- **Voice:** the established FGW voice (ElevenLabs "Test Voice", `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), one take, used
  unedited. A second take failed on the workspace's credit quota (128 credits left), so there was no choice of take.
- **Music and effects:** synthesised in `tools/make_audio.py` (no samples, no third-party music).

## Source layout (`source/src/`)

- `rig/`: the Crew rig (`Crew.tsx`, with `ArmPersp`, a true-perspective arm), cast, geometry, poses, footwork,
  curved-path running (`path.ts`) and flat-plane drawing (`draw.tsx`).
- `scenes/Street.tsx`: shot A, the imagined chase (time warp, both runners on curved paths with planted feet, the
  device, the jet, the strand, the tug, the camera).
- `scenes/labWorld.ts`: the lab at true scale as functions of time: her performance, the nozzle, the fiber, the blade
  (kinematic extraction, then a small rigid-body simulation), sand grains.
- `scenes/Lab.tsx`: shots B and D (room, bench, pump, tubes, nozzle, dish, tray, cocoons, test fiber; cameras; the
  final frame is solved to land on frame 0's device).
- `scenes/Macro.tsx`: shot C, the process illustration and its matched entry and exit.
- `Film.tsx`, `Captions.tsx`, `lib.ts`, `Root.tsx`: composition, captions (channel style), timing helpers.

## Rebuild

    cd Future_Got_Weird/moth-silk-web-shooter
    python3 -m pip install soundfile scipy numpy pyloudnorm pocketsphinx sherpa-onnx
    (cd source && npm ci)
    python3 tools/align.py audio/narration/takes/take1.mp3 audio/narration/takes/take1_words.json   # word timeline
    python3 tools/make_narration.py      # final narration, timeline.json, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py          # score, effects, mix -> source/public/audio/mix.wav
    (cd source && npx remotion render src/index.ts RealWebFluid ../exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts RealWebFluid ../exports/FGW_Real_Web_Fluid_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    # checks (Vosk vosk-model-small-en-us-0.15, taken from the npm package transcribe2texts; sherpa-onnx models from
    # the k2-fsa GitHub releases: sherpa-onnx-zipformer-en-2023-06-26, sherpa-onnx-whisper-base.en)
    source/node_modules/.bin/esbuild tools/rig_qa.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/rq.cjs && node /tmp/rq.cjs qa/rig_qa.json
    python3 tools/qa.py exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/review
    python3 tools/asr_sherpa.py exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4 audio/narration/takes/take1_words.json <sherpa_model_root> qa/review_sherpa.json
    python3 tools/motion_scan.py exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4 qa/motion_scan.json
    python3 tools/strips.py exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4 qa/strips hook:0:1.6:2 match:5.0:5.66:2 cocoon:8.4:9.06:2 nozzle:16.2:16.86:2 loop:31.3:31.7:1

Contact sheets while working: `cd source && ./sheet.sh out.png "t1,t2,..." [true]` (12 times, captions optional).
