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
// over), all strokes at constant screen width (vectorEffect non-scaling-stroke): INK_PX on every silhouette at every
// scale; only the toothed gear outlines thin a little (to >= 1.9 px) when a tooth is just a few px.
import React from 'react';
import {add3, Basis, bodyFrame, capsule2, cross3, dot3, facing, Frame, hull, len3, mul3, norm3, proj, rotZ, smoothOpen, SP, sub3, V2, V3, xf, xfv} from '../three';
import {BODY, CRADLE, CRANK, GEARS, Gear, HINGE, LEVER, MOD, MOTOR, PLATE, Pose, SPAR, TOPBAR, WING_OUTLINE, WingFrame, wingPt} from '../rig';
import {C, INK, INK_PX, LINE_PX, NS} from './palette';
import {uid} from '../core/ids';
import {mix} from '../core/color';

export type MechLook = {
  /** gear B's angular speed (rad/s) at this frame: draws rotational motion blur on fast parts */
  rate?: number;
  /** optional emphasis (a soft warm rim/highlight on that part). 'motor' = the motor can and its pinion P0 together */
  focus?: 'P0' | 'A' | 'P1' | 'B' | 'rod' | 'motor' | null;
  /** 0..1: 0 = mid-distance simplification (opening cutaway at ~20 px/cm), 1 = close-up (60-120 px/cm) */
  detail?: number;
  alpha?: number;
};

// ------------------------------------------------------------------ local colours (palette C extended)
type Tone = {lit: string; base: string; deep: string};
const BRASS: Tone = {lit: C.brassLit, base: C.brass, deep: mix(C.brass, C.brassDeep, 0.72)};
const BRASS_SIDE = mix(C.brassDeep, INK, 0.12);
const STEEL: Tone = {lit: C.steelLit, base: C.steel, deep: C.steelDeep};
/** the hardened-steel pinions: brighter than any steel around them */
const PINION: Tone = {lit: '#FAFCFD', base: '#CAD3DA', deep: '#66737E'};
const PINION_SIDE = mix(C.steelDeep, INK, 0.3);
/** the back gear plane (A and P0, behind B and P1): one step darker and less saturated, so the two planes separate */
const BRASS_BACK: Tone = {lit: mix(C.brassLit, '#C9B88E', 0.4), base: mix(C.brass, '#8F7E58', 0.36), deep: mix(BRASS.deep, INK, 0.2)};
const BRASS_SIDE_BACK = mix(BRASS_SIDE, INK, 0.18);
const PINION_BACK: Tone = {lit: '#E8EDF0', base: '#AEB9C2', deep: '#55626D'};
const PINION_SIDE_BACK = mix(PINION_SIDE, INK, 0.15);
/** the connecting rods: pale bright steel (a strong value contrast with the navy plate behind them, and a navy ink
 *  contour against the cream shell); the far rod one step darker (it lies behind the near one) */
const ROD: Tone = {lit: '#FFFFFF', base: '#D3DCE2', deep: '#73828E'};
const ROD_FAR: Tone = {lit: '#EEF2F5', base: '#B9C4CC', deep: '#5B6874'};
const PLATE_T: Tone = {lit: C.plateLit, base: C.plate, deep: mix(C.plate, INK, 0.4)};
const PLATE_SIDE = mix(C.plate, INK, 0.55);
const CARBON: Tone = {lit: '#69737D', base: C.carbon, deep: '#121518'};
const DARK: Tone = {lit: C.darkLit, base: C.dark, deep: mix(C.dark, INK, 0.45)};
const CAN: Tone = {lit: C.steelLit, base: C.motor, deep: C.steelDeep};
const BAND: Tone = {lit: '#6FA6D6', base: C.motorBand, deep: '#1B456C'};
const CAP: Tone = {lit: '#737B83', base: C.motorCap, deep: '#1E2226'};
const COPPER: Tone = {lit: '#F2B07A', base: C.copper, deep: '#87461F'};
/** the motor's steel front end (shaft side): pressed steel, a step darker than the can's side; its bearing boss is
 *  lighter, the sintered bronze bushing in it warm */
const MFACE: Tone = {lit: '#D5DCE1', base: mix(C.steel, C.steelDeep, 0.5), deep: mix(C.steelDeep, INK, 0.35)};
const BOSS: Tone = {lit: '#F4F7F9', base: '#BAC5CD', deep: '#5F6D78'};
const BRONZE: Tone = {lit: '#E9C08A', base: '#B7864D', deep: '#6E4B22'};
const SLOT_D = '#1A1F24';
/** the white nylon 2-pin connector the motor leads plug into */
const NYLON: Tone = {lit: '#FFFDF8', base: '#E4DDCD', deep: '#A69C88'};
/** focus emphasis: a saturated warm rim just outside the ink, under a soft pale halo */
const GLOW = '#FFC45E';
const RIM = '#E8962E';
// the cradle
const BOARD: Tone = {lit: '#F6F8F9', base: '#DDE4E8', deep: '#A2B0B9'};
const RIB: Tone = {lit: '#F4F7F9', base: '#C3CCD3', deep: '#77858F'};
const PAD: Tone = {lit: '#7E8B96', base: '#58656F', deep: '#353F48'};

/** direction TOWARD the key light in screen space (y down): upper left */
const LS: V2 = {x: -0.62, y: -0.78};
const SHUTTER = 0.5 / 30; // a 180 degree shutter at 30 fps (s)
/** sweep per exposure (in tooth pitches) over which a gear crossfades from crisp inked copies to a smeared tooth band.
 *  A 180 degree shutter turns the gear twice this far per frame: near 0.5 pitch per exposure crisp teeth would step
 *  ~1 pitch per frame and seem to stand still or creep backwards (wagon wheel), so by then the teeth are half smeared
 *  (the film's slow-motion close drive runs P0 and A at 0.46: soft teeth over a band, the marker carrying the motion). */
const SMEAR: [number, number] = [0.36, 0.56];

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
const f1 = (n: number) => n.toFixed(1);
/** a polygon path at 0.1 px precision (keeps the many-point gear paths light) */
const poly = (pts: V2[], close = true) => (pts.length ? `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}${close ? 'Z' : ''}` : '');
const dOf = (rings: V2[][]) => rings.map((r) => poly(r)).join(' ');
/** detail features fade in over a 0.1 band of `detail` (no single-frame pops during push-ins) */
const fade = (c: Ctx, th: number) => clamp((c.det - th) / 0.1);
const faded = (c: Ctx, a: number, els: El[]): El[] => (a <= 0.005 || !els.length ? [] : a >= 0.995 ? els : [<g key={key(c)} opacity={f2(a)}>{els}</g>]);

const makeCtx = (B: Basis, F: Frame, detail: number | undefined, probe: V3): Ctx => {
  const s0 = proj(B, xf(F, probe)).s;
  const L3 = norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.72)), mul3(B.fw, -0.45)));
  return {B, F, defs: [], ink: INK_PX, line: LINE_PX, det: detail ?? clamp((s0 - 16) / 40), s0, L3, k: 0};
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
const fillP = (c: Ctx, d: string, fill: string, op = 1) => <path key={key(c)} d={d} fill={fill} fillRule="evenodd" opacity={op < 1 ? f2(op) : undefined} />;
const lineP = (c: Ctx, d: string, w: number, col = INK, op = 1) => (
  <path key={key(c)} d={d} fill="none" stroke={col} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} opacity={op} />
);
/** the focus emphasis: a saturated warm rim just outside the parts' ink, under a soft pale halo. Masked to the outside
 *  of the silhouettes, so it never tints a part's face, a gear's windows or a smeared tooth band. Drawn before (under)
 *  the focused parts; anything nearer the camera that is drawn later covers it. */
const glowPass = (c: Ctx, ds: string[], amt: number): El[] => {
  if (amt <= 0.01 || !ds.length) return [];
  const id = uid('mgl');
  const BIG = {x: -4000, y: -4000, width: 9000, height: 9000};
  c.defs.push(
    <mask key={id} id={id} maskUnits="userSpaceOnUse" {...BIG}>
      <rect {...BIG} fill="#FFFFFF" />
      {ds.map((d, i) => <path key={i} d={d} fill="#000000" />)}
    </mask>,
  );
  const ring = (w: number, col: string, op: number) => (
    <g key={key(c)} opacity={f2(op * amt)}>
      {ds.map((d, i) => <path key={i} d={d} fill="none" stroke={col} strokeWidth={f2(2 * w)} strokeLinejoin="round" vectorEffect={NS} />)}
    </g>
  );
  return [
    <g key={key(c)} mask={`url(#${id})`}>
      {ring(c.ink + 17, GLOW, 0.2)}
      {ring(c.ink + 9.5, GLOW, 0.32)}
      {ring(c.ink + 3.6, RIM, 0.88)}
    </g>,
  ];
};

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
const X3: V3 = [1, 0, 0], Y3: V3 = [0, 1, 0];

