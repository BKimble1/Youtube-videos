// Glass Climbing V6: the tower, the street and the climber as one small perspective scene (metres), for the views the
// bay's flat oblique projection cannot give: the exterior reveal (the building's corner, its thickness, the street and
// the crowd below), the look down past his shoulder, and the fall seen from above.
// The geometry is the bay's (Scenery6/climb6), converted at 620 units per metre: the same floors (fins, opaque
// spandrels, vision glass), the same brick piers and bays, the corner pier at the bay's zNear, the same street; and the
// climber is the bay rig's state lifted into depth (near limbs toward -z, the pads at their depths on the glass).
// Axes: x out from the facade (the street side), y up from the street, z along the facade (+z toward the corner).
// The sun is high, in front of the facade and from -z: lit faces and shadows agree with the bay's upper-left key.
// Drawing: painter's order in layers (ground, markings, shadows, the building, then everything in front of it sorted by
// depth), Crew finish (flat fills, one ink line, a lit edge).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {DIM, manJoints} from '../dc/Man';
import {HERO} from '../world/pose';
import {ClimbState, loopApex, MM, padPt5, ring5} from './climb7';
import {P3D, PH, PW} from '../v6/Pad6';
import {FLOOR_H, FLOORS5, PIER_P, PIER_W, PIERS, ROOF, SPANDREL_H, FACADE5} from './Scenery7';
import {FIN_D, LEDGE_Y} from './climb7';

