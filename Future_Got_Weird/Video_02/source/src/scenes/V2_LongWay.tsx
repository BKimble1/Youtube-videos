import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, tw} from '../lib/motion';
import {WALL_T} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, dist, layoutPoints, pathLength, polar, type P2} from '../lib/optics';
import {CandidateArc} from '../components/v02/Optics';
import {GuesserToken} from '../components/v02/Tokens';
import {SensorTop, facingOf} from '../components/v02/HandheldSensor';
import {ArrivalTimeline, BASELINE_Y, BUMP_X, SPIKE_X, TL_GEOM, fitTimeline, timelinePoint, type TimelinePlacement} from '../components/v2k/ArrivalTimeline';
import {Chip, Label, SubLabel, TeachLabel, labelBox} from '../components/v2k/Labels';
import {BounceRing, DashedLeg, PAINT, PaintGrain, PlanStage, Pulse, WallSpot, blendMaps, laneLeg, mapAt, planToPx, screenNormal, type PlanGrain, type PlanMap} from '../components/v2s/V2_Plan';
import {CLOSE, DISPLAY_H, LENS, SensorClose} from '../components/v2s/V2_SensorClose';
import {V1_BOARD_END} from './V1_HideTrack';

/**
 * V2 · The long way round (n03, n04, n05, n06). v2/SHOTPLAN_V2.md V2.
 *
 *  In (match from V1): our plan opens with its sensor glyph, relay wall line and partition on the screen positions the
 *       real board held on its last frame (V1_BOARD_END); everything else is our flat plan palette, chip "illustration".
 *       During "The trick is timing" the plan settles to its teaching framing (one move, before anything travels).
 *  V2.1 n03  One full-frame plan of our room. On "light" two pulses leave the sensor together at the speed of light
 *       (same speed, so arrival order is honest): the short teal trip S → W1 → S, the long saffron trip S → W1 → him → W1
 *       → S through the opening at the partition's wall end. Straight dashed legs, returns thinner, every leg asserted
 *       clear of the partition. The teal pulse is home (parked at the sensor) while the saffron one is still out. On
 *       "comes back later" a small arrival timeline fades in at its place at the bottom (clear of the caption band) and
 *       both drop onto it: teal first (the wall echo spike), saffron later (his echo). Labels "short trip" · "long way
 *       round" (64).
 *  V2.2 n04  As soon as both echoes have landed the timeline rises to fill the frame (kit ArrivalTimeline): "wall echo" /
 *       "his echo" (48), bracket "a few nanoseconds" (64) on "few", "not to scale". No number. It holds complete until
 *       "This takes", then shrinks into the sensor's display.
 *  V2.3 n05  The sensor close-up (full frame): the timeline is now its display, a stopwatch glyph beside it. On "clocks"
 *       the checker's mitt taps the display; the emitter fires a faint flash out, it returns into the receiver and the
 *       stopwatch stops. "time-of-flight sensor" (64), "times its own light's round trip" (40), chip "invisible flash ·
 *       shown for clarity" (30). Out: the camera pushes into the emitter lens and comes out in the plan.
 *  V2.4 n06  The same plan: W1 glows, the long trip's W1 → him leg flashes once, a dashed candidate arc (centred on the
 *       wall spot, radius |W1 H|) sweeps a third of the way round and resolves into a "?" (72). The camera pushes into
 *       W1's paint: the wall strip grows, its paint grain resolves, and its edges are still in frame on the last moving
 *       frame; the paint first fills the frame on the first of V2's last 4 frames, which are that paint with its static
 *       grain (PAINT_GRAIN, V2 → V3 hand-off; V3 opens on the same frame).
 */

/* ================================================================== cues */

