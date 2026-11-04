// One continuous BrainNet timeline for S6 (the game, the votes, the coil, the flash, two rounds) and the first part of
// S7 (the flipped vote, trust, the line clears, 13 of 16). Every value is a pure function of t (seconds, absolute),
// placed from the measured narration with T(). S6 and S7 both draw BNWorld(bnState(t)), so the hand-over at
// T('Here's where I'd start') - 0.45 is seamless.
import {clamp, easeInOut, lerp} from '../dc/math';
import {T, wi} from '../lib/core';
import {K} from '../art/kit';
import {
  alongPath, BNState, CH, CW, Gaze, MON_A, MON_R, PF, ROUTE_R, routeOf, Tok, Trial, WIN_C,
} from '../art/s6world';

// ---------------------------------------------------------------- small helpers
const pr = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a || 1e-6)));
const win = (t: number, a: number, b: number, c: number, d: number) => pr(t, a, b) * (1 - pr(t, c, d));
const bump = (t: number, a: number, dur = 0.5) => (t < a || t > a + dur ? 0 : Math.sin(((t - a) / dur) * Math.PI));

type CamK = {x: number; y: number; z: number};
type Move = {a: number; b: number; to: CamK; dip?: number};
/** Camera along a list of moves: zoom in log space; a zoom move keeps its anchor steady on screen. */
export const camAlong = (t: number, start: CamK, moves: Move[]): CamK => {
  let cur = start;
  for (const m of moves) {
    if (t >= m.b) {
      cur = m.to;
      continue;
    }
    if (t <= m.a) return cur;
    const e = easeInOut((t - m.a) / (m.b - m.a));
    const l0 = Math.log(cur.z), l1 = Math.log(m.to.z);
    const dip = m.dip ?? 0;
    const z = Math.exp(lerp(l0, l1, e) - dip * Math.sin(Math.PI * e));
    const w = !dip && Math.abs(l1 - l0) > 0.25 ? (1 / z - 1 / cur.z) / (1 / m.to.z - 1 / cur.z) : e;
    return {x: lerp(cur.x, m.to.x, w), y: lerp(cur.y, m.to.y, w), z};
  }
  return cur;
};

// ---------------------------------------------------------------- the beats (seconds)
export const S6_START = () => T('Then the researchers gave') - 0.5;
export const S7_START = () => T('Here’s where I’d start') - 0.45;
export const CUT_BACK = () => T('Go back to that finger') - 0.06;

const B = () => {
  const t0 = S6_START();
  return {
    t0,
    recv: T('receiving end'),
    job: T('much better job'),
    y2019: T('In a 2019'),
    falling: T('falling-block'),
    rooms: T('three separate rooms'),
    two: T('Two players could see'),
    gap: T('gap at the bottom'),
    third: T('The third could see'),
    block: T('the block and had'),
    decide: T('had to decide'),
    rotateIt: T('rotate it'),
    seat: T('From that seat'),
    either: T('either answer'),
    each: T('Each teammate sent'),
    vote: T('sent a vote'),
    thisTime: T('This time the coil'),
    coil: T('coil', wi('This time the coil')),
    back: T('back of the receiver’s'),
    over: T('over the part of the brain'),
    little: T('A little flash'),
    flash: T('flash in their vision'),
    meantRot: T('meant rotate'),
    noFlash: T('No flash'),
    leave: T('leave it'),
    got: T('They got one vote'),
    fromEach: T('from each teammate'),
    chose: T('chose what to do'),
    fresh: T('then got a fresh'),
    freshRound: T('fresh round'),
    chance: T('a chance to change'),
    change: T('change their answer'),
    // S7
    here: T('Here’s where I’d start'),
    trust: T('trust issues'),
    ten: T('On ten of'),
    flipped: T('flipped', wi('the computer flipped')),
    advice: T('advice', wi('the computer flipped')),
    overTime: T('Over time'),
    learned: T('receivers learned'),
    whose: T('whose signal'),
    across: T('Across five teams'),
    cleared: T('cleared the line'),
    thirteen: T('thirteen'),
    outOf: T('out of sixteen'),
  };
};