/** a flat disc facing +z (body-local) at o: an end face drawn on its own */
const disc = (c: Ctx, o: V3, r: number, t: Tone, n = 24, lineOp = 0.85): El[] => {
  const rim = ring3(c, o, X3, Y3, r, n);
  const bb = bbox(rim);
  return [<path key={key(c)} d={poly(rim)} fill={litGrad(c, bb.m, bb.R, t, 0.5)} stroke={INK} strokeWidth={c.line} strokeOpacity={lineOp} strokeLinejoin="round" vectorEffect={NS} />];
};
/** a socket-head screw seen on a face lying in the body's xy plane */
const screw = (c: Ctx, o: V3, r = 0.17): El[] => {
  const hd = ring3(c, o, X3, Y3, r, 14);
  const bb = bbox(hd);
  return [
    <path key={key(c)} d={poly(hd)} fill={litGrad(c, bb.m, bb.R, STEEL, 0.5)} stroke={INK} strokeWidth={c.line} vectorEffect={NS} />,
    <path key={key(c)} d={poly(ring3(c, add3(o, [0, 0, 0.01]), X3, Y3, r * 0.44, 6))} fill={C.dark} />,
  ];
};

type CylOpt = {
  n?: number;
  /** opacity of the white specular streak */
  spec?: number;
  capTone?: Tone;
  /** which end caps may be drawn ('auto' = whichever faces the camera) */
  caps?: 'auto' | 'none' | 'a' | 'b';
  ink?: number;
  noUnder?: boolean;
  /** radius at b (a frustum: a tapered shank); default = r */
  r2?: number;
};
const cylRims = (c: Ctx, a: V3, b: V3, r: number, n: number, r2 = r) => {
  const d = norm3(sub3(b, a));
  const [e1, e2] = perpBasis(d);
  const ra: V2[] = [], rb: V2[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    const cs = Math.cos(th), sn = Math.sin(th);
    ra.push(pj(c, add3(a, add3(mul3(e1, r * cs), mul3(e2, r * sn)))));
    rb.push(pj(c, add3(b, add3(mul3(e1, r2 * cs), mul3(e2, r2 * sn)))));
  }
  return {d, ra, rb};
};
/** a cylinder's screen silhouette (hull of both rims) */
const cylSil = (c: Ctx, a: V3, b: V3, r: number, n = 18, r2 = r) => {
  const {ra, rb} = cylRims(c, a, b, r, n, r2);
  return poly(hull([...ra, ...rb]));
};
/** a solid cylinder between body-local points a and b: silhouette (hull of both rims), cross shading, visible cap */
const cyl = (c: Ctx, a: V3, b: V3, r: number, t: Tone, o: CylOpt = {}): El[] => {
  const out: El[] = [];
  if (len3(sub3(b, a)) < 1e-4) return out;
  const r2 = o.r2 ?? r;
  const {d, ra, rb} = cylRims(c, a, b, r, o.n ?? 20, r2);
  const sil = hull([...ra, ...rb]);
  const silD = poly(sil);
  const A = pj(c, a), Bp = pj(c, b);
  const w = ((r + r2) * (A.s + Bp.s)) / 4;
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
  // specular streak along the lit side (fades out on thin or end-on cylinders instead of popping)
  const sp = (o.spec ?? 0.55) * clamp((w - 1.6) / 1.2) * clamp((L / Math.max(w, 1e-3) - 1.2) / 0.5);
  if (sp > 0.01) {
    const u = {x: ax.x / L, y: ax.y / L};
    const inset = Math.min(L * 0.25, w * 0.6);
    const p0 = {x: A.x + nx.x * w * 0.5 + u.x * inset, y: A.y + nx.y * w * 0.5 + u.y * inset};
    const p1 = {x: Bp.x + nx.x * w * 0.5 - u.x * inset, y: Bp.y + nx.y * w * 0.5 - u.y * inset};
    out.push(lineP(c, `M${f2(p0.x)},${f2(p0.y)} L${f2(p1.x)},${f2(p1.y)}`, clamp(w * 0.2, 0.8, 4), '#FFFFFF', sp));
  }
  return out;
};

/** a box: centre o, unit axes (body-local), half extents h; visible faces shaded by the key light */
const box = (c: Ctx, o: V3, ax: [V3, V3, V3], h: V3, t: Tone, o2: {edge?: number} = {}): El[] => {
  const out: El[] = [];
  const corner = (sx: number, sy: number, sz: number): V3 => add3(o, add3(add3(mul3(ax[0], sx * h[0]), mul3(ax[1], sy * h[1])), mul3(ax[2], sz * h[2])));
  const P: Record<string, V2> = {};
  const S = [-1, 1];
  for (const sx of S) for (const sy of S) for (const sz of S) P[`${sx}${sy}${sz}`] = pj(c, corner(sx, sy, sz));
  out.push(under(c, poly(hull(Object.values(P)))));
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
  t: {
    face: string; side: string; ink?: number; line?: number; maxSlices?: number; inkOp?: number;
    /** a sub-frame blur copy: face only (the side band comes from the first copy) */
    copy?: boolean;
    faceOp?: number; sideOp?: number;
    /** side band only (no face, no face ink) */
    noFace?: boolean;
  },
) => {
  const p0 = pj(c, probe[0]), p1 = pj(c, probe[1]);
  const dpx = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const maxS = t.maxSlices ?? 1 + Math.round(2 * c.det);
  const nS = t.copy || dpx < 0.4 ? 0 : Math.max(1, Math.min(maxS, Math.ceil(dpx / 2)));
  const ring2 = (u: number) => dOf(ringsAt(u).map((r) => r.map((p) => pj(c, p))));
  const inkOp = t.inkOp ?? 1;
  const sideOp = t.sideOp ?? 1;
  const sides: El[] = [];
  for (let i = nS; i >= 1; i--) {
    const d = ring2(i / nS);
    // ink under the hidden face only: the slices between fill the band, the face's own underlay closes the contour
    if (i === nS && inkOp > 0.005) L.under.push(under(c, d, t.ink, inkOp));
    sides.push(fillP(c, d, t.side));
  }
  if (sides.length && sideOp > 0.005) L.side.push(sideOp >= 0.995 ? sides : <g key={key(c)} opacity={f2(sideOp)}>{sides}</g>);
  if (t.noFace) return '';
  const faceD = ring2(0);
  if (inkOp > 0.005) L.under.push(under(c, faceD, t.ink, inkOp));
  const fo = t.faceOp ?? 1;
  if (fo > 0.005)
    L.face.push(
      <path key={key(c)} d={faceD} fill={t.face} fillRule="evenodd" stroke={INK} strokeWidth={t.line ?? c.line} strokeOpacity={0.9} strokeLinejoin="round" vectorEffect={NS} opacity={fo < 0.995 ? f2(fo) : undefined} />,
    );
  return faceD;
};

/** an exact extrusion of a planar profile (body-local, closed) along E: the swept region is the union of the two end
 *  caps and one quad per profile edge, all wound alike; one ink underlay of that union, then the camera-facing side
 *  strips shaded by their normals (far first), then the visible end cap. */
