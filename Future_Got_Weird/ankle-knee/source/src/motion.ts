// Motion helpers: splines through keys (velocity-continuous), footfall plans (stance and swing arcs), and the
// solver that turns hip positions and foot targets into Wyatt's joint angles.
import {clamp, ss5, lerp} from './lib';
import {DIMW, Leg, ikLeg} from './art/wyatt';
import {V} from './dc/math';

/** Catmull-Rom through [t, v] keys (clamped at the ends); velocity is continuous at every key */
export const spline = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t1, p1] = keys[i], [t2, p2] = keys[i + 1];
  const [t0, p0] = i > 0 ? keys[i - 1] : [t1 - (t2 - t1), p1];
  const [t3, p3] = i + 2 < n ? keys[i + 2] : [t2 + (t2 - t1), p2];
  const m1 = ((p2 - p0) / (t2 - t0)) * (t2 - t1);
  const m2 = ((p3 - p1) / (t3 - t1)) * (t2 - t1);
  const u = (t - t1) / (t2 - t1);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
};
export const splineV = (t: number, keys: [number, V][]): V => ({x: spline(t, keys.map(([k, v]) => [k, v.x])), y: spline(t, keys.map(([k, v]) => [k, v.y]))});

/** one foot's plan: planted positions and the swings between them */
export type Plant = {x: number; t1: number}; // lands at x at time t1 (and stays until the next swing starts)
export type Swing = {t0: number; t1: number; x0: number; x1: number; h: number};
/** ankle target and foot pitch for a foot that swings between plants; `lift` (deg) toes-down during swing */
export const footOnPlan = (t: number, sw: Swing[], x0: number, ankH = DIMW.ankH): {p: V; u: number; flat: number} => {
  let x = x0;
  for (const s of sw) {
    if (t < s.t0) return {p: {x: s.x0, y: -ankH}, u: 0, flat: 1};
    if (t <= s.t1) {
      const u = (t - s.t0) / (s.t1 - s.t0);
      const e = ss5(u, 0, 1);
      // the foot rises early (toe-off) and comes down flat
      const lift = Math.sin(Math.PI * Math.pow(u, 0.8)) * s.h;
      return {p: {x: lerp(s.x0, s.x1, e), y: -ankH - lift}, u, flat: 0};
    }
    x = s.x1;
  }
  return {p: {x, y: -ankH}, u: 1, flat: 1};
};
/** a leg reaching for an ankle target from the hip (prosthetic and biological legs share the lengths) */
export const reach = (H: V, T: V, footPitch: number): Leg => {
  const {hip, knee} = ikLeg(H, T);
  // foot pitch is in world terms (90 = flat, toes forward); convert to the rig's ankle angle
  const sa = hip - knee;
  return {hip, knee, ank: sa + 90 - footPitch};
};
/** the lowest the hip may sit so that a planted ankle is reachable (keeps the stance leg from floating) */
export const hipFloor = (Hx: number, ank: V, slack = 0.4) => {
  const L = DIMW.thigh + DIMW.shin - slack;
  const dx = Hx - ank.x;
  return ank.y - Math.sqrt(Math.max(0, L * L - dx * dx));
};
export const clampHip = (Hy: number, Hx: number, anks: V[]) => Math.max(Hy, ...anks.map((a) => hipFloor(Hx, a)));
export {clamp};
