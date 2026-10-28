// V9 (from V5-V8): the guesser in the lab, on one timeline in loop time (tau): the film's last seconds (he backs in behind the wall,
// thinks he is hidden, a ping tells him he is not, he drops into a crouch) are negative times, so frame 0 (startled,
// crouched, the display already tracking him) is the middle of one continuous action across the loop seam.
// Feet are explicit plants (a planted foot never slides; a stepping foot lifts on an arc and lands); the arms swing
// opposite the legs from the feet's actual positions; body keys carry the posture; a resting hand is solved onto its
// knee each frame (art/arms.ts). Actions (V8 brief): crouched behind the wall at frame 0 (and through the loop's last
// 0.35 s), both forearms thrown over his head (0.1-0.42, held to 1.0: one legible gesture the skeleton copies), down
// to his knees (1.0-1.45), a slow rise to peek back at the wall on STILL WATCH YOU (2.3-3.95), rising while the waves bounce off him (7.4-8.3), the right hand raised (11.3),
// a torso turn and a step (13.4), a crouch and a step back toward the wall (14.0).
import {EXPR_NEUTRAL, Expr, mixExpr} from '../dc/Head';
import {HAND_BRACE, HAND_RELAXED, HandPose, mixHand} from '../dc/Hand';
import {lerpPose, manJoints, ManPose} from '../dc/Man';
import {keyed, pose, SOLE} from '../art/person';
import {ArmAngles, armFK, armToward, mixArm} from '../art/arms';
import {settleHips} from '../art/walk';
import {v3} from '../world/cam';
import {DUR, word} from '../lib';
import {WALL} from './labSet10';

const W = word;
const T_ = (w: string, n = 0) => W(w, n).start;
/** card origin (the floor under him) */
export const HERO_G = v3(-0.5, 0, 1.15);
export const WALL_LX = (WALL.x0 - HERO_G.x) * 600;
/** the lab ending: the last 0.35 s, after the closing caption (a match cut on his crouch, from the CCTV picture to the
 *  same crouch behind the wall); he holds it into frame 0. DUCK0, DUCK_T: the street duck before the cut (Cafe8) */
export const LAB_IN = DUR - 0.35;
// V10: the street duck is still finishing its drop at the cut (it ends 0.1 s after it), and the lab crouch completes
// that same drop, so the movement runs downward on both sides of the cut and into frame 0
export const DUCK0 = -1.1, DUCK_T = 0.85;
/** the street duck's progress (0..1) at loop time T: it starts slowly (he notices) and drops fast (urgent) */
export const duckP = (T: number) => {
  const u = Math.max(0, Math.min(1, (T - DUCK0) / DUCK_T)) ** 1.6;
  return u * u * (3 - 2 * u);
};
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
  hide: e({browIn: 1, browDown: 0.35, lid: 0.82, squint: 0.55, pupil: 0.7, open: 0, wide: 0.55, smile: -0.5, gx: -0.2, gy: 0.3, sweat: 0.65, flush: 0.6}),
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
/** V9: pulled into a ball against the wall (the feet drawn in under him) */
const F_TUCK = {L: HIPX - 168, R: HIPX - 112};
const F_STEP = HIPX - 330;

