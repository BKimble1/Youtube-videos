import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SOFT, SNAP, camPath, hop, ring, sp, tw} from '../lib/motion';
import {CAM_PATH, CAM_PATH_SIDE, CAM_ROOM, RAISED_TILT} from '../lib/shots';
import {
  LAYOUT,
  PTS,
  assertAroundTheEnd,
  depthSort,
  hiddenByPartition,
  partitionCrossings,
  partitionHides,
  partitionTopH,
  projectWith,
  rigAt,
  rigStyle,
  tiltAt,
  viewAt,
  type PlanPt,
  type ViewState,
} from '../lib/room';
import {LAYOUT as OLAYOUT, assertPath, confocalPath, firstOccluderHit, layoutPoints, lerpP, pathCumulative, pathLength, pathSchedule, scatterDirections, sub, timeNs, visibleIntervals, type P2, type PathSchedule, type ScatterDir} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {GapMarker, RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {LightPath, ScatterFan, type ToPx} from '../components/v02/Optics';
import {
  ARMS,
  Character2,
  handWorld2,
  EXPR,
  HANDS_ON_HIPS,
  IDLE2,
  SNEAK_ARMS,
  eyesWorld,
  mouthWorld,
  figuresHide,
  mixPose2,
  planTrip,
  reach2,
  rigCovers,
  rimFlash,
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
import {handPos, reachLocal} from '../components/Character';
import {PLAN_AREA, PLAN_VIEW, PlanCard, PlanCross, PlanRoute, PlanSpot, planCardSize, viewForArea} from '../components/v02/PlanCard';
import {PlanTapeLanes, TapeKey} from '../components/v02/S1_PlanTape';

/**
 * S1 · Cold open: the impossible view (s01–s08). Storyboard shots S1.1–S1.7.
 *
 *  S1.1 s01  locked wide room view: the guesser tiptoes in from the right and settles smug behind the partition
 *            (RUNWAY R1 = the sneak, static start/end poses); the checker's dashed sight line stops at the partition.
 *  S1.2 s02  push 8 % toward the sensor on its tripod; the checker taps it on ("sensor"), the readout lights; on
 *            "pointed" the field of view grows out of the sensor as a frustum (a dashed cross-section travelling to the
 *            wall, corner rays, ghost sections) and lands as the patch, which fills on "plain" (review r1 D01).
 *  S1.3 s03  the readout swings up into the full-screen evidence board ("And yet"): the authors' released tracking
 *            data, mirrored to match our room, the estimated position stepping through the 475 frames; cut back:
 *            the guesser freezes mid-smirk.
 *  S1.4 s04  the camera rises (tilt 0 -> RAISED_TILT 0.10, CAM_ROOM -> CAM_PATH_S1: the room sits 220 px further
 *            left than at the shared CAM_PATH) and the 1.5x "seen from above" PlanCard comes in top right (inside the
 *            5 % margin) before anything is drawn; a ghost straight line from the sensor stops at the partition
 *            ("blocked"); the opening between the partition's far end and the wall is marked on the floor (GapMarker,
 *            outlined) and the route round the end, via the wall, draws on: in the room it goes behind the
 *            partition's FAR END by the wall and ends at his outline; the card shows it thread the opening, on the
 *            same schedule. As the route turns into the opening, "blocked" hands over to "gap", whose leader drops to
 *            the floor of the opening (review r1 D02).
 *  S1.5 s05  a slowed pulse travels S -> W -> H -> W -> S (W3, asserted below), scatter fans at the wall and at him,
 *            later legs thinner and paler; the lit wall spot is an ellipse on the wall plane, lit while light is at the
 *            wall; when the (hidden) pulse reaches him his wall-side outline flashes saffron (rimFlash) and he flinches
 *            (as in S3 and S9). The card runs the same pulse in plan. On the fire frame (the sensor_pulse cue) a saffron
 *            burst flashes at the emitting lens and holds until the pulse is out of the box (review r1 D15); the wall
 *            fan and the glow are kept clear of her head and pencil (nearHer, review r1 D02).
 *  S1.6 s06-07 the card leaves, pan (CAM_PATH_S1 -> CAM_PATH_SIDE) to make room; two pulses race: the quick wall echo lands first
 *            on a mini arrival timeline, the roundabout one ~7 ns later (illustrative). A webcam tries to time it and
 *            shrugs; the sensor close-up replaces it: "time-of-flight sensor: times its own light's round trip".
 *  S1.7 s08  a light ruler: 1 nanosecond ≈ 30 cm ≈ 1 ft; then the PlanCard takes the ruler's slot with the detour
 *            wall spot -> him -> wall spot as a tape ticked every nanosecond of path (~7 ns, key "1 ns / 30 cm");
 *            in the room the wall spot glows while the tape runs and his rim flashes when it reaches him (the ~70 px
 *            visible stub of the detour is not drawn: it ran on from her pencil). He glances at the wall, uneasy.
 *
 * Light-path rule (STORYBOARD continuity): every room light leg is checked at module load with assertAroundTheEnd
 * over every tilt of the rise and both camera zooms it is seen at; overlay light is hidden by the partition AS DRAWN
 * (partitionHides) and by the people (figuresHide), plus the sensor box. The partition is never faded.
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

/** The light-path plane: the 2D model's horizontal slice at the sensor's height (layout sensor.h = 0.95 m, the drawn
 *  chibis' chest). Sensor, wall spots and his point H share it, so drawn 3D lengths equal the plan lengths. */
const LIGHT_H = LAYOUT.sensor.h;
const SENSOR_H = LIGHT_H;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
/** The partition's camera-side (sensor-side) long face. */
const faceX = OCC.x - OCC.thickness / 2;
const at3 = (p: P2): PlanPt => ({x: p.x, z: p.z, h: LIGHT_H});
const RAISED_VIEW = viewAt(RAISED_TILT);
/**
 * S1.4-S1.5 framing (review r1 D02): lib/shots CAM_PATH moved 176 world px right (the room 220 screen px left: her
 * left hand ~x 145, his elbow ~x 1071), so the enlarged "seen from above" card (S1_CARD) fits beside him inside the
 * 5 % margin. Local on purpose: S3 and S9 share CAM_PATH.
 */
const CAM_PATH_S1: Cam = {...CAM_PATH, cx: CAM_PATH.cx + 176};
/** The tilts of the S1.4 rise: the light rule is asserted at each (light itself is drawn only once it has settled). */
const LIGHT_TILTS = [0, 0.25, 0.5, 0.75, 1].map((f) => f * RAISED_TILT);
/** The camera zooms room light is seen at: CAM_PATH_S1 (S1.4-S1.5) and CAM_PATH_SIDE (S1.6-S1.7). Screen margins
 *  scale with zoom, so the smaller one is the binding case (the S1.6 pan glides between the two). */
const LIGHT_ZOOMS = [CAM_PATH_S1.zoom, CAM_PATH_SIDE.zoom];
const ZOOM_MIN = Math.min(...LIGHT_ZOOMS);

/** Largest `grow` (world px) for which test(grow) stays false (bisection; test is monotone in grow). */
const clearance = (test: (grow: number) => boolean, hi = 400) => {
  if (test(0)) return -1;
  let lo = 0;
  for (let i = 0; i < 28; i++) {
    const m = (lo + hi) / 2;
    if (test(m)) hi = m;
    else lo = m;
  }
  return lo;
};

/**
 * The wall sample of S1.4-S1.7: W3, whose echo delay is the ~7 ns the storyboard labels. There is no fallback by
 * design: at the 0.95 m light plane W1 and W2 sit behind her head and W4 behind the partition's far edge. Asserted
 * (throws): the path clears the partition in plan (assertPath); every leg obeys the room light rule at every tilt of the
 * rise and at both zooms (assertAroundTheEnd: behind the far / near END >= 24 px below the corner, never over the top;
 * S -> W legs >= 18 px in front); the spot is not behind the partition as drawn and is >= SPOT_CLEAR_PX screen px from
 * her head, hair and pencil at the settled raised view.
 */
const SPOT_CLEAR_PX = 40;
const pickWall = () => {
  const w = W.find((p) => p.id === 'W3')!;
  const path = confocalPath(S, w, H);
  assertPath(path, OLAYOUT);
  let minBelowCornerPx = Infinity;
  let minFrontPx = Infinity;
  for (const tilt of LIGHT_TILTS) {
    const s = viewAt(tilt);
    for (const zoom of LIGHT_ZOOMS) {
      assertAroundTheEnd('S1 W3 round trip', [path.map(at3)], s, {zoom});
      path.slice(0, -1).forEach((a, i) => {
        const r = partitionCrossings(at3(a), at3(path[i + 1]), s, {zoom});
        for (const c of r.crossings) minBelowCornerPx = Math.min(minBelowCornerPx, c.belowCornerPx);
        if (!r.crossings.length) minFrontPx = Math.min(minFrontPx, r.frontClearPx);
      });
    }
  }
  const spot = at3(w);
  if (hiddenByPartition(spot, RAISED_VIEW)) throw new Error('S1: the W3 wall spot is behind the partition at RAISED_TILT');
  const her = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
  const q = projectWith(RAISED_VIEW, spot);
  const spotClearPx = clearance((g) => rigCovers(her, q, g)) * ZOOM_MIN;
  if (spotClearPx < SPOT_CLEAR_PX) throw new Error(`S1: the W3 wall spot is ${spotClearPx.toFixed(0)} screen px from her head (needs ${SPOT_CLEAR_PX})`);
  return {w, path, minBelowCornerPx, minFrontPx, spotClearPx};
};
const PICK = pickWall();
const WP = PICK.w; // the wall spot of S1.4-S1.7
const PATH = PICK.path; // S, W, H, W, S
/** Scatter fans: at the wall spot (S1.5, the race) and at him (S1.5). */
const dirsW = scatterDirections({x: 0, z: 1}, 9, 4);
const dirsH = scatterDirections(sub(WP, H), 6, 9);
/** The rays a ScatterFan draws (components/v02/Optics: the same lengths, seeds and stop at the partition in plan). */
const fanRays = (origin: P2, dirs: ScatterDir[], length: number, seed: number) =>
  dirs.map((d, i) => {
    const L = length * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(seed * 53 + i * 7));
    const end = {x: origin.x + d.x * L, z: origin.z + d.z * L};
    return [at3(origin), at3(lerpP(origin, end, firstOccluderHit(origin, end, OLAYOUT, 0.05)))];
  });
/** Where the blocked straight line from the sensor toward him meets the partition's camera-side face (S1.4). */
const GHOST_HIT: P2 = {x: faceX, z: S.z + (H.z - S.z) * ((faceX - S.x) / (H.x - S.x))};
// every other room light leg obeys the rule too, at every tilt of the rise and both zooms: the fan rays (at the wall
// spot S1.5 and the race, at him S1.5) and the blocked line, a front leg that stops on the camera-side face
(() => {
  const fans = [...fanRays(WP, dirsW, 0.62, 5), ...fanRays(H, dirsH, 0.6, 8), ...fanRays(WP, dirsW, 0.5, 6)];
  for (const tilt of LIGHT_TILTS) {
    for (const zoom of LIGHT_ZOOMS) {
      assertAroundTheEnd('S1 scatter fans', fans, viewAt(tilt), {zoom});
      assertAroundTheEnd('S1 blocked line', [[at3(S), at3(GHOST_HIT)]], viewAt(tilt), {zoom, allowFront: true});
    }
  }
})();
/** The S1.2 patch on the wall: the sensor's zones (frames.A zoneEdgesX) x the light plane +- 0.37 m; corners in order
 *  bottom-left, bottom-right, top-right, top-left as (plan x, h) on the wall z = 0. */
const FOV_ZONE = (LAYOUT as unknown as {frames: {A: {zoneEdgesX: number[]}}}).frames.A.zoneEdgesX;
const FOV_CORNERS: [number, number][] = [
  [FOV_ZONE[0], SENSOR_H - 0.37],
  [FOV_ZONE[FOV_ZONE.length - 1], SENSOR_H - 0.37],
  [FOV_ZONE[FOV_ZONE.length - 1], SENSOR_H + 0.37],
  [FOV_ZONE[0], SENSOR_H + 0.37],
];
/** The frustum's cross-section at u (0 = the sensor point S, 1 = the patch on the wall), plan points. */
const fovSection = (u: number): PlanPt[] => FOV_CORNERS.map(([x, h]) => ({x: lerp(S.x, x, u), z: lerp(S.z, 0, u), h: lerp(SENSOR_H, h, u)}));
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
/** The S1.2 push: 8 % in toward the sensor and the lit wall patch (tilt 0; the far panel's top stays in frame). */
const CAM_PUSH: Cam = {cx: 852, cy: 498, zoom: CAM_ROOM.zoom * 1.08};
const PUSH0 = K.s02;
const PUSH_DUR = clamp(K.pointed - K.s02 - 6, 24, 50);
const TAP = K.sensor2 + 3; // her hand meets the sensor
/**
 * S1.2 field of view (review r1 D01): a frustum from the sensor's window to the wall patch it is aimed at. On "pointed"
 * its cross-section (a dashed rectangle at plan depth lerp(S.z, 0, u)) grows out of the sensor box and lands on the
 * wall as the patch, which fills on "plain"; ghost cross-sections at u 0.35 and 0.7 and four thin corner rays from S
 * stay until the cut. All of it is in the backdrop, so she and the partition paint over it (at tilt 0 the sensor's
 * point S projects INSIDE the patch, so a fan from S to the patch alone would be degenerate: the cross-sections carry
 * the depth). The rays obey the room light rule (asserted below at tilt 0 and both S1.2 zooms).
 */
const FOV0 = K.pointed;
const PATCH0 = K.plain;
const FOV_GROW = clamp(K.plain - K.pointed - 4, 8, 14);
const FOV_GHOSTS = [0.35, 0.7];

// S1.3 — the board
const SWING0 = K.and3;
const SWING = clamp(K.this3 - K.and3 + 2, 10, 16);
const LAND = SWING0 + SWING;
/** The board's contact (review r1 D14): the frame its E.softBack swing reaches its largest extent (~f295), where the
 *  paper_slap lands; LAND (the end of the settle back to rest) still drives the layout tween and the replay. */
const BOARD_HIT = (() => {
  let best = SWING0;
  for (let f = SWING0; f <= LAND; f++) if (E.softBack(clamp01((f - SWING0) / SWING)) > E.softBack(clamp01((best - SWING0) / SWING)) + 1e-9) best = f;
  return best;
})();
const REPLAY0 = Math.max(LAND + 14, K.this3);
const REPLAY1 = Math.max(REPLAY0 + 120, K.directly);
const BOARD_PUSH0 = K.y2026;
const BOARD_PUSH1 = Math.max(BOARD_PUSH0 + 24, K.small - 8);
const CUT = Math.max(K.directly + 14, K.s03End - 2); // hard cut back to the room
// he buffs his nails long enough to read (~0.45 s), then freezes mid-smirk well before s04 starts
const FREEZE = CUT + clamp(K.s04 - CUT - 14, 7, 14);

// S1.4 — rise (tilt 0 -> RAISED_TILT, CAM_ROOM -> CAM_PATH), the plan card, blocked line, route round the end
const RISE0 = K.s04 + 2;
const RISE_DUR = clamp(K.corners - RISE0 - 2, 34, 56);
const RISE_END = RISE0 + RISE_DUR;
// no light is drawn before the camera has settled at RAISED_TILT (so the spot and label checks below hold)
const LINE0 = Math.max(K.light4, RISE_END + 2);
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

// S1.4-S1.5 "seen from above": the PlanCard is fully in before the blocked line draws, runs the same blocked line,
// route and pulse on the same schedules, and is gone before the S1.6 pan moves the room under it.
const CARD_IN = RISE_END - 10;
const CARD_IN_DUR = 14;
const CARD_OUT_DUR = 10;
/**
 * The S1.4-S1.5 card is 1.5x PlanCard's default plan area (review r1 D02: the route must read at phone size) at the same
 * plan framing (viewForArea), its light strokes 1.5x too (S1_CARD_K). It sits top right inside the 5 % safe margin
 * (review r1 D44): right edge at 1824, and low enough that its strip of tape (PlanCard 'inside', ~19.5 px above the
 * card's top edge) stays below y 54. The camera (CAM_PATH_S1) keeps him clear of it (asserted at load).
 */
const S1_CARD_AREA = {w: 672, h: 495};
const S1_CARD_VIEW = viewForArea(PLAN_VIEW, S1_CARD_AREA);
const S1_CARD_K = S1_CARD_AREA.w / PLAN_AREA.w;
const CARD_SIZE = planCardSize(S1_CARD_AREA);
const CARD_TAPE_RISE = 20;
const CARD_POS = {x: 1920 * 0.95 - CARD_SIZE.w, y: Math.ceil(1080 * 0.05) + CARD_TAPE_RISE};

// S1.6 — pan (CAM_PATH_S1 -> CAM_PATH_SIDE: the cards' column opens on the left), race, timeline. From CAM_PATH_S1
// (review r1 D02) the pan is ~640 world px (it was ~465): it starts a little before s06, as soon as the S1.5 echo is
// home and the card and chips have left, and ends 4 frames later than the shorter pan did (K.s06 + 32), so its peak
// speed stays near the old pan's (~37 screen px a frame); the race starts 2 frames after it lands.
const PAN_END = K.s06 + 32;
const PAN0 = Math.min(PAN_END - 28, Math.max(K.s06 - 8, PULSE1 + 12));
const PAN_DUR = PAN_END - PAN0;
const CARD_OUT = PAN0 - CARD_OUT_DUR; // the S1.4-S1.5 card is gone before the pan moves the room under it
const CHIPS_OUT = PAN0 - 10; // the S1.5 chips too (at CAM_PATH_SIDE they would sit on his legs)
const RACE_CARD0 = PAN0 + PAN_DUR - 4; // after the pan has made room
const RACE0 = Math.max(PAN0 + PAN_DUR + 2, K.trip6 + 4);
const RACE_LONG_END = Math.max(RACE0 + 70, K.later6);
const RACE_SCHED = pathSchedule(PATH, {start: RACE0, dur: RACE_LONG_END - RACE0});
const QUICK_SCHED = pathSchedule(QUICK, {start: RACE0, dur: (RACE_LONG_END - RACE0) * (LEN_QUICK / LEN_LONG)});
/**
 * The fire flash (review r1 D15): the sensor_pulse sound sits on PULSE0 / RACE0, but the pulse head is still inside
 * the sensor box for a few frames (hidden exactly). So a saffron burst at the emitting lens (HandheldSensor / SensorTop
 * opt-in `burst`, plus an expanding `burstRing`) shows the flash ON the cue frame and holds at full until the head is out
 * of the box (the EMERGE frames, computed from the room's own hidden test at RAISED_TILT), then fades over BURST_FADE.
 */
const BURST_FADE = 4;
const BURST_RING = 8;
const pointAlong = (points: P2[], m: number): P2 => {
  const cum = pathCumulative(points);
  let i = 0;
  while (i < points.length - 2 && m > cum[i + 1]) i++;
  return lerpP(points[i], points[i + 1], clamp01((m - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i])));
};
/** The room's light-hiding test (the partition as drawn, both people at their marks, the sensor box), at a view. */
const roomHides = (s: ViewState, places: {her: RigPlace; him: RigPlace}) => {
  const box = standGeometry(s.tilt).box;
  const behindPartition = partitionHides(s, LIGHT_H);
  const behindPeople = figuresHide(s, LIGHT_H, [
    {z: LAYOUT.operator.z, place: places.her},
    {z: H.z, place: places.him},
  ]);
  return (p: P2) => {
    if (behindPartition(p) || behindPeople(p)) return true;
    if (Math.hypot(p.x - S.x, p.z - S.z) >= 0.25) return false;
    const q = projectWith(s, at3(p));
    return q.x > box.x0 - 2 && q.x < box.x1 + 2 && q.y > box.y0 - 2 && q.y < box.y1 + 2;
  };
};
const emergeFrame = (sched: PathSchedule, points: P2[]) => {
  const hid = roomHides(RAISED_VIEW, {her: rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT), him: rigAt(H.x, H.z, RAISED_TILT)});
  for (let f = Math.ceil(sched.start); f <= sched.end; f++) if (!hid(pointAlong(points, sched.progress(f) * sched.length))) return f;
  throw new Error('S1: the pulse never leaves the sensor box');
};
const EMERGE = emergeFrame(SCHED, PATH);
const RACE_EMERGE = emergeFrame(RACE_SCHED, PATH);
/** Burst level for a flash fired at f0 whose head leaves the box at `em`: 1 from f0 to em, then a BURST_FADE fade. */
const burstAt = (g: number, f0: number, em: number) => (g < f0 ? 0 : g <= em ? 1 : 1 - tw(g, em, BURST_FADE));
const burstRingAt = (g: number, f0: number) => (g >= f0 && g < f0 + BURST_RING ? (g - f0) / BURST_RING : undefined);
const BRACKET0 = K.billionths;
const RACE_FADE = K.s07 + 6;
/** The race's "slowed down" chip (left column, under the arrival card): out before the webcam inset grows there. */
const RACE_CHIP_IN = RACE_CARD0 + 6;
const RACE_CHIP_POS = {x: 96, y: 60 + 318 + 18};

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
// the ruler card leaves and the PlanCard takes its slot (left column) for the tape; "1 ns ≈ 30 cm" becomes its key
const RULER_OUT = TAPE0 - 18;
const CARD2_IN = TAPE0 - 10;
const CARD2_POS = {x: 96, y: 420};
/** The tape key's piece (card px): top left of the plan area, on the floor between the wall and her token. */
const TAPE_KEY = {x: 44, y: 164};
const CHIP_SIZE = 38;
/** The S1.7 card keeps PlanCard's default size (480 x 408) in the left column, inside the margin (x 96..576). */
const CARD2_SIZE = planCardSize();
const CHIP_POS = {x: CARD2_POS.x, y: CARD2_POS.y + CARD2_SIZE.h + 18};
/** The detour wall spot -> him -> wall spot (the extra path, 2|WH| = c x the extra delay). */
const DETOUR = [WP, H, WP];
const DETOUR_M = pathLength(DETOUR);

