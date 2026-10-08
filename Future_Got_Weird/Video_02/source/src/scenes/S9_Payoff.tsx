import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, SOFT, camPath, hop, ring, sp, tw} from '../lib/motion';
import {CAM_ROOM, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, projectWith, rigAt, tiltAt, viewAt, type Layout, type ViewState} from '../lib/room';
import {
  LAYOUT as OLAYOUT,
  assertPath,
  confocalPath,
  firstOccluderHit,
  layoutPoints,
  lerpP,
  pathLength,
  pathSchedule,
  possibleCloud,
  scatterDirections,
  sub,
  type P2,
  type ScalarField,
} from '../lib/optics';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {Partition} from '../components/v02/Partition';
import {LightPath, ScatterFan, type ToPx} from '../components/v02/Optics';
import {
  ARMS,
  Character2,
  EXPR,
  HANDS_ON_HIPS,
  IDLE2,
  mixPose2,
  planTrip,
  reach2,
  tripContacts,
  tripDistance,
  tripPose,
  withPose,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {reachLocal} from '../components/Character';
import {S9SensorStand, behindBox, boxOf, movedLayout, planWalk, standGeometry, walkAt, walkContacts, walkDistance, type WalkState} from '../components/v02/S9_Room';
import {MiniReadout, ReadoutInset} from '../components/v02/S9_Readout';
import {EndCard} from '../components/v02/S9_EndCard';

/**
 * S9 · Payoff (s45–s48). Storyboard shots S8.1–S8.4 (now scene S9).
 *
 *  S9.1 s45  room view (tilt 0, CAM_ROOM): the guesser still hiding at H behind the partition, nervous (paws up, sweat,
 *            eyes darting to the checker); on "friend" he notices us: a sheepish grin and a tiny wave. She side-eyes him.
 *  S9.2 s46  the camera rises to RAISED_TILT and widens (one move, "Being out of sight"); two slowed pulses replay the
 *            round trips S -> W3 -> H -> W3 -> S and S -> W4 -> H -> W4 -> S, threading through the gap round the
 *            partition's far end (both chosen because every leg stays clear of the partition's silhouette on screen);
 *            he flinches when the light reaches him ("away"); the echoes come home; the sensor's readout, magnified
 *            in an inset, grows the likely-location blob (the S4.7 field) and the clue lights on "clues".
 *  S9.3 s47 + the 4.5 s hold: he gets the idea ("hide"), walks round to the partition's near end, takes it in both hands
 *            and pushes it back along z until its far end meets the wall (RUNWAY R4: hands on -> gap closed, locked
 *            camera; the partition and the optics use the moved layout). A new pulse: the paths now stop at the
 *            partition; the readout goes blank. He steps clear, dusts his hands, smug, eyes shut... the checker strolls
 *            to the near end, leans round it and looks at him, deadpan (J4). He opens his eyes. A beat.
 *  S9.4 s48  end card on warm yellow: FUTURE GOT WEIRD + "The strange future, explained.", top third only (end-screen
 *            space below), held to the end of the timeline.
 *
 * Every beat is derived from narration cues (K) with clamps, so the scene survives timing changes.
 */

/* ================================================================== cues */

const SC = scene('S9');
const K = {
  start: SC.from,
  end: SC.to,
  // s45
  s45: seg('s45').from,
  back: at('s45', 'back'),
  friend: at('s45', 'friend'),
  s45End: segEnd('s45'),
  // s46
  s46: seg('s46').from,
  being: at('s46', 'being'),
  giving: at('s46', 'giving'),
  away: at('s46', 'away'),
  light: at('s46', 'light'),
  around: at('s46', 'around'),
  careful: at('s46', 'careful'),
  math: at('s46', 'math'),
  clues: at('s46', 'clues'),
  s46End: segEnd('s46'),
  // s47
  s47: seg('s47').from,
  hide: at('s47', 'hide'),
  hed: at('s47', "he'd"),
  too: at('s47', 'too'),
  s47End: segEnd('s47'),
  // s48
  s48: seg('s48').from,
  future: at('s48', 'future'),
  got: at('s48', 'got'),
  weird: at('s48', 'weird'),
  the48: at('s48', 'the'),
  explained: at('s48', 'explained'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;
const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== geometry */

const SENSOR_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
const W3 = W.find((p) => p.id === 'W3')!;
const W4 = W.find((p) => p.id === 'W4')!;
/** the gap between the partition's far end and the wall: the push closes it */
const GAP = OCC.z0;

// S9.2: the two round trips. W3 and W4 are the wall spots whose legs stay clear of the partition's drawn silhouette at
// RAISED_TILT (W1 -> H and W2 -> H graze its far top corner on screen); both are checked against the layout here.
const PATH3 = confocalPath(S, W3, H);
const PATH4 = confocalPath(S, W4, H);
assertPath(PATH3, OLAYOUT);
assertPath(PATH4, OLAYOUT);
const LEN3 = pathLength(PATH3);
const LEN4 = pathLength(PATH4);

// the likely-location field of S4.7: all four wall spots, one-bin bands (illustrative)
const CONF = (LAYOUT as unknown as {confocalA: {circle_radius_m: number}[]}).confocalA;
const HW = (LAYOUT as unknown as {bandHalfWidth: {oneBin: number}}).bandHalfWidth.oneBin;
const FIELD: ScalarField = possibleCloud({x0: 2.2, x1: 3.0, z0: 0.5, z1: 1.2, step: 0.008}, W.map((w, i) => ({W: w, r: CONF[i].circle_radius_m, halfWidth: HW})));

/* ================================================================== cameras */

/** The raised framing of S9.2-S9.3 (close to the shared CAM_RAISED, a little lower and wider): the wall spots, the
 *  gap at the wall, the whole partition in both positions, both characters, and his walk to the near end (his feet at
 *  the near end still in frame). One move from CAM_ROOM; locked afterwards (R4 needs a locked camera). */
const CAM_W: Cam = {cx: 950, cy: 520, zoom: 1.22};

/* ================================================================== beats */

// S9.1
const NOTICE = K.friend - 2;
const WAVE0 = NOTICE + 6;
const WAVE1 = Math.min(WAVE0 + 22, K.s46 - 2);
const SIDE_EYE0 = K.friend + 4;
const SIDE_EYE1 = Math.min(SIDE_EYE0 + 26, K.s46 + 6);

// S9.2: rise, pulses, echo, readout
const RISE0 = K.being - 2;
const RISE_DUR = clamp(K.giving - 4 - RISE0, 28, 46);
const RISE_END = RISE0 + RISE_DUR;
const RT_DUR = 64; // one slowed round trip (frames) for PATH3
const P3_0 = Math.max(RISE_END + 2, K.away + 3 - Math.round((RT_DUR * pathLength([S, W3, H])) / LEN3));
const P4_0 = P3_0 + 12;
const SCHED3 = pathSchedule(PATH3, {start: P3_0, dur: RT_DUR});
const SCHED4 = pathSchedule(PATH4, {start: P4_0, dur: (RT_DUR * LEN4) / LEN3});
const VF3 = SCHED3.vertexFrames;
const VF4 = SCHED4.vertexFrames;
const FLINCH = Math.round(VF3[2]);
const ECHO_END = Math.round(Math.max(SCHED3.end, SCHED4.end));
const PATHS_OUT = Math.max(ECHO_END + 12, K.careful + 2);
const INSET0 = Math.max(ECHO_END + 4, K.careful - 2);
const BLOB0 = Math.max(INSET0 + 10, K.math - 4);
const LIT = Math.max(BLOB0 + 16, K.clues);
const DEFLATE = LIT + 2;
const INSET_OUT = Math.max(LIT + 20, K.s47 - 2);

// S9.3: the idea, the walk to the near end, the push (R4)
const IDEA = K.hide + 2;
const PUSH_X = 2.38; // he stands at the right of the near end, his left side just behind it
const PUSH_Z = OCC.z1 - 0.06;
const WALK_PLAN = planWalk({x: H.x, z: H.z}, {x: PUSH_X, z: PUSH_Z}, {stepM: 0.34});
const WALK0 = Math.max(IDEA + 12, K.hed);
const WALK_FPS = clamp(Math.floor((K.too - 4 - WALK0) / WALK_PLAN.steps), 7, 9);
const ARRIVE = WALK0 + WALK_PLAN.steps * WALK_FPS;
const HANDS = ARRIVE + 8; // both hands meet the near end
const STATIC = 4; // R4 start and end poses are held still this long
const SQUAT0 = HANDS + STATIC;
const PUSH0 = SQUAT0 + 6;
const PUSH_PLAN = planWalk({x: PUSH_X, z: PUSH_Z}, {x: PUSH_X, z: PUSH_Z - GAP}, {stepM: 0.22, lift: 12});
const PUSH_FPS = 9;
const PUSH_DUR = PUSH_PLAN.steps * PUSH_FPS;
const THUNK = PUSH0 + PUSH_DUR; // the far end meets the wall
/** Runway insert R4 (global frames): from both hands on the partition to the gap closed (static ends, locked camera). */
export const R4 = {from: HANDS, to: THUNK + 10 + STATIC};
const RT = R4.to;

// S9.3 after the push: blank readout, smug, the lean (J4). Offsets shrink if the hold gets shorter.
const CARD0 = K.future - 10; // the end card wipes in; the wordmark lands on "Future"
const KK = clamp((CARD0 - RT) / 105, 0.6, 1);
const o = (n: number) => RT + Math.round(n * KK);
const PULSE2 = o(3); // the sensor fires once R4 has ended (its emitter lights 3 frames before)
const INSET2 = o(1);
const STEP0 = o(4);
const DUST0 = o(23);
const DUST1 = o(38);
const SMUG0 = o(38);
const C_LOOK = o(10);
const C_FPS = Math.max(5, Math.round(7 * KK));
/** where she ends up: just left of and in front of the near end; once she leans, her head clears both the near end and
 *  the sensor on its stand (a stop further left puts the sensor right beside her ear) */
const C_SPOT = {x: 1.73, z: 1.62};
/** he steps clear of the near end to here (plan x), leaving room for her lean */
const STEP_PLAN_X = {a: PUSH_X, b: 2.76};

// after the push (gap closed), the same two wall spots as S9.2: the light still reaches W3, but what scatters toward him
// stops at the partition; the way to W4 (now behind the partition) is blocked outright. Same slowed speed as S9.2.
const LAY_CLOSED = movedLayout(GAP);
const GUESS_END = {x: STEP_PLAN_X.b, z: PUSH_Z - GAP};
const stopOn = (a: P2, b: P2) => lerpP(a, b, firstOccluderHit(a, b, LAY_CLOSED, 0.03));
const BLOCKED = [
  {w: W3 as P2 | null, path: [S, W3, stopOn(W3, GUESS_END)] as P2[]},
  {w: null as P2 | null, path: [S, stopOn(S, W4)] as P2[]},
].map((b) => {
  assertPath(b.path, LAY_CLOSED);
  return {...b, stop: b.path[b.path.length - 1]};
});
const PULSE_SPEED = LEN3 / RT_DUR; // metres per frame, as in S9.2
const SCHED2 = BLOCKED.map((b) => pathSchedule(b.path, {start: PULSE2, dur: Math.round(pathLength(b.path) / PULSE_SPEED)}));
const STOP_END = Math.round(Math.max(...SCHED2.map((sc) => sc.end)));
// the reading blinks off once the light has failed to come back, and the blank screen is held long enough to read
const BLANK = Math.max(o(22), STOP_END + 6);
const PATHS2_OUT = Math.max(o(24), STOP_END + 8);
const INSET2_OUT = BLANK + Math.round(16 * KK);
const C_WALK0 = Math.max(o(32), BLANK); // she sets off once her screen has gone blank
const C_WALK_PLAN = planWalk({x: LAYOUT.operator.x, z: LAYOUT.operator.z}, C_SPOT, {stepM: 0.27, lift: 14});
const LEAN0 = C_WALK0 + C_WALK_PLAN.steps * C_FPS + 1;
const OPEN = LEAN0 + Math.round(15 * KK);
const BUSTED = OPEN + 3;

/* ================================================================== sound */

const GUESSER_STEPS = walkContacts(WALK0, WALK_PLAN, WALK_FPS);
const PUSH_STEPS = walkContacts(PUSH0, PUSH_PLAN, PUSH_FPS).filter((f) => f < THUNK - 2); // the last one is under the thunk
const CHECKER_STEPS = walkContacts(C_WALK0, C_WALK_PLAN, C_FPS);
// his step clear of the near end after the push (same trip as guesserAt's post-push branch, at the raised tilt)
const STEP_CLEAR = (() => {
  const zc = PUSH_Z - GAP;
  const a = rigAt(STEP_PLAN_X.a, zc, RAISED_TILT);
  const b = rigAt(STEP_PLAN_X.b, zc, RAISED_TILT);
  return tripContacts(STEP0, planTrip(b.x - a.x, a.scale, 'walk'), 13);
})();

const SFX_CUES: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (CARD0 - K.start) / 30, gain: -2, note: 'room tone until the end card'},
  // S9.1
  {f: WAVE0 + 2, kind: 'cloth_rustle', gain: -8},
  // S9.2
  {f: P3_0 - 2, kind: 'sensor_hum', dur: (ECHO_END - P3_0 + 6) / 30, gain: -9},
  {f: P3_0, kind: 'sensor_pulse'},
  {f: P4_0, kind: 'sensor_pulse', gain: -3, pitch: 1},
  {f: Math.round(VF3[1]), kind: 'bounce_tick', pitch: 2},
  {f: Math.round(VF4[1]), kind: 'bounce_tick', pitch: 3, gain: -2},
  {f: FLINCH, kind: 'bounce_tick', pitch: -2, gain: -3},
  {f: FLINCH + 1, kind: 'cloth_rustle', gain: -7},
  {f: Math.round(VF4[2]), kind: 'bounce_tick', pitch: -1, gain: -5},
  {f: Math.round(SCHED3.end), kind: 'echo_return'},
  {f: Math.round(SCHED4.end), kind: 'echo_return', gain: -3, pitch: 1},
  {f: INSET0 + 2, kind: 'pop_tick', gain: -6},
  {f: LIT, kind: 'readout_beep'},
  // S9.3
  {f: IDEA, kind: 'cloth_rustle', gain: -6},
  ...GUESSER_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -5 - (i % 2), pitch: [0, -1, 0.5, -0.5][i % 4]})),
  {f: HANDS, kind: 'partition_thunk', gain: -9, note: 'hands on the screen'},
  {f: PUSH0, kind: 'partition_scrape', dur: PUSH_DUR / 30},
  ...PUSH_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -8, pitch: -1 + (i % 2)})),
  {f: THUNK, kind: 'partition_thunk', gain: 3, note: 'far end meets the wall'},
  {f: THUNK + 2, kind: 'partition_wobble', gain: -6},
  {f: PULSE2, kind: 'sensor_pulse', gain: -2},
  {f: Math.round(SCHED2[1].end), kind: 'bounce_tick', pitch: -4, gain: -6, note: 'stopped at the partition'},
  {f: Math.round(SCHED2[0].vertexFrames[1]), kind: 'bounce_tick', pitch: 2, gain: -4},
  {f: BLANK, kind: 'readout_off'},
  ...STEP_CLEAR.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -7, pitch: i % 2 ? -0.5 : 0.5})),
  {f: DUST0 + 2, kind: 'cloth_rustle', gain: -5},
  {f: SMUG0 + 4, kind: 'smug_exhale'},
  ...CHECKER_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -9, pitch: 1 + (i % 2) * 0.5})),
  {f: LEAN0 + 4, kind: 'cloth_rustle', gain: -9},
  {f: BUSTED, kind: 'uh_oh', gain: -2, note: 'J4: he opens his eyes and she is right there'},
  // S9.4
  {f: K.future, kind: 'logo_hit'},
];
export const SFX: Sfx[] = [...SFX_CUES].sort((a, b) => a.f - b.f);

