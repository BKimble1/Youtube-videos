// MECH: the drive inside the preserved bird (an explanatory SCHEMATIC reconstruction), and the lab cradle.
//
// Everything is drawn from rig.ts only: motor can (behind the skeletal back plate) -> motor pinion P0 -> gear A (20T)
// -> pinion P1 on A's axle -> output gear B (30T) -> crank pin -> two connecting rods -> rod-end eyes on the two spars
// (2.1 cm outboard of the hinges on the top bar) -> spars out through the shoulders.
//
// Every point is projected with proj() (screen space, perspective exact), so the shading stays fixed to the key light
// (upper left) while the parts turn. Gear rotations are exactly ps.gear.* (tooth k of a gear is centred at body-local
// angle gear + k 2pi/n, counter-clockwise seen from +z): the teeth interlock because rig.ts phases them.
//
// Ink: every part is outlined by an underlay (its silhouette stroked in ink at twice the contour width, then filled
// over), all strokes at constant screen width (vectorEffect non-scaling-stroke).
import React from 'react';
import {add3, Basis, bodyFrame, cross3, dot3, facing, Frame, hull, len3, mul3, norm3, poly, proj, rotZ, smoothOpen, sub3, V2, V3, xf, xfv} from '../three';
import {BODY, CRADLE, CRANK, GEARS, Gear, HINGE, LEVER, MOD, MOTOR, PLATE, Pose, SPAR, TOPBAR, WingFrame} from '../rig';
import {C, INK, INK_PX, LINE_PX, NS} from './palette';
import {uid} from '../core/ids';
import {mix} from '../core/color';

export type MechLook = {
  /** gear B's angular speed (rad/s) at this frame: draws rotational motion blur on fast parts */
  rate?: number;
  /** optional emphasis (a soft warm rim/highlight on that part) */
  focus?: 'P0' | 'A' | 'P1' | 'B' | 'rod' | null;
  /** 0..1: 0 = mid-distance simplification (opening cutaway at ~20 px/cm), 1 = close-up (60-120 px/cm) */
  detail?: number;
  alpha?: number;
};

// ------------------------------------------------------------------ local colours (palette C extended)
type Tone = {lit: string; base: string; deep: string};
const BRASS: Tone = {lit: C.brassLit, base: C.brass, deep: mix(C.brass, C.brassDeep, 0.72)};
const BRASS_SIDE = mix(C.brassDeep, INK, 0.12);
const STEEL: Tone = {lit: C.steelLit, base: C.steel, deep: C.steelDeep};
const PINION: Tone = {lit: '#F3F6F8', base: '#B4BFC8', deep: '#6A7883'};
const PINION_SIDE = mix(C.steelDeep, INK, 0.3);
const ROD: Tone = {lit: '#F6F9FB', base: '#BCC6CE', deep: '#5E6C77'};
const PLATE_T: Tone = {lit: C.plateLit, base: C.plate, deep: mix(C.plate, INK, 0.4)};
const PLATE_SIDE = mix(C.plate, INK, 0.55);
const CARBON: Tone = {lit: '#69737D', base: C.carbon, deep: '#121518'};
const DARK: Tone = {lit: C.darkLit, base: C.dark, deep: mix(C.dark, INK, 0.45)};
const CAN: Tone = {lit: C.steelLit, base: C.motor, deep: C.steelDeep};
const BAND: Tone = {lit: '#6FA6D6', base: C.motorBand, deep: '#1B456C'};
const CAP: Tone = {lit: '#737B83', base: C.motorCap, deep: '#1E2226'};
const COPPER: Tone = {lit: '#F2B07A', base: C.copper, deep: '#87461F'};
const GLOW = '#FFC45E';
// the cradle
const BOARD: Tone = {lit: '#F6F8F9', base: '#DDE4E8', deep: '#A2B0B9'};
const RIB: Tone = {lit: '#F4F7F9', base: '#C3CCD3', deep: '#77858F'};
const PAD: Tone = {lit: '#7E8B96', base: '#58656F', deep: '#353F48'};

/** direction TOWARD the key light in screen space (y down): upper left */
const LS: V2 = {x: -0.62, y: -0.78};
const SHUTTER = 0.5 / 30; // a 180 degree shutter at 30 fps (s)

// ------------------------------------------------------------------ drawing context
type El = React.ReactNode;
type Ctx = {
  B: Basis;
  F: Frame;
  defs: El[];
  /** silhouette ink and interior line widths (screen px) */
  ink: number;
  line: number;
  det: number;
  /** px per cm at the drive */
  s0: number;
  /** world direction toward the key light (for flat faces) */
  L3: V3;
  k: number;
};
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const key = (c: Ctx) => `m${c.k++}`;
const pj = (c: Ctx, p: V3) => proj(c.B, xf(c.F, p));
const f2 = (n: number) => n.toFixed(2);
const dOf = (rings: V2[][]) => rings.map((r) => poly(r)).join(' ');

const makeCtx = (B: Basis, F: Frame, detail: number | undefined, probe: V3): Ctx => {
  const s0 = proj(B, xf(F, probe)).s;
  const k = clamp((s0 - 16) / 34);
  const L3 = norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.72)), mul3(B.fw, -0.45)));
  return {B, F, defs: [], ink: lerp(1.35, INK_PX, k), line: lerp(0.8, LINE_PX, k), det: detail ?? clamp((s0 - 16) / 40), s0, L3, k: 0};
};

// ------------------------------------------------------------------ primitives
const lin = (c: Ctx, a: V2, b: V2, stops: [number, string][]) => {
  const id = uid('mg');
  c.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)}>
      {stops.map(([o, col], i) => <stop key={i} offset={o} stopColor={col} />)}
    </linearGradient>,
  );
  return `url(#${id})`;
};
/** a gradient lit from the upper left across a screen region (centre m, radius R) */
const litGrad = (c: Ctx, m: V2, R: number, t: Tone, mid = 0.42) =>
  lin(c, {x: m.x + LS.x * R, y: m.y + LS.y * R}, {x: m.x - LS.x * R, y: m.y - LS.y * R}, [[0, t.lit], [mid, t.base], [1, t.deep]]);
const bbox = (pts: V2[]) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  return {m: {x: (x0 + x1) / 2, y: (y0 + y1) / 2}, R: Math.max(1, Math.hypot(x1 - x0, y1 - y0) / 2)};
};
/** ink underlay: the silhouette stroked at twice the contour width (the fill drawn over it leaves the outer half) */
const under = (c: Ctx, d: string, w = c.ink, op = 1) => (
  <path key={key(c)} d={d} fill={INK} fillRule="evenodd" stroke={INK} strokeWidth={2 * w} strokeLinejoin="round" vectorEffect={NS} opacity={op} />
);
const fillP = (c: Ctx, d: string, fill: string, op = 1) => <path key={key(c)} d={d} fill={fill} fillRule="evenodd" opacity={op} />;
const lineP = (c: Ctx, d: string, w: number, col = INK, op = 1) => (
  <path key={key(c)} d={d} fill="none" stroke={col} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} opacity={op} />
);
/** the focus emphasis: a soft warm rim around a silhouette */
const glow = (c: Ctx, d: string, amt: number): El[] =>
  amt <= 0.01
    ? []
    : [
        <path key={key(c)} d={d} fill="none" stroke={GLOW} strokeWidth={18} strokeLinejoin="round" vectorEffect={NS} opacity={0.2 * amt} />,
        <path key={key(c)} d={d} fill={GLOW} fillOpacity={0.25 * amt} stroke={GLOW} strokeWidth={9} strokeLinejoin="round" vectorEffect={NS} opacity={0.55 * amt} />,
      ];

