# Earth Stops. You Don't. — Future Got Weird Short (V5 review cut)

**Status: complete V5 review cut (20.5 s, 1080 × 1920, 30 fps, loops) built; awaiting the owner's whole-film review. Not published, not uploaded, not scheduled. No pull request. No final-ready claim.** Nobody has watched it in real time or listened to it (see `QA_NOTES_V5.md`).

Branch `claude/fgw-earth-stops-short` (created from the Atlas tip `3634cc5`). Checkpoints, all pushed as branches (tag pushes are refused by the remote): **V4 `2fb391a`** (`claude/fgw-earth-stops-v4-checkpoint-2fb391a`, `checkpoints/v7/CHECKPOINT.md`), V3 `243eb4d` (`checkpoints/v6/`), V2 `f6f000b` (`checkpoints/v5/`), V1 `701648d` (`checkpoints/v4/`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

**Start with `V5_REPORT.md`** (deliverables, V4 → V5 change log with final timecodes, brief-vs-built, creative assessment), then `QA_NOTES_V5.md`, then `PRODUCTION_STATE.md` (what the owner needs to do).

## Deliverables (`exports/v8/`)
| File | What |
|---|---|
| `FGW_EarthStops_V5_Review_1080x1920.mp4` | **the V4 review master**: picture + Test Voice + captions + sound (h264 + AAC) |
| `FGW_EarthStops_V5_ReviewNoMusic_1080x1920.mp4` | the same without the optional tension swell (review sound on this one first) |
| `FGW_EarthStops_V5_Review_Preview_540x960_labeled.mp4` | smaller labeled preview |
| `FGW_EarthStops_V5_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V5_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V5_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | the sound design alone; the swell alone; 48 kHz stems |
| `FGW_EarthStops_V5_Captions.srt` | the 16 caption cues (also burned in) |
| `FGW_EarthStops_V5_Script.md` | final script (copy of `script/SCRIPT.md`) |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, sizes, sha256, exact commands |
V1–V4 deliverables stay in `exports/v4/`, `exports/v5/`, `exports/v6/` and `exports/v7/` (unchanged; `exports/v7/` is byte-identical to the V4 checkpoint).

## Where things are
| Path | What |
|---|---|
| `script/` | `SCRIPT.md` (V5 as built, 7 lines, 64 words; the words are V4's), `STORYBOARD.md` (final timecodes), `CLAIM_LEDGER.md` (V4), `SOURCES.md` (who opened what), `speed_table.json`, `history/` (V1–V4 versions) |
| `source/` | editable Remotion project (pinned deps, lockfile). V5 = `source/src/film5/` (compositions `FilmV5`, `FilmV5-Clean`; `Opening5.ts` is the pinned-foot choreography, `Bystander5.tsx` the second person); V4 = `film4/`; V3 = `film3/`; V2 = `film2/`; V1 = `film/`; the cast rig, street and props come from `source/src/v2/` |
| `audio/v8/` | `cues_v5.json`, `v5/` (per-event WAVs, stems, `SFX_LOG.csv`, `MIX_LOG.json`). The voice is `audio/v7/voice/` (take A/B, cut timeline, alignment, provenance; unchanged). V4 and V5 generated no new sound effects: the one-shots they reuse are in `audio/v5/sfx_gen/` and `audio/v6/sfx_gen/` |
| `qa/v8/` | `QA_V5.json`, `SCENE_MOTION_V5.json`, `V4_V5_PICTURE_DIFF.json`, `OPENING_PROBE_V5.json`, `FLAGGED_WINDOWS_V4_V5.json`, `AUDIO_MEASUREMENTS_V5.json`, `CAPTION_SYNC.json`, `enc_all/` (every frame of the final encode, as sheets), `enc/` (picked sheets), `UI_OVERLAY_V5.png`, `PHONE_WIDTH_V5.png`, `render/` (log) |
| `tools/` | V5: `build_cues_v5.mjs`, `build_audio_v5.py`, `probe_opening_v5.mjs`, `audio_ratio_v5.py`, `audio_stem_ratio_v5.py`, `qa_captions_v5.py`, `qa_v5.py`, `qa_motion_v5.py`, `qa_audio_v5.py`, `qa_flagged_v5.py`, `ui_overlay_v5.py`, `export_v5.py` (the voice is V4's: `build_voice_v4.py`) · V4: `*_v4.*` · shared `sheets_v3.py`, `foley_lib.py`, `calc_speeds.py` · earlier `*_v3.*`, `*_v2.*`, `*_v1.*` |
| `checkpoints/`, `handoff/` | preserved states; the owner's directive records (`OWNER_APPROVAL_V5.md` is the latest) |
| `V4_REPORT.md`, `QA_NOTES_V4.md`, `V3_REPORT.md`, `QA_NOTES_V3.md`, `V2_REPORT.md`, `V1_REPORT.md`, … | earlier reports (history) |
| `credits.md`, `PRODUCTION_STATE.md` | provenance and licence notes; state and open decisions |

## Rebuild (V5)
```bash
cd source && npm ci && npx tsc --noEmit                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell      # the headless *shell* is required
F="--browser-executable=$HS --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
mkdir -p ../qa/v8/render && npx remotion render src/index.ts FilmV5 ../qa/v8/render/FilmV5_silent_raw.mp4 $F    # ~5 min on 4 cores
cd ..
node tools/build_cues_v5.mjs && python3 tools/build_audio_v5.py && python3 tools/audio_ratio_v5.py   # cues come from the SAME TS modules as the picture
python3 tools/qa_captions_v5.py                                                                       # caption timing + SRT
python3 tools/export_v5.py                                                                            # mux, preview, stems, metadata
python3 tools/qa_v5.py exports/v8/FGW_EarthStops_V5_Review_1080x1920.mp4 && python3 tools/qa_motion_v5.py && python3 tools/qa_audio_v5.py && python3 tools/qa_flagged_v5.py && python3 tools/ui_overlay_v5.py
node tools/probe_opening_v5.mjs qa/v8/OPENING_PROBE_V5.json                                           # the opening's foot/ground numbers
python3 tools/sheets_v3.py exports/v8/FGW_EarthStops_V5_Silent_1080x1920.mp4 qa/v8/enc pick 20,22,24,26:4   # decoded-frame sheets
node scripts/frames.mjs <outDir> FilmV5 20,100,400 0.5                                                # (from source/) individual stills
```
The narration, the generated sound effects and the Scribe times are inputs already in `audio/v7/`, `audio/v6/`, `audio/v5/` (regenerating them spends ElevenLabs credits; do not repeat blindly). Every position in the film is a pure function of the frame number; the picture, the caption lane, the cue builder and the audio all read the same TypeScript modules (`source/src/film5/*`). The loop is a shared-constants contract: `Brake5.tsx` (`BK`, `padGap(t)`), `Space5.tsx` (`rotAll`), `Globe5.tsx` (`SpaceBG`).

## Claims
`script/CLAIM_LEDGER.md` keeps the imaginary event distinct from the real physics. The brake is an impossible visual metaphor (it arrests spin, not orbit; no feasibility claim). Number: ground speed v = ω·N·cos φ (WGS 84): equator 1,040.4 mph (shown as `~1,000 MPH` on the `EQUATOR` plate, equator only). **Claude opened no source page** (hosts refused or unresolvable); the reviewer's reads (R1–R6) are recorded as the reviewer's in `script/SOURCES.md`.

## History
v1 prototype `0783b00` → E-A v2 / E-C `a885fd5` → hybrid hook H1 `dea9b81` → V1 review cut `701648d` → V2 review cut `f6f000b` → V3 review cut `243eb4d` → V4 review cut `2fb391a` → **V5 review cut** (this branch).
