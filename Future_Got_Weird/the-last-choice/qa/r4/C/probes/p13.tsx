import {runnerC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {GC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/ground';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const f = (n: number) => n.toFixed(2);
let prev: any = null;
const T0 = parseFloat(process.argv[2] ?? '43.9'), T1 = parseFloat(process.argv[3] ?? '44.75');
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C3, T - CUT.c3, 0.4));
  const r = runnerC(T, v);
  const R = figureRig(v, r.spec);
  const b = r.body;
  const g = R.rig;
  const W = (p: any) => R.W(p);
  const aL = W(g.ankle[0]), aR = W(g.ankle[1]), hL = W(g.hip[0]), hR = W(g.hip[1]);
  const fl = b.footL, fr = b.footR;
  const sp = prev ? [Math.hypot(fl.x - prev.fl.x, fl.y - prev.fl.y, fl.z - prev.fl.z) * 30, Math.hypot(fr.x - prev.fr.x, fr.y - prev.fr.y, fr.z - prev.fr.z) * 30, Math.hypot(b.pos.x - prev.p.x, b.pos.y - prev.p.y, b.pos.z - prev.p.z) * 30] : [0, 0, 0];
  prev = {fl, fr, p: b.pos};
  const hand = R.handL; const pl = r.pts.palmL;
  console.log(T.toFixed(3), 'root', f(b.pos.x), f(b.pos.y), f(b.pos.z), 'footL up', f(fl.y - GC(fl.x, fl.z)), 'footR up', f(fr.y - GC(fr.x, fr.z)), 'legreach L', f(Math.hypot(hL.x - aL.x, hL.y - aL.y, hL.z - aL.z)), 'R', f(Math.hypot(hR.x - aR.x, hR.y - aR.y, hR.z - aR.z)), 'spd L/R/root', sp.map(f).join('/'), 'drop', f(typeof r.spec.pose === 'function' ? 0 : (r.spec.pose?.drop ?? 0)), pl ? 'palmErr ' + f(Math.hypot(hand.x - pl.x, hand.y - pl.y, hand.z - pl.z)) : '');
}
