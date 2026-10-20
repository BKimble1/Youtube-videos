# The Telepathy Flaw — Future Got Weird Short (R1)

30.000 s, 1080×1920 / 2160×3840, 30 fps. Death Clock style (V4 rig, captions, narrator voice). **Fictional future scenario.**

## Deliverables (`exports/`)
| file | note |
|---|---|
| `FGW_TelepathyFlaw_DeathClockStyle_R1_REVIEW_1080x1920.mp4` | review render, H.264 + AAC 320k |
| `FGW_TelepathyFlaw_DeathClockStyle_R1_2160x3840.mp4` | native 4K render (Remotion `--scale=2`, not an upscale) |
| `captions/FGW_TelepathyFlaw.srt` | 27 cues tiling the 81 locked words exactly |
| `../audio/` (project) | narration, music, effects stems (int24, sum exactly to the mix) and the −16 LUFS mix |
| `EXPORT_METADATA.json` | ffprobe summary and sha256 of both MP4s |

## Layout
- `source/` Remotion 4 project. `src/lib/timeline.ts` (cue authority from the narration word times), `src/lib/choreo.ts` (all motion, pure functions of time), `src/art/*` (rig and UI), `src/shots/Scene.tsx` (the world), `src/Film.tsx` (iris loop, labels, captions). Compositions: `TelepathyFlaw` (captioned) and `TelepathyFlawClean`.
- `tools/` voice build, audio build, export/mux, QA scripts. `audio/` narration takes and cue data. `qa/` QA outputs. `script/` locked narration, notes. `upload/` packaging.

## Rebuild
```
cd source && npm install
npx tsx scripts/export_cues.ts && npx tsx scripts/export_srt.ts
cd .. && python3 tools/build_audio.py
cd source && npx remotion render src/index.ts TelepathyFlaw ../exports/_wip/silent_captioned.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted
cd .. && python3 tools/export.py exports/_wip/silent_captioned.mp4 FGW_TelepathyFlaw_DeathClockStyle_R1_REVIEW_1080x1920.mp4
# 4K: add --scale=2 to the render and name the output ..._2160x3840.mp4
```
Voice is not rebuilt offline: `audio/narration/takes/` holds the selected ElevenLabs take; `tools/build_voice.py` conditions it.

## Loop
Every periodic motion has a period dividing 30 s; the closing iris reveals the opening scene evaluated at negative time, so the last frame hands over to frame 0. Measured by `tools/seam_check.py` (`qa/seam/`).

## V2
See `V2_CHANGES.md`. V2 files: `exports/FGW_TelepathyFlaw_DeathClockStyle_V2_REVIEW_1080x1920.mp4`, `..._V2_2160x3840.mp4`, `captions/FGW_TelepathyFlaw_V2.srt`, `audio/v2/` (stems and mix), `source/src/v2/`.
```
cd source && npx tsx scripts/export_cues2.ts && cd .. && python3 -B tools/build_audio_v2.py
cd source && npx remotion render src/index.ts TelepathyFlawV2 ../exports/_wip/v2_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted
cd .. && python3 tools/export_v2.py exports/_wip/v2_silent.mp4 FGW_TelepathyFlaw_DeathClockStyle_V2_REVIEW_1080x1920.mp4
# 4K: add --scale=2 and name the output ..._V2_2160x3840.mp4
python3 tools/seam_check_v2.py <mp4>; python3 -B tools/qa_audio_v2.py; (cd source && npx tsx scripts/check_layout2.ts)
```
`tools/contact.sh <outdir> TelepathyFlawV2 <frames>` renders labelled contact sheets from source.

