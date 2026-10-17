// Set pieces with a story function: the van with the radio (the Director dies beside it), the death slab, the fallen
// elevated-rail girder with the crushed taxi, the bus wreck, burnt cars, broken slabs and rebar for the ridge, and a
// foreground-debris helper. Local model space: forward = −z (north at heading 0), right = +x, up = +y.
import {V3, rnd, add3, sub3, mul3, norm3, cross3, len3} from '../../kit/math';
import {Mesh, Face, Overlay, Prepped, prep, box, cylinder, merge, xfMesh, xfPoint, Xf, slab, chunk, cbox, headingVec} from '../engine';
import {PLAN} from './plan';
import {groundH} from './ground';

// ------------------------------------------------------------------ small builders
/** Box between two points with a w × h cross-section (beams, truss members). `up` orients the cross-section. */
export const beam = (a: V3, b: V3, w: number, h: number, mat: string, up: V3 = {x: 0, y: 1, z: 0}): Mesh => {
  const L = len3(sub3(b, a));
  const f = norm3(sub3(b, a));
  let r = cross3(f, up);
  if (len3(r) < 1e-4) r = cross3(f, {x: 1, y: 0, z: 0});
  r = norm3(r);
  const u = cross3(r, f);
  const B = box({x: -w / 2, y: -h / 2, z: 0}, {x: w / 2, y: h / 2, z: L}, mat);
  return {...B, verts: B.verts.map((p) => add3(a, add3(add3(mul3(r, p.x), mul3(u, p.y)), mul3(f, p.z))))};
};

/** A prism from a side profile in the (z, y) plane extruded along x from x0 to x1 (vehicle bodies). */
export const prismX = (profile: {z: number; y: number}[], x0: number, x1: number, side: string, cap: string, capOv?: [Overlay[]?, Overlay[]?]): Mesh => {
  const n = profile.length;
  const verts: V3[] = [...profile.map((p) => ({x: x0, y: p.y, z: p.z})), ...profile.map((p) => ({x: x1, y: p.y, z: p.z}))];
  // profile assumed CCW seen from +x (z to the left = forward, y up): the x1 cap faces +x
  let area = 0;
  for (let i = 0; i < n; i++) { const a = profile[i], b = profile[(i + 1) % n]; area += a.z * b.y - b.z * a.y; }
  const ccw = area < 0; // seen from +x, z axis points left
  const idx = (i: number) => (ccw ? i : n - 1 - i);
  const faces: Face[] = [
    {v: Array.from({length: n}, (_, i) => n + idx(i)), mat: cap, ov: capOv?.[1]},
    {v: Array.from({length: n}, (_, i) => idx(n - 1 - i)), mat: cap, ov: capOv?.[0]},
  ];
  for (let i = 0; i < n; i++) {
    const a = idx(i), b = idx((i + 1) % n);
    faces.push({v: [a, b, n + b, n + a], mat: side});
  }
  const m: Mesh = {verts, faces, crease: 28};
  return m;
};

/** Flip any face whose normal points toward `inside` (fix-up for hand-built closed meshes). */
export const orientOutward = (m: Mesh, inside: V3): Mesh => {
  const faces = m.faces.map((f) => {
    const P = f.v.map((i) => m.verts[i]);
    let n = {x: 0, y: 0, z: 0};
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      n = {x: n.x + (a.y - b.y) * (a.z + b.z), y: n.y + (a.z - b.z) * (a.x + b.x), z: n.z + (a.x - b.x) * (a.y + b.y)};
    }
    const c = mul3(P.reduce((s, q) => add3(s, q), {x: 0, y: 0, z: 0}), 1 / P.length);
    return n.x * (c.x - inside.x) + n.y * (c.y - inside.y) + n.z * (c.z - inside.z) < 0 ? {...f, v: [...f.v].reverse()} : f;
  });
  return {...m, faces};
};

const rect = (x0: number, y0: number, x1: number, y1: number, z: number): V3[] => [{x: x0, y: y0, z}, {x: x1, y: y0, z}, {x: x1, y: y1, z}, {x: x0, y: y1, z}];
const rectX = (z0: number, y0: number, z1: number, y1: number, x: number): V3[] => [{x, y: y0, z: z0}, {x, y: y0, z: z1}, {x, y: y1, z: z1}, {x, y: y1, z: z0}];

