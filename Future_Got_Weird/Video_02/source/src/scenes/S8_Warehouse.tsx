import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, camPath, ring, tw} from '../lib/motion';
import {CAST} from '../components/cast';
import {Character2, IDLE2, type Pose2} from '../components/v02/Cast2';
import {BOT, BotTopG, DeliveryBot, botDrive, mixEyes, type BotDrivePlan, type EyeShape} from '../components/v02/DeliveryBot';
import {
  WAREHOUSE,
  WH_BOT_HALF_W,
  WH_PERSON_HIDDEN_MAX_Z,
  WH_RIG_HALF_W,
  WarehouseSet,
  whBotAt,
  whBotStyle,
  whBotTopAt,
  whFigureMix,
  whFirstHit,
  whPlanWalk,
  whProjectWith,
  whRigStyle,
  whSightBlocked,
  whSmooth,
  whTokenAt,
  whViewAt,
  whWalkAt,
  whWalkDistance,
  type WhItem,
  type WhPt,
  type WhViewState,
} from '../components/v02/Warehouse';
import {LightPath, ScatterFan} from '../components/v02/Optics';
import {pathSchedule, scatterDirections, type P2} from '../lib/optics';
import {S8PersonTokenG} from '../components/v02/S8_PersonToken';
import {S8Blob, S8Carton, S8ImpactMarks, S8Label, S8Pill, S8PillRow, S8ThinkBubble, type CartonBox} from '../components/v02/S8_Props';
import {VignetteBoard} from '../components/v02/S8_Vignettes';

/**
 * S8 · Usefulness and limits (s40–s44), the warehouse. Storyboard shots S7.1–S7.5 (numbered S8.1–S8.5 here).
 *
 *  S8.1 s40  WarehouseSet front view, locked wide: the delivery robot waits far down aisle A, sets off on "Picture",
 *            rolls toward the blind corner and slows to a stop short of it on "corner" ("illustration").
 *            RUNWAY R3 = the roll and slow-down, locked camera, static start and end poses (6 frames each).
 *  S8.2 s41  tilt to the plan view (one move): the relay wall section across the junction lights up ("junction");
 *            the robot pings it ("sensor"): pulses fan to the wall and scatter. A person (CAST.person) comes through
 *            the doors into aisle B ("might"); a second pulse goes robot → wall → person → wall → robot (slowed,
 *            later legs thinner and paler, "slowed down"); the direct line is blocked by the racking ("out of sight");
 *            when the echo is back, a faint blob appears round the person ("potential use").
 *  S8.3 s42  tilt back to the front view: the robot eases off its waiting spot; "something moving" pins on the blob;
 *            the robot squints (anticipation) and brakes at the stop line on "say slow down" ("slow down · not who");
 *            the person, never in the robot's direct view, stops at the brake; on "who's" a "?" pops in a thought
 *            bubble over the robot (it only has the blob) while the person turns toward the corner, listening.
 *  S8.4 s43  a paper board slides down over the warehouse: a 2×2 strip, one tile per spoken beat ("short range",
 *            "dark or shiny walls", "bright sunlight", "fast math on small hardware"), then "early-stage prototype
 *            (authors)" lands across it on "early-stage".
 *  S8.5 s44  the board lifts (time has passed; the person has gone): the robot creeps on carefully; a carton sits in
 *            its path and its bumper does the stopping (contact just after "collisions"); on "clue" it pings once
 *            more, and "not a safety system" pins to its sensor head.
 *
 * Every beat is cued from narration words (K below) and gaps are clamped, so the scene survives ±20 % timing changes.
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ================================================================== cues (narration words) */

const SC = scene('S8');
const K = {
  start: SC.from,
  end: SC.to,
  // s40
  s40: seg('s40').from,
  what: at('s40', 'what'),
  good: at('s40', 'good'),
  picture: at('s40', 'picture'),
  robot40: at('s40', 'robot'),
  blind: at('s40', 'blind'),
  corner: at('s40', 'corner'),
  s40End: segEnd('s40'),
  // s41
  s41: seg('s41').from,
  wall41: at('s41', 'wall'),
  junction: at('s41', 'junction'),
  sensor41: at('s41', 'sensor'),
  might41: at('s41', 'might'),
  early41: at('s41', 'early'),
  movement: at('s41', 'movement'),
  out41: at('s41', 'out'),
  s41End: segEnd('s41'),
  // s42
  s42: seg('s42').from,
  fuzzy: at('s42', 'fuzzy'),
  blob: at('s42', 'blob'),
  enough: at('s42', 'enough'),
  say: at('s42', 'say'),
  slow: at('s42', 'slow'),
  whos: at('s42', "who's"),
  s42End: segEnd('s42'),
  // s43
  and43: at('s43', 'and'),
  plenty: at('s43', 'plenty'),
  short: at('s43', 'short'),
  dark: at('s43', 'dark'),
  shiny: at('s43', 'shiny'),
  bright: at('s43', 'bright'),
  sunlight: at('s43', 'sunlight'),
  fast: at('s43', 'fast'),
  math: at('s43', 'math'),
  small: at('s43', 'small'),
  early43: at('s43', 'early-stage'),
  s43End: segEnd('s43'),
  // s44
  s44: seg('s44').from,
  no44: at('s44', 'no'),
  collisions: at('s44', 'collisions'),
  for44: at('s44', 'for'),
  clue: at('s44', 'clue'),
  not44: at('s44', 'not'),
  s44End: segEnd('s44'),
};

