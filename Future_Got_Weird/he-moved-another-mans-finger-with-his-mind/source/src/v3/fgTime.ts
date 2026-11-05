// V2 F + G: one continuous BrainNet timeline (the game, the votes, the coil, the flashes, the flipped vote). Every value
// is a pure function of t (absolute seconds), placed from the measured narration with T().
import {clamp, easeInOut, lerp} from '../dc/math';
import {K} from '../art/kit';
import {T, TE, wi} from './core2';
import {Trial} from '../art/s6world';
import {FGState, Gaze, routeOf, routeOut, SLOT, STIM, Tok, alongPath, P2} from './fgWorld';

export const pr = (t: number, a: number, b: number, e: (x: number) => number = easeInOut) => e(clamp((t - a) / (b - a || 1e-6)));
export const win = (t: number, a: number, b: number, c: number, d: number) => pr(t, a, b) * (1 - pr(t, c, d));
export const bump = (t: number, a: number, dur = 0.5) => (t < a || t > a + dur ? 0 : Math.sin(((t - a) / dur) * Math.PI));

/** the narration beats (seconds) */
export const FB = () => ({
  f0: T('Then the researchers gave') - 0.5,
  g0: T('Here’s where I’d start') - 0.45,
  recv: T('receiving end'),
  job: T('much better job'),
  y2019: T('In a 2019'),
  three: T('three people'),
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
  reasonable: T('looked reasonable'),
  each: T('Each teammate sent'),
  vote: T('sent a vote'),
  thisTime: T('This time the coil'),
  coil: T('coil', wi('This time the coil')),
  back: T('back of the receiver’s'),
  over: T('over the part of the brain'),
  vision: T('involved in vision'),
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
  votes2: T('votes and a chance'),
  chance: T('a chance to change'),
  change: T('change their answer'),
  here: T('Here’s where I’d start'),
  trust: T('trust issues'),
  ten: T('On ten of'),
  sixteen: T('sixteen trials'),
  computer: T('the computer flipped'),
  flipped: T('flipped', wi('the computer flipped')),
  advice: T('advice', wi('the computer flipped')),
  overTime: T('Over time'),
  learned: T('receivers learned'),
  whose: T('whose signal'),
  across: T('Across five teams'),
  cleared: T('cleared the line'),
  thirteen: T('thirteen times'),
  outOf: T('out of sixteen'),
  goBack: T('Go back to that finger'),
  first: T('In the first game'),
  pulse1: T('pulse helped'),
  decide2: T('decide when somebody'),
  moved: T('hand moved'),
  six: T('Six years later'),
  pulse2: T('pulse could give'),
  advice2: T('give you advice'),
  andYou: T('And you could decide'),
  otherGuy: T('the other guy was wrong'),
  wrongEnd: TE('the other guy was wrong'),
});
export type Beats = ReturnType<typeof FB>;

// ---------------------------------------------------------------- the two trials
const row9 = (): [number, number][] => [0, 1, 2, 3, 4, 6, 7].map((c) => [c, 9]);
export const fgTrials = (b = FB()): Trial[] => {
  const tr1: Trial = {
    col: 3,
    board: [...row9(), [0, 8], [1, 8], [7, 8]],
    rowK: [[b.f0 - 5, 1], [b.fresh + 0.02, 1], [b.fresh + 0.4, 3], [b.change + 0.3, 3], [b.change + 0.72, 8, 'in']],
    rotT: b.chose + 0.63,
    landT: b.change + 0.72,
    clearT: b.change + 0.78,
    inT: b.f0 - 10,
    outT: b.g0 - 0.1,
  };
  const t2 = b.g0 + 0.12;
  const tr2: Trial = {
    col: 3,
    board: [...row9(), [0, 8], [6, 8], [7, 8]],
    rowK: [[t2, 1], [b.cleared - 0.85, 1], [b.cleared - 0.12, 8, 'in']],
    rotT: b.whose + 0.45,
    landT: b.cleared - 0.12,
    clearT: b.cleared - 0.05,
    inT: t2,
  };
  return [tr1, tr2];
};

