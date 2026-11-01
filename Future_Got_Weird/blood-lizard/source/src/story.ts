// The Blood Lizard timeline. Every beat is keyed to the measured narration (data/timeline.json via word()).
// One world (the desert floor, cm), one lizard, one coyote, one camera.
//
//   A  0.00-2.90  hook: the coyote's open mouth is already over the lizard; 0.35 a narrow jet leaves the rear corner of
//                 the lizard's eye and lands in the mouth by 0.50; 0.88 the coyote jerks back in disgust; from 0.90 the
//                 camera moves smoothly in on the eye
//   B  2.90-9.16  the skin thins away round the eye: eyeball, sinus, artery in, vein out with its muscle band.
//                 "When a predator attacks": the predator's shadow, a flinch, the muscle squeezes the vein shut and the
//                 outflow stops. "pressure builds": every heartbeat pushes more blood in; the sinus and the tiny vessels
//                 swell, the walls stretch thin and glossy, the cells crowd; a blister bulges toward the pore
//   C  9.16-12.9  "BURST": the blister tears; the jet leaves through the pore and the camera pulls out with it, out of
//                 the head (the skin closes back) to the coyote lunging in; a brief slow-motion accent as the stream hits
//                 the mouth; the jaws snap shut on the lizard's back half
//   D 12.9-17.6   the coyote lifts its head with the lizard, steps back, and its face fills with disgust ("disgusting");
//                 it shakes its head, then spits the lizard out ("spit"); the lizard drops to the ground; the coyote
//                 gags, tongue out, pawing at its muzzle
//   E 17.6-21.0   "Leaving it alive": the lizard scrambles away to the right; the camera follows and closes in; a muzzle
//                 comes in from the upper left; the lizard stops, raises its head, its lids swell: frame 0 again
import {P, add, mul, nrm, pt, rot, sub} from './core/geo';
import {DUR, FPS, FRAMES, clamp, easeOut, hash, keyS, lerp, noise1, ring, ss, ss5, word} from './lib';
import {LizardState, backWorld, eyeWorld, headToWorld, poreDirWorld, poreWorld} from './art/lizard';
import {CoyoteHead, CoyoteState, HEAD_K, coyoteHeadWorld, mouthTarget} from './art/coyote';
import {RUPTURE_A, SinusState} from './art/sinus';
import {JetState, jetPoint} from './art/jet';
import {EYE_L, EYE_R} from './art/lizard';

const w = word;
export const T = {
  lizard: w('lizard').start, shoot: w('SHOOT').start, eyesEnd: w('eyes!').end,
  when: w('When').start, attacks: w('attacks').start, pressure: w('pressure').start, builds: w('builds').start, tiny: w('tiny').start,
  until: w('Until').start, burst: w('BURST').start, launching: w('launching').start, into: w('into').start, mouth: w('mouth!').start, mouthEnd: w('mouth!').end,
  and: w('And').start, tastes: w('tastes').start, disgusting: w('disgusting').start, disgustingEnd: w('disgusting').end,
  spit: w('spit').start, out: w('out', 1).start, leaving: w('Leaving').start, alive: w('alive').start, same: w('same').start, again: w('again.').start, againEnd: w('again.').end,
};
export const LOOP_T = FRAMES / FPS;

// ---------------------------------------------------------------- the visual clock (slow motion at the impact only)
const SLOW0 = T.mouth - 0.36, SLOW1 = T.mouth + 0.3, SLOWK = 0.74;
const bump = (t: number) => ss(t, SLOW0, SLOW0 + 0.14) * (1 - ss(t, SLOW1 - 0.16, SLOW1));
const VDT = 1 / 600;
const VT: number[] = [0];
for (let i = 1; i <= Math.ceil((DUR + 2) / VDT); i++) VT.push(VT[i - 1] + VDT * (1 - SLOWK * bump((i - 0.5) * VDT)));
/** visual time for real time t */
export const vOf = (t: number) => {
  if (t <= 0) return t;
  const x = t / VDT, i = Math.min(VT.length - 2, Math.floor(x));
  return VT[i] + (VT[i + 1] - VT[i]) * (x - i);
};
/** how fast the picture runs (1 normal, < 1 slow motion) */
export const speedAt = (t: number) => 1 - SLOWK * bump(t);
const V = vOf;
export const DELAY = DUR + 1 - vOf(DUR + 1);

