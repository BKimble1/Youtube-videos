// V1 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). Worlds: 'frog' (the forest
// floor and the frog, mm, with the chest cutaway and its anatomy in the frog's body frame, and the tissue nested at
// MICRO_B) and 'micro' (the tissue alone, u). One continuous body:
//
//   0.00-0.30  ECU: a living wood frog on a cold forest floor, its heart beating in a chest cutaway, throat pumping
//   0.30-0.89  frost races over the skin, the limbs set, breathing stops; the camera pushes in; the final beat (0.89)
//   0.89-2.00  the heart is still, the beat sound gone; ice grows in the pericardium; the camera keeps going in
//   2.00-3.55  close on the frozen heart ("its HEART completely STOPS")
//   3.55-4.70  the cutaway widens over the trunk: ice spreading through the body ("Ice spreads through its body")
//   4.70-6.20  the lungs sag ("it stops breathing"); the camera dives into the back muscle, into the cells
//   6.20-8.50  the tissue: ice grows BETWEEN the cells, water is pulled out of them, they shrink; one buckles ("dead")
//   8.50-9.30  out to the trunk ("But its liver"); 9.2 the liver releases sugar; specks run along the vein
//   10.45-11.25 the camera follows them back into the tissue; glucose rings leave the capillary and enter the cells
//   11.6-13.85 the buckled cell rounds out and holds; ice needles press on its membrane and stop; inside stays liquid
//   13.85-15.0 out through the body, the cutaway closing, to the frog beneath leaves and snow
//   15.0-16.4  winter passes: snow falls and deepens, a night passes; the frog does not move ("for weeks")
//   16.45-18.55 spring light; the snowpack melts away; the frost on the frog melts to beads, the eye clears
//   18.35-20.10 into the chest: one twitch (19.2), another (19.62), then the beat returns (20.05)
//   20.10-20.75 back out to the face: a blink, the throat pumps, the toes flex
//   20.80-22.20 a crouch, the hop ("HOPS", 21.08), the flight, the landing; the camera follows
//   22.20-24.50 the landing settles into the opening's exact framing; the cutaway reopens on the same heartbeat; the
//              cold returns at the frame's edges (frame 0 follows)
import {P, add, mul, pt, sub} from './core/geo';
import {FPS, FRAMES, clamp, lerp, noise1, ss, ss5, word} from './lib';
import {FrogState, HEART_B, MICRO_B, SIT, toWorld} from './art/frog';
import {AnatomyState, HeartState} from './art/anatomy';
import {MicroState, HERO} from './art/micro';
import {EnvState, JUMP} from './art/forest';

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
export const PERIOD = 0.445; // the heartbeat; LOOP_T - 10 * PERIOD = 20.05, the first full beat after the revival
export const EV = {
  frost0: 0.3, frost1: 1.35, lastBeat: 2 * PERIOD, heartIce0: 0.95,
  close0: 2.0, wide0: 3.15, wide1: 4.5, lungs0: 4.6, lungs1: 5.6, dive1: 6.2,
  water0: 6.15, crumple0: 7.0, crumple1: 8.35, out1a: 8.5, out1b: 9.3, sugar0: 9.2, entry2a: 10.45, entry2b: 11.25,
  rings0: 10.6, hold0: 11.65, hold1: 12.7, spikes0: 12.05, spikes1: 13.5, out2a: 13.85, out2b: 15.0,
  winter1: 16.3, spring0: 16.45, melt0: 16.6, melt1: 17.7, thaw0: 17.7, thaw1: 18.55,
  heartIn0: 18.35, heartIn1: 19.05, twitch1: 19.2, twitch2: 19.62, beat0: LOOP_T - 10 * PERIOD,
  faceOut0: 20.1, faceOut1: 20.75, blink: 20.42, crouch0: 20.8, launch: 21.08, land: 21.62, settle: 22.15,
  reopen0: 22.55, reopen1: 23.45, cold0: 22.9,
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
  const b: Beat[] = [[-PERIOD, 1], [0, 1], [PERIOD, 1], [2 * PERIOD, 0.8], [EV.twitch1, 0.2], [EV.twitch2, 0.42]];
  for (let n = 10; n >= 0; n--) b.push([LOOP_T - n * PERIOD, n === 10 ? 0.9 : 1]);
  return b;
})();
export const heartAt = (t: number): HeartState => {
  let beat = 0, atria = 0;
  for (const [b, s] of BEATS) {
    beat += s * pulse(t - b);
    atria += s * 0.85 * pulse(t - b + 0.12, 0.2);
  }
  const frozen = ss(t, EV.lastBeat + 0.05, 1.8) * (1 - ss(t, 18.9, 19.9));
  const twitch = Math.sin((t - EV.twitch1) * 60) * Math.exp(-Math.max(0, t - EV.twitch1) * 12) * (t > EV.twitch1 ? 1 : 0) * 0.6
    + Math.sin((t - EV.twitch2) * 55) * Math.exp(-Math.max(0, t - EV.twitch2) * 10) * (t > EV.twitch2 ? 1 : 0) * 0.8;
  return {beat: clamp(beat), atria: clamp(atria), frozen, twitch};
};

