import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, camPath, hop, sp, SNAP, tw} from '../lib/motion';
import {CAM_ROOM} from '../lib/shots';
import {LAYOUT, PTS, assertAroundTheEnd, depthSort, hiddenByPartition, projectWith, rigAt, viewAt, type PlanPt} from '../lib/room';
import {LAYOUT as OLAYOUT, layoutPoints, type P2} from '../lib/optics';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {
  ARMS,
  Character2,
  EXPR,
  GAITS,
  HANDS_ON_HIPS,
  IDLE2,
  KNEE_DEFAULT,
  SNEAK_ARMS,
  STAND_FEET,
  handWorld2,
  mixPose2,
  planTrip,
  reach2,
  rigCovers,
  settleAt,
  tripContacts,
  tripDistance,
  tripDuration,
  tripPose,
  withPose,
  type Foot,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {SensorStand, standGeometry} from '../components/v02/S1_SensorStand';
import {RealTrackBoard, TRACK_GEOM, replayIndex, trackPoint, REPLAY} from '../components/v2k/RealTrackBoard';
import {Label, labelBox} from '../components/v2k/Labels';
import {BoardWall} from '../components/v2s/V1_BoardWall';

/**
 * V1 · Hide and the real track (s02, n01, n02). v2/SHOTPLAN_V2.md V1.
 *
 *  V1.1 0 → "It's"     Sensor-facing room view, locked (tilt 0, the shared CAM_ROOM). Silent hide: the guesser tiptoes in
 *                      two steps from the right (heel contacts), settles behind the partition, hands on hips, smug. On
 *                      "can't see him" a dashed sight line runs from the sensor's window toward him and stops at the
 *                      partition's camera-side face with a coral X; "blocked" (64, ink) cuts in by ~2 s.
 *  V1.2 "It's" → "researchers"  The S1.2 push (8 %, tilt 0). The checker taps the sensor (contact; readout on; "sensor"
 *                      64). On "pointed" the field-of-view frustum grows out of the sensor and lands as a pale patch of
 *                      bare wall well clear of him, filling on "plain". He glances at the blank wall and gives it a smug
 *                      nod (his belief: a blank wall can't give him away). "Yet": her brow lifts.
 *  V1.3 "researchers" → CUTIN  HARD CUT to the real board (kit RealTrackBoard): stored_xz replayed from data index 6, every
 *                      2nd data frame, one plotted position per video frame, no interpolation, tagged "sped up", starting
 *                      on the cut. "sensor" · "blocked" on the cut, "estimated position" on "track"; the wall band is
 *                      the room's wall colour and its 16 measured points pulse once on "wall"; on "That dot" the
 *                      label brightens once and a slow 5 % push toward the dot runs to the board's last frame. No cartoon.
 *  V1.4 CUTIN → end    0.6 s room cut-in (tilt 0, close on him): his smirk freezes. Never synced to the track.
 *
 * Out: V2 opens on our plan with the board's sensor marker, wall line and partition at the screen positions the board
 * held on its last frame (V1_BOARD_END, exported below; the 5 % push included).
 *
 * Light rule: the two room light elements (the blocked sight line and the field-of-view frustum) are drawn at tilt 0 only
 * and checked with assertAroundTheEnd at module load at both zooms they are seen at (CAM_ROOM and CAM_PUSH).
 */

/* ================================================================== cues (narration words) */

const SC = scene('V1');
const K = {
  start: SC.from,
  end: SC.to,
  that: at('s02', 'that'),
  sensor: at('s02', 'sensor'),
  cant: at('s02', "can't"),
  see: at('s02', 'see'),
  him: at('s02', 'him'),
  its: at('s02', "it's"),
  pointed: at('s02', 'pointed'),
  plain: at('s02', 'plain'),
  blank: at('s02', 'blank'),
  wall: at('s02', 'wall'),
  s02End: segEnd('s02'),
  yet: at('n01', 'yet'),
  researchers: at('n01', 'researchers'),
  wall1: at('n01', 'wall'),
  track: at('n01', 'track'),
  n02: seg('n02').from,
  that2: at('n02', 'that'),
  dot: at('n02', 'dot'),
  photograph: at('n02', 'photograph'),
  n02End: segEnd('n02'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;
const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== geometry */

const LIGHT_H = LAYOUT.sensor.h;
const {S, H} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
const faceX = OCC.x - OCC.thickness / 2;
const at3 = (p: P2): PlanPt => ({x: p.x, z: p.z, h: LIGHT_H});
const VIEW0 = viewAt(0);
/** Where the straight line from the sensor toward him meets the partition's camera-side face (v1 GHOST_HIT). */
const GHOST_HIT: P2 = {x: faceX, z: S.z + (H.z - S.z) * ((faceX - S.x) / (H.x - S.x))};
/** The sight line aims from the sensor's window at his eyes (h EYE_H): the 3D line S -> eyes meets the face at HIT3. */
const EYE_H = 1.45;
const HIT_U = (faceX - S.x) / (H.x - S.x);
const HIT3: PlanPt = {x: GHOST_HIT.x, z: GHOST_HIT.z, h: LIGHT_H + (EYE_H - LIGHT_H) * HIT_U};
/** The emitter lens rim on the sensor box's top edge (HandheldSensor local px, the far face's window as drawn). */
const RIM_LOCAL = {x: -11, y: -121};
/** The S1.2 field of view: the sensor's zones (frames.A zoneEdgesX) x the light plane ± 0.37 m on the wall z = 0. */
const FOV_ZONE = (LAYOUT as unknown as {frames: {A: {zoneEdgesX: number[]}}}).frames.A.zoneEdgesX;
const FOV_CORNERS: [number, number][] = [
  [FOV_ZONE[0], LIGHT_H - 0.37],
  [FOV_ZONE[FOV_ZONE.length - 1], LIGHT_H - 0.37],
  [FOV_ZONE[FOV_ZONE.length - 1], LIGHT_H + 0.37],
  [FOV_ZONE[0], LIGHT_H + 0.37],
];
const fovSection = (u: number): PlanPt[] => FOV_CORNERS.map(([x, h]) => ({x: lerp(S.x, x, u), z: lerp(S.z, 0, u), h: lerp(LIGHT_H, h, u)}));
const FOV_GHOSTS = [0.35, 0.7];

/* ================================================================== cameras */

/** V1.2 push: 8 % in toward the sensor and the lit wall patch (the v1 S1.2 push, tilt 0). */
const CAM_PUSH: Cam = {cx: 852, cy: 498, zoom: CAM_ROOM.zoom * 1.08};
/** "Yet…" (owner's note on the release candidate: the turn into "Yet" was sudden): through the "Yet…" beat the camera
 *  moves on toward the lit patch of bare wall the sensor is aimed at, gathering speed into the hard cut on
 *  "researchers", so the cut lands on a move toward the wall the light bounces off (the board opens on the authors'
 *  measured wall points along its top). The style still changes visibly on the cut (evidence brief: no morph). */
const PATCH_W = (() => {
  const q = fovSection(1).map((p) => projectWith(VIEW0, p));
  return {x: q.reduce((s, p) => s + p.x, 0) / q.length, y: q.reduce((s, p) => s + p.y, 0) / q.length};
})();
const CAM_YET: Cam = {cx: lerp(CAM_PUSH.cx, PATCH_W.x, 0.55), cy: lerp(CAM_PUSH.cy, PATCH_W.y, 0.55), zoom: CAM_PUSH.zoom * 1.2};
/** V1.4 cut-in: close on him behind the partition's end (head, chest and the partition's edge). */
const GU_END = rigAt(H.x, H.z, 0);
const CAM_CUTIN: Cam = {cx: GU_END.x + 118, cy: GU_END.y - 430, zoom: 2.4};

/* ================================================================== beats */

// V1.1 — the sneak: a short anticipation hold, two tiptoe steps, arrive, settle smug
const STEPS = 2;
const STEP_M = (STEPS * GAITS.tiptoe.step * GU_END.scale) / VIEW0.ppm; // plan metres covered by two tiptoe steps
const HX0 = H.x + STEP_M;
const GU0 = rigAt(HX0, H.z, 0);
const PLAN = planTrip(GU0.x - GU_END.x, GU0.scale, 'tiptoe');
const SNEAK_GO = K.start + 4;
const FPS_STEP = clamp(Math.floor((K.that - 8 - SNEAK_GO) / STEPS), 10, 13);
const PULSE = 0.55;
const T_ARRIVE = SNEAK_GO + tripDuration(PLAN, FPS_STEP);
const STEPS_AT = tripContacts(SNEAK_GO, PLAN, FPS_STEP, PULSE);
// The arrival, staged so nothing snaps (v2 review r1, V2-R1-11: it used to blend the whole tiptoe crouch into the smug
// stance in ~3 frames, legs, arms and face together). Contact (last tiptoe step) → the heels drop → the knees
// straighten, still bent toward his travel (sink eases out as (1 − u)², so the visible knee bend, which goes roughly
// with √sink near full extension, closes at a steady rate over ~10 frames instead of in one) → the feet square up to
// the camera → the weight settles onto one leg (the SOFT spring overshoots a touch) and, on that settle frame, the
// face turns smug. The paws drop to his sides first, change layer while they hang clear of the torso, then go to the
// hips.
const HEEL0 = T_ARRIVE;
const HEEL_DUR = 5;
const KNEE0 = T_ARRIVE + 2;
const KNEE_DUR = 11;
const TURN0 = KNEE0 + 7;
const TURN_DUR = 8;
const SETTLE_AT = KNEE0 + KNEE_DUR - 3;
const FACE0 = SETTLE_AT;
const FACE_DUR = 7;
const PAWS0 = T_ARRIVE + 1;
const PAWS_DUR = 7;
const HIPS0 = PAWS0 + PAWS_DUR;
const HIPS_DUR = 9;

// "can't see him": the sight line from the sensor's window draws on and stops at the partition's face with an X
const SIGHT0 = K.cant;
const SIGHT_HIT = Math.max(SIGHT0 + 8, K.see);
const BLOCKED_IN = SIGHT_HIT + 1;
// her glance at him on "see him", back to the sensor for the tap
const GLANCE0 = K.see - 4;
const GLANCE1 = K.its - 10;

// V1.2 — push, tap, readout on, field of view, his glance and smug nod
const PUSH0 = K.its;
const PUSH_DUR = clamp(K.plain - K.its, 24, 40);
const TAP = K.its + 3; // her palm meets the top of the sensor box
const SENSOR_LBL = TAP + 2;
const FOV0 = K.pointed;
const FOV_GROW = clamp(K.plain - K.pointed - 4, 8, 14);
const PATCH0 = K.plain;
const LOOK_WALL = K.plain - 2;
const NOD = K.blank + 2;
const NOD_DUR = 16;
const LOOK_BACK = Math.max(NOD + NOD_DUR + 4, K.wall + 10);
const KNOWING = K.yet; // her brow lifts as the reveal is promised
// "plain, blank wall": she leans out to the viewer's left and glances up at the lit patch on the wall behind her (gaze to
// the subject; at tilt 0 her head would otherwise cover most of the patch), then back to the readout on "Yet"
const LEAN0 = Math.max(TAP + 22, K.plain - 4);
const LEAN_DUR = 12;
const PATCH_LOOK1 = K.yet - 4;
const LEAN_PEEK = -0.75;

// "Yet…": the move toward the lit wall patch (CAM_YET); the room labels fade as it starts
const YET_PUSH0 = K.yet + 2;
const YET_PUSH_DUR = Math.max(10, K.researchers - YET_PUSH0);
const YET_FADE = 8;
// V1.3 — the board (hard cut on "researchers"); it settles in from 3.5 % large over its first 9 frames
const BOARD0 = K.researchers;
const BOARD_SETTLE = 9;
/** The cut-in starts 0.6 s before the scene's end (as "photograph" lands), never before n02's last word. */
const CUTIN = Math.max(K.photograph + 6, K.end - 18);
const DOT_LBL = K.track;
const BRIGHTEN = K.dot;
/** "light bouncing off a wall": the 16 measured wall points pulse once (the band is the room's wall colour) */
const WALL_PULSE = K.wall1;
const WALL_PULSE_DUR = 20;
const BPUSH0 = K.that2;
const BPUSH_FOCUS = replayIndex(BPUSH0, BOARD0);
const BOARD_LAST = CUTIN - 1;
// V1.4 — the freeze
const FREEZE = CUTIN + Math.min(6, Math.max(3, K.n02End - CUTIN));

/** The replay mapping actually used (stated in the report / source record). */
export const V1_REPLAY = {startFrame: BOARD0, startIndex: REPLAY.start, step: REPLAY.step, lastFrame: BOARD_LAST, lastIndex: replayIndex(BOARD_LAST, BOARD0), plotted: BOARD_LAST - BOARD0 + 1};

/**
 * The board's sensor marker, wall line and partition on its LAST frame (the 5 % push is complete there: push 1 → scale
 * 1.05 about the dot at "That"), for the V1 → V2 match. Screen px.
 */
export const V1_BOARD_END = (() => {
  const f = trackPoint(BPUSH_FOCUS);
  const s = 1.05;
  const P = (p: {x: number; y: number}) => ({x: f.x + (p.x - f.x) * s, y: f.y + (p.y - f.y) * s});
  const sensor = P(TRACK_GEOM.sensor);
  const wallY = P({x: 0, y: TRACK_GEOM.wallY}).y;
  const p0 = P({x: TRACK_GEOM.partition.x, y: TRACK_GEOM.partition.y0});
  return {sensor, wallY, partition: {x: p0.x, y0: p0.y}, K: TRACK_GEOM.K * s, focus: f};
})();

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -4},
  ...STEPS_AT.map((f, i) => ({f, kind: 'tiptoe_step' as const, pitch: [0, -1, 1][i % 3], gain: i === STEPS_AT.length - 1 ? -4 : -1})),
  {f: SETTLE_AT + 2, kind: 'cloth_rustle', gain: -7},
  {f: SIGHT_HIT, kind: 'partition_thunk', gain: -10, note: 'the sight line stops at the partition (soft)'},
  // −8 dB: at full gain it covered the "-t's" of "It's" (v2 review r1, V2-R1-40); the cue stays on the contact
  {f: TAP, kind: 'readout_beep', gain: -8},
  {f: TAP + 2, kind: 'sensor_hum', dur: (BOARD0 - TAP - 2) / 30, gain: -12},
  {f: NOD + 4, kind: 'smug_exhale', gain: -2},
  {f: FREEZE, kind: 'uh_oh', gain: -4, note: 'V1.4: his smirk freezes'},
];

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;
const sneakFace: Partial<Pose2> = {lid: 0.22, brows: -0.4, browAsym: 0.2, mouth: 'hmm', lookX: -0.75, lookY: 0.05, tilt: 4};

/** The arrival, from the tiptoe stance (sneak pose at the trip's end) to the smug stance smugBase, in stages. */
const arrivePose = (g: number, sneak: Pose2, smugBase: Pose2): Pose2 => {
  if (g < HEEL0) return sneak;
  const heel = tw(g, HEEL0, HEEL_DUR, E.inOut);
  const turn = tw(g, TURN0, TURN_DUR, E.inOut);
  const knee = tw(g, KNEE0, KNEE_DUR, E.linear);
  const kneeK = 1 - (1 - knee) * (1 - knee);
  const paws = tw(g, PAWS0, PAWS_DUR, E.inOut);
  const hips = tw(g, HIPS0, HIPS_DUR, E.softBack);
  const face = tw(g, FACE0, FACE_DUR, E.inOut);
  // legs: heel lift and pitch with the heels; the feet's turn and knee direction once the knees are nearly straight
  // (turning a bent knee toward the camera would read as an instant straightening); sink and hunch with the knees
  const fa = sneak.feet ?? STAND_FEET;
  const fb = smugBase.feet ?? STAND_FEET;
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const foot = (a: Foot, b: Foot, side: -1 | 1): Foot => ({
    x: L(a.x, b.x, heel),
    lift: L(a.lift ?? 0, b.lift ?? 0, heel),
    pitch: L(a.pitch ?? 0, b.pitch ?? 0, heel),
    turn: L(a.turn ?? 0, b.turn ?? 0, turn),
    knee: L(a.knee ?? side * KNEE_DEFAULT, b.knee ?? side * KNEE_DEFAULT, turn),
  });
  // face and head: the smug look on the settle
  const faced = mixPose2(sneak, smugBase, face);
  // arms: sneak paws → hanging at his sides (IDLE2, drawn in front) → fists on hips (drawn behind)
  const lerpArm = (a: Pose2['armL'], b: Pose2['armL'], t: number) => ({a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t});
  const armL = g < HIPS0 ? lerpArm(sneak.armL, IDLE2.armL, paws) : lerpArm(IDLE2.armL, smugBase.armL, hips);
  const armR = g < HIPS0 ? lerpArm(sneak.armR, IDLE2.armR, paws) : lerpArm(IDLE2.armR, smugBase.armR, hips);
  const m = (a: number | undefined, b: number | undefined, t: number) => (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;
  return {
    ...faced,
    armL,
    armR,
    armsFront: g < HIPS0 ? sneak.armsFront : smugBase.armsFront,
    feet: {L: foot(fa.L, fb.L, -1), R: foot(fa.R, fb.R, 1)},
    sink: m(sneak.sink, smugBase.sink, kneeK),
    hunch: m(sneak.hunch, smugBase.hunch, kneeK),
    lean: m(sneak.lean, smugBase.lean, kneeK),
    shift: smugBase.shift,
    tilt: m(sneak.tilt, smugBase.tilt, face),
  };
};

const guesserState = (g: number) => {
  const dist = tripDistance(g, SNEAK_GO, PLAN, FPS_STEP, PULSE);
  // anticipation: crouched sneak start pose, held still before the first step
  let pose: Pose2 = tripPose(dist, PLAN, {dir: -1, base: {...SNEAK_ARMS, ...sneakFace}});
  const smugBase: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lookX: -0.35, ...settleAt(g, SETTLE_AT, -1)});
  pose = arrivePose(g, pose, smugBase);
  const planX = HX0 - (dist / (GU0.x - GU_END.x)) * (HX0 - H.x);
  // "can't see him": a smug eyebrow wiggle
  const wig = pulseAt(g, K.him, 14);
  if (wig > 0) pose = {...pose, browAsym: (pose.browAsym ?? 0) + 0.5 * wig, brows: pose.brows + 0.2 * wig};
  // "plain, blank wall": he glances up at the bare wall, then a smug nod at it (his belief), then back out
  const look = tw(g, LOOK_WALL, 8, E.inOut) * (1 - tw(g, LOOK_BACK, 10, E.inOut));
  if (look > 0) pose = {...pose, lookX: lerp(pose.lookX, -0.8, look), lookY: lerp(pose.lookY, -0.75, look), tilt: lerp(pose.tilt, -4, look), lid: lerp(pose.lid ?? 0.5, 0.42, look)};
  const nod = pulseAt(g, NOD, NOD_DUR);
  if (nod > 0) pose = {...pose, lookY: pose.lookY + 0.55 * nod, bob: (pose.bob ?? 0) + 5 * nod, hunch: (pose.hunch ?? 0) + 0.03 * nod, lid: lerp(pose.lid ?? 0.5, 0.8, nod), mouth: 'smirk'};
  // V1.4: the smirk freezes: eyes snap wide, pupils pinpoint, a sweat drop; the smirk stays put
  if (g >= CUTIN) {
    const base: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lookX: -0.2, lookY: 0.15, ...settleAt(g, SETTLE_AT, -1)});
    const kf = sp(g, FREEZE, SNAP);
    const frozen: Pose2 = {...base, eyes: 1.22, pupil: 0.62, brows: 0.9, browAsym: 0, lid: 0, lookX: -0.45, lookY: -0.05, sweat: 1, mouth: 'smirk', tilt: 2};
    pose = g < FREEZE ? base : mixPose2(base, frozen, Math.min(1.05, kf));
    if (g >= FREEZE) pose = {...pose, bob: hop(g, FREEZE, 6, 6)};
  }
  const life = g < T_ARRIVE ? 0 : 0.45 * tw(g, T_ARRIVE, 16) * (g >= FREEZE ? 0 : 1);
  const blink = g >= FREEZE || g < T_ARRIVE ? 1 : undefined;
  if (blink) pose = {...pose, blink};
  const place = rigAt(planX, H.z, 0);
  return {pose, planX, place, life};
};