/* ================================================================== helpers */

const roomToPx = (s: ViewState): ToPx => (p) => {
  const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
  return {x: q.x, y: q.y};
};

/** Frame used for the rigs: frozen in R4's static windows (bit-identical start and end frames). */
const rigFrame = (g: number) => (g >= HANDS && g < HANDS + STATIC ? HANDS : g >= RT - STATIC && g < RT ? RT - STATIC : g);
const inStatic = (g: number) => (g >= HANDS && g < HANDS + STATIC) || (g >= RT - STATIC && g < RT);

/** Partition offset toward the wall (m): accelerates from rest and meets the wall at speed (an impact, not a glide). */
const pushTravel = (g: number) => {
  if (g <= PUSH0) return 0;
  if (g >= THUNK) return GAP;
  const u = (g - PUSH0) / PUSH_DUR;
  return GAP * Math.pow(u, 1.55);
};

// arched top of the partition (components/v02/Partition), for the face polygon used to hide overlay paths
const ARCH = 0.09;
const FOOT_H = 0.07;
const facePoly = (s: ViewState, layout: Layout) => {
  const oc = layout.occluder;
  const Lp = (oc.z1 - oc.z0) / 3;
  const topH = (z: number) => {
    const v = (z - oc.z0) / Lp;
    const u = clamp01(v - Math.floor(Math.min(2.9999, v)));
    return oc.height - ARCH * (1 - Math.sin(Math.PI * u));
  };
  const fx = oc.x - oc.thickness / 2;
  const pts: {x: number; y: number}[] = [];
  for (let k = 0; k <= 40; k++) {
    const z = oc.z0 + ((oc.z1 - oc.z0) * k) / 40;
    pts.push(projectWith(s, {x: fx, z, h: topH(z)}));
  }
  pts.push(projectWith(s, {x: fx, z: oc.z1, h: FOOT_H}), projectWith(s, {x: fx, z: oc.z0, h: FOOT_H}));
  return {pts, fx};
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
/** A rough frontal-rig silhouette test (head, torso, legs) for fan rays passing behind a person near the wall. */
const rigHides = (pl: {x: number; y: number; scale: number}, q: {x: number; y: number}) => {
  const lx = (q.x - pl.x) / pl.scale;
  const ly = (q.y - pl.y) / pl.scale;
  if ((lx / 92) ** 2 + ((ly + 388) / 100) ** 2 < 1) return true;
  if (Math.abs(lx) < 82 && ly > -300 && ly < -140) return true;
  return Math.abs(lx) < 60 && ly >= -140 && ly < 0;
};

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

type GuesserState = {plan: {x: number; z: number}; place: RigPlace; pose: Pose2; life: number; walk: WalkState | null; pushing: boolean};

const nervousFace: Partial<Pose2> = {lid: 0.08, eyes: 1.06, brows: 0.45, browAsym: 0.2, mouth: 'hmm', lookX: -0.75, lookY: 0.05, tilt: -2, sweat: 0.7};

/** The guesser's pose and place at frame g (tilt for the room projection). */
const guesserAt = (g: number, tilt: number, cam: Cam): GuesserState => {
  const gr = rigFrame(g);
  const s = viewAt(tilt);
  // ---- S9.1-S9.2: at H, hiding, nervous
  if (g < WALK0) {
    const pl = rigAt(H.x, H.z, tilt);
    const place: RigPlace = {x: pl.x, y: pl.y, scale: pl.scale, frame: gr, seed: GUESSER_SEED, life: 0.45};
    let pose: Pose2 = withPose({...IDLE2, ...ARMS.sneak, armsFront: 'both', hunch: 0.05}, nervousFace);
    // "our friend": he notices us; a sheepish grin and a tiny wave, then back to nervous
    const notice = Math.min(tw(g, NOTICE, 6, E.out), 1 - tw(g, WAVE1, 10, E.inOut));
    if (notice > 0) {
      pose = withPose(pose, {lookX: 0.05, lookY: 0.1, mouth: 'grin', brows: 0.55, browAsym: 0, lid: 0.12, tilt: 4, eyes: 1.1}, notice);
      const up = Math.min(tw(g, WAVE0 - 4, 7, E.out), 1 - tw(g, WAVE1 - 6, 8, E.inOut));
      if (up > 0) {
        const wag = g >= WAVE0 && g < WAVE1 - 6 ? Math.sin((g - WAVE0) * 0.75) : 0;
        const wave = reachLocal(118 + 10 * wag, -352, 1, 1);
        pose = {...mixPose2(pose, {...pose, armR: wave}, up), armsFront: up > 0.5 ? 'L' : 'both'};
      }
    }
    // the pulse reaches him: a flinch (hop, wide eyes), then he watches the light go back to her
    const fl = sp(g, FLINCH, SNAP);
    if (g >= FLINCH) {
      pose = withPose(pose, {eyes: 1.18, pupil: 0.8, brows: 0.85, browAsym: 0, mouth: 'o', lookX: -0.55, lookY: -0.55, lid: 0, tilt: -3}, Math.min(1, fl));
      pose = {...pose, bob: hop(g, FLINCH, 9, 9)};
      const watch = tw(g, FLINCH + 14, 12, E.inOut);
      if (watch > 0) pose = withPose(pose, {lookX: -0.85, lookY: 0.1, mouth: 'hmm', eyes: 1.08, brows: 0.6}, watch);
    }
    // the clue lights: he deflates
    const defl = tw(g, DEFLATE, 10, E.inOut);
    if (defl > 0) pose = withPose(pose, {...EXPR.busted, hunch: 0.1, lookX: -0.7, lookY: 0.05, tilt: -4}, defl * 0.85);
    // "really hide": the idea (paws drop, he perks up, brows up, a grin)
    const idea = sp(g, IDEA, SOFT);
    if (g >= IDEA) {
      const perk: Pose2 = {...IDLE2, armL: ARMS.sneak.armL, armR: reachLocal(84, -330, 1, 1), armsFront: 'L', hunch: 0, lid: 0, eyes: 1.14, pupil: 1, brows: 0.9, browAsym: 0.3, mouth: 'o', lookX: 0.1, lookY: -0.3, tilt: 5, sweat: 0.2};
      pose = mixPose2(pose, perk, Math.min(1, idea));
      const grin = tw(g, IDEA + 8, 6);
      if (grin > 0) pose = withPose(pose, {mouth: 'grin', lid: 0.3, brows: 0.2, browAsym: 0.7, lookX: -0.5, lookY: 0.45}, grin);
      const down = tw(g, WALK0 - 6, 6, E.inOut);
      if (down > 0) pose = mixPose2(pose, {...pose, armL: IDLE2.armL, armR: IDLE2.armR, armsFront: 'none'}, down);
    }
    return {plan: {x: H.x, z: H.z}, place, pose, life: 0.45, walk: null, pushing: false};
  }
  // ---- S9.3: the walk to the near end
  const grin: Partial<Pose2> = {mouth: 'grin', lid: 0.3, brows: 0.2, browAsym: 0.7, lookX: -0.45, lookY: 0.4, tilt: 3, sweat: 0};
  if (g < PUSH0) {
    const d = walkDistance(g, WALK0, WALK_PLAN, WALK_FPS);
    const wk = walkAt(WALK_PLAN, d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: GUESSER_SEED, life: 0.3};
    let pose: Pose2 = withPose({...IDLE2, ...wk.pose, armsFront: 'none'}, grin);
    // hands onto the near end (contact at HANDS), elbows out; then the anticipation squat
    const reachIn = tw(g, ARRIVE, HANDS - ARRIVE, E.inOut);
    if (reachIn > 0) {
      const lay = movedLayout(0);
      const tgt = handTargets(s, lay);
      const effort: Pose2 = {...pose, lean: -8 * reachIn, lookX: -0.7, lookY: 0.2, mouth: 'flat', brows: -0.35, browAsym: 0, lid: 0.3, armsFront: 'both', frontTop: 'R'};
      const sq = tw(g, SQUAT0, PUSH0 - SQUAT0, E.inOut);
      const prePush: Pose2 = {...effort, sink: (effort.sink ?? 0) + 12 * sq, hunch: 0.05 * sq};
      const armL = reach2(place, prePush, -1, tgt.L.x, tgt.L.y, ELBOW_L);
      const armR = reach2(place, prePush, 1, tgt.R.x, tgt.R.y, ELBOW_R);
      pose = mixPose2(pose, {...prePush, armL, armR}, reachIn);
      // exact contact once the reach is done
      if (reachIn >= 1) pose = {...prePush, armL, armR};
    }
    if (inStatic(g)) pose = {...pose, blink: 1};
    return {plan: wk.plan, place, pose, life: 0.3, walk: wk, pushing: g >= ARRIVE};
  }
  // ---- the push (R4): he walks it back with both hands on the near end
  if (g < RT + 1) {
    g = gr; // R4's static end window: everything holds still
    const d = pushTravel(g);
    const wk = walkAt(PUSH_PLAN, d, tilt, undefined, 0.2);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: GUESSER_SEED, life: 0.3};
    const jolt = g >= THUNK ? ring(g, THUNK, 0.9, 0.35) : 0;
    let pose: Pose2 = {
      ...IDLE2,
      ...wk.pose,
      sink: wk.pose.sink + 12 * (1 - tw(g, THUNK + 2, 8, E.inOut)),
      hunch: 0.05 * (1 - tw(g, THUNK + 2, 8)),
      lean: -8 - 2 * Math.sin(clamp01((g - PUSH0) / PUSH_DUR) * Math.PI) + 2.5 * jolt,
      lookX: -0.7,
      lookY: 0.2,
      mouth: g < THUNK + 3 ? 'flat' : 'o',
      brows: g < THUNK ? -0.45 : 0.6,
      browAsym: 0,
      lid: g < THUNK ? 0.38 : 0,
      eyes: g < THUNK ? 1 : 1.12,
      tilt: -2,
      armsFront: 'both',
      frontTop: 'R',
    };
    const tgt = handTargets(s, movedLayout(d));
    pose = {...pose, armL: reach2(place, pose, -1, tgt.L.x, tgt.L.y, ELBOW_L), armR: reach2(place, pose, 1, tgt.R.x, tgt.R.y, ELBOW_R)};
    if (inStatic(g)) pose = {...pose, blink: 1};
    return {plan: wk.plan, place, pose, life: 0.3, walk: wk, pushing: true};
  }
  // ---- after the push: hands off, a step clear, dust off, smug; then she is there
  const z = PUSH_Z - GAP;
  const p0 = rigAt(STEP_PLAN_X.a, z, tilt);
  const p1 = rigAt(STEP_PLAN_X.b, z, tilt);
  const plan = planTrip(p1.x - p0.x, p0.scale, 'walk');
  const dd = tripDistance(g, STEP0, plan, 13);
  const x = p0.x + dd;
  const place: RigPlace = {x, y: p0.y, scale: p0.scale, frame: gr, seed: GUESSER_SEED, life: 0.35};
  const pleased: Partial<Pose2> = {mouth: 'grin', lid: 0.35, brows: 0.1, browAsym: 0.5, lookX: -0.55, lookY: 0.1, tilt: 3, eyes: 1};
  let pose: Pose2 = tripPose(dd, plan, {dir: 1, base: withPose(IDLE2, pleased)});
  // hands come off the partition (from the push pose) over the first frames
  const off = tw(g, RT, 8, E.inOut);
  if (off < 1) {
    const last = guesserAt(RT, tilt, cam).pose;
    pose = mixPose2({...last, feet: pose.feet}, pose, off);
  }
  // looks at the readout going blank, then dusts his hands (job done)
  const dust = Math.min(tw(g, DUST0, 5, E.out), 1 - tw(g, DUST1 - 2, 6, E.inOut));
  if (dust > 0) {
    const cx = x;
    const cy = p0.y - 236 * p0.scale;
    const ph = (g - DUST0) * 0.7;
    const L = {x: cx - 10 * p0.scale + 16 * Math.sin(ph) * p0.scale, y: cy + 4 * Math.cos(ph) * p0.scale};
    const R = {x: cx + 10 * p0.scale - 16 * Math.sin(ph) * p0.scale, y: cy + 10 * p0.scale};
    const dusting: Pose2 = {...pose, mouth: 'smirk', lid: 0.45, brows: -0.1, browAsym: 0.6, lookX: -0.1, lookY: 0.55, tilt: 4, armsFront: 'both'};
    const armL = reach2(place, dusting, -1, L.x, L.y, -1);
    const armR = reach2(place, dusting, 1, R.x, R.y, -1);
    pose = mixPose2(pose, {...dusting, armL, armR}, dust);
  }
  // smug: hands on hips, chin up, eyes shut
  const smug = tw(g, SMUG0, 10, E.inOut);
  if (smug > 0) {
    const sm: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lid: 0.97, tilt: 7, lookX: 0, lookY: -0.3, brows: -0.1, browAsym: 0.7, mouth: 'smirk', feet: pose.feet});
    pose = mixPose2(pose, sm, smug);
  }
  // he opens his eyes: she is right there
  const open = tw(g, OPEN, 4, E.out);
  if (open > 0) pose = withPose(pose, {lid: 0.05, lookX: -0.95, lookY: 0.05, tilt: 2}, open);
  const bust = sp(g, BUSTED, SNAP);
  if (g >= BUSTED) {
    pose = withPose(pose, {...EXPR.busted, lookX: -0.95, lookY: 0.05, tilt: -2}, Math.min(1, bust));
    pose = {...pose, bob: hop(g, BUSTED, 8, 7), blink: 1};
  }
  const life = g >= BUSTED ? 0.12 : 0.35;
  return {plan: {x: STEP_PLAN_X.a + (dd / Math.max(1, p1.x - p0.x)) * (STEP_PLAN_X.b - STEP_PLAN_X.a), z}, place: {...place, life}, pose, life, walk: null, pushing: false};
};

