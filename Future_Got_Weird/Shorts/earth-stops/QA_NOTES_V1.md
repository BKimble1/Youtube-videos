# QA notes — V1 review cut (concise)

File checked: `exports/v4/FGW_EarthStops_V1_Review_1080x1920.mp4` (the Silent / VoiceOnly / SFXOnly mp4s carry the same picture bytes). Numbers: `qa/v4/QA_V1.json`, `qa/v4/CAPTION_SYNC.json`, figure `qa/v4/qa_figures_v1.png`. **These are measurements of the encoded files. They do not establish that the film is clear, engaging, funny, correct to a viewer or pleasant to hear.**

## What was inspected (by me, from the encoded file)
- **Every frame** (1,035) as contact sheets, 45 per sheet at 216 × 384 with frame numbers (`qa/v4/sheets/`, 23 sheets). Reading history, stated exactly: all 23 sheets of the **first** complete render were read; after fixes there were two more complete renders. Sheets **11, 12, 13, 17, 18, 19, 20, 22, 23** (B04 air → B05 start, B04 ocean → tide fill, B05 build, the B05 → B06 dissolve, still globe, the globe ride, dive, close-up, sip, pull-back, loop) were read again in the **final** file. Sheets 8, 9, 10 (B03 plaza → B04 start) were read in the second render, whose B03 code is the final code, and not re-read in the final file. Sheets 1–7 (hook, B02), 14–16 (B05 chart) and 21 (close-up) were read only in the first render; their code did not change afterwards except that the sip moved 2 frames earlier (sheets 22–23, re-read). About 40 half-resolution stills of the dissolves were also read.
- The loop seam (frames 1033, 1034, 0, 1: `qa/v4/loop_seam_f1033_f1034_f0_f1.png`).
- Caption timing against the narration's word times; caption width.
- Audio: loudness, true peak, A/V alignment of the AAC against the WAV, voice integrity, speech-to-sound-effect ratio (a proxy), silences.

## Measured results
| Check | Result |
|---|---|
| Container | h264 High, 1080 × 1920, 30 fps, yuv420p, bt709, 1,035 frames, 34.500 s (under 60 s); AAC 48 kHz stereo ≈ 257 kb/s; 23.1 MB |
| Frames below 20 mean gray (black frames) | none (min 75.6) |
| Jump cuts (adjacent diff > 3 × the 95th percentile) | none; max adjacent diff 51 at f1013 (the pull-back dissolve) |
| Loop seam | last frame vs frame 0 diff 8.8, last vs previous 9.1, ordinary adjacent diffs 8.3–10.7 → the last frame is the frame *before* frame 0, so the loop is continuous to the frame (no repeated frame) |
| Frozen frames (≥ 3 identical) | f541–545 (5 frames, 0.17 s): the water has filled the frame and the chart's disc has not yet appeared |
| Low-motion runs (< 25 % of median motion, ≥ 8 frames) | f741–777 (1.2 s): the still globe under "None of this can really happen" (only a slow drift) |
| Motion energy per second (median adjacent diff 2.5) | 13 / 10 / 14 / 14 / 10 / 9 / 8 / 9 / 3 / 5 / 12 / 2.5 / 2.4 / 2.6 / 3.4 / 2.3 / 3.3 / 5.2 / 2.6 / **1.1 / 0.9 / 1.1 / 1.3 / 1.0** / 5.2 / **0.5** / 2.0 / 1.7 / 4.0 / 12 / 2.0 / 1.7 / 2.6 / 13 / 17 (seconds 0–34). Seconds 19–23 (the B05 chart) and 25 (still globe) are the quietest; the hook and the dives are the busiest |
| Captions | 23 cues, widest line 749 px (limit 960); every cue after the first starts −120…+13 ms from its first word and ends 27–433 ms after its last word. The first cue starts 567 ms after "What" **on purpose** (the globe has the frame first) |
| Loudness | mix WAV −15.8 LUFS integrated, LRA 2.5 LU, −1.5 dBTP; AAC in the mp4 −15.8 LUFS, −1.6 dBTP |
| A/V | AAC vs WAV lag 0 samples; audio and video both 34.500 s, start 0 |
| Voice integrity | the voice stem = the take × one constant gain (−0.40 dB); fitted-gain residual −75 dB below the voice (16-bit rounding). No trim, stretch, pitch or EQ |
| Speech-to-SFX proxy (300–3400 Hz, 187 voiced 100 ms windows) | median +26 dB; 5th percentile +6 dB; 9 windows below +6 dB. Worst: **0.6 s** (−14 dB: the launch scuff under the tail of "Earth"), 6.1 s (−7: the iris whoosh under "So"), 13.3 s (−5: the bicycle freewheel under "keeps"), 19.1 s (−1: arrow slap under "slower"), 33.1 s (+1: sip under "just never"). A spectral-energy proxy, **not** intelligibility; fricatives carry little energy in this band, so some of these windows are soft word onsets |
| Silences in the mix (< −50 dBFS, ≥ 100 ms) | 19.55–19.95 s (0.4 s, the dash pause after "slower—"), 21.5–21.7, 24.1–24.2 |

## Defects found in review and fixed before export
Muddy cross-fades (B02 dive, B05 → B06, dive into the close-up, pull-back) → layers now share one camera so the two figures stay aligned; a rectangle edge showing during two of the dissolves → oversized backgrounds; loose things in the plaza slid to a stop and sat there while the line says they keep going → they now leave the screen and the bicycle rolls through; a pop-in of the sea at the end of B04 → it rises from below the frame; a blank wall slab → stonework, ladder, lifebuoy, bollards; the speed arrow over her face on the globe → above and ahead of her; the loop repeated a frame → continuous; sip ticks and the freewheel were louder than the voice in the proxy → lowered.

## Known weak spots (not fixed; for the owner's judgement)
- B05 (18–25 s) is the quietest picture: a small chart and polar view with empty teal below; motion energy ≈ 1.
- The still globe (f741–777) and the 0.17 s all-teal beat (f541–545) are deliberate pauses but measure as low motion.
- Lower thirds of B02's globe, B05 and B06's globe are empty (under the Shorts UI zone, which was **not** checked).
- The hook is unchanged from H1: its stop is 0.55 s before the spoken "stopped", and the side-view cast identity has not been checked by the owner.
- The B03 bicycle is shown loose; the cat and pigeon from the street stay off-screen.
- Mix proxy windows above; the freewheel and sip sounds may still be too loud or too soft by ear.

## Unavailable checks (not done; I could not do them here)
1. **Real-time viewing** of the video by anyone. I looked at stills and sheets, not motion.
2. **Listening** to any audio (voice, effects, mix): performance, pronunciation, intelligibility, balance, harshness, whether the stop "lands", whether any effect annoys. All sound decisions were set by measurement relative to the voice.
3. **Phone-speaker and headphone playback**; **muted-viewing comprehension**; **live Shorts UI overlay** (caption lane, chips, bottom third).
4. A **Scribe pass on the final mix** (the restricted ElevenLabs connector has no file-upload tool); take A alone was transcribed and matched the text word for word.
5. **Source pages** (none opened: network policy); every claim status is "excerpt only".
6. The **Runway clip** (its host is blocked; see `script/STORYBOARD.md`).
7. **Audience or analytics data**: none exists; no AI viewers or frame votes were used.
