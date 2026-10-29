// V2: the film as a pure function of the frame. Same narration and word timings as V1 (F('word', n)).
// World units ~0.2 mm (the slug is 100 long); cameras are kit orbits (azimuth from -y, elevation, distance, focal).
import {F, FRAMES, clamp, ease, inOut, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam, unproj} from '../kit/three';
import {Piece, geo} from './slug/body';
import {Frag} from './sets/Lab2';

export type Env2 = 'lab' | 'sea';
export type State2 = {
  shot: string;
  env: Env2;
  orbit: Orbit;
  pieces: Piece[];
  /** rack focus: blur (px) on the head piece, on the body piece, on the background */
  blur?: {head?: number; body?: number; back?: number};
  trail?: {path: Path; from: number; to: number; op: number};
  frags?: Frag[];
  probe?: {tip: V3; dir: V3; press: number; op: number};
  dim?: number;
  micro?: {op: number; para: number; zoom: number; reveal: number; swim?: number; bar?: number};
  /** the food frond: puncture height (0..1 along the stalk) and how far it has drained */
  feed?: {u: number; drain: number; down?: boolean; flow?: number};
  /** time-lapse: the set animates fast (0..1) and the light cycles (night darkening 0..1) */
  lapse?: number;
  /** fade the algae out (inside views) */
  frondFade?: number;
  /** big out-of-focus grit right by the lens (world) */
  fore?: {c: V3; r: number; col: string; op?: number}[];
  /** V3: solid props on the floor, depth-sorted with the animal (a shell shard, a pebble) */
  props?: {c: V3; r: [number, number, number]; yaw: number; col: string; blur?: number}[];
  /** the set's clock (the last shot runs it into frame 0's) */
  loopT?: number;
  night?: number;
  labels: {text: string; op: number; icon?: 'ff' | 'rw' | 'none'; y?: number}[];
};

export const S = {
  hook: 0,
  body: F('and', 1),
  weak: F('you'),
  para: F('scientists'),
  feed: F('but'),
  heart: F('and', 2),
  grow: F('then'),
  twice: F('and', 3),
  end: FRAMES,
};

// ---------------------------------------------------------------- the lab path
// straight under the body, then the head's own route: a gentle steer as it glides off
export const PH2 = new Path([[6, 260], [3, 150], [0, 40], [-3, -30], [3, -95], [-6, -165], [-12, -235], [-6, -300]]);
export const S0 = 200; // arc of the body's virtual snout when the neck is unstretched (the body stays here)
export const BRK = 18; // the neck parts at frame 18 (0.6 s)
export const pinchOf = (gap: number) => (gap <= 7 ? (0.55 * gap) / 7 : 0.55 + (0.45 * clamp(gap - 7, 0, 6)) / 6);
export const gapHook = (f: number) => 7 + (6 * f) / BRK; // 7 -> 13 at the break, at 0.33 units a frame

// head speed after the break (units per frame): a steady glide with a pedal-wave surge
const vHead = (f: number) => {
  const base = f < S.body ? 0.33 : lerp(0.33, 0.14, seg(f, S.body, S.body + 40));
  return base * (1 + 0.25 * Math.sin((2 * Math.PI * (f - BRK)) / 26));
};
const tr: number[] = [0];
for (let f = BRK + 1; f <= S.weak + 4; f++) tr.push(tr[tr.length - 1] + vHead(f));
const travelAt = (f: number) => tr[clamp(Math.round(f - BRK), 0, tr.length - 1)];
const crawlAt = (f: number) => (2 * Math.PI * (f - BRK)) / 26;

/** the detached head and the abandoned body in the lab, after the break */
export const labPieces = (f: number, o: {flinch?: number; bend?: number; twitch?: Piece['twitch']} = {}): Piece[] => {
  const t = f / 30;
  const gH = 13 * (1 - ease(f, BRK, BRK + 11, outCubic));
  const gB = 13 * (1 - ease(f, BRK, BRK + 9, outCubic));
  const sl = ease(f, BRK, BRK + 7, outCubic);
  const go = ease(f, BRK, BRK + 8);
  const head: Piece = {id: 'head', path: PH2, tip: S0 + 13 + travelAt(f), a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: crawlAt(f), crawlAmp: go, surge: 0.02 * go * Math.cos(crawlAt(f))};
  const body: Piece = {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, flinch: o.flinch, bend: o.bend, twitch: o.twitch};
  return [body, head];
};