// event times in visual time
export const EV = {
  jetA0: 0.35, jetAHit: 0.5, jetAEnd: 0.8, recoil0: 0.88, recoil1: 1.45, push0: 0.9,
  reveal0: 2.7, reveal1: 3.55, shadow0: T.when - 0.05, flinch: T.when + 0.12, sq0: T.when + 0.36, sq1: T.attacks + 0.25,
  p0: T.pressure, p1: T.until + 0.2, tremble0: T.until, burst: T.burst + 0.02,
  revealOut0: T.burst + 0.42, revealOut1: T.launching + 0.55, lunge0: T.into - 0.7,
  imp: V(T.mouth - 0.1), bite: V(T.mouth + 0.2), streamEnd: V(T.mouth - 0.02),
  lift0: V(T.mouthEnd + 0.05), lift1: V(T.tastes + 0.25), walk0: V(T.and), walk1: V(T.disgustingEnd + 0.3),
  grim0: V(T.tastes), grim1: V(T.disgusting + 0.3), shake0: V(T.disgustingEnd + 0.1), shake1: V(T.spit - 0.05),
  spit: V(T.spit + 0.1), gag0: V(T.spit + 0.35), paw0: V(T.out - 0.1), paw1: V(T.leaving + 0.2),
  run0: V(T.leaving - 0.02), run1: V(T.againEnd + 0.06), c2: V(19.55),
};
const runEnd = EV.run1;

// ---------------------------------------------------------------- the lizard
const L0: LizardState = {x: 0, y: 0, rot: 0, head: -0.32, puff: 0.5, gait: 0, run: 0, dangle: 0, flinch: 0, eye: {look: -0.3, blink: 0, bulge: 0, blood: 0, wet: 0}, t: 0};
export const EYE0 = eyeWorld(L0);
export const PORE0 = poreWorld(L0);
/** the lizard in the hook (tau = film time, or film time minus the loop length at the end) */
const hookLizard = (tau: number): LizardState => {
  const head = lerp(-0.04, -0.32, ss(tau, -0.95, -0.25)) - 0.03 * Math.sin(Math.PI * clamp((tau - 0.33) / 0.3));
  const puff = lerp(0.1, 0.5, ss(tau, -0.9, -0.2));
  const bulge = 0.75 * ss(tau, -0.8, 0.25) * (1 - 0.65 * ss(tau, 0.36, 0.7));
  const blood = 0.8 * ss(tau, 0.55, 1.3);
  const wet = ss(tau, 0.3, 0.37) * (1 - 0.5 * ss(tau, 0.9, 1.6));
  return {...L0, head, puff, eye: {look: -0.6 * ss(tau, -0.6, 0), blink: blinkAt(tau, [1.25, 2.4]), bulge, blood, wet}, t: tau};
};
const blinkAt = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => Math.max(0, 1 - Math.abs(t - b) / 0.07)));

