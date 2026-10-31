# Liquid Metal Robot V2: retention revision notes

Output: `exports/FGW_Liquid_Metal_Robot_V2_FINAL_REVIEW_1080x1920.mp4` (26.0 s, 780 frames).
- Source: `source/src/v2/` (copied from v1; v1 and the V1 export are untouched). Composition: `LiquidMetalRobotV2`.
- Audio: `tools/audio/mix_v2.py` → `source/public/audio/mix_v2.wav`.
- Narration, words.json, the caption emphasis per occurrence and the scene order are all unchanged.

## Changes per priority

1. **0–2 s collapse** (`motion.ts` TP, `opening.tsx`, `props.tsx`):
   - On frame 0 the legs and hips are already mirror liquid (the melt front starts at 0.78 cm, about half the figure). The slump starts before frame 0 (slump0 = −0.12), so the legs are buckling from the first frame.
   - The front reaches the head by 0.5 s and the figure is a pool by 1.0 s (V1: 1.42 s). The head, neck and stud slide sideways off the slumping shoulders into the pool (around 0.4–0.8 s).
   - Seven drips (V1: four) run down the body in 0–0.8 s, and the pool spreads faster.
   - The escape starts at 0.92 s (V1: 1.22), so the liquid is pushing into the bars by ~1.0–1.2 s. The magnet arrives at 0.45–1.0 s.
   - The cage now has 8 thinner bars (V1: 12), set so there's a clear gap in front of the figure. Frame 0 still reads as a figure in a cage.
   - The camera holds closer during the escape (a scale key at 1.0–1.6 s) before the original pull-back.
2. **2–6 s squeeze and metal look** (`opening.tsx`, `figure.tsx`):
   - The three gap streams are re-aimed at the front-facing gaps (−45°, 0°, −90°).
   - The necks are thinner (radius 0.085 vs 0.125) and taller-domed, so they read as tongues between two bars with a bright highlight on top. They bead up larger outside.
   - The solid figure is now cool gallium rather than grey plastic:
     - a darker, bluer base with a 5-stop metal gradient: a bright upper-left rim, a dark core band, and a cool sky-reflection band;
     - a vertical environment-reflection band laid over every part;
     - dark crevice lines around each part;
     - finer, darker grain.
   - The matte solid ramp for frozen liquid is darker and cooler to match.
3. **6–14 s: the particles' role, distinct beats** (`macro.tsx`, `Film.tsx`, `timeline.ts`):
   - **Heating (from "magnetic field" 7.91 to "heats" 8.63), inside the section:** the camera stays at the macro scale. The NdFeB particles warm (an orange glow round each one) and jiggle.
   - **Melting (from "heats" to "liquid" 9.36):** liquid gallium spreads outward from each hot particle. The grains disappear and the section becomes a smooth bright liquid with drifting reflections.
   - **Pull-back (9.3–10.0 s):** the camera pulls out to the figure, already liquid at the soles. It collapses on the coil by "another" + 0.42.
   - **Steering ("steers" 10.78), seen from a low side angle:** a magnified window on the moving puddle shows the particles rotating, stretching and gathering into chains along the magnet's direction, while the liquid drifts toward the magnet.
   - **Hardening ("cools" 12.22 → "hardens" + 0.45), seen from steeply overhead and closer:** the coil switches off. A freeze front sweeps across the window, turning the liquid back into grains and locking the particles in place. A front also crosses the puddle surface, mirror to matte.
   - The three beats use three different scales and angles (macro face-on, low oblique, overhead) on one continuous camera path. There are no rings and no arrows.
4. **14–23 s: the wrap** (`Film.tsx` `collar`, `GooMask`):
   - The new wrap sequence: the melted slug drains, and two streams run round both sides of the ball at floor level until they meet behind it (~19.9 s).
   - Four fingers then climb the sphere, the near ones first, and close over the top into a crown (~20.4 s).
   - Freeze front: as the stage coil switches off, the front sweeps upward from mirror to matte (20.55–21.27 s). The grip reads as a four-finger cage around the ball.
   - The magnet then pulls it out through the tube.
   - The ball-front mask is now built from the finger and stream blobs actually in front of the ball, instead of V1's latitude band. This fixes V1's striped climbing-film texture: the film is no longer many overlapping small blobs.
   - Ball, model, tube and coil positions and scale are unchanged from V1.
