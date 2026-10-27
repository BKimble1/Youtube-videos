// Leg dynamics. A dead spider's legs are passive: air pressure pushes them open, and when it is let out the flexor
// muscles' elastic pull folds them shut. Each leg follows its command (0 curled .. 1 open) as a damped spring, so the
// legs snap open with a small overshoot and clamp with a firm settle instead of easing like a dial. Integrated once at
// a fixed step from t0 and looked up by time: the same frame always gives the same pose.
import {clamp} from '../lib';

export type SpringParams = {open: [number, number]; close: [number, number]}; // [frequency Hz, damping ratio]
export const AIR: SpringParams = {open: [3.1, 0.5], close: [3.4, 0.62]};

export const springTrack = (cmd: (t: number) => number, p: SpringParams, t0: number, t1: number, k = 1, dt = 1 / 960) => {
  const n = Math.ceil((t1 - t0) / dt) + 2;
  const xs = new Float64Array(n);
  let x = cmd(t0), v = 0;
  for (let i = 0; i < n; i++) {
    xs[i] = x;
    const t = t0 + i * dt;
    const c = cmd(t);
    const [f, z] = c >= x ? p.open : p.close;
    const w = 2 * Math.PI * f * k;
    v += (w * w * (c - x) - 2 * z * w * v) * dt;
    x += v * dt;
  }
  return (t: number) => {
    const u = clamp((t - t0) / dt, 0, n - 1.001);
    const i = Math.floor(u);
    return xs[i] + (xs[i + 1] - xs[i]) * (u - i);
  };
};

/** per-leg arrival lag (s) and stiffness factor: the shared pressure reaches the eight legs a few frames apart */
export const LAG2 = [0.0, 0.025, 0.045, 0.02, 0.035, 0.01, 0.055, 0.03];
export const STIFF = [1.0, 0.96, 1.04, 0.93, 1.02, 0.98, 0.95, 1.05];

/** eight spring-driven legs following one command */
export const legTracks = (cmd: (t: number) => number, p: SpringParams, t0: number, t1: number) => {
  const tr = LAG2.map((l, i) => springTrack((t) => cmd(t - l), p, t0, t1, STIFF[i]));
  return (t: number) => tr.map((f) => clamp(f(t), -0.04, 1.1));
};
