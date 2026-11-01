// Blood Lizard V2 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()), which is
// unchanged from V1. One desert world (cm), one horned lizard, one coyote (facing screen left), one camera. No cuts.
//
//   0.00-1.05  the coyote charges in from the right and lunges, jaws open; the camera rushes in until the lizard's eye
//              fills the frame; 0.42 a jet leaves the FRONT corner of the lids; the camera races along it to the muzzle
//   1.05-2.9   the blood hits the mouth and muzzle; the coyote jerks its head up and back and backpedals, shaking
//   2.9-3.9    the squirt loses pressure: where the stream lands moves back toward the lizard; the camera follows the
//              blood back into the eye
//   3.6-9.16   a clean cutaway opens round the eye: the sinus ring, artery in, vein out through its muscle. "When a
//              predator attacks": its shadow, the muscle squeezes the vein shut. Each heartbeat swells the ring; the lid
//              vessel balloons at the front corner. "BURST": it tears at the pore
//   9.16-12.4  the camera pulls back with the new jet to the whole lizard; the coyote is lunging again; the stream lands
//              in its mouth on "mouth"
//   12.4-16.2  the coyote jerks its head away, backs off, grimaces ("disgusting"), shakes its head and spits ("spit")
//   15.75-19.0 the lizard pivots and scurries away left across the sand; the coyote stays repelled (pawing, rubbing
//              its muzzle)
//   19.0-21.0  the lizard pivots back to face the danger as the coyote turns back and charges; the camera pushes toward
//              the lizard's eye: frame 0 again, one PERIOD (45 cm) to the left (the desert layers are periodic)
import {P, add, mul, nrm, pt, rot, sub} from './core/geo';
import {DUR, FPS, FRAMES, clamp, easeOut, keyS, lerp, noise1, ring, ss, ss5, word} from './lib';
import {LizardState, eyeWorld, poreDirWorld, poreWorld} from './art/lizard';
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
  jetA0: 0.42, hitA: 1.02, recoil1: 1.7, shake0: 1.85, shake1: 2.6, drop0: 2.9, drop1: 3.75,
  reveal0: 3.55, reveal1: 4.3, shadow0: T.when - 0.05, flinch: T.when + 0.15, sq0: T.when + 0.4, sq1: T.attacks + 0.3,
  p0: T.attacks + 0.15, p1: T.until + 0.25, tremble0: T.until, burst: T.burst + 0.02,
  revealOut0: T.burst + 0.3, revealOut1: T.launching + 0.2, stalk0: 9.9, lunge0: T.into - 0.3, hitB: T.mouth - 0.03, streamEnd: T.mouth + 0.3,
  jerk1: T.mouth + 0.6, back0: T.and, back1: T.disgusting + 0.6, grim0: T.tastes - 0.2, shakeB0: T.disgustingEnd, shakeB1: T.spit - 0.1,
  spit: T.spit + 0.05, paw0: T.spit + 0.55, paw1: T.out + 0.55, rub0: T.leaving + 0.1, rub1: 19.1, look: 19.2,
  pivot0: T.disgustingEnd + 0.75, pivot1: T.spit + 0.25, run0: T.spit + 0.2, run1: 19.05, pivotB0: 19.05, pivotB1: 19.85,
  charge0: LOOP_T - 1.6,
};