// ---------------------------------------------------------------- the two trials
const boardRow9 = (): [number, number][] => [0, 1, 2, 3, 4, 6, 7].map((c) => [c, 9]);
export const trials = (): Trial[] => {
  const b = B();
  const s7 = S7_START();
  const tr1: Trial = {
    col: 3,
    board: [...boardRow9(), [0, 8], [1, 8], [7, 8]],
    rowK: [[b.t0, 0], [b.recv, 0], [b.got, 1.0], [b.fresh - 0.15, 1.0], [b.fresh + 0.4, 3, 'in'], [b.change + 0.62, 3], [b.change + 0.92, 8, 'in']],
    rotT: b.chose + 0.68,
    landT: b.change + 0.92,
    clearT: b.change + 0.98,
    inT: b.t0 - 10,
    outT: s7 + 0.15,
  };
  const tr2: Trial = {
    col: 3,
    board: [...boardRow9(), [0, 8], [6, 8], [7, 8]],
    rowK: [[s7 + 0.25, 0], [b.whose + 0.8, 1.0], [b.across + 0.45, 1.0], [b.cleared + 0.12, 8, 'in']],
    rotT: b.whose + 1.1,
    landT: b.cleared + 0.12,
    clearT: b.cleared + 0.3,
    inT: s7 + 0.25,
  };
  return [tr1, tr2];
};

// ---------------------------------------------------------------- the votes
type Vote = {who: 'A' | 'B'; text: 'YES' | 'NO'; leave: number; out: number; slot: number; flip?: number};
const TRAVEL = 0.8, TO_COIL = 0.6;
export const votes = (): Vote[] => {
  const b = B();
  return [
    // round 1 (sent on "Each teammate sent a vote", held in the computer, delivered one by one on "They got one vote")
    {who: 'A', text: 'YES', leave: b.vote - 0.05, out: b.got + 0.25, slot: -1},
    {who: 'B', text: 'YES', leave: b.vote + 0.25, out: b.fromEach + 0.17, slot: 1},
    // round 2: the half-fallen block already sits right, so both say "leave it"
    {who: 'A', text: 'NO', leave: b.freshRound, out: b.freshRound + 0.95, slot: 0},
    {who: 'B', text: 'NO', leave: b.freshRound + 0.3, out: b.freshRound + 1.25, slot: 0},
    // S7: Sender B says YES; the software flips it to NO inside the computer
    {who: 'B', text: 'YES', leave: b.ten + 1.12, out: b.flipped + 0.42, slot: 0, flip: b.flipped + 0.02},
    {who: 'A', text: 'YES', leave: b.advice + 0.05, out: b.advice + 1.05, slot: 0},
  ];
};
const finalText = (v: Vote) => (v.flip === undefined ? v.text : v.text === 'YES' ? 'NO' : 'YES');
const arriveOf = (v: Vote) => v.out + TO_COIL;
/** the coil fires for a delivered YES: the pulse times */
export const pulseTimes = () => {
  const b = B();
  return [b.little - 0.5, ...votes().filter((v) => finalText(v) === 'YES').map(arriveOf)];
};

const tokenAt = (v: Vote, t: number): Tok | null => {
  const col = v.who === 'A' ? K.senderA : K.senderB;
  const inAt = v.leave + TRAVEL;
  const arr = arriveOf(v);
  if (t < v.leave || t > arr + 0.2) return null;
  const flipText = v.flip === undefined ? undefined : finalText(v);
  const flip = v.flip === undefined ? 0 : clamp((t - (v.flip - 0.3)) / 0.6);
  const slotPos = {x: WIN_C.x + v.slot * 44, y: WIN_C.y};
  const dwellS = v.slot === 0 ? (v.flip !== undefined ? 1.05 : 0.85) : 0.55;
  if (t < inAt) {
    const u = easeInOut((t - v.leave) / TRAVEL);
    const route = routeOf(v.who);
    const p = alongPath([...route.slice(0, -1), slotPos], u);
    return {color: col, text: v.text, flipText, flip: 0, x: p.x, y: p.y, k: clamp((t - v.leave) / 0.2), s: 0.9};
  }
  if (t < v.out) {
    const k = easeInOut(clamp((t - inAt) / 0.3));
    return {color: col, text: v.text, flipText, flip, x: slotPos.x, y: slotPos.y, k: 1, s: lerp(0.9, dwellS, k)};
  }
  const u = easeInOut(clamp((t - v.out) / TO_COIL));
  const p = alongPath([slotPos, ...ROUTE_R.slice(1)], u);
  const fade = 1 - clamp((t - arr) / 0.18);
  return {color: col, text: v.text, flipText, flip, x: p.x, y: p.y, k: fade, s: lerp(dwellS, 0.75, u)};
};

