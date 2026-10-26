// V4 beat F (18.79-25.61): the demonstration's one camera path. Every parameter is a C2 quintic spline in film time,
// so each move is eased with matched endpoints (no bounce, no overshoot, no alternating zoom), and the start carries
// E's pull-out on exactly (E -> F contract):
//   at 18.79 the camera IS v3/cams3 demoCam(18.79) (demoBase(18.79) zoomed Z_HAND about P0's screen point: position
//   posOf(DEMO0), looking at P0 = axis3(P0_H), P0 on screen at P0_AT, roll ROLL0, f = 1300 * Z_HAND), and
//   d ln f / dt = Z_V0, d2 ln f / dt2 = Z_A0 (= E's last zoom segment), the position moving with demoBase's drift.
// The camera is described by: its position; an anchor point on the beam axis (axis3(h), h in site px) and the screen
// point it sits on (lens shift); the focal length (ln f); and the roll. The roll is held at demoBase's (-3.38 deg)
// while the camera tilts up the channel, as a real camera would, and levels a little in the wide.
import {axis3, Cam3, lookAt, V3, v3} from '../v2/p3';
import {demoBase, P0_H, P0_SCREEN, Z_HAND, Z_V0} from '../v3/cams3';

// ------------------------------------------------------------------ C2 quintic splines
/** a key: time, value, first and second derivative */
export type Q5 = [number, number, number, number];
/** C2 piecewise quintic Hermite through the keys; before the first key a 2nd-order Taylor extrapolation, after the
 *  last key a linear one (its velocity) */
export const q5 = (t: number, keys: Q5[]) => {
  const [ta, va, da, aa] = keys[0];
  if (t <= ta) return va + da * (t - ta) + 0.5 * aa * (t - ta) * (t - ta);
  for (let i = 0; i + 1 < keys.length; i++) {
    const [t0, p0, v0, a0] = keys[i], [t1, p1, v1, a1] = keys[i + 1];
    if (t > t1) continue;
    const T = t1 - t0, x = (t - t0) / T, x2 = x * x, x3 = x2 * x, x4 = x3 * x, x5 = x4 * x;
    const h00 = 1 - 10 * x3 + 15 * x4 - 6 * x5, h10 = x - 6 * x3 + 8 * x4 - 3 * x5, h20 = 0.5 * x2 - 1.5 * x3 + 1.5 * x4 - 0.5 * x5;
    const h01 = 10 * x3 - 15 * x4 + 6 * x5, h11 = -4 * x3 + 7 * x4 - 3 * x5, h21 = 0.5 * x3 - x4 + 0.5 * x5;
    return h00 * p0 + h10 * T * v0 + h20 * T * T * a0 + h01 * p1 + h11 * T * v1 + h21 * T * T * a1;
  }
  const [tl, vl, dl] = keys[keys.length - 1];
  return vl + dl * (t - tl);
};

// ------------------------------------------------------------------ the hand-off (E -> F)
export const T_F = 18.79;
/** demoCam(18.79): demoBase(18.79) with f * Z_HAND (P0 sits on the optical centre P0_AT, so the zoom about it is
 *  only the focal length) */
const BASE0 = demoBase(T_F);
export const F_HAND = BASE0.f * Z_HAND;
/** E's last zoom segment's log-acceleration at the hand-off (v3/cams3 Z_A0, not exported there) */
export const Z_A0 = -5.53;
/** demoBase's drift (m/s): E's camera position is moving at this velocity at the hand-off */
const DRIFT_F = v3(0.4, -0.2, 0.3);

export type FCamP = {pos: V3; h: number; sx: number; sy: number; f: number; roll: number};
/** the camera for a parameter set: look at the anchor axis3(h) from pos, the anchor on screen at (sx, sy) */
export const camOf = (p: FCamP): Cam3 => ({...lookAt(p.pos, axis3(p.h), p.f), roll: p.roll, cx: p.sx, cy: p.sy});
/** the parameters at the hand-off: camOf(HAND) is demoCam(18.79) */
export const HAND: FCamP = {pos: BASE0.pos, h: P0_H, sx: P0_SCREEN.x, sy: P0_SCREEN.y, f: F_HAND, roll: BASE0.roll ?? 0};

