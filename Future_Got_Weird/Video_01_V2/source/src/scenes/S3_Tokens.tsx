import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Camera, Cam, Layer} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camKick, camPath, drop, hop, impact, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {H34} from '../lib/handoffs';
import {Sfx} from '../lib/sfx';
import {C, F, OUTLINE} from '../theme';
import {Chip} from '../components/Text';
import {StampMark} from '../components/Props';
import {AnswerSlipArt, SLIP_A_FINAL, SLIP_H, SLIP_W} from '../components/v2/AnswerSlip';
import {
  BELT,
  Belt,
  Bracket,
  CARD,
  ChuteFront,
  FloorBand,
  Header,
  HousingBack,
  IllustrativeTag,
  LOOK,
  Lip,
  M,
  MOD,
  Module,
  ReadoutCard,
  Rods,
  RollPct,
  TILE,
  TILE_FONT,
  Tile,
  TileLook,
  WallArt,
  mix,
  mixLook,
  tokWidth,
} from '../components/v2/S3_Parts';
import tok from '../data/tokens_gpt4o_sentence.json';

/**
 * S3 — the token machine. ChatGPT's wrong answer is fed into the NEXT-CHUNK SCORER, comes back out as a strip of
 * text, snaps into real GPT-4o tokens ("Kalai" → "Kal" + "ai"), and then the machine shows its cycle: candidates
 * load → probabilities race → one is favoured → it separates, drops down the glass chute and locks into the sentence
 * → the belt indexes one step → the next candidates load. s11 rewinds to the year's last digit (likely ≠ true),
 * s12 bolts add-ons on the roof, and the roll-out produces "Algorithms", which the camera pushes into (H34 → S4).
 *
 * The machine is driven by a virtual clock τ (see `tau`): identical to the frame for the first roll-out, run
 * backwards for the s11 rewind, held during s11–s12, fast-forwarded on "But", then running on for the finale.
 * Every beat is keyed to a word of the V2 narration (timeline.json); see V2_DIRECTION.md for the conventions.
 */

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  mount: scene('S3').from - 14, // mounted under S2's lifting title card (TRANSITIONS.S3 = reveal 14)
  start: scene('S3').from,
  end: scene('S3').to - 1, // last frame: H34
  // s08
  lets: at('s08', "Let's"),
  take: at('s08', 'take'),
  chat: at('s08', "ChatGPT's"),
  answer: at('s08', 'answer'),
  apart: at('s08', 'apart.'),
  // s09
  builds: at('s09', 'builds'),
  out: at('s09', 'out'),
  tokens: at('s09', 'tokens:'),
  chunks: at('s09', 'chunks'),
  whole: at('s09', 'whole'),
  words: at('s09', 'words,'),
  some2: at('s09', 'sometimes', 2),
  frags: at('s09', 'fragments.'),
  in: at('s09', 'In'),
  gpt: at('s09', "GPT-4o's"),
  tokenizer: at('s09', 'tokenizer,'),
  kalai: at('s09', 'Kalai'),
  comes: at('s09', 'comes'),
  as: at('s09', 'as'),
  kal: at('s09', 'Kal'),
  ai: at('s09', 'ai.'),
  aiEnd: at('s09', 'ai.', 1, 'end'),
  // s10
  at: at('s10', 'At'),
  step: at('s10', 'step,'),
  model: at('s10', 'model'),
  scores: at('s10', 'scores'),
  all: at('s10', 'all'),
  chunks2: at('s10', 'chunks'),
  picks: at('s10', 'picks'),
  one: at('s10', 'one.'),
  then: at('s10', 'Then'),
  again: at('s10', 'again.'),
  token: at('s10', 'Token'),
  rolls: at('s10', 'rolls'),
  // s11
  here: at('s11', 'Here,'),
  last: at('s11', 'last'),
  digit: at('s11', 'digit'),
  year: at('s11', 'year.'),
  those: at('s11', 'Those'),
  likely: at('s11', 'likely.'),
  they: at('s11', 'They'),
  not: at('s11', 'not'),
  trueW: at('s11', 'true.'),
  // s12
  modern: at('s12', 'Modern'),
  more: at('s12', 'more'),
  top: at('s12', 'top:'),
  instr: at('s12', 'instruction'),
  stepBy: at('s12', 'step-by-step'),
  web: at('s12', 'web'),
  but: at('s12', 'But'),
  way: at('s12', 'way,'),
  one2: at('s12', 'one'),
  piece: at('s12', 'piece'),
  at2: at('s12', 'at'),
  time: at('s12', 'time.'),
};

/* ------------------------------------------------------------------ beats derived from the cues */
const SLIP_LAND = K.lets + 2; // the slip drops onto the reader ledge
const NOTICE = K.chat; // standby LED double-blinks: the machine notices its own answer
const SCAN = [K.chat + 3, K.answer + 4]; // scan beam sweeps the slip
const SWALLOW = K.apart + 3; // pulled down into the intake slot (after a 3-frame anticipation)
const FLAP = SWALLOW + 9; // intake flap snaps shut
const PRINT0 = SWALLOW + 11; // the strip starts coming out of the write head
const PRINT1 = PRINT0 + 46; // ... and stops (belt clunk)
const PERF0 = K.out - 4; // perforations score the strip between tokens
const SPLIT0 = K.tokens; // the strip snaps into tiles, left to right
const WHOLE_HOPS = [0, 1, 2, 3].map((i) => K.whole + i * 3);
const FRAG_HOPS = [0, 1, 2, 3].map((i) => K.some2 + 3 + i * 4); // one by one across "sometimes fragments"
const CHIPS_OUT = K.in;
// Kalai
const KA = {
  pulse: K.in + 2,
  signLand: K.tokenizer + 9,
  join: K.kalai - 2,
  lift: K.kalai + 3,
  shiver: K.comes,
  crack: K.kal - 3,
  kalSep: K.kal + 1,
  kalId: K.kal + 5,
  aiSep: K.ai,
  aiId: K.ai + 1,
  backKal: K.aiEnd - 7,
  backAi: K.aiEnd - 4,
  signOut: K.aiEnd - 4,
};
// power-on
const POWER = K.step + 12; // after the camera has arrived on the machine
const LAMPS_ON = [0, 1, 2].map((i) => POWER + i * 3);
const TAG_FLIP = POWER + 14;
// s11
const SLOTBOX = K.digit + 1; // after the push to the year has settled
const PATH0 = SLOTBOX + 5; // the dashed link from the favoured '2' to the slot, on "of the"
const UNDER = K.year + 2;
const HOVER = K.year;
const CARD1 = K.those + 4; // slides out once the camera has started to make room for it
const PULSES = [0, 1, 2, 3, 4].map((i) => K.likely + i * 3);
const CARD2 = K.they - 10;
const DUD = [K.not + 1, K.not + 6, K.not + 9];
const STAMP = K.trueW + 1;
const CARDS_IN = K.modern - 4;
// s12
const BRACKETS = [0, 1, 2].map((i) => K.more + i * 4); // the roof opens its mounting brackets on "add more on top"
const MOD_LAND = [K.instr + 3, K.stepBy + 4, K.web + 2];
const BUT_GLOW = K.but;
const ALGO_LAND = K.time - 2; // 'Algorithms' locks on "a time."
const PUSH0 = ALGO_LAND + 2; // the final push into "Algorithms" starts once it has landed

/* ------------------------------------------------------------------ the machine's virtual clock τ */
const TAU_HOLD = 1858; // '2' favoured, before the latch (s11 lives here)
const TAU_END1 = 2022; // the first roll-out has finished and the panel has cleared (caret waiting after ':')
const TAU_R = 2100; // where the finale resumes (nothing is scheduled between TAU_END1 and TAU_R)
const REW = [K.here, K.here + 22];
const FF = [K.but + 6, K.but + 26];
const tau = (g: number) => {
  if (g < REW[0]) return Math.min(g, TAU_END1);
  if (g < REW[1]) return lerp(TAU_END1, TAU_HOLD, E.inOut((g - REW[0]) / (REW[1] - REW[0])));
  if (g < FF[0]) return TAU_HOLD;
  if (g < FF[1]) return lerp(TAU_HOLD, TAU_END1, E.inOut((g - FF[0]) / (FF[1] - FF[0])));
  return TAU_R + (g - FF[1]);
};
/** finale cycles are written in global frames; this converts them to τ */
const G2T = (g: number) => TAU_R + (g - FF[1]);

/* ------------------------------------------------------------------ tokens and cycles */
const TOK = (tok.tokens as {id: number; text: string}[]).slice(0, 29); // up to and including " Algorithms"
const PREFIX = 15; // "Adam" … "200": the strip that comes out of the machine
const LAST = 28; // " Algorithms"
const WHOLE = [0, 9, 11, 12]; // Adam, dissertation, completed, in
const FRAG = [1, 2, 6, 7]; // Ta, uman, Ph, .D
const KAL = [3, 4];

