// R2 machines: the coordination system's three families (combat units, drones, heavies), their damage and
// fragmentation, formations with LOD, and world attach points for contacts. Merge MECH_MATS into the scene's mats.
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
