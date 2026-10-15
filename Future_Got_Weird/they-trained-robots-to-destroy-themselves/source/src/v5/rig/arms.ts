// V5 arm helpers. Reaching is a blend of joint angles between the pose's own (FK) arms and the IK solution for a
// hand target — never a switch — so a hand can leave a free pose, take hold of a prop and let go again without a pop.
// Props are then placed from the solved palm, so a carried object is always exactly in the hand.
import {RPose, rig, solveIK, ArmP} from '../../v4/rig/Robot2D';

type Pt = {x: number; y: number};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAng = (a: number, b: number, t: number) => {
  let d = (((b - a) % 360) + 540) % 360 - 180;
  if (!Number.isFinite(d)) d = 0;
  return a + d * t;
};
const mixArm = (a: ArmP, b: ArmP, w: number): ArmP => ({...a, sh: lerpAng(a.sh, b.sh, w), el: lerpAng(a.el, b.el, w)});

/** Arms of `base` blended toward the IK solution for wrist targets tN / tF (weights wN / wF). Feet targets kept. */
export const reachArms = (base: RPose, s: number, face: 1 | -1, tN?: Pt, tF?: Pt, wN = 1, wF = wN): RPose => {
  if ((!tN || wN <= 0) && (!tF || wF <= 0)) return {...base, handN: undefined, handF: undefined};
  const ik = solveIK({...base, handN: tN, handF: tF}, s, face);
  return {
    ...base, handN: undefined, handF: undefined,
    armN: tN && wN > 0 ? mixArm(base.armN, ik.armN, Math.min(1, wN)) : base.armN,
    armF: tF && wF > 0 ? mixArm(base.armF, ik.armF, Math.min(1, wF)) : base.armF,
  };
};

/** Palm points of a pose (near / far). */
export const palms = (p: RPose, s: number, face: 1 | -1 = 1) => {
  const r = rig(p, s, face);
  return {N: {x: r.pts.handN[0], y: r.pts.handN[1]}, F: {x: r.pts.handF[0], y: r.pts.handF[1]}, wN: {x: r.pts.wrN[0], y: r.pts.wrN[1]}, wF: {x: r.pts.wrF[0], y: r.pts.wrF[1]}};
};
export {lerp, lerpAng};