// ------------------------------------------------------------------ the van (with the radio) and the death slab
export const VAN_XF: Xf = {pos: {x: PLAN.van.pos.x, y: groundH(PLAN.van.pos.x, PLAN.van.pos.z) - 0.05, z: PLAN.van.pos.z}, yaw: PLAN.van.heading, roll: PLAN.van.tiltDeg};
/** Van-local → world. */
export const vanToWorld = (p: V3) => xfPoint(p, VAN_XF);

const buildVan = (): Mesh => {
  const W = 1.05, floor = 0.62, top = 2.72, zF = -1.25, zR = 3.0;
  // cargo box with the open sliding door on the right (+x) side
  const parts: Mesh[] = [];
  const dz0 = -1.05, dz1 = 0.75, dy0 = floor + 0.05, dy1 = 2.42;
  // right side wall as cells around the door opening (shared plane, inked only at the opening)
  const rightCells: [number, number, number, number][] = [
    [zF, floor - 0.2, dz0, top], [dz1, floor - 0.2, zR, top], [dz0, dy1, dz1, top], [dz0, floor - 0.2, dz1, dy0],
  ];
  const verts: V3[] = [];
  const faces: Face[] = [];
  const vmap = new Map<string, number>();
  const vi = (p: V3) => { const k = `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`; let i = vmap.get(k); if (i === undefined) { i = verts.length; verts.push(p); vmap.set(k, i); } return i; };
  const quad = (P: V3[], mat: string, ov?: Overlay[]) => faces.push({v: P.map(vi), mat, ov});
  // right side: split along z at dz0/dz1 and y at dy0/dy1 (3×3 grid minus the door)
  const zs = [zF, dz0, dz1, zR], ys = [floor - 0.2, dy0, dy1, top];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) continue;
    // +x face: seen from +x, CCW with z to the left → order (z1,y0) (z0,y0)… gives +x; use rectX then orient later
    quad(rectX(zs[i], ys[j], zs[i + 1], ys[j + 1], W), 'van', j === 2 && i !== 1 ? [{pts: [{x: W + 0.01, y: 1.65, z: zs[i]}, {x: W + 0.01, y: 1.65, z: zs[i + 1]}, {x: W + 0.01, y: 1.95, z: zs[i + 1]}, {x: W + 0.01, y: 1.95, z: zs[i]}], mat: 'vanStripe'}] : undefined);
  }
  void rightCells;
  // left side (with stripe), roof, rear, front bulkhead, bottom
  quad(rectX(zF, floor - 0.2, zR, top, -W), 'van', [{pts: [{x: -W - 0.01, y: 1.65, z: zF}, {x: -W - 0.01, y: 1.65, z: zR}, {x: -W - 0.01, y: 1.95, z: zR}, {x: -W - 0.01, y: 1.95, z: zF}], mat: 'vanStripe'}]);
  quad([{x: -W, y: top, z: zF}, {x: -W, y: top, z: zR}, {x: W, y: top, z: zR}, {x: W, y: top, z: zF}], 'van');
  quad(rect(-W, floor - 0.2, W, top, zR), 'van', [{pts: [{x: -0.02, y: floor, z: zR + 0.01}, {x: 0.02, y: floor, z: zR + 0.01}, {x: 0.02, y: top - 0.1, z: zR + 0.01}, {x: -0.02, y: top - 0.1, z: zR + 0.01}], mat: 'vanDark'}]);
  quad(rect(-W, floor - 0.2, W, top, zF), 'van');
  quad([{x: -W, y: floor - 0.2, z: zF}, {x: W, y: floor - 0.2, z: zF}, {x: W, y: floor - 0.2, z: zR}, {x: -W, y: floor - 0.2, z: zR}], 'vanDark');
  // the door opening: jambs, floor, ceiling, and the dark interior (inner left wall)
  const inner = W - 0.06;
  quad([{x: W, y: dy0, z: dz0}, {x: inner, y: dy0, z: dz0}, {x: inner, y: dy1, z: dz0}, {x: W, y: dy1, z: dz0}], 'vanFloor');
  quad([{x: W, y: dy0, z: dz1}, {x: W, y: dy1, z: dz1}, {x: inner, y: dy1, z: dz1}, {x: inner, y: dy0, z: dz1}], 'vanFloor');
  const shell = {verts, faces, crease: 25} as Mesh;
  let van = orientOutward(shell, {x: 0, y: 1.6, z: 0.9});
  // interior (seen through the door): floor, far wall, ceiling — inward-facing, drawn first
  const interior: Mesh = {
    verts: [
      {x: -inner, y: floor, z: zF + 0.05}, {x: inner, y: floor, z: zF + 0.05}, {x: inner, y: floor, z: zR - 0.05}, {x: -inner, y: floor, z: zR - 0.05},
      {x: -inner, y: top - 0.05, z: zF + 0.05}, {x: -inner, y: top - 0.05, z: zR - 0.05},
    ],
    faces: [
      {v: [0, 3, 2, 1], mat: 'vanFloor'}, // floor, facing up
      {v: [0, 4, 5, 3], mat: 'interiorDeep'}, // far (left) wall, facing +x
    ],
    twoSided: true,
    bias: -0.6,
  };
  // the slid-back door panel, cab, wheels, bumper
  const door = box({x: W + 0.04, y: dy0 - 0.05, z: dz1 + 0.05}, {x: W + 0.12, y: dy1 + 0.04, z: dz1 + 1.85}, ['van', 'van', 'van', 'van', 'vanDark', 'van']);
  const cab = prismX([{z: zF, y: floor - 0.2}, {z: zF, y: 2.35}, {z: -1.75, y: 2.3}, {z: -2.6, y: 1.35}, {z: -2.95, y: 1.15}, {z: -2.98, y: floor - 0.1}], -W + 0.04, W - 0.04, 'van', 'van',
    [[{pts: [{x: -W + 0.03, y: 1.45, z: -1.35}, {x: -W + 0.03, y: 1.45, z: -2.1}, {x: -W + 0.03, y: 2.2, z: -1.72}, {x: -W + 0.03, y: 2.2, z: -1.35}], mat: 'window'}],
      [{pts: [{x: W - 0.03, y: 1.45, z: -1.35}, {x: W - 0.03, y: 2.2, z: -1.35}, {x: W - 0.03, y: 2.2, z: -1.72}, {x: W - 0.03, y: 1.45, z: -2.1}], mat: 'window'}]]);
  const windshield = slab({x: -W + 0.1, y: 1.4, z: -2.52}, {x: 1, y: 0, z: 0}, norm3({x: 0, y: 0.95, z: 0.62}), [{u: 0, v: 0}, {u: 2 * W - 0.2, v: 0}, {u: 2 * W - 0.2, v: 1.0}, {u: 0, v: 1.0}], 0.03, 'window', 'vanDark');
  const wheel = (x: number, z: number) => xfMesh(cylinder(0.43, 0.3, 10, 'tire', 'steelDark', -0.15), {roll: 90, pos: {x, y: 0.43, z}});
  parts.push(door, cab, windshield, wheel(-W + 0.1, -2.1), wheel(W - 0.1, -2.1), wheel(-W + 0.1, 2.0), wheel(W - 0.1, 2.0));
  parts.push(box({x: -W, y: 0.35, z: -3.08}, {x: W, y: 0.62, z: -2.92}, 'steelDark'));
  van = merge(van, ...parts);
  van.crease = 28;
  return merge(interior, van);
};

