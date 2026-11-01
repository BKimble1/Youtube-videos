// Blood Lizard V3 timeline (hook and retention rebuild). The narration is the approved master, unchanged; every beat
// is keyed to its measured word times. One desert world (cm), one horned lizard, one coyote (facing screen left), one
// camera. No cuts.
//
//   0.00-0.27  the moment of danger: the lizard large in the foreground (three-quarter view), the coyote lunging at it,
//              jaws open; 0.15 blood fires from the front corner of the lids and reaches the open mouth by 0.27
//   0.27-2.0   the stream keeps hitting mouth and muzzle (droplets, splash); the coyote snaps back at 0.38 and backpedals
//   2.0-3.75   head shakes, lip licking; the lizard stays planted, puffed, blood at its eye
//   3.75-4.55  a smooth push onto the eye; the cutaway window opens round it
//   4.55-9.16  the camera travels through the head: the muscle squeezes the vein ("When a predator attacks"), then
//              along the vessel to the sinus ring, which swells with every heartbeat ("pressure builds"), then to the lid
//              vessel ballooning at the pore; "BURST": it tears and the blood leaves through the pore
//   9.16-12.4  out of the head with the blood: a trajectory shot along the arc. The squirt has a range: it splashes on
//              the sand short of the coyote, which is lunging in again; on "mouth" its open mouth enters the stream
//   12.4-16.5  the coyote yanks its head away, gags, shakes its head ("disgusting"), backs off and spits ("spit");
//              the lizard turns and runs
//   16.5-19.0  a low tracking camera stays close on the lizard scurrying left across the sand
//   19.0-21.0  it stops and turns its head toward the camera; the coyote comes back into frame; a fast smooth push into
//              the opening two-shot: frame 0 again, one desert PERIOD (45 cm) to the left (the layers are periodic)
import {P, add, mul, nrm, pt, rot, sub} from './core/geo';
import {FPS, FRAMES, clamp, keyS, lerp, noise1, ring, ss, ss5, word} from './lib';
import {LizardState, eyeToWorld, eyeWorld, poreDirWorld, poreWorld} from './art/lizard';
import {CoyoteHead, CoyoteState, HEAD_K, coyoteHeadWorld, mouthTarget} from './art/coyote';
import {SectionState} from './art/section';
import {JetState, jetPoint} from './art/jet';
import {PERIOD} from './art/desert';

const w = word;
export const T = {
  lizard: w('lizard').start, shoot: w('SHOOT').start, eyesEnd: w('eyes!').end, when: w('When').start, attacks: w('attacks').start,
  pressure: w('pressure').start, until: w('Until').start, burst: w('BURST').start, launching: w('launching').start, into: w('into').start,
  mouth: w('mouth!').start, mouthEnd: w('mouth!').end, and: w('And').start, tastes: w('tastes').start, disgusting: w('disgusting').start,
  disgustingEnd: w('disgusting').end, spit: w('spit').start, out: w('out', 1).start, leaving: w('Leaving').start, alive: w('alive').start,
  again: w('again.').start, againEnd: w('again.').end,
};
export const LOOP_T = FRAMES / FPS;
export const DX = PERIOD;
export const speedAt = (_t: number) => 1;
export const vOf = (t: number) => t;
export const tOfV = (v: number) => v;

export const EV = {
  // A: the hook
  jetA0: 0.15, jetA1: 1.15, flightA: 0.12, react: 0.38, recoil1: 0.95, back1: 1.7, shake0: 1.55, shake1: 2.45, shake2a: 2.65, shake2b: 3.2,
  push0: 3.75, push1: 4.55,
  // B: the cutaway
  reveal0: 4.25, reveal1: 4.95, shadow0: T.when - 0.05, flinch: T.when + 0.15, sq0: T.when + 0.45, sq1: T.attacks + 0.35,
  p0: T.attacks + 0.4, p1: T.until + 0.25, tremble0: T.until, burst: T.burst + 0.02, revealOut0: T.burst + 0.2, revealOut1: T.burst + 0.75,
  // C: the second squirt
  jetB1: T.mouthEnd + 0.1, flightB: 0.14, lunge0: T.burst + 0.3, hitB: T.mouth - 0.06,
  // D: repelled, escape
  jerk1: T.mouth + 0.55, shakeB0: T.tastes + 0.1, shakeB1: T.disgustingEnd + 0.3, backB0: T.disgustingEnd, backB1: T.spit - 0.2,
  spit: T.spit + 0.05, paw0: T.spit + 0.5, paw1: T.out + 0.5,
  pivot0: T.and + 0.25, pivot1: T.tastes + 0.25, run0: T.tastes + 0.15, run1: 18.95, pivotB0: 18.95, pivotB1: 19.75,
  charge0: LOOP_T - 1.6,
};

