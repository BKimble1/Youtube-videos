I built the optics library, the drawing components and the KitOptics dev composition. `npx tsc --noEmit -p .` passes with no errors in any file, and `selfTest()` passes on the provisional layout. I did three render-inspect-fix rounds, plus a final check of the frames between the key stills; the last stills look clean.

**Files**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/lib/optics.ts`: pure TypeScript, no React; the only randomness is the seeded `rand()`.
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Optics.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitOptics.tsx`

**Exported API, `lib/optics.ts`**
All values are in plan metres. Angles are `atan2(dz, dx)`, so π/2 points into the room.
- **Types and layout:**
  - `P2 {x, z, id?}`, `OpticsLayout` (a structural subset of layout.json), `Rect {x0, x1, z0, z1}`
  - `LAYOUT` (the layout.json data)
  - `layoutPoints(layout)` returns `{S, H, W[]}` with ids
  - `confocalPath(S, W, H)` returns `[S, W, H, W, S]`
- **Geometry and occlusion:**
  - `segmentIntersection(a, b, c, d)` returns `{t, u, p} | null`
  - `segmentBlocked(a, b, layout = LAYOUT, margin = 0)`: the occluder is a rectangle (x ± thickness/2, z0..z1), tested edge by edge plus containment
  - `occluderRect`, `roomRect`, `pointInRect`
  - `clipSegmentToRect(a, b, rect)` returns `{tIn, tOut} | null`
  - `firstOccluderHit(a, b, layout)` returns 0..1, the point where a segment first touches the occluder
  - `assertPath(points, layout)` throws, e.g. `optics.assertPath: segment 0 S→H (1.100, 2.400)→(3.300, 1.500) crosses the occluder (x=2.3, z 0.9..2.7)`
- **Paths and timing:**
  - `pathLength`, `pathCumulative`, `pointAtDistance`
  - `timeNs(length, c = LAYOUT.c_m_per_ns)`, `lengthForTime`
  - `confocalRadius(tNs, S, W, c?) = (c·t − 2|SW|)/2`
- **Ellipses (separated wall points):** `ellipseFromFoci(f1, f2, sum)` returns `Ellipse | null`; also `ellipseFromTime(tNs, S, Wl, Wd, c?)`, `ellipsePoint`, `sampleEllipse`.
- **Arcs and bands:**
  - `sampleArc(center, r, a0, a1, n)` returns n + 1 points
  - `arcRectIntervals(center, r, rect, a0, a1)`: the exact angle ranges of an arc that fall inside a rectangle
  - `bandMembership(p, center, r, halfWidth, sharpness = 4)`: a soft edge equal to 0.5 at d = halfWidth
- **Possible-locations field:**
  - `possibleCloud(grid: GridSpec, bands: {W, r, halfWidth}[], 'product' | 'min')` returns `ScalarField {values, nx, nz, max, argmax}`
  - `extractContours(field, threshold, opts)` returns `P2[][]`: marching squares on a zero-padded grid (so contours always close), saddle cells resolved, loops joined, resampled and smoothed with closed Catmull-Rom
  - helpers: `catmullRomClosed`, `resampleClosed`, `polygonArea`
- **Scattering:** `scatterDirections(normal, n, seed, jitter?)` returns `ScatterDir[] {x, z, w, angle}`. It is deterministic and cosine-weighted (rays crowd toward the normal), and `w = cosθ` sets the ray lengths.
- **Toy histogram:** `arrivalHistogram({S, W, H, rangeNs, binNs, ...})` returns `{edges, values, firstBin, lateBin, tFirst, tLate}`. The numbers are illustrative.
- **Self-test:** `selfTest(layout = LAYOUT)` returns `SelfTestReport` and throws on a violation. It is memoised per layout object, so calling it every frame costs nothing. It checks:
  - the partition does not touch the wall, and S→H is blocked;
  - S→W and W→H are clear for W1–W4, and each path passes `assertPath`;
  - each path length equals 2|SW| + 2|WH|, and `confocalRadius(timeNs(L))` gives back |WH|;
  - each arc reaches H inside the room;
  - the two blocking tests agree with each other, H lies on the separated-points ellipse, and the field peaks at H (measured error 0).
- **Provisional-layout numbers:**

  | Wall point | Radius \|WH\| | Arrival time |
  |---|---|---|
  | W1 | 2.746 m | 34.34 ns |
  | W2 | 2.382 m | 32.07 ns |
  | W3 | 2.052 m | 30.56 ns |
  | W4 | 1.860 m | 30.02 ns |

  The W3 path is 9.163 m long.

**Exported API, `components/v02/Optics.tsx`**
Plan-space components take `toPx: (p: P2) => {x, y}` and render an overlay `<svg>`, or a `<g>` when given `asGroup`. Curves are sampled in plan space before mapping, so they also work under the oblique room view.
- **`LightPath`:** `{points, toPx, t, pulses?, pulseGap?, dash?, intensityFalloff? = 0.6, color?, pulseColor?, width?, pulseRadius?, showFull?, ghost?, lane? = 14, bounceRings?, ringClip?, arrive?, opacity?}`
  - The pulse moves at constant speed by length.
  - Each segment after a bounce is drawn thinner and paler.
  - A leg that retraces an earlier one (out and back) runs in a separate lane offset by `lane` px.
  - An expanding ring marks each reflection, clipped to the room so it never enters the wall.
- **`ScatterFan`:** `{origin, dirs, length, toPx, t, release?, layout?, seed?, tips?}`. Rays draw on staggered, then shrink and fade on `release`. With `layout`, each ray stops at the partition.
- **`CandidateArc`:** `{center, r, toPx, t, a0?, a1?, tone?, clip?: Rect, width?, pen?, dashArray?}`
- **`Band`:** `{center, r, halfWidth, toPx, t, tone?, clip?, fillOpacity?, edges?}`
- **`PossibleCloud`:** `{toPx, contours? | field? + levels?, t, tone?, blur?, outline?}`. Filled smooth blobs, with `feGaussianBlur` only on the blob, plus a crisp line on the inner level.
- **`WallMarker`:** `{p, toPx, label?, t?, active?, tone?, labelOffset?}`
- **`SensorGlyph`:** `{p, dir, toPx, size?, firing?}`. A placeholder box with emitter and detector windows on the face pointing along `dir`.
- **`SightLine`:** `{a, b, toPx, layout?, t}`. An extra I added: a dashed line of sight that stops at the partition with a cross.
- **Screen-space components (sizes in px):**
  - `ArrivalHistogram {bins (edges in ns), values, peaks?: {bin, label, tone}[], t, width, height, labels?, ticksNs?, highlight?: {from, to, tone, label?, t?}, tone?, yMax?, cursor?, peaksT?}`. A time cursor sweeps across and bars rise as it passes.
  - `TimingRuler {ns, width, t?, minor?, major?, height?, rateLabel? (true gives "about 30 cm per nanosecond"), ratePosition?, marker?, markerLabel?}`
  - `PulseDot`
- **Helpers:** `TONES`, `mixHex`, `polyD`, `arcPointPx`.

**Design decisions**
- **Out-and-back lanes:** without them, the pale return leg sits on top of the thick outgoing leg and looks like a stripe.
- **Arc draw-on:** arcs are clipped to the room exactly (`arcRectIntervals`) and then shortened point by point, rather than animated with a dash offset. No draw time is spent on parts outside the room, the tip is a clean round cap with a pen dot, and an SVG clipPath on the room outline trims the line ends.
- **Layering:** arcs, bands and the cloud are drawn under the partition. The relay-wall slab and markers sit on top of the path's bounce points.
- **The cloud is honestly elongated:** the four wall points span only about 20° as seen from H, so the overlap is a lens along the tangent. I used levels 0.06 and 0.45 with a 7 px blur so it reads as a region.
- **Dev composition labels:** every in-room label sits on a floor-coloured pill so lines pass cleanly behind it. All text is at least 30 px. The arc radii and the path length and time shown on screen come straight from the optics functions.

**Known limitations**
- `LightPath` maps only the corner points. That is exact for plan, oblique and perspective views, but not for a curved (non-projective) `toPx`.
- The histogram's late bump (17% of the peak) is a readable stand-in; the real return from a hidden person is orders of magnitude weaker. It needs the "illustrative" label wherever it appears.
- `possibleCloud` is recomputed every frame (about 28k grid points in the dev composition, which renders fast). On a fine full-room grid, pass a smaller sub-rectangle around H.
- `SensorGlyph` and the H marker are placeholders until the real sensor prop and character tokens exist.
- `ArrivalHistogram` measures its peak labels with `textWidth` from lib/measure, which relies on fonts already being loaded, as `fonts.ts` ensures.

