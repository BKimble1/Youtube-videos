import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {Camera, Cam, Layer} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, SNAP, camKick, camPath, drop, impact, kf, ring, sp, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {C, OUTLINE} from '../theme';
import {Wall} from '../components/Sets';
import {Arm, Character, IDLE, Pose, handWorld, mixPose, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {Tape} from '../components/Props';
import {Chip, Headline} from '../components/Text';
import {H56} from '../lib/handoffs';
import {Sfx} from '../lib/sfx';
import {PageCard, Rect, TP} from '../components/v2/S5_Page';
import {S5SlipArt, S5SlipMarks, S5_SLIP_BODY_LEFT, S5_SLIP_BODY_TOP, S5_SLIP_H, S5_SLIP_LH, S5_SLIP_SERIF, S5_SLIP_W, S5_TITLE_WORDS} from '../components/v2/S5_Slip';
import {S5Magnifier, magGrip} from '../components/v2/S5_Magnifier';

/**
 * S5 — the actual record (s17–s19). The receipt: the real thesis title page is put on the board and read the way a
 * fact-checker reads it (title, then university and date, each marked on cue); the fact-checker brings ChatGPT's slip
 * in from the left and the two are graded side by side (university right, year off by one, title invented); then the
 * marks come off and both look exactly as solid; "A confident font… is still just a font." — the checker inspects the
 * typography with a magnifier, deadpan, and the lens becomes the iris into S6 (H56).
 * Every beat is keyed to a word of the V2 narration (timeline.json); see V2_DIRECTION.md for the conventions.
 */

/* ------------------------------------------------------------------ world layout (subject plane, depth 1) */
const PK = 0.3; // world px per thesis-image px
const PAGE = {x: 870, y: 60}; // card top-left; the card is pageGeom(PK): 940 × 682
// Framing arithmetic (world px, depth 1; on screen = world × zoom):
//  record lines (thesis body, 92 image px × PK = 27.6 world): 66 px in the date/CMU close-up (zoom 2.4), 35 px in the
//  comparison (1.27); thesis title (51 world) 107 px at 2.1; slip body (23 × 1.25 = 28.8 world) 36 px at 1.27, 60 px in
//  the s19 close-up (2.08); verdict chips (34 world) 43 px at 1.27; source tab (30 world) ≥ 30 px in every framing.
//  Comparison: x 278..1790 contains the slip (330) and the title box (1734) and excludes the checker (≤ 258);
//  y 15..865 contains the label (40) and the source tab (≤ 838); the desk top falls below the frame.
//  s19: x −76..846 / y 312..832 holds the checker's head and the whole slip; the record (870) is out.

const SLIP_S = 1.25;
const SW = S5_SLIP_W * SLIP_S; // 450
const SH = S5_SLIP_H * SLIP_S; // 387.5
/** the slip pinned on the board: its third body line ("2002 at CMU") sits between the record's date and CMU lines */
const SLIP_REST = {cx: 330 + SW / 2, cy: 338 + SH / 2, s: SLIP_S, rot: -0.6};

const CH = {x: 140, y: 1080, scale: 1.3}; // the fact-checker stands behind the desk, waist-up
const DESK_Y = 890;
const DESK_D = 1.06;
const BOARD = {x0: -120, y0: -90, x1: 2280, y1: 1000}; // wider than every framing: no wall strip / board edge
const CHIP_X = 330;
const CHIP_Y = [98, 170, 242]; // chips are 36 world px type (46 px on screen in the comparison), ~64 tall

/* ------------------------------------------------------------------ cues (global frames) */
const S5 = scene('S5');
const K = {
  mount: S5.from - 6, // the incoming wipe starts here (12 f, centred on the boundary)
  heres: at('s17', "Here's"),
  actual: at('s17', 'actual'),
  record: at('s17', 'record.'),
  kalai: at('s17', "Kalai's"),
  thesis: at('s17', 'thesis:'),
  prob: at('s17', 'Probabilistic'),
  probEnd: at('s17', 'Probabilistic', 1, 'end'),
  and: at('s17', 'and'),
  andEnd: at('s17', 'and', 1, 'end'),
  online: at('s17', 'On-line'),
  onlineEnd: at('s17', 'On-line', 1, 'end'),
  methods: at('s17', 'Methods'),
  methodsEnd: at('s17', 'Methods', 1, 'end'),
  in: at('s17', 'in'),
  inEnd: at('s17', 'in', 1, 'end'),
  machine: at('s17', 'Machine'),
  machineEnd: at('s17', 'Machine', 1, 'end'),
  learning: at('s17', 'Learning.'),
  carnegie: at('s17', 'Carnegie'),
  may: at('s17', 'May'),
  y2001: at('s17', '2001.'),
  chatgpt: at('s18', 'ChatGPT'),
  got: at('s18', 'got'),
  university: at('s18', 'university'),
  right: at('s18', 'right.'),
  year: at('s18', 'year'),
  was: at('s18', 'was'),
  off: at('s18', 'off'),
  one: at('s18', 'one.'),
  title: at('s18', 'title'),
  invented: at('s18', 'invented.'),
  every: at('s18', 'every'),
  looking: at('s18', 'looking'),
  exactly: at('s18', 'exactly'),
  solid: at('s18', 'solid'),
  true: at('s18', 'true'),
  one2: at('s18', 'one.', 2),
  confident: at('s19', 'confident'),
  font: at('s19', 'font'),
  is: at('s19', 'is'),
  just: at('s19', 'just'),
  font2End: at('s19', 'font.', 2, 'end'),
};

// s17: the page, its tapes, the label, the source tab, then the marks
const PAGE_LAND = K.heres - 9; // lands just behind the wipe
const TAPE = [PAGE_LAND + 4, PAGE_LAND + 9];
const LABEL_LAND = K.actual + 8;
const SOURCE = K.record + 4;
const TITLE_BOX = K.learning + 4;
const TO_REC = K.learning + 16; // one move down to the date + university framing
const CMU_BOX = K.carnegie + 10; // waits for the camera to land (TO_REC + 16)
const DATE_BOX = K.may;
const U2001 = K.y2001 + 3;
// s18: back to the wide, the checker brings the slip, the three verdicts, the marks come off, the shared polish
const PULL = K.y2001 + 26; // the fully marked close-up settles before the pull-out
const WALK = {from: K.chatgpt - 6, to: K.chatgpt + 14, x0: -720};
const SLAP = K.got;
const RELEASE = SLAP + 7;
const TO_CMP = SLAP + 5; // 16-frame lean-in, landed before the first mark
const UNI_RING = K.university + 13;
const TICK = K.right + 3;
const YEAR_RING = K.year;
const DATE_GLOW = K.was; // the record answers: its date line glows
const DIGITS = K.off; // off by one: the final digits (2002 / 2001) flash on both documents
const STRIKE0 = K.title + 3;
const CHIP_LAND = [K.right + 8, K.one + 4, K.invented + 8];
const RETRACT = K.every - 4;
const LIFT = K.looking;
const GLINT = K.exactly;
const SETTLE = K.solid + 4;
const DARTS = [K.exactly + 2, K.solid - 10, K.solid + 2, K.true - 9];
// s18 → s19: the magnifier from the desk, the push, the inspection, the deadpan
const REACH = K.true - 3;
const GRIP = K.one2 + 1;
const RAISE = GRIP + 14;
const TO_S19 = GRIP + 19;
const AT_SLIP = TO_S19 + 28;
const GLIDE = [K.font, K.font + 24];
const LOOK = K.is + 2;
const BROW = K.is + 8;
const CAP1 = K.is - 1;
const CAP2 = K.just - 1;
const BLINK = K.font2End - 6;

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: S5.from, kind: 'amb_library', dur: (S5.to - S5.from) / 30, gain: -14, note: 'quiet desk-room tone (closest kind) under the evidence; the music pulls back here'},
  {f: K.mount - 2, kind: 'paper_slide', gain: -2, note: 'the record slides in from the right under the wipe'},
  {f: PAGE_LAND, kind: 'paper_slap', gain: -4},
  {f: TAPE[0], kind: 'tape_rip', gain: -8},
  {f: TAPE[1], kind: 'tape_rip', gain: -9, pitch: 2},
  {f: LABEL_LAND, kind: 'pop_tick', gain: -6, note: '"The actual record" tab clips on'},
  {f: SOURCE, kind: 'paper_slide', gain: -12, note: 'source tab slides out'},
  {f: K.kalai, kind: 'marker_sweep', gain: -8, pitch: 3, note: 'underline under Adam Kalai'},
  {f: K.prob, kind: 'marker_sweep', gain: -5, note: 'title line 1 highlighted as it is read'},
  {f: K.in, kind: 'marker_sweep', gain: -6, pitch: 2, note: 'title line 2'},
  {f: TITLE_BOX, kind: 'marker_circle', gain: -3},
  {f: CMU_BOX, kind: 'marker_circle', gain: -4, pitch: 2},
  {f: DATE_BOX, kind: 'marker_circle', gain: -4, pitch: 4},
  {f: U2001, kind: 'pop_tick', gain: -6, pitch: 3, note: '2001 ticked'},
  {f: WALK.from + 10, kind: 'paper_flap', gain: -8, note: 'the slip carried in from the left'},
  {f: SLAP, kind: 'paper_slap', gain: -1, pitch: 2, note: 'stiffer, glossier slap than the page'},
  {f: SLAP + 1, kind: 'tape_rip', gain: -10, pitch: 1},
  {f: SLAP + 3, kind: 'glint', gain: -12, note: 'gold edge'},
  {f: UNI_RING, kind: 'marker_circle', gain: -4, pitch: 1},
  {f: CHIP_LAND[0], kind: 'indicator_yes', gain: -8, note: 'university right (with the chip)'},
  {f: CHIP_LAND[0] - 1, kind: 'chip_pop', gain: -4},
  {f: YEAR_RING, kind: 'marker_circle', gain: -3, pitch: -2},
  {f: DIGITS, kind: 'pop_tick', gain: -7, pitch: 1, note: 'off by one: the slip\'s final "2" flashes coral'},
  {f: DIGITS + 2, kind: 'pop_tick', gain: -8, pitch: 5, note: '… and the record\'s final "1" answers'},
  {f: CHIP_LAND[1] - 1, kind: 'chip_pop', gain: -4, pitch: -2},
  {f: CHIP_LAND[1], kind: 'indicator_no', gain: -6, note: 'off by one'},
  {f: STRIKE0, kind: 'marker_sweep', gain: -3, pitch: -1},
  {f: STRIKE0 + 11, kind: 'marker_sweep', gain: -5, pitch: -3},
  {f: CHIP_LAND[2] - 1, kind: 'chip_pop', gain: -4, pitch: -4},
  {f: CHIP_LAND[2], kind: 'indicator_no', gain: -5, pitch: -3, note: 'invented'},
  {f: RETRACT, kind: 'marker_sweep', gain: -15, pitch: -5, note: 'the marks come off (soft reverse swish)'},
  {f: RETRACT + 4, kind: 'pop_tick', gain: -12, pitch: -2},
  {f: LIFT, kind: 'paper_lift', gain: -9, note: 'both documents lift together'},
  {f: GLINT + 9, kind: 'glint', gain: -6, note: 'one shine across the slip … (band over the slip ≈ GLINT + 10)'},
  {f: GLINT + 18, kind: 'glint', gain: -8, pitch: -2, note: '… and on across the record (≈ GLINT + 17)'},
  {f: SETTLE, kind: 'paper_slap', gain: -12, note: 'both settle back, in sync'},
  {f: GRIP, kind: 'thud_soft', gain: -10, note: 'magnifier pulled up from under the desk'},
  {f: RAISE + 3, kind: 'glint', gain: -10, pitch: 3, note: 'the lens catches the light as it swings up'},
  {f: CAP1, kind: 'chip_pop', gain: -12, note: 'caption, kept quiet so the line lands'},
  {f: CAP2 + 1, kind: 'pop_tick', gain: -8, pitch: -3},
];

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const lin = (x: number) => x;
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});