/** Main.tsx: S8 arrives with a 12-frame wipe (mounted 6 frames early) and leaves under S9's 12-frame wipe. */
const MOUNT = K.start - 6;
const UNMOUNT = K.end + 6;

/* ================================================================== framings (world px of the 1920×1080 stage) */

/** S8.1: locked wide front view, aisle A from x ≈ -1 m to the relay wall; the robot's wheels clear the captions. */
const CAM_W: Cam = {cx: 900, cy: 660, zoom: 0.9};
/** S8.2: plan view of the corner region (robot, aisle B with its doors, the relay wall section). */
const CAM_PLAN: Cam = {cx: 1060, cy: 505, zoom: 0.98};
/** S8.3: medium front view: the robot at the stop line, the corner and aisle B, the blob over the racks. */
const CAM_MED: Cam = {cx: 900, cy: 600, zoom: 1.08};
/** S8.5 (after the board): the robot in the junction mouth and the carton, headroom for the label. */
const CAM_END: Cam = {cx: 930, cy: 716, zoom: 1.22};

/* ================================================================== the robot's drive */

const LANE_Z = WAREHOUSE.robotLaneZ; // 3.8
const X_E = 2.0; // R3 end: waiting short of the corner
const X_STOP = WAREHOUSE.robotStop.x; // 2.5: the stop line pose of S8.3
const STATIC = 6;

// S8.1 / R3: set off on "Picture", roll, slow to a stop on "corner"
const GO = K.picture;
const ACC1 = 14;
const DEC1 = 18;
const STOP1 = Math.max(GO + ACC1 + DEC1 + 24, Math.min(K.corner + 4, K.s41 - 24)); // at rest from here
const X_FAR_WANTED = 0.25; // the start pose sits clear of the frame's left edge
const V1 = clamp(((X_E - X_FAR_WANTED) * 30) / (ACC1 / 2 + (STOP1 - GO - ACC1 - DEC1) + DEC1 / 2), 0.5, 1.45);
const DRIVE1: BotDrivePlan = {v0: 0, keys: [{at: GO - MOUNT, dur: ACC1, to: V1}, {at: STOP1 - DEC1 - MOUNT, dur: DEC1, to: 0}], endX: X_E};
const R3_FREEZE = STOP1 + 22; // the brake spring has settled: the end pose is held from here
/** Runway insert R3 (global frames): the robot's roll toward the corner and its slow-down, locked camera, from the
 *  static start pose (6 frames) to the static end pose (6 frames). */
export const R3 = {from: GO - STATIC, to: R3_FREEZE + STATIC};
const IDLE_PING = Math.min(K.what + 8, R3.from - 48); // two idle pings and a blink before R3 (none inside it)
const IDLE_PING2 = R3.from - 22;
const IDLE_BLINK = R3.from - 12;

const drive1 = (g: number) => botDrive(clamp(g, R3.from, R3_FREEZE) - MOUNT, DRIVE1);
const D1_END = drive1(R3_FREEZE);

/* ================================================================== S8.2: tilt to plan, pings, the person, the blob */

const TILT1 = Math.max(R3.to + 2, K.s41);
const TILT1_DUR = clamp(K.sensor41 - TILT1 - 8, 30, 46);
const RELAY_ON = Math.max(TILT1 + TILT1_DUR - 14, Math.min(K.junction, TILT1 + TILT1_DUR - 4));
const PING1 = Math.max(K.sensor41, TILT1 + TILT1_DUR + 2);
const SH = WAREHOUSE.sensorH;
const sensorAt = (x: number): WhPt => ({x: x + BOT.sensorAhead, z: LANE_Z, h: SH});
const S_E = sensorAt(X_E);
const S_E2: P2 = {x: S_E.x, z: S_E.z};
const RELAY: P2[] = WAREHOUSE.relaySamples.map((r) => ({x: WAREHOUSE.relaySection.x, z: r.z, id: r.id}));
const FAN1 = RELAY.map((W) => pathSchedule([S_E2, W], {start: PING1}));
const FAN1_ARRIVE = Math.min(...FAN1.map((f) => f.end));

// the person: in through the doors at the end of aisle B, walking toward the junction (toward the camera). They never
// come into the robot's direct view: the walk ends short of WH_PERSON_HIDDEN_MAX_Z (the robot only ever has the blob,
// which is the point of "not who"); they stop when the robot brakes (they hear it) and turn toward the corner on "who's".
const P_ENTER = Math.round(Math.max(FAN1_ARRIVE + 4, K.might41 - 4));
const PING2 = P_ENTER + 6;
const Z_STOP = WH_PERSON_HIDDEN_MAX_Z - 0.1;
const WALK = whPlanWalk(WAREHOUSE.personLaneX, 0.2, Z_STOP);

// S8.3 timing that the walk has to respect (the robot brakes, then the person stops)
const ECHO_GUESS = PING2 + 80;
const TILT2_GUESS = Math.max(ECHO_GUESS + 10, K.s42 - 2);
const BRAKE2_OF = (tilt2: number) => Math.max(tilt2 + 14 + 30, K.say + 1);

