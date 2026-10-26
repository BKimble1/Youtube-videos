// V3 beat H (28.94-33.5): cameras, the channel's growth and the pulse clock. Pure functions of film time t.
//   H1 28.94-30.74  the match from G's rod tip to the tower's rod tip (V2 R3 reference camera), held, then one
//                   tilt-up/widening that follows the prepared channel as it grows from the tip (29.19-30.89)
//   H2 30.74-32.90  the single cut: low on the summit's flank, well out from the beam's plane (LOW2), the whole
//                   system in one image: the composited telescope (LaserArt) low-left firing up past the tower, the rod
//                   tip and the extended warm channel above it. Packets leave on the four payoff ticks while the camera
//                   only creeps (the exit stays above the caption band); then one nearly straight crane up the beam
//                   with them, onto openCam(t) exactly at 32.9 (eased weight: the velocity matches the opening drift)
//   H3 32.90-33.50  openCam(t) exactly and openSt(t) (the loop clock): the next leader incepts at 32.9 (Open3.tsx
//                   only eases openSt's inception light in over the leader's first 16 m; it is exact again by ~33.2)
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {add3, axis3, basis, Cam3, len3, lerp3, lookAt, mul3, projector, sub3, TIP3, v3, V3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {OPEN0, openCam} from './cams3';
import {B, EV, tau3} from './timeline3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/** a camera at pos with `target` placed at screen point (sx, sy) (V2's lookAtScreen, iterated to convergence) */
export const lookAtScreen = (pos: V3, target: V3, f: number, sx: number, sy: number, roll = 0): Cam3 => {
  let c: Cam3 = {...lookAt(pos, target, f), roll};
  for (let i = 0; i < 12; i++) {
    const p = projector(c)(target);
    c = {...c, yaw: c.yaw - ((sx - p.x) / f) * (180 / Math.PI), pitch: c.pitch + ((sy - p.y) / f) * (180 / Math.PI)};
  }
  return c;
};

// ------------------------------------------------------------------ the prepared channel above the tip
/** the haze's top (site px along the axis) while it builds over the shimmer (29.19-30.89); afterwards the opening's
 *  default (Beam3D: G + 60), so the end hands openSt the same channel */
export const CH_TOP = 360;
export const chTopH = (t: number) => -6 + (CH_TOP + 6) * ss(t, EV.channelExtends, 30.89);

// ------------------------------------------------------------------ H1: the tip, then the tilt up the channel
export const R3_POS = v3(-26, 118, -44);
/** G -> H contract: the tower's rod tip at screen (540, 820), rod pointing straight up (V2 R3) */
export const H1_C0 = lookAtScreen(R3_POS, TIP3, 2600, 540, 820);
/** after the tilt: the tip low in frame (above the caption band), the extended channel above it */
export const H1_C1 = lookAtScreen(R3_POS, axis3(160), 1250, 640, 760);
export const H1_T0 = 29.12, H1_T1 = B.H2;
export const h1Cam = (t: number): Cam3 => {
  const k = sm5(u(t, H1_T0, H1_T1));
  const a = H1_C0, b = H1_C1;
  return {pos: R3_POS, yaw: a.yaw + (b.yaw - a.yaw) * k, pitch: a.pitch + (b.pitch - a.pitch) * k, roll: 0, f: Math.exp(Math.log(a.f) + (Math.log(b.f) - Math.log(a.f)) * k)};
};

// ------------------------------------------------------------------ H2: the whole system from low, then the crane
/** the telescope's scale reference (LaserArt k0 1.4 at this camera's f / exit depth). C3 (Machine3_reveal.tsx) and
 *  H2 both place the telescope with it, so it has one world size in every shot. It is no longer H2's framing. */
export const LOW = {pos: v3(-72, -16, -38), target: v3(-24, 15, 0), f: 600, roll: -4};
/** H2's opening view ("into the SKY"): from low on the summit's flank, well out from the beam's plane, so the beam is
 *  seen nearly side-on instead of end-on: the telescope's exit low-left (above the caption band), the beam rising
 *  up-right past the tower, the rod tip and the whole extended warm channel above it, in one image */
export const LOW2 = {pos: v3(-65, 25, -130), f: 650, tip: {x: 570, y: 620}, roll: -4};
const LOW2_CAM = lookAtScreen(LOW2.pos, TIP3, LOW2.f, LOW2.tip.x, LOW2.tip.y, LOW2.roll);
/** LOW2's view ray at the tip's distance (so the crane can blend toward openCam's own target in 3D) */
const LOW2_TARGET = (() => {
  const {f} = basis({...LOW2_CAM, roll: 0});
  const D = len3(sub3(TIP3, LOW2.pos));
  return add3(LOW2.pos, v3(f.x * D, f.y * D, f.z * D));
})();
/** the crane's control point: midway (a nearly straight rise toward the opening camera, never near the tower) */
export const CRANE_C = v3(-58.6, 57.6, -108.1);
/** the crane's normalised progress w. From the cut a slow creep up the beam (the exit stays above the caption band
 *  for the payoff ticks, 30.84-31.74), then the ride up with the packets, then a smooth stop exactly at 32.9 (zero
 *  velocity relative to openCam's drift). Tabulated from a velocity profile. */
