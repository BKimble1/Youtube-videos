// Section D3 cameras: physical positions and targets in the world (metres; y absolute unless built with g()), shot-
// local seconds. PURE (no React) so the framing can be checked numerically. Low three-quarter views at eye height on
// the ground (pitch kept shallow; the steep ones are the topple and the formation's wide); the cuts keep the enemy east
// (screen right) unless a shot re-establishes it. Exchange cutting (R3_AUDIT §4): the blind, the pin and the knee each
// cut between the person acting, the machine answering, and the result.
import type {CamKey} from '../../film/stage';
import type {Cam3} from '../../engine';
import {V3, add3, lerp, clamp} from '../../../kit/math';
import {G} from '../D4/motion';
import {SH3, EV3} from './times';
import {D_PLANS, droneD3, SMASH_AT, h2Root} from './machines';
import {crewAt} from './crew';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
const at = (x: number, y: number, z: number): V3 => ({x, y, z});
const lerp3 = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const smoothK = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
export type CamFn = (t: number, T: number) => Cam3;
const d = (a: number, b: number) => b - a;

// ================================================================== X1 THE BLIND
// D3-1: on the rim south of the flare carrier, his right profile: the Director's signal beyond him; the flare struck in
// his hands, heavy 1 coming on, the allied drone darting out across the crater into its face; the throw — the camera
// pans with the flare — the swipe at the drone, the flash in the eye
export const CAM_1: CamKey[] = [
  {t: 0, pos: g(47.3, 0.2, 1.4), target: at(53.5, 1.0, -7.7), fov: 50},
  {t: 1.75, pos: g(47.32, 0.18, 1.4), target: at(54.4, 1.2, -6.9), fov: 48},
  {t: 2.5, pos: g(47.4, 0.12, 1.42), target: at(62.0, 1.6, -5.3), fov: 38},
  {t: d(SH3.d31, SH3.d31b), pos: g(47.42, 0.11, 1.42), target: at(61.8, 1.5, -5.2), fov: 37},
];
// D3-1b: from the rim behind them, low: the three go down the slope at it (the Director first, the breaker and the
// runner crouched behind), the tether operator stepping to her post on the left; the heavy, blinded, swings at the
// whine of the drone and halts
export const CAM_1b: CamKey[] = [
  {t: 0, pos: g(45.9, -7.6, 1.55), target: at(57.0, -0.2, -3.6), fov: 46},
  {t: d(SH3.d31b, SH3.d32), pos: g(46.0, -7.55, 1.55), target: at(58.4, 0.1, -3.4), fov: 45},
];

// ================================================================== X2 THE PIN
// D3-2: south-west of the tether operator at the girder's foot: she and post 3 on the left, the heavy swinging round
// on the right; the clamp, the cable round the post, the reel locking; R3 grabbing the cable beyond the post
export const CAM_2: CamKey[] = [
  {t: 0, pos: at(43.6, 2.35, -7.0), target: at(55.0, 1.4, -8.4), fov: 50},
  {t: 1.2, pos: at(43.65, 2.34, -7.05), target: at(53.0, 1.3, -10.0), fov: 50},
  {t: d(SH3.d32, SH3.d33), pos: at(43.7, 2.33, -7.1), target: at(52.4, 1.2, -10.3), fov: 50},
];

// ================================================================== X3 THE KNEE
// D3-3a: on the south-west slope, side-on to the Director and U8, a little above them (the water main behind them stays
// under their heads): its hammer on his plate, the press; it turns away for the crossing: his plate into its back;
// beyond the main on the right, the breaker under the rear-left knee
export const CAM_3a: CamKey[] = [
  {t: 0, pos: g(52.7, 2.7, 2.0), target: g(54.9, -1.1, 1.0), fov: 42},
  {t: d(SH3.d33, SH3.d33b), pos: g(52.75, 2.65, 2.0), target: g(55.0, -1.0, 1.0), fov: 42},
];
// D3-3b: low on the main's north-east side by R4, looking up the crater along the beam (on the left): the breaker under
// the rear-left knee — the swing, the split; R4's hammer comes down on the beam in the foreground; U8 hooked and down
// beyond the beam; the breaker dives under it
export const CAM_3b: CamKey[] = [
  {t: 0, pos: at(64.7, -0.45, 1.5), target: at(59.0, -1.6, -2.4), fov: 46},
  {t: 0.5, pos: at(64.65, -0.45, 1.45), target: at(59.6, -1.5, -2.4), fov: 46},
  {t: d(SH3.d33b, SH3.d34a), pos: at(64.55, -0.45, 1.4), target: at(59.0, -1.8, -1.8), fov: 47},
];