const shoelace = (q: V2[]) => {
  let a = 0;
  for (let i = 0; i < q.length; i++) {
    const u = q[i], v = q[(i + 1) % q.length];
    a += u.x * v.y - v.x * u.y;
  }
  return a;
};
const wound = (q: V2[]) => (shoelace(q) >= 0 ? q : [...q].reverse());
const sweepRegion = (c: Ctx, prof: V3[], E: V3) => {
  const n = prof.length;
  const P0 = prof.map((p) => pj(c, p)), P1 = prof.map((p) => pj(c, add3(p, E)));
  const subs = [poly(wound(P0)), poly(wound(P1))];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    subs.push(poly(wound([P0[i], P0[j], P1[j], P1[i]])));
  }
  return {d: subs.join(' '), P0, P1};
};
/** o.grade: shade each side strip along the extrusion (lighter at the profile end, deeper toward the far end) */
const sweep = (c: Ctx, prof: V3[], E: V3, t: Tone, o: {face?: string; grade?: number} = {}): El[] => {
  const out: El[] = [];
  const {d, P0, P1} = sweepRegion(c, prof, E);
  out.push(<path key={key(c)} d={d} fill={INK} stroke={INK} strokeWidth={2 * c.ink} strokeLinejoin="round" vectorEffect={NS} />);
  out.push(<path key={key(c)} d={d} fill={t.deep} />);
  const np = norm3(E);
  let A = 0;
  for (let i = 1; i < prof.length - 1; i++) A += dot3(cross3(sub3(prof[i], prof[0]), sub3(prof[i + 1], prof[0])), np);
  const strips: {z: number; q: V2[]; col: string}[] = [];
  for (let i = 0; i < prof.length; i++) {
    const j = (i + 1) % prof.length;
    const dd = sub3(prof[j], prof[i]);
    if (len3(dd) < 1e-6) continue;
    const nOut = norm3(A > 0 ? cross3(dd, np) : cross3(np, dd));
    const ctr = add3(mul3(add3(prof[i], prof[j]), 0.5), mul3(E, 0.5));
    const nw = xfv(c.F, nOut);
    if (facing(c.B, xf(c.F, ctr), nw) <= 0) continue;
    const lv = dot3(nw, c.L3);
    const col = lv > 0 ? mix(t.base, t.lit, clamp(lv * 1.2)) : mix(t.base, t.deep, clamp(-lv * 1.1));
    strips.push({z: pj(c, ctr).z, q: [P0[i], P0[j], P1[j], P1[i]], col});
  }
  strips.sort((a, b) => b.z - a.z);
  for (const st of strips) {
    let fill = st.col;
    // graded: the broad strips only (the narrow fillet strips stay flat)
    if (o.grade && Math.hypot(st.q[1].x - st.q[0].x, st.q[1].y - st.q[0].y) > 6) {
      const a = {x: (st.q[0].x + st.q[1].x) / 2, y: (st.q[0].y + st.q[1].y) / 2}, b = {x: (st.q[2].x + st.q[3].x) / 2, y: (st.q[2].y + st.q[3].y) / 2};
      if (Math.hypot(b.x - a.x, b.y - a.y) > 2) fill = lin(c, a, b, [[0, mix(st.col, t.lit, o.grade)], [1, mix(st.col, t.deep, o.grade)]]);
    }
    out.push(<path key={key(c)} d={poly(st.q)} fill={fill} stroke={st.col} strokeWidth={0.8} strokeLinejoin="round" />);
  }
  const cen = prof.reduce((a, p) => add3(a, mul3(p, 1 / prof.length)), [0, 0, 0] as V3);
  const capFar = facing(c.B, xf(c.F, add3(cen, E)), xfv(c.F, np)) > 0;
  const cap = capFar ? P1 : P0;
  const bb = bbox(cap);
  out.push(<path key={key(c)} d={poly(cap)} fill={o.face ?? litGrad(c, bb.m, bb.R, t, 0.5)} stroke={INK} strokeWidth={c.line} strokeOpacity={0.85} strokeLinejoin="round" vectorEffect={NS} />);
  return out;
};

// ------------------------------------------------------------------ gear geometry (body-local, exported for checks)
/** tooth profile: [radial offset from the pitch circle in modules, half-width as a fraction of the angular pitch] */
// (checked numerically over a full crank turn: meshing outlines never overlap; the pitch-circle backlash is ~12%)
const TOOTH_FULL: [number, number][] = [[-1.25, 0.34], [-1.0, 0.3], [-0.6, 0.255], [0, 0.22], [0.5, 0.175], [0.82, 0.138], [1.0, 0.095]];
const TOOTH_MED: [number, number][] = [[-1.25, 0.34], [-0.6, 0.255], [0, 0.22], [0.6, 0.165], [1.0, 0.095]];
const TOOTH_LOW: [number, number][] = [[-1.25, 0.3], [-0.4, 0.245], [0.55, 0.17], [1.0, 0.105]];
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
const bWindows = (ang: number): [number, number][][] => {
  const G = GEARS.B;
  const out: [number, number][][] = [];
  const pin: [number, number] = [G.c[0] + CRANK.rc * Math.cos(ang), G.c[1] + CRANK.rc * Math.sin(ang)];
  const {hw, rIn, rOut} = B_SPOKE;
  for (let k = 0; k < 5; k++) {
    const a0 = ang + (k * 2 * Math.PI) / 5, a1 = ang + ((k + 1) * 2 * Math.PI) / 5;
    const pts: [number, number][] = [];
    const No = 5, Ni = 3;
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
    r = chaikin(r, 1);
    out.push(r);
  }
  return out;
};
/** A: four round lightening holes */
const A_HOLES = {r: 0.69, hr: 0.22};
const gearHoles = (G: Gear, ang: number): [number, number][][] => {
  if (G.id === 'B') return bWindows(ang);
  if (G.id === 'A') return [0, 1, 2, 3].map((k) => {
    const a = ang + Math.PI / 4 + (k * Math.PI) / 2;
    return circ2(G.c[0] + A_HOLES.r * Math.cos(a), G.c[1] + A_HOLES.r * Math.sin(a), A_HOLES.hr, 14);
  });
  return [];
};
/** where each gear's single accent marker sits (radius from the axle; angle offset from the gear's angle) */
const MARK: Record<Gear['id'], {r: number; da: number; size: number} | null> = {
  P0: {r: 0.4, da: 0, size: 0.11},
  A: {r: 1.1, da: 0, size: 0.1},
  P1: null,
  B: {r: 1.73, da: Math.PI, size: 0.12},
};
/** the markers never shrink below this screen radius (px), so rotation still reads at phone size */
const MARK_MIN_PX = 5;
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
/** boolean of a polygon (clockwise, y up) with a circle whose boundary it crosses twice: 'union' adds the disc,
 *  'cut' removes it */
const circleOp = (pts: P2t[], c: P2t, R: number, mode: 'union' | 'cut', n = 28): P2t[] => {
  const inside = (p: P2t) => Math.hypot(p[0] - c[0], p[1] - c[1]) < R;
  const N = pts.length;
  let ein: {i: number; p: P2t} | null = null, eout: {i: number; p: P2t} | null = null;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N];
    const dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - c[0], fy = a[1] - c[1];
    const A = dx * dx + dy * dy, Bq = 2 * (fx * dx + fy * dy), Cq = fx * fx + fy * fy - R * R;
    const disc = Bq * Bq - 4 * A * Cq;
    if (disc <= 0) continue;
    const t0 = (-Bq - Math.sqrt(disc)) / (2 * A), t1 = (-Bq + Math.sqrt(disc)) / (2 * A);
    if (t0 > 0 && t0 < 1 && !inside(a)) ein = {i, p: [a[0] + dx * t0, a[1] + dy * t0]};
    if (t1 > 0 && t1 < 1 && !inside(b)) eout = {i, p: [a[0] + dx * t1, a[1] + dy * t1]};
  }
  if (!ein || !eout) return pts;
  const out: P2t[] = [eout.p];
  for (let k = (eout.i + 1) % N; ; k = (k + 1) % N) {
    out.push(pts[k]);
    if (k === ein.i) break;
  }
  out.push(ein.p);
  const aIn = Math.atan2(ein.p[1] - c[1], ein.p[0] - c[0]);
  let aOut = Math.atan2(eout.p[1] - c[1], eout.p[0] - c[0]);
  if (mode === 'union') while (aOut > aIn) aOut -= Math.PI * 2; // clockwise, around the outside
  else while (aOut < aIn) aOut += Math.PI * 2; // counter-clockwise, through the inside
  const m = Math.max(2, Math.round((Math.abs(aIn - aOut) / (Math.PI * 2)) * n));
  for (let i = 1; i < m; i++) {
    const a = lerp(aIn, aOut, i / m);
    out.push([c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]);
  }
  return out;
};
/** the slot through the plate's top edge that clears the far rod and the far spar (they pass behind the plate) */
const SLOT = {x0: 1.8, x1: 3.2, yb: 2.0};
/** the motor bore (rig.ts PLATE.holes, the one on the motor axis) opens the plate's lower edge as a notch; the motor's
 *  face is bolted behind two ears that reach into it, so the can, its band, end cap and terminals stay in view */
