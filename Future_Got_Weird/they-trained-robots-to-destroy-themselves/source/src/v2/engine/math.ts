// Small 3D math kit for the V2 projection engine. Units are centimetres; y is up.
export type V3 = [number, number, number];
/** A rotation/basis as three column vectors: the local x, y and z axes expressed in the parent frame. */
export type M3 = [V3, V3, V3];

export const v3 = (x = 0, y = 0, z = 0): V3 => [x, y, z];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mulS = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const madd = (a: V3, b: V3, s: number): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

export const I3: M3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
/** Matrix × vector (columns are the axes). */
export const mv = (m: M3, v: V3): V3 => [
  m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
  m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
  m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2],
];
export const mm = (a: M3, b: M3): M3 => [mv(a, b[0]), mv(a, b[1]), mv(a, b[2])];
/** Transpose = inverse for rotations. */
export const mt = (m: M3): M3 => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];

export const rotX = (a: number): M3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1, 0, 0], [0, c, s], [0, -s, c]];
};
export const rotY = (a: number): M3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, 0, -s], [0, 1, 0], [s, 0, c]];
};
export const rotZ = (a: number): M3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, s, 0], [-s, c, 0], [0, 0, 1]];
};
/** Yaw (about y), then pitch (about x), then roll (about z), applied in the body frame. */
export const euler = (yaw = 0, pitch = 0, roll = 0): M3 => mm(mm(rotY(yaw), rotX(pitch)), rotZ(roll));

/** Rotation about an arbitrary unit axis (Rodrigues). */
export const rotAxis = (axis: V3, a: number): M3 => {
  const [x, y, z] = norm(axis);
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [
    [t * x * x + c, t * x * y + s * z, t * x * z - s * y],
    [t * x * y - s * z, t * y * y + c, t * y * z + s * x],
    [t * x * z + s * y, t * y * z - s * x, t * z * z + c],
  ];
};

/** A frame whose y axis points along `dir` and whose x axis stays close to `side`. */
export const frameAlong = (dir: V3, side: V3): M3 => {
  const y = norm(dir);
  let z = cross(side, y);
  if (len(z) < 1e-6) z = cross([0, 0, 1], y);
  z = norm(z);
  const x = cross(y, z);
  return [x, y, z];
};

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const clamp01 = (x: number) => clamp(x, 0, 1);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const DEG = Math.PI / 180;

/** Deterministic pseudo-random in [0,1) (mulberry32). */
export const rnd = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Smooth 1D value noise in [-1,1], deterministic. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = rnd(i * 7919 + seed * 104729) * 2 - 1;
  const b = rnd((i + 1) * 7919 + seed * 104729) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
