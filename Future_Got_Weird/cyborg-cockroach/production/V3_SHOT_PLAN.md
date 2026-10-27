# Cyborg Cockroach V3: shot plan and build rules

V3 is a direction pass on V2 (`exports/FGW_Cyborg_Cockroach_V2_REVIEW_1080x1920.mp4`, code at commit adf4e10) on the
**locked narration** (same WAV and word timings: `source/src/data/timeline.json`; `word()`/`wordIn()` in
`source/src/timeline.ts`). 936 frames, 30 fps, 1080x1920. Composition `CyborgCockroachV2` (the V2 framework now carries
V3: `source/src/v2/Film2.tsx`). Cut table: `source/src/v2/cuts2.ts` (`SHOTS2`, `shotRange(id)`).

Goal: a miniature science-action film. An extraordinary, instantly readable action in the first second, every shot
reveals something new, scenes progress smoothly (a meaningful change every ~0.8-1.3 s, but let physical actions
complete), cause and effect are clear, and the ending loops into the opening.

## Look (non-negotiable; same as V2)

- Authentic Weird Crew **flat 2D vector** illustration, restrained 2.5D layered parallax. Flat fills, one cel tone,
  crisp highlights, the crew ink contour `#172B3A`. No 3D look, no perspective renderers (`lib/cam`, V1 `rig/Roach.tsx`,
  `rig/Gear.tsx`, `sets/*`), no generic or AI faces.
- The insect only through `v2/roach/Roach2D.tsx` + `v2/roach/Gear2D.tsx` with orthographic views (`v2/roach/ortho.ts`
  `viewAt(azDeg, elDeg, pxPerMm, worldPoint, screenX, screenY)`; heading +x faces screen-right at az 0). Pose with
  `poseRoach` (`rig/roach.ts`: tripod gait as a pure function of distance s, planted feet; `straightPath`, `splinePath`,
  `plantedStop`). Body about 80 mm. Speeds 30-60 mm/s. Six legs always attached and in contact when standing, two
  antennae, no clipping, no impossible rotations, no teleporting.
- Lab: `v2/sets/Lab2.tsx` (`LabWall2`, `Bench2`, `Surface2D`, `Box2D`, `Target2D`). **Targets are now CLEAR silicone**
  (pale aqua, translucent, glints; the needle reads inside them). Rubble kit: `v2/shots/e/art.tsx` (`RB` palette,
  `Slab`, `Rebar`, `Pebbles`, `Shaft`, `Motes`, `Grit`, `Glow2`, `Vignette`...), crack: `v2/shots/e/crack.tsx`.
  Parallax: `v2/dc/camera.tsx` (`Layer`).
- Cast: only existing Weird Crew rigs. Operator: `crew/operator` (`OperatorAtBench`, `RemoteCloseUp`, `Remote`,
  `GLOVE`, `operatorExpr`, `blinkAt`...). Gloved hands: `v2/dc/Hand.tsx`. Survivor: `crew/person` (`Survivor`...). Keep
  eyes, hands, clothing and features stable and anatomically correct.
- No on-screen words except captions and the one small "Future rescue concept" label (drawn by the film over E1-E2).
  No callouts, circles, badges, floating labels, diagrams, icons, arrows, end cards.
- Camera motion only when driven by a physical event (follow the launching injector, follow the crawling insect, rise
  from the insect to the operator, move through the gap the insect enters, follow a gaze, track alongside). No
  constant artificial push-ins, no zooms into nothing, no whip pans, no shake, no reversals. At most one move per shot
  (a move may have a clear motivated change of direction, e.g. follow then track back).
- Science: living, remotely steered cockroaches (Macropanesthia, wingless, glossy brown). TWO configurations:
  the MEDIC (injector kind: clear launch tube, spring, latch line + nichrome coil, auto-injector with amber dose, needle)
  and the OBSERVER (camera kind, `tint: '#6B4030'`). Never one insect carrying both. Steering: a brief pulse along a
  wire to an antenna-base electrode (left antenna -> veers right). Launch: the coil cuts the line, the spring drives the
  injector out along the tube (barrel rear stays in the tube), the needle goes ~5 mm into silicone; delivery is a
  separate step (gas pushes the plunger). Lab targets are silicone. The rescue is a FUTURE concept: no human injection,
  no treatment shown, the needle never points at a face, no contact with skin.
