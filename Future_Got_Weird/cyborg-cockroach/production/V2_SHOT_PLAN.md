# Cyborg Cockroach V2: shot plan and build rules

V2 is a visual rebuild on the **locked V1 narration** (same WAV, same word timings: `source/src/data/timeline.json`,
lookups `word()`, `wordIn()` in `source/src/timeline.ts`). 936 frames, 30 fps, 1080x1920. Composition
`CyborgCockroachV2` (`source/src/v2/Film2.tsx`). Shot boundaries: `source/src/v2/cuts2.ts` (`SHOTS2`, `shotRange(id)`).

## Look (non-negotiable)

- Authentic Future Got Weird / Weird Crew **flat 2D illustration**, like the finished Shorts (see the frames in
  `moth-silk-web-shooter/exports/FGW_Real_Web_Fluid_V6_REVIEW_1080x1920.mp4` and `glass-climbing/exports/*V4*`):
  flat fills, one cel-shade tone, crisp highlights, the crew ink contour (`#172B3A`), big readable subjects, the teal
  lab palette (pale mint wall, shelves of coloured jars, a teal stripe, dark bench top over teal cabinets).
- **No 3D look**: no perspective cameras (`lib/cam`), no V1 renderers (`rig/Roach.tsx`, `rig/Gear.tsx`,
  `rig/Section.tsx`, `sets/Lab.tsx`, `sets/LabRoom.tsx`, `sets/Alcove.tsx`, `sets/Rubble.tsx`), no perspective floor grids.
- The insect is always drawn with `v2/roach/Roach2D.tsx` + `v2/roach/Gear2D.tsx` through an orthographic view
  (`v2/roach/ortho.ts`: `viewAt(azDeg, elDeg, pxPerMm, worldPoint, screenX, screenY)`). Profile: az 0, el 0-15
  (the insect heading +x faces screen-right). Three-quarter: az 15-60, el 10-30. Top: el 90.
  Posing: `poseRoach({path, s, t, search, antL, antR, offset, pitch, yawAdd})` from `rig/roach.ts` (tripod gait as
  a pure function of distance s: feet stay planted; `straightPath(start, yaw)` yaw 0 = +x; `splinePath([[x,z],...])`;
  `plantedStop(s)` gives an s with all six feet down). Speeds 30-60 mm/s. Body is about 80 mm long.
- Cast: only the existing Weird Crew rigs. Operator: `crew/operator` (`OperatorAtBench`, `RemoteCloseUp`, `Remote`,
  `GLOVE`, expressions). Gloved hands: `v2/dc/Hand.tsx` (`Hand`, `HAND_RELAXED`... color `GLOVE`), the finished
  Shorts' hand. Survivor: `crew/person` (`Survivor`, `survivorLayout`), the crew "person", prone, facing screen-right.
- Lab set: `v2/sets/Lab2.tsx` (`LabWall2`, `Bench2` in scene px; `Surface2D`, `Box2D`, `Target2D` in insect mm through
  the same view as the insect). Parallax: `v2/dc/camera.tsx` (`Layer`, `layerTransform`) for scene-px layers.
- No on-screen words except the captions and the one small "Future rescue concept" label (drawn by the film over E1).
  No callout bubbles, circular labels, floating diagrams, icons, charts, arrows. No credits or end cards.
- Motion in every shot (gait, antennae search via `t`, breathing via `t`, hands, reactions, dust). One eased camera
  move per shot at most (or locked off), no shake, no bounce, no reversal, no random zoom. Transitions by matched
  shapes and actions (button -> LED, lens -> feed, needle -> target, lab gap -> rubble gap).
- Science: living, remotely steered cockroaches; the injector and the camera ride DIFFERENT insects; steering is a
  brief pulse along the wire to an antenna-base electrode (stimulating the LEFT antenna makes it veer RIGHT), never
  lightning; launch (spring) and delivery (gas pushes the plunger, dose through the needle) are separate steps; targets
  are silicone lab targets; the rescue is a future concept; never a human injection or treatment; no statistics.
- Every value is a pure function of the frame (no Math.random, no Date). SVG ids unique per shot (prefix with the id).

## Continuity contracts

- In the lab the medic heads screen-RIGHT and the target is at the right (A1, D1-D5). In the rubble it travels
  screen-right toward the survivor (E1). F5 = A1's composition with her hand where the target was (loop).
- Medic: injector kind, latched and loaded unless its shot fires it (A1 at 0.90 s; D2 at the second "fire").
  Observer: camera kind, slightly lighter shell (`tint: '#6B4030'`).
- The injector deploys with `deployAt(t, tRelease, travel)` (Gear2D): it extends along the tube, the barrel's rear
  stays in the tube, the needle goes 5 mm into silicone. Never a free-flying dart.

## Shots (frames; narration)

