# Cyborg Cockroach V1: shot specs (build reference)

Vertical 1080×1920, 30 fps, 936 frames (31.2 s). Narration: `audio/narration/FGW_Cyborg_Cockroach_narration_V1.wav`,
word timings in `source/src/data/timeline.json` (use `word('fire', 0)`, `wordIn('fire the injector')`, `phrase(key)` from
`source/src/timeline.ts`). Shot boundaries are in `source/src/cuts.ts`. Every value is a pure function of the film frame.

## Science that the picture must respect (Paraborg, Le et al., Adv. Sci. 2026; UQ/UNSW)

- A living North Queensland **giant burrowing cockroach** (*Macropanesthia rhinoceros*): rounded, wingless, glossy
  dark brown, about 8 cm long; six spiny legs; two antennae. Not a robot.
- A removable electronic **backpack** (stimulator board + coin cell) with fine wires to electrodes at the **antenna
  bases** and the **cerci**. Steering = brief electrical stimulation of one antenna: stimulating the LEFT antenna makes
  the insect veer RIGHT (and vice versa). Show a brief signal travelling along a wire, then a turn. No lightning bolts,
  no "targeting mind".
- **Two insects, two roles**: an *observer* carries a small Wi-Fi camera (camera module at the front of its backpack);
  the *medic* carries the **launch tube** with a spring-loaded **auto-injector** (clear barrel, amber dose, plunger,
  collar, 31-gauge needle). They never swap roles or gear.
- Launch: a **latch line** tied through holes at the tube mouth holds the injector's collar against a compressed
  **spring**; a pulse heats a **nichrome coil** that cuts the line; the spring drives the injector out; it flies a few
  centimetres to the target. Delivery is a separate, later step: a chemical reaction makes gas that pushes the plunger
  and the dose flows through the needle. Show delivery as an explanatory, **time-compressed cutaway**.
- A **human operator** steers and decides when to fire (handheld remote). Tests used **silicone targets** in a lab
  fixture. The collapsed-building rescue is a **proposed future application**: label it, and never show a human
  injection or a successful treatment.
- No statistics, no solar panels, no weapons look, no projectile across a room (keep distances local: a few cm).

## Shared code (read before building)

- `src/lib/v3.ts` vectors/frames; `src/lib/cam.ts` `lookAt(eye, target, f, cx, cy)`, `proj`, `depth`, `scaleAt`
  (world mm -> px). `src/lib/g3.ts` projected solids (`projPoly`, `projSeg`, `boxFaces`, `cylOutline`, paths).
  `src/lib/scene.tsx` `<Sorted items={[{z: depth, el}]}/>` draws far-to-near. `src/lib/ease.ts` (`sr`, `keys`, `ramp`,
  `easeOut`, `noise1`).
- `src/rig/roach.ts`: `poseRoach({path, s, t, search, offset, pitch, roll, yawAdd, antL, antR})`; paths
  `straightPath(start, yaw)` (yaw 0 = +x, PI = -x; body x = heading, body z = the insect's right) and
  `splinePath([[x,z],...])` (arc-length); the gait is a pure function of distance travelled `s` (feet stay planted in
  the world); stop with `plantedStop(s)` so all six feet are down. Typical walking speed 30-60 mm/s.
- `src/rig/Roach.tsx`: `<Roach pose cam o={{id, gear, shadow, legsBehind, haze}}/>` (gear = element drawn on the back).
- `src/rig/Gear.tsx`: `<Gear id cam f={pose.frame} g={{kind: 'injector'|'camera', loaded, latched, heat, springExt,
  pulses: {antL: [fractions 0..1 along the wire]}, zap: {antL: 0..1}}}/>`, `<Injector id cam s={{f, plunger,
  needleEnd}}/>`, `GEAR_COL`, `CylSolid`, `BoxSolid`, `Spring`, `alongPolyline`, `lightW`. `src/rig/gear.ts` holds the
  hardware geometry (`PACK`, `INJ`, `wires(frame)`). `src/rig/launch.ts`: `launchAt(t, tLaunch, bodyFrame, travel)`,
  `travelTo(faceDist)`, `NEEDLE_TIP`, `EMBED`.
- `src/sets/Lab.tsx`: `LabBackdrop` (screen-space, blurred lab; pans with the camera), `ArenaFloor` (grid mat, y = 0),
  `TargetFixture` (silicone face = plane x = 0, facing +x, centre y = 30, z within ±19.5), `Foam`, `Solid`, `LAB`
  palette. `src/shots/S01.tsx`: the opening (`s01Motion`, `S01_CAM`, `S01_BODY_X`, `FixtureShadow`).
- Style: Weird Crew finish: ink `#172B3A` contours, gradient fills lit from ONE fixed upper-left key light, glossy
  highlights. No neon, no glowing UI, no floating labels, badges, radial graphics or on-screen text inside shots
  (the only text: the small "Future rescue concept" identifier in S12). Captions are drawn by the film on top.

## Frame rules

- **Captions** are drawn in screen space by the film. Default centre **y = 1500** (a two-line block covers about
  y 1410-1590, x 96-936). Keep each shot's key action (hands, contacts, needle, faces, the insect's head) out of that
  band, or note that the caption should go to the top band (centre y about 300) for that shot.