/** The radio: R1's RadioSmall look (battered red-brown body, dark round grille, warm dial, antenna, carry handle). */
const buildRadio = (on: boolean): Mesh => {
  const w = 0.34, h = 0.2, d = 0.11;
  const body = box({x: -w / 2, y: 0, z: -d / 2}, {x: w / 2, y: h, z: d / 2}, 'radio');
  const fz = -d / 2 - 0.004;
  const circ = (cx: number, cy: number, r: number, n = 14): V3[] => Array.from({length: n}, (_, i) => { const a = (-i / n) * Math.PI * 2; return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: fz}; });
  const holes: V3[][] = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 5) holes.push(circ(-0.075 + i * 0.016, 0.1 + j * 0.016, 0.005, 6));
  const front: Overlay[] = [
    {pts: circ(-0.075, 0.1, 0.062), mat: 'radioDark', ink: true},
    {polys: holes, mat: 'radioMetal'},
    {pts: [{x: 0.03, y: 0.12, z: fz}, {x: 0.145, y: 0.12, z: fz}, {x: 0.145, y: 0.17, z: fz}, {x: 0.03, y: 0.17, z: fz}].reverse(), mat: on ? 'dialOn' : 'dialOff', ink: true},
    {pts: [{x: 0.05, y: 0.125, z: fz - 0.001}, {x: 0.054, y: 0.125, z: fz - 0.001}, {x: 0.054, y: 0.165, z: fz - 0.001}, {x: 0.05, y: 0.165, z: fz - 0.001}].reverse(), mat: 'radioDark'},
    // battered: scuffs
    {polys: [[{x: -0.16, y: 0.02, z: fz}, {x: -0.11, y: 0.035, z: fz}], [{x: 0.1, y: 0.03, z: fz}, {x: 0.16, y: 0.06, z: fz}]], mat: 'radioMetal', line: 0.004},
  ];
  body.faces[2] = {...body.faces[2], ov: front}; // north (−z) face is the front
  const knob = xfMesh(cylinder(0.018, 0.02, 8, 'radioMetal', 'radioMetal'), {pitch: -90, pos: {x: 0.115, y: 0.055, z: -d / 2}});
  const knob2 = xfMesh(cylinder(0.014, 0.018, 8, 'radioMetal', 'radioMetal'), {pitch: -90, pos: {x: 0.06, y: 0.055, z: -d / 2}});
  const handleL = box({x: -0.13, y: h, z: -0.012}, {x: -0.11, y: h + 0.06, z: 0.012}, 'radioMetal');
  const handleR = box({x: 0.11, y: h, z: -0.012}, {x: 0.13, y: h + 0.06, z: 0.012}, 'radioMetal');
  const handleT = box({x: -0.13, y: h + 0.05, z: -0.012}, {x: 0.13, y: h + 0.07, z: 0.012}, 'radioDark');
  const antBase = box({x: 0.135, y: h, z: 0.01}, {x: 0.155, y: h + 0.03, z: 0.03}, 'radioMetal');
  const m = merge(body, knob, knob2, handleL, handleR, handleT, antBase);
  m.crease = 30;
  return m;
};

