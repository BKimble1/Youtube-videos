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

/** C4b (46.70–50.00): R4: from her front-left on the slope above her (not her left side: from there her raised left arm and
 * the drone crossed her face): she stops, holds the drone out to her left and up on her palm, the rotors spin up and it rises
 * out of her hand beside her head (the lens tilts after it); the flare carrier and the decoy maker climb past behind her,
 * clear of her head on this lens; then the lens drifts back out west and up with the three up the slope. */
export const CAM_C4B: CamKey[] = [
  {t: 0, pos: gp(-3.94, 3.07, 1.9), target: {x: -5.1, y: 2.93, z: 5.4}, fov: 48},
  {t: D(CUT.c4b, 47.55), pos: gp(-3.94, 3.07, 1.9), target: {x: -5.0, y: 3.05, z: 5.35}, fov: 47},
  {t: D(CUT.c4b, 48.3), pos: gp(-4.35, 2.3, 2.2), target: {x: -4.6, y: 3.3, z: 5.5}, fov: 46},
  // (the lens backs away up the slope ahead of the three as they climb toward it; searched for the largest clear gap between
  // their silhouettes: R3's lens had the decoy maker's body on the pilot's head at 49.1 - 50.0)
  {t: D(CUT.c4b, 49.1), pos: gp(-4.7, 0.8, 2.8), target: {x: -3.2, y: 3.7, z: 5.6}, fov: 46},
  {t: D(CUT.c4b, CUT.c5a), pos: gp(-4.7, 0.8, 2.8), target: {x: -2.2, y: 4.3, z: 4.9}, fov: 46},
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

/** C6a (53.04–54.45): ASSEMBLE — low in front of them on the east slope (the enemy side), tighter than R2's lineup and
 * pushing in: the shared turn, he is first; the launcher comes up, the halligan spins. */
export const CAM_C6A: CamKey[] = [
  {t: 0, pos: gp(8.6, 3.0, 2.45), target: {x: 0.75, y: 4.95, z: 1.55}, fov: 40},
  {t: D(CUT.c6, CUT.c6b), pos: gp(7.7, 2.75, 2.5), target: {x: 0.8, y: 4.95, z: 1.6}, fov: 37},
];

/** C6b (54.45–56.05): the tools readied — a lateral track along the south end of the line, close, from in front (east),
 * moving north: the tablet wakes, the satchel, the breaker's valve (the gauge needle swings up, the tank hisses), the
 * pilot sends the drone out ahead; he looks along the line at them. */
export const CAM_C6B: CamKey[] = [
  {t: 0, pos: {x: 4.15, y: 5.05, z: 6.05}, target: {x: 0.55, y: 5.0, z: 5.1}, fov: 34},
  {t: D(CUT.c6b, 55.2), pos: {x: 4.1, y: 5.0, z: 4.75}, target: {x: 0.6, y: 4.95, z: 3.75}, fov: 34},
  {t: D(CUT.c6b, CUT.c6c), pos: {x: 4.1, y: 4.95, z: 3.1}, target: {x: 0.75, y: 4.85, z: 2.05}, fov: 34},
];

/** C6c (56.05–57.00): over his left (plate) shoulder, long lens east across the avenue and the crater: the army at its
 * halt beyond the smoke; he turns back to it from the look along the line. */
export const CAM_C6C: CamKey[] = [
  {t: 0, pos: {x: -2.1, y: 5.3, z: 1.0}, target: {x: 81.5, y: 1.4, z: -0.4}, fov: 11.5},
  {t: D(CUT.c6c, CUT.c6c2), pos: {x: -2.05, y: 5.3, z: 1.01}, target: {x: 81.5, y: 1.4, z: -0.5}, fov: 10.4},
];

/** C6c2 (57.00–58.05): the threat — low and long from the avenue's south kerb, across the front of the halted army
 * (east reads screen right): the front rank's south end leans into its run toward the ridge (screen left, 57.15–57.45),
 * the eyes lock amber, dust off the first strides — the ranks behind them stay. */
export const CAM_C6C2: CamKey[] = [
  {t: 0, pos: {x: 74.8, y: 2.3, z: 16.8}, target: {x: 81.0, y: 1.6, z: 5.6}, fov: 21},
  {t: D(CUT.c6c2, CUT.c6d), pos: {x: 74.4, y: 2.25, z: 16.6}, target: {x: 80.0, y: 1.6, z: 5.6}, fov: 19},
];

/** C6d (58.05–59.95): the commit — in front of him from the east-south-east, a little below the brink, medium lens
 * (east reads screen right; the run starts toward the lens and to the left, as in D1-1): he comes out to the brink in
 * his second stride, the pilot steps down off the slab beside him, the breaker down off the crest, the runner and the
 * tether up into the line behind his left shoulder; they sink into the start on the accent, the first stride lifts —
 * D1-1 cuts in on it (wide, from the ridge's south-east foot). */
export const CAM_C6D: CamKey[] = [
  {t: 0, pos: {x: 6.7, y: 3.55, z: 3.05}, target: {x: 1.05, y: 4.55, z: 1.15}, fov: 30},
  {t: D(CUT.c6d, CUT.end), pos: {x: 6.25, y: 3.45, z: 2.9}, target: {x: 1.1, y: 4.4, z: 1.2}, fov: 29},
];