/** a world point on the path at arc s, offset laterally by v */
const onPath = (s: number, v: number, z = 0): V3 => {
  const p = PH2.at(s);
  return [p.x - p.ty * v, p.y + p.tx * v, z];
};
// the algae fragments the head passes (placed from the head's own route) and a few others on the sand
export const HOOK_FRAGS: Frag[] = [
  {c: onPath(S0 + 13 + 10, 9), ang: 0.9, len: 12, seed: 1}, // beside the head at about 1.1-1.5 s
  {c: onPath(S0 + 13 + 24, -11), ang: 2.6, len: 11, seed: 2}, // passed at about 2.0-2.6 s
  {c: onPath(S0 - 40, 34), ang: -0.5, len: 10, seed: 3},
  {c: onPath(S0 - 70, -36), ang: 1.9, len: 12, seed: 4},
  {c: onPath(S0 + 70, 22), ang: 1.2, len: 12, seed: 5},
  {c: onPath(S0 + 5, -30), ang: -1.1, len: 9, seed: 6},
];

const neck0 = onPath(S0 - 22, 0, 4);
// the opening camera: close, slightly elevated three-quarter macro, from in front and to the left of the head
export const ORB0: Orbit = {target: [neck0[0], neck0[1] + 4, 4], az: -26, el: 34, d: 200, f: 3150, cy: 990};

const hook = (f: number): State2 => {
  const t = f / 30;
  let pieces: Piece[];
  if (f < BRK) {
    const gap = gapHook(f);
    pieces = [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinchOf(gap), t}];
  } else {
    // the body recoils a little as the neck parts, and gives a small reflex at 2.7-3.2 s
    const fl = 0.22 * Math.sin(Math.PI * seg(f, BRK, BRK + 18)) ** 2 + 0.25 * Math.sin(Math.PI * seg(f, 82, 104)) ** 2;
    pieces = labPieces(f, {flinch: fl, bend: fl * 2});
  }
  const head = pieces[pieces.length - 1];
  const hc = geo(head).at(10, 0, 3);
  const body = pieces[0];
  const bc = geo(body).at(55, 0, 4);
  // hold still until the result has registered (1.05 s), then track the head, lowering to a low macro angle
  const follow = ease(f, 31, 50);
  const low = ease(f, 43, 66);
  const settle = ease(f, 78, 110);
  // the target moves from the neck onto a point between the head and the body (both stay in frame)
  const push = ease(f, 76, S.body - 1, (u) => u * u * (3 - 2 * u));
  const tgt: V3 = [lerp(hc[0], bc[0], 0.36 + 0.05 * push), lerp(hc[1], bc[1], 0.36 + 0.05 * push), 3];
  const target: V3 = [lerp(ORB0.target[0], tgt[0], follow), lerp(ORB0.target[1], tgt[1], follow), lerp(4, 3, follow)];
  const orbit: Orbit = {
    target,
    az: lerp(-26, lerp(-16, -22, settle), low),
    el: lerp(36, lerp(13, 12, settle), low),
    // then a slow push toward the abandoned body (2.6-4.3 s) that sets up the rack focus of the next shot
    d: lerp(200, lerp(175, 185, settle), low) * lerp(1, 0.9, push),
    f: lerp(3150, 3000, low),
    cy: lerp(980, lerp(960, 1030, settle), follow),
  };
  const trail = f > BRK ? {path: PH2, from: S0 - 20, to: head.tip - 21, op: 0.5 * ease(f, BRK, BRK + 20)} : undefined;
  // 2.05-2.6 s: sand grit right by the lens slides through the bottom of the frame as the camera tracks (parallax)
  // they drift with the water (to the left, slowly) and come and go softly
  const fop = ease(f, 52, 60) * (1 - ease(f, 84, 98));
  const fore = fop > 0 ? foreBits().map((b) => ({...b, c: [b.c[0] - 0.16 * (f - 69), b.c[1], b.c[2] + 0.04 * (f - 69)] as V3, op: fop})) : undefined;
  return {shot: 'H', env: 'lab', orbit, pieces, trail, frags: HOOK_FRAGS, fore, labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, 112, 124), icon: 'ff'}]};
};
let FORE: State2['fore'];
const foreBits = () => {
  if (FORE) return FORE;
  FORE = []; // (the camera does not depend on these; guards the call below)
  // detritus flecks drifting in the water right by the lens, placed from the camera as it is at 2.3 s (they sit
  // where the frame is empty, lower left and right; as the camera tracks they slide past much faster than the slug)
  const c = orbitCam(hook(69).orbit);
  const P = (x: number, y: number, z: number, r: number, col: string) => ({c: unproj(c, x, y, z), r, col});
  FORE = [P(230, 1560, 55, 1.1, '#F3EEE2'), P(880, 1700, 48, 0.7, '#FBF8F0'), P(520, 1840, 62, 1.4, '#EDE5D4')];
  return FORE;
};

