# Video 02 · Assessment of the opaque plates A05, A06, A06b, A07, A08, A12

Assessed 8 October 2026 against the shots as they are being built (work/S1, S6 and S7 are in progress; S2, S5, S8
and S9 are still stubs). Not covered here: A10, A11 (Runway plates) and A13 (thumbnail). Nothing under `source/` or
`work/` was edited. Scratch work (renders, overlays, venv, traced SVGs, scripts) lives in
`/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/art_assess/backdrops/`
(`$B` below). That folder is session-scoped, so copy the evidence images out if they need to outlive the session.

## Verdict

| Asset | Decision | Shots it could serve | Why, in one line |
|---|---|---|---|
| A05 room plate | **reference_only_no_change** | S1.1–S1.3, S8.1, S8.3 (the only tilt-0 room shots) | It is a perspective redraw of our own `kit_room_view` and can't be registered to `lib/room.ts`. The partition is baked in at the wrong plan position. Every tilt-0 window is continuous with a camera rise (so the plate would pop), and it is softer than the code set at 4K. |
| A06 mirror room | **not_used** | (S2.2) | Same problems as A05. The mirror is static (S2.2 slides it on), sits at x 1.70–2.38 m (requested 1.9–2.6), and S2.2 is a raised (tilted) view. |
| A06b mirror panel | **upgrade_code_rig_from_reference** | S2.2 | As a bitmap on the wall plane it registers and occludes correctly, but its outlines are half weight, its glass is off-palette, it is squashed by the tilt, and it can't layer the reflection under its shine strokes. A code mirror in its design takes ~25 lines and is exact. |
| A07 wall cross-section | **upgrade_code_rig_from_reference** (plate is an acceptable fallback backdrop at zoom ≤ 1) | S2.3 (s11) | The best plate. The paint surface is extracted to `art/A07_surface_profile.json` (sub-pixel, with normals). Draw it in code from that profile so it is crisp at 4K and the drawn surface *is* the reflecting surface. |
| A08 warehouse corner | **not_used** | S7.1, S7.3, S7.5 (work/S8) | It was generated from our own `kit_warehouse_view` frame: it only covers the camera-1.34 framing and can't follow the S7.2 tilt. It lacks the stop bar and the walkway lines that are part of the geometry, its boxes differ from the code set (swap pop), and it adds nothing the code `WarehouseSet` lacks. |
| A12 history shelf | **upgrade_code_rig_from_reference** | S5.1–S5.4 (work/S5), S6.1 | Its style clashes with the museum already built in S6.1 and S7.4 (`PLINTH` style). Its content contradicts the storyboard (closed laptop, no raster wall, no clock, no 2021 laser, mannequin not hidden). The exhibits must animate, and per-exhibit trucks magnify it 4–5x in 4K. Use its object designs to draw the S5 exhibits in code. |

None of the six plates is recommended as a backdrop. They were all generated at 1672×941 and Lanczos-resized to 1920×1080. The opaque room and warehouse plates are close redraws of the code sets they were referenced from: same layout, slightly different geometry, softer lines. They cannot tilt, move or re-occlude. The real value of the batch here is design reference where no code exists yet: the mirror (A06b), the wall cross-section (A07) and the four museum exhibits (A12).

## 1. How the candidate shots are actually built

Shared facts (from `lib/room.ts`, `lib/shots.ts`, `lib/camera.tsx`, the scene code and QA sheets):

