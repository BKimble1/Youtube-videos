// V4 A + H: one camera function on the loop clock (tau3), so the end of the film (H2) runs into its first frame (A1)
// with continuous position, direction, focal length and velocity.
//   H2  tau -2.76 .. -1.6  (30.74-31.9) the whole system from low on the summit's flank: the telescope's exit low-left,
//                          the station beside the terrace, the tower, the extended channel above the rod tip; a slow
//                          creep while packets leave on the payoff ticks
//       tau -1.6 .. 0      one eased, arcing push in to the launch (the camera swings round onto the terrace beside the
//                          telescope and comes down to it), decelerating into A1's drift at the seam
//   A1  tau 0 .. CR0       the launch, close: the telescope large low-left, the beam rising up-right past the station
//                          and the tower; a slow rise (no hold)
//   A2  tau CR0 .. CR1     one crane up the beam with the packets onto openCam (V3's opening setup, B's start),
//                          arriving with openCam's own drift velocity (no stall, no snap)
//   A3  tau CR1 ..         openCam(t) exactly (A -> B contract)
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {add3, basis, Cam3, EXIT3, len3, lerp3, lookAt, mul3, sub3, v3, V3} from '../v2/p3';
import {OPEN0, openCam} from '../v3/cams3';
import {lookAtScreen} from '../v3/Open3_end';
import {B, tau3} from '../v3/timeline3';

/** a blendable camera key: position, a point on its view ray at the common distance D_KEY, focal length, roll */
type Key = {pos: V3; tgt: V3; f: number; roll: number};
const D_KEY = len3(sub3(OPEN0.target, OPEN0.pos));
const keyOf = (c: Cam3): Key => {
  const {f} = basis({...c, roll: 0});
  return {pos: c.pos, tgt: add3(c.pos, mul3(f, D_KEY)), f: c.f, roll: c.roll ?? 0};
};
const camOf = (k: Key): Cam3 => ({...lookAt(k.pos, k.tgt, k.f), roll: k.roll});
const shift = (k: Key, d: V3, dt: V3 = d): Key => ({...k, pos: add3(k.pos, d), tgt: add3(k.tgt, dt)});

// ------------------------------------------------------------------ A1: the launch, close
/** A1 at tau = 0: beside the telescope on the terrace (eye ~3.5 m over it), the exit window low-left */
export const A1 = {pos: v3(-49, -16, -3.6), exitAt: {x: 370, y: 1200}, f: 560, roll: 3};
const A1_KEY = keyOf(lookAtScreen(A1.pos, EXIT3, A1.f, A1.exitAt.x, A1.exitAt.y, A1.roll));
/** A1's slow rise along the beam (m/s): the motion the crane grows out of */
const A1_V = v3(0.15, 0.8, -0.15);
const A1_VT = v3(0.4, 1.8, 0);
const a1Key = (tau: number): Key => shift(A1_KEY, mul3(A1_V, tau), mul3(A1_VT, tau));
export const a1Cam = (tau: number) => camOf(a1Key(tau));

// ------------------------------------------------------------------ A2: the crane up the beam onto openCam
export const CR0 = 0.9, CR1 = 2.35;
/** the crane's control point: it rises steeply first (with the packets, up the beam) and swings out to openCam's
 *  side as it nears the tower top */
const CR_C = v3(-57, 40, -50);
/** a normalised progress through [a, b] from a velocity profile vel (cumulative, tabulated; 0 and 1 at the ends) */
const progress = (a: number, b: number, vel: (t: number) => number, n = 400) => {
  const acc = [0];
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + Math.max(0, vel(a + ((i - 0.5) / n) * (b - a))));
  const tab = acc.map((x) => x / acc[n]);
  return (t: number) => {
    const x = clamp((t - a) / (b - a)) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
  };
};
/** the crane accelerates out of A1's drift and eases onto openCam's drift (zero relative velocity at CR1) */
const craneW = progress(CR0, CR1, (t) => ss(t, CR0 + 0.06, 1.45) * (1 - ss(t, 1.8, CR1)));
/** the view's turn (yaw, pitch, roll) leads the rise a little, so the telescope and the station slide down out of
 *  frame before the rise is fast; every component turns one way only (no tilt back) */
const turnW = progress(CR0, CR1 - 0.2, (t) => ss(t, CR0, 1.3) * (1 - ss(t, 1.5, CR1 - 0.2)));
const craneCam = (tau: number, t: number): Cam3 => {
  const a = camOf(a1Key(tau)), o = openCam(t);
  const w = craneW(tau), wv = turnW(tau);
  const pos = add3(add3(mul3(a.pos, (1 - w) * (1 - w)), mul3(CR_C, 2 * (1 - w) * w)), mul3(o.pos, w * w));
  // the lens lengthens with the distance the camera gains (so the tower top grows steadily, no jump at the end)
  const wf = w - 0.2 * w * (1 - w);
  return {
    pos, yaw: a.yaw + (o.yaw - a.yaw) * wv, pitch: a.pitch + (o.pitch - a.pitch) * wv, roll: (a.roll ?? 0) + ((o.roll ?? 0) - (a.roll ?? 0)) * wv,
    f: Math.exp(Math.log(a.f) + (Math.log(o.f) - Math.log(a.f)) * wf),
  };
};

// ------------------------------------------------------------------ H2: the whole system, then the push in to A1
export const H2T0 = B.H2 - 33.5; // tau of the cut (30.74)
/** H2's opening view: low on the summit's flank, out from the beam's plane, so the beam and the channel above the tip
 *  are seen side-on while the telescope's exit stays low-left */
export const H2 = {pos: v3(-56, -4, -75), exitAt: {x: 420, y: 1480}, f: 820, roll: -3};
const H2_KEY = keyOf(lookAtScreen(H2.pos, EXIT3, H2.f, H2.exitAt.x, H2.exitAt.y, H2.roll));
const H2_V = v3(0.6, -0.25, 2.2); // the creep (m/s): toward the launch
const h2Key = (tau: number): Key => shift(H2_KEY, mul3(H2_V, tau - H2T0));
/** the push's control point: the camera swings round the telescope onto the terrace (it never passes through the
 *  station or the rock) */
const PU_C = v3(-60, -10, -22);
const PU0 = -1.55;
const pushW = progress(H2T0, 0, (t) => 0.035 * (1 - ss(t, H2T0 + 0.3, PU0)) + ss(t, PU0, -0.8) * (1 - ss(t, -0.75, 0)));
const pushCam = (tau: number): Cam3 => {
  const h = h2Key(tau), a = a1Key(tau);
  const w = pushW(tau);
  const pos = add3(add3(mul3(h.pos, (1 - w) * (1 - w)), mul3(PU_C, 2 * (1 - w) * w)), mul3(a.pos, w * w));
  const wf = w * w * (3 - 2 * w);
  return camOf({pos, tgt: lerp3(h.tgt, a.tgt, w), f: Math.exp(Math.log(h.f) + (Math.log(a.f) - Math.log(h.f)) * wf), roll: h.roll + (a.roll - h.roll) * w});
};

/** the loop camera: H2 (from the cut) through the seam, A1, the crane, then openCam (A3, B's start) */
export const loopCam = (t: number): Cam3 => {
  const tau = tau3(t);
  if (tau < 0) return pushCam(tau);
  if (tau < CR0) return a1Cam(tau);
  if (tau < CR1) return craneCam(tau, t);
  return openCam(t);
};