// ---------------------------------------------------------------- the lizard
const L0: LizardState = {x: 0, y: 0, yaw: 0, head: -0.3, puff: 0.5, gait: 0, run: 0, flinch: 0, eye: {look: 0.6, blink: 0, bulge: 0, blood: 0, wet: 0}, t: 0};
export const EYE0 = eyeWorld(L0);
export const PORE0 = poreWorld(L0);
const blinkAt = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => Math.max(0, 1 - Math.abs(t - b) / 0.07)));
/** the lizard facing the attack (tau: film time, or film time minus the loop length at the end; x0: where it stands) */
const hookLizard = (tau: number, x0: number): LizardState => {
  const bulge = 0.75 * ss(tau, -0.9, 0.38) * (1 - 0.7 * ss(tau, 0.45, 1.0));
  return {...L0, x: x0, head: -0.3 - 0.03 * Math.sin(Math.PI * clamp((tau - 0.4) / 0.3)), puff: lerp(0.15, 0.5, ss(tau, -1.1, -0.2)),
    eye: {look: 0.6, blink: blinkAt(tau, [2.3]), bulge, blood: 0.7 * ss(tau, 0.6, 1.6), wet: ss(tau, 0.38, 0.44) * (1 - 0.4 * ss(tau, 3.4, 4.0))}, t: tau};
};
const STRIDE = 2.4;
const runX = (t: number) => -DX * ss5(t, EV.run0, EV.run1);
const pivotYaw = (t: number) => Math.PI * ss(t, EV.pivot0, EV.pivot1) * (1 - ss(t, EV.pivotB0, EV.pivotB1));
export const lizardAt = (t: number): LizardState => {
  const tau = t - LOOP_T;
  if (tau > -1.15) {
    const h = hookLizard(tau, -DX);
    const k = ss(tau, -1.15, -0.9);
    const b = escapeLizard(LOOP_T - 1.15);
    return {...h, head: lerp(b.head, h.head, k), puff: lerp(b.puff, h.puff, k), gait: b.gait + 2.4 * (tau + 1.15) * (1 - k), run: lerp(b.run, 0, ss(tau, -1.15, -0.95)),
      eye: {...h.eye, blood: lerp(b.eye.blood, 0, k), wet: lerp(b.eye.wet, 0, k)}};
  }
  if (t < EV.pivot0) {
    const h = hookLizard(Math.min(t, 4.0), 0);
    const fl = clamp(Math.max(0, ring(t, EV.flinch, 3.5, 0.18)) + (t > EV.flinch ? 0.6 * Math.exp(-(t - EV.flinch) / 0.15) : 0))
      + clamp(t > EV.hitB ? 0.5 * Math.exp(-(t - EV.hitB) / 0.2) : 0);
    const bulge = t < EV.reveal1 ? h.eye.bulge : t < EV.revealOut1 ? 0.75 : lerp(0.55, 0.1, ss(t, EV.revealOut1, EV.hitB + 1));
    const blood = t < EV.burst ? h.eye.blood * (1 - ss(t, 4.5, 6)) : ss(t, EV.burst + 0.2, EV.burst + 1.4);
    const wet = t < EV.burst ? h.eye.wet : 1 - 0.5 * ss(t, EV.streamEnd, EV.streamEnd + 1);
    const puff = t < EV.hitB ? h.puff : lerp(0.5, 0.65, ss(t, EV.hitB, EV.hitB + 0.4));
    return {...h, x: 0, flinch: clamp(fl), puff, eye: {...h.eye, bulge, blood, wet, blink: blinkAt(t, [2.3, 6.9, EV.back0 + 0.5])}, t};
  }
  return escapeLizard(t);
};
/** pivot left, scurry, pivot back */
const escapeLizard = (t: number): LizardState => {
  const x = runX(t);
  const sp = Math.abs(runX(t + 0.01) - runX(t - 0.01)) / 0.02;
  const pivoting = Math.max(Math.sin(Math.PI * clamp((t - EV.pivot0) / (EV.pivot1 - EV.pivot0))), Math.sin(Math.PI * clamp((t - EV.pivotB0) / (EV.pivotB1 - EV.pivotB0))));
  const run = clamp(Math.max(sp / 14, 0.55 * pivoting));
  const gait = Math.abs(x) / STRIDE + 2.2 * Math.max(0, Math.min(t, EV.pivot1) - EV.pivot0) + 2.2 * Math.max(0, Math.min(t, EV.pivotB1) - EV.pivotB0);
  return {
    ...L0, x, yaw: pivotYaw(t), head: lerp(-0.25, -0.05, ss(t, EV.pivot0, EV.run0 + 0.3)) - 0.2 * ss(t, EV.pivotB0, EV.pivotB1), puff: lerp(0.6, 0.15, ss(t, EV.pivot0, EV.run0 + 0.6)),
    gait, run, flinch: 0,
    eye: {look: 0.2, blink: blinkAt(t, [EV.run0 + 1.3]), bulge: 0.1 * (1 - ss(t, EV.pivot0, EV.run0)), blood: 1 - ss(t, EV.run0 + 0.4, EV.run0 + 1.8), wet: 0.5 * (1 - ss(t, EV.pivot0, EV.run0 + 0.8))}, t,
  };
};

