// A small deterministic 3D vector renderer in the channel's flat ink style. Every visible object is a primitive in
// world space (metres) projected through one camera; primitives are painted far to near inside their layer. Shading
// is a fixed warm key light from the upper left (as in dc/shade.tsx), so shading never jumps when a part moves.
import React from 'react';
import {add, cross, dot, len, mul, norm, sub, V3} from './v3';
import {lit, rgba, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {overlapPoint, overlapPoints, rayHit, Shape2, Solid} from './solid';

export const W = 1080;
export const H = 1920;

export type Cam = {eye: V3; target: V3; f: number; roll?: number; /** screen offset of the target (px) */ ox?: number; oy?: number};
export type Basis = {fwd: V3; right: V3; up: V3};

export const basis = (c: Cam): Basis => {
  const fwd = norm(sub(c.target, c.eye));
  let right = norm(cross(fwd, {x: 0, y: 1, z: 0}));
  let up = cross(right, fwd);
  if (c.roll) {
    const r = c.roll, cs = Math.cos(r), sn = Math.sin(r);
    const r2 = add(mul(right, cs), mul(up, sn));
    up = add(mul(up, cs), mul(right, -sn));
    right = r2;
  }
  return {fwd, right, up};
};

export type P2 = {x: number; y: number; z: number};
export const NEAR = 0.04;

export const projector = (c: Cam, xf?: (p: V3) => V3) => {
  const b = basis(c);
  const cx = W / 2 + (c.ox ?? 0), cy = H / 2 + (c.oy ?? 0);
  const camSpace = (p0: V3) => {
    const p = xf ? xf(p0) : p0;
    const d = sub(p, c.eye);
    return {x: dot(d, b.right), y: dot(d, b.up), z: dot(d, b.fwd)};
  };
  const toScreen = (q: {x: number; y: number; z: number}): P2 => ({x: cx + (c.f * q.x) / q.z, y: cy - (c.f * q.y) / q.z, z: q.z});
  const proj = (p: V3): P2 => toScreen(camSpace(p));
  /** screen radius of a sphere of radius r at p */
  const rad = (p: V3, r: number) => (c.f * r) / Math.max(NEAR, camSpace(p).z);
  return {proj, camSpace, toScreen, rad, basis: b, cam: c};
};
export type Proj = ReturnType<typeof projector>;

/** clip a polygon (camera space) to z >= NEAR */
const clipNear = (pts: {x: number; y: number; z: number}[]) => {
  const out: typeof pts = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a.z >= NEAR, bin = b.z >= NEAR;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (NEAR - a.z) / (b.z - a.z);
      out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR});
    }
  }
  return out;
};

