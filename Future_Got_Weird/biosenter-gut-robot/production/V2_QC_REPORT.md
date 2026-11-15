# V2 technical quality-control report

All results below come from the **delivered file**, `exports/FGW_BIOSENTER_GUT_ROBOT_V2_REVIEW_1080x1920.mp4`, unless a
line says otherwise. The evidence is in `qa/v2/`.

## Format (ffprobe on the file)

- **Video:** H.264, **1080 × 1920**, square pixels (SAR 1:1, DAR 9:16), yuv420p, **30 fps**, 789 frames, 26.30 s,
  about 7.2 Mb/s.
- **Audio:** AAC-LC, 48 kHz stereo, about 260 kb/s.
- **Source.** Rendered from the vector source at native resolution: Remotion SVG frames at 1080×1920, then one x264
  encode at CRF 16, preset slow, BT.709. There are no borders and no scaling.
- **About the "512 × 910" input.** The V1 file in the repository is also a genuine 1080×1920 (ffprobe: 1080×1920,
  789 frames). A 512 × 910 copy was most likely a preview transcode made by the app that delivered it.

## Measured checks (`tools/qa_render.py`, `render_qa.json`)

| Check | Result |
|---|---|
| Full decode | 789 frames, **no errors** |
| Large frame-to-frame changes | Only the planned ones: 4 cuts (3.50, 16.83, 19.43, 21.15 s), the macro pull-back, the pig zoom, push-in and pull-back, the hook's push-in, the S5 pan and the scale pops. **0 unplanned.** The two V2 camera moves (hook push-in, S5 pan) are smooth eased curves (peak per-frame change 13.9 and 14.8, against a median of 2.05), with no one-frame jumps. |
| Near-static holds | Longest **12 frames** (0.4 s, at the pig reveal); V1's was 34 |
| Loop seam (last frame vs first) | Mean absolute difference **4.14**, against a frame-to-frame median of 2.05: an ordinary frame of motion |
| Narration transcribed from the MP4's own audio (`final_asr.json`) | Whisper base.en **WER 0.000**. Zipformer 0.013, its only difference being the spelling "travelled". V1's stray "if" (an effect heard as a syllable) is gone. |
| Caption keep-out, every frame (`tools/keepout.ts`, `keepout.txt`) | **Pass.** No caption covers more than 4% of the shot's focal moving part (actual: 0% everywhere) or more than 15% of the robot (worst 9.8%: the tail end under the opening caption) |
| Mix (`audio/mix/mix_measure_mix_v2.json`) | −14.0 LUFS, −1.6 dBTP. Master limiter at most 1.0 dB (V1: 4.2). Effects 18.1 dB and music 16.4 dB under the voice. Loop seam jump 0.0036. |

## Frame-by-frame inspection (looked at, not inferred)

**Sheets**, all from the MP4:

- `requested_timestamps.png`: 0.0, 0.5, 1.5, 2.5, 3.5, 5.5, 7.5, 9.5, 12.5, 15.5, 17.5, 19.0, 20.5, 23.5 and 25.5 s.
- `hook_0-3.5s_every_3rd.png`
- `macro_final_3.5-6.9s.png`
- `cycle_S3_7.5-11.6s.png`
- `tools_final_16.8-19.4s.png`
- `transitions_final.png`: every cut ±2 frames, the 3D → 2D handover, and the loop 785 → 2.

**Checked for:** intersecting geometry, detached objects, shape changes, scale, clipping through the wall, unrealistic
motion, text errors, occlusion, camera jumps, alignment, timing, and the loop.

**Defects found in the first V2 render and fixed at the code level before the final render:**

- **The macro's first 0.8 s was static.** The camera followed the sliding anchor. It now holds at the rest position,
  so the anchor slides in (`scenes/inside.tsx`).
- **The hook's head extension barely moved in frame.** The hook camera now trails the crawl at 45% speed for the first
  second (`scenes/tunnel.tsx`).
- **One frame (19.43 s) showed the lab caption over the tool shot.** The lab cut moved onto the caption change
  (`Film.tsx`).
- **The S5 pan and the hook push-in were brisk.** Both were lengthened.
- **Caption over the robot, from the keep-out check.** Over the lab robot's head: the lab was reframed. Over the tail
  during the loop convergence: the hook framing was lowered, and the final caption now clears 0.18 s after its word.

**Not performed.**

- No real-time listening: this environment has no audio playback. Audio sync was verified by alignment and ASR, and
  levels by measurement.
- No check against the paper itself: see `V2_SCIENCE_VERIFICATION.md`.

## Remaining issues to address before publication

1. **Science.** Confirm against the paper (chamber layout, scale geometry, which demonstrations were in pigs), and
   decide on the two flags: the sleeve colour, and the tag wording.
2. **Listen** on phone speakers and headphones: the balance of the pop accent, the spray hiss, and the music under
   the voice.
3. **The tool close-up's jaws and spray** are clear at full size but small on a phone. A slightly tighter crop would
   help if phone viewing shows them too small.
4. **The lab's controller box** sits at the frame's upper-left edge (partly cropped). This is a composition choice; it
   could be reframed fully in.
5. **The intestine diagram is schematic.** The coil is not to anatomical scale, and the stretch is about a quarter of
   the drawn coil, whereas 2 m is about 10–15% of a pig's small intestine.
