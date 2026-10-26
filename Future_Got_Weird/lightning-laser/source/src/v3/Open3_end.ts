// V3 beat H (28.94-33.5): cameras, the channel's growth and the pulse clock. Pure functions of film time t.
//   H1 28.94-30.74  the match from G's rod tip to the tower's rod tip (V2 R3 reference camera), held, then one
//                   tilt-up/widening that follows the prepared channel as it grows from the tip (29.19-30.89)
//   H2 30.74-32.90  the single cut: low beside the telescope (composited LaserArt) firing up past the tower; packets
//                   leave on the payoff ticks; then one continuous crane up the beam with them, arriving exactly on
//                   openCam(t) at 32.9 (eased weight, so the velocity matches the opening drift)
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

// ------------------------------------------------------------------ H2: low beside the telescope, then the crane
/** the low view: just behind and beside the telescope, looking up the beam past the tower */
export const LOW = {pos: v3(-72, -16, -38), target: v3(-24, 15, 0), f: 600, roll: -4};
/** the crane's control point (quadratic path from LOW to the opening camera): it rises beside the beam, the tower
 *  passing on the right, then draws back and settles onto the opening camera */
export const CRANE_C = v3(-48, 39, -2);
/** a slight settle in the low view before the crane (no stop: it eases into the crane) */
const lowAt = (t: number) => {
  const k = sm5(u(t, B.H2, 31.3));
  return {pos: lerp3(LOW.pos, add3(LOW.pos, v3(0.3, 0.4, -0.5)), k), target: lerp3(LOW.target, add3(LOW.target, v3(0.2, 1.2, 0)), k)};
};
/** the crane's normalised progress: a smooth ramp up to a cruise that rides with the packets, then a smooth stop
 *  exactly at 32.9 (zero velocity relative to openCam's drift) */
export const CRANE0 = 31.1, CRANE1 = EV.loopInception;
const RAMP_UP = 0.32, RAMP_DN = 0.42; // fractions of the crane
const vel = (x: number) => ss(x, 0, RAMP_UP) * ss(1 - x, 0, RAMP_DN);
const CRANE_TAB = (() => {
  const N = 600;
  const acc = [0];
  for (let i = 1; i <= N; i++) acc.push(acc[i - 1] + (vel((i - 0.5) / N) / N));
  return acc.map((a) => a / acc[N]);
})();
export const craneW = (t: number) => {
  const x = u(t, CRANE0, CRANE1) * 600;
  const i = Math.min(599, Math.floor(x));
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
  const lo = lowAt(t);
  const w = craneW(t);
  const pos = add3(add3(mul3(lo.pos, (1 - w) * (1 - w)), mul3(CRANE_C, 2 * (1 - w) * w)), mul3(o.pos, w * w));
  const target = lerp3(lo.target, openTarget(o), w);
  const f = Math.exp(Math.log(LOW.f) + (Math.log(o.f) - Math.log(LOW.f)) * w);
  return {...lookAt(pos, target, f), roll: LOW.roll + ((o.roll ?? 0) - LOW.roll) * w};
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
