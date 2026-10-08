import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, worldToScreen} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, SOFT, camKick, camPath, hop, impact, kf, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {H34} from '../lib/handoffs';
import {C, F} from '../theme';
import {Wall} from '../components/Sets';
import {Arm, Character, IDLE, Pose, handPos, mixPose, reachLocal} from '../components/Character';
import {CAST} from '../components/cast';
import {Cake} from '../components/Props';
import {Chip, Headline} from '../components/Text';
import {Sfx} from '../lib/sfx';
import {BOOK, BOOKS, Book, BookFx, Bookcase, ROWS, SLOT, bookCenter} from '../components/v2/S4_Shelves';
import {CARD_IN_W, Catalogue, drawerGeom} from '../components/v2/S4_Catalogue';
import {CARD_H, CARD_W, FILL_FONT, Flame, FillWord, HedgeTag, IndexCardV2, SLIP_H, SLIP_LINE1, SLIP_W, SealArt, SlipV2, TITLE_BOX, WordStrip} from '../components/v2/S4_Props';

/**
 * S4 — the library: what the model learned from. The clerk from the counter browses the shelves the model learned
 * from; title-shaped words are everywhere ("Methods." "Algorithms." "Machine Learning."); one researcher's title is
 * missing (the catalogue card has a blank title, the shelf has an empty place, like a birthday); so he fills the blank
 * with a title-shaped answer stitched from the shelves, and the confidence comes from the shelves too ("is entitled",
 * no "I think", no "maybe"). Opens on a match cut from S3 (H34) and leaves with the sealed slip slid out to the left.
 * Every beat is keyed to a word of the V2 narration (timeline.json); see V2_DIRECTION.md for the conventions.
 */

/* ------------------------------------------------------------------ world layout */
const D = 0.8; // depth of the bookcase layer (the clerk and the catalogue stand on the subject plane, depth 1)
const FEET = 925;
const CL_S = 1;
const X1 = 1390; // the clerk's first spot (s13–s14), by the stack of flat books
const X2 = 1070; // at the catalogue (s15–s16)
const CAT_X = 760;
const DRW = {row: 0, col: 2};
const LABELS = ['A–D', 'E–J', 'K', 'L–M', 'N–Q', 'R–S', 'T–V', 'W–Y', 'Z'];
const LABEL_FONT = 21; // drawer label text, world px (×1.9 in the medium = 40 px)
const ALGO = BOOK('algo0');
const LABEL = {x: ALGO.x + ALGO.w / 2, y: ALGO.bottom - ALGO.h / 2}; // centre of the printed word (shelf layer)

/* held objects (world, subject plane) */
const CARD_HOLD = {cx: 1060, cy: 695, s: 1};
const SLIP_HOLD = {cx: 1070, cy: 736, s: 0.8};
/** where the hands grip the held object (local px): just outside the side edges, thumbs over them */
const GRIP = {
  card: {L: {x: -6, y: CARD_H * 0.55}, R: {x: CARD_W + 6, y: CARD_H * 0.55}},
  slip: {L: {x: -6, y: SLIP_H * 0.6}, R: {x: SLIP_W + 6, y: SLIP_H * 0.32}},
};
const CAKE_S = 0.8;

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  start: scene('S4').from,
  end: scene('S4').to,
  so: at('s13', 'So'),
  why: at('s13', 'why'),
  likely: at('s13', 'likely'),
  answer13: at('s13', 'answer'),
  wrong: at('s13', 'wrong?'),
  think: at('s13', 'Think'),
  model: at('s13', 'model'),
  learned: at('s13', 'learned'),
  from: at('s13', 'from.'),
  the14: at('s14', 'The'),
  sound: at('s14', 'sound'),
  dissertation: at('s14', 'dissertation'),
  title: at('s14', 'title'),
  everywhere: at('s14', 'everywhere.'),
  methods: at('s14', 'Methods.'),
  algorithms: at('s14', 'Algorithms.'),
  machine: at('s14', 'Machine'),
  shelf: at('s14', 'Shelf'),
  after: at('s14', 'after'),
  shelf2: at('s14', 'shelf', 2),
  same: at('s14', 'same'),
  shape: at('s14', 'shape.'),
  but: at('s15', 'But'),
  one: at('s15', 'one'),
  specific: at('s15', 'specific'),
  researchers: at('s15', "researcher's"),
  titleQ: at('s15', 'title?'),
  that: at('s15', 'That'),
  might: at('s15', 'might'),
  rarely: at('s15', 'rarely,'),
  not: at('s15', 'not'),
  all: at('s15', 'all.'),
  birthday: at('s15', 'birthday,'),
  theres: at('s15', "there's"),
  no: at('s15', 'no'),
  pattern: at('s15', 'pattern'),
  work: at('s15', 'work'),
  outFrom: at('s15', 'from.'),
  so16: at('s16', 'So'),
  model16: at('s16', 'model'),
  does: at('s16', 'does'),
  built: at('s16', 'built'),
  doIt: at('s16', 'do.'),
  fills: at('s16', 'fills'),
  gap: at('s16', 'gap'),
  shaped: at('s16', 'title-shaped'),
  answer: at('s16', 'answer.'),
  confidence: at('s16', 'confidence'),
  comes: at('s16', 'comes'),
  because: at('s16', 'because'),
  part: at('s16', 'part'),
  pattern16: at('s16', 'pattern'),
  too: at('s16', 'too.'),
  is: at('s16', 'Is'),
  entitled: at('s16', 'entitled.'),
  no1: at('s16', 'No'),
  think16: at('s16', 'think.'),
  no2: at('s16', 'No', 2),
  maybe: at('s16', 'maybe.'),
  s16End: segEnd('s16'),
};

/* beats derived from the cues */
// the opening insert: on the matched close-up a hand rises into frame and pushes the "Algorithms" book flush in its
// stack; the pull-back then reveals whose hand it is (he keeps it on the book until "answer")
const HAND_IN = K.start + 2;
const PUSH = HAND_IN + 7; // hand on the book's end; the book slides home
const HAND_OFF = K.answer13 + 2;
const PULL = {start: PUSH + 2, dur: 50}; // the match-cut pull-back
const SIGN_LAND = K.think + 8;
const SIGN_UP = K.the14 - 2;
const POPS = [K.methods + 1, K.algorithms + 1, K.machine + 1]; // the three called-out spines
const CASCADE = [K.shelf, K.after, K.shelf2, K.shelf2 + 10]; // one shelf row per beat
const SAME = K.same + 2;
const STEPS = [K.shape + 2, K.shape + 12, K.shape + 22]; // three steps to the catalogue
const ARRIVE = STEPS[2] + 10;
const LABEL_TAP = K.specific + 10;
const PULL_D = K.researchers + 2; // drawer pull starts (after a 4-frame lean back)
const PLUCK = K.titleQ - 1; // fingers reach the card
const LIFT = PLUCK + 9; // card clears the drawer and is lifted to the chest
const HOLD = LIFT + 11;
const THIN = K.rarely + 4;
const RECEDE = K.not;
const OUTLINE_T = K.all + 1;
const CAKE_LAND = K.birthday + 4;
const RIPPLE = K.no + 1;
const RIPPLE_STOP = RIPPLE + 12;
const TAG_T = K.pattern + 6;
const SHRUG = K.work - 2;
const BUMP = K.built + 3; // hip meets the drawer
const FLY0 = K.fills - 3;
const FLY_DT = 6;
const FLY_DUR = 13;
const FLIP = K.answer - 4; // the finished title holds a beat; card edge-on at FLIP + 6, on "answer"
const SEAL_HIT = K.confidence + 4;
const GLINTS = K.part - 2;
const SWEEP = K.is + 3;
const TAG1 = {in: K.no1 + 3, strike: K.think16 + 1, flick: K.think16 + 9};
const TAG2 = {in: K.no2 + 2, strike: K.maybe + 1, flick: K.maybe + 7};
const EXIT = TAG2.flick + 5; // the slip is pushed out to the left
const RELEASE = EXIT + 6;
const FOOT1 = {in: K.rarely + 12, out: K.theres + 6};
const FOOT2 = {in: K.answer + 4, out: K.because + 6}; // gone before the push to the slip brings the seal down to it

