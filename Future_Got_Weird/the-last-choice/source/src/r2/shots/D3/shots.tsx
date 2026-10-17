// Section D3 shots: physical cameras on one battle (battle.tsx), film seconds in times.ts SH3. Low three-quarter views
// and a little handheld drift on the ground; the topple and the formation are wides. Screen direction: the enemy is east
// (screen right) except where a shot re-establishes it (D3-2 and D3-8 look east along the girder from its foot).
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3, add3, lerp} from '../../../kit/math';
import type {Cam3} from '../../engine';
import {d3Items, d3FxAt, D3Opts} from './battle';
import {crewAt} from './crew';
import {SH3, EV3} from './times';
import {G} from '../D4/motion';
import {dronesD3, D_PLANS, droneD3, SMASH_AT, heavy2D3} from './machines';
import {heavyAttach} from '../../mech';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
type CamFn = (t: number, T: number) => Cam3;
const shot = (start: number, cam: CamKey[] | CamFn, o: (T: number) => D3Opts = () => ({}), drift = 0.018, ease = 0.6): React.FC => {
  const C: React.FC = () => {
    const {t, T} = useShotTime(start);
    const c = typeof cam === 'function' ? cam(t, T) : camPath(cam, t, ease);
    const f = d3FxAt(T);
    return <Stage T={T} cam={c} lights={f.lights} shake={f.shake} drift={drift} items={(v) => [...d3Items(v, T, o(T)), ...f.items]} />;
  };
  return C;
};
const head = (role: Parameters<typeof crewAt>[0], T: number, up = 1.55): V3 => {
  const c = crewAt(role, T);
  return {x: c.body.pos.x, y: c.body.pos.y + up, z: c.body.pos.z};
};

// ------------------------------------------------------------------ D3-1 (P3 116.92–121.00): the flare and the drone
// Low over the flare carrier's right shoulder on the rim, looking east-north-east at heavy 1 coming on under the girder:
// the Director's signal; the flare struck and thrown; the allied drone darts past into its face; the flash; the blind
// swipe; it stumbles to a halt.
export const D3_1 = shot(SH3.d31, [
  {t: 0, pos: g(45.9, -1.35, 1.6), target: g(60.5, -5.6, 2.2), fov: 40},
  {t: 2.2, pos: g(46.1, -1.45, 1.62), target: g(61.0, -5.4, 2.4), fov: 38},
  {t: SH3.d32 - SH3.d31, pos: g(46.3, -1.55, 1.6), target: g(61.4, -5.6, 2.0), fov: 37},
], () => ({full: 34}), 0.02);

// ------------------------------------------------------------------ D3-2 (121.00–123.50): the clamp, the wrap, the pin
// Low behind the tether operator at the girder's foot, the truss across the top of frame, looking east-south-east: the
// blind heavy swings round toward us; she fires, the clamp bites its front-left shin; the cable whipped round post 3;
// the reel locks; the leg tries to step and is held.
export const D3_2 = shot(SH3.d32, [
  {t: 0, pos: g(44.3, -12.3, 1.35), target: g(58.0, -7.2, 1.0), fov: 44},
  {t: 1.4, pos: g(44.45, -12.25, 1.35), target: g(57.0, -7.6, 0.6), fov: 43},
  {t: SH3.d33 - SH3.d32, pos: g(44.6, -12.2, 1.35), target: g(57.6, -7.4, 0.4), fov: 43},
], () => ({full: 30}), 0.016);

// ------------------------------------------------------------------ D3-3 (123.50–125.64): the bait and the knee
// Low in the crater south-west of heavy 1's rear-left leg, looking up north-north-east: the breaker sets under the knee
// in the foreground, the runner beside him; beyond, the Director bangs his plate and the ram slams down short of him;
// the slow wind-up, the strike, the knee splits; the runner hauls him away as it begins to go over.
export const D3_3 = shot(SH3.d33, [
  {t: 0, pos: g(59.6, 2.4, 0.95), target: g(62.4, -3.6, 1.6), fov: 46},
  {t: 1.2, pos: g(59.55, 2.45, 0.9), target: g(62.6, -3.4, 1.4), fov: 45},
  {t: SH3.d34a - SH3.d33, pos: g(59.3, 2.6, 0.95), target: g(62.0, -3.2, 1.6), fov: 46},
], () => ({full: 30}), 0.02);

