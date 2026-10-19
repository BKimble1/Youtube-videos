import {rnd, norm3, rotAxis, rad, add3, mul3, sub3, dot3, cross3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/kit/math';
import {brokenSlab} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/props';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {PLAN} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/plan';
import {_debug} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/set';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
// reconstruct the four slabs as set.tsx builds them: read their meshes from the static list (unsplit not available) -> use vertices of split mesh to define the prism
const {S} = _debug.getStatic();
const get = (k: string) => (S.find((s: any) => s.item.key === k) as any)?.item;
type Slab = {key: string; verts: any[]};
const slabs: any[] = [];
for (let i = 0; i < 4; i++) { const it = get(`rfloor_${i}`); slabs.push({key: `rfloor_${i}`, W: it.mesh.verts, faces: it.mesh.faces}); }
// point inside a (split) closed mesh? use ray casting along +y against all faces (triangulated fan)
const inside = (m: any, p: any): boolean => {
  let hits = 0;
  for (const f of m.faces) {
    const P = f.v.map((i: number) => m.verts[i]);
    for (let k = 1; k + 1 < P.length; k++) {
      const a = P[0], b = P[k], c = P[k + 1];
      // ray p + t*(0,1,0): intersect triangle in xz projection
      const d = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((p.x - a.x) * (c.z - a.z) - (p.z - a.z) * (c.x - a.x)) / d;
      const v = ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / d;
      if (u < 0 || v < 0 || u + v > 1) continue;
      const y = a.y + u * (b.y - a.y) + v * (c.y - a.y);
      if (y > p.y) hits++;
    }
  }
  return hits % 2 === 1;
};
for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
  const A = slabs[i], B = slabs[j];
  let n = 0, tot = 0;
  for (const v of A.W) { tot++; if (inside({verts: B.W, faces: B.faces}, v)) n++; }
  for (const v of B.W) { tot++; if (inside({verts: A.W, faces: A.faces}, v)) n++; }
  console.log(A.key, B.key, 'vertices inside the other slab', n, '/', tot);
}
// columns
for (let c = 0; c < 5; c++) {
  const it = get(`rcol_${c}`); const cm = it.mesh;
  for (let i = 0; i < 4; i++) {
    const B = slabs[i]; let n = 0;
    for (const v of cm.verts) if (inside({verts: B.W, faces: B.faces}, v)) n++;
    // slab verts inside column box
    const xs = cm.verts.map((v: any) => v.x), ys = cm.verts.map((v: any) => v.y), zs = cm.verts.map((v: any) => v.z);
    let m = 0; for (const v of B.W) if (v.x > Math.min(...xs) && v.x < Math.max(...xs) && v.z > Math.min(...zs) && v.z < Math.max(...zs) && v.y > 0 && v.y < Math.max(...ys)) m++;
    if (n || m) console.log(`rcol_${c} vs ${B.key}: column verts inside slab ${n}, slab verts inside column ${m}`);
  }
}
