// V6 (from V5; eased glances): the guesser in the lab, on one timeline in loop time (tau): the film's last seconds (he backs in behind the wall,
// thinks he is hidden, a ping tells him he is not, he drops into a crouch) are negative times, so frame 0 (startled,
// crouched, the display already tracking him) is the middle of one continuous action across the loop seam.
// Feet are explicit plants (a planted foot never slides; a stepping foot lifts on an arc and lands); the arms swing
// opposite the legs from the feet's actual positions; body keys carry the posture; a resting hand is solved onto its
// knee each frame (art/arms.ts). Actions (V5 brief): a sudden move of his near arm (0.4-0.9, the skeleton copies it),
// tucking lower and tighter against the wall (0.9-1.5), a hand to his chin, uneasy (1.5-3.2, still held when the
// skeleton is revealed on the screen), rising while the waves bounce off him (7.4-8.3), the right hand raised (11.3),
// a torso turn and a step (13.4), a crouch and a step back toward the wall (14.0).
import {EXPR_NEUTRAL, Expr, mixExpr} from '../dc/Head';
import {HAND_BRACE, HAND_RELAXED, HandPose, mixHand} from '../dc/Hand';
import {lerpPose, manJoints, ManPose} from '../dc/Man';
import {keyed, pose, SOLE} from '../art/person';
import {ArmAngles, armFK, armToward, mixArm} from '../art/arms';
import {settleHips} from '../art/walk';
import {v3} from '../world/cam';
import {DUR, word} from '../lib';
import {WALL} from './labSet6';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
/** card origin (the floor under him) */
export const HERO_G = v3(-0.5, 0, 1.15);
export const WALL_LX = (WALL.x0 - HERO_G.x) * 600;
/** the lab ending starts here (out of the café receiver's laptop screen into the lab's screen, on "knows") */
export const LAB_IN = T_('knows') + 0.1;
export const tau = (t: number) => (t >= LAB_IN ? t - DUR : t);

const e = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
export const X = {
  sneak: e({browIn: 0.6, browDown: 0.25, lid: 0.12, squint: 0.1, pupil: 0.85, open: 0, wide: 0.75, smile: -0.05, gx: -0.85, gy: 0.05, flush: 0.2}),
  safe: e({browIn: 0.3, browDown: 0, lid: 0.15, pupil: 1, open: 0.05, wide: 0.95, smile: 0.35, gx: -0.6, gy: 0.05, flush: 0.25}),
  startled: e({browIn: 0.95, browDown: 0, lid: 0, pupil: 0.55, open: 0.38, wide: 0.7, smile: -0.5, gx: 0.9, gy: -0.05, sweat: 0.4, flush: 0.4}),
  wary: e({browIn: 0.85, browDown: 0.15, lid: 0.05, pupil: 0.7, open: 0.04, wide: 0.66, smile: -0.35, gx: 0.75, gy: -0.3, sweat: 0.3, flush: 0.3}),
  held: e({browIn: 0.9, browDown: 0.25, lid: 0.15, squint: 0.15, pupil: 0.7, open: 0, wide: 0.55, smile: -0.4, gx: -0.3, gy: 0.15, sweat: 0.5, flush: 0.55}),
  peek: e({browIn: 0.85, browDown: 0.1, lid: 0.05, pupil: 0.65, open: 0.02, wide: 0.6, smile: -0.35, gx: 0.9, gy: -0.45, sweat: 0.5, flush: 0.45}),
  test: e({browIn: 0.7, browDown: 0.05, lid: 0.05, pupil: 0.8, open: 0.1, wide: 0.8, smile: -0.15, gx: -0.4, gy: -0.6, flush: 0.3}),
  gasp: e({browIn: 1, browDown: 0, lid: 0, pupil: 0.5, open: 0.55, wide: 0.6, smile: -0.6, gx: 0.95, gy: -0.15, sweat: 0.6, flush: 0.5}),
  curious: e({browIn: 0.35, browDown: 0, lid: 0.05, pupil: 0.95, open: 0.12, wide: 0.9, smile: 0.15, gx: 0.3, gy: -0.7, flush: 0.2}),
  playful: e({browIn: 0.2, browDown: 0, lid: 0.12, squint: 0.25, pupil: 1, open: 0.25, wide: 1.1, smile: 0.6, teeth: 0.4, gx: 0.35, gy: -0.6, flush: 0.35}),
  frozen: e({browIn: 1, browDown: 0, lid: 0, pupil: 0.5, open: 0.3, wide: 0.6, smile: -0.55, gx: 0.95, gy: -0.1, sweat: 0.7, flush: 0.5}),
  uneasy: e({browIn: 0.95, browDown: 0.1, lid: 0.08, pupil: 0.7, open: 0.06, wide: 0.7, smile: -0.5, gx: -0.6, gy: 0.2, sweat: 0.6, flush: 0.5}),
};
const HAND_FLAT: HandPose = {curl: [0.05, 0.05, 0.08, 0.1], spread: 0.45, thumb: 36, thumbCurl: 0.12};
const HAND_KNEE: HandPose = {curl: [0.45, 0.5, 0.55, 0.58], spread: 0.25, thumb: 34, thumbCurl: 0.35};
const HAND_CHIN: HandPose = {curl: [0.62, 0.7, 0.76, 0.8], spread: 0.15, thumb: 30, thumbCurl: 0.45};
const HAND_OPEN: HandPose = {curl: [0.02, 0.02, 0.04, 0.06], spread: 0.6, thumb: 40, thumbCurl: 0.08};