const SC = scene('V2');
const K = {
  start: SC.from,
  end: SC.to,
  trick: at('n03', 'trick'),
  timing: at('n03', 'timing'),
  light: at('n03', 'light'),
  long: at('n03', 'long'),
  comes: at('n03', 'comes'),
  back: at('n03', 'back'),
  later: at('n03', 'later'),
  n04: seg('n04').from,
  a4: at('n04', 'a'),
  few: at('n04', 'few'),
  billionths: at('n04', 'billionths'),
  later4: at('n04', 'later'),
  n05: seg('n05').from,
  this5: at('n05', 'this'),
  tof: at('n05', 'time-of-flight'),
  clocks: at('n05', 'clocks'),
  round5: at('n05', 'round'),
  trip: at('n05', 'trip'),
  n05End: segEnd('n05'),
  so6: at('n06', 'so'),
  tiny: at('n06', 'tiny'),
  delay: at('n06', 'delay'),
  into: at('n06', 'into'),
  location: at('n06', 'location'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== geometry (layout.json, frame A) */

const {S, H, W} = layoutPoints(OLAYOUT);
const W1 = W.find((w) => w.id === 'W1')!;
const SHORT = [S, W1, S];
const LONG = [S, W1, H, W1, S];
const LEN_SW = dist(S, W1);
const LEN_WH = dist(W1, H);
const LEN_S = pathLength(SHORT);
const LEN_L = pathLength(LONG);
const R1 = LEN_WH; // candidate arc radius: |W1 H|
const ARC_A1 = Math.PI / 3; // "a third of the way round" the half circle in front of the wall
const PAINT_PT: P2 = {x: W1.x, z: -WALL_T / 2}; // the push target: inside the wall's paint at W1

/* ================================================================== framings (plan maps) */

/** The match framing: plan S on the board's sensor marker, the wall line z = 0 on the board's wall line. */
const KM = (V1_BOARD_END.sensor.y - V1_BOARD_END.wallY) / S.z;
const MAP_M: PlanMap = mapAt(KM, S, V1_BOARD_END.sensor);
/** The teaching framing (V2.1, V2.4): 520 px/m, W1 at x 600, the wall line at y 190. */
const KT = 520;
const MAP_T: PlanMap = mapAt(KT, S, {x: 600 + (S.x - W1.x) * KT, y: 190 + S.z * KT});
/** The end of the push (the hand-off framing): the wall's paint strip just covers the frame, 6 px beyond each edge (its
 *  4 px outline is then off screen); the paint grain is defined at this framing (V2_Plan PAINT_GRAIN). */
const K_END = (1080 + 2 * 6) / WALL_T;
const MAP_END: PlanMap = mapAt(K_END, PAINT_PT, {x: 960, y: 540});
const GRAIN: PlanGrain = {anchor: PAINT_PT, kEnd: K_END};

/** The match residuals (screen px): sensor and wall exact; partition x and its wall-end top differ by these. */
export const V2_MATCH = (() => {
  const P = planToPx(MAP_M);
  const part = P({x: OLAYOUT.occluder.x, z: OLAYOUT.occluder.z0});
  return {
    sensor: P(S),
    wallY: P({x: 0, z: 0}).y,
    partition: part,
    board: V1_BOARD_END,
    dx: part.x - V1_BOARD_END.partition.x,
    dyTop: part.y - V1_BOARD_END.partition.y0,
  };
})();

/* ================================================================== beats */

// match → teaching framing, during "The trick is timing", before anything travels
const RF0 = K.trick + 2;
const RF_DUR = clamp(K.light - 6 - RF0, 24, 40);

// V2.1 the race: both pulses at the same speed, the long one home on "back"
const RACE0 = K.light;
const LONG_END = Math.max(RACE0 + 80, K.back);
const RACE_D = LONG_END - RACE0;
const frameAtM = (m: number) => RACE0 + (RACE_D * m) / LEN_L;
const F_W1 = frameAtM(LEN_SW);
const F_TEAL_HOME = frameAtM(LEN_S);
const F_H = frameAtM(LEN_SW + LEN_WH);
const F_W1B = frameAtM(LEN_SW + 2 * LEN_WH);
const raceM = (g: number) => clamp01((g - RACE0) / RACE_D) * LEN_L;
const SHORT_LBL = Math.round(F_W1) + 6;
const LONG_LBL = Math.max(K.long, Math.round(F_W1) + 14);
// the mini timeline fades in at its place on "so it comes back" (never through the caption band), the pulses drop onto it
const TL_IN = K.comes - 12;
const TL_IN_DUR = 12;
const DROP_DUR = 10;
const TEAL_DROP = Math.max(K.comes, TL_IN + TL_IN_DUR);
const SAFF_DROP = Math.max(LONG_END + 1, TEAL_DROP + 6);
const TEAL_LAND = TEAL_DROP + DROP_DUR;
const SAFF_LAND = SAFF_DROP + DROP_DUR;

// V2.2 rise to full frame as soon as both echoes have landed; labels; bracket on "few"; it holds complete until
// "This takes", then the shrink into the display (v2 review r1, V2-R1-17: full frame earlier, complete for longer)
const RISE0 = SAFF_LAND + 2;
const RISE_DUR = 14;
const LBL_WALL = RISE0 + RISE_DUR - 6;
const LBL_HIS = LBL_WALL + 4;
const BRACKET0 = Math.max(K.few, LBL_HIS + 2);
const NTS = BRACKET0 + 4;
const SHRINK0 = K.this5;
const SHRINK_DUR = 14;
const CLOSE0 = SHRINK0; // the close-up is drawn behind the shrinking card from here
/** the display's miniature drops its text as it lands, before "time-of-flight sensor" cuts in */
const DISP_BARE0 = SHRINK0 + SHRINK_DUR;
const DISP_BARE_DUR = Math.min(6, K.tof - DISP_BARE0);

// V2.3 the close-up: labels, the tap, the flash out and back, the stopwatch
const TOF_LBL = K.tof;
const TRIP_LBL = K.clocks;
const TAP = K.clocks; // the mitt's palm meets the display
const MITT_IN = 16;
const MITT_OUT0 = TAP + 5;
const FIRE = TAP + 4;
const RETURN_END = Math.max(FIRE + 30, K.round5 + 3);
/** the flash rises out of the emitter for most of the trip, the echo comes down into the receiver for the rest */
const FLASH_OUT_DUR = Math.round((RETURN_END - FIRE) * 0.62);
const FLASH_BACK0 = FIRE + FLASH_OUT_DUR - 2;
const CHIP_IN = FIRE;
// out: push through the emitter lens into the plan
const LENS1 = K.so6 - 1;
const LENS0 = Math.max(RETURN_END + 4, LENS1 - 14);
const LENS_ZOOM = 9;

// V2.4 back in the plan
const GLOW0 = K.so6 + 2;
const LEG0 = K.tiny;
const LEG_DRAW = 10;
const LEG_HOLD = 8;
const LEG_FADE = 12;
const ARC0 = K.delay;
const ARC1 = Math.min(ARC0 + 20, K.into - 6);
const Q0 = ARC1 + 1;
/** compass-arm fade (plan angle, rad): fully gone before the arm could touch the partition (asserted) */
const ARM_FADE = [0.55, 0.85];
/** compass-arm fade-in (plan angle, rad): it appears once it has swung off the wall line */
const ARM_IN = [0.07, 0.2];
const FLAT0 = K.end - 4; // the last 4 frames: the paint and its grain, still (the V2 → V3 hand-off)
/** The push lands on the hand-off framing ON the first flat frame: the paint first fills the frame there, not before
 *  (v2 review r1, V2-R1-02: it used to fill the frame 6 frames early, so V2 ended on 9 blank frames). */
const PUSH1 = FLAT0;
const PUSH_DUR = 23;
const PUSH0 = PUSH1 - PUSH_DUR;
/** End slope of the push's log-scale curve (cubic Hermite, start slope 0): a soft landing that keeps the strip's edges
 *  moving through the last moving frame (0 would ease to a stop with the edges creeping along the frame border). */
const PUSH_END_SLOPE = 0.3;
const pushCurve = (u: number) => 3 * u * u - 2 * u * u * u + PUSH_END_SLOPE * (u * u * u - u * u);
/** W1's marker and glow fade as the camera enters the paint (a screen-size marker would otherwise ride the wall's inner
 *  line to the frame's bottom edge on the last moving frames). */
const SPOT_OUT0 = PUSH0 + 6;
const SPOT_OUT_DUR = 10;

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -6},
  // the race: one flash, two returns (two pitches: the pulse/return motif). The drops onto the small timeline are
  // silent: the returns already carry "teal first, saffron later", and block_drop is not in the trimmed vocabulary.
  {f: RACE0, kind: 'sensor_pulse', gain: -2},
  {f: Math.round(F_TEAL_HOME), kind: 'echo_return', pitch: 4, gain: -3},
  {f: Math.round(F_H), kind: 'bounce_tick', pitch: -2, gain: -8, note: 'the long trip reaches him'},
  {f: LONG_END, kind: 'echo_return', pitch: -3, gain: -5},
  // V2.3: the tap on the display, the flash out, its echo back
  {f: TAP, kind: 'pencil_tap', gain: -3, note: 'mitt taps the display'},
  {f: TAP + 1, kind: 'readout_beep', gain: -6},
  {f: FIRE, kind: 'sensor_pulse', pitch: 1, gain: -5},
  {f: RETURN_END, kind: 'echo_return', pitch: 1, gain: -6},
  // V2.4: the arc draws, the "?" lifts
  {f: ARC0, kind: 'arc_draw', dur: (ARC1 - ARC0) / 30, gain: -9},
  {f: Q0 + 2, kind: 'glint', gain: -6, note: 'a light lift on the "?"'},
];