export const f2 = (n: number) => (Math.round(n * 100) / 100).toString();
export const pathOf = (pts: {x: number; y: number}[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${f2(p.x)} ${f2(p.y)}`).join(' ') + (close ? ' Z' : '');

/** a primitive: `depth` is the camera-space distance used for painter's ordering inside its layer.
 *  (V3) `cs` is the piece's convex solid in camera space and `sh` its drawn outline; `grp`/`ax`/`axFwd` order the
 *  pieces of one link along its axis (ax increasing toward the camera when axFwd). See lib/solid.ts and sort3. */
export type Item = {layer: number; depth: number; key: string; el: React.ReactNode; cs?: Solid; sh?: Shape2;
  /** pieces of one link: its id, the piece's station range [s0, s1] along the axis, and the axis (camera space) */
  grp?: string; axr?: [number, number]; axP?: V3; axU?: V3};

// ---------------------------------------------------------------------------------------------------------------
// primitives

export const LIGHT2 = {x: -0.62, y: -0.78};
let uid = 0;
let pre = 'a';
/** restart element ids for a view; each simultaneous view needs its own prefix (gradient ids are document-wide) */
export const resetIds = (prefix = 'a') => {
  uid = 0;
  pre = prefix;
};
export const nid = (p: string) => `${pre}${p}${uid++}`;

/** line weight for an object of screen size s (px): the channel's ~3-4 px contour, lighter on small parts */
export const lw = (s: number, k = 1) => Math.max(1.2, Math.min(4.2, 1.1 + s * 0.09)) * k;

/** flat polygon (world points) */
export const poly = (P: Proj, pts: V3[], fill: string, o: {layer?: number; stroke?: string | null; sw?: number; opacity?: number; key?: string; depthBias?: number; grad?: [string, string, number, number, number, number]} = {}): Item | null => {
  const cs = clipNear(pts.map(P.camSpace));
  if (cs.length < 3) return null;
  const s = cs.map(P.toScreen);
  const depth = cs.reduce((a, q) => a + q.z, 0) / cs.length + (o.depthBias ?? 0);
  const id = o.grad ? nid('pg') : '';
  const el = (
    <g key={o.key ?? nid('p')} opacity={o.opacity}>
      {o.grad && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={o.grad[2]} y1={o.grad[3]} x2={o.grad[4]} y2={o.grad[5]}>
            <stop offset="0" stopColor={o.grad[0]} />
            <stop offset="1" stopColor={o.grad[1]} />
          </linearGradient>
        </defs>
      )}
      <path d={pathOf(s)} fill={o.grad ? `url(#${id})` : fill} stroke={o.stroke === null ? 'none' : o.stroke ?? INK} strokeWidth={o.sw ?? 3} strokeLinejoin="round" />
    </g>
  );
  return {layer: o.layer ?? 3, depth, key: nid('k'), el};
};

/** a world-space polyline */
export const line = (P: Proj, pts: V3[], color: string, sw: number, o: {layer?: number; opacity?: number; dash?: string; depthBias?: number} = {}): Item | null => {
  const cs = pts.map(P.camSpace);
  if (cs.some((q) => q.z < NEAR)) return null;
  const s = cs.map(P.toScreen);
  const depth = cs.reduce((a, q) => a + q.z, 0) / cs.length + (o.depthBias ?? 0);
  return {layer: o.layer ?? 3, depth, key: nid('k'), el: <path key={nid('l')} d={pathOf(s, false)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={o.opacity} strokeDasharray={o.dash} />};
};

export const capsuleD = (a: {x: number; y: number}, b: {x: number; y: number}, ra: number, rb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.max(0.01, Math.hypot(dx, dy));
  const ax = {x: dx / d, y: dy / d};
  const n = {x: -ax.y, y: ax.x};
  const s = Math.max(-0.98, Math.min(0.98, (ra - rb) / d));
  const c = Math.sqrt(1 - s * s);
  const up = {x: ax.x * s + n.x * c, y: ax.y * s + n.y * c};
  const um = {x: ax.x * s - n.x * c, y: ax.y * s - n.y * c};
  const p1 = {x: a.x + up.x * ra, y: a.y + up.y * ra};
  const q1 = {x: b.x + up.x * rb, y: b.y + up.y * rb};
  const q2 = {x: b.x + um.x * rb, y: b.y + um.y * rb};
  const p2 = {x: a.x + um.x * ra, y: a.y + um.y * ra};
  return `M${f2(p1.x)} ${f2(p1.y)} L${f2(q1.x)} ${f2(q1.y)} A${f2(rb)} ${f2(rb)} 0 ${s < 0 ? 1 : 0} 0 ${f2(q2.x)} ${f2(q2.y)} L${f2(p2.x)} ${f2(p2.y)} A${f2(ra)} ${f2(ra)} 0 ${s > 0 ? 1 : 0} 0 ${f2(p1.x)} ${f2(p1.y)} Z`;
};

/** a shaded cylinder (drawn as a capsule) between world points a and b with radii ra, rb */
export const tube = (P: Proj, a: V3, b: V3, ra: number, rb: number, color: string, o: {layer?: number; k?: number; spec?: number; sw?: number; opacity?: number; depthBias?: number; flat?: boolean; noStroke?: boolean} = {}): Item | null => {
  const A = P.camSpace(a), B = P.camSpace(b);
  if (A.z < NEAR || B.z < NEAR) return null;
  const sa = P.toScreen(A), sb = P.toScreen(B);
  const pra = (P.cam.f * ra) / A.z, prb = (P.cam.f * rb) / B.z;
  const d = capsuleD(sa, sb, pra, prb);
  const ax = {x: sb.x - sa.x, y: sb.y - sa.y};
  const al = Math.hypot(ax.x, ax.y) || 1;
  let n = {x: -ax.y / al, y: ax.x / al};
  const m = n.x * LIGHT2.x + n.y * LIGHT2.y;
  if (m < 0) n = {x: -n.x, y: -n.y};
  const r = (pra + prb) / 2;
  const mid = {x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2};
  const k = (o.k ?? 1) * (0.55 + 0.45 * Math.sqrt(Math.abs(m)));
  const id = nid('tg');
  const sw = o.sw ?? lw(r * 2);
  const el = (
    <g key={nid('t')} opacity={o.opacity}>
      {!o.flat && (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(mid.x + n.x * r)} y1={f2(mid.y + n.y * r)} x2={f2(mid.x - n.x * r)} y2={f2(mid.y - n.y * r)}>
            <stop offset="0" stopColor={lit(color, 0.32 * k)} />
            <stop offset="0.38" stopColor={color} />
            <stop offset="1" stopColor={shade(color, 0.42 * k)} />
          </linearGradient>
        </defs>
      )}
      <path d={d} fill={o.flat ? color : `url(#${id})`} stroke={o.noStroke ? 'none' : INK} strokeWidth={sw} strokeLinejoin="round" />
      {(o.spec ?? 0) > 0 && r > 2.5 && (
        <path d={`M${f2(sa.x + n.x * r * 0.5)} ${f2(sa.y + n.y * r * 0.5)} L${f2(sb.x + n.x * r * 0.5)} ${f2(sb.y + n.y * r * 0.5)}`} stroke={rgba('#FFFFFF', o.spec!)} strokeWidth={Math.max(1, r * 0.22)} strokeLinecap="round" />
      )}
    </g>
  );
  return {layer: o.layer ?? 3, depth: (A.z + B.z) / 2 + (o.depthBias ?? 0), key: nid('k'), el};
};

/** a shaded sphere; `deco` draws extra marks in screen space on top (centre and radius given) */
export const sphere = (P: Proj, c: V3, r: number, color: string, o: {layer?: number; depthBias?: number; sw?: number; opacity?: number; deco?: (s: P2, R: number) => React.ReactNode; k?: number} = {}): Item | null => {
  const C = P.camSpace(c);
  if (C.z < NEAR) return null;
  const s = P.toScreen(C);
  const R = (P.cam.f * r) / C.z;
  const id = nid('sg');
  const k = o.k ?? 1;
  const el = (
    <g key={nid('s')} opacity={o.opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(s.x + LIGHT2.x * R * 0.42)} cy={f2(s.y + LIGHT2.y * R * 0.42)} r={f2(R * 1.35)}>
          <stop offset="0" stopColor={lit(color, 0.38 * k)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.45 * k)} />
        </radialGradient>
      </defs>
      <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R)} fill={`url(#${id})`} stroke={INK} strokeWidth={o.sw ?? lw(R * 2)} />
      {o.deco?.(s, R)}
    </g>
  );
  return {layer: o.layer ?? 3, depth: C.z + (o.depthBias ?? 0), key: nid('k'), el};
};

