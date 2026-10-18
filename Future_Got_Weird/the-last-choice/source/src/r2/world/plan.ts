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
  failingTower: {base: {x: 640, y: 0, z: -208} as V3, height: 265, width: 40},
  /** Skyline mass (generic Midtown-like towers; no real logos). */
  skyline: {x0: 600, x1: 2600, z0: -900, z1: 900},
};

/**
 * Opening aerial: high over the west end of the district, drifting east along the avenue and looking east toward the
 * skyline, so the failing tower (north-east) and the formations streaming west along the avenue are in frame; near
 * rooftops along the avenue's south side pass below the lens.
 */
export const AERIAL = {
  from: {pos: {x: -30, y: 132, z: 16} as V3, target: {x: 900, y: 18, z: -48} as V3},
  to: {pos: {x: 118, y: 116, z: 9} as V3, target: {x: 960, y: 26, z: -78} as V3},
};

// ------------------------------------------------------------------ street obstacles and lane steering (R3)
/**
 * Solid things standing in the streets that machines must walk round (abandoned vehicles, the old rail columns, the
 * bus): the set builds them from this list, and formations steer their lanes round them with `steerAround`.
 * heading = the long axis (engine convention, 0 = north); len/wid = footprint (m); h = height (m).
 */
export type Obstacle = {
  id: string; x: number; z: number; heading: number; len: number; wid: number; h: number;
  kind: 'car' | 'taxi' | 'bus' | 'truck' | 'column' | 'post' | 'debris';
  /** vehicles: body material, how crushed (0..1), burnt out, upside down (roll 172°), doors open */
  mat?: string; crushed?: number; burnt?: boolean; flipped?: boolean; doorOpen?: boolean;
};
const car = (id: string, x: number, z: number, heading: number, mat: string, o: Partial<Obstacle> = {}): Obstacle =>
  ({id, x, z, heading, len: 4.6, wid: 1.8, h: 1.55, kind: mat === 'taxi' ? 'taxi' : 'car', mat, ...o});
const truck = (id: string, x: number, z: number, heading: number, o: Partial<Obstacle> = {}): Obstacle =>
  ({id, x, z, heading, len: 7.6, wid: 2.5, h: 3.4, kind: 'truck', ...o});
export const STREET_OBSTACLES: Obstacle[] = [
  // ---- the R2 wrecks (keys wreck_0..9 in the set; ATMOS anchors fires to wreck_0/2/5/6/7 at these exact places)
  car('wreck_0', 24, -9, 140, 'carGrey', {burnt: true, flipped: true}),
  // (R3) moved to the south kerb lane: D1's breaker ran through it at (31, 6) in the charge
  car('wreck_1', 30.5, 11.6, 74, 'carRed', {crushed: 0.2}),
  car('wreck_2', 96, -6, 200, 'carGrey', {crushed: 0.1, burnt: true}),
  car('wreck_3', 118, 10, 10, 'carRed', {burnt: true}),
  // (B's army is routed round these; the EF streams must steer round them too: steerAround)
  car('wreck_4', 150, -3, 95, 'carGrey', {flipped: true}),
  car('wreck_5', 178, 8, 250, 'taxi', {crushed: 0.3, burnt: true}),
  car('wreck_6', 215, -10, 80, 'carGrey', {crushed: 0.5, burnt: true}),
  car('wreck_7', 290, 5, 120, 'carRed', {burnt: true}),
  car('wreck_8', 340, -8, 45, 'carGrey', {crushed: 0.2, burnt: true, flipped: true}),
  car('wreck_9', 380, 3, 170, 'taxi', {doorOpen: true}),
  // ---- the old elevated line's columns and the bus (PLAN landmarks)
  {id: 'gcol_0', x: PLAN.girder.to.x, z: PLAN.girder.to.z, heading: 0, len: 1.2, wid: 1.2, h: 8, kind: 'column'},
  {id: 'gcol_1', x: 105, z: -11, heading: 0, len: 1.2, wid: 1.2, h: 9.5, kind: 'column'},
  {id: 'gcol_2', x: 141, z: -11, heading: 0, len: 1.2, wid: 1.2, h: 7.2, kind: 'column'},
  {id: 'bus', x: PLAN.bus.pos.x, z: PLAN.bus.pos.z, heading: PLAN.bus.heading, len: 12.2, wid: 2.6, h: 3.1, kind: 'bus'},
  // ---- (R3) abandoned vehicles down the avenue, beyond the fighting: at the kerbs (|z| > 11, clear of B's army and
  //      the EF streams) and, past x 460, on the centre line; some with doors open, some burnt, two box trucks
  truck('veh_truck1', 232, 12.3, 95),
  car('veh_a', 196, -12.2, 262, 'carRed', {doorOpen: true}),
  car('veh_b', 243, -12.5, 268, 'carGrey', {burnt: true}),
  car('veh_c', 306, 12.4, 84, 'taxi', {doorOpen: true}),
  car('veh_d', 362, -12.3, 276, 'carGrey', {crushed: 0.15}),
  truck('veh_truck3', 405, -12.3, 272),
  car('veh_e', 470, -12.1, 274, 'carRed'),
  car('veh_f', 486, 0.3, 81, 'carGrey', {burnt: true, flipped: true}),
  truck('veh_truck2', 548, 12.3, 88, {burnt: true}),
  car('veh_g', 612, -12.2, 268, 'taxi'),
  car('veh_h', 700, 0.2, 95, 'carGrey', {burnt: true}),
  // ---- the cross streets: parked and abandoned along the kerbs (the columns walk down the middle)
  car('veh_x1a', 130.7, -38, 6, 'carRed', {doorOpen: true}),
  car('veh_x1b', 117.3, -62, 182, 'carGrey', {burnt: true}),
  car('veh_x1c', 130.6, 44, 176, 'taxi'),
  truck('veh_x1d', 117.5, 72, 2),
  car('veh_x2a', 268.4, 36, 2, 'carGrey'),
  car('veh_x2b', 255.6, 58, 176, 'carRed', {burnt: true}),
  car('veh_x2c', 268.5, -40, 182, 'taxi', {doorOpen: true}),
  truck('veh_x2d', 255.4, -68, 178, {burnt: true}),
  car('veh_x3a', 427.2, -34, 3, 'carGrey', {crushed: 0.3}),
  car('veh_x3b', 413, -58, 181, 'carRed', {burnt: true, flipped: true}),
  car('veh_x3c', 427, 40, 0, 'taxi'),
];