// ------------------------------------------------------------------ positions (rig-local units; floor y = 0)
export const HIPX = WALL_LX - 106;
const F_WALL = {L: HIPX - 200, R: HIPX - 130};
const F_SQ = {L: HIPX - 224, R: HIPX - 150};
const F_STEP = HIPX - 330;

/** foot plants: the foot is on the floor at x until `lift`, swings, lands at the next x at `land` */
type Plant = {lift: number; land: number; x: number};
const PL: Plant[] = [
  {lift: -99, land: -99, x: -560},
  // backing in behind the wall (long careful steps backward, the trailing foot first)
  {lift: -1.6, land: -1.3, x: -330},
  {lift: -1.0, land: -0.72, x: F_WALL.L},
  // the tuck: the near foot sets in closer, then the far one
  {lift: 0.95, land: 1.15, x: F_SQ.L},
  // the step after the raise, and back
  {lift: T_('but') + 0.05, land: T_('where') - 0.02, x: F_STEP},
  {lift: T_('it', 1) - 0.02, land: T_('creepy') + 0.1, x: F_SQ.L},
];
const PR: Plant[] = [
  {lift: -99, land: -99, x: -470},
  {lift: -1.86, land: -1.6, x: -400},
  {lift: -1.3, land: -1.0, x: -230},
  {lift: -0.72, land: -0.48, x: F_WALL.R},
  {lift: 1.13, land: 1.32, x: F_SQ.R},
];
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const footOf = (plants: Plant[], T: number) => {
  let x = plants[0].x;
  for (let i = 1; i < plants.length; i++) {
    const p = plants[i];
    if (T <= p.lift) break;
    if (T < p.land) {
      const s = (T - p.lift) / (p.land - p.lift);
      const fwd = p.x < plants[i - 1].x; // stepping toward his front (screen-left)
      const lift = Math.sin(Math.PI * Math.min(1, s * 1.08)) * (Math.abs(p.x - plants[i - 1].x) > 120 ? 44 : 24);
      const toe = fwd ? (s < 0.35 ? 22 * (1 - s / 0.35) : -12 * sm((s - 0.6) / 0.4)) : s < 0.4 ? -14 : 10 * sm((s - 0.5) / 0.5);
      return {x: plants[i - 1].x + (p.x - plants[i - 1].x) * sm(s), lift, toe};
    }
    x = p.x;
  }
  return {x, lift: 0, toe: 0};
};
/** every foot landing (loop time), for footstep sounds */
export const STEPS = [...PL.slice(1), ...PR.slice(1)].map((p) => p.land).sort((a, b) => a - b);

