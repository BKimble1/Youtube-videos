// Gravity-true debris: a torn plate, a limb, a drone's pieces as rigid bodies that fly, hit the ground (the scene's
// `ground` function, with its slope), bounce, tip over onto a face, slide to a stop and STAY. A small deterministic
// fixed-step simulation (point contacts with impulses and friction) from the moment of separation, cached per launch
// so every frame of a shot (and every later shot that persists the wreck) samples the same trajectory.
//   bodyOf(parts, id)                  a rigid body from part meshes (each placed in the body frame)
//   debrisPose(body, launch, t, ground) → Pose3 of the body frame at t (the part meshes keep their local poses)
//   tearLaunch(...)                    a launch for a piece tearing off a joint / hinge (spin consistent with the pivot)
//   debrisLanding(body, launch, ground) → first ground contact {t, pos} and rest time (for FX and sound)
import {V3, add3, sub3, mul3, dot3, cross3, norm3, len3, clamp, rnd, smooth} from '../../kit/math';
import type {Prepped} from '../engine';
import {R3, Pose3, rmul, rcomp, rotAxisM} from './mat3';

type Ground = (x: number, z: number) => number;

export type Body = {
  id: string;
  /** contact points in the body frame (a subset of the part vertices) */
  pts: V3[];
  /** centre of mass in the body frame */
  com: V3;
  /** half extents of the body's box about com, along the body frame's axes */
  half: V3;
  /** radius of gyration (m) */
  k: number;
};
export type Launch = {
  t0: number;
  /** body frame origin and rotation at t0 */
  pos: V3;
  R: R3;
  /** velocity of the centre of mass (m/s) and angular velocity (rad/s, world axis × rate) at t0 */
  v: V3;
  w: V3;
  /** bounciness (default 0.22) and sliding friction (default 0.55) */
  e?: number;
  mu?: number;
};

const BODIES = new Map<string, Body>();
/** A rigid body made of part meshes; `P` places each mesh in the body frame (default: the body frame itself). */
export const bodyOf = (parts: {mesh: Prepped; P?: Pose3; scale?: number}[], id: string): Body => {
  const hit = BODIES.get(id);
  if (hit) return hit;
  const all: V3[] = [];
  const perPart: V3[][] = [];
  parts.forEach(({mesh, P, scale}) => {
    const mine: V3[] = [];
    mesh.verts.forEach((v) => {
      const s = scale ?? 1;
      const q = {x: v.x * s, y: v.y * s, z: v.z * s};
      const w = P ? add3(P.pos, rmul(P.R, q)) : q;
      all.push(w); mine.push(w);
    });
    perPart.push(mine);
  });
  let lo = {x: 1e9, y: 1e9, z: 1e9}, hi = {x: -1e9, y: -1e9, z: -1e9};
  all.forEach((p) => {
    lo = {x: Math.min(lo.x, p.x), y: Math.min(lo.y, p.y), z: Math.min(lo.z, p.z)};
    hi = {x: Math.max(hi.x, p.x), y: Math.max(hi.y, p.y), z: Math.max(hi.z, p.z)};
  });
  const com = mul3(add3(lo, hi), 0.5);
  const half = mul3(sub3(hi, lo), 0.5);
  // contact points: each part's own extreme vertices (its box corners first), so no part of an assembly can sink
  const per = Math.max(10, Math.floor(36 / perPart.length));
  const pts: V3[] = [];
  perPart.forEach((mine) => {
    let plo = {x: 1e9, y: 1e9, z: 1e9}, phi = {x: -1e9, y: -1e9, z: -1e9};
    mine.forEach((p) => { plo = {x: Math.min(plo.x, p.x), y: Math.min(plo.y, p.y), z: Math.min(plo.z, p.z)}; phi = {x: Math.max(phi.x, p.x), y: Math.max(phi.y, p.y), z: Math.max(phi.z, p.z)}; });
    const pc = mul3(add3(plo, phi), 0.5), ph = mul3(sub3(phi, plo), 0.5);
    const uniq: V3[] = [];
    mine.forEach((p) => { if (!uniq.some((q) => Math.abs(q.x - p.x) + Math.abs(q.y - p.y) + Math.abs(q.z - p.z) < 0.01)) uniq.push(p); });
    const score = (p: V3) => Math.abs((p.x - pc.x) / (ph.x + 1e-3)) + Math.abs((p.y - pc.y) / (ph.y + 1e-3)) + Math.abs((p.z - pc.z) / (ph.z + 1e-3));
    uniq.sort((a, b) => score(b) - score(a));
    pts.push(...uniq.slice(0, per));
  });
  const k = 0.42 * len3(half);
  const b: Body = {id, pts, com, half, k: Math.max(0.02, k)};
  BODIES.set(id, b);
  return b;
};

