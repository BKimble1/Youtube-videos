// V3 feet. In V2 the feet slid on a sine wave under a moving pelvis, so walking never really touched the floor. In V3
// each foot is a list of plants: the foot stays exactly where it was put until its next step lifts it, swings along a
// cycloid arc (zero speed at lift-off and at landing), and lands at the next plant. Heels peel off before a lift and
// toes come up before a heel strike, pivoting about the ball and the heel. Steps along a path are generated from the
// pelvis path at a cadence, so a foot always lands where the body will pass over it (no skating); special steps (a
// brace, a pivot, a crouch, a stand) are written by hand into the same lists.
import {a3, m3, V3, v3} from '../v2/p3';

export type Plant = {t0: number; t1: number; p: V3; yaw: number; h?: number};
export type FootTrack = Plant[];
export type FootDims = {ankH: number; heel: number; ball: number};
export type FootState = {ank: V3; yaw: number; pitch: number; contact: number; swing: number};

const cyc = (s: number) => s - Math.sin(2 * Math.PI * s) / (2 * Math.PI);
const lerpA = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const footState = (tr: FootTrack, t: number, D: FootDims, pre = 0.12, post = 0.1): FootState => {
  let i = 0;
  while (i < tr.length - 1 && tr[i + 1].t1 <= t) i++;
  const cur = tr[i], nxt = tr[i + 1];
  if (nxt && t >= nxt.t0) {
    // swing
    const s = clamp01((t - nxt.t0) / (nxt.t1 - nxt.t0));
    const e = cyc(s);
    const h = nxt.h ?? 0.08;
    const p = v3(cur.p.x + (nxt.p.x - cur.p.x) * e, cur.p.y + (nxt.p.y - cur.p.y) * e + h * Math.sin(Math.PI * s), cur.p.z + (nxt.p.z - cur.p.z) * e);
    const yaw = lerpA(cur.yaw, nxt.yaw, e);
    // toe-off pitch carries into the swing, then the toe comes up for the heel strike
    const k = Math.min(1, h / 0.08), k0 = Math.min(2, h / 0.085);
    const pitch = -0.5 * k0 * (1 - s) * (1 - s) + 0.28 * Math.sin(Math.PI * Math.min(1, s * 1.1)) * s * k;
    // a very low step is a pivot on the ball of a planted foot: it keeps carrying weight
    return {ank: a3(p, v3(0, D.ankH, 0)), yaw, pitch, contact: h < 0.02 ? 1 : 0, swing: s};
  }
  // planted: heel peels before the next lift, toe settles after landing
  let pitch = 0;
  // a sprint's toe-off peels the heel much further than a walk's
  if (nxt && t > nxt.t0 - pre) pitch = -0.5 * Math.min(2, (nxt.h ?? 0.08) / 0.085) * ((t - (nxt.t0 - pre)) / pre) ** 2;
  if (t < cur.t1 + post && Number.isFinite(cur.t1)) pitch += 0.28 * Math.min(1, (cur.h ?? 0.08) / 0.08) * 0.35 * (1 - (t - cur.t1) / post) ** 2;
  const c = Math.cos(cur.yaw), sn = Math.sin(cur.yaw);
  const fwd = v3(sn, 0, c);
  let ank: V3;
  if (pitch < 0) {
    // heel up: pivot about the ball
    const ball = a3(cur.p, m3(fwd, D.ball));
    const x = -D.ball * Math.cos(pitch) - D.ankH * Math.sin(pitch), y = -D.ball * Math.sin(pitch) + D.ankH * Math.cos(pitch);
    ank = a3(a3(ball, m3(fwd, x)), v3(0, y, 0));
  } else if (pitch > 0) {
    // toe up: pivot about the heel
    const heel = a3(cur.p, m3(fwd, -D.heel));
    const x = D.heel * Math.cos(pitch) - D.ankH * Math.sin(pitch), y = D.heel * Math.sin(pitch) + D.ankH * Math.cos(pitch);
    ank = a3(a3(heel, m3(fwd, x)), v3(0, y, 0));
  } else ank = a3(cur.p, v3(0, D.ankH, 0));
  return {ank, yaw: cur.yaw, pitch, contact: 1, swing: -1};
};

/** steps along a pelvis path: landings every 1/cadence s from tFirst until tEnd, alternating feet; each foot lands at
 *  the point the pelvis will pass over at mid-stance, offset sideways by `width` */
export const genSteps = (o: {
  path: (t: number) => V3; yaw: (t: number) => number; tFirst: number; tEnd: number; cadence: number; duty: number;
  width: number; first: 'l' | 'r'; h: number; toeOut?: number;
}) => {
  const out: {l: Plant[]; r: Plant[]} = {l: [], r: []};
  const Ts = 1 / o.cadence;
  const stance = o.duty * 2 * Ts, swing = 2 * Ts - stance;
  let foot = o.first;
  for (let t1 = o.tFirst; t1 <= o.tEnd + 1e-6; t1 += Ts) {
    const tm = t1 + stance * 0.5;
    const c = o.path(tm), yw = o.yaw(tm);
    const R = v3(Math.cos(yw), 0, -Math.sin(yw));
    const sd = foot === 'r' ? 1 : -1;
    const p = a3(v3(c.x, 0, c.z), m3(R, sd * o.width));
    out[foot].push({t0: t1 - swing, t1, p, yaw: yw + sd * (o.toeOut ?? 0.1), h: o.h});
    foot = foot === 'l' ? 'r' : 'l';
  }
  return out;
};

/** merge step lists per foot, sorted by landing time */
export const mergeTracks = (...parts: {l?: Plant[]; r?: Plant[]}[]) => {
  const l: Plant[] = [], r: Plant[] = [];
  parts.forEach((p) => { if (p.l) l.push(...p.l); if (p.r) r.push(...p.r); });
  l.sort((a, b) => a.t1 - b.t1);
  r.sort((a, b) => a.t1 - b.t1);
  return {l, r};
};
export const plant = (p: V3, yaw: number): Plant => ({t0: -Infinity, t1: -Infinity, p, yaw});
