import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C6B} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
const role = (process.argv[2] ?? 'decoy') as any; const side = process.argv[3] ?? 'R';
const T0 = parseFloat(process.argv[4] ?? '54.4'), T1 = parseFloat(process.argv[5] ?? '54.9');
let prev: any = null;
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C6B, 0.5, 0.25));
  const c = crewC(T, v); const R = figureRig(v, c[role].spec); const b = c[role].body;
  const h = side === 'L' ? R.handL : R.handR;
  const rel = {x: h.x - b.pos.x, y: h.y - b.pos.y, z: h.z - b.pos.z};
  const s = prev ? Math.hypot(rel.x - prev.x, rel.y - prev.y, rel.z - prev.z) * 30 : 0; prev = rel;
  const p: any = c[role].spec.pose; 
  console.log(T.toFixed(3), 'rel hand', rel.x.toFixed(2), rel.y.toFixed(2), rel.z.toFixed(2), 'speed', s.toFixed(1), 'handShape', p?.handR);
}