5. **23–26 s: the loop** (`timeline.ts` `ballAt`, `Film.tsx` camera and magnet):
   - The grip and ball travel out of the tube, across the stage and onto the pad coil inside the cage footprint, ending at the cage's front edge. The camera follows them in one continuous move, pulling back and then descending into the opening's cage composition (target, pitch and yaw near frame 0's).
   - The pad coil switches on again (LED and current sheen, 24.95 s), the magnet lets go and lifts away (25.15 s), and the grip's metal begins to go from matte back to mirror. The last frame is the cage on the live coil with metal starting to soften, leading into frame 0's figure in the cage.

## Transitions (outgoing → incoming → new information → kept)

1. Figure buckling → pool → bars → the escape → figure, cage, coil (camera holds closer).
2. Necks between bars → beads outside → magnet steering into the mould → pool, magnet (as in V1).
3. Mould freeze → recast figure stood outside the cage → push into the chest → same figure, same axis.
4. Section (solid) → particles glow and the gallium melts round them → why the field melts it → the same section, same camera.
5. Liquid section → pull-back → figure collapsing on the coil → the bench → same figure (window closing).
6. Puddle → low oblique with the window: particles chain toward the magnet → steering mechanism → puddle, magnet.
7. Low oblique → overhead: the coil goes off, a freeze front sweeps the window and surface → particles locked → same puddle.
8. Slug → pull-back to the stomach model → second experiment → slug, magnet (as in V1).
9. Slug at the ball → streams round both sides → fingers close over the top → freeze → grip → ball and metal in one shot.
10. Grip leaving the tube → follow across the stage onto the pad → descend to the cage composition → loop → grip, coil, cage.

## Science

Unchanged from V1 (Wang et al., *Matter* 2023, DOI 10.1016/j.matt.2022.12.003). The new particle beats are illustrative:
- the induction-heated NdFeB particles warm their surroundings;
- in the liquid, the particles align with the external field and transmit its pull;
- solidification locks them.

These are qualitatively right for MPTM (field-driven heating of the magnetic composite, magnetic torque and force carried through the particles), but simplified: in reality the gallium itself is also inductively heated, and particle chaining is exaggerated for visibility. Heating is still only coil hardware, all motion is the external magnet, the recast uses a mould, and the stomach is a model.

## Audio (`tools/audio/mix_v2.py`, fx −27 LUFS, ducked)

The V1 cue set, retimed to V2. Changes:
- Opening: buckle, sag, head-drop squelches and thump, seven drips, an earlier escape flow and squeezes.
- Particle beats: a rising heat crackle from "magnetic field", a melt flow on "heats", and fine alignment ticks on "steers".
- Wrap: two stream squelches, a meet blip, a finger-climb creak, a crown blip and a capture thump.
- End: the pad coil hum comes back on (24.95 s) with a relay click, a release click, and a softening crackle.

The mix is −16.21 LUFS integrated, with a −0.94 dBFS peak.

## QA passes

- **Stills pass 0:**
  - The first collapse attempt made the solid figure read as glass (a brushed-streak pattern plus semi-transparent solid fading), so I removed the streaks and tuned the slump timing.
  - The front-bar opacity reduction looked ghostly, so I replaced it with 8 thinner bars.
  - The figure was liquid during the section, so I re-timed the bench melt to after "liquid".
  - The window drifted off-centre, so I fixed it.
- **Render 1 review:**
  - The collapse was faster than V1 and the preview, but the head-in-pool was slightly early, so I set slump1 to 1.0 s.
  - The wrap fingers were good. The stream tips were too thin, so I thickened them and started the flow earlier.
  - The particle alignment read weakly, so I strengthened the chaining and added stretch along the field.
  - The frozen matte surface was too light, so I darkened the solid ramp.
- **Render 2 review:**
  - The steer beat and the cooling beat shared a similar oblique angle, so I lowered the steer camera and made the cool beat steep overhead.
- **Render 3 (final):** `qa_clip.py` all pass. I checked:
  - 0–2.5 s at every second frame;
  - the first 2 s side by side with V1 and the preview;
  - transition strips at 8.7–11 s, 10.3–11.7 s, 12–14 s, 18.7–21.3 s and 23–26 s;
  - all the sample times.
  See `V2_QA_REPORT.md`.
- **Render 4 (coordinator's opacity fix, final):** the solid figure rendered semi-transparent. Causes found and fixed:
  1. **Solid/liquid blending by alpha.**
     - The solid art faded out through a soft gradient mask at the melt front (a 0.16 cm alpha ramp) and a group opacity (`1 − ss(slump, 0.2, 0.55)`). The liquid twin and the background showed through, and a hard seam appeared at the hips.
     - Now the solid is always fully opaque. It is cut by a hard, rippling melt-front mask, and a bright wet rim line sits on the boundary (`MeltingArt`, used for both the opening and the 8–10 s melt). The solid only disappears when it is entirely below the front.
  2. **Glass-like overlays.**
     - The V2 environment-reflection gradient had horizontal light and dark bands, including a pale band that matched the coil rim and read as see-through banding.
     - The `FigureSheen` vertical ellipses read as glass.
     - Fix: the environment layer is now one soft diagonal streak (alpha ≤ 0.2), the sheen ellipses are removed, and the front gradient is smooth (lit → base → cool → shade).
  3. **Ghost head outline.**
     - The thickness sweep (top faces) was a flat pale fill offset 0.6 of the projected depth, so it read as a second, offset head.
     - Now it is drawn at 0.38 depth, in a darker cool tone close to the front faces, with grain. It reads as a narrow bevel.
  4. **"O" ring in the collapsing torso.**
     - The liquid twin was built per part with radial domes, plus an offset duplicate, and the puddle's five rim lumps sat over the torso. The overlaps lit as a crater or ring.
     - Now the figure's liquid is one flat union slab (a new `'u'` goo kind). The puddle and its rim only grow once the figure has mostly slumped. Diffuse and specular lighting blur now scale with the blur radius, which removes contour terracing in close-ups.
  5. **Grip "face".**
     - The four fingers left two symmetric blue gaps flanking a central finger.
     - Now there are six fingers (40°, 112°, 172°, −10°, −70°, −130° from the slug side). They cover the ball's front except one off-centre window.
  - Everything else (timing, camera, audio, the cool-gallium palette) is unchanged.
