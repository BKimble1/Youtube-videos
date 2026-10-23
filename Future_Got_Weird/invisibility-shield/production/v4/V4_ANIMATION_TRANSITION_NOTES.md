# FGW Invisibility Shield V4: animation and transition review notes

This covers V4, the 2D / 2.5D vector rebuild in the Weird Crew construction. It is a review render, not a publish master.

## Design decisions

### Protagonist: the established Crew "person" from Video 01

She is the Crew character `person` from the channel's Video 01 cast (`can-you-hurt-something-that-isnt-alive/…/components/cast.ts`): skin `#F7D9C4`, auburn bob `#B8743A`, light-blue shirt (Crew `blueLight`), brown trousers `#5B4636`, dark shoes. These values and the construction are used unchanged.

The red-haired V1 "guesser" is not used. Of the female-reading cast (person, checker, clerkB), person was chosen because she has no glasses. Glasses would hide the eye acting that the hiding beats depend on.

### Guard: built from Crew parts

The Crew cast has no guard, so none was invented and presented as an existing member. He is built only from the Crew parts library: the crew head with crop hair, mitt hands, stroke limbs with an ink underlay, and the flat trapezoid torso.

The one new element is his costume, coloured from the Crew palette: a `blueDeep` shirt, navy trousers and cap, a saffron badge, and a belt with cuffs.

### The 2D turnaround rig (`source/src/v4/Crew4.tsx`)

The Video 01 rig only faces front, but a chase needs three-quarter, profile, back, run, crouch and reach views. The rig keeps the Video 01 construction for all of these:

- one ink outline, scaled gently with size;
- flat fills with a single cel-shade tone on the torso;
- limbs as round-capped strokes over an ink underlay;
- the mitt hand with a thumb, plus an open-hand variant with four fingers and a thumb for the floating hand and the wave;
- white-sclera eyes with ink pupils, ink-line brows, the hook nose, and the drawn mouth.

The joints are a 2D-card skeleton. Two-bone IK keeps elbows and knees bending the right way, and feet come from explicit floor plants so they never slide while loaded.

The head is the crew oval. Its features ride on a sphere, so a head turn slides the face across the oval, as a classic cutout turnaround does, rather than rotating a model. The face-and-hair boundary is an elliptical cap, which keeps the bob reading in every view. The nose breaks the silhouette in profile.

There is no 3D model, no 3D lighting and no cylindrical shading. Model sheets: `V4_model_sheet_turnaround.png` and `V4_model_sheet_expressions.png`.

### Depth: a flat multiplane (`Corridor4.tsx`)

The corridor is made of flat, ink-outlined illustration planes: walls, floor tiles, doors, lab windows, a notice board, ceiling panels, and the sealed far door. They are placed in one perspective space, and characters are flat cards in that space. Parallax between foreground, characters, panel, walls and the distant door comes from that placement.

Distance haze is colour mixing. The corridor repeats every 3.27 m, which makes the loop exact (see the loop note at the end).

### Optics (`Shield4.tsx`)

Both views are drawn from the same rule, so the zoom between them is continuous.

- **Unresolved view (normal distance).** Each rib takes in a fan of directions of ±48°. A layer d metres behind the panel is therefore averaged over a width of 2·d·tan48°.
  - The far corridor is smeared into horizontal bands.
  - Her body, about 0.4 m behind, is spread over a width larger than the panel, so it dilutes to a faint wash.
  - This is the narration's "spread the light coming from your body sideways, while smearing the background across the space where you're standing".
- **Resolved view (macro).** Each rib shows a squeezed, mirrored panorama of what is behind it: corridor stripes, door glow, and a sliver of her face.
- **Viewpoint dependence.** The smear is computed from each camera. From behind her (shots `behind`, `gripCU`) the guard is the one smeared. From the side the panel is edge-on and she is plainly there.
- The demonstration uses no arrows, rays, labels or diagrams.

## Shot list (film time, s)

