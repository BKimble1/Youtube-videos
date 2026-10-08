import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SOFT, SNAP, camPath, hop, ring, sp, tw} from '../lib/motion';
import {CAM_RAISED, CAM_ROOM, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, depthSort, projectWith, rigAt, rigStyle, tiltAt, viewAt, type ViewState} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, confocalPath, layoutPoints, pathLength, pathSchedule, scatterDirections, sub, timeNs, type P2} from '../lib/optics';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {LightPath, ScatterFan, type ToPx} from '../components/v02/Optics';
import {
  ARMS,
  Character2,
  EXPR,
  HANDS_ON_HIPS,
  IDLE2,
  SNEAK_ARMS,
  eyesWorld,
  mixPose2,
  planTrip,
  reach2,
  settleAt,
  settlePose,
  tripContacts,
  tripDistance,
  tripDuration,
  tripPose,
  withPose,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {HandheldSensor, SENSOR} from '../components/v02/HandheldSensor';
import {SensorStand, standGeometry} from '../components/v02/S1_SensorStand';
import {BOARD_FRAMES, BoardCard, CARD, PLOT_CENTRE, TrackingBoard, type BoardT} from '../components/v02/S1_TrackingBoard';
import {ArrivalRace, MiniTrackScreen, NSS, RulerCard, SpinningQuestion, Stopwatch, Webcam} from '../components/v02/S1_Props';
import {reachLocal} from '../components/Character';

/**
 * S1 · Cold open: the impossible view (s01–s08). Storyboard shots S1.1–S1.7.
 *
 *  S1.1 s01  locked wide room view: the guesser tiptoes in from the right and settles smug behind the partition
 *            (RUNWAY R1 = the sneak, static start/end poses); the checker's dashed sight line stops at the partition.
 *  S1.2 s02  push 8 % toward the sensor on its tripod; the checker taps it on ("sensor"), the readout lights; a pale
 *            field-of-view fan lights a patch of the blank wall ("pointed at a plain, blank wall").
 *  S1.3 s03  the readout swings up into the full-screen evidence board ("And yet"): the authors' released tracking
 *            data, mirrored to match our room, the estimated position stepping through the 475 frames; cut back:
 *            the guesser freezes mid-smirk.
 *  S1.4 s04  the camera rises to RAISED_TILT / CAM_RAISED; a ghost straight line from the sensor stops at the
 *            partition ("blocked"); the opening between the partition's far end and the wall is marked ("gap") and the
 *            route round the end of the partition, via the wall, draws on through it.
 *  S1.5 s05  a slowed pulse travels S -> W -> H -> W -> S (one wall sample, chosen and asserted below), scatter fans
 *            at the wall and at him, later legs thinner and paler.
 *  S1.6 s06-07 pan to make room; two pulses race: the quick wall echo lands first on a mini arrival timeline, the
 *            roundabout one ~7 ns later (illustrative). A webcam tries to time it and shrugs; the sensor close-up
 *            replaces it: "time-of-flight sensor: times its own light's round trip".
 *  S1.7 s08  a light ruler: 1 nanosecond ≈ 30 cm ≈ 1 ft; the extra delay becomes an extra distance: the detour
 *            wall spot -> him -> wall spot, ticked every nanosecond of path; he glances at the wall, uneasy.
 *
 * Every beat is cued from narration words (K below); gaps are clamped so the scene survives ±20 % timing changes.
 */

/* ================================================================== cues (narration words) */

const SC = scene('S1');
const K = {
  start: SC.from,
  end: SC.to,
  // s01
  hiding: at('s01', 'hiding'),
  behind: at('s01', 'behind'),
  he1: at('s01', 'he'),
  pleased: at('s01', 'pleased'),
  s01End: segEnd('s01'),
  // s02
  s02: seg('s02').from,
  sensor2: at('s02', 'sensor'),
  him2: at('s02', 'him'),
  pointed: at('s02', 'pointed'),
  plain: at('s02', 'plain'),
  blank: at('s02', 'blank'),
  s02End: segEnd('s02'),
  // s03
  and3: at('s03', 'and'),
  this3: at('s03', 'this'),
  data: at('s03', 'data'),
  published: at('s03', 'published'),
  y2026: at('s03', '2026'),
  seen: at('s03', 'seen'),
  small: at('s03', 'small'),
  sensor3: at('s03', 'sensor'),
  aimed: at('s03', 'aimed'),
  tracking: at('s03', 'tracking'),
  never: at('s03', 'never'),
  directly: at('s03', 'directly'),
  s03End: segEnd('s03'),
  // s04
  s04: seg('s04').from,
  corners: at('s04', 'corners'),
  light4: at('s04', 'light'),
  through: at('s04', 'through'),
  around: at('s04', 'around', 2),
  wall4: at('s04', 'wall'),
  s04End: segEnd('s04'),
  // s05
  s05: seg('s05').from,
  fires: at('s05', 'fires'),
  flash: at('s05', 'flash'),
  sensor5: at('s05', 'sensor', 2),
  s05End: segEnd('s05'),
  // s06
  s06: seg('s06').from,
  trip6: at('s06', 'trip'),
  later6: at('s06', 'later'),
  billionths: at('s06', 'billionths'),
  s06End: segEnd('s06'),
  // s07
  s07: seg('s07').from,
  webcam: at('s07', 'webcam'),
  time7: at('s07', 'time'),
  that7: at('s07', 'that'),
  this7: at('s07', 'this'),
  tof: at('s07', 'time-of-flight'),
  clocks: at('s07', 'clocks'),
  round: at('s07', 'round'),
  trip7: at('s07', 'trip'),
  s07End: segEnd('s07'),
  // s08
  s08: seg('s08').from,
  light8: at('s08', 'light'),
  thirty: at('s08', 'thirty'),
  nanosecond: at('s08', 'nanosecond'),
  so8: at('s08', 'so'),
  timing: at('s08', 'timing'),
  distance: at('s08', 'distance'),
  extra: at('s08', 'extra'),
  clue: at('s08', 'clue'),
  where: at('s08', 'where'),
  s08End: segEnd('s08'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== geometry */

const SENSOR_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;

// Partition side face (the camera-facing long face, with the arched panel tops of components/v02/Partition), world px.
const ARCH = 0.09;
const FOOT_H = 0.07;
const topH = (z: number) => {
  const Lp = (OCC.z1 - OCC.z0) / 3;
  const v = (z - OCC.z0) / Lp;
  const u = clamp01(v - Math.floor(Math.min(2.9999, v)));
  return OCC.height - ARCH * (1 - Math.sin(Math.PI * u));
};
const faceX = OCC.x - OCC.thickness / 2;
const facePoly = (s: ViewState) => {
  const pts: {x: number; y: number}[] = [];
  for (let k = 0; k <= 40; k++) {
    const z = OCC.z0 + ((OCC.z1 - OCC.z0) * k) / 40;
    pts.push(projectWith(s, {x: faceX, z, h: topH(z)}));
  }
  pts.push(projectWith(s, {x: faceX, z: OCC.z1, h: FOOT_H}), projectWith(s, {x: faceX, z: OCC.z0, h: FOOT_H}));
  return pts;
};
const inPoly = (poly: {x: number; y: number}[], q: {x: number; y: number}) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const segDist = (q: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const u = clamp01(((q.x - a.x) * dx + (q.y - a.y) * dy) / l2);
  return Math.hypot(q.x - a.x - u * dx, q.y - a.y - u * dy);
};

/**
 * The wall sample whose round trip reads cleanly in the raised room view: in plan the legs must clear the partition
 * (assertPath), and on screen at RAISED_TILT / CAM_RAISED every point of S -> W and W -> H must stay outside the
 * partition's drawn silhouette by at least MIN_CLEAR_PX (so the W -> H leg is seen passing the partition's far end at
 * the gap by the wall, never through or over the screen). W3 is tried first: its echo delay is the ~7 ns the
 * storyboard labels. Throws if neither W3 nor W4 qualifies (a layout or framing change broke the shot).
 */
const MIN_CLEAR_PX = 18;
/** CAM_RAISED tilted down a little: at RAISED_TILT the rigs are still drawn at full height (lib/room figureMix), so
 *  the shared framing crops the hider's hair; same zoom (so the same 5 px outlines and clearances), centre 47 px up. */
const CAM_UP: Cam = {...CAM_RAISED, cy: CAM_RAISED.cy - 47};
const pickWall = () => {
  const s = viewAt(RAISED_TILT);
  const poly = facePoly(s);
  const report: string[] = [];
  for (const id of ['W3', 'W4']) {
    const w = W.find((p) => p.id === id)!;
    const path = confocalPath(S, w, H);
    assertPath(path, OLAYOUT);
    let minPx = Infinity;
    for (const [a, b] of [[S, w], [w, H]] as [P2, P2][]) {
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        const q = projectWith(s, {x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: SENSOR_H});
        if (inPoly(poly, q)) minPx = -1;
        else for (let k = 0; k < poly.length; k++) minPx = Math.min(minPx, segDist(q, poly[k], poly[(k + 1) % poly.length]) * CAM_RAISED.zoom);
      }
    }
    report.push(`${id}: ${minPx.toFixed(1)} px`);
    if (minPx >= MIN_CLEAR_PX) return {w, path, clearPx: minPx};
  }
  throw new Error(`S1: no wall sample with a clear raised-view path (${report.join(', ')})`);
};
const PICK = pickWall();
const WP = PICK.w; // the wall spot of S1.4-S1.7
const PATH = PICK.path; // S, W, H, W, S
const QUICK = [S, WP, S];
const LEN_LONG = pathLength(PATH);
const LEN_QUICK = pathLength(QUICK);
const NS_LONG = timeNs(LEN_LONG);
const NS_QUICK = timeNs(LEN_QUICK);

/* ================================================================== beats derived from the cues */

// S1.1 — the sneak (RUNWAY R1). The camera is locked; start and end poses are held still for STATIC frames.
const STATIC = 6;
const SNEAK_GO = K.start + STATIC;
const HX0 = 3.6; // he starts at the right of the room (plan x, m), tiptoes left to his spot H
const GU0 = rigAt(HX0, H.z, 0);
const GU1 = rigAt(H.x, H.z, 0);
const PLAN = planTrip(GU0.x - GU1.x, GU0.scale, 'tiptoe');
const FPS_STEP = clamp(Math.floor((K.behind - SNEAK_GO) / PLAN.steps), 9, 14);
const PULSE = 0.55;
const T_ARRIVE = SNEAK_GO + tripDuration(PLAN, FPS_STEP);
const SETTLE_AT = T_ARRIVE + 6;
const R1_FREEZE = SETTLE_AT + 26; // the end pose is held from here
/** Runway insert R1 (global frames): the sneak, from the static start pose to the static settled-smug pose. */
export const R1 = {from: K.start, to: R1_FREEZE + STATIC};
const STEPS_AT = tripContacts(SNEAK_GO, PLAN, FPS_STEP, PULSE);

// after R1: the checker glances; her sight line stops at the partition; his smug exhale
const GLANCE = R1.to + 2;
const SIGHT0 = GLANCE + 8;
const SIGHT_DUR = 14;
const EXHALE = Math.max(SIGHT0 + SIGHT_DUR + 4, K.pleased);
const SIGHT_OUT = K.s02 + 4;

// S1.2 — push, tap, readout on, field of view on the wall
const PUSH0 = K.s02;
const PUSH_DUR = clamp(K.pointed - K.s02 - 6, 24, 50);
const TAP = K.sensor2 + 3; // her hand meets the sensor
const FOV0 = K.pointed;
const PATCH0 = K.plain;

// S1.3 — the board
const SWING0 = K.and3;
const SWING = clamp(K.this3 - K.and3 + 2, 10, 16);
const LAND = SWING0 + SWING;
const REPLAY0 = Math.max(LAND + 14, K.this3);
const REPLAY1 = Math.max(REPLAY0 + 120, K.directly);
const BOARD_PUSH0 = K.y2026;
const BOARD_PUSH1 = Math.max(BOARD_PUSH0 + 24, K.small - 8);
const CUT = Math.max(K.directly + 14, K.s03End - 2); // hard cut back to the room
// he buffs his nails long enough to read (~0.45 s), then freezes mid-smirk well before s04 starts
const FREEZE = CUT + clamp(K.s04 - CUT - 14, 7, 14);

// S1.4 — rise, blocked line, route round the end
const RISE0 = K.s04 + 2;
const RISE_DUR = clamp(K.corners - RISE0 - 2, 34, 56);
const LINE0 = K.light4;
const CONTACT = Math.max(LINE0 + 12, K.through + 4);
const RELIEF = CONTACT + 8;
const ROUTE0 = K.around;
const ROUTE1 = Math.max(ROUTE0 + 30, K.wall4 + 4);
const WORRY = ROUTE0 + 12;

// S1.5 — the slowed pulse
const CHIPS0 = K.fires - 2;
const PULSE0 = K.flash + 2;
const PULSE1 = Math.max(PULSE0 + 90, K.sensor5 + 2);
const SCHED = pathSchedule(PATH, {start: PULSE0, dur: PULSE1 - PULSE0});
const VF = SCHED.vertexFrames; // S, W, H, W, S
const TRAIL_OUT = K.s06 + 4;

// S1.6 — pan, race, timeline
const CAM_SIDE: Cam = {cx: CAM_UP.cx - 280, cy: CAM_UP.cy, zoom: CAM_UP.zoom};
const PAN0 = K.s06;
const PAN_DUR = 28;
const RACE_CARD0 = PAN0 + PAN_DUR - 4; // after the pan has made room
const RACE0 = Math.max(PAN0 + PAN_DUR + 2, K.trip6 + 4);
const RACE_LONG_END = Math.max(RACE0 + 70, K.later6);
const RACE_SCHED = pathSchedule(PATH, {start: RACE0, dur: RACE_LONG_END - RACE0});
const QUICK_SCHED = pathSchedule(QUICK, {start: RACE0, dur: (RACE_LONG_END - RACE0) * (LEN_QUICK / LEN_LONG)});
const BRACKET0 = K.billionths;
const RACE_FADE = K.s07 + 6;

// S1.6 (s07) — webcam, then the sensor close-up
const CAMI0 = K.webcam - 6;
const Q0 = K.time7 - 4;
const SHRUG = K.that7;
const CAMI_SWAP = Math.max(SHRUG + 12, K.this7 - 2);
const TOF_LABEL = K.tof;
const RT0 = K.round - 4; // the close-up's little round trip
const INSET_OUT = K.s07End + 2;

// S1.7 — the ruler
const RULER0 = K.light8;
const RULER_PULSE0 = K.thirty - 6;
const RULER_PULSE1 = Math.max(RULER_PULSE0 + 30, K.nanosecond + 10);
const TAPE0 = K.timing;
const TAPE1 = Math.max(TAPE0 + 24, K.distance + 8);
const EXTRA0 = K.extra;
const UNEASY = K.where + 2;

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2},
  ...STEPS_AT.map((f, i) => ({f, kind: 'tiptoe_step' as const, pitch: [0, -1, 1, -0.5, 0.5, -1.5][i % 6], gain: i === STEPS_AT.length - 1 ? -4 : -1 - (i % 2)})),
  {f: T_ARRIVE + 2, kind: 'cloth_rustle', gain: -6},
  {f: EXHALE + 3, kind: 'smug_exhale'},
  {f: TAP, kind: 'readout_beep'},
  {f: TAP + 2, kind: 'sensor_hum', dur: 3.2, gain: -8},
  {f: LAND, kind: 'paper_slap'},
  {f: FREEZE, kind: 'uh_oh'},
  {f: CONTACT, kind: 'partition_thunk'},
  {f: CONTACT + 3, kind: 'partition_wobble', gain: -8},
  {f: PULSE0, kind: 'sensor_pulse'},
  {f: Math.round(VF[1]), kind: 'bounce_tick', pitch: 2},
  {f: Math.round(VF[2]), kind: 'bounce_tick', pitch: -2, gain: -3},
  {f: Math.round(VF[3]), kind: 'bounce_tick', pitch: 3, gain: -7},
  {f: Math.round(VF[4]), kind: 'echo_return'},
  {f: RACE0, kind: 'sensor_pulse', gain: -3, pitch: 1},
  {f: Math.round(QUICK_SCHED.end), kind: 'block_drop'},
  {f: Math.round(RACE_SCHED.end), kind: 'block_drop', pitch: -3, gain: -5},
  {f: CAMI0 + 4, kind: 'pop_tick', gain: -4},
  {f: SHRUG, kind: 'indicator_no'},
  {f: CAMI_SWAP + 4, kind: 'card_flick', gain: -4},
  {f: RT0 + 18, kind: 'readout_beep', pitch: 2, gain: -3},
  {f: RULER0 + 2, kind: 'ruler_extend', dur: 0.8, gain: -4},
  {f: TAPE0, kind: 'ruler_extend', dur: (TAPE1 - TAPE0) / 30, gain: -3, pitch: -2},
  {f: UNEASY, kind: 'cloth_rustle', gain: -8},
];

