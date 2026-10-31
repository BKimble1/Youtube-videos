// V2 timeline: every beat keyed to the measured narration (data/timeline.json via word()), the states of both
// snails, the bird and the dropping at time t, and the camera.
//
// One leaf. Snail 1 starts at H (x = 0), already infected; it later climbs to the sunlit spot T near the leaf tip,
// where the bird takes a stalk. The dropping falls back at H, where snail 2 arrives and ends in exactly the pose
// snail 1 had in the first frame (same stalk, same pulse phase), so the last frame is the first.
//
//   0.00-0.50  extreme close-up of a swollen striped eyestalk; a contraction bulge travels up it
//   0.50-2.05  continuous pull-back to the whole snail ("...inside a snail")
//   2.05-3.10  push in: the stalk writhes and distorts ("it can turn its eyes")
//   3.10-4.55  a lengthwise cutaway opens the stalk: the sac wall, packed larvae, the retractor ("into moving bait")
//   4.55-6.60  down the stalk into a cutaway of the body: the green sporocyst grows from the visceral mass forward
//              ("The worm grows through its body")
//   6.60-7.85  back up into the stalk: material pumps in, the sac swells, the larvae mature ("fills its eyestalks")
//   7.85-9.55  the skin closes: outside, both stalks pulse, colourful ("with pulsing, colorful sacs")
//   9.55-12.5  one continuous pull-out to the forest as the snail climbs into the sun; a caterpillar on the twig
//              above pulses the same way ("They start looking like tiny caterpillars")
//   12.5-15.2  a thrush lands beside the exposed snail and turns one eye on it ("exactly what the parasite wants")
//   15.2-17.0  the eye; a fast strike; one stalk torn off ("Because when a bird spots one and eats it")
//   17.0-19.3  the swallow; the camera follows the sac down the gullet and into the gut ("...inside the bird")
//   19.3-21.3  in the cloaca: the larvae become adult flukes, their uteri full of eggs; the eggs stream out
//   21.3-22.45 out through the vent: the bird on a branch above H; the dropping falls ("...the bird's droppings")
//   22.45-24.87 snail 2 reaches the dropping; the camera approaches its eyestalk, which blooms into frame 0
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
  snail0: w('snail').start,
  it: w('it').start,
  eyes: w('eyes').start,
  into: w('into').start,
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
  infect: w('infect').start,
  another: w('another').start,
  snailEnd: w('snail', 1).end,
};
export const EV = {
  cut0: 1.15,
  bodyCut0: 2.3,
  stalkBack: T.fills - 0.35,
  farFill0: T.fills + 0.05,
  farFill1: T.eyestalks + 0.65,
  cutClose: T.pulsing - 0.1,
  climb0: T.pulsing + 0.05,
  climb1: 12.6,
  land0: T.because + 0.12,
  land1: T.spots + 0.3,
  look: T.wants - 0.1,
  tilt: T.spots,
  lunge: T.eats - 0.08,
  peck: T.eats + 0.12,
  yank: T.eats + 0.17,
  swallow: T.par3 + 0.05,
  intoBird: T.par3 + 0.4,
  inside0: 18.2,
  burst: 19.45,
  perch2: 20.0,
  inside1: 21.25,
  release: 21.62,
  landDrop: 22.42,
  touch: T.infect,
  bloom0: T.snailEnd - 0.1,
};

// ---------------------------------------------------------------- the set
export const LEAF: LeafSpec = {x0: -32, x1: 54, y: 0, far: 2.4, near: 3.4, tilt: 0, hue: '#3E7A27', seed: 4};
export const STEM: P[] = [pt(-32, 0.6), pt(-38, 6), pt(-42, 30), pt(-44, 120)];
export const TWIG_CAT: P[] = [pt(10, -20.4), pt(24, -20.9), pt(42, -20.2), pt(76, -24)];
export const CAT_DELTA = 4;
export const XT = 30; // T: the exposed spot near the leaf tip