/** a soft ground shadow: a flattened capsule between ground points (already on the plane), drawn in layer 2 */
export const groundShadow = (P: Proj, a: V3, b: V3, w: number, alpha: number): Item | null => {
  const A = P.camSpace(a), B = P.camSpace(b);
  if (A.z < NEAR || B.z < NEAR) return null;
  const sa = P.toScreen(A), sb = P.toScreen(B);
  // the shadow lies on the ground: approximate its screen width by the projected world width
  const ra = (P.cam.f * w) / A.z, rb = (P.cam.f * w) / B.z;
  const flat = Math.abs(P.basis.fwd.y) * 0.85 + 0.15; // foreshortening of a horizontal band
  return {layer: 2, depth: 0, key: nid('k'), el: <path key={nid('sh')} d={capsuleD(sa, sb, ra * flat, rb * flat)} fill={rgba(INK, alpha)} />};
};

/** a rectangular box (axis-aligned in its own frame: centre c, half sizes h, yaw about y); visible faces only */
export const box = (P: Proj, c: V3, h: V3, cols: {top: string; side: string; front: string}, o: {layer?: number; yaw?: number; sw?: number; depthBias?: number} = {}): Item[] => {
  const yaw = o.yaw ?? 0;
  const R = (p: V3): V3 => ({x: c.x + p.x * Math.cos(yaw) + p.z * Math.sin(yaw), y: c.y + p.y, z: c.z - p.x * Math.sin(yaw) + p.z * Math.cos(yaw)});
  const faces: [V3, V3[], string][] = [
    [{x: 0, y: 1, z: 0}, [{x: -1, y: 1, z: -1}, {x: 1, y: 1, z: -1}, {x: 1, y: 1, z: 1}, {x: -1, y: 1, z: 1}], cols.top],
    [{x: 0, y: -1, z: 0}, [{x: -1, y: -1, z: -1}, {x: -1, y: -1, z: 1}, {x: 1, y: -1, z: 1}, {x: 1, y: -1, z: -1}], shade(cols.side, 0.3)],
    [{x: 0, y: 0, z: 1}, [{x: -1, y: -1, z: 1}, {x: -1, y: 1, z: 1}, {x: 1, y: 1, z: 1}, {x: 1, y: -1, z: 1}], cols.front],
    [{x: 0, y: 0, z: -1}, [{x: -1, y: -1, z: -1}, {x: 1, y: -1, z: -1}, {x: 1, y: 1, z: -1}, {x: -1, y: 1, z: -1}], cols.front],
    [{x: 1, y: 0, z: 0}, [{x: 1, y: -1, z: -1}, {x: 1, y: -1, z: 1}, {x: 1, y: 1, z: 1}, {x: 1, y: 1, z: -1}], cols.side],
    [{x: -1, y: 0, z: 0}, [{x: -1, y: -1, z: -1}, {x: -1, y: 1, z: -1}, {x: -1, y: 1, z: 1}, {x: -1, y: -1, z: 1}], cols.side],
  ];
  const out: Item[] = [];
  const cen = R({x: 0, y: 0, z: 0});
  const cdepth = P.camSpace(cen).z + (o.depthBias ?? 0);
  for (const [n, q, col] of faces) {
    const pts = q.map((v) => R({x: v.x * h.x, y: v.y * h.y, z: v.z * h.z}));
    const nw = sub(R(n), cen);
    const fc = R({x: n.x * h.x, y: n.y * h.y, z: n.z * h.z});
    const toEye = sub(P.cam.eye, fc);
    if (dot(nw, toEye) <= 0) continue;
    const it = poly(P, pts, col, {layer: o.layer, sw: o.sw ?? 3});
    if (it) out.push({...it, depth: cdepth});
  }
  return out;
};

