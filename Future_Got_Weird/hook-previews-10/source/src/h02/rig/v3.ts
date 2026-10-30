// Small 3D vector and frame helpers. World units are millimetres; y is up.
export type V3 = [number, number, number];
export type V2 = [number, number];

export const v = (x: number, y: number, z: number): V3 => [x, y, z];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const dist = (a: V3, b: V3) => len(sub(a, b));

/** A rigid frame: origin plus orthonormal axes (x forward, y up, z right-hand side). */
export type Frame = {o: V3; x: V3; y: V3; z: V3};
export const IDENT: Frame = {o: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1]};
/** local point -> world */
export const toW = (f: Frame, p: V3): V3 => [
  f.o[0] + f.x[0] * p[0] + f.y[0] * p[1] + f.z[0] * p[2],
  f.o[1] + f.x[1] * p[0] + f.y[1] * p[1] + f.z[1] * p[2],
  f.o[2] + f.x[2] * p[0] + f.y[2] * p[1] + f.z[2] * p[2],
];
/** local direction -> world */
export const dirW = (f: Frame, d: V3): V3 => [
  f.x[0] * d[0] + f.y[0] * d[1] + f.z[0] * d[2],
  f.x[1] * d[0] + f.y[1] * d[1] + f.z[1] * d[2],
  f.x[2] * d[0] + f.y[2] * d[1] + f.z[2] * d[2],
];
/** world point -> local */
export const toL = (f: Frame, p: V3): V3 => {
  const d = sub(p, f.o);
  return [dot(d, f.x), dot(d, f.y), dot(d, f.z)];
};
/** child frame given in parent-local coordinates -> world */
export const compose = (parent: Frame, child: Frame): Frame => ({
  o: toW(parent, child.o),
  x: dirW(parent, child.x),
  y: dirW(parent, child.y),
  z: dirW(parent, child.z),
});
/** rotation about an axis (Rodrigues) */
export const rotAxis = (p: V3, axis: V3, a: number): V3 => {
  const k = norm(axis), c = Math.cos(a), s = Math.sin(a);
  const kxp = cross(k, p), kdp = dot(k, p);
  return [p[0] * c + kxp[0] * s + k[0] * kdp * (1 - c), p[1] * c + kxp[1] * s + k[1] * kdp * (1 - c), p[2] * c + kxp[2] * s + k[2] * kdp * (1 - c)];
};
/** frame from yaw (about world y, 0 = facing +x), pitch (nose up, about local z) and roll (about local x) */
export const ypr = (o: V3, yaw: number, pitch = 0, roll = 0): Frame => {
  let x: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  let y: V3 = [0, 1, 0];
  let z: V3 = cross(x, y);
  // pitch about z
  x = rotAxis(x, z, pitch);
  y = rotAxis(y, z, pitch);
  // roll about x
  y = rotAxis(y, x, roll);
  z = rotAxis(z, x, roll);
  return {o, x, y, z};
};