/* ------------------------------------------------------------------ the s16 title words, flying from the shelves */
const FLY = [
  {id: 'boost', text: 'Boosting,'},
  {id: 'online', text: 'Online'},
  {id: 'algo1', text: 'Algorithms,'},
  {id: 'topics', text: 'and Other Topics in'},
  {id: 'mlearn1', text: 'Machine Learning.'},
];
const FILL_LINES = [[0, 1, 2], [3], [4]]; // the words' lines in the card's title box
const fillFont = `400 ${FILL_FONT}px "Source Serif 4 Variable"`;
const fillLayout = (): {x: number; y: number}[] => {
  const space = textWidth(' ', fillFont);
  const pos: {x: number; y: number}[] = [];
  FILL_LINES.forEach((line, li) => {
    const ws = line.map((k) => textWidth(FLY[k].text, fillFont));
    const total = ws.reduce((a, b) => a + b, 0) + space * (line.length - 1);
    let x = (TITLE_BOX.w - total) / 2;
    line.forEach((k, j) => {
      pos[k] = {x, y: 8 + li * FILL_FONT * 1.25};
      x += ws[j] + space;
    });
  });
  return pos;
};

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_library', dur: (K.end + 6 - K.start) / 30},
  {f: PUSH + 1, kind: 'book_slide', gain: -5, note: 'a hand pushes the Algorithms book flush in its stack (close-up)'},
  {f: PUSH + 5, kind: 'pop_tick', gain: -14, pitch: -3, note: 'the stack settles'},
  {f: SIGN_LAND, kind: 'paper_flap', gain: -6, note: 'headline card drops in on its strings'},
  {f: SIGN_LAND, kind: 'hanger_click', gain: -3},
  ...[0, 1, 2].map((i) => ({f: K.learned + 2 + i * 7, kind: 'pop_tick' as const, gain: -15, pitch: -4 + i * 2, note: 'a ripple through the books'})),
  {f: SIGN_UP, kind: 'paper_swish', gain: -14, note: 'headline card pulled up'},
  {f: K.everywhere + 1, kind: 'glint', gain: -9, note: 'title words light up across the shelves'},
  ...POPS.flatMap((f, i) => [
    {f, kind: 'book_slide' as const, pitch: i * 2, gain: -4},
    {f: f + 3, kind: 'chip_pop' as const, pitch: i * 2, gain: -3},
  ]),
  ...CASCADE.map((f, i) => ({f, kind: 'pop_tick' as const, pitch: 3 - i * 2, gain: -7, note: 'a shelf row lights'})),
  {f: SAME, kind: 'glint', gain: -7, note: 'every spine pulses at once: the same shape'},
  ...STEPS.map((f, i) => ({f: f + 9, kind: 'thud_soft' as const, gain: -16, pitch: i % 2 ? -1 : 1, note: 'footstep'})),
  {f: LABEL_TAP, kind: 'pencil_tap', gain: -6, note: 'fingertip on the K label'},
  {f: PULL_D + 2, kind: 'drawer_open'},
  {f: PULL_D + 15, kind: 'thud_soft', gain: -9, note: 'drawer end-stop'},
  {f: PULL_D + 16, kind: 'pop_tick', gain: -12, pitch: 5, note: 'cards rattle'},
  {f: PLUCK + 2, kind: 'card_slide', note: 'card drawn up out of the drawer'},
  {f: LIFT + 2, kind: 'paper_lift', gain: -10},
  {f: THIN, kind: 'paper_flap', gain: -15, pitch: 4, note: 'the thin book thins'},
  {f: RECEDE + 2, kind: 'book_slide', gain: -7, pitch: -3, note: 'the book slides back into the dark'},
  {f: RECEDE + 10, kind: 'thud_soft', gain: -14, note: 'hollow knock'},
  {f: OUTLINE_T, kind: 'marker_circle', note: 'dashed outline round the empty place'},
  {f: FOOT1.in, kind: 'paper_slide', gain: -12, note: 'guard-rail strip'},
  {f: CAKE_LAND, kind: 'chip_pop', pitch: -5, note: 'the cake hops into the slot'},
  {f: CAKE_LAND, kind: 'thud_soft', gain: -6},
  {f: RIPPLE, kind: 'glint', gain: -11},
  {f: RIPPLE_STOP, kind: 'thud_soft', gain: -10, pitch: -3, note: 'the ripple stops dead at the cake'},
  {f: TAG_T, kind: 'hanger_click', gain: -3, note: 'label flips down'},
  {f: FOOT1.out, kind: 'paper_swish', gain: -16},
  {f: K.so16 + 14, kind: 'hanger_click', gain: -8, note: 'label flips back up'},
  {f: BUMP, kind: 'drawer_close', note: 'hip-bumped shut'},
  ...FLY.flatMap((_, i) => [
    {f: FLY0 + i * FLY_DT, kind: 'paper_lift' as const, gain: -11, pitch: i},
    {f: FLY0 + i * FLY_DT + FLY_DUR, kind: 'pop_tick' as const, gain: -6, pitch: i * 2},
  ]),
  {f: FLIP + 6, kind: 'card_flick', note: 'card flips into the polished slip'},
  {f: FLIP + 13, kind: 'glint', gain: -8},
  {f: FOOT2.in, kind: 'paper_slide', gain: -14},
  {f: SEAL_HIT - 12, kind: 'paper_lift', gain: -12, note: 'the gold seal peels off a spine'},
  {f: SEAL_HIT, kind: 'stamp_heavy', note: 'seal slams onto the slip'},
  ...[0, 1, 2].map((i) => ({f: GLINTS + 4 + i * 8, kind: 'glint' as const, gain: -12, pitch: i * 2, note: 'the same seal glints along the shelves'})),
  {f: SWEEP, kind: 'marker_sweep'},
  {f: TAG1.in + 4, kind: 'paper_flap', gain: -10},
  {f: TAG1.strike, kind: 'marker_sweep', pitch: 2, gain: -3},
  {f: TAG1.flick, kind: 'card_flick'},
  {f: TAG2.in + 3, kind: 'paper_flap', gain: -10, pitch: 3},
  {f: TAG2.strike, kind: 'marker_sweep', pitch: 4, gain: -3},
  {f: TAG2.flick, kind: 'card_flick', pitch: 3},
  {f: EXIT + 2, kind: 'paper_swish', note: 'the sealed slip slid out to the left (into S5)'},
];

/* ------------------------------------------------------------------ camera */
const W2 = 960;
const H2 = 540;
/** camera that puts layer point (x, y, depth d) at screen (sx, sy) with zoom */
const centerOn = (x: number, y: number, d: number, zoom: number, sx = W2, sy = H2): Cam => {
  const z = 1 + (zoom - 1) * d;
  return {cx: W2 - (sx - W2 - (x - W2) * z) / (d * zoom), cy: H2 - (sy - H2 - (y - H2) * z) / (d * zoom), zoom};
};
const Z0 = 1 + (H34.fontPx / ALGO.plate!.font - 1) / D; // the label's word at H34.fontPx on screen
const SHOTS = {
  wide: {cx: 1000, cy: 500, zoom: 1.06},
  wideIn: {cx: 1030, cy: 505, zoom: 1.1},
  med: {cx: 1650, cy: 612, zoom: 1.55}, // the catalogue is fully out of frame-left (no sliver); the slot is filled
  wide2: {cx: 980, cy: 500, zoom: 1.0},
  cab: {cx: 965, cy: 680, zoom: 1.9},
  card: {cx: 1060, cy: 622, zoom: 2.62},
  slot: {cx: 1010, cy: 590, zoom: 2.0},
  slotIn: {cx: 1000, cy: 588, zoom: 2.06},
  fill: {cx: 990, cy: 590, zoom: 2.06},
  slip: {cx: 1060, cy: 676, zoom: 2.12}, // the seal clears the guard-rail footer even at its dip
  ent: {cx: 1060, cy: 650, zoom: 2.3}, // the cake (flame included) stays inside the top edge
};
const camAt = (g: number): Cam => {
  if (g < PULL.start + PULL.dur) {
    // pull back from the printed word: log-zoom so the dolly feels even, the word drifting to its place in the wide
    const u = tw(g, PULL.start, PULL.dur, E.inOut);
    const zoom = Math.exp(lerp(Math.log(Z0), Math.log(SHOTS.wide.zoom), u));
    const end = worldToScreen(SHOTS.wide, LABEL.x, LABEL.y, D);
    return centerOn(LABEL.x, LABEL.y, D, zoom, lerp(H34.cx, end.x, u), lerp(H34.cy, end.y, u));
  }
  const c = camPath(g, SHOTS.wide, [
    {at: K.think, dur: K.from + 10 - K.think, to: SHOTS.wideIn, ease: E.inOut},
    {at: K.the14, dur: 22, to: SHOTS.med},
    {at: K.shelf - 2, dur: 20, to: SHOTS.wide2},
    {at: STEPS[2] - 4, dur: 22, to: SHOTS.cab},
    {at: PLUCK + 2, dur: 20, to: SHOTS.card},
    {at: K.might + 2, dur: 18, to: SHOTS.slot},
    {at: K.might + 22, dur: K.so16 - K.might - 24, to: SHOTS.slotIn, ease: E.inOut},
    {at: K.so16 + 4, dur: 70, to: SHOTS.fill, ease: E.inOut},
    {at: FLIP + 2, dur: 20, to: SHOTS.slip},
    {at: SEAL_HIT + 8, dur: K.is - SEAL_HIT - 6, to: SHOTS.ent, ease: E.inOut},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [SEAL_HIT], 0.016)};
};

