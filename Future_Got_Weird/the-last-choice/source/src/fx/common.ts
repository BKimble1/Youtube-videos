// Shared FX helpers: unique SVG ids, seeded shapes, ballistic motion with a ground bounce.
import {rnd} from '../kit/math';

/** A document-unique id for gradients/clips (kind + seed + position). Pass an explicit id prop to override. */
export const fxId = (kind: string, seed: number, x: number, y: number) =>
  `fx_${kind}_${seed}_${Math.round(x)}_${Math.round(y)}`.replace(/[-.]/g, 'm');

/** Seeded irregular polygon (centred at 0,0). elong stretches along x. */
export const chunkPts = (r: number, seed: number, n = 5, rough = 0.45, elong = 1) => {
  const pts: string[] = [];
  const a0 = rnd(seed * 13) * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (rnd(seed * 7 + i) - 0.5) * 0.6;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 11);
    pts.push(`${(Math.cos(a) * r * k * elong).toFixed(2)},${(Math.sin(a) * r * k).toFixed(2)}`);
  }
  return pts.join(' ');
};

export type Ballistic = {x: number; y: number; vx: number; vy: number; landed: boolean; rest: boolean};
/**
 * Position of a particle launched at (x, y) with (vx, vy) after tau seconds under gravity g, with one damped bounce
 * on the ground line and a friction slide to rest. ground = undefined → free flight.
 */
export const ballistic = (x: number, y: number, vx: number, vy: number, tau: number, g: number, ground?: number, bounce = 0.28, fric = 3.5): Ballistic => {
  const free = (tt: number) => ({x: x + vx * tt, y: y + vy * tt + 0.5 * g * tt * tt, vx, vy: vy + g * tt});
  if (ground === undefined || y > ground) {
    const f = free(tau);
    return {...f, landed: false, rest: false};
  }
  const disc = vy * vy - 2 * g * (y - ground);
  const t1 = (-vy + Math.sqrt(Math.max(0, disc))) / g;
  if (tau <= t1) return {...free(tau), landed: false, rest: false};
  const vImp = vy + g * t1;
  const x1 = x + vx * t1;
  const vx2 = vx * 0.45, vy2 = -Math.abs(vImp) * bounce;
  const t2 = (2 * Math.abs(vy2)) / g;
  const tb = tau - t1;
  if (tb <= t2) return {x: x1 + vx2 * tb, y: ground + vy2 * tb + 0.5 * g * tb * tb, vx: vx2, vy: vy2 + g * tb, landed: true, rest: false};
  const x2 = x1 + vx2 * t2;
  const ts = tb - t2;
  const slide = (vx2 * (1 - Math.exp(-fric * ts))) / fric;
  return {x: x2 + slide, y: ground, vx: vx2 * Math.exp(-fric * ts), vy: 0, landed: true, rest: ts > 1.2};
};

export const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  const k = Math.max(0, Math.min(1, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