/* ================================================================== helpers */

const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/** Room-view mapping for a plan point at the light paths' height (the 2D model's plane, h = sensor height). */
const roomToPx = (s: ViewState): ToPx => (p) => {
  const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
  return {x: q.x, y: q.y};
};

/** Sensor readout bars for the race: the wall echo bin and the later, weaker bump (illustrative). */
const RACE_BARS = (() => {
  const n = 12;
  const span = NS_LONG * 1.12;
  const q = Math.floor((NS_QUICK / span) * n);
  const l = Math.floor((NS_LONG / span) * n);
  return Array.from({length: n}, (_, i) => (i === q ? 1 : i === q + 1 ? 0.45 : i === q + 2 ? 0.16 : i === l ? 0.3 : i === l - 1 ? 0.12 : 0.05));
})();
const RACE_BUMP = Math.floor((NS_LONG / (NS_LONG * 1.12)) * 12) - 1;

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

/** Sort depth of the sensor stand: in front of the checker at every tilt the scene uses (asserted below). */
const STAND_SORT_Z = LAYOUT.operator.z + 0.2;
(() => {
  for (const tilt of [0, RAISED_TILT * 0.25, RAISED_TILT * 0.5, RAISED_TILT * 0.75, RAISED_TILT]) {
    const order = depthSort(
      [
        {key: 'stand', x: PTS.S.x, z: STAND_SORT_Z, w: 0.17, height: 1.4},
        {key: 'checker', x: LAYOUT.operator.x, z: LAYOUT.operator.z, w: 0.3},
      ],
      tilt,
    ).map((it) => it.key);
    if (order[0] !== 'checker') throw new Error(`S1: the sensor stand would be painted behind the checker at tilt ${tilt}`);
  }
})();