| Id | Frames | Words | Picture | Group |
|---|---|---|---|---|
| A1 | 0-54 | "This cockroach can fire a needle." | Macro 3/4: the insect fills the frame, injector aimed at the silicone target at right, coil already glowing; on "fire" (0.89 s) the line parts, the spring snaps, the needle goes into the silicone; recoil; push along the needle. | H |
| A2 | 55-82 | "And a person holding a" | Gloved thumb presses the remote's red button (press about 2.35 s), LED. | A |
| A3 | 83-102 | "remote" | Match cut button -> the backpack's red LED (same screen spot, size); the signal runs along the board trace to the coil, which glows. | A |
| A4 | 103-135 | "decides when it shoots." | The operator at the bench, eyes on the arena (insect + target with the injector in it), a small decisive nod. | A |
| B1 | 136-185 | "Scientists strapped a tiny" | Top view: gloved hands lower the backpack onto the living insect's back and press it home. | B |
| B2 | 186-221 | "launcher onto a living" | The hands lift away; the insect sets off (antennae, legs). | B |
| B3 | 222-254 | "cockroach, then used" | Walking naturally across the lab surface, all six legs in a tripod gait (tracking). | B |
| B4 | 255-282 | "electrical pulses" | Wiring -> electronics -> antenna: a pulse runs from the board along the left wire to the antenna-base electrode, which glows; the antenna twitches. | B |
| B5 | 283-314 | "to steer it." | The insect turns clearly right (round a foam block). | B |
| C1 | 315-344 | "A second cockroach" | Two insects, two jobs: the medic (launch tube) and the observer (camera) side by side. | C |
| C2 | 345-371 | "carries a camera," | Push to the observer's camera lens. | C |
| C3 | 372-429 | "letting the operator watch as the first" | The lens's view: a ground-level POV through a miniature foam course following the medic. | C |
| C4 | 430-465 | "moves into position." | The feed becomes the operator's monitor; he watches, thumb by the button. | A |
| D1 | 466-489 | "Once it lines up," | Profile: the medic walks up to the target and lines up (stops, settles). | D |
| D2 | 490-511 | "they fire" | ECU of the tube: coil glows, line parts, spring snaps, the injector extends, the needle meets the silicone (release on "fire", 16.6 s). | D |
| D3 | 512-577 | "the injector. They've demonstrated this" | Section through the silicone: the needle in; gas pushes the plunger; a small amber dose blooms in the silicone. | D |
| D5 | 578-619 | "on laboratory targets." | Back to the whole animal and the target in the lab (and more targets on the bench). | D |
| D6 | 620-654 | "But the plan is to send them" | The medic heads into a narrow dark gap between lab blocks; the camera follows into it (gap fills the frame). | D |
| E1 | 655-757 | "beneath collapsed buildings, carrying emergency medicine." | Collapsed building interior: from a matching narrow opening, a parallax track with the insect crawling through broken concrete, rebar and dust toward a trapped person (the crew survivor) in a pocket beyond. | E |
| F1 | 758-799 | "So if you're trapped" | Her face (close): dusty, tired; her eyes follow a sound near the debris. | E |
| F2 | 800-827 | "and something starts" | A crack in the concrete at close range: antennae, then the head emerge (3/4 front view). | E |
| F3 | 828-855 | "crawling toward you..." | She recoils, startled. | E |
| F4 | 856-890 | "you might actually" | The insect comes on, the mounted injector clearly visible; her fear turns to realization / cautious hope. | E |
| F5 | 891-935 | "want it to get closer." | Close: the cyborg cockroach approaches her open hand (A1's composition; loops into frame 0). | H |

## Build rules for each group

- Edit only your group file `source/src/v2/shots/grp<G>.tsx` and new files under `source/src/v2/shots/<g>/` (lower case,
  your own). Register each shot in `SHOTS_<G>`. You may add shared helpers only in new files you own; tell the
  integrator if a shared file (`v2/roach/*`, `v2/sets/*`, `v2/dc/*`) needs a change rather than editing it.
- Export from your group file: `CAPY_<G>: Record<shotId, number>` (caption centre y for each of your shots: 270 top
  band, 1500 low band, or a value that keeps the caption off faces, needles, contact points and the insect's head;
  phone UI zones: top y < 150, right column x > 960 for y 1000-1700, bottom y > 1640), and `cues<G>(): Cue[]` (type
  `Cue` from `source/src/events.ts`; kinds: tick (feet; use `touchdownsP(poseAt, f0, f1)` from events.ts), click, spring,
  thock, zing, sizzle, pulse, fizz, button, grit, creak, air) with times read from your shot code.
- Check your work on rendered frames: from `source/` run `./sheet2.sh out.png "f1,f2,..." [true]` (film frames, up to
  16 at quarter size or 36 at sixth size) and, for detail, `npx remotion still src/index.ts FilmStillV2 out.png
  --props='{"f":N,"captions":true}'`. Keep renders small and few (four CPUs are shared with other builders). Put outputs
  in the scratchpad. Typecheck: `npx tsc --noEmit -p .` (ignore errors outside src/v2).
- Do not run git commands that change state. Do not render the full film.