// ---------------------------------------------------------------- the lizard
const YAW_HOOK = 0.55, YAW_SIDE = 0.15;
const L0: LizardState = {x: 0, y: 0, yaw: YAW_HOOK, head: -0.3, puff: 0.5, gait: 0, run: 0, flinch: 0, eye: {look: 0.6, blink: 0, bulge: 0, blood: 0, wet: 0}, t: 0};
const LS: LizardState = {...L0, yaw: YAW_SIDE};
export const EYE0 = eyeWorld(L0);
const blinkAt = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => Math.max(0, 1 - Math.abs(t - b) / 0.07)));
/** the lizard facing the attack (tau: film time, or film time minus the loop length at the end; x0: where it stands) */
const hookLizard = (tau: number, x0: number): LizardState => {
  const bulge = 0.8 * ss(tau, -0.9, 0.12) * (1 - 0.7 * ss(tau, 0.2, 0.9));
  return {...L0, x: x0, head: -0.3 - 0.04 * Math.sin(Math.PI * clamp((tau - 0.12) / 0.3)), puff: lerp(0.15, 0.55, ss(tau, -1.1, -0.2)),
    eye: {look: 0.6, blink: blinkAt(tau, [2.1]), bulge, blood: 0.75 * ss(tau, 0.3, 1.4), wet: ss(tau, 0.12, 0.18) * (1 - 0.4 * ss(tau, 1.2, 2.5))}, t: tau};
};
const STRIDE = 2.4;
const runX = (t: number) => -DX * ss5(t, EV.run0, EV.run1);
const yawAt = (t: number) => {
  if (t < EV.pivot0) return lerp(YAW_HOOK, YAW_SIDE, ss(t, EV.reveal0, EV.p0 + 0.5));
  if (t < EV.pivotB0) return lerp(YAW_SIDE, Math.PI, ss(t, EV.pivot0, EV.pivot1));
  return lerp(Math.PI, YAW_HOOK, ss(t, EV.pivotB0, EV.pivotB1)); // through PI/2: it turns to face the camera
};
export const lizardAt = (t: number): LizardState => {
  const tau = t - LOOP_T;
  if (tau > -1.25) {
    const h = hookLizard(tau, -DX);
    const k = ss(tau, -1.25, -0.9);
    const b = escapeLizard(LOOP_T - 1.25);
    return {...h, yaw: yawAt(t), head: lerp(b.head, h.head, k), puff: lerp(b.puff, h.puff, k), gait: b.gait + 2.4 * (tau + 1.25) * (1 - k), run: lerp(b.run, 0, ss(tau, -1.25, -1.0)),
      eye: {...h.eye, blood: lerp(b.eye.blood, 0, k), wet: lerp(b.eye.wet, 0, k)}};
  }
  if (t < EV.pivot0) {
    const h = hookLizard(Math.min(t, 4.0), 0);
    const fl = clamp(Math.max(0, ring(t, EV.flinch, 3.5, 0.18)) + (t > EV.flinch ? 0.6 * Math.exp(-(t - EV.flinch) / 0.15) : 0));
    const bulge = t < EV.reveal1 ? h.eye.bulge : t < EV.revealOut1 ? 0.8 : lerp(0.75, 0.25, ss(t, EV.revealOut1, EV.hitB + 0.6));
    const blood = t < EV.burst ? h.eye.blood * (1 - ss(t, 4.4, 5.2)) : ss(t, EV.jetB1 - 0.2, EV.jetB1 + 0.6);
    const wet = t < EV.burst ? h.eye.wet : 1;
    return {...h, x: 0, yaw: yawAt(t), flinch: fl, eye: {...h.eye, bulge, blood, wet, blink: blinkAt(t, [2.1])}, t};
  }
  return escapeLizard(t);
};
/** turn, scurry left, stop and turn back toward the camera */
const escapeLizard = (t: number): LizardState => {
  const x = runX(t);
  const sp = Math.abs(runX(t + 0.01) - runX(t - 0.01)) / 0.02;
  const pivoting = Math.max(Math.sin(Math.PI * clamp((t - EV.pivot0) / (EV.pivot1 - EV.pivot0))), Math.sin(Math.PI * clamp((t - EV.pivotB0) / (EV.pivotB1 - EV.pivotB0))));
  const run = clamp(Math.max(sp / 13, 0.55 * pivoting));
  const gait = Math.abs(x) / STRIDE + 2.2 * Math.max(0, Math.min(t, EV.pivot1) - EV.pivot0) + 2.2 * Math.max(0, Math.min(t, EV.pivotB1) - EV.pivotB0);
  return {
    ...L0, x, yaw: yawAt(t), head: lerp(-0.25, -0.06, ss(t, EV.pivot0, EV.run0 + 0.4)) - 0.22 * ss(t, EV.pivotB0, EV.pivotB1), puff: lerp(0.55, 0.15, ss(t, EV.pivot0, EV.run0 + 0.6)),
    gait, run, flinch: 0,
    eye: {look: 0.2, blink: blinkAt(t, [EV.run0 + 2.4]), bulge: 0.25 * (1 - ss(t, EV.pivot0, EV.run0)), blood: 1 - ss(t, EV.run0 + 0.6, EV.run0 + 2.2), wet: 0.6 * (1 - ss(t, EV.pivot0, EV.run0 + 1))}, t,
  };
};

