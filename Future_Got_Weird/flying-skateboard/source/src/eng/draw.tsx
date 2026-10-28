// Drawing layer for the projected 3D geometry, in the Weird Crew finish: flat vector fills with a soft gradient from
// the one warm key light (upper left), a thin ink contour (the crew's selective edge, dc/ink.tsx OUTLINE_K) and glossy
// highlights. Contour width scales with the object's projected size, so a far rider and a close-up share one look.
import React from 'react';
import {INK} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {a3, c3, d3, Lens, m3, n3, s3, V3} from './v3';

export type P2 = {x: number; y: number};
export const f2 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
export const pt = (p: P2) => `${f2(p.x)},${f2(p.y)}`;
export const LIGHT2: P2 = {x: -0.62, y: -0.78};
/** world direction TOWARD the key light (warm sun, upper left behind the camera side) */
export const SUN: V3 = n3({x: -0.45, y: 0.8, z: -0.4});

export const polyD = (pts: P2[], closed = true) => (pts.length ? `M${pts.map(pt).join(' L')}${closed ? ' Z' : ''}` : '');
/** Catmull-Rom closed curve through the points (rounded silhouettes). */
export const smoothD = (pts: P2[], tension = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return polyD(pts);
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) * tension, y: p1.y + (p2.y - p0.y) * tension};
    const c2 = {x: p2.x - (p3.x - p1.x) * tension, y: p2.y - (p3.y - p1.y) * tension};
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + ' Z';
};
/** Open Catmull-Rom curve. */
export const curveD = (pts: P2[], tension = 1 / 6) => {
  const n = pts.length;
  if (n < 2) return '';
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = {x: p1.x + (p2.x - p0.x) * tension, y: p1.y + (p2.y - p0.y) * tension};
    const c2 = {x: p2.x - (p3.x - p1.x) * tension, y: p2.y - (p3.y - p1.y) * tension};
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};
/** Convex hull (monotone chain), counter-clockwise. */
export const hull = (ps: P2[]): P2[] => {
  const p = ps.filter((q) => isFinite(q.x) && isFinite(q.y)).sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
};
/** Round off a hull: drop near-duplicate points so the smooth curve does not kink. */
export const thin = (ps: P2[], minD: number) => {
  const o: P2[] = [];
  for (const q of ps) if (!o.length || Math.hypot(q.x - o[o.length - 1].x, q.y - o[o.length - 1].y) > minD) o.push(q);
  if (o.length > 3 && Math.hypot(o[0].x - o[o.length - 1].x, o[0].y - o[o.length - 1].y) < minD) o.pop();
  return o;
};
export const bbox = (ps: P2[]) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const q of ps) {
    x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y);
  }
  return {x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, r: Math.max(1, Math.hypot(x1 - x0, y1 - y0) / 2)};
};

/** Points of a 3D circle (centre, unit axes u and v spanning its plane, radius). */
export const circ3 = (c: V3, u: V3, v: V3, r: number, n = 28, a0 = 0, a1 = Math.PI * 2): V3[] => {
  const o: V3[] = [];
  const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const N = closed ? n : n + 1;
  for (let i = 0; i < N; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    o.push(a3(c, a3(m3(u, Math.cos(a) * r), m3(v, Math.sin(a) * r))));
  }
  return o;
};
export const proj = (L: Lens, ps: V3[]): P2[] => ps.map((q) => L.p(q));

/** Ink contour width (px) for an object of a given projected scale (px per metre). */
export const inkW = (k: number, base = 0.0046) => Math.min(4.2, Math.max(0.7, k * base));