// ------------------------------------------------------------------ D3-4a (HEAVY_DOWN 125.64–127.20): the topple, wide
// From the crater's south rim, high: the walker rolls onto its side across the crater's north part; the two sprint out
// from under it; the crash; the dust wave rolls out toward us; debris rains.
export const D3_4a = shot(SH3.d34a, [
  {t: 0, pos: g(54.0, 15.5, 6.0), target: g(61.0, -3.5, 0.0), fov: 46},
  {t: SH3.d34b - SH3.d34a, pos: g(53.6, 15.8, 6.2), target: g(60.6, -3.2, -0.2), fov: 47},
], () => ({full: 30}), 0.012);
// ------------------------------------------------------------------ D3-4b (127.20–128.02): the peak
// Medium, low from the south-west on the Director in the dust under the girder: he lowers the plate, breathes, a fierce
// half-grin at the wreck; the breaker and the runner on the slope beyond.
export const D3_4b = shot(SH3.d34b, [
  {t: 0, pos: g(53.4, -6.0, 1.2), target: g(55.6, -8.9, 1.45), fov: 38},
  {t: SH3.d35 - SH3.d34b, pos: g(53.35, -6.05, 1.18), target: g(55.6, -8.95, 1.45), fov: 37},
], () => ({full: 30, near: true}), 0.014);

// ------------------------------------------------------------------ D3-5 (ADAPT 128.02–131.02): the drone climbs
// The camera rises with a small drone out of the dust over the wreck: it climbs above the haze, its gimbal tilts down,
// the eye snaps amber, a thin amber line finds the tablet in the decoy maker's hands on the rim.
const ADAPT_PLAN = D_PLANS.find((p) => p.id === 7605)!;
const D3_5cam: CamFn = (t, T) => {
  const d = droneD3(ADAPT_PLAN, T).pos;
  const k = Math.min(1, t / 3.0);
  // behind and below it (east-south-east), rising with it; the target moves from the drone to the rim below it
  const pos = {x: d.x + lerp(3.6, 4.6, k), y: d.y + lerp(-0.6, 1.8, k), z: d.z + lerp(3.4, 2.6, k)};
  const tgt = lerp3(d, add3(SMASH_AT, {x: 3.0, y: 0, z: -1.0}), Math.max(0, Math.min(1, (t - 1.2) / 1.6)) * 0.55);
  return {pos, target: tgt, fov: 44, roll: 0};
};
const lerp3 = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
export const D3_5 = shot(SH3.d35, D3_5cam, () => ({full: 24}), 0.0);

// ------------------------------------------------------------------ D3-6 (FORMATION 131.02–133.82): high wide
// High over the crater's south-east: the units' line across the crater bends into an arc round the Crew on the rim,
// the ripple running out from the middle; the wreck in the middle of the frame, heavy 2 coming along the avenue.
export const D3_6 = shot(SH3.d36, [
  {t: 0, pos: g(72.0, 18.0, 27.0), target: g(52.5, -1.0, -1.0), fov: 46},
  {t: SH3.d37a - SH3.d36, pos: g(71.0, 18.8, 27.5), target: g(52.0, -1.0, -1.0), fov: 46},
], () => ({full: 20, far: 140}), 0.0);

// ------------------------------------------------------------------ D3-7a (DECOY_FAIL 133.82–135.30): the decoy again
// Over her right shoulder: her finger sketches the four figures again, the tap, the tablet raised; the projector clicks.
export const D3_7a = shot(SH3.d37a, [
  {t: 0, pos: g(44.05, -0.1, 1.72), target: add3(SMASH_AT, {x: 0.6, y: -0.15, z: -0.1}), fov: 34},
  {t: 1.0, pos: g(44.0, -0.05, 1.72), target: add3(SMASH_AT, {x: 1.0, y: 0.0, z: -0.15}), fov: 36},
  {t: SH3.d37b - SH3.d37a, pos: g(43.7, 0.05, 1.85), target: g(54.0, -0.6, 2.4), fov: 44},
], () => ({full: 30, near: true}), 0.014);
// ------------------------------------------------------------------ D3-7b (135.30–136.15): the figures, ignored
// From the crater's south slope: the light figures walk on the dust, the units of the arc walk straight through them
// toward the rim; a drone drops out of the sky.
export const D3_7b = shot(SH3.d37b, [
  {t: 0, pos: g(55.0, 10.0, 2.2), target: g(51.0, -1.0, 2.2), fov: 48},
  {t: SH3.d37c - SH3.d37b, pos: g(54.7, 10.1, 2.25), target: g(50.4, -1.0, 2.3), fov: 48},
], () => ({full: 32}), 0.016);
// ------------------------------------------------------------------ D3-7c (136.15–137.66): the smash
// Over her left shoulder, the dust and the figures beyond: the drone drives into the tablet; pieces; she reels back,
// her hand cut; the figures flicker out.
export const D3_7c = shot(SH3.d37c, [
  {t: 0, pos: g(43.55, -1.75, 1.6), target: g(48.0, -0.1, 1.5), fov: 44},
  {t: SH3.d38 - SH3.d37c, pos: g(43.4, -1.85, 1.62), target: g(47.5, 0.0, 1.4), fov: 45},
], () => ({full: 30}), 0.02);

