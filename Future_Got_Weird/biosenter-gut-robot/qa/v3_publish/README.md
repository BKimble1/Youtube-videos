# V3 publish export: verification

**File:** `exports/FGW_BIOSENTER_GUT_ROBOT_V3_PUBLISH_1080x1920.mp4`

- **Commit:** rendered from the approved V3 source, commit `2f04767`, with no source changes. The composition
  `BiosenterV3` is 1080×1920 at 30 fps.
- **Source:** vector SVG; the project contains no raster image assets. No 512 or 910 value appears anywhere in the
  source or render tools.

| Check | Result |
|---|---|
| ffprobe (`ffprobe.json`) | H.264 High, **1080×1920** (coded 1080×1920), SAR 1:1, DAR 9:16, yuv420p, **30/1 fps**, 789 frames, **26.300 s**; AAC-LC, 48 kHz stereo |
| Borders (`cropdetect.txt`) | `crop=1080:1920:0:0` on every frame |
| Compared with the approved V3 FINAL | SHA-256 identical (`02544f16…`). All 789 decoded frames identical (PSNR ∞), and the decoded audio identical |
| Narration (`asr.json`) | Whisper WER 0.000 |
| Text sharpness (`text_crops_native_1x.png`) | Native 1:1 crops of a caption and of "6+ FEET": crisp edges |

**Conclusion.** The approved V3 FINAL was already a native 1080×1920 file. A 512×910 copy can only be a preview
transcode made by whatever app delivered or displayed it.
