// V4 3D drawing helpers: world polygons, boxes, cylinders and lines through one camera, clipped to the near plane;
// items carry their camera depth so a scene can be painted far to near.
import React from 'react';
import {B, dot3, proj, projPoly, sub3, V3, v3, pathOf} from './rig/geo4';
import {INK} from './rig/cast4';

export type Item = {d: number; node: React.ReactNode};
export const depthOf = (b: B, p: V3) => dot3(sub3(p, b.c.pos), b.fwd);
const meanDepth = (b: B, pts: V3[]) => pts.reduce((s, p) => s + depthOf(b, p), 0) / pts.length;
export const visible = (b: B, p: V3, n: V3) => dot3(sub3(b.c.pos, p), n) > 0;

type Sty = {fill?: string; stroke?: string; sw?: number; op?: number; dash?: string};
export const polyNode = (b: B, pts: V3[], s: Sty, key?: string | number): React.ReactNode => {
  const q = projPoly(b, pts);
  if (q.length < 3) return null;
  return <path key={key} d={pathOf(q)} fill={s.fill ?? 'none'} stroke={s.stroke ?? 'none'} strokeWidth={s.sw ?? 0} strokeLinejoin="round" opacity={s.op ?? 1} strokeDasharray={s.dash} />;
};
export const poly = (b: B, pts: V3[], s: Sty, key?: string | number, bias = 0): Item => ({d: meanDepth(b, pts) + bias, node: polyNode(b, pts, s, key)});

/** A line segment (clipped to the near plane). */
export const lineNode = (b: B, a: V3, c: V3, s: Sty & {cap?: 'round' | 'butt'}, key?: string | number): React.ReactNode => {
  const near = 0.05;
  const da = depthOf(b, a) - near, dc = depthOf(b, c) - near;
  if (da < 0 && dc < 0) return null;
  let A = a, C = c;
  if (da < 0) A = v3(a.x + (c.x - a.x) * (da / (da - dc)), a.y + (c.y - a.y) * (da / (da - dc)), a.z + (c.z - a.z) * (da / (da - dc)));
  if (dc < 0) C = v3(c.x + (a.x - c.x) * (dc / (dc - da)), c.y + (a.y - c.y) * (dc / (dc - da)), c.z + (a.z - c.z) * (dc / (dc - da)));
  const p = proj(b, A), q = proj(b, C);
  return <line key={key} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={s.stroke ?? INK} strokeWidth={s.sw ?? 2} strokeLinecap={s.cap ?? 'round'} opacity={s.op ?? 1} strokeDasharray={s.dash} />;
};
export const line = (b: B, a: V3, c: V3, s: Sty & {cap?: 'round' | 'butt'}, key?: string | number, bias = 0): Item => ({d: (depthOf(b, a) + depthOf(b, c)) / 2 + bias, node: lineNode(b, a, c, s, key)});