// ---------------------------------------------------------------- "And its headless BODY? It keeps MOVING too."
// Focus racks from the head to the abandoned body; a gloved hand brings a blunt probe to the near parapodium; the
// touched region curls hard and the body flinches, recovers, and twitches again on "MOVING".
export const fTouch = F('body', 1) - 2, fMove = F('moving');
const nearSideOf = (o: Orbit, p: Piece) => {
  const eye = orbitCam(o).eye;
  const G = geo(p);
  const c = G.at(55, 0, 3), l = G.at(55, 1, 3);
  return (l[0] - c[0]) * (eye[0] - c[0]) + (l[1] - c[1]) * (eye[1] - c[1]) > 0 ? 1 : -1;
};
const bodyShot = (f: number): State2 => {
  const end = hook(S.body - 1).orbit;
  const k = ease(f, S.body, S.body + 30);
  // the twitch: a fast local curl on contact, decaying; a second, smaller one on "MOVING"
  const tw1 = f < fTouch ? 0 : outCubic(seg(f, fTouch, fTouch + 5)) * (1 - 0.8 * ease(f, fTouch + 6, fTouch + 24));
  const tw2 = 0.75 * Math.sin(Math.PI * seg(f, fMove - 2, fMove + 14)) ** 2;
  const amp = clamp(tw1 + tw2) * (1 - ease(f, fMove + 16, S.weak - 6));
  const probe0 = labPieces(f)[0];
  const side = nearSideOf(end, probe0);
  const fl = 0.35 * amp;
  const pieces = labPieces(f, {flinch: fl, bend: fl * 2.5, twitch: {side, a: 60, amp}});
  const [body, head] = pieces;
  // focus moves to the body; the head stays in the frame as a soft foreground shape
  const bc = geo(body).at(58, side * 8, 6), hc = geo(head).at(10, 0, 3);
  const tgt: V3 = [lerp(bc[0], hc[0], 0.3), lerp(bc[1], hc[1], 0.3), 5];
  const target: V3 = [lerp(end.target[0], tgt[0], k), lerp(end.target[1], tgt[1], k), lerp(end.target[2], 5, k)];
  const orbit: Orbit = {...end, target, az: lerp(end.az, -12, k), el: lerp(end.el, 19, k), d: lerp(end.d, 172, k), f: lerp(end.f, 3650, k), cy: lerp(end.cy ?? 960, 1060, k)};
  // the probe: from the upper right, down to the margin of the near parapodium, then away
  // the tip rests on the soft dorsal surface beside the near parapodium (which curls up around the touch)
  const contact = geo(labPieces(f)[0]).tube(60, Math.PI / 2 - side * 0.5);
  const inn = ease(f, fTouch - 20, fTouch, outCubic), away = ease(f, fTouch + 4, fTouch + 30);
  const back = 60 * (1 - inn) + 45 * away;
  const dir = norm([0.45, -0.35, 0.82]);
  const tip: V3 = [contact[0] + dir[0] * (back + 0.6), contact[1] + dir[1] * (back + 0.6), contact[2] + dir[2] * (back + 0.6)];
  const press = clamp(seg(f, fTouch - 2, fTouch + 1)) * (1 - seg(f, fTouch + 2, fTouch + 6));
  const tipP: V3 = [tip[0] - dir[0] * press * 1.2, tip[1] - dir[1] * press * 1.2, tip[2] - dir[2] * press * 1.2];
  return {
    shot: 'B', env: 'lab', orbit, pieces, frags: HOOK_FRAGS,
    trail: {path: PH2, from: S0 - 20, to: head.tip - 21, op: 0.5},
    blur: {head: 6 * ease(f, S.body - 6, S.body + 22)},
    probe: {tip: tipP, dir, press, op: clamp(seg(f, fTouch - 26, fTouch - 18)) * (1 - seg(f, fTouch + 34, fTouch + 44))},
    labels: [],
  };
};
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

