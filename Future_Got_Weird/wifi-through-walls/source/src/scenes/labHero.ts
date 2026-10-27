// V2: the guesser in the lab. Body poses are keyed; arms are keyed as joint angles (art/arms.ts: shoulder swing and
// forward elbow flexion), so every arm path between keys is one a shoulder and an elbow can make; a hand that rests
// on his knee is solved onto the knee every frame. Feet are explicit plants (they never slide); the backward retreat
// to the wall that ends the film is the same retreat frame 0 is in the middle of.
// Card origin HERO_G (the floor under him); his rig faces screen-left, so his back is toward the dividing wall.
import {EXPR_GASP, EXPR_NEUTRAL, Expr, mixExpr} from '../dc/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../dc/Hand';
import {lerpPose, manJoints, ManPose} from '../dc/Man';
import {keyed, pose, SOLE} from '../art/person';
import {ArmAngles, armFK, armToward, mixArm} from '../art/arms';
import {settleHips} from '../art/walk';
import {v3} from '../world/cam';
import {DUR, word} from '../lib';

export const HERO_G = v3(-0.56, 0, 1.15);
/** local x (rig units) of the wall's face behind him */
export const WALL_LX = (-0.13 - HERO_G.x) * 600;
/** the ending (scene I) runs from END0 to the last frame, where the retreat continues into frame 0 */
export const END0 = DUR - 4.8;
/** loop time: the last RET s of the film are the start of the retreat that frame 0 is in the middle of */
const RET = 1.3;
export const tau = (t: number) => (t > DUR - RET ? t - DUR : t);

const e = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
export const X = {
  startled: e({browIn: 0.9, browDown: 0, lid: 0, pupil: 0.6, open: 0.4, wide: 0.72, smile: -0.5, gx: 0.85, gy: -0.05, flush: 0.35}),
  wary: e({browIn: 0.85, browDown: 0.15, lid: 0.05, pupil: 0.7, open: 0.04, wide: 0.66, smile: -0.35, gx: -0.75, gy: 0.05, sweat: 0.3, flush: 0.3}),
  wide: e({browIn: 0.95, browDown: 0, lid: 0, pupil: 0.55, open: 0.12, wide: 0.6, smile: -0.45, gx: 0.9, gy: -0.1, sweat: 0.5, flush: 0.4}),
  held: e({browIn: 0.9, browDown: 0.25, lid: 0.15, squint: 0.15, pupil: 0.7, open: 0, wide: 0.55, smile: -0.4, gx: -0.3, gy: 0.15, sweat: 0.5, flush: 0.55}),
  curious: e({browIn: 0.35, browDown: 0, lid: 0.05, pupil: 0.95, open: 0.12, wide: 0.9, smile: 0.15, gx: 0.3, gy: -0.7, flush: 0.2}),
  playful: e({browIn: 0.2, browDown: 0, lid: 0.12, squint: 0.25, pupil: 1, open: 0.25, wide: 1.1, smile: 0.7, teeth: 0.5, gx: 0.35, gy: -0.6, flush: 0.35}),
  lookUp: e({browIn: 0.3, browDown: 0, lid: 0, pupil: 0.9, open: 0.1, wide: 0.9, smile: 0, gx: 0.45, gy: -0.95, flush: 0.2}),
  smug: e({browIn: 0.1, browDown: 0.2, lid: 0.25, squint: 0.2, pupil: 1, open: 0.05, wide: 1.15, smile: 0.75, teeth: 0.2, gx: 0.2, gy: -0.6, flush: 0.3}),
  gasp: EXPR_GASP, neutral: EXPR_NEUTRAL,
};
const HAND_FLAT: HandPose = {curl: [0.05, 0.05, 0.08, 0.1], spread: 0.45, thumb: 36, thumbCurl: 0.12};
const HAND_KNEE: HandPose = {curl: [0.45, 0.5, 0.55, 0.58], spread: 0.25, thumb: 34, thumbCurl: 0.35};
export const HANDS = {flat: HAND_FLAT, knee: HAND_KNEE, brace: HAND_BRACE, relaxed: HAND_RELAXED, clutch: HAND_CLUTCH};

// ------------------------------------------------------------------ positions (rig-local units; floor y = 0)
const HIPX = WALL_LX - 106; // hips when his back is flat on the wall
const FEET_CROUCH = {L: HIPX - 224, R: HIPX - 154};
const UX = HIPX - 674; // under the security camera
const FEET_UNDER = {L: UX - 50, R: UX + 40};

