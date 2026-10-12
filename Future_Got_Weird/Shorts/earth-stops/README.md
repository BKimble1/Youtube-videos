# Earth Stops. You Don't. — Future Got Weird Short (V2 review cut)

**Status: complete V2 review cut (25.33 s, 1080 × 1920, 30 fps) built; awaiting the owner's whole-film review. Not published, not uploaded, not scheduled. No pull request. No final-ready claim.** Nobody has watched it in real time or listened to it (see `QA_NOTES_V2.md`).

Branch `claude/fgw-earth-stops-short` (created from the Atlas tip `3634cc5`). Checkpoints, all pushed as branches (tag pushes are refused by the remote): **V1 `701648d`** (`claude/fgw-earth-stops-v1-checkpoint-701648d`, `checkpoints/v4/CHECKPOINT.md`), hook H1 `dea9b81` (`checkpoints/v3/`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

**Start with `V2_REPORT.md`** (deliverables, V1 → V2 change log with final timecodes, brief-vs-built, checks, remaining human checks), then `QA_NOTES_V2.md`.

## Deliverables (`exports/v5/`)
| File | What |
|---|---|
| `FGW_EarthStops_V2_Review_1080x1920.mp4` | **the V2 review**: picture + Test Voice + captions + sound (h264 + AAC) |
| `FGW_EarthStops_V2_ReviewNoMusic_1080x1920.mp4` | the same without the optional tension swell |
| `FGW_EarthStops_V2_Silent_1080x1920.mp4` | picture only (watch this muted first) |
| `FGW_EarthStops_V2_VoiceOnly_48k.wav` / `.mp3` / `…_VoiceOnly_1080x1920.mp4` | the narration alone, aligned to the film |
| `FGW_EarthStops_V2_SFXOnly_…mp4`, `…_MusicOnly_…mp4`, `stems/` | the sound design alone; the swell alone; 48 kHz stems |
| `FGW_EarthStops_V2_Captions.srt` | the 18 caption cues (also burned in) |
| `FGW_EarthStops_V2_Script.md` | final script (copy of `script/SCRIPT.md`) |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, sizes, sha256, exact commands |
V1 deliverables stay in `exports/v4/` (unchanged).

## Where things are
| Path | What |
|---|---|
| `script/` | `SCRIPT.md` (V2 as built, 7 lines, 68 words), `CLAIM_LEDGER.md` (V2, claim-specific), `SOURCES.md` (who opened what), `STORYBOARD.md`, `speed_table.json`, `history/` (V1 versions) |
| `source/` | editable Remotion project (pinned deps, lockfile). V2 = `source/src/film2/` (compositions `FilmV2`, `FilmV2-Clean`); V1 = `source/src/film/`; the hook scene comes from `source/src/v2/` (reused with an 11-frame offset) |
| `audio/v5/` | `voice/` (take A/B, selected take, alignment, analysis, provenance), `sfx_gen/` (16 generated clips, manifest, analysis, spectrograms, audition reel), `cues_v2.json`, `v2/` (per-event WAVs, stems, `SFX_LOG.csv`, `MIX_LOG.json`) |
| `qa/v5/` | `QA_V2.json`, `CAPTION_SYNC.json`, `sheets/` (all 760 frames of the encode), `UI_OVERLAY_V2.png`, `PHONE_WIDTH_V2.png`, `render/` (log) |
| `tools/` | V2: `build_cues_v2.mjs`, `build_audio_v2.py`, `audio_ratio_v2.py`, `qa_captions_v2.py`, `qa_v2.py`, `sheets_v2.py`, `ui_overlay_v2.py`, `export_v2.py`, `voice_analyse_v5.py`, `sfx_gen_analyse_v5.py` · shared `foley_lib.py`, `calc_speeds.py` · V1 `*_v1.*` · older stages. (`build_cues_v2.mjs`, `build_audio_v2.py`, `qa_v2.py` replaced the prototype-era scripts of the same name; those are in git history at `a885fd5`.) |
| `checkpoints/`, `handoff/` | preserved states; the owner's approval records (`OWNER_APPROVAL_V2.md` is the latest) |
| `V1_REPORT.md`, `QA_NOTES_V1.md`, `HOOK_H1_REPORT.md`, `PROTOTYPE_*` | earlier reports (history) |
| `credits.md`, `PRODUCTION_STATE.md` | provenance and licence notes; state and open decisions |

## Rebuild (V2)
```bash
cd source && npm ci && npx tsc --noEmit                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell      # the headless *shell* is required
F="--browser-executable=$HS --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
mkdir -p ../qa/v5/render && npx remotion render src/index.ts FilmV2 ../qa/v5/render/FilmV2_silent_raw.mp4 $F    # ~5 min on 4 cores
cd ..
node tools/build_cues_v2.mjs && python3 tools/build_audio_v2.py && python3 tools/audio_ratio_v2.py   # cues come from the SAME TS modules as the picture
python3 tools/qa_captions_v2.py                                                                       # caption timing + SRT
ffmpeg -y -i qa/v5/render/FilmV2_silent_raw.mp4 -i audio/v5/v2/stems/mix_v2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v5/FGW_EarthStops_V2_Review_1080x1920.mp4
python3 tools/qa_v2.py && python3 tools/sheets_v2.py && python3 tools/ui_overlay_v2.py && python3 tools/export_v2.py
node scripts/frames.mjs <outDir> FilmV2 0,100,400 0.5                                                 # (from source/) individual stills
```
The narration, generated sound effects and Scribe times are inputs already in `audio/v5/` (regenerating them spends ElevenLabs credits; do not repeat blindly). Every position in the film is a pure function of the frame number; the picture, the caption lane, the cue builder and the audio all read the same TypeScript modules (`source/src/film2/*`).

## Claims
`script/CLAIM_LEDGER.md` keeps the imaginary event distinct from the real physics, lists every spoken and on-screen claim with its basis, status and guardrail, and what is deliberately not claimed. Number: ground speed v = ω·N·cos φ (WGS 84): equator 1,040.4 mph (shown as `~1,000 MPH`, equator only). **Claude opened no source page**; the reviewer's reads (R1–R6) are recorded as the reviewer's in `script/SOURCES.md`; Galileo, IERS and the other carried-over originals are uninspected.

## History
v1 prototype `0783b00` → E-A v2 / E-C `a885fd5` → hybrid hook H1 `dea9b81` → V1 full review cut `701648d` → **V2 review cut** (this branch).
