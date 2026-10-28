// V3 world: a low test deck, a 10-degree ramp down to the lab floor (the slope of the paper's speed tests), and the
// floor. The ramp's crest and foot are rounded (fillets), so a foot or a stick tip crossing them follows a smooth
// surface. The hook happens on the deck at H; the ending happens on the floor at H2, an identical group of parts; both
// mats have their grid lines aligned to their own group, so the last frame and the first frame show the same ground.
import React from 'react';
import {box, Item, NEAR, poly, Proj, f2} from '../lib/r3';
import {add, mul, v3, V3} from '../lib/v3';
import {ENV} from '../world/benchArt';
import {INK} from '../dc/ink';
import {rgba} from '../dc/color';

export const SLOPE = (10 * Math.PI) / 180;
export const DH = 0.07; // deck height
export const XC = 0; // crest (deck edge)
export const XF = XC + DH / Math.tan(SLOPE); // foot of the ramp
const RF = 0.8; // fillet radius (the body turns 10 degrees over about 14 cm of travel)
const TT = RF * Math.tan(SLOPE / 2);
export const Z_P = 0.25; // the hero's path (centre line) across the ramp
export const RAMP_Z: [number, number] = [Z_P - 0.42, Z_P + 0.42];
export const ZW = -2.2; // lab wall
const DECK_X0 = -3.2;
const DECK_Z1 = Z_P + 1.5;

/** the support surface along the ramp line: height and surface angle (rad, negative downhill) at x */
export const prof = (x: number): {y: number; ang: number} => {
  const a = -SLOPE;
  // crest fillet: centre below the corner
  const c1 = {x: XC - TT, y: DH - RF};
  const x1 = XC + TT * Math.cos(a);
  // foot fillet: centre above
  const c2 = {x: XF + TT, y: RF};
  const x2 = XF - TT * Math.cos(a);
  if (x <= XC - TT) return {y: DH, ang: 0};
  if (x < x1) {
    const dx = x - c1.x;
    const s = Math.sqrt(RF * RF - dx * dx);
    return {y: c1.y + s, ang: Math.atan(-dx / s)};
  }
  if (x <= x2) return {y: DH + (x - XC) * Math.tan(a), ang: a};
  if (x < XF + TT) {
    const dx = x - c2.x;
    const s = Math.sqrt(RF * RF - dx * dx);
    return {y: c2.y - s, ang: Math.atan(dx / s)};
  }
  return {y: 0, ang: 0};
};

/** a point at height h above the surface (along its normal) at ramp-line position x, and at z */
export const onSurf = (x: number, z: number, h: number): V3 => {
  const p = prof(x);
  return v3(x - Math.sin(p.ang) * h, p.y + Math.cos(p.ang) * h, z);
};

/** support height anywhere (the deck, the ramp within its width, the floor) */
export const groundY = (x: number, z: number): number => {
  if (x <= XC - TT) return z > DECK_Z1 ? 0 : DH;
  if (x >= XF + TT) return 0;
  if (z >= RAMP_Z[0] && z <= RAMP_Z[1]) return prof(x).y;
  return x < XC ? DH : 0;
};

/** rotate p about the z-axis through o by a (rad) */
export const rotZ = (p: V3, o: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  const dx = p.x - o.x, dy = p.y - o.y;
  return v3(o.x + dx * c - dy * s, o.y + dx * s + dy * c, p.z);
};

// ------------------------------------------------------------------------------------------------------------------
// drawing

/** a world line clipped to the near plane (grid lines must never vanish whole when a close camera passes them) */
export const lineC = (P: Proj, a: V3, b: V3, color: string, sw: number, o: {layer?: number; depthBias?: number; opacity?: number; dash?: string} = {}): Item | null => {
  let A = P.camSpace(a), B = P.camSpace(b);
  if (A.z < NEAR && B.z < NEAR) return null;
  if (A.z < NEAR) {
    const t = (NEAR - A.z) / (B.z - A.z);
    A = {x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t, z: NEAR};
  } else if (B.z < NEAR) {
    const t = (NEAR - B.z) / (A.z - B.z);
    B = {x: B.x + (A.x - B.x) * t, y: B.y + (A.y - B.y) * t, z: NEAR};
  }
  const sa = P.toScreen(A), sb = P.toScreen(B);
  return {layer: o.layer ?? 1, depth: (A.z + B.z) / 2 + (o.depthBias ?? 0), key: `ln${f2(a.x)}${f2(a.z)}${f2(b.x)}${f2(b.z)}${color}`, el: <path key="l" d={`M${f2(sa.x)} ${f2(sa.y)} L${f2(sb.x)} ${f2(sb.y)}`} stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={o.opacity} strokeDasharray={o.dash} fill="none" />};
};

