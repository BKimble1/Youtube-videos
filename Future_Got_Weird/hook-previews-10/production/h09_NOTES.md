# HOOK 09: Pistol shrimp (FGW_HOOK_09_PISTOL_SHRIMP.mp4)

Line: "This tiny shrimp snaps its claw… creating a shockwave and flash of light." The event times are in
`source/src/h09/timeline.ts` (`T`). They are mirrored in `tools/audio/h09.py`.

## Shot plan (one continuous camera; units are world mm; camera = keyCR on centre and log-zoom)
- **0–0.5 s**: The Alpheus-type shrimp is perched head-up (−60°) on the steep face of a boulder, filling the portrait frame on a diagonal at 30 px/mm.
  - The huge cocked snapping claw sits upper centre-right. The dactyl is open at 84° with the plunger showing, and its fixed finger has the socket.
  - The rest of the shrimp is fully in frame: eye under the orbital hood, slim banded carapace, curved segmented abdomen with pleopods, and the tail fan at lower left.
  - The joint lock settles at 0.36 s. The camera eases in, and the pleopods, antennae and particles move.
- **0.5–2 s** (approved; unchanged relative to the claw): The lock releases at `tiny.end − 0.15` (0.58 s) and the claw shuts in 3 frames (0.68 s). The jet cone streams out and the cavitation bubble nucleates in it (0.76 s). The time scale ramps to about 3.5 % and particles almost freeze. The camera follows the bubble from 62 to 140 px/mm while particles are pushed out (r³ = r0³ + R³).
- **2–4 s** (approved; unchanged): Extreme macro (225–320 px/mm). The bubble is largest at 1.95 s, then collapses ever faster, with a dimple and the water drawn inward.
  - Collapse is at `flash.start − 0.15` = 3.66 s.
  - At that instant the bubble vanishes into one pinpoint flash (about 3 frames), leaving a rebound micro-bubble cloud.
  - The single shockwave front appears 2 frames later, and the camera reverses into a pull-out.
- **4–6 s**: The pull-out continues (72 → 40 → 23 → 15.5 px/mm). The front reaches the small goby-like fish at about 4.5 s; the fish is knocked away, flexes, and drifts stunned with its head down. The whole shrimp is revealed on its boulder: hooded eye, curved abdomen with pleopods, tail fan. It sits small beside the larger fading wavefront. The claw re-opens and locks between 4.90 and 5.85 s, and drift resumes. Everything is still moving at the last frame.

## Transitions (outgoing → incoming → new info → kept)
1. Cocked claw → snap → jet + bubble. Kept: same shot, claw in frame.
2. Claw → follow bubble into macro → growth + slow motion. Kept: the jet cone links the claw to the bubble.
3. Macro bubble → collapse → flash + shockwave origin. Kept: camera centred on the collapse point.
4. Macro → pull-out with the front → stunned prey, then the whole shrimp re-cocking. Kept: the ring centre and the claw stay continuous.

## Science
Shown:
- 5 pereopod pairs:
  - P1: a big snapping claw on the near side and a small claw on the far side;
  - P2: slender, chelate, with a ringed carpus;
  - P3–P5: walking legs, near over far, spaced along the carapace with knees out and no crossings.
- Eyes under translucent orbital hoods: a soft dark spot with the hood sheen over it.
- Antennules, long antennae (routed up and back, behind the claw), and the antennal scale.
- A slim, laterally compressed carapace with translucent banding and a dorsal saddle.
- A curved abdomen of 6 segments, with the caridean 2nd pleuron overlapping the 1st and 3rd.
- 5 pleopod pairs, plus the telson and uropods.
- The snapping-claw mechanism: the dactyl plunger seats in the pollex socket, and the jet leaves the claw tip.
- The physics: the bubble forms in the jet, grows, then collapses. The flash is a tiny point at the collapse point only. One pressure front stuns small prey.

Not shown:
- No electricity or glow from the shrimp, and no explosion.
- The audio puts the loud snap at the bubble collapse, not at the claw closing.

Simplifications:
- The slow-motion factor is not uniform. In reality the bubble lives for about 0.5 ms, the flash lasts under 10 ns and is invisible to the eye, and the shock travels at about 1500 m/s.
- The bubble is drawn as a sphere with a dimple, not the true toroidal vortex-ring cavity.