const BORE = PLATE.holes.reduce((a, h) => (Math.hypot(h.c[0] - MOTOR.c[0], h.c[1] - MOTOR.c[1]) < Math.hypot(a.c[0] - MOTOR.c[0], a.c[1] - MOTOR.c[1]) ? h : a));
export const EARS: P2t[] = [50, 130].map((d) => [MOTOR.c[0] + 1.2 * Math.cos((d * Math.PI) / 180), MOTOR.c[1] + 1.2 * Math.sin((d * Math.PI) / 180)]);
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
  let r = circleOp(pts, BORE.c, BORE.r, 'cut');
  for (const e of EARS) r = circleOp(r, e, 0.42, 'union', 20);
  return fillet(r, 0.3);
})();
const PLATE_HOLES: P2t[][] = PLATE.holes.filter((h) => h !== BORE).map((h) => circ2(h.c[0], h.c[1], h.r, h.r > 1.2 ? 30 : 22));
const PLATE_BACK = PLATE.z - PLATE.th;
/** top-bar brackets: one block at each end of the hinge axes, jutting from the plate; the hinge pins span them */
const BRACKET = {y0: 4.0, y1: 5.15, w: 0.9, fillet: 0.16};
const KNUCKLE = {hw: 0.62, r: 0.4};
/** rod-end eyes: radius, half-length along their pin */
const EYE = {r: 0.36, hl: 0.13};
/** how far the spars are drawn (cm from the hinge). The far spar stops short: it is drawn over the far wing (which the
 *  Bird draws before the mechanism). The near spar runs on inside the near wing (which the Bird draws over the
 *  mechanism), so it shows only through the phantom wing over the cutaway: the rod -> spar -> wing chain reads. It ends
 *  where the wing's leading edge still covers it (the leading edge reaches the spar line at a ~ 27 cm). */
const SPAR_FAR = 6;
const SPAR_NEAR = 22;

// ------------------------------------------------------------------ the motor leads: terminal tabs on the end cap -> up
// behind the plate's lower right corner -> along -x behind the plate -> round its lower-left edge into a 2-pin
// connector clipped to the plate. Nothing ends in mid-air, and the leads never pass near the pinion.
const TERM = [8, -28].map((deg) => (deg * Math.PI) / 180); // the cap's right side: in view from every film camera (yaw > 0)
const termPt = (a: number, r: number, z = -4.98): V3 => [MOTOR.c[0] + r * Math.cos(a), MOTOR.c[1] + r * Math.sin(a), z];
const WIRE_R = 0.1;
/** the connector: centred on the plate's lower-left edge, on its front face, overhanging the edge a little */
const CONN = (() => {
  const a: P2t = [0.2, -2.6], b: P2t = [-2.6, -0.8]; // rig.ts PLATE.outline's lower-left edge
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: V3 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, 0];
  const n: V3 = [u[1], -u[0], 0]; // into the plate
  const t = 0.36;
  const h: V3 = [0.36, 0.19, 0.16];
  const o: V3 = [a[0] + (b[0] - a[0]) * t + n[0] * 0.05, a[1] + (b[1] - a[1]) * t + n[1] * 0.05, PLATE.z + h[2]];
  return {o, u, n, h, ax: [u, n, [0, 0, 1]] as [V3, V3, V3]};
})();
/** a lead's tail: from below the plate edge (behind it) forward and up into the connector's underside */
const connTail = (s: number): V3[] => {
  const e = add3(CONN.o, add3(mul3(CONN.n, -CONN.h[1]), mul3(CONN.u, s * 0.14)));
  return [add3(add3(e, mul3(CONN.n, -0.55)), [0, 0, -2.72 - e[2]]), add3(e, mul3(CONN.n, -0.22)), e];
};
const WIRES: {col: Tone; pts: V3[]; tail: number}[] = [
  {
    col: {lit: '#F08A7C', base: C.wireRed, deep: '#7E2620'},
    pts: [termPt(TERM[0], 1.6), termPt(TERM[0], 1.95, -5.1), [6.55, -3.3, -4.7], [6.1, -2.35, -3.95], [4.2, -2.05, -3.7], [2.0, -2.15, -3.5], [0.55, -2.3, -3.2], ...connTail(1)],
    tail: 2,
  },
  {
    col: {lit: '#5E6670', base: C.wireBlack, deep: '#0E1012'},
    pts: [termPt(TERM[1], 1.6), termPt(TERM[1], 1.95, -5.1), [6.85, -3.45, -4.45], [6.35, -2.5, -3.75], [4.2, -2.3, -3.85], [2.0, -2.4, -3.65], [0.75, -2.48, -3.35], ...connTail(-1)],
    tail: 2,
  },
];

// ------------------------------------------------------------------ part drawers
const gearRings3 = (G: Gear, ang: number, z: number, prof: [number, number][]): V3[][] =>
  [gearOutline(G, ang, prof), ...gearHoles(G, ang)].map((r) => r.map(([x, y]) => [x, y, z] as V3));

/** the face details drawn once per gear (rim line, gloss, hub, accent marker with its blur trail) */
const gearTop = (c: Ctx, G: Gear, ang: number, sweep: number): El[] => {
  const out: El[] = [];
  const front = facing(c.B, xf(c.F, [G.c[0], G.c[1], G.z1]), xfv(c.F, [0, 0, 1])) > 0;
  const zf = front ? G.z1 : G.z0;
  const o: V3 = [G.c[0], G.c[1], zf];
  const ctr = pj(c, o);
  const brass = G.id === 'A' || G.id === 'B';
  const rRoot = G.r - 1.25 * MOD;
  // rim line (where the web meets the toothed rim)
  const rimA = fade(c, 0.3) * clamp((ctr.s * G.r - 30) / 12);
  if (rimA > 0.005) out.push(lineP(c, poly(ring3(c, o, X3, Y3, rRoot * 0.94, 40)), c.line * 0.7, brass ? C.brassDeep : C.steelDeep, 0.5 * rimA));
  // gloss: a white arc on the upper-left inside the rim (fixed to the light, not to the gear)
  const gl = ring3(c, o, X3, Y3, rRoot * (G.n > 10 ? 0.86 : 0.74), 10, (100 * Math.PI) / 180, (165 * Math.PI) / 180, false);
  out.push(<path key={key(c)} d={smoothOpen(gl)} fill="none" stroke="#FFFFFF" strokeWidth={clamp(0.035 * ctr.s, 1, 4.5)} strokeLinecap="round" vectorEffect={NS} opacity={0.6} />);
  // hub boss
  const hubR = HUB[G.id];
  if (G.id !== 'A') {
    out.push(...cyl(c, o, [o[0], o[1], zf + 0.07], hubR, brass ? BRASS : PINION, {n: 22, spec: 0}));
    // axle end with a retaining clip
    const axR = G.id === 'P0' ? MOTOR.shaftR : 0.17;
    out.push(...cyl(c, [o[0], o[1], zf + 0.07], [o[0], o[1], zf + 0.13], axR, STEEL, {n: 16, spec: 0, ink: c.line}));
    if (G.id !== 'P0') {
      const clip = ring3(c, [o[0], o[1], zf + 0.08], X3, Y3, axR + 0.07, 18, 0.5, Math.PI * 2 - 0.5, false);
      out.push(...faded(c, fade(c, 0.45), [lineP(c, poly(clip, false), clamp(0.05 * ctr.s, 1, 3), C.dark, 0.9)]));
    } else {
      // set screw on the pinion hub
      const ss = pj(c, [o[0] + hubR * Math.cos(ang + 2.2) * 0.98, o[1] + hubR * Math.sin(ang + 2.2) * 0.98, zf + 0.035]);
      out.push(...faded(c, fade(c, 0.45), [<circle key={key(c)} cx={f2(ss.x)} cy={f2(ss.y)} r={f2(clamp(0.045 * ss.s, 0.8, 3))} fill={C.dark} />]));
    }
  }
  // the single accent marker (with a short trail when the gear blurs)
  const mk = MARK[G.id];
  if (mk) {
    const sz = Math.max(mk.size, MARK_MIN_PX / Math.max(1, ctr.s));
    // inside the root circle, but never pulled onto the axle: at the size floor it may overlap the tooth roots
    const mr = Math.max(Math.min(mk.r, rRoot - sz - 0.02), Math.min(mk.r, HUB[G.id] + 0.3 * sz));
    const a = ang + mk.da;
    const mc: V3 = [G.c[0] + mr * Math.cos(a), G.c[1] + mr * Math.sin(a), zf + 0.005];
    if (Math.abs(sweep) > 0.05) {
      const tr = ring3(c, [G.c[0], G.c[1], zf + 0.005], X3, Y3, mr, 12, a - sweep / 2, a + sweep / 2, false);
      out.push(<path key={key(c)} d={poly(tr, false)} fill="none" stroke={C.accent} strokeWidth={f2(sz * 2 * ctr.s * 0.85)} strokeLinecap="round" opacity={0.42} vectorEffect={NS} />);
    }
    const dot = ring3(c, mc, X3, Y3, sz, 14);
    out.push(<path key={key(c)} d={poly(dot)} fill={C.accent} stroke={INK} strokeWidth={c.line} strokeLinejoin="round" vectorEffect={NS} />);
    const gA = clamp((ctr.s * mk.size - MARK_MIN_PX) / 2);
    if (gA > 0.01) {
      const g = pj(c, [mc[0] - sz * 0.35, mc[1] + sz * 0.35, mc[2]]);
      out.push(<circle key={key(c)} cx={f2(g.x)} cy={f2(g.y)} r={f2(sz * ctr.s * 0.28)} fill="#FFFFFF" opacity={f2(0.75 * gA)} />);
    }
  }
  return out;
};

