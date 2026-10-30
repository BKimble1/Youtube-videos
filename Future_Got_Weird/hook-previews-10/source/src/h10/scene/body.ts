// HOOK 10: body-anchored geometry for the cutaway and the hardware. Everything is placed in the participant's own
// frames (head-local, torso-local, neck, near leg) from the rig's joints, so the anatomy and the devices move with
// him exactly as he walks.
import {DIM, Joints, ManPose, manJoints} from '../rig/Man';
import {add, clamp, len, mul, norm, perp, rot, sub, V} from '../rig/math';

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});

export type Frames = ReturnType<typeof framesOf>;

export const framesOf = (p: ManPose) => {
  const j: Joints = manJoints(p);
  const s = p.s;
  const tc = j.tc;
  const headRoll = -(tc + p.neck);
  const hs = (DIM.headR * s) / 100;
  /** torso-local (u up the spine from the pelvis centre, v across: + toward his back, screen-right) */
  const tor = (u: number, v: number): V =>
    u < 200 ? add(j.H, add(mul(up(p.torso), u * s), mul(px(p.torso), v * s))) : add(j.C, add(mul(up(tc), (u - 200) * s), mul(px(tc), v * s)));
  /** head-local (the Head component's own space: radius 100, face toward screen-left) */
  const head = (x: number, y: number): V => add(j.head, mul(rot({x, y}, headRoll), hs));
  /** near-leg frame: f 0 (hip) .. 1 (knee) .. 2 (ankle); w across (+ toward his front, screen-left) */
  const L = j.lLeg;
  const leg = (f: number, w: number): V => {
    const A = f <= 1 ? L.hp : L.K, B = f <= 1 ? L.K : L.A;
    const k = f <= 1 ? f : f - 1;
    const a = norm(sub(B, A));
    const n = perp(a); // for a leg pointing down this is screen-left (his front)
    return add(add(A, mul(sub(B, A), k)), mul(n, w * s));
  };
  return {j, s, tc, headRoll, hs, tor, head, leg, upT: up(p.torso), upC: up(tc), pxT: px(p.torso), pxC: px(tc)};
};

// ------------------------------------------------------------------ polyline sampling
export type Track = {pts: V[]; cum: number[]; L: number};
/** Catmull-Rom through control points, sampled densely, with cumulative arc length */
export const track = (ctrl: V[], per = 10): Track => {
  const pts: V[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  pts.push(ctrl[n - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len(sub(pts[i], pts[i - 1])));
  return {pts, cum, L: cum[cum.length - 1]};
};
/** point and unit tangent at arc length d */
export const at = (T: Track, d: number): {p: V; a: V} => {
  const dd = clamp(d, 0, T.L);
  let i = 1;
  while (i < T.cum.length - 1 && T.cum[i] < dd) i++;
  const s0 = T.cum[i - 1], s1 = T.cum[i];
  const k = (dd - s0) / (s1 - s0 || 1);
  const a = norm(sub(T.pts[i], T.pts[i - 1]));
  return {p: add(T.pts[i - 1], mul(sub(T.pts[i], T.pts[i - 1]), k)), a};
};
/** the polyline between arc lengths d0 and d1 */
export const slice = (T: Track, d0: number, d1: number): V[] => {
  const a = clamp(Math.min(d0, d1), 0, T.L), b = clamp(Math.max(d0, d1), 0, T.L);
  const out: V[] = [at(T, a).p];
  for (let i = 0; i < T.pts.length; i++) if (T.cum[i] > a && T.cum[i] < b) out.push(T.pts[i]);
  out.push(at(T, b).p);
  return out;
};
export const polyD = (pts: V[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

// ------------------------------------------------------------------ the spine
export type Vert = {name: string; region: 'C' | 'T' | 'L' | 'S'; p: V; a: V; n: V; h: number; depth: number};

/** vertebral-body centre line from C1 (under the skull) to the sacrum */
export const spineTrack = (F: Frames) =>
  track([
    F.head(40, 40),
    F.head(38, 76),
    add(F.j.N, add(mul(F.upC, -14), mul(F.pxC, 14))),
    F.tor(326, 32),
    F.tor(290, 46),
    F.tor(240, 54),
    F.tor(180, 50),
    F.tor(130, 42),
    F.tor(80, 32),
    F.tor(30, 34),
    F.tor(-6, 44),
  ], 12);

const LEVELS: {name: string; region: Vert['region']; w: number; depth: number}[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({name: `C${i}`, region: 'C' as const, w: 0.7, depth: 15})),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({name: `T${i}`, region: 'T' as const, w: 0.84, depth: 21})),
  ...[1, 2, 3, 4, 5].map((i) => ({name: `L${i}`, region: 'L' as const, w: 1.08, depth: 27})),
];

export const vertebrae = (F: Frames, T: Track): Vert[] => {
  // the cervical spine fills the neck (C1 under the skull to C7 at the third control point); thoracic and lumbar the rest
  const dC = T.cum[2 * 12];
  const out: Vert[] = [];
  const place = (ls: typeof LEVELS, a: number, b: number) => {
    const tot = ls.reduce((q, l) => q + l.w, 0);
    let acc = 0;
    for (const l of ls) {
      const d = a + ((acc + l.w / 2) / tot) * (b - a);
      acc += l.w;
      const {p, a: ax} = at(T, d);
      let n = perp(ax);
      if (n.x * F.pxT.x + n.y * F.pxT.y < 0) n = mul(n, -1);
      out.push({name: l.name, region: l.region, p, a: ax, n, h: (l.w / tot) * (b - a), depth: l.depth * F.s});
    }
  };
  place(LEVELS.filter((l) => l.region === 'C'), 0, dC);
  place(LEVELS.filter((l) => l.region !== 'C'), dC, T.L - 4);
  return out;
};
