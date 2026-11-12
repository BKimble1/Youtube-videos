# V4 final review: Doctors Grew an Ear Inside Her Arm

V4 is V3 with **only the opening replaced**. The ending changes only where the loop has to land on the new frame 0.

**Status.** A review copy, checked from the files. **It is not published.** It has not been watched or heard in real
time: this environment has no display or speakers.

## Deliverable

`exports/FGW_Ear_Forearm_V4_FINAL_REVIEW.mp4`

**Verified at true resolution** (`qa/v4/ffprobe.json`):
- **Picture:** H.264, coded and displayed at 1080×1920, square pixels, 9:16, yuv420p, 30/1 fps, 609 frames, 20.30 s.
- **Sound:** AAC 320 kb/s, 48 kHz stereo.
- **Size:** 14.8 MB. A full decode reports no errors.
- **Native frames:** extracted at 1080×1920 (`qa/v4/native_f0.png`, `native_f9.png`, `native_f25.png`,
  `native_f45.png`).

**Narration, timing, captions and mix** are V3's (V2 narration master and mix), unchanged.
- ASR on the V4 MP4's audio: Whisper 0 differences; Zipformer one spelling-only difference ("armskin").
- Loudness: −13.85 LUFS, −1.62 dBTP.
- Captions: same text, timing and heights.

## The new opening (0–3.6 s)

| Time | What happens |
|---|---|
| 0.00–0.30 | **Frame 0 is the ear in extreme close-up** (zoom 8.8) under the living forearm skin, sitting in the upper middle of the frame, clear of the caption. The camera creeps in a little and settles. The skin breathes with a faint pulse. |
| 0.30–0.85 | The camera pulls back while the **forearm rotates about the elbow** (up to −4°). The camera rides with the ear, so it holds its place and shape on screen. The rotation is rigid: no stretching or reshaping (V2/V3's cylindrical turn, which narrowed the ear, is removed). |
| 0.85–1.50 | Continuing back, the hand, elbow and her face come in. She lifts the arm slightly at the shoulder (−1.6°), turns her head a little toward it (+2.4°), and her eyes move down-right onto the ear. Her brows lift slightly and she blinks at 1.68 s. All rotations are rigid about the anatomical pivots (elbow, shoulder, neck), so no joint distorts. |
| 1.50–3.00 | A slow push toward her head with the arm still raised and the forearm ear in frame. The arm, head and eyes settle back to rest by 2.85 s. |
| 3.00–3.60 | The push carries on to the healed ear site as "She lost her ear…" begins. From 3.6 s (frame 108) it is V3's footage, so the missing ear is revealed on "ear" exactly as in V3. |

**Ear look (opening and loop only).** The V1-style macro relief is back, with added biological shading:
- warm blood colour deep in the folds;
- paler stretched skin along the rim;
- a soft contact shadow where the bump rises from the flat skin;
- fine tension creases around it;
- arm hair and skin texture at close range;
- a pulse locked to whole beats over the film, so it is identical at the loop seam.

These additions are switched off between 3.55 s and the final return, so V3's footage there is untouched.

## What else changed, and proof that nothing else did

**Loop.** The final return (from 18.8 s) now pushes on into frame 0's extreme close-up. The film ends moving in at the
same slow speed the opening creeps in with.
- The seam differs from the following frame essentially only by the caption change ("…right HERE." → "Doctors grew an
  EAR"). The picture matches (`qa/v4/loop_last_vs_first.jpg`).

**V3 vs V4** (`qa/v4/v3_vs_v4_per_second.txt`):
- **0–3.6 s:** new.
- **3.6–18.8 s:** unchanged.
  - Source frames 200, 300, 450 and 560 were rendered losslessly from the V3 commit and from V4: **pixel-identical**.
  - The encoded files differ there by ≤0.35/255, which is encoder noise.
- **18.8–20.3 s:** the loop landing.
- To keep this, the camera spline's tangents at 3.6 s and 18.8 s are pinned to V3's values, so the new keys cannot
  bend V3's camera path.

**Motion** (`qa/v4/frame_steps.txt`): no isolated frame jumps. The largest step is unchanged from V3 (24.7, the
chest-to-tray carry).

## Remaining issues (honest list)

1. **The opening pull-back is fast.** It goes from zoom 9 to 3.3 in 0.55 s, as the brief's 0.30–0.85 s window requires.
   It is a smooth, eased move with no jumps, but it is the most energetic camera move in the film.
2. **The reaction is subtle**: eyes, brows, a blink and a small head turn. There is no change of mouth or expression
   beyond that.
3. **The loop seam carries the caption swap** from the last line to the first. This is inherent to looping a captioned
   film.
4. **Not watched or heard in real time.**
