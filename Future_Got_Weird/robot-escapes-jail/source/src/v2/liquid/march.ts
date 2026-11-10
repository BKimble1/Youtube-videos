// V2 liquid-metal engine: marching squares -> crisp vector SVG paths.
//
// Grid nodes are sampled on a regular lattice (cell px) over a box. Inside = value < level. Each cell emits oriented
// segments (linear interpolation on its edges, saddles disambiguated by the cell-centre average), the segments are
// chained into closed loops through shared edge ids, and the loops are written as a smooth closed B-spline (quadratic
// segments through edge midpoints = one Chaikin limit pass). Border nodes count as outside, so every loop closes (a
// body leaving the box is closed along the box border, which callers keep outside the frame). Loops are consistently
// oriented, so holes come out with the opposite winding and the signed shoelace sum is the region's area; paths are
// drawn with fill-rule evenodd.
import type {Box} from './sdf';

export type V = {x: number; y: number};
export type Loop = V[];

/** adaptive cell size (px) for a body of on-screen size `size` px: size/120 clamped to [lo, hi] */
export const cellFor = (size: number, lo = 3, hi = 8) => Math.min(hi, Math.max(lo, size / 120));

export type Lattice = {x0: number; y0: number; cell: number; nx: number; ny: number};

/** a lattice covering `box` with spacing `cell` (at least 3x3 nodes) */
export const lattice = (box: Box, cell: number): Lattice => {
  const c = Math.max(1e-4, cell);
  const nx = Math.max(3, Math.ceil((box.x1 - box.x0) / c) + 1);
  const ny = Math.max(3, Math.ceil((box.y1 - box.y0) / c) + 1);
  return {x0: box.x0, y0: box.y0, cell: c, nx, ny};
};

/** sample fn on the lattice nodes */
export const sample = (L: Lattice, fn: (x: number, y: number) => number): Float32Array => {
  const out = new Float32Array(L.nx * L.ny);
  for (let j = 0; j < L.ny; j++) {
    const y = L.y0 + j * L.cell;
    for (let i = 0; i < L.nx; i++) out[j * L.nx + i] = fn(L.x0 + i * L.cell, y);
  }
  return out;
};

/** bilinear lookup at fractional node coordinates (clamped to the lattice) */
export const bilerp = (a: Float32Array, nx: number, ny: number, fi: number, fj: number) => {
  if (fi < 0) fi = 0;
  else if (fi > nx - 1.0001) fi = nx - 1.0001;
  if (fj < 0) fj = 0;
  else if (fj > ny - 1.0001) fj = ny - 1.0001;
  const i = fi | 0, j = fj | 0;
  const u = fi - i, v = fj - j;
  const k = j * nx + i;
  const a00 = a[k], a10 = a[k + 1], a01 = a[k + nx], a11 = a[k + nx + 1];
  return (a00 * (1 - u) + a10 * u) * (1 - v) + (a01 * (1 - u) + a11 * u) * v;
};

