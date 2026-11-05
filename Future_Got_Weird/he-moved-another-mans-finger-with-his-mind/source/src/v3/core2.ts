// V2 helpers: narration timing (re-exported), springs with controlled overshoot, keyed cameras and parallax.
import {spring} from 'remotion';
import {clamp, easeInOut, lerp} from '../dc/math';
export {T, TE, wi, FPS, WORDS, pr, lin, keys, pulse} from '../lib/core';
import {FPS} from '../lib/core';

/** spring 0..1 (with overshoot) starting at time tSec; damping 10-14 gives a small controlled overshoot */
export const sp = (f: number, tSec: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  f < tSec * FPS ? 0 : spring({frame: f - tSec * FPS, fps: FPS, config: {damping: cfg.damping ?? 13, stiffness: cfg.stiffness ?? 140, mass: cfg.mass ?? 1}});

export type CamS = {x: number; y: number; z: number; rot?: number};
/** keyed camera: [timeSec, state, ease?][]; ease applies to the segment ending at that key (default easeInOut) */
export const camKeys = (f: number, ks: [number, CamS, ((t: number) => number)?][]): CamS => {
  const t = f / FPS;
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B, e] = ks[i + 1];
    if (t <= b) {
      const u = (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6)));
      // zoom interpolates in log space so a push reads at constant speed
      return {x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: Math.exp(lerp(Math.log(A.z), Math.log(B.z), u)), rot: lerp(A.rot ?? 0, B.rot ?? 0, u)};
    }
  }
  return ks[ks.length - 1][1];
};
