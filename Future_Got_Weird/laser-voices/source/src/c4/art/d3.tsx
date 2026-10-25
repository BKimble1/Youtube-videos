// Flat Crew-style solids in the shared world: every face is a flat fill with one cel tone (lit top, base front, darker
// sides) and an ink outline, projected by the shot's pinhole camera, darkened toward the room's air with distance.
// Items carry their camera depth so a shot can paint everything (set, props, characters) far to near.
import React from 'react';
import {mixHex} from '../lib';
import {INK} from '../rig/cast';
import {B, dot3, pathOf, proj, projPoly, sub3, V3, v3} from '../rig/geo';

export type Item = {d: number; node: React.ReactNode; layer?: number};
export const AIR = {col: '#EFE2C4', near: 7, far: 26};
export const hz = (d: number) => Math.max(0, Math.min(0.55, ((d - AIR.near) / (AIR.far - AIR.near)) * 0.55));
export const depth = (b: B, p: V3) => dot3(sub3(p, b.c.pos), b.fwd);
export const inkPx = (b: B, d: number, k = 1) => Math.max(0.7, Math.min(6, (b.c.f * 0.0034 * k) / Math.max(d, 0.08)));
export const lighten = (c: string, t: number) => mixHex(c, '#FFFFFF', t);
export const darken = (c: string, t: number) => mixHex(c, '#1B2B33', t);
const ctr = (pts: V3[]) => pts.reduce((s, q) => v3(s.x + q.x / pts.length, s.y + q.y / pts.length, s.z + q.z / pts.length), v3(0, 0, 0));
let K = 0;

