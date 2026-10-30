// Walking on surfaces. A body path gives the ant's frame as a function of distance travelled (s, mm). The feet use an
// alternating tripod (L1 R2 L3 / R1 L2 R3): each foot is planted on the nearest surface where the body will be half a
// stride later, held there through its stance, and lifted along the surface normal to its next hold. Everything is a
// pure function of s, so a stopped ant (s held at a whole stride) stands with all six feet down.
import {add3, len3, lerp3, mul3, norm3, sub3, V3} from '../../shared/three';
import {frame, Frame, toW} from '../core/frame';
import {AntState, planted, REST_FOOT} from './rig';

export type Surface = {proj: (p: V3) => {q: V3; n: V3; d: number}};
export const floorS: Surface = {proj: (p) => ({q: [p[0], p[1], 0], n: [0, 0, 1], d: Math.abs(p[2])})};
export const cylS = (cx: number, cy: number, r: number, z0: number, z1: number): Surface => ({
  proj: (p) => {
    const dx = p[0] - cx, dy = p[1] - cy;
    const L = Math.hypot(dx, dy) || 1;
    const n: V3 = [dx / L, dy / L, 0];
    const z = Math.min(z1, Math.max(z0, p[2]));
    const q: V3 = [cx + n[0] * r, cy + n[1] * r, z];
    return {q, n, d: Math.hypot(L - r, p[2] - z)};
  },
});
/** a horizontal ceiling (leaf underside) at height z over an x range */
export const ceilS = (z: number, x0: number, x1: number, y0: number, y1: number): Surface => ({
  proj: (p) => {
    const x = Math.min(x1, Math.max(x0, p[0])), y = Math.min(y1, Math.max(y0, p[1]));
    return {q: [x, y, z], n: [0, 0, -1], d: Math.hypot(p[0] - x, p[1] - y, p[2] - z)};
  },
});
export const unionS = (ss: Surface[]): Surface => ({
  proj: (p) => {
    let best = ss[0].proj(p);
    for (let i = 1; i < ss.length; i++) {
      const c = ss[i].proj(p);
      if (c.d < best.d) best = c;
    }
    return best;
  },
});

/** a path of straight runs and arcs; pose(s) -> body frame */
export type Seg = {len: number; at: (u: number) => Frame};
export const straight = (o0: V3, o1: V3, f: V3, u: V3): Seg => ({len: len3(sub3(o1, o0)), at: (x) => frame(lerp3(o0, o1, x), f, u)});
/** a quarter turn about an axis (concave corner): centre c, from radius vector r0 to r1, axes rotate with it */
export const arc = (c: V3, r0: V3, r1: V3, f0: V3, u0: V3, f1: V3, u1: V3): Seg => {
  const R = len3(r0);
  return {
    len: (R * Math.PI) / 2,
    at: (x) => {
      const a = (x * Math.PI) / 2;
      const rv = add3(mul3(r0, Math.cos(a)), mul3(r1, Math.sin(a)));
      const f = add3(mul3(f0, Math.cos(a)), mul3(f1, Math.sin(a)));
      const u = add3(mul3(u0, Math.cos(a)), mul3(u1, Math.sin(a)));
      return frame(add3(c, rv), f, u);
    },
  };
};
export const pathPose = (segs: Seg[], s: number): Frame => {
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const L = segs[i].len;
    if (s <= acc + L || i === segs.length - 1) return segs[i].at(Math.max(0, Math.min(1, (s - acc) / L)));
    acc += L;
  }
  return segs[segs.length - 1].at(1);
};
export const pathLen = (segs: Seg[]) => segs.reduce((a, g) => a + g.len, 0);

export const STRIDE = 3.4;
const GROUP = [0, 1, 1, 0, 0, 1]; // L1 R1 L2 R2 L3 R3
const DUTY = 0.56;
/** legs of an ant walking along a path with the given surfaces; bodyAt(s) is the body frame at distance s */
export const gaitLegs = (st: AntState, bodyAt: (s: number) => Frame, s: number, surf: Surface, lift = 0.9, spread = 1) => {
  const restW = (i: number, ss: number) => {
    const F = bodyAt(ss);
    const p = REST_FOOT[i];
    const sc = st.scale ?? 1;
    const w = toW(F, [p[0] * sc, p[1] * spread * sc, p[2] * sc]);
    return surf.proj(w);
  };
  return REST_FOOT.map((_, i) => {
    const ph = ((s / STRIDE + 0.5 * GROUP[i]) % 1 + 1) % 1;
    const s0 = s - ph * STRIDE; // where this cycle began
    if (ph < DUTY) {
      const h = restW(i, s0 + STRIDE * 0.5);
      return planted(st, i, h.q, h.n);
    }
    const u = (ph - DUTY) / (1 - DUTY);
    const a = restW(i, s0 + STRIDE * 0.5), b = restW(i, s0 + STRIDE * 1.5);
    const e = u * u * (3 - 2 * u);
    const q = lerp3(a.q, b.q, e);
    const n = norm3(lerp3(a.n, b.n, e));
    return planted(st, i, q, n, lift * Math.sin(Math.PI * u));
  });
};

/** the body's small rise and sway with each tripod step (two per stride), for a living walk */
export const bob = (F: Frame, s: number, k = 1): Frame => {
  const ph = (2 * Math.PI * s) / STRIDE;
  const up = 0.07 * k * Math.sin(2 * ph);
  const sway = 0.06 * k * Math.sin(ph);
  return {...F, o: add3(F.o, add3(mul3(F.u, up), mul3(F.l, sway)))};
};
