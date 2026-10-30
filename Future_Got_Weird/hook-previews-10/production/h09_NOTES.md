# HOOK 09: Pistol shrimp (FGW_HOOK_09_PISTOL_SHRIMP.mp4)

Line: "This tiny shrimp snaps its claw… creating a shockwave and flash of light." The event times are in
`source/src/h09/timeline.ts` (`T`). They are mirrored in `tools/audio/h09.py`.

## Shot plan (one continuous camera; units are world mm; camera = keyCR on centre and log-zoom)
- **0–0.5 s**: Close on an Alpheus-type shrimp at 33 px/mm: head, eye under the hood, antennae, legs on the sand, and the huge snapping claw raised and cocked open (dactyl at 84°). The joint lock settles at 0.36 s. The camera eases in, particles drift and the pleopods and antennae move.
- **0.5–2 s**: The lock releases at `tiny.end − 0.15` (0.58 s) and the claw shuts in 3 frames (0.68 s). The jet streams out of the claw tip as a cone. The cavitation bubble nucleates in the jet (0.76 s): micro-bubbles merge into one. The time scale ramps to about 3.5 % (drifting particles almost freeze). The camera follows the bubble from 62 to 140 px/mm as it balloons. Surrounding particles are pushed outward, using volume conservation r³ = r0³ + R³.
- **2–4 s**: Extreme macro (225 to 320 px/mm). The bubble reaches its maximum at 1.95 s, then collapses ever faster. It flattens and dimples (a re-entrant side), and the water and particles are drawn inward. Collapse is at `flash.start − 0.15` = 3.66 s: the bubble vanishes, there is one pinpoint flash (decay τ = 75 ms, visible for about 3 frames) and a rebound micro-bubble cloud, and a single shockwave front leaves the collapse point (fading in over 2 frames after the flash). The camera reverses into a pull-out as the front expands. Particles get a sharp outward kick as it passes.
- **4–6 s**: The pull-out continues (72 → 40 → 22 → 14.2 px/mm). The front reaches the small goby-like fish at about 4.5 s: the fish is knocked away, flexes and drifts tilted with its fins still. The whole shrimp is revealed, small next to the much larger wavefront, which fades but stays visible. The claw re-opens from 4.90 to 5.85 s and locks (a small settle). Slow motion eases back and drift resumes. Everything is still moving at the last frame.

## Transitions (outgoing → incoming → new info → kept)
1. Cocked claw → snap → jet + bubble. Kept: same shot, claw in frame.
2. Wide on claw → follow bubble into macro → bubble growth, slow-motion time scale. Kept: jet cone links the claw to the bubble.
3. Macro bubble → collapse → flash + shockwave origin. Kept: the camera stays centred on the collapse point.
4. Macro → pull-out with the front → stunned prey, then the whole tiny shrimp re-cocking. Kept: the ring centre and the claw stay continuous.

## Science
Shown:
- 5 pereopod pairs: P1 is a big snapping claw on the near side plus a small claw on the far side; P2 is slender and chelate with a ringed carpus; P3–P5 walk.
- Orbital hood over the eyes.
- Antennules, long antennae and the antennal scale.
- 6 abdominal segments, with the caridean 2nd pleuron overlapping the 1st and 3rd.
- 5 pleopod pairs, telson and uropods.
- Snapping-claw mechanism: the dactyl plunger seats into the pollex socket, and the jet leaves the claw tip.
- Physics: the bubble forms in the jet, grows, then collapses. The flash is a tiny point at the collapse point only. One pressure front stuns small prey.

Deliberately not shown: no electricity or glow from the shrimp, no explosion, no fireball. The loud snap in the audio sits at the bubble collapse, not at the claw closing (the claw closure is only a small clack).

Simplifications:
- The slow-motion factor is not physically uniform. In reality the bubble lives for about 0.5 ms, the flash lasts under 10 ns and is invisible to the eye, and the shock travels at about 1500 m/s.
- The bubble is drawn as a near-sphere with a late dimple, rather than the real vortex-ring (toroidal) cavity.

Sources:
- Versluis et al., Science 289:2114 (2000).
- Lohse, Schmitz & Versluis, Nature 413:477 (2001), "shrimpoluminescence".
- Koukouvinis et al., Phys. Rev. Lett. 119 (2017).

