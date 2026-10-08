import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, SOFT, camPath, hop, ring, sp, tw} from '../lib/motion';
import {CAM_ROOM, PLAN_CARD_RECT, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, assertAroundTheEnd, partitionHides, partitionTopH, projectWith, rigAt, tiltAt, viewAt, type Layout, type PlanPt, type ViewState} from '../lib/room';
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
import {GapMarker, RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {Partition} from '../components/v02/Partition';
import {LightPath, ScatterFan, type ToPx} from '../components/v02/Optics';
import {
  ARMS,
  Character2,
  EXPR,
  HANDS_ON_HIPS,
  figuresHide,
  handWorld2,
  rimFlash,
  IDLE2,
  mixPose2,
  reach2,
  withPose,
  type Foot,
  type Pose2,
  type RigPlace,
} from '../components/v02/Cast2';
import {reachLocal} from '../components/Character';
import {S9SensorStand, behindBox, boxOf, movedLayout, planWalk, standGeometry, walkAt, walkContacts, walkDistance, type WalkState} from '../components/v02/S9_Room';
import {MiniReadout, ReadoutInset} from '../components/v02/S9_Readout';
import {EndCard} from '../components/v02/S9_EndCard';
import {BackHead} from '../components/v02/S9_BackHead';
import {PlanCard, PlanSpot} from '../components/v02/PlanCard';

/**
 * S9 · Payoff (s45–s48). Storyboard shots S8.1–S8.4 (now scene S9).
 *
 *  S9.1 s45  room view (tilt 0, CAM_ROOM): the guesser still hiding at H behind the partition, nervous (paws up, sweat,
 *            eyes darting to the checker); on "friend" he notices us: a sheepish grin and a tiny wave. She side-eyes him.
 *  S9.2 s46  the camera rises to RAISED_TILT and widens (one move, "Being out of sight"); the "seen from above" PlanCard
 *            comes in top right and the gap at the wall is marked on the floor (GapMarker); two slowed pulses replay the
 *            round trips S -> W3 -> H -> W3 -> S and S -> W4 -> H -> W4 -> S, in the room and on the card on the same
 *            schedules. In the room each W -> H leg goes behind the partition's FAR END (by the wall) and is hidden until
 *            his outline (W4's spot itself is behind the far edge); never across the 2 m screen's top
 *            (assertAroundTheEnd); on the card both visibly thread the gap. He flinches with a saffron rim flash when
 *            each pulse reaches him ("away"); the echoes come home; the card leaves, and the sensor's readout,
 *            magnified in an inset, grows the likely-location blob (the S4.7 field) and the clue lights on "clues".
 *  S9.3 s47 + the 4.5 s hold: he gets the idea ("hide"), walks round to just behind the partition's near end (the
 *            camera side), turns his back to us on the last step (S9_BackHead: the back of his head, after the A01 back
 *            view), puts both hands on the near end's edge and pushes it back along z until its far end meets the wall
 *            (RUNWAY R4: hands on -> gap closed, locked camera, 4 static frames at each end; the partition, the gap
 *            marker and the optics use the moved layout). A new pulse: the paths now stop on the partition's face; the
 *            readout goes blank. He steps back round the near end to the hidden side, turns to face us, dusts his hands,
 *            smug, eyes shut... the checker strolls to the near end, leans round it and looks at him, deadpan (J4). He
 *            opens his eyes. A beat.
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

/** the light-path plane (sensor S, wall spots W, his point H: layout sensor.h = hidden.h = 0.95 m, his chest) */
const LIGHT_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
const W3 = W.find((p) => p.id === 'W3')!;
const W4 = W.find((p) => p.id === 'W4')!;
/** the gap between the partition's far end and the wall: the push closes it */
const GAP = OCC.z0;
const at3D = (pl: P2[]): PlanPt[] => pl.map((p) => ({x: p.x, z: p.z, h: LIGHT_H}));

// S9.2: the two round trips, unchanged (so the bounce and echo cues are unchanged). At RAISED_TILT each W -> H leg goes
// behind the partition's far end by the wall and comes out from behind its near end (where his body covers it); W4's
// spot itself lies behind the far edge, so in the room its pulse goes into the slot and is hidden; the PlanCard shows
// both trips. (Not W2: at 0.95 m it is behind her head.) Checked against the layout and, below, the light-path rule.
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

/** The raised framing of S9.2-S9.3 (the shared CAM_RAISED family, lower and wider): the wall spots, the gap at the
 *  wall, the whole 2 m partition in both positions (pushed to the wall its far top corner is the highest thing in the
 *  room), both characters, and his push from behind the near end with his shoes in frame. One move from CAM_ROOM; locked
 *  from RISE_END to the end of the scene (R4 needs a locked camera). Zoom 1.11, not the plan's 1.12: the push from
 *  behind puts his feet 0.20 m nearer the camera than the frontal push did. Checked below (CAM_W fit). */
const CAM_W: Cam = {cx: 955, cy: 508, zoom: 1.11};

/** The tilts light is drawn at (the rise; the paths themselves start after it, at RAISED_TILT) and the camera zoom
 *  the rule is measured at: CAM_W is the widest framing light is drawn in, so its margins are the smallest. */
const RISE_TILTS = [0, 0.25, 0.5, 0.75, 1].map((f) => f * RAISED_TILT);
for (const t of RISE_TILTS) assertAroundTheEnd('S9.2 round trips via W3 and W4', [at3D(PATH3), at3D(PATH4)], viewAt(t), {zoom: CAM_W.zoom});

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
/** "math": as the blob starts to grow he gulps and peeks toward her sensor (a designed development, not a still hold) */
const GULP = BLOB0 + 2;
const INSET_OUT = Math.max(LIT + 20, K.s47 - 2);
/** the arrival cue (lib Cast2 rimFlash) when each pulse reaches him: his chest is the W -> H legs' end (vertex 2) */
const HITS = [FLINCH, Math.round(VF4[2])];

// S9.2 "seen from above": the PlanCard comes in as the camera settles (fully in before the first pulse leaves) and runs
// the same two round trips on the same schedules; it is fully out before the magnified readout comes in (never two
// plan views at once), and never in S9.3 / R4 (asserted below, with HANDS).
const CARD_IN_DUR = 14;
// as the rise settles; earlier when the narration is quicker and the first pulse follows the rise at once (at 0.8x
// timing RISE_END - 8 was 4 frames too late and the assert below threw at module load)
const CARD_IN = Math.min(RISE_END - 8, P3_0 - CARD_IN_DUR);
const CARD_OUT = INSET0 - 6;
const CARD_OUT_DUR = 6;
const CARD = PLAN_CARD_RECT;

// S9.3: the idea, the walk round to the near end, the push from behind (R4)
const IDEA = K.hide + 2;
/** Where he pushes from (lead override 2, after the critic's A01 note): BEHIND the partition's near end, on the camera
 *  side and a little to its right, his back to us, both hands on the near end's edge beside his left side. From here the
 *  push reads as pushing the screen back toward the wall; the frontal grab from beside the end (hands at 0.98 / 0.84 m,
 *  round 1) still read as hugging or dragging it. PUSH_Z keeps his shoes inside CAM_W (CAM_W_FITS below). */
const PUSH_X = 2.4;
const PUSH_Z = OCC.z1 + 0.14;
const WALK_PLAN = planWalk({x: H.x, z: H.z}, {x: PUSH_X, z: PUSH_Z}, {stepM: 0.34});
const WALK0 = Math.max(IDEA + 12, K.hed);
const WALK_FPS = clamp(Math.floor((K.too - 4 - WALK0) / WALK_PLAN.steps), 7, 9);
const ARRIVE = WALK0 + WALK_PLAN.steps * WALK_FPS; // the last step's weight-down frame: he turns his back to us
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
if (!(CARD_IN + CARD_IN_DUR <= P3_0)) throw new Error(`S9: the PlanCard must be in (${CARD_IN + CARD_IN_DUR}) before the first pulse leaves (${P3_0})`);
if (!(CARD_OUT < INSET0 && CARD_OUT < HANDS && CARD_OUT + CARD_OUT_DUR <= INSET0)) throw new Error(`S9: the PlanCard must be gone (${CARD_OUT + CARD_OUT_DUR}) before the readout inset (${INSET0}) and R4 (${HANDS})`);

// S9.3 after the push: blank readout, he steps back round the near end and turns to face us, smug; the lean (J4).
// Offsets shrink if the hold gets shorter.
const CARD0 = K.future - 10; // the end card wipes in; the wordmark lands on "Future"
const KK = clamp((CARD0 - RT) / 105, 0.6, 1);
const o = (n: number) => RT + Math.round(n * KK);
const PULSE2 = o(3); // the sensor fires once R4 has ended (its emitter lights 3 frames before)
// the light tests use the partition at rest: its post-thunk wobble (gone at THUNK + 10) must have settled before the
// emitter lights for the blocked pulse
if (!(THUNK + 10 <= PULSE2 - 3)) throw new Error(`S9: the partition still wobbles (until ${THUNK + 10}) when the blocked pulse fires (${PULSE2})`);
const INSET2 = o(1);
const STEP0 = o(4);
/** he steps back round the near end to the hidden side (behind the closed partition, as seen from the sensor), his
 *  back still to us, and turns to face us on the last step's weight-down frame; it leaves room for her lean */
const HIDE = {x: 2.84, z: 1.42};
const STEP_PLAN = planWalk({x: PUSH_X, z: PUSH_Z - GAP}, HIDE, {stepM: 0.26, lift: 14});
const STEP_FPS = clamp(Math.floor((o(23) - 3 - STEP0) / STEP_PLAN.steps), 5, 8);
const TURN_FRONT = STEP0 + STEP_PLAN.steps * STEP_FPS;
const DUST0 = Math.max(o(23), TURN_FRONT + 3);
const DUST1 = Math.max(o(38), DUST0 + 15);
const SMUG0 = DUST1;
const C_LOOK = o(10);
const C_FPS = Math.max(5, Math.round(7 * KK));
/** where she ends up: just left of and in front of the near end; once she leans, her head clears both the near end and
 *  the sensor on its stand (a stop further left puts the sensor right beside her ear) */
const C_SPOT = {x: 1.73, z: 1.62};
if (!(HIDE.z < OCC.z1 - GAP && HIDE.x > OCC.x + 0.4)) throw new Error('S9: after the push he must end up behind the closed partition, clear of its near end');
// The PlanCard (screen space, top right) stays clear of him while it is up (S9.2, at H): his drawn rig with the arms out
// (the flinch, the paws) is at most ~150 rig px right of his feet
{
  const pl = rigAt(H.x, H.z, RAISED_TILT);
  const right = (pl.x + 150 * pl.scale - CAM_W.cx) * CAM_W.zoom + 960;
  if (right > CARD.x - 20) throw new Error(`S9: the PlanCard (x ${CARD.x}) would touch him (right edge ${right.toFixed(0)})`);
}
// CAM_W fit: the pushed partition's far top corner (the highest thing drawn) and his shoes at the push start (the lowest)
// stay inside the frame
{
  const sv = viewAt(RAISED_TILT);
  const scr = (p: PlanPt) => (projectWith(sv, p).y - CAM_W.cy) * CAM_W.zoom + 540;
  const top = scr({x: OCC.x - OCC.thickness / 2, z: 0, h: partitionTopH(0, movedLayout(GAP))}) - 3;
  const shoes = scr({x: PUSH_X, z: PUSH_Z, h: 0}) + 8 * rigAt(PUSH_X, PUSH_Z, RAISED_TILT).scale * CAM_W.zoom;
  if (top < 6 || shoes > 1074) throw new Error(`S9: CAM_W cuts the pushed partition's top (${top.toFixed(0)}) or his shoes (${shoes.toFixed(0)})`);
}

// after the push (gap closed), the same two wall spots as S9.2: the light still reaches W3, but what scatters toward him
// stops at the partition; the way to W4 (now behind the partition) is blocked outright. Same slowed speed as S9.2.
const LAY_CLOSED = movedLayout(GAP);
const GUESS_END = HIDE;
const stopOn = (a: P2, b: P2) => lerpP(a, b, firstOccluderHit(a, b, LAY_CLOSED, 0.03));
/** where the ray a -> (beyond b) meets the closed partition's camera-side face */
const onFace = (a: P2, b: P2): P2 => {
  const fx = LAY_CLOSED.occluder.x - LAY_CLOSED.occluder.thickness / 2;
  const u = (fx - a.x) / (b.x - a.x);
  return {x: fx, z: a.z + (b.z - a.z) * u};
};
const BLOCKED = [
  {w: W3 as P2 | null, path: [S, W3, stopOn(W3, GUESS_END)] as P2[]},
  {w: null as P2 | null, path: [S, stopOn(S, W4)] as P2[]},
].map((b) => {
  assertPath(b.path, LAY_CLOSED);
  // the pulse stops 3 cm short of the face; the cross marks where the ray meets the face itself
  const n = b.path.length;
  return {...b, stop: b.path[n - 1], face: onFace(b.path[n - 2], b.path[n - 1])};
});
// these are front legs: they stop on the partition's camera-side face (allowFront), but may still never go behind it
// across its top, nor show light over it
assertAroundTheEnd('S9.3 blocked pulses', BLOCKED.map((b) => at3D(b.path)), viewAt(RAISED_TILT), {zoom: CAM_W.zoom, layout: LAY_CLOSED, allowFront: true});
const PULSE_SPEED = LEN3 / RT_DUR; // metres per frame, as in S9.2
const SCHED2 = BLOCKED.map((b) => pathSchedule(b.path, {start: PULSE2, dur: Math.round(pathLength(b.path) / PULSE_SPEED)}));
const STOP_END = Math.round(Math.max(...SCHED2.map((sc) => sc.end)));
// the reading blinks off once the light has failed to come back, and the blank screen is held long enough to read
const BLANK = Math.max(o(22), STOP_END + 6);
// the stopped pulses and their crosses stay up until the readout has gone blank (cause and consequence on screen together)
const PATHS2_OUT = Math.max(o(24), STOP_END + 8, BLANK + 6);
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
// his steps back round the near end after the push (guesserAt's post-push walk)
const STEP_CLEAR = walkContacts(STEP0, STEP_PLAN, STEP_FPS);

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
  const q = projectWith(s, {x: p.x, z: p.z, h: LIGHT_H});
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

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

/** `view`: 'back' = his back to us (the rig with its arms behind the torso plus the S9_BackHead overlay). `turn`: the
 *  horizontal squash (scaleX) that sells a front/back swap on a weight-down frame. `inFront`: he is on the camera side
 *  of the partition's near end (drawn over it). */
type GuesserState = {plan: {x: number; z: number}; place: RigPlace; pose: Pose2; life: number; walk: WalkState | null; view: 'front' | 'back'; turn: number; inFront: boolean};

/** scaleX of a turn that swaps the view on frame `t` (the swap frame and the one before are narrowest) */
const turnSquash = (g: number, t: number) => 1 - 0.12 * clamp01(1 - Math.abs(g - (t - 0.5)) / 2.5);

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
    // "careful timing and math": the blob grows on her readout; he gulps (sweat up, a little shrink) and peeks out past
    // his side of the screen toward her sensor, until the clue lights
    const worry = Math.min(tw(g, GULP, 10, E.inOut), 1 - tw(g, DEFLATE - 2, 10, E.inOut));
    if (worry > 0) pose = withPose(pose, {peek: -0.38, lookX: -1, lookY: 0.12, tilt: -6, eyes: 1.12, pupil: 0.85, brows: 0.75, browAsym: 0.1, sweat: 1, mouth: 'hmm'}, worry);
    const gulp = pulseAt(g, GULP + 3, 8);
    if (gulp > 0) pose = {...pose, hunch: (pose.hunch ?? 0) + 0.06 * gulp, sink: (pose.sink ?? 0) + 5 * gulp};
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
    return {plan: {x: H.x, z: H.z}, place, pose, life: 0.45, walk: null, view: 'front', turn: 1, inFront: false};
  }
  // ---- S9.3: the walk round to the near end (facing us); on the last step's weight-down frame he turns his back to us
  const grin: Partial<Pose2> = {mouth: 'grin', lid: 0.3, brows: 0.2, browAsym: 0.7, lookX: -0.45, lookY: 0.4, tilt: 3, sweat: 0};
  if (g < PUSH0) {
    const d = walkDistance(g, WALK0, WALK_PLAN, WALK_FPS);
    const wk = walkAt(WALK_PLAN, d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: GUESSER_SEED, life: 0.3};
    const turn = turnSquash(g, ARRIVE);
    if (g < ARRIVE) {
      const pose: Pose2 = withPose({...IDLE2, ...wk.pose, armsFront: 'none'}, grin);
      return {plan: wk.plan, place, pose, life: 0.3, walk: wk, view: 'front', turn, inFront: wk.plan.z > OCC.z1};
    }
    // his back to us: both hands onto the near end's edge (contact at HANDS), elbows down; then the anticipation squat
    const reachIn = tw(g, ARRIVE, HANDS - ARRIVE, E.inOut);
    const sq = tw(g, SQUAT0, PUSH0 - SQUAT0, E.inOut);
    const base: Pose2 = {...IDLE2, ...wk.pose, ...BACK_FACE, armsFront: 'none'};
    // he leans and shifts his weight toward the edge (the hand reaching across behind his body needs it), then squats
    const prePush: Pose2 = {...base, lean: -5 * reachIn - sq, shift: PUSH_SHIFT * reachIn, sink: (base.sink ?? 0) + PUSH_SINK * sq, hunch: 0.03 * reachIn + 0.05 * sq};
    // each hand travels in a straight line from where it hangs to its contact point on the edge (no wide arm sweep)
    const tgt = handTargets(s, movedLayout(0));
    const restL = handWorld2(place, prePush, -1);
    const restR = handWorld2(place, prePush, 1);
    const armL = reach2(place, prePush, -1, lerp(restL.x, tgt.L.x, reachIn), lerp(restL.y, tgt.L.y, reachIn), ELBOW_L);
    const armR = reach2(place, prePush, 1, lerp(restR.x, tgt.R.x, reachIn), lerp(restR.y, tgt.R.y, reachIn), ELBOW_R);
    const pose: Pose2 = {...prePush, armL, armR};
    return {plan: wk.plan, place, pose, life: 0.3, walk: wk, view: 'back', turn, inFront: true};
  }
  // ---- the push (R4): from behind, he walks the near end back to the wall with both hands on its edge
  if (g < RT + 1) {
    g = gr; // R4's static end window: everything holds still
    const d = pushTravel(g);
    const wk = pushWalkAt(d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: GUESSER_SEED, life: 0.3};
    const jolt = g >= THUNK ? ring(g, THUNK, 0.9, 0.35) : 0;
    const surge = Math.sin(clamp01((g - PUSH0) / PUSH_DUR) * Math.PI);
    const ease = tw(g, THUNK + 2, 8, E.inOut);
    let pose: Pose2 = {
      ...IDLE2,
      ...wk.pose,
      ...BACK_FACE,
      // the shoulders stay where they were when his hands met the edge (a bigger lean throws the outer elbow out past it)
      sink: wk.pose.sink + PUSH_SINK * (1 - ease) + 3 * ease,
      hunch: 0.08 * (1 - ease) + 0.02 * surge,
      shift: PUSH_SHIFT,
      lean: -6 - 1.5 * surge + 3 * jolt + ease,
      tilt: -3 + 2 * ease,
      armsFront: 'none',
    };
    const tgt = handTargets(s, movedLayout(d));
    pose = {...pose, armL: reach2(place, pose, -1, tgt.L.x, tgt.L.y, ELBOW_L), armR: reach2(place, pose, 1, tgt.R.x, tgt.R.y, ELBOW_R)};
    return {plan: wk.plan, place, pose, life: 0.3, walk: wk, view: 'back', turn: 1, inFront: true};
  }
  // ---- after the push: hands off, back round the near end to the hidden side (his back still to us)
  if (g < TURN_FRONT) {
    const d = walkDistance(g, STEP0, STEP_PLAN, STEP_FPS);
    const wk = walkAt(STEP_PLAN, d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: GUESSER_SEED, life: 0.3};
    let pose: Pose2 = {...IDLE2, ...wk.pose, ...BACK_FACE, tilt: 2, armsFront: 'none'};
    // hands come off the partition (from the push pose) over the first frames
    const off = tw(g, RT, 8, E.inOut);
    if (off < 1) {
      const last = guesserAt(RT, tilt, cam).pose;
      pose = mixPose2({...last, feet: pose.feet, sink: pose.sink}, pose, off);
    }
    return {plan: wk.plan, place, pose, life: 0.3, walk: wk, view: 'back', turn: turnSquash(g, TURN_FRONT), inFront: wk.plan.z > OCC.z1 - GAP};
  }
  // ---- turned to face us, behind the closed partition: dust off, smug; then she is there
  const p0 = rigAt(HIDE.x, HIDE.z, tilt);
  const place: RigPlace = {x: p0.x, y: p0.y, scale: p0.scale, frame: gr, seed: GUESSER_SEED, life: 0.35};
  const pleased: Partial<Pose2> = {mouth: 'grin', lid: 0.35, brows: 0.1, browAsym: 0.5, lookX: -0.55, lookY: 0.1, tilt: 3, eyes: 1};
  let pose: Pose2 = withPose(IDLE2, pleased);
  // looks at the readout going blank, then dusts his hands (job done)
  const dust = Math.min(tw(g, DUST0, 5, E.out), 1 - tw(g, DUST1 - 2, 6, E.inOut));
  if (dust > 0) {
    const cx = p0.x;
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
  return {plan: {x: HIDE.x, z: HIDE.z}, place: {...place, life}, pose, life, walk: null, view: 'front', turn: turnSquash(g, TURN_FRONT), inFront: false};
};

