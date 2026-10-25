// V2 rig probe over every frame of the climb: each hand's distance from its bar, each leg's reach (<= 1: the rig never
// stretches a leg), each strap's length against its real length (a strap never stretches), a loaded pad sliding on
// its surface (it must not), the largest per-frame jump of an ankle or a hand (no teleporting), and the loop: the
// state at FRAMES (= frame 0 again) against frame 0. usage: node probe2.cjs
import {climbAt} from '../../source/src/v2/climb2';
import {handError, H_BAR, handUV} from '../../source/src/world/rig';
import {gripOf, prPad, STRAP_LEN} from '../../source/src/world/geo';
import {manJoints} from '../../source/src/dc/Man';
import {FRAMES} from '../../source/src/v2/set';

const uv = handUV(H_BAR, 'grip');
const worst = {hand: [0, 0], leg: [0, 0], strap: [0, 0], slide: [0, 0], ankleJump: [0, 0], handJump: [0, 0]};
const up = (k: keyof typeof worst, v: number, f: number) => {
  if (v > worst[k][0]) worst[k] = [+v.toFixed(3), f];
};
let prev = climbAt(-1);
const bad: string[] = [];
/** frames where the climber is on screen in the bay (the rest: micro views, the springs, or the off-screen descent) */
const ON = [[0, 176], [490, 535], [680, 905], [971, 1064], [1106, FRAMES]];
for (let f = 0; f <= FRAMES; f++) {
  const s = climbAt(f);
  if (!ON.some(([a, b]) => f >= a && f <= b)) {
    prev = s;
    continue;
  }
  const gL = prPad(gripOf(s.padL)), gR = prPad(gripOf(s.padR));
  const hl = handError(s.pose, 'L', gL, 182, uv.u, uv.v), hr = handError(s.pose, 'R', gR, 176, uv.u, uv.v);
  up('hand', Math.max(hl, hr), f);
  if (Math.max(hl, hr) > 8) bad.push(`${f}${hl > hr ? 'L' : 'R'}`);
  up('leg', Math.max(s.err.legL, s.err.legR), f);
  const sl = s.footL.bar ? Math.hypot(s.footL.bar.x - s.ringL.x, s.footL.bar.y - s.ringL.y) / STRAP_LEN : 0;
  const sr = s.footR.bar ? Math.hypot(s.footR.bar.x - s.ringR.x, s.footR.bar.y - s.ringR.y) / STRAP_LEN : 0;
  up('strap', Math.max(sl, sr), f);
  for (const k of ['padL', 'padR'] as const) if (s[k].gap < 0.01 && prev[k].gap < 0.01 && s[k].load > 0.3) up('slide', Math.abs(s[k].y - prev[k].y), f);
  up('ankleJump', Math.max(Math.hypot(s.footL.ankle.x - prev.footL.ankle.x, s.footL.ankle.y - prev.footL.ankle.y), Math.hypot(s.footR.ankle.x - prev.footR.ankle.x, s.footR.ankle.y - prev.footR.ankle.y)), f);
  const jw = manJoints(s.pose), pw = manJoints(prev.pose);
  up('handJump', Math.max(Math.hypot(jw.L.W.x - pw.L.W.x, jw.L.W.y - pw.L.W.y), Math.hypot(jw.R.W.x - pw.R.W.x, jw.R.W.y - pw.R.W.y)), f);
  prev = s;
}
const a = climbAt(0), b = climbAt(FRAMES);
const diff = (x: number, y: number) => +Math.abs(x - y).toFixed(4);
console.log('loop (frame 0 vs FRAMES)', JSON.stringify({hip: diff(a.pose.y, b.pose.y), padLy: diff(a.padL.y, b.padL.y), padLgap: diff(a.padL.gap, b.padL.gap), padRy: diff(a.padR.y, b.padR.y), ankL: diff(a.footL.ankle.x + a.footL.ankle.y, b.footL.ankle.x + b.footL.ankle.y), ankR: diff(a.footR.ankle.y, b.footR.ankle.y), torso: diff(a.pose.torso, b.pose.torso), neck: diff(a.pose.neck, b.pose.neck)}));
console.log('hands off their bars (> 8 units):', bad.join(' '));
console.log('worst [value, frame]', JSON.stringify(worst));