## Assets
- `h09/math.ts` and `h09/shade.tsx`: copied from `ref/dead-spider/.../src/dc/` (fmt raised to 3 decimals).
- Shared `ink.tsx`, `color.ts` and `lib.ts`, used read-only.
- Drawn new for this hook:
  - `Shrimp.tsx` (full rig, IK legs);
  - `Fish.tsx`;
  - `Env.tsx` (water, far reef band, sand, grains, pebbles, algae, shell, particles with physical displacement, bokeh);
  - `Fx.tsx` (jet, bubble, rebound cloud, flash, shockwave);
  - `timeline.ts`.

## Audio cues (`tools/audio/h09.py`, fx_lufs −26)
| Time | Cue |
|---|---|
| bed | underwater bed + distant reef crackle |
| 0.36 | joint-lock click |
| 0.65 | jet hiss + slow-motion pressure swell (to about 3.5 s) |
| 0.67 | claw-shut clack |
| 0.76 | nucleation blip + stretched low "balloon" resonance |
| 3.12–3.66 | collapse rush, then the crack at 3.66 |
| 3.66 | SNAP (crack + low thud) + pressure thump + faint high glint for the flash |
| 4.50 | fish jolt puff |
| 4.70 | residual micro-bubbles |
| 5.05, 5.85 | re-cock clicks |

Mix:
- First pass: fx bus −30.2 LUFS (after ducking), mix −16.16 LUFS, peak −1.0 dBFS.
- After the final render: −16.18 LUFS integrated on the decoded file.

## QA
`qa/h09/qa.json` from the final render: all_pass = true. The full JSON is in `qa/h09/qa.json`. Summary:
- 180 frames, audio 6.0 s, onset 0.018 s (the effects bed starts at frame 0; the voice starts at 0.06 s), −16.18 LUFS.
- Longest static run: 1 frame. No frame jumps over 18.
- Motion per second: 3.09 / 2.99 / 2.31 / 3.21 / 3.87 / 2.67.

Fixes between passes:
1. **Pass 1 (contact sheets):**
   - The fish was in the macro shots and much too large: moved further out (PC + (4.5, −12.5) mm).
   - Raised the claw so the jet aims up-forward, which uses the portrait frame.
   - Spread the bubble collapse over 1.95–3.66 s, so the macro shots change every second instead of holding a large static bubble.
   - The jet lines showed through the bubble: masked them out.
   - Leg crossings: re-laid hips, feet and the near/far offsets.
   - Frame 0 was cut too far left: reframed.
2. **Pass 2 (full-res stills):**
   - The closed claw showed a gap: lowered the dactyl underside and plunger so it seats.
   - The socket read as a black "eye": lightened it.
   - Strengthened the jet.
   - Particle motion streaks during the shock read as radial tick marks, which would break the "no radial graphics" rule: removed the streaks after the collapse.
   - The ring sat on the flash frame like a target: delayed the ring by 2 frames.
   - Enlarged the flash glow a little; it is still a pinpoint.
   - Re-centred the 4.2 s camera key so the collapse point stays above the captions.
3. **Pass 3 (rendered MP4 frames 109–112, 128–160, last):**
   - The stunned fish stood vertically: it now tilts head-down.
   - Stronger fish kick.
   - The ring fades less at the end, so the larger effect is still readable.

## Known limitations
- The shrimp is a careful 2D side-view rig, but the abdomen and walking legs read slightly "crayfish-like" in the wide end shot. The pleopods are small nubs at that scale.
- The near antenna crosses over the claw palm in the close-up.
- The bubble is a sphere with a dimple, not the true toroidal vortex-ring cavity.
- The shockwave's refraction is suggested with tonal bands and particle kicks. There is no true background distortion.
- The fish is hit at about 4.5 s, during the fast part of the pull-out; its reaction is readable but brief.
- The flash is about 3 frames at reduced intensity. It is deliberately small and could be missed if you blink, which is accurate but subtle.
- The end frame has generous empty water above and sand below the shrimp; that is intended for the "tiny" read, but it is sparse.