/** The push walk (R4) with the rig's ground line on his body's plan point, not on his nearest planted foot. walkAt pins
 *  the rig to the rear foot (nearer the camera), so mid-step his body dropped back behind the moving edge and his arm
 *  swung out after it: he read as being dragged by the screen. On the body point his shoulders keep a constant offset
 *  from his hands on the edge (he drives it). The rear foot stays exactly on its footprint by reaching below that line
 *  (negative lift; Cast2 drops the hips as far as that leg needs, so each step dips him into the push). */
const pushWalkAt = (d: number, tilt: number): WalkState => {
  const wk = walkAt(PUSH_PLAN, d, tilt, undefined, 0);
  const y = projectWith(viewAt(tilt), {x: wk.plan.x, z: wk.plan.z, h: 0}).y;
  const dl = (y - wk.y) / wk.scale;
  const ft = (f: Foot): Foot => ({...f, lift: (f.lift ?? 0) + dl});
  return {...wk, y, pose: {...wk.pose, feet: {L: ft(wk.pose.feet.L), R: ft(wk.pose.feet.R)}}};
};

/** Seen from behind the face is covered (S9_BackHead): keep the rig's face quiet and drop the temple sweat drop. */
const BACK_FACE: Partial<Pose2> = {mouth: 'flat', lid: 0, brows: 0, browAsym: 0, lookX: 0, lookY: 0, sweat: 0, eyes: 1, pupil: 1};

