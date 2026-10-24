// A tiny 3D projection for hard-surface props (the emitter): one model, drawn from any angle, so the device is the same
// object in every shot. Right-handed model space: x toward the device's front (the lens), y up, z toward its left side.
// The view turns the model by yaw (about y) and pitch (about x), then projects with an optional perspective.
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul3 = (a: V3, s: number): V3 => ({x: a.x * s, y: a.y * s, z: a.z * s});
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};

export type View = {
  /** screen position of the model origin */
  ox: number;
  oy: number;
  /** px per model unit at the origin's depth */
  k: number;
  /** turn about the vertical axis (deg): 0 = the device points screen-left, its right side toward the camera */
  yaw: number;
  /** tilt (deg, + = seen from above) */
  pitch: number;
  /** perspective focal length in model units (0 = orthographic) */
  f?: number;
};

const RAD = Math.PI / 180;
/** model -> camera space (x right, y up, z away from the camera) */
export const toCam = (v: View, p: V3): V3 => {
  // yaw 0: model +x (front) points screen-left, model +z (left side) points toward the camera
  const a = v.yaw * RAD;
  const x1 = -p.x * Math.cos(a) + p.z * Math.sin(a);
  const z1 = -p.x * Math.sin(a) - p.z * Math.cos(a);
  const b = v.pitch * RAD;
  const y2 = p.y * Math.cos(b) - z1 * Math.sin(b);
  const z2 = p.y * Math.sin(b) + z1 * Math.cos(b);
  return {x: x1, y: y2, z: z2};
};
export const proj = (v: View, p: V3) => {
  const c = toCam(v, p);
  const persp = v.f ? v.f / (v.f + c.z) : 1;
  return {x: v.ox + c.x * v.k * persp, y: v.oy - c.y * v.k * persp, z: c.z, k: v.k * persp};
};
/** the key light in camera space (toward the light: upper-left, a little toward the camera) */
export const LIGHT3 = norm3({x: -0.55, y: 0.7, z: -0.45});
/** a model-space normal's brightness under the key light (0..1) */
export const lum = (v: View, n: V3) => {
  const o = toCam(v, n);
  const c = toCam(v, v3(0, 0, 0));
  const d = norm3(sub3(o, c));
  return Math.max(0, dot3(d, LIGHT3));
};
/** whether a face with model normal n faces the camera */
export const facesCam = (v: View, n: V3) => {
  const o = toCam(v, n);
  const c = toCam(v, v3(0, 0, 0));
  return o.z - c.z < 0;
};
