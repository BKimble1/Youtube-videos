// One 3D world for the whole film, in CENTIMETRES (adapted from the FGW Eel Escape V4 / Dead Spider camera core).
//   x: forward along the bird drone's flight direction (the hero always flies screen-right in exterior shots)
//   y: UP
//   z: toward the camera side of the default views (the bird's NEAR side; its near wing is the +z wing)
// A shot names a camera and every object is projected through it, so the bird, its mechanism and the world read the
// same from every angle and a cut never redraws an object from a different model.
// Screen: 1080 x 1920 px, y DOWN; default principal point (540, 960).
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
export const deg = (r: number) => (r * 180) / Math.PI;
/** rotate about the x axis (the wing hinge axis): +deg turns +y toward +z */
export const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(rad(d)), s = Math.sin(rad(d));
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
/** rotate about the y axis (yaw): +deg turns +z toward +x */
export const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(rad(d)), s = Math.sin(rad(d));
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
/** rotate about the z axis (pitch): +deg turns +x toward +y (nose up) */
export const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(rad(d)), s = Math.sin(rad(d));
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A rigid placement: world = o + R * local, R given by its three columns (ex, ey, ez). */
export type Frame = {o: V3; ex: V3; ey: V3; ez: V3};
export const IDENT: Frame = {o: [0, 0, 0], ex: [1, 0, 0], ey: [0, 1, 0], ez: [0, 0, 1]};
export const xf = (F: Frame, p: V3): V3 => add3(F.o, add3(add3(mul3(F.ex, p[0]), mul3(F.ey, p[1])), mul3(F.ez, p[2])));
export const xfv = (F: Frame, v: V3): V3 => add3(add3(mul3(F.ex, v[0]), mul3(F.ey, v[1])), mul3(F.ez, v[2]));
/** compose: world <- A <- B */
export const compose = (A: Frame, B: Frame): Frame => ({o: xf(A, B.o), ex: xfv(A, B.ex), ey: xfv(A, B.ey), ez: xfv(A, B.ez)});
/** the bird's body placement in the world: position, heading (yaw about y, deg), pitch (nose up, deg), bank (roll about x, deg) */
export const bodyFrame = (o: V3, yaw = 0, pitch = 0, bank = 0): Frame => {
  const R = (p: V3) => rotY(rotZ(rotX(p, bank), pitch), yaw);
  return {o, ex: R([1, 0, 0]), ey: R([0, 1, 0]), ez: R([0, 0, 1])};
};

// ------------------------------------------------------------------ camera
/** eye/target camera. f = focal length in px (px per cm at 1 cm depth); roll in deg; (cx, cy) principal point */
export type Cam3 = {eye: V3; target: V3; f: number; roll?: number; cx?: number; cy?: number};
/** orbit camera: looks at target from yaw/pitch (deg) at distance dist (cm). yaw 0 = from +z (side view of a bird
 *  flying +x); yaw > 0 moves the camera toward +x (front three-quarter); pitch > 0 = from above.
 *  scale = px per cm at the target. */
export type Orbit = {target: V3; yaw: number; pitch: number; dist: number; scale: number; roll?: number; cx?: number; cy?: number};
export const orbit = (o: Orbit): Cam3 => {
  const cp = Math.cos(rad(o.pitch));
  const eye: V3 = add3(o.target, [o.dist * cp * Math.sin(rad(o.yaw)), o.dist * Math.sin(rad(o.pitch)), o.dist * cp * Math.cos(rad(o.yaw))]);
  return {eye, target: o.target, f: o.scale * o.dist, roll: o.roll, cx: o.cx, cy: o.cy};
};
/** blend two orbits (angles, target, log-distance, log-scale) — for continuous camera moves */
export const lerpOrbit = (a: Orbit, b: Orbit, u: number): Orbit => ({
  target: lerp3(a.target, b.target, u),
  yaw: a.yaw + (b.yaw - a.yaw) * u,
  pitch: a.pitch + (b.pitch - a.pitch) * u,
  dist: a.dist * Math.pow(b.dist / a.dist, u),
  scale: a.scale * Math.pow(b.scale / a.scale, u),
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * u,
  cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * u,
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * u,
});