/** a circle in a plane (centre o, unit axes u, v) as a projected polygon */
const ring3 = (c: Ctx, o: V3, u: V3, v: V3, r: number, n = 24, a0 = 0, a1 = Math.PI * 2, closed = true): V2[] => {
  const out: V2[] = [];
  const m = closed ? n : n + 1;
  for (let i = 0; i < m; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(pj(c, add3(o, add3(mul3(u, r * Math.cos(a)), mul3(v, r * Math.sin(a))))));
  }
  return out;
};
const perpBasis = (d: V3): [V3, V3] => {
  let e1 = cross3(d, [0, 0, 1]);
  if (len3(e1) < 0.3) e1 = cross3(d, [0, 1, 0]);
  e1 = norm3(e1);
  return [e1, norm3(cross3(d, e1))];
};

type CylOpt = {
  n?: number;
  /** opacity of the white specular streak */
  spec?: number;
  capTone?: Tone;
  /** which end caps may be drawn ('auto' = whichever faces the camera) */
  caps?: 'auto' | 'none' | 'a' | 'b';
  ink?: number;
  glow?: number;
  noUnder?: boolean;
};
/** a solid cylinder between body-local points a and b: silhouette (hull of both rims), cross shading, visible cap */
const cyl = (c: Ctx, a: V3, b: V3, r: number, t: Tone, o: CylOpt = {}): El[] => {
  const out: El[] = [];
  const dl = sub3(b, a);
  if (len3(dl) < 1e-4) return out;
  const d = norm3(dl);
  const [e1, e2] = perpBasis(d);
  const n = o.n ?? 20;
  const ra: V2[] = [], rb: V2[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    const off = add3(mul3(e1, r * Math.cos(th)), mul3(e2, r * Math.sin(th)));
    ra.push(pj(c, add3(a, off)));
    rb.push(pj(c, add3(b, off)));
  }
  const sil = hull([...ra, ...rb]);
  const silD = poly(sil);
  const A = pj(c, a), Bp = pj(c, b);
  const w = (r * (A.s + Bp.s)) / 2;
  const ax = {x: Bp.x - A.x, y: Bp.y - A.y};
  const L = Math.hypot(ax.x, ax.y);
  let nx: V2 = LS;
  if (L > w * 0.6) {
    nx = {x: -ax.y / L, y: ax.x / L};
    if (nx.x * LS.x + nx.y * LS.y < 0) nx = {x: -nx.x, y: -nx.y};
  }
  const m = {x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2};
  const grad = L > w * 0.6
    ? lin(c, {x: m.x + nx.x * w, y: m.y + nx.y * w}, {x: m.x - nx.x * w, y: m.y - nx.y * w}, [[0, t.lit], [0.3, t.base], [1, t.deep]])
    : litGrad(c, bbox(sil).m, bbox(sil).R, t);
  if (o.glow) out.push(...glow(c, silD, o.glow));
  if (!o.noUnder) out.push(under(c, silD, o.ink ?? c.ink));
  out.push(fillP(c, silD, grad));
  // the visible end cap
  const dw = xfv(c.F, d);
  const caps = o.caps ?? 'auto';
  const showB = (caps === 'auto' || caps === 'b') && facing(c.B, xf(c.F, b), dw) > 0.04;
  const showA = (caps === 'auto' || caps === 'a') && facing(c.B, xf(c.F, a), mul3(dw, -1)) > 0.04;
  const capT = o.capTone ?? {lit: mix(t.lit, '#FFFFFF', 0.25), base: t.lit, deep: t.base};
  for (const [show, rim] of [[showA, ra], [showB, rb]] as [boolean, V2[]][]) {
    if (!show) continue;
    const bb = bbox(rim);
    out.push(<path key={key(c)} d={poly(rim)} fill={litGrad(c, bb.m, bb.R, capT, 0.5)} stroke={INK} strokeWidth={c.line} strokeOpacity={0.85} strokeLinejoin="round" vectorEffect={NS} />);
  }
  // specular streak along the lit side
  const sp = o.spec ?? 0.55;
  if (sp > 0 && L > w * 1.2 && w > 1.6) {
    const u = {x: ax.x / L, y: ax.y / L};
    const inset = Math.min(L * 0.25, w * 0.6);
    const p0 = {x: A.x + nx.x * w * 0.5 + u.x * inset, y: A.y + nx.y * w * 0.5 + u.y * inset};
    const p1 = {x: Bp.x + nx.x * w * 0.5 - u.x * inset, y: Bp.y + nx.y * w * 0.5 - u.y * inset};
    out.push(lineP(c, `M${f2(p0.x)},${f2(p0.y)} L${f2(p1.x)},${f2(p1.y)}`, clamp(w * 0.2, 0.8, 4), '#FFFFFF', sp));
  }
  return out;
};

/** a box: centre o, unit axes (body-local), half extents h; visible faces shaded by the key light */
const box = (c: Ctx, o: V3, ax: [V3, V3, V3], h: V3, t: Tone, o2: {glow?: number; edge?: number} = {}): El[] => {
  const out: El[] = [];
  const corner = (sx: number, sy: number, sz: number): V3 => add3(o, add3(add3(mul3(ax[0], sx * h[0]), mul3(ax[1], sy * h[1])), mul3(ax[2], sz * h[2])));
  const P: Record<string, V2> = {};
  const S = [-1, 1];
  for (const sx of S) for (const sy of S) for (const sz of S) P[`${sx}${sy}${sz}`] = pj(c, corner(sx, sy, sz));
  const sil = hull(Object.values(P));
  const silD = poly(sil);
  if (o2.glow) out.push(...glow(c, silD, o2.glow));
  out.push(under(c, silD));
  const faces: [number, number][] = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];
  for (const [i, sg] of faces) {
    const nrm = mul3(ax[i], sg);
    const fc = add3(o, mul3(nrm, h[i]));
    const nw = xfv(c.F, nrm);
    if (facing(c.B, xf(c.F, fc), nw) <= 0.01) continue;
    const j = (i + 1) % 3, k = (i + 2) % 3;
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const s: [number, number, number] = [0, 0, 0];
      s[i] = sg; s[j] = a; s[k] = b;
      return P[`${s[0]}${s[1]}${s[2]}`];
    });
    const lv = dot3(nw, c.L3);
    const col = lv > 0 ? mix(t.base, t.lit, clamp(lv * 1.15)) : mix(t.base, t.deep, clamp(-lv * 1.1));
    out.push(<path key={key(c)} d={poly(q)} fill={col} stroke={INK} strokeWidth={o2.edge ?? c.line * 0.8} strokeOpacity={0.75} strokeLinejoin="round" vectorEffect={NS} />);
  }
  return out;
};

type Layers = {under: El[]; side: El[]; face: El[]};
const layers = (): Layers => ({under: [], side: [], face: []});
const flat = (L: Layers): El[] => [...L.under, ...L.side, ...L.face];

/** an extruded planar part. ringsAt(u) = its body-local rings (outer + holes, evenodd) at depth fraction u
 *  (0 = the visible face, 1 = the hidden face). Thickness reads from stacked slices (side colour) under the face. */
