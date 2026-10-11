import {padGap, padGapCircle, squareCorners} from './contacts';
import {ptsWorld} from '../hand/Hand';
import {V3} from '../cues_v3';
import {shotA, shotB, DB, WA} from './shots2';
import {handFor, PH} from './shots3';

/**
 * Per-frame contact audit for the held grips. Every row is (frame, gap of each pad to its object in px; <= 0 touching/pressing).
 * A pad must be within TOL px of the object (and not buried more than TOL inside it) for every frame in which it is meant to hold it.
 */
const TOL = 8;
const out: string[] = [];

// 1. TURN: cube between index and thumb, from the end of the close until the turn has finished
{
  let worst = 0;
  const t0 = V3['b05.turn'];
  for (let g = V3['b05.cut_b'] + 8; g <= t0 + 20; g++) {
    const {P, pose, theta, A, B, idxFirst} = shotB(g);
    if (process.env.DEBUG_TURN && g >= 553 && g <= 557) {
      const ti = ptsWorld('robot', 'side', 'index', pose, P)[3], tt = ptsWorld('robot', 'side', 'thumb', pose, P)[3];
      const ei = idxFirst ? B : A, et = idxFirst ? A : B;
      out.push(`  dbg ${g}: P(${P.x.toFixed(0)},${P.y.toFixed(0)}) index tip(${ti.x.toFixed(0)},${ti.y.toFixed(0)}) target(${(idxFirst ? B : A).x.toFixed(0)},${(idxFirst ? B : A).y.toFixed(0)}) | thumb tip(${tt.x.toFixed(0)},${tt.y.toFixed(0)}) target(${et.x.toFixed(0)},${et.y.toFixed(0)}) idxFirst=${idxFirst} ei=${ei.x.toFixed(0)}`);
    }
    const poly = squareCorners({x: DB.x, y: DB.y}, DB.s, theta);
    const gi = padGap('robot', 'side', 'index', pose, P, poly);
    const gt = padGap('robot', 'side', 'thumb', pose, P, poly);
    out.push(`TURN  frame ${g} theta ${theta.toFixed(1).padStart(5)}  index ${gi.toFixed(1).padStart(6)}  thumb ${gt.toFixed(1).padStart(6)}`);
    worst = Math.max(worst, Math.abs(gi), Math.abs(gt));
  }
  out.push(`TURN worst |gap| = ${worst.toFixed(1)} px`);
}

// 1b. TURN approach (informational, not pass/fail): how open are the pads while the shot slides on and they close?
{
  const rows: number[] = [];
  for (let g = V3['b05.cut_b']; g < V3['b05.cut_b'] + 8; g++) {
    const {P, pose, theta} = shotB(g);
    const poly = squareCorners({x: DB.x, y: DB.y}, DB.s, theta);
    rows.push(Math.max(padGap('robot', 'side', 'index', pose, P, poly), padGap('robot', 'side', 'thumb', pose, P, poly)));
  }
  out.push(`TURN approach (frames ${V3['b05.cut_b']}-${V3['b05.cut_b'] + 7}) pad openings px: ${rows.map((r) => r.toFixed(0)).join(' ')}`);
}

// 2. PINCH: washer between thumb and index from contact until the cut
{
  let worst = 0;
  for (let g = V3['b05.pinch']; g <= V3['b05.cut_b']; g++) {
    const {P, pose, sc} = shotA(g);
    const c = {x: WA.x, y: WA.y};
    const gi = padGapCircle('robot', 'side', 'index', pose, P, c, WA.r * sc);
    const gt = padGapCircle('robot', 'side', 'thumb', pose, P, c, WA.r * sc);
    out.push(`PINCH frame ${g}  index ${gi.toFixed(1).padStart(6)}  thumb ${gt.toFixed(1).padStart(6)}`);
    worst = Math.max(worst, Math.abs(gi), Math.abs(gt));
  }
  out.push(`PINCH worst |gap| = ${worst.toFixed(1)} px`);
}
// 3. workstation blocks: both pads on the block from the pick until the place
for (const i of [0, 1] as const) {
  let worst = 0;
  for (let g = PH[i].pick; g <= PH[i].place; g++) {
    const {P, pose, poly} = handFor(g, i);
    const gi = padGap('robot', 'side', 'index', pose, P, poly);
    const gt = padGap('robot', 'side', 'thumb', pose, P, poly);
    if (g % 6 === 0) out.push(`BLOCK${i} frame ${g}  index ${gi.toFixed(1).padStart(6)}  thumb ${gt.toFixed(1).padStart(6)}`);
    worst = Math.max(worst, Math.abs(gi), Math.abs(gt));
  }
  out.push(`BLOCK${i} worst |gap| = ${worst.toFixed(1)} px`);
}
console.log(out.join('\n'));
void TOL;