**Stills inspected**
- Half scale, in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitOptics/`: `00000_0.png`, `00020_20.png`, `00034_34.png`, `00060_60.png`, `00090_90.png`, `00120_120.png`, `00160_160.png`, `00180_180.png`, `00210_210.png`, `00214_214.png`, `00239_239.png`
- Full scale, in `full/` under the same folder: `00000_0.png`, `00022_22.png`, `00024_24.png`, `00040_40.png`, `00100_100.png`, `00150_150.png`, `00180_180.png`, `00224_224.png`, `00239_239.png`

=========

I've built the room kit and checked it in renders: it's 4 files, and `npx tsc --noEmit -p .` passes for the whole project, including the other agents' current files. The task's ask was impossible at the room-view scale: 4.4 m at 1500–1600 px is about 340 px/m, and at that scale the 2.6 m wall plus the foreshortened floor needs about 1300 px of height. So the default view follows the width spec, and the wall top sits above the frame (about 2 m of wall shows). A second preset, `WIDE_VIEW` (243 px/m), fits the whole dollhouse with headroom and keeps 4 px outlines; it renders well.

The other deliberate change: in the room view the camera stands front-left, not front-right. The first render, with the camera on the right, showed the partition covering W3 on the relay wall. With the camera on the left, all four wall samples, the S→W legs and H are always visible; only the W→H legs dip behind the partition's far end. As a result the visible side wall is the right one, so the door is there (x=4.4, z 2.35–3.2). The plant stays in the back-left corner. Both are more than 0.6 m from every S→W→H path.

## Files
- `src/lib/room.ts`
- `src/components/v02/RoomSet.tsx`
- `src/components/v02/Partition.tsx`
- `src/dev/KitRoom.tsx`

## API: `lib/room.ts`
**Layout and points**
- Types `Layout` (the same schema as layout.json), `PlanPt {x, z, h?}`, `ScreenPt {x, y, depth}`.
- `LAYOUT`, plus `PTS {S, H, operator, W: Record<id, PlanPt>}`. Wall samples sit at z=0 with h = sensor.h (0.95, the light-path plane: the drawn chibi's chest).

**Views**
- `ViewConfig`, with presets `DEFAULT_VIEW` and `WIDE_VIEW`.
- `viewAt(tilt, view?) → ViewState` gives ppm, floor, height, shear, anchor and the direction toward the camera.

**Projection**
- `project(p, tilt, view?) → {x, y, depth}`, `projectWith(state, p)`, and `projector(tilt, view?) → (x, z, h?) => [x, y]`.
- Room view (tilt 0): 340 px/m, floor foreshortening 0.35, heights at full scale, near points shift right by 0.26 per metre of z.
- Plan view (tilt 1): 240 px/m, same scale in x and z, room centred in frame.
- In between, the camera's elevation rises continuously from 20.5° to 90°. Floor foreshortening goes 0.35→1 and height scale 1→0, the shear fades with the height scale, and scale and anchor glide to the plan framing.
- `tiltAt(g, start, dur, ease = E.inOut)` gives an eased tilt for scenes.

**Scale and inverse helpers**
- `ppmAt(tilt, view?)`, `axesAt(tilt, view?)` (px per metre along x/z/h), `mToPx(m, tilt, view?)`.
- `screenToFloor(sx, sy, tilt, h = 0, view?)` and `screenToPlan(sx, sy, view?)`.
- `roomBounds(tilt, view?)`, which works with `frameRect` for a full-room camera shot.

**Drawing helpers**
- `planeMatrix(origin, U, V, tilt, view?)` returns an SVG matrix for drawing in metres on any plane.
- `pathOf(pts, tilt, view?, closed?)`, `pathWith(state, pts, closed?)`, `hull(points)`.

**Occlusion and depth order**
- `Box`, `occluderBox(layout?)`, `hiddenByBox(p, box, tilt, view?)`, `isHiddenByOccluder(p, tilt, view?, layout?)`, `occluderSilhouette(tilt, view?, layout?)`.
- `crossesOccluder(a, b, layout?)` is a plan-view segment test.
- The partition AS DRAWN (use these for overlay light; see "Path-legibility kit" below): `PARTITION_ARCH`, `PARTITION_FOOT_H`, `partitionTopH(z)`, `hiddenByPartition(p, s, {layout?, padPx?})`, `partitionHides(s, h, opts?)`, `partitionCrossings(a, b, s, {zoom})`, `assertAroundTheEnd(label, polylines, s, {zoom, ...})`.
- `DepthItem {z, x?, h?, w?, height?, box?}` and `depthSort(items, tilt, view?)`. Only items that overlap on screen constrain each other; an upright item is drawn before the partition when the partition hides part of it, after it otherwise.
- `depthOf(p, tilt, view?)`.

**Characters**
- Constants `RIG_PX = 440`, `PERSON_M = 1.7`.
- `rigScale(s, heightM = 1.7)`: the rig scale on the SET's height scale (`heightM · ppm · heightScale / 440`), uniform, never squashed, so a 1.7 m person is exactly 1.7 m of wall or partition at every tilt.
- `rigAt(x, z, tilt, {heightM?, view?}) → {x, y, scale, depth}`: feet on the projected floor point, scale `rigScale`. A 1.7 m person comes out at scale 1.31 at tilt 0; 1.20 at RAISED_TILT (0.10); 0.66 at tilt 0.45 where `figureMix` starts the fade. At tilt 0 that is about 578 px tall. The rig's chest (~0.95 m) is the light-path plane.
- `figureMix(tilt) → {rig, token, rigScaleX, rigScaleY, tokenScale}`: the rig fades out over tilt 0.45–0.75 with a mild settle (94% wide, 84% tall at most, anchored at the feet), and the token fades in over 0.5–0.8 while growing from 70% to 100%.
- `rigStyle(tilt, scale)` returns CSS ready to pass as the Character's `style`.
- `tokenAt(x, z, tilt, {radiusM?, h?, view?}) → {x, y, r, opacity, scale}`, with constants `TOKEN_H = LAYOUT.sensor.h` (0.95 m, the rig's chest) and `TOKEN_R = 0.26`.

## API: `RoomSet.tsx` and `Partition.tsx`
- **`<RoomSet>`** props: `tilt`, `items?: RoomItem[]`, `backdrop?`, `children?`, `partition?` (default true), `wobble?`, `door?`, `plant?`, `view?`, `layout?`.
  - `RoomItem` is `DepthItem & {key?, node}`. Items are depth-sorted together with the built-in partition and plant.
  - `backdrop` draws on the room shell (wall spots, light paths), behind everything standing; `children` draws on top.
  - Everything is in world px, so wrap the set and all projected overlays in one camera `<Layer>`.
  - Also exported: `ROOM_COLORS`, `WALL_T`, `DOOR`, `PLANT`, and `<PottedPlant x z tilt view? heightM?>` (upright in the room view on the set's height scale like the rigs, top-down in the plan).
  - `<GapMarker tilt t layout? view? halfW?>`: the opening between the partition's far end and the wall, in INK (dashed threshold over a pale floor patch). Put it in `backdrop`. With a moved layout it shrinks with the gap.
- **`<Partition tilt wobble? view? layout? opacity? style?>`**: a coral 3-panel screen with arched panel tops, inset outlines, hinge lines with small plates, stubby feet and a floor shadow. It is opaque and 2 m tall. `wobble` (about ±1) leans it up to 6° about its base, and only a quarter of that in the plan view. At tilt 1 it becomes a coral bar with an ink outline, at least 18 px wide.

## Design decisions
- The room view is a cut-away dollhouse on the paper backdrop: back relay wall `#F5E4C6` with a cream skirting board, the right side wall, a wood floor slab of 8 wide planks with a few staggered joints, and cream cut edges. The left side and front are open.
- In the plan view the floor turns cream, the wall tops become ink wall lines (relay wall and right wall, with the door shown as a gap), and faint 0.5 m ticks run outside the relay wall only. There is no grid.
- The plant is placed with randomness from `rand()` only; nothing depends on Math.random or time, so every frame is a pure function of the frame number.
- In the dev comp, the light path and wall samples sit in `backdrop`. In the room view the S→W3 leg passes correctly behind the operator's head, and W3→H passes behind the partition's far end and H.

