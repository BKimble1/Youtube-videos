# Earth Stops. You Don't. — Future Got Weird Short (V4 review cut)

**Status: complete V4 review cut (20.5 s, 1080 × 1920, 30 fps, loops) built; awaiting the owner's whole-film review. Not published, not uploaded, not scheduled. No pull request. No final-ready claim.** Nobody has watched it in real time or listened to it (see `QA_NOTES_V4.md`).

Branch `claude/fgw-earth-stops-short` (created from the Atlas tip `3634cc5`). Checkpoints, all pushed as branches (tag pushes are refused by the remote): **V3 `243eb4d`** (`claude/fgw-earth-stops-v3-checkpoint-243eb4d`, `checkpoints/v6/CHECKPOINT.md`), V2 `f6f000b` (`checkpoints/v5/`), V1 `701648d` (`checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

**Start with `V4_REPORT.md`** (deliverables, V3 → V4 change log with final timecodes, brief-vs-built, creative assessment, spend), then `QA_NOTES_V4.md`, then `PRODUCTION_STATE.md` (what the owner needs to do).

## Deliverables (`exports/v7/`)
| File | What |
|---|---|
| `FGW_EarthStops_V4_Review_1080x1920.mp4` | **the V4 review master**: picture + Test Voice + captions + sound (h264 + AAC) |
| `FGW_EarthStops_V4_ReviewNoMusic_1080x1920.mp4` | the same without the optional tension swell (review sound on this one first) |
| `FGW_EarthStops_V4_Review_Preview_540x960_labeled.mp4` | smaller labeled preview |
| `FGW_EarthStops_V4_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V4_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V4_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | the sound design alone; the swell alone; 48 kHz stems |
| `FGW_EarthStops_V4_Captions.srt` | the 16 caption cues (also burned in) |
| `FGW_EarthStops_V4_Script.md` | final script (copy of `script/SCRIPT.md`) |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, sizes, sha256, exact commands |
V1, V2 and V3 deliverables stay in `exports/v4/`, `exports/v5/` and `exports/v6/` (unchanged; `exports/v6/` is byte-identical to the V3 checkpoint).

## Where things are
| Path | What |
|---|---|
| `script/` | `SCRIPT.md` (V4 as built, 7 lines, 64 words), `STORYBOARD.md` (final timecodes), `CLAIM_LEDGER.md` (V4), `SOURCES.md` (who opened what), `speed_table.json`, `history/` (V1–V3 versions) |
| `source/` | editable Remotion project (pinned deps, lockfile). V4 = `source/src/film4/` (compositions `FilmV4`, `FilmV4-Clean`); V3 = `film3/`; V2 = `film2/`; V1 = `film/`; the cast rig, street and props come from `source/src/v2/` |
| `audio/v7/` | `voice/` (take A/B, cut timeline, alignment, provenance), `cues_v4.json`, `v4/` (per-event WAVs, stems, `SFX_LOG.csv`, `MIX_LOG.json`). V4 generated no new sound effects: the one-shots it reuses are in `audio/v5/sfx_gen/` and `audio/v6/sfx_gen/` |
| `qa/v7/` | `QA_V4.json`, `SCENE_MOTION_V4.json`, `AUDIO_MEASUREMENTS_V4.json`, `CAPTION_SYNC.json`, `enc_all/` (every frame of the final encode, as sheets), `enc/` (picked sheets), `UI_OVERLAY_V4.png`, `PHONE_WIDTH_V4.png`, `render/` (log) |
| `tools/` | V4: `build_voice_v4.py`, `build_cues_v4.mjs`, `build_audio_v4.py`, `audio_ratio_v4.py`, `audio_stem_ratio_v4.py`, `qa_captions_v4.py`, `qa_v4.py`, `qa_motion_v4.py`, `qa_audio_v4.py`, `ui_overlay_v4.py`, `export_v4.py`, `stills_sheet.py` · shared `sheets_v3.py`, `foley_lib.py`, `calc_speeds.py` · earlier `*_v3.*`, `*_v2.*`, `*_v1.*` |
| `checkpoints/`, `handoff/` | preserved states; the owner's directive records (`OWNER_APPROVAL_V4.md` is the latest) |
| `V3_REPORT.md`, `QA_NOTES_V3.md`, `V2_REPORT.md`, `V1_REPORT.md`, … | earlier reports (history) |
| `credits.md`, `PRODUCTION_STATE.md` | provenance and licence notes; state and open decisions |

## Rebuild (V4)
```bash
cd source && npm ci && npx tsc --noEmit                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell      # the headless *shell* is required
F="--browser-executable=$HS --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
mkdir -p ../qa/v7/render && npx remotion render src/index.ts FilmV4 ../qa/v7/render/FilmV4_silent_raw.mp4 $F    # ~5 min on 4 cores
cd ..
python3 tools/build_voice_v4.py                                                                       # voice timeline + source/src/film4/voice4.json (from audio/v7/voice/v4_takeA_48k.wav)
node tools/build_cues_v4.mjs && python3 tools/build_audio_v4.py && python3 tools/audio_ratio_v4.py   # cues come from the SAME TS modules as the picture
python3 tools/qa_captions_v4.py                                                                       # caption timing + SRT
python3 tools/export_v4.py                                                                            # mux, preview, stems, metadata
python3 tools/qa_v4.py exports/v7/FGW_EarthStops_V4_Review_1080x1920.mp4 && python3 tools/qa_motion_v4.py && python3 tools/qa_audio_v4.py && python3 tools/ui_overlay_v4.py
python3 tools/sheets_v3.py exports/v7/FGW_EarthStops_V4_Silent_1080x1920.mp4 qa/v7/enc pick 0,9,15,18:4   # decoded-frame sheets
node scripts/frames.mjs <outDir> FilmV4 0,100,400 0.5                                                 # (from source/) individual stills
```
The narration, the generated sound effects and the Scribe times are inputs already in `audio/v7/`, `audio/v6/`, `audio/v5/` (regenerating them spends ElevenLabs credits; do not repeat blindly). Every position in the film is a pure function of the frame number; the picture, the caption lane, the cue builder and the audio all read the same TypeScript modules (`source/src/film4/*`). The loop is a shared-constants contract: `Brake4.tsx` (`BK`, `padGap(t)`), `Space4.tsx` (`rotAll`), `Globe4.tsx` (`SpaceBG`).

## Claims
`script/CLAIM_LEDGER.md` keeps the imaginary event distinct from the real physics. The brake is an impossible visual metaphor (it arrests spin, not orbit; no feasibility claim). Number: ground speed v = ω·N·cos φ (WGS 84): equator 1,040.4 mph (shown as `~1,000 MPH` on the `EQUATOR` plate, equator only). **Claude opened no source page** (hosts refused or unresolvable); the reviewer's reads (R1–R6) are recorded as the reviewer's in `script/SOURCES.md`.

## History
v1 prototype `0783b00` → E-A v2 / E-C `a885fd5` → hybrid hook H1 `dea9b81` → V1 review cut `701648d` → V2 review cut `f6f000b` → V3 review cut `243eb4d` → **V4 review cut** (this branch).