/** the subject-plane (depth 1) point that sits on screen exactly where shelf-layer point (x, y) sits */
const shelfToWorld = (cam: Cam, x: number, y: number) => {
  const s = worldToScreen(cam, x, y, D);
  return {x: cam.cx + (s.x - W2) / cam.zoom, y: cam.cy + (s.y - H2) / cam.zoom};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
/** a one-shot 0→1→0 bump with a small settle: for spines that tip out and fall back */
const bump = (g: number, t0: number, dur = 10) => (g < t0 ? 0 : g < t0 + dur ? Math.sin(((g - t0) / dur) * Math.PI) : -0.25 * ring(g, t0 + dur, 0.9, 0.35));

/* ------------------------------------------------------------------ the clerk: where he stands */
const clerkX = (g: number) => {
  let x = X1;
  STEPS.forEach((t) => {
    x += ((X2 - X1) / 3) * tw(g, t, 10, E.inOut);
  });
  // the hip bump: a quick shift towards the drawer and back
  x += -20 * bell(g, BUMP - 5, 14);
  return x;
};
const stepBob = (g: number) => STEPS.reduce((acc, t) => acc + (g >= t && g < t + 10 ? -7 * Math.sin(((g - t) / 10) * Math.PI) : 0) + 3 * bell(g, t + 9, 5), 0);

/* ------------------------------------------------------------------ the drawer */
const drawerOpen = (g: number) => {
  // a little stick, then out with a long deceleration, a hair past the end, settle; hip-bumped shut later
  let k = kf(g, [
    [PULL_D, 0],
    [PULL_D + 2, 0.02, E.in],
    [PULL_D + 13, 1.05, E.decel],
    [PULL_D + 17, 0.985, E.inOut],
    [PULL_D + 21, 1, E.inOut],
  ]);
  if (g >= BUMP) k = kf(g, [[BUMP, 1], [BUMP + 6, 0, E.in], [BUMP + 9, 0.05, E.out], [BUMP + 12, 0, E.in]]);
  return k;
};
const drawerWorld = (g: number) => {
  const d = drawerGeom(DRW.row, DRW.col, drawerOpen(g));
  const o = (p: {x: number; y: number}) => ({x: CAT_X + p.x, y: FEET + p.y});
  return {d, pull: o(d.pull), label: o(d.label), frontTop: FEET + d.fy, card: {cx: CAT_X + d.card.cx, top: FEET + d.card.top}};
};

/* ------------------------------------------------------------------ the held object (card → slip) */
type Held = {cx: number; cy: number; w: number; h: number; s: number; sx: number; rot: number; kind: 'card' | 'slip' | 'none'; clipY?: number; off?: number};
const flipU = (g: number) => tw(g, FLIP, 13, E.inOut);
const heldAt = (g: number): Held => {
  if (g < PLUCK) return {cx: 0, cy: 0, w: 0, h: 0, s: 0, sx: 1, rot: 0, kind: 'none'};
  const dw = drawerWorld(g);
  const sIn = CARD_IN_W / CARD_W;
  // 1. drawn straight up out of the box (clipped by the front's top edge)
  const rise = tw(g, PLUCK + 2, 8, E.inOut) * 100;
  const inBox = {cx: dw.card.cx, cy: dw.card.top + (CARD_H * sIn) / 2 - rise, s: sIn};
  // 2. lifted towards the face, growing as it comes forward; a small overshoot and settle
  const l = tw(g, LIFT, 11, E.inOut);
  const settle = 3 * ring(g, HOLD, 0.7, 0.3);
  // the card follows the body (steps, hip bump, shrug, puff)
  const bx = clerkX(g) - X2;
  const by = -14 * bell(g, SHRUG, 22) + bodyBob(g) * 0.6;
  let cx = lerp(inBox.cx, CARD_HOLD.cx, l) + bx;
  let cy = lerp(inBox.cy, CARD_HOLD.cy, l) + settle + by;
  const s = lerp(sIn, CARD_HOLD.s, l);
  let rot = lerp(0, -2, l) + 1.2 * Math.sin((g - HOLD) / 40) * tw(g, HOLD, 20);
  // examining: tilts it towards himself a little on "title?"; raises it in the shrug
  rot += -2.5 * bell(g, K.titleQ + 18, 40);
  // the flip into the slip: edge-on half way, the slip is larger
  const u = flipU(g);
  const sx = Math.abs(Math.cos(u * Math.PI));
  if (u >= 0.5) {
    const v = tw(g, FLIP + 6, 10, E.out);
    cx = lerp(cx, SLIP_HOLD.cx + bx, v);
    cy = lerp(cy, SLIP_HOLD.cy + by, v);
    // seal impact: the slip dips in his hands and recoils
    const dip = g >= SEAL_HIT ? 7 * Math.exp(-(g - SEAL_HIT) * 0.32) * Math.cos((g - SEAL_HIT) * 0.6) : 0;
    cy += dip;
    // sways after each flick
    const sway = 1.6 * ring(g, TAG1.flick, 0.5, 0.15) - 1.4 * ring(g, TAG2.flick, 0.55, 0.16);
    // presenting on "Is entitled": tilted a touch towards camera
    const present = -1.5 * bell(g, K.is - 2, 40);
    // the exit: pushed to the left, accelerating out of frame
    const out = g < EXIT ? 0 : g < RELEASE ? 120 * tw(g, EXIT, 6, E.in) : 120 + (g - RELEASE) * 52 + (g - RELEASE) ** 2 * 4;
    return {cx: cx - out, cy: cy - (g >= EXIT ? 8 * tw(g, EXIT, 8) : 0), w: SLIP_W, h: SLIP_H, s: SLIP_HOLD.s, sx: Math.max(0.02, sx) * lerp(1.08, 1, v), rot: -2 + sway + present - (g >= EXIT ? 4 * tw(g, EXIT, 10) : 0), kind: 'slip', off: out};
  }
  return {cx, cy, w: CARD_W, h: CARD_H, s, sx: Math.max(0.02, sx), rot, kind: 'card', clipY: g < LIFT + 4 ? dw.frontTop : undefined};
};
/** world point of a held-object local point (lx, ly) */
const heldToWorld = (h: Held, lx: number, ly: number) => {
  const r = (h.rot * Math.PI) / 180;
  const dx = (lx - h.w / 2) * h.s * h.sx;
  const dy = (ly - h.h / 2) * h.s;
  return {x: h.cx + dx * Math.cos(r) - dy * Math.sin(r), y: h.cy + dx * Math.sin(r) + dy * Math.cos(r)};
};

/* ------------------------------------------------------------------ the clerk: poses */
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});
const bodyBob = (g: number) =>
  stepBob(g) - 5 * bell(g, SAME - 2, 22) - 5 * bell(g, SHRUG, 22) - 4 * tw(g, SEAL_HIT + 4, 8) * (1 - tw(g, K.is + 20, 20)) - 8 * bell(g, POPS[2] - 4, 14);

type Body = {x: number; y: number; scale: number; bob: number; lean: number};
/** reach() that also undoes the body lean (Character rotates the body about local (0, -150)) */
const reachB = (ch: Body, side: -1 | 1, wx: number, wy: number, elbow: 1 | -1 = 1): Arm => {
  const lx = (wx - ch.x) / ch.scale;
  const ly = (wy - ch.y) / ch.scale - ch.bob;
  const r = (-ch.lean * Math.PI) / 180;
  const dy = ly + 150;
  return reachLocal(lx * Math.cos(r) - dy * Math.sin(r), -150 + lx * Math.sin(r) + dy * Math.cos(r), side, elbow);
};
/** world position of a hand, including the body lean */
const handB = (ch: Body, arm: Arm, side: -1 | 1) => {
  const h = handPos(arm, side);
  const r = (ch.lean * Math.PI) / 180;
  const dy = h.hy + 150;
  const x = h.hx * Math.cos(r) - dy * Math.sin(r);
  const y = -150 + h.hx * Math.sin(r) + dy * Math.cos(r);
  return {x: ch.x + x * ch.scale, y: ch.y + (y + ch.bob) * ch.scale};
};

/** both hands grip the held object from behind (thumbs over the edges) from the moment the fingers take the card,
 *  while it is still inside the drawer (so the forearms never cross its face on the way up to the chest), until the exit */
const behindMode = (g: number) => g >= PLUCK && g < RELEASE + 14;

