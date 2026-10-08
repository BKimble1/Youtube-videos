import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Camera, Cam, Layer, worldToScreen} from '../lib/camera';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {lerp} from '../lib/anim';
import {E, camKick, camPath, drop, hop, impact, kf, ring, tw} from '../lib/motion';
import {textWidth, useFontsReady} from '../lib/measure';
import {C, OUTLINE} from '../theme';
import {Arm, Character, IDLE, Pose, mixPose, reach} from '../components/Character';
import {CAST} from '../components/cast';
import {AnswerSlipArt, SLIP_H, SLIP_STAMP_AT, SLIP_W, SlipOnScreen, SlipStamp} from '../components/v2/AnswerSlip';
import {StampArm} from '../components/v2/StampArm';
import {H910} from '../lib/handoffs';
import {Sfx} from '../lib/sfx';
import {
  Archive,
  BELT_Y,
  Beam,
  Booth,
  BoothSpec,
  Chute,
  FLOOR_Y,
  Gantry,
  GateLamp,
  Lever,
  MachineFront,
  NamePlate,
  PaintedPlate,
  PencilCup,
  RAIL_Y,
  RecordSlot,
  RoomFloor,
  RoomWall,
  SIGN_FONT_PX,
  ScanHead,
  SlotOutline,
  VerdictWindow,
} from '../components/v2/S9_Machine';
import {REC_BOX, REC_H, REC_IMG_OX, REC_IMG_OY, REC_W, RecordCard, SlipScan, TokBox, tok, unionBox, useSlipTokenBoxes} from '../components/v2/S9_Docs';

/**
 * S9 — the evidence-checking machine (s29–s32). "The unglamorous move: check." The fact-checker throws the start
 * lever; the machine's two gates ask the two questions; the ChatGPT slip rides the belt through gate ① (the cited
 * thesis is looked up and the real record is fed out of the ARCHIVE: it exists → YES) and gate ② (the scanners read
 * the slip's title and year, then the record's: they don't match → NO); the verdict windows flip to "Source exists" /
 * "Claim fails"; the viewer's own (teal-sleeved) hand stamps it, and the slip lifts toward camera into S10 (H910).
 * Every beat is keyed to a word of the V2 narration; see V2_DIRECTION.md.
 */

/* ------------------------------------------------------------------ world layout */
const CHK = {x: 330, y: 1150, scale: 1};
const LEV = {x: 130, y: 930, len: 95}; // its whole arc stays left of the checker's body, within the left arm's reach
const SLIP_BOT = 958; // documents stand on the belt (its top edge is at BELT_Y)
const SLIP_TOP0 = SLIP_BOT - SLIP_H;
const REC_TOP0 = SLIP_BOT - REC_H;
const GAP = 410; // slip → record spacing on the belt: each close-up holds one document whole and the other clear
const RXO = 180 + GAP + REC_W / 2; // record centre relative to the slip centre
const LAMPO = 400; // gate lamp, between the documents (in the slip close-up and the gate ① record shot)
const LAMP_Y = 742;
const SX0 = 680; // slip centre at the intake (an arm's length right of the checker)
const SX1 = 1160; // … under gate ①
const SX2 = 2870; // … under gate ② (booths 160 apart, so the two-gate wide holds both with ≈ 64 px to spare)
const RX1 = SX1 + RXO;
const RX2 = SX2 + RXO;
const booth = (sx: number) => ({x0: sx - 260, x1: sx + 1290});
const B1 = booth(SX1);
const B2 = booth(SX2);
const M_X1 = B2.x1 + 260; // the machine runs on past the right edge of every framing (no end-cap tangent in the wide)
const SLOT_Y = 306;
const ARCHIVE_BOTTOM = -40; // the ARCHIVE sits above the booth and feeds the record slot through a chute
const SLOT_CLIP = 322; // the record is fed out of the slot: nothing of it shows above this line
const WIN_Y = 1016;
const WIN_H = 78;
const Q1 = 'Does the source exist?';
const Q2 = 'Does it actually say this?';
const SIGN_FONT = `800 ${SIGN_FONT_PX}px "Nunito Variable"`;