## Known limitations
- (Superseded by the path-legibility pass: rigs now follow the set's height scale, `rigScale`, so the token at `TOKEN_H` lands on the fading rig's chest.) The rig placement kept full height during the tilt; tokens sat at the true chest-height projection, so at tilt about 0.7 a token sat near the fading rig's hips.
- For about 6 frames around tilt 0.85 the wall tops go through a grey phase on their way from cream to ink.
- `depthSort` treats people as upright billboards and only knows box-shaped solids.
- The light-path splitting in the dev comp is local code there, not a kit export.
- The operator's pose is a placeholder: the sensor point lands at her shoulder, so her reaching arm looks a little like a head scratch.

## Stills inspected
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitRoom/` frames 00000, 00030, 00060, 00108, 00120, 00180, 00239.
- In `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/`:
  - full-res frames 0, 104, 108, 112 and 116 in `kr1/` and `kr2/`
  - close-up crops of the partition and the door
  - a temporary whole-dollhouse camera check, since reverted

There were three render–inspect–fix rounds. They led to the camera flip, the partition redesign, the depth-sort cycle fix, `WIDE_VIEW`, and the colour-timing and door-fade tweaks.

=========

The cast extension, overhead tokens and handheld sensor are built, and the KitCast dev comp plays the full scene. `npx tsc --noEmit -p .` passes for the whole project. Mid-task it briefly failed on another agent's `src/components/v02/Warehouse.tsx` (missing `./DeliveryBot`); that file wasn't mine and the error was gone on the final run. I did three render-and-fix rounds plus a numerical check that feet don't slide.

## Files created
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Cast2.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Tokens.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/HandheldSensor.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitCast.tsx` (replaced the placeholder)

## Exported API

**Cast2.tsx**
- **`<Character2 look pose frame seed? x? y? scale? flip? front? pass? holdL? holdR? shadow? style? life? eyeDarts?/>`**
  - Takes every `Character` prop, so it drops in for `Character`.
  - `front` also accepts `'both'`, and defaults to `pose.armsFront`.
  - The head, hair, face, outfit and accessory drawing is copied unchanged from `Character.tsx`.
- **Types**
  - `Pose2 = Pose & {sink?, hunch?, shift?, feet?: {L: Foot; R: Foot}, legL?: Leg, legR?: Leg, peek?, lid?, eyes?, pupil?, sweat?, armsFront?}`
  - `Leg = {a, b, out?}`: hip angle, knee bend, bend direction.
  - `Foot = {x, lift?, pitch?, turn?, knee?}`
- **Gait**
  - `walkPose(phase, {style?: 'walk'|'tiptoe', dir?, base?, arms?, step?}): Pose2`
  - `phaseFromDistance(distPx, scale, style)` and `strideLength(style, scale)`
  - `GAITS` holds the gait settings.
  - `planTrip(distPx, scale, style): TripPlan` → `tripPose(travelled, plan, {dir, base, arms}): Pose2` gives a start-to-stop trip with half-steps at each end.
  - `tripDistance(g, start, plan, framesPerStep, pulse)` gives the sneak's stop-go timing.
- **Presets**
  - Poses: `IDLE2`, `ARMS.{handsOnHips, armsCrossed, handOverMouth, sneak, handsUp}`, `HANDS_ON_HIPS`, `ARMS_CROSSED`, `HAND_OVER_MOUTH`, `SNEAK_ARMS`, `HANDS_UP`
  - Expressions: `EXPR.{smug, busted, deadpan}`
  - Body: `CROUCH` (about 23–25 % lower), `SETTLE`, `settlePose(amount, side)`, `settleAt(g, t0, side, amount)`
- **Helpers:** `mixPose2`, `withPose(base, over, t)`, `solveLeg`, `STAND_FEET`
- **World-space helpers:** `handWorld2(ch, pose, side)`, `reach2(ch, pose, side, wx, wy, elbow)`, `mouthWorld`, `eyesWorld`. Unlike the originals, these account for sink, hunch, shift, lean, peek and flip.

**Tokens.tsx**
- `<GuesserToken/>` and `<CheckerToken/>` take `{x, y, size?, facing?, opacity?, scale?, shadow?, asGroup?, look?}`.
- `size` is the full width across shoulders and sleeves.
- `facing` is in degrees, clockwise from screen-up (0 = toward the relay wall).
- `tokenSize(ppm, 0.5)` gives the size for a plan scale; with `tokenAt()` from `lib/room.ts`, use `size = 2*r`.

**HandheldSensor.tsx**
- `<HandheldSensor bars? bumpFrom? reveal? bumpHighlight? screen? led? ledColor? firing? skin? scale? rotate?/>` is drawn with the holding hand at (0,0), for use as `holdR`/`holdL`.
  - `screen` is optional custom readout content.
  - `skin` draws curled fingers around the grip.
- `SENSOR` holds the geometry; `sensorPoint(name, scale)` gives named points so the other hand can reach the box.
- `<SensorReadout/>`, `SENSOR_BARS`, `SENSOR_BUMP_FROM`
- `<SensorTop x y size? facing? firing? opacity? scale? asGroup?/>` and `facingOf(dx, dy)`

## Design decisions
- **Legs are solved from foot targets.** The rig always adds the hip drop needed to keep the feet reachable, so feet stay planted under lean, peek, weight shift and crouch. A knee that would go through the floor turns toward the camera instead.
- **Distance drives the gait.** Feet are planned as footprints, with half-steps at the start and end of a trip. Measured stance-foot drift is about 1e-13 px for trips in both directions, both gaits, and the periodic walk.
- **Walk look.** Legs scissor sideways, shoes turn 3/4 toward travel, and the near leg is drawn in front. The body bobs from the leg reach, leans into the step, and the arms swing.
- **Tiptoe look.** On the toes, high knees, slightly crouched and hunched, with paw-like arms and a stop-go rhythm.
- **Rest pose matches Video 01.** A pixel diff against the original `Character` at rest shows only antialiasing on the leg edges and the guesser's stripe outline, which I re-stroke at a full 4 px.
- **One behaviour change: lean.** `Character2` keeps the feet planted and drops the body about 3 px, where Video 01's rig swung the feet sideways.
- **Tokens.** The guesser is a red spiky crown with the spike tips seen end-on, a nose at the front and saffron stripes across white shoulders. The checker is a grey bob covering the ears, glasses as two arcs at the front, a pencil at the right ear and coral cardigan shoulders. The shadow always falls down-right whatever the facing.
- **Sensor.** A teal box with a top and side face. Two lens rims peeking over the top imply the far face. The front has a cream readout (tall teal first bar, saffron-to-coral late bump), a status LED, a coral trigger and a coral band. It has no branding.
- **Dev comp.**
  - The guesser starts with scheming hands, tiptoes 300 → 1200 behind the coral stand-in, settles smug with hands on hips (weight on the right leg), then is busted: hop, hands up, wide eyes, small "o", sweat drop.
  - The checker, deadpan, holds the grip in her right hand (placed with `reach2`) and steadies the box with her left (`handWorld2` + `sensorPoint`). The readout sweeps in; she glances down, then back out at us when the late bump shows.
  - The scene ends on the plan view with both tokens and the SensorTop at their `layout.json` positions, plus large copies in the margins.
  - Passing `inputProps {sheet: 1|2|3|4}` renders QA model sheets; normal renders are unaffected.

## Known limitations
- Crouching while walking is usable but cramped: the arms hang to the floor.
- `peek` moves the head and shoulders only; it doesn't change the body's silhouette.
- Mixing two poses whose feet are in different places will slide the feet, so blend at planted contact poses (the trip helpers do this).
- Arms crossed reads fine but is simple.
- The plan-view tokens rely on the nose (guesser) and glasses (checker) to show which way they face.

## Stills inspected
- Official, from `stills.mjs`: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitCast/00000_0.png`, `00060_60.png`, `00120_120.png`, `00180_180.png`, `00239_239.png`
- Iteration rounds (model sheets, consecutive-frame strips, rig diff) in `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/` under `r1/`, `r2/`, `r3/`, `r4/` and `r5/`.

=========

The warehouse set, the delivery robot and the `KitWarehouse` dev comp are built and working. `npx tsc --noEmit -p .` passes for the whole project, and the geometry self-check finds no problems at the final layout. I did four render-and-fix rounds.

**Files** (only these three were touched)
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Warehouse.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/DeliveryBot.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitWarehouse.tsx`