/** foot plants for the retreat (loop time): the back foot leads */
type Plant = {lift: number; land: number; x: number};
// steps of 0.2-0.3 m; the hips stay over (or just behind) the supporting foot, so he never sits back into the air
const PL: Plant[] = [{lift: -9, land: -9, x: FEET_UNDER.L}, {lift: -0.82, land: -0.5, x: UX + 340}, {lift: -0.12, land: 0.24, x: FEET_CROUCH.L}];
const PR: Plant[] = [{lift: -9, land: -9, x: FEET_UNDER.R}, {lift: -1.1, land: -0.82, x: UX + 230}, {lift: -0.5, land: -0.18, x: FEET_CROUCH.R}];
/** the retreat's foot landings (loop time; negative = the end of the film), for footstep sounds */
export const RETREAT_STEPS = [...PR.slice(1), ...PL.slice(1)].map((p) => p.land).sort((a, b) => a - b);
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const footOf = (plants: Plant[], T: number) => {
  let x = plants[0].x, lift = 0, toe = 0;
  for (let i = 1; i < plants.length; i++) {
    const p = plants[i];
    if (T <= p.lift) break;
    if (T < p.land) {
      const s = (T - p.lift) / (p.land - p.lift);
      x = plants[i - 1].x + (p.x - plants[i - 1].x) * sm(s);
      lift = Math.sin(Math.PI * s) * 40;
      toe = s < 0.4 ? -14 : 10 * sm((s - 0.5) / 0.5); // backing up: toes down first
      return {x, lift, toe};
    }
    x = p.x;
  }
  return {x, lift, toe};
};

// ------------------------------------------------------------------ body keys (no arms)
const B = (o: Partial<ManPose>): ManPose => pose({torso: 2, chest: 2, neck: -2, turn: 0.5, ...o});
const STAND_UNDER = B({x: UX, y: -510, torso: 0, chest: -1, neck: -8, turn: 0.45});
const LOOK_UP = B({x: UX, y: -512, torso: -2, chest: -5, neck: -26, turn: 0.14});
const REACH = B({x: UX + 8, y: -528, torso: 1, chest: -3, neck: -26, turn: 0.22});
const STARTLE = B({x: UX + 20, y: -514, torso: 3, chest: 1, neck: -6, turn: 0.3});
const BACKING = (x: number, y: number) => B({x, y, torso: 7, chest: 2, neck: -4, turn: 0.32});
const CONTACT = B({x: HIPX, y: -486, torso: -4, chest: -3, neck: 2, turn: 0.42});
// a deep squat with his back to the wall (knees up, hips low, chest over the knees), not a chair-sit
const CROUCH = B({x: HIPX - 9, y: -175, torso: 10, chest: 8, neck: -6, turn: 0.52});
const GLANCE = {...CROUCH, turn: 0.2, neck: 0, chest: 4};
const HOLD = {...CROUCH, y: -170, chest: 6, neck: -2, turn: 0.58};
const RAISE_B = {...CROUCH, torso: 4, chest: 2, neck: -10, turn: 0.42};

/** arm keys (angles); 'knee' = the near hand rests on his near knee (solved every frame) */
type ArmKey = ArmAngles | 'knee';
type FarKey = ArmAngles | 'kneeR';
const A_HANG: ArmAngles = {sh: 4, el: 14, wr: -4};
const A_FAR_HANG: ArmAngles = {sh: 6, el: 18, wr: -4};
const A_BAL_N: ArmAngles = {sh: 26, el: 38, wr: -8};
const A_BAL_F: ArmAngles = {sh: -18, el: 16, wr: -2};
const A_WALL_N: ArmAngles = {sh: -12, el: 18, wr: 10};
/** his right (far) arm raised forward and up, clear of his head and of the wall behind him */
const A_RAISE: ArmAngles = {sh: 150, el: 22, wr: -8};
/** the near arm reaching forward and up to cover the security camera (the hand stays in front of, never over, his face) */
const A_REACH: ArmAngles = {sh: 126, el: 12, wr: -14};

const kneeTarget = (body: ManPose) => {
  const j = manJoints(body);
  // the hand rests on top of the near knee, a little toward the shin
  return {x: j.lLeg.K.x - 6, y: j.lLeg.K.y - 34};
};
const resolve = (k: ArmKey, body: ManPose): ArmAngles => (k === 'knee' ? {...armToward('L', body, kneeTarget(body)), wr: 20} : k);
const resolveFar = (k: FarKey, body: ManPose): ArmAngles => {
  if (k !== 'kneeR') return k;
  const j = manJoints(body);
  return {...armToward('R', body, {x: j.rLeg.K.x - 4, y: j.rLeg.K.y - 30}), wr: 18};
};

