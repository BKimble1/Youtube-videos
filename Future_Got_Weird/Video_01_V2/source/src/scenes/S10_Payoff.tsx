import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, worldToScreen} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camKick, camPath, drift, hop, impact, kf, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {C, F, OUTLINE} from '../theme';
import {Arm, Character, IDLE, Pose, mixPose, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {RingMark, TokenTile} from '../components/Props';
import {Chip} from '../components/Text';
import {AnswerSlipArt, SLIP_H, SLIP_W, SlipOnScreen} from '../components/v2/AnswerSlip';
import {StampArm} from '../components/v2/StampArm';
import {H910} from '../lib/handoffs';
import {Sfx} from '../lib/sfx';
import {
  Arches,
  Board,
  COUNTER_TOP,
  Counter,
  EvidenceThumb,
  HangingSign,
  PSLIP_H,
  PSLIP_STAMP_AT,
  PSLIP_W,
  Pencil,
  PersonSlipArt,
  S10Wall,
  S10Wordmark,
  THUMB_H,
  THUMB_W,
  WIN_X,
} from '../components/v2/S10_Parts';

/**
 * S10 — the payoff, back at the answer counter (the "courtroom"), then the sign-off.
 *
 * Beat sheet (V2 narration, global frames; see K below):
 *  in   H910 match cut: the stamped ChatGPT slip fills the frame over a push-in on window 1; the camera pulls back to
 *       the wide while the slip settles onto the counter where it was handed out in S1 (clerk A's hand comes onto it).
 *  s33a "So why is AI so confidently wrong?" — the question ticket drops into S1's hanging slot and is typed word by
 *       word; the clerks look up, puff up on "confidently", A's eyes drop to his failed slip on "wrong?"; the checker
 *       taps his pencil. The ticket is hoisted in the breath before "Because".
 *  s33b "Because sounding right comes from patterns in language," — conclusion mode: the wall dims, the SOUNDING RIGHT
 *       board rises in front of the counter (clerks' heads above it), its subline appears word by word, the pattern
 *       words lock in as token tiles; the clerks nod along ("that's us").
 *  s33c "and being right takes evidence the model doesn't always have." — the heavier BEING RIGHT board lands; the real
 *       thesis title page is pinned on "evidence"; the clerks look at it and deflate on "doesn't always have"; on
 *       "have." the verdict: a teal marker under BEING RIGHT, SOUNDING RIGHT recedes. Boards sink out after the line.
 *  s34  "So when an answer matters," — the camera moves toward the answer; clerk A pushes his slip forward.
 *       "don't ask whether it sounds right." — that question card rises and is struck through on "right.";
 *       "Ask what the evidence is," — the card flips to ① What's the evidence?, badge ticks teal on "evidence"; in the
 *       pause A draws his slip in, guiltily; "and whether it actually says this." — ② rises, "actually" underlined,
 *       "this" ringed and a leader draws to the slip's claim (under the CLAIM FAILS overhang), which lights up. The
 *       cards fall forward, the slip settles back.
 *  s35  "Works on chatbots." — the three clerks concede (one sheepish nod each); A takes his slip back under the counter.
 *       "Works pretty well on people, too." — a regular person walks up to window 3 (clerk C steps aside), produces
 *       a slip exactly like the clerks did ("Trust me, I read it somewhere."), and the viewer's teal-sleeved hand stamps
 *       it SOURCE? on "too." (stamp + gavel). Reaction held in the pause: the person's "o", C's smirk, a sheepish shrug.
 *  s36  "This is Future Got Weird." — the set is struck (counter sinks, sign hoisted) leaving the saffron wall; the
 *       wordmark builds word by word, then rises into the end-screen layout. Tagline, chips, honesty line on their
 *       words; after the voice the checker walks in and underlines the honesty line. Hard end on the full card.
 */

/* ------------------------------------------------------------------ world layout */
const CLERK_Y = 790;
const CLERK_S = 0.98;
const CHECKER = {x: 120, y: 790, scale: 0.92};
const C_ASIDE_X = 1204; // clerk C steps aside to the pillar between windows 2 and 3
const PERSON_X = 1470;
const PERSON_START_X = 2170;

type SP = {cx: number; cy: number; s: number; rot: number};
const SLIP_HOME: SP = {cx: WIN_X[0], cy: 598 + SLIP_H / 2, s: 1, rot: -1.5};
const SLIP_PRESENT: SP = {cx: 496, cy: 598 + (SLIP_H * 1.3) / 2, s: 1.3, rot: 0}; // date line ≈ 29–31 px on screen in the habit framing
const SLIP_BEHIND: SP = {cx: WIN_X[0] + 34, cy: COUNTER_TOP - (SLIP_H * 0.55) / 2, s: 0.55, rot: 0};
const PSLIP_HOME: SP = {cx: 1522, cy: 598 + PSLIP_H / 2, s: 1, rot: 1.6};

// the question ticket (S1's hanging slot)
const TICKET_TOP = 168;
const T_PX = 60;
const T_PAD = 44;
const T_WORDS = ['So', 'why', 'is', 'AI', 'so', 'confidently', 'wrong?'];
const T_EMPH = 5;
const tFont = (i: number) => `${i === T_EMPH ? 600 : 400} ${T_PX}px "Source Serif 4 Variable"`;

// the s33 boards (in front of the counter, below the clerks' chins)
const PL_W = 705;
const PL_H = 520;
const PL_TOP = 512;
const PL_X = [228, 914];
const PL_ROT = [-1.2, 1];
const PAD = 36;
const TITLE_PX = 72;
const SUB_PX = 50;
const SUB_LH = 60;
const SUB_FONT = `800 ${SUB_PX}px "Nunito Variable"`;
const titleFont = (px: number) => `700 ${px}px "Fredoka Variable"`;

// the s34 habit cards (on the counter front, right of the slip)
const CARD_X = 812; // clear of the CLAIM FAILS overhang on the presented slip
const CARD_W = 860;
const CARD_H = 108;
const CARD_Y = [732, 860];
const CARD_PX = 48;
const CARD_FONT = `800 ${CARD_PX}px "Nunito Variable"`;
const CARD_TX = 112; // text start inside a card
const CARD_TEXT = ['Does it sound right?', 'What’s the evidence?', 'Does it actually say this?'];

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  start: scene('S10').from,
  end: scene('S10').to,
  so: at('s33', 'So'),
  why: at('s33', 'why'),
  is: at('s33', 'is'),
  ai: at('s33', 'AI'),
  so2: at('s33', 'so', 2),
  confidently: at('s33', 'confidently'),
  wrong: at('s33', 'wrong?'),
  wrongEnd: at('s33', 'wrong?', 1, 'end'),
  because: at('s33', 'Because'),
  sounding: at('s33', 'sounding'),
  right1: at('s33', 'right'),
  comes: at('s33', 'comes'),
  from: at('s33', 'from'),
  patterns: at('s33', 'patterns'),
  in: at('s33', 'in'),
  language: at('s33', 'language,'),
  and: at('s33', 'and'),
  being: at('s33', 'being'),
  right2: at('s33', 'right', 2),
  takes: at('s33', 'takes'),
  evidence: at('s33', 'evidence'),
  the: at('s33', 'the'),
  model: at('s33', 'model'),
  doesnt: at('s33', "doesn't"),
  always: at('s33', 'always'),
  have: at('s33', 'have.'),
  haveEnd: at('s33', 'have.', 1, 'end'),
  so3: at('s34', 'So'),
  answer: at('s34', 'answer'),
  matters: at('s34', 'matters,'),
  ask1: at('s34', 'ask'), // the "ask" in "don't ask"
  rightS: at('s34', 'right.'),
  ask2: at('s34', 'Ask', 2), // "Ask what the evidence is" (at() is case-insensitive: occurrence 2)
  evidence2: at('s34', 'evidence'),
  is2: at('s34', 'is,'),
  whether2: at('s34', 'whether', 2),
  actually: at('s34', 'actually'),
  this: at('s34', 'this.'),
  thisEnd: at('s34', 'this.', 1, 'end'),
  works1: at('s35', 'Works'),
  chatbots: at('s35', 'chatbots.'),
  works2: at('s35', 'Works', 2),
  pretty: at('s35', 'pretty'),
  well: at('s35', 'well'),
  people: at('s35', 'people,'),
  too: at('s35', 'too.'),
  tooEnd: at('s35', 'too.', 1, 'end'),
  this2: at('s36', 'This'),
  future: at('s36', 'Future'),
  got: at('s36', 'Got'),
  weird: at('s36', 'Weird.'),
  weirdEnd: at('s36', 'Weird.', 1, 'end'),
  aiT: at('s36', 'AI'),
  we: at('s36', 'we'),
  make2: at('s36', 'make', 2),
  newE: at('s36', 'New'),
  twice: at('s36', 'twice'),
  subscribe: at('s36', 'subscribe.'),
  subEnd: at('s36', 'subscribe.', 1, 'end'),
};

