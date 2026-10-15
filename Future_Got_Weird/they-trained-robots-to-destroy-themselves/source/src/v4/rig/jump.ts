// V4 2D jump: one ballistic arc from a ledge to a target point, with a screen-time speed ramp, authored key poses
// (loaded crouch → extension → rise → tuck → entry) and either a plunge (molten steel) or a landing (stage / airbag).
import {RPose} from './Robot2D';
import {crouch, launch, AIR, blend, STAND_H, ANK, A, L} from './poses';

export type JumpSpec = {
  toeX: number; deckY: number;       // ledge
  endX: number; endY: number;        // where the soles arrive (surface / pad top)
  s: number; face?: 1 | -1;
  tPush: number; tTO: number; tEnd: number;   // screen times: push starts, takeoff, arrival
  apex?: number;                     // apex height above takeoff (world px)
  rate?: [number, number][];         // speed ramp keys in screen time [[t, rate], ...] spanning tTO..tEnd
  outcome?: 'plunge' | 'stick' | 'short' | 'faceplant';
  landX?: number;                    // for short/faceplant, where the feet actually land (defaults endX)
};

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

export const makeJump = (j: JumpSpec) => {
  const face = j.face ?? 1;
  const s = j.s;
  const K0 = crouch(j.toeX, j.deckY, s, face);
  const K1 = launch(j.toeX, j.deckY, s, face);
  const p0 = {x: K1.x, y: K1.y};
  const p1 = {x: j.endX, y: j.endY - (STAND_H - 6) * s};
  const apex = j.apex ?? 90 * s;
  // ballistic through p0 → p1 with the apex `apex` above p0: solve vertical with g in world px
  const g = 3554 * s; // 9.81 m/s² in rig units (1 u ≈ 2.76 mm) scaled to world px
  const vy0 = Math.sqrt(2 * g * apex);
  const dy = p1.y - p0.y; // + = down
  // y(t) = p0.y - vy0 t + 0.5 g t² = p1.y → 0.5 g t² - vy0 t - dy = 0
  const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * dy)) / g;
  const vx = (p1.x - p0.x) / T;
  const at = (tp: number) => ({x: p0.x + vx * tp, y: p0.y - vy0 * tp + 0.5 * g * tp * tp});
  // speed ramp: screen [tTO, tEnd] → physical [0, T]
  const rk = j.rate ?? [[j.tTO, 1], [j.tEnd, 1]];
  const N = 400;
  const rate = (t: number) => {
    if (t <= rk[0][0]) return rk[0][1];
    for (let i = 0; i < rk.length - 1; i++) if (t <= rk[i + 1][0]) return rk[i][1] + (rk[i + 1][1] - rk[i][1]) * ((t - rk[i][0]) / (rk[i + 1][0] - rk[i][0]));
    return rk[rk.length - 1][1];
  };
  const cum: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const ta = j.tTO + ((j.tEnd - j.tTO) * (i - 1)) / N, tb = j.tTO + ((j.tEnd - j.tTO) * i) / N;
    cum.push(cum[i - 1] + ((rate(ta) + rate(tb)) / 2) * (tb - ta));
  }
  const kScale = T / cum[N];
  const phys = (tau: number) => {
    if (tau <= j.tTO) return tau - j.tTO;
    if (tau >= j.tEnd) return T + (tau - j.tEnd);
    const x = ((tau - j.tTO) / (j.tEnd - j.tTO)) * N;
    const i = Math.floor(x);
    return (cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * (x - i)) * kScale;
  };
  const rateAt = (tau: number) => (tau > j.tTO && tau < j.tEnd ? rate(tau) * kScale : 1);
  const arc = (n = 40) => Array.from({length: n + 1}, (_, i) => at((T * i) / n));

  const pose = (tau: number): {pose: RPose; phase: 'stand' | 'push' | 'air' | 'after'; u: number} => {
    if (tau < j.tPush) return {pose: K0, phase: 'stand', u: 0};
    if (tau < j.tTO) {
      const u = (tau - j.tPush) / (j.tTO - j.tPush);
      return {pose: blend(K0, K1, smooth(u)), phase: 'push', u};
    }
    const tp = phys(tau);
    if (tp <= T) {
      const u = tp / T;
      const c = at(tp);
      const key = (k: keyof typeof AIR) => ({...K1, ...AIR[k], x: c.x, y: c.y, footN: undefined, footF: undefined} as RPose);
      let p: RPose;
      if (u < 0.12) p = blend({...K1, x: c.x, y: c.y, footN: undefined, footF: undefined}, key('rise'), smooth(u / 0.12));
      else if (u < 0.5) p = blend(key('rise'), key('tuck'), smooth((u - 0.12) / 0.38));
      else p = blend(key('tuck'), key('entry'), smooth((u - 0.5) / 0.4));
      return {pose: p, phase: 'air', u};
    }
    const d = tp - T;
    const out = j.outcome ?? 'plunge';
    if (out === 'plunge') {
      // keeps going down, decelerating in the dense steel; arms stay up
      const sink = (1 - Math.exp(-d * 2.6)) * 520 * s + d * 30 * s;
      const p: RPose = {...K1, ...AIR.entry, x: p1.x + vx * 0.06 * (1 - Math.exp(-d * 6)), y: p1.y + sink, footN: undefined, footF: undefined} as RPose;
      return {pose: p, phase: 'after', u: d};
    }
    // landings on a surface at endY
    const lx = j.landX ?? j.endX;
    const ground = j.endY;
    const absorb = Math.sin(Math.min(1, d / 0.3) * Math.PI) * (d < 0.3 ? 1 : 0);
    const base: RPose = {
      x: lx - 14 * s * face, y: ground - (STAND_H - 4) * s + 40 * s * absorb, rot: 6 + 22 * absorb, waist: 6 + 10 * absorb, neck: -6, head: 4,
      armN: A(40 + 50 * absorb, 30), armF: A(30 + 50 * absorb, 34), legN: L(0, 0, 0), legF: L(0, 0, 0), yaw: 0.5,
      footN: {x: lx + 8 * s * face, y: ground - ANK * s, pitch: 0}, footF: {x: lx - 6 * s * face, y: ground - ANK * s, pitch: 0},
    };
    if (out === 'stick') {
      const r = smooth((d - 0.35) / 0.6);
      return {pose: blend(base, {...base, y: ground - (STAND_H - 4) * s, rot: 0, waist: 0, armN: A(6, 14), armF: A(-4, 16)}, r), phase: 'after', u: d};
    }
    if (out === 'short') {
      // lands short at the pad's edge: a stumble forward onto one knee, a hand down
      const b = smooth((d - 0.2) / 0.5);
      const p = blend(base, {...base, x: lx + 30 * s * face, y: ground - 230 * s, rot: 34, waist: 16, armN: A(60, 10), armF: A(40, 20),
        footN: {x: lx + 70 * s * face, y: ground - ANK * s, pitch: 0}, footF: {x: lx - 50 * s * face, y: ground - ANK * s, pitch: -50}}, b);
      return {pose: p, phase: 'after', u: d};
    }
    // faceplant: rotates over the feet, arms out, ends prone
    const r = smooth(d / 0.7);
    const ang = 6 + 84 * r;
    const R0 = 300 * s;
    const p: RPose = {...base, rot: ang, waist: 0, x: lx + Math.sin((ang * Math.PI) / 180) * R0 * face * 0.95, y: ground - 40 * s - Math.cos((ang * Math.PI) / 180) * R0,
      armN: A(lerpN(40, 150, r), 20), armF: A(lerpN(30, 160, r), 20), footN: {x: lx + 8 * s * face, y: ground - ANK * s, pitch: -60 * r}, footF: {x: lx - 6 * s * face, y: ground - ANK * s, pitch: -64 * r}};
    return {pose: p, phase: 'after', u: d};
  };
  return {pose, phys, rateAt, arc, T, p0, p1, at, K0, K1};
};
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
