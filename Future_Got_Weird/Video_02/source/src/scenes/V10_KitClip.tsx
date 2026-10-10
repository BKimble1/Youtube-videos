import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, tw} from '../lib/motion';
import {RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, hiddenByBox, occluderBox, partitionTopH, projectWith, rigAt, viewAt} from '../lib/room';
import {assertPath, type P2} from '../lib/optics';
import {CAST} from '../components/cast';
import {ROOM_COLORS, RoomSet, WALL_T, type RoomItem} from '../components/v02/RoomSet';
import {Character2, IDLE2, mixPose2, planTrip, tripContacts, tripDistance, tripDuration, tripPose, type Pose2} from '../components/v02/Cast2';
import {SensorTop, facingOf} from '../components/v02/HandheldSensor';
import {AUTHORS_BOX, AuthorsSensor} from '../components/v02/S7_Props';
import {RealTrackBoard, REPLAY, SOURCE_R8, TRACK_COLUMN, TRACK_FRAMES, replayEndFrame, replayIndex, trackGeom} from '../components/v2k/RealTrackBoard';
import {EVIDENCE, EvidenceCard} from '../components/v2k/EvidenceCard';
import {QuestionTitle} from '../components/v2k/QuestionTitle';
import {Chip, Label, Overlay} from '../components/v2k/Labels';
import track from '../data/evidence/tracking_topdown.json';
import {PersonFilmFrames, ProvenanceColumn, PulseRun, Ring, Sparkle, StampOn, TargetTop, V10_COLUMN, filmStripHeight, normalOf, planToPx, planViewOf, shiftLeg, type Leg, type PlanMap} from '../components/v2s/V10_Parts';
import {V11_CORNER_WIDE} from '../components/v2s/V11_Match';

/**
 * V10 · The kit clip and its conditions (n24–n28). v2/SHOTPLAN_V2.md V10.
 *
 *  V10.1 n24   HARD CUT in from V9 (its "keeps up" panel, laid out on TRACK_GEOM: the style visibly changes to the real
 *              board): the opening's real board, full frame (kit RealTrackBoard, column 0, no push), with its 64 px
 *              "Real data" headline, "sped up" tag and the V1 source line from the first frame. The stored estimate
 *              replays from data index 6, every 2nd data frame, one plotted position per video frame, no interpolation,
 *              starting on the cut (the V1.3 mapping). Review r1 (V2-R1-04): after the match has read (8 frames), the
 *              whole board steps back (scale 0.86 about its bottom centre, so nothing enters the caption band) and the
 *              question title "What can it do? Where does it fail?" (64) sits on the paper field top left, outside the
 *              card, for the spoken question only; headline, tag and source keep their full sizes, their anchors follow
 *              the card. On "Take" the board returns to full size together with the column.
 *  V10.2 n25   continuous: on "Take" the provenance column comes in (the plot shrinks left). Review r1 (V2-R1-09): the
 *              column is drawn here (V10_Parts ProvenanceColumn), one item at a time on its cue, items at 48 px: the
 *              counter "frame N of 475" (40 px mono) on "clip" (frame numbers only; it counts with the running replay),
 *              "ST sensor kit · held still / not the phone-grade device" on "off-the-shelf kit" ("16 zones" stays in the
 *              description), "under US$100 / (authors' figure)" on "hundred dollars", "setup: flat wall + / empty-room
 *              scan first" on "held still", then the chip "our check: their code + their data → matched their saved
 *              results · a software check, not a new experiment" (40 px, full column width) on "while", alone for its
 *              last ~2 s before the cut. Review r1 (V2-R1-10): the replay no longer stops at frame 475 and sits frozen
 *              under "held still while a person walked": after a short hold on 475 it restarts from index 6 on "dollars"
 *              (same mapping, no interpolation; the counter restarts honestly at "frame 7 of 475") and is still running
 *              at the cut.
 *  V10.3 n26   HARD CUT (to our picture: plan style, chip "illustration"): a plan close-up of our room's hidden side, not
 *              the room camera. A generic target (a bullseye post, never the guesser) stands at H. On "Many" a pulse
 *              runs sensor → W3 → target: the plain target sprays it every which way and only a thin, pale echo comes
 *              back. On "reflective" a safety-vest style strip wraps the side of the target that faces the wall spot and
 *              the incoming light. A second pulse: the returning pulse leaves the strip fat and bright on "sends", and
 *              "reflective material: far more light back" (48) comes in on "far". Straight segments, nothing crosses the
 *              partition (assertPath at load).
 *  V10.4 n27   HARD CUT back to the kit board (column, items, counter and chip as left); the clip replays from its first
 *              plotted frame on the cut (same mapping), so "the walker" is moving and the counter counts; on "don't" a
 *              stamp lands beside the track, "clothing: not recorded" (40).
 *  V10.5 n28   HARD CUT to a framed card in evidence style that is plainly a drawing ("our drawing", 30): our room set
 *              seen from the raised view with a neutral grey "their sensor" on a pole (no kit, no tripod, no checker)
 *              and the generic cast "person" in everyday clothes walking behind the partition (to half behind its near
 *              end, back out, and behind it again, where the shot ends); a film strip drops in on "tracking" and ticks. Under the drawing, in spoken order:
 *              "a separate test, not our kit clip · different device · data not released" (34) on "separate", then
 *              "Reported by the authors · ordinary clothes · 30 frames/s capture" (40) on "ordinary".
 *              OUT (match cut to V11.1): the partition's near-end vertical edge stands where the warehouse's blind
 *              corner stands in V11.1's first frame (V11_Match.V11_CORNER_WIDE): same x, same floor y, and its top on
 *              the rack's top (asserted at load, ±3 px).
 */