type SlipPose = {cx: number; cy: number; s: number; rot: number; sx: number; sy: number; lift: number};
/** world point of a slip-local point (rotation and scale about the slip's centre) */
const slipToWorld = (p: SlipPose, lx: number, ly: number) => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (lx - S5_SLIP_W / 2) * p.s;
  const dy = (ly - S5_SLIP_H / 2) * p.s;
  return {x: p.cx + dx * Math.cos(r) - dy * Math.sin(r), y: p.cy + dx * Math.sin(r) + dy * Math.cos(r)};
};

/** the lens's final place: on the serif "B" of “Boosting (title line, 4th body line of the slip) */
const lensTarget = () => {
  const q = textWidth('“', S5_SLIP_SERIF);
  const b = textWidth('B', S5_SLIP_SERIF);
  return slipToWorld({...SLIP_REST, sx: 1, sy: 1, lift: 0}, S5_SLIP_BODY_LEFT + q + b * 0.5, S5_SLIP_BODY_TOP + S5_SLIP_LH * 3.5);
};
const ZC = 2.08; // the s19 close-up; the lens's glass is H56.r on screen
export const S5_LENS_ZOOM = ZC; // Main's iris draws the lens rim at this scale as it opens into S6
const LENS_R = H56.r / ZC;
const MAG = 1.8;

