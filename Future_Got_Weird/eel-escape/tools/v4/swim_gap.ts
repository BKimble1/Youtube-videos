// S10–S11 screen check, every 3rd frame from the release: the gap (px, 1080 wide) between the eel's outline and the
// predator's outline on screen, the eel's screen extent, and the predator's screen height (it should shrink: receding).
//   npx tsx ../tools/v4/swim_gap.ts   (from source/)
import {basis} from '../../source/src/v4/three';
import {EXT} from '../../source/src/v4/shots/Exterior';
import {eelScreen, N} from '../../source/src/v4/eelV4';
import {predGeom} from '../../source/src/v4/pred';
const pts = (d: string) => {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const o: {x: number; y: number}[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) o.push({x: n[i], y: n[i + 1]});
  return o;
};
const inside = (P: {x: number; y: number}[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const rows: any[] = [];
for (let f = 626; f <= 735; f += 3) {
  const t = f / 30;
  const id = t < 21.3 ? 'release' : 'swim';
  const s = EXT[id](t);
  const B = basis(s.cam);
  const g = predGeom(B, s.pose);
  const P = pts(g.outline);
  const sc = eelScreen(B, s.eel!);
  let gap = 1e9, onPred = 0, inFrame = 0;
  for (let i = 0; i <= N; i++) {
    const p = sc.pts[i], r = sc.rad[i];
    if (p.x > -r && p.x < 1080 + r && p.y > -r && p.y < 1920 + r) inFrame++;
    if (inside(P, p.x, p.y)) { onPred++; gap = Math.min(gap, -r); continue; }
    for (const q of P) gap = Math.min(gap, Math.hypot(q.x - p.x, q.y - p.y) - r);
  }
  const ys = P.map((q) => q.y), xs = P.map((q) => q.x);
  const head = sc.pts[0], tail = sc.pts[N];
  rows.push({f, t: +t.toFixed(2), id, gap: Math.round(gap), onPred, inFrame, head: [Math.round(head.x), Math.round(head.y)], tail: [Math.round(tail.x), Math.round(tail.y)], predH: Math.round(Math.max(...ys) - Math.min(...ys)), predX: [Math.round(Math.min(...xs)), Math.round(Math.max(...xs))], predY: [Math.round(Math.min(...ys)), Math.round(Math.max(...ys))], rad: Math.round(Math.max(...sc.rad))});
}
for (const r of rows) console.log(JSON.stringify(r));