/** a gridded test mat (fine 5 cm, bold 25 cm) on the plane y, its lines aligned to `org` */
const mat = (P: Proj, y: number, x0: number, x1: number, z0: number, z1: number, org: V3, bias: number): (Item | null)[] => {
  const out: (Item | null)[] = [];
  out.push(poly(P, [v3(x0, y + 0.0002, z0), v3(x1, y + 0.0002, z0), v3(x1, y + 0.0002, z1), v3(x0, y + 0.0002, z1)], ENV.mat, {layer: 1, sw: 2.4, depthBias: bias}));
  const k0 = Math.ceil((x0 - org.x) / 0.05 - 1e-6), k1 = Math.floor((x1 - org.x) / 0.05 + 1e-6);
  for (let k = k0; k <= k1; k++) {
    const x = org.x + k * 0.05;
    const bold = k % 5 === 0;
    out.push(lineC(P, v3(x, y + 0.0004, z0), v3(x, y + 0.0004, z1), bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {depthBias: bias - 10}));
  }
  const m0 = Math.ceil((z0 - org.z) / 0.05 - 1e-6), m1 = Math.floor((z1 - org.z) / 0.05 + 1e-6);
  for (let k = m0; k <= m1; k++) {
    const z = org.z + k * 0.05;
    const bold = k % 5 === 0;
    out.push(lineC(P, v3(x0, y + 0.0004, z), v3(x1, y + 0.0004, z), bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {depthBias: bias - 10}));
  }
  return out;
};

const RAMP_TOP = '#E8D2A6'; // a light test board, distinct from the grey mats
const RAMP_SIDE = '#C49A66';
/** the ramp board as a strip of quads following the profile */
const rampBoard = (P: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  const xs: number[] = [];
  for (let x = XC - TT; x <= XF + TT + 1e-9; x += (XF + 2 * TT - (XC - TT)) / 24) xs.push(x);
  const [z0, z1] = RAMP_Z;
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = prof(xs[i]).y + 0.0003, b = prof(xs[i + 1]).y + 0.0003;
    out.push(poly(P, [v3(xs[i], a, z0), v3(xs[i + 1], b, z0), v3(xs[i + 1], b, z1), v3(xs[i], a, z1)], RAMP_TOP, {layer: 1, stroke: null, depthBias: 30}));
  }
  // its edges, the distance tape every 10 cm along the slope, and the rails
  for (const z of [z0, z1]) for (let i = 0; i + 1 < xs.length; i++) out.push(lineC(P, v3(xs[i], prof(xs[i]).y + 0.0005, z), v3(xs[i + 1], prof(xs[i + 1]).y + 0.0005, z), INK, 3, {depthBias: 20}));
  for (let s = 0.1; s < (XF - XC) / Math.cos(SLOPE) - 0.02; s += 0.1) {
    const x = XC + s * Math.cos(SLOPE);
    const y = prof(x).y + 0.0006;
    out.push(lineC(P, v3(x, y, z0 + 0.03), v3(x, y, z1 - 0.03), '#8A6A45', 3, {depthBias: 19}));
  }
  // the side faces (beside the ramp the deck ends at the crest: a step down to the floor)
  for (const z of [z0, z1]) {
    const pts: V3[] = xs.map((x) => v3(x, prof(x).y, z));
    out.push(poly(P, [...pts, v3(XF + TT, 0, z), v3(XC - TT, 0, z)], RAMP_SIDE, {layer: 1, sw: 2.4, depthBias: 25}));
  }
  return out;
};

export type WorldOpts = {H: V3; H2: V3};

