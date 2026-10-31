# Myostatin V6: substantial visual revision

**File.** `exports/FGW_Myostatin_V6_REVIEW_1080x1920.mp4`, rendered natively from the vector source at 1080×1920. Not upscaled. **It is not published.**
The source is composition `MyostatinV6` and mix `mix_v6`. Earlier: V5 at `3ab289a`.

**Narration.** The approved master is unchanged: word for word, same performance, same timings, 24.567 s.

## Measured (from the rendered file)

| Check | V6 |
|---|---|
| Format | 1080×1920, 30 fps, 737 frames, 24.567 s, H.264 + AAC 48 kHz; no decode errors |
| Unplanned frame jumps | none. Large changes fall only inside planned moves; the two hard cuts are to the lab and to the gym. |
| Longest near-static run | 15 frames (0.5 s): the deliberate hold after myostatin docks |
| Loop seam, last frame vs frame 0 | 3.0 mean abs. difference, against a median frame change of 2.9: the same as one ordinary frame step |
| Audio loop seam | a jump of 0.0001 |
| Narration in the final file (Whisper base.en) | the locked text, except brake/break (a homophone) |
| Loudness | −13.9 LUFS, −1.6 dBTP |
| Visible text | captions only. The antibody glyphs were removed from the syringe; there are no labels, numbers or signage anywhere. |

Evidence: `qa/v6/` (render QA, ASR, mix measurements, contact sheets, the loop strip).

## What changed

1. **Opening.**
   - Tight on his face and the flexed biceps, which is already big, with no backward camera move.
   - 0.04–0.62 s: the biceps' silhouette swells. Only the muscle profile grows; the elbow and shoulder joint stay fixed, and the shoulder stays rounded. The forearm bulge is reduced so it can't read as a second biceps.
   - His eyes follow the swelling, his brows rise, then delighted disbelief: wide eyes, raised brows, an open grin.
   - One forward move toward the muscle. From 0.84 s the skin thins away softly from a point on the biceps, revealing its own fibre bundles. The reveal spreads into the full frame, and we are inside by about 1.5 s. The circular inspection window is gone.
2. **The first muscle explanation, rebuilt.**
   - Removed: the old grid, scattered receptors, specks, purple oval and rotating object.
   - New: one bundle of six broad, clean longitudinal fibre strands, with restrained cross-striations and dark open fluid around it.
   - 1.5–4.2 s ("WAY bigger"): the bundle thickens and its boundaries spread toward the frame edges. No molecular detail appears yet.
   - On "It's called MYOSTATIN" the camera closes on the surface. One large pink two-lobed protein appears beside it, along with one socket-shaped receptor set into the membrane.
   - The membrane keeps rising as the fibre grows. On "BRAKE" the protein's two lobes seat into the socket's two dips. The expansion then slows and stops, and the stopped state is held.
3. **The cow, as a transformation.**
   - The bundle's curved crest dissolves into the cow's withers line, then the camera pulls out to the whole animal.
   - The cow was repainted with matte, organic shading under a blue-roan coat; the plated contours and metallic highlights are gone. The horizon was raised to cut the empty sky.
   - The cow starts with an ordinary build and lifts its head. On "their muscles grow" (10.05–10.68 s, 0.63 s) the shoulder thickens, the hindquarters broaden and round out, and the neck gains a crest. The belly line, head, skeleton, hooves and ground contact stay unchanged.
   - Soft muscle separations appear as the muscle develops. After it lands, the cow shifts its weight and takes one heavy step, and the camera moves in on the shoulder and quarters.
4. **The drug scene.**
   - A brief, coherent scientist shot: her torso behind the bench, her arms and gloves in front, the syringe gripped above the bench. She dispenses one drop onto a muscle sample, and the camera goes into it.
   - Inside is the same muscle environment, the same pink protein and the same receptor. One teal inhibitor (a hub with two arms) closes around the protein on "block".
   - The pair bumps the socket's rim, cannot seat, and drifts away. The receptor stays empty, and the fibre visibly thickens as the camera pulls back.
5. **The ending.**
   - The elbow cutaway is gone.
   - On "But here's the WEIRD part" he is already gripping. He sits up, gives a confident glance and takes a breath.
   - On "Bigger muscles…" comes one continuous curl: a quick start, then slowing, then a near-stall under concentrated strain, then a disappointed glance at his biceps. The hand stays on the handle and the dumbbell keeps the same size; there is no tremor bounce.
   - He lowers the weight and raises the arm into the flex ("looking SUPERHUMAN").
6. **The loop.**
   - From 21.9 s the arm, face and camera run on the opening's own clock. The arm is the same size as at frame 0 throughout the strength scene, so nothing shrinks.
   - The camera closes into the exact opening framing, and the last frame continues into frame 0. The opening swell's sound starts under the last 0.55 s.
7. **Sound.** A new V6 cue block:
   - a low organic stretch that follows the bundle's growth;
   - a soft click when the protein docks;
   - a wind-down as growth stops;
   - the cow's deep swell, then its heavy step;
   - the inhibitor closing, a dull no-fit knock, and growth resuming;
   - the curl: grip, breath, strain, exhale.

## Checked frame by frame

These were reviewed on contact sheets and frame strips, at full and reduced (phone-like) size, with captions on and off:
- the shoulder and facial perspective through the swell;
- the reveal;
- docking;
- the cow's legs and ground contact through the transformation and the step;
- the scientist's hands;
- the dumbbell grip;
- the loop seam.

The five caption-free readings:
1. The arm grows.
2. The docked protein stops further growth.
3. The cow develops larger muscles.
4. The inhibitor stops docking.
5. The big arm still struggles with the weight.

## Known limits

- **Review method.** No one has watched it in real time. This environment has no video or audio playback, so review was by frame sequences, measurement and ASR.
- **Cow framing.** The cow is a side view in a portrait frame, so it fills about a third of the frame's height.
- **The reveal.** In its first instant (around 0.9–1.1 s) it reads slightly as a dark opening, because of the fluid between bundles, before it spreads into fibres.
