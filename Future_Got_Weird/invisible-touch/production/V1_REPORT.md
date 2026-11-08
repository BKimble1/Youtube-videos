# Invisible Touch V1: review report

**Status.** This is a review render, **not declared publishable**. It was rendered from source and inspected from the
file: contact sheets, a frame-step at every cut, the loop seam, native-resolution crops, a muted phone-size sheet, and
ASR of the delivered audio.

Nobody has watched it in real time with sound: this environment has no playback. A human real-time pass is the
remaining gate.

## Deliverable

| Item | Value |
|---|---|
| File | `exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4` |
| Video | 1080×1920, 30 fps, H.264 (CRF 16, yuv420p, BT.709), **934 frames** |
| Duration | **31.133 s** (31.13 s) |
| Length versus target | 0.13 s over the 28–31 s target. The natural narration ran long; it was not sped up (see below). |
| Audio | AAC 48 kHz stereo. **−14.0 LUFS** integrated, **−1.6 dBTP** true peak. The limiter reduces gain by at most 3.2 dB. |
| Captions | Burned in: 21 phrase captions, Nunito Black, white with yellow emphasis, inside x 110–870 and y 330–1470. SRT: `captions/FGW_Invisible_Touch_V1.srt` |

## Narration

The narration text is `production/NARRATION_LOCKED.txt`, word for word (101 words). Word timings are in
`production/WORD_TIMINGS.md`.