// opening: the hand-off slip is carried back to the counter while the camera pulls out
const CARRY = K.start + 1;
const CARRY_DUR = 20;
const LAND = CARRY + CARRY_DUR;
// s33a
const TDROP = K.why + 6; // the ticket catches on its strings
const QTYPE = [K.so, K.why, K.is, K.ai, K.so2, K.confidently, K.wrong];
const PUFF = [0, 1, 2].map((i) => K.confidently + 1 + i * 3);
const GLANCE = K.wrong + 2;
const TAP1 = K.wrong + 3;
const HOIST = K.wrongEnd - 2;
// s33b / s33c
const DIM_IN = K.because - 3;
const PL_RISE = [K.because + 1, K.and];
const SUB_L: [string, number][][] = [
  [
    ['comes', K.comes],
    ['from', K.from],
  ],
  [
    ['patterns', K.patterns],
    ['in', K.in],
    ['language', K.language],
  ],
];
const SUB_R: [string, number][][] = [
  [
    ['takes', K.takes],
    ['evidence', K.evidence],
  ],
  [
    ['the', K.the],
    ['model', K.model],
    ['doesn’t', K.doesnt],
  ],
  [
    ['always', K.always],
    ['have.', K.have],
  ],
];
const TILES = ['Methods', 'Algorithms', 'Machine Learning', 'is entitled:'];
const TILE_AT = TILES.map((_, i) => K.language + 6 + i * 5);
const THUMB_AT = K.evidence + 3;
const CHIP_AT = K.evidence + 12;
const DEFLATE = K.doesnt;
const VERDICT = K.have + 3;
const SINK = [K.haveEnd + 1, K.haveEnd + 5];
// s34
const CAM_HABIT = K.so3;
const PUSH_SLIP = K.answer;
const SR_RISE = K.ask1 - 4;
const STRIKE = K.rightS + 1;
const FLIP = K.ask2 - 5; // the card is edge-on on "Ask"
const BADGE1 = K.evidence2 + 1;
const GUILTY = K.is2 + 2; // the pause after "is,": A's eyes go to his slip and he draws it in a little
const Q2_RISE = K.whether2 - 3;
const ACT = K.actually + 1;
const THIS_T = K.this + 1;
const CARDS_OUT = [K.thisEnd + 9, K.thisEnd + 13];
const SLIP_BACK = K.thisEnd + 14;
// s35
const UNDIM = K.works1 - 4;
const NODS = [0, 1, 2].map((i) => K.chatbots + 1 + i * 4);
const TAKE = K.chatbots + 6; // A slides his slip back onto the counter top …
const TAKE_DROP = TAKE + 9; // … and lowers it behind the counter
const TAP2 = K.chatbots + 12;
const STEPS_P = [0, 1, 2, 3].map((i) => K.chatbots + 10 + i * 7); // the person's four steps in from frame right
const ARRIVE_P = STEPS_P[3] + 7;
const STEPS_C = [K.chatbots + 18, K.chatbots + 26]; // clerk C makes room
const CAM_PERSON = K.works2 - 5;
const P_RISE = K.pretty - 1;
const P_SLIDE = K.pretty + 4;
const P_LAND = K.well + 1;
const ARM_IN = K.well + 3;
const HIT = K.too + 1;
const LETGO = P_LAND + 5; // the hand leaves the slip before the stamp arrives
const ARM_OUT = HIT + 9; // after the recoil the arm swings out to the right, clear of the mark
const SHRUG = K.tooEnd + 9;
// s36
const STRIKE_SET = K.this2 - 2;
const POPS = [K.future - 4, K.got - 2, K.weird - 2];
const WM_UP = K.weirdEnd - 6;
const TAG = [K.aiT - 1, K.we - 1];
const UL_SENSE = K.make2;
const CHIP1 = K.newE - 1;
const TWICE = [K.twice + 1, K.twice + 7];
const SUBS = K.subscribe - 2;
const HONEST = K.newE + 10;
const CHK_STEPS = [0, 1, 2].map((i) => K.subEnd + 4 + i * 8);
const CHK_TAPS = [CHK_STEPS[2] + 14, CHK_STEPS[2] + 21];
const UL2 = CHK_TAPS[1] + 2;
const CHK_NOD = UL2 + 18;
const NUDGE = K.end - 76; // Subscribe gets one gentle nudge (the checker glances up at it)
const WIGGLE = K.end - 46; // GOT does one small weird wobble; the checker side-eyes it, then back to camera

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_counter', dur: (STRIKE_SET + 14 - K.start) / 30, gain: -4, note: 'low room tone; ends under the set strike'},
  {f: LAND - 1, kind: 'paper_slap', gain: -6, note: 'the failed slip settles back on the counter at window 1'},
  {f: TDROP - 8, kind: 'paper_flap', gain: -6, note: 'the question ticket drops'},
  {f: TDROP, kind: 'hanger_click', gain: -2},
  ...QTYPE.slice(2).map((f, i) => ({f: f - 1, kind: 'typewriter_tick' as const, gain: -7, pitch: i === 3 ? 2 : 0})),
  {f: K.confidently + 2, kind: 'glint', gain: -12, note: '"confidently" swells'},
  {f: TAP1 + 3, kind: 'pencil_tap', gain: -8},
  {f: HOIST, kind: 'paper_swish', gain: -12, note: 'ticket hoisted on its strings'},
  {f: PL_RISE[0] + 9, kind: 'thud_soft', gain: -3, note: 'SOUNDING RIGHT board lands'},
  {f: K.patterns, kind: 'marker_sweep', gain: -8, note: 'patterns in language highlighted'},
  ...TILE_AT.map((f, i) => ({f, kind: 'token_lock' as const, gain: -7, pitch: i})),
  {f: PL_RISE[1] + 12, kind: 'thud_soft', gain: 2, pitch: -3, note: 'BEING RIGHT board lands, heavier'},
  {f: K.evidence, kind: 'marker_sweep', gain: -8, pitch: 2},
  {f: THUMB_AT + 4, kind: 'paper_slap', gain: -8, note: 'thesis title page pinned to the board'},
  {f: CHIP_AT, kind: 'chip_pop', gain: -6},
  {f: VERDICT, kind: 'marker_sweep', gain: -1, pitch: -2, note: 'teal verdict line under BEING RIGHT'},
  {f: SINK[0] + 2, kind: 'paper_swish', gain: -13},
  {f: SINK[1] + 2, kind: 'paper_swish', gain: -14, pitch: -2},
  {f: PUSH_SLIP, kind: 'paper_slide', gain: -8, note: 'A pushes his slip forward: an answer'}, // V3: under 'matters'
  {f: SR_RISE + 6, kind: 'card_flick', gain: -3},
  {f: STRIKE, kind: 'marker_sweep', gain: 2, note: 'the old question struck through'},
  {f: K.ask2, kind: 'card_flick', pitch: 2, note: 'the card flips to ① What’s the evidence?'},
  {f: BADGE1, kind: 'pop_tick', gain: -3},
  {f: Q2_RISE + 6, kind: 'card_flick', pitch: 4, gain: -2},
  {f: ACT, kind: 'marker_sweep', gain: -3, pitch: 3},
  {f: THIS_T, kind: 'marker_circle', gain: -2},
  {f: THIS_T + 2, kind: 'marker_sweep', gain: -7, pitch: -3, note: 'leader to the slip'},
  {f: THIS_T + 10, kind: 'glint', gain: -10},
  {f: CARDS_OUT[0] + 2, kind: 'paper_swish', gain: -12},
  {f: SLIP_BACK + 8, kind: 'thud_soft', gain: -10},
  {f: TAKE, kind: 'paper_slide', gain: -5, note: 'A takes his slip back'},
  {f: TAKE_DROP + 6, kind: 'thud_soft', gain: -14},
  {f: TAP2 + 3, kind: 'pencil_tap', gain: -7},
  ...STEPS_P.map((f, i) => ({f: f + 5, kind: 'thud_soft' as const, gain: -13 + i, pitch: -6, note: i === 0 ? 'footsteps (no footstep kind)' : undefined})),
  ...STEPS_C.map((f) => ({f: f + 6, kind: 'thud_soft' as const, gain: -16, pitch: -4})),
  {f: P_RISE, kind: 'paper_lift', gain: -8},
  {f: P_SLIDE, kind: 'paper_slide', gain: -4},
  {f: P_LAND + 1, kind: 'paper_slap', gain: -3, note: 'the person slaps their slip down'},
  {f: ARM_IN + 1, kind: 'whoosh_soft', gain: -12, note: 'the checking hand rises into frame'},
  {f: HIT, kind: 'stamp_heavy', gain: -3, note: 'SOURCE?'}, // V3: -3 dB, it lands inside 'too'
  {f: HIT, kind: 'gavel', gain: -9, note: 'the verdict (layered under the stamp)'},
  {f: HIT + 12, kind: 'paper_flap', gain: -12},
  {f: ARM_OUT + 2, kind: 'whoosh_soft', gain: -16, note: 'the hand swings away'},
  {f: STRIKE_SET + 2, kind: 'whoosh_soft', gain: -12, note: 'the counter set sinks away'},
  {f: STRIKE_SET + 3, kind: 'hanger_click', gain: -5, pitch: -2, note: 'ANSWERS sign hoisted'},
  {f: POPS[0] + 2, kind: 'pop_tick', gain: -4},
  {f: POPS[1] + 2, kind: 'pop_tick', gain: -3, pitch: 3},
  {f: POPS[2] + 2, kind: 'logo_hit', note: 'wordmark lands'},
  {f: TAG[0], kind: 'whoosh_soft', gain: -10, note: '"AI moves fast" whips in'},
  {f: TAG[1] + 5, kind: 'thud_soft', gain: -10},
  {f: UL_SENSE, kind: 'marker_sweep', gain: -5},
  {f: CHIP1 + 3, kind: 'chip_pop'},
  {f: TWICE[0], kind: 'pop_tick', gain: -6},
  {f: TWICE[1], kind: 'pop_tick', gain: -6, pitch: 3},
  {f: SUBS + 3, kind: 'chip_pop', gain: 1, pitch: 3, note: 'Subscribe'},
  ...CHK_STEPS.map((f) => ({f: f + 6, kind: 'thud_soft' as const, gain: -15, pitch: -2})),
  {f: CHK_TAPS[0] + 2, kind: 'pencil_tap', gain: -6},
  {f: CHK_TAPS[1] + 2, kind: 'pencil_tap', gain: -8},
  {f: UL2, kind: 'marker_sweep', gain: -5},
  {f: NUDGE, kind: 'chip_pop', gain: -10},
  {f: WIGGLE - 2, kind: 'pop_tick', gain: -12, pitch: -3, note: 'GOT wobbles'},
];

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  open: {cx: 480, cy: 640, zoom: 1.5}, // pushed in on window 1 behind the hand-off slip
  wide: {cx: 945, cy: 540, zoom: 0.97},
  habit: {cx: 985, cy: 640, zoom: 1.25}, // the answer and the questions (checker out, window 1 clear of the edge)
  person: {cx: 1336, cy: 620, zoom: 1.5}, // window 3: clerk B, clerk C, the person and their slip
  end: {cx: 960, cy: 540, zoom: 1.0},
};
const camAt = (g: number): Cam => {
  const c = camPath(g, SHOTS.open, [
    {at: CARRY, dur: CARRY_DUR, to: SHOTS.wide},
    {at: CAM_HABIT, dur: 18, to: SHOTS.habit},
    {at: CAM_PERSON, dur: 18, to: SHOTS.person},
    {at: STRIKE_SET + 12, dur: 20, to: SHOTS.end},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [HIT], 0.018)};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const win = (g: number, a: number, b: number, dIn = 8, dOut = 8) => tw(g, a, dIn) * (1 - tw(g, b, dOut));
const clampL = (v: number, m = 0.9) => Math.max(-m, Math.min(m, v));
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});
const mixSP = (a: SP, b: SP, t: number): SP => ({cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), s: lerp(a.s, b.s, t), rot: lerp(a.rot, b.rot, t)});
/** world point of a slip-local point for a centre-anchored slip pose */
const toWorld = (p: SP, lx: number, ly: number, w = SLIP_W, h = SLIP_H) => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (lx - w / 2) * p.s;
  const dy = (ly - h / 2) * p.s;
  return {x: p.cx + dx * Math.cos(r) - dy * Math.sin(r), y: p.cy + dx * Math.sin(r) + dy * Math.cos(r)};
};
/** a spring that overshoots upward (used for boards and cards rising into place) */
const BOARD_L = {damping: 19, stiffness: 150, mass: 1};
const BOARD_R = {damping: 25, stiffness: 150, mass: 1.6};
const CARD = {damping: 17, stiffness: 190, mass: 0.9};

