# Video 02 artwork: how the ChatGPT batch is used

Decided 8 October 2026 after a two-stage assessment (assessors, then critics who re-checked each claim on the images and
our renders): `art/ASSESS_cast_props.md`, `art/ASSESS_backdrops.md`, `art/CRITIC_cast-props.md`,
`art/CRITIC_backdrops.md`. Import record and hashes: `art/ART_MANIFEST.md`.

## Summary

No generated pixel goes on screen. Every scene the plates were meant to serve was already built in code to the
storyboard, and the plates cannot be registered to the film's room: their perspective differs from the one projection
the film uses (A05's floor lines run at 0.56–0.71 against the code's constant 0.743), the room view tilts continuously
into a plan view that a flat bitmap cannot follow, and at the 3840×2160 master a 1672-pixel original would be magnified
2.3–4× beside crisp vector lines (a vtracer trace was tested and judged not good enough). The batch instead served as
the drawn reference the packet asked for, and produced four concrete changes, one of them a physics correction.

## Decisions per asset

| ID | Decision | Effect on the film |
|---|---|---|
| A01 guesser turnaround | Reference → code | Its **back view** is rebuilt as an additive code overlay on the existing rig (no rig redesign). Used (1) in S2.2: a mirror on the back wall must show the side of him that faces the wall, i.e. his back; the first build showed his face, which contradicts the beat that teaches how mirrors keep an image intact; (2) in S8.3 (the payoff push), staged from behind the screen's near end so it reads as pushing toward the wall rather than hugging the panel. |
| A02 guesser poses | Reference → code | The duck (#4: hands clamped on the crown, deep squat) informs S2.2's duck. The side-on push (#7) is rejected: it would slide the screen sideways, not back to the wall. |
| A03 checker poses | Reference only | Identity confirmed. The built deadpan lean in S8.3 already fits "calm, deadpan" better than the louder A03 #5 lean. |
| A04 sensor prop | Reference only | Confirms the S1 stand design; S1's stand becomes the kit standard at merge. Note taken: never let her forearm cover the readout. |
| A05 room plate | Not on screen | Perspective and layout do not register with the code room; partition baked in. |
| A06 / A06b mirror | Not on screen | The code mirror (wood frame, computed specular point, path-checked) reads better; A06b's cream frame nearly vanishes on the cream wall. |
| A07 wall cross-section | Reference only | The built S2.3 section is oriented like the rest of the film and shows the right physics (cosine-weighted scatter). Its surface profile was extracted (`art/A07_surface_profile.json`) and archived. |
| A08 warehouse corner | Not on screen | A redraw of the kit warehouse at one push framing; cannot follow the S7.2 tilt into plan view; contains no robot. |
| A09 delivery robot | Reference → code | Fixed the robot's "cautious" face in `DeliveryBot.tsx`: separate short lids, the dot clipped to a half-disc below the lid, inner ends higher. The old lids joined into one bar and tilted the wrong way, reading as angry. The A09 robot's twin mast, side lights and white spokes were not adopted. |
| A10 opening plate | Not used as Runway input | Shows the checker holding the sensor in act 1; the film keeps it on its stand until s32 because the opening data were captured with the sensor held still. Its room also differs from the code room, so a cut would jump. R1's start and end frames are rendered from the Remotion shot. |
| A11 closing plate | Not used as Runway input | The lunge pushes the screen sideways (−x), not back toward the wall (−z), and is a tilt-0 view while S8.3 plays raised. R4's frames come from the Remotion shot. |
| A12 history shelf | Reference only | S5 is built in code with the storyboard's exhibits (the plate has a closed laptop, no clock, an off-palette floor). |
| A13 thumbnail art | Not used | Geometry check: he leans on the coral face toward the camera and is in the sensor's direct view, and the relay wall is behind the coral block from his position, so no honest around-the-corner route can be drawn. Thumbnails A–C are code-drawn with checked routes. |
| A14 research module | Not used | 10×10 confirmed, but teal (collides with the kit sensor) and its back reads as a consumer phone. The built saffron module is distinct and labelled. |
| A15 3×3 box | Not used | Reads as a keypad; the built ZoneBox (emitter + 3×3 panel) is clearer and already shared by S3 and S7. |
| A16 warehouse walker | Reference only | Identity matches the existing "person"; its high-angle top view must not drive the plan token. |

## For the owner

The commissioned plates are good illustrations; they did not make it on screen for registration and continuity reasons,
not quality. If a later episode wants painted backdrops, request them at the film's exact projection (we can supply a
wireframe of the room at the camera's framing) and at a size that survives 4K, and keep any moving set piece (the
partition, the mirror) out of the plate.