**Exported API**

*Warehouse.tsx*
- **The set:** `<WarehouseSet view?: 'front'|'plan' tilt?: number items?: WhItem[] backdrop? children? door? markings? viewConfig?: WhViewConfig/>`. `tilt` overrides `view`. Items are painted in the right order against the shelving (anything partly hidden by a rack is drawn behind it). `backdrop` paints on the floor and walls; `children` is the top overlay.
- **Item type:** `WhItem = {key?, x, z, w?, height?, node}`.
- **Geometry in metres:** `WAREHOUSE`.
  - Shelving runs `S0`–`S3`, with `S1` and `S2` forming the L.
  - `corner {x: 3.9, z: 3.0}` is the blind corner.
  - `relaySection {x: 6.0, z0: 2.3, z1: 4.6}` is the plain wall across the junction; `relaySamples` R1–R4 sit on it.
  - Also: aisles A and B, the walkway, `personLaneX` (4.5), `robotLaneZ` (3.8), `robotStop`, `stopBar`, `door`, `cornerGuard`, `sensorH`.
- **Sight-line helpers:**
  - `WH_BLOCKERS` (rack footprints that block sight)
  - `WH_PTS` (sensor at the stop pose, the corner, relay points, `personAt(z)`)
  - `whSightBlocked(a, b, boxes?)`, `whVisibleFromZ(sensor?)`
  - `WH_PERSON_HIDDEN_MAX_Z` = 2.0, `whCheck()`
- **Projection:** `WH_VIEW`, `whViewAt(tilt, view?)`, `whProjectWith(s, p)`, `whProject(p, tilt, view?)`, `whPathWith(s, pts, closed?)`, `whScreenToFloor(sx, sy, tilt, h?, view?)`, `whTiltOf`, `whSmooth`.
- **Figures:** `whFigureMix(tilt)`, `whRigAt(x, z, tilt, heightM?)`, `whRigStyle(tilt, scale)`, `whBotAt(x, z, tilt)` → `{x, y, scale}`, `whBotTopAt(x, z, tilt)` → `{x, y, ppm, floor, opacity, scale}`, `whTokenAt(x, z, tilt, r?)`.
- **Also:** `WH_COLORS`, `WH_BOT_FOOTPRINT`, types `WhPt`, `WhBox`, `WhRect`, `WhViewConfig`, `WhViewState`.

*DeliveryBot.tsx*
- `<DeliveryBot x y scale? travelled? brake? eyes? look? blink? pulse? flip? shadow? style?/>`
  - `x, y` is the ground point in px. True size is `scale = ppm / 250` (`BOT_UNITS_PER_M`).
  - `travelled` is in metres and turns the spoked wheels.
  - `brake = 1` pitches the body 6° nose-down about the front axle; negative values rock it back on the rear axle.
  - `eyes` is `'neutral' | 'cautious' | 'pleased'` or a blended shape from `mixEyes(a, b, t)`.
  - `pulse` is a 0–1 phase: the emitter flashes and three arcs leave the window.
- `DeliveryBotG` is the same robot as an SVG `<g>`.
- `<BotTop x y ppm heading? pulse? scale? opacity? floor?/>` and `BotTopG` are the plan glyph. Outlines stay 4 px at any scale.
- Also: `BOT` (0.5 × 0.46 m, 0.6 m to the lid, 0.86 m to the sensor head), `EYES`, types `BotEyes`, `EyeShape`, `DeliveryBotProps`, `BotTopProps`.

**Design decisions**
- **Layout:** the robot drives +x along aisle A in front of rack S1. Rack S2 runs back from the corner, and aisle B (with swing doors at its end) runs behind it. A short rack S3 on B's far side makes B read as an aisle. The relay surface is the plain light wall that closes aisle A: both aisles can see it, and the camera sees its inner face.
- **Racking height:** I raised it to 2.5 m and put the person's walkway at x = 4.5. Far down aisle B the person is mostly hidden behind the corner even from the camera, and they come out from behind it as they approach. Before this change the person looked like they were standing in the robot's path.
- **Robot design:** a saffron box with a teal lid, coral bumper and tail light, and a teal chassis band. It has a short cream mast with a teal sensor head, and the face is on a cream front panel on the body. There is no speech-bubble head and no antenna or disk.
- **Style rules:** flat fills, 4 px ink outlines, wide painted floor markings with no stripes, seeded boxes in a few colours, no textures, glow or grids. Everything is a pure function of the frame (`rand()` only).
- **Dev comp:**
  - Frames 0–94: the robot rolls in, its eyes squint about 6 frames before it brakes, and the body dips, rocks back and settles. The camera pushes in once during the approach.
  - Frames 130–200: tilt to plan.
  - Plan view: a dev-only overlay shows the blocked direct line with an X, the edge of the robot's view past the corner, the relay section with R1–R4, the robot glyph, and the person token still approaching.
  - From frame 204 a card on the left shows the three eye states.

**Known limitations**
- **3/4 cheat:** the side rig is drawn facing front-right so its face is visible, while the set's camera is front-left. Up close the robot's front panel shows on the opposite side from the shelves' visible side faces. I accepted this so the eyes stay readable; the cast rigs are frontal cutouts in the same way.
- **Occlusion:** items are sorted against the racks whole, not per part. That is correct for the lanes used here, but an item that is half behind one rack and half in front of another can sort wrong.
- **Relay wall in front view:** the wall is seen obliquely, so it is about 160–190 px wide. The plan view is where it reads properly.
- **Person:** the front-view walk is a placeholder sliding frontal rig, and the plan token is a placeholder too.
- **Plan glyph:** `BotTop` uses the rig's 0.5 m footprint, which is smaller than a real delivery robot.

**Stills inspected** (all under `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitWarehouse/`)
- Half scale: `00000_0.png`, `00060_60.png`, `00088_88.png`, `00120_120.png`, `00165_165.png`, `00180_180.png`, `00239_239.png`
- Brake sequence, frames 70–106: `seq/brake_sheet.png` (source frames in `seq/`, including tilt frames 140 and 150)
- Full res: `full/00100_100.png`, `full/00120_120.png`, `full/00239_239.png`
- Full-res crops: `full/bot_crop.png`, `full/plan_crop.png`, `full/sheet_crop.png`

=========

I reviewed and fixed the optics kit; `npx tsc --noEmit -p .` passes with no errors in any file, and the final stills at frames 0, 40, 80, 120, 160, 200 and 239 look clean.

The session restarted partway through this review. The three files already had edits from an earlier review pass at 04:54–04:57, so they no longer match the builder's report. They now include `pathSchedule`/`PULSE_SPEED`, the `clearPx` nudge for the W1 leg that grazes the partition, and a `hidden` prop for the room view. I reviewed and rendered from that current state and kept those edits.

## Defects found
1. **Stripes that would shimmer (Band).** Band edge lines were on by default. Where the four bands meet near the relay wall they stacked into about 12 thin lines a few px apart, and those move during the plan slide (frames 188–212). Visible in `review1/full/00160_160.png` and `00196_196.png`.
2. **Glow on the cloud (PossibleCloud).** The default `feGaussianBlur` (7 px) made a teal halo along the bands, which breaks the "flat fills, no glow, no gradients" rule.
3. **Sensor off-model (SensorGlyph).** It was a blue box with saffron and teal windows. The real sensor prop is teal with a coral emitter, so the plan view and room view would not match.
4. **Bounce rings could enter the wall (LightPath).** Rings were only clipped when the scene passed `ringClip` by hand.
5. **Bad sizes on long pulse trains (LightPath).** Trailing pulse marks could get zero or negative size once `pulses` is above about 6, which breaks the stroke width in `dash` mode.
6. **Histogram layout fixed for 30 px text (ArrivalHistogram).** The left and top paddings were hard-coded, so a larger `fontSize` would push the "photons" label into the axis and peak callouts off the top.
7. **KitOptics composition:**
   - the partition label was about 5 px off-centre;
   - arcs and bands drew over the inner half of the room's wall line;
   - the cloud levels `[0.06, 0.45]` left faint pale smudges trailing along the bands past the lens tips;
   - a stray `- 0.0`.