/* ------------------------------------------------------------------ cues (global frames) */
const K = {
  the: at('s29', 'The'),
  ungl: at('s29', 'unglamorous'),
  move: at('s29', 'move:'),
  check: at('s29', 'check.'),
  s29End: segEnd('s29'),
  two: at('s30', 'Two'),
  questions: at('s30', 'questions.'),
  does1: at('s30', 'Does'),
  exist: at('s30', 'exist?'),
  and: at('s30', 'And'),
  does2: at('s30', 'does', 2),
  actually: at('s30', 'actually'),
  this: at('s30', 'this?'),
  take: at('s31', 'Take'),
  chatgpt: at('s31', 'ChatGPT'),
  slip: at('s31', 'slip.'),
  is: at('s31', 'Is'),
  thesis: at('s31', 'thesis'),
  adam: at('s31', 'Adam'),
  kalai: at('s31', 'Kalai'),
  carnegie: at('s31', 'Carnegie'),
  yes: at('s31', 'Yes.'),
  doesSay: at('s31', 'Does'),
  boosting: at('s31', 'Boosting'),
  online: at('s31', 'Online'),
  algorithms: at('s31', 'Algorithms'),
  y2002: at('s31', '2002?'),
  no: at('s31', 'No.'),
  it2: at('s31', 'It', 2),
  prob: at('s31', 'Probabilistic'),
  and2: at('s31', 'and'),
  online2: at('s31', 'online', 2),
  methods: at('s31', 'Methods'),
  y2001: at('s31', '2001.'),
  source: at('s32', 'Source'),
  exists: at('s32', 'exists.'),
  claim: at('s32', 'Claim'),
  fails: at('s32', 'fails.'),
  stamp: at('s32', 'Stamp'),
  it: at('s32', 'it.'),
};
const START = scene('S9').from - 5; // mounted 5 frames early under the S8 → S9 wipe
const END = scene('S9').to; // cut to S10 here: the last frame we draw is END - 1
// s29
const SHRUG = K.ungl + 2; // a look to camera and a small shrug: the unglamorous preparation
const GRIP = K.move - 2; // left hand onto the lever
const PULL = K.check - 2; // the pull starts …
const POWER = K.check + 2; // … and bottoms out: clunk, power
// s30
const BADGE = [K.questions + 16, K.questions + 22]; // as the pull-back lands
const SIGN = [K.does1 - 2, K.does2 - 2];
const DEMO1 = SIGN[0] + 20; // gate ① shows what it does: archive drawer, slot lamp
const DEMO2 = K.actually + 8; // gate ② shows what it does: the scan heads sweep (after the sign settles and "actually" is marked)
// s31
const TAKE_DOWN = K.take - 6;
const TAKE_RISE = K.take + 3;
const PUSH = K.slip - 1;
const CARRY1 = PUSH + 8;
const ARRIVE1 = CARRY1 + 20;
const READ1 = ARRIVE1 + 2;
const SEARCH = [ARRIVE1 + 4, ARRIVE1 + 8]; // the slot lamp blinks while the lookup runs down the chute; then the record comes out
const EMERGE = ARRIVE1 + 12;
const REC_LAND = EMERGE + 13;
const NAME_BOX = K.kalai + 5; // the push into the record has settled by then
const CMU_BOX = K.carnegie + 2;
const YES = K.yes + 1;
const CARRY2 = YES + 9;
const ARRIVE2 = CARRY2 + 32;
const W_B = K.boosting;
const W_O = K.online;
const W_A = K.algorithms;
const W_Y = K.y2002 + 1;
const NO = K.no + 1;
const SCAN_B = K.it2 + 5;
const Y2001 = K.y2001 + 2;
// s32
const WIN_SRC = K.source + 6;
const WIN_CLAIM = K.claim + 2;
const ARM_IN = K.stamp - 16; // after "fails." has been said (and read): the hand is not over the verdict while it lands
const SCAN_OFF = K.stamp - 16;
const HIT = K.it + 1;
const ARM_OUT = HIT + 4; // the hand withdraws down along its forearm, clear of the slip before it lifts
const LIFT = HIT + 9;
const LIFT_DUR = END - 1 - LIFT; // lands exactly on H910 on the last frame

/* ------------------------------------------------------------------ sound cues (see lib/sfx.ts) */
export const SFX: Sfx[] = [
  {f: START, kind: 'amb_machine', dur: (END - START) / 30},
  {f: GRIP + 6, kind: 'hanger_click', gain: -10, pitch: -4, note: 'hand closes on the lever knob'},
  {f: POWER, kind: 'machine_clunk', gain: 2, note: 'start lever bottoms out'},
  {f: POWER + 1, kind: 'machine_hum', dur: (END - POWER) / 30, gain: -12},
  {f: POWER + 1, kind: 'pop_tick', gain: -14, pitch: 4, note: 'name plate flickers on'},
  {f: POWER + 5, kind: 'pop_tick', gain: -16, pitch: 2},
  {f: POWER + 4, kind: 'conveyor_run', dur: (TAKE_RISE + 10 - POWER - 4) / 30, gain: -16, note: 'belt idles'},
  {f: BADGE[0], kind: 'pop_tick', gain: -6, note: 'badge ① lights'},
  {f: BADGE[1], kind: 'pop_tick', gain: -6, pitch: 3, note: 'badge ② lights'},
  {f: SIGN[0] + 6, kind: 'hanger_click', note: 'question ① swings down'},
  {f: DEMO1 + 2, kind: 'drawer_open', gain: -10},
  {f: DEMO1 + 14, kind: 'drawer_close', gain: -12},
  {f: SIGN[1] + 6, kind: 'hanger_click', pitch: -2, note: 'question ② swings down'},
  {f: K.actually, kind: 'marker_sweep', gain: -8, pitch: 2, note: '"actually" underlined on the sign'},
  {f: DEMO2, kind: 'scanner_sweep', dur: 0.7, gain: -8},
  {f: TAKE_RISE, kind: 'paper_lift', gain: -4, note: 'the checker lifts the ChatGPT slip'},
  {f: PUSH + 2, kind: 'paper_slide', gain: -4, note: 'slid onto the belt'},
  {f: CARRY1, kind: 'conveyor_run', dur: 0.7, gain: -6},
  {f: ARRIVE1, kind: 'conveyor_clunk'},
  {f: READ1, kind: 'scanner_sweep', dur: 0.4, gain: -6, note: 'gate ① reads the citation'},
  ...SEARCH.map((f, i) => ({f, kind: 'pop_tick' as const, gain: -10, pitch: 2 + i * 2, note: 'searching the archive'})),
  {f: EMERGE, kind: 'printer_feed', note: 'the real record is fed out of the slot'},
  {f: REC_LAND, kind: 'paper_slap', gain: -2},
  {f: NAME_BOX, kind: 'marker_circle', gain: -4},
  {f: CMU_BOX, kind: 'marker_circle', gain: -4, pitch: 2},
  {f: YES, kind: 'indicator_yes'},
  {f: CARRY2, kind: 'conveyor_run', dur: 1.1, gain: -4},
  {f: ARRIVE2, kind: 'conveyor_clunk', pitch: -1},
  {f: ARRIVE2 + 2, kind: 'scanner_sweep', dur: (NO - ARRIVE2) / 30, gain: -10, note: 'gate ② reads the slip'},
  ...[W_B, W_O, W_A, W_Y].map((f, i) => ({f, kind: 'pop_tick' as const, gain: -12, pitch: i * 2})),
  {f: NO, kind: 'indicator_no'},
  {f: SCAN_B, kind: 'scanner_sweep', dur: (Y2001 + 12 - SCAN_B) / 30, gain: -10, note: 'gate ② reads the record'},
  {f: K.prob, kind: 'marker_sweep', gain: -6},
  {f: K.online2, kind: 'marker_sweep', gain: -8, pitch: 2},
  {f: K.methods, kind: 'marker_sweep', gain: -9, pitch: 3},
  {f: Y2001, kind: 'marker_sweep', pitch: 4, note: '2001 highlighted'},
  {f: WIN_SRC, kind: 'machine_clunk', gain: -8, pitch: 4, note: 'verdict window flips: Source exists'},
  {f: WIN_SRC + 4, kind: 'indicator_yes', gain: -8},
  {f: WIN_CLAIM, kind: 'claim_fails', gain: -5}, // V3: was the loudest effect under speech
  {f: ARM_IN + 4, kind: 'whoosh_soft', gain: -14, note: 'the checking hand rises into frame'},
  {f: HIT, kind: 'stamp_heavy'},
  {f: LIFT, kind: 'paper_lift', gain: -2, note: 'the stamped slip lifts toward camera (into S10)'},
];

