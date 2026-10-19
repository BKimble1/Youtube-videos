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
