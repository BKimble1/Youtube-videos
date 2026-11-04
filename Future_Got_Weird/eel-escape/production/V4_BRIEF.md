# Eel Escape V4: build brief and module contracts

V4 replaces V3's single-fish-profile film with a **new shot sequence**: distinct settings and perspectives, new
drawings for the stomach, the throat, the gill gap, the trapped head and the open-water escape. The narration is
unchanged (the locked master, `audio/narration/FGW_Eel_Escape_narration_V1.wav`; word times in
`source/src/data/timeline.json`). Output: `exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`, 1080 × 1920, 30 fps, 744
frames, 24.80 s.

The viewer follows **one eel through one continuous escape** and always knows which end leads: a narrow, tapered
tail and a slightly broader, recognizable head with a visible eye, in every view, including the X-ray and every
interior.

## 1. Shared rules (every module)

- **Style: the Weird Crew vector finish**, as in V3 (`source/src/art/*.tsx`):
  - navy ink `INK` (`art/palette.ts`) of constant on-screen width (`vectorEffect="non-scaling-stroke"`, about
    `INK_PX` = 2.8 px for main contours, thinner for details);
  - flat cel shading: base, one or two shadow tones, a highlight;
  - light from the **upper left of the screen**;
  - clean shapes, no photo textures.
  - Use `art/palette.ts` colours. New colours go in your own module as named constants, derived with
    `core/color.ts` (`mix`, `lit`).
- **Banned:** no arrows, labels, text, inset circles, X-ray grids, UI graphics. Captions are the only text, and the
  film adds them.
- **Deterministic:** no `Math.random`. Use `hash` and `noise1` from `lib.ts`. Every frame is a pure function of `t`.
- **SVG ids:** unique per frame. Use `uid()` from `core/ids.ts`; the frame calls `resetIds`.
- **Cost:** a frame should render in well under 1 s in Chrome. Avoid full-frame blur filters; use a filter only on
  small regions, with `filterUnits="userSpaceOnUse"` and an explicit region. Prefer layered translucent shapes for
  softness.
- **The eel:** always the V4 eel from `source/src/v4/eelV4.tsx`.
  - Body plan: 54 eel units long, 121 samples snout → tail tip, `RADII`, eye scale `EYE_SCALE`.
  - 2D drawings use `Eel2D` (pass `k` = drawing units per eel unit and `px` = screen px per drawing unit), with
    `alongPath()` to lay the body on a route (the tail leads when `sTip` increases).
  - 3D shots use `Eel3D` with a `Basis` from `v4/three.ts`.
  - Never draw a second eel, never run it visibly backward, and never draw it at a different length or with a
    different head.
  - The renderer (`art/eelArt.tsx`) draws the head (eye, mouth, gill slit, pectoral fin), the ribbon fin and the
    pointed tip. It takes `from`/`to` sections for occlusion (a part behind an anatomical structure) and `clip`.
- **Captions:** the top band, centred at y = 340 (`CAP_Y`). Every shot keeps the eel and the gill gap **below
  y = 500 (`KEEP_Y`)**, and exports `keepOut(t): KeepOut` (eel samples with screen radius, and the gap polygon
  when visible) so the film can check it on every frame.
- **Do not edit shared files:** `v4/eelV4.tsx`, `v4/timing.ts`, `v4/three.ts`, `art/eelArt.tsx`, `art/palette.ts`,
  `anatomy.ts`, `lib.ts`, `core/*`, and everything V3 (`Scene.tsx`, `story.ts`, `eel.ts`, `art/*.tsx`). Read and
  import them freely. If you need a change, say so in your final report.
- **Your files:** only the files named in your package, plus your own test entry `src/v4/test/<name>.entry.tsx` and
  scratch output outside the repo.
- **Stills:** `cd source && npx remotion still src/v4/test/<name>.entry.tsx <Comp> /path/out.png --props='{"t":5.9}' --log=error`.
  The browser is configured in `remotion.config.ts`. The machine has 4 CPUs shared by several builders, so do not
  render full videos; contact sheets of stills are enough. A sheet composition that lays several times out on one
  canvas (see `src/Film.tsx` `Sheet`) is the fastest way to check motion.
