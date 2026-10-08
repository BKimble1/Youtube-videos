import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, camPath, drop, hop, impact, ring, tw} from '../lib/motion';
import {Camera, Layer, type Cam} from '../lib/camera';
import {PLINTH} from '../lib/shots';
import {Chip} from '../components/Text';
import {PlanBoard, ScrollRoll} from '../components/v02/S5_Board';
import {Ledge, MU, MuseumHall, Plinth, RopePost, RopeSign, RopeSpan, SensorStool, SideCard, ropePoint} from '../components/v02/S5_Museum';
import {E12, E18, E21, Exhibit2012, Exhibit2018, Exhibit2021, RASTER, WLabel, WallClock} from '../components/v02/S5_Exhibits';

/**
 * S5 · What came before (s25–s29) · the history shelf.
 *
 *  S5.1 s25–26  The plan board exactly as S4 leaves it (HANDOFF.S4S5) rolls up from the bottom into a paper scroll,
 *               uncovering the museum gallery behind it; the scroll drops onto a wooden wall ledge (shelf creak).
 *               Truck to "2012 · MIT": a lab table filled edge to edge (ultrafast laser, mirrors, a big streak-camera
 *               box aimed at a small wall, a tiny wooden mannequin behind a coral screen). On "recovering" the beam
 *               lights the wall and scatters to the mannequin and back; on "3D shape" a sketchy teal 3D outline of
 *               the mannequin rises out of the exhibit. Labels "ultrafast laser", "streak camera"; on "filled a
 *               table" the equipment hops left to right. Chip "illustration based on Velten et al. 2012".
 *  S5.2 s27     Truck to "2018 · Stanford": a compact laser + detector unit; on "swept one spot" the spot glyph
 *               (S4's wall spot) hops across a small board in a raster; "reflective" glints on a small exit sign
 *               behind a screen; the laptop rebuilds it in one second and shows "1 s"; on "Measuring" a wall clock's
 *               hand sweeps to ~7 minutes while the raster runs again. Chip "reflective exit sign: ≈ 1 s to rebuild ·
 *               ≈ 7 min to measure".
 *  S5.3 s28     Truck to "2021 · Wisconsin + Milan": a big laser fires at a small wall, the strip detector lights,
 *               the monitor plays a blobby live picture of the ball rolling behind the screen, redrawn five times a
 *               second (the counter "5 frames/s" fills one box per frame). Labels "powerful laser", "custom
 *               detectors"; chip "live · ordinary objects". The ball rolls to rest as the camera pulls back.
 *  S5.4 s29     Pull back to the shelf; a velvet rope clips across it post by post and a small sign "research
 *               equipment" drops onto it; on "One team" the camera trucks on past the empty fourth plinth to the end
 *               of the shelf, where a fingertip-sized sensor board stands on a little stool (outside the rope) with its
 *               side card. Hand-off (cut) to S6: the roped-off empty fourth plinth at left, the stool and card at right;
 *               S6 opens on a close-up of the empty fourth plinth (the stool and card lie outside S6's framings).
 *
 * All exhibits are generic, simplified illustrations (no brands, no copies of paper figures).
 */

/* ------------------------------------------------------------------ cues (from the narration; nothing absolute) */

const K = {
  start: scene('S5').from,
  end: scene('S5').to,
  none: at('s25', 'none'),
  in25: at('s25', 'in'),
  y2012: at('s25', '2012'),
  mit: at('s25', 'mit'),
  recovering: at('s25', 'recovering'),
  threeD: at('s25', '3d'),
  mannequin: at('s25', 'mannequin'),
  around: at('s25', 'around'),
  corner: at('s25', 'corner'),
  s26: seg('s26').from,
  ultrafast: at('s26', 'ultrafast'),
  laser26: at('s26', 'laser'),
  highspeed: at('s26', 'high-speed'),
  lab: at('s26', 'lab'),
  table: at('s26', 'table'),
  filled: at('s26', 'filled'),
  s26end: segEnd('s26'),
  s27: seg('s27').from,
  stanford: at('s27', 'stanford'),
  swept: at('s27', 'swept'),
  wall27: at('s27', 'wall'),
  like: at('s27', 'like'),
  simplified: at('s27', 'simplified'),
  math: at('s27', 'math'),
  simpler: at('s27', 'simpler'),
  reflective: at('s27', 'reflective'),
  exit: at('s27', 'exit'),
  rebuilding: at('s27', 'rebuilding'),
  second: at('s27', 'second'),
  measuring: at('s27', 'measuring'),
  seven: at('s27', 'seven'),
  minutes: at('s27', 'minutes'),
  s27end: segEnd('s27'),
  s28: seg('s28').from,
  wisconsin: at('s28', 'wisconsin'),
  sped: at('s28', 'sped'),
  live: at('s28', 'live'),
  five: at('s28', 'five'),
  powerful: at('s28', 'powerful'),
  custom: at('s28', 'custom'),
  s28end: segEnd('s28'),
  s29: seg('s29').from,
  but: at('s29', 'but'),
  research: at('s29', 'research'),
  one: at('s29', 'one'),
  tracked: at('s29', 'tracked'),
  hidden: at('s29', 'hidden'),
  cheap: at('s29', 'cheap'),
  sensor: at('s29', 'sensor'),
};

