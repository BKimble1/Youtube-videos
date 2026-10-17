// The broken water main (world/set.tsx 'waterMain') is two 0.9 m box beams 21 m and 12 m long, each side ONE face: its
// painter depth is the middle of that face, so where a figure stands a metre or two in front of the beam's near end
// the whole beam draws over them (D3-4b, D3-10). D3 swaps in the same mesh with its long faces cut into ≤1.5 m strips
// (same vertices, same materials; the cuts are coplanar so they take no ink). PURE.
import type {Item, MeshItem, Mesh, Face} from '../../engine';
import {prep} from '../../engine';
import type {V3} from '../../../kit/math';

const lerpV = (a: V3, b: V3, k: number): V3 => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k});
const dist = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** cut every quad whose long sides exceed `maxLen` into strips across them; shared vertices are merged by position */
export const splitLong = (m: Mesh, maxLen: number): Mesh => {
  const verts: V3[] = [];
  const idx = new Map<string, number>();
  const vi = (p: V3) => {
    const k = `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;
    let i = idx.get(k);
    if (i === undefined) { i = verts.length; verts.push(p); idx.set(k, i); }
    return i;
  };
  const faces: Face[] = [];
  m.faces.forEach((f) => {
    const P = f.v.map((i) => m.verts[i]);
    if (P.length !== 4) { faces.push({...f, v: P.map(vi)}); return; }
    // long sides: 0→1 and 3→2, or 1→2 and 0→3
    const a = Math.max(dist(P[0], P[1]), dist(P[3], P[2])), b = Math.max(dist(P[1], P[2]), dist(P[0], P[3]));
    const [p0, p1, p2, p3] = a >= b ? P : [P[1], P[2], P[3], P[0]];
    const L = Math.max(a, b), n = Math.max(1, Math.ceil(L / maxLen));
    for (let s = 0; s < n; s++) {
      const k0 = s / n, k1 = (s + 1) / n;
      faces.push({...f, v: [vi(lerpV(p0, p1, k0)), vi(lerpV(p0, p1, k1)), vi(lerpV(p3, p2, k1)), vi(lerpV(p3, p2, k0))]});
    }
  });
  // (a box beam's four long edges are equal, so both faces on an edge cut it at the same points: no T-junctions; the
  // 0.9 m caps are not cut)
  return {...m, verts, faces};
};

let MAIN: {src: unknown; out: MeshItem['mesh']} | null = null;
/** the set's items with the water main swapped for the cut copy */
export const splitMain = (items: Item[]): Item[] => items.map((it) => {
  if (it.kind !== 'mesh' || it.key !== 'waterMain') return it;
  if (!MAIN || MAIN.src !== it.mesh) MAIN = {src: it.mesh, out: prep(splitLong(it.mesh, 1.5))};
  return {...it, mesh: MAIN.out};
});
