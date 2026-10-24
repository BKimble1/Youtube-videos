// The laser emitter: a compact hard-surface device on a pedestal, built once in 3D (lib/p3) and drawn from any angle in
// the Weird Crew finish (lit facets, a soft specular, one ink contour round the object, thin inner edges). Model units are
// centimetres: the lens axis is 157 cm above the floor (ear height of a standing adult), the housing is 34 cm long.
// Inside (shown when `xray` opens the near side panel): a laser diode, a collimating lens that can slide, a wedge prism
// that spins to steer (sweep) the beam, and the front objective lens.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {INK, Inked, InkPath} from '../lib/ink';
import {fmt} from '../lib/math';
import {add3, cross3, dot3, facesCam, lum, mul3, norm3, proj, sub3, toCam, v3, V3, View} from '../lib/p3';

export const EM = {
  housing: '#2E3A47',
  panel: '#3A4856',
  accent: '#25C9BE',
  metal: '#9DABB7',
  glass: '#152536',
  pedestal: '#36424E',
  base: '#27313A',
  copper: '#C9874A',
};
/** height of the lens axis above the floor (cm) and the lens's front (model x) */
export const LENS_Y = 7;
export const FLOOR_Y = -128;
export const LENS_X = 25;

type Poly = {pts: V3[]; color: string; d?: number; key: string; edge?: number; op?: number; gloss?: boolean};

const quad = (a: V3, b: V3, c: V3, d: V3) => [a, b, c, d];

/** an axis-aligned box as six faces (outward normals) */
const box = (key: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, opts: {op?: Record<string, number>; edge?: number} = {}) => {
  const P = (x: number, y: number, z: number) => v3(x, y, z);
  const faces: {n: V3; pts: V3[]; name: string}[] = [
    {n: v3(1, 0, 0), name: 'front', pts: quad(P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1))},
    {n: v3(-1, 0, 0), name: 'back', pts: quad(P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), P(x0, y0, z0))},
    {n: v3(0, 1, 0), name: 'top', pts: quad(P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0))},
    {n: v3(0, -1, 0), name: 'bottom', pts: quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1))},
    {n: v3(0, 0, 1), name: 'left', pts: quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1))},
    {n: v3(0, 0, -1), name: 'right', pts: quad(P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0))},
  ];
  return faces.map((f) => ({...f, key: `${key}-${f.name}`, color, op: opts.op?.[f.name], edge: opts.edge}));
};