/* ------------------------------------------------------------------ beats (derived from the cues) */

// S5.1 the board rolls up, the scroll drops onto the ledge
const ROLL0 = K.start + 2;
const ROLL_DUR = Math.max(20, Math.min(40, K.in25 - ROLL0 - 22));
const FALL0 = ROLL0 + ROLL_DUR + 2;
const FALL_DUR = 16;
const LAND = FALL0 + FALL_DUR;
// truck to 2012
const TRUCK1 = LAND + 10;
const TRUCK1_DUR = Math.max(24, Math.min(40, K.mit + 8 - TRUCK1));
const ARRIVE1 = TRUCK1 + TRUCK1_DUR;
const BEAM1 = Math.max(ARRIVE1 + 4, K.recovering - 4);
const BEAM1_DUR = 15;
const SCATTER1 = BEAM1 + BEAM1_DUR;
const SKETCH0 = Math.max(SCATTER1 + 12, K.threeD - 2);
const SKETCH_DUR = Math.max(20, Math.min(40, K.corner - SKETCH0));
const RING = Math.max(SKETCH0 + 10, K.mannequin - 2);
const SIGHT = Math.max(RING + 8, K.around);
const MARKS_OFF = Math.max(SIGHT + 24, K.s26 + 6);
const LBL_LASER = K.ultrafast + 2;
const FLASH1 = K.laser26;
const LBL_CAM = K.highspeed + 2;
const HOP0 = K.filled - 2;
const MARK0 = Math.min(Math.max(LBL_CAM + 10, K.lab), HOP0 - 10); // the bracket is under way before the hops
const MARK_DUR = Math.max(10, Math.min(24, K.table - MARK0));
// S5.2 2018
const TRUCK2 = Math.max(HOP0 + 20, K.s27 - 6);
const TRUCK2_DUR = Math.max(26, Math.min(48, K.stanford - TRUCK2));
const ARRIVE2 = TRUCK2 + TRUCK2_DUR;
const LEAVE1 = TRUCK2 - 6;
const SWEEP0 = Math.max(ARRIVE2 + 4, K.swept);
const HOP_EVERY = Math.max(1.6, Math.min(3, (K.wall27 + 10 - SWEEP0) / RASTER.length));
const SWEEP_END = SWEEP0 + HOP_EVERY * RASTER.length;
// "like our simplified picture": three slow flash-and-listen stops along the bottom row, ending where the spot rests
const SLOW0 = Math.max(Math.ceil(SWEEP_END) + 6, K.like);
const SLOW_IDX = [10, 12, 14];
const SLOW_STEP = Math.max(8, Math.min(16, Math.floor((K.math - 4 - SLOW0) / 3)));
const SLOW_END = SLOW0 + SLOW_STEP * 3;
const LAPTOP_ON = K.math;
const RETRO = K.reflective - 2;
const GLINT = RETRO + 8;
/** "exit sign": the little sign hops and swells once, after the glint has gone */
const SIGN_POP = Math.max(GLINT + 12, K.exit - 2);
const SIGN_POP_DUR = Math.max(8, Math.min(12, K.rebuilding - 2 - SIGN_POP));
const REBUILD0 = K.rebuilding;
const REBUILD_DUR = 30; // "about a second": the picture forms in one second of screen time
const ONE_S = Math.max(REBUILD0 + REBUILD_DUR, K.second);
const MEAS0 = K.measuring + 2;
const MEAS_DUR = Math.max(24, Math.min(54, K.minutes + 8 - MEAS0));
const MEAS_EVERY = MEAS_DUR / RASTER.length;
const CHIP2B = Math.min(K.seven, MEAS0 + MEAS_DUR - 6);
// S5.3 2021
const TRUCK3 = Math.max(MEAS0 + MEAS_DUR + 4, K.s28 - 10);
const TRUCK3_DUR = Math.max(26, Math.min(48, K.wisconsin - TRUCK3));
const ARRIVE3 = TRUCK3 + TRUCK3_DUR;
const LEAVE2 = TRUCK3 - 4;
const WARM3 = Math.max(ARRIVE3 + 4, K.wisconsin);
const FIRE3 = Math.max(WARM3 + 18, K.sped);
const LIVE = Math.max(FIRE3 + 14, K.live);
const VIDEO0 = LIVE - 2;
const FIVE = Math.max(LIVE + 10, K.five);
const LBL_PL = K.powerful + 2;
const LBL_CD = K.custom + 2;
// S5.4 the rope, the end of the shelf
const PULL = Math.max(LBL_CD + 20, K.s29 - 8);
const PULL_DUR = Math.max(24, Math.min(40, K.but - PULL));
const LEAVE3 = PULL - 2;
const ROPE0 = Math.max(PULL + PULL_DUR + 2, K.but);
const ROPE_SEG = Math.max(6, Math.min(9, (K.research - ROPE0) / 3));
const CLIP = [1, 2, 3, 4].map((i) => ROPE0 + ROPE_SEG * i);
const SIGN_LAND = Math.max(CLIP[1] + 6, K.research + 2);
const TRUCKB = Math.max(SIGN_LAND + 22, K.one - 4);
// a long truck (past 2021 and the empty plinth to the end of the shelf): eased, done before the card lands
const TRUCKB_DUR = Math.max(24, Math.min(40, K.hidden - TRUCKB));
const CARD = TRUCKB + TRUCKB_DUR + 2;
const LED = K.cheap;
const PING = Math.max(CARD + 8, K.sensor - 4);
const PING_DUR = Math.max(12, Math.min(26, K.end - 2 - PING));
/** 2021: the ball rolls to rest at this x while the camera pulls back (S6's still copy of the exhibit has it here) */
const BALL_REST = 214;

