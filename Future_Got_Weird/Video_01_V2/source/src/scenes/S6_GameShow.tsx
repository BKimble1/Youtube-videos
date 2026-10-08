import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, worldToScreen} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, FIRM, SNAP, SOFT, camKick, camPath, drop, hop, impact, kf, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {C, F, OUTLINE} from '../theme';
import {Arm, Character, IDLE, Pose, mixPose, reach, reachLocal} from '../components/Character';
import {CAST} from '../components/cast';
import {H56} from '../lib/handoffs';
import {Sfx} from '../lib/sfx';
import {
  AnswerPanel,
  ConfettiPieces,
  CueCards,
  DeltaChip,
  GOLD,
  HangingTag,
  NAVY_DEEP,
  OPTION_W,
  OptionCard,
  POD,
  Podium,
  RuleCardState,
  RulesBoard,
  SlotState,
  TROPHY_APEX,
  TROPHY_S,
  TrophyV2,
  cardCentre,
  confettiPieces,
  slotCentre,
  valueCentre,
} from '../components/v2/S6_Props';
import {CurtainSlit, Curtain, Darkness, Spotlights, Spot, StageFloor, slitPath} from '../components/v2/S6_Stage';

/**
 * S6 — the game show (s20–s25): why guessing wins under right/wrong grading.
 *
 * Beat sheet (every cue below is a word of the V2 narration):
 *  s20  iris from the S5 lens onto a dark stage, one spot on the curtain → the host pushes through the curtain split on
 *       "Now," and the lights bang on → finger up "why guess at all?" → live shrug "Why not just say I don't know?" →
 *       points up "The researchers" (camera tilts up) → the rules board drops in on its cables on "argue", the citation
 *       tag clips on under it on "part of the answer" → he reads his cue cards; the three face-down cards wobble on "graded."
 *  s21  "Picture a ten-question quiz" — he fans his ten numbered cue cards while the two answer panels drop in at the
 *       sides and their ten slots light 1→10 → points + snap: each rule card flips on its
 *       word ("Right", "Wrong", "I don't know") and its value flap drops on the value word; the two zeros bounce together.
 *  s22  the board flies out, the camera pulls back and the podiums roll in with the contestants ("Two contestants."); the
 *       panels light in their owners' colours → six quick rounds: cue card → both slap → ✓ → both scores roll 0→6 →
 *       push to the honest player: four questions, four head-shakes, four "—" ("I don't know.") → "Six points." locks.
 *  s23  push to the guesser: four slams on "takes a shot at all four", each sets a letter reel spinning → the options
 *       sign drops in ("Four options each", 1 in 4) → "so on average," three reels land and buzz ✕ (escalating winces)
 *       → the last reel crawls → "lands." ✓ DING → deliberately excessive celebration → "Seven points." 6→7.
 *  s24  wide, locked: a caption scroll unrolls one clause per phrase; the ✕ tiles shake on "Three wrong answers";
 *       "Somehow," the lights dim and a trophy is lowered from the flies; it clanks onto the guesser's podium on
 *       "trophy." — then a held, quiet beat (guesser polishes it, honest blinks, host deadpans).
 *  s25  the scroll flies out, the board returns; the host plucks a "−1" card from his cue stack and throws it onto the
 *       Wrong card ("costs") → honest: blanks show 0, score stays 6 → guesser: 7 rolls back to 6, +1, −1 −1 −1 → 4, with an
 *       equation strip → the trophy grows feet, hops down, waddles past the host and hops onto the honest podium.
 */

/* ------------------------------------------------------------------ world layout */
const HOST = {x: 960, y: 900, scale: 0.95};
const HON = {x: 600, y: 905, scale: 0.95};
const GUE = {x: 1320, y: 905, scale: 0.95};
const BUZZ_X = [HON.x - 112, GUE.x + 112]; // buzzers on the outer side of each lid
const BUZZ_Y = POD.lidY - 22; // contact height of the dome
const TROPHY_G = {x: 1176, y: POD.lidY}; // on the guesser's lid, left of his body (clear of his face and the host)
const TROPHY_H = {x: 718, y: POD.lidY};
const WALK_Y = 1000;
const EQ = {x: 1074, y: 318};
const OPT = {x: 1080, y: 258}; // hangs clear of the host's head (≥ 40 px)
const CAP = {cx: 960, top: 26, w: 780, line: 70};
const GUARD = 'illustrative quiz · 10 questions · 4 options each · expected scores';

/* ------------------------------------------------------------------ cues (global frames) */
const SC = scene('S6');
const K = {
  start: SC.from - 9, // first rendered frame: the iris from the S5 lens begins
  from: SC.from,
  end: SC.to,
  last: SC.to + 5, // rendered under the S7 wipe
  // s20
  now: at('s20', 'Now'),
  why: at('s20', 'why'),
  all: at('s20', 'all?'),
  why2: at('s20', 'Why', 2),
  say: at('s20', 'say'),
  idk: at('s20', 'I'),
  know: at('s20', 'know'),
  researchers: at('s20', 'researchers'),
  argue: at('s20', 'argue'),
  part: at('s20', 'part'),
  answer: at('s20', 'answer'),
  how: at('s20', 'how'),
  graded: at('s20', 'graded.'),
  s20End: segEnd('s20'),
  // s21
  picture: at('s21', 'Picture'),
  tenQ: at('s21', 'ten-question'),
  quiz: at('s21', 'quiz.'),
  right: at('s21', 'Right'),
  onePt: at('s21', 'one'),
  wrong: at('s21', 'Wrong'),
  zero1: at('s21', 'zero.'),
  idk2: at('s21', 'I'),
  also: at('s21', 'also'),
  zero2: at('s21', 'zero.', 2),
  // s22
  two: at('s22', 'Two'),
  contestants: at('s22', 'contestants.'),
  both: at('s22', 'Both'),
  answers: at('s22', 'answers.'),
  honest: at('s22', 'honest'),
  leaves: at('s22', 'leaves'),
  other: at('s22', 'other'),
  four: at('s22', 'four'),
  blank: at('s22', 'blank.'),
  sixPts: at('s22', 'Six', 2),
  s22End: segEnd('s22'),
  // s23
  guesser: at('s23', 'guesser'),
  takes: at('s23', 'takes'),
  shot: at('s23', 'shot'),
  all4: at('s23', 'all'),
  four4: at('s23', 'four.'),
  options: at('s23', 'Four', 2),
  so: at('s23', 'so'),
  on: at('s23', 'on'),
  average: at('s23', 'average,'),
  one: at('s23', 'one'),
  lands: at('s23', 'lands.'),
  seven: at('s23', 'Seven'),
  s23End: segEnd('s23'),
  // s24
  lucky1: at('s24', 'One'),
  lucky: at('s24', 'lucky'),
  three: at('s24', 'Three'),
  wrongs: at('s24', 'wrong'),
  somehow: at('s24', 'Somehow,'),
  a: at('s24', 'a'),
  trophy: at('s24', 'trophy.'),
  s24End: segEnd('s24'),
  // s25
  now25: at('s25', 'Now'),
  change: at('s25', 'change'),
  rule: at('s25', 'rule.'),
  wrong25: at('s25', 'wrong'),
  costs: at('s25', 'costs'),
  point25: at('s25', 'point.'),
  honest25: at('s25', 'honest'),
  still: at('s25', 'still'),
  six25: at('s25', 'six.'),
  guesser25: at('s25', 'guesser:'),
  sixG: at('s25', 'six', 2),
  plus: at('s25', 'plus'),
  minus: at('s25', 'minus'),
  three25: at('s25', 'three.'),
  four25: at('s25', 'Four.'),
  trophy25: at('s25', 'trophy'),
  walks: at('s25', 'walks'),
  back: at('s25', 'back.'),
  s25End: segEnd('s25'),
};

// the entrance and the lights
const ENT = {bulge: K.from + 1, open: K.now - 3, step: K.now + 2, cross: K.now + 6, land: K.now + 14};
const LIGHTS = [K.now + 7, K.now + 12, K.now + 17];
// the rules
const BOARD_START = K.researchers + 2; // the board starts down from the flies as the host points up
const BOARD_LAND = K.argue + 7;
const BOARD_HIT = BOARD_LAND - 6; // the winch's overshoot: the board bottoms out on its cables (on "argue")
const TAG_LAND = [K.part + 7, K.quiz + 9];
const FAN = {open: K.picture + 6, close: K.quiz + 13};
const FLIP = [K.right, K.wrong, K.idk2];
const VAL = [K.onePt + 3, K.zero1 + 1, K.zero2 + 1];
const ZEROS = K.zero2 + 6;
const FLY_OUT = K.zero2 + 13;
// the game
const ROLL = [K.two - 14, K.two - 10];
const ROLL_DUR = 24;
const PANEL_LAND = [K.picture + 10, K.picture + 13];
const LABEL_ON = K.two + 22; // the apron marquee (guard rail) lights as the game starts
const SLOT_LIGHT = (k: number) => K.tenQ + 1 + k * 2.2; // the ten numbers light 1→10 across "ten-question quiz"
const ROUND = [0, 1, 2, 3, 4, 5].map((k) => K.both + 3 + Math.round(k * 7.4));
const PASS = [K.leaves + 2, K.other - 1, K.four, K.blank + 1];
const LOCK = K.sixPts;
const SLAM = [K.takes + 2, K.shot + 1, K.all4 - 3, K.four4];
const OPT_LAND = K.options + 2;
const LAND = [K.so - 1, K.on + 1, K.average + 8, K.lands];
const JUDGE = LAND.map((f) => f + 2);
const DING = JUDGE[3];
const SEVEN = K.seven + 2;
const LETTER = [1, 3, 0, 2]; // B, D, A, C
// s24
const CAPT = {drop: K.lucky1 - 4, l2: K.three, l3a: K.somehow, l3b: K.trophy, out: K.now25 + 1};
const TRO = {lower: K.somehow + 3, release: K.trophy - 4, land: K.trophy};
// s25
const BOARD_BACK = K.rule;
const MINUS = {pluck: K.change + 6, show: K.rule + 2, wind: K.wrong25 - 4, release: K.costs - 12, hit: K.costs};
// the guesser's 7 already IS 6 + 1: "six," writes 6 on the strip, the +1 chip hops from the lucky tile into the strip,
// then three −1 chips knock the window down 7 → 6 → 5; the third hangs over the window through the pause and drops in on "Four."
const PLUS_FLY = {launch: K.plus + 2, arrive: K.plus + 11};
const MINUS_FLY: {launch: number; arrive: number; hover?: number}[] = [
  {launch: K.minus + 2, arrive: K.minus + 11},
  {launch: K.minus + 9, arrive: K.minus + 18},
  {launch: K.minus + 16, hover: K.minus + 25, arrive: K.four25},
];
const STRIP = {land: K.sixG + 2, t1: K.sixG + 2, t2: PLUS_FLY.arrive, t3: K.three25, t4: K.four25};
const TW = {eyes: K.four25 + 4, feet: K.trophy25 - 16, off: K.trophy25 - 8, floor: K.trophy25, up: K.walks + 4, land: K.back};
const WALK_X = [1096, 820];
const HOST_HOP = Math.round(TW.floor + ((TW.up - TW.floor) * (WALK_X[0] - 960)) / (WALK_X[0] - WALK_X[1])) - 5;

/* ------------------------------------------------------------------ small helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const win = (g: number, a: number, b: number, din = 8, dout = 8) => tw(g, a, din, E.inOut) * (1 - tw(g, b, dout, E.inOut));
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1))).join(',')})`;
};
const sumSp = (g: number, frames: number[], cfg = FIRM) => frames.reduce((s, f) => s + sp(g, f, cfg), 0);
/** reach() for a body that leans by `lean` degrees (the rig rotates the whole body about the hips, local (0, −150)):
 *  the target is counter-rotated so the hand still lands exactly on the world point. */
const reachLean = (ch: {x: number; y: number; scale: number; bob?: number}, side: -1 | 1, wx: number, wy: number, lean: number, elbow: 1 | -1 = 1): Arm => {
  const px = ch.x;
  const py = ch.y + ((ch.bob ?? 0) - 150) * ch.scale;
  const a = (-lean * Math.PI) / 180;
  const dx = wx - px;
  const dy = wy - py;
  return reach(ch, side, px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a), elbow);
};

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  open: {cx: H56.x, cy: H56.y, zoom: 1.2},
  host: {cx: 960, cy: 640, zoom: 1.5},
  rules: {cx: 960, cy: 458, zoom: 1.1},
  game: {cx: 960, cy: 600, zoom: 1.08},
  wide: {cx: 960, cy: 540, zoom: 1},
  honest: {cx: 800, cy: 578, zoom: 1.28},
  guesser: {cx: 1120, cy: 578, zoom: 1.28},
};
const camAt = (g: number): Cam => {
  const c = camPath(g, SHOTS.open, [
    {at: K.why - 2, dur: 20, to: SHOTS.host},
    {at: K.researchers - 2, dur: 26, to: SHOTS.rules},
    {at: K.zero2 + 9, dur: 24, to: SHOTS.game},
    {at: K.honest - 4, dur: 20, to: SHOTS.honest},
    {at: K.guesser - 9, dur: 20, to: SHOTS.guesser}, // settles 2 f before the first slam
    {at: K.seven + 14, dur: 22, to: SHOTS.wide},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [TRO.land, MINUS.hit], 0.012)};
};