/* ================================================================== cues (narration words) */

const SC = scene('V10');
const K = {
  start: SC.from,
  end: SC.to,
  // n24
  n24: seg('n24').from,
  n24End: segEnd('n24'),
  // n25
  take: at('n25', 'take'),
  clip: at('n25', 'clip'),
  shelf: at('n25', 'off-the-shelf'),
  under: at('n25', 'under'),
  hundred: at('n25', 'hundred'),
  dollars: at('n25', 'dollars'),
  held: at('n25', 'held'),
  while25: at('n25', 'while'),
  person25: at('n25', 'person'),
  n25End: segEnd('n25'),
  // n26
  n26: seg('n26').from,
  many: at('n26', 'many'),
  help: at('n26', 'help'),
  vest: at('n26', 'safety-vest'),
  reflective: at('n26', 'reflective'),
  target: at('n26', 'target'),
  sends: at('n26', 'sends'),
  far: at('n26', 'far'),
  n26End: segEnd('n26'),
  // n27
  n27: seg('n27').from,
  our27: at('n27', 'our'),
  dont: at('n27', "don't"),
  n27End: segEnd('n27'),
  // n28
  n28: seg('n28').from,
  but: at('n28', 'but'),
  separate: at('n28', 'separate'),
  report: at('n28', 'report'),
  tracking: at('n28', 'tracking'),
  ordinary: at('n28', 'ordinary'),
  capturing: at('n28', 'capturing'),
  n28End: segEnd('n28'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== shots */

const CUT_PLAN = K.n26; // V10.2 → V10.3
const CUT_BOARD2 = Math.min(K.n27, K.our27) - 2; // V10.3 → V10.4
const CUT_CARD = K.n28 - 1; // V10.4 → V10.5

/* ================================================================== V10.1 / V10.2: the kit board */

const BOARD0 = K.start; // the replay starts on the cut
// V2-R1-04: the board steps back so the question title sits outside the card (the match holds for 8 frames first)
const RECEDE0 = Math.max(K.start + 8, K.n24 - 6);
const RECEDE_DUR = 14;
const RECEDE_S = 0.86; // card top 944 − 914·0.86 = 158 (its tape ≈ 141): clear of the title's ink (baseline 118)
const PIVOT = {x: 960, y: EVIDENCE.card.y1}; // bottom centre: the card's bottom edge and source line stay out of the caption band
const TITLE_FROM = RECEDE0 + RECEDE_DUR - 4; // the title fades in as the card clears the top-left corner
const TITLE_TO = K.n24End + 6; // the last word's aligned end overruns the segment; the segment end is the spoken end
const COL0 = K.take;
const COL_DUR = 20;
/** Board scale: 1 on the cut, steps back for the question, returns with the column on "Take" (same 20 frames and easing). */
const boardScale = (g: number) =>
  g < COL0 ? lerp(1, RECEDE_S, E.inOut(tw(g, RECEDE0, RECEDE_DUR, E.linear))) : lerp(RECEDE_S, 1, E.inOut(tw(g, COL0, COL_DUR, E.linear)));
// Director r1: the counter comes in first, on "clip" ("Take our opening clip"), while the replay is still running, so it
// visibly counts frames (frame numbers, never seconds). It keeps its slot under the three items, which then fill in
// above it one at a time. Review r1 (V2-R1-09): each item on its own cue words, the chip alone for its last ~2 s.
const COUNTER = Math.max(COL0 + COL_DUR, K.clip);
const ITEM1 = Math.max(COUNTER + 24, K.shelf); // "off-the-shelf kit"
const ITEM2 = Math.max(ITEM1 + 45, K.hundred); // "hundred dollars"
const ITEM3 = Math.max(ITEM2 + 30, K.held); // "held still"
const CHIP = Math.max(ITEM3 + 15, K.while25); // "while a person walked behind a partition."
const ITEMS = [
  {lines: ['ST sensor kit · held still', 'not the phone-grade device'], at: ITEM1},
  {lines: ['under US$100', "(authors' figure)"], at: ITEM2},
  {lines: ['setup: flat wall +', 'empty-room scan first'], at: ITEM3},
];
const CHIP_TEXT = 'our check: their code + their data → matched their saved results · a software check, not a new experiment';
const BOARD_END = replayEndFrame(BOARD0);
// V2-R1-10: a short hold on the last plotted frame (475 of 475), then the replay restarts from index 6 on "dollars"
const REPLAY2 = Math.max(BOARD_END + 12, K.dollars + 6);
const boardIdx = (g: number) => (g < REPLAY2 ? replayIndex(g, BOARD0) : replayIndex(g, REPLAY2));
{
  const bad: string[] = [];
  if (RECEDE0 + RECEDE_DUR > TITLE_FROM + 4) bad.push('the title comes in before the board has stepped back');
  if (TITLE_FROM > K.n24 + 14) bad.push(`the question title (from ${TITLE_FROM}) trails the spoken question (${K.n24})`);
  if (TITLE_TO > COL0) bad.push(`the question title (to ${TITLE_TO}) is still up when the column comes in (${COL0})`);
  if (EVIDENCE.card.y1 - (EVIDENCE.card.y1 - EVIDENCE.card.y0) * RECEDE_S - 20 * RECEDE_S < 136) bad.push('the stepped-back card (with its tape) reaches the question title');
  if (CUT_PLAN - CHIP < 60) bad.push(`the chip (${CHIP}) has under 2 s alone before the cut to the plan (${CUT_PLAN})`);
  if (ITEM2 < ITEM1 + 30 || ITEM3 < ITEM2 + 30 || CHIP < ITEM3 + 15) bad.push('column items crowd each other');
  if (COUNTER < COL0 + COL_DUR) bad.push('the counter before the column has opened');
  if (replayIndex(COUNTER, K.start) >= REPLAY.end) bad.push('the counter arrives after the replay has ended (it would never count)');
  if (REPLAY2 - BOARD_END > 30) bad.push(`the dot holds on frame 475 for ${REPLAY2 - BOARD_END} frames before the restart`);
  if (replayEndFrame(REPLAY2) < CUT_PLAN) bad.push('the restarted replay ends (and freezes) before the cut to the plan');
  if (bad.length) throw new Error(`V10 board: ${bad.join('; ')}`);
}

/* ================================================================== V10.4: the stamp beside the track */

/** The replayed track's box at column 1 (screen px), from the stored estimate (indices 6..474, step 2). */
const TRACK_BOX_COL = (() => {
  const G = trackGeom(1);
  const xs: number[] = [];
  const ys: number[] = [];
  const st = (track as unknown as {stored_xz: [number, number][]}).stored_xz;
  for (let i = REPLAY.start; i <= REPLAY.end; i += REPLAY.step) {
    const p = G.P(st[i]);
    xs.push(p.x);
    ys.push(p.y);
  }
  return {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), wallY: G.wallY, panelX1: G.panel.x1};
})();
const STAMP_HIT = K.dont;
const STAMP_T0 = STAMP_HIT - 4; // StampOn: contact at 40 % of a 10-frame slam
const STAMP_AT = {x: Math.min((TRACK_BOX_COL.x0 + TRACK_BOX_COL.x1) / 2, TRACK_BOX_COL.panelX1 - 290), y: (TRACK_BOX_COL.wallY + 22 + TRACK_BOX_COL.y0) / 2};
{
  if (STAMP_AT.y + 44 > TRACK_BOX_COL.y0 - 10) throw new Error('V10.4: the stamp would sit on the track');
  if (STAMP_HIT < CUT_BOARD2 + 18) throw new Error('V10.4: the stamp lands on the cut');
}

/* ================================================================== V10.3: the plan close-up */

/** Plan map: 640 px per metre; the sensor S at (300, 746), the wall line z = 0 at y 170. */
const PM: PlanMap = {k: 640, pivot: {x: PTS.S.x, z: PTS.S.z}, anchor: {x: 300, y: 170 + 640 * PTS.S.z}};
const toPx = planToPx(PM);
const S2: P2 = {x: PTS.S.x, z: PTS.S.z};
const W3: P2 = {x: PTS.W.W3.x, z: 0};
const H2: P2 = {x: LAYOUT.hidden.x, z: LAYOUT.hidden.z};
assertPath([S2, W3, H2, W3, S2], LAYOUT); // straight segments, around the partition's far end
const S_PX = toPx(S2);
const WALL_LINE_Y = toPx({x: 0, z: 0}).y;
const WALL_TOP_Y = toPx({x: 0, z: -WALL_T}).y;
const W_PX = toPx(W3);
const H_PX = toPx(H2);
const TGT_R = 0.17 * PM.k; // the target's radius (px)
const FACE = Math.atan2(W_PX.y - H_PX.y, W_PX.x - H_PX.x); // toward the wall spot (where the light comes from)
const tAt = (rr: number) => ({x: H_PX.x + Math.cos(FACE) * rr, y: H_PX.y + Math.sin(FACE) * rr});
const T_PLAIN = tAt(TGT_R + 3);
const T_STRIP = tAt(TGT_R + 25);

const n1 = normalOf(S_PX, W_PX);
const n2 = normalOf(W_PX, T_STRIP);
const OUT_W = [8, 6.5];
const OUT_COL = [C.saffronDeep, C.saffronDeep];
const outLegs = (T: {x: number; y: number}): Leg[] => [
  {a: S_PX, b: W_PX, width: OUT_W[0], color: OUT_COL[0]},
  {a: W_PX, b: T, width: OUT_W[1], color: OUT_COL[1]},
];
/** Return legs run in their own lane, beside the outgoing ones (offset by both half-widths and a gap). */
const backLegs = (T: {x: number; y: number}, w: [number, number], color: string, dash?: string): Leg[] => {
  const o2 = OUT_W[1] / 2 + w[0] / 2 + 5;
  const o1 = OUT_W[0] / 2 + w[1] / 2 + 5;
  const l2 = shiftLeg(T, W_PX, n2, o2);
  const l1 = shiftLeg(W_PX, S_PX, n1, o1);
  return [
    {a: l2.a, b: l2.b, width: w[0], color, dash},
    {a: l1.a, b: l1.b, width: w[1], color, dash},
  ];
};
const legLen = (legs: Leg[]) => legs.reduce((s, l) => s + Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y), 0);
const OUT_FR = 34; // frames for the outgoing trip (sensor → wall spot → target)
const BACK_FR = 34;
// pulse A: the plain target (hits on "help")
const PA0 = K.many + 1;
const PA_HIT = PA0 + OUT_FR;
const PA_HOME = PA_HIT + BACK_FR;
// the strip wraps the target on "reflective"
const STRIP0 = K.reflective;
const STRIP_DUR = 10;
// pulse B: the strip (the fat return leaves the strip on "sends")
const PB_HIT = Math.max(K.sends, STRIP0 + STRIP_DUR + OUT_FR + 6);
const PB0 = PB_HIT - OUT_FR;
const PB_HOME = PB_HIT + BACK_FR;
const LABEL_FAR = Math.max(K.far, PB_HIT + 6);
const BACK_A = backLegs(T_PLAIN, [4, 3.5], C.saffronDeep);
const BACK_B = backLegs(T_STRIP, [22, 16], C.saffron);
const W_OUT_FRAC = Math.hypot(W_PX.x - S_PX.x, W_PX.y - S_PX.y) / legLen(outLegs(T_PLAIN));
{
  const bad: string[] = [];
  if (PA_HOME > STRIP0) bad.push(`the first echo is still out (${PA_HOME}) when the strip goes on (${STRIP0})`);
  if (PB0 < STRIP0 + STRIP_DUR) bad.push('the second pulse leaves before the strip is on');
  if (LABEL_FAR + 30 > CUT_BOARD2) bad.push('the label has under 1 s before the cut');
  if (PA0 < CUT_PLAN) bad.push('pulse A before the cut');
  if (bad.length) throw new Error(`V10.3: ${bad.join('; ')}`);
}
/** The main label (48): top right, its leader to the strip's upper end (clear of every light leg). */
const REFLECT_LABEL = {x: 1790, y: 330};
const STRIP_END = {x: H_PX.x + Math.cos(FACE + 0.8) * (TGT_R + 26), y: H_PX.y + Math.sin(FACE + 0.8) * (TGT_R + 26)};

