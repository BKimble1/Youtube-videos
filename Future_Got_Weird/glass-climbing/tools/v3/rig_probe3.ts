// V3 rig probe over every frame where the climber is on screen: each hand's distance from its bar, each leg's reach
// (<= 1: the rig never stretches a leg), each strap against its length, a loaded pad sliding (it must not), per-frame
// jumps of the ankles and wrists, the near hand against the face (it must stay below the chin: the near arm never
// crosses the face), the legs crossing (segment intersections between the near and far shins/thighs), and the loop
// (the state at FRAMES against frame 0). usage: node probe3.cjs [onlyFrom onlyTo]
import {climbAt} from '../../source/src/v3/climb3';
import {handError, H_BAR, handUV} from '../../source/src/world/rig';
import {gripOf, prPad} from '../../source/src/world/geo';
import {manJoints} from '../../source/src/dc/Man';
import {FRAMES, STRAP3} from '../../source/src/v3/set3';

type P = {x: number; y: number};
const cross = (a: P, b: P, c: P, d: P) => {
  const r = (p: P, q: P, s: P) => (q.x - p.x) * (s.y - p.y) - (q.y - p.y) * (s.x - p.x);
  return r(a, b, c) * r(a, b, d) < 0 && r(c, d, a) * r(c, d, b) < 0;
};
const OFF: [number, number][] = [[176, 470], [535, 680], [904, 950], [1063, 1106]]; // micro, springs, surfaces (no climber)
const [from, to] = process.argv.slice(2).map(Number);
const uv = handUV(H_BAR, 'grip');
const worst: Record<string, [number, number]> = {hand: [0, 0], leg: [0, 0], strap: [0, 0], slide: [0, 0], ankleJump: [0, 0], wristJump: [0, 0], faceMin: [1e9, 0]};
const up = (k: string, v: number, f: number) => {
  if (v > worst[k][0]) worst[k] = [+v.toFixed(2), f];
};
const bad: Record<string, number[]> = {hand: [], face: [], legX: [], leg: []};
let prev = climbAt(-1);
for (let f = from || 0; f <= (to || FRAMES); f++) {
  const s = climbAt(f);
  if (OFF.some(([a, b]) => f >= a && f < b)) {
    prev = s;
    continue;
  }
  const gL = prPad(gripOf(s.padL)), gR = prPad(gripOf(s.padR));
  const hl = handError(s.pose, 'L', gL, 182, uv.u, uv.v), hr = handError(s.pose, 'R', gR, 176, uv.u, uv.v);
  up('hand', Math.max(hl, hr), f);
  if (Math.max(hl, hr) > 8) bad.hand.push(f);
  const lg = Math.max(s.err.legL, s.err.legR);
  up('leg', lg, f);
  if (lg > 0.985) bad.leg.push(f);
  const sl = s.footL.bar ? Math.hypot(s.footL.bar.x - s.ringL.x, s.footL.bar.y - s.ringL.y) / STRAP3 : 0;
  const sr = s.footR.bar ? Math.hypot(s.footR.bar.x - s.ringR.x, s.footR.bar.y - s.ringR.y) / STRAP3 : 0;
  up('strap', Math.max(sl, sr), f);
  for (const k of ['padL', 'padR'] as const) if (s[k].gap < 0.01 && prev[k].gap < 0.01 && s[k].load > 0.3) up('slide', Math.abs(s[k].y - prev[k].y), f);
  up('ankleJump', Math.max(Math.hypot(s.footL.ankle.x - prev.footL.ankle.x, s.footL.ankle.y - prev.footL.ankle.y), Math.hypot(s.footR.ankle.x - prev.footR.ankle.x, s.footR.ankle.y - prev.footR.ankle.y)), f);
  const j = manJoints(s.pose), pj = manJoints(prev.pose);
  up('wristJump', Math.max(Math.hypot(j.L.W.x - pj.L.W.x, j.L.W.y - pj.L.W.y), Math.hypot(j.R.W.x - pj.R.W.x, j.R.W.y - pj.R.W.y)), f);
  // the near hand: below the chin (head centre + 105) unless the near pad is off his chest line
  const dy = j.L.W.y - j.head.y;
  if (dy < worst.faceMin[0]) worst.faceMin = [+dy.toFixed(0), f];
  if (dy < 105 && j.L.W.x > j.head.x - 160) bad.face.push(f);
  const nl = j.lLeg, fl = j.rLeg;
  if (cross(nl.K, nl.A, fl.K, fl.A) || cross(nl.K, nl.A, fl.hp, fl.K) || cross(nl.hp, nl.K, fl.K, fl.A)) bad.legX.push(f);
  prev = s;
}
const runs = (a: number[]) => {
  const out: string[] = [];
  let s0 = -1, p = -9;
  for (const f of a) {
    if (f !== p + 1) {
      if (s0 >= 0) out.push(s0 === p ? `${s0}` : `${s0}-${p}`);
      s0 = f;
    }
    p = f;
  }
  if (s0 >= 0) out.push(s0 === p ? `${s0}` : `${s0}-${p}`);
  return out.join(' ');
};
for (const k of Object.keys(bad)) console.log(`${k}: ${runs(bad[k]) || 'none'}`);
const a = climbAt(0), b = climbAt(FRAMES);
const d = (x: number, y: number) => +Math.abs(x - y).toFixed(4);
console.log('loop', JSON.stringify({hip: d(a.pose.y, b.pose.y), padLy: d(a.padL.y, b.padL.y), padLgap: d(a.padL.gap, b.padL.gap), padRy: d(a.padR.y, b.padR.y), ankL: d(a.footL.ankle.y, b.footL.ankle.y), torso: d(a.pose.torso, b.pose.torso), neck: d(a.pose.neck, b.pose.neck)}));
console.log('worst', JSON.stringify(worst));
