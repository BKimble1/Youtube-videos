// R2/R3 machines: the coordination system's three families (combat units, drones, heavies), their damage and
// gravity-true debris, formations with LOD, obstacle-aware routes, and world attach points / events for contacts.
// Merge MECH_MATS into the scene's mats. All builders are pure functions of (spec, t) → engine Items. World units are
// metres; headings as the engine's headingVec (0 = north/−z, 90 = east/+x). Pass `ground` (x,z → y) so feet, wrecks
// and debris sit on the terrain. Every t0 is in film seconds. Worked examples: dev/MechLab.tsx (pages 8–15 for R3).
//
//   combatUnit(UnitSpec)  march (gait.path/dist, planted feet; gait.over = low wrecks stepped over), strike/strikes
//                         (combos re-chamber; every strike drives through the hips; step = a planted lunge), block,
//                         grab, raise, look, hits (stagger: shoved pelvis, planted feet, smooth ease-out by 1.7 s),
//                         fall (knees give → topple → settle; limp arms lie on the ground; +getUp), lockAt,
//                         damage {chest, back, pauldronL/R, armOff (joint gives first: hang), dent (eased), leak, dead}
//                         — torn parts are gravity-true debris (fly, bounce, tip flat, stay; drawn at full AND mid LOD),
//                         lod 'full' | 'mid' | 'far'.
//      EXCHANGES (R3)     parry / block (forearm meets the incoming tip `at` in its path; absorb; deflect or hold),
//                         dodge (lean | duck | step: clear before t0), catch (meet, close, absorb, hold(t), wrench),
//                         brace (turn into it, rear foot back, lower, cover, absorb, shove back), shove (two palms,
//                         hips, planted step), press (stepping pursuit of a displaced opponent, guard up), turns
//                         (turn-to-threat with planted pivot steps; head → torso → pelvis), moves (reposition / retreat
//                         facing the threat, guard, shuffle).
//      SECURING (R3)      posture keys ('guard' | 'ready' = weapon lowered but ready | 'lowered' | 'idle'), scan
//                         (sweeps with pauses), attend (snap to and track a moving survivor; turns if far off), restrain
//                         (grip a person's body point and track it; at2 for both hands; press bears down).
//   unitAttach(sp)        → handL/R (= catchL/R = gripL/R = palmL/R), wristL/R, forearmL/R (blocking surface), elbows,
//                         shoulders, eye, head, chest, backPlate, kneeL/R, pelvis, footL/R, root, heading (after falls).
//                         Read it at any film time with {...sp, t: T} to solve a person to a contact.
//   unitImpacts(sp)       → Impact[] {t, pos, dir, strength, kind, side?}: blow, parry, block, catch, shove, step
//                         (each planted footfall), plate / limb / cable / fluid, debris (where torn pieces land), ground
//                         (the fall lands), eye. unitRoot(sp) → {pos, heading} after the locomotion (chain actions).
//   drone(DroneSpec)      hover/bank (vel), look (gimbal), mark (beam), cutter 0..1, struck, hit (tumble, crash,
//                         bounce, settle — the wreck stays), smash (pieces: debris), scale, lod. droneAttach(),
//                         droneImpacts() (+ 'debris' where the crash lands).
//   heavy(HeavySpec)      walk (lateral-sequence gait, 3 feet planted; the hull shifts off a lifting leg and compresses
//                         / settles on each landing; planted feet never slide: the hull lowers instead), look, ram (wind-
//                         up loads the legs → lunge → impact recoil), aim / fire (brace, kick back nose-up), stumble,
//                         pinned, kneeBreak (the lower leg falls off as debris; the hull rolls onto its side, wreck
//                         stays), damage plates (debris), stepOver, keyed feet + plants (landing times), dust (opt-in),
//                         weight (0 = R2), lod. heavyAttach() → ramTip, muzzle, eye, knees, feet, planted.
//                         heavyFootfalls(sp, Ta, Tb) (exact with gait.distAt) and heavyImpacts().
//   formations            lineSlots / arcSlots / ringSlots / perimeterSlots → standing(); column(path, …, haltAt,
//                         idBase, {avoid, clear, overMax}) (lanes detour around wrecks, step over low ones);
//                         reformSlots(A, B, t0, ripple, …); stepInto(A, B, t0) (seeded starts); securing(form, {t0,
//                         posture, span, watch, attend}); staggerT(id, t0, spread) (per-unit offsets);
//                         withReplacements(); combine(); armyItems(view, t, formation, {ground, maxFull, maxMid,
//                         farFrom, ctl}). Obstacles: obstaclesFrom(persistAt(T), T), avoidPath(path, obstacles),
//                         lowObstacles().
//   debris                bodyOf(parts, id), debrisPose(body, launch, t, ground), tearLaunch(), debrisLanding().
//
// R4 (persistence and continuity; everything below is additive or opt-in, defaults unchanged unless said):
//   LOD                   'full' | 'mid' | 'far' now draw the SAME machine: mid has the head (own pose), fists, feet, chest and
//                         back plates, stumps; far (units AND heavies) is drawn from the solved skeleton (farFigure: posed
//                         hulls + tubes, width follows the view angle, tinted like the meshes), so a far unit keeps its pose,
//                         a torn plate / arm stays torn, a toppled heavy stays on its side, a smashed drone stays smashed.
//                         Measured full↔mid silhouette IoU 0.92→0.97, mid↔far 0.65→0.82, luminance 81/90/98 → 81/79/78.
//   falls                 every bone keeps its length through a fall (the crumple squashed legs by up to 0.15 m and arms by 0.23 m);
//                         nothing of the body goes into the ground (a shoulder pad lay 0.13–0.23 m under it); a limp arm lies
//                         out along the ground as the shoulder reaches it and no longer flips its elbow.
//   drone                 crash: all four rotors stay until the two that shear off are thrown and settle; the cutter stays on
//                         the wreck; smash: the arms are a piece too; a far smashed drone is its pieces, not a hovering dot.
//   heavy.clear           (opt-in) capsule obstacles (a water main, a beam) the legs swing their knees clear of; feet stay put.
//                         Heavy legs also no longer flip the knee when the foot is splayed in line with the knee's direction.
//   unit.stagger          (opt-in) loss of balance: carried back, hinged, arms out, N quick planted recovery steps, then guard.
//   unit.sway             (opt-in; armyItems sets 1) seeded weight shifts, torso twist and breath for standing crowds.
//   groundWith(base, chunks)  a ground function that includes rubble chunks (top heights, soft edges): pass it as `ground` and
//                         feet, steps and wrecks stand ON the chunk. phasedGait(gait, id): a seeded step-cycle phase so a group
//                         setting off together does not swing its legs in unison (positions unchanged).
//   lodBySize(view, pos, {full, mid, height})  level of detail from projected pixel height (lens-independent).
//   sprites               beam / cable / fluidPool are clipped at the camera's near plane (they vanished whole before).
export {MECH_MATS, EYE, FLAT, straightPath, polyPathFn, footAt, partItem, eyeGlow, beam, cable, spray, fluidPool, makeThrow, thrownPose, groundWith, farFigure, meshBox, meshPrim, boxPts} from './kit';
export type {Ground, Path, Throw, Chunk, FarPrim} from './kit';
export {combatUnit, solveUnit, unitWorld, unitAttach, unitImpacts, unitRoot, ptAt} from './unit';
export type {UnitSpec, UnitDamage, ArmCtl, Impact, ImpactKind, Side, Pt, StrikeSpec, ParrySpec, DodgeSpec, CatchSpec, BraceSpec, ShoveSpec, PressSpec, TurnSpec, MoveSpec, Posture, ScanSpec, AttendSpec, RestrainSpec, StaggerSpec} from './unit';
export {drone, droneAttach, droneImpacts} from './drone';
export type {DroneSpec} from './drone';
export {heavy, solveHeavy, heavyAttach, heavyImpacts, heavyFootfalls} from './heavy';
export type {HeavySpec} from './heavy';
export {lineSlots, arcSlots, ringSlots, perimeterSlots, standing, column, reformSlots, stepInto, securing, staggerT, withReplacements, combine, armyItems, obstaclesFrom, avoidPath, lowObstacles, phasedGait, lodBySize} from './formation';
export type {Slot, Formation, ArmyOpts, Obstacle} from './formation';
export {bodyOf, debrisPose, debrisLanding, tearLaunch} from './debris';
export type {Body as DebrisBody, Launch as DebrisLaunch} from './debris';
export {UNIT, DRONE, HEAVY, DEBRIS, U as UNIT_DIM, HV as HEAVY_DIM} from './parts';
