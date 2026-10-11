# QA report — V3.1 Cleanup "AI Sent Police a Fake Murder Tip" (11 Oct 2026)

**Status: the eight flagged handoffs are rebuilt from the existing Remotion source and re-rendered natively. Nothing is published, uploaded or scheduled.** MEASURED = run on the final encoded files or in the production browser. FRAMES = looked at decoded or rendered frames and sheets. **Nobody has watched V3.1 at normal speed or listened to it, and it has not been tried in the real Shorts app: none of that is possible in this environment and none is claimed.**

## Baseline and new commit
- Baseline: **V3 Final**, branch `claude/ai-fake-murder-tip-short-v3-final`, commit **`204ad13`** (verified; clean tree; V3 masters sha256 `68ca1c53…` captioned, `4c80dba4…` clean). *Not* the older V2 commit `70a6451`.
- Cleanup branch: **`claude/ai-fake-murder-tip-short-v3-1-cleanup`**. The final commit hash is in the handoff message and in `git log` (this report is committed with the files it describes). V3 outputs are untouched.

## Final files (sha256 in `SHA256SUMS.txt`)
| File | Bytes |
|---|---|
| `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Captioned_1080x1920.mp4` | 3,857,738 |
| `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Clean_1080x1920.mp4` (keeps the opening headline; no lane captions) | 3,400,245 |
| `exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_ReviewSmall_NOT_FOR_UPLOAD.mp4` (540×960 downscale of the captioned master) | see manifest |
| `captions/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup.srt` | byte-identical to the V3 SRT (audio unchanged) |
| `cover/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Cover_1080x1920.png` | byte-identical to the V3 cover (frame 0 is unchanged) |

## Defect table — what was seen, what the source showed, what changed
Before-frames: `before_v3/` (rendered from the unchanged V3 source at the flagged frames). After-frames: `handoff_*.png`, `native_frames/`, `phone_preview_*.png`.

| # | Interval (frames) | Seen in the V3 frames | Cause found in the source | Change |
|---|---|---|---|---|
| 1 | 1.95–2.30 s (f58–69) | Headline lines sliced into horizontal fragments; blank paper f64–68; first phrase only at f69 | `OpenScene` clipped the headline + form with `openCrop3`, a mask closing from the whole frame onto the paper rect over 8 frames; the paper was drawn by `Packet3` for 3 frames then by `ClaimCard`; the first phrase waited for `b2.line1` | No mask. Headline leaves as one group (opacity + 22 px, 7 frames, f56–63); the old form and cursor leave as one group (6 frames) behind the envelope; the envelope opens f58–66 and **one** `QuotePaper` rises out of it; line 1 appears at f64, lines 2–3 at f69; highlights stay on the narration (f109 / f121) |
| 2 | 4.95–5.20 s (f147–160) | A second cream rounded rectangle behind the quote card; "Except…" looked doubled and gray; the checker's arm crossed the caption | `Backdrop` grew a cream rect from the quote rect with a different target than the paper's own move (two card edges); caption contrast cross-faded (`creamness` continuous) through mid-gray; the checker entered by sliding 620 px up through the caption lane | Backdrop is a flat 8-frame cross-fade (f147–155); the quote paper is a single instance moving Q2 → Q3 over 10 frames; caption contrast is a **hard switch at f151**; the checker fades/drifts in at f152–159 (face readable before the scan at f162); one `Captions2` layer, outside every scene transform |
| 3 | 5.30–6.40 s (f162–200) | Hand sweeps three rows left→right, snapping back each row | `handTarget` looped `idx = floor(3n)` with `fr` resetting per row, plus a position jump at `scan0 − 6` | Four eased segments, each monotonic: rest → anticipation (f162–173) → **one** scan (f173–188) → stop (f188–191) → the hand leaves while the label lands (f191–199). The gaze follows the single scan; blink, brow and glance-up are the V3 ones; the teal scan bar follows the one scan |
| 4 | 7.45–7.85 s (f223–236) | The descending checker/desk crossed "Claude did this"; the quote lingered | Stage translated +560 px down while the caption began at f231; quote exit offset −340 px over 9 frames | The stage fades and drifts 34 px left over f223–229 (gone at f230, caption at f231); the quote leaves with it; the page becomes the carousel prop with one rect transform (7 frames); stage clipped at the counter so nothing can reach y ≥ 1262 |
| 5 | 11.20–11.45 s (f333–347) | Badges, inbox header, form and envelope stacked; form cut by a straight edge | Chips began leaving at `b5.fold` while the inbox header arrived at +2; the form scaled inside the envelope under `envClipFold3`, a rectangular crop | Badges retire f327–333 (6 frames) **before** the fold; the form shrinks and rises above the open envelope (f335–341), folds to 34 % height while sliding behind the envelope's **front panel** (f341–347, no crop), then the flap closes (f346–351) |
| 6 | 14.75–15.35 s (f441–456) | A large dark circle grew from the tray; an empty paper | Ink circle `r = 2300·k`; the paper morphed from the tray rect and its content arrived later (`b6.paper`) | No shape wipe: the outcome (inbox, folder, tray, route) fades as one group f441–447 while the field cross-fades to ink (f441–449); the takeaway paper arrives **with its text** at f447–453; the spam outcome itself is untouched |
| 7 | 15.30–19.60 s (≈ 17.8 s) | "matching" and its highlight touch/overrun the right border; the moving AI tag crossed the excerpt; several AI tags | Text 70 px at `x + 52`: highlight right end = 96 + 52 + 364.6 + 358.5 + 10 = **881 > 876**; the cursor+tag flew from the paper corner through the text | Shared `quote.tsx` layout (below). The moving tag is gone: one fixed AI tag stays on the paper corner; the cursor appears **below** the paper (f528) and travels to the button without entering the quote rectangle; the opener's tag returns only with the opening layout |
| 8 | 20.10–20.45 s (f598–620) | Faded quote text and card edges over the incoming POLICE TIP form | Paper content, header and form lines faded on the same `ret` ramp | Quote content fades out completely (f596–602) while the **opaque** paper morphs into the form (f598–610); header and form lines appear only after (f604–610); the existing button moves to the opening button (no second button); the cursor returns and its tag grows (f608–616); the headline reveals as one group (f610–620); frame 629 matches frame 0 |

