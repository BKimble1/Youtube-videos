// A small perspective camera for the lab world, in the rig's own units (u: the guesser's hand is 96 u long, about
// 19 cm, so 1 u ~ 2 mm). World axes: X to screen-right, Y up, Z toward the viewer. The bench top is Y = 0; the array
// sits on it at the origin; the guesser and his reaching arm are drawn in the vertical plane Z = 0 (the figure plane),
// which is mapped to the screen by the local affine of the projection at an anchor (exact at the anchor, and very
// close to it over a figure for the narrow fields of view used here).
export type V3 = {x: number; y: number; z: number};
export type Cam3 = {x: number; y: number; z: number; yaw: number; pitch: number; f: number; roll?: number};

const rad = (d: number) => (d * Math.PI) / 180;
export const CX = 540, CY = 960;

export const toCam = (c: Cam3, p: V3): V3 => {
  let x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
  // yaw about Y (positive turns the camera to look toward -X ... i.e. orbit to the viewer's right)
  const cy = Math.cos(rad(-c.yaw)), sy = Math.sin(rad(-c.yaw));
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  // pitch about X (negative looks down)
  const cp = Math.cos(rad(-c.pitch)), sp = Math.sin(rad(-c.pitch));
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  return {x, y, z};
};

export const project = (c: Cam3, p: V3) => {
  const q = toCam(c, p);
  const d = Math.max(1e-3, -q.z);
  let sx = (c.f * q.x) / d, sy = (-c.f * q.y) / d;
  if (c.roll) {
    const r = rad(c.roll), cr = Math.cos(r), sr = Math.sin(r);
    [sx, sy] = [sx * cr - sy * sr, sx * sr + sy * cr];
  }
  return {x: CX + sx, y: CY + sy, d, k: c.f / d};
};

/** SVG matrix that maps a plane's local 2D coords (u along `ax`, v along `ay`, both world vectors per unit) at the
 *  world anchor `o` to the screen (affine linearisation of the projection at o). */
export const planeMatrix = (c: Cam3, o: V3, ax: V3, ay: V3) => {
  const e = 2;
  const p0 = project(c, o);
  const pu = project(c, {x: o.x + ax.x * e, y: o.y + ax.y * e, z: o.z + ax.z * e});
  const pv = project(c, {x: o.x + ay.x * e, y: o.y + ay.y * e, z: o.z + ay.z * e});
  const a = (pu.x - p0.x) / e, b = (pu.y - p0.y) / e, cc = (pv.x - p0.x) / e, d = (pv.y - p0.y) / e;
  return {m: `matrix(${a.toFixed(5)} ${b.toFixed(5)} ${cc.toFixed(5)} ${d.toFixed(5)} ${p0.x.toFixed(3)} ${p0.y.toFixed(3)})`, scale: Math.sqrt(Math.abs(a * d - b * cc)), p0};
};

/** the figure plane (Z = z0), local coords (u right, v DOWN) with local origin at world (ox, oy) */
export const figMatrix = (c: Cam3, ox: number, oy: number, z0 = 0) => planeMatrix(c, {x: ox, y: oy, z: z0}, {x: 1, y: 0, z: 0}, {x: 0, y: -1, z: 0});
/** a horizontal plane at height y0, local u = +X, v = +Z (toward the viewer) */
export const topMatrix = (c: Cam3, ox: number, y0: number, oz: number) => planeMatrix(c, {x: ox, y: y0, z: oz}, {x: 1, y: 0, z: 0}, {x: 0, y: 0, z: 1});

export const lerpCam = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
  yaw: a.yaw + (b.yaw - a.yaw) * t,
  pitch: a.pitch + (b.pitch - a.pitch) * t,
  f: a.f + (b.f - a.f) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});

/** a camera that looks at target `tg` from distance `dist`, at yaw/pitch (deg), with focal length f */
export const orbit = (tg: V3, dist: number, yaw: number, pitch: number, f: number, roll = 0): Cam3 => {
  const cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch));
  const cyw = Math.cos(rad(yaw)), syw = Math.sin(rad(yaw));
  // direction from camera to target: start along -Z, pitch (negative = look down), then yaw
  const dir = {x: -syw * cp, y: sp, z: -cyw * cp};
  return {x: tg.x - dir.x * dist, y: tg.y - dir.y * dist, z: tg.z - dir.z * dist, yaw, pitch, f, roll};
};

/** a world polygon clipped against the camera's near plane (Sutherland-Hodgman) and projected; null if all behind */
export const projectPoly = (c: Cam3, pts: V3[], near = 4) => {
  const q = pts.map((p) => toCam(c, p));
  const out: V3[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i], b = q[(i + 1) % q.length];
    const ina = -a.z >= near, inb = -b.z >= near;
    if (ina) out.push(a);
    if (ina !== inb) {
      const u = (-near - a.z) / (b.z - a.z);
      out.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: -near});
    }
  }
  if (out.length < 3) return null;
  return out.map((p) => {
    let sx = (c.f * p.x) / -p.z, sy = (-c.f * p.y) / -p.z;
    if (c.roll) {
      const r = rad(c.roll), cr = Math.cos(r), sr = Math.sin(r);
      [sx, sy] = [sx * cr - sy * sr, sx * sr + sy * cr];
    }
    return {x: CX + sx, y: CY + sy};
  });
};
export const polyD = (p: {x: number; y: number}[] | null) => (p ? `M${p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' L')} Z` : '');
