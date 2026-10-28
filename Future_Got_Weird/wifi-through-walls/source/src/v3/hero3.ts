// V3: the guesser in the lab. One timeline in loop time (tau): the film's last seconds (the office walk, the security
// camera, the backward retreat into its blind spot) are negative times, so the duck that frame 0 is in the middle of
// is a single continuous action across the loop seam.
// Feet are explicit plants (a planted foot never slides; a stepping foot lifts on an arc and lands); the arms swing
// opposite the legs from the feet's actual positions, so forward and backward steps both read right; body keys carry
// the posture; a resting hand is solved onto its knee each frame (art/arms.ts).
import {EXPR_NEUTRAL, Expr, mixExpr} from '../dc/Head';
import {HAND_BRACE, HAND_RELAXED, HandPose, mixHand} from '../dc/Hand';
import {lerpPose, manJoints, ManPose} from '../dc/Man';
import {keyed, pose, SOLE} from '../art/person';
import {ArmAngles, armFK, armToward, mixArm} from '../art/arms';
import {settleHips} from '../art/walk';
import {v3} from '../world/cam';
import {DUR, word} from '../lib';
import {WALL} from './labSet3';

const W = word;
/** card origin (the floor under him) */
export const HERO_G = v3(-0.5, 0, 1.15);
/** local x (rig units) of the wall face behind him */
export const WALL_LX = (WALL.x0 - HERO_G.x) * 600;
/** the lab ending starts here (the cut from the café) */
export const END0 = W('now').start - 0.2;
/** loop time: the ending is negative (it leads into frame 0); it starts while the ad panel still wipes across */
export const LAB_IN = END0 - 0.8;
export const tau = (t: number) => (t >= LAB_IN ? t - DUR : t);

const e = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
export const X = {
  easy: e({smile: 0.3, gx: -0.55, gy: 0.05}),
  notice: e({browIn: 0.5, lid: 0, pupil: 0.8, open: 0.08, wide: 0.85, smile: -0.1, gx: 0.85, gy: -0.85, flush: 0.2}),
  wary: e({browIn: 0.85, browDown: 0.15, lid: 0.05, pupil: 0.7, open: 0.04, wide: 0.66, smile: -0.35, gx: 0.75, gy: -0.3, sweat: 0.3, flush: 0.3}),
  startled: e({browIn: 0.9, browDown: 0, lid: 0, pupil: 0.6, open: 0.4, wide: 0.72, smile: -0.5, gx: 0.85, gy: -0.05, flush: 0.35}),
  glance: e({browIn: 0.95, browDown: 0, lid: 0, pupil: 0.55, open: 0.12, wide: 0.6, smile: -0.45, gx: 0.95, gy: -0.05, sweat: 0.5, flush: 0.4}),
  held: e({browIn: 0.9, browDown: 0.25, lid: 0.15, squint: 0.15, pupil: 0.7, open: 0, wide: 0.55, smile: -0.4, gx: -0.3, gy: 0.15, sweat: 0.5, flush: 0.55}),
  peek: e({browIn: 0.85, browDown: 0.1, lid: 0.05, pupil: 0.65, open: 0.02, wide: 0.6, smile: -0.35, gx: 0.9, gy: -0.45, sweat: 0.5, flush: 0.45}),
  curious: e({browIn: 0.35, browDown: 0, lid: 0.05, pupil: 0.95, open: 0.12, wide: 0.9, smile: 0.15, gx: 0.3, gy: -0.7, flush: 0.2}),
  playful: e({browIn: 0.2, browDown: 0, lid: 0.12, squint: 0.25, pupil: 1, open: 0.25, wide: 1.1, smile: 0.6, teeth: 0.4, gx: 0.35, gy: -0.6, flush: 0.35}),
  frozen: e({browIn: 1, browDown: 0, lid: 0, pupil: 0.5, open: 0.3, wide: 0.6, smile: -0.55, gx: 0.95, gy: -0.1, sweat: 0.7, flush: 0.5}),
  uneasy: e({browIn: 0.95, browDown: 0.1, lid: 0.08, pupil: 0.7, open: 0.06, wide: 0.7, smile: -0.5, gx: 0.6, gy: 0.2, sweat: 0.6, flush: 0.5}),
};
const HAND_FLAT: HandPose = {curl: [0.05, 0.05, 0.08, 0.1], spread: 0.45, thumb: 36, thumbCurl: 0.12};
const HAND_KNEE: HandPose = {curl: [0.45, 0.5, 0.55, 0.58], spread: 0.25, thumb: 34, thumbCurl: 0.35};
const HAND_OPEN: HandPose = {curl: [0.02, 0.02, 0.04, 0.06], spread: 0.6, thumb: 40, thumbCurl: 0.08};