// ---------------------------------------------------------------- the votes
export type Vote = {who: 'A' | 'B'; text: 'YES' | 'NO'; leave: number; hub: number; out: number; stim: number; flip?: number};
export const fgVotes = (b = FB()): Vote[] => [
  // F round 1: both say "rotate"; A's is delivered on "A little flash", B's on "They got one vote from each teammate"
  {who: 'A', text: 'YES', leave: b.vote - 0.5, hub: b.vote + 1.1, out: b.little - 1.45, stim: b.little - 0.62},
  {who: 'B', text: 'YES', leave: b.vote - 0.2, hub: b.vote + 1.25, out: b.got - 1.05, stim: b.got - 0.2},
  // F round 2: the half-fallen block already sits right, so both say "leave it"
  {who: 'A', text: 'NO', leave: b.votes2 - 0.05, hub: b.votes2 + 1.2, out: b.votes2 + 1.25, stim: b.votes2 + 1.95},
  {who: 'B', text: 'NO', leave: b.votes2 + 0.15, hub: b.votes2 + 1.35, out: b.votes2 + 1.4, stim: b.votes2 + 2.1},
  // G: Sender B (the bad Sender) says YES; the software flips it to NO inside the computer. A's YES passes through.
  {who: 'B', text: 'YES', leave: b.ten + 0.32, hub: b.ten + 1.67, out: b.advice - 0.15, stim: b.overTime - 0.1, flip: b.flipped + 0.02},
  {who: 'A', text: 'YES', leave: b.ten + 0.9, hub: b.computer + 0.9, out: b.advice - 0.25, stim: b.overTime - 0.45},
];
export const finalText = (v: Vote) => (v.flip === undefined ? v.text : v.text === 'YES' ? 'NO' : 'YES');
/** a delivered YES becomes a pulse at the coil (a short charge after the stimulator gets the command) */
export const PULSE_LAG = 0.33;
export const pulseTimes = (b = FB()) => fgVotes(b).filter((v) => finalText(v) === 'YES').map((v) => v.stim + PULSE_LAG);

const ease = easeInOut;
export const tokenPos = (v: Vote, t: number): P2 | null => {
  if (t < v.leave || t > v.stim) return null;
  if (t < v.hub) return alongPath(routeOf(v.who), ease(clamp((t - v.leave) / (v.hub - v.leave))));
  if (t < v.out) return SLOT[v.who];
  return alongPath(routeOut(v.who), ease(clamp((t - v.out) / (v.stim - v.out))));
};
const tokenAt = (v: Vote, t: number): Tok | null => {
  const p = tokenPos(v, t);
  if (!p) return null;
  const col = v.who === 'A' ? K.senderA : K.senderB;
  const flipText = v.flip === undefined ? undefined : finalText(v);
  const flip = v.flip === undefined ? 0 : clamp((t - v.flip) / 0.42);
  const kIn = clamp((t - v.leave) / 0.22);
  const kOut = 1 - clamp((t - (v.stim - 0.14)) / 0.14);
  const inHub = t >= v.hub - 0.15 && t < v.out + 0.15;
  return {color: col, text: v.text, flipText, flip, x: p.x, y: p.y, k: Math.min(kIn, kOut), s: inHub ? 1.0 : 0.95};
};

// ---------------------------------------------------------------- gazes at the flickering lights (side -1 = YES, 1 = NO)
const gz = (t: number, side: -1 | 1, a: number, hold: number) => ({k: win(t, a, a + 0.3, hold, hold + 0.3), side});
const pick = (...gs: Gaze[]): Gaze => gs.reduce((best, g) => (g.k > best.k ? g : best), {k: 0, side: -1} as Gaze);

