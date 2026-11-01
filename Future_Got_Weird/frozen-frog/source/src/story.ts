// V2 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). Worlds: 'frog' (the forest
// floor and the frog; the frog has a placement P(t) in the forest: the opening spot N, the wintering spot M a little
// behind and to the left, and the leap between them) and 'micro' (the tissue, u). Interior shots are framed in the
// frog's own space and mapped through P. One continuous body:
//
//   0.00-0.30  ECU, frog alive and moving: head rising, a blink, a front foot stepping, throat pumping, heart beating
//   0.30-0.95  a wave of ice sweeps up over the frog from the ground and the rear (a bright front, crystals behind it);
//              each limb sets as it passes; the lens clouds and the lids sag; the camera already pushing in
//   0.95-1.34  through the chest to the heart; the final, strained beat at 1.336 s; all sound but the voice cuts out
//   1.34-2.60  the heart is motionless; ice bursts into the pericardium; frost glazes the heart
//   2.60-4.40  the window opens over the trunk: ice sweeping between the organs, the lungs sag ("Ice spreads...")
//   4.40-5.15  a dive into the back muscle
//   5.15-8.45  the cells: ice grows between them, water is pulled out, they shrink; an ice spear drives into one cell's
//              side and dents it; it buckles (the danger); the camera pushes in on it
//   8.45-9.30  out to the trunk, framed on the liver ("But its liver")
//   9.20-10.15 the liver flares amber and pours glowing glucose into the vein ("releases massive amounts of sugar")
//   10.15-10.95 the camera follows the glow down the vein into a capillary: inside the bloodstream
//   10.95-11.60 tracking along the vessel with the glowing molecules
//   11.60-12.20 they leave the vessel and pass the threatened cell's membrane through its transporters
//   12.00-13.90 the cell fills with glucose, rounds out, pushes the dent back; the spear and new needles stop at the
//              membrane while the ice outside thickens ("while the rest of its body freezes")
//   13.90-15.00 out through the body to the frog, frozen, lids half shut, in a pocket under leaves and snow
//   15.00-16.60 days pass: the camera rises to the sky, the sun sets, the moon crosses, the sun rises; snow piles up
//   16.45-18.30 spring: warm light, the snow slumps and melts, the frost on the frog turns to beads; push to the chest
//   18.30-19.60 into the chest: the pericardial ice melts; one twitch ("starts", 19.18); the powerful first pulse on
//              "beating" (19.60), with a kick
//   19.65-20.15 circulation returns: the window opens over the trunk, red pulses race out along the vessels per beat
//   20.15-20.80 out to the face: the eyes open, the throat pumps, the legs stretch
//   20.80-21.85 a crouch and one leap toward the camera ("HOPS", 21.08): it grows as it comes, lands in the opening's
//              spot and framing
//   21.85-24.50 it settles; the cutaway reopens on the beat; the cold creeps back in; the head lifts and the foot steps
//              into frame 0
import {P, add, mul, pt, sub} from './core/geo';
import {FPS, FRAMES, clamp, lerp, noise1, ss, ss5, word} from './lib';
import {FrogState, HEART_B, MICRO_B, SIT, toWorld} from './art/frog';
import {AnatomyState, HeartState} from './art/anatomy';
import {MicroState, HERO, capY} from './art/micro';
import {EnvState} from './art/forest';

const w = word;
export const T = {
  freeze: w('freeze').start, heart: w('HEART').start, stops: w('STOPS!').start, stopsEnd: w('STOPS!').end,
  ice: w('Ice').start, body: w('body,').start, breathing: w('breathing,').start, dead: w('dead.').start, deadEnd: w('dead.').end,
  but: w('But').start, liver: w('liver').start, releases: w('releases').start, massive: w('massive').start, sugar: w('sugar,').start, sugarEnd: w('sugar,').end,
  protecting: w('protecting').start, cells: w('cells').start, while: w('while').start, freezes: w('freezes!').start, freezesEnd: w('freezes!').end,
  survive: w('survive').start, weeks: w('weeks!').start, weeksEnd: w('weeks!').end,
  spring: w('spring').start, melts: w('melts,').start, meltsEnd: w('melts,').end, heart2: w('heart').start, starts: w('starts').start,
  beating: w('beating').start, again: w('again…').start, hops: w('HOPS').start, away: w('AWAY').start, happened: w('happened!').start, happenedEnd: w('happened!').end,
};
export const LOOP_T = FRAMES / FPS;
/** the heartbeat period: LOOP_T - 11 * PERIOD = 19.60 s, the powerful first pulse (on "beating"); 3 * PERIOD = 1.336 s,
 * the hook's final beat; and frame 0 is a beat */
