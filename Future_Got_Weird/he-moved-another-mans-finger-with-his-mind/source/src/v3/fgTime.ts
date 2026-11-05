// V3 F + G: one continuous BrainNet timeline (the game, the votes, the lab computer, the coil, the flashes, the flipped
// vote). Every value is a pure function of t (absolute seconds), placed from the measured narration with T().
// V3 changes: votes enter the lab computer's tower and appear in its relay software (where the bad Sender's vote is
// flipped), then leave the tower for the stimulator; the round-2 NO votes are shown arriving (no pulse); the
// Receiver's choices and the shot list (SH) are timed to the words.
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
  gEnd: T('Go back to that finger') - 0.3,
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
  wrongEnd: TE('the other guy was wrong'),
});
export type Beats = ReturnType<typeof FB>;

/** The V3 shot list (absolute seconds). F: 135.87 -> 178.87; G: 178.87 -> gEnd. */
export const SH = (b = FB()) => {
  const s = {
    // F
    matchEnd: b.recv + 0.31, // 138.55: cut on the turning ghost to the Receiver's face
    rf1End: b.y2019 + 0.24, // 141.25: eyeline cut to the shot from behind
    ots: b.y2019 + 0.24,
    wideIn: b.rooms + 0.45, // the floor wide
    aMed: b.gap + 0.15, // Sender A's room, A and the gap
    aFull: b.third - 0.2, // A's screen fills the frame
    swap1: b.third + 0.08, // identical framing: A's screen -> the Receiver's screen
    rf2: b.seat - 0.05, // 153.39 Receiver's face: either answer
    sa1: b.each - 0.62, // 156.56 Sender A votes
    sb1: b.vote - 0.13, // 157.75 Sender B votes
    hub1: b.vote + 1.02, // 158.90 the votes arrive in the lab computer
    in1: [b.flash - 0.5, b.flash - 0.05] as [number, number], // push through the head
    out1: [b.leave + 0.5, b.got - 0.6] as [number, number], // pull back out
    in2: [b.got + 0.3, b.got + 0.75] as [number, number],
    rf3: b.chose - 0.17, // 173.45 the Receiver decides
    rmon3: b.chose + 0.83, // 174.45 cut on the nod: the block turns
    pull2: [b.fresh + 0.05, b.fresh + 1.0] as [number, number], // pull back to the floor wide (round 2)
    push2: [b.change + 0.33, b.change + 1.2] as [number, number], // push into the Receiver's screen
    // G
    rf4: b.here + 0.53, // 179.85 sceptical
    sb2: b.ten - 0.23, // 182.50 Sender B votes (the bad Sender)
    hub2: b.ten + 0.72, // 183.45 into the lab computer
    track3: [b.advice - 0.25, b.overTime - 0.7] as [number, number], // follow the outputs to the coil
    in3: [b.overTime + 0.0, b.overTime + 0.4] as [number, number],
    rf5: b.overTime + 0.9, // 188.40 the record
    rfull5: b.whose + 1.36, // 190.55 the Receiver's screen
    rf6: b.cleared + 0.37, // 192.80 relief
    tiles: b.thirteen + 0.05, // 193.40 16 trials
    merge: b.outOf + 0.85, // 195.13 the cleared lines become one bar
  };
  return s;
};

// ---------------------------------------------------------------- the two trials
const row9 = (): [number, number][] => [0, 1, 2, 3, 4, 6, 7].map((c) => [c, 9]);
export const fgTrials = (b = FB()): Trial[] => {
  const s = SH(b);
  const tr1: Trial = {
    col: 3,
    board: [...row9(), [0, 8], [1, 8], [7, 8]],
    rowK: [[b.f0 - 5, 1], [s.rmon3 + 0.55, 1], [s.rmon3 + 0.95, 4], [s.push2[0] + 0.15, 4], [s.push2[1] - 0.25, 8, 'in']],
    rotT: s.rmon3 + 0.12,
    landT: s.push2[1] - 0.25,
    clearT: s.push2[1] - 0.2,
    inT: b.f0 - 10,
    outT: b.g0 + 0.15,
  };
  const t2 = b.g0 + 0.35;
  const tr2: Trial = {
    col: 3,
    board: [...row9(), [0, 8], [6, 8], [7, 8]],
    rowK: [[t2, 1], [s.rfull5 + 0.75, 1], [b.cleared - 0.1, 8, 'in']],
    rotT: s.rfull5 + 0.2,
    landT: b.cleared - 0.1,
    clearT: b.cleared - 0.05,
    inT: t2,
  };
  return [tr1, tr2];
};