type Cand = {t: string; p: number};
type Cycle = {
  k: number;
  cands: Cand[];
  load: number;
  stag: number;
  race0: number;
  fav: number;
  latch: number;
  push: number;
  land: number;
  step0: number;
  stepDur: number;
  keys?: [number, number][][];
};

/** Illustrative next-chunk scores (NOT measured from any model; the tag on the machine says so). */
const C15: Cycle = {
  k: 15,
  cands: [
    {t: '2', p: 31},
    {t: '1', p: 26},
    {t: '0', p: 12},
    {t: '5', p: 9},
    {t: '3', p: 7},
  ],
  load: K.scores,
  stag: 3,
  race0: K.all,
  fav: K.chunks2 + 1,
  latch: K.picks,
  push: 5,
  land: K.one + 3,
  step0: K.one + 11,
  stepDur: 12,
  // the race: '1' leads early, '2' overtakes and settles on top
  keys: [
    [[K.all, 0], [K.all + 10, 17], [K.all + 21, 23], [K.all + 30, 34], [K.chunks2 + 1, 31]],
    [[K.all + 1, 0], [K.all + 11, 22], [K.all + 21, 29], [K.all + 31, 27], [K.chunks2 + 1, 26]],
    [[K.all + 2, 0], [K.all + 12, 15], [K.all + 22, 10], [K.all + 32, 13], [K.chunks2 + 1, 12]],
    [[K.all + 3, 0], [K.all + 13, 6], [K.all + 23, 11], [K.all + 33, 8], [K.chunks2 + 1, 9]],
    [[K.all + 4, 0], [K.all + 14, 9], [K.all + 24, 5], [K.all + 34, 8], [K.chunks2 + 1, 7]],
  ],
};
const C16: Cycle = {
  k: 16,
  cands: [
    {t: ' at', p: 58},
    {t: ',', p: 21},
    {t: ' in', p: 9},
    {t: ')', p: 6},
  ],
  load: K.then + 6,
  stag: 2,
  race0: K.then + 11,
  fav: K.again - 3,
  latch: K.again + 2,
  push: 4,
  land: K.again + 14,
  step0: K.again + 16,
  stepDur: 9,
};
/** fast cycles: [token, land frame (τ), fall frames, candidates] */
const MICRO1: [number, number, number, Cand[]][] = [
  [17, 1950, 7, [{t: ' CM', p: 64}, {t: ' MIT', p: 12}, {t: ' the', p: 5}]],
  [18, 1962, 7, [{t: 'U', p: 92}, {t: 'u', p: 3}, {t: '.', p: 1}]],
  [19, 1974, 6, [{t: ')', p: 81}, {t: ',', p: 9}, {t: ' (', p: 3}]],
  [20, 1985, 6, [{t: ' is', p: 74}, {t: ' was', p: 15}, {t: ',', p: 4}]],
  [21, 1995, 5, [{t: ' entitled', p: 48}, {t: ' titled', p: 27}, {t: ' called', p: 11}]],
  [22, 2004, 5, [{t: ':', p: 77}, {t: ' “', p: 13}, {t: ',', p: 4}]],
];
const MICRO2: [number, number, number, Cand[]][] = [
  [23, G2T(K.way), 6, [{t: ' “', p: 66}, {t: ' On', p: 9}, {t: ' The', p: 7}]],
  [24, G2T(K.way + 8), 6, [{t: 'Boost', p: 38}, {t: 'On', p: 16}, {t: 'Learn', p: 9}]],
  [25, G2T(K.way + 15), 5, [{t: 'ing', p: 96}, {t: 'er', p: 2}, {t: 's', p: 1}]],
  // the last three lock on the stressed beats: "one" · "piece" · "a time."
  [26, G2T(K.one2 + 1), 5, [{t: ',', p: 88}, {t: ':', p: 5}, {t: ' and', p: 3}]],
  [27, G2T(K.piece + 1), 6, [{t: ' Online', p: 57}, {t: ' Game', p: 9}, {t: ' Ad', p: 6}]],
  [28, G2T(ALGO_LAND), 8, [{t: ' Algorithms', p: 83}, {t: ' Learning', p: 6}, {t: ' Pred', p: 3}]],
];
const micro = (list: [number, number, number, Cand[]][], prevLatch: number, firstLoad?: number): Cycle[] => {
  const out: Cycle[] = [];
  let pl = prevLatch;
  list.forEach(([k, land, fall, cands], i) => {
    const latch = land - fall - 5;
    const load = i === 0 && firstLoad !== undefined ? firstLoad : pl + 3;
    const next = list[i + 1];
    const stepDur = k === LAST ? 0 : Math.min(7, (next ? next[1] : land + 10) - land - 3);
    out.push({k, cands, load, stag: 1, race0: load + 2, fav: latch - 1, latch, push: 3, land, step0: land + 1, stepDur});
    pl = latch;
  });
  return out;
};
const CYCLES: Cycle[] = [C15, C16, ...micro(MICRO1, C16.latch), ...micro(MICRO2, 0, TAU_R)];
const pushStart = (c: Cycle) => c.latch + 2;
const pushEnd = (c: Cycle) => c.latch + 2 + c.push;

/* ------------------------------------------------------------------ small helpers */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
/** analytic spring 0 → 1 (works at fractional τ, unlike frame-stepped springs) */
const asp = (t: number, t0: number, cfg: {damping: number; stiffness: number; mass: number} = SNAP) => {
  if (t <= t0) return 0;
  const s = (t - t0) / 30;
  const w0 = Math.sqrt(cfg.stiffness / cfg.mass);
  const z = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass));
  if (z >= 1) return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
  const w1 = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * s) * (Math.cos(w1 * s) + ((z * w0) / w1) * Math.sin(w1 * s));
};
const ROLL = {damping: 15, stiffness: 260, mass: 0.7}; // a candidate rolling into its slot
const printEase = Easing.bezier(0.3, 0.32, 0.22, 1);
const descend = Easing.bezier(0.32, 0, 0.72, 0.82); // a module lowered on a cable, still moving when it lands

/* ------------------------------------------------------------------ layout (needs fonts: computed per render) */
const WH = (M.glass.x0 + M.glass.x1) / 2; // the write head: chute centre = where every token lands
type Layout = {
  W: number[];
  X0: number[]; // tile left at belt shift 0
  step: number[]; // belt step after token k locks
  strip: {left: number; right: number; textX: number[]; pieceL: number[]; pieceR: number[]; bx: number[]};
  kalC: number;
};
const layout = (): Layout => {
  const W = TOK.map((t) => tokWidth(t.text));
  const P: number[] = [];
  let acc = 0;
  W.forEach((w) => {
    P.push(acc);
    acc += w + TILE.gap;
  });
  const A = WH - W[PREFIX] / 2 - P[PREFIX];
  const X0 = P.map((p) => A + p);
  const step = W.map((w, k) => (k + 1 < W.length ? w / 2 + TILE.gap + W[k + 1] / 2 : 0));
  // the strip: the same text, unbroken, ending where "200" ends
  const full = TOK.slice(0, PREFIX).map((t) => textWidth(t.text, TILE_FONT));
  const lead = TOK.slice(0, PREFIX).map((t) => (t.text === ' ' ? textWidth(' ', TILE_FONT) : t.text.startsWith(' ') ? textWidth(' ', TILE_FONT) : 0));
  const SPAD = 16;
  const right = X0[PREFIX - 1] + W[PREFIX - 1];
  const left = right - (full.reduce((a, b) => a + b, 0) + 2 * (SPAD + TILE.B));
  const bx: number[] = [];
  let x = left + TILE.B + SPAD;
  full.forEach((w) => {
    bx.push(x);
    x += w;
  });
  const textX = bx.map((b, k) => b + lead[k]);
  const pieceL = bx.map((b, k) => (k === 0 ? left : b));
  const pieceR = bx.map((b, k) => (k === PREFIX - 1 ? right : bx[k + 1]));
  const kalC = (X0[KAL[0]] + X0[KAL[1]] + W[KAL[1]]) / 2;
  return {W, X0, step, strip: {left, right, textX, pieceL, pieceR, bx}, kalC};
};

/* ------------------------------------------------------------------ machine state at τ */
const beltShift = (t: number, L: Layout) =>
  CYCLES.reduce((s, c) => (c.stepDur > 0 ? s + L.step[c.k] * E.softBack(clamp01((t - c.step0) / c.stepDur)) : s), 0);

