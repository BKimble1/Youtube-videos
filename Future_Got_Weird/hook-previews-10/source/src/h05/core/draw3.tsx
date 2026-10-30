// Shared FGW drawing primitives, carried over from the Dead Spider episode (source/src/draw3.tsx).
// Drawing projected objects in the Weird Crew finish (dc/ink.tsx): one ink contour per part, gradient fills from the fixed
// upper-left key light, restrained highlights. Every primitive becomes an Item with a camera depth; a view sorts the
// items far to near, so near legs pass in front of the body and far legs behind it from any camera.
import React from 'react';
import {lit, mix, shade} from '../../shared/color';
import {INK} from '../../shared/ink';
import {add3, Basis, capsule2, depth, hull, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V2, V3} from '../../shared/three';

export type Item = {z: number; el: React.ReactNode};
const LIGHT = {x: -0.62, y: -0.78};
const f2 = (n: number) => n.toFixed(2);
/** contour width in screen px for a part seen at `s` px/mm */
export const inkW = (s: number, k = 1) => Math.max(1.3, Math.min(4.2, 0.09 * s)) * k;

let uid = 0;
let ns = 'g';
/** start a frame's id namespace (a contact sheet holds several frames in one document) */
export const resetIds = (prefix = 'g') => {
  uid = 0;
  ns = prefix.replace(/[^A-Za-z0-9_-]/g, '_');
};
const nid = (p: string) => `${ns}${p}${uid++}`;

/** a tapered round segment (leg, needle shaft) between world points a, b with radii ra, rb (mm) */
/** a fluid channel inside a cut-away segment: colour, radius as a fraction of the segment's, and a flow phase (dashes
 *  travelling outward along the segment; undefined = still) */
/** soft: an organic look (translucent fluid, a travelling soft swell instead of dashes) */
export type Core = {color: string; k: number; flow?: number; op?: number; soft?: boolean};
export const capsuleItem = (B: Basis, a: V3, b: V3, ra: number, rb: number, color: string, o: {ink?: number; spec?: number; zBias?: number; opacity?: number; key?: string; band?: string; bandAt?: number; core?: Core; fillOpacity?: number} = {}): Item => {
  const A = proj(B, a), Bp = proj(B, b);
  const rA = ra * A.s, rB = rb * Bp.s;
  const d = capsule2(A, Bp, rA, rB);
  const ax = {x: Bp.x - A.x, y: Bp.y - A.y};
  const L = Math.hypot(ax.x, ax.y) || 1;
  let n = {x: -ax.y / L, y: ax.x / L};
  if (n.x * LIGHT.x + n.y * LIGHT.y < 0) n = {x: -n.x, y: -n.y};
  const m = {x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2};
  const r = Math.max(rA, rB, 0.5);
  const id = nid('cg');
  const w = o.ink ?? inkW((A.s + Bp.s) / 2);
  const el = (
    <g key={o.key ?? id} opacity={o.opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(m.x + n.x * r)} y1={f2(m.y + n.y * r)} x2={f2(m.x - n.x * r)} y2={f2(m.y - n.y * r)}>
          <stop offset="0" stopColor={lit(color, 0.42)} />
          <stop offset="0.38" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.45)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} fillOpacity={o.fillOpacity} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" />
      {o.band && L > 3 * r && (
        <path
          d={capsule2(
            {x: A.x + (Bp.x - A.x) * (o.bandAt ?? 0.72), y: A.y + (Bp.y - A.y) * (o.bandAt ?? 0.72)},
            {x: A.x + (Bp.x - A.x) * 0.97, y: A.y + (Bp.y - A.y) * 0.97},
            (rA + (rB - rA) * (o.bandAt ?? 0.72)) * 0.86,
            rB * 0.86,
          )}
          fill={o.band}
          opacity={0.85}
        />
      )}
      {o.core && o.core.k > 0.01 && (
        <g opacity={o.core.op ?? 1}>
          <path d={capsule2(A, Bp, rA * o.core.k, rB * o.core.k)} fill={o.core.color} opacity={o.core.soft ? 0.62 : 1} />
          {o.core.soft && o.core.flow !== undefined && L > 2 * r && (() => {
            // a soft swell of fluid travelling down the segment
            const u = (((o.core.flow * 0.34) % 1) + 1) % 1;
            const px = A.x + (Bp.x - A.x) * u, py = A.y + (Bp.y - A.y) * u;
            const rr = (rA + (rB - rA) * u) * o.core.k;
            const ang = (Math.atan2(Bp.y - A.y, Bp.x - A.x) * 180) / Math.PI;
            return <ellipse cx={f2(px)} cy={f2(py)} rx={f2(rr * 2.2)} ry={f2(rr * 0.85)} transform={`rotate(${f2(ang)} ${f2(px)} ${f2(py)})`} fill="#E6F6FA" opacity={0.4 * Math.sin(Math.PI * u)} />;
          })()}
          {!o.core.soft && o.core.flow !== undefined && L > 2 * r && (
            <path d={`M${f2(A.x)},${f2(A.y)} L${f2(Bp.x)},${f2(Bp.y)}`} stroke="#FFFFFF" strokeWidth={f2(Math.min(rA, rB) * o.core.k * 0.7)} strokeLinecap="round" strokeDasharray={`${f2(Math.max(2, L * 0.12))} ${f2(Math.max(4, L * 0.22))}`} strokeDashoffset={f2(-o.core.flow * L * 0.34)} opacity={0.55} />
          )}
        </g>
      )}
      {(o.spec ?? 0.5) > 0 && L > r && (
        <path
          d={`M${f2(A.x + n.x * rA * 0.45 + ax.x * 0.12)},${f2(A.y + n.y * rA * 0.45 + ax.y * 0.12)} L${f2(Bp.x + n.x * rB * 0.45 - ax.x * 0.18)},${f2(Bp.y + n.y * rB * 0.45 - ax.y * 0.18)}`}
          stroke="#FFFFFF"
          strokeWidth={f2(Math.max(0.6, Math.min(rA, rB) * 0.32))}
          strokeLinecap="round"
          opacity={0.2 * (o.spec ?? 0.5) * 2}
        />
      )}
    </g>
  );
  return {z: (A.z + Bp.z) / 2 + (o.zBias ?? 0), el};
};