/* ------------------------------------------------------------------ slip A (the hand-off slip) */
type SlipState = SP & {behind: boolean; hidden: boolean};
const slipA = (g: number): SlipState => {
  let p = {...SLIP_HOME, rot: SLIP_HOME.rot + 1.4 * ring(g, LAND, 0.8, 0.25)};
  // "an answer": pushed toward camera (a small hop, then a soft settle)
  p = mixSP(p, SLIP_PRESENT, sp(g, PUSH_SLIP, SOFT));
  p = {...p, cy: p.cy + hop(g, PUSH_SLIP, 12, 10)};
  // the pause after "is,": A draws it in a little (no evidence on it); "this.": presented again, a touch more
  const guilty = win(g, GUILTY, THIS_T - 3, 8, 6);
  p = {...p, cx: p.cx - 8 * guilty, s: p.s * (1 - 0.03 * guilty), rot: p.rot - 1.5 * guilty};
  p = {...p, s: p.s * (1 + 0.05 * bell(g, THIS_T, 26))};
  // back to its place
  p = mixSP(p, SLIP_HOME, sp(g, SLIP_BACK, SOFT));
  // "chatbots.": A takes it back over the counter edge (S1's hand-over, reversed) and lowers it behind the counter
  p = mixSP(p, SLIP_BEHIND, tw(g, TAKE, 9, E.inOut));
  const down = tw(g, TAKE_DROP, 8, E.in);
  p = {...p, cy: p.cy + down * (SLIP_H * 0.55 + 30)};
  return {...p, behind: g >= TAKE_DROP, hidden: down >= 1};
};

/* ------------------------------------------------------------------ the person's slip */
const pslip = (g: number): SlipState => {
  const s0 = 0.55;
  const x0 = PERSON_X + 34;
  if (g < P_RISE) return {cx: x0, cy: COUNTER_TOP + (PSLIP_H * s0) / 2, s: s0, rot: 0, behind: true, hidden: true};
  const r = tw(g, P_RISE, 6, E.out);
  if (g < P_SLIDE) return {cx: x0, cy: COUNTER_TOP + (PSLIP_H * s0) / 2 - PSLIP_H * s0 * r, s: s0, rot: 1.2 * ring(g, P_RISE + 6, 0.7, 0.25), behind: true, hidden: false};
  const u = sp(g, P_SLIDE, SNAP);
  const p = mixSP({cx: x0, cy: COUNTER_TOP - (PSLIP_H * s0) / 2, s: s0, rot: 0}, PSLIP_HOME, u);
  const jolt = g >= HIT ? 6 * Math.exp(-(g - HIT) * 0.35) : 0;
  return {...p, cy: p.cy + jolt, rot: p.rot + 1.0 * ring(g, P_LAND, 0.8, 0.22) + 1.6 * ring(g, HIT, 1.1, 0.3), behind: false, hidden: false};
};

/* ------------------------------------------------------------------ the question ticket */
const ticketLayout = () => {
  const space = textWidth(' ', tFont(0));
  let x = 0;
  const xs = T_WORDS.map((w, i) => {
    const x0 = x;
    x += textWidth(w, tFont(i)) + (i < T_WORDS.length - 1 ? space : 0);
    return x0;
  });
  return {xs, width: x};
};
const ticketY = (g: number) => {
  const fall = 8;
  let y: number;
  if (g <= TDROP - fall) y = -560;
  else if (g <= TDROP) {
    const u = (g - (TDROP - fall)) / fall;
    y = -560 * (1 - u * u);
  } else y = 9 * Math.sin(Math.min(1, (g - TDROP) / 7) * Math.PI) * (g < TDROP + 7 ? -1 : 0);
  y += 7 * bell(g, HOIST - 5, 6); // a tug down before the hoist
  y -= 700 * tw(g, HOIST, 12, E.in);
  return y;
};

const Ticket: React.FC<{g: number}> = ({g}) => {
  const L = ticketLayout();
  const w = L.width + T_PAD * 2 + OUTLINE * 2;
  const typed = QTYPE.filter((f) => g >= f - 1).length;
  const caretX = typed === 0 ? 0 : L.xs[typed - 1] + textWidth(T_WORDS[typed - 1], tFont(typed - 1));
  const caretOn = typed < T_WORDS.length && Math.floor(g / 8) % 2 === 0;
  const swell = 1 + 0.1 * bell(g, K.confidently - 1, 18);
  return (
    <div style={{position: 'absolute', left: 960 - w / 2, top: TICKET_TOP, width: w}}>
      <div style={{position: 'absolute', left: 70, top: -1200, width: 4, height: 1204, background: C.ink}} />
      <div style={{position: 'absolute', right: 70, top: -1200, width: 4, height: 1204, background: C.ink}} />
      <div style={{position: 'relative', background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 14, boxShadow: `8px 10px 0 ${C.shadow}`, padding: `14px ${T_PAD}px 16px`}}>
        <div style={{position: 'absolute', left: 58, top: -8, width: 28, height: 16, borderRadius: 8, background: C.paperDeep, border: `3px solid ${C.ink}`}} />
        <div style={{position: 'absolute', right: 58, top: -8, width: 28, height: 16, borderRadius: 8, background: C.paperDeep, border: `3px solid ${C.ink}`}} />
        <div style={{position: 'relative', height: T_PX * 1.28, width: L.width}}>
          {T_WORDS.map((word, i) => {
            const t = tw(g, QTYPE[i] - 1, 3, E.out);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: L.xs[i],
                  top: 0,
                  font: tFont(i),
                  lineHeight: 1.28,
                  color: i === T_EMPH ? C.coralDeep : C.ink,
                  opacity: t,
                  transform: i === T_EMPH ? `translateY(${(1 - t) * 6}px) scale(${swell})` : `translateY(${(1 - t) * 6}px)`,
                  transformOrigin: '0% 70%',
                  whiteSpace: 'pre',
                }}
              >
                {word}
              </div>
            );
          })}
          {caretOn && <div style={{position: 'absolute', left: caretX + 8, top: 12, width: 4, height: T_PX * 0.98, background: C.ink}} />}
        </div>
      </div>
    </div>
  );
};
const ticketCaretWorld = (g: number) => {
  const L = ticketLayout();
  const left = 960 - L.width / 2;
  const typed = QTYPE.filter((f) => g >= f - 1).length;
  return left + (typed === 0 ? 0 : L.xs[typed - 1] + textWidth(T_WORDS[typed - 1], tFont(typed - 1)) / 2);
};

/* ------------------------------------------------------------------ the s33 boards */
const boardY = (g: number, i: number) => {
  if (g < PL_RISE[i]) return 800;
  const u = sp(g, PL_RISE[i], i === 0 ? BOARD_L : BOARD_R);
  let y = (1 - u) * 640;
  if (i === 0) y += 16 * tw(g, VERDICT, 12, E.inOut); // SOUNDING RIGHT yields a little
  y -= 8 * bell(g, SINK[i] - 6, 7); // anticipation
  y += 700 * tw(g, SINK[i], 13, E.in);
  return y;
};

/** a line of words, each appearing on its spoken cue; `hl` = a highlighter sweep behind some words */
const SubLine: React.FC<{g: number; words: [string, number][]; top: number; hl?: {from: number; color: string; ink: string; t: number}}> = ({g, words, top, hl}) => {
  const space = textWidth(' ', SUB_FONT);
  let x = 0;
  const xs = words.map(([w], i) => {
    const x0 = x;
    x += textWidth(w, SUB_FONT) + (i < words.length - 1 ? space : 0);
    return x0;
  });
  const hlX = hl ? xs[hl.from] : 0;
  const hlW = hl ? x - hlX : 0;
  return (
    <div style={{position: 'absolute', left: PAD, top, height: SUB_LH, width: x}}>
      {hl && hl.t > 0 && <div style={{position: 'absolute', left: hlX - 8, top: SUB_LH * 0.36, width: (hlW + 16) * hl.t, height: SUB_PX * 0.62, background: hl.color, borderRadius: 6}} />}
      {words.map(([w, cue], i) => {
        const t = tw(g, cue - 1, 4, E.out);
        const lit = hl && i >= hl.from && g >= cue;
        return (
          <div key={i} style={{position: 'absolute', left: xs[i], top: 0, font: SUB_FONT, lineHeight: `${SUB_LH}px`, color: lit ? hl!.ink : C.ink, opacity: t, transform: `translateY(${(1 - t) * 8}px)`, whiteSpace: 'pre'}}>
            {w}
          </div>
        );
      })}
    </div>
  );
};

