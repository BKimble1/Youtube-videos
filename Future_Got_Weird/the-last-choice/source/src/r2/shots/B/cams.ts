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

/** B3: behind his right shoulder (south-west of him, so he holds the lower-left third and the army the right
 * two-thirds). It starts level with his head 4.5 m back; as he steps down to the brink it cranes up and back over the
 * crest to ~1 m over his head and 6 m back and holds there, drifting, through H1/H2 and the eye ripple — a high
 * over-shoulder on a long lens (V 14°) that holds the whole army, ~85–90 px a machine at full res. From that height
 * the slab he crawled out of and the van lie below the frame, not between the lens and him. (Aims solved so his head
 * sits at about (0.24, 0.77) of the frame at each key; the lens stays 14–17°, no dolly zoom.) */
const HEADS = {x: STAND.x, y: STAND.y + 1.24, z: STAND.z}; // his head on the brink (he stands crouched, braced)
export const CAM_B3: CamKey[] = [
  {t: 0, pos: {x: -3.32, y: 4.79, z: 2.67}, target: {x: 96.0, y: 6.7, z: -8.6}, fov: 17},
  {t: 1.7, pos: add3(HEADS, {x: -6.0, y: 0.9, z: 1.5}), target: {x: 94.5, y: -2.7, z: -9.7}, fov: 14},
  {t: SHOT_T.B3[1] - SHOT_T.B3[0], pos: add3(HEADS, {x: -6.5, y: 1.11, z: 1.62}), target: {x: 93.8, y: -4.4, z: -9.5}, fov: 14},
];

/** B4: from inside the army, riding level with the foreground heavy (HEAVIES_B[0]) ~17 m behind its head and 16 m to its
 * north at 4 m, just under its sensor head: the heavy fills the left of frame in three-quarter rear view, its head at
 * the hull's front corner swings round to him on H3; he is a tiny figure on the crest, right of centre, past the ranks.
 * The line to him passes ~1.5 m south of the old rail column at (105, −11) (just left of him in frame) and under the
 * fallen girder's truss (from higher, the truss hides him). */
export const CAM_B4: CamKey[] = [
  {t: 0, pos: {x: 133.2, y: 4.0, z: -17.0}, target: {x: 41.6, y: 0.6, z: 26.0}, fov: 30},
  {t: SHOT_T.B4[1] - SHOT_T.B4[0], pos: {x: 127.4, y: 3.95, z: -16.9}, target: {x: 35.8, y: 0.6, z: 26.1}, fov: 29},
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

/** B6: the lonely silhouette — the reverse: low among the vanguard's ranks east of the crater, the lens at chest height
 * in the lane the ranks leave around the old rail column (80, −5), looking west and a touch up: the back and legs of
 * the nearest machine large and dark on the left (it takes its last step and plants one beat after H4), more backs at
 * the frame edge, the column and the fallen girder on the right, the crater's rim and its smoke between, and ~85 m off
 * on the ridge crest, small, him — backlit by the low western sun against the smoke over the west ruin. The sight line
 * clears every unit by ≥ 0.8 m and the column by ≥ 1.1 m. Hold, drifting in a hair. */
export const B6_LENS = {x: 86.5, z: -3.6, up: 1.25};
const B6_AIM: V3 = {x: STAND.x, y: groundH(B6_LENS.x, B6_LENS.z) + 1.5, z: STAND.z + 9.5}; // he sits just right of centre
export const CAM_B6: CamKey[] = [
  {t: 0, pos: gp(B6_LENS.x, B6_LENS.z, B6_LENS.up), target: B6_AIM, fov: 36},
  {t: SHOT_T.B6[1] - SHOT_T.B6[0], pos: gp(B6_LENS.x - 0.3, B6_LENS.z + 0.017, B6_LENS.up + 0.02), target: {...B6_AIM, y: B6_AIM.y + 0.05}, fov: 35},
];