/* ------------------------------------------------------------------ camera */
/* Framings (world rects they must hold; see the arithmetic notes):
 *  m29  checker, lever, name plate, belt start; below gate ①'s scan head (lens bottom ≈ 460)
 *  w30  both booths whole incl. rails (x 886…4174) with ≈ 60 px to spare each side; sign text 86 × 0.545 ≈ 47 px
 *  t31  checker + slip held up: "ChatGPT" 27 × 1.65 ≈ 45 px
 *  g1m  booth ① whole incl. rail, sign, record slot and ≈ 50 px of the chute above the rail (archive, y ≤ −40,
 *       out); booth ② out
 *  g1r  gate lamp (Sx+342) … record right (Sx+1190) with ≈ 35–45 px each side; y 458…985 (record top 494, belt top 960); slip and booth ①'s
 *       right pillar (Sx+1244) out; name ≈ 41 px
 *  g2s  the slip and the gate lamp, close: x 2662…3392 (slip outline 2682 → 53 px in; lamp label 3344 → 127 px in;
 *       booth ②'s left pillar, right edge 2656, just out); y 587…998 (the frame bottom sits on the belt's lower edge,
 *       so no sliver of the blank verdict window below it; slip top 678 → 240 px of back panel and scanner light
 *       above it); record (Sx+590) out; slip text 23 × 2.63 ≈ 60 px, its guard-rail line 18 × 2.63 ≈ 47 px
 *  g2r  wholly inside the card (x ±291 of its ±300; y 503…830 below its top border at 494–498): title line 1 →
 *       CMU-CS line, "School…" (y 846) out; the whole sheet is dimmed except tight holes on the title line and
 *       "2001", so no bright margin band shows at the edges; "2001" ≈ 66 px, highlighted like the title
 *  g2m  booth ② whole (pillars ≈ 76 px inside the frame edges), both documents, both verdict windows; verdicts 50 × 1.14
 *       = 57 px; the stamp hand (scale 1.8) enters only after "fails." */
const SHOTS = {
  m29a: {cx: 460, cy: 850, zoom: 1.5},
  m29b: {cx: 440, cy: 855, zoom: 1.56},
  w30: {cx: (B1.x0 + B2.x1) / 2, cy: 548, zoom: 0.545},
  w30b: {cx: (B1.x0 + B2.x1) / 2, cy: 552, zoom: 0.549},
  t31: {cx: 560, cy: 820, zoom: 1.65},
  g1m: {cx: (B1.x0 + B1.x1) / 2, cy: 551, zoom: 1.1},
  g1r: {cx: SX1 + 762, cy: 722, zoom: 2.05},
  g2s: {cx: SX2 + 157, cy: 793, zoom: 2.63},
  g2r: {cx: RX2, cy: 667, zoom: 3.3},
  g2m: {cx: (B2.x0 + B2.x1) / 2, cy: 790, zoom: 1.14},
};
const camAt = (g: number): Cam => {
  const c = camPath(g, SHOTS.m29a, [
    {at: START, dur: PULL - START, to: SHOTS.m29b, ease: E.inOut}, // a slow push while the checker gets ready
    {at: POWER + 12, dur: 26, to: SHOTS.w30}, // the power runs down the line: pull back to reveal both gates
    {at: POWER + 38, dur: 100, to: SHOTS.w30b}, // a slow drift while the questions drop
    {at: TAKE_DOWN - 12, dur: 21, to: SHOTS.t31}, // back to the checker: "Take the ChatGPT slip" (settled as the slip rises)
    {at: CARRY1, dur: 26, to: SHOTS.g1m}, // follow the slip into gate ①
    {at: REC_LAND + 2, dur: 14, to: SHOTS.g1r}, // push into the record: name, university (settled before the first box)
    {at: CARRY2, dur: 34, to: SHOTS.g2s}, // follow the belt to gate ②: the slip's claim
    {at: NO + 13, dur: 22, to: SHOTS.g2r}, // across to the record: what it actually says
    {at: Y2001 + 17, dur: 22, to: SHOTS.g2m}, // back to see both, and the verdict
  ]);
  return {...c, zoom: c.zoom * camKick(g, [POWER, NO, WIN_CLAIM, HIT], 0.012)};
};

/* ------------------------------------------------------------------ helpers */
const bell = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});
/** hinged sign / plate swing: 90° folded up → falls, overshoots toward the viewer, swings back, settles */
const flap = (g: number, t0: number) =>
  g < t0 ? 90 : kf(g, [[t0, 90], [t0 + 6, -14, E.in], [t0 + 11, 7, E.inOut], [t0 + 16, -3, E.inOut], [t0 + 21, 0, E.inOut]]);
