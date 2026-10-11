# QA report — V3 Final "AI Sent Police a Fake Murder Tip" (11 Oct 2026)

**Status: built and rendered from source; nothing published, uploaded or scheduled.** MEASURED = run on the final encoded files. FRAMES = looked at decoded frames and sheets from the encoded masters. **Nobody has watched or listened to V3: this environment has no audio or video playback. Every perceptual check is listed under "Not done" — none is claimed.**

Baseline: V2 verified before work (branch `claude/ai-fake-murder-tip-short-v2`, commit `70a6451`, clean). V3 is on `claude/ai-fake-murder-tip-short-v3-final`; V1/V2 files are untouched.

## Final files (sha256 in `SHA256SUMS.txt`)
| File | Bytes |
|---|---|
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_Captioned_1080x1920.mp4` | 4,108,576 |
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_Clean_1080x1920.mp4` (keeps the opening headline; no lane captions) | 3,646,100 |
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_ReviewSmall_NOT_FOR_UPLOAD.mp4` (540×960 downscale of the captioned master) | 909,620 |
| `exports/FGW_AI_Fake_Murder_Tip_V3_Final_Mix_review.mp3` (192 kb/s, from `mix.wav`) | 505,197 |
| `captions/FGW_AI_Fake_Murder_Tip_V3_Final.srt` (15 cues, same cue table) | |
| `cover/FGW_AI_Fake_Murder_Tip_V3_Final_Cover_1080x1920.png` (the actual frame 0, 1080×1920) | |
| `audio/stems_v3_final/{narration,music,effects,mix}.wav` (48 kHz stereo 16-bit, 21.000 s) | |

## MEASURED
| Check | Result |
|---|---|
| Type check (`tsc --noEmit`, TS 5.8.3) | exit 0 |
| Video (both masters) | h264 High, yuv420p, **1080×1920, 30/1 fps, 630 frames, 21.000 s**, bt709, CRF 16 slow; rendered natively, nothing upscaled |
| Audio (both masters) | AAC-LC 48 kHz stereo, ~317 kb/s, 21.013 s |
| Full decode (video+audio, `ffmpeg -f null`) | **0 error lines** on the Captioned, Clean and ReviewSmall files |
| Loudness of the *encoded* AAC (both masters) | **−15.0 LUFS integrated, LRA 2.1 LU, true peak −1.8 dBTP** (limit asked: ≤ −1.5). ReviewSmall (128 kb/s): −15.1 LUFS, −1.6 dBTP |
| Mix WAV | −15.0 LUFS, sample peak −1.90 dBFS, 0 clipped samples, limiter max reduction 1.75 dB; stem gain +1.2 dB (V2 +1.4 dB) |
| A/V alignment | encoded audio vs `mix.wav`: lag 0 samples, r = 0.99996 |
| Stems | narration + music + effects = mix (max difference 3.05e-5) |
| Voice | `narration_v2_final_48k.wav` sha256 `6000cf2f…c658` **identical to the V2 commit**; first word starts 0.10 s (acoustic onset ≈ 0.05 s), speech ends 19.52 s |
| Underlay vs V2 | music-minus-voice over the same speech windows outside pockets: **V2 −15.97 dB → V3 −18.97 dB (−3.0 dB)**; all-speech −15.47 → −19.93 dB. Per section (V2 → V3): opening −24.2 → −27.3, quote −15.7 → −18.6, test −15.2 → −18.2, spam outcome −15.1 → −20.7, takeaway −15.0 → −21.0 |
| Pocket | music RMS 4.8–7.39 s: V2 −33.7 → **V3 −41.0 dBFS**; around "no" (6.3–6.9 s) −35.4 → **−43.2 dBFS**; the pocket opens 0.14 s before "Except…" (4.94 s) |
| Ducking | narration-driven, 40 ms look-ahead, 30 ms attack, 320 ms release, ≤ −12 dB (V2: 20/240 ms, none); max curve slope 244 dB/s vs 600 dB/s theoretical for a 20 ms attack |
| Effects (7, `audio/sfx_log_v3.csv`) | click f11 (0.375 s; contact f12), low tap f12, light paper 0.685 s and 2.07 s, stamp tap 6.46 s (f194), folder thud 12.776 s (f383), button tick 18.74 s (f562). Peaks re the voice RMS: −3.7 / −2.4 / −10.9 / −4.9 / −10.9 / −7.7 / −19.1 dB. **Nothing before 0.375 s** (effects before the first word: 0). No siren, gunshot, alert, riser, whoosh |
| Loop seam, audio | first sample 4e-4, last sample 0.0; last 300 ms RMS −41 dBFS, last 100 ms peak −47 dBFS (bed fades over the last 0.6 s); voice begins ≈ 0.05 s |
| Loop seam, picture | frame 629 vs frame 0: mean abs diff 0.50/255, 0.17 % of pixels differ by > 32 (cursor idle offset); ordinary frame-to-frame motion at the opening is 0.07. Frames 627–629 are static, so nothing is cut off and there is no black or outro frame |
| Mono / small-speaker proxies | L/R correlation 0.9992; mono sum RMS differs by −0.002 dB from stereo (no cancellation; ffmpeg reports a mono track 3 LU lower than dual-mono stereo by definition). 300–4000 Hz band of the mix: −16.5 LUFS. Voice minus (music + effects) in 1–4 kHz over speech: 38.9 dB. These are proxies, not listening |
| Captions | transcript equality and "no caption ends before its last spoken word" asserted in `tools/build_cues_v3.py`; browser audit (`caption_audit.json`): 16 entries (the first two are the headline words, not drawn in the lane), lane captions ≤ 2 lines, 76 px except #3 "someone matching / a description." at 74 px (widest line 764.5 ≤ 770), Montserrat 800 and Barlow Condensed 800 proven loaded |
| Safe zone x 96–876, y 240–1450 (background-aware scan with 8 px tolerance, `safe_zone_*_groups.txt`) | Steady content is inside, except: (a) the checker's torso/sleeve bleeds off the left edge (rows ≈ 685–1260) throughout the contradiction scene — face, hands, page, stamp and captions are inside; (b) transitions: ink↔cream wipe f149–155, the checker dropping out f223–236 (flagged together with (a) as f149–239), chips sliding in f257–259, chips leaving f338–343, ink iris f448–449. Extents of all other frames: x 91–884, y 270–1457 (caption descenders reach 1457, 7 px past the line, inside the tolerance) |
| First frame | frame 0 already shows the headline, form, cursor and AI tag; no black, no fade-in, no logo; effects: none until 0.375 s |

## FRAMES (looked at, not played)
- `first_2s_muted_check.png`, `contact_1_0-10s.png`, `contact_2_10-21s.png`, `transitions_{a,b,c,d}.png`, `phone_preview_360x640_{1,2}.png` (360×640 decoded frames with a conservative top/right/bottom Shorts overlay and the 96–876/240–1450 rectangle) — all from the encoded masters.
- Muted opening (frames only): "AI sent police a fake murder tip" reads from the headline alone; the press, SENT, envelope and AI mark are visible within 0.5–1.0 s.
- Contradiction scene at phone size: NO DESCRIPTION PROVIDED (three-line label, inside the page) is fully visible from f196; the hand has already left the page. The label was re-set during QA after a full-resolution look showed the first draft clipped at the page edge and partly covered by the resting forearm.
- Takeaway: the invented-answer paper stays framed; the dimmed SUBMIT becomes enabled; a dotted path with the envelope leaves the frame inside x ≤ 880; the button is never pressed.
- Defects found and fixed during QA (all re-rendered): AI tag cropped by the opening mask, tag covering the SUBMIT label, stamp clipped and covered, strip neighbours bleeding past x = 96, slide-ins running through the right rail, takeaway path beyond x = 876, claim-card label above y = 240, loop seam headline pop.

## Not done — remaining human review (none performed)
1. **Listen to the full mix** on headphones and on a phone speaker (low and ordinary volume): effect levels (the click overlaps "sent"; the stamp tap sits in the 80 ms gap before "no"), whether the −3 dB underlay and deeper pocket feel right, ducking smoothness, the folder thud, harshness or pumping.
2. **Listen to the voice alone**, especially the opening sentence: no defect could be perceived here, so the approved take was not repaired. If it sounds wrong, one targeted repair of that sentence (≤ 2 candidates) is within the brief.
3. **Mono** check on a real mono output and a **real small-speaker** check (the numbers above are proxies).
4. **Muted first 2 s** on a phone (checked on frames only).
5. **Loop ×3**: whether the return feels continuous in motion and sound (only the endpoint frames and samples were compared).
6. **Normal-speed watch** of every scene, including the checker's gaze, pencil/finger and the AI mark peeling into the cursor (≈ 0.3 s, it crosses the claim text briefly), and the real **Shorts UI** (the overlay is conservative guesswork).
7. **Source B** (6abc/PPD statement) was not read first-hand (6abc.com unreachable here): re-check the Philadelphia name and the July 18 date before publishing. **Wording flag** (unchanged): "Claude did this while testing websites." → suggested "during a website test".

## Deviations / notes
- **Voice:** retained unchanged; no ElevenLabs operation run or needed. The connector's upload tools were denied earlier in this conversation and were not retried by another route. **Runway:** not used.
- **Clean master** keeps the opening headline (it is the premise and the sentence-1 caption); no headline-free variant was made.
- **Colour:** saffron now means "AI / what the AI wrote" (cursor tag, corner mark, highlighted claim) — see `DECISIONS.md`.
- **No attribution pill** in the picture (V2's ANTHROPIC REPORT · OCT 9, 2026 was removed); sources and dates are in `packaging_v3.md`.
- No claim is made about retention, swipe-away or any platform threshold.