/* ------------------------------------------------------------------ camera */
const SHOTS = {
  open: {cx: 1340, cy: 430, zoom: 1.24},
  page: {cx: 1340, cy: 430, zoom: 1.19},
  pageDrift: {cx: 1337, cy: 428, zoom: 1.2},
  title: {cx: 1340, cy: 210, zoom: 2.1},
  titleDrift: {cx: 1356, cy: 216, zoom: 2.16},
  rec: {cx: 1341, cy: 508, zoom: 2.4},
  recDrift: {cx: 1343, cy: 509, zoom: 2.43},
  wide: {cx: 917, cy: 528, zoom: 1.0},
  cmp: {cx: 1034, cy: 440, zoom: 1.27},
  cmpDrift: {cx: 1034, cy: 436, zoom: 1.27},
};
const camAt = (g: number, lens: {x: number; y: number}): Cam => {
  const c = camPath(g, SHOTS.open, [
    {at: PAGE_LAND - 4, dur: 22, to: SHOTS.page, ease: E.out},
    {at: PAGE_LAND + 20, dur: K.thesis - PAGE_LAND - 20, to: SHOTS.pageDrift},
    {at: K.thesis, dur: 22, to: SHOTS.title},
    {at: K.thesis + 24, dur: TO_REC - K.thesis - 24, to: SHOTS.titleDrift},
    {at: TO_REC, dur: 16, to: SHOTS.rec},
    {at: TO_REC + 18, dur: PULL - TO_REC - 18, to: SHOTS.recDrift},
    {at: PULL, dur: 24, to: SHOTS.wide},
    {at: TO_CMP, dur: 16, to: SHOTS.cmp},
    {at: TO_CMP + 18, dur: RETRACT - TO_CMP - 18, to: SHOTS.cmpDrift},
    {at: RETRACT, dur: 24, to: SHOTS.wide},
    {at: TO_S19, dur: 28, to: {cx: lens.x, cy: lens.y, zoom: ZC}},
  ]);
  return {...c, zoom: c.zoom * camKick(g, [SLAP], 0.006)};
};

/* ------------------------------------------------------------------ the record: entrance and marks */
const pageMotion = (g: number) => {
  // it is still sliding in from the right while the wipe uncovers the right side of the frame, then settles
  const slide = Easing.bezier(0.35, 0.45, 0.45, 1);
  const dx = kf(g, [[K.mount - 4, 1600], [PAGE_LAND, -18, slide], [PAGE_LAND + 9, 0, E.inOut]]);
  const dy = kf(g, [[K.mount - 4, -34], [PAGE_LAND, 0, slide]]);
  const rot = kf(g, [[K.mount - 4, 4.5], [PAGE_LAND, -0.7, slide], [PAGE_LAND + 10, 0, E.inOut]]);
  const [sx, sy] = impact(g, PAGE_LAND, 0.014, 8);
  return {dx, dy, rot, sx, sy};
};