// ------------------------------------------------------------------ positions (rig-local units; floor y = 0)
export const HIPX = WALL_LX - 106;
const FEET_SQ = {L: HIPX - 224, R: HIPX - 154};
const FEET_WALL = {L: HIPX - 200, R: HIPX - 130};

/** foot plants: the foot is on the floor at x until `lift`, swings, lands at the next x at `land` */
type Plant = {lift: number; land: number; x: number};
const PL: Plant[] = [
  {lift: -99, land: -99, x: 150},
  {lift: -5.42, land: -5.08, x: -60},
  {lift: -4.7, land: -4.33, x: -330},
  {lift: -3.95, land: -3.62, x: -470},
  // backing toward the wall (short steps, the near foot trails the far foot)
  {lift: -1.98, land: -1.62, x: -350},
  {lift: -1.25, land: -0.92, x: -200},
  {lift: -0.62, land: -0.35, x: FEET_WALL.L},
  {lift: 0.55, land: 0.84, x: FEET_SQ.L},
];
const PR: Plant[] = [
  {lift: -99, land: -99, x: 20},
  {lift: -5.05, land: -4.7, x: -180},
  {lift: -4.32, land: -3.95, x: -400},
  {lift: -2.35, land: -2.0, x: -260},
  {lift: -1.6, land: -1.25, x: -110},
  {lift: -0.95, land: -0.62, x: FEET_WALL.R},
  {lift: 1.66, land: 1.95, x: FEET_SQ.R},
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
      const lift = Math.sin(Math.PI * Math.min(1, s * 1.08)) * (Math.abs(p.x - plants[i - 1].x) > 120 ? 46 : 26);
      // forward: toe up early, heel strikes; backward: toe reaches back and lands first
      const toe = fwd ? (s < 0.35 ? 22 * (1 - s / 0.35) : -12 * sm((s - 0.6) / 0.4)) : s < 0.4 ? -14 : 10 * sm((s - 0.5) / 0.5);
      return {x: plants[i - 1].x + (p.x - plants[i - 1].x) * sm(s), lift, toe, planted: false};
    }
    x = p.x;
  }
  return {x, lift: 0, toe: 0, planted: true};
};
/** every foot landing (loop time), for footstep sounds */
export const STEPS = [...PL.slice(1), ...PR.slice(1)].map((p) => ({t: p.land, big: true})).sort((a, b) => a.t - b.t);