- **Projection.** At tilt 0 the room view is a parallel oblique projection: 340 px/m, floor foreshortened to 0.35, shear 0.26, anchor (960, 545), pivot (2.0, 1.5, 1.0). Every receding line has the same slope, dx/dy = 0.743. `viewAt()` changes elevation, shear, scale and anchor continuously with tilt; a bitmap can't follow that.
- **Cameras.** `CAM_ROOM` is zoom 1.2 (2.4x plate magnification in the 3840×2160 master). The S1.2 push is 1.296 (2.6x), `CAM_RAISED` 1.25 (2.5x), S7's `CAM_SCAN` 1.6 (3.2x), the S6.1 plinth push 1.12 and the S7.4 museum push 1.1. The warehouse kit push is 1.34 (2.7x).
- **Tilt-0 room on screen.** S1.1–S1.2 runs from f0 to f≈298, with the push in S1.2. S1.3 cuts back at f≈601, and the rise to `RAISED_TILT` 0.4 starts at s04+2 = f632. In S9 (storyboard S8.x, still a stub), s45 (f11184–11238) is a room view, s46 is raised, and s47 plus the hold (f11493–11717) is a room view in which the guesser pushes the partition to the wall (R4). Every other room shot is raised: S1.4–S1.7, S2.2, S2.4, S3.1 and S7 (S6.9–S6.10, `RAISED_TILT` with `CAM_SCAN`). S4.1 folds 0→1.
- **Animation inside the set.** The partition wobbles in S1.4 at the contact on "through" and is pushed to the wall in S8.3. The mirror slides on in S2.2. The exhibits animate in S5: the mannequin's 3D outline, the raster spot, the laptop's "1 s", the clock, the monitor video, the "5 frames/s" counter and the velvet rope. The checker's arm sets the sensor on plinth 4 in S6.1. In the warehouse, the robot rolls and the person walks out from behind the L corner.
- **Occlusion.** `RoomSet` depth-sorts the people, the partition and the plant every frame (`depthSort`). The guesser at H (2.6, 0.85) is painted *before* the partition, which covers his left side. Light paths go in the `backdrop` slot so the standing things cover them exactly. A baked partition removes all of this.

Asset → shot map (storyboard IDs; the work folder in brackets):

| Asset | Requested for | Real storyboard shot | Built? | View / camera | Blocking facts |
|---|---|---|---|---|---|
| A05 | S1.*, S2.1, S8.* | S1.1–S1.3 (work/S1), S8.1, S8.3 (work/S9) | S1 in progress; S9 stub | tilt 0, `CAM_ROOM` 1.2, push 1.296 | rise at f632; the partition is pushed in S8.3; S8.2 is raised between S8.1 and S8.3 |
| A06 | S2.1 | S2.2 "mirror slides on" (work/S2) | stub | raised (`RAISED_TILT`, `CAM_RAISED`) | tilt; the mirror slides |
| A06b | overlay | S2.2 | stub | raised | see §2.3 |
| A07 | S2.2 | S2.3 wall close-up, s11 (work/S2) | stub | flat close-up, no tilt | none; a push-in is likely |
| A08 | S7.1, S7.3, S7.5 | the same (work/S8) | stub | front view; S7.2 tilts to plan between them | tilt; the corner must occlude the person |
| A12 | S5.*, S6.1 | S5.1–S5.4 (work/S5), S6.1 (work/S6) | S5 stub; S6.1 built with its own `MuseumSet` | trucks to each exhibit | style continuity with S6.1 and S7.4; the exhibits animate |

