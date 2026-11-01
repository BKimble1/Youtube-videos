// V3 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). Worlds: 'frog' (the forest
// floor and the frog; the frog has a placement P(t): the opening spot N, the wintering spot M behind and to the left, a
// halfway spot Q, and the two hops between them) and 'micro' (the tissue, u). Interior shots are framed in the frog's
// own space and mapped through P. One continuous body:
//
//   0.00-0.08  ECU, the frog alive and moving (head rising, a foot stepping, throat pumping, heart beating)
//   0.08-0.65  ice overtakes it: a wave with a bursting crystal front sweeps from the ground up over the head
//   0.00-0.95  the camera pushes straight into the chest; on the heart by 0.95
//   0.95-1.60  the heart labours as the ice closes in; its last, strained beat on "HEART" (1.60); the sound cuts out
//   1.60-2.52  motionless; ice bursts into the pericardium, fern frost creeps over the heart; on "STOPS" it locks shut
//   3.00-3.90  one move out: the window opens over the trunk as the ice sweeps between the organs; the lungs sag
//   3.90-4.70  a dive into the back muscle
//   4.70-5.60  step 1, wide: ice forms between the cells (the front sweeps the field)
//   5.60-6.60  step 2, closer: water is pulled out of the cells to the ice; they shrink
//   6.60-7.85  step 3, close on one cell: an ice spear drives into it, dents it; it buckles
//   7.85-8.75  out to the trunk, framed on the liver ("But its liver")
//   9.16-10.0  the liver flares and pours glowing glucose into the vein; the glow runs down it toward the tissue
//   9.95-10.75 the camera follows the glow into a capillary
//   10.75-11.4 along the vessel with the streaming molecules
//   11.4-12.0  they leave the vessel and pass the threatened cell's transporters
//   11.9-13.85 the cell fills, rounds out, pushes the dent back; the spear and needles stop at its membrane
//   13.85-14.85 out through the body to the frog, frozen, under leaves and snow
//   14.85-16.35 time passes: the camera rises; the sun sets, the moon crosses, the sun rises; snow piles high
//   16.35-17.30 spring: warm light, the snowpack slumps and melts away; 17.1-17.9 the frost on the frog melts
//   16.90-18.60 one push to the heart
//   18.60-19.60 the last pericardial ice melts; a twitch on "starts" (19.18)
//   19.60      the first heartbeat on "beating": a forceful squeeze, a shockwave, the remaining ice blown out, a punch
//   19.65-20.15 the window opens over the trunk: red pulses race out along the arteries with each beat
//   20.15-20.85 out to the whole frog: the eyes open and the pupils widen, the throat gulps, the legs stretch
//   21.08      hop 1 on "HOPS": a push-off from the ground, a flight toward the camera, a landing halfway
//   22.38      hop 2 on "happened": a push-off, a flight, a landing in the opening's spot
//   22.98-24.50 the landing settles into frame 0's framing; the cutaway reopens on the beat; the cold creeps back in;
//              the head lifts and a foot steps on into frame 0
import {P, add, mul, pt, sub} from './core/geo';
import {clamp, lerp, noise1, ss, ss5} from './lib';
import TL1 from './data/timeline_v1.json';
import {FrogState as FS_, hindLeg} from './art/frog';
import {FrogState, HEART_B, MICRO_B, SIT, toWorld} from './art/frog';
import {AnatomyState, HeartState} from './art/anatomy';
import {MicroState, HERO, capY} from './art/micro';
import {EnvState} from './art/forest';