/** paint items: by layer, then far to near */
export const Paint: React.FC<{items: (Item | null | undefined | false)[]}> = ({items}) => {
  const list = items.filter(Boolean) as Item[];
  list.sort((a, b) => a.layer - b.layer || b.depth - a.depth);
  // keys must be unique within a frame: two objects can share a link id (two robots each have a module "M"), and a
  // duplicate key makes React keep stale elements from earlier frames
  const seen = new Map<string, number>();
  const key = (k: string) => {
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n ? `${k}~${n}` : k;
  };
  return <>{list.map((it) => <React.Fragment key={key(it.key)}>{it.el}</React.Fragment>)}</>;
};

export type SortStats = {pairs: number; cycles: number; edges: [number, number][]};

/** (V3) the paint order of a layer of items: exact pairwise occlusion for solids, topological, far-to-near tie-break.
 *  Returns the ordered items and, for the probe, the overlap edges (back index, front index into the input) and the
 *  number of cycles that had to be broken (expected 0). */
export const sort3 = (list: Item[], P: Proj): {items: Item[]; stats: SortStats} => {
  const n = list.length;
  const cx = W / 2 + (P.cam.ox ?? 0), cy = H / 2 + (P.cam.oy ?? 0), f = P.cam.f;
  const ray = (p: {x: number; y: number}): V3 => ({x: (p.x - cx) / f, y: -(p.y - cy) / f, z: 1});
  const succ: number[][] = Array.from({length: n}, () => []);
  const indeg = new Array(n).fill(0);
  const edges: [number, number][] = [];
  let pairs = 0;
  // screen bounding boxes for a quick reject
  const bb = list.map((it) => {
    if (!it.sh) return null;
    const r = Math.max(it.sh.rp, it.sh.rq);
    return [Math.min(it.sh.p.x, it.sh.q.x) - r, Math.min(it.sh.p.y, it.sh.q.y) - r, Math.max(it.sh.p.x, it.sh.q.x) + r, Math.max(it.sh.p.y, it.sh.q.y) + r];
  });
  for (let i = 0; i < n; i++) {
    const A = list[i];
    if (!A.sh || !A.cs) continue;
    for (let j = i + 1; j < n; j++) {
      const B = list[j];
      if (!B.sh || !B.cs || A.layer !== B.layer) continue;
      const a = bb[i]!, b = bb[j]!;
      if (a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]) continue;
      let front: number;
      if (A.grp !== undefined && A.grp === B.grp && A.axr && B.axr && A.axP && A.axU) {
        // same link: at the boundary between the two pieces, the one on the camera's side of it is in front
        if (!overlapPoint(A.sh, B.sh, 0.5)) continue;
        const [lo, hi] = A.axr[0] < B.axr[0] ? [i, j] : [j, i];
        const sx = (list[lo].axr![1] + list[hi].axr![0]) / 2;
        const X = {x: A.axP.x + A.axU.x * sx, y: A.axP.y + A.axU.y * sx, z: A.axP.z + A.axU.z * sx};
        front = -(A.axU.x * X.x + A.axU.y * X.y + A.axU.z * X.z) > 0 ? hi : lo;
      } else {
        // the first sample point whose ray hits both solids decides (no such point: the pictures do not overlap)
        let fr = -1;
        for (const p of overlapPoints(A.sh, B.sh)) {
          const d = ray(p);
          const ta = rayHit(d, A.cs), tb = rayHit(d, B.cs);
          if (ta < Infinity && tb < Infinity) {
            fr = ta < tb ? i : j;
            break;
          }
        }
        if (fr < 0) continue;
        front = fr;
      }
      const back = front === i ? j : i;
      succ[back].push(front);
      indeg[front]++;
      edges.push([back, front]);
      pairs++;
    }
  }
  // Kahn, always taking the farthest ready item (stable far-to-near among unconstrained items)
  const done = new Array(n).fill(false);
  const out: Item[] = [];
  let cycles = 0;
  for (let k = 0; k < n; k++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (pick < 0 || list[i].depth > list[pick].depth)) pick = i;
    if (pick < 0) {
      // a cycle: break it at the farthest remaining item (counted; the probe requires none)
      cycles++;
      for (let i = 0; i < n; i++) if (!done[i] && (pick < 0 || list[i].depth > list[pick].depth)) pick = i;
    }
    done[pick] = true;
    out.push(list[pick]);
    for (const s2 of succ[pick]) indeg[s2]--;
  }
  return {items: out, stats: {pairs, cycles, edges}};
};

/** (V3) paint items by layer, each layer in exact occlusion order */
export const order3 = (items: (Item | null | undefined | false)[], P: Proj): {items: Item[]; stats: SortStats[]} => {
  const list = items.filter(Boolean) as Item[];
  const layers = [...new Set(list.map((i) => i.layer))].sort((a, b) => a - b);
  const out: Item[] = [];
  const stats: SortStats[] = [];
  for (const L of layers) {
    const r = sort3(list.filter((i) => i.layer === L), P);
    out.push(...r.items);
    stats.push(r.stats);
  }
  return {items: out, stats};
};

export const Paint3: React.FC<{items: (Item | null | undefined | false)[]; P: Proj}> = ({items, P}) => {
  const {items: list} = order3(items, P);
  const seen = new Map<string, number>();
  const key = (k: string) => {
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n ? `${k}~${n}` : k;
  };
  return <>{list.map((it) => <React.Fragment key={key(it.key)}>{it.el}</React.Fragment>)}</>;
};

export {len};
