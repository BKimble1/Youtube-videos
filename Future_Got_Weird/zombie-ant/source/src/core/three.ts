// Shared FGW 3D layer, carried over unchanged from the Dead Spider episode (source/src/three.ts).
// A small perspective layer. The experiment (spiders, needle, tube, support, payloads, bench surfaces) lives in one
// world in millimetres (x right, y away from the default camera, z up; the bench top is z = 0). A shot names a camera
// and every object is projected through it, so the same rig reads correctly from the macro top view, the side views and
// the low views, and a cut never redraws an object from a different model.
export type V3 = [number, number, number];
export type V2 = {x: number; y: number};

export const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a: V3): V3 => mul3(a, 1 / (len3(a) || 1));
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rad = (d: number) => (d * Math.PI) / 180;
/** rotate about z by deg */
export const rotZ = (p: V3, deg: number): V3 => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
/** rotate about the body's y axis (pitch, nose down for +deg) */
export const rotY = (p: V3, deg: number): V3 => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
export const rotX = (p: V3, deg: number): V3 => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

export type Cam3 = {eye: V3; target: V3; f: number; roll?: number; cx?: number; cy?: number};

export type Basis = {eye: V3; r: V3; u: V3; fw: V3; f: number; cx: number; cy: number; roll: number};
export const basis = (c: Cam3): Basis => {
  const fw = norm3(sub3(c.target, c.eye));
  let r = cross3(fw, [0, 0, 1]);
  if (len3(r) < 1e-6) r = [1, 0, 0];
  r = norm3(r);
  const u = cross3(r, fw);
  return {eye: c.eye, r, u, fw, f: c.f, cx: c.cx ?? 540, cy: c.cy ?? 960, roll: c.roll ?? 0};
};
/** camera-space depth of a world point (mm along the view axis) */
export const depth = (B: Basis, p: V3) => dot3(sub3(p, B.eye), B.fw);
/** world -> screen (px); s = px per mm at that point; z = depth */
export const proj = (B: Basis, p: V3): V2 & {s: number; z: number} => {
  const d = sub3(p, B.eye);
  const zr = dot3(d, B.fw);
  const z = Math.max(1e-3, zr);
  let x = (B.f * dot3(d, B.r)) / z;
  let y = (-B.f * dot3(d, B.u)) / z;
  if (B.roll) {
    const c = Math.cos(rad(B.roll)), s = Math.sin(rad(B.roll));
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return {x: B.cx + x, y: B.cy + y, s: B.f / z, z: zr};
};
/** blend two cameras (eye, target and focal length), for continuous moves */
export const lerpCam = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  eye: lerp3(a.eye, b.eye, t),
  target: lerp3(a.target, b.target, t),
  f: a.f * Math.pow(b.f / a.f, t),
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
  cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * t,
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * t,
});

// ------------------------------------------------------------------ 2D helpers
export const P2 = (p: V2) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
/** convex hull (monotone chain) */
export const hull = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: V2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** closed smooth path through points (Catmull-Rom) */
export const smoothClosed = (pts: V2[]) => {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
  }
  return d + ' Z';
};
/** open smooth path through points (Catmull-Rom) */
export const smoothOpen = (pts: V2[]) => {
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${P2({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${P2({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${P2(p2)}`;
  }
  return d;
};
/** a tapered capsule between two screen circles */
export const capsule2 = (a: V2, b: V2, ra: number, rb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L < 1e-3 || L <= Math.abs(ra - rb)) {
    const c = ra >= rb ? a : b, r = Math.max(ra, rb);
    return `M${(c.x - r).toFixed(2)},${c.y.toFixed(2)} a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0 a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0 Z`;
  }
  const ux = dx / L, uy = dy / L;
  const k = (ra - rb) / L;
  const c = Math.sqrt(Math.max(0, 1 - k * k));
  // normal rotated so the tangent lines touch both circles
  const nx = -uy * c + ux * k, ny = ux * c + uy * k;
  const mx = uy * c + ux * k, my = -ux * c + uy * k;
  const a1 = {x: a.x + nx * ra, y: a.y + ny * ra}, b1 = {x: b.x + nx * rb, y: b.y + ny * rb};
  const b2 = {x: b.x + mx * rb, y: b.y + my * rb}, a2 = {x: a.x + mx * ra, y: a.y + my * ra};
  const f = (n: number) => n.toFixed(2);
  // both end arcs turn the same way round; the larger end's arc spans more than half a turn
  const la = k >= 0 ? 1 : 0, lb = k >= 0 ? 0 : 1;
  return `M${P2(a1)} L${P2(b1)} A${f(rb)},${f(rb)} 0 ${lb},0 ${P2(b2)} L${P2(a2)} A${f(ra)},${f(ra)} 0 ${la},0 ${P2(a1)} Z`;
};

/** screen point (x, y) at camera depth z -> world point */
export const unproj = (c: Cam3, x: number, y: number, z: number): V3 => {
  const B = basis(c);
  const sx = ((x - B.cx) * z) / B.f, sy = (-(y - B.cy) * z) / B.f;
  return add3(add3(B.eye, mul3(B.fw, z)), add3(mul3(B.r, sx), mul3(B.u, sy)));
};

/** a Catmull-Rom spline through 3D points, sampled at n points per span */
export const spline3 = (pts: V3[], n = 8): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as V3);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** an orbit camera: aim at `target` from azimuth/elevation (deg; azimuth 0 = from -y, +90 = from +x) at distance d */
export type Orbit = {target: V3; az: number; el: number; d: number; f: number; cx?: number; cy?: number; roll?: number};
export const orbitCam = (o: Orbit): Cam3 => {
  const a = rad(o.az), e = rad(o.el);
  const dir: V3 = [Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e)];
  return {eye: add3(o.target, mul3(dir, o.d)), target: o.target, f: o.f, cx: o.cx, cy: o.cy, roll: o.roll};
};
/** blend orbits: angles linearly, distance and focal length geometrically (a zoom reads at an even rate) */
export const lerpOrbit = (a: Orbit, b: Orbit, t: number): Orbit => ({
  target: lerp3(a.target, b.target, t),
  az: a.az + (b.az - a.az) * t,
  el: a.el + (b.el - a.el) * t,
  d: a.d * Math.pow(b.d / a.d, t),
  f: a.f * Math.pow(b.f / a.f, t),
  cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * t,
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});
/** the orbit that reproduces a look-at camera */
export const toOrbit = (c: Cam3): Orbit => {
  const d3 = sub3(c.eye, c.target);
  const d = len3(d3);
  const el = (Math.asin(d3[2] / d) * 180) / Math.PI;
  const az = (Math.atan2(d3[0], -d3[1]) * 180) / Math.PI;
  return {target: c.target, az, el, d, f: c.f, cx: c.cx, cy: c.cy, roll: c.roll};
};

/** a world polygon clipped to the space in front of the camera (depth >= near), projected; '' if nothing is left */
export const projPoly = (B: Basis, pts: V3[], near = 2): string => {
  const dz = (p: V3) => dot3(sub3(p, B.eye), B.fw);
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = dz(a) - near, db = dz(b) - near;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) out.push(lerp3(a, b, da / (da - db)));
  }
  if (out.length < 3) return '';
  return `M${out.map((p) => P2(proj(B, p))).join(' L')} Z`;
};