// ---------------------------------------------------------------- cameras
export const VIEW = {
  F0: (() => {
    // frame 0: the piece's 3 x 2 box fills x 760..1160, y 380..640 (the 2014 touchpad's last rectangle)
    const z = 400 / (3 * CW * MON_R.s);
    const bx = MON_R.x + (PF.x + 3 * CW + 1.5 * CW - 320) * MON_R.s;
    const by = MON_R.y + (PF.y + CH - 510) * MON_R.s;
    return {x: bx, y: by + 30 / z, z};
  })(),
  RV: {x: MON_R.x, y: MON_R.y + (200 - 510) * MON_R.s, z: 3.3},
  SV: {x: MON_A.x, y: MON_A.y + (200 - 510) * MON_A.s, z: (3.3 * MON_R.s) / MON_A.s},
  WIDE: {x: 960, y: 470, z: 1},
  SENDERS: {x: 740, y: 455, z: 1.3},
  HEAD: {x: 1490, y: 715, z: 2.5},
  FLIP: {x: 930, y: 480, z: 1.2},
};
export const camAt = (t: number): CamK => {
  const b = B();
  const V = VIEW;
  return camAlong(t, V.F0, [
    {a: b.t0 + 0.15, b: b.recv - 0.1, to: V.RV},
    {a: b.y2019, b: b.falling + 0.2, to: V.WIDE},
    {a: b.two + 0.4, b: b.gap + 0.15, to: V.SV},
    {a: b.third - 0.4, b: b.block + 0.05, to: V.RV, dip: 1.1},
    {a: b.each - 1.0, b: b.each + 0.15, to: V.SENDERS},
    {a: b.thisTime - 0.1, b: b.coil + 0.3, to: V.HEAD},
    {a: b.little - 0.3, b: b.flash + 0.2, to: V.RV},
    {a: b.leave + 0.55, b: b.got + 0.05, to: V.WIDE},
    // S7
    {a: b.here + 0.08, b: b.here + 1.45, to: V.FLIP},
    {a: b.across - 0.45, b: b.across + 0.85, to: V.SV},
    {a: b.cleared + 0.75, b: b.thirteen + 0.9, to: V.WIDE},
  ]);
};

// ---------------------------------------------------------------- the state
const gazeOf = (t: number, side: -1 | 1, a: number, hold: number): {g: Gaze; ind: number; indK: number} => {
  const k = win(t, a, a + 0.35, hold, hold + 0.3);
  const ind = side * pr(t, a + 0.15, a + 0.65);
  const indK = win(t, a - 0.1, a + 0.15, hold + 0.1, hold + 0.4);
  return {g: {k, side}, ind, indK};
};
const pick = (...gs: {g: Gaze; ind: number; indK: number}[]) => {
  let best = gs[0];
  for (const g of gs) if (g.indK > best.indK || g.g.k > best.g.k) best = g;
  return best;
};

