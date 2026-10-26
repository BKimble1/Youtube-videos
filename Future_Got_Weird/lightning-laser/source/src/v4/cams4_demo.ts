// V4 beat F (18.79-25.61): the demonstration's one camera path. Every parameter is a C2 quintic spline in film time
// (the pull-back: one C2 progress curve), so each move is eased with matched endpoints (no bounce, no overshoot, no
// alternating zoom), and the start carries
// E's pull-out on exactly (E -> F contract):
//   at 18.79 the camera IS v3/cams3 demoCam(18.79) (demoBase(18.79) zoomed Z_HAND about P0's screen point: position
//   posOf(DEMO0), looking at P0 = axis3(P0_H), P0 on screen at P0_AT, roll ROLL0, f = 1300 * Z_HAND), and
//   d ln f / dt = Z_V0, d2 ln f / dt2 = Z_A0 (= E's last zoom segment), the position moving with demoBase's drift.
// The camera is described by: its position; an anchor point on the beam axis (axis3(h), h in site px) and the screen
// point it sits on (lens shift); the focal length (ln f); and the roll. The roll is held at demoBase's (-3.38 deg)
// while the camera cranes up the channel, as a real camera would, and levels a little in the wide.
import {clamp} from '../dc/math';
import {axis3, Cam3, len3, lookAt, sub3, V3, v3} from '../v2/p3';
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
// The zoom only ever widens (ln f never increases); the camera only drifts between the three moves:
// F1  18.79-19.8   E's pull-out decelerates to rest on a closer view of the rod tip (the zoom about P0 eases out while
//                  the view tilts down onto the tip: rod tip at about (472, 1035), the mast head below it, the cyan
//                  line and warm band leaving the tip up and to the right); then a slow creep while the leader emerges
// F2  20.45-22.2   one crane up the channel with the leader (V4 review W-4: the old tilt-and-widen from the same place
//                  resolved on a tighter replay of the opening's A3 image): the camera rises 50 m and closes in a
//                  little (to 123 m from the point where the guidance ends, 18 deg below it, against the opening's
//                  ~27 deg) as the leader climbs the guided section, the view widening from the same side, so the
//                  tower drops out of frame below and the move resolves near the top of the guided section: the guided
//                  section running down out of frame (the rod tip just below the bottom edge), the point where the bolt
//                  leaves the line at (585, 1000), the branching above it seen from closer, the cloud base lit where the
//                  bolt meets it (top at about y 165); the connection (21.85) lands with the cloud contact in frame
// F3  22.2-23.8    one pull-back, down and back to the scaled wide: farther (about 340 m) and lower (25 m up), more
//                  frontal than the opening (azimuth about -164 deg from the tower against openCam's -146) and on a
//                  longer lens: the whole tower from its base (y about 1389) with the summit station on the laser
//                  terrace (above the caption band), the guided section with the bracket, the bolt to the cloud (top y
//                  about 140); the rod tip ends at (527, 669), where G's house rod tip opens (a rod-to-rod match across
//                  the cut). It eases out of the crane's resolve (still for ~0.2 s, slow through "followed that"),
//                  then runs at an even pace (smooth acceleration, a cruise, a smooth landing, rather than one quintic;
//                  the camera's speed along its path proportional to its distance from the bolt), so its peak speed
//                  stays near the crane's (V4 review F4-2: it was twice the follow's), and it has landed (under 3
//                  px/frame) when the bracket starts on "one hundred" (23.64)
const Ty = (k: Q5[]) => (t: number) => q5(t, k);
export const T_SET = 19.8, T_C0 = 20.45, T_R = 22.2, T_W = 23.8;
const T_END = 25.7;
/** the crane's resolve (F2): seen from 123 m at azimuth -145 deg and 18 deg below the point where the guidance ends
 *  (GUIDED_TOP3), that point on screen at (585, 1000); and the wide (F3) */