Other categories came up clean:
- No characters, so no hand or foot issues.
- No light leg crosses the partition, and fan rays stop at it.
- Arcs, bands and the cloud sit under the partition; the wall slab, markers, sensor and H ring sit on top.
- All text is at least 30 px.
- No `Math.random` or `Date`; all randomness is the seeded `rand`.

## Fixes made
- **`Band`:** `edges` now defaults to false, and the doc explains the shimmer risk.
- **`PossibleCloud`:** `blur` now defaults to 0, and the filter is left out entirely at 0. The cloud is two flat nested fills with a crisp inner outline.
- **`SensorGlyph`:** now draws the real top-view sensor prop, `SensorTop` from `HandheldSensor.tsx`. The plan-space API stays the same, the facing is measured through `toPx`, and it gains an `opacity` prop. `size` now means width across the facing direction (default 52).
- **`LightPath`:**
  - `ringClip` defaults to the room whenever `layout` is given;
  - pulse mark size never goes below 2.5 px.
- **`ArrivalHistogram`:**
  - the left padding is `fontSize × 1.95`;
  - the top padding is `fontSize × 1.45 + 52`;
  - the y-axis label's position scales with the font.
- **`KitOptics`:**
  - partition label centred;
  - the room's wall line is redrawn over the floor drawings;
  - sensor size is `0.24 × ppm`;
  - band fill opacity 0.2, and the legend swatch now matches the band (no edge lines);
  - the cloud uses the default levels `[0.25, 0.6]` with no blur.

## Remaining limitations
- H is still a dashed-ring stand-in, not the guesser's overhead token. Where the token goes, and whether it covers the cloud, is a scene decision.
- `Optics.tsx` now imports `SensorTop` and `facingOf` from `HandheldSensor.tsx`. If that file renames those exports, this one breaks.
- The cloud is honestly a thin lens along the tangent, because the wall points span only about 20° as seen from H.
- `possibleCloud` is recomputed every frame (about 28k points). On a fine full-room grid, pass a smaller box around H.
- The histogram's late bump is a readable stand-in; the real return is far weaker, so it needs the "illustrative" label wherever it appears.
- `LightPath` maps only corner points: exact for plan, oblique and perspective views, not for a curved mapping.
- `ArrivalHistogram` needs fonts loaded before it measures its callout labels.

## Final API summary
**`lib/optics.ts`** (plan metres, unchanged in this round):
- **Types and layout:** `P2`, `OpticsLayout`, `Rect`, `LAYOUT`, `layoutPoints`, `confocalPath`.
- **Geometry and blocking:** `segmentIntersection`, `segmentHitsRect`, `segmentBlocked`, `occluderRect`, `roomRect`, `pointInRect`, `clipSegmentToRect`, `firstOccluderHit`, `assertPath`.
- **Clearance and visibility:** `pointSegmentNearest`, `segmentRectNearest`, `occluderClearance`, `pathClearance`, `visibleIntervals`.
- **Paths and timing:** `pathLength`, `pathCumulative`, `pointAtDistance`, `timeNs`, `lengthForTime`, `confocalRadius`, `PULSE_SPEED = 0.18`.
  - `pathSchedule(points, {start, dur?, speed?})` returns `{start, dur, end, length, tNs, vertexFrames, progress(f), frameAt(s), nsAt(f)}`.
- **Ellipses:** `ellipseFromFoci`, `ellipseFromTime`, `ellipsePoint`, `sampleEllipse`.
- **Arcs and bands:** `sampleArc`, `arcRectIntervals`, `bandMembership`.
- **Possible-locations field:** `possibleCloud(grid, bands, 'product' | 'min')`, `extractContours`, `resampleClosed`, `catmullRomClosed`, `polygonArea`.
- **Scattering and histogram:** `scatterDirections`, `arrivalHistogram`.
- **Self-test:** `selfTest()` returns rows with a `clearance` field plus `minClearance`.

**`components/v02/Optics.tsx`:**
- **`LightPath`:** `{points, toPx, t, pulses?, pulseGap?, dash?, intensityFalloff?, color?, pulseColor?, width?, pulseRadius?, showFull?, ghost?, lane?, bounceRings?, ringRadius?, arrive?, ringClip? (defaults to the layout's room), layout?, clearPx?, hidden?, opacity?, asGroup?}`
- **`ScatterFan`:** `{origin, dirs, length, toPx, t, release?, color?, width?, seed?, tips?, layout?, stopMargin?, hidden?, opacity?, asGroup?}`
- **`CandidateArc`:** `{center, r, toPx, t, a0?, a1?, tone?, clip?, width?, pen?, dashArray?, hidden?, opacity?, asGroup?}`
- **`Band`:** `{center, r, halfWidth, toPx, t, a0?, a1?, tone?, clip?, fillOpacity? = 0.2, edges? = false, asGroup?}`
- **`PossibleCloud`:** `{toPx, contours? | field? + levels? = [0.25, 0.6], t, tone?, blur? = 0, outline?, asGroup?}`
- **`WallMarker`:** `{p, toPx, label?, t?, active?, tone?, size?, labelOffset?, fontSize?, asGroup?}`
- **`SensorGlyph`:** `{p, dir, toPx, size? = 52, t?, firing?, opacity?, asGroup?}`, which draws `SensorTop`.
- **`SightLine`:** `{a, b, toPx, layout?, t, tone?, width?, asGroup?}`
- **`ArrivalHistogram`:** `{bins, values, peaks?, t, width, height, labels?, ticksNs?, highlight?, tone?, yMax?, cursor?, peaksT?, fontSize?, style?}`
- **`TimingRuler`:** `{ns, width, t?, minor?, major?, height?, rateLabel?, ratePosition?, marker?, markerLabel?, fontSize?, style?}`
- **`PulseDot`:** `{x, y, r?, color?, intensity?, opacity?}`
- **Helpers:** `TONES`, `mixHex`, `polyD`, `arcPointPx`, and the `ToPx` and `Tone` types.