/** Frame used for everything in the room during R1: frozen in the static windows (bit-identical frames). */
const roomFrame = (g: number) => (g < SNEAK_GO ? SNEAK_GO : g >= R1_FREEZE && g < R1.to ? R1_FREEZE : g);

const sneakFace: Partial<Pose2> = {lid: 0.22, brows: -0.4, browAsym: 0.2, mouth: 'hmm', lookX: -0.75, lookY: 0.05, tilt: 4};

const guesserState = (g: number, tilt: number) => {
  const gr = roomFrame(g);
  // --- R1: tiptoe from HX0 to H, settle smug
  const dist = tripDistance(gr, SNEAK_GO, PLAN, FPS_STEP, PULSE);
  let pose: Pose2 = tripPose(dist, PLAN, {dir: -1, base: {...SNEAK_ARMS, ...sneakFace}});
  const smugBase: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lookX: -0.35, ...settleAt(gr, SETTLE_AT, -1)});
  const arrive = tw(gr, T_ARRIVE - 3, 16, E.inOut);
  if (arrive > 0) pose = mixPose2(pose, smugBase, arrive);
  const planX = HX0 - (dist / (GU0.x - GU1.x)) * (HX0 - H.x);

  // --- after R1: smug exhale on "pleased" (eyes close, chin up, chest rises then sinks)
  const ex = pulseAt(g, EXHALE, 28);
  if (ex > 0) {
    const u = clamp01((g - EXHALE) / 28);
    pose = {...pose, lid: lerp(pose.lid ?? 0.5, 0.95, ex), tilt: pose.tilt + 6 * ex, mouth: 'smirk', hunch: (pose.hunch ?? 0) - 0.04 * Math.sin(Math.PI * Math.min(1, u * 1.6)) + 0.025 * Math.max(0, Math.sin(Math.PI * (u * 1.6 - 0.6)))};
  }
  // "can't see him": a smug eyebrow wiggle
  const wig = pulseAt(g, K.him2, 14);
  if (wig > 0) pose = {...pose, browAsym: (pose.browAsym ?? 0) + 0.5 * wig, brows: pose.brows + 0.2 * wig};

  // --- cut-back: buffing his nails on his shirt, then he FREEZES mid-smirk
  if (g >= CUT) {
    const rub = g < FREEZE ? Math.sin((g - CUT) * 1.4) * 7 : Math.sin((FREEZE - CUT) * 1.4) * 7;
    const buff: Pose2 = {...withPose(HANDS_ON_HIPS, EXPR.smug), armR: reachLocal(-18 + rub, -238, 1, -1), armsFront: 'R', lookX: -0.15, lookY: 0.55, lid: 0.55, mouth: 'smirk', tilt: 6, ...settlePose(1, -1)};
    const kf = sp(g, FREEZE, SNAP);
    const frozen: Pose2 = {...buff, eyes: 1.22, pupil: 0.62, brows: 0.9, browAsym: 0, lid: 0, lookX: -0.55, lookY: -0.1, sweat: 1, mouth: 'smirk', tilt: 2};
    pose = g < FREEZE ? buff : mixPose2(buff, frozen, Math.min(1.05, kf));
    if (g >= FREEZE) pose = {...pose, bob: hop(g, FREEZE, 7, 6)};
    // s04: relief when the straight line is blocked; worry when the light goes round the end, via the wall
    const relief = tw(g, RELIEF, 14, E.inOut);
    if (relief > 0) {
      const smug2: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lookX: -0.45, ...settlePose(1, -1)});
      pose = mixPose2(pose, smug2, relief);
    }
    const worry = tw(g, WORRY, 12, E.inOut);
    if (worry > 0) {
      const wary: Pose2 = withPose(withPose(HANDS_ON_HIPS, {lid: 0.12, eyes: 1.08, brows: 0.45, browAsym: 0.2, mouth: 'hmm', lookX: -0.75, lookY: -0.65, tilt: -3}), settlePose(1, -1));
      pose = mixPose2(pose, wary, worry);
    }
    // s06: arms crossed, defensive, watching the timeline
    const cross = tw(g, K.s06 + 12, 16, E.inOut);
    if (cross > 0) {
      const crossed: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both', lid: 0.2, eyes: 1, brows: 0.2, browAsym: 0.3, mouth: 'flat', lookX: -0.85, lookY: -0.45, tilt: -2};
      pose = mixPose2(pose, crossed, cross);
    }
    // s08: "where he is": a glance at the wall, uneasy
    const un = tw(g, UNEASY, 10, E.inOut);
    if (un > 0) {
      pose = mixPose2(pose, {...pose, lookX: -0.7, lookY: -0.85, eyes: 1.12, brows: 0.6, browAsym: 0, mouth: 'hmm', sweat: 0.8, tilt: -5, hunch: 0.04}, un);
    }
  }
  // idle life: frozen in R1 (static windows), eases in afterwards; frozen again when he freezes (till relief)
  const lifeIn = tw(g, R1.to, 16, E.inOut);
  const lifeFreeze = g >= FREEZE ? 1 - tw(g, FREEZE, 4) + tw(g, RELIEF, 20) : 1;
  const life = 0.5 * lifeIn * clamp01(lifeFreeze);
  if (g < R1.to && (g < SNEAK_GO + 1 || g >= R1_FREEZE - 1)) pose = {...pose, blink: 1};
  if (g >= FREEZE && g < RELIEF) pose = {...pose, blink: 1};
  const place = rigAt(planX, H.z, tilt);
  return {pose, planX, place, life, frame: gr};
};