/* ------------------------------------------------------------------ the reels */
const reel = (g: number, start: number, land: number, decel: number, target: number, v = 0.75) => {
  if (g < start) return {p: 0, v: 0};
  const tA = land - decel;
  const pA = v * (tA - start);
  const m0 = v * decel;
  const P1 = Math.ceil((pA + m0 / 3 - target) / 4) * 4 + target;
  if (g <= tA) return {p: v * (g - start), v};
  if (g <= land) {
    const u = (g - tA) / decel;
    const p = pA + m0 * (u - 2 * u * u + u * u * u) + (P1 - pA) * (3 * u * u - 2 * u * u * u);
    const dp = (m0 * (1 - 4 * u + 3 * u * u) + (P1 - pA) * (6 * u - 6 * u * u)) / decel;
    return {p, v: dp};
  }
  return {p: P1 + 0.14 * ring(g, land, 1.3, 0.4), v: 0};
};
const reelOf = (g: number, j: number) => (j === 3 ? reel(g, SLAM[j] + 1, LAND[j], 30, LETTER[j], 0.4) : reel(g, SLAM[j] + 1, LAND[j], 12, LETTER[j]));

/* ------------------------------------------------------------------ scores */
const honestScore = (g: number) => sumSp(g, ROUND.map((r) => r + 2));
const guesserScore = (g: number) => {
  let v = sumSp(g, ROUND.map((r) => r + 4));
  v += sp(g, SEVEN, SNAP);
  // the wrong answers: the drum twitches up and falls back (no point)
  v += JUDGE.slice(0, 3).reduce((s, f) => s + 0.22 * bell(g, f + 2, 9), 0);
  // s25: each −1 chip knocks the drum down one step (the last one, on "Four.", heavier)
  v -= sp(g, MINUS_FLY[0].arrive, SNAP) + sp(g, MINUS_FLY[1].arrive, SNAP) + sp(g, MINUS_FLY[2].arrive, FIRM);
  return Math.max(0, v);
};

/* ------------------------------------------------------------------ slot states */
const litNum = (g: number, _side: number, k: number) => g >= SLOT_LIGHT(k);
const honestSlots = (g: number): SlotState[] =>
  Array.from({length: 10}).map((_, k) => {
    const lit = litNum(g, 0, k);
    if (k < 6) {
      const r = ROUND[k];
      if (g >= r + 1) return {kind: 'known', t: tw(g, r + 1, 5), glow: 0.8 * bell(g, K.still - 2, 16)};
      if (g >= r - 3) return {kind: 'ask', t: tw(g, r - 3, 3)};
      return {kind: lit ? 'num' : 'off', t: 1};
    }
    const j = k - 6;
    if (g >= PASS[j]) return {kind: 'blank', t: tw(g, PASS[j], 5), zero: bell(g, K.still - 6 + j * 4, 12)};
    if (g >= PASS[j] - 5) return {kind: 'ask', t: tw(g, PASS[j] - 5, 3)};
    return {kind: lit ? 'num' : 'off', t: 1};
  });

const guesserSlots = (g: number): SlotState[] =>
  Array.from({length: 10}).map((_, k) => {
    const lit = litNum(g, 1, k);
    if (k < 6) {
      const r = ROUND[k] + 2;
      if (g >= r + 1) return {kind: 'known', t: tw(g, r + 1, 5), glow: 0.85 * bell(g, K.sixG - 2, 18)};
      if (g >= r - 3) return {kind: 'ask', t: tw(g, r - 3, 3)};
      return {kind: lit ? 'num' : 'off', t: 1};
    }
    const j = k - 6;
    const lucky = j === 3;
    const shakeS24 = !lucky ? 5 * ring(g, K.wrongs + 2, 1.9, 0.3) : 0;
    if (g >= JUDGE[j]) {
      const t = tw(g, JUDGE[j], 5);
      if (lucky) {
        return {
          kind: 'lucky',
          t,
          letter: 'ABCD'[LETTER[j]],
          glow: Math.max(1 - tw(g, JUDGE[j] + 30, 30), bell(g, K.lucky - 4, 26), 0.35),
          spark: g >= K.lucky ? tw(g, K.lucky, 18, E.linear) : tw(g, JUDGE[j], 18, E.linear),
          lift: 16 * bell(g, K.lucky - 4, 26),
          flash: Math.max(1 - tw(g, JUDGE[j], 8), bell(g, PLUS_FLY.launch - 2, 8)),
          flashTone: C.white,
        };
      }
      return {
        kind: 'wrong',
        t,
        letter: 'ABCD'[LETTER[j]],
        shake: 6 * ring(g, JUDGE[j], 1.8, 0.28) + shakeS24,
        flash: Math.max(1 - tw(g, JUDGE[j], 7), bell(g, K.point25 - 1, 10), bell(g, MINUS_FLY[j].launch - 2, 8), 0.8 * bell(g, K.wrongs + 1, 9)),
        flashTone: C.white,
      };
    }
    if (g >= SLAM[j] + 1) {
      const r = reelOf(g, j);
      return {kind: 'reel', t: 1, reel: r.p, speed: r.v, shake: g >= LAND[j] ? 0 : 1.2 * Math.sin(g * 2.1 + j)};
    }
    if (g >= SLAM[j] - 4) return {kind: 'ask', t: tw(g, SLAM[j] - 4, 3)};
    return {kind: lit ? 'num' : 'off', t: 1};
  });

/* ------------------------------------------------------------------ the rules board */
const boardDy = (g: number) => {
  if (g < FLY_OUT) return -430 * (1 - tw(g, BOARD_START, BOARD_LAND - BOARD_START, E.softBack));
  if (g < BOARD_BACK - 16) return -560 * tw(g, FLY_OUT, 16, E.in);
  return drop(g, BOARD_BACK, 560, 14);
};
const boardSwing = (g: number) => 0.9 * ring(g, BOARD_HIT, 0.42, 0.08) + 0.7 * ring(g, BOARD_BACK, 0.42, 0.08) + 1.2 * ring(g, MINUS.hit, 0.5, 0.09) + 0.4 * Math.sin(g / 37);
const cardStates = (g: number): RuleCardState[] =>
  [0, 1, 2].map((i) => {
    const f = FLIP[i];
    const flip = g < f ? 0 : tw(g, f, 11, E.back);
    const tilt = -7 * bell(g, f - 5, 7);
    const wob = [0, 1, 2].reduce((s, k) => s + (k === i ? 4 * ring(g, K.graded + k * 4, 0.9, 0.22) : 0), 0);
    const pulse = i === 0 ? bell(g, VAL[0] + 3, 10) : bell(g, ZEROS, 10);
    let sx = 1;
    let sy = 1;
    if (i === 1 && g >= MINUS.hit) [sx, sy] = impact(g, MINUS.hit, 0.09, 10);
    return {
      flip,
      value: i === 0 ? '+1' : '0',
      valueT: g < VAL[i] ? 0 : tw(g, VAL[i], 8, E.back),
      pulse,
      minus: i === 1 && g >= MINUS.hit ? 1 : 0,
      coral: i === 1 ? tw(g, MINUS.hit, 3) : 0,
      sx,
      sy,
      tilt,
      wobble: wob,
    };
  });

/* ------------------------------------------------------------------ the podiums roll in */
const rollX = (g: number, side: number) => {
  const from = side === 0 ? -360 : 2280;
  const to = side === 0 ? HON.x : GUE.x;
  const u = tw(g, ROLL[side], ROLL_DUR, E.out);
  return lerp(from, to, u) + (to - from) * 0.012 * ring(g, ROLL[side] + ROLL_DUR - 4, 0.7, 0.25);
};
const rollVel = (g: number, side: number) => rollX(g, side) - rollX(g - 1, side);

/* ------------------------------------------------------------------ slaps */
const bump = (d: number, lift: number, hover: number) => {
  if (d < -6 || d > 6) return 0;
  if (d < -3) return lift * E.out((d + 6) / 3);
  if (d < 0) return lift - (lift + hover) * ((d + 3) / 3) ** 2;
  if (d < 2) return -hover;
  return -hover * (1 - E.out((d - 2) / 4));
};
const slapHand = (g: number, hits: number[], rest: {x: number; y: number}, buzz: {x: number; y: number}, lift: number) => {
  const active = tw(g, hits[0] - 9, 4, E.inOut) * (1 - tw(g, hits[hits.length - 1] + 6, 6, E.inOut));
  const hover = 14;
  const h = hover + hits.reduce((s, f) => s + bump(g - f, lift, hover), 0);
  return {x: lerp(rest.x, buzz.x, active), y: lerp(rest.y, buzz.y - h, active), active};
};
const pressOf = (g: number, hits: number[]) => clamp(hits.reduce((s, f) => s + (g >= f && g < f + 2 ? 1 : g >= f + 2 && g < f + 6 ? 1 - (g - f - 2) / 4 : 0), 0), 0, 1);
const lightOf = (g: number, hits: number[]) => clamp(hits.reduce((s, f) => s + (g >= f ? Math.exp(-(g - f) * 0.18) : 0), 0), 0, 1);

/* ------------------------------------------------------------------ the trophy */
const trophyState = (g: number) => {
  // lowered on a cable during "Somehow," then dropped onto the guesser's lid on "trophy."
  if (g < TRO.lower) return null;
  let x = TROPHY_G.x;
  let y = TROPHY_G.y;
  let rot = 0;
  let sx = 1;
  let sy = 1;
  let cable = 0;
  let swing = 0; // pendulum about the bridle hook while it hangs on the cable
  let zone: 'lidG' | 'floor' | 'lidH' = 'lidG';
  if (g < TRO.release) {
    const u = tw(g, TRO.lower, TRO.release - TRO.lower, E.out);
    y = lerp(-180, TROPHY_G.y - 34, u);
    swing = 5 * Math.sin((g - TRO.lower) * 0.32) * (1 - u * 0.75);
    cable = 1;
  } else if (g < TW.off) {
    y = TROPHY_G.y + (g <= TRO.land ? -34 * (1 - ((g - TRO.release) / (TRO.land - TRO.release)) ** 2) : drop(g, TRO.land, 34, 4));
    [sx, sy] = impact(g, TRO.land, 0.13, 10);
    // nervous shuffle once the score drops; side-eye
    x += -6 * tw(g, K.four25 + 4, 10) + 2 * Math.sin(g * 0.9) * win(g, K.four25 + 4, TW.off, 4, 2);
    cable = g < TRO.land + 6 ? 1 - tw(g, TRO.release, 8) : 0;
    if (g >= TW.off - 4) [sx, sy] = [1 + 0.1 * bell(g, TW.off - 4, 5), 1 - 0.12 * bell(g, TW.off - 4, 5)];
  } else if (g < TW.floor) {
    const u = (g - TW.off) / (TW.floor - TW.off);
    x = lerp(TROPHY_G.x - 6, WALK_X[0], u);
    y = lerp(TROPHY_G.y, WALK_Y, u * u) - 70 * Math.sin(u * Math.PI) * (1 - u * 0.4);
    rot = -10 * u;
    zone = u < 0.45 ? 'lidG' : 'floor';
  } else if (g < TW.up) {
    const u = (g - TW.floor) / (TW.up - TW.floor);
    x = lerp(WALK_X[0], WALK_X[1], u);
    y = WALK_Y - 6 * Math.abs(Math.sin((g - TW.floor) * 0.85));
    rot = 6 * Math.sin((g - TW.floor) * 0.85);
    [sx, sy] = g < TW.floor + 8 ? impact(g, TW.floor, 0.14, 8) : [1, 1];
    zone = 'floor';
  } else if (g < TW.land) {
    const u = (g - TW.up) / (TW.land - TW.up);
    x = lerp(WALK_X[1], TROPHY_H.x, u);
    y = lerp(WALK_Y, TROPHY_H.y, Math.sqrt(u)) - 90 * Math.sin(u * Math.PI);
    rot = -12 * Math.sin(u * Math.PI);
    [sx, sy] = g < TW.up + 3 ? [1.08, 0.88] : [0.94, 1.08];
    zone = u < 0.6 ? 'floor' : 'lidH';
  } else {
    x = TROPHY_H.x;
    y = TROPHY_H.y + drop(g, TW.land, 0, 1) - 10 * Math.max(0, ring(g, TW.land + 2, 0.9, 0.3));
    [sx, sy] = impact(g, TW.land, 0.14, 10);
    zone = 'lidH';
  }
  const feet = g < TW.feet ? 0 : sp(g, TW.feet, SNAP);
  const eyes = g < TW.eyes ? 0 : sp(g, TW.eyes, SNAP);
  const walking = g >= TW.floor && g < TW.up;
  const step = walking ? (g - TW.floor) * 0.85 : 0;
  const sweat = g < K.point25 ? 0 : sp(g, K.point25 + 1, SNAP) * (1 + 0.3 * tw(g, K.four25, 8)) * (1 - tw(g, TW.land - 2, 5));
  const lookX = g < K.four25 + 16 ? 0.9 : g < TW.off ? -1 : g < TW.land ? -1 : -0.6 + 0.2 * Math.sin(g / 9);
  const glint = g >= TRO.land + 8 && g < TRO.land + 26 ? (g - TRO.land - 8) / 18 : g >= TW.land + 10 && g < TW.land + 28 ? (g - TW.land - 10) / 18 : -1;
  return {x, y, rot, swing, sx, sy, cable, bridle: g < TRO.release ? 1 : 0, zone, feet, eyes, step, sweat, lookX, glint};
};