/* ---- shared progress curves (room and card read the same ones, so they stay in sync frame for frame) */
const routeAt = (g: number) => tw(g, ROUTE0, ROUTE1 - ROUTE0, E.inOut);
/** The wall spot (diamond, wall ellipse, card spot) pops as the route reaches the wall. */
const SPOT0 = ROUTE0 + (ROUTE1 - ROUTE0) * (pathLength([S, WP]) / pathLength([S, WP, H])) - 2;
const route0Spot = (g: number) => (g >= ROUTE0 ? tw(g, SPOT0, 10) : 0);
const tapeAt = (g: number) => tw(g, TAPE0, TAPE1 - TAPE0, E.inOut);
/** When the card's tape (the detour wall spot -> him -> wall spot) reaches him: his rim flashes in the room, in sync. */
const TAPE_TURN = (() => {
  const half = pathLength([WP, H]);
  for (let f = TAPE0; f <= TAPE1; f++) if (tapeAt(f) * DETOUR_M >= half) return f;
  return TAPE1;
})();
/**
 * The lit wall spot's glow (an ellipse on the wall at W3) is light, so it shows only while light is on the wall: it pops
 * with the diamond when the S1.4 route reaches the wall and stays through the S1.5 pulse; it fades once that echo is
 * home (with the S1.5 trails); it lights again when the S1.6 race's pulses reach the wall and fades with the race's
 * trails; and it is on while the S1.7 detour tape runs from it. The diamond marker stays (the card's spot mirrors it). Returns the pop
 * (size, E.back) and the opacity.
 */