## Files and stills
Files I modified:
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Optics.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitOptics.tsx`

`/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/lib/optics.ts` needed no changes in this round.

All stills are in `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitOptics/`:
- **`review1/`** (before fixes): half scale at 0, 40, 80, 120, 160, 200, 239; full scale in `review1/full/` at 8, 24, 34, 46, 58, 64, 100, 120, 160, 196, 200, 210, 230.
- **`review2/`:** half scale at 0, 40, 80, 120, 160, 200, 239; full scale in `review2/full/` at 8, 64, 150, 160, 180, 196, 230.
- **`review3/`** (final): half scale at 0, 40, 80, 120, 160, 200, 239.

=========

I reviewed the room kit and fixed eleven defects. The stills look clean at every tilt. `npx tsc --noEmit -p .` passes for the whole project, including the other agents' current files.

One problem I could not fix, because the cause is in `layout.json`: the sensor point S lands at the operator's chin. S is 1.2 m up, and the chibi rig at 1.7 m has its chin at about 1.21 m. So whatever she holds at S sits at chin level and nearly covers her mouth, in the dev comp and in every room-view scene. The director should do one of these:
- Lower `sensor.h` to about 0.95 m. That gives the chest-height hold KitCast uses.
- Move `operator.x` to about 0.6 m. The sensor then sits beside her head, and the beam no longer passes behind it.

## Defects found and fixed

**KitRoom (the dev comp)**
1. **Off-model hold.** The operator's hand went to a bare dot at her ear and read as a head scratch. She now holds the real HandheldSensor, gripped by her right hand. The sensor's far face sits exactly on the projected S, so the light path starts on the prop. It is drawn at 0.6 of the model size (about 0.2 m, a realistic handheld size), upright, and clears her mouth. Her elbow swings out and down; the other solution folded her arm across her face. The hand stays on the grip at every tilt.
2. **Gaps in the light path while the partition wobbled.** The path was cut against the partition's rest position, so a lean opened a visible gap. The path is now drawn whole behind the room's objects, and the partition and people hide what they stand in front of.
3. **Blocked path failed silently.** A path through the partition was just hidden. It now throws in dev, as DIRECTION.md requires.
4. **Text too small.** Wall-sample labels were 26 px and the debug readout 24 px. They are now 34 px and 30 px.
5. **Labels crossed the wall's base line mid-tilt.** The labels now have a cream halo.
6. **Placeholder tokens.** The overhead tokens and sensor glyph were stand-in circles. The dev comp now uses the cast agent's real tokens (`CheckerToken`, `GuesserToken`, `SensorTop`), which also checks `tokenAt` sizing. The sensor glyph sits on S at every tilt.

**RoomSet**

7. **Door sliver mid-tilt.** Around tilt 0.79–0.92 the side-wall door showed as a blue sliver, with a fixed-size knob sticking out past the wall. The door and side skirting now fade out while that wall is still wide (gone by tilt 0.75). The knob is now a flat disc on the wall that foreshortens with it.
8. **White notches in the plan wall lines.** The cut ends of the walls stayed cream while the wall tops turned ink. They now change colour with the wall tops.
9. **Plant covered the W1 label** around tilt 0.35, because the upright plant does not shrink while the wall heights do. The plant has a more upright shape, is 1.3 m tall, and sits at (0.4, 0.32). It clears W1 at every tilt. The `plant` prop now also accepts a custom spot.
10. **Wrong doc.** The `door` prop said "left wall"; the door is on the right wall.

**room.ts**

11. **Duplicated numbers and a missing helper.** `WALL_T` and `SLAB_T` now live in room.ts; `roomBounds` and RoomSet share them, and RoomSet still re-exports `WALL_T`. I added `visibleSpans` and `visibleRuns`, which cut a path where something hides it, with sub-pixel boundaries so a split path doesn't step during the tilt. I checked them against brute-force sampling at five tilts: no mismatches. I also added `uprightBox` for hiding a path behind a person.

Partition.tsx: reviewed, no defects, unchanged. Everything stays deterministic: only `rand()`, no `Math.random` or `Date`.

## Remaining limitations
- **Beam behind her head.** At tilt 0 the S→W beam is hidden behind her head and appears from the top of her hair, about 80 px above the prop. That is correct occlusion, but it follows from the sensor-height problem above.
- **Grey wall tops.** For about 6 frames near tilt 0.85, the wall tops are grey on their way from cream to ink.
- **Double image during the tilt.** Between tilt 0.5 and 0.75 the fading upright figures and the tokens show together. Tokens appear at chest height, so mid-tilt they sit near the fading figure's waist.
- **Tilting the sensor makes it slide down the body.** While the camera tilts, heights compress but the figure does not, so the held sensor moves from chin to chest. The hand follows correctly.
- **Path cutting ignores the lean.** `visibleRuns` uses the partition at rest; that is why paths go in `backdrop` by default.
- **Depth sort is approximate.** `depthSort` still treats people as flat upright cutouts.

## Final API
- **`lib/room.ts`**
  - Unchanged:
    - Projection: `viewAt`, `project`, `projectWith`, `projector`, `tiltAt(g, start, dur, ease?)`, `DEFAULT_VIEW`, `WIDE_VIEW`, `screenToFloor`, `screenToPlan`, `roomBounds`, `planeMatrix`, `pathOf`, `pathWith`, `hull`.
    - Occlusion and depth: `occluderBox`, `hiddenByBox`, `isHiddenByOccluder`, `occluderSilhouette`, `crossesOccluder`, `depthSort`, `depthOf`.
    - Characters: `rigAt`, `figureMix`, `rigStyle`, `tokenAt`, `RIG_PX`, `PERSON_M`, `TOKEN_H`, `TOKEN_R`.
  - New:
    - `WALL_T`, `SLAB_T`
    - `type HiddenTest = (p: PlanPt) => boolean`
    - `type VisibleOpts = {view?, layout?, hidden?, noOccluder?, steps?}`
    - `visibleSpans(a, b, tilt, opts?) → [u0, u1][]`
    - `visibleRuns(pts, tilt, opts?) → string[]` (SVG path data, one per unbroken run)
    - `uprightBox(x, z, {w?, d?, height?, h?}) → Box`
  - `rigAt` now documents the chin-height constraint.
- **`<RoomSet tilt items? backdrop? children? partition? wobble? door? plant? view? layout?>`**
  - `plant` is now `boolean | {x, z, heightM?}`.
  - Exports `ROOM_COLORS`, `WALL_T`, `DOOR`, `PottedPlant`, and `PLANT = {x: 0.4, z: 0.32, heightM: 1.3}`.
  - `backdrop` is documented as the place for light paths.
- **`<Partition tilt wobble? view? layout? opacity? style?>`**: unchanged.

## Stills inspected
- Baseline (before fixes): `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitRoom_review0/` frames 0, 40, 80, 120, 160, 200, 239.
- Final: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitRoom/` frames 0, 40, 80, 120, 160, 200, 239.
- Full-res rounds in `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/`:
  - `rv0/`: frames 0, 25, 96, 106, 116, 126, plus partition and door close-ups
  - `rv1/`: frames 10, 22, 100, 112, 120, 128, plus right-wall and operator close-ups
  - `rv2/`: frames 10, 100, 112, 124, 160
  - `rv3/`: frames 0, 92, 104, and `ops.png` (the operator side by side at three tilts)

Files modified:
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/lib/room.ts`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/RoomSet.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitRoom.tsx`

=========

I found 11 defects in the four files and fixed all of them. `npx tsc --noEmit -p .` now passes for the whole project with no errors. I did three render-and-inspect rounds at full size plus the official stills, and checked the motion numerically (stills listed at the end).

**Defects found and fixed**
1. **Steadying hand didn't hold the box** (`KitCast`, sensor). The checker's left fist only touched the box's bottom-left corner and read as floating.
   - Added a `cradle` point to `sensorPoint` and a `frontTop` option to the rig, so the palm sits under the box and the box is drawn over it.
   - The arm needs elbow -1; with elbow 1 the upper arm swung across the chest.
2. **The hold was boilerplate.** Placing the two hands took six lines with magic numbers (`GRIP`, a "+6" offset), and that code broke for flipped rigs.
   - Replaced by `holdSensor(ch, pose, opts)`, which also accepts `farFaceAt` to put the working face on a projected point such as the layout sensor S.
3. **Flipped holder reversed the readout.** Time ran right to left. `HandheldSensor` now takes `mirrored`, and `sensorPoint` handles `rotate` and `flip`. Checked visually on sheet 2.
4. **Plan-view sensor floated about 80 px from the operator token.** Tokens now take `reach` and `reachSide`: an arm runs from the nearer shoulder, under the shoulders, and the sensor is drawn over the hand.
5. **Guesser token's dark-red star read as a splat or decal.** Replaced with five curved parting lines from the crown whorl, which reads as spiky hair seen from above.
6. **Floor shadow rose with the hop.** It stays on the floor now and shrinks a little with height. The rest pose is unchanged: I diffed it against the Video 01 rig (sheets 3 vs 4) and only edge antialiasing differs.
7. **Knee could jump when mixing poses** (`mixFoot`). An unset knee was treated as 0 instead of the side default (±0.35), so blending a set knee against an unset one jumped.
8. **`settlePose(0)` wasn't the stand pose.** The free knee was already turned inward before the settle cue; it now ramps in with `amount`.
9. **Hand helpers ignored idle drift.** `reach2`, `handWorld2` and the other world helpers left out the rig's idle drift, so a hand on a fixed object drifted 1–2 px. A `RigPlace` can now carry `frame`, `seed` and `life`, and the shared `livePose()` is exported. The measured error for the grip and cradle hands is 0.000 px over all 240 frames.
10. **Anticipation lifted the guesser's feet** (`bob -4`). It now stretches the torso with the feet planted.
11. **The guesser's idle-life setting stepped from 0.25 to 0.8 at arrival.** That popped the head tilt and lean; it now eases in over 16 frames.

**Additions for scene builders**
- **Crouch arms:** `handsOnKnees(pose)` rests both hands on the knees of any crouch, which fixes "the arms hang to the floor" for static crouches. Also added `kneeWorld` and `reachGround`.
- **Trip timing:** `tripDuration(plan, framesPerStep)` gives when the walker arrives.
- **Footstep cues:** `tripContacts(start, plan, framesPerStep, pulse)` gives the frame of each foot landing. I cross-checked the result against the foot lift values. The dev comp exports its own as `KITCAST_FOOTSTEPS` (14 contacts).
- **Verified, not changed:** planted feet don't slide (0 px measured), and the knees move only with the swinging foot, with no flips.

