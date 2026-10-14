# Canonical robot and branding reference (V2)

Sheet: `production/v2/ROBOT_REFERENCE_SHEET_v2.png` (rendered from composition `V2RobotSheet`, so it always matches the
episode). Every robot in V2 is drawn from one 3D skeleton and one set of part tables, so the robot can't change shape
between shots.

## Stable asset IDs

| ID | What it is | Source file |
|---|---|---|
| RIG-F02 | 3D skeleton: pelvis, torso, neck, head, arms, legs. FK plus two-bone IK for planted feet and placed hands. Units cm, x = robot left, y up, z forward | `source/src/v2/robot/rig.ts` |
| MODEL-F02 | F.02 shell: graphite/gunmetal ring-stack parts, dark visor face, rear head camera dots, chest/back vents, actuator caps at hips, knees, elbows and wrists, five-finger hands | `source/src/v2/robot/model.ts` (kind `F02`), finish in `Robot.tsx` |
| MODEL-F03 | F.03: the same skeleton with a soft, light, fabric-covered shell and a mask-like face | `model.ts` (kind `F03`) |
| MODEL-SIM | The virtual robot: the F.02 shape in translucent simulation blue | `model.ts` (kind `SIM`) |
| MODEL-PERF | Generic stunt performer: violet, faceless, motion-capture dots; deliberately not a real person | `model.ts` (kind `PERF`) |
| MOTION-JUMP | Canonical edge jump: push-off, ballistic flight (fixed physical flight time), feet-first entry; optional speed ramp | `source/src/v2/robot/jump.ts` |
| MOTION-TRIAL | Simulation trial with `stick` / `short` / `faceplant` landings | `source/src/v2/robot/trial.ts` |
| MOTION-WALK | Walk cycle with planted feet; walk-to-edge stop | `source/src/v2/robot/motion.ts`, `jump.ts` |
| SET-FOUNDRY | Steel plant: deck/walkway, ladle (lining, lip, trunnions), molten surface, crane, furnace, haze | `source/src/v2/sets/Foundry.tsx` |
| SET-WORKSHOP / SET-LINE / SET-SIM / SET-AIRBAG | Workshop, assembly line, simulation world (rebuilt from the foundry geometry), airbag rehearsal | `sets/Workshop.tsx`, `sets/Props3D.tsx`, `sets/SimWorld.tsx` |
| FX-SPLASH | Deterministic splash crown (near/far halves), droplets, smoke, flames, flash | `source/src/v2/fx/Splash.tsx` |
| UI-CHIP | The single attribution/label chip style | `source/src/v2/ui/Chip.tsx` |
| CAST | Original illustrated cast (clerks, checker), reused from V1 | `source/src/components/Character.tsx`, `cast.ts` |

## F.02 vs F.03 (as drawn)

| | F.02 (retired, the robots that jump) | F.03 (newer model) |
|---|---|---|
| Shell | Hard graphite/gunmetal panels with visible actuator caps and seams | Soft, light warm-grey fabric cover over padding |
| Face | Black glass visor with a highlight streak | Mask-like face panel |
| Role in V2 | Every jump, workshop, line and foundry shot | Walks in on the line ("newer F.03 fleet") and in the workshop |

## Basis and credits

- **Text sources only.** The appearance follows features stated in sources this environment could reach: the F.02's
  all-dark shell with internal wiring, mesh-finished neck, front head cameras, torso battery and five-fingered hands
  (The Robot Report, Interesting Engineering and KR Asia launch coverage, Aug 2024), and the F.03's soft fabric covering
  and mask-like face (designboom, Gizmodo and robophilosophy coverage of the Oct 2025 launch). It also draws on general
  knowledge of the robots' look.
- **Reference pages from the brief could not be opened.** figure.ai (news and company pages, F.03 page),
  tendril.studio, youtube.com (pfAh5oQDPDM), thinkfoundry.com and commons.wikimedia.org were all blocked by this
  environment's network policy on Oct 14, 2026. No pixels, frames or shapes were traced from any of them.
- **All artwork is original vector illustration** generated from code in this repository. No stock, no AI-generated
  images, no footage.

## Branding

- **No Figure logo or on-body marking is drawn.** The official logo (Wikimedia) could not be loaded. A reconstruction
  from memory would be an unverified "text logo", which the brief rules out.
- **Identification is by narration and plain captions only:** "F.02 / Figure's second-generation humanoid",
  "F.03 · newer model", and the one attribution chip "FIGURE · "F.02 DECOMMISSION" · SEP 30, 2026".
- **To add the real mark later:** download the logo file and its licence from Wikimedia, check that the licence allows
  this use, and add it as an asset with its credit in `production/ASSET_RIGHTS.md`. Placement would be a decal in
  `model.ts` (`F02` decal set, chest plate). The decal system already renders surface-attached, never-mirrored marks.