/* ================================================================== plan helpers */

/** The plan map at frame g. */
const planMapAt = (g: number): PlanMap => {
  if (g >= PUSH0) {
    // the push into W1's paint: the paint point glides to the frame centre early (E.out) while the scale climbs in log
    // space along pushCurve, landing on MAP_END exactly on PUSH1 (= FLAT0) with the strip's edges in frame until then
    const u = tw(g, PUSH0, PUSH1 - PUSH0, E.linear);
    const a0 = planToPx(MAP_T)(PAINT_PT);
    const ea = E.out(u);
    return mapAt(KT * Math.pow(K_END / KT, pushCurve(u)), PAINT_PT, {x: lerp(a0.x, MAP_END.anchor.x, ea), y: lerp(a0.y, MAP_END.anchor.y, ea)});
  }
  if (g >= CLOSE0) return MAP_T;
  return blendMaps(MAP_M, MAP_T, tw(g, RF0, RF_DUR, E.inOut));
};

type Px = {x: number; y: number};

/** Lanes (px off the leg, along a fixed normal per wall-spot line): out legs inside, returns outside. */
const LANES = {tealOut: -11, tealBack: -31, saffOut: 11, saffBack: 31, whOut: -4, whBack: -22};
/** Parking bays beside the sensor glyph (screen px from S): a pulse that is home waits there, off the teal glyph. */
const BAY = {teal: {x: -104, y: 10}, saff: {x: 104, y: 10}};
const BAY_DUR = 6;

const raceLegs = (m: PlanMap) => {
  const P = planToPx(m);
  const s = P(S);
  const w = P(W1);
  const h = P(H);
  const n1 = screenNormal(s, w);
  const n2 = screenNormal(w, h);
  return {
    s,
    w,
    h,
    teal: [
      {...laneLeg(s, w, n1, LANES.tealOut), m0: 0, len: LEN_SW, back: false},
      {...laneLeg(w, s, n1, LANES.tealBack), m0: LEN_SW, len: LEN_SW, back: true},
    ],
    saff: [
      {...laneLeg(s, w, n1, LANES.saffOut), m0: 0, len: LEN_SW, back: false},
      {...laneLeg(w, h, n2, LANES.whOut), m0: LEN_SW, len: LEN_WH, back: false},
      {...laneLeg(h, w, n2, LANES.whBack), m0: LEN_SW + LEN_WH, len: LEN_WH, back: true},
      {...laneLeg(w, s, n1, LANES.saffBack), m0: LEN_SW + 2 * LEN_WH, len: LEN_SW, back: true},
    ],
  };
};

