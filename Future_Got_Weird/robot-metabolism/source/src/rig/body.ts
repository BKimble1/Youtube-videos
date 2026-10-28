// Tetrahedron geometry from its six link lengths. Every vertex is derived from the lengths, a tilt about the front
// edge and a ground placement, so the drawn links always equal the commanded lengths (the probe checks this).
//
// Vertex names: V0 front-near, V2 front-far (the front edge, on the ground), V1 rear (on the ground, or lifted when the
// body rears up onto its walking stick), V3 apex.
import {add, len, mul, norm, sub, V3, v3, cross, rotAxis, dot} from '../lib/v3';
import {GY} from './truss';

export type Lens = {l02: number; l01: number; l12: number; l03: number; l13: number; l23: number};
export const REG = 0.33;
export const regular = (): Lens => ({l02: REG, l01: REG, l12: REG, l03: REG, l13: REG, l23: REG});

/** the point at distances r1, r2, r3 from p1, p2, p3 (the solution on the `up` side of the plane p1 p2 p3) */
export const trilat = (p1: V3, p2: V3, p3: V3, r1: number, r2: number, r3: number, up: V3): V3 => {
  const ex = norm(sub(p2, p1));
  const i = dot(ex, sub(p3, p1));
  const ey = norm(sub(sub(p3, p1), mul(ex, i)));
  let ez = cross(ex, ey);
  if (dot(ez, up) < 0) ez = mul(ez, -1);
  const d = len(sub(p2, p1));
  const j = dot(ey, sub(p3, p1));
  const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const y = (r1 * r1 - r3 * r3 + i * i + j * j) / (2 * j) - (i / j) * x;
  const z = Math.sqrt(Math.max(0, r1 * r1 - x * x - y * y));
  return add(add(add(p1, mul(ex, x)), mul(ey, y)), mul(ez, z));
};

export type Pose = {x: number; z: number; yaw: number; tilt: number};
export type Tet = {V0: V3; V1: V3; V2: V3; V3: V3};

/** vertices in the ground frame: front edge centred at (x, GY, z), facing -x before yaw; tilt (rad) lifts V1 */
export const tetra = (L: Lens, p: Pose): Tet => {
  const h = L.l02 / 2;
  const zz = (L.l12 * L.l12 - L.l01 * L.l01) / (2 * L.l02);
  const d = Math.sqrt(Math.max(0, L.l01 * L.l01 - (zz - h) * (zz - h)));
  let V0 = v3(0, 0, h), V2 = v3(0, 0, -h), V1 = v3(d, 0, zz);
  let V3_ = trilat(V0, V1, V2, L.l03, L.l13, L.l23, v3(0, 1, 0));
  // rear up: rotate about the front edge so V1 lifts
  const k = v3(0, 0, 1);
  V1 = rotAxis(V1, v3(0, 0, 0), k, p.tilt);
  V3_ = rotAxis(V3_, v3(0, 0, 0), k, p.tilt);
  const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  const place = (q: V3): V3 => v3(p.x + q.x * c + q.z * s, GY + q.y, p.z - q.x * s + q.z * c);
  return {V0: place(V0), V1: place(V1), V2: place(V2), V3: place(V3_)};
};

export const EDGES: [keyof Tet, keyof Tet, keyof Lens][] = [
  ['V0', 'V2', 'l02'],
  ['V0', 'V1', 'l01'],
  ['V1', 'V2', 'l12'],
  ['V0', 'V3', 'l03'],
  ['V1', 'V3', 'l13'],
  ['V2', 'V3', 'l23'],
];

/** lens + delta */
export const lensAdd = (a: Lens, d: Partial<Lens>): Lens => ({
  l02: a.l02 + (d.l02 ?? 0), l01: a.l01 + (d.l01 ?? 0), l12: a.l12 + (d.l12 ?? 0),
  l03: a.l03 + (d.l03 ?? 0), l13: a.l13 + (d.l13 ?? 0), l23: a.l23 + (d.l23 ?? 0),
});