// This file runs on the V3 picture's own clock (keyed to the V1 narration's word times, loop at 24.5 s). V4's calmer
// narration is mapped onto it by warp.ts, so every event lands on the new voice without re-keying the picture.
const k1 = (x: string) => x.toLowerCase().replace(/[^a-z']/g, '');
const w = (s: string, n = 0) => {
  const hit = (TL1.words as {word: string; start: number; end: number}[]).filter((x) => k1(x.word.replace('’', "'")) === k1(s))[n];
  if (!hit) throw new Error(`word not in V1 narration: ${s}`);
  return hit;
};
export const T = {
  freeze: w('freeze').start, heart: w('HEART').start, stops: w('STOPS!').start, stopsEnd: w('STOPS!').end,
  ice: w('Ice').start, body: w('body,').start, breathing: w('breathing,').start, dead: w('dead.').start, deadEnd: w('dead.').end,
  but: w('But').start, liver: w('liver').start, releases: w('releases').start, massive: w('massive').start, sugar: w('sugar,').start, sugarEnd: w('sugar,').end,
  protecting: w('protecting').start, cells: w('cells').start, while: w('while').start, freezes: w('freezes!').start, freezesEnd: w('freezes!').end,
  survive: w('survive').start, weeks: w('weeks!').start, weeksEnd: w('weeks!').end,
  spring: w('spring').start, melts: w('melts,').start, meltsEnd: w('melts,').end, heart2: w('heart').start, starts: w('starts').start,
  beating: w('beating').start, again: w('again…').start, hops: w('HOPS').start, away: w('AWAY').start, happened: w('happened!').start, happenedEnd: w('happened!').end,
};
export const LOOP_T = 24.5; // the V3 clock's loop point
/** the heartbeat period: LOOP_T - 11 * PERIOD = 19.60 s (the first beat of the revival, on "beating"), and frame 0 is a
 * beat. The opening's last beat is not on this grid: it falls on the narration's "HEART". */
export const PERIOD = 4.9 / 11;
export const EV = {
  wave0: 0.08, wave1: 0.65, close: 0.95, finalBeat: T.heart, cut: T.heart + 0.09, lock: T.stops,
  wide0: 3.0, wide1: 3.9, dive1: 4.7, lungs0: 3.2, lungs1: 3.9,
  step2: 5.6, step3: 6.6, water0: 5.6, spear0: 6.65, dent0: 6.9, crumple0: 7.0,
  out1a: 7.85, out1b: 8.75, sugar0: T.releases, entry2a: 9.95, entry2b: 10.75,
  rings0: 9.95, track1: 11.4, toCell: 12.0, hold0: 11.9, hold1: 12.75, spikes0: 12.3, spikes1: 13.5, out2a: 13.85, out2b: 14.85,
  days0: 14.85, days1: 16.2, spring0: 16.35, melt0: 16.45, melt1: 17.3, thaw0: 17.1, thaw1: 17.9,
  chest: 16.9, heartIn0: 18.1, heartIn1: 18.6, twitch: T.starts, beat0: LOOP_T - 11 * PERIOD, circ0: 19.65, circ1: 20.15,
  whole1: 20.85, eyes0: 20.3, eyes1: 20.5, crouch0: 20.86, launch: T.hops, land: 21.72, settle: 22.1,
  crouch2: 22.12, launch2: 22.38, land2: 22.98, settle2: 23.35,
  reopen0: 23.3, reopen1: 24.2, cold0: 23.0,
};
const PUSH = 0.18; // the push-off: the hind legs extend against the planted feet before the frog leaves the ground
/** is the frog in the air (its contact shadow stays on the ground)? */
export const airborne = (t: number) => (t > EV.launch + PUSH && t < EV.land) || (t > EV.launch2 + PUSH && t < EV.land2);

// ---------------------------------------------------------------- smooth keyed curves
/** monotone cubic Hermite through keys (velocity-continuous, no overshoot) */
export const mono = (t: number, keys: [number, number][]) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  m.push(0);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(0);
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const h = keys[i + 1][0] - keys[i][0], s = (t - keys[i][0]) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return h00 * keys[i][1] + h10 * h * m[i] + h01 * keys[i + 1][1] + h11 * h * m[i + 1];
};
const pulse = (x: number, len = 0.26) => (x < 0 || x > len ? 0 : Math.sin((Math.PI * x) / len) ** 2);

// ---------------------------------------------------------------- the heart
type Beat = [number, number]; // time, strength
export const BEATS: Beat[] = (() => {
  const b: Beat[] = [[-PERIOD, 1], [0, 1], [PERIOD, 1], [2 * PERIOD, 0.95], [EV.finalBeat, 1.1], [EV.twitch, 0.3], [EV.beat0, 1.5]];
  for (let n = 10; n >= 0; n--) b.push([LOOP_T - n * PERIOD, 1]);
  return b;
})();
export const heartAt = (t: number): HeartState => {
  let beat = 0, atria = 0;
  for (const [b, s] of BEATS) {
    const len = Math.abs(b - EV.finalBeat) < 1e-6 ? 0.42 : 0.26; // the last beat is a slow, strained squeeze
    beat += Math.min(1, s) * pulse(t - b, len);
    atria += Math.min(1, s) * 0.85 * pulse(t - b + 0.12, 0.2);
  }
  const frozen = ss(t, EV.finalBeat + 0.25, 2.4) * (1 - 0.55 * ss(t, 18.7, 19.4) - 0.45 * ss(t, EV.beat0, EV.beat0 + 0.12)); // the colour floods back on the first beat
  const twitch = Math.sin((t - EV.twitch) * 60) * Math.exp(-Math.max(0, t - EV.twitch) * 10) * (t > EV.twitch ? 1 : 0) * 0.9;
  return {beat: clamp(beat), atria: clamp(atria), frozen, twitch, kick: 1.9 * pulse(t - EV.beat0, 0.32)};
};

// ---------------------------------------------------------------- the frog's place in the forest
export type Place = {x: number; y: number; s: number};
export const N: Place = {x: 0, y: 0, s: 1};
export const M: Place = {x: -50, y: -12, s: 0.5};
export const Q: Place = {x: -25, y: -6, s: 0.74};
/** one hop's placement: a short push (the body moves a little as the legs extend), then a ballistic arc */
const hopPlace = (t: number, t0: number, t1: number, A: Place, B: Place, h: number): Place => {
  const tp = t0 + PUSH;
  if (t < tp) return A;
  const u = clamp((t - tp) / (t1 - tp));
  const k = u;
  return {x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * 4 * u * (1 - u), s: lerp(A.s, B.s, k ** 1.15)};
};
export const placeAt = (t: number): Place => {
  if (t < EV.out2a) return N;
  if (t < EV.launch) return M;
  if (t < EV.land) return hopPlace(t, EV.launch, EV.land, M, Q, 26);
  if (t < EV.launch2) return Q;
  if (t < EV.land2) return hopPlace(t, EV.launch2, EV.land2, Q, N, 22);
  return N;
};
export const mapP = (c: {x: number; y: number; w: number}, p: Place) => ({x: p.x + p.s * c.x, y: p.y + p.s * c.y, w: c.w * p.s});
export const unmapP = (c: {x: number; y: number; w: number}, p: Place) => ({x: (c.x - p.x) / p.s, y: (c.y - p.y) / p.s, w: c.w / p.s});

// ---------------------------------------------------------------- the frog
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
const TC = pt(15, -2.5); // the trunk cutaway's centre (body frame)
const cutAt = (t: number): FrogState['cut'] => {
  if (t < EV.out2b) {
    const r = mono(t, [[0, 4.6], [0.3, 5.0], [0.95, 8.0], [2.0, 8.8], [EV.wide0, 9.4], [EV.wide1, 17.5]]) * (1 - ss(t, 14.2, 14.75));
    return {c: lerp2(HEART_B, TC, ss(t, EV.wide0, EV.wide1)), r, layers: 1};
  }
  if (t < EV.whole1 + 0.1) {
    const r = mono(t, [[17.7, 0], [18.45, 7.4], [EV.circ0, 7.6], [EV.circ1, 17.5], [20.3, 17.5], [20.75, 0]]);
    return {c: lerp2(HEART_B, TC, ss(t, EV.circ0, EV.circ1)), r: Math.max(0, r), layers: 1};
  }
  return {c: HEART_B, r: 4.6 * ss5(t, EV.reopen0, EV.reopen1), layers: 1};
};
/** one hop's pose: the crouch, the push-off (the legs drive against the ground), the flight (legs trailing, then
 * tucked, arms reaching), the landing (absorbed, then settled) */
const hopPose = (t: number, c0: number, t0: number, t1: number, ts: number) => {
  const tp = t0 + PUSH;
  const crouch = ss(t, c0, t0) * (1 - ss(t, t0, t0 + 0.05)) + 0.85 * ss(t, t1, t1 + 0.07) * (1 - ss(t, t1 + 0.1, ts));
  if (t < t0) return {crouch, pitch: -24 - 8 * crouch, hind: 0, fore: 0, active: t > c0};
  if (t < tp) {
    const k = ss(t, t0, tp);
    return {crouch: 0, pitch: lerp(-30, -42, k), hind: 0.42 * k, fore: 0.25 * k, active: true};
  }
  if (t < t1) {
    const u = (t - tp) / (t1 - tp);
    return {crouch: 0, pitch: lerp(-42, 12, ss(u, 0.0, 0.95)), hind: lerp(0.42, 1, ss(u, 0, 0.22)) * (1 - 0.85 * ss(u, 0.45, 0.95)), fore: ss(u, 0.05, 0.4) * (1 - 0.55 * ss(u, 0.8, 1)), active: true};
  }
  return {crouch, pitch: -24 + 12 * (1 - ss(t, t1, ts)) * ss(t, t1, t1 + 0.05), hind: 0.2 * (1 - ss(t, t1, t1 + 0.25)), fore: 0.45 * (1 - ss(t, t1, t1 + 0.22)), active: t < ts};
};
const leapPose = (t: number) => {
  if (t < EV.crouch2) return hopPose(t, EV.crouch0, EV.launch, EV.land, EV.settle);
  return hopPose(t, EV.crouch2, EV.launch2, EV.land2, EV.settle2);
};
/** the opening's living motion (also the end's, on the same clock, so the loop runs through it) */
const aliveMotion = (tau: number) => ({
  dPitch: -4 * ss(tau, -0.8, 0.15),
  look: 0.5 * ss(tau, -0.6, 0.1),
  fore: 0.24 * Math.sin(Math.PI * clamp((tau + 0.45) / 0.55)) * (tau > -0.45 && tau < 0.1 ? 1 : 0),
  blink: pulse(tau + 0.62, 0.22),
});
export const frogAt = (t: number): FrogState => {
  const L = leapPose(t);
  // the hook clock: the end runs on the opening's clock; the motion stops where the ice catches it (0.35 s)
  const tau = t > 23 ? t - LOOP_T : Math.min(t, 0.35);
  const live = t < 12 || t > 23.35 ? aliveMotion(tau) : {dPitch: 0, look: 0, fore: 0, blink: 0};
  const breathing = t < 12 ? 1 - ss(t, 0.2, 0.4) : ss(t, 20.4, 20.6);
  const throat = breathing * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2.4 * (t > 23 ? t - LOOP_T : t))) + (t > 20.4 && t < 20.75 ? 0.5 * Math.sin(Math.PI * clamp((t - 20.4) / 0.35)) : 0);
  const frost = t < 12 ? ss(t, EV.wave0, EV.wave1) : t < EV.launch ? 1 - ss(t, EV.thaw0, EV.thaw1) : 0;
  const pale = t < 12 ? ss(t, 0.12, 0.75) : t < EV.launch ? 1 - ss(t, EV.thaw0 + 0.1, EV.thaw1 + 0.1) : 0;
  const cloud = t < 12 ? ss(t, 0.42, 0.66) : t < EV.launch ? 1 - ss(t, 17.4, 18.2) : 0;
  const lid = t < 12 ? 0.45 * ss(t, 0.5, 0.9) : t < EV.launch ? 0.45 * (1 - ss(t, EV.eyes0, EV.eyes1)) : 0;
  const pupil = t < 20 ? 0 : ss(t, 20.35, 20.6) * (1 - 0.7 * ss(t, 20.9, 21.6)) * (1 - ss(t, 22.4, 23.2));
  // the legs come alive: a long stretch of the hind leg, a push of the forelegs that lifts the body
  const stretch = t > 20.42 && t < 20.82 ? 0.42 * Math.sin(Math.PI * clamp((t - 20.42) / 0.38)) : 0;
  const lift = t > 20.5 && t < 20.86 ? 0.3 * Math.sin(Math.PI * clamp((t - 20.5) / 0.36)) : 0;
  const wet = t < 12 ? 0 : ss(t, EV.thaw0, EV.thaw1) * (1 - ss(t, 21.9, 23.3));
  const look = t > 20.4 && t < 23.35 ? 0.8 * ss(t, 20.45, 20.75) * (1 - ss(t, 22.6, 23.3)) : live.look;
  const leaves = t > 14 && t < EV.launch ? ss(t, 14.45, 14.8) : 0;
  const base = {
    root: pt(SIT.root.x, SIT.root.y + L.crouch * 1.4 - lift * 2), pitch: L.pitch + live.dPitch - 5 * lift, hind: Math.max(L.hind, stretch), fore: Math.max(L.fore, live.fore + lift), crouch: L.crouch,
    frost, pale, cloud, blink: clamp(Math.max(lid, live.blink)), throat, wet, look, pupil, cut: cutAt(t), leaves, t,
  };
  return {...base, root: add(base.root, plantOffset(t))};
};
/** the toe of the hind foot for a pose (frog space) */
const toeOf = (t: number) => {
  const L = leapPose(t);
  const s = {root: pt(SIT.root.x, SIT.root.y + L.crouch * 1.4), pitch: L.pitch, hind: L.hind, fore: L.fore, crouch: L.crouch} as FS_;
  const c = hindLeg(s);
  return c.pts[c.pts.length - 1];
};
/** during each push-off the body is carried so the toes stay planted; in the flight that offset eases away */
export const plantOffset = (t: number) => {
  for (const [t0, t1] of [[EV.launch, EV.land], [EV.launch2, EV.land2]]) {
    const tp = t0 + PUSH;
    if (t >= t0 && t < tp) return sub(toeOf(t0), toeOf(t));
    if (t >= tp && t < t1) {
      const o = sub(toeOf(t0), toeOf(tp));
      const u = clamp((t - tp) / (t1 - tp));
      return mul(o, 1 - u); // the arc runs straight on from where the push left the body
    }
  }
  return pt(0, 0);
};
/** leaf litter kicked up at each push-off and landing: [time, place, origin in frog space] */
export const kicks = (): [number, Place, P][] => [
  [EV.launch + 0.05, M, toeOf(EV.launch)], [EV.land, Q, toeOf(EV.land + 0.01)], [EV.launch2 + 0.05, Q, toeOf(EV.launch2)], [EV.land2, N, toeOf(EV.land2 + 0.01)],
];
/** the leaves that were on its back, sliding off at take-off (they stay at the wintering spot) */
export const fallenLeavesAt = (t: number) => (t < EV.launch ? 0 : clamp((t - EV.launch) / 0.55));

