# Flying Skateboard V6: plan, audio map and transition list

V6 is a visual revision of V5 on the **locked V5 narration and timing**: the same words, recording, mix level and story order. The composition is `FlyingSkateboardV6` (`source/src/v6/`).

## 1. The locked audio mapped to the source timeline

- **Narration file:** `audio/narration/FGW_Flying_Skateboard_narration_V1.wav`, 48 kHz, exactly 35.90 s. The film is 1077 frames at 30 fps.
- **Speech:** runs from 0.13 s to 34.18 s.
- **Visual tail:** the remaining 1.7 s carries the score's tail and the loop seam of the mix. It stays, because the mix ends at 35.90 s and nothing is cut from the voice.
- **Word timings checked against the waveform:** the stored word timings (`audio/cues_v6.json` → `words`) were compared with the recording's actual pauses. Every pause of 0.12 s or more matches within about 0.04 s, for example:

  | Pause after… | Timings | Recording |
  |---|---|---|
  | "RIVER." | 2.90–3.41 | 2.96–3.41 |
  | "FIRE." | 12.92–13.64 | 12.94–13.64 |
  | "problem." | 17.62–18.08 | 17.62–18.08 |
  | "CANYON." | 30.96–31.79 | 30.97–31.79 |

- **Captions and cuts:** every picture cut near a caption change is placed on that caption's first frame.

| Line (caption show time, s) | V6 picture |
|---|---|
| 0.09 This skateboard / 0.98 could make you FLY / 1.98 across a RIVER. | One low front three-quarter track over the Yangtze. Frame 0 is already in flight. Nearby buoys and the gravel bar pass; at 1.35 s a gust rolls the deck about 4° and his body answers it. From 1.6 s a steady rise and pull-back shows his height over the water. |
| 3.37 You see, ten powerful | Cut to a still view of the underside: the ten fans' rims light in sequence (layout). |
| 4.84 electric propellers | Same view: the rotors speed up and the air streams lengthen (rotation, airflow). |
| 5.82 blast air downward, | Cut to a low wide view: the air reaching the water and churning it (the reaction). |
| 7.12 lifting you completely / 8.22 off the ground. | Cut to the riverside flat: the board lifts him from the grass and moves off; one standing camera follows part of it. The lift completes before the cut. |
| 9.27 But his first version / 10.36 used JET ENGINES… | Workshop: the jet prototype from above, then a low close-up of the engines. |
| 11.86 and caught FIRE. | Deck-top view: heat haze over the running engines. On "FIRE" it lights at the centre engine's base, climbs to its fuel fitting and runs back along that line, with warm light on the deck and casings, then smoke. It dies down and leaves a scorch. No cause is shown. |
| 13.60 So he switched to electric. | The smoke fills the room; the boards are swapped inside it. As it clears, the electric board in the same cradle spins up and its air blows the last of the smoke off the stand. |
| 15.44 Except there's / 16.16 one HUGE problem. | Practice field, low hover. A toe-side roll grows by itself, to about 6°, and he catches it late. |
| 18.04 The board can't / 18.86 balance itself. | Side view: the nose dips by itself (about 5°), he sits back; it comes up past level, he leans in. |
| 20.17 He has to control it | Close and low on ankles, knees and hips: a toe-side roll answered in the legs. |
| 21.08 with his entire BODY, | One eased move back to the whole body: a bigger heel-side roll answered by knees, hips, torso and arms, then a lean that moves the board. |
| 22.44 while an AI voice coach | The deck phone, the sensor: its horizon reads a steady heel-side error he can't feel. Then his view of the wrist phone, the coach app: the same reading in amber while the coach speaks (a waveform in the earbud's colour). |
| 23.66 helps him learn | Medium view, head to knees: the earbud pulses; he lowers his wrist, softens his knees and moves his hips over his toes; the deck comes level. |
| 24.22 how to balance. | Wide: a fresh gust, met at once (under 3°) and settled. |
| 25.32 And after just over / 26.30 ten days of practice, | Another morning, one continuous track: lift-off from rest on the riverside flat with a small wobble caught at once, acceleration, over the shoreline at 27.07 s and out over the water. |
| 27.63 he actually flew / 28.56 across a RIVER… | Cut to the same flight from high off his side: the river opens up, with the far bank, town and bridge ahead and the wash trailing behind. |
| 29.72 and THROUGH a CANYON. | Cut to the canyon flight, a separate demonstration. We join it deep in the gorge, about 6 m up, tracked from behind with both walls passing. |
| 31.75 How much would someone / 32.50 have to PAY YOU / 33.34 to ride this thing? / YOUR PRICE? | Back on the Yangtze: one crane from high and wide down to frame 0's view while he flies on through a gust correction. "YOUR PRICE?" sits in the sky above him. It lands on frame 0's camera key with the camera velocity carried through the loop. |

