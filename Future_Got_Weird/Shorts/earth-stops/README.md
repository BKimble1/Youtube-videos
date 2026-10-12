# Earth Stops. You Don't. — Future Got Weird Short (V1 review cut)

**Status: complete V1 review cut (34.5 s, 1080 × 1920, 30 fps) built; awaiting the owner's consolidated whole-film review. Not published, not uploaded, not scheduled. No pull request.** Nobody has watched it in real time or listened to it (see `QA_NOTES_V1.md`). Next step is the owner's coordinated V2 brief; no V2 work has been started.

Branch `claude/fgw-earth-stops-short` (created from the Atlas tip `3634cc5`). Checkpoints, all pushed as branches (tag pushes are refused by the remote): V1 hook **`dea9b81`** (`claude/fgw-earth-stops-hook-h1-checkpoint-dea9b81`, `checkpoints/v3/CHECKPOINT.md`), prototypes `a885fd5` (`checkpoints/v2/`), `0783b00` (`checkpoints/v1/`).

**Start with `V1_REPORT.md`** (what was built, what was and was not inspected, what the owner should judge), then `QA_NOTES_V1.md` (concise measurements and unavailable checks).

## Deliverables (`exports/v4/`)
| File | What |
|---|---|
| `FGW_EarthStops_V1_Review_1080x1920.mp4` | **the V1 review**: picture + Test Voice + captions + procedural sound (h264 + AAC) |
| `FGW_EarthStops_V1_Silent_1080x1920.mp4` | picture only (captions, tag, graphics) |
| `FGW_EarthStops_V1_VoiceOnly_48k.wav` / `.mp3` | the narration alone, aligned to the film (34.5 s, the unmodified take at the mix level) |
| `FGW_EarthStops_V1_VoiceOnly_1080x1920.mp4` | the same voice-only audio on the picture |
| `FGW_EarthStops_V1_SFXOnly_1080x1920.mp4` | the sound design alone on the picture |
| `FGW_EarthStops_V1_Script.md` | final script (copy of `script/SCRIPT.md`) |
| `FGW_EarthStops_V1_Captions.srt` | the 23 caption cues (also burned in) |
| `EXPORT_METADATA.json` / `.md` | verbatim ffprobe, sizes, sha256, exact commands |

## Where things are
| Path | What |
|---|---|
| `script/` | `SCRIPT.md` (as built, 7 lines, 101 words), `CLAIM_LEDGER.md`, `SOURCES.md` (**no page opened**; excerpt-only), `STORYBOARD.md` (all shots, transitions, Runway decision), `speed_table.json`, `SCRIPT_PROPOSAL_H1.md` (the old proposal with the bus) |
| `source/` | editable Remotion project (pinned deps, lockfile). V1 = `source/src/film/` (compositions `FilmV1`, `FilmV1-Clean`); the hook comes from `source/src/v2/OpeningH1.tsx` |
| `audio/v4/` | `voice/` (Test Voice take A, alignment, provenance), `cues_v1.json`, `v1/` (per-event WAVs, group stems, `mix_v1.wav`, `voice_only_v1.wav`, `sfx_only_v1.wav`, `SFX_LOG.csv`, `MIX_LOG.json`), `audition/` (3 candidates per new SFX with measurements) |
| `qa/v4/` | `QA_V1.json`, `CAPTION_SYNC.json`, `qa_figures_v1.png`, `sheets/` (all 1,035 frames of the encoded file, 45 per sheet), `runway/` (the still sent to Runway), `render/` (log) |
| `tools/` | V1: `build_cues_v1.mjs`, `build_audio_v1.py`, `sfx_audition_v1.py`, `audio_ratio_v1.py`, `measure_captions_v1.py`, `qa_captions_v1.py`, `qa_v1.py`, `sheets_v1.py`, `export_v1.py` · shared `foley_lib.py`, `calc_speeds.py` · older stages `*_h1.*`, `*_v2.*`, `*_opening.*` |
| `checkpoints/`, `handoff/` | preserved states; the owner's approval records (`OWNER_APPROVAL_V1.md` is the latest) |
| `HOOK_H1_REPORT.md`, `PROTOTYPE_V2_REPORT.md`, `PROTOTYPE_QA_REPORT.md` | earlier reports (history) |
| `credits.md`, `PRODUCTION_STATE.md` | provenance; state and open decisions |

## Rebuild (V1)
```bash
cd source && npm ci && npx tsc --noEmit                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell      # the headless *shell* is required
F="--browser-executable=$HS --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV1 ../qa/v4/render/FilmV1_silent_raw.mp4 $F            # ~8 min on 4 cores
cd ..
node tools/build_cues_v1.mjs && python3 tools/build_audio_v1.py && python3 tools/audio_ratio_v1.py   # cues come from the SAME TS modules as the picture; numpy-only Foley
python3 tools/qa_captions_v1.py                                                              # caption timing + SRT
ffmpeg -y -i qa/v4/render/FilmV1_silent_raw.mp4 -i audio/v4/v1/stems/mix_v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v4/FGW_EarthStops_V1_Review_1080x1920.mp4
python3 tools/qa_v1.py && python3 tools/sheets_v1.py && python3 tools/export_v1.py           # QA, contact sheets, the other exports + metadata
node scripts/frames.mjs <outDir> FilmV1 0,100,400 0.5                                        # (from source/) individual stills
```
Every position in the film is a pure function of the frame number; the picture, the caption lane, the cue builder and the audio all read the same TypeScript modules (`source/src/film/*`).

## Claims
`script/CLAIM_LEDGER.md` lists every spoken and on-screen claim with its basis, status and guardrail, the visual simplifications, and what is deliberately not claimed. Numbers: ground speed v = ω·N·cos φ (WGS 84): equator 1,040.4 mph, 40° 798.1, 80° 181.3; Category 5 starts at 157 mph. **All source statuses are "excerpt only"** — no source page was opened (network policy).

## History
v1 prototype `0783b00` → E-A v2 / E-C `a885fd5` → hybrid hook H1 + proposed script `dea9b81` → **V1 full review cut** (this commit onwards).
