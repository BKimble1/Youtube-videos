// A1's machines (pure: specs and paths, no React components) — shared by Aerial.tsx and the spatial checker
// (tools/r3/city_check.mjs). Formations stream west along the avenue and down the cross streets; every lane is routed
// around the set's obstacles (wrecks, the old rail columns, the bus, abandoned vehicles) with world/plan's
// `steerAround`, so no unit walks through a car or a column.
import type {V3} from '../../../kit/math';
import {column, combine, polyPathFn} from '../../mech';
import type {Formation, Path} from '../../mech';
import {steerAround} from '../../world/plan';

/** A westbound lane at lateral line zl, bent sideways round the set's obstacles (heading follows the bend). */
const westLane = (x0: number, zl: number): Path => (d: number) => {
  const x = x0 - d;
  const z = steerAround(x, zl, 1.0);
  const z2 = steerAround(x - 1.5, zl, 1.0);
  return {pos: {x, y: 0, z}, heading: 270 - (Math.atan2(z2 - z, 1.5) * 180) / Math.PI};
};

/**
 * A column whose lanes each steer round obstacles: `column()` offsets lanes along the path's normal, so the obstacle
 * test has to see each lane's own line — one single-lane column per lane, merged.
 */
const aveColumn = (x0: number, z: number, count: number, lanes: number, laneGap: number, spacing: number, speed: number, seed: number, idBase: number): Formation =>
  combine(...Array.from({length: lanes}, (_, l) => column(westLane(x0, z + (l - (lanes - 1) / 2) * laneGap), Math.ceil(count / lanes), 1, laneGap, spacing, speed, 0, seed + l * 101, undefined, idBase + l * 37)));

/** Formations streaming west toward the district (film-time speeds; all already moving when the shot opens). */
export const A1_AVE = [190, 330, 470, 610, 760, 920].map((x, k) => aveColumn(x + 8, k % 2 ? 1.5 : -1.5, 6 * 18, 6, 3.4, 2.8, 1.4, 71 + k * 7, 4000 + k * 200));
export const A1_CROSS = [
  column(polyPathFn([{x: 124, y: 0, z: -200}, {x: 124, y: 0, z: -16}, {x: 104, y: 0, z: -8}] as V3[]), 3 * 40, 3, 2.6, 2.7, 1.4, -45, 73),
  column(polyPathFn([{x: 262, y: 0, z: 220}, {x: 262, y: 0, z: 14}, {x: 240, y: 0, z: 6}] as V3[]), 3 * 40, 3, 2.6, 2.7, 1.4, -45, 74),
  column(polyPathFn([{x: 420, y: 0, z: -260}, {x: 420, y: 0, z: -12}, {x: 398, y: 0, z: -4}] as V3[]), 3 * 46, 3, 2.6, 2.7, 1.4, -50, 75),
];
export const A1_ARMY: Formation = combine(...A1_AVE, ...A1_CROSS);

/** Heavies walking west in the avenue's middle (film time T; dist = (T + 40) · 0.9 along a westbound line). */
export const A1_HEAVIES = [{x: 330, z: -7}, {x: 470, z: 8}, {x: 610, z: -5}, {x: 760, z: 6}];
export const A1_DRONES = Array.from({length: 26}, (_, i) => ({
  x: 180 + (i % 13) * 48 + ((i * 37) % 17),
  y: 22 + (i % 4) * 7,
  z: -30 + Math.floor(i / 13) * 52 + ((i * 13) % 11),
  ph: i * 0.83,
}));