// ---------------------------------------------------------------- the coyote (dir -1: faces screen left)
const ATK: CoyoteHead = {jaw: 0.5, ears: 0, squint: 0, lip: 0.45, wrinkle: 0.45, tongue: 0, blood: 0, look: 0.8, shake: 0};
const DIS: CoyoteHead = {jaw: 0.42, ears: 0.9, squint: 0.85, lip: 0.85, wrinkle: 1, tongue: 0.6, blood: 0.8, look: 0.1, shake: 0};
const mixHead = (a: CoyoteHead, b: CoyoteHead, u: number): CoyoteHead => {
  const o: any = {};
  for (const k of Object.keys(a)) o[k] = lerp((a as any)[k], (b as any)[k], u);
  return o;
};
const MOUTH_AT = add(EYE0, pt(6.2, -3.4));
const JL_LUNGE = pt(31, -17), ANG_LUNGE = 0.42, CROUCH_LUNGE = 9;
const bodyForMouth = (M: P, Jl: P, ang: number, jaw: number, crouch: number) => {
  const l = add(pt(Jl.x, Jl.y + crouch), rot(mul(mouthTarget(jaw), HEAD_K), ang));
  return {x: M.x + l.x, dy: M.y - l.y};
};
const LUNGE = bodyForMouth(MOUTH_AT, JL_LUNGE, ANG_LUNGE, ATK.jaw, CROUCH_LUNGE);
const BODY_LUNGE = LUNGE.x;
const JL_LUNGE_Y = JL_LUNGE.y + LUNGE.dy;
const BODY_FAR = BODY_LUNGE + 14;
const coy = (x: number, J: P, ang: number, hd: CoyoteHead, crouch: number, stride: number, t: number, paw = 0): CoyoteState => (
  {x, y: 0, dir: -1, J, ang, hd, crouch, walk: x / 20, stride, paw, t}
);
const strideFor = (v: number) => clamp(Math.abs(v) * 0.42, 0, 26);
const headShake = (t: number, a: number, b: number, hz = 3.4) => Math.sin(2 * Math.PI * hz * (t - a)) * ss(t, a, a + 0.1) * (1 - ss(t, b - 0.18, b));
/** the charge and lunge, the first hit, the recoil and head shakes (tau relative to the hook; x0 = the lizard) */
const hookCoyote = (tau: number, x0: number): CoyoteState => {
  const bx = (tt: number) => x0 + keyS(tt, [[-1.6, BODY_FAR + DX], [-0.45, BODY_LUNGE + 3], [EV.react, BODY_LUNGE], [EV.back1, BODY_LUNGE + 5], [3.3, BODY_LUNGE + 6], [4.2, BODY_LUNGE + 5]]);
  const x = bx(tau);
  const v = (bx(tau + 0.01) - bx(tau - 0.01)) / 0.02;
  const lunge = ss5(tau, -0.7, -0.05);
  const rec = ss5(tau, EV.react, EV.recoil1);
  const settle = ss5(tau, EV.shake1, 3.4);
  const J = pt(lerp(lerp(24, JL_LUNGE.x, lunge), lerp(26, 25, settle), rec), lerp(lerp(-30, JL_LUNGE_Y, lunge), lerp(-27, -23, settle), rec));
  const ang = lerp(lerp(0.22, ANG_LUNGE, lunge), lerp(-0.3, 0.35, settle), rec);
  const shake = headShake(tau, EV.shake0, EV.shake1) + 0.7 * headShake(tau, EV.shake2a, EV.shake2b, 3.8);
  const charge: CoyoteHead = {...ATK, jaw: 0.15 + 0.4 * lunge + 0.04 * Math.sin(tau * 11), blood: 0};
  const hit = mixHead(charge, {...DIS, blood: 0.8 * ss(tau, EV.jetA0 + EV.flightA, EV.jetA0 + EV.flightA + 0.1)}, ss(tau, EV.react - 0.05, EV.react + 0.2));
  const calm = mixHead(hit, {...ATK, jaw: 0.25, ears: 0.3, lip: 0.6, blood: 0.5, tongue: 0.15}, ss(tau, 3.2, 4.0));
  return coy(x, J, ang + 0.06 * shake, {...calm, shake, jaw: calm.jaw + 0.2 * Math.sin(Math.PI * clamp((tau - EV.react) / 0.35))},
    lerp(lerp(3, CROUCH_LUNGE, lunge), lerp(2, 5, settle), rec), strideFor(v), tau);
};
/** while the camera is in the head it lunges in again, takes the stream in the mouth, and is repelled */
const midCoyote = (t: number): CoyoteState => {
  const h = hookCoyote(4.2, 0);
  const bx = (tt: number) => keyS(tt, [[4.2, h.x], [EV.lunge0, BODY_LUNGE + 22], [EV.hitB, BODY_LUNGE], [EV.jerk1, BODY_LUNGE + 4], [EV.backB0, BODY_LUNGE + 6], [EV.backB1, BODY_FAR]]);
  const x = bx(t);
  const v = (bx(t + 0.01) - bx(t - 0.01)) / 0.02;
  const lunge = ss5(t, EV.lunge0, EV.hitB);
  const Jx = keyS(t, [[4.2, h.J.x], [EV.lunge0, 26], [EV.hitB, JL_LUNGE.x], [EV.jerk1, 14], [EV.shakeB0, 18], [EV.shakeB1, 22], [EV.spit, 27], [EV.paw0, 21], [EV.paw1, 23]]);
  const Jy = keyS(t, [[4.2, h.J.y], [EV.lunge0, -28], [EV.hitB, JL_LUNGE_Y], [EV.jerk1, -37], [EV.shakeB0, -32], [EV.shakeB1, -26], [EV.spit, -16], [EV.paw0, -22], [EV.paw1, -24]]);
  const ang = keyS(t, [[4.2, h.ang], [EV.lunge0, 0.28], [EV.hitB, ANG_LUNGE], [EV.jerk1, -0.36], [EV.shakeB0, -0.1], [EV.shakeB1, 0.4], [EV.spit, 0.8], [EV.paw0, 0.55], [EV.paw1, 0.45]]);
  const shake = headShake(t, EV.shakeB0, EV.shakeB1);
  const stalk: CoyoteHead = {...ATK, jaw: 0.18 + 0.4 * lunge, blood: 0.4, ears: 0.1, lip: 0.6};
  const disg = mixHead(stalk, {...DIS, blood: 0.9}, ss(t, EV.hitB + 0.05, EV.hitB + 0.25));
  const spitOpen = Math.sin(Math.PI * clamp((t - EV.spit + 0.05) / 0.35));
  const hd: CoyoteHead = {...disg, tongue: disg.tongue + 0.4 * ss(t, EV.shakeB0, EV.shakeB0 + 0.6), shake,
    jaw: disg.jaw + 0.45 * spitOpen + 0.25 * Math.sin(Math.PI * clamp((t - EV.hitB - 0.05) / 0.4)) + 0.1 * Math.sin(t * 9) * ss(t, EV.paw0, EV.paw1)};
  const paw = ss(t, EV.paw0, EV.paw0 + 0.25) * (1 - ss(t, EV.paw1 - 0.25, EV.paw1)) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 2.5 * (t - EV.paw0)));
  const crouch = keyS(t, [[4.2, h.crouch], [EV.lunge0, 5], [EV.hitB, CROUCH_LUNGE], [EV.jerk1, 2], [EV.spit, 8], [EV.paw1, 6]]);
  return coy(x, pt(Jx, Jy), ang + 0.06 * shake, hd, crouch, strideFor(v), t, paw);
};
export const coyoteAt = (t: number): CoyoteState => {
  const tau = t - LOOP_T;
  if (tau >= -1.6) return hookCoyote(tau, -DX);
  if (t < 4.2) return hookCoyote(t, 0);
  return midCoyote(t);
};
export const mouthWorld = (c: CoyoteState) => coyoteHeadWorld(c, mouthTarget(c.hd.jaw));