// ---------------------------------------------------------------- the frog
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
const TC = pt(15, -2.5); // the trunk cutaway's centre (body frame)
const cutAt = (t: number): FrogState['cut'] => {
  if (t < EV.out2b) {
    // the hook's window over the heart grows, then opens over the trunk; it closes as the camera leaves the body
    const r = mono(t, [[0, 4.6], [0.3, 4.7], [1.2, 6.2], [2.0, 8.6], [3.15, 10.2], [4.5, 17.5]]) * (1 - ss(t, 14.25, 14.85));
    const c = lerp2(HEART_B, TC, ss(t, 3.15, 4.5));
    return {c, r, layers: 1};
  }
  if (t < EV.faceOut1 + 0.1) {
    const r = 7.2 * ss(t, 18.3, 18.95) * (1 - ss(t, 20.1, 20.7));
    return {c: HEART_B, r, layers: 1};
  }
  // reopened for the loop: the same window as frame 0
  return {c: HEART_B, r: 4.6 * ss5(t, EV.reopen0, EV.reopen1) + 0.1 * ss5(t, EV.reopen1, LOOP_T), layers: 1};
};
/** the hop: crouch, take-off, flight, landing, settle (root moves by JUMP) */
const jumpAt = (t: number) => {
  const crouch = ss(t, EV.crouch0, EV.launch) * (1 - ss(t, EV.launch, EV.launch + 0.06)) + 0.7 * ss(t, EV.land, EV.land + 0.08) * (1 - ss(t, EV.land + 0.1, EV.settle));
  const u = clamp((t - EV.launch) / (EV.land - EV.launch));
  const fly = t > EV.launch && t < EV.land;
  const x = t <= EV.launch ? 0 : t >= EV.land ? JUMP : JUMP * (u * 0.92 + 0.08 * ss(u, 0, 1)) ;
  const lift = fly ? 34 * 4 * u * (1 - u) : 0;
  const pitch = t < EV.launch ? -24 - 6 * crouch : fly ? lerp(-44, 10, ss(u, 0.05, 0.95)) : -24 + 12 * (1 - ss(t, EV.land, EV.settle)) * ss(t, EV.land, EV.land + 0.05);
  const hind = fly ? ss(u, 0, 0.18) * (1 - 0.8 * ss(u, 0.55, 1)) : t > EV.land ? 0.2 * (1 - ss(t, EV.land, EV.land + 0.25)) : 0;
  const fore = fly ? ss(u, 0.15, 0.5) * (1 - 0.6 * ss(u, 0.85, 1)) : t > EV.land ? 0.4 * (1 - ss(t, EV.land, EV.land + 0.2)) : 0;
  const dy = -crouch * 1.2;
  return {root: pt(SIT.root.x + x, SIT.root.y - lift - dy * 0 + crouch * 1.4), pitch, hind, fore, crouch};
};
export const frogAt = (t: number): FrogState => {
  const j = jumpAt(t);
  const tau = t > EV.cold0 ? t - LOOP_T : t; // the end runs on the opening's clock
  const alive = t < EV.frost0 + 0.3 ? 1 - ss(t, EV.frost0, EV.frost0 + 0.3) : ss(t, 20.45, 20.7);
  const throat = alive * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2.4 * tau));
  const frost = t < 10 ? ss(t, EV.frost0, EV.frost1) : 1 - ss(t, EV.thaw0, EV.thaw1);
  const pale = t < 10 ? ss(t, 0.35, 1.5) : 1 - ss(t, EV.thaw0 + 0.1, EV.thaw1 + 0.15);
  const cloud = t < 10 ? ss(t, 0.45, 1.45) : 1 - ss(t, 17.9, 18.75);
  const blink = pulse(t - EV.blink, 0.22) + pulse(t - (LOOP_T - 1.15), 0.2) * 0;
  const wet = ss(t, EV.thaw0, EV.thaw1) * (1 - ss(t, 21.6, 23.2));
  const look = 0.8 * ss(t, 20.6, 20.9) * (1 - ss(t, EV.land, EV.settle));
  const leaves = t > 14 && t < EV.launch ? ss(t, 14.55, 14.9) : 0;
  return {...j, frost, pale, cloud, blink: clamp(blink), throat, wet, look, cut: cutAt(t), leaves, t};
};
/** the leaves that were on its back, sliding off at take-off */
export const fallenLeavesAt = (t: number) => (t < EV.launch ? 0 : clamp((t - EV.launch) / 0.55));