// ------------------------------------------------------------------ simulation
const G = 9.8;
const DT = 1 / 120;
const T_MAX = 4.5;
type Track = {n: number; c: V3[]; R: R3[]; restAt: number; land: number; landPos: V3};
const CACHE = new WeakMap<Ground, Map<string, Track>>();
const f4 = (n: number) => Math.round(n * 1e4) / 1e4;
const kV = (v: V3) => `${f4(v.x)},${f4(v.y)},${f4(v.z)}`;
const kR = (R: R3) => `${kV(R.x)},${kV(R.y)},${kV(R.z)}`;

const ortho = (R: R3): R3 => {
  const z = norm3(R.z);
  const x = norm3(cross3(R.y, z));
  const y = cross3(z, x);
  return {x, y, z};
};
const gNormal = (g: Ground, x: number, z: number): V3 => {
  const e = 0.12;
  return norm3({x: -(g(x + e, z) - g(x - e, z)) / (2 * e), y: 1, z: -(g(x, z + e) - g(x, z - e)) / (2 * e)});
};

const TIP_STEP = 2.5; // degrees per settle iteration
const easeIn2 = (x: number) => Math.min(1, Math.max(0, x)) ** 2;
/** world points of the body at (c, R) */
const worldPts = (b: Body, c: V3, R: R3) => b.pts.map((p) => add3(c, rmul(R, sub3(p, b.com))));
/** lower (or raise) the body so its lowest point touches the ground */
const toGround = (b: Body, c: V3, R: R3, g: Ground): V3 => {
  let low = 1e9;
  for (const q of worldPts(b, c, R)) low = Math.min(low, q.y - g(q.x, q.z));
  return {x: c.x, y: c.y - low, z: c.z};
};
type P2 = {x: number; z: number};
const hull2 = (P: P2[]): P2[] => {
  const pts = [...P].sort((a, b) => a.x - b.x || a.z - b.z);
  if (pts.length < 3) return pts;
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lo: P2[] = [], hi: P2[] = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
/** closest point of a convex polygon (or segment / point) to q, and whether q is strictly inside (with margin) */
const hullClosest = (H: P2[], q: P2, margin = 0.01): {p: P2; inside: boolean} => {
  if (H.length === 1) return {p: H[0], inside: false};
  let best = {p: H[0], d: 1e9};
  let inside = H.length >= 3;
  for (let i = 0; i < H.length; i++) {
    const a = H[i], b = H[(i + 1) % H.length];
    if (H.length === 2 && i === 1) break;
    const ab = {x: b.x - a.x, z: b.z - a.z}, L2 = ab.x * ab.x + ab.z * ab.z || 1e-9;
    const s = Math.max(0, Math.min(1, ((q.x - a.x) * ab.x + (q.z - a.z) * ab.z) / L2));
    const p = {x: a.x + ab.x * s, z: a.z + ab.z * s};
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < best.d) best = {p, d};
    // inside test (counter-clockwise hull): q must be left of every edge by the margin
    const cr = ab.x * (q.z - a.z) - ab.z * (q.x - a.x);
    if (cr / Math.sqrt(L2) < margin) inside = false;
  }
  return {p: best.p, inside};
};
const settlePath = (b: Body, c0: V3, R0: R3, g: Ground): {c: V3; R: R3}[] => {
  let R = R0;
  let c = toGround(b, c0, R0, g);
  const out = [{c, R}];
  for (let it = 0; it < 72; it++) {
    const W = worldPts(b, c, R);
    const h = W.map((q) => q.y - g(q.x, q.z));
    const hmin = Math.min(...h);
    const S = W.filter((_, i) => h[i] < hmin + 0.012).map((q) => ({x: q.x, z: q.z}));
    const H = hull2(S);
    const hc = hullClosest(H, {x: c.x, z: c.z});
    if (hc.inside) break;
    const d = {x: c.x - hc.p.x, y: 0, z: c.z - hc.p.z};
    const dl = Math.hypot(d.x, d.z);
    if (dl < 1e-4) break;
    const axis = norm3(cross3({x: 0, y: 1, z: 0}, mul3(d, 1 / dl)));
    const piv = {x: hc.p.x, y: g(hc.p.x, hc.p.z), z: hc.p.z};
    const Rr = rotAxisM(axis, TIP_STEP);
    R = ortho(rcomp(Rr, R));
    c = add3(piv, rmul(Rr, sub3(c, piv)));
    c = toGround(b, c, R, g);
    out.push({c, R});
  }
  return out;
};