/** a group of coplanar meshing gears, with rotational motion blur: sub-frame copies over a 180 degree shutter. A gear
 *  whose teeth sweep more than SMEAR per exposure crossfades into a smear: a toothless thickness band (the circle at
 *  r + MOD/2, extruded), the web (inside the root circle, with its holes or spokes, still blurred by the copies), and
 *  a translucent tooth band from root to tip; the marker keeps a short trail. */
const gearGroup = (c: Ctx, ids: Gear['id'][], ps: Pose, rate: number, focus: MechLook['focus']): El[] => {
  const omega: Record<Gear['id'], number> = {B: rate, P1: -3 * rate, A: -3 * rate, P0: 6 * rate};
  const gs = ids.map((id) => {
    const G = GEARS[id];
    const swRad = Math.abs(omega[id]) * SHUTTER;
    const sw = swRad / ((2 * Math.PI) / G.n);
    const front = facing(c.B, xf(c.F, [G.c[0], G.c[1], G.z1]), xfv(c.F, [0, 0, 1])) > 0;
    const zf = front ? G.z1 : G.z0, zb = front ? G.z0 : G.z1;
    const ctr: SP = pj(c, [G.c[0], G.c[1], zf]);
    const toothPx = MOD * ctr.s;
    const brass = id === 'A' || id === 'B';
    return {
      id, G, swRad, sw, zf, zb, brass,
      sm: clamp((sw - SMEAR[0]) / (SMEAR[1] - SMEAR[0])),
      prof: toothPx < 5 ? TOOTH_LOW : toothPx < 9 ? TOOTH_MED : TOOTH_FULL,
      face: litGrad(c, ctr, (G.r + MOD) * ctr.s * 1.05, brass ? BRASS : PINION, 0.45),
      side: brass ? BRASS_SIDE : PINION_SIDE,
      // the toothed outlines thin a little when a tooth is only a few px (floor 1.9 px)
      gInk: lerp(1.9, INK_PX, clamp((toothPx - 2.5) / 5)),
      probe: [[G.c[0], G.c[1], zf], [G.c[0], G.c[1], zb]] as [V3, V3],
    };
  });
  // copies: crisp teeth need one every ~0.18 pitch; the brass webs' holes and spokes one every ~0.09 rad
  let K = 1;
  for (const g of gs) {
    if (g.sm < 1) K = Math.max(K, Math.ceil(g.sw / 0.18));
    if (g.brass) K = Math.max(K, Math.ceil(g.swRad / 0.09));
  }
  K = Math.min(K, 2 + Math.round(4 * c.det));
  const z3 = (r: [number, number][], z: number) => r.map(([x, y]) => pj(c, [x, y, z]));
  const out: El[] = [];
  const fg = gs.find((g) => g.id === focus);
  if (fg) {
    // the rim follows the teeth only while they are crisp; a blurred gear gets a clean circle at its tips
    const ring = fg.sm > 0 || fg.sw > 0.18 ? circ2(fg.G.c[0], fg.G.c[1], fg.G.r + 0.95 * MOD, 48) : gearOutline(fg.G, ps.gear[fg.id], fg.prof);
    out.push(...glowPass(c, [poly(z3(ring, fg.zf)), poly(z3(ring, fg.zb))], 1));
  }
  // the smear band of a blurred gear sits UNDER the fading crisp copies at a strength that never dips during the
  // crossfade, so a half-blurred gear reads as a solid part with a soft rim instead of a see-through ghost
  const smearK = (sm: number) => Math.min(1, 2 * sm);
  for (const g of gs) {
    if (g.sm <= 0) continue;
    const G = g.G;
    const C3 = (r: number) => poly(z3(circ2(G.c[0], G.c[1], r, 48), g.zf));
    const tipD = C3(G.r + MOD), midD = C3(G.r + 0.5 * MOD), rootD = C3(G.r - 1.25 * MOD);
    out.push(<path key={key(c)} d={`${midD} ${rootD}`} fill={g.face} fillRule="evenodd" opacity={f2(0.82 * smearK(g.sm))} />);
    out.push(<path key={key(c)} d={`${tipD} ${midD}`} fill={g.face} fillRule="evenodd" opacity={f2(0.38 * smearK(g.sm))} />);
  }
  for (let i = 0; i < K; i++) {
    const L = layers();
    const dt = K === 1 ? 0 : (i / (K - 1) - 0.5) * SHUTTER;
    for (const g of gs) {
      const G = g.G;
      const a = ps.gear[g.id] + omega[g.id] * dt;
      if (g.sm > 0) {
        if (i === 0) {
          const rs = G.r + 0.5 * MOD;
          slab(c, L, (u) => [circ2(G.c[0], G.c[1], rs, 40).map(([x, y]) => [x, y, lerp(g.zf, g.zb, u)] as V3)], g.probe, {
            face: '', side: g.side, ink: g.gInk, inkOp: 0.5 * g.sm, sideOp: g.sm, noFace: true, maxSlices: 2,
          });
        }
        const holes = gearHoles(G, a).map((r) => z3(r, g.zf));
        L.face.push(fillP(c, dOf([z3(circ2(G.c[0], G.c[1], G.r - 1.25 * MOD, 40), g.zf), ...holes]), g.face));
        if (holes.length) L.face.push(lineP(c, dOf(holes), c.line, INK, 0.9 * g.sm));
      }
      if (g.sm < 1) {
        slab(c, L, (u) => gearRings3(G, a, lerp(g.zf, g.zb, u), g.prof), g.probe, {
          face: g.face, side: g.side, ink: g.gInk, inkOp: (i === 0 ? 1 : g.sm > 0 ? 0 : 0.3) * (1 - g.sm), faceOp: 1 - g.sm, sideOp: 1 - g.sm, copy: i > 0,
          ...(i > 0 && g.sm > 0 ? {line: 0} : {}),
        });
      }
    }
    // equal-weight accumulation: copy i drawn at 1/(i+1) over the running average
    out.push(<g key={key(c)} opacity={K === 1 ? undefined : f2(1 / (i + 1))}>{flat(L)}</g>);
  }
  for (const g of gs) {
    if (g.sm <= 0) continue;
    const G = g.G;
    const C3 = (r: number) => poly(z3(circ2(G.c[0], G.c[1], r, 48), g.zf));
    const tipD = C3(G.r + MOD), rootD = C3(G.r - 1.25 * MOD);
    out.push(lineP(c, tipD, g.gInk * 0.8, INK, 0.5 * g.sm));
    out.push(lineP(c, rootD, c.line * 0.8, INK, 0.3 * g.sm));
  }
  for (const g of gs) out.push(...gearTop(c, g.G, ps.gear[g.id], omega[g.id] * SHUTTER));
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
  const shA = fade(c, 0.2);
  if (shA > 0.005) {
    const id = uid('mclip');
    c.defs.push(<clipPath key={id} id={id}><path d={dOf([pts, ...PLATE_HOLES.map((h) => h.map(([x, y]) => pj(c, [x, y, zf])))])} clipRule="evenodd" /></clipPath>);
    const a = pj(c, [-1.2, 4.6, zf]), b = pj(c, [3.5, -2.6, zf]);
    out.push(
      <g key={key(c)} clipPath={`url(#${id})`} opacity={shA < 0.995 ? f2(shA) : undefined}>
        <path d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke="#FFFFFF" strokeWidth={f2(0.9 * a.s)} opacity={0.07} strokeLinecap="round" />
        <path d={`M${f2(a.x + 1.4 * a.s)},${f2(a.y)} L${f2(b.x + 1.4 * a.s)},${f2(b.y)}`} stroke="#FFFFFF" strokeWidth={f2(0.3 * a.s)} opacity={0.06} strokeLinecap="round" />
      </g>,
    );
  }
  // screws (socket heads), including the two that hold the motor's face to the ears
  const screws: P2t[] = [[-1.4, 4.35], [6.0, 4.45], [6.75, -1.4], [0.55, -1.95]];
  out.push(...faded(c, fade(c, 0.4), screws.flatMap(([x, y]) => screw(c, [x, y, PLATE.z + 0.04]))));
  return out;
};