Sources:
- Versluis et al., Science 289:2114 (2000).
- Lohse, Schmitz & Versluis, Nature 413:477 (2001).
- Koukouvinis et al., PRL 119 (2017).

## Assets
- `h09/math.ts` and `h09/shade.tsx` are copied from `ref/dead-spider/.../src/dc/`.
- The shared `ink.tsx`, `color.ts` and `lib.ts` are used read-only.
- Drawn new for this hook:
  - `Shrimp.tsx`: the full rig with IK legs, the curved abdomen chain, and the boulder;
  - `Fish.tsx`;
  - `Env.tsx`: water, far reef, sand, particles with physical displacement, bokeh;
  - `Fx.tsx`: jet, bubble, rebound, flash, shockwave;
  - `timeline.ts`.

## Audio cues (`tools/audio/h09.py`, fx_lufs −26)
| Time | Cue |
|---|---|
| bed | underwater + distant reef crackle |
| 0.36 | lock click |
| 0.65 | jet hiss + slow-motion pressure swell |
| 0.67 | claw-shut clack |
| 0.76 | nucleation blip + stretched resonance |
| 3.12–3.66 | collapse rush |
| 3.66 | SNAP crack + pressure thump + faint glint |
| 4.50 | fish jolt |
| 4.70 | micro-bubbles |
| 5.05, 5.85 | re-cock clicks |

The final file measures −16.18 LUFS with a −0.98 dBFS sample peak.

## QA
`qa/h09/qa.json` (final render, repair pass): all_pass = true.
- 180 frames; audio 6.0 s; onset 0.018 s (the bed starts at frame 0; the voice starts at 0.06 s).
- Longest static run: 0 frames. No frame jumps over 18.
- Motion per second: 3.77 / 2.93 / 2.31 / 3.18 / 3.65 / 2.87.

Inspected after the render: `first.png`, `last.png`, `sheet.png`, and full-resolution stills at frames 0, 15, 150 and 179 (in `qa/h09/work/fin/`).

Earlier passes:
1. Fish placement, claw elevation, collapse pacing, jet masking, leg layout, reframing.
2. Claw seating, socket contrast, jet strength, removing the radial streaks, ring delay, flash size.
3. Fish tilt, kick, and the ring's final fade.

Repair pass, after the coordinator's review of the opening and the wide shot:
- **Frame 0 left the lower 40 % as empty sand and read as crayfish/lobster.** Re-posed the shrimp head-up (−60°) on a boulder face so it fills the vertical frame on a diagonal. The cocked claw is the dominant shape, upper centre-right. The claw angle was compensated (+28° relative), so the jet still leaves at −34° and the approved 0.7–4.5 s section is unchanged relative to the claw.
- **Straight, crayfish-like abdomen.** Rebuilt it as a curved 6-segment chain with pale and dark translucent bands. The pleopods are larger and feathered, and the tail fan is in frame at 0 s and in the end shot.
- **Rounded-pill carapace.** Replaced it with a slimmer, laterally compressed outline: rounded hood projection at the front, translucent banding, a dorsal saddle.
- **The eye read as a bead on the body.** It is now a soft dark spot under the hood's sheen and rim, with no crisp outline or highlight.
- **Crossing legs.** Hips are re-spaced along the carapace and the knee side is chosen by foot direction, so the knee sits up and out. Far legs are offset parallel to the near legs, and the feet sit on the rock surface.
- **Near antenna crossing the claw palm.** It now sweeps up and back from the peduncle, drawn behind the claw.
- **Algae tufts next to the abdomen read as extra legs.** Moved them away from the shrimp. Also softened the rock's contact shadow and its blotches.

## Known limitations
- The diagonal head-up perch is a framing choice. Alpheus usually rest more horizontally at burrow mouths, but clinging to steep rubble is plausible.
- The boulder occupies the lower right of the opening; it is darkened so it recedes.
- The bubble is spherical-with-dimple rather than a toroidal vortex-ring cavity.
- The shockwave's refraction is suggested with bands and particle kicks; there is no true background distortion.
- The fish reaction is readable but brief because it falls in the fast pull-out.
- The flash is deliberately tiny, about 3 frames: accurate, but easy to miss.
- In the end shot the ring runs partly off the right edge, and the tail fan sits just above the caption block.
