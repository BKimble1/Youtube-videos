// The visitor: the Weird Crew's guesser (red spiky hair, peach skin, coral cheeks, white tee with saffron stripes),
// drawn with his existing rig (dc/Man + dc/Head, the Death Clock -> Real Web Fluid -> Glass Climbing lineage),
// unchanged. Here he sits behind the lab bench in 3/4 view facing screen-left (toward the robot); the bench hides
// everything below his chest. This file only places the rig and names his expressions.
import React from 'react';
import {Expr, EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {GUESSER, Man, manJoints, ManPose} from '../dc/Man';
import {HAND_RELAXED, HandPose} from '../dc/Hand';

export const SEAT: ManPose = {
  x: 0, y: 0, s: 1, torso: 7, chest: 5, neck: -4, turn: 0.55, pelvis: 0,
  lTu: -340, lTv: -60, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: -340, rTv: -30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 80, lKnee: 80, lAnk: 0, rHip: 80, rKnee: 80, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};

/** expressions (dc/Head Expr) */
export const VX = {
  /** attentive, a faint resting smile, looking at the robot */
  rest: {...EXPR_NEUTRAL, smile: 0.12, lid: 0.12, gx: -0.75, gy: -0.05, flush: 0.12} as Expr,
  /** the first small cue of a smile: corners up a little, cheeks just lifting */
  cue: {...EXPR_NEUTRAL, smile: 0.42, lid: 0.14, squint: 0.1, wide: 1.03, gx: -0.75, gy: -0.05, flush: 0.2} as Expr,
  /** a full, warm smile with the upper teeth showing (open small, teeth < 0.5: not the clenched grimace) */
  smile: {...EXPR_NEUTRAL, smile: 1, open: 0.2, wide: 1.12, teeth: 0.45, lid: 0.18, squint: 0.42, browIn: 0.12, gx: -0.75, gy: -0.05, flush: 0.45} as Expr,
  /** telling good news: brows up, mouth mid-word */
  news: {...EXPR_NEUTRAL, smile: 0.55, open: 0.28, wide: 0.98, teeth: 0.3, lid: 0.06, browIn: 0.35, gx: -0.75, gy: -0.1, flush: 0.35} as Expr,
  /** an awkward beat (the late smile): smile fading, brows a little uncertain */
  awkward: {...EXPR_NEUTRAL, smile: 0.3, open: 0.04, wide: 0.92, lid: 0.12, browIn: 0.55, browDown: 0.05, gx: -0.75, gy: 0, flush: 0.25} as Expr,
  /** thoughtful (the ending): soft smile, eyes a little narrowed */
  thought: {...EXPR_NEUTRAL, smile: 0.4, open: 0.02, wide: 0.95, lid: 0.26, squint: 0.15, browIn: 0.3, gx: -0.7, gy: 0.05, flush: 0.18} as Expr,
  /** reading the notebook */
  read: {...EXPR_NEUTRAL, smile: 0.2, lid: 0.32, gx: -0.4, gy: 0.75, flush: 0.12} as Expr,
};
export {mixExpr};

type Props = {
  id: string;
  /** where his head centre should be (world) */
  hx: number;
  hy: number;
  s: number;
  expr: Expr;
  blink?: number;
  pose?: Partial<ManPose>;
  lHand?: HandPose;
  rHand?: HandPose;
  hairSway?: number;
  holdL?: React.ComponentProps<typeof Man>['holdL'];
  holdR?: React.ComponentProps<typeof Man>['holdR'];
};

/** the pose with its hip placed so the head lands at (hx, hy) */
export const placePose = (hx: number, hy: number, s: number, pose: Partial<ManPose> = {}): ManPose => {
  const p0: ManPose = {...SEAT, ...pose, x: 0, y: 0, s};
  const j = manJoints(p0);
  return {...p0, x: hx - j.head.x, y: hy - j.head.y};
};

export const Visitor: React.FC<Props> = ({id, hx, hy, s, expr, blink = 0, pose, lHand = HAND_RELAXED, rHand = HAND_RELAXED, hairSway = 0, holdL, holdR}) => {
  const p = placePose(hx, hy, s, pose);
  return <Man id={id} pose={p} expr={expr} blink={blink} lHand={lHand} rHand={rHand} outfit={GUESSER} hairSway={hairSway} holdL={holdL} holdR={holdR} />;
};
