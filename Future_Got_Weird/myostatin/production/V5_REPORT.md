# Myostatin V5: visual clarity, anatomy and storytelling pass

**File.** `exports/FGW_Myostatin_V5_REVIEW_1080x1920.mp4`. **It is not published.** The source is composition
`MyostatinV5` and mix `mix_v5`. Earlier versions: V4 at commit `72f3c8e`, V3 at `49f84fe`, V2 at `27ec6ab`, V1 at `80637db`.

**Narration.** The approved ElevenLabs master is unchanged, word for word and with the same timings: 24.567 s.
Character, voice, story and style are as in V4.

## Measured (from the rendered file)

| Check | V5 |
|---|---|
| Format | 1080×1920, 30 fps, 737 frames, 24.567 s, H.264 + AAC 48 kHz; no decode errors |
| Unplanned single-frame jumps | none. Every large frame change falls inside a planned continuous zoom, plus the one cut, to the lab. |
| Longest near-static run | 2 frames (V4: 6) |
| **Loop seam: last frame vs frame 0** | **3.5 mean abs. difference** against a median frame-to-frame change of 7.0 (V4 was 4.6) |
| Audio loop seam | last sample to first sample: a jump of 0.0001 |
| Narration in the final file | Whisper base.en returns the locked text with homophones only (brake/break, superhuman/super human). Zipformer adds a misspelling of "myostatin". |
| Loudness | −13.6 LUFS, −1.6 dBTP |

Evidence: `qa/v5/render_qa.json`, `qa/v5/final_asr.json`, `qa/v5/mix_measure_mix_v5.json`, and the contact sheets in `qa/v5/`.
The loop strip is `qa/v5/loop_seam_last3_first3.png`.

Fixed during QA. A first full render showed two pops inside planned moves, and both were fixed before this file was made:
- **15.27 s.** The cross-section's neighbouring fascicles appeared in a single frame. They now fade in as the bundle turns.
- **23.23 s.** The camera jumped, and the bench, weight, background blur and arm size changed in the same frame as the hand-over to the opening's clock. The camera now glides from the curl framing to the opening's start, and the props, blur and size all carry through.

## 1. Opening geometry

- **Rebuilt shoulder.** The upper arm used to close with a straight chord at the shoulder, under a square-ended sleeve. That caused the blocky look. Now a rounded deltoid cap (an elliptical arc that grows with the mass) closes the arm's silhouette, so the outline runs from shoulder to biceps without a corner.
- **Rebuilt sleeve.** The sleeve wraps that cap, with an inked outline and an armhole seam. Its hem bows over the swelling muscle. The tear seam is drawn only when there is a tear.
- **Softer detail.** Muscle definition is softened by a slight blur, the elbow overlay disc is gone, and the veins come in late and faint.
- **One rig, no overlaps.** The torso build is constant and only the arm changes, so the arm never separates from or crosses the torso.

| Time (s) | What happens |
|---|---|
| 0.00–0.25 | The flexed arm is already expanding (the mass starts rising just before frame 0). |
| 0.25–0.80 | Rapid enlargement: the biceps balloons and the sleeve stretches, its stitches straining. His face goes from a proud look to shock: brows up, eyes wide, mouth open. |
| 0.80–1.40 | The camera closes on the swelling biceps. The framing stays on the muscle and his face; it never pulls back to the upper-left shoulder. His shock turns to a grin. |
| 1.30–1.85 | A window opens in the skin and one continuous zoom goes through it into the fibres. |

## 2. Micro: two different visits, one signalling story

**Visit 1** shows what myostatin is: a signal that limits muscle growth. There are no brake icons or diagrams.

| Time (s) | Event |
|---|---|
| 1.85–3.90 | Between recognisable fibres, with far fibres seen through the gaps and soft near fibres passing the lens. The camera settles on one fibre. Its nucleus streams amber building material to the myofibril being assembled, and the fibre widens ("WAY bigger"). |
| 4.05–5.35 | One myostatin molecule, drawn larger with a halo, comes in from deep between the fibres. The camera follows it to the one highlighted receptor (only three receptors are shown). |
| 5.35 | It binds. The camera pushes in on the receptor. |
| 5.50–6.35 | The signal: pulses run from the receptor through the cell to the nucleus. The camera pans with them. The nucleus dims, its stream stops and assembly stops ("brake"). |
| 6.45–7.25 | The fibre pushes to thicken twice and is held back each time ("on muscle growth"). |