## Shared quote layout (`source/src/v3/quote.tsx`)
One component draws the paper in the opening, checker and takeaway scenes (canvas size 780 × 366, scaled uniformly; border weight 7 and corner radius 30 do **not** scale). Font 70 → **66 px (−5.7 %)**; tx, highlight rectangles and padding are derived from `measure()` of the production font (fonts.ts holds the render until Montserrat is loaded); both highlights use 10 px padding, 94 px height, radius 14; the excerpt text is unchanged. Browser audit `quote_fit_audit.json` (composition `QuoteAuditV31`):
| State | Card | Font | Highlight padding around "matching" (left / right) | Clearance from highlight/glyphs to the inside of the border (left / right / bottom) |
|---|---|---|---|---|
| Smallest — checker scene, scale 0.7795 | 608 × 285 | 51.4 px | 7.7 / 7.9 px | **27.0 / 27.0 / 30.0 px** (glyph metrics) |
| Largest — takeaway, scale 1.0 | 780 × 366 | 66 px | 10.0 / 10.0 px | **35.6 / 35.6 / 39.5 px** |
Canvas advance widths and the browser's own SVG text layout agree to 0.01 px. Pixel check on the final master (saffron highlight columns vs the inside of the border): f200 (smallest) 28.5 / 29.5 px; f500 and f540 (largest) 36.5 / 37.5 px; f120 (opening, only the first highlight is on) right 37.5 px. The smallest state sits just under the 28–36 px target because the paper is scaled to 0.78 to keep it above the checker's head; the proportion of padding is the same.