// ---------------------------------------------------------------- the votes
// leave: the chip leaves the Sender's cap; hub: it enters the lab computer's tower (and appears in the relay
// software); out: it leaves the tower for the stimulator; stim: it reaches the stimulator (a YES becomes a pulse).
export type Vote = {who: 'A' | 'B'; text: 'YES' | 'NO'; leave: number; hub: number; out: number; stim: number; flip?: number};
export const fgVotes = (b = FB()): Vote[] => {
  const s = SH(b);
  return [
    // F round 1: both say "rotate"; A's is delivered on "A little flash", B's on "They got one vote from each teammate"
    {who: 'A', text: 'YES', leave: b.each + 0.1, hub: s.hub1 + 0.22, out: b.little - 1.5, stim: b.little - 0.62},
    {who: 'B', text: 'YES', leave: b.vote + 0.5, hub: s.hub1 + 0.52, out: s.out1[1] - 0.45, stim: b.got - 0.3},
    // F round 2: the half-fallen block already sits right, so both say "leave it"; the NOs arrive, no pulse
    {who: 'A', text: 'NO', leave: b.freshRound + 0.25, hub: b.votes2 + 0.42, out: b.votes2 + 0.62, stim: b.votes2 + 1.18},
    {who: 'B', text: 'NO', leave: b.freshRound + 0.42, hub: b.votes2 + 0.58, out: b.votes2 + 0.78, stim: b.votes2 + 1.34},
    // G: Sender B (the bad Sender) says YES; the relay software flips it to NO inside the computer. A's YES passes.
    {who: 'B', text: 'YES', leave: b.ten + 0.27, hub: b.ten + 1.2, out: b.advice - 0.1, stim: b.overTime - 0.38, flip: b.flipped + 0.05},
    {who: 'A', text: 'YES', leave: b.ten + 0.5, hub: b.computer - 0.2, out: b.advice - 0.25, stim: b.overTime - 0.75},
  ];
};
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
  // into the tower's port, then up on the relay screen; off the screen, then out of the tower's output port
  const port = t < v.hub ? 1 - clamp((t - (v.hub - 0.12)) / 0.12) : t < v.out ? Math.min(clamp((t - v.hub) / 0.15), 1 - clamp((t - (v.out - 0.12)) / 0.12)) : clamp((t - v.out) / 0.12);
  const inHub = t >= v.hub && t < v.out;
  return {color: col, text: v.text, flipText, flip, x: p.x, y: p.y, k: Math.min(kIn, kOut, port), s: inHub ? 0.82 : 0.95};
};

// ---------------------------------------------------------------- gazes at the flickering lights (side -1 = YES, 1 = NO)
const gz = (t: number, side: -1 | 1, a: number, hold: number) => ({k: win(t, a, a + 0.3, hold, hold + 0.3), side});
const pick = (...gs: Gaze[]): Gaze => gs.reduce((best, g) => (g.k > best.k ? g : best), {k: 0, side: -1} as Gaze);