export const worldArt = (P: Proj, o: WorldOpts): (Item | null)[] => {
  const out: (Item | null)[] = [];
  // wall, panel moulding along the floor, a shelf with bins (far behind)
  out.push(poly(P, [v3(-8, -0.5, ZW), v3(8, -0.5, ZW), v3(8, 3, ZW), v3(-8, 3, ZW)], ENV.wall, {layer: 0, stroke: null, depthBias: 200}));
  out.push(poly(P, [v3(-8, -0.5, ZW + 0.001), v3(8, -0.5, ZW + 0.001), v3(8, 0.1, ZW + 0.001), v3(-8, 0.1, ZW + 0.001)], ENV.panel, {layer: 0, stroke: null, depthBias: 199}));
  out.push(...box(P, v3(0.2, 1.02, ZW + 0.1), v3(1.6, 0.012, 0.1), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  const bins: [number, number][] = [[-1.2, 0], [-0.85, 1], [-0.5, 2], [-0.15, 3], [0.2, 0], [0.55, 2], [0.9, 1], [1.25, 3]];
  for (const [x, c] of bins) out.push(...box(P, v3(x, 1.08, ZW + 0.09), v3(0.13, 0.055, 0.08), {top: '#F6EFE2', side: ENV.bin[c], front: ENV.bin[c]}, {layer: 0}));
  // the lab floor (wood) and its mat around the runout and H2
  out.push(poly(P, [v3(-8, 0, ZW), v3(8, 0, ZW), v3(8, 0, 4), v3(-8, 0, 4)], ENV.wood, {layer: 1, stroke: null, depthBias: 120}));
  out.push(...mat(P, 0, XC + 0.002, XF + 7, ZW + 0.1, Z_P + 1.9, o.H2, 110));
  // the deck: top (mat), front and end faces
  out.push(poly(P, [v3(DECK_X0, DH, ZW), v3(XC - TT, DH, ZW), v3(XC - TT, DH, DECK_Z1), v3(DECK_X0, DH, DECK_Z1)], ENV.wood, {layer: 1, stroke: null, depthBias: 95}));
  for (const [za, zb] of [[ZW, RAMP_Z[0]], [RAMP_Z[1], DECK_Z1]] as [number, number][]) out.push(poly(P, [v3(XC - TT, DH, za), v3(XC, DH, za), v3(XC, DH, zb), v3(XC - TT, DH, zb)], ENV.wood, {layer: 1, stroke: null, depthBias: 94}));
  out.push(...mat(P, DH, DECK_X0 + 0.1, XC - TT - 0.012, ZW + 0.1, DECK_Z1 - 0.06, o.H, 90));
  out.push(poly(P, [v3(DECK_X0, DH, DECK_Z1), v3(XC, DH, DECK_Z1), v3(XC, 0, DECK_Z1), v3(DECK_X0, 0, DECK_Z1)], ENV.woodFront, {layer: 1, sw: 2.6, depthBias: 60}));
  for (const [za, zb] of [[ZW, RAMP_Z[0]], [RAMP_Z[1], DECK_Z1]] as [number, number][])
    out.push(poly(P, [v3(XC, DH, za), v3(XC, DH, zb), v3(XC, 0, zb), v3(XC, 0, za)], ENV.woodFront, {layer: 1, sw: 2.6, depthBias: 55}));
  out.push(...rampBoard(P));
  return out;
};

/** soft shadow of a link on whatever is under it (projected straight down along the light), layer 2 */
/** overhead lab light: shadows fall straight down, so a group turned on the floor casts the same shadows (the loop) */
export const LIGHT = {x: 0, y: -1, z: 0};
export const shadowOf = (P: Proj, a: V3, b: V3, w: number, alpha: number): Item | null => {
  const drop = (p: V3) => {
    let q = p;
    for (let i = 0; i < 3; i++) {
      const gy = groundY(q.x, q.z);
      const k = (p.y - gy) / -LIGHT.y;
      q = add(p, mul(v3(LIGHT.x, LIGHT.y, LIGHT.z), k));
    }
    return {...q, y: groundY(q.x, q.z) + 0.0008};
  };
  const A = P.camSpace(drop(a)), B = P.camSpace(drop(b));
  if (A.z < NEAR || B.z < NEAR) return null;
  const sa = P.toScreen(A), sb = P.toScreen(B);
  const ra = (P.cam.f * w) / A.z, rb = (P.cam.f * w) / B.z;
  const flat = Math.abs(P.basis.fwd.y) * 0.85 + 0.15;
  const dx = sb.x - sa.x, dy = sb.y - sa.y;
  const L = Math.hypot(dx, dy) || 1;
  const n = {x: -dy / L, y: dx / L};
  const q = (p: {x: number; y: number}) => `${f2(p.x)} ${f2(p.y)}`;
  const d = `M${q({x: sa.x + n.x * ra * flat, y: sa.y + n.y * ra * flat})} L${q({x: sb.x + n.x * rb * flat, y: sb.y + n.y * rb * flat})} A${f2(rb * flat)} ${f2(rb * flat)} 0 0 1 ${q({x: sb.x - n.x * rb * flat, y: sb.y - n.y * rb * flat})} L${q({x: sa.x - n.x * ra * flat, y: sa.y - n.y * ra * flat})} A${f2(ra * flat)} ${f2(ra * flat)} 0 0 1 ${q({x: sa.x + n.x * ra * flat, y: sa.y + n.y * ra * flat})} Z`;
  return {layer: 2, depth: 0, key: `sh${f2(a.x)}${f2(a.z)}${f2(b.x)}`, el: <path key="s" d={d} fill={rgba(INK, alpha)} />};
};

export {rgba};