- **Units and world:** the predator's own frame (V3 `anatomy.ts`, kept for V4).
  - The predator is a dark sleeper (*Odontobutis obscura*), 100 u long, facing −x (snout x = −50, caudal tip
    x = +50).
  - y is down: the back is at about y = −12.9, the belly at about +12.4, and the riverbed is a plane at
    y = +12.95.
  - z points toward the near side, the side with the gill exit.
  - The gill exit (where the eel passes) is `EXIT` = (−23.55, −6.35, +6.4), on the gill cover's rear edge
    (`OPERCLE_EDGE`).
  - The water current flows +x (head to tail).
  - 3D cameras: `v4/three.ts` (`Cam3`, `basis`, `proj`, `orbitCam` (az 0 = from the near side, +90 = from behind the
    tail, el + = from above), `lerpCam`).

## 2. The shot sequence (global times, `v4/timing.ts`)

| Shot | Window (s) | Narration | What we see | Owner |
|---|---|---|---|---|
| S1 OPEN | 0 – 2.62 | "That tail sticking out of this fish / belongs to the eel" | **Rear three-quarter just behind the predator's cheek:** its eye, gill cover and some body. A substantial length of eel tail already protrudes from under the cover in a loose S. On the first beat the cover breathes once and the tail flicks independently across it. On "belongs" we follow the tail to the gill edge; a breath lifts the cover and the SAME body shows continuing inside. | integrator |
| S2 GULP | 2.62 – 3.84 | "it just swallowed." | A short **side view of the earlier gulp**, the body curve matched to S1's at the cut. The predator closes its mouth (3.18) and the eel disappears inside. | integrator |
| S3 XRAY | 3.84 – 5.78 | "Scientists filmed it on X-ray." | **A research tank:** the fish crosses an X-ray field. The full skeletal profile lasts just long enough to establish the stomach's location: the eel coiled in it, head and eye deepest, tail toward the throat. The eel's moving tail carries the camera through the silhouette (hand-off 1). | builder **X** |
| S4 STOMACH | 5.78 – 8.90 | "Inside the fish's stomach, / the eel starts backing up." | **A newly drawn stomach interior:** close walls, a curved chamber, the eel coiled in the foreground. On "starts backing up" (7.49) its recognizable head stays in view while the tail probes along the wall and finds the opening (≈ 8.2), then the camera follows the tip through (closest push: a discovery). | builder **S** |
| S5 THROAT | 8.90 – ≈10.45 | "Its tail slides up the fish's throat," | Alongside the tail inside a **narrow passage**. The moving body briefly fills the foreground; as it passes, it reveals S6. | builder **G** |
| S6 GILLS | ≈10.45 – 12.58 | "slips through a gap in the gills," | **A new angle looking toward the gill structures.** The eel turns sideways through a real gap between two arches, its body continuous as it threads through (closest push: a discovery). Then the tip crosses toward the gill edge. Not V3's circular red window: the opening is anatomy. | builder **G** |
| S7 POKE | 12.58 – 13.86 | "and pokes out the side." | **Match cut:** the tip crossing the gill edge from inside → the same tip breaking into open water. Same motion, same screen position, new space (hand-off 2). | integrator |
| S8 FOLLOWS | 13.86 – 15.96 | "Then the rest of its body follows." | **Slightly elevated, over the predator's back:** a growing length of eel slides out and bows into the current, showing how much has escaped. | integrator |
| S9 HEAD | 15.96 – 17.96 | "Its head comes out last." | **Tight at the gill edge:** the eel's EYE just inside, its neck through the gap, the rest of its body curling outside, all in one composition (closest push: a discovery). | integrator |
| S10 RELEASE | 17.96 – 21.30 | "The eel curls up outside the fish, / gives one final pull," | **Low, beside the fish:** the outside body forms a loose curve in front of us. On "pull" (20.82) the curve tightens, the head slips free (the ONLY release) and the body straightens into its first swimming stroke. The predator stays alive and moving. | integrator |
| S11 SWIM | 21.30 – 24.30 | "and swims away / from the animal that just ate it." | **Track alongside the escaping eel through foreground reeds,** the predator receding behind it; real distance opens. | integrator |
| S12 LOOP | 24.30 – 24.80 | — | A reed passing close to the lens wipes back to frame 0 (the gill edge and the tail flick). | integrator |