export const PERIOD = 4.9 / 11;
export const EV = {
  wave0: 0.25, wave1: 0.85, finalBeat: 3 * PERIOD, cut: 3 * PERIOD + 0.09, close: 1.25,
  wide0: 2.6, wide1: 4.0, dive0: 4.4, dive1: 5.15, lungs0: 3.5, lungs1: 4.3,
  water0: 5.6, spear0: 6.8, dent0: 7.1, crumple0: 7.2, out1a: 8.45, out1b: 9.3, sugar0: 9.2, entry2a: 10.15, entry2b: 10.95,
  rings0: 10.1, track1: 11.6, toCell: 12.2, hold0: 12.0, hold1: 12.85, spikes0: 12.4, spikes1: 13.6, out2a: 13.9, out2b: 15.0,
  days0: 14.9, days1: 16.6, spring0: 16.45, melt0: 16.6, melt1: 17.6, thaw0: 17.7, thaw1: 18.6,
  heartIn0: 18.3, heartIn1: 18.9, twitch: T.starts, beat0: LOOP_T - 11 * PERIOD, circ0: 19.65, circ1: 20.15,
  faceOut1: 20.8, eyes0: 20.42, eyes1: 20.62, crouch0: 20.82, launch: T.hops, land: 21.85, settle: 22.35,
  reopen0: 22.6, reopen1: 23.5, cold0: 22.9,
};

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
  const b: Beat[] = [[-PERIOD, 1], [0, 1], [PERIOD, 1], [2 * PERIOD, 0.95], [EV.finalBeat, 1.1], [EV.twitch, 0.3], [EV.beat0, 1.35]];
  for (let n = 10; n >= 0; n--) b.push([LOOP_T - n * PERIOD, 1]);
  return b;
})();
export const heartAt = (t: number): HeartState => {
  let beat = 0, atria = 0;
  for (const [b, s] of BEATS) {
    const len = Math.abs(b - EV.finalBeat) < 1e-6 ? 0.4 : 0.26; // the final beat is a slow, strained squeeze
    beat += Math.min(1, s) * pulse(t - b, len);
    atria += Math.min(1, s) * 0.85 * pulse(t - b + 0.12, 0.2);
  }
  const frozen = ss(t, EV.finalBeat + 0.2, 2.1) * (1 - ss(t, 18.75, 19.45));
  const twitch = Math.sin((t - EV.twitch) * 60) * Math.exp(-Math.max(0, t - EV.twitch) * 10) * (t > EV.twitch ? 1 : 0) * 0.9;
  return {beat: clamp(beat), atria: clamp(atria), frozen, twitch, kick: pulse(t - EV.beat0, 0.34)};
};

// ---------------------------------------------------------------- the frog's place in the forest
export type Place = {x: number; y: number; s: number};
export const N: Place = {x: 0, y: 0, s: 1};
export const M: Place = {x: -50, y: -12, s: 0.5};
const flightU = (t: number) => clamp((t - EV.launch) / (EV.land - EV.launch));
export const placeAt = (t: number): Place => {
  if (t < EV.out2a) return N;
  if (t < EV.launch) return M;
  if (t >= EV.land) return N;
  const u = flightU(t);
  // a leap toward the camera: it comes forward (grows) and to the right, rising and falling
  const k = ss(u, 0, 1) * 0.6 + u * 0.4;
  return {x: lerp(M.x, N.x, k), y: lerp(M.y, N.y, k) - 30 * 4 * u * (1 - u), s: lerp(M.s, N.s, u ** 1.25)};
};
export const mapP = (c: {x: number; y: number; w: number}, p: Place) => ({x: p.x + p.s * c.x, y: p.y + p.s * c.y, w: c.w * p.s});
export const unmapP = (c: {x: number; y: number; w: number}, p: Place) => ({x: (c.x - p.x) / p.s, y: (c.y - p.y) / p.s, w: c.w / p.s});

