// V4 camera: one perspective camera for the tower, arms, mount, ground, shadows and vehicles, so every contact point
// and the horizon share a single projection (V3's orthographic camera could not give the ground a horizon, which made
// the hardstand read as a tilted square floating on a separate strip).
// World: metres; X right along the arms, Y up, Z toward the viewer at yaw 0. The sea lies toward -Z.
// `at` is the world point at frame centre and `z` the scale there (px per metre); the camera itself sits `f / z` metres
// back along the view axis, with a fixed focal length `f` (a real lens: zooming in V3 shots becomes dollying in V4).
export type V3 = [number, number, number];
export type Cam3 = {
  /** world point at frame centre */
  at: V3;
  /** px per metre at `at` */
  z: number;
  /** yaw about +Y (deg); 0 looks along -Z */
  yaw: number;
  /** pitch (deg); positive looks up at the subject from below */
  pitch: number;
  /** roll in screen (deg) */
  roll?: number;
  /** focal length in px (default F) */
  f?: number;
};

const D = Math.PI / 180;
/** Default focal length: ≈ 47° horizontal field of view on 1920 px. */
export const F = 2200;
const NEAR = 1.5;
/** The camera never goes below this height: pitch is limited so a low "looking up" shot keeps the eye above ground. */
const MIN_EYE = 2.5;

type Basis = {cy: number; sy: number; cp: number; sp: number; dist: number; f: number; cr: number; sr: number};
const basis = (c: Cam3): Basis => {
  const f = c.f ?? F;
  const dist = f / c.z;
  let p = c.pitch * D;
  // eye height = at.y - dist * sin(pitch) >= MIN_EYE
  const maxP = Math.asin(Math.max(-1, Math.min(1, (c.at[1] - MIN_EYE) / dist)));
  if (p > maxP) p = maxP;
  const r = (c.roll ?? 0) * D;
  return {cy: Math.cos(c.yaw * D), sy: Math.sin(c.yaw * D), cp: Math.cos(p), sp: Math.sin(p), dist, f, cr: Math.cos(r), sr: Math.sin(r)};
};
const cache = new WeakMap<Cam3, Basis>();
const B = (c: Cam3) => {
  let b = cache.get(c);
  if (!b) {
    b = basis(c);
    cache.set(c, b);
  }
  return b;
};

/** World → camera space: [x right, y up, depth in front of the eye]. */
export const toCam = (c: Cam3, p: V3): V3 => {
  const b = B(c);
  const [X, Y, Z] = [p[0] - c.at[0], p[1] - c.at[1], p[2] - c.at[2]];
  const x1 = X * b.cy + Z * b.sy;
  const z1 = -X * b.sy + Z * b.cy;
  const y2 = Y * b.cp + z1 * b.sp;
  const z2 = -Y * b.sp + z1 * b.cp; // toward the viewer
  return [x1, y2, b.dist - z2];
};
const toScreen = (c: Cam3, q: V3): V3 => {
  const b = B(c);
  const k = b.f / Math.max(NEAR, q[2]);
  let sx = q[0] * k, syy = -q[1] * k;
  if (b.sr) [sx, syy] = [sx * b.cr - syy * b.sr, sx * b.sr + syy * b.cr];
  return [960 + sx, 540 + syy, -q[2]];
};

/** Project a world point to screen pixels. Returns [x, y, depth] with larger depth = nearer (same sign as V3). */
export const proj = (c: Cam3, p: V3): V3 => toScreen(c, toCam(c, p));
/** Screen scale (px per metre) at a world point. */
export const scaleAt = (c: Cam3, p: V3) => B(c).f / Math.max(NEAR, toCam(c, p)[2]);
/** Distance of a world point in front of the eye (m). */
export const depthOf = (c: Cam3, p: V3) => toCam(c, p)[2];
/** Eye position in world space. */
export const eyeOf = (c: Cam3): V3 => {
  const b = B(c);
  // toward-viewer axis in world: (Y = -sp, z1 = cp) rotated back by yaw
  const z1 = b.cp * b.dist, y = -b.sp * b.dist;
  return [c.at[0] - z1 * b.sy, c.at[1] + y, c.at[2] + z1 * b.cy];
};
/** Screen y of the horizon (ground plane at infinity) at frame centre, ignoring roll. */
export const horizonY = (c: Cam3) => {
  const b = B(c);
  return 540 + (b.f * b.sp) / b.cp;
};

/** Project a world polygon, clipped against the near plane (for ground areas that extend behind the camera). */
export const projPoly = (c: Cam3, pts: V3[]): number[][] => {
  const q = pts.map((p) => toCam(c, p));
  const out: V3[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i], b = q[(i + 1) % q.length];
    const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
    if (ain) out.push(a);
    if (ain !== bin) {
      const u = (NEAR - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, NEAR]);
    }
  }
  return out.map((v) => toScreen(c, v));
};

/** Scale of a vertical metre at the frame centre (kept for V3 callers). */
export const vScale = (c: Cam3) => c.z * Math.cos(c.pitch * D);
/** The azimuth (deg) a vertical vehicle presents to the camera, given its own roll angle about its axis. */
export const viewAz = (c: Cam3, roll: number) => roll - c.yaw;

export const pts = (c: Cam3, ps: V3[]) => ps.map((p) => proj(c, p));
export const poly = (ps: V3[] | number[][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
export const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