const W = 1080, H = 1920;
export const UPM = 620; // bay units per metre
export type P3 = {x: number; y: number; z: number};
const v3 = (x: number, y: number, z: number): P3 => ({x, y, z});
const sub3 = (a: P3, b: P3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const add3 = (a: P3, b: P3) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const mul3 = (a: P3, k: number) => v3(a.x * k, a.y * k, a.z * k);
const dot3 = (a: P3, b: P3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross3 = (a: P3, b: P3) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const norm3 = (a: P3) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};
const lerp3 = (a: P3, b: P3, t: number) => v3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const rnd = (i: number, s: number) => ((((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) + 1) % 1);
/** bay units -> metres */
const m = (u: number) => u / UPM;
export const fromBay = (x: number, y: number, z: number): P3 => v3(x / UPM, -y / UPM, z / UPM);

/** the building in metres */
export const TOWER = (() => {
  const zNear = m(FACADE5.zNear), zFar = m(FACADE5.zFar);
  return {zNear, zFar, depth: 18, roof: -m(ROOF), floors: FLOORS5.map((y) => -m(y)), floorH: m(FLOOR_H), spand: m(SPANDREL_H), fin: m(FIN_D), ledge: -m(LEDGE_Y),
    piers: PIERS.map((z) => [m(z), m(z + PIER_W)] as [number, number]).filter(([a]) => a < zNear + 0.01)};
})();
/** the street (metres): the main street along the facade, the cross street past the corner */
export const STREET = {walk: 4, kerb: 0.15, road: 10, farWalk: 4.5, crossWalk0: TOWER.zNear, crossRoad0: TOWER.zNear + 4, crossRoad1: TOWER.zNear + 14};
const SUN = norm3(v3(0.55, 1, -0.45)); // toward the sun
const SHADOW_DIR = v3(-SUN.x / SUN.y, 0, -SUN.z / SUN.y); // ground offset per metre of height

export type Cam3 = {eye: P3; target: P3; f: number; roll?: number};
const makeCam = (c: Cam3) => {
  const fw = norm3(sub3(c.target, c.eye));
  let rt = norm3(cross3(fw, v3(0, 1, 0)));
  let up = cross3(rt, fw);
  if (c.roll) {
    const a = (c.roll * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const r2 = add3(mul3(rt, ca), mul3(up, sa)), u2 = add3(mul3(up, ca), mul3(rt, -sa));
    rt = r2;
    up = u2;
  }
  const pr = (p: P3) => {
    const d = sub3(p, c.eye);
    const zc = dot3(d, fw);
    const z = Math.max(0.02, zc);
    return {x: W / 2 + (c.f * dot3(d, rt)) / z, y: H / 2 - (c.f * dot3(d, up)) / z, d: zc};
  };
  return {pr, fw, eye: c.eye, f: c.f};
};

type Item = {d: number; layer: number; n: React.ReactNode};
const LAYER = {ground: 0, marks: 1, shadow: 2, building: 3, front: 4};

/** the scene */
export const TowerScene: React.FC<{id: string; cam: Cam3; f: number; st?: ClimbState | null; detail?: number; haze?: number; climberScale?: number}> = ({id, cam, f, st, detail = 1, haze = 0.25, climberScale = 1}) => {
  const C = makeCam(cam);
  const items: Item[] = [];
  let key = 0;
  const t = f / 30;
  const visible = (ps: {d: number}[]) => ps.every((p) => p.d > 0.01);
  const NEAR = 0.15;
  /** clip a polygon to the camera's near plane (Sutherland-Hodgman on the view depth) */
  const clipNear = (pts: P3[]): P3[] => {
    const dep = (p: P3) => dot3(sub3(p, C.eye), C.fw);
    const out: P3[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const da = dep(a), db = dep(b);
      if (da >= NEAR) out.push(a);
      if ((da >= NEAR) !== (db >= NEAR)) out.push(lerp3(a, b, (NEAR - da) / (db - da)));
    }
    return out;
  };
  const poly = (pts0: P3[], fill: string, layer: number, o: {stroke?: number; op?: number; d?: number; cull?: P3} = {}) => {
    if (o.cull && dot3(o.cull, sub3(C.eye, pts0[0])) <= 0) return; // back face
    const pts = clipNear(pts0);
    if (pts.length < 3) return;
    const s = pts.map(C.pr);
    if (!visible(s)) return;
    const d = o.d ?? s.reduce((a, p) => a + p.d, 0) / s.length;
    items.push({d, layer, n: <path key={key++} d={`M${s.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={fill} stroke={o.stroke ? INK : 'none'} strokeWidth={o.stroke ?? 0} strokeLinejoin="round" opacity={o.op ?? 1} />});
  };
  const quadZ = (x: number, y0: number, y1: number, z0: number, z1: number, fill: string, layer: number, o: {stroke?: number; op?: number; d?: number} = {}) =>
    poly([v3(x, y0, z0), v3(x, y0, z1), v3(x, y1, z1), v3(x, y1, z0)], fill, layer, o);
  const groundQ = (x0: number, x1: number, z0: number, z1: number, fill: string, layer = LAYER.ground, y = 0, op = 1) => poly([v3(x0, y, z0), v3(x1, y, z0), v3(x1, y, z1), v3(x0, y, z1)], fill, layer, {op});
  /** an axis-aligned box: its visible faces, each lit by the sun */
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: string, layer: number, o: {stroke?: number; skipBottom?: boolean} = {}) => {
    const faces: [P3[], P3][] = [
      [[v3(x1, y0, z0), v3(x1, y1, z0), v3(x1, y1, z1), v3(x1, y0, z1)], v3(1, 0, 0)],
      [[v3(x0, y0, z0), v3(x0, y0, z1), v3(x0, y1, z1), v3(x0, y1, z0)], v3(-1, 0, 0)],
      [[v3(x0, y1, z0), v3(x0, y1, z1), v3(x1, y1, z1), v3(x1, y1, z0)], v3(0, 1, 0)],
      [[v3(x0, y0, z1), v3(x1, y0, z1), v3(x1, y1, z1), v3(x0, y1, z1)], v3(0, 0, 1)],
      [[v3(x0, y0, z0), v3(x0, y1, z0), v3(x1, y1, z0), v3(x1, y0, z0)], v3(0, 0, -1)],
    ];
    for (const [pts, n] of faces) {
      const k = dot3(n, SUN);
      poly(pts, k > 0 ? lit(col, 0.18 * k) : shade(col, 0.25 * -k + 0.05), layer, {stroke: o.stroke, cull: n});
    }
  };
  /** a cast shadow on the street of a vertical extent (an object's footprint raised by its height) */
  const shadowOf = (pts: P3[], op = 0.22) => {
    const g = pts.map((p) => add3(v3(p.x, 0.01, p.z), mul3(SHADOW_DIR, p.y)));
    poly(g, '#0E1A22', LAYER.shadow, {op});
  };

  // ------------------------------------------------------------------ the street
  const {walk, kerb, road, farWalk} = STREET;
  const zA = TOWER.zFar - 60, zB = TOWER.zNear + 90;
  const xr0 = walk + kerb, xr1 = xr0 + road, xfw = xr1 + kerb;
  const cz0 = STREET.crossRoad0, cz1 = STREET.crossRoad1;
  // pavement (with paving joints), kerbs, roads, far pavement
  groundQ(-TOWER.depth - 30, walk, TOWER.zNear, cz0, '#CFCBC1'); // round the corner
  groundQ(0, walk, zA, TOWER.zNear, '#D3CFC5');
  groundQ(walk, xr0, zA, zB, '#8D8B85');
  groundQ(xr0, xr1, zA, zB, '#5D6266');
  groundQ(-TOWER.depth - 30, xr0, cz0 - kerb, cz0, '#8D8B85');
  groundQ(-TOWER.depth - 30, xr0, cz0, cz1, '#5D6266');
  groundQ(-TOWER.depth - 30, xr0, cz1, cz1 + kerb, '#8D8B85');
  groundQ(-TOWER.depth - 30, xr0, cz1 + kerb, cz1 + 5, '#CFCBC1');
  groundQ(xr1, xfw, zA, zB, '#8D8B85');
  groundQ(xfw, xfw + farWalk, zA, zB, '#CBC7BD');
  if (detail > 0.4) {
    for (let z = Math.ceil(zA / 1.6) * 1.6; z < TOWER.zNear; z += 1.6) groundQ(0, walk, z, z + 0.04, '#B9B5AB', LAYER.marks);
  }
  // road markings: the centre line, lane dashes, stop lines and two zebra crossings at the corner
  const mid = (xr0 + xr1) / 2;
  groundQ(mid - 0.08, mid - 0.02, zA, cz0 - 3, '#E8C547', LAYER.marks);
  groundQ(mid + 0.02, mid + 0.08, zA, cz0 - 3, '#E8C547', LAYER.marks);
  for (let z = zA; z < cz0 - 4; z += 6) {
    groundQ(xr0 + road / 4 - 0.06, xr0 + road / 4 + 0.06, z, z + 3, '#E8E3D2', LAYER.marks);
    groundQ(xr1 - road / 4 - 0.06, xr1 - road / 4 + 0.06, z, z + 3, '#E8E3D2', LAYER.marks);
  }
  groundQ(xr0, mid, cz0 - 3.4, cz0 - 3.0, '#E8E3D2', LAYER.marks);
  for (let i = 0; i < 9; i++) groundQ(xr0 + 0.3 + i * 1.1, xr0 + 0.85 + i * 1.1, cz0 - 2.6, cz0 - 0.4, '#E8E3D2', LAYER.marks);
  for (let i = 0; i < 9; i++) groundQ(walk - 3.2, walk - 0.2, cz0 + 0.4 + i * 1.1, cz0 + 0.95 + i * 1.1, '#E8E3D2', LAYER.marks);

  // ------------------------------------------------------------------ the tower
  const T = TOWER;
  const roof = T.roof;
  const bays: [number, number][] = [];
  {
    const ps = [...T.piers].sort((a, b) => a[0] - b[0]);
    let z = T.zFar;
    for (const [a, b] of ps) {
      if (a > z) bays.push([z, Math.min(a, T.zNear)]);
      z = Math.max(z, b);
    }
    if (z < T.zNear - 0.05) bays.push([z, T.zNear]);
  }
  const floorsAll = (() => {
    const out: number[] = [];
    for (let y = T.ledge - Math.ceil(T.ledge / T.floorH) * T.floorH; y + T.floorH <= roof + 0.01; y += T.floorH) if (y > 2.5) out.push(y);
    return out;
  })();
  const near = (p: P3) => Math.hypot(p.x - C.eye.x, p.y - C.eye.y, p.z - C.eye.z);
  const glassCol = (i: number, j: number, y: number) => mix(mix('#4F7F92', '#9CC7D4', 0.25 + 0.5 * (y / roof)), '#2F5566', 0.25 * rnd(i * 7 + j, 3));
  // the granite base (street level, its entrance) and the storeys
  box(-0.02, 0.02, 0, 1.8, T.zFar, T.zNear, '#3E4A52', LAYER.building);
  for (let k = 0; k < floorsAll.length; k++) {
    const y0 = floorsAll[k], y1 = y0 + T.floorH;
    for (let j = 0; j < bays.length; j++) {
      const [z0, z1] = bays[j];
      // spandrel (opaque glass) and its joint, then three vision panes
      quadZ(0, y0, y0 + T.spand, z0, z1, '#2E4A5C', LAYER.building, {d: near(v3(0, y0, (z0 + z1) / 2)) + 0.02});
      quadZ(0.004, y0 + T.spand - 0.012, y0 + T.spand + 0.012, z0, z1, '#D5E0E6', LAYER.building, {d: near(v3(0, y0, (z0 + z1) / 2)) - 0.01});
      const pane = (z1 - z0) / 3;
      for (let q = 0; q < 3; q++) {
        const a = z0 + q * pane, b = a + pane;
        const c = near(v3(0, (y0 + y1) / 2, (a + b) / 2));
        const gc = glassCol(k, j * 3 + q, y0);
        quadZ(0, y0 + T.spand, y1, a, b, gc, LAYER.building, {d: c + 0.03});
        // reflected sky at the pane's top, a neighbour's reflection, and (close by) the floor's ceiling and lights inside
        quadZ(0.002, y1 - 0.9, y1, a, b, lit(gc, 0.18), LAYER.building, {d: c + 0.02, op: 0.7});
        if (rnd(k * 31 + j * 3 + q, 5) > 0.55) quadZ(0.003, y0 + T.spand, y0 + T.spand + 1.2 + 1.2 * rnd(k + j, 9), a + 0.2, b - 0.3, shade(gc, 0.2), LAYER.building, {d: c + 0.015, op: 0.5});
        if (detail > 0.5 && c < 45) {
          quadZ(0.001, y1 - 0.35, y1 - 0.22, a, b, '#22394A', LAYER.building, {d: c + 0.01, op: 0.4});
          const lp = C.pr(v3(0.001, y1 - 0.3, (a + b) / 2));
          if (lp.d > 0.1) items.push({d: c + 0.005, layer: LAYER.building, n: <ellipse key={key++} cx={fmt(lp.x)} cy={fmt(lp.y)} rx={fmt((C.f * 0.25) / lp.d)} ry={fmt((C.f * 0.05) / lp.d)} fill="#F6F0D8" opacity={0.5} />});
        }
      }
      // the fin (a shallow aluminium shelf at the floor line)
      box(0, T.fin, y0 - 0.055, y0, z0, z1, '#C9D2D8', LAYER.building);
    }
  }
  // mullions at each bay's third points, and the brick piers (with coursing when near)
  for (const [z0, z1] of bays)
    for (const q of [1, 2]) {
      const z = z0 + ((z1 - z0) * q) / 3;
      box(0, 0.04, 1.8, roof, z - 0.025, z + 0.025, '#B6C1C9', LAYER.building);
    }
  for (const [a, b] of T.piers) {
    box(-0.0, 0.06, 1.8, roof, a, b, '#A9573D', LAYER.building);
    const c = near(v3(0.06, 30, (a + b) / 2));
    if (detail > 0.5 && c < 40) {
      for (let y = 2; y < roof; y += 0.15) quadZ(0.061, y, y + 0.012, a, b, '#D9C3A6', LAYER.building, {d: near(v3(0.06, y, (a + b) / 2)) - 0.01, op: 0.55});
    }
    box(0, 0.08, 1.8, roof, a - 0.03, a + 0.03, '#C3CDD4', LAYER.building);
    box(0, 0.08, 1.8, roof, b - 0.03, b + 0.03, '#C3CDD4', LAYER.building);
  }
  // the corner's side face (the building's thickness): brick with tall windows, toward +z
  {
    const z = T.zNear;
    poly([v3(0, 0, z), v3(0, roof, z), v3(-T.depth, roof, z), v3(-T.depth, 0, z)], shade('#A9573D', 0.12), LAYER.building, {cull: v3(0, 0, 1)});
    for (const y0 of floorsAll)
      for (let i = 0; i < 4; i++) {
        const x0 = -2 - i * 4.2;
        poly([v3(x0, y0 + T.spand, z + 0.01), v3(x0, y0 + T.floorH - 0.15, z + 0.01), v3(x0 - 2.6, y0 + T.floorH - 0.15, z + 0.01), v3(x0 - 2.6, y0 + T.spand, z + 0.01)], shade(glassCol(i, 99, y0), 0.15), LAYER.building, {cull: v3(0, 0, 1)});
      }
    // the parapet and the roof edge
    box(-T.depth, 0.1, roof, roof + 0.7, T.zFar, z, '#D7DDE1', LAYER.building);
  }
  // the entrance at the base: glass doors under a canopy (a few metres along from the corner)
  box(0, 2.2, 3.2, 3.4, T.zNear - 12, T.zNear - 5, '#2B3338', LAYER.front);
  quadZ(0.03, 0, 3.0, T.zNear - 11.5, T.zNear - 5.5, '#7FB2C2', LAYER.building, {d: near(v3(0, 1.5, T.zNear - 8)) - 0.05});
  // a neighbour across the main street and one past the cross street, with their shadows over the road
  const neighbour = (x0: number, x1: number, z0: number, z1: number, h: number, col: string) => {
    box(x0, x1, 0, h, z0, z1, col, LAYER.front);
    if (detail > 0.3)
      for (let y = 3; y < h - 2; y += 3.2) {
        for (const face of [x0 - 0.01, x1 + 0.01])
          for (let z = z0 + 1; z < z1 - 1.5; z += 3)
            poly([v3(face, y, z), v3(face, y, z + 1.6), v3(face, y + 1.8, z + 1.6), v3(face, y + 1.8, z)], '#5E7F8E', LAYER.front, {cull: v3(face < x0 ? -1 : 1, 0, 0)});
        for (const face of [z0 - 0.01, z1 + 0.01])
          for (let x = x0 + 1; x < x1 - 1.5; x += 3)
            poly([v3(x, y, face), v3(x + 1.6, y, face), v3(x + 1.6, y + 1.8, face), v3(x, y + 1.8, face)], '#5E7F8E', LAYER.front, {cull: v3(0, 0, face < z0 ? -1 : 1)});
      }
    shadowOf([v3(x0, h, z0), v3(x0, h, z1), v3(x1, h, z1), v3(x1, h, z0)], 0.16);
  };
  neighbour(xfw + farWalk + 0.5, xfw + farWalk + 22, T.zFar - 40, cz0 - 8, 26, '#C9B79F');
  neighbour(-T.depth - 4, walk - 1, cz1 + 5, cz1 + 30, 30, '#B7C3C9');
  // the tower's own shadow over its pavement is cut by the sun's angle: a long dark band at its foot
  shadowOf([v3(0, roof, T.zFar), v3(0, roof, T.zNear), v3(0, 0, T.zNear), v3(0, 0, T.zFar)], 0.0);

  // ------------------------------------------------------------------ traffic and people
  const cars = 14;
  for (let i = 0; i < cars; i++) {
    const lane = i % 4; // two lanes each way; +z on the near side
    const x = xr0 + road / 8 + (lane * road) / 4;
    const dir = lane < 2 ? 1 : -1;
    const span = zB - zA;
    const z = ((((rnd(i, 7) * span + dir * t * (9 + 3 * rnd(i, 2))) % span) + span) % span) + zA;
    if (z > cz0 - 3 && z < cz1 + 3) continue; // (they wait out of the junction)
    const col = ['#D64545', '#2C6E91', '#E8E1D5', '#36454F', '#F2B134', '#6B8F71', '#8E5572'][i % 7];
    const L = 4.4, Wd = 1.8;
    box(x - Wd / 2, x + Wd / 2, 0.25, 1.0, z - L / 2, z + L / 2, col, LAYER.front, {stroke: 1});
    box(x - Wd / 2 + 0.12, x + Wd / 2 - 0.12, 1.0, 1.45, z - L / 4 - 0.2 * dir, z + L / 4 - 0.2 * dir, '#9FC3D3', LAYER.front, {stroke: 1});
    shadowOf([v3(x - Wd / 2, 1.2, z - L / 2), v3(x + Wd / 2, 1.2, z - L / 2), v3(x + Wd / 2, 1.2, z + L / 2), v3(x - Wd / 2, 1.2, z + L / 2)], 0.25);
  }
  // pedestrians walking; the crowd at the foot of the tower under him, looking up, a few with phones raised
  const person = (p: P3, col: string, look: boolean, phone: boolean, i: number) => {
    const hpos = v3(p.x, p.y + 1.62, p.z);
    const s0 = C.pr(v3(p.x, p.y, p.z)), s1 = C.pr(v3(p.x, p.y + 1.35, p.z)), sh = C.pr(hpos);
    if (s0.d < 0.2) return;
    const w = Math.max(1.2, (C.f * 0.22) / s1.d), r = Math.max(1, (C.f * 0.12) / sh.d);
    shadowOf([v3(p.x - 0.2, 1.7, p.z - 0.2), v3(p.x + 0.2, 1.7, p.z - 0.2), v3(p.x + 0.2, 1.7, p.z + 0.2), v3(p.x - 0.2, 1.7, p.z + 0.2)], 0.2);
    items.push({d: s1.d, layer: LAYER.front, n: (
      <g key={key++}>
        <path d={`M${fmt(s0.x)},${fmt(s0.y)} L${fmt(s1.x)},${fmt(s1.y)}`} stroke={INK} strokeWidth={fmt(w + 1.6)} strokeLinecap="round" />
        <path d={`M${fmt(s0.x)},${fmt(s0.y)} L${fmt(s1.x)},${fmt(s1.y)}`} stroke={col} strokeWidth={fmt(w)} strokeLinecap="round" />
        <circle cx={fmt(sh.x)} cy={fmt(sh.y)} r={fmt(r)} fill={['#E9B98F', '#C68C62', '#8D5B3E', '#F1C9A5'][i % 4]} stroke={INK} strokeWidth={0.8} />
        {look && r > 2.2 && <circle cx={fmt(sh.x)} cy={fmt(sh.y - r * 0.15)} r={fmt(r * 0.42)} fill="#2A2018" opacity={0.85} />}
        {phone && (() => {
          const ph = C.pr(v3(p.x + 0.25, p.y + 1.85, p.z));
          return <rect x={fmt(ph.x - Math.max(1, r * 0.35))} y={fmt(ph.y - Math.max(1.4, r * 0.55))} width={fmt(Math.max(2, r * 0.7))} height={fmt(Math.max(2.8, r * 1.1))} fill="#1C2328" stroke="#9FD0E0" strokeWidth={0.6} />;
        })()}
      </g>
    )});
  };
  const walkers = detail > 0.4 ? 46 : 20;
  for (let i = 0; i < walkers; i++) {
    const far = i % 3 === 0;
    const x = far ? xfw + 0.6 + rnd(i, 2) * (farWalk - 1.2) : 0.6 + rnd(i, 2) * (walk - 1.2);
    const dir = rnd(i, 1) > 0.5 ? 1 : -1, span = zB - zA;
    const z = ((((rnd(i, 3) * span + dir * t * 1.3) % span) + span) % span) + zA;
    if (!far && Math.abs(z) < 5) continue; // the crowd stands there
    person(v3(x, 0, z), ['#C8553D', '#2E86AB', '#F2C14E', '#5F7470', '#8E5572', '#E9EEF2'][i % 6], false, false, i);
  }
  // the crowd: in loose groups at the tower's foot below him, heads tipped back; a few phones up; restrained sway
  const groups = [[1.4, -2.5], [2.4, 0.4], [1.2, 2.6], [3.1, -0.9]];
  let n = 0;
  for (const [gx, gz] of groups)
    for (let i = 0; i < 6; i++) {
      n++;
      const a = rnd(n, 4) * Math.PI * 2, r = 0.3 + rnd(n, 5) * 0.8;
      person(v3(gx + Math.cos(a) * r * 0.7, 0, gz + Math.sin(a) * r + 0.03 * Math.sin(t * 1.3 + n)), ['#3F6E82', '#C8553D', '#F2C14E', '#5F7470', '#E9EEF2', '#8E5572'][n % 6], true, n % 4 === 1, n);
    }

  // ------------------------------------------------------------------ the climber, from the bay rig's state
  if (st) climber3D(st, C, items, () => key++, climberScale);

  // ------------------------------------------------------------------ draw
  items.sort((a, b) => (a.layer !== b.layer ? a.layer - b.layer : b.d - a.d));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FC0DA" />
          <stop offset="1" stopColor="#E3EEF0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-sky)`} />
      {items.map((it) => it.n)}
      {haze > 0 && <rect x={0} y={0} width={W} height={H} fill="#DCE8EE" opacity={haze * 0.25} />}
    </svg>
  );
};

/** the climber in depth: the bay rig's joints (side view) placed at their depths; tubes for limbs, a volume for the
 *  torso (the striped tee), the head with its red crown, the pads on the glass, the straps to the stirrups */
const climber3D = (st: ClimbState, C: ReturnType<typeof makeCam>, items: Item[], nextKey: () => number, scale: number) => {
  const j = manJoints(st.pose);
  // the rig's side plane -> metres; near (L) limbs toward -z
  const Z = {L: -1, R: 1};
  const P = (v: {x: number; y: number}, z: number) => fromBay(v.x, v.y, z * UPM);
  const sc = scale;
  const zS = 0.19, zH = 0.11;
  const sh = {L: P(j.L.S, -zS), R: P(j.R.S, zS)};
  const el = {L: P(j.L.E, -0.24), R: P(j.R.E, 0.24)};
  const wr = {L: P(j.L.W, m(st.padL.zo) * 0.9), R: P(j.R.W, m(st.padR.zo) * 0.9)};
  const hp = {L: P(j.lLeg.hp, -zH), R: P(j.rLeg.hp, zH)};
  const kn = {L: P(j.lLeg.K, -zH - 0.02), R: P(j.rLeg.K, zH + 0.02)};
  const an = {L: P(j.lLeg.A, -zH), R: P(j.rLeg.A, zH)};
  const toe = {L: P(j.lLeg.toe, -zH), R: P(j.rLeg.toe, zH)};
  const neck = P(j.N, 0), head = P(j.head, 0), chest = P(j.Sh, 0), waist = P(j.H, 0);
  void Z;
  const push = (d: number, n: React.ReactNode) => items.push({d, layer: LAYER.front, n: <g key={nextKey()}>{n}</g>});
  const tube = (a: P3, b: P3, ra: number, rb: number, col: string, dz = 0) => {
    const A = C.pr(a), B = C.pr(b);
    if (A.d < 0.05 || B.d < 0.05) return;
    const RA = Math.max(0.6, (C.f * ra * sc) / A.d), RB = Math.max(0.6, (C.f * rb * sc) / B.d);
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const d = `M${fmt(A.x + nx * RA)},${fmt(A.y + ny * RA)} L${fmt(B.x + nx * RB)},${fmt(B.y + ny * RB)} A${fmt(RB)},${fmt(RB)} 0 0 1 ${fmt(B.x - nx * RB)},${fmt(B.y - ny * RB)} L${fmt(A.x - nx * RA)},${fmt(A.y - ny * RA)} A${fmt(RA)},${fmt(RA)} 0 0 1 ${fmt(A.x + nx * RA)},${fmt(A.y + ny * RA)} Z`;
    const ink = Math.max(0.6, Math.min(4, (C.f * 0.008) / ((A.d + B.d) / 2)));
    push((A.d + B.d) / 2 + dz, (
      <>
        <path d={d} fill={col} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
        <path d={`M${fmt(A.x + nx * RA * 0.45)},${fmt(A.y + ny * RA * 0.45)} L${fmt(B.x + nx * RB * 0.45)},${fmt(B.y + ny * RB * 0.45)}`} stroke={lit(col, 0.4)} strokeWidth={fmt(Math.max(0.5, RB * 0.3))} strokeLinecap="round" opacity={0.45} />
      </>
    ));
  };
  // the pads on the glass (a plate, its handle) and the straps from their rings to the stirrups at the feet
  const pad = (p: typeof st.padL, side: 'L' | 'R') => {
    const zc = m(p.zo);
    const c = padPt5(p, {u: 0, v: 0, w: 0});
    const hw = (PW / 2) * MM, hh = (PH / 2) * MM;
    const x0 = m(c.x - 2), x1 = m(c.x + P3D.U_BACK * MM);
    const y0 = -m(c.y - hh), y1 = -m(c.y + hh);
    const z0 = zc - m(hw), z1 = zc + m(hw);
    const corners = [v3(x1, y0, z0), v3(x1, y0, z1), v3(x1, y1, z1), v3(x1, y1, z0)].map(C.pr);
    const side0 = [v3(x0, y0, z0), v3(x1, y0, z0), v3(x1, y1, z0), v3(x0, y1, z0)].map(C.pr);
    const dd = corners.reduce((a, q) => a + q.d, 0) / 4;
    if (dd < 0.05) return;
    const ink = Math.max(0.6, Math.min(3, (C.f * 0.006) / dd));
    push(dd + 0.02, (
      <>
        <path d={`M${side0.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`} fill="#8E9CA6" stroke={INK} strokeWidth={fmt(ink)} />
        <path d={`M${corners.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`} fill="#56656F" stroke={INK} strokeWidth={fmt(ink)} />
      </>
    ));
    const b0 = padPt5(p, {u: P3D.U_BACK + P3D.POST, v: -P3D.BAR_H, w: 0}), b1 = padPt5(p, {u: P3D.U_BACK + P3D.POST, v: P3D.BAR_H, w: 0});
    tube(fromBay(b0.x, b0.y, p.zo), fromBay(b1.x, b1.y, p.zo), 0.014, 0.014, '#2C3338', 0.01);
    const r = ring5(p), bar = side === 'L' ? st.footL.bar : st.footR.bar, ap = loopApex(bar);
    const zf = side === 'L' ? -zH : zH;
    tube(fromBay(r.x, r.y, p.zo), fromBay(ap.x, ap.y, zf * UPM), 0.012, 0.012, side === 'L' ? '#D8663B' : shade('#D8663B', 0.15), 0.03);
  };
  pad(st.padL, 'L');
  pad(st.padR, 'R');
  // legs, shoes
  for (const s of ['R', 'L'] as const) {
    const pc = s === 'L' ? HERO.pants : shade(HERO.pants, 0.1);
    tube(hp[s], kn[s], 0.075, 0.062, pc);
    tube(kn[s], an[s], 0.062, 0.05, pc);
    tube(lerp3(an[s], toe[s], -0.25), toe[s], 0.05, 0.048, s === 'L' ? HERO.shoe : shade(HERO.shoe, 0.06), -0.01);
  }
  // the torso: a tapered volume from the shoulders to the hips (its silhouette from its eight corners), the tee with
  // its saffron stripes across it
  {
    const up = norm3(sub3(chest, waist));
    const side = v3(0, 0, 1);
    const fwd = norm3(cross3(up, side));
    const ring = (c: P3, hw: number, hd: number) => [-1, 1].flatMap((a) => [-1, 1].map((b) => add3(c, add3(mul3(side, a * hw), mul3(fwd, b * hd)))));
    const top = add3(chest, mul3(up, 0.04)), bot = add3(waist, mul3(up, -0.06));
    const pts = [...ring(top, 0.2, 0.11), ...ring(bot, 0.16, 0.1)].map(C.pr);
    if (pts.every((q) => q.d > 0.05)) {
      const hull = chaikin(chaikin(convexHull(pts)));
      const dd = pts.reduce((a, q) => a + q.d, 0) / pts.length;
      const id = `tor${nextKey()}`;
      // the saffron stripes as bands on the torso's visible faces (its back, toward +x, and whichever side faces the
      // camera), clipped to its silhouette
      const stripes: string[] = [];
      const faces: [number, number][] = [[1, 0], [0, -1], [0, 1]]; // (fwd sign, side sign): back, near side, far side
      for (const [fs, ss2] of faces) {
        const n = fs ? mul3(fwd, fs) : mul3(side, ss2);
        if (dot3(n, sub3(C.eye, chest)) <= 0) continue;
        for (let i = 0; i < 6; i++) {
          const a = 0.1 + i * 0.155, b = a + 0.075;
          const corner = (tt: number, e: number) => {
            const c = lerp3(top, bot, tt), hw = 0.2 + (0.16 - 0.2) * tt, hd = 0.11 + (0.1 - 0.11) * tt;
            return fs ? add3(c, add3(mul3(fwd, fs * hd), mul3(side, e * hw))) : add3(c, add3(mul3(side, ss2 * hw), mul3(fwd, e * hd)));
          };
          const q = [corner(a, -1), corner(a, 1), corner(b, 1), corner(b, -1)].map(C.pr);
          stripes.push(`M${q.map((r) => `${fmt(r.x)},${fmt(r.y)}`).join(' L')} Z`);
        }
      }
      const ink = Math.max(0.7, Math.min(4, (C.f * 0.008) / dd));
      push(dd, (
        <>
          <defs><clipPath id={id}><path d={`M${hull.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`} /></clipPath></defs>
          <path d={`M${hull.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`} fill={HERO.shirt} />
          <g clipPath={`url(#${id})`}>{stripes.map((d, i) => <path key={i} d={d} fill={HERO.stripe ?? "#F2C14E"} />)}</g>
          <path d={`M${hull.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`} fill="none" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
        </>
      ));
    }
  }
  // arms: sleeves over the shoulders, forearms, fists on the bars
  for (const s of ['R', 'L'] as const) {
    const skin = s === 'L' ? HERO.skin : shade(HERO.skin, 0.05);
    tube(el[s], wr[s], 0.042, 0.036, skin, -0.02);
    tube(sh[s], el[s], 0.055, 0.045, skin, -0.02);
    tube(sh[s], lerp3(sh[s], el[s], 0.45), 0.068, 0.062, s === 'L' ? HERO.shirt : shade(HERO.shirt, 0.04), -0.03);
    const w = C.pr(wr[s]);
    if (w.d > 0.05) {
      const r = Math.max(0.8, (C.f * 0.05 * sc) / w.d);
      push(w.d - 0.05, <circle cx={fmt(w.x)} cy={fmt(w.y)} r={fmt(r)} fill={skin} stroke={INK} strokeWidth={fmt(Math.max(0.6, r * 0.12))} />);
    }
  }
  // neck, head and the red crown of spikes (oriented to the head's own up)
  tube(chest, neck, 0.05, 0.05, HERO.skin, 0.01);
  {
    const hc = C.pr(head);
    if (hc.d > 0.05) {
      const r = Math.max(1, (C.f * (DIM.headR / UPM) * sc) / hc.d);
      const upv = C.pr(add3(head, v3(0, 0.2, 0)));
      const ux = (upv.x - hc.x) / (Math.hypot(upv.x - hc.x, upv.y - hc.y) || 1), uy = (upv.y - hc.y) / (Math.hypot(upv.x - hc.x, upv.y - hc.y) || 1);
      const lift = Math.min(1, Math.hypot(upv.x - hc.x, upv.y - hc.y) / Math.max(1, r * 1.6)); // 0 from straight above: a ring of spikes
      const n = 11, pts: string[] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const rr = i % 2 ? r * 0.95 : r * 1.32;
        // spikes all round seen from above; from the side, only the upper half bristles
        const ca = Math.cos(a), sa = Math.sin(a);
        const upness = ca * -ux + sa * -uy; // (a direction's alignment with the head's up on screen)
        const k = lift > 0.2 ? Math.max(0.55, 0.5 + 0.9 * Math.max(0, -upness)) : 1;
        pts.push(`${fmt(hc.x + ca * rr * k + ux * r * 0.25 * lift)},${fmt(hc.y + sa * rr * k + uy * r * 0.25 * lift)}`);
      }
      const ink = Math.max(0.7, Math.min(5, r * 0.07));
      // seen from behind (his back toward the camera) the hair covers the head down to the nape; the ears show
      const behind = clamp01(dot3(norm3(sub3(C.eye, head)), v3(1, 0, 0)) * 2.5);
      // (from behind: a full crown of spikes over the whole head, a little up from its centre, so only the nape shows)
      const crown: string[] = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const rr = i % 2 ? r * 0.98 : r * (1.3 + 0.08 * Math.sin(i * 1.7));
        crown.push(`${fmt(hc.x + Math.cos(a) * rr + ux * r * 0.18)},${fmt(hc.y + Math.sin(a) * rr + uy * r * 0.18)}`);
      }
      const hairPts = behind > 0.5 ? crown : pts;
      const ear = (sgn: number) => {
        const e = C.pr(add3(head, v3(0.02, -0.01, sgn * 0.09)));
        return <ellipse cx={fmt(e.x)} cy={fmt(e.y)} rx={fmt(r * 0.2)} ry={fmt(r * 0.28)} fill={HERO.skin} stroke={INK} strokeWidth={fmt(ink)} />;
      };
      push(hc.d - 0.06, (
        <>
          {behind > 0.3 && ear(-1)}
          {behind > 0.3 && ear(1)}
          <circle cx={fmt(hc.x)} cy={fmt(hc.y)} r={fmt(r)} fill={HERO.skin} stroke={INK} strokeWidth={fmt(ink)} />
          <path d={`M${hairPts.join(' L')} Z`} fill={HERO.hair} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" opacity={0.98} />
          <ellipse cx={fmt(hc.x - r * 0.25)} cy={fmt(hc.y - r * 0.3)} rx={fmt(r * 0.45)} ry={fmt(r * 0.28)} fill={lit(HERO.hair, 0.35)} opacity={0.45} />
        </>
      ));
    }
  }
};

/** corner-cutting (Chaikin): rounds a closed polygon's corners */
const chaikin = <T extends {x: number; y: number}>(ps: T[]): {x: number; y: number}[] =>
  ps.flatMap((a, i) => {
    const b = ps[(i + 1) % ps.length];
    return [{x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y}, {x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y}];
  });
const convexHull = <T extends {x: number; y: number}>(ps: T[]): T[] => {
  const p = [...ps].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cr = (o: T, a: T, b: T) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: T[] = [], hi: T[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};
export {mix};