// ---------------------------------------------------------------- "You see, there's a weak spot just behind its head.
//                                                                    When it breaks apart, even its HEART stays behind."
// REWIND: the separation plays backwards and the head rejoins, while the camera swings round to a close side view of
// the neck. A cutaway opens through the neck and the front of the body: the breaking plane, the heart in its
// pericardium. The neck parts again in section; the heart stays (beating) in the body; the head leaves without it.
export const fRew0 = S.weak, fRew1 = S.weak + 20, fJoin = S.weak + 27;
export const fWeak = Math.max(F('weak') - 2, fJoin), fBreak0 = F('when') + 2, fBreak = fBreak0 + 22, fHeart = F('heart', 1);
const ORB_SIDE: Orbit = {target: onPath(S0 - 24, 0, 5), az: -146, el: 36, d: 150, f: 3000, cy: 1150};
export const beatAt = (f: number, f0: number, per = 24) => {
  if (f < f0) return 0;
  const u = ((f - f0) % per) / per;
  return Math.exp(-u * 9) * (1 - Math.exp(-u * 60)) * 1.6 + 0.6 * Math.exp(-Math.pow((u - 0.28) * 14, 2));
};
const vSec = (f: number) => 0.3 * (1 + 0.25 * Math.sin((2 * Math.PI * (f - fBreak)) / 26));
const secTr: number[] = [0];
for (let f = fBreak + 1; f <= S.feed + 4; f++) secTr.push(secTr[secTr.length - 1] + vSec(f));
const CUTW = {a0: 8, a1: 50};
/** the anatomy pieces from the rewind on: intact, then separating in section */
const secPieces = (f: number, open: number): Piece[] => {
  const t = f / 30;
  const heart = 1, beat = beatAt(f, fBreak0 - 40) * (1 + 0.45 * Math.exp(-Math.pow((f - fHeart - 4) / 6, 2)));
  const cut = {...CUTW, open};
  const weak = ease(f, fWeak, fWeak + 8) * (1 - ease(f, fBreak0 + 4, fBreak0 + 14));
  if (f < fBreak) {
    const gap = f < fBreak0 ? 0 : 13 * ease(f, fBreak0, fBreak, (u) => u * u * (1.6 - 0.6 * u));
    const breathe = f > fWeak && f < fBreak0 ? 0.12 * Math.sin(Math.PI * seg(f, fWeak, fBreak0)) : 0;
    return [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: Math.max(pinchOf(gap), breathe), t, heart, beat, cut, weak}];
  }
  const tr2 = secTr[clamp(Math.round(f - fBreak), 0, secTr.length - 1)];
  const sl = ease(f, fBreak, fBreak + 8, outCubic);
  const gH = 13 * (1 - ease(f, fBreak, fBreak + 11, outCubic)), gB = 13 * (1 - ease(f, fBreak, fBreak + 9, outCubic));
  return [
    {id: 'body', path: PH2, tip: S0 + gB, a0: 22, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, heart, beat, cut},
    {id: 'head', path: PH2, tip: S0 + 13 + tr2, a0: 0, a1: 22, gap: gH, pinch: 1, seal: sl, t, crawl: (2 * Math.PI * (f - fBreak)) / 26, crawlAmp: ease(f, fBreak, fBreak + 8), cut: {a0: CUTW.a0 + 13 + tr2, a1: CUTW.a1 + 13 + tr2, open}},
  ];
};