/** Frames per step: the last foot lands just after the robot has stopped (a whole number of steps, 24..44 f each). */
const FPS_P = clamp(Math.round((BRAKE2_OF(TILT2_GUESS) + 9 + 8 - P_ENTER) / WALK.steps), 24, 44);
const WALK_END = P_ENTER + WALK.steps * FPS_P;
const personZ = (g: number) => WALK.z0 + whWalkDistance(g, P_ENTER, WALK, FPS_P);

// the second ping: robot -> relay point -> person -> relay point -> robot (the person's position at the hit)
const W2 = RELAY[1]; // R2
const MAIN = (() => {
  let H: P2 = {x: WAREHOUSE.personLaneX, z: personZ(PING2 + 40)};
  let sched = pathSchedule([S_E2, W2, H, W2, S_E2], {start: PING2});
  for (let i = 0; i < 4; i++) {
    H = {x: WAREHOUSE.personLaneX, z: personZ(sched.vertexFrames[2])};
    sched = pathSchedule([S_E2, W2, H, W2, S_E2], {start: PING2});
  }
  return {H, path: [S_E2, W2, H, W2, S_E2], sched};
})();
// dev guard: no leg of a drawn path may pass through the racking
for (const [a, b] of [
  [S_E2, W2],
  [W2, MAIN.H],
  ...RELAY.map((W) => [S_E2, W]),
]) {
  if (whSightBlocked(a, b)) throw new Error(`S8: light path leg (${a.x},${a.z})->(${b.x},${b.z}) crosses the racking`);
}
if (!whSightBlocked(S_E2, MAIN.H)) throw new Error('S8: the person must be out of the robot\'s direct view at the hit');
const ECHO = Math.round(MAIN.sched.end); // the echo is back at the robot: the blob appears
const OUT = Math.max(K.out41, MAIN.sched.vertexFrames[2] + 2); // the blocked direct line
const H_OUT: P2 = {x: WAREHOUSE.personLaneX, z: personZ(OUT)};

/* ================================================================== S8.3: back to the front view, the brake */

const TILT2 = Math.max(ECHO + 10, K.s42 - 2);
const TILT2_DUR = 36;
const CREEP = TILT2 + 14;
const BRAKE2 = BRAKE2_OF(TILT2);
const DEC2 = 9;
const ACC2 = 12;
const SQUINT = BRAKE2 - 8;
const CREEP0 = CREEP - 2;
const VC = ((X_STOP - X_E) * 30) / (ACC2 / 2 + (BRAKE2 - CREEP - ACC2) + DEC2 / 2);
const DRIVE2: BotDrivePlan = {v0: 0, keys: [{at: CREEP - CREEP0, dur: ACC2, to: VC}, {at: BRAKE2 - CREEP0, dur: DEC2, to: 0}], x0: X_E, fullBrake: (VC * 30) / DEC2 / 1.15};
const drive2 = (g: number) => botDrive(g - CREEP0, DRIVE2);
const CHIP_MOVING = Math.max(K.blob, TILT2 + TILT2_DUR - 2);
const CHIP_SLOW = Math.max(K.slow, BRAKE2 + 4);
const WHO = K.whos;
const UPD = 26; // blob updates (one ping each) after the first echo
const PEER = Math.max(BRAKE2 + DEC2 + 8, K.whos - 8); // the robot peers at the corner: it still cannot see round it
const REACT = Math.max(WALK_END + 6, K.whos - 10); // the person (who heard the brake) turns toward the corner

/* ================================================================== S8.4: the board */

const BOARD_DOWN = Math.max(K.s42End + 4, K.plenty - 14);
const BOARD_DOWN_END = BOARD_DOWN + 16;
const BOARD_UP = Math.max(K.s43End + 2, K.early43 + 30);
const BOARD_UP_END = BOARD_UP + 14;
const TAG = K.early43;

/* ================================================================== S8.5: creep on, the bumper stops it */

const CREEP3 = Math.max(BOARD_UP_END - 2, K.no44 + 2);
const ACC3 = 12;
const CONTACT = Math.max(CREEP3 + ACC3 + 18, K.collisions + 12);
const VC3 = 0.42;
const D3 = (VC3 * (ACC3 / 2 + (CONTACT - CREEP3 - ACC3))) / 30;
const X_CONTACT = X_STOP + D3;
const BUMPER_AHEAD = 0.36; // the rig's bumper face is 90 design units (0.36 m) ahead of its footprint centre
const CARTON: CartonBox = {x0: X_CONTACT + BUMPER_AHEAD + 0.005, x1: X_CONTACT + BUMPER_AHEAD + 0.405, z0: LANE_Z - 0.21, z1: LANE_Z + 0.2, h: 0.34};
const BACK = CONTACT + 14; // reaction: it backs off the carton a few centimetres
const DRIVE3: BotDrivePlan = {
  v0: 0,
  keys: [
    {at: 2, dur: ACC3, to: VC3},
    {at: 2 + CONTACT - CREEP3, dur: 3, to: 0},
    {at: 2 + BACK - CREEP3, dur: 6, to: -0.2},
    {at: 2 + BACK + 6 - CREEP3, dur: 9, to: 0},
  ],
  x0: X_STOP,
  fullBrake: 3.0,
};
const drive3 = (g: number) => botDrive(g - (CREEP3 - 2), DRIVE3);
const BUMPER_LABEL = Math.max(BACK + 18, K.for44 + 4);
const CLUE_PING = K.clue;
const CHIP_SAFETY = K.not44;

