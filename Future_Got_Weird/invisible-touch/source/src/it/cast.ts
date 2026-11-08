// The lead: the Weird Crew's guesser (red spiky hair, peach skin, white tee with saffron stripes, navy trousers, white
// shoes), the same character and rig as Glass Climbing / Real Web Fluid / Eel Escape (dc/Man, dc/Head, GUESSER outfit).
// Base standing pose (Glass Climbing's BASE) and the expressions this film needs.
import {ManPose} from '../dc/Man';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';

export const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 4, chest: 4, neck: -2, turn: 0.5, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
/** standing at the bench's end, leaning in a little over the array */
export const BASE_MAN: ManPose = {...BASE, x: 340, y: 30, torso: 10, chest: 6, neck: 8, turn: 0.55, rElb: -1, lTu: -170, lTv: 30, lElb: 1};

export const EXN = {
  neutral: EXPR_NEUTRAL,
  /** looking down at his fingertip, intrigued */
  wonder: {...EXPR_NEUTRAL, browIn: 0.45, browDown: 0, lid: 0.04, squint: 0, smile: 0.2, open: 0.12, wide: 0.82, gx: -0.75, gy: 0.75, flush: 0.2} as Expr,
  /** a small delighted smile as he feels it */
  delight: {...EXPR_NEUTRAL, browIn: 0.3, browDown: 0, lid: 0.12, squint: 0.25, smile: 0.7, open: 0.18, wide: 1.0, teeth: 0.35, gx: -0.75, gy: 0.7, flush: 0.35} as Expr,
  /** puzzled: the grab closes on nothing */
  puzzled: {...EXPR_NEUTRAL, browIn: 0.85, browDown: 0.05, lid: 0.06, smile: -0.25, open: 0.1, wide: 0.78, gx: -0.7, gy: 0.75, flush: 0.2} as Expr,
  /** focus */
  focus: {...EXPR_NEUTRAL, browIn: 0.1, browDown: 0.4, lid: 0.18, squint: 0.08, smile: 0.05, open: 0.02, wide: 0.9, gx: -0.8, gy: 0.6, flush: 0.15} as Expr,
};