(The art request's S2.1/S2.2 labels are off by one against storyboard v2: the mirror slide is S2.2 and the wall close-up is S2.3.)

## 2. Registration tests

### 2.1 A05 against the RoomSet at tilt 0

Evidence:
- `$B/out/A05_vs_RoomSet_t0_overlay50.png`: as delivered over our tilt-0 render in world px.
- `$B/out/A05_floorReg_vs_RoomSet_overlay50.png`: warped by a 4-corner floor homography.
- `$B/out/A05_affineReg_vs_RoomSet_overlay50.png`: scale-only fit that keeps verticals vertical.

Our render was made in a scratch copy of the project (`$B/rproj`, `RoomProbe` composition) with `RoomSet tilt={0}` and DEFAULT_VIEW.

- **As delivered.** The back floor line is at y 656 against our 706. The room is 1502 px wide against our 1360, and the left edge is at x 82 against our 147.
- **The plate is not a parallel projection.** A Hough fit of the floor's receding lines gives dx/dy of 0.537 (left slab edge), then 0.554, 0.573, 0.595, 0.662 and 0.695 for the planks, and 0.708 bending to 0.781 for the right floor edge. The lines fan out, so the plate has mild perspective, and its right floor edge is bent. Ours are all 0.743. No single 2D warp maps it onto our projection.
- **Floor homography** (BL 82.5,657 / BR 1584,656 / FL 295,1039 / FR 1852,1037 → plan corners). The floor fits by construction, but every vertical then leans about 5°. The partition's far top lands at (905, 285) against ours at (885, 206), so it is 79 px short. The right wall's front-top corner is 49 px off.
- **Plate partition in plan** (through the floor homography): it runs from the far foot at x 2.21, z 0.84 to the near foot at x 2.34, z 2.34. It is not perpendicular to the wall (4.4°) and sits 0.2–0.35 m right of ours (x 2.0, z 0.65–2.15). The gap at the wall is 0.84 m against our 0.65. The hider would stand 0.39 m from the drawn screen instead of 0.6 m. The checker's "blocked" sight line, the partition silhouette used for path clearance (S1's `pickWall` requires 18 px), and the depth order all come from layout.json, so they would not match the drawn partition.
- **Best verticals-preserving fit** (sx 0.894, sy 0.936). Floor corners are off by up to 41 px. The partition is 100 px right of ours at the far foot and 131 px right at the near foot, and its top is 111 px lower.
- **Exposed edges.** The registered plate covers only world x 107–1824 and y 92–1103. `CAM_ROOM` exposes its left edge, the S1.2 push and `CAM_SCAN` expose its top edge, and zoom 1 exposes three sides. The DIRECTION rule "walls and floors extend well past the frame" can't hold.
- **The plant and door are re-imagined.** The plant is at plan (0.33, 0.53) against (0.4, 0.32), with a different leaf set. The door runs into the front cut edge.
- **A05 and A06 are not pixel-identical.** Outside the mirror, 84,165 px (4.3 %) differ by more than 30 (sum of RGB), across the whole frame. A cut or dissolve between them would make every line jump.

Conclusion: A05 is unusable as a registered backdrop. If it were used anyway in the tilt-0 windows (about 12 s in total), the drawn partition would need a hand matte to occlude the guesser. The plate would then pop to the SVG room the moment the camera rises (S1 at f632, S9 at s46), and the room would visibly change between S1.2 and S1.4: partition position and angle, plant, planks and door. Joke J4 (S8.3) needs the partition to move, so the baked one can't serve it.

### 2.2 A06 mirror placement

Evidence: `$B/out/A06_vs_RoomSet_t0_mirror_overlay50.png`.

Using the plate's own wall scale (82.5 px = 0 m, 1584 px = 4 m), the A06 mirror spans x 1.70–2.38 m, with glass from 1.73 to 2.35. Its right edge is hidden by the plate's partition. Vertically it spans about h 0.32–1.28 m. The request was x 1.9–2.6 m. The sensor-to-him reflection point is x ≈ 2.14 m, so it still falls inside, but the mirror is static and the room is A05's, with all of §2.1's problems.

### 2.3 A06b on our back wall (raised view)

Evidence:
- `$B/out/A06b_overlay_vs_code_mirror_raised_full.png`
- `$B/out/A06b_vs_code_mirror_4k_crop.png`

Probe: `$B/rproj/src/MirrorProbe.tsx`. The panel (alpha bbox 696,179–1223,900, 528×722 px) is mapped onto the wall plane at x 1.9–2.6 m and h 0.40–1.36 m with `planeMatrix`, inside RoomSet's `backdrop` slot, at `RAISED_TILT` with `CAM_RAISED`, rendered at scale 2.

