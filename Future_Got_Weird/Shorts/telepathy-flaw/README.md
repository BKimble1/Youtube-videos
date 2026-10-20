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
