# Dead Bird Drones (FGW Short): build brief and module contracts

Project: `/home/user/Youtube-videos/Future_Got_Weird/dead-bird-drones/`. Remotion 4.0.533 + React SVG, 1080×1920,
30 fps, **708 frames, 23.60 s**. Source root `source/src/`. `node_modules` is installed in `source/`.
Render a test still with `cd source && npx remotion still src/test/<name>.entry.tsx <CompId> /tmp/claude-0/<name>.png --log=error`
(about 10–15 s each; this machine has 4 CPUs, so render one still at a time and keep sheets small: 1080×1920 sheets
holding several cells are fine).

## The film in one paragraph

A preserved (taxidermy) bird body with an engineered drive inside flies. From frame 0 the bird is already airborne;
its near wing sweeps down across its torso and a wing-shaped cutaway opens in the flank to show a motor turning a
gearbox whose crank and rods move the wing spars: the wingstroke is visibly caused by the machine. Then a lab cradle
(the preserved shell lifts off its mechanical frame in an exploded view and seats back), a close look at the drive
(motor → gears → crank → rod → wing root), an outdoor wildlife-research illustration with living birds beyond the
drone, a SEPARATE prototype (a preserved mallard that swims), and a callback to the flying drone among living birds,
looping back to frame 0.

## Science rules (do not break)

- The preserved exterior is PASSIVE: no blinking, breathing, head turning, eye movement, muscles, wounds, blood, or any
  "coming back to life". The glass eye is fixed and glossy. All motion comes from the mechanism.
- No text, numbers, arrows, logos, or labels inside any module. The film adds the only text (captions and two small
  scope labels, SCHEMATIC and RESEARCH GOAL).
- No camera in the eye, no antennae, no computer "brain", no glowing eyes, no spy equipment, no evil faces.
- The mechanism is an explanatory reconstruction: keep it physically coherent (teeth mesh, parts connected), simple,
  and clean. No decorative spinning cogs that drive nothing.
- The swimming duck is a separate robot: it never shares a body with the flying bird.

## Coordinates (read `source/src/three.ts` and `source/src/rig.ts`; do NOT edit them)

- One world in **centimetres**. **x** forward (the hero flies +x, screen-right in exterior shots), **y up**, **z** toward
  the camera side of the default views (the bird's NEAR side). The bird's body-local frame is the same convention,
  origin in the middle of the chest under the shoulders; `bodyFrame(o, yaw, pitch, bank)` places it in the world.
- `three.ts`: `orbit({target, yaw, pitch, dist, scale})` → camera (yaw 0 = side view from +z; yaw > 0 = camera moves
  toward +x, a front three-quarter; pitch > 0 = from above; `scale` = px per cm at the target). `basis(cam)`,
  `proj(B, p)` → `{x, y, s (px per cm there), z (depth)}`, `planeMatrix(B, o, U, V)` → an SVG `matrix(...)` for a
  planar part drawn in local 2D coords (a, b) ↦ o + a·U + b·V (use it for gears, discs, plates), `ellipsoid2(B, F, c,
  axes)` → the silhouette polygon of an ellipsoid, `xf(F, p)` frame transform, `smoothClosed`, `smoothOpen`, `hull`,
  `capsule2`, `poly`, `facing(B, p, n)` (> 0 when the normal n faces the camera).
- `rig.ts` (THE geometry; every module draws against it): `BODY` (chest, rear, neck, head ellipsoids, with `tilt`
  about z), `BEAK`, `EYE`, `TAIL`, `SHOULDER_Z`; the drive: `GEARS` (P0 10T on the motor, A 20T, P1 10T on A's axle,
  B 30T output; centres, pitch radii, z ranges), `MOD`, `MOTOR`, `PLATE` (skeletal back plate), `CRANK`, `HINGE`,
  `LEVER`, `SPAR`, `TOPBAR`, `ROD_LEN`; `pose(phi)` → gear angles (with correct tooth phase for meshing), motor angle,
  crank pin, rod eyes/tops, the SOLVED flap angle of each wing, and each wing's frame (`o` = hinge, `ex` = span,
  `ey` = chord toward the trailing edge, `ez` = `top` = dorsal normal). `wingPt(W, a, b)`; `WING_OUTLINE` and
  `FEATHERS` (a = cm out along the span from the hinge, b = cm back along the chord); `phiOfPhase(u)` (u = 0 top of the
  upstroke, 0.5 bottom); `CRADLE`.
