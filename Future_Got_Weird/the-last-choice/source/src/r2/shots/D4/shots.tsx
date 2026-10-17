// Section D4 shots: physical cameras on one battle (battle.tsx), film seconds in times.ts SH. Low three-quarter views
// and a little handheld drift on the ground; the two wides are high. Screen direction: the enemy is east (screen
// right) except where a shot re-establishes it (D4-3 and D4-9b look east from the van; D4-5 is behind the Crew).
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {d4Items, d4FxAt, D4Opts} from './battle';
import {crewAt} from './crew';
import {SH, EV} from './times';
const M_STRIKE = EV.strike;
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

// ------------------------------------------------------------------ D4-1a (149.86–152.60): the fighting retreat
// Ahead of them and to the south-west, a little high: they come away from the crater toward the lens, the arc of
// units pressing in from screen right, heavy 2 walking out of the crater beyond; the Director last, backing off.
export const D4_1a = shot(SH.d41, [
  {t: 0, pos: g(24.6, 7.9, 2.3), target: g(33.6, 1.2, 1.3), fov: 36},
  {t: SH.d41b - SH.d41, pos: g(24.0, 7.7, 2.2), target: g(31.8, 1.6, 1.3), fov: 38},
], () => ({full: 30}), 0.02);
// ------------------------------------------------------------------ D4-1b (152.60–154.50): the plate cracks through
// Low three-quarter from the south-east (D1-5's angle): he spins to face W1, the hammer comes down on the plate, his
// heels skid back; a look at the plate — cracked right through.
export const D4_1b = shot(SH.d41b, [
  {t: 0, pos: g(33.8, 3.8, 1.0), target: g(30.9, 1.7, 1.3), fov: 40},
  {t: SH.d42a - SH.d41b, pos: g(33.6, 3.7, 1.0), target: g(30.4, 1.75, 1.25), fov: 40},
], (T) => ({full: 34, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.016);

// ------------------------------------------------------------------ D4-2a (154.50–156.70): the runner struck down
// Low, south-east of him: the flanker overtakes along the near side and cuts across his path; the backhand; he goes
// over backward onto the street.
export const D4_2a = shot(SH.d42a, [
  {t: 0, pos: g(22.4, 12.6, 0.8), target: g(20.0, 7.8, 1.15), fov: 42},
  {t: 0.95, pos: g(21.6, 12.2, 0.85), target: g(17.3, 8.0, 1.1), fov: 38},
  {t: SH.d42b - SH.d42a, pos: g(21.3, 12.0, 0.85), target: g(17.6, 7.75, 0.7), fov: 38},
], (T) => ({full: 30, tweak: {runner: {anchor: chest('runner', T, 1.0)}}}), 0.02);

// ------------------------------------------------------------------ D4-2b (156.70–158.50): the tether operator disarmed
// Side-on from the south, close: she (left, facing right) levels the empty launcher; H1's fist closes on it, the tug, the
// launcher torn out of her hands; it is flung down.
export const D4_2b = shot(SH.d42b, [
  {t: 0, pos: g(18.6, 1.4, 1.15), target: g(18.8, -1.3, 1.25), fov: 44},
  {t: SH.d43 - SH.d42b, pos: g(18.4, 1.35, 1.12), target: g(18.4, -1.3, 1.2), fov: 44},
], (T) => ({full: 30, tweak: {tether: {anchor: chest('tether', T, 1.2)}}}), 0.016);

// ------------------------------------------------------------------ D4-3a (158.50–160.75): at the van
// From the south, behind them, low: the van and the ridge beyond, the units holding beyond them to the right; they
// come in and stand, spent; the Director (front) looks round at them — toward us — and raises his arm.
export const D4_3a = shot(SH.d43, [
  {t: 0, pos: g(14.6, 11.4, 1.55), target: g(12.2, 3.0, 1.35), fov: 40},
  {t: SH.d43b - SH.d43, pos: g(14.4, 10.6, 1.5), target: g(12.3, 2.6, 1.4), fov: 38},
], () => ({full: 30}), 0.014);
// ------------------------------------------------------------------ D4-3b (160.75–162.42): he looks round at them; the arm
// Close behind his right shoulder from among them: he looks back at them (to us), turns to the units, raises his arm.
export const D4_3b = shot(SH.d43b, [
  {t: 0, pos: g(13.6, 4.6, 1.45), target: g(12.6, 0.4, 1.75), fov: 38},
  {t: SH.d44a - SH.d43b, pos: g(13.5, 4.2, 1.45), target: g(12.65, 0.2, 1.9), fov: 38},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.4)}}}), 0.012);

// ------------------------------------------------------------------ D4-4a (162.42–163.62): the surge; W1 smashed
export const D4_4a = shot(SH.d44a, [
  {t: 0, pos: g(10.9, -1.4, 1.45), target: g(14.0, -1.6, 1.35), fov: 50},
  {t: SH.d44b - SH.d44a, pos: g(11.0, -1.45, 1.45), target: g(14.2, -1.9, 1.3), fov: 50},
], (T) => ({full: 30, tweak: {director: {anchor: chest('director', T, 1.3)}}}), 0.022);

// ------------------------------------------------------------------ D4-4b (163.62–164.72): the empty breaker as a club
export const D4_4b = shot(SH.d44b, [
  {t: 0, pos: g(16.8, 7.6, 0.95), target: g(14.4, 4.0, 1.55), fov: 42},
  {t: SH.d44c - SH.d44b, pos: g(16.9, 7.5, 0.95), target: g(14.5, 4.1, 1.3), fov: 42},
], (T) => ({full: 30, tweak: {breaker: {anchor: chest('breaker', T, 1.3)}}}), 0.022);