/* ================================================================== robot and person state per frame */

type BotState = {x: number; travelled: number; speed: number; brake: number; eyes: EyeShape; look: number; blink: number; pulse: number};

const pulseWin = (g: number, starts: number[], len = 18) => {
  for (const s of starts) if (g >= s && g < s + len) return (g - s) / len;
  return 0;
};

const D2_TOTAL = drive2(BRAKE2 + 60).travelled;

const robotAt = (g: number): BotState => {
  if (g < CREEP0) {
    // S8.1 (R3 frozen at both ends) and S8.2
    const d = g < R3.from ? drive1(R3.from) : g >= R3_FREEZE ? D1_END : drive1(g);
    const inR3 = g >= R3.from && g < R3.to;
    const look = inR3 ? 0.25 * tw(g, STOP1 - DEC1, DEC1, E.inOut) : g >= R3.to ? 0.25 : 0;
    const blink = !inR3 && g >= IDLE_BLINK && g < IDLE_BLINK + 4 ? 0.1 : 1;
    const pulse = inR3 ? 0 : pulseWin(g, [IDLE_PING, IDLE_PING2, PING1, PING2]);
    return {x: d.x, travelled: d.travelled, speed: d.speed, brake: g >= R3_FREEZE ? D1_END.brake : d.brake, eyes: mixEyes('neutral', 'neutral', 0), look, blink, pulse};
  }
  if (g < BOARD_DOWN_END + 1) {
    // S8.3: ease off, squint, brake at the stop line; pings feed the blob
    const d = drive2(g);
    const sq = tw(g, SQUINT, 6, E.out);
    const eyes = mixEyes('neutral', 'cautious', sq);
    const look = 0.25 + 0.25 * tw(g, PEER, 10, E.inOut);
    const blink = g >= PEER - 6 && g < PEER - 2 ? 0.15 : 1;
    const pings = Array.from({length: 6}, (_, k) => ECHO + (k + 1) * UPD - 10);
    return {x: d.x, travelled: D1_END.travelled + d.travelled, speed: d.speed, brake: d.brake, eyes, look, blink, pulse: pulseWin(g, pings, 16)};
  }
  // S8.5: creep on carefully; the bumper stops it
  const d = drive3(g);
  const eyes = mixEyes('cautious', 'neutral', 0.35 * tw(g, K.for44, 14, E.inOut));
  const blink = g >= CONTACT + 1 && g < CONTACT + 6 ? 0.1 : 1;
  const look = 0.2 - 0.35 * tw(g, CONTACT + 6, 8, E.out) + 0.35 * tw(g, K.for44, 14, E.inOut);
  return {x: d.x, travelled: D1_END.travelled + D2_TOTAL + d.travelled, speed: d.speed, brake: d.brake, eyes, look, blink, pulse: pulseWin(g, [CLUE_PING])};
};

/** The blob: the robot's estimate (lags behind, updated once per ping, a little off the true position). */
const BLOB_R = 0.52;
const blobAt = (g: number) => {
  if (g < ECHO) return null;
  const k = Math.floor((g - ECHO) / UPD);
  const u = E.inOut(clamp01((g - (ECHO + k * UPD)) / 10));
  const zNow = personZ(ECHO + k * UPD - 12);
  const zPrev = k > 0 ? personZ(ECHO + (k - 1) * UPD - 12) : zNow;
  return {x: WAREHOUSE.personLaneX + 0.1, z: lerp(zPrev, zNow, u) + 0.06, shape: k > 0 ? k - 1 + u : 0};
};

/* ================================================================== label anchors (screen px, fixed once settled) */

const S0 = whViewAt(0);
const toScreen = (cam: Cam, s: WhViewState, p: WhPt) => {
  const q = whProjectWith(s, p);
  return worldToScreen(cam, q.x, q.y);
};
const BLOB_H = 0; // the estimate is a likely location: a patch on the floor
const blobScreen = (g: number) => {
  const b = blobAt(g);
  return b ? toScreen(CAM_MED, S0, {x: b.x, z: b.z, h: BLOB_H}) : {x: 0, y: 0, scale: 1};
};
// the pills sit right of where the blob ends up (it follows the person down the aisle), inside the 5 % margin, at the
// critical size (the "something moving" pill is ~10.2 em wide at 44 px)
const END_BLOB = blobScreen(BOARD_DOWN - 1);
const CHIP_SIZE = 44;
const CHIP_W1 = Math.ceil(CHIP_SIZE * 10.2);
const CHIP1 = {x: clamp(END_BLOB.x + BLOB_R * S0.ppm * CAM_MED.zoom + 12, 1250, 1824 - CHIP_W1), y: END_BLOB.y - 30};
const CHIP2 = {x: CHIP1.x, y: CHIP1.y + 84};
const CHIP3 = {x: CHIP1.x, y: CHIP2.y + 84};
const robotScreen = (g: number, cam: Cam, h: number, ahead = 0) => toScreen(cam, S0, {x: robotAt(g).x + ahead, z: LANE_Z, h});
/** The robot's "?" (it cannot say who): a thought bubble over its sensor head, once it has stopped. */
const HEAD_MED = robotScreen(Math.max(WHO, BRAKE2 + DEC2 + 1), CAM_MED, BOT.totalM + 0.02, BOT.sensorAhead * 0.3);
/** "slowed down" joins the guard-rail chip row (top left) in the plan view, clear of every drawn light path. */
const SLOWED_X = 632;
const HEAD_END = robotScreen(CHIP_SAFETY, CAM_END, BOT.totalM - 0.05, BOT.sensorAhead * 0.5);
const BUMP_END = robotScreen(BUMPER_LABEL, CAM_END, 0.14, BUMPER_AHEAD - 0.06);

