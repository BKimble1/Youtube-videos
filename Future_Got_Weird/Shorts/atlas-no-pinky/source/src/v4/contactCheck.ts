import {padGap, padGapCircle, squareCorners} from './contacts';
import {ptsWorld} from '../hand/Hand';
import {V4} from './cues';
import {shotA, shotB, DB, WA} from './shots2';
import {handFor, PH} from './shots3';
import {shotC} from './shots2';
import {TOOL} from '../film/props';

/**
 * Per-frame contact audit for the held grips. Every row is (frame, gap of each pad to its object in px; <= 0 touching/pressing).
 * A pad must be within TOL px of the object (and not buried more than TOL inside it) for every frame in which it is meant to hold it.
 */
const TOL = 8;
const out: string[] = [];

// 1. TURN: cube between index and thumb, from the end of the close until the turn has finished
{
  let worst = 0;
  const t0 = V4['b05.turn'];
  for (let g = V4['b05.cut_b'] + 8; g <= t0 + 20; g++) {
    const {P, pose, theta, A, B, idxFirst} = shotB(g);
    if (process.env.DEBUG_TURN && g >= V4['b05.turn'] + 3 && g <= V4['b05.turn'] + 7) {
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
  for (let g = V4['b05.cut_b']; g < V4['b05.cut_b'] + 8; g++) {
    const {P, pose, theta} = shotB(g);
    const poly = squareCorners({x: DB.x, y: DB.y}, DB.s, theta);
    rows.push(Math.max(padGap('robot', 'side', 'index', pose, P, poly), padGap('robot', 'side', 'thumb', pose, P, poly)));
  }
  out.push(`TURN approach (frames ${V4['b05.cut_b']}-${V4['b05.cut_b'] + 7}) pad openings px: ${rows.map((r) => r.toFixed(0)).join(' ')}`);
}

// 2. PINCH: washer between thumb and index from contact until the cut
{
  let worst = 0;
  for (let g = V4['b05.pinch']; g <= V4['b05.cut_b']; g++) {
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
// 4. DRILL: the index fingertip must sit ON the trigger lever (the lever swings back as it is pressed) from the press until the screw is home.
// The finger wraps the lever, so the pad capsule overlaps it by design; the criterion is that the tip point is inside the lever outline.
{
  const inPoly = (p: {x: number; y: number}, poly: {x: number; y: number}[]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      if ((poly[i].y > p.y) !== (poly[j].y > p.y) && p.x < ((poly[j].x - poly[i].x) * (p.y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x) c = !c;
    }
    return c;
  };
  let outside = 0, n = 0, worst = 0;
  for (let g = V4['b05.press']; g <= V4['b05.drive_end']; g++) {
    const {P, pose, press} = shotC(g);
    const rot = (14 * press * Math.PI) / 180;
    const ox = TOOL.trigX - 4, oy = TOOL.trigY - 20;
    const lever = [[TOOL.trigX - 6, TOOL.trigY - 20], [TOOL.trigX + 20, TOOL.trigY - 8], [TOOL.trigX + 18, TOOL.trigY + 34], [TOOL.trigX - 6, TOOL.trigY + 30]].map(([x, y]) => {
      const dx = x - ox, dy = y - oy;
      const lx = ox + dx * Math.cos(rot) - dy * Math.sin(rot), ly = oy + dx * Math.sin(rot) + dy * Math.cos(rot);
      return {x: P.x + lx * P.scale, y: P.y + ly * P.scale};
    });
    const tip = ptsWorld('robot', 'side', 'index', pose, P)[3];
    const cx = lever.reduce((a, p) => a + p.x, 0) / 4, cy = lever.reduce((a, p) => a + p.y, 0) / 4;
    const d = Math.hypot(tip.x - cx, tip.y - cy);
    n++; worst = Math.max(worst, d);
    if (!inPoly(tip, lever)) outside++;
    if (g % 6 === 0) out.push(`DRILL frame ${g}  press ${press.toFixed(2)}  index tip ${inPoly(tip, lever) ? 'on' : 'OFF'} the lever, ${d.toFixed(1)} px from its centre`);
  }
  out.push(`DRILL index tip on the trigger lever in ${n - outside}/${n} frames (worst ${worst.toFixed(1)} px from the lever centre; the lever is about ${(24 * 1.7).toFixed(0)} x ${(54 * 1.7).toFixed(0)} px)`);
  if (outside) out.push(`DRILL FAIL: tip off the lever in ${outside} frames`);
}
console.log(out.join('\n'));
void TOL;
