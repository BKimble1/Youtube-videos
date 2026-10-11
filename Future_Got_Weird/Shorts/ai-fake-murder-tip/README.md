# Fake Murder Tip Short — Future Got Weird (V1 "AI Invented a Murder Tip. Then Hit Send." · V2 / V3 Final "AI Sent Police a Fake Murder Tip")

Original animated YouTube Shorts, 1080×1920 · 30 fps · H.264/AAC. **Nothing here is published, uploaded or scheduled.** Reconstructions of a reported event; every picture is an original illustration (no screenshots, no real people, no police logos).

**Current version: V3.1 Cleanup** (21.0 s) on top of V3 Final (one targeted hook / animation / sound pass on V2). V2 (commit `70a6451`) and V1 are kept untouched for comparison; V3 files carry `V3_Final`/`_v3` names and live in `exports/` (masters, small review copy, mix MP3), `captions/`, `cover/`, `audio/stems_v3_final/` and `qa/v3_final/`.

## V3.1 Cleanup files (this folder) — current

One bounded animation cleanup of V3 Final (baseline commit `204ad13`): shared quote layout, single-owner handoffs, one-scan checker, one caption layer. Script, narration, SRT and mix are unchanged (the audio stream is byte-identical to V3).

| File | What |
|---|---|
| `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Captioned_1080x1920.mp4` · `…_Clean_…` | Review masters (Clean keeps the opening headline) |
| `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_ReviewSmall_NOT_FOR_UPLOAD.mp4` | 540×960 phone-review copy |
| `captions/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup.srt` · `cover/…V3_1_Cleanup_Cover_1080x1920.png` | Same as V3 (opening and audio unchanged) |
| `qa/v3_1_cleanup/` | `QA_REPORT.md` (defect table, measurements, limits), before/after sheets, native frames, phone previews, quote-fit and caption audits, safe-zone scans, `SHA256SUMS.txt` |
| `source/src/v3/quote.tsx` | The reusable excerpt paper (measured layout, shared by the opening, checker and takeaway scenes) |
| `handoff/ROUND_FOUR_PROMPT.md` | The V3.1 brief |

Render: `tools/render_v3_1.sh`; QA: `tools/qa_media_v3_1.sh`, `python3 tools/qa_v3_1.py`, `python3 tools/safe_zone_groups_v3.py <mp4>`, `python3 tools/audio_checks_v3.py <out.json> <mp4>`.

## V3 Final files (this folder)