/** a lead (round wire) along a smooth 3D path; from = the first point index drawn (the tail is redrawn in front of the
 *  plate: the same Catmull-Rom segments as the whole lead) */
const wire = (c: Ctx, col: Tone, pts: V3[], from = 0): El[] => {
  const P = pts.map((p) => pj(c, p));
  const k = 1 / 6;
  let d = `M${f2(P[from].x)},${f2(P[from].y)}`;
  for (let i = from; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    d += ` C${f2(p1.x + (p2.x - p0.x) * k)},${f2(p1.y + (p2.y - p0.y) * k)} ${f2(p2.x - (p3.x - p1.x) * k)},${f2(p2.y - (p3.y - p1.y) * k)} ${f2(p2.x)},${f2(p2.y)}`;
  }
  const ww = clamp(2 * WIRE_R * P[Math.floor(P.length / 2)].s, 1.4, 14);
  const out: El[] = [
    <path key={key(c)} d={d} fill="none" stroke={INK} strokeWidth={f2(ww + 2 * c.line)} strokeLinecap="round" strokeLinejoin="round" vectorEffect={NS} />,
    <path key={key(c)} d={d} fill="none" stroke={col.base} strokeWidth={f2(ww)} strokeLinecap="round" strokeLinejoin="round" vectorEffect={NS} />,
  ];
  if (ww > 3)
    out.push(<path key={key(c)} d={d} fill="none" stroke={col.lit} strokeWidth={f2(ww * 0.32)} strokeLinecap="round" transform={`translate(${f2(LS.x * ww * 0.2)},${f2(LS.y * ww * 0.2)})`} opacity={0.8} vectorEffect={NS} />);
  return out;
};

const motor = (c: Ctx): El[] => {
  const out: El[] = [];
  const m = MOTOR.c;
  const at = (z: number): V3 => [m[0], m[1], z];
  const zCapEnd = MOTOR.z0 + 0.48;
  // the leads (farthest: from the terminals up behind the plate; their ends are redrawn in front of it)
  for (const w of WIRES) out.push(...wire(c, w.col, w.pts));
  // end cap, terminals, can, label band
  out.push(...cyl(c, at(MOTOR.z0), at(zCapEnd), MOTOR.r * 0.96, CAP, {n: 28, spec: 0.25}));
  for (const a of TERM) {
    const rad: V3 = [Math.cos(a), Math.sin(a), 0], tan: V3 = [-Math.sin(a), Math.cos(a), 0];
    out.push(...box(c, termPt(a, 1.43), [rad, tan, [0, 0, 1]], [0.24, 0.13, 0.04], COPPER));
  }
  out.push(...cyl(c, at(zCapEnd), at(MOTOR.z1), MOTOR.r, CAN, {n: 30, spec: 0.7, caps: 'none'}));
  const zb0 = lerp(zCapEnd, MOTOR.z1, 0.3), zb1 = lerp(zCapEnd, MOTOR.z1, 0.66);
  out.push(...cyl(c, at(zb0), at(zb1), MOTOR.r + 0.015, BAND, {n: 30, spec: 0.35, caps: 'none', ink: c.line}));
  // the can's front face (drawn after the band, which lies behind it): a step darker than the can, with a dark
  // bearing seat round the shaft so the bright pinion in front of it stands out
  out.push(...disc(c, at(MOTOR.z1), MOTOR.r, MFACE, 30));
  out.push(...faded(c, fade(c, 0.4), [0.8 + Math.PI, 0.8 + Math.PI * 0.62].map((a) => (
    <path key={key(c)} d={poly(ring3(c, [m[0] + 1.16 * Math.cos(a), m[1] + 1.16 * Math.sin(a), MOTOR.z1 + 0.005], X3, Y3, 0.09, 10))} fill={C.dark} opacity={0.85} />
  ))));
  out.push(...disc(c, at(MOTOR.z1 + 0.004), 0.98, BEARING, 28, 0.6));
  out.push(...cyl(c, at(MOTOR.z1), at(MOTOR.z1 + 0.14), 0.42, DARK, {n: 20, spec: 0.35, ink: c.line}));
  return out;
};
/** the leads' ends (in front of the plate's lower-left edge) and the connector they plug into: always drawn */
const connector = (c: Ctx): El[] => {
  const out: El[] = [];
  for (const w of WIRES) out.push(...wire(c, w.col, w.pts, w.pts.length - 1 - w.tail));
  out.push(...box(c, CONN.o, CONN.ax, CONN.h, NYLON));
  // the latch ridge on its face
  const r0 = add3(CONN.o, add3(mul3(CONN.u, -0.2), [0, 0, CONN.h[2]])), r1 = add3(CONN.o, add3(mul3(CONN.u, 0.2), [0, 0, CONN.h[2]]));
  const p0 = pj(c, r0), p1 = pj(c, r1);
  out.push(...faded(c, fade(c, 0.3), [lineP(c, `M${f2(p0.x)},${f2(p0.y)} L${f2(p1.x)},${f2(p1.y)}`, clamp(0.06 * p0.s, 1, 4), NYLON.deep, 0.9)]));
  return out;
};

/** the far spar beyond its rod-end eye (it passes behind the plate, through the slot) */
const sparSeg = (c: Ctx, W: WingFrame, a: number, b: number, o: CylOpt = {}): El[] =>
  cyl(c, add3(W.o, mul3(W.ex, a)), add3(W.o, mul3(W.ex, b)), SPAR.r, CARBON, {n: 16, spec: 0.35, ...o});
const collar = (c: Ctx, W: WingFrame, a: number): El[] =>
  faded(c, fade(c, 0.45), cyl(c, add3(W.o, mul3(W.ex, a - 0.07)), add3(W.o, mul3(W.ex, a + 0.07)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0, ink: c.line}));
/** a rod-end eye: a short housing on axis a-b with the dark ring of its ball bearing on the face toward the camera */
const eye = (c: Ctx, a: V3, b: V3): El[] => {
  const out = cyl(c, a, b, EYE.r, ROD, {n: 22, spec: 0.3});
  const d = norm3(sub3(b, a));
  const end = facing(c.B, xf(c.F, b), xfv(c.F, d)) > 0 ? b : a;
  const [e1, e2] = perpBasis(d);
  const s = pj(c, end).s;
  out.push(...faded(c, fade(c, 0.3), [lineP(c, poly(ring3(c, end, e1, e2, EYE.r * 0.62, 20)), clamp(0.07 * s, 1, 5), C.dark, 0.75)]));
  return out;
};
const topEyeAxis = (W: WingFrame): [V3, V3] => [add3(W.o, mul3(W.ex, LEVER - EYE.hl)), add3(W.o, mul3(W.ex, LEVER + EYE.hl))];
const pinEyeAxis = (p: V3): [V3, V3] => [[p[0], p[1], p[2] - EYE.hl], [p[0], p[1], p[2] + EYE.hl]];
/** the rod-end eye on a spar: coaxial with the spar, centred exactly at the lever point */
const topEye = (c: Ctx, W: WingFrame): El[] => eye(c, ...topEyeAxis(W));
/** the rod-end eye on the crank pin (axis z) */
const pinEye = (c: Ctx, p: V3): El[] => eye(c, ...pinEyeAxis(p));
/** a connecting rod between its two eye centres: the bar, and at each end the rod-end's thicker shank (drawn before
 *  the eyes, so each eye visibly belongs to its rod) */