export type Basis = {eye: V3; r: V3; u: V3; fw: V3; f: number; cx: number; cy: number; roll: number};
export const UP: V3 = [0, 1, 0];
export const basis = (c: Cam3 | Orbit): Basis => {
  const cc: Cam3 = 'eye' in c ? c : orbit(c);
  const fw = norm3(sub3(cc.target, cc.eye));
  let r = cross3(fw, UP);
  if (len3(r) < 1e-6) r = [1, 0, 0];
  r = norm3(r);
  const u = cross3(r, fw);
  return {eye: cc.eye, r, u, fw, f: cc.f, cx: cc.cx ?? 540, cy: cc.cy ?? 960, roll: cc.roll ?? 0};
};
/** camera-space depth of a world point (cm along the view axis) */
export const depth = (B: Basis, p: V3) => dot3(sub3(p, B.eye), B.fw);
export type SP = V2 & {s: number; z: number};
/** world -> screen (px); s = px per cm at that point; z = depth (cm) */
export const proj = (B: Basis, p: V3): SP => {
  const d = sub3(p, B.eye);
  const zr = dot3(d, B.fw);
  const z = Math.max(0.5, zr);
  let x = (B.f * dot3(d, B.r)) / z;
  let y = (-B.f * dot3(d, B.u)) / z;
  if (B.roll) {
    const c = Math.cos(rad(B.roll)), s = Math.sin(rad(B.roll));
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return {x: B.cx + x, y: B.cy + y, s: B.f / z, z: zr};
};
/** screen point (x, y) at camera depth z -> world point */
export const unproj = (B: Basis, x: number, y: number, z: number): V3 => {
  let sx = x - B.cx, sy = y - B.cy;
  if (B.roll) {
    const c = Math.cos(rad(-B.roll)), s = Math.sin(rad(-B.roll));
    [sx, sy] = [sx * c - sy * s, sx * s + sy * c];
  }
  return add3(add3(B.eye, mul3(B.fw, z)), add3(mul3(B.r, (sx * z) / B.f), mul3(B.u, (-sy * z) / B.f)));
};
/** is the world direction n facing the camera at point p? (dot of n with the direction to the eye) */
export const facing = (B: Basis, p: V3, n: V3) => dot3(norm3(n), norm3(sub3(B.eye, p)));

/** SVG matrix for a planar part: local 2D drawing coords (a, b) -> world o + a*U + b*V -> screen.
 *  Exact for an orthographic camera, a first-order (affine) approximation under perspective: use it for parts that
 *  are small compared with their distance to the camera (gears, discs, plates, labels on a part). For large or
 *  near-lens shapes (wings in a close pass) project every point with proj() instead. */
export const planeMatrix = (B: Basis, o: V3, U: V3, V: V3, size = 1) => {
  const p0 = proj(B, o);
  const pu = proj(B, add3(o, mul3(U, size)));
  const pv = proj(B, add3(o, mul3(V, size)));
  const a = (pu.x - p0.x) / size, b = (pu.y - p0.y) / size, c = (pv.x - p0.x) / size, d = (pv.y - p0.y) / size;
  return `matrix(${a.toFixed(5)},${b.toFixed(5)},${c.toFixed(5)},${d.toFixed(5)},${p0.x.toFixed(3)},${p0.y.toFixed(3)})`;
};
/** projected ellipse of a sphere (centre c, radius r): screen centre and radius (perspective-correct to first order) */
export const sphere2 = (B: Basis, c: V3, r: number) => {
  const p = proj(B, c);
  return {x: p.x, y: p.y, r: r * p.s, z: p.z};
};
/** silhouette of an ellipsoid (centre c, semi-axes along the frame's local axes): returns a closed screen polygon.
 *  Computed from the projected contour generator (points where the surface normal is perpendicular to the view ray),
 *  so it is exact for an orthographic camera and very close under weak perspective. n = number of samples. */
export const ellipsoid2 = (B: Basis, F: Frame, c: V3, ax: V3, n = 48): V2[] => {
  // x = c + M s (s on the unit sphere, M = R diag(ax)); normals go by M^-T, so the contour generator (normal
  // perpendicular to the view ray d) is the great circle s . (M^-1 d) = 0, with M^-1 d = diag(1/ax) R^T d.
  const toEye = norm3(sub3(B.eye, xf(F, c)));
  const w: V3 = [dot3(F.ex, toEye) / ax[0], dot3(F.ey, toEye) / ax[1], dot3(F.ez, toEye) / ax[2]];
  const wn = norm3(w);
  // two unit vectors perpendicular to wn
  let a = cross3(wn, [0, 0, 1]);
  if (len3(a) < 1e-3) a = cross3(wn, [0, 1, 0]);
  a = norm3(a);
  const b = cross3(wn, a);
  const out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const s = add3(mul3(a, Math.cos(t)), mul3(b, Math.sin(t)));
    const wp = xf(F, add3(c, add3(add3(mul3([1, 0, 0], ax[0] * s[0]), mul3([0, 1, 0], ax[1] * s[1])), mul3([0, 0, 1], ax[2] * s[2]))));
    const q = proj(B, wp);
    out.push({x: q.x, y: q.y});
  }
  return out;
};

// ------------------------------------------------------------------ 2D helpers
export const P2 = (p: V2) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
export const poly = (pts: V2[], close = true) => (pts.length ? `M${pts.map(P2).join(' L')}${close ? ' Z' : ''}` : '');
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
export const smoothClosed = (pts: V2[], k = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k};
    const c2 = {x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k};
    d += ` C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
  }
  return d + ' Z';
};
/** open smooth path through points (Catmull-Rom) */
export const smoothOpen = (pts: V2[], k = 1 / 6) => {
  if (!pts.length) return '';
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${P2({x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k})} ${P2({x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k})} ${P2(p2)}`;
  }
  return d;
};
/** a tapered capsule between two screen circles (outer tangents) */
export const capsule2 = (a: V2, b: V2, ra: number, rb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  const f = (n: number) => n.toFixed(2);
  if (L < 1e-3 || L <= Math.abs(ra - rb)) {
    const c = ra >= rb ? a : b, r = Math.max(ra, rb);
    return `M${f(c.x - r)},${f(c.y)} a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0 Z`;
  }
  const ux = dx / L, uy = dy / L;
  const k = (ra - rb) / L;
  const c = Math.sqrt(Math.max(0, 1 - k * k));
  const nx = -uy * c + ux * k, ny = ux * c + uy * k;
  const mx = uy * c + ux * k, my = -ux * c + uy * k;
  const a1 = {x: a.x + nx * ra, y: a.y + ny * ra}, b1 = {x: b.x + nx * rb, y: b.y + ny * rb};
  const b2 = {x: b.x + mx * rb, y: b.y + my * rb}, a2 = {x: a.x + mx * ra, y: a.y + my * ra};
  const la = k >= 0 ? 1 : 0, lb = k >= 0 ? 0 : 1;
  return `M${P2(a1)} L${P2(b1)} A${f(rb)},${f(rb)} 0 ${lb},0 ${P2(b2)} L${P2(a2)} A${f(ra)},${f(ra)} 0 ${la},0 ${P2(a1)} Z`;
};