const weakShot = (f: number): State2 => {
  const t = f / 30;
  let pieces: Piece[];
  const open = ease(f, fJoin - 2, fJoin + 16);
  if (f < fRew1) {
    // the rewind: the lab separation replayed backwards (frame S.body-1 -> 0), quickly
    const hf = Math.round(lerp(S.body - 1, 0, ease(f, fRew0, fRew1, (u) => u * u * (3 - 2 * u))));
    pieces = hf < BRK ? [{id: 'whole', path: PH2, tip: S0 + gapHook(hf), a0: 0, a1: 100, gap: gapHook(hf), pinch: pinchOf(gapHook(hf)), t}] : labPieces(hf);
  } else if (f < fJoin) {
    const gap = 7 * (1 - ease(f, fRew1, fJoin, outCubic));
    pieces = [{id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinchOf(gap), t}];
  } else pieces = secPieces(f, open);
  const from = bodyShot(S.weak - 1).orbit;
  const k = ease(f, fRew0, fJoin + 6);
  let orbit = lerpOrbit(from, ORB_SIDE, k);
  // in close on the section while the weak spot and the heart are introduced, back out for the break
  const zin = ease(f, fJoin + 4, fJoin + 34) * (1 - ease(f, fBreak0 - 8, fBreak0 + 10));
  orbit = {...orbit, f: orbit.f * (1 + 0.32 * zin), target: [lerp(orbit.target[0], onPath(S0 - 26, 0, 4)[0], zin), lerp(orbit.target[1], onPath(S0 - 26, 0, 4)[1], zin), orbit.target[2]]};
  // after the break, keep the heart (behind) and the leaving head both in frame: aim between them, widen a little
  if (f > fBreak) {
    const hd = geo(pieces[1]).at(10, 0, 4), ht = geo(pieces[0]).at(31, 0, 4);
    const k2 = ease(f, fBreak, fBreak + 30);
    const mid: V3 = [(hd[0] + ht[0]) / 2, (hd[1] + ht[1]) / 2, 5];
    orbit = {...orbit, target: [lerp(orbit.target[0], mid[0], k2), lerp(orbit.target[1], mid[1], k2), orbit.target[2]], f: lerp(orbit.f, 2550, ease(f, fBreak + 10, S.para))};
  }
  return {
    shot: 'W', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.3 * ease(f, fRew0 + 4, fJoin + 4),
    labels: [{text: 'REWIND', op: seg(f, fRew0, fRew0 + 3) * (1 - seg(f, fRew1 + 2, fRew1 + 10)), icon: 'rw'}],
  };
};

// ---------------------------------------------------------------- "Scientists think it may be escaping PARASITES in its old body."
// A continuous push into the abandoned body's cut face, down to its tissue; two parasites, drawn ghosted under a
// HYPOTHESIS tag; then out again and after the head as it leaves.
export const fIn0 = S.para + 2, fIn1 = S.para + 34, fOut0 = F('old') - 4, fOut1 = S.feed - 2;
export const MICRO_A = 38;
const paraShot = (f: number): State2 => {
  const pieces = secPieces(f, 1 - ease(f, fOut0 + 10, fOut1));
  const body = pieces[0], head = pieces[1];
  const base = weakShot(S.para - 1).orbit;
  const mc = geo(body).at(MICRO_A, 0, 3.4);
  // push straight on into the cut face (it fills the frame), then the tissue layer takes over and keeps pushing
  const deep: Orbit = {...base, target: mc, az: -132, el: 44, d: 120, f: 3000 * 5.5, cy: 960};
  const hd = geo(head).at(12, 0, 4);
  const away: Orbit = {target: [hd[0], hd[1] + 8, 3], az: -150, el: 26, d: 170, f: 3300, cy: 1100};
  // the swap to the head happens behind the tissue; the tissue then dissolves onto the head gliding away
  const kin = ease(f, fIn0, fIn1, (u) => u * u * u), kout = f >= fOut0 + 2 ? 1 : 0;
  const away2: Orbit = {...away, d: lerp(185, 160, ease(f, fOut0, fOut1)), az: lerp(-158, -146, ease(f, fOut0, fOut1))};
  let orbit = kout > 0 ? away2 : lerpOrbit(base, deep, kin);
  if (!kout) {
    // the aim settles on the cut face first, then the lens closes in on it
    const ka = ease(f, fIn0 - 2, fIn0 + 16);
    orbit = {...orbit, target: [lerp(base.target[0], mc[0], ka), lerp(base.target[1], mc[1], ka), lerp(base.target[2], mc[2], ka)]};
  }
  const fPar = F('parasites');
  const mop = ease(f, fIn1 - 12, fIn1) * (1 - ease(f, fOut0 + 3, fOut0 + 14));
  const micro = {op: mop, reveal: ease(f, fIn1 - 12, fIn1 + 2), para: ease(f, fPar - 16, fPar - 2), zoom: 1 + 0.55 * ease(f, fIn1 - 12, fOut0 + 9) + 0.6 * ease(f, fOut0, fOut0 + 9)};
  const hyp = ease(f, fPar - 2, fPar + 6) * (1 - ease(f, fOut0, fOut0 + 6));
  return {shot: 'P', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.3 * (1 - kout), micro, labels: [{text: 'HYPOTHESIS', op: hyp, icon: 'none'}]};
};

