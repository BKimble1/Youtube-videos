// The film's timeline: every beat keyed to the measured narration (data/timeline.json via word()), the states of
// both snails, the bird and the dropping at time t, and the camera.
//
//   0.00-4.6   HOOK  snail A, extreme close-up: one eyestalk swells, rings show, it pulses; the second follows; the
//                    bird's shadow crosses; the camera pushes in until the pulsing stalk fills the frame ("moving bait")
//   4.4-5.0    DIVE  through the sac wall into the packed larvae, dissolving into a fluke egg in a dropping
//   5.0-7.9    snail B eats the egg; the glassy body shows the larva hatch and the sporocyst grow toward the head and
//                    fill both eyestalks ("grows through its body ... fills its eyestalks")
//   7.9-12.3   outside: the pulsing, colourful stalks; a real caterpillar on the twig behind pulses the same way
//   12.3-15.2  the snail rises into the light, the stalks at full strength; a bird lands on the twig beside it
//   15.2-17.4  the bird looks, pecks once and tears off one swollen stalk
//   17.4-19.3  it swallows; its glassy body shows the sac going down the gut
//   19.3-21.4  in the cloaca the larvae become adult flukes, and their eggs stream toward the vent
//   21.4-22.6  a dropping falls onto the leaf below, beside snail A
//   22.6-24.87 the camera pushes back into snail A's eyestalk: the last frame is the first
import {P, pt} from './core/geo';
import {DUR, clamp, lerp, ss, ss5, word} from './lib';
import {SnailState, StalkParams} from './art/snail';
import {stalkGeom} from './art/stalk';
import {BirdState, birdPoints, HEAD_REST} from './art/bird';
import {LeafSpec} from './art/env';
import {along, GUT_BIRD} from './art/micro';

// ---------------------------------------------------------------- beats from the narration
const w = word;
export const T = {
  bait0: w('moving').start,
  baitEnd: w('bait').end,
  worm: w('worm').start,
  grows: w('grows').start,
  body: w('body').start,
  fills: w('fills').start,
  eyestalks: w('eyestalks').start,
  pulsing: w('pulsing').start,
  sacsEnd: w('sacs').end,
  they: w('they').start,
  tiny: w('tiny').start,
  cats: w('caterpillars').start,
  catsEnd: w('caterpillars').end,
  and: w('and', 1).start,
  wants: w('wants').start,
  because: w('because').start,
  bird: w('bird').start,
  spots: w('spots').start,
  eats: w('eats').start,
  par3: w('parasite', 2).start,
  inside2: w('inside', 1).start,
  birdEnd: w('bird', 1).end,
  then: w('then').start,
  eggs: w('eggs').start,
  spread: w('spread').start,
  droppings: w('droppings').start,
  ready: w('ready').start,
  another: w('another').start,
  snailEnd: w('snail', 1).end,
};
// derived event times
export const EV = {
  shadow0: 2.1,
  shadow1: 3.05,
  dive0: T.baitEnd - 0.22,
  swap: 4.93,
  rasp0: 5.12,
  swallowEgg: 5.45,
  xray0: 5.55,
  hatch: 5.86,
  grow0: 6.0,
  fill0: T.fills + 0.15,
  xrayOut: T.pulsing - 0.25,
  land0: 13.2,
  land1: 14.0,
  cock: T.wants - 0.05,
  tilt: T.spots,
  lunge: T.eats - 0.12,
  peck: T.eats + 0.16,
  yank: T.eats + 0.22,
  swallow: T.par3 + 0.1,
  birdX: T.par3 + 0.45,
  burst: 19.5,
  release: 21.55,
  landDrop: 22.5,
};

// ---------------------------------------------------------------- the set
export const LEAF_B: LeafSpec = {x0: -34, x1: 17, y: 0, far: 2.2, near: 3.2, tilt: 0, hue: '#4E8A2E', seed: 4};
export const LEAF_A: LeafSpec = {x0: 8, x1: 80, y: 40, far: 2.4, near: 3.4, tilt: -0.004, hue: '#58913A', seed: 9};
export const TWIG_BIRD: P[] = [pt(13, -2.4), pt(30, -3.2), pt(52, -4.6), pt(90, -7)];
export const TWIG_CAT: P[] = [pt(-48, -14.2), pt(-26, -14.5), pt(-4, -13.9)];
export const STEM_B: P[] = [pt(-34, 0.6), pt(-40, 6), pt(-44, 30), pt(-46, 90)];
export const STEM_A: P[] = [pt(8, 40.6), pt(2, 46), pt(-2, 70), pt(-4, 130)];
export const DROP_B = pt(4.1, -0.15);
export const EGG_B = pt(2.15, -0.42);
export const CAT_DELTA = 6;

