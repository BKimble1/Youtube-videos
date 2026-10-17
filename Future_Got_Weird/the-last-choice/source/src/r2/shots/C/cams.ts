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

/** C2 (38.46–40.16): his POV, west, into the smoke over the broken ruin: a long lens finds her and closes in as she
 * climbs out of it (the breaker's shape behind her on the left). */
export const CAM_C2: CamKey[] = [
  {t: 0, pos: {x: 1.15, y: 4.98, z: 1.3}, target: {x: -16.0, y: 1.8, z: -2.05}, fov: 18},
  {t: 0.5, pos: {x: 1.14, y: 4.98, z: 1.3}, target: {x: -15.2, y: 1.75, z: -2.15}, fov: 16.5},
  {t: D(CUT.c2, CUT.c3), pos: {x: 1.12, y: 4.98, z: 1.3}, target: {x: -12.7, y: 1.9, z: -2.5}, fov: 12.5},
];

/** C3 (40.16–45.30): wider, high over his left shoulder looking west down the slope: the runner's vault on the left,
 * the breaker climbing on the right, the tether operator beyond; a slow drift. */
export const CAM_C3: CamKey[] = [
  {t: 0, pos: {x: 2.75, y: 6.45, z: 2.8}, target: {x: -6.8, y: 1.2, z: 2.4}, fov: 30},
  // the lens finds the runner and tightens on the wall for the vault …
  {t: 0.9, pos: {x: 2.74, y: 6.44, z: 2.8}, target: {x: -5.7, y: 1.95, z: 2.15}, fov: 24},
  {t: 1.75, pos: {x: 2.72, y: 6.43, z: 2.78}, target: {x: -5.0, y: 2.15, z: 2.2}, fov: 23},
  // … then widens and swings right over his shoulder to the breaker climbing on the north side
  {t: 2.45, pos: {x: 2.7, y: 6.43, z: 2.72}, target: {x: -4.7, y: 2.25, z: 1.2}, fov: 30},
  {t: 3.45, pos: {x: 2.65, y: 6.45, z: 2.62}, target: {x: -4.4, y: 2.4, z: -0.2}, fov: 37},
  {t: D(CUT.c3, CUT.c4), pos: {x: 2.6, y: 6.48, z: 2.5}, target: {x: -3.9, y: 2.55, z: -0.85}, fov: 39},
];

/** C4a (45.30–46.70): low on the slope above them, looking down at the three climbing out of the street toward us:
 * the drone pilot nearest (right, the drone in her hand), the flare carrier with his satchel, the decoy maker (left). */
export const CAM_C4A: CamKey[] = [
  {t: 0, pos: gp(-2.9, 3.3, 0.95), target: {x: -6.4, y: 1.75, z: 7.6}, fov: 35},
  {t: D(CUT.c4, CUT.c4b), pos: gp(-2.95, 3.3, 0.92), target: {x: -5.7, y: 2.2, z: 6.6}, fov: 35},
];

/** C4b (46.70–50.00): low from her front-left, on the north side of their line: she stops, holds the drone up on her palm,
 * the rotors spin up and it rises out of her hand (the lens tilts after it until it climbs out of frame); the flare
 * carrier and the decoy maker climb past behind her; the lens rises a little and pans with the three up the slope. */
export const CAM_C4B: CamKey[] = [
  {t: 0, pos: gp(-5.35, 1.85, 1.45), target: {x: -4.9, y: 2.3, z: 5.55}, fov: 40},
  {t: D(CUT.c4b, 47.55), pos: gp(-5.35, 1.85, 1.45), target: {x: -4.85, y: 2.6, z: 5.45}, fov: 40},
  {t: D(CUT.c4b, 48.3), pos: gp(-5.38, 1.82, 1.55), target: {x: -4.7, y: 3.0, z: 5.25}, fov: 42},
  {t: D(CUT.c4b, 49.1), pos: gp(-5.45, 1.75, 1.75), target: {x: -3.9, y: 3.25, z: 4.6}, fov: 44},
  {t: D(CUT.c4b, CUT.c5a), pos: gp(-5.55, 1.7, 1.9), target: {x: -2.9, y: 3.65, z: 4.0}, fov: 45},
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

/** C5c (52.10–53.07): close on his plate forearm and face from his front-left: the strap check (the runner, up on
 * the summit behind him, stays hidden behind his head). */
export const CAM_C5C: CamKey[] = [
  {t: 0, pos: {x: 1.38, y: 4.47, z: 2.42}, target: {x: 1.15, y: 4.4, z: 1.4}, fov: 37},
  {t: D(CUT.c5c, CUT.c6), pos: {x: 1.39, y: 4.48, z: 2.36}, target: {x: 1.16, y: 4.45, z: 1.4}, fov: 35.5},
];

/** C6 (53.04–59.95): the group frame — low on the east slope in front of them, looking up at all seven on the crest
 * against the smoke and the dusk sky; a slow push in through the hold and the build. */
export const CAM_C6: CamKey[] = [
  {t: 0, pos: gp(10.4, 6.3, 1.05), target: {x: 0.8, y: 4.75, z: 1.9}, fov: 41},
  {t: 3.9, pos: gp(10.0, 6.05, 1.02), target: {x: 0.85, y: 4.7, z: 1.85}, fov: 40},
  {t: D(CUT.c6, CUT.end), pos: gp(9.35, 5.65, 0.98), target: {x: 1.0, y: 4.62, z: 1.8}, fov: 38.5},
];