// ------------------------------------------------------------------ body keys (no arms)
const B = (o: Partial<ManPose>): ManPose => pose({torso: 2, chest: 2, neck: -2, turn: 0.5, ...o});
const WALKING = (x: number, y = -494) => B({x, y, torso: 4, chest: 1, neck: -2, turn: 0.55});
const STAND = B({x: -440, y: -506, torso: 1, chest: 0, neck: -3, turn: 0.5});
const LOOKBACK = B({x: -445, y: -506, torso: -3, chest: -4, neck: -22, turn: 0.12});
const BACKING = (x: number, y: number) => B({x, y, torso: 6, chest: 2, neck: -6, turn: 0.32});
const CONTACT = B({x: HIPX, y: -486, torso: -4, chest: -3, neck: 2, turn: 0.42});
const DUCK = B({x: HIPX - 8, y: -380, torso: 8, chest: 7, neck: 10, turn: 0.5});
const HALF = B({x: HIPX - 4, y: -296, torso: 2, chest: 3, neck: 4, turn: 0.5});
const PRESS = B({x: HIPX - 2, y: -300, torso: -6, chest: -5, neck: -4, turn: 0.16});
const SQUAT = B({x: HIPX - 9, y: -175, torso: 10, chest: 8, neck: -6, turn: 0.52});
const PEEK = {...SQUAT, chest: 4, neck: -16, turn: 0.26};
const SHIFT = {...SQUAT, x: HIPX - 4, torso: 7, chest: 6, neck: -4, turn: 0.6};
const HOLD = {...SQUAT, y: -170, chest: 6, neck: -2, turn: 0.58};
const RAISE_B = {...SQUAT, torso: 4, chest: 2, neck: -10, turn: 0.42};
const NOTICE_B = {...RAISE_B, neck: -2, turn: 0.18};
const HUG = {...SQUAT, y: -168, torso: 14, chest: 10, neck: 2, turn: 0.4};

/** arm keys (angles); 'knee' / 'kneeR' = the hand rests on that knee (solved every frame); 'swing' = walk swing */
type NearKey = ArmAngles | 'knee' | 'swing';
type FarKey = ArmAngles | 'kneeR' | 'swing';
const A_HANG: ArmAngles = {sh: 4, el: 14, wr: -4};
const A_BAL_N: ArmAngles = {sh: 26, el: 38, wr: -8};
const A_BAL_F: ArmAngles = {sh: -18, el: 16, wr: -2};
const A_WALL_N: ArmAngles = {sh: -14, el: 16, wr: 12};
const A_WALL_F: ArmAngles = {sh: -20, el: 12, wr: 10};
const A_DUCK_N: ArmAngles = {sh: 34, el: 52, wr: 6};
const A_DUCK_F: ArmAngles = {sh: 22, el: 40, wr: 4};
const A_PRESS_N: ArmAngles = {sh: -22, el: 10, wr: 14};
const A_PRESS_F: ArmAngles = {sh: -24, el: 8, wr: 12};
/** his far arm raised forward and up, palm open, clear of his head and the wall behind him */
const A_RAISE: ArmAngles = {sh: 150, el: 22, wr: -8};
const A_RAISE_LOW: ArmAngles = {sh: 70, el: 50, wr: -4};