const ROD_NECK = 0.62;
const rodBar = (c: Ctx, a: V3, b: V3): El[] => {
  const d = norm3(sub3(b, a));
  return [
    ...cyl(c, a, b, 0.135, ROD, {n: 14, spec: 0.7, caps: 'none'}),
    ...cyl(c, a, add3(a, mul3(d, ROD_NECK)), 0.2, ROD, {n: 14, spec: 0.5}),
    ...cyl(c, add3(b, mul3(d, -ROD_NECK)), b, 0.2, ROD, {n: 14, spec: 0.5}),
  ];
};
const knuckleAxis = (H: V3): [V3, V3] => [[H[0] - KNUCKLE.hw, H[1], H[2]], [H[0] + KNUCKLE.hw, H[1], H[2]]];
/** the silhouettes of the near linkage (rod, its two eyes, the spar's lever and the hinge knuckle) for focus 'rod' */
const rodFocusSils = (c: Ctx, ps: Pose): string[] => {
  const a = ps.rodEye.near, b = ps.rodTop.near, W = ps.wing.near;
  const d = norm3(sub3(b, a));
  return [
    cylSil(c, a, b, 0.135),
    cylSil(c, a, add3(a, mul3(d, ROD_NECK)), 0.2),
    cylSil(c, add3(b, mul3(d, -ROD_NECK)), b, 0.2),
    cylSil(c, ...pinEyeAxis(a), EYE.r),
    cylSil(c, ...topEyeAxis(W), EYE.r),
    cylSil(c, add3(W.o, mul3(W.ex, 0.2)), add3(W.o, mul3(W.ex, LEVER + EYE.hl + 0.3)), SPAR.r + 0.09),
    cylSil(c, ...knuckleAxis(HINGE.near), KNUCKLE.r),
  ];
};

/** a hinge bracket: a filleted block jutting from the plate (front face lit like the plate, sides shaded along their
 *  depth), with a socket screw on its face */
const bracket = (c: Ctx, xc: number): El[] => {
  const hw = BRACKET.w / 2;
  const prof = fillet([[xc - hw, BRACKET.y0], [xc - hw, BRACKET.y1], [xc + hw, BRACKET.y1], [xc + hw, BRACKET.y0]], BRACKET.fillet, 2)
    .map(([x, y]) => [x, y, TOPBAR.z1] as V3);
  return [
    ...sweep(c, prof, [0, 0, TOPBAR.z0 - TOPBAR.z1], PLATE_T, {grade: 0.4}),
    ...faded(c, fade(c, 0.4), screw(c, [xc, (BRACKET.y0 + BRACKET.y1) / 2 + 0.05, TOPBAR.z1 + 0.01], 0.16)),
  ];
};

/** the near spar beyond its eye, on out inside the near wing. Past the shoulder it is clipped to the wing's projected
 *  outline (the spar lies in the wing's plane, a little behind its leading edge): seen through the phantom wing it
 *  carries the wing, and when the wing turns edge-on it vanishes into it instead of sticking out as a bare rod. */
const nearSparOut = (c: Ctx, W: WingFrame): El[] => {
  const id = uid('msp');
  const wing = poly(WING_OUTLINE.map(([a, b]) => pj(c, wingPt(W, a, b))));
  const p1 = pj(c, add3(W.o, mul3(W.ex, LEVER))), p2 = pj(c, add3(W.o, mul3(W.ex, SPAR_FAR)));
  const pad = c.ink + 1.5;
  c.defs.push(
    <clipPath key={id} id={id}>
      <path d={wing} />
      <path d={capsule2(p1, p2, SPAR.r * p1.s + pad, SPAR.r * p2.s + pad)} />
    </clipPath>,
  );
  return [<g key={key(c)} clipPath={`url(#${id})`}>{sparSeg(c, W, LEVER + EYE.hl, SPAR_NEAR, {caps: 'b'})}</g>];
};

const hingeAssembly = (c: Ctx, ps: Pose, glowNear: El[]): {back: El[]; front: El[]} => {
  const back: El[] = [], front: El[] = [];
  const xl = TOPBAR.x0 + BRACKET.w / 2, xr = TOPBAR.x1 - BRACKET.w / 2;
  // which bracket is nearer depends on the camera's side: draw the far one first
  const camX = dot3(sub3(c.B.eye, xf(c.F, [2.5, 4.6, 0])), xfv(c.F, [1, 0, 0])) > 0;
  const [b1, b2] = camX ? [xl, xr] : [xr, xl];
  back.push(...bracket(c, b1));
  // steel bushings where the hinge pins enter the far bracket's inner face (the face toward the camera)
  const sx = camX ? 1 : -1;
  const xin = b1 + sx * (BRACKET.w / 2);
  for (const H of [HINGE.far, HINGE.near]) back.push(...cyl(c, [xin, H[1], H[2]], [xin + sx * 0.06, H[1], H[2]], 0.22, STEEL, {n: 16, spec: 0, ink: c.line}));
  // hinge pins between the brackets
  for (const H of [HINGE.far, HINGE.near]) back.push(...cyl(c, [xl + BRACKET.w / 2, H[1], H[2]], [xr - BRACKET.w / 2, H[1], H[2]], 0.12, STEEL, {n: 12, spec: 0.4, caps: 'none'}));
  // far spar root: spar (from its eye to the knuckle), ferrule, knuckle
  const Wf = ps.wing.far, Wn = ps.wing.near;
  back.push(...collar(c, Wf, LEVER - EYE.hl - 0.12));
  back.push(...sparSeg(c, Wf, 0.72, LEVER - EYE.hl, {caps: 'none'}));
  back.push(...cyl(c, add3(Wf.o, mul3(Wf.ex, 0.2)), add3(Wf.o, mul3(Wf.ex, 0.8)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0.3}));
  const knuckle = (H: V3) => cyl(c, ...knuckleAxis(H), KNUCKLE.r, STEEL, {n: 20, spec: 0.55});
  back.push(...knuckle(HINGE.far));
  // the near linkage's focus rim goes under its first part (the near knuckle)
  back.push(...glowNear);
  back.push(...knuckle(HINGE.near));
  back.push(...cyl(c, add3(Wn.o, mul3(Wn.ex, 0.2)), add3(Wn.o, mul3(Wn.ex, 0.8)), SPAR.r + 0.09, STEEL, {n: 16, spec: 0.3}));
  back.push(...bracket(c, b2));
  // pin heads on the nearer bracket's outer face
  for (const H of [HINGE.far, HINGE.near]) {
    const xo = camX ? TOPBAR.x1 : TOPBAR.x0;
    back.push(...cyl(c, [xo, H[1], H[2]], [xo + sx * 0.07, H[1], H[2]], 0.2, STEEL, {n: 14, spec: 0, ink: c.line}));
  }
  // near spar from the ferrule to its eye (it points toward the camera)
  back.push(...sparSeg(c, Wn, 0.8, LEVER - EYE.hl, {caps: 'none'}));
  back.push(...collar(c, Wn, LEVER - EYE.hl - 0.12));
  // the near eye and the spar beyond it are drawn after the near rod (front)
  front.push(...topEye(c, Wn));
  front.push(...collar(c, Wn, LEVER + EYE.hl + 0.12));
  front.push(...nearSparOut(c, Wn));
  return {back, front};
};