/** foot plants: the foot is on the floor at x until `lift`, swings, lands at the next x at `land` */
type Plant = {lift: number; land: number; x: number};
const PL: Plant[] = [
  // crouched behind the wall from the loop's end into the opening
  {lift: -99, land: -99, x: F_WALL.L},
  // V9: trying to hide more completely: the feet drawn in under him as he pulls into a ball (1.4-1.85)
  {lift: 1.28, land: 1.5, x: F_TUCK.L},
  // (off screen, while the mechanism shows the radio) back to a squat
  {lift: 4.3, land: 4.55, x: F_SQ.L},
  // the step after the raise, and back
  {lift: T_('but') + 0.05, land: T_('where') - 0.02, x: F_STEP},
  {lift: T_('it', 1) - 0.02, land: T_('creepy') + 0.1, x: F_SQ.L},
];
const PR: Plant[] = [
  {lift: -99, land: -99, x: F_WALL.R},
  {lift: 1.45, land: 1.68, x: F_TUCK.R},
  {lift: 4.45, land: 4.7, x: F_SQ.R},
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
const HALF = B({x: HIPX - 6, y: -300, torso: 4, chest: 4, neck: 4, turn: 0.46});
const SQUAT = B({x: HIPX - 9, y: -178, torso: 10, chest: 8, neck: -6, turn: 0.52});
const TESTB = {...SQUAT, torso: 6, chest: 4, neck: -14, turn: 0.4};
const PEEK = {...SQUAT, chest: 4, neck: -16, turn: 0.26};
const SHIFT = {...SQUAT, x: HIPX - 4, torso: 7, chest: 6, neck: -4, turn: 0.6};
const HOLD = {...SQUAT, y: -172, chest: 6, neck: -2, turn: 0.58};
/** crouched, startled (the loop's end and frame 0) */
const CROUCH0 = {...SQUAT, neck: 6, turn: 0.46};
/** duck and cover: hunched over his knees, head down under his forearms */
const COVER = {...SQUAT, y: -168, torso: 18, chest: 12, neck: 16, turn: 0.46};
/** V9: hiding as completely as he can: sunk low on his heels, knees drawn up, arms around his shins, head down */
const TUCK = {...SQUAT, x: HIPX + 4, y: -146, torso: 12, chest: 8, neck: 26, turn: 0.46};
/** V9: lifting his head out of the tuck to peek back over his shoulder at the wall */
const PEEKT = {...TUCK, y: -152, torso: 8, chest: 4, neck: -12, turn: 0.28};
/** half risen, peeking: head up, turned back toward the wall */
const PEEKUP = B({x: HIPX - 18, y: -300, torso: 4, chest: 2, neck: -12, turn: 0.24});
const RISE = B({x: HIPX - 30, y: -380, torso: 12, chest: 6, neck: -4, turn: 0.5});
const STANDW = B({x: HIPX - 4, y: -494, torso: -3, chest: -2, neck: 0, turn: 0.44});
const LOOKW = {...STANDW, neck: -8, turn: 0.2};
const RAISEW = {...STANDW, torso: -1, chest: 0, neck: -10, turn: 0.4};
const NOTICEW = {...RAISEW, neck: -2, turn: 0.16};
/** the turn: chest and pelvis rotate toward his front, weight onto the front foot */
const TURN = B({x: HIPX - 150, y: -486, torso: 7, chest: 6, neck: -3, turn: 0.7, pelvis: 6});
const CROUCHBACK = B({x: HIPX - 40, y: -330, torso: 10, chest: 7, neck: 2, turn: 0.4});

type NearKey = ArmAngles | 'knee' | 'swing' | 'chin' | 'hug';
type FarKey = ArmAngles | 'kneeR' | 'swing' | 'hugR';
const A_HANG: ArmAngles = {sh: 4, el: 14, wr: -4};
const A_BAL_N: ArmAngles = {sh: 22, el: 34, wr: -8};
const A_BAL_F: ArmAngles = {sh: -16, el: 16, wr: -2};
const A_GUARD_N: ArmAngles = {sh: 40, el: 70, wr: 8};
const A_GUARD_F: ArmAngles = {sh: 26, el: 60, wr: 6};
/** forearms over his head: the upper arms raised forward and up, the forearms folded back over the crown */
const A_COVER_N: ArmAngles = {sh: 150, el: 112, wr: 10};
const A_COVER_F: ArmAngles = {sh: 142, el: 118, wr: 10};
/** V10: the wind-up before the throw: forearms pulled in toward his chest */
const A_WIND_N: ArmAngles = {sh: 34, el: 92, wr: 10};
const A_WIND_F: ArmAngles = {sh: 22, el: 84, wr: 8};
/** his right (far) arm raised forward and up, palm open, clear of his head and the wall behind him */
const A_RAISE: ArmAngles = {sh: 152, el: 20, wr: -8};
const A_RAISE_LOW: ArmAngles = {sh: 70, el: 50, wr: -4};
const A_TURN_N: ArmAngles = {sh: 18, el: 30, wr: -6};
const A_TURN_F: ArmAngles = {sh: -12, el: 22, wr: -4};

type Key = [number, ManPose, NearKey, FarKey];
const KEYS = (): Key[] => {
  const raise = T_('raise'), hand = T_('hand', 0), but = T_('but'), its = T_('its'), creepy = T_('creepy'), it1 = T_('it', 1);
  return [
    // the ending (the loop's last 0.35 s) and frame 0: crouched behind the wall, forearms up, startled
    [-1, CROUCH0, A_GUARD_N, A_GUARD_F],
    // V10: the throw starts sooner: a quick wind-up from 0.22 (shoulders hunch, forearms pulled in to his chest),
    // then both forearms over his head by 0.6, so the first second holds the action and the screen's matching copy
    [0.22, CROUCH0, A_GUARD_N, A_GUARD_F],
    [0.34, {...CROUCH0, y: -174, torso: 13, chest: 10, neck: 10}, A_WIND_N, A_WIND_F],
    // V9, on "behind": the flinch: both forearms thrown over his head (duck and cover), held, so the skeleton's copy reads
    [0.6, COVER, A_COVER_N, A_COVER_F],
    [1.15, {...COVER, neck: 13}, A_COVER_N, A_COVER_F],
    // trying to hide more completely: he pulls into a tight ball against the wall, arms around his shins, head down
    [1.8, TUCK, 'hug', 'hugR'],
    [2.65, {...TUCK, neck: 23}, 'hug', 'hugR'],
    // WATCH YOU: he lifts his head out of the ball and peeks back over his shoulder at the wall
    [3.2, PEEKT, 'hug', 'hugR'],
    [3.6, {...PEEKT, neck: -6, turn: 0.24}, 'hug', 'hugR'],
    [4.25, SQUAT, 'knee', 'kneeR'],
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
/** arms around his shins: the hand in front of the shin, a little below the knee */
const shinTarget = (body: ManPose, side: 'l' | 'r') => {
  const j = manJoints(body);
  const L = side === 'l' ? j.lLeg : j.rLeg;
  return {x: L.K.x - 30, y: L.K.y + 0.42 * (L.A.y - L.K.y)};
};
const resolveN = (k: NearKey, body: ManPose, swing: ArmAngles): ArmAngles =>
  k === 'hug' ? {...armToward('L', body, shinTarget(body, 'l')), wr: 8} : k === 'knee' ? {...armToward('L', body, kneeTarget(body)), wr: 20} : k === 'chin' ? {...armToward('L', body, chinTarget(body)), wr: -40} : k === 'swing' ? swing : k;
const resolveF = (k: FarKey, body: ManPose, swing: ArmAngles): ArmAngles => {
  if (k === 'swing') return swing;
  if (k === 'hugR') return {...armToward('R', body, shinTarget(body, 'r')), wr: 8};
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
  // (V9: while he is balled up and holding his breath, the breathing is small)
  const hold = T > 1.8 && T < 3.0 ? 0.35 : 1;
  // (V10: in loop time, so the breathing runs on unbroken across the loop seam)
  const breath = crouched ? Math.sin(T * 2 * Math.PI * 0.45) : 0.4 * Math.sin(T * 2 * Math.PI * 0.3);
  // V10: across the loop seam he is still sinking the last few units of the street duck: from the cut (T = -0.35) he
  // moves down, easing out by 0.15 s, so the movement on both sides of the cut and into frame 0 is one drop
  const sinkU = Math.min(1, Math.max(0, (T + 0.35) / 0.5));
  const sink = T < 0.15 ? 12 * (1 - sinkU) ** 2 : 0;
  let p: ManPose = {...body, y: body.y - 6 * swinging - sink, chest: body.chest + 1.4 * breath * hold, neck: body.neck - 0.8 * breath * hold, breath: 0.3 + 0.4 * breath * hold,
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
    [-1, X.startled], [0.22, X.startled], [0.45, X.held], [1.15, X.held], [1.7, X.hide], [2.7, X.hide], [3.05, X.peek], [3.7, X.peek], [4.2, X.wary], [4.8, X.held], [5.7, X.peek], [6.6, X.wary],
    [T_('bounce'), X.wary], [T_('body') + 0.1, X.wary], [10.2, X.peek], [raise - 0.2, X.wary], [raise + 0.2, X.curious], [hand + 0.3, X.playful],
    [its + 0.1, X.playful], [its + 0.4, X.frozen], [but + 0.2, X.frozen], [creepy - 0.1, X.uneasy], [15.5, X.uneasy],
  ], mixExpr);
  // eyes dart while he waits (alert, not asleep); blinks
  // (V6: a quick but eased glance, not an instant jump; it fades in and out with the waiting)
  const dart = 0.3 * Math.tanh(Math.sin(T * 1.9) * 5) * Math.min(1, Math.max(0, (T - 3.3) / 0.3), Math.max(0, (7.3 - T) / 0.3));
  const blinkPh = (t * 0.29 + 0.37) % 1;
  const blink = blinkPh < 0.035 ? Math.sin((blinkPh / 0.035) * Math.PI) : 0;
  const xx = {...x, gx: Math.max(-1, Math.min(1, x.gx + dart)), lid: Math.min(1, x.lid + blink * 0.95)};
  const lh = keyed<HandPose>(T, [[-1, HAND_BRACE], [0.22, HAND_BRACE], [0.48, HAND_FLAT], [1.15, HAND_FLAT], [1.65, HAND_KNEE], [3.9, HAND_KNEE], [T_('bounce'), HAND_KNEE], [T_('body'), HAND_RELAXED], [creepy, HAND_RELAXED], [creepy + 0.2, HAND_BRACE]], mixHand);
  const rh = keyed<HandPose>(T, [[-1, HAND_BRACE], [0.22, HAND_BRACE], [0.48, HAND_FLAT], [1.15, HAND_FLAT], [1.65, HAND_KNEE], [T_('bounce'), HAND_KNEE], [T_('body'), HAND_RELAXED], [raise, HAND_RELAXED], [raise + 0.3, HAND_OPEN], [but + 0.2, HAND_OPEN], [but + 0.5, HAND_RELAXED], [creepy, HAND_RELAXED], [creepy + 0.2, HAND_BRACE]], mixHand);
  return {p, x: xx, lh, rh};
};
/** the radio's estimate lags his body by about a tenth of a second */
export const RF_LAG = 0;