const clerkPose = (g: number, cam: Cam, held: Held): {pose: Pose; life: number; body: Body; grip: {L: number; R: number}} => {
  const x = clerkX(g);
  const look = (wx: number, wy: number) => ({lookX: clamp((wx - x) / 260, -1, 1), lookY: clamp((wy - (FEET - 378)) / 200, -1, 1)});

  /* ---- s13: looks the stack over; pushes the Algorithms book flush; "wrong?" — who, me?; presents the shelves */
  const onBook = tw(g, HAND_IN, 7, E.out) * (1 - tw(g, HAND_OFF, 8, E.inOut));
  let p = P({lookX: 0.95, lookY: 0.45, mouth: 'hmm', brows: 0.35, tilt: 4, lean: 2.5 * onBook});
  // the book slides home: a small satisfied smile
  p = mixPose(p, P({...p, mouth: 'smile', brows: 0.5}), tw(g, PUSH + 6, 6));
  // "the likely answer": he looks up to us, his hand still on the book
  const likelyLook = tw(g, K.likely - 3, 7) * (1 - tw(g, K.wrong - 3, 5));
  p = mixPose(p, P({lookX: 0.15, lookY: 0.05, mouth: 'smile', brows: 0.7, tilt: -3, lean: p.lean}), likelyLook);
  const who = tw(g, K.wrong, 6) * (1 - tw(g, K.think + 6, 8));
  p = mixPose(p, P({lookX: 0, lookY: 0.05, brows: 0.95, mouth: 'o', tilt: -6, bob: -3}), who);
  if (g > K.wrong + 12 && who > 0.5) p = {...p, mouth: 'flat'};
  // the sign drops: glance up at it
  p = mixPose(p, P({...p, lookX: -0.3, lookY: -0.95, brows: 0.6, mouth: 'smile'}), tw(g, SIGN_LAND - 4, 6) * (1 - tw(g, K.model, 8)));
  // "what the model learned from": presents the shelves, eyes ride the ripple out from his hand
  const present = tw(g, K.model - 2, 8) * (1 - tw(g, K.the14 - 2, 8));
  p = mixPose(p, P({lookX: lerp(0.6, -0.7, tw(g, K.learned, 22, E.inOut)), lookY: -0.35, brows: 0.6, mouth: 'smile', tilt: -2}), present);
  /* ---- s14: listens to the shelves, the words light up everywhere, taps three spines */
  const listen = tw(g, K.sound - 4, 8) * (1 - tw(g, K.everywhere + 2, 7));
  const leanIn = tw(g, K.sound + 4, K.everywhere - K.sound - 4, E.inOut);
  p = mixPose(p, P({lookX: -0.7, lookY: -0.35, brows: 0.75 + 0.2 * leanIn, mouth: leanIn > 0.55 ? 'o' : 'smile', tilt: -11 - 5 * leanIn + 2 * Math.sin((g - K.sound) / 4.5), lean: -2.5 * leanIn}), listen);
  if (listen > 0.6 && g > K.sound + 6 && g < K.everywhere - 2) p = {...p, blink: 0.35};
  const around = tw(g, K.everywhere, 6) * (1 - tw(g, POPS[0] - 4, 5));
  p = mixPose(p, P({lookX: Math.sin((g - K.everywhere) / 4.5) * 0.85, lookY: -0.3 + 0.5 * Math.sin((g - K.everywhere) / 7), brows: 1, mouth: 'grin', tilt: -2}), around);
  const books = [BOOK('methods'), ALGO, BOOK('ml')];
  const bookW = books.map((b) => {
    const c = bookCenter(b);
    return shelfToWorld(cam, c.x, c.y);
  });
  POPS.forEach((t, i) => {
    const w = tw(g, t - 5, 5) * (1 - tw(g, i < 2 ? POPS[i + 1] - 6 : K.shelf, 6));
    p = mixPose(p, P({...look(bookW[i].x, bookW[i].y), brows: 0.8, mouth: i === 2 ? 'grin' : 'smile', tilt: i === 1 ? 4 : -4}), w);
    p = {...p, bob: (p.bob ?? 0) + hop(g, t + 1, 3, 7)};
  });
  // "shelf after shelf": eyes ride the cascade from the top row down
  const cascadeLook = tw(g, K.shelf - 2, 6) * (1 - tw(g, SAME - 3, 5));
  const rowY = lerp(-0.9, 0.5, tw(g, CASCADE[0], CASCADE[3] - CASCADE[0] + 8, E.inOut));
  p = mixPose(p, P({lookX: -0.35 + 0.25 * Math.sin((g - K.shelf) / 6), lookY: rowY, brows: 0.7, mouth: 'o'}), cascadeLook);
  // "the same shape": open-palm shrug to camera — see?
  const see = tw(g, SAME - 3, 6) * (1 - tw(g, STEPS[0] - 6, 6));
  p = mixPose(p, P({lookX: 0, lookY: 0, brows: 0.9, browAsym: 0.6, mouth: 'smirk', tilt: 6}), see);
  /* ---- the walk to the catalogue: leans into it, eyes lead */
  const walking = tw(g, STEPS[0] - 6, 5) * (1 - tw(g, ARRIVE, 6));
  const rock = STEPS.reduce((acc, t, i) => acc + (i % 2 ? 1 : -1) * 4.5 * bell(g, t - 1, 12), 0);
  p = mixPose(p, P({lookX: -0.9, lookY: 0.2, brows: 0.4, mouth: 'smile', lean: -2.5 + rock, tilt: -rock * 0.6}), walking);
  /* ---- s15: reads the labels, pulls the drawer, plucks the card, examines it */
  const scan = tw(g, ARRIVE - 4, 6) * (1 - tw(g, PULL_D - 2, 4));
  p = mixPose(p, P({lookX: lerp(-1, -0.45, tw(g, K.one - 2, LABEL_TAP - K.one, E.inOut)), lookY: 0.75, brows: 0.35, mouth: 'hmm', tilt: 3}), scan);
  if (scan > 0.5 && g < LABEL_TAP + 2) p = {...p, lookX: p.lookX + 0.12 * Math.sin((g - ARRIVE) * 0.9)};
  const pulling = tw(g, PULL_D - 4, 4) * (1 - tw(g, LIFT + 4, 6));
  p = mixPose(p, P({lookX: -0.75, lookY: 0.95, brows: 0.25, mouth: 'flat', lean: 3 * tw(g, PULL_D - 4, 4) - 1.5 * tw(g, PULL_D + 2, 10), tilt: 4}), pulling);
  // examines the card: eyes down on it, brows up, head tilt
  const exam = tw(g, LIFT + 4, 8) * (1 - tw(g, K.that + 4, 6));
  p = mixPose(p, P({lookX: -0.1, lookY: 0.95, brows: 0.9, mouth: 'o', tilt: 7}), exam);
  // "That might show up rarely": eyes up to the shelf, back to the card, up again for "not at all"; frowns
  const slotLook = tw(g, K.that + 4, 6) * (1 - tw(g, K.rarely + 18, 6)) + tw(g, RECEDE - 3, 5) * (1 - tw(g, OUTLINE_T + 14, 6));
  p = mixPose(p, P({lookX: -0.85, lookY: -0.95, brows: 0.6, mouth: 'hmm', tilt: -3}), clamp(slotLook, 0, 1));
  const back = tw(g, K.rarely + 18, 6) * (1 - tw(g, RECEDE - 3, 5)) + tw(g, OUTLINE_T + 14, 6) * (1 - tw(g, CAKE_LAND, 3));
  p = mixPose(p, P({lookX: -0.1, lookY: 0.95, brows: -0.35, mouth: 'frown', tilt: 5}), clamp(back, 0, 1));
  // the cake: a double take (snap up, "o"), then back down at the blank card
  const take = tw(g, CAKE_LAND, 3) * (1 - tw(g, CAKE_LAND + 14, 5));
  p = mixPose(p, P({lookX: -0.85, lookY: -1, brows: 1, mouth: 'o', tilt: -6, bob: -4}), take);
  const down2 = tw(g, CAKE_LAND + 14, 5) * (1 - tw(g, RIPPLE - 3, 5));
  p = mixPose(p, P({lookX: -0.1, lookY: 0.95, brows: 0.8, mouth: 'flat', tilt: 4}), down2);
  // the ripple along the shelf: eyes follow it and stop with it
  const rip = tw(g, RIPPLE - 3, 5) * (1 - tw(g, SHRUG - 2, 5));
  p = mixPose(p, P({lookX: lerp(-1, -0.8, tw(g, RIPPLE, 12)), lookY: -0.9, brows: 0.5, mouth: 'flat', tilt: -2}), rip);
  // shrug with the card
  const shrug = tw(g, SHRUG - 2, 5) * (1 - tw(g, K.so16 + 2, 6));
  p = mixPose(p, P({lookX: 0, lookY: 0.1, brows: 0.8, browAsym: 0.4, mouth: 'flat', tilt: 8}), shrug);
  /* ---- s16: looks at the blank, at the full shelves, decides; fills the gap; the confident clerk */
  const blank = tw(g, K.so16 + 2, 6) * (1 - tw(g, K.model16 - 2, 6));
  p = mixPose(p, P({lookX: -0.1, lookY: 0.95, brows: 0.2, mouth: 'hmm', tilt: 4}), blank);
  const shelves = tw(g, K.model16 - 2, 6) * (1 - tw(g, K.does + 2, 6));
  p = mixPose(p, P({lookX: -0.9, lookY: -0.9, brows: 0.5, mouth: 'hmm', tilt: -3}), shelves);
  const decide = tw(g, K.does + 2, 8) * (1 - tw(g, FLY0 - 4, 6));
  p = mixPose(p, P({lookX: 0, lookY: -0.1, brows: 0.1, mouth: 'smirk', tilt: -5}), decide);
  // the strips: eyes ride each one from its spine down into the box
  const ride = tw(g, FLY0 - 4, 5) * (1 - tw(g, FLIP, 6));
  if (ride > 0) {
    const k = clamp(Math.floor((g - FLY0) / FLY_DT), 0, FLY.length - 1);
    const u = tw(g, FLY0 + k * FLY_DT, FLY_DUR, E.inOut);
    p = mixPose(p, P({lookX: lerp(-0.95, -0.2, u), lookY: lerp(-0.95, 0.95, u), brows: 0.7, mouth: 'grin', tilt: 2}), ride);
  }
  // the flip: grin at us
  const flipLook = tw(g, FLIP, 6) * (1 - tw(g, SEAL_HIT - 12, 4));
  p = mixPose(p, P({lookX: 0.05, lookY: 0.2, brows: 0.7, mouth: 'grin', tilt: -3}), flipLook);
  // the seal: watches it come, blinks at the hit, then puffs up — chin up, smug
  const sealWatch = tw(g, SEAL_HIT - 12, 4) * (1 - tw(g, SEAL_HIT, 2));
  p = mixPose(p, P({lookX: lerp(0.9, 0.5, tw(g, SEAL_HIT - 8, 8)), lookY: lerp(0.1, 0.9, tw(g, SEAL_HIT - 8, 8)), brows: 0.6, mouth: 'o', tilt: 0}), sealWatch);
  const smug = tw(g, SEAL_HIT + 1, 6) * (1 - tw(g, GLINTS - 2, 6));
  p = mixPose(p, P({lookX: 0, lookY: -0.15, brows: 0.75, mouth: 'grin', tilt: -7}), smug);
  if (g >= SEAL_HIT && g < SEAL_HIT + 4) p = {...p, blink: 0.1};
  // "part of the pattern too": glances round at the shelves as they glint, then a satisfied nod to us
  const glance = tw(g, GLINTS - 2, 6) * (1 - tw(g, K.too + 6, 6));
  p = mixPose(p, P({lookX: lerp(-1, 0.9, tw(g, GLINTS + 2, 26, E.inOut)), lookY: -0.85, brows: 0.6, mouth: 'smirk', tilt: 3}), glance);
  const proud = tw(g, K.too + 6, 6) * (1 - tw(g, TAG1.in + 4, 6));
  p = mixPose(p, P({lookX: lerp(0, -0.3, tw(g, SWEEP, 10)), lookY: lerp(0, 0.9, tw(g, SWEEP, 8)) * (1 - tw(g, SWEEP + 16, 8)), brows: 0.8, mouth: 'grin', tilt: -4}), proud);
  p = {...p, bob: (p.bob ?? 0) + hop(g, SWEEP + 18, 4, 8)};
  // the hedges: eyes on the tag, a flick, an eyebrow and a slow, satisfied blink
  const t1 = tw(g, TAG1.in + 4, 5) * (1 - tw(g, TAG1.flick + 4, 5));
  p = mixPose(p, P({lookX: -1, lookY: 0.75, brows: -0.3, mouth: 'flat', tilt: 3}), t1);
  const after1 = tw(g, TAG1.flick + 4, 5) * (1 - tw(g, TAG2.in + 2, 4));
  p = mixPose(p, P({lookX: 0, lookY: 0, brows: 0.2, browAsym: 1, mouth: 'smirk', tilt: -3}), after1);
  if (after1 > 0.5 && g >= TAG1.flick + 8 && g < TAG1.flick + 16) p = {...p, blink: g < TAG1.flick + 12 ? 0.35 : 0.6};
  const t2 = tw(g, TAG2.in + 2, 4) * (1 - tw(g, TAG2.flick + 3, 4));
  p = mixPose(p, P({lookX: 0.85, lookY: 0.65, brows: -0.3, mouth: 'flat', tilt: -3}), t2);
  const bye = tw(g, TAG2.flick + 3, 4);
  p = mixPose(p, P({lookX: lerp(0.2, -1, tw(g, EXIT, 6)), lookY: 0.3, brows: 0.4, browAsym: 0.8, mouth: 'smirk', tilt: -4}), bye);
  if (bye > 0.5 && g >= RELEASE + 2 && g < RELEASE + 9) p = {...p, blink: 0.3};

  /* ------------------------------------------------ arms: every contact through reach (lean-aware) */
  const ch: Body = {x, y: FEET, scale: CL_S, bob: (p.bob ?? 0) + bodyBob(g), lean: p.lean};
  let armL: Arm = {a: 8, b: 10};
  let armR: Arm = {a: 8, b: 10};
  // R: rises into the close-up, pushes the Algorithms book flush and rides its end (through the pull-back, which keeps
  // the hand on the book whatever the parallax) until "answer"
  {
    const fxA = bookFx(ALGO, g);
    const a = shelfToWorld(cam, ALGO.x + (fxA.dx ?? 0), LABEL.y + 4);
    if (onBook > 0) armR = mixArm(armR, reachB(ch, 1, a.x - 12, a.y), onBook);
  }
  // R: "wrong?" — a hand on his own chest: who, me?
  if (who > 0) armR = mixArm(armR, reachB(ch, 1, x + 18, FEET - 258 + ch.bob, -1), who);
  // R: presents the shelves, palm up
  if (present > 0) armR = mixArm(armR, {a: 78, b: -18}, present * (1 - tw(g, K.sound - 6, 6)));
  // L: a hand cupped behind the ear — listening to the shelves
  if (listen > 0) armL = mixArm(armL, reachB(ch, -1, x - 84, FEET - 370 + ch.bob, 1), listen);
  // "everywhere": arms open a little
  if (around > 0) {
    armL = mixArm(armL, {a: 32, b: 18}, around);
    armR = mixArm(armR, {a: 32, b: 18}, around);
  }
  // the three taps: L up to Methods, R to the Algorithms book, R up to Machine Learning
  ([[0, -1], [1, 1], [2, 1]] as [number, -1 | 1][]).forEach(([i, side]) => {
    const b = books[i];
    const fx = bookFx(b, g);
    const pt = b.flat ? {x: b.x + 10 + (fx.dx ?? 0), y: LABEL.y} : {x: b.x + b.w / 2, y: b.bottom - 18 + (fx.dy ?? 0)};
    const w = shelfToWorld(cam, pt.x, pt.y);
    const t = tw(g, POPS[i] - 6, 6, E.out) * (1 - tw(g, POPS[i] + 8, 7, E.inOut));
    if (t <= 0) return;
    const arm = reachB(ch, side, w.x, w.y + 6 * bell(g, POPS[i] - 1, 4));
    if (side === -1) armL = mixArm(armL, arm, t);
    else armR = mixArm(armR, arm, t);
  });
  // the shrug: palms up
  if (see > 0) {
    armL = mixArm(armL, {a: 38, b: 70}, see);
    armR = mixArm(armR, {a: 38, b: 70}, see);
  }
  // walking: arms swing
  if (walking > 0) {
    const sw = Math.sin(((g - STEPS[0]) / 10) * Math.PI) * 14;
    armL = mixArm(armL, {a: 8 + sw, b: 14}, walking);
    armR = mixArm(armR, {a: 8 - sw, b: 14}, walking);
  }
  // L: fingertip slides along the drawer's label and stops just short of the "K"; grips the pull; pulls
  const dw = drawerWorld(g);
  const fingerT = tw(g, ARRIVE - 2, 8) * (1 - tw(g, LABEL_TAP + 3, 4));
  if (fingerT > 0) {
    const fx = lerp(dw.label.x - 66, dw.label.x - 42, tw(g, ARRIVE + 4, LABEL_TAP - ARRIVE - 4, E.inOut));
    armL = mixArm(armL, reachB(ch, -1, fx, dw.label.y + 10 + 3 * bell(g, LABEL_TAP - 2, 5)), fingerT);
  }
  const gripT = tw(g, LABEL_TAP + 1, 5) * (1 - tw(g, PLUCK - 3, 3));
  if (gripT > 0) armL = mixArm(armL, reachB(ch, -1, dw.pull.x + 4, dw.pull.y), gripT);
  // L: into the box for the card's top edge, up with it, then to its left edge; R joins on the right edge
  const grip = {L: 0, R: 0};
  if (held.kind !== 'none' && g < RELEASE) {
    const into = tw(g, PLUCK - 3, 3);
    const gp = held.kind === 'card' ? GRIP.card : GRIP.slip;
    const top = heldToWorld(held, (held.kind === 'card' ? CARD_W : SLIP_W) / 2, -10); // knuckles on the top edge, clear of the header
    const gl = heldToWorld(held, gp.L.x, gp.L.y);
    const toEdge = tw(g, LIFT, 10, E.inOut);
    armL = mixArm(armL, reachB(ch, -1, lerp(top.x, gl.x, toEdge), lerp(top.y, gl.y, toEdge)), into);
    const gr = heldToWorld(held, gp.R.x, gp.R.y);
    const join = tw(g, LIFT + 6, 6); // once the card's right edge has come round to his right side
    armR = mixArm(armR, reachB(ch, 1, gr.x, gr.y), join);
    grip.L = clamp((toEdge - 0.8) / 0.2, 0, 1); // the thumb shows only once the hand is at the edge
    grip.R = join;
  }
  // flicks: L flicks "I think" off the left edge, R flicks "maybe" off the right
  const flickArm = (n: 1 | 2) => {
    const T = n === 1 ? TAG1 : TAG2;
    const tg = tagPose(n, g);
    const to = tw(g, T.flick - 5, 4) * (1 - tw(g, T.flick + 5, 6));
    const fl = tw(g, T.flick, 3, E.out);
    const dir = n === 1 ? -1 : 1;
    return {arm: reachB(ch, n === 1 ? -1 : 1, tg.anchor.x + dir * (16 + 70 * fl), tg.anchor.y + 30 - 34 * fl), to};
  };
  if (g >= TAG1.flick - 6 && g < TAG1.flick + 12) {
    const f = flickArm(1);
    armL = mixArm(armL, f.arm, f.to);
    grip.L *= 1 - f.to;
  }
  if (g >= TAG2.flick - 6 && g < TAG2.flick + 12) {
    const f = flickArm(2);
    armR = mixArm(armR, f.arm, f.to);
    grip.R *= 1 - f.to;
  }
  // the exit: R lets go; L shoves the slip off to the left and lets go
  if (g >= TAG2.flick + 4) {
    armR = mixArm(armR, {a: 10, b: 24}, tw(g, TAG2.flick + 4, 8));
    grip.R = 0;
  }
  if (g >= EXIT - 2 && held.kind === 'slip') {
    const gl = heldToWorld(held, GRIP.slip.L.x, GRIP.slip.L.y);
    const shove = reachB(ch, -1, Math.max(gl.x, x - 66 - 150), gl.y);
    armL = g < RELEASE ? shove : mixArm(shove, {a: 12, b: 18}, tw(g, RELEASE, 8, E.inOut));
    if (g >= RELEASE) grip.L = 0;
  }
  if (g >= RELEASE) armL = mixArm(armL, {a: 12, b: 18}, tw(g, RELEASE, 8, E.inOut));
  p = {...p, armL, armR, bob: ch.bob};
  const precise = g < HAND_OFF + 8 || (g >= ARRIVE - 4 && g < HOLD) || g >= HOLD;
  return {pose: p, life: precise ? 0.25 : 1, body: ch, grip};
};

