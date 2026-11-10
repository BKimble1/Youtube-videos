// V2 liquid-metal engine: signed-distance primitives (screen px) + polynomial smooth-min, and world-space primitives
// projected through the world.ts cameras.
//
// Conventions. Screen prims are in px, y DOWN. A negative distance is inside. Every prim may carry
//   z      depth (world units; world `d` when it comes from projectPrims) used by the depth field (depthSplit),
//   za/zb  per-end depth on capsules (a capsule crossing the bar plane has a depth gradient along it),
//   blend  its own smooth-min radius (px) when it is folded into its group,
//   g      group index (0 = default). Groups are folded into the union in ascending g with ChromeBody's group blend,
//          and drawn back (low g) to front (high g) for the internal definition of rigid bodies (seams, part shading).
// Pure functions only (no state, no randomness).
import {Cam3, P3, project, toCam} from '../../world';

export type PrimBase = {z?: number; blend?: number; g?: number};
export type PrimC = PrimBase & {k: 'c'; x: number; y: number; r: number};
/** tapered capsule from a (radius ra) to b (radius rb) */
export type PrimCap = PrimBase & {k: 'cap'; ax: number; ay: number; bx: number; by: number; ra: number; rb: number; za?: number; zb?: number};
/** rounded box: centre, half sizes, corner radius, rotation (deg, clockwise on screen) */
export type PrimBox = PrimBase & {k: 'box'; x: number; y: number; hw: number; hh: number; r: number; rot: number};
/** ellipse: centre, radii, rotation (deg) */
export type PrimEll = PrimBase & {k: 'ell'; x: number; y: number; rx: number; ry: number; rot: number};
/** rounded isosceles trapezoid: top half-width wt, bottom half-width wb, half height hh, corner radius r, rotation (deg) */
export type PrimTrap = PrimBase & {k: 'trap'; x: number; y: number; wt: number; wb: number; hh: number; r: number; rot: number};
/** affine circle (any ellipse given by two conjugate semi-axes u, v from the centre) - floor discs seen in perspective */
export type PrimAff = PrimBase & {k: 'aff'; x: number; y: number; ux: number; uy: number; vx: number; vy: number};
/** continuous morph between two prims: distance = lerp(sd(a), sd(b), t) (a rigid part -> its liquid shape) */
export type PrimMix = PrimBase & {k: 'mix'; a: Prim; b: Prim; t: number};
export type Prim = PrimC | PrimCap | PrimBox | PrimEll | PrimTrap | PrimAff | PrimMix;

