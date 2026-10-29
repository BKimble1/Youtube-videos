// The film as a pure function of the frame: per-frame state (environment, camera, rig pieces, props, labels).
// Every event time comes from the narration's measured word times (F('word', n)).
import {F, FRAMES, clamp, ease, inOut, lerp, outCubic, seg, smooth} from './lib';
import {Cam, P2, P3, Path, camLerp} from './geo';
import {Piece, flapPoint, piecePoint} from './slug/Slug';

export type Env = 'lab' | 'teal' | 'algae';
export type State = {
  shot: string;
  env: Partial<Record<Env, number>>;
  cam: Cam;
  pieces: Piece[];
  trail?: {path: Path; from: number; to: number; op: number};
  brush?: {tip: P3; press: number; op: number};
  ring?: {piece: Piece; op: number};
  micro?: {c: P3; op: number; para: number};
  eaten?: (i: number) => number;
  night?: number;
  labels: {text: string; op: number; icon?: 'ff' | 'rw' | 'none'; y?: number}[];
  blurHead?: number;
};

const YAW = Math.PI / 2; // world +Y reads as screen up; the slug always heads toward -Y (down the screen)

// ---------------------------------------------------------------- section boundaries (frames)
export const S = {
  hook: 0,
  body: F('and', 1), // "And its headless BODY?"
  weak: F('you'), // "You see, there's a weak spot ..."
  para: F('scientists'),
  feed: F('but'),
  grow: F('then'),
  twice: F('and', 3),
  end: FRAMES,
};

// ---------------------------------------------------------------- the lab path (hook, headless body, loop ending)
// straight under the body, then the head's own route: a gentle steer left, right and left again as it glides
export const PH = new Path([[14, 260], [10, 150], [4, 40], [-3, -30], [3, -95], [-9, -165], [-14, -235], [-5, -300], [-20, -380], [-42, -460]]);
const S0 = 200; // arc of the body's (virtual) snout when the neck is unstretched; the body stays here
const BRK = 16; // the neck parts at frame 16 (0.53 s)
const pinchOf = (gap: number) => (gap <= 7 ? (0.55 * gap) / 7 : 0.55 + (0.45 * clamp(gap - 7, 0, 6)) / 6);
const gapHook = (f: number) => 7 + 0.37 * f + 0.0003 * f * f; // f in [0, BRK]

// head speed after the break (units per frame): one steady glide with a gentle pedal-wave surge
const vHead = (f: number) => {
  const base = f < S.body ? 0.37 : lerp(0.37, 0.16, seg(f, S.body, S.body + 40));
  return base * (1 + 0.28 * Math.sin((2 * Math.PI * (f - BRK)) / 24));
};
const headTravel: number[] = [0];
for (let f = BRK + 1; f <= S.weak + 2; f++) headTravel.push(headTravel[headTravel.length - 1] + vHead(f));
const travelAt = (f: number) => headTravel[clamp(Math.round(f - BRK), 0, headTravel.length - 1)];
const surgeAt = (f: number) => 0.022 * Math.cos((2 * Math.PI * (f - BRK)) / 24);

/** detached head and abandoned body in the lab, for frames after the break */
const labPieces = (f: number, flinch = 0, bend = 0): Piece[] => {
  const t = f / 30;
  const gH = 13 * (1 - ease(f, BRK, BRK + 11, outCubic));
  const gB = 13 * (1 - ease(f, BRK, BRK + 9, outCubic));
  const sl = ease(f, BRK, BRK + 7, outCubic);
  const head: Piece = {id: 'head', path: PH, tip: S0 + 13 + travelAt(f), a0: 0, a1: 25, gap: gH, pinch: 1, seal: sl, t, surge: surgeAt(f)};
  const body: Piece = {id: 'body', path: PH, tip: S0 + gB, a0: 25, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, flinch, bend};
  return [body, head];
};

const camHook0: Cam = {x: 0, y: 0, yaw: YAW, tilt: 80, zoom: 12, oy: 990, dist: 300};
const neck0 = PH.at(S0 - 25);
camHook0.x = neck0.x;
camHook0.y = neck0.y;
export const CAM0 = camHook0;