const checkerState = (g: number, tilt: number) => {
  const gr = roomFrame(g);
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const lifeIn = tw(g, R1.to, 16, E.inOut);
  const place: RigPlace = {x: op.x, y: op.y, scale: op.scale, frame: gr, seed: CHECKER_SEED, life: 0.35 * lifeIn};
  // where she looks: the readout (default), the guesser (after R1), the webcam, the sensor, the guesser again
  const atReadout = {lookX: 0.62, lookY: 0.32, tilt: 3};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: -1};
  const glance = Math.min(tw(g, GLANCE, 8, E.inOut), 1 - tw(g, K.s02 - 2, 10, E.inOut));
  const atCam = Math.min(tw(g, CAMI0 + 6, 8, E.inOut), 1 - tw(g, CAMI_SWAP, 8, E.inOut));
  const knowing = tw(g, K.clue, 10, E.inOut);
  const look = {
    lookX: atReadout.lookX + (atHim.lookX - atReadout.lookX) * Math.max(glance, knowing) + (-0.9 - atReadout.lookX) * atCam,
    lookY: atReadout.lookY + (atHim.lookY - atReadout.lookY) * Math.max(glance, knowing) + (0.4 - atReadout.lookY) * atCam,
    tilt: atReadout.tilt + (atHim.tilt - atReadout.tilt) * Math.max(glance, knowing),
  };
  // a raised brow when the echo comes back, and a knowing one at the end
  const brow = Math.max(sp(g, SCHED.end + 2, SNAP) * (1 - tw(g, SCHED.end + 34, 12)), 0.8 * knowing);
  let pose: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, ...look, brows: -0.05 + 0.35 * brow, browAsym: 0.45 * brow});
  // the tap: her right hand meets the side of the sensor box at TAP (anticipation, contact, release)
  const geo = standGeometry(tilt);
  const reachIn = tw(g, TAP - 10, 10, E.inOut);
  const reachOut = tw(g, TAP + 6, 12, E.inOut);
  const k = reachIn * (1 - reachOut);
  if (k > 0) {
    // her fingertips on the readout's buttons (right of the screen); the sensor sits right by her shoulder, so the arm
    // folds: take the IK solution with the elbow lower (the other one swings the elbow up across her face)
    const tgt = geo.at(SENSOR.screen.x0 + SENSOR.screen.w + 10, SENSOR.screen.y0 + SENSOR.screen.h * 0.62);
    const arms = ([1, -1] as const).map((e) => reach2(place, pose, 1, tgt.x, tgt.y, e));
    const armR = Math.cos((arms[0].a * Math.PI) / 180) >= Math.cos((arms[1].a * Math.PI) / 180) ? arms[0] : arms[1];
    pose = mixPose2(pose, {...pose, armR}, k);
  }
  if (g < R1.to && (g < SNEAK_GO + 1 || g >= R1_FREEZE - 1)) pose = {...pose, blink: 1};
  return {pose, place};
};