// ---------------------------------------------------------------------------------------------------------------
// smooth minimum (polynomial, iq): k = blend radius in the same units as the distances. k <= 0 -> hard min.
export const smin = (a: number, b: number, k: number) => {
  if (k <= 1e-6) return a < b ? a : b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** blend weight of b in smin(a, b, k): 0 = all a, 1 = all b (for blending attributes such as depth) */
export const sminW = (a: number, b: number, k: number) => {
  if (k <= 1e-6) return a < b ? 0 : 1;
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (a - b)) / k));
  return h;
};

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// distance functions
const sdCap = (px: number, py: number, p: PrimCap) => {
  const dx = p.bx - p.ax, dy = p.by - p.ay;
  const h = Math.hypot(dx, dy);
  const qx0 = px - p.ax, qy0 = py - p.ay;
  if (h < 1e-6) return Math.hypot(qx0, qy0) - Math.max(p.ra, p.rb);
  // local frame: y along a->b
  const uy = dx / h, vy = dy / h; // axis
  let lx = qx0 * vy - qy0 * uy; // perpendicular
  const ly = qx0 * uy + qy0 * vy; // along
  lx = Math.abs(lx);
  const r1 = p.ra, r2 = p.rb;
  const b = (r1 - r2) / h;
  if (Math.abs(b) >= 1) return Math.min(Math.hypot(lx, ly) - r1, Math.hypot(lx, ly - h) - r2);
  const a = Math.sqrt(1 - b * b);
  const k = lx * -b + ly * a;
  if (k < 0) return Math.hypot(lx, ly) - r1;
  if (k > a * h) return Math.hypot(lx, ly - h) - r2;
  return lx * a + ly * b - r1;
};
/** the capsule's axis parameter (0 at a, 1 at b) of the closest axis point, for per-end attributes */
export const capParam = (px: number, py: number, p: PrimCap) => {
  const dx = p.bx - p.ax, dy = p.by - p.ay;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-9) return 0.5;
  return Math.min(1, Math.max(0, ((px - p.ax) * dx + (py - p.ay) * dy) / L2));
};
const rot = (px: number, py: number, x: number, y: number, deg: number) => {
  const dx = px - x, dy = py - y;
  if (!deg) return [dx, dy];
  const c = Math.cos(-deg * DEG), s = Math.sin(-deg * DEG);
  return [dx * c - dy * s, dx * s + dy * c];
};
const sdBox = (px: number, py: number, p: PrimBox) => {
  const [lx, ly] = rot(px, py, p.x, p.y, p.rot);
  const r = Math.max(0, Math.min(p.r, p.hw, p.hh));
  const qx = Math.abs(lx) - (p.hw - r), qy = Math.abs(ly) - (p.hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const sdEll = (px: number, py: number, rx: number, ry: number) => {
  rx = Math.max(rx, 1e-3);
  ry = Math.max(ry, 1e-3);
  const k0 = Math.hypot(px / rx, py / ry);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry));
  if (k1 < 1e-9) return -Math.min(rx, ry);
  return (k0 * (k0 - 1)) / k1;
};
const sdTrap = (px: number, py: number, p: PrimTrap) => {
  const [lx0, ly0] = rot(px, py, p.x, p.y, p.rot);
  const r = Math.max(0, Math.min(p.r, p.hh, p.wt, p.wb));
  // iq sdTrapezoid with y up: r1 = bottom half-width (y = -he), r2 = top half-width (y = +he)
  const r1 = p.wb - r, r2 = p.wt - r, he = p.hh - r;
  const x = Math.abs(lx0), y = -ly0;
  const k1x = r2, k1y = he, k2x = r2 - r1, k2y = 2 * he;
  const cax = x - Math.min(x, y < 0 ? r1 : r2), cay = Math.abs(y) - he;
  const kk = k2x * k2x + k2y * k2y;
  const tt = kk > 1e-9 ? Math.min(1, Math.max(0, ((k1x - x) * k2x + (k1y - y) * k2y) / kk)) : 0;
  const cbx = x - k1x + k2x * tt, cby = y - k1y + k2y * tt;
  const s = cbx < 0 && cay < 0 ? -1 : 1;
  return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby)) - r;
};
const sdAff = (px: number, py: number, p: PrimAff) => {
  // q = M^-1 (p - c), M = [u v]; distance ~ (|q| - 1) / |grad|
  const det = p.ux * p.vy - p.vx * p.uy;
  if (Math.abs(det) < 1e-6) {
    // degenerate (edge-on disc): a capsule along the longer axis with zero radius -> thin line, use 0.5px
    const L = Math.hypot(p.ux, p.uy) > Math.hypot(p.vx, p.vy) ? {x: p.ux, y: p.uy} : {x: p.vx, y: p.vy};
    return sdCap(px, py, {k: 'cap', ax: p.x - L.x, ay: p.y - L.y, bx: p.x + L.x, by: p.y + L.y, ra: 0.5, rb: 0.5});
  }
  const dx = px - p.x, dy = py - p.y;
  const qx = (dx * p.vy - dy * p.vx) / det, qy = (-dx * p.uy + dy * p.ux) / det;
  const ql = Math.hypot(qx, qy);
  if (ql < 1e-9) return -Math.min(Math.hypot(p.ux, p.uy), Math.hypot(p.vx, p.vy));
  // gradient of |q| wrt p = M^-T (q/|q|)
  const nx = qx / ql, ny = qy / ql;
  const gx = (nx * p.vy - ny * p.uy) / det, gy = (-nx * p.vx + ny * p.ux) / det;
  const g = Math.hypot(gx, gy);
  return (ql - 1) / Math.max(g, 1e-9);
};

export const sdPrim = (p: Prim, x: number, y: number): number => {
  switch (p.k) {
    case 'c':
      return Math.hypot(x - p.x, y - p.y) - p.r;
    case 'cap':
      return sdCap(x, y, p);
    case 'box':
      return sdBox(x, y, p);
    case 'ell': {
      const [lx, ly] = rot(x, y, p.x, p.y, p.rot);
      return sdEll(lx, ly, p.rx, p.ry);
    }
    case 'trap':
      return sdTrap(x, y, p);
    case 'aff':
      return sdAff(x, y, p);
    case 'mix': {
      if (p.t <= 0) return sdPrim(p.a, x, y);
      if (p.t >= 1) return sdPrim(p.b, x, y);
      return sdPrim(p.a, x, y) * (1 - p.t) + sdPrim(p.b, x, y) * p.t;
    }
  }
};

/** depth of a prim at a point (capsules interpolate za -> zb along their axis) */
export const primZ = (p: Prim, x: number, y: number): number => {
  if (p.k === 'mix') return p.z ?? primZ(p.a, x, y) * (1 - p.t) + primZ(p.b, x, y) * p.t;
  if (p.k === 'cap' && p.za !== undefined && p.zb !== undefined) return p.za + (p.zb - p.za) * capParam(x, y, p);
  return p.z ?? 0;
};