// ---------------------------------------------------------------- the squirts
const JW = 0.24;
const RANGE = 10.5;
/** where a squirt aimed at the mouth lands: in the mouth when it is within range, otherwise on the sand short of it */
const landing = (from: P, M: P) => {
  const d = Math.hypot(M.x - from.x, M.y - from.y);
  const k = ss(d, RANGE - 1.2, RANGE + 0.6);
  const g = pt(from.x + (M.x - from.x) * (RANGE * 0.92 / d), 0.3);
  return {p: pt(lerp(M.x, g.x, k), lerp(M.y, g.y, k)), ground: k > 0.5};
};
export const jetAt = (t: number): JetState | null => {
  const tau = t - LOOP_T;
  if (t < 4.0 || tau > -1) {
    const tt = t < 4.0 ? t : tau;
    if (tt < EV.jetA0 || tt > EV.jetA1 + EV.flightA + 0.45) return null;
    const lz = lizardAt(t), c = coyoteAt(t);
    const from = poreWorld(lz);
    const L = landing(from, mouthWorld(c));
    return {from, dir: poreDirWorld(lz), to: L.p, ground: L.ground, t0: EV.jetA0, t1: EV.jetA1, flight: EV.flightA, t: tt, w: JW};
  }
  if (t < EV.burst || t > EV.jetB1 + 0.6) return null;
  const lz = lizardAt(t), c = coyoteAt(t);
  const from = poreWorld(lz);
  const L = landing(from, mouthWorld(c));
  return {from, dir: poreDirWorld(lz), to: L.p, ground: L.ground, t0: EV.burst + 0.03, t1: EV.jetB1, flight: EV.flightB, t, w: JW * 1.08};
};
/** the coyote spits: drops of bloody saliva thrown from its mouth, falling to the sand */
export const spitAt = (t: number): {p: P; r: number}[] => {
  if (t < EV.spit || t > EV.spit + 0.7) return [];
  const m = mouthWorld(coyoteAt(EV.spit + 0.05));
  return [0, 1, 2, 3, 4].map((i) => {
    const dt = t - EV.spit - i * 0.03;
    if (dt < 0) return null;
    const vx = -(40 + 18 * i), vy = -20 + 12 * i;
    return {p: pt(m.x + vx * Math.min(dt, 0.4), Math.min(0.2, m.y + vy * dt + 490 * dt * dt)), r: 0.35 - 0.05 * i};
  }).filter((d): d is {p: P; r: number} => !!d && t - EV.spit < 0.6);
};