// ---------------------------------------------------------------- the frog
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
const TC = pt(15, -2.5); // the trunk cutaway's centre (body frame)
const cutAt = (t: number): FrogState['cut'] => {
  if (t < EV.out2b) {
    const r = mono(t, [[0, 4.6], [0.5, 4.8], [1.1, 7.0], [2.0, 8.8], [EV.wide0, 9.6], [EV.wide1, 17.5]]) * (1 - ss(t, 14.25, 14.85));
    return {c: lerp2(HEART_B, TC, ss(t, EV.wide0, EV.wide1)), r, layers: 1};
  }
  if (t < EV.faceOut1 + 0.1) {
    const r = mono(t, [[18.2, 0], [18.85, 7.2], [EV.circ0, 7.4], [EV.circ1, 17.5], [20.3, 17.5], [20.75, 0]]);
    return {c: lerp2(HEART_B, TC, ss(t, EV.circ0, EV.circ1)), r: Math.max(0, r), layers: 1};
  }
  return {c: HEART_B, r: 4.6 * ss5(t, EV.reopen0, EV.reopen1), layers: 1};
};
/** the leap's pose (crouch, take-off, flight, landing) */
const leapPose = (t: number) => {
  const u = flightU(t);
  const fly = t > EV.launch && t < EV.land;
  const crouch = ss(t, EV.crouch0, EV.launch) * (1 - ss(t, EV.launch, EV.launch + 0.06)) + 0.8 * ss(t, EV.land, EV.land + 0.07) * (1 - ss(t, EV.land + 0.1, EV.settle));
  const pitch = fly ? lerp(-46, 12, ss(u, 0.05, 0.95)) : t >= EV.land ? -24 + 12 * (1 - ss(t, EV.land, EV.settle)) * ss(t, EV.land, EV.land + 0.05) : -24 - 7 * crouch;
  const hind = fly ? ss(u, 0, 0.16) * (1 - 0.85 * ss(u, 0.5, 0.95)) : t > EV.land ? 0.2 * (1 - ss(t, EV.land, EV.land + 0.25)) : 0;
  const fore = fly ? ss(u, 0.12, 0.45) * (1 - 0.6 * ss(u, 0.8, 1)) : t > EV.land ? 0.45 * (1 - ss(t, EV.land, EV.land + 0.22)) : 0;
  return {crouch, pitch, hind, fore};
};
/** the opening's living motion (also the end's, on the same clock, so the loop runs through it) */
const aliveMotion = (tau: number) => ({
  dPitch: -4 * ss(tau, -0.7, 0.25),
  look: 0.5 * ss(tau, -0.5, 0.2),
  fore: 0.24 * Math.sin(Math.PI * clamp((tau + 0.3) / 0.55)) * (tau > -0.3 && tau < 0.25 ? 1 : 0),
  blink: pulse(tau - 0.06, 0.22),
});
export const frogAt = (t: number): FrogState => {
  const L = leapPose(t);
  // the hook clock: the end runs on the opening's clock; the motion stops where the ice catches it (0.7 s)
  const tau = t > 23 ? t - LOOP_T : Math.min(t, 0.7);
  const live = t < 12 || t > 23 ? aliveMotion(tau) : {dPitch: 0, look: 0, fore: 0, blink: 0};
  const breathing = t < 12 ? 1 - ss(t, 0.45, 0.65) : ss(t, 20.5, 20.75);
  const throat = breathing * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2.4 * (t > 23 ? t - LOOP_T : t)));
  const frost = t < 12 ? ss(t, EV.wave0, EV.wave1) : t < EV.launch ? 1 - ss(t, EV.thaw0, EV.thaw1) : 0;
  const pale = t < 12 ? ss(t, 0.35, 1.0) : t < EV.launch ? 1 - ss(t, EV.thaw0 + 0.1, EV.thaw1 + 0.1) : 0;
  const cloud = t < 12 ? ss(t, 0.7, 0.95) : t < EV.launch ? 1 - ss(t, 17.9, 18.8) : 0;
  // lids: sag as it freezes; open on the revival (the eyes open)
  const lid = t < 12 ? 0.45 * ss(t, 0.75, 1.1) : t < EV.launch ? 0.45 * (1 - ss(t, EV.eyes0, EV.eyes1)) : 0;
  // the legs come alive before the leap: a stretch of the hind leg, the toes, a front foot
  const stretch = t > 20.45 && t < EV.crouch0 + 0.05 ? 0.32 * Math.sin(Math.PI * clamp((t - 20.48) / 0.32)) : 0;
  const wet = t < 12 ? 0 : ss(t, EV.thaw0, EV.thaw1) * (1 - ss(t, 21.9, 23.3));
  const look = t > 20.5 && t < EV.settle ? 0.8 * ss(t, 20.6, 20.85) * (1 - ss(t, EV.land, EV.settle)) : live.look;
  const leaves = t > 14 && t < EV.launch ? ss(t, 14.55, 14.9) : 0;
  return {
    root: pt(SIT.root.x, SIT.root.y + L.crouch * 1.4), pitch: L.pitch + live.dPitch, hind: Math.max(L.hind, stretch), fore: Math.max(L.fore, live.fore + 0.5 * stretch), crouch: L.crouch,
    frost, pale, cloud, blink: clamp(Math.max(lid, live.blink)), throat, wet, look, cut: cutAt(t), leaves, t,
  };
};
/** the leaves that were on its back, sliding off at take-off (they stay at the wintering spot) */
export const fallenLeavesAt = (t: number) => (t < EV.launch ? 0 : clamp((t - EV.launch) / 0.55));

