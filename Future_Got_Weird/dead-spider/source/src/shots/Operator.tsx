// The operator: the Weird Crew lead (the red-haired guesser of Death Clock, Real Web Fluid and Glass Climbing) in his
// lab outfit, on his existing 2D rig (dc/Man.tsx), unchanged. He stands behind the bench; the rig is placed in the mm
// world as a billboard at his hip (1 rig unit = 1.55 mm), so the same camera that sees the syringe sees him at the right
// size. His near (left) index finger is solved onto the syringe's thumb rest, the same contact as the close-ups.
import React from 'react';
import {digitTips, HandPose} from '../dc/Hand';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';
import {DIM, GUESSER, Man, manJoints, ManPose, Outfit} from '../dc/Man';
import {add, mul, perp, sub, V} from '../dc/math';
import {Basis, proj, V3} from '../three';
import {COAT, GLOVE} from './common';

export const MM_PER_UNIT = 1.55;
export const HERO_LAB: Outfit = {...GUESSER, shirt: COAT, stripe: null, longSleeve: true, glasses: true, glove: GLOVE};
export const EXPR_FOCUS: Expr = {...EXPR_NEUTRAL, browIn: 0.05, browDown: 0.55, lid: 0.22, squint: 0.1, smile: 0.0, open: 0.02, wide: 0.9, gx: -0.55, gy: 0.45, flush: 0.15};
export const H_PRESS: HandPose = {curl: [0.08, 0.84, 0.9, 0.93], spread: 0.14, thumb: 24, thumbCurl: 0.55};
export const H_REST: HandPose = {curl: [0.3, 0.36, 0.42, 0.46], spread: 0.28, thumb: 22, thumbCurl: 0.4};

const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 9, chest: 6, neck: 6, turn: 0.42, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: -1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: -1, rWr: 0,
  lHip: 4, lKnee: 3, lAnk: 0, rHip: -4, rKnee: 3, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
const dirOf = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** a pose whose hand puts its hand-unit point (gu, gv) on `grip` with the hand axis at `ang` (Real Web Fluid V6) */
const placeHand = (p: ManPose, side: 'L' | 'R', grip: V, ang: number, gu: number, gv: number): ManPose => {
  const LH = DIM.hand * p.s;
  const ARM = (DIM.upperArm + DIM.foreArm) * p.s;
  const ts = side === 'L' ? 1 : -1;
  const d = dirOf(ang);
  const drawnWrist = sub(sub(grip, mul(d, gu * LH)), mul(perp(d), gv * LH * ts));
  const S = side === 'L' ? manJoints(p).L.S : manJoints(p).R.S;
  const dist = Math.hypot(drawnWrist.x - S.x, drawnWrist.y - S.y);
  const fa = Math.min(1, Math.max(0.62, dist / (ARM * 0.82)));
  let fd = d;
  let q = p;
  for (let i = 0; i < 4; i++) {
    const W = add(drawnWrist, mul(fd, 6 * p.s));
    q = side === 'L' ? {...p, lWx: W.x, lWy: W.y, lW: 1, lFa: fa} : {...p, rWx: W.x, rWy: W.y, rW: 1, rFa: fa};
    const j = manJoints(q);
    fd = (side === 'L' ? j.L : j.R).foreDir;
  }
  const wr = wrap(ang - (Math.atan2(fd.y, fd.x) * 180) / Math.PI);
  return side === 'L' ? {...q, lWr: wr} : {...q, rWr: wr};
};
const tipUV = (pose: HandPose) => {
  const t = digitTips({x: 0, y: 0}, 0, 1, 1, pose).tips[0];
  return {u: t.x, v: t.y};
};

/** draw the operator: hip at a world point; `press` = the world point under his index fingertip (or null: the hand
 *  rests by the stand); `restR` = where his far hand rests (world) */
export const Operator: React.FC<{B: Basis; id: string; hip: V3; press: V3; pressAng: number; restR: V3; expr?: Expr; blink?: number}> = ({B, id, hip, press, pressAng, restR, expr = EXPR_FOCUS, blink = 0}) => {
  const H = proj(B, hip);
  const k = H.s * MM_PER_UNIT;
  const toRig = (w: V3): V => {
    const q = proj(B, w);
    return {x: (q.x - H.x) / k, y: (q.y - H.y) / k};
  };
  let pose = BASE;
  const uv = tipUV(H_PRESS);
  pose = placeHand(pose, 'L', toRig(press), pressAng, uv.u, uv.v);
  pose = placeHand(pose, 'R', toRig(restR), 150, 0.3, 0.0);
  return (
    <g transform={`translate(${H.x.toFixed(2)} ${H.y.toFixed(2)}) scale(${k.toFixed(4)})`}>
      <Man id={id} pose={pose} expr={expr} blink={blink} lHand={H_PRESS} rHand={H_REST} outfit={HERO_LAB} inkK={0.9} />
    </g>
  );
};
