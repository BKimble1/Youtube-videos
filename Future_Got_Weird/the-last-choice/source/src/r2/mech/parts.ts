// Low-poly part meshes for the three machine families. Each part is modelled around its joint (local origin);
// limb segments hang down local −y, fronts face local −z, right is +x. Prepared once at module load.
import {V3} from '../../kit/math';
import {Mesh, Face, prep, Prepped, merge, cylinder, slab} from '../engine';

// ------------------------------------------------------------------ builders
/** Frustum box: bottom rectangle (w0 × d0) at y0 centred on z=zc0, top (w1 × d1) at y1 centred on z=zc1. */
export const taper = (w0: number, d0: number, y0: number, w1: number, d1: number, y1: number, mats: string | string[], zc0 = 0, zc1 = 0, xc0 = 0, xc1 = 0): Mesh => {
  const M = typeof mats === 'string' ? [mats, mats, mats, mats, mats, mats] : mats; // top, bottom, front(−z), back(+z), left(−x), right(+x)
  const v: V3[] = [
    {x: xc0 - w0 / 2, y: y0, z: zc0 - d0 / 2}, {x: xc0 + w0 / 2, y: y0, z: zc0 - d0 / 2}, {x: xc0 + w0 / 2, y: y0, z: zc0 + d0 / 2}, {x: xc0 - w0 / 2, y: y0, z: zc0 + d0 / 2},
    {x: xc1 - w1 / 2, y: y1, z: zc1 - d1 / 2}, {x: xc1 + w1 / 2, y: y1, z: zc1 - d1 / 2}, {x: xc1 + w1 / 2, y: y1, z: zc1 + d1 / 2}, {x: xc1 - w1 / 2, y: y1, z: zc1 + d1 / 2},
  ];
  const lo = y0 < y1;
  const faces: Face[] = [
    {v: [4, 7, 6, 5], mat: M[0]}, {v: [0, 1, 2, 3], mat: M[1]}, {v: [0, 4, 5, 1], mat: M[2]}, {v: [3, 2, 6, 7], mat: M[3]}, {v: [0, 3, 7, 4], mat: M[4]}, {v: [1, 5, 6, 2], mat: M[5]},
  ];
  if (!lo) faces.forEach((f) => f.v.reverse());
  return {verts: v, faces, crease: 28};
};
/** Box by min/max with the 6-material order of `taper`. */
export const bx = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mats: string | string[]) =>
  taper(x1 - x0, z1 - z0, y0, x1 - x0, z1 - z0, y1, mats, (z0 + z1) / 2, (z0 + z1) / 2, (x0 + x1) / 2, (x0 + x1) / 2);

/** Extrude a side profile (points in (z, y), any winding) along x from −hw to +hw. caps = the ±x faces. */
export const prismX = (prof: {z: number; y: number}[], hw: number, side: string, cap: string, x0 = 0): Mesh => {
  // signed area in the (z, y) plane; we want the +x cap's normal along +x
  let a = 0;
  for (let i = 0; i < prof.length; i++) { const p = prof[i], q = prof[(i + 1) % prof.length]; a += p.z * q.y - q.z * p.y; }
  const P = a > 0 ? [...prof].reverse() : prof;
  const n = P.length;
  const verts: V3[] = [...P.map((p) => ({x: x0 - hw, y: p.y, z: p.z})), ...P.map((p) => ({x: x0 + hw, y: p.y, z: p.z}))];
  const faces: Face[] = [{v: P.map((_, i) => n + i), mat: cap}, {v: P.map((_, i) => n - 1 - i), mat: cap}];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push({v: [i, j, n + j, n + i], mat: side}); }
  const m: Mesh = {verts, faces, crease: 28};
  return fixOutward(m);
};

/** Make every face's normal point away from the mesh centroid (convex-ish parts). */
export const fixOutward = (m: Mesh): Mesh => {
  const c = m.verts.reduce((s, p) => ({x: s.x + p.x, y: s.y + p.y, z: s.z + p.z}), {x: 0, y: 0, z: 0});
  const C = {x: c.x / m.verts.length, y: c.y / m.verts.length, z: c.z / m.verts.length};
  m.faces.forEach((f) => {
    const P = f.v.map((i) => m.verts[i]);
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; nx += (a.y - b.y) * (a.z + b.z); ny += (a.z - b.z) * (a.x + b.x); nz += (a.x - b.x) * (a.y + b.y); }
    const fc = P.reduce((s, p) => ({x: s.x + p.x / P.length, y: s.y + p.y / P.length, z: s.z + p.z / P.length}), {x: 0, y: 0, z: 0});
    if (nx * (fc.x - C.x) + ny * (fc.y - C.y) + nz * (fc.z - C.z) < 0) f.v.reverse();
  });
  return m;
};