type Leg = {a: Px; b: Px; m0: number; len: number; back: boolean};
const headOn = (legs: Leg[], m: number): Px => {
  for (const L of legs) if (m <= L.m0 + L.len) return {x: lerp(L.a.x, L.b.x, clamp01((m - L.m0) / L.len)), y: lerp(L.a.y, L.b.y, clamp01((m - L.m0) / L.len))};
  const last = legs[legs.length - 1];
  return last.b;
};

/** The mini arrival timeline at the bottom of the plan (V2.1), the full frame (V2.2), the display (V2.3). */
const TL_MINI = fitTimeline({x: 372, y: 735, w: 400});
const TL_FULL: Required<TimelinePlacement> = {x: 0, y: 0, layoutScale: 1};
const TL_DISP = fitTimeline({x: CLOSE.display.x, y: CLOSE.display.y, w: CLOSE.display.w});
const lerpPlace = (a: Required<TimelinePlacement>, b: Required<TimelinePlacement>, t: number): Required<TimelinePlacement> => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), layoutScale: lerp(a.layoutScale, b.layoutScale, t)});
const SPIKE_MINI = timelinePoint({x: SPIKE_X, y: BASELINE_Y}, TL_MINI);
const BUMP_MINI = timelinePoint({x: BUMP_X, y: BASELINE_Y}, TL_MINI);

/** Timeline placement at frame g (V2.1 slide-in → V2.2 rise → shrink into the display). */
const tlPlaceAt = (g: number): Required<TimelinePlacement> => {
  if (g < RISE0) return TL_MINI;
  if (g < SHRINK0) return lerpPlace(TL_MINI, TL_FULL, E.inOut(tw(g, RISE0, RISE_DUR, E.linear)));
  return lerpPlace(TL_FULL, TL_DISP, E.inOut(tw(g, SHRINK0, SHRINK_DUR, E.linear)));
};

/** The timeline's animated content at frame g (shared by the plan overlay, the full frame and the display). */
const tlProps = (g: number) => ({
  axis: 1,
  wall: tw(g, TEAL_LAND, 12, E.linear),
  hidden: tw(g, SAFF_LAND, 12, E.linear),
  labels: [tw(g, LBL_WALL, 6, E.linear), tw(g, LBL_HIS, 6, E.linear)] as [number, number],
  bracket: tw(g, BRACKET0, 14, E.linear),
  notToScale: tw(g, NTS, 6, E.linear),
});

/**
 * The two pulses at frame g (screen px): running along their lanes, parked in their bays beside the sensor once home,
 * dropping onto the mini timeline, gone on landing. Drawn ABOVE the timeline card (RaceDots), so a drop never passes
 * behind it.
 */
const raceDotsAt = (g: number): {teal: Px | null; saff: Px | null} => {
  if (g < RACE0 || g >= RISE0) return {teal: null, saff: null};
  const m = planMapAt(g);
  const legs = raceLegs(m);
  const sPx = planToPx(m)(S);
  const mHead = raceM(g);
  const park = (from: Px, bay: {x: number; y: number}, f0: number) => {
    const u = E.out(tw(g, f0, BAY_DUR, E.linear));
    return {x: lerp(from.x, sPx.x + bay.x, u), y: lerp(from.y, sPx.y + bay.y, u)};
  };
  const tealPark = park(legs.teal[1].b, BAY.teal, F_TEAL_HOME);
  const saffPark = park(legs.saff[3].b, BAY.saff, LONG_END);
  const tl = tlPlaceAt(g);
  const drop = (from: Px, to: Px, t0: number) => {
    const u = E.in(tw(g, t0, DROP_DUR, E.linear));
    return {x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u)};
  };
  const spikeNow = timelinePoint({x: SPIKE_X, y: BASELINE_Y}, tl);
  const bumpNow = timelinePoint({x: BUMP_X, y: BASELINE_Y}, tl);
  return {
    teal: g < F_TEAL_HOME ? headOn(legs.teal, Math.min(mHead, LEN_S)) : g < TEAL_DROP ? tealPark : g < TEAL_LAND ? drop(tealPark, spikeNow, TEAL_DROP) : null,
    saff: g < LONG_END ? headOn(legs.saff, mHead) : g < SAFF_DROP ? saffPark : g < SAFF_LAND ? drop(saffPark, bumpNow, SAFF_DROP) : null,
  };
};

const RaceDots: React.FC<{g: number}> = ({g}) => {
  const d = raceDotsAt(g);
  if (!d.teal && !d.saff) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {d.teal && <Pulse p={d.teal} fill={C.teal} />}
      {d.saff && <Pulse p={d.saff} fill={C.saffron} />}
    </svg>
  );
};

/* ================================================================== V2.1 / V2.4 the plan */