/** Elbow branches for the push (reachLocal): both elbows out and down. */
const ELBOW_L: 1 | -1 = -1;
const ELBOW_R: 1 | -1 = -1;

/** Where his hands press on the partition's near end (world px): left hand higher, right hand lower (crossing). */
const handTargets = (s: ViewState, layout: Layout) => {
  const oc = layout.occluder;
  const L = projectWith(s, {x: oc.x + 0.005, z: oc.z1, h: 1.22});
  const R = projectWith(s, {x: oc.x + 0.005, z: oc.z1, h: 1.06});
  return {L: {x: L.x - 4, y: L.y}, R: {x: R.x - 2, y: R.y}};
};

type CheckerState = {plan: {x: number; z: number}; place: RigPlace; pose: Pose2; walk: WalkState | null};

const checkerAt = (g: number, tilt: number): CheckerState => {
  const gr = rigFrame(g);
  const atReadout = {lookX: 0.6, lookY: 0.4, tilt: 3};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: -1};
  const face = (k: number, brow = 0): Partial<Pose2> => ({
    ...EXPR.deadpan,
    lookX: lerp(atReadout.lookX, atHim.lookX, k),
    lookY: lerp(atReadout.lookY, atHim.lookY, k),
    tilt: lerp(atReadout.tilt, atHim.tilt, k),
    brows: -0.05 + 0.35 * brow,
    browAsym: 0.45 * brow,
  });
  // where she looks: the readout; him (side-eye at "friend", knowing at the clue, watching the push); the readout again
  const side = Math.min(tw(g, SIDE_EYE0, 6, E.inOut), 1 - tw(g, SIDE_EYE1, 8, E.inOut));
  const know = Math.min(tw(g, LIT + 6, 8, E.inOut), 1 - tw(g, LIT + 40, 10, E.inOut));
  const watch = Math.min(tw(g, IDEA + 4, 8, E.inOut), 1 - tw(g, C_LOOK, 8, E.inOut));
  const brow = Math.max(0.8 * know, 0.5 * Math.min(tw(g, THUNK, 6), 1 - tw(g, C_LOOK, 8)));
  const lookK = Math.max(side, know, watch);
  const base: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'};
  if (g < C_WALK0) {
    const pl = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
    let pose = withPose(base, face(lookK, brow));
    // at the blank readout: a glance at the screen, then the partition
    const toEnd = tw(g, C_LOOK + 8, 8, E.inOut);
    if (toEnd > 0) pose = withPose(pose, {lookX: 0.9, lookY: 0.2}, toEnd);
    if (inStatic(g)) pose = {...pose, blink: 1};
    return {plan: {x: LAYOUT.operator.x, z: LAYOUT.operator.z}, place: {x: pl.x, y: pl.y, scale: pl.scale, frame: gr, seed: CHECKER_SEED, life: 0.35}, pose, walk: null};
  }
  // she strolls to the near end, arms still crossed, and leans round it
  const d = walkDistance(g, C_WALK0, C_WALK_PLAN, C_FPS);
  const wk = walkAt(C_WALK_PLAN, d, tilt);
  const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: CHECKER_SEED, life: 0.3};
  let pose: Pose2 = {...withPose(base, face(1)), feet: wk.pose.feet, sink: wk.pose.sink, lookX: 0.9, lookY: 0.15};
  const lean = sp(g, LEAN0, SOFT);
  if (g >= LEAN0) pose = withPose(pose, {peek: 0.85, lean: 3, lookX: 1, lookY: 0.05, tilt: 2, lid: 0.4}, Math.min(1.04, lean));
  return {plan: wk.plan, place, pose, walk: wk};
};

