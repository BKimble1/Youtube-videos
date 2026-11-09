# Robot Escapes Jail (FGW Short): build brief and module contracts

Project: `/home/user/Youtube-videos/Future_Got_Weird/robot-escapes-jail/`. Remotion 4.0.533 + React SVG, 1080×1920, 30 fps,
972 frames (32.40 s). Source root `source/src/`. `node_modules` is installed in `source/`.

**Read first:** `production/DIRECTION.md` (the creator's direction, verbatim — it takes precedence), `production/SCIENCE_NOTES.md`
(the verified facts), `../FGW_EDITING_RULES.md` (the channel's standing rules), `production/NARRATION_LOCKED.txt`.

## The film (narration locked; times are measured word starts, `src/story.ts` → `T`, `SHOTS`)

| Shot | t (s) | Narration | Picture |
|---|---|---|---|
| S1 | 0.00–3.10 | "This robot escaped JAIL… by MELTING." | FRAME 0 = the payoff: the silver robot halfway through the bars; lower body liquid metal flowing through the gap toward us; upper body still humanoid; cyan eyes on the viewer; red alarm sweeping; the guard (right) reacts. Camera tracks sideways with it. Visible melt surge on "MELTING" (2.13–2.87). Eyes glance at the guard; the guard drops his coffee cup (~1.3 s); camera whips DOWN following the falling cup (~2.8–3.1). |
| S2 | 3.10–5.80 | "Scientists locked it inside a tiny cage." | The cup's circular splash (top-down) match-cuts to the robot's round head seen from directly above, in the cell (earlier). The camera rises and tilts to a frontal view. The heavy barred door slides shut and slams on "cage" (5.14–5.52). Robot looks at the bars, then at the viewer. |
| S3 | 5.80–8.80 | "But instead of breaking the bars… It MELTED." | Robot reaches, presses its hand on a bar ("breaking" 6.33): nothing moves; annoyed look ("bars" 6.89). A heat indicator appears (the induction coil under the cell floor glows, heat shimmer, a small thermometer icon rising). Feet lose shape ("It" 7.63); the body collapses downward in ONE continuous fluid morph on "MELTED" (7.84–8.50); the face stays readable until the end, then dissolves; the eyes are the last to go. |
| S4 | 8.80–13.55 | "Its entire body turned into liquid metal. Then it slipped straight through the bars." | Camera pushes low toward the floor over the shimmering puddle ("liquid metal" 10.45). Then the liquid flows through the bar gaps ("slipped" 11.86) — follow the leading edge; ONE continuous camera move crosses from inside the cell, over/through the bar line, to outside. Silver collects outside. The guard stares in disbelief. The robot does NOT reassemble. |
| S5 | 13.55–17.02 | "Then scientists collected the metal and molded it back into shape." | Match cut: the puddle → the same shape in a lab collection dish. A gloved scientist's hand collects it (pipette/syringe) "collected" 14.47, pours it into a small humanoid silicone mold "molded" 15.43; a simple cooling transition; the mold opens to reveal the re-formed solid figure on "shape" 16.47. Hands do every step: nothing happens on its own. |
| S6 | 17.02–22.45 | "How? It's made from a metal that melts near body temperature. And magnets help control its movement." | Push into the figure's metallic surface → a clean science cutaway. Gallium + magnetic microparticles; a thermometer gauge reaching the melting point (GALLIUM MELTS 29.8 °C, BODY TEMP 37 °C mark); solid → liquid; then a magnet and field lines steering the blob. Heat (an alternating-field induction coil) melts it; the magnet steers it — keep them visibly separate. |
| S7 | 22.45–27.82 | "Scientists are exploring whether robots like this could one day retrieve objects from inside your body." | A magnetic field line becomes a path through a stylised, clearly-a-model STOMACH MODEL. A tiny silver device navigates, approaches a small object, melts around it, re-solidifies and pulls it out (the 2023 lab demo). Then the model sits inside a ghosted human outline: "FUTURE IDEA" — clearly a possibility, not a procedure. Fascinating, not gory. |
| S8 | 27.82–32.40 | "So apparently… Even prison bars can't stop a robot anymore." | Back in the jail: the guard looks at the empty cell; a single silver droplet slides past his foot ("Even" 29.29); he slowly looks down ("can't" 30.32); two cyan eyes open in the droplet ("robot" 30.88) and glance at the camera — the last frame cuts back to frame 0 (eye-matched), so the Short loops. No outro, no end card. |

## Scientific guard-rails (from SCIENCE_NOTES.md)

- Material: gallium with embedded NdFeB magnetic microparticles. Gallium melts at 29.8 °C (the composite ~30.6 °C) — BELOW body
  temperature 37 °C. Heating in the demos: an ALTERNATING magnetic field (induction) — show an induction COIL; never a hot plate.
  Cooling is passive (room air). A magnet / field gradient STEERS it, solid or liquid.
- After the escape, the liquid was collected and recast in a MOLD by people. Never show the robot reassembling itself.
- Medical: only a MODEL stomach was used (ball removal; drug delivery). No animal or human tests. Label it as a model demo, and
  the human-body idea as future/hypothetical.
- Allowed labels: "GALLIUM + MAGNETIC PARTICLES", "GALLIUM MELTS: 29.8 °C", "BODY TEMP: 37 °C", "AC FIELD HEATS IT", "MAGNET → STEERS",
  "COOLS → SOLID", "STOMACH MODEL", "LAB DEMO (2023)", "FUTURE IDEA". Avoid "melts at body temp", "self-reforms", "metal cage",
  "pig stomach", "in vivo".
- The jail, the guard, the coffee and the robot's personality are creative metaphor (the real cage was a small lab cage).

## Shared contracts (read; do NOT edit unless you own them)

- `src/lib.ts`: `FPS`, `W`, `H`, `clamp`, `ss(t,a,b)` smoothstep, `ss5` (C2 step for camera moves), `lerp`, `easeOut`, `easeIn`,
  `keyS(t, [[t,v],...])` keyed scalar, `hash(n)`, `noise1(x, seed)` (deterministic — **never Math.random / Date**), `ring(t,t0,f,decay)`.
- `src/story.ts`: `T` (word times), `SHOTS` (shot ranges). All beat times come from `T`.
- `src/world.ts`: the jail's 2.5D world. World units u: the robot is **10 u tall**. x right, h up (floor h=0), d depth away from the
  viewer. Bars stand on d=0 (`BAR_XS`, radius `BAR_R` 0.62, height `BAR_H` 26, clear gap 3.96 u; x=0 is the CENTRE of the
  escape gap). Cell interior d∈(0, `CELL_D`=24), side walls x=±`CELL_HALF`(22), back wall at d=24, wall height 34. Corridor
  (guard side) d<0. `DOOR` x∈[-10.4, 10.4] (bars at ±2.6, ±7.8) slides RIGHT to open. `ALARM` beacon at (15, 30.5, 0.6).
  `GUARD_AT` (13, 0, -11). Camera `Cam3 {x,h,d,yaw,pitch,f}` (pitch + looks down; f = focal px). `project(c,p)` →
  `{x,y,s,z}` (s = px per world unit at that depth = billboard scale), `floorPath(c, pts, h)`, `nearSideClip(c, d0)`,
  `lerpCam`.
- `src/art/palette.ts`: `C` (every colour), `INK` (#172B3A navy), `INK_PX` 2.8, `INK_FEAT` 1.6, `NS` (non-scaling-stroke).
- `src/core/ids.ts`: `uid(tag)` — **every SVG id (gradient, clipPath, mask, filter) must come from `uid`** (several frames share
  one document in contact sheets). `src/core/geo.ts`, `src/core/color.ts` (`mix, lit, shade, rgba`).
- `src/dc/`: the Weird Crew drawing kit: `shade.tsx` (`LIGHT` upper-left, `Capsule`, `Sphere`, `Blob`, `Lin`, `SoftShadow`, `Glow`),
  `ink.tsx` (`Inked` — draws a union ink contour under its children —, `Deco`, `InkLine`, `InkPath`, `INK`), `limb.tsx`,
  `Head.tsx` (crew head + `Expr` presets), `Hand.tsx` (crew hand + poses), `Man.tsx` (the full crew rig `Man`, `ManPose`,
  `Outfit`, 3/4 view facing screen-LEFT; its native size: head radius 96, ≈ 1000 units tall at `s` = 1), `color.ts` `PAL`,
  `math.ts`.
- `src/Captions.tsx`, `src/Film.tsx`, `src/shots/index.tsx` (the shot table) are owned by the director (not builders).

## Style: the channel's Weird Crew vector finish

- Navy ink contours (`INK`) at a constant on-screen width (`vectorEffect="non-scaling-stroke"`, `INK_PX` for silhouettes, ~1.4–2 px
  interior lines) or the `Inked` union contour. Cel / gradient fills lit from the UPPER LEFT. Small white glosses. Bold readable
  silhouettes, clean flat shapes, restrained detail, no photographic textures.
- Deep navy backgrounds, cool steel greys, bright silver robot, cyan eye glow, red alarm accents, warm yellow for science emphasis.
- Reference look (extract frames with ffmpeg at 540 px wide into your scratch dir):
  `../eel-escape/exports/FGW_Eel_Escape_V4_REVIEW_1080x1920.mp4`, `../glass-climbing/exports/FGW_Glass_Climbing_V4_REVIEW_1080x1920.mp4`
  (the Weird Crew character), `../hidden-trigger-robot-target/exports/FGW_Hidden_Trigger_V7_FINAL_REVIEW_1080x1920.mp4`
  (robot hardware + dark lab look), `../zombie-ant/exports/FGW_Zombie_Ant_V4_FINAL_1080x1920.mp4` (Dead Spider drawing core).
- Captions are added by the film in screen space. **Builders draw no captions.** On-screen labels exist ONLY in S6/S7 (science),
  short (≤ 4 words), Nunito 900 (`"Nunito Variable"`) or Fredoka 600, never under x>880 (YouTube's right-side buttons) nor y>1500.
- Keep x 0..1080 composition safe: the key action between x 120 and 880, y 380 and 1450 (captions live around y 300–380 by
  default; the director may move them per shot).

## Determinism and quality

- Everything is a pure function of `t` (seconds). No `Math.random`, no `Date`, no CSS animations, no state.
- Anatomy: no detached joints, floating limbs, eyebrows above heads, impossible intersections. Solid robot proportions identical in
  every shot. Melting is ONE cohesive fluid body, never parts falling apart.
- Performance: a frame must render in < 1.5 s. Avoid huge blur filters over the whole frame; limit filter regions.

## Testing (every builder)

    cd /home/user/Youtube-videos/Future_Got_Weird/robot-escapes-jail/source
    npx tsc --noEmit                               # must pass for your files
    npx remotion still src/test/<name>.entry.tsx <CompId> <scratch>/out.png --props='{...}' --log=error
    # look at the PNG with the Read tool; iterate until it is genuinely good at full size AND at phone size (360×640)

Each builder owns ONLY its named files plus `src/test/<name>.entry.tsx` (its own `registerRoot` + Compositions, 1080×1920; a
contact-sheet composition of several states/times is encouraged). Use your own scratch dir for PNGs, never the repo.