type Key = [number, ManPose, NearKey, FarKey];
const KEYS = (): Key[] => {
  const T = (w: string, n = 0) => W(w, n).start;
  const camera = T('camera') - DUR, raise = T('raise'), hand = T('hand', 0), but = T('but'), creepy = T('creepy');
  return [
    // the ending: walking into the office, stopping, the look back at the security camera
    [-5.45, WALKING(70), 'swing', 'swing'],
    [-4.75, WALKING(-110), 'swing', 'swing'],
    [-4.33, WALKING(-255, -480), 'swing', 'swing'],
    [-3.95, WALKING(-370, -484), 'swing', 'swing'],
    [-3.6, B({x: -425, y: -490, torso: 2, chest: 0, neck: -3, turn: 0.5}), A_HANG, A_HANG],
    [camera - 0.1, STAND, A_HANG, A_HANG],
    [camera + 0.35, LOOKBACK, A_HANG, A_HANG],
    [-2.42, LOOKBACK, A_HANG, A_HANG],
    // backing into the camera's blind spot beside the wall
    [-2.0, BACKING(-380, -496), A_BAL_N, A_BAL_F],
    [-1.62, BACKING(-290, -494), 'swing', 'swing'],
    [-1.25, BACKING(-190, -494), 'swing', 'swing'],
    [-0.92, BACKING(-100, -492), 'swing', 'swing'],
    [-0.62, BACKING(10, -490), A_BAL_N, A_BAL_F],
    [-0.42, CONTACT, A_WALL_N, A_WALL_F],
    // the duck (frame 0 is in the middle of it), then pressed to the wall, the glance toward the sensor side
    [-0.24, CONTACT, A_WALL_N, A_WALL_F],
    [0.0, DUCK, A_DUCK_N, A_DUCK_F],
    [0.3, HALF, A_DUCK_N, A_DUCK_F],
    [0.62, PRESS, A_PRESS_N, A_PRESS_F],
    [1.05, PRESS, A_PRESS_N, A_PRESS_F],
    [1.35, HALF, A_PRESS_N, A_PRESS_F],
    // sinking into a deep squat, hands to the knees
    [2.15, SQUAT, 'knee', 'kneeR'],
    [2.5, SQUAT, 'knee', 'kneeR'],
    [2.95, PEEK, 'knee', 'kneeR'],
    [3.5, SHIFT, 'knee', 'kneeR'],
    [4.3, HOLD, 'knee', 'kneeR'],
    [raise - 0.15, HOLD, 'knee', 'kneeR'],
    // one raise: shoulder first, the elbow opening, palm up
    [raise + 0.18, RAISE_B, 'knee', A_RAISE_LOW],
    [hand + 0.12, RAISE_B, 'knee', A_RAISE],
    [T('it', 0) + 0.45, RAISE_B, 'knee', A_RAISE],
    [T('its') + 0.2, NOTICE_B, 'knee', A_RAISE],
    [but + 0.05, NOTICE_B, 'knee', A_RAISE],
    [but + 0.55, HOLD, 'knee', A_RAISE_LOW],
    [creepy - 0.15, HUG, 'knee', 'kneeR'],
    [creepy + 1.2, HUG, 'knee', 'kneeR'],
  ];
};

const kneeTarget = (body: ManPose) => {
  const j = manJoints(body);
  return {x: j.lLeg.K.x - 6, y: j.lLeg.K.y - 34};
};
/** arm swing from the feet: each arm swings opposite its own leg (forward = toward his front, screen-left) */
const swingArm = (footX: number, hipX: number): ArmAngles => {
  const fwd = Math.max(-1, Math.min(1, -(footX - hipX) / 170));
  const sw = -18 * fwd;
  return {sh: sw, el: 16 + 0.9 * Math.max(0, sw), wr: -4};
};
const resolveN = (k: NearKey, body: ManPose, swing: ArmAngles): ArmAngles =>
  k === 'knee' ? {...armToward('L', body, kneeTarget(body)), wr: 20} : k === 'swing' ? swing : k;
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

/** his card placed at his actual floor position (the scale is right in any view, also one looking along x), with
 *  the pose shifted to match */