const hook = (f: number): State => {
  const t = f / 30;
  let pieces: Piece[];
  if (f < BRK) {
    const gap = gapHook(f);
    pieces = [{id: 'whole', path: PH, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinchOf(gap), t}];
  } else {
    // 2.7-3.2 s: a small reflex in the abandoned body sets up the next line
    // the body recoils a little as the neck parts, and gives a small reflex at 2.7-3.2 s
    const fl = 0.22 * Math.sin(Math.PI * seg(f, BRK, BRK + 18)) ** 2 + 0.3 * Math.sin(Math.PI * seg(f, 80, 104)) ** 2;
    pieces = labPieces(f, fl, fl * 2);
  }
  const head = pieces[pieces.length - 1];
  const hc = piecePoint(head, 13);
  const follow = ease(f, 12, 56);
  const cam: Cam = {
    ...camHook0,
    x: lerp(neck0.x, hc[0], follow),
    y: lerp(neck0.y, hc[1] + 9, follow),
    oy: lerp(990, 1150, follow),
    tilt: lerp(80, 52, ease(f, 39, 72)),
    dist: lerp(300, 230, ease(f, 39, 72)),
    zoom: lerp(12, 10.2, ease(f, 64, 94)),
  };
  const trail = f > BRK ? {path: PH, from: S0 - 22, to: head.tip - 24, op: 0.55 * ease(f, BRK, BRK + 20)} : undefined;
  return {shot: 'H', env: {lab: 1}, cam, pieces, trail, labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, 108, 122), icon: 'ff'}]};
};

// "And its headless BODY? It keeps MOVING too." — a fine brush touches the abandoned body; it flinches
const fTouch = F('body', 1) - 3, fMove = F('moving');
const bodyShot = (f: number): State => {
  const t = f / 30;
  const fl1 = f < fTouch ? 0 : outCubic(seg(f, fTouch, fTouch + 8)) * (1 - 0.75 * ease(f, fTouch + 12, fMove - 2));
  const fl2 = 0.55 * Math.sin(Math.PI * seg(f, fMove - 3, fMove + 16)) ** 2;
  const fl = clamp(fl1 + fl2) * (1 - ease(f, fMove + 18, S.weak - 4));
  const pieces = labPieces(f, fl, 4 * fl);
  const [body, head] = pieces;
  const end = hook(S.body - 1).cam;
  const hc = piecePoint(head, 13), bc = piecePoint(body, 55);
  const k = ease(f, S.body, S.body + 36);
  const cam: Cam = {
    ...end,
    x: lerp(hc[0], lerp(hc[0], bc[0], 0.3), k),
    y: lerp(hc[1] + 9, lerp(hc[1], bc[1], 0.3), k),
    oy: lerp(1150, 1040, k),
    tilt: lerp(52, 45, k),
    dist: lerp(230, 185, k),
    zoom: lerp(10.2, 11.4, k),
  };
  // the brush comes in from the upper right, touches the right parapodium's margin, lifts away
  const contact = flapPoint(body, 1, 60, 1.02);
  const inn = ease(f, fTouch - 22, fTouch, outCubic), out = ease(f, fTouch + 10, fTouch + 40, inOut);
  const d = 120 * (1 - inn) + 70 * out;
  const tip: P3 = [contact[0] + d * 0.6, contact[1] + d * 0.55, contact[2] + 2 + d * 0.9];
  const press = clamp(seg(f, fTouch - 2, fTouch + 3)) * (1 - seg(f, fTouch + 6, fTouch + 14));
  return {
    shot: 'B', env: {lab: 1}, cam, pieces,
    trail: {path: PH, from: S0 - 22, to: head.tip - 24, op: 0.55},
    brush: {tip, press, op: clamp(seg(f, fTouch - 24, fTouch - 16)) * (1 - seg(f, fTouch + 34, fTouch + 42))},
    labels: [],
    blurHead: 0,
  };
};

