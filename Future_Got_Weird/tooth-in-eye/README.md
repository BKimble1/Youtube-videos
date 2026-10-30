# Future Got Weird: Doctors Put a Tooth Inside His Eye (OOKP)

## V2 (review, current)

**Status.** A structural rework of V1, rendered from source and checked from the files. **It is not publish-ready.**
It has not been watched or heard in real time, and the "ten years blind" line still needs a confirmed source.

**Report.** `production/V2_REPORT.md`: changes, timeline, QC, unresolved defects.

| Deliverable | File |
|---|---|
| Full review | `exports/FGW_Tooth_Eye_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 810 frames, 27.0 s |
| Hook review (first 4 s) | `exports/FGW_Tooth_Eye_V2_HOOK_REVIEW_1080x1920.mp4` |
| Narration | `audio/narration/FGW_Tooth_Eye_narration_V2.wav`: the same approved take; only long pauses shortened |
| Word times | `audio/narration/FGW_Tooth_Eye_V2_words.json`, `source/src/data/timeline.json` |
| Captions | Burned in. `captions/FGW_Tooth_Eye_V2.srt` (phrases), `captions/FGW_Tooth_Eye_V2_words.srt` (word by word) |
| Mix | `audio/mix/FGW_Tooth_Eye_V2_mix.wav`. Measurements: `audio/mix/mix_measure_v2.json`. Effects log: `audio/sfx_log_v2.json` |
| QA evidence | `qa/v2/` (qc.json, ASR, 2 fps sheet, loop seam, hook frames) |
| Source | `source/src/Scene2.tsx` and friends (composition `ToothEyeV2`) |

**Rebuild V2.** As below, but:
- the narration step now writes the V2 files;
- run `python3 tools/make_audio.py mix_v2`;
- render `ToothEyeV2` with `--props='{"audio":"mix_v2","captions":true}'`.

V1's source is at commit `73ce4c9d`.

## V1 (review, superseded)

**Status.** A review version, rendered from source and checked from the files. **It is not published, and not yet
publish-ready:** it has not been watched or heard in real time, and the "ten years blind" line needs a confirmed
source. See `production/V1_NOTES.md`.

| Deliverable | File |
|---|---|
| Full review | `exports/FGW_Tooth_Eye_V1_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, 871 frames, 29.03 s, H.264 CRF 16, AAC 320 kb/s |
| Hook review (first 4 s) | `exports/FGW_Tooth_Eye_V1_HOOK_REVIEW_1080x1920.mp4` |
| Narration | `audio/narration/FGW_Tooth_Eye_narration_V1.wav`: locked script, one ElevenLabs take (Test Voice, eleven_v4). Provenance: `audio/narration/voice_provenance.json` |
| Word times | `audio/narration/FGW_Tooth_Eye_V1_words.json`, `source/src/data/timeline.json` |
| Captions | Burned in. `captions/FGW_Tooth_Eye_V1.srt` (phrases), `captions/FGW_Tooth_Eye_V1_words.srt` (word by word) |
| Mix | `audio/mix/FGW_Tooth_Eye_V1_mix.wav`. Measurements: `audio/mix/mix_measure.json`. Effects log: `audio/sfx_log.json` |
| Notes | `production/V1_NOTES.md`: transitions, timestamped visual QC, measured QC, retention test, accuracy checklist, open issues |
| QA evidence | `qa/hook/` (first-frame and 5 fps hook sheet), `qa/review/` (qc.json, ASR, 2 fps sheet, loop seam) |
| Source | `source/src/` (Remotion; composition `ToothEyeV1`; implant model sheet: composition `ModelSheet`) |

## Rebuild

    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx pillow
    python3 tools/align_zipformer.py audio/narration/takes/t1_gksf.mp3 <models> audio/narration/takes/t1_gksf_zipformer.json
    python3 tools/make_narration.py                       # take -> narration master, timeline, captions, SRTs
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1                    # effects + mix -> source/public/audio/mix_v1.wav
    (cd source && npm ci && npx remotion render src/index.ts ToothEyeV1 ../exports/FGW_Tooth_Eye_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v1","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
    python3 tools/qc.py exports/FGW_Tooth_Eye_V1_REVIEW_1080x1920.mp4 qa/review <models>

Working sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [captions] [cols]`.

The ASR models (sherpa-onnx Zipformer en-2023-06-26 and Whisper base.en) come from the k2-fsa GitHub releases
(`asr-models`).