export const fgState = (t: number, b = FB()): FGState => {
  const [tr1, tr2] = fgTrials(b);
  const trs = t < b.g0 ? [tr1] : t > b.g0 + 0.6 ? [tr2] : [tr1, tr2];
  const vs = fgVotes(b);
  const [a1, b1, a2, b2, b3, a3] = vs;
  const gA = pick(gz(t, -1, a1.leave - 0.42, a1.leave + 0.35), gz(t, 1, a2.leave - 0.42, a2.leave + 0.4), gz(t, -1, a3.leave - 0.4, a3.leave + 0.3));
  const gB = pick(gz(t, -1, b1.leave - 0.42, b1.leave + 0.35), gz(t, 1, b2.leave - 0.42, b2.leave + 0.4), gz(t, -1, b3.leave - 0.42, b3.leave + 0.35));
  const chooseR1 = b.chose + 0.0, chooseG = b.whose - 0.1;
  const gR = pick(
    gz(t, -1, b.either - 0.6, b.either - 0.05),
    gz(t, 1, b.either + 0.25, b.reasonable + 0.05),
    gz(t, -1, chooseR1, chooseR1 + 0.75),
    gz(t, -1, chooseG, chooseG + 0.8),
  );
  const ledsA = win(t, a1.leave - 0.6, a1.leave - 0.4, a1.leave + 0.35, a1.leave + 0.6) + win(t, a2.leave - 0.6, a2.leave - 0.4, a2.leave + 0.4, a2.leave + 0.65) + win(t, a3.leave - 0.6, a3.leave - 0.4, a3.leave + 0.3, a3.leave + 0.5);
  const ledsB = win(t, b1.leave - 0.6, b1.leave - 0.4, b1.leave + 0.35, b1.leave + 0.6) + win(t, b2.leave - 0.6, b2.leave - 0.4, b2.leave + 0.4, b2.leave + 0.65) + win(t, b3.leave - 0.6, b3.leave - 0.4, b3.leave + 0.35, b3.leave + 0.6);
  const ledsR = win(t, b.job - 0.6, b.job - 0.3, b.job + 1.1, b.job + 1.5) + win(t, b.decide - 0.3, b.decide, b.reasonable + 0.5, b.reasonable + 0.9) + win(t, chooseR1 - 0.3, chooseR1 - 0.05, chooseR1 + 0.9, chooseR1 + 1.2) + win(t, chooseG - 0.3, chooseG - 0.05, chooseG + 0.95, chooseG + 1.25);
  const capOf = (v: Vote) => win(t, v.leave - 0.45, v.leave - 0.25, v.leave - 0.05, v.leave + 0.2);
  // the Receiver's screen: the hidden lower half (open only for the sender->receiver match and the final reveals)
  const swap1 = b.third + 0.08, swap2 = b.here + 0.1;
  const fogR = t < b.two ? 1 : t < swap1 ? 0 : t < b.fresh + 0.5 ? pr(t, swap1 + 0.05, swap1 + 0.75) : t < swap2 ? 0 : t < b.whose + 0.9 ? pr(t, swap2 + 0.05, swap2 + 0.5) : 1 - pr(t, b.whose + 1.0, b.whose + 1.6);
  const ghostK = win(t, b.job - 0.55, b.job - 0.25, b.job + 1.0, b.job + 1.4) + win(t, b.decide - 0.1, b.decide + 0.15, b.rotateIt + 0.75, b.rotateIt + 1.1) + win(t, b.either - 0.75, b.either - 0.5, b.reasonable + 0.5, b.reasonable + 0.85)
    + win(t, b.meantRot - 0.15, b.meantRot + 0.15, b.noFlash - 0.3, b.noFlash - 0.05) + win(t, b.noFlash + 0.1, b.noFlash + 0.35, b.leave + 0.15, b.leave + 0.5);
  const ghost = t < b.decide - 0.2 ? pr(t, b.job - 0.15, b.job + 0.55) : t < b.either - 0.8 ? pr(t, b.decide + 0.4, b.rotateIt + 0.4) : t < b.meantRot - 0.2 ? pr(t, b.either - 0.55, b.either - 0.1) * (1 - pr(t, b.either + 0.3, b.either + 0.8)) : t < b.noFlash ? pr(t, b.meantRot + 0.1, b.meantRot + 0.7) : 0;
  const pulses = pulseTimes(b);
  const pulse = Math.max(0, ...pulses.map((p) => (t >= p && t < p + 0.55 ? (t - p) / 0.55 : 0)));
  const yesStims = vs.filter((v) => finalText(v) === 'YES').map((v) => v.stim);
  const look = -0.85 * win(t, b.either - 0.6, b.either - 0.25, b.either + 0.1, b.either + 0.4) + 0.85 * win(t, b.either + 0.2, b.either + 0.55, b.reasonable + 0.1, b.reasonable + 0.5)
    - 0.5 * win(t, chooseR1, chooseR1 + 0.3, chooseR1 + 0.8, chooseR1 + 1.1) - 0.5 * win(t, chooseG, chooseG + 0.3, chooseG + 0.85, chooseG + 1.15);
  const travelGlow = (v: Vote) => win(t, v.leave, v.leave + 0.15, v.hub - 0.1, v.hub + 0.1);
  const outGlow = (v: Vote) => win(t, v.out, v.out + 0.12, v.stim - 0.1, v.stim + 0.05);
  const fxR = {
    fog: fogR,
    gapGlow: win(t, b.whose + 1.25, b.whose + 1.5, b.cleared - 0.2, b.cleared),
    ghost,
    ghostK: clamp(ghostK),
    q: win(t, b.reasonable - 0.05, b.reasonable + 0.25, b.reasonable + 0.7, b.reasonable + 1.0),
    ind: gR.side * gR.k,
    indK: gR.k,
    yesHi: gR.side < 0 ? gR.k : 0,
    noHi: gR.side > 0 ? gR.k : 0,
    accent: K.receiver,
  };
  const sfx = (g: Gaze, col: string, glow: number) => ({fog: 0, gapGlow: glow, ind: g.side * g.k, indK: g.k, yesHi: g.side < 0 ? g.k : 0, noHi: g.side > 0 ? g.k : 0, accent: col});
  const gap2 = win(t, b.fresh + 0.45, b.fresh + 0.7, b.change + 0.6, b.change + 0.9);
  return {
    t,
    trs,
    tint: pr(t, b.f0 + 0.05, b.f0 + 0.55),
    fx: {
      A: sfx(gA, K.senderA, win(t, b.two + 0.05, b.two + 0.35, swap1 - 0.45, swap1 - 0.1) + gap2),
      B: sfx(gB, K.senderB, win(t, b.two + 0.05, b.two + 0.35, swap1 - 0.45, swap1 - 0.1) + gap2),
      R: fxR,
    },
    leds: {A: clamp(ledsA), B: clamp(ledsB), R: clamp(ledsR)},
    gaze: {A: gA, B: gB, R: gR},
    cap: {A: clamp(capOf(a1) + capOf(a2) + capOf(a3)), B: clamp(capOf(b1) + capOf(b2) + capOf(b3))},
    toks: vs.map((v) => tokenAt(v, t)).filter((x): x is Tok => !!x),
    coilK: pr(t, b.coil - 0.05, b.coil + 0.65),
    pulse,
    brain: win(t, b.over - 0.05, b.over + 0.45, b.little - 0.75, b.little - 0.4),
    stimBlink: Math.max(0, ...yesStims.map((s) => bump(t, s - 0.05, 0.5))),
    look,
    tilt: 0,
    strip: {k: win(t, b.sixteen - 0.1, b.sixteen + 0.2, b.advice + 0.3, b.advice + 0.6), n: 10 * clamp((t - (b.sixteen + 0.15)) / 0.75)},
    glitch: win(t, b3.flip! - 0.12, b3.flip!, b3.flip! + 0.45, b3.flip! + 0.7),
    hubBlink: Math.max(0, ...vs.flatMap((v) => [bump(t, v.hub - 0.1, 0.4), bump(t, v.out - 0.1, 0.4)])),
    cableGlow: {
      A: clamp(Math.max(...[a1, a2, a3].map(travelGlow))),
      B: clamp(Math.max(...[b1, b2, b3].map(travelGlow))),
      out: clamp(Math.max(...vs.map(outGlow))),
    },
  };
};

/** a smoothed follow point for the camera (the token's path averaged over +-0.2 s, so corners do not jerk) */
export const follow = (v: Vote, t: number): P2 => {
  let sx = 0, sy = 0, n = 0;
  for (let k = -4; k <= 4; k++) {
    const tt = clamp(t + k * 0.05, v.leave, v.stim);
    const p = tokenPos(v, tt) ?? SLOT[v.who];
    sx += p.x;
    sy += p.y;
    n++;
  }
  return {x: sx / n, y: sy / n};
};
export {lerp, STIM};