/** split-flap verdict card: blank face → turns over with a little over-rotation → settles */
const flip = (g: number, t0: number) => (g < t0 ? 0 : kf(g, [[t0, 0], [t0 + 5, 194, E.in], [t0 + 9, 173, E.inOut], [t0 + 13, 180, E.inOut]]));
const lampOn = (g: number, x: number) => (g >= POWER + 3 + (x - 300) / 55 ? 1 : 0);
const blinkSq = (g: number, period = 8) => (Math.floor(g / period) % 2 === 0 ? 1 : 0.3);

/* ------------------------------------------------------------------ the lever */
const leverAngle = (g: number) => kf(g, [[PULL - 8, -10], [PULL - 2, -16, E.out], [POWER, 58, E.in], [POWER + 3, 63, E.out], [POWER + 9, 55, E.inOut]]);
const knob = (g: number) => {
  const r = (leverAngle(g) * Math.PI) / 180;
  return {x: LEV.x + Math.sin(r) * LEV.len, y: LEV.y - Math.cos(r) * LEV.len};
};

/* ------------------------------------------------------------------ the documents */
const slipX = (g: number) =>
  kf(g, [[PUSH, SX0], [PUSH + 8, SX0 + 20, E.out], [CARRY1, SX0 + 20], [ARRIVE1, SX1, E.inOut], [CARRY2, SX1], [ARRIVE2, SX2, E.inOut]]);
type DocPose = {x: number; top: number; rot: number; visible: boolean};
const slipPose = (g: number): DocPose => {
  const visible = g >= TAKE_RISE;
  const top = g < TAKE_RISE ? BELT_Y + 10 : kf(g, [[TAKE_RISE, BELT_Y + 4], [TAKE_RISE + 10, SLIP_TOP0, E.softBack]]);
  const jolt = 4 * ring(g, NO, 1.3, 0.35) + 3 * ring(g, WIN_CLAIM, 1.2, 0.3) + (g >= HIT ? 6 * Math.exp(-(g - HIT) * 0.4) : 0);
  const rot =
    -2.2 * bell(g, CARRY1, 10) +
    1.8 * ring(g, ARRIVE1, 0.9, 0.22) -
    2.4 * bell(g, CARRY2, 12) +
    2.0 * ring(g, ARRIVE2, 0.9, 0.22) +
    1.2 * ring(g, NO, 1.4, 0.3) +
    1.6 * ring(g, WIN_CLAIM, 1.2, 0.25) +
    1.8 * ring(g, HIT, 1.1, 0.3);
  return {x: slipX(g), top: top + jolt, rot, visible};
};
const recPose = (g: number): DocPose => {
  const x = g < CARRY2 ? RX1 : RX1 + (slipX(g) - SX1);
  const top = g < EMERGE ? SLOT_CLIP - REC_H - 20 : g <= REC_LAND ? kf(g, [[EMERGE, SLOT_CLIP - REC_H], [REC_LAND, REC_TOP0, E.in]]) : REC_TOP0 + drop(g, REC_LAND, 110, 4);
  const rot = 1.4 * ring(g, REC_LAND, 0.9, 0.25) - 1.8 * bell(g, CARRY2, 12) + 1.6 * ring(g, ARRIVE2, 0.9, 0.22) + 0.8 * ring(g, WIN_SRC, 1.2, 0.3);
  return {x, top, rot, visible: g >= EMERGE};
};

/** The record's highlighter sweep along title line 1, in image px from its left edge, word by word with the voice. */
const titleSweep = (g: number) => {
  const t1 = REC_BOX.title1;
  const ws = REC_BOX.titleWords.map((b) => ({s: b.x - t1.x + 6, e: b.x + b.w - t1.x + 12}));
  if (g < K.prob - 1) return 0;
  return kf(g, [
    [K.prob - 1, ws[0].s],
    [K.prob + 16, ws[0].e, E.inOut],
    [K.and2, ws[1].s - 4],
    [K.and2 + 4, ws[1].e, E.inOut],
    [K.online2, ws[2].s - 4],
    [K.online2 + 11, ws[2].e, E.inOut],
    [K.methods, ws[3].s - 4],
    [K.methods + 12, ws[3].e, E.inOut],
  ]);
};