type Key = [number, ManPose, ArmKey, FarKey, ((x: number) => number)?];
const W = word;
const KEYS = (): Key[] => {
  const hand = W('hand', 0).start, raise = W('raise').start, but = W('but').start;
  const now = W('now').start, camera = W('camera').start, or = W('or').start;
  return [
    // the retreat (loop time, negative = the end of the film)
    [-1.3, STARTLE, A_HANG, A_FAR_HANG],
    [-0.85, BACKING(UX + 150, -500), A_BAL_N, A_BAL_F],
    [-0.4, BACKING(UX + 330, -498), A_BAL_N, A_BAL_F],
    [0.0, BACKING(UX + 540, -496), {sh: 18, el: 32, wr: -6}, {sh: -14, el: 16}],
    [0.34, CONTACT, A_WALL_N, A_FAR_HANG],
    [0.62, CONTACT, A_WALL_N, A_FAR_HANG],
    [1.25, CROUCH, 'knee', 'kneeR'],
    [1.62, CROUCH, 'knee', 'kneeR'],
    [1.85, GLANCE, 'knee', 'kneeR'],
    [2.35, GLANCE, 'knee', 'kneeR'],
    [2.7, HOLD, 'knee', 'kneeR'],
    [raise - 0.15, HOLD, 'knee', 'kneeR'],
    [hand + 0.05, RAISE_B, 'knee', A_RAISE],
    [but - 0.05, RAISE_B, 'knee', A_RAISE],
    [but + 0.5, HOLD, 'knee', 'kneeR'],
    [END0, HOLD, 'knee', 'kneeR'],
    // scene I (absolute times; the film's last RET s are the retreat above)
    [END0 + 0.001, STAND_UNDER, A_HANG, A_FAR_HANG],
    [now + 0.25, STAND_UNDER, A_HANG, A_FAR_HANG],
    [now + 0.55, LOOK_UP, A_HANG, A_FAR_HANG],
    [camera - 0.35, LOOK_UP, A_HANG, A_FAR_HANG],
    [camera + 0.02, REACH, A_REACH, A_FAR_HANG],
    [or - 0.02, REACH, A_REACH, A_FAR_HANG],
    // the hand comes off the lens on "or" and lowers over half a second (never a snap), then the flinch into the retreat
    [or + 0.5, STAND_UNDER, A_HANG, A_FAR_HANG],
    [DUR - RET, STARTLE, A_HANG, A_FAR_HANG],
  ] as Key[];
};

/** the body/arm keys used at time t: scene I keys are absolute, everything else in loop time */
const sample = (t: number) => {
  const all = KEYS();
  const T = tau(t);
  const sceneI = t > END0 && t <= DUR - RET;
  const keys = sceneI ? all.filter(([k]) => k > END0) : all.filter(([k]) => k <= END0);
  const tt = sceneI ? t : T;
  let i = 1;
  while (i < keys.length - 1 && tt > keys[i][0]) i++;
  const [t0, b0, n0, f0] = keys[i - 1], [t1, b1, n1, f1, ease] = keys[i];
  const u = (ease ?? sm)(Math.max(0, Math.min(1, (tt - t0) / (t1 - t0 || 1))));
  const body = lerpPose(b0, b1, u);
  return {body, n0, n1, f0, f1, u, tt};
};