**Visit 2** (after the lab) is a different visual. It is framed close on one receptor, with nothing binding it.

| Time (s) | Event |
|---|---|
| 14.20–14.62 | Two myostatin molecules approach. Antibodies from the treatment catch each one before it reaches the receptor; the second catch is on "block". |
| 14.62 | The receptor stays empty, the nucleus brightens and its stream resumes. |
| 14.92–15.28 | The bundle turns end-on, and its fibres keep thickening. |
| 15.25–16.30 | The camera follows the thickening fibres outward: from the muscle cut across, out through a window in the character's biceps, to his enlarged arm. |

## 3. The cow transition

| Time (s) | What happens |
|---|---|
| 7.20–7.85 | On "But some animals" the camera travels down, in one move, through a thick sheet of connective tissue into another muscle. Its fibres are much larger and no signal reaches them: born without the brake. They thicken fast. |
| 8.55–9.60 | One zoom pulls out through the tissue and a window in the shoulder of a heavily muscled Belgian Blue. The hide fills back in over its muscle map, and the full animal stands in its field. |
| 9.6–12.5 | Subtle natural action: a slow shift of weight, a turn and nod of the head, and breathing. On "huge" a heavier shift loads the shoulder, with a hoof sound and dust. |

## 4. Lab rebuild

- **Staging.** A new scientist stands behind a recognisable bench, in three-quarter view. The bench top crosses the coat at waist height: the torso is drawn behind the bench, the arms in front of it. Both shoulders join the torso.
- **The syringe grip.** The far hand grips the syringe barrel, fingers wrapped around the front with the thumb up on the plunger. The syringe is in front of the body and above the bench top, and nothing clips.
- **The other hand.** The near hand steadies the dish.
- **The action.** She leans in and presses the plunger, the barrel level drops, and a drop of treatment forms at the needle and falls onto the sample, with a ripple and a glow.
- **The camera.** It tracks the action, down from the wide shot to her hands, then approaches the sample and goes into it (13.62–14.20) for visit 2.

## 5. The narrative chain

growing arm (0–1.4) → inside the muscle (1.85) → the myostatin mechanism (4–7.2) → a far larger animal muscle (7.5) → the cow (9.6) → the lab (12.5) → blocked signalling (14.2) → the enlarged human muscle (16.3) → the strength demonstration (16.9–22.9) → the opening (loop).

There is one hard cut: to the lab, on "Scientists". Every other change of scene is a single continuous camera move between linked spaces, and none of them is a random zoom.

## 6. Strength reveal

- **Confidence.** Coming out of the biceps on "But here's the weird part", he smiles.
- **The grip.** He grips the dumbbell at 16.9 s.
- **Strain.** Through the controlled curl his teeth are gritted and his head tilts. The weight trembles and barely rises, and the elbow rotates by only a little.
- **Inside the elbow.** Each contraction makes the biceps bulge while only a faint pulse runs down the tendon and the bone barely turns.
- **Disappointment.** The weight sinks back (22.4–22.9). His brows knit, he looks down, and the pump goes out of his arm.

## 7. The loop

- **He looks at his arm.** In his disappointment he looks at his arm and raises it into the flex. His face meets the opening's proud look, and the camera approaches the arm.
- **The opening's clock.** From 23.2 s the arm's size, its pose, his face and the camera run on the opening's own clock, at t − 24.567 s. The arm begins expanding in exactly the opening's position, silhouette, framing, background and direction.
- **No break.** There is no fade, no black frame and no reset.
- **Sound.** The opening swell starts under the last 0.55 s, and the music's period divides the film's length.

## Known limits

- **Tiny fibres in the dish zoom.** The fastest zoom, into the dish sample (about 0.6 s), passes briefly through a scale where the fibres are only a few pixels thick and read as fine stripes.
- **The cow's translucent anatomy view** is only seen during the pull-out. The cow is the same stylised Belgian Blue design as in V4.
- **2.5D micro views.** They use parallax layers, with a true 3D projection only for the bundle's turn. The cow and the lab are stylised 2D.
- **Caption over his face.** As the camera dives toward his elbow (about 18.1–18.3 s), his head passes under the top caption for a few frames.
- **No one has listened to it in real time.** This environment has no audio playback; the sound was checked by measurement and ASR only.