const titleFit = (text: string) => Math.min(TITLE_PX, (TITLE_PX * (PL_W - PAD * 2)) / (textWidth(text, titleFont(TITLE_PX)) + text.length * TITLE_PX * 0.01));
const BoardTitle: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: PAD, top: 24, font: titleFont(titleFit(text)), lineHeight: 1, letterSpacing: '0.01em', color: C.ink, whiteSpace: 'nowrap'}}>{text}</div>
);
const titleW = (text: string) => textWidth(text, titleFont(titleFit(text))) + text.length * titleFit(text) * 0.01;
/** the wooden stake each board is carried on (it runs out of the bottom of frame) */
const Stake: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: PL_W / 2 - 22, top: PL_H - 30, width: 44, height: 420, background: C.woodLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}}>
      <div style={{position: 'absolute', left: 8, top: 0, width: 8, height: '100%', background: C.wood, opacity: 0.7}} />
    </div>
  </>
);


const BoardL: React.FC<{g: number}> = ({g}) => {
  const hlT = kf(g, [
    [K.patterns, 0],
    [K.in, 0.45, E.linear],
    [K.language, 0.55, E.linear],
    [K.language + 12, 1, E.out],
  ]);
  const recede = tw(g, VERDICT, 12, E.inOut);
  return (
    <Board w={PL_W} h={PL_H}>
      <BoardTitle text="SOUNDING RIGHT" />
      <div style={{position: 'absolute', left: PAD, top: 108, width: titleW('SOUNDING RIGHT'), height: 10, borderRadius: 5, background: C.blue}} />
      <SubLine g={g} words={SUB_L[0]} top={136} />
      <SubLine g={g} words={SUB_L[1]} top={136 + SUB_LH} hl={{from: 0, color: C.blueLight, ink: C.blueDeep, t: hlT}} />
      {/* the plausible words the pattern is made of (they built the fabricated title) */}
      <div style={{position: 'absolute', left: PAD, top: 290, width: PL_W - PAD * 2, display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 16}}>
        {TILES.map((t, i) => {
          const on = g >= TILE_AT[i] - 3;
          const u = sp(g, TILE_AT[i] - 3, SNAP);
          const [sx, sy] = impact(g, TILE_AT[i], 0.1, 7);
          return (
            <div key={t} style={{opacity: on ? 1 : 0, transform: `translateY(${(1 - Math.min(1, u)) * -26}px) scale(${lerp(0.6, 1, u) * sx}, ${lerp(0.6, 1, u) * sy})`, transformOrigin: '50% 100%'}}>
              <TokenTile text={t} size={37} tone="blue" />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', inset: 0, borderRadius: 24, background: C.paper, opacity: 0.42 * recede}} />
    </Board>
  );
};

const BoardR: React.FC<{g: number}> = ({g}) => {
  const hlT = tw(g, K.evidence, 10, E.inOut);
  const tu = sp(g, THUMB_AT, SNAP);
  const chipU = sp(g, CHIP_AT, SNAP);
  const verdict = tw(g, VERDICT, 9, E.inOut);
  const tW = titleW('BEING RIGHT');
  const win2 = 1 + 0.03 * bell(g, VERDICT + 2, 14);
  return (
    <Board w={PL_W} h={PL_H} style={{transform: `scale(${win2})`, transformOrigin: '50% 20%'}}>
      <BoardTitle text="BEING RIGHT" />
      {/* the verdict: a teal marker line drawn under BEING RIGHT on "have." */}
      <svg width={tW + 30} height={30} style={{position: 'absolute', left: PAD - 8, top: 100, overflow: 'visible'}}>
        <path d={`M 4 14 Q ${tW * 0.3} 6 ${tW * 0.55} 12 T ${tW + 18} 10`} fill="none" stroke={C.teal} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - verdict} opacity={verdict > 0 ? 1 : 0} />
      </svg>
      <SubLine g={g} words={SUB_R[0]} top={128} hl={{from: 1, color: C.tealLight, ink: C.tealDeep, t: hlT}} />
      <SubLine g={g} words={SUB_R[1]} top={128 + SUB_LH} />
      <SubLine g={g} words={SUB_R[2]} top={128 + SUB_LH * 2} />
      {/* the evidence: the real title page, pinned on "evidence", with its source tag */}
      {g >= THUMB_AT && (
        <div style={{position: 'absolute', left: PAD, top: 330, transform: `translate(${(1 - tu) * 40}px, ${(1 - tu) * -50}px) rotate(${lerp(8, -1.5, tu)}deg) scale(${lerp(1.3, 1, tu)})`, transformOrigin: '30% 50%'}}>
          <EvidenceThumb glow={0.8 * bell(g, VERDICT, 18)} />
        </div>
      )}
      {g >= CHIP_AT && (
        <div style={{position: 'absolute', left: PAD + THUMB_W + 14, top: 330 + THUMB_H / 2 - 50, transform: `scale(${lerp(0.55, 1, chipU)})`, transformOrigin: '20% 50%', opacity: chipU > 0.02 ? 1 : 0, background: C.teal, border: `3px solid ${C.tealDeep}`, borderRadius: 14, padding: '10px 14px', fontFamily: F.body, fontWeight: 800, fontSize: 32, lineHeight: 1.2, color: C.white, whiteSpace: 'nowrap'}}>
          Kalai (2001)
          <br />
          thesis title page
        </div>
      )}
    </Board>
  );
};

/* ------------------------------------------------------------------ the s34 habit cards */
/** The habit cards are hinged on the counter front: they swing up (from lying flat toward the viewer) with a small
 *  overshoot, and fall forward flat again when they are done. Returns the hinge angle in degrees (0 = upright). */
const cardHinge = (g: number, i: number) => {
  const rise = i === 0 ? SR_RISE : Q2_RISE;
  if (g < rise) return -90;
  const u = sp(g, rise, CARD);
  let a = -90 * (1 - u);
  a += 6 * bell(g, CARDS_OUT[i] - 5, 6); // a small tip back before it falls
  a -= 90 * tw(g, CARDS_OUT[i], 9, E.in);
  return Math.max(-90, a);
};
const cardWordX = (text: string, word: string) => {
  const k = text.indexOf(word);
  return {x: CARD_TX + textWidth(text.slice(0, k), CARD_FONT), w: textWidth(word, CARD_FONT)};
};

const Badge: React.FC<{label: string; bg: string; scale?: number}> = ({label, bg, scale = 1}) => (
  <div style={{position: 'absolute', left: 22, top: (CARD_H - 66) / 2, width: 66, height: 66, borderRadius: 33, background: bg, border: `3px solid ${C.ink}`, color: C.white, fontFamily: F.display, fontWeight: 700, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${scale})`}}>
    {label}
  </div>
);

const CardFace: React.FC<{children: React.ReactNode; edge?: string}> = ({children, edge = C.ink}) => (
  <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE}px solid ${edge}`, borderRadius: 18, boxShadow: `7px 9px 0 ${C.shadow}`, backfaceVisibility: 'hidden'}}>{children}</div>
);

const CardText: React.FC<{text: string; color?: string}> = ({text, color = C.ink}) => (
  <div style={{position: 'absolute', left: CARD_TX - OUTLINE, top: 0, height: CARD_H - OUTLINE * 2, display: 'flex', alignItems: 'center', font: CARD_FONT, color, whiteSpace: 'nowrap'}}>{text}</div>
);

const HabitCard1: React.FC<{g: number}> = ({g}) => {
  const flip = tw(g, FLIP, 10, E.inOut);
  const ang = flip * 180;
  const front = ang < 90;
  const strikeT = tw(g, STRIKE, 8, E.inOut);
  const sw = textWidth(CARD_TEXT[0], CARD_FONT);
  const badgeTeal = g >= BADGE1;
  const badgePop = badgeTeal ? 1 + 0.25 * bell(g, BADGE1, 8) : 1;
  const ev = cardWordX(CARD_TEXT[1], 'evidence');
  const evT = tw(g, BADGE1, 8, E.inOut);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `perspective(1400px) rotateX(${front ? ang : ang - 180}deg)`}}>
      {front ? (
        <CardFace edge={C.inkSoft}>
          <Badge label="?" bg={C.inkMuted} />
          <CardText text={CARD_TEXT[0]} color={C.inkSoft} />
          {strikeT > 0 && <div style={{position: 'absolute', left: CARD_TX - OUTLINE - 10, top: CARD_H / 2 - 8, width: (sw + 20) * strikeT, height: 11, borderRadius: 6, background: C.coral, transform: 'rotate(-1.6deg)', transformOrigin: '0% 50%'}} />}
        </CardFace>
      ) : (
        <CardFace>
          <Badge label="1" bg={badgeTeal ? C.teal : C.ink} scale={badgePop} />
          <CardText text={CARD_TEXT[1]} />
          {evT > 0 && <div style={{position: 'absolute', left: ev.x - OUTLINE - 4, top: CARD_H / 2 + 24, width: (ev.w + 8) * evT, height: 8, borderRadius: 4, background: C.teal}} />}
        </CardFace>
      )}
    </div>
  );
};

const HabitCard2: React.FC<{g: number}> = ({g}) => {
  const a = cardWordX(CARD_TEXT[2], 'actually');
  const th = cardWordX(CARD_TEXT[2], 'this?'); // the ring takes the question mark in, so it cuts neither 'y' nor '?'
  const aT = tw(g, ACT, 10, E.inOut);
  const rT = tw(g, THIS_T, 9, E.inOut);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H}}>
      <CardFace>
        <Badge label="2" bg={C.ink} />
        <CardText text={CARD_TEXT[2]} />
        {aT > 0 && <div style={{position: 'absolute', left: a.x - OUTLINE - 4, top: CARD_H / 2 + 24, width: (a.w + 8) * aT, height: 8, borderRadius: 4, background: C.coral}} />}
        {rT > 0 && (
          <div style={{position: 'absolute', left: th.x - OUTLINE, top: CARD_H / 2 - 30, width: th.w, height: 60}}>
            <RingMark t={rT} tone="coral" padX={8} padY={10} width={6} />
          </div>
        )}
      </CardFace>
    </div>
  );
};

/* ------------------------------------------------------------------ poses */
const clerkCX = (g: number) =>
  kf(g, [
    [STEPS_C[0], WIN_X[2]],
    [STEPS_C[0] + 8, (WIN_X[2] + C_ASIDE_X) / 2 + 20],
    [STEPS_C[1] + 8, C_ASIDE_X],
  ]);
