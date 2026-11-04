// sweep the S11 tracking camera / headings: score = clear water between the eel and the predator on screen
import {basis, norm3, V3} from '../../source/src/v4/three';
import {EXT, SWIM_CFG} from '../../source/src/v4/shots/Exterior';
import {SWIM_HEAD} from '../../source/src/v4/escape';
import {eelScreen, N} from '../../source/src/v4/eelV4';
import {predGeom} from '../../source/src/v4/pred';
const pts = (d: string) => { const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number); const o: {x: number; y: number}[] = []; for (let i = 0; i + 1 < n.length; i += 2) o.push({x: n[i], y: n[i + 1]}); return o; };
const inside = (P: {x: number; y: number}[], x: number, y: number) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
const cfgs: any[] = JSON.parse(process.argv[2]);
for (const c of cfgs) {
  Object.assign(SWIM_CFG, c.cam || {});
  if (c.head) { if (c.head.h0) SWIM_HEAD.h0 = norm3(c.head.h0); if (c.head.d1) SWIM_HEAD.d1 = norm3(c.head.d1); if (c.head.d2) SWIM_HEAD.d2 = norm3(c.head.d2); }
  const out: string[] = [];
  let firstClear = -1, bad = 0;
  for (let f = 641; f <= 734; f += 6) {
    const t = f / 30;
    const s = EXT.swim(t);
    const B = basis(s.cam);
    const P = pts(predGeom(B, s.pose).outline);
    const sc = eelScreen(B, s.eel!);
    let gap = 1e9;
    for (let i = 0; i <= N; i += 2) { const p = sc.pts[i], r = sc.rad[i]; if (inside(P, p.x, p.y)) { gap = Math.min(gap, -r); continue; } for (let k = 0; k < P.length; k += 2) { const q = P[k]; gap = Math.min(gap, Math.hypot(q.x - p.x, q.y - p.y) - r); } }
    const xs = P.map((q) => q.x), ys = P.map((q) => q.y);
    const predIn = Math.min(...xs) < 1040 && Math.max(...xs) > 40 && Math.min(...ys) < 1880 && Math.max(...ys) > 40;
    if (gap > 30 && firstClear < 0) firstClear = t; if (gap <= 30 && firstClear >= 0) bad++;
    out.push(`${t.toFixed(1)}:g${Math.round(gap)} h(${Math.round(sc.pts[0].x)},${Math.round(sc.pts[0].y)}) p${predIn ? 'Y' : 'n'}${Math.round(Math.max(...ys) - Math.min(...ys))}`);
  }
  console.log(c.name, 'firstClear', firstClear.toFixed(2), 'relapses', bad, '\n  ', out.join(' '));
}