const slab = (
  c: Ctx,
  L: Layers,
  ringsAt: (u: number) => V3[][],
  probe: [V3, V3],
  t: {face: string; side: string; ink?: number; line?: number; glow?: number; maxSlices?: number},
) => {
  const p0 = pj(c, probe[0]), p1 = pj(c, probe[1]);
  const dpx = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const maxS = t.maxSlices ?? 2 + Math.round(3 * c.det);
  const nS = dpx < 0.4 ? 0 : Math.max(1, Math.min(maxS, Math.ceil(dpx / 1.5)));
  const ring2 = (u: number) => dOf(ringsAt(u).map((r) => r.map((p) => pj(c, p))));
  const faceD = ring2(0);
  if (t.glow) L.under.push(...glow(c, faceD, t.glow));
  for (let i = nS; i >= 1; i--) {
    const d = ring2(i / nS);
    L.under.push(under(c, d, t.ink));
    L.side.push(fillP(c, d, t.side));
  }
  L.under.push(under(c, faceD, t.ink));
  L.face.push(
    <path key={key(c)} d={faceD} fill={t.face} fillRule="evenodd" stroke={INK} strokeWidth={t.line ?? c.line} strokeOpacity={0.9} strokeLinejoin="round" vectorEffect={NS} />,
  );
  return faceD;
};

// ------------------------------------------------------------------ gear geometry (body-local, exported for checks)
/** tooth profile: [radial offset from the pitch circle in modules, half-width as a fraction of the angular pitch] */
const TOOTH_FULL: [number, number][] = [[-1.25, 0.335], [-1.0, 0.305], [-0.5, 0.272], [0, 0.235], [0.5, 0.195], [0.82, 0.162], [1.0, 0.118]];
const TOOTH_LOW: [number, number][] = [[-1.25, 0.33], [-0.4, 0.27], [0.55, 0.19], [1.0, 0.12]];
/** a gear's toothed outline in body-local (x, y): tooth k centred at angle ang + k 2pi/n (counter-clockwise from +x,
 *  seen from +z), exactly rig.ts's tooth phase */
export const gearOutline = (G: Gear, ang: number, prof: [number, number][] = TOOTH_FULL): [number, number][] => {
  const out: [number, number][] = [];
  const tau = (2 * Math.PI) / G.n;
  const P = (r: number, a: number): [number, number] => [G.c[0] + r * Math.cos(a), G.c[1] + r * Math.sin(a)];
  const rRoot = G.r - 1.25 * MOD;
  for (let k = 0; k < G.n; k++) {
    const th = ang + k * tau;
    out.push(P(rRoot, th - 0.5 * tau));
    for (const [dr, fw] of prof) out.push(P(G.r + dr * MOD, th - fw * tau));
    for (let i = prof.length - 1; i >= 0; i--) out.push(P(G.r + prof[i][0] * MOD, th + prof[i][1] * tau));
  }
  return out;
};
const circ2 = (cx: number, cy: number, r: number, n = 20): [number, number][] =>
  Array.from({length: n}, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as [number, number]);
const chaikin = (pts: [number, number][], passes = 2): [number, number][] => {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const q: [number, number][] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = q;
  }
  return p;
};
/** B: 5 spokes; the crank pin sits on a boss on spoke 0 (at the gear's angle) */
const B_SPOKE = {hw: 0.2, rIn: 0.74, rOut: 1.5, boss: 0.36, clear: 0.5};
const bWindows = (ang: number, lowDetail: boolean): [number, number][][] => {
  const G = GEARS.B;
  const out: [number, number][][] = [];
  const pin: [number, number] = [G.c[0] + CRANK.rc * Math.cos(ang), G.c[1] + CRANK.rc * Math.sin(ang)];
  const {hw, rIn, rOut} = B_SPOKE;
  for (let k = 0; k < 5; k++) {
    const a0 = ang + (k * 2 * Math.PI) / 5, a1 = ang + ((k + 1) * 2 * Math.PI) / 5;
    const pts: [number, number][] = [];
    const No = lowDetail ? 4 : 7, Ni = 3;
    for (let i = 0; i <= No; i++) {
      const a = lerp(a0 + hw / rOut, a1 - hw / rOut, i / No);
      pts.push([G.c[0] + rOut * Math.cos(a), G.c[1] + rOut * Math.sin(a)]);
    }
    for (let i = 0; i <= Ni; i++) {
      const a = lerp(a1 - hw / rIn, a0 + hw / rIn, i / Ni);
      pts.push([G.c[0] + rIn * Math.cos(a), G.c[1] + rIn * Math.sin(a)]);
    }
    // keep clear of the crank-pin boss
    let r = chaikin(pts, 1).map(([x, y]) => {
      const dx = x - pin[0], dy = y - pin[1], d = Math.hypot(dx, dy);
      return d < B_SPOKE.clear ? ([pin[0] + (dx / d) * B_SPOKE.clear, pin[1] + (dy / d) * B_SPOKE.clear] as [number, number]) : ([x, y] as [number, number]);
    });
    r = chaikin(r, lowDetail ? 1 : 2);
    out.push(r);
  }
  return out;
};
/** A: four round lightening holes */
const A_HOLES = {r: 0.69, hr: 0.22};
const gearHoles = (G: Gear, ang: number, lowDetail: boolean): [number, number][][] => {
  if (G.id === 'B') return bWindows(ang, lowDetail);
  if (G.id === 'A') return [0, 1, 2, 3].map((k) => {
    const a = ang + Math.PI / 4 + (k * Math.PI) / 2;
    return circ2(G.c[0] + A_HOLES.r * Math.cos(a), G.c[1] + A_HOLES.r * Math.sin(a), A_HOLES.hr, lowDetail ? 10 : 16);
  });
  return [];
};
/** where each gear's single accent marker sits (radius from the axle; angle offset from the gear's angle) */
const MARK: Record<Gear['id'], {r: number; da: number; size: number} | null> = {
  P0: {r: 0.405, da: 0, size: 0.085},
  A: {r: 1.1, da: 0, size: 0.1},
  P1: null,
  B: {r: 1.73, da: Math.PI, size: 0.12},
};
const HUB: Record<Gear['id'], number> = {P0: 0.25, A: 0.34, P1: 0.26, B: 0.5};