**Voice.** The channel narrator: ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`, directed with
inline tags only.

**Takes.** One run of two takes. Take 2 (`zLJn`) was chosen because it is word-perfect on both recognisers. Take 1's
"can" read as "kin" to Zipformer. Details: `audio/narration/voice_provenance.json`.

**Timing.**
- The natural take is 32.08 s of speech, longer than the target.
- **The only edit:** 14 sentence gaps longer than 0.30 s were shortened to 0.30 s. The gap before "You can't actually
  grab it" was kept at 0.36 s. Each cut is in the middle of a silent run, with a 12 ms crossfade. In total 1.12 s of
  silence was removed.
- No word is stretched, pitch-shifted or sped up.
- Speech runs from 0.00 s to 30.64 s, followed by a 0.49 s hold before the loop.

**Verification from the delivered audio.**

| Source | Zipformer WER | Whisper WER |
|---|---|---|
| MP4 audio | **0.000** | 0.059 |
| Voice stem | 0.000 | 0.000 |
| The final line cut from the MP4 | Correct | Correct ("but your skin can still feel it") |

- The MP4's Whisper miss is a segmentation artefact: its last window also contains the loop's closing pulse.
- Narration lag in the mix against the master: **0 samples**.
- The first 100 ms are not silent; speech starts on frame 0.

## Shot plan as built

See `production/SHOTS_AND_TRANSITIONS.md` for 25 compositions, each keyed to measured word onsets, and the
17-transition list.

The storyboard's timings were treated as targets. The real narration runs about 1–2 s later than the storyboard
through the mechanism section, so each beat follows its words, not the storyboard seconds.

## Review gates

| # | Gate | Result |
|---|---|---|
| 1 | Narration verbatim | **Pass.** WER 0 (Zipformer on the MP4; both models on the voice stem). |
| 2 | Frame 0 shows the payoff | **Pass.** Frame 0 is the fingertip close-up mid-dip into a cyan pulse in empty air; the first caption is up. |
| 3 | Device and finger separation clear by 3 s | **Pass.** The arc shows empty air from 0.6 s; the pull-back shows the hand over the array by 2.3 s; the low angle and card pass follow at 3.05 s. |
| 4 | Mechanism understandable without captions | **Pass on the muted phone-size sheet** (`qa/v1/phone_size_muted_every1.5s.png`): the array, the delayed wavelets converging, the focus on the pad, the receptor cutaway, the moving spot. |
| 5 | Hands and joints anatomically correct | **Pass at native resolution.** Five digits; MCP, PIP and DIP in order; nails dorsal; flexion creases on the palm side; elbows bend the natural way. See the concerns below on stylisation. |
| 6 | No unnecessary repeats or filler | **Pass.** No composition is held static for more than 7 frames; every transition adds information. |
| 7 | Direction and continuity | **Pass.** The hand travels screen-left into the car match cut, matched in screen point, scale, pose and speed. The car fingertip and the lobby fingertip are matched too. The mechanism runs as one connected move: dive → section → crest → pad → cutaway. |
| 8 | Captions readable on a phone | **Pass** (phone-size sheet). Each shot has a caption zone clear of the action; nothing sits in the bottom UI band or the right-hand button column. |
| 9 | Last frame flows into the opening | **Pass.** Frames 933 → 0 continue one camera path, finger dip and pulse; the caption keeps its position (`qa/v1/loop_last22_first8.png`). The mean difference is 3.87/255, almost all of it the caption text changing. |
| 10 | No depiction of ultrasound making solid objects | **Pass.** The fist closes through the focus with no slowdown; nothing rests on air; every overlay is cyan or glowing. See `production/SCIENCE_NOTES.md`. |
| 11 | Effects never overpower narration | **Pass (measured).** Effects peak at −33.9 LUFS momentary against the voice's −12.6; everything is ducked under speech. |
| 12 | No black frames, missing assets, clipping, desync or pauses | **Pass.** 0 black frames; full decode clean; −1.6 dBTP; 0-sample lag; 934 of 934 frames. The longest gap between words is 0.36 s. |

## Measured QA

Evidence is in `qa/v1/`:

- `render_qa.json`
- `transition_bursts.png`: every cut, two frames before and three after
- `loop_*`
- `contact_every_0.5s.png`
- `hook_*`
- `final_asr.json`, `voice_stem_asr.json`

The largest frame-to-frame changes not at a cut are all deliberate camera moves:

- the 50° arc round the fingertip (frames 31–33);
- the pull-back to the medium shot (54–64);
- the ride up the converging crest (339–355);
- the move under the palm (454–456);
- the push-in before the car match cut (579–582).

## Remaining problems (honest list)

1. **Length.** 31.13 s, 0.13 s over target. Getting under 31 s would need tighter pauses (currently 0.30 s) or a
   shorter final hold.
2. **Not heard or watched in real time.** Pacing feel, the voice's energy on the first line, and how the effects sit
   are judged only from measurements and ASR.
3. **The near (left) arm in the low-angle card shot is large and plain** at the right edge of frame, and the card hand
   uses the rig's back-view hand, so it reads a little stiff.
4. **The fist is cartoon-simplified.** The curled index forms a squarish block, and the curled fingers are only
   partly visible behind the index in profile views.
5. **The car is functional, not rich.** The interior is simple flat shapes; the steering wheel is a ring seen
   edge-on; the near arm hangs large in the first second after the match cut.
6. **The receptor cutaway is small at phone size.** It reads as "receptors light up" but individual structures are
   not legible on a phone; there is only one label-free view.
7. **Modulation is shown at 4 Hz**, a visual slow-down of the real rate. This is noted in `SCIENCE_NOTES.md`; a
   pedant could call it out.
8. **The CONCEPT tag in the car is small** at its widest framing (about 28 px).
9. **Science references are from background knowledge** and were not re-verified online in this session (see
   `SCIENCE_NOTES.md`).
10. **The 3D is approximate.** The guesser and his hand are flat sprites in a figure plane inside a perspective lab,
    so camera yaw is kept within about ±30°. Within that range no error was visible on the sheets, but it is an
    approximation.

## Rebuild

```sh
cd source && npm ci && cd ..
python3 tools/make_narration.py   # needs ASR models in /tmp/asr; run with FGW_GAP_CAP=0.30 FGW_TAIL=0.5
(cd source && npx esbuild ../tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c.cjs) && node /tmp/c.cjs audio/cues.json
python3 tools/make_audio.py mix
tools/render_resilient.sh mix exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4 source/out/frames_v1
python3 tools/qa_render.py exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4 qa/v1
python3 tools/transition_bursts.py exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4 qa/v1/transition_bursts.png
```
