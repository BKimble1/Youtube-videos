// Section D4 marks: the world points where people and machines meet (PURE: no React, no kits but ground). The Crew
// (crew.tsx) put their bodies and hands exactly here, and the machines (machines.ts) aim their blows and grabs here,
// so every contact is one point seen by both.
import type {V3} from '../../../kit/math';
import {groundH} from '../../world/ground';
import {EV} from './times';

const G = (x: number, z: number) => groundH(x, z);
const fwd = (h: number) => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
const right = (h: number) => ({x: Math.cos((h * Math.PI) / 180), z: Math.sin((h * Math.PI) / 180)});
/** body-local rig units (r, u, f; 251.4 per metre) → world, for a body at (x, z) facing h (u from the ground there) */
export const fromLocXZ = (x: number, z: number, h: number, l: {r: number; u: number; f: number}): V3 => {
  const f = fwd(h), r = right(h);
  return {x: x + (f.x * l.f + r.x * l.r) / 251.4, y: G(x, z) + l.u / 251.4, z: z + (f.z * l.f + r.z * l.r) / 251.4};
};

// ------------------------------------------------------------------ the Director's plate
/** His guard: the left wrist, body-local (rig units). The plate rides the forearm's back just below the wrist. */
export const GUARD = {r: 6, u: 345, f: 112};
/** The plate's world centre for a body at (x, z, h) holding the guard g (as D1: 0.15 m below the wrist, 5 cm out). */
export const plateAt = (x: number, z: number, h: number, g = GUARD): V3 => {
  const w = fromLocXZ(x, z, h, g);
  const f = fwd(h);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};

// ------------------------------------------------------------------ D4-1: W1's blow on the plate
/** where he stands to take it (he has just spun round to face it), and the plate there */
export const BLOCK = {x: 30.6, z: 1.72, h: 90, t: EV.w1Swing};
/** his guard braced for the blow (the plate up and in, weight forward: D1's BR1 brace) */
export const BLOCK_GUARD = {r: 2, u: 353, f: 106};
export const BLOCK_PLATE = plateAt(BLOCK.x, BLOCK.z, BLOCK.h, BLOCK_GUARD);
/** how far the blow drives him back (heels skid) */
export const BLOCK_SKID = 0.42;

// ------------------------------------------------------------------ D4-2: the runner struck down
/** he skids to a stop facing the flanker that cut across his path (WSW), halligan coming up: hit in the chest */
export const RUNNER_STOP = {x: 17.62, z: 7.93, h: 254, t: 155.42};
export const RUNNER_CHEST: V3 = (() => {
  const f = fwd(RUNNER_STOP.h);
  // (R4: he is crouched in the skid, his chest 0.9 m above the ground — R3 aimed at a standing chest, 1.22 m: the fist landed 0.42 m
  // too high and 0.5 m short of his torso, at his face)
  return {x: RUNNER_STOP.x + f.x * 0.14, y: G(RUNNER_STOP.x, RUNNER_STOP.z) + 0.92, z: RUNNER_STOP.z + f.z * 0.14};
})();
/** where he lies (EF tableau TB_CREW.runner): pelvis root (18.0, 7.7), heading 250 (feet toward the van) */
export const RUNNER_DOWN = {x: 18.0, z: 7.7, h: 250};

// ------------------------------------------------------------------ D4-2: the tether operator disarmed
/** she has turned to face H1 and backs a step, the empty launcher levelled at it (a bluff) */
export const TETHER_FACE = {x: 18.15, z: -1.35, h: 92};
/** her right hand on the launcher's grip (world) while she aims (body-local {r 22, u 300, f 128}) */
export const LAUNCHER_GRIP = fromLocXZ(TETHER_FACE.x, TETHER_FACE.z, TETHER_FACE.h, {r: 22, u: 300, f: 128});
/** the launcher's barrel end (where H1's fist closes), 0.3 m beyond the grip along her aim */
export const LAUNCHER_FRONT: V3 = (() => {
  const f = fwd(TETHER_FACE.h);
  return {x: LAUNCHER_GRIP.x + f.x * 0.3, y: LAUNCHER_GRIP.y + 0.03, z: LAUNCHER_GRIP.z + f.z * 0.3};
})();
/** the tug of war (157.05 → 157.55): the grip point is hauled toward H1 and yanked up; then torn free */
export const tugGrip = (T: number): V3 => {
  const u = Math.max(0, Math.min(1, (T - EV.disarmGrab) / (EV.disarmTear - EV.disarmGrab)));
  // she pulls back (west) for the first half, H1 wins the second half
  const dx = -0.12 * Math.sin(Math.PI * Math.min(1, u * 1.6)) + 0.22 * Math.max(0, u - 0.5) * 2;
  const dy = 0.05 * Math.sin(Math.PI * u) + 0.12 * Math.max(0, u - 0.7) / 0.3;
  return {x: LAUNCHER_GRIP.x + dx, y: LAUNCHER_GRIP.y + dy, z: LAUNCHER_GRIP.z};
};

// ------------------------------------------------------------------ D4-7/8: THE STRIKE
// R4 staging: the van's nose (its south-east corner at (10.5, 3.5), up to 2.3 m high) and the pocket where she sits against
// its south wall (8.4, 2.8) are shut to anything coming from due east: in R3 the ram came in along z ≈ 3.2 and its head
// ended 0.7 m inside the van's cab, the flying Director passed 0.6 m from her, and heavy 2's front-left foot stood 1.2 m
// from him. Now heavy 2 stops on the open ground south-east of the nose (hull z 4.2), the ram comes in along z ≈ 4.4
// (the head clears the nose by ≈ 0.35 m), he plants south of her wall (z 4.5) and is thrown back WNW to the slab,
// 1.3 m clear of her.
/** he plants south-east of her, just clear of the van's front corner, facing the ram (heading toward heavy 2) */
export const PLANT = {x: 9.2, z: 4.5, h: 88};
/** his raised guard at the strike (a high block: wrist up and forward) and the plate there = the ram's target */
export const STRIKE_GUARD = {r: 14, u: 352, f: 118};
export const STRIKE_PLATE = plateAt(PLANT.x, PLANT.z, PLANT.h, STRIKE_GUARD);
/**
 * where his back meets the slab: the root of the figure there (the figure's back is ON the slab's face: crew.tsx
 * `toSlab` places it; this is its result at the slam, checked by probe: gap 2 cm)
 */
export const SLAM = {x: 6.638, z: 3.31, h: 108};
/** the drone pilot down by the van's side at the strike: sitting propped on her hands, legs out east along the van */
export const PILOT_DOWN = {x: 8.36, z: 2.78, h: 96};
/** heavy 2's hull at the strike (its ram reaches STRIKE_PLATE): open ground south-east of the van's nose, 1.2 m from its final spot */
export const HEAVY_STRIKE = {x: 17.0, z: 4.2, h: 270};

// ------------------------------------------------------------------ the gather at the van (D4-3)
export const GATHER = {
  director: {x: 12.6, z: 0.3, h: 85},
  tether: {x: 13.9, z: 0.0, h: 90},
  breaker: {x: 12.0, z: 4.4, h: 80},
  decoy: {x: 12.6, z: 5.95, h: 84},
  drone: {x: 11.4, z: 2.7, h: 88},
  flares: {x: 11.3, z: 6.6, h: 82},
};