// ================================================================== X4 THE TOPPLE, the peak
// D3-4a: wide, high on the crater's south-west slope: it goes over onto its left side across the crater's north part,
// the breaker sprinting out from under the water main on the left; the crash; the dust wave
export const CAM_4a: CamKey[] = [
  {t: 0, pos: g(52.0, 3.0, 5.5), target: at(61.4, -0.9, -4.2), fov: 52},
  {t: d(SH3.d34a, SH3.d34b), pos: g(51.8, 3.2, 5.7), target: at(61.0, -1.4, -4.4), fov: 53},
];
// D3-4b: the peak: low on the slope in front of them, their faces — the three on the slope looking at what they did
export const CAM_4b: CamKey[] = [
  {t: 0, pos: g(57.3, -0.9, 1.45), target: g(54.35, -2.95, 1.42), fov: 40},
  {t: d(SH3.d34b, SH3.d35), pos: g(57.25, -0.92, 1.45), target: g(54.35, -2.95, 1.42), fov: 39},
];

// ================================================================== THE ADAPTATION
// D3-5: with the small drone climbing out of the dust over the wreck; at the top, past it down onto the rim (the amber
// line to the tablet)
const ADAPT = D_PLANS.find((p) => p.id === 7605)!;
export const CAM_5: CamFn = (t, T) => {
  const dp = droneD3(ADAPT, T).pos;
  const k = smoothK(t / 2.7);
  const pos = add3(dp, {x: lerp(2.6, 3.6, k), y: lerp(-2.2, 1.4, k), z: lerp(2.6, -1.3, k)});
  const look = lerp3(dp, SMASH_AT, smoothK((t - 1.3) / 1.4) * 0.34);
  return {pos, target: look, fov: 46, roll: 0};
};
// D3-6: high from the south-west, over the Crew's shoulders: the line held behind the barrier splits from the middle
// and bends into the arc round them; the replacements step over the wrecks
export const CAM_6: CamKey[] = [
  {t: 0, pos: at(38.4, 12.0, 14.2), target: at(54.2, 0.4, 0.2), fov: 48},
  {t: d(SH3.d36, SH3.d37a), pos: at(38.1, 12.2, 14.4), target: at(53.6, 0.4, 0.4), fov: 48},
];
// D3-7a: high over her right shoulder down onto the tablet (the sketch, the tap); up and out with the beam to the
// light on the dust
export const CAM_7a: CamKey[] = [
  {t: 0, pos: g(44.85, 0.45, 2.15), target: add3(SMASH_AT, {x: 0.1, y: 0.12, z: 0.0}), fov: 40},
  {t: 0.95, pos: g(44.85, 0.45, 2.15), target: add3(SMASH_AT, {x: 0.25, y: 0.18, z: -0.05}), fov: 40},
  // (R4: the sweep out with the beam ends higher and a little north of her, looking down the beam: the D1 cover slab (the
  // tan plate 2–2.5 m to the right of the old end frame) and the crest's near edge no longer fill the lower and right
  // thirds of the last 0.3 s)
  {t: d(SH3.d37a, SH3.d37b), pos: g(44.4, -0.5, 2.9), target: g(53.6, -0.6, 1.3), fov: 38},
];
// D3-7b: on the north rim of the crater, side-on to the light: the figures on the dust in the beam from frame right
// (her tablet, off frame); the arc comes on out of the dust from the right and walks straight through them
export const CAM_7b: CamKey[] = [
  {t: 0, pos: g(49.7, -5.5, 2.5), target: g(56.6, 2.4, 2.1), fov: 46},
  {t: d(SH3.d37b, SH3.d37c), pos: g(49.8, -5.35, 2.5), target: g(56.2, 2.4, 2.1), fov: 46},
];
// D3-7c: low in front of her, to her right: the drone comes down out of the right into the tablet; she reels, the
// hand cut, and sinks to her knees (the figures' light gone off her face)
export const CAM_7c: CamKey[] = [
  {t: 0, pos: g(47.9, 0.3, 1.35), target: g(46.1, -0.75, 1.55), fov: 42},
  {t: 0.6, pos: g(47.88, 0.28, 1.3), target: g(46.05, -0.8, 1.35), fov: 42},
  {t: d(SH3.d37c, SH3.d38), pos: g(47.85, 0.25, 1.15), target: g(45.95, -0.85, 1.0), fov: 42},
];
// D3-8: low at the girder's foot along the cable: the drones come in under the truss; the cut; she falls back; the
// wing comes over the slack
export const CAM_8: CamKey[] = [
  {t: 0, pos: at(42.5, 1.25, -9.2), target: at(52.0, 1.4, -10.0), fov: 48},
  {t: 1.6, pos: at(42.55, 1.25, -9.2), target: at(51.0, 1.2, -9.9), fov: 48},
  {t: d(SH3.d38, SH3.d39), pos: at(42.4, 1.3, -9.0), target: at(48.0, 0.9, -8.4), fov: 50},
];
// D3-9: from the south-west on the rim: the drone flees toward the lens; struck; it crashes in the foreground; the
// pilot beyond with the dead controller
export const CAM_9: CamKey[] = [
  {t: 0, pos: at(37.0, 1.4, 7.4), target: at(45.0, 2.4, -2.0), fov: 48},
  {t: 1.0, pos: at(36.95, 1.38, 7.45), target: at(43.6, 1.6, -0.4), fov: 48},
  {t: d(SH3.d39, SH3.d310a), pos: at(36.9, 1.35, 7.5), target: at(42.7, 0.3, 1.7), fov: 48},
];