// held, dropped, running
let biteRel: {p: P; a: number} | null = null;
const coyHeadFrame = (v: number) => {
  const c = coyoteAtV(v);
  return {o: coyoteHeadWorld(c, pt(0, 0)), a: c.ang};
};
const heldPose = (v: number) => {
  if (!biteRel) {
    const f = coyHeadFrame(EV.bite);
    const lz = groundLizard(EV.bite);
    biteRel = {p: rot(sub(pt(lz.x, lz.y), f.o), -f.a), a: lz.rot - f.a};
  }
  const f = coyHeadFrame(v);
  return {p: add(f.o, rot(biteRel.p, f.a)), a: f.a + biteRel.a};
};
const groundLizard = (v: number): LizardState => {
  const base = hookLizard(Math.min(v, 2.6));
  const fl = Math.max(0, ring(v, EV.flinch, 3.5, 0.18)) + 0.6 * Math.exp(-Math.max(0, v - EV.flinch) / 0.15) * (v > EV.flinch ? 1 : 0);
  const bulge = v < EV.reveal1 ? base.eye.bulge : v < EV.revealOut1 ? 0.6 : lerp(0.55, 0.3, ss(v, EV.revealOut1, EV.imp));
  const wet = v < EV.burst ? base.eye.wet : 1;
  const blood = v < EV.burst ? base.eye.blood : Math.max(base.eye.blood, ss(v, EV.burst + 0.2, EV.burst + 1.6));
  return {...base, head: base.head + 0.05 * Math.sin(Math.PI * clamp((v - EV.flinch) / 0.25)), flinch: clamp(fl), eye: {...base.eye, bulge, wet, blood, look: -0.6}, t: v};
};
const SPIT_THROW = pt(26, -40);
const G = 980;
const fallAt = (v: number) => {
  const h0 = heldPose(EV.spit), h1 = heldPose(EV.spit + 0.02);
  const vel = add(mul(sub(h1.p, h0.p), 1 / 0.02), SPIT_THROW);
  // solve the landing: y(t) = y0 + vy t + G t^2 / 2 = 0
  const tl = (-vel.y + Math.sqrt(vel.y * vel.y - 2 * G * h0.p.y)) / G;
  const dt = Math.min(v - EV.spit, tl);
  return {p: pt(h0.p.x + vel.x * dt, h0.p.y + vel.y * dt + 0.5 * G * dt * dt), a: lerp(h0.a, 0, ss(dt / tl, 0, 1)), land: EV.spit + tl, x: h0.p.x + vel.x * tl};
};
let landMemo: ReturnType<typeof fallAt> | null = null;
export const LAND = () => landMemo ?? (landMemo = fallAt(EV.spit + 1));
const STRIDE = 2.4;
const runX = (v: number) => {
  const xl = LAND().x;
  return lerp(xl + 1.2 * ss(v, LAND().land, LAND().land + 0.25), 0, ss5(v, EV.run0, runEnd));
};
export const lizardAt = (t: number): LizardState => {
  const v = vOf(t);
  const tau = t - LOOP_T;
  if (v < EV.bite) return groundLizard(v);
  if (v < EV.spit) {
    const h = heldPose(v);
    const g = groundLizard(v);
    return {...g, x: h.p.x, y: h.p.y, rot: h.a, dangle: ss(v, EV.bite, EV.bite + 0.25), head: -0.1 + 0.15 * Math.sin(v * 7), puff: 0.7,
      eye: {...g.eye, blink: blinkAt(v, [EV.grim0 + 0.3, EV.shake0 + 0.4]), look: 0.2}, t: v};
  }
  const lz = LAND();
  if (v < lz.land) {
    const f = fallAt(v);
    return {...groundLizard(v), x: f.p.x, y: f.p.y, rot: f.a, dangle: 1 - 0.6 * ss(v, EV.spit, lz.land), head: -0.1, puff: 0.6, t: v};
  }
  // on the ground again: the landing squash, a shake of the head, then the scramble
  const x = runX(v);
  const sp = (runX(v + 0.01) - runX(v - 0.01)) / 0.02;
  const run = clamp(sp / 9);
  const landK = Math.max(0, ring(v, lz.land, 3, 0.16));
  const base: LizardState = {
    ...L0, x, y: 0, rot: 0.04 * Math.sin(Math.PI * clamp((v - lz.land) / 0.2)),
    head: -0.06 + 0.06 * Math.sin(Math.PI * 2 * 3 * clamp((v - lz.land - 0.35) / 0.5)) * (v > lz.land + 0.35 && v < lz.land + 0.85 ? 1 : 0),
    puff: lerp(0.6, 0.12, ss(v, lz.land, EV.run0)), gait: (x - lz.x) / STRIDE, run, dangle: 0, flinch: clamp(landK + 0.8 * Math.exp(-(v - lz.land) / 0.08)),
    eye: {look: 0.2, blink: blinkAt(v, [lz.land + 0.05, EV.run0 + 1.2]), bulge: lerp(0.3, 0, ss(v, lz.land, EV.run0 + 1)), blood: 1 - ss(v, EV.run0 + 0.6, EV.run0 + 1.8), wet: 1 - ss(v, lz.land, EV.run0 + 1.2)}, t: v,
  };
  if (tau > -1.0) {
    // the end of the run settles into the hook's state (its head rises, the lids swell), continuous into frame 0
    const h = hookLizard(tau);
    const k = ss(tau, -1.0, -0.75);
    return {...h, x: base.x, gait: base.gait, run: base.run, head: lerp(base.head, h.head, k), puff: lerp(base.puff, h.puff, k),
      eye: {...h.eye, blood: lerp(base.eye.blood, h.eye.blood, k), wet: lerp(base.eye.wet, h.eye.wet, k), look: lerp(base.eye.look, h.eye.look, k)}};
  }
  return base;
};