// ------------------------------------------------------------------ the frame geometry (body-local, derived from rig.ts)
type P2t = [number, number];
/** round a polygon's corners (quadratic fillets) */
const fillet = (pts: P2t[], r: number, seg = 4): P2t[] => {
  const out: P2t[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], p = pts[i], b = pts[(i + 1) % n];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    if (la < 1e-6 || lb < 1e-6) continue;
    const u1: P2t = [(p[0] - a[0]) / la, (p[1] - a[1]) / la], u2: P2t = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb];
    const cosA = clamp(-(u1[0] * u2[0] + u1[1] * u2[1]), -1, 1);
    const half = Math.acos(cosA) / 2;
    if (half > 1.48) { out.push(p); continue; } // nearly straight
    const d = Math.min(r / Math.tan(half), la * 0.45, lb * 0.45);
    const P1: P2t = [p[0] - u1[0] * d, p[1] - u1[1] * d], P3: P2t = [p[0] + u2[0] * d, p[1] + u2[1] * d];
    for (let k = 0; k <= seg; k++) {
      const t = k / seg;
      out.push([(1 - t) * (1 - t) * P1[0] + 2 * (1 - t) * t * p[0] + t * t * P3[0], (1 - t) * (1 - t) * P1[1] + 2 * (1 - t) * t * p[1] + t * t * P3[1]]);
    }
  }
  return out;
};
/** union of a polygon (clockwise, y up) with a circle it crosses twice */
const unionCircle = (pts: P2t[], c: P2t, R: number, n = 28): P2t[] => {
  const inside = (p: P2t) => Math.hypot(p[0] - c[0], p[1] - c[1]) < R;
  const hit = (a: P2t, b: P2t, first: boolean): P2t => {
    const dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - c[0], fy = a[1] - c[1];
    const A = dx * dx + dy * dy, Bq = 2 * (fx * dx + fy * dy), Cq = fx * fx + fy * fy - R * R;
    const disc = Math.sqrt(Math.max(0, Bq * Bq - 4 * A * Cq));
    const t = first ? (-Bq - disc) / (2 * A) : (-Bq + disc) / (2 * A);
    return [a[0] + dx * t, a[1] + dy * t];
  };
  const N = pts.length;
  let iIn = -1, iOut = -1;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N];
    if (!inside(a) && inside(b)) iIn = i;
    if (inside(a) && !inside(b)) iOut = i;
  }
  if (iIn < 0 || iOut < 0) return pts;
  const Ein = hit(pts[iIn], pts[(iIn + 1) % N], true), Eout = hit(pts[iOut], pts[(iOut + 1) % N], false);
  const out: P2t[] = [];
  for (let k = (iOut + 1) % N; ; k = (k + 1) % N) {
    out.push(pts[k]);
    if (k === iIn) break;
  }
  out.push(Ein);
  const aIn = Math.atan2(Ein[1] - c[1], Ein[0] - c[0]);
  let aOut = Math.atan2(Eout[1] - c[1], Eout[0] - c[0]);
  while (aOut > aIn) aOut -= Math.PI * 2; // clockwise
  const m = Math.max(2, Math.round(((aIn - aOut) / (Math.PI * 2)) * n));
  for (let i = 1; i < m; i++) {
    const a = lerp(aIn, aOut, i / m);
    out.push([c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]);
  }
  out.push(Eout);
  return out;
};
/** the slot through the plate's top edge that clears the far rod and the far spar (they pass behind the plate) */
const SLOT = {x0: 1.8, x1: 3.2, yb: 2.0};
/** the plate's motor-mount lobe around the motor bore */
const LOBE_R = 2.05;
export const PLATE_OUTLINE: P2t[] = (() => {
  const o = PLATE.outline;
  const pts: P2t[] = [o[0], o[1]];
  const top = o[1][1];
  const cx = (SLOT.x0 + SLOT.x1) / 2, rw = (SLOT.x1 - SLOT.x0) / 2, cy = SLOT.yb + rw;
  pts.push([SLOT.x0, top]);
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    pts.push([cx + rw * Math.cos(a), cy + rw * Math.sin(a)]);
  }
  pts.push([SLOT.x1, top]);
  for (let i = 2; i < o.length; i++) pts.push(o[i]);
  return fillet(unionCircle(pts, [MOTOR.c[0], MOTOR.c[1]], LOBE_R), 0.32);
})();
const PLATE_HOLES: P2t[][] = PLATE.holes.map((h) => circ2(h.c[0], h.c[1], h.r, h.r > 1.2 ? 30 : 22));
const PLATE_BACK = PLATE.z - PLATE.th;
/** top-bar brackets: one block at each end of the hinge axes, jutting from the plate; the hinge pins span them */
const BRACKET = {y0: 4.0, y1: 5.15, w: 0.9};
const KNUCKLE = {hw: 0.62, r: 0.4};
/** rod-end eyes: radius, half-length along their pin */
const EYE = {r: 0.34, hl: 0.13};
const SPAR_DRAWN = 6; // cm from the hinge (the Bird module draws the wings)

/** wires from the motor's terminals back toward the rear of the body (kept inside the body volumes) */
const insideBody = (p: V3, margin: number) =>
  Object.values(BODY).some((e) => {
    const q = rotZ(sub3(p, e.c), -(e.tilt ?? 0));
    return (q[0] / (e.r[0] - margin)) ** 2 + (q[1] / (e.r[1] - margin)) ** 2 + (q[2] / (e.r[2] - margin)) ** 2 < 1;
  });
const pullIn = (p: V3): V3 => {
  let q = p;
  for (let i = 0; i < 40 && !insideBody(q, 0.45); i++) q = add3(q, mul3(sub3([2, -0.5, 0], q), 0.04));
  return q;
};
const TERM = [-18, -52].map((deg) => (deg * Math.PI) / 180);
const termPt = (a: number, r: number, z = -4.98): V3 => [MOTOR.c[0] + r * Math.cos(a), MOTOR.c[1] + r * Math.sin(a), z];
const WIRE_SRC: {col: Tone; pts: V3[]}[] = [
  {col: {lit: '#F08A7C', base: C.wireRed, deep: '#7E2620'}, pts: [termPt(TERM[0], 1.62), [6.5, -5.0, -4.85], [5.9, -5.7, -4.3], [3.8, -5.7, -3.9], [1.2, -5.1, -3.7], [-1.6, -4.45, -3.5], [-4.4, -3.75, -3.3]]},
  {col: {lit: '#59616B', base: C.wireBlack, deep: '#0E1012'}, pts: [termPt(TERM[1], 1.62), [5.75, -6.0, -4.6], [4.4, -6.15, -4.1], [2.0, -5.45, -3.9], [-1.0, -4.75, -3.7], [-4.4, -4.05, -3.45]]},
];
const WIRES = WIRE_SRC.map((w) => ({col: w.col, pts: w.pts.map((p, i) => (i === 0 ? p : pullIn(p)))}));
const CONNECTOR: V3 = pullIn([-4.95, -3.9, -3.35]);

// ------------------------------------------------------------------ part drawers
const gearRings3 = (G: Gear, ang: number, z: number, prof: [number, number][], low: boolean): V3[][] =>
  [gearOutline(G, ang, prof), ...gearHoles(G, ang, low)].map((r) => r.map(([x, y]) => [x, y, z] as V3));

/** one gear (one blur sample) into the layers */
const gearBody = (c: Ctx, L: Layers, G: Gear, ang: number, glowAmt: number) => {
  const front = facing(c.B, xf(c.F, [G.c[0], G.c[1], G.z1]), xfv(c.F, [0, 0, 1])) > 0;
  const zf = front ? G.z1 : G.z0, zb = front ? G.z0 : G.z1;
  const toothPx = MOD * c.s0;
  const prof = toothPx < 5 ? TOOTH_LOW : TOOTH_FULL;
  const low = c.det < 0.35;
  const ctr = pj(c, [G.c[0], G.c[1], zf]);
  const R = (G.r + MOD) * ctr.s;
  const brass = G.id === 'A' || G.id === 'B';
  const tone = brass ? BRASS : PINION;
  slab(c, L, (u) => gearRings3(G, ang, lerp(zf, zb, u), prof, low), [[G.c[0], G.c[1], zf], [G.c[0], G.c[1], zb]], {
    face: litGrad(c, ctr, R * 1.05, tone, 0.45),
    side: brass ? BRASS_SIDE : PINION_SIDE,
    ink: Math.min(c.ink, lerp(1.1, INK_PX, clamp((toothPx - 2.5) / 5))),
    glow: glowAmt,
  });
};