/** Her palm on the top of the sensor box (sensor-local px, v1 TAP_TARGET) and the IK solution. */
const TAP_TARGET = {x: 20, y: -130};
const TAP_ELBOW: 1 | -1 = 1;

const checkerState = (g: number) => {
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, 0);
  const place: RigPlace = {x: op.x, y: op.y, scale: op.scale, frame: g, seed: CHECKER_SEED, life: 0.3};
  const atReadout = {lookX: 0.62, lookY: 0.32, tilt: 3};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: -1};
  const glance = Math.min(tw(g, GLANCE0, 8, E.inOut), 1 - tw(g, GLANCE1, 8, E.inOut));
  const look = {
    lookX: lerp(atReadout.lookX, atHim.lookX, glance),
    lookY: lerp(atReadout.lookY, atHim.lookY, glance),
    tilt: lerp(atReadout.tilt, atHim.tilt, glance),
  };
  const knowing = tw(g, KNOWING, 10, E.inOut);
  // the lean (held to the cut) and the glance at the patch
  const lean = tw(g, LEAN0, LEAN_DUR, E.inOut);
  const atPatch = {lookX: 0.5, lookY: -0.8, tilt: 2};
  const patchLook = Math.min(tw(g, LEAN0 + 2, LEAN_DUR - 2, E.inOut), 1 - tw(g, PATCH_LOOK1, 8, E.inOut));
  look.lookX = lerp(look.lookX, atPatch.lookX, patchLook);
  look.lookY = lerp(look.lookY, atPatch.lookY, patchLook);
  look.tilt = lerp(look.tilt, atPatch.tilt, patchLook);
  let pose: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, ...look, brows: -0.05 + 0.3 * knowing, browAsym: 0.45 * knowing, peek: LEAN_PEEK * lean});
  // after the tap she folds her arms, deadpan (her hand leaves the box straight into the fold)
  const fold = tw(g, TAP + 6, 16, E.inOut);
  if (fold > 0) pose = mixPose2(pose, {...pose, ...ARMS.armsCrossed, armsFront: 'both'}, fold);
  // the tap: anticipation (reach in), contact on TAP (palm on the box top), release
  const geo = standGeometry(0);
  const k = tw(g, TAP - 10, 10, E.inOut) * (1 - tw(g, TAP + 6, 16, E.inOut));
  if (k > 0) {
    const tgt = geo.at(TAP_TARGET.x, TAP_TARGET.y);
    pose = mixPose2(pose, {...pose, armR: reach2(place, pose, 1, tgt.x, tgt.y, TAP_ELBOW)}, k);
  }
  return {pose, place};
};