// ---------------------------------------------------------------- loop ending: the regenerated slug does it again
const loopGap = (f: number) => {
  const u = f - (FRAMES - 45);
  if (u <= 0) return 0;
  return 0.002148 * u * u + 2.908e-5 * u * u * u;
};
const twiceShot = (f: number): State => {
  const t = f / 30;
  const tip = S0 + 7 - 0.37 * (FRAMES - f);
  const gap = loopGap(f);
  const whole: Piece = {id: 'whole', path: PH, tip, a0: 0, a1: 100, gap, pinch: pinchOf(gap), t, surge: gap > 0 ? 0 : surgeAt(f)};
  const nk = PH.at(tip - gap - 25);
  const k = ease(f, S.twice + 8, FRAMES - 22);
  const cam: Cam = {...camHook0, x: nk.x, y: nk.y, tilt: lerp(64, 80, k), zoom: lerp(10.4, 12, k), oy: lerp(1060, 990, k)};
  return {shot: 'T', env: {lab: 1}, cam, pieces: [whole], labels: [{text: 'TIME-LAPSE', op: seg(f, FRAMES - 30, FRAMES - 18), icon: 'ff'}]};
};

// ---------------------------------------------------------------- "You see, there's a weak spot just behind its head."
// The lab dims into the dark-teal anatomy space while the separation rewinds: the head slides back and rejoins.
const fRew0 = S.weak, fRew1 = S.weak + 20, fJoin = S.weak + 27;
const fWeak = Math.max(F('weak') - 2, fJoin), fBreak0 = F('when') + 2, fBreak = fBreak0 + 22, fHeart = F('heart', 1);
const camTeal: Cam = {x: 0, y: 0, yaw: YAW, tilt: 86, zoom: 9.6, oy: 840, dist: 300};
const slugCentre = PH.at(S0 - 45);
camTeal.x = slugCentre.x;
camTeal.y = slugCentre.y;

/** heartbeat pulse (0..1) with beats every `per` frames from f0 */
const beatAt = (f: number, f0: number, per = 24) => {
  if (f < f0) return 0;
  const u = ((f - f0) % per) / per;
  return Math.exp(-u * 9) * (1 - Math.exp(-u * 60)) * 1.6 + 0.6 * Math.exp(-Math.pow((u - 0.28) * 14, 2));
};

// after the second (anatomical) break in the teal space: the head glides off, the heart stays in the body
const vTeal = (f: number) => 0.3 * (1 + 0.28 * Math.sin((2 * Math.PI * (f - fBreak)) / 24));
const tealTravel: number[] = [0];
for (let f = fBreak + 1; f <= S.feed + 2; f++) tealTravel.push(tealTravel[tealTravel.length - 1] + vTeal(f));
const tealPieces = (f: number, xray: number): Piece[] => {
  const t = f / 30;
  const heart = xray, beat = beatAt(f, fBreak0 - 30) * (1 + 0.5 * Math.exp(-Math.pow((f - fHeart - 4) / 6, 2)));
  if (f < fBreak) {
    const gap = 13 * ease(f, fBreak0, fBreak, (u) => u * u * (1.6 - 0.6 * u));
    return [{id: 'whole', path: PH, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: pinchOf(gap), t, xray, heart, beat}];
  }
  const tr = tealTravel[clamp(Math.round(f - fBreak), 0, tealTravel.length - 1)];
  const sl = ease(f, fBreak, fBreak + 10, outCubic);
  const gH = 13 * (1 - ease(f, fBreak, fBreak + 11, outCubic)), gB = 13 * (1 - ease(f, fBreak, fBreak + 9, outCubic));
  return [
    {id: 'body', path: PH, tip: S0 + gB, a0: 25, a1: 100, gap: gB, pinch: 1, seal: sl, t: t * 0.6, xray, heart, beat},
    {id: 'head', path: PH, tip: S0 + 13 + tr, a0: 0, a1: 25, gap: gH, pinch: 1, seal: sl, t, xray, surge: 0.02 * Math.cos((2 * Math.PI * (f - fBreak)) / 24)},
  ];
};