/** belt travel during the intro: a slow idle crawl, then the print run */
const beltIntro = (g: number, L: Layout) => {
  const D = WH - L.strip.left;
  return 2.4 * Math.max(0, Math.min(g, PRINT0) - K.mount) + D * printEase(clamp01((g - PRINT0) / (PRINT1 - PRINT0)));
};

const barValue = (c: Cycle, i: number, t: number) => {
  if (t < c.race0 + (c.keys ? 0 : i)) return 0;
  let v: number;
  if (c.keys) {
    const ks = c.keys[i];
    if (t <= ks[0][0]) v = 0;
    else if (t >= ks[ks.length - 1][0]) v = ks[ks.length - 1][1];
    else {
      let j = 1;
      while (t > ks[j][0]) j++;
      const [f0, v0] = ks[j - 1];
      const [f1, v1] = ks[j];
      v = v0 + (v1 - v0) * E.inOut((t - f0) / (f1 - f0));
    }
  } else {
    const p = c.cands[i].p;
    const u = clamp01((t - c.race0 - i) / Math.max(2, c.fav - c.race0 - i));
    v = p * E.out(u) + (1 - u) * (8 + 4 * i) * Math.sin(t * 1.9 + i * 2.3 + c.k);
  }
  // drain once the winner has landed
  return Math.max(0, v) * (1 - tw(t, c.land, 7, E.in));
};

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  e0a: {cx: 690, cy: 478, zoom: 1.18},
  e0: {cx: 700, cy: 482, zoom: 1.24},
  mach: {cx: 640, cy: 515, zoom: 1.34},
  mach2: {cx: 612, cy: 520, zoom: 1.29},
  year: {cx: 705, cy: 494, zoom: 1.42},
  cards: {cx: 395, cy: 520, zoom: 1.22},
  roof: {cx: 620, cy: 440, zoom: 1.1},
};
/** s09: the whole answer (Adam … 200) and the whole machine that wrote it; tiles ≥ 44 px on screen. The frame's top
 *  sits just above the header so the row lands on the lower third and the floor stays a band. */
const shotS09 = (L: Layout): Cam => {
  const x0 = L.X0[0] - 52;
  const x1 = M.x1 + 40;
  const zoom = 1920 / (x1 - x0);
  return {cx: (x0 + x1) / 2, cy: 70 + 540 / zoom, zoom};
};
/** Kalai close-up: "Adam" keeps a clear margin on the left; the idle housing's left third stays in frame on the right
 *  (a clear chunk of the machine, not a sliver). */
const KAL_ZOOM = 1.6;
const shotKal = (L: Layout): Cam => ({cx: L.X0[0] - 64 + 960 / KAL_ZOOM, cy: 625, zoom: KAL_ZOOM});
const FINAL_ZOOM = H34.fontPx / TILE.font;

const camAt = (g: number, L: Layout): Cam => {
  const path = (f: number) =>
    camPath(f, SHOTS.e0a, [
      {at: K.mount, dur: SWALLOW - K.mount - 6, to: SHOTS.e0, ease: E.inOut},
      {at: PRINT0 + 2, dur: 44, to: shotS09(L)},
      {at: K.in - 2, dur: 24, to: shotKal(L)},
      {at: KA.backAi + 9, dur: 24, to: SHOTS.mach}, // after Kal and ai are both back in the row
      {at: K.token + 1, dur: 64, to: SHOTS.mach2},
      {at: REW[1] - 2, dur: 22, to: SHOTS.year}, // after the rewind: push to the year on "the last digit"
      {at: K.those - 10, dur: 24, to: SHOTS.cards}, // make room for the readouts as the first one slides out
      {at: K.modern - 6, dur: 30, to: SHOTS.roof},
    ]);
  let c = path(g);
  if (g > PUSH0) {
    // push into the final token: the target point travels to the frame centre while the zoom grows geometrically
    const c0 = path(PUSH0);
    const Tx = WH;
    const Ty = TILE.top + TILE.H / 2;
    const u = E.inOut(clamp01((g - PUSH0) / (K.end - PUSH0)));
    const z = Math.exp(lerp(Math.log(c0.zoom), Math.log(FINAL_ZOOM), u));
    const p0x = 960 + (Tx - c0.cx) * c0.zoom;
    const p0y = 540 + (Ty - c0.cy) * c0.zoom;
    const px = lerp(p0x, H34.cx, u);
    const py = lerp(p0y, H34.cy, u);
    c = {cx: Tx - (px - 960) / z, cy: Ty - (py - 540) / z, zoom: z};
  }
  return {...c, zoom: c.zoom * camKick(g, [STAMP], 0.016) * camKick(g, MOD_LAND, 0.007) * camKick(g, [SWALLOW + 8], 0.006)};
};

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
const T2G = (t: number) => (t <= TAU_END1 ? t : t - TAU_R + FF[1]); // τ of a cycle event → its global frame
/** first global frame in [a, b] for which `ok` holds (b if none) */
const firstFrame = (a: number, b: number, ok: (g: number) => boolean) => {
  for (let f = a; f <= b; f++) if (ok(f)) return f;
  return b;
};
export const SFX: Sfx[] = [
  {f: K.mount, kind: 'amb_conveyor', dur: (scene('S3').to - K.mount) / 30},
  {f: K.mount, kind: 'conveyor_run', dur: (PRINT0 - K.mount) / 30, gain: -12, note: 'idle belt crawl under the reveal'},
  {f: SLIP_LAND - 6, kind: 'paper_flap', gain: -8, note: 'the slip falls in'},
  {f: SLIP_LAND, kind: 'paper_slap', gain: -3},
  {f: NOTICE, kind: 'pop_tick', gain: -12, pitch: 7, note: 'standby LED blips twice'},
  {f: NOTICE + 5, kind: 'pop_tick', gain: -12, pitch: 9},
  {f: SCAN[0], kind: 'scanner_sweep', dur: (SCAN[1] - SCAN[0]) / 30, gain: -6},
  {f: SWALLOW, kind: 'paper_slide', note: 'slip pulled into the intake'},
  {f: FLAP, kind: 'machine_clunk', gain: -6},
  {f: PRINT0, kind: 'printer_feed'},
  {f: PRINT0, kind: 'conveyor_run', dur: (PRINT1 - PRINT0) / 30, gain: -4},
  {f: PRINT1, kind: 'conveyor_clunk'},
  ...[0, 5, 10].map((d) => ({f: PERF0 + d, kind: 'typewriter_tick' as const, gain: -11, pitch: 3, note: 'perforations scored'})),
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((d, i) => ({f: SPLIT0 + d, kind: 'pop_tick' as const, gain: -7, pitch: i, note: 'strip snaps into tiles'})),
  ...WHOLE_HOPS.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -9, pitch: -3 + i})),
  {f: WHOLE_HOPS[2] + 2, kind: 'chip_pop', gain: -4},
  ...FRAG_HOPS.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -9, pitch: 5 + i})),
  {f: FRAG_HOPS[2] + 2, kind: 'chip_pop', gain: -4, pitch: 2},
  {f: KA.signLand, kind: 'hanger_click', gain: -4, note: 'tokenizer sign lands on its strings'},
  {f: KA.lift, kind: 'paper_lift', gain: -6, note: 'Kalai lifts as one block'},
  {f: KA.kalSep, kind: 'card_flick', note: 'crack: Kal snaps off'},
  {f: KA.aiSep, kind: 'paper_slide', gain: -5, note: 'ai slides away'},
  {f: KA.backKal + 8, kind: 'token_lock', gain: -5},
  {f: KA.backAi + 8, kind: 'token_lock', gain: -6, pitch: 2},
  {f: POWER - 2, kind: 'machine_clunk', note: 'scorer powers on'},
  ...LAMPS_ON.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -8, pitch: 4 + i * 3})),
  {f: POWER, kind: 'machine_hum', dur: (K.modern - POWER) / 30, gain: -10},
  {f: TAG_FLIP + 4, kind: 'hanger_click', gain: -6, note: 'illustrative-numbers tag flips down'},
  ...C15.cands.map((_, i) => ({f: C15.load + i * C15.stag, kind: 'pop_tick' as const, gain: -9, pitch: i})),
  ...[0, 6, 12, 18, 24, 30].map((d, i) => ({f: K.all + d, kind: 'prob_tick' as const, gain: -6, pitch: i})),
  {f: C15.fav, kind: 'token_select', gain: -5},
  {f: C15.latch, kind: 'machine_clunk', gain: -8, note: 'latch'},
  {f: pushStart(C15), kind: 'card_flick', gain: -6, note: "'2' pushed into the chute"},
  {f: C15.land, kind: 'token_lock'},
  {f: C15.step0 + C15.stepDur, kind: 'conveyor_clunk'},
  ...C16.cands.map((_, i) => ({f: C16.load + i * C16.stag, kind: 'pop_tick' as const, gain: -10, pitch: 2 + i})),
  {f: C16.race0 + 4, kind: 'prob_tick', gain: -7, pitch: 2},
  {f: C16.fav, kind: 'token_select', gain: -6},
  {f: C16.land, kind: 'token_lock', pitch: 1},
  {f: C16.step0 + C16.stepDur, kind: 'conveyor_clunk', gain: -3},
  ...CYCLES.slice(2, 8).map((c, i) => ({f: c.land, kind: 'token_lock' as const, pitch: 2 + i, gain: -2 - (i % 2) * 2})),
  ...CYCLES.slice(2, 8)
    .filter((_, i) => i % 2 === 1)
    .map((c) => ({f: c.step0 + c.stepDur, kind: 'conveyor_clunk' as const, gain: -9})),
  {f: REW[0], kind: 'conveyor_run', dur: (REW[1] - REW[0]) / 30, pitch: 3, gain: -4, note: 'rewind'},
  ...CYCLES.slice(0, 8).map((c, i) => ({f: firstFrame(REW[0], REW[1], (g) => tau(g) < c.land), kind: 'pop_tick' as const, gain: -12, pitch: 8 - i, note: 'a token flies back up the chute'})),
  {f: REW[1] - 1, kind: 'token_select', gain: -6, note: "'2' re-seats in the scorer"},
  {f: UNDER, kind: 'marker_sweep', gain: -3},
  {f: SLOTBOX, kind: 'pop_tick', gain: -8},
  {f: CARD1, kind: 'card_slide', note: 'readout card out on its rail'},
  {f: K.likely, kind: 'marker_sweep', gain: -5, pitch: 3},
  {f: K.likely + 1, kind: 'indicator_yes', gain: -4},
  ...PULSES.map((f, i) => ({f, kind: 'prob_tick' as const, gain: -11, pitch: 6 - i})),
  {f: CARD2, kind: 'card_slide', gain: -2, pitch: -2},
  {f: DUD[0], kind: 'indicator_no', gain: -8, note: 'truth lamp tries'},
  {f: DUD[2] + 2, kind: 'indicator_no', gain: -3, pitch: -4, note: '... and dies'},
  {f: STAMP, kind: 'stamp_light', note: 'NOT MEASURED'},
  {f: CARDS_IN, kind: 'card_slide', gain: -7, pitch: 2},
  ...BRACKETS.map((f, i) => ({f, kind: 'machine_clunk' as const, gain: -9, pitch: i * 2})),
  ...MOD_LAND.flatMap((f, i) => [
    {f, kind: 'machine_clunk' as const, gain: i === 2 ? -4 : 0, pitch: -i}, // V3: the third lands on 'search'
    {f: f + 3, kind: 'glint' as const, gain: -10},
    {f: f + 6, kind: 'indicator_yes' as const, gain: -12, pitch: i * 2},
  ]),
  {f: BUT_GLOW, kind: 'indicator_yes', gain: -9, pitch: -3, note: 'add-ons glow, feed into the same core'},
  {f: FF[0], kind: 'conveyor_run', dur: (FF[1] - FF[0]) / 30, pitch: 3, gain: -5, note: 'fast-forward back to where it was'},
  ...CYCLES.slice(8).map((c, i) => ({f: T2G(c.land), kind: 'token_lock' as const, pitch: i, gain: i === 5 ? 0 : -3})),
  ...CYCLES.slice(8, 13).map((c) => ({f: T2G(c.step0 + c.stepDur), kind: 'conveyor_clunk' as const, gain: -10})),
  {f: PUSH0 + 3, kind: 'whoosh_soft', gain: -10, note: 'push into "Algorithms" → library'},
];