// ---------------------------------------------------------------- snails
const NEAR0 = {ang: -1.12, bend: 0.24, Ln: 4.6, Ls: 7.8, rn: 0.4, rmax: 1.35};
const FAR0 = {ang: -1.42, bend: 0.18, Ln: 4.4, Ls: 7.0, rn: 0.38, rmax: 1.2};
/** the infected stalks at the moment of the first frame (snail 2 blooms into exactly this) */
const S0 = 0.86;
export const x1 = (t: number) => (t < EV.climb0 ? 0.35 * t : lerp(0.35 * EV.climb0, XT, ss5(t, EV.climb0, EV.climb1)) + 0.05 * Math.max(0, t - EV.climb1));
const pulseK = (t: number) => 1 + 0.35 * ss(t, T.it, T.it + 0.3) * (1 - ss(t, T.into, T.into + 0.4)) + 0.25 * ss(t, T.and, T.and + 0.8);
/** the snail's body answers each contraction of the sac: the head bobs slightly and the lower tentacles twitch */
const bodyReact = (t: number) => 0.025 * Math.sin(2 * Math.PI * 1.55 * t);
const lowTwitch = (t: number) => 0.3 * Math.max(0, Math.sin(2 * Math.PI * 1.55 * t - 0.6)) ** 3;
// ---- V4 hook (0-2.2 s only; from 2.2 s every value equals V3, and at t = 0 every value equals V3's frame 0,
// so the loop from the unchanged last frame still closes)
const HOOK_END = 2.2;
/** the travelling bulge grows to nearly twice its strength in the first quarter second, then settles back */
const hookBulge = (t: number) => (t < HOOK_END ? 1 + 0.95 * ss(t, 0.04, 0.24) * (1 - ss(t, 1.6, HOOK_END)) : 1);
/** the skin turns translucent as the camera pushes in, then gives way to the V3 opening */
const hookGlass = (t: number) => (t < HOOK_END ? ss(t, 0.72, 1.2) * (1 - ss(t, 1.55, 2.0)) : 0);
/** the head answers the hard contractions: a small recoil and a bob in time with the beat */
const hookFlinch = (t: number) => (t < HOOK_END ? 0.2 * ss(t, 0.26, 0.4) * (1 - ss(t, 0.5, 0.85)) + 0.12 * ss(t, 0.92, 1.04) * (1 - ss(t, 1.1, 1.4)) : 0);
const hookReact = (t: number) => (t < HOOK_END ? 0.035 * Math.sin(2 * Math.PI * 1.55 * t - 0.5) * ss(t, 0, 0.2) * (1 - ss(t, 1.6, HOOK_END)) : 0);
export const snail1 = (t: number): SnailState => {
  const wound = ss(t, EV.peck, EV.peck + 0.08);
  const fill = ss(t, T.it, T.baitEnd);
  const cut = (t < HOOK_END ? ss(t, 1.4, 1.95) : ss(t, EV.cut0, EV.cut0 + 0.6)) * (1 - ss(t, EV.cutClose, EV.cutClose + 0.45));
  const dev = 0.55 + 0.45 * ss(t, EV.stalkBack, EV.farFill1);
  const farS = ss(t, EV.farFill0, EV.farFill1);
  const farCut = ss(t, EV.stalkBack, EV.stalkBack + 0.45) * (1 - ss(t, EV.cutClose, EV.cutClose + 0.45));
  const vivid = 0.35 + 0.65 * ss(t, T.they, T.cats);
  const pk = pulseK(t) * (1 - wound);
  const near: StalkParams = {...NEAR0, S: lerp(S0, 1, fill), band: 1 - wound, pulse: pk, vivid, wound, ...(t < HOOK_END ? {bulge: pk * hookBulge(t), glass: hookGlass(t)} : {}), retract: 0.45 * ss(t, EV.peck + 0.04, EV.peck + 0.45), cut, dev};
  const far: StalkParams = {...FAR0, S: farS, band: ss(t, EV.farFill0 + 0.1, EV.farFill1), pulse: pulseK(t) * ss(t, EV.farFill0 + 0.3, EV.farFill1 + 0.3) * (1 - 0.5 * ss(t, EV.peck, EV.peck + 0.4)), phase: 1.9, vivid,
    cut: farCut, dev: ss(t, EV.farFill0, EV.farFill1 + 0.3),
    retract: 0.7 * ss(t, EV.peck + 0.05, EV.peck + 0.4) * (1 - 0.6 * ss(t, 18.4, 19.6))};
  const cutAlpha = 1 - ss(t, EV.cutClose - 0.2, EV.cutClose + 0.3);
  const xr = cutAlpha > 0.001 ? ss(t, EV.bodyCut0, EV.bodyCut0 + 0.9) : 0;
  const climbing = ss(t, EV.climb0, EV.climb0 + 0.4) * (1 - ss(t, EV.climb1 - 0.4, EV.climb1));
  const lift = 0.05 + 0.2 * ss(t, EV.climb1 - 0.6, EV.climb1 + 0.4) + 0.02 * Math.sin(t * 2.1) + bodyReact(t) + hookReact(t) - 0.12 * ss(t, EV.peck, EV.peck + 0.25);
  return {
    o: pt(x1(t), 0),
    k: 1,
    t,
    crawl: x1(t) * (1 + 0.6 * climbing),
    lift,
    flinch: ss(t, EV.peck, EV.peck + 0.12) - 0.65 * ss(t, EV.peck + 0.5, EV.peck + 1.6) + hookFlinch(t),
    near,
    far,
    xray: xr,
    cutAlpha,
    lowRetract: Math.max(ss(t, EV.peck, EV.peck + 0.2) * (1 - 0.7 * ss(t, 18, 19)), lowTwitch(t)),
    light: 1 + 0.45 * ss(t, EV.climb1 - 1, EV.climb1),
  };
};
export const snail1Inside = (t: number) => ({grow: ss(t, T.worm - 0.1, T.fills - 0.1), flow: 1 + 2.5 * ss(t, EV.stalkBack, EV.stalkBack + 0.4), t});
/** snail 2 arrives at H; it touches the dropping, lifts its head, and its stalk blooms into the first frame */
export const x2 = (t: number) => -0.35 * (DUR - t);
export const snail2 = (t: number): SnailState => {
  const bloom = ss(t, EV.bloom0, DUR);
  const tt = t - DUR; // phase-locked to snail 1 at t = 0
  const near: StalkParams = {...NEAR0, S: S0 * bloom, band: ss(t, EV.bloom0 + 0.15, DUR), pulse: pulseK(0) * bloom, vivid: 0.35, cut: 0, dev: 0.55};
  const far: StalkParams = {...FAR0, S: 0, band: 0, pulse: 0, phase: 1.9, vivid: 0.35, cut: 0, dev: 0};
  const dip = ss(t, EV.touch - 0.3, EV.touch + 0.1) * (1 - ss(t, EV.touch + 0.55, EV.touch + 1.0));
  return {o: pt(x2(t), 0), k: 1, t: tt, crawl: x2(t), lift: 0.05 + 0.02 * Math.sin(tt * 2.1) + bodyReact(tt) * bloom, lowRetract: lowTwitch(tt) * bloom, dip, rasp: dip > 0.5 ? 0.5 + 0.5 * Math.sin(t * 30) : 0, near, far, light: 1};
};