/** marching squares: closed, consistently oriented loops of the region vals < level */
export const marchLoops = (vals: Float32Array, L: Lattice, level = 0): Loop[] => {
  const {nx, ny, x0, y0, cell} = L;
  const OUT = level + 1e-4;
  const v = (i: number, j: number) => {
    if (i <= 0 || j <= 0 || i >= nx - 1 || j >= ny - 1) return Math.max(vals[j * nx + i], OUT);
    return vals[j * nx + i];
  };
  // edge ids: horizontal edge (i,j)-(i+1,j) = 2*(j*nx+i), vertical edge (i,j)-(i,j+1) = 2*(j*nx+i)+1
  const pts = new Map<number, V>();
  const edgePt = (id: number): V => {
    let p = pts.get(id);
    if (p) return p;
    const n = id >> 1, i = n % nx, j = (n / nx) | 0;
    const va = v(i, j);
    const vb = (id & 1) === 0 ? v(i + 1, j) : v(i, j + 1);
    const d = vb - va;
    let t = Math.abs(d) < 1e-12 ? 0.5 : (level - va) / d;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    p = (id & 1) === 0 ? {x: x0 + (i + t) * cell, y: y0 + j * cell} : {x: x0 + i * cell, y: y0 + (j + t) * cell};
    pts.set(id, p);
    return p;
  };
  const next = new Map<number, number>();
  const ins = [false, false, false, false];
  const ed = [0, 0, 0, 0];
  const vs = [0, 0, 0, 0];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      // corners clockwise on screen: c0 (i,j), c1 (i+1,j), c2 (i+1,j+1), c3 (i,j+1)
      vs[0] = v(i, j);
      vs[1] = v(i + 1, j);
      vs[2] = v(i + 1, j + 1);
      vs[3] = v(i, j + 1);
      let mask = 0;
      for (let q = 0; q < 4; q++) {
        ins[q] = vs[q] < level;
        if (ins[q]) mask |= 1 << q;
      }
      if (mask === 0 || mask === 15) continue;
      const b = j * nx + i;
      ed[0] = 2 * b; // c0-c1 top
      ed[1] = 2 * (b + 1) + 1; // c1-c2 right
      ed[2] = 2 * (b + nx); // c2-c3 bottom (stored as (i,j+1)-(i+1,j+1))
      ed[3] = 2 * b + 1; // c3-c0 left
      // crossings in boundary order: in->out (segment start) / out->in (segment end)
      const starts: number[] = [], ends: number[] = [];
      const order: {e: number; s: boolean}[] = [];
      for (let q = 0; q < 4; q++) {
        const a = ins[q], c = ins[(q + 1) & 3];
        if (a !== c) order.push({e: ed[q], s: a});
      }
      for (const o of order) (o.s ? starts : ends).push(o.e);
      if (order.length === 2) {
        next.set(starts[0], ends[0]);
      } else if (order.length === 4) {
        // cyclic order alternates start/end; centre decides which pairs connect
        const centre = (vs[0] + vs[1] + vs[2] + vs[3]) / 4 < level;
        const k0 = order[0].s ? 0 : 1; // index of first start
        const a1 = order[k0].e, b1 = order[(k0 + 1) % 4].e, a2 = order[(k0 + 2) % 4].e, b2 = order[(k0 + 3) % 4].e;
        if (centre) {
          next.set(a1, b1);
          next.set(a2, b2);
        } else {
          next.set(a1, b2);
          next.set(a2, b1);
        }
      }
    }
  }
  const loops: Loop[] = [];
  const seen = new Set<number>();
  for (const s of next.keys()) {
    if (seen.has(s)) continue;
    const loop: V[] = [];
    let e: number | undefined = s;
    let guard = 0;
    while (e !== undefined && !seen.has(e) && guard++ < 1e6) {
      seen.add(e);
      loop.push(edgePt(e));
      e = next.get(e);
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
};

/** signed shoelace area of a loop */
export const loopArea = (p: Loop) => {
  let a = 0;
  for (let i = 0, n = p.length; i < n; i++) {
    const q = p[i], r = p[(i + 1) % n];
    a += q.x * r.y - r.x * q.y;
  }
  return a / 2;
};
/** area of an evenodd region (sum of signed loop areas, made positive) */
export const loopsArea = (loops: Loop[]) => Math.abs(loops.reduce((s, l) => s + loopArea(l), 0));

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** loops -> smooth closed path (quadratic B-spline through the edge midpoints). Loops below minArea px^2 drop. */
export const loopsPath = (loops: Loop[], minArea = 1.2): string => {
  let d = '';
  for (const p of loops) {
    const n = p.length;
    if (n < 3 || Math.abs(loopArea(p)) < minArea) continue;
    const m = (k: number) => {
      const a = p[k % n], b = p[(k + 1) % n];
      return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    };
    const m0 = m(0);
    d += `M${f1(m0.x)},${f1(m0.y)}`;
    for (let k = 1; k <= n; k++) {
      const c = p[k % n], e = m(k);
      d += `Q${f1(c.x)},${f1(c.y)} ${f1(e.x)},${f1(e.y)}`;
    }
    d += 'Z';
  }
  return d;
};

/** open polyline -> smooth path */
export const openPath = (ps: V[]) => {
  if (ps.length < 2) return '';
  let d = `M${f1(ps[0].x)},${f1(ps[0].y)}`;
  for (let i = 1; i < ps.length - 1; i++) {
    const e = {x: (ps[i].x + ps[i + 1].x) / 2, y: (ps[i].y + ps[i + 1].y) / 2};
    d += `Q${f1(ps[i].x)},${f1(ps[i].y)} ${f1(e.x)},${f1(e.y)}`;
  }
  const l = ps[ps.length - 1];
  return d + `L${f1(l.x)},${f1(l.y)}`;
};

/** one-call contour: the region fn < level over box, as an evenodd path */
export const isoPath = (fn: (x: number, y: number) => number, box: Box, cell: number, level = 0): string => {
  const L = lattice(box, cell);
  return loopsPath(marchLoops(sample(L, fn), L, level));
};
/** one-call contour loops */
export const isoLoops = (fn: (x: number, y: number) => number, box: Box, cell: number, level = 0): Loop[] => {
  const L = lattice(box, cell);
  return marchLoops(sample(L, fn), L, level);
};