/* ================================================================== the room shot */

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const tilt = g < CUT ? 0 : RAISED_TILT * tiltAt(g, RISE0, RISE_DUR);
  const s = viewAt(tilt);
  const toPx = roomToPx(s);
  const cam: Cam =
    g < CUT
      ? camPath(g, CAM_ROOM, [{at: PUSH0, dur: PUSH_DUR, to: {cx: 852, cy: 498, zoom: CAM_ROOM.zoom * 1.08}}])
      : camPath(g, CAM_ROOM, [
          {at: RISE0, dur: RISE_DUR, to: CAM_UP},
          {at: PAN0, dur: PAN_DUR, to: CAM_SIDE},
        ]);
  const wobble = 0.35 * ring(g, CONTACT, 0.75, 0.16);

  /* ---- people and the stand */
  const gu = guesserState(g, tilt);
  const ch = checkerState(g, tilt);
  const geo = standGeometry(tilt);

  /* ---- sensor readout */
  const tapOn = g >= TAP ? (g < TAP + 4 ? (Math.floor(g - TAP) % 2 === 0 ? 1 : 0.3) : 1) : 0;
  const trackIdx = (roomFrame(g) - TAP) * 1.4 + 20;
  let readout: {screen?: React.ReactNode; reveal?: number; bars?: number[]; bumpFrom?: number; bumpHighlight?: number} = {
    screen: <MiniTrackScreen w={SENSOR.screen.w} h={SENSOR.screen.h} idx={trackIdx} on={tapOn} />,
  };
  if (g >= CUT) {
    if (g < RACE0 - 4) readout = {reveal: clamp01(SCHED.progress(g)) * (g >= PULSE0 ? 1 : 0), bumpHighlight: sp(g, SCHED.end, SNAP) * (1 - tw(g, SCHED.end + 40, 20)), bars: RACE_BARS, bumpFrom: RACE_BUMP};
    else if (g < CAMI_SWAP) readout = {reveal: RACE_SCHED.progress(g), bars: RACE_BARS, bumpFrom: RACE_BUMP, bumpHighlight: sp(g, RACE_SCHED.end, SNAP)};
    else if (g < INSET_OUT) readout = {screen: <StopwatchScreen g={g} />};
    else readout = {reveal: 1, bars: RACE_BARS, bumpFrom: RACE_BUMP, bumpHighlight: 0.6};
  }
  const charge = g >= K.fires && g < PULSE0 + 4 ? 0.35 + 0.65 * tw(g, PULSE0 - 6, 6) : 0;
  const firing = Math.max(charge * (g < PULSE0 + 2 ? 1 : 1 - tw(g, PULSE0 + 1, 4)), pulseAt(g, RACE0 - 3, 8), pulseAt(g, RT0, 8) * 0.6);
  const led = g < TAP ? 0.15 : 1;

  /* ---- light paths (S1.4-S1.6), drawn over the set; the partition hides what passes behind it */
  const poly = facePoly(s);
  const box = geo.box;
  const hidden = (p: P2) => {
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    if (p.x > faceX && inPoly(poly, q)) return true;
    if (Math.hypot(p.x - S.x, p.z - S.z) < 0.25 && q.x > box.x0 - 2 && q.x < box.x1 + 2 && q.y > box.y0 - 2 && q.y < box.y1 + 2) return true;
    return false;
  };

  // fan rays near the wall pass behind the two people: hide them inside each figure's (approximate) silhouette
  const rigHides = (pl: {x: number; y: number; scale: number}, q: {x: number; y: number}) => {
    const lx = (q.x - pl.x) / pl.scale;
    const ly = (q.y - pl.y) / pl.scale;
    if (((lx / 92) ** 2 + ((ly + 388) / 100) ** 2) < 1) return true; // head and hair
    if (Math.abs(lx) < 82 && ly > -300 && ly < -140) return true; // torso
    return Math.abs(lx) < 60 && ly >= -140 && ly < 0; // legs
  };
  const hiddenFan = (p: P2) => {
    if (hidden(p)) return true;
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    return (p.z < LAYOUT.operator.z && rigHides(ch.place, q)) || (p.z < H.z + 0.05 && rigHides(gu.place, q));
  };

  const items: RoomItem[] = [
    {
      key: 'checker',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={ch.pose} frame={ch.place.frame!} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} style={rigStyle(tilt, ch.place.scale)} />,
    },
    {
      key: 'stand',
      x: PTS.S.x,
      // Sort depth only (the stand is always drawn at S). Before the cut back from the board (tilt 0) the checker
      // paints over the stand, so her tapping hand lies on the readout; from the cut on (the switch is hidden by the
      // hard cut) the stand paints over her at every tilt: in the raised view her frontal cutout, wider than her body,
      // otherwise covered half the sensor that fires the pulse and is ringed in S1.6. (Asserted at module load.)
      z: g < CUT ? LAYOUT.operator.z + 0.04 : STAND_SORT_Z,
      w: 0.17,
      height: 1.4,
      node: <SensorStand tilt={tilt} sensor={{...readout, led, firing}} />,
    },
    {
      key: 'guesser',
      x: gu.planX,
      z: H.z,
      w: 0.3,
      node: <Character2 look={CAST.guesser} pose={gu.pose} frame={gu.frame} seed={GUESSER_SEED} x={gu.place.x} y={gu.place.y} scale={gu.place.scale} life={gu.life} eyeDarts={g >= R1.to} style={rigStyle(tilt, gu.place.scale)} />,
    },
  ];

  /* ---- backdrop: the field of view and its lit patch on the wall (S1.2) */
  const fov = tw(g, FOV0, 16, E.out) * (1 - tw(g, CUT - 1, 1));
  const patch = tw(g, PATCH0, 10, E.out) * (1 - tw(g, CUT - 1, 1));
  const zone = (LAYOUT as unknown as {frames: {A: {zoneEdgesX: number[]}}}).frames.A.zoneEdgesX;
  const pz0 = zone[0];
  const pz1 = zone[zone.length - 1];
  const ph0 = SENSOR_H - 0.37;
  const ph1 = SENSOR_H + 0.37;
  const P = (x: number, z: number, h: number) => projectWith(s, {x, z, h});
  const patchPts = [P(pz0, 0, ph0), P(pz1, 0, ph0), P(pz1, 0, ph1), P(pz0, 0, ph1)];
  // S1.4/S1.5: the opening between the partition's far end and the wall, marked while the route is drawn round the
  // end and the pulse goes through it. In the raised view the W -> H leg crosses this opening near the wall, but on
  // screen it also passes close above the partition's far top corner, which alone reads as "over the top"; the marked
  // opening makes the gap the thing the light goes through. Backdrop layer: the stand, the people and the partition
  // paint over it, as they would over anything standing in the gap.
  const gapT = tw(g, ROUTE0 - 8, 12, E.out) * (1 - tw(g, VF[2] + 8, 14));
  const gapH = topH(OCC.z0) - 0.02;
  const gapPts = [P(OCC.x, 0.015, FOOT_H), P(OCC.x, OCC.z0 - 0.015, FOOT_H), P(OCC.x, OCC.z0 - 0.015, gapH), P(OCC.x, 0.015, gapH)];
  const backdrop = fov > 0 || patch > 0 || gapT > 0 ? (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {gapT > 0 && (
        <path
          d={`M ${gapPts.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ')} Z`}
          fill={C.white}
          fillOpacity={0.8}
          stroke={C.inkMuted}
          strokeWidth={3.5}
          strokeDasharray="11 8"
          strokeLinejoin="round"
          opacity={gapT}
        />
      )}
      {fov > 0 && (
        <path
          d={`M ${f2(geo.S.x)} ${f2(geo.S.y)} L ${f2(patchPts[0].x)} ${f2(patchPts[0].y)} L ${f2(patchPts[3].x)} ${f2(patchPts[3].y)} L ${f2(patchPts[2].x)} ${f2(patchPts[2].y)} L ${f2(patchPts[1].x)} ${f2(patchPts[1].y)} Z`}
          fill={C.saffronLight}
          opacity={0.7 * fov}
        />
      )}
      <path d={`M ${patchPts.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ')} Z`} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="10 8" opacity={Math.max(fov * 0.6, patch)} />
    </svg>
  ) : null;

  /* ---- overlays in world px */
  const eyes = eyesWorld({...ch.place}, ch.pose);
  // the checker's sight line toward him stops on the partition's near face
  const sight = tw(g, SIGHT0, SIGHT_DUR, E.out) * (1 - tw(g, SIGHT_OUT, 8));
  let sightEnd: {x: number; y: number} | null = null;
  if (sight > 0) {
    const op = LAYOUT.operator;
    const eyeH = (ch.place.y - eyes.y) / (s.ppm * Math.max(1e-3, s.height));
    const u = (faceX - op.x) / (H.x - op.x);
    sightEnd = projectWith(s, {x: faceX, z: op.z + (H.z - op.z) * u, h: eyeH});
  }
  // the ghost straight line from the sensor toward him, stopped by the partition ("blocked")
  const ghost = g >= K.fires + 12 ? 0 : tw(g, LINE0, CONTACT - LINE0, E.in);
  const ghostHit = (() => {
    const u = (faceX - S.x) / (H.x - S.x);
    return {x: faceX, z: S.z + (H.z - S.z) * u};
  })();
  // the route round the end, via the wall (static preview), then faint while the pulse runs
  const route = tw(g, ROUTE0, ROUTE1 - ROUTE0, E.inOut);
  const routeOp = (1 - 0.75 * tw(g, K.fires, 10)) * (1 - tw(g, TRAIL_OUT, 10));
  const routeHead = route * pathLength([S, WP, H]);
  // the pulse (S1.5)
  const pulseT = SCHED.progress(g);
  const pulseOp = 1 - tw(g, TRAIL_OUT, 12);
  const fanW = tw(g, VF[1], 12);
  const fanWOut = tw(g, VF[1] + 16, 18);
  const fanH = tw(g, VF[2], 10);
  const fanHOut = tw(g, VF[2] + 12, 14);
  const dirsW = scatterDirections({x: 0, z: 1}, 9, 4);
  const dirsH = scatterDirections(sub(WP, H), 6, 9);
  // the race (S1.6)
  const raceOp = tw(g, RACE0 - 2, 3) * (1 - tw(g, RACE_FADE, 12));
  const raceFanW = tw(g, RACE_SCHED.vertexFrames[1], 10) * (1 - tw(g, RACE_SCHED.vertexFrames[1] + 14, 14));
  // the light tape from the wall spot to him and back (S1.7)
  const tape = tw(g, TAPE0, TAPE1 - TAPE0, E.inOut);

  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* checker's sight line */}
      {sightEnd && (
        <g opacity={clamp01(sight * 3)}>
          {(() => {
            const x0 = eyes.x + 92 * ch.place.scale;
            const head = {x: lerp(x0, sightEnd.x, sight), y: lerp(eyes.y, sightEnd.y, sight)};
            const cr = 14 * (sight > 0.92 ? E.back(clamp01((sight - 0.92) / 0.08)) : 0) * (1 - tw(g, SIGHT_OUT, 8));
            return (
              <>
                <path d={`M ${f2(x0)} ${f2(eyes.y)} L ${f2(head.x)} ${f2(head.y)}`} stroke={C.coral} strokeWidth={5} strokeDasharray="14 11" strokeLinecap="round" fill="none" />
                {cr > 0.5 && <Cross x={sightEnd.x - 10} y={sightEnd.y} s={cr} />}
              </>
            );
          })()}
        </g>
      )}
      {/* ghost straight line, blocked */}
      {ghost > 0 && (
        <g opacity={1 - tw(g, K.fires, 12)}>
          {(() => {
            const a = toPx(S);
            const b = toPx(ghostHit);
            const head = {x: lerp(a.x, b.x, ghost), y: lerp(a.y, b.y, ghost)};
            const cr = g >= CONTACT ? 15 * E.back(clamp01((g - CONTACT) / 6)) : 0;
            return (
              <>
                <path d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(head.x)} ${f2(head.y)}`} stroke={C.saffronDeep} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" fill="none" opacity={0.85} />
                {cr > 0.5 && <Cross x={b.x - 12} y={b.y} s={cr} />}
              </>
            );
          })()}
        </g>
      )}
      {/* the route round the end of the partition, via the wall */}
      {route > 0 && routeOp > 0 && (
        <Route points={[S, WP, H]} head={routeHead} toPx={toPx} hidden={hidden} opacity={routeOp} />
      )}
      {/* wall spot marker */}
      {route > 0 && <WallSpot p={toPx(WP)} t={tw(g, ROUTE0 + (ROUTE1 - ROUTE0) * (pathLength([S, WP]) / pathLength([S, WP, H])) - 2, 10)} />}
      {/* the slowed pulse S -> W -> H -> W -> S */}
      {g >= PULSE0 && pulseOp > 0 && (
        <>
          <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.62} toPx={toPx} t={fanW} release={fanWOut} layout={OLAYOUT} hidden={hiddenFan} seed={5} />
          <ScatterFan asGroup origin={H} dirs={dirsH} length={0.6} toPx={toPx} t={fanH} release={fanHOut} layout={OLAYOUT} hidden={hiddenFan} seed={8} width={3.5} color={C.saffron} />
          <LightPath asGroup points={PATH} toPx={toPx} t={pulseT} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} opacity={pulseOp} />
        </>
      )}
      {/* the race: one flash; the quick echo comes straight back (teal), the rest goes on round him (saffron) */}
      {raceOp > 0 && (
        <g opacity={raceOp}>
          <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.5} toPx={toPx} t={raceFanW > 0 ? 1 : 0} release={1 - raceFanW} layout={OLAYOUT} hidden={hiddenFan} seed={6} />
          <LightPath asGroup points={QUICK} toPx={toPx} t={QUICK_SCHED.progress(g)} pulses={3} pulseGap={0.09} color={C.tealDeep} pulseColor={C.teal} intensityFalloff={0.75} layout={OLAYOUT} hidden={hidden} />
          <LightPath asGroup points={PATH} toPx={toPx} t={RACE_SCHED.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} />
        </g>
      )}
      {/* light tape: the extra delay as an extra distance from the wall spot */}
      {tape > 0 && <LightTape toPx={toPx} t={tape} />}
    </svg>
  );

  /* ---- screen-space labels */
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  // the gap's label hangs off the opening's top, beside the partition's far end
  const gapLabelT = g >= ROUTE0 - 4 ? E.back(clamp01((g - ROUTE0 + 4) / 10)) * (1 - tw(g, VF[2] + 8, 14)) : 0;
  const gapTop = scr(projectWith(s, {x: OCC.x, z: OCC.z0 * 0.45, h: topH(OCC.z0) - 0.1}));
  const blockedT = g >= CONTACT + 2 ? E.back(clamp01((g - CONTACT - 2) / 8)) * (1 - tw(g, K.fires, 10)) : 0;
  const hitScr = scr(toPx(ghostHit));
  // "slowed down" stays while any pulse runs (S1.5 and the race); the flash note goes with the S1.5 pulse
  const chipsT = tw(g, CHIPS0, 10) * (1 - tw(g, RACE_FADE, 10));
  const flashT = 1 - tw(g, TRAIL_OUT, 10);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} wobble={wobble} items={items} backdrop={backdrop}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {/* S1.4 "blocked" */}
      {blockedT > 0 && (
        <ScreenLabel x={hitScr.x + 34} y={hitScr.y + 112} anchor="middle" t={blockedT} size={46} color={C.coralDeep} display>
          blocked
        </ScreenLabel>
      )}
      {/* S1.4 the gap the route goes through */}
      {gapLabelT > 0 && (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={`M ${f2(gapTop.x + 10)} ${f2(gapTop.y + 26)} L ${f2(gapTop.x + 52)} ${f2(gapTop.y - 4)}`} stroke={C.inkMuted} strokeWidth={4} strokeLinecap="round" opacity={gapLabelT} />
          </svg>
          <ScreenLabel x={gapTop.x + 50} y={gapTop.y - 10} anchor="start" t={gapLabelT} size={36} color={C.inkSoft}>
            gap
          </ScreenLabel>
        </>
      )}
      {/* S1.5 guard-rail chips */}
      {chipsT > 0 && (
        <div style={{position: 'absolute', right: 96, top: 790, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', opacity: chipsT, transform: `translateY(${f2((1 - E.out(chipsT)) * -10)}px)`}}>
          <Pill tone="saffron">slowed down</Pill>
          {flashT > 0 && (
            <div style={{opacity: flashT}}>
              <Pill tone="paper">invisible flash (shown for clarity)</Pill>
            </div>
          )}
        </div>
      )}
      {/* S1.6 the race timeline, the webcam, the sensor close-up; S1.7 the ruler */}
      <SideCards g={g} cam={cam} sensorWorld={geo.S} />
    </AbsoluteFill>
  );
};

/* ================================================================== small drawing helpers */

const Cross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={5.5} strokeLinecap="round" />
  </g>
);

/** A dashed route along a plan polyline, drawn on up to `head` metres; stretches the camera cannot see are skipped. */
const Route: React.FC<{points: P2[]; head: number; toPx: ToPx; hidden: (p: P2) => boolean; opacity: number}> = ({points, head, toPx, hidden, opacity}) => {
  assertPath(points, OLAYOUT);
  const runs: {x: number; y: number}[][] = [];
  let cur: {x: number; y: number}[] = [];
  let acc = 0;
  for (let i = 0; i < points.length - 1 && acc < head; i++) {
    const a = points[i];
    const b = points[i + 1];
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(2, Math.ceil(L / 0.02));
    for (let k = 0; k <= n; k++) {
      const d = (L * k) / n;
      if (acc + d > head) break;
      const p = {x: a.x + ((b.x - a.x) * d) / L, z: a.z + ((b.z - a.z) * d) / L};
      if (hidden(p)) {
        if (cur.length > 1) runs.push(cur);
        cur = [];
      } else cur.push(toPx(p));
    }
    acc += L;
  }
  if (cur.length > 1) runs.push(cur);
  return (
    <g opacity={opacity}>
      {runs.map((r, i) => (
        <path key={i} d={r.map((q, j) => `${j ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`).join(' ')} fill="none" stroke={C.saffronDeep} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
};

const WallSpot: React.FC<{p: {x: number; y: number}; t: number}> = ({p, t}) => {
  if (t <= 0) return null;
  const k = E.back(clamp01(t));
  const r = 13 * k;
  return <path d={`M ${f2(p.x)} ${f2(p.y - r)} L ${f2(p.x + r)} ${f2(p.y)} L ${f2(p.x)} ${f2(p.y + r)} L ${f2(p.x - r)} ${f2(p.y)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />;
};

/**
 * The extra delay as an extra distance: the detour wall spot -> him -> wall spot drawn as a measured light path (the
 * route's own saffron line, out and back in two lanes like LightPath) with an ink tick every 30 cm of path, i.e. every
 * nanosecond of light travel, the unit of the S1.7 ruler card (its first piece is named "1 ns" here too). The detour is
 * 2|WH| = c x (extra delay), so the ticks cut it into the same ~7 nanoseconds as the timeline's "≈ 7 ns later". Both
 * lanes run on the side away from the partition's far corner.
 */
const LANE_GAP = 15;
const LightTape: React.FC<{toPx: ToPx; t: number}> = ({toPx, t}) => {
  const a = toPx(WP);
  const b = toPx(H);
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // unit normal pointing away from the partition (up-right of the down-right W -> H leg)
  const n = {x: (b.y - a.y) / L, y: -(b.x - a.x) / L};
  const lanes = [
    {from: a, to: b, off: 4},
    {from: b, to: a, off: 4 + LANE_GAP},
  ];
  const legM = Math.hypot(H.x - WP.x, H.z - WP.z); // metres per lane
  const total = 2 * legM;
  const step = OLAYOUT.c_m_per_ns; // metres of light per nanosecond
  const head = E.inOut(clamp01(t)) * total;
  const lines: React.ReactNode[] = [];
  const ticks: React.ReactNode[] = [];
  const seg = (key: string, p0: {x: number; y: number}, p1: {x: number; y: number}) =>
    lines.push(<path key={key} d={`M ${f2(p0.x)} ${f2(p0.y)} L ${f2(p1.x)} ${f2(p1.y)}`} stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" />);
  lanes.forEach((ln, i) => {
    const d0 = i * legM;
    const len = clamp(head - d0, 0, legM);
    if (len <= 0) return;
    const at = (u: number) => ({x: lerp(ln.from.x, ln.to.x, u) + n.x * ln.off, y: lerp(ln.from.y, ln.to.y, u) + n.y * ln.off});
    seg(`l${i}`, at(0), at(len / legM));
    // an ink tick at every whole nanosecond of path inside this lane
    for (let k = 1; k * step < total; k++) {
      const d = k * step - d0;
      if (d <= 0 || d >= len) continue;
      const c = at(d / legM);
      ticks.push(<path key={`t${k}`} d={`M ${f2(c.x - n.x * 11)} ${f2(c.y - n.y * 11)} L ${f2(c.x + n.x * 11)} ${f2(c.y + n.y * 11)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />);
    }
  });
  // the turn at him joins the two lanes
  if (head >= legM) seg('turn', {x: b.x + n.x * lanes[0].off, y: b.y + n.y * lanes[0].off}, {x: b.x + n.x * lanes[1].off, y: b.y + n.y * lanes[1].off});
  // "1 ns" names the first piece, as on the ruler card
  const nameT = clamp01((head - step) / (step * 0.8));
  const mid = {x: lerp(a.x, b.x, (step * 0.6) / legM) + n.x * 60, y: lerp(a.y, b.y, (step * 0.6) / legM) + n.y * 60};
  return (
    <g>
      {lines}
      {ticks}
      {nameT > 0 && (
        <text x={f2(mid.x)} y={f2(mid.y + 11)} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={32} fill={C.saffronDeep} stroke={C.cream} strokeWidth={7} strokeLinejoin="round" paintOrder="stroke" opacity={nameT}>
          1 ns
        </text>
      )}
    </g>
  );
};

const Pill: React.FC<{tone: 'saffron' | 'paper'; children: React.ReactNode; size?: number}> = ({tone, children, size = 32}) => (
  <div
    style={{
      display: 'inline-flex',
      padding: `${size * 0.26}px ${size * 0.72}px`,
      borderRadius: 999,
      background: tone === 'saffron' ? C.saffron : C.cream,
      color: C.ink,
      border: `3px solid ${tone === 'saffron' ? C.saffronDeep : C.inkMuted}`,
      fontFamily: F.body,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.05,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const ScreenLabel: React.FC<{x: number; y: number; t: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; display?: boolean}> = ({x, y, t, children, size = 40, color = C.ink, anchor = 'start', display}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${anchor === 'end' ? '-100%' : anchor === 'middle' ? '-50%' : '0'}, -50%) scale(${f2(Math.max(0, t))})`,
      transformOrigin: anchor === 'end' ? '100% 50%' : anchor === 'middle' ? '50% 50%' : '0 50%',
      fontFamily: display ? F.display : F.body,
      fontWeight: display ? 600 : 800,
      fontSize: size,
      color,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      background: C.cream,
      border: `3px solid ${color}`,
      borderRadius: 16,
      padding: '6px 16px 9px',
    }}
  >
    {children}
  </div>
);

/** The readout's stopwatch (sensor-screen-local px). */
const StopwatchScreen: React.FC<{g: number}> = ({g}) => {
  const run = clamp01((g - K.clocks) / Math.max(12, K.trip7 + 12 - K.clocks));
  return (
    <g>
      <rect x={0} y={0} width={SENSOR.screen.w} height={SENSOR.screen.h} fill={C.cream} />
      <Stopwatch x={SENSOR.screen.w / 2} y={SENSOR.screen.h / 2 + 2} r={11.5} hand={0.02 + run * 0.9} />
    </g>
  );
};

/* ================================================================== S1.6 / S1.7 side cards (screen space) */

const SideCards: React.FC<{g: number; cam: Cam; sensorWorld: {x: number; y: number}}> = ({g, cam, sensorWorld}) => {
  // race timeline card (top-left)
  const cardIn = tw(g, RACE_CARD0, 14, E.out);
  const cardOut = tw(g, K.s08End + 30, 1); // stays to the end (the s08 "extra delay" callback)
  const raceT = cardIn * (1 - cardOut);
  const quick = tw(g, QUICK_SCHED.end - 8, 10, E.linear);
  const long = tw(g, RACE_SCHED.end - 8, 10, E.linear);
  const bracket = tw(g, BRACKET0, 16, E.inOut);
  const glow = pulseAt(g, EXTRA0, 36);

  // webcam / sensor close-up inset (lower left)
  const insetIn = tw(g, CAMI0, 12, E.out);
  const insetOut = tw(g, INSET_OUT, 10, E.inOut);
  const swap = tw(g, CAMI_SWAP, 12, E.inOut);
  const qT = tw(g, Q0, 8);
  const spin = clamp01((g - Q0) / Math.max(10, SHRUG - Q0)) * 2;
  const shrug = Math.min(sp(g, SHRUG, SOFT), 1 - tw(g, SHRUG + 18, 10));
  const sad = tw(g, SHRUG, 6);
  const labelT = tw(g, TOF_LABEL, 12, E.out) * (1 - insetOut);
  const C0 = {x: 330, y: 620};
  const R = 200;
  const sensorScr = worldToScreen(cam, sensorWorld.x, sensorWorld.y);
  const leader = tw(g, CAMI_SWAP + 6, 10, E.out) * (1 - insetOut);
  const rt = g < RT0 ? 0 : (g - RT0) / 26; // close-up round trip (0..1 travel, then the trail fades)

  // ruler card (s08)
  const rulerIn = tw(g, RULER0, 14, E.out);
  const rulerPulse = (g - RULER_PULSE0) / (RULER_PULSE1 - RULER_PULSE0);
  const first = tw(g, K.nanosecond - 4, 10);
  const head = tw(g, RULER0 + 8, 10);
  const extraT = tw(g, EXTRA0, 12, E.out);

  const inset = insetIn * (1 - insetOut);
  return (
    <>
      {raceT > 0 && (
        <div style={{position: 'absolute', left: 96, top: 60, opacity: clamp01(raceT * 2), transform: `translateX(${f2((1 - raceT) * -60)}px)`}}>
          <ArrivalRace tQuick={NS_QUICK} tLong={NS_LONG} quick={quick} long={long} bracket={bracket} glow={glow} width={780} />
        </div>
      )}
      {inset > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* the real sensor in the room is ringed while its close-up is shown */}
          {leader > 0 && <circle cx={f2(sensorScr.x - 6)} cy={f2(sensorScr.y + 26)} r={f2(64 * E.back(leader))} fill="none" stroke={C.teal} strokeWidth={5} />}
          <g transform={`translate(${C0.x} ${C0.y}) scale(${f2(E.back(clamp01(inset)))})`}>
            <circle r={R} fill={C.cream} stroke={C.ink} strokeWidth={5} />
            <defs>
              <clipPath id="s1inset">
                <circle r={R - 3} />
              </clipPath>
            </defs>
            <g clipPath="url(#s1inset)">
              {/* the webcam (slides down and out on the swap) */}
              {swap < 1 && (
                <g transform={`translate(0 ${f2(118 + swap * 260)})`}>
                  <Webcam shrug={shrug} sad={sad} tilt={-4 * shrug} lookX={-0.2} lookY={-0.7} />
                </g>
              )}
              {/* the sensor close-up (rises in): two windows on top, a stopwatch on the readout */}
              {swap > 0 && (
                <g transform={`translate(0 ${f2((1 - swap) * 330)})`}>
                  {/* its own light's round trip: out of the emitter window, off a wall, back into the detector window */}
                  {rt > 0 && <RoundTrip t={rt} />}
                  <NSS transform={`translate(${-2 * CLOSE_K} ${88 * CLOSE_K}) scale(${CLOSE_K})`}>
                    <HandheldSensor screen={<StopwatchScreen g={g} />} led={1} firing={pulseAt(g, RT0, 8)} />
                  </NSS>
                </g>
              )}
            </g>
          </g>
          {/* the question mark (outside the clip so it can rise above the inset) */}
          {swap < 0.5 && <SpinningQuestion x={C0.x + 120} y={C0.y - R + 30} t={qT * (1 - swap * 2)} spin={spin} size={110} />}
        </svg>
      )}
      {labelT > 0 && (
        <div style={{position: 'absolute', left: 96, top: C0.y + R + 18, opacity: labelT, transform: `translateY(${f2((1 - labelT) * 10)}px)`, fontFamily: F.body, fontWeight: 800, fontSize: 36, lineHeight: 1.18, color: C.ink}}>
          <div style={{color: C.tealDeep}}>time-of-flight sensor:</div>
          <div>{"times its own light's round trip"}</div>
        </div>
      )}
      {rulerIn > 0 && (
        <div style={{position: 'absolute', left: 96, top: 420, opacity: clamp01(rulerIn * 2), transform: `translateX(${f2((1 - rulerIn) * -60)}px)`}}>
          <RulerCard t={rulerIn} pulse={rulerPulse} first={first} head={head} width={780} />
          {extraT > 0 && (
            <div style={{marginTop: 18, opacity: extraT, transform: `translateY(${f2((1 - extraT) * 10)}px)`}}>
              <Pill tone="saffron" size={38}>
                extra delay → extra distance
              </Pill>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/** Scale of the sensor close-up in the inset (outlines stay 4 px: NSS). */
const CLOSE_K = 2.3;

/** The close-up's round trip (inset px, sensor box centred on 0,0): emitter -> a wall above -> detector. */
const RoundTrip: React.FC<{t: number}> = ({t}) => {
  const em = {x: (SENSOR.box.x0 + 24 + SENSOR.depth.dx - 2) * CLOSE_K, y: (SENSOR.box.y0 + SENSOR.depth.dy - 1 + 88) * CLOSE_K};
  const de = {x: (SENSOR.box.x0 + 56 + SENSOR.depth.dx - 2) * CLOSE_K, y: em.y};
  const wallY = -178;
  const ap = {x: (em.x + de.x) / 2, y: wallY + 8};
  const fade = 1 - clamp01((t - 1) * 3);
  if (fade <= 0) return null;
  const u = clamp01(t);
  const L1 = Math.hypot(ap.x - em.x, ap.y - em.y);
  const L2 = Math.hypot(de.x - ap.x, de.y - ap.y);
  const d = u * (L1 + L2);
  const head = d <= L1 ? {x: lerp(em.x, ap.x, d / L1), y: lerp(em.y, ap.y, d / L1)} : {x: lerp(ap.x, de.x, (d - L1) / L2), y: lerp(ap.y, de.y, (d - L1) / L2)};
  const pts = d <= L1 ? [em, head] : [em, ap, head];
  return (
    <g opacity={fade}>
      <rect x={-120} y={wallY - 16} width={240} height={16} fill="#F5E4C6" />
      <line x1={-120} y1={wallY} x2={120} y2={wallY} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={pts.map((q, i) => `${i ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`).join(' ')} fill="none" stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      {u < 1 && <circle cx={f2(head.x)} cy={f2(head.y)} r={11} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />}
    </g>
  );
};

/* ================================================================== the board (S1.3) */

const BoardShot: React.FC<{g: number}> = ({g}) => {
  // the swing: from the sensor's readout (in the pushed S1.2 framing) up to the full card
  const cam = camPath(SWING0, CAM_ROOM, [{at: PUSH0, dur: PUSH_DUR, to: {cx: 852, cy: 498, zoom: CAM_ROOM.zoom * 1.08}}]);
  const geo = standGeometry(0);
  const r0 = worldToScreen(cam, geo.screen.x, geo.screen.y);
  const r1 = worldToScreen(cam, geo.screen.x + geo.screen.w, geo.screen.y + geo.screen.h);
  const cw = CARD.x1 - CARD.x0;
  const chh = CARD.y1 - CARD.y0;
  const u = clamp01((g - SWING0) / SWING);
  const e = E.softBack(u);
  const sx = lerp((r1.x - r0.x) / cw, 1, e);
  const sy = lerp((r1.y - r0.y) / chh, 1, e);
  const cx = lerp((r0.x + r1.x) / 2, (CARD.x0 + CARD.x1) / 2, e);
  const cy = lerp((r0.y + r1.y) / 2, (CARD.y0 + CARD.y1) / 2, e);
  const rot = lerp(-14, -0.5, E.out(u));
  const bg = clamp01((u - 0.3) * 2.5);
  // board timing
  const idx = g < REPLAY0 ? -1 : Math.min(BOARD_FRAMES - 1, Math.floor(((g - REPLAY0) / (REPLAY1 - REPLAY0)) * (BOARD_FRAMES - 1)));
  const t: BoardT = {
    content: clamp01((u - 0.3) * 2.5),
    layout: tw(g, LAND - 4, 26, E.linear),
    idx,
    marker: tw(g, REPLAY0, 10),
    fov: tw(g, K.aimed, 14),
    sensorPop: clamp01((g - K.sensor3) / 14),
    blocked: tw(g, K.never, 16, E.linear),
    conditions: tw(g, K.small - 6, 12),
    source: tw(g, K.published, 12),
    fine: tw(g, K.aimed + 6, 12),
  };
  const push = 1 + 0.04 * tw(g, BOARD_PUSH0, BOARD_PUSH1 - BOARD_PUSH0, E.inOut);
  return (
    <AbsoluteFill>
      {u < 1 && <RoomShot g={g} />}
      <AbsoluteFill style={{background: C.paperDeep, opacity: bg}} />
      <AbsoluteFill style={{transform: `scale(${f2(push * 10000) / 10000})`, transformOrigin: `${PLOT_CENTRE.x}px ${PLOT_CENTRE.y}px`}}>
        <AbsoluteFill
          style={{
            transform: `translate(${f2(cx - (CARD.x0 + CARD.x1) / 2)}px, ${f2(cy - (CARD.y0 + CARD.y1) / 2)}px) rotate(${f2(rot)}deg) scale(${f2(sx * 10000) / 10000}, ${f2(sy * 10000) / 10000})`,
            transformOrigin: `${(CARD.x0 + CARD.x1) / 2}px ${(CARD.y0 + CARD.y1) / 2}px`,
          }}
        >
          <BoardCard />
          <TrackingBoard t={t} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S1ColdOpen: React.FC = () => {
  const g = useG();
  if (g >= SWING0 && g < CUT) return <BoardShot g={g} />;
  return <RoomShot g={g} />;
};
