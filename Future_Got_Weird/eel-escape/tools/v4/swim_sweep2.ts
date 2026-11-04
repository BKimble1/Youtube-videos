// release + swim sweep (20.9–24.3, every 4th frame): gap to the predator outline, distance to its eye, the eel's
// screen length (foreshortening), head position, predator height/in-frame. Configs: cam (SWIM_CFG), h0/d1/d2.
import {basis, norm3} from '../../source/src/v4/three';
import {EXT, SWIM_CFG} from '../../source/src/v4/shots/Exterior';
import {SWIM_HEAD} from '../../source/src/v4/escape';
import {eelScreen, N} from '../../source/src/v4/eelV4';
import {predGeom} from '../../source/src/v4/pred';
const pts = (d: string) => { const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number); const o: {x: number; y: number}[] = []; for (let i = 0; i + 1 < n.length; i += 2) o.push({x: n[i], y: n[i + 1]}); return o; };
const inside = (P: {x: number; y: number}[], x: number, y: number) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const base = JSON.parse(JSON.stringify(SWIM_CFG));
const bh = {...SWIM_HEAD};
for (const c of JSON.parse(process.argv[2])) {
  Object.assign(SWIM_CFG, base, c.cam || {});
  SWIM_HEAD.h0 = c.h0 ? norm3(c.h0) : bh.h0; SWIM_HEAD.d1 = c.d1 ? norm3(c.d1) : bh.d1; SWIM_HEAD.d2 = c.d2 ? norm3(c.d2) : bh.d2;
  const out: string[] = [];
  let eyeMin = 1e9, overlapAfter = 0, minLen = 1e9, offFrame = 0;
  for (let f = 628; f <= 728; f += 4) {
    const t = f / 30;
    const s = EXT[t < 21.3 ? 'release' : 'swim'](t);
    const B = basis(s.cam);
    const g = predGeom(B, s.pose);
    const P = pts(g.outline);
    const sc = eelScreen(B, s.eel!);
    let gap = 1e9, eye = 1e9, len = 0;
    for (let i = 0; i <= N; i += 2) {
      const p = sc.pts[i], r = sc.rad[i];
      eye = Math.min(eye, Math.hypot(p.x - g.eye.x, p.y - g.eye.y) - r - g.eye.r);
      if (inside(P, p.x, p.y)) { gap = Math.min(gap, -r); continue; }
      for (let k = 0; k < P.length; k += 3) gap = Math.min(gap, Math.hypot(P[k].x - p.x, P[k].y - p.y) - r);
    }
    for (let i = 1; i <= N; i++) len += Math.hypot(sc.pts[i].x - sc.pts[i - 1].x, sc.pts[i].y - sc.pts[i - 1].y);
    const h = sc.pts[0];
    if (h.x < 40 || h.x > 1040 || h.y < 520 || h.y > 1880) offFrame++;
    eyeMin = Math.min(eyeMin, eye);
    if (t > 21.7 && gap < 25) overlapAfter++;
    if (t > 21.3) minLen = Math.min(minLen, len);
    const ys = P.map((q) => q.y), xs = P.map((q) => q.x);
    const pin = Math.min(...xs) < 1000 && Math.max(...xs) > 80;
    if (f % 12 === 4) out.push(`${t.toFixed(1)}:g${Math.round(gap)} e${Math.round(eye)} L${Math.round(len)} h(${Math.round(h.x)},${Math.round(h.y)}) p${pin ? Math.round(Math.max(...ys) - Math.min(...ys)) : '-'}`);
  }
  console.log(`${c.name}: eyeMin ${Math.round(eyeMin)} overlapAfter21.7 ${overlapAfter} minLen ${Math.round(minLen)} headOff ${offFrame}\n   ${out.join(' ')}`);
}
