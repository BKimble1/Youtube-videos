import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig, figProps} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CLIMBS_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
const role = (process.argv[2] ?? 'drone') as any;
const T0 = parseFloat(process.argv[3] ?? '46.6'), T1 = parseFloat(process.argv[4] ?? '46.8');
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C3, 1, 0.4));
  const c = crewC(T, v); const sp = c[role].spec; const b = c[role].body;
  const {props} = figProps(v, sp);
  const R = figureRig(v, sp);
  const hipL = R.W(R.rig.hip[0]), hipR = R.W(R.rig.hip[1]);
  const hz = (h: any, p: any) => Math.hypot(h.x - p.x, h.z - p.z).toFixed(2);
  const base = typeof sp.pose === 'function' ? 0 : (sp.pose?.drop ?? 0);
  console.log(T.toFixed(3), 'root', b.pos.x.toFixed(2), b.pos.z.toFixed(2), 'footL', b.footL.x.toFixed(2), b.footL.z.toFixed(2), 'y', b.footL.y.toFixed(2), 'footR', b.footR.x.toFixed(2), b.footR.z.toFixed(2), 'y', b.footR.y.toFixed(2), '| hz L', hz(hipL, b.footL), 'R', hz(hipR, b.footR), 'hipY', ((hipL.y + hipR.y) / 2).toFixed(2), 'need', ((props.drop ?? 0) - base).toFixed(0));
}
for (const c of CLIMBS_C[role]) c.steps.filter((s) => s.a > T0 - 0.4 && s.a < T1 + 0.1).forEach((s) => console.log('step', s.foot, 'a', s.a.toFixed(2), 'plant', s.plant.toFixed(2), 'b', s.b.toFixed(2), 'from', s.from.x.toFixed(2), s.from.z.toFixed(2), 'to', s.to.x.toFixed(2), s.to.z.toFixed(2), 'r0', s.r0.x.toFixed(2), s.r0.z.toFixed(2), 'r1', s.r1.x.toFixed(2), s.r1.z.toFixed(2)));