Sound (integrator): ambience, plus restrained accents at the gulp (3.18), the change into the X-ray view (the field
edge, about 4.0, and/or the full profile at 4.94), and the release (20.82).

## 3. Hand-off contracts (screen space, `v4/timing.ts`)

- **Hand-off 1, S3 → S4 (`carryTail(t)`, t ∈ [5.62, 5.94]):** the eel's last 12 eel units, in screen px (55 px per
  eel unit), sweeping up and to the left.
  - Both shots draw their eel so that samples `i0..120` lie on exactly these points in that window. Blend into the
    contract before 5.62 and out of it after 5.94, smoothly.
  - The film dissolves S3 → S4 over 5.72–5.84, so the tail is the one constant: it carries us in.
- **Hand-off 2, S6 → S7 (`pokeTail(t)`, t ∈ [12.44, 12.72]):** the tail tip crosses the gill edge `EDGE` (a screen
  polyline) at `POKE_AT` = (540, 1010) at 12.58.
  - The tip moves along `POKE_DIR` at 240 px/s; the last 8 eel units are at 60 px per unit.
  - Inside (G): the edge is the rim of the gill opening against the bright water beyond; the chamber is on the
    lower-left side of the edge, the outside on the upper-right.
  - Outside (integrator): the gill cover's rear edge. It is a hard cut at 12.58.
- **Hand-off 3, S4 → S5 (dark lumen):** at 8.90, ≥ 85 % of the frame is the opening's dark lumen (`LUMEN`
  `#2B0D11`) as the camera follows the tip in. S5 opens out of the same dark. The film dissolves over 8.85–8.95.

## 4. Work packages

### P: the 3D predator (`src/v4/art/pred3d.tsx`)

One model of the dark sleeper, drawn through any `Basis`, so every exterior shot shows the same animal.

- **Geometry:**
  - **Body:** a loft of cross-sections along x.
    - Use the V3 dorsal and ventral profiles (`anatomy.ts` `DORSAL`, `VENTRAL`, `CAUDAL`) for the top and bottom
      edges.
    - Add a half-width profile: the head is broad and a little depressed (about 7.5 u half-width at the cheeks,
      x ≈ −30), about 5.5 at x = 0, about 3 at x = +25, and the peduncle about 1.8. Use superellipse-ish sections
      (flatter belly).
    - Must match `fish.tsx` in side view (compare a pure side view, az 0, with `FishBody` at the same scale;
      silhouettes should coincide closely).
  - **Gill cover (operculum), both sides:** its rear free edge follows `OPERCLE_EDGE` on the body surface and can
    **flare** outward (`gill` 0..1: hinge at the front, the rear edge lifts by up to about 3.5 u at the top).
    - Behind it is a dark red **gap** with gill filaments (a fringe of red lamellae) visible in it. At `gill` ≥ 0.6
      you can see into it.
    - The near-side edge must pass through `EXIT` at rest. The geometry function returns where the exit point moves
      when the cover flares.
  - **Mouth:**
    - Closed: the V3 cleft (`MOUTH`), with a jutting lower jaw.
    - `mouth` 0..1 opens the jaws wide (lower jaw drops and the gape widens, as in suction feeding), showing a dark
      interior (pharynx).
    - Must read in the side view (S2) and at three-quarter.
  - **Eye:** gold iris, black pupil, a highlight. A `look` target shifts the pupil (the predator watches the eel).
  - **Fins (amber, rayed, translucent membranes, moving):** first dorsal (spiny), second dorsal, caudal (rounded),
    anal, pelvics and pectorals (fan-shaped, behind the cover, fanning).
    - Positions: `anatomy.ts` (`DORSAL1`, `DORSAL2`, `ANAL`, `PECTORAL`, `PELVIC`, `CAUDAL`) and `fish.tsx` shapes.
    - `finPhase` drives undulation; `startle` 0..1 raises and spreads them.
  - **Markings:** the V3 olive-brown mottling (dark saddles across the back, flank blotches, fine speckle, the
    pale belly), mapped onto the surface so they stay put as the camera moves. Draw only the visible
    (front-facing) parts.
  - **Body bend:** `bend` (a lateral curve of the body toward +z or −z, in radians of total turn at the tail) and a
    small idle sway. A gentle swimming bend for S11, where the predator recedes.