What works:
- **Occlusion is free.** The partition and people paint over it.
- **The slide is just an animated x origin.**
- **Resolution is adequate.** At `CAM_RAISED` in 4K the panel is about 1:1 horizontally.

What doesn't:
- **Squash.** The tilt squashes it to 0.71 vertically.
- **Outline weight.** Measured at 4K, its outlines are 7 px on vertical edges and 5 px on horizontal edges. The code strokes beside it are 9–10 px: half weight on the horizontals.
- **Glass colour.** The glass is #AFD9FC, a saturated sky blue that is not in the palette (`C.blueLight` is #D3E1F8).
- **Shine strokes.** They are baked into the glass, so the guesser's reflection (code) can't sit under them.
- **Placement height.** At h 0.7–1.66 m the mirror is cropped by the top of `CAM_RAISED`. The low placement (h ≈ 0.4–1.36, as A06 has) fits.

A code mirror at the same place (cream frame, 4 px ink with `vectorEffect="non-scaling-stroke"`, `C.blueLight` glass, two cream shine strokes, glass as a clipPath for the reflection) is shown beside it in the same renders.

### 2.4 A08 against the WarehouseSet

Evidence:
- `$B/out/A08_vs_WarehouseSet_t0_overlay50.png`: against world px at zoom 1. No fit.
- `$B/out/A08_vs_kitWarehouseView_cam134_overlay50.png`: against the packet reference, rendered at camera (890, 590, 1.34). It fits.

A08 is a redraw of that reference frame:
- The near-rack uprights (x 160–190, 637–668, about 1113–1130) and the upper three beams register within about 3 px.
- The rack base and bottom beam are 20–40 px off, and the corner guard is about 35 px low.
- The end of aisle B and the S2 run differ.
- The boxes are re-arranged.
- The floor markings differ: there is no stop bar at x 2.98–3.16 m, a single L-shaped lane line replaces the aisle-A lane and the aisle-B walkway pair (x 4.12/4.88 m), and there are no arrows.

The plate only covers the 1.34 framing (world x 174–1606, y 187–993), so the camera could never be wider. S7.2 tilts to plan between S7.1 and S7.3. The person in aisle B must be hidden by the corner and then step out, which would need a hand matte of the S1/S2 corner.

### 2.5 A07 (flat close-up)

Nothing to register to: the close-up is a new flat composition. The profile in §4 *is* the registration. Draw the plate (if used) at world (0, 0) at 1920×1080 inside the camera Layer, and the JSON points are then world px.

## 3. 4K quality and the vectorization test

Pipeline (`$B/scripts/vectorize.py`, venv `$B/venv` with vtracer 0.6.15, resvg-py, opencv):

1. **Find the plate's flat colours.** k-means in Lab (k = 6 for A07, 24 for A12 and A08). Clusters that lie on the segment between two bigger clusters are dropped as anti-aliasing blends.
2. **Snap to the house palette.** Each cluster snaps to the nearest house colour when ΔE < 10. The palette is `theme.ts` C, plus the `ROOM_COLORS` and the request's #F4ECD8. Otherwise the cluster is kept and flagged off-palette.
3. **Assign and clean.** Every pixel is assigned to its nearest colour, followed by a 3×3 median.
4. **Trace.** vtracer: colour, stacked, spline, speckle 6, corner 60, splice 45.
5. **Rasterize crops.** resvg, at the 4K-equivalent scale.

Each plate was traced at 1x and also after a Lanczos 2x pre-upscale. The comparisons are against a Lanczos upscale of the plate and against our code-drawn set rendered by Remotion at scale 2 and camera zoom 2 (4x).

Evidence:
- `$B/out/A07_4K_compare_x2.png`, `$B/out/A07_4K_compare_x4.png`
- `$B/out/A12_vectorize_4x_compare.png`
- `$B/out/A08_vectorize_4x_compare.png`
- `$B/out/A05_vs_code_4x_partition.png`
- metrics: `$B/out/A07_4K_line_metrics.json`, `$B/out/straightness_4k.json`
- traced files: `$B/vec/*.svg`, with per-file reports in `$B/vec/*_report.json`