/** a cylinder along a model axis (unit vector), centre of its base at c, length len, radius r */
const cylinder = (c: V3, axis: V3, len: number, r: number, n = 28) => {
  const a = norm3(axis);
  const helper = Math.abs(a.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
  const u = norm3(cross3(a, helper));
  const w = cross3(a, u);
  const ring = (o: V3) => Array.from({length: n}, (_, i) => add3(o, add3(mul3(u, r * Math.cos((i / n) * 2 * Math.PI)), mul3(w, r * Math.sin((i / n) * 2 * Math.PI)))));
  return {a, u, w, r0: ring(c), r1: ring(add3(c, mul3(a, len))), c0: c, c1: add3(c, mul3(a, len))};
};

const hull = (pts: {x: number; y: number}[]) => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: {x: number; y: number}[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: {x: number; y: number}[] = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

export type EmitterProps = {
  id: string;
  view: View;
  /** status LED 0..1 (firing) */
  led?: number;
  /** dial rotation (deg) */
  dial?: number;
  /** near side panel see-through 0..1 */
  xray?: number;
  /** wedge prism spin (deg) */
  prism?: number;
  /** collimator slide (-1..1) */
  slide?: number;
  /** draw the pedestal */
  pedestal?: boolean;
  /** the internal beam path (instructional overlay) 0..1 */
  inner?: number;
  /** the housing's upward tilt on its yoke (deg), aimed at an ear above the lens */
  tilt?: number;
  /** time (s), for the inner pulses */
  t?: number;
  inkW?: number;
};

export const tiltP = (p: V3, tilt: number): V3 => {
  const a = (tilt * Math.PI) / 180;
  return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a), z: p.z};
};
export const Emitter: React.FC<EmitterProps> = ({id, view: v, led = 0, dial = 0, xray = 0, prism = 0, slide = 0, pedestal = true, inner = 0, t = 0, inkW = 2.4, tilt = 0}) => {
  // housing parts turn with the tilt about the yoke's pivot; the yoke, column and base do not
  let fixed = false;
  const P2 = (p: V3) => proj(v, fixed ? p : tiltP(p, tilt));
  const NR = (n: V3) => (fixed ? n : tiltP(n, tilt));
  const pts2 = (pts: V3[]) => pts.map(P2);
  const dpath = (pts: {x: number; y: number}[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
  const shadeFace = (c: string, n: V3) => {
    const l = lum(v, n);
    return l > 0.5 ? lit(c, (l - 0.5) * 0.7) : shade(c, (0.5 - l) * 0.9);
  };
  const nearSide = facesCam(v, v3(0, 0, 1)) ? 'left' : 'right';
  const parts: {d: number; node: React.ReactNode}[] = [];
  const pushFaces = (faces: ReturnType<typeof box>) => {
    for (const f of faces) {
      if (!facesCam(v, NR(f.n))) continue;
      const q = pts2(f.pts);
      const dd = q.reduce((s, p) => s + p.z, 0) / q.length;
      const isNear = f.name === nearSide;
      const op = (f.op ?? 1) * (isNear && f.key.startsWith('hs-') ? 1 - 0.88 * xray : 1);
      parts.push({
        d: dd,
        node: (
          <g key={f.key}>
            <path d={dpath(q)} fill={shadeFace(f.color, NR(f.n))} opacity={op} stroke={INK} strokeOpacity={0.35 + 0.4 * (1 - op)} strokeWidth={1.2} strokeLinejoin="round" />
          </g>
        ),
      });
    }
  };
  const pushCyl = (key: string, c: ReturnType<typeof cylinder>, color: string, capColor?: string, sideOp = 1) => {
    const a = [...pts2(c.r0), ...pts2(c.r1)];
    const h = hull(a);
    const dd = (P2(c.c0).z + P2(c.c1).z) / 2;
    // shading across the silhouette in screen space, lit on the side toward the key light
    const e0 = P2(c.c0);
    const e1 = P2(c.c1);
    let ax = {x: e1.x - e0.x, y: e1.y - e0.y};
    const al = Math.hypot(ax.x, ax.y);
    ax = al < 1e-3 ? {x: 1, y: 0} : {x: ax.x / al, y: ax.y / al};
    let nx = {x: -ax.y, y: ax.x};
    if (nx.x * -0.62 + nx.y * -0.78 < 0) nx = {x: -nx.x, y: -nx.y};
    const rpx = c.r0.length ? Math.hypot(P2(c.r0[0]).x - e0.x, P2(c.r0[0]).y - e0.y) : 1;
    const midC = {x: (e0.x + e1.x) / 2, y: (e0.y + e1.y) / 2};
    const rr = Math.max(rpx, ...c.r0.map((q) => {
      const pq = P2(q);
      return Math.abs((pq.x - e0.x) * nx.x + (pq.y - e0.y) * nx.y);
    }));
    const L = {x: midC.x + nx.x * rr, y: midC.y + nx.y * rr};
    const S = {x: midC.x - nx.x * rr, y: midC.y - nx.y * rr};
    parts.push({
      d: dd,
      node: (
        <g key={key} opacity={sideOp}>
          <defs>
            <linearGradient id={`${id}-${key}g`} gradientUnits="userSpaceOnUse" x1={fmt(L.x)} y1={fmt(L.y)} x2={fmt(S.x)} y2={fmt(S.y)}>
              <stop offset="0" stopColor={lit(color, 0.35)} />
              <stop offset="0.25" stopColor={lit(color, 0.08)} />
              <stop offset="0.65" stopColor={color} />
              <stop offset="1" stopColor={shade(color, 0.45)} />
            </linearGradient>
          </defs>
          <path d={dpath(h)} fill={`url(#${id}-${key}g)`} stroke={INK} strokeOpacity={0.45} strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      ),
    });
    // the end cap that faces the camera
    const endFront = facesCam(v, NR(c.a));
    const ring = endFront ? c.r1 : c.r0;
    const capN = endFront ? c.a : mul3(c.a, -1);
    const q = pts2(ring);
    parts.push({
      d: dd - 0.001,
      node: <path key={`${key}-cap`} d={dpath(q)} fill={shadeFace(capColor ?? color, NR(capN))} opacity={sideOp} stroke={INK} strokeOpacity={0.45} strokeWidth={1.2} />,
    });
  };

  // ---------------------------------------------------------------- the model
  // housing (rounded look from a chamfer box under it), top panel, the teal stripe
  pushFaces(box('hs', -18, 16, 0, 14, -7, 7, EM.housing));
  pushFaces(box('tp', -15, 12, 14, 15, -5.5, 5.5, EM.panel));
  // teal stripes on both sides
  pushFaces(box('st', -16, 14, 5, 6.6, -7.15, 7.15, EM.accent, {op: {front: 0, back: 0, top: 0, bottom: 0}}));
  // heatsink fins at the back
  for (let i = 0; i < 6; i++) pushFaces(box(`fn${i}`, -23, -18, 1 + i * 2.2, 2.1 + i * 2.2, -6, 6, mix(EM.metal, EM.housing, 0.45)));
  // lens barrel, its metal ring and the glass
  pushCyl('barrel', cylinder(v3(16, LENS_Y, 0), v3(1, 0, 0), 7, 6.2), EM.housing, EM.housing);
  pushCyl('ring', cylinder(v3(22.6, LENS_Y, 0), v3(1, 0, 0), 2.4, 6.6), EM.metal, EM.metal);
  // dial and LED on the top panel
  // the control dial on the rear panel, where the operator's hand rests
  pushCyl('dial', cylinder(v3(-23, 7, 0), v3(-1, 0, 0), 2.6, 3.6), EM.metal, mix(EM.metal, '#FFFFFF', 0.2));
  // yoke and pedestal (not tilted)
  fixed = true;
  pushFaces(box('yk', -6, 6, -5, 0, -4, 4, EM.pedestal));
  if (pedestal) {
    pushCyl('col', cylinder(v3(0, FLOOR_Y + 2, 0), v3(0, 1, 0), -FLOOR_Y - 7, 2.4), EM.pedestal);
    pushCyl('base', cylinder(v3(0, FLOOR_Y, 0), v3(0, 1, 0), 2.2, 15), EM.base, EM.pedestal);
  }
  parts.sort((a, b) => b.d - a.d);
  fixed = false;

  // ---------------------------------------------------------------- details drawn over the faces
  const lensC = P2(v3(LENS_X, LENS_Y, 0));
  const lensFacing = facesCam(v, NR(v3(1, 0, 0)));
  const lensRing = pts2(cylinder(v3(LENS_X, LENS_Y, 0), v3(1, 0, 0), 0, 5.2).r0);
  const lensInner = pts2(cylinder(v3(LENS_X, LENS_Y, 0), v3(1, 0, 0), 0, 3.4).r0);
  const ledP = P2(v3(10, 15.2, 0));
  const dialTop = P2(v3(-25.7, 7, 0));
  const dialMark = P2(v3(-25.8, 7 + 2.8 * Math.cos((dial * Math.PI) / 180), 2.8 * Math.sin((dial * Math.PI) / 180)));

  // internals (x-ray): diode, collimator, wedge prism, objective; the inner beam
  const internals = xray > 0.01 && (
    <g opacity={xray}>
      {(() => {
        const els: React.ReactNode[] = [];
        const cyl = (k: string, c: ReturnType<typeof cylinder>, col: string) => {
          const h = hull([...pts2(c.r0), ...pts2(c.r1)]);
          els.push(<path key={k} d={dpath(h)} fill={col} stroke={INK} strokeOpacity={0.6} strokeWidth={1.1} />);
          const cap = facesCam(v, NR(c.a)) ? c.r1 : c.r0;
          els.push(<path key={`${k}c`} d={dpath(pts2(cap))} fill={lit(col, 0.18)} stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />);
        };
        // the cavity: a dark interior
        const cav = [v3(-17, 1, 0), v3(15, 1, 0), v3(15, 13, 0), v3(-17, 13, 0)].map(P2);
        els.push(<path key="cav" d={dpath(cav)} fill="#0E1820" opacity={0.92} />);
        cyl('diode', cylinder(v3(-15, LENS_Y, 0), v3(1, 0, 0), 6, 3.1), EM.copper);
        cyl('dcap', cylinder(v3(-9, LENS_Y, 0), v3(1, 0, 0), 1.2, 1.6), '#E8C08A');
        const cx = -4.5 + 1.6 * slide;
        cyl('col', cylinder(v3(cx, LENS_Y, 0), v3(1, 0, 0), 1, 3.4), '#9FD4E8');
        // the wedge prism: a disc whose thick edge goes round as it spins
        const pr = cylinder(v3(3, LENS_Y, 0), v3(1, 0, 0), 1.8, 4.3);
        cyl('prism', pr, '#7FC3DA');
        const rimA = (prism * Math.PI) / 180;
        const rim = P2(add3(v3(4.8, LENS_Y, 0), add3(mul3(pr.u, 4.1 * Math.cos(rimA)), mul3(pr.w, 4.1 * Math.sin(rimA)))));
        const rim2 = P2(add3(v3(4.8, LENS_Y, 0), add3(mul3(pr.u, -4.1 * Math.cos(rimA)), mul3(pr.w, -4.1 * Math.sin(rimA)))));
        els.push(<line key="pedge" x1={fmt(rim.x)} y1={fmt(rim.y)} x2={fmt(rim2.x)} y2={fmt(rim2.y)} stroke="#FFFFFF" strokeWidth={2.2} opacity={0.75} strokeLinecap="round" />);
        els.push(<circle key="pdot" cx={fmt(rim.x)} cy={fmt(rim.y)} r={2.4} fill="#FFFFFF" />);
        // the motor ring that spins the prism
        cyl('motor', cylinder(v3(5.4, LENS_Y, 0), v3(1, 0, 0), 2.2, 5.6), '#3E4B57');
        cyl('obj', cylinder(v3(13, LENS_Y, 0), v3(1, 0, 0), 1.6, 4.6), '#8FCDE3');
        // the beam inside: an instructional dashed line with pulses running toward the lens
        if (inner > 0.01) {
          const a0 = P2(v3(-8, LENS_Y, 0));
          const a1 = P2(v3(LENS_X + 2, LENS_Y, 0));
          els.push(<line key="ib" x1={fmt(a0.x)} y1={fmt(a0.y)} x2={fmt(a1.x)} y2={fmt(a1.y)} stroke="#FF8A3D" strokeWidth={3} strokeDasharray="7 6" strokeDashoffset={fmt(-t * 60)} opacity={0.85 * inner} strokeLinecap="round" />);
          for (let i = 0; i < 3; i++) {
            const u = ((t * 1.6 + i / 3) % 1);
            const p = {x: a0.x + (a1.x - a0.x) * u, y: a0.y + (a1.y - a0.y) * u};
            els.push(<circle key={`ip${i}`} cx={fmt(p.x)} cy={fmt(p.y)} r={5} fill="#FFB067" opacity={0.8 * inner * Math.sin(u * Math.PI)} />);
          }
        }
        return els;
      })()}
    </g>
  );

  const outline = (
    <Inked w={inkW}>
      {parts.map((p) => (
        <g key={`o-${(p.node as React.ReactElement).key}`}>{p.node}</g>
      ))}
    </Inked>
  );
  void outline;
  return (
    <g>
      {parts.map((p) => p.node)}
      {internals}
      {/* the front lens: dark glass with a coated sheen, an inner element and a bright reflection */}
      {lensFacing && (
        <g>
          <path d={dpath(lensRing)} fill={EM.glass} stroke={INK} strokeWidth={1.2} />
          <path d={dpath(lensInner)} fill="#22405A" opacity={0.9} />
          <path d={dpath(lensInner)} fill="none" stroke="#5FD7E8" strokeWidth={1.4} opacity={0.5} />
          <ellipse cx={fmt(lensC.x - 0.25 * (lensRing[0].x - lensC.x))} cy={fmt(lensC.y - Math.abs(lensRing[7].y - lensC.y) * 0.35)} rx={fmt(Math.max(1.5, Math.abs(lensRing[0].x - lensC.x) * 0.3))} ry={fmt(Math.max(1.5, Math.abs(lensRing[7].y - lensC.y) * 0.18))} fill="#FFFFFF" opacity={0.55} />
          {led > 0.01 && <circle cx={fmt(lensC.x)} cy={fmt(lensC.y)} r={fmt(Math.max(2, Math.abs(lensRing[7].y - lensC.y) * 0.2))} fill="#FF7A45" opacity={0.35 * led} />}
        </g>
      )}
      {/* status LED and the dial's index mark */}
      <circle cx={fmt(ledP.x)} cy={fmt(ledP.y)} r={fmt(Math.max(1.6, ledP.k * 0.8))} fill={led > 0.5 ? '#FF5B4A' : '#5A2B2B'} />
      {led > 0.5 && <circle cx={fmt(ledP.x)} cy={fmt(ledP.y)} r={fmt(Math.max(4, ledP.k * 2.4))} fill="#FF5B4A" opacity={0.25} />}
      <line x1={fmt(dialTop.x)} y1={fmt(dialTop.y)} x2={fmt(dialMark.x)} y2={fmt(dialMark.y)} stroke={INK} strokeWidth={fmt(Math.max(1.2, dialTop.k * 0.45))} strokeLinecap="round" />
      {/* a soft specular sweep along the housing's top edge */}
      {(() => {
        const a = P2(v3(-16, 14, 7));
        const b = P2(v3(14, 14, 7));
        return <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke="#FFFFFF" strokeWidth={fmt(Math.max(1, a.k * 0.5))} opacity={0.35} strokeLinecap="round" />;
      })()}
    </g>
  );
};

/** the rear control dial, in screen space (where the operator's hand goes) */
export const dialPoint = (v: View, tilt = 0) => proj(v, tiltP(v3(-26, 7, 0), tilt));
/** where the beam leaves the lens, in screen space, for overlays */
export const lensPoint = (v: View, tilt = 0) => proj(v, tiltP(v3(LENS_X, LENS_Y, 0), tilt));
/** the floor point under the pedestal */
export const baseFloor = (v: View) => proj(v, v3(0, FLOOR_Y, 0));
void dot3;
void toCam;
void INK;
void InkPath;