/* ================================================================== V10.5: the card (our drawing of the authors' separate test) */

const TILT = RAISED_TILT;
const VS = viewAt(TILT);
const OCC = LAYOUT.occluder;
/** The drawing's window inside the evidence card (screen px). */
const AWIN = {x: 120, y: 46, w: 1680, h: 754};
/** The partition's near-end vertical edge (the camera-side end, the edge the walker passes behind). */
const EDGE = {x: OCC.x + OCC.thickness / 2, z: OCC.z1};
const EDGE_TOP_H = partitionTopH(OCC.z1);
const EDGE_FLOOR_W = projectWith(VS, {x: EDGE.x, z: EDGE.z, h: 0});
const EDGE_TOP_W = projectWith(VS, {x: EDGE.x, z: EDGE.z, h: EDGE_TOP_H});
/** Zoom: the partition's near end (floor to its top) is as tall as the rack's corner edge in V11.1. */
const CZ = (V11_CORNER_WIDE.yFloor - V11_CORNER_WIDE.yTop) / (EDGE_FLOOR_W.y - EDGE_TOP_W.y);
const CAM_CARD: Cam = {
  cx: EDGE_FLOOR_W.x - (V11_CORNER_WIDE.x - 960) / CZ,
  cy: EDGE_FLOOR_W.y - (V11_CORNER_WIDE.yFloor - 540) / CZ,
  zoom: CZ,
};
const scr = (p: {x: number; y: number}) => worldToScreen(CAM_CARD, p.x, p.y);
/** The walker's depth (plan z) and marks (plan x): on the hidden side, out of the sensor's straight view. */
const PZ = 1.1;
const PX0 = 2.95;
const PX1 = 2.28; // half behind the partition's near end (from this camera)
const PX2 = 2.95;
const PX3 = 2.3;
const RIG = rigAt(PX0, PZ, TILT);
const RIG_S = RIG.scale;
/** The walk: right → half behind the near end (a beat) → back out → behind it again, filling the shot. */
type WalkLeg = {x0: number; x1: number; plan: ReturnType<typeof planTrip>; start: number; end: number};
const MARKS = [PX0, PX1, PX2, PX3];
const PAUSES = [24, 16]; // frames at PX1 and PX2
const WALK0 = CUT_CARD + 8;
const WALK_PLANS = MARKS.slice(1).map((x, i) => planTrip(Math.abs(x - MARKS[i]) * VS.ppm, RIG_S, 'walk'));
const FPS_WALK = clamp(Math.floor((K.end - 14 - WALK0 - PAUSES[0] - PAUSES[1]) / WALK_PLANS.reduce((s, p) => s + p.steps, 0)), 10, 17);
const WALK_LEGS: WalkLeg[] = (() => {
  const out: WalkLeg[] = [];
  let t = WALK0;
  WALK_PLANS.forEach((plan, i) => {
    const d = tripDuration(plan, FPS_WALK);
    out.push({x0: MARKS[i], x1: MARKS[i + 1], plan, start: t, end: t + d});
    t += d + (PAUSES[i] ?? 0);
  });
  return out;
})();
const WALK_END = WALK_LEGS[WALK_LEGS.length - 1].end;
/** The neutral device stands where our sensor stands, its box on the light plane. */
const LIGHT_H = LAYOUT.sensor.h;
const DEV_BOX = projectWith(VS, {x: PTS.S.x, z: PTS.S.z, h: LIGHT_H});
const DEV_FLOOR = projectWith(VS, {x: PTS.S.x, z: PTS.S.z, h: 0});
const THEIR_TAG_IN = CUT_CARD + 6;
/** Film strip: drops in on "tracking", ticks every TICK frames. Top right of the window, over the bare wall, under the
 *  "our drawing" chip and right of the walker (asserted below). */