// ---------------------------------------------------------------- anatomy and tissue
export const anatomyAt = (t: number): AnatomyState => {
  // ice creeps in round the labouring heart before its last beat, then bursts through the pericardium after it
  const iceA = Math.max(0.5 * ss(t, 0.75, EV.finalBeat), ss(t, EV.finalBeat + 0.05, 2.5));
  return {
    heart: heartAt(t),
    ice: t < 15 ? iceA : 1,
    iceFront: t < 15 ? lerp(31, -3, ss(t, 2.9, 4.1)) : -3,
    frozen: t < 15 ? ss(t, EV.finalBeat + 0.05, 2.4) : 1 - ss(t, 18.6, 19.5),
    breathe: (t < 1 ? 0.6 * (1 - ss(t, 0.2, 0.45)) : 0) - 0.75 * ss(t, EV.lungs0, EV.lungs1) * (t < 15 ? 1 : 0) + (t > 19.6 ? 0.5 * (0.5 + 0.5 * Math.sin(t * 15)) * ss(t, 19.8, 20.2) : 0),
    sugar: t < 15 ? ss(t, EV.sugar0, 9.8) : 0,
    flow: Math.max(0, t - EV.sugar0) * 0.9,
    melt: t < 15 ? 0 : 0.6 * ss(t, 18.4, 19.3) + 0.4 * ss(t, EV.beat0, EV.beat0 + 0.25),
    circ: t > 15 ? ss(t, EV.beat0, EV.beat0 + 0.25) : 0,
    pulses: BEATS.filter(([b]) => b >= EV.beat0 - 1e-6 && b <= t).map(([b]) => b),
    shock: t > 15 ? clamp((t - EV.beat0) / 0.45) : 0,
    shatter: t > 15 ? ss(t, EV.beat0, EV.beat0 + 0.35) : 0,
    veinGlow: t < 15 ? ss(t, EV.sugar0 + 0.05, 10.05) : 0,
    hint: t < 15 ? 0.35 * ss(t, 2.2, 3.2) * (1 - ss(t, 4.3, 4.9)) * (0.75 + 0.25 * Math.sin(t * 9)) : 0,
    t,
  };
};
export const microAt = (t: number): MicroState => {
  const v2 = t > 9;
  const hold = v2 ? ss(t, EV.hold0, EV.hold1) : 0;
  return {
    t,
    ice: v2 ? 0.8 + 0.2 * ss(t, EV.spikes0, 13.4) : ss(t, 4.6, 5.5),
    front: v2 ? 4000 : lerp(-1500, 1700, ss(t, 4.6, 5.7)),
    shrink: v2 ? 0.85 * (1 - 0.3 * hold) : ss(t, 5.6, 6.6) * 0.95,
    water: v2 ? 0 : ss(t, EV.water0 - 0.1, 5.8) * (1 - ss(t, 6.5, 6.9)),
    crumple: v2 ? 1 : ss(t, EV.crumple0, 7.75),
    sugar: v2 ? ss(t, EV.rings0, EV.rings0 + 0.3) : 0,
    sc: Math.max(0, t - EV.rings0),
    hold,
    spikes: v2 ? ss(t, EV.spikes0, EV.spikes1) : 0,
    dent: v2 ? 1 - 0.85 * hold : ss(t, EV.dent0, 7.6),
    spear: v2 ? 1 : ss(t, EV.spear0, 7.4),
    blood: 0.15,
    melt: 0,
  };
};

