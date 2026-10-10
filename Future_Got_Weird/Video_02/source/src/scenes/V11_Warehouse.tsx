import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, camPath, tw} from '../lib/motion';
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
} from '../components/v02/Warehouse';
import {LightPath, ScatterFan} from '../components/v02/Optics';
import {pathSchedule, scatterDirections, type P2} from '../lib/optics';
import {S8PersonTokenG} from '../components/v02/S8_PersonToken';
import {S8Blob, S8ThinkBubble} from '../components/v02/S8_Props';
import {Chip} from '../components/v2k/Labels';
import {CAM_V11_WIDE, V11_CORNER_WIDE, V12_PARTITION_FAR_X, cornerOnScreen} from '../components/v2s/V11_Match';
import {CHIP_FRAME, FadingPulse, Glare, Sun, TinyChip, WhPill, polyLen} from '../components/v2s/V11_Parts';

/**
 * V11 · Warehouse: potential use and limits (s40, n29, s42, s43, n30). v2/SHOTPLAN_V2.md V11; adapted from v1 S8
 * (WarehouseSet, DeliveryBot, S8_*), read and copied, never imported from the v1 scene.
 *
 *  V11.1 s40   MATCH CUT in from V10.5: the card's partition becomes the warehouse's blind corner (V11_Match: the corner
 *              edge on the drawing's near-end edge, x, floor and top). Front view, locked wide (CAM_V11_WIDE). The
 *              delivery robot (cautious face) is already easing along the aisle when the shot opens (review r1,
 *              V2-R1-35: no still frame under "What might this be good for?"; it pings on "What" and "good"), speeds up
 *              on "Picture" and rolls toward the blind corner, stopping short of it on "corner". "potential use" (48,
 *              top left) comes in on the cut and stays until the cut to V12, with the chip "illustration" (40; review r1
 *              V2-R1-14) beside it.
 *  V11.2 n29   One move: tilt to the plan of the junction. On "junction" the plain wall across the junction lights and a
 *              wall spot on it marks where the light will bounce; "suitable wall" (48). The cast "person" comes through
 *              the doors into the hidden aisle. On "sensor" one slowed pulse runs robot → wall spot → hidden aisle →
 *              wall spot → robot, in straight segments around the corner's end (never through shelving; asserted at
 *              load); the wall and the person scatter it. When the echo is home a faint blob appears where the person
 *              walks. On "out of sight" the direct line from the robot stops on the racking with an X. No range number.
 *  V11.3 s42   tilt back to the front view (medium): the blob sits beyond the corner; the robot eases on, squints
 *              (anticipation) and brakes at the stop line on "say slow down" (the brake spring settles); "slow down" (48)
 *              on "slow", "not who" (48) on "not"; on "who's" a "?" in a thought bubble over the robot (it has only the
 *              blob), while the person, never in its direct view, stops at the brake and turns toward the corner.
 *  V11.4 s43   HARD CUT on "plenty": one full-frame tile per beat, each on the warehouse plan, each beat's words (48) on
 *              its word; review r1 (V2-R1-36): each tile is framed on what changes (tile 1 on the whole short trip,
 *              robot → wall spot → the far end of the hidden aisle; tiles 2–4 cropped in on the junction: the wall, the
 *              sunlit sensor, the robot and its chip), with bolder pulses: "short range" (pulses fade out before they reach the far end of the hidden aisle), "dark or
 *              shiny walls" (a dark wall swallows a pulse on "dark"; on "shiny" the wall turns glossy and bounces the next
 *              one away, angle in = angle out, past the robot), "bright sunlight" (the sun comes up outside on "bright";
 *              on "sunlight" the patch under a roof light over the relay wall lights up, the sunlit wall floods the
 *              sensor pointed at it, and the returning echo is lost in the glare; no ray crosses a wall), "fast math on small
 *              hardware" (a callout from the robot: a heap of numbers pours onto a tiny chip, which sweats on "small").
 *              Just before "call it" the four shrink into a row (later and shorter than in r1, so the chip tile gets
 *              its time; captions at 40 px, each tile's beat words), then "early-stage prototype (the researchers)" (48) on "early-stage".
 *  V11.5 n30   HARD CUT: front view, locked: the robot creeps on round the corner, slowly; "not a safety system" (48) on
 *              "not", where the robot taps its brake once (the soft settle) and creeps on more slowly still. No carton, no bumper. HARD CUT to V12: on the last frame the blind corner's vertical edge stands on
 *              V12_PARTITION_FAR_X, the screen x of the partition's far-end edge in S9.2's raised framing (asserted ±15 px).
 */

/* ================================================================== cues (narration words) */