export const mirrorX = (m: Mesh): Mesh => ({...m, verts: m.verts.map((p) => ({x: -p.x, y: p.y, z: p.z})), faces: m.faces.map((f) => ({...f, v: [...f.v].reverse()}))});
const T = (m: Mesh, d: V3): Mesh => ({...m, verts: m.verts.map((p) => ({x: p.x + d.x, y: p.y + d.y, z: p.z + d.z}))});
const RX = (m: Mesh, deg: number): Mesh => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return {...m, verts: m.verts.map((p) => ({x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c}))};
};
const RZ = (m: Mesh, deg: number): Mesh => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return {...m, verts: m.verts.map((p) => ({x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z}))};
};
const RYm = (m: Mesh, deg: number): Mesh => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return {...m, verts: m.verts.map((p) => ({x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c}))};
};
const M_ = (...ms: Mesh[]) => ({...merge(...ms), crease: 28});

// ------------------------------------------------------------------ combat unit (2.2 m humanoid)
// dimensions shared with unit.tsx
export const U = {
  ankleH: 0.10, shin: 0.50, thigh: 0.48, hipW: 0.15, pelvisH: 1.10, // pelvis centre height when standing straight
  spine: 0.10, chestH: 0.56, shW: 0.31, shY: 0.47, // shoulder offset above the spine joint
  neck: 0.56, headC: 0.16, // head centre above the neck joint
  upper: 0.40, fore: 0.38, fist: 0.13,
};