const personX = (g: number) =>
  kf(g, [
    [STEPS_P[0], PERSON_START_X],
    [STEPS_P[0] + 7, 1990],
    [STEPS_P[1] + 7, 1800],
    [STEPS_P[2] + 7, 1625],
    [STEPS_P[3] + 7, PERSON_X],
  ]);

type Rig = {pose: Pose; life: number; front: 'R' | 'none'; x: number};

const clerkRig = (i: number, g: number, sa: SlipState): Rig => {
  const x = i === 2 ? clerkCX(g) : WIN_X[i];
  const side = i === 0 ? 1 : i === 2 ? -1 : 0;
  // 0. base: attentive, a small smile
  let p = P({lookX: 0.1 * side, lookY: 0.15, mouth: 'smile', brows: 0.3});
  // 1. the opening: A looks down at his returned, failed slip; B and C look at it too
  const open = 1 - tw(g, K.why - 4, 8);
  p = mixPose(p, i === 0 ? P({lookX: 0.05, lookY: 0.85, mouth: 'flat', brows: 0.55, bob: 3}) : P({lookX: -0.85, lookY: 0.55, mouth: 'flat', brows: 0.4}), open);
  // 2. the ticket drops: look up, follow the typing
  const caret = ticketCaretWorld(g);
  p = mixPose(p, P({lookX: clampL((caret - x) / 520, 0.8), lookY: -0.65, mouth: 'smile', brows: 0.55}), win(g, K.why - 2 + i * 2, K.because - 6, 8, 8));
  // 3. "confidently": puff up — chin up, lean back, grin
  const puff = sp(g, PUFF[i], SNAP) * (1 - tw(g, K.because - 6, 8));
  p = mixPose(p, P({lookX: 0.15 * side, lookY: -0.1, mouth: 'grin', brows: 0.75, bob: -7, lean: -2 * side, tilt: -3 + i * 3}), Math.min(1, puff));
  // 4. "wrong?": A's eyes drop to his failed slip, the grin goes; B and C side-eye him
  const glance = win(g, GLANCE + i * 2, K.because - 4, 6, 8);
  p = mixPose(p, i === 0 ? P({lookX: -0.1, lookY: 0.9, mouth: 'flat', brows: 0.5, bob: 2}) : P({lookX: -0.9, lookY: 0.35, mouth: 'smirk', brows: 0.2, browAsym: 0.8}), glance);
  // 5. "Because": eyes down to the rising board
  p = mixPose(p, P({lookX: clampL((PL_X[0] + PL_W / 2 - x) / 300), lookY: 0.75, mouth: 'smile', brows: 0.45}), win(g, K.because - 2 + i * 2, K.sounding + 4, 8, 6));
  // 6. "sounding right": that's us — proud, to camera
  p = mixPose(p, P({lookX: 0.05 * side, lookY: -0.05, mouth: 'grin', brows: 0.7, bob: -5, tilt: (i - 1) * 3}), win(g, K.sounding + 3 + i * 4, K.and - 2, 7, 8));
  // 7. nods along on "patterns" and "language"
  const nod = hop(g, K.patterns + i * 2, -6, 9) + hop(g, K.language + 1 + i * 2, -6, 9);
  p = {...p, bob: (p.bob ?? 0) + nod, lookY: p.lookY + (nod > 0 ? 0.25 : 0)};
  // 8. "being right": eyes to the second board, then down to the evidence on it
  p = mixPose(p, P({lookX: clampL((PL_X[1] + PL_W / 2 - x) / 300), lookY: 0.7, mouth: 'smile', brows: 0.45}), win(g, K.and + 2 + i * 2, K.evidence + 2, 8, 6));
  const thumbX = PL_X[1] + PAD + THUMB_W / 2;
  p = mixPose(p, P({lookX: clampL((thumbX - x) / 260, 1), lookY: 0.95, mouth: 'flat', brows: 0.55}), win(g, K.evidence + 2 + i * 2, DEFLATE + i * 3, 7, 7));
  // 9. "the model doesn't always have": deflate — worried brows, a look between them, C shakes his head
  const defl = win(g, DEFLATE + i * 3, SINK[0] + 4, 8, 10);
  const look2 = i === 0 ? 0.65 : i === 1 ? (g < K.always + 2 ? -0.65 : 0.6) : -0.55;
  p = mixPose(p, P({lookX: look2, lookY: 0.3, mouth: i === 2 ? 'frown' : 'hmm', brows: 0.85, bob: 5, tilt: i === 2 ? 5 * Math.sin((g - DEFLATE) / 2.6) * Math.exp(-Math.max(0, g - DEFLATE - 6) / 12) : (1 - i) * 3}), defl);
  p = mixPose(p, P({...p, lookX: 0.1 * side, lookY: 0.75}), win(g, K.have + 4, SINK[0] + 4, 8, 8) * 0.8);
  // 10. "an answer matters": A presents his slip with a hopeful grin; B and C look at it
  const present = win(g, PUSH_SLIP - 2, K.rightS + 1, 7, 4);
  p = mixPose(p, i === 0 ? P({lookX: 0.05, lookY: 0.05, mouth: 'grin', brows: 0.65, bob: -4}) : P({lookX: clampL((SLIP_PRESENT.cx - x) / 300), lookY: 0.6, mouth: 'smile', brows: 0.4}), present);
  // 11. "don't ask whether it sounds right": everyone reads the card; A flinches at the strike
  const cardCX = CARD_X + 420;
  p = mixPose(p, P({lookX: clampL((cardCX - x) / 320), lookY: 0.75, mouth: i === 0 ? 'grin' : 'smile', brows: 0.5}), win(g, SR_RISE + 4 + i * 2, STRIKE + 2, 7, 4));
  const flinch = bell(g, STRIKE + 1, 9);
  p = mixPose(p, P({lookX: clampL((cardCX - x) / 320), lookY: 0.7, mouth: 'o', brows: 0.95, bob: -2}), win(g, STRIKE + 1, FLIP + 4, 4, 8));
  if (i === 0) p = {...p, bob: (p.bob ?? 0) - flinch * 7, blink: flinch > 0.35 ? 0.1 : p.blink};
  // 12. "Ask what the evidence is": read card ①; A's eyes flick to his own slip on "evidence"
  p = mixPose(p, P({lookX: clampL((cardCX - x) / 320), lookY: 0.65, mouth: 'flat', brows: 0.5}), win(g, FLIP + 4, Q2_RISE + 4, 8, 8));
  if (i === 0) p = mixPose(p, P({lookX: -0.15, lookY: 0.95, mouth: 'hmm', brows: 0.7, bob: 3}), win(g, BADGE1 + 2, Q2_RISE + 2, 6, 8));
  if (i > 0) p = mixPose(p, P({lookX: -0.9, lookY: 0.35, mouth: 'flat', brows: 0.3, browAsym: 0.7}), win(g, GUILTY + 2 + i * 3, Q2_RISE + 2, 6, 8));
  // 13. "whether it actually says this": card ②, then everyone looks at the slip on "this."
  p = mixPose(p, P({lookX: clampL((cardCX - x) / 320), lookY: 0.85, mouth: 'flat', brows: 0.5}), win(g, Q2_RISE + 4, THIS_T, 8, 6));
  p = mixPose(p, i === 0 ? P({lookX: -0.1, lookY: 0.95, mouth: 'frown', brows: 0.8, bob: 5}) : P({lookX: clampL((SLIP_PRESENT.cx - x) / 300, 1), lookY: 0.75, mouth: 'flat', brows: 0.55}), win(g, THIS_T + 2 + i * 2, K.works1 - 2, 6, 8));
  // 14. "Works on chatbots.": to camera, one sheepish nod each
  const concede = win(g, K.works1 - 2 + i * 2, i === 2 ? STEPS_C[0] - 6 : CAM_PERSON + 4, 8, 8);
  p = mixPose(p, P({lookX: 0.05 * side, lookY: 0.15, mouth: 'flat', brows: 0.7, tilt: (1 - i) * 4}), concede);
  const nod2 = hop(g, NODS[i], -9, 11) - hop(g, NODS[i] + 11, -2, 5);
  p = {...p, bob: (p.bob ?? 0) + nod2, lookY: p.lookY + (nod2 > 1 ? 0.35 : 0), mouth: g >= NODS[i] + 6 && concede > 0.5 ? 'smile' : p.mouth};
  if (i === 0) p = mixPose(p, P({...p, lookX: 0.2, lookY: 0.9}), win(g, TAKE, TAKE_DROP + 10, 4, 8));
  // 15. footsteps: B and C look right; C makes room and leans, watching the newcomer
  if (i === 1) p = mixPose(p, P({lookX: 0.9, lookY: 0.1, mouth: 'smile', brows: 0.55}), win(g, STEPS_P[1] + 4, HIT + 2, 7, 4));
  if (i === 2) {
    p = mixPose(p, P({lookX: 0.95, lookY: 0.05, mouth: 'smile', brows: 0.5}), tw(g, STEPS_P[0] + 4, 6));
    const step = hop(g, STEPS_C[0], 6, 8) + hop(g, STEPS_C[1], 6, 8);
    p = {...p, bob: (p.bob ?? 0) + step, lean: p.lean - 3 * win(g, STEPS_C[0], STEPS_C[1] + 6, 4, 6)};
    p = mixPose(p, P({lookX: 0.85, lookY: 0.2, mouth: 'smile', brows: 0.4, lean: 2, tilt: 4}), tw(g, STEPS_C[1] + 8, 8));
  }
  // 16. the stamp: B gasps; C smirks — this time it isn't him
  if (i === 1) p = mixPose(p, P({lookX: 0.9, lookY: 0.45, mouth: 'o', brows: 1, bob: -3}), win(g, HIT + 2, SHRUG + 4, 4, 10));
  if (i === 1) p = mixPose(p, P({lookX: 0.8, lookY: 0.2, mouth: 'smile', brows: 0.6}), tw(g, SHRUG + 4, 10));
  if (i === 2) p = mixPose(p, P({lookX: 0.9, lookY: 0.55, mouth: 'smirk', brows: 0.2, browAsym: 1, lean: 2.5, tilt: 6}), win(g, HIT + 4, SHRUG + 2, 5, 8));
  if (i === 2) p = mixPose(p, P({lookX: -0.15, lookY: 0.05, mouth: 'smirk', brows: 0.3, browAsym: 1, lean: 2.5, tilt: 3}), tw(g, SHRUG + 2, 8));

  // front (right) arm: rests on the counter; A's hand comes onto his slip when it lands and stays on it
  const ch = {x, y: CLERK_Y, scale: CLERK_S, bob: p.bob};
  const rest = reach(ch, 1, x + 92, COUNTER_TOP + 4);
  let armR: Arm = rest;
  let front: 'R' | 'none' = 'R';
  if (i === 0) {
    // the hand holds the top edge near the right corner; on the enlarged slip it slides inward to stay within reach
    const corner = toWorld(sa, lerp(SLIP_W - 16, 286, Math.max(0, Math.min(1, (sa.s - 1) / 0.3))), 14);
    const onSlip = tw(g, LAND + 1, 6, E.out);
    armR = mixArm(rest, reach(ch, 1, corner.x - 6, corner.y), onSlip);
    if (g >= TAKE_DROP) front = 'none';
    if (sa.hidden) armR = mixArm(reach(ch, 1, x + 70, COUNTER_TOP + 40), {a: 8, b: 12}, tw(g, TAKE_DROP + 10, 8));
  }
  let armL: Arm = p.armL;
  if (i === 2 && g >= STEPS_C[0] - 2) {
    // C: walks with his arms at his sides, then settles, hands on hips, to watch the newcomer
    const side0 = {a: 10, b: 14};
    armR = mixArm(rest, side0, tw(g, STEPS_C[0] - 2, 5));
    const akimbo = tw(g, STEPS_C[1] + 8, 8);
    armR = mixArm(armR, reach(ch, 1, x + 64, CLERK_Y - 0.98 * 172, -1), akimbo);
    armL = mixArm(armL, reach(ch, -1, x - 66, CLERK_Y - 0.98 * 172, -1), akimbo);
  }
  p = {...p, armR, armL};
  const life = i === 0 && g >= LAND && g < TAKE_DROP + 10 ? 0.3 : g >= K.because && g < K.so3 ? 0.35 : 0.65;
  return {pose: p, life, front, x};
};