const simulate = (b: Body, L: Launch, g: Ground): Track => {
  const e0 = L.e ?? 0.22, mu = L.mu ?? 0.55;
  const I = b.k * b.k;
  let R = L.R;
  let c = add3(L.pos, rmul(R, b.com));
  let v = L.v, w = L.w;
  const C: V3[] = [c], RR: R3[] = [R];
  let rest = 0, land = -1, landPos = c;
  const steps = Math.round(T_MAX / DT);
  let i = 0;
  for (; i < steps; i++) {
    v = {x: v.x, y: v.y - G * DT, z: v.z};
    c = add3(c, mul3(v, DT));
    const wl = len3(w);
    if (wl > 1e-6) R = rcomp(rotAxisM(mul3(w, 1 / wl), wl * DT * 57.29578), R);
    if (i % 8 === 7) R = ortho(R);
    // contacts: every point below the ground gets an impulse; the deepest sets the positional correction
    let deep = 0, deepN: V3 = {x: 0, y: 1, z: 0}, touching = false;
    const pens: {r: V3; n: V3; pen: number}[] = [];
    for (const p of b.pts) {
      const r = rmul(R, sub3(p, b.com));
      const q = add3(c, r);
      const gy = g(q.x, q.z);
      const pen = gy - q.y;
      if (pen > -0.004) {
        touching = true;
        if (pen > 0) {
          const n = gNormal(g, q.x, q.z);
          pens.push({r, n, pen});
          if (pen > deep) { deep = pen; deepN = n; }
        }
      }
    }
    pens.sort((a, bb) => bb.pen - a.pen);
    for (const {r, n} of pens.slice(0, 4)) {
      const vp = add3(v, cross3(w, r));
      const vn = dot3(vp, n);
      if (vn >= 0) continue;
      if (land < 0) { land = (i + 1) * DT; landPos = c; }
      const e = vn < -0.9 ? e0 : 0;
      const rn = cross3(r, n);
      const den = 1 + dot3(rn, rn) / I;
      const j = (-(1 + e) * vn) / den;
      v = add3(v, mul3(n, j));
      w = add3(w, mul3(rn, j / I));
      // friction against the sliding velocity at the contact
      const vp2 = add3(v, cross3(w, r));
      const vt = sub3(vp2, mul3(n, dot3(vp2, n)));
      const vtl = len3(vt);
      if (vtl > 1e-6) {
        const td = mul3(vt, 1 / vtl);
        const rt = cross3(r, td);
        const dt2 = 1 + dot3(rt, rt) / I;
        const jt = Math.min(mu * j, vtl / dt2);
        v = sub3(v, mul3(td, jt));
        w = sub3(w, mul3(rt, jt / I));
      }
    }
    if (deep > 0) c = add3(c, mul3(deepN, deep));
    if (touching) {
      // rolling resistance and contact damping (rubble, not ice)
      v = mul3(v, 0.985);
      w = mul3(w, 0.95);
    }
    C.push(c); RR.push(R);
    const slow = touching && len3(v) < 0.14 && len3(w) < 0.7;
    rest = slow ? rest + 1 : 0;
    if (rest > 14) break;
  }
  // settle: a quasi-static tip — while the centre of mass is not over the support polygon (the points touching the
  // ground), rotate about the support edge / point that lets it fall, lowest point kept on the ground; then play that
  // path back as the piece tipping over (accelerating, like gravity), so nothing rests balanced on a corner
  const path = settlePath(b, c, R, g);
  const ang = path.length * TIP_STEP;
  const nb = Math.max(2, Math.round((0.12 + (ang / 90) * 0.42) / DT));
  for (let k = 1; k <= nb; k++) {
    const f = easeIn2(k / nb) * (path.length - 1);
    const j = Math.min(path.length - 2, Math.floor(f));
    if (path.length < 2) { C.push(path[0].c); RR.push(path[0].R); continue; }
    const s2 = f - j;
    const A = path[j], Bq = path[j + 1];
    C.push({x: A.c.x + (Bq.c.x - A.c.x) * s2, y: A.c.y + (Bq.c.y - A.c.y) * s2, z: A.c.z + (Bq.c.z - A.c.z) * s2});
    RR.push(blendR(A.R, Bq.R, s2));
  }
  if (land < 0) { land = (i + 1) * DT; landPos = c; }
  return {n: C.length, c: C, R: RR, restAt: (C.length - 1) * DT, land, landPos};
};