/** Sort depth of the sensor stand: painted over the checker (her sleeve would cover the readout otherwise; v1). */
const STAND_SORT_Z = LAYOUT.operator.z + 0.2;

/* ================================================================== the room shot (V1.1, V1.2, V1.4) */

const roomCam = (g: number): Cam =>
  g >= CUTIN
    ? CAM_CUTIN
    : camPath(g, CAM_ROOM, [
        {at: PUSH0, dur: PUSH_DUR, to: CAM_PUSH},
        {at: YET_PUSH0, dur: YET_PUSH_DUR, to: CAM_YET, ease: E.in},
      ]);

/** The sight line's ends (screen px at a camera): from the sensor's emitter rim (its window) to the face hit HIT3. */
const sightWorld = () => {
  const rim = standGeometry(0).at(RIM_LOCAL.x, RIM_LOCAL.y);
  const hit = projectWith(VIEW0, HIT3);
  return {a: rim, b: {x: hit.x, y: hit.y}};
};
const sightEnds = (cam: Cam) => {
  const w = sightWorld();
  return {a: worldToScreen(cam, w.a.x, w.a.y), b: worldToScreen(cam, w.b.x, w.b.y)};
};

/** "blocked" and "sensor" label anchors (screen px, at the camera of the frame). Settled labels do not move: they are
 *  placed at the pushed framing's positions and the push finishes before "sensor" is up long. */