// ================================================================== ESCALATION
// D3-10a (the danger): low on the crater floor between the wreck and the water main, close: heavy 2 comes up to the
// barrier (right) and lifts a leg over heavy 1's wreck (left) — the barrier the Crew won is a step for it
export const CAM_10a: CamKey[] = [
  {t: 0, pos: g(65.9, 2.0, 1.3), target: at(66.6, 0.4, -5.4), fov: 50},
  {t: d(SH3.d310a, SH3.d310b), pos: g(65.7, 2.1, 1.3), target: at(65.8, 0.6, -5.4), fov: 50},
];
// D3-10b (the threatened person): low in front of her on the crest: on her knees with the cut hand, she looks up into
// the launcher coming round; behind her the Director sees it and runs
export const CAM_10b: CamKey[] = [
  {t: 0, pos: g(47.65, -0.15, 0.95), target: g(45.7, -1.1, 1.0), fov: 40},
  {t: d(SH3.d310b, SH3.d310c), pos: g(47.6, -0.13, 0.98), target: g(45.6, -1.25, 1.1), fov: 40},
];
// D3-10c (the defence): behind heavy 2's left shoulder as it walks over the wreck, long: across the crater on the crest
// the Director hauls her up and away west — the launcher's side of it
export const CAM_10c: CamFn = (t, T) => {
  const r = h2Root(T);
  return {pos: {x: r.x + 4.4, y: G(r.x, r.z) + 6.5, z: r.z + 1.2}, target: at(45.0, 1.3, -1.25 + 0.15 * t), fov: 24, roll: 0};
};
// D3-11a: wide from the south-west, clear of the cover slab: they run; the round; the blast on the rim; they are thrown
export const CAM_11a: CamKey[] = [
  {t: 0, pos: g(36.0, 6.0, 3.8), target: at(45.5, 0.8, -2.0), fov: 50},
  {t: d(SH3.d311a, SH3.d311b), pos: g(35.8, 6.1, 3.9), target: at(44.8, 0.8, -1.6), fov: 50},
];
/** R4: the last 0.42 s of D3-11a push in on the breaker (kneeling at the corridor's mouth, the tool lifted across his
 *  body, his head down on the dial): the cut into the gauge insert is on his look, so the dial is his (it is the tool in
 *  his hands). `base` = camPath(CAM_11a, t) from shots.tsx. */