/** axis-aligned bounds of a prim (px) */
export const primBox = (p: Prim): {x0: number; y0: number; x1: number; y1: number} => {
  switch (p.k) {
    case 'mix': {
      if (p.t <= 0) return primBox(p.a);
      if (p.t >= 1) return primBox(p.b);
      const a = primBox(p.a), b = primBox(p.b);
      return {x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1)};
    }
    case 'c':
      return {x0: p.x - p.r, y0: p.y - p.r, x1: p.x + p.r, y1: p.y + p.r};
    case 'cap': {
      const r = Math.max(p.ra, p.rb);
      return {x0: Math.min(p.ax, p.bx) - r, y0: Math.min(p.ay, p.by) - r, x1: Math.max(p.ax, p.bx) + r, y1: Math.max(p.ay, p.by) + r};
    }
    case 'box':
    case 'trap': {
      const hw = p.k === 'box' ? p.hw : Math.max(p.wt, p.wb);
      const c = Math.abs(Math.cos(p.rot * DEG)), s = Math.abs(Math.sin(p.rot * DEG));
      const ex = hw * c + p.hh * s, ey = hw * s + p.hh * c;
      return {x0: p.x - ex, y0: p.y - ey, x1: p.x + ex, y1: p.y + ey};
    }
    case 'ell': {
      const c = Math.cos(p.rot * DEG), s = Math.sin(p.rot * DEG);
      const ex = Math.hypot(p.rx * c, p.ry * s), ey = Math.hypot(p.rx * s, p.ry * c);
      return {x0: p.x - ex, y0: p.y - ey, x1: p.x + ex, y1: p.y + ey};
    }
    case 'aff': {
      const ex = Math.hypot(p.ux, p.vx), ey = Math.hypot(p.uy, p.vy);
      return {x0: p.x - ex, y0: p.y - ey, x1: p.x + ex, y1: p.y + ey};
    }
  }
};

export type Box = {x0: number; y0: number; x1: number; y1: number};
export const primsBox = (prims: Prim[], pad = 0): Box => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of prims) {
    const b = primBox(p);
    if (b.x0 < x0) x0 = b.x0;
    if (b.y0 < y0) y0 = b.y0;
    if (b.x1 > x1) x1 = b.x1;
    if (b.y1 > y1) y1 = b.y1;
  }
  if (!isFinite(x0)) return {x0: 0, y0: 0, x1: 1, y1: 1};
  return {x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad};
};

/** smooth union of prims at a point (each prim folded with its own blend, else `blend`) */
export const sdField = (prims: Prim[], blend: number, x: number, y: number) => {
  let acc = 1e9;
  for (const p of prims) acc = smin(acc, sdPrim(p, x, y), p.blend ?? blend);
  return acc;
};
/** field + smooth-min-weighted depth at a point */
export const sdFieldZ = (prims: Prim[], blend: number, x: number, y: number) => {
  let acc = 1e9, z = 0;
  let first = true;
  for (const p of prims) {
    const d = sdPrim(p, x, y), k = p.blend ?? blend;
    const pz = primZ(p, x, y);
    if (first) {
      acc = d;
      z = pz;
      first = false;
      continue;
    }
    const w = sminW(acc, d, Math.max(k, 1e-3));
    z = z + (pz - z) * w;
    acc = smin(acc, d, k);
  }
  return {d: acc, z};
};

// ---------------------------------------------------------------------------------------------------------------
// world-space primitives (world units; see world.ts: x right, h up, d away from the viewer)
export type Prim3Base = {blend?: number; g?: number};
export type Prim3S = Prim3Base & {k: 's'; p: P3; r: number};
export type Prim3Cap = Prim3Base & {k: 'cap3'; a: P3; b: P3; ra: number; rb: number};
/** billboard rounded box (faces the camera; sizes in world units at p's depth; rot = screen roll, deg) */
export type Prim3Box = Prim3Base & {k: 'box3'; p: P3; hw: number; hh: number; r: number; rot?: number};
/** billboard rounded trapezoid (wt top half-width, wb bottom half-width) */
export type Prim3Trap = Prim3Base & {k: 'trap3'; p: P3; wt: number; wb: number; hh: number; r: number; rot?: number};
/** billboard ellipse */
export type Prim3Ell = Prim3Base & {k: 'ell3'; p: P3; rx: number; ry: number; rot?: number};
/** horizontal floor disc / ellipse on the plane h = p.h (rx along x, rd along d, rot = yaw on the floor, deg) */
export type Prim3Disc = Prim3Base & {k: 'disc3'; p: P3; rx: number; rd: number; rot?: number};
/** continuous morph between two world prims */
export type Prim3Mix = Prim3Base & {k: 'mix3'; a: Prim3; b: Prim3; t: number};
export type Prim3 = Prim3S | Prim3Cap | Prim3Box | Prim3Trap | Prim3Ell | Prim3Disc | Prim3Mix;