/** how far the reading marker has got along each title line (thesis-image x), keyed to the words as they are said */
const readLine1 = (g: number) =>
  g < K.prob
    ? undefined
    : kf(g, [
        [K.prob, TP.title1Words[0][0]],
        [Math.min(K.probEnd, K.prob + 24), TP.title1Words[0][1], lin],
        [K.and, TP.title1Words[1][0], lin],
        [K.andEnd + 1, TP.title1Words[1][1], lin],
        [K.online, TP.title1Words[2][0], lin],
        [K.onlineEnd, TP.title1Words[2][1], lin],
        [K.methods, TP.title1Words[3][0], lin],
        [K.methodsEnd, TP.title1Words[3][1], lin],
      ]);
const readLine2 = (g: number) =>
  g < K.in
    ? undefined
    : kf(g, [
        [K.in, TP.title2Words[0][0]],
        [K.inEnd + 1, TP.title2Words[0][1], lin],
        [K.machine, TP.title2Words[1][0], lin],
        [K.machineEnd, TP.title2Words[1][1], lin],
        [K.learning, TP.title2Words[2][0], lin],
        [K.learning + 13, TP.title2Words[2][1], lin],
      ]);

const TITLE_R: Rect = [TP.title1[0] - 90, TP.title1[1] - 90, TP.title1[2] + 90, TP.title2[3] + 90];
const DATE_R: Rect = [TP.date[0] - 60, TP.date[1] - 30, TP.date[2] + 60, TP.date[3] + 28];
const CMU_R: Rect = [TP.cmu[0] - 60, TP.cmu[1] - 28, TP.cmu[2] + 60, TP.cmu[3] + 28];

const retractAt = (g: number) => tw(g, RETRACT, 14, E.inOut);
const liftAt = (g: number) => tw(g, LIFT, 10, E.out) * (1 - tw(g, SETTLE - 6, 6, E.in));
const LIFT_PX = 18; // both documents rise by the same amount, scale up by the same 2.5 %, and cast the same shadow
const LIFT_S = 0.025;
/** the same warm presentation glow on both documents while they are held up as equals */
const haloAt = (g: number) => tw(g, LIFT, 12, E.inOut) * (1 - tw(g, K.one2 - 4, 16, E.inOut));
const glintBand = (g: number) => (g >= GLINT && g <= GLINT + 30 ? lerp(240, 1920, tw(g, GLINT, 30, E.inOut)) : undefined);

/* ------------------------------------------------------------------ the slip: carried in, pressed onto the board */
const walkX = (g: number) => kf(g, [[WALK.from, WALK.x0], [WALK.to, CH.x, Easing.bezier(0.3, 0.55, 0.4, 1)]]);
const PRESS = SLAP - 7;
const slipCarry = (g: number): SlipPose => {
  const x = walkX(g);
  const sway = Math.sin(((x - WALK.x0) / 74) * Math.PI);
  return {cx: x + 190 + (SW * 1.035) / 2, cy: 320 + (SH * 1.035) / 2, s: SLIP_S * 1.035, rot: -2.4 + 1.1 * sway, sx: 1, sy: 1, lift: 1};
};
const slipPose = (g: number): SlipPose | null => {
  if (g < WALK.from) return null;
  if (g < PRESS) return slipCarry(g);
  const a = slipCarry(PRESS);
  const u = tw(g, PRESS, SLAP - PRESS, E.in);
  const [sx, sy] = impact(g, SLAP, 0.022, 9);
  const settleRot = 0.9 * ring(g, SLAP, 0.75, 0.24);
  const lift = liftAt(g);
  const [lx, ly] = impact(g, SETTLE, 0.012, 9);
  return {
    cx: lerp(a.cx, SLIP_REST.cx, u),
    cy: lerp(a.cy, SLIP_REST.cy, u) - LIFT_PX * lift,
    s: lerp(a.s, SLIP_REST.s, u) * (1 + LIFT_S * lift),
    rot: lerp(a.rot, SLIP_REST.rot, u) + settleRot,
    sx: sx * lx,
    sy: sy * ly,
    lift: Math.max(1 - u, lift),
  };
};
/** where the checker's hand grips the slip (its left edge, a little above the middle) */
const SLIP_GRIP = {x: -4, y: 168};

const slipMarks = (g: number): S5SlipMarks => {
  const off = 1 - retractAt(g);
  const strike = S5_TITLE_WORDS.map((_, i) => tw(g, STRIKE0 + i * 2.6, 6, E.inOut) * (1 - tw(g, RETRACT + (8 - i) * 0.8, 6, E.inOut)));
  const band = glintBand(g);
  const p = slipPose(g);
  return {
    uni: tw(g, UNI_RING, 10, E.inOut) * off,
    tick: 0, // the teal ring on CMU and the "university · right" chip carry the verdict; a tick would sit on the line above
    year: tw(g, YEAR_RING, 10, E.inOut) * off,
    digit: {bump: bell(g, DIGITS, 10), on: tw(g, DIGITS + 3, 2) * off},
    strike,
    // its gold edge catches the light once as it is slapped on; later the shared glint crosses it with the record
    glintX: band !== undefined && p ? (band - (p.cx - SW / 2)) / SLIP_S : g >= SLAP + 1 && g <= SLAP + 15 ? lerp(-70, 430, tw(g, SLAP + 1, 14, E.inOut)) : undefined,
    lift: p?.lift ?? 0,
    halo: haloAt(g),
  };
};