/* ================================================================== the scene */

export const S8Warehouse: React.FC = () => {
  const g = useG();
  const boardY = g < BOARD_DOWN ? -1200 : g < BOARD_UP ? -1200 * (1 - E.softBack(clamp01((g - BOARD_DOWN) / (BOARD_DOWN_END - BOARD_DOWN)))) : -1200 * E.in(clamp01((g - BOARD_UP) / (BOARD_UP_END - BOARD_UP)));
  const boardOn = g >= BOARD_DOWN && g < BOARD_UP_END;
  const covered = g > BOARD_DOWN_END + 1 && g < BOARD_UP - 1;
  const after = g >= BOARD_DOWN_END; // S8.5 state of the warehouse (the person has gone, the carton is there)

  // ---- view
  const tilt = after ? 0 : g < TILT1 ? 0 : g < TILT2 ? tw(g, TILT1, TILT1_DUR, E.inOut) : 1 - tw(g, TILT2, TILT2_DUR, E.inOut);
  const s = whViewAt(tilt);
  const mix = whFigureMix(tilt);
  const cam = after
    ? CAM_END
    : camPath(g, CAM_W, [
        {at: TILT1, dur: TILT1_DUR, to: CAM_PLAN},
        {at: TILT2, dur: TILT2_DUR, to: CAM_MED},
      ]);
  const P = (p: WhPt) => whProjectWith(s, p);
  const toPx = (p: P2) => whProjectWith(s, {x: p.x, z: p.z, h: SH});

  // ---- robot
  const rb = robotAt(g);
  const bot = whBotAt(rb.x, LANE_Z, tilt);
  const botTop = whBotTopAt(rb.x, LANE_Z, tilt);
  const items: WhItem[] = [
    {
      key: 'robot',
      x: rb.x,
      z: LANE_Z,
      w: WH_BOT_HALF_W,
      height: BOT.totalM,
      node: <DeliveryBot x={bot.x} y={bot.y} scale={bot.scale} travelled={rb.travelled} speed={rb.speed} brake={rb.brake} eyes={rb.eyes} look={rb.look} blink={rb.blink} pulse={rb.pulse} style={whBotStyle(tilt, bot.scale)} />,
    },
  ];

  // ---- person (S8.2-S8.3 only)
  const personOn = !after && g >= P_ENTER;
  const walk = whWalkAt(WALK, personZ(g) - WALK.z0, tilt);
  if (personOn && mix.rig > 0.001) {
    // walking: a relaxed smile; stopped by the brake sound: the smile goes; on "who's": head turns and tilts toward
    // the corner, brows up, a small 'o' (listening, not seeing)
    const turnT = tw(g, REACT, 12, E.inOut);
    const mouth = g >= REACT + 2 && g < REACT + 22 ? 'o' : g >= WALK_END - 4 ? 'flat' : 'smile';
    const pose: Pose2 = {...IDLE2, ...walk.pose, lookX: -0.6 * turnT, lookY: 0.05 * turnT, tilt: -4 * turnT, brows: 0.4 * turnT, mouth};
    items.push({
      key: 'person',
      x: WALK.x,
      z: walk.z,
      w: WH_RIG_HALF_W,
      height: WALK.heightM,
      node: (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: mix.rig}}>
            <ellipse cx={walk.shadow.cx} cy={walk.shadow.cy} rx={walk.shadow.rx} ry={walk.shadow.ry} fill={C.shadow} />
          </svg>
          <Character2 look={CAST.person} pose={pose} frame={g} seed={9} x={walk.x} y={walk.y} scale={walk.scale} shadow={false} style={whRigStyle(tilt, walk.scale)} />
        </>
      ),
    });
  }
  const tok = whTokenAt(WALK.x, walk.z, tilt);
  const tokFade = tw(g, P_ENTER, 8, E.out);

  // ---- carton (S8.5)
  const push = 0.05 * tw(g, CONTACT, 4, E.out);
  const tip = g >= CONTACT ? 4.5 * ring(g, CONTACT, 0.75, 0.2) : 0;
  if (after) {
    const box = {...CARTON, x0: CARTON.x0 + push, x1: CARTON.x1 + push};
    items.push({key: 'carton', x: (box.x0 + box.x1) / 2, z: (box.z0 + box.z1) / 2, w: 0.2, height: box.h, node: <S8Carton s={s} box={box} tip={tip} />});
  }

  // ---- plan overlays (S8.2) and the blob (S8.2-S8.3)
  const planOn = !after && g >= TILT1 && g < TILT2 + TILT2_DUR;
  const planFade = 1 - tw(g, TILT2, 14, E.inOut);
  const relayT = tw(g, RELAY_ON, 12, E.out) * planFade;
  const rs = WAREHOUSE.relaySection;
  const fan1Fade = 1 - tw(g, PING2 + 10, 14, E.inOut);
  const dirsWall = (i: number) => scatterDirections({x: -1, z: 0}, 5, 11 + i);
  const mainT = MAIN.sched.progress(g);
  const blockedT = tw(g, OUT, 10, E.out) * planFade;
  const hit = whFirstHit(S_E, {x: H_OUT.x, z: H_OUT.z, h: SH});
  const b = blobAt(g);
  const blobOp = after ? 0 : tw(g, ECHO, 14, E.out) * (0.6 + 0.4 * (1 - tilt));
  const blobC = b ? P({x: b.x, z: b.z, h: BLOB_H * (1 - whSmooth(0.6, 1, tilt))}) : null;
  const blobRx = BLOB_R * s.ppm;
  const slowedT = tw(g, PING1, 10, E.out) * (1 - tw(g, ECHO + 6, 10, E.inOut));
  const potentialT = tw(g, Math.max(RELAY_ON, K.junction), 10, E.linear);

  // ---- labels (screen space)
  const blobS = blobC ? worldToScreen(cam, blobC.x, blobC.y) : null;
  const movingT = after ? 0 : tw(g, CHIP_MOVING, 10, E.linear);
  const slowT = after ? 0 : tw(g, CHIP_SLOW, 10, E.linear);
  const whoT = after ? 0 : tw(g, WHO, 8, E.linear);
  const towardChip = blobS ? {x: blobS.x + blobRx * cam.zoom * 0.9, y: blobS.y + blobRx * s.floor * cam.zoom * 0.15} : {x: 0, y: 0};

  return (
    <AbsoluteFill style={{background: C.paper}}>
      {!covered && (
        <Camera cam={cam}>
          <Layer depth={1}>
            <WarehouseSet
              tilt={tilt}
              items={items}
              backdrop={
                b && blobC && blobOp > 0.001 ? (
                  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                    <S8Blob cx={blobC.x} cy={blobC.y} rx={blobRx} ry={blobRx * s.floor} shape={b.shape} opacity={blobOp} />
                  </svg>
                ) : undefined
              }
            >
              <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                {planOn && relayT > 0.001 && (
                  <path
                    d={[{x: rs.x - 0.09, z: rs.z0}, {x: rs.x, z: rs.z0}, {x: rs.x, z: rs.z1}, {x: rs.x - 0.09, z: rs.z1}]
                      .map((p, i) => {
                        const q = toPx(p);
                        return `${i ? 'L' : 'M'} ${q.x} ${q.y}`;
                      })
                      .join(' ') + ' Z'}
                    fill={C.teal}
                    stroke={C.ink}
                    strokeWidth={3.5}
                    opacity={relayT}
                  />
                )}
                {/* plan glyphs: the person token, the robot from above */}
                {mix.token > 0.001 && !after && (
                  <g>
                    {personOn && <S8PersonTokenG x={tok.x} y={tok.y} size={tok.r * 2} look={CAST.person} facing={180} scale={tok.scale} opacity={tok.opacity * tokFade} />}
                    <BotTopG x={botTop.x} y={botTop.y} ppm={botTop.ppm} floor={botTop.floor} opacity={botTop.opacity} scale={botTop.scale} pulse={rb.pulse} />
                  </g>
                )}
                {/* ping 1: pulses fan out to the relay wall and scatter */}
                {planOn && g >= PING1 && fan1Fade > 0.001 && (
                  <g opacity={fan1Fade * planFade}>
                    {FAN1.map((f, i) => (
                      <LightPath key={i} points={[S_E2, RELAY[i]]} toPx={toPx} t={f.progress(g)} width={5} pulseRadius={11} ringRadius={34} ringClip={WAREHOUSE.floor} asGroup />
                    ))}
                    {FAN1.map((f, i) => (
                      <ScatterFan key={`f${i}`} origin={RELAY[i]} dirs={dirsWall(i)} length={0.5} toPx={toPx} t={tw(g, f.end, 10, E.linear)} release={tw(g, f.end + 16, 12, E.linear)} seed={3 + i} width={3.5} asGroup />
                    ))}
                  </g>
                )}
                {/* ping 2: robot -> wall -> person -> wall -> robot */}
                {planOn && g >= PING2 && (
                  <g opacity={planFade}>
                    <LightPath points={MAIN.path} toPx={toPx} t={mainT} width={6} pulseRadius={12} ringRadius={40} ringClip={WAREHOUSE.floor} intensityFalloff={0.55} lane={12} asGroup />
                    <ScatterFan origin={W2} dirs={scatterDirections({x: -1, z: 0}, 6, 31)} length={0.55} toPx={toPx} t={tw(g, MAIN.sched.vertexFrames[1], 10, E.linear)} release={tw(g, MAIN.sched.vertexFrames[1] + 14, 12, E.linear)} seed={7} width={3.5} asGroup />
                    <ScatterFan origin={MAIN.H} dirs={scatterDirections({x: 1, z: 0.35}, 5, 41)} length={0.38} toPx={toPx} t={tw(g, MAIN.sched.vertexFrames[2], 10, E.linear)} release={tw(g, MAIN.sched.vertexFrames[2] + 14, 12, E.linear)} seed={9} width={3} asGroup />
                  </g>
                )}
                {/* the direct line is blocked by the racking */}
                {planOn && blockedT > 0.001 && hit && (
                  <g opacity={planFade}>
                    {(() => {
                      const a = toPx(S_E2);
                      const h = toPx(hit);
                      const e = {x: a.x + (h.x - a.x) * blockedT, y: a.y + (h.y - a.y) * blockedT};
                      return (
                        <>
                          <line x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke={C.coral} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 13" />
                          {blockedT >= 1 && (
                            <g transform={`translate(${h.x} ${h.y}) scale(${E.back(tw(g, OUT + 10, 8, E.linear))})`} stroke={C.coralDeep} strokeWidth={7} strokeLinecap="round">
                              <line x1={-13} y1={-13} x2={13} y2={13} />
                              <line x1={-13} y1={13} x2={13} y2={-13} />
                            </g>
                          )}
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </WarehouseSet>
          </Layer>
        </Camera>
      )}

      {/* guard-rail labels (screen space; under the board) */}
      <S8Label x={100} y={92} text="illustration" t={tw(g, K.what + 4, 10, E.linear)} size={34} />
      <S8Label x={350} y={92} text="potential use" t={potentialT} size={34} tone="teal" />
      {slowedT > 0.001 && <S8Label x={SLOWED_X} y={92} text="slowed down" t={slowedT} size={34} tone="saffron" />}

      {/* S8.3 labels on the blob */}
      {blobS && movingT > 0.001 && (
        <S8Label x={CHIP1.x} y={CHIP1.y} text="something moving" t={movingT} size={CHIP_SIZE} tone="teal" leader={{from: {x: CHIP1.x + 6, y: CHIP1.y}, to: towardChip}} />
      )}
      {slowT > 0.001 && (
        <>
          <S8PillRow x={CHIP2.x} y={CHIP2.y} size={CHIP_SIZE}>
            <S8Pill t={slowT} text="slow down" size={CHIP_SIZE} />
          </S8PillRow>
          <S8PillRow x={CHIP3.x} y={CHIP3.y} size={CHIP_SIZE}>
            <S8Pill t={whoT} text="not who" size={CHIP_SIZE} tone="coral" />
          </S8PillRow>
        </>
      )}
      {!after && whoT > 0.001 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <S8ThinkBubble x={HEAD_MED.x} y={HEAD_MED.y} t={whoT} />
        </svg>
      )}

      {/* S8.5 labels */}
      {after && <S8ImpactMarksLayer g={g} />}
      {after && <S8CluePing g={g} />}
      {after && (
        <S8Label
          x={BUMP_END.x - 64}
          y={BUMP_END.y + 92}
          text="bumper"
          t={tw(g, BUMPER_LABEL, 10, E.linear)}
          size={34}
          anchor="right"
          leader={{from: {x: BUMP_END.x - 70, y: BUMP_END.y + 70}, to: {x: BUMP_END.x - 6, y: BUMP_END.y + 6}}}
        />
      )}
      {after && (
        <S8Label
          x={HEAD_END.x + 120}
          y={HEAD_END.y - 110}
          text="not a safety system"
          t={tw(g, CHIP_SAFETY, 10, E.linear)}
          size={44}
          tone="coral"
          leader={{from: {x: HEAD_END.x + 140, y: HEAD_END.y - 90}, to: {x: HEAD_END.x + 12, y: HEAD_END.y - 8}}}
        />
      )}

      {/* S8.4: the board */}
      {boardOn && (
        <VignetteBoard
          g={g}
          y={boardY}
          cues={{short: K.short, dark: K.dark, shiny: K.shiny, bright: K.bright, sunlight: K.sunlight, fast: K.fast, math: K.math, small: K.small, early: K.early43}}
          tag={tw(g, TAG - 2, 8, E.linear)}
          setup={BOARD_DOWN_END - 8}
        />
      )}
    </AbsoluteFill>
  );
};

/** Impact marks where the bumper meets the carton (screen space under CAM_END). */
const S8ImpactMarksLayer: React.FC<{g: number}> = ({g}) => {
  const t = (g - CONTACT) / 12;
  if (t <= 0 || t >= 1) return null;
  const p = toScreen(CAM_END, S0, {x: CARTON.x0, z: LANE_Z + 0.1, h: 0.2});
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <S8ImpactMarks x={p.x} y={p.y} t={t} dir={-90} size={30} />
    </svg>
  );
};

/** On "clue": one visible ping, three arcs opening from the sensor head toward the junction (screen space). */
const S8CluePing: React.FC<{g: number}> = ({g}) => {
  const a = g - CLUE_PING;
  if (a < 0 || a > 34) return null;
  const p = robotScreen(CLUE_PING, CAM_END, BOT.sensorH, BOT.sensorAhead + 0.02);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {[0, 1, 2].map((k) => {
        // short arcs that stay below where "not a safety system" lands
        const u = clamp01((a - k * 5) / 22);
        if (u <= 0 || u >= 1) return null;
        const r = 30 + 100 * E.out(u);
        const th = (34 * Math.PI) / 180;
        return (
          <path
            key={k}
            d={`M ${p.x + Math.cos(-th) * r} ${p.y + Math.sin(-th) * r} A ${r} ${r} 0 0 1 ${p.x + Math.cos(th) * r} ${p.y + Math.sin(th) * r}`}
            fill="none"
            stroke={C.tealDeep}
            strokeWidth={8 - 3 * u}
            strokeLinecap="round"
            opacity={(1 - u) * 0.95}
          />
        );
      })}
    </svg>
  );
};

/* ================================================================== sound cue sheet */

/** Foot landings of the walk (Warehouse.tsx walkFoot: duty 0.58, so a foot lands at (m + 0.42) steps, and the
 *  last swing ends at the end of the walk): the first frame the walked distance reaches each landing distance. */
const footsteps = (() => {
  const end = WALK.steps * WALK.stepM;
  const targets: number[] = [];
  for (let m = 0; (m + 0.42) * WALK.stepM < end - 1e-6; m++) targets.push((m + 0.42) * WALK.stepM);
  targets.push(end);
  return targets.map((d) => {
    let f = P_ENTER;
    while (f < P_ENTER + (WALK.steps + 2) * FPS_P && whWalkDistance(f, P_ENTER, WALK, FPS_P) < d - 1e-6) f++;
    return f;
  });
})();

export const SFX: Sfx[] = [
  {f: MOUNT, kind: 'amb_warehouse', dur: (UNMOUNT - MOUNT) / 30, note: 'warehouse room tone'},
  {f: IDLE_PING, kind: 'sensor_pulse', gain: -8, note: 'idle ping before the roll'},
  {f: IDLE_PING2, kind: 'sensor_pulse', gain: -9, pitch: 1, note: 'second idle ping'},
  {f: GO, kind: 'robot_motor', dur: (STOP1 - GO) / 30, note: 'R3 roll toward the corner'},
  {f: STOP1 - DEC1, kind: 'robot_brake', gain: -5, note: 'R3 slows to a stop'},
  {f: PING1, kind: 'sensor_pulse', gain: -3, note: 'ping 1 (plan)'},
  {f: Math.round(FAN1_ARRIVE), kind: 'bounce_tick', gain: -4, note: 'pulses reach the junction wall'},
  {f: PING2, kind: 'sensor_pulse', gain: -3, pitch: 1, note: 'ping 2 (plan)'},
  {f: Math.round(MAIN.sched.vertexFrames[1]), kind: 'bounce_tick', gain: -4, pitch: 2, note: 'wall'},
  {f: Math.round(MAIN.sched.vertexFrames[2]), kind: 'bounce_tick', gain: -6, pitch: -2, note: 'person'},
  {f: Math.round(MAIN.sched.vertexFrames[3]), kind: 'bounce_tick', gain: -9, pitch: 4, note: 'wall, return'},
  {f: ECHO, kind: 'echo_return', gain: -2, note: 'echo back: the blob appears'},
  {f: CREEP, kind: 'robot_motor', dur: (BRAKE2 + DEC2 - CREEP) / 30, gain: -5, note: 'eases off'},
  {f: SQUINT, kind: 'robot_beep', gain: -4, note: 'cautious squint'},
  {f: BRAKE2, kind: 'robot_brake', note: 'brakes at the stop line'},
  {f: WHO, kind: 'pop_tick', gain: -8, note: 'the robot\'s "?" bubble'},
  ...footsteps.filter((f) => f >= TILT2 + TILT2_DUR - 6 && f < BOARD_DOWN).map((f, i): Sfx => ({f, kind: 'footstep_wood', gain: -12, pitch: i % 2 ? -1 : 0, note: 'the person (hard floor, quiet)'})),
  {f: BOARD_DOWN_END - 3, kind: 'paper_slap', gain: -4, note: 'the board lands'},
  {f: K.short, kind: 'sensor_pulse', gain: -7, note: 'tile 1 pulses'},
  {f: K.shiny + 13, kind: 'bounce_tick', gain: -4, pitch: 3, note: 'tile 2 shiny bounce'},
  {f: K.sunlight, kind: 'sun_glare', gain: -4, note: 'tile 3 sun floods the sensor'},
  {f: K.fast + 2, kind: 'prob_tick', gain: -6, note: 'tile 4 numbers pour in'},
  {f: K.math + 2, kind: 'prob_tick', gain: -6, pitch: 2},
  {f: K.small + 2, kind: 'prob_tick', gain: -6, pitch: 4},
  {f: TAG + 3, kind: 'stamp_light', gain: -2, note: 'early-stage prototype tag'},
  {f: BOARD_UP, kind: 'paper_lift', gain: -5, note: 'the board lifts'},
  {f: CREEP3, kind: 'robot_motor', dur: (CONTACT - CREEP3) / 30, gain: -6, note: 'creeps on'},
  {f: CONTACT, kind: 'thud_soft', gain: -2, note: 'bumper meets the carton'},
  {f: CONTACT + 1, kind: 'robot_brake', gain: -6},
  {f: CONTACT + 12, kind: 'robot_beep', gain: -8, pitch: -2, note: 'small oops'},
  {f: BACK, kind: 'robot_motor', dur: 15 / 30, gain: -10, note: 'backs off the carton'},
  {f: CLUE_PING, kind: 'sensor_pulse', gain: -7, note: 'one more ping on "clue"'},
];