## 2. Transition list

Each row reads: outgoing subject → incoming subject → new information → decision.

| Time | Outgoing → incoming | New information | Decision |
|---|---|---|---|
| 1.6 s, in shot | Close track on the rider → rise and pull-back | His height over the water, and the crossing | **Keep:** one continuous move, no cut. |
| 3.37 | The rider in flight → the board's underside | Mechanism: the ten-fan layout | **Keep:** a mechanism view after the opening proof (the brief's option). |
| 5.84 | The underside → the air reaching the water | The reaction in the environment | **Keep.** |
| 7.13 | The air on the water → the lift on the flat | Lift: the board leaves the ground | **Keep.** The lift completes in its own shot. |
| 9.31 | The flight → the workshop | A new place and time: the first version | **Keep.** |
| 10.74 | Prototype from above → engine close-up | What the engines are | **Keep.** |
| 11.75 | Engine close-up → deck-top view | Where the fire starts | **Keep.** |
| 13.72 | Fire view → the other side of the stand, inside full smoke | The swap is hidden in the smoke | **Keep.** The cut is under full smoke, not a crossfade over the board. |
| 15.48 | Electric board on the stand → practice field | A new place: learning to ride it | **Keep.** |
| 18.03 | Roll problem (nose-toe view) → side view | A different tendency (pitch); the side view shows it | **Keep.** |
| 20.17 | Side view → legs close-up | How he controls it (ankle, knee, hip) | **Keep.** |
| 20.9–21.7, in shot | Legs → whole body | The whole body's part | **Keep:** one eased move back out. Merging it removed a cut. |
| 22.43 | Whole body → deck phone | Sensing | **Keep.** |
| 23.05 | Deck phone → wrist phone | Coaching (display and voice) | **Keep.** |
| 23.67 | Wrist phone → medium view with earbud | The cue, and the change in his stance | **Keep:** replaces V5's head-only earbud close-up. |
| 24.23 | Medium → wide | The recovery working | **Keep.** |
| 25.33 | Field → riverside flat, another morning | A new time: the practice paid off | **Keep.** V5's take-off → overhead → bank → low-pass resets are **removed** (merged into one move). |
| 27.63 | Low track → high side track | The scale of the crossing | **Keep.** |
| 29.73 | River → canyon | A different place and demonstration | **Keep:** a deliberate cut, not a route. The river set has no gorge cut into its bank. |
| 31.77 | Canyon → river, high | Back to the question; the flight goes on | **Keep:** one continuous crane to frame 0. |
| 35.9 → 0 | Ending → frame 0 | Loop | Same trajectory, camera key and velocity. |

Removed from V5:
- the carve's deck roll under feet that barely changed (1.4–2.2 s);
- the unreported fuel-leak cause;
- the unit-by-unit seating;
- the repeated hovering poses of the balance section;
- the medium → overhead → bank → low-pass practice resets;
- the river → gorge-mouth route;
- the near-static close hover under the question.
