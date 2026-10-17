// Section D4 shots: physical cameras on one battle (battle.tsx), film seconds in times.ts SH. Low three-quarter views
// and a little handheld drift on the ground; the two wides are high. Screen direction: the enemy is east (screen
// right) except where a shot re-establishes it (D4-3 and D4-9b look east from the van; D4-5 is behind the Crew).
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {d4Items, d4FxAt, D4Opts} from './battle';
import {crewAt} from './crew';
import {SH} from './times';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
const shot = (start: number, keys: CamKey[], o: (T: number) => D4Opts = () => ({}), drift = 0.018, ease = 0.6): React.FC => {
  const C: React.FC = () => {
    const {t, T} = useShotTime(start);
    const cam = camPath(keys, t, ease);
    const f = d4FxAt(T);
    return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={drift} items={(v) => [...d4Items(v, T, o(T)), ...f.items]} />;
  };
  return C;
};
const chest = (role: Parameters<typeof crewAt>[0], T: number, up = 1.2): V3 => {
  const c = crewAt(role, T);
  return {x: c.body.pos.x, y: c.body.pos.y + up, z: c.body.pos.z};
};

// ------------------------------------------------------------------ D4-1 (149.86–154.50): the fighting retreat
// Low from the south, tracking west with them across the avenue; the arc presses from screen right; W1 catches the
// Director and its hammer cracks the plate right through (153.42).
export const D4_1 = shot(SH.d41, [
  {t: 0, pos: g(35.6, 11.6, 1.05), target: g(35.4, 1.2, 1.25), fov: 46},
  {t: 2.2, pos: g(33.2, 11.2, 1.0), target: g(32.8, 1.4, 1.25), fov: 45},
  {t: SH.d42a - SH.d41, pos: g(31.2, 10.2, 0.95), target: g(30.6, 1.7, 1.3), fov: 42},
], (T) => ({full: 34, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.02);

// ------------------------------------------------------------------ D4-2a (154.50–156.70): the runner struck down
// Low, south-east of him: the flanker overtakes along the near side and cuts across his path; the backhand; he goes
// over backward onto the street.
export const D4_2a = shot(SH.d42a, [
  {t: 0, pos: g(22.4, 12.6, 0.8), target: g(20.0, 7.8, 1.15), fov: 42},
  {t: 1.0, pos: g(21.8, 12.4, 0.8), target: g(18.6, 7.9, 1.05), fov: 41},
  {t: SH.d42b - SH.d42a, pos: g(21.4, 12.2, 0.85), target: g(18.0, 7.7, 0.75), fov: 40},
], (T) => ({full: 30, tweak: {runner: {anchor: chest('runner', T, 1.0)}}}), 0.02);

// ------------------------------------------------------------------ D4-2b (156.70–158.50): the tether operator disarmed
// Side-on from the north: she (left, facing right) levels the empty launcher; H1's fist closes on it, the tug, the
// launcher torn out of her hands; it is flung down.
export const D4_2b = shot(SH.d42b, [
  {t: 0, pos: g(18.6, -5.9, 1.05), target: g(18.7, -1.3, 1.3), fov: 40},
  {t: SH.d43 - SH.d42b, pos: g(18.3, -5.7, 1.05), target: g(18.4, -1.3, 1.2), fov: 41},
], (T) => ({full: 30, tweak: {tether: {anchor: chest('tether', T, 1.2)}}}), 0.016);

// ------------------------------------------------------------------ D4-3 (158.50–162.42): at the van
// Low from the south-west: the van left, the ridge behind it; they come in and stand, spent; the units hold beyond,
// right; the Director (front) looks round at them and raises his arm.
export const D4_3 = shot(SH.d43, [
  {t: 0, pos: g(7.4, 9.6, 1.25), target: g(14.2, 1.4, 1.5), fov: 46},
  {t: SH.d44a - SH.d43, pos: g(8.4, 8.4, 1.3), target: g(13.8, 1.3, 1.6), fov: 42},
], (T) => ({full: 30, near: false, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.014);

// ------------------------------------------------------------------ D4-4a (162.42–163.62): the surge; W1 smashed
export const D4_4a = shot(SH.d44a, [
  {t: 0, pos: g(9.4, 2.9, 1.3), target: g(13.6, 1.4, -1.6), fov: 48},
  {t: SH.d44b - SH.d44a, pos: g(10.0, 2.4, 1.25), target: g(13.6, 1.4, -2.3), fov: 46},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.022);

// ------------------------------------------------------------------ D4-4b (163.62–164.72): the empty breaker as a club
export const D4_4b = shot(SH.d44b, [
  {t: 0, pos: g(11.5, 7.9, 0.85), target: g(14.6, 4.1, 1.55), fov: 42},
  {t: SH.d44c - SH.d44b, pos: g(11.7, 7.7, 0.85), target: g(14.7, 4.1, 1.3), fov: 42},
], (T) => ({full: 30, tweak: {breaker: {anchor: chest('breaker', T, 1.3)}}}), 0.022);

// ------------------------------------------------------------------ D4-4c (164.72–165.62): the cable round its shins; driven over
export const D4_4c = shot(SH.d44c, [
  {t: 0, pos: g(15.8, 2.6, 0.7), target: g(16.0, 0.9, -2.2), fov: 44},
  {t: SH.d44d - SH.d44c, pos: g(15.9, 2.5, 0.75), target: g(16.3, 0.8, -2.5), fov: 44},
], (T) => ({full: 30, tweak: {tether: {anchor: chest('tether', T, 0.9)}}}), 0.02);

// ------------------------------------------------------------------ D4-4d (165.62–166.41): the last flare into heavy 2's eye
export const D4_4d = shot(SH.d44d, [
  {t: 0, pos: g(12.3, 8.9, 0.9), target: g(20.5, 3.6, 2.4), fov: 46},
  {t: SH.d45 - SH.d44d, pos: g(12.4, 8.8, 0.95), target: g(21.0, 4.2, 2.2), fov: 46},
], (T) => ({full: 30, tweak: {flares: {anchor: chest('flares', T, 1.3)}}}), 0.02);

// ------------------------------------------------------------------ D4-5 (166.41–170.40): heavy 2 staggers off a slab; the gap
// Behind them, low, looking east past the drone pilot (foreground) at the wrecks and the heavy; a breath; then a drone
// drops out of the sky at her.
export const D4_5 = shot(SH.d45, [
  {t: 0, pos: g(9.5, 5.1, 1.4), target: g(21.0, 2.8, 0.8), fov: 46},
  {t: 2.6, pos: g(9.8, 4.9, 1.42), target: g(19.5, 2.4, 1.0), fov: 44},
  {t: SH.d46a - SH.d45, pos: g(9.9, 4.8, 1.45), target: g(16.0, 2.4, 2.4), fov: 46},
], () => ({full: 34}), 0.016);

// ------------------------------------------------------------------ D4-6a (170.40–173.10): REALIZE — the wide
// High from the south-west: the ring of machines closing on every side of the few of them by the van, the columns
// streaming along the avenue to the east, drones holding above; heavy 2 coming on again.
export const D4_6a = shot(SH.d46a, [
  {t: 0, pos: {x: -4.0, y: 14.0, z: 22.0}, target: {x: 22.0, y: 0.5, z: -1.0}, fov: 52},
  {t: SH.d46b - SH.d46a, pos: {x: -5.2, y: 15.6, z: 23.4}, target: {x: 22.5, y: 0.5, z: -1.2}, fov: 52},
], () => ({full: 22, maxFull: 6, far: 70}), 0.0);

// ------------------------------------------------------------------ D4-6b (173.10–175.04): their faces
export const D4_6b = shot(SH.d46b, [
  {t: 0, pos: g(15.7, 4.6, 1.55), target: g(13.2, 2.6, 1.5), fov: 34},
  {t: SH.d47 - SH.d46b, pos: g(15.1, 5.4, 1.5), target: g(12.4, 4.6, 1.5), fov: 34},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.5)}}}), 0.012);

// ------------------------------------------------------------------ D4-7 (175.04–177.76): the ram rises at her; he runs
export const D4_7 = shot(SH.d47, [
  {t: 0, pos: g(11.0, 11.4, 0.95), target: g(12.4, 2.6, 2.6), fov: 50},
  {t: SH.d48 - SH.d47, pos: g(10.7, 10.2, 0.95), target: g(11.4, 2.4, 2.4), fov: 48},
], (T) => ({full: 34, tweak: {director: {anchor: chest('director', T, 1.2)}}}), 0.016);

// ------------------------------------------------------------------ D4-8 (177.76–179.30): STRIKE
export const D4_8 = shot(SH.d48, [
  {t: 0, pos: g(10.4, 7.8, 0.85), target: g(8.8, 1.4, 3.2), fov: 44},
  {t: 0.4, pos: g(10.2, 7.6, 0.85), target: g(8.1, 1.2, 3.3), fov: 44},
  {t: SH.d49a - SH.d48, pos: g(10.0, 7.4, 0.85), target: g(7.8, 1.0, 3.3), fov: 42},
], (T) => ({full: 34, near: true, tweak: {director: {anchor: chest('director', T, 1.0)}, drone: {anchor: chest('drone', T, 0.6)}}}), 0.012);

// ------------------------------------------------------------------ D4-9a (179.30–180.80): he slides down beside the van
export const D4_9a = shot(SH.d49a, [
  {t: 0, pos: g(8.8, 6.2, 0.95), target: g(7.0, 1.0, 3.4), fov: 38},
  {t: SH.d49b - SH.d49a, pos: g(8.6, 6.0, 0.85), target: g(6.9, 0.75, 3.45), fov: 38},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 0.8)}}}), 0.01);

// ------------------------------------------------------------------ D4-9b (180.80–183.30): the others held
// From beside him, low, looking east: each of them straining toward him (toward the lens) is caught and held by a
// unit behind; heavy 2 steps back into its place beyond.
export const D4_9b = shot(SH.d49b, [
  {t: 0, pos: g(7.7, 4.5, 1.2), target: g(12.4, 1.3, 4.4), fov: 54},
  {t: SH.d410 - SH.d49b, pos: g(7.6, 4.6, 1.15), target: g(12.2, 1.3, 4.6), fov: 52},
], () => ({full: 30, near: true}), 0.01);

// ------------------------------------------------------------------ D4-10 (183.30–186.90): the ring holds — FINAL_HIT
export const D4_10 = shot(SH.d410, [
  {t: 0, pos: {x: 25.0, y: 12.5, z: 22.5}, target: {x: 10.5, y: 0.6, z: 3.0}, fov: 48},
  {t: SH.end - SH.d410, pos: {x: 23.6, y: 11.2, z: 20.4}, target: {x: 10.4, y: 0.6, z: 3.1}, fov: 47},
], () => ({full: 24, maxFull: 8, far: 80}), 0.0);