export const bnState = (t: number): BNState => {
  const b = B();
  const s7 = S7_START();
  const [tr1, tr2] = trials();
  const trs = t < s7 + 0.1 ? [tr1] : t > s7 + 0.8 ? [tr2] : [tr1, tr2];
  const vs = votes();

  // Senders' and Receiver's gazes at the flickering lights (side -1 = YES on the left, 1 = NO on the right)
  const gA = pick(gazeOf(t, -1, b.each + 0.1, b.vote + 0.5), gazeOf(t, 1, b.fresh + 0.05, b.freshRound + 0.65), gazeOf(t, -1, b.flipped + 0.3, b.advice + 0.45));
  const gB = pick(gazeOf(t, -1, b.each + 0.3, b.vote + 0.8), gazeOf(t, 1, b.fresh + 0.35, b.freshRound + 0.95), gazeOf(t, -1, b.ten + 0.12, b.ten + 1.2));
  const gR = pick(gazeOf(t, -1, b.chose + 0.03, b.chose + 0.75), gazeOf(t, 1, b.chance + 0.18, b.chance + 0.95), gazeOf(t, -1, b.whose - 0.1, b.whose + 0.85));
  const leds = {
    A: win(t, b.each - 0.2, b.each + 0.1, b.vote + 0.6, b.vote + 0.9) + win(t, b.fresh - 0.05, b.fresh + 0.2, b.freshRound + 0.7, b.freshRound + 1.0) + win(t, b.flipped + 0.1, b.flipped + 0.35, b.advice + 0.5, b.advice + 0.8),
    B: win(t, b.each - 0.2, b.each + 0.1, b.vote + 0.9, b.vote + 1.2) + win(t, b.fresh + 0.2, b.fresh + 0.45, b.freshRound + 1.0, b.freshRound + 1.3) + win(t, b.ten - 0.1, b.ten + 0.15, b.ten + 1.3, b.ten + 1.6),
    R: win(t, b.chose - 0.2, b.chose + 0.05, b.chose + 0.85, b.chose + 1.1) + win(t, b.chance - 0.05, b.chance + 0.2, b.chance + 1.05, b.chance + 1.3) + win(t, b.whose - 0.3, b.whose - 0.05, b.whose + 0.95, b.whose + 1.25),
  };

  // the coil, its pulses and the flashes
  const pulses = pulseTimes();
  const pulse = Math.max(0, ...pulses.map((p) => (t >= p && t < p + 0.5 ? (t - p) / 0.5 : 0)));
  const flashes = vs.filter((v) => finalText(v) === 'YES').map(arriveOf);
  const flashW = Math.max(0, ...flashes.map((p) => win(t, p + 0.03, p + 0.13, p + 0.38, p + 0.65)));
  const toks = vs.map((v) => tokenAt(v, t)).filter((x): x is Tok => !!x);
  const compBlink = Math.max(0, ...vs.flatMap((v) => [bump(t, v.leave + TRAVEL - 0.1, 0.4), bump(t, v.out - 0.1, 0.4)]));

  const st: BNState = {
    cam: camAt(t),
    trs,
    tint: pr(t, b.t0 + 0.05, b.t0 + 0.55),
    fxA: {gapGlow: win(t, b.two, b.two + 0.35, b.third - 0.1, b.third + 0.3), ind: gA.ind, indK: gA.indK, yesHi: gA.g.side < 0 ? gA.g.k : 0, noHi: gA.g.side > 0 ? gA.g.k : 0},
    fxB: {gapGlow: win(t, b.two, b.two + 0.35, b.third - 0.1, b.third + 0.3), ind: gB.ind, indK: gB.indK, yesHi: gB.g.side < 0 ? gB.g.k : 0, noHi: gB.g.side > 0 ? gB.g.k : 0},
    fxR: {
      fog: 1,
      ghostK: win(t, b.job, b.job + 0.3, b.y2019 - 0.1, b.y2019 + 0.25) + win(t, b.block + 0.2, b.block + 0.5, b.seat - 0.3, b.seat + 0.05) + win(t, b.meantRot, b.meantRot + 0.3, b.noFlash - 0.15, b.noFlash + 0.15),
      ghost: t < b.y2019 + 0.5 ? 0 : t < b.seat + 0.5 ? pr(t, b.rotateIt - 0.6, b.rotateIt + 0.25) : pr(t, b.meantRot + 0.1, b.meantRot + 0.75),
      q: win(t, b.seat + 0.1, b.seat + 0.4, b.each - 1.0, b.each - 0.7),
      ind: gR.ind,
      indK: gR.indK,
      yesHi: gR.g.side < 0 ? gR.g.k : 0,
      noHi: gR.g.side > 0 ? gR.g.k : 0,
    },
    leds: {A: clamp(leds.A), B: clamp(leds.B), R: clamp(leds.R)},
    gaze: {A: gA.g, B: gB.g, R: gR.g},
    toks,
    coilK: pr(t, b.coil - 0.05, b.coil + 0.75),
    pulse,
    brain: win(t, b.over - 0.05, b.over + 0.5, b.little - 0.45, b.little - 0.15),
    flashW,
    tiltR: -7 * win(t, b.trust - 0.05, b.trust + 0.3, b.trust + 0.75, b.trust + 1.15),
    roomTags: win(t, b.rooms - 0.05, b.rooms + 0.35, b.here + 0.1, b.here + 0.6),
    hallTag: [
      {text: 'BrainNet · 2019', k: win(t, b.y2019 + 0.6, b.y2019 + 1.0, b.two - 0.3, b.two)},
      {text: 'Round 1', k: win(t, b.got - 0.1, b.got + 0.25, b.fresh - 0.15, b.fresh)},
      {text: 'Round 2', k: win(t, b.fresh, b.fresh + 0.3, s7 + 0.5, s7 + 0.8)},
      {text: '10 of 16 trials', k: win(t, b.ten + 0.1, b.ten + 0.45, b.overTime - 0.4, b.overTime - 0.15)},
    ],
    grid: {k: win(t, b.ten + 0.1, b.ten + 0.45, b.overTime - 0.4, b.overTime - 0.15), n: 10 * clamp((t - (b.ten + 0.5)) / 1.3)},
    bal: {
      k: win(t, b.overTime - 0.1, b.overTime + 0.25, b.across - 0.6, b.across - 0.3),
      tilt: 8 * (pr(t, b.overTime + 0.55, b.overTime + 0.9) + pr(t, b.learned + 0.25, b.learned + 0.6) + pr(t, b.whose + 0.15, b.whose + 0.5)),
      n: 0,
    },
    tally: {k: pr(t, b.thirteen - 0.12, b.thirteen + 0.2), n: 13 * clamp((t - (b.thirteen + 0.1)) / 1.0), sub: pr(t, b.outOf + 0.1, b.outOf + 0.45)},
    compBlink,
    look: {A: 1, B: 1},
  };
  return st;
};