/* ------------------------------------------------------------------ host */
type HostState = {x: number; y: number; scale: number; pose: Pose; life: number; fan: number; flip: number; rFront: boolean; clip: number; tile: number};
const CUE_FLIPS = [K.how + 6, ...ROUND.map((r) => r - 4), ...PASS.map((p) => p - 6), SLAM[0] - 7, SLAM[1] - 5, SLAM[2] - 5, SLAM[3] - 5];
const cueFlip = (g: number) => {
  for (const f of CUE_FLIPS) if (g >= f && g < f + 5) return (g - f) / 5;
  return 0;
};

const hostState = (g: number): HostState => {
  // entrance: behind the curtain split (smaller, higher), then two strides forward to the mark
  const stepU = tw(g, ENT.step, 12, E.out);
  const y = lerp(856, HOST.y, stepU);
  const scale = lerp(0.9, HOST.scale, stepU);
  const ch = {x: HOST.x, y, scale};
  const L = (lx: number, ly: number, e: 1 | -1 = 1) => reachLocal(lx, ly, -1, e);
  const R = (lx: number, ly: number, e: 1 | -1 = 1) => reachLocal(lx, ly, 1, e);
  const cardsL = L(-118, -228); // the cue cards held at his side, in front (clear of his ear and beard)
  const restR = R(90, -170);
  let p = P({armL: cardsL, armR: restR, mouth: 'grin', brows: 0.5, lookX: 0, lookY: 0.05});
  let life = 1;

  // gripping the curtain edges, then letting go as he strides out
  const open = slitOpen(g);
  const grip = 1 - tw(g, ENT.cross - 3, 6);
  if (g < ENT.cross + 6) {
    const hw = (290 / 2) * open;
    const gl = reach(ch, -1, HOST.x - hw * 0.93, 610);
    const gr = reach(ch, 1, HOST.x + hw * 0.93, 610);
    p = {...p, armL: mixArm(cardsL, gl, grip), armR: mixArm(restR, gr, grip), mouth: 'grin', brows: 0.9};
  }
  // walk: arms swing, two dips
  const swing = win(g, ENT.cross - 2, ENT.land + 2, 3, 5) * Math.sin((g - ENT.cross) * 0.55);
  p = {...p, armR: mixArm(p.armR, {a: 8 + 18 * swing, b: 12}, win(g, ENT.cross - 2, ENT.land + 2, 3, 6)), bob: 7 * bell(g, ENT.step + 2, 5) + 7 * bell(g, ENT.step + 8, 5)};
  // landing on the mark: knee bob and an open "ta-da"
  p = {...p, bob: (p.bob ?? 0) + 8 * bell(g, ENT.land, 6) - 3 * bell(g, ENT.land + 6, 6)};
  const tada = win(g, ENT.land - 2, K.why - 2, 6, 6);
  p = mixPose(p, P({...p, armR: R(150, -350), mouth: 'grin', brows: 0.8, lookY: 0}), tada);

  // "why guess at all?" — the finger goes up, brows lift
  const finger = win(g, K.why - 3, K.why2 - 6, 7, 8);
  p = mixPose(p, P({...p, armR: R(96, -430, -1), mouth: 'o', brows: 1, tilt: -3 + 4 * tw(g, K.all, 8), lookX: 0.05}), finger);
  // "Why not just say I don't know?" — a live palms-up shrug, shoulders bounce on "know", a glance up at the rig
  const shrug = win(g, K.why2 - 4, K.researchers - 6, 8, 8);
  const bounce = bell(g, K.know - 2, 8);
  const weigh = Math.sin((g - K.why2) * 0.2) * tw(g, K.why2 + 4, 10);
  // palms up at waist height, elbows tucked; the hands weigh the two options against each other
  p = mixPose(p, P({...p, armL: L(-152, -226 - 16 * bounce - 14 * weigh), armR: R(152, -226 - 16 * bounce + 14 * weigh), mouth: 'hmm', brows: 1, tilt: 5 * weigh + 2, lean: -1.5 * weigh, lookX: 0.15 * weigh}), shrug);
  p = {...p, bob: (p.bob ?? 0) - 6 * bounce};
  p = mixPose(p, P({...p, lookY: -0.85, lookX: -0.15}), win(g, K.know + 10, K.researchers, 5, 4));
  // "The researchers" — points up at the rig; looks up as the board drops in
  const pointUp = win(g, K.researchers - 4, K.part, 8, 8);
  p = mixPose(p, P({...p, armR: R(60, -620), mouth: 'o', brows: 0.9, lookY: -0.9, lookX: -0.1, tilt: -3}), pointUp);
  p = {...p, bob: (p.bob ?? 0) + 4 * bell(g, BOARD_HIT, 6)};
  // "part of the answer" — presents the board with an open palm, nods
  const present = win(g, K.part - 2, K.how + 2, 8, 8);
  p = mixPose(p, P({...p, armR: R(170, -440, -1), mouth: 'grin', brows: 0.6, lookY: -0.2, lookX: 0.1, tilt: 2}), present);
  p = {...p, bob: (p.bob ?? 0) + hop(g, K.answer, -4, 8)};
  // "how models get graded." — reads his cue cards, then back to camera, brows up
  const read = win(g, K.how, K.graded - 2, 6, 6);
  p = mixPose(p, P({...p, armL: L(-96, -300), lookX: -0.55, lookY: 0.75, mouth: 'flat', brows: 0.2, tilt: -4}), read);
  p = mixPose(p, P({...p, lookX: 0.1, lookY: -0.6, brows: 0.8, mouth: 'smile'}), win(g, K.graded - 2, K.picture - 2, 5, 6));

  // "Picture a ten-question quiz." — fans the ten cue cards out at his side
  const fanArm = win(g, K.picture - 2, FAN.close + 6, 8, 8);
  p = mixPose(p, P({...p, armL: L(-170, -330, -1), armR: R(165, -255), lookX: -0.6, lookY: -0.3, mouth: 'grin', brows: 0.8}), fanArm);
  const fan = tw(g, FAN.open, 12, E.back) * (1 - tw(g, FAN.close, 6, E.inOut));

  // the three rule cards: point and snap; one point (nod); zero (flat sweep); also zero (wag between the zeros)
  const target = (i: number) => cardCentre(i);
  const pointAt = (side: -1 | 1, i: number) => {
    const t = target(i);
    const far = {x: HOST.x + (t.x - HOST.x) * 3, y: y + (t.y - y) * 3};
    return reach(ch, side, far.x, far.y);
  };
  const p0 = win(g, FLIP[0] - 6, VAL[0] - 4, 6, 8);
  p = mixPose(p, P({...p, armL: pointAt(-1, 0), lookX: -0.7, lookY: -0.9, mouth: 'o', brows: 0.9}), p0);
  const nod1 = win(g, VAL[0] - 4, FLIP[1] - 8, 6, 6);
  p = mixPose(p, P({...p, armR: R(150, -305, -1), mouth: 'grin', brows: 0.7, lookX: 0, lookY: -0.1}), nod1);
  p = {...p, bob: (p.bob ?? 0) + hop(g, VAL[0] + 2, -5, 9)};
  const p1 = win(g, FLIP[1] - 6, VAL[1] - 3, 6, 6);
  p = mixPose(p, P({...p, armR: pointAt(1, 1), lookX: -0.1, lookY: -1, mouth: 'o', brows: 0.9}), p1);
  // "...answer:" — still pointing, he turns to camera with a slow little head-shake (the zero is coming)
  const tsk = win(g, K.wrong + 9, VAL[1] - 4, 5, 5);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.02, mouth: 'hmm', brows: 0.9, tilt: 4 * Math.sin((g - K.wrong) * 0.45)}), tsk * p1);
  const sweep = win(g, VAL[1] - 3, FLIP[2] - 7, 6, 6);
  const sw = tw(g, VAL[1], 12, E.inOut);
  p = mixPose(p, P({...p, armR: R(60 + 110 * sw, -300, -1), mouth: 'flat', brows: -0.2, lookX: 0.1, lookY: 0, tilt: 3}), sweep);
  const p2 = win(g, FLIP[2] - 6, K.also - 2, 6, 6);
  p = mixPose(p, P({...p, armR: pointAt(1, 2), lookX: 0.6, lookY: -0.9, mouth: 'o', brows: 0.8}), p2);
  // "...know":" — his eyes dart back to the Wrong card's 0 and return: the two will match
  p = mixPose(p, P({...p, lookX: -0.35, lookY: -1, brows: 1}), win(g, K.idk2 + 13, K.idk2 + 24, 3, 3) * p2);
  p = {...p, bob: (p.bob ?? 0) + hop(g, K.idk2 + 26, -3, 7)};
  const wag = win(g, K.also - 2, FLY_OUT - 2, 6, 6);
  const wx = Math.sin((g - K.also) * 0.42);
  p = mixPose(p, P({...p, armR: R(120 + 26 * wx, -470), lookX: 0.3 + 0.25 * wx, lookY: -0.85, mouth: 'hmm', brows: 1, tilt: 4}), wag);

  // "Two contestants." — opens both arms to the wings as the podiums roll in
  const wings = win(g, FLY_OUT - 2, K.both - 4, 8, 8);
  p = mixPose(p, P({...p, armL: L(-165, -250), armR: R(165, -250), mouth: 'grin', brows: 0.8, lookX: -0.7 + 1.4 * tw(g, ROLL[1] + 6, 10, E.inOut), lookY: 0}), wings);

  // six quick rounds: reads, flips, glances left and right
  const rounds = win(g, K.both - 4, K.honest - 4, 6, 8);
  const side = Math.floor((g - ROUND[0] + 4) / 3.7) % 2 === 0 ? -0.7 : 0.7;
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(92, -180), lookX: side, lookY: 0.15, mouth: 'smile', brows: 0.4}), rounds);
  p = {...p, bob: (p.bob ?? 0) + ROUND.reduce((s, r) => s + 2 * bell(g, r - 2, 5), 0)};

  // the honest player: reads Q7–Q10 at him, a small shrug after each pass; "Six points." points at the score
  const toH = win(g, K.honest - 4, LOCK - 4, 8, 6);
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(92, -180), lookX: -0.85, lookY: 0.05, mouth: 'smile', brows: 0.3, lean: -2}), toH);
  p = {...p, bob: (p.bob ?? 0) + PASS.reduce((s, f) => s - 3 * bell(g, f + 2, 7), 0)};
  const pointH = win(g, LOCK - 4, K.guesser - 8, 6, 8);
  p = mixPose(p, P({...p, armL: reach({...ch, bob: p.bob}, -1, HON.x - 200, 1400), lookX: -0.9, lookY: 0.55, mouth: 'grin', brows: 0.5, lean: -2}), pointH);

  // the guesser: reads, gets buzzed before he finishes — head snaps at each slam
  const toG = win(g, K.guesser - 8, K.options - 4, 8, 6);
  const startle = SLAM.reduce((s, f) => s + bell(g, f, 7), 0);
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(92, -180), lookX: 0.85, lookY: 0.05, mouth: startle > 0.3 ? 'o' : 'flat', brows: 0.3 + 0.7 * clamp(startle, 0, 1), lean: 2}), toG);
  p = {...p, bob: (p.bob ?? 0) - 5 * clamp(startle, 0, 1)};
  // "Four options each," — presents the options sign that dropped in above
  const showOpt = win(g, K.options - 4, K.so + 2, 8, 8);
  p = mixPose(p, P({...p, armR: R(160, -430, -1), lookX: 0.7, lookY: -0.8, mouth: 'grin', brows: 0.8}), showOpt);
  // results: winces at each buzz, leans in for the last reel
  const res = win(g, K.so, DING - 1, 6, 3);
  const wince = JUDGE.slice(0, 3).reduce((s, f) => s + bell(g, f, 10), 0);
  p = mixPose(p, P({...p, armR: R(92, -180), lookX: 0.85, lookY: 0.2, mouth: wince > 0.4 ? 'frown' : 'flat', brows: -0.2 + 0.6 * clamp(wince, 0, 1), lean: 3 * tw(g, JUDGE[2] + 4, 10)}), res);
  if (wince > 0.5 && g < JUDGE[2] + 8) p = {...p, blink: 0.25};
  // the DING: startled, then two deadpan claps (both hands in front)
  const clapW = win(g, DING + 6, SEVEN - 2, 5, 6);
  const clapK = bell(g, DING + 12, 6) + bell(g, DING + 20, 6);
  p = mixPose(p, P({...p, armL: L(-34 - 44 * (1 - clapK), -205, -1), armR: R(30 + 44 * (1 - clapK), -205, -1), lookX: 0.3, lookY: 0, mouth: 'flat', brows: -0.1, lean: 0}), clapW);
  p = {...p, bob: (p.bob ?? 0) - 7 * bell(g, DING, 6)};
  // "Seven points." — points at the guesser's 7, deadpan
  const pointG = win(g, SEVEN - 4, K.lucky1 - 2, 6, 8);
  p = mixPose(p, P({...p, armR: reach({...ch, bob: p.bob}, 1, GUE.x + 300, 1420), armL: L(-118, -232), lookX: 0.9, lookY: 0.5, mouth: 'flat', brows: -0.1}), pointG);

  // s24 — hands folded on the cue cards; glances at the ✕ tiles; "Somehow," turns to camera, one brow up
  const fold = win(g, K.lucky1 - 2, K.now25 + 4, 8, 8);
  p = mixPose(p, P({...p, armL: L(-112, -228), armR: R(92, -175), lookX: 0.4, lookY: 0.1, mouth: 'flat', brows: 0}), fold);
  p = mixPose(p, P({...p, lookX: 0.95, lookY: -0.2}), win(g, K.three + 2, K.somehow - 6, 5, 5));
  const dead = win(g, K.somehow - 2, K.now25, 6, 6);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.02, browAsym: 1, brows: -0.15, mouth: 'flat', tilt: -4}), dead);
  // eyes flick up to the descending trophy and back
  p = mixPose(p, P({...p, lookX: 0.7, lookY: -0.7}), win(g, TRO.lower + 6, TRO.land + 2, 4, 6));
  if (dead > 0.5 && g >= TRO.land + 14 && g < TRO.land + 26) p = {...p, blink: g < TRO.land + 20 ? 0.1 : 0.5};

  // s25 — plucks the top cue card (it is a −1), shows it, winds up and throws it at the Wrong card
  const pluck = win(g, MINUS.pluck - 4, MINUS.show, 6, 6);
  p = mixPose(p, P({...p, armL: L(-50, -196, -1), armR: R(8, -214, -1), lookX: -0.3, lookY: 0.75, mouth: 'smirk', brows: 0.6}), pluck);
  const show = win(g, MINUS.show, MINUS.wind, 6, 4);
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(130, -410, -1), lookX: 0, lookY: 0, mouth: 'smirk', brows: 0.8, browAsym: 0.6}), show);
  const wind = win(g, MINUS.wind, MINUS.release, 4, 1);
  // an underhand toss: the card swings down by his thigh (a little knee dip), then straight up at the Wrong card overhead
  p = mixPose(p, P({...p, armR: R(78, -138), lookX: 0.1, lookY: -0.85, mouth: 'flat', brows: 0.3, lean: 2}), wind);
  p = {...p, bob: (p.bob ?? 0) + 8 * wind};
  const thrown = win(g, MINUS.release - 1, K.point25 + 2, 2, 8);
  p = mixPose(p, P({...p, armR: R(70, -560), lookX: 0.1, lookY: -0.95, mouth: g >= MINUS.hit ? 'grin' : 'o', brows: 0.8, lean: -2}), thrown);
  p = {...p, bob: (p.bob ?? 0) + hop(g, MINUS.hit + 1, -6, 8)};
  // presents the honest player, then the guesser; deadpan on "Four."
  const presH = win(g, K.honest25 - 4, K.guesser25 - 4, 8, 8);
  p = mixPose(p, P({...p, armL: L(-160, -232), armR: R(92, -180), lookX: -0.8, lookY: 0.2, mouth: 'smile', brows: 0.4, lean: -1}), presH);
  p = {...p, bob: (p.bob ?? 0) + hop(g, K.six25, -4, 8)};
  const presG = win(g, K.guesser25 - 4, TW.off - 8, 8, 8); // the hand is back at his side before the trophy hops down past him
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(110, -245), lookX: 0.75, lookY: -0.35, mouth: 'flat', brows: 0.2, lean: 1}), presG);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0, browAsym: 0.8, mouth: 'flat'}), win(g, K.four25 + 2, TW.off - 2, 5, 5));
  // the trophy walks past his feet: he looks down at it, hops, then deadpans to camera
  const watchT = win(g, TW.off - 2, TW.land - 2, 6, 6);
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(60, -200), lean: -2, lookX: clamp((trophyX(g) - HOST.x) / 260, -1, 1), lookY: 0.85, mouth: 'o', brows: 0.8}), watchT);
  p = {...p, bob: (p.bob ?? 0) - 22 * bell(g, HOST_HOP, 11)};
  p = mixPose(p, P({...p, armL: L(-118, -232), armR: R(92, -180), lookX: 0, lookY: 0.02, mouth: 'smirk', browAsym: 1, brows: 0}), tw(g, TW.land - 2, 8));

  // precise actions get less idle drift
  if (g >= MINUS.wind && g < MINUS.hit) life = 0.3;
  const rFront = (g >= DING + 6 && g < SEVEN) || (g >= MINUS.pluck - 4 && g < K.point25 + 10);
  const clip = g < ENT.cross ? 1 : 0;
  const tile = g >= MINUS.pluck && g < MINUS.release ? 1 : 0;
  return {x: HOST.x, y, scale, pose: p, life, fan, flip: cueFlip(g), rFront, clip, tile};
};

