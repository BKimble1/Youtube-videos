// The lead: the Weird Crew's guesser (red spiky hair, peach skin, white tee with saffron stripes, navy trousers, white
// shoes), the same character as Death Clock, Infrared Contacts and Real Web Fluid (dc/Man, dc/Head; GUESSER outfit).
// Base pose and expressions (Real Web Fluid V6 cast6.ts, plus a climbing strain and a dry "hm" for the brick test).
import {GUESSER, ManPose, Outfit} from '../dc/Man';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';

export const HERO: Outfit = GUESSER;

export const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 4, chest: 4, neck: -2, turn: 0.5, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
export const P = (o: Partial<ManPose>): ManPose => ({...BASE, ...o});

export const EX = {
  focus: {...EXPR_NEUTRAL, browIn: 0.1, browDown: 0.45, lid: 0.18, squint: 0.08, smile: 0.02, open: 0.02, wide: 0.9, gx: -0.8, gy: -0.3, flush: 0.15} as Expr,
  /** effort while standing up in a stirrup: brows down, a clenched, slightly open mouth (brief) */
  strain: {...EXPR_NEUTRAL, browIn: 0.35, browDown: 0.8, lid: 0.25, squint: 0.3, smile: -0.25, open: 0.1, wide: 0.86, teeth: 0.7, gx: -0.8, gy: -0.45, flush: 0.45} as Expr,
  /** a small satisfied look after a placement */
  pleased: {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.15, lid: 0.16, squint: 0.2, smile: 0.55, open: 0.05, wide: 1.0, teeth: 0.2, gx: -0.75, gy: -0.5, flush: 0.25} as Expr,
  /** looking down at the bench test */
  bench: {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.3, lid: 0.22, smile: 0.1, gx: -0.6, gy: 0.6, flush: 0.12} as Expr,
  /** the brick slips: brows up, mouth pulled to one side */
  doubt: {...EXPR_NEUTRAL, browIn: 0.8, browDown: 0.05, lid: 0.08, smile: -0.35, open: 0.08, wide: 0.8, gx: -0.5, gy: 0.65, flush: 0.2} as Expr,
};
