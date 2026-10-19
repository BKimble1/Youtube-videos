import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C5B, CAM_C5C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const f = (n: number) => n.toFixed(3);
console.log('C5b: tether right hand vs the reel (hipReel prop point pts.reel)');
for (let T = 51.2; T <= 52.1; T += 3 / 30) {
  const v = makeView(camPath(CAM_C5B, T - CUT.c5b, 0.5));
  const c = crewC(T, v); const R = figureRig(v, c.tether.spec); const rl = c.tether.pts.reel;
  console.log(T.toFixed(2), 'hand-to-reel', f(Math.hypot(R.handR.x - rl.x, R.handR.y - rl.y, R.handR.z - rl.z)), 'hand', R.handR.x.toFixed(2), R.handR.y.toFixed(2), R.handR.z.toFixed(2), 'reel', rl.x.toFixed(2), rl.y.toFixed(2), rl.z.toFixed(2));
}
console.log('C5c: director right hand vs the strap point');
for (let T = 52.1; T <= 53.06; T += 3 / 30) {
  const v = makeView(camPath(CAM_C5C, T - CUT.c5c, 0.5));
  const c = crewC(T, v); const R = figureRig(v, c.director.spec); const st = c.director.pts.strap;
  console.log(T.toFixed(2), st ? 'hand-to-strap ' + f(Math.hypot(R.handR.x - st.x, R.handR.y - st.y, R.handR.z - st.z)) : 'no strap target');
}
