// Section D3 cameras: physical positions and targets in the world (metres; y absolute unless built with g()), shot-
// local seconds. PURE (no React) so the framing can be checked numerically. Low three-quarter views and handheld drift
// on the ground; the topple and the formation are wides; the cuts keep the enemy east (screen right) unless a shot
// re-establishes it.
import type {CamKey} from '../../film/stage';
import type {Cam3} from '../../engine';
import {V3, add3, lerp, clamp} from '../../../kit/math';
import {G} from '../D4/motion';
import {SH3, EV3} from './times';
import {D_PLANS, droneD3, SMASH_AT} from './machines';
import {crewAt} from './crew';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
const at = (x: number, y: number, z: number): V3 => ({x, y, z});
const lerp3 = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const smoothK = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
export type CamFn = (t: number, T: number) => Cam3;
const d = (a: number, b: number) => b - a;

// D3-1: on the rim south of the flare carrier, his right profile: the Crew on the left (the Director's signal), the
// flare struck in his hands, heavy 1 coming on on the right; the throw — a whip pan with the flare — the drone in its
// face, the flash; held on the blind swipe
export const CAM_1: CamKey[] = [
  {t: 0, pos: g(47.3, 0.2, 1.4), target: at(53.5, 1.0, -7.7), fov: 50},
  {t: 1.75, pos: g(47.32, 0.18, 1.4), target: at(54.4, 1.2, -6.9), fov: 48},
  {t: 2.55, pos: g(47.4, 0.12, 1.42), target: at(62.5, 1.5, -5.0), fov: 38},
  {t: d(SH3.d31, SH3.d32), pos: g(47.45, 0.1, 1.42), target: at(61.4, 1.2, -4.4), fov: 37},
];
// D3-2: south-west of the tether operator at the girder's foot: she and post 3 on the left, the heavy swinging round
// on the right, the Director baiting it beyond
export const CAM_2: CamKey[] = [
  {t: 0, pos: at(43.6, 2.35, -7.0), target: at(54.0, 1.0, -9.8), fov: 48},
  {t: 1.3, pos: at(43.65, 2.34, -7.05), target: at(52.8, 1.3, -11.1), fov: 50},
  {t: d(SH3.d32, SH3.d33), pos: at(43.7, 2.33, -7.1), target: at(52.9, 1.2, -11.0), fov: 50},
];
// D3-3: low on the slope south-west of the Director: him on the left with the plate up, the ram coming down in the
// middle, the breaker under the knee on the right; the strike; it starts to go over
export const CAM_3: CamKey[] = [
  {t: 0, pos: at(53.4, -0.3, -8.2), target: at(62.2, 0.4, -7.4), fov: 44},
  {t: 1.1, pos: at(53.35, -0.32, -8.15), target: at(62.4, 0.2, -7.0), fov: 44},
  {t: d(SH3.d33, SH3.d34a), pos: at(53.2, -0.25, -8.1), target: at(62.2, 0.3, -6.6), fov: 46},
];
// D3-4a: wide, high on the crater's south-west slope: it rolls onto its left side toward us (its roof plates to the
// lens) across the crater's north part, the two sprinting out from under it on the left; the crash; the dust wave
export const CAM_4a: CamKey[] = [
  {t: 0, pos: g(52.5, 2.5, 6.0), target: at(62.5, -0.5, -4.6), fov: 50},
  {t: d(SH3.d34a, SH3.d34b), pos: g(52.3, 2.7, 6.2), target: at(62.0, -1.2, -4.8), fov: 52},
];
// D3-4b: the peak: from the wreck's side of them, low, their faces; the dust drifting past
export const CAM_4b: CamKey[] = [
  {t: 0, pos: at(58.8, -0.95, -9.4), target: at(55.3, -0.35, -7.5), fov: 41},
  {t: d(SH3.d34b, SH3.d35), pos: at(58.75, -0.96, -9.38), target: at(55.3, -0.36, -7.52), fov: 40},
];
// D3-5: with the small drone out of the dust; at the top, past it down onto the rim (the amber line to the tablet)
const ADAPT = D_PLANS.find((p) => p.id === 7605)!;
export const CAM_5: CamFn = (t, T) => {
  const dp = droneD3(ADAPT, T).pos;
  const k = smoothK(t / 2.7);
  const pos = add3(dp, {x: lerp(2.6, 3.6, k), y: lerp(-2.2, 1.4, k), z: lerp(2.6, -1.3, k)});
  const look = lerp3(dp, SMASH_AT, smoothK((t - 1.3) / 1.4) * 0.34);
  return {pos, target: look, fov: 46, roll: 0};
};
// D3-6: high over the avenue's south side, steeply down: the line across the crater bends into the arc round the Crew
// on the west rim (the ripple from the middle out); the wreck beyond; the wing under the girder
export const CAM_6: CamKey[] = [
  {t: 0, pos: at(51.0, 30.0, 17.0), target: at(52.5, -1.0, 3.0), fov: 50},
  {t: d(SH3.d36, SH3.d37a), pos: at(50.8, 30.2, 17.1), target: at(52.3, -1.0, 2.8), fov: 50},
];
// D3-7a: high over her right shoulder down onto the tablet (the sketch, the tap); up and out with the beam to the
// light on the dust
export const CAM_7a: CamKey[] = [
  {t: 0, pos: g(44.85, 0.45, 2.15), target: add3(SMASH_AT, {x: 0.1, y: 0.12, z: 0.0}), fov: 40},
  {t: 0.95, pos: g(44.85, 0.45, 2.15), target: add3(SMASH_AT, {x: 0.25, y: 0.18, z: -0.05}), fov: 40},
  {t: d(SH3.d37a, SH3.d37b), pos: g(44.8, 0.5, 2.3), target: at(53.5, 1.0, -0.6), fov: 44},
];
// D3-7b: high behind the Crew on the rim: the figures on the dust; the units walk straight through them toward us;
// the drone drops out of the sky
export const CAM_7b: CamKey[] = [
  {t: 0, pos: at(40.9, 2.75, -1.3), target: at(55.0, 1.2, 0.2), fov: 46},
  {t: d(SH3.d37b, SH3.d37c), pos: at(41.0, 2.75, -1.25), target: at(54.6, 1.3, 0.3), fov: 46},
];
// D3-7c: over her left shoulder: the drone comes down into the tablet; the figures flicker out beyond
export const CAM_7c: CamKey[] = [
  {t: 0, pos: at(43.85, 1.78, -1.55), target: at(51.0, 0.1, 1.4), fov: 46},
  {t: d(SH3.d37c, SH3.d38), pos: at(43.7, 1.8, -1.6), target: at(51.0, 0.2, 1.2), fov: 47},
];
// D3-8: low at the girder's foot along the cable: the drones come in under the truss; the cut; she falls back
export const CAM_8: CamKey[] = [
  {t: 0, pos: at(42.5, 1.25, -9.2), target: at(52.0, 1.4, -10.0), fov: 48},
  {t: 1.6, pos: at(42.55, 1.25, -9.2), target: at(51.0, 1.2, -9.9), fov: 48},
  {t: d(SH3.d38, SH3.d39), pos: at(42.4, 1.3, -9.0), target: at(47.0, 0.9, -8.0), fov: 50},
];
// D3-9: from the south-west on the rim: the drone flees toward the lens; struck; it crashes in the foreground; the
// pilot beyond with the dead controller
export const CAM_9: CamKey[] = [
  {t: 0, pos: at(37.0, 1.4, 7.4), target: at(45.0, 2.4, -2.0), fov: 48},
  {t: 1.0, pos: at(36.95, 1.38, 7.45), target: at(43.6, 1.6, -0.4), fov: 48},
  {t: d(SH3.d39, SH3.d310), pos: at(36.9, 1.35, 7.5), target: at(42.7, 0.3, 1.7), fov: 48},
];
// D3-10: low in the crater's south-east, in the gap of the broken water main, across the wreck: heavy 2 comes in from
// the right, a leg lifted high over heavy 1's wreck; its front-right foot comes down on this side
export const CAM_10: CamKey[] = [
  {t: 0, pos: g(68.4, 8.1, 1.5), target: at(65.5, 0.3, -4.6), fov: 46},
  {t: d(SH3.d310, SH3.d311a), pos: g(68.2, 8.2, 1.45), target: at(63.6, 0.1, -4.8), fov: 46},
];
// D3-11a: wide from the south-west, clear of the cover slab: they run; the round; the blast on the rim; they are thrown
export const CAM_11a: CamKey[] = [
  {t: 0, pos: g(36.0, 6.0, 3.8), target: at(45.5, 0.8, -2.0), fov: 50},
  {t: d(SH3.d311a, SH3.d311b), pos: g(35.8, 6.1, 3.9), target: at(44.8, 0.8, -1.6), fov: 50},
];
// D3-11b: insert — the breaker's gauge (he is down on one knee, the tool across his thigh)
export const CAM_11b: CamFn = (t, T) => {
  const c = crewAt('breaker', Math.min(T, 146.8)), h = (c.body.heading * Math.PI) / 180;
  const fw = {x: Math.sin(h), z: -Math.cos(h)}, lf = {x: -Math.cos(h), z: -Math.sin(h)};
  const tgt = lerp3(c.pts!.back, c.pts!.front, -0.05);
  return {pos: {x: tgt.x + lf.x * 1.15 + fw.x * 0.4, y: tgt.y + 0.5, z: tgt.z + lf.z * 1.15 + fw.z * 0.4}, target: tgt, fov: 32, roll: 0};
};
// D3-11c: insert — low in front of the flare carrier on his hands and knees: he lifts his head, the brow cut; he gets up
export const CAM_11c: CamFn = (t, T) => {
  const c = crewAt('flares', T), b = c.body.pos, h = (c.body.heading * Math.PI) / 180;
  const fw = {x: Math.sin(h), z: -Math.cos(h)}, rt = {x: Math.cos(h), z: Math.sin(h)};
  // (crew.tsx: on his hands and knees, the head comes up ≈146.9; kneeling ≈147.2; up ≈147.5)
  const k1 = smoothK((T - 146.85) / 0.4), k2 = smoothK((T - 147.2) / 0.3);
  const hy = lerp(lerp(0.66, 1.02, k1), 1.5, k2), hf = lerp(lerp(0.45, 0.2, k1), 0.08, k2);
  const head = {x: b.x + fw.x * hf, y: b.y + hy, z: b.z + fw.z * hf};
  const pos = {x: b.x + fw.x * 1.8 + rt.x * 0.55, y: b.y + lerp(0.72, 1.15, k1 * 0.6 + k2 * 0.4), z: b.z + fw.z * 1.8 + rt.z * 0.55};
  return {pos, target: head, fov: 34, roll: 0};
};
// D3-11d: in front of the Director as he gets up, the lip cut; he looks back east at the heavy; he turns and goes
export const CAM_11d: CamFn = (t, T) => {
  const c = crewAt('director', Math.min(T, EV3.end));
  const hd = {x: c.body.pos.x, y: c.body.pos.y + 1.5, z: c.body.pos.z};
  // to his right, three-quarter front (the plate is on his left arm)
  const pos = at(45.15 - 0.06 * t, 1.95, -0.85);
  const look = lerp3(at(43.5, 1.75, -2.3), hd, 0.85);
  return {pos, target: look, fov: 36, roll: 0};
};
// D3-11e: from the south, low among the arc's south units: the Crew fall back west (screen left) among D1's wrecks and
// turn to face east (screen right) at the end
export const CAM_11e: CamKey[] = [
  {t: 0, pos: g(39.5, 11.0, 1.7), target: at(36.8, 1.0, 1.4), fov: 46},
  {t: d(SH3.d311e, SH3.end), pos: g(39.2, 11.1, 1.7), target: at(35.2, 1.0, 1.8), fov: 46},
];