/* ------------------------------------------------------------------ the fact-checker */
const checkerPose = (g: number, slip: DocPose): {pose: Pose; life: number} => {
  let p = P({lookX: 0.25, lookY: 0.35, mouth: 'flat', brows: 0});
  // "The …": eyes to the lever
  p = mixPose(p, P({...p, lookX: -0.75, lookY: 0.45}), tw(g, K.the - 2, 6) * (1 - tw(g, SHRUG - 2, 5)));
  // "unglamorous": a look to camera and a small, honest shrug (it is not exciting; it works)
  const shrugLook = tw(g, SHRUG - 3, 6) * (1 - tw(g, GRIP - 4, 6));
  p = mixPose(p, P({...p, lookX: 0.04, lookY: 0.04, brows: -0.15, browAsym: 0.25, mouth: 'flat'}), shrugLook);
  const gl = bell(g, SHRUG + 2, 16);
  p = {...p, tilt: p.tilt + 4 * gl, bob: (p.bob ?? 0) - 7 * gl};
  if (g >= SHRUG + 9 && g < SHRUG + 13) p = {...p, blink: 0.1};
  // "move:": eyes back on the lever as the hand closes on it
  p = mixPose(p, P({...p, lookX: -0.8, lookY: 0.5, brows: -0.25}), tw(g, GRIP - 3, 6) * (1 - tw(g, POWER + 1, 5)));
  // the pull: leans into it, the clunk bobs them; then a level look to camera with one brow up — job done
  p = {...p, lean: p.lean - 4 * bell(g, PULL - 3, 13), bob: (p.bob ?? 0) + 6 * bell(g, POWER - 1, 8)};
  p = mixPose(p, P({...p, lookX: 0.02, lookY: 0.02, browAsym: 0.75, brows: 0.05, mouth: 'flat'}), tw(g, POWER + 2, 6));
  p = {...p, bob: (p.bob ?? 0) + hop(g, POWER + 9, -4, 9)};
  // the machine wakes up down the line: a glance after it
  p = mixPose(p, P({...p, lookX: 0.85, lookY: 0.15, browAsym: 0.3}), tw(g, POWER + 18, 8));
  // "Take": down to the tray, up with the slip, a sceptical look to camera on "ChatGPT", then sends it on its way
  p = mixPose(p, P({...p, lookX: 0.45, lookY: 0.85, browAsym: 0, brows: 0}), tw(g, TAKE_DOWN - 4, 6));
  p = mixPose(p, P({...p, lookX: 0.75, lookY: 0.3, brows: 0.35}), tw(g, TAKE_RISE + 3, 6));
  p = mixPose(p, P({...p, lookX: 0.05, lookY: 0.05, browAsym: 0.9, brows: 0, mouth: 'hmm'}), tw(g, K.chatgpt + 6, 6) * (1 - tw(g, PUSH - 5, 6)));
  p = mixPose(p, P({...p, lookX: 0.95, lookY: 0.25, browAsym: 0.2, mouth: 'flat'}), tw(g, PUSH, 6));
  p = {...p, lean: p.lean + 3 * bell(g, PUSH - 2, 14), bob: (p.bob ?? 0) + 7 * bell(g, TAKE_DOWN - 2, 16)};

  const ch = {...CHK, bob: p.bob};
  const restL = reach(ch, -1, 262, 950);
  const restR = reach(ch, 1, 412, 950);
  // left hand: onto the knob (and with it through the pull), then back to the counter
  const kn = knob(g);
  let armL = mixArm(restL, reach(ch, -1, kn.x, kn.y), tw(g, GRIP, 7, E.inOut));
  if (g >= POWER + 10) {
    const k0 = knob(POWER + 10);
    armL = mixArm(reach(ch, -1, k0.x, k0.y), restL, tw(g, POWER + 10, 9, E.inOut));
  }
  // the shrug lifts both hands a little off the counter, palms out
  armL = mixArm(armL, reach(ch, -1, 236, 925), gl * (1 - tw(g, GRIP - 2, 3)));
  // right hand: down over the counter edge for the slip, up with it (holding its edge), the push, and back
  let armR = mixArm(restR, reach(ch, 1, 438, 925), gl);
  armR = mixArm(armR, reach(ch, 1, SX0 - 190, 975), tw(g, TAKE_DOWN, 8, E.inOut));
  // the hand holds the slip by its left edge at arm's length (thumb on the margin, the arm clear of the text)
  const GRIP_X = -10;
  const GRIP_Y = 130;
  if (g >= TAKE_RISE && g < CARRY1) armR = reach(ch, 1, slip.x - SLIP_W / 2 + GRIP_X, Math.min(slip.top + GRIP_Y, 975));
  if (g >= CARRY1) {
    const s0 = slipPose(CARRY1);
    armR = mixArm(reach(ch, 1, s0.x - SLIP_W / 2 + GRIP_X, s0.top + GRIP_Y), restR, tw(g, CARRY1, 10, E.inOut));
  }
  const precise = (g >= GRIP - 2 && g < POWER + 18) || (g >= TAKE_DOWN - 2 && g < CARRY1 + 8);
  return {pose: {...p, armL, armR}, life: precise ? 0.3 : 0.9};
};