- **Drawing:**
  - Silhouette: one clean ink outline of the union of the projected body and fins.
  - Cel shading in screen space (light from the upper left): strip polygons between band boundaries on the visible
    side of each section (as the eel renderer does), so band edges are smooth curves and not faceted.
  - The body's far-side features are hidden. Depth order: far fins, body, near fins and cover; midline fins in
    front of or behind the body, decided by their depth.
- **API (exactly these names, so the integrator can build against them now):**
  ```ts
  export type PredPose = {t: number; gill: number; mouth: number; bend: number; finPhase: number; startle: number; look: V3 | null};
  export const PRED_REST: PredPose;
  /** the whole predator in SCREEN px for this camera (wrap nothing around it) */
  export const Predator: React.FC<{B: Basis; pose: PredPose; dim?: number}>;
  /** geometry for compositing the eel against the predator (all screen px unless noted) */
  export const predGeom: (B: Basis, pose: PredPose) => {
    outline: string;            // path d: the body outline (no fins), for occlusion
    gap: string;                // path d: the visible near-side gill gap (the opening under the cover's rear edge); '' if not visible
    mouthHole: string;          // path d: the open mouth's dark interior; '' when closed or not visible
    exit: {p: V3; out: V3; n: V3};  // WORLD: the exit point on the near cover's rear edge (moves with the flare), the outward direction from under the cover, the cover's surface normal
    mouthIn: {p: V3; dir: V3};  // WORLD: the centre of the gape and the direction into the throat
    eye: {x: number; y: number; r: number};
  };
  ```
  `dim` (0..1) is an optional darkening for the far, receding predator.
- **Test entry:** `src/v4/test/pred.entry.tsx`. Deliver a contact sheet of these cameras:
  - S1: rear three-quarter behind the cheek (for example `orbitCam({target: [-27, -5, 4], az: 58, el: 12, d: 46, f: 1250})`), with the cover breathing at `gill` 0, 0.4 and 1;
  - S2: pure side view, mouth 0, 0.5 and 1;
  - S8: elevated over the back (az 25, el 50);
  - S9: tight on the gill edge (about 14 u wide), `gill` 0.8;
  - S10: low beside (az 10, el −12, close);
  - S11: distant at az −30 with bend.
  Compare the side view with `FishBody` (V3). The model must hold up both at about 150 px/u on the gill edge and at
  about 6 px/u in the distance.

### W: the open water and the reeds (`src/v4/art/world3d.tsx`)

The exterior environment for every outside shot, in the same world and drawn through the same `Basis`.

- **`WorldBack({B, t})`:** the water volume.
  - A colour gradient that depends on where the camera looks: brighter toward the surface above, deeper and bluer
    toward the distance; use `C.waterTop`, `waterMid`, `waterDeep`, `haze`.
  - The riverbed plane (y = 12.95): sand, pebbles and stones in perspective, fading into haze.
  - Soft light shafts from the surface, distant silhouettes of plants and stones.