/** a point on a snail's stalk in world coordinates, from its geometry without the pulse (a steady camera aim) */
export const stalkPointW = (st: SnailState, u: number, which: 'near' | 'far' = 'near', steady = true): P => {
  const s = steady ? {...st[which], pulse: 0, bulge: 0} : st[which];
  const local = which === 'near' ? pt(-1.0, -4.45) : pt(-2.2, -4.5);
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

// ---------------------------------------------------------------- the bird (a thrush, k = 0.72; it pivots on its feet)
export const BIRD_K = 0.72;
const FEET_L = pt(8.6, 26.2);
const BEAK_TIP = pt(-22.5, 2.6);
const rotP = (p: P, a: number) => pt(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a));
const addP = (a: P, b: P) => pt(a.x + b.x, a.y + b.y);
const subP = (a: P, b: P) => pt(a.x - b.x, a.y - b.y);
const mulP = (a: P, k: number) => pt(a.x * k, a.y * k);
/** body centre from the feet: the body turns about the toes, which stay on the twig */
const oFromFeet = (F: P, ang: number) => subP(F, mulP(rotP(FEET_L, ang), BIRD_K));
const PECK_ANG = -0.78, PECK_HA = -0.62;
const PECK_HEAD = pt(HEAD_REST.x - 2.5, HEAD_REST.y + 5.5);
const PECK_TARGET = stalkPointW(snail1(EV.peck - 0.06), 0.66);
/** perch 1 (beside T), solved so the beak meets the stalk at full lean with an unstretched neck */
export const F1 = subP(PECK_TARGET, mulP(rotP(subP(addP(PECK_HEAD, rotP(BEAK_TIP, PECK_HA)), FEET_L), PECK_ANG), BIRD_K));
/** perch 2 (above H), placed so the vent is over the spot where the dropping lands */
export const DROP_LAND = pt(5.0, LEAF.y - 0.15);
const VENT_L = pt(22, 8);
const ANG2 = -0.08;
export const F2 = (() => {
  const o = subP(pt(DROP_LAND.x - 0.6, -46), mulP(rotP(VENT_L, ANG2), BIRD_K));
  return addP(o, mulP(rotP(FEET_L, ANG2), BIRD_K));
})();
/** perch 0: where the bird first sits and notices the stalks (up and to the right of T) */
export const F0 = pt(F1.x + 14, F1.y - 24);
export const TWIG_0: P[] = [pt(F0.x - 8, F0.y + 0.8), pt(F0.x + 10, F0.y + 0.2), pt(F0.x + 40, F0.y - 2), pt(F0.x + 80, F0.y - 8)];
export const TWIG_1: P[] = [pt(F1.x - 7, F1.y + 0.9), pt(F1.x + 6, F1.y + 0.6), pt(F1.x + 30, F1.y - 1.5), pt(F1.x + 70, F1.y - 6)];
export const TWIG_2: P[] = [pt(F2.x - 40, F2.y + 2.5), pt(F2.x - 10, F2.y + 0.9), pt(F2.x + 8, F2.y + 0.6), pt(F2.x + 26, F2.y - 1.2)];
export const birdOn = (t: number) => t > 11.8;
export const bird = (t: number): BirdState => {
  // the approach: one fast flight from perch 0 down to perch 1, wings beating, folding as the toes grip
  const land = ss5(t, EV.land0, EV.land1);
  const atPerch2 = t >= EV.perch2;
  const strikeU = ss(t, EV.lunge, EV.peck) * (1 - ss(t, EV.yank, EV.yank + 0.32));
  const look = ss(t, EV.look, EV.look + 0.25) * (1 - ss(t, EV.land0 - 0.05, EV.land0 + 0.1)) + ss(t, EV.land1 - 0.05, EV.land1 + 0.1);
  let ang = lerp(-0.08 * look - 0.06 * ss(t, EV.tilt, EV.tilt + 0.2), PECK_ANG, strikeU);
  ang += 0.06 * ss(t, EV.swallow, EV.swallow + 0.2) * (1 - ss(t, EV.swallow + 0.5, EV.swallow + 0.9));
  if (atPerch2) ang = ANG2;
  const restHead = pt(HEAD_REST.x + 1.0 * look, HEAD_REST.y + 2.0 * look);
  const head = atPerch2 ? HEAD_REST : pt(lerp(restHead.x, PECK_HEAD.x, strikeU), lerp(restHead.y, PECK_HEAD.y, strikeU) - 2.2 * ss(t, EV.swallow, EV.swallow + 0.2) * (1 - ss(t, EV.swallow + 0.5, EV.swallow + 0.9)));
  // the head: a one-eyed look at the snail (birds sight with one eye), the strike, the toss and swallow
  let ha = -0.24 * look - 0.2 * ss(t, EV.tilt, EV.tilt + 0.12) * (1 - ss(t, EV.tilt + 0.35, EV.tilt + 0.5));
  ha = lerp(ha, PECK_HA, strikeU);
  ha += 0.7 * ss(t, EV.swallow, EV.swallow + 0.16) * (1 - ss(t, EV.swallow + 0.42, EV.swallow + 0.75));
  if (atPerch2) ha = 0.05;
  const o = atPerch2 ? oFromFeet(F2, ANG2) : t < EV.land0 ? oFromFeet(F0, ang) : t < EV.land1 ? (() => {
    const a = oFromFeet(F0, 0), end = oFromFeet(F1, 0);
    return pt(lerp(a.x, end.x, land), lerp(a.y, end.y, land) - 7 * Math.sin(Math.PI * land));
  })() : oFromFeet(F1, ang);
  const spread = t > EV.land0 - 0.08 && t < EV.land1 + 0.25 ? ss(t, EV.land0 - 0.08, EV.land0 + 0.06) * (1 - ss(t, EV.land1 - 0.1, EV.land1 + 0.2)) : 0;
  if (t > EV.land0 && t < EV.land1) ang += -0.12 * Math.sin(Math.PI * land);
  const beak = Math.max(ss(t, EV.lunge, EV.lunge + 0.08) * (1 - ss(t, EV.peck - 0.03, EV.peck)), 0.42 * ss(t, EV.swallow + 0.05, EV.swallow + 0.14) * (1 - ss(t, EV.swallow + 0.28, EV.swallow + 0.4)));
  const gulp = t > EV.swallow + 0.22 && t < EV.swallow + 0.8 ? Math.sin(Math.PI * (t - EV.swallow - 0.22) / 0.58) : 0;
  return {
    o,
    ang,
    head,
    headAng: ha,
    beak,
    gulp: clamp(gulp),
    tail: ss(t, EV.release - 0.18, EV.release) * (1 - ss(t, EV.release + 0.25, EV.release + 0.6)),
    wing: spread,
    wingBeat: 0.5 * Math.sin(2 * Math.PI * 7 * t),
    blink: t > 14.95 && t < 15.09 ? Math.sin((Math.PI * (t - 14.95)) / 0.14) : 0,
    xray: ss(t, EV.intoBird - 0.1, EV.intoBird + 0.3) * (1 - ss(t, EV.inside1 + 0.05, EV.inside1 + 0.45)),
    inside: ss(t, EV.inside0 - 0.15, EV.inside0 + 0.2) * (1 - ss(t, EV.inside1 - 0.15, EV.inside1 + 0.15)),
    k: BIRD_K,
  };
};
export const birdInside = (t: number) => ({
  sacU: ss(t, EV.swallow + 0.3, EV.burst - 0.05) * 0.86,
  burst: ss(t, EV.burst, EV.burst + 0.25),
  flukes: ss(t, EV.burst + 0.12, T.eggs + 0.05),
  eggs: ss(t, T.eggs, EV.inside1 + 0.1),
  t,
  closeUp: 1,
});
/** the sac held in the beak, from the peck to the swallow (0 = none) */
export const sacInBeak = (t: number) => (t > EV.peck && t < EV.swallow + 0.32 ? 1 - ss(t, EV.swallow + 0.1, EV.swallow + 0.32) : 0);
/** a point given in bird-body coordinates, in the world, at time t */
export const birdBodyW = (t: number, p: P) => {
  const b = bird(t);
  return addP(b.o, mulP(rotP(p, b.ang), BIRD_K));
};
export const VENT = birdPoints(bird(EV.release)).vent;

