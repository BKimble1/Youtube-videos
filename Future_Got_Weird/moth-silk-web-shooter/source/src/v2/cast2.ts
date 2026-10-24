// V2 cast: the Weird Crew's guesser as the lead (the red-haired, striped-tee man of Death Clock and Infrared
// Contacts), in his street outfit and in the lab (white coat over the tee, safety glasses, nitrile gloves), and the
// street runner built from the same rig parts (plain jacket, beanie, domino mask).
import {Outfit, GUESSER, ManPose} from './dc/Man';
import {Expr, EXPR_NEUTRAL} from './dc/Head';
import {HandPose} from './dc/Hand';

export const HERO: Outfit = GUESSER;
export const GLOVE = '#9DC3E6';
export const COAT = '#F4F7FA';
export const RUNNER: Outfit = {skin: '#E0A982', hair: '#3B2A22', shirt: '#4B5A4A', stripe: null, pants: '#2B3340', shoe: '#D9DEE2', longSleeve: true, hat: {color: '#B4483C', band: '#943A31'}, mask: '#1E2A33'};
export const BAG = {body: '#C9963F', deep: '#9A6E2A', strap: '#6E4E22'};

export const EXPR_FOCUS: Expr = {...EXPR_NEUTRAL, browIn: 0.05, browDown: 0.7, lid: 0.22, squint: 0.1, smile: -0.05, open: 0.02, wide: 0.9, gx: -0.75, gy: -0.15, flush: 0.2};
export const EXPR_FIRE: Expr = {...EXPR_FOCUS, browDown: 0.85, squint: 0.12, open: 0.16, wide: 0.8, smile: -0.15, teeth: 0.7};
export const EXPR_GRIN: Expr = {...EXPR_FOCUS, browDown: 0.2, browIn: 0.2, squint: 0.25, smile: 0.75, open: 0.12, wide: 1.1, teeth: 0.6, gx: -0.6, gy: -0.05};
export const EXPR_LAB: Expr = {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.25, lid: 0.18, smile: 0.2, gx: -0.5, gy: 0.55};
export const EXPR_SHOCK: Expr = {...EXPR_NEUTRAL, browIn: 0.9, browDown: 0, lid: 0, squint: 0, pupil: 0.62, open: 0.55, wide: 0.75, smile: -0.5, teeth: 0.1, gx: 0.6, gy: 0, flush: 0.4};
export const EXPR_RUN: Expr = {...EXPR_NEUTRAL, browIn: 0.3, browDown: 0.5, lid: 0.1, open: 0.2, wide: 0.8, smile: -0.2, gx: -0.8, gy: 0};

/** the web-shooter gesture: middle and ring fingers pressed to the palm, index and pinky out, thumb open */
export const HAND_THWIP: HandPose = {curl: [0.04, 0.95, 0.95, 0.06], spread: 0.9, thumb: 48, thumbCurl: 0.1};
export const HAND_READY: HandPose = {curl: [0.3, 0.42, 0.48, 0.5], spread: 0.4, thumb: 30, thumbCurl: 0.3};
export const HAND_FIST: HandPose = {curl: [0.85, 0.9, 0.92, 0.94], spread: 0.2, thumb: 18, thumbCurl: 0.6};
export const HAND_GRIP: HandPose = {curl: [0.62, 0.7, 0.74, 0.78], spread: 0.25, thumb: 34, thumbCurl: 0.45};

export const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 4, chest: 4, neck: -2, turn: 0.5, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
export const P = (o: Partial<ManPose>): ManPose => ({...BASE, ...o});
