// Swimming as a pure function of time. The tail beat is the antagonistic cycle (model.cycle); thrust comes once per
// stroke, so speed surges twice per cycle. Forward speed scales with beat frequency and amplitude, and is kept within
// what the paper reports (about one body length per second for the mature, autonomously paced fish: 15 mm/s, i.e.
// 150 units/s). Each stroke sheds a small swirl of water at the tail tip.
import {add3, mul3, V3} from '../core/cam';
import {cycle, fishGeo, FishPose, L} from './model';
import {Swirl} from '../art/water';

export type SwimSpec = {
  t0: number;
  t1: number;
  start: V3;
  /** heading (deg) as a function of time */
  yaw: (t: number) => number;
  freq: (t: number) => number;
  amp: (t: number) => number;
  /** units per second per (Hz x rad); default 125 */
  k?: number;
  mature?: (t: number) => number;
  phase0?: number;
  /** vertical drift */
  bob?: number;
  TK?: number;
};
export type SwimTrack = {at: (t: number) => FishPose & {phase: number; speed: number}; swirls: (t: number) => Swirl[]};

const DT = 1 / 240;
export const swimTrack = (S: SwimSpec): SwimTrack => {
  const n = Math.ceil((S.t1 - S.t0) / DT) + 2;
  const ph: number[] = [], px: number[] = [], pz: number[] = [], sp: number[] = [];
  let phi = S.phase0 ?? 0, x = S.start[0], z = S.start[2];
  const k = S.k ?? 125;
  const emits: Swirl[] = [];
  let lastHalf = Math.floor((phi - Math.PI / 2) / Math.PI);
  for (let i = 0; i < n; i++) {
    const t = S.t0 + i * DT;
    const f = S.freq(t), a = S.amp(t);
    const surge = 0.75 + 0.25 * Math.abs(Math.cos(phi)) * 2;
    const v = k * f * a * surge * 0.8;
    ph.push(phi);
    px.push(x);
    pz.push(z);
    sp.push(v);
    const yaw = (S.yaw(t) * Math.PI) / 180;
    x += Math.cos(yaw) * v * DT;
    z += -Math.sin(yaw) * v * DT;
    phi += 2 * Math.PI * f * DT;
    const half = Math.floor((phi - Math.PI / 2) / Math.PI);
    if (half !== lastHalf && a > 0.05) {
      lastHalf = half;
      const c = cycle(phi, a);
      const pose: FishPose = {pos: [x, S.start[1], z], yaw: S.yaw(t), A: c.A, actA: c.actA, actB: c.actB, mature: 1, TK: S.TK ?? 1};
      const g = fishGeo(pose);
      const tip = g.atS(0.97, 0, 0);
      emits.push({p: tip, age: t, dir: half % 2 === 0 ? 1 : -1, size: 10 + 18 * a});
    }
  }
  const idx = (t: number) => Math.min(n - 1, Math.max(0, (t - S.t0) / DT));
  const lerpA = (arr: number[], t: number) => {
    const u = idx(t), i = Math.floor(u), fr = u - i;
    return arr[i] + ((arr[Math.min(n - 1, i + 1)] ?? arr[i]) - arr[i]) * fr;
  };
  const at = (t: number) => {
    const phi = lerpA(ph, t);
    const a = S.amp(t);
    const c = cycle(phi, a);
    const bob = (S.bob ?? 4) * Math.sin(t * 1.3);
    const mat = S.mature ? S.mature(t) : 1;
    return {pos: [lerpA(px, t), S.start[1] + bob, lerpA(pz, t)] as V3, yaw: S.yaw(t) - 6 * c.A, A: c.A, actA: c.actA, actB: c.actB, mature: mat, TK: S.TK ?? 1, phase: phi, speed: lerpA(sp, t)};
  };
  const swirls = (t: number): Swirl[] =>
    emits
      .filter((e) => e.age <= t && t - e.age < 1.2)
      .map((e) => ({...e, age: t - e.age, p: add3(e.p, mul3([0, -1, 0], (t - e.age) * 6))}));
  return {at, swirls};
};
export {L};