**Final API summary**
- **`Cast2.tsx`**
  - `<Character2>` takes every `Character` prop plus `front: 'both'` and `frontTop?: 'L'|'R'`.
  - Types: `Pose2` (adds `frontTop`), `Leg`, `Foot`, `RigPlace {x, y, scale, flip?, frame?, seed?, life?}`.
  - Pose tools: `mixPose2`, `withPose`, `livePose(pose, frame, seed, life, eyeDarts)`.
  - Presets: `IDLE2`, `ARMS.*`, `HANDS_ON_HIPS`, `ARMS_CROSSED`, `HAND_OVER_MOUTH`, `SNEAK_ARMS`, `HANDS_UP`, `EXPR.{smug, busted, deadpan}`, `CROUCH`, `SETTLE`, `settlePose`, `settleAt`, `handsOnKnees`.
  - Gait: `walkPose`, `phaseFromDistance`, `strideLength`, `GAITS`, `planTrip`, `tripPose`, `tripDistance`, `tripDuration`, `tripContacts`.
  - World helpers: `handWorld2`, `reach2`, `reachGround`, `kneeWorld`, `mouthWorld`, `eyesWorld`.
  - Low level: `solveLeg`, `STAND_FEET`, `KNEE_DEFAULT`.
- **`HandheldSensor.tsx`**
  - `<HandheldSensor bars? bumpFrom? reveal? bumpHighlight? screen? led? ledColor? firing? skin? scale? rotate? mirrored?/>`
  - `holdSensor(ch, pose, {grip?, gripWorld?, farFaceAt?, support?, sensorScale?, rotate?})` returns `{pose, hand, screen, farFace, cradle}`.
  - `sensorPoint(name, scale, rotate, flip)`, with `cradle` added to the point names; `SENSOR`, `SENSOR_GRIP`, `SENSOR_BARS`, `SENSOR_BUMP_FROM`, `<SensorReadout/>`.
  - `<SensorTop/>` and `facingOf` are unchanged; `Optics.tsx` imports them.
- **`Tokens.tsx`**
  - `<GuesserToken/>` and `<CheckerToken/>` take `{x, y, size?, facing?, opacity?, scale?, shadow?, asGroup?, look?, reach?, reachSide?}`.
  - `tokenSize(ppm, widthM)`.
- **`KitCast.tsx`**
  - `inputProps {sheet: 1–4}` renders the QA sheets: 1 guesser poses, 2 checker poses and tokens, 3/4 Video 01 rig vs `Character2`. Normal renders are unaffected.

**Remaining limitations**
- Crouching while walking still leaves the arms hanging. `handsOnKnees` fits static crouches only.
- `peek` moves only the head and shoulders.
- Raised brows (`brows` 1, busted) overlap the guesser's spiky hairline. Video 01's rig does the same.
- The sensor's two lens rims over the top edge read a little like knobs.
- The busted hands-up snap moves the hands about 90 px per frame over 2–3 frames. That is deliberate for the comic beat.
- Plan-view token arms are straight and capped at 0.72 × size.

**Stills inspected**
- Official: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitCast/00000_0.png`, `00040_40.png`, `00080_80.png`, `00120_120.png`, `00160_160.png`, `00200_200.png`, `00239_239.png`
- Before-fix baseline: `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitCast_review0/`
- Full-resolution rounds, crops and sheets: `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/rvcast/{a,b,c,d}/` (sheets 1–4, plus `diff34.png` for the rest-pose check)

=========

I found six defects in the warehouse kit and fixed them in the three assigned files. The robot's perspective cheat is still there: it can't be removed with this camera. `npx tsc --noEmit -p .` passes for the whole project.

I rendered the seven requested frames (0, 40, 80, 120, 160, 200, 239), plus extra frames for the walk and the tilt, and did four render-inspect-fix rounds. The walk and occlusion fixes were also checked numerically.

**Defects found and fixed**
1. **Sliding feet (dev comp).** The person was the Video 01 rig sliding toward the camera with legs that never moved, and the arms flapped sideways. Fix: a new helper in `Warehouse.tsx` makes the `Character2` rig walk toward the camera with its feet planted on footprints. The far foot sits higher on screen, the near foot lower, and the opposite arm swings with the leading leg. Measured drift of a planted foot is 0.000 px at tilt 0 and at tilt 0.3. One side effect: the rig's body is drawn over its leading foot, so its built-in shadow would sit ahead of the feet. The helper returns a shadow to draw under the body instead.
2. **Person drawn in front of rack S1 (frame 160).** Occlusion only sampled ±0.28 m around each item, but the rig's hands reach about ±0.42 m. A check of the paint order confirmed the old code drew the person in front of S1 whenever z ≥ 1.65 and tilt ≥ 0.31. Fix: the sampling now covers the full drawn width at more heights, with a default of 0.42 m. Two new constants, `WH_RIG_HALF_W` and `WH_BOT_HALF_W`, give the right width for a person and for the robot.
3. **Shelf contents vanished in one frame during the tilt** (at about tilt 0.89). The boxes, beams and uprights now fade out over tilt 0.71–0.89. The door windows also fade instead of switching off.
4. **Door porthole read as a halo** floating above the person's head in frames 0–40. It is now a tall vision panel beside the head.
5. **Hard-coded timing in the dev comp.** The robot's speed, braking and pitch-spring numbers, the pulse timing, and its fade/transform-origin settings were typed directly into the comp, so every scene would have had to copy them. They are now `botDrive`, `botPulseAt`, `whBotStyle` and `BOT_ORIGIN`. The roll-in is solved backwards from the stop pose. Position matches the old code exactly; pitch differs by at most 0.003. `whFirstHit` and `whViewEdge` replace the dev comp's own sight-line calculations.
6. **Text and tokens.** The R1–R4 labels were 28 px; they are now 32 px. The footer is now 30 px. The person's plan token was a plain circle; it now matches the style in `Tokens.tsx`. That token is local to the dev comp, because `Tokens.tsx` has no generic person token.

**Other fixes**
- **Spokes:** they fade out above about 1.5 m/s, so they never appear to spin backwards.
- **Code check:** the files contain no `Math.random` or `Date`; randomness uses the seeded `rand()`.

**Remaining limitations**
- **Robot perspective cheat.** The camera has to be front-left so the relay wall's inner face is visible. That hides the robot's front face, but the rig shows its front-right side anyway to keep the eyes visible, so its lid recedes up-right while the shelves recede up-left. Removing it means moving the face, which is a design decision for you.
- **Walk direction.** The walk only works toward the camera. The body speeds up slightly on the first step and settles a little early on the last one; the feet stay planted throughout.
- **Occlusion and framing.** Items are still sorted against whole racks, not per part. The relay wall is still narrow in the front view.
- **Tokens.** `Tokens.tsx` (not my file) still needs a generic person token.

**API now (additions are new; everything else unchanged)**
- `DeliveryBot.tsx`
  - **Rig:** `<DeliveryBot x y scale? travelled? speed?(m/s) brake? eyes? look? blink? pulse? flip? shadow? style?/>`. `DeliveryBotG` is the same robot as an SVG group.
  - **Plan glyph:** `<BotTop x y ppm heading? pulse? scale? opacity? floor?/>` and `BotTopG`.
  - **Data:** `BOT`, `BOT_UNITS_PER_M`, `EYES`, `mixEyes`.
  - **Added:** `BOT_ORIGIN`; `botDrive(f, {v0, keys: {at, dur, to}[], x0? | endX?, dir?, fps?, fullBrake?})` → `{x, travelled, speed, speedPerFrame, accel, brake}`; `botPulseAt(f, start, every, len = 18, end?)`.
- `Warehouse.tsx`
  - **Set:** `<WarehouseSet view? tilt? items? backdrop? door? markings? viewConfig?>children</WarehouseSet>`, with `WhItem = {key?, x, z, w? (default 0.42), height?, node}`.
  - **Geometry:** `WAREHOUSE`, `WH_BLOCKERS`, `WH_PTS`, `whSightBlocked`, `whVisibleFromZ`, `WH_PERSON_HIDDEN_MAX_Z`, `whCheck`.
  - **Projection:** `WH_VIEW`, `whViewAt`, `whProjectWith`, `whProject`, `whPathWith`, `whScreenToFloor`, `whTiltOf`, `whSmooth`.
  - **Figures:** `whFigureMix`, `whRigAt`, `whRigStyle`, `whBotAt`, `whBotTopAt`, `whTokenAt`.
  - **Also:** `WH_COLORS`, `WH_BOT_FOOTPRINT`.
  - **Added:**
    - Sight lines: `whFirstHit(a, b, boxes?)` → `WhPt | null`; `whViewEdge(sensor?, wallX?)` → `WhPt`.
    - Robot fade: `whBotStyle(tilt, scale)`.
    - Item widths: `WH_RIG_HALF_W`, `WH_BOT_HALF_W`.
    - Walk: `whPlanWalk(x, z0, z1, {heightM?, stepM?})`; `whWalkDistance(g, start, plan, framesPerStep)`; `whWalkAt(plan, travelled, tilt, view?)` → `{x, y, scale, z, depth, pose: {feet, sink, armL, armR}, shadow, moving}`.
    - Types: `WhWalkPlan`, `WhWalkState`.

**Files changed**
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/Warehouse.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/components/v02/DeliveryBot.tsx`
- `/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/dev/KitWarehouse.tsx`

