// Section B cameras (pure data: physical positions and targets in the plan's metres; shot-local seconds). The shots
// read them through camPath() (or, for B6a, the march-synced crane below).
import {V3, add3} from '../../../kit/math';
import {M} from '../../timing';
import type {CamKey} from '../../film/stage';
import type {Cam3} from '../../engine/camera';
import {HAND_OUT, R0, R1, STAND} from './director';
import {CUT} from './beats';
import {groupD, restD} from './army';
export {STAND};
import {groundH} from '../../world/ground';

const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
const h = HAND_OUT;

export const SHOT_T = {
  B1: [CUT.b1, CUT.b2], B2: [CUT.b2, CUT.b3], B3: [CUT.b3, CUT.b4], B4: [CUT.b4, CUT.b5a], B5a: [CUT.b5a, CUT.b5b], B5b: [CUT.b5b, CUT.b6a],
  B6a: [CUT.b6a, CUT.b6b], B6b: [CUT.b6b, CUT.end],
} as const;
const D = (k: keyof typeof SHOT_T) => SHOT_T[k][1] - SHOT_T[k][0];

/** B1: ground level on the mound south-south-east of where the hand lands, the lens a hand's height above the stones,
 * looking north-west into the dark gap under the slab's broken south edge: the hand squeezes out of it and braces on
 * the rubble; his head lies under the slab, out of frame to the right. A slow creep in. */
export const CAM_B1: CamKey[] = [
  {t: 0, pos: {x: h.x + 0.34, y: h.y + 0.42, z: h.z + 0.5}, target: add3(h, {x: -0.08, y: 0.0, z: -0.18}), fov: 36},
  {t: D('B1'), pos: {x: h.x + 0.3, y: h.y + 0.38, z: h.z + 0.45}, target: add3(h, {x: -0.08, y: 0.0, z: -0.18}), fov: 35},
];

/** B2: side-on from the south, along the crest (the ground falls away east, so a lens at his chest height stays level
 * with him instead of looking steeply up): he drags himself out from behind the slab (left) toward the right (east,
 * the enemy), the press-up, the knee, the kneel; the bar stands in front of him, right of his body, so his palms,
 * knees and feet stay in view. The lens rises with him (pitch stays within ~15°). */
export const CAM_B2: CamKey[] = [
  {t: 0, pos: {x: 1.45, y: groundH(1.45, 4.35) + 1.0, z: 4.35}, target: {x: R0.x + 0.75, y: R0.y + 0.18, z: R0.z + 0.1}, fov: 40},
  {t: 1.6, pos: {x: 1.8, y: groundH(1.8, 4.4) + 1.05, z: 4.4}, target: {x: R1.x + 0.05, y: R1.y + 0.45, z: R1.z + 0.05}, fov: 38},
  {t: 3.2, pos: {x: 2.0, y: groundH(2.0, 4.45) + 1.12, z: 4.45}, target: {x: R1.x + 0.22, y: R1.y + 0.8, z: R1.z + 0.05}, fov: 37},
  {t: D('B2'), pos: {x: 2.06, y: groundH(2.06, 4.5) + 1.2, z: 4.5}, target: {x: R1.x + 0.3, y: R1.y + 1.08, z: R1.z + 0.05}, fov: 37},
];

/** B3: behind his right shoulder (south-west of him, so he holds the lower-left third and the army the right
 * two-thirds). It starts level with his head 4.5 m back; as he steps down to the brink it cranes up and back over the
 * crest to ~1 m over his head and 6 m back and holds there, drifting, through H1/H2 and the eye ripple — a high
 * over-shoulder on a long lens (V 14°) that holds the whole army. Cut once the ripple has run to the rear ranks. */
const HEADS = {x: STAND.x, y: STAND.y + 1.24, z: STAND.z}; // his head on the brink (he stands crouched, braced)
export const CAM_B3: CamKey[] = [
  {t: 0, pos: {x: -3.32, y: 4.79, z: 2.67}, target: {x: 96.0, y: 6.7, z: -8.6}, fov: 17},
  {t: 1.7, pos: add3(HEADS, {x: -6.0, y: 0.9, z: 1.5}), target: {x: 94.5, y: -2.7, z: -9.7}, fov: 14},
  {t: D('B3'), pos: add3(HEADS, {x: -6.4, y: 1.06, z: 1.6}), target: {x: 93.9, y: -4.1, z: -9.55}, fov: 13.6},
];

/** B4: his eyes (the lens at his eye on the brink; he is not drawn): a very long lens (V 4.6°) on the foreground heavy
 * (HEAVIES_B[0]) ~115–120 m off, the vanguard and the main body marching in lockstep in front of its legs, compressed.
 * It scans the burning south flank; on H3 its head swings round and looks into the lens. The aim drifts a hair with
 * the heavy as it comes on. */
