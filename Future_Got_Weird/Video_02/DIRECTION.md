# Video 02 direction: how the film is built

Working title: **How Cameras See Around Corners**. Viewer question: *how can a sensor recover information about
something it cannot directly see?* Takeaway: *indirect light still carries clues about a hidden object; precise timing
and computation can recover some of those clues.*

This file is the working brief for every scene and kit agent. The Video 01 kit (`source/src/lib`, `components/`) is
reused; its conventions (frame-driven motion, `useG()`, `at()` cues, `camPath`, `Layer` depth, `reach` IK, no
`Math.random`, no wall clock, cue sheets for sound) still apply. The channel rules live in the brief: nothing public
identifies the channel owner; evidence on screen is genuine; illustrations and toy numbers are labelled.

## 1. Cast (Video 01's accepted rigs, `components/cast.ts`; do not redesign)

| Role | Rig | Why |
|---|---|---|
| **The hider** | `guesser` (red spiky hair, white/saffron stripes, cheeks) | the confident one from Video 01; believes "out of sight" means "out of reach" |
| **The sensor operator** | `checker` (grey bob, round glasses, coral cardigan, pencil) | calm, deadpan, the one who checks |
| The warehouse walker (act 5) | `person` (blue top, auburn bob; Video 01's "works on people too" character) | the someone around the robot's blind corner |
| Delivery robot (act 5) | new prop rig `DeliveryBot` | illustrative application, not a demonstration |

The rig is frontal. Turns, walks and crouches get purpose-built variants (`components/v02/`), never a twisted frontal
rig. In the plan view the characters become **overhead tokens** (a top-down head with the same hair and clothing
colours), designed to read as the same people.

## 2. One room, one coordinate model

Every physical claim is drawn from one declared geometry, `research/geometry/layout.json` (metres): a relay wall, an
occluder (a free-standing partition that does not touch the wall, leaving a gap light can pass through), the sensor S
and the hidden person H. The occluder blocks the straight line S→H. The relay wall is visible from both S and H.

Plan coordinates: `x` to the right, `z` = distance from the relay wall toward the camera (the wall is z = 0), `h` =
height above the floor. One projection maps a plan point to the screen:

- **room view** (`tilt = 0`): an oblique "dollhouse" view of the same room from the front and a little above. The
  relay wall stands at the back; the floor recedes; the partition is a slab standing on the floor; characters are the
  upright frontal rigs standing at their plan positions, scaled by depth; layers sort by depth (far first).
- **plan view** (`tilt = 1`): straight down. Walls become lines, characters become tokens, light paths are exact.
- a tilt between 0 and 1 is a continuous camera move ("let's look from above"); it is the film's signature transition.

**Light paths are drawn from the layout, never by hand.** Straight segments between reflections; no segment may cross
the occluder (checked in code, a failing segment throws in dev); slowed and simplified, never a recording of photons.
Pulses are dots/dashes that travel along a path at an illustrative, visibly slowed speed. Scattering shows several
directions. Intensity falls with each bounce (thinner, paler later segments).

**Declared simplification for timing geometry (act 3):** 2D, confocal: emitter and detector together at S, one
sampled wall point W at a time. Path S→W→H→W→S, length `2|SW| + 2|WH|`. Knowing `|SW|`, one arrival time gives a
circle of radius `|WH|` around W: every point on it fits. Several wall points give several circles that cross at H.
Noise thickens each circle into a band; the bands overlap in a region, not a point. Separated illumination and
detection points give ellipses instead; the film shows circles and says it is a simplified picture. The real 2026
sensors are not confocal (see `research/EXPERIMENT_RECORD.md`); the on-screen label is "simplified picture".

**Illustrative numbers** come from `layout.json` and are labelled "illustrative". Light covers about 30 cm per
nanosecond.

## 3. Sets

| Set | Use | Notes |
|---|---|---|
| `RoomSet` | acts 1, 2, 3, 5 callback | warm paper walls; the **relay wall** is a plain matte light wall (`#F4ECD8`-ish with a skirting board, no texture); wood floor; the **partition** is a coral folding screen on feet; a potted plant and a door for scale only |
| `PlanBoard` | the plan view | paper-coloured floor, ink wall lines, coral partition, faint 0.5 m tick marks along the wall only (no grid field) |
| `MirrorBench` | act 2 comparison | a mirror panel and a matte panel side by side in plan view |
| `HistoryShelf` | act 4 | illustrated equipment on a museum shelf with year plates (illustrations, labelled) |
| `EvidenceBoard` | acts 1 and 4 | authentic plots drawn from the authors' released data, pinned with tape, source chip below |
| `WarehouseSet` | act 5 | shelving aisles meeting at a blind corner, floor markings, a convex mirror is NOT shown (keeps the point on light, not mirrors) |

Walls and floors extend well past the frame so camera moves never find an edge.

## 4. Props

`HandheldSensor` (the open kit sensor: a small boxy time-of-flight module with a grip, two windows on the far face and a
small readout on the back that faces us; never a phone; it stands on a small tripod stand for acts 1-3 because the
opening data was captured with the sensor held still), `ResearchModule` (the team's separate smartphone-grade device:
phone-sized, a 10x10 dot grid, labelled as theirs), `ZoneBox3x3` (the small 3x3-zone sensor behind the raw-echo plot and
the U reconstruction; the same box in both shots), `PulseDot`, `ScatterFan`, `ArrivalHistogram`
(bins, a tall first-bounce peak, a small late bump), `TimingRuler`, `CandidateArc`/`Band`, `PossibleCloud` (a soft
region computed on a grid from the same bands), `Stopwatch` (only as a metaphor chip), `Postcard` (for the scrambled
postcard metaphor and its limit), `DeliveryBot`.

## 5. Text on screen

Fredoka for headlines and signs, Nunito for labels and chips, JetBrains Mono for numbers. Phone rule (Video 01):
critical text ≥ 44 px on screen, body text being read ≥ 34 px, guard-rail labels ("illustrative", "simplified picture",
source chips) ≥ 30 px. Labels name things; they do not narrate. Settled labels do not move.

Accuracy labels used in this episode (reuse the wording): "illustrative", "simplified picture (2D)", "slowed down",
"authors' released data", "illustration", "potential use", plus the per-experiment conditions chips defined in
`research/OPENING_EVIDENCE.md`.

## 6. Motion and camera (unchanged from Video 01)

Setup → action → reaction → settle on every sentence. Anticipation, contact, reaction, settle on physical actions.
Hands reach what they touch (`reach`). One camera move per idea, eased, never while something important lands. No
perpetual zooms or bobbing. Holds are designed. Muted test: the picture alone explains the beat.

## 7. Sound

Selective, physical: footsteps, the sensor's soft pulse motif (a metaphor, not photon audio), the partition wobble, the
robot's motors, three or four comic reactions. No whoosh on every cut. Ambience per set, very low.
