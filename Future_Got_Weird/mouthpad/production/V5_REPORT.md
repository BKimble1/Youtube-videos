# MouthPad V5: final polish and verified HD export

**Publish file:** `release/FGW_MOUTHPAD_V5_FINAL_PUBLISH_1080x1920.mp4`

- **SHA-256:** `9cb8d99d331f865f249914a21b5f08ade2ddd945b21892ec6bc48d464a040633`
- **Size:** 19,048,017 bytes
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
| video bit rate | 4.51 Mb/s |
| audio | **aac** (LC), 48 kHz, stereo, 260 kb/s |
| duration | 31.900 s |

**Gate result** (`qa/v5/verify_export.json`): all checks PASS.

The gate also proves the picture is native, not enlarged. Each sampled frame is shrunk to 512 × 910 and enlarged
back to 1080 × 1920, then compared with the original:
- **V5:** 33.4–38.2 dB. Detail is lost in the round trip, so the picture holds more detail than 512 × 910 can.
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

Everything else is unchanged from V4. A frame-by-frame comparison of the two files found visible changes only in frames
**257–299**, **362–474** and **720–723**. The pad-lattice clip and the lip-close fix change a few other frames too, but by less than the comparison's threshold.

**Cut-away tongue (8.6–10.0 s, and the same drawing in the press demo, 13.8–15.8 s), `source/src/v5/section5.tsx`:**
- **Rebuilt as a spine with a thickness profile, not a blend of two outlines.** V4's tongue (and the first V5 attempt)
  blended its outline points in straight lines between the rest and contact poses. That made a blocky square end,
  and a flat top and square corners partway through the rise.
- **Shape:**
  - The body rests low on the floor of the mouth, and its back never moves, so the outline cannot pop.
  - The blade tapers from the body.
  - The tip is a round cap: fuller at rest, slimmer when curled.
  - The inner side of the bend is limited by the bend's radius, cleaned of any fold and smoothed, so the crease
    stays a soft curve with no notches or ink spurs.
- **Natural bend toward the pad:** the blade curls in one smooth arc.
- **Contact on the glow frame:** the glow starts from the tip's actual arrival, so contact and glow fall on the
  same frame.
- **Precise contact:**
  - The tip comes up to the pad from directly below, so it cannot brush the pad's angled front on the way.
  - It first touches on the contact frame (with the glow), and the cap's end sits exactly on the pad's flat
    underside, so there is no gap.
  - After contact it slides back along the flat underside (V4 slid forward onto the pad's bend).
  - In the press demo, the partial lift now really hovers about 2 mm under the pad before the click.
  - The pad is rigid: V4's dent on a press is gone, and the tip squashes only slightly.
  - The section's device fades in over about 8 frames (V4: 4), with no colour step.
- **Pad drawing:**
  - The electrode lattice is clipped to the pad's outline; it no longer spills past the edge.
  - The split-screen contact disc is smaller, so it stays on the pad at both ends of the move demo.
- **Unchanged:** the device stays anchored to the palate, at V4's position and timing; the teeth, lips and cut-away;
  the timing (contact on "roof", click on "CLICK").

**Head aim (12.0–13.9 s), `source/src/v5/play5.ts`, `source/src/v5/cast5.tsx`:**
- **Bigger head roll:** ±16° in V4, now 22° to the left and 14.7° to the right.
- **Same curve for head and crosshair:** the crosshair is driven by the same curve, normalised to the new peak, so
  it travels exactly as far as in V4. It still sweeps left with the head, then right onto the target, and locks.
- **Eyes lead the aim:** his eyes look the way he is aiming.
- **Steady crosshair height:** the head moves the crosshair sideways only, and it does not climb as the head tilts.
- **Eyes:** they stay put until the head starts to move (no dip back to centre), and there is no blink during the aim.
- **Speed:** the right swing is slower, so it reads as a turn, not a whip.
- **No stall at the lock:** the crosshair begins settling onto the target during the right swing (0.22 s earlier).
  V4 stopped about 35 px short and then crept the rest of the way. The lock ring, and its sound, keep V4's timing.
- **Unchanged:** the facecam layout, the game, the target and all the timing.

**Glitches fixed from the V5 review:**
- **24.0 s:** Honest's beanbag slid about 80 px in the first 4 frames of the wide shot, because his reposition was
  still finishing. It now finishes off screen.
- **22.2 s:** a faint leftover of the mouth slit on the frame where the lips meet.

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
