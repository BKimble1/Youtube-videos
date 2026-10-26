// Lightning Laser cast: two established Weird Crew designs on the Death Clock rig (dc/Man, dc/Head, dc/Hand).
//
// LEAD: the guesser (Video 01 cast.ts `guesser`: peach skin, red spiky hair, white tee with saffron stripes, navy
// trousers, white shoes, coral cheeks) exactly as in Death Clock / Real Web Fluid / Glass Climbing. The brief names
// green eyes; the repository's head has ink pupils only, so a green iris ring is the one addition (dc/Head `iris`).
//
// OPERATOR: Video 01 cast.ts `clerkB` (skin #8D5A3C, black bun, white shirt under a blue cardigan, navy trousers,
// brown shoes, glasses, earring, name badge). The repository has her only on the flat Video 01 rig
// (components/Character.tsx); here she is drawn in the same Death Clock construction as the lead, with her Video 01
// colours, bun silhouette (scaled 58 -> 100), rounded-rectangle frames, saffron stud and badge.
import {Outfit, GUESSER, ManPose} from './dc/Man';
import {Expr, EXPR_NEUTRAL} from './dc/Head';
import {HandPose} from './dc/Hand';

export const C01 = {blue: '#4F7CC9', blueDeep: '#3A5FA0', saffron: '#FFC744', coral: '#EF6B55', teal: '#1CA7A0', cream: '#FFFBF0'};
export const GREEN_EYE = '#3E9E62';

export const LEAD: Outfit = {...GUESSER, iris: GREEN_EYE};

export const OPERATOR: Outfit = {
  skin: '#8D5A3C', hair: '#1E1A1A', shirt: C01.blue, stripe: null, pants: '#2E3F5C', shoe: '#3B2A22', longSleeve: true,
  hairStyle: 'bun', frames: true, earring: true, cheekK: 0.45, front: {inner: '#FFFFFF', badge: '#FFFFFF'},
};

export const E_FOCUS: Expr = {...EXPR_NEUTRAL, browIn: 0.1, browDown: 0.45, lid: 0.15, smile: 0.0, open: 0.02, gx: 0.5, gy: -0.5};
export const E_TRACK: Expr = {...EXPR_NEUTRAL, browIn: 0.35, browDown: 0.1, lid: 0.05, smile: 0.1, open: 0.12, wide: 0.8, gx: 0.6, gy: -0.85, pupil: 0.9};
export const E_WARY: Expr = {...EXPR_NEUTRAL, browIn: 0.8, browDown: 0.1, lid: 0.0, smile: -0.35, open: 0.06, wide: 0.8, gx: 0.3, gy: -0.9, pupil: 0.82, sweat: 0.3};
export const E_JOLT: Expr = {...EXPR_NEUTRAL, browIn: 1, browDown: 0.3, lid: 0, squint: 0.1, shut: 0.85, pupil: 0.7, open: 0.55, wide: 0.75, smile: -0.7, teeth: 0.6, gx: 0, gy: 0, flush: 0.6};
export const E_FRAZZLED: Expr = {...EXPR_NEUTRAL, browIn: 0.95, browDown: 0, lid: 0, squint: 0, pupil: 0.55, open: 0.32, wide: 0.7, smile: -0.4, teeth: 0.1, gx: 0.15, gy: -0.1, sweat: 0.6, flush: 0.5};

export const H_REST: HandPose = {curl: [0.3, 0.36, 0.42, 0.46], spread: 0.25, thumb: 18, thumbCurl: 0.5};
export const H_PINCH: HandPose = {curl: [0.55, 0.62, 0.72, 0.78], spread: 0.2, thumb: 40, thumbCurl: 0.45};
export const H_SPLAY: HandPose = {curl: [0.02, 0.04, 0.06, 0.1], spread: 0.95, thumb: 55, thumbCurl: 0.05};
export const H_FIST: HandPose = {curl: [0.85, 0.9, 0.92, 0.94], spread: 0.2, thumb: 18, thumbCurl: 0.6};

export const BASE: ManPose = {
  x: 0, y: 0, s: 1, torso: 4, chest: 4, neck: -2, turn: 0.5, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
export const P = (o: Partial<ManPose>): ManPose => ({...BASE, ...o});