// ---------------------------------------------------------------- the coyote (dir -1: faces screen left)
const ATK: CoyoteHead = {jaw: 0.5, ears: 0, squint: 0, lip: 0.45, wrinkle: 0.45, tongue: 0, blood: 0, look: 0.8, shake: 0};
const DIS: CoyoteHead = {jaw: 0.35, ears: 0.9, squint: 0.85, lip: 0.85, wrinkle: 1, tongue: 0.55, blood: 0.7, look: 0.1, shake: 0};
const mixHead = (a: CoyoteHead, b: CoyoteHead, u: number): CoyoteHead => {
  const o: any = {};
  for (const k of Object.keys(a)) o[k] = lerp((a as any)[k], (b as any)[k], u);
  return o;
};
const MOUTH_AT = add(EYE0, pt(6.6, -3.2));
const JL_LUNGE = pt(31, -17), ANG_LUNGE = 0.42, CROUCH_LUNGE = 9;
/** the body x that puts the mouth at M (world) for a given head pose */
const bodyForMouth = (M: P, Jl: P, ang: number, jaw: number, crouch: number) => {
  const l = add(pt(Jl.x, Jl.y + crouch), rot(mul(mouthTarget(jaw), HEAD_K), ang));
  return {x: M.x + l.x, dy: M.y - l.y};
};
const LUNGE = bodyForMouth(MOUTH_AT, JL_LUNGE, ANG_LUNGE, ATK.jaw, CROUCH_LUNGE);
const BODY_LUNGE = LUNGE.x;              // ~ +40: where the forepaws stand at the lunge
const JL_LUNGE_Y = JL_LUNGE.y + LUNGE.dy; // so the mouth height matches too
const BODY_FAR = BODY_LUNGE + 12;          // where it backs off to
const CHARGE_FROM = BODY_FAR - 0;          // the next charge starts where it stood (one PERIOD left of here is the hook's)
const coy = (x: number, J: P, ang: number, hd: CoyoteHead, crouch: number, walkX: number, stride: number, t: number, paw = 0): CoyoteState => (
  {x, y: 0, dir: -1, J, ang, hd, crouch, walk: walkX / 20, stride, paw, t}
);
const strideFor = (v: number) => clamp(Math.abs(v) * 0.42, 0, 26);
/** charge and lunge, hit, recoil (tau relative to the hook; x0 = where the lizard stands) */
const hookCoyote = (tau: number, x0: number): CoyoteState => {
  const bx = (tt: number) => x0 + keyS(tt, [[-1.6, CHARGE_FROM + DX], [-0.55, BODY_LUNGE + 4], [0.42, BODY_LUNGE], [EV.hitA, BODY_LUNGE + 0.5], [EV.recoil1 + 0.4, BODY_LUNGE + 8]]);
  const x = bx(tau);
  const v = (bx(tau + 0.01) - bx(tau - 0.01)) / 0.02;
  const lunge = ss5(tau, -0.65, 0.1);
  const rec = ss5(tau, EV.hitA + 0.02, EV.recoil1);
  const settle = ss5(tau, EV.shake1, EV.drop1);
  const J = pt(lerp(lerp(24, JL_LUNGE.x, lunge), lerp(15, 22, settle), rec), lerp(lerp(-30, JL_LUNGE_Y, lunge), lerp(-36, -22, settle), rec));
  const ang = lerp(lerp(0.22, ANG_LUNGE, lunge), lerp(-0.3, 0.6, settle), rec);
  const shake = Math.sin(2 * Math.PI * 3.3 * (tau - EV.shake0)) * ss(tau, EV.shake0, EV.shake0 + 0.12) * (1 - ss(tau, EV.shake1 - 0.2, EV.shake1));
  const charge: CoyoteHead = {...ATK, jaw: 0.15 + 0.35 * lunge + 0.04 * Math.sin(tau * 11), blood: 0};
  const hit = mixHead(charge, {...DIS, blood: 0.75 * ss(tau, EV.hitA, EV.hitA + 0.08)}, ss(tau, EV.hitA, EV.hitA + 0.25));
  return coy(x, J, ang + 0.05 * shake, {...hit, shake, jaw: hit.jaw + 0.15 * Math.sin(Math.PI * clamp((tau - EV.hitA) / 0.3))}, lerp(lerp(3, CROUCH_LUNGE, lunge), lerp(2, 6, settle), rec), x, strideFor(v), tau);
};
/** after the first hit: off screen while the camera is in the eye, back again, the second hit, repelled */
const midCoyote = (t: number): CoyoteState => {
  const h = hookCoyote(EV.drop1, 0);
  const bx = (tt: number) => keyS(tt, [[EV.drop1, h.x], [EV.stalk0, BODY_LUNGE + 10], [EV.lunge0, BODY_LUNGE + 5], [EV.hitB, BODY_LUNGE], [EV.jerk1, BODY_LUNGE + 3], [EV.back1, BODY_FAR]]);
  const x = bx(t);
  const v = (bx(t + 0.01) - bx(t - 0.01)) / 0.02;
  const lunge = ss5(t, EV.lunge0, EV.hitB);
  const jerk = ss5(t, EV.hitB + 0.03, EV.jerk1);
  const Jx = keyS(t, [[EV.drop1, h.J.x], [EV.stalk0, 24], [EV.lunge0, 26], [EV.hitB, JL_LUNGE.x], [EV.jerk1, 14], [EV.grim0, 15], [EV.shakeB0, 22], [EV.spit, 27], [EV.paw0, 20], [EV.rub0, 25], [EV.rub1, 26], [EV.look + 0.2, 22]]);
  const Jy = keyS(t, [[EV.drop1, h.J.y], [EV.stalk0, -30], [EV.lunge0, -27], [EV.hitB, JL_LUNGE_Y], [EV.jerk1, -38], [EV.grim0, -34], [EV.shakeB0, -26], [EV.spit, -16], [EV.paw0, -22], [EV.rub0, -15], [EV.rub1, -15], [EV.look + 0.2, -30]]);
  const ang = keyS(t, [[EV.drop1, h.ang], [EV.stalk0, 0.25], [EV.lunge0, 0.3], [EV.hitB, ANG_LUNGE], [EV.jerk1, -0.32], [EV.grim0, -0.15], [EV.shakeB0, 0.45], [EV.spit, 0.8], [EV.paw0, 0.55], [EV.rub0, 0.78], [EV.rub1, 0.78], [EV.look + 0.2, 0.22]]);
  const shake = Math.sin(2 * Math.PI * 3.4 * (t - EV.shakeB0)) * ss(t, EV.shakeB0, EV.shakeB0 + 0.12) * (1 - ss(t, EV.shakeB1 - 0.2, EV.shakeB1));
  const rub = Math.sin(2 * Math.PI * 1.6 * (t - EV.rub0)) * ss(t, EV.rub0, EV.rub0 + 0.3) * (1 - ss(t, EV.rub1 - 0.3, EV.rub1));
  const stalkHead: CoyoteHead = {...ATK, jaw: 0.12 + 0.38 * lunge, blood: 0.3, ears: 0.15, lip: 0.6};
  const disg = mixHead(stalkHead, {...DIS, blood: 0.85}, ss(t, EV.hitB, EV.hitB + 0.25));
  const spitOpen = Math.sin(Math.PI * clamp((t - EV.spit + 0.05) / 0.35));
  const looking = ss(t, EV.look - 0.1, EV.look + 0.4);
  const hd: CoyoteHead = mixHead({...disg, tongue: disg.tongue + 0.45 * ss(t, EV.grim0, EV.grim0 + 0.6), jaw: disg.jaw + 0.45 * spitOpen + 0.1 * Math.sin(t * 9) * ss(t, EV.paw0, EV.rub1) - 0.2 * ss(t, EV.grim0, EV.shakeB0) * (1 - spitOpen), shake},
    {...ATK, jaw: 0.2, blood: 0.4, look: 1}, looking);
  const paw = ss(t, EV.paw0, EV.paw0 + 0.25) * (1 - ss(t, EV.paw1 - 0.25, EV.paw1)) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 2.5 * (t - EV.paw0)));
  const crouch = keyS(t, [[EV.drop1, h.crouch], [EV.stalk0, 6], [EV.hitB, CROUCH_LUNGE], [EV.jerk1, 2], [EV.rub0, 12], [EV.rub1, 12], [EV.look + 0.2, 4]]);
  return coy(x, pt(Jx + 1.5 * rub, Jy), ang + 0.05 * shake + 0.06 * rub, hd, crouch, x, strideFor(v), t, paw);
};
export const coyoteAt = (t: number): CoyoteState => {
  const tau = t - LOOP_T;
  if (tau >= -1.6) return hookCoyote(tau, -DX);
  if (t < EV.drop1) return hookCoyote(t, 0);
  return midCoyote(t);
};
export const mouthWorld = (c: CoyoteState) => coyoteHeadWorld(c, mouthTarget(c.hd.jaw));

