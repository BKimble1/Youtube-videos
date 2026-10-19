import {crewC, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figProps} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const T0 = parseFloat(process.argv[2] ?? '38'), T1 = parseFloat(process.argv[3] ?? '54');
const thr = parseFloat(process.argv[4] ?? '14');
const prev: Record<string, number> = {}; const cnt: Record<string, number> = {}; const ex: Record<string, string[]> = {}; const mx: Record<string, number> = {};
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C3, 1, 0.4));
  const c = crewC(T, v);
  for (const r of ROLES_C) {
    const d = figProps(v, c[r].spec).props.drop ?? 0;
    if (prev[r] !== undefined) { const dd = Math.abs(d - prev[r]); if (dd > thr) { cnt[r] = (cnt[r] ?? 0) + 1; (ex[r] ??= []).push(T.toFixed(2) + ':' + (d - prev[r]).toFixed(0)); } mx[r] = Math.max(mx[r] ?? 0, dd); }
    prev[r] = d;
  }
}
for (const r of ROLES_C) console.log(r, 'frames with |d drop| >', thr, ':', cnt[r] ?? 0, 'max', (mx[r] ?? 0).toFixed(0), '|', (ex[r] ?? []).slice(0, 40).join(' '));