- **`WorldFront({B, t})`:** drifting motes in 3D (current +x), plus near plants that pass in front.
- **`PredShadow({B, pose})`:** a soft contact shadow under the predator on the bed (an ellipse in 3D).
- **Reeds:** clumps of tall, ribbon-like aquatic plants (eelgrass or bur-reed style; green-olive in cel shade with
  ink outlines) that sway in the current, placed in 3D.
  - The default field keeps clear of a zone around the predator (|x| < 60, z < 16) but surrounds it, especially
    on the near side (z from 20 to 160, x from −120 to 120), where S11 tracks the eel through them.
  - Export `REEDS` (the placements) and `Reeds({B, t, near: boolean})`: back reeds (behind the subject) and front
    reeds (between the camera and the subject) split by a `zSplit` camera depth you accept as a prop.
  - Foreground blades close to the lens should read as soft, dark, out-of-focus shapes (cheap: low-opacity layers,
    no big blur filters).
- **`ReedWipe({t, t0, t1})`:** a screen-space reed blade that sweeps across the frame from right to left, very close
  to the lens, over [t0, t1] (≈ 0.4 s). Also export `reedWipePoly(t, t0, t1)`: the screen polygon of the region
  already passed (to the right of the blade's trailing edge), so the film can show frame 0 there. The blade must
  cover the seam.
- **Test entry:** `src/v4/test/world.entry.tsx`. Show stills from the cameras listed for P (a simple placeholder
  ellipsoid fish is fine) and a tracking sequence: the camera moving along +z at about 20 u/s with reeds passing.

### X: the X-ray tank (`src/v4/shots/S3Xray.tsx`)

The shot from 3.84 to 5.78 (render 3.6 – 6.0).

- **Setting: a research tank.** Glass walls with clean edges and a water line, a dark lab beyond, the X-ray emitter
  and detector as simple boxy housings framing the **field**.
  - The field is a region of the tank where everything shows as a radiograph: a dark blue-black ground, glowing
    soft tissue, bright bones.
  - The fish (facing left) crosses into the field. The part inside is radiograph; the part outside is the normal
    predator (use V3's 2D side art `FishBody`/`FishFar`/`Operculum`/`Pectoral` from `art/fish.tsx`, which shares
    the predator design).
  - The change into the X-ray view must read as a distinct moment; the integrator places a sound there, so report
    the time.
  - No grids, no text, no inset circles.
- **The radiograph:** use V3's `XRayBack` and `XRayFront` (`art/xray.tsx`), which are on the same outline. On
  "X-ray" (4.94) the whole fish is inside the field: **the full skeletal profile**, just long enough to establish
  the stomach's location.
- **The eel inside:**
  - Coiled in the stomach (the V3 `STOMACH` region; see `anatomy.ts` and `eel.ts` `STOMACH_FOLD` for a folded
    route), head deepest and the tail toward the esophagus.
  - Glowing, since the study made the eels visible with a contrast agent.
  - Its **head and tail must be distinct in the radiograph:** a brighter, broader skull with the eye as a ring, and
    a tail that tapers to a fine point. Draw it as a radiograph from the V4 body (samples plus `RADII`; `eelSilhouette` from `art/eelArt.tsx` gives an outline) rather than the slate-blue `Eel2D`.
  - The tail moves (stirs and sweeps).
- **Camera:** establish (tank, field, fish crossing), then the full profile, then **push toward the stomach
  following the moving tail** so the tail carries the camera through the silhouette. End on hand-off 1 (`carryTail`):
  the eel's last 12 units on those screen points, 5.62–5.94.
- **Captions:** "Scientists filmed it on X-ray." in the top band. Export `keepOut(t)`.
- **Exports:** `export const S3Xray: React.FC<{t: number}>` (a full-frame `<svg width=1080 height=1920>`),
  `keepOut`, and `XRAY_CHANGE_T` (when the field change reads).
- **Test entry:** `src/v4/test/xray.entry.tsx`, a sheet every 0.15 s.

### S: the stomach (`src/v4/shots/S4Stomach.tsx`)

The shot from 5.78 to 8.90 (render 5.5 – 9.1).

- **A newly drawn stomach interior,** visually distinct from the tank. In the Weird Crew style (illustrated, warm,
  readable, not gory):
  - close, curved walls with soft rugae folds and wet highlights;
  - a curved chamber;
  - the light source implied from the upper left.
  - The **opening** (the entrance to the esophagus): a puckered, ring-like opening in the chamber wall, with a dark
    lumen.
- **The eel:** coiled in the foreground, one continuous body (`Eel2D`; for crossings use `over`). Its
  **recognizable head (broad head, big eye)** stays in view the whole time.
- **Action:**
  - From the start (hand-off 1, 5.62–5.94) the tail is the carried tail; then it settles into the coil.
  - "Inside the fish's stomach" (5.80–6.99): we see where we are.
  - **"starts backing up" (7.49):** while the head stays in view, the tail tip probes along the wall: it slides,
    touches folds, turns and searches, then **finds the opening (≈ 8.2)**. The viewer gets to see how it finds the
    route: the opening yields as the tip pushes in.
  - Then the tip goes through and the body slides after it (tail first). The camera follows the tip through: the
    closest push, a discovery.
- **End:** hand-off 3. By 8.90 the dark lumen fills ≥ 85 % of the frame.
- **Captions:** 5.76–7.15 "Inside the fish's stomach," and 7.15–8.79 "the eel starts backing up." in the top band.
  Export `keepOut(t)`.
- **Exports:** `export const S4Stomach: React.FC<{t: number}>` (full-frame svg) and `keepOut`.
- **Test entry:** `src/v4/test/stomach.entry.tsx`, a sheet every 0.15 s.

### G: the throat and the gills (`src/v4/shots/S5Throat.tsx`)

The shots from 8.90 to 12.58 (render 8.7 – 12.8), as ONE module.

- **S5 (8.90 – ≈10.45), the throat:** out of the lumen's dark (hand-off 3), into a **narrow passage** (the
  esophagus: a tube with longitudinal folds).
  - The camera moves alongside the tail as it slides up the throat: the tip leads, the body follows.
  - Near the end, the moving body passes close to the camera and **fills the foreground briefly**. As it passes,
    it reveals S6.