const SC = scene('V11');
const K = {
  start: SC.from,
  end: SC.to,
  // s40
  s40: seg('s40').from,
  what: at('s40', 'what'),
  good: at('s40', 'good'),
  picture: at('s40', 'picture'),
  corner: at('s40', 'corner'),
  // n29
  n29: seg('n29').from,
  with: at('n29', 'with'),
  suitable: at('n29', 'suitable'),
  junction: at('n29', 'junction'),
  sensor: at('n29', 'sensor'),
  might: at('n29', 'might'),
  hint: at('n29', 'hint'),
  out: at('n29', 'out'),
  n29End: segEnd('n29'),
  // s42
  s42: seg('s42').from,
  just: at('s42', 'just'),
  blob: at('s42', 'blob'),
  say: at('s42', 'say'),
  slow: at('s42', 'slow'),
  not42: at('s42', 'not'),
  whos: at('s42', "who's"),
  s42End: segEnd('s42'),
  // s43
  plenty: at('s43', 'plenty'),
  hard: at('s43', 'hard'),
  short: at('s43', 'short'),
  range: at('s43', 'range'),
  dark: at('s43', 'dark'),
  shiny: at('s43', 'shiny'),
  bright: at('s43', 'bright'),
  sunlight: at('s43', 'sunlight'),
  fast: at('s43', 'fast'),
  math: at('s43', 'math'),
  small: at('s43', 'small'),
  the43: at('s43', 'the'),
  call: at('s43', 'call'),
  early: at('s43', 'early-stage'),
  s43End: segEnd('s43'),
  // n30
  n30: seg('n30').from,
  for30: at('n30', 'for'),
  clue: at('n30', 'clue'),
  not30: at('n30', 'not'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;
const pulseWin = (g: number, starts: number[], len = 18) => {
  for (const s of starts) if (g >= s && g < s + len) return (g - s) / len;
  return 0;
};

/* ================================================================== framings (world px of the warehouse stage) */

/** V11.2: plan view of the junction (the robot, aisle B with its doors, the relay wall), above the caption band. */
const CAM_PLAN: Cam = {cx: 1120, cy: 548, zoom: 0.92};
/** V11.3: medium front view: the robot at the stop line, the corner and aisle B, the blob over the racks. */
const CAM_MED: Cam = {cx: 900, cy: 600, zoom: 1.08};
/** V11.4 tiles: the V11.2 plan framing is the reference (the tile geometry is in its world px). */
const CAM_TILE: Cam = CAM_PLAN;
/**
 * Review r1 (V2-R1-36): each tile framed on what changes. World px of the plan stage (200 px per metre): robot
 * (880, 810), relay wall x 1580 from y 510 to 970, roof light x 1390–1580 / y 560–780, outer wall ≈ 1607, the person
 * at the hidden aisle's far end (1280, 160).
 *  - tile 1 (short range) needs the whole trip, robot → wall spot → the far end of the hidden aisle (where the person
 *    is never reached): re-centred, a little closer;
 *  - tiles 2–4 (the wall, the sunlit sensor, the chip) crop in on the junction (robot, relay wall, roof light) at 1.38,
 *    1.5× the V11.2 plan, with room right of the outer wall for the sun.
 */
const CAM_T1: Cam = {cx: 1180, cy: 458, zoom: 0.97};
const CAM_JCT: Cam = {cx: 1114, cy: 704, zoom: 1.38};
const TILE_CAMS: Cam[] = [CAM_T1, CAM_JCT, CAM_JCT, CAM_JCT];
/** V11.5: front view, locked; the blind corner's edge on the V12 contract x (V12_PARTITION_FAR_X). */
const END_ZOOM = 1.12;
const CORNER_W = {x: whProjectWith(whViewAt(0), {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z, h: 0}).x};
const CAM_END: Cam = {cx: CORNER_W.x - (V12_PARTITION_FAR_X - 960) / END_ZOOM, cy: 700, zoom: END_ZOOM};
{
  const c = cornerOnScreen(CAM_END);
  if (Math.abs(c.x - V12_PARTITION_FAR_X) > 15) throw new Error(`V11 → V12: the corner edge lands at x ${c.x.toFixed(1)}, contract ${V12_PARTITION_FAR_X.toFixed(1)} ± 15`);
}

/* ================================================================== shots */

const TILE0 = K.plenty; // V11.3 → V11.4 (hard cut)
const CUT_END = K.n30 - 2; // V11.4 → V11.5 (hard cut)

/* ================================================================== the robot's drive (V11.1) */

const LANE_Z = WAREHOUSE.robotLaneZ;
const X_E = 2.0; // stops short of the corner on "corner"
const X_STOP = WAREHOUSE.robotStop.x; // the stop line (V11.3)
const GO = K.picture;
const ACC1 = 14;
const DEC1 = 18;
const STOP1 = Math.max(GO + ACC1 + DEC1 + 24, Math.min(K.corner + 4, K.with - 20));
const X_FAR = 0.35;
const V1 = clamp(((X_E - X_FAR) * 30) / (ACC1 / 2 + (STOP1 - GO - ACC1 - DEC1) + DEC1 / 2), 0.5, 1.45);
// review r1 (V2-R1-35): the wide held completely still for 2 s under "What might this be good for?". Now the robot is
// already easing along the aisle (a cautious creep) from just after the cut, pinging as it goes; on "Picture" it speeds
// up and rolls toward the corner (the shot plan's "rolls toward the blind aisle corner on Picture", no wait).
const CREEP_GO = K.start + 4;
const ACC0 = 16;
const V_CREEP = 0.18; // m/s (about 1.2 px per frame in the wide; the wheels turn about 3° per frame)
const DRIVE1: BotDrivePlan = {
  v0: 0,
  keys: [
    {at: CREEP_GO - K.start, dur: ACC0, to: V_CREEP},
    {at: GO - K.start, dur: ACC1, to: V1},
    {at: STOP1 - DEC1 - K.start, dur: DEC1, to: 0},
  ],
  endX: X_E,
};
const drive1 = (g: number) => botDrive(clamp(g, K.start, STOP1 + 40) - K.start, DRIVE1);
const D1_END = drive1(STOP1 + 40);
const IDLE_PINGS = [K.what + 2, K.good + 4]; // the robot pings as it creeps along the aisle, until "Picture"
{
  // the creep starts the robot further back: its tail (rear wheel and tail light, 104 rig units behind the footprint
  // centre) must stay inside the safe area in the locked wide
  const x0 = drive1(K.start).x;
  const b = whBotAt(x0, LANE_Z, 0);
  const tail = worldToScreen(CAM_V11_WIDE, b.x - 104 * b.scale, b.y).x;
  if (tail < 100) throw new Error(`V11.1: the creeping robot's tail starts at screen x ${tail.toFixed(0)} (safe area from 96)`);
  if (CREEP_GO + ACC0 > GO - 10) throw new Error('V11.1: the creep is not under way before "Picture"');
}

/* ================================================================== V11.2: tilt to plan, the wall spot, the pulse, the blob */

const TILT1 = Math.max(STOP1 + 8, K.with);
const TILT1_DUR = clamp(K.sensor - TILT1 - 8, 30, 46);
const RELAY_ON = Math.max(TILT1 + TILT1_DUR - 14, Math.min(K.junction, TILT1 + TILT1_DUR - 4));
const SUITABLE = RELAY_ON;
const SH = WAREHOUSE.sensorH;
const S_E: WhPt = {x: X_E + BOT.sensorAhead, z: LANE_Z, h: SH};
const S_E2: P2 = {x: S_E.x, z: S_E.z};
const RELAY: P2[] = WAREHOUSE.relaySamples.map((r) => ({x: WAREHOUSE.relaySection.x, z: r.z, id: r.id}));
const W2 = RELAY[1]; // the wall spot (R2)
const P_ENTER = TILT1 + TILT1_DUR - 2; // the person comes through the doors as the plan settles
const PING = Math.max(K.sensor, TILT1 + TILT1_DUR + 2);
const Z_STOP = WH_PERSON_HIDDEN_MAX_Z - 0.1;
const WALK = whPlanWalk(WAREHOUSE.personLaneX, 0.2, Z_STOP);

// V11.3 timing the walk has to respect (the robot brakes, then the person stops)
const ECHO_GUESS = PING + 72;
const TILT2_GUESS = Math.max(ECHO_GUESS + 10, K.just - 2);
const BRAKE2_OF = (tilt2: number) => Math.max(tilt2 + 14 + 30, K.say + 1);
const FPS_P = clamp(Math.round((BRAKE2_OF(TILT2_GUESS) + 9 + 8 - P_ENTER) / WALK.steps), 24, 44);
const WALK_END = P_ENTER + WALK.steps * FPS_P;
const personZ = (g: number) => WALK.z0 + whWalkDistance(g, P_ENTER, WALK, FPS_P);

/** The pulse: robot → wall spot → the person (where they are at the hit) → wall spot → robot. */
const MAIN = (() => {
  let H: P2 = {x: WAREHOUSE.personLaneX, z: personZ(PING + 40)};
  let sched = pathSchedule([S_E2, W2, H, W2, S_E2], {start: PING});
  for (let i = 0; i < 4; i++) {
    H = {x: WAREHOUSE.personLaneX, z: personZ(sched.vertexFrames[2])};
    sched = pathSchedule([S_E2, W2, H, W2, S_E2], {start: PING});
  }
  return {H, path: [S_E2, W2, H, W2, S_E2], sched};
})();
for (const [a, b] of [
  [S_E2, W2],
  [W2, MAIN.H],
]) {
  if (whSightBlocked(a, b)) throw new Error(`V11.2: light path leg (${a.x},${a.z})->(${b.x},${b.z}) crosses the racking`);
}
if (!whSightBlocked(S_E2, MAIN.H)) throw new Error('V11.2: the person must be out of the robot\'s direct view at the hit');
const ECHO = Math.round(MAIN.sched.end);
const OUT = Math.max(K.out, MAIN.sched.vertexFrames[2] + 2);
const H_OUT: P2 = {x: WAREHOUSE.personLaneX, z: personZ(OUT)};

/* ================================================================== V11.3: back to the front view, the brake */

const TILT2 = Math.max(ECHO + 10, K.just - 2);
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
const SLOW_IN = Math.max(K.slow, BRAKE2 + 4);
const NOT_WHO = Math.max(K.not42, SLOW_IN + 18);
const WHO = K.whos;
const UPD = 26; // blob updates (one ping each) after the first echo
const PEER = Math.max(BRAKE2 + DEC2 + 8, K.whos - 8);
const REACT = Math.max(WALK_END + 6, K.whos - 10);
const N_PINGS = Math.max(1, Math.ceil((TILE0 - 2 - (ECHO + UPD - 10)) / UPD));
{
  const bad: string[] = [];
  if (TILE0 - NOT_WHO < 36) bad.push(`"not who" is up only ${TILE0 - NOT_WHO} f before the cut`);
  if (TILE0 - WHO < 24) bad.push(`the robot's "?" is up only ${TILE0 - WHO} f before the cut`);
  if (NOT_WHO >= WHO) bad.push('"not who" must land before the "?"');
  if (TILT1 + TILT1_DUR > PING) bad.push('the pulse leaves before the tilt has settled');
  if (ECHO + 10 > TILT2) bad.push('the tilt back starts before the echo is home');
  if (bad.length) throw new Error(`V11.3: ${bad.join('; ')}`);
}

/* ================================================================== V11.5: creep on round the corner */

const CREEP3 = Math.max(CUT_END + 6, K.for30);
const ACC3 = 16;
const VC3 = 0.36;
const SAFETY = K.not30;
// director r2: the shot plan's "soft settle on 'not a safety system'" as acting: on "not" the robot taps its brake once
// (0.36 → 0.2 m/s; the nose dips a little and settles) and creeps on more carefully still
const TAP3 = SAFETY - 3;
const TAP3_DUR = 8;
const VC3_SLOW = 0.2;
const DRIVE3: BotDrivePlan = {v0: 0, keys: [{at: 2, dur: ACC3, to: VC3}, {at: TAP3 - (CREEP3 - 2), dur: TAP3_DUR, to: VC3_SLOW}], x0: X_STOP};
const drive3 = (g: number) => botDrive(g - (CREEP3 - 2), DRIVE3);
if (TAP3 < CREEP3 + ACC3 + 6) throw new Error('V11.5: the brake tap comes before the creep is under way');
const CLUE_PING = K.clue;

/* ================================================================== robot and person state per frame */

type BotState = {x: number; travelled: number; speed: number; brake: number; eyes: EyeShape; look: number; blink: number; pulse: number};
const D2_TOTAL = drive2(BRAKE2 + 60).travelled;

const robotAt = (g: number): BotState => {
  if (g < CREEP0) {
    const d = drive1(g);
    const look = 0.2 * tw(g, K.good, 10, E.inOut) + 0.05 * tw(g, STOP1 - DEC1, DEC1, E.inOut);
    const blink = g >= GO - 10 && g < GO - 6 ? 0.1 : 1;
    return {x: d.x, travelled: d.travelled, speed: d.speed, brake: d.brake, eyes: mixEyes('neutral', 'cautious', 0.25), look, blink, pulse: pulseWin(g, [...IDLE_PINGS, PING])};
  }
  if (g < CUT_END) {
    const d = drive2(g);
    const sq = tw(g, SQUINT, 6, E.out);
    const eyes = mixEyes(mixEyes('neutral', 'cautious', 0.25), 'cautious', sq);
    const look = 0.25 + 0.25 * tw(g, PEER, 10, E.inOut);
    const blink = g >= PEER - 6 && g < PEER - 2 ? 0.15 : 1;
    const pings = Array.from({length: N_PINGS}, (_, k) => ECHO + (k + 1) * UPD - 10);
    return {x: d.x, travelled: D1_END.travelled + d.travelled, speed: d.speed, brake: d.brake, eyes, look, blink, pulse: pulseWin(g, pings, 16)};
  }
  const d = drive3(g);
  const eyes = mixEyes('cautious', 'neutral', 0.3 * tw(g, CREEP3 + 20, 14, E.inOut));
  const look = 0.35 + 0.15 * tw(g, CREEP3 + 10, 20, E.inOut);
  const blink = g >= SAFETY + 10 && g < SAFETY + 14 ? 0.1 : 1;
  return {x: d.x, travelled: D1_END.travelled + D2_TOTAL + d.travelled, speed: d.speed, brake: d.brake, eyes, look, blink, pulse: pulseWin(g, [CLUE_PING])};
};

/** The blob: the robot's estimate (lags, updated once per ping, a little off the true position). */
const BLOB_R = 0.52;
const blobAt = (g: number) => {
  if (g < ECHO) return null;
  const k = Math.min(N_PINGS, Math.floor((g - ECHO) / UPD));
  const u = E.inOut(clamp01((g - (ECHO + k * UPD)) / 10));
  const zNow = personZ(ECHO + k * UPD - 12);
  const zPrev = k > 0 ? personZ(ECHO + (k - 1) * UPD - 12) : zNow;
  return {x: WAREHOUSE.personLaneX + 0.1, z: lerp(zPrev, zNow, u) + 0.06, shape: k > 0 ? k - 1 + u : 0};
};

/* ================================================================== label anchors (screen px, fixed once settled) */

const S0 = whViewAt(0);
const toScreen = (cam: Cam, s: ReturnType<typeof whViewAt>, p: WhPt) => {
  const q = whProjectWith(s, p);
  return worldToScreen(cam, q.x, q.y);
};
const END_BLOB = (() => {
  const b = blobAt(TILE0 - 1)!;
  return toScreen(CAM_MED, S0, {x: b.x, z: b.z, h: 0});
})();
const PILL_SIZE = 48;
/** "slow down" / "not who": a column right of where the blob ends up, inside the safe area. */
const PILL_X = clamp(END_BLOB.x + BLOB_R * S0.ppm * CAM_MED.zoom + 16, 1180, 1824 - 300);
const PILL_Y1 = END_BLOB.y - 40;
const PILL_Y2 = PILL_Y1 + 90;
const robotScreen = (g: number, cam: Cam, h: number, ahead = 0) => toScreen(cam, S0, {x: robotAt(g).x + ahead, z: LANE_Z, h});
const HEAD_MED = robotScreen(Math.max(WHO, BRAKE2 + DEC2 + 1), CAM_MED, BOT.totalM + 0.02, BOT.sensorAhead * 0.3);
const W2_Z = WAREHOUSE.relaySamples[1].z;
/** "potential use" (48) and the "illustration" chip (40): top left, from the first frame to the last. */
const TOP = {x: 96, y: 96};
const POT_W = 372; // the pill's width at 48 px (measured in r1: 357 px)
/** "suitable wall": right of the lit wall section, level with its wall spot. */
const PLAN1 = whViewAt(1);
const planScreen = (cam: Cam, p: P2) => toScreen(cam, PLAN1, {x: p.x, z: p.z, h: SH});
const SUITABLE_AT = (() => {
  const w = planScreen(CAM_PLAN, {x: WAREHOUSE.relaySection.x + 0.12, z: W2_Z});
  return {x: w.x + 18, y: w.y};
})();
/** "not a safety system" (V11.5): above the robot's path, fixed. */
const SAFETY_AT = (() => {
  const h = toScreen(CAM_END, S0, {x: X_STOP + 0.5, z: LANE_Z, h: BOT.totalM + 0.75});
  return {x: h.x, y: h.y};
})();

/* ================================================================== V11.4 tiles */

const TILE_SPEED = 0.24; // m per frame on the tiles (a pulse is a schematic, slowed far below light speed)
const tilePx = (p: P2, cam: Cam = CAM_TILE) => planScreen(cam, p);
const ROBOT_T = {x: X_STOP, z: LANE_Z};
const SENS_T: P2 = {x: X_STOP + BOT.sensorAhead, z: LANE_Z};
const T1_PERSON: P2 = {x: WAREHOUSE.personLaneX, z: 0.55};
const T1_W: P2 = W2;
const T1_PULSES = [TILE0 + 6, Math.round((TILE0 + 6 + K.short) / 2) + 2, K.short + 3]; // keeps pinging; none reaches the far end
/** Tile 2 draws the wall section as a thicker band (its face at x = WALL_FACE) so "dark" and "shiny" read. */
const WALL_BAND = 0.26;
const WALL_FACE = WAREHOUSE.relaySection.x - WALL_BAND;
const T2_DARK_W: P2 = {x: WALL_FACE, z: 3.45};
const T2_SHINY_W: P2 = {x: WALL_FACE, z: 4.3};
const T2_SHINY_OUT: P2 = (() => {
  // mirror reflection on the plane x = 6.0: (dx, dz) -> (-dx, dz), run on until off the tile
  const d = {x: T2_SHINY_W.x - SENS_T.x, z: T2_SHINY_W.z - SENS_T.z};
  const L = 6.0;
  const n = Math.hypot(d.x, d.z);
  return {x: T2_SHINY_W.x - (d.x / n) * L, z: T2_SHINY_W.z + (d.z / n) * L};
})();
const T2_DARK0 = K.dark + 1;
const T2_SHINY_SWITCH = Math.max(K.shiny, T2_DARK0 + Math.ceil(Math.hypot(T2_DARK_W.x - SENS_T.x, T2_DARK_W.z - SENS_T.z) / TILE_SPEED) + 8);
const T2_SHINY0 = T2_SHINY_SWITCH + 2;
const T3_PING = K.bright + 1;
/**
 * Tile 3 (director r1). v1's dashed sun rays ran from a sun outside the building straight through the outer wall to the
 * robot. Now: a roof light over the junction's relay wall (dashed outline: overhead, the plan convention). Sunlight falls
 * straight down through it, toward the viewer's eye, so no ray is drawn in plan; the wall section and floor under it light
 * up, and the sunlit wall floods the sensor that is pointed at it (C40; kit README: "direct sunlight on the wall will
 * saturate the sensor"): a glow wedge from the lit wall to the sensor, in straight lines that never cross the shelving
 * (asserted below). The sun itself stands outside as a cue only, with no rays into the plan.
 */
const SKY = {x0: 5.05, x1: WAREHOUSE.relaySection.x, z0: 2.55, z1: 3.65};
const T3_FLOOD = K.sunlight;
const T3_WEDGE = T3_FLOOD + 3;
const T3_GLARE = T3_FLOOD + 7;
for (const z of [SKY.z0, SKY.z1]) {
  if (whSightBlocked({x: SKY.x1, z}, SENS_T)) throw new Error(`V11.4 tile 3: the glow from the sunlit wall at z ${z} crosses the racking`);
}
if (W2.z < SKY.z0 || W2.z > SKY.z1) throw new Error('V11.4 tile 3: the wall spot is not under the roof light');
/** Tile 4's callout (screen px, in CAM_JCT): above and right of the robot, over the junction, its tail to the robot. */
const T4_CALL = {x: 1200, y: 480, r: 375};
/** Tile 3's sun (screen px, in CAM_JCT): outside, right of the outer wall, above the roof light. */
const T3_SUN = {x: 1740, y: 300, r: 46};
for (const [a, b] of [
  [SENS_T, T1_W],
  [T1_W, T1_PERSON],
  [SENS_T, T2_DARK_W],
  [SENS_T, T2_SHINY_W],
]) {
  if (whSightBlocked(a, b)) throw new Error(`V11.4: tile light leg (${a.x},${a.z})->(${b.x},${b.z}) crosses the racking`);
}
{
  // the shiny bounce misses the robot (its footprint half-width plus a margin)
  const d = {x: T2_SHINY_OUT.x - T2_SHINY_W.x, z: T2_SHINY_OUT.z - T2_SHINY_W.z};
  const zAtRobot = T2_SHINY_W.z + (d.z * (ROBOT_T.x - T2_SHINY_W.x)) / d.x;
  if (zAtRobot - LANE_Z < BOT.widthM / 2 + 0.4) throw new Error('V11.4: the shiny bounce would come back to the robot');
  if (whSightBlocked(T2_SHINY_W, {x: ROBOT_T.x, z: zAtRobot})) throw new Error('V11.4: the shiny bounce crosses the racking');
}
// review r1 (V2-R1-36): the row comes later (just before "call it", not on "The researchers") and shorter, so the
// chip tile holds about 2.4 s; captions at 40 px (the chip tile's in two lines)
const ROW0 = Math.max(K.the43 + 8, K.call - 10);
/** The four tile cuts and their beat words. */
const TILES = [
  {from: TILE0, to: K.dark, label: 'short range', at: K.short},
  {from: K.dark, to: K.bright, label: 'dark or shiny walls', at: K.dark},
  {from: K.bright, to: K.fast, label: 'bright sunlight', at: K.bright},
  {from: K.fast, to: ROW0, label: 'fast math on small hardware', at: K.fast},
];
const ROW_DUR = 16;
const ROW = {x0: 96, w: 396, gap: 48, y0: 290}; // director r1: 250 → 290, the row, captions and tag sit centred in y 54–950
/** Each mini tile shows a crop of its (already framed) full-frame tile, screen px, centred on its action (tile 1: the
 *  robot, the wall spot and the far end of the aisle; tiles 2–4: the robot, the relay wall, the sun or the callout).
 *  One size for all four, so the row reads at one scale. */
const CROP_W = 1317;
const CROP_H = 790;
const CROPS = [{x: 322, y: 160}, {x: 520, y: 160}, {x: 520, y: 160}, {x: 520, y: 160}];
const ROW_S = ROW.w / CROP_W;
const ROW_H = Math.round(CROP_H * ROW_S);
const rowSlot = (i: number) => ({x: ROW.x0 + i * (ROW.w + ROW.gap), y: ROW.y0});
/** The row's captions repeat each tile's beat words (40 px; verify r1: the chip tile keeps "fast math on small hardware"
 *  in two lines rather than a one-line "small hardware", which dropped the limit itself, the fast math). */
const CAPTIONS: string[][] = [['short range'], ['dark or shiny walls'], ['bright sunlight'], ['fast math on', 'small hardware']];
const CAPTION_SIZE = 40;
const TAG = Math.max(K.early, ROW0 + ROW_DUR + 10);
{
  const bad: string[] = [];
  TILES.forEach((t, i) => {
    if (t.to - t.from < 30) bad.push(`tile ${i + 1} is up only ${t.to - t.from} f`);
  });
  if (ROW.x0 + 4 * ROW.w + 3 * ROW.gap > 1824) bad.push('the row is wider than the safe area');
  if (TILES[3].to - TILES[3].from < 60) bad.push('the chip tile is up under 2 s');
  {
    // the row's captions (up to two lines) stay clear of the prototype tag (48 px pill centred ROW_H + 200 below the row top)
    const capBottom = ROW_H + 18 + Math.max(...CAPTIONS.map((l) => l.length)) * CAPTION_SIZE * 1.15;
    if (capBottom + 16 > ROW_H + 200 - 0.75 * 48) bad.push(`the row's captions (to ${(ROW.y0 + capBottom).toFixed(0)}) reach the prototype tag`);
  }
  {
    // the tiles' framing keeps their action inside the safe area and out of the caption band
    const rob = planScreen(CAM_JCT, SENS_T);
    const wall0 = planScreen(CAM_JCT, {x: WAREHOUSE.relaySection.x, z: WAREHOUSE.relaySection.z0});
    const wall1 = planScreen(CAM_JCT, {x: WAREHOUSE.relaySection.x, z: WAREHOUSE.relaySection.z1});
    if (wall1.y > 935 || wall0.y < 240 || wall0.x > 1700) bad.push(`tiles 2–4: the relay wall (${wall0.x.toFixed(0)}, ${wall0.y.toFixed(0)}..${wall1.y.toFixed(0)}) is not framed`);
    const half = (cam: Cam) => (BOT.widthM / 2) * PLAN1.ppm * cam.zoom + 8; // the robot's footprint half-width on screen
    if (rob.y + half(CAM_JCT) > 945 || rob.x < 300) bad.push(`tiles 2–4: the robot (${rob.x.toFixed(0)}, ${rob.y.toFixed(0)}) is not framed`);
    const outer = planScreen(CAM_JCT, {x: WAREHOUSE.floor.x1, z: 3});
    if (T3_SUN.x - T3_SUN.r - 38 < outer.x + 10) bad.push(`tile 3: the sun (${T3_SUN.x}) is not outside the outer wall (${outer.x.toFixed(0)})`);
    const r1 = planScreen(CAM_T1, SENS_T);
    const per = planScreen(CAM_T1, T1_PERSON);
    if (r1.y + half(CAM_T1) > 945 || per.y < 240) bad.push(`tile 1: the trip (robot y ${r1.y.toFixed(0)}, person y ${per.y.toFixed(0)}) is not framed`);
    if (T3_SUN.x + T3_SUN.r + 38 > 1824) bad.push('tile 3: the sun leaves the safe area');
    if (T4_CALL.y - T4_CALL.r < 54 || T4_CALL.y + T4_CALL.r > 940 || T4_CALL.x + T4_CALL.r > 1824) bad.push('tile 4: the callout leaves the safe area');
  }
  if (TAG + 30 > CUT_END) bad.push('the prototype tag has under 1 s before the cut');
  if (T2_SHINY0 + 10 > K.bright) bad.push('the shiny pulse leaves too late');
  if (bad.length) throw new Error(`V11.4: ${bad.join('; ')}`);
}

/* ================================================================== the scene */

export const V11Warehouse: React.FC = () => {
  const g = useG();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {g < TILE0 && <WarehouseShot g={g} />}
      {g >= TILE0 && g < CUT_END && <Tiles g={g} />}
      {g >= CUT_END && <EndShot g={g} />}
      {/* the guard rail: "potential use" (48) and "illustration" (40; review r1 V2-R1-14), top left, the whole scene */}
      <WhPill x={TOP.x} y={TOP.y} text="potential use" t={tw(g, K.start + 2, 6, E.linear)} size={48} tone="teal" />
      <Chip x={TOP.x + POT_W + 20} y={TOP.y} valign="middle" size={40} opacity={tw(g, K.start + 2, 6, E.linear)}>
        illustration
      </Chip>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- V11.1 – V11.3: the warehouse, front → plan → front */

const WarehouseShot: React.FC<{g: number}> = ({g}) => {
  const tilt = g < TILT1 ? 0 : g < TILT2 ? tw(g, TILT1, TILT1_DUR, E.inOut) : 1 - tw(g, TILT2, TILT2_DUR, E.inOut);
  const s = whViewAt(tilt);
  const mix = whFigureMix(tilt);
  const cam = camPath(g, CAM_V11_WIDE, [
    {at: TILT1, dur: TILT1_DUR, to: CAM_PLAN},
    {at: TILT2, dur: TILT2_DUR, to: CAM_MED},
  ]);
  const P = (p: WhPt) => whProjectWith(s, p);
  const toPx = (p: P2) => whProjectWith(s, {x: p.x, z: p.z, h: SH});

  // robot
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

  // the person (V11.2 – V11.3)
  const personOn = g >= P_ENTER;
  const walk = whWalkAt(WALK, personZ(g) - WALK.z0, tilt);
  if (personOn && mix.rig > 0.001) {
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

  // plan overlays (V11.2) and the blob
  const planOn = g >= TILT1 && g < TILT2 + TILT2_DUR;
  const planFade = 1 - tw(g, TILT2, 14, E.inOut);
  const relayT = tw(g, RELAY_ON, 12, E.out) * planFade;
  const rs = WAREHOUSE.relaySection;
  const mainT = MAIN.sched.progress(g);
  const blockedT = tw(g, OUT, 10, E.out) * planFade;
  const hit = whFirstHit(S_E, {x: H_OUT.x, z: H_OUT.z, h: SH});
  const b = blobAt(g);
  const blobOp = tw(g, ECHO, 14, E.out) * (0.6 + 0.4 * (1 - tilt));
  const blobC = b ? P({x: b.x, z: b.z, h: 0}) : null;
  const blobRx = BLOB_R * s.ppm;
  const spot = toPx(W2);
  const spotLit = relayT * (0.75 + 0.25 * Math.max(pulseWin(g, [Math.round(MAIN.sched.vertexFrames[1]) - 2], 16) * 2, 0));

  const slowT = tw(g, SLOW_IN, 8, E.linear);
  const notWhoT = tw(g, NOT_WHO, 8, E.linear);
  const bubbleT = tw(g, WHO, 8, E.linear);

  return (
    <>
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
                <g opacity={relayT}>
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
                  />
                  {/* the wall spot where the light will bounce */}
                  <path d={`M ${spot.x - 22} ${spot.y} L ${spot.x} ${spot.y - 22} L ${spot.x + 4} ${spot.y} L ${spot.x} ${spot.y + 22} Z`} fill={spotLit > 0.8 ? C.saffron : C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
                </g>
              )}
              {mix.token > 0.001 && (
                <g>
                  {personOn && <S8PersonTokenG x={tok.x} y={tok.y} size={tok.r * 2} look={CAST.person} facing={180} scale={tok.scale} opacity={tok.opacity * tokFade} />}
                  <BotTopG x={botTop.x} y={botTop.y} ppm={botTop.ppm} floor={botTop.floor} opacity={botTop.opacity} scale={botTop.scale} pulse={rb.pulse} />
                </g>
              )}
              {/* the pulse: robot -> wall spot -> person -> wall spot -> robot */}
              {planOn && g >= PING && (
                <g opacity={planFade}>
                  <LightPath points={MAIN.path} toPx={toPx} t={mainT} width={6} pulseRadius={13} ringRadius={40} ringClip={WAREHOUSE.floor} intensityFalloff={0.55} lane={12} asGroup />
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
                    // director r1: the "out of sight" mark was a 5 px dotted line and a 26 px X, invisible at 390 px;
                    // now a bold dashed sight line and a 48 px X with an ink edge (the line's teaching job is this beat)
                    const xk = clamp01((blockedT - 0.85) / 0.15);
                    return (
                      <>
                        <line x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke={C.coralDeep} strokeWidth={8} strokeLinecap="round" strokeDasharray="10 14" />
                        {xk > 0 && (
                          <g transform={`translate(${f2(h.x)} ${f2(h.y)})`} strokeLinecap="round" opacity={f2(xk)}>
                            <line x1={-24} y1={-24} x2={24} y2={24} stroke={C.ink} strokeWidth={17} />
                            <line x1={-24} y1={24} x2={24} y2={-24} stroke={C.ink} strokeWidth={17} />
                            <line x1={-24} y1={-24} x2={24} y2={24} stroke={C.coral} strokeWidth={10} />
                            <line x1={-24} y1={24} x2={24} y2={-24} stroke={C.coral} strokeWidth={10} />
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

      {/* V11.2 label */}
      <WhPill x={SUITABLE_AT.x} y={SUITABLE_AT.y} text="suitable wall" t={tw(g, SUITABLE, 8, E.linear) * planFade} size={PILL_SIZE} />
      {/* V11.3 labels and the robot's "?" */}
      <WhPill x={PILL_X} y={PILL_Y1} text="slow down" t={slowT} size={PILL_SIZE} />
      <WhPill x={PILL_X} y={PILL_Y2} text="not who" t={notWhoT} size={PILL_SIZE} tone="coral" />
      {bubbleT > 0.001 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <S8ThinkBubble x={HEAD_MED.x} y={HEAD_MED.y} t={bubbleT} />
        </svg>
      )}
    </>
  );
};

/* ---------------------------------------------------------------- V11.4: the limit tiles */

/** One tile, full frame: the warehouse plan and its beat's overlay at frame g (frozen at `freeze` if given). */
const Tile: React.FC<{i: number; g: number; label?: number}> = ({i, g, label = 1}) => {
  const s = PLAN1;
  const cam = TILE_CAMS[i];
  const zk = cam.zoom / CAM_TILE.zoom; // screen-space overlays grow with the tile's crop
  const toW = (p: P2) => whProjectWith(s, {x: p.x, z: p.z, h: SH});
  const botTop = whBotTopAt(ROBOT_T.x, ROBOT_T.z, 1);
  const robotScr = tilePx(SENS_T, cam);
  let world: React.ReactNode = null;
  let screen: React.ReactNode = null;
  let pulse = 0;
  let relayFill: string = C.teal;
  let relayGloss = 0;
  if (i === 0) {
    // short range: pulses fade out before the far end of the hidden aisle; the person there is never reached
    const legs = [toW(SENS_T), toW(T1_W), toW(T1_PERSON)];
    const L1 = Math.hypot(legs[1].x - legs[0].x, legs[1].y - legs[0].y);
    const L2 = Math.hypot(legs[2].x - legs[1].x, legs[2].y - legs[1].y);
    const reach = L1 + 0.5 * L2;
    const I = (d: number) => clamp01(1 - (d / reach) ** 2.2);
    const pxPerFrame = TILE_SPEED * s.ppm;
    world = (
      <g>
        {/* the far end the light cannot reach: a faint dotted continuation */}
        <line x1={f2(legs[1].x + (legs[2].x - legs[1].x) * 0.5)} y1={f2(legs[1].y + (legs[2].y - legs[1].y) * 0.5)} x2={f2(legs[2].x)} y2={f2(legs[2].y)} stroke={C.inkMuted} strokeWidth={5} strokeDasharray="3 14" strokeLinecap="round" opacity={0.75 * tw(g, T1_PULSES[0] + Math.round(reach / pxPerFrame), 10, E.linear)} />
        {T1_PULSES.map((p0, k) => (
          <FadingPulse key={k} pts={legs} d={(g - p0) * pxPerFrame} I={I} width={16} r={24} trailFade={tw(g, p0 + Math.round(reach / pxPerFrame) + 6, 16, E.linear) * (k === 0 ? 0.6 : 0)} />
        ))}
        <S8PersonTokenG x={toW(T1_PERSON).x} y={toW(T1_PERSON).y} size={0.52 * s.ppm} look={CAST.person} facing={180} />
      </g>
    );
    pulse = pulseWin(g, T1_PULSES);
  } else if (i === 1) {
    // dark: swallowed; shiny: bounced away (angle in = angle out), past the robot
    const shiny = tw(g, T2_SHINY_SWITCH, 6, E.linear);
    relayFill = shiny > 0.5 ? C.blueLight : C.inkSoft;
    relayGloss = shiny;
    const dLeg = [toW(SENS_T), toW(T2_DARK_W)];
    const dL = Math.hypot(dLeg[1].x - dLeg[0].x, dLeg[1].y - dLeg[0].y);
    const pxPerFrame = TILE_SPEED * s.ppm;
    const dd = (g - T2_DARK0) * pxPerFrame;
    const swallow = clamp01((dd - dL) / (pxPerFrame * 8));
    const sLeg = [toW(SENS_T), toW(T2_SHINY_W), toW(T2_SHINY_OUT)];
    const sd = (g - T2_SHINY0) * pxPerFrame;
    const sL1 = Math.hypot(sLeg[1].x - sLeg[0].x, sLeg[1].y - sLeg[0].y);
    world = (
      <g>
        {dd > 0 && <FadingPulse pts={dLeg} d={Math.min(dd, dL)} I={() => (dd >= dL ? 1 - swallow : 1)} width={12} r={19} trailFade={tw(g, T2_SHINY_SWITCH - 2, 8, E.linear) * 0.75} />}
        {dd >= dL && swallow < 1 && <circle cx={dLeg[1].x} cy={dLeg[1].y} r={f2(14 + 30 * E.out(swallow))} fill="none" stroke={C.ink} strokeWidth={f2(5 * (1 - swallow))} opacity={f2(0.6 * (1 - swallow))} />}
        {sd > 0 && <FadingPulse pts={sLeg} d={sd} I={() => 1} width={12} r={19} />}
        {sd > sL1 && sd < sL1 + pxPerFrame * 12 && <circle cx={sLeg[1].x} cy={sLeg[1].y} r={f2(12 + 34 * E.out((sd - sL1) / (pxPerFrame * 12)))} fill="none" stroke={C.saffronDeep} strokeWidth={5} opacity={f2(1 - (sd - sL1) / (pxPerFrame * 12))} />}
      </g>
    );
    pulse = pulseWin(g, [T2_DARK0, T2_SHINY0]);
  } else if (i === 2) {
    // bright sunlight: the sun comes up outside; on "sunlight" the roof light's patch and the wall under it light up, the
    // sunlit wall floods the sensor (glow wedge, then the glare), and the returning echo is lost in it
    const flood = tw(g, T3_FLOOD, 12, E.out);
    const wedge = tw(g, T3_WEDGE, 10, E.out);
    const legs = [toW(SENS_T), toW(W2), toW(SENS_T)];
    const pxPerFrame = TILE_SPEED * s.ppm;
    const L = polyLen(legs);
    const d = (g - T3_PING) * pxPerFrame;
    const sensW = toW(SENS_T);
    const I = (x: number) => {
      // the echo dims as it comes back into the glare round the sensor
      if (x < L / 2) return 1;
      const back = x - L / 2;
      const left = L / 2 - back;
      return clamp01(left / (L * 0.3)) + (1 - flood) * (1 - clamp01(left / (L * 0.3)));
    };
    const sky = [{x: SKY.x0, z: SKY.z0}, {x: SKY.x1, z: SKY.z0}, {x: SKY.x1, z: SKY.z1}, {x: SKY.x0, z: SKY.z1}].map(toW);
    const skyPath = sky.map((q, k) => `${k ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`).join(' ') + ' Z';
    const wA = toW({x: SKY.x1, z: SKY.z0});
    const wB = toW({x: SKY.x1, z: SKY.z1});
    // the wedge grows from the lit wall toward the sensor (its tip travels in a straight line)
    const tip = {x: lerp((wA.x + wB.x) / 2, sensW.x, wedge), y: lerp((wA.y + wB.y) / 2, sensW.y, wedge)};
    const tipHalf = lerp((wB.y - wA.y) / 2, 10, wedge);
    world = (
      <g>
        {/* the sunlit patch under the roof light, and the wall section it lights */}
        {flood > 0 && <path d={skyPath} fill={C.saffronLight} opacity={f2(0.95 * flood)} />}
        {flood > 0 && <line x1={f2(wA.x)} y1={f2(wA.y)} x2={f2(wB.x)} y2={f2(wB.y)} stroke={C.saffron} strokeWidth={f2(18 * flood)} strokeLinecap="round" />}
        {/* the glow from the sunlit wall to the sensor it is pointed at */}
        {wedge > 0 && <path d={`M ${f2(wA.x)} ${f2(wA.y)} L ${f2(wB.x)} ${f2(wB.y)} L ${f2(tip.x)} ${f2(tip.y + tipHalf)} L ${f2(tip.x)} ${f2(tip.y - tipHalf)} Z`} fill={C.saffronLight} opacity={0.7} />}
        {/* the roof light (dashed: it is overhead) */}
        <path d={skyPath} fill={flood > 0 ? 'none' : C.blueLight} fillOpacity={0.55} stroke={C.ink} strokeWidth={4} strokeDasharray="16 10" strokeLinejoin="round" />
        {[0.3, 0.62].map((u, k) => {
          const a = toW({x: SKY.x0 + (SKY.x1 - SKY.x0) * (u - 0.1), z: SKY.z0 + (SKY.z1 - SKY.z0) * (u + 0.12)});
          return <line key={k} x1={f2(a.x - 22)} y1={f2(a.y + 30)} x2={f2(a.x + 22)} y2={f2(a.y - 30)} stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.9} />;
        })}
        <FadingPulse pts={legs} d={Math.min(d, L)} I={I} width={9} r={16} trailFade={tw(g, T3_PING + Math.round(L / pxPerFrame) + 2, 10, E.linear)} />
      </g>
    );
    const rise = tw(g, K.bright, 14, E.out);
    screen = (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Sun x={T3_SUN.x} y={T3_SUN.y + 60 * (1 - rise)} r={T3_SUN.r} t={rise} />
        <Glare x={robotScr.x} y={robotScr.y} t={tw(g, T3_GLARE, 10, E.linear)} r={f2(120 * zk)} />
      </svg>
    );
    pulse = pulseWin(g, [T3_PING]);
  } else {
    // fast math on small hardware: a callout from the robot, the tiny chip and its heap of numbers
    const ff = g - K.fast;
    const fm = g - K.math;
    const fsm = g - K.small;
    const call = tw(g, K.fast, 8, E.linear);
    const tail = {x: robotScr.x + 14, y: robotScr.y - 26};
    const c = T4_CALL;
    const sc = (2 * c.r * 0.9) / 710;
    screen = (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={call}>
        <defs>
          <clipPath id="v11-callclip">
            <circle cx={c.x} cy={c.y} r={c.r - 3} />
          </clipPath>
        </defs>
        <path d={`M ${c.x - c.r * 0.72} ${c.y + c.r * 0.5} L ${tail.x} ${tail.y} L ${c.x - c.r * 0.42} ${c.y + c.r * 0.8} Z`} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        <circle cx={c.x + 8} cy={c.y + 10} r={c.r} fill={C.shadow} />
        <circle cx={c.x} cy={c.y} r={c.r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        <g clipPath="url(#v11-callclip)">
          <g transform={`translate(${c.x - 435 * sc} ${c.y - 235 * sc}) scale(${sc})`}>
            <TinyChip ff={ff} fm={fm} fsm={fsm} />
          </g>
        </g>
      </svg>
    );
    pulse = 0;
  }
  const rs = WAREHOUSE.relaySection;
  const band = i === 1 ? WALL_BAND : 0.09;
  const relay = [{x: rs.x - band, z: rs.z0}, {x: rs.x, z: rs.z0}, {x: rs.x, z: rs.z1}, {x: rs.x - band, z: rs.z1}].map(toW);
  const t = TILES[i];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <WarehouseSet tilt={1} items={[]}>
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <path d={relay.map((q, k) => `${k ? 'L' : 'M'} ${q.x} ${q.y}`).join(' ') + ' Z'} fill={relayFill} stroke={C.ink} strokeWidth={3.5} />
              {relayGloss > 0.5 &&
                [0.25, 0.55, 0.8].map((u, k) => {
                  const a = toW({x: rs.x - WALL_BAND / 2, z: rs.z0 + (rs.z1 - rs.z0) * u});
                  return <line key={k} x1={a.x - 12} y1={a.y + 22} x2={a.x + 12} y2={a.y - 22} stroke={C.white} strokeWidth={6} strokeLinecap="round" />;
                })}
              {world}
              <BotTopG x={botTop.x} y={botTop.y} ppm={botTop.ppm} floor={botTop.floor} opacity={1} scale={1} pulse={pulse} />
            </svg>
          </WarehouseSet>
        </Layer>
      </Camera>
      {screen}
      <WhPill x={TOP.x} y={TOP.y + 104} text={t.label} t={tw(g, t.at, 7, E.linear) * label} size={48} />
    </AbsoluteFill>
  );
};

const Tiles: React.FC<{g: number}> = ({g}) => {
  if (g < ROW0) {
    const i = TILES.findIndex((t) => g >= t.from && g < t.to);
    return <Tile i={Math.max(0, i)} g={g} />;
  }
  // the four shrink into a row: tile 4 shrinks from full frame into its slot (and crops to its action, CROPS);
  // tiles 1-3 (frozen on their last frames, labels off) fade in at theirs
  const k = tw(g, ROW0, ROW_DUR, E.inOut);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {TILES.map((t, i) => {
        const slot = rowSlot(i);
        const last = i === 3;
        const u = last ? k : 1;
        const box = {x: lerp(0, slot.x, u), y: lerp(0, slot.y, u), w: lerp(1920, ROW.w, u), h: lerp(1080, ROW_H, u)};
        const sc = lerp(1, ROW_S, u);
        const ox = lerp(0, -CROPS[i].x * ROW_S, u);
        const oy = lerp(0, -CROPS[i].y * ROW_S, u);
        const op = last ? 1 : tw(g, ROW0 + 6 + i * 3, 8, E.linear);
        return (
          <div key={i} style={{position: 'absolute', left: f2(box.x), top: f2(box.y), width: f2(box.w), height: f2(box.h), overflow: 'hidden', opacity: op, borderRadius: f2(14 * u), boxShadow: u > 0.5 ? `6px 7px 0 ${C.shadow}` : undefined}}>
            <div style={{position: 'absolute', left: f2(ox), top: f2(oy), width: 1920, height: 1080, transform: `scale(${f2(sc * 10000) / 10000})`, transformOrigin: '0 0'}}>
              <Tile i={i} g={last ? ROW0 : t.to - 1} label={last ? 1 - tw(g, ROW0, 8, E.linear) : 0} />
            </div>
            <div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `${OUTLINE}px solid ${C.ink}`, borderRadius: f2(14 * u), opacity: u}} />
          </div>
        );
      })}
      {CAPTIONS.map((lines, i) => {
        const slot = rowSlot(i);
        return (
          <div key={i} style={{position: 'absolute', left: slot.x, top: slot.y + ROW_H + 18, width: ROW.w, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: F.body, fontWeight: 800, fontSize: CAPTION_SIZE, lineHeight: 1.15, color: C.ink, opacity: tw(g, ROW0 + ROW_DUR - 2, 8, E.linear)}}>
            {lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        );
      })}
      <WhPill x={960} y={ROW.y0 + ROW_H + 200} text="early-stage prototype (the researchers)" t={tw(g, TAG, 8, E.linear)} size={48} tone="saffron" anchor="center" />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- V11.5: creep on round the corner */

const EndShot: React.FC<{g: number}> = ({g}) => {
  const rb = robotAt(g);
  const bot = whBotAt(rb.x, LANE_Z, 0);
  const items: WhItem[] = [
    {
      key: 'robot',
      x: rb.x,
      z: LANE_Z,
      w: WH_BOT_HALF_W,
      height: BOT.totalM,
      node: <DeliveryBot x={bot.x} y={bot.y} scale={bot.scale} travelled={rb.travelled} speed={rb.speed} brake={rb.brake} eyes={rb.eyes} look={rb.look} blink={rb.blink} pulse={rb.pulse} style={whBotStyle(0, bot.scale)} />,
    },
  ];
  return (
    <>
      <Camera cam={CAM_END}>
        <Layer depth={1}>
          <WarehouseSet tilt={0} items={items} />
        </Layer>
      </Camera>
      <WhPill x={SAFETY_AT.x} y={SAFETY_AT.y} text="not a safety system" t={tw(g, SAFETY, 8, E.linear)} size={48} tone="coral" anchor="center" />
    </>
  );
};

/* ================================================================== sound cue sheet */

/** Foot landings of the person's walk (Warehouse walkFoot: a foot lands at (m + 0.42) steps; the last at the end). */
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
  {f: K.start, kind: 'amb_warehouse', dur: (K.end - K.start) / 30, note: 'warehouse room tone (V11, all shots)'},
  // V11.1
  // review r1 (V2-R1-35): the robot creeps along the aisle from the cut (quiet motor under s40's question)
  {f: CREEP_GO, kind: 'robot_motor', dur: (GO - CREEP_GO) / 30, gain: -12, note: 'creeps along the aisle'},
  ...IDLE_PINGS.map((f, i): Sfx => ({f, kind: 'sensor_pulse', gain: -10 - i, pitch: i, note: 'ping as it creeps'})),
  {f: GO, kind: 'robot_motor', dur: (STOP1 - GO) / 30, note: 'speeds up and rolls toward the corner'},
  {f: STOP1 - DEC1, kind: 'robot_brake', gain: -6, note: 'stops short of the corner'},
  // V11.2
  {f: PING, kind: 'sensor_pulse', gain: -3, note: 'the pulse (plan)'},
  {f: Math.round(MAIN.sched.vertexFrames[1]), kind: 'bounce_tick', gain: -4, pitch: 2, note: 'wall spot'},
  {f: Math.round(MAIN.sched.vertexFrames[2]), kind: 'bounce_tick', gain: -6, pitch: -2, note: 'person'},
  {f: Math.round(MAIN.sched.vertexFrames[3]), kind: 'bounce_tick', gain: -9, pitch: 4, note: 'wall spot, return'},
  {f: ECHO, kind: 'echo_return', gain: -2, note: 'echo home: the blob appears'},
  // V11.3
  {f: CREEP, kind: 'robot_motor', dur: (BRAKE2 + DEC2 - CREEP) / 30, gain: -5, note: 'eases on'},
  {f: SQUINT, kind: 'robot_beep', gain: -5, note: 'cautious squint'},
  {f: BRAKE2, kind: 'robot_brake', note: 'brakes at the stop line'},
  ...footsteps.filter((f) => f >= TILT2 + TILT2_DUR - 6 && f < TILE0).map((f, i): Sfx => ({f, kind: 'footstep_wood', gain: -12, pitch: i % 2 ? -1 : 0, note: 'the person (quiet)'})),
  // V11.4 tiles
  ...T1_PULSES.map((f, i): Sfx => ({f, kind: 'sensor_pulse', gain: -7 - i, pitch: i, note: 'tile 1: short range'})),
  // director r1: the limits run under a quiet bed (shot plan): the swallowed pulse is silent (no bounce tick: the
  // contrast with the shiny tick is the point); no number ticks, no card flick for the row
  {f: T2_DARK0, kind: 'sensor_pulse', gain: -8, note: 'tile 2: dark'},
  {f: T2_SHINY0, kind: 'sensor_pulse', gain: -9, pitch: 1, note: 'tile 2: shiny'},
  {f: T2_SHINY0 + Math.round(Math.hypot(T2_SHINY_W.x - SENS_T.x, T2_SHINY_W.z - SENS_T.z) / TILE_SPEED), kind: 'bounce_tick', gain: -4, pitch: 4, note: 'shiny bounce'},
  {f: T3_PING, kind: 'sensor_pulse', gain: -9, note: 'tile 3: the ping into the sunlit wall'},
  {f: T3_FLOOD, kind: 'sun_glare', gain: -9, note: 'tile 3: the sunlit wall floods the sensor'},
  // V11.5
  // review r1 (V2-R1-37): ducked a further 5 dB (−6 → −11) across n30, whose soft tails ("now,", "system.") it tied
  {f: CREEP3, kind: 'robot_motor', dur: (K.end - CREEP3) / 30, gain: -11, note: 'creeps on round the corner (under n30)'},
  {f: TAP3, kind: 'robot_brake', gain: -11, pitch: 2, note: 'the soft settle on "not a safety system": one light brake tap'},
  {f: CLUE_PING, kind: 'sensor_pulse', gain: -9, note: 'one ping on "clue"'},
];

/** For the report. */
export const V11_REPORT = {camEnd: CAM_END, contractX: V12_PARTITION_FAR_X, cornerEndX: cornerOnScreen(CAM_END).x, cornerWide: V11_CORNER_WIDE};
