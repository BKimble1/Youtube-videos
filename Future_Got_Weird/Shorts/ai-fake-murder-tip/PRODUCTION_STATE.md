# Production state — Fake Murder Tip Short (resume checkpoint)

## V2 — "AI Sent Police a Fake Murder Tip" (current)

**As of 11 Oct 2026: V2 is built, rendered from source and QA'd (see `QA_REPORT_V2.md`). Not published, not uploaded, not scheduled.** Next step is the owner's watch-and-listen review of V2 and one correction list.

### Where things are
- Repo `BKimble1/Youtube-videos`; V2 branch **`claude/ai-fake-murder-tip-short-v2`** (from V1's `claude/ai-fake-murder-tip-short-v1`, commit `8746526`); folder `Future_Got_Weird/Shorts/ai-fake-murder-tip/`. V1 files are untouched; V2 files carry `V2`/`_v2` names. No PR opened (none was asked for).
- Media is committed as ordinary Git blobs (the folder's `.gitattributes` turns the repo's LFS rule off for mp4/wav/mp3; LFS uploads are unavailable here). `qa/dev/` (scratch frames) is git-ignored.
- Editable source: `source/src/v2/` (`kit2.tsx` layout + captions, `open.tsx` beats 1–2 + backdrop, `inspect.tsx` beat 3, `flow.tsx` beats 4–5, `close.tsx` beat 6 + loop return, `Film2.tsx`, generated `cues.ts`). Compositions `ShortV2`, `ShortV2Captioned`, `CaptionAuditV2`.

### Paid / generated assets (do not regenerate)
| Asset | ID / location |
|---|---|
| V2 narration (take **1 of 2**; voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, no speed parameter available) | generation `zTuvi1a9TkNymbtaUEb4` in flow https://elevenlabs.io/app/flows/YRJES0rtiDnnRnqvLyEF; `audio/narration_v2/narration_v2_take1.mp3` (raw 21.44 s) → edited `narration_v2_final.mp3` (19.76 s) |
| V2 alignment (Scribe, on the edited audio, ≈ 108.7 credits) | generation `LqipbBW0W3LYKTfvZdvL`; `audio/narration_v2/narration_v2_alignment*.json` |
| Effects | **none new**; V1's five reused (see `credits_v2.md`) |
| Runway | **nothing generated, 0 credits** (output hosts blocked; no existing checker clip). `runway/RUNWAY_V2.md` |
| Music | original local synthesis, `tools/build_audio_v2.py` |

A second narration take is only worth spending if the owner's list changes the words or the delivery (one targeted hook repair or one more full take remain within the brief's limit).

### Rebuild / change workflow
See `README.md`. In short: `tools/build_cues_v2.py` → `tools/build_audio_v2.py` → `cd source && npm ci && npm run typecheck` → `tools/render_v2.sh` → `tools/qa_media.sh V2` + `tools/safe_zone_groups_v2.py`. Timing lives only in the cue table.

### Open items (all need the owner or network access)
1. Listen to the whole mix (phone speaker low/ordinary, headphones), watch at normal speed, loop twice, check the opening muted, check in the real Shorts UI (QA "Not done").
2. Decide the wording flag: "Claude did this while testing websites." (suggested: "during a website test").
3. Re-read Source B (6abc/PPD statement) first-hand before publishing; confirm the Philadelphia name and the July 18 date (`claim_ledger_v2.md`).
4. Optional Runway checker insert: allow `dnznrvs05pmza.cloudfront.net` in the environment's network policy; one controlled attempt plus one retry, ≤ 100 credits; only if face, glasses and pencil hold.
5. Cover is the opening frame; no alternate cover was generated. Packaging text is a draft (`packaging_v2.md`); the description must say the interfaces are illustrated reconstructions.

The briefs are saved verbatim in `handoff/ROUND_ONE_PROMPT.md` and `handoff/ROUND_TWO_PROMPT.md`.

---

## V1 checkpoint (kept for reference) — "AI Invented a Murder Tip. Then Hit Send."

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