/** camera roll of the world vertical at a point (deg): billboards stay upright in a pitched / yawed camera */
const uprightRoll = (cam: Cam3, p: P3) => {
  const a = project(cam, p), b = project(cam, {x: p.x, h: p.h + 0.5, d: p.d});
  const ang = Math.atan2(b.x - a.x, -(b.y - a.y)); // 0 when "up" is screen-up
  return (ang * 180) / Math.PI;
};

/** project world prims to screen prims (perspective sizes from world.project; z = world d) */
export const projectPrims = (cam: Cam3, prims3: Prim3[]): Prim[] => {
  const out: Prim[] = [];
  for (const q of prims3) {
    // a world blend radius (world units) becomes px at the prim's depth
    const anchor: P3 = q.k === 'cap3' ? {x: (q.a.x + q.b.x) / 2, h: (q.a.h + q.b.h) / 2, d: (q.a.d + q.b.d) / 2} : q.k === 'mix3' ? (q.a as {p?: P3}).p ?? (q.a as {a: P3}).a : q.p;
    const base = {blend: q.blend !== undefined ? q.blend * project(cam, anchor).s : undefined, g: q.g};
    switch (q.k) {
      case 'mix3': {
        const [a] = projectPrims(cam, [q.a]), [b] = projectPrims(cam, [q.b]);
        if (a && b) out.push({...base, k: 'mix', a, b, t: q.t});
        else if (a || b) out.push({...(a ?? b)!, ...base});
        break;
      }
      case 's': {
        const s = project(cam, q.p);
        if (toCam(cam, q.p).z < 0.3) break;
        out.push({...base, k: 'c', x: s.x, y: s.y, r: q.r * s.s, z: q.p.d});
        break;
      }
      case 'cap3': {
        if (toCam(cam, q.a).z < 0.3 || toCam(cam, q.b).z < 0.3) break;
        const a = project(cam, q.a), b = project(cam, q.b);
        out.push({...base, k: 'cap', ax: a.x, ay: a.y, bx: b.x, by: b.y, ra: q.ra * a.s, rb: q.rb * b.s, za: q.a.d, zb: q.b.d, z: (q.a.d + q.b.d) / 2});
        break;
      }
      case 'box3':
      case 'trap3':
      case 'ell3': {
        if (toCam(cam, q.p).z < 0.3) break;
        const s = project(cam, q.p);
        const roll = uprightRoll(cam, q.p) + (q.rot ?? 0);
        // vertical foreshortening of a billboard in a pitched camera is ignored on purpose (billboards face the camera)
        if (q.k === 'box3') out.push({...base, k: 'box', x: s.x, y: s.y, hw: q.hw * s.s, hh: q.hh * s.s, r: q.r * s.s, rot: roll, z: q.p.d});
        else if (q.k === 'trap3') out.push({...base, k: 'trap', x: s.x, y: s.y, wt: q.wt * s.s, wb: q.wb * s.s, hh: q.hh * s.s, r: q.r * s.s, rot: roll, z: q.p.d});
        else out.push({...base, k: 'ell', x: s.x, y: s.y, rx: q.rx * s.s, ry: q.ry * s.s, rot: roll, z: q.p.d});
        break;
      }
      case 'disc3': {
        if (toCam(cam, q.p).z < 0.3) break;
        const c = project(cam, q.p);
        const r = ((q.rot ?? 0) * Math.PI) / 180;
        const ex = {x: Math.cos(r), d: Math.sin(r)}, ed = {x: -Math.sin(r), d: Math.cos(r)};
        // conjugate semi-axes from the projected axis endpoints (symmetric differences: good affine estimate)
        const pa = project(cam, {x: q.p.x + ex.x * q.rx, h: q.p.h, d: q.p.d + ex.d * q.rx});
        const pb = project(cam, {x: q.p.x - ex.x * q.rx, h: q.p.h, d: q.p.d - ex.d * q.rx});
        const pc = project(cam, {x: q.p.x + ed.x * q.rd, h: q.p.h, d: q.p.d + ed.d * q.rd});
        const pd = project(cam, {x: q.p.x - ed.x * q.rd, h: q.p.h, d: q.p.d - ed.d * q.rd});
        const cx = (pa.x + pb.x + pc.x + pd.x) / 4, cy = (pa.y + pb.y + pc.y + pd.y) / 4;
        void c;
        out.push({...base, k: 'aff', x: cx, y: cy, ux: (pa.x - pb.x) / 2, uy: (pa.y - pb.y) / 2, vx: (pc.x - pd.x) / 2, vy: (pc.y - pd.y) / 2, z: q.p.d});
        break;
      }
    }
  }
  return out;
};

/** px per world unit at a world point */
export const pxPerUnit = (cam: Cam3, p: P3) => project(cam, p).s;