/* ------------------------------------------------------------------ scene */
export const S3Tokens: React.FC = () => {
  const g = useG();
  useFontsReady();
  const L = layout();
  const t = tau(g);
  const cam = camAt(g, L);
  const S = beltShift(t, L);
  const belt = beltIntro(g, L) + S;

  /* ---------------- machine-wide responses */
  const power = g < POWER + 4 ? 0 : g < POWER + 6 ? 1 : g < POWER + 8 ? 0.25 : 1;
  const landRing = CYCLES.reduce((a, c) => a + 0.8 * ring(t, c.land, 1.4, 0.5), 0);
  const housingDy =
    1.2 * ring(g, SLIP_LAND, 1.2, 0.35) +
    1.4 * ring(g, NOTICE, 1.6, 0.4) +
    3 * ring(g, SWALLOW + 4, 1.5, 0.3) +
    landRing +
    2.2 * ring(g, STAMP, 1.5, 0.4) +
    4 * tw(g, BRACKETS[0], 3) * (1 - tw(g, BRACKETS[0] + 3, 10, E.softBack)) +
    MOD_LAND.reduce((a, f) => a + 3 * ring(g, f, 1.3, 0.3), 0);
  const curCycle = [...CYCLES].reverse().find((c) => c.load <= t);
  const latchBlink = CYCLES.reduce((a, c) => Math.max(a, bell(t, c.latch, 5)), 0);
  const mode: 'none' | 'rew' | 'ff' = g >= REW[0] - 2 && g < REW[1] + 2 ? 'rew' : g >= FF[0] - 2 && g < FF[1] + 2 ? 'ff' : 'none';
  const modeOn = Math.floor(g / 4) % 2 === 0 ? 1 : 0.35;
  const butFlare = bell(g, BUT_GLOW, 22);
  const lamps = [
    {on: g >= LAMPS_ON[0] ? Math.min(1, sp(g, LAMPS_ON[0], SNAP)) : 0, color: '#7CF2DF'},
    {on: g >= LAMPS_ON[1] ? Math.max(0.55 * Math.min(1, sp(g, LAMPS_ON[1], SNAP)), latchBlink, butFlare) : 0, color: C.saffron},
    {on: g >= LAMPS_ON[2] ? Math.max(0.8 * Math.min(1, sp(g, LAMPS_ON[2], SNAP)), butFlare) : 0, color: '#FFFFFF'},
  ];
  const standby = g >= POWER ? 0 : g >= NOTICE && g < NOTICE + 9 ? (g < NOTICE + 3 || g >= NOTICE + 5 ? 1 : 0) : g % 36 < 3 ? 1 : 0;

  /* ---------------- the slip (s08) */
  const slipS = 1.45;
  const slipCx = 560;
  const slipTop0 = M.lipTop + 2 - SLIP_H; // wrapper top; it scales about its bottom centre
  // falls in from above the frame (accelerating), then one small bounce on the ledge
  const slipFall = g <= SLIP_LAND ? -640 * (1 - clamp01((g - (SLIP_LAND - 7)) / 7) ** 2) : -12 * bell(g, SLIP_LAND, 6) - 3 * bell(g, SLIP_LAND + 6, 4);
  const slipAnt = -10 * E.out(clamp01((g - K.apart) / 3)) * (1 - clamp01((g - SWALLOW) / 3));
  const slipSink = 440 * E.in(clamp01((g - SWALLOW) / 9));
  const slipShake = g >= SWALLOW && g < SWALLOW + 9 ? 2 * Math.sin(g * 2.7) : 0;
  const slipRot = -1.2 + 2.4 * ring(g, SLIP_LAND, 0.9, 0.22) + 0.8 * ring(g, NOTICE, 1.4, 0.35);
  const [slipSx, slipSy] = g >= K.apart && g < SWALLOW + 2 ? [1.03, 0.97] : impact(g, SLIP_LAND, 0.06, 8);
  const slipOn = g >= SLIP_LAND - 8 && g < SWALLOW + 10;
  const scanT = g >= SCAN[0] && g <= SCAN[1] ? (g - SCAN[0]) / (SCAN[1] - SCAN[0]) : -1;

  /* ---------------- the strip (print) and the tiles (s08–s09) */
  const stripShift = beltIntro(PRINT1, L) - beltIntro(g, L);
  const printing = g >= PRINT0 && g < SPLIT0;
  // the strip breaks at every perforation and the pieces spread apart together (anchored at "200", so the row grows
  // leftwards): one shared spread keeps every gap equal while it opens. The snap itself ripples left to right (hops).
  const splitSpread = asp(g, SPLIT0 + 1, {damping: 19, stiffness: 190, mass: 1});
  const splitU = (_k: number) => splitSpread;

  const tint = (k: number): TileLook => {
    let look = LOOK.paper;
    const wi = WHOLE.indexOf(k);
    const fi = FRAG.indexOf(k);
    if (wi >= 0) look = mixLook(look, LOOK.teal, tw(g, WHOLE_HOPS[wi], 4) * (1 - tw(g, K.in + 2, 12)));
    if (fi >= 0) look = mixLook(look, LOOK.saffron, tw(g, FRAG_HOPS[fi], 4) * (1 - tw(g, K.in + 2, 12)));
    if (KAL.includes(k)) look = mixLook(look, LOOK.blue, tw(g, KA.pulse, 8) * (1 - tw(g, K.at + 4, 14)));
    return look;
  };
  const tileHop = (k: number) => {
    let y = g >= SPLIT0 ? hop(g, SPLIT0 + k, 10, 8) : 0;
    y += hop(g, K.chunks + k * 1.3, 5, 8);
    const wi = WHOLE.indexOf(k);
    const fi = FRAG.indexOf(k);
    if (wi >= 0) y += hop(g, WHOLE_HOPS[wi], 14, 9);
    if (fi >= 0) y += hop(g, FRAG_HOPS[fi], 14, 9);
    return y;
  };

  /* ---------------- Kalai (s09) */
  const kalai = () => {
    const [a, b] = KAL;
    const joinT = tw(g, KA.join, 5, E.inOut);
    const split = tw(g, KA.kalSep, 3, E.out);
    const inner = joinT * (1 - split);
    const kalW = L.W[a] - (TILE.padX + TILE.B) * inner;
    const aiW = L.W[b] - (TILE.padX + TILE.B) * inner;
    const gapNow = TILE.gap * (1 - joinT);
    const c0 = L.kalC - S;
    const total = kalW + aiW + gapNow;
    const liftU = asp(g, KA.lift, {damping: 13, stiffness: 150, mass: 1});
    const dip = 5 * bell(g, KA.lift - 4, 5);
    const sepK = -62 * asp(g, KA.kalSep, SNAP);
    const sepA = 62 * asp(g, KA.aiSep, SNAP);
    const shiver = 2.4 * Math.sin((g - KA.shiver) * 2.3) * bell(g, KA.shiver, K.as + 4 - KA.shiver);
    const halves = [
      {k: a, w: kalW, x: c0 - total / 2 + sepK, back: KA.backKal, padR: TILE.padX * (1 - inner), padL: TILE.padX, bl: TILE.B, br: TILE.B * (1 - inner)},
      {k: b, w: aiW, x: c0 - total / 2 + kalW + gapNow + sepA, back: KA.backAi, padR: TILE.padX, padL: TILE.padX * (1 - inner), bl: TILE.B * (1 - inner), br: TILE.B},
    ];
    return halves.map((h) => {
      const u = clamp01((g - h.back) / 8);
      const restX = L.X0[h.k] - S;
      const x = lerp(h.x, restX, E.inOut(u));
      const lifted = -165 * liftU + dip;
      const y = lifted * (1 - u * u) - 4 * bell(g, h.back + 8, 5);
      const s = 1 + 0.32 * liftU * (1 - u);
      return {...h, x, y, s, rot: shiver * (1 - u), originX: c0 - x, active: g >= KA.join && g < h.back + 14, u, liftU};
    });
  };
  const kal = kalai();
  const kalActive = g >= KA.join && g < KA.backAi + 14;

  /* ---------------- panel rows: five fixed tracks and slot windows; the current cycle fills them */
  const exitAt = (c: Cycle, i: number, next?: Cycle) => Math.min(next ? next.load + Math.min(i, next.cands.length) * next.stag : Infinity, c.land + 8 + i);
  const slotTiles = (c: Cycle, next?: Cycle) =>
    c.cands.map((cand, i) => {
      const inT = asp(t, c.load + i * c.stag, ROLL);
      const outT = i === 0 ? 0 : E.in(clamp01((t - exitAt(c, i, next)) / 5));
      const gone = i === 0 && t >= c.latch;
      const favT = i === 0 ? tw(t, c.fav, 4) : 0;
      const dimT = i > 0 ? tw(t, c.latch, 4) : 0;
      const look = mixLook(mixLook(LOOK.paper, LOOK.fresh, favT), LOOK.dim, dimT);
      return {cand, i, inT, y: (inT - 1) * M.rowH + outT * M.rowH, visible: inT > 0 && outT < 1 && !gone, look, favT, dimT};
    });
  const ci = curCycle ? CYCLES.indexOf(curCycle) : -1;
  const cur = ci >= 0 ? CYCLES[ci] : undefined;
  const nxt = ci >= 0 ? CYCLES[ci + 1] : undefined;
  const tilesCur = cur ? slotTiles(cur, nxt) : [];
  const tilesPrev = ci >= 1 ? slotTiles(CYCLES[ci - 1], cur) : [];
  const hover = tw(g, HOVER, 8) * (1 - tw(g, K.modern, 8));

  /* ---------------- flying tiles (separate → push → fall) */
  const flying = CYCLES.filter((c) => t >= c.latch && t < c.land).map((c) => {
    const w = L.W[c.k];
    const x0 = M.win0 + 6; // candidates sit at the start of their lane; the chosen one slides along it
    const y0 = M.rowY(0);
    let x = x0;
    let y = y0;
    let sx = 1;
    let sy = 1;
    let rot = 0;
    let inRow = false;
    if (t < pushStart(c)) {
      inRow = true;
      const a = (t - c.latch) / 2;
      x = x0 - 5 * Math.sin(a * Math.PI * 0.5);
      sx = 0.94;
      sy = 1.06;
    } else if (t < pushEnd(c)) {
      const u = E.in(clamp01((t - pushStart(c)) / c.push));
      x = lerp(x0, WH - w / 2, u);
      sx = 1.05;
      sy = 0.96;
    } else {
      const u = clamp01((t - pushEnd(c)) / (c.land - pushEnd(c)));
      x = WH - w / 2;
      y = lerp(y0, TILE.top, u * u);
      rot = 3 * Math.sin(u * Math.PI * 2) * (1 - u);
      sy = 1 + 0.05 * u;
      sx = 1 - 0.03 * u;
    }
    return {c, w, x, y, sx, sy, rot, inRow};
  });

  /* ---------------- sentence tiles on the belt */
  const landedLast = CYCLES.filter((c) => c.land <= t).reduce((m, c) => Math.max(m, c.k), PREFIX - 1);
  const sentence: React.ReactNode[] = [];
  if (g >= SPLIT0) {
    for (let k = 0; k <= landedLast; k++) {
      if (KAL.includes(k) && kalActive) continue;
      const c = CYCLES.find((cc) => cc.k === k);
      let x = L.X0[k] - S;
      let y = TILE.top;
      let w = L.W[k];
      let sx = 1;
      let sy = 1;
      let rot = 0;
      let flash = 0;
      let look = tint(k);
      let textX: number | undefined;
      let radius = 10;
      if (k < PREFIX) {
        const u = splitU(k);
        if (g < SPLIT0 + 32) {
          const pl = L.strip.pieceL[k];
          const pr = L.strip.pieceR[k];
          x = lerp(pl, L.X0[k], u) - S;
          w = lerp(pr - pl, L.W[k], u);
          textX = lerp(L.strip.textX[k] - pl, TILE.B + TILE.padX, u);
          radius = lerp(2, 10, clamp01(u));
        }
        y += tileHop(k);
        if (k === 2 || k === 5) rot = (k === 2 ? 1.6 : -1.6) * (kal[0].liftU ?? 0) * (1 - kal[0].u);
      } else if (c) {
        const dt = t - c.land;
        y += dt >= 0 && dt < 6 ? -7 * Math.sin((dt / 6) * Math.PI) : 0;
        [sx, sy] = impact(t, c.land, 0.12, 8);
        // a wide tile must not spread over its neighbour: keep the sideways squash inside the gap (≤ 5 px a side)
        const cap = 10 / L.W[k];
        sx = 1 + Math.max(-cap, Math.min(cap, sx - 1));
        flash = dt >= 0 ? 1 - clamp01(dt / 10) : 0;
        look = c.stepDur > 0 ? mixLook(LOOK.fresh, LOOK.paper, tw(t, c.step0 + c.stepDur, 10)) : LOOK.fresh;
      }
      sentence.push(<Tile key={k} x={x} y={y} w={w} text={TOK[k].text} look={look} sx={sx} sy={sy} rot={rot} flash={flash} textX={textX} radius={radius} glow={KAL.includes(k) ? bell(g, KA.pulse, 14) : 0} />);
    }
  }
  const lastTile = L.X0[landedLast] + L.W[landedLast] - S;
  const anyFlying = flying.some((f) => !f.inRow);
  const caretOn =
    g >= PRINT1 + 2 &&
    !(g >= SLOTBOX && g < K.modern + 4) &&
    mode === 'none' &&
    !anyFlying &&
    landedLast < LAST &&
    !(g >= SPLIT0 - 2 && g < SPLIT0 + 18) &&
    g % 16 < 9;

  /* ---------------- s11 readouts */
  const cardOut = (t0: number) => asp(g, t0, {damping: 14, stiffness: 150, mass: 1}) * (1 - tw(g, CARDS_IN, 10, E.in));
  const c1 = cardOut(CARD1);
  const c2 = cardOut(CARD2);
  const lampLit = DUD.some((f, i) => g >= f && g < f + (i === 1 ? 1 : 2)) ? 1 : 0;
  const stampT = g >= STAMP ? 1 : 0;
  const stampScale = g >= STAMP ? lerp(1.5, 1, E.out(clamp01((g - STAMP) / 4))) : 1;
  const [c2sx, c2sy] = g >= STAMP - 3 && g < STAMP ? [1.02, 0.96] : impact(g, STAMP, 0.06, 8);
  const likelySweep = tw(g, K.likely, 9);
  const underT = tw(g, UNDER, 12) * (1 - tw(g, K.modern + 2, 8, E.in));
  const pathT = tw(g, PATH0, 14, E.inOut) * (g < CARD1 + 14 ? 1 : 0);
  const pathOut = 1 - tw(g, CARD1 + 2, 10); // a drawn guide (light, not an object): it retires as the readout card takes over
  const pathPts = (() => {
    const x0 = M.win0 + 6 + L.W[PREFIX] + 10;
    const y0 = M.rowY(0) + TILE.H / 2 + housingDy;
    const y1 = TILE.top - 22;
    const l1 = WH - x0;
    const d = pathT * (l1 + (y1 - y0));
    return d <= l1 ? `${x0},${y0} ${x0 + d},${y0}` : `${x0},${y0} ${WH},${y0} ${WH},${y0 + d - l1}`;
  })();
  const slotBox = g >= SLOTBOX && g < K.modern + 10 ? sp(g, SLOTBOX, SNAP) * (1 - tw(g, K.modern + 2, 7, E.in)) : 0;

  /* ---------------- s12 modules */
  const modules = MOD_LAND.map((land, i) => {
    // lowered on its cable: inches down into view, then is set down (still moving when it meets the brackets)
    const y = MOD.top + (g < land - 10 ? lerp(-300, -64, E.inOut(clamp01((g - (land - 28)) / 18))) : -64 * (1 - descend(clamp01((g - (land - 10)) / 10))));
    const [sx, sy] = impact(g, land, 0.1, 9);
    const lamp = Math.max(g >= land + 5 ? Math.min(1, sp(g, land + 5, SNAP)) : 0, 0) * (0.85 + 0.15 * butFlare) + 0.4 * butFlare;
    const hook = g < land + 8 ? y - 16 : MOD.top - 16 - 560 * tw(g, land + 8, 16, E.in);
    return {i, x: MOD.xs[i], y, sx, sy, lamp, on: g >= land - 28, hook, landed: g >= land};
  });
  // each add-on, once bolted on, feeds the same scorer: its bars re-evaluate briefly and settle where they were
  const shimmer = MOD_LAND.reduce((a, f) => a + bell(g, f + 7, 18), 0);
  const drain = g >= BUT_GLOW + 2 && g < BUT_GLOW + 22 ? (g - BUT_GLOW - 2) / 20 : -1;

  /* ---------------- chips (s09) */
  const chipIn = (f: number) => (g >= f ? Math.min(1.1, sp(g, f, SNAP)) * (1 - tw(g, CHIPS_OUT, 6, E.in)) : 0);
  const wholeChip = chipIn(WHOLE_HOPS[2] + 2);
  const fragChip = chipIn(FRAG_HOPS[2] + 2);
  const centre = (k: number) => L.X0[k] + L.W[k] / 2;

  /* ---------------- tokenizer sign */
  const signY = drop(g, KA.signLand, 520, 9) - 640 * tw(g, KA.signOut, 14, E.in);
  const signRot = 2.4 * ring(g, KA.signLand, 0.5, 0.11);
  const signOn = g >= KA.signLand - 10 && g < KA.signOut + 16;


  return (
    <AbsoluteFill style={{background: C.blueLight, overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Layer depth={0.72}>
          <WallArt />
        </Layer>
        <Layer depth={1}>
          <FloorBand />
          <Rods dip={housingDy} />

          {/* s12: cables and modules on the roof */}
          {modules.map((m) =>
            m.on ? (
              <React.Fragment key={m.i}>
                <div style={{position: 'absolute', left: m.x + MOD.w / 2 - 3, top: -1600, width: 6, height: 1600 + m.hook, background: C.ink}} />
                <div style={{position: 'absolute', left: m.x + MOD.w / 2 - 12, top: m.hook - 6, width: 24, height: 22, border: `5px solid ${C.ink}`, borderTop: 'none', borderRadius: '0 0 12px 12px', boxSizing: 'border-box'}} />
              </React.Fragment>
            ) : null,
          )}

          {/* s11: readout cards slide out from behind the housing on rails */}
          {[c1, c2].map((u, i) =>
            u > 0.001 ? (
              <React.Fragment key={i}>
                <div style={{position: 'absolute', left: lerp(CARD.inX, CARD.outX, u) + CARD.w - 10, top: CARD.y[i] + (i ? CARD.h2 : CARD.h) / 2 - 9, width: Math.max(0, M.x0 + 30 - (lerp(CARD.inX, CARD.outX, u) + CARD.w - 10)), height: 18, background: C.blueDeep, border: `3px solid ${C.ink}`, boxSizing: 'border-box'}} />
                {i === 0 ? (
                  <ReadoutCard
                    x={lerp(CARD.inX, CARD.outX, u)}
                    y={CARD.y[0]}
                    label="WHAT THE SCORE MEASURES"
                    labelColor={C.blueDeep}
                    border={C.ink}
                    head={
                      <>
                        How{' '}
                        <span style={{backgroundImage: `linear-gradient(${C.saffronLight}, ${C.saffronLight})`, backgroundRepeat: 'no-repeat', backgroundSize: `${likelySweep * 100}% 100%`, boxShadow: likelySweep > 0.98 ? `inset 0 -5px 0 0 ${C.saffronDeep}` : 'none', borderRadius: 4, padding: '0 3px', margin: '0 -3px'}}>likely</span>{' '}
                        the chunk is
                      </>
                    }
                    right={
                      <svg width={40} height={56} style={{position: 'absolute', left: CARD.w + 2, top: CARD.h / 2 - 28, transform: `translateX(${6 * bell(g, K.likely, 12)}px)`}}>
                        <path d="M 6 6 L 34 28 L 6 50 Z" fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
                      </svg>
                    }
                  />
                ) : (
                  <ReadoutCard
                    x={lerp(CARD.inX, CARD.outX, u)}
                    y={CARD.y[1]}
                    h={CARD.h2}
                    label="TRUTH METER"
                    labelColor={C.coralDeep}
                    border={stampT ? C.coral : C.ink}
                    sx={c2sx}
                    sy={c2sy}
                    head={<>Whether it’s true</>}
                    right={
                      <>
                        <div style={{position: 'absolute', left: CARD.w - 74, top: 16, width: 52, height: 52, borderRadius: 26, background: lampLit ? C.saffron : '#3A4757', border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box', boxShadow: lampLit ? `0 0 26px 10px rgba(255,199,68,0.85)` : 'inset -6px -6px 0 rgba(0,0,0,0.25)'}} />
                        <div style={{position: 'absolute', left: 24, top: 140, fontFamily: F.body, fontWeight: 800, fontSize: 23, letterSpacing: '0.05em', color: C.inkMuted}}>READING</div>
                        <div style={{position: 'absolute', left: 168, top: 166, width: 320, height: 0, borderTop: `3px dashed ${C.inkMuted}`}} />
                        {stampT > 0 && (
                          <div style={{position: 'absolute', left: 330, top: 152, transform: `translate(-50%, -50%) scale(${stampScale})`}}>
                            <StampMark text="Not measured" tone="coral" t={1} size={36} rotate={-7} />
                          </div>
                        )}
                      </>
                    }
                  />
                )}
              </React.Fragment>
            ) : null,
          )}

          <HousingBack power={power} dy={housingDy} />

          {/* panel rows: fav highlight, bars, % drums, candidate tiles rolling in their slot windows */}
          {power > 0 && (
            <div style={{position: 'absolute', left: 0, top: housingDy, opacity: power}}>
              {[0, 1, 2, 3, 4].map((i) => {
                const ry = M.rowY(i);
                const tc = cur && i < cur.cands.length ? tilesCur[i] : undefined;
                const v = cur && tc ? barValue(cur, i, t) : 0;
                const alive = cur && tc ? tc.inT > 0.3 && t < Math.min(exitAt(cur, i, nxt) + 2, cur.land + 7) : false;
                const breathe = cur && t >= cur.fav ? (0.6 + 3.2 * shimmer) * Math.sin(g / (shimmer > 0.05 ? 2.6 : 9) + i * 1.7) : 0;
                const full = cur ? Math.max(40, Math.max(...cur.cands.map((cc) => cc.p)) * 1.2) : 40;
                const pulse = cur === C15 ? bell(g, PULSES[i], 10) : 0;
                const favT = tc && i === 0 ? tc.favT * (1 - tw(t, exitAt(cur!, 0, nxt), 4)) : 0;
                const dimT = tc ? tc.dimT : 0;
                const fillW = alive ? clamp01((v + breathe) / full) * (M.barX1 - M.barX0) : 0;
                const isHover = cur === C15 && i === 0;
                // the slot window is a reel: an incoming candidate pushes the outgoing one down, so they never overlap
                const prevR = tilesPrev[i] && tilesPrev[i].visible ? tilesPrev[i] : undefined;
                const curR = tc && tc.visible ? tc : undefined;
                const inWin = [...(prevR ? [curR ? {...prevR, y: Math.max(prevR.y, curR.y + M.rowH)} : prevR] : []), ...(curR ? [curR] : [])].filter((r) => r.y < M.rowH);
                return (
                  <React.Fragment key={i}>
                    {favT > 0 && <div style={{position: 'absolute', left: M.screen.x0 + 6, top: ry - 4, width: M.rowRight - M.screen.x0 + 2, height: TILE.H + 8, borderRadius: 12, background: `rgba(255,214,102,${0.55 * favT})`}} />}
                    <div style={{position: 'absolute', left: M.barX0, top: ry + 17, width: M.barX1 - M.barX0, height: 34, borderRadius: 17, background: C.paperDeep, border: `2px solid ${mix(C.ink, C.inkMuted, 0.5 * dimT)}`, boxSizing: 'border-box', overflow: 'hidden', transform: `scaleY(${1 + 0.28 * pulse})`, boxShadow: pulse > 0 ? `0 0 ${18 * pulse}px ${6 * pulse}px rgba(255,199,68,0.8)` : undefined}}>
                      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: fillW, background: mix(favT > 0.5 ? C.saffron : C.blue, C.inkMuted, dimT * 0.55), borderRight: fillW > 2 ? `3px solid ${C.ink}` : 'none'}} />
                    </div>
                    {alive && <RollPct v={v} x1={M.pctX1} y={ry + 12} size={38} color={mix(C.ink, C.inkMuted, dimT)} />}
                    <div style={{position: 'absolute', left: M.win0, top: ry - 4, width: M.rowRight + 4 - M.win0, height: M.rowH, overflow: 'hidden', borderRadius: 10, background: '#F2EAD5', boxShadow: 'inset 0 4px 0 rgba(22,42,50,0.10)'}}>
                      <div style={{position: 'absolute', left: 4, right: 4, top: TILE.H + 5, height: 4, borderRadius: 2, background: 'rgba(63,85,96,0.35)'}} />
                      {inWin.map((r, j) => {
                        const w = tokWidth(r.cand.t);
                        return (
                          <Tile
                            key={j}
                            x={6}
                            y={4 + r.y + (isHover && r === curR ? -3 * Math.sin(g * 0.28) * hover : 0)}
                            w={w}
                            text={r.cand.t}
                            look={r.look}
                            glow={isHover && r === curR ? 0.6 * hover * (0.6 + 0.4 * Math.sin(g * 0.28)) : 0}
                            shadow={false}
                          />
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })}
              {/* the winner's anticipation squash happens in its slot */}
              {flying
                .filter((f) => f.inRow)
                .map((f) => (
                  <Tile key={`a${f.c.k}`} x={f.x} y={f.y} w={f.w} text={TOK[f.c.k].text} look={LOOK.fresh} sx={f.sx} sy={f.sy} origin="100% 50%" shadow={false} />
                ))}
            </div>
          )}

          {/* tiles travelling: into the chute and down it */}
          {flying
            .filter((f) => !f.inRow)
            .map((f) => (
              <Tile key={`f${f.c.k}`} x={f.x} y={f.y + housingDy * (f.y < M.chuteBot ? 1 : 0)} w={f.w} text={TOK[f.c.k].text} look={LOOK.fresh} sx={f.sx} sy={f.sy} rot={f.rot} origin="50% 50%" />
            ))}

          <ChuteFront dy={housingDy} gateOpen={Math.max(...CYCLES.map((c) => bell(t, c.latch, 6)), 0)} />
          <Header dy={housingDy} lamps={lamps} standby={standby} mode={mode} modeOn={modeOn} glow={0.6 * butFlare} />

          {/* s12: brackets and modules */}
          {[0, 1, 2].map((i) => {
            const up = g >= BRACKETS[i] ? Math.min(1.15, sp(g, BRACKETS[i], SNAP)) : 0;
            if (up <= 0) return null;
            const clamp = modules[i].landed ? tw(g, MOD_LAND[i] + 2, 4, E.back) : 0;
            return (
              <div key={i} style={{position: 'absolute', left: 0, top: housingDy}}>
                <Bracket x={MOD.xs[i] + 26} up={up} clamp={clamp} />
                <Bracket x={MOD.xs[i] + MOD.w - 26} up={up} clamp={clamp} flip />
              </div>
            );
          })}
          {modules.map((m) =>
            m.on ? (
              <div key={m.i} style={{position: 'absolute', left: 0, top: m.landed ? housingDy : 0}}>
                <Module i={m.i} x={m.x} y={m.y} sx={m.sx} sy={m.sy} lamp={m.lamp} />
                {/* bolt flash where the module meets its brackets */}
                {g >= MOD_LAND[m.i] + 2 && g < MOD_LAND[m.i] + 9 && (
                  <>
                    {[26, MOD.w - 26].map((dx) => (
                      <div key={dx} style={{position: 'absolute', left: m.x + dx - 18, top: M.headTop - 30, width: 36, height: 36, borderRadius: 18, background: `rgba(255,240,190,${0.9 * (1 - (g - MOD_LAND[m.i] - 2) / 7)})`, boxShadow: '0 0 18px 8px rgba(255,233,168,0.7)'}} />
                    ))}
                  </>
                )}
              </div>
            ) : null,
          )}
          {/* "But": the add-ons' glow drains down into the old core */}
          {drain >= 0 && (
            <div style={{position: 'absolute', left: M.x0 + 10, top: lerp(M.headTop, M.lipTop - 40, E.inOut(drain)) + housingDy, width: M.x1 - M.x0 - 20, height: 60, background: 'linear-gradient(rgba(255,233,168,0), rgba(255,233,168,0.55), rgba(255,233,168,0))', opacity: Math.sin(drain * Math.PI)}} />
          )}

          {/* s08: the scan beam and the slip on the reader ledge */}
          {scanT >= 0 && (
            <div style={{position: 'absolute', left: M.screen.x0 + 10, top: lerp(M.headBot + 6, M.lipTop - 20, E.inOut(scanT)) + housingDy, width: M.screen.x1 - M.screen.x0 - 20, height: 18, borderRadius: 9, background: 'rgba(124,242,223,0.75)', boxShadow: '0 0 30px 14px rgba(124,242,223,0.45)', opacity: Math.sin(scanT * Math.PI) * 0.9 + 0.1}} />
          )}
          {slipOn && (
            <div style={{position: 'absolute', left: -3000, top: -3000, width: 7000, height: 3000 + M.lipTop + 4 + housingDy, overflow: 'hidden'}}>
              <div
                style={{
                  position: 'absolute',
                  left: 3000 + slipCx - SLIP_W / 2 + slipShake,
                  top: 3000 + slipTop0 + slipFall + slipAnt + slipSink + housingDy,
                  width: SLIP_W,
                  height: SLIP_H,
                  transform: `rotate(${slipRot}deg) scale(${slipS * slipSx}, ${slipS * slipSy})`,
                  transformOrigin: '50% 100%',
                }}
              >
                <AnswerSlipArt i={0} marks={SLIP_A_FINAL.marks} stamps={SLIP_A_FINAL.stamps} />
                {scanT >= 0 && (
                  <div style={{position: 'absolute', left: 0, right: 0, top: lerp(-20, SLIP_H, E.inOut(scanT)), height: 16, background: 'rgba(124,242,223,0.35)', mixBlendMode: 'multiply'}} />
                )}
              </div>
            </div>
          )}
          <Lip dy={housingDy} slot={g >= SWALLOW && g < FLAP ? 1 : 0} />
          <IllustrativeTag dy={housingDy} flip={g >= TAG_FLIP ? Math.min(1.08, asp(g, TAG_FLIP, SNAP)) : 0} swing={3 * ring(g, TAG_FLIP + 6, 0.45, 0.1) + 1.6 * ring(g, STAMP, 0.6, 0.12) + 0.8 * landRing} />

          {/* the conveyor */}
          <Belt off={belt} />
          {/* tinted underline marks on the belt under whole words / fragments */}
          {[...WHOLE.map((k, i) => ({k, f: WHOLE_HOPS[i], col: C.teal})), ...FRAG.map((k, i) => ({k, f: FRAG_HOPS[i], col: C.saffronDeep}))].map(({k, f, col}) => {
            const u = tw(g, f, 6) * (1 - tw(g, CHIPS_OUT, 8, E.in));
            return u > 0 ? <div key={`u${k}`} style={{position: 'absolute', left: L.X0[k] + 6, top: BELT.top + 8, width: (L.W[k] - 12) * u, height: 8, borderRadius: 4, background: col}} /> : null;
          })}

          {/* the printed strip (s08) */}
          {printing && g < SPLIT0 && (
            <div style={{position: 'absolute', left: -3000, top: 0, width: 3000 + WH, height: 1200, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 3000 + L.strip.left + stripShift, top: TILE.top, width: L.strip.right - L.strip.left, height: TILE.H, background: C.cream, border: `${TILE.B}px solid ${C.ink}`, borderRadius: 6, boxSizing: 'border-box', boxShadow: `3px 4px 0 ${C.shadow}`}} />
              {TOK.slice(0, PREFIX).map((tk, k) => (
                <div key={k} style={{position: 'absolute', left: 3000 + L.strip.textX[k] + stripShift, top: TILE.top + TILE.B + (TILE.H - 2 * TILE.B - TILE.lh) / 2, height: TILE.lh, lineHeight: `${TILE.lh}px`, font: TILE_FONT, color: C.ink, whiteSpace: 'pre'}}>
                  {tk.text.replace(/^ /, '')}
                </div>
              ))}
              {/* perforations */}
              {L.strip.bx.slice(1).map((bx, j) => {
                const u = tw(g, PERF0 + j * 0.8, 3);
                return u > 0 ? <div key={j} style={{position: 'absolute', left: 3000 + bx + stripShift - 2, top: TILE.top + 4, width: 0, height: (TILE.H - 8) * u, borderLeft: `3px dashed ${C.inkMuted}`}} /> : null;
              })}
            </div>
          )}
          {/* paper still feeding out of the write head */}
          {printing && L.strip.right + stripShift > WH - 4 && (
            <div style={{position: 'absolute', left: WH - 26, top: M.mouthBot - 8 + housingDy, width: 26, height: TILE.top + 20 - M.mouthBot, background: C.cream, borderLeft: `3px solid ${C.ink}`, borderRight: `3px solid ${C.ink}`}} />
          )}

          {/* tiles on the belt */}
          {sentence}

          {/* Kal / ai: lift, crack, return (drawn above the row) */}
          {kalActive && (
            <>
              {kal[0].liftU > 0.05 && kal[0].u < 1 && (
                <div style={{position: 'absolute', left: L.X0[KAL[0]] - S - 4, top: TILE.top - 4, width: L.X0[KAL[1]] + L.W[KAL[1]] - L.X0[KAL[0]] + 8, height: TILE.H + 8, border: `4px dashed ${C.blue}`, borderRadius: 12, boxSizing: 'border-box', background: 'rgba(79,124,201,0.10)'}} />
              )}
              {kal.map((h) => (
                <Tile
                  key={h.k}
                  x={h.x}
                  y={TILE.top + h.y}
                  w={h.w}
                  text={TOK[h.k].text}
                  look={tint(h.k)}
                  sx={h.s}
                  sy={h.s}
                  rot={h.rot}
                  origin={`${h.originX}px ${TILE.H}px`}
                  padL={h.padL}
                  padR={h.padR}
                  bl={h.bl}
                  br={h.br}
                  glow={0.35 * h.liftU * (1 - h.u)}
                />
              ))}
              {/* crack down the seam */}
              {g >= KA.crack && g < KA.kalSep + 4 && (() => {
                const h = kal[0];
                const seamX = h.x + h.originX + (h.w - h.originX) * h.s;
                const top = TILE.top + h.y + TILE.H * (1 - h.s);
                const H = TILE.H * h.s;
                return (
                  <svg width={40} height={H + 20} style={{position: 'absolute', left: seamX - 20, top: top - 10, overflow: 'visible'}}>
                    <polyline points={`20,0 27,${H * 0.22} 14,${H * 0.42} 26,${H * 0.6} 15,${H * 0.8} 21,${H + 20}`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tw(g, KA.crack, 4)} />
                  </svg>
                );
              })()}
              {/* token ids (real o200k_base ids) */}
              {[
                {h: kal[0], f: KA.kalId, back: KA.backKal, label: `id ${TOK[KAL[0]].id}`},
                {h: kal[1], f: KA.aiId, back: KA.backAi, label: `id ${TOK[KAL[1]].id}`},
              ].map(({h, f, back, label}) => {
                // each label leaves with its own tile
                const u = g >= f ? Math.min(1.1, sp(g, f, SNAP)) * (1 - tw(g, back - 1, 4, E.in)) : 0;
                if (u <= 0) return null;
                const cx = h.x + h.originX + (h.w / 2 - h.originX) * h.s;
                return (
                  <div key={label} style={{position: 'absolute', left: cx - 100, width: 200, top: TILE.top + h.y + TILE.H + 14, textAlign: 'center', transform: `scale(${u})`, transformOrigin: '50% 0%', fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.blueDeep}}>
                    {label}
                  </div>
                );
              })}
            </>
          )}

          {/* s11: the year being written, and its empty last-digit slot */}
          {underT > 0 && <div style={{position: 'absolute', left: L.X0[13] - S, top: BELT.top + 8, width: (WH + L.W[PREFIX] / 2 - (L.X0[13] - S)) * underT, height: 9, borderRadius: 5, background: C.saffronDeep}} />}
          {slotBox > 0 && (
            <div style={{position: 'absolute', left: WH - L.W[PREFIX] / 2, top: TILE.top, width: L.W[PREFIX], height: TILE.H, border: `5px dashed ${C.saffronDeep}`, borderRadius: 10, boxSizing: 'border-box', background: 'rgba(255,233,168,0.9)', transform: `scale(${slotBox})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontWeight: 700, fontSize: TILE.font, color: C.ink}}>
              ?
            </div>
          )}
          {/* s11: where the favoured '2' would go — along its lane, down the chute, into the year's empty slot */}
          {pathT > 0 && (
            <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: pathOut}}>
              <polyline points={pathPts} fill="none" stroke={C.saffronDeep} strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" strokeLinejoin="round" />
              {pathT > 0.92 && <path d={`M ${WH - 16} ${TILE.top - 34} L ${WH} ${TILE.top - 12} L ${WH + 16} ${TILE.top - 34}`} fill="none" stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          )}
          {caretOn && <div style={{position: 'absolute', left: lastTile + 8, top: TILE.top + 8, width: 5, height: TILE.H - 16, borderRadius: 2, background: C.ink}} />}

          {/* s09 chips: what the colours mean */}
          {wholeChip > 0 && (
            <div style={{position: 'absolute', left: (centre(9) + centre(11)) / 2 - 300, width: 600, top: BELT.beamBot + 18, textAlign: 'center', transform: `scale(${wholeChip})`, transformOrigin: '50% 0%'}}>
              <Chip tone="teal" size={40}>
                whole words
              </Chip>
            </div>
          )}
          {fragChip > 0 && (
            <div style={{position: 'absolute', left: (centre(2) + centre(6)) / 2 - 300, width: 600, top: BELT.beamBot + 18, textAlign: 'center', transform: `scale(${fragChip})`, transformOrigin: '50% 0%'}}>
              <Chip tone="saffron" size={40}>
                fragments
              </Chip>
            </div>
          )}

          {/* s09: the tokenizer sign, lowered on strings */}
          {signOn && (
            <div style={{position: 'absolute', left: L.kalC - 360, width: 600, top: 424 + signY, transform: `rotate(${signRot}deg)`, transformOrigin: '50% -900px'}}>
              <div style={{position: 'absolute', left: 120, top: -1600, width: 4, height: 1604, background: C.ink}} />
              <div style={{position: 'absolute', right: 120, top: -1600, width: 4, height: 1604, background: C.ink}} />
              <div style={{textAlign: 'center'}}>
                <Chip tone="blue" size={31}>
                  GPT-4o tokenizer (o200k_base)
                </Chip>
              </div>
            </div>
          )}
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};