/** Axis-aligned bounds of an obstacle's footprint (+pad). */
export const obstacleBox = (o: Obstacle, pad = 0) => {
  const h = (o.heading * Math.PI) / 180;
  const fx = Math.abs(Math.sin(h)), fz = Math.abs(Math.cos(h));
  const hx = (o.len / 2) * fx + (o.wid / 2) * fz + pad, hz = (o.len / 2) * fz + (o.wid / 2) * fx + pad;
  return {x0: o.x - hx, x1: o.x + hx, z0: o.z - hz, z1: o.z + hz};
};

/**
 * Lane steering: a walker moving along `axis` ('x' = east/west, 'z' = north/south) at (x, z) is displaced sideways
 * round every obstacle it would meet. Each obstacle squeezes the lanes within `squeeze` m of it aside (monotone: lanes
 * keep their order and never cross), blended in over `ramp` m before and after it. Returns the steered lateral
 * coordinate (z for axis 'x', x for axis 'z').
 */
export const steerAround = (x: number, z: number, pad = 1.0, axis: 'x' | 'z' = 'x', squeeze = 8, ramp = 9): number => {
  let lat = axis === 'x' ? z : x;
  const along = axis === 'x' ? x : z;
  for (const o of STREET_OBSTACLES) {
    const b = obstacleBox(o, pad);
    const a0 = axis === 'x' ? b.x0 : b.z0, a1 = axis === 'x' ? b.x1 : b.z1;
    const l0 = axis === 'x' ? b.z0 : b.x0, l1 = axis === 'x' ? b.z1 : b.x1;
    if (along < a0 - ramp || along > a1 + ramp) continue;
    if (lat < l0 - squeeze || lat > l1 + squeeze) continue;
    const s = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
    const w = along < a0 ? s((along - (a0 - ramp)) / ramp) : along > a1 ? s(((a1 + ramp) - along) / ramp) : 1;
    const c = (l0 + l1) / 2;
    const mapped = lat < c ? (l0 - squeeze) + ((lat - (l0 - squeeze)) / (c - (l0 - squeeze))) * squeeze : l1 + ((lat - c) / ((l1 + squeeze) - c)) * squeeze;
    lat = lat + (mapped - lat) * w;
  }
  return lat;
};

