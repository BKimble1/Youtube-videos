// Section B cameras (pure data: physical positions and targets in the plan's metres; shot-local seconds). The shots
// read them through camPath(); the probe in the QA notes reads the same keys to check framing without rendering.
import {V3, add3} from '../../../kit/math';
import {M} from '../../timing';
import type {CamKey} from '../../film/stage';
import {HAND_OUT, R0, R1, STAND} from './director';
export {STAND};
import {groundH} from '../../world/ground';

const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
const h = HAND_OUT;

export const SHOT_T = {
  B1: [M.SOLO, 12.4], B2: [12.4, M.ORCH], B3: [M.ORCH, 23.54], B4: [23.54, 27.0], B5: [27.0, M.H4], B6: [M.H4, M.BASS_OUT],
} as const;

/** B1: ground level on the mound south-south-east of where the hand lands, the lens a hand's height above the stones,
 * looking north-west into the dark gap under the slab's broken south edge: the hand squeezes out of it and braces on
 * the rubble; his head lies under the slab, out of frame to the right. A slow creep in. */
export const CAM_B1: CamKey[] = [
  {t: 0, pos: {x: h.x + 0.34, y: h.y + 0.42, z: h.z + 0.5}, target: add3(h, {x: -0.08, y: 0.0, z: -0.18}), fov: 36},
  {t: SHOT_T.B1[1] - SHOT_T.B1[0], pos: {x: h.x + 0.3, y: h.y + 0.38, z: h.z + 0.45}, target: add3(h, {x: -0.08, y: 0.0, z: -0.18}), fov: 35},
];

/** B2: low on the rubble south-east of him, below his level, looking north-west and up as he rises. */
export const CAM_B2: CamKey[] = [
  {t: 0, pos: gp(R0.x + 2.7, R0.z + 3.5, 0.62), target: {x: R0.x + 0.85, y: R0.y + 0.32, z: R0.z + 0.05}, fov: 40},
  {t: 1.6, pos: gp(R1.x + 1.95, R1.z + 3.45, 0.58), target: {x: R1.x + 0.15, y: R1.y + 0.45, z: R1.z}, fov: 40},
  {t: 3.4, pos: gp(R1.x + 1.9, R1.z + 3.5, 0.6), target: {x: R1.x + 0.05, y: R1.y + 0.95, z: R1.z}, fov: 40},
  {t: SHOT_T.B2[1] - SHOT_T.B2[0], pos: gp(R1.x + 1.95, R1.z + 3.55, 0.66), target: {x: R1.x + 0.0, y: R1.y + 1.25, z: R1.z}, fov: 39},
];

/** B3: behind his left shoulder at 1.5 m; it rises and swings over to his right shoulder as he steps down to the
 * brink, and backs off while the lens lengthens (a slow dolly-zoom), so the army grows behind him into a wall of
 * machines: his head and shoulders stay a dark shape in the lower left. */
const HEAD3 = {x: R1.x, y: R1.y + 1.58, z: R1.z};
const HEADS = {x: STAND.x, y: STAND.y + 1.5, z: STAND.z};
const ARMY_AIM = {x: 84, y: 2.0, z: -2.5};
export const CAM_B3: CamKey[] = [
  {t: 0, pos: {x: HEAD3.x - 1.25, y: HEAD3.y + 0.12, z: HEAD3.z - 0.8}, target: {x: HEAD3.x + 30, y: HEAD3.y - 2.6, z: HEAD3.z + 6.5}, fov: 42},
  {t: 1.05, pos: {x: HEADS.x - 2.0, y: HEADS.y + 0.55, z: HEADS.z + 0.35}, target: {x: 70, y: -4.5, z: -1.5}, fov: 32},
  {t: 2.1, pos: {x: HEADS.x - 3.6, y: HEADS.y + 0.5, z: HEADS.z + 0.62}, target: ARMY_AIM, fov: 20},
  {t: SHOT_T.B3[1] - SHOT_T.B3[0], pos: {x: HEADS.x - 8.0, y: HEADS.y + 0.42, z: HEADS.z + 1.05}, target: ARMY_AIM, fov: 10},
];

/** B4: from inside the army, riding level with the foreground heavy (HEAVIES_B[0]) ~17 m behind its head and 14 m to its
 * north at 5.6 m: the heavy fills the left of frame in three-quarter rear view, its sensor head at the hull's front
 * corner swings round to him on H3; he is a tiny figure on the crest, right of centre, past the ranks. */
export const CAM_B4: CamKey[] = [
  {t: 0, pos: {x: 133.2, y: 5.6, z: -15.0}, target: {x: 41.6, y: 1.2, z: 25.0}, fov: 30},
  {t: SHOT_T.B4[1] - SHOT_T.B4[0], pos: {x: 127.4, y: 5.55, z: -14.9}, target: {x: 35.8, y: 1.2, z: 25.1}, fov: 29},
];
/** B5: from the avenue south-east of the van (its open door, the radio on the floor), pushing in and up the slope to
 * a medium close of him from below, east-south-east. */
const CHEST5: V3 = {x: STAND.x, y: STAND.y + 1.3, z: STAND.z};
export const CAM_B5: CamKey[] = [
  {t: 0, pos: {x: 9.8, y: 1.3, z: 6.5}, target: {x: 4.9, y: 2.25, z: 2.2}, fov: 50},
  {t: 1.25, pos: {x: 7.4, y: 2.75, z: 4.9}, target: {x: CHEST5.x + 0.5, y: CHEST5.y - 0.1, z: CHEST5.z + 0.3}, fov: 30},
  {t: SHOT_T.B5[1] - SHOT_T.B5[0], pos: {x: 6.1, y: 3.55, z: 4.0}, target: {x: CHEST5.x + 0.05, y: CHEST5.y + 0.12, z: CHEST5.z + 0.05}, fov: 24},
];
export const B5_ANCHOR: V3 = {x: CHEST5.x, y: CHEST5.y + 0.3, z: CHEST5.z};

/** B6: the lonely wide — high and far back over the ridge's west slope behind him (from lower, the crest and the slab
 * hide him and the army is a sliver on the horizon): he is small on the brink, lower left; the smoking crater and the
 * whole army filling the avenue beyond, upper right. Hold, drifting in a little. */
export const CAM_B6: CamKey[] = [
  {t: 0, pos: {x: -21.5, y: 12.5, z: 16.0}, target: {x: 54.1, y: -6.0, z: -10.0}, fov: 26},
  {t: SHOT_T.B6[1] - SHOT_T.B6[0], pos: {x: -20.6, y: 12.3, z: 15.5}, target: {x: 54.1, y: -6.0, z: -10.0}, fov: 25},
];
