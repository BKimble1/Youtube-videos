// V1 opening (scenes 1-2): the winning preview's timeline and motion, kept exactly, in PREVIEW time tp. The film maps
// its own time to tp with warpPrev() so the preview's beats land on this narration's words (see timeline.ts).
import {clamp, keyCR, ring, ss} from '../shared/lib';
import {Cam, V3, v3} from './cam';
import {FIG_H, FIG_T} from './figure';
import {MOULD, ZT} from './props';

// the preview narration's word starts (hook-previews-10 h04_words.json)
const PW: Record<string, number> = {melts: 1.12, cage: 1.88, then: 2.62, remolded: 3.12, into: 3.76, shape: 4.08};
const st = (w: string) => PW[w];

export const TP = {
  // melting in the cage (the coil's alternating field is on from frame 0)
  front1: 1.0, // the melt front (matte -> liquid skin) reaches the head
  slump0: 0.3,
  slump1: st('melts') + 0.3, // 1.42: the figure is a puddle
  // the magnet arrives and pulls the liquid out between the bars
  mag0: 0.7,
  mag1: 1.3,
  esc0: 1.22,
  esc1: st('cage') + 0.42, // 2.30: the cage is empty
  // steering: the magnet leads the collected pool onto the mould
  steer0: st('then') - 0.12, // 2.50
  steer1: st('remolded') + 0.18, // 3.30: pool over the cavity's head end
  fill1: st('into') + 0.16, // 3.92: cavity full
  power0: 3.3, // field switched off
  freeze0: st('into') + 0.08, // 3.84
  freeze1: st('shape') + 0.36, // 4.44
  touch: 4.74, // magnet meets the cast figure's head
  stand: 5.14, // the figure is tilted upright
  land: 5.5, // set down outside the cage
  release: 5.6, // magnet lets go and lifts away
};

export const C_POOL = v3(1.35, -1.45, ZT); // where the escaped liquid collects
export const S_STAND = v3(1.1, -1.48, ZT); // where the recast figure is set down
export const CAV = {x: 0.9, yF: -4.45}; // the cavity: figure lying face up, soles at yF, head toward +y

const k = (t: number, keys: [number, number][]) => keyCR(t, keys);

export const cameraPrev = (t: number): Cam => ({
  t: v3(
    k(t, [[0, 0.0], [1.0, 0.3], [1.9, 1.05], [2.7, 1.15], [3.5, 0.95], [4.3, 0.9], [5.2, 0.8], [6, 0.7]]),
    k(t, [[0, 0.0], [1.0, -0.22], [1.9, -0.85], [2.7, -1.75], [3.5, -2.95], [4.3, -3.45], [5.2, -2.45], [6, -1.75]]),
    k(t, [[0, 1.15], [1.0, 0.95], [1.9, 0.62], [2.7, 0.5], [3.5, 0.48], [4.3, 0.55], [5.2, 0.9], [6, 1.05]]),
  ),
  s: k(t, [[0, 520], [1.1, 452], [2.0, 360], [2.7, 326], [3.5, 318], [4.3, 305], [5.2, 285], [6, 300]]),
  yaw: k(t, [[0, -9], [2, -3], [4, 2], [6, 7]]),
  pitch: k(t, [[0, 31], [2.0, 37], [3.5, 40], [6, 41]]),
  D: 30,
  cx: 540,
  cy: 1010,
});

/** the cast figure's pose after freezing: tilt theta (deg, 0 lying face up .. 90 standing), the back-face pivot at
 *  the soles F, and a small swing (deg) in its own plane about the head while it hangs from the magnet */
export const castPose = (t: number) => {
  const up = ss(t, TP.touch + 0.02, TP.stand);
  const th = 90 * up + 3 * Math.sin(Math.PI * clamp((t - TP.stand + 0.12) / 0.3)) * (t > TP.stand - 0.12 ? 1 : 0);
  // pivot: rises out of the recess while tilting, then is carried to S_STAND
  const rise = ss(th, 0, 45);
  const F0 = v3(CAV.x, CAV.yF - 0.12 * ss(th, 30, 90), ZT - FIG_T + FIG_T * rise);
  const u = ss(t, TP.stand, TP.land);
  const hop = 0.42 * Math.sin(Math.PI * u);
  const F = v3(F0.x + (S_STAND.x - F0.x) * u, F0.y + (S_STAND.y - F0.y) * u, F0.z + (S_STAND.z - F0.z) * u + hop);
  const swing = t < TP.stand ? 0 : 7 * Math.sin(Math.PI * clamp((t - TP.stand) / (TP.land - TP.stand))) * (1 - u) * 1.6 + 3.5 * ring(t, TP.land, 2.2, 0.18);
  return {th, F, swing, carried: u};
};

/** where the magnet is (centre of the block) */
export const magnetAt = (t: number, contact?: V3): V3 => {
  const path = (tt: number) =>
    v3(
      k(tt, [[0, 3.9], [TP.mag0, 3.5], [TP.mag1, 2.3], [1.9, 2.25], [2.4, 2.25], [2.75, 2.08], [3.05, 1.82], [3.3, 1.72], [TP.fill1, 1.7], [4.2, 1.85], [4.5, 1.4]]),
      k(tt, [[0, -1.25], [TP.mag0, -1.45], [TP.mag1, -1.78], [1.9, -1.9], [2.4, -2.0], [2.75, -2.38], [3.05, -2.8], [3.3, -3.25], [TP.fill1, -4.5], [4.2, -4.2], [4.5, -3.3]]),
      k(tt, [[0, 1.9], [TP.mag0, 1.5], [TP.mag1, 1.06], [1.9, 1.0], [2.4, 1.0], [2.75, 0.92], [3.05, 0.88], [3.3, 0.86], [TP.fill1, 0.86], [4.2, 1.4], [4.5, 1.3]]),
    );
  let M = path(Math.min(t, 4.5));
  // hand tremor
  M = v3(M.x + 0.012 * Math.sin(t * 7.1), M.y + 0.01 * Math.sin(t * 5.3 + 1), M.z + 0.012 * Math.sin(t * 6.2 + 2));
  if (contact && t > 4.5) {
    const att = v3(contact.x, contact.y, contact.z + 0.2);
    const a = ss(t, 4.5, TP.touch);
    M = v3(M.x + (att.x - M.x) * a, M.y + (att.y - M.y) * a, M.z + (att.z - M.z) * a);
    if (t > TP.release) {
      const r = ss(t, TP.release, 6.05);
      M = v3(M.x + 0.25 * r, M.y - 0.05 * r, M.z + 0.75 * r);
    }
  }
  return M;
};

/** the in-cage melt: melt front height (cm on the figure), slump 0..1 */
export const meltState = (t: number) => ({
  front: 0.3 + (FIG_H - 0.1) * ss(t, -0.05, TP.front1),
  slump: Math.pow(ss(t, TP.slump0, TP.slump1), 1.15),
});

export const inMould = (x: number, y: number) => x >= MOULD.x0 && x <= MOULD.x1 && y >= MOULD.y0 && y <= MOULD.y1;