/** the face details drawn once per gear (hub, gloss, rim line, accent marker with its blur trail) */
const gearTop = (c: Ctx, G: Gear, ang: number, sweep: number): El[] => {
  const out: El[] = [];
  const front = facing(c.B, xf(c.F, [G.c[0], G.c[1], G.z1]), xfv(c.F, [0, 0, 1])) > 0;
  const zf = front ? G.z1 : G.z0;
  const X: V3 = [1, 0, 0], Y: V3 = [0, 1, 0];
  const o: V3 = [G.c[0], G.c[1], zf];
  const ctr = pj(c, o);
  const brass = G.id === 'A' || G.id === 'B';
  const rRoot = G.r - 1.25 * MOD;
  // rim line (where the web meets the toothed rim), lighter on the lit side
  if (c.det > 0.3 && ctr.s * G.r > 30) {
    const ring = ring3(c, o, X, Y, rRoot * 0.94, 40);
    out.push(lineP(c, poly(ring), c.line * 0.7, brass ? C.brassDeep : C.steelDeep, 0.5));
  }
  // gloss: a white arc on the upper-left inside the rim (fixed to the light, not to the gear)
  const gl = ring3(c, o, X, Y, rRoot * (G.n > 10 ? 0.86 : 0.74), 10, (100 * Math.PI) / 180, (165 * Math.PI) / 180, false);
  out.push(<path key={key(c)} d={smoothOpen(gl)} fill="none" stroke="#FFFFFF" strokeWidth={clamp(0.035 * ctr.s, 1, 4.5)} strokeLinecap="round" vectorEffect={NS} opacity={0.6} />);
  // hub boss
  const hubR = HUB[G.id];
  if (G.id !== 'A') {
    out.push(...cyl(c, o, [o[0], o[1], zf + 0.07], hubR, brass ? BRASS : PINION, {n: 22, spec: 0}));
    // axle end with a retaining clip
    const axR = G.id === 'P0' ? MOTOR.shaftR : 0.17;
    out.push(...cyl(c, [o[0], o[1], zf + 0.07], [o[0], o[1], zf + 0.13], axR, STEEL, {n: 16, spec: 0, ink: c.line}));
    if (c.det > 0.45 && G.id !== 'P0') {
      const clip = ring3(c, [o[0], o[1], zf + 0.08], X, Y, axR + 0.07, 18, 0.5, Math.PI * 2 - 0.5, false);
      out.push(lineP(c, poly(clip, false), clamp(0.05 * ctr.s, 1, 3), C.dark, 0.9));
    }
    if (c.det > 0.45 && G.id === 'P0') {
      // set screw on the pinion hub
      const ss = pj(c, [o[0] + hubR * Math.cos(ang + 2.2) * 0.98, o[1] + hubR * Math.sin(ang + 2.2) * 0.98, zf + 0.035]);
      out.push(<circle key={key(c)} cx={f2(ss.x)} cy={f2(ss.y)} r={f2(clamp(0.045 * ss.s, 0.8, 3))} fill={C.dark} />);
    }
  }
  // the single accent marker
  const mk = MARK[G.id];
  if (mk) {
    const a = ang + mk.da;
    const mc: V3 = [G.c[0] + mk.r * Math.cos(a), G.c[1] + mk.r * Math.sin(a), zf + 0.005];
    const sz = Math.max(mk.size, 2.2 / Math.max(1, ctr.s));
    if (Math.abs(sweep) > 0.05) {
      const tr = ring3(c, [G.c[0], G.c[1], zf + 0.005], X, Y, mk.r, 12, a - sweep / 2, a + sweep / 2, false);
      out.push(<path key={key(c)} d={poly(tr, false)} fill="none" stroke={C.accent} strokeWidth={f2(sz * 2 * ctr.s * 0.85)} strokeLinecap="round" opacity={0.42} vectorEffect={NS} />);
    }
    const dot = ring3(c, mc, X, Y, sz, 14);
    out.push(<path key={key(c)} d={poly(dot)} fill={C.accent} stroke={INK} strokeWidth={c.line} strokeLinejoin="round" vectorEffect={NS} />);
    if (ctr.s * sz > 4) {
      const g = pj(c, [mc[0] - sz * 0.35, mc[1] + sz * 0.35, mc[2]]);
      out.push(<circle key={key(c)} cx={f2(g.x)} cy={f2(g.y)} r={f2(sz * ctr.s * 0.28)} fill="#FFFFFF" opacity={0.75} />);
    }
  }
  return out;
};

/** a group of coplanar meshing gears, with rotational motion blur (sub-frame copies over a 180 degree shutter) */
const gearGroup = (c: Ctx, ids: Gear['id'][], ps: Pose, rate: number, focus: MechLook['focus']): El[] => {
  const omega: Record<Gear['id'], number> = {B: rate, P1: -3 * rate, A: -3 * rate, P0: 6 * rate};
  // samples needed: enough that a tooth never jumps more than ~a fifth of its pitch between copies
  let K = 1;
  for (const id of ids) {
    const sweep = Math.abs(omega[id]) * SHUTTER;
    const tau = (2 * Math.PI) / GEARS[id].n;
    K = Math.max(K, Math.ceil(sweep / (tau * 0.2)));
  }
  K = Math.min(K, Math.round(3 + 4 * c.det));
  const out: El[] = [];
  for (let i = 0; i < K; i++) {
    const L = layers();
    const dt = K === 1 ? 0 : (i / (K - 1) - 0.5) * SHUTTER;
    for (const id of ids) gearBody(c, L, GEARS[id], ps.gear[id] + omega[id] * dt, i === 0 && focus === id ? 1 : 0);
    // equal-weight accumulation: copy i drawn at 1/(i+1) over the running average
    out.push(<g key={key(c)} opacity={K === 1 ? undefined : f2(1 / (i + 1))}>{flat(L)}</g>);
  }
  for (const id of ids) out.push(...gearTop(c, GEARS[id], ps.gear[id], K > 1 ? omega[id] * SHUTTER : 0));
  return out;
};