// ---------------------------------------------------------------- the coyote
const ATK: CoyoteHead = {jaw: 0.32, ears: 0, squint: 0, lip: 0.4, wrinkle: 0.45, tongue: 0, blood: 0, look: 0.7, shake: 0};
const M_A = add(EYE0, pt(-6.6, -5.0));   // the mouth, inches from the lizard's head
const ANG_A = 0.4;
const CROUCH = 12;
const JL_X = 16;
const jFromMouth = (M: P, ang: number, jaw: number) => sub(M, rot(mul(mouthTarget(jaw), HEAD_K), ang));
const BODY0 = jFromMouth(M_A, ANG_A, ATK.jaw).x - JL_X;
/** a coyote whose mouth is at M (world) with pitch ang */
const mouthCoyote = (M: P, ang: number, hd: CoyoteHead, bodyX: number, t: number, crouch = CROUCH): CoyoteState => {
  const J = jFromMouth(M, ang, hd.jaw);
  return {x: bodyX, y: 0, J: pt(J.x - bodyX, J.y - crouch), ang, hd, crouch, walk: 0, stride: 0, paw: 0, t};
};
const mixHead = (a: CoyoteHead, b: CoyoteHead, u: number): CoyoteHead => {
  const o: any = {};
  for (const k of Object.keys(a)) o[k] = lerp((a as any)[k], (b as any)[k], u);
  return o;
};
const hookCoyote = (tau: number): CoyoteState => {
  const q = clamp((tau + 1.5) / 1.8);
  const off = mul(pt(-24, -22), (1 - q) ** 3);
  const jolt = Math.max(0, ring(tau, EV.jetAHit, 2.5, 0.12)) * 0.6;
  const rc = ss5(tau, EV.recoil0, EV.recoil1);
  const M = add(add(add(M_A, off), mul(pt(-0.7, -0.6), jolt + 0.4 * ss(tau, -0.2, 0.4))), mul(pt(-4.5, -7), rc));
  const disgust: CoyoteHead = {jaw: 0.3, ears: 0.85, squint: 0.75, lip: 0.7, wrinkle: 1, tongue: 0.25, blood: 0.45, look: 0.2, shake: 0};
  const hd = mixHead({...ATK, jaw: ATK.jaw + 0.04 * Math.sin(tau * 9) + 0.06 * ss(tau, -0.3, 0.3), blood: 0.5 * ss(tau, EV.jetAHit, EV.jetAHit + 0.1)}, disgust, ss(tau, EV.jetAHit + 0.25, EV.recoil1));
  return mouthCoyote(M, ANG_A - 0.35 * rc, hd, BODY0, tau);
};
/** while the camera is inside the head the coyote comes back and hangs over the lizard */
const M_HOVER = add(M_A, pt(-1.4, -2.6));
const M_C = add(M_A, pt(-0.2, -0.1));
const BITE_AT = () => add(backWorld(L0, -1.2), pt(0, -0.2));
const coyoteAtV = (v: number): CoyoteState => {
  if (v < 2.6) return hookCoyote(v);
  const attack = ss5(v, EV.shadow0 - 0.25, EV.sq1);
  const lunge = ss5(v, V(EV.lunge0), EV.imp);
  const breath = pt(0.3 * Math.sin(v * 2.1), 0.25 * Math.sin(v * 2.9));
  const hdIdle: CoyoteHead = {...ATK, ears: 0.2, lip: 0.5, blood: 0.35, jaw: 0.5 + 0.05 * Math.sin(v * 3.1)};
  const back = hookCoyote(2.6);
  if (v < EV.imp) {
    const M = add(lerpP(lerpP(coyoteHeadMouth(back), M_HOVER, attack), M_C, lunge), mul(breath, 1 - lunge));
    const hd = mixHead(mixHead(back.hd, hdIdle, attack), {...ATK, jaw: 0.42, blood: 0.35, lip: 0.6}, lunge);
    return mouthCoyote(M, lerp(lerp(back.ang, ANG_A, attack), ANG_A + 0.05, lunge), hd, BODY0, v);
  }
  // impact -> bite: the jaws come down on the lizard's back half
  const hit: CoyoteHead = {...ATK, jaw: 0.42, blood: 0.35 + 0.55 * ss(v, EV.imp, EV.imp + 0.08), squint: 0.55 * ss(v, EV.imp, EV.imp + 0.05), lip: 0.6, ears: 0.3 * ss(v, EV.imp, EV.bite)};
  const bk = ss5(v, EV.imp + 0.04, EV.bite);
  if (v < EV.bite + 0.001) {
    const M = lerpP(M_C, BITE_AT(), bk);
    return mouthCoyote(M, lerp(ANG_A + 0.05, 0.36, bk), {...hit, jaw: lerp(0.42, 0.2, ss(v, EV.bite - 0.07, EV.bite)) + 0.18 * Math.sin(Math.PI * clamp((v - EV.imp - 0.02) / (EV.bite - EV.imp - 0.06)))}, BODY0, v);
  }
  return heldCoyote(v);
};
const coyoteHeadMouth = (c: CoyoteState) => coyoteHeadWorld(c, mouthTarget(c.hd.jaw));
const lerpP = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
let biteC: CoyoteState | null = null;
const BACK_DX = -36;
const heldCoyote = (v: number): CoyoteState => {
  if (!biteC) {
    const M = BITE_AT();
    biteC = mouthCoyote(M, 0.36, {...ATK, jaw: 0.2}, BODY0, EV.bite);
  }
  const J0 = biteC.J;
  // body: two steps back while the head comes up with the lizard
  const bx = BODY0 + BACK_DX * ss(v, EV.walk0, EV.walk1);
  const walk = (BACK_DX * ss(v, EV.walk0, EV.walk1)) / 18;
  const stride = 18 * Math.sin(Math.PI * clamp((v - EV.walk0) / (EV.walk1 - EV.walk0)));
  const crouch = lerp(CROUCH, 3, ss(v, EV.lift0, EV.lift1)) + 6 * ss(v, EV.gag0, EV.gag0 + 0.4);
  const jx = keyS(v, [[EV.bite, J0.x], [EV.lift1, 19], [EV.spit - 0.15, 20], [EV.spit + 0.1, 17], [EV.gag0 + 0.4, 21]]);
  const jy0 = keyS(v, [[EV.bite, J0.y], [EV.lift1, -34], [EV.spit - 0.15, -35], [EV.spit + 0.1, -41], [EV.gag0 + 0.4, -22]]);
  const shake = Math.sin(2 * Math.PI * 3.2 * (v - EV.shake0)) * ss(v, EV.shake0, EV.shake0 + 0.12) * (1 - ss(v, EV.shake1 - 0.15, EV.shake1));
  const gag = ss(v, EV.gag0, EV.gag0 + 0.2);
  const ang = keyS(v, [[EV.bite, 0.36], [EV.lift1, 0.12], [EV.spit - 0.15, 0.1], [EV.spit + 0.1, -0.2], [EV.gag0 + 0.4, 0.55]]) + 0.06 * Math.sin(v * 5) * gag + 0.05 * shake;
  const grim = ss(v, EV.grim0, EV.grim1);
  const hd: CoyoteHead = {
    jaw: v < EV.spit - 0.08 ? 0.2 + 0.03 * Math.sin(v * 13) * grim : lerp(0.2, 0.85, ss(v, EV.spit - 0.08, EV.spit + 0.05)) - 0.35 * gag + 0.18 * gag * Math.sin(2 * Math.PI * 3.4 * (v - EV.gag0)),
    ears: lerp(0.3, 1, grim), squint: lerp(0.55, 0.95, grim), lip: lerp(0.6, 0.95, grim), wrinkle: lerp(0.5, 1, grim),
    tongue: ss(v, EV.spit, EV.gag0 + 0.2) * (0.85 + 0.15 * Math.sin(v * 7)), blood: 0.9 - 0.2 * gag, look: 0.2 - 0.5 * gag, shake,
  };
  const paw = 0 * ss(v, EV.paw0, EV.paw0 + 0.25) * (1 - ss(v, EV.paw1 - 0.25, EV.paw1)) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 2.5 * (v - EV.paw0)));
  return {x: bx, y: 0, J: pt(jx, jy0), ang, hd, crouch, walk, stride, paw, t: v};
};
export const coyoteAt = (t: number): CoyoteState => {
  const v = vOf(t);
  const tau = t - LOOP_T;
  if (v >= EV.c2) return hookCoyote(tau); // the next attacker, coming in from the upper left
  return coyoteAtV(v);
};
/** is the lizard inside the coyote's mouth? */
export const heldAt = (t: number) => {
  const v = vOf(t);
  return v >= EV.bite && v < EV.spit;
};

