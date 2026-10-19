import {crewC, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView, xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {setItems} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/set';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {vaultWallItems} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/props';
const v = makeView(camPath(CAM_C3, 1, 0.5));
const T0 = parseFloat(process.argv[2] ?? '38'), T1 = parseFloat(process.argv[3] ?? '54'), dt = parseFloat(process.argv[4] ?? '0.1');
const items = [...setItems(v, 40, {}), ...vaultWallItems()] as any[];
type Tri = {a: any; b: any; c: any};
const meshes: {key: string; tris: Tri[]; box: number[]}[] = [];
for (const it of items) {
  if (it.kind !== 'mesh') continue;
  const m = it.mesh; const xf = it.xf;
  const W = m.verts.map((p: any) => (xf ? xfPoint(p, xf) : p));
  // region filter
  let xmin = 1e9, xmax = -1e9, zmin = 1e9, zmax = -1e9, ymin = 1e9, ymax = -1e9;
  for (const p of W) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); zmin = Math.min(zmin, p.z); zmax = Math.max(zmax, p.z); ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); }
  if (xmax < -12 || xmin > 4 || zmax < -6 || zmin > 14) continue;
  if (xmax - xmin > 60) continue; // ground tiles
  const tris: Tri[] = [];
  for (const f of m.faces) { const P = f.v.map((i: number) => W[i]); for (let k = 1; k + 1 < P.length; k++) tris.push({a: P[0], b: P[k], c: P[k + 1]}); }
  meshes.push({key: it.key ?? '?', tris, box: [xmin, xmax, ymin, ymax, zmin, zmax]});
}
console.log('meshes in region', meshes.length, meshes.map((m) => m.key).join(' '));
// depth of p below the lowest surface above it (m) if p is inside/below the mesh, else 0
const inside = (m: any, p: any) => {
  if (p.x < m.box[0] || p.x > m.box[1] || p.z < m.box[4] || p.z > m.box[5] || p.y < m.box[2] || p.y > m.box[3]) return 0;
  let hits = 0, nearest = 1e9;
  for (const t of m.tris) {
    const d = (t.b.x - t.a.x) * (t.c.z - t.a.z) - (t.b.z - t.a.z) * (t.c.x - t.a.x);
    if (Math.abs(d) < 1e-9) continue;
    const u = ((p.x - t.a.x) * (t.c.z - t.a.z) - (p.z - t.a.z) * (t.c.x - t.a.x)) / d, w = ((t.b.x - t.a.x) * (p.z - t.a.z) - (t.b.z - t.a.z) * (p.x - t.a.x)) / d;
    if (u < 0 || w < 0 || u + w > 1) continue;
    const y = t.a.y + u * (t.b.y - t.a.y) + w * (t.c.y - t.a.y);
    if (y > p.y) { hits++; nearest = Math.min(nearest, y - p.y); }
  }
  return hits % 2 === 1 ? nearest : 0;
};
const names = ['ankleL', 'ankleR', 'kneeL', 'kneeR', 'hipL', 'hipR', 'chest', 'head', 'handL', 'handR', 'elbowL', 'elbowR'];
const hits: Record<string, {t0: number; t1: number; pts: Set<string>; maxD: Record<string, number>; tmax: Record<string, number>}> = {};
for (let T = T0; T <= T1 + 1e-6; T += dt) {
  const c = crewC(T, v);
  for (const r of ROLES_C) {
    if (r === 'drone' && false) continue;
    const R = figureRig(v, c[r].spec); const g = R.rig;
    const pts: Record<string, any> = {ankleL: R.W(g.ankle[0]), ankleR: R.W(g.ankle[1]), kneeL: R.W(g.knee[0]), kneeR: R.W(g.knee[1]), hipL: R.W(g.hip[0]), hipR: R.W(g.hip[1]), chest: R.chest, head: R.head, handL: R.handL, handR: R.handR, elbowL: R.W(g.el[0]), elbowR: R.W(g.el[1])};
    const MINDEPTH = parseFloat(process.argv[5] ?? '0.05');
    for (const n of names) for (const m of meshes) { const d = inside(m, pts[n]); if (d > MINDEPTH) {
      const k = r + ' in ' + m.key;
      (hits[k] ??= {t0: T, t1: T, pts: new Set(), maxD: {}, tmax: {}}); hits[k].t1 = T; hits[k].pts.add(n);
      if (d > (hits[k].maxD[n] ?? 0)) { hits[k].maxD[n] = d; hits[k].tmax[n] = T; }
    } }
  }
}
for (const [k, h] of Object.entries(hits)) console.log(k, h.t0.toFixed(2), '->', h.t1.toFixed(2), [...h.pts].map((n) => n + ' ' + h.maxD[n].toFixed(2) + 'm@' + h.tmax[n].toFixed(2)).join(', '));
console.log('done');
