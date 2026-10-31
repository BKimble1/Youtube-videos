# Myostatin V3: final revision report

**File.** `exports/FGW_Myostatin_V3_REVIEW_1080x1920.mp4`. **It is not published.** The source is composition
`MyostatinV3` and mix `mix_v3`. V2 is at commit `27ec6ab`, V1 at `80637db`.

**Narration.** The approved ElevenLabs master is unchanged, word for word and with the same timings. The runtime is the
same, 24.567 s.

## Measured (from the rendered file)

| Check | V3 |
|---|---|
| Format | 1080×1920, 30 fps, 737 frames, 24.567 s, H.264 + AAC 48 kHz; no decode errors |
| Unplanned single-frame jumps | none |
| Longest near-static run | 7 frames (0.23 s) |
| Narration in the final file (Whisper base.en) | the locked text; homophones only (brake/break, superhuman/super human) |
| Loudness | −14.0 LUFS, −1.6 dBTP. The voice sits 9.7–10.7 dB over everything else, except 5.5–7.8 dB in the twist and the ending, where the take itself is quieter. |
| Loop seam (mean abs. difference) | 52.8. The same tight framing at both ends; the muscle resets from huge to athletic and re-swells within 0.5 s. |

Evidence: `qa/v3/render_qa.json`, `qa/v3/final_asr.json`, `qa/v3/mix_measure_mix_v3.json`, and the contact sheets in `qa/v3/`.

## Changes, by section of the brief

**1. Hook.**
- Frame 0 is a tight view of the flexed arm.
- The muscle mass rises from 0.28 to 0.84 in the first 0.5 s, from the first frame at full speed (an ease-out). The sleeve stretches and its hem rides up.
- It is one continuous change of the same rig's soft-tissue profiles around a fixed skeleton, so no model is ever swapped.
- The camera tracks the swelling arm back and reveals his shocked face by 0.95 s.
- It then surges again on "protein", "WAY" and "bigger", and the camera closes on the biceps for the dive.

**2. Anatomy.**
- The head is the one fixed three-quarter design from V2. Both eyes sit inside the silhouette, the brows are attached to the brow ridge, and the jaw and hairline stay fixed.
- The torso and shirt are much less inflated (chest width 19 + 4m cm, was 19 + 9m).
- The arm profiles are muscular, not a smooth bump:
  - a peaked biceps, with a long rise and a steep fall to the crease;
  - a core shadow under its belly;
  - a two-headed triceps with its horseshoe onto the flat tendon;
  - a brachioradialis set high on the forearm;
  - deltoid caps.
- The shoulder, elbow, wrist and hand stay on one skeleton in every shot.

**3. The science as cause and effect.**
- **Brake on.**
  - The camera passes through the swelling biceps into the fibre, where new myofibrils zip in.
  - Myostatin docks in the receptors on "myostatin", and signals run to the nucleus.
  - On "brake", the nucleus goes dark and assembly stops.
  - Building blocks still arrive, but they are visibly knocked back off the membrane.
- **Brake off.**
  - On "But some animals", a match cut keeps the same view: a fibre whose receptors are empty.
  - It thickens fast, its membrane rising and falling outward, and shoves the neighbouring fibres apart.
- **The pull-out.** The camera pulls straight out through a window in the bull's shoulder, then through the bull's translucent muscle map, to the whole animal as the hide fills in.

**4. The animal reveal.**
- The compact, double-muscled Belgian Blue from V2 gets a new bovine head: a long flat forehead, a broad, deep, squared muzzle, a heavy jaw, and side ears under short horns.
- One continuous camera move:
  - the whole bull;
  - along to the double-muscled rear;
  - forward to the shoulder;
  - back out for the heavy step on "huge".
- It never holds.

**5. Ending: the contrast.**
- **The lift.** The oversized arm attempts a controlled curl and the weight barely rises, trembling.
- **The interior.** The camera pushes into the elbow interior:
  - each contraction makes the biceps bulge hard and its fascicles fire;
  - only a small, dim pulse of pull runs down the thin tendon to the radius, which barely turns.
- **Back outside.** He strains on "superhuman". On "without actually being super strong" the arm gives out and the weight settles back.
- **The loop.** He lets go and flexes. The camera lands on the same tight biceps view the film opens on, and the opening swell restarts the loop.

## Known weaknesses

- **The loop seam has a visible size reset.** In the tight shot the huge biceps returns to the athletic one in frame 0, which then balloons again. This was chosen over a scale-matched framing, which read as a different view.
- **The bull is stylised.** It is a graphic muscle map with cel shading rather than true bovine anatomy.
- **The seated wide shot (16–17.5 s) keeps the face small.**
- **No one has listened to it in real time.** This environment has no audio playback; it was checked by measurement and ASR only.