/** An axis-aligned box [x0,x1]x[y0,y1]x[z0,z1] (optionally yawed about its centre), visible faces only, one item. */
export const box = (b: B, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  col: {top: string; side: string; front: string; ink?: string; sw?: number}, key: string, yaw = 0, bias = 0): Item => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const R = (yaw * Math.PI) / 180, c = Math.cos(R), s = Math.sin(R);
  const P3 = (x: number, y: number, z: number) => v3(cx + (x - cx) * c + (z - cz) * s, y, cz - (x - cx) * s + (z - cz) * c);
  const N = (x: number, y: number, z: number) => v3(x * c + z * s, y, -x * s + z * c);
  const faces: [V3[], V3, string][] = [
    [[P3(x0, y1, z0), P3(x1, y1, z0), P3(x1, y1, z1), P3(x0, y1, z1)], N(0, 1, 0), col.top],
    [[P3(x0, y0, z0), P3(x1, y0, z0), P3(x1, y1, z0), P3(x0, y1, z0)], N(0, 0, -1), col.front],
    [[P3(x0, y0, z1), P3(x1, y0, z1), P3(x1, y1, z1), P3(x0, y1, z1)], N(0, 0, 1), col.front],
    [[P3(x0, y0, z0), P3(x0, y0, z1), P3(x0, y1, z1), P3(x0, y1, z0)], N(-1, 0, 0), col.side],
    [[P3(x1, y0, z0), P3(x1, y0, z1), P3(x1, y1, z1), P3(x1, y1, z0)], N(1, 0, 0), col.side],
    [[P3(x0, y0, z0), P3(x1, y0, z0), P3(x1, y0, z1), P3(x0, y0, z1)], N(0, -1, 0), col.side],
  ];
  const ctr = v3(cx, (y0 + y1) / 2, cz);
  const vis = faces.filter(([pts, n]) => visible(b, pts[0], n) && dot3(sub3(b.c.pos, ctr), n) > -1e9);
  return {
    d: depthOf(b, ctr) + bias,
    node: <g key={key}>{vis.map(([pts, , fill], i) => polyNode(b, pts, {fill, stroke: col.ink ?? INK, sw: col.sw ?? 2}, i))}</g>,
  };
};
/** A vertical cylinder (centre x,z, radius r, from y0 to y1): side band + top cap. */
export const cylNode = (b: B, x: number, z: number, r: number, y0: number, y1: number, col: {side: string; top: string; ink?: string; sw?: number}, key: string, n = 20): React.ReactNode => {
  const ring = (y: number) => Array.from({length: n}, (_, i) => v3(x + r * Math.cos((i / n) * 2 * Math.PI), y, z + r * Math.sin((i / n) * 2 * Math.PI)));
  const top = ring(y1), bot = ring(y0);
  const pt = top.map((p) => proj(b, p)), pb = bot.map((p) => proj(b, p));
  if (pt.some((p) => p.z < 0.06) || pb.some((p) => p.z < 0.06)) return null;
  const camAbove = b.c.pos.y > y1;
  const band = pathOf(hull([...pt, ...pb]));
  return (
    <g key={key}>
      <path d={band} fill={col.side} stroke={col.ink ?? INK} strokeWidth={col.sw ?? 2} strokeLinejoin="round" />
      {camAbove && <path d={pathOf(pt)} fill={col.top} stroke={col.ink ?? INK} strokeWidth={col.sw ?? 2} />}
    </g>
  );
};
export const cyl = (b: B, x: number, z: number, r: number, y0: number, y1: number, col: {side: string; top: string; ink?: string; sw?: number}, key: string, bias = 0): Item => ({d: depthOf(b, v3(x, (y0 + y1) / 2, z)) + bias, node: cylNode(b, x, z, r, y0, y1, col, key)});
export const hull = (pts: {x: number; y: number}[]) => {
  const p = [...pts].sort((a, c) => a.x - c.x || a.y - c.y);
  const cr = (o: {x: number; y: number}, a: {x: number; y: number}, c: {x: number; y: number}) => (a.x - o.x) * (c.y - o.y) - (a.y - o.y) * (c.x - o.x);
  const lo: typeof p = [], up: typeof p = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
export const paint = (items: Item[]) => items.filter((i) => i.node).sort((a, c) => c.d - a.d).map((i, k) => <React.Fragment key={k}>{i.node}</React.Fragment>);
export {proj, v3};

/** An oriented box: centre c, unit axes (a = forward, s = side, u = up) and half extents; visible faces only. */
export type Frame = {c: V3; a: V3; s: V3; u: V3};
export const frameAt = (fr: Frame, x: number, y: number, z: number): V3 =>
  v3(fr.c.x + fr.a.x * x + fr.s.x * y + fr.u.x * z, fr.c.y + fr.a.y * x + fr.s.y * y + fr.u.y * z, fr.c.z + fr.a.z * x + fr.s.z * y + fr.u.z * z);
export const aimFrame = (c: V3, yaw: number, pitch: number): Frame => {
  const Y = (yaw * Math.PI) / 180, Pp = (pitch * Math.PI) / 180;
  const a = v3(Math.sin(Y) * Math.cos(Pp), Math.sin(Pp), Math.cos(Y) * Math.cos(Pp));
  const s = v3(Math.cos(Y), 0, -Math.sin(Y));
  const u = v3(a.y * s.z - a.z * s.y, a.z * s.x - a.x * s.z, a.x * s.y - a.y * s.x);
  // make u point up
  const up = u.y < 0 ? v3(-u.x, -u.y, -u.z) : u;
  return {c, a, s, u: up};
};
export const obox = (b: B, fr: Frame, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number,
  col: {top: string; side: string; front: string; back?: string; bottom?: string; ink?: string; sw?: number}, key: string, skip: string[] = []): Item => {
  const P = (x: number, y: number, z: number) => frameAt(fr, x, y, z);
  const neg = (p: V3) => v3(-p.x, -p.y, -p.z);
  const faces: [string, V3[], V3, string][] = [
    ['top', [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fr.u, col.top],
    ['bottom', [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], neg(fr.u), col.bottom ?? col.side],
    ['front', [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fr.a, col.front],
    ['back', [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], neg(fr.a), col.back ?? col.front],
    ['left', [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fr.s, col.side],
    ['right', [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], neg(fr.s), col.side],
  ];
  const ctr = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const vis = faces.filter(([nm, pts, n]) => !skip.includes(nm) && visible(b, pts[0], n));
  return {d: depthOf(b, ctr), node: <g key={key}>{vis.map(([nm, pts, , fill]) => polyNode(b, pts, {fill, stroke: col.ink ?? INK, sw: col.sw ?? 2}, nm))}</g>};
};
