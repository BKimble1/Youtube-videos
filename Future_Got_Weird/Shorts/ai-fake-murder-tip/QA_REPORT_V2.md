# QA report — V2 "AI Sent Police a Fake Murder Tip" (11 Oct 2026)

**Status: V2 built and rendered from source. Items marked MEASURED were run on the final files; items marked FRAMES were checked by looking at decoded frames and sheets. Nobody has watched or listened to V2 (no audio/video playback in this environment): every listening and normal-speed motion check is listed under "Not done".**

## Final files (sha256 in `qa/v2/SHA256SUMS.txt`)
| File | Bytes |
|---|---|
| `FGW_AI_Fake_Murder_Tip_V2_Clean_1080x1920.mp4` | 3,792,146 |
| `FGW_AI_Fake_Murder_Tip_V2_Captioned_1080x1920.mp4` | 4,273,014 |
| `exports/FGW_AI_Fake_Murder_Tip_V2_ReviewSmall_540x960_NOT_FOR_UPLOAD.mp4` | 945,494 (downscale of the captioned master, review only) |
| `cover/FGW_AI_Fake_Murder_Tip_V2_Cover_1080x1920.png` | opening composition (frame 0, no captions) |
| `FGW_AI_Fake_Murder_Tip_V2.srt` | 16 cues from the same cue table |

## MEASURED
| Check | Result |
|---|---|
| Type check (`tsc --noEmit`, TS 5.8.3) | exit 0 |
| Video (both masters) | h264 High, yuv420p, **1080×1920, 30/1 fps, 630 frames, 21.000 s**, bt709, CRF 16 slow. Rendered from source; nothing upscaled |
| Audio (both) | AAC-LC, **48 kHz stereo**, ~317 kb/s, 21.013 s, starts with the video |
| Full decode (`ffmpeg -f null`, video+audio) | **0 error lines** (both masters and the small review copy) |
| Loudness of the *encoded* audio | **−15.1 LUFS integrated, LRA 1.9 LU, true peak −1.8 dBTP** |
| Encoded audio vs `audio/stems_v2/mix.wav` | cross-correlation lag 0 samples, r = 0.9999 |
| Stems | `voice/music/sfx/mix.wav`, 48 kHz stereo 16-bit, 21.000 s; voice+music+sfx = mix (max difference 3e-5) |
| Voice | first word starts at **0.10 s**; speech ends 19.52 s; 58 words ≈ **179 wpm** overall (about 200 wpm inside phrases). No speed parameter exists on this connector for `eleven_v4`/`eleven_v3` (schema inspected), nothing was time-stretched; nine long pauses were shortened (raw 21.44 s → 19.76 s) |
| Audible edits | each shortened pause was cut inside silence with an 8 ms cross-fade; largest sample step at the nine joins 0.00012 vs a speech median of 0.0045 |
| Pause before the reveal | "Except…" ends 5.56 s, "the page had no description" starts 5.80 s; "no" lands at 6.52 s |
| Music vs voice | music 15.5 dB below voice across the speech windows (target 12–18 dB); ducking up to −12 dB, 20 ms / 240 ms, derived from the narration; the pocket before NO DESCRIPTION drops the bed to about −38 dBFS RMS; limiter max reduction 2.07 dB |
| Loop seam, audio | mix starts ≈ 0 amplitude (first samples 4e-4) and ends at −72 dBFS: no click at the wrap |
| Loop seam, picture | frame 629 = the opening composition without the headline (ink, same window rectangle, same SUBMIT geometry, pointer back at its frame-0 position); the headline pops in at frame 0 of the next loop |
| Captions | transcript equality and "no caption ends before its last spoken word" asserted in `tools/build_cues_v2.py`; browser audit (`qa/v2/caption_audit.json`): 16 captions, ≤ 2 lines, 76 px except #4 "someone matching / a description." at 74 px (widest line 764 ≤ 770), Montserrat 800 and Barlow Condensed 800 proven loaded |
| Reveal timing | the first reveal (NO DESCRIPTION PROVIDED) lands at **6.52 s** (frame 196); V1 landed at about 11 s |
| Safe zone x 100–870, y 220–1440 (background-aware scan, `qa/v2/safe_zone_*_groups.txt`) | Steady states are inside (worst x 92–878, y 213–1291 for content frames; caption descenders reach y 1443). Outside only during **transitions of ≤ 36 frames**: ink↔cream wipe (f149–155), chips/panel sliding in and out (f226–261), spring overshoot (f264–266), fold and inbox/folder slide-ins (f338–362), the spam-filter arm entering from the right (f371–384), the iris (f447–449); plus the first frame of each caption, which rises 14 px (descender outline at y 1456) |
| Phone size | `qa/v2/phone_preview_360x640_{1,2,3}.png`: decoded frames at 360×640 with a conservative Shorts UI overlay (top bar, right rail, bottom block) and the safe rectangle |

