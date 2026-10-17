// Gait from distance travelled: feet are planted in world space during stance (no sliding), swing on an arc, and the
// pelvis bobs twice per stride. Walk, run and limp are parameter sets. dist is the pelvis distance along the ground
// (world units) from the start of the move; dir is +1 (screen right) or -1.
import {clamp, smooth, lerp} from '../kit/math';

export type GaitOpts = {stride: number; duty: number; lift: number; bob: number; s: number; armAmp?: number; limp?: {side: 'L' | 'R'; amt: number}};
export const WALK = {stride: 118, duty: 0.62, lift: 16, bob: 5, armAmp: 16};
export const RUN = {stride: 205, duty: 0.36, lift: 44, bob: 10, armAmp: 34};
export const HURRY = {stride: 150, duty: 0.5, lift: 24, bob: 7, armAmp: 22};
export const SHUFFLE = {stride: 80, duty: 0.7, lift: 9, bob: 3, armAmp: 6};

export type FootState = {x: number; lift: number; pitch: number; stance: boolean};
export type GaitState = {L: FootState; R: FootState; drop: number; side: number; armL: number; armR: number; phase: number};

export const gait = (x0: number, dist: number, dir: 1 | -1, o: GaitOpts): GaitState => {
  const W = o.stride * o.s;
  const foot = (phi: number, injured: boolean): FootState => {
    const duty = injured && o.limp ? o.duty * (1 - 0.32 * o.limp.amt) : o.duty;
    const c = dist / W + phi;
    const k = Math.floor(c);
    const u = c - k;
    const plant = (kk: number) => x0 + dir * ((kk - phi) * W + (W * duty) / 2);
    if (u < duty) {
      const heel = clamp((u - (duty - 0.16)) / 0.16);
      return {x: plant(k), lift: 0, pitch: heel * 22, stance: true};
    }
    const w = (u - duty) / (1 - duty);
    const e = smooth(w);
    const lift = Math.sin(Math.PI * Math.min(1, w * 1.05)) * o.lift * o.s * (injured && o.limp ? 1 - 0.45 * o.limp.amt : 1);
    return {x: lerp(plant(k), plant(k + 1), e), lift, pitch: lerp(22, -8, clamp(w * 2)) * (1 - clamp((w - 0.7) / 0.3)), stance: false};
  };
  const injL = o.limp?.side === 'L', injR = o.limp?.side === 'R';
  const R = foot(0, injR), L = foot(0.5, injL);
  const c = dist / W;
  let drop = o.bob * (0.5 - 0.5 * Math.cos(4 * Math.PI * (c - o.duty / 2)));
  let side = 0;
  if (o.limp) {
    // dip and lean over the good leg while the injured leg is in the air; quick, guarded step on the injured side
    const uInj = ((c + (injL ? 0.5 : 0)) % 1 + 1) % 1;
    const onBad = uInj < o.duty * (1 - 0.32 * o.limp.amt);
    drop += onBad ? 0 : o.limp.amt * 6 * Math.sin(Math.PI * clamp((uInj - o.duty) / (1 - o.duty)));
    side = (injL ? 1 : -1) * o.limp.amt * 6 * (onBad ? 0.4 : 1);
  }
  const amp = o.armAmp ?? 16;
  return {L, R, drop, side, armL: amp * Math.sin(2 * Math.PI * c), armR: -amp * Math.sin(2 * Math.PI * c), phase: c};
};

/** The nearest distance ≥ d at which both feet are planted (mid double support), so a walk can stop cleanly. */
export const stopDist = (d: number, o: GaitOpts) => {
  const W = o.stride * o.s;
  // double support right after a heel strike: R at c = k, L at c = k + 0.5
  const c = d / W;
  const cand = [Math.ceil(c * 2) / 2 + 0.04];
  return cand[0] * W;
};