// ---------------------------------------------------------------- the jets
const JW = 0.27;
export const jetAt = (t: number): JetState | null => {
  const v = vOf(t);
  const tau = t - LOOP_T;
  if (v < 3 || tau > -1) {
    const tt = v < 3 ? v : tau;
    if (tt < EV.jetA0 || tt > 1.4) return null;
    const lz = hookLizard(tt);
    const c = hookCoyote(tt);
    const u1 = easeOut((tt - EV.jetA0) / (EV.jetAHit - EV.jetA0));
    const u0 = clamp((tt - EV.jetAEnd) / 0.14) ** 1.5;
    const splash = clamp((tt - EV.jetAHit) / 0.3) * (1 - ss(tt, 0.98, 1.3));
    return {from: poreWorld(lz), dir: poreDirWorld(lz), to: coyoteHeadMouth(c), u0, u1, w: JW, splash, t: tt};
  }
  if (v < EV.burst || v > EV.streamEnd + 0.6) return null;
  const lz = lizardAt(t);
  const c = coyoteAt(t);
  const s = clamp((v - EV.burst - 0.04) / (EV.imp - EV.burst - 0.04));
  const k = 3.4;
  const u1 = (Math.exp(k * s) - 1) / (Math.exp(k) - 1);
  const u0 = clamp((v - EV.streamEnd) / 0.07) ** 1.4;
  const splash = clamp((v - EV.imp) / 0.08) * (1 - ss(v, EV.imp + 0.06, EV.bite));
  return {from: poreWorld(lz), dir: poreDirWorld(lz), to: coyoteHeadMouth(c), u0, u1, w: JW * (1 + 0.15 * ss(v, EV.burst, EV.burst + 0.3)), splash, t: v};
};

