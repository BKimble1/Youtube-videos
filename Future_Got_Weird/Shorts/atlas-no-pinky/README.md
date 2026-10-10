# Why This Robot Has No Pinky — Atlas Short (Future Got Weird) — V2

Vertical Short (1080 × 1920, 30 fps, 34.6 s). **V2 is a substantive visual revision; unpublished, not uploaded, not scheduled.** The V1 baseline stays available under `v1/`. Review status and limits: `QA_REPORT.md` (**nobody has watched or listened to V2 yet**).

## Files

| Path | What |
| --- | --- |
| `FGW_Atlas_No_Pinky_V2_1080x1920.mp4` | V2 clean render |
| `FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4` | V2 with stable 3–6-word captions |
| `FGW_Atlas_No_Pinky_V2.srt` | V2 captions from the real narration alignment |
| `cover/FGW_Atlas_No_Pinky_V2_Cover.png` | Cover (frame 56 of the selected opening; no new generation) |
| `audio/` | Narration + alignment (shared with V1), `cues_v2.json`, V1 mix/stems |
| `audio/v2/` | V2 mix, stems (`narration`/`music`/`effects`), `sfx_log.csv`, `MIX_LOG.json` |
| `source/` | Editable Remotion project (pinned deps, lockfile). V2 = `src/v2/*`, `src/cues_v2.ts` |
| `tools/` | `build_cues_v2.py`, `build_audio_v2.py`, `qa_v2.py`, `qa_v2_sheets.sh` (+ V1 `build_cues.py`, `build_audio.py`) |
| `script.md`, `claim_ledger.md`, `credits.md`, `QA_REPORT.md`, `PRODUCTION_STATE.md`, `packaging_draft.md` | V2 documents |
| `qa/v2/` | Contact sheets, 360 × 640 caption sheet, safe-zone overlay, loop-seam frames, `automated_checks.txt` |
| `v1/` | Baseline: V1 MP4s, SRT, cover, `QA_REPORT_V1.md`, `claim_ledger_V1.md`, `script_V1.md` |
| `qa/` (top level), `handoff/` | V1 sheets; the original handoff packet (repo only) |

## Rebuild

```bash
cd source && npm ci                       # pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
npx tsc --noEmit
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # headless *shell* is required
npx remotion render src/index.ts Short ../FGW_Atlas_No_Pinky_V2_1080x1920.mp4 --crf=16 --x264-preset=slow \
  --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4
npx remotion render src/index.ts ShortCaptioned ../FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4 ...same flags
# baseline: compositions ShortV1 / ShortCaptionedV1 (V1 source is unchanged)
```

Cue table and sound (only needed if timing or effects change):

```bash
python3 tools/build_cues_v2.py     # audio/narration_alignment.json -> audio/cues_v2.json, source/src/cues_v2.ts, V2 SRT
python3 tools/build_audio_v2.py    # synthesizes SFX + music, ducks under voice, measures loudness
                                   # -> audio/v2/*, source/public/audio/final_mix_v2.wav (played by the render)
python3 tools/qa_v2.py             # automated checks -> qa/v2/automated_checks.txt
tools/qa_v2_sheets.sh              # contact / phone / safe-zone / seam sheets
```

The narration (`audio/narration*.{mp3,wav}`) is a paid ElevenLabs generation reused unchanged: **do not regenerate** it. `node source/scripts/frames.mjs <outDir> Short 0,56,300 0.5` renders individual frames.

## How V2 fits together

- `src/v2/FilmV2.tsx` assembles shot-local stages (no permanent bench): tape-wipe and stamp-iris showcase transitions, 6–10-frame slides, attribution pills, caption lane, and the closing receipt tear that reveals the opener rendered at negative time (`t = frame − 1038`), so the last frame is the opener one frame before frame 0.
- `src/v2/stage.tsx` backdrops · `opener.tsx` hook · `shots1.tsx` overhead test + decision slip · `shots2.tsx` mechanism macro + three capability angles · `shots3.tsx` exploded diagram, workstation, receipt · `hud.tsx` pills + captions · `util.tsx` guide placement/arm.
- `src/hand/Hand.tsx` is the shared hand rig (palm parent, three-segment digit chains, IK, robot/human × front/side). V2 added `nails`, `armW`, `ghostSide`, `ghostAng` options; V1 behaviour is unchanged by design.
- `src/cues_v2.ts` is generated; every event frame comes from the narration alignment.