const checkerRig = (g: number): Pose => {
  const ch = CHECKER;
  const hold = reach(ch, 1, ch.x + 50, ch.y - 0.92 * 222);
  let p = P({armR: hold, armL: {a: 6, b: 8}, mouth: 'flat', lookX: 0.75, lookY: 0.4, brows: 0, tilt: -1});
  // the ticket: up at it, skeptical on "confidently"
  p = mixPose(p, P({...p, lookX: 0.8, lookY: -0.6}), win(g, K.why, K.because - 4, 8, 8));
  p = mixPose(p, P({...p, browAsym: 1, brows: -0.1}), win(g, K.confidently + 4, K.because, 6, 8));
  // "wrong?": one pencil tap on the counter and a small nod
  const tap = bell(g, TAP1, 6);
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 62, COUNTER_TOP - 8), tw(g, TAP1 - 5, 5) * (1 - tw(g, TAP1 + 8, 6)))};
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 62, COUNTER_TOP - 40), tap)};
  p = {...p, bob: (p.bob ?? 0) + hop(g, TAP1 + 2, -4, 8), lookY: p.lookY + (tap > 0 ? 0.6 : 0)};
  // the boards: reads the first one, skeptical; turns to the second, nods on "evidence"; content on "have."
  p = mixPose(p, P({...p, lookX: 0.85, lookY: 0.6, browAsym: 0.8, brows: 0, mouth: 'hmm'}), win(g, K.because + 2, K.and + 4, 8, 8));
  p = mixPose(p, P({...p, lookX: 1, lookY: 0.45, browAsym: 0, brows: 0.25, mouth: 'flat'}), win(g, K.and + 4, VERDICT + 2, 8, 8));
  p = {...p, bob: (p.bob ?? 0) + hop(g, K.evidence + 3, -5, 10)};
  p = mixPose(p, P({...p, lookX: 0.2, lookY: 0.05, mouth: 'smile', browAsym: 0, brows: 0.2}), tw(g, VERDICT + 2, 8));
  // (out of frame through s34) "chatbots.": a satisfied tap
  p = {...p, armR: mixArm(p.armR, reach(ch, 1, ch.x + 62, COUNTER_TOP - 40), bell(g, TAP2, 6))};
  return p;
};

const personRig = (g: number, ps: SlipState): {pose: Pose; x: number; life: number} => {
  const x = personX(g);
  const walking = g >= STEPS_P[0] && g < ARRIVE_P + 2;
  const stepHop = STEPS_P.reduce((a, f) => a + hop(g, f, 7, 7), 0);
  const ph = ((g - STEPS_P[0]) / 7) * Math.PI;
  let p = P({lookX: -0.5, lookY: 0.05, mouth: 'smile', brows: 0.35, lean: walking ? -3 : 0, bob: stepHop});
  if (walking) p = {...p, armR: {a: 10 + 9 * Math.sin(ph), b: 14}, armL: {a: 10 - 9 * Math.sin(ph), b: 14}};
  // arrives, produces the slip, smug grin to camera
  p = mixPose(p, P({...p, lookX: 0.15, lookY: 0.6, mouth: 'smile', brows: 0.4}), win(g, P_RISE - 2, P_LAND + 2, 4, 4));
  p = mixPose(p, P({...p, lookX: 0, lookY: 0, mouth: 'grin', brows: 0.6, tilt: -3, lean: -1}), win(g, P_LAND + 2, HIT, 4, 1));
  // hand on the heart: "trust me" (to camera)
  p = mixPose(p, P({...p, lookX: -0.1, lookY: -0.1, mouth: 'grin', brows: 0.7, tilt: -4}), win(g, LETGO, HIT, 4, 1));
  // "people,": clocks the hand coming up out of the corner of an eye — the grin wavers
  p = mixPose(p, P({...p, lookX: 0.5, lookY: 0.75, mouth: 'smile', brows: 0.9, tilt: -2}), win(g, K.people + 3, HIT, 5, 1));
  // the stamp: flinch, then the "o"
  const fl = bell(g, HIT, 9);
  p = mixPose(p, P({lookX: 0.35, lookY: 0.8, mouth: 'o', brows: 1, lean: 4, bob: -3, tilt: 2}), tw(g, HIT, 3));
  p = {...p, bob: (p.bob ?? 0) - fl * 9, blink: fl > 0.4 ? 0.1 : undefined};
  // a sheepish shrug before "This"
  const sh = tw(g, SHRUG, 8);
  p = mixPose(p, P({lookX: -0.25, lookY: 0.05, mouth: 'hmm', brows: 0.75, lean: 2, tilt: -6, bob: -4 * bell(g, SHRUG, 12)}), sh);
  // arms: the right hand works the slip; then the heart; then the shrug
  const ch = {x, y: CLERK_Y, scale: CLERK_S, bob: p.bob};
  let armR: Arm = p.armR;
  if (g >= P_RISE - 4) {
    armR = mixArm(armR, reach(ch, 1, x + 44, COUNTER_TOP + 8), tw(g, P_RISE - 4, 4));
    if (g >= P_RISE) {
      const edge = toWorld(ps, PSLIP_W * 0.66, 8, PSLIP_W, PSLIP_H);
      armR = reach(ch, 1, edge.x, edge.y);
      const top = toWorld(ps, PSLIP_W * 0.72, 12, PSLIP_W, PSLIP_H);
      armR = mixArm(armR, reach(ch, 1, top.x, top.y), tw(g, P_LAND, 5));
    }
    armR = mixArm(armR, reach(ch, 1, x - 12, CLERK_Y - 0.98 * 246, -1), tw(g, LETGO, 6)); // across the body: elbow stays down
    armR = mixArm(armR, reach(ch, 1, x + 92, CLERK_Y - 0.98 * 318), tw(g, HIT + 1, 3));
  }
  let armL: Arm = p.armL;
  if (sh > 0) {
    armR = mixArm(armR, reach(ch, 1, x + 108, CLERK_Y - 0.98 * 246), sh);
    armL = mixArm(armL, reach(ch, -1, x - 108, CLERK_Y - 0.98 * 246), sh);
  }
  p = {...p, armR, armL};
  const life = g >= P_RISE && g < SHRUG ? 0.25 : 0.6;
  return {pose: p, x, life};
};

/* ------------------------------------------------------------------ the end card (screen space) */
const TAG_PX = 54;
const TAG_FONT = `800 ${TAG_PX}px "Nunito Variable"`;
const TAG_TOP = 294;
const CHIP_PX = 42;
const CHIP_TOP = 390;
const HON_PX = 36; // the film's pointer to its sources: readable on a phone, above the control-bar band
const HON_X = 300;
const HON_TOP = 940;
const HON_TEXT = 'Sources, excerpts and credits are in the description.';
const chipW = (text: string) => textWidth(text, `800 ${CHIP_PX}px "Nunito Variable"`) + text.length * CHIP_PX * 0.02 + CHIP_PX * 1.6 + 6;
const END_CHECKER = {x: 192, y: 1040, scale: 0.7};