/** Weight shift (rig px) toward the edge while his hands are on it. */
const PUSH_SHIFT = -24;
/** The push crouch (rig px of hip drop): knees bent, his weight into the screen. */
const PUSH_SINK = 14;
/** Elbow branches for the push (reachLocal): the outer arm's elbow down, the arm reaching across (behind his body) out
 *  and down. */
const ELBOW_L: 1 | -1 = 1;
const ELBOW_R: 1 | -1 = -1;

/** Where his hands press on the partition's near end (world px): on its end face (z1), the outer (left) hand low at his
 *  hip, the other (reaching across in front of his chest, hidden by his back) at chest height; on the set's height scale
 *  like the rig. The left shoulder sits right at the edge, so a left hand at shoulder height folded the arm shut and the
 *  IK flailed its elbow out sideways with every step of the push (upper arm -15..95 deg: "reaching after the screen");
 *  at the hip the arm stays bent at a working angle (upper arm -44..-34 deg) and flexes as he drives it. */
const handTargets = (s: ViewState, layout: Layout) => {
  const oc = layout.occluder;
  const L = projectWith(s, {x: oc.x, z: oc.z1, h: HAND_H.L});
  const R = projectWith(s, {x: oc.x + 0.01, z: oc.z1, h: HAND_H.R});
  return {L: {x: L.x, y: L.y}, R: {x: R.x, y: R.y}};
};
const HAND_H = {L: 0.62, R: 0.92};