/* ------------------------------------------------------------------ framings (world px) */

const [P1, P2, P3, P4] = MU.P;
const CAM_F0: Cam = {cx: 760, cy: 470, zoom: 1.0};
const CU = (x: number): Cam => ({cx: x, cy: 450, zoom: 1.4});
/** 2018 is framed a little wider and higher so the wall clock above its board is in the shot */
const CU2: Cam = {cx: P2 - 10, cy: 405, zoom: 1.28};
const CAM_WA: Cam = {cx: P2, cy: 520, zoom: 0.68};
/** the hand-off framing: the roped-off empty fourth plinth (left of centre) and, past the rope's end, the stool with the
 *  cheap sensor and its card (outside every S6 framing, so nothing vanishes at the cut to S6's plinth close-up) */
const CAM_WB: Cam = {cx: 4620, cy: 440, zoom: 0.8};

/* ------------------------------------------------------------------ the roll (screen px under CAM_F0, zoom 1) */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const R0 = 14;
const R_END = 56;
const Y_END = 2 * R_END + 4;
const TH = (Math.PI * (R_END * R_END - R0 * R0)) / (1080 - Y_END);
/** the sheet draws back a little while it rolls (scaled about its top centre), so the roll's ends come into view */
const SHEET_END = 0.8;
const sheetScale = (p: number) => lerp(1, SHEET_END, E.inOut(p));
const LAND_POS = {x: (MU.ledge.x0 + MU.ledge.x1) / 2, r: 28, len: 360};
const toWorldF0 = (sx: number, sy: number) => ({x: sx + CAM_F0.cx - 960, y: sy + CAM_F0.cy - 540});