// ---------------------------------------------------------------- anatomy and tissue
export const anatomyAt = (t: number): AnatomyState => {
  const iceA = ss(t, EV.heartIce0, 2.3);
  const melt = ss(t, 18.5, 19.4);
  return {
    heart: heartAt(t),
    ice: t < 15 ? iceA : 1,
    iceFront: t < 15 ? lerp(31, -3, ss(t, 3.0, 5.0)) : -3,
    frozen: t < 15 ? ss(t, 0.9, 2.2) : 1 - ss(t, 18.6, 19.6),
    breathe: (t < 1 ? 0.6 * (1 - ss(t, 0.4, 0.8)) : 0) - 0.7 * ss(t, EV.lungs0, EV.lungs1) * (t < 15 ? 1 : 0),
    sugar: t < 15 ? ss(t, EV.sugar0, 10.2) : 0,
    flow: Math.max(0, t - EV.sugar0) * 0.75,
    melt,
    t,
  };
};
export const microAt = (t: number): MicroState => {
  const v2 = t > 10;
  return {
    t,
    ice: v2 ? 0.75 + 0.25 * ss(t, EV.spikes0, 13.4) : ss(t, 5.9, 7.4),
    front: v2 ? 4000 : lerp(-1400, 1600, ss(t, 5.8, 8.0)),
    shrink: v2 ? 0.85 : ss(t, 6.4, 8.3) * 0.85,
    water: v2 ? 0 : ss(t, EV.water0, 6.7) * (1 - ss(t, 8.0, 8.5)),
    crumple: v2 ? 1 : ss(t, EV.crumple0, EV.crumple1),
    sugar: v2 ? ss(t, EV.rings0, EV.rings0 + 0.3) : 0,
    sc: Math.max(0, t - EV.rings0) ,
    hold: v2 ? ss(t, EV.hold0, EV.hold1) : 0,
    spikes: v2 ? ss(t, EV.spikes0, EV.spikes1) : 0,
    blood: 0.15,
    melt: 0,
  };
};