const unitPelvis = M_(
  bx(-0.17, -0.12, -0.12, 0.17, 0.10, 0.12, 'm_dark'),
  bx(-0.21, -0.02, -0.15, 0.21, 0.10, 0.15, ['m_plate2', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2']),
  RX(bx(-0.13, -0.24, -0.19, 0.13, -0.02, -0.15, 'm_plate'), -8),
);
// torso frame (spine + ribs), visible when the plates come off
const unitCore = M_(
  taper(0.30, 0.22, 0, 0.50, 0.30, 0.52, 'm_frame'),
  bx(-0.05, 0.0, 0.08, 0.05, 0.50, 0.17, 'm_joint'),
  bx(-0.16, 0.30, -0.155, 0.16, 0.36, -0.13, 'm_joint'),
  bx(-0.14, 0.16, -0.14, 0.14, 0.22, -0.12, 'm_joint'),
);
// chest front plate (tears off forward) and back plate (the "back plate" pried off), hugging the core
const chestPts = [{u: -0.17, v: 0.0}, {u: 0.17, v: 0.0}, {u: 0.27, v: 0.30}, {u: 0.27, v: 0.50}, {u: -0.27, v: 0.50}, {u: -0.27, v: 0.30}];
const unitChest = fixOutward(slab({x: 0, y: 0.05, z: -0.125}, {x: 1, y: 0, z: 0}, {x: 0, y: 0.986, z: -0.165}, chestPts, 0.06, 'm_plate', 'm_plate2'));
const unitChestRidge = bx(-0.025, 0.14, -0.235, 0.025, 0.50, -0.18, 'm_plate2');
const unitBack = fixOutward(slab({x: 0, y: 0.05, z: 0.165}, {x: 1, y: 0, z: 0}, {x: 0, y: 0.99, z: 0.12}, chestPts.map((p) => ({u: p.u * 0.95, v: p.v * 0.96})), 0.06, 'm_plate2', 'm_plateDeep'));
const unitNeck = cylinder(0.065, 0.12, 6, 'm_joint', 'm_joint', -0.02);
// head: angular helmet, recessed visor band, single eye, crest
const unitHead = M_(
  taper(0.22, 0.24, -0.14, 0.25, 0.27, 0.10, ['m_plate', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2']),
  taper(0.25, 0.27, 0.10, 0.16, 0.20, 0.16, 'm_plate'),
  bx(-0.11, -0.03, -0.155, 0.11, 0.035, -0.125, 'm_glass'),
  bx(-0.032, -0.022, -0.17, 0.032, 0.03, -0.15, 'm_eye'),
  bx(-0.022, 0.10, -0.10, 0.022, 0.21, 0.12, 'm_plate2'),
  bx(-0.10, -0.20, -0.13, 0.10, -0.13, -0.06, 'm_plate2'),
);
const upperL = M_(
  bx(-0.06, -U.upper, -0.06, 0.06, 0.02, 0.06, 'm_frame'),
  bx(-0.085, -0.30, -0.08, 0.02, -0.06, 0.08, 'm_plate2'),
  cylinder(0.075, 0.12, 6, 'm_joint', 'm_joint', -U.upper - 0.06),
);
const pauldronL = fixOutward(T(RZ(taper(0.31, 0.35, -0.13, 0.25, 0.30, 0.07, 'm_plate'), 20), {x: -0.03, y: 0, z: 0}));
const foreL = M_(
  taper(0.15, 0.16, -U.fore, 0.13, 0.14, -0.02, ['m_plate', 'm_dark', 'm_plate', 'm_plate2', 'm_plate', 'm_plate2']),
  bx(-0.045, -U.fore + 0.06, -0.10, 0.045, -0.06, -0.08, 'm_plate2'),
);
const fistL = M_(
  bx(-0.065, -U.fist, -0.07, 0.065, 0.0, 0.065, 'm_dark'),
  bx(-0.07, -U.fist - 0.01, -0.085, 0.07, -0.05, -0.04, 'm_plate2'),
);
const handOpenL = M_(
  bx(-0.065, -0.07, -0.06, 0.065, 0.0, 0.055, 'm_dark'),
  ...[-0.045, -0.015, 0.015, 0.045].map((x) => bx(x - 0.012, -0.20, -0.06, x + 0.012, -0.07, -0.03, 'm_frame')),
  bx(-0.075, -0.13, -0.02, -0.055, -0.04, 0.02, 'm_frame'),
);
const thighL = M_(
  bx(-0.075, -U.thigh, -0.075, 0.075, 0.03, 0.075, 'm_frame'),
  RX(bx(-0.09, -0.36, -0.12, 0.09, -0.04, -0.07, 'm_plate'), 3),
  cylinder(0.09, 0.15, 6, 'm_joint', 'm_joint', -0.07),
);
const shinL = M_(
  taper(0.13, 0.15, -U.shin, 0.16, 0.18, -0.04, ['m_plate2', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2']),
  bx(-0.08, -0.13, -0.15, 0.08, 0.04, -0.08, 'm_plate'),
);
const footL = M_(
  taper(0.17, 0.32, -U.ankleH, 0.13, 0.18, -0.02, 'm_dark', -0.05, 0.0),
  bx(-0.09, -U.ankleH, -0.24, 0.09, -0.05, -0.12, 'm_plate2'),
);
// stumps (exposed interior after a limb comes off)
const stump = M_(cylinder(0.05, 0.08, 6, 'm_joint', 'm_black', -0.08), bx(-0.03, -0.12, -0.03, 0.03, -0.04, 0.03, 'm_piston'));

export const UNIT = {
  pelvis: prep(unitPelvis), core: prep(unitCore), chest: prep(M_(unitChest, unitChestRidge)), back: prep(unitBack), neck: prep(unitNeck), head: prep(unitHead),
  upperL: prep(upperL), upperR: prep(mirrorX(upperL)), pauldronL: prep(pauldronL), pauldronR: prep(mirrorX(pauldronL)),
  foreL: prep(foreL), foreR: prep(mirrorX(foreL)), fistL: prep(fistL), fistR: prep(mirrorX(fistL)), handL: prep(handOpenL), handR: prep(mirrorX(handOpenL)),
  thighL: prep(thighL), thighR: prep(mirrorX(thighL)), shinL: prep(shinL), shinR: prep(mirrorX(shinL)), footL: prep(footL), footR: prep(mirrorX(footL)),
  stump: prep(stump),
};
// mid-LOD: a handful of merged blocks (no small plates, no ink on small parts)
export const UNIT_MID = {
  torso: prep(M_(taper(0.34, 0.22, -0.1, 0.62, 0.30, 0.58, 'm_plate'), bx(-0.11, 0.62, -0.13, 0.11, 0.86, 0.13, 'm_plate2'), bx(-0.035, 0.70, -0.15, 0.035, 0.76, -0.12, 'm_eye'))),
  limb: prep(bx(-0.07, -0.9, -0.08, 0.07, 0.0, 0.08, 'm_plate2')),
  arm: prep(bx(-0.065, -0.85, -0.07, 0.065, 0.0, 0.07, 'm_frame')),
};

// ------------------------------------------------------------------ drone (span ~0.75 m)
const oct = (r: number) => Array.from({length: 8}, (_, i) => ({x: Math.cos(((i + 0.5) / 8) * Math.PI * 2) * r, z: Math.sin(((i + 0.5) / 8) * Math.PI * 2) * r * 1.25}));
const extr = (poly: {x: number; z: number}[], y0: number, y1: number, top: string, side: string, bottom: string): Mesh => {
  const n = poly.length;
  const verts: V3[] = [...poly.map((p) => ({x: p.x, y: y0, z: p.z})), ...poly.map((p) => ({x: p.x, y: y1, z: p.z}))];
  const faces: Face[] = [{v: poly.map((_, i) => n + i), mat: top}, {v: poly.map((_, i) => i), mat: bottom}];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push({v: [i, j, n + j, n + i], mat: side}); }
  return fixOutward({verts, faces, crease: 28});
};
const droneBody = M_(
  extr(oct(0.17), -0.05, 0.05, 'm_plate', 'm_plate2', 'm_dark'),
  extr(oct(0.11), 0.05, 0.085, 'm_dark', 'm_frame', 'm_dark'),
  bx(-0.04, -0.03, -0.24, 0.04, 0.02, -0.18, 'm_plate2'),
);
const droneArms = M_(...[45, 135, 225, 315].map((a) => RYm(bx(-0.022, -0.02, 0.10, 0.022, 0.015, 0.34, 'm_frame'), a)),
  ...[45, 135, 225, 315].map((a) => { const r = (a * Math.PI) / 180; return T(cylinder(0.035, 0.06, 6, 'm_joint', 'm_dark', -0.02), {x: Math.sin(r) * 0.34, y: 0, z: Math.cos(r) * 0.34}); }));
const rotorDisc = cylinder(0.15, 0.004, 10, 'm_rotor', 'm_rotor');
const droneGimbal = M_(
  taper(0.09, 0.09, -0.09, 0.07, 0.07, 0.0, 'm_dark'),
  bx(-0.055, -0.10, -0.06, 0.055, -0.02, 0.05, 'm_plate2'),
  bx(-0.026, -0.075, -0.075, 0.026, -0.035, -0.058, 'm_eye'),
);
const droneCutter = M_(bx(-0.015, -0.015, -0.30, 0.015, 0.015, 0.0, 'm_frame'), fixOutward(slab({x: 0, y: 0, z: -0.30}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: -1}, [{u: -0.05, v: 0}, {u: 0.05, v: 0}, {u: 0, v: 0.08}], 0.01, 'm_piston', 'm_piston')));

export const DRONE = {body: prep(droneBody), arms: prep(droneArms), rotor: prep(rotorDisc), gimbal: prep(droneGimbal), cutter: prep(droneCutter)};
export const DRONE_ROTORS: V3[] = [45, 135, 225, 315].map((a) => { const r = (a * Math.PI) / 180; return {x: Math.sin(r) * 0.34, y: 0.045, z: Math.cos(r) * 0.34}; });

// ------------------------------------------------------------------ heavy walker (~6 m)
export const HV = {
  hullY: 4.05, // hull reference (centre) height when standing
  hipX: 1.45, hipZ: 1.6, hipDrop: -0.6,
  upperLen: 1.95, lowerLen: 2.2, footX: 2.55, footZ: 2.7,
  ramShoulder: {x: 0, y: -0.85, z: -1.9} as V3, boom: 2.6,
  launcher: {x: 0.7, y: 1.45, z: 0.5} as V3,
  head: {x: 0, y: 0.55, z: -2.15} as V3,
};
const hullProfile = [{z: -1.95, y: 0.1}, {z: -1.55, y: 0.85}, {z: 0.55, y: 1.1}, {z: 1.95, y: 0.75}, {z: 2.05, y: -0.3}, {z: 1.3, y: -0.75}, {z: -1.45, y: -0.7}];
const HS = 1.25;
const hullCore = prismX(hullProfile.map((p) => ({z: p.z * 0.92 * HS, y: p.y * 0.86 * HS})), 1.3, 'm_frame', 'm_dark');
const hullPlateSide = (sd: 1 | -1) => fixOutward(prismX([{z: -1.7, y: 0.55}, {z: 0.5, y: 0.8}, {z: 1.6, y: 0.55}, {z: 1.6, y: -0.45}, {z: -1.3, y: -0.45}].map((p) => ({z: p.z * HS, y: p.y * HS})), 0.08, 'm_plate2', 'm_plate', sd * 1.42));
const hullTop = fixOutward(T(RX(prismX([{z: -1.5, y: 0}, {z: 1.75, y: 0}, {z: 1.6, y: 0.14}, {z: -1.4, y: 0.14}], 1.2, 'm_plate2', 'm_plate2'), -4), {x: 0, y: 1.1 * HS - 0.05, z: 0}));
const hullNose = fixOutward(prismX([{z: -2.05, y: 0.05}, {z: -1.62, y: 0.85}, {z: -1.42, y: 0.78}, {z: -1.82, y: -0.05}].map((p) => ({z: p.z * HS, y: p.y * HS})), 1.22, 'm_plate', 'm_plate2'));
const heavyHead = M_(
  taper(0.95, 0.85, -0.32, 0.8, 0.7, 0.28, ['m_plate', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2'], 0, 0.05),
  bx(-0.40, -0.08, -0.45, 0.40, 0.08, -0.40, 'm_glass'),
  bx(-0.12, -0.06, -0.49, 0.12, 0.08, -0.44, 'm_eye'),
  bx(-0.07, 0.28, -0.30, 0.07, 0.42, 0.25, 'm_plate2'),
  cylinder(0.3, 0.3, 8, 'm_joint', 'm_dark', -0.6),
);
const heavyUpper = M_(
  taper(0.5, 0.56, -HV.upperLen, 0.62, 0.66, 0.12, 'm_plate2'),
  bx(-0.33, -1.45, -0.40, 0.33, -0.25, -0.27, 'm_plate'),
  cylinder(0.4, 0.75, 8, 'm_joint', 'm_dark', -0.2),
);
const heavyLower = M_(
  taper(0.46, 0.5, -HV.lowerLen, 0.54, 0.6, 0.0, 'm_frame'),
  bx(-0.31, -1.75, -0.38, 0.31, -0.2, -0.26, 'm_plate'),
  bx(-0.08, -1.9, 0.26, 0.08, -0.3, 0.36, 'm_piston'),
  cylinder(0.36, 0.7, 8, 'm_joint', 'm_dark', -0.05),
);
const heavyFoot = M_(cylinder(0.62, 0.26, 8, 'm_dark', 'm_rubber', -0.22), bx(-0.24, -0.05, -0.24, 0.24, 0.28, 0.24, 'm_frame'));
const heavyBoom = M_(
  bx(-0.26, -0.26, -HV.boom, 0.26, 0.26, 0.15, ['m_plate2', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate', 'm_plate']),
  bx(-0.06, 0.26, -HV.boom + 0.4, 0.06, 0.38, -0.2, 'm_piston'),
  cylinder(0.34, 0.7, 8, 'm_joint', 'm_dark', -0.35),
);
const heavyRam = M_(
  bx(-0.48, -0.48, -1.15, 0.48, 0.48, 0.0, ['m_dark', 'm_dark', 'm_dark', 'm_dark', 'm_dark', 'm_dark']),
  bx(-0.55, -0.55, -1.32, 0.55, 0.55, -1.12, 'm_plate'),
  bx(-0.36, -0.36, -1.40, 0.36, 0.36, -1.32, 'm_plate2'),
);
const heavyLauncher = M_(
  bx(-0.45, -0.25, -0.75, 0.45, 0.35, 0.75, ['m_plate', 'm_dark', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2']),
  ...[[-0.2, 0.15], [0.2, 0.15], [-0.2, -0.08], [0.2, -0.08]].map(([x, y]) => bx(x - 0.09, y - 0.08, -0.80, x + 0.09, y + 0.08, -0.74, 'm_black')),
  cylinder(0.35, 0.18, 8, 'm_joint', 'm_dark', -0.45),
);
export const HEAVY = {
  core: prep(hullCore), plateL: prep(hullPlateSide(-1)), plateR: prep(hullPlateSide(1)), top: prep(hullTop), nose: prep(hullNose), head: prep(heavyHead),
  upper: prep(heavyUpper), lower: prep(heavyLower), foot: prep(heavyFoot), boom: prep(heavyBoom), ram: prep(heavyRam), launcher: prep(heavyLauncher),
};

// ------------------------------------------------------------------ loose debris (generic torn plates, shards)
export const DEBRIS = {
  plateS: prep(bx(-0.16, -0.02, -0.12, 0.16, 0.02, 0.12, ['m_plate', 'm_plateDeep', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2'])),
  plateL: prep(bx(-0.6, -0.04, -0.45, 0.6, 0.04, 0.45, ['m_plate', 'm_plateDeep', 'm_plate2', 'm_plate2', 'm_plate2', 'm_plate2'])),
  shard: prep(fixOutward(slab({x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 0, z: 1}, [{u: -0.08, v: -0.05}, {u: 0.1, v: -0.03}, {u: 0.02, v: 0.09}], 0.02, 'm_plate2', 'm_frame'))),
  rod: prep(bx(-0.02, -0.02, -0.25, 0.02, 0.02, 0.25, 'm_piston')),
};
export type PartMesh = Prepped;