// ---------------------------------------------------------------- the dropping
export const DROP_K = 1.6;
export const dropAt = (t: number): {c: P; land: number} | null => {
  // already lying at H in the opening, so the first frame matches the last (it leaves the frame as the camera pushes in)
  if (t < 3) return {c: DROP_LAND, land: 1};
  if (t < EV.release) return null;
  const u = clamp((t - EV.release) / (EV.landDrop - EV.release));
  const c = pt(lerp(VENT.x, DROP_LAND.x, u), lerp(VENT.y + 0.8, DROP_LAND.y, u * u));
  return {c, land: ss(t, EV.landDrop - 0.02, EV.landDrop + 0.1)};
};

// ---------------------------------------------------------------- the caterpillar on the twig above T
export const catBase = (t: number) => pt(20 + 0.3 * clamp(t - 9), -20.75);

// ---------------------------------------------------------------- camera
export type Cam = {x: number; y: number; w: number; focus: number};
type Key = [number, (t: number) => [number, number, number]];
const C = (x: number, y: number, w_: number) => () => [x, y, w_] as [number, number, number];
const S1 = (u: number, wv: number, which: 'near' | 'far' = 'near') => (t: number): [number, number, number] => {
  const p = stalkPointW(snail1(t), u, which);
  return [p.x, p.y, wv];
};
/** the first (and last) frame: the head and both eyestalks, one grotesquely swollen */
const frame0 = (t: number): [number, number, number] => [x1(t) - 0.4, -6.4, 10.5 - 0.5 * ss(t, 0, 0.3)];
const BIN = (bx: number, by: number, wv: number) => (t: number): [number, number, number] => {
  const p = birdBodyW(t, pt(bx, by));
  return [p.x, p.y, wv];
};
const sacCam = (wv: number) => (t: number): [number, number, number] => {
  // follow the sac along a smoothed version of the gut's path, so the camera doesn't trace every bend
  const u = ss(t, EV.swallow + 0.3, EV.burst - 0.05) * 0.86;
  let x = 0, y = 0;
  for (let k = -6; k <= 6; k++) {
    const q = along(GUT_BIRD, clamp(u + k * 0.018));
    x += q.x / 13;
    y += q.y / 13;
  }
  const p = birdBodyW(t, pt(x, y));
  return [p.x, p.y, wv];
};
const dropCam = (t: number): [number, number, number] => {
  const d = dropAt(t);
  const c = d ? d.c : VENT;
  return [c.x - 1.5, c.y + 2.5, lerp(34, 22, ss(t, EV.release, EV.landDrop))];
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const headCam = (wv: number, dx = 0, dy = 0) => (t: number): [number, number, number] => {
  const h = birdPoints(bird(t)).headC;
  return [h.x + dx, h.y + dy, wv];
};
const KEYS: Key[] = [
  [0, frame0],
  [0.7, (t) => [x1(t) - 0.05, -7.0, 8.4]],
  [1.4, S1(0.56, 4.5)],
  [2.2, S1(0.6, 3.3)],
  [T.into - 0.05, S1(0.05, 5.0)],
  [T.baitEnd - 0.1, (t) => [x1(t) - 0.8, -5.8, 8.4]],
  [T.grows + 0.15, (t) => [x1(t) - 10.2, -2.0, 9]],
  [T.fills - 0.1, (t) => [x1(t) - 4.0, -3.3, 8.4]],
  [EV.farFill1 - 0.2, S1(0.5, 6.3, 'far')],
  [T.pulsing + 0.75, (t) => [x1(t) - 0.4, -7.4, 10.2]],
  [T.sacsEnd + 0.1, (t) => [x1(t) - 0.4, -8.0, 9.6]],
  [T.tiny, (t) => [x1(t) + 1.5, -11.5, 21]],
  [T.catsEnd + 0.15, (t) => [x1(t) - 1.5, -16, 34]],
  [T.and + 0.5, (t) => [x1(t) + 0.5, -9.5, 21]],
  [T.wants - 0.15, () => [(XT + F0.x) / 2 - 4, (F0.y - 12) / 2 - 3, 68]],
  [EV.land0, () => [(XT + F0.x) / 2 - 3, (F0.y - 12) / 2 - 3, 64]],
  [(EV.land0 + EV.land1) / 2, (t) => {
    const h = birdPoints(bird(t)).headC;
    return [h.x - 4, h.y + 16, 42];
  }],
  [EV.land1 + 0.05, (t) => {
    const h = birdPoints(bird(t)).headC;
    return [(h.x + PECK_TARGET.x) / 2 - 2, (h.y + PECK_TARGET.y) / 2 + 3, 33];
  }],
  [EV.lunge, (t) => {
    const h = birdPoints(bird(t)).headC;
    return [(h.x + PECK_TARGET.x) / 2, (h.y + PECK_TARGET.y) / 2, 27];
  }],
  [EV.yank + 0.25, (t) => {
    const h = birdPoints(bird(t)).headC;
    return [(h.x + PECK_TARGET.x) / 2 + 1, (h.y + PECK_TARGET.y) / 2 - 1, 27];
  }],
  [EV.swallow + 0.3, headCam(24, 4, 6)],
  [EV.intoBird + 0.2, sacCam(15)],
  [EV.inside0 + 0.3, sacCam(11)],
  [EV.burst - 0.05, sacCam(9.5)],
  [T.eggs - 0.2, BIN(18.6, 7.6, 7.2)],
  [EV.inside1 - 0.1, BIN(21.0, 7.5, 7.6)],
  [EV.release + 0.02, BIN(21.5, 7.8, 30)],
  [EV.release + 0.05, dropCam],
  [EV.landDrop, dropCam],
  [EV.touch + 0.35, (t) => [x2(t) + 2.6, -2.6, 14]],
  [DUR, (t) => [x2(t) - 0.4, -6.4, 10.5]],
];
const logLerp = (a: number, b: number, u: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
export const camAt = (t: number): Cam => {
  let k = 0;
  while (k < KEYS.length - 2 && t >= KEYS[k + 1][0]) k++;
  const [t0, f0] = KEYS[k], [t1, f1] = KEYS[k + 1];
  const u = ss5(t, t0, t1);
  const A = f0(t), B = f1(t);
  const wv = logLerp(A[2], B[2], u);
  let x = lerp(A[0], B[0], u), y = lerp(A[1], B[1], u);
  if (Math.abs(Math.log(A[2] / B[2])) > 1.0) {
    // a large zoom: hold the detail end's centre (the anchor) on a straight screen path, so it never slips out
    const zu = (Math.log(wv) - Math.log(A[2])) / (Math.log(B[2]) - Math.log(A[2]));
    const an = A[2] < B[2] ? A : B;
    const s0x = (an[0] - A[0]) / A[2], s0y = (an[1] - A[1]) / A[2];
    const s1x = (an[0] - B[0]) / B[2], s1y = (an[1] - B[1]) / B[2];
    x = an[0] - lerp(s0x, s1x, zu) * wv;
    y = an[1] - lerp(s0y, s1y, zu) * wv;
  }
  const focus = CAT_DELTA * (ss(t, T.tiny + 0.1, T.tiny + 0.45) - ss(t, T.cats + 0.45, T.cats + 0.8));
  return {x, y, w: wv, focus};
};
/** the scene's light: the sun patch at T brightens as the snail climbs into the open */
export const lightAt = (t: number) => 1 + 0.4 * ss(t, EV.climb1 - 1.2, EV.climb1) * (1 - ss(t, EV.intoBird, EV.intoBird + 0.6));