// ---------------------------------------------------------------- the cutaway
const BEAT_SLOW = 0.5, BEAT_FAST = 0.33;
export const beatTimes: number[] = [];
for (let b = 3.9; b < 11; ) {
  beatTimes.push(b);
  b += b < EV.p0 - 0.2 ? BEAT_SLOW : BEAT_FAST;
}
const beatAt = (t: number) => {
  let last = -10;
  for (const b of beatTimes) if (b <= t) last = b;
  return Math.exp(-(t - last) / 0.11);
};
const pressureAt = (t: number) => {
  if (t < EV.p0) return 0;
  const n = (EV.p1 - EV.p0) / BEAT_FAST, c = (t - EV.p0) / BEAT_FAST;
  return clamp((Math.floor(c) + ss(c - Math.floor(c), 0, 0.4)) / n);
};
const PH: {a: number; v: number}[] = [];
{
  let a = 0, vv = 0;
  for (let i = 0; i <= 1400; i++) {
    const t = i / 100;
    PH.push({a, v: vv});
    a += ((0.5 + 0.5 * beatAt(t)) / 100) * (1 - 0.45 * pressureAt(t));
    vv += (0.4 / 100) * (1 - ss(t, EV.sq0, EV.sq1));
  }
}
export const sectionAt = (t: number): SectionState => {
  const i = clamp(t * 100, 0, 1399), i0 = Math.floor(i), f = i - i0;
  return {
    reveal: ss(t, EV.reveal0, EV.reveal1) * (1 - ss(t, EV.revealOut0, EV.revealOut1)),
    squeeze: ss(t, EV.sq0, EV.sq1), p: pressureAt(t), beat: beatAt(t),
    aPhase: lerp(PH[i0].a, PH[i0 + 1].a, f), vPhase: lerp(PH[i0].v, PH[i0 + 1].v, f), burst: t >= EV.burst ? t - EV.burst : -1,
    shadow: ss(t, EV.shadow0, EV.shadow0 + 0.35) * (1 - ss(t, EV.revealOut0, EV.revealOut1)) * (0.75 + 0.25 * Math.sin(t * 2)), t,
  };
};

