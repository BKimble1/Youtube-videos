// R2 machines: the coordination system's three families (combat units, drones, heavies), their damage and
// fragmentation, formations with LOD, and world attach points for contacts. Merge MECH_MATS into the scene's mats.
// All builders are pure functions of (spec, t) → engine Items. World units are metres; headings as the engine's
// headingVec (0 = north/−z, 90 = east/+x). Pass `ground` (x,z → y) so feet, wrecks and debris sit on the terrain.
//   combatUnit(UnitSpec)      march (gait.path/dist, planted feet), strike, block, grab, raise, look, hits (recoil),
//                             fall (+getUp), lockAt (eye → amber), damage {chest, back, pauldronL/R, armOff, dent, leak,
//                             dead}, lod 'full' | 'mid' | 'far'.  unitAttach() → hands, wrists, elbows, shoulders, eye,
//                             chest, backPlate, knees, feet (world, after falls).  unitImpacts() → Impact[] for FX/sound.
//   drone(DroneSpec)          hover/bank (vel), look (gimbal), mark (beam), cutter 0..1, struck, hit (tumble+crash),
//                             smash (pieces), scale, lod.  droneAttach() → body, eye, cutterTip.  droneImpacts().
//   heavy(HeavySpec)          walk (gait), look, ram {t0, target} (tip hits target at t0), aim / fire {t0, target},
//                             stumble, pinned, kneeBreak {leg, dir} (leg drops off, hull rolls onto its side, wreck
//                             stays), damage {plateL, plateR, top, nose, dead}, stepOver, lod.  heavyAttach() → ramTip,
//                             muzzle, eye, knees, feet.  heavyImpacts() (incl. footfalls for ground shake).
//   formations                lineSlots / arcSlots / ringSlots → standing(); column(path, …, haltAt) (halt as one);
//                             reformSlots(A, B, t0, ripple, …) (line → arc, ranks keep order); withReplacements();
//                             combine(); armyItems(view, t, formation, {ground, maxFull, maxMid, farFrom, ctl}).
export {MECH_MATS, EYE, FLAT, straightPath, polyPathFn, footAt, partItem, eyeGlow, beam, cable, spray, fluidPool, makeThrow, thrownPose} from './kit';
export type {Ground, Path, Throw} from './kit';
export {combatUnit, solveUnit, unitAttach, unitImpacts} from './unit';
export type {UnitSpec, UnitDamage, ArmCtl, Impact, Side} from './unit';
export {drone, droneAttach, droneImpacts} from './drone';
export type {DroneSpec} from './drone';
export {heavy, solveHeavy, heavyAttach, heavyImpacts} from './heavy';
export type {HeavySpec} from './heavy';
export {lineSlots, arcSlots, ringSlots, standing, column, reformSlots, withReplacements, combine, armyItems} from './formation';
export type {Slot, Formation, ArmyOpts} from './formation';
export {UNIT, DRONE, HEAVY, DEBRIS, U as UNIT_DIM, HV as HEAVY_DIM} from './parts';