const weakShot = (f: number): State => {
  const t = f / 30;
  const env = {lab: 1 - ease(f, fRew0 + 2, fRew0 + 24), teal: ease(f, fRew0 + 2, fRew0 + 24)};
  let pieces: Piece[];
  if (f < fRew1) {
    // the rewind: replay the lab separation backwards (frame S.weak-1 → 0), quickly
    const hf = Math.round(lerp(S.weak - 1, 0, ease(f, fRew0, fRew1, (u) => u * u * (3 - 2 * u))));
    pieces = hf < BRK ? [{id: 'whole', path: PH, tip: S0 + gapHook(hf), a0: 0, a1: 100, gap: gapHook(hf), pinch: pinchOf(gapHook(hf)), t}] : labPieces(hf);
  } else if (f < fBreak0) {
    const gap = 7 * (1 - ease(f, fRew1, fJoin, outCubic));
    const breathe = f > fWeak ? 0.14 * Math.sin(Math.PI * seg(f, fWeak, fWeak + 30)) : 0;
    pieces = [{id: 'whole', path: PH, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: Math.max(pinchOf(gap), breathe), t, xray: ease(f, fBreak0 - 12, fBreak0), heart: ease(f, fBreak0 - 12, fBreak0), beat: beatAt(f, fBreak0 - 30)}];
  } else {
    pieces = tealPieces(f, 1);
  }
  const from = bodyShot(S.weak - 1).cam;
  const k = ease(f, fRew0, fRew1 + 6);
  const push = ease(f, fWeak, fBreak0 + 6);
  const neck = PH.at(S0 - 25);
  let cam: Cam = camLerp(from, camTeal, k);
  cam = {...cam, x: lerp(cam.x, lerp(slugCentre.x, neck.x, 0.55), push), y: lerp(cam.y, lerp(slugCentre.y, neck.y, 0.55), push), zoom: cam.zoom * lerp(1, 1.18, push)};
  // after the break, drift with the head a little so it leaves the heart behind on screen
  if (f > fBreak) {
    const hd = piecePoint(pieces[1], 12);
    const k2 = ease(f, fBreak, fBreak + 50) * 0.35;
    cam = {...cam, x: lerp(cam.x, hd[0], k2), y: lerp(cam.y, hd[1], k2)};
  }
  const ring = f > fWeak && f < fBreak0 + 8 ? {piece: pieces[0], op: ease(f, fWeak, fWeak + 10) * (1 - ease(f, fBreak0 - 2, fBreak0 + 8))} : undefined;
  return {shot: 'W', env, cam, pieces, ring, labels: [{text: 'REWIND', op: seg(f, fRew0, fRew0 + 3) * (1 - seg(f, fRew1 + 2, fRew1 + 10)), icon: 'rw'}]};
};

// ---------------------------------------------------------------- "Scientists think it may be escaping PARASITES in its old body."
const fIn0 = S.para + 2, fIn1 = S.para + 38, fOut0 = F('old') - 2, fOut1 = S.feed - 6;
const paraShot = (f: number): State => {
  const pieces = tealPieces(f, 1 - 0.6 * ease(f, fOut0, fOut1));
  const body = pieces[0], head = pieces[1];
  const c = flapPoint(body, 1, 54, 0.5);
  const base = weakShot(S.para - 1).cam;
  const kin = ease(f, fIn0, fIn1, (u) => u * u * (3 - 2 * u));
  const deep: Cam = {...base, x: c[0], y: c[1], tilt: 90, zoom: 170, oy: 960};
  // out again, onto the head as it glides away (it leaves the frame at the bottom just before the cut)
  const hd = piecePoint(head, 12);
  const away: Cam = {...base, x: hd[0], y: hd[1] + 22, tilt: 70, zoom: 9.2, oy: 760};
  const kout = ease(f, fOut0, fOut1, (u) => u * u * (3 - 2 * u));
  const cam = kout > 0 ? camLerp(deep, away, kout) : camLerp(base, deep, kin);
  // the cell layer is fully gone before its grid could be smaller than the screen (grid edge at zoom ~56)
  const mop = clamp((Math.log(cam.zoom) - Math.log(72)) / (Math.log(125) - Math.log(72)));
  const para = ease(f, F('parasites') - 10, F('parasites') + 2) * (1 - ease(f, fOut0 + 4, fOut0 + 10));
  return {
    shot: 'P', env: {teal: 1}, cam, pieces,
    micro: {c: [c[0], c[1], c[2]], op: mop, para},
    labels: [{text: 'HYPOTHESIS', op: para * mop}],
  };
};