/* ------------------------------------------------------------------ hedge tags */
const tagPose = (n: 1 | 2, g: number) => {
  const T = n === 1 ? TAG1 : TAG2;
  const held = heldAt(Math.min(g, EXIT - 1));
  // where it tries to clip on: the slip's left edge at the first line (n = 1), the right edge lower down (n = 2)
  const anchor = n === 1 ? heldToWorld(held, 6, SLIP_LINE1.y + SLIP_LINE1.h / 2) : heldToWorld(held, SLIP_W - 6, 148);
  const arrive = sp(g, T.in, SNAP);
  const fall = g >= T.flick ? g - T.flick : 0;
  const dir = n === 1 ? -1 : 1;
  const x = anchor.x + dir * lerp(260, 0, arrive) + dir * fall * 9;
  const y = anchor.y - lerp(220, 0, arrive) + fall * fall * 2.6 + fall * 4;
  const rot = dir * lerp(-25, 0, arrive) + dir * -fall * 8 + 3 * ring(g, T.in + 8, 0.7, 0.25) * dir;
  const strike = tw(g, T.strike, 6, E.out);
  const visible = g >= T.in && fall < 26;
  return {x, y, rot, strike, visible, anchor};
};

/* ------------------------------------------------------------------ the books: who lights, tips, glints */
const LIT_ORIGIN = {x: 1400, y: 470}; // "everywhere" spreads from the clerk
const bookFx = (b: Book, g: number): BookFx => {
  const c = bookCenter(b);
  const fx: BookFx = {};
  // the opening book, pushed flush by the clerk's hand in the matched close-up
  if (b.id === 'algo0') fx.dx = kf(g, [[PUSH, 0], [PUSH + 4, 13, E.in], [PUSH + 7, 10.5, E.out], [PUSH + 10, 11, E.inOut]]);
  if (b.id === 'stackT') fx.dy = -2 * bell(g, PUSH + 4, 6) + 0.8 * ring(g, PUSH + 6, 1.1, 0.3);
  // "learned": a ripple runs through every book, outward from his hand
  const dHand = dist(c.x, c.y, 1500, 560);
  fx.rot = (fx.rot ?? 0) + (b.flat ? 0 : 2.4) * bump(g, K.learned + dHand / 55, 9);
  fx.dy = (fx.dy ?? 0) - (b.flat ? 2 : 0) * bump(g, K.learned + dHand / 55, 9);
  // "the sound of…": while he listens, the spines by his ear murmur (tiny ticks running along the shelf)
  if ((b.row === 1 || b.row === 2) && c.x > 1150 && c.x < 1800 && !b.flat) {
    const ph = K.sound + 6 + ((c.x - 1150) / 650) * 10 + (b.row === 2 ? 4 : 0);
    let m = 0;
    for (let k = 0; k < 3; k++) m += bump(g, ph + k * 11, 6);
    fx.rot = (fx.rot ?? 0) + 1.3 * m * (1 - tw(g, K.everywhere, 4));
  }
  // "everywhere": every title-word spine lights, spreading from the clerk; then settles to a low glow
  if (b.word) {
    const d0 = dist(c.x, c.y, LIT_ORIGIN.x, LIT_ORIGIN.y);
    const on = tw(g, K.everywhere + d0 / 45, 7);
    let lit = on * lerp(1, 0.45, tw(g, K.everywhere + d0 / 45 + 10, 16));
    fx.rot += (b.flat ? 0 : -1.8) * bump(g, K.everywhere + d0 / 45, 8);
    // "shelf after shelf": each row flashes in turn, left to right
    const t = CASCADE[b.row] + (c.x + 300) / 160;
    lit = Math.max(lit, bump(g, t, 10) > 0 ? lerp(lit, 1, bump(g, t, 10)) : lit);
    if (g >= t) lit = Math.max(lit, lerp(1, 0.6, tw(g, t + 6, 12)));
    fx.rot += (b.flat ? 0 : 2) * bump(g, t, 8);
    // "the same shape": every one pulses at once
    lit = Math.max(lit, 0.6 + 0.4 * bell(g, SAME, 14));
    if (g < t) lit = Math.min(lit, on * lerp(1, 0.45, tw(g, K.everywhere + d0 / 45 + 10, 16)));
    // then the library goes quiet while he walks to the catalogue
    lit *= 1 - tw(g, STEPS[0] + 4, 20);
    // "no pattern": a ripple runs along the shelf towards the cake and stops dead there
    if (b.row === SLOT.row && c.x < SLOT.x0) {
      const tt = RIPPLE + Math.max(0, c.x - 300) / 48;
      if (tt < RIPPLE_STOP + 2) lit = Math.max(lit, bump(g, tt, 10) * 0.95);
    }
    fx.lit = clamp(lit, 0, 1);
  }
  // the three called-out spines: slide out, tip, stay out until the cascade, then slide home
  const pi = ['methods', 'algo0', 'ml'].indexOf(b.id ?? '');
  if (pi >= 0) {
    const out = sp(g, POPS[pi], SNAP) * (1 - tw(g, K.shelf + pi * 3, 10, E.inOut));
    fx.s = 1 + 0.07 * out;
    fx.dy = (fx.dy ?? 0) + 4 * out;
    fx.rot = (fx.rot ?? 0) + (b.flat ? 0 : (pi === 0 ? -1 : 1) * 3 * out) + 2.5 * ring(g, POPS[pi], 0.9, 0.3);
    fx.lit = Math.max(fx.lit ?? 0, out);
  }
  // the pale book in the slot: thins on "rarely" (94 → 22 px), slides back into the dark on "not at all"
  if (b.id === 'pamph') {
    fx.thin = 1.38 * tw(g, THIN, 12, E.inOut) + 0.1 * ring(g, THIN + 12, 0.8, 0.3);
    // "rarely": it flickers like something barely there
    if (g >= THIN && g < THIN + 18) fx.bright = 1 + 0.32 * Math.max(0, Math.sin((g - THIN) * 1.9)) * (1 - (g - THIN) / 18);
    fx.recede = tw(g, RECEDE, 10, E.in);
    fx.hidden = g >= RECEDE + 10;
  }
  // the neighbours lean into the space it leaves: a first sag as it thins, then further once it is gone
  if (b.id === 'leanL') fx.rot = (fx.rot ?? 0) + 8 * tw(g, THIN + 4, 10, E.inOut) - 1.5 * ring(g, THIN + 14, 0.8, 0.3) + 4 * tw(g, RECEDE + 9, 6, E.in) - 2 * ring(g, RECEDE + 15, 0.8, 0.3);
  if (b.id === 'leanR') fx.rot = (fx.rot ?? 0) - 7 * tw(g, THIN + 5, 10, E.inOut) + 1.5 * ring(g, THIN + 15, 0.8, 0.3) - 3.5 * tw(g, RECEDE + 10, 6, E.in) + 2 * ring(g, RECEDE + 16, 0.8, 0.3);
  // s16: each source spine tips out as its word peels off, then settles back with a wobble
  const fi = FLY.findIndex((f) => f.id === b.id);
  if (fi >= 0) {
    const t0 = FLY0 + fi * FLY_DT;
    fx.rot = (fx.rot ?? 0) + 4 * bump(g, t0 - 3, 9);
    fx.s = (fx.s ?? 1) * (1 + 0.05 * bump(g, t0 - 3, 9));
    fx.lit = Math.max(fx.lit ?? 0, bell(g, t0 - 3, 14));
  }
  // s16: "part of the pattern too": the same gold seal glints on spine after spine, outward from the clerk
  if (b.seal) {
    const dd = dist(c.x, c.y, 1100, 520);
    fx.glint = bell(g, GLINTS + dd / 38, 10);
  }
  return fx;
};