const glowAt = (g: number) => {
  const r = RACE_SCHED.vertexFrames;
  const s15 = 1 - tw(g, TRAIL_OUT, 10);
  const race = tw(g, r[1] - 3, 4) * (1 - tw(g, RACE_FADE, 12)); // with the race's own trails
  const tapeOn = tw(g, TAPE0 - 4, 6);
  return {pop: route0Spot(g), op: Math.max(s15, race, tapeOn)};
};
/** The "gap" label (and its leader to the floor) pops as the route reaches the wall spot and turns into the opening;
 *  "blocked" hands over to it, gone just before (its leader would otherwise run past the "blocked" label). */
const GAP_LABEL0 = Math.round(SPOT0);
const BLOCKED_OUT = GAP_LABEL0 - 8;
const gapLabelT = (g: number) => (g >= GAP_LABEL0 ? E.back(clamp01((g - GAP_LABEL0) / 10)) * (1 - tw(g, VF[2] + 8, 14)) : 0);

/* ---- the "gap" label (screen px at CAM_PATH_S1, where the camera holds from RISE_END to PAN0): on the wall above the
 *      slot between her head and the partition's far end (the review r1 D02 shift: 220 px left with the room), its
 *      leader dropping to the opening itself, ON THE FLOOR in the middle of the slot (OCC.x, OCC.z0 / 2, h 0), where
 *      the GapMarker's dashed threshold and outlined patch are. Clearances asserted at module load (end of file). */
const GAP_LABEL_SIZE = 36;
/** Conservative box of the ScreenLabel "gap" at 36 px (Nunito 800 ~63 px of text, 16 px padding, 3 px border). */
const GAP_LABEL = {x: 470, y: 207, w: 110, h: 58};
const camToWorld = (cam: Cam, p: {x: number; y: number}) => ({x: cam.cx + (p.x - 960) / cam.zoom, y: cam.cy + (p.y - 540) / cam.zoom});
const GAP_PT = projectWith(RAISED_VIEW, {x: OCC.x, z: OCC.z0 / 2, h: 0});
/** The S1.4 GapMarker (RoomSet opt-ins): a wider, near-opaque white patch with a dashed ink edge (ink and white only). */
const GAP_MARK = {halfW: 0.18, patchOpacity: 0.9, outline: true};
/** World px (drawn in the backdrop, under the people, the partition and the light): from the label's bottom edge
 *  (clear of its rounded corner) straight down to the floor point. */
const GAP_LEADER = (() => {
  const toScr = worldToScreen(CAM_PATH_S1, GAP_PT.x, GAP_PT.y);
  const x = Math.min(toScr.x, GAP_LABEL.x + GAP_LABEL.w - 18);
  return {from: camToWorld(CAM_PATH_S1, {x, y: GAP_LABEL.y + GAP_LABEL.h + 2}), to: {x: GAP_PT.x, y: GAP_PT.y}};
})();

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2},
  ...STEPS_AT.map((f, i) => ({f, kind: 'tiptoe_step' as const, pitch: [0, -1, 1, -0.5, 0.5, -1.5][i % 6], gain: i === STEPS_AT.length - 1 ? -4 : -1 - (i % 2)})),
  {f: T_ARRIVE + 2, kind: 'cloth_rustle', gain: -6},
  {f: EXHALE + 3, kind: 'smug_exhale'},
  {f: TAP, kind: 'readout_beep'},
  {f: TAP + 2, kind: 'sensor_hum', dur: 3.2, gain: -8},
  {f: BOARD_HIT, kind: 'paper_slap'},
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

/**
 * Sort depth of the sensor stand: painted over the checker at every tilt the scene uses (asserted below). The sensor
 * sits at her chest (the 0.95 m light plane), right by her hanging right arm: painted under her, her sleeve would
 * cover ~39 % of the readout at tilt 0 and her frontal cutout half the sensor that fires the pulse in the raised view.
 * Her tap (S1.2) presses the box's top from behind it (TAP_TARGET).
 */
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
    // still frozen, his eyes follow the ghost straight line as it creeps from the sensor toward him ("doesn't go
    // through") and he braces (shoulders up and in) until it thunks into the partition, so the 1.2 s hold before the
    // thunk is his to play; the relief below takes both back
    const watchLine = tw(g, LINE0 - 2, 10, E.inOut);
    const brace = tw(g, LINE0 + 2, Math.max(6, CONTACT - LINE0 - 2), E.inOut);
    if (watchLine > 0) pose = {...pose, lookX: lerp(pose.lookX, -0.85, watchLine), lookY: lerp(pose.lookY, 0.35, watchLine), hunch: (pose.hunch ?? 0) + 0.08 * brace};
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
    // the light reaches him (with the rim flash): a flinch (blink, wide eyes, small hop), then wary again, as in S3
    // and S9; full on "person" (S1.5), smaller in the S1.6 race (arms crossed)
    for (const [hitF, amt] of [[VF[2], 1], [RACE_SCHED.vertexFrames[2], 0.6]] as const) {
      const fl = pulseAt(g, hitF - 1, 16) * amt;
      if (fl > 0) {
        pose = mixPose2(pose, {...pose, eyes: 1.2, pupil: 0.7, brows: 0.95, browAsym: 0, mouth: 'o', lid: 0, tilt: pose.tilt - 6, hunch: (pose.hunch ?? 0) + 0.05}, fl);
        pose = {...pose, bob: (pose.bob ?? 0) + hop(g, hitF, 6 * amt, 8)};
      }
      if (g >= hitF - 1 && g < hitF + 2) pose = {...pose, blink: 0.1};
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

/** S1.2 tap: where her hand (the mitt's centre) goes, in sensor-local px (HandheldSensor: box x -46..40, top face
 *  y -108..-120), and which IK solution (1 = elbow below the shoulder-hand line). */
const TAP_TARGET = {x: 20, y: -130};
const TAP_ELBOW: 1 | -1 = 1;
/** Her head roll (deg) in the raised room (S1.4-S1.7): a little away from the lit wall spot (see checkerState). */
const HEAD_TILT_RAISED = -4;

const checkerState = (g: number, tilt: number) => {
  const gr = roomFrame(g);
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const lifeIn = tw(g, R1.to, 16, E.inOut);
  const place: RigPlace = {x: op.x, y: op.y, scale: op.scale, frame: gr, seed: CHECKER_SEED, life: 0.35 * lifeIn};
  // where she looks: the readout (default), the guesser (after R1), the webcam, the sensor, the guesser again. From
  // the cut back on (the raised room, where the lit wall spot W3 sits just right of her head) her head rolls a few
  // degrees away from it, so the saffron pencil behind her ear never touches the spot's glow (asserted below).
  const raised = g >= CUT;
  const atReadout = {lookX: 0.62, lookY: 0.32, tilt: raised ? HEAD_TILT_RAISED : 3};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: raised ? HEAD_TILT_RAISED + 1 : -1};
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
    // her palm on the top of the sensor box, over the LED and button column: the box sits by her shoulder at her
    // chest, so the arm folds; the IK solution with the elbow lower keeps the upper arm hanging and brings the
    // forearm up behind the box (the stand paints over her), so the readout stays in full view as it lights
    const tgt = geo.at(TAP_TARGET.x, TAP_TARGET.y);
    pose = mixPose2(pose, {...pose, armR: reach2(place, pose, 1, tgt.x, tgt.y, TAP_ELBOW)}, k);
  }
  if (g < R1.to && (g < SNEAK_GO + 1 || g >= R1_FREEZE - 1)) pose = {...pose, blink: 1};
  return {pose, place};
};

