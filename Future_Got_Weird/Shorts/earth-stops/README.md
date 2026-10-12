# Earth Stops. You Don't. — Future Got Weird Short (V3 review cut)

**Status: complete V3 review cut (24.8 s, 1080 × 1920, 30 fps, loops) built; awaiting the owner's whole-film review. Not published, not uploaded, not scheduled. No pull request. No final-ready claim.** Nobody has watched it in real time or listened to it (see `QA_NOTES_V3.md`).

Branch `claude/fgw-earth-stops-short` (created from the Atlas tip `3634cc5`). Checkpoints, all pushed as branches (tag pushes are refused by the remote): **V2 `f6f000b`** (`claude/fgw-earth-stops-v2-checkpoint-f6f000b`, `checkpoints/v5/CHECKPOINT.md`), V1 `701648d` (`checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

**Start with `V3_REPORT.md`** (deliverables, V2 → V3 change log with final timecodes, brief-vs-built, creative assessment, spend), then `QA_NOTES_V3.md`, then `PRODUCTION_STATE.md` (what the owner needs to do).

## Deliverables (`exports/v6/`)
| File | What |
|---|---|
| `FGW_EarthStops_V3_Review_1080x1920.mp4` | **the V3 review master**: picture + Test Voice + captions + sound (h264 + AAC) |
| `FGW_EarthStops_V3_ReviewNoMusic_1080x1920.mp4` | the same without the optional tension swell (review sound on this one first) |
| `FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4` | smaller labeled preview |
| `FGW_EarthStops_V3_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V3_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V3_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | the sound design alone; the swell alone; 48 kHz stems |
| `FGW_EarthStops_V3_Captions.srt` | the 14 caption cues (also burned in) |
| `FGW_EarthStops_V3_Script.md` | final script (copy of `script/SCRIPT.md`) |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, sizes, sha256, exact commands |
V1 and V2 deliverables stay in `exports/v4/` and `exports/v5/` (unchanged).

## Where things are
| Path | What |
|---|---|
| `script/` | `SCRIPT.md` (V3 as built, 7 lines, 55 words), `STORYBOARD.md` (final timecodes), `CLAIM_LEDGER.md` (V3), `SOURCES.md` (who opened what), `speed_table.json`, `history/` (V1 and V2 versions) |
| `source/` | editable Remotion project (pinned deps, lockfile). V3 = `source/src/film3/` (compositions `FilmV3`, `FilmV3-Clean`); V2 = `film2/`; V1 = `film/`; the cast rig, street and props come from `source/src/v2/` |
| `audio/v6/` | `voice/` (take A/B, selected take, cut timeline, alignment, analysis, provenance), `sfx_gen/` (10 new generated clips + manifest), `cues_v3.json`, `v3/` (per-event WAVs, stems, `SFX_LOG.csv`, `MIX_LOG.json`) |
| `qa/v6/` | `QA_V3.json`, `AUDIO_MEASUREMENTS_V3.json`, `CAPTION_SYNC.json`, `enc/` and `enc2/` (sheets of decoded frames), `UI_OVERLAY_V3.png`, `PHONE_WIDTH_V3.png`, `render/` (log) |
| `tools/` | V3: `build_voice_v3.py`, `build_cues_v3.mjs`, `build_audio_v3.py`, `audio_ratio_v3.py`, `audio_stem_ratio_v3.py`, `qa_captions_v3.py`, `qa_v3.py`, `sheets_v3.py`, `ui_overlay_v3.py`, `export_v3.py`, `voice_analyse_v6.py` · shared `foley_lib.py`, `calc_speeds.py` · earlier `*_v2.*`, `*_v1.*` |
| `checkpoints/`, `handoff/` | preserved states; the owner's directive records (`OWNER_APPROVAL_V3.md` is the latest) |
| `V2_REPORT.md`, `QA_NOTES_V2.md`, `V1_REPORT.md`, `QA_NOTES_V1.md`, `HOOK_H1_REPORT.md`, `PROTOTYPE_*` | earlier reports (history) |
| `credits.md`, `PRODUCTION_STATE.md` | provenance and licence notes; state and open decisions |

## Rebuild (V3)
```bash
cd source && npm ci && npx tsc --noEmit                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell      # the headless *shell* is required
F="--browser-executable=$HS --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
mkdir -p ../qa/v6/render && npx remotion render src/index.ts FilmV3 ../qa/v6/render/FilmV3_silent_raw.mp4 $F    # ~5 min on 4 cores
cd ..
node tools/build_cues_v3.mjs && python3 tools/build_audio_v3.py && python3 tools/audio_ratio_v3.py   # cues come from the SAME TS modules as the picture
python3 tools/qa_captions_v3.py                                                                       # caption timing + SRT
python3 tools/export_v3.py                                                                            # mux, preview, stems, metadata
python3 tools/qa_v3.py exports/v6/FGW_EarthStops_V3_Review_1080x1920.mp4 && python3 tools/ui_overlay_v3.py
python3 tools/sheets_v3.py exports/v6/FGW_EarthStops_V3_Silent_1080x1920.mp4 qa/v6/enc2 pick 0,14,20,36:4   # decoded-frame sheets
node scripts/frames.mjs <outDir> FilmV3 0,100,400 0.5                                                 # (from source/) individual stills
```
The narration, generated sound effects and Scribe times are inputs already in `audio/v6/` (regenerating them spends ElevenLabs credits; do not repeat blindly). Every position in the film is a pure function of the frame number; the picture, the caption lane, the cue builder and the audio all read the same TypeScript modules (`source/src/film3/*`). The loop is a shared-constants contract: `Brake3.tsx` (`BK`, `padGap(t)`), `Space3.tsx` (`rotAll`), `Globe3.tsx` (`SpaceBG`).

## Claims
`script/CLAIM_LEDGER.md` keeps the imaginary event distinct from the real physics. The brake is an impossible visual metaphor (it arrests spin, not orbit; no feasibility claim). Number: ground speed v = ω·N·cos φ (WGS 84): equator 1,040.4 mph (shown as `~1,000 MPH` with `EQUATOR`, equator only). **Claude opened no source page** (hosts refused or unresolvable); the reviewer's reads (R1–R6) are recorded as the reviewer's in `script/SOURCES.md`.

## History
v1 prototype `0783b00` → E-A v2 / E-C `a885fd5` → hybrid hook H1 `dea9b81` → V1 review cut `701648d` → V2 review cut `f6f000b` → **V3 review cut** (this branch).