const slitOpen = (g: number) => sp(g, ENT.open, SNAP) * (1 - tw(g, ENT.cross + 1, 10, E.inOut));
const trophyX = (g: number) => trophyState(g)?.x ?? TROPHY_G.x;

/* ------------------------------------------------------------------ contestants */
type ContState = {x: number; pose: Pose; life: number};
const honestState = (g: number): ContState => {
  const x = rollX(g, 0);
  const ch = {x, y: HON.y, scale: HON.scale};
  const restL = {x: x - 80, y: POD.lidY - 4};
  const restR = {x: x + 94, y: POD.lidY - 4};
  const buzz = {x: BUZZ_X[0] - HON.x + x, y: BUZZ_Y};
  const roundsHand = slapHand(g, ROUND, restL, buzz, 46);
  let p = P({mouth: 'smile', brows: 0.2, lookX: 0.4, lookY: 0.05});
  // rolling in: leans against the motion, lurches on the stop
  const v = rollVel(g, 0);
  p = {...p, lean: clamp(-0.22 * v, -8, 8) + 5 * ring(g, ROLL[0] + ROLL_DUR - 6, 0.6, 0.18)};
  let bob = 0;
  let armL = reach({...ch, bob}, -1, roundsHand.x, roundsHand.y, -1);
  let armR = reach({...ch, bob}, 1, restR.x, restR.y, -1);
  // a small polite wave on arrival
  const wave = win(g, ROLL[0] + ROLL_DUR + 2, K.both - 8, 6, 6);
  armL = mixArm(armL, reach(ch, -1, x - 110 + 14 * Math.sin((g - ROLL[0]) * 0.6), HON.y - 0.95 * 430), wave);
  p = mixPose(p, P({...p, lookX: 0.1, lookY: 0, mouth: 'smile', brows: 0.5}), wave);
  // the rounds: looks at the host, small grin with each ✓
  p = mixPose(p, P({...p, lookX: 0.8, lookY: 0.05, mouth: 'smile', brows: 0.3}), win(g, K.both - 6, K.honest - 2, 6, 6));
  // the four he doesn't know: hands off the buzzer, palms out, head shake each time
  const pass = win(g, PASS[0] - 8, LOCK - 2, 6, 6);
  const shake = PASS.reduce((s, f) => s + Math.sin((g - f + 4) * 0.9) * bell(g, f - 4, 12), 0);
  const lift = PASS.reduce((s, f) => s + 22 * bell(g, f - 5, 12), 0);
  armL = mixArm(armL, reachLocal(-128, -214 - lift, -1, -1), pass);
  armR = mixArm(armR, reachLocal(128, -214 - lift, 1, -1), pass);
  p = mixPose(p, P({...p, lookX: 0.55, lookY: 0.05, mouth: 'flat', brows: 0.55, tilt: 6 * shake}), pass);
  // "Six points." — satisfied nod, hands back on the lid
  bob += 5 * bell(g, LOCK + 2, 9);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.05, mouth: 'smile', brows: 0.3}), win(g, LOCK, K.guesser - 4, 5, 8));
  // s23: watches the guesser; small sympathetic winces; startled by the DING; flat look at the 7 then at camera
  p = mixPose(p, P({...p, lookX: 0.9, lookY: 0.05, mouth: 'smile', brows: 0.2}), win(g, K.guesser - 4, SEVEN + 8, 8, 6));
  const symp = JUDGE.slice(0, 3).reduce((s, f) => s + bell(g, f, 10), 0);
  p = {...p, brows: p.brows + 0.5 * symp};
  p = mixPose(p, P({...p, lookX: 0.6, lookY: -0.5, mouth: 'o', brows: 0.9}), win(g, DING + 2, SEVEN - 4, 4, 6));
  p = mixPose(p, P({...p, lookX: 0.95, lookY: 0.45, mouth: 'flat', brows: 0}), win(g, SEVEN - 2, SEVEN + 12, 5, 6));
  // s24: flat; eyes follow the trophy down; slow blink; eyes slide to camera
  p = mixPose(p, P({...p, lookX: 0.1, lookY: 0.05, mouth: 'flat', brows: -0.1}), win(g, SEVEN + 10, K.now25 + 6, 8, 8));
  const tr = trophyState(g);
  const follow = win(g, TRO.lower + 3, TRO.land + 8, 6, 6);
  if (follow > 0 && tr) p = mixPose(p, P({...p, lookX: 1, lookY: clamp((tr.y - 560) / 300, -1, 0.6)}), follow);
  if (g >= TRO.land + 10 && g < TRO.land + 22) p = {...p, blink: g < TRO.land + 16 ? 0.15 : 0.45};
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.02}), win(g, TRO.land + 24, K.now25 + 4, 4, 6));
  // s25: looks up at the board; "still six" smiles and lifts a hand; watches the guesser's sums
  p = mixPose(p, P({...p, lookX: 0.4, lookY: -0.9, mouth: 'flat', brows: 0.4}), win(g, BOARD_BACK - 6, K.honest25 - 2, 6, 6));
  const still = win(g, K.honest25 - 2, K.guesser25 - 2, 6, 8);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0, mouth: 'grin', brows: 0.6}), still);
  // "still six": a small raised hand on his outer side (clear of the host, who presents him)
  armL = mixArm(armL, reach(ch, -1, x - 120, HON.y - 0.95 * 400), win(g, K.still - 4, K.guesser25 - 4, 6, 8));
  bob += 4 * bell(g, K.six25, 9);
  p = mixPose(p, P({...p, lookX: 0.9, lookY: 0, mouth: 'smile', brows: 0.3}), win(g, K.guesser25 - 2, TW.off - 2, 6, 6));
  // the trophy comes to him: eyes track it, then a grin with both arms up; then a hand on it
  const tx = tr ? tr.x : TROPHY_G.x;
  p = mixPose(p, P({...p, lookX: clamp((tx - x) / 300, -1, 1), lookY: 0.6, mouth: 'o', brows: 0.9}), win(g, TW.off - 2, TW.land, 5, 3));
  const cheer = win(g, TW.land, TW.land + 22, 3, 8);
  armL = mixArm(armL, reach(ch, -1, x - 140, HON.y - 0.95 * 560), cheer);
  armR = mixArm(armR, reach(ch, 1, x + 140, HON.y - 0.95 * 560), cheer);
  p = mixPose(p, P({...p, lookX: 0.1, lookY: -0.2, mouth: 'grin', brows: 1}), tw(g, TW.land, 4));
  bob += -10 * bell(g, TW.land + 1, 10);
  armR = mixArm(armR, reach({...ch, bob}, 1, TROPHY_H.x - 22, TROPHY_H.y - 68), tw(g, TW.land + 20, 6));
  p = {...p, armL, armR, bob: (p.bob ?? 0) + bob};
  const life = roundsHand.active > 0.5 ? 0.35 : 0.8;
  return {x, pose: p, life};
};

