# Real Web Fluid: QA report (24 Oct 2026)

Everything below was measured on the rendered files in `exports/`, not inferred from the source, unless it says so.
Raw results: `qa/review_qa.json`, `qa/review_sherpa.json`, `qa/motion_scan.json`, `qa/rig_qa.json`,
`qa/vis_check.json`, frame strips in `qa/strips/`, phone-size sheet with a Shorts UI mask in `qa/review_phone_ui_sheet.png`.

## Review cut: `exports/FGW_Real_Web_Fluid_REVIEW_1080x1920.mp4`

| Check | Result |
|---|---|
| Stream | H.264 High, 1080×1920, 30 fps, 952 frames, yuv420p, BT.709 tagged; AAC 48 kHz stereo ~317 kb/s; 31.74 s |
| Loudness (ffmpeg ebur128) | −14.6 LUFS integrated, LRA 3.6 LU, true peak −2.6 dBFS |
| Black frames (≥0.1 s) / freezes (≥1 s) | none / none |
| Keyframes | 66, max gap 0.5 s |
| Audio sync vs the mix | 0 ms offset, correlation 0.99997 |
| Narration vs the locked text: Whisper base.en (sherpa-onnx) | WER 0.03; only differences "mid-air" for "midair" and "80" for "eighty" (formatting) |
| Same: zipformer (sherpa-onnx) | WER 0.09; acetone→"acidone", British spellings, word joins |
| Same: Vosk small | WER 0.10; 22/26 caption windows match; the 4 misses are recogniser errors ("moscow coons", "is the new poll") that both sherpa models hear correctly |
| Picture jumps (frame-difference scan) | only at the five intended cuts: 5.30 (street→lab), 8.77 (lab→illustration), 16.57 (illustration→lab), 25.87 and 27.90 (in and out of the medium shot) |
| Rig (all 952 frames) | 0 issues: no over-stretched arms or legs, no foot sliding on planted feet |
| Her arms switching on or off while visible | only at the 25.87 and 27.90 cuts (intended); the right arm leaves frame before it is dropped at 8.47 |
| Loop | last frame → frame 0: nozzle and wrist device on the same screen point and diagonal (a deliberate change of setting) |

Frames were inspected from the MP4 at the hook, the 5.3 match cut, the cocoon push-in, the 16.55 scale cut, the medium shot and
the loop (strips above), and earlier across the whole film in contact sheets.

## Master: `exports/FGW_Real_Web_Fluid_MASTER_2160x3840.mp4`

Rendered natively at 2× (vectors, not upscaled) from the same composition and mix. Measured on the file: H.264 High,
2160×3840, 30 fps, 952 frames, yuv420p, BT.709; AAC 48 kHz stereo; 31.74 s; 41.1 MB; −14.6 LUFS, LRA 3.6 LU, true peak
−2.6 dBFS (identical to the review cut); no black frames or freezes; 66 keyframes, max gap 0.5 s. Frames at 0.5, 5.4,
12.8, 21.5, 26.5 and 31.6 s were extracted and inspected: same picture and captions as the review cut, at full detail.

## Unresolved defects and limits

1. **Nobody has watched it in real time with sound.** This environment has no display or speakers; the checks above are
   measurements and still frames. A real-time viewing on a phone is still needed.
2. **Duration 31.73 s, under the 32-36 s target.** The voice sets it (one take, not stretched); the extra 0.6 s is a tail
   after the last word.
3. **One voice take only.** A second take failed on the ElevenLabs workspace's credit quota, so there was no choice of read.
4. **Medium shot (25.87-27.87) is the weakest shot.** Her raised glove covers part of her face, her near sleeve is a large
   white wedge, she holds still for 2 s, and the strand and blade are small in frame. It exists so she is seen doing the
   lift; a side angle was tried and was worse.
5. **She is not drawn in the lab close-ups after 8.75.** At those distances her hands and arms would fill the lens, so only
   the nozzle she holds moves; her presence is the 25.87 medium shot. A viewer may notice a nozzle that moves by itself.
6. **Cocoon push-in, 8.28-8.45:** her gloved hand pulls back large across the top of the frame before leaving it (now an
   exit, no longer a sweep across the cocoon).
7. **The fiber flight (16.55-18.95) is slowed** for legibility relative to a real jet; it is an illustration choice, not
   real-time footage.
8. **At the 16.55 cut** the illustrated nozzle's taper does not exactly match the real nozzle's perspective taper (position,
   size and direction do match).
9. **Integrated loudness −14.6 LUFS** against a −14 target after AAC encoding (true peak −2.6 dBFS, so there is room to
   raise it 0.6 dB if wanted).
10. **References not available:** the "recent contact-lens Short" is not in this repository (only named in another
    episode's voice record), so nothing was reused from it; the Tufts news page could not be fetched (HTTP 403 through the
    proxy), so the facts rest on the other published reports listed in `SOURCE_NOTES.md`.