// ---------------------------------------------------------------- the jets
const JW = 0.27;
export const jetAt = (t: number): JetState | null => {
  const tau = t - LOOP_T;
  if (t < 4.0 || tau > -1) {
    const tt = t < 4.0 ? t : tau;
    if (tt < EV.jetA0 || tt > EV.drop1) return null;
    const lz = lizardAt(t);
    const c = coyoteAt(t);
    const from = poreWorld(lz);
    // where the stream lands: the mouth while it is there; then, as the squirt weakens, the sand nearer and nearer
    const mouth = mouthWorld(hookCoyote(Math.min(tt, EV.hitA + 0.12), 0));
    const sand = (k: number) => pt(EYE0.x + lerp(9.5, 1.2, k), 0.4);
    const to = tt < EV.hitA + 0.12 ? mouthWorld(c) : (() => {
      const k = ss(tt, EV.hitA + 0.12, EV.hitA + 0.6);
      const far = sand(ss(tt, EV.drop0, EV.drop1));
      return pt(lerp(mouth.x, far.x, k), lerp(mouth.y, far.y, k));
    })();
    const u1 = easeOut(clamp((tt - EV.jetA0) / (EV.hitA - EV.jetA0)) ** 0.85);
    const u0 = clamp((tt - (EV.drop1 - 0.25)) / 0.25);
    const splash = clamp((tt - EV.hitA) / 0.25) * (1 - ss(tt, EV.hitA + 0.4, EV.hitA + 0.9)) + 0.6 * clamp((tt - EV.hitA - 0.6) / 0.3) * (1 - ss(tt, EV.drop0, EV.drop1));
    return {from, dir: poreDirWorld(lz), to, u0, u1, w: JW * (1 - 0.55 * ss(tt, EV.hitA + 0.4, EV.drop1)), splash, t: tt};
  }
  if (t < EV.burst || t > EV.streamEnd + 0.4) return null;
  const lz = lizardAt(t);
  const c = coyoteAt(t);
  const s = clamp((t - EV.burst - 0.04) / (EV.hitB - EV.burst - 0.04));
  const k = 3.2;
  const u1 = (Math.exp(k * s) - 1) / (Math.exp(k) - 1);
  const u0 = clamp((t - EV.streamEnd) / 0.25) ** 1.4;
  const splash = clamp((t - EV.hitB) / 0.2) * (1 - ss(t, EV.streamEnd, EV.streamEnd + 0.4));
  return {from: poreWorld(lz), dir: poreDirWorld(lz), to: mouthWorld(c), u0, u1, w: JW, splash, t};
};
/** the coyote spits: a few drops of bloody saliva thrown from its mouth, falling to the sand */
export const spitAt = (t: number): {p: P; r: number}[] => {
  if (t < EV.spit || t > EV.spit + 0.7) return [];
  const c = coyoteAt(EV.spit + 0.05);
  const m = mouthWorld(c);
  return [0, 1, 2, 3, 4].map((i) => {
    const dt = t - EV.spit - i * 0.03;
    if (dt < 0) return null;
    const vx = -(40 + 18 * i), vy = -20 + 12 * i;
    const y = Math.min(0.2, m.y + vy * dt + 0.5 * 980 * dt * dt);
    return {p: pt(m.x + vx * Math.min(dt, 0.4), y), r: 0.35 - 0.05 * i};
  }).filter((d): d is {p: P; r: number} => !!d && t - EV.spit < 0.6);
};