/* ================================================================== the room shot */

/** The room's tilt and camera at a frame (the module-load checks read the same ones). */
const roomTilt = (g: number) => (g < CUT ? 0 : RAISED_TILT * tiltAt(g, RISE0, RISE_DUR));
const roomCam = (g: number): Cam =>
  g < CUT
    ? camPath(g, CAM_ROOM, [{at: PUSH0, dur: PUSH_DUR, to: CAM_PUSH}])
    : camPath(g, CAM_ROOM, [
        {at: RISE0, dur: RISE_DUR, to: CAM_PATH_S1},
        {at: PAN0, dur: PAN_DUR, to: CAM_PATH_SIDE},
      ]);

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const tilt = roomTilt(g);
  const s = viewAt(tilt);
  const toPx = roomToPx(s);
  const cam = roomCam(g);
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
  // the emitter charges from "fires" (S1.5) / 3 frames before the race; on the fire frame the burst flashes at the lens
  // and holds (with the emitter tint) until the pulse head is out of the box, then fades (review r1 D15)
  const fire15 = g < K.fires ? 0 : g < PULSE0 ? 0.35 + 0.65 * tw(g, PULSE0 - 6, 6) : burstAt(g, PULSE0, EMERGE);
  const fireRace = g < RACE0 - 3 ? 0 : g < RACE0 ? tw(g, RACE0 - 3, 3) : burstAt(g, RACE0, RACE_EMERGE);
  const firing = Math.max(fire15, fireRace, pulseAt(g, RT0, 8) * 0.6);
  const burst = Math.max(burstAt(g, PULSE0, EMERGE), burstAt(g, RACE0, RACE_EMERGE));
  const burstRing = burstRingAt(g, PULSE0) ?? burstRingAt(g, RACE0);
  const led = g < TAP ? 0.15 : 1;

  /* ---- light paths (S1.4-S1.7), drawn over the set. Hidden exactly where the camera cannot see them: behind the
   *      partition as drawn (both faces, the arched top band, the end faces, the outline), behind either person
   *      (so the W -> H leg ends at his outline) and inside the sensor box (the pulse leaves its far face). */
  const hidden = roomHides(s, {her: ch.place, him: gu.place});
  // the wall scatter fans (and the wall-spot glow, masked) keep clear of her head and pencil (review r1 D02 / lead L15):
  // light behind her is hidden inside her silhouette grown by HER_CLEAR_W and within PENCIL_CLEAR_W of her pencil's tip
  const tip = pencilTip(ch.place, ch.pose);
  const fanHidden = (p: P2) => hidden(p) || (p.z < LAYOUT.operator.z + 0.05 && nearHer(ch.place, tip, projectWith(s, at3(p))));
  const herMask = <HerClearMask id="s1-her-clear" place={ch.place} tip={tip} />;
  // arrival: the (hidden) pulse reaches him from behind; his wall-side outline flashes (S1.5 and the S1.6 race), and
  // again when the S1.7 card's detour tape reaches him
  const hit = (f: number) => tw(g, f - 1, 3) * (1 - tw(g, f + 6, 10));
  const rim = Math.max(hit(VF[2]), hit(RACE_SCHED.vertexFrames[2]), hit(TAPE_TURN));

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
      // Sort depth only (the stand is always drawn at S): it paints over her at every tilt (STAND_SORT_Z, asserted)
      z: STAND_SORT_Z,
      w: 0.17,
      height: 1.4,
      node: <SensorStand tilt={tilt} sensor={{...readout, led, firing, burst, burstRing}} />,
    },
    {
      key: 'guesser',
      x: gu.planX,
      z: H.z,
      w: 0.3,
      node: <Character2 look={CAST.guesser} pose={gu.pose} frame={gu.frame} seed={GUESSER_SEED} x={gu.place.x} y={gu.place.y} scale={gu.place.scale} life={gu.life} eyeDarts={g >= R1.to} style={{...rigStyle(tilt, gu.place.scale), filter: rimFlash(rim, gu.place.scale)}} />,
    },
  ];

  /* ---- backdrop: the field of view, a frustum from the sensor to its lit patch on the wall (S1.2) */
  const fovOn = g >= FOV0 && g < CUT;
  const fovU = fovOn ? tw(g, FOV0, FOV_GROW, E.out) : 0;
  const patch = fovOn ? tw(g, PATCH0, 10, E.out) : 0;
  const polyPts = (pts: PlanPt[]) => pts.map((p) => projectWith(s, p));
  const polyPath = (qs: {x: number; y: number}[]) => `M ${qs.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ')} Z`;
  const sP = projectWith(s, at3(S));
  // S1.4/S1.5: the opening between the partition's far end and the wall, marked in ink on the floor (GapMarker) while
  // the route is drawn round the end and the pulse goes through it; its label's leader points into the slot.
  const gapIn = tw(g, ROUTE0 - 8, 12, E.out);
  const gapOut = 1 - tw(g, VF[2] + 8, 14);
  const gapT = gapIn * gapOut;
  // the lit wall spot: an ellipse ON the wall plane (real light, so saffron), popping with the diamond marker; it is
  // lit only while light is at the wall (glowAt), the diamond marker stays
  const spotT = route0Spot(g);
  const glow = glowAt(g);
  const backdrop = (
    <>
      {gapT > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: gapOut}}>
          <GapMarker tilt={tilt} t={gapIn} {...GAP_MARK} />
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={`M ${f2(GAP_LEADER.from.x)} ${f2(GAP_LEADER.from.y)} L ${f2(GAP_LEADER.to.x)} ${f2(GAP_LEADER.to.y)}`} stroke={C.inkMuted} strokeWidth={4} strokeLinecap="round" opacity={clamp01(gapLabelT(g))} />
            <circle cx={f2(GAP_LEADER.to.x)} cy={f2(GAP_LEADER.to.y)} r={5} fill={C.inkMuted} opacity={clamp01(gapLabelT(g))} />
          </svg>
        </div>
      )}
      {(fovU > 0 || (glow.pop > 0 && glow.op > 0.01)) && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {fovU > 0 &&
            (() => {
              const sec = polyPts(fovSection(fovU));
              return (
                <g>
                  {/* the travelling cross-section's fill (the patch once it lands; it fills on "plain") */}
                  <path d={polyPath(sec)} fill={C.saffronLight} opacity={f2(0.35 + 0.65 * patch)} />
                  {/* the frustum's corner rays, drawn on with the cross-section, and the ghost cross-sections it leaves */}
                  {sec.map((q, i) => (
                    <path key={i} d={`M ${f2(sP.x)} ${f2(sP.y)} L ${f2(q.x)} ${f2(q.y)}`} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="9 8" strokeLinecap="round" fill="none" opacity={0.75} />
                  ))}
                  {FOV_GHOSTS.filter((u) => fovU >= u).map((u) => (
                    <path key={u} d={polyPath(polyPts(fovSection(u)))} fill="none" stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="10 8" strokeLinejoin="round" opacity={0.45} />
                  ))}
                  <path d={polyPath(sec)} fill="none" stroke={C.saffronDeep} strokeWidth={3.5} strokeDasharray="10 8" strokeLinejoin="round" />
                </g>
              );
            })()}
          {glow.pop > 0 && glow.op > 0.01 && <WallGlow s={s} t={glow.pop} opacity={glow.op} mask={herMask} />}
        </svg>
      )}
    </>
  );

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
  const ghostHit = GHOST_HIT;
  // the route round the end, via the wall (static preview), then faint while the pulse runs
  const route = routeAt(g);
  const routeOp = (1 - 0.75 * tw(g, K.fires, 10)) * (1 - tw(g, TRAIL_OUT, 10));
  const routeHead = route * pathLength([S, WP, H]);
  // the pulse (S1.5)
  const pulseT = SCHED.progress(g);
  const pulseOp = 1 - tw(g, TRAIL_OUT, 12);
  const fanW = tw(g, VF[1], 12);
  const fanWOut = tw(g, VF[1] + 16, 18);
  const fanH = tw(g, VF[2], 10);
  const fanHOut = tw(g, VF[2] + 12, 14);
  // the race (S1.6)
  const raceOp = tw(g, RACE0 - 2, 3) * (1 - tw(g, RACE_FADE, 12));
  const raceFanW = tw(g, RACE_SCHED.vertexFrames[1], 10) * (1 - tw(g, RACE_SCHED.vertexFrames[1] + 14, 14));
  // the light tape from the wall spot to him and back (S1.7): drawn on the card (the room follows with the glow and
  // his rim flash at TAPE_TURN)
  const tape = tapeAt(g);

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
      {route > 0 && <WallSpot p={toPx(WP)} t={spotT} />}
      {/* the slowed pulse S -> W -> H -> W -> S */}
      {g >= PULSE0 && pulseOp > 0 && (
        <>
          <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.62} toPx={toPx} t={fanW} release={fanWOut} layout={OLAYOUT} hidden={fanHidden} seed={5} />
          <ScatterFan asGroup origin={H} dirs={dirsH} length={0.6} toPx={toPx} t={fanH} release={fanHOut} layout={OLAYOUT} hidden={hidden} seed={8} width={3.5} color={C.saffron} />
          <LightPath asGroup points={PATH} toPx={toPx} t={pulseT} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} opacity={pulseOp} />
        </>
      )}
      {/* the race: one flash; the quick echo comes straight back (teal), the rest goes on round him (saffron) */}
      {raceOp > 0 && (
        <g opacity={raceOp}>
          <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.5} toPx={toPx} t={raceFanW > 0 ? 1 : 0} release={1 - raceFanW} layout={OLAYOUT} hidden={fanHidden} seed={6} />
          <LightPath asGroup points={QUICK} toPx={toPx} t={QUICK_SCHED.progress(g)} pulses={3} pulseGap={0.09} color={C.tealDeep} pulseColor={C.teal} intensityFalloff={0.75} layout={OLAYOUT} hidden={hidden} />
          <LightPath asGroup points={PATH} toPx={toPx} t={RACE_SCHED.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} />
        </g>
      )}
      {/* S1.7: the detour is drawn on the card only. In the room its visible stubs (wall spot -> the slot, ~70 px)
          ran on from her saffron pencil in the same direction and read as a beam from her head at phone size; the
          room follows the tape instead with the wall spot's glow (on while the tape runs) and his rim flash when
          the tape reaches him (TAPE_TURN) */}
    </svg>
  );

  /* ---- screen-space labels */
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  const gapLT = gapLabelT(g);
  const blockedT = g >= CONTACT + 2 ? E.back(clamp01((g - CONTACT - 2) / 8)) * (1 - tw(g, BLOCKED_OUT, 8)) : 0;
  const hitScr = scr(toPx(ghostHit));
  // "slowed down" whenever a pulse runs: S1.5 at the bottom right (with the flash note), gone before the S1.6 pan
  // moves him under it; the race's own chip sits in the left column under the arrival card (SideCards)
  const chipsT = tw(g, CHIPS0, 10) * (1 - tw(g, CHIPS_OUT, 10));
  // "seen from above": S1.4-S1.5 top right; S1.7 in the left column (the ruler card's slot)
  // entries are LINEAR: PlanCard applies the only ease (E.out on its slide), review r1 D16
  const cardT = g >= CUT ? tw(g, CARD_IN, CARD_IN_DUR, E.linear) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut)) : 0;
  const card2T = tw(g, CARD2_IN, 14, E.linear);
  const tokens = {checker: {x: LAYOUT.operator.x, z: LAYOUT.operator.z}, guesser: {x: gu.planX, z: H.z}};

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
      {/* S1.4 the gap the route goes through: on the wall above the slot (its leader is in the backdrop) */}
      {gapLT > 0 && (
        <ScreenLabel x={GAP_LABEL.x + GAP_LABEL.w / 2} y={GAP_LABEL.y + GAP_LABEL.h / 2} anchor="middle" t={gapLT} size={GAP_LABEL_SIZE} color={C.inkSoft}>
          gap
        </ScreenLabel>
      )}
      {/* S1.5 guard-rail chips */}
      {chipsT > 0 && (
        <div style={{position: 'absolute', right: 96, top: 790, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', opacity: chipsT, transform: `translateY(${f2((1 - E.out(chipsT)) * -10)}px)`}}>
          <Pill tone="saffron">slowed down</Pill>
          <Pill tone="paper">invisible flash (shown for clarity)</Pill>
        </div>
      )}
      {/* S1.4-S1.5 seen from above: the same blocked line, route and pulse, on the same schedules, in plan */}
      {cardT > 0 && (
        <PlanCard
          x={CARD_POS.x}
          y={CARD_POS.y}
          t={cardT}
          area={S1_CARD_AREA}
          view={S1_CARD_VIEW}
          {...tokens}
          sensor={{firing, burst, burstRing}}
          gap={gapT}
          light={(tp) => (
            <>
              {ghost > 0 && (
                <path
                  d={`M ${f2(tp(S).x)} ${f2(tp(S).y)} L ${f2(lerp(tp(S).x, tp(ghostHit).x, ghost))} ${f2(lerp(tp(S).y, tp(ghostHit).y, ghost))}`}
                  stroke={C.saffronDeep}
                  strokeWidth={5 * S1_CARD_K}
                  strokeDasharray={`${4 * S1_CARD_K} ${10 * S1_CARD_K}`}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85 * (1 - tw(g, K.fires, 12))}
                />
              )}
              {route > 0 && routeOp > 0 && <PlanRoute points={[S, WP, H]} head={routeHead} toPx={tp} opacity={routeOp} width={6 * S1_CARD_K} dash={`${12 * S1_CARD_K} ${9 * S1_CARD_K}`} />}
              {g >= PULSE0 && pulseOp > 0 && (
                <>
                  <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.62} toPx={tp} t={fanW} release={fanWOut} layout={OLAYOUT} seed={5} width={3.5 * S1_CARD_K} />
                  <ScatterFan asGroup origin={H} dirs={dirsH} length={0.6} toPx={tp} t={fanH} release={fanHOut} layout={OLAYOUT} seed={8} width={3 * S1_CARD_K} color={C.saffron} />
                  <LightPath asGroup points={PATH} toPx={tp} t={pulseT} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={6 * S1_CARD_K} pulseRadius={11 * S1_CARD_K} lane={11 * S1_CARD_K} ringRadius={34 * S1_CARD_K} opacity={pulseOp} />
                </>
              )}
            </>
          )}
          marks={(tp) => (
            <>
              {ghost > 0 && g >= CONTACT && <PlanCross x={tp(ghostHit).x - 14 * S1_CARD_K} y={tp(ghostHit).y} s={9 * S1_CARD_K * E.back(clamp01((g - CONTACT) / 6)) * (1 - tw(g, K.fires, 12))} />}
              {route > 0 && <PlanSpot {...tp(WP)} t={spotT} r={9 * S1_CARD_K} />}
            </>
          )}
        />
      )}
      {/* S1.7 the detour as a tape ticked every nanosecond of path, in the ruler card's slot */}
      {card2T > 0 && (
        <PlanCard
          x={CARD2_POS.x}
          y={CARD2_POS.y}
          t={card2T}
          {...tokens}
          sensor={{}}
          marks={(tp, ppm) => (
            <>
              <PlanSpot {...tp(WP)} t={1} />
              <PlanTapeLanes points={DETOUR} head={tape * DETOUR_M} toPx={tp} />
              <TapeKey x={TAPE_KEY.x} y={TAPE_KEY.y} ppm={ppm} t={tw(g, CARD2_IN + 6, 10)} />
            </>
          )}
        />
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

/** The lit wall spot on the wall plane (z = 0) at WP, centred on the light plane: WALL_GLOW_M wide and high, saffron
 *  (it is real light), dashed rim; pops with the diamond marker. Drawn in the backdrop, so the people and the
 *  partition paint over it. */
/** 0.18 x 0.12 m (the plan's 0.24 x 0.16 m put its rim ~12 px from her head and on her pencil tip at the raised view;
 *  clearances asserted at module load). */
const WALL_GLOW_M = {w: 0.18, h: 0.12};
const wallGlowRect = (s: ViewState, k = 1) => {
  const c = projectWith(s, at3(WP));
  return {cx: c.x, cy: c.y, rx: (WALL_GLOW_M.w / 2) * s.ppm * k, ry: (WALL_GLOW_M.h / 2) * s.ppm * s.height * k};
};
const WallGlow: React.FC<{s: ViewState; t: number; opacity?: number; mask?: React.ReactElement<{id: string}>}> = ({s, t, opacity = 1, mask}) => {
  const k = E.back(clamp01(t));
  if (k <= 0.01) return null;
  const e = wallGlowRect(s, k);
  return (
    <g mask={mask ? `url(#${mask.props.id})` : undefined}>
      {mask}
      <ellipse cx={f2(e.cx)} cy={f2(e.cy)} rx={f2(e.rx)} ry={f2(e.ry)} fill={C.saffronLight} stroke={C.saffronDeep} strokeWidth={3} strokeDasharray="9 7" opacity={f2(clamp01(opacity))} />
    </g>
  );
};

/**
 * Light kept clear of her (review r1 D02, lead L15: the scatter fan and the glow are clipped rather than moving her, so
 * the S1.1-S1.7 continuity holds): her silhouette (Cast2 rigCovers) grown by HER_CLEAR_W world px, plus a disc of
 * PENCIL_CLEAR_W around her pencil's tip, which points at the wall spot from behind her ear. At the S1.4 zoom (1.25)
 * that is 30 px around the silhouette (already ~40 px outside her drawn ear) and 40 px around the tip.
 */
const HER_CLEAR_W = 24;
const PENCIL_CLEAR_W = 32;
const nearHer = (place: RigPlace, tip: Pt, q: Pt) => rigCovers(place, q, HER_CLEAR_W) || Math.hypot(q.x - tip.x, q.y - tip.y) < PENCIL_CLEAR_W;
/** The same zone as an SVG mask (white = shown): rigCovers' head ellipse, torso and legs rectangles, grown, and the disc. */
const HerClearMask: React.FC<{id: string; place: RigPlace; tip: Pt}> = ({id, place, tip}) => {
  const k = place.scale;
  const gr = HER_CLEAR_W;
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={10000} height={10000}>
      <rect x={-4000} y={-4000} width={10000} height={10000} fill="white" />
      <ellipse cx={f2(place.x)} cy={f2(place.y - 388 * k)} rx={f2(92 * k + gr)} ry={f2(100 * k + gr)} fill="black" />
      <rect x={f2(place.x - 82 * k - gr)} y={f2(place.y - 300 * k - gr)} width={f2(2 * (82 * k + gr))} height={f2(160 * k + gr)} fill="black" />
      <rect x={f2(place.x - 60 * k - gr)} y={f2(place.y - 140 * k)} width={f2(2 * (60 * k + gr))} height={f2(140 * k)} fill="black" />
      <circle cx={f2(tip.x)} cy={f2(tip.y)} r={PENCIL_CLEAR_W} fill="black" />
    </mask>
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
  const C0 = INSET_C0;
  const R = INSET_R;
  const sensorScr = worldToScreen(cam, sensorWorld.x, sensorWorld.y);
  const leader = tw(g, CAMI_SWAP + 6, 10, E.out) * (1 - insetOut);
  const rt = g < RT0 ? 0 : (g - RT0) / 26; // close-up round trip (0..1 travel, then the trail fades)

  // ruler card (s08): out just before the PlanCard takes its slot for the tape
  const rulerIn = tw(g, RULER0, 14, E.out) * (1 - tw(g, RULER_OUT, 8, E.inOut));
  // the race's "slowed down" chip
  const raceChip = tw(g, RACE_CHIP_IN, 10) * (1 - tw(g, CAMI0 - 12, 10));
  const rulerPulse = (g - RULER_PULSE0) / (RULER_PULSE1 - RULER_PULSE0);
  const first = tw(g, K.nanosecond - 4, 10);
  const head = tw(g, RULER0, 8); // the headline arrives with the card (review r1 D18)
  const extraT = tw(g, EXTRA0, 12, E.out);

  const inset = insetIn * (1 - insetOut);
  return (
    <>
      {raceT > 0 && (
        <div style={{position: 'absolute', left: 96, top: 60, opacity: clamp01(raceT * 2), transform: `translateX(${f2((1 - raceT) * -60)}px)`}}>
          <ArrivalRace tQuick={NS_QUICK} tLong={NS_LONG} quick={quick} long={long} bracket={bracket} glow={glow} width={780} />
        </div>
      )}
      {raceChip > 0 && (
        <div style={{position: 'absolute', left: RACE_CHIP_POS.x, top: RACE_CHIP_POS.y, opacity: raceChip, transform: `translateY(${f2((1 - E.out(raceChip)) * -10)}px)`}}>
          <Pill tone="saffron">slowed down</Pill>
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
        // on a cream backing: after the pan the room's floor edge runs under the end of the second line
        <div style={{position: 'absolute', left: TOF_BOX.x, top: TOF_BOX.y, opacity: labelT, transform: `translateY(${f2((1 - labelT) * 10)}px)`, fontFamily: F.body, fontWeight: 800, fontSize: TOF_BOX.size, lineHeight: TOF_BOX.lineH, color: C.ink, background: C.cream, border: `3px solid ${C.inkMuted}`, borderRadius: 16, padding: `${TOF_BOX.pad}px 18px`}}>
          <div style={{color: C.tealDeep}}>time-of-flight sensor:</div>
          <div>{"times its own light's round trip"}</div>
        </div>
      )}
      {rulerIn > 0 && (
        <div style={{position: 'absolute', left: 96, top: 420, opacity: clamp01(rulerIn * 2), transform: `translateX(${f2((1 - rulerIn) * -60)}px)`}}>
          <RulerCard t={rulerIn} pulse={rulerPulse} first={first} head={head} width={780} />
        </div>
      )}
      {/* below the S1.7 PlanCard */}
      {extraT > 0 && (
        <div style={{position: 'absolute', left: CHIP_POS.x, top: CHIP_POS.y, opacity: extraT, transform: `translateY(${f2((1 - extraT) * 10)}px)`}}>
          <Pill tone="saffron" size={CHIP_SIZE}>
            extra delay → extra distance
          </Pill>
        </div>
      )}
    </>
  );
};

/** Scale of the sensor close-up in the inset (outlines stay 4 px: NSS). */
const CLOSE_K = 2.3;
/** The webcam / sensor close-up inset (screen px): centre and radius. */
const INSET_C0 = {x: 330, y: 620};
const INSET_R = 200;
/** The close-up's label box: its text keeps the left margin (x 96) and starts 18 px under the inset; a cream backing
 *  (3 px border, `pad` px top and bottom) so the room's floor edge never runs through the text after the pan. Two
 *  36 px lines at line-height 1.18; its bottom is asserted above the caption band. */
const TOF_BOX = {x: 96 - 18 - 3, y: INSET_C0.y + INSET_R + 18 - 6 - 3, pad: 6, lines: 2, size: 36, lineH: 1.18};

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
  const cam = camPath(SWING0, CAM_ROOM, [{at: PUSH0, dur: PUSH_DUR, to: CAM_PUSH}]);
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

/* ================================================================== module-load checks (they throw; never downgraded) */

type Pt = {x: number; y: number};
type Box = {x: number; y: number; w: number; h: number};

/** Clearances of the lit wall spot's glow and the wall scatter fans from her (screen px, at every zoom they are seen
 *  at). The glow is masked and the fans clipped by HER_CLEAR_W / PENCIL_CLEAR_W (nearHer), so these hold by
 *  construction at the smallest zoom (1.15): 24 x 1.15 = 27.6 and 32 x 1.15 = 36.8; a fan ray's tip dot (r ~6.4 world px)
 *  may sit ~7 px nearer than its ray. */
const GLOW_HEAD_PX = 27;
const GLOW_PENCIL_PX = 36;
const FAN_HEAD_PX = 20;
const FAN_PENCIL_PX = 29;
/** The partition's drawn ink top sits ~10 px above the projected partitionTopH point at the S1.1 framing (the 4 px
 *  outline and the panel's top rim), measured on the full-res frame 0 render; the framing check allows for it. */
const PARTITION_INK_ABOVE_PX = 10;
/** The tripod's legs as drawn (SensorStand: the hub 58 % of the way up to the mount plate, three feet), world px. */
const tripodLegs = (tilt: number) => {
  const geo = standGeometry(tilt);
  const P = (x: number, z: number, h = 0) => projectWith(viewAt(tilt), {x, z, h});
  const hubP = P(PTS.S.x, PTS.S.z, Math.max(0.05, geo.hPlate * 0.58));
  const hub = {x: geo.mount.x + (hubP.x - P(PTS.S.x, PTS.S.z, geo.hPlate).x), y: hubP.y};
  return [P(PTS.S.x - 0.16, PTS.S.z + 0.1), P(PTS.S.x + 0.17, PTS.S.z + 0.08), P(PTS.S.x + 0.01, PTS.S.z - 0.17)].map((f) => [hub, {x: f.x, y: f.y}] as const);
};
const segDistance = (q: Pt, a: Pt, b: Pt) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const u = clamp01(((q.x - a.x) * vx + (q.y - a.y) * vy) / Math.max(1e-9, vx * vx + vy * vy));
  return Math.hypot(q.x - (a.x + vx * u), q.y - (a.y + vy * u));
};
/** Her pencil's tip (world px). Cast2 draws the pencil at head-local (HEAD_R - 6, HEAD_Y - 20) rotated -70 deg, 60 rig px
 *  long plus a 10 px point, so its tip is 89.6 rig px right of her eyes' point along the head's own horizontal axis
 *  (HEAD_R 58). The head's axes come from eyesWorld and mouthWorld, 40 rig px apart on its vertical axis, so the tip
 *  follows the head's roll, lean, bob and idle drift. */
const PENCIL_TIP_RIG = 89.6;
const pencilTip = (place: RigPlace, pose: Pose2): Pt => {
  const e = eyesWorld(place, pose);
  const m = mouthWorld(place, pose);
  const up = {x: (e.x - m.x) / 40, y: (e.y - m.y) / 40};
  const right = {x: -up.y, y: up.x};
  return {x: e.x + right.x * PENCIL_TIP_RIG, y: e.y + right.y * PENCIL_TIP_RIG};
};

/** The wall-plane point (z = 0) under a world-px point at a view (projectWith inverted on the plane z = 0). */
const wallPointAt = (s: ViewState, q: Pt): PlanPt => ({
  x: s.pivot.x + (q.x - s.ax) / s.ppm + s.shear * s.pivot.z,
  z: 0,
  h: s.pivot.h + (s.ay - s.ppm * s.floor * s.pivot.z - q.y) / (s.ppm * Math.max(1e-6, s.height)),
});
/** Is world-px point q within `d` world px of the partition as drawn (its silhouette incl. the ink outline)? Tested on
 *  the wall plane behind it: a wall point is hidden exactly where the drawn partition covers it on screen. */
const nearPartition = (s: ViewState, q: Pt, d: number) => {
  if (hiddenByPartition(wallPointAt(s, q), s)) return true;
  for (let k = 0; k < 24 && d > 0; k++) {
    const a = (k / 24) * Math.PI * 2;
    if (hiddenByPartition(wallPointAt(s, {x: q.x + d * Math.cos(a), y: q.y + d * Math.sin(a)}), s)) return true;
  }
  return false;
};
/** Screen points covering a screen box (border and interior, every 4 px), mapped to world px through `cam`. */
const boxSamples = (b: Box, cam: Cam): Pt[] => {
  const out: Pt[] = [];
  const nx = Math.ceil(b.w / 4);
  const ny = Math.ceil(b.h / 4);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) out.push(camToWorld(cam, {x: b.x + (b.w * i) / nx, y: b.y + (b.h * j) / ny}));
  return out;
};
const boxGap = (a: Box, b: Box) => {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0);
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0);
  return dx > 0 || dy > 0 ? Math.hypot(dx, dy) : -Math.min(a.x + a.w - b.x, b.x + b.w - a.x, a.y + a.h - b.y, b.y + b.h - a.y);
};
const toScreenBox = (cam: Cam, x0: number, y0: number, x1: number, y1: number): Box => {
  const a = worldToScreen(cam, x0, y0);
  const b = worldToScreen(cam, x1, y1);
  return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y};
};
/** The tripod stand as drawn (sensor box with its lens rims, column, legs and feet), world px. */
const standBox = (tilt: number) => {
  const geo = standGeometry(tilt);
  const feet = [
    {x: PTS.S.x - 0.16, z: PTS.S.z + 0.1},
    {x: PTS.S.x + 0.17, z: PTS.S.z + 0.08},
    {x: PTS.S.x + 0.01, z: PTS.S.z - 0.17},
  ].map((f) => projectWith(viewAt(tilt), {...f, h: 0}));
  const xs = [geo.box.x0, geo.box.x1, ...feet.map((f) => f.x - 9), ...feet.map((f) => f.x + 9)];
  const ys = [geo.box.y0 - 12 * geo.k, geo.box.y1, ...feet.map((f) => f.y + 5)];
  return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
};
/** Screen box of the guesser's figure at a view and camera, with his arms akimbo (HANDS_ON_HIPS elbows). */
const guesserBox = (tilt: number, cam: Cam) => {
  const pl = rigAt(H.x, H.z, tilt);
  const elbow = handPos(HANDS_ON_HIPS.armR!, 1).ex + 15 + 4; // half the 30 px sleeve plus the outline
  const ext = Math.max(92, 82, elbow);
  return toScreenBox(cam, pl.x - ext * pl.scale, pl.y - 488 * pl.scale, pl.x + ext * pl.scale, pl.y);
};
/** Approximate screen box of a ScreenLabel centred at (cx, cy). */
const labelBox = (cx: number, cy: number, text: string, size: number, display: boolean): Box => {
  const w = text.length * size * (display ? 0.56 : 0.58) + 32 + 6;
  const h = size + 15 + 6;
  return {x: cx - w / 2, y: cy - h / 2, w, h};
};