- Pure functions of the frame (no Math.random, no Date). SVG ids unique per shot AND per frame
  (`${prefix}f${f}`), because contact sheets render many frames in one SVG document.

## Continuity contracts

- Lab: the medic's targets face it at screen-right in the hook (A1). After A1 the injector stays embedded in the A1
  target; the insect walks on with an EMPTY tube: draw it with Gear2D `{kind: 'injector', spent: true, injRear:
  INJ.loadedRear + A1_TRAVEL, springFront: SPRING_FREE, latched: false}` and draw the fired injector in the target with
  `Injector2D({id, v, frame: a1InjFrame(), rear: INJ.loadedRear + A1_TRAVEL})` (both in `v2/roach/Gear2D.tsx`;
  `A1_TRAVEL`, `A1_FACE`, `a1InjFrame`, `a1Pose`, `a1View`, `A1_LED_END` from `shots/h/A1.tsx`; the A1 stance has the
  body origin at world x = 0 heading +x, the target face at x = A1_FACE). Draw the target, then the insect and the
  injector, then the target's veil (`Target2D ... veil={0.62}`) so a needle inside it reads as inside.
- B1-B5 happen "before" (fitting and steering demonstration): a loaded medic. C: medic + observer. D: a fresh loaded
  medic fires at a new clear target. E-F: loaded medic (never fired), observer insect in E5.
- Captions: never over the needle, the target, the cockroach (body, head, antennae) or faces. Phone UI zones to avoid:
  top y < 150, right column x > 960 for y 1000-1700, bottom y > 1640. Caption bands: 270 (top) or a low band
  (1480-1600), or a number that clears the subjects.
- Film-level transitions drawn by the integrator over the cut (you do NOT draw them): A5 -> B1 a blurred foreground
  foam block crosses the frame (frames 133-150, full cover around 141-145); D5 -> E1 a daylight bloom (white-warm,
  frames 611-628). The "Future rescue concept" label over E1-E2.

## Shots (frames; words)

