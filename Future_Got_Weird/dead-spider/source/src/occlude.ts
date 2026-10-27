// Explicit occlusion between limbs and bodies. The painter's sort orders every part by the depth of its centre, which
// is wrong for a thin limb lying alongside a big rounded body: a leg just in front of the body's surface can sort behind
// it, and a leg behind the body can sort in front of it, flipping as the camera moves. Here each limb segment is tested
// against each body ellipsoid along the actual line of sight: where it overlaps the body on screen, it is placed in
// front of the body if it is nearer than the body's surface along that ray, and behind it otherwise.
import {ABD, PRO, SpiderPose, toWorld} from './spider';
import {Basis, depth, dot3, sub3, V3} from './three';

export type Ell = {c: V3; ax: [V3, V3, V3]};
/** the two body sections of a spider as world ellipsoids */
export const spiderBodies = (P: SpiderPose): Ell[] => {
  const W = (p: V3) => toWorld(P, p);
  const o = W([0, 0, 0]);
  const ax = (v: V3): V3 => sub3(W(v), o);
  const aC = W([ABD.x, 0, ABD.z]);
  const axA = (v: V3): V3 => sub3(W([ABD.x + v[0], v[1], ABD.z + v[2]]), aC);
  return [
    {c: o, ax: [ax([PRO.a, 0, 0]), ax([0, PRO.b, 0]), ax([0, 0, PRO.c])]},
    {c: aC, ax: [axA([ABD.a, 0, 0]), axA([0, ABD.b, 0]), axA([0, 0, ABD.c])]},
  ];
};
/** where a point is relative to an ellipsoid along the eye's ray: 0 = not over it, 1 = in front, -1 = behind/inside */
const status = (B: Basis, q: V3, e: Ell): number => {
  const o = [0, 1, 2].map((i) => dot3(sub3(B.eye, e.c), e.ax[i]) / dot3(e.ax[i], e.ax[i]));
  const v = [0, 1, 2].map((i) => dot3(sub3(q, B.eye), e.ax[i]) / dot3(e.ax[i], e.ax[i]));
  const qq = o.map((x, i) => x + v[i]);
  if (qq[0] * qq[0] + qq[1] * qq[1] + qq[2] * qq[2] < 1) return -1;
  const a = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  const b = 2 * (o[0] * v[0] + o[1] * v[1] + o[2] * v[2]);
  const c = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - 1;
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return 0;
  const s1 = (-b - Math.sqrt(disc)) / (2 * a);
  if (s1 <= 0) return 0;
  return s1 < 1 ? -1 : 1;
};
/** the depth to give a limb segment a-b (natural depth z0) so it sorts correctly against the bodies */
export const limbDepth = (B: Basis, a: V3, b: V3, z0: number, bodies: Ell[]): number => {
  let lo = -Infinity, hi = Infinity;
  for (const e of bodies) {
    let f = 0, bh = 0;
    for (const u of [0.15, 0.5, 0.85]) {
      const s = status(B, [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], e);
      if (s > 0) f++;
      else if (s < 0) bh++;
    }
    if (f + bh === 0) continue;
    const cz = depth(B, e.c);
    const thick = Math.min(Math.hypot(...e.ax[0]), Math.hypot(...e.ax[1]), Math.hypot(...e.ax[2]));
    // in front: nearer than everything drawn on the body's surface (eyes, markings); behind: farther than its centre
    if (f > bh) hi = Math.min(hi, cz - thick * 1.12 - 0.02);
    else lo = Math.max(lo, cz + 0.02);
  }
  if (lo <= hi) return Math.min(Math.max(z0, lo), hi);
  return (lo + hi) / 2;
};
/** true when a point is hidden behind (or inside) any of the bodies from the eye */
export const pointHidden = (B: Basis, q: V3, bodies: Ell[]) => bodies.some((e) => status(B, q, e) < 0);
