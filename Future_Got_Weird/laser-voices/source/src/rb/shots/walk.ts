// Walk planning: alternating planted steps along a straight line on the floor, with the hips following the feet. The
// feet are the authority (they never slide); the hips sit between them, a little ahead while moving, and as high as
// the legs allow, so the body rises and falls through each step.
import {Step, footAt} from '../art/Person';
import {clamp, lerp} from '../lib/math';

export type Walk = {steps: Step[]; nx0: number; fx0: number};

/** steps from x0 toward x1 (direction from the sign), starting at t0 with the given cadence and stride (world units) */
export const planWalk = (x0: number, x1: number, t0: number, stepDur: number, stride: number, lead: 'n' | 'f' = 'n', gap = 60): Walk => {
  const dir = Math.sign(x1 - x0) || 1;
  const steps: Step[] = [];
  let n = x0 - (dir * gap) / 2;
  let f = x0 + (dir * gap) / 2;
  const nx0 = n;
  const fx0 = f;
  let foot: 'n' | 'f' = lead;
  let t = t0;
  let guard = 0;
  // a first half step, then full strides, then a closing half step
  while (guard++ < 60) {
    const from = foot === 'n' ? n : f;
    const other = foot === 'n' ? f : n;
    let to = other + dir * stride * (steps.length === 0 ? 0.55 : 1);
    let last = false;
    if ((to - x1) * dir >= 0) {
      to = x1 + (dir * gap) / 2 * (foot === 'n' ? -1 : 1);
      last = true;
    }
    const d = stepDur * (steps.length === 0 ? 0.8 : 1);
    steps.push({foot, t0: t, t1: t + d, x0: from, x1: to});
    if (foot === 'n') n = to;
    else f = to;
    t += d;
    foot = foot === 'n' ? 'f' : 'n';
    if (last) {
      // the trailing foot closes beside it
      const fromT = foot === 'n' ? n : f;
      const toT = x1 + (dir * gap) / 2 * (foot === 'n' ? -1 : 1);
      steps.push({foot, t0: t, t1: t + stepDur * 0.8, x0: fromT, x1: toT});
      break;
    }
  }
  return {steps, nx0, fx0};
};

/** the walk's state at t: ankle x, lifts, pitches, the hip x and how much the stride lowers the hips (0..1) */
export const walkAt = (w: Walk, t: number, legLen: number) => {
  const nF = footAt(w.steps, 'n', t, w.nx0);
  const fF = footAt(w.steps, 'f', t, w.fx0);
  const moving = w.steps.some((s) => t > s.t0 - 0.15 && t < s.t1 + 0.15);
  const mid = (nF.x + fF.x) / 2;
  // the hips lead toward the swinging foot's destination while it is in the air
  let lead = 0;
  for (const s of w.steps) if (t > s.t0 && t < s.t1) lead = (s.x1 - mid) * 0.25 * Math.sin(Math.PI * clamp((t - s.t0) / (s.t1 - s.t0)));
  const sep = Math.abs(nF.x - fF.x);
  const drop = legLen - Math.sqrt(Math.max(0, legLen * legLen - (sep / 2) ** 2));
  return {nF, fF, hipX: mid + lead, drop, moving, swing: (nF.x - fF.x) / Math.max(1, legLen)};
};
export {lerp};
