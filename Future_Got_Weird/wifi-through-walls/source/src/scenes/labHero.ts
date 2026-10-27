// The guesser in the lab: every pose is a keyed function of time. Card origin HERO_G (the floor under him); his rig
// faces screen-left, so his back is toward the dividing wall on his right. Times are seconds of the film; the hook's
// keys use loop time tau (the end of the film runs into frame 0, so the dash to the wall that ends the film is the
// same motion the film opens on).
import {EXPR_GASP, EXPR_NEUTRAL, EXPR_RELIEF, EXPR_UNEASY, EXPR_WINCE, Expr, mixExpr} from '../dc/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../dc/Hand';
import {lerpPose, ManPose} from '../dc/Man';
import {keyed, pose} from '../art/person';
import {v3} from '../world/cam';
import {DUR, word} from '../lib';

export const HERO_G = v3(-0.56, 0, 1.15);
/** local x (rig units) of the wall's face behind him */
export const WALL_LX = (-0.13 - HERO_G.x) * 600;

const e = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
export const X = {
  alarm: e({browIn: 0.85, browDown: 0.1, lid: 0, pupil: 0.62, open: 0.45, wide: 0.75, smile: -0.55, gx: -0.7, gy: 0, flush: 0.3}),
  hush: e({browIn: 0.7, browDown: 0.2, lid: 0.1, pupil: 0.75, open: 0.05, wide: 0.6, smile: -0.2, gx: -0.85, gy: 0.1, flush: 0.35}),
  hide: e({browIn: 0.95, browDown: 0.3, lid: 0.25, squint: 0.3, shut: 0.55, pupil: 0.8, open: 0.02, wide: 0.7, smile: -0.5, gx: 0, gy: 0.3, sweat: 0.4, flush: 0.4}),
  peek: e({browIn: 0.8, browDown: 0, lid: 0.05, pupil: 0.72, open: 0.08, wide: 0.75, smile: -0.35, gx: 0.6, gy: -0.2, sweat: 0.3, flush: 0.3}),
  curious: e({browIn: 0.35, browDown: 0, lid: 0.05, pupil: 0.95, open: 0.12, wide: 0.9, smile: 0.1, gx: 0.2, gy: -0.6, flush: 0.2}),
  playful: e({browIn: 0.2, browDown: 0, lid: 0.12, squint: 0.25, pupil: 1, open: 0.25, wide: 1.1, smile: 0.7, teeth: 0.5, gx: 0.3, gy: -0.5, flush: 0.35}),
  gasp: EXPR_GASP, uneasy: EXPR_UNEASY, relief: EXPR_RELIEF, wince: EXPR_WINCE, neutral: EXPR_NEUTRAL,
};
const HAND_POINT: HandPose = {curl: [0.02, 0.92, 0.95, 0.95], spread: 0.15, thumb: 12, thumbCurl: 0.7};
const HAND_FLAT: HandPose = {curl: [0.04, 0.04, 0.06, 0.08], spread: 0.3, thumb: 30, thumbCurl: 0.1};
const HAND_HUG: HandPose = {curl: [0.55, 0.6, 0.64, 0.68], spread: 0.2, thumb: 30, thumbCurl: 0.4};
export const HANDS = {point: HAND_POINT, flat: HAND_FLAT, hug: HAND_HUG, brace: HAND_BRACE, relaxed: HAND_RELAXED, clutch: HAND_CLUTCH};

// ------------------------------------------------------------------ key poses (rig-local; floor y = 0)
const HIPX = WALL_LX - 112; // back flat on the wall
/** crouched against the wall: hips low, feet planted in front of him, hands on knees */
const CROUCH: ManPose = pose({x: HIPX + 6, y: -215, torso: -2, chest: 4, neck: 4, turn: 0.5,
  lW: 1, lWx: HIPX - 300, lWy: -300, lElb: 1, lWr: 30, rW: 1, rWx: HIPX - 250, rWy: -290, rElb: 1, rWr: 30,
  lAx: HIPX - 250, lAy: -27, lA: 1, rAx: HIPX - 165, rAy: -27, rA: 1, lFsh: 1, rFsh: 1});