// ---------------------------------------------------------------- inside the head
const BEAT0 = 2.2, BEAT_SLOW = 0.5, BEAT_FAST = 0.34;
export const beatTimes: number[] = [];
for (let b = BEAT0; b < 14; ) {
  beatTimes.push(b);
  b += b < EV.p0 - 0.2 ? BEAT_SLOW : BEAT_FAST;
}
const beatAt = (v: number) => {
  let last = -10;
  for (const b of beatTimes) if (b <= v) last = b;
  return Math.exp(-(v - last) / 0.11);
};
const pressureAt = (v: number) => {
  if (v < EV.p0) return 0;
  const n = (EV.p1 - EV.p0) / BEAT_FAST;
  const c = (v - EV.p0) / BEAT_FAST;
  return clamp((Math.floor(c) + ss(c - Math.floor(c), 0, 0.4)) / n);
};
// flow phases: integrate the speeds
const PH: {a: number; v: number}[] = [];
{
  let a = 0, vv = 0;
  for (let i = 0; i <= 1400; i++) {
    const t = i / 100;
    PH.push({a, v: vv});
    const sq = ss(t, EV.sq0, EV.sq1) * (1 - ss(t, EV.burst + 0.6, EV.burst + 1.6));
    a += (0.42 + 0.35 * beatAt(t)) / 100 * (1 - 0.55 * pressureAt(t));
    vv += 0.38 / 100 * (1 - sq);
  }
}
export const sinusAt = (t: number): SinusState => {
  const v = vOf(t);
  const i = clamp(v * 100, 0, 1399), i0 = Math.floor(i), f = i - i0;
  const ph = {a: lerp(PH[i0].a, PH[i0 + 1].a, f), v: lerp(PH[i0].v, PH[i0 + 1].v, f)};
  return {
    reveal: ss(v, EV.reveal0, EV.reveal1) * (1 - ss(v, EV.revealOut0, EV.revealOut1)),
    squeeze: ss(v, EV.sq0, EV.sq1) * (1 - ss(v, EV.burst + 0.6, EV.burst + 1.6)),
    p: pressureAt(v), beat: beatAt(v), aPhase: ph.a, vPhase: ph.v, burst: v >= EV.burst ? v - EV.burst : -1,
    shadow: ss(v, EV.shadow0, EV.shadow0 + 0.35) * (1 - ss(v, EV.revealOut0, EV.revealOut1)) * (0.75 + 0.25 * Math.sin(v * 2)), t: v,
  };
};
export const revealAt = (t: number) => sinusAt(t).reveal;

