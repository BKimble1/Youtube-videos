# Future Got Weird: Doctors Grew an Ear Inside Her Arm

## V3 FINAL REVIEW (current)

**Status.** A final review copy. **It is not published.**

**Deliverable.** `exports/FGW_Ear_Forearm_V3_FINAL_REVIEW.mp4`: 1080×1920 (verified), 30 fps, 609 frames, 20.3 s.

**What changed.** V3 is a polish of V2: the implantation under intact skin, and the transfer continuity. The opening,
the shot order, the narration, the mix and the ending are unchanged.

**Report.** `production/V3_FINAL_REPORT.md`. QA evidence is in `qa/v3/`.

**Rebuild.** Render composition `EarForearmV3` with `--props='{"audio":"mix_v2","captions":true}'`.

## V2

**Status.** A review version, checked from the files. **It is not published.**

**Deliverable.** `exports/FGW_Ear_Forearm_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 609 frames, 20.3 s.

**Report.** `production/V2_REPORT.md`: changes, measured QA and remaining issues.

**Narration and audio.**
- Same locked take as V1, with tightened sentence gaps: `audio/narration/FGW_Ear_Forearm_narration_V2.wav`.
- Mix: `audio/mix/FGW_Ear_Forearm_V2_mix.wav`.
- Captions: `captions/FGW_Ear_Forearm_V2.srt`.

**QA evidence.** `qa/v2/`.

**Source.** `source/src/` (composition `EarForearmV2`). The V1 source is at commit `4f47c44`.

**Rebuild.** As below, with these changes:
- run `make_audio.py mix_v2`;
- render `EarForearmV2` with `--props='{"audio":"mix_v2","captions":true}'`.

## V1

**Status.** A review version, rendered from source and checked from the files. **It is not published.**

**Deliverable.** `exports/FGW_Ear_Forearm_V1_REVIEW_1080x1920.mp4`

- 1080×1920, 30 fps, 645 frames, 21.5 s.
- H.264 CRF 16, AAC 320 kb/s.
- Captions burned in.

**Report.** `production/V1_QUALITY_REPORT.md`: a timestamped scene log, the transition list, measured QA, the quality
gates, the factual basis and open issues.

| Item | File |
|---|---|
| Locked narration / exact timed transcript | `production/NARRATION_LOCKED.txt`, `production/NARRATION_TRANSCRIPT.txt` |
| Narration master and provenance (ElevenLabs Test Voice, eleven_v4) | `audio/narration/FGW_Ear_Forearm_narration_V1.wav`, `audio/narration/voice_provenance.json` |
| Final mix, measurements, effects log | `audio/mix/FGW_Ear_Forearm_V1_mix.wav`, `audio/mix/mix_measure_v1.json`, `audio/sfx_log_v1.json` |
| Captions | `captions/FGW_Ear_Forearm_V1.srt` |
| QA evidence | `qa/` (ffprobe, ASR of the MP4, loudness, frame steps), `qa/review/` (sheets cut from the MP4) |
| Source | `source/src/` (Remotion; composition `EarForearmV1`) |

## How it is built

**Picture.** Deterministic Remotion/SVG: one drawing of an anonymous patient in three-quarter view, and one continuous
camera (`source/src/world/camera.ts`).

**The ear.** There is one ear geometry (`world/ear.tsx`), lit as a height map by an SVG lighting filter. That gives the
same ridges at every stage:
- the carved cartilage;
- the relief under the forearm skin;
- the flap;
- the finished ear.

**Timing.** Every event is keyed to measured word times (`world/story.ts`).

**Sound.** All effects are synthesised and placed from the picture's own events (`audio/cues.json`).

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    python3 tools/make_narration.py                 # take -> narration master, timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1              # effects + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts EarForearmV1 ../exports/FGW_Ear_Forearm_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)

**QA helpers.**
- `tools/vsheet.sh in.mp4 out.jpg "f1,f2,..." [cols] [width]`: contact sheets cut from a rendered video.
- `tools/frame_steps.py in.mp4`: frame-step and loop-seam scan.
- `tools/asr_sherpa.py <audio> <model_root>`: ASR. The models (sherpa-onnx Zipformer en-2023-06-26 and Whisper
  base.en) come from the k2-fsa GitHub releases.

The `Sheet` composition shares SVG filter ids across panels, so use `vsheet.sh` on a render for any frame after the
first panel.
