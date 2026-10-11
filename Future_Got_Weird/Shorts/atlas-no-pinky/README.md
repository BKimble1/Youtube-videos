# Why This Robot Has No Pinky — Atlas Short (Future Got Weird) — V3

Vertical Short (1080 × 1920, 30 fps, 34.6 s). **V3 is the final focused polish of V2; unpublished, not uploaded, not scheduled.** V2 and V1 stay available under `v2/` and `v1/`. Review status and limits: `QA_REPORT.md` (**nobody has watched or listened to V3 yet**); per-defect log: `qa/v3/V3_DEFECT_LOG.md`.

## Files

| Path | What |
| --- | --- |
| `FGW_Atlas_No_Pinky_V3_1080x1920.mp4` | V3 clean render |
| `FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4` | V3 with stable phrase captions |
| `FGW_Atlas_No_Pinky_V3.srt` | V3 captions from the real narration alignment (23 cues) |
| `cover/FGW_Atlas_No_Pinky_V3_Cover.png` | Cover (frame 48 of the improved opener; no new generation) |
| `audio/` | Narration + alignment (shared by all versions), `cues_v3.json`, V1 mix/stems |
| `audio/v2/`, `audio/v3/` | V2 / V3 mix, stems (`narration`/`music`/`effects`), `sfx_log.csv`, `MIX_LOG.json` |
| `source/` | Editable Remotion project (pinned deps, lockfile). V3 = `src/v3/*`, `src/cues_v3.ts`; V2 = `src/v2/*`; V1 = `src/Film.tsx`, `src/film/*` |
| `tools/` | `build_cues_v3.py`, `build_audio_v3.py`, `check_contacts.mjs`, `qa_v3.py`, `qa_v3_sheets.sh` (+ the V2 and V1 builders) |
| `script.md`, `claim_ledger.md`, `credits.md`, `QA_REPORT.md`, `PRODUCTION_STATE.md`, `packaging_draft.md` | V3 documents |
| `qa/v3/` | Contact sheets, 360 × 640 caption sheet, safe-zone overlay, loop-seam, opening and TURN frame strips, `automated_checks.txt`, `V3_DEFECT_LOG.md` |
| `handoff/V3_Reassessment_and_Prompt.md` | The owner's V2 reassessment and the V3 prompt, for reproducibility |
| `v2/`, `v1/` | Earlier deliveries (MP4s, SRT, cover, QA report, ledger, script) |

## Rebuild

```bash
cd source && npm ci                       # pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
npx tsc --noEmit
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # headless *shell* is required
npx remotion render src/index.ts Short ../FGW_Atlas_No_Pinky_V3_1080x1920.mp4 --crf=16 --x264-preset=slow \
  --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4
npx remotion render src/index.ts ShortCaptioned ../FGW_Atlas_No_Pinky_V3_Captioned_1080x1920.mp4 ...same flags
# earlier versions: compositions ShortV2 / ShortCaptionedV2 and ShortV1 / ShortCaptionedV1 (their source is unchanged)
```

Cue table, sound and checks (only needed if timing, effects or picture change):

```bash
python3 tools/build_cues_v3.py     # audio/narration_alignment.json -> audio/cues_v3.json, source/src/cues_v3.ts, V3 SRT
python3 tools/build_audio_v3.py    # synthesizes SFX + a loop-periodic music bed, ducks under voice, measures loudness
                                   # -> audio/v3/*, source/public/audio/final_mix_v3.wav (played by the render)
node tools/check_contacts.mjs      # per-frame pad-to-object gaps for the held grips (TURN, washer, blocks); fails above 8 px
python3 tools/qa_v3.py             # automated checks -> qa/v3/automated_checks.txt
tools/qa_v3_sheets.sh              # contact / phone / safe-zone / seam sheets
```

The narration (`audio/narration*.{mp3,wav}`) is a paid ElevenLabs generation reused unchanged: **do not regenerate** it. `node source/scripts/frames.mjs <outDir> Short 0,48,550 0.5` renders individual frames.

## How V3 fits together

- `src/v3/FilmV3.tsx` assembles the shots: tape-wipe and stamp-iris showcase transitions, 6–10-frame slides, attribution pills (public tags only), the caption lane, and the closing receipt tear that reveals the opener rendered at negative time (`t = frame − 1038`), so the last frame is the opener one frame before frame 0.
- `opener.tsx` front-view pinch/release (`openerState(t)` drives frame 0 **and** the pre-roll) · `stage.tsx` backdrops incl. the cool-paper stage · `shots1.tsx` overhead test + decision slip · `shots2.tsx` mechanism (B04) and the three capability shots, each owning its headline · `shots3.tsx` exploded stack, workstation, receipt · `hud.tsx` pills + captions (emphasis timed to the aligned word) · `contacts.ts` pad-capsule geometry and the `solveTip` contact solver · `contactCheck.ts` the per-frame audit run by `tools/check_contacts.mjs`.
- `src/hand/Hand.tsx` is the shared hand rig (palm parent, three-segment digit chains, IK). It was not changed in V3.
- The music bed (`tools/build_audio_v3.py`) runs at 124.855 BPM so 18 bars = 34.6 s and wraps seamlessly across the replay point.