export const S1_MARGINS = (() => {
  const fail = (msg: string) => {
    throw new Error(`S1: ${msg}`);
  };
  const s = RAISED_VIEW;
  const zoom = CAM_PATH_S1.zoom;
  // --- timing: light only on the settled raised view; the card in before the blocked line and out before the pan
  if (LINE0 < RISE_END) fail('light would be drawn during the rise');
  if (CARD_IN + CARD_IN_DUR > LINE0) fail(`the plan card is not in before the blocked line (${CARD_IN + CARD_IN_DUR} > ${LINE0})`);
  if (PULSE1 > CARD_OUT) fail('the plan card leaves before its pulse is back at the sensor');
  if (CARD_OUT + CARD_OUT_DUR > PAN0) fail('the plan card is still in when the S1.6 pan starts');
  if (GAP_LABEL0 < RISE_END || VF[2] + 22 > PAN0) fail('the gap label must show only while the camera holds CAM_PATH_S1');
  if (BLOCKED_OUT - (CONTACT + 10) < 30) fail(`"blocked" is fully up only ${BLOCKED_OUT - CONTACT - 10} frames (needs 30)`);
  if (BLOCKED_OUT + 8 > GAP_LABEL0) fail('"blocked" must be gone before the gap label and its leader come in');
  if (CARD2_IN < INSET_OUT + 10) fail('the S1.7 card would overlap the webcam inset');
  if (CHIPS_OUT + 10 > PAN0) fail('the S1.5 chips are still in when the pan moves him under them');
  if (CAMI0 - 2 < RACE_CHIP_IN + 10 || RACE_SCHED.end > CAMI0 - 12) fail('the race chip must be in while the race runs and out before the webcam inset');
  if (RULER_OUT + 8 > CARD2_IN) fail('the ruler card must be out before the S1.7 plan card comes in');
  // --- the "gap" label: >= 12 px from the partition as drawn, her head, the wall-spot ellipse and the tripod
  const pts = boxSamples(GAP_LABEL, CAM_PATH_S1);
  const her = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
  const glow = wallGlowRect(s, 1.1); // E.back overshoot
  const gapPartition = clearance((d) => pts.some((q) => nearPartition(s, q, d)), 60) * zoom;
  const gapHead = clearance((gr) => pts.some((q) => rigCovers(her, q, gr))) * zoom;
  const gapGlow = clearance((gr) => pts.some((q) => ((q.x - glow.cx) / (glow.rx + gr)) ** 2 + ((q.y - glow.cy) / (glow.ry + gr)) ** 2 < 1)) * zoom;
  const sb = standBox(RAISED_TILT);
  const gapTripod = boxGap(GAP_LABEL, toScreenBox(CAM_PATH_S1, sb.x0, sb.y0, sb.x1, sb.y1));
  for (const [what, v] of [['partition', gapPartition], ['her head', gapHead], ['wall spot', gapGlow], ['tripod', gapTripod]] as const) {
    if (v < 12) fail(`the "gap" label is ${v.toFixed(0)} px from the ${what} (needs 12)`);
  }
  // the leader: clear of her head, of the partition as drawn and of the tripod's legs (>= 12 px), and it ends on the
  // floor INSIDE the opening (between the wall and the partition's far end, on the partition's line)
  const lead = Array.from({length: 81}, (_, i) => ({x: lerp(GAP_LEADER.from.x, GAP_LEADER.to.x, i / 80), y: lerp(GAP_LEADER.from.y, GAP_LEADER.to.y, i / 80)}));
  if (lead.some((q) => rigCovers(her, q, 4) || nearPartition(s, q, 4))) fail('the gap leader touches her head or the partition');
  const legs = tripodLegs(RAISED_TILT);
  const leadTripod = Math.min(...lead.map((q) => Math.min(...legs.map(([a, b]) => segDistance(q, a, b))))) * zoom - (9 + 4) / 2;
  if (leadTripod < 12) fail(`the gap leader is ${leadTripod.toFixed(0)} px from a tripod leg (needs 12)`);
  const slot0 = projectWith(s, {x: OCC.x, z: 0, h: 0});
  const slot1 = projectWith(s, {x: OCC.x, z: OCC.z0, h: 0});
  if (GAP_LEADER.to.y <= slot0.y + 10 || GAP_LEADER.to.y >= slot1.y - 10) fail('the gap leader does not end on the floor inside the opening');
  // --- the plan card (S1.4-S1.5, 1.5x): inside the 5 % margin (its tape too), clear of him, the gap and blocked labels
  //     and the S1.5 chips
  const card: Box = {...CARD_POS, ...CARD_SIZE};
  if (card.x < 1920 * 0.05 || card.x + card.w > 1920 * 0.95 || card.y - CARD_TAPE_RISE < 1080 * 0.05) fail(`the plan card (${card.x}, ${card.y}, ${card.w} x ${card.h}) or its tape is outside the 5 % margin`);
  if (card.y + card.h > 1080 * 0.88) fail('the plan card reaches into the caption band');
  const cardHim = boxGap(card, guesserBox(RAISED_TILT, CAM_PATH_S1));
  if (cardHim < 24) fail(`the plan card is ${cardHim.toFixed(0)} px from him (needs 24)`);
  const hitW = projectWith(s, at3(GHOST_HIT));
  const hit = worldToScreen(CAM_PATH_S1, hitW.x, hitW.y);
  const blocked = labelBox(hit.x + 34, hit.y + 112, 'blocked', 46, true);
  const chips: Box = {x: 1920 - 96 - 640, y: 790, w: 640, h: 128};
  const labelGaps = {cardBlocked: boxGap(card, blocked), cardGapLabel: boxGap(card, GAP_LABEL), cardChips: boxGap(card, chips), gapBlocked: boxGap(GAP_LABEL, blocked)};
  for (const [k, v] of Object.entries(labelGaps)) if (v < 20) fail(`${k} only ${v.toFixed(0)} px apart (needs 20)`);
  // --- the S1.7 card in the left column: below the arrival card, clear of her, the chip above the caption band
  const card2: Box = {...CARD2_POS, ...CARD2_SIZE};
  if (card2.x < 1920 * 0.05 || card2.y - CARD_TAPE_RISE < 1080 * 0.05) fail('the S1.7 card is outside the 5 % margin');
  const race: Box = {x: 96, y: 60, w: 780, h: 318};
  const herSide = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
  const herBox = toScreenBox(CAM_PATH_SIDE, herSide.x - 92 * herSide.scale, herSide.y - 488 * herSide.scale, herSide.x + 92 * herSide.scale, herSide.y);
  const chipBottom = CHIP_POS.y + CHIP_SIZE * 1.05 + 2 * 0.26 * CHIP_SIZE + 6;
  const card2Gaps = {raceCard: boxGap(card2, race), her: boxGap(card2, herBox)};
  for (const [k, v] of Object.entries(card2Gaps)) if (v < 20) fail(`the S1.7 card is ${v.toFixed(0)} px from the ${k} (needs 20)`);
  if (chipBottom > 1080 * 0.88) fail(`the S1.7 chip reaches into the caption band (bottom ${chipBottom.toFixed(0)})`);
  // --- the S1.2 tap (tilt 0): her palm on the box top, contact error <= 1 px while it is held
  let tapErr = 0;
  for (let g = TAP; g <= TAP + 6; g++) {
    const c = checkerState(g, 0);
    const tgt = standGeometry(0).at(TAP_TARGET.x, TAP_TARGET.y);
    const hand = handWorld2(c.place, c.pose, 1);
    tapErr = Math.max(tapErr, Math.hypot(hand.x - tgt.x, hand.y - tgt.y));
  }
  if (tapErr > 1) fail(`the tap misses the sensor by ${tapErr.toFixed(1)} px`);
  // --- framing (review r1 D12): the partition's drawn ink top (far panel middle and far corner, less the ink allowance)
  //     stays below the 5 % line (54 px) at the S1.1 framing, through the S1.2 push, every step of the rise and the S1.6
  //     side framing; her shoes and the near partition foot stay in frame at the tilt-0 framings
  let topMin = Infinity;
  for (const [tilt, cam] of [[0, CAM_ROOM], [0, CAM_PUSH], ...LIGHT_TILTS.map((t, i) => [t, camPath(RISE0 + (RISE_DUR * i) / 4, CAM_ROOM, [{at: RISE0, dur: RISE_DUR, to: CAM_PATH_S1}])] as const), [RAISED_TILT, CAM_PATH_S1], [RAISED_TILT, CAM_PATH_SIDE]] as [number, Cam][]) {
    const sv = viewAt(tilt);
    for (const z of [OCC.z0, OCC.z0 + (OCC.z1 - OCC.z0) / 6]) {
      const q = projectWith(sv, {x: OCC.x, z, h: partitionTopH(z)});
      topMin = Math.min(topMin, worldToScreen(cam, q.x, q.y).y - PARTITION_INK_ABOVE_PX);
    }
  }
  if (topMin < 1080 * 0.05) fail(`the partition's top is ${topMin.toFixed(0)} px from the frame top (needs ${1080 * 0.05})`);
  const her0Shoes = worldToScreen(CAM_ROOM, rigAt(LAYOUT.operator.x, LAYOUT.operator.z, 0).x, rigAt(LAYOUT.operator.x, LAYOUT.operator.z, 0).y).y;
  const nearFootQ = projectWith(viewAt(0), {x: OCC.x, z: OCC.z1, h: 0});
  const nearFoot = worldToScreen(CAM_ROOM, nearFootQ.x, nearFootQ.y).y;
  if (her0Shoes > 950 || nearFoot > 1080) fail(`the S1.1 framing loses her shoes (${her0Shoes.toFixed(0)}) or the near partition foot (${nearFoot.toFixed(0)})`);
  // --- S1.2 field of view (review r1 D01): the frustum's corner rays and cross-sections obey the room light rule at
  //     tilt 0 at both S1.2 zooms (they are drawn in the backdrop, under her and the partition)
  const fovLegs: PlanPt[][] = FOV_CORNERS.map(([x, h]) => [at3(S), {x, z: 0, h}]);
  for (const u of [0.2, 0.35, 0.5, 0.7, 0.85, 1]) {
    const sec = fovSection(u);
    for (let i = 0; i < 4; i++) fovLegs.push([sec[i], sec[(i + 1) % 4]]);
  }
  for (const z of [CAM_ROOM.zoom, CAM_PUSH.zoom]) assertAroundTheEnd('S1.2 field of view', fovLegs, viewAt(0), {zoom: z, allowFront: true});
  if (FOV0 + FOV_GROW > PATCH0) fail('the field of view must reach the wall before the patch fills ("plain")');
  // --- the fire flash (review r1 D15): on the sensor_pulse cue frames, held until the pulse is out of the box
  for (const [f0, em, what] of [[PULSE0, EMERGE, 'S1.5'], [RACE0, RACE_EMERGE, 'race']] as const) {
    if (!SFX.some((c) => c.kind === 'sensor_pulse' && c.f === f0)) fail(`the ${what} sensor_pulse cue is not on the burst frame`);
    if (burstAt(f0, f0, em) !== 1 || em - f0 > 12) fail(`the ${what} burst does not cover the fire frame up to the pulse leaving the box (${f0}..${em})`);
  }
  // --- the board's paper_slap on its contact (review r1 D14): the board is at (or past) full size on that frame
  if (BOARD_HIT < SWING0 || BOARD_HIT > LAND || E.softBack(clamp01((BOARD_HIT - SWING0) / SWING)) < 1) fail(`the paper_slap (${BOARD_HIT}) is not on the board's arrival`);
  // --- S1.2: the lit wall patch shows >= 0.30 m (to the centimetre) of bare wall between her and the partition at
  //     every height it spans (h 0.58-1.32 m); the narrowest is beside her shoulder, ~1.18 m
  const s0 = viewAt(0);
  const her0 = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, 0);
  const zone = (LAYOUT as unknown as {frames: {A: {zoneEdgesX: number[]}}}).frames.A.zoneEdgesX;
  let patchMin = Infinity;
  for (let h = LIGHT_H - 0.37; h <= LIGHT_H + 0.37 + 1e-9; h += 0.02) {
    let run = 0;
    let best = 0;
    for (let x = zone[0]; x <= zone[zone.length - 1] + 1e-9; x += 0.0025) {
      const p = {x, z: 0, h};
      const vis = !hiddenByPartition(p, s0) && !rigCovers(her0, projectWith(s0, p));
      run = vis ? run + 0.0025 : 0;
      best = Math.max(best, run);
    }
    patchMin = Math.min(patchMin, best);
  }
  if (patchMin < 0.295) fail(`the S1.2 wall patch shows only ${patchMin.toFixed(3)} m of bare wall`);
  // --- the lit wall spot's glow reads ON THE WALL, not off her head: on every frame it shows (glowAt), at that frame's
  //     pop size and camera zoom, its VISIBLE part (the ellipse, rim and interior, less the HerClearMask) keeps
  //     >= GLOW_HEAD_PX from her head (rigCovers) and >= GLOW_PENCIL_PX from her pencil's tip, which points at it from
  //     behind her ear; and most of it shows (the mask only trims its near edge)
  let glowHead = Infinity;
  let glowPencil = Infinity;
  let glowShown = Infinity;
  for (let g = ROUTE0; g < K.end; g++) {
    const gl = glowAt(g);
    if (gl.pop <= 0 || gl.op <= 0.01) continue;
    if (roomTilt(g) !== RAISED_TILT) fail(`the wall glow shows before the camera has settled (frame ${g})`);
    const zoom = roomCam(g).zoom;
    const e = wallGlowRect(s, E.back(clamp01(gl.pop)));
    const samples: Pt[] = [];
    for (let r = 0.25; r <= 1.0001; r += 0.25) for (let i = 0; i < 72; i++) samples.push({x: e.cx + r * e.rx * Math.cos((i / 72) * Math.PI * 2), y: e.cy + r * e.ry * Math.sin((i / 72) * Math.PI * 2)});
    const ch = checkerState(g, RAISED_TILT);
    const tip = pencilTip(ch.place, ch.pose);
    const vis = samples.filter((q) => !nearHer(ch.place, tip, q));
    glowShown = Math.min(glowShown, vis.length / samples.length);
    if (!vis.length) continue;
    glowHead = Math.min(glowHead, clearance((gr) => vis.some((q) => rigCovers(ch.place, q, gr)), 100) * zoom);
    glowPencil = Math.min(glowPencil, Math.min(...vis.map((q) => Math.hypot(q.x - tip.x, q.y - tip.y))) * zoom);
  }
  if (glowHead < GLOW_HEAD_PX) fail(`the wall-spot glow is ${glowHead.toFixed(0)} px from her head (needs ${GLOW_HEAD_PX})`);
  if (glowPencil < GLOW_PENCIL_PX) fail(`the wall-spot glow is ${glowPencil.toFixed(0)} px from her pencil's tip (needs ${GLOW_PENCIL_PX})`);
  if (glowShown < 0.8) fail(`the mask hides ${((1 - glowShown) * 100).toFixed(0)} % of the wall-spot glow (at most 20 %)`);
  // --- the wall scatter fans (S1.5 and the race) keep clear of her head and pencil too: every visible stretch of every
  //     ray, as ScatterFan draws it with the room's fan hidden test, and every visible tip dot (r ~6.4 world px)
  let fanHead = Infinity;
  let fanPencil = Infinity;
  const raceV1 = RACE_SCHED.vertexFrames[1];
  for (const [f0, f1, len, seed] of [[VF[1], VF[1] + 34, 0.62, 5], [raceV1, raceV1 + 28, 0.5, 6]] as const) {
    for (let g = Math.floor(f0); g <= Math.ceil(f1); g++) {
      if (roomTilt(g) !== RAISED_TILT) fail(`a wall fan shows before the camera has settled (frame ${g})`);
      const zoomG = roomCam(g).zoom;
      const ch = checkerState(g, RAISED_TILT);
      const gu = guesserState(g, RAISED_TILT);
      const tip = pencilTip(ch.place, ch.pose);
      const hid = roomHides(s, {her: ch.place, him: gu.place});
      const fanHid = (p: P2) => hid(p) || (p.z < LAYOUT.operator.z + 0.05 && nearHer(ch.place, tip, projectWith(s, at3(p))));
      for (const [a, b] of fanRays(WP, dirsW, len, seed)) {
        const A = {x: a.x, z: a.z};
        const B = {x: b.x, z: b.z};
        const vis: {q: Pt; r: number}[] = [];
        for (const [u0, u1] of visibleIntervals(A, B, fanHid, 16)) for (let k = 0; k <= 24; k++) vis.push({q: projectWith(s, at3(lerpP(A, B, lerp(u0, u1, k / 24)))), r: 0});
        if (!fanHid(B)) vis.push({q: projectWith(s, at3(B)), r: 6.4});
        for (const {q, r} of vis) {
          fanHead = Math.min(fanHead, (clearance((gr) => rigCovers(ch.place, q, gr), 200) - r) * zoomG);
          fanPencil = Math.min(fanPencil, (Math.hypot(q.x - tip.x, q.y - tip.y) - r) * zoomG);
        }
      }
    }
  }
  if (fanHead < FAN_HEAD_PX) fail(`a wall scatter-fan ray is ${fanHead.toFixed(0)} px from her (needs ${FAN_HEAD_PX})`);
  if (fanPencil < FAN_PENCIL_PX) fail(`a wall scatter-fan ray is ${fanPencil.toFixed(0)} px from her pencil's tip (needs ${FAN_PENCIL_PX})`);
  // --- the close-up's label box above the caption band
  const tofBottom = TOF_BOX.y + 2 * 3 + 2 * TOF_BOX.pad + TOF_BOX.lines * TOF_BOX.size * TOF_BOX.lineH;
  if (tofBottom > 1080 * 0.88) fail(`the time-of-flight label reaches into the caption band (bottom ${tofBottom.toFixed(0)})`);
  // --- the S1.7 room follows the card's tape: his rim flashes when the tape reaches him, while the card is in
  if (TAPE_TURN <= CARD2_IN + 6 || TAPE_TURN >= TAPE1) fail('the S1.7 tape must reach him after the card is in and before it is home');
  return {
    glowHeadPx: glowHead,
    glowPencilPx: glowPencil,
    glowShown,
    fanHeadPx: fanHead,
    fanPencilPx: fanPencil,
    leadTripodPx: leadTripod,
    emerge: {s15: EMERGE - PULSE0, race: RACE_EMERGE - RACE0},
    boardHit: BOARD_HIT,
    card: {...card},
    tofBottom,
    tapeTurn: TAPE_TURN,
    pathMinBelowCornerPx: PICK.minBelowCornerPx,
    pathMinFrontPx: PICK.minFrontPx,
    spotClearPx: PICK.spotClearPx,
    gapLabel: {partition: gapPartition, herHead: gapHead, wallSpot: gapGlow, tripod: gapTripod},
    cardHim,
    labelGaps,
    card2Gaps,
    chipBottom,
    tapErr,
    partitionTopMinPx: topMin,
    patchMinM: patchMin,
  };
})();
