# MouthPad V5: final polish and verified HD export

**Publish file:** `release/FGW_MOUTHPAD_V5_FINAL_PUBLISH_1080x1920.mp4`

- **SHA-256:** `cc5bbbde4640c2938e15f29ce697b56d2c6143123dca91976e4230998cae4c7a`
- **Size:** 19,075,620 bytes
- **Untouched download:**
  https://github.com/BKimble1/Youtube-videos/raw/claude/mouthpad-short-v1-iskzy3/Future_Got_Weird/mouthpad/release/FGW_MOUTHPAD_V5_FINAL_PUBLISH_1080x1920.mp4

The file is committed as a plain Git blob. The link above was downloaded and checked: the SHA-256 matches and the
file is 1080 × 1920.

## 1. Verified resolution and frame rate

**Exact render command** (from `Future_Got_Weird/mouthpad/`):

    tools/render_final.sh MouthPadV5 mix_v5 exports/FGW_MOUTHPAD_V5_FINAL_PUBLISH_1080x1920.mp4

That script runs these steps:
1. `tools/render.sh`: `npx remotion render src/index.ts MouthPadV5 <frames> --sequence --image-format=jpeg --jpeg-quality=95 --props='{"audio":false}' --concurrency=4` writes 957 full-size frames.
2. `ffmpeg -framerate 30 -i element-%03d.jpeg -i mix_v5.wav -map 0:v -map 1:a -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -c:a aac -b:a 320k -ar 48000 -shortest <out>` encodes them. There is no scale filter.
3. The delivery gate `tools/verify_export.py <out> 957` runs last. The file gets its final name only if every check
   passes; otherwise it is renamed `*.REJECTED.mp4` and the script exits non-zero.

**ffprobe on the publish file** (`qa/v5/ffprobe_final.txt`):

| Field | Value |
|---|---|
| codec_name / profile | **h264** / High |
| width × height (coded: same) | **1080 × 1920** |
| sample / display aspect | 1:1 / 9:16 |
| r_frame_rate / avg_frame_rate | **30/1** / 30/1 |
| nb_frames | 957 |
| pix_fmt | yuv420p (BT.709) |
| video bit rate | 4.52 Mb/s |
| audio | **aac** (LC), 48 kHz, stereo, 260 kb/s |
| duration | 31.900 s |

**Gate result** (`qa/v5/verify_export.json`): all checks PASS.

The gate also proves the picture is native, not enlarged. Each sampled frame is shrunk to 512 × 910 and enlarged
back to 1080 × 1920, then compared with the original:
- **V5:** 33.5–38.2 dB. Detail is lost in the round trip, so the picture holds more detail than 512 × 910 can.
- **Control 1:** the gate was tested against a 512 × 910 copy, which it rejects on dimensions.
- **Control 2:** it was also tested against that copy enlarged to 1080 × 1920, which it rejects on detail
  (43.6–47.4 dB).

## 2. Root cause of the "512 × 910" exports

The project never rendered at 512 × 910. Every step was checked:

| Checked | Finding |
|---|---|
| Remotion composition | `MouthPadV5` (and V1–V4) is registered with `width={1080} height={1920}`, 30 fps, 957 frames (`source/src/Root.tsx`) |
| Remotion config | `source/remotion.config.ts` sets no scale, no output size and no codec override |
| Render command | No `--scale`; Remotion writes 957 frames, each 1080 × 1920 (checked on the frames) |
| Encoding / post-processing | One ffmpeg encode with no `-vf` and no scale; nothing runs after it except the checksum and the gate |
| Vector assets | Everything is SVG drawn in the 1080 × 1920 composition space; no raster image is scaled up (the only rasters are the JPEG frames themselves, at full size) |
| Files on disk | ffprobe on the V1–V5 masters, their backup parts and the GitHub download: all 1080 × 1920 |

512 × 910 is exactly 1080 × 1920 scaled to a width of 512 (1920 × 512 / 1080 = 910.2). That is the signature of a
preview transcode made after delivery. The copies you measured were almost certainly the app's reduced inline or
preview version of the attachment, not the master. None of those copies reached this environment (the uploads
folder was empty), so their bytes could not be compared directly.

**What changes now:**
- The gate makes a wrong-size or upscaled export fail before delivery.
- The publish file is also in the repository at the GitHub link above, which serves the exact bytes.
- A ZIP is attached alongside the MP4; previews cannot transcode a ZIP.
- Whatever copy you use, check its SHA-256 against the one above. If it differs, it is not this file.

## 3. Exact animation changes (V4 → V5)

Everything else is pixel-identical to V4. A frame-by-frame comparison of the two files found changes only in frames
**261–299** and **367–474**.

**Cut-away tongue (8.7–10.0 s, and the same drawing in the press demo, 13.8–15.8 s), `source/src/v5/section5.tsx`:**
- **Redrawn profile:**
  - The tongue body now rests lower, inside the lower teeth, so the teeth stay visible.
  - The convex dorsum bends smoothly up into a tapering blade.
  - The tip is **rounded**; V4's was a blocky, squared end.
- **Contact:** the top of the tip now meets the **underside of the gold pad** exactly at the contact point (0.15 mm
  below it). On a click it flattens slightly against the pad. In V4 the tip aimed at the palate line, so it cut into
  the pad's drawing.
- **Motion:** the lift is eased, so the tip slows into the contact. The root and body never move, so the outline
  cannot pop. The point count and order are fixed, and every point interpolates between the rest and contact poses.
- **Unchanged:**
  - the device stays anchored to the palate, at the same position and timing as V4;
  - teeth, lips and the cut-away;
  - the timing (contact on "roof", and on "CLICK" in the press demo).

**Head aim (12.0–13.9 s), `source/src/v5/play5.ts`, `source/src/v5/cast5.tsx`:**
- **Bigger head roll:** ±16° in V4, now 22° to the left and 14.7° to the right.
- **Same curve for head and crosshair:** the crosshair is driven by the same curve, normalised to the new peak, so
  it travels exactly as far as in V4. It still sweeps left with the head, then right onto the target, and locks.
- **Eyes lead the aim:** his eyes look the way he is aiming.
- **Unchanged:** the facecam layout, the game, the target and all the timing.

## 4. Narration and audio

**Unchanged.** `mix_v5.wav` is a byte-for-byte copy of the approved V4 mix (`cmp` identical). The picture's sound
cues for V5 are identical to V4's, so nothing needed retiming.

The final file, transcribed back:
- **whisper:** WER 0.04, spelling differences only ("mouth pad", "touch pad");
- **zipformer:** WER 0.059, with the same spellings plus "vitio" for "video";
- both match the dry narration exactly.

Loudness is −14.0 LUFS integrated, −1.49 dBTP. Captions are unchanged: the same style and timing, with 0 mismatched
word frames.

## 5. Final frame-continuity review (of the freshly rendered file)

@@REVIEW@@

## 6. Remaining issues that would prevent publishing

@@BLOCKERS@@
