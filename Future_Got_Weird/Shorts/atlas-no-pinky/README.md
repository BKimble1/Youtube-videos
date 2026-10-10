# Why This Robot Has No Pinky — Atlas Short (Future Got Weird)

Finished vertical Short (1080 × 1920, 30 fps, 34.6 s). **Unpublished.** Review status and limits: `QA_REPORT.md`.

## Files

| Path | What |
| --- | --- |
| `FGW_Atlas_No_Pinky_1080x1920.mp4` | Main clean render |
| `FGW_Atlas_No_Pinky_Captioned_1080x1920.mp4` | Same film with stable phrase captions |
| `FGW_Atlas_No_Pinky.srt` | Captions from the real narration alignment |
| `cover/FGW_Atlas_No_Pinky_Cover.png` | Cover frame |
| `audio/` | Narration, alignment, cue table, stems, mix, SFX log, provenance |
| `source/` | Editable Remotion project (pinned deps, lockfile) |
| `tools/` | `build_cues.py`, `build_audio.py` |
| `script.md`, `claim_ledger.md`, `credits.md`, `QA_REPORT.md`, `PRODUCTION_STATE.md`, `packaging_draft.md` | Final documents |
| `qa/` | Contact sheets and phone-size preview |
| `handoff/` | The original handoff packet (repo only; not in the ZIP) |

## Rebuild

```bash
cd source && npm ci                       # pinned Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
npx tsc --noEmit                          # typecheck
# Chrome *headless shell* is needed (full Chrome refuses old headless). In this sandbox:
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
npx remotion render src/index.ts Short ../FGW_Atlas_No_Pinky_1080x1920.mp4 --crf=16 --x264-preset=medium \
  --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4
npx remotion render src/index.ts ShortCaptioned ../FGW_Atlas_No_Pinky_Captioned_1080x1920.mp4 ...same flags
npx remotion still  src/index.ts Cover ../cover/FGW_Atlas_No_Pinky_Cover.png --browser-executable=$HS
```

Cue table and sound (only needed if the narration or timing changes):

```bash
python3 tools/build_cues.py     # audio/narration_alignment.json -> audio/cues.json, source/src/cues.ts, SRT
python3 tools/build_audio.py    # synthesizes SFX + music, ducks under voice, measures loudness, writes mix + stems
                                # (copies the mix to source/public/audio/final_mix.wav, which the render plays)
```

The narration (`audio/narration*.{mp3,wav}`) is a paid ElevenLabs generation: **do not regenerate** it unless the script changes. `node source/scripts/frames.mjs <outDir> Short 40,525,849 0.5` renders individual frames for review.

## How it fits together

- `source/src/Film.tsx` assembles one SVG world (wall, checker, bench, per-beat props) plus a screen-space HUD; `source/src/film/beats{1,2,3}.tsx` hold the nine beats, `checker.tsx` the guide's timeline, `common.tsx` the shared stage and text.
- `source/src/hand/Hand.tsx` is the hand rig: palm parent, three-segment digit chains, IK helpers, robot/human × front/side layouts.
- `source/src/cues.ts` is generated; every event frame comes from the narration alignment.
