# AI Invented a Murder Tip. Then Hit Send. — Future Got Weird Short, V1 (Round One)

Original animated YouTube Short, 1080×1920 · 30 fps · 28.0 s · H.264/AAC. **Not published, not uploaded, not scheduled.** Reconstruction of a reported event; all pictures are original illustrations (no screenshots, no real people, no police logos).

## Finished files (this folder)

| File | What |
|---|---|
| `FGW_AI_Fake_Murder_Tip_V1_Captioned_1080x1920.mp4` | Review master with burned-in captions |
| `FGW_AI_Fake_Murder_Tip_V1_Clean_1080x1920.mp4` | Same picture/audio without captions |
| `FGW_AI_Fake_Murder_Tip_V1.srt` | Caption file aligned to the same cue table |
| `exports/FGW_AI_Fake_Murder_Tip_V1_ReviewSmall_540x960_NOT_FOR_UPLOAD.mp4` | Small phone-review copy |
| `cover/FGW_AI_Fake_Murder_Tip_V1_Cover_1080x1920.png` | Cover still (no captions) |
| `audio/narration/narration_take1.mp3` · `narration_48k.wav` · `narration_alignment.json` | Final narration (one ElevenLabs take, voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`) and real Scribe word timings |
| `audio/stems/{voice,music,sfx,mix}.wav` | 48 kHz stereo stems; they sum to the mix |
| `audio/cues.json` · `audio/sfx_log.csv` · `audio/MIX_LOG.json` | Cue table, effect placements, mix/loudness log |
| `source/` | Editable Remotion project (pinned, lockfile included) |
| `script.md` · `claim_ledger.md` · `credits.md` · `packaging_draft.md` | Script + shot map, source/claim ledger, asset credits, draft upload text (not for publication until approved) |
| `runway/` | Runway decision record + notes for a later insert |
| `qa/v1/` | Probe/decode/loudness results, checksums, contact sheets, phone preview |
| `PRODUCTION_STATE.md` · `QA_REPORT.md` | Resume checkpoint and the QA result |

## Rebuild

```bash
cd Future_Got_Weird/Shorts/ai-fake-murder-tip
python3 tools/build_cues.py          # single clock: audio/narration/narration_alignment.json -> audio/cues.json, source/src/cues.ts, .srt
python3 tools/build_audio.py         # stems + mix (numpy only; needs ffmpeg for loudness measurement) -> audio/stems/*, source/public/audio/final_mix.wav
(cd source && npm ci)                # pinned Remotion 4.0.533 / React 19.1.0 / TypeScript 5.8.3
(cd source && npx tsc --noEmit)      # type check
tools/render_all.sh                  # both 1080x1920 MP4s (set REMOTION_BROWSER to a headless Chrome path if needed)
```

Other helpers: `source/scripts/frames.mjs` (stills of any frames), `source/scripts/audit_captions.mjs` (caption fit + font proof in the browser), `tools/sheet.py`, `tools/mp4_sheet.py` (contact sheets), `tools/phone_preview.py` (360×640 with a Shorts-UI overlay).

Everything on screen is driven by the cue table: change the narration alignment → run `build_cues.py` → rebuild. No other file carries timing.

## Look
Palette `#FAF3DF` paper · `#162A32` ink · `#FFC744` saffron · `#1CA7A0` teal · `#EF6B55` coral · `#4F7CC9` blue. Montserrat ExtraBold 800 captions (sentence case), Barlow Condensed ExtraBold 800 headlines. The only character is the approved checker (gray bob, round glasses, coral cardigan, pencil behind ear) in the brief reaction beat.
