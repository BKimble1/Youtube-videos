# Infrared Contacts V1: QA report (22 Oct 2026)

All measurements are of the **rendered files**, not the source. Data is in `qa/v1/`.

## What was and wasn't possible

- **No audio playback or real-time video playback in this environment.** Nobody has watched it with sound. Pacing,
  voice warmth and the mix were judged from measurements, ASR and frame strips. That is the first human check needed.
- The two USTC pages and the paper DOI were blocked by the egress proxy. The claims were checked against the Cell
  Press release (EurekAlert) and Physics World / Review of Optometry coverage (`SOURCE_CLAIM_LEDGER.md`).

## Review export: `exports/FGW_Infrared_Contacts_V1_REVIEW_1080x1920.mp4`

| Check | Result |
|---|---|
| Stream | H.264 High, 1080×1920, 30 fps, 891 frames, bt709, yuv420p; AAC 48 kHz stereo at about 317 kb/s; 16.4 MB |
| Duration | 29.70 s (container 29.717 s) |
| Keyframes | 60, at most 0.5 s apart |
| Loudness | −14.5 LUFS integrated, LRA 5.3, true peak −2.3 dBFS |
| Voice vs everything else (400 Hz–5 kHz, during speech) | +15.5 dB (narration leads) |
| Black or frozen segments (≥ 1 s) | none |
| Audio vs mix | 0.0 ms offset, correlation 0.99996 |
| Transcript of the MP4's own audio (Whisper base.en) | identical to the approved narration: match 1.000. The ellipsis beat reads as "asleep while". |
| Speech start | 0.03 s (frame 0) |
| Captions | 23/23 cue windows transcribe to their caption text |
| Motion scan (frame-to-frame change, 135×240 grey) | mean 5.9; no one-frame spikes. Largest change is 34.7 at 29.2 s, the deliberate final push into the loop framing. |
| Loop seam | last → first frame mean change 23.1: a cut-in on the same eye at the same screen position and scale, from closed to open with the finger arriving. This is a motivated match, not a seamless loop. |
| Metadata | encoder tags only; nothing identifies the owner |

### Defects found and fixed before this render

1. **Finger blended into the face at ECU.** Gave the finger its own warmer gradient and a light contact shadow.
2. **The closed-eye flash circle covered the closed eye.** It now sits above the eye, tied to it by a tail, so the shut
   lid and the flash are both visible.
3. **Face framing at 2.5 s cropped the nose.** Reframed.
4. **B labels clipped at the right edge, and D labels in the Shorts action column.** Labels are now clamped clear of
   both.
5. **Light packets too small at phone size.** Scaled 1.3–1.6× per scene.
6. **The E conversion spark was too pale on the light lens.** Made it a saturated green burst with a ring.
7. **The E flash circle lingered as a black disc for about 0.4 s.** The flash is longer and the circle closes sooner.
8. **The camera stopped dead at 9.7 s** (end of the push into the lens; the change dropped 16 → 0 in one frame). The
   easing is now continuous.
9. **Pull-back at 14.0 s and final push at 29.2 s were too fast** (peaks 36 and 43). Started earlier, with gentler
   easing (peaks now 30 and 35).
10. **The E flash had a 2-frame attack** (spike at 22.3 s). Every flash now has a 0.1 s sine attack, so nothing strobes.
11. **No visible marker for the particle the explanation follows.** Added a dashed ring from the end of the push until
    emission.
12. **The bystander was cropped in the wide shot.** Widened the frame (zoom 1.04).
13. **The tear film between lens and cornea rendered as dark air** at material scale. It is now filled.

## Checklist against the brief

| Requirement | Status |
|---|---|
| Approved narration verbatim, starting immediately | Yes (ASR 1.000; first word at 0.03 s) |
| Closed-eye flash contradiction within the opening seconds | Lid closed by 2.80 s; flashes at 3.40 and 4.00 s |
| Contact on the eye surface, under the closed lid | Yes (exterior and section) |
| Particles embedded in the lens; conversion there | Yes. Conversion happens at the particle in the lens, after the lid. |
| Consistent light language | Amber dashed = infrared, warm white = ambient visible, green = converted |
| Closed-eye perception shows only diffuse flashes | Yes. No image, face or text is seen. |
| Particle → eyelid with no exterior detour | Yes: one continuous pull-back |
| Scale changes keep position and direction | One spatial model; light always arrives from the right |
| Final signal aimed at the recipient; bystander unaware | Yes. The infrared channel shows only as an overlay; the reader keeps reading. |
| Loop | A cut-in on the same eye framing; no outro and no added speech |
| Captions readable, clear of the eye and the UI | Band centred at y=1450; checked on the phone sheet with the UI mask |

## Remaining issues (honest list)

- **Runtime is 29.7 s,** just under the 30–35 s target. The approved words in the selected take run 28.9 s at about
  193 wpm. I added a single 0.22 s beat rather than slowing the read.
- **Visual simplifications:**
  - The diagram opens the eye by sliding the lid and lens layers away for the ordinary-eye comparison (B), and slides
    them back (C, D). It is a diagram convention, not a depicted action.
  - Particle size and lens thickness are enlarged for explanation.
- **Body animation in the train shot is minimal.** The bodies are cutout poses with breathing, a head settle, the
  sender's arm raise and thumb presses, and a page turn. The near sleeve of the lead reads a little flat in the face
  shot (1.5–2.6 s).
- **The opening frame starts with the eye open.** The loop's last frame has it closed, so the join is a cut, not a
  seamless loop.
- **Needs a human:** listen with sound at normal speed, and listen to the last line's conspiratorial tone and the
  carriage ambience level.
