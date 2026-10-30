# HOOK 04: LIQUID METAL ROBOT (notes)

Line: "This metal robot melts through a cage… then gets remolded into shape." One continuous 6.0 s shot on a dark teal
lab bench, through one perspective camera (cm units, `src/h04/cam.ts`) that pushes, pans, tilts down and slowly orbits
(yaw −9° → +7°, pitch 31° → 41°). The times all live in `T` in `src/h04/motion.ts` and are mirrored in `tools/audio/h04.py`.

## Shot plan
- **0–0.5 s** ("This metal"): close on a grey cast gallium LEGO-like figure (~1.7 cm) standing in a cage of 12 vertical
  bars on a flat induction coil. The coil's copper spiral shows under a dark glass top, its amber LED is lit and faint
  current-sheen dashes run along the spiral. Frame 0 already has the soles turned to bright liquid, with a small bead at the feet.
- **0.5–2.0 s** ("robot melts through a cage"): the melt front climbs the figure (matte → mirror skin, faint warm band).
  It sags, drips run down it, and it slumps into a puddle by `melts`+0.3 s. A hand-held magnet slides in from the right.
  The liquid squeezes out between the front-right bars as necks (3 gaps), beads outside, pinches off and re-merges into one pool by `cage`+0.42 s.
  The camera pulls back and pans right/down with the flow.
- **2.0–4.0 s** ("then gets remolded"): the pool heaps toward the magnet (a peak leaning at it). It is dragged off the coil onto
  an open coral silicone mould, where the figure-shaped recess has been in view since ~1.5 s. The magnet runs down the right side of the
  cavity and draws the liquid along it, so it fills from head to soles (`into`+0.16 s). The coil switches off (LED dark) at 3.3 s.
- **4.0–6.0 s** ("into shape"): a freeze front runs head → soles and the bright liquid turns to matte, grainy solid
  (`shape`+0.36 s). The magnet clacks onto the cast figure's head (4.74 s), tilts it upright out of the recess and carries it back.
  It sets it down standing just outside the cage (5.5 s), then lets go and lifts away. The camera pulls back to frame the empty cage,
  the standing figure and the empty figure-shaped cavity. Everything is still moving on the last frame.

## Transitions (outgoing → incoming → new information → kept)
1. Solid figure → melting figure → phase change from the soles up → same figure, cage and camera.
2. Slumped puddle → necks between bars → liquid escapes confinement (magnet named as the pull) → puddle, bars and camera, with a continuous pan.
3. Collected pool → magnet-dragged pool → external magnetic steering → pool, magnet and mould (already in view).
4. Pool → liquid filling the cavity → recasting in a mould → magnet and mould.
5. Liquid in the cavity → frozen figure → solidification → silhouette and position (the frozen art is the cavity shape).
6. Frozen in the mould → lifted, stood and set outside the cage → it is a solid figure again, outside the cage → cage, mould and empty cavity.

## Science
- Shown: MPTM, a gallium (m.p. ~29.8 °C) matrix with NdFeB microparticles (Wang, Pan, Majidi et al., Sun Yat-sen Univ.,
  CUHK and CMU, *Matter* 2023, "Magnetoactive liquid-solid phase transitional matter"). Heating is shown honestly as a
  flat induction coil under the cage (AC field: LED and coil sheen, no flames and no red-hot glow). A separate hand-held
  permanent magnet, which visibly moves, pulls the liquid out between the bars and steers it. Reshaping is externally assisted:
  an open mould, the magnet drags the liquid along the cavity, it freezes when the field is off, and the magnet lifts out and places the recast figure.
- Liquid: a mirror skin, surface-tension beads, necking at the bars, pinch-off and re-merging. Solid: a dull matte surface with grain.
- Deliberately not shown: no walking, no autonomous rebuilding, no face, and no rings or field diagrams around the coil. The figure never moves by itself.
- Simplifications: the scale is exaggerated for clarity (the figure is ~1.7 cm, the cage is 2 cm wide). The time-lapse is far faster
  than in the lab. The paper's figure was recast offscreen; here the mould sits beside the cage. Lifting the solid with the magnet is a
  plausible staging (the solid stays magnetic), not a specific frame from the paper.

## Assets
- Reused: `src/h04/shade.tsx` (Capsule and SoftShadow, copied from cyborg-cockroach `source/src/lib/shade.tsx`) and
  `src/h04/math.ts` (copied from the same `lib/math.ts`); the shared `ink.tsx`, `color.ts` and `lib.ts`. No crew character or hand was
  needed: the magnet is on a holder rod that runs out of frame.
- Newly drawn: the camera/projection (`cam.ts`); the liquid metal goo layer (`liquid.tsx`: blurred height field → cut edge,
  diffuse light through a mirror-metal ramp plus a specular glint, and an ink contour from dilation); the figure parts, melt deformation and
  solid art (`figure.tsx`); the bench grid, coil pad, cage, mould and magnet (`props.tsx`); and the motion and timeline (`motion.ts`).

## Audio cues (`tools/audio/h04.py`, fx −27 LUFS)
Ambience: lab room tone plus a 100 Hz induction-coil hum and a faint whine while the field is on (0–3.3 s). FX: a phase-change crackle (0–1.4 s);
squelches for the sag (0.55 s) and the slump (1.0 s); 4 drip blips (0.72–1.16 s); a thick flow during the escape (1.22–2.4 s); one squeeze per gap
(1.27/1.37/1.53 s); pinch-off pops (~2.1–2.2 s); a merge blip (2.28 s); a drag flow (2.5–3.3 s); a relay click as the coil goes off (3.3 s); a fill flow
(3.22–3.92 s) with a "full" blip; a freeze crackle (3.84–4.44 s); a magnet clack (4.74 s); a tilt creak; a set-down click and thump (5.5 s); and a release click (5.6 s).

## QA
(see below)