/** the projected outline of an ellipsoid (centre c, three semi-axis vectors) */
export const ellipsoidPath = (B: Basis, c: V3, ax: [V3, V3, V3]) => {
  const pts: V2[] = [];
  for (let i = 0; i < 14; i++) {
    const th = (i / 14) * Math.PI;
    for (let j = 0; j < 28; j++) {
      const ph = (j / 28) * 2 * Math.PI;
      const p = add3(c, add3(mul3(ax[0], Math.sin(th) * Math.cos(ph)), add3(mul3(ax[1], Math.sin(th) * Math.sin(ph)), mul3(ax[2], Math.cos(th)))));
      pts.push(proj(B, p));
    }
  }
  pts.push(proj(B, add3(c, ax[2])), proj(B, sub3(c, ax[2])));
  const h = hull(pts);
  // even out the hull's vertices for a smooth curve
  return smoothClosed(resample(h, 40));
};
/** resample a closed polygon to n evenly spaced points */
export const resample = (h: V2[], n: number): V2[] => {
  const seg: number[] = [];
  let tot = 0;
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    seg.push(l);
    tot += l;
  }
  const out: V2[] = [];
  let i = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const t = (k / n) * tot;
    while (acc + seg[i] < t && i < h.length - 1) acc += seg[i++];
    const u = seg[i] > 0 ? (t - acc) / seg[i] : 0;
    const a = h[i], b = h[(i + 1) % h.length];
    out.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
  }
  return out;
};

/** a shaded ellipsoid body part; `deco` is drawn inside its outline (markings), clipped to it */
export const ellipsoidItem = (B: Basis, c: V3, ax: [V3, V3, V3], color: string, o: {zBias?: number; deco?: React.ReactNode; spec?: number; opacity?: number; ink?: number; glossy?: boolean; fillOpacity?: number} = {}): Item => {
  const d = ellipsoidPath(B, c, ax);
  const C = proj(B, c);
  const R = Math.max(len(ax[0]), len(ax[1]), len(ax[2])) * C.s;
  const id = nid('eg');
  const el = (
    <g key={id} opacity={o.opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(C.x + LIGHT.x * R * 0.42)} cy={f2(C.y + LIGHT.y * R * 0.42)} r={f2(R * 1.25)}>
          <stop offset="0" stopColor={lit(color, 0.38)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.5)} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${id})`} fillOpacity={o.fillOpacity} />
      {o.deco && <g clipPath={`url(#${id}c)`}>{o.deco}</g>}
      {(o.spec ?? 1) > 0 && <ellipse cx={f2(C.x + LIGHT.x * R * 0.42)} cy={f2(C.y + LIGHT.y * R * 0.48)} rx={f2(R * 0.15)} ry={f2(R * 0.07)} transform={`rotate(-35 ${f2(C.x + LIGHT.x * R * 0.42)} ${f2(C.y + LIGHT.y * R * 0.48)})`} fill="#FFFFFF" opacity={(o.glossy ? 0.38 : 0.2) * (o.spec ?? 1)} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={f2(o.ink ?? inkW(C.s, 1.1))} strokeLinejoin="round" />
    </g>
  );
  return {z: C.z + (o.zBias ?? 0), el};
};
const len = (v: V3) => Math.hypot(v[0], v[1], v[2]);