## FRAMES (looked at, not played)
- **First frame:** ink background, giant FAKE (coral stamp) / MURDER TIP, a large cream tip window with the teal POLICE TIP header, and an AI AGENT pointer already travelling toward SUBMIT. No black opening, no late header. Muted, "AI sent a fake murder tip to police" reads from the picture alone.
- **One main submission:** a single press (frame 13, SUBMIT → pressed → SENT). The closing SUBMIT only unlocks; it is never pressed.
- **Testing context and outcome:** CLAUDE HAIKU 4.5 + WEBSITE TEST chips and three webpage cards, then the REAL POLICE FORM; envelope → POLICE INBOX → SPAM FILTER arm → large SPAM folder; INVESTIGATORS tray stays empty and secondary.
- **Checker:** native rig (gray bob, round glasses, coral cardigan, pencil), now a large medium close-up in a 770×656 panel; three reading sweeps, freeze at the stamp, one raised eyebrow, glance up at the claim, back down, blink; a small porthole version follows the envelope in beat 5. Same file as V1, unchanged.
- **Transitions:** `qa/v2/transitions_a.png`, `transitions_b.png` (window mask → evidence card; card → ink→cream wipe; page → webpage card; police card → form; form → envelope; tray → chat window iris; chat window → opening window).
- **Contact sheets:** `qa/v2/contact_1_0-10s.png`, `contact_2_10-21s.png` (decoded, every 0.5 s).
- **Effects vs picture:** click frame 12 (press frame 13, the sample leads by 25 ms), keys frame 69 (quote line 1), tick frame 197 (stamp frame 196, after the first consonant of "no"), send accent frame 351 (envelope departs), thump frame 383 (lands), latch frame 386; log in `audio/sfx_log_v2.csv`.

## Not done — remaining human review
1. **Listen to the whole mix** on a phone speaker at low and ordinary volume and on headphones: vocal acting, pronunciation of "Except…", whether the stress falls on police / fake / no description / spam / submit button, music suitability (pulse + two-note motif), masking of consonants by the effects, harshness, pumping, the audible quality of the nine pause trims, and the relief chord at the spam outcome.
2. **Watch at normal speed**, and **loop it twice** (the loop is a deliberate return to the opening geometry, not a promise that it feels seamless).
3. **Muted playback** of the opening (checked on frames only).
4. **The real Shorts UI** on a phone (my overlay is conservative guesswork).
5. **Source B was not read first-hand** (6abc.com unreachable here). The Philadelphia name, the July 18 date and "no indication of unauthorised access" rest on the brief and search excerpts. Re-check before publishing (`claim_ledger_v2.md`).
6. **Wording flag (owner decision, not changed):** "Claude did this while testing websites." Source A says the model performed example tasks on randomly selected pages in an evaluation. Suggested exact wording: "Claude did this during a website test."

## Deviations from the brief
- **Runway:** no character clip generated, 0 credits spent. Existing jobs contain no checker clip, and Runway's output hosts are blocked by the egress policy, so a paid clip could not be downloaded or inspected. The checker is the faithful native rig. `runway/RUNWAY_V2.md`.
- **ChatGPT artwork:** none needed (a larger native-rig pose covers the close-up).
- **Narration:** one full take (of max two); no native speed parameter available; nine pauses shortened in the edit; total 19.76 s of speech, film 21.000 s (the brief's "roughly 21–24 s").
- **Effects:** no new generations; five V1 ElevenLabs effects reused (click, keys, dry knock shortened to a tick, send, latch) plus local low tap, thump and five tiny ticks.
- **Music:** original local synthesis at 114.3 BPM (muted pulse + two-note plucked motif); no Runway or licensed stem.
- **Caption size:** one caption at 74 px (range asked: 72–84).
- **Palette:** ink / cream / coral / teal plus their tints (a light teal panel behind the checker, a paper-deep tone for envelopes, neutral grey greeking lines). Saffron appears only on the highlighted claim and on the approved checker's pencil.
- **Packaging:** draft only (`packaging_v2.md`); nothing published, uploaded or scheduled.

## How each V1 problem was handled
| V1 issue | V2 |
|---|---|
| Headline present but police header late (≈ 2.7 s) | POLICE TIP + AI AGENT + FAKE MURDER TIP on frame 0; one press on "sent" |
| EVALUATION and unrelated webpage icons before the surprise | Testing context moved after the contradiction, shown as a short test board (beat 4) |
| Type-on quote; twist at ≈ 11 s; tiny boxed checker at ≈ 12.5 s | Quote appears line by line on the spoken words; twist at 6.5 s; large checker shot with a held, readable reaction |
| Empty form field mistaken for the real page | Editorial stamp NO DESCRIPTION PROVIDED on an illustrated page; no realistic blank field |
| Second press, small envelope/inbox/folder | One press; large envelope → inbox → swat → SPAM; empty tray |
| Date/report scene stalled the action | No date sentence; dates only in the description; attribution once, in picture |
| Chat bubble small and button separate | One chat window; the bubble's tail becomes the AI pointer and reaches a locked SUBMIT |
| Opener reappeared after the captions cleared | Last line stays through its last word (+0.36 s); then the window returns to the opening geometry without replaying the headline |
