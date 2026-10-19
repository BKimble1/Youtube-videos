import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figProps} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
const role = (process.argv[2] ?? 'runner') as any;
const T0 = parseFloat(process.argv[3] ?? '44.6'), T1 = parseFloat(process.argv[4] ?? '44.95');
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C3, 1, 0.4));
  const c = crewC(T, v); const sp = c[role].spec;
  const base = typeof sp.pose === 'function' ? 0 : (sp.pose?.drop ?? 0);
  const {props} = figProps(v, sp);
  const b = c[role].body;
  console.log(T.toFixed(3), 'pose.drop', base.toFixed(1), 'drop after reach', (props.drop ?? 0).toFixed(1), 'need', ((props.drop ?? 0) - base).toFixed(1), 'root y', b.pos.y.toFixed(2), 'footL y', b.footL.y.toFixed(2), 'footR y', b.footR.y.toFixed(2));
}