/** rotation blend (small angles: normalised lerp of the axes) */
const blendR = (a: R3, b: R3, s: number): R3 => {
  const z = norm3(add3(mul3(a.z, 1 - s), mul3(b.z, s)));
  const y0 = add3(mul3(a.y, 1 - s), mul3(b.y, s));
  const x = norm3(cross3(y0, z));
  const y = cross3(z, x);
  return {x, y, z};
};

const track = (b: Body, L: Launch, g: Ground): Track => {
  let m = CACHE.get(g);
  if (!m) { m = new Map(); CACHE.set(g, m); }
  const key = `${b.id}|${f4(L.t0)}|${kV(L.pos)}|${kR(L.R)}|${kV(L.v)}|${kV(L.w)}|${L.e ?? ''}|${L.mu ?? ''}`;
  let tr = m.get(key);
  if (!tr) {
    if (m.size > 600) m.clear();
    tr = simulate(b, L, g);
    m.set(key, tr);
  }
  return tr;
};

/** Pose of the body frame at time t (before t0: the launch pose). */
export const debrisPose = (b: Body, L: Launch, t: number, g: Ground): Pose3 => {
  const u = t - L.t0;
  if (u <= 0) return {pos: L.pos, R: L.R};
  const tr = track(b, L, g);
  const f = u / DT;
  const i = Math.floor(f);
  let c: V3, R: R3;
  if (i >= tr.n - 1) { c = tr.c[tr.n - 1]; R = tr.R[tr.n - 1]; }
  else {
    const s = f - i;
    const a = tr.c[i], bb = tr.c[i + 1];
    c = {x: a.x + (bb.x - a.x) * s, y: a.y + (bb.y - a.y) * s, z: a.z + (bb.z - a.z) * s};
    R = s < 0.5 ? tr.R[i] : tr.R[i + 1];
  }
  return {pos: sub3(c, rmul(R, b.com)), R};
};

/** First ground contact (film time, centre of mass) and the time the piece comes to rest. */
export const debrisLanding = (b: Body, L: Launch, g: Ground): {t: number; pos: V3; restT: number} => {
  const tr = track(b, L, g);
  return {t: L.t0 + tr.land, pos: tr.landPos, restT: L.t0 + tr.restAt};
};

/**
 * Launch for a piece tearing away: the centre of mass leaves along `dir` at ~`speed` (seeded ±25 % and a little
 * scatter), spinning about the `hinge` (body-frame point that lets go last: an edge, a joint) so the piece visibly
 * pivots off its mount, plus a small seeded tumble. `inherit` = the body's own velocity at t0 (a falling host).
 */
export const tearLaunch = (b: Body, t0: number, P: Pose3, dir: V3, speed: number, seed: number, o: {hinge?: V3; up?: number; spin?: number; inherit?: V3; e?: number; mu?: number} = {}): Launch => {
  const r = (k: number) => rnd(seed * 31 + k) * 2 - 1;
  const d = norm3({x: dir.x + r(1) * 0.25, y: Math.max(dir.y, 0) * 0.6 + (o.up ?? 0.35) + r(2) * 0.12, z: dir.z + r(3) * 0.25});
  const sp = speed * (0.8 + rnd(seed * 7) * 0.45);
  let v = mul3(d, sp);
  if (o.inherit) v = add3(v, o.inherit);
  const comW = add3(P.pos, rmul(P.R, b.com));
  let w: V3 = mul3(norm3({x: r(4), y: r(5), z: r(6)}), (o.spin ?? 3) * (0.6 + rnd(seed * 9) * 0.8));
  if (o.hinge) {
    // pivoting off the hinge: ω ⟂ (com − hinge) so the com's velocity is the launch velocity
    const h = add3(P.pos, rmul(P.R, o.hinge));
    const rr = sub3(comW, h);
    const l2 = Math.max(0.01, dot3(rr, rr));
    w = add3(mul3(cross3(rr, mul3(d, sp)), 1 / l2), mul3(w, 0.35));
  }
  return {t0, pos: P.pos, R: P.R, v, w, e: o.e, mu: o.mu};
};
void clamp;
