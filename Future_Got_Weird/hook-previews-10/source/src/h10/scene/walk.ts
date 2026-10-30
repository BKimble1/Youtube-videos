// HOOK 10: the participant's walk as a pure function of time (seconds). A slow, deliberate assisted gait with a
// front-wheeled walker: both ankles are IK targets (the stance foot planted on the floor, the swing foot carried on a
// lifted arc), the pelvis moves forward at a steady speed with a small vertical bob, and both hands hold the walker's
// grips (the walker rolls with him). He faces screen-left; the floor is y = 0.
import {DIM, ManPose, manJoints} from '../rig/Man';
import {clamp, lerp, V} from '../rig/math';
import {GAIT} from './cues';

const sm5 = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

export const SOLE = 27; // ankle height above the floor (shoe)
const V_WALK = (2 * GAIT.stride) / (2 * GAIT.T); // pelvis speed (units/s): one stride per period

/** pelvis x: a steady forward travel (screen-left) */
export const pelvisX = (t: number) => -V_WALK * t;

type Foot = {x: number; lift: number; u: number; swing: boolean};
/** a foot's ankle x and swing state. side 'L' (near) swings at near0 + kT, 'R' (far) half a period later. */
export const footAt = (t: number, side: 'L' | 'R'): Foot => {
  const {T, swing, near0, stride} = GAIT;
  const t0 = side === 'L' ? near0 : near0 + T / 2;
  // mid-stance of the near foot sits under the near hip, the far one under the far hip (3/4 view offsets)
  const k = Math.floor((t - t0) / T);
  const ph = t - t0 - k * T; // time since this cycle's lift-off
  // the foot's planted x before lift-off k: chosen so the pelvis passes over it at mid-stance
  const baseX = (kk: number) => {
    const tLand = t0 + kk * T + swing; // landing of swing kk
    const tMid = tLand + (T - swing) / 2; // mid-stance after it
    const hipOff = side === 'L' ? 34 : -40;
    return pelvisX(tMid) + hipOff + (side === 'L' ? 0 : -10);
  };
  const from = baseX(k - 1), to = baseX(k);
  if (ph < swing) {
    const u = ph / swing;
    return {x: lerp(from, to, sm5(u)), lift: Math.sin(Math.PI * Math.min(1, u * 1.08)) ** 1.3, u, swing: true};
  }
  return {x: to, lift: 0, u: 1, swing: false};
};

export const HAND_Y = -478; // walker grip height (floor = 0)
export const WALKER_DX = -150; // near grip centre relative to the pelvis

/** the walker's near-grip x (it rolls steadily with him, a small surge as each step loads it) */
export const walkerX = (t: number) => pelvisX(t) + WALKER_DX + 6 * Math.sin((2 * Math.PI * (t - 0.2)) / (GAIT.T / 2));

export const poseAt = (t: number): ManPose => {
  const L = footAt(t, 'L'), R = footAt(t, 'R');
  const hx = pelvisX(t);
  // bob: highest at mid-stance (twice per period), lowest in double support
  const ph = ((t - GAIT.near0 - GAIT.swing / 2) / (GAIT.T / 2)) * 2 * Math.PI;
  const hy = -474 - 6 * Math.cos(ph);
  const wx = walkerX(t);
  const ankY = (f: Foot) => -SOLE - 74 * f.lift;
  // a lifted swing foot toes down early (push-off) and up as it reaches forward (heel strike)
  const ank = (f: Foot) => (f.swing ? lerp(-40, 30, sm5(f.u)) * Math.sin(Math.PI * f.u) : 0);
  const sway = Math.sin(ph) * 1.2;
  return {
    x: hx, y: hy, s: 1,
    torso: 11 + sway * 0.6, chest: 4, neck: -4, turn: 0.5, pelvis: 0,
    lTu: 150, lTv: -40, lWx: wx - 6, lWy: HAND_Y, lW: 1, lElb: 1, lWr: 4,
    rTu: 150, rTv: 30, rWx: wx - 74, rWy: HAND_Y - 8, rW: 1, rElb: 1, rWr: 4,
    lHip: 0, lKnee: 0, lAnk: ank(L), rHip: 0, rKnee: 0, rAnk: ank(R),
    lFs: 1, lFsh: 1, rFs: 1, rFsh: 1,
    breath: 0.5 + 0.5 * Math.sin(t * 2.4),
    lAx: L.x, lAy: ankY(L), lA: 1, rAx: R.x, rAy: ankY(R), rA: 1,
  };
};

export const jointsAt = (t: number) => manJoints(poseAt(t));
export {DIM};
export type {V};