/** a closed polygon on world points (flat face), filled */
export const facePath = (B: Basis, pts: V3[]) => `M${pts.map((p) => P2(proj(B, p))).join(' L')} Z`;

/** a box (centre, half extents along world x, y, z axes rotated by yaw), visible faces shaded */
export const boxItem = (B: Basis, c: V3, h: V3, color: string, o: {yaw?: number; zBias?: number; ink?: number; top?: string; opacity?: number; key?: string} = {}): Item => {
  const yaw = ((o.yaw ?? 0) * Math.PI) / 180;
  const ex: V3 = [Math.cos(yaw) * h[0], Math.sin(yaw) * h[0], 0];
  const ey: V3 = [-Math.sin(yaw) * h[1], Math.cos(yaw) * h[1], 0];
  const ez: V3 = [0, 0, h[2]];
  const P = (a: number, b: number, cc: number) => add3(c, add3(mul3(ex, a), add3(mul3(ey, b), mul3(ez, cc))));
  const faces: {n: V3; pts: V3[]; tone: number}[] = [
    {n: [0, 0, 1], pts: [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], tone: -0.25},
    {n: norm3(mul3(ey, -1)), pts: [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], tone: 0.08},
    {n: norm3(ey), pts: [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], tone: 0.2},
    {n: norm3(mul3(ex, -1)), pts: [P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1)], tone: -0.05},
    {n: norm3(ex), pts: [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], tone: 0.28},
    {n: [0, 0, -1], pts: [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1)], tone: 0.4},
  ];
  const vis = faces.filter((fc) => {
    const ctr = mul3(fc.pts.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 0.25);
    return dot(fc.n, sub3(B.eye, ctr)) > 0;
  });
  const outline = hull(Object.values([-1, 1]).flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((cc) => proj(B, P(a, b, cc))))));
  const C = proj(B, c);
  const id = nid('bx');
  const el = (
    <g key={o.key ?? id} opacity={o.opacity}>
      {vis.map((fc, i) => (
        <path key={i} d={facePath(B, fc.pts)} fill={fc.tone < 0 ? (fc.n[2] > 0.5 && o.top ? o.top : lit(color, -fc.tone)) : shade(color, fc.tone)} stroke={fc.tone < 0 ? lit(color, 0.5) : shade(color, 0.6)} strokeWidth={0.6} strokeLinejoin="round" />
      ))}
      <path d={`M${outline.map(P2).join(' L')} Z`} fill="none" stroke={INK} strokeWidth={f2(o.ink ?? inkW(C.s, 1))} strokeLinejoin="round" />
    </g>
  );
  return {z: C.z + (o.zBias ?? 0), el};
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** a cylinder between a and b (radius r), with its visible end cap */
export const cylinderItem = (B: Basis, a: V3, b: V3, r: number, color: string, o: {zBias?: number; cap?: string; ink?: number; opacity?: number; glass?: boolean; key?: string; spec?: number} = {}): Item => {
  const ax = norm3(sub3(b, a));
  let u = Math.abs(ax[2]) < 0.9 ? norm3(cross(ax, [0, 0, 1])) : norm3(cross(ax, [1, 0, 0]));
  const v = cross(ax, u);
  const ring = (c: V3) => Array.from({length: 32}, (_, i) => {
    const t = (i / 32) * 2 * Math.PI;
    return add3(c, add3(mul3(u, r * Math.cos(t)), mul3(v, r * Math.sin(t))));
  });
  const ra = ring(a), rb = ring(b);
  const outline = hull([...ra, ...rb].map((p) => proj(B, p)));
  const capEnd = dot(ax, sub3(B.eye, b)) > 0 ? rb : dot(mul3(ax, -1), sub3(B.eye, a)) > 0 ? ra : null;
  const A = proj(B, a), Bp = proj(B, b);
  const sAx = {x: Bp.x - A.x, y: Bp.y - A.y};
  const L = Math.hypot(sAx.x, sAx.y) || 1;
  let n = {x: -sAx.y / L, y: sAx.x / L};
  if (n.x * LIGHT.x + n.y * LIGHT.y < 0) n = {x: -n.x, y: -n.y};
  const R = r * (A.s + Bp.s) / 2;
  const m = {x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2};
  const id = nid('cy');
  const el = (
    <g key={o.key ?? id} opacity={o.opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(m.x + n.x * R)} y1={f2(m.y + n.y * R)} x2={f2(m.x - n.x * R)} y2={f2(m.y - n.y * R)}>
          <stop offset="0" stopColor={lit(color, 0.45)} stopOpacity={o.glass ? 0.75 : 1} />
          <stop offset="0.35" stopColor={color} stopOpacity={o.glass ? 0.45 : 1} />
          <stop offset="1" stopColor={shade(color, 0.4)} stopOpacity={o.glass ? 0.7 : 1} />
        </linearGradient>
      </defs>
      <path d={`M${outline.map(P2).join(' L')} Z`} fill={`url(#${id})`} stroke={INK} strokeWidth={f2(o.ink ?? inkW((A.s + Bp.s) / 2))} strokeLinejoin="round" />
      {capEnd && <path d={`M${capEnd.map((p) => P2(proj(B, p))).join(' L')} Z`} fill={o.cap ?? lit(color, 0.25)} fillOpacity={o.glass ? 0.6 : 1} stroke={INK} strokeWidth={f2((o.ink ?? inkW((A.s + Bp.s) / 2)) * 0.7)} />}
      {(o.spec ?? 1) > 0 && L > R && <path d={`M${f2(A.x + n.x * R * 0.5)},${f2(A.y + n.y * R * 0.5)} L${f2(Bp.x + n.x * R * 0.5)},${f2(Bp.y + n.y * R * 0.5)}`} stroke="#FFFFFF" strokeWidth={f2(Math.max(0.6, R * 0.22))} strokeLinecap="round" opacity={0.45 * (o.spec ?? 1)} />}
    </g>
  );
  return {z: (A.z + Bp.z) / 2 + (o.zBias ?? 0), el};
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** a flexible clear tube along world points, drawn as one item */
export const tubeItem = (B: Basis, pts: V3[], r: number, o: {z?: number; color?: string; inner?: string; key?: string; flow?: number; flowColor?: string} = {}): Item => {
  // the route is sampled densely in 3D (spline3) and drawn segment by segment, each at its own perspective width, in
  // three passes (ink, body, highlight) so the outline stays continuous and the tube tapers with distance
  const sp = pts.map((p) => proj(B, p)).filter((p) => p.z > 3);
  if (sp.length < 2) return {z: -1, el: null};
  const segs = sp.slice(1).map((q, i) => ({a: sp[i], b: q, w: r * (sp[i].s + q.s)}));
  const seg = (k: string, w: (x: {w: number}) => number, color: string, op = 1, dx = 0, dy = 0) => (
    <g key={k} opacity={op}>
      {segs.map((x, i) => (
        <path key={i} d={`M${(x.a.x + dx * x.w).toFixed(1)},${(x.a.y + dy * x.w).toFixed(1)} L${(x.b.x + dx * x.w).toFixed(1)},${(x.b.y + dy * x.w).toFixed(1)}`} stroke={color} strokeWidth={Math.max(0.6, w(x)).toFixed(2)} strokeLinecap="round" />
      ))}
    </g>
  );
  const id = nid('tb');
  const el = (
    <g key={o.key ?? id}>
      {seg('i', (x) => x.w + 2 * inkW(x.w / (2 * r)), INK)}
      {seg('b', (x) => x.w, o.color ?? '#DDEBF1')}
      {seg('c', (x) => x.w * 0.42, o.inner ?? '#C3D7E0', 0.8)}
      {seg('h', (x) => x.w * 0.16, '#FFFFFF', 0.7, -0.2, -0.22)}
    </g>
  );
  return {z: o.z ?? sp.reduce((s, p) => s + p.z, 0) / sp.length, el};
};

/** a soft contact shadow on a horizontal surface at z0 under world point c */
export const shadowItem = (B: Basis, c: V3, rx: number, ry: number, alpha: number, z0: number, o: {zBias?: number; yaw?: number} = {}): Item => {
  const pts: V2[] = Array.from({length: 24}, (_, i) => {
    const t = (i / 24) * 2 * Math.PI;
    const yaw = ((o.yaw ?? 0) * Math.PI) / 180;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    return proj(B, [c[0] + x * Math.cos(yaw) - y * Math.sin(yaw), c[1] + x * Math.sin(yaw) + y * Math.cos(yaw), z0]);
  });
  const C = proj(B, [c[0], c[1], z0]);
  const id = nid('sh');
  const R = Math.max(...pts.map((p) => Math.hypot(p.x - C.x, p.y - C.y)));
  const el = (
    <g key={id}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(C.x)} cy={f2(C.y)} r={f2(R)}>
          <stop offset="0" stopColor="#0E1B24" stopOpacity={alpha} />
          <stop offset="0.55" stopColor="#0E1B24" stopOpacity={alpha * 0.55} />
          <stop offset="1" stopColor="#0E1B24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={smoothClosed(pts)} fill={`url(#${id})`} />
    </g>
  );
  return {z: C.z + 1e6 + (o.zBias ?? 0), el};
};

/** sort far -> near and render */
/** items whose centre is behind (or nearly at) the lens are dropped */
export const Items: React.FC<{items: Item[]}> = ({items}) => <>{items.filter((it) => it.z > 2).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}</>;

export {lerp3, mix, depth};
