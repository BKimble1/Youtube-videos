// World geometry: paths on the substrate plane and the 2.5D camera.
// World: X right, Y "forward" across the table, Z up (units are roughly 0.1 mm: the slug is 100 long).
import {H, W, lerp} from './lib';

export type P3 = [number, number, number];
export type P2 = [number, number];

/** a smooth path on the substrate plane, parametrised by arc length */
export class Path {
  xs: number[] = [];
  ys: number[] = [];
  cum: number[] = [];
  len = 0;
  constructor(ctrl: P2[], n = 800) {
    const segs = ctrl.length - 1;
    const m = Math.max(4, Math.ceil(n / segs));
    for (let i = 0; i < segs; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let j = 0; j < m; j++) {
        const t = j / m, t2 = t * t, t3 = t2 * t;
        const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        this.xs.push(f(p0[0], p1[0], p2[0], p3[0]));
        this.ys.push(f(p0[1], p1[1], p2[1], p3[1]));
      }
    }
    this.xs.push(ctrl[segs][0]);
    this.ys.push(ctrl[segs][1]);
    this.cum = [0];
    for (let i = 1; i < this.xs.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(this.xs[i] - this.xs[i - 1], this.ys[i] - this.ys[i - 1]));
    this.len = this.cum[this.cum.length - 1];
  }
  /** position and unit tangent at arc length s (extrapolated straight beyond the ends) */
  at(s: number): {x: number; y: number; tx: number; ty: number} {
    const n = this.xs.length;
    if (s <= 0 || s >= this.len) {
      const i = s <= 0 ? 0 : n - 2;
      const tx = this.xs[i + 1] - this.xs[i], ty = this.ys[i + 1] - this.ys[i], l = Math.hypot(tx, ty);
      const base = s <= 0 ? 0 : n - 1, d = s <= 0 ? s : s - this.len;
      return {x: this.xs[base] + (tx / l) * d, y: this.ys[base] + (ty / l) * d, tx: tx / l, ty: ty / l};
    }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const t = (s - this.cum[lo]) / (this.cum[hi] - this.cum[lo]);
    // tangent from a wider stencil so it turns smoothly
    const a = Math.max(0, lo - 2), b = Math.min(n - 1, hi + 2);
    const tx = this.xs[b] - this.xs[a], ty = this.ys[b] - this.ys[a], l = Math.hypot(tx, ty);
    return {x: lerp(this.xs[lo], this.xs[hi], t), y: lerp(this.ys[lo], this.ys[hi], t), tx: tx / l, ty: ty / l};
  }
}

/** camera: looks at (x, y) on the substrate; yaw = world direction that reads as "up" on screen (radians);
 *  tilt = view angle above the plane (90 = straight down); zoom = px per unit at the target; (ox, oy) = where the
 *  target sits on screen; dist = camera distance in units (perspective strength) */
export type Cam = {x: number; y: number; yaw: number; tilt: number; zoom: number; ox?: number; oy?: number; dist?: number; roll?: number};

export const camLerp = (a: Cam, b: Cam, t: number): Cam => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), yaw: lerp(a.yaw, b.yaw, t), tilt: lerp(a.tilt, b.tilt, t),
  zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)), ox: lerp(a.ox ?? W / 2, b.ox ?? W / 2, t),
  oy: lerp(a.oy ?? H / 2, b.oy ?? H / 2, t), dist: lerp(a.dist ?? 420, b.dist ?? 420, t), roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
});

export type Proj = ((p: P3) => P2) & {scaleAt: (p: P3) => number; cam: Cam};

export const projector = (c: Cam): Proj => {
  const fx = Math.cos(c.yaw), fy = Math.sin(c.yaw); // plane forward (screen up when looking down)
  const rx = fy, ry = -fx; // plane right
  const ph = (c.tilt * Math.PI) / 180, sp = Math.sin(ph), cp = Math.cos(ph);
  const dist = c.dist ?? 420, ox = c.ox ?? W / 2, oy = c.oy ?? H / 2;
  const cr = Math.cos(c.roll ?? 0), sr = Math.sin(c.roll ?? 0);
  const k = (p: P3) => {
    const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2];
    const depth = (dx * fx + dy * fy) * cp - dz * sp; // along the view direction
    return dist / Math.max(dist * 0.25, dist + depth);
  };
  const f = ((p: P3): P2 => {
    const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2];
    const u = dx * rx + dy * ry; // screen right
    const v = (dx * fx + dy * fy) * sp + dz * cp; // screen up
    const s = c.zoom * k(p);
    const X = u * s, Y = v * s;
    return [ox + X * cr - Y * sr, oy - (X * sr + Y * cr)];
  }) as Proj;
  f.scaleAt = (p: P3) => c.zoom * k(p);
  f.cam = c;
  return f;
};

const r1 = (n: number) => Math.round(n * 10) / 10;
/** smooth closed (or open) SVG path through points (Catmull-Rom as cubic Béziers) */
export const smoothPath = (pts: P2[], closed = true, tension = 1): string => {
  const n = pts.length;
  if (n < 2) return '';
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1: P2 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: P2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
};
export const polyPath = (pts: P2[], closed = true) => 'M' + pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join('L') + (closed ? 'Z' : '');
