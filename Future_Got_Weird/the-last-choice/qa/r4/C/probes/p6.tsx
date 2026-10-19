import {crewC} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {figureRig, figProps} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {makeView, toView, viewToScreen} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {CAM_C5A} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/cams';
import {CUT} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const P = (v: any, p: any) => { const s = viewToScreen(v, toView(v, p)); return '(' + s.x.toFixed(0) + ',' + s.y.toFixed(0) + ')'; };
const out: string[] = [];
for (let T = 50.0; T <= 51.2; T += 0.1) {
  const v = makeView(camPath(CAM_C5A, T - CUT.c5a, 0.5));
  const c = crewC(T, v);
  const d = c.director, b = c.breaker;
  const {props} = figProps(v, d.spec);
  const Rd = figureRig(v, d.spec), Rb = figureRig(v, b.spec);
  out.push(T.toFixed(2) + ' dirHead' + P(v, Rd.head) + ' headYaw ' + (props.head?.yaw ?? 0).toFixed(0) + ' pitch ' + (props.head?.pitch ?? 0).toFixed(0) + ' lookX ' + (props.face?.lookX ?? 0).toFixed(2) + ' lookY ' + (props.face?.lookY ?? 0).toFixed(2) + ' gaze ' + JSON.stringify(d.spec.gaze && {x: +d.spec.gaze.x.toFixed(2), y: +d.spec.gaze.y.toFixed(2), z: +d.spec.gaze.z.toFixed(2)}) + ' brkHead' + P(v, Rb.head) + ' brkHandL' + P(v, Rb.handL) + ' dirShoulderR ' + P(v, Rd.W(Rd.rig.sh[0])) + ' sh1 ' + P(v, Rd.W(Rd.rig.sh[1])));
}
console.log(out.join('\n'));