/** Radio placement: on the van floor just inside the open door, facing out of it (van-local). */
const RADIO_IN_VAN: Xf = {pos: {x: 0.78, y: 0.62, z: -0.18}, yaw: 90};
const radioLocalToWorld = (p: V3) => vanToWorld(xfPoint(p, RADIO_IN_VAN));
/** World base-centre of the radio, the knob the survivor turns (front lower-right), and the dial window. */
export const RADIO = {
  pos: radioLocalToWorld({x: 0, y: 0, z: 0}),
  knob: radioLocalToWorld({x: 0.115, y: 0.055, z: -0.075}),
  dial: radioLocalToWorld({x: 0.088, y: 0.145, z: -0.06}),
  antennaBase: radioLocalToWorld({x: 0.145, y: 0.22, z: 0.02}),
  antennaTip: radioLocalToWorld({x: 0.32, y: 0.62, z: 0.08}),
  /** heading the radio's front faces (toward the death slab) */
  heading: (PLAN.van.heading + 90) % 360,
};

let VAN_P: Prepped | null = null, RADIO_OFF: Prepped | null = null, RADIO_ON: Prepped | null = null;
export const vanMesh = () => (VAN_P ??= prep(buildVan()));
export const radioMesh = (on: boolean) => (on ? (RADIO_ON ??= prep(buildRadio(true))) : (RADIO_OFF ??= prep(buildRadio(false))));
/** Radio object → world transform (van + radio placement) as a vertex function. */
export const radioFn = (p: V3) => radioLocalToWorld(p);

/** The broken slab he dies against: leaning back, its face toward PLAN.deathHeading. */
export const DEATH_SLAB = (() => {
  const hd = headingVec(PLAN.deathHeading);
  const back = mul3(hd, -1);
  const right = {x: -hd.z, y: 0, z: hd.x}; // to the slab's right as seen by someone sitting facing hd
  const base = {x: PLAN.deathPos.x + back.x * 0.42, y: groundH(PLAN.deathPos.x, PLAN.deathPos.z) - 0.25, z: PLAN.deathPos.z + back.z * 0.42};
  const lean = norm3(add3({x: 0, y: 1, z: 0}, mul3(back, 0.36)));
  const o = add3(base, mul3(right, -1.15));
  return {base, lean, right, o, face: hd};
})();
const buildDeathSlab = (): Mesh => {
  const {o, right, lean} = DEATH_SLAB;
  const m = slab(o, right, lean, [{u: 0, v: 0}, {u: 2.3, v: 0}, {u: 2.25, v: 1.05}, {u: 1.7, v: 1.32}, {u: 1.25, v: 1.18}, {u: 0.7, v: 1.45}, {u: 0.08, v: 1.2}], 0.32, 'concrete', 'concreteEdge', 'concreteDark');
  return m;
};
let DS: Prepped | null = null;
export const deathSlabMesh = () => (DS ??= prep(buildDeathSlab()));