// ------------------------------------------------------------------ D4-4c (164.72–165.62): the cable round its shins; driven over
// From the south-east, a little high, looking north-west across W3's shins: the loop whips round them (right), taut
// back to her hands (left) as she hauls; the Director drives into its chest from beyond. (A view from the south put
// the rubble block sch_21 between the lens and the shins.)
export const D4_4c = shot(SH.d44c, [
  {t: 0, pos: g(18.3, 0.4, 1.7), target: g(15.95, -1.75, 0.75), fov: 48},
  {t: SH.d44d - SH.d44c, pos: g(18.15, 0.28, 1.65), target: g(16.0, -1.85, 0.7), fov: 47},
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

// ------------------------------------------------------------------ D4-7a (175.04–175.85): the threat aimed at HER
// Low, from beyond the slab's south end, along the van's side: she sits against the van in the left mid-ground, heavy 2
// looms in over her (screen right), its amber eye on her. He is just out of frame right.
export const D4_7a = shot(SH.d47, [
  {t: 0, pos: g(6.3, 4.95, 0.85), target: g(11.6, 2.13, 2.2), fov: 48},
  {t: SH.d47b - SH.d47, pos: g(6.33, 4.94, 0.85), target: g(11.6, 2.13, 2.3), fov: 48},
], (T) => ({full: 34, tweak: {drone: {anchor: chest('drone', T, 0.5)}}}), 0.012);
// ------------------------------------------------------------------ D4-7b (175.85–176.45): he sees it
// Close on his face from her direction: looking at the heavy, his head snaps round to her (175.98), the body follows,
// and he launches toward the lens.
export const D4_7b = shot(SH.d47b, [
  {t: 0, pos: g(11.79, 5.85, 1.62), target: g(13.0, 6.58, 1.55), fov: 30},
  {t: SH.d47c - SH.d47b, pos: g(11.76, 5.83, 1.6), target: g(12.95, 6.5, 1.5), fov: 31},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 1.45)}}}), 0.014);
// ------------------------------------------------------------------ D4-7c (176.45–177.45): the sprint
// Back on 7a's lens: the ram rears up over her; he sprints in from the right across the frame, plants between the
// heavy and her, the plate up.
export const D4_7c = shot(SH.d47c, [
  {t: 0, pos: g(6.34, 4.94, 0.85), target: g(11.95, 2.83, 2.35), fov: 48},
  {t: SH.d48 - SH.d47c, pos: g(6.4, 4.92, 0.86), target: g(11.9, 2.75, 2.6), fov: 48},
], (T) => ({full: 34, tweak: {drone: {anchor: chest('drone', T, 0.5)}, director: {anchor: chest('director', T, 1.1)}}}), 0.012);

// ------------------------------------------------------------------ D4-8 (177.45–179.30): STRIKE, side-on
// Profile from the south (the ram's side is screen right, the slab screen left, the van behind): he is planted with
// the plate up in front of her; the ram comes down from the right onto the plate (177.76): flash, the plate bursts,
// he is thrown left — back into the slab — and the lens eases left with him.
export const D4_8 = shot(SH.d48, [
  {t: 0, pos: g(8.4, 7.2, 1.4), target: g(8.65, 3.1, 1.85), fov: 52},
  {t: M_STRIKE - SH.d48 + 0.12, pos: g(8.38, 7.2, 1.4), target: g(8.45, 3.15, 1.6), fov: 52},
  {t: SH.d49a - SH.d48, pos: g(8.15, 7.15, 1.3), target: g(7.35, 3.3, 1.15), fov: 48},
], (T) => ({full: 34, near: true, tweak: {director: {anchor: chest('director', T, 1.0)}, drone: {anchor: chest('drone', T, 0.5)}}}), 0.01);

// ------------------------------------------------------------------ D4-9a (179.30–180.80): he slides down the slab
// From in front of him (east-south-east, low): the slab behind him, he slides down it; the drone pilot at the right.
export const D4_9a = shot(SH.d49a, [
  {t: 0, pos: g(9.0, 4.6, 1.0), target: g(6.9, 3.35, 0.85), fov: 42},
  {t: SH.d49b - SH.d49a, pos: g(8.9, 4.55, 0.95), target: g(6.85, 3.3, 0.65), fov: 40},
], (T) => ({full: 30, near: true, tweak: {director: {anchor: chest('director', T, 0.8)}, drone: {anchor: chest('drone', T, 0.5)}}}), 0.01);

// ------------------------------------------------------------------ D4-9b (180.80–183.30): the others held
// From beside the van's front, looking south across them: each of them straining toward him (screen right) is
// caught and held by a unit behind.
export const D4_9b = shot(SH.d49b, [
  {t: 0, pos: g(12.6, 1.6, 1.5), target: g(11.0, 7.0, 1.0), fov: 52},
  {t: SH.d410 - SH.d49b, pos: g(12.5, 1.7, 1.45), target: g(11.0, 7.0, 0.95), fov: 50},
], () => ({full: 30, near: true}), 0.01);

// ------------------------------------------------------------------ D4-10 (183.30–186.90): the ring holds — FINAL_HIT
export const D4_10 = shot(SH.d410, [
  {t: 0, pos: {x: 25.0, y: 12.5, z: 22.5}, target: {x: 10.5, y: 0.6, z: 3.0}, fov: 48},
  {t: SH.end - SH.d410, pos: {x: 23.6, y: 11.2, z: 20.4}, target: {x: 10.4, y: 0.6, z: 3.1}, fov: 47},
], () => ({full: 24, maxFull: 8, far: 80}), 0.0);