## V3 (final cleanup of V2)
See `V3_NOTES.md`. Files: `exports/FGW_TelepathyFlaw_DeathClockStyle_V3_FINAL_1080x1920.mp4`, `..._V3_FINAL_2160x3840.mp4`, `audio/v3/`, `source/src/v3/`, `qa/v3/`. The V2 SRT is still valid.
```
cd source && npx tsx scripts/export_cues3.ts && npx tsx scripts/audit_layers3.ts && cd .. && python3 -B tools/build_audio_v3.py
cd source && npx remotion render src/index.ts TelepathyFlawV3 ../exports/_wip/v3_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted
cd .. && python3 tools/export_v3.py exports/_wip/v3_silent.mp4 FGW_TelepathyFlaw_DeathClockStyle_V3_FINAL_1080x1920.mp4
python3 tools/seam_check_v3.py <mp4>; python3 -B tools/qa_audio_v3.py; (cd source && npx tsx scripts/check_layout3.ts)
```

## V4 (visual rebuild)
See `V4_NOTES.md`. Files: `exports/FGW_TelepathyFlaw_V4_Review_1080x1920.mp4` (captioned) and `exports/FGW_TelepathyFlaw_V4_Clean_NoCaptions_1080x1920.mp4`, `audio/v4/` (the approved V3 narration and music stems unchanged, a rebuilt effects stem, the mix), `source/src/v4/`, `qa/v4/` (pose sheet, comparison sheet, rig/layout/audio/seam checks). The existing SRT is still valid (captions unchanged).
```
cd source && npx remotion render src/index.ts TelepathyFlawV4 ../exports/_wip/v4_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
cd source && npx remotion render src/index.ts TelepathyFlawV4Clean ../exports/_wip/v4_clean_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
python3 -B tools/build_audio_v4.py        # effects only; narration and music stems are copied from audio/v3 unchanged
python3 tools/export_v4.py exports/_wip/v4_silent.mp4 FGW_TelepathyFlaw_V4_Review_1080x1920.mp4
python3 tools/export_v4.py exports/_wip/v4_clean_silent.mp4 FGW_TelepathyFlaw_V4_Clean_NoCaptions_1080x1920.mp4
python3 -B tools/qa_audio_v4.py; python3 tools/seam_check_v4.py <mp4> qa/v4/seam; python3 tools/motion_scan.py <mp4>
(cd source && npx tsx scripts/check_rig4.ts && npx tsx scripts/check_layout4.ts)
python3 tools/shotsheet.py qa/_wip/shots; python3 tools/video_sheets.py <mp4> qa/_wip/sheets
python3 tools/make_comparison.py <V4.mp4> <DeathClock.mp4> <V3.mp4> qa/v4/COMPARISON_SHEET.png
(cd source && scripts/lab.sh posesF)       # internal pose sheet; scripts/lab.sh heads for the head views
```

## V5 (final animation and clarity pass)
See `V5_NOTES.md` (what changed) and `DEFECT_LOG_V5.md` (what was fixed and how it was checked). Files: `exports/FGW_TelepathyFlaw_V5_Review_1080x1920.mp4` (captioned), `exports/FGW_TelepathyFlaw_V5_Clean_NoCaptions_1080x1920.mp4`, `exports/FGW_TelepathyFlaw_V5_Master_2160x3840.mp4` (native 4K), `exports/EXPORT_METADATA_V5.json`, `source/src/v5/`, `qa/v5/`. Audio is the approved V4 mix, unchanged (`audio/v4/mix/`); no audio was regenerated. V4 is untouched.
```
cd source && npx remotion render src/index.ts TelepathyFlawV5 ../exports/_wip/v5_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
cd source && npx remotion render src/index.ts TelepathyFlawV5Clean ../exports/_wip/v5_clean_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
cd source && npx remotion render src/index.ts TelepathyFlawV5 ../exports/_wip/v5_silent_4k.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4 --scale=2
python3 tools/export_v5.py exports/_wip/v5_silent.mp4 FGW_TelepathyFlaw_V5_Review_1080x1920.mp4        # also the clean and 4K files; muxes the approved mix, refuses if its hash changed
python3 tools/seam_check_v4.py <mp4> <outdir>; python3 tools/motion_scan.py <mp4> qa/v4/cuts.json qa/v5/MOTION_SCAN.json; python3 tools/caption_contrast.py <captioned> <clean> qa/v5/CAPTION_CONTRAST.json
(cd source && npx tsx scripts/check_rig5.ts && npx tsx scripts/check_layout5.ts)
```
