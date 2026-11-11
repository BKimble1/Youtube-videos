// V2: world polygons projected, clipped at the near plane AND to a generous screen rectangle (Sutherland-Hodgman), so
// no path ever carries the enormous coordinates a near-plane clip can produce (headless Chrome mis-rasterised those,
// filling whole frames). Same contract as core/three.ts projPoly: '' if nothing is left.
import {Basis, dot3, lerp3, proj, sub3, V3} from '../core/three';

type P = {x: number; y: number};
const X0 = -1500, X1 = 2580, Y0 = -1500, Y1 = 3420;
const clipEdge = (pts: P[], inside: (p: P) => boolean, cut: (a: P, b: P) => P): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) out.push(cut(a, b));
  }
  return out;
};
const atX = (x: number) => (a: P, b: P): P => ({x, y: a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x)});
const atY = (y: number) => (a: P, b: P): P => ({x: a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y), y});
export const projPolyClip = (B: Basis, pts: V3[], near = 4): string => {
  const dz = (p: V3) => dot3(sub3(p, B.eye), B.fw);
  const w: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = dz(a) - near, db = dz(b) - near;
    if (da >= 0) w.push(a);
    if ((da >= 0) !== (db >= 0)) w.push(lerp3(a, b, da / (da - db)));
  }
  if (w.length < 3) return '';
  let s: P[] = w.map((p) => proj(B, p));
  s = clipEdge(s, (p) => p.x >= X0, atX(X0));
  if (s.length) s = clipEdge(s, (p) => p.x <= X1, atX(X1));
  if (s.length) s = clipEdge(s, (p) => p.y >= Y0, atY(Y0));
  if (s.length) s = clipEdge(s, (p) => p.y <= Y1, atY(Y1));
  if (s.length < 3) return '';
  return `M${s.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')} Z`;
};