| Plate | Variant | SVG size (gzip) | Paths | Palette fit |
|---|---|---|---|---|
| A07 | trace 1x | 36 KB (12 KB) | 58 | 3 house colours + plaster grey #B3B1AD, off-palette (ΔE 21 to the nearest) |
| A07 | pre-2x | 102 KB (33 KB) | 177 | same |
| A12 | trace 1x | 657 KB (225 KB) | 932 | Floor #D9BE9C snapped to `sideWall` at ΔE 7–7.5 (a visible shift). Seven dark navy/teal "ink" variants are off-palette (ΔE 10–16): painterly shading on the apparatus. |
| A12 | pre-2x | 2.73 MB (926 KB) | 4,184 | same |
| A08 | trace 1x | 269 KB (90 KB) | 255 | Every cluster within ΔE 6.2 of a house colour (it was drawn from our render) |
| A08 | pre-2x | 717 KB (246 KB) | 735 | same |

(The source PNGs are 1.4–1.6 MB.)

Measured line quality at 4K on A07 (in 4K px; the house stroke is 8 px there):

| A07 version | Ink thickness, mean ± sd (min–max) | Centre wobble vs profile, RMS / max | Off-colour pixels in the air above the line |
|---|---|---|---|
| plate, Lanczos 2x | 8.0 ± 0.67 (6–10) surface; 7.4 ± 0.91 (5–10) interface | 0.17 / 0.6 | 5,561 (halo and ringing) |
| vtracer 1x | 7.8 ± 1.51 (**2–11**); 9.0 ± 1.16 (7–14) | 0.82 / **2.8** | 10,223, 47 speckles > 16 px |
| vtracer pre-2x | 7.9 ± 0.82 (5–10); 7.6 ± 1.01 (5–10) | 0.43 / 2.7 | 12,156, 67 speckles |
| code from the profile | 8.0 ± 0.42 (7–10); 8.1 ± 0.33 (8–9) | 0.17 / 0.3 | 0 |

Long straight edges survive tracing: the A12 plinth top and the A08 upright stay within 1 px of straight at 4K in every variant.

What the images show:
- **Lanczos (plates as they are).** At 2.4–2.6x (`CAM_ROOM` and the S1.2 push) and at 4x (a 2x push in 4K), every ink line is soft and carries a light ringing halo. The flat fills have mottled tone: A05's partition coral, A07's paper, A12's wall. A12's dark apparatus has painterly gradient blobs. Small details are mush: the rings, the buttons on the streak camera, the mannequin's joints. Next to any code-drawn character or label, which stays razor-sharp at 4K, the plate reads as a blurry photo backdrop.
- **Wobble.** On curves and small shapes, ink thickness swings 2–11 px and centres wander up to about 2.8 px (4K) on A07. A12 box corners and lens rings come out lumpy and A08 box corners bulge. Straight axis-aligned edges are fine.
- **Colour banding.** The plates' near-flat tones (paper vs paint layer in A07, the A12 wall's slight drift between cream and paper) posterize into blotchy islands along the lines and across the A12 wall, visible at 2x. A12's shaded dark parts collapse into flat dark blobs that merge with their outlines.
- **Lost detail.** Small features drop out at speckle 6 (the dots on the A12 streak camera), and rounded caps become polygons.
- **Weight.** A12 at 2.7 MB and 4,184 paths per frame is heavy for every Remotion frame. It would have to be rasterized once at 4K anyway, which brings back a bitmap.

Conclusion: vectorization does not rescue these plates for a 4K master. It trades softness for wobble and blotches and still needs manual cleanup. For the two simple designs that matter (A07, A06b), drawing them in code is cheaper and exact. For A12, drawing from the design is the only way to get the storyboard's animated, continuity-matched exhibits.

