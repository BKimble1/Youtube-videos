# Future Got Weird: Zombie Ant Fungus

## V3 (current, release candidate)

**Status.** It is not published.

**Deliverable.** `exports/FGW_Zombie_Ant_V3_REVIEW_1080x1920.mp4`: native 1080×1920, 30 fps, 917 frames, 30.57 s.

**Changes and QC gates.** `production/V3_REPORT.md`; evidence in `qa/v3/`.

**Source.** `source/src/` (composition `ZombieAntV3`). The V2 source is at commit `d2eaadc4`, V1's at `f3494a23`.

**Audio.** `audio/mix/FGW_Zombie_Ant_V3_mix.wav` (`python3 tools/make_audio.py mix_v3`).

## V2

**Deliverable.** `exports/FGW_Zombie_Ant_V2_REVIEW_1080x1920.mp4`.

**Changes and QA.** `production/V2_REPORT.md`; evidence in `qa/v2/`.

**Audio.** `audio/mix/FGW_Zombie_Ant_V2_mix.wav`, built by `python3 tools/make_audio.py mix_v2` after re-exporting
`audio/cues.json`. The narration is unchanged.

## V1

**Status.** A review version, rendered from source and checked from the files. **It is not published.** Nobody has
watched it in real time or listened to it: this environment has no display or speakers.

| Deliverable | File |
|---|---|
| Hook review (first 4 s) | `exports/FGW_Zombie_Ant_V1_HOOK_REVIEW_1080x1920.mp4` |
| Full review | `exports/FGW_Zombie_Ant_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 917 frames, 30.57 s, H.264 CRF 16, AAC 320 kb/s |
| Narration (locked script, one ElevenLabs take) | `audio/narration/FGW_Zombie_Ant_narration_V1.wav`, provenance in `audio/narration/voice_provenance.json` |
| Mix, measurements, effects log | `audio/mix/FGW_Zombie_Ant_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_log.json` |
| Captions | burned in; `captions/FGW_Zombie_Ant_V1.srt` |
| Notes: story, transitions, science, QA, open issues | `production/V1_NOTES.md` |
| QA evidence | `qa/hook/`, `qa/review/` |
| Source | `source/src/` (Remotion; composition `ZombieAntV1`) |

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    python3 tools/make_narration.py                       # take -> narration master, timeline, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v3                    # effects + mix -> source/public/audio/mix_v3.wav
    (cd source && npm ci && npx remotion render src/index.ts ZombieAntV3 ../exports/FGW_Zombie_Ant_V3_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`. ASR models (sherpa-onnx Zipformer
en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases: `tools/asr_sherpa.py <audio> <model_root>`.
