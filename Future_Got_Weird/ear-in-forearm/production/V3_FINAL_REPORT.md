# V3 final review: Doctors Grew an Ear Inside Her Arm

V3 is a narrow polish of V2. The opening, shot order, narration, pacing, mix and ending are V2's.

**Status.** A final review copy, checked from the files. **It is not published.** It has not been watched or heard in
real time: this environment has no display or speakers.

## Deliverable

`exports/FGW_Ear_Forearm_V3_FINAL_REVIEW.mp4`

**Verified at true resolution** (`qa/v3/ffprobe.json`):
- **Picture:** H.264, coded and displayed at 1080×1920, square pixels (1:1), 9:16, yuv420p, 30/1 fps, 609 frames,
  20.30 s.
- **Sound:** AAC 320 kb/s, 48 kHz stereo.
- **Size:** 13.3 MB. A full decode reports no errors.
- **Native frames:** four frames were extracted from the MP4 at their native 1080×1920 and inspected
  (`qa/v3/native_f0.png`, `native_f280.png`, `native_f330.png`, `native_f430.png`).

**Narration and mix** are V2's, unchanged (`audio/narration/FGW_Ear_Forearm_narration_V2.wav`,
`audio/mix/FGW_Ear_Forearm_V2_mix.wav`). On the V3 MP4's audio:
- Whisper base.en: 0 differences from the locked script.
- Zipformer: one spelling-only difference ("armskin").
- Loudness: −13.85 LUFS integrated, −1.62 dBTP true peak.

## What changed (and only this)

**V2 vs V3, measured** (`qa/v3/v2_vs_v3_per_second.txt`, mean absolute luma difference per second):
- **0–7 s:** identical (0.00).
- **8–17 s:** the changes below.
- **17–20 s:** near-identical (≤0.4): only the finished ear on the head differs slightly, now 10 % wider and in the
  forearm skin tone it came from.

**1. Implantation (8.5–12 s).**
- The skin-pocket incision is now on the forearm's little-finger edge. So the carved cartilage, held by forceps, is
  only ever in the air beside the arm until it enters, and never lies on the skin.
- From the moment it arrives, one continuous local cutaway (feathered, see-through, with a skin-coloured layer kept
  over everything) shows only the part that is already inside. It appears as a soft pale glow under the skin.
- The skin relief drawn on top makes the ear shape: the skin conforms over the scaffold as it slides in.
- The forceps tips are hidden once they pass into the pocket.
- The same cutaway then shows the vessels growing in three steps, around the scaffold beneath the skin, and closes.
- The cartilage is never shown as a white object on the arm (V2's surface "white ear" is gone).
- See `qa/v3/implant_8-12s.jpg` and `native_f280.png` / `native_f330.png`.

**2. Transfer (12–16 s).**
- **Shape and size:** the flap margin is tightened (1.08× the ear outline, was 1.2×), so the lifted piece keeps the
  ear's own outline and size. Its lift scale is 1.05 (was 1.12), and on the head it is narrowed only to 0.88 for the
  three-quarter view (was 0.8).
- **Look:** the flap's definition grows gradually as it is lifted: the contour, the lobule and the bowl shading come in
  from the under-skin look, instead of switching. It keeps the forearm's skin tone.
- **Vessels:** the vessels it was raised on no longer hang from it (V2 showed stretched and dangling stubs). They appear
  only where they are reconnected, in front of the ear, each joined end to end and emerging from under the ear.
- **Tools:** the scalpel, the forceps and the needle holder are unchanged and slide in and out along their axes.
- See `qa/v3/transfer_12-16s.jpg` and `native_f430.png`.

## Kept from V2 (verified)

- **Opening:** the full forearm and hand with the ear on frame 0, then one push (`native_f0.png`). Identical to V2.
- **Ending:** the return to the forearm. The head is out of frame before the ear rises under the forearm skin again,
  and the film ends moving into the frame-0 composition at the opening push's speed.
  - Loop seam: 3.85, below the 4.64 mean frame step (`qa/v3/loop_last_vs_first.jpg`).
- **Motion:** no isolated frame jumps. The largest step is 24.7 (the deliberate chest-to-tray carry, unchanged from V2)
  (`qa/v3/frame_steps.txt`).
- **Consistency:** the same face, hair, gown, skin tone, hand and arm drawing throughout (one figure, not redrawn).

## Remaining issues (honest list)

1. **Small ear on frame 0.** About 70 px tall at a 390 px phone width until the push lands at 0.5 s (unchanged from V2,
   as requested).
2. **The carving on the tray is brisk** (about 1 s for three stages), set by the narration.
3. **The microsurgery cutaway is a soft oval window.** Its recipient vessel ends show a short gap before each join,
   which is intended (the ends are brought together and stitched).
4. **Not watched or heard in real time.**