/* ------------------------------------------------------------------ scene */
export const S9Verify: React.FC = () => {
  const g = useG();
  useFontsReady();
  const {boxes, measurer} = useSlipTokenBoxes();
  const cam = camAt(g);
  const slip = slipPose(g);
  const rec = recPose(g);
  const chk = checkerPose(g, slip);
  const signW = [Q1, Q2].map((q) => textWidth(q, SIGN_FONT) + 100);
  const spec1: BoothSpec = {...B1, n: 1, question: Q1, signW: signW[0]};
  const spec2: BoothSpec = {...B2, n: 2, question: Q2, signW: signW[1]};
  // "actually" gets a marker stroke on the sign as it is said (the stressed word of the second question)
  const actuallyMark = {x: 50 - OUTLINE + textWidth('Does it ', SIGN_FONT), w: textWidth('actually', SIGN_FONT), t: tw(g, K.actually, 7, E.out)};

  // power
  const plate = g < POWER + 1 ? 0 : g < POWER + 3 ? 1 : g < POWER + 5 ? 0 : g < POWER + 6 ? 0.7 : g < POWER + 8 ? 0.15 : 1;
  const on = (x: number) => lampOn(g, x);
  const machineShudder = 2 * ring(g, POWER, 1.6, 0.35) + 1.2 * ring(g, ARRIVE1, 1.6, 0.4) + 1.4 * ring(g, ARRIVE2, 1.6, 0.4) + 1.5 * ring(g, WIN_CLAIM, 1.6, 0.4) + 1.2 * ring(g, HIT, 1.6, 0.4);

  // belt: idles after power-on, stops as the slip is set down, then carries it (and later the record) gate to gate
  let crawl = 0;
  const ca = POWER + 4;
  const cb = TAKE_RISE + 4;
  for (let t = ca; t < Math.min(g, cb + 6); t++) crawl += 2.4 * Math.min(1, (t - ca) / 10) * Math.min(1, Math.max(0, (cb + 6 - t) / 6));
  const beltPos = crawl + Math.max(0, slipX(g) - (SX0 + 20));

  // gate ①: lookup
  const pull = 0.7 * bell(g, DEMO1, 16) + bell(g, ARRIVE1 + 4, 10) + bell(g, ARRIVE1 + 14, 8);
  const search = SEARCH.some((t) => g >= t && g < t + 3) || (g >= DEMO1 + 2 && g < DEMO1 + 5) || (g >= DEMO1 + 8 && g < DEMO1 + 11) ? 1 : 0;
  const lip = tw(g, EMERGE, 3) * (1 - tw(g, REC_LAND - 2, 6)) + 0.5 * ring(g, REC_LAND, 1.1, 0.3);
  const lamp1State = g >= YES + 1 ? 2 : g >= READ1 || (g >= DEMO1 && g < DEMO1 + 14) ? 1 : 0;
  const lamp2State = g >= NO + 1 ? 3 : g >= ARRIVE2 + 2 || (g >= DEMO2 && g < DEMO2 + 18) ? 1 : 0;

  // slip reading (token lighting is light: it never prints on the slip)
  const T = {
    cite: Array.from({length: 9}, (_, k) => k),
    cmu: tok('CMU)'),
    b: tok('“Boosting,'),
    o: tok('Online'),
    a: tok('Algorithms,'),
    y: tok('2002'),
  };
  const off1 = 1 - tw(g, REC_LAND, 10);
  const off2 = 1 - tw(g, SCAN_OFF, 10);
  const lit = (k: number) => {
    if (g < ARRIVE2) {
      if (k <= 8) return tw(g, READ1 + 1 + k * 0.6, 3) * off1;
      if (k === T.cmu) return tw(g, READ1 + 9, 3) * off1;
      return 0;
    }
    if (k === T.b) return tw(g, W_B, 4) * off2;
    if (k === T.o) return tw(g, W_O, 4) * off2;
    if (k === T.a) return tw(g, W_A, 4) * off2;
    if (k === T.y) return tw(g, W_Y, 4) * off2;
    return 0;
  };
  const coral = tw(g, NO, 5);
  const wash = g < ARRIVE2 ? 0.55 * tw(g, READ1, 6) * off1 : tw(g, ARRIVE2 + 2, 8) * (1 - tw(g, Y2001 + 13, 10));
  const slipBoxWorld = (b: TokBox, s: DocPose) => ({x0: s.x - SLIP_W / 2 + b.x, y0: s.top + b.y, x1: s.x - SLIP_W / 2 + b.x + b.w, y1: s.top + b.y + b.h});
  // beam targets (slip-local), keyframed so the light slides from word to word
  const tgt1 = (k: 0 | 1) => (k === 0 ? unionBox(boxes, T.cite) : unionBox(boxes, [T.cmu]));
  const tgt2 = [unionBox(boxes, [T.b]), unionBox(boxes, [T.b, T.o]), unionBox(boxes, [T.b, T.o, T.a]), unionBox(boxes, [T.y])];
  const keyed = (keys: [number, TokBox][]): TokBox => {
    const f = (sel: (b: TokBox) => number) => kf(g, keys.map(([t, b], i) => [t, sel(b), i ? E.inOut : undefined] as [number, number, ((x: number) => number)?]));
    return {x: f((b) => b.x), y: f((b) => b.y), w: f((b) => b.w), h: f((b) => b.h)};
  };
  const beam1Box = keyed([[READ1 + 7, tgt1(0)], [READ1 + 11, tgt1(1)]]);
  const beam2Box = keyed([[W_B, tgt2[0]], [W_O, tgt2[0]], [W_O + 4, tgt2[1]], [W_A, tgt2[1]], [W_A + 4, tgt2[2]], [W_Y - 2, tgt2[2]], [W_Y + 4, tgt2[3]]]);
  const b1 = slipBoxWorld(beam1Box, slip);
  const b2 = slipBoxWorld(beam2Box, slip);
  const head1On = tw(g, READ1, 4) * off1;
  const head2On = (g < ARRIVE2 ? bell(g, DEMO2, 22) : tw(g, ARRIVE2 + 2, 4)) * off2;
  const head1X = SX1 + (b1.x0 + b1.x1) / 2 - slip.x;
  const demoX = SX2 + 160 * Math.sin(((g - DEMO2) / 22) * Math.PI * 2);
  const head2X = g < ARRIVE2 ? (g >= DEMO2 && g < DEMO2 + 22 ? demoX : SX2) : (b2.x0 + b2.x1) / 2;
  // record reading
  const recImg = (r: DocPose) => ({x: r.x - REC_W / 2 + REC_IMG_OX, y: r.top + REC_IMG_OY});
  const ri = recImg(rec);
  const sweep = titleSweep(g);
  const t1 = REC_BOX.title1;
  const yb = REC_BOX.y2001;
  const recTarget = g < Y2001 - 2 ? {x0: ri.x + t1.x - 6 + Math.max(0, sweep - 60), y0: ri.y + t1.y, x1: ri.x + t1.x - 6 + Math.max(60, sweep), y1: ri.y + t1.y + t1.h} : {x0: ri.x + yb.x - 8, y0: ri.y + yb.y, x1: ri.x + yb.x + yb.w + 8, y1: ri.y + yb.y + yb.h};
  const head3On = (g < ARRIVE2 ? bell(g, DEMO2 + 4, 22) : tw(g, SCAN_B, 4)) * off2;
  // inside the record close-up the head is far out of frame and its light would only smear the highlighter: it
  // fades out as the camera goes in and comes back as it pulls out
  const inRecord = tw(g, NO + 13, 10) * (1 - tw(g, Y2001 + 30, 10));
  const head3X = g < ARRIVE2 ? RX2 - 140 * Math.sin(((g - DEMO2 - 4) / 22) * Math.PI * 2) : kf(g, [[SCAN_B, ri.x + t1.x + 60], [K.prob, ri.x + t1.x + 60], [K.methods + 12, ri.x + t1.x + t1.w - 40, E.inOut], [Y2001 - 2, ri.x + t1.x + t1.w - 40], [Y2001 + 3, ri.x + yb.x + yb.w / 2, E.inOut]]);
  const recMarks = {
    name: tw(g, NAME_BOX, 12, E.inOut),
    cmu: tw(g, CMU_BOX, 12, E.inOut),
    sweep,
    y2001: tw(g, Y2001, 9, E.out),
    dim: g < CARRY2 ? tw(g, NAME_BOX - 2, 8) * (1 - tw(g, YES + 6, 10)) : tw(g, SCAN_B + 2, 8) * (1 - tw(g, Y2001 + 13, 10)),
    holes: (g < CARRY2
      ? [{k: 'name', a: 1}, {k: 'cmu', a: tw(g, CMU_BOX - 4, 6)}]
      : [{k: 'title1', a: 1}, {k: 'y2001', a: tw(g, Y2001 - 4, 6)}]) as {k: 'name' | 'cmu' | 'title1' | 'y2001'; a: number}[],
    pulse: bell(g, YES, 18),
  };
  const [rsx, rsy] = impact(g, REC_LAND, 0.05, 8);

  // the stamp: the viewer's hand, aimed at the slip's stamp point
  const stampWorld = {x: SX2 - SLIP_W / 2 + SLIP_STAMP_AT.x, y: SLIP_TOP0 + SLIP_STAMP_AT.y};
  const stampPt = worldToScreen(cam, stampWorld.x, stampWorld.y, 1);
  const [ix, iy] = impact(g, HIT, 0.12, 8);
  const inkPop = g >= HIT ? lerp(1.15, 1, tw(g, HIT, 6, E.out)) : 1;
  const stamps: SlipStamp[] = g >= HIT ? [{...H910.stamp, scale: inkPop, sx: ix, sy: iy}] : [];

  // lift into S10 (H910); the stamping hand is pulled away first
  const lifted = g >= LIFT;
  const armOut = 1100 * tw(g, ARM_OUT, 8, (x) => x * x);

  return (
    <AbsoluteFill style={{background: C.blueLight}}>
      {measurer}
      <Camera cam={cam}>
        <Layer depth={0.75}>
          <RoomWall />
        </Layer>
        <Layer depth={1}>
          <RoomFloor />
          <div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${machineShudder * 0.5}px)`}}>
            {/* gate ①: the ARCHIVE sits on top; the record slot feeds the retrieved record down onto the belt */}
            <Archive x={RX1} w={600} top={-1000} bottom={ARCHIVE_BOTTOM} pull={pull} lit={on(B1.x0)} />
            <Booth spec={spec1} badge={tw(g, BADGE[0], 7)} flapDeg={flap(g, SIGN[0])} g={g} leds={on(B1.x0)}>
              <SlotOutline x0={RX1 - REC_W / 2 - 8} y0={REC_TOP0 - 8} x1={RX1 + REC_W / 2 + 8} y1={SLIP_BOT + 2} label="SOURCE" />
              <Gantry x0={SX1 - 210} x1={SX1 + 250} />
              <ScanHead x={head1X} on={head1On} />
              <Chute x={RX1 + 262} top={ARCHIVE_BOTTOM - 20} bottom={SLOT_Y + 4} chase={tw(g, ARRIVE1 + 3, 10, E.in) + tw(g, DEMO1 - 2, 12, E.in) * (g < SEARCH[0] - 10 ? 1 : 0)} />
              <RecordSlot x={RX1} y={SLOT_Y} w={REC_W + 16} search={search} lip={lip} />
              <GateLamp x={SX1 + LAMPO} y={LAMP_Y} state={lamp1State} blink={blinkSq(g)} pop={bell(g, YES, 10)} flip={Math.abs(Math.cos(Math.PI * tw(g, YES - 3, 8)))} on={on(SX1 + LAMPO)} />
            </Booth>
            {/* gate ②: two scan heads on a gantry, the result lamp between the documents */}
            <Booth spec={spec2} badge={tw(g, BADGE[1], 7)} flapDeg={flap(g, SIGN[1])} g={g} leds={on(B2.x0)} mark={actuallyMark}>
              <SlotOutline x0={SX2 - SLIP_W / 2 - 8} y0={SLIP_TOP0 - 8} x1={SX2 + SLIP_W / 2 + 8} y1={SLIP_BOT + 2} label="CLAIM" />
              <SlotOutline x0={RX2 - REC_W / 2 - 8} y0={REC_TOP0 - 8} x1={RX2 + REC_W / 2 + 8} y1={SLIP_BOT + 2} label="SOURCE" />
              <Gantry x0={SX2 - 210} x1={RX2 + 320} />
              <ScanHead x={head2X} on={head2On} />
              <ScanHead x={head3X} on={head3On} />
              <GateLamp x={SX2 + LAMPO} y={LAMP_Y} state={lamp2State} blink={blinkSq(g)} pop={bell(g, NO, 10)} flip={Math.abs(Math.cos(Math.PI * tw(g, NO - 3, 8)))} on={on(SX2 + LAMPO)} />
            </Booth>
            {/* the console: start lever (behind the checker), the checker */}
            <Lever x={LEV.x} y={LEV.y} len={LEV.len} angle={leverAngle(g)} lamp={on(LEV.x + 300)} />
            <Character look={CAST.checker} pose={chk.pose} frame={g} seed={9} x={CHK.x} y={CHK.y} scale={CHK.scale} front="R" pass="body" life={chk.life} shadow={false} />
            {/* the documents stand in the belt groove; the record is fed out of the slot (nothing shows above it) */}
            <div style={{position: 'absolute', left: -1000, top: SLOT_CLIP, width: 7000, height: SLIP_BOT - SLOT_CLIP + 2, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 1000, top: -SLOT_CLIP}}>
                {rec.visible && (
                  <div style={{position: 'absolute', left: rec.x - REC_W / 2, top: rec.top, width: REC_W, height: REC_H, transform: `rotate(${rec.rot}deg) scale(${rsx}, ${rsy})`, transformOrigin: '50% 100%'}}>
                    <RecordCard marks={recMarks} marksUnderDim={g >= YES + 16} />
                  </div>
                )}
                {slip.visible && !lifted && (
                  <div style={{position: 'absolute', left: slip.x - SLIP_W / 2, top: slip.top, width: SLIP_W, height: SLIP_H, transform: `rotate(${slip.rot}deg)`, transformOrigin: '50% 100%'}}>
                    <AnswerSlipArt i={0} stamps={stamps} />
                    <div style={{position: 'absolute', left: 0, top: 0}}>
                      <SlipScan lit={lit} coral={coral} wash={wash} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Character look={CAST.checker} pose={chk.pose} frame={g} seed={9} x={CHK.x} y={CHK.y} scale={CHK.scale} front="R" pass="frontArm" shadow={false} life={chk.life} />
            {/* light from the scan heads */}
            <Beam id="s9b1" hx={head1X} tx0={b1.x0} ty0={b1.y0} tx1={b1.x1} ty1={b1.y1} on={head1On * (g >= READ1 + 1 ? 1 : 0)} />
            <Beam id="s9b2" hx={head2X} tx0={g < ARRIVE2 ? head2X - 90 : b2.x0} ty0={g < ARRIVE2 ? BELT_Y - 20 : b2.y0} tx1={g < ARRIVE2 ? head2X + 90 : b2.x1} ty1={g < ARRIVE2 ? BELT_Y - 6 : b2.y1} on={head2On} tone={coral} />
            <Beam id="s9b3" hx={head3X} tx0={g < ARRIVE2 ? head3X - 110 : recTarget.x0} ty0={g < ARRIVE2 ? BELT_Y - 20 : recTarget.y0} tx1={g < ARRIVE2 ? head3X + 110 : recTarget.x1} ty1={g < ARRIVE2 ? BELT_Y - 6 : recTarget.y1} on={head3On * (g < ARRIVE2 ? 1 : 1 - inRecord)} />
            {/* belt, front panel, power lamps; the console's name plate; the verdict windows */}
            <MachineFront
              pos={beltPos}
              lampOn={on}
              g={g}
              seams={[B1.x0 - 20, B2.x0 - 35]}
              skip={[
                [SX2 - 200, SX2 + 200],
                [RX2 - 250, RX2 + 250],
              ]}
              x1={M_X1}
            />
            <NamePlate x={20} y={1014} w={436} h={86} on={plate} />
            {/* x 480…≈ 740: wholly left of the two-gate wide's frame edge (world x ≈ 769), so it is never cut there */}
            <PaintedPlate x={480} y={1032} text="CLAIM IN →" size={34} />
            <PencilCup x={30} y={954} />
            <VerdictWindow cx={SX2} y={WIN_Y} w={380} h={WIN_H} text="Claim fails ✕" tone="coral" flipDeg={flip(g, WIN_CLAIM)} />
            <VerdictWindow cx={RX2} y={WIN_Y} w={470} h={WIN_H} text="Source exists ✓" tone="teal" flipDeg={flip(g, WIN_SRC)} />
          </div>
        </Layer>
      </Camera>

      {/* as the stamped slip lifts toward the viewer, the machine room behind it recedes (a light veil, no blur) */}
      {lifted && <AbsoluteFill style={{background: `rgba(22,42,50,${0.16 * tw(g, LIFT, LIFT_DUR, E.inOut)})`}} />}

      {/* the stamped slip lifts toward the viewer and lands exactly on H910 (S10 opens on the same frame) */}
      {lifted && <LiftedSlip g={g} />}

      {/* the checking hand (point of view, teal sleeve as in S1): one heavy stamp on "it.", then it withdraws down
          along its own forearm, off frame by HIT + 12 (nothing of it is left on the hand-off frame) */}
      <AbsoluteFill style={{transform: `translate(${0.41 * armOut}px, ${0.91 * armOut}px)`}}>
        {/* scale 1.8: the pad (152 × 1.8 ≈ 274 px) is about as wide as the CLAIM FAILS impression it prints (≈ 350 px
            at this zoom), the same pad-to-print ratio as S1's WRONG stamps */}
        <StampArm
          g={g}
          scale={1.8}
          hover={125}
          sleeve={C.teal}
          arcHeight={40}
          enter={ARM_IN}
          exit={END + 40}
          targets={[{at: ARM_IN + 14, x: stampPt.x, y: stampPt.y + 0.45 * 37 * stampPt.scale}]} // the pad covers the print on contact; the lift reveals it
          hits={[HIT]}
          shapes={[{lift: 6, down: 3, hold: 3, up: 5, wind: 0.9}]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const LiftedSlip: React.FC<{g: number}> = ({g}) => {
  const s = slipPose(LIFT);
  const cam0 = camAt(LIFT);
  const c = worldToScreen(cam0, s.x, s.top + SLIP_H / 2, 1);
  const u = tw(g, LIFT, LIFT_DUR, E.inOut);
  const stamps = [{...H910.stamp}];
  // the last frame is H910 exactly (assigned, not interpolated), so S10's first frame matches it bit for bit
  if (u >= 1) return <SlipOnScreen i={0} cx={H910.cx} cy={H910.cy} scale={H910.scale} rot={H910.rot} stamps={stamps} />;
  const lift = Math.sin(u * Math.PI);
  return (
    <SlipOnScreen
      i={0}
      cx={lerp(c.x, H910.cx, u)}
      cy={lerp(c.y, H910.cy, u) - 30 * lift}
      scale={lerp(c.scale, H910.scale, u) * (1 + 0.06 * lift)}
      rot={lerp(s.rot, H910.rot, u)}
      lift={lift}
      stamps={stamps}
    />
  );
};