// ------------------------------------------------------------------ fire anchors for ATMOS (R3)
/**
 * Places where a fire has a cause, built into the set so ATMOS can attach flames, smoke and light to them:
 *   room     a burning room behind a blown-out facade: city.ts CUTS the opening (bays × storeys at pos.y, pulled under a
 *            broken crown) in the building whose front faces pos; `openingFor(pos)` (world/city.ts) returns the exact
 *            rectangle, outward normal and depth of what was cut
 *   opening  a floor exposed by a collapsed corner / a broken top (the floor slab edge at pos, facing n)
 *   vehicle  an abandoned vehicle (pos = its centre on the ground; `anchor` = its set key, heading/len from
 *            STREET_OBSTACLES)
 *   debris   a pile of burning debris on the ground (pos.y = 0: resolve with groundH)
 * `from` = film second the fire starts (A1's damage events; the fires spreading through the city in F1).
 */
export type FireSite = {
  id: string;
  kind: 'room' | 'vehicle' | 'debris' | 'opening';
  pos: V3;
  /** outward normal (rooms / openings) */
  n?: V3;
  /** suggested flame height (m) */
  size: number;
  /** room: opening size to cut (bays wide, storeys tall) */
  bays?: number; storeys?: number;
  from?: number;
  /** the set piece / building this burns in */
  anchor?: string;
  note: string;
};
const N_: V3 = {x: 0, y: 0, z: -1}, S_: V3 = {x: 0, y: 0, z: 1}, E_: V3 = {x: 1, y: 0, z: 0}, W_: V3 = {x: -1, y: 0, z: 0};
export const FIRE_SITES: FireSite[] = [
  // ---- A1 (0–6.6 s): three damage events in the aerial (A1_EVENTS below; shots/A/Aerial.tsx and cues.ts)
  {id: 'a1_peel', kind: 'debris', pos: {x: 240.5, y: 0, z: -31}, size: 5, from: 5.0, anchor: 'FN10', note: 'A1 E1: the section of FN10\'s west wall that tears loose at 1.3 s lands west of it, at the edge of the rubble lot FN9 (~4.9–5.6 s, below the frame); its broken floors burn in the heap from then on'},
  {id: 'a1_blowout', kind: 'room', pos: {x: 284, y: 64, z: -19}, n: S_, size: 7, bays: 3, storeys: 2, from: 2.9, anchor: 'FN11', note: 'A1 E2: high on the tall stepped tower left of the avenue, a fireball blows two floors of windows out over the avenue; the room keeps burning'},
  {id: 'a1_truck', kind: 'vehicle', pos: {x: 405, y: 0, z: -12.3}, size: 4, from: 5.6, anchor: 'veh_truck3', note: 'A1 E3: the box truck at the north kerb, among the streaming columns, catches (fuel tank): a flash, then flames along its body'},
  {id: 'veh_truck1', kind: 'vehicle', pos: {x: 232, y: 0, z: 12.3}, size: 3, from: 30, anchor: 'veh_truck1', note: 'the box truck at the south kerb: burning by the time the army halts'},
  // ---- the battlefield's nearby blocks (the crew's surroundings in the final pullback)
  {id: 'w1_floor', kind: 'opening', pos: {x: 1.5, y: 13.6, z: -49}, n: W_, size: 3, anchor: 'W1', note: 'exposed floors of the flank block north of the ridge (collapsed west corner): a floor burning at the cut'},
  {id: 'w3_floor', kind: 'opening', pos: {x: 3, y: 20.4, z: 49}, n: E_, size: 3, anchor: 'W3', note: 'the flank block south of the ridge: exposed floors at its broken east corner'},
  {id: 'w2_room', kind: 'room', pos: {x: -30, y: 14, z: 40}, n: N_, size: 3.5, bays: 2, storeys: 1, from: 206.5, anchor: 'W2', note: 'F1: catches as the camera rises (fire spreading in the nearby blocks)'},
  {id: 'fn6_floor', kind: 'opening', pos: {x: 167, y: 37.4, z: -30}, n: E_, size: 4, anchor: 'FN6', note: 'the collapsed corner of FN6 (first cross street): burning floors at the cut'},
  // ---- the avenue frontage beyond the battle (A1, B3/B4 backgrounds, the pullback's top of frame)
  {id: 'fs5_room', kind: 'room', pos: {x: 196, y: 17, z: 19}, n: N_, size: 4, from: 209, anchor: 'FS5', note: 'F1: catches during the rise'},
  {id: 'fs10_room', kind: 'room', pos: {x: 352, y: 44, z: 19}, n: N_, size: 6, bays: 3, storeys: 2, anchor: 'FS10', note: 'two floors burning behind blown windows (south side, mid-distance)'},
  {id: 'fs9_floor', kind: 'opening', pos: {x: 327, y: 44.2, z: 30}, n: E_, size: 5, anchor: 'FS9', note: 'FS9 broken corner: floors burning at the cut'},
  {id: 'fn14_room', kind: 'room', pos: {x: 356, y: 20, z: -19}, n: S_, size: 5, from: 213, anchor: 'FN14', note: 'F1: catches during the rise'},
  {id: 'fs16_room', kind: 'room', pos: {x: 515, y: 27, z: 19}, n: N_, size: 6, anchor: 'FS16', note: 'mid-distance burning floor'},
  {id: 'fn17_room', kind: 'room', pos: {x: 482, y: 45, z: -19}, n: S_, size: 6, from: 217, anchor: 'FN17', note: 'F1: catches late in the rise (the spread reaches the skyline side)'},
  {id: 'fn25_room', kind: 'room', pos: {x: 690, y: 61, z: -19}, n: S_, size: 8, anchor: 'FN25', note: 'glass tower: blown floors burning'},
  {id: 'fs20_floor', kind: 'opening', pos: {x: 643, y: 57.8, z: 30}, n: W_, size: 7, anchor: 'FS20', note: 'FS20 broken corner'},
  {id: 'tower_top', kind: 'opening', pos: {x: 640, y: 77, z: -208}, n: {x: 0, y: 1, z: 0}, size: 14, from: 6.8, anchor: 'towerStump', note: 'the failing tower\'s stump after the collapse: its broken top burns'},
  // ---- vehicles and debris
  {id: 'veh_b', kind: 'vehicle', pos: {x: 243, y: 0, z: -12.5}, size: 1.8, from: 8, anchor: 'veh_b', note: 'car at the north kerb by FN10: catches after the opening (its smoke would cross E1\'s wall in A1)'},
  {id: 'veh_truck2', kind: 'vehicle', pos: {x: 548, y: 0, z: 12.3}, size: 3, anchor: 'veh_truck2', note: 'box truck burning at the kerb'},
  {id: 'veh_x1b', kind: 'vehicle', pos: {x: 117.3, y: 0, z: -62}, size: 2, anchor: 'veh_x1b', note: 'first cross street, north: a burning car at the kerb'},
  {id: 'veh_x2d', kind: 'vehicle', pos: {x: 255.4, y: 0, z: -68}, size: 3, from: 211, anchor: 'veh_x2d', note: 'F1: a truck in the second cross street catches'},
  {id: 'pile_x1', kind: 'debris', pos: {x: 118.2, y: 0, z: 25}, size: 2.2, anchor: 'pile_x1', note: 'the debris heap the machines pushed against the west kerb of the first cross street, south of the avenue'},
  {id: 'pile_x2', kind: 'debris', pos: {x: 248.5, y: 0, z: -16.4}, size: 2.5, from: 8.5, anchor: 'pile_x2', note: 'heap on the north sidewalk at the second cross street (west corner); catches after the opening'},
];