// Hands on props: over the whole push (R4, HANDS..RT) both hands stay on the near end's edge (reach2 contact error)
{
  const sv = viewAt(RAISED_TILT);
  for (let f = HANDS; f <= RT; f++) {
    const gu = guesserAt(f, RAISED_TILT, CAM_W);
    const tgt = handTargets(sv, movedLayout(rigFrame(f) < PUSH0 ? 0 : pushTravel(rigFrame(f))));
    const eL = Math.hypot(handWorld2(gu.place, gu.pose, -1).x - tgt.L.x, handWorld2(gu.place, gu.pose, -1).y - tgt.L.y);
    const eR = Math.hypot(handWorld2(gu.place, gu.pose, 1).x - tgt.R.x, handWorld2(gu.place, gu.pose, 1).y - tgt.R.y);
    if (eL > 1 || eR > 1) throw new Error(`S9: at frame ${f} his hands miss the partition's edge by ${eL.toFixed(1)} / ${eR.toFixed(1)} px`);
  }
}

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

  /* ---- hidden tests for overlay light: the partition AS DRAWN (in its pushed position; light is only drawn while it is
          at rest), both people (a W -> H leg ends at his outline), and the sensor box (a path starts inside it) */
  const sb = geo.box;
  const behindPartition = partitionHides(s, LIGHT_H, {layout: lay});
  const behindFigures = figuresHide(s, LIGHT_H, [
    {z: ch.plan.z, place: ch.place},
    {z: gu.plan.z, place: gu.place},
  ]);
  const hidden = (p: P2) => {
    if (behindPartition(p) || behindFigures(p)) return true;
    const q = projectWith(s, {x: p.x, z: p.z, h: LIGHT_H});
    return Math.hypot(p.x - S.x, p.z - S.z) < 0.25 && q.x > sb.x0 - 2 && q.x < sb.x1 + 2 && q.y > sb.y0 - 2 && q.y < sb.y1 + 2;
  };
  // the arrival cue: a saffron rim on his wall-side outline as each pulse reaches his chest (plus the flinch)
  const rimT = Math.max(...HITS.map((hf) => tw(g, hf - 1, 3) * (1 - tw(g, hf + 6, 10))));

  /* ---- the cast and the partition (one item, layered by hand): behind the partition while he hides at H and on the
          hidden side; in front of it once he is on the camera side of its near end (the push from behind, his hands
          on its end face). Seen from behind he is the rig (arms behind the torso) plus the S9_BackHead overlay. */
  const back = gu.view === 'back';
  const guesserRig = (
    <Character2
      look={CAST.guesser}
      pose={gu.pose}
      frame={gu.place.frame!}
      seed={GUESSER_SEED}
      x={gu.place.x}
      y={gu.place.y}
      scale={gu.place.scale}
      life={gu.place.life}
      shadow={!gu.walk}
      eyeDarts={g < IDEA}
      style={rimT > 0.01 ? {filter: rimFlash(rimT, gu.place.scale)} : undefined}
    />
  );
  const guesser = (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: gu.turn < 1 ? `scale(${f2(gu.turn * 1000) / 1000}, 1)` : undefined, transformOrigin: `${f2(gu.place.x)}px ${f2(gu.place.y)}px`}}>
      {guesserRig}
      {back && <BackHead look={CAST.guesser} place={gu.place} pose={gu.pose} />}
    </div>
  );
  const walkShadow = (w: WalkState | null) =>
    w ? (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={f2(w.shadow.cx)} cy={f2(w.shadow.cy)} rx={f2(w.shadow.rx)} ry={f2(w.shadow.ry)} fill={C.shadow} />
      </svg>
    ) : null;
  const partition = <Partition tilt={tilt} wobble={wobble} layout={lay} />;
  // while he walks round to the near end the drawn rig (wider than his 0.22 m body) overlaps the end strip on screen;
  // as a billboard it is behind the end until it passes the end's plane (z1), then in front (no flip mid-walk)
  const walkingIn = g >= WALK0 && g < ARRIVE;
  const behind = !gu.inFront && (walkingIn || behindBox(gu.plan.x, gu.plan.z, box, tilt));
  const group = behind ? (
    <>
      {walkShadow(gu.walk)}
      {guesser}
      {partition}
    </>
  ) : (
    <>
      {partition}
      {walkShadow(gu.walk)}
      {guesser}
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

  /* ---- backdrop (the stand, the people and the partition paint over it): the gap at the wall marked on the floor in
          ink (GapMarker) while the round trips replay, and again from his walk to the near end until the push closes it
          (it shrinks with the moved layout); the lit wall spots (W4's is behind the partition's far edge, so the
          partition covers it exactly) */
  const gapT = Math.max(tw(g, RISE_END, 10, E.out) * (1 - tw(g, PATHS_OUT, 14)), g >= WALK0 - 4 ? tw(g, WALK0 - 4, 12) : 0);
  const pathsOp = 1 - tw(g, PATHS_OUT, 14);
  const after = g >= RT;
  const out2 = 1 - tw(g, PATHS2_OUT, 8);
  const backdrop = (
    <>
      <GapMarker tilt={tilt} t={gapT} layout={lay} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {g >= P3_0 && pathsOp > 0 && (
          <g opacity={pathsOp}>
            <WallSpot p={toPx(W3)} t={tw(g, VF3[1] - 2, 8)} hidden={behindPartition(W3)} />
            <WallSpot p={toPx(W4)} t={tw(g, VF4[1] - 2, 8)} hidden={behindPartition(W4)} />
          </g>
        )}
        {after && out2 > 0 && (
          <g opacity={out2}>
            {BLOCKED.map((b, i) => (b.w ? <WallSpot key={i} p={toPx(b.w)} t={tw(g, SCHED2[i].vertexFrames[1] - 2, 8)} hidden={behindPartition(b.w)} /> : null))}
          </g>
        )}
      </svg>
    </>
  );

  /* ---- overlays: S9.2 round trips, S9.3 the blocked pulse */
  const blocked = BLOCKED;
  const sched2 = SCHED2;

  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {g >= P3_0 && pathsOp > 0 && (
        <g opacity={pathsOp}>
          <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.55} toPx={toPx} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} hidden={hidden} seed={5} />
          <ScatterFan asGroup origin={W4} dirs={DIRS_W} length={0.5} toPx={toPx} t={tw(g, VF4[1], 12)} release={tw(g, VF4[1] + 14, 16)} layout={OLAYOUT} hidden={hidden} seed={7} width={4} />
          <ScatterFan asGroup origin={H} dirs={DIRS_H3} length={0.55} toPx={toPx} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} hidden={hidden} seed={8} width={3.5} color={C.saffron} />
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
            const sp2 = toPx(b.face);
            return (
              <g key={i}>
                {b.w && <ScatterFan asGroup origin={b.w} dirs={DIRS_W} length={0.5} toPx={toPx} t={tw(g, vf[1], 10)} release={tw(g, vf[1] + 14, 14)} layout={lay} hidden={hidden} seed={11 + i} width={4} />}
                <LightPath asGroup points={b.path} toPx={toPx} t={sc.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={lay} hidden={hidden} arrive="hide" />
                {/* on the face: the cross's left end is where the ray meets the face, so all of it sits on the face; 13 px
                    arms (26 px across) so "stopped here" still reads at phone size */}
                {crossT > 0.02 && <Cross x={sp2.x + 2 + CROSS_S * crossT} y={sp2.y} s={CROSS_S * crossT} />}
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
  const cardT = tw(g, CARD_IN, CARD_IN_DUR, E.out) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut));
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
      {cardT > 0 && (
        <PlanCard
          x={CARD.x}
          y={CARD.y}
          t={cardT}
          layout={lay}
          checker={{...ch.plan, facing: 85}}
          guesser={{...gu.plan, facing: -90}}
          sensor={{firing}}
          gap={gapT}
          light={(tp) =>
            g >= P3_0 && (
              <>
                <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.55} toPx={tp} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} seed={5} width={3.5} />
                <ScatterFan asGroup origin={W4} dirs={DIRS_W} length={0.5} toPx={tp} t={tw(g, VF4[1], 12)} release={tw(g, VF4[1] + 14, 16)} layout={OLAYOUT} seed={7} width={3} />
                <ScatterFan asGroup origin={H} dirs={DIRS_H3} length={0.55} toPx={tp} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} seed={8} width={3} color={C.saffron} />
                <LightPath asGroup points={PATH3} toPx={tp} t={SCHED3.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={6} pulseRadius={11} lane={11} ringRadius={34} />
                <LightPath asGroup points={PATH4} toPx={tp} t={SCHED4.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={6} pulseRadius={11} lane={11} ringRadius={34} />
              </>
            )
          }
          marks={(tp) =>
            g >= P3_0 && (
              <>
                <PlanSpot {...tp(W3)} t={tw(g, VF3[1] - 2, 8)} />
                <PlanSpot {...tp(W4)} t={tw(g, VF4[1] - 2, 8)} />
              </>
            )
          }
        />
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

const DIRS_W = scatterDirections({x: 0, z: 1}, 9, 4);
const DIRS_H3 = scatterDirections(sub(W3, H), 6, 9);

/** The magnified readout's place (screen px): upper left, over the plant and the left wall; its top edge sits above
 *  the plant's highest leaf tips (y ≈ 38), so no leaf pokes out over the bezel. */
const INSET = {x: 96, y: 28, w: 420, h: 386};

/* ================================================================== small drawing helpers */

const CROSS_S = 13;
const Cross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A lit wall spot (saffron diamond), in the backdrop so the partition and the people paint over it; not drawn at all
 *  when its centre is behind the partition (W4 from this camera: the PlanCard shows it), so no sliver pokes out. */
const WallSpot: React.FC<{p: {x: number; y: number}; t: number; hidden?: boolean}> = ({p, t, hidden}) => {
  if (t <= 0 || hidden) return null;
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