| File | What |
|---|---|
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_Captioned_1080x1920.mp4` | Review master, burned-in captions (sentence 1 is the opening headline itself) |
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_Clean_1080x1920.mp4` | Same picture and audio without the lane captions (keeps the opening headline) |
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_ReviewSmall_NOT_FOR_UPLOAD.mp4` · `…_Mix_review.mp3` | 540×960 phone-review copy · the final mix as an MP3 (for chat/listening) |
| `captions/FGW_AI_Fake_Murder_Tip_V3_Final.srt` | 15 cues from the same cue table (first sentence = one cue) |
| `cover/FGW_AI_Fake_Murder_Tip_V3_Final_Cover_1080x1920.png` | The actual new first frame |
| `audio/stems_v3_final/{narration,music,effects,mix}.wav` | 48 kHz stereo stems; they sum to the mix (max diff 3e-5) |
| `audio/cues_v3.json` · `audio/sfx_log_v3.csv` · `audio/MIX_LOG_V3.json` | Cue table, effect placements, mix decisions |
| `script_v3.md` · `claim_ledger_v3.md` · `packaging_v3.md` | Script + shot map, claim ledger, draft description |
| `qa/v3_final/` | `QA_REPORT.md`, `DECISIONS.md`, probe/decode/loudness, audio checks, safe-zone scans, contact + transition sheets, phone previews, caption audit, `SHA256SUMS.txt` |
| `source/src/v3/` | Editable Remotion scenes (`kit3`, `open`, `inspect`, `flow`, `close`, `Film3`, generated `cues.ts`); compositions `ShortV3`, `ShortV3Captioned`, `CaptionAuditV3` |
| `handoff/ROUND_THREE_PROMPT.md` | The V3 brief, verbatim |

### Rebuild V3
```bash
cd Future_Got_Weird/Shorts/ai-fake-murder-tip
python3 tools/build_cues_v3.py          # single clock -> audio/cues_v3.json, source/src/v3/cues.ts, V3 .srt
python3 tools/build_audio_v3.py         # stems + mix (numpy + ffmpeg ebur128) -> audio/stems_v3_final/*, source/public/audio/final_mix_v3.wav
(cd source && npm ci && npm run typecheck)
tools/render_v3.sh                      # both 1080x1920 masters into exports/
tools/qa_media_v3.sh > qa/v3_final/ffprobe_decode_loudness.txt
python3 tools/safe_zone_groups_v3.py exports/<master>.mp4   # safe zone x 96-876 / y 240-1450
python3 tools/audio_checks_v3.py qa/v3_final/audio_checks.json exports/<master>.mp4 ...
```

## V2 files (this folder)

| File | What |
|---|---|
| `FGW_AI_Fake_Murder_Tip_V2_Captioned_1080x1920.mp4` | Review master with burned-in captions |
| `FGW_AI_Fake_Murder_Tip_V2_Clean_1080x1920.mp4` | Same picture and audio, no captions |
| `FGW_AI_Fake_Murder_Tip_V2.srt` | Caption file from the same cue table |
| `exports/FGW_AI_Fake_Murder_Tip_V2_ReviewSmall_540x960_NOT_FOR_UPLOAD.mp4` | Small phone-review copy |
| `cover/FGW_AI_Fake_Murder_Tip_V2_Cover_1080x1920.png` | Cover still from the opening composition |
| `audio/narration_v2/` | Take 1 (`narration_v2_take1.mp3`), edited final (`narration_v2_final.mp3`/`_48k.wav`), Scribe alignment (`narration_v2_alignment*.json`), edit log |
| `audio/stems_v2/{voice,music,sfx,mix}.wav` | 48 kHz stereo stems; they sum to the mix |
| `audio/cues_v2.json` · `audio/sfx_log_v2.csv` · `audio/MIX_LOG_V2.json` | Cue table, effect placements, mix log |
| `script_v2.md` · `claim_ledger_v2.md` · `credits_v2.md` · `packaging_v2.md` | Script + shot map, source/claim ledger, asset credits, draft upload text (not for publication until approved) |
| `runway/RUNWAY_V2.md` | Runway decision record |
| `qa/v2/` | Probe/decode/loudness results, safe-zone scans, contact + transition sheets, phone previews, caption audit, checksums |
| `QA_REPORT_V2.md` · `PRODUCTION_STATE.md` | QA result and resume checkpoint |
| `source/` | Editable Remotion project (pinned). V2 lives in `source/src/v2/`; V1 compositions (`Short`, `ShortCaptioned`) still render |
| `handoff/ROUND_ONE_PROMPT.md` · `handoff/ROUND_TWO_PROMPT.md` | The two briefs, verbatim |

V1 files: `FGW_AI_Fake_Murder_Tip_V1_*.mp4`, `…_V1.srt`, `audio/narration/`, `audio/stems/`, `script.md`, `claim_ledger.md`, `credits.md`, `QA_REPORT.md`, `qa/v1/`, `exports/…V1…`.

## Rebuild V2

```bash
cd Future_Got_Weird/Shorts/ai-fake-murder-tip
python3 tools/trim_narration_v2.py   # take 1 -> edited narration (only if the take changes)
python3 tools/build_cues_v2.py       # single clock: narration_v2_alignment.json -> audio/cues_v2.json, source/src/v2/cues.ts, V2 .srt
python3 tools/build_audio_v2.py      # stems + mix (numpy only; ffmpeg measures loudness) -> audio/stems_v2/*, source/public/audio/final_mix_v2.wav
(cd source && npm ci && npm run typecheck)   # pinned Remotion 4.0.533 / React 19.1.0 / TypeScript 5.8.3
tools/render_v2.sh                   # both 1080x1920 MP4s (set REMOTION_BROWSER to a headless Chrome path if needed)
tools/qa_media.sh V2                 # probe + full decode + loudness
python3 tools/safe_zone_groups_v2.py <mp4>   # safe-zone scan (ink and cream scenes)
```

Helpers: `source/scripts/frames.mjs <outDir> <ShortV2|ShortV2Captioned> <f1,f2,…> [scale]` (stills), `source/scripts/audit_captions.mjs <out.json> CaptionAuditV2`, `tools/mp4_sheet.py`, `tools/phone_preview.py`, `tools/sheet.py`.

Everything on screen and in the mix is driven by the cue table: change the narration alignment → run `build_cues_v2.py` → rebuild. No other file carries timing.

## Look
V2 palette: ink `#162A32` (cold open and closing) · cream `#FAF3DF` (evidence scenes) · coral `#EF6B55` · teal `#1CA7A0`; saffron `#FFC744` only on the highlighted claim phrase (and on the approved checker's pencil). Montserrat ExtraBold 800 captions, Barlow Condensed ExtraBold 800 headlines. The only character is the approved checker (gray bob, round glasses, coral cardigan, pencil behind the ear).

V3 Final palette roles: saffron = AI / what the AI wrote (cursor tag, corner mark, the highlighted claim); teal = police; coral = fake / spam; ink and cream scenes as in V2. Opening headline Barlow Condensed ExtraBold 118 px, captions Montserrat ExtraBold 76 px.