const FILM_CELL = 120;
const FILM_H = filmStripHeight(FILM_CELL);
const FILM_W = 2 * (FILM_CELL + 14) + 56;
const FILM_X = AWIN.x + AWIN.w - 26 - FILM_W;
const FILM_Y = AWIN.y + 84;
const STRIP_DROP = Math.max(K.tracking, CUT_CARD + 20); // the frames start ticking as the authors' tracking is named
const TICK0 = STRIP_DROP + 12;
const TICK = 4;
const FILM_START = 5;
const LINE1 = {text: 'Reported by the authors · ordinary clothes · 30 frames/s capture', size: 40, y: 854, at: K.ordinary};
const LINE2 = {text: 'a separate test, not our kit clip · different device · data not released', size: 34, y: 906, at: K.separate};
{
  const bad: string[] = [];
  // the match: the near-end edge on the corner's x and floor y, its top on the rack's top
  const f = scr(EDGE_FLOOR_W);
  const t = scr(EDGE_TOP_W);
  if (Math.abs(f.x - V11_CORNER_WIDE.x) > 3 || Math.abs(f.y - V11_CORNER_WIDE.yFloor) > 3 || Math.abs(t.y - V11_CORNER_WIDE.yTop) > 3) bad.push(`match off: edge (${f.x.toFixed(1)}, ${t.y.toFixed(1)}..${f.y.toFixed(1)}) vs corner (${V11_CORNER_WIDE.x.toFixed(1)}, ${V11_CORNER_WIDE.yTop.toFixed(1)}..${V11_CORNER_WIDE.yFloor.toFixed(1)})`);
  // the walker: head to feet inside the window at every mark; hidden from the sensor's straight line by the partition
  for (const x of MARKS) {
    const r = rigAt(x, PZ, TILT);
    const top = scr({x: r.x, y: r.y - 440 * r.scale});
    const feet = scr({x: r.x, y: r.y});
    if (top.y < AWIN.y + 12 || feet.y > AWIN.y + AWIN.h - 12) bad.push(`the walker is cut by the window at x ${x}`);
    const u = (OCC.x - PTS.S.x) / (x - PTS.S.x);
    const zc = PTS.S.z + (PZ - PTS.S.z) * u;
    if (!(zc > OCC.z0 && zc < OCC.z1)) bad.push(`the walker at x ${x} is in the sensor's straight view`);
  }
  // at PX1 the partition's near end covers the walker's camera-side half (from the drawing's camera)
  if (!hiddenByBox({x: PX1 - 0.1, z: PZ, h: 1.0}, occluderBox(), TILT) || hiddenByBox({x: PX1 + 0.12, z: PZ, h: 1.0}, occluderBox(), TILT)) bad.push('the walker is not half behind the near end at PX1');
  // the film strip: right of the walker at his rightmost mark, above the wall's skirting
  {
    const r = rigAt(PX0, PZ, TILT);
    const right = scr({x: r.x + 0.42 * VS.ppm * 0.6, y: r.y});
    if (right.x + 16 > FILM_X) bad.push(`the film strip covers the walker (his right side ${right.x.toFixed(0)}, strip ${FILM_X})`);
  }
  if (WALK_END > K.end - 6) bad.push('the walk does not finish before the cut');
  if (LINE2.y + 10 > 944 || LINE1.y - 40 < AWIN.y + AWIN.h + 6) bad.push('the claim lines do not fit under the drawing');
  if (bad.length) throw new Error(`V10.5 card: ${bad.join('; ')}`);
}

