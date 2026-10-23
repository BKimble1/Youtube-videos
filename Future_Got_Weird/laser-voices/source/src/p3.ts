// V2 3D layer. One physical space in metres (x across the corridor, y up, z down the corridor). Every camera angle in
// V2 is a pinhole camera in this space, so the corridor, the two characters, the shield and the flashlight keep their
// geography across cuts. Everything is projected in double precision in JS and emitted as screen-space SVG, so a dive
// from the corridor to a single lens (a ~400x change of scale) never loses precision.
export type V3 = {x: number; y: number; z: number};
export type V2 = {x: number; y: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const a3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const s3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const m3 = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});
export const d3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const c3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const l3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
export const n3 = (a: V3): V3 => {
  const l = l3(a) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});
/** rotate about the vertical axis (yaw, radians; 0 faces +z, positive turns toward +x) */
export const rotY = (p: V3, a: number): V3 => ({x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a)});
export const fwdOf = (yaw: number): V3 => ({x: Math.sin(yaw), y: 0, z: Math.cos(yaw)});

export const SW = 1080, SH = 1920;

export type Cam = {pos: V3; tgt: V3; f: number; roll?: number; up?: V3};
export type Basis = {pos: V3; fwd: V3; right: V3; up: V3; f: number; roll: number};
export const basis = (c: Cam): Basis => {
  const fwd = n3(s3(c.tgt, c.pos));
  let upRef = c.up ?? v3(0, 1, 0);
  if (!c.up && Math.abs(d3(fwd, upRef)) > 0.995) upRef = v3(0, 0, 1); // looking straight down: screen-up is +z
  // Laser Voices: right-handed screen basis (camera on +z looking toward -z sees +x on the right). This is the V2
  // corridor basis mirrored; the rigs were drawn for that basis, and a mirror of a consistent picture stays consistent.
  const right = n3(c3(fwd, upRef));
  const up = c3(right, fwd);
  return {pos: c.pos, fwd, right, up, f: c.f, roll: c.roll ?? 0};
};
export type P2 = {x: number; y: number; d: number; k: number}; // screen point, depth, px per metre at that depth
export const proj = (b: Basis, p: V3): P2 => {
  const r = s3(p, b.pos);
  const d = d3(r, b.fwd);
  const dd = Math.max(d, 1e-4);
  let x = (b.f * d3(r, b.right)) / dd, y = (-b.f * d3(r, b.up)) / dd;
  if (b.roll) {
    const c = Math.cos(b.roll), s = Math.sin(b.roll);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return {x: SW / 2 + x, y: SH / 2 + y, d, k: b.f / dd};
};
/** clip a planar polygon against the near plane, then project */
export const NEAR = 0.004;
export const projPoly = (b: Basis, pts: V3[], near = NEAR): V2[] => {
  const dep = (p: V3) => d3(s3(p, b.pos), b.fwd);
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const A = pts[i], B = pts[(i + 1) % pts.length];
    const da = dep(A) - near, db = dep(B) - near;
    if (da >= 0) out.push(A);
    if (da >= 0 !== db >= 0) out.push(lerp3(A, B, da / (da - db)));
  }
  return clip2(out.map((p) => {
    const q = proj(b, p);
    return {x: q.x, y: q.y};
  }));
};
// 2D guard band: projected polygons are clipped to a band around the frame, because Chrome's rasteriser mis-fills
// paths with coordinates in the hundreds of thousands (near-plane vertices of faces beside or behind the camera)
const GB = {x0: -2500, x1: SW + 2500, y0: -2500, y1: SH + 2500};
export const clip2 = (pts: V2[]): V2[] => {
  let poly = pts;
  const edges: [(p: V2) => number][] = [[(p) => p.x - GB.x0], [(p) => GB.x1 - p.x], [(p) => p.y - GB.y0], [(p) => GB.y1 - p.y]];
  for (const [f] of edges) {
    if (poly.length < 3) return [];
    const o: V2[] = [];
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i], B = poly[(i + 1) % poly.length];
      const fa = f(A), fb = f(B);
      if (fa >= 0) o.push(A);
      if (fa >= 0 !== fb >= 0) {
        const k = fa / (fa - fb);
        o.push({x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k});
      }
    }
    poly = o;
  }
  return poly;
};
export const fmt = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
export const polyD = (pts: V2[]) => (pts.length < 3 ? '' : pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('') + 'Z');
export const lineD = (pts: V2[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('');
/** axis-aligned quad on a plane: origin o, spanning vectors u, v */
export const quad = (o: V3, u: V3, v: V3): V3[] => [o, a3(o, u), a3(a3(o, u), v), a3(o, v)];
/** circle on a plane (centre, two orthonormal in-plane axes), n points */
export const circle3 = (c: V3, u: V3, v: V3, r: number, n = 28, ry?: number): V3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return a3(c, a3(m3(u, Math.cos(a) * r), m3(v, Math.sin(a) * (ry ?? r))));
  });

/** camera interpolation: positions and targets slerp-free (eased by caller); focal length in log space */
export const camMix = (a: Cam, b: Cam, t: number): Cam => ({
  pos: lerp3(a.pos, b.pos, t),
  tgt: lerp3(a.tgt, b.tgt, t),
  f: Math.exp(Math.log(a.f) + (Math.log(b.f) - Math.log(a.f)) * t),
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});
/** camera interpolation that keeps the view direction turning smoothly (interpolate the look direction, not the target) */
export const camMixDir = (a: Cam, b: Cam, t: number, dist = 1): Cam => {
  const pos = lerp3(a.pos, b.pos, t);
  const da = n3(s3(a.tgt, a.pos)), db = n3(s3(b.tgt, b.pos));
  const dir = n3(lerp3(da, db, t));
  return {pos, tgt: a3(pos, m3(dir, dist)), f: Math.exp(Math.log(a.f) + (Math.log(b.f) - Math.log(a.f)) * t), roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t};
};

// 2D convex hull (monotone chain)
export const hull = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** smooth closed path through points (Catmull-Rom) */
export const smoothClosed = (q: V2[], k = 1 / 6) => {
  const n = q.length;
  if (n < 3) return polyD(q);
  let d = `M${fmt(q[0].x)},${fmt(q[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    d += ` C${fmt(p1.x + (p2.x - p0.x) * k)},${fmt(p1.y + (p2.y - p0.y) * k)} ${fmt(p2.x - (p3.x - p1.x) * k)},${fmt(p2.y - (p3.y - p1.y) * k)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }
  return d + 'Z';
};