/* ------------------------------------------------------------------ the fact-checker */
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});
const REST_R: Arm = {a: 4, b: 12};

/** reach() that also undoes the body lean (Character rotates the whole figure about its hips) */
const reachLean = (ch: {x: number; y: number; scale: number; bob?: number}, side: -1 | 1, wx: number, wy: number, lean: number, elbow: 1 | -1 = 1): Arm => {
  const px = ch.x;
  const py = ch.y + ((ch.bob ?? 0) - 150) * ch.scale;
  const r = (-lean * Math.PI) / 180;
  const dx = wx - px;
  const dy = wy - py;
  return reach(ch, side, px + dx * Math.cos(r) - dy * Math.sin(r), py + dx * Math.sin(r) + dy * Math.cos(r), elbow);
};

/** the magnifier's lens: kept under the desk; pulled up by its handle (lens hanging below the hand), swung up and over
 *  to the right, raised to the slip, glides onto the "B", then held there (it is H56 on screen from GLIDE[1] on) */
const magState = (g: number, target: {x: number; y: number}) => {
  const under = {x: 292, y: DESK_Y + 182}; // hidden behind the desk (the handle's tip just below the desk top)
  const peek = {x: 298, y: DESK_Y + 14};
  const ready = {x: 380, y: 690};
  const over = {x: target.x + 40, y: target.y + 4};
  const x = kf(g, [[GRIP, under.x], [GRIP + 7, peek.x, E.out], [RAISE, ready.x, E.inOut], [AT_SLIP, over.x, E.inOut], [GLIDE[0], over.x - 2, E.inOut], [GLIDE[1], target.x, E.inOut]]);
  const y = kf(g, [[GRIP, under.y], [GRIP + 7, peek.y, E.out], [RAISE, ready.y, E.inOut], [AT_SLIP, over.y, E.inOut], [GLIDE[0], over.y - 1, E.inOut], [GLIDE[1], target.y, E.inOut]]);
  // the handle points up from the lens while it hangs, then the lens swings round to the right and up
  const angle = kf(g, [[GRIP + 5, -90], [RAISE, -232, E.inOut], [AT_SLIP, -248, E.inOut]]);
  return {x, y, angle, held: g >= GRIP - 1, glint: tw(g, RAISE - 2, 12, E.inOut), view: tw(g, AT_SLIP - 3, 3, E.inOut)};
};