const guesserState = (g: number): ContState => {
  const x = rollX(g, 1);
  const ch = {x, y: GUE.y, scale: GUE.scale};
  const restR = {x: x + 80, y: POD.lidY - 4};
  const restL = {x: x - 94, y: POD.lidY - 4};
  const buzz = {x: BUZZ_X[1] - GUE.x + x, y: BUZZ_Y};
  const rounds = slapHand(g, ROUND.map((r) => r + 2), restR, buzz, 46);
  const slams = slapHand(g, SLAM, restR, buzz, 90);
  let p = P({mouth: 'grin', brows: 0.5, lookX: -0.4, lookY: 0.05, browAsym: 0.4});
  const v = rollVel(g, 1);
  p = {...p, lean: clamp(-0.22 * v, -8, 8) - 5 * ring(g, ROLL[1] + ROLL_DUR - 6, 0.6, 0.18)};
  let bob = 0;
  let hand = rounds.active > 0 ? rounds : slams;
  let armR = reach({...ch, bob}, 1, hand.x, hand.y, -1);
  let armL = reach({...ch, bob}, -1, restL.x, restL.y, -1);
  // finger-gun at the camera on arrival
  const gun = win(g, ROLL[1] + ROLL_DUR, K.both - 8, 5, 6);
  armR = mixArm(armR, reach(ch, 1, x + 175, GUE.y - 0.95 * 400 - 10 * bell(g, ROLL[1] + ROLL_DUR + 8, 6)), gun);
  p = mixPose(p, P({...p, lookX: 0, lookY: 0, mouth: 'grin', brows: 0.8, browAsym: 0.9, tilt: -5}), gun);
  // rounds
  p = mixPose(p, P({...p, lookX: -0.8, lookY: 0.05, mouth: 'grin', brows: 0.4}), win(g, K.both - 6, K.honest - 2, 6, 6));
  // while the honest one passes: the finger hovers twitchily over his buzzer, eyebrows up
  const itch = win(g, K.honest, LOCK + 10, 8, 6);
  armR = mixArm(armR, reach(ch, 1, buzz.x + 4 * Math.sin(g * 1.7), buzz.y - 34 - 8 * Math.abs(Math.sin(g * 0.9))), itch);
  p = mixPose(p, P({...p, lookX: -0.9 + 0.5 * (Math.floor(g / 13) % 2), lookY: 0.15, mouth: 'smirk', brows: 1, browAsym: 0.6}), itch);
  // cocks his hand back before the shots
  const cock = win(g, LOCK + 8, SLAM[0] - 7, 6, 3);
  armR = mixArm(armR, reach(ch, 1, x + 150, GUE.y - 0.95 * 420), cock);
  p = mixPose(p, P({...p, lookX: -0.2, lookY: 0.1, mouth: 'grin', brows: 1, browAsym: 0.8}), cock);
  // the four slams (the slam hand is already in `hand` when the slams are active)
  const slamming = win(g, SLAM[0] - 8, SLAM[3] + 6, 3, 6);
  p = mixPose(p, P({...p, lookX: 0.35, lookY: 0.4, mouth: 'grin', brows: 1, browAsym: 0}), slamming);
  bob += SLAM.reduce((s, f) => s + 6 * bell(g, f - 1, 6), 0);
  // reels spinning: rubs his hands, watches his panel; looks at the options sign
  const rub = win(g, SLAM[3] + 6, K.so - 2, 6, 6);
  armL = mixArm(armL, reach(ch, -1, x - 36 + 10 * Math.sin(g * 1.1), GUE.y - 0.95 * 250, -1), rub);
  armR = mixArm(armR, reach(ch, 1, x + 36 - 10 * Math.sin(g * 1.1), GUE.y - 0.95 * 250, -1), rub);
  p = mixPose(p, P({...p, lookX: 0.9, lookY: -0.1, mouth: 'grin', brows: 0.9}), rub);
  p = mixPose(p, P({...p, lookX: -0.7, lookY: -0.75}), win(g, OPT_LAND - 4, K.so - 4, 5, 5));
  // results: escalating winces; leaning in for the last reel, hands clasped
  const res = win(g, K.so - 2, DING, 4, 2);
  p = mixPose(p, P({...p, lookX: 0.9, lookY: 0.05, mouth: 'grin', brows: 0.6}), res);
  const w = JUDGE.slice(0, 3).map((f) => tw(g, f, 3) * (1 - tw(g, f + 9, 5)));
  p = mixPose(p, P({...p, mouth: 'flat', brows: -0.3, tilt: 4, lookX: 0.9}), w[0]);
  p = mixPose(p, P({...p, mouth: 'frown', brows: -0.5, tilt: 6, blink: 0.45, lookX: 0.9}), w[1]);
  p = mixPose(p, P({...p, mouth: 'frown', brows: -0.6, tilt: 8, blink: 0.08, lean: 4}), w[2]);
  bob += 4 * w[0] + 7 * w[1] + 10 * w[2];
  const lean = win(g, JUDGE[2] + 8, DING, 5, 2);
  armL = mixArm(armL, reach(ch, -1, x - 24, GUE.y - 0.95 * 268, -1), lean);
  armR = mixArm(armR, reach(ch, 1, x + 24, GUE.y - 0.95 * 268, -1), lean);
  p = mixPose(p, P({...p, mouth: 'o', brows: 1, lookX: 0.95, lookY: 0, lean: 5, blink: 1}), lean);
  // "lands." — crouch, leap, land; arms up; fist pumps; "Seven points." — blows kisses / bows
  const crouch = 12 * bell(g, DING, 6);
  const leap = -46 * bell(g, DING + 4, 13);
  const land = 8 * bell(g, DING + 16, 6);
  bob += crouch + leap + land;
  const joy = win(g, DING + 2, K.lucky1 + 10, 4, 8);
  const pump = Math.sin((g - DING) * 0.55);
  armL = mixArm(armL, reach({...ch, bob}, -1, x - 120, GUE.y - 0.95 * (540 + 30 * pump)), joy);
  armR = mixArm(armR, reach({...ch, bob}, 1, x + 120, GUE.y - 0.95 * (540 - 30 * pump)), joy);
  p = mixPose(p, P({...p, mouth: 'grin', brows: 1, lookX: 0, lookY: -0.3, lean: 0, tilt: 4 * pump, blink: undefined}), joy);
  // s24: waves to the crowd
  const crowd = win(g, K.lucky1 + 4, K.somehow - 4, 6, 6);
  armR = mixArm(armR, reach(ch, 1, x + 150 + 22 * Math.sin((g - K.lucky1) * 0.4), GUE.y - 0.95 * 470), crowd);
  armL = mixArm(armL, reach(ch, -1, restL.x, restL.y, -1), crowd);
  p = mixPose(p, P({...p, mouth: 'grin', brows: 0.8, lookX: -0.1, lookY: 0, tilt: -3}), crowd);
  // s25 body bobs (summed here, before any contact below, so hands on the lid stay put)
  bob += 5 * bell(g, K.guesser25 + 4, 8);
  bob += MINUS_FLY.reduce((s, m) => s + 4 * bell(g, m.arrive, 6), 0);
  const defl = tw(g, K.four25 + 1, 12, E.out);
  bob += 12 * defl;
  // the trophy is lowered: hands clasped under his chin, eyes on it all the way down (the trophy stays unobstructed)
  const tr = trophyState(g);
  const recv = win(g, TRO.lower + 3, TRO.land + 1, 6, 3);
  const clasp = 3 * Math.sin(g * 0.9);
  armL = mixArm(armL, reach(ch, -1, x - 14, GUE.y - 0.95 * 250 + clasp, 1), recv);
  armR = mixArm(armR, reach(ch, 1, x + 14, GUE.y - 0.95 * 250 + clasp, 1), recv);
  p = mixPose(p, P({...p, lookX: -0.8, lookY: tr ? clamp((tr.y - 120 - 560) / 260, -1, 0.5) : -0.8, mouth: 'o', brows: 1, tilt: -2}), recv);
  // the clank: he snuggles up to it (leans in, head tilted), the near hand on the lid beside it, the far hand polishing
  // the cup in small circles below his chin; through s25 the near hand stays on the lid by his prize
  const snug = win(g, TRO.land + 2, BOARD_BACK - 2, 4, 8);
  const snugLean = -6 * snug;
  const chL = {...ch, bob};
  const hug = win(g, TRO.land + 1, TW.off, 3, 3);
  armL = mixArm(armL, reachLean(chL, -1, TROPHY_G.x + 62, TROPHY_G.y - 4, snugLean + 5 * defl), hug);
  const polish = win(g, TRO.land + 5, BOARD_BACK - 4, 4, 6);
  const ph = (g - TRO.land) * 0.75;
  armR = mixArm(armR, reachLean(chL, 1, TROPHY_G.x + 48 + 8 * Math.sin(ph), TROPHY_G.y - 62 + 7 * Math.cos(ph), snugLean), polish);
  p = mixPose(p, P({...p, lookX: -0.6, lookY: 0.45, mouth: 'grin', brows: 0.6, blink: 0.3, tilt: -9}), snug);
  p = {...p, lean: p.lean + snugLean};
  // s25: looks up at the board; the grin drops at "a point."; worried; flinches at each −1; deflates on "Four."
  p = mixPose(p, P({...p, lookX: -0.5, lookY: -0.9, mouth: 'grin', brows: 0.5, blink: undefined}), win(g, BOARD_BACK - 6, K.point25 - 2, 6, 4));
  p = mixPose(p, P({...p, lookX: -0.3, lookY: -0.6, mouth: 'o', brows: 1}), win(g, MINUS.hit, K.point25 + 4, 2, 6));
  p = mixPose(p, P({...p, lookX: -0.85, lookY: 0.3, mouth: 'flat', brows: 0.7}), win(g, K.point25, K.guesser25, 6, 6));
  p = mixPose(p, P({...p, lookX: 0.9, lookY: 0, mouth: 'flat', brows: 0.6}), win(g, K.guesser25, K.four25, 6, 4));
  p = mixPose(p, P({...p, lookX: 0, lookY: 0.1, mouth: 'o', brows: 1}), win(g, K.guesser25 + 2, K.sixG - 4, 4, 6));
  p = mixPose(p, P({...p, mouth: 'smile'}), win(g, PLUS_FLY.arrive, K.minus + 2, 3, 3));
  // the last −1 hangs over his window: he stares down at it, trembling
  const dread = win(g, MINUS_FLY[2].hover! - 3, K.four25, 4, 2);
  p = mixPose(p, P({...p, lookX: -0.15, lookY: 0.85, mouth: 'o', brows: 1, tilt: 2 * Math.sin(g * 2.3)}), dread);
  p = mixPose(p, P({...p, mouth: 'frown', brows: -0.3, lookX: -0.2, lookY: 0.6, tilt: 9, lean: 5}), defl);
  // the trophy leaves: a hand reaches after it
  const after = win(g, TW.off, TW.land + 6, 4, 10);
  const tt = tr ?? {x: TROPHY_G.x, y: TROPHY_G.y};
  const shX = x - 66 * GUE.scale;
  const shY = GUE.y + (bob - 292) * GUE.scale;
  const toT = {x: tt.x - shX, y: tt.y - 60 - shY};
  const dT = Math.hypot(toT.x, toT.y) || 1;
  armL = mixArm(armL, reach({...ch, bob}, -1, shX + (toT.x / dT) * 150, shY + (toT.y / dT) * 150), after);
  p = mixPose(p, P({...p, lookX: -1, lookY: 0.5, mouth: 'o', brows: 0.9, tilt: 3}), after);
  armL = mixArm(armL, reach({...ch, bob}, -1, restL.x, restL.y, -1), tw(g, TW.land + 6, 10));
  p = mixPose(p, P({...p, lookX: -0.8, lookY: 0.2, mouth: 'frown', brows: -0.4, tilt: 7, lean: 4}), tw(g, TW.land + 4, 10));
  if (rounds.active > 0 || slams.active > 0) hand = rounds.active > slams.active ? rounds : slams;
  p = {...p, armL, armR, bob: (p.bob ?? 0) + bob};
  const life = rounds.active > 0.5 || slams.active > 0.5 ? 0.25 : 0.85;
  return {x, pose: p, life};
};

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
const crawlTicks = (() => {
  const out: number[] = [];
  let prev = Math.floor(reelOf(LAND[3] - 34, 3).p);
  for (let f = LAND[3] - 33; f <= LAND[3]; f++) {
    const n = Math.floor(reelOf(f, 3).p + 1e-6);
    if (n !== prev && f > JUDGE[2] + 1) out.push(f);
    prev = n;
  }
  return out;
})();

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_gameshow', dur: (K.last - K.start) / 30},
  {f: ENT.bulge + 2, kind: 'paper_flap', gain: -12, note: 'the curtain bulges (someone behind it)'},
  {f: ENT.open, kind: 'whoosh_soft', gain: -10, note: 'the host pushes the curtain open'},
  {f: ENT.step + 2, kind: 'thud_soft', gain: -14, note: 'footstep'},
  {f: ENT.step + 8, kind: 'thud_soft', gain: -14, pitch: -1},
  {f: ENT.land, kind: 'thud_soft', gain: -10, pitch: -2},
  ...LIGHTS.map((f, i) => ({f, kind: 'machine_clunk' as const, gain: -9 + i, pitch: -2 * i, note: 'stage lights bang on'})),
  {f: BOARD_START, kind: 'whoosh_soft', gain: -16, note: 'the board is winched down from the flies'},
  {f: BOARD_HIT, kind: 'hanger_click', note: 'the board bottoms out on its cables'},
  {f: BOARD_HIT + 1, kind: 'thud_soft', gain: -10},
  {f: BOARD_HIT + 9, kind: 'hanger_click', gain: -9, pitch: 2},
  {f: TAG_LAND[0], kind: 'hanger_click', gain: -5, pitch: 4, note: 'citation tag clips on'},
  {f: K.how + 6, kind: 'card_flick', gain: -12, note: 'cue card'},
  ...[0, 1, 2].map((k) => ({f: K.graded + k * 4, kind: 'pop_tick' as const, gain: -13, pitch: k * 2, note: 'card backs wobble'})),
  {f: FAN.open, kind: 'card_flick', gain: -6, note: 'ten cue cards fanned'},
  {f: FAN.open + 4, kind: 'card_flick', gain: -9, pitch: 2},
  {f: TAG_LAND[1], kind: 'hanger_click', gain: -7, pitch: 3, note: 'guard-rail tag'},
  {f: FAN.close, kind: 'card_flick', gain: -10, pitch: -2},
  ...FLIP.flatMap((f, i) => [
    {f: f - 1, kind: 'pop_tick' as const, gain: -5, note: 'finger snap'},
    {f: f + 2, kind: 'card_flick' as const, pitch: i, note: 'rule card flips'},
  ]),
  {f: VAL[0], kind: 'indicator_yes', note: '+1'},
  {f: VAL[1], kind: 'indicator_no', gain: -3, note: '0'},
  {f: VAL[2], kind: 'indicator_no', gain: -3, pitch: -1, note: '0'},
  {f: ZEROS, kind: 'pop_tick', gain: -6, note: 'the two zeros bounce together'},
  {f: ZEROS + 2, kind: 'pop_tick', gain: -6, pitch: 2},
  {f: FLY_OUT, kind: 'hanger_click', gain: -9, pitch: -3, note: 'the board flies out'},
  {f: ROLL[0], kind: 'conveyor_run', gain: -12, dur: 0.9, note: 'podium casters'},
  {f: ROLL[0] + ROLL_DUR - 6, kind: 'machine_clunk', gain: -4, note: 'honest podium stops'},
  {f: ROLL[1] + ROLL_DUR - 6, kind: 'machine_clunk', gain: -4, pitch: -2, note: 'guesser podium stops'},
  {f: ROLL[1] + ROLL_DUR - 2, kind: 'machine_clunk', gain: -14, pitch: 3, note: 'spotlights swing on'},
  ...PANEL_LAND.map((f, i) => ({f, kind: 'hanger_click' as const, gain: -6, pitch: i, note: 'answer panel drops in'})),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => ({f: Math.round(SLOT_LIGHT(k)), kind: 'pop_tick' as const, gain: -16, pitch: k, note: 'question slot lights'})),
  {f: ROLL[1] + ROLL_DUR + 8, kind: 'pop_tick', gain: -8, note: 'finger-gun'},
  ...ROUND.flatMap((r, k) => [
    {f: r, kind: 'thud_soft' as const, gain: -11, note: 'honest slaps his buzzer'},
    {f: r + 2, kind: 'thud_soft' as const, gain: -11, pitch: 2, note: 'guesser slaps his buzzer'},
    {f: r + 1, kind: 'ding_right' as const, gain: -13, pitch: k},
    {f: r + 3, kind: 'score_flip' as const, gain: -8, pitch: Math.round(k / 2)},
  ]),
  ...PASS.map((f, j) => ({f, kind: 'thud_soft' as const, gain: -7, pitch: -4 - (j % 2), note: 'pass: a soft felt "—"'})),
  {f: PASS[0] + 1, kind: 'chip_pop', gain: -6, note: '"I don\'t know." bubble'},
  {f: LOCK, kind: 'score_flip', gain: -3, note: 'honest score locks at 6'},
  {f: LOCK + 1, kind: 'indicator_yes', gain: -4, pitch: 2},
  ...SLAM.flatMap((f, j) => [
    {f, kind: 'thud_soft' as const, gain: 0, pitch: j, note: 'guesser slams his buzzer'},
    {f: f + 1, kind: 'prob_tick' as const, gain: -6, pitch: j, note: 'letter reel starts spinning'},
  ]),
  {f: OPT_LAND, kind: 'hanger_click', gain: -4, note: 'options sign drops in'},
  ...LAND.slice(0, 3).flatMap((f, j) => [
    {f: f - 4, kind: 'prob_tick' as const, gain: -9},
    {f: f - 1, kind: 'prob_tick' as const, gain: -7},
    {f: JUDGE[j], kind: 'buzzer_wrong' as const, gain: -1, pitch: -j, note: `Q${7 + j} wrong`},
    {f: JUDGE[j] + 3, kind: 'score_flip' as const, gain: -14, note: 'score twitches, no point'},
  ]),
  ...crawlTicks.map((f, i) => ({f, kind: 'prob_tick' as const, gain: Math.min(-3, -9 + i), pitch: -Math.round(i / 3), note: 'last reel crawls'})),
  {f: DING, kind: 'ding_right', gain: 2, note: 'Q10 lands: the lucky one'},
  {f: DING + 2, kind: 'fanfare_small', note: 'excessive celebration'},
  {f: DING + 2, kind: 'pop_tick', gain: 0, pitch: -4, note: 'confetti popper'},
  {f: DING + 4, kind: 'pop_tick', gain: -2, pitch: -6},
  {f: DING + 3, kind: 'crowd_cheer', dur: 2.2, gain: -4},
  {f: DING + 16, kind: 'thud_soft', gain: -9, note: 'guesser lands from his leap'},
  {f: SEVEN, kind: 'score_flip', note: '6 → 7'},
  {f: K.seven + 14, kind: 'hanger_click', gain: -10, pitch: -2, note: 'options sign flies out'},
  {f: CAPT.drop + 6, kind: 'paper_flap', gain: -5, note: 'caption scroll drops in'},
  {f: CAPT.drop + 7, kind: 'hanger_click', gain: -8},
  {f: K.lucky, kind: 'glint', gain: -6, note: 'the lucky tile sparkles'},
  {f: CAPT.l2, kind: 'paper_flap', gain: -8, pitch: 2, note: 'scroll unrolls a line'},
  {f: K.wrongs + 2, kind: 'buzzer_wrong', gain: -13, pitch: -3, note: 'three ✕ shake'},
  {f: K.wrongs + 6, kind: 'crowd_aww', gain: -8},
  {f: CAPT.l3a, kind: 'paper_flap', gain: -8, pitch: 4},
  {f: TRO.lower + 8, kind: 'glint', gain: -10, note: 'trophy lowered from the flies'},
  {f: TRO.release, kind: 'hanger_click', gain: -10, pitch: 3, note: 'the cable unhooks; the trophy drops the last few px'},
  {f: TRO.land, kind: 'trophy_clink', gain: 2, note: 'trophy lands on the guesser podium'},
  {f: TRO.land + 1, kind: 'crowd_cheer', dur: 1.0, gain: -10},
  {f: TRO.land + 9, kind: 'glint', gain: -8},
  {f: CAPT.out, kind: 'paper_swish', gain: -6, note: 'scroll flies out'},
  {f: BOARD_BACK, kind: 'thud_soft', gain: -7, note: 'board returns'},
  {f: BOARD_BACK + 1, kind: 'hanger_click', gain: -3},
  {f: MINUS.pluck, kind: 'card_flick', gain: -5, note: 'host plucks the top cue card'},
  {f: MINUS.show - 1, kind: 'card_flick', gain: -9, pitch: 3, note: 'turns it: −1'},
  {f: MINUS.release, kind: 'whoosh_soft', gain: -10, note: 'throw'},
  {f: MINUS.hit, kind: 'stamp_heavy', note: '−1 slaps onto the Wrong card'},
  {f: MINUS.hit + 1, kind: 'indicator_no', gain: -1, pitch: -5, note: 'low dun'},
  {f: MINUS.hit + 6, kind: 'hanger_click', gain: -8, pitch: -2, note: 'board chains swing'},
  {f: K.point25, kind: 'buzzer_wrong', gain: -12, pitch: -4, note: 'the three ✕ now cost'},
  {f: K.point25 + 1, kind: 'pop_tick', gain: -12, pitch: 5, note: 'sweat drop on the trophy'},
  ...[0, 1, 2, 3].map((j) => ({f: K.still - 6 + j * 4 + 3, kind: 'pop_tick' as const, gain: -14, pitch: j, note: 'blank shows 0'})),
  {f: K.six25, kind: 'indicator_yes', gain: -7, note: 'still six'},
  {f: STRIP.land, kind: 'hanger_click', gain: -7, note: 'equation strip drops in'},
  {f: K.sixG - 2, kind: 'glint', gain: -10, note: "the guesser's six ✓ glow"},
  {f: PLUS_FLY.launch, kind: 'chip_pop', gain: -4, note: '+1 hops from the lucky tile to the strip'},
  ...MINUS_FLY.map((m, j) => ({f: m.launch, kind: 'chip_pop' as const, gain: -6, pitch: -j, note: '−1 leaves a ✕ tile'})),
  {f: MINUS_FLY[0].arrive, kind: 'score_flip', pitch: -1, note: '7 → 6'},
  {f: MINUS_FLY[1].arrive, kind: 'score_flip', pitch: -3, note: '6 → 5'},
  {f: MINUS_FLY[2].arrive, kind: 'score_flip', gain: 2, pitch: -6, note: '5 → 4 (the hovering chip drops in on "Four.")'},
  {f: MINUS_FLY[2].arrive, kind: 'thud_soft', gain: -2, pitch: -3},
  ...[STRIP.t1, STRIP.t2, STRIP.t3].map((f, i) => ({f, kind: 'pop_tick' as const, gain: -10, pitch: i, note: 'equation term'})),
  {f: K.four25 + 1, kind: 'machine_clunk', gain: -6, note: 'the score window settles at 4'},
  {f: K.four25 + 4, kind: 'crowd_aww', gain: -7},
  {f: TW.eyes, kind: 'pop_tick', gain: -9, pitch: 6, note: 'the trophy opens its eyes'},
  {f: TW.feet, kind: 'chip_pop', gain: -3, pitch: 4, note: 'feet sprout (boing)'},
  {f: TW.floor, kind: 'trophy_clink', gain: -8, pitch: -2, note: 'hops down to the stage'},
  {f: TW.floor, kind: 'trophy_steps', dur: (TW.up - TW.floor) / 30},
  {f: TW.land, kind: 'trophy_clink', gain: 0, note: 'lands on the honest podium'},
  {f: TW.land + 2, kind: 'ding_right', gain: -8, pitch: 3},
  {f: TW.land + 3, kind: 'crowd_cheer', dur: 0.9, gain: -8},
  {f: TW.land + 10, kind: 'glint', gain: -8},
];