// ---------------------------------------------------------------- feeding, a week, the new heart (natural algae seabed)
export const PA = new Path([[4, 260], [3, 120], [0, 0], [-4, -120], [-8, -240]]);
const fArrive = S.feed + 30, fWeek0 = F('and', 2), fWeek1 = F('a', 3) - 4, fNew = F('new', 1), fBeat = F('beating');
const tipA0 = 233, tipFeed = 246; // the head glides on into the frond tips at arc ~246
const dayAt = (f: number) => {
  if (f < fWeek0) return 0;
  if (f < fWeek1) return 1 + Math.floor(6 * seg(f, fWeek0, fWeek1 - 2) + 1e-6);
  if (f < S.grow + 4) return 7;
  return 7 + Math.floor(15 * seg(f, S.grow + 4, S.twice - 16) + 1e-6);
};
const gOfDay = (d: number) => (d <= 7 ? lerp(0, 0.12, d / 7) : d <= 14 ? lerp(0.12, 0.5, (d - 7) / 7) : lerp(0.5, 1, Math.min(1, (d - 14) / 8)));
/** continuous growth (the day label ticks, the tissue does not) */
const growAt = (f: number) => {
  if (f < fWeek0) return 0;
  if (f < fWeek1 + 6) return gOfDay(7 * seg(f, fWeek0, fWeek1 + 6));
  if (f < S.grow + 4) return 0.12;
  return gOfDay(7 + 15 * ease(f, S.grow + 4, S.twice - 16, (u) => u * u * (3 - 2 * u)));
};
const eatenAt = (f: number) => (i: number) => {
  // fronds of the first tuft, nearest the head first; more of them through the week
  if (i >= 9) return 0;
  const order = [4, 3, 5, 2, 6, 1, 7, 0, 8].indexOf(i);
  const first = ease(f, fArrive + 4 + order * 4, fArrive + 30 + order * 4);
  const week = ease(f, fWeek0 + order * 2, fWeek0 + 14 + order * 2);
  return order < 3 ? first : Math.max(first * 0.3, week);
};
const feedPiece = (f: number): Piece => {
  const t = f / 30;
  // continues at its gliding speed across the cut (about 0.4 units a frame), then slows into the fronds
  const arrive = ease(f, S.feed, fArrive, (u) => 1 - Math.pow(1 - u, 2));
  let tip = lerp(tipA0, tipFeed, arrive);
  // feeding: small presses into the fronds; through the week it shifts between fronds
  tip += f > fArrive ? 0.5 * Math.sin((f - fArrive) * 0.45) * (1 - seg(f, fWeek1, fWeek1 + 8)) : 0;
  tip += 3 * Math.sin(Math.PI * seg(f, fWeek0, fWeek1)) ;
  const g = growAt(f);
  const xray = ease(f, fWeek1 - 2, fNew) * (1 - ease(f, S.grow + 14, S.grow + 34));
  const heart = ease(f, fNew - 4, F('heart', 2) + 6) * (1 - ease(f, S.grow + 14, S.grow + 34));
  const glide = ease(f, S.twice - 18, S.twice, (u) => u * u);
  return {id: 'head', path: PA, tip: tip + glide * 3, a0: 0, a1: 100, grow: g, t, xray, heart, beat: beatAt(f, fBeat), green: 0.7 * ease(f, fArrive, fWeek1 + 4)};
};
const camFeed0: Cam = {x: 0, y: 0, yaw: YAW, tilt: 60, zoom: 14, oy: 1000, dist: 300};
const feedShot = (f: number): State => {
  const p = feedPiece(f);
  const hd = piecePoint(p, 12);
  const rear = piecePoint(p, 27, 0, 3);
  const push = ease(f, fWeek1 - 10, fNew + 6);
  // the first frame matches the outgoing camera relative to the head (same place on screen, same size)
  const settle = ease(f, S.feed + 4, fArrive + 16);
  const cam: Cam = {...camFeed0, x: lerp(hd[0], rear[0], push), y: lerp(lerp(hd[1] + 22, hd[1] + 4, settle), rear[1], push), zoom: lerp(lerp(9.2, 14, settle), 20, push), tilt: lerp(lerp(70, 60, settle), 66, push), oy: lerp(lerp(760, 960, settle), 800, push)};
  const night = f > fWeek0 && f < fWeek1 ? 0.3 * Math.pow(Math.max(0, Math.sin(Math.PI * 6 * seg(f, fWeek0, fWeek1))), 2) : 0;
  const day = dayAt(f);
  return {
    shot: 'F', env: {algae: 1}, cam, pieces: [p], eaten: eatenAt(f), night,
    labels: [{text: 'TIME-LAPSE', op: seg(f, fWeek0 - 2, fWeek0 + 2), icon: 'ff'}, {text: day ? `DAY ${day}` : '', op: day ? 1 : 0, y: 184}],
  };
};

