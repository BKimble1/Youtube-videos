import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {makeView, project} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {dirSpec} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/kit';
import {CAM_B6B} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/cams';
import {sentryPos, SENTRY_HOLD} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/army';
import {STAND} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/director';
const HEAD6 = {x: STAND.x, y: STAND.y + 1.4, z: STAND.z};
console.log('hold', JSON.stringify(SENTRY_HOLD));
for (let T = 33.8; T <= 35.6; T += 0.1) {
  const view = makeView(camPath(CAM_B6B, T - 32.9, 0.4));
  const R = figureRig(view, dirSpec(T, {anchor: HEAD6, bias: 0.4}));
  const h = project(view, R.head), hh = project(view, {x: R.head.x, y: R.head.y + 0.23, z: R.head.z});
  const d = sentryPos(T), s = project(view, d);
  const L = project(view, {x: d.x, y: d.y, z: d.z + 0.5}), Rr = project(view, {x: d.x, y: d.y, z: d.z - 0.5});
  const rad = Math.abs(hh.y - h.y);
  console.log(T.toFixed(2), 'head px', h.x.toFixed(0), h.y.toFixed(0), 'r', rad.toFixed(0), '| drone', s.x.toFixed(0), s.y.toFixed(0), 'k', s.k.toFixed(0), 'arms z+/-0.5', L.x.toFixed(0), Rr.x.toFixed(0), '| dx(head->drone) in head radii', ((s.x - h.x) / rad).toFixed(2), 'left-arm gap', ((Math.min(L.x, Rr.x) - h.x) / rad).toFixed(2));
}
