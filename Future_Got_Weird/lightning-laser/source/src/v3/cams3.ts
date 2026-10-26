// V3 camera contract: the cameras that several beats share. Changing one of these moves a hand-off, so beats only
// read them.
//   openCam(t)   A (0-4.31) and the last seconds of H: the one opening setup. Frame 0 and the end of the film use the
//                same function on the loop clock (tau3), so the seam is continuous: a slow constant drift runs straight
//                across it. A has one motivated move: a slow pull-back/tilt-up (0.25-2.0 s) that reveals the leader
//                reaching the cloud at the connection (1.75 s); then it holds (drift only).
//   demoCam(t)   F (18.79-25.61): the main demonstration view, the same side and direction as the opening (same
//                geography), slightly wider; one controlled widening at the distance reveal (23.3-24.3 s).
//   P0_H         the channel point (site px along the beam axis) that the molecular views are magnified from: E's
//                pull-out ends on it (it keeps its screen position and direction), and F opens zoomed into it.
//   MICRO_ANG    the on-screen direction of the channel (degrees clockwise from straight up) in demoCam at P0_H. The
//                molecular views (B, D, E) draw their channel/leader direction at this angle so the micro and macro
//                views agree; C3's push into the packet ends with the beam at this angle too.
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {add3, axis3, Cam3, lerp3, lerpCam, lookAt, projector, TIP3, v3, V3} from '../v2/p3';
import {beamOnScreen} from './view3';
import {tau3} from './timeline3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ------------------------------------------------------------------ A / H: the opening setup
export const OPEN0 = {pos: v3(-52, 90, -86), target: v3(9, 165, 0), f: 1500, roll: -4}; // frame 0 (and the loop end)
export const OPEN1 = {pos: v3(-55, 89, -91), target: v3(9, 169, 0), f: 1300, roll: -4}; // after the reveal (A hold)
const DRIFT = v3(0.5, -0.25, 0.4); // m/s, constant, runs across the seam
const at = (c: {pos: V3; target: V3; f: number; roll: number}, tau: number): Cam3 => ({
  ...lookAt(add3(c.pos, v3(DRIFT.x * tau, DRIFT.y * tau, DRIFT.z * tau)), add3(c.target, v3(0.3 * tau, 0.2 * tau, 0)), c.f),
  roll: c.roll,
});
/** the opening camera on the loop clock; for t in the last seconds (tau < 0) it is OPEN0 drifting toward frame 0 */
export const openCam = (t: number): Cam3 => {
  const tau = tau3(t);
  const c0 = at(OPEN0, tau);
  if (tau <= 0.25) return c0;
  const k = sm5(u(tau, 0.25, 2.0));
  return lerpCam(c0, at(OPEN1, tau), k);
};

// ------------------------------------------------------------------ F: the main demonstration view
/** the channel point the molecular views magnify (about 20 m above the rod tip, on the guided section) */
export const P0_H = 120;
const P0_3 = axis3(P0_H);
/** F always looks at P0 with the channel at this screen angle, and until the widening (23.3) holds P0 on this screen
 *  point: the values the molecular views (B, D, E) and C's push were built on, so retuning F's framing never moves a
 *  hand-off */
const P0_AT = {x: 553.7417, y: 1029.2025, ang: 14.9125};
/** a demonstration framing: the camera seen from P0 (distance D m, azimuth az and elevation el in degrees; the
 *  opening camera is at about az -146, el -27.5, D 123) and the focal length */
type DemoKey = {D: number; az: number; el: number; f: number};
/** the main view (19.6-23.3): the opening's side and direction, a little farther back; rod tip, the guided section
 *  and the bolt to the cloud base all in the upper two thirds of the frame */
export const DEMO0: DemoKey = {D: 135, az: -148, el: -25, f: 1300};
/** after the widening (24.3-): dollied straight back at the same height (el -25 -> -22 keeps the camera about 86 m up)
 *  and only a little, so the measured segment stays large (about 10% shorter on screen) while the frame gains the
 *  storm above the bolt top; held about the rod tip (demoBase), so the tower's concrete deck only reaches the bottom
 *  edge (y > 1800), below the caption band */