/* ------------------------------------------------------------------ overlays in the world */
const capFont = (px: number) => `600 ${px}px "Fredoka Variable"`;
const Caption: React.FC<{g: number}> = ({g}) => {
  if (g < CAPT.drop || g > CAPT.out + 16) return null;
  const dy = drop(g, CAPT.drop + 6, 420, 6) - 520 * tw(g, CAPT.out, 14, E.in);
  const lines = 1 + sp(g, CAPT.l2, SOFT) + sp(g, CAPT.l3a, SOFT);
  const h = 40 + CAP.line * lines;
  const swing = 0.8 * ring(g, CAPT.drop + 6, 0.45, 0.1) + 0.5 * ring(g, CAPT.l2, 0.5, 0.12) + 0.5 * ring(g, CAPT.l3a, 0.5, 0.12) + 0.6 * ring(g, CAPT.l3b, 0.6, 0.12);
  const size = 58;
  const wA = textWidth('Somehow, ', capFont(size));
  const wB = textWidth('a trophy.', capFont(size));
  const l3x = (CAP.w - wA - wB) / 2;
  const stampB = g >= CAPT.l3b ? sp(g, CAPT.l3b - 1, SNAP) : 0;
  const stamp2 = g >= CAPT.l2 ? sp(g, CAPT.l2 - 1, SNAP) : 0;
  return (
    <div style={{position: 'absolute', left: CAP.cx - CAP.w / 2, top: CAP.top + dy, width: CAP.w, transform: `rotate(${swing}deg)`, transformOrigin: '50% -300px'}}>
      <div style={{position: 'absolute', left: 90, top: -1200, width: 4, height: 1200, background: C.ink}} />
      <div style={{position: 'absolute', right: 90, top: -1200, width: 4, height: 1200, background: C.ink}} />
      <div style={{position: 'absolute', left: -14, right: -14, top: -10, height: 22, borderRadius: 11, background: C.woodDeep, border: `3px solid ${C.ink}`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 4, height: h, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderTop: 'none', boxShadow: `8px 10px 0 rgba(22,42,50,0.2)`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 18, textAlign: 'center', font: capFont(size), lineHeight: `${CAP.line}px`, color: C.ink, whiteSpace: 'nowrap'}}>One lucky guess.</div>
        {stamp2 > 0 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 18 + CAP.line, textAlign: 'center', font: capFont(size), lineHeight: `${CAP.line}px`, color: C.ink, whiteSpace: 'nowrap', transform: `scale(${lerp(1.25, 1, stamp2)})`}}>Three wrong answers.</div>
        )}
        {g >= CAPT.l3a && (
          <div style={{position: 'absolute', left: l3x, top: 18 + CAP.line * 2, font: capFont(size), lineHeight: `${CAP.line}px`, color: C.coralDeep, whiteSpace: 'pre'}}>Somehow, </div>
        )}
        {stampB > 0 && (
          <div style={{position: 'absolute', left: l3x + wA, top: 18 + CAP.line * 2, font: capFont(size), lineHeight: `${CAP.line}px`, color: C.coral, whiteSpace: 'nowrap', transform: `scale(${lerp(1.35, 1, stampB)})`, transformOrigin: '0% 60%'}}>a trophy.</div>
        )}
      </div>
      {/* bottom roller */}
      <div style={{position: 'absolute', left: -10, right: -10, top: 4 + h - 8, height: 20, borderRadius: 10, background: C.wood, border: `3px solid ${C.ink}`}} />
    </div>
  );
};