const drawMech = (c: Ctx, ps: Pose, look: MechLook): El[] => {
  const out: El[] = [];
  const rate = look.rate ?? 0;
  const focus = look.focus ?? null;
  const Wf = ps.wing.far;
  // 1. behind the plate: the far spar's outer part (seen above the plate and through its slot)
  out.push(...sparSeg(c, Wf, LEVER + EYE.hl, SPAR_FAR, {caps: 'auto'}));
  out.push(...collar(c, Wf, LEVER + EYE.hl + 0.12));
  // 2. the motor and its leads (behind the plate, seen through the bore and below the plate)
  out.push(...motor(c));
  // 3. the skeletal back plate, the leads' connector on its lower-left edge, axle bosses
  out.push(...plate(c));
  out.push(...connector(c));
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
  out.push(...cyl(c, pinBase, [ps.pin[0], ps.pin[1], bz + 0.09], B_SPOKE.boss, BRASS, {n: 20, spec: 0}));
  out.push(...cyl(c, [ps.pin[0], ps.pin[1], bz + 0.09], [ps.pin[0], ps.pin[1], ps.rodEye.near[2] + EYE.hl + 0.06], CRANK.pinR, STEEL, {n: 14, spec: 0.4}));
  // 6. the far rod (it climbs behind the plate through the slot to the far spar's eye), the far spar root
  out.push(...rodBar(c, ps.rodEye.far, ps.rodTop.far));
  out.push(...topEye(c, Wf));
  out.push(...pinEye(c, ps.rodEye.far));
  const hinge = hingeAssembly(c, ps, focus === 'rod' ? glowPass(c, rodFocusSils(c, ps), 1) : []);
  out.push(...hinge.back);
  // 7. the near rod, its eye on the pin, the pin head
  out.push(...rodBar(c, ps.rodEye.near, ps.rodTop.near));
  out.push(...pinEye(c, ps.rodEye.near));
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
const CR = {tmax: (64 * Math.PI) / 180, padT: 0.5, armT: 0.75, baseT: 1.0, postR: 0.42, boardT: 1.0, boardZ: 4.4, boardX: [-9.2, 9.6] as [number, number], n: 14};
type YZ = [number, number];
/** a support's yz section at body-local x: (y, z) of the body's underside along the angle t from straight down,
 *  pushed out by off (cm) */
const crSection = (x: number) => {
  // fitted to the narrowest section across the saddle's width, so the liner touches the body along its whole length
  const xs = [x - CRADLE.padW / 2, x, x + CRADLE.padW / 2];
  return (t: number, off: number): YZ => {
    const d: V3 = [0, -Math.cos(t), Math.sin(t)];
    const r = Math.min(...xs.map((xx) => bodyExit([xx, -1, 0], d))) + 0.02 + off;
    return [-1 + d[1] * r, d[2] * r];
  };
};
/** one support's profiles (y, z): the foam liner (a band on the body's underside), the U saddle block under it, and
 *  the near arm alone (the part that wraps the near flank, for the front layer) */
const crProfiles = (x: number) => {
  const at = crSection(x);
  const N = CR.n, tm = CR.tmax;
  const ts = Array.from({length: 2 * N + 1}, (_, i) => ((i - N) / N) * tm); // -tm .. tm
  const pad: YZ[] = [...ts.map((t) => at(t, 0)), ...[...ts].reverse().map((t) => at(t, CR.padT))];
  const yBot = at(0, CR.padT)[0] - CR.baseT;
  // one side of the block (z >= 0), from the saddle's centre line out over the arm tip and down the wall to the base
  const tipIn = at(tm, CR.padT), tipOut = at(tm, CR.padT + CR.armT);
  const tc: YZ = [(tipIn[0] + tipOut[0]) / 2, (tipIn[1] + tipOut[1]) / 2];
  const tr = Math.hypot(tipOut[0] - tipIn[0], tipOut[1] - tipIn[1]) / 2;
  const a0 = Math.atan2(tipIn[0] - tc[0], tipIn[1] - tc[1]);
  const tip: YZ[] = [];
  for (let i = 1; i < 6; i++) {
    const a = a0 - (i / 6) * Math.PI;
    tip.push([tc[0] + tr * Math.sin(a), tc[1] + tr * Math.cos(a)]);
  }
  const outerArm: YZ[] = [];
  for (let i = N; i >= N / 2; i--) outerArm.push(at((i / N) * tm, CR.padT + CR.armT));
  const side = outerArm[outerArm.length - 1];
  const zb = side[1] * 0.96;
  const wall: YZ[] = [[lerp(side[0], yBot, 0.55), zb + 0.04], [yBot + 0.35, zb], [yBot + 0.08, zb - 0.12], [yBot, zb - 0.38]];
  const half: YZ[] = [];
  for (let i = 0; i <= N; i++) half.push(at((i / N) * tm, CR.padT));
  half.push(...tip, ...outerArm, ...wall);
  const mir = (p: YZ): YZ => [p[0], -p[1]];
  const block: YZ[] = [...half, ...[...half].reverse().map(mir).slice(0, -1)];
  // the near arm: from 18 degrees up (below that the liner lies under the belly), down the wall to the base
  const t18 = (18 * Math.PI) / 180;
  const arm: YZ[] = [];
  for (let i = 0; i <= N; i++) arm.push(at(lerp(t18, tm, i / N), -0.05));
  arm.push(...tip, ...outerArm, ...wall, [yBot, at(t18, 0)[1]]);
  return {pad, block, arm, yBot};
};
const CR_PROF = CRADLE.xs.map((x) => ({x, ...crProfiles(x)}));
const crProf3 = (x: number, prof: YZ[]): V3[] => prof.map(([y, z]) => [x, y, z] as V3);

/** Cradle props. layer 'all' (default) draws everything; for correct overlap with the bird draw 'back' (board, posts,
 *  saddles) before the Bird and 'front' (the saddles' near arms that wrap the near flank) after it. 'front' REQUIRES
 *  the bird's pose `ps`: the near wing hangs over those arms and is masked out of them. */
export type CradleProps = {B: Basis; F: Frame; base: V3} & ({layer?: 'all' | 'back'; ps?: Pose} | {layer: 'front'; ps: Pose});
/** the lab's padded two-U support under the body (rig.ts CRADLE), standing on the bench at `base` (world). */
export const Cradle: React.FC<CradleProps> = (props) => {
  const {B, F, base} = props;
  const layer = props.layer ?? 'all';
  const ps = props.ps;
  // the cradle stands level on the bench: it takes only the bird's heading, and sits at base
  const yaw = (Math.atan2(F.ex[2], F.ex[0]) * -180) / Math.PI;
  const CF = bodyFrame([base[0], base[1] - CRADLE.benchY, base[2]], yaw, 0, 0);
  const c = makeCtx(B, CF, 1, [0, -8, 0]);
  const back: El[] = [], front: El[] = [];
  const yb = CRADLE.benchY + CR.boardT;
  const hx = CRADLE.padW / 2;
  const saddle = (p: (typeof CR_PROF)[number]): El[] => [
    ...sweep(c, crProf3(p.x - hx, p.block), [2 * hx, 0, 0], RIB),
    ...sweep(c, crProf3(p.x - hx + 0.12, p.pad), [2 * hx - 0.24, 0, 0], PAD),
  ];
  if (layer !== 'front') {
    const I: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const bx = CR.boardX;
    back.push(...box(c, [(bx[0] + bx[1]) / 2, CRADLE.benchY + CR.boardT / 2, 0], I, [(bx[1] - bx[0]) / 2, CR.boardT / 2, CR.boardZ], BOARD));
    // a post under each saddle, on a foot flange
    CR_PROF.forEach((p) => {
      back.push(...cyl(c, [p.x, yb, 0], [p.x, yb + 0.18, 0], 0.85, RIB, {n: 24, spec: 0}));
      back.push(...cyl(c, [p.x, yb + 0.18, 0], [p.x, p.yBot + 0.05, 0], CR.postR, RIB, {n: 18, spec: 0.6, caps: 'none'}));
    });
    CR_PROF.forEach((p) => back.push(...saddle(p)));
  }
  // the near arms, redrawn over the bird through a mask of their own swept region (no seam with the back layer). The
  // near wing (in the bird's own frame F) is nearer the camera than the arms: it is kept out of the mask. Without the
  // pose ('front' called untyped) the arms are skipped rather than drawn over the wing.
  if (layer === 'all' || (layer === 'front' && ps)) {
    const wingD = ps ? poly(WING_OUTLINE.map(([a, b]) => proj(B, xf(F, wingPt(ps.wing.near, a, b))))) : null;
    CR_PROF.forEach((p) => {
      const id = uid('crm');
      const reg = sweepRegion(c, crProf3(p.x - hx - 0.02, p.arm), [2 * hx + 0.04, 0, 0]).d;
      c.defs.push(
        <mask key={id} id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
          <path d={reg} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={2 * c.ink + 2} strokeLinejoin="round" vectorEffect={NS} />
          {wingD && <path d={wingD} fill="#000000" stroke="#000000" strokeWidth={1.5} strokeLinejoin="round" vectorEffect={NS} />}
        </mask>,
      );
      front.push(<g key={key(c)} mask={`url(#${id})`}>{saddle(p)}</g>);
    });
  }
  return (
    <g>
      <defs>{c.defs}</defs>
      {back}
      {front}
    </g>
  );
};