| Id | Frames | Words | Picture | Owner |
|---|---|---|---|---|
| A1 | 0-41 | "This cockroach can fire a needle." | Continuous: approach to a clear target, trigger 0.30 s (coil cuts the line), the spring launches the injector 0.30-0.50, the needle into the silicone 0.50 (squash, rebound), hold, track back along the launcher to reveal the living insect; board LED blinks. | H |
| A2 | 42-66 | (pause) | Match cut: the board LED (`A1_LED_END`) -> the remote's red button at the same spot; the gloved thumb presses it (LED, click); a slight pull back to the operator's hand and coat sleeve. | A |
| A3 | 67-89 | "And a person holding a" | The operator (OperatorAtBench), holding the remote, looking down; the camera follows his eye line down to the bench where the medic stands by the target with the injector in it. | A |
| A4 | 90-112 | "remote decides" | Low side view at insect height: the medic (empty tube) turns away from the target (planted-foot pivot, tripod) and walks off left toward another test area; the camera trucks with it. | A |
| A5 | 113-142 | "when it shoots." | Rise over the table: the medic crossing the tray toward a foam course, the operator at the far side guiding it with the remote; the rise brings a foam block into the near foreground (film wipe to B1). | A |
| B1 | 143-186 | "Scientists strapped a tiny" | Gloved hands lower the module onto the living insect's back and press it home (high angle). | B |
| B2 | 187-208 | "launcher onto a" | Tight side view of the launcher and its mounting (tube, clamps, saddle, board on the pronotum; breathing, legs). One lateral track along the tube. | B |
| B3 | 209-242 | "living cockroach," | Walking across a textured test surface (cork/mesh/sandpaper look), low side tracking, six legs in contact. | B |
| B4 | 243-282 | "then used electrical pulses" | Close on the guidance electronics: the pulse runs from the board along the left wire to the antenna electrode; the antenna twitches. | B |
| B5 | 283-314 | "to steer it." | Obstacle course: the insect visibly changes direction (turns right) around a block. | B |
| C1 | 315-340 | "A second cockroach" | The two configurations side by side, clearly different silhouettes (launch tube vs camera module + aerial). | C |
| C2 | 341-371 | "carries a camera," | Follow/push to the observer's lens. | C |
| C3 | 372-401 | "letting the operator" | Through the lens: the observer's POV feed following the medic. | C |
| C4 | 402-423 | "watch as the" | The feed is the operator's monitor; he watches, thumb near the button. | C |
| C5 | 424-465 | "first moves into position." | Overhead (top view): the medic heading for a clear target in the arena, the observer behind it; establishes where the target is. | C |
| D1 | 466-487 | "Once it lines up," | Low side view: it stops and aligns precisely with the target (antennae touch the face). | D |
| DT | 488-495 | "they" | The operator's thumb presses the fire button (insert, new framing, not a copy of A2). | D |
| D2 | 496-517 | "fire the" | ECU: coil glow, line parts (release 16.60 s = frame 498), spring launch, needle into the clear silicone, rebound. | D |
| D3 | 518-543 | "injector." | Brief section: gas pushes the plunger, the amber dose blooms in the clear silicone. | D |
| D5 | 544-618 | "They've demonstrated this on laboratory targets." | One rise over the bench: the medic, spent targets with their doses, the lab; the camera rises toward the bright window (light bloom into E1). | D |
| E1 | 619-654 | "But the plan is to send them" | A collapsed building in daylight; the camera descends to a narrow opening at ground level under broken concrete, the medic tiny in front of it. | E |
| E2 | 655-679 | "beneath collapsed" | Follow the medic into the gap (too small for a person: a rescuer's boot or glove for scale), light falls off. | E |
| E3 | 680-699 | "buildings," | Side-tracking under a huge fallen beam, dust in a light shaft. | E |
| E4 | 700-715 | "carrying" | Close on its legs over uneven rubble (gravel, rebar). | E |
| E5 | 716-736 | "emergency" | The observer's camera view down a dark passage (feed look, its own light). | E |
| E6 | 737-757 | "medicine." | A field operator studies the feed (monitor at the rubble edge) and directs the medic (D-pad). | E |
| F1 | 758-792 | "So if you're trapped" | The trapped survivor; a small shadow moves beneath the rubble near her; she notices. | F |
| F2 | 793-817 | "and something starts" | The medic emerges from a crack. | F |
| F3 | 818-847 | "crawling toward you..." | She turns her head, sees it: disgust, recoil. | F |
| F4 | 848-872 | "you might" | It crosses a narrow ledge (side view, the drop below, big scale). | F |
| F5 | 873-891 | "actually want" | Her expression: disgust -> cautious hope as she sees the medical device. | F |
| F6 | 892-935 | "it to get closer." | It comes into the foreground; bold macro of the living cockroach and the needle device; loops into A1. | H |

## Build rules for each group

- Edit only your group file `source/src/v2/shots/grp<G>.tsx` and files under `source/src/v2/shots/<g>/`. Reuse and
  adapt the V2 shot code already there (group A: `shots/a`, B: `shots/b`, C: `shots/c`, D: `shots/d`, E and F:
  `shots/e`; F also reads `shots/h/F5.tsx`). Shot code may import from other groups (read-only). Register every shot
  of yours in `SHOTS_<G>` (retired V2 shot ids may simply be dropped).
- Shared kit (`v2/roach/*`, `v2/sets/*`, `v2/dc/*`, `crew/*`, `cuts2.ts`, `Film2.tsx`, `captions2.ts`, `events2.ts`,
  `shots/all2.ts`, `shots/h/*`): do not edit; tell the integrator what you need.
- Export `CAPY_<G>: Record<shotId, number>` and `cues<G>(): Cue[]` (type `Cue` from `source/src/events.ts`; kinds: tick
  (feet; `touchdownsP` / `steps` from events.ts), click, spring, thock, zing, sizzle, pulse, fizz, button, grit, creak,
  air) with times read from your shot code; only sounds that strengthen a physical action.
- Check on rendered frames: from `source/` run `./sheet2.sh out.png "f1,f2,..." [true]` (up to 16 frames at quarter
  size or 36 at sixth size) and `npx remotion still src/index.ts FilmStillV2 out.png --props='{"f":N,"captions":true}'`.
  Four CPUs are shared by six builders: keep renders small and few. Outputs in the scratchpad (your own subfolder).
  Typecheck: `npx tsc --noEmit -p .` (errors in src/v2 must be zero).
- Do not run git commands that change state. Do not render the full film.