// ---------------------------------------------------------------- the cross-section
const BEAT_SLOW = 0.5, BEAT_FAST = 0.34;
export const beatTimes: number[] = [];
for (let b = 3.2; b < 11; ) {
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
    const sq = ss(t, EV.sq0, EV.sq1);
    a += ((0.42 + 0.35 * beatAt(t)) / 100) * (1 - 0.55 * pressureAt(t));
    vv += (0.38 / 100) * (1 - sq);
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
const SECT = add(EYE0, pt(-0.85, 0.2));
const MOUTH_HIT = mouthWorld(hookCoyote(EV.hitA, 0));
const MID_A = add(EYE0, pt(4.6, -2.2));
/** the hook, relative to where the lizard stands (x0): charge, rush onto the eye, race along the jet, pull back */
const hookCam = (tau: number, x0: number): Cam => {
  const c = spline(tau, [
    [-1.3, 9, -15, 46], [-0.55, 7.5, -9, 24], [0.0, 6.8, -6.5, 17], [0.42, EYE0.x + 0.35, EYE0.y - 0.15, 2.7],
    [0.75, lerp(EYE0.x, MOUTH_HIT.x, 0.55), lerp(EYE0.y, MOUTH_HIT.y, 0.55) - 0.3, 7.5], [EV.hitA + 0.05, MOUTH_HIT.x - 1.2, MOUTH_HIT.y + 0.3, 11.5],
    [1.55, 15.5, -16, 40], [2.4, 18, -19, 48], [EV.drop0, 15, -14, 42], [3.35, EYE0.x + 2.4, EYE0.y - 0.6, 9],
    [EV.reveal1 - 0.1, SECT.x, SECT.y, 3.6], [EV.p0, SECT.x + 0.05, SECT.y, 3.45],
  ]);
  return {...c, x: c.x + x0};
};
const PORE_CAM = add(PORE0, pt(-0.2, 0.15));
const camSection = (t: number): Cam => spline(t, [[EV.p0, SECT.x + 0.05, SECT.y, 3.45], [EV.p1 - 0.2, PORE_CAM.x, PORE_CAM.y, 2.1], [EV.burst, PORE_CAM.x + 0.02, PORE_CAM.y, 2.05]]);
const camC = (t: number): Cam => {
  const j = jetAt(Math.min(t, EV.hitB));
  const front = j ? jetPoint(j, clamp(j.u1)) : PORE0;
  const d = Math.hypot(front.x - PORE0.x, front.y - PORE0.y);
  const two = ss(t, T.into - 0.6, EV.hitB + 0.2);
  const lz = lizardAt(t), m = mouthWorld(coyoteAt(Math.min(t, EV.hitB)));
  const c0 = lerp(PORE_CAM.x, lerp(PORE0.x, front.x, 0.5), ss(t, EV.burst, EV.burst + 0.5));
  const c1 = lerp(PORE_CAM.y, lerp(PORE0.y, front.y, 0.5), ss(t, EV.burst, EV.burst + 0.5));
  return {x: lerp(c0, lerp(lz.x, m.x, 0.5) + 1, two), y: lerp(c1, -8, two), w: 2.05 + 1.7 * d + 14 * two};
};
const smooth = (f: (t: number) => P, t: number, span = 0.5, n = 6) => {
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const q = f(t - (i / (n - 1)) * span);
    x += q.x; y += q.y;
  }
  return pt(x / n, y / n);
};
const camD = (t: number): Cam => spline(t, [
  [EV.hitB + 0.3, 13, -13, 36], [EV.jerk1 + 0.2, 19, -23, 56], [EV.back1, 25, -24, 64], [EV.spit, 24, -23, 64], [EV.run0 + 0.5, 20, -20, 60],
]);
const camE = (t: number): Cam => {
  const lx = runX(t);
  const s = ss5(t, EV.run0, EV.run1 + 0.4);
  return {x: lerp(20, lx - 4, ss5(t, EV.run0 + 0.2, EV.run0 + 2.0)), y: lerp(-20, -11, s), w: Math.exp(lerp(Math.log(60), Math.log(30), s))};
};
export const camAt = (t: number): Cam => {
  const tau = t - LOOP_T;
  let c: Cam;
  if (t < EV.p0) c = hookCam(t, 0);
  else if (t < EV.burst) c = camSection(t);
  else if (t < EV.hitB + 0.3) c = camC(t);
  else if (t < EV.hitB + 0.9) c = mixCam(camC(EV.hitB + 0.3), camD(t), ss5(t, EV.hitB + 0.3, EV.hitB + 0.9));
  else if (t < EV.run0 - 0.5) c = camD(t);
  else if (t < EV.run0 + 0.8) c = mixCam(camD(t), camE(t), ss5(t, EV.run0 - 0.5, EV.run0 + 0.8));
  else c = camE(t);
  if (tau > -1.9) c = mixCam(c, hookCam(tau, -DX), ss5(tau, -1.9, -1.15));
  const sh = 0.035 * Math.exp(-Math.max(0, t - EV.burst) / 0.15) * (t > EV.burst ? 1 : 0) + 0.02 * Math.exp(-Math.max(0, t - EV.hitB) / 0.2) * (t > EV.hitB ? 1 : 0)
    + 0.02 * Math.exp(-Math.max(0, t - EV.hitA) / 0.2) * (t > EV.hitA && t < 3 ? 1 : 0) + 0.01 * ss(t, EV.tremble0, EV.burst) * (t < EV.burst ? 1 : 0);
  return {x: c.x + sh * c.w * noise1(t * 40, 1), y: c.y + sh * c.w * noise1(t * 40, 2), w: c.w};
};
void nrm; void sub; void DUR;