const eqFont = (px: number) => `700 ${px}px "JetBrains Mono"`;
const EQ_SIZE = 52;
const EQ_TERMS = [
  {t: '6', at: STRIP.t1, col: C.white},
  {t: ' + 1', at: STRIP.t2, col: C.tealLight},
  {t: ' − 3', at: STRIP.t3, col: C.coralLight},
  {t: ' = 4', at: STRIP.t4, col: C.saffron},
];
/** Strip-local x of each term (measured, so the +1 chip lands exactly where its term appears). */
const eqLayout = () => {
  const ws = EQ_TERMS.map((x) => textWidth(x.t, eqFont(EQ_SIZE)));
  let acc = 0;
  const xs = ws.map((w) => {
    const x0 = acc;
    acc += w;
    return x0;
  });
  return {ws, xs};
};
/** World centre of the "+ 1" term on the strip at rest. */
const eqPlusCentre = () => {
  const L = eqLayout();
  return {x: EQ.x + 24 + L.xs[1] + L.ws[1] * 0.62, y: EQ.y + 40};
};
const eqDy = (g: number) => drop(g, STRIP.land, 122, 8); // slides down out from behind the rules board
const eqSwing = (g: number) => 0.8 * ring(g, STRIP.land, 0.5, 0.1);
/** The strip hangs from the flies BEHIND the rules board (drawn before it): it slides down from behind the board and hangs below it. */
const EquationStrings: React.FC<{g: number}> = ({g}) => {
  if (g < STRIP.land - 8) return null;
  const L = eqLayout();
  const width = EQ_TERMS.reduce((s, x, i) => s + L.ws[i] * tw(g, x.at - 2, 5, E.out), 0) + 48;
  return (
    <div style={{position: 'absolute', left: EQ.x, top: EQ.y + eqDy(g), height: 80, width, transform: `rotate(${eqSwing(g)}deg)`, transformOrigin: '50% -300px'}}>
      <div style={{position: 'absolute', left: 30, top: -1000, width: 3, height: 1004, background: C.ink}} />
      <div style={{position: 'absolute', right: 30, top: -1000, width: 3, height: 1004, background: C.ink}} />
    </div>
  );
};
const Equation: React.FC<{g: number}> = ({g}) => {
  if (g < STRIP.land - 8) return null;
  const L = eqLayout();
  const widthT = EQ_TERMS.reduce((s, x, i) => s + L.ws[i] * tw(g, x.at - 2, 5, E.out), 0);
  return (
    <div style={{position: 'absolute', left: EQ.x, top: EQ.y + eqDy(g), height: 80, width: widthT + 48, transform: `rotate(${eqSwing(g)}deg)`, transformOrigin: '50% -300px'}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: C.ink, border: `${OUTLINE}px solid ${C.ink}`, boxShadow: `6px 8px 0 rgba(22,42,50,0.22)`}} />
      {EQ_TERMS.map((x, i) =>
        g >= x.at ? (
          <div key={i} style={{position: 'absolute', left: 24 + L.xs[i], top: 10, font: eqFont(EQ_SIZE), lineHeight: '60px', color: x.col, whiteSpace: 'pre', transform: `scale(${lerp(1.35, 1, sp(g, x.at, SNAP))})`, transformOrigin: '50% 60%'}}>
            {x.t}
          </div>
        ) : null,
      )}
    </div>
  );
};

const OptionsSign: React.FC<{g: number}> = ({g}) => {
  if (g < OPT_LAND - 12 || g > K.seven + 30) return null;
  const dy = drop(g, OPT_LAND, 420, 10) - 520 * tw(g, K.seven + 14, 14, E.in);
  const swing = 1.4 * ring(g, OPT_LAND, 0.5, 0.1) + 1.2 * ring(g, DING + 2, 0.6, 0.1);
  return (
    <div style={{position: 'absolute', left: OPT.x - OPTION_W / 2, top: OPT.y + dy, transform: `rotate(${swing}deg)`, transformOrigin: '50% -300px'}}>
      <div style={{position: 'absolute', left: 50, top: -1000, width: 3, height: 1000, background: C.ink}} />
      <div style={{position: 'absolute', right: 50, top: -1000, width: 3, height: 1000, background: C.ink}} />
      <OptionCard />
    </div>
  );
};