const SHH: ManPose = {...CROUCH, lW: 0, lTu: -5, lTv: -145, lElb: -1, lWr: 15, neck: 2, turn: 0.62, torso: 0, chest: 6};
const LOW: ManPose = {...CROUCH, y: -180, x: HIPX + 10, torso: 22, chest: 12, neck: 20, turn: 0.38,
  lW: 1, lWx: HIPX - 225, lWy: -250, rW: 1, rWx: HIPX - 175, rWy: -245};
/** standing flat against the wall, palms on it */
const FLAT: ManPose = pose({x: HIPX, y: -488, torso: -5, chest: -4, neck: 3, turn: 0.55,
  lTu: -300, lTv: 30, lElb: -1, lWr: 8, rTu: -262, rTv: 112, rElb: -1,
  lAx: HIPX - 70, lAy: -27, lA: 1, rAx: HIPX + 10, rAy: -27, rA: 1});
/** mid-skid: hips dropping, near foot braking in front, far foot reaching back to the wall, arms flung for balance */
const SKID: ManPose = pose({x: HIPX - 95, y: -470, torso: -13, chest: -6, neck: 7, turn: 0.78,
  lTu: -250, lTv: 40, lElb: -1, lWr: 14, rTu: -205, rTv: 175, rElb: -1,
  lHip: 40, lKnee: 4, lAnk: -12, rHip: -4, rKnee: 44, rAnk: 6});
/** backing up fast from the camera corner: two quick steps */
const STEP_A: ManPose = pose({x: HIPX - 400, y: -500, torso: -6, chest: -3, neck: 4, turn: 0.75,
  lTu: -230, lTv: -60, lElb: 1, rTu: -230, rTv: 140, rElb: -1, lHip: 24, lKnee: 8, rHip: -16, rKnee: 30});
const STEP_B: ManPose = pose({x: HIPX - 250, y: -490, torso: -9, chest: -4, neck: 5, turn: 0.77,
  lTu: -240, lTv: 10, lElb: -1, rTu: -215, rTv: 160, rElb: -1, lHip: -10, lKnee: 34, rHip: 20, rKnee: 6});

// Scene C: raise the near hand, a little wave, then the far hand and a lean
const RAISE: ManPose = {...CROUCH, torso: -4, chest: 0, neck: -6, turn: 0.55, lW: 0, lTu: 300, lTv: -60, lElb: 1, lWr: 0};
const BOTH: ManPose = {...RAISE, rW: 0, rTu: 280, rTv: 30, rElb: -1, torso: -8, neck: -4, roll: 0} as ManPose;

// Scene I (the security camera): he walks in under it, looks up, reaches up and covers the lens with his palm
const UX = HIPX - 674;
const WALK_IN: ManPose = pose({x: UX - 170, y: -500, torso: 4, chest: 0, neck: -4, turn: 0.55, lTu: -318, lTv: -70, rTu: -315, rTv: 95,
  lHip: 20, lKnee: 10, rHip: -20, rKnee: 30});
const UNDER: ManPose = pose({x: UX, y: -506, torso: 0, chest: -2, neck: -12, turn: 0.5, lTu: -330, lTv: 28, lElb: -1, rTu: -325, rTv: 60, rElb: -1,
  lAx: UX - 50, lAy: -27, lA: 1, rAx: UX + 40, rAy: -27, rA: 1});
const LOOKUP: ManPose = {...UNDER, neck: -26, chest: -6, torso: -2, turn: 0.42};
const COVER: ManPose = {...UNDER, y: -540, neck: -24, chest: -8, torso: -4, turn: 0.45, lW: 1, lWx: (-1.38 - HERO_G.x) * 600, lWy: -2.04 * 600, lElb: -1, lWr: -20,
  lAx: UX - 50, lAy: -40, rAx: UX + 40, rAy: -40, lAnk: 20, rAnk: 20};