export const heroCard = (p: ManPose) => {
  const dx = p.x;
  return {at: v3(HERO_G.x + dx / 600, 0, HERO_G.z), p: {...p, x: 0, lAx: (p.lAx ?? 0) - dx, rAx: (p.rAx ?? 0) - dx} as ManPose};
};
export type HeroState = {p: ManPose; x: Expr; lh: HandPose; rh: HandPose};
export const heroLab = (t: number): HeroState => {
  const T = tau(t);
  const {body, n0, n1, f0, f1, u} = sample(T);
  const fl = footOf(PL, T), fr = footOf(PR, T);
  // walking bob from the feet: the hips rise over a planted foot and dip while one foot swings
  // (the hips are highest while the other foot passes, at mid-stance)
  const swinging = clamp01(fl.lift / 46) + clamp01(fr.lift / 46);
  const crouched = T > 2.0 && T < 14.9;
  const breath = crouched ? Math.sin(t * 2 * Math.PI * 0.42) : 0.4 * Math.sin(t * 2 * Math.PI * 0.3);
  let p: ManPose = {...body, y: body.y - 6 * swinging, chest: body.chest + 1.4 * breath, neck: body.neck - 0.8 * breath, breath: 0.3 + 0.4 * breath,
    lAx: fl.x, lAy: -SOLE - fl.lift, lA: 1, lAnk: fl.toe, rAx: fr.x, rAy: -SOLE - fr.lift, rA: 1, rAnk: fr.toe, legSoft: 0.99};
  p = settleHips(p);
  const nearSwing = swingArm(fl.x, p.x), farSwing = swingArm(fr.x, p.x);
  const near = mixArm(resolveN(n0, p, nearSwing), resolveN(n1, p, nearSwing), u);
  const farA = mixArm(resolveF(f0, p, farSwing), resolveF(f1, p, farSwing), u);
  // the wave of the raised hand on "It raises its hand": the wrist rocks, the forearm follows a little
  const its = W('its').start, but = W('but').start;
  const wv = T > its - 0.05 && T < but - 0.2 ? Math.sin((T - its + 0.05) * 2 * Math.PI * 2.4) * Math.sin(Math.min(1, (but - 0.2 - T) / 0.25) * Math.PI / 2) * 0.6 : 0;
  const far = {...farA, wr: (farA.wr ?? 0) + 12 * wv, el: farA.el + 5 * wv};
  p = {...p, ...armFK('L', near), ...armFK('R', far)};
  // expressions
  const raise = W('raise').start, hand = W('hand', 0).start, creepy = W('creepy').start, camera = W('camera').start - DUR;
  const x = keyed<Expr>(T, [
    [-4.75, X.easy], [camera - 0.2, X.easy], [camera + 0.2, X.notice], [-2.6, X.notice], [-2.3, X.wary], [-0.6, X.wary], [-0.35, X.startled],
    [0.3, X.startled], [0.55, X.glance], [1.1, X.glance], [1.45, X.wary], [2.2, X.held], [2.6, X.held], [2.95, X.peek], [3.5, X.wary], [4.3, X.held],
    [raise - 0.2, X.held], [raise + 0.2, X.curious], [hand + 0.3, X.playful], [its + 0.1, X.playful], [its + 0.35, X.frozen], [but + 0.4, X.frozen], [creepy - 0.2, X.uneasy], [15, X.uneasy],
  ], mixExpr);
  // eyes dart while he waits (alert, not asleep)
  const dart = T > 4.3 && T < raise - 0.3 ? 0.35 * Math.sign(Math.sin(T * 1.7)) : 0;
  const blinkPh = (t * 0.31) % 1;
  const blink = blinkPh < 0.035 ? Math.sin((blinkPh / 0.035) * Math.PI) : 0;
  const xx = {...x, gx: Math.max(-1, Math.min(1, x.gx + dart)), lid: Math.min(1, x.lid + blink * 0.95)};
  const lh = keyed<HandPose>(T, [[-4.75, HAND_RELAXED], [-2.0, HAND_RELAXED], [-1.7, HAND_BRACE], [-0.5, HAND_BRACE], [-0.3, HAND_FLAT], [0.3, HAND_FLAT], [0.6, HAND_FLAT], [1.6, HAND_FLAT], [2.1, HAND_KNEE], [15, HAND_KNEE]], mixHand);
  const rh = keyed<HandPose>(T, [[-4.75, HAND_RELAXED], [-2.0, HAND_RELAXED], [-0.5, HAND_RELAXED], [-0.3, HAND_FLAT], [1.6, HAND_FLAT], [2.1, HAND_KNEE], [raise - 0.1, HAND_KNEE], [raise + 0.3, HAND_OPEN], [but + 0.3, HAND_OPEN], [but + 0.7, HAND_RELAXED], [creepy - 0.1, HAND_KNEE], [15, HAND_KNEE]], mixHand);
  return {p, x: xx, lh, rh};
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** the moments his skeleton visibly updates (the radio's estimate lags his body by about a tenth of a second) */
export const RF_LAG = 0.1;