const plate = (c: Ctx): El[] => {
  const L = layers();
  const rings = (z: number): V3[][] => [PLATE_OUTLINE, ...PLATE_HOLES].map((r) => r.map(([x, y]) => [x, y, z] as V3));
  const front = facing(c.B, xf(c.F, [2.4, 1, PLATE.z]), xfv(c.F, [0, 0, 1])) > 0;
  const zf = front ? PLATE.z : PLATE_BACK, zb = front ? PLATE_BACK : PLATE.z;
  const pts = PLATE_OUTLINE.map(([x, y]) => pj(c, [x, y, zf]));
  const bb = bbox(pts);
  slab(c, L, (u) => rings(lerp(zf, zb, u)), [[2.4, 1, zf], [2.4, 1, zb]], {face: litGrad(c, bb.m, bb.R, PLATE_T, 0.5), side: PLATE_SIDE, maxSlices: 2});
  const out = flat(L);
  // a soft machined sheen across the upper left
  if (c.det > 0.2) {
    const sh = PLATE_OUTLINE.map(([x, y]) => pj(c, [x, y, zf]));
    const id = uid('mclip');
    c.defs.push(<clipPath key={id} id={id}><path d={dOf([sh, ...PLATE_HOLES.map((h) => h.map(([x, y]) => pj(c, [x, y, zf])))])} clipRule="evenodd" /></clipPath>);
    const a = pj(c, [-1.2, 4.6, zf]), b = pj(c, [3.5, -2.6, zf]);
    out.push(
      <g key={key(c)} clipPath={`url(#${id})`}>
        <path d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke="#FFFFFF" strokeWidth={f2(0.9 * a.s)} opacity={0.07} strokeLinecap="round" />
        <path d={`M${f2(a.x + 1.4 * a.s)},${f2(a.y)} L${f2(b.x + 1.4 * a.s)},${f2(b.y)}`} stroke="#FFFFFF" strokeWidth={f2(0.3 * a.s)} opacity={0.06} strokeLinecap="round" />
      </g>,
    );
  }
  // screws (hex sockets)
  if (c.det > 0.4) {
    const screws: P2t[] = [[-1.4, 4.35], [6.0, 4.45], [6.75, -1.4], [0.55, -1.95]];
    const m = MOTOR.c;
    for (const a of [-0.78, -2.36]) screws.push([m[0] + 1.84 * Math.cos(a), m[1] + 1.84 * Math.sin(a)]);
    for (const [x, y] of screws) {
      const hd = ring3(c, [x, y, PLATE.z + 0.04], [1, 0, 0], [0, 1, 0], 0.17, 14);
      const bb2 = bbox(hd);
      out.push(<path key={key(c)} d={poly(hd)} fill={litGrad(c, bb2.m, bb2.R, STEEL, 0.5)} stroke={INK} strokeWidth={c.line} vectorEffect={NS} />);
      const hex = ring3(c, [x, y, PLATE.z + 0.05], [1, 0, 0], [0, 1, 0], 0.075, 6);
      out.push(<path key={key(c)} d={poly(hex)} fill={C.dark} />);
    }
  }
  return out;
};

const motor = (c: Ctx): El[] => {
  const out: El[] = [];
  const m = MOTOR.c;
  const at = (z: number): V3 => [m[0], m[1], z];
  const zCapEnd = MOTOR.z0 + 0.48;
  // wires (farthest: they leave the terminals on the end cap and run back toward the rear of the body)
  for (const w of WIRES) {
    const pts = w.pts.map((p) => pj(c, p));
    const d = smoothOpen(pts);
    const ww = clamp(2 * 0.11 * pts[2].s, 1.2, 14);
    out.push(<path key={key(c)} d={d} fill="none" stroke={INK} strokeWidth={f2(ww + 2 * c.line)} strokeLinecap="round" strokeLinejoin="round" vectorEffect={NS} />);
    out.push(<path key={key(c)} d={d} fill="none" stroke={w.col.base} strokeWidth={f2(ww)} strokeLinecap="round" strokeLinejoin="round" vectorEffect={NS} />);
    if (ww > 3)
      out.push(<path key={key(c)} d={d} fill="none" stroke={w.col.lit} strokeWidth={f2(ww * 0.32)} strokeLinecap="round" transform={`translate(${f2(LS.x * ww * 0.2)},${f2(LS.y * ww * 0.2)})`} opacity={0.8} vectorEffect={NS} />);
  }
  if (c.det > 0.15) out.push(...box(c, CONNECTOR, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0.42, 0.26, 0.22], CAP));
  // end cap, terminals, can, label band, front bearing boss
  out.push(...cyl(c, at(MOTOR.z0), at(zCapEnd), MOTOR.r * 0.96, CAP, {n: 28, spec: 0.25}));
  for (const a of TERM) {
    const rad: V3 = [Math.cos(a), Math.sin(a), 0], tan: V3 = [-Math.sin(a), Math.cos(a), 0];
    out.push(...box(c, termPt(a, 1.43), [rad, tan, [0, 0, 1]], [0.24, 0.13, 0.04], COPPER));
  }
  out.push(...cyl(c, at(zCapEnd), at(MOTOR.z1), MOTOR.r, CAN, {n: 30, spec: 0.7}));
  const zb0 = lerp(zCapEnd, MOTOR.z1, 0.3), zb1 = lerp(zCapEnd, MOTOR.z1, 0.66);
  out.push(...cyl(c, at(zb0), at(zb1), MOTOR.r + 0.015, BAND, {n: 30, spec: 0.35, caps: 'none', ink: c.line}));
  out.push(...cyl(c, at(MOTOR.z1), at(MOTOR.z1 + 0.12), 0.45, STEEL, {n: 20, spec: 0}));
  if (c.det > 0.4) {
    for (const a of [0.8, 0.8 + Math.PI]) {
      const v = ring3(c, [m[0] + 0.85 * Math.cos(a), m[1] + 0.85 * Math.sin(a), MOTOR.z1 + 0.005], [1, 0, 0], [0, 1, 0], 0.12, 10);
      out.push(<path key={key(c)} d={poly(v)} fill={C.dark} opacity={0.8} />);
    }
  }
  return out;
};

/** the far spar beyond its rod-end eye (it passes behind the plate, through the slot) */
const sparSeg = (c: Ctx, W: WingFrame, a: number, b: number, o: CylOpt = {}): El[] =>
  cyl(c, add3(W.o, mul3(W.ex, a)), add3(W.o, mul3(W.ex, b)), SPAR.r, CARBON, {n: 16, spec: 0.35, ...o});
const collar = (c: Ctx, W: WingFrame, a: number): El[] =>
  cyl(c, add3(W.o, mul3(W.ex, a - 0.07)), add3(W.o, mul3(W.ex, a + 0.07)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0, ink: c.line});
/** the rod-end eye on a spar: a short housing coaxial with the spar, centred exactly at the lever point */
const topEye = (c: Ctx, W: WingFrame, glowAmt: number): El[] =>
  cyl(c, add3(W.o, mul3(W.ex, LEVER - EYE.hl)), add3(W.o, mul3(W.ex, LEVER + EYE.hl)), EYE.r, ROD, {n: 22, spec: 0.3, glow: glowAmt});
/** the rod-end eye on the crank pin (axis z) */
const pinEye = (c: Ctx, p: V3, glowAmt: number): El[] =>
  cyl(c, [p[0], p[1], p[2] - EYE.hl], [p[0], p[1], p[2] + EYE.hl], EYE.r, ROD, {n: 22, spec: 0.3, glow: glowAmt});
const rodBar = (c: Ctx, a: V3, b: V3, glowAmt: number): El[] => cyl(c, a, b, 0.135, ROD, {n: 14, spec: 0.7, caps: 'none', glow: glowAmt});

