# Flying Skateboard V4: QC report

**File:** `exports/FGW_Flying_Skateboard_V4_REVIEW_1080x1920.mp4`.
- Measured with `tools/qa.py`; results in `qa/v4_review_qa.json`.
- Every sheet in `qa/v4_review_sheet_*.png` is made from the MP4.
- The whole film was also inspected from the MP4 at 0.25 s intervals (144 frames) and at the brief's beat times.

**Status: REVIEW, not final.** The frame-by-frame visual QC below passes, with the residuals listed at the end. There is no playback in this environment, so nobody has watched it in real time or listened to it. Mark it final only after one real-time viewing on a phone, with sound.

## Specs (measured from the file)

| | |
|---|---|
| Video | H.264 High, **1080×1920 decoded**, 30/1 fps, yuv420p, BT.709, 1077 frames, 35.90 s |
| How it was made | Rendered natively at 2160×3840, then downsampled with Lanczos (not an upscale) |
| Audio | AAC 48 kHz stereo, −14.02 LUFS, sample peak −2.45 dBFS. Voice −17 LUFS, 15.0 dB above music and effects in the speech band. |
| Decode / black frames / freezes over 1 s | Clean / none / none |
| Loop junction (last frame against frame 0, mean absolute difference) | 3.12, against a median frame step of 6.51: smaller than an ordinary frame-to-frame change |
| Largest frame step | Frame 280 (9.33 s), the intended fan-to-jet-intake match on "But" |

## Brief priorities

| Priority | Result |
|---|---|
| 1. Opening 0–3.5 s | **Pass.** Frame 0: close and low on the rider over moving water, with board, fans and height readable at once. He tracks in, the board heaves and his knees take it. Low alongside the thrusters (no board rotation). A rider-focused pass over the gravel bar, then wide on the crossing toward the far bank, then into the explanation. |
| 2. Mechanism 3.5–9.3 s | **Pass.** One underside view for the count, one close propeller row, then the board above the water its air is roughening. The cut to the flat lands at the end of "downward", on the legs and board as the deck lifts under his feet, then the wide crane and the low-angle track. No repeated close-ups. |
| 3. Prototype failure | **Pass.** Spool-up and exhaust, heat haze, then the leak: drips onto the deck, a pool, vapour, ignition at the pool, the flame runs up to the fitting and along the line. It is contained, the fire goes out, and the scorch remains. The redesign appears in the same cradle on the same stand during one continuous camera move, then a board-position match to the field. |
| 4. Balance 16–25.4 s | **Pass.** Both feet planted in every frame. His body stays upright over his feet while the deck tilts under them, his knees and hips absorb it, and the tilts are small and damped, settling. Front three-quarter only on 38–42° lenses: legs separate, no merging into the deck, helmet, neck and torso consistent. The devices are consistent: the deck phone horizon, then the wrist readout from his own view, then a cut to the earbud as the cue arrives, then the correction. |
| 5. Payoff 26–31.8 s | **Pass.** Over the shoreline, a wide view over the open river with the far cliffs ahead, the gorge mouth as the destination, buoys passing at their own depth, and between the walls with the river beneath. About 5 m up, gentle banking. |
| 6. Ending 32–35.9 s | **Pass.** The rider is in every frame (no empty water). "YOUR PRICE?" sits below him, clear of him. It lands on frame 0's camera key with continuous velocity. |

## Anatomy and compositing (every major pose transition)
- Feet planted; ankles and knees bend without crossing.
- Arms attached; gloves keep one shape.
- Helmet, visor and earbud fixed to the head.
- No limbs pop in or out. The inventor was moved so he is never cut by a frame edge in the workshop.
- Captions never cover his face, feet or the deck (checked on every caption with the burned-in sheets).

## Remaining visual issues
1. **3.25–3.5 s:** at the widest point of the river reveal he is about 8 % of the frame height for about 0.3 s. That is intended for scale, but it is the smallest he gets.
2. **6.2–6.9 s:** the "blast air downward" framing puts the board in the top third, small, so the roughened water reads below it.
3. **13.6–14.1 s:** the jet plank and the electric board cross-dissolve in the same cradle. For about half a second both are semi-transparent over each other.
4. **The inventor is now out of frame during the fire** (V3 showed him flinching). He appears whole at the end of the redesign.
5. **25.85–26.34 s:** the overhead practice shot is a flat green field with little detail, and the rider is small.
6. **Accuracy (as in V2 and V3):** the river crossing and the canyon are one connected flight; the verified details say they were separate demonstrations. See `SOURCE_NOTES.md`.
7. **Board geometry** is reference-grounded on the reported specifications, not traced from footage.