// ------------------------------------------------------------------ D3-8 (FLANK_DENIED 137.66–140.48): the cable cut
// Low at the girder's foot, along the cable to the wreck: drones swarm in under the truss; one lowers its cutter onto
// the cable; it snaps; she falls back on the slope toward us, gets up, runs.
export const D3_8 = shot(SH3.d38, [
  {t: 0, pos: g(43.7, -12.5, 1.0), target: g(51.0, -9.2, 1.6), fov: 46},
  {t: 1.6, pos: g(43.75, -12.4, 1.0), target: g(50.0, -9.6, 1.4), fov: 46},
  {t: SH3.d39 - SH3.d38, pos: g(43.6, -12.2, 1.05), target: g(46.5, -8.0, 1.0), fov: 48},
], () => ({full: 30}), 0.018);

// ------------------------------------------------------------------ D3-9 (ALLY_DRONE_LOST 140.48–142.36): the drone lost
// From the rim, the pilot in the foreground: the allied drone flees low across the rim, the two hunters close and
// strike; it tumbles down smoking; she stares at the dead controller.
export const D3_9 = shot(SH3.d39, [
  {t: 0, pos: g(47.6, -4.6, 1.5), target: g(44.8, -1.0, 2.2), fov: 46},
  {t: 1.0, pos: g(47.4, -4.4, 1.45), target: g(43.5, 0.2, 1.6), fov: 46},
  {t: SH3.d310 - SH3.d39, pos: g(47.2, -4.3, 1.4), target: g(43.2, 0.6, 1.0), fov: 46},
], () => ({full: 30}), 0.02);

// ------------------------------------------------------------------ D3-10 (HEAVY2 142.36–145.18): over the wreck
// Low behind the Crew on the rim, looking east up at the second heavy: it comes over the first one's wreck, a leg lifted
// high over it, and the foot comes down on this side; the ground shakes.
export const D3_10 = shot(SH3.d310, [
  {t: 0, pos: g(42.6, -4.4, 0.75), target: g(62.0, -3.6, 3.4), fov: 38},
  {t: SH3.d311a - SH3.d310, pos: g(42.8, -4.3, 0.72), target: g(61.0, -3.4, 3.2), fov: 38},
], () => ({full: 30}), 0.012);

// ------------------------------------------------------------------ D3-11 (HEAVY2_FIRE 145.18–149.86)
// a: wide from the south-west: they run; the round streaks in; the blast on the rim; they are thrown.
export const D3_11a = shot(SH3.d311a, [
  {t: 0, pos: g(36.5, 11.0, 4.0), target: g(45.5, -0.5, 1.0), fov: 46},
  {t: SH3.d311b - SH3.d311a, pos: g(36.3, 11.2, 4.1), target: g(44.5, -0.2, 0.8), fov: 47},
], () => ({full: 32}), 0.02);
// b: insert — the breaker on one knee checks the gauge: the needle in the red
const gaugeCam: CamFn = (t, T) => {
  const c = crewAt('breaker', T);
  const back = c.pts!.back, front = c.pts!.front;
  const tgt = lerp3(back, front, 0.25);
  return {pos: add3(tgt, {x: 0.35, y: 0.32, z: 0.55}), target: tgt, fov: 30, roll: 0};
};
export const D3_11b = shot(SH3.d311b, gaugeCam, () => ({full: 30, near: true}), 0.006);
// c: insert — the flare carrier on his hands and knees lifts his head: the brow cut
const flareCam: CamFn = (t, T) => {
  const h = head('flares', T, 0.85);
  return {pos: add3(h, {x: -1.25, y: -0.15, z: 0.45}), target: h, fov: 32, roll: 0};
};
export const D3_11c = shot(SH3.d311c, flareCam, () => ({full: 30, near: true}), 0.01);
// d: the Director gets up, the lip cut; he looks back east at the heavy
export const D3_11d = shot(SH3.d311d, [
  {t: 0, pos: g(40.4, 0.9, 0.9), target: g(42.4, -0.5, 0.8), fov: 38},
  {t: SH3.d311e - SH3.d311d, pos: g(40.5, 0.95, 1.15), target: g(42.5, -0.5, 1.45), fov: 36},
], () => ({full: 30}), 0.016);
// e: they fall back west among D1's wrecks into D4's start; the arc presses in; heavy 2 walks out of the crater
export const D3_11e = shot(SH3.d311e, [
  {t: 0, pos: g(37.5, -9.5, 2.2), target: g(38.0, 2.0, 1.2), fov: 48},
  {t: SH3.end - SH3.d311e, pos: g(37.2, -9.8, 2.3), target: g(37.0, 2.5, 1.1), fov: 48},
], () => ({full: 32}), 0.018);
void [dronesD3, heavy2D3, heavyAttach, EV3];