/** the empty place's outline: a trapezoid along the inner edges of the two leaning neighbours (shelf coords) */
const slotOutline = (g: number) => {
  const L = BOOK('leanL');
  const R = BOOK('leanR');
  const aL = (((L.lean ?? 0) + (bookFx(L, g).rot ?? 0)) * Math.PI) / 180;
  const aR = (((R.lean ?? 0) + (bookFx(R, g).rot ?? 0)) * Math.PI) / 180;
  const by = ROWS[SLOT.row] - 3;
  const pL = {x: L.x + L.w + 5, y: by};
  const pR = {x: R.x - 5, y: by};
  const tL = {x: pL.x + Math.sin(aL) * (L.h + 4), y: by - Math.cos(aL) * (L.h + 4)};
  const tR = {x: pR.x + Math.sin(aR) * (R.h + 4), y: by - Math.cos(aR) * (R.h + 4)};
  const top = Math.min(tL.y, tR.y);
  return `M ${tL.x.toFixed(1)} ${top.toFixed(1)} L ${tR.x.toFixed(1)} ${top.toFixed(1)} L ${pR.x.toFixed(1)} ${pR.y} L ${pL.x.toFixed(1)} ${pL.y} Z`;
};

/* ------------------------------------------------------------------ the seal's flight */
const SEAL_SRC = BOOK('sealsrc');
const SEAL_LOCAL = {x: 300, y: 240}; // where it lands on the slip (bottom right, clear of the text)
const SEAL_SIZE = 122; // "IS ENTITLED" ≈ 36 px on screen in the slip / ent shots

