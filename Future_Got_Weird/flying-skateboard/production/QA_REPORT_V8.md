# Flying Skateboard V8: QC report

**File:** `exports/FGW_Flying_Skateboard_V8_REVIEW_1080x1920.mp4`. Measured with `tools/qa.py` (results in `qa/v8_review_qa.json`) and the checks below.

**Status: REVIEW, not final.** Every check below was made on the rendered files and the mix stems. No one has watched or listened to it in real time: this environment has no playback. Before it is final, watch it once on a phone at normal speed with sound, paying particular attention to the narration joins and the engine levels.

## Specs (from the file)

| | |
|---|---|
| Video | H.264 High, 1080×1920, 30 fps, yuv420p, BT.709, 954 frames, 31.80 s. Rendered at 2160×3840, then downsampled with Lanczos. |
| Audio | AAC 48 kHz stereo, −14.0 LUFS integrated, sample peak −2.3 dBFS |
| Decode errors, black frames, freezes over 1 s | None |

## The brief's confirmations

| Check | How it was checked | Result |
|---|---|---|
| Flight unmistakable within 0.5 s | Every frame 0–89 decoded from the MP4 | **Pass.** Frame 0: he is in flight over the river, about a third of the frame tall, with his shadow and the downwash on the water below. The gravel bar's edge enters from frame 6 (0.2 s) and streams under him by frame 15 (0.5 s), with the water texture streaming too. One tracking move, then a smooth widening to the far bank (frames 45–80). |
| Every approved word intact | `tools/tighten_narration_v8.py` compares every word's samples with the V1 take | **Pass.** 99 of 99 words, in order, sample-identical (largest difference 0.0). Only silence was removed. |
| Natural narration, no repeated waiting | Pause lengths before and after (`audio/narration/narration_v8_cuts.json`) | **Pass on the numbers.** The ten long pauses (0.44–0.83 s) are now 0.21–0.37 s. Two ellipses ("ENGINES…" 0.26 s, "RIVER…" 0.24 s) and the beat after "CANYON." (0.37 s) are kept. Short pauses (0.27 s or less) are untouched. **Not heard in real time.** |
| No clipped audio at the joins | Each cut sits inside a −80 dB silent stretch, with 30 ms of silence kept at each side and a 12 ms crossfade | **Pass.** No word decay or onset was touched. |
| Engine sound under the speech | Voice against everything else in the 400–5000 Hz band while he speaks, per scene | **Pass.** 17.4 dB overall, between 14.0 dB (the jet test) and 22.5 dB (the coach) by scene. V7: 15.3 dB overall. |
| No engine surges in the gaps or pumping | The electric bed's level in the gaps between phrases against under speech, plus the non-voice level every 0.5 s across the film | **Pass.** The bed is +0.3 dB in the gaps against under speech. The non-voice level holds at about −30 dB ±1.5 dB outside the jet test, which peaks at about −23 dB. |
| Jet reserved for the prototype | Stems | **Pass.** The jet stem is silent outside the workshop. It is 4 dB above the electric bed. |
| Caption sync | Caption show/hide times against word times (`timeline_v8.json`) | **Pass.** All 29 captions show 0–0.04 s before their first word, and none hides before its last word ends. |
| YOUR PRICE? during the question | Frames at the end | **Pass.** It appears on "PAY YOU" (30.2 s) under the board and holds to the last frame. Captions stay clear of it. |
| Replay | Last six frames and the first three, decoded from the MP4 | **Pass.** Rider, board, framing and motion carry straight into frame 0. The larger step at the seam (6.4 against a 3.6 median) is the caption change. |
| Feet | `source/src/dev/footCheck8.ts`, every rider frame (775) | **Pass.** 0.00 mm largest ankle gap; no knee bent backward. |
| Helmet | `source/src/dev/helmetFilm8.ts` | **Pass.** The flagged steps are at 4.13 and 4.47 s (the head hidden behind the deck seen from below, so not visible) and 21.0 s (the helmet entering frame during the coach move). Otherwise the median step is 0.25 % of the head disc. |
| Abrupt animation | Per-frame pop scan of the MP4 (8×6 cells), with each candidate inspected | **Pass after one fix.** Most candidates are caption changes. The coach move's swing from the deck phone to the wrist (20.8–20.9 s) had become a 0.36 s whip through his legs on the tighter clock. It now takes 0.56 s and backs off from his body mid-move, and was re-rendered. |

## Remaining notes
- **No real-time viewing or listening yet** (see the status above). The sound was judged from the stems and measurements only. The comparison files, the voice alone and the mix without effects, are rebuilt by `tools/make_audio_v8.py` in `audio/mix/stems_v8/`.
- **Wide view, 2.1–2.7 s:** he is small on screen for about 0.6 s, which is the deliberate widening on "across a RIVER."
- **Coach move:** his glove passes close in the foreground for a few frames as the camera rises to the wrist (20.8–21.0 s).
- **Still true from V7:**
  - In the over-shoulder coach view his ear and the earbud read as two dark shapes.
  - The new-motor close-up in the workshop is seen from above (the fan and hub, not the motor's insides).
