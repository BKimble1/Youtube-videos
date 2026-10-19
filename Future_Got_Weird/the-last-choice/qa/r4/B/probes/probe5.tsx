import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {dirSpec} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/kit';
import {dirB} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/director';
import {CAM_B2} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/cams';
const f = (v: any) => '(' + v.x.toFixed(3) + ',' + v.y.toFixed(3) + ',' + v.z.toFixed(3) + ')';
const view = makeView(camPath(CAM_B2, 4.3, 0.6));
for (const T of (process.env.TS ?? '16.70,16.7333,16.76,16.7667,16.80').split(',').map(Number)) {
  const d = dirB(T);
  const R = figureRig(view, dirSpec(T));
  const r = R.rig, W = R.W;
  console.log(T.toFixed(4), 'root', f(d.pos), 'hd', d.heading.toFixed(1), 'pel', f(W(r.P)), 'head', f(R.head), 'hL', f(R.handL), 'hR', f(R.handR), 'aL', f(W(r.ankle[0])), 'aR', f(W(r.ankle[1])), 'kL', f(W(r.knee[0])), 'kR', f(W(r.knee[1])));
}