/** every sound event of the BrainNet timeline (S6 and S7 split it at S7_START) */
export const bnCues = (): {t: number; kind: string; gain?: number}[] => {
  const b = B();
  const s7 = S7_START();
  const [tr1, tr2] = trials();
  const vs = votes();
  const out: {t: number; kind: string; gain?: number}[] = [
    {t: b.t0 + 0.2, kind: 'whoosh', gain: 0.4},
    {t: b.recv - 0.2, kind: 'pop', gain: 0.5},
    {t: b.job, kind: 'pop', gain: 0.5},
    {t: b.y2019, kind: 'whoosh', gain: 0.6},
    {t: b.y2019 + 0.65, kind: 'pop', gain: 0.5},
    {t: b.rooms, kind: 'pop', gain: 0.6},
    {t: b.two + 0.05, kind: 'tick', gain: 0.6},
    {t: b.two + 0.4, kind: 'whoosh', gain: 0.5},
    {t: b.third - 0.4, kind: 'whoosh', gain: 0.6},
    {t: b.rotateIt - 0.55, kind: 'rotate', gain: 0.5},
    {t: b.seat + 0.1, kind: 'pop', gain: 0.5},
    {t: b.each - 1.0, kind: 'whoosh', gain: 0.5},
    {t: b.each - 0.15, kind: 'tick', gain: 0.4},
    {t: b.thisTime - 0.1, kind: 'whoosh', gain: 0.5},
    {t: b.coil + 0.6, kind: 'tick', gain: 0.6},
    {t: b.over, kind: 'pop', gain: 0.5},
    {t: b.little - 0.3, kind: 'whoosh', gain: 0.4},
    {t: b.meantRot, kind: 'pop', gain: 0.5},
    {t: b.meantRot + 0.1, kind: 'rotate', gain: 0.4},
    {t: b.leave, kind: 'pop', gain: 0.5},
    {t: b.leave + 0.55, kind: 'whoosh', gain: 0.4},
    {t: b.got - 0.1, kind: 'pop', gain: 0.5},
    {t: b.fresh, kind: 'pop', gain: 0.5},
    // S7
    {t: b.here + 0.08, kind: 'whoosh', gain: 0.4},
    {t: s7 + 0.3, kind: 'pop', gain: 0.4},
    {t: b.ten + 0.1, kind: 'pop', gain: 0.5},
    {t: b.across - 0.45, kind: 'whoosh', gain: 0.5},
    {t: b.cleared + 0.75, kind: 'whoosh', gain: 0.4},
    {t: b.thirteen - 0.12, kind: 'pop', gain: 0.5},
    {t: b.outOf + 0.1, kind: 'pop', gain: 0.5},
  ];
  // the flickering lights come on (a soft tick per selection)
  for (const v of vs) out.push({t: v.leave, kind: 'vote'});
  for (const v of vs) if (v.flip !== undefined) out.push({t: v.flip, kind: 'flip'});
  for (const v of vs) out.push(finalText(v) === 'YES' ? {t: arriveOf(v), kind: 'coil_pulse'} : {t: arriveOf(v), kind: 'tick', gain: 0.35});
  for (const v of vs) if (finalText(v) === 'YES') out.push({t: arriveOf(v) + 0.06, kind: 'flash', gain: 0.6});
  // the explained pulse and its flash (seen from the Receiver's seat)
  out.push({t: b.little - 0.5, kind: 'coil_pulse'});
  out.push({t: b.flash + 0.12, kind: 'flash'});
  // the turns, the line clears
  for (const tr of [tr1, tr2]) {
    if (tr.rotT !== undefined) out.push({t: tr.rotT, kind: 'rotate'});
    if (tr.clearT !== undefined) out.push({t: tr.clearT, kind: 'line_clear'});
  }
  // trust balance steps, the 10-of-16 marks, the 13-of-16 tally
  for (const a of [b.overTime + 0.55, b.learned + 0.25, b.whose + 0.15]) out.push({t: a, kind: 'tick', gain: 0.5});
  for (let i = 0; i < 10; i += 2) out.push({t: b.ten + 0.5 + (i / 10) * 1.3, kind: 'tick', gain: 0.35});
  for (let i = 0; i < 13; i += 2) out.push({t: b.thirteen + 0.1 + (i / 13) * 1.0, kind: 'tick', gain: 0.4});
  return out.sort((x, y) => x.t - y.t);
};
