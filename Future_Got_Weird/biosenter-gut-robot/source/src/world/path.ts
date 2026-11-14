// The gut's centreline: one planar curve (z = 0) in world units (robot body radius = 1). World axes: x right, y DOWN
// the screen in the top-down view, z toward the open (cut-away) side. Arc length s grows in the robot's direction of
// travel (+y). Straight for the opening crawl (S7/S1/S2), then a gentle bend to the robot's right where the S3 snake
// bend happens, then straight again; the tool close-up (S5) uses a later straight stretch.
import {V3} from '../core/three';

/** curvature (1/units) as a function of arc length: a smooth S-free bend toward +x, eased in and out */
const BEND_S0 = 13.0, BEND_S1 = 21.5, BEND_K = 0.17;
const kappa = (s: number) => {
  if (s <= BEND_S0 || s >= BEND_S1) return 0;
  const u = (s - BEND_S0) / (BEND_S1 - BEND_S0);
  return BEND_K * Math.sin(Math.PI * u) ** 2 * (u < 0.62 ? 1 : 1 - 2.4 * (u - 0.62) / 0.38);
};
// integrate the heading numerically once (a table at 0.05 resolution from s = -80 to 120)
const DS = 0.05, S_MIN = -80, S_MAX = 120;
const N_T = Math.round((S_MAX - S_MIN) / DS) + 1;
const TX = new Float64Array(N_T), TY = new Float64Array(N_T), TH = new Float64Array(N_T);
(() => {
  let x = 0, y = S_MIN, th = 0; // heading th = 0 means travelling +y; positive th turns toward +x
  for (let i = 0; i < N_T; i++) {
    TX[i] = x; TY[i] = y; TH[i] = th;
    const k = kappa(S_MIN + (i + 0.5) * DS);
    const mid = th + (k * DS) / 2;
    x += Math.sin(mid) * DS;
    y += Math.cos(mid) * DS;
    th += k * DS;
  }
})();
const idx = (s: number) => {
  const f = (Math.min(S_MAX, Math.max(S_MIN, s)) - S_MIN) / DS;
  const i = Math.min(N_T - 2, Math.floor(f));
  return {i, u: f - i};
};
/** the centreline point at arc length s */
export const C3 = (s: number): V3 => {
  const {i, u} = idx(s);
  return [TX[i] + (TX[i + 1] - TX[i]) * u, TY[i] + (TY[i + 1] - TY[i]) * u, 0];
};
/** heading angle (rad): 0 = +y */
export const heading = (s: number) => {
  const {i, u} = idx(s);
  return TH[i] + (TH[i + 1] - TH[i]) * u;
};
/** unit tangent (direction of travel) */
export const T3 = (s: number): V3 => {
  const h = heading(s);
  return [Math.sin(h), Math.cos(h), 0];
};
/** unit in-plane normal (screen-right, +x, in the top-down view while heading +y) */
export const N3 = (s: number): V3 => {
  const h = heading(s);
  return [Math.cos(h), -Math.sin(h), 0];
};
export const Z3: V3 = [0, 0, 1];
export const curvature = kappa;
