# Production state — "AI Invented a Murder Tip. Then Hit Send." (resume checkpoint)

**As of 11 Oct 2026: Round One V1 is built, rendered and QA'd (see `QA_REPORT.md`). Not published, not uploaded, not scheduled.** Next step is the owner's watch-and-listen and one correction list.

## Where things are
- Repo `BKimble1/Youtube-videos`, branch **`claude/ai-fake-murder-tip-short-v1`**, folder `Future_Got_Weird/Shorts/ai-fake-murder-tip/`. No PR opened (none was asked for).
- Media is committed as ordinary Git blobs (the folder's `.gitattributes` turns the repo's LFS rule off for mp4/wav/mp3 because LFS uploads are unavailable here; same approach as `Future_Got_Weird/can-you-hurt-something-that-isnt-alive/`). Largest file ≈ 7 MB.
- `qa/dev/` (scratch frames, ~59 MB) is git-ignored and not stored; everything needed is in `qa/v1/`.
- Older episodes and the Atlas V4 kit branch (`claude/pensive-mendel-3j0xsc`) were not touched; the kit's cast/anim files were copied unchanged.

## Paid / generated assets (do not regenerate)
| Asset | ID / location |
|---|---|
| Narration (1 take; voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`) | generation `qc11KL9gB7nC3rd8r5MN`, flow https://elevenlabs.io/app/flows/YRJES0rtiDnnRnqvLyEF; file `audio/narration/narration_take1.mp3` |
| Alignment (Scribe) | generation `j5smGbHyp7S8ku3e4xcu`; `audio/narration/narration_alignment.json` |
| 5 effects (≈ 83 ElevenLabs credits) | click `MSUurm2embnHeRYCmycP`, keys `haBoLSzmaSL3derspB2P`, error tap `bWexHbNzr58FBFIrElMl`, send `TQz0aA9DN35IHv1fnW8l`, spam latch `glJY9PvlBHhdr5ZOAAxk`; files in `audio/sfx/` |
| Runway | **nothing generated, 0 credits** (egress blocked). Account: 2,198 credits at check time; ceiling would be 100. |
| Music | original local synthesis, `tools/build_audio.py` |

Narration takes used: **1 of 2.** A second take is only worth spending if the owner's list changes the words or the delivery.

## Rebuild / change workflow
1. Words or delivery change → one new ElevenLabs take → Scribe alignment → `audio/narration/narration_alignment.json` (add `voice_end` per sentence-final word with ffmpeg silencedetect, as before).
2. `python3 tools/build_cues.py` → `audio/cues.json`, `source/src/cues.ts`, `.srt`. Every scene/effect/caption timing lives here only.
3. `python3 tools/build_audio.py` → stems + `source/public/audio/final_mix.wav` (iterates to −15 LUFS; limiter ceiling −1.9 dBFS).
4. `cd source && npm ci && npm run typecheck`; stills: `INPUT_PROPS='{"audio":false}' node scripts/frames.mjs <outDir> ShortCaptioned <f1,f2> [scale]`; caption audit: `node scripts/audit_captions.mjs`.
5. `tools/render_all.sh` (≈ 3 min each, headless Chromium at `/opt/pw-browsers/chromium_headless_shell-1194/...`), then `tools/qa_media.sh`, `tools/safe_zone_groups.py`, `tools/mp4_sheet.py`, `tools/phone_preview.py`; regenerate `qa/v1/SHA256SUMS.txt`.

## Open items (all need the owner or network access)
1. Watch/listen twice with sound, loop twice, muted opening, low volume, real Shorts UI (QA "Not done").
2. Decide the wording flag: "testing random webpages" (see `script.md`).
3. Re-read Source B (6abc/PPD statement) first-hand before publishing; confirm the July 18 date (PhillyVoice said July 28) — `claim_ledger.md`.
4. Optional Runway checker insert: allow `dnznrvs05pmza.cloudfront.net` in the environment's network policy; start plate is `runway/start_plate_checker_portrait_1080x1920.png`; ceiling 100 credits; use only if identity/pencil/glasses hold.
5. Pick a cover frame if the opening frame is not wanted (`cover/`).
6. Packaging text is a draft in `packaging_draft.md`; credits/reconstruction note must go in the description.

The full brief is saved verbatim in `handoff/ROUND_ONE_PROMPT.md`.