const PlanShot: React.FC<{g: number; v24: boolean}> = ({g, v24}) => {
  const m = planMapAt(g);
  const P = planToPx(m);
  const legs = raceLegs(m);
  const sTop = P(S);
  const facing = facingOf(P(W1).x - sTop.x, P(W1).y - sTop.y);
  const tokH = P(H);

  // V2.1: the race (trails stay until the timeline rises)
  const race = !v24 && g >= RACE0;
  const trailOp = 1 - tw(g, RISE0 - 2, 8, E.linear);
  const mHead = raceM(g);
  const tealHead = Math.min(mHead, LEN_S);
  const legU = (L: Leg, head: number) => clamp01((head - L.m0) / L.len);
  const homeRing = (f: number) => (g >= f ? (g - f) / 12 : 0);

  // W1: the diamond pops just before the pulses reach it, lit at each bounce; V2.4: glows, and stays lit through the
  // push into its paint (it is the push's target: it rides the wall's inner line off the bottom of the frame as the
  // paint fills it; asserted off screen on the last pushed frame)
  const spotOut = v24 ? 1 - tw(g, SPOT_OUT0, SPOT_OUT_DUR, E.inOut) : 1;
  const spotPop = v24 ? tw(g, GLOW0 - 6, 8, E.back) : g >= F_W1 - 6 ? E.back(clamp01((g - (F_W1 - 6)) / 8)) * trailOp : 0;
  const litWin = (f: number) => tw(g, f - 2, 2, E.linear) * (1 - tw(g, f + 8, 6, E.linear));
  const spotLit = v24 ? tw(g, GLOW0, 10, E.linear) : Math.max(litWin(F_W1), litWin(F_W1B));
  const spotGlow = v24 ? tw(g, GLOW0, 10, E.linear) * spotOut : 0;

  // V2.4: the long trip's W1 → him leg flashes once; the candidate arc; the "?"
  const legDraw = v24 ? tw(g, LEG0, LEG_DRAW, E.out) : 0;
  const legOp = v24 ? 1 - tw(g, LEG0 + LEG_DRAW + LEG_HOLD, LEG_FADE, E.linear) : 0;
  const arcT = v24 ? tw(g, ARC0, ARC1 - ARC0, E.inOut) : 0;
  const qT = v24 ? tw(g, Q0, 6, E.linear) : 0;
  const arcEnd = P(polar(W1, R1, ARC_A1));
  const armA = ARC_A1 * clamp01(arcT);
  const armTip = P(polar(W1, R1, armA));
  // the arm fades in once it has swung off the wall line (at 0° it would lie on the wall's own ink line and read as a
  // stray line on the wall), and fades out before it would lie across the partition (it would from ~57° on; the arc
  // stops at 60°)
  const armIn = clamp01((armA - ARM_IN[0]) / (ARM_IN[1] - ARM_IN[0]));
  const armOp = v24 && g >= ARC0 && arcT < 1 ? Math.min(armIn, 1 - clamp01((armA - ARM_FADE[0]) / (ARM_FADE[1] - ARM_FADE[0]))) : 0;
  const hitRing = v24 ? homeRing(LEG0 + LEG_DRAW) : homeRing(F_H);

  const floor = (
    <g>
      {/* V2.1 trails */}
      {race && trailOp > 0 && (
        <g opacity={f2(trailOp)}>
          {legs.teal.map((L, i) => (
            <DashedLeg key={`t${i}`} a={L.a} b={L.b} u={legU(L, tealHead)} color={C.tealDeep} width={L.back ? 4.5 : 7} dash={L.back ? '10 10' : '18 12'} />
          ))}
          {legs.saff.map((L, i) => (
            <DashedLeg key={`s${i}`} a={L.a} b={L.b} u={legU(L, mHead)} color={C.saffronDeep} width={L.back ? 4.5 : 7} dash={L.back ? '10 10' : '18 12'} />
          ))}
        </g>
      )}
      {/* V2.4 the W1 → him leg, once */}
      {legDraw > 0 && legOp > 0 && <DashedLeg a={legs.saff[1].a} b={legs.saff[1].b} u={legDraw} color={C.saffronDeep} width={8} dash="18 12" opacity={legOp} />}
      {/* V2.4 the candidate arc: dashed, centred on the wall spot (a constraint, not light) */}
      {arcT > 0 && <CandidateArc asGroup center={W1} r={R1} toPx={P} t={arcT} a0={0} a1={ARC_A1} tone="blue" width={7} dashArray="20 13" />}
      {/* the compass arm: the arc is swept about the wall spot (it pivots at W1), gone once the "?" is up */}
      {armOp > 0 && (
        <path d={`M ${f2(P(W1).x)} ${f2(P(W1).y)} L ${f2(armTip.x)} ${f2(armTip.y)}`} stroke={C.blueDeep} strokeWidth={4} strokeLinecap="round" opacity={f2(armOp * 0.85)} />
      )}
    </g>
  );

  const over = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GuesserToken asGroup x={tokH.x} y={tokH.y} size={0.52 * m.k} facing={200} />
      <BounceRing p={tokH} t={hitRing} color={C.saffronDeep} r0={0.3 * m.k} r1={0.3 * m.k + 50} />
      <SensorTop asGroup x={sTop.x} y={sTop.y} size={0.22 * m.k} facing={facing} firing={race ? tw(g, RACE0 - 2, 2, E.linear) * (1 - tw(g, RACE0 + 3, 6, E.linear)) : 0} />
      {spotOut > 0 && (
        <g opacity={spotOut < 1 ? f2(spotOut) : undefined}>
          <WallSpot p={P(W1)} pop={spotPop} lit={spotLit} glow={spotGlow} size={17} />
        </g>
      )}
      {race && (
        <>
          <BounceRing p={P(W1)} t={homeRing(F_W1)} color={C.saffronDeep} />
          <BounceRing p={legs.teal[1].b} t={homeRing(F_TEAL_HOME)} color={C.tealDeep} r0={12} r1={44} />
          <BounceRing p={legs.saff[3].b} t={homeRing(LONG_END)} color={C.saffronDeep} r0={12} r1={44} />
        </>
      )}
    </svg>
  );

  // the chip is screen-fixed: it leaves as the push starts (the plan's own content flies off with the push)
  const chipOp = v24 ? tw(g, LENS1 - 2, 4, E.linear) * (1 - tw(g, PUSH0, 8, E.linear)) : 1 - tw(g, RISE0, 6, E.linear);
  const shortT = !v24 ? tw(g, SHORT_LBL, 6, E.linear) * (1 - tw(g, RISE0 - 2, 6, E.linear)) : 0;
  const longT = !v24 ? tw(g, LONG_LBL, 6, E.linear) * (1 - tw(g, RISE0 - 2, 6, E.linear)) : 0;
  const LBL = labelSpots();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage m={m} floor={floor} over={over} grain={v24 && g >= PUSH0 ? GRAIN : undefined} />
      {shortT > 0 && (
        <TeachLabel x={LBL.short.x} y={LBL.short.y} anchor="end" opacity={shortT} color={C.tealDeep}>
          short trip
        </TeachLabel>
      )}
      {longT > 0 && (
        <TeachLabel x={LBL.long.x} y={LBL.long.y} anchor="start" opacity={longT}>
          long way round
        </TeachLabel>
      )}
      {qT > 0 && (
        <>
          {/* the arc's stopped tip resolves into a "?" marker: a cream disc on the arc end, the "?" (72) in it */}
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={qT}>
            <circle cx={f2(arcEnd.x)} cy={f2(arcEnd.y)} r={Q_R} fill={C.cream} stroke={C.blueDeep} strokeWidth={5} />
          </svg>
          <Label x={arcEnd.x} y={arcEnd.y} size={72} font="display" anchor="middle" valign="middle" opacity={qT} color={C.ink} halo={false}>
            ?
          </Label>
        </>
      )}
      {chipOp > 0 && <Chip x={1790} y={92} anchor="end" valign="middle" size={CHIP_PX} opacity={chipOp}>illustration</Chip>}
    </AbsoluteFill>
  );
};

