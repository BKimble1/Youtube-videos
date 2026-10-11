# QA report — V1 (Round One), 11 Oct 2026

**Status: V1 built and rendered. Everything below marked MEASURED was run on the final files. Nobody has watched or listened to this V1 yet (this environment has no audio/video playback) — that review is the owner's next step and is listed under "Not done".**

## Final files (sha256 in `qa/v1/SHA256SUMS.txt`)
| File | Bytes | Result |
|---|---|---|
| `FGW_AI_Fake_Murder_Tip_V1_Clean_1080x1920.mp4` | 6,155,034 | native render |
| `FGW_AI_Fake_Murder_Tip_V1_Captioned_1080x1920.mp4` | 7,020,402 | native render |
| `exports/FGW_AI_Fake_Murder_Tip_V1_ReviewSmall_540x960_NOT_FOR_UPLOAD.mp4` | 1,562,576 | downscale of the captioned master, review only |
| `cover/FGW_AI_Fake_Murder_Tip_V1_Cover_1080x1920.png` | — | opening frame (f12), no captions |
| `FGW_AI_Fake_Murder_Tip_V1.srt` | — | 17 caption cues from the same cue table |

## MEASURED
| Check | Result |
|---|---|
| Type check (`tsc --noEmit`, TS 5.8.3) | exit 0 |
| Video (both masters) | h264 High, yuv420p, **1080×1920, 30/1 fps, 840 frames, 28.000 s**, bt709 primaries/transfer/matrix; ~1.4 Mb/s (clean) / ~1.7 Mb/s (captioned), CRF 16 slow |
| Audio (both) | AAC-LC, **48 kHz stereo**, ~317 kb/s, 28.011 s; starts at 0.000 s with the video (no A/V offset) |
| Full decode (`ffmpeg -f null`, video+audio) | **0 error lines**, both masters and the small review copy |
| Loudness of the *encoded* audio | **−15.1 LUFS integrated, LRA 1.9 LU, true peak −1.8 dBTP** (target −14…−16 LUFS, ≤ −1 dBTP) |
| Encoded audio vs `audio/stems/mix.wav` | cross-correlation lag 0 samples, r = 0.9999 |
| Music-to-voice gap during speech | 13.8 dB (target 12–18 dB); ducking up to −14 dB, 20 ms/240 ms; limiter max reduction 1.76 dB; no clipping |
| Stems | `voice/music/sfx/mix.wav`, 48 kHz stereo 16-bit, 28.000 s, sum to the mix |
| Loop seam, audio | mix starts ≈ 0 amplitude (first samples 0.0001) and ends at −66 dBFS: no click at the wrap |
| Loop seam, picture | frame 839 is the opener's layout (headline, same form and button geometry); 24-frame build from f816; sheet `qa/v1/transitions_b.png` |
| Captions | transcript equality and "no caption ends before its last spoken word" are asserted in `tools/build_cues.py`; browser audit (`qa/v1/caption_audit.json`): all 17 captions ≤ 2 lines, widest line 756 px ≤ 760 px lane; Montserrat 800 and Barlow Condensed 800 proven loaded (measured widths differ from the fallback) |
| Caption size | 76 px for 14 captions; shrunk to fit: #4 "Claude was testing / random webpages." 74 px, #6 72 px, #12 "Anthropic disclosed / this in October." 70 px |
| Safe zone x 100–870, y 220–1440 | Steady states are inside: headline 127–848, EVALUATION title and cards ≤ 861, page ≤ 852, captions 108–869. Outside only (a) **transitions** of ≤ 17 frames (camera pull-back f132–148, checker window sliding in/out f372–378 and f394–401, spring overshoot of bubbles/cards f246–248, f443–457, f590–593, loop pre-roll f825–827) and (b) **caption descenders**: baseline 1428, descender outlines reach ≈ 1450 (10 px past the conservative guide; first 4 frames of each caption also ride 14 px lower while the entrance rises). Lists: `qa/v1/safe_zone_*_groups.txt` |
| Phone size | `qa/v1/phone_preview_360x640_{1,2,3}.png`: decoded frames at 360×640 with a conservative Shorts UI overlay (top bar, right rail, bottom block) and the safe rectangle; no focal text or action sits under the rail/bottom block |
| Transition bursts | `qa/v1/transitions_a.png`, `transitions_b.png` (decoded frames around each scene change); iris reveal into the report card is clean from f583 (an earlier artifact was fixed) |
| Contact sheets | `qa/v1/contact_{1,2,3}_*.png` (decoded from the captioned master, every 0.5 s) |
| Checker reaction | native Character rig (gray bob, round glasses, coral cardigan, pencil): glance → raised brow → blink at f384 → deadpan; starts only after the spoken word "suspect" (f372); caption not covered |