/**
 * Intersections the machines hold (for EF / D sections to station units): centre, and a radius kept clear of the set's
 * dressing (heaps and vehicles stand outside it).
 */
export const HOLD_POINTS: {id: string; x: number; z: number; r: number; note: string}[] = [
  {id: 'x1', x: 124, z: 0, r: 9, note: 'the first cross street: the streams turn north and south here'},
  {id: 'x2', x: 262, z: 0, r: 9, note: 'the second cross street'},
  {id: 'x3', x: 420, z: 0, r: 10, note: 'the third cross street'},
];

/**
 * A1's damage events (film seconds; the set keeps their results for the rest of the film):
 *   peel     a 6-storey section of FN10's WEST wall (seen face-on from the aerial, left of the avenue; u along that
 *            wall, y up) tears loose at the top (t0), leans out, breaks off (tb) and falls in three pieces into the gap
 *            and the rubble lot FN9 west of it (no street, no route); the hole shows the floors behind it from then
 *            on, the heap stays
 *   blowout  a fireball blows two floors of FN11's windows (y 61–68) out over the avenue (t0); the room burns from then on
 *            (FIRE_SITES a1_blowout; until t0 the set covers the opening with intact glazing)
 *   truck    the box truck at the north kerb (x 405) catches among the streaming columns (t0) (FIRE_SITES a1_truck)
 */
export const A1_EVENTS = {
  peel: {bld: 'FN10', side: 'W' as 'N' | 'S' | 'E' | 'W', u0: 6.0, u1: 18.0, y0: 51.0, y1: 71.4, t0: 1.3, tb: 1.8},
  blowout: {site: 'a1_blowout', bld: 'FN11', t0: 2.9},
  truck: {site: 'a1_truck', obstacle: 'veh_truck3', t0: 5.6},
};