export const CRANE0 = B.H2, CRANE1 = EV.loopInception;
const CREEP = 0.05, RIDE0 = 31.5, RIDE1 = 32.1, STOP0 = 32.25;
const vel = (t: number) => (CREEP * ss(t, B.H2, 31.1) + ss(t, RIDE0, RIDE1)) * (1 - ss(t, STOP0, CRANE1));
const CRANE_N = 600;
const CRANE_TAB = (() => {
  const acc = [0];
  for (let i = 1; i <= CRANE_N; i++) acc.push(acc[i - 1] + vel(CRANE0 + ((i - 0.5) / CRANE_N) * (CRANE1 - CRANE0)));
  return acc.map((a) => a / acc[CRANE_N]);
})();
export const craneW = (t: number) => {
  const x = u(t, CRANE0, CRANE1) * CRANE_N;
  const i = Math.min(CRANE_N - 1, Math.floor(x));
  return CRANE_TAB[i] + (CRANE_TAB[i + 1] - CRANE_TAB[i]) * (x - i);
};
/** openCam's own target point (its view ray at the OPEN0 distance), so the crane can blend toward it in 3D */
const OPEN_D = len3(sub3(OPEN0.target, OPEN0.pos));
const openTarget = (c: Cam3) => {
  const {f} = basis({...c, roll: 0});
  return add3(c.pos, v3(f.x * OPEN_D, f.y * OPEN_D, f.z * OPEN_D));
};
export const h2Cam = (t: number): Cam3 => {
  if (t >= CRANE1) return openCam(t);
  const o = openCam(t);
  const w = craneW(t);
  const pos = add3(add3(mul3(LOW2.pos, (1 - w) * (1 - w)), mul3(CRANE_C, 2 * (1 - w) * w)), mul3(o.pos, w * w));
  // the tilt leads and the zoom lags the rise a little, so the tip's screen travel (from LOW2's 700 to openCam's 1415)
  // is spread over the ride instead of bunching at its end (peak ~30 px/frame); all three reach 1 together
  const wt = w + w * (1 - w), wf = w - 0.5 * w * (1 - w);
  const target = lerp3(LOW2_TARGET, openTarget(o), wt);
  const f = Math.exp(Math.log(LOW2.f) + (Math.log(o.f) - Math.log(LOW2.f)) * wf);
  return {...lookAt(pos, target, f), roll: LOW2.roll + ((o.roll ?? 0) - LOW2.roll) * w};
};
export const endCam = (t: number): Cam3 => (t < B.H2 ? h1Cam(t) : h2Cam(t));

// ------------------------------------------------------------------ the pulse clock (packets on the payoff ticks)
// The packets are V2's steady stream (stream(clk)); H runs its clock fast after the cut so a packet leaves the exit on
// each payoff tick (30.84, 31.14, 31.44, 31.74: one stream gap per 0.3 s), keeps that pace through the crane, then
// eases back to the normal rate and lands on the loop clock (mod one gap) at 32.9, where openSt takes over.
const SPEED = 520, GAP = 230;
const PER = GAP / SPEED; // clock time per gap
const R_FAST = PER / 0.3;
/** stream clock values at which a packet is at the exit (h = -880) */
const exitPhase = (clk: number) => ((((clk + 50) * SPEED - 30) % GAP) + GAP) % GAP; // 0 at an exit
const T_TICK0 = EV.payoffTicks[0];
// clk(t) = C0 + (t - T_TICK0) * R_FAST on [B.H2, T_DEC]; then the rate eases R_FAST -> 1 over [T_DEC, CRANE1]
// (smoothstep, so the extra clock is (R_FAST - 1) * (CRANE1 - T_DEC) / 2); C0 puts an exit on the first tick
const C0 = (() => {
  const c = 0; // any value: shift it by the phase error at the first tick
  return c - exitPhase(c) / SPEED;
})();
const clkAt = (t: number, tDec: number) => {
  if (t < B.H2) return C0 + (B.H2 - T_TICK0) * R_FAST + (t - B.H2); // H1: normal pace (across the cut)
  if (t <= tDec) return C0 + (t - T_TICK0) * R_FAST;
  const d = CRANE1 - tDec;
  const x = clamp((t - tDec) / d);
  // integral of 1 + (R_FAST - 1) * (1 - smoothstep(x)) over [0, x]
  const intS = x * x * x - (x * x * x * x) / 2; // integral of 3x^2 - 2x^3
  return C0 + (tDec - T_TICK0) * R_FAST + d * (x + (R_FAST - 1) * (x - intS));
};
/** the deceleration start that lands the fast clock on the loop clock (mod one gap) at CRANE1 */
const T_DEC = (() => {
  const err = (td: number) => {
    const e = (((clkAt(CRANE1, td) - tau3(CRANE1)) % PER) + PER) % PER;
    return e > PER / 2 ? e - PER : e;
  };
  // bisection on a bracket where err changes sign (d err / d td = (R_FAST - 1) / 2 > 0)
  let a = 31.9, b = 32.6;
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    if (err(a) * err(m) <= 0) b = m;
    else a = m;
  }
  return (a + b) / 2;
})();
export const H_T_DEC = T_DEC;
export const endClk = (t: number) => (t >= CRANE1 ? tau3(t) : clkAt(t, T_DEC));
export const endPulses = (t: number) => stream(endClk(t));
/** exit-window flare on each payoff tick */
export const tickFlare = (t: number) => EV.payoffTicks.reduce((a, k) => a + (t >= k - 0.02 ? Math.exp(-Math.max(0, t - k) / 0.09) : 0), 0);
export const PULSE = {SPEED, GAP, PER, R_FAST, C0, exitPhase};
