// V2: the film as a pure function of the frame. Same narration and word timings as V1 (F('word', n)).
// World units ~0.2 mm (the slug is 100 long); cameras are kit orbits (azimuth from -y, elevation, distance, focal).
import {F, FRAMES, clamp, ease, inOut, lerp, outCubic, seg} from '../lib';
import {Path} from '../geo';
import {Orbit, V3, lerpOrbit, orbitCam} from '../kit/three';
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
  const tgt: V3 = [lerp(hc[0], bc[0], 0.36), lerp(hc[1], bc[1], 0.36), 3];
  const target: V3 = [lerp(ORB0.target[0], tgt[0], follow), lerp(ORB0.target[1], tgt[1], follow), lerp(4, 3, follow)];
  const orbit: Orbit = {
    target,
    az: lerp(-26, lerp(-16, -22, settle), low),
    el: lerp(36, lerp(13, 12, settle), low),
    d: lerp(200, lerp(175, 185, settle), low),
    f: lerp(3150, 3000, low),
    cy: lerp(980, lerp(900, 880, settle), follow),
  };
  const trail = f > BRK ? {path: PH2, from: S0 - 20, to: head.tip - 21, op: 0.5 * ease(f, BRK, BRK + 20)} : undefined;
  return {shot: 'H', env: 'lab', orbit, pieces, trail, frags: HOOK_FRAGS, labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, 112, 124), icon: 'ff'}]};
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
const ORB_SIDE: Orbit = {target: onPath(S0 - 19, 0, 5), az: -80, el: 21, d: 140, f: 3050, cy: 960};
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
  // after the break, keep the heart (behind) and the leaving head both in frame: aim between them, widen a little
  if (f > fBreak) {
    const hd = geo(pieces[1]).at(10, 0, 4), ht = geo(pieces[0]).at(31, 0, 4);
    const k2 = ease(f, fBreak, fBreak + 30);
    const mid: V3 = [(hd[0] + ht[0]) / 2, (hd[1] + ht[1]) / 2, 5];
    orbit = {...orbit, target: [lerp(orbit.target[0], mid[0], k2), lerp(orbit.target[1], mid[1], k2), orbit.target[2]], f: lerp(orbit.f, 2550, ease(f, fBreak + 10, S.para))};
  }
  return {
    shot: 'W', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.42 * ease(f, fRew0 + 4, fJoin + 4),
    labels: [{text: 'REWIND', op: seg(f, fRew0, fRew0 + 3) * (1 - seg(f, fRew1 + 2, fRew1 + 10)), icon: 'rw'}],
  };
};

// ---------------------------------------------------------------- "Scientists think it may be escaping PARASITES in its old body."
// A continuous push into the abandoned body's cut face, down to its tissue; two parasites, drawn ghosted under a
// HYPOTHESIS tag; then out again and after the head as it leaves.
export const fIn0 = S.para + 2, fIn1 = S.para + 34, fOut0 = F('old') - 4, fOut1 = S.feed - 2;
export const MICRO_A = 44;
const paraShot = (f: number): State2 => {
  const pieces = secPieces(f, 1 - ease(f, fOut0 + 10, fOut1));
  const body = pieces[0], head = pieces[1];
  const base = weakShot(S.para - 1).orbit;
  const mc = geo(body).at(MICRO_A, 0, 3.4);
  const deep: Orbit = {...base, target: mc, az: -90, el: 4, d: 130, f: 3900 * 26, cy: 960};
  const hd = geo(head).at(12, 0, 4);
  const away: Orbit = {target: [hd[0], hd[1] + 8, 3], az: -40, el: 16, d: 170, f: 3300, cy: 1040};
  const kin = ease(f, fIn0, fIn1, (u) => u * u * (3 - 2 * u)), kout = ease(f, fOut0, fOut1, (u) => u * u * (3 - 2 * u));
  const orbit = kout > 0 ? lerpOrbit(deep, away, kout) : lerpOrbit(base, deep, kin);
  return {shot: 'P', env: 'lab', orbit, pieces, frags: HOOK_FRAGS, dim: 0.42 * (1 - kout), labels: []};
};

const rest = (f: number): State2 => ({...paraShot(Math.min(f, S.feed - 1)), shot: 'R'});

export const stateAt2 = (f: number): State2 => {
  if (f < S.body) return hook(f);
  if (f < S.weak) return bodyShot(f);
  if (f < S.para) return weakShot(f);
  if (f < S.feed) return paraShot(f);
  return rest(f);
};
void inOut;
void lerpOrbit;

/** cuts in V2 (caption changes within two frames of one happen on it) */
export const CUTS2: number[] = [S.feed, S.twice];
