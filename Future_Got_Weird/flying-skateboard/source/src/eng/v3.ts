// 3D vectors, frames and the perspective camera. World: metres, Y up. The river flows along X; the crossing heads
// along +Z (toward the far bank). Every value in the film is a pure function of the frame.
export type V3 = {x: number; y: number; z: number};
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
const R = Math.PI / 180;

/** An orthonormal frame: origin + axes (right x, up y, forward z). */
export type Frame = {o: V3; x: V3; y: V3; z: V3};
/** Frame from yaw (about world Y, 0 = facing +Z), pitch (nose up +), roll (right side down +). Degrees. */
export const frameYPR = (o: V3, yaw: number, pitch: number, roll: number): Frame => {
  const cy = Math.cos(yaw * R), sy = Math.sin(yaw * R);
  const cp = Math.cos(pitch * R), sp = Math.sin(pitch * R);
  const cr = Math.cos(roll * R), sr = Math.sin(roll * R);
  // forward after yaw and pitch
  const fz: V3 = {x: sy * cp, y: sp, z: cy * cp};
  // right after yaw (level), then roll about forward
  const rx0: V3 = {x: cy, y: 0, z: -sy};
  const uy0 = c3(fz, rx0); // up before roll
  const x = a3(m3(rx0, cr), m3(uy0, -sr));
  const y = a3(m3(uy0, cr), m3(rx0, sr));
  return {o, x, y, z: fz};
};
/** local -> world */
export const toW = (F: Frame, p: V3): V3 => a3(F.o, a3(a3(m3(F.x, p.x), m3(F.y, p.y)), m3(F.z, p.z)));
export const dirW = (F: Frame, p: V3): V3 => a3(a3(m3(F.x, p.x), m3(F.y, p.y)), m3(F.z, p.z));
/** world -> local */
export const toL = (F: Frame, p: V3): V3 => {
  const d = s3(p, F.o);
  return {x: d3(d, F.x), y: d3(d, F.y), z: d3(d, F.z)};
};

export const W = 1080;
export const H = 1920;

export type Cam = {pos: V3; tgt: V3; roll?: number; fov?: number};
export type Proj = {x: number; y: number; z: number; k: number};
export type Lens = {f: V3; r: V3; u: V3; pos: V3; foc: number; p: (q: V3) => Proj; cam: Cam};

/** Perspective lens for a camera (vertical fov in degrees). k = pixels per metre at the point's depth. */
export const lens = (cam: Cam): Lens => {
  const f = n3(s3(cam.tgt, cam.pos));
  let r = n3(c3({x: 0, y: 1, z: 0}, f));
  if (!isFinite(r.x)) r = {x: 1, y: 0, z: 0};
  let u = c3(f, r);
  const ro = (cam.roll ?? 0) * R;
  if (ro) {
    const r2 = a3(m3(r, Math.cos(ro)), m3(u, Math.sin(ro)));
    const u2 = a3(m3(u, Math.cos(ro)), m3(r, -Math.sin(ro)));
    r = r2;
    u = u2;
  }
  const foc = H / 2 / Math.tan(((cam.fov ?? 50) * R) / 2);
  const p = (q: V3): Proj => {
    const d = s3(q, cam.pos);
    const zc = Math.max(0.02, d3(d, f));
    const k = foc / zc;
    return {x: W / 2 + d3(d, r) * k, y: H / 2 - d3(d, u) * k, z: zc, k};
  };
  return {f, r, u, pos: cam.pos, foc, p, cam};
};
/** depth along the view axis (can be negative: behind the camera) */
export const depth = (L: Lens, q: V3) => d3(s3(q, L.pos), L.f);

/** Blend two cameras (positions, targets, roll, fov). */
export const camMix = (a: Cam, b: Cam, t: number): Cam => ({
  pos: lerp3(a.pos, b.pos, t),
  tgt: lerp3(a.tgt, b.tgt, t),
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
  fov: (a.fov ?? 50) + ((b.fov ?? 50) - (a.fov ?? 50)) * t,
});
/** Camera on a sphere about a target: azimuth (deg, 0 = camera on -Z looking +Z), elevation (deg), distance. */
export const orbit = (tgt: V3, az: number, el: number, dist: number, roll = 0, fov = 50): Cam => ({
  pos: a3(tgt, {x: -Math.sin(az * R) * Math.cos(el * R) * dist, y: Math.sin(el * R) * dist, z: -Math.cos(az * R) * Math.cos(el * R) * dist}),
  tgt,
  roll,
  fov,
});

/** Clip a 3D polygon to the part in front of the camera (depth > near), Sutherland-Hodgman. */
export const clipNear = (Lz: Lens, poly: V3[], near = 0.3, closed = true): V3[] => {
  const dz = (q: V3) => d3(s3(q, Lz.pos), Lz.f) - near;
  const out: V3[] = [];
  const n = poly.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const da = dz(a), db = dz(b);
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) out.push(lerp3(a, b, da / (da - db)));
  }
  if (!closed && n && dz(poly[n - 1]) >= 0) out.push(poly[n - 1]);
  return out;
};