- Kinematics already solved: the stroke runs −27° … +47°, both wings identical. Gear B turns once per wingbeat; the
  motor turns 6 times.
- `source/src/test/proto.tsx` is a flat geometry proof (not final art): read it to see how to project the rig.
- Depth order for the bird in all its views (camera on the +z side): far wing → far shell interior (only when cut) →
  mechanism → near shell (with the cutaway hole and rim) → near wing → near-wing phantom over the hole.

## Style: the channel's Weird Crew vector finish

- Navy ink `INK` (#172B3A) contours at a CONSTANT on-screen width: `vectorEffect="non-scaling-stroke"`, `INK_PX` (2.6 px)
  for silhouettes, `LINE_PX` (1.4 px) for interior lines (feather edges, seams). Cel / gradient fills lit from the
  UPPER LEFT; small white glosses; flat clean shapes; restrained detail. Soft bokeh backgrounds. No photographic
  textures. Colours from `source/src/art/palette.ts` (`C`), extended locally only when needed.
- Every SVG id must come from `uid(tag)` in `source/src/core/ids.ts` (several frames share one document in sheets).
- Reference look (extract frames with ffmpeg into /tmp/claude-0):
  `../bone-glue/exports/FGW_Bone_Glue_V3_REVIEW_1080x1920.mp4`, `../zombie-ant/exports/FGW_Zombie_Ant_V4_FINAL_1080x1920.mp4`,
  `../eel-escape/exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`. Eel Escape V4's `source/src/v4/art/pred3d.tsx` shows a
  3D animal drawn as projected SVG with cel bands in this style.
- Everything deterministic (no Math.random; use `hash`/`noise1` from `lib.ts`).

## The shot plan (seconds; every time is a measured word time)

| t (s) | Words | Picture |
|---|---|---|
| 0.00–0.25 | "If you put" | Frame 0: the drone already flying right over an open field, large (≈20 px/cm, beak-to-tail fills the width), both wings high; a wooden fence post (fixed landmark) passes behind it. |
| 0.25–0.80 | "a motor" | The near wing's downstroke crosses the torso; its trailing edge acts as a wipe that opens a wing-shaped cutaway in the near flank (anchored to the body). Behind it the motor is already turning. |
| 0.80–1.50 | "inside a dead bird," | The cutaway shows motor → gears → crank pin → rods → the spar levers at the shoulder; SCHEMATIC label. The near wing is ghosted only over the hole. |
| 1.50–2.25 | "you could make it" | One complete, readable, mechanically driven wingstroke. No camera reversal. |
| 2.25–3.30 | "fly again." | Pull back to show the whole bird flying past the fence line; the next downstroke sweeps the cutaway closed (exterior restored). |
| 3.30–3.95 | — | Push to the near wing root as the wing rises. |
| 3.95–5.30 | "Researchers built drones" | Match cut on the wing root into the LAB: the same bird on a padded cradle on a bench; its wings coast to rest level; pull back to the lab (bench, pegboard, lamp). |
| 5.30–6.80 | "using preserved bird bodies," | Exploded view: the intact preserved shell (body, head, tail: feathers outside) lifts straight up off the mechanical frame (which keeps the wings on its spars). |
| 6.80–8.00 | "with machinery hidden" | Two/three-layer schematic: shell / frame / cradle aligned by dashed guides at the shoulders; SCHEMATIC label. |
| 8.00–8.90 | "underneath the feathers." | The shell lowers and seats over the frame: the machinery is hidden. |
| 8.90–9.40 | — | Push toward the near flank; the cutaway opens locally; the motor starts. |
| 9.40–10.30 | "A gearbox turns" | Close drive (≈45–60 px/cm): the gearbox; the motor pinion is the one dominant moving part (rotation marker). Mechanism in slow motion (one wingbeat per 2 s) for legibility. |
| 10.30–11.40 | "the motor's spinning motion" | Follow the rotation through the gear train: P0 → A → P1 → B (≈70 px/cm). |
| 11.40–12.10 | "into flapping" | Follow the crank pin's rod up to the spar lever at the hinge (wing-root linkage). |
| 12.10–12.60 | "wings." | Pull back along the spar to the complete wing's upstroke; feathers/body restored. |
| 12.60–13.00 | — | The downstroke carries the drone forward: the near wing sweeps the lens, revealing the outdoor scene. |
| 13.00–15.50 | "The goal is to watch wildlife with less disturbance." | Lateral tracking: drone in the mid-foreground, living birds beyond it over a wetland meadow; RESEARCH GOAL label. On "less disturbance" faint sound arcs around the drone diminish (no numbers, no "silent"). |
| 15.50–15.95 | — | A downstroke leads to a waterline wipe (a water surface edge sweeps up the frame). |
| 15.95–17.40 | "And they've built a swimming robot" | A pond at the waterline: a preserved MALLARD robot (clearly a different robot) swims right, leaving a small wake. |
| 17.40–18.40 | "using a preserved duck." | The camera dips to the waterline: a brief below-water schematic of the duck (3D-printed inner module, paddling feet); SCHEMATIC label. |
| 18.40–19.10 | — | Back at the surface, the duck continues; water crosses the foreground edge to carry the cut. |
| 19.10–20.60 | "So the bird watching the birds…" | The original flying drone again, foreground, against open sky; living birds fly beyond it. |
| 20.60–21.30 | — | A brief reveal of the same mechanism beneath its feathers (the same cutaway), then restored. |
| 21.45–22.60 | "might already be dead." | Exterior restored; it keeps flying (no freeze). |
| 22.60–23.60 | — | Loop seam: the near wing wipes across the frame and clears into the opening composition. |

Caption band: captions are screen-space at y ≈ 330 (top band). Keep subjects' important parts below y ≈ 470 and above
y ≈ 1500 (the Shorts title band), and x within 60–900 (action buttons on the right).

## Module contracts

Each builder owns ONLY its files plus test entries `source/src/test/<name>.entry.tsx` (`registerRoot` + Compositions at
1080×1920). Import `three.ts`, `rig.ts`, `lib.ts`, `art/palette.ts`, `core/*`, `dc/*` read-only.

### BIRD: the preserved exterior: `source/src/art/bird.tsx`

```ts
export type BirdLook = {
  cut?: number;            // 0..1: how far the flank cutaway is open (0 = closed, exterior intact)
  cutReveal?: (B: Basis) => string | null; // optional screen-space path limiting the open area (the film's wing-shaped wipe); null = whole window
  phantom?: number;        // 0..1: ghost the NEAR wing where it overlaps the open window (1 = about 35% opacity there)
  shellLift?: number;      // cm: exploded view, the whole shell (body, neck, head, beak, eye, tail) rises by this (wings stay on the spars)
  shellAlpha?: number;     // 0..1 (default 1)
  wings?: boolean;         // default true
  tone?: number;           // 0..1 atmospheric fade toward the background (distance), default 0
};
export const Bird: React.FC<{B: Basis; F: Frame; ps: Pose; look?: BirdLook; mech?: React.ReactNode}>;
export const WINDOW: [number, number][]; // the cutaway window on the near flank, body-local (x, y), at the near surface
export const birdHull: (B: Basis, F: Frame, ps: Pose) => V2[]; // a coarse screen-space silhouette (for masks/keep-outs)
export const NearWing: React.FC<{B: Basis; F: Frame; ps: Pose}>; // the near wing alone (for the film's wing wipes)
```

- A generic medium-sized brown bird (no particular species): warm brown back and coverts with darker feather bars,
  pale cream breast and belly, darker brown flight feathers with pale tips, a darker brown head with a paler cheek, a
  short dark pointed beak, a round glossy dark glass eye with a thin pale ring, a fan tail. It must read as a real bird
  at phone size, and as one smooth body (merge the BODY ellipsoids into one outlined silhouette; ink only the outer
  contour, with light interior form lines).
- Wings: rigid preserved wings clamped to the spars: draw from `WING_OUTLINE`/`FEATHERS` through `wingPt` (project
  every point with `proj`, not an affine matrix: the film passes a wing close to the lens). Dorsal side (`top` facing
  the camera) brown with feather bars and pale tips; ventral side pale (`underwing`). Feathers keep fixed lengths and
  overlaps. Where a wing meets the body, a soft feathered root, no seam.
- The cutaway: a window in the near flank (`WINDOW`, about x −3.5 … 8.5, y −6.2 … 5.4, shaped like a rounded
  wing-ish leaf), cut through the shell: a cream cut-face rim (`shellCut`) with thickness that reads in 3D, the far
  shell's clean inner surface (`shellInner`, smooth, no tissue) visible behind; the `mech` node is drawn between the far
  inner surface and the near shell. When `cut` = 0 nothing of it shows.
- `phantom`: where the near wing covers the open window, draw it at reduced opacity with its outline (a schematic
  "phantom" convention), so the drive stays readable while the wing keeps flapping; elsewhere the wing is solid.
- Test entry `src/test/bird.entry.tsx`: a sheet of 6–8 cells: side three-quarter (yaw 14, pitch 7, 20 px/cm) at flap
  phases 0, 0.25, 0.5, 0.75; the cutaway open with the phantom; a front-above view (yaw 25, pitch 20); the exploded
  view (shellLift 16); a close view at 60 px/cm on the wing root.

### MECH: the drive (SCHEMATIC): `source/src/art/mech.tsx`

```ts
export type MechLook = {
  rate?: number;        // gear B's angular speed (rad/s) at this frame: draws rotational motion blur on fast parts
  focus?: 'P0' | 'A' | 'P1' | 'B' | 'rod' | null; // optional emphasis (a soft warm rim/highlight on that part)
  detail?: number;      // 0..1: 0 = mid-distance simplification (opening cutaway at ~20 px/cm), 1 = close-up (60-120 px/cm)
  alpha?: number;
};
export const Mech: React.FC<{B: Basis; F: Frame; ps: Pose; look?: MechLook}>;
export const Cradle: React.FC<{B: Basis; F: Frame; base: V3}>; // the lab's padded two-U support under the body (body-local CRADLE), standing on the bench at `base` (world)
```

- Parts (all from `rig.ts`, nothing else): the motor can (steel with a blue band, dark end cap, two copper terminals
  with a red and a black wire running back out of view), its shaft and pinion P0; gear A (20T) with P1 (10T) on the
  same axle; gear B (30T) with the crank pin; the two connecting rods (with round eyes) from the pin to the levers on
  the two spars; the hinges on the top bar; the spars (dark carbon rods) running out through the shoulders; the
  skeletal back plate (anodised blue-grey) with lightening holes, the axles. Gears face-on in their planes via
  `planeMatrix`, with correct involute-looking teeth (simple trapezoid teeth are fine), a hub, 3–5 spokes or lightening
  holes, and ONE accent marker (`C.accent` dot) on P0, A and B so rotation reads. Rotation angles are exactly
  `ps.gear.*` (tooth phase included); never invent extra rotating parts.
- Motion blur: when `rate` is high (P0 turns 6× B), draw each fast gear as a few sub-frame copies over a 180° shutter
  (sub-frame angles from the rate) so teeth smear instead of strobing; the marker stays visible.
- Depth: draw parts back to front (motor can, plate, A + P0, P1 + B, pin, far rod, near rod, top bar and hinges,
  spars). Ink at constant width; brass gears with a warm gloss from the upper left.
- Must look good at ~20 px/cm (simplified: fewer teeth lines, still meshing) and at 60–120 px/cm (crisp detail).
- Test entry `src/test/mech.entry.tsx`: a sheet: the whole drive at 20 px/cm (yaw 14, pitch 7) at four crank angles;
  close-ups at 60 and 110 px/cm (yaw 10, pitch 5) on the gearbox and on the rod-to-lever joint; one cell with a high
  `rate` to show the blur; the Cradle under a body silhouette.

### WORLD: environments and living birds: `source/src/art/world.tsx`, `source/src/art/flock.tsx`

All drawn in the same 3D world through the shot's camera (parallax comes from the projection), with soft bokeh far
layers. Each environment exports a `Back` (behind the bird) and, where needed, a `Front` (in front: near grass, near
reeds, foreground water), each `React.FC<{B: Basis; t: number}>`:

- `FieldBack/FieldFront` (opening and loop): warm clear morning sky, soft distant hills/treeline (bokeh), a fence line
  of wooden posts and wire running along the flight path about 120–200 cm behind the bird's path (z ≈ −150), posts
  every ~260 cm along x, ground low in the frame (the bird flies at ≈ 140 cm above the ground, y = 0 is the bird's
  altitude, ground at y = −140). The first post passes behind the bird at about t = 0.5 s when the bird flies at
  300 cm/s along x from x = 0 at t = 0 (the film moves the camera with the bird).
- `LabBack/LabFront` (construction and close drive): a clean bench (top at y = `CRADLE.benchY` = −15.5 under a bird at
  the origin), a pale wall with a pegboard holding a few hand tools, a small desk lamp, a cutting mat. Soft, cool
  light; uncluttered behind the bird. Must hold up from a wide (12 px/cm) to a close (60 px/cm, mostly defocused
  background) framing.
- `MeadowBack/MeadowFront` (research goal): a wetland meadow edge in soft morning light: reeds and grasses, a far
  treeline, a sky with soft clouds; the drone flies ~ 200 cm above water/grass. Different look from the field.
- `SkyBack` (final callback): open sky with soft clouds and a low distant treeline; slightly warmer late light.
- `flock.tsx`: `Flock: React.FC<{B: Basis; t: number; birds: LivingBird[]}>` with `LivingBird = {o: V3 (at t=0), v: V3
  (cm/s), scale: number (1 = same size as the hero), phase: number, freq?: number}`: LIVING birds of the SAME generic
  look as the hero (same palette, same silhouette, simplified for small sizes), flapping naturally: varied frequency,
  wings that fold slightly on the upstroke, small body bob, occasional glide. They are alive and natural; they do not
  react to the drone, do not scatter, and have no labels.
- Test entry `src/test/world.entry.tsx`: one cell per environment at its typical camera, plus a flock cell.

### DUCK: the separate swimming prototype: `source/src/art/duck.tsx`

```ts
export type DuckLook = {cut?: number; /* 0..1 below-water schematic */ wake?: number};
export const Duck: React.FC<{B: Basis; t: number; o: V3; look?: DuckLook}>; // a preserved mallard drake robot floating at the waterline y = 0 at o, swimming +x
export const Pond: React.FC<{B: Basis; t: number; layer: 'back' | 'surface' | 'under' | 'front'}>; // the pond: sky/reeds above, the water surface, the underwater volume, a foreground water edge
```

- An unmistakable mallard drake (green iridescent head, yellow bill, white neck ring, chestnut breast, grey body,
  dark curled tail feathers) about 55 cm long, floating; passive (fixed glass eye, no head acting). It swims smoothly
  forward, leaving a small V wake and ripples.
- Below the waterline (in `cut`): its orange webbed feet paddle alternately (power stroke back with the web spread,
  recovery forward with the web folded); inside the lower body a clean light-grey 3D-printed module (a sealed housing
  with a small drive) linked to the feet by two simple pushrods. Keep it minimal and generic (the sources say only that
  it uses 3D-printed components and integrated sensors and leverages a mallard's natural locomotion; the film labels
  it SCHEMATIC). No propeller.
- The water: a clear surface line with a soft highlight band; underwater a teal volume with light shafts and a few
  motes; at `cut` the camera sits at the waterline so the frame is split above/below.
- Test entry `src/test/duck.entry.tsx`: surface view (yaw 10, pitch 6, 14 px/cm) at three times; the waterline split
  view with `cut` = 1 at two times; the pond layers.

## What the film (not the modules) does

Cameras, timing, transitions (wing wipes, match cuts, the waterline wipe), captions, the two scope labels, the sound
arcs, depth-of-field and the loop are composed in `source/src/story.ts` and `source/src/Film.tsx`.
