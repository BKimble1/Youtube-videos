// Ported from FGW Invisibility Shield V4 (claude/inspiring-clarke-meyznm: invisibility-shield/source/src/v4).
// V4 geometry: a flat multiplane. The corridor is a set of flat illustrated planes placed in one perspective space;
// characters and props are 2D cutout cards (drawn orthographically at the scale their ground point projects to).
// Units: metres in the world, "u" (Weird Crew rig units, the Video 01 figure is 440 u tall) inside a card.
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul3 = (a: V3, s: number): V3 => ({x: a.x * s, y: a.y * s, z: a.z * s});
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
export const norm3 = (a: V3): V3 => {
  const l = len3(a) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});
const R = Math.PI / 180;
/** rotate about the vertical axis (deg; + turns +Z toward +X) */
export const yawV = (p: V3, a: number): V3 => {
  const c = Math.cos(a * R), s = Math.sin(a * R);
  return {x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c};
};
/** rotate about the lateral X axis (deg; + tips +Z down toward -Y) */
export const pitchV = (p: V3, a: number): V3 => {
  const c = Math.cos(a * R), s = Math.sin(a * R);
  return {x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c};
};
/** rotate about the forward Z axis (deg; + tips +Y toward +X) */
export const rollV = (p: V3, a: number): V3 => {
  const c = Math.cos(a * R), s = Math.sin(a * R);
  return {x: p.x * c + p.y * s, y: -p.x * s + p.y * c, z: p.z};
};

/** Two-bone IK. Returns the middle joint and the end point actually reached (targets out of reach are approached in a straight line). */
export const ik2 = (a: V3, t: V3, l1: number, l2: number, pole: V3) => {
  const d0 = sub3(t, a);
  const raw = len3(d0) || 1e-6;
  const n = mul3(d0, 1 / raw);
  const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, raw));
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let m = sub3(pole, mul3(n, dot3(pole, n)));
  if (len3(m) < 1e-6) m = Math.abs(n.y) < 0.9 ? v3(0, 1, 0) : v3(0, 0, 1);
  m = norm3(m);
  return {j: add3(a, add3(mul3(n, x), mul3(m, h))), e: add3(a, mul3(n, d)), short: raw - d};
};

// ------------------------------------------------------------------ camera
/** A pinhole camera. yaw: 0 looks along +Z, 90 along +X. pitch: + looks up. f in px. (cx, cy) principal point. */
export type Cam = {pos: V3; yaw: number; pitch: number; f: number; cx: number; cy: number; roll?: number};
export const camBasis = (c: Cam) => {
  const cy = Math.cos(c.yaw * R), sy = Math.sin(c.yaw * R), cp = Math.cos(c.pitch * R), sp = Math.sin(c.pitch * R);
  const fwd = v3(sy * cp, sp, cy * cp);
  const right = norm3(cross3(fwd, v3(0, 1, 0)));
  const up = cross3(right, fwd);
  return {fwd, right, up};
};
export type B = ReturnType<typeof camBasis> & {c: Cam};
export const basis = (c: Cam): B => ({...camBasis(c), c});
export type P2 = {x: number; y: number; z: number};
export const proj = (b: B, p: V3): P2 => {
  const d = sub3(p, b.c.pos);
  const z = dot3(d, b.fwd);
  const x = dot3(d, b.right), y = dot3(d, b.up);
  const zz = Math.max(z, 1e-4);
  let sx = (b.c.f * x) / zz, sy = (-b.c.f * y) / zz;
  if (b.c.roll) {
    const r = b.c.roll * R, c = Math.cos(r), s = Math.sin(r);
    [sx, sy] = [sx * c - sy * s, sx * s + sy * c];
  }
  return {x: b.c.cx + sx, y: b.c.cy + sy, z};
};
/** Clip a world polygon to the near plane, then project it. */
export const projPoly = (b: B, pts: V3[], near = 0.05): P2[] => {
  const dz = (p: V3) => dot3(sub3(p, b.c.pos), b.fwd) - near;
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], c = pts[(i + 1) % pts.length];
    const da = dz(a), dc = dz(c);
    if (da >= 0) out.push(a);
    if (da >= 0 !== dc >= 0) out.push(lerp3(a, c, da / (da - dc)));
  }
  return out.map((p) => proj(b, p));
};
export const pathOf = (pts: {x: number; y: number}[], close = true) =>
  pts.length ? `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}${close ? 'Z' : ''}` : '';

// ------------------------------------------------------------------ cards
export const U = 267; // rig units per metre (the 440 u Crew figure is 1.65 m tall)
/** A character card: where its ground point lands, its scale (px per u) and its yaw relative to the camera
 *  (0 = facing the camera, +90 = facing screen-right). heading: world facing (deg, 0 = +Z, 90 = +X). */
export type Card = {x: number; y: number; k: number; phi: number; depth: number};
export const cardOf = (b: B, ground: V3, heading: number, sizeScale = 1): Card => {
  const p = proj(b, ground);
  const f = v3(Math.sin(heading * R), 0, Math.cos(heading * R));
  const fx = dot3(f, b.right), fz = -dot3(f, b.fwd);
  return {x: p.x, y: p.y, k: (b.c.f / Math.max(p.z, 0.05) / U) * sizeScale, phi: (Math.atan2(fx, fz) * 180) / Math.PI, depth: p.z};
};
/** Card-local point (u: X = the character's left, Y up, Z forward) to screen, plus depth toward the camera (u). */
export const cardPt = (cd: Card, p: V3) => {
  const c = Math.cos(cd.phi * R), s = Math.sin(cd.phi * R);
  return {x: cd.x + cd.k * (p.x * c + p.z * s), y: cd.y - cd.k * p.y, d: -p.x * s + p.z * c};
};
/** Card-local point to world (metres). */
export const cardToWorld = (ground: V3, heading: number, p: V3, sizeScale = 1): V3 => {
  const c = Math.cos(heading * R), s = Math.sin(heading * R);
  // local X (left) = (cos h, 0, -sin h); local Z (forward) = (sin h, 0, cos h)
  const k = sizeScale / U;
  return v3(ground.x + k * (p.x * c + p.z * s), ground.y + k * p.y, ground.z + k * (-p.x * s + p.z * c));
};
/** World point to card-local u. */
export const worldToCard = (ground: V3, heading: number, w: V3, sizeScale = 1): V3 => {
  const c = Math.cos(heading * R), s = Math.sin(heading * R);
  const d = sub3(w, ground);
  const k = U / sizeScale;
  return v3(k * (d.x * c - d.z * s), k * d.y, k * (d.x * s + d.z * c));
};

/** Outline width (screen px) for ink at a given rig scale: thicker in close-ups, never proportional. */
export const inkW = (k: number, base = 4) => base * Math.pow(Math.max(0.05, k), 0.6);