## MEASURED
| Check | Result |
|---|---|
| Type check (`tsc --noEmit`, TS 5.8.3) | exit 0 |
| Video (both masters) | h264 High, yuv420p, **1080×1920, 30/1 fps, 630 frames, 21.000 s**, bt709, CRF 16 slow, rendered natively from source |
| Audio (both masters) | AAC-LC 48 kHz stereo, 21.013 s |
| Full decode (video+audio) | **0 error lines** on the Captioned, Clean and ReviewSmall files |
| Audio unchanged | decoded PCM md5 `6f1afcf6ae5ab4fbb0378b231fb1aa44` and copied AAC stream md5 `3a1fc4d4ca95c55645d19818c748c8ba` are **identical** to the V3 Final master; −15.0 LUFS, LRA 2.1 LU, **−1.8 dBTP** (ReviewSmall −15.1 LUFS, −1.6 dBTP); lag 0 samples and r = 0.99996 against `audio/stems_v3_final/mix.wav`; the narration file is the V2 file (sha256 `6000cf2f…c658`) |
| Effects vs picture | No effect was moved. Click f11–12 and the folder thud f383 are on unchanged visuals; the stamp tap f194 is still the stamp frame (the label fades in f194–198; the hand now leaves from f191, so "no description" is uncovered); the paper-open sound at 2.07 s (f62) falls inside the new paper rise (f58–66); the button tick f562 is the enable frame |
| Captions | SRT byte-identical to V3. Audit (`caption_audit.json`): 16 entries (the first two are the headline), lane captions ≤ 2 lines, 76 px except one at 74 px, widest 764.5 ≤ 770, both fonts proven loaded. `Captions2` is rendered **once**, last in `Film3`, outside every scene group (grep: one use) |
| Caption lane kept clear | In all **494** frames where a lane caption is on screen, the Clean master has **0** pixels of scene content in y 1255–1450 (`qa_v3_1.json`, `tools/qa_v3_1.py`) |
| Loop | frame 629 vs frame 0: mean abs diff **0.45/255**, 0.17 % of pixels > 32 (cursor idle offset); layout identical |
| Frame-to-frame change | Largest per-frame changes are the flat-colour cross-fades (f151–152 ≈ 62, f445–446 ≈ 54–58 mean abs diff). V3's largest were the ink circle (f448–449: 82–94) and the wipe. No new spike elsewhere |
| Safe zone x 96–876, y 240–1450 (+8 px tolerance), `safe_zone_*_groups.txt` | Inside everywhere except: (a) the checker's torso/sleeve bleeds off the left edge during the checker scene (as in V3; face, hands, page, stamp, quote and captions are inside); (b) slide-ins of ≤ 6 frames each (chips f257–259, the right-hand edge of the test-strip form card f331–334, folder/arm f358–383) reach x = 885, 1 px past the tolerance line, where they are clipped at x = 886. Counter, takeaway path and cursor are inside |

## FRAMES (looked at, not played)
- All 152 handoff frames (f54–75, 144–236 and the scan, 326–351, 438–457, 594–623) were rendered at native 1080×1920 from source and reviewed as contact sheets (160–270 px per frame); the checker pose and the largest quote state were also viewed as native/half-size crops (`native_frames/`); 24 frames of the final master were viewed in 360×640 overlay previews (`phone_preview_*`). I did **not** view every frame individually at full size.
- Neighbouring stable frames were re-checked after each fix; defects found and fixed during this pass: paper not yet home when the checker faded in (delayed to f152–159), outcome ghost under the arriving paper (outcome now leaves f441–447, paper f447), a full-width counter I had added (counter back to the safe column, stage clipped instead), slide-ins running past the column (clipped at x = 886).
- Opening premise, evidence, spam outcome (envelope stays in SPAM, tray empty) and takeaway wording are unchanged; no transition implies delivery to an investigator, and no extra fact is introduced. First and last layouts match and the whole return was inspected, not only the endpoints.

## Not done — genuinely pending
1. **Normal-speed playback** of the eight handoffs (all motion judgements above are from stills).
2. **Listening** to the mix (audio is byte-identical to V3, so only the V3 listening checks listed in `qa/v3_final/QA_REPORT.md` remain).
3. **Real Shorts UI** on a phone; the overlay is a generic guess.
4. Source B first-hand re-read and the "while testing websites" wording flag, unchanged from V3.

## Notes
- `tools/render_v3_1.sh` renders; `tools/qa_media_v3_1.sh`, `tools/qa_v3_1.py`, `tools/safe_zone_groups_v3.py`, `tools/audio_checks_v3.py`, `tools/phone_preview_v3.py`, `tools/mp4_sheet.py` produced the evidence. The brief is saved at `handoff/ROUND_FOUR_PROMPT.md`.
- After the final render only `auditQuote` in `quote.tsx` changed (it now audits the real claim-card scale); no pixel of the masters depends on it.
- No ElevenLabs, Runway or other paid or denied tool was used.
