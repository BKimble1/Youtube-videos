// A1 (0.00–6.60): New York falls. A dusk aerial high over the west end of the district, drifting east and down along
// the avenue toward the skyline. Near roofs slide under the lens while the skyline barely moves; fires burn on several
// blocks (each with a source), smoke leans north-east, machine formations stream west along the avenue and out of the
// cross streets as moving eye-lights and silhouettes, drones drift above them. On LOW_HIT the failing tower (east-north-
// east) starts to go: the top section tilts and drops into its own dust, and keeps falling until the cut to black.
import React from 'react';
import {Stage, useShotTime, camPath, fadeIn} from '../../film/stage';
import {AERIAL, groundH} from '../../world';
import {armyItems, column, combine, straightPath, polyPathFn, drone, heavy} from '../../mech';
import type {Item} from '../../engine';
import {M} from '../../timing';

const ground = (x: number, z: number) => groundH(x, z);
const DUR = M.TITLE_IN;

// Formations streaming west toward the district (film-time speeds; all already moving when the shot opens).
// blocks of 6 lanes along the avenue, heads spaced so they read as separate formations
const AVE = [190, 330, 470, 610, 760, 920].map((x, k) => column(straightPath({x: x + 8, y: 0, z: k % 2 ? 1.5 : -1.5}, 270), 6 * 18, 6, 3.4, 2.8, 1.4, 0, 71 + k * 7, undefined, 4000 + k * 200));
const cross1 = column(polyPathFn([{x: 124, y: 0, z: -200}, {x: 124, y: 0, z: -16}, {x: 104, y: 0, z: -8}]), 3 * 40, 3, 2.6, 2.7, 1.4, -45, 73);
const cross2 = column(polyPathFn([{x: 262, y: 0, z: 220}, {x: 262, y: 0, z: 14}, {x: 240, y: 0, z: 6}]), 3 * 40, 3, 2.6, 2.7, 1.4, -45, 74);
const cross3 = column(polyPathFn([{x: 420, y: 0, z: -260}, {x: 420, y: 0, z: -12}, {x: 398, y: 0, z: -4}]), 3 * 46, 3, 2.6, 2.7, 1.4, -50, 75);
const ARMY = combine(...AVE, cross1, cross2, cross3);

const HEAVIES = [
  {x: 330, z: -7}, {x: 470, z: 8}, {x: 610, z: -5}, {x: 760, z: 6},
];
const DRONES = Array.from({length: 26}, (_, i) => ({
  x: 180 + (i % 13) * 48 + ((i * 37) % 17),
  y: 22 + (i % 4) * 7,
  z: -30 + Math.floor(i / 13) * 52 + ((i * 13) % 11),
  ph: i * 0.83,
}));

export const AerialA1: React.FC = () => {
  const {t, T} = useShotTime(0);
  const cam = camPath(
    [
      {t: 0, pos: AERIAL.from.pos, target: AERIAL.from.target, fov: 44},
      {t: DUR, pos: AERIAL.to.pos, target: AERIAL.to.target, fov: 42},
    ],
    t,
    0.35,
  );
  const items = (v: Parameters<typeof armyItems>[0]): Item[] => [
    ...armyItems(v, T, ARMY, {ground, maxFull: 0, maxMid: 12, farFrom: 60, eye: 'cyan'}),
    ...HEAVIES.flatMap((h, k) =>
      heavy({id: 700 + k, t: T, pos: {x: h.x, y: 0, z: h.z}, heading: 270, gait: {path: straightPath({x: h.x + 40, y: 0, z: h.z}, 270), dist: (T + 40) * 0.9}, ground, lod: 'far'}),
    ),
    ...DRONES.flatMap((d, i) =>
      drone({id: 760 + i, t: T, pos: {x: d.x - T * 6, y: d.y + Math.sin(T * 0.9 + d.ph) * 1.2, z: d.z + Math.sin(T * 0.5 + d.ph) * 2}, heading: 270, vel: {x: -6, y: 0, z: 0}, eye: 'cyan', lod: 'far', scale: 1.8}),
    ),
  ];
  return <Stage T={T} cam={cam} items={items} drift={0.25} black={fadeIn(t, 0.55)} vignette={0.6} />;
};
