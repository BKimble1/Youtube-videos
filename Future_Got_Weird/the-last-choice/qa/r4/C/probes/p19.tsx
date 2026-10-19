import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig, figProps} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const role = (process.argv[2] ?? 'runner') as any;
const T0 = parseFloat(process.argv[3] ?? '44.6'), T1 = parseFloat(process.argv[4] ?? '44.9');
const f = (n: number | undefined) => (n === undefined ? '  -  ' : n.toFixed(1));
for (let T = T0; T <= T1 + 1e-6; T += 1 / 30) {
  const v = makeView(camPath(CAM_C3, T - CUT.c3, 0.4));
  const c = crewC(T, v); const sp = c[role].spec;
  const {props} = figProps(v, sp);
  const R = figureRig(v, sp); const b = c[role].body;
  console.log(T.toFixed(3), 'root', b.pos.x.toFixed(2), b.pos.y.toFixed(2), b.pos.z.toFixed(2), 'h', f(b.heading), '| drop', f(props.drop), 'lean', f(props.lean), 'side', f(props.side), 'twist', f(props.twist), 'headYaw', f(props.head?.yaw), 'headPitch', f(props.head?.pitch), '| headRel', (R.head.x - b.pos.x).toFixed(2), (R.head.y - b.pos.y).toFixed(2), (R.head.z - b.pos.z).toFixed(2));
}