// ---------------------------------------------------------------- the forest
export const POCKET = pt(-3, -14);
/** the sky's clock in days, over the winter: from midday through a night to the next morning */
const sunAt = (t: number) => (t < EV.days0 - 0.2 ? undefined : lerp(0.28, 1.12, ss(t, EV.days0, EV.days1)) + 0.08 * ss(t, EV.days1, 18.5));
export const envAt = (t: number): EnvState => {
  const end = ss(t, EV.cold0, LOOP_T);
  const cold = t < 12 ? lerp(0.7, 1, ss(t, 0.05, 0.7)) : t < EV.cold0 ? 1 - ss(t, EV.spring0, 17.1) : 0.7 * end;
  const frost = t < 12 ? lerp(0.15, 1, ss(t, 0.05, 0.7)) : t < EV.cold0 ? 1 - ss(t, 16.5, 17.3) : 0.15 * end;
  const sun = sunAt(t);
  const ph = sun === undefined ? 0 : ((sun % 1) + 1) % 1;
  return {
    t, cold, frost,
    frostX: t < 12 ? lerp(-70, 90, ss(t, EV.wave0 - 0.05, EV.wave1)) : t > EV.cold0 ? -70 : 90,
    snow: t > EV.out2a - 0.3 && t < 17.6 ? 1 : 0,
    depth: lerp(4, 52, ss(t, EV.days0, 16.25)),
    falling: ss(t, 14.4, 14.8) * (1 - ss(t, 16.05, 16.35)),
    night: ph > 0.5 ? 0.62 * Math.sin((Math.PI * (ph - 0.5)) / 0.5) : 0,
    melt: ss(t, EV.melt0, EV.melt1),
    wet: ss(t, 16.7, 17.3) * (1 - ss(t, EV.cold0, LOOP_T - 0.1)),
    shoots: t > 16 && t < 21.3 ? ss(t, 16.7, 17.8) : 0,
    pocket: POCKET,
    sun,
    sunOp: 1 - ss(t, EV.cold0, LOOP_T - 0.25),
  };
};
/** screen-edge frost (the cold entering the frame) and the spring warmth */
export const edgeFrostAt = (t: number) => (t < 12 ? lerp(0.22, 1, ss(t, EV.wave0, 0.75)) : t < EV.cold0 ? (t < EV.spring0 ? 0.75 : 0.75 * (1 - ss(t, EV.spring0, 17.0))) : 0.22 * ss(t, EV.cold0, LOOP_T));
export const warmAt = (t: number) => (t < 12 ? 0 : ss(t, EV.spring0, 17.1) * (1 - ss(t, EV.cold0, LOOP_T - 0.2)));