// ------------------------------------------------------------------ vehicles
/** A sedan-like car (generic, no badges). crushed 0..1 flattens the cabin. */
export const carMesh = (mat: string, crushed = 0, burnt = false): Mesh => {
  const body = prismX([{z: -2.3, y: 0.32}, {z: -2.3, y: 0.78}, {z: -1.0, y: 0.9}, {z: 1.6, y: 0.92}, {z: 2.25, y: 0.82}, {z: 2.25, y: 0.32}], -0.88, 0.88, burnt ? 'burnt' : mat, burnt ? 'burnt' : mat);
  const ch = 0.62 * (1 - crushed * 0.75);
  const cabin = prismX([{z: -0.95, y: 0.9}, {z: -0.45, y: 0.9 + ch}, {z: 0.85, y: 0.9 + ch}, {z: 1.45, y: 0.92}], -0.78, 0.78, burnt ? 'burnt' : 'window', burnt ? 'burnt' : mat);
  const wheel = (x: number, z: number) => xfMesh(cylinder(0.33, 0.22, 8, 'tire', 'steelDark', -0.11), {roll: 90, pos: {x, y: 0.33, z}});
  const m = merge(body, cabin, wheel(-0.82, -1.45), wheel(0.82, -1.45), wheel(-0.82, 1.45), wheel(0.82, 1.45));
  m.crease = 28;
  return m;
};

/** The bus wreck: burnt out, windows black, a dark stripe, a sagging roof. */
export const busMesh = (): Mesh => {
  const L = 12, W = 1.28, H = 3.05;
  const winOv = (x: number): Overlay[] => [{polys: Array.from({length: 7}, (_, i) => rectX(-L / 2 + 1.4 + i * 1.5, 1.35, -L / 2 + 2.6 + i * 1.5, 2.45, x)), mat: 'interiorDeep'}, {pts: rectX(-L / 2 + 0.2, 0.95, L / 2 - 0.2, 1.15, x), mat: 'busStripe'}];
  const body = prismX([{z: -L / 2, y: 0.4}, {z: -L / 2, y: H - 0.2}, {z: -L / 2 + 0.4, y: H}, {z: L / 2 - 0.3, y: H - 0.3}, {z: L / 2, y: H - 0.5}, {z: L / 2, y: 0.4}], -W, W, 'bus', 'bus',
    [winOv(-W - 0.01).map((o) => ({...o, polys: o.polys?.map((P) => P.slice().reverse()), pts: o.pts?.slice().reverse()})), winOv(W + 0.01)]);
  const wheel = (x: number, z: number) => xfMesh(cylinder(0.5, 0.3, 10, 'tire', 'steelDark', -0.15), {roll: 90, pos: {x, y: 0.5, z}});
  const m = merge(body, wheel(-W + 0.1, -L / 2 + 2.2), wheel(W - 0.1, -L / 2 + 2.2), wheel(-W + 0.1, L / 2 - 2.6), wheel(W - 0.1, L / 2 - 2.6));
  m.crease = 28;
  return m;
};

