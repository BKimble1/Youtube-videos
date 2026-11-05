// Search wrist targets / elbow sides for the S4 upper-right arm poses that keep every link clear of the head.
import {basePose, reachSlot, slotGeo} from '../../source/src/film/cast';
import {v3, V3, s3, l3, a3, k3} from '../../source/src/r3/m3';
const W0 = basePose(v3(0, 0, 0), 0);
const head = v3(0, 172, 0.6);
const segDist = (p: V3, a: V3, b: V3) => { const ab = s3(b, a); const t = Math.max(0, Math.min(1, ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y + (p.z - a.z) * ab.z) / (l3(ab) ** 2 || 1))); return l3(s3(p, a3(a, k3(ab, t)))); };
const clear = (w: V3, d: V3, p: V3, es: 1 | -1) => {
  const ap = reachSlot(W0, 'UR', w, d, p, 0.3, 0.5, es);
  const g = slotGeo(W0, 'UR', ap);
  const c = Math.min(segDist(head, g.S, g.E) - 4.5, segDist(head, g.E, g.W) - 3.8);
  return {c, reach: l3(s3(g.W, w)), ap};
};
const cands: [string, V3, V3, V3][] = [
  ['front', v3(-14, 190, 30), v3(0.25, 0.35, 1), v3(0.2, -0.3, 1)],
  ['frontR', v3(-30, 186, 30), v3(0.25, 0.35, 1), v3(0.2, -0.3, 1)],
  ['frontRhi', v3(-26, 198, 26), v3(0.3, 0.3, 1), v3(0.2, -0.3, 1)],
  ['over', v3(0, 202, 6), v3(0.2, -0.6, 0.3), v3(0, -1, 0)],
  ['overHi', v3(-2, 208, 4), v3(0.3, -0.8, 0.2), v3(0, -1, 0)],
  ['pat', v3(0, 195.5, 5), v3(0.2, -0.75, 0.3), v3(0, -1, 0)],
  ['patR', v3(-6, 197, 2), v3(0.3, -0.85, 0.2), v3(0, -1, 0)],
];
for (const [n, w, d, p] of cands) for (const es of [1, -1] as const) { const r = clear(w, d, p, es); console.log(n.padEnd(9), es, 'clear', r.c.toFixed(1), 'reachErr', r.reach.toFixed(1), JSON.stringify(r.ap, (k, v) => typeof v === 'number' ? +v.toFixed(0) : v)); }