// ------------------------------------------------------------------ body keys (no arms)
const B = (o: Partial<ManPose>): ManPose => pose({torso: 2, chest: 2, neck: -2, turn: 0.5, ...o});
const BACKING = (x: number, y: number) => B({x, y, torso: 6, chest: 2, neck: -6, turn: 0.32});
const CONTACT = B({x: HIPX, y: -488, torso: -4, chest: -3, neck: 2, turn: 0.42});
const HALF = B({x: HIPX - 6, y: -300, torso: 4, chest: 4, neck: 4, turn: 0.46});
const SQUAT = B({x: HIPX - 9, y: -178, torso: 10, chest: 8, neck: -6, turn: 0.52});
const TESTB = {...SQUAT, torso: 6, chest: 4, neck: -14, turn: 0.4};
const PEEK = {...SQUAT, chest: 4, neck: -16, turn: 0.26};
const SHIFT = {...SQUAT, x: HIPX - 4, torso: 7, chest: 6, neck: -4, turn: 0.6};
const HOLD = {...SQUAT, y: -172, chest: 6, neck: -2, turn: 0.58};
/** tucked, chin on his hand */
const TUCK = {...SQUAT, y: -170, torso: 13, chest: 9, neck: 4, turn: 0.46};
const RISE = B({x: HIPX - 30, y: -380, torso: 12, chest: 6, neck: -4, turn: 0.5});
const STANDW = B({x: HIPX - 4, y: -494, torso: -3, chest: -2, neck: 0, turn: 0.44});
const LOOKW = {...STANDW, neck: -8, turn: 0.2};
const RAISEW = {...STANDW, torso: -1, chest: 0, neck: -10, turn: 0.4};
const NOTICEW = {...RAISEW, neck: -2, turn: 0.16};
/** the turn: chest and pelvis rotate toward his front, weight onto the front foot */
const TURN = B({x: HIPX - 150, y: -486, torso: 7, chest: 6, neck: -3, turn: 0.7, pelvis: 6});
const CROUCHBACK = B({x: HIPX - 40, y: -330, torso: 10, chest: 7, neck: 2, turn: 0.4});

type NearKey = ArmAngles | 'knee' | 'swing' | 'chin';
type FarKey = ArmAngles | 'kneeR' | 'swing';
const A_HANG: ArmAngles = {sh: 4, el: 14, wr: -4};
const A_BAL_N: ArmAngles = {sh: 22, el: 34, wr: -8};
const A_BAL_F: ArmAngles = {sh: -16, el: 16, wr: -2};
const A_WALL_N: ArmAngles = {sh: -14, el: 16, wr: 12};
const A_WALL_F: ArmAngles = {sh: -20, el: 12, wr: 10};
const A_GUARD_N: ArmAngles = {sh: 40, el: 70, wr: 8};
const A_GUARD_F: ArmAngles = {sh: 26, el: 60, wr: 6};
/** the test: his near arm lifted forward and up, slowly, palm out */
const A_TEST: ArmAngles = {sh: 112, el: 26, wr: -10};
/** the start of the sudden move: the arm thrown up and forward, elbow still bent */
const A_FLING: ArmAngles = {sh: 96, el: 40, wr: -14};
/** his right (far) arm raised forward and up, palm open, clear of his head and the wall behind him */
const A_RAISE: ArmAngles = {sh: 152, el: 20, wr: -8};
const A_RAISE_LOW: ArmAngles = {sh: 70, el: 50, wr: -4};
const A_TURN_N: ArmAngles = {sh: 18, el: 30, wr: -6};
const A_TURN_F: ArmAngles = {sh: -12, el: 22, wr: -4};

type Key = [number, ManPose, NearKey, FarKey];
const KEYS = (): Key[] => {
  const raise = T_('raise'), hand = T_('hand', 0), but = T_('but'), its = T_('its'), creepy = T_('creepy'), it1 = T_('it', 1);
  return [
    // the ending: backing in behind the wall, back to it, safe... then the ping, and down
    [-2.1, BACKING(-520, -496), 'swing', 'swing'],
    [-1.6, BACKING(-430, -494), 'swing', 'swing'],
    [-1.0, BACKING(-200, -494), 'swing', 'swing'],
    [-0.62, B({x: HIPX - 40, y: -490, torso: 0, chest: -1, neck: -2, turn: 0.4}), A_BAL_N, A_BAL_F],
    [-0.42, CONTACT, A_WALL_N, A_WALL_F],
    [-0.3, CONTACT, A_WALL_N, A_WALL_F],
    // frame 0: crouched halfway, startled
    [0.0, HALF, A_GUARD_N, A_GUARD_F],
    [0.38, {...HALF, y: -292, neck: 6}, A_GUARD_N, A_GUARD_F],
    // the sudden move: the near arm snaps up and out (a flinch, testing), holds, comes down
    [0.6, {...HALF, y: -296, torso: 2, chest: 2, neck: -10, turn: 0.4}, A_FLING, A_GUARD_F],
    [0.86, {...HALF, y: -298, torso: 3, chest: 3, neck: -12, turn: 0.4}, A_TEST, A_GUARD_F],
    // tucking lower and tighter against the wall (the feet shuffle in, 0.95-1.32)
    [1.3, SQUAT, 'knee', 'kneeR'],
    // the hand to his chin: uneasy, eyes toward the wall
    [1.72, TUCK, 'chin', 'kneeR'],
    [2.4, {...TUCK, neck: 2, turn: 0.42}, 'chin', 'kneeR'],
    [3.15, {...TUCK, neck: 6, turn: 0.38}, 'chin', 'kneeR'],
    [3.6, PEEK, 'knee', 'kneeR'],
    [3.9, SHIFT, 'knee', 'kneeR'],
    [4.8, HOLD, 'knee', 'kneeR'],
    [5.7, PEEK, 'knee', 'kneeR'],
    [6.6, SHIFT, 'knee', 'kneeR'],
    [T_('and', 0), HOLD, 'knee', 'kneeR'],
    // rising while the waves bounce off him (his moving body changes the echoes)
    [T_('bounce') + 0.15, RISE, A_GUARD_N, A_GUARD_F],
    [T_('body') + 0.1, STANDW, A_HANG, A_HANG],
    [9.4, STANDW, A_HANG, A_HANG],
    [10.2, LOOKW, A_HANG, A_HANG],
    [raise - 0.1, STANDW, A_HANG, A_HANG],
    // the right hand: one continuous lift, the elbow opening on the way up, palm out
    [hand + 0.18, RAISEW, A_HANG, A_RAISE],
    [its, RAISEW, A_HANG, A_RAISE],
    [its + 0.3, NOTICEW, A_HANG, A_RAISE],
    [but, NOTICEW, A_HANG, A_RAISE_LOW],
    // the turn and a step forward, then crouching and stepping back toward the wall
    [T_('where') - 0.02, TURN, A_TURN_N, A_TURN_F],
    [it1, TURN, A_TURN_N, A_TURN_F],
    [creepy + 0.12, CROUCHBACK, A_GUARD_N, A_GUARD_F],
    [creepy + 0.8, {...CROUCHBACK, x: HIPX - 20, y: -320}, A_GUARD_N, A_GUARD_F],
  ];
};