// ---------------------------------------------------------------- the camera
export type Cam = {x: number; y: number; w: number};
type K = [number, number, number, number];
const spline = (t: number, keys: K[]): Cam => {
  const n = keys.length;
  const val = (k: K) => [k[1], k[2], Math.log(k[3])];
  if (t <= keys[0][0]) return {x: keys[0][1], y: keys[0][2], w: keys[0][3]};
  if (t >= keys[n - 1][0]) return {x: keys[n - 1][1], y: keys[n - 1][2], w: keys[n - 1][3]};
  let i = 0;
  while (keys[i + 1][0] < t) i++;
  const tan = (j: number) => {
    if (j === 0 || j === n - 1) return [0, 0, 0];
    const a = val(keys[j - 1]), b = val(keys[j + 1]);
    return a.map((x, m) => (b[m] - x) / (keys[j + 1][0] - keys[j - 1][0]));
  };
  const t0 = keys[i][0], h = keys[i + 1][0] - t0, u = (t - t0) / h;
  const p0 = val(keys[i]), p1 = val(keys[i + 1]), m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const r = p0.map((_, m) => h00 * p0[m] + h10 * h * m0[m] + h01 * p1[m] + h11 * h * m1[m]);
  return {x: r[0], y: r[1], w: Math.exp(r[2])};
};
const mixCam = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), u))});
const E = (q: P) => eyeToWorld(LS, q); // points in the eye's frame, for the cutaway camera path
/** the hook (relative to where the lizard stands), the recoil two-shot, and the push into the eye and through the head */
const camAB = (tau: number, x0: number): Cam => {
  const s0 = E(pt(-0.75, 0.15)), mus = E(pt(-1.3, -0.08)), back = E(pt(-0.55, 0.05)), top = E(pt(-0.05, -0.28)), pore = E(pt(0.22, -0.16));
  const c = spline(tau, [
    [-1.3, 8, -12, 27], [-0.6, 6, -8, 19], [0.0, 3.0, -4.8, 14.5], [0.3, 3.8, -5.6, 15.5], [0.9, 6.5, -9.5, 20], [2.0, 8.5, -13, 25],
    [3.3, 8, -12.5, 24.5], [EV.push0, 7, -9.5, 21], [EV.push1 - 0.05, s0.x, s0.y, 3.4], [5.35, mus.x, mus.y, 2.3], [6.45, back.x, back.y, 2.5],
    [7.55, top.x, top.y, 2.1], [8.6, pore.x, pore.y, 1.75], [EV.burst, pore.x + 0.02, pore.y, 1.7],
  ]);
  return {...c, x: c.x + x0};
};
/** out of the head along the stream to the mouth: the trajectory shot */
const camC = (t: number): Cam => {
  const lz = lizardAt(t), c = coyoteAt(Math.min(t, EV.hitB));
  const from = poreWorld(lz);
  const M = mouthWorld(c);
  const L = landing(from, M);
  const j = {from, dir: poreDirWorld(lz), to: L.p};
  const s = ss5(t, EV.burst + 0.15, EV.hitB);
  const along = jetPoint(j, lerp(0.05, 0.62, s));
  const out = ss5(t, EV.burst, EV.burst + 0.75);
  const pore = E(pt(0.22, -0.16));
  return {x: lerp(pore.x, along.x, out), y: lerp(pore.y, along.y - 1.5 - 1.2 * s, out), w: Math.exp(lerp(Math.log(1.7), lerp(Math.log(7), Math.log(15), s), out))};
};
const camD = (t: number): Cam => {
  const lz = lizardAt(t), cy = coyoteAt(t);
  const head = coyoteHeadWorld(cy, pt(4, -2));
  const mid = pt(lerp(lz.x, head.x, 0.42), lerp(-1, head.y, 0.5));
  const span = clamp(Math.abs(head.x - lz.x) + 9, 18, 28);
  const follow = ss5(t, 13.7, 15.4);
  return {x: lerp(mid.x, lz.x - 2.5, follow), y: lerp(mid.y - 1, -5.5, follow), w: Math.exp(lerp(Math.log(span), Math.log(19), follow))};
};
const smoothCam = (f: (t: number) => Cam, t: number, span = 0.35, n = 5): Cam => {
  let x = 0, y = 0, lw = 0;
  for (let i = 0; i < n; i++) {
    const c = f(t - (i / (n - 1)) * span);
    x += c.x; y += c.y; lw += Math.log(c.w);
  }
  return {x: x / n, y: y / n, w: Math.exp(lw / n)};
};
export const camAt = (t: number): Cam => {
  const tau = t - LOOP_T;
  let c: Cam;
  if (t < EV.burst) c = camAB(t, 0);
  else if (t < EV.hitB) c = camC(t);
  else if (t < EV.hitB + 0.6) c = mixCam(camC(EV.hitB), smoothCam(camD, t), ss5(t, EV.hitB, EV.hitB + 0.6));
  else c = smoothCam(camD, t);
  if (tau > -2.0) c = mixCam(c, camAB(tau, -DX), ss5(tau, -2.0, -1.2));
  const sh = 0.03 * Math.exp(-Math.max(0, t - EV.burst) / 0.15) * (t > EV.burst ? 1 : 0) + 0.02 * Math.exp(-Math.max(0, t - EV.hitB) / 0.2) * (t > EV.hitB ? 1 : 0)
    + 0.015 * Math.exp(-Math.max(0, t - EV.jetA0 - EV.flightA) / 0.2) * (t > EV.jetA0 + EV.flightA && t < 3 ? 1 : 0) + 0.008 * ss(t, EV.tremble0, EV.burst) * (t < EV.burst ? 1 : 0);
  return {x: c.x + sh * c.w * noise1(t * 40, 1), y: c.y + sh * c.w * noise1(t * 40, 2), w: c.w};
};
void nrm; void sub;