## 4. A07 surface profile (written)

File: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/art/A07_surface_profile.json`. Script: `$B/scripts/a07_profile.py`. Check image: `$B/out/A07_profile_extraction_check.png`.

- **Method.**
  1. For each of the 1920 columns, take the darkness profile in rows 560–860. Ink is gray < ~123; the plaster (gray ~176) is excluded.
  2. Take the two darkest runs: the upper one is the paint **surface**, the lower one the paint/plaster **interface**.
  3. The sub-pixel centre of each run is its darkness-weighted centroid (±2 px).
  4. Smooth with a Gaussian (σ = 3 px) along x. The largest correction is 0.34 px; it only removes resampling jitter.
  5. Resample every 4 px from x = 0 to 1920 inclusive: 481 points per line, in image px (= world px when the plate sits at 0,0).
  6. Compute per-vertex upward unit normals and include them.
- **Fit.** The plate's own ink-line centre sits on the polyline to 0.17 px RMS and 0.6 px max at 4K (under 0.1 px at 1080p).
- **Ranges.** The surface spans y 645.7–690.1 with a max slope of 29.7° and an RMS slope of 11.1°. The interface spans y 739.7–769.0 with a max slope of 15.4° and an RMS slope of 7.7°. The plate's ink is about 4 px. Fills measured from the plate: air #FAF2DD (≈ `C.paper`), paint #F3EAD6 (≈ the relay wall #F4ECD8), plaster #B4B1AC (no house match).
- **Physics note for S2.3.** Specular reflection off these bumps sends ONE ray in ONE direction. A parallel beam hitting the whole width spreads only within ±59° of vertical (2 × max slope), RMS ±22°. That is not "every which way". The truthful picture is to reflect the incoming rays off the drawn profile with exact normals (shows "rough up close"), then draw the lamp-like spray as a code `ScatterFan` at the hit point (paint scatters mostly below the surface, among pigment grains), labelled as an illustration. The profile is generated art, not a measured roughness; the existing "rough up close" label is honest about that.

Recommended S2.3 build (work/S2, `S2_WallSection.tsx`):
- Draw the background `C.paper`.
- Draw the paint layer as a polygon between the two polylines in #F4ECD8.
- Draw the plaster below the interface in #B4B1AC (or `C.paperLine`, if a house colour is preferred).
- Stroke both polylines in 4 px `C.ink`, round joins.
- Reflect rays off the surface polyline with r = d − 2(d·n)n.

Because world px = image px, a push toward the hit point stays crisp at any zoom. The S2 builder can inline the points in their prefixed component (builders can't edit `data/*`), or the lead can copy the JSON to `source/src/data/` at merge.

**Fallback** if the plate itself is wanted: use it as a backdrop at world (0, 0), 1920×1080, with the camera at zoom ≤ 1.0 (2x in the 4K master). It is acceptable but soft (see the A07 table), and rays computed from the JSON land on its line within 0.1 px. Don't push in.

## 5. Per-asset decisions

### A05 room plate: reference_only_no_change

- **Why.** §2.1 covers the details. In short:
  - It is not a parallel projection: the receding slopes fan from 0.54 to 0.70 against our constant 0.743, and the right floor edge is bent.
  - At best fit it is still off by 41 px at the floor corners and by 100–130 px at the partition.
  - The partition is baked in at x 2.2–2.35 m, 4.4° off perpendicular, about 0.23 m shorter, with a 0.84 m gap.
  - The plate doesn't cover the frame under `CAM_ROOM` or the S1.2 push.
  - The tilt-0 windows total about 12 s and each runs straight into a camera rise.
  - The partition must wobble (S1.4) and move (S8.3).
  - At 2.4–2.6x in 4K it is visibly soft beside the code characters.
  - It brings no detail the code `RoomSet` lacks; it was drawn from it (same partition panels and hinges, door panels, plant, planks).
- **Use.** Keep `RoomSet` everywhere. Don't import A05 into `public/`. It stays valid as a Runway start-frame reference if A10/A11 work wants it.
- **4K plan.** None needed: the code set is already resolution-independent.

### A06 mirror room plate: not_used

- **Why.** All of A05's problems, plus:
  - the mirror is baked and static, while S2.2 needs it to slide on;
  - the mirror sits at x 1.70–2.38 m against the requested 1.9–2.6;
  - S2.2 is a raised view;
  - A05 and A06 differ by about 1 px all over (4.3 % of pixels), so they can't even be cut between.

### A06b mirror panel: upgrade_code_rig_from_reference

- **Use its design** for S2.2's code mirror (work/S2):
  - a cream frame about 0.053 m wide with an ink outline;
  - an inner ink line;
  - glass in `C.blueLight` (not the plate's #AFD9FC);
  - two diagonal cream shine strokes at the upper left, drawn ABOVE a clipPath for the guesser's reflection.
- **Placement.** Wall plane z = 0.005, x 1.9 → 2.6 m (slid in along x on "here"), h ≈ 0.4–1.36 m so it fits `CAM_RAISED`. Use `planeMatrix` and `vectorEffect="non-scaling-stroke"` strokes, and draw it in RoomSet's `backdrop` slot so the partition and people cover it. The scratch `MirrorProbe.tsx` is a working start.
- **Fallback** (if the owner insists on the bitmap): the same planeMatrix placement works and occlusion is correct. Accept half-weight horizontal outlines and off-palette glass, and draw the reflection over the shine strokes.

### A07 wall cross-section: upgrade_code_rig_from_reference (plate usable as a fallback at zoom ≤ 1)

See §4. Impact is high: S2.3 gets an exact reflecting surface at no 4K cost.

### A08 warehouse corner: not_used

- **Why.** §2.4 covers the details. In short:
  - It registers only at the kit's 1.34 push framing, with the lower rack 20–40 px off.
  - It lacks the stop bar and walkway geometry the scene's optics and braking use.
  - Its box layout differs from `WarehouseSet`, so the S7.2 tilt (which a bitmap can't follow) would pop the shelves.
  - The person needs a corner matte.
  - It is softer than code at ≥ 2.7x.
  - It is a redraw of our own render.
- **If ever needed** (not recommended): use it only as a locked plate for S7.1 and S7.5 at exactly cam (890, 590, 1.34). Add a polygon matte of the S1/S2 corner drawn from `whProject`, and draw the stop bar and labels in code. A fresh push is not possible.

### A12 history shelf: upgrade_code_rig_from_reference

- **Why not the plate.**
  - **Style.** It clashes with the museum already built in S6.1 and S7.4: blue wall #D3E1F8, wood plinth tops, yellow plaques and a `woodLight` floor (`lib/shots.ts` `PLINTH`, "so the cut matches"), against A12's cream wall, coral/teal bands, outlined blank plaques and off-palette tan floor #D9BE9C. Evidence: `$B/out/A12_vs_built_museum_continuity.png`.
  - **Content.** It contradicts the storyboard. The 2018 laptop is closed, but S5.2 needs it open showing "1 s", a wall for the raster spot and a wall clock. The 2021 exhibit has no "powerful laser". In the 2012 exhibit the mannequin stands in front of the coral panel, in full view of the streak camera's side, rather than hidden behind a screen, so the exhibit misreads the very idea it illustrates.
  - **Animation.** Every exhibit animates (the 3D outline rises, the spot rasters, the monitor plays, the counter ticks, the rope clips).
  - **Magnification.** Trucking to each exhibit (about 550 px wide in the plate) needs zoom 2–2.5, which is 4–5x in 4K.
  - **Vectorization.** Tracing gives lumpy small parts, wall blotches and 0.66–2.7 MB SVGs.
- **Use its designs** for work/S5's code exhibits, on `PLINTH` plinths:
  - **2012:** a teal laser box with a lens barrel, two round optics on post mounts, a blue streak-camera box on a dark rail base, and a small white wall card. Re-stage the wooden mannequin *behind* a small coral screen, as seen from the camera, so it can't be seen directly.
  - **2018:** a teal compact laser and a blue single-pixel detector cube on one dark scanning base. Draw the laptop OPEN, add a small wall panel for the hopping spot, and add a wall clock.
  - **2021:** a dark slim detector with two lens windows and a monitor (live blobby video in code), plus a laser box. Match the sliver S6.1 already shows: a blue laser box with a monitor on top.
  - **Plinth 4:** S6.1's set stays as built.
- **Labels and plates** ("2012 · MIT", "illustration based on Velten et al. 2012", ...) are code text on yellow plaques. Nothing from the plate stands in for evidence.

## 6. Risks and follow-ups

- **Owner expectation.** The batch was commissioned as an "upgrade layer", and this assessment finds no opaque plate worth importing as-is. The plates are faithful, but because they copy our own code frames there is nothing to upgrade, and they are lower resolution than the code. The mirror, wall section and exhibit designs are where the value lands.
- **S2, S5, S8 and S9 are stubs.** These recommendations should reach those builders before they start. In particular, the S2 builder should use the A07 JSON, and the S5 builder should follow `PLINTH` and the exhibit notes above.
- **The A07 profile is illustrative art.** The S2.3 labels must keep saying "rough up close" or "illustration". Don't present the bumps as measured roughness or the reflections as the scattering mechanism. The fan is the honest picture.
- **Off-palette greys.** A07's plaster #B4B1AC is not a house colour. Pick it or `C.paperLine` once and keep it in S2.

## Evidence index (all under `$B`)

- **Overlays:**
  - `out/A05_vs_RoomSet_t0_overlay50.png`
  - `out/A05_floorReg_vs_RoomSet_overlay50.png`
  - `out/A05_affineReg_vs_RoomSet_overlay50.png`
  - `out/A06_vs_RoomSet_t0_mirror_overlay50.png`
  - `out/A08_vs_WarehouseSet_t0_overlay50.png`
  - `out/A08_vs_kitWarehouseView_cam134_overlay50.png`
- **Mirror:**
  - `out/A06b_overlay_vs_code_mirror_raised_full.png`
  - `out/A06b_vs_code_mirror_4k_crop.png`
  - `out/mirror_bitmap_raised_4k.png`, `out/mirror_code_raised_4k.png`
- **4K comparisons:**
  - `out/A05_vs_code_4x_partition.png`
  - `out/A07_4K_compare_x2.png`, `out/A07_4K_compare_x4.png`
  - `out/A12_vectorize_4x_compare.png`
  - `out/A08_vectorize_4x_compare.png`
  - `out/A12_vs_built_museum_continuity.png`
- **Metrics:** `out/A07_4K_line_metrics.json`, `out/straightness_4k.json`, `vec/*_report.json`
- **A07:** `out/A07_profile_extraction_check.png`, `vec/A07_code_from_profile.svg`
- **Code renders** (scratch project `rproj`, `ProbeRoot.tsx` + `MirrorProbe.tsx`, `probe.mjs`): `out/room_t0_world.png`, `out/room_t0_world_4k.png`, `out/room_t0_zoom2_4k.png`, `out/room_raised_world.png`, `out/wh_front_world.png`, `out/wh_zoom2_4k.png`
- **Scripts:** `scripts/a05_lines.py`, `scripts/a05_register.py`, `scripts/a05_affine.py`, `scripts/roomproj.py` (a Python port of `viewAt`/`projectWith`), `scripts/a07_profile.py`, `scripts/a07_metrics.py`, `scripts/vectorize.py`, `scripts/vtools.py`, `scripts/vec_compare.py`, `scripts/straight.py`