const kneeTarget = (body: ManPose) => {
  const j = manJoints(body);
  return {x: j.lLeg.K.x - 6, y: j.lLeg.K.y - 34};
};
const swingArm = (footX: number, hipX: number): ArmAngles => {
  const fwd = Math.max(-1, Math.min(1, -(footX - hipX) / 170));
  const sw = -18 * fwd;
  return {sh: sw, el: 16 + 0.9 * Math.max(0, sw), wr: -4};
};
const chinTarget = (body: ManPose) => {
  const j = manJoints(body);
  return {x: j.head.x - 66, y: j.head.y + 138};
};
const resolveN = (k: NearKey, body: ManPose, swing: ArmAngles): ArmAngles =>
  k === 'knee' ? {...armToward('L', body, kneeTarget(body)), wr: 20} : k === 'chin' ? {...armToward('L', body, chinTarget(body)), wr: -40} : k === 'swing' ? swing : k;
const resolveF = (k: FarKey, body: ManPose, swing: ArmAngles): ArmAngles => {
  if (k === 'swing') return swing;
  if (k !== 'kneeR') return k;
  const j = manJoints(body);
  return {...armToward('R', body, {x: j.rLeg.K.x - 4, y: j.rLeg.K.y - 30}), wr: 18};
};
const sample = (T: number) => {
  const keys = KEYS();
  let i = 1;
  while (i < keys.length - 1 && T > keys[i][0]) i++;
  const [t0, b0, n0, f0] = keys[i - 1], [t1, b1, n1, f1] = keys[i];
  const u = sm(Math.max(0, Math.min(1, (T - t0) / (t1 - t0 || 1))));
  return {body: lerpPose(b0, b1, u), n0, n1, f0, f1, u};
};