/** where the scroll is (world px), or null before the roll starts */
const scrollAt = (g: number): {cx: number; cy: number; len: number; r: number; spin: number; sx: number; sy: number} | null => {
  if (g <= ROLL0) return null;
  if (g < FALL0) {
    const p = tw(g, ROLL0, ROLL_DUR, E.inOut);
    const k = sheetScale(p);
    const yr = lerp(1080, Y_END, p);
    const r = Math.sqrt(R0 * R0 + ((1080 - yr) * TH) / Math.PI);
    const w = toWorldF0(960, k * (yr - r));
    return {cx: w.x, cy: w.y, len: 1920 * k, r: r * k, spin: -(1080 - yr) / 30, sx: 1, sy: 1};
  }
  const landY = MU.ledge.y - LAND_POS.r;
  const start = toWorldF0(960, SHEET_END * (Y_END - R_END));
  if (g < LAND) {
    const u = (g - FALL0) / FALL_DUR;
    const lift = -14 * Math.sin(Math.PI * clamp01(u / 0.3)) * (u < 0.3 ? 1 : 0);
    return {
      cx: lerp(start.x, LAND_POS.x, E.inOut(u)),
      cy: lerp(start.y, landY, u * u) + lift,
      len: lerp(1920 * SHEET_END, LAND_POS.len, E.out(u)),
      r: lerp(R_END * SHEET_END, LAND_POS.r, E.out(u)),
      spin: -32 - u * 7,
      sx: 1,
      sy: 1,
    };
  }
  const [sx, sy] = impact(g, LAND, 0.16, 10);
  const roll = 14 * ring(g, LAND + 3, 0.3, 0.1);
  return {cx: LAND_POS.x + roll, cy: landY + drop(g, LAND, 70, 1) * (g > LAND ? 1 : 0) + LAND_POS.r * (1 - sy), len: LAND_POS.len, r: LAND_POS.r, spin: -39 - roll / LAND_POS.r, sx, sy};
};

/* ------------------------------------------------------------------ the scene */

const fadeIn = (g: number, t0: number, d = 8) => tw(g, t0, d, E.out);
const pop = (g: number, t0: number, d = 12) => (g < t0 ? 0 : E.back(clamp01((g - t0) / d)));