// ---------------------------------------------------------------- "But the head starts eating algae,"
// Cut to the seabed: a low macro on a tuft of Bryopsis. The head glides in, rears a little and presses its snout to a
// frond's stalk; it pumps (a slow rhythmic surge) while the frond drains from the puncture upward and goes pale and
// clear, and the head itself greens.
export const PHS = new Path([[0, 160], [0, -160]]);
export const fArrive = S.feed + 18, fSuck = S.feed + 22;
export const headSea = (f: number): Piece => {
  const t = f / 30;
  const arrive = ease(f, S.feed - 6, fArrive, outCubic);
  const pump = f > fSuck ? Math.sin((2 * Math.PI * (f - fSuck)) / 11) : 0;
  const go = 1 - ease(f, fArrive - 8, fArrive + 2);
  return {
    id: 'head', path: PHS, tip: lerp(110, 124.4, arrive) + 0.35 * pump, a0: 0, a1: 22, gap: 0, pinch: 1, seal: 1, t,
    crawl: (2 * Math.PI * f) / 26, crawlAmp: go, surge: 0.018 * pump * ease(f, fSuck, fSuck + 6),
    rear: 0.35 * ease(f, fArrive - 10, fArrive + 4), green: 0.85 * ease(f, fSuck + 2, S.heart + 10),
  };
};
const feedShot = (f: number): State2 => {
  const k = ease(f, S.feed, S.heart, (u) => u * (2 - u));
  const orbit: Orbit = {target: [0, 41, 6], az: lerp(-78, -70, k), el: lerp(14, 11, k), d: lerp(96, 84, k), f: 3300, cy: 1160};
  return {shot: 'F', env: 'sea', orbit, pieces: [headSea(f)], feed: {u: 0.02, drain: ease(f, fSuck + 2, S.heart + 14)}, labels: []};
};