/* ================================================================== the scene */

export const V10KitClip: React.FC = () => {
  const g = useG();
  if (g < CUT_PLAN) return <KitBoard g={g} />;
  if (g < CUT_BOARD2) return <ReflectPlan g={g} />;
  if (g < CUT_CARD) return <KitBoard g={g} />;
  return <AuthorsCard g={g} />;
};

/* ---------------------------------------------------------------- V10.1 / V10.2 / V10.4 */

const KitBoard: React.FC<{g: number}> = ({g}) => {
  // V10.4 (director r1): back on the board for "Our clip's files … the walker", the clip replays from its first plotted
  // frame on the cut (the same V1.3 mapping, started on this cut), so the walker the line names is moving while the
  // stamp lands, and the counter counts again; no dead hold before and after the stamp.
  const v4 = g >= CUT_BOARD2;
  const idx = v4 ? replayIndex(g, CUT_BOARD2) : boardIdx(g);
  const stampT = v4 ? tw(g, STAMP_T0, 10, E.linear) : 0;
  const colT = tw(g, COL0, COL_DUR, E.linear);
  const s = v4 ? 1 : boardScale(g);
  // while the board is stepped back, its headline, tag and source line are drawn here at their full sizes, on anchors
  // that follow the card (the kit's own slots are used whenever the board is at full size)
  const own = s < 0.9999;
  const T = (p: {x: number; y: number}) => ({x: PIVOT.x + (p.x - PIVOT.x) * s, y: PIVOT.y + (p.y - PIVOT.y) * s});
  const H = T({x: EVIDENCE.headline.x, y: EVIDENCE.headline.baseline});
  const Sx = T({x: EVIDENCE.source.x, y: EVIDENCE.source.baseline});
  const Tg = T({x: EVIDENCE.tag.x, y: EVIDENCE.tag.y});
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: own ? `scale(${f2(s * 10000) / 10000})` : undefined, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`}}>
        <RealTrackBoard
          idx={idx}
          background={false}
          sensorLabel={0}
          blockedLabel={0}
          dotLabel={0}
          headline={own ? 0 : 1}
          spedUp={own ? 0 : 1}
          source={own ? 0 : 1}
          column={colT}
          columnItems={[]}
          counter={0}
        />
      </div>
      {own && (
        <>
          <Overlay>
            <text x={f2(H.x)} y={f2(H.y)} fontFamily={F.display} fontWeight={600} fontSize={EVIDENCE.headline.size} fill={C.ink}>
              Real data
            </text>
            <text x={f2(Sx.x)} y={f2(Sx.y)} fontFamily={F.body} fontWeight={800} fontSize={EVIDENCE.source.size} fill={C.inkSoft}>
              {SOURCE_R8}
            </text>
          </Overlay>
          <Chip x={Tg.x} y={Tg.y} anchor="end" valign="middle" size={EVIDENCE.tag.size}>
            sped up
          </Chip>
        </>
      )}
      <ProvenanceColumn
        gate={clamp01((colT - 0.5) * 2)}
        items={ITEMS.map((it) => ({lines: it.lines, t: tw(g, it.at, 8, E.linear)}))}
        counter={{text: `frame ${Math.max(0, idx) + 1} of ${TRACK_FRAMES}`, t: tw(g, COUNTER, 8, E.linear)}}
        chip={{text: CHIP_TEXT, t: tw(g, CHIP, 8, E.linear)}}
      />
      <QuestionTitle text="What can it do? Where does it fail?" from={TITLE_FROM} to={TITLE_TO} frame={g} />
      {stampT > 0 && <StampOn x={STAMP_AT.x} y={STAMP_AT.y} text="clothing: not recorded" t={stampT} size={40} />}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- V10.3 */

/** Diffuse spray from the plain target: short rays over the wall-facing half, drawn on, then released. */
const Spray: React.FC<{p: {x: number; y: number}; t: number; release: number}> = ({p, t, release}) => {
  if (t <= 0 || release >= 1) return null;
  const n = 9;
  return (
    <g opacity={1 - E.in(clamp01(release))}>
      {Array.from({length: n}, (_, i) => {
        const a = FACE + ((i / (n - 1)) * 2 - 1) * 1.45;
        const L = 70 + 34 * Math.cos(((i / (n - 1)) * 2 - 1) * 1.45) + ((i * 37) % 11);
        const k = E.out(clamp01(t * 1.15 - (i % 3) * 0.05));
        const u0 = 0.75 * E.inOut(clamp01(release)) * k;
        const a0 = {x: p.x + Math.cos(a) * (8 + L * u0), y: p.y + Math.sin(a) * (8 + L * u0)};
        const a1 = {x: p.x + Math.cos(a) * (8 + L * k), y: p.y + Math.sin(a) * (8 + L * k)};
        return (
          <g key={i}>
            <path d={`M ${a0.x} ${a0.y} L ${a1.x} ${a1.y}`} stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
            <circle cx={a1.x} cy={a1.y} r={5} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
};

/** The wall spot: a diamond on the wall line, lit while a pulse is there. */
const WallSpot: React.FC<{p: {x: number; y: number}; lit: number}> = ({p, lit}) => {
  const s = 17 * (1 + 0.15 * lit);
  return (
    <g>
      {lit > 0.01 && <ellipse cx={p.x} cy={p.y + 8} rx={70 * lit} ry={40 * lit} fill={C.saffronLight} opacity={0.85 * lit} />}
      <path d={`M ${p.x} ${p.y - s} L ${p.x + s} ${p.y} L ${p.x} ${p.y + s} L ${p.x - s} ${p.y} Z`} fill={lit > 0.5 ? C.saffron : C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

const ReflectPlan: React.FC<{g: number}> = ({g}) => {
  const outA = clamp01((g - PA0) / OUT_FR);
  const backA = clamp01((g - PA_HIT) / BACK_FR);
  const outB = clamp01((g - PB0) / OUT_FR);
  const backB = clamp01((g - PB_HIT) / BACK_FR);
  // A's outgoing trail gives way to B's (same lane); A's thin echo stays faint for the comparison until B's covers it
  const aOutOp = 1 - tw(g, PB0 - 10, 10, E.linear);
  const aBackOp = g < PA_HOME ? 1 : lerp(1, 0.7, tw(g, PA_HOME, 14, E.linear));
  const wallLit = Math.max(
    pulseWin(g, PA0 + OUT_FR * W_OUT_FRAC, 16),
    pulseWin(g, PA_HIT + BACK_FR * (1 - W_OUT_FRAC), 16) * 0.5,
    pulseWin(g, PB0 + OUT_FR * W_OUT_FRAC, 16),
    pulseWin(g, PB_HIT + BACK_FR * (1 - W_OUT_FRAC), 18),
  );
  const strip = tw(g, STRIP0, STRIP_DUR, E.out);
  const glint = Math.max(pulseWin(g, STRIP0 + STRIP_DUR - 2, 14), pulseWin(g, PB_HIT, 16) * 1.15);
  const firing = Math.max(pulseWin(g, PA0, 8), pulseWin(g, PB0, 8));
  const facing = facingOf(W_PX.x - S_PX.x, W_PX.y - S_PX.y);
  const labelT = tw(g, LABEL_FAR, 7, E.linear);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <RoomSet tilt={1} view={planViewOf(PM)} plant={false} door={false} extendRight={2} extendLeft={2} />
      <Overlay>
        <rect x={0} y={0} width={1920} height={f2(WALL_TOP_Y - 2)} fill={C.paper} />
        <rect x={-10} y={f2(WALL_TOP_Y)} width={1940} height={f2(WALL_LINE_Y - WALL_TOP_Y)} fill={ROOM_COLORS.relayWall} stroke={C.ink} strokeWidth={4} />
        <WallSpot p={W_PX} lit={wallLit} />
        {/* pulse A: out to the plain target, a spray, a thin pale echo */}
        <PulseRun legs={outLegs(T_PLAIN)} u={outA} dot={{r: [15, 13], fill: C.saffron}} opacity={aOutOp} />
        <Spray p={T_PLAIN} t={tw(g, PA_HIT, 10, E.linear)} release={tw(g, PA_HIT + 14, 14, E.linear)} />
        <PulseRun legs={BACK_A} u={backA} dot={{r: [8, 7], fill: C.saffronLight}} opacity={aBackOp} />
        {/* pulse B: out to the strip, a fat bright echo straight back */}
        <PulseRun legs={outLegs(T_STRIP)} u={outB} dot={{r: [15, 13], fill: C.saffron}} />
        <PulseRun legs={BACK_B} u={backB} dot={{r: [26, 21], fill: C.saffron}} />
        <TargetTop x={H_PX.x} y={H_PX.y} r={TGT_R} faceAngle={FACE} strip={strip} stripGlint={glint} rim={pulseWin(g, PA_HIT, 14) * 0.8} />
        <Ring p={T_PLAIN} t={clamp01((g - PA_HIT) / 14)} color={C.saffronDeep} r1={50} />
        <Ring p={T_STRIP} t={clamp01((g - PB_HIT) / 16)} color={C.saffronDeep} r1={80} w={9} />
        <SensorTop asGroup x={S_PX.x} y={S_PX.y} size={0.2 * PM.k} facing={facing} firing={firing} />
        {labelT > 0 && (
          <Label asGroup x={REFLECT_LABEL.x} y={REFLECT_LABEL.y} size={48} anchor="end" opacity={labelT} leader={{x: STRIP_END.x, y: STRIP_END.y, gap: 14}}>
            reflective material: far more light back
          </Label>
        )}
      </Overlay>
      {/* review r1 (V2-R1-14): 40 px; under the wall band, top left (the paper strip above the wall is only 70 px tall) */}
      <Chip x={120} y={f2(WALL_LINE_Y + 22)} size={40}>
        illustration
      </Chip>
    </AbsoluteFill>
  );
};

const pulseWin = (g: number, t0: number, len: number) => (g < t0 || g > t0 + len ? 0 : Math.sin(((g - t0) / len) * Math.PI));

/* ---------------------------------------------------------------- V10.5 */

const filmPosAt = (g: number) => {
  const ticks = g < TICK0 ? 0 : Math.floor((g - TICK0) / TICK) + 1;
  const frac = g < TICK0 ? 1 : E.inOut(clamp01(((g - TICK0) % TICK) / 3));
  return FILM_START + Math.max(0, ticks - 1) + (ticks > 0 ? frac : 0);
};

/** The walker at frame g: plan x and pose (walk left to half behind the near end, a look round, walk back). */
const walkerAt = (g: number): {x: number; pose: Pose2} => {
  const face = {mouth: 'smile' as const, lid: 0.1};
  const looking = (dir: number) => ({...IDLE2, ...face, lookX: 0.5 * dir, lookY: 0.05});
  for (let i = 0; i < WALK_LEGS.length; i++) {
    const L = WALK_LEGS[i];
    const dir = L.x1 < L.x0 ? -1 : 1;
    if (g < L.start) {
      // standing at the leg's start (before the first leg, or in a pause): the head turns to the next direction
      const prev = i > 0 ? (WALK_LEGS[i - 1].x1 < WALK_LEGS[i - 1].x0 ? -1 : 1) : dir;
      const turn = tw(g, L.start - 12, 10, E.inOut);
      return {x: L.x0, pose: mixPose2(looking(prev), looking(dir), turn)};
    }
    if (g < L.end) {
      const d = tripDistance(g, L.start, L.plan, FPS_WALK);
      return {x: L.x0 + (dir * d) / VS.ppm, pose: tripPose(d, L.plan, {dir: dir as 1 | -1, base: looking(dir)})};
    }
  }
  const last = WALK_LEGS[WALK_LEGS.length - 1];
  return {x: last.x1, pose: looking(last.x1 < last.x0 ? -1 : 1)};
};

const AuthorsCard: React.FC<{g: number}> = ({g}) => {
  const w = walkerAt(g);
  const r = rigAt(w.x, PZ, TILT);
  const items: RoomItem[] = [
    {
      key: 'device',
      x: PTS.S.x,
      z: PTS.S.z,
      w: 0.2,
      height: LIGHT_H + 0.1,
      node: (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <AuthorsSensor box={DEV_BOX} floor={DEV_FLOOR} ppm={VS.ppm} />
        </svg>
      ),
    },
    {
      key: 'person',
      x: w.x,
      z: PZ,
      w: 0.3,
      node: <Character2 look={CAST.person} pose={w.pose} frame={g} seed={31} x={r.x} y={r.y} scale={r.scale} life={0.4} eyeDarts={false} />,
    },
  ];
  const filmY = FILM_Y - 260 + 260 * E.out(tw(g, STRIP_DROP, 14, E.linear));
  const devTop = scr({x: DEV_BOX.x, y: DEV_BOX.y + AUTHORS_BOX.dy * VS.ppm - 0.02 * VS.ppm});
  const tag = {x: devTop.x - 150, y: devTop.y - 74};
  const tagT = tw(g, THEIR_TAG_IN, 8, E.linear);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <EvidenceCard headlineT={0}>
        <div style={{position: 'absolute', left: AWIN.x, top: AWIN.y, width: AWIN.w, height: AWIN.h, overflow: 'hidden', borderRadius: 10}}>
          <div style={{position: 'absolute', left: -AWIN.x, top: -AWIN.y, width: 1920, height: 1080}}>
            <Camera cam={CAM_CARD}>
              <Layer depth={1}>
                <RoomSet tilt={TILT} items={items} plant={false} door={false} extendRight={3} extendLeft={3} />
              </Layer>
            </Camera>
          </div>
          {/* the film strip: frames captured one after another */}
          {g >= STRIP_DROP && (
            <div style={{position: 'absolute', left: FILM_X - AWIN.x, top: filmY - AWIN.y, width: FILM_W, borderRadius: 6, boxShadow: `7px 8px 0 ${C.shadow}`}}>
              <PersonFilmFrames width={FILM_W} cell={FILM_CELL} pos={filmPosAt(g)} />
            </div>
          )}
        </div>
        <div style={{position: 'absolute', left: AWIN.x, top: AWIN.y, width: AWIN.w, height: AWIN.h, boxSizing: 'border-box', border: `3px solid ${C.ink}`, borderRadius: 10}} />
        {/* "their sensor": what the grey box is, and no more */}
        {tagT > 0 && (
          <>
            <Overlay>
              <line x1={tag.x + 60} y1={tag.y + 24} x2={devTop.x - 6} y2={devTop.y - 6} stroke={C.inkSoft} strokeWidth={3} strokeDasharray="3 8" strokeLinecap="round" opacity={tagT} />
            </Overlay>
            <Chip x={tag.x} y={tag.y} anchor="middle" valign="middle" size={32} opacity={tagT}>
              their sensor
            </Chip>
          </>
        )}
        <Chip x={AWIN.x + AWIN.w - 18} y={AWIN.y + 18} anchor="end" size={30}>
          our drawing
        </Chip>
        <Overlay>
          <Label asGroup x={960} y={LINE1.y} size={LINE1.size} anchor="middle" halo={false} opacity={tw(g, LINE1.at, 7, E.linear)}>
            {LINE1.text}
          </Label>
          <Label asGroup x={960} y={LINE2.y} size={LINE2.size} anchor="middle" halo={false} color={C.inkSoft} opacity={tw(g, LINE2.at, 7, E.linear)}>
            {LINE2.text}
          </Label>
        </Overlay>
      </EvidenceCard>
    </AbsoluteFill>
  );
};

/* ================================================================== sound cue sheet */

const walkSteps = WALK_LEGS.flatMap((L) => tripContacts(L.start, L.plan, FPS_WALK)).filter((f) => f < K.end);
const filmTicks = Array.from({length: Math.max(0, Math.floor((K.end - TICK0) / TICK))}, (_, i) => TICK0 + i * TICK).filter((_, i) => i % 3 === 0);

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', gain: -4, dur: (K.end - K.start) / 30, note: 'V10 boards, plan and card (very low)'},
  // V10.3 the plan close-up
  {f: PA0, kind: 'sensor_pulse', gain: -4, note: 'pulse A leaves'},
  {f: Math.round(PA0 + OUT_FR * W_OUT_FRAC), kind: 'bounce_tick', gain: -8, pitch: 2, note: 'wall spot'},
  {f: PA_HIT, kind: 'bounce_tick', gain: -6, pitch: -1, note: 'plain target: spray'},
  {f: PA_HOME, kind: 'echo_return', gain: -12, pitch: 3, note: 'thin echo home'},
  {f: STRIP0, kind: 'strip_rip', gain: -4, note: 'strip pressed onto the target (prop contact)'},
  {f: PB0, kind: 'sensor_pulse', gain: -4, pitch: 1, note: 'pulse B leaves'},
  {f: Math.round(PB0 + OUT_FR * W_OUT_FRAC), kind: 'bounce_tick', gain: -8, pitch: 3},
  {f: PB_HIT, kind: 'bounce_tick', gain: -2, pitch: 5, note: 'the strip: the fat return leaves it (pulse motif, brighter)'},
  {f: PB_HOME, kind: 'echo_return', gain: 1, note: 'fat echo home'},
  // V10.4 the stamp (the scene's one stamp thud)
  {f: STAMP_HIT, kind: 'stamp_heavy', gain: -2, note: 'clothing: not recorded'},
  // V10.5 the card (director r1: no paper slide for the strip's entrance, no sparkle glints; the frames are captures,
  // so the strip ticks with the shot plan's shutter)
  ...walkSteps.map((f, i): Sfx => ({f, kind: 'footstep_wood', gain: -10, pitch: i % 2, note: 'the person (drawing)'})),
  ...filmTicks.map((f, i): Sfx => ({f, kind: 'shutter_click', gain: -13, pitch: (i % 3) - 1, note: 'film strip: one capture'})),
];

/** Exported for the report: the replay mapping's end and restart, the V10.1 step-back, the column cues, the V10.5 card camera. */
export const V10_REPORT = {boardEnd: BOARD_END, camCard: CAM_CARD, replay2: REPLAY2, recede: {from: RECEDE0, dur: RECEDE_DUR, scale: RECEDE_S, title: [TITLE_FROM, TITLE_TO]}, cues: {counter: COUNTER, items: [ITEM1, ITEM2, ITEM3], chip: CHIP, cutPlan: CUT_PLAN}, column: V10_COLUMN, kitColumn: TRACK_COLUMN, fpsWalk: FPS_WALK, walk: WALK_LEGS.map((l) => ({x0: l.x0, x1: l.x1, steps: l.plan.steps, start: l.start, end: l.end}))};