export const DEMO1: DemoKey = {D: 155, az: -148, el: -22, f: 1300};
const DRIFT_F = v3(0.4, -0.2, 0.3); // m/s, a slow constant drift (P0 stays put; the tower parallaxes a little)
const posOf = (k: DemoKey) => {
  const a = (k.az * Math.PI) / 180, e = (k.el * Math.PI) / 180;
  return add3(P0_3, v3(k.D * Math.cos(e) * Math.sin(a), k.D * Math.sin(e), k.D * Math.cos(e) * Math.cos(a)));
};
const camAt = (pos: V3, f: number, roll: number): Cam3 => ({...lookAt(pos, P0_3, f), roll, cx: P0_AT.x, cy: P0_AT.y});
/** the roll that puts the channel at P0_AT.ang (a few Newton steps; deterministic) */
const rollFor = (pos: V3, f: number) => {
  const A = (r: number) => beamOnScreen(camAt(pos, f, r), P0_H).ang;
  let r = -3;
  for (let i = 0; i < 8; i++) r -= (A(r) - P0_AT.ang) / ((A(r + 0.01) - A(r - 0.01)) / 0.02);
  return r;
};
const ROLL0 = rollFor(posOf(DEMO0), DEMO0.f), ROLL1 = rollFor(posOf(DEMO1), DEMO1.f);
/** F's base camera: DEMO0 with the drift; one controlled widening to DEMO1 (sm5, 23.3-24.3) interpolated in the
 *  framing parameters and held about the rod tip: a lens shift keeps the tip exactly where DEMO0 has it, so the
 *  measured segment's foot (and the bracket's near tick) stays put while the segment's top and the bolt settle a little
 *  toward it and the extra field opens above */
export const demoBase = (t: number): Cam3 => {
  const dt = t - 18.79;
  const drift = v3(DRIFT_F.x * dt, DRIFT_F.y * dt, DRIFT_F.z * dt);
  const k = sm5(u(t, 23.3, 24.3));
  const D = Math.exp(Math.log(DEMO0.D) + (Math.log(DEMO1.D) - Math.log(DEMO0.D)) * k);
  const f = Math.exp(Math.log(DEMO0.f) + (Math.log(DEMO1.f) - Math.log(DEMO0.f)) * k);
  const key = {D, az: DEMO0.az + (DEMO1.az - DEMO0.az) * k, el: DEMO0.el + (DEMO1.el - DEMO0.el) * k, f};
  const cam = camAt(add3(posOf(key), drift), f, ROLL0 + (ROLL1 - ROLL0) * k);
  if (k <= 0) return cam;
  const a = projector(camAt(add3(posOf(DEMO0), drift), DEMO0.f, ROLL0))(TIP3), b = projector(cam)(TIP3);
  return {...cam, cx: P0_AT.x + (a.x - b.x), cy: P0_AT.y + (a.y - b.y)};
};
/** F's zoom-out from the channel close-up (Z_HAND -> 1 about P0's screen point). It continues E's pull-out as one
 *  move: E's pull-out toward the sky (Channel3.tsx ZK, from 17.85) speeds up through the molecular view and reaches
 *  Z_HAND at 18.79 with log-velocity Z_V0 and log-acceleration Z_A0; F takes both over (a quintic in ln Z), peaks at
 *  about -4.7/s near 19.09 (the rod tip rises into frame) and decelerates to rest by Z_END (Z is within 2% of 1 when
 *  the leader incepts at the rod tip, 19.55). One move, no stall before the seam and no snap after it. */
export const Z_HAND = 14;
export const Z_V0 = -3.2; // d ln Z / dt at 18.79 (= the end slope of E's last ZK key)
const Z_A0 = -5.53; // d2 ln Z / dt2 at 18.79 (what E's last Hermite segment, 17.85-18.79 over ln 1.2, gives with that slope)
export const Z_END = 19.65;
export const demoZoom = (t: number) => {
  if (t >= Z_END) return 1;
  if (t <= 18.79) return Z_HAND;
  const T = Z_END - 18.79, x = (t - 18.79) / T, x2 = x * x, x3 = x2 * x, x4 = x3 * x, x5 = x4 * x;
  const h0 = 1 - 10 * x3 + 15 * x4 - 6 * x5, h1 = x - 6 * x3 + 8 * x4 - 3 * x5, h2 = 0.5 * x2 - 1.5 * x3 + 1.5 * x4 - 0.5 * x5;
  return Math.exp(h0 * Math.log(Z_HAND) + h1 * Z_V0 * T + h2 * Z_A0 * T * T);
};
export const demoCam = (t: number, Z = demoZoom(t)): Cam3 => {
  const base = demoBase(t);
  if (Z === 1) return base;
  const p = beamOnScreen(base, P0_H);
  const cx = base.cx ?? 540, cy = base.cy ?? 960;
  return {...base, f: base.f * Z, cx: p.x - Z * (p.x - cx), cy: p.y - Z * (p.y - cy)};
};
/** P0's screen point and the channel's screen angle in F's main view at the hand-off */
export const P0_SCREEN = beamOnScreen(demoBase(18.79), P0_H);
export const MICRO_ANG = P0_SCREEN.ang;
export {axis3, lerp3};
