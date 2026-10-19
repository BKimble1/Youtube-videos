// A small perspective camera for the 3D views (overhead map, low three-quarter tracking shot).
// World: (east, height, north) in millimetres. Headings are angles from east toward north (counter-clockwise from
// above), so a left-hand bend is a positive turn rate. Screen: 1920x1080, y down.
export type V3 = [number, number, number]; // east, height, north
export type Cam3 = {eye: V3; yaw: number; pitch: number; f: number; cx?: number; cy?: number};

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export type P2 = {x: number; y: number; z: number}; // screen x, y and camera depth z (mm)

/** Project a world point. Returns null when it is behind the near plane. */
export const project = (c: Cam3, p: V3): P2 | null => {
  const d = sub(p, c.eye);
  const ch = Math.cos(c.yaw), sh = Math.sin(c.yaw);
  const along = d[0] * ch + d[2] * sh; // along the horizontal view direction
  const lateral = d[0] * sh - d[2] * ch; // to the camera's right
  const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  const z = along * cp + d[1] * sp;
  const up = -along * sp + d[1] * cp;
  if (z < 60) return null;
  return {x: (c.cx ?? 960) + (c.f * lateral) / z, y: (c.cy ?? 540) - (c.f * up) / z, z};
};
/** Unit vector from the eye toward a point's direction of view (for back-face tests). */
export const viewDir = (c: Cam3, p: V3): V3 => norm(sub(p, c.eye));

/** Car-local (x forward, y up, z left) to world, for a car at (east, north) heading psi, with roll (about its own
 *  forward axis, + = leaning toward its left) and pitch applied about the given centre height. */
export const carToWorld = (pos: {e: number; n: number; psi: number; roll?: number; pitch?: number; dz?: number}, p: V3, pivotY = 450): V3 => {
  let [x, y, z] = p;
  const roll = pos.roll ?? 0, pitch = pos.pitch ?? 0;
  if (roll) {
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const yy = pivotY + (y - pivotY) * cr - z * sr;
    const zz = z * cr + (y - pivotY) * sr;
    y = yy; z = zz;
  }
  if (pitch) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const xx = x * cp - (y - pivotY) * sp;
    const yy = pivotY + x * sp + (y - pivotY) * cp;
    x = xx; y = yy;
  }
  y += pos.dz ?? 0;
  const c = Math.cos(pos.psi), s = Math.sin(pos.psi);
  return [pos.e + x * c - z * s, y, pos.n + x * s + z * c];
};
/** Rotate a direction (no translation). */
export const carDirToWorld = (psi: number, v: V3): V3 => {
  const c = Math.cos(psi), s = Math.sin(psi);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
};