const SMUG: ManPose = {...COVER, neck: -14, turn: 0.62, chest: -4};
const STARTLE: ManPose = {...COVER, y: -528, neck: -4, turn: 0.78, torso: 6, chest: 2, rTu: -240, rTv: 120};
/** the ending (scene I) runs from END0 to the film's last frame, where it hands over to frame 0's skid */
export const END0 = DUR - 4.8;
/** kept for callers that think in loop time */
export const tau = (t: number) => t;

export const heroLab = (t: number): {p: ManPose; x: Expr; lh: HandPose; rh: HandPose} => {
  const W = word;
  const hand = W('hand', 0).start, its = W('its').start, hand2 = W('hand', 1).start;
  const now = W('now').start, camera = W('camera').start, or = W('or').start, watching = W('watching').start;
  if (t > END0) {
    const p = keyed<ManPose>(t, [
      [END0, WALK_IN], [now + 0.2, UNDER], [now + 0.5, LOOKUP], [camera - 0.32, LOOKUP], [camera + 0.02, COVER],
      [watching + 0.2, SMUG], [or + 0.45, SMUG], [DUR - 1.35, STARTLE], [DUR - 0.75, STEP_A], [DUR - 0.38, STEP_B], [DUR, SKID],
    ], lerpPose);
    const x = keyed<Expr>(t, [[END0, X.neutral], [now + 0.3, X.curious], [camera - 0.2, X.hush], [camera + 0.3, X.playful], [or + 0.4, X.playful], [DUR - 1.3, X.gasp], [DUR, X.alarm]], mixExpr);
    const lh = keyed<HandPose>(t, [[END0, HAND_RELAXED], [camera - 0.3, HAND_RELAXED], [camera - 0.05, HAND_FLAT], [DUR - 1.35, HAND_FLAT], [DUR - 0.9, HAND_BRACE], [DUR, HAND_BRACE]], mixHand);
    const rh = keyed<HandPose>(t, [[END0, HAND_RELAXED], [DUR - 1.2, HAND_RELAXED], [DUR - 0.9, HAND_BRACE], [DUR, HAND_BRACE]], mixHand);
    return {p, x, lh, rh};
  }
  const p = keyed<ManPose>(t, [
    [0.0, SKID], [0.3, FLAT], [1.08, CROUCH], [1.72, CROUCH], [2.05, SHH], [2.55, SHH], [3.3, LOW],
    [hand - 0.45, LOW], [hand + 0.05, RAISE], [hand2 - 0.2, RAISE], [hand2 + 0.35, BOTH], [END0, BOTH],
  ], lerpPose);
  // the wave: wrist and forearm rock while the hand is up
  const wave = t > hand + 0.1 && t < its ? Math.sin((t - hand - 0.1) * 2 * Math.PI * 2.4) * 18 * Math.sin(Math.min(1, (its - t) / 0.3) * Math.PI / 2) : 0;
  const px: ManPose = {...p, lWr: p.lWr + wave, lTv: p.lTv + wave * 1.4};
  const x = keyed<Expr>(t, [
    [0, X.alarm], [0.3, X.alarm], [1.0, X.hush], [1.7, X.hush], [2.1, X.peek], [2.6, X.hush], [3.3, X.hide],
    [hand - 0.6, X.hide], [hand - 0.2, X.curious], [hand + 0.4, X.playful], [END0, X.playful],
  ], mixExpr);
  const lh = keyed<HandPose>(t, [[0, HAND_BRACE], [0.2, HAND_BRACE], [0.35, HAND_FLAT], [0.9, HAND_FLAT], [1.2, HAND_CLUTCH], [1.8, HAND_CLUTCH], [2.0, HAND_POINT], [2.6, HAND_POINT], [3.1, HAND_HUG], [hand - 0.3, HAND_HUG], [hand, HAND_BRACE], [END0, HAND_BRACE]], mixHand);
  const rh = keyed<HandPose>(t, [[0, HAND_BRACE], [0.2, HAND_BRACE], [0.35, HAND_FLAT], [0.9, HAND_FLAT], [1.2, HAND_CLUTCH], [3.1, HAND_HUG], [hand2, HAND_HUG], [hand2 + 0.3, HAND_BRACE], [END0, HAND_BRACE]], mixHand);
  return {p: px, x, lh, rh};
};