const checkerEndRig = (g: number): {pose: Pose; x: number} => {
  const x = kf(g, [
    [CHK_STEPS[0], -150],
    [CHK_STEPS[0] + 8, -14],
    [CHK_STEPS[1] + 8, 88],
    [CHK_STEPS[2] + 8, END_CHECKER.x],
  ]);
  const walking = g < CHK_STEPS[2] + 10;
  const ch = {x, y: END_CHECKER.y, scale: END_CHECKER.scale};
  let p = P({lookX: 0.6, lookY: 0.1, mouth: 'flat', brows: 0.1, bob: CHK_STEPS.reduce((a, f) => a + hop(g, f, 6, 8), 0), lean: walking ? -3 : 0, armL: {a: 6, b: 8}});
  const hold = reach(ch, 1, x + 40, END_CHECKER.y - END_CHECKER.scale * 222);
  // looks down at the line, taps it twice with the pencil, the underline draws; a nod; to camera; up at Subscribe
  p = mixPose(p, P({...p, lookX: 0.8, lookY: 0.85}), win(g, CHK_STEPS[2] + 6, CHK_NOD, 6, 8));
  const tapPt = {x: HON_X + 8, y: HON_TOP + 2}; // where the hand goes so the pencil tip lands on the first word
  const toTap = win(g, CHK_TAPS[0] - 6, UL2 + 6, 6, 8);
  const lift = 14 * (bell(g, CHK_TAPS[0] - 3, 6) + bell(g, CHK_TAPS[1] - 3, 6));
  let armR = mixArm(hold, reach(ch, 1, tapPt.x, tapPt.y - lift), toTap);
  p = {...p, armR};
  p = {...p, bob: (p.bob ?? 0) + hop(g, CHK_NOD, -6, 11)};
  p = mixPose(p, P({...p, lookX: 0.05, lookY: 0.02, mouth: 'smile', brows: 0.25, browAsym: 0.6}), tw(g, CHK_NOD + 8, 8));
  p = mixPose(p, P({...p, lookX: 0.9, lookY: -0.9, mouth: 'smile', browAsym: 0}), win(g, NUDGE - 6, NUDGE + 22, 6, 8));
  p = mixPose(p, P({...p, lookX: 0.75, lookY: -1, mouth: 'hmm', brows: 0.1, browAsym: 1, tilt: 4}), win(g, WIGGLE + 2, WIGGLE + 26, 5, 8));
  p = {...p, bob: (p.bob ?? 0) + hop(g, WIGGLE + 30, -5, 10), mouth: g >= WIGGLE + 30 ? 'smile' : p.mouth};
  armR = p.armR;
  return {pose: {...p, armR}, x};
};