/** The honest player's "I don't know." — centred over HIS head (clear of the host and his own answer panel), tail down to him. */
const Bubble: React.FC<{g: number}> = ({g}) => {
  const t0 = PASS[0] + 1;
  if (g < t0 || g > LOCK - 2) return null;
  const s = sp(g, t0, SNAP) * (1 - tw(g, LOCK - 8, 6, E.in));
  const shake = PASS.reduce((acc, f) => acc + 1.5 * ring(g, f, 1.2, 0.35), 0);
  return (
    <div style={{position: 'absolute', left: HON.x - 300, width: 600, top: 344, display: 'flex', justifyContent: 'center', transform: `translateX(${shake}px) scale(${s})`, transformOrigin: '46% 128%'}}>
      <div style={{position: 'relative', background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 26, padding: '12px 26px 10px', font: `800 44px "Nunito Variable"`, color: C.ink, whiteSpace: 'nowrap', lineHeight: 1.05}}>
        I don’t know.
        <div style={{position: 'absolute', left: '42%', bottom: -27, width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: `28px solid ${C.ink}`}} />
        <div style={{position: 'absolute', left: 'calc(42% + 5px)', bottom: -18, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `19px solid ${C.white}`}} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ scene */
export const S6GameShow: React.FC = () => {
  const g = useG();
  useFontsReady();
  const cam = camAt(g);
  const host = hostState(g);
  const hon = honestState(g);
  const FREEZE = [K.wrongs + 1, K.wrongs + 9];
  const gFrozen = g >= FREEZE[0] && g < FREEZE[1];
  const gue = guesserState(gFrozen ? FREEZE[0] : g);
  const gueFrame = gFrozen ? FREEZE[0] : g;
  const tro = trophyState(g);

  // lights
  const dark = kf(g, [
    [K.start, 0.86],
    [LIGHTS[0] - 1, 0.86],
    [LIGHTS[0] + 2, 0.58, E.out],
    [LIGHTS[1], 0.58],
    [LIGHTS[1] + 3, 0.3, E.out],
    [LIGHTS[2], 0.3],
    [LIGHTS[2] + 4, 0, E.out],
  ]);
  const dimS24 = 0.42 * win(g, K.somehow + 1, TRO.land + 14, 6, 12);
  // s25: "The honest one: still six." lights his side; "The guesser: six, plus one, minus three." lights the guesser's;
  // both come back up for the 6 vs 4 comparison on "Four."
  const focH = win(g, K.honest25 - 2, K.guesser25 - 3, 8, 8);
  const focG = win(g, K.guesser25 - 1, K.four25 + 4, 8, 10);
  const focU = focH + focG > 0.001 ? focG / (focH + focG) : 0; // the pool of light slides across, it never jumps
  const focC = worldToScreen(cam, lerp(470, 1400, E.inOut(focU)), lerp(600, 560, focU), 1);
  const focA = 0.2 * Math.max(focH, focG);
  const spotW = {x: 960, y: lerp(540, 690, tw(g, ENT.open, 12, E.inOut))};
  const spotS = worldToScreen(cam, spotW.x, spotW.y, 1);
  const dimC = worldToScreen(cam, TROPHY_G.x + 70, 610, 1);
  const rollOn = [tw(g, ROLL[0] + ROLL_DUR - 4, 8), tw(g, ROLL[1] + ROLL_DUR - 4, 8)];
  const party = win(g, DING + 1, SEVEN + 18, 3, 12);
  const sweepA = Math.sin((g - DING) * 0.21);
  const sweepB = Math.sin((g - DING) * 0.42);
  const endT = tw(g, TW.land - 2, 10);
  const spots: Spot[] = [
    {x: 960, y: HOST.y + 8, rx: 150, on: tw(g, LIGHTS[2] - 2, 8) * (1 - 0.4 * endT), src: 960},
    {x: lerp(960, HON.x, rollOn[0]) + 300 * party * sweepA, y: HON.y + 10, rx: 190 * (1 + 0.15 * endT), on: rollOn[0] * (1 + 0.3 * endT), src: 700},
    {x: lerp(960, GUE.x, rollOn[1]) - 260 * party * sweepB, y: GUE.y + 10, rx: 190, on: rollOn[1] * (1 - 0.45 * endT), src: 1220},
    {x: 960 + 520 * sweepB, y: 980, rx: 220, on: party, tint: C.coral, src: 300},
    {x: 960 - 520 * sweepA, y: 980, rx: 220, on: party, tint: C.teal, src: 1620},
  ];

  // bulbs: a slow chase, very fast during the party
  const bulbs = g / 7 + party * (g / 2.5);
  const lit = [tw(g, ROLL[0] + ROLL_DUR - 2, 6), tw(g, ROLL[1] + ROLL_DUR - 2, 6)];

  // podium responses
  const slapsH = ROUND;
  const slapsG = [...ROUND.map((r) => r + 2), ...SLAM];
  const shudderG = SLAM.reduce((s, f) => s + 3 * ring(g, f, 1.7, 0.4), 0) + 3 * ring(g, TRO.land, 1.6, 0.35);
  const shudderH = 3 * ring(g, TW.land, 1.6, 0.35);
  const scoreOn = [tw(g, ROLL[0] + ROLL_DUR, 6), tw(g, ROLL[1] + ROLL_DUR, 6)];
  const guesserBg = mixHex(NAVY_DEEP, C.coral, tw(g, SEVEN, 4) * (1 - tw(g, K.four25, 10)));
  const rimH = Math.max(1 - tw(g, LOCK, 18), 0) * (g >= LOCK ? 1 : 0) + bell(g, K.six25 - 2, 12);
  const honestBg = mixHex(NAVY_DEEP, C.teal, (g >= LOCK ? 1 - tw(g, LOCK + 4, 14) : 0) + bell(g, K.six25 - 2, 12) * 0.8);
  const rimG = JUDGE.slice(0, 3).reduce((s, f) => s + bell(g, f + 1, 10), 0) + (g >= SEVEN ? 1 - tw(g, SEVEN, 14) : 0);

  // panels
  const panelDy = (side: number) => (g < PANEL_LAND[side] - 14 ? -700 : drop(g, PANEL_LAND[side], 700, 12));
  const panelSwing = (side: number) => 1.2 * ring(g, PANEL_LAND[side], 0.45, 0.1) + (side === 1 ? 0.6 * ring(g, DING, 0.6, 0.12) : 0);

  // confetti
  const conf = [
    // two poppers on the guesser's lid fire almost straight up: the paper rains round him, not into the host or the tiles
    ...confettiPieces(g, DING + 2, GUE.x - 120, POD.lidY - 6, 36, 3, -94, 28, 27),
    ...confettiPieces(g, DING + 4, GUE.x + 130, POD.lidY - 6, 36, 7, -88, 24, 27),
    // the trophy's clank: a small puff straight up off the lid, settling round it
    ...confettiPieces(g, TRO.land + 1, TROPHY_G.x - 26, POD.lidY - 10, 14, 11, -92, 24, 20),
    ...confettiPieces(g, TRO.land + 2, TROPHY_G.x + 20, POD.lidY - 10, 14, 13, -94, 20, 20),
  ];

  // flying score chips (s25): an arc from the tile; a hovering chip waits over the window, wobbling, then drops in
  const chip = (from: {x: number; y: number}, to: {x: number; y: number}, m: {launch: number; arrive: number; hover?: number}, text: string, tone: 'teal' | 'coral') => {
    if (g < m.launch || g >= m.arrive + 2) return null;
    const hoverPt = {x: to.x, y: to.y - 104};
    let x: number;
    let y: number;
    let rot = 0;
    if (m.hover === undefined || g < m.hover) {
      const end = m.hover === undefined ? to : hoverPt;
      const t1 = m.hover ?? m.arrive;
      const u = tw(g, m.launch, t1 - m.launch, E.inOut);
      x = lerp(from.x, end.x, u);
      y = lerp(from.y, end.y, u) - 120 * Math.sin(u * Math.PI);
    } else if (g < m.arrive - 4) {
      x = hoverPt.x + 3 * Math.sin((g - m.hover) * 0.9);
      y = hoverPt.y + 4 * Math.sin((g - m.hover) * 0.55) + 6 * ring(g, m.hover, 0.8, 0.25);
      rot = 7 * Math.sin((g - m.hover) * 0.7);
    } else {
      const u = Math.min(1, (g - (m.arrive - 4)) / 4);
      x = hoverPt.x;
      y = lerp(hoverPt.y, to.y, u * u);
    }
    const s = g < m.launch + 3 ? sp(g, m.launch, SNAP) : 1 - 0.5 * tw(g, m.arrive - 3, 4, E.in);
    return (
      <div key={text + m.launch} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`}}>
        <DeltaChip text={text} tone={tone} />
      </div>
    );
  };
  const scoreG = {x: GUE.x, y: POD.lidY + 22 + 26 + 60};

  // the −1 card in flight (s25)
  const flight = (() => {
    if (g < MINUS.release || g >= MINUS.hit) return null;
    const hand = {x: HOST.x + 70 * HOST.scale, y: HOST.y - 560 * HOST.scale};
    const to = valueCentre(1);
    const u = (g - MINUS.release) / (MINUS.hit - MINUS.release);
    const e = E.out(u);
    return {x: lerp(hand.x, to.x, e), y: lerp(hand.y, to.y + boardDy(g), e) - 60 * Math.sin(u * Math.PI), rot: -540 * e};
  })();

  const contestant = (who: 'honest' | 'guesser', st: ContState, pass: 'body' | 'L' | 'R') => {
    const base = who === 'honest' ? HON : GUE;
    const look = who === 'honest' ? CAST.honest : CAST.guesser;
    const seed = who === 'honest' ? 21 : 22;
    const fr = who === 'honest' ? g : gueFrame;
    if (pass === 'body') return <Character key={who + 'b'} look={look} pose={st.pose} frame={fr} seed={seed} x={st.x} y={base.y} scale={base.scale} front="L" pass="body" life={st.life} />;
    return <Character key={who + pass} look={look} pose={st.pose} frame={fr} seed={seed} x={st.x} y={base.y} scale={base.scale} front={pass} pass="frontArm" shadow={false} life={st.life} />;
  };

  const hostEl = (pass: 'body' | 'L' | 'R') => {
    const common = {look: CAST.host, pose: host.pose, frame: g, seed: 23, x: host.x, y: host.y, scale: host.scale, life: host.life};
    const cards = <CueCards fan={host.fan} flip={host.flip} tilt={-6} />;
    const tileHeld = host.tile ? (
      <g transform={`translate(${-4} ${-56}) rotate(${-8 + 6 * Math.sin(g * 0.5) * (g >= MINUS.show && g < MINUS.wind ? 1 : 0)})`}>
        <g transform={`scale(${g < MINUS.show - 2 ? -1 : g < MINUS.show + 2 ? Math.max(0.08, Math.abs(Math.cos(((g - MINUS.show + 2) / 4) * Math.PI))) * (g < MINUS.show ? -1 : 1) : 1} 1)`}>
          <rect x={-40} y={-54} width={80} height={108} rx={9} fill={g < MINUS.show ? C.blue : C.coral} stroke={C.ink} strokeWidth={4} />
          {g >= MINUS.show && (
            <text x={0} y={17} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={50} fill={C.white}>
              −1
            </text>
          )}
        </g>
      </g>
    ) : undefined;
    if (pass === 'body') return <Character key="hb" {...common} front="L" pass="body" holdR={tileHeld} />;
    return <Character key={'h' + pass} {...common} front={pass} pass="frontArm" shadow={false} holdL={pass === 'L' ? cards : undefined} holdR={pass === 'R' ? tileHeld : undefined} />;
  };

  const hostClip = host.clip ? `path('${slitPath(slitOpen(g))}')` : undefined;
  const apexY = TROPHY_APEX * TROPHY_S;
  const trophyEl = tro ? (
    <div style={{position: 'absolute', left: tro.x, top: tro.y}}>
      {/* the cable: hooked to the bridle while it hangs; on release the hook lets go and the empty bridle is hauled up */}
      {tro.cable > 0 && (
        <div style={{position: 'absolute', left: 0, top: apexY + (tro.bridle ? 0 : TROPHY_G.y - 34 - tro.y - (1 - tro.cable) * 600)}}>
          <div style={{position: 'absolute', left: -2, top: -1400, width: 4, height: 1400, background: C.ink}} />
          {!tro.bridle && (
            <svg width={2} height={2} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <path d={`M ${-60 * TROPHY_S} ${(-100 - TROPHY_APEX) * TROPHY_S} L 0 0 L ${60 * TROPHY_S} ${(-100 - TROPHY_APEX) * TROPHY_S}`} fill="none" stroke={C.ink} strokeWidth={3.5 * TROPHY_S} strokeLinejoin="round" />
              <circle cx={0} cy={0} r={6 * TROPHY_S} fill={C.inkSoft} stroke={C.ink} strokeWidth={3 * TROPHY_S} />
            </svg>
          )}
        </div>
      )}
      <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${tro.swing}deg)`, transformOrigin: `0px ${apexY}px`}}>
        <TrophyV2 feet={tro.feet} step={tro.step} sweat={tro.sweat} eyes={tro.eyes} lookX={tro.lookX} glint={tro.glint} sx={tro.sx} sy={tro.sy} rot={tro.rot} bridle={tro.bridle} />
      </div>
    </div>
  ) : null;
  // a soft pool of light behind the trophy while it is the guesser's prize, and again once it has walked back (light, so it may fade)
  const haloOn = tro ? Math.max(tw(g, TRO.lower + 4, 10, E.inOut) * (1 - tw(g, BOARD_BACK, 14, E.inOut)), tw(g, TW.land, 10, E.inOut)) : 0;
  const haloEl = tro && haloOn > 0.01 ? (
    <div style={{position: 'absolute', left: tro.x - 190, top: tro.y - 80 * TROPHY_S - 190, width: 380, height: 380, borderRadius: 190, opacity: haloOn, background: 'radial-gradient(circle, rgba(255,251,240,0.95) 0, rgba(255,251,240,0.7) 38%, rgba(255,251,240,0) 70%)'}} />
  ) : null;
  const trophyOnLid = tro && tro.zone !== 'floor';
  const confAir = <ConfettiPieces pieces={conf} landed={false} />;
  const confFloor = <ConfettiPieces pieces={conf} landed />;

  // the iris arrives from the S5 lens; the curtain sways a hair
  const sway = 2 * Math.sin(g / 45);
  // the tags slide down out from behind the board (they start hidden behind it), and leave with it
  const tagsDy = (land: number, h: number) => (g < FLY_OUT ? drop(g, land, h, 9) : -620 * tw(g, FLY_OUT - 2, 16, E.in));

  return (
    <AbsoluteFill style={{background: C.saffronDeep}}>
      <Camera cam={cam}>
        <Curtain sway={sway} />
        <StageFloor labelOn={g < LABEL_ON ? 0 : g < LABEL_ON + 3 ? 0.55 : g < LABEL_ON + 5 ? 0.15 : 1} label={GUARD} />
        <Layer depth={1}>
          {/* the follow spot's pool on the curtain (the S5 lens becomes this light) */}
          <div style={{position: 'absolute', left: 960 - 250, top: 540 - 250 + 150 * tw(g, ENT.open, 12, E.inOut), width: 500, height: 500, borderRadius: 250, background: `radial-gradient(circle, rgba(255,251,240,0.55) 0, rgba(255,251,240,0.4) 60%, rgba(255,251,240,0) 72%)`, opacity: 1 - 0.75 * tw(g, LIGHTS[2], 12)}} />
          <Spotlights spots={spots} />
          {haloEl}
          <CurtainSlit open={slitOpen(g)} bulge={win(g, ENT.bulge, ENT.open + 2, 6, 3)} wiggle={4 * Math.sin(g * 1.3)} />
          {/* hanging things (upstage) */}
          {g >= K.quiz - 4 && g < FLY_OUT + 20 && (
            <HangingTag cx={960} top={364} dy={tagsDy(TAG_LAND[1], 150)} swing={1.5 * ring(g, TAG_LAND[1], 0.6, 0.12)} size={30} tone="ink">
              {GUARD}
            </HangingTag>
          )}
          {g >= K.part - 6 && g < FLY_OUT + 20 && (
            <HangingTag cx={960} top={296} dy={tagsDy(TAG_LAND[0], 120)} swing={1.5 * ring(g, TAG_LAND[0], 0.6, 0.12)} size={32}>
              the researchers’ argument · Kalai et al. 2025
            </HangingTag>
          )}
          {g >= PANEL_LAND[0] - 16 && <AnswerPanel side={0} dy={panelDy(0)} swing={panelSwing(0)} tone={mixHex(C.inkMuted, C.teal, lit[0])} slots={honestSlots(g)} bulbs={bulbs} lit={lit[0]} />}
          {g >= PANEL_LAND[1] - 16 && <AnswerPanel side={1} dy={panelDy(1)} swing={panelSwing(1)} tone={mixHex(C.inkMuted, C.coral, lit[1])} slots={guesserSlots(g)} bulbs={bulbs} lit={lit[1]} />}
          <EquationStrings g={g} />
          <Equation g={g} />
          <RulesBoard dy={boardDy(g)} swing={boardSwing(g)} jolt={4 * ring(g, MINUS.hit, 1.4, 0.35)} cards={cardStates(g)} />
          <OptionsSign g={g} />
        </Layer>
        <Layer depth={1}>
          {/* the host (clipped to the curtain split while he is still behind it) */}
          {g >= ENT.open - 1 && (
            <div style={{position: 'absolute', inset: 0, clipPath: hostClip}}>
              {hostEl('body')}
              {hostEl('L')}
              {host.rFront && hostEl('R')}
            </div>
          )}
          {/* contestants behind their podiums */}
          {g >= ROLL[0] && contestant('honest', hon, 'body')}
          {g >= ROLL[1] && contestant('guesser', gue, 'body')}
          {confAir}
          {g >= ROLL[0] && (
            <Podium x={hon.x} name="HONEST" color={C.teal} deep={C.tealDeep} score={honestScore(g)} scoreBg={honestBg} rim={rimH} rimColor={C.tealLight} scorePop={bell(g, LOCK, 10) + bell(g, K.six25, 10)} buzzerX={BUZZ_X[0] - HON.x + hon.x} buzzerColor={C.tealLight} press={pressOf(g, slapsH)} light={lightOf(g, slapsH)} bulbs={bulbs} bulbsOn={scoreOn[0]} wheel={hon.x * 4.4} shudder={shudderH} scoreOn={scoreOn[0]} />
          )}
          {g >= ROLL[1] && (
            <Podium x={gue.x} name="GUESSER" color={C.coral} deep={C.coralDeep} score={guesserScore(g)} scoreBg={guesserBg} rim={clamp(rimG, 0, 1)} rimColor={g >= SEVEN - 1 ? GOLD : C.coralLight} scorePop={bell(g, SEVEN, 10) + bell(g, K.four25, 12) + 0.6 * bell(g, MINUS_FLY[0].arrive, 8) + 0.6 * bell(g, MINUS_FLY[1].arrive, 8)} buzzerX={BUZZ_X[1] - GUE.x + gue.x} buzzerColor={C.coralLight} press={pressOf(g, slapsG)} light={lightOf(g, slapsG)} bulbs={bulbs} bulbsOn={scoreOn[1]} wheel={gue.x * 4.4} shudder={shudderG} scoreOn={scoreOn[1]} />
          )}
          {confFloor}
          {trophyOnLid && trophyEl}
          {g >= ROLL[0] && contestant('honest', hon, 'L')}
          {g >= ROLL[0] && contestant('honest', hon, 'R')}
          {g >= ROLL[1] && contestant('guesser', gue, 'L')}
          {g >= ROLL[1] && contestant('guesser', gue, 'R')}
          {!trophyOnLid && trophyEl}
          <Bubble g={g} />
          {chip(slotCentre(1, 9), eqPlusCentre(), PLUS_FLY, '+1', 'teal')}
          {MINUS_FLY.map((m, j) => chip(slotCentre(1, 6 + j), scoreG, m, '−1', 'coral'))}
          {flight && (
            <div style={{position: 'absolute', left: flight.x, top: flight.y, transform: `translate(-50%, -50%) rotate(${flight.rot}deg)`}}>
              <div style={{width: 80 * 0.95, height: 108 * 0.95, borderRadius: 9, background: C.coral, border: `4px solid ${C.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 48px "JetBrains Mono"`, color: C.white}}>−1</div>
            </div>
          )}
        </Layer>
      </Camera>
      <Darkness a={dark} x={spotS.x} y={spotS.y} r={300 * cam.zoom} />
      <Darkness a={dimS24} x={dimC.x} y={dimC.y} r={330} />
      <Darkness a={focA} x={focC.x} y={focC.y} r={520} />
      {/* the caption scroll hangs downstage of the trophy's cable and stays lit when the stage dims */}
      <Camera cam={cam}>
        <Layer depth={1}>
          <Caption g={g} />
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