/** Integrity chips ("illustration", "invisible flash · shown for clarity"): 40 px so they read at phone width (v2 review
 *  r1, V2-R1-14; the kit's evidence-card tag is 40 px too, and "illustration" sits in that tag's slot). */
const CHIP_PX = 40;

/** The "?" marker's disc radius (px): it sits on the arc's stopped tip. */
const Q_R = 48;

/** Label anchors in the teaching framing (screen px; the race only runs there). */
const labelSpots = () => {
  const P = planToPx(MAP_T);
  const w = P(W1);
  return {short: {x: w.x - 44, y: w.y + 250}, long: {x: P(H).x + 50, y: w.y + 215}};
};

/* ================================================================== V2.2 the timeline, V2.3 the close-up */

const TimelineShot: React.FC<{g: number}> = ({g}) => {
  const pl = tlPlaceAt(g);
  const full = g >= RISE0 + RISE_DUR && g < SHRINK0;
  // V2.1: the small card fades in at its settled place (it used to slide up through the caption band; V2-R1-20)
  const fadeIn = g < RISE0 ? tw(g, TL_IN, TL_IN_DUR, E.linear) : 1;
  return <ArrivalTimeline {...pl} {...tlProps(g)} bg={full ? true : 'card'} opacity={fadeIn < 1 ? fadeIn : undefined} />;
};

const CloseShot: React.FC<{g: number}> = ({g}) => {
  // the display: the timeline in miniature once the shrink has landed (before that the shrinking card is on top)
  const landed = g >= SHRINK0 + SHRINK_DUR;
  // once in the display, the miniature sheds its words (illegible at that size, and they would sit beside the two
  // close-up labels and the chip): a cross-fade over the same chart drawn without them, so the shapes never move
  const bare = tw(g, DISP_BARE0, DISP_BARE_DUR, E.linear);
  const mitt = tw(g, TAP - MITT_IN, MITT_IN, E.inOut) * (1 - tw(g, MITT_OUT0, 18, E.inOut));
  const press = g >= TAP && g < TAP + 6 ? Math.sin(((g - TAP) / 6) * Math.PI) : 0;
  const run = tw(g, FIRE, 3, E.linear) * (1 - tw(g, RETURN_END, 4, E.linear));
  const hand = 0.82 * clamp01((g - FIRE) / (RETURN_END - FIRE));
  const firing = g >= FIRE - 2 ? tw(g, FIRE - 2, 2, E.linear) * (1 - tw(g, FIRE + 4, 8, E.linear)) : 0;
  const flashOut = g >= FIRE ? (g - FIRE) / FLASH_OUT_DUR : -1;
  const flashBack = g >= FLASH_BACK0 ? (g - FLASH_BACK0) / (RETURN_END - FLASH_BACK0) : -1;
  const receive = tw(g, RETURN_END - 1, 2, E.linear) * (1 - tw(g, RETURN_END + 4, 10, E.linear));
  const lensOut = 1 - tw(g, LENS0, 6, E.linear);
  const tofT = tw(g, TOF_LBL, 6, E.linear) * lensOut;
  const tripT = tw(g, TRIP_LBL, 6, E.linear) * lensOut;
  const chipT = tw(g, CHIP_IN, 6, E.linear) * lensOut;
  return (
    <AbsoluteFill style={{background: PAINT}}>
      <SensorClose
        display={
          landed ? (
            <>
              <ArrivalTimeline {...TL_DISP} {...tlProps(g)} labels={0} notToScale={0} bracketLabel="" bg="card" />
              {bare < 1 && <ArrivalTimeline {...TL_DISP} {...tlProps(g)} bg="card" opacity={1 - bare} />}
            </>
          ) : null
        }
        displayLit={1 - 0.35 * press}
        hand={hand}
        running={run}
        firing={firing}
        flashOut={flashOut > 1 ? -1 : flashOut}
        flashBack={flashBack > 1 ? -1 : flashBack}
        receive={receive}
        mitt={mitt}
        press={press}
      />
      {tofT > 0 && (
        <TeachLabel x={96} y={TOF.y} opacity={tofT}>
          time-of-flight sensor
        </TeachLabel>
      )}
      {tripT > 0 && (
        <SubLabel x={96} y={TOF.y + 74} size={40} opacity={tripT}>
          {"times its own light's round trip"}
        </SubLabel>
      )}
      {chipT > 0 && <Chip x={LENS.emitter.x - 40} y={140} anchor="end" valign="middle" size={CHIP_PX} opacity={chipT}>invisible flash · shown for clarity</Chip>}
    </AbsoluteFill>
  );
};
const TOF = {y: 470};