// ---------------------------------------------------------------- "Then, over the next few weeks, an ENTIRE NEW BODY grows back."
const growShot = (f: number): State => {
  const p = feedPiece(f);
  const g = p.grow ?? 1;
  const from = feedShot(S.grow - 1).cam;
  const ac = lerp(27, 50, smooth(clamp(g)));
  const c = piecePoint(p, ac, 0, 3);
  const k = ease(f, S.grow, S.grow + 30);
  const zoom = Math.exp(lerp(Math.log(from.zoom), Math.log(lerp(13, 8.6, smooth(clamp((g - 0.12) / 0.88)))), k));
  const cam: Cam = {...from, x: lerp(from.x, c[0], k), y: lerp(from.y, c[1], k), zoom, tilt: lerp(66, 70, ease(f, S.grow, S.twice)), oy: lerp(800, 860, k)};
  const day = dayAt(f);
  return {shot: 'G', env: {algae: 1}, cam, pieces: [p], eaten: eatenAt(f), labels: [{text: 'TIME-LAPSE', op: 1 - seg(f, S.twice - 10, S.twice - 2), icon: 'ff'}, {text: `DAY ${day}`, op: 1 - seg(f, S.twice - 10, S.twice - 2), y: 184}]};
};

const middle = (f: number): State => {
  if (f < S.para) return weakShot(f);
  if (f < S.feed) return paraShot(f);
  if (f < S.grow) return feedShot(f);
  return growShot(f);
};

export const stateAt = (f: number): State => {
  if (f < S.body) return hook(f);
  if (f < S.weak) return bodyShot(f);
  if (f < S.twice) return middle(f);
  return twiceShot(f);
};
void smooth;
void camLerp;
export type {P2};

/** event frames for the sound design (tools/export_cues.ts) */
export const CUES = () => {
  const days: number[] = [];
  let last = 0;
  for (let f = S.feed; f < S.twice; f++) {
    const d = dayAt(f);
    if (d !== last && d > 0) days.push(f);
    last = d;
  }
  return {
    frames: FRAMES, S, brk: BRK, touch: fTouch, move: fMove, rew0: fRew0, rew1: fRew1, join: fJoin, weak: fWeak, xray: fBreak0 - 12, brk2start: fBreak0, brk2: fBreak,
    heart: fHeart, in0: fIn0, in1: fIn1, para: F('parasites'), out0: fOut0, out1: fOut1, arrive: fArrive, week0: fWeek0, week1: fWeek1, newHeart: fNew, beat: fBeat, beatPer: 24,
    twice: F('twice'), loopGap0: FRAMES - 45, days,
  };
};