const RES = (() => {
  const el = (-18 * Math.PI) / 180, az = (-145 * Math.PI) / 180, D = 123;
  const g = axis3(300);
  return {pos: v3(g.x + D * Math.cos(el) * Math.sin(az), g.y + D * Math.sin(el), g.z + D * Math.cos(el) * Math.cos(az)), h: 300, sx: 585, sy: 1000, f: 2100, roll: 0};
})();
const WIDE = {pos: v3(-95, 25, -330), h: 0, sx: 530, sy: 660, f: 1950, roll: -1.6};
/** the wide's slow drift after the pull-back (per second) */
const WD = {x: 0.3, y: -0.15, z: 0.4, lf: -0.025};
const P_C0 = {x: BASE0.pos.x + DRIFT_F.x * (T_C0 - T_F), y: BASE0.pos.y + DRIFT_F.y * (T_C0 - T_F), z: BASE0.pos.z + DRIFT_F.z * (T_C0 - T_F)};
const LF_C0 = Math.log(4400) - 0.04;
// F1 and the crane (F2): C2 quintic keys up to T_R, where the crane comes to rest
const PX = Ty([[T_F, BASE0.pos.x, DRIFT_F.x, 0], [T_C0, P_C0.x, DRIFT_F.x, 0], [T_R, RES.pos.x, 0, 0]]);
const PY = Ty([[T_F, BASE0.pos.y, DRIFT_F.y, 0], [T_C0, P_C0.y, DRIFT_F.y, 0], [T_R, RES.pos.y, 0, 0]]);
const PZ = Ty([[T_F, BASE0.pos.z, DRIFT_F.z, 0], [T_C0, P_C0.z, DRIFT_F.z, 0], [T_R, RES.pos.z, 0, 0]]);
const H = Ty([[T_F, P0_H, 0, 0], [T_SET, 0, 0, 0], [T_C0, 0, 0, 0], [T_R, RES.h, 0, 0]]);
const SX = Ty([[T_F, P0_SCREEN.x, 0, 0], [T_SET, 490, 0, 0], [T_C0, 490, 0, 0], [T_R, RES.sx, 0, 0]]);
const SY = Ty([[T_F, P0_SCREEN.y, 0, 0], [T_SET, 980, 0, 0], [T_C0, 980, 0, 0], [T_R, RES.sy, 0, 0]]);
const LF = Ty([[T_F, Math.log(F_HAND), Z_V0, Z_A0], [T_SET, Math.log(4400), -0.06, 0], [T_C0, LF_C0, -0.06, 0], [T_R, Math.log(RES.f), 0, 0]]);
// the pull-back (F3): one progress u (0 -> 1, T_R -> T_W) with a smooth acceleration over the first 30%, a cruise
// and a smooth landing over the last 30% (peak speed 1.43x the mean, against a single quintic's 1.88x); the camera
// travels its straight path from RES to WIDE at a speed proportional to its distance from the bolt (lam: even in
// ln distance), so the near start does not rush while the far end crawls; then the wide's slow drift
const PB_A = 0.3, PB_D = 0.3;
const U = Ty((() => {
  const T = T_W - T_R, v = 1 / (T * (1 - (PB_A + PB_D) / 2));
  return [[T_R, 0, 0, 0], [T_R + PB_A * T, (v * PB_A * T) / 2, v, 0], [T_W - PB_D * T, 1 - (v * PB_D * T) / 2, v, 0], [T_W, 1, 0, 0]] as Q5[];
})());
const D_RES = len3(sub3(RES.pos, axis3(300))), D_WIDE = len3(sub3(WIDE.pos, axis3(150)));
const lam = (u: number) => (Math.pow(D_WIDE / D_RES, u) - 1) / (D_WIDE / D_RES - 1);
const mix = (a: number, b: number, u: number) => a + (b - a) * u;
export const fParams = (t: number): FCamP => {
  if (t <= T_R) return {pos: v3(PX(t), PY(t), PZ(t)), h: H(t), sx: SX(t), sy: SY(t), f: Math.exp(LF(t)), roll: HAND.roll};
  const tw = Math.min(t, T_END) - T_W;
  const u = t >= T_W ? 1 : clamp(U(t));
  const l = lam(u);
  // the drift term is WD (t - T_W) u: zero at T_R, and at T_W it hands over the drift's velocity exactly
  const pos = v3(mix(RES.pos.x, WIDE.pos.x, l) + WD.x * tw * u, mix(RES.pos.y, WIDE.pos.y, l) + WD.y * tw * u, mix(RES.pos.z, WIDE.pos.z, l) + WD.z * tw * u);
  return {pos, h: mix(RES.h, WIDE.h, l), sx: mix(RES.sx, WIDE.sx, u), sy: mix(RES.sy, WIDE.sy, u), f: Math.exp(mix(Math.log(RES.f), Math.log(WIDE.f), u) + WD.lf * tw * u), roll: mix(HAND.roll, WIDE.roll, u)};
};
/** F's camera at film time t (t >= 18.79) */
export const fCam = (t: number): Cam3 => camOf(fParams(t));
/** F's zoom relative to the main view's 1300 px focal length (for the haze width law, v3 Demo3_fx DemoHaze) */
export const fZoom = (t: number) => fParams(t).f / BASE0.f;
