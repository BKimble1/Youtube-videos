// Minimal 3D layer for the JIZAI ARMS Short. The cast and the robot are still drawn with the Weird Crew's flat vector
// primitives (src/dc), but every joint lives in one 3D world (centimetres; x right, y up, z toward the default
// camera), so the camera can orbit the wearer, arms pass in front of and behind the body, and the half-scale
// controller and the full arm share exactly the same joint angles.
import React from 'react';

export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const a3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const s3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const k3 = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});
export const d3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const x3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const l3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
export const n3 = (a: V3): V3 => {
  const l = l3(a) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});

/** 3x3 rotation as three column vectors (the local x, y, z axes expressed in the parent). */
export type M3 = {x: V3; y: V3; z: V3};
export const I3: M3 = {x: v3(1, 0, 0), y: v3(0, 1, 0), z: v3(0, 0, 1)};
export const mv = (m: M3, p: V3): V3 => a3(a3(k3(m.x, p.x), k3(m.y, p.y)), k3(m.z, p.z));
export const mm = (a: M3, b: M3): M3 => ({x: mv(a, b.x), y: mv(a, b.y), z: mv(a, b.z)});
const R = (deg: number) => (deg * Math.PI) / 180;
export const rx = (d: number): M3 => {
  const c = Math.cos(R(d)), s = Math.sin(R(d));
  return {x: v3(1, 0, 0), y: v3(0, c, s), z: v3(0, -s, c)};
};
export const ry = (d: number): M3 => {
  const c = Math.cos(R(d)), s = Math.sin(R(d));
  return {x: v3(c, 0, -s), y: v3(0, 1, 0), z: v3(s, 0, c)};
};
export const rz = (d: number): M3 => {
  const c = Math.cos(R(d)), s = Math.sin(R(d));
  return {x: v3(c, s, 0), y: v3(-s, c, 0), z: v3(0, 0, 1)};
};
/** A frame whose z axis is `zAxis`, with x as close as possible to `xHint`. */
export const frameZ = (zAxis: V3, xHint: V3): M3 => {
  const z = n3(zAxis);
  let x = s3(xHint, k3(z, d3(xHint, z)));
  if (l3(x) < 1e-4) x = Math.abs(z.y) < 0.9 ? x3(v3(0, 1, 0), z) : x3(v3(1, 0, 0), z);
  x = n3(x);
  return {x, y: x3(z, x), z};
};
/** Rotation about an arbitrary unit axis (Rodrigues). */
export const rAxis = (axis: V3, deg: number): M3 => {
  const u = n3(axis), c = Math.cos(R(deg)), s = Math.sin(R(deg)), t = 1 - c;
  const col = (x: number, y: number, z: number) => v3(x, y, z);
  return {
    x: col(t * u.x * u.x + c, t * u.x * u.y + s * u.z, t * u.x * u.z - s * u.y),
    y: col(t * u.x * u.y - s * u.z, t * u.y * u.y + c, t * u.y * u.z + s * u.x),
    z: col(t * u.x * u.z + s * u.y, t * u.y * u.z - s * u.x, t * u.z * u.z + c),
  };
};

// ---------------------------------------------------------------- camera
export const SW = 1080;
export const SH = 1920;
/** Orbit camera: looks at `t` from yaw/pitch/dist; `f` focal length in px; `sx, sy` shift the target on screen;
 *  `roll` in degrees. yaw 0 = camera on +z looking toward -z; yaw + = camera swings toward +x (screen-left side of
 *  a subject that faces +z comes into view). */
export type Cam = {t: V3; yaw: number; pitch: number; dist: number; f: number; sx?: number; sy?: number; roll?: number};

export type Proj = {
  /** world -> screen (x, y in px) and camera depth z (cm) */
  p: (q: V3) => {x: number; y: number; z: number};
  /** px per cm at camera depth z */
  k: (z: number) => number;
  eye: V3;
  fwd: V3;
  right: V3;
  up: V3;
  cam: Cam;
};

export const proj = (cam: Cam): Proj => {
  const cp = Math.cos(R(cam.pitch));
  const off = v3(Math.sin(R(cam.yaw)) * cp * cam.dist, Math.sin(R(cam.pitch)) * cam.dist, Math.cos(R(cam.yaw)) * cp * cam.dist);
  const eye = a3(cam.t, off);
  const fwd = n3(s3(cam.t, eye));
  const right = n3(x3(fwd, v3(0, 1, 0)));
  const up = x3(right, fwd);
  const roll = R(cam.roll ?? 0);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const cx = SW / 2 + (cam.sx ?? 0), cy = SH / 2 + (cam.sy ?? 0);
  return {
    p: (q) => {
      const d = s3(q, eye);
      const z = Math.max(1, d3(d, fwd));
      const xs = (cam.f * d3(d, right)) / z;
      const ys = (-cam.f * d3(d, up)) / z;
      return {x: cx + xs * cr - ys * sr, y: cy + xs * sr + ys * cr, z};
    },
    k: (z) => cam.f / Math.max(1, z),
    eye,
    fwd,
    right,
    up,
    cam,
  };
};

/** Screen angle (deg, atan2 convention, y down) of the projected direction a -> b. */
export const sAng = (P: Proj, a: V3, b: V3) => {
  const A = P.p(a), B = P.p(b);
  return (Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI;
};

/** Mix two cameras (targets and shifts lerp; angles lerp). */
export const mixCam = (a: Cam, b: Cam, t: number): Cam => {
  const L = (x: number, y: number) => x + (y - x) * t;
  return {
    t: lerp3(a.t, b.t, t),
    yaw: L(a.yaw, b.yaw),
    pitch: L(a.pitch, b.pitch),
    dist: L(a.dist, b.dist),
    f: L(a.f, b.f),
    sx: L(a.sx ?? 0, b.sx ?? 0),
    sy: L(a.sy ?? 0, b.sy ?? 0),
    roll: L(a.roll ?? 0, b.roll ?? 0),
  };
};

// ---------------------------------------------------------------- draw list
/** One depth-sorted drawable. z = camera depth (larger = farther); drawn far to near. */
export type Item = {z: number; key: string; el: React.ReactNode};
export const sortItems = (items: Item[]) => [...items].sort((a, b) => b.z - a.z);
export const Draw: React.FC<{items: Item[]}> = ({items}) => (
  <>
    {sortItems(items).map((it) => (
      <React.Fragment key={it.key}>{it.el}</React.Fragment>
    ))}
  </>
);