// ---------------------------------------------------------------- anatomy and tissue
export const anatomyAt = (t: number): AnatomyState => {
  const iceA = ss(t, EV.finalBeat, 2.2);
  return {
    heart: heartAt(t),
    ice: t < 15 ? iceA : 1,
    iceFront: t < 15 ? lerp(31, -3, ss(t, 2.5, 4.3)) : -3,
    frozen: t < 15 ? ss(t, EV.finalBeat, 2.2) : 1 - ss(t, 18.6, 19.5),
    breathe: (t < 1 ? 0.6 * (1 - ss(t, 0.4, 0.7)) : 0) - 0.75 * ss(t, EV.lungs0, EV.lungs1) * (t < 15 ? 1 : 0) + (t > 19.6 ? 0.5 * (0.5 + 0.5 * Math.sin(t * 15)) * ss(t, 19.8, 20.2) : 0),
    sugar: t < 15 ? ss(t, EV.sugar0, 9.9) : 0,
    flow: Math.max(0, t - EV.sugar0) * 0.9,
    melt: ss(t, 18.45, 19.25),
    circ: t > 15 ? ss(t, EV.beat0, EV.beat0 + 0.3) : 0,
    pulses: BEATS.filter(([b]) => b >= EV.beat0 - 1e-6 && b <= t).map(([b]) => b),
    t,
  };
};
export const microAt = (t: number): MicroState => {
  const v2 = t > 10;
  const hold = v2 ? ss(t, EV.hold0, EV.hold1) : 0;
  return {
    t,
    ice: v2 ? 0.8 + 0.2 * ss(t, EV.spikes0, 13.4) : ss(t, 5.2, 6.6),
    front: v2 ? 4000 : lerp(-1400, 1600, ss(t, 5.1, 7.0)),
    shrink: v2 ? 0.85 * (1 - 0.3 * hold) : ss(t, 5.8, 7.8) * 0.85,
    water: v2 ? 0 : ss(t, EV.water0, 6.1) * (1 - ss(t, 7.4, 8.0)),
    crumple: v2 ? 1 : ss(t, EV.crumple0, 8.2),
    sugar: v2 ? ss(t, EV.rings0, EV.rings0 + 0.3) : 0,
    sc: Math.max(0, t - EV.rings0),
    hold,
    spikes: v2 ? ss(t, EV.spikes0, EV.spikes1) : 0,
    dent: v2 ? 1 - 0.85 * hold : ss(t, EV.dent0, 7.95),
    spear: v2 ? 1 : ss(t, EV.spear0, 7.7),
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
  const cold = t < 12 ? lerp(0.7, 1, ss(t, 0.1, 1.0)) : t < EV.cold0 ? 1 - ss(t, EV.spring0, 17.3) : 0.7 * end;
  const frost = t < 12 ? lerp(0.15, 1, ss(t, 0.2, 1.0)) : t < EV.cold0 ? 1 - ss(t, 16.7, 17.6) : 0.15 * end;
  const sun = sunAt(t);
  const ph = sun === undefined ? 0 : ((sun % 1) + 1) % 1;
  return {
    t, cold, frost,
    frostX: t < 12 ? lerp(-70, 90, ss(t, EV.wave0 - 0.05, EV.wave1)) : t > EV.cold0 ? -70 : 90,
    snow: t > EV.out2a - 0.3 && t < 18 ? 1 : 0,
    depth: lerp(6, 34, ss(t, EV.days0, 16.3)),
    falling: ss(t, 14.5, 14.9) * (1 - ss(t, 16.1, 16.45)),
    night: ph > 0.5 ? 0.62 * Math.sin((Math.PI * (ph - 0.5)) / 0.5) : 0,
    melt: ss(t, EV.melt0, EV.melt1),
    wet: ss(t, 16.9, 17.6) * (1 - ss(t, EV.cold0, LOOP_T - 0.1)),
    shoots: t > 16 && t < 21.3 ? ss(t, 16.9, 18.2) : 0,
    pocket: POCKET,
    sun,
  };
};
/** screen-edge frost (the cold entering the frame) and the spring warmth */
export const edgeFrostAt = (t: number) => (t < 12 ? lerp(0.22, 1, ss(t, EV.wave0, 1.0)) : t < EV.cold0 ? (t < EV.spring0 ? 0.75 : 0.75 * (1 - ss(t, EV.spring0, 17.2))) : 0.22 * ss(t, EV.cold0, LOOP_T));
export const warmAt = (t: number) => (t < 12 ? 0 : ss(t, EV.spring0, 17.3) * (1 - ss(t, EV.cold0, LOOP_T - 0.2)));

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
const TRUNK1: Cam = {x: -9, y: -16.5, w: 31};
const TRUNK1b: Cam = {x: -15, y: -17, w: 24};
const TRUNK2: Cam = {x: -11.5, y: -15, w: 29};
const TRUNK2b: Cam = {x: -15.5, y: -16.5, w: 22};
const MC1: Cam = {x: 0, y: 60, w: 760};
const MC1b: Cam = {x: HERO.c.x - 20, y: HERO.c.y - 10, w: 430};
const vesselAt = (x: number, w: number): Cam => ({x, y: capY(x) + 6, w});
const MC2: Cam = vesselAt(HERO.c.x + 230, 330);
const MC2b: Cam = vesselAt(HERO.c.x + 40, 320);
const MC3: Cam = {x: HERO.c.x - 5, y: HERO.c.y - 45, w: 330};
const MC3b: Cam = {x: HERO.c.x + 12, y: HERO.c.y - 5, w: 270};
const WA: Cam = {x: 5, y: -26, w: 62};
const WB: Cam = {x: 0, y: -62, w: 150};
const WC: Cam = {x: -2, y: -44, w: 118};
const CHEST: Cam = {x: H.x + 3, y: H.y - 1, w: 40};
const HEART2: Cam = {x: H.x + 0.3, y: H.y + 0.2, w: 13.5};
const TRUNK_R: Cam = {x: -7, y: -17, w: 31};
const FACE: Cam = {x: 9, y: -22, w: 42};
/** a move along zoomAbout's path whose progress follows smooth keys */
const move = (t: number, A: Cam, B: Cam, keys: [number, number][]) => zoomAbout(mono(t, keys), A, B);
const localCam = (t: number): {c: Cam; micro: boolean} => {
  const f = (c: Cam) => ({c, micro: false});
  const m = (c: Cam) => ({c, micro: true});
  if (t < EV.close) return f(move(t, C0, HEART_CLOSE, [[0, 0], [0.5, 0.12], [0.95, 0.62], [EV.close, 1]]));
  if (t < EV.wide0) return f(move(t, HEART_CLOSE, {...HEART_CLOSE, w: 11.2}, [[EV.close, 0], [EV.wide0, 1]]));
  if (t < EV.wide1) return f(move(t, {...HEART_CLOSE, w: 11.2}, TRUNK1, [[EV.wide0, 0], [EV.wide1, 1]]));
  if (t < EV.dive0) return f(move(t, TRUNK1, TRUNK1b, [[EV.wide1, 0], [EV.dive0, 1]]));
  if (t < EV.dive1) return f(move(t, TRUNK1b, toHost(MC1), [[EV.dive0, 0], [EV.dive1, 1]]));
  if (t < EV.out1a) return m(move(t, MC1, MC1b, [[EV.dive1, 0], [EV.out1a, 1]]));
  if (t < EV.out1b) return f(move(t, toHost(MC1b), TRUNK2, [[EV.out1a, 0], [EV.out1b, 1]]));
  if (t < EV.entry2a) return f(move(t, TRUNK2, TRUNK2b, [[EV.out1b, 0], [EV.entry2a, 1]]));
  if (t < EV.entry2b) return f(move(t, TRUNK2b, toHost(MC2), [[EV.entry2a, 0], [EV.entry2b, 1]]));
  if (t < EV.track1) return m(move(t, MC2, MC2b, [[EV.entry2b, 0], [EV.track1, 1]]));
  if (t < EV.toCell) return m(move(t, MC2b, MC3, [[EV.track1, 0], [EV.toCell, 1]]));
  if (t < EV.out2a) return m(move(t, MC3, MC3b, [[EV.toCell, 0], [EV.out2a, 1]]));
  if (t < EV.out2b) return f(move(t, toHost(MC3b), WA, [[EV.out2a, 0], [EV.out2b, 1]]));
  if (t < 15.85) return f(move(t, WA, WB, [[EV.out2b, 0], [15.85, 1]]));
  if (t < EV.spring0 + 0.25) return f(move(t, WB, WC, [[15.85, 0], [EV.spring0 + 0.25, 1]]));
  if (t < EV.heartIn0) return f(move(t, WC, CHEST, [[EV.spring0 + 0.25, 0], [EV.heartIn0, 1]]));
  if (t < EV.heartIn1) return f(move(t, CHEST, HEART2, [[EV.heartIn0, 0], [EV.heartIn1, 1]]));
  if (t < EV.circ0) return f(move(t, HEART2, {...HEART2, w: 12.6}, [[EV.heartIn1, 0], [EV.circ0, 1]]));
  if (t < EV.circ1) return f(move(t, {...HEART2, w: 12.6}, TRUNK_R, [[EV.circ0, 0], [EV.circ1, 1]]));
  return f(move(t, TRUNK_R, FACE, [[EV.circ1, 0], [EV.faceOut1, 1]]));
};
const LEAP_KEYS: [number, number, number, number][] = [
  [EV.faceOut1, ...((): [number, number, number] => { const c = mapP(FACE, M); return [c.x, c.y, c.w]; })()],
  [EV.launch, -44, -22, 40],
  [21.4, -22, -24, 56],
  [EV.land, C0.x - 4, C0.y - 3, 58],
  [22.9, C0.x - 0.4, C0.y - 0.4, 41.5],
  [LOOP_T, C0.x, C0.y, C0.w],
];
export const camAt = (t: number): WCam => {
  if (t < EV.faceOut1) {
    const {c, micro} = localCam(t);
    const p = placeAt(t);
    // a kick on the powerful first pulse
    const kick = pulse(t - EV.beat0, 0.3);
    const c2 = kick > 0 ? {...c, x: c.x + 0.012 * c.w * kick * noise1(t * 40, 3), y: c.y + 0.012 * c.w * kick * noise1(t * 40, 7)} : c;
    if (micro) return {...c2, world: 'micro', roll: MICRO_ROLL, local: toHost(c2), place: p};
    return {...mapP(c2, p), world: 'frog', local: c2, place: p};
  }
  const k = (i: number) => LEAP_KEYS.map((r) => [r[0], r[i]] as [number, number]);
  const wc = {x: mono(t, k(1)), y: mono(t, k(2)), w: Math.exp(mono(t, LEAP_KEYS.map((r) => [r[0], Math.log(r[3])] as [number, number])))};
  const p = placeAt(t);
  return {...wc, world: 'frog', local: unmapP(wc, p), place: p};
};
/** the nested tissue's reveal radius (mm, body frame) for the frog-space camera */
export const microReveal = (c: Cam) => 1.25 * Math.hypot(c.w / 2, (c.w * 16) / 9 / 2) * ss(-Math.log(c.w), -Math.log(8.5), -Math.log(2.6));