// ---------------------------------------------------------------- snail A (hook and loop)
const NEAR0 = {ang: -1.12, bend: 0.24, Ln: 4.6, Ls: 7.8, rn: 0.4, rmax: 1.35};
const FAR0 = {ang: -1.42, bend: 0.18, Ln: 4.4, Ls: 7.0, rn: 0.38, rmax: 1.2};
export const XA0 = 35.5;
export const xA = (t: number) => (t < 12 ? XA0 + 0.42 * t : XA0 - 0.42 * (DUR - t));
export const snailA = (t: number): SnailState => {
  const hook = t < 12;
  const near: StalkParams = hook
    ? {...NEAR0, S: ss(t, -0.3, 0.95), band: ss(t, 0.18, 0.62), pulse: ss(t, 0.62, 1.2) * (1 + 0.2 * ss(t, 2.8, 3.8)), vivid: 0.35 * ss(t, 2.5, 4)}
    : {...NEAR0, S: 0, band: 0, pulse: 0};
  const far: StalkParams = hook
    ? {...FAR0, S: ss(t, 1.3, 2.25), band: ss(t, 1.45, 2.1), pulse: ss(t, 1.8, 2.35), phase: 1.9}
    : {...FAR0, S: 0, band: 0, pulse: 0};
  // the loop: identical crawl phase at t = 0 and t = DUR
  return {o: pt(xA(t), 40), k: 1, t: hook ? t : t - DUR, crawl: xA(t) - XA0, lift: 0.05 + 0.02 * Math.sin((2 * Math.PI * t) / (DUR / 12)), near, far};
};

// ---------------------------------------------------------------- snail B (infection, lure, the peck)
export const snailB = (t: number): SnailState => {
  const pulse = 0.85 * ss(t, T.pulsing, T.pulsing + 0.5) + 0.2 * ss(t, T.they, T.tiny) + 0.18 * ss(t, T.and, T.and + 0.7);
  const wound = ss(t, EV.peck, EV.peck + 0.1);
  const near: StalkParams = {...NEAR0, S: ss(t, EV.fill0, EV.fill0 + 0.85), band: ss(t, EV.fill0 + 0.05, EV.fill0 + 0.7) * (1 - wound), pulse: pulse * (1 - wound), vivid: ss(t, T.they, T.cats), wound, retract: 0.45 * ss(t, EV.peck + 0.05, EV.peck + 0.5), xray: 0};
  const far: StalkParams = {...FAR0, S: ss(t, EV.fill0 + 0.3, EV.fill0 + 1.1), band: ss(t, EV.fill0 + 0.35, EV.fill0 + 1.0), pulse: pulse * (1 - 0.5 * ss(t, EV.peck, EV.peck + 0.4)), phase: 1.9, vivid: ss(t, T.they, T.cats), retract: 0.7 * ss(t, EV.peck + 0.06, EV.peck + 0.4) * (1 - 0.6 * ss(t, 18.4, 19.4))};
  const xr = ss(t, EV.xray0, EV.xray0 + 0.35) * (1 - ss(t, EV.xrayOut, EV.xrayOut + 0.45));
  near.xray = xr;
  far.xray = xr;
  const dip = ss(t, 4.9, EV.rasp0) * (1 - ss(t, 5.6, 6.0));
  const lift = 0.05 + 0.22 * ss(t, T.and, T.and + 1.2) - 0.12 * ss(t, EV.peck, EV.peck + 0.25);
  return {
    o: pt(-1.3 + 0.85 * ss(t, 4.95, EV.swallowEgg - 0.05), 0),
    k: 1,
    t,
    crawl: 0.3 * t,
    lift,
    dip,
    rasp: t > EV.rasp0 && t < 5.75 ? 0.5 + 0.5 * Math.sin((t - EV.rasp0) * 30) : 0,
    flinch: ss(t, EV.peck, EV.peck + 0.15) - 0.65 * ss(t, EV.peck + 0.5, EV.peck + 1.6),
    near,
    far,
    xray: xr,
    lowRetract: ss(t, EV.peck, EV.peck + 0.2) * (1 - 0.7 * ss(t, 18, 19)),
    light: 1 + 0.4 * ss(t, T.and, T.and + 1.2),
  };
};
export const snailBInside = (t: number) => ({
  eggU: ss(t, EV.swallowEgg, EV.hatch),
  hatch: ss(t, EV.hatch - 0.05, EV.hatch + 0.25),
  grow: ss(t, EV.grow0, EV.fill0 + 0.3),
  glow: 1,
  t,
});