const hingeAssembly = (c: Ctx, ps: Pose, glowNear: number): {back: El[]; front: El[]} => {
  const back: El[] = [], front: El[] = [];
  const yc = (BRACKET.y0 + BRACKET.y1) / 2, hy = (BRACKET.y1 - BRACKET.y0) / 2;
  const zc = (TOPBAR.z0 + TOPBAR.z1) / 2, hz = (TOPBAR.z1 - TOPBAR.z0) / 2;
  const I: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const xl = TOPBAR.x0 + BRACKET.w / 2, xr = TOPBAR.x1 - BRACKET.w / 2;
  // which bracket is nearer depends on the camera's side: draw the far one first
  const camX = dot3(sub3(c.B.eye, xf(c.F, [2.5, 4.6, 0])), xfv(c.F, [1, 0, 0])) > 0;
  const [b1, b2] = camX ? [xl, xr] : [xr, xl];
  back.push(...box(c, [b1, yc, zc], I, [BRACKET.w / 2, hy, hz], PLATE_T));
  // hinge pins between the brackets
  for (const H of [HINGE.far, HINGE.near]) back.push(...cyl(c, [xl + BRACKET.w / 2, H[1], H[2]], [xr - BRACKET.w / 2, H[1], H[2]], 0.12, STEEL, {n: 12, spec: 0.4, caps: 'none'}));
  // far spar root: spar (from its eye to the knuckle), ferrule, knuckle
  const Wf = ps.wing.far, Wn = ps.wing.near;
  const det = c.det > 0.45;
  if (det) back.push(...collar(c, Wf, LEVER - EYE.hl - 0.12));
  back.push(...sparSeg(c, Wf, 0.72, LEVER - EYE.hl, {caps: 'none'}));
  back.push(...cyl(c, add3(Wf.o, mul3(Wf.ex, 0.2)), add3(Wf.o, mul3(Wf.ex, 0.8)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0.3}));
  const knuckle = (H: V3, g: number) => cyl(c, [H[0] - KNUCKLE.hw, H[1], H[2]], [H[0] + KNUCKLE.hw, H[1], H[2]], KNUCKLE.r, STEEL, {n: 20, spec: 0.55, glow: g});
  back.push(...knuckle(HINGE.far, 0));
  back.push(...knuckle(HINGE.near, glowNear));
  back.push(...cyl(c, add3(Wn.o, mul3(Wn.ex, 0.2)), add3(Wn.o, mul3(Wn.ex, 0.8)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0.3, glow: glowNear}));
  back.push(...box(c, [b2, yc, zc], I, [BRACKET.w / 2, hy, hz], PLATE_T));
  // pin heads on the nearer bracket's outer face
  const sx = camX ? 1 : -1;
  for (const H of [HINGE.far, HINGE.near]) {
    const xo = (camX ? TOPBAR.x1 : TOPBAR.x0);
    back.push(...cyl(c, [xo, H[1], H[2]], [xo + sx * 0.07, H[1], H[2]], 0.2, STEEL, {n: 14, spec: 0, ink: c.line}));
  }
  // near spar from the ferrule to its eye (it points toward the camera)
  back.push(...sparSeg(c, Wn, 0.8, LEVER - EYE.hl, {caps: 'none', glow: glowNear}));
  if (det) back.push(...collar(c, Wn, LEVER - EYE.hl - 0.12));
  // the near eye and the spar beyond it are drawn after the near rod (front)
  front.push(...topEye(c, Wn, glowNear));
  if (det) front.push(...collar(c, Wn, LEVER + EYE.hl + 0.12));
  front.push(...sparSeg(c, Wn, LEVER + EYE.hl, SPAR_DRAWN, {caps: 'b'}));
  return {back, front};
};

const drawMech = (c: Ctx, ps: Pose, look: MechLook): El[] => {
  const out: El[] = [];
  const rate = look.rate ?? 0;
  const focus = look.focus ?? null;
  const fRod = focus === 'rod' ? 1 : 0;
  const Wf = ps.wing.far;
  // 1. behind the plate: the far spar's outer part (seen above the plate and through its slot)
  out.push(...sparSeg(c, Wf, LEVER + EYE.hl, SPAR_DRAWN, {caps: 'auto'}));
  if (c.det > 0.45) out.push(...collar(c, Wf, LEVER + EYE.hl + 0.12));
  // 2. the motor (behind the plate, seen through the bore and below the plate)
  out.push(...motor(c));
  // 3. the skeletal back plate, axle bosses
  out.push(...plate(c));
  for (const id of ['A', 'B'] as const) {
    const G = GEARS[id];
    out.push(...cyl(c, [G.c[0], G.c[1], PLATE.z], [G.c[0], G.c[1], PLATE.z + 0.2], 0.42, STEEL, {n: 18, spec: 0.3}));
  }
  // 4. the motor shaft and the first stage (P0 meshing with A)
  out.push(...cyl(c, [MOTOR.c[0], MOTOR.c[1], MOTOR.z1 + 0.1], [MOTOR.c[0], MOTOR.c[1], GEARS.P0.z0], MOTOR.shaftR, STEEL, {n: 12, spec: 0.4, caps: 'none'}));
  out.push(...gearGroup(c, ['A', 'P0'], ps, rate, focus));
  // the spacer that joins A to P1 on their common axle
  out.push(...cyl(c, [GEARS.A.c[0], GEARS.A.c[1], GEARS.A.z1], [GEARS.P1.c[0], GEARS.P1.c[1], GEARS.P1.z0], HUB.A, STEEL, {n: 18, spec: 0.5}));
  // 5. the second stage (P1 meshing with B)
  out.push(...gearGroup(c, ['B', 'P1'], ps, rate, focus));
  // the crank boss on B's spoke 0 and the crank pin
  const bz = GEARS.B.z1;
  const pinBase: V3 = [ps.pin[0], ps.pin[1], bz];
  out.push(...cyl(c, pinBase, [ps.pin[0], ps.pin[1], bz + 0.09], B_SPOKE.boss, BRASS, {n: 20, spec: 0, glow: focus === 'B' ? 0.6 : 0}));
  out.push(...cyl(c, [ps.pin[0], ps.pin[1], bz + 0.09], [ps.pin[0], ps.pin[1], ps.rodEye.near[2] + EYE.hl + 0.06], CRANK.pinR, STEEL, {n: 14, spec: 0.4}));
  // 6. the far rod (it climbs behind the plate through the slot to the far spar's eye), the far spar root
  out.push(...rodBar(c, ps.rodEye.far, ps.rodTop.far, 0));
  out.push(...topEye(c, Wf, 0));
  out.push(...pinEye(c, ps.rodEye.far, 0));
  const hinge = hingeAssembly(c, ps, fRod * 0.8);
  out.push(...hinge.back);
  // 7. the near rod, its eye on the pin, the pin head
  out.push(...rodBar(c, ps.rodEye.near, ps.rodTop.near, fRod));
  out.push(...pinEye(c, ps.rodEye.near, fRod));
  const pz = ps.rodEye.near[2] + EYE.hl;
  out.push(...cyl(c, [ps.pin[0], ps.pin[1], pz], [ps.pin[0], ps.pin[1], pz + 0.07], CRANK.pinR + 0.03, STEEL, {n: 14, spec: 0, ink: c.line}));
  // 8. the near rod's eye on the near spar, and the spar on out through the shoulder
  out.push(...hinge.front);
  return out;
};

/** the drive (SCHEMATIC). B, F: the camera and the bird's body frame; ps: the pose (rig.ts). */
export const Mech: React.FC<{B: Basis; F: Frame; ps: Pose; look?: MechLook}> = ({B, F, ps, look = {}}) => {
  const c = makeCtx(B, F, look.detail, [3, 0, 0]);
  const els = drawMech(c, ps, look);
  return (
    <g opacity={look.alpha ?? 1}>
      <defs>{c.defs}</defs>
      {els}
    </g>
  );
};

