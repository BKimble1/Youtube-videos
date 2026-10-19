import {crewC, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C6B} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
// per-frame scan of every joint (hands, elbows, knees, ankles, head) in the BODY frame: report pops (speed > thr m/s)
const T0 = parseFloat(process.argv[2] ?? '36'), T1 = parseFloat(process.argv[3] ?? '59.95'), thr = parseFloat(process.argv[4] ?? '6');
const prev: any = {};
const rows: string[] = [];
const series: Record<string, number[]> = {};
const times: number[] = [];
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C6B, 0.5, 0.25));
  const c = crewC(T, v);
  times.push(T);
  for (const r of ROLES_C) {
    const R = figureRig(v, c[r].spec); const g = R.rig; const b = c[r].body;
    const J: Record<string, any> = {handL: R.handL, handR: R.handR, elbL: R.W(g.el[0]), elbR: R.W(g.el[1]), kneeL: R.W(g.knee[0]), kneeR: R.W(g.knee[1]), ankL: R.W(g.ankle[0]), ankR: R.W(g.ankle[1]), head: R.head};
    for (const [n, p] of Object.entries(J)) {
      const key = r + n; const rel = {x: p.x - b.pos.x, y: p.y - b.pos.y, z: p.z - b.pos.z};
      const sp = prev[key] ? Math.hypot(rel.x - prev[key].x, rel.y - prev[key].y, rel.z - prev[key].z) * 30 : 0;
      (series[key] ??= []).push(sp);
      prev[key] = rel;
    }
  }
}
for (const [k, a] of Object.entries(series)) for (let i = 2; i < a.length - 1; i++) { const nb = (a[i - 1] + a[i + 1]) / 2; if (a[i] > 4 && a[i] > 2.5 * nb + 2) rows.push(times[i].toFixed(3) + ' ' + k + ' spike ' + a[i].toFixed(1) + ' m/s (neighbours ' + a[i - 1].toFixed(1) + ' / ' + a[i + 1].toFixed(1) + ')'); }
console.log(rows.sort().join('\n'));