const EndCard: React.FC<{g: number}> = ({g}) => {
  const pops = POPS.map((f) => (g < f ? 0 : sp(g, f, {damping: 14, stiffness: 210, mass: 0.8}))) as [number, number, number];
  const gotTilt = g < K.weird ? 5 : lerp(5, 0, sp(g, K.weird, SNAP)) + 6 * ring(g, WIGGLE, 0.55, 0.13);
  const gotHop = hop(g, WIGGLE - 2, 12, 9);
  const swash = tw(g, K.weird + 2, 9, E.out);
  const up = tw(g, WM_UP, 16, E.inOut);
  const wmCy = lerp(482, 186, up);
  const wmS = lerp(1, 0.85, up);
  // tagline
  const t1 = 'AI moves fast.';
  const t2 = 'We make it make sense.';
  const sp1 = textWidth(' ', TAG_FONT);
  const w1 = textWidth(t1, TAG_FONT);
  const w2 = textWidth(t2, TAG_FONT);
  const gapT = sp1 + 6;
  const left = 960 - (w1 + gapT + w2) / 2;
  const whip = tw(g, TAG[0], 7, E.out);
  const skid = 16 * ring(g, TAG[0] + 7, 0.55, 0.28);
  const room = tw(g, TAG[1] - 12, 10, E.inOut); // slides over to make room for the second half
  const x1 = (1 - whip) * -760 + skid + (1 - room) * (960 - w1 / 2 - left);
  const t2u = sp(g, TAG[1], {damping: 22, stiffness: 120, mass: 1});
  const msX = textWidth('We ', TAG_FONT);
  const msW = textWidth('make it make sense.', TAG_FONT) - textWidth('.', TAG_FONT);
  const ulT = tw(g, UL_SENSE, 12, E.inOut);
  // chips
  const cA = 'New episodes twice a week';
  const cB = 'Subscribe';
  const wA = chipW(cA);
  const wB = chipW(cB);
  const gap = 28;
  const slideL = tw(g, SUBS, 9, E.inOut);
  const aX = 960 - wA / 2 - ((wB + gap) / 2) * slideL;
  const bX = aX + wA + gap;
  const aU = sp(g, CHIP1, SNAP);
  const twiceHop = hop(g, TWICE[0], 7, 6) + hop(g, TWICE[1], 7, 6);
  const bU = sp(g, SUBS + 2, SNAP);
  const press = 1 - 0.07 * bell(g, SUBS + 14, 7);
  const nudge = 1 + 0.07 * bell(g, NUDGE, 12);
  const nudgeRot = 3 * ring(g, NUDGE, 0.7, 0.2);
  // honesty line and its underline
  const hU = sp(g, HONEST, SOFT);
  const hW = textWidth(HON_TEXT, `800 ${HON_PX}px "Nunito Variable"`);
  const hUl = tw(g, UL2, 14, E.inOut);
  const chk = g >= CHK_STEPS[0] ? checkerEndRig(g) : null;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: 1920, top: wmCy - 75, height: 150, display: 'flex', justifyContent: 'center', transform: `scale(${wmS})`, transformOrigin: '50% 50%'}}>
        <S10Wordmark size={150} pops={pops} gotTilt={gotTilt} swash={swash} bob={[0, gotHop, 0]} />
      </div>
      {g >= TAG[0] && (
        <div style={{position: 'absolute', left: left + x1, top: TAG_TOP, font: TAG_FONT, color: C.inkSoft, whiteSpace: 'nowrap', transform: `skewX(${-14 * (1 - whip)}deg)`}}>{t1}</div>
      )}
      {g >= TAG[1] && (
        <div style={{position: 'absolute', left: left + w1 + gapT, top: TAG_TOP, opacity: Math.min(1, (g - TAG[1] + 1) / 3)}}>
          <div style={{font: TAG_FONT, color: C.ink, whiteSpace: 'nowrap', transform: `translateY(${(1 - t2u) * -28}px) scale(${1 + 0.04 * bell(g, UL_SENSE + 4, 12)})`, transformOrigin: '0% 80%'}}>{t2}</div>
          {ulT > 0 && <div style={{position: 'absolute', left: msX - 4, top: TAG_PX * 1.22, width: (msW + 8) * ulT, height: 8, borderRadius: 4, background: C.teal}} />}
        </div>
      )}
      {g >= CHIP1 && (
        <div style={{position: 'absolute', left: aX, top: CHIP_TOP + (1 - Math.min(1, aU)) * 40 + twiceHop, transform: `scale(${lerp(0.7, 1, aU)})`, transformOrigin: '50% 100%'}}>
          <Chip tone="ink" size={CHIP_PX}>
            {cA}
          </Chip>
        </div>
      )}
      {g >= SUBS + 2 && (
        <div style={{position: 'absolute', left: bX, top: CHIP_TOP, transform: `scale(${Math.max(0.001, bU) * press * nudge}) rotate(${nudgeRot}deg)`, transformOrigin: '25% 60%'}}>
          <Chip tone="coral" size={CHIP_PX}>
            {cB}
          </Chip>
        </div>
      )}
      {g >= HONEST && (
        <div style={{position: 'absolute', left: HON_X, top: HON_TOP + (1 - Math.min(1, hU)) * 30, opacity: Math.min(1, (g - HONEST + 1) / 4)}}>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: HON_PX, color: C.inkSoft, whiteSpace: 'nowrap', lineHeight: 1.2}}>{HON_TEXT}</div>
          {hUl > 0 && <div style={{position: 'absolute', left: -4, top: HON_PX * 1.24, width: (hW + 8) * hUl, height: 6, borderRadius: 3, background: C.teal}} />}
        </div>
      )}
      {chk && <Character look={CAST.checker} pose={chk.pose} frame={g} seed={9} x={chk.x} y={END_CHECKER.y} scale={END_CHECKER.scale} front="R" life={0.5} holdR={<Pencil />} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ scene */
export const S10Payoff: React.FC = () => {
  const g = useG();
  useFontsReady();
  const cam = camAt(g);
  const sa = slipA(g);
  const ps = pslip(g);

  // light: conclusion mode dims the wall for s33–s34
  const dim = tw(g, DIM_IN, 12, E.inOut) * (1 - tw(g, UNDIM, 12, E.inOut));
  // set responses
  const nudge = 1.2 * ring(g, LAND, 1.4, 0.45) + 2.6 * ring(g, HIT, 1.6, 0.45) + 1.2 * ring(g, P_LAND, 1.5, 0.5);
  const signRot = 1.2 * ring(g, TDROP, 0.45, 0.09) + 1.6 * ring(g, HIT, 0.42, 0.08);
  const tY = ticketY(g);
  const tSwing = 1.5 * ring(g, TDROP, 0.42, 0.08) + 0.6 * ring(g, HOIST, 0.5, 0.2);
  // the set strike for the end card: the counter goes first, the figures and windows a beat later; the sign goes up
  const sinkA = kf(g, [
    [STRIKE_SET, 0],
    [STRIKE_SET + 4, -7, E.out],
    [STRIKE_SET + 16, 1100, E.in],
  ]);
  const sinkB = sinkA;
  const hoist = kf(g, [
    [STRIKE_SET + 1, 0],
    [STRIKE_SET + 5, 8, E.out],
    [STRIKE_SET + 16, -700, E.in],
  ]);
  const setGone = g >= STRIKE_SET + 18;
  const dotShift = Math.max(0, g - (STRIKE_SET + 32)) * 0.22;

  const clerks = [0, 1, 2].map((i) => clerkRig(i, g, sa));
  const person = g >= STEPS_P[0] ? personRig(g, ps) : null;
  const chkPose = checkerRig(g);

  // the stamp (screen space): aimed at the person's slip, staged like S1's third WRONG
  // aim at the slip as it actually is (jolt, wobble and the counter nudge included), so the pad lands on its print
  const stampW = toWorld(ps.hidden ? PSLIP_HOME : ps, PSLIP_STAMP_AT.x, PSLIP_STAMP_AT.y, PSLIP_W, PSLIP_H);
  const stampPt = worldToScreen(cam, stampW.x, stampW.y + nudge, 1);
  const [ix, iy] = impact(g, HIT, 0.12, 8);
  const inkPop = g >= HIT ? lerp(1.15, 1, tw(g, HIT, 6, E.out)) : 1;

  // the leader from "this" (card ②) to the slip's claim
  const th = cardWordX(CARD_TEXT[2], 'this');
  const lead0 = {x: CARD_X + th.x + th.w / 2, y: CARD_Y[1] + CARD_H};
  const claimPt = toWorld(sa, SLIP_W + 5, 252); // the slip's edge beside the end of the claimed title, under the stamp's overhang
  const leadT = tw(g, THIS_T + 2, 9, E.inOut) * (1 - tw(g, CARDS_OUT[0] - 5, 6, E.in));
  // under card ②, then up through the gap between the slip and the cards, into the slip's edge
  const gapX = (SLIP_PRESENT.cx + (SLIP_W * SLIP_PRESENT.s) / 2 + CARD_X) / 2;
  const c2 = {x: claimPt.x + 22, y: claimPt.y + 30};
  const leadPath = `M ${lead0.x} ${lead0.y + 8} C ${lead0.x - 40} ${lead0.y + 92}, ${gapX + 150} ${lead0.y + 92}, ${gapX + 8} ${lead0.y + 40} C ${gapX - 2} ${lead0.y + 20}, ${c2.x} ${c2.y}, ${claimPt.x} ${claimPt.y}`;
  const tang = Math.atan2(claimPt.y - c2.y, claimPt.x - c2.x);
  const head = [tang + Math.PI - 0.5, tang + Math.PI + 0.5].map((a) => `M ${claimPt.x} ${claimPt.y} L ${claimPt.x + 26 * Math.cos(a)} ${claimPt.y + 26 * Math.sin(a)}`).join(' ');
  const headT = tw(g, THIS_T + 10, 3, E.out) * (1 - tw(g, CARDS_OUT[0] - 5, 2));
  const titlePulse = bell(g, THIS_T + 8, 22);

  const clerkBodies = clerks.map((r, i) => (
    <Character key={i} look={CAST[['clerkA', 'clerkB', 'clerkC'][i]]} pose={r.pose} frame={g} seed={i + 2} x={r.x} y={CLERK_Y} scale={CLERK_S} front={r.front} pass="body" life={r.life} />
  ));
  const clerkArms = clerks.map((r, i) => (
    <Character key={i} look={CAST[['clerkA', 'clerkB', 'clerkC'][i]]} pose={r.pose} frame={g} seed={i + 2} x={r.x} y={CLERK_Y} scale={CLERK_S} front={r.front} pass="frontArm" shadow={false} life={r.life} />
  ));

  const slipEl = (
    <div style={{position: 'absolute', left: sa.cx - SLIP_W / 2, top: sa.cy - SLIP_H / 2, width: SLIP_W, height: SLIP_H, transform: `rotate(${sa.rot}deg) scale(${sa.s})`, transformOrigin: '50% 50%'}}>
      <AnswerSlipArt i={0} marks={{title: tw(g, THIS_T + 6, 10, E.out), pulse: titlePulse, glint: tw(g, PUSH_SLIP + 6, 14, E.inOut) < 1 ? tw(g, PUSH_SLIP + 6, 14, E.inOut) : 0}} stamps={[{...H910.stamp}]} />
    </div>
  );
  const [psx, psy] = impact(g, HIT, 0.04, 8);
  const pslipEl = !ps.hidden && (
    <div style={{position: 'absolute', left: ps.cx - PSLIP_W / 2, top: ps.cy - PSLIP_H / 2, width: PSLIP_W, height: PSLIP_H, transform: `rotate(${ps.rot}deg) scale(${ps.s * psx}, ${ps.s * psy})`, transformOrigin: '50% 50%'}}>
      <PersonSlipArt stamp={g >= HIT ? {scale: inkPop, sx: ix, sy: iy} : undefined} glint={tw(g, P_LAND + 1, 14, E.inOut)} />
    </div>
  );

  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <Camera cam={cam}>
        <S10Wall shift={dotShift} />
        {!setGone && (
          <Layer depth={1}>
            {/* back plane: windows, sign, the hanging question */}
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${sinkB}px)`}}>
              <Arches />
            </div>
            <HangingSign rot={signRot} dy={hoist} />
            {g >= TDROP - 9 && g < HOIST + 13 && (
              <div style={{position: 'absolute', inset: 0, transform: `translateY(${tY}px) rotate(${tSwing * 0.25}deg)`, transformOrigin: '960px -1200px'}}>
                <Ticket g={g} />
              </div>
            )}
            {/* conclusion mode: the room light drops behind the cast */}
            {dim > 0 && <div style={{position: 'absolute', left: -1500, top: -1500, width: 5000, height: 4000, background: C.ink, opacity: 0.15 * dim}} />}
            {/* figures behind the counter */}
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${sinkB}px)`}}>
              <Character look={CAST.checker} pose={chkPose} frame={g} seed={9} x={CHECKER.x} y={CHECKER.y} scale={CHECKER.scale} front="R" pass="body" life={0.6} />
              {clerkBodies}
              {person && <Character look={CAST.person} pose={person.pose} frame={g} seed={21} x={person.x} y={CLERK_Y} scale={CLERK_S} front="R" pass="body" life={person.life} />}
            </div>
            {/* slips while they are behind the counter edge */}
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${sinkA}px)`}}>
              {g >= LAND && sa.behind && !sa.hidden && slipEl}
              {ps.behind && pslipEl}
            </div>
            {/* the counter and what stands in front of it */}
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${sinkA}px)`}}>
              <Counter nudge={nudge} />
              <div style={{position: 'absolute', inset: 0, transform: `translateY(${nudge}px)`}}>
                {g >= LAND && !sa.behind && slipEl}
                {!ps.behind && pslipEl}
              </div>
            </div>
            {/* front arms over the counter and the slips */}
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${sinkB}px)`}}>
              <Character look={CAST.checker} pose={chkPose} frame={g} seed={9} x={CHECKER.x} y={CHECKER.y} scale={CHECKER.scale} front="R" pass="frontArm" shadow={false} life={0.6} holdR={<Pencil />} />
              {clerkArms}
              {person && <Character look={CAST.person} pose={person.pose} frame={g} seed={21} x={person.x} y={CLERK_Y} scale={CLERK_S} front="R" pass="frontArm" shadow={false} life={person.life} />}
            </div>
            {/* s33: the two boards rise in front of the counter */}
            {g >= PL_RISE[0] && g < SINK[1] + 16 && (
              <>
                <div style={{position: 'absolute', left: PL_X[0], top: PL_TOP + boardY(g, 0), transform: `rotate(${PL_ROT[0] + 0.3 * drift(g, 3, 150)}deg)`}}>
                  <Stake />
                  <BoardL g={g} />
                </div>
                {g >= PL_RISE[1] && (
                  <div style={{position: 'absolute', left: PL_X[1], top: PL_TOP + boardY(g, 1), transform: `rotate(${PL_ROT[1] + 0.8 * ring(g, PL_RISE[1] + 12, 0.5, 0.15) + 0.3 * drift(g, 8, 170)}deg)`}}>
                    <Stake />
                    <BoardR g={g} />
                  </div>
                )}
              </>
            )}
            {/* s34: the habit cards on the counter front */}
            {g >= SR_RISE && g < CARDS_OUT[1] + 10 && (
              <>
                <div style={{position: 'absolute', left: CARD_X, top: CARD_Y[0], width: CARD_W, height: CARD_H, transform: `perspective(1600px) rotateX(${cardHinge(g, 0)}deg)`, transformOrigin: '50% 100%'}}>
                  <HabitCard1 g={g} />
                </div>
                {g >= Q2_RISE && (
                  <div style={{position: 'absolute', left: CARD_X, top: CARD_Y[1], width: CARD_W, height: CARD_H, transform: `perspective(1600px) rotateX(${cardHinge(g, 1)}deg)`, transformOrigin: '50% 100%'}}>
                    <HabitCard2 g={g} />
                  </div>
                )}
                {leadT > 0 && (
                  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
                    <path d={leadPath} fill="none" stroke={C.coral} strokeWidth={8} strokeLinecap="round" strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - leadT} />
                    {headT > 0 && <path d={head} fill="none" stroke={C.coral} strokeWidth={8} strokeLinecap="round" opacity={headT} />}
                  </svg>
                )}
              </>
            )}
          </Layer>
        )}
      </Camera>

      {/* the hand-off slip (H910) carried back to the counter in screen space until it lands */}
      {g < LAND && <CarriedSlip g={g} cam={cam} />}

      {/* the checking hand (point of view, teal sleeve as in S1 and S9): one heavy SOURCE? stamp */}
      {g < ARM_OUT + 11 && (
        <AbsoluteFill style={{transform: `translate(${1150 * tw(g, ARM_OUT, 11, E.in)}px, ${-40 * tw(g, ARM_OUT, 11, E.out)}px)`}}>
          <StampArm
            g={g}
            scale={1.5}
            hover={110}
            sleeve={C.teal}
            arcHeight={40}
            enter={ARM_IN}
            exit={HIT + 90}
            targets={[{at: ARM_IN + 14, x: stampPt.x, y: stampPt.y}]}
            hits={[HIT]}
            shapes={[{lift: 6, down: 3, hold: 4, up: 6, wind: 0.9}]}
          />
        </AbsoluteFill>
      )}

      {/* the end card grows out of the struck set */}
      {g >= POPS[0] - 2 && <EndCard g={g} />}
    </AbsoluteFill>
  );
};

/** The slip exactly as S9 leaves it (H910), descending onto its place on the counter as the camera pulls out. */
const CarriedSlip: React.FC<{g: number; cam: Cam}> = ({g, cam}) => {
  const u = tw(g, CARRY, CARRY_DUR, E.inOut);
  const stamps = [{...H910.stamp}];
  if (u <= 0) return <SlipOnScreen i={0} cx={H910.cx} cy={H910.cy} scale={H910.scale} rot={H910.rot} stamps={stamps} />;
  const home = worldToScreen(cam, SLIP_HOME.cx, SLIP_HOME.cy, 1);
  const lift = Math.sin(u * Math.PI) * 0.6;
  return <SlipOnScreen i={0} cx={lerp(H910.cx, home.x, u)} cy={lerp(H910.cy, home.y, u) - 24 * Math.sin(u * Math.PI)} scale={lerp(H910.scale, home.scale * SLIP_HOME.s, u)} rot={lerp(H910.rot, SLIP_HOME.rot, u)} lift={lift} stamps={stamps} />;
};
