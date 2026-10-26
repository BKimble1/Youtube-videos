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
import {add3, axis3, Cam3, lerp3, lerpCam, lookAt, v3, V3} from '../v2/p3';
import {beamOnScreen} from './view3';
import {tau3} from './timeline3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ------------------------------------------------------------------ A / H: the opening setup
export const OPEN0 = {pos: v3(-52, 90, -86), target: v3(7, 158, 0), f: 1050, roll: -4}; // frame 0 (and the loop end)
export const OPEN1 = {pos: v3(-56, 88, -93), target: v3(6, 170, 0), f: 880, roll: -4}; // after the reveal (A hold)
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
export const DEMO0 = {pos: v3(-62, 84, -112), target: v3(5, 158, 0), f: 860, roll: -3}; // main view (19.35-23.3)
export const DEMO1 = {pos: v3(-70, 80, -140), target: v3(4, 160, 0), f: 760, roll: -3}; // after the widening (24.3-)
export const demoBase = (t: number): Cam3 => {
  const c = (o: typeof DEMO0, dt: number) => ({...lookAt(add3(o.pos, v3(0.4 * dt, -0.2 * dt, 0.3 * dt)), o.target, o.f), roll: o.roll});
  const dt = t - 18.79;
  const k = sm5(u(t, 23.3, 24.3));
  return k > 0 ? lerpCam(c(DEMO0, dt), c(DEMO1, dt), k) : c(DEMO0, dt);
};
/** the channel point the molecular views magnify (about 20 m above the rod tip, on the guided section) */
export const P0_H = 120;
/** F's camera: demoBase zoomed about P0's screen point by Z (E's pull-out hands over at Z = Z_HAND at 18.79; F
 *  finishes the zoom-out to the main view by 19.35) */
export const Z_HAND = 14;
export const demoZoom = (t: number) => {
  if (t >= 19.35) return 1;
  const k = sm5(u(t, 18.79, 19.35));
  return Math.exp(Math.log(Z_HAND) * (1 - k));
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
