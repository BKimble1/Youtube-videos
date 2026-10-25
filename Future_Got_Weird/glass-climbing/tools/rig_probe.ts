// Rig probe: for sampled frames of the climb, the near hand's height against the face (the near arm must not cross the
// face: hand above the brow or below the chin), each leg's reach (<= 1: the rig never stretches a leg), the hands'
// distance from their bars, and each strap's length against its real length (a strap never stretches).
// usage: node probe.cjs [from] [to] [step]
import {climbAt} from '../source/src/world/climb';
import {manJoints} from '../source/src/dc/Man';
import {handError, H_BAR, handUV} from '../source/src/world/rig';
import {gripOf, prPad, STRAP_LEN} from '../source/src/world/geo';

const [a, b, st] = process.argv.slice(2).map(Number);
const uv = handUV(H_BAR, 'grip');
let worst = {face: 1e9, leg: 0, hand: 0, strap: 0};
for (let f = a || 0; f <= (b || 1170); f += st || 6) {
  const s = climbAt(f);
  const j = manJoints(s.pose);
  const gL = prPad(gripOf(s.padL)), gR = prPad(gripOf(s.padR));
  const dy = gL.y - j.head.y; // + below the head centre
  const faceOk = dy < -115 || dy > 105;
  const eL = handError(s.pose, 'L', gL, 182, uv.u, uv.v), eR = handError(s.pose, 'R', gR, 176, uv.u, uv.v);
  const strapL = s.footL.bar ? Math.hypot(s.footL.bar.x - s.ringL.x, s.footL.bar.y - s.ringL.y) / STRAP_LEN : 0;
  const strapR = s.footR.bar ? Math.hypot(s.footR.bar.x - s.ringR.x, s.footR.bar.y - s.ringR.y) / STRAP_LEN : 0;
  if (!faceOk) worst.face = Math.min(worst.face, Math.abs(dy));
  worst.leg = Math.max(worst.leg, s.err.legL, s.err.legR);
  worst.hand = Math.max(worst.hand, eL, eR);
  worst.strap = Math.max(worst.strap, strapL, strapR);
  console.log(`${String(f).padStart(4)} nearHand-head ${dy.toFixed(0).padStart(5)} ${faceOk ? '  ' : 'FACE'}  leg ${s.err.legL.toFixed(2)} ${s.err.legR.toFixed(2)}  hand ${eL.toFixed(1)} ${eR.toFixed(1)}  strap ${strapL.toFixed(2)} ${strapR.toFixed(2)}  H ${s.pose.y.toFixed(0)}`);
}
console.log('worst', JSON.stringify(worst));