export const S5History: React.FC = () => {
  const g = useG();

  /* ---- camera */
  const cam = camPath(g, CAM_F0, [
    {at: TRUCK1, dur: TRUCK1_DUR, to: CU(P1)},
    {at: TRUCK2, dur: TRUCK2_DUR, to: CU2},
    {at: TRUCK3, dur: TRUCK3_DUR, to: CU(P3)},
    {at: PULL, dur: PULL_DUR, to: CAM_WA},
    {at: TRUCKB, dur: TRUCKB_DUR, to: CAM_WB},
  ]);

  /* ---- the roll */
  const rollP = g <= ROLL0 ? 0 : tw(g, ROLL0, ROLL_DUR, E.inOut);
  const yr = lerp(1080, Y_END, rollP);
  const rNow = Math.sqrt(R0 * R0 + ((1080 - yr) * TH) / Math.PI);
  const boardBottom = g <= ROLL0 ? 1080 : yr - rNow;
  const sheetK = sheetScale(rollP);
  const scroll = scrollAt(g);

  /* ---- 2012 */
  const out1 = 1 - tw(g, LEAVE1, 10, E.inOut);
  const hops = [0, 1, 2, 3, 4].map((i) => hop(g, HOP0 + i * 3, 12, 9));
  const beam1 = tw(g, BEAM1, BEAM1_DUR, E.linear);
  const scatter1 = tw(g, SCATTER1, 12, E.linear);
  const view1 = tw(g, SCATTER1 + 12, 8, E.linear);
  const flash1 = g >= FLASH1 && g < FLASH1 + 14 ? ((g - FLASH1) % 7) / 7 : 0;
  const sketch = {draw: tw(g, SKETCH0, SKETCH_DUR * 0.8, E.inOut), rise: tw(g, SKETCH0, SKETCH_DUR, E.inOut)};
  const sketchOut = 1 - tw(g, TRUCK2, 14, E.inOut);
  // the beams dim once the shelf moves on (the exhibits stay; the illustration of the light does not)
  const lights1 = 1 - tw(g, TRUCK2, 12, E.inOut);
  const marksOut = 1 - tw(g, MARKS_OFF, 10, E.inOut);
  const ring1 = tw(g, RING, 12, E.inOut) * marksOut;
  const sight1 = tw(g, SIGHT, 18, E.linear) * marksOut;
  const streak1 = g < LBL_CAM ? 1 : tw(g, LBL_CAM, 14, E.inOut);
  const tableMark = {draw: tw(g, MARK0, MARK_DUR, E.inOut), op: 1 - tw(g, HOP0 + 26, 10)};

  /* ---- 2018 */
  const rasterIdx = (t0: number, every: number) => Math.min(RASTER.length - 1, Math.max(0, Math.floor((g - t0) / every)));
  const inSweep1 = g >= SWEEP0 - 4 && g < SWEEP_END + 10;
  const inSweep2 = g >= MEAS0 - 2 && g < MEAS0 + MEAS_DUR + 10;
  const slowK = Math.floor((g - SLOW0) / SLOW_STEP);
  const spotIdx = g >= MEAS0 ? rasterIdx(MEAS0, MEAS_EVERY) : g >= SLOW0 ? SLOW_IDX[Math.min(2, slowK)] : rasterIdx(SWEEP0, HOP_EVERY);
  const inSlow = g >= SLOW0 - 2 && g < SLOW_END + 8;
  const spotHere = g >= SWEEP0 - 4 && g < TRUCK3 + 6;
  const spot = spotHere ? RASTER[spotIdx] : null;
  // "like our simplified picture": the spot (the plan's wall-spot glyph) gives one small pulse
  const spotPulse = inSlow && g < SLOW_END ? 1 + 0.15 * Math.sin(Math.PI * clamp01(((g - SLOW0) % SLOW_STEP) / 8)) : 1;
  const spotT = spotHere ? fadeIn(g, SWEEP0 - 4, 6) * (1 - tw(g, TRUCK3, 8)) * spotPulse : 0;
  // the reflected light clears just before the sign hops (its end point would otherwise detach from the moving sign)
  const retroOp = 1 - tw(g, Math.min(REBUILD0 + 2, SIGN_POP - 5), 5);
  const retro = g >= RETRO - 6 && retroOp > 0 ? {out: tw(g, RETRO, 8, E.linear), back: tw(g, RETRO + 8, 8, E.linear), op: retroOp} : undefined;
  const beamRetro = g >= RETRO - 6 ? fadeIn(g, RETRO - 6, 4) * retroOp : 0;
  const beam2 = inSweep1
    ? fadeIn(g, SWEEP0 - 4, 4) * (1 - tw(g, SWEEP_END + 4, 6))
    : inSlow
      ? fadeIn(g, SLOW0 - 2, 4) * (1 - tw(g, SLOW_END + 2, 6))
      : inSweep2
        ? fadeIn(g, MEAS0 - 2, 4) * (1 - tw(g, MEAS0 + MEAS_DUR + 4, 6))
        : beamRetro;
  const math = g >= K.math ? {draw: tw(g, K.math, 10, E.linear), collapse: tw(g, Math.max(K.math + 10, K.simpler), 12, E.linear), op: 1 - tw(g, REBUILD0 - 6, 6)} : undefined;
  // the laptop keeps its result (picture + "1 s"): it is an exhibit, and it is still in view as the camera leaves
  const laptop = g >= LAPTOP_ON ? 1 : 0;
  const rebuild = tw(g, REBUILD0, REBUILD_DUR, E.linear);
  const oneS = pop(g, ONE_S);
  const glint = tw(g, GLINT, 14, E.linear);
  const minutes = 6.8 * tw(g, MEAS0, MEAS_DUR, E.inOut);
  const wedge = 1;

  /* ---- 2021 */
  const beam3 = tw(g, FIRE3, 8, E.linear);
  const view3 = tw(g, FIRE3 + 8, 8, E.linear);
  const cells = g < WARM3 ? 0 : g < FIRE3 ? Math.min(8, (g - WARM3) / 2) : g >= VIDEO0 ? 8 * (0.55 + 0.45 * Math.abs(Math.sin(Math.floor((g - VIDEO0) / 6) * 1.7))) : 8;
  const monitor = g >= WARM3 + 8 ? 1 : 0;
  const ballAt = (f: number) => {
    const ph = Math.max(0, f - (LIVE - 8));
    return lerp(E21.ballRange[0], E21.ballRange[1], 0.5 - 0.5 * Math.cos((ph / 46) * Math.PI));
  };
  // no perpetual motion: the ball rolls to rest while the camera pulls back to the wide
  const ballPos = (f: number) => lerp(ballAt(f), BALL_REST, tw(f, PULL, PULL_DUR, E.inOut));
  const ballX = ballPos(g);
  const frameIdx = g >= VIDEO0 ? Math.floor((g - VIDEO0) / 6) : -1;
  const frameBallX = frameIdx >= 0 ? ballPos(VIDEO0 + frameIdx * 6) : ballPos(VIDEO0);
  const counter = pop(g, FIVE, 10) * (1 - tw(g, LEAVE3, 8));
  const ticks = g >= FIVE ? (Math.floor((g - VIDEO0) / 6) % 5) + 1 : 0;

  /* ---- rope, sign, end of the shelf */
  const posts = MU.posts;
  const ropeY = MU.ropeY;
  const spans = [0, 1, 2, 3].map((i) => {
    const t0 = ROPE0 + ROPE_SEG * i;
    if (g < t0) return null;
    const a = posts[i];
    const b = posts[i + 1];
    const u = clamp01((g - t0) / ROPE_SEG);
    const ue = E.inOut(u);
    if (u < 1) {
      const ex = lerp(a, b, ue);
      const ey = ropeY - 70 * Math.sin(Math.PI * ue);
      return {x0: a, y0: ropeY, x1: ex, y1: ey, sag: MU.sag * ue * 0.9};
    }
    const bounce = 1 + 0.16 * ring(g, CLIP[i], 0.45, 0.16);
    return {x0: a, y0: ropeY, x1: b, y1: ropeY, sag: MU.sag * bounce};
  });
  const s2 = spans[1];
  const hook = s2 && g >= CLIP[1] ? ropePoint(s2.x0, s2.y0, s2.x1, s2.y1, s2.sag, 0.5) : null;
  const signFall = 9;
  const signU = clamp01((g - (SIGN_LAND - signFall)) / signFall);
  const signY = hook ? hook.y - (1 - signU * signU) * 260 : 0;
  const signOp = g >= SIGN_LAND - signFall ? 1 : 0;
  const signRot = g >= SIGN_LAND ? 9 * ring(g, SIGN_LAND, 0.42, 0.11) : 0;
  const card = pop(g, CARD, 12);
  const led = g >= LED && g < LED + 40 ? (Math.floor((g - LED) / 5) % 2 === 0 ? 1 : 0) : 0;

  /* ---- labels (world px, plinth-local positions + plinth origin) */
  const W = (px: number, p: {x: number; y: number}) => ({x: px + p.x, y: MU.slabTop + p.y});
  const lblT = (t0: number, out: number) => pop(g, t0) * out;

  /* ---- chips (screen) */
  const chip1 = fadeIn(g, ARRIVE1 + 4, 8) * (1 - tw(g, TRUCK2 + 6, 8));
  const ill2 = fadeIn(g, ARRIVE2 + 4, 8) * (1 - tw(g, TRUCK3 + 16, 8));
  const ill3 = fadeIn(g, ARRIVE3 + 4, 8) * (1 - tw(g, PULL + 6, 8));
  const chip2a = fadeIn(g, ONE_S + 4, 8) * (1 - tw(g, TRUCK3 + 16, 8));
  const chip2b = fadeIn(g, CHIP2B, 8) * (1 - tw(g, TRUCK3 + 16, 8));
  const chip3 = fadeIn(g, LIVE + 4, 8) * (1 - tw(g, PULL + 6, 8));

  const sv = {position: 'absolute' as const, left: 0, top: 0, overflow: 'visible' as const};

  return (
    <AbsoluteFill style={{background: PLINTH.wall}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <svg width={1920} height={1080} style={sv}>
            <MuseumHall />
            <Ledge />
            <Plinth x={P1} plaque={{year: '2012', place: 'MIT'}} />
            <Plinth x={P2} plaque={{year: '2018', place: 'Stanford'}} />
            <Plinth x={P3} plaque={{year: '2021', place: 'Wisconsin + Milan'}} />
            <Plinth x={P4} />

            {/* 2012 · MIT */}
            <Exhibit2012
              x={P1}
              y={MU.slabTop}
              hop={hops.map((h) => h)}
              beam={beam1 * lights1}
              scatter={scatter1 * lights1}
              view={view1 * lights1}
              flash={flash1}
              sketch={sketchOut > 0.001 ? {draw: sketch.draw * sketchOut, rise: sketch.rise} : undefined}
              ring={ring1}
              sight={sight1}
              streak={streak1}
              tableMark={tableMark}
            />
            <WLabel x={P1 - 610} y={MU.slabTop - 300} w={236} text="streak camera" t={lblT(LBL_CAM, out1)} to={W(P1, {x: E12.camLeft.x, y: E12.camLeft.y + hops[0]})} from={{x: P1 - 374, y: MU.slabTop - 274}} />
            <WLabel x={P1 - 610} y={MU.slabTop - 140} w={252} text="ultrafast laser" t={lblT(LBL_LASER, out1)} to={W(P1, {x: E12.laserLeft.x, y: E12.laserLeft.y + hops[0]})} from={{x: P1 - 358, y: MU.slabTop - 114}} />

            {/* 2018 · Stanford */}
            <Exhibit2018 x={P2} y={MU.slabTop} spot={spot} spotT={spotT} beam={beam2} laptop={laptop} rebuild={rebuild} oneS={oneS} glint={glint} math={math} retro={retro} signPop={tw(g, SIGN_POP, SIGN_POP_DUR, E.linear)} />
            <WallClock x={P2 + 60} y={MU.slabTop - 400} r={56} minutes={minutes} wedge={wedge} />

            {/* 2021 · Wisconsin + Milan */}
            <Exhibit2021
              x={P3}
              y={MU.slabTop}
              beam={beam3}
              view={view3}
              cells={cells}
              monitor={monitor}
              ballX={ballX}
              frameBallX={frameBallX}
              frameIdx={frameIdx}
              counter={counter}
              ticks={ticks}
            />
            <WLabel x={P3 - 610} y={MU.slabTop - 100} w={248} text="powerful laser" t={lblT(LBL_PL, 1 - tw(g, LEAVE3, 8))} to={W(P3, E21.laserLeft)} from={{x: P3 - 362, y: MU.slabTop - 74}} />
            <WLabel x={P3 - 10} y={MU.slabTop - 372} w={292} text="custom detectors" t={lblT(LBL_CD, 1 - tw(g, LEAVE3, 8))} to={W(P3, E21.strip)} from={{x: P3 + 40, y: MU.slabTop - 320}} />

            {/* the end of the shelf: a cheap sensor on a little stool */}
            <SideCard t={card} lines={['2021', 'hidden objects tracked', 'with a cheap sensor', 'Callenberg et al. · illustration']} />
            <SensorStool x={MU.stool.x} led={led} hop={hop(g, LED - 1, 16, 10)} ping={tw(g, PING, PING_DUR, E.linear)} />

            {/* rope posts and the velvet rope (foreground) */}
            {spans.map((s, i) => (s ? <RopeSpan key={`rs${i}`} {...s} /> : null))}
            {posts.map((x) => (
              <RopePost key={`post${x}`} x={x} />
            ))}
            {hook && signOp > 0 && <RopeSign x={hook.x} y={signY} rot={signRot} text="research equipment" />}
          </svg>
        </Layer>
      </Camera>

      {/* the plan board (S4's last frame), rolling up from the bottom */}
      {boardBottom > 0 && g < FALL0 && (
        <AbsoluteFill style={{transform: `scale(${sheetK.toFixed(4)})`, transformOrigin: '50% 0'}}>
          <AbsoluteFill style={{clipPath: `inset(0 0 ${Math.max(0, 1080 - boardBottom).toFixed(2)}px 0)`}}>
            <PlanBoard />
            {/* the sheet's side edges */}
            <div style={{position: 'absolute', left: 0, top: -10, width: 1920, height: 1100, boxSizing: 'border-box', borderLeft: `5px solid ${C.ink}`, borderRight: `5px solid ${C.ink}`, opacity: clamp01((1 - sheetK) * 40)}} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {/* the scroll (world px, above the board while it rolls) */}
      {scroll && (
        <Camera cam={cam}>
          <Layer depth={1}>
            <svg width={1920} height={1080} style={sv}>
              <ScrollRoll cx={scroll.cx} cy={scroll.cy} len={scroll.len} r={scroll.r} spin={scroll.spin} sx={scroll.sx} sy={scroll.sy} sw={4} />
            </svg>
          </Layer>
        </Camera>
      )}

      {/* guard-rail chips (screen px; settled chips do not move) */}
      <div style={{position: 'absolute', left: 96, top: 54, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10}}>
        {chip1 > 0.001 && (
          <div style={{opacity: chip1}}>
            <Chip tone="paper" size={30}>illustration based on Velten et al. 2012</Chip>
          </div>
        )}
        {ill2 > 0.001 && (
          <div style={{opacity: ill2}}>
            <Chip tone="paper" size={30}>illustration</Chip>
          </div>
        )}
        {chip2a > 0.001 && (
          <div style={{opacity: chip2a}}>
            <Chip tone="paper" size={30}>reflective exit sign: ≈ 1 s to rebuild</Chip>
          </div>
        )}
        {chip2b > 0.001 && (
          <div style={{opacity: chip2b}}>
            <Chip tone="paper" size={30}>≈ 7 min to measure</Chip>
          </div>
        )}
        {ill3 > 0.001 && (
          <div style={{opacity: ill3}}>
            <Chip tone="paper" size={30}>illustration</Chip>
          </div>
        )}
        {chip3 > 0.001 && (
          <div style={{opacity: chip3}}>
            <Chip tone="paper" size={30}>live · ordinary objects</Chip>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ sound cue sheet */

const VIDEO_TICKS = [0, 1, 2, 3, 4].map((i) => VIDEO0 + Math.ceil((FIVE - VIDEO0) / 6) * 6 + i * 6);

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_museum', dur: (K.end - K.start) / 30, note: 'museum hall tone, whole scene'},
  {f: ROLL0, kind: 'paper_lift', gain: -2, note: 'the plan board starts to roll up'},
  {f: LAND, kind: 'thud_soft', gain: -3, note: 'the scroll lands on the ledge'},
  {f: LAND + 2, kind: 'shelf_creak', note: 'the ledge takes the weight'},
  {f: BEAM1, kind: 'sensor_pulse', gain: -6, note: '2012: the laser lights the wall'},
  {f: SKETCH0, kind: 'arc_draw', gain: -6, dur: SKETCH_DUR / 30, note: 'the 3D outline sketches itself'},
  {f: RING, kind: 'marker_circle', gain: -8, note: 'ring round the tiny mannequin'},
  {f: SIGHT + 12, kind: 'pop_tick', gain: -8, note: 'direct view stopped at the screen'},
  {f: LBL_LASER, kind: 'chip_pop', gain: -8, note: 'label: ultrafast laser'},
  {f: LBL_CAM, kind: 'chip_pop', gain: -8, pitch: 2, note: 'label: streak camera'},
  {f: MARK0, kind: 'marker_sweep', gain: -8, note: 'the whole table'},
  {f: SWEEP0, kind: 'scanner_sweep', gain: -8, dur: (SWEEP_END - SWEEP0) / 30, note: '2018: the spot sweeps the wall'},
  {f: K.math, kind: 'typewriter_tick', gain: -10, note: 'the laptop works the math'},
  {f: GLINT, kind: 'glint', gain: -4, note: 'reflective exit sign'},
  {f: SIGN_POP + SIGN_POP_DUR, kind: 'pop_tick', gain: -10, pitch: 3, note: 'the exit sign lands after its hop'},
  {f: REBUILD0 + REBUILD_DUR, kind: 'readout_beep', gain: -5, note: 'laptop: rebuilt in a second'},
  {f: ONE_S, kind: 'chip_pop', gain: -6, note: '1 s'},
  {f: MEAS0, kind: 'clock_tick', gain: -3, dur: MEAS_DUR / 30, note: 'the wall clock runs to ~7 minutes'},
  {f: WARM3, kind: 'prob_tick', gain: -10, note: '2021: the strip detector arms'},
  {f: FIRE3, kind: 'machine_hum', gain: -10, dur: (PULL - FIRE3) / 30, note: '2021: the powerful laser running'},
  ...VIDEO_TICKS.map((f, i) => ({f, kind: 'film_tick' as const, gain: -6 - i, pitch: i % 2, note: `video frame ${i + 1} (5 per second)`})),
  {f: LBL_PL, kind: 'chip_pop', gain: -8, note: 'label: powerful laser'},
  {f: LBL_CD, kind: 'chip_pop', gain: -8, pitch: 2, note: 'label: custom detectors'},
  ...CLIP.map((f, i) => ({f: Math.round(f), kind: 'rope_clip' as const, gain: i === 3 ? -8 : -3 - i, pitch: i - 1, note: `rope hooks onto post ${i + 2}`})),
  {f: SIGN_LAND, kind: 'hanger_click', gain: -2, note: 'sign: research equipment'},
  {f: CARD, kind: 'card_flick', gain: -4, note: 'side card: cheap sensor'},
  {f: LED, kind: 'readout_beep', gain: -10, pitch: 5, note: 'the tiny board hops and blinks ("cheap")'},
  {f: PING, kind: 'sensor_pulse', gain: -9, pitch: 4, note: 'the tiny board pings'},
];