| # | Shot | Time | Content |
|---|---|---|---|
| 1 | track | 0–1.95 | Mid-chase, three-quarter tracking ahead of her. She runs at us with the panel under her arm and looks back over her right shoulder. The guard scrambles up far behind and runs, his beam slicing across. She brakes (1.3–1.8) and pivots, swinging the panel up. |
| 2 | pov | 1.95–4.42 | His eye line as he decelerates. The panel slams onto the floor (2.2) with her head above it. She sinks behind it on "watch your body disappear" (2.95–3.75): what is behind the panel smears away, what is above it is visible until it isn't. He leans and searches. |
| 3 | rev | 4.42–5.25 | Reverse on him, puzzled: head turns, a lean, the beam sweeping. |
| 4 | behind | 5.25–5.92 | Over her shoulder, the other view: she is plainly crouched there, and he stands beyond the panel. |
| 5 | lens | 5.92–13.6 | One continuous shot. Back on his line (concealed again), the push into the panel surface (6.2–8.05), and the macro, where each rib holds a sliver of her eyes. Her glances and blinks read in every rib at once while the camera drifts across the ribs (8.05–10.6). Then the pull back out (10.6–13.35): the slivers merge into a distorted outline and then a blurred patch. The beam sweeps over the panel. |
| 6 | behind2 | 13.6–14.5 | He takes two steps closer; she sinks lower. |
| 7 | torchCU | 14.5–15.2 | His hand tilts the flashlight down. |
| 8 | gripCU | 15.2–15.9 | Her hands on the grips nudge the panel; he is visible past her. |
| 9 | lean | 15.9–16.6 | Side: he leans in suddenly; she freezes. The music drops out. |
| 10 | faceCU | 16.6–17.3 | Her frozen face; only her eyes move. |
| 11 | pov2 | 17.3–18.0 | His view: a blurred patch of scenery. He looks past her. |
| 12 | sigh | 18.0–18.5 | Her exhale; behind, he turns away to keep searching. |
| 13 | reach | 18.5–20.05 | Side: her left arm goes out and around the panel's edge, with the elbow leading, the wrist turning and the hand opening. |
| 14 | pov3 | 20.05–20.9 | His view: a hand floating beside the panel, fingers rippling. |
| 15 | gCU | 20.9–21.72 | Push in on his face; his eyes widen. |
| 16 | pov4 | 21.72–22.52 | His hand reaches in; the hand waves, then darts back behind the edge (22.3). |
| 17 | recoil | 22.52–23.2 | Side wide: he hops back, arms up, the flashlight swinging. |
| 18 | giggle | 23.2–23.9 | Her, a hand over her mouth, shoulders shaking. |
| 19 | two | 23.9–25.22 | Side two-shot: she rises as the panel comes down to her side in one move, right in front of him. |
| 20 | pov5 | 25.22–26.0 | His view of her standing there, with a little wave. |
| 21 | gCU2 | 26.0–26.62 | His jaw drops, then narrows to a squint. |
| 22 | herCU | 26.62–27.18 | Her mischievous smile and head tilt. |
| 23 | belt | 27.18–27.55 | His hand goes to the belt and the cuffs come out. |
| 24 | cuffs | 27.55–28.0 | Insert: the cuffs snap open (ratchet click at 27.68). |
| 25 | herCU2 | 28.0–28.3 | Her smile drops to an uh-oh, with a sweat drop. |
| 26 | bolt | 28.3–28.72 | Side: she turns and bolts; he lunges and belly-flops. |
| 27 | track | 28.72–end | The tracking shot ahead of her, which is shot 1 continued. |

## Transition list

Each row gives the outgoing shot, the incoming shot, the new information, and the decision (keep / merge / remove).

| At (s) | Outgoing to incoming | New information | Decision |
|---|---|---|---|
| 1.95 | track to pov (action into angle, mid-swing of the panel) | What he sees: her face over the panel | keep |
| 4.42 | pov to rev (cut on his head turn) | His confusion | keep |
| 5.25 | rev to behind (his look to the reverse view) | She is plainly there: it is viewpoint | keep |
| 5.92 | behind to lens (back to his line) | Concealed again from his angle | keep |
| 6.2–13.35 | inside lens: push, macro, pull | What the surface is and how it hides her | keep; continuous, no cut |
| 13.6 | lens to behind2 (the beam sweep motivates it) | He comes closer | keep |
| 14.5 / 15.2 | behind2 to torchCU to gripCU (hands) | His light tilts, her panel nudges | keep |
| 15.9 / 16.6 / 17.3 / 18.0 | lean to faceCU to pov2 to sigh | The close call and the release | keep |
| 18.5 | sigh to reach (side) | Her idea | keep |
| 20.05 / 20.9 / 21.72 | reach to pov3 to gCU to pov4 | The floating hand and his reaction | keep |
| 22.52 | pov4 to recoil (on the dart-back) | He jumps; the beam swing works as a wipe | keep |
| 23.2 / 23.9 | recoil to giggle to two | Her amusement, then the reveal | keep |
| 25.22 to 28.3 | two to pov5 to gCU2 to herCU to belt to cuffs to herCU2 | Reveal, reaction, cuffs, uh-oh | keep (cramped; see QA) |
| 28.3 | herCU2 to bolt (side) | She runs | keep |
| 28.72 | bolt to track (cut on her first stride) | The chase, which loops | keep |
| loop | track (end) to track (frame 0) | None; the same shot continues | seamless by construction |

There are no spins, flashes, blur covers, 3D orbits or radial wipes. The macro is reached and left by continuous focal change on his line of sight, aimed at the panel.

## Loop

The ending's run is the opening's run in "chase time" (tau = t − 29.267 after the bolt). The bolt starts exactly two corridor modules (2 × 3.2725 m) behind the hiding spot, and that is the distance she covers from the bolt to her stop.

So the camera, both characters, the footfalls (identical plant lists), the beam and the corridor at 29.267 s are the state at 0 s.