/* ================================================================== the room shot */

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const tilt = RAISED_TILT * tiltAt(g, RISE0, RISE_DUR);
  const s = viewAt(tilt);
  const toPx = roomToPx(s);
  const cam = camPath(g, CAM_ROOM, [{at: RISE0, dur: RISE_DUR, to: CAM_W}]);

  // the partition, pushed back during R4
  const gq = rigFrame(g); // frozen in R4's static windows
  const push = gq < PUSH0 ? 0 : pushTravel(gq);
  const lay = movedLayout(push);
  const box = boxOf(lay);
  const wobble = gq >= THUNK ? 0.45 * ring(gq, THUNK, 0.8, 0.3) * (1 - tw(gq, THUNK + 6, 4)) : 0;

  const gu = guesserAt(g, tilt, cam);
  const ch = checkerAt(g, tilt);
  const geo = standGeometry(tilt);

  /* ---- the sensor's readout on the stand */
  const blobT = tw(g, BLOB0, 18, E.out);
  const blankT = tw(g, BLANK, 6, E.inOut);
  // the blob blinks off (off, on, off) and stays off; then the whole screen empties
  const blinkOff = g < BLANK - 6 ? 0 : g < BLANK ? (Math.floor((g - (BLANK - 6)) / 2) % 2 === 0 ? 1 : 0) : 1;
  const firing = Math.max(pulseAt(g, P3_0 - 3, 8), pulseAt(g, P4_0 - 3, 8), pulseAt(g, PULSE2 - 3, 8));
  const showMap = g >= INSET0 - 2;
  const sensor = showMap
    ? {screen: <MiniReadout w={52} h={34} blob={blobT * (1 - blinkOff)} blank={blankT} occZ0={lay.occluder.z0} />, led: g >= BLANK ? 0.15 : 1, firing}
    : {reveal: 1, led: 1, firing, bumpHighlight: Math.max(pulseAt(g, SCHED3.end, 14), pulseAt(g, SCHED4.end, 14) * 0.7)};

  /* ---- hidden tests for overlay paths */
  const face = facePoly(s, lay);
  const sb = geo.box;
  const hidden = (p: P2) => {
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    if (p.x > face.fx && inPoly(face.pts, q)) return true;
    return Math.hypot(p.x - S.x, p.z - S.z) < 0.25 && q.x > sb.x0 - 2 && q.x < sb.x1 + 2 && q.y > sb.y0 - 2 && q.y < sb.y1 + 2;
  };
  const hiddenFan = (p: P2) => {
    if (hidden(p)) return true;
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    return (p.z < ch.plan.z && rigHides(ch.place, q)) || (p.z < gu.plan.z + 0.05 && rigHides(gu.place, q));
  };

  /* ---- the cast and the partition (one item: his body, the partition and his arms are layered by hand while he
          pushes, so his hands sit on the near end and the end strip passes in front of his left side) */
  const guesserRig = (pass: 'all' | 'body' | 'frontArm') => (
    <Character2
      look={CAST.guesser}
      pose={gu.pose}
      frame={gu.place.frame!}
      seed={GUESSER_SEED}
      x={gu.place.x}
      y={gu.place.y}
      scale={gu.place.scale}
      life={gu.place.life}
      pass={pass}
      shadow={!gu.walk}
      eyeDarts={g < IDEA}
    />
  );
  const walkShadow = (w: WalkState | null) =>
    w ? (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={f2(w.shadow.cx)} cy={f2(w.shadow.cy)} rx={f2(w.shadow.rx)} ry={f2(w.shadow.ry)} fill={C.shadow} />
      </svg>
    ) : null;
  const partition = <Partition tilt={tilt} wobble={wobble} layout={lay} />;
  // on the walk to the near end he is on the partition's far (right) side, so whatever of him overlaps it on screen (his
  // swinging left arm) goes behind it; the body test alone misses the arm swing
  const walking = g >= WALK0 && g < ARRIVE;
  const behind = gu.pushing || walking || behindBox(gu.plan.x, gu.plan.z, box, tilt);
  const group = gu.pushing ? (
    <>
      {walkShadow(gu.walk)}
      {guesserRig('body')}
      {partition}
      {guesserRig('frontArm')}
    </>
  ) : behind ? (
    <>
      {walkShadow(gu.walk)}
      {guesserRig('all')}
      {partition}
    </>
  ) : (
    <>
      {partition}
      {walkShadow(gu.walk)}
      {guesserRig('all')}
    </>
  );

  const items: RoomItem[] = [
    {key: 'pg', z: (box.z0 + box.z1) / 2, box, node: group},
    {
      key: 'checker',
      x: ch.plan.x,
      z: ch.plan.z,
      w: 0.3,
      node: (
        <>
          {walkShadow(ch.walk)}
          <Character2 look={CAST.checker} pose={ch.pose} frame={ch.place.frame!} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} shadow={!ch.walk} />
        </>
      ),
    },
    {
      key: 'stand',
      x: PTS.S.x,
      z: LAYOUT.operator.z + 0.04,
      w: 0.17,
      height: 1.4,
      node: <S9SensorStand tilt={tilt} sensor={sensor} />,
    },
  ];

  /* ---- S9.2 backdrop: the opening between the partition's far end and the wall, marked as in S1.4 (dashed, paper
          white) while the round trips replay. On screen the W -> H legs pass close to the partition's far top corner,
          which alone reads as "over the top"; the marked opening makes the gap the thing they go through. It is a
          backdrop, so the stand, the people and the partition paint over it. */
  const gapT = tw(g, RISE_END, 10, E.out) * (1 - tw(g, PATHS_OUT, 14));
  const gapH = OCC.height - ARCH - 0.02;
  const gapPts = [
    projectWith(s, {x: OCC.x, z: 0.015, h: FOOT_H}),
    projectWith(s, {x: OCC.x, z: OCC.z0 - 0.015, h: FOOT_H}),
    projectWith(s, {x: OCC.x, z: OCC.z0 - 0.015, h: gapH}),
    projectWith(s, {x: OCC.x, z: 0.015, h: gapH}),
  ];
  const backdrop =
    gapT > 0 && g < PUSH0 ? (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path
          d={`M ${gapPts.map((q) => `${f2(q.x)} ${f2(q.y)}`).join(' L ')} Z`}
          fill={C.white}
          fillOpacity={0.8}
          stroke={C.inkMuted}
          strokeWidth={3.5}
          strokeDasharray="11 8"
          strokeLinejoin="round"
          opacity={f2(gapT)}
        />
      </svg>
    ) : null;

  /* ---- overlays: S9.2 round trips, S9.3 the blocked pulse */
  const pathsOp = 1 - tw(g, PATHS_OUT, 14);
  const dirsW = scatterDirections({x: 0, z: 1}, 9, 4);
  const dirsH3 = scatterDirections(sub(W3, H), 6, 9);
  const after = g >= RT;
  const blocked = BLOCKED;
  const sched2 = SCHED2;
  const out2 = 1 - tw(g, PATHS2_OUT, 8);

  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {g >= P3_0 && pathsOp > 0 && (
        <g opacity={pathsOp}>
          <WallSpot p={toPx(W3)} t={tw(g, VF3[1] - 2, 8)} />
          <WallSpot p={toPx(W4)} t={tw(g, VF4[1] - 2, 8)} />
          <ScatterFan asGroup origin={W3} dirs={dirsW} length={0.55} toPx={toPx} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} hidden={hiddenFan} seed={5} />
          <ScatterFan asGroup origin={W4} dirs={dirsW} length={0.5} toPx={toPx} t={tw(g, VF4[1], 12)} release={tw(g, VF4[1] + 14, 16)} layout={OLAYOUT} hidden={hiddenFan} seed={7} width={4} />
          <ScatterFan asGroup origin={H} dirs={dirsH3} length={0.55} toPx={toPx} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} hidden={hiddenFan} seed={8} width={3.5} color={C.saffron} />
          <LightPath asGroup points={PATH3} toPx={toPx} t={SCHED3.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} />
          <LightPath asGroup points={PATH4} toPx={toPx} t={SCHED4.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} />
        </g>
      )}
      {after && out2 > 0 && (
        <g opacity={out2}>
          {blocked.map((b, i) => {
            const sc = sched2[i];
            const vf = sc.vertexFrames;
            const vEnd = vf[vf.length - 1];
            const crossT = g >= vEnd ? E.back(clamp01((g - vEnd) / 6)) : 0;
            const sp2 = toPx(b.stop);
            return (
              <g key={i}>
                {b.w && <WallSpot p={toPx(b.w)} t={tw(g, vf[1] - 2, 8)} />}
                {b.w && <ScatterFan asGroup origin={b.w} dirs={dirsW} length={0.5} toPx={toPx} t={tw(g, vf[1], 10)} release={tw(g, vf[1] + 14, 14)} layout={lay} hidden={hiddenFan} seed={11 + i} width={4} />}
                <LightPath asGroup points={b.path} toPx={toPx} t={sc.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={lay} hidden={hidden} arrive="hide" />
                {crossT > 0.02 && <Cross x={sp2.x - 8} y={sp2.y} s={13 * crossT} />}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );

  /* ---- screen space: the magnified readout, the real sensor ringed, chips */
  const insetT = g < RT ? tw(g, INSET0, 12, E.out) * (1 - tw(g, INSET_OUT, 10, E.inOut)) : tw(g, INSET2, 8, E.out) * (1 - tw(g, INSET2_OUT, 8, E.inOut));
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  const sensorScr = scr({x: (sb.x0 + sb.x1) / 2, y: (sb.y0 + sb.y1) / 2});
  // the ring links the inset to the real sensor; after the push it goes before she walks past the stand
  const ringT = g < RT ? insetT : insetT * (1 - tw(g, Math.min(INSET2_OUT, C_WALK0) - 6, 6, E.inOut));
  const labelT = g < RT ? tw(g, LIT, 10, E.out) * (1 - tw(g, INSET_OUT - 6, 8)) : 0;
  const chipT = Math.max(tw(g, P3_0 - 4, 8) * (1 - tw(g, ECHO_END + 8, 10)), g >= RT ? tw(g, PULSE2 - 2, 6) * (1 - tw(g, sched2[0].end + 10, 8)) : 0);
  const blobShown = g < RT ? blobT : 1;
  const insetLit = g < RT ? clamp01((g - LIT) / 18) : 0;
  const insetBlank = g < RT ? 0 : blankT;

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} items={items} partition={false} backdrop={backdrop}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {ringT > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={f2(sensorScr.x)} cy={f2(sensorScr.y)} r={f2(Math.max(0, 50 * cam.zoom * E.back(clamp01(ringT))))} fill="none" stroke={C.teal} strokeWidth={5} />
        </svg>
      )}
      <ReadoutInset x={INSET.x} y={INSET.y} w={INSET.w} h={INSET.h} t={insetT} field={FIELD} blob={blobShown * (1 - blinkOff)} lit={insetLit} blank={insetBlank} led={g >= BLANK && g >= RT ? 0 : 1} occZ0={lay.occluder.z0} />
      {labelT > 0 && (
        <div style={{position: 'absolute', left: INSET.x + INSET.w / 2, top: INSET.y + INSET.h + 22, transform: `translateX(-50%) scale(${f2(E.back(clamp01(labelT)))})`, transformOrigin: '50% 0'}}>
          <Pill tone="teal" size={36}>
            likely location
          </Pill>
        </div>
      )}
      {chipT > 0 && (
        <div style={{position: 'absolute', right: 96, top: 800, opacity: chipT, transform: `translateY(${f2((1 - E.out(chipT)) * -10)}px)`}}>
          <Pill tone="saffron">slowed down</Pill>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** The magnified readout's place (screen px): upper left, over the plant and the left wall; its top edge sits above
 *  the plant's highest leaf tips (y ≈ 38), so no leaf pokes out over the bezel. */
const INSET = {x: 96, y: 28, w: 420, h: 386};

/* ================================================================== small drawing helpers */

const Cross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={5.5} strokeLinecap="round" />
  </g>
);

const WallSpot: React.FC<{p: {x: number; y: number}; t: number}> = ({p, t}) => {
  if (t <= 0) return null;
  const r = 13 * E.back(clamp01(t));
  return <path d={`M ${f2(p.x)} ${f2(p.y - r)} L ${f2(p.x + r)} ${f2(p.y)} L ${f2(p.x)} ${f2(p.y + r)} L ${f2(p.x - r)} ${f2(p.y)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />;
};

const Pill: React.FC<{tone: 'saffron' | 'teal'; children: React.ReactNode; size?: number}> = ({tone, children, size = 32}) => (
  <div
    style={{
      display: 'inline-flex',
      padding: `${size * 0.26}px ${size * 0.72}px`,
      borderRadius: 999,
      background: tone === 'saffron' ? C.saffron : C.cream,
      color: tone === 'saffron' ? C.ink : C.tealDeep,
      border: `3px solid ${tone === 'saffron' ? C.saffronDeep : C.tealDeep}`,
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

/* ================================================================== S9.4 the end card */

const CardShot: React.FC<{g: number}> = ({g}) => {
  const wipe = tw(g, CARD0, K.future - CARD0, E.inOut);
  const words: [number, number, number] = [tw(g, K.future, 10, E.linear), tw(g, K.got, 10, E.linear), tw(g, K.weird, 10, E.linear)];
  return (
    <AbsoluteFill>
      {wipe < 1 && <RoomShot g={g} />}
      <AbsoluteFill style={{clipPath: wipe < 1 ? `inset(0 0 0 ${f2((1 - wipe) * 100)}%)` : undefined}}>
        <EndCard words={words} underline={tw(g, K.weird + 6, 14, E.inOut)} tagline={[tw(g, K.the48, 12), tw(g, K.explained, 12)]} explainedLine={tw(g, K.explained + 6, 14, E.inOut)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S9Payoff: React.FC = () => {
  const g = useG();
  if (g >= CARD0) return <CardShot g={g} />;
  return <RoomShot g={g} />;
};