// ---------------------------------------------------------------- the camera
export type Cam = {x: number; y: number; w: number};
/** world: the forest's camera; local: the same camera in the frog's own space (for the cutaway and the tissue) */
export type WCam = Cam & {world: 'frog' | 'micro'; roll?: number; local: Cam; place: Place};
export const zoomAbout = (u: number, A: Cam, B: Cam): Cam => {
  const e = clamp(u);
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv};
  const P0 = pt((A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w));
  return {x: P0.x + (A.x - P0.x) * (wv / A.w), y: P0.y + (A.y - P0.y) * (wv / A.w), w: wv};
};
// micro <-> frog space (the tissue is nested at MICRO_B in the body frame, rotated so the capillary runs along the vein)
export const K_MICRO = 0.002;
export const MICRO_ROT_B = 48.2; // degrees, in the body frame
export const MICRO_ROLL = MICRO_ROT_B + SIT.pitch; // on screen
const rotD = (p: P, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return pt(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a));
};
const SITS = {...SIT} as FrogState;
export const microToWorld = (q: P) => toWorld(SITS, add(MICRO_B, rotD(mul(q, K_MICRO), MICRO_ROT_B)));
export const worldToMicro = (p: P) => {
  const a = (SIT.pitch * Math.PI) / 180;
  const d = sub(p, SIT.root);
  const b = pt(d.x * Math.cos(-a) - d.y * Math.sin(-a), d.x * Math.sin(-a) + d.y * Math.cos(-a));
  return mul(rotD(sub(b, MICRO_B), -MICRO_ROT_B), 1 / K_MICRO);
};
export const toHost = (c: Cam): Cam => {
  const q = microToWorld(pt(c.x, c.y));
  return {x: q.x, y: q.y, w: c.w * K_MICRO};
};
export const toMicro = (c: Cam): Cam => {
  const q = worldToMicro(pt(c.x, c.y));
  return {x: q.x, y: q.y, w: c.w / K_MICRO};
};
export const H = toWorld(SITS, HEART_B);
export const MW = toWorld(SITS, MICRO_B);
export const C0: Cam = {x: 4.5, y: -18, w: 40};
const HEART_CLOSE: Cam = {x: H.x + 0.3, y: H.y + 0.2, w: 12.6};
const TRUNK1: Cam = {x: -10, y: -16.5, w: 30};
const TRUNK2: Cam = {x: -11.5, y: -15, w: 29};
const TRUNK2b: Cam = {x: -15.5, y: -16.5, w: 22};
const MC1: Cam = {x: 0, y: 60, w: 780};
const MC1w: Cam = {x: 80, y: 20, w: 700};
const MCmid: Cam = {x: HERO.c.x - 60, y: HERO.c.y - 70, w: 500};
const MChero: Cam = {x: HERO.c.x + 10, y: HERO.c.y + 5, w: 350};
const vesselAt = (x: number, w: number): Cam => ({x, y: capY(x) + 6, w});
const MC2: Cam = vesselAt(HERO.c.x + 230, 330);
const MC2b: Cam = vesselAt(HERO.c.x + 40, 320);
const MC3: Cam = {x: HERO.c.x - 5, y: HERO.c.y - 45, w: 330};
const MC3b: Cam = {x: HERO.c.x + 12, y: HERO.c.y - 5, w: 270};
const WA: Cam = {x: 5, y: -26, w: 62};
const W_START: Cam = {x: -9, y: -60, w: 146};
const W_MID: Cam = {x: -3, y: -42, w: 104};
void WA;
const WB: Cam = {x: 0, y: -66, w: 150};
const WC: Cam = {x: -2, y: -44, w: 118};
const WD: Cam = {x: 2, y: -26, w: 72};
const CHEST: Cam = {x: H.x + 3, y: H.y - 1, w: 38};
const HEART2: Cam = {x: H.x + 0.3, y: H.y + 0.2, w: 13.5};
const TRUNK_R: Cam = {x: -7, y: -17, w: 31};
const WHOLE: Cam = {x: 2, y: -21, w: 74};
/** a move along zoomAbout's path whose progress follows smooth keys */
const move = (t: number, A: Cam, B: Cam, keys: [number, number][]) => zoomAbout(mono(t, keys), A, B);
/** a smooth glide through several cameras (x, y and log width on one velocity-continuous curve) */
const glide = (t: number, keys: [number, Cam][]): Cam => ({
  x: mono(t, keys.map(([k, c]) => [k, c.x])), y: mono(t, keys.map(([k, c]) => [k, c.y])), w: Math.exp(mono(t, keys.map(([k, c]) => [k, Math.log(c.w)]))),
});
const localCam = (t: number): {c: Cam; micro: boolean} => {
  const f = (c: Cam) => ({c, micro: false});
  const m = (c: Cam) => ({c, micro: true});
  if (t < EV.close) return f(move(t, C0, HEART_CLOSE, [[0, 0], [0.25, 0.14], [0.6, 0.62], [EV.close, 1]]));
  if (t < EV.wide0) return f(move(t, HEART_CLOSE, {...HEART_CLOSE, w: 10.8}, [[EV.close, 0], [EV.wide0, 1]]));
  if (t < EV.wide1) return f(move(t, {...HEART_CLOSE, w: 10.8}, TRUNK1, [[EV.wide0, 0], [EV.wide1, 1]]));
  if (t < EV.dive1) return f(move(t, TRUNK1, toHost(MC1), [[EV.wide1, 0], [EV.dive1, 1]]));
  if (t < EV.out1a) return m(glide(t, [[EV.dive1, MC1], [EV.step2, MC1w], [EV.step3, MCmid], [EV.out1a, MChero]]));
  if (t < EV.out1b) return f(move(t, toHost(MChero), TRUNK2, [[EV.out1a, 0], [EV.out1b, 1]]));
  if (t < EV.entry2a) return f(move(t, TRUNK2, TRUNK2b, [[EV.out1b, 0], [EV.entry2a, 1]]));
  if (t < EV.entry2b) return f(move(t, TRUNK2b, toHost(MC2), [[EV.entry2a, 0], [EV.entry2b, 1]]));
  if (t < EV.track1) return m(move(t, MC2, MC2b, [[EV.entry2b, 0], [EV.track1, 1]]));
  if (t < EV.toCell) return m(move(t, MC2b, MC3, [[EV.track1, 0], [EV.toCell, 1]]));
  if (t < EV.out2a) return m(move(t, MC3, MC3b, [[EV.toCell, 0], [EV.out2a, 1]]));
  if (t < EV.out2b) return f(move(t, toHost(MC3b), W_START, [[EV.out2a, 0], [EV.out2b, 1]]));
  if (t < EV.chest) return f(glide(t, [[EV.out2b, W_START], [EV.spring0, W_MID], [EV.chest, WD]]));
  if (t < EV.heartIn0) return f(move(t, WD, CHEST, [[EV.chest, 0], [EV.heartIn0, 1]]));
  if (t < EV.heartIn1) return f(move(t, CHEST, HEART2, [[EV.heartIn0, 0], [EV.heartIn1, 1]]));
  if (t < EV.circ0) return f(move(t, HEART2, {...HEART2, w: 12.2}, [[EV.heartIn1, 0], [EV.circ0, 1]]));
  if (t < EV.circ1) return f(move(t, {...HEART2, w: 12.2}, TRUNK_R, [[EV.circ0, 0], [EV.circ1, 1]]));
  return f(move(t, TRUNK_R, WHOLE, [[EV.circ1, 0], [EV.whole1, 1]]));
};
const W_M = mapP(WHOLE, M);
const LEAP_KEYS: [number, number, number, number][] = [
  [EV.whole1, W_M.x, W_M.y, W_M.w],
  [EV.launch, -48, -25, W_M.w * 1.3],
  [EV.launch + 0.18, -44, -31, 52],
  [21.47, -35, -30, 55],
  [EV.land, -26, -21, 50],
  [EV.launch2, -23, -23, 53],
  [EV.launch2 + 0.18, -19, -31, 60],
  [22.76, -10, -28, 57],
  [EV.land2, 0, -21, 48],
  [LOOP_T, C0.x, C0.y, C0.w],
];
export const camAt = (t: number): WCam => {
  if (t < EV.whole1) {
    const {c, micro} = localCam(t);
    const p = placeAt(t);
    // the first heartbeat punches the camera in and shakes it
    const kick = pulse(t - EV.beat0, 0.34);
    const c2 = kick > 0 ? {x: c.x + 0.014 * c.w * kick * noise1(t * 40, 3), y: c.y + 0.014 * c.w * kick * noise1(t * 40, 7), w: c.w * (1 - 0.08 * kick)} : c;
    if (micro) return {...c2, world: 'micro', roll: MICRO_ROLL, local: toHost(c2), place: p};
    return {...mapP(c2, p), world: 'frog', local: c2, place: p};
  }
  const k = (i: number) => LEAP_KEYS.map((r) => [r[0], r[i]] as [number, number]);
  const wc = {x: mono(t, k(1)), y: mono(t, k(2)), w: Math.exp(mono(t, LEAP_KEYS.map((r) => [r[0], Math.log(r[3])] as [number, number])))};
  const p = placeAt(t);
  return {...wc, world: 'frog', local: unmapP(wc, p), place: p};
};
/** the nested tissue's reveal radius (mm, body frame) for the frog-space camera */
export const microReveal = (c: Cam) => 1.45 * (Math.hypot(c.w / 2, (c.w * 16) / 9 / 2) + Math.hypot(c.x - MW.x, c.y - MW.y)) * ss(-Math.log(c.w), -Math.log(8.5), -Math.log(2.6));
