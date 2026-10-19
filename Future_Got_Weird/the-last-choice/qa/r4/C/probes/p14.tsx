import {pilotC, droneC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C4B} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const f = (n: number) => n.toFixed(2);
let prev: any = null; let prevD: any = null;
for (let T = 46.7; T <= 48.6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C4B, T - CUT.c4b, 0.5));
  const p = pilotC(T, v);
  const R = figureRig(v, p.spec);
  const h = R.handL, d = droneC(T).pos;
  const hs = prev ? Math.hypot(h.x - prev.x, h.y - prev.y, h.z - prev.z) * 30 : 0;
  const ds = prevD ? Math.hypot(d.x - prevD.x, d.y - prevD.y, d.z - prevD.z) * 30 : 0;
  prev = h; prevD = d;
  // drone rest height above the palm and horizontal offset
  console.log(T.toFixed(3), 'hand', f(h.x), f(h.y), f(h.z), 'drone', f(d.x), f(d.y), f(d.z), 'drone-above-hand', f(d.y - h.y), 'horiz', f(Math.hypot(d.x - h.x, d.z - h.z)), 'hand m/s', f(hs), 'drone m/s', f(ds), p.pts.palm ? 'palmErr ' + f(Math.hypot(h.x - p.pts.palm.x, h.y - p.pts.palm.y, h.z - p.pts.palm.z)) : '');
}