/* ================================================================== the scene */

export const V2LongWay: React.FC = () => {
  const g = useG();
  if (g >= FLAT0)
    return (
      <AbsoluteFill style={{background: PAINT}}>
        <PaintGrain />
      </AbsoluteFill>
    );
  if (g >= LENS1) return <PlanShot g={g} v24 />;
  if (g >= LENS0) {
    // push through the emitter lens: the close-up zooms about the lens, the plan opens inside it
    const u = tw(g, LENS0, LENS1 - LENS0, E.linear);
    const z = Math.pow(LENS_ZOOM, E.in(u));
    const c = LENS.emitter;
    // the opening starts as the emitter rim itself (zoomed) and grows into the whole frame, turning from the rim's
    // flat ellipse into a circle as it goes
    const v = clamp01((u - 0.3) / 0.7);
    const rx = v <= 0 ? 0 : Math.max(CLOSE.emitter.rx * z, 1500 * E.in(v));
    const ry = rx * lerp(CLOSE.emitter.ry / CLOSE.emitter.rx, 1, E.inOut(v));
    const r = rx;
    return (
      <AbsoluteFill style={{background: PAINT}}>
        <AbsoluteFill style={{transform: `scale(${f2(z * 1000) / 1000})`, transformOrigin: `${c.x}px ${c.y}px`}}>
          <CloseShot g={g} />
        </AbsoluteFill>
        {r > 0.5 && (
          <AbsoluteFill style={{clipPath: `ellipse(${f2(rx)}px ${f2(ry)}px at ${c.x}px ${c.y}px)`}}>
            <PlanShot g={g} v24 />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }
  if (g >= SHRINK0) {
    // the timeline shrinks into the sensor's display (the close-up behind it)
    return (
      <AbsoluteFill>
        <CloseShot g={g} />
        {g < SHRINK0 + SHRINK_DUR && <TimelineShot g={g} />}
      </AbsoluteFill>
    );
  }
  if (g >= RISE0 + RISE_DUR) return <TimelineShot g={g} />;
  return (
    <AbsoluteFill>
      <PlanShot g={g} v24={false} />
      {g >= TL_IN && <TimelineShot g={g} />}
      <RaceDots g={g} />
    </AbsoluteFill>
  );
};

/* ================================================================== module-load checks (they throw) */

export const V2_CHECKS = (() => {
  const fail = (m: string) => {
    throw new Error(`V2: ${m}`);
  };
  // light: every leg straight, none crosses the partition (10 cm clearance), in plan
  assertPath(LONG, OLAYOUT, 0.1);
  assertPath(SHORT, OLAYOUT, 0.1);
  // the race reads as "later": the teal pulse is home before the saffron one has even reached him
  if (!(F_TEAL_HOME < F_H)) fail('the short trip must be home before the long one reaches him');
  if (RF0 + RF_DUR > RACE0 - 4) fail('the reframe must settle before the pulses leave');
  if (TEAL_LAND > RISE0 - 4 || SAFF_LAND > RISE0 + 2) fail('both echoes must have landed by the rise');
  if (SHRINK0 + SHRINK_DUR > K.tof) fail('the display must be in before "time-of-flight"');
  if (DISP_BARE0 + DISP_BARE_DUR > K.tof) fail('the display must have shed its words before "time-of-flight sensor" cuts in');
  if (LENS0 < RETURN_END + 2) fail('the push through the lens starts before the flash is home');
  if (PUSH0 < Q0 + 10) fail('the "?" must hold before the push');
  if (FLAT0 !== K.end - 4) fail('the flat paint must be the last 4 frames');
  if (DISP_BARE_DUR < 3) fail('the display has no time to shed its words before "time-of-flight sensor"');
  // V2-R1-02: the paint first fills the frame ON FLAT0 (4 frames before the cut), not before: on the last moving frame
  // the strip's edges are still in frame (a band of at least 8 px of non-paint), on FLAT0 they are off screen
  const strip = (g: number) => {
    const P = planToPx(planMapAt(g));
    return {top: P({x: W1.x, z: -WALL_T}).y, bot: P({x: W1.x, z: 0}).y};
  };
  const sLast = strip(FLAT0 - 1);
  const sEnd = strip(FLAT0);
  if (!(sLast.top > 8 || sLast.bot < 1072)) fail(`the paint already fills the frame before FLAT0 (${sLast.top.toFixed(0)}..${sLast.bot.toFixed(0)})`);
  if (sEnd.top > -4 || sEnd.bot < 1084) fail(`the paint does not fill the frame on FLAT0 (${sEnd.top.toFixed(0)}..${sEnd.bot.toFixed(0)})`);
  for (let g = PUSH0; g < FLAT0; g++) {
    const st = strip(g);
    if (!(st.top > 0 || st.bot < 1080)) fail(`the paint fills the frame at ${g}, before FLAT0`);
  }
  // the push lands on the hand-off framing exactly (so FLAT0's PaintGrain frame continues the push's last frame)
  {
    const m = planMapAt(FLAT0);
    if (Math.abs(m.k - K_END) > 1e-6 || Math.hypot(planToPx(m)(PAINT_PT).x - 960, planToPx(m)(PAINT_PT).y - 540) > 0.01) fail('the push does not land on the hand-off framing');
  }
  if (SPOT_OUT0 + SPOT_OUT_DUR > FLAT0 - 2) fail('W1\'s marker must be gone before the last moving frame');
  // the push flies the plan's content off the frame: on the last moving frame nothing but the wall strip (paint, grain,
  // its ink edges) and the floor beyond it is on screen (the "?" disc, the arc, the token, the sensor glyph, the
  // partition's end; W1's marker and glow have faded)
  const mEnd = planMapAt(FLAT0 - 1);
  {
    const P = planToPx(mEnd);
    const off = (p: {x: number; y: number}, r: number) => p.x + r < 0 || p.x - r > 1920 || p.y + r < 0 || p.y - r > 1080;
    const items: [string, P2, number][] = [
      ['"?" marker', polar(W1, R1, ARC_A1), Q_R + 4],
      ['token', H, 0.4 * mEnd.k],
      ['sensor glyph', S, 0.2 * mEnd.k],
      ['partition end', {x: OLAYOUT.occluder.x, z: OLAYOUT.occluder.z0}, 0.1 * mEnd.k],
    ];
    for (let a = 0; a <= ARC_A1 + 1e-9; a += 0.01) items.push([`arc ${((a * 180) / Math.PI).toFixed(0)}°`, polar(W1, R1, a), 8]);
    for (const [n, p, r] of items) if (!off(P(p), r)) fail(`${n} is still on screen on the last pushed frame`);
  }
  // the compass arm is never drawn across the partition: every angle it shows at clears the occluder
  for (let a = 0; a <= ARM_FADE[1] + 1e-9; a += 0.01) {
    try {
      assertPath([W1, polar(W1, R1, a)], OLAYOUT, 0.02);
    } catch {
      fail(`the compass arm would cross the partition at ${((a * 180) / Math.PI).toFixed(0)}°`);
    }
  }
  // the candidate arc's end ("?") stays on the hidden side, in the safe area
  const qEnd = polar(W1, R1, ARC_A1);
  if (qEnd.x <= OLAYOUT.occluder.x) fail('the "?" would sit on the sensor side');
  const qPx = planToPx(MAP_T)(qEnd);
  const qb = {x0: qPx.x - Q_R, x1: qPx.x + Q_R, y0: qPx.y - Q_R, y1: qPx.y + Q_R};
  if (qPx.x - Q_R < planToPx(MAP_T)({x: OLAYOUT.occluder.x + OLAYOUT.occluder.thickness / 2, z: 0}).x + 8) fail('the "?" marker touches the partition');
  // measured text (browser only: tools that load the cue sheets run in Node)
  if (typeof document !== 'undefined') {
    const L = labelSpots();
    const boxes: [string, {x0: number; x1: number; y0: number; y1: number}][] = [
      ['?', qb],
      ['short trip', labelBox('short trip', L.short.x, L.short.y, 64, 'end')],
      ['long way round', labelBox('long way round', L.long.x, L.long.y, 64, 'start')],
      ['time-of-flight sensor', labelBox('time-of-flight sensor', 96, TOF.y, 64, 'start')],
      ["times its own light's round trip", labelBox("times its own light's round trip", 96, TOF.y + 74, 40, 'start')],
    ];
    for (const [n, b] of boxes) if (b.x0 < 96 || b.x1 > 1824 || b.y0 < 54 || b.y1 > 950) fail(`label "${n}" leaves the safe area`);
    // the close-up labels clear the box
    if (labelBox('time-of-flight sensor', 96, TOF.y, 64, 'start').x1 > CLOSE.box.x0 - 16) fail('"time-of-flight sensor" runs into the sensor');
  }
  // the mini timeline sits under the plan's sensor, clear of the caption band
  if (TL_MINI.y + TL_GEOM.card.y1 * TL_MINI.layoutScale > 950) fail('the mini timeline reaches the caption band');
  return {
    match: V2_MATCH,
    race: {start: RACE0, w1: F_W1, tealHome: F_TEAL_HOME, him: F_H, longHome: LONG_END},
    lens: [LENS0, LENS1],
    push: [PUSH0, PUSH1],
    flat: [FLAT0, K.end - 1],
    stripLastMoving: sLast,
    stripFlat0: sEnd,
    timeline: {tlIn: TL_IN, rise: [RISE0, RISE0 + RISE_DUR], bracket: BRACKET0, shrink: [SHRINK0, SHRINK0 + SHRINK_DUR], bare: [DISP_BARE0, DISP_BARE0 + DISP_BARE_DUR]},
    spikeMini: SPIKE_MINI,
    bumpMini: BUMP_MINI,
    displayH: DISPLAY_H,
  };
})();