/** Gradient fill from the key light across a screen box: lit upper-left, cool shadow lower-right. */
export const LinFill: React.FC<{id: string; b: ReturnType<typeof bbox>; color: string; k?: number; dir?: P2}> = ({id, b, color, k = 1, dir = LIGHT2}) => {
  const r = b.r;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(b.cx + dir.x * r)} y1={f2(b.cy + dir.y * r)} x2={f2(b.cx - dir.x * r)} y2={f2(b.cy - dir.y * r)}>
      <stop offset="0" stopColor={lit(color, 0.28 * k)} />
      <stop offset="0.45" stopColor={color} />
      <stop offset="1" stopColor={shade(color, 0.32 * k)} />
    </linearGradient>
  );
};

/** One inked, gradient-filled shape. paint-order puts the contour under the fill (half its width shows outside). */
export const Shape: React.FC<{id: string; d: string; pts?: P2[]; color: string; w: number; k?: number; flat?: boolean; opacity?: number; ink?: string}> = ({id, d, pts, color, w, k = 1, flat, opacity, ink = INK}) => {
  if (flat || !pts) return <path d={d} fill={color} stroke={ink} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" opacity={opacity} />;
  const b = bbox(pts);
  return (
    <g opacity={opacity}>
      <defs>
        <LinFill id={id} b={b} color={color} k={k} />
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={ink} strokeWidth={f2(w * 2)} strokeLinejoin="round" paintOrder="stroke" />
    </g>
  );
};

/** Several shapes sharing one contour: all inks first, then all fills (the crew's merged silhouette). */
export const Merged: React.FC<{id: string; parts: {d: string; pts: P2[]; color: string; k?: number; flat?: boolean}[]; w: number; opacity?: number}> = ({id, parts, w, opacity}) => (
  <g opacity={opacity}>
    {parts.map((p, i) => (
      <path key={`i${i}`} d={p.d} fill={INK} stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" />
    ))}
    {parts.map((p, i) => {
      const b = bbox(p.pts);
      return (
        <g key={`f${i}`}>
          {!p.flat && (
            <defs>
              <LinFill id={`${id}-${i}`} b={b} color={p.color} k={p.k ?? 1} />
            </defs>
          )}
          <path d={p.d} fill={p.flat ? p.color : `url(#${id}-${i})`} />
        </g>
      );
    })}
  </g>
);

/** Visible region of a sphere patch (convex patches only): sample the patch, keep camera-facing points, push the
 *  back-facing ones out to the silhouette, and take the hull. */
export const spherePatch = (L: Lens, c: V3, R: number, inside: (d: V3) => boolean, n = 18): P2[] => {
  const pc = L.p(c);
  const toCam = n3(s3(L.pos, c));
  const pts: P2[] = [];
  const rad = R * pc.k;
  for (let i = 0; i <= n; i++) {
    const th = (Math.PI * i) / n;
    for (let j = 0; j < n * 2; j++) {
      const ph = (Math.PI * j) / n;
      const d: V3 = {x: Math.sin(th) * Math.cos(ph), y: Math.cos(th), z: Math.sin(th) * Math.sin(ph)};
      if (!inside(d)) continue;
      const q = L.p(a3(c, m3(d, R)));
      if (d3(d, toCam) >= 0) pts.push(q);
      else {
        const a = Math.atan2(q.y - pc.y, q.x - pc.x);
        pts.push({x: pc.x + Math.cos(a) * rad, y: pc.y + Math.sin(a) * rad});
      }
    }
  }
  return hull(pts);
};
/** V5: the exact visible outline of a region on a sphere (centre c, radius R) bounded by a closed loop of unit
 *  directions `loop` given in a frame that moves with the object (so the outline turns rigidly with it, with no
 *  sampling grid to quantise it). The loop is clipped where it passes behind the sphere's visible rim (the circle of
 *  tangency seen from the camera, which projects to the silhouette); between where it leaves and re-enters the visible
 *  side, the outline follows that rim, on the side that lies inside the region (`inside`). Empty when nothing is in
 *  view. Works for non-convex regions; the result changes continuously as the object or the camera moves. */