export const heroLab = (t: number): {p: ManPose; x: Expr; lh: HandPose; rh: HandPose; palm: boolean} => {
  const {body, n0, n1, f0, f1, u} = sample(t);
  const T = tau(t);
  const sceneI = t > END0 && t <= DUR - RET;
  // feet: planted under the camera in scene I; the retreat's plants in loop time; crouched otherwise
  let feet: {l: {x: number; lift: number; toe: number}; r: {x: number; lift: number; toe: number}};
  if (sceneI) feet = {l: {x: FEET_UNDER.L, lift: 0, toe: 0}, r: {x: FEET_UNDER.R, lift: 0, toe: 0}};
  else if (T < 0.4) feet = {l: footOf(PL, T), r: footOf(PR, T)};
  else feet = {l: {x: FEET_CROUCH.L, lift: 0, toe: 0}, r: {x: FEET_CROUCH.R, lift: 0, toe: 0}};
  // on tiptoe for the reach
  const tip = sceneI ? Math.max(0, Math.min(1, (body.y + 506) / -22)) : 0;
  // breathing and small life while crouched (never a frozen statue)
  const crouched = !sceneI && T > 1.2;
  const breath = crouched ? Math.sin(t * 2 * Math.PI * 0.42) : 0;
  // standing legs may straighten to ~17 deg of knee flexion (the rig's default soft IK keeps them bent ~30 deg)
  let p: ManPose = {...body, legSoft: 0.995, chest: body.chest + 1.4 * breath, neck: body.neck - 0.8 * breath, breath: 0.3 + 0.4 * breath,
    lAx: feet.l.x, lAy: -SOLE - feet.l.lift - 10 * tip, lA: 1, lAnk: feet.l.toe + 22 * tip,
    rAx: feet.r.x, rAy: -SOLE - feet.r.lift - 10 * tip, rA: 1, rAnk: feet.r.toe + 22 * tip};
  p = settleHips(p);
  // a hand on the knee is solved on the final body (feet planted, hips settled)
  const near = mixArm(resolve(n0, p), resolve(n1, p), u);
  const farA = mixArm(resolveFar(f0, p), resolveFar(f1, p), u);
  // the wave on "It raises its hand": the wrist rocks, the forearm follows a little
  const its = W('its').start, but = W('but').start;
  const wv = T > its - 0.1 && T < but - 0.15 ? Math.sin((T - its + 0.1) * 2 * Math.PI * 2.6) * Math.sin(Math.min(1, (but - 0.15 - T) / 0.25) * Math.PI / 2) : 0;
  const far = {...farA, wr: (farA.wr ?? 0) + 14 * wv, el: farA.el + 6 * wv};
  p = {...p, ...armFK('L', near), ...armFK('R', far)};
  // expressions
  const hand = W('hand', 0).start, raise = W('raise').start;
  const now = W('now').start, camera = W('camera').start, or = W('or').start, watching = W('watching').start;
  const x = sceneI
    ? keyed<Expr>(t, [[END0, X.neutral], [now + 0.3, X.curious], [now + 0.6, X.lookUp], [camera - 0.1, X.lookUp], [camera + 0.25, X.smug], [watching + 0.4, X.smug], [or + 0.35, X.smug], [DUR - RET, X.startled]], mixExpr)
    : keyed<Expr>(T, [[-1.3, X.startled], [-0.3, X.startled], [0.0, X.wide], [0.5, X.wary], [1.6, X.wary], [1.9, X.wide], [2.35, X.wide], [2.75, X.held],
        [raise - 0.2, X.held], [raise + 0.15, X.curious], [hand + 0.35, X.playful], [W('but').start + 0.1, X.playful], [W('but').start + 0.6, X.wary], [END0, X.wary]], mixExpr);
  // eyes dart while he waits (alert, not asleep)
  const dart = crouched && T > 2.8 && T < raise - 0.3 ? 0.35 * Math.sign(Math.sin(T * 1.7)) : 0;
  const blinkPh = (t * 0.31) % 1;
  const blink = blinkPh < 0.035 ? Math.sin((blinkPh / 0.035) * Math.PI) : 0;
  const xx = {...x, gx: Math.max(-1, Math.min(1, x.gx + dart)), lid: Math.min(1, x.lid + blink * 0.95)};
  const lh = sceneI
    ? keyed<HandPose>(t, [[END0, HAND_RELAXED], [camera - 0.3, HAND_RELAXED], [camera - 0.05, HAND_FLAT], [DUR - RET, HAND_FLAT]], mixHand)
    : keyed<HandPose>(T, [[-1.3, HAND_FLAT], [-0.2, HAND_BRACE], [0.34, HAND_FLAT], [1.0, HAND_FLAT], [1.25, HAND_KNEE], [raise - 0.15, HAND_KNEE], [hand, HAND_FLAT], [but + 0.05, HAND_FLAT], [but + 0.4, HAND_KNEE], [END0, HAND_KNEE]], mixHand);
  const rh = sceneI ? HAND_RELAXED : keyed<HandPose>(T, [[-1.3, HAND_RELAXED], [0.3, HAND_RELAXED], [1.2, HAND_KNEE], [raise - 0.15, HAND_KNEE], [hand, HAND_FLAT], [but + 0.05, HAND_FLAT], [but + 0.4, HAND_KNEE], [END0, HAND_KNEE]], mixHand);
  const palm = sceneI && t > camera - 0.15 && t < or + 0.2;
  return {p, x: xx, lh, rh, palm};
};

/** where his near palm is during the reach (the security camera's lens is mounted there), world metres */
export const reachPalmWorld = () => {
  const camera = W('camera').start;
  const h = heroLab(camera + 0.3);
  const j = manJoints(h.p);
  const W2 = j.L.W, E = j.L.E;
  const d = {x: W2.x - E.x, y: W2.y - E.y};
  const l = Math.hypot(d.x, d.y) || 1;
  const palm = {x: W2.x + (d.x / l) * 55, y: W2.y + (d.y / l) * 55};
  return {x: HERO_G.x + palm.x / 600, y: -palm.y / 600};
};
