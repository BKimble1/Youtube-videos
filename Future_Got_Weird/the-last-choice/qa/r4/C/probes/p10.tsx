import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView, toView, viewToScreen} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C5A} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
import {SH_X, SH_H} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
const out: string[] = [];
let prev: any = null;
for (let T = 50.0; T <= 51.2 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C5A, T - CUT.c5a, 0.5));
  const c = crewC(T, v);
  const Rd = figureRig(v, c.director.spec), Rb = figureRig(v, c.breaker.spec);
  const tgt = Rd.torso({r: SH_X - 10, u: SH_H + 12, f: -2});
  const d = Math.hypot(Rb.handL.x - tgt.x, Rb.handL.y - tgt.y, Rb.handL.z - tgt.z);
  // hand speed relative to the shoulder
  const rel = {x: Rb.handL.x - tgt.x, y: Rb.handL.y - tgt.y, z: Rb.handL.z - tgt.z};
  const dr = prev ? Math.hypot(rel.x - prev.x, rel.y - prev.y, rel.z - prev.z) * 30 : 0;
  prev = rel;
  out.push(T.toFixed(2) + ' hand-to-shoulder ' + d.toFixed(3) + ' m, rel speed ' + dr.toFixed(2) + ' m/s');
}
console.log(out.join('\n'));