const EYE_B: V3 = {x: STAND.x + 0.12, y: STAND.y + 1.42, z: STAND.z};
export const CAM_B4: CamKey[] = [
  {t: 0, pos: EYE_B, target: {x: 122.8, y: 3.0, z: -1.25}, fov: 4.7},
  {t: D('B4'), pos: EYE_B, target: {x: 117.3, y: 3.05, z: -1.15}, fov: 4.5},
];

/** B5a: his face, close, from just right of his eye line to the heavy (east-south-east, a hair under his eyes): the
 * look met — the breath catches, the brows go up, then down; the jaw sets. A slow creep in. */
const FACE: V3 = {x: STAND.x + 0.02, y: STAND.y + 1.4, z: STAND.z};
export const B5A_ANCHOR = FACE;
export const CAM_B5A: CamKey[] = [
  {t: 0, pos: {x: FACE.x + 1.5, y: FACE.y - 0.1, z: FACE.z + 0.52}, target: {x: FACE.x, y: FACE.y - 0.02, z: FACE.z}, fov: 30},
  {t: D('B5a'), pos: {x: FACE.x + 1.32, y: FACE.y - 0.09, z: FACE.z + 0.46}, target: {x: FACE.x, y: FACE.y - 0.01, z: FACE.z}, fov: 29},
];

/** B5b: from the avenue south-east of the van (its open door, the radio on the floor), pushing in and up the slope to
 * a medium close of him from below, east-south-east: the strap. */
const CHEST5: V3 = {x: STAND.x, y: STAND.y + 1.3, z: STAND.z};
export const CAM_B5B: CamKey[] = [
  {t: 0, pos: {x: 9.8, y: 1.45, z: 6.5}, target: {x: 4.9, y: 2.3, z: 2.2}, fov: 48},
  {t: 1.05, pos: {x: 7.4, y: 2.8, z: 4.9}, target: {x: CHEST5.x + 0.5, y: CHEST5.y - 0.1, z: CHEST5.z + 0.3}, fov: 30},
  {t: D('B5b'), pos: {x: 6.0, y: 3.6, z: 4.0}, target: {x: CHEST5.x + 0.05, y: CHEST5.y + 0.12, z: CHEST5.z + 0.05}, fov: 24},
];
export const B5_ANCHOR: V3 = {x: CHEST5.x, y: CHEST5.y + 0.3, z: CHEST5.z};

/** B6a: the lonely silhouette — the reverse, a crane 6 m over the main body's front ranks east of the crater, looking
 * west across it at him. The crane RIDES with the main body: it comes on at the march's pace and stops when they stop
 * (H5a) — the halt is felt in the frame. The vanguard's heads below plant two beats after H4. He is small in the upper
 * third, a silhouette against the backlit smoke over the west ruin (V 16°). */
export const B6_LENS = {x: 106, z: 4.5, up: 6.0};
const B6_HEAD: V3 = {x: STAND.x, y: STAND.y + 1.24, z: STAND.z};
/** a target that puts `at` at the horizontal centre and at screen height `sy` (0 top … 1 bottom) for vertical fov V */
const aimAt = (pos: V3, at: V3, V: number, sy: number): V3 => {
  const dx = at.x - pos.x, dy = at.y - pos.y, dz = at.z - pos.z, L = Math.hypot(dx, dy, dz);
  const yaw = Math.atan2(dz, dx), pitch = Math.asin(dy / L) - Math.atan((0.5 - sy) * 2 * Math.tan((V / 2) * (Math.PI / 180)));
  return {x: pos.x + Math.cos(pitch) * Math.cos(yaw) * 100, y: pos.y + Math.sin(pitch) * 100, z: pos.z + Math.cos(pitch) * Math.sin(yaw) * 100};
};
export const camB6a = (T: number): Cam3 => {
  const ride = restD('main') - groupD('main', T); // metres still to come before the main body stands
  const u = (T - CUT.b6a) / (CUT.b6b - CUT.b6a);
  const pos = {x: B6_LENS.x + ride, y: groundH(B6_LENS.x, B6_LENS.z) + B6_LENS.up - 0.15 * u, z: B6_LENS.z};
  const V = 16 - 0.3 * u;
  return {pos, target: aimAt(pos, B6_HEAD, V, 0.34), fov: V, roll: 0};
};

/** B6b: the machine's over-the-shoulder — the reverse of B3: east of him, behind the sentry's hold point and a little
 * south of its line, level with it. The sentry darts in past the lens (right) and brakes ~7 m off his face, filling the
 * right of frame from behind; the beam goes out to him; he is centre-left, facing us, backlit against the same pale
 * dust off the ruin as B6a; the plate comes up into the beam. The army is behind us: this machine is its reach. */
export const CAM_B6B: CamKey[] = [
  {t: 0, pos: {x: 13.4, y: 5.75, z: 3.35}, target: {x: 1.6, y: 4.28, z: 1.5}, fov: 19},
  {t: D('B6b'), pos: {x: 13.05, y: 5.72, z: 3.28}, target: {x: 1.6, y: 4.33, z: 1.48}, fov: 18.5},
];
void M;