// ------------------------------------------------------------------ the path
// The zoom only ever widens (ln f never increases), the camera only drifts between the three moves:
// F1  18.79-19.8   E's pull-out decelerates to rest on a closer view of the rod tip (the zoom about P0 eases out while
//                  the view tilts down onto the tip: rod tip at about (472, 1035), the mast head below it, the cyan
//                  line and warm band leaving the tip up and to the right); then a slow creep while the leader emerges
// F2  20.45-22.1   one move up the channel with the leader's tip (a tilt up and a widening from the same place; the
//                  leader's tip stays in the upper third), settling on the whole bolt: rod tip at about (383, 1466),
//                  the guided section's top at (600, 760), the bolt meeting the cloud at about (690, 200)
// F3  23.0-24.05   one pull-back, farther (about 340 m) and lower (25 m up), more frontal than the opening (azimuth
//                  about -164 deg from the tower against openCam's -146) and on a longer lens: the whole tower from
//                  its base (y about 1389) with the summit station on the laser terrace (y 1465-1531, above the
//                  caption band), the guided section with the bracket, the bolt to the cloud (top y about 143); the
//                  rod tip ends at (527, 669), where G's house rod tip opens (a rod-to-rod match across the cut)
const Ty = (k: Q5[]) => (t: number) => q5(t, k);
const PX = Ty([[T_F, BASE0.pos.x, DRIFT_F.x, 0], [23.0, BASE0.pos.x + DRIFT_F.x * 4.21, DRIFT_F.x, 0], [24.05, -95, 0.3, 0], [25.7, -95 + 0.3 * 1.65, 0.3, 0]]);
const PY = Ty([[T_F, BASE0.pos.y, DRIFT_F.y, 0], [23.0, BASE0.pos.y + DRIFT_F.y * 4.21, DRIFT_F.y, 0], [24.05, 25, -0.15, 0], [25.7, 25 - 0.15 * 1.65, -0.15, 0]]);
const PZ = Ty([[T_F, BASE0.pos.z, DRIFT_F.z, 0], [23.0, BASE0.pos.z + DRIFT_F.z * 4.21, DRIFT_F.z, 0], [24.05, -330, 0.4, 0], [25.7, -330 + 0.4 * 1.65, 0.4, 0]]);
const H = Ty([[T_F, P0_H, 0, 0], [19.8, 0, 0, 0], [20.45, 0, 0, 0], [22.1, 300, 0, 0], [23.0, 300, 0, 0], [24.05, 0, 0, 0], [25.7, 0, 0, 0]]);
const SX = Ty([[T_F, P0_SCREEN.x, 0, 0], [19.8, 490, 0, 0], [20.45, 490, 0, 0], [22.1, 600, 0, 0], [23.0, 600, 0, 0], [24.05, 530, 0, 0], [25.7, 530, 0, 0]]);
const SY = Ty([[T_F, P0_SCREEN.y, 0, 0], [19.8, 980, 0, 0], [20.45, 980, 0, 0], [22.1, 760, 0, 0], [23.0, 760, 0, 0], [24.05, 660, 0, 0], [25.7, 660, 0, 0]]);
const LF = Ty([
  [T_F, Math.log(F_HAND), Z_V0, Z_A0],
  [19.8, Math.log(4400), -0.06, 0],
  [20.45, Math.log(4400) - 0.04, -0.06, 0],
  [22.1, Math.log(2250), -0.03, 0],
  [23.0, Math.log(2250) - 0.027, -0.03, 0],
  [24.05, Math.log(1950), -0.025, 0],
  [25.7, Math.log(1950) - 0.041, -0.025, 0],
]);
const ROLL = Ty([[T_F, HAND.roll, 0, 0], [23.0, HAND.roll, 0, 0], [24.05, -1.6, 0, 0], [25.7, -1.6, 0, 0]]);
export const fParams = (t: number): FCamP => ({pos: v3(PX(t), PY(t), PZ(t)), h: H(t), sx: SX(t), sy: SY(t), f: Math.exp(LF(t)), roll: ROLL(t)});
/** F's camera at film time t (t >= 18.79) */
export const fCam = (t: number): Cam3 => camOf(fParams(t));
/** F's zoom relative to the main view's 1300 px focal length (for the haze width law, v3 Demo3_fx DemoHaze) */
export const fZoom = (t: number) => Math.exp(LF(t)) / BASE0.f;