## Not done — remaining human review
1. **Watch with sound at normal speed, twice, and loop it twice.** Never played; waveforms/contact sheets are not a listening review.
2. **Muted playback of the opening.** Checked only as frames: the headline FAKE MURDER TIP, the AI cursor and the captions carry the hook; not played.
3. **Phone check in the real YouTube Shorts UI** (my overlay is conservative guesswork, not the live UI).
4. **Low-volume check** of voice vs effects.
5. **Source B was not read first-hand** (6abc.com is blocked here). The July 18 tip date and "never reached investigators" come from search excerpts of outlets repeating the police statement. Re-check before publishing — `claim_ledger.md` C9.
6. **Wording flag (owner decision, not changed):** narration line 3 "Claude was testing random webpages." Anthropic's text says the model was "tasked with generating and performing example tasks on randomly selected webpages". Suggested exact wording for the next pass: "Claude was running example tasks on random webpages."

## Deviations from the brief
- **Runway:** no checker clip was generated. The proxy denies Runway's CDN (`dnznrvs05pmza.cloudfront.net`), so a paid clip could not be downloaded or inspected. 0 credits spent; the reaction is the native Remotion rig. `runway/RUNWAY_ATTEMPT.md`.
- **Music** is an original numpy-synthesised bed (the earlier Runway-generated bed host is blocked).
- Narration used **1 of max 2** takes; 5 ElevenLabs effects (the generated spam "thump" was too quiet, a local thump replaces it; its latch is used).
- Captions: three shrunk below 76 px to keep two lines inside the lane (70–74 px).
- The cover is the opening frame; its lower half is empty because captions live there in the video. Owner may prefer another frame.

## The six V1 review questions (my answers come from frames and measurements only — please confirm by watching)
1. **Cold viewer understands the hook in the first seconds?** Likely yes: the voice starts at 0.0 s, the first frame already shows FAKE MURDER TIP over a tip form with an AI-tagged cursor, "An AI submitted" is on screen from frame 0, the form flips to SENT as it is spoken (f29–30) and the header turns into POLICE TIP on "real" (f84). Untested on a real cold viewer.
2. **Do the two reveals register without rereading?** Reveal 1 (a real police site) is a header change + emphasis on "real". Reveal 2 (the page has no description) is built as: highlighted claim → a held music pocket → the page scrolls to the empty SUSPECT DESCRIPTION field → dry tap, red outline and an EMPTY tag on "even" → the checker's look after the spoken "suspect". Plausible; needs a watch.
3. **Does each shot change what the viewer understands?** Per the shot map: form (what) → evaluation workspace (context) → claim vs empty field (the flaw) → submission and spam folder (consequence) → report card with two dates (evidence) → chat bubble and button (meaning) → loop. No decorative shots.
4. **Exact text, captions and focal actions clear on a phone?** Captions ≥ 70 px at 1080 wide (≈ 23–25 px at 360 wide) are clear in the previews; the headline, SPAM, EMPTY, POLICE TIP, dates are large. Small secondary labels (NAME (OPTIONAL), SUSPECT DESCRIPTION, the footnote "Tip date per police statement") are about 8–10 px at 360 wide — readable but small; their meaning is also carried by larger elements. Owner call.
5. **Voice and effects purposeful at normal and low volume?** Not listened. By measurement: voice dominates by 13.8 dB, effects are placed from the cue table (click on press, keys on "claimed", tap on "even", send accent, folder thump and latch on "spam"), and two music pockets open before the reveal and at the spam line.
6. **End-to-start boundary coherent without sacrificing the ending?** The last spoken word ends at 27.0 s, the closing line lands on the button, and the last ~1 s builds the opening form around the same button (f816–839), so frame 839 ≈ frame 0 and the audio wraps without a click. Whether the wrap *feels* seamless needs a looped playback.