// ---------------------------------------------------------------- "and about a week later, a new heart starts beating."
// TIME-LAPSE on the seabed: days pass (light cycling, the tuft swaying fast), DAY 1 -> DAY 7; a small pale stub grows
// behind the head. Then a cutaway opens through the new tissue: a tiny new heart forms on "new heart" and starts to
// beat on "beating" (the heartbeat sound is cued from the same frames), and the beat is held.
export const fWeek0 = S.heart + 6, fWeek1 = F('new') - 4, fNew = F('new'), fBeat = F('beating'), BEAT_PER = 20;
export const growAt = (f: number) => {
  // day 1 -> 7 (about 0.17), then the weeks of scene 7 run it on to 1
  if (f < S.grow) return 0.025 + 0.15 * ease(f, fWeek0, fWeek1, (u) => u * (2 - u));
  return growStage(f);
};
export const dayAt = (f: number) => (f < S.grow ? 1 + 6 * ease(f, fWeek0, fWeek1) : dayStage(f));
const TIP_SEA = 124.4;
export const regenSea = (f: number, o: Partial<Piece> = {}): Piece => {
  const t = f / 30;
  const hv = f < fNew - 6 ? 0 : ease(f, fNew - 6, fNew + 10);
  return {
    id: 'regen', path: PHS, tip: TIP_SEA, a0: 0, a1: 100, gap: 0, pinch: 1, seal: 1, t, grow: growAt(f), green: 0.85,
    heart: hv, beat: beatAt(f, fBeat, BEAT_PER) + (f < fBeat ? 0.25 * hv * Math.sin((2 * Math.PI * (f - fNew)) / 30) * 0 : 0), ...o,
  };
};
const heartShot = (f: number): State2 => {
  const lapse = ease(f, fWeek0 - 2, fWeek0 + 2) * (1 - ease(f, fWeek1, fWeek1 + 4));
  const open = ease(f, fWeek1 - 2, fNew + 4);
  const p = regenSea(f, {cut: {a0: 10, a1: 70, open}});
  const from = feedShot(S.heart - 1).orbit;
  const side: Orbit = {target: [0, 54, 4], az: -112, el: 30, d: 120, f: 3300, cy: 1060};
  const sec: Orbit = {target: [0, 35.6 + 25, 4], az: -100, el: 40, d: 100, f: 3300 * 1.75, cy: 1000};
  const k1 = ease(f, S.heart, fWeek1, (u) => u * u * (3 - 2 * u)), k2 = ease(f, fWeek1 - 4, fNew + 14, (u) => u * u * (3 - 2 * u));
  const orbit = lerpOrbit(lerpOrbit(from, side, k1), sec, k2);
  const day = Math.round(dayAt(f));
  return {
    shot: 'H', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1}, lapse, frondFade: ease(f, fWeek1, fNew + 6),
    // nights: two slow dips across the week (kept well under 3 flashes a second; the day counter carries the speed)
    night: lapse * 0.28 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * seg(f, fWeek0, fWeek1))),
    labels: [{text: `TIME-LAPSE · DAY ${day}`, op: ease(f, fWeek0 - 2, fWeek0 + 3) * (1 - ease(f, fNew + 6, fNew + 14)), icon: 'ff'}],
  };
};
// ---------------------------------------------------------------- "Then over the next few weeks, an entire new body grows back."
// Three held stages behind the same head, joined by short time-lapse runs: DAY 7 (the bud with its new heart),
// DAY 14 (body lengthening, parapodia forming as narrow pale flaps, first spots), DAY 21 (full length, parapodia
// open and ruffled, markings and green restored). The camera rises to an overhead-oblique so the whole animal
// lies up the frame with the head at the top and the growth coming toward the lens.
const ST = [
  {f: S.grow, day: 7, g: 0.175},
  {f: S.grow + 22, day: 7, g: 0.175},
  {f: S.grow + 34, day: 14, g: 0.56},
  {f: S.grow + 58, day: 14, g: 0.56},
  {f: S.grow + 74, day: 21, g: 1},
];
const stageAt = (f: number, key: 'day' | 'g') => {
  for (let i = 0; i < ST.length - 1; i++) if (f < ST[i + 1].f) return lerp(ST[i][key], ST[i + 1][key], ease(f, ST[i].f, ST[i + 1].f, (u) => u * u * (3 - 2 * u)));
  return ST[ST.length - 1][key];
};
function growStage(f: number) {
  return stageAt(f, 'g');
}
function dayStage(f: number) {
  return stageAt(f, 'day');
}
const running = (f: number) => (f > ST[1].f - 2 && f < ST[2].f + 2) || (f > ST[3].f - 2 && f < ST[4].f + 2) ? 1 : 0;
const growShot = (f: number): State2 => {
  const close = 1 - ease(f, S.grow - 2, S.grow + 10);
  const p = regenSea(f, {cut: {a0: 10, a1: 70, open: close}});
  const from = heartShot(S.grow - 1).orbit;
  const wide: Orbit = {target: [0, 35.6 + 46, 2], az: -168, el: 54, d: 290, f: 3300, cy: 880};
  const orbit = lerpOrbit(from, wide, ease(f, S.grow, S.grow + 30, (u) => u * u * (3 - 2 * u)));
  // the time-lapse runs: days and nights flicker past, the tuft sways fast
  const run = ease(f, ST[1].f - 2, ST[1].f + 3) * (1 - ease(f, ST[2].f - 3, ST[2].f + 2)) + ease(f, ST[3].f - 2, ST[3].f + 3) * (1 - ease(f, ST[4].f - 3, ST[4].f + 2));
  const day = dayStage(f);
  return {
    shot: 'G', env: 'sea', orbit, pieces: [p], feed: {u: 0.02, drain: 1}, lapse: run, frondFade: 1 - ease(f, S.grow, S.grow + 14),
    // one slow night dip per run (no strobing)
    night: run * 0.28 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (f < ST[2].f + 2 ? seg(f, ST[1].f - 2, ST[2].f + 2) : seg(f, ST[3].f - 2, ST[4].f + 2)))),
    labels: [{text: `${running(f) ? 'TIME-LAPSE · ' : ''}DAY ${Math.round(day)}`, op: ease(f, S.grow + 4, S.grow + 10) * (1 - ease(f, S.twice - 8, S.twice - 2)), icon: running(f) ? 'ff' : 'none'}],
  };
};