// ---------------------------------------------------------------- the forest
export const POCKET = pt(-3, -14);
export const envAt = (t: number): EnvState => {
  const tau = t > EV.cold0 ? t - LOOP_T : t;
  const end = ss(t, EV.cold0, LOOP_T);
  const cold = t < 12 ? lerp(0.7, 1, ss(tau, 0, 1.2)) : t < EV.cold0 ? 1 - ss(t, EV.spring0, 17.3) : 0.7 * end;
  const frost = t < 12 ? lerp(0.15, 1, ss(t, 0.1, 1.5)) : t < EV.cold0 ? 1 - ss(t, 16.7, 17.6) : 0.15 * end;
  return {
    t, cold, frost,
    snow: t > EV.out2a - 0.3 && t < 18 ? 1 : 0,
    depth: lerp(8, 34, ss(t, 15.0, 16.2)),
    falling: ss(t, 14.4, 14.9) * (1 - ss(t, 16.05, 16.5)),
    night: 0.62 * Math.sin(Math.PI * clamp((t - 15.0) / 1.25)) * (t > 15 && t < 16.25 ? 1 : 0),
    melt: ss(t, EV.melt0, EV.melt1),
    wet: ss(t, 16.9, 17.6) * (1 - ss(t, EV.cold0, LOOP_T - 0.1)),
    shoots: t > 16 && t < 23 ? ss(t, 16.9, 18.2) : 0,
    pocket: POCKET,
  };
};
/** screen-edge frost (the cold entering the frame) and the exterior light grade weight */
export const edgeFrostAt = (t: number) => (t < 12 ? lerp(0.22, 1, ss(t, 0.15, 1.3)) : t < EV.cold0 ? (t < EV.spring0 ? 0.75 : 0.75 * (1 - ss(t, EV.spring0, 17.2))) : 0.22 * ss(t, EV.cold0, LOOP_T));
export const warmAt = (t: number) => (t < 12 ? 0 : ss(t, EV.spring0, 17.3) * (1 - ss(t, EV.cold0, LOOP_T - 0.2)));

