// THE LAST CHOICE — R2 battlefield plan (metres; x = east, y = up, z = south; headings: 0 = north, 90 = east).
// One connected district on Manhattan's east–west grid. Every shot places people, machines and the camera against
// these landmarks, so geography stays coherent from the rubble close-ups to the final aerial.
//
//   WEST ◄────────────────────────────────────────────────────────────────────────────► EAST (enemy, skyline)
//   collapsed building │ RIDGE (rubble mound) │ van+radio │ avenue → crater → girder flank (N) │ cross street x=120 → … → skyline
//
// The sun is low in the WEST (behind the Crew as they face the machines): the Crew are rim-lit, the advancing machines
// catch the last warm light on their fronts. Wind from the south-west pushes smoke to the north-east.
import {V3} from '../../kit/math';

export const SUN_TOWARD: V3 = {x: -0.86, y: 0.2, z: 0.14}; // direction toward the sun (unnormalised ok)
export const WIND: V3 = {x: 0.75, y: 0, z: -0.45}; // smoke drift direction (m/s scale ~1)

export const PLAN = {
  /** The Director's rubble ridge: a collapsed building's spill across the west end of the avenue. Crest ~4.5 m. */
  ridge: {center: {x: 0, y: 0, z: 0}, crestH: 4.5, crestZ: [-18, 18] as [number, number], eastFootX: 11, westFootX: -9},
  /** The collapsed building west of the ridge (the Crew arrive from its broken shell and the smoke there). */
  westRuin: {x0: -34, x1: -12, z0: -22, z1: 22, stumpH: 9},
  /** Where the Director lies buried at the start, stands, and where he dies. */
  directorBuried: {x: 0.6, y: 0, z: 2.2} as V3, // y resolved from groundH at use
  directorStand: {x: 1.6, y: 0, z: 1.4} as V3,
  /**
   * The broken vehicle with the radio: a delivery van at the ridge's east foot, its rear jammed into the rubble,
   * pointing out over the avenue (ESE) at his left hand; its open sliding door faces him (SSW).
   */
  van: {pos: {x: 8.3, y: 0, z: 1.15} as V3, heading: 120, tiltDeg: 10},
  /** The radio sits on the van's floor at the open side door (world position of the radio's base). */
  radio: {x: 8.13, y: 0.88, z: 1.81} as V3, // = RADIO.pos in world/props.ts (computed from the van; keep in sync)
  /** He dies sitting against a broken slab a step from the van — radio and body share one frame. */
  deathPos: {x: 7.0, y: 0, z: 3.4} as V3,
  deathHeading: 120, // facing out over the battlefield (east-south-east)
  /** The avenue (roadway z in ±14, sidewalks to ±19, building lots beyond). */
  avenue: {x0: 10, x1: 1400, roadZ: 14, walkZ: 19},
  /** The crater in the avenue: the main battlefield. */
  crater: {center: {x: 62, y: 0, z: 0} as V3, radius: 16, depth: 3.5, rim: 0.8},
  /** North flank: a fallen elevated-rail girder lying diagonally into the avenue, one end on a building. */
  girder: {from: {x: 36, y: 0, z: -17} as V3, to: {x: 80, y: 8, z: -5} as V3},
  /** South flank: a burning building whose facade has spilled across the sidewalk; a bus wreck. */
  southFire: {x0: 28, x1: 64, z: 19},
  bus: {pos: {x: 92, y: 0, z: 9} as V3, heading: 75},
  /** Cross streets (north–south) where machine formations enter the avenue. */
  crossStreets: [{x: 124, w: 18}, {x: 262, w: 18}, {x: 420, w: 20}],
  /** The enemy's approach: formations come west along the avenue and out of the cross streets. */
  enemyFront: {x: 110, z0: -12, z1: 12},
  /** The distant tower that fails in the opening (collapse begins on the first low hit). */
  failingTower: {base: {x: 760, y: 0, z: -300} as V3, height: 230, width: 34},
  /** Skyline mass (generic Midtown-like towers; no real logos). */
  skyline: {x0: 600, x1: 2600, z0: -900, z1: 900},
};

/** Opening aerial path hint: high over the avenue east of the battlefield, drifting west toward the ridge. */
export const AERIAL = {
  from: {pos: {x: 520, y: 210, z: 160} as V3, target: {x: 300, y: 40, z: -60} as V3},
  to: {pos: {x: 300, y: 150, z: 120} as V3, target: {x: 80, y: 10, z: -40} as V3},
};