/** the near stalk of a snail in world coordinates at time t (for aiming the camera and the beak) */
export const stalkPointW = (st: SnailState, u: number, which: 'near' | 'far' = 'near'): P => {
  const s = st[which];
  const local = which === 'near' ? pt(-1.0, -4.45) : pt(-2.2, -4.5);
  // the same bend the snail applies (see art/snail.tsx)
  const w_ = Math.min(1, Math.max(0, (local.x + 7.5) / 6.5));
  const wb = w_ * w_ * (3 - 2 * w_) * (1 - 0.3 * clamp(-local.y / 6 - 0.6));
  const a = -(st.lift - 0.16 * (st.dip ?? 0)) * wb;
  const hx = local.x + 7.5, hy = local.y + 0.6;
  const base = pt(-7.5 + hx * Math.cos(a) - hy * Math.sin(a), -0.6 + hx * Math.sin(a) + hy * Math.cos(a));
  const headTurn = -(st.lift - 0.16 * (st.dip ?? 0)) - (st.flinch ?? 0) * 0.25;
  const g = stalkGeom({...s, base, t: st.t, ang: s.ang + headTurn});
  const i = Math.round(clamp(u) * (g.N - 1));
  const c = g.tb.C[i];
  return pt(st.o.x + c.x * st.k, st.o.y + c.y * st.k);
};

// ---------------------------------------------------------------- the bird
export const BIRD_K = 0.72;
const BIRD_O = pt(27, -23.2);
const PECK_TARGET = stalkPointW(snailB(EV.peck - 0.05), 0.7);
const BEAK_TIP = pt(-22.5, 2.6);
const rotP = (p: P, a: number) => pt(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a));
const PECK_ANG = -0.62, PECK_HA = -0.78;
const PECK_HEAD = (() => {
  const r = rotP(pt((PECK_TARGET.x - BIRD_O.x) / BIRD_K, (PECK_TARGET.y - BIRD_O.y) / BIRD_K), -PECK_ANG);
  const b = rotP(BEAK_TIP, PECK_HA);
  return pt(r.x - b.x, r.y - b.y);
})();
export const birdOn = (t: number) => t > EV.land0 - 0.05;
export const bird = (t: number): BirdState => {
  // landing: an arc down from the upper right, wings beating, folding as the feet take the twig
  const land = ss5(t, EV.land0, EV.land1);
  const o = t < EV.land1 ? pt(lerp(62, BIRD_O.x, land), lerp(-62, BIRD_O.y, land) - 6 * Math.sin(Math.PI * land)) : BIRD_O;
  const flap = t < EV.land1 + 0.2 ? 1 - ss(t, EV.land1 - 0.12, EV.land1 + 0.18) : 0;
  const beat = 0.5 * Math.sin(2 * Math.PI * 7 * t);
  // head: rest, a cock toward the snail, a tilt, the lunge, the yank, the swallow
  const peckU = ss(t, EV.lunge, EV.peck) * (1 - ss(t, EV.yank, EV.yank + 0.35));
  const restHead = pt(HEAD_REST.x + 1.5 * ss(t, EV.cock, EV.cock + 0.25), HEAD_REST.y + 2.5 * ss(t, EV.cock, EV.cock + 0.25));
  const head = pt(lerp(restHead.x, PECK_HEAD.x, peckU), lerp(restHead.y, PECK_HEAD.y, peckU) - 3 * ss(t, EV.swallow, EV.swallow + 0.2) * (1 - ss(t, EV.swallow + 0.5, EV.swallow + 0.9)));
  let ha = -0.28 * ss(t, EV.cock, EV.cock + 0.2) - 0.22 * ss(t, EV.tilt, EV.tilt + 0.15) * (1 - ss(t, EV.tilt + 0.35, EV.tilt + 0.55)) + 0.08 * Math.sin(t * 2.3) * ss(t, EV.land1, EV.land1 + 0.5);
  ha = lerp(ha, PECK_HA, peckU);
  ha += 0.75 * ss(t, EV.swallow, EV.swallow + 0.18) * (1 - ss(t, EV.swallow + 0.45, EV.swallow + 0.8));
  ha -= 0.1 * ss(t, EV.yank, EV.yank + 0.3) * (1 - ss(t, EV.swallow - 0.1, EV.swallow));
  const ang = lerp(-0.06 * ss(t, EV.cock, EV.cock + 0.3) - 0.05 * ss(t, EV.tilt, EV.tilt + 0.2), PECK_ANG, peckU);
  const beak = Math.max(ss(t, EV.lunge, EV.lunge + 0.1) * (1 - ss(t, EV.peck - 0.03, EV.peck)), 0.45 * ss(t, EV.swallow + 0.05, EV.swallow + 0.15) * (1 - ss(t, EV.swallow + 0.3, EV.swallow + 0.42)));
  const gulp = Math.sin(Math.PI * clamp((t - EV.swallow - 0.25) / 0.6)) * (t > EV.swallow + 0.25 && t < EV.swallow + 0.85 ? 1 : 0);
  const xray = ss(t, EV.birdX, EV.birdX + 0.35) * (1 - ss(t, 21.25, 21.7));
  return {
    o,
    ang,
    head,
    headAng: ha,
    beak,
    gulp: clamp(gulp),
    tail: ss(t, EV.release - 0.15, EV.release) * (1 - ss(t, EV.release + 0.25, EV.release + 0.6)),
    wing: flap,
    wingBeat: beat,
    blink: t > 15.45 && t < 15.6 ? Math.sin(Math.PI * (t - 15.45) / 0.15) : 0,
    xray,
    k: BIRD_K,
  };
};
export const birdInside = (t: number) => ({
  sacU: ss(t, EV.birdX - 0.1, EV.burst - 0.05) * 0.86,
  burst: ss(t, EV.burst, EV.burst + 0.25),
  flukes: ss(t, EV.burst + 0.15, T.eggs + 0.05),
  eggs: ss(t, T.eggs, 21.35),
  t,
  closeUp: ss(t, 19.2, 19.7) * (1 - ss(t, 21.2, 21.6)),
});
/** the sac held in the beak, from the peck to the swallow (0 = none) */
export const sacInBeak = (t: number) => (t > EV.peck && t < EV.swallow + 0.32 ? 1 - ss(t, EV.swallow + 0.1, EV.swallow + 0.32) : 0);
export const VENT = birdPoints(bird(EV.release)).vent;