- **Phone UI** zones to keep clear of key action: top y < 150; right column x > 960 for y 1000-1700; bottom y > 1640.
- **Camera**: an intentional start and end composition; at most one eased move per shot (or locked off); no overshoot,
  bounce, reversal, shake or filler zoom. Reserve tracking for real movement through space.
- **Continuity**: an incoming shot starts in the state the outgoing one ended (pose, gear state, direction of travel).
  Equipment follows the body rigidly; the backpack never slides; six legs stay attached; antennae and legs keep moving
  (alive), with breathing (`pose.breath`).
- No black or empty frames; no fades from empty; no blur, flash or spin to hide a cut.

## Shots

| Shot | Frames (s) | Narration | Content |
|---|---|---|---|
| S01 | 0-57 (0.00-1.90) | "This cockroach can fire a needle." | DONE. Ground-level 3/4 close-up, launch on "fire" (0.90 s), injector embeds, insect alive. |
| S02 | 57-102 (1.90-3.40) | "And a person holding a remote" | Controller close-up: gloved thumb lifts off the red button just after the shot (match on action, matching click). |
| S03 | 102-150 (3.40-5.00) | "decides when it shoots." | Operator at the bench (facing screen-left), clear eyeline down to the arena where the insect waits by the target. |
| S04 | 150-273 (5.00-9.10) | "Scientists strapped a tiny launcher onto a living cockroach, then used electrical pulses" | One continuous move: side track along the backpack while the insect walks, then into the left antenna contact; a pulse travels down the wire, the antenna twitches and a right turn begins at the cut. |
| S06 | 273-315 (9.10-10.50) | "to steer it." | Overhead obstacle course: a second pulse, a clear right turn round a foam block; leaves heading screen-right. |
| S07 | 315-372 (10.50-12.40) | "A second cockroach carries a camera," | Low front-side view: the observer insect and its camera; ends pushing toward the lens. |
| S08 | 372-462 (12.40-15.40) | "letting the operator watch as the first moves into position." | Onboard camera view following the medic toward the target; ends as the operator's screen. |
| S09 | 462-537 (15.40-17.90) | "Once it lines up, they fire the injector." | Side cutaway of the launch mechanism: lines up, coil heats, line parts, spring drives the injector to the target. |
| S10 | 537-618 (17.90-20.60) | "They've demonstrated this on laboratory targets." | Target-side section: time-compressed delivery through the needle into silicone; then the fixture reads as a lab target. |
| S11 | 618-655 (20.60-21.83) | "But the plan is to send them" | Lateral move following an insect through a gap in the lab set; a near edge crosses frame (occlusion bridge). |
| S12 | 655-758 (21.83-25.27) | "beneath collapsed buildings, carrying emergency medicine." | Future rubble route at insect height ("Future rescue concept"); reveal the trapped person at the end of the route. |
| S13 | 758-856 (25.27-28.53) | "So if you're trapped and something starts crawling toward you" | Opens close on her face (a cut-in from S12's medium shot), eases back once to a raised view behind the insect's route: it comes through the gap and along the floor toward her hand, a clear gap still between them at the cut; she notices on "starts" (alarm, fingers draw in). |
| S14 | 856-891 (28.53-29.70) | "you might actually" | From her near side, on the same side of the walk line as S15: her face in profile, forearm and hand across the middle, the insect coming in from the right toward her fingers (screen-left, as in S15). Alarm softens into cautious recognition; the near hand pulls back a little, then opens. |
| S15 | 891-936 (29.70-31.20) | "want it to get closer." | The opening's camera exactly (S01_CAM carried into the alcove): the insect walks screen-left toward her open hand, which lies back from the target's spot and off the needle's line (a clear gap: no contact, no injection); the last frame flows into S01 frame 0 (loop). |

## Rubble and the survivor's alcove (coordination note, read before building S11/S12)

The integrator is building `src/sets/Alcove.tsx` (the sheltered space where the survivor lies, used by S13-S15). Make the
rubble route in `src/sets/Rubble.tsx` / S12 lead INTO this alcove and share its look:

- Palette `ALC` in `Alcove.tsx` (concrete `#9C9590` / `#7E7772` / `#B8B0A6`, crevice `#3A3633`, rebar `#8A4B2E`, dust
  `#C9BFAF`, daylight `#FFE8B8`); reuse its primitives (`Chunk` concrete block with chipped edges and aggregate speckle,
  `Rebar`, `DustMotes`, `LightShaft`, `DustFloor`) instead of a second style.
- World layout (mm, floor y = 0): the survivor lies prone along world x with her head toward +x; the midpoint between her
  elbows is the origin `ALCOVE.anchor = [0, 0, 0]`; her near hand rests near `ALCOVE.hand` (about [215, 0, 40]); the gap
  the insect comes through is at `ALCOVE.gap` (about [470, 0, -60]), opening toward -x/+z. The route arrives at the gap
  from beyond it (+x side). A daylight shaft falls from above-right onto her face and hands.
- S12's last frames look along the route into the gap and see her (head, shoulders, forearms) beyond it, lit by the
  shaft; export the camera function so the integrator can composite her rig there.
