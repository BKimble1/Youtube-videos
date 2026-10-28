# Flying Skateboard V6: changelog (visual revision of V5)

**Unchanged from V5:**
- the approved narration (the same recording, sample for sample), its word timings, the caption text and story order;
- the score;
- the runtime (35.90 s, 1077 frames at 30 fps; the narration file's full length);
- the Weird Crew vector style, the rider and the board design (ten fans, one locked geometry).

The audio-to-timeline map and the transition list are in `production/V6_PLAN.md`. Code: composition `FlyingSkateboardV6`, `source/src/v6/`.

## 1. Opening, 0–3.4 s
- **The carve is gone.**
  - V5 banked the deck about 17° at 1.3–2.3 s while his legs and body barely changed: the board rolled under his feet.
  - V6 holds a straight, gently weaving line.
- **One balancing adjustment instead:**
  - At 1.35 s a gust rolls the deck about 4° toe edge down.
  - He is pushed toward his toes for a moment (anticipation), then his hips go back toward the heels, his knees load and his torso counter-leans. His arms counterbalance a beat later.
  - The deck comes back level with a small overshoot and settles by about 2.2 s.
  - It is driven by damped springs, so the parts move together with natural delays.
  - His body now rides partly with the deck (upright 0.45, was 0.75), so any deck roll shows in his legs, hips and torso together.
- **Forward travel within the first second:**
  - Channel buoys pass close by, and the gravel bar passes under him.
  - The river surface and the wash stream past.
  - The camera tracks steadily; there is no spin or shake.
- **Height:** the pull-back from 1.6 s shows his height over the water.
- **Feet:** both ankles stay on their planted points on every frame (`source/src/dev/footCheck6.ts`: 0.00 mm gap over all 892 rider frames, no knee bent backward).

## 2. Propulsion, 3.4–9.3 s
One dominant action at a time, as in V5:
1. the ten fans counted from below;
2. the rotors speeding up and the air streaming;
3. the air reaching and churning the water;
4. the full lift on the riverside flat, which completes before the cut.

## 3. Jet setback and electric change, 9.3–15.5 s
- **No fuel-leak cause.**
  - The reports say only that the combined test caught fire.
  - V5's weeping fitting, drips, pool and vapour are removed.
- **A short ignition at the centre engine:**
  - On "FIRE" it lights at the engine's base, climbs to the fuel fitting and runs back along that line (the affected equipment).
  - Warm light falls on the deck and casings, and smoke rises.
  - It dies down within about 0.8 s and leaves a scorch.
  - No explosion and no injury.
- **The design change carries the end of the scene:**
  - The electric board comes out of the smoke in the same cradle.
  - Its fans spin up, and their air blows the last of the smoke off the stand. V5 held a slow pull-back over a still board.
- **Sound:** the drip and vapour sounds are removed; the fans' air is added.

## 4. Balance and coach, 15.5–25.4 s (rebuilt)
One continuous practice session low over the pad (about 0.6 m), in distinct beats. His reaction delay shortens as he learns, from 0.42 s to 0.02 s. Every cut lands on its caption's first frame.

| Line | What happens | Camera |
|---|---|---|
| "one HUGE problem." | The board lifts. A toe-side roll grows by itself to about 6°. He catches it late (hips back, knees down, arms out) and it overshoots and settles. | Standing camera off the nose and toe side, so the roll reads as a tilt across the frame. |
| "The board can't balance itself." | The nose dips by itself (about 5°) and he sits back; it comes up past level and he leans in. | Standing camera square to his toe side, so the pitch reads. |
| "He has to control it" | A toe-side roll answered in his ankles, knees and hips. | Low and close on his legs and the deck. |
| "with his entire BODY," | A bigger heel-side roll answered by knees, hips, torso and arms; then a lean that carries the board forward. | One eased move back from the legs to the whole body (no cut). |
| "while an AI voice coach" | A steady heel-side error he can't feel. The deck phone, the sensor, shows it on its horizon. His wrist phone, the coach app, shows the same reading in amber while the coach speaks: a voice waveform in the earbud's cyan. | The deck phone from above, then his own view of the wrist. |
| "helps him learn" | The earbud pulses. He lowers his wrist, softens his knees and moves his hips over his toes, and the deck comes level. | Medium view, head to knees, from the earbud's side. Replaces V5's head-only close-up. |
| "how to balance." | A fresh gust, met at once: under 3°, quickly settled. | Standing wide. |

- **Devices:** only the reported setup appears: the phone in the board, the phone on his wrist and the earpiece. No floating panel, and the AI never moves the board.

## 5. Practice to flight, 25.3–27.6 s
- **One continuous move** replaces V5's take-off → overhead → bank → low-pass resets.
- **The move:**
  - Another morning, on the riverside flat.
  - He lifts off from rest with a small wobble caught at once, and accelerates toward the river.
  - He crosses the shoreline at about 27.1 s and climbs out over the water.
- **Continuity:** one steady low front three-quarter track, with the same side and screen direction as the opening.

## 6. River and canyon, 27.6–31.8 s
- **River:** the same flight seen from high off his side. The river opens up, with the far bank, the town and the bridge ahead, and the wash and shadow trailing.
- **Canyon: a separate place and demonstration.**
  - The river set no longer has a gorge cut into its far bank, so the crossing never leads into the canyon.
  - The cut on "and THROUGH a CANYON" joins the canyon flight deep inside the gorge, about 6 m up, in slightly warmer light.
  - It is tracked from behind, with both walls passing.

## 7. Question and loop, 31.8–35.9 s
- **One continuous crane** from high and wide over the Yangtze down to frame 0's low front three-quarter view while the question is asked.
- **The flight keeps evolving under the line:** he flies on over the water through a gust correction and its smaller echo.
- **"YOUR PRICE?"** sits in the sky above him during the question; the runtime is not extended.
- **The loop:** the crane lands on frame 0's camera key with the camera's velocity carried through the loop point, on the opening's own trajectory, pose and clock.

## 8. Sound (`tools/make_audio_v6.py`, cues `audio/cues_v6.json`)
- **Narration and score:** unchanged (the voice stem correlates 1.0 with the locked narration).
- **Effects:** re-cued to the V6 events and kept under the voice:
  - the gust and his answer;
  - the ignition at the engine, with no drips or vapour;
  - the fans clearing the smoke;
  - each balance beat;
  - the phones' ticks and the earbud chime on the cut;
  - the lift-off, acceleration and shoreline;
  - the cut to the canyon.
- **Levels:** −14.0 LUFS integrated, sample peak −2.5 dBFS, voice 15.3 dB above everything else in the speech band.

## 9. Export
- Rendered from the source composition at 2160×3840 and Lanczos-downsampled to a **true 1080×1920** H.264 master at 30 fps. No proxy and no upscale.
- `exports/FGW_Flying_Skateboard_V6_REVIEW_1080x1920.mp4`.