- **S6 (≈10.45 – 12.58), the gills:** a new angle **looking toward the gill structures** from inside the pharynx.
  - The gill arches are curved bars with comb-like rakers on the inner edge and a red fringe of filaments, with
    the slits between them.
  - Beyond the slits is the opercular chamber, with light from the gill opening.
  - On "slips through a gap" (10.89, "gap" 11.47) the eel **turns sideways through a real gap between two arches**.
    Its body is continuous as it threads through: the part already through shows beyond the arch bars and is
    occluded by them; the rest is in front. This is the closest push.
  - Then the tip crosses the chamber to the gill opening's rim.
  - No circular window: the opening is part of the anatomy.
- **End:** hand-off 2 (`pokeTail`, `EDGE`, 12.44–12.72). The tip crosses the rim at `POKE_AT` at 12.58, moving
  along `POKE_DIR`. The chamber side of the edge is lower-left; beyond it, bright water.
- **Captions:**
  - 8.79–10.85 "Its tail slides up the fish's throat,"
  - 10.85–12.31 "slips through a gap in the gills,"
  - 12.31–13.84 "and pokes out the side."

  All are in the top band. Export `keepOut(t)`.
- **Exports:** `export const S5Throat: React.FC<{t: number}>` (full-frame svg) and `keepOut`.
- **Test entry:** `src/v4/test/throat.entry.tsx`, a sheet every 0.15 s.

## 5. What every builder reports

Report in the final message:

- the files written;
- the exported API;
- the times of key beats in the shot;
- the contract checks, with numbers (e.g. the carried-tail RMS distance in px at 5.62, 5.78 and 5.94);
- the keep-out check: the minimum eel and gap y over your window;
- the measured still render time;
- the paths of your contact sheets;
- anything you could not do.

Do not commit; the integrator commits.