// ---------------------------------------------------------------- the falling dropping
export const DROP_LAND = pt(VENT.x + 0.6, LEAF_A.y + LEAF_A.tilt * (VENT.x - LEAF_A.x0) - 0.15);
export const dropAt = (t: number): {c: P; land: number} | null => {
  if (t < EV.release) return null;
  const u = clamp((t - EV.release) / (EV.landDrop - EV.release));
  const c = pt(lerp(VENT.x, DROP_LAND.x, u), lerp(VENT.y + 0.8, DROP_LAND.y, u * u));
  return {c, land: ss(t, EV.landDrop - 0.02, EV.landDrop + 0.1)};
};
/** the landed dropping beside snail A: there in the opening too, so the loop's two ends match */
export const dropA = (t: number): {c: P; land: number} | null => {
  if (t < EV.swap + 0.05) return {c: DROP_LAND, land: 1};
  return dropAt(t);
};
export const DROP_K = 1.6;

// ---------------------------------------------------------------- the caterpillar on the twig behind snail B
export const catBase = (t: number) => pt(-15.8 + 0.25 * clamp(t - 9), -14.35);

// ---------------------------------------------------------------- camera
export type Cam = {x: number; y: number; w: number; focus: number};
type Key = [number, (t: number) => [number, number, number]];
const C = (x: number, y: number, w_: number) => () => [x, y, w_] as [number, number, number];
const hookCam = (t: number): [number, number, number] => [xA(t) + 0.55, 32.55 - 0.25 * ss(t, 0, 2.1), 11 - 0.6 * ss(t, 0, 2.1)];
const stalkCam = (t: number, wv: number): [number, number, number] => {
  const p = stalkPointW(snailA(t), 0.55);
  return [p.x, p.y, wv];
};
const diveCam = (t: number): [number, number, number] => {
  const p = stalkPointW(snailA(t), 0.5);
  return [p.x, p.y, 0.3];
};
const dropCam = (t: number): [number, number, number] => {
  const d = dropAt(t);
  const c = d ? d.c : VENT;
  return [c.x - 2.5, c.y + 4, lerp(44, 28, ss(t, EV.release, EV.landDrop))];
};
const birdBody = (bx: number, by: number) => {
  const b = bird(19.8);
  const p = rotP(pt(bx * BIRD_K, by * BIRD_K), b.ang);
  return pt(b.o.x + p.x, b.o.y + p.y);
};
const IN1 = birdBody(18.4, 6.6), IN2 = birdBody(20.4, 6.9);
const KEYS: Key[] = [
  [0, hookCam],
  [2.1, hookCam],
  [2.55, (t) => stalkCam(t, 9.6)],
  [T.bait0 - 0.1, (t) => stalkCam(t, 4.3)],
  [EV.dive0, (t) => stalkCam(t, 4.0)],
  [EV.swap, diveCam],
  [EV.swap + 0.0001, C(EGG_B.x, EGG_B.y, 0.11)],
  [5.4, C(1.6, -1.9, 6.6)],
  [EV.xray0 + 0.05, C(1.2, -2.1, 7.2)],
  [6.35, C(-4.6, -4.4, 16.5)],
  [T.fills - 0.05, C(-3.6, -5.2, 15.0)],
  [EV.xrayOut + 0.2, C(0.0, -8.6, 12.0)],
  [T.they - 0.2, C(0.7, -9.0, 9.4)],
  [T.tiny + 0.1, C(-5.2, -11.4, 17.5)],
  [T.catsEnd + 0.1, C(-4.6, -11.0, 15.8)],
  [T.and + 0.42, C(0.3, -10.5, 11.8)],
  [EV.land0 - 0.25, C(0.6, -10.8, 12.6)],
  [EV.land1 - 0.05, C(11, -20, 50)],
  [T.because, C(11.5, -20.5, 46)],
  [T.spots + 0.3, C(6.5, -22, 27)],
  [EV.lunge, C(5.5, -19.5, 25)],
  [EV.yank + 0.3, C(5, -18, 24)],
  [EV.birdX + 0.25, C(20, -24, 72)],
  [19.3, C(24, -21, 60)],
  [19.95, () => [IN1.x, IN1.y, 10]],
  [21.2, () => [IN2.x, IN2.y, 9]],
  [EV.release + 0.05, dropCam],
  [EV.landDrop, dropCam],
  [EV.landDrop + 0.7, C(40.5, 34.6, 24)],
  [DUR, (t) => [xA(t) + 0.55, 32.55, 11]],
];
const logLerp = (a: number, b: number, u: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
export const camAt = (t: number): Cam => {
  let k = 0;
  while (k < KEYS.length - 2 && t >= KEYS[k + 1][0]) k++;
  const [t0, f0] = KEYS[k], [t1, f1] = KEYS[k + 1];
  // the hold segments (same function at both ends) simply follow it
  const u = ss5(t, t0, t1);
  const A = f0(t), B = f1(t);
  let wv = logLerp(A[2], B[2], u);
  // the dive accelerates into the sac (ease-in); the swap pulls out with an ease-out
  if (t0 === EV.dive0) wv = logLerp(A[2], B[2], Math.pow(clamp((t - t0) / (t1 - t0)), 1.6));
  if (t0 === EV.swap + 0.0001) wv = logLerp(A[2], B[2], 1 - Math.pow(1 - clamp((t - t0) / (t1 - t0)), 1.7));
  // keep the subject centred while the field width changes by a large factor (zoom about the subject)
  let x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u);
  if (Math.abs(Math.log(A[2] / B[2])) > 1.2) {
    // a large zoom: hold the detail end's centre (the anchor) on a straight screen path, so it never slips out
    const zu = (Math.log(wv) - Math.log(A[2])) / (Math.log(B[2]) - Math.log(A[2]));
    const an = A[2] < B[2] ? A : B;
    const s0x = (an[0] - A[0]) / A[2], s0y = (an[1] - A[1]) / A[2];
    const s1x = (an[0] - B[0]) / B[2], s1y = (an[1] - B[1]) / B[2];
    x = an[0] - lerp(s0x, s1x, zu) * wv;
    y = an[1] - lerp(s0y, s1y, zu) * wv;
  }
  const focus = CAT_DELTA * (ss(t, T.tiny - 0.05, T.tiny + 0.35) - ss(t, T.cats + 0.35, T.cats + 0.75));
  return {x, y, w: wv, focus};
};
/** the scene's light: a sun patch brightens as the infected snail climbs into the open */
export const lightAt = (t: number) => 1 + 0.35 * ss(t, T.and, T.and + 1.2) * (1 - ss(t, 17.5, 18.5));
