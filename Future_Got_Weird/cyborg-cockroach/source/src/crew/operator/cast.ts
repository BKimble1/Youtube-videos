// The operator: the Weird Crew's guesser (red spiky hair, peach skin, coral cheeks) in his lab outfit, as in Real Web
// Fluid V6 (moth-silk-web-shooter v6/cast6.ts HERO_LAB: white coat with long sleeves over the tee, clear safety glasses,
// blue nitrile gloves). Base standing pose, his expressions and the hand poses used with the research remote.
import {GUESSER, ManPose, Outfit} from './dc/Man';
import {Expr, EXPR_NEUTRAL, mixExpr} from './dc/Head';
import {HandPose} from './dc/Hand';

export const GLOVE = '#9DC3E6';
export const COAT = '#F4F7FA';
/** the lab: white coat over the tee, clear safety glasses, nitrile gloves (cast6.ts HERO_LAB, unchanged) */
export const HERO_LAB: Outfit = {...GUESSER, shirt: COAT, stripe: null, longSleeve: true, glasses: true, glove: GLOVE};

/** standing, 3/4 facing screen-left (cast6.ts BASE) */
export const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 4, chest: 4, neck: -2, turn: 0.5, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};

// ------------------------------------------------------------------ expressions (gaze gx / gy are set by the shot)
/** concentrating on the target: brows down, lids a little lowered, mouth flat (cast6.ts EXPR_FOCUS) */
export const EXPR_FOCUS: Expr = {...EXPR_NEUTRAL, browIn: 0.05, browDown: 0.7, lid: 0.22, squint: 0.1, smile: -0.05, open: 0.02, wide: 0.9, gx: -0.75, gy: -0.15, flush: 0.2};
/** calm, attentive lab look with a faint smile (cast6.ts EXPR_LAB) */
export const EXPR_LAB: Expr = {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.25, lid: 0.18, smile: 0.2, gx: -0.5, gy: 0.55};
/** a small satisfied look when it works (glass-climbing world/pose.ts EX.pleased) */
export const EXPR_PLEASED: Expr = {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.15, lid: 0.16, squint: 0.2, smile: 0.55, open: 0.05, wide: 1.0, teeth: 0.2, gx: -0.75, gy: -0.5, flush: 0.25};

export type OperatorExprName = 'focus' | 'neutral' | 'pleased';
export const OPERATOR_EXPR: Record<OperatorExprName, Expr> = {focus: EXPR_FOCUS, neutral: EXPR_LAB, pleased: EXPR_PLEASED};
export type ExprArg = OperatorExprName | Expr;
export const exprOf = (e: ExprArg): Expr => (typeof e === 'string' ? OPERATOR_EXPR[e] : e);
/** a mix of two named (or explicit) expressions, 0 = a, 1 = b */
export const operatorExpr = (a: ExprArg, b: ExprArg = a, t = 0): Expr => mixExpr(exprOf(a), exprOf(b), Math.min(1, Math.max(0, t)));

// ------------------------------------------------------------------ hand poses with the remote
/** near (left) hand round the remote in the bench figure: fingers curled under it, thumb along its top */
export const H_REMOTE: HandPose = {curl: [0.6, 0.66, 0.7, 0.74], spread: 0.1, thumb: 18, thumbCurl: 0.3};
/** close-up grip: the palm under the remote, fingers curled round its far edge, the thumb over the face */
export const H_REMOTE_CU: HandPose = {curl: [0.55, 0.6, 0.66, 0.8], spread: 0.16, thumb: -30, thumbCurl: 0.35};
/** the far hand resting flat on the bench top */
export const H_BENCH: HandPose = {curl: [0.14, 0.18, 0.22, 0.26], spread: 0.3, thumb: 24, thumbCurl: 0.25};
/** the far hand hanging relaxed at his side */
export const H_SIDE: HandPose = {curl: [0.3, 0.36, 0.42, 0.46], spread: 0.25, thumb: 14, thumbCurl: 0.55};

// ------------------------------------------------------------------ blink and breath (pure functions of time)
/** a natural blink track: closes over ~2 frames and opens over ~3, about every 3.4 s (irregular but deterministic);
 *  `t` in seconds, returns 0..1 for the `blink` prop */
export const blinkAt = (t: number, phase = 0): number => {
  const starts = [0.6, 3.7, 6.5, 7.0, 10.4, 13.9, 16.6];
  const period = 18;
  const tt = (((t + phase) % period) + period) % period;
  let b = 0;
  for (const s of starts) {
    const d = tt - s;
    if (d < 0 || d > 0.2) continue;
    // 0 -> 1 in 0.067 s, held 0.033 s, 1 -> 0 in 0.1 s
    b = Math.max(b, d < 0.067 ? d / 0.067 : d < 0.1 ? 1 : 1 - (d - 0.1) / 0.1);
  }
  return Math.max(0, Math.min(1, b));
};
/** slow breathing, -1..1 (one breath every 3.8 s) */
export const breathAt = (t: number) => Math.sin((t / 3.8) * Math.PI * 2);