// ------------------------------------------------------------------ the fallen girder (elevated rail truss)
export const GIRDER = (() => {
  const a = PLAN.girder.from, b = PLAN.girder.to;
  const f = norm3(sub3(b, a));
  const side = norm3(cross3({x: 0, y: 1, z: 0}, f)); // to the girder's left
  const up = cross3(f, side);
  return {a, b, f, side, up, len: len3(sub3(b, a)), width: 5.2, depth: 3.1};
})();
const buildGirder = (): Mesh => {
  const {a, f, side, up, len, width, depth} = GIRDER;
  const P = (s: number, l: number, u: number) => add3(add3(add3(a, mul3(f, s)), mul3(side, l)), mul3(up, u));
  const parts: Mesh[] = [];
  const panels = Math.round(len / 4.2);
  const pl = len / panels;
  for (const l of [-width / 2, width / 2]) {
    parts.push(beam(P(0, l, 0), P(len, l, 0), 0.45, 0.55, 'girder', up));
    parts.push(beam(P(0, l, depth), P(len, l, depth), 0.45, 0.55, 'girder', up));
    for (let i = 0; i <= panels; i++) {
      parts.push(beam(P(i * pl, l, 0), P(i * pl, l, depth), 0.32, 0.32, i % 3 === 1 ? 'girderRust' : 'girder', f));
      if (i < panels) parts.push(beam(P(i * pl, l, i % 2 ? 0 : depth), P((i + 1) * pl, l, i % 2 ? depth : 0), 0.26, 0.26, 'girder', side));
    }
  }
  // deck: cross beams and two rails with ties (the elevated track)
  for (let i = 0; i <= panels * 2; i++) parts.push(beam(P((i * pl) / 2, -width / 2, depth + 0.3), P((i * pl) / 2, width / 2, depth + 0.3), 0.28, 0.22, 'steelDark', f));
  for (const l of [-0.75, 0.75]) parts.push(beam(P(0, l, depth + 0.55), P(len, l, depth + 0.55), 0.12, 0.18, 'steel', up));
  const m = merge(...parts);
  m.crease = 30;
  return m;
};
let GIR: Prepped | null = null;
export const girderMesh = () => (GIR ??= prep(buildGirder()));
/** The surviving column the girder's raised end rests on, and two more columns of the old line further east. */
export const columnMeshes = (): Prepped[] => [
  prep(box({x: PLAN.girder.to.x - 0.6, y: 0, z: PLAN.girder.to.z - 0.6}, {x: PLAN.girder.to.x + 0.6, y: PLAN.girder.to.y - 0.2, z: PLAN.girder.to.z + 0.6}, 'girder')),
  prep(merge(box({x: 104.4, y: 0, z: -11.6}, {x: 105.6, y: 9.5, z: -10.4}, 'girder'), beam({x: 105, y: 9.5, z: -11}, {x: 112, y: 10.4, z: -6}, 0.5, 0.6, 'girderRust'))),
  prep(box({x: 140.4, y: 0, z: -11.6}, {x: 141.6, y: 7.2, z: -10.4}, 'girder')),
];

// ------------------------------------------------------------------ rubble pieces
/** A fractured concrete slab (thick, irregular outline) with a seeded shape. */
export const brokenSlab = (o: V3, U: V3, V: V3, w: number, h: number, thick: number, seed: number, face = 'concrete', edge = 'concreteEdge'): Mesh => {
  const r = (k: number) => rnd(seed * 53 + k);
  const pts = [
    {u: 0, v: r(1) * 0.2 * h}, {u: w * (0.3 + r(2) * 0.2), v: 0}, {u: w, v: r(3) * 0.25 * h},
    {u: w * (0.92 + r(4) * 0.08), v: h * (0.55 + r(5) * 0.3)}, {u: w * (0.6 + r(6) * 0.2), v: h}, {u: w * (0.25 + r(7) * 0.15), v: h * (0.82 + r(8) * 0.18)}, {u: r(9) * 0.1 * w, v: h * (0.5 + r(10) * 0.3)},
  ];
  return slab(o, U, V, pts, thick, face, edge, 'concreteDark');
};

/** Seeded concrete chunk mesh (cached by seed bucket and material). */
const CHUNKS = new Map<string, Prepped>();
export const chunkMesh = (seed: number, mat = 'rubble'): Prepped => {
  const k = `${seed % 24}:${mat}`;
  let m = CHUNKS.get(k);
  if (!m) {
    const s = seed % 24;
    m = prep(chunk(0.9 + rnd(s * 3) * 0.6, 0.5 + rnd(s * 5) * 0.6, 0.8 + rnd(s * 7) * 0.6, s + 1, s % 3 === 0 ? 'concrete' : s % 3 === 1 ? mat : 'concreteEdge', 0.3));
    CHUNKS.set(k, m);
  }
  return m;
};

/** Foreground debris for close shots: a chunk of `size` metres at (x, z) on the ground. */
export const debrisXf = (x: number, z: number, size: number, seed: number, yaw?: number): Xf => ({
  pos: {x, y: groundH(x, z) - size * 0.12, z},
  yaw: yaw ?? rnd(seed * 11) * 360,
  pitch: (rnd(seed * 13) - 0.5) * 24,
  roll: (rnd(seed * 17) - 0.5) * 24,
  scale: size,
});

export {cbox};
