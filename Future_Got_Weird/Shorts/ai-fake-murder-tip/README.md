# Fake Murder Tip Short — Future Got Weird (V1 "AI Invented a Murder Tip. Then Hit Send." · V2 "AI Sent Police a Fake Murder Tip")

Original animated YouTube Shorts, 1080×1920 · 30 fps · H.264/AAC. **Nothing here is published, uploaded or scheduled.** Reconstructions of a reported event; every picture is an original illustration (no screenshots, no real people, no police logos).

**Current version: V2** (21.0 s). V1 (28.0 s) is kept untouched for comparison; V2 lives beside it with `V2`/`_v2` names.

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
