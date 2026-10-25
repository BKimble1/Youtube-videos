# Glass Climbing V1: QA report

Every number below was measured from the rendered files, not from the source, unless it says otherwise. Evidence is
in `qa/`. **Nobody has watched or listened to the film in real time.** What was inspected: still frames, contact
sheets, frame strips and a phone-size sheet read from the MP4; machine measurements of picture and sound; and two
independent speech recognisers run on the MP4's own audio.

## Review: `exports/FGW_Glass_Climbing_V1_REVIEW_1080x1920.mp4`

| Check | Result |
|---|---|
| Streams | H.264 High, 1080×1920, 30 fps, 1171 frames, yuv420p, BT.709 (primaries/transfer/matrix); AAC 48 kHz stereo, ~317 kb/s; 39.04 s |
| Loudness (ffmpeg ebur128) | -14.6 LUFS integrated, LRA 1.8 LU, true peak -2.9 dBFS (target -14 LUFS, ceiling -1.5 dBFS) |
| Black frames (≥0.1 s) | none |
| Freezes (≥1 s) | none |
| Keyframes | 85, max gap 0.5 s (GOP 15) |
| Audio sync vs the mix | offset 0.0 ms, correlation 0.99995 |
| Transcript, Whisper base.en (sherpa-onnx) on the MP4 audio | WER 0.008: one difference, "pressed" heard as "press" |
| Transcript, Zipformer (sherpa-onnx) | WER 0.025: "onto" → "on to", "grip" → "gripe" |
| Transcript, Vosk small-en (free recognition) | WER 0.084: "climb it" → "climate", "pull" → "put", "bend" → "been", "weight" → "wait" … (the small model's usual errors; the two stronger models hear the words correctly) |
| Caption windows vs Vosk words | 26/28 at ≥0.75 match; the two misses are the Vosk errors above, not timing (Whisper and Zipformer agree with the captions) |
| Motion scan (`qa/..._motion.json`) | mean frame change 6.55; every flagged spike lies on a planned cut (20, 80, 114, 132, 181, 535, 681, 768, 866, 905, 971, 1018, 1064); no run of ≥12 near-still frames anywhere (no arrive-hold-zoom); one high-change frame inside a shot, 792, see limitations |
| Loop seam | last frame → frame 0: mean absolute difference 37.7 (of 255), against 2.4-4.0 between the last frames; an editorial match cut (bench glass → bay glass), not a seamless loop; hand, pad and grip sit in the same screen place (`qa/strips/loop.png`, the seam pair was viewed) |
| Captions on a phone-size sheet with an approximate Shorts UI mask (`qa/..._phone_ui_sheet.png`) | all captions clear of the top bar, right-hand buttons and bottom title area; none on fingers, pad contacts, springs or the wedge/glass gap at the sampled frames |

### Fixed during this pass (found by the render)

- **Caption over a pad** (27.8 s): "letting you reach higher and repeat." covered the lower pad and hand. The phrase
  is split into "letting you reach" (a right-hand block, 26.7-27.3 s) and "higher and repeat." (top, 27.3-28.9 s); each
  was checked at 3-6 frame intervals across its window. The narration audio is unchanged (same SHA-256).
- **Wedge onset pop** (frame 267): the blades switched to their bent outline in one frame and showed a notch where a
  zero-length contact strip met the blade. The bent shape now grows out of the straight one with the load, and the
  strip's outline turns smoothly from the blade's tangent.
- **Glass colour jump and a hard horizontal edge in the release pull-out** (frames 786, 791-793): the nested micro
  section's glass and backing ended a fixed 2 mm from its rows, and the peel opened hundreds of pixels per frame at
  micron scale. The glass and backing now extend past the screen at every scale, and the left pad's release moved from
  frame 785 to 790 (still inside the word "releases", 781-799), when the camera has already pulled back. Rig probe
  after the change: worst hand-to-bar error 3.5 units, leg reach ≤0.95, strap stretch 1.00.

## Master: `exports/FGW_Glass_Climbing_V1_MASTER_2160x3840.mp4`

MASTER_RESULTS

## Remaining limitations

- **Stand-in voice.** Runway eleven_v4 preset "Benjamin", not the channel's ElevenLabs narrator (out of credits:
  128 remaining, 819 needed). Generated once, used as one take; two sentence gaps shortened (0.16 s and 0.12 s of
  silence removed), nothing stretched. The voice has not been listened to by a person.
- **Fast pull-outs read as abstract for a few frames.** The three scale bridges (into the tile at 204-226, out of the
  contact at 457-506, out of the release at 783-802) cover about three orders of magnitude in 19-29 frames; at the
  middle of each, frames show only large flat shapes (frame 792 is the sharpest of these).
- **Faint nub at the wedge tips** around frames 275-285 as the blades start to lie down (visible only in a crop).
- **Face briefly covered by the near arm** during two stand-ups (about 480-492 and 978-984): the rig's three-quarter
  construction puts the near arm across the face at that height.
- **Loop is a match cut**, not a seamless loop (bench background → bay background).
- **Section-view and scale cheats**, the springs schematic, the narrow wedge column and the illustrative bench are
  documented in `production/SOURCE_NOTES.md`.
- **Foot stirrups are not confirmed by a fetched source**; the film follows the brief.
- **Source facts come from search extracts** (the proxy blocked direct reads of PMC and Stanford pages).
- Not checked: real-time playback with sound, on a phone, by a person.