Copies of the originals are in `/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/`.

**Stills inspected** (all under `/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/kit/KitWarehouse/`)
- `review/` (before fixes): frames 0, 40, 80, 120, 160, 200, 239
- `review2/`: frames 0, 30, 36, 40, 48, 60, 80, 100, 120, 126, 150, 160, 170, 178, 186, 200, 239, plus `walk_sheet.png`
- `review3/`: frames 0, 40, 80, 120, 160, 200, 239; full resolution in `review3/full/`: 90, 104, 172, 239
- `review4/` (final): frames 0, 40, 60, 80, 120, 160, 200, 239

=========

## Path-legibility kit (qa/PATH_LEGIBILITY_PLAN.md §3)

Fixes three room-view defects: light legs that read as going OVER the partition, the gap at the wall foreshortened to a
sliver, and characters towering over the partition because rigs did not scale with the set. Heights changed in research
(`research/geometry/geometry_check.py`, 71 checks pass) and were synced: partition **2.0 m**, light-path plane (sensor S,
wall spots W, his point H) **0.95 m**. Plan x and z, every distance, delay, arc and `pathSchedule` are unchanged.

**The rule.** Light paths in the room are drawn at `RAISED_TILT` (0.10) or at tilt 0. Every leg that passes the
partition goes behind its END (the far or near vertical edge, at least 24 screen px below that end's top corner), never
across its top band. Assert it at module load with `assertAroundTheEnd` for every tilt the shot draws light at and at the
camera's settled zoom. Light behind the screen or a person is hidden exactly (`partitionHides`, `figuresHide`). Never
fade the partition to show light behind it; the "seen from above" `PlanCard` carries the top-down read.

**`lib/room.ts`**
- `rigScale(s: ViewState, heightM = PERSON_M)`: `heightM · s.ppm · s.height / RIG_PX`. 1.314 at tilt 0, 1.202 at 0.10, 0.66 at 0.45. `rigAt` uses it; `depthSort` billboards match (upright width `w · ppm · max(height, 0.3)`, height `height · ppm · heightScale`).
- `PARTITION_ARCH = 0.09`, `PARTITION_FOOT_H = 0.07` (Partition.tsx imports these, so the drawing and the tests cannot drift), `partitionTopH(z, layout?)`: the drawn arched top's height at plan z.
- `hiddenByPartition(p: PlanPt, s: ViewState, {layout?, padPx = 3}) → boolean`: a camera-ray test against the partition as drawn (both faces, the arched top band, the end faces, plus `padPx` world px of ink outline). Points on the camera's side are never hidden. The partition at rest: do not draw light while it wobbles; pass a moved layout for S9's push.
- `partitionHides(s, h, opts?) → HiddenTest`: the same at the light-path plane `h` (plan points in), for `LightPath`, `ScatterFan` and dots `hidden`. OR it with `figuresHide`.
- `partitionCrossings(a, b, s, {zoom, layout?, steps?}) → {spans, crossings, overPx, frontClearPx}`: the visible spans `[u0, u1][]` of a→b; each place it goes `in` behind or comes `out` from behind the partition, by which edge (`far` by the wall, `near`, or `top`) and `belowCornerPx` (screen px at `zoom` below that end's top corner); `overPx` (visible far-side light above the top edge, must be 0); `frontClearPx` (screen clearance of a camera-side leg).
- `assertAroundTheEnd(label, polylines: PlanPt[][], s, {zoom, minBelowCornerPx = 24, minFrontClearPx = 18, allowFront?, layout?})`: throws with a per-leg report if any leg crosses the top band, goes in or out less than `minBelowCornerPx` below a corner, shows light above the top, or (legs with no crossing, S→W) comes within `minFrontClearPx` of the partition on the camera side. `allowFront` for front legs that stop on the face (the blocked ghost line, S9's blocked pulses). Never downgrade it to a warning.
- `TOKEN_H = LAYOUT.sensor.h`.

**`components/v02/Cast2.tsx`**
- `rigCovers(place: {x, y, scale}, q: {x, y}, growPx = 0) → boolean`: the shared pose-independent Character2 silhouette approximation (head and hair ellipse, torso with arms, legs) for clearance checks (replaces the scenes' private `rigHides`).
- `figuresHide(s, h, figs: {z, place}[]) → HiddenTest`: a light-plane point behind a figure (`p.z < fig.z + 0.05`) is hidden inside its silhouette, so a W→H leg ends at his outline and fans and dots pass behind both people.
- `rimFlash(t, scale, color = C.saffron) → string | undefined`: the arrival cue, a crisp saffron rim on the wall-side (up-left) outline as a CSS `drop-shadow`; pass as `style={{...rigStyle(tilt, scale), filter: rimFlash(t, place.scale)}}`, e.g. `t = tw(g, hit - 1, 3) * (1 - tw(g, hit + 6, 10))`.

**`components/v02/RoomSet.tsx`**: `PottedPlant` on the set's height scale; `<GapMarker tilt t layout? view? halfW = 0.12>` (ink, no saffron construction aids; gone when the gap closes).

**`components/v02/S9_Room.tsx`**: `walkAt` scales the rig with `rigScale` (the local `RIG_PX` is gone).

**`components/v02/PlanCard.tsx`** (new, screen space, outside the room camera)
- `<PlanCard x y t layout? view? area? checker? guesser? sensor? gap? label = "seen from above" light? marks?>`: a 480 × 408 card (`PLAN_AREA` 448 × 330 plus title and margin; `planCardSize(area)`). `t` 0..1 slides it in; pass `in · (1 − out)`. `light(toPx, ppm)` draws over the floor and under the partition and tokens; `marks(toPx, ppm)` on top. Plan coordinates are the layout's metres, so pass the scene's own paths and schedules. Strokes inside the card: path 6, pulse radius 11, lane 11, ring 34.
- Views: `PlanView {cx, zTop, ppm}`, `PLAN_VIEW` (218 px/m: the gap 142 px, a token 109 px; the partition runs off the bottom), `PLAN_VIEW_FULL`, `planCardToPx(view?, area?)`, `viewForArea`, `mixPlanView`.
- Pieces: `PlanRoute` (dashed route drawn to `head`), `PlanCross`, `PlanSpot`, `facingFromMotion`, `PlanTape({points, head, toPx, stepM = 0.29979, width?, label = "1 ns"})` (ticks every 1 ns of path, the label on the first complete piece in 30 px mono).
- Where: S1.4–S1.5, the S1.7 tape, S3.1, S9.2. Never in S9.3, R4, or beside the readout inset (never two plan views at once).

**`lib/shots.ts`**
- `RAISED_TILT = 0.1` (a low rise on purpose: above about 0.12 W4, then W3, come out across the near panels' top band).
- `CAM_RAISED {cx 895, cy 455, zoom 1.25}` (room centred), `CAM_PATH {996, 455, 1.25}` (room in screen x ~320..1350, PlanCard top right), `CAM_PATH_SIDE {531, 455, 1.15}` (room in screen x ~905..1855, cards on the left), `PLAN_CARD_RECT {x 1400, y 40, w 480, h 408}`. `CAM_ROOM` unchanged.

**Check numbers**: `qa/path_legibility/rule_check.ts` (command in its header) prints the per-tilt table in the plan's §6.