type CheckerState = {x: number; pose: Pose; life: number; handY: number; on: boolean};
const checkerAt = (g: number, target: {x: number; y: number}): CheckerState => {
  const x = walkX(g);
  const on = g >= WALK.from;
  const v = x - walkX(g - 1);
  const walking = Math.min(1, v / 5);
  const step = Math.abs(Math.sin(((x - WALK.x0) / 74) * Math.PI));
  let p = P({lookX: 0.6, lookY: 0.05, mouth: 'flat', brows: 0.1, armL: {a: 2, b: -35}, armR: REST_R});
  // walking in: bob per step, lean into the walk, a small overshoot when stopping
  p = {...p, bob: (p.bob ?? 0) - 6 * step * walking, lean: 4 * walking - 2.2 * bell(g, WALK.to - 2, 12)};
  // presses the slip onto the board, then a small satisfied nod; looks across at the record
  p = mixPose(p, P({...p, lookX: 0.95, lookY: -0.15, brows: 0.25}), tw(g, PRESS - 4, 6) * (1 - tw(g, SLAP + 8, 8)));
  p = {...p, bob: (p.bob ?? 0) + 4 * bell(g, SLAP + 9, 10) + 2 * bell(g, PRESS, SLAP - PRESS + 2)};
  p = mixPose(p, P({...p, lookX: 1, lookY: -0.45, brows: 0.1, mouth: 'flat'}), tw(g, SLAP + 12, 8));
  // (off screen during the verdicts: small reactions anyway, so the return to the wide is continuous)
  p = mixPose(p, P({...p, brows: -0.3, mouth: 'hmm'}), tw(g, CHIP_LAND[1], 8) * (1 - tw(g, RETRACT, 10)));
  // the marks come off: back on the slip, then the eyes dart slip ↔ record, and narrow
  p = mixPose(p, P({...p, lookX: 0.65, lookY: -0.3, brows: 0.05, mouth: 'flat'}), tw(g, RETRACT + 6, 8));
  const darts = [{lookX: 1, lookY: -0.55}, {lookX: 0.65, lookY: -0.3}, {lookX: 1, lookY: -0.55}, {lookX: 0.65, lookY: -0.3}];
  darts.forEach((d, i) => {
    p = mixPose(p, P({...p, ...d}), tw(g, DARTS[i], 3, E.out));
  });
  p = mixPose(p, P({...p, brows: -0.45, browAsym: 0.2}), tw(g, DARTS[3] + 2, 6) * (1 - tw(g, REACH + 2, 8)));
  // ducks and reaches under the desk for the magnifier
  const lookDown = tw(g, REACH - 2, 5) * (1 - tw(g, GRIP + 4, 8));
  p = mixPose(p, P({...p, lookX: 0.75, lookY: 0.85, brows: 0.15}), lookDown);
  const duck = tw(g, REACH - 2, 8, E.inOut) * (1 - tw(g, GRIP + 3, 10, E.inOut));
  p = {...p, lean: p.lean + 4 * duck, bob: (p.bob ?? 0) + 24 * duck};
  // s19: leans toward the slip and looks through the lens; then the deadpan turn to camera, one brow up
  p = mixPose(p, P({...p, lookX: 1, lookY: 0.02, brows: 0.2, mouth: 'flat', lean: 3}), tw(g, RAISE - 4, 10));
  p = mixPose(p, P({...p, brows: 0.45}), bell(g, GLIDE[1] - 6, 12));
  p = mixPose(p, P({...p, lookX: 0.04, lookY: 0.06, brows: -0.05, lean: 0.5, tilt: -2}), tw(g, LOOK, 7, E.inOut));
  p = mixPose(p, P({...p, browAsym: 1, tilt: -3.5}), tw(g, BROW, 6, E.out));
  if (g >= BLINK && g < BLINK + 8) p = {...p, blink: 0.12 + 0.88 * Math.abs((g - BLINK - 4) / 4)};

  // the right arm: carries the slip by its edge → lets go → rests; reaches the magnifier → holds it
  const ch = {x, y: CH.y, scale: CH.scale, bob: p.bob};
  let armR = REST_R;
  if (g < RELEASE + 12) {
    const sp0 = slipPose(Math.min(g, RELEASE));
    if (sp0) {
      const grip = slipToWorld(sp0, SLIP_GRIP.x, SLIP_GRIP.y);
      const hold = reachLean(ch, 1, grip.x, grip.y, p.lean);
      armR = mixArm(hold, REST_R, tw(g, RELEASE, 12, E.inOut));
    }
  }
  const m = magState(g, target);
  if (g >= REACH) {
    const gp = magGrip(m.x, m.y, LENS_R, m.angle);
    const hold = reachLean(ch, 1, gp.x, gp.y, p.lean);
    armR = mixArm(REST_R, hold, tw(g, REACH, GRIP - REACH, E.inOut));
  }
  p = {...p, armR};
  const precise = (g >= PRESS - 4 && g < RELEASE + 4) || g >= RAISE;
  const handY = handWorld(ch, armR, 1).y;
  return {x, pose: p, life: g >= LOOK ? 0.45 : precise ? 0.2 : 0.6, handY, on};
};

/* ------------------------------------------------------------------ small set pieces */
const Pin: React.FC<{x: number; y: number; color?: string}> = ({x, y, color = C.coral}) => (
  <div style={{position: 'absolute', left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 11, background: color, border: `3px solid ${C.ink}`, boxShadow: `3px 4px 0 ${C.shadow}`}}>
    <div style={{position: 'absolute', left: 3, top: 2, width: 7, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.7)'}} />
  </div>
);

const Board: React.FC = () => (
  <div style={{position: 'absolute', left: BOARD.x0, top: BOARD.y0, width: BOARD.x1 - BOARD.x0, height: BOARD.y1 - BOARD.y0, background: C.woodLight, border: `${OUTLINE + 4}px solid ${C.woodDeep}`, borderRadius: 14, boxSizing: 'border-box', overflow: 'hidden'}}>
    {/* cork speckle */}
    <svg width={BOARD.x1 - BOARD.x0} height={BOARD.y1 - BOARD.y0} style={{position: 'absolute', left: 0, top: 0}}>
      {Array.from({length: 150}).map((_, i) => {
        const r = (n: number) => {
          const t = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return t - Math.floor(t);
        };
        return <circle key={i} cx={r(1) * (BOARD.x1 - BOARD.x0)} cy={r(2) * (BOARD.y1 - BOARD.y0)} r={2 + r(3) * 3} fill={C.wood} opacity={0.35} />;
      })}
    </svg>
    {/* a sticky note and an old index card, top left (background only) */}
    <div style={{position: 'absolute', left: 60 - BOARD.x0, top: 60 - BOARD.y0, width: 120, height: 112, background: C.saffronLight, border: `3px solid ${C.saffronDeep}`, transform: 'rotate(-6deg)', boxShadow: `4px 5px 0 ${C.shadow}`}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 16, top: 34 + i * 22, width: 80 - i * 18, height: 5, borderRadius: 3, background: C.saffronDeep, opacity: 0.6}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: 78 - BOARD.x0, top: 198 - BOARD.y0, width: 150, height: 96, background: C.cream, border: `3px solid ${C.inkMuted}`, transform: 'rotate(5deg)', boxShadow: `4px 5px 0 ${C.shadow}`}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', left: 12, right: 12, top: 22 + i * 18, height: 2, background: i === 0 ? C.coralLight : C.paperLine}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: -BOARD.x0, top: -BOARD.y0}}>
      <Pin x={118} y={72} color={C.teal} />
      <Pin x={152} y={206} />
    </div>
  </div>
);