// ------------------------------------------------------------------ the lab cradle
/** exit distance of a ray from inside the union of the BODY ellipsoids */
const hitEll = (e: {c: V3; r: V3; tilt?: number}, o: V3, d: V3): [number, number] | null => {
  const q = rotZ(sub3(o, e.c), -(e.tilt ?? 0)), dq = rotZ(d, -(e.tilt ?? 0));
  const Q: V3 = [q[0] / e.r[0], q[1] / e.r[1], q[2] / e.r[2]], D: V3 = [dq[0] / e.r[0], dq[1] / e.r[1], dq[2] / e.r[2]];
  const a = dot3(D, D), b = 2 * dot3(Q, D), cc = dot3(Q, Q) - 1;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
};
const bodyExit = (o: V3, d: V3) => {
  let best = 0;
  for (let it = 0; it < 4; it++)
    for (const e of Object.values(BODY)) {
      const h = hitEll(e, o, d);
      if (h && h[0] <= best + 1e-6 && h[1] > best) best = h[1];
    }
  return best;
};
const CR = {tmax: (62 * Math.PI) / 180, padT: 0.55, ribT: 0.7, ribHalf: 0.26, legW: 1.25, footZ: 3.5, boardT: 1.0, boardZ: 4.4, boardX: [-9.2, 9.6] as [number, number], n: 12};
/** one support's profile (yz) at body-local x: the body's underside section and the pad/rib curves */
const crSection = (x: number) => {
  const O: V3 = [x, -1, 0];
  const at = (t: number, off: number): [number, number] => {
    const d: V3 = [0, -Math.cos(t), Math.sin(t)];
    const r = bodyExit(O, d) + 0.02 + off;
    return [O[1] + d[1] * r, d[2] * r]; // (y, z)
  };
  return at;
};
type YZ = [number, number];
/** the near half (z >= 0) of a support: pad band and rib (arch with a U saddle and a leg), as (y, z) polygons whose
 *  first and last points sit on the cut plane z = 0 */
const crProfiles = (x: number) => {
  const at = crSection(x);
  const N = CR.n, tm = CR.tmax;
  const ts = Array.from({length: N + 1}, (_, i) => (i / N) * tm);
  const pad: YZ[] = [...ts.map((t) => at(t, 0)), ...[...ts].reverse().map((t) => at(t, CR.padT))];
  // the rib: saddle from the pad's outer face, a band of ribT, then a leg down to the board
  const yb = CRADLE.benchY + CR.boardT;
  const tLeg = tm * 0.55;
  const inner = ts.map((t) => at(t, CR.padT));
  const outerTip = at(tm, CR.padT + CR.ribT);
  const legTop = at(tLeg + 0.12, CR.padT + CR.ribT);
  const archTop = at(tLeg * 0.35, CR.padT + CR.ribT);
  const rib: YZ[] = [
    ...inner,
    outerTip,
    at(tm * 0.85, CR.padT + CR.ribT),
    legTop,
    [lerp(legTop[0], yb, 0.5), CR.footZ + CR.legW * 0.62],
    [yb, CR.footZ + CR.legW * 0.6],
    [yb, CR.footZ - CR.legW * 0.6],
    [lerp(archTop[0], yb, 0.55), CR.footZ - CR.legW * 0.75],
    [archTop[0] - 0.9, archTop[1] * 0.75],
    archTop,
    at(0, CR.padT + CR.ribT),
  ];
  return {pad, rib, yb};
};
const CR_PROF = CRADLE.xs.map((x) => ({x, ...crProfiles(x)}));

type Half = 1 | -1;
/** an extruded half-profile (along x, thickness 2*hx) with its ink left open along the cut (z = 0) so the two halves join */
const crExtrude = (c: Ctx, x: number, hx: number, prof: YZ[], side: Half, t: Tone, sideCol: string, maxS = 6): El[] => {
  const L = layers();
  const camPlusX = dot3(sub3(c.B.eye, xf(c.F, [x, -10, 0])), xfv(c.F, [1, 0, 0])) > 0;
  const xf0 = camPlusX ? x + hx : x - hx, xb0 = camPlusX ? x - hx : x + hx;
  const pts = (xx: number) => prof.map(([y, z]) => pj(c, [xx, y, side * z]));
  const p0 = pj(c, [xf0, -10, 0]), p1 = pj(c, [xb0, -10, 0]);
  const dpx = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const nS = dpx < 0.4 ? 0 : Math.max(1, Math.min(maxS, Math.ceil(dpx / 1.8)));
  const openD = (r: V2[]) => `M${r.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' L')}`;
  const face = pts(xf0);
  const bb = bbox(face);
  for (let i = nS; i >= 0; i--) {
    const r = pts(lerp(xf0, xb0, i / nS || 0));
    L.under.push(<path key={key(c)} d={openD(r)} fill="none" stroke={INK} strokeWidth={2 * c.ink} strokeLinejoin="round" strokeLinecap="butt" vectorEffect={NS} />);
    if (i > 0) L.side.push(fillP(c, poly(r), sideCol));
  }
  // the extruded edge between the back slice and the face: a band under the slices
  L.face.push(<path key={key(c)} d={poly(face)} fill={litGrad(c, bb.m, bb.R, t, 0.5)} />);
  L.face.push(<path key={key(c)} d={openD(face)} fill="none" stroke={INK} strokeWidth={c.line} strokeOpacity={0.85} strokeLinejoin="round" vectorEffect={NS} />);
  return flat(L);
};

/** the lab's padded two-U support under the body (rig.ts CRADLE), standing on the bench at `base` (world).
 *  layer: 'back' = base board, crossbar and the far halves; 'front' = the near halves (the arms that wrap the near
 *  flank: draw them after the bird); default 'all'. */
export const Cradle: React.FC<{B: Basis; F: Frame; base: V3; layer?: 'all' | 'back' | 'front'}> = ({B, F, base, layer = 'all'}) => {
  // the cradle stands level on the bench: it takes only the bird's heading, and sits at base
  const yaw = (Math.atan2(F.ex[2], F.ex[0]) * -180) / Math.PI;
  const CF = bodyFrame([base[0], base[1] - CRADLE.benchY, base[2]], yaw, 0, 0);
  const c = makeCtx(B, CF, 1, [0, -8, 0]);
  c.ink = INK_PX;
  c.line = LINE_PX;
  const back: El[] = [], front: El[] = [];
  const yb = CRADLE.benchY + CR.boardT;
  if (layer !== 'front') {
    const I: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const bx = CR.boardX;
    back.push(...box(c, [(bx[0] + bx[1]) / 2, CRADLE.benchY + CR.boardT / 2, 0], I, [(bx[1] - bx[0]) / 2, CR.boardT / 2, CR.boardZ], BOARD));
    // rubber feet line (a darker lip at the board's base)
    const xs = CR_PROF.map((p) => p.x);
    // crossbar joining the two arches under the saddles
    const ybar = Math.max(...CR_PROF.map((p) => p.rib[p.rib.length - 1][0])) - 1.2;
    back.push(...cyl(c, [xs[0], ybar, 0], [xs[1], ybar, 0], 0.32, RIB, {n: 16, spec: 0.5}));
    for (const p of CR_PROF) {
      back.push(...crExtrude(c, p.x, CR.ribHalf, p.rib, -1, RIB, mix(RIB.deep, INK, 0.1)));
      back.push(...crExtrude(c, p.x, CRADLE.padW / 2, p.pad, -1, PAD, mix(PAD.deep, INK, 0.2)));
    }
  }
  if (layer !== 'back') {
    for (const p of CR_PROF) {
      front.push(...crExtrude(c, p.x, CR.ribHalf, p.rib, 1, RIB, mix(RIB.deep, INK, 0.1)));
      front.push(...crExtrude(c, p.x, CRADLE.padW / 2, p.pad, 1, PAD, mix(PAD.deep, INK, 0.2)));
    }
  }
  void yb;
  return (
    <g>
      <defs>{c.defs}</defs>
      {back}
      {front}
    </g>
  );
};