export const push11a = (base: Cam3, t: number, T: number): Cam3 => {
  const k = smoothK((t - (d(SH3.d311a, SH3.d311b) - 0.42)) / 0.42);
  if (k <= 0) return base;
  const c = crewAt('breaker', Math.min(T, SH3.d311b));
  const tool = lerp3(c.pts!.back, c.pts!.front, 0.5);
  const f = {x: tool.x - base.pos.x, y: tool.y - base.pos.y, z: tool.z - base.pos.z}, l = Math.hypot(f.x, f.y, f.z) || 1;
  const dolly = 1.6 * k;
  return {pos: {x: base.pos.x + (f.x / l) * dolly, y: base.pos.y + (f.y / l) * dolly, z: base.pos.z + (f.z / l) * dolly}, target: lerp3(base.target, add3(tool, {x: 0, y: 0.1, z: 0}), k), fov: lerp(base.fov ?? 50, 30, k), roll: 0};
};
// D3-11b: insert — the breaker's gauge (he is down on one knee, the tool lifted across his body): his eyeline down onto
// the dial on the tank under his rear hand, the needle on the red
export const CAM_11b: CamFn = (t, T) => {
  const c = crewAt('breaker', Math.min(T, 146.8)), h = (c.body.heading * Math.PI) / 180;
  const fw = {x: Math.sin(h), z: -Math.cos(h)}, lf = {x: -Math.cos(h), z: -Math.sin(h)};
  // over his eyes: the gauge on the tank under his rear hand, lifted across his body toward his face
  const tgt = lerp3(c.pts!.back, c.pts!.front, -0.06);
  const eye = {x: c.body.pos.x + fw.x * 0.12 + lf.x * 0.05, y: c.body.pos.y + 1.2, z: c.body.pos.z + fw.z * 0.12 + lf.z * 0.05};
  return {pos: lerp3(eye, tgt, 0.25), target: tgt, fov: 34, roll: 0};
};
// D3-11c: insert — low in front of the flare carrier on his hands and knees: he lifts his head, the brow cut; he gets up
export const CAM_11c: CamFn = (t, T) => {
  const c = crewAt('flares', Math.min(T, 147.4)), b = c.body.pos, h = (c.body.heading * Math.PI) / 180;
  const fw = {x: Math.sin(h), z: -Math.cos(h)}, rt = {x: Math.cos(h), z: Math.sin(h)};
  // (crew.tsx: on his hands and knees, the head comes up ≈147.0; kneeling ≈147.3; up ≈147.65)
  const k1 = smoothK((T - 146.95) / 0.35), k2 = smoothK((T - 147.3) / 0.35);
  const hy = lerp(lerp(0.66, 1.02, k1), 1.5, k2), hf = lerp(lerp(0.45, 0.2, k1), 0.08, k2);
  const head = {x: b.x + fw.x * hf, y: b.y + hy, z: b.z + fw.z * hf};
  const pos = {x: b.x + fw.x * 1.8 + rt.x * 0.55, y: b.y + lerp(0.72, 1.15, k1 * 0.6 + k2 * 0.4), z: b.z + fw.z * 1.8 + rt.z * 0.55};
  return {pos, target: head, fov: 34, roll: 0};
};
// D3-11d: low to the south of the Director: he gets up turning toward the danger, the lip cut; a look back at the
// heavy over his left shoulder; he turns and goes (south-west, past the lens' right)
export const CAM_11d: CamFn = (t, T) => {
  const c = crewAt('director', Math.min(T, EV3.end));
  const hd = {x: c.body.pos.x, y: c.body.pos.y + 1.4, z: c.body.pos.z};
  const pos = g(42.55 + 0.06 * t, 1.55, 1.3);
  const look = lerp3(g(42.6, -1.2, 1.3), hd, 0.75);
  return {pos, target: look, fov: 38, roll: 0};
};
// D3-11e: from the south, low among the arc's south units: the Crew fall back west (screen left) among D1's wrecks and
// turn to face east (screen right) at the end
export const CAM_11e: CamKey[] = [
  {t: 0, pos: g(39.5, 11.0, 1.7), target: at(36.8, 1.0, 1.4), fov: 46},
  {t: d(SH3.d311e, SH3.end), pos: g(39.2, 11.1, 1.7), target: at(35.2, 1.0, 1.8), fov: 46},
];