const BLOCKED_SIZE = 64;
const SENSOR_SIZE = 64;

const Cross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.white} strokeWidth={21} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={6.5} strokeLinecap="round" />
  </g>
);

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const s = VIEW0;
  const cam = roomCam(g);
  const gu = guesserState(g);
  const ch = checkerState(g);
  const geo = standGeometry(0);

  // the readout: dark until the tap, blinks on, the cursor sweeps once
  const tapOn = g >= TAP ? (g < TAP + 4 ? (Math.floor(g - TAP) % 2 === 0 ? 1 : 0.3) : 1) : 0;
  const reveal = g >= TAP ? tw(g, TAP + 2, 30, E.linear) : 0;
  const led = g < TAP ? 0.15 : tapOn;

  const items: RoomItem[] = [
    {key: 'checker', x: LAYOUT.operator.x, z: LAYOUT.operator.z, w: 0.3, node: <Character2 look={CAST.checker} pose={ch.pose} frame={g} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} />},
    {key: 'stand', x: PTS.S.x, z: STAND_SORT_Z, w: 0.17, height: 1.4, node: <SensorStand tilt={0} sensor={{reveal: reveal * tapOn, led}} />},
    {key: 'guesser', x: gu.planX, z: H.z, w: 0.3, node: <Character2 look={CAST.guesser} pose={gu.pose} frame={g} seed={GUESSER_SEED} x={gu.place.x} y={gu.place.y} scale={gu.place.scale} life={gu.life} eyeDarts={g >= T_ARRIVE && g < FREEZE} />},
  ];

  // backdrop: the field-of-view frustum from the sensor to its patch of bare wall (V1.2), under her and the partition
  const fovOn = g >= FOV0 && g < BOARD0;
  const fovU = fovOn ? tw(g, FOV0, FOV_GROW, E.out) : 0;
  const patch = fovOn ? tw(g, PATCH0, 10, E.out) : 0;
  const polyPts = (pts: PlanPt[]) => pts.map((p) => projectWith(s, p));
  const polyPath = (qs: {x: number; y: number}[]) => `M ${qs.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ')} Z`;
  const sP = projectWith(s, at3(S));
  const backdrop =
    fovU > 0 ? (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {(() => {
          const sec = polyPts(fovSection(fovU));
          return (
            <g>
              <path d={polyPath(sec)} fill={C.saffronLight} opacity={f2(0.35 + 0.65 * patch)} />
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
      </svg>
    ) : null;

  // screen-space overlay: the sight line and its X, the labels
  const room = g < CUTIN;
  const sight = room ? tw(g, SIGHT0, SIGHT_HIT - SIGHT0, E.in) : 0;
  const {a, b} = sightEnds(cam);
  const head = {x: lerp(a.x, b.x, sight), y: lerp(a.y, b.y, sight)};
  const xk = g >= SIGHT_HIT ? E.back(clamp01((g - SIGHT_HIT) / 6)) : 0;
  const yetFade = 1 - tw(g, YET_PUSH0, YET_FADE, E.linear);
  const blockedT = room ? tw(g, BLOCKED_IN, 3, E.linear) * yetFade : 0;
  const sensorT = room ? tw(g, SENSOR_LBL, 5, E.linear) * yetFade : 0;
  const lab = labelSpots(cam);

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={0} items={items} backdrop={backdrop} />
        </Layer>
      </Camera>
      {room && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {sight > 0 && <path d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(head.x)} ${f2(head.y)}`} stroke={C.coralDeep} strokeWidth={8} strokeDasharray="18 13" strokeLinecap="round" fill="none" />}
          {xk > 0 && <Cross x={b.x - 4} y={b.y} s={24 * xk} />}
          {sensorT > 0 && (
            <Label asGroup x={lab.sensor.x} y={lab.sensor.y} size={SENSOR_SIZE} anchor="middle" opacity={sensorT}>
              sensor
            </Label>
          )}
          {blockedT > 0 && (
            <Label asGroup x={lab.blocked.x} y={lab.blocked.y} size={BLOCKED_SIZE} anchor="middle" opacity={blockedT}>
              blocked
            </Label>
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};

/** Label anchors (world px, mapped through the frame's camera; font sizes never scale): "blocked" sits on the partition
 *  just under the X (the word on the thing that blocks), set in ink with its white halo, so it reads on the coral panels
 *  and his shirt; only the X is coral (v2 review r1, V2-R1-19); "sensor" sits under the sensor box, over its tripod column,
 *  between her legs and the partition (her arms are crossed by then, so nothing hangs there). */
const LABEL_WORLD = (() => {
  const geo = standGeometry(0);
  const hit = sightWorld().b;
  return {
    blocked: {x: hit.x + 52, y: hit.y + 96},
    sensor: {x: (geo.box.x0 + geo.box.x1) / 2 + 14, y: geo.box.y1 + 150},
    sensorTip: {x: (geo.box.x0 + geo.box.x1) / 2 + 10, y: geo.box.y1 + 10},
  };
})();
const labelSpots = (cam: Cam) => {
  const P = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  return {blocked: P(LABEL_WORLD.blocked), sensor: P(LABEL_WORLD.sensor), sensorTip: P(LABEL_WORLD.sensorTip)};
};

/* ================================================================== the board (V1.3) */

const BoardShot: React.FC<{g: number}> = ({g}) => {
  const push = tw(g, BPUSH0, BOARD_LAST - BPUSH0, E.linear);
  const settle = 1 + 0.035 * (1 - tw(g, BOARD0, BOARD_SETTLE, E.out));
  return (
    <AbsoluteFill style={settle > 1 ? {transform: `scale(${settle})`, transformOrigin: '50% 50%'} : undefined}>
      <RealTrackBoard
        idx={replayIndex(g, BOARD0)}
        sensorLabel={1}
        blocked={1}
        blockedLabel={1}
        dotLabel={tw(g, DOT_LBL, 6, E.linear)}
        labelBrighten={tw(g, BRIGHTEN, 20, E.linear)}
        push={push}
        pushFocusIdx={BPUSH_FOCUS}
      />
      {/* the wall band in the room's wall colour; the measured wall points pulse once on "wall" (V2-R1-18) */}
      <BoardWall push={push} focusIdx={BPUSH_FOCUS} pulse={tw(g, WALL_PULSE, WALL_PULSE_DUR, E.linear)} />
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const V1HideTrack: React.FC = () => {
  const g = useG();
  if (g >= BOARD0 && g < CUTIN) return <BoardShot g={g} />;
  return <RoomShot g={g} />;
};

/* ================================================================== module-load checks (they throw) */

export const V1_CHECKS = (() => {
  const fail = (m: string) => {
    throw new Error(`V1: ${m}`);
  };
  if (PLAN.steps !== STEPS) fail(`the sneak plans ${PLAN.steps} steps (needs ${STEPS})`);
  if (T_ARRIVE + 10 > SIGHT0) fail('he must have settled before the sight line draws');
  if (Math.max(HIPS0 + HIPS_DUR, FACE0 + FACE_DUR, KNEE0 + KNEE_DUR, TURN0 + TURN_DUR) > SIGHT0) fail('the arrival must be complete before the sight line draws');
  if (FACE0 < KNEE0 + KNEE_DUR - 4) fail('the face must turn on the settle, after the knees have nearly straightened');
  if (BLOCKED_IN > K.start + 66) fail(`"blocked" is up only at frame ${BLOCKED_IN} (needs ~2 s)`);
  if (CUTIN - BOARD0 < 180) fail('the board must hold at least 6 s');
  if (K.end - CUTIN > 20 || K.end - CUTIN < 12) fail(`the cut-in lasts ${K.end - CUTIN} frames (0.4-0.67 s)`);
  if (BPUSH_FOCUS < REPLAY.start) fail('the push focus is before the replay start');
  if (WALL_PULSE < BOARD0 || WALL_PULSE + WALL_PULSE_DUR > BPUSH0) fail('the wall-point pulse must play on the board, before the push');
  // the room light rule at tilt 0, both zooms: the blocked line stops on the camera-side face; the frustum's corner rays
  // and cross-sections (drawn in the backdrop under her and the partition)
  const fovLegs: PlanPt[][] = FOV_CORNERS.map(([x, h]) => [at3(S), {x, z: 0, h}]);
  for (const u of [0.2, 0.35, 0.5, 0.7, 0.85, 1]) {
    const sec = fovSection(u);
    for (let i = 0; i < 4; i++) fovLegs.push([sec[i], sec[(i + 1) % 4]]);
  }
  if (YET_PUSH0 + YET_FADE > BOARD0) fail('the room labels must have faded before the cut to the board');
  if (BOARD0 + BOARD_SETTLE > WALL_PULSE) fail('the board must have settled before the wall points pulse');
  for (const zoom of [CAM_ROOM.zoom, CAM_PUSH.zoom, CAM_YET.zoom]) {
    assertAroundTheEnd('V1 blocked line', [[at3(S), HIT3]], VIEW0, {zoom, allowFront: true});
    assertAroundTheEnd('V1 field of view', fovLegs, VIEW0, {zoom, allowFront: true});
  }
  if (hiddenByPartition({...HIT3, x: HIT3.x - 0.012}, VIEW0)) fail('the X would be drawn on a point the partition hides');
  // the tap: her palm on the box top, contact error <= 1 px while held
  let tapErr = 0;
  for (let g = TAP; g <= TAP + 6; g++) {
    const c = checkerState(g);
    const tgt = standGeometry(0).at(TAP_TARGET.x, TAP_TARGET.y);
    const hand = handWorld2(c.place, c.pose, 1);
    tapErr = Math.max(tapErr, Math.hypot(hand.x - tgt.x, hand.y - tgt.y));
  }
  if (tapErr > 1) fail(`the tap misses the sensor by ${tapErr.toFixed(1)} px`);
  // labels: inside x 96..1824, y 54..950 (measured text: browser only; tools that load the cue sheets run in Node)
  const boxes: [string, ReturnType<typeof labelBox>][] = [];
  const lr = labelSpots(CAM_ROOM);
  const lp = labelSpots(CAM_PUSH);
  if (typeof document !== 'undefined') {
    boxes.push(['blocked@room', labelBox('blocked', lr.blocked.x, lr.blocked.y, BLOCKED_SIZE, 'middle')]);
    boxes.push(['blocked@push', labelBox('blocked', lp.blocked.x, lp.blocked.y, BLOCKED_SIZE, 'middle')]);
    boxes.push(['sensor', labelBox('sensor', lp.sensor.x, lp.sensor.y, SENSOR_SIZE, 'middle')]);
  }
  if (typeof document !== 'undefined') for (const [n, bx] of boxes) if (bx.x0 < 96 || bx.x1 > 1824 || bx.y0 < 54 || bx.y1 > 950) fail(`label ${n} leaves the safe area (${bx.x0.toFixed(0)},${bx.y0.toFixed(0)})-(${bx.x1.toFixed(0)},${bx.y1.toFixed(0)})`);
  // depth order: the stand paints over her
  const order = depthSort([{key: 'stand', x: PTS.S.x, z: STAND_SORT_Z, w: 0.17, height: 1.4}, {key: 'checker', x: LAYOUT.operator.x, z: LAYOUT.operator.z, w: 0.3}], 0).map((it) => it.key);
  if (order[0] !== 'checker') fail('the stand would be painted behind her');
  // the X lands where neither figure covers it
  const hit = projectWith(VIEW0, HIT3);
  if (rigCovers(rigAt(H.x, H.z, 0), hit) || rigCovers(rigAt(LAYOUT.operator.x, LAYOUT.operator.z, 0), hit)) fail('a figure covers the X');
  return {tapErr, cutin: CUTIN, board0: BOARD0, steps: STEPS_AT, replay: V1_REPLAY, match: V1_BOARD_END};
})();