/** one flat polygon */
export const poly = (b: B, pts: V3[], fill: string, o: {stroke?: boolean; sw?: number; op?: number; layer?: number; bias?: number; key?: string; n?: V3; glow?: boolean} = {}): Item | null => {
  if (o.n && dot3(o.n, sub3(b.c.pos, pts[0])) <= 0) return null;
  const P = projPoly(b, pts, 0.03);
  if (P.length < 3) return null;
  const d = depth(b, ctr(pts));
  const h = hz(d) * (o.glow ? 0.4 : 1);
  return {
    d: d + (o.bias ?? 0),
    layer: o.layer,
    node: <path key={o.key ?? `p${K++}`} d={pathOf(P)} fill={mixHex(fill, AIR.col, h)} opacity={o.op ?? 1} stroke={o.stroke === false ? 'none' : mixHex(INK, AIR.col, h * 0.8)} strokeWidth={inkPx(b, d, o.sw ?? 1)} strokeLinejoin="round" />,
  };
};
/** a line in the world */
export const seg = (b: B, a: V3, c: V3, col: string, w: number, o: {layer?: number; bias?: number; dash?: string; op?: number} = {}): Item | null => {
  const P = projPoly(b, [a, c], 0.03);
  if (P.length < 2) return null;
  const d = depth(b, v3((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2));
  return {d: d + (o.bias ?? 0), layer: o.layer, node: <line key={`l${K++}`} x1={P[0].x} y1={P[0].y} x2={P[1].x} y2={P[1].y} stroke={mixHex(col, AIR.col, hz(d))} strokeWidth={inkPx(b, d, w)} strokeLinecap="round" strokeDasharray={o.dash} opacity={o.op ?? 1} />};
};

export type Cols = {top: string; front: string; side: string};
export const tones = (c: string): Cols => ({top: lighten(c, 0.16), front: c, side: darken(c, 0.16)});
/** an axis-aligned box; faces turned toward the camera only, painted as ONE item (so its faces never interleave) */
export const box = (b: B, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: Cols | string, o: {layer?: number; bias?: number; sw?: number} = {}): Item | null => {
  const cols = typeof c === 'string' ? tones(c) : c;
  const P = (x: number, y: number, z: number) => v3(x, y, z);
  const faces: [V3, V3[], string][] = [
    [v3(0, 0, -1), [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], cols.front],
    [v3(0, 0, 1), [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], cols.front],
    [v3(-1, 0, 0), [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], cols.side],
    [v3(1, 0, 0), [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], cols.side],
    [v3(0, 1, 0), [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], cols.top],
    [v3(0, -1, 0), [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], darken(cols.side, 0.2)],
  ];
  const cen = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const d = depth(b, cen);
  const h = hz(d);
  const nodes: React.ReactNode[] = [];
  for (const [n, pts, col] of faces) {
    const fc = v3((pts[0].x + pts[2].x) / 2, (pts[0].y + pts[2].y) / 2, (pts[0].z + pts[2].z) / 2);
    if (dot3(n, sub3(b.c.pos, fc)) <= 0) continue;
    const Q = projPoly(b, pts, 0.03);
    if (Q.length < 3) continue;
    nodes.push(<path key={nodes.length} d={pathOf(Q)} fill={mixHex(col, AIR.col, h)} stroke={mixHex(INK, AIR.col, h * 0.8)} strokeWidth={inkPx(b, d, o.sw ?? 1)} strokeLinejoin="round" />);
  }
  if (!nodes.length) return null;
  return {d: d + (o.bias ?? 0), layer: o.layer, node: <g key={`b${K++}`}>{nodes}</g>};
};
/** a vertical or horizontal cylinder (axis: 'y' up from base, or 'x' along +x from base): flat side with a lit half,
 *  the cap facing the camera, one ink silhouette */
export const cyl = (b: B, base: V3, axis: 'x' | 'y' | 'z', len: number, r: number, c: Cols | string, o: {layer?: number; bias?: number; n?: number; cap?: string; sw?: number} = {}): Item | null => {
  const cols = typeof c === 'string' ? tones(c) : c;
  const n = o.n ?? 20;
  const ring = (s: number) =>
    Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const u = Math.cos(a) * r, w = Math.sin(a) * r;
      return axis === 'y' ? v3(base.x + u, base.y + s, base.z + w) : axis === 'x' ? v3(base.x + s, base.y + u, base.z + w) : v3(base.x + u, base.y + w, base.z + s);
    });
  const r0 = ring(0), r1 = ring(len);
  const A = r0.map((p) => proj(b, p)), Bp = r1.map((p) => proj(b, p));
  if (A.some((p) => p.z < 0.03) || Bp.some((p) => p.z < 0.03)) return null;
  // convex hull of both rings = the silhouette
  const all = [...A, ...Bp].map((p) => ({x: p.x, y: p.y}));
  const hull = (() => {
    const p = [...all].sort((a, c2) => a.x - c2.x || a.y - c2.y);
    const cr = (o2: {x: number; y: number}, a: {x: number; y: number}, c2: {x: number; y: number}) => (a.x - o2.x) * (c2.y - o2.y) - (a.y - o2.y) * (c2.x - o2.x);
    const lo: typeof p = [];
    for (const q of p) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    const up: typeof p = [];
    for (const q of [...p].reverse()) {
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  })();
  const cen = axis === 'y' ? v3(base.x, base.y + len / 2, base.z) : axis === 'x' ? v3(base.x + len / 2, base.y, base.z) : v3(base.x, base.y, base.z + len / 2);
  const d = depth(b, cen);
  const h = hz(d);
  // which cap faces the camera
  const ax = axis === 'y' ? v3(0, 1, 0) : axis === 'x' ? v3(1, 0, 0) : v3(0, 0, 1);
  const endFront = dot3(ax, sub3(b.c.pos, cen)) > 0;
  const cap = endFront ? Bp : A;
  // the lit half of the side: the side strip toward screen-left (key light upper-left)
  const mid = (i: number) => ({x: (A[i].x + Bp[i].x) / 2, y: (A[i].y + Bp[i].y) / 2});
  let li = 0;
  A.forEach((_, i) => {
    if (mid(i).x - mid(i).y * 0.3 < mid(li).x - mid(li).y * 0.3) li = i;
  });
  const lit = [li - 3, li - 2, li - 1, li, li + 1, li + 2, li + 3].map((i) => (i + n) % n);
  const litPoly = [...lit.map((i) => A[i]), ...lit.slice().reverse().map((i) => Bp[i])];
  const node = (
    <g key={`c${K++}`}>
      <path d={pathOf(hull)} fill={mixHex(cols.side, AIR.col, h)} />
      <path d={pathOf(litPoly)} fill={mixHex(cols.front, AIR.col, h)} />
      <path d={pathOf(cap)} fill={mixHex(o.cap ?? cols.top, AIR.col, h)} stroke={mixHex(INK, AIR.col, h * 0.8)} strokeWidth={inkPx(b, d, (o.sw ?? 1) * 0.8)} />
      <path d={pathOf(hull)} fill="none" stroke={mixHex(INK, AIR.col, h * 0.8)} strokeWidth={inkPx(b, d, o.sw ?? 1)} strokeLinejoin="round" />
    </g>
  );
  return {d: d + (o.bias ?? 0), layer: o.layer, node};
};
/** paint: layer first (lower first), then far to near */
export const paint = (items: (Item | null | undefined)[]) =>
  items
    .filter((i): i is Item => !!i)
    .sort((a, c) => (a.layer ?? 1) - (c.layer ?? 1) || c.d - a.d)
    .map((i, k) => <React.Fragment key={k}>{i.node}</React.Fragment>);