/* ------------------------------------------------------------------ scene */
export const S4Library: React.FC = () => {
  const g = useG();
  useFontsReady();
  const cam = camAt(g);
  const held = heldAt(g);
  const {pose, life, body, grip} = clerkPose(g, cam, held);
  const behind = behindMode(g);
  const cx = clerkX(g);
  const dw = drawerWorld(g);
  const fx = (b: Book) => {
    const f = bookFx(b, g);
    if (b.id === SEAL_SRC.id) return {...f, sealOff: g >= SEAL_HIT - 12};
    return f;
  };

  // the headline card on its strings
  const signDrop = g < SIGN_LAND - 9 ? -420 : g < SIGN_LAND ? -420 * (1 - ((g - (SIGN_LAND - 9)) / 9) ** 2) : -10 * Math.sin(Math.min(1, (g - SIGN_LAND) / 7) * Math.PI) * (g < SIGN_LAND + 7 ? 1 : 0);
  const signLift = tw(g, SIGN_UP, 14, E.in) * -460;
  const signSwing = 1.6 * ring(g, SIGN_LAND, 0.42, 0.08) - 1.2 * ring(g, SIGN_UP, 0.5, 0.1);
  const signOn = g >= SIGN_LAND - 9 && g < SIGN_UP + 15;

  // the three chips over their spines: each sits just above its book on a short tether; the flat book's chip sits
  // on top of its stack, its tether running down to the printed label it lifted off
  const STACK_T = BOOK('stackT');
  const chips = [
    {b: BOOK('methods'), text: 'Methods.', dx: 0},
    {b: ALGO, text: 'Algorithms.', dx: 40},
    {b: BOOK('ml'), text: 'Machine Learning.', dx: 60},
  ].map((c, i) => {
    const t = sp(g, POPS[i] + 2, SNAP);
    const back = tw(g, K.shelf + i * 3, 9, E.in);
    const recede = i < 2 ? tw(g, POPS[i + 1], 8) : 0;
    const top = c.b.flat ? STACK_T.bottom - STACK_T.h - 2 : c.b.bottom - c.b.h + 2;
    const tether = c.b.flat ? c.b.bottom - c.b.h + (c.b.h - c.b.plate!.h) / 2 - top + 10 : 12;
    return {...c, t: t * (1 - back), recede, x: c.b.x + c.b.w / 2, top, tether};
  });

  // the slot outline and the cake
  const outlineT = tw(g, OUTLINE_T, 12, E.inOut);
  // the shelf's dashed outline retires as the card flips into the polished slip: both "gap" marks go together
  const outlineFade = 1 - tw(g, FLIP + 4, 10, E.inOut);
  const cakeU = tw(g, CAKE_LAND - 7, 7, E.out);
  const [csx, csy] = impact(g, CAKE_LAND, 0.16, 9);
  const cakeHop = hop(g, CAKE_LAND - 7, 22, 7);
  const cakeDim = 1 - 0.18 * tw(g, K.so16 + 6, 14);
  const tagT = sp(g, TAG_T, {damping: 9, stiffness: 160, mass: 0.7}) * (1 - tw(g, K.so16 + 8, 8, E.in));

  // the card's title box filling
  const L = fillLayout();
  const fillWords: FillWord[] = FLY.map((f, i) => {
    const land = FLY0 + i * FLY_DT + FLY_DUR;
    const t = g < land ? 0 : 1 + 0.18 * bell(g, land, 5);
    return {text: f.text, x: L[i].x, y: L[i].y, t};
  });
  const boxPulse = bell(g, K.titleQ + 14, 18) + 0.8 * bell(g, OUTLINE_T + 2, 14);

  // flying strips (screen space)
  const strips = FLY.map((f, i) => {
    const t0 = FLY0 + i * FLY_DT;
    const u = tw(g, t0, FLY_DUR, E.inOut);
    if (g < t0 || g >= t0 + FLY_DUR) return null;
    const b = BOOK(f.id);
    const c = bookCenter(b);
    const a = worldToScreen(cam, c.x, c.y, D);
    const land = heldToWorld(held, TITLE_BOX.x - 3 + L[i].x + textWidth(f.text, fillFont) / 2, TITLE_BOX.y - 3 + L[i].y + FILL_FONT * 0.6);
    const e = worldToScreen(cam, land.x, land.y, 1);
    // a high arc that stays left of the clerk's face
    const ctrl = {x: Math.min(a.x, e.x) - 40, y: e.y - 60};
    const x = (1 - u) ** 2 * a.x + 2 * (1 - u) * u * ctrl.x + u * u * e.x;
    const y = (1 - u) ** 2 * a.y + 2 * (1 - u) * u * ctrl.y + u * u * e.y - 40 * Math.sin(u * Math.PI) * (1 - u) ** 2;
    const s0 = 15 * a.scale;
    const s1 = FILL_FONT * held.s * cam.zoom;
    const size = lerp(s0, s1, u) + 14 * Math.sin(u * Math.PI);
    const rot = lerp(-90, -2, tw(g, t0, 6, E.out)) + 6 * Math.sin(u * Math.PI);
    return {text: f.text, x, y, size, rot};
  });

  // the seal: lifts off a spine, flies, hangs, slams onto the slip
  const sealSrc = worldToScreen(cam, SEAL_SRC.x + SEAL_SRC.w / 2, SEAL_SRC.bottom - 16, D);
  const sealLand = heldToWorld(held, SEAL_LOCAL.x, SEAL_LOCAL.y);
  const sealDst = worldToScreen(cam, sealLand.x, sealLand.y, 1);
  const sealFly = tw(g, SEAL_HIT - 12, 8, E.inOut);
  const sealHang = g >= SEAL_HIT - 4 && g < SEAL_HIT ? -30 * Math.sin(((g - (SEAL_HIT - 4)) / 4) * (Math.PI / 2)) : 0;
  const sealSlam = g >= SEAL_HIT - 2 && g < SEAL_HIT ? 30 * ((g - (SEAL_HIT - 2)) / 2) ** 2 : 0;
  const [ssx, ssy] = impact(g, SEAL_HIT, 0.14, 9);
  const sealOnSlip = g >= SEAL_HIT;
  const sealShine = tw(g, K.too - 4, 14) + (g >= K.entitled ? tw(g, K.entitled + 4, 14) : 0);

  // footers (guard rails)
  const foot1 = sp(g, FOOT1.in, SOFT) * (1 - tw(g, FOOT1.out, 10, E.in));
  const foot2 = sp(g, FOOT2.in, SOFT) * (1 - tw(g, FOOT2.out, 10, E.in));

  const charProps = {look: CAST.clerkA, pose, frame: g, seed: 4, x: cx, y: FEET, scale: CL_S, life};
  const tags = [tagPose(1, g), tagPose(2, g)];

  const heldEl =
    held.kind === 'none'
      ? null
      : (() => {
          const el = (
            <div style={{position: 'absolute', left: held.cx - held.w / 2, top: held.cy - held.h / 2, width: held.w, height: held.h, transform: `rotate(${held.rot}deg) scale(${held.s * held.sx}, ${held.s})`, transformOrigin: '50% 50%'}}>
              {held.kind === 'card' ? (
                <IndexCardV2 fill={fillWords} pulse={boxPulse} />
              ) : (
                <SlipV2 entitled={tw(g, SWEEP, 11, E.out)} glint={tw(g, FLIP + 12, 14, E.inOut)}>
                  {sealOnSlip && (
                    <div style={{position: 'absolute', left: SEAL_LOCAL.x - SEAL_SIZE / 2, top: SEAL_LOCAL.y - SEAL_SIZE / 2, transform: `rotate(-8deg) scale(${ssx}, ${ssy}) scale(${1 + 0.06 * bell(g, K.entitled + 2, 12)})`}}>
                      <SealArt size={SEAL_SIZE} shine={sealShine % 1} />
                    </div>
                  )}
                </SlipV2>
              )}
            </div>
          );
          return held.clipY !== undefined ? (
            <div style={{position: 'absolute', left: -2000, top: -2000, width: 6000, height: held.clipY + 2000, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 2000, top: 2000}}>{el}</div>
            </div>
          ) : (
            el
          );
        })();
  const tagEls = tags.map((t, i) =>
    t.visible ? (
      <div key={i} style={{position: 'absolute', left: t.x, top: t.y, transform: `translate(${i === 0 ? '-100%' : '0%'}, -50%) rotate(${t.rot}deg)`, transformOrigin: i === 0 ? '100% 50%' : '0% 50%'}}>
        <HedgeTag text={i === 0 ? 'I think' : 'maybe'} strike={t.strike} size={30} />
      </div>
    ) : null,
  );

  return (
    <AbsoluteFill style={{background: C.tealLight, overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Wall color={C.tealLight} dots={C.teal} depth={D}>
          <div style={{position: 'absolute', left: 200, top: 200}}>
            <Bookcase fx={fx} slotShade={0.45 * tw(g, THIN + 2, 12) + 0.55 * tw(g, RECEDE, 10)}>
              {/* the dashed outline round the empty place (registered to the slot) */}
              {outlineT > 0 && outlineFade > 0 && (
                <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: outlineFade}} width={1} height={1}>
                  <path d={slotOutline(g)} fill="none" stroke={C.coral} strokeWidth={5} strokeLinejoin="round" pathLength={100} strokeDasharray={outlineT < 1 ? `${outlineT * 100} 100` : '4.2 3'} strokeLinecap="round" />
                </svg>
              )}
              {/* the birthday cake comes forward out of the dark and hops into the empty place */}
              {cakeU > 0 && (
                <div style={{position: 'absolute', left: (SLOT.x0 + SLOT.x1) / 2, top: ROWS[SLOT.row] - 26 * CAKE_S, transform: `translateY(${cakeHop}px) scale(${lerp(0.8, 1, cakeU) * csx}, ${lerp(0.8, 1, cakeU) * csy})`, transformOrigin: `0px ${26 * CAKE_S}px`, filter: `brightness(${lerp(0.25, 1, cakeU) * cakeDim})`}}>
                  <Cake scale={CAKE_S} flame={0} />
                  {g >= CAKE_LAND + 2 && (
                    <div style={{position: 'absolute', left: 0, top: -66 * CAKE_S, transform: `scale(${sp(g, CAKE_LAND + 2, SNAP)})`, transformOrigin: '0 0'}}>
                      <Flame g={g} scale={CAKE_S * 0.9} />
                    </div>
                  )}
                </div>
              )}
              {/* "no pattern to work it out from": a label hinged on the board above the place, flips down */}
              {tagT > 0.001 && (
                <div style={{position: 'absolute', left: (SLOT.x0 + SLOT.x1) / 2, top: ROWS[0] + 16, transform: `translateX(-50%) perspective(600px) rotateX(${(1 - tagT) * 88}deg)`, transformOrigin: '50% 0%'}}>
                  <div style={{position: 'absolute', left: '50%', top: 0, width: 3, height: 8, background: C.ink}} />
                  <div style={{marginTop: 8, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 8, padding: '4px 14px', fontFamily: F.body, fontWeight: 800, fontSize: 25, color: C.ink, whiteSpace: 'nowrap', boxShadow: `3px 4px 0 ${C.shadow}`}}>no pattern to work it out from</div>
                </div>
              )}
              {/* the three chips, tethered to their spines */}
              {chips.map((c, i) =>
                c.t > 0.001 ? (
                  <div key={i} style={{position: 'absolute', left: c.x + c.dx, top: c.top - 6, transform: `translate(-50%, -100%) scale(${c.t * (1 - 0.15 * c.recede)})`, transformOrigin: `calc(50% - ${c.dx}px) 100%`}}>
                    <div style={{position: 'absolute', left: `calc(50% - ${c.dx}px)`, top: '100%', marginTop: -4, marginLeft: -2, width: 4, height: c.tether, background: C.ink, borderRadius: 2}} />
                    <Chip tone="saffron" size={34} style={{position: 'relative'}}>{c.text}</Chip>
                  </div>
                ) : null,
              )}
              {/* the headline card, hung on two strings over the top shelf */}
              {signOn && (
                <div style={{position: 'absolute', left: 1010, top: 36 + signDrop + signLift, transform: `translateX(-50%) rotate(${signSwing}deg)`, transformOrigin: '50% -700px'}}>
                  <div style={{position: 'absolute', left: 80, top: -700, width: 4, height: 704, background: C.ink}} />
                  <div style={{position: 'absolute', right: 80, top: -700, width: 4, height: 704, background: C.ink}} />
                  <Headline size={60} style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, padding: '10px 34px', boxShadow: `8px 10px 0 ${C.shadow}`, whiteSpace: 'nowrap'}}>
                    What the model learned from
                  </Headline>
                </div>
              )}
            </Bookcase>
          </div>
        </Wall>
        <Layer depth={1}>
          <Catalogue x={CAT_X} y={FEET} row={DRW.row} col={DRW.col} open={drawerOpen(g)} labels={LABELS} litLabel={tw(g, LABEL_TAP, 5) * (1 - tw(g, BUMP + 10, 12))} rattle={3 * Math.exp(-Math.max(0, g - (PULL_D + 13)) * 0.3) * (g >= PULL_D + 13 ? Math.sin((g - PULL_D) * 2.2) : 0)} hideFrontCard={g >= PLUCK + 2} tapLabel={bell(g, LABEL_TAP - 2, 6)} />
          <Character {...charProps} front="L" pass="body" />
          {!behind && heldEl}
          {/* the hedge tags clip on from behind the slip's edge; the flicking hand is in front of them */}
          {tagEls}
          <Character {...charProps} front="L" pass="frontArm" shadow={false} />
          <Character {...charProps} front="R" pass="frontArm" shadow={false} />
          {behind && heldEl}
          {behind && (
            <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
              {(['L', 'R'] as const).map((k) => {
                const t = grip[k];
                if (t < 0.3) return null;
                const side = k === 'L' ? -1 : 1;
                const h = handB(body, k === 'L' ? pose.armL : pose.armR, side);
                return (
                  <g key={k} transform={`translate(${h.x - side * 9} ${h.y - 3}) rotate(${held.rot}) scale(${lerp(0.5, 1, clamp((t - 0.3) / 0.7, 0, 1))})`}>
                    <ellipse cx={0} cy={0} rx={8} ry={12} fill={CAST.clerkA.skin} stroke={C.ink} strokeWidth={4} />
                  </g>
                );
              })}
            </svg>
          )}
        </Layer>
      </Camera>

      {/* flying title words (screen space) */}
      {strips.map((s, i) =>
        s ? (
          <div key={i} style={{position: 'absolute', left: s.x, top: s.y, transform: `translate(-50%, -50%) rotate(${s.rot}deg)`}}>
            <WordStrip text={s.text} size={s.size} />
          </div>
        ) : null,
      )}
      {/* the seal in flight (screen space) */}
      {g >= SEAL_HIT - 12 && g < SEAL_HIT && (
        <div
          style={{
            position: 'absolute',
            left: lerp(sealSrc.x, sealDst.x, sealFly),
            top: lerp(sealSrc.y, sealDst.y, sealFly) - Math.sin(sealFly * Math.PI) * 120 + sealHang + sealSlam,
            transform: `translate(-50%, -50%) rotate(${lerp(30, -8, sealFly)}deg) scale(${lerp(0.14, 1.08, sealFly) - 0.06 * (sealSlam / 30)})`,
          }}
        >
          <SealArt size={SEAL_SIZE * SLIP_HOLD.s * cam.zoom} />
        </div>
      )}

      {/* guard rails */}
      {foot1 > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 44, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - foot1) * 180}px)`}}>
          <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 14, padding: '10px 30px', boxShadow: `6px 7px 0 ${C.shadow}`, fontFamily: F.body, fontWeight: 800, fontSize: 34, lineHeight: 1.22, color: C.inkSoft, textAlign: 'center'}}>
            a birthday shows up rarely, or not at all
            <br />
            training exposure is unknown for these models
          </div>
        </div>
      )}
      {foot2 > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 40, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - foot2) * 180}px)`}}>
          <div style={{background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 14, padding: '8px 28px', boxShadow: `6px 7px 0 ${C.shadow}`, fontFamily: F.body, fontWeight: 800, fontSize: 32, lineHeight: 1.22, color: C.inkSoft, textAlign: 'center', whiteSpace: 'nowrap'}}>
            a title-shaped answer · simplified illustration
            <br />
            confident wording, not a measured confidence
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