// ---------------------------------------------------------------- the camera
export type Cam = {x: number; y: number; w: number};
const HOOK = {x: -2.4, y: -6.4, w: 14.6};
const hookCam = (tau: number): Cam => ({x: HOOK.x + 0.16 * tau, y: HOOK.y + 0.05 * tau, w: HOOK.w * Math.exp(-0.02 * tau)});
const insideC = headToWorld(L0, pt(0.15, 0.2));
const ruptW = headToWorld(L0, add(EYE_L, pt(Math.cos(RUPTURE_A) * EYE_R * 1.5, Math.sin(RUPTURE_A) * EYE_R * 1.5)));
type K = [number, number, number, number]; // t, x, y, w
/** Catmull-Rom through keys in (x, y, log w); the first and last keys may carry fixed velocities */
const spline = (t: number, keys: K[], v0?: [number, number, number], v1?: [number, number, number]): Cam => {
  const n = keys.length;
  const val = (k: K) => [k[1], k[2], Math.log(k[3])];
  if (t <= keys[0][0]) return {x: keys[0][1], y: keys[0][2], w: keys[0][3]};
  if (t >= keys[n - 1][0]) return {x: keys[n - 1][1], y: keys[n - 1][2], w: keys[n - 1][3]};
  let i = 0;
  while (keys[i + 1][0] < t) i++;
  const tan = (j: number) => {
    if (j === 0 && v0) return v0;
    if (j === n - 1 && v1) return v1;
    if (j === 0 || j === n - 1) return [0, 0, 0];
    const a = val(keys[j - 1]), b = val(keys[j + 1]);
    const dt = keys[j + 1][0] - keys[j - 1][0];
    return a.map((x, m) => (b[m] - x) / dt);
  };
  const t0 = keys[i][0], t1 = keys[i + 1][0], h = t1 - t0, u = (t - t0) / h;
  const p0 = val(keys[i]), p1 = val(keys[i + 1]), m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const r = p0.map((_, m) => h00 * p0[m] + h10 * h * m0[m] + h01 * p1[m] + h11 * h * m1[m]);
  return {x: r[0], y: r[1], w: Math.exp(r[2])};
};
const camAB = (v: number): Cam => {
  if (v <= EV.push0) return hookCam(v);
  const h = hookCam(EV.push0);
  const hv: [number, number, number] = [0.22, 0.08, -0.02];
  return spline(v, [
    [EV.push0, h.x, h.y, h.w],
    [1.9, EYE0.x - 0.9, EYE0.y - 0.6, 8.5],
    [EV.reveal1 - 0.2, insideC.x, insideC.y, 3.25],
    [EV.p0, insideC.x + 0.05, insideC.y + 0.02, 3.0],
    [EV.p1 - 0.3, ruptW.x + 0.12, ruptW.y + 0.22, 1.8],
    [EV.burst, PORE0.x + 0.02, PORE0.y + 0.05, 1.7],
  ], hv);
};
const camC = (v: number): Cam => {
  const j = jetAt(tOfV(Math.min(v, EV.imp)));
  const pore = PORE0;
  const front = j ? jetPoint(j, clamp(j.u1)) : pore;
  const mouth = coyoteHeadMouth(coyoteAtV(Math.min(v, EV.imp)));
  const d = Math.hypot(front.x - pore.x, front.y - pore.y);
  const two = ss(v, V(T.into - 0.3), EV.imp);
  const c = lerpP(lerpP(add(pore, pt(0.02, 0.05)), front, 0.5), add(lerpP(pore, mouth, 0.58), pt(-0.3, -0.4)), two);
  return {x: c.x, y: c.y, w: 1.7 + 1.55 * d + 1.2 * two};
};
// real time of a visual time (inverse of vOf, by search)
export const tOfV = (v: number) => {
  if (v <= SLOW0 - 0.05) return v;
  if (v >= vOf(SLOW1 + 0.05)) return v + DELAY;
  let a = SLOW0 - 0.1, b = SLOW1 + 0.1;
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (vOf(m) < v) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
const followD = (v: number): Cam => {
  // a low-passed point between the held lizard and the coyote's eye, widening to show the coyote
  let x = 0, y = 0;
  const N = 6;
  for (let i = 0; i < N; i++) {
    const vv = v - (i / N) * 0.45;
    const lz = lizardAt(tOfV(vv));
    const c = coyoteAtV(Math.max(EV.bite + 0.001, vv));
    const e = coyoteHeadWorld(c, pt(2, -4));
    x += lerp(lz.x, e.x, 0.62);
    y += lerp(lz.y, e.y, 0.5);
  }
  const wv = keyS(v, [[EV.bite, 18], [EV.lift1, 29], [EV.spit, 32], [EV.gag0 + 0.6, 36]]);
  return {x: x / N + 0.5, y: y / N + 2.5 + 0.08 * (wv - 18), w: wv};
};
const followE = (v: number): Cam => {
  const lx = runX(v);
  const s = ss5(v, EV.run0 - 0.3, runEnd + 0.2);
  return {x: lerp(LAND().x - 5, lx + HOOK.x, ss5(v, EV.run0 - 0.4, EV.run0 + 0.9)), y: lerp(-10, HOOK.y, s), w: 36 * Math.pow(HOOK.w / 36, s)};
};
const mixCam = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), u))});
export const camAt = (t: number): Cam => {
  const v = vOf(t);
  const tau = t - LOOP_T;
  let c: Cam;
  if (v < EV.burst) c = camAB(v);
  else if (v < EV.bite) c = camC(v);
  else if (v < EV.bite + 0.6) c = mixCam(camC(Math.min(v, EV.bite + 0.6)), followD(v), ss5(v, EV.bite, EV.bite + 0.6));
  else if (v < EV.run0 - 0.6) c = followD(v);
  else if (v < EV.run0 + 0.5) c = mixCam(followD(v), followE(v), ss5(v, EV.run0 - 0.6, EV.run0 + 0.5));
  else c = followE(v);
  if (tau > -1.3) c = mixCam(c, hookCam(tau), ss5(tau, -1.3, -0.35));
  // small camera shakes: the rupture, the impact, the landing
  const sh = 0.05 * Math.exp(-Math.max(0, v - EV.burst) / 0.15) * (v > EV.burst ? 1 : 0) + 0.025 * Math.exp(-Math.max(0, v - EV.imp) / 0.2) * (v > EV.imp ? 1 : 0) +
    0.012 * ss(v, EV.tremble0, EV.burst) * (v < EV.burst ? 1 : 0);
  return {x: c.x + sh * c.w * noise1(t * 40, 1), y: c.y + sh * c.w * noise1(t * 40, 2), w: c.w};
};
/** the coyote's head shadow on the ground (lower right of the head: the sun is upper left) */
export const SUN = nrm(pt(0.55, 1));
void hash;