export const fgState = (t: number, b = FB()): FGState => {
  const s = SH(b);
  const [tr1, tr2] = fgTrials(b);
  const trs = t < b.g0 + 0.2 ? [tr1] : t > b.g0 + 0.9 ? [tr2] : [tr1, tr2];
  const vs = fgVotes(b);
  const [a1, b1, a2, b2, b3, a3] = vs;
  const gA = pick(gz(t, -1, a1.leave - 0.45, a1.leave + 0.35), gz(t, 1, a2.leave - 0.45, a2.leave + 0.4), gz(t, -1, a3.leave - 0.45, a3.leave + 0.3));
  const gB = pick(gz(t, -1, b1.leave - 0.45, b1.leave + 0.35), gz(t, 1, b2.leave - 0.45, b2.leave + 0.4), gz(t, -1, b3.leave - 0.45, b3.leave + 0.35));
  const chooseR1 = b.chose - 0.05, keepR2 = s.push2[0] - 0.35, chooseG = s.rfull5 - 0.5;
  const gR = pick(
    gz(t, -1, b.either - 0.1, b.either + 0.5),
    gz(t, 1, b.reasonable - 0.05, b.reasonable + 0.5),
    gz(t, -1, chooseR1, s.rmon3 + 0.5),
    gz(t, 1, keepR2, s.push2[1] - 0.1),
    gz(t, -1, chooseG, s.rfull5 + 0.55),
  );
  // the lights flicker while a vote is being given (both lights; the Sender attends to one)
  const voteWin = (v: Vote) => win(t, v.leave - 0.95, v.leave - 0.75, v.leave + 0.35, v.leave + 0.6);
  const ledsA = Math.max(voteWin(a1), voteWin(a2), voteWin(a3));
  const ledsB = Math.max(voteWin(b1), voteWin(b2), voteWin(b3));
  const ledsR = Math.max(win(t, b.decide - 0.3, b.decide, b.reasonable + 0.7, b.reasonable + 1.0), win(t, chooseR1 - 0.3, chooseR1 - 0.05, s.rmon3 + 0.6, s.rmon3 + 0.9),
    win(t, keepR2 - 0.3, keepR2, s.push2[1] - 0.1, s.push2[1] + 0.2), win(t, chooseG - 0.3, chooseG, s.rfull5 + 0.6, s.rfull5 + 0.9));
  const capOf = (v: Vote) => win(t, v.leave - 0.6, v.leave - 0.35, v.leave - 0.05, v.leave + 0.2);
  // the Receiver's screen: the hidden lower half (open for the sender -> receiver match and the line clears)
  const swap1 = s.swap1;
  const fogR = t < swap1 ? 1
    : t < b.g0 - 2 ? pr(t, swap1 + 0.05, swap1 + 0.75) * (1 - pr(t, s.push2[0] + 0.1, s.push2[0] + 0.5))
    : t < b.g0 + 0.5 ? 0
    : t < s.rfull5 ? pr(t, b.g0 + 0.55, b.g0 + 1.0)
    : 1 - pr(t, s.rfull5 + 0.55, s.rfull5 + 0.95);
  const ghostK = win(t, b.recv - 0.75, b.recv - 0.5, s.matchEnd + 0.3, s.matchEnd + 0.5) + win(t, b.decide - 0.1, b.decide + 0.15, s.rf2 + 0.2, s.rf2 + 0.4)
    + win(t, b.meantRot - 0.15, b.meantRot + 0.15, b.noFlash - 0.3, b.noFlash - 0.05) + win(t, b.noFlash + 0.1, b.noFlash + 0.35, b.leave + 0.35, b.leave + 0.6);
  const ghost = t < b.decide - 0.2 ? pr(t, b.recv - 0.3, b.recv + 0.5) : t < b.meantRot - 0.2 ? pr(t, b.decide + 0.4, b.rotateIt + 0.4) : t < b.noFlash ? pr(t, b.meantRot + 0.1, b.meantRot + 0.7) : 0;
  const pulses = pulseTimes(b);
  const pulse = Math.max(0, ...pulses.map((p) => (t >= p && t < p + 0.5 ? (t - p) / 0.5 : 0)));
  // the stimulator's display: what the last command was (pulse / no pulse)
  const started = vs.filter((v) => t >= v.stim - 0.12).sort((x, y) => y.stim - x.stim);
  const lastV = started[0] ?? vs[0];
  const stimCmd = {v: lastV, k: started.length ? win(t, lastV.stim - 0.12, lastV.stim, lastV.stim + 0.55, lastV.stim + 0.7) : 0};
  const yesStims = vs.filter((v) => finalText(v) === 'YES').map((v) => v.stim);
  const look = -1 * win(t, s.rf1End - 0.35, s.rf1End - 0.1, s.ots + 0.9, s.ots + 1.5)
    - 0.55 * win(t, chooseR1, chooseR1 + 0.3, s.rmon3 + 0.4, s.rmon3 + 0.7) + 0.55 * win(t, keepR2, keepR2 + 0.3, s.push2[1] - 0.2, s.push2[1] + 0.1);
  const travelGlow = (v: Vote) => win(t, v.leave, v.leave + 0.15, v.hub - 0.1, v.hub + 0.1);
  const outGlow = (v: Vote) => win(t, v.out, v.out + 0.12, v.stim - 0.1, v.stim + 0.05);
  const fxR = {
    fog: fogR,
    gapGlow: 0,
    ghost,
    ghostK: clamp(ghostK),
    q: win(t, b.rotateIt + 0.3, b.rotateIt + 0.6, s.rf2 + 0.2, s.rf2 + 0.4),
    ind: gR.side * gR.k,
    indK: gR.k,
    yesHi: gR.side < 0 ? gR.k : 0,
    noHi: gR.side > 0 ? gR.k : 0,
    accent: K.receiver,
  };
  const sfx = (g: Gaze, col: string, glow: number) => ({fog: 0, gapGlow: glow, ind: g.side * g.k, indK: g.k, yesHi: g.side < 0 ? g.k : 0, noHi: g.side > 0 ? g.k : 0, accent: col});
  const gapR1 = win(t, b.two + 0.05, b.two + 0.35, swap1 - 0.3, swap1);
  const gap2 = win(t, b.fresh + 0.6, b.fresh + 0.9, s.push2[1] - 0.4, s.push2[1] - 0.2);
  return {
    t,
    trs,
    tint: pr(t, b.f0 + 0.05, b.f0 + 0.55),
    fx: {A: sfx(gA, K.senderA, gapR1 + gap2), B: sfx(gB, K.senderB, gapR1 + gap2), R: fxR},
    leds: {A: clamp(ledsA), B: clamp(ledsB), R: clamp(ledsR)},
    gaze: {A: gA, B: gB, R: gR},
    cap: {A: clamp(capOf(a1) + capOf(a2) + capOf(a3)), B: clamp(capOf(b1) + capOf(b2) + capOf(b3))},
    toks: vs.map((v) => tokenAt(v, t)).filter((x): x is Tok => !!x),
    coilK: pr(t, b.coil - 0.05, b.coil + 0.65),
    pulse,
    brain: win(t, b.over - 0.05, b.over + 0.45, b.little - 0.95, b.little - 0.6),
    stimBlink: Math.max(0, ...yesStims.map((st) => bump(t, st - 0.05, 0.5))),
    stim: {k: stimCmd.k, yes: finalText(stimCmd.v) === 'YES', who: stimCmd.v.who},
    look,
    tilt: 0,
    strip: {k: win(t, b.computer - 0.45, b.computer - 0.2, b.advice + 0.5, b.advice + 0.8), n: 10 * clamp((t - (b.computer - 0.25)) / 0.8)},
    flipNote: win(t, b3.flip! + 0.42, b3.flip! + 0.62, b3.out - 0.1, b3.out + 0.1),
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