// ---------------------------------------------------------------- "And one of these sea slugs actually did it... TWICE."
// Back in the dish: the regrown slug glides in and settles where the film began; the camera closes on the neck.
// A constriction forms on "actually did it"; on "TWICE" the head starts to pull away and the neck stretches, so the
// last frame runs straight into frame 0 (same camera, same pose, the gap growing at the hook's 0.33 units a frame).
export const fDid = F('actually'), fTwice = F('twice');
const LOOP = FRAMES; // the virtual frame that is frame 0 again
const gapLoop = (f: number) => {
  if (f < fTwice) return 0;
  const u = clamp((f - fTwice) / (LOOP - fTwice));
  // 0 -> 7 with the end slope equal to the hook's (6/18 a frame), so the stretch carries on without a hitch
  const k = (gapHook(1) - gapHook(0)) * (LOOP - fTwice) / 7;
  const b = k - 2, a = 1 - b;
  return 7 * (a * u * u + b * u * u * u);
};
const twiceShot = (f: number): State2 => {
  const tl = (f - LOOP) / 30; // the clock runs into frame 0's
  const gap = gapLoop(f);
  const glide = ease(f, S.twice, fTwice, (u) => u * (2 - u));
  const bodyTip = lerp(S0 - 26, S0, glide);
  const constrict = 0.46 * ease(f, fDid - 2, fDid + 16);
  const crawl = (2 * Math.PI * (f - LOOP)) / 26;
  const pieces: Piece[] = [{
    id: 'whole', path: PH2, tip: bodyTip + gap, a0: 0, a1: 100, gap, pinch: Math.max(constrict, pinchOf(gap)), t: tl,
    crawl, crawlAmp: 1 - ease(f, fTwice - 20, fTwice + 4),
  }];
  const end = hook(0).orbit;
  const mid = onPath(bodyTip - 34, 0, 3);
  const start: Orbit = {target: [mid[0], mid[1], 3], az: -58, el: 44, d: 340, f: 3150, cy: 1000};
  const k = ease(f, S.twice + 6, LOOP, (u) => u * u * (3 - 2 * u));
  const orbit = lerpOrbit(start, end, k);
  return {shot: 'T', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, labels: [{text: 'TIME-LAPSE', op: ease(f, LOOP - 9, LOOP - 1), icon: 'ff'}], loopT: tl};
};

const rest = (f: number): State2 => twiceShot(f);

export const stateAt2 = (f: number): State2 => {
  if (f < S.body) return hook(f);
  if (f < S.weak) return bodyShot(f);
  if (f < S.para) return weakShot(f);
  if (f < S.feed) return paraShot(f);
  if (f < S.heart) return feedShot(f);
  if (f < S.grow) return heartShot(f);
  if (f < S.twice) return growShot(f);
  return rest(f);
};
void inOut;
void lerpOrbit;

/** cuts in V2 (caption changes within two frames of one happen on it) */
export const CUTS2: number[] = [S.feed, S.twice];

/** the picture's event frames for the sound (tools/export_cues_v2.ts -> audio/cues_v2.json) */
export const CUES2 = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = S.heart; f < S.twice; f++) {
    const d = Math.round(dayAt(f));
    if (d !== last && last > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES, S, brk: BRK, touch: fTouch, move: fMove, rew0: fRew0, rew1: fRew1, join: fJoin, weak: fWeak, brk2start: fBreak0, brk2: fBreak,
    heart: fHeart, in0: fIn0, in1: fIn1, para: F('parasites'), out0: fOut0, out1: fOut1, arrive: fArrive, suck: fSuck, pumpPer: 11,
    week0: fWeek0, week1: fWeek1, newHeart: fNew, beat: fBeat, beatPer: BEAT_PER, did: fDid, twice: fTwice, loopGap0: fTwice, days,
  };
};