/** his card placed at his actual floor position, with the pose shifted to match */
export const heroCard = (p: ManPose) => {
  const dx = p.x;
  return {at: v3(HERO_G.x + dx / 600, 0, HERO_G.z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose};
};
export type HeroState = {p: ManPose; x: Expr; lh: HandPose; rh: HandPose};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const heroLab = (t: number): HeroState => {
  const T = tau(t);
  const {body, n0, n1, f0, f1, u} = sample(T);
  const fl = footOf(PL, T), fr = footOf(PR, T);
  const swinging = clamp01(fl.lift / 44) + clamp01(fr.lift / 44);
  const crouched = T > 0.9 && T < 7.4;
  const breath = crouched ? Math.sin(t * 2 * Math.PI * 0.45) : 0.4 * Math.sin(t * 2 * Math.PI * 0.3);
  let p: ManPose = {...body, y: body.y - 6 * swinging, chest: body.chest + 1.4 * breath, neck: body.neck - 0.8 * breath, breath: 0.3 + 0.4 * breath,
    lAx: fl.x, lAy: -SOLE - fl.lift, lA: 1, lAnk: fl.toe, rAx: fr.x, rAy: -SOLE - fr.lift, rA: 1, rAnk: fr.toe, legSoft: 0.99};
  p = settleHips(p);
  const nearSwing = swingArm(fl.x, p.x), farSwing = swingArm(fr.x, p.x);
  const nearA = mixArm(resolveN(n0, p, nearSwing), resolveN(n1, p, nearSwing), u);
  const farA = mixArm(resolveF(f0, p, farSwing), resolveF(f1, p, farSwing), u);
  // small waves: the test hand turns at the wrist; the raised hand waves on "its hand"
  const its = T_('its'), but = T_('but');
  const tw = 0;
  const wv = T > its - 0.05 && T < but - 0.1 ? Math.sin((T - its + 0.05) * 2 * Math.PI * 2.4) * Math.sin(Math.min(1, (but - 0.1 - T) / 0.25) * Math.PI / 2) * 0.6 : 0;
  const near = {...nearA, wr: (nearA.wr ?? 0) + 14 * tw};
  const far = {...farA, wr: (farA.wr ?? 0) + 12 * wv, el: farA.el + 5 * wv};
  p = {...p, ...armFK('L', near), ...armFK('R', far)};
  const raise = T_('raise'), hand = T_('hand', 0), creepy = T_('creepy');
  const x = keyed<Expr>(T, [
    [-2.1, X.sneak], [-0.62, X.sneak], [-0.45, X.safe], [-0.36, X.safe], [-0.1, X.startled], [0.38, X.startled], [0.6, X.test], [0.8, X.gasp], [1.15, X.gasp], [1.5, X.held], [1.9, X.uneasy], [2.6, X.uneasy], [3.2, X.peek], [3.9, X.wary], [4.8, X.held], [5.7, X.peek], [6.6, X.wary],
    [T_('bounce'), X.wary], [T_('body') + 0.1, X.wary], [10.2, X.peek], [raise - 0.2, X.wary], [raise + 0.2, X.curious], [hand + 0.3, X.playful],
    [its + 0.1, X.playful], [its + 0.4, X.frozen], [but + 0.2, X.frozen], [creepy - 0.1, X.uneasy], [15.5, X.uneasy],
  ], mixExpr);
  // eyes dart while he waits (alert, not asleep); blinks
  // (V6: a quick but eased glance, not an instant jump; it fades in and out with the waiting)
  const dart = 0.3 * Math.tanh(Math.sin(T * 1.9) * 5) * Math.min(1, Math.max(0, (T - 3.3) / 0.3), Math.max(0, (7.3 - T) / 0.3));
  const blinkPh = (t * 0.29 + 0.37) % 1;
  const blink = blinkPh < 0.035 ? Math.sin((blinkPh / 0.035) * Math.PI) : 0;
  const xx = {...x, gx: Math.max(-1, Math.min(1, x.gx + dart)), lid: Math.min(1, x.lid + blink * 0.95)};
  const lh = keyed<HandPose>(T, [[-2.1, HAND_RELAXED], [-0.7, HAND_RELAXED], [-0.45, HAND_FLAT], [-0.1, HAND_BRACE], [0.4, HAND_BRACE], [0.55, HAND_OPEN], [0.9, HAND_OPEN], [1.2, HAND_KNEE], [1.5, HAND_KNEE], [1.7, HAND_CHIN], [3.2, HAND_CHIN], [3.55, HAND_KNEE], [T_('bounce'), HAND_KNEE], [T_('body'), HAND_RELAXED], [creepy, HAND_RELAXED], [creepy + 0.2, HAND_BRACE]], mixHand);
  const rh = keyed<HandPose>(T, [[-2.1, HAND_RELAXED], [-0.7, HAND_RELAXED], [-0.45, HAND_FLAT], [-0.1, HAND_BRACE], [0.6, HAND_BRACE], [1.1, HAND_BRACE], [1.3, HAND_KNEE], [T_('bounce'), HAND_KNEE], [T_('body'), HAND_RELAXED], [raise, HAND_RELAXED], [raise + 0.3, HAND_OPEN], [but + 0.2, HAND_OPEN], [but + 0.5, HAND_RELAXED], [creepy, HAND_RELAXED], [creepy + 0.2, HAND_BRACE]], mixHand);
  return {p, x: xx, lh, rh};
};
/** the radio's estimate lags his body by about a tenth of a second */
export const RF_LAG = 0.08;