const Desk: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -600, width: 3200, top: DESK_Y, height: 40, background: C.woodLight, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 8}} />
    <div style={{position: 'absolute', left: -600, width: 3200, top: DESK_Y + 36, height: 500, background: C.wood, borderTop: `${OUTLINE}px solid ${C.ink}`}}>
      {Array.from({length: 9}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 420 + i * 380, top: 34, width: 280, height: 120, border: `${OUTLINE}px solid ${C.woodDeep}`, borderRadius: 10, opacity: 0.75}} />
      ))}
    </div>
  </>
);

const VerdictIcon: React.FC<{ok: boolean}> = ({ok}) => (
  <svg viewBox="0 0 30 30" width={30} height={30} style={{display: 'block'}}>
    {ok ? <path d="M 4 16 L 12 24 L 27 6" fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M 7 7 L 23 23 M 23 7 L 7 23" fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" />}
  </svg>
);
const VERDICTS = [
  {ok: true, text: 'university · right'},
  {ok: false, text: 'year · off by one'},
  {ok: false, text: 'title · invented'},
];

/* ------------------------------------------------------------------ scene */
export const S5Record: React.FC = () => {
  const g = useG();
  useFontsReady();
  const target = lensTarget();
  const cam = camAt(g, target);

  // the record
  const pm = pageMotion(g);
  const off = 1 - retractAt(g);
  const lift = liftAt(g);
  const [lsx, lsy] = impact(g, SETTLE, 0.012, 9);
  const band = glintBand(g);
  const tapeAt = (t0: number): [number, number] | undefined => {
    if (g < t0 - 3) return undefined;
    const s = lerp(1.35, 1, tw(g, t0 - 3, 3, E.in));
    const [ix, iy] = impact(g, t0, 0.22, 8);
    return [s * ix, s * iy];
  };
  const focus = tw(g, TO_REC - 2, 16, E.inOut);
  const labelDy = drop(g, LABEL_LAND, 150, 9);
  const [lbx, lby] = impact(g, LABEL_LAND, 0.1, 8);
  const pageEl = (
    <div
      style={{
        position: 'absolute',
        left: PAGE.x,
        top: PAGE.y,
        transform: `translate(${pm.dx}px, ${pm.dy - LIFT_PX * lift}px) rotate(${pm.rot}deg) scale(${pm.sx * lsx * (1 + LIFT_S * lift)}, ${pm.sy * lsy * (1 + LIFT_S * lift)})`,
        transformOrigin: '50% 50%',
      }}
    >
      <PageCard
        k={PK}
        source={tw(g, SOURCE, 12, E.softBack)}
        tapes={[tapeAt(TAPE[0]), tapeAt(TAPE[1])]}
        label={{on: g >= LABEL_LAND - 9, dy: labelDy, rot: 1.6 * ring(g, LABEL_LAND, 0.9, 0.3), sx: lbx, sy: lby}}
        marks={{
          read1: readLine1(g),
          read2: readLine2(g),
          readA: off,
          title: tw(g, TITLE_BOX, 12, E.inOut) * off,
          kalai: tw(g, K.kalai, 10, E.out) * (1 - tw(g, TO_REC - 4, 10, E.inOut)),
          cmu: tw(g, CMU_BOX, 20, E.inOut) * off,
          date: tw(g, DATE_BOX, 10, E.inOut) * off,
          h2001: tw(g, U2001, 7, E.inOut) * off,
          digit: {under: tw(g, DIGITS + 2, 5, E.out) * off},
          pulse: {
            title: bell(g, TITLE_BOX + 12, 12) * 0.7 + bell(g, K.title + 4, 22) * off,
            cmu: bell(g, CMU_BOX + 20, 10) * 0.5 + (bell(g, UNI_RING, 16) + bell(g, TICK, 12)) * off,
            date: bell(g, DATE_GLOW - 2, 20) * off,
          },
          dim: {a: 0.62 * tw(g, K.thesis + 6, 14) * (1 - tw(g, PULL, 18)), rects: [TITLE_R, DATE_R, CMU_R], ops: [1 - focus, focus, focus]},
          glintX: band !== undefined ? band - PAGE.x : undefined,
          lift,
          halo: haloAt(g),
        }}
      />
    </div>
  );

  // the slip
  const sp0 = slipPose(g);
  const marks = slipMarks(g);
  const slipEl = (pose: SlipPose, mk: S5SlipMarks) => (
    <div style={{position: 'absolute', left: pose.cx - S5_SLIP_W / 2, top: pose.cy - S5_SLIP_H / 2, width: S5_SLIP_W, height: S5_SLIP_H, transform: `rotate(${pose.rot}deg) scale(${pose.s * pose.sx}, ${pose.s * pose.sy})`, transformOrigin: '50% 50%'}}>
      <S5SlipArt marks={mk}>
        {/* its two tape tabs (already on it when it is carried in; pressed flat on the board) */}
        {[0, 1].map((i) => {
          const flat = tw(g, SLAP - 1, 3, E.out);
          const [tx, ty] = impact(g, SLAP + 1, 0.2, 8);
          const flap = (1 - flat) * (6 + 4 * Math.sin(g * 0.9 + i));
          return <Tape key={i} width={110 / SLIP_S} style={{height: 30 / SLIP_S, [i === 0 ? 'left' : 'right']: -22 / SLIP_S, top: -10 / SLIP_S, borderWidth: 2 / SLIP_S, transform: `rotate(${i === 0 ? -8 - flap : 7 + flap}deg) scale(${tx}, ${ty})`, transformOrigin: i === 0 ? '80% 80%' : '20% 80%'}} />;
        })}
      </S5SlipArt>
    </div>
  );

  // verdict chips pinned above the slip
  const chips = VERDICTS.map((v, i) => {
    const land = CHIP_LAND[i];
    if (g < land - 6) return null;
    const pop = sp(g, land - 6, SNAP);
    const out = tw(g, RETRACT + 2 + i * 3, 7, E.in);
    if (out >= 1) return null;
    const dy = drop(g, land, 22, 6) - 10 * bell(g, RETRACT + 2 + i * 3, 7);
    const [cx, cy] = impact(g, land, 0.08, 8);
    return (
      <div key={i} style={{position: 'absolute', left: CHIP_X, top: CHIP_Y[i] + dy, transform: `scale(${lerp(0.55, 1, pop) * (1 - out) * cx}, ${lerp(0.55, 1, pop) * (1 - out) * cy}) rotate(${(i - 1) * 0.8 + 1.5 * ring(g, land, 0.9, 0.3)}deg)`, transformOrigin: '10% 50%'}}>
        <Chip tone={v.ok ? 'teal' : 'coral'} size={36} style={{boxShadow: `5px 6px 0 ${C.shadow}`}}>
          <VerdictIcon ok={v.ok} />
          {v.text}
        </Chip>
        <div style={{position: 'absolute', left: -4, top: 6}}>
          <Pin x={8} y={8} color={v.ok ? C.tealLight : C.coralLight} />
        </div>
      </div>
    );
  });

  // the fact-checker and the magnifier
  const chk = checkerAt(g, target);
  const mag = magState(g, target);
  const charProps = {look: CAST.checker, pose: chk.pose, frame: g, seed: 9, x: chk.x, y: CH.y, scale: CH.scale, front: 'R' as const, life: chk.life};
  const armOverDesk = chk.handY < DESK_Y + 6;
  const frontArm = chk.on ? <Character {...charProps} pass="frontArm" shadow={false} /> : null;
  const magEl = <S5Magnifier x={mag.x} y={mag.y} r={LENS_R} angle={mag.angle} glint={mag.glint} />;
  // the magnified view inside the glass: the same slip, scaled about the lens centre, clipped to the glass
  const magView =
    mag.held && mag.view > 0 && sp0 ? (
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `circle(${LENS_R}px at ${mag.x}px ${mag.y}px)`, opacity: mag.view}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${mag.x}px, ${mag.y}px) scale(${MAG}) translate(${-mag.x}px, ${-mag.y}px)`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: mag.x - 200, top: mag.y - 200, width: 400, height: 400, background: C.woodLight}} />
          {slipEl(sp0, marks)}
        </div>
      </div>
    ) : null;

  // the caption (screen space): "A confident font is still" … "just a font."
  const capFont = `600 52px "Fredoka Variable"`;
  const w1 = textWidth('A confident font is still', capFont);
  const w2 = textWidth('just a font.', capFont);
  const gap = textWidth(' ', capFont);
  const cap1 = sp(g, CAP1, SNAP);
  const cap2 = g >= CAP2 ? sp(g, CAP2, SNAP) : 0;
  const spread = tw(g, CAP2 - 1, 4, E.out); // the box opens a beat ahead of the word
  const boxFull = 36 + w1 + gap + w2 + 36;
  const boxW = 36 + w1 + (gap + w2) * spread + 36;
  const capLeft = Math.min(1830 - boxFull, 1400 - boxFull / 2); // ≥ 80 px clear of the checker's forearm, ~100 px from the right edge
  const [kx, ky] = impact(g, CAP2 + 2, 0.1, 8);

  return (
    <AbsoluteFill style={{background: C.coralLight, overflow: 'hidden'}}>
      <Camera cam={cam}>
        <Wall color={C.coralLight} dots={C.coral} depth={0.72} />
        <Layer depth={1}>
          <Board />
          {pageEl}
          {sp0 && slipEl(sp0, marks)}
          {chips}
          {chk.on && <Character {...charProps} pass="body" />}
          {magView}
          {mag.held && magEl}
          {!armOverDesk && frontArm}
        </Layer>
        <Layer depth={DESK_D}>
          <Desk />
        </Layer>
        <Layer depth={1}>{armOverDesk && frontArm}</Layer>
      </Camera>

      {/* the caption */}
      {cap1 > 0 && (
        <div style={{position: 'absolute', left: capLeft, top: 918, width: boxW, height: 92, transform: `scale(${lerp(0.9, 1, cap1)})`, transformOrigin: '20% 50%'}}>
          <div style={{position: 'absolute', inset: 0, background: C.cream, border: `4px solid ${C.ink}`, borderRadius: 18, boxShadow: `8px 10px 0 ${C.shadow}`, transform: `scale(${kx}, ${ky})`}} />
          <Headline size={52} align="left" style={{position: 'absolute', left: 36, top: 17, whiteSpace: 'nowrap'}}>
            A confident font is still
          </Headline>
          {cap2 > 0 && (
            <Headline size={52} align="left" color={C.coral} style={{position: 'absolute', left: 36 + w1 + gap, top: 17, whiteSpace: 'nowrap', transform: `scale(${lerp(1.3, 1, cap2)})`, transformOrigin: '0% 60%'}}>
              just a font.
            </Headline>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
