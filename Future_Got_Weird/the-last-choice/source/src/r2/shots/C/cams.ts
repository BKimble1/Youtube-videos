// Section C cameras (pure data: physical positions and targets in the plan's metres; shot-local seconds).
import {V3} from '../../../kit/math';
import type {CamKey} from '../../film/stage';
import {groundH} from '../../world/ground';
import {CUT} from './beats';

const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
const D = (a: number, b: number) => b - a;

/** C1 (35.80–38.46): close profile from the south, a hair below his eyes; a slow creep in; the pan follows him as he
 * comes round and steps back up toward the crest (his face turns past the lens). */
export const CAM_C1: CamKey[] = [
  {t: 0, pos: {x: 2.95, y: 4.42, z: 3.45}, target: {x: 1.55, y: 4.52, z: 1.42}, fov: 31},
  {t: 1.35, pos: {x: 2.88, y: 4.44, z: 3.36}, target: {x: 1.5, y: 4.54, z: 1.42}, fov: 30},
  {t: D(CUT.c1, CUT.c2), pos: {x: 2.6, y: 4.5, z: 3.3}, target: {x: 1.24, y: 4.62, z: 1.36}, fov: 30},
];

/** C2 (38.46–40.16): his POV, west, into the smoke over the broken ruin: a long-ish lens finding her. */
export const CAM_C2: CamKey[] = [
  {t: 0, pos: {x: 1.15, y: 4.98, z: 1.3}, target: {x: -15.8, y: 1.6, z: -1.8}, fov: 27},
  {t: D(CUT.c2, CUT.c3), pos: {x: 1.12, y: 4.98, z: 1.3}, target: {x: -13.2, y: 1.5, z: -2.0}, fov: 25},
];

/** C3 (40.16–45.30): wider, high over his left shoulder looking west down the slope: the runner's vault on the left,
 * the breaker climbing on the right, the tether operator beyond; a slow drift. */
export const CAM_C3: CamKey[] = [
  {t: 0, pos: {x: 2.75, y: 5.75, z: 2.2}, target: {x: -5.8, y: 1.75, z: 0.75}, fov: 40},
  {t: 1.6, pos: {x: 2.7, y: 5.72, z: 2.15}, target: {x: -5.3, y: 2.0, z: 0.85}, fov: 39},
  {t: D(CUT.c3, CUT.c4), pos: {x: 2.6, y: 5.7, z: 2.0}, target: {x: -4.2, y: 2.4, z: 0.2}, fov: 40},
];

/** C4 (45.30–50.00): wide from the north side of the ridge, looking south along it: the tether operator gains the
 * summit close to the lens, the breaker climbs, the three come up the far slope; the drone lifts off and rises. */
export const CAM_C4: CamKey[] = [
  {t: 0, pos: {x: -2.6, y: 8.1, z: -11.4}, target: {x: -2.4, y: 2.9, z: 3.6}, fov: 42},
  {t: D(CUT.c4, CUT.c5a), pos: {x: -2.3, y: 8.0, z: -11.0}, target: {x: -1.8, y: 3.4, z: 3.6}, fov: 41},
];

/** C5a (50.00–51.20): close two-shot from the west in front of them: the breaker's hand lands on his shoulder; the look. */
export const CAM_C5A: CamKey[] = [
  {t: 0, pos: {x: -0.32, y: 4.68, z: 1.32}, target: {x: 1.22, y: 4.5, z: 1.0}, fov: 34},
  {t: D(CUT.c5a, CUT.c5b), pos: {x: -0.22, y: 4.67, z: 1.3}, target: {x: 1.22, y: 4.52, z: 1.0}, fov: 33},
];

/** C5b (51.20–52.10): close on her right hip from the west: the hand to the reel, the click; the drone rises past behind her. */
export const CAM_C5B: CamKey[] = [
  {t: 0, pos: {x: -0.92, y: 5.96, z: -3.45}, target: {x: 0.15, y: 6.08, z: -2.2}, fov: 42},
  {t: D(CUT.c5b, CUT.c5c), pos: {x: -0.88, y: 5.98, z: -3.4}, target: {x: 0.15, y: 6.16, z: -2.2}, fov: 41},
];

/** C5c (52.10–53.04): close on his plate forearm and face from his front-left: the strap check. */
export const CAM_C5C: CamKey[] = [
  {t: 0, pos: {x: 0.8, y: 4.5, z: 2.3}, target: {x: 1.13, y: 4.36, z: 1.42}, fov: 36},
  {t: D(CUT.c5c, CUT.c6), pos: {x: 0.84, y: 4.53, z: 2.24}, target: {x: 1.14, y: 4.44, z: 1.42}, fov: 35},
];

/** C6 (53.04–59.95): the group frame — low on the east slope in front of them, looking up at all seven on the crest
 * against the smoke and the dusk sky; a slow push in through the hold and the build. */
export const CAM_C6: CamKey[] = [
  {t: 0, pos: gp(10.4, 6.3, 1.05), target: {x: 0.8, y: 4.75, z: 1.9}, fov: 41},
  {t: 3.9, pos: gp(10.0, 6.05, 1.02), target: {x: 0.85, y: 4.7, z: 1.85}, fov: 40},
  {t: D(CUT.c6, CUT.end), pos: gp(9.35, 5.65, 0.98), target: {x: 1.0, y: 4.62, z: 1.8}, fov: 38.5},
];