// ---------------------------------------------------------------- the camera
export type Cam = {x: number; y: number; w: number};
export type WCam = Cam & {world: 'frog' | 'micro'; roll?: number};
export const zoomAbout = (u: number, A: Cam, B: Cam): Cam => {
  const e = clamp(u);
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv};
  const P0 = pt((A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w));
  return {x: P0.x + (A.x - P0.x) * (wv / A.w), y: P0.y + (A.y - P0.y) * (wv / A.w), w: wv};
};
// micro <-> frog world (the tissue is nested at MICRO_B in the body frame, rotated so the capillary runs along the vein)
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
const HEART_CLOSE: Cam = {x: H.x + 0.3, y: H.y + 0.2, w: 13.2};
const TRUNK1: Cam = {x: -9, y: -16.5, w: 32};
const TRUNK2: Cam = {x: -12.5, y: -15.5, w: 30};
const MC1: Cam = {x: 0, y: 60, w: 720};
const MC1b: Cam = {x: 50, y: 120, w: 600};
const MC2: Cam = {x: HERO.c.x - 30, y: HERO.c.y - 70, w: 540};
const MC2b: Cam = {x: HERO.c.x - 10, y: HERO.c.y - 40, w: 430};
const WINTER: Cam = {x: -3, y: -31, w: 98};
const WINTER2: Cam = {x: -2, y: -28, w: 88};
const CHEST: Cam = {x: H.x + 3, y: H.y - 1, w: 40};
const HEART2: Cam = {x: H.x + 0.3, y: H.y + 0.2, w: 14};
const FACE: Cam = {x: 8, y: -21, w: 44};
const CEND: Cam = {x: C0.x + JUMP, y: C0.y, w: C0.w};
/** a move along zoomAbout's path whose progress follows smooth keys */
const move = (t: number, A: Cam, B: Cam, keys: [number, number][]) => zoomAbout(mono(t, keys), A, B);
const MICRO_CAMS = (t: number): Cam => {
  if (t < 10) return move(t, MC1, MC1b, [[EV.dive1, 0], [EV.out1a, 1]]);
  return move(t, MC2, MC2b, [[EV.entry2b, 0], [EV.out2a, 1]]);
};
export const camAt = (t: number): WCam => {
  if (t < EV.close0) return {...move(t, C0, HEART_CLOSE, [[0, 0], [0.3, 0.035], [0.85, 0.42], [1.5, 0.8], [EV.close0, 1]]), world: 'frog'};
  if (t < EV.wide0) return {...move(t, HEART_CLOSE, {...HEART_CLOSE, w: 11.6}, [[EV.close0, 0], [EV.wide0, 1]]), world: 'frog'};
  if (t < EV.wide1) return {...move(t, {...HEART_CLOSE, w: 11.6}, TRUNK1, [[EV.wide0, 0], [EV.wide1, 1]]), world: 'frog'};
  if (t < EV.dive1) return {...move(t, TRUNK1, toHost(MC1), [[EV.wide1, 0], [5.3, 0.12], [EV.dive1, 1]]), world: 'frog'};
  if (t < EV.out1a) return {...MICRO_CAMS(t), world: 'micro', roll: MICRO_ROLL};
  if (t < EV.out1b) return {...move(t, toHost(MC1b), TRUNK2, [[EV.out1a, 0], [EV.out1b, 1]]), world: 'frog'};
  if (t < EV.entry2a) return {...move(t, TRUNK2, {...TRUNK2, x: TRUNK2.x - 1.2, y: TRUNK2.y - 0.8, w: 24}, [[EV.out1b, 0], [EV.entry2a, 1]]), world: 'frog'};
  if (t < EV.entry2b) return {...move(t, {...TRUNK2, x: TRUNK2.x - 1.2, y: TRUNK2.y - 0.8, w: 24}, toHost(MC2), [[EV.entry2a, 0], [EV.entry2b, 1]]), world: 'frog'};
  if (t < EV.out2a) return {...MICRO_CAMS(t), world: 'micro', roll: MICRO_ROLL};
  if (t < EV.out2b) return {...move(t, toHost(MC2b), WINTER, [[EV.out2a, 0], [EV.out2b, 1]]), world: 'frog'};
  if (t < EV.spring0) return {...move(t, WINTER, WINTER2, [[EV.out2b, 0], [EV.spring0, 1]]), world: 'frog'};
  if (t < EV.heartIn0) return {...move(t, WINTER2, CHEST, [[EV.spring0, 0], [EV.heartIn0, 1]]), world: 'frog'};
  if (t < EV.heartIn1) return {...move(t, CHEST, HEART2, [[EV.heartIn0, 0], [EV.heartIn1, 1]]), world: 'frog'};
  if (t < EV.faceOut0) return {...move(t, HEART2, {...HEART2, w: 13}, [[EV.heartIn1, 0], [EV.faceOut0, 1]]), world: 'frog'};
  if (t < EV.faceOut1) return {...move(t, {...HEART2, w: 13}, FACE, [[EV.faceOut0, 0], [EV.faceOut1, 1]]), world: 'frog'};
  // the hop: follow the frog through the air and settle onto the opening's framing, one level over
  const keys: [number, number, number, number][] = [
    [EV.faceOut1, FACE.x, FACE.y, FACE.w],
    [EV.launch, FACE.x + 3, FACE.y - 1, 50],
    [21.35, 62, -36, 86],
    [EV.land + 0.05, JUMP + 2, -24, 66],
    [22.4, CEND.x - 1, CEND.y - 1, 52],
    [LOOP_T, CEND.x, CEND.y, CEND.w],
  ];
  const k = (i: number) => keys.map((r) => [r[0], r[i]] as [number, number]);
  return {x: mono(t, k(1)), y: mono(t, k(2)), w: Math.exp(mono(t, keys.map((r) => [r[0], Math.log(r[3])] as [number, number]))), world: 'frog'};
};
/** the nested tissue's reveal radius (mm, body frame) for the frog-world camera */
export const microReveal = (c: Cam) => 1.25 * Math.hypot(c.w / 2, (c.w * 16) / 9 / 2) * ss(-Math.log(c.w), -Math.log(8.5), -Math.log(2.6));
export const shake = (t: number) => pt(0.0 * noise1(t * 20), 0);