export const sphereRegion = (L: Lens, c: V3, R: number, loop: V3[], inside: (d: V3) => boolean, arcStep = 0.08): P2[] => {
  const toC = s3(L.pos, c);
  const dist = Math.hypot(toC.x, toC.y, toC.z);
  if (dist <= R * 1.001) return [];
  const t = n3(toC);
  const c0 = R / dist;
  const sr = Math.sqrt(1 - c0 * c0);
  const sv = (d: V3) => d3(d, t) - c0;
  const n = loop.length;
  let start = -1;
  for (let i = 0; i < n; i++) if (sv(loop[i]) >= 0) {
    start = i;
    break;
  }
  const proj3 = (d: V3) => L.p(a3(c, m3(d, R)));
  if (start < 0) {
    // the rim is entirely out of sight: the region is either the whole visible side or nothing
    if (!inside(t)) return [];
    const e1 = n3(Math.abs(t.y) < 0.9 ? c3(t, {x: 0, y: 1, z: 0}) : c3(t, {x: 1, y: 0, z: 0}));
    const e2 = c3(t, e1);
    return Array.from({length: 64}, (_, k) => {
      const a = (k / 64) * Math.PI * 2;
      return proj3(a3(m3(t, c0), a3(m3(e1, sr * Math.cos(a)), m3(e2, sr * Math.sin(a)))));
    });
  }
  // a point on the visible rim at the same bearing (around the view axis) as direction d
  const onRim = (d: V3) => {
    const q = s3(d, m3(t, d3(d, t)));
    const ql = Math.hypot(q.x, q.y, q.z) || 1;
    return a3(m3(t, c0), m3(q, sr / ql));
  };
  const out: V3[] = [];
  let exitAt: V3 | null = null;
  const arc = (from: V3, to: V3) => {
    const e1 = n3(s3(from, m3(t, d3(from, t))));
    const e2 = c3(t, e1);
    let phi = Math.atan2(d3(to, e2), d3(to, e1));
    if (phi < 0) phi += Math.PI * 2;
    // two ways round: take the one whose middle lies inside the region
    const at = (a: number) => a3(m3(t, c0), a3(m3(e1, sr * Math.cos(a)), m3(e2, sr * Math.sin(a))));
    const fwd = inside(n3(at(phi / 2)));
    const total = fwd ? phi : phi - Math.PI * 2;
    const steps = Math.max(1, Math.ceil(Math.abs(total) / arcStep));
    for (let k = 1; k < steps; k++) out.push(at((total * k) / steps));
  };
  for (let k = 0; k < n; k++) {
    const a = loop[(start + k) % n], b = loop[(start + k + 1) % n];
    const sa = sv(a), sb = sv(b);
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const x = onRim(n3(a3(m3(a, sb / (sb - sa)), m3(b, -sa / (sb - sa)))));
      if (sa >= 0) {
        out.push(x);
        exitAt = x;
      } else {
        if (exitAt) arc(exitAt, x);
        out.push(x);
        exitAt = null;
      }
    }
  }
  return out.map(proj3);
};

/** silhouette circle of a sphere */
export const sphereD = (L: Lens, c: V3, R: number) => {
  const p = L.p(c);
  const r = R * p.k;
  return {d: `M${f2(p.x - r)},${f2(p.y)} a${f2(r)},${f2(r)} 0 1,0 ${f2(2 * r)},0 a${f2(r)},${f2(r)} 0 1,0 ${f2(-2 * r)},0 Z`, p, r};
};
/** Lambert-ish tone of a world-space normal under the sun: 0 (shadow) .. 1 (lit) */
export const tone = (nrm: V3) => Math.max(0, Math.min(1, 0.5 + 0.5 * d3(n3(nrm), SUN)));
export const toneColor = (base: string, nrm: V3, k = 1) => {
  const t = tone(nrm);
  return t > 0.5 ? lit(base, (t - 0.5) * 0.55 * k) : shade(base, (0.5 - t) * 0.75 * k);
};
export {mix, lit, shade, c3};
