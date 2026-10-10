import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen} from '../lib/camera';
import {E, SNAP, SOFT, hop, ring, sp, tw} from '../lib/motion';
import {LAYOUT, PTS, assertAroundTheEnd, partitionHides, partitionTopH, projectWith, rigAt, viewAt, type Layout, type PlanPt, type ViewState} from '../lib/room';
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
  segmentBlocked,
  sub,
  type P2,
  type ScalarField,
} from '../lib/optics';
import {CAST} from '../components/cast';
import {GapMarker, RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {Partition} from '../components/v02/Partition';
import {LightPath, ScatterFan, type ToPx} from '../components/v02/Optics';
import {ARMS, Character2, EXPR, HANDS_ON_HIPS, IDLE2, eyesWorld, figuresHide, handWorld2, mixPose2, reach2, rimFlash, withPose, type Foot, type Pose2, type RigPlace} from '../components/v02/Cast2';
import {handPos, reachLocal} from '../components/Character';
import {S9SensorStand, behindBox, boxOf, movedLayout, planWalk, standGeometry, walkAt, walkContacts, walkDistance, walkFrames, type WalkState} from '../components/v02/S9_Room';
import {V12MiniReadout, V12ReadoutInset} from '../components/v2s/V12_Readout';
import {PLAN_AREA, PLAN_VIEW, PlanCard, PlanSpot, planCardSize, viewForArea} from '../components/v02/PlanCard';
import {BackHead} from '../components/v02/S9_BackHead';
import {Cross, V12_CAM, V12_FAR_EDGE_X, V12_TILT, WallSpot, farEdgeScreenX} from '../components/v2s/V12_Parts';
import {Label} from '../components/v2k/Labels';

/**
 * V12 · Callback (n31, s47 + the J4 hold). v2/SHOTPLAN_V2.md V12; adapted from v1 S9.2-S9.3 (src/scenes/S9_Payoff.tsx,
 * read and copied, never imported). One locked raised room view for the whole scene: v1 S9.2's CAM_W at RAISED_TILT
 * (V12_Parts), the opening's room and orientation. No teaching labels (shot plan); the text on screen is the PlanCard's
 * own "seen from above" title during the trip and, fix r1 (V2-R1-38), "sensor readout" (48) under the magnified readout
 * whenever it is up.
 *
 *  V12.1 n31 "Being out of sight isn't the same as giving nothing away."
 *        Hard cut in from the warehouse corner: the partition's far-end edge stands where V11.5 left the blind corner
 *        (V12_FAR_EDGE_X, 881.9 px). He hides at H (paws up, at ease). One slowed round trip S -> W3 -> H -> W3 -> S
 *        (W3, no number): the pulse leaves on "Being", goes behind the partition's far end by the wall (the gap is
 *        marked on the floor) and reaches him on "isn't" (saffron rim flash, a flinch); he watches it go back; the echo
 *        is home on "as". S9.2's reviewed "seen from above" PlanCard runs the same trip for this beat only (the r1
 *        phone check: without it the W3 -> him leg does not read as going round the end). The sensor's readout, magnified top left and ringed on the real sensor, grows a soft blob on
 *        "giving nothing away"; it lights on "away" and he gulps (sweat, a shrink, a peek toward her sensor).
 *  V12.2 s47 "To really hide, he'd have to block the bounces too." + the J4 hold (~2.8 s to the cut)
 *        "To": the idea (he perks up, a grin); the readout clears. "hide": he walks round to just behind the
 *        partition's near end (four planted steps), turns his back to us on the last one, both mitts meet the near
 *        end's edge on "block" (anticipation: a squat), and he walks it back until its far end meets the wall
 *        (thunk on "too"; a short wobble; settle). The readout comes back with the last reading; one pulse fires:
 *        S -> W3 and what scatters toward him stops on the partition's face (a cross). The blob blinks off, the screen
 *        empties and holds blank 0.5 s with nothing else moving. Meanwhile he has let go and stepped clear to the
 *        hidden side (two steps), turning to face us. J4: he turns smug (hands on hips, chin up, eyes shut); she
 *        strolls two steps to the near end and simply leans round it (her dashed line of sight reaches his face); he
 *        opens his eyes, the take, and he deflates. Hard cut on the beat to V13.
 *
 * Every beat derives from narration cues (K) with clamps; the module-load checks below throw if a cue change breaks
 * the light-path rule, the hand contacts, the J4 sight line or the timing chain.
 */

/* ================================================================== cues */

const SC = scene('V12');
const K = {
  start: SC.from,
  end: SC.to,
  // n31
  being: at('n31', 'being'),
  isnt: at('n31', "isn't"),
  as: at('n31', 'as'),
  giving: at('n31', 'giving'),
  away: at('n31', 'away'),
  // s47
  to: at('s47', 'to'),
  hide: at('s47', 'hide'),
  block: at('s47', 'block'),
  too: at('s47', 'too'),
  s47End: segEnd('s47'),
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;
const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== geometry */

const CAM = V12_CAM;
const TILT = V12_TILT;
const SV = viewAt(TILT);
/** the light-path plane (sensor S, wall spot W3, his point H: 0.95 m, his chest) */
const LIGHT_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;
const W3 = W.find((p) => p.id === 'W3')!;
/** the gap between the partition's far end and the wall: the push closes it */
const GAP = OCC.z0;
const at3D = (pl: P2[]): PlanPt[] => pl.map((p) => ({x: p.x, z: p.z, h: LIGHT_H}));

// the hand-off contract with V11.5 (the warehouse's blind corner edge lands here on V11's last frame)
if (Math.abs(V12_FAR_EDGE_X - 881.94) > 0.5) throw new Error(`V12: the partition's far-end edge moved to x ${V12_FAR_EDGE_X.toFixed(2)} (contract 881.94)`);
/** For the report: far-end edge screen x (camera-facing face / centre line / back face) in V12's framing. */
export const V12_HANDOFF = {farEdgeX: V12_FAR_EDGE_X, centre: farEdgeScreenX(0), back: farEdgeScreenX(OCC.thickness / 2)};

// V12.1: one round trip via W3 (W1/W2 graze the partition's top corner at the raised tilt; S9 review). Its W3 -> H leg
// goes behind the partition's far end by the wall and is hidden until his outline; never across the screen's top.
const PATH3 = confocalPath(S, W3, H);
assertPath(PATH3, OLAYOUT);
const LEN3 = pathLength(PATH3);
assertAroundTheEnd('V12.1 round trip via W3', [at3D(PATH3)], SV, {zoom: CAM.zoom});

// the readout's soft blob: the S4.7 likely-location field (all four wall spots, one-bin bands; illustrative)
const CONF = (LAYOUT as unknown as {confocalA: {circle_radius_m: number}[]}).confocalA;
const HW = (LAYOUT as unknown as {bandHalfWidth: {oneBin: number}}).bandHalfWidth.oneBin;
const FIELD: ScalarField = possibleCloud({x0: 2.2, x1: 3.0, z0: 0.5, z1: 1.2, step: 0.008}, W.map((w, i) => ({W: w, r: CONF[i].circle_radius_m, halfWidth: HW})));

/* ================================================================== V12.1 beats */

/** S9.2's reviewed "seen from above" PlanCard, for the trip only (r1 at 390 px: in the room the W3 -> him leg pops at
 *  her pencil and vanishes behind the far end, so "round the end, by way of the wall" did not read without it). It
 *  slides in just after the cut (fully in before the pulse leaves), runs the same trip on the same schedule, and is
 *  gone before the magnified readout comes in (never two plan views at once). S9's size and place (x1.22 card, top
 *  right inside the safe area). */
const CARD_IN = K.start + 6;
const CARD_IN_DUR = 10;
const S9_CARD_AREA = {w: 488, h: 359};
const CARD_SIZE = planCardSize(S9_CARD_AREA);
const CARD = {x: Math.round(1920 * 0.95) - CARD_SIZE.w, y: Math.ceil(1080 * 0.05) + 20, ...CARD_SIZE};
const CARD_K = S9_CARD_AREA.w / PLAN_AREA.w;
const CARD_VIEW = viewForArea(PLAN_VIEW, S9_CARD_AREA);
const CARD_LIGHT_W = 8;
const CARD_LANE = 14;
/** the pulse leaves just after "Being" (the card in by then); it reaches him on "isn't" (vertex 2) */
const P0 = Math.max(K.being + 3, CARD_IN + CARD_IN_DUR + 2);
const RT_DUR = clamp(Math.round(((K.isnt - P0) * LEN3) / pathLength([S, W3, H])), 56, 84);
const SCHED3 = pathSchedule(PATH3, {start: P0, dur: RT_DUR});
const VF3 = SCHED3.vertexFrames;
const FLINCH = Math.round(VF3[2]);
const ECHO_END = Math.round(SCHED3.end);
/** the gap at the wall marked on the floor (ink and white): while the trip runs */
const GAP_IN = P0 - 10;
const GAP_OUT = ECHO_END + 6;
/** the readout: the magnified screen comes in (a calm grow-and-fade, no spring) as the echo arrives; the blob grows on
 *  "giving", lights on "away"; he gulps */
const CARD_OUT = ECHO_END + 3;
const CARD_OUT_DUR = 6;
const cardTAt = (g: number) => tw(g, CARD_IN, CARD_IN_DUR, E.linear) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut));
const cardLeftAt = (t: number) => CARD.x + (1 - E.out(clamp01(t))) * 56;
const INSET0 = CARD_OUT + CARD_OUT_DUR;
const INSET_IN = 10;
const BLOB0 = Math.max(INSET0 + 8, K.giving);
const LIT = Math.max(BLOB0 + 14, K.away);
const GULP = LIT + 3;

/* ================================================================== V12.2 beats */

/** the idea ("To really hide"), then the readout clears before he sets off */
const IDEA = Math.max(K.to - 2, GULP + 12);
const INSET_OUT = IDEA + 4;
const INSET_OUT_DUR = 8;
/** Where he pushes from (S9 lead override 2): BEHIND the partition's near end, on the camera side and a little to its
 *  right, his back to us, both hands on the near end's edge; the push reads as pushing the screen back to the wall. */
const PUSH_X = 2.4;
const PUSH_Z = OCC.z1 + 0.14;
const WALK_PLAN = planWalk({x: H.x, z: H.z}, {x: PUSH_X, z: PUSH_Z}, {stepM: 0.34});
const WALK0 = Math.max(IDEA + 10, K.hide - 10);
const WALK_FPS = clamp(Math.floor((K.block - 8 - WALK0) / WALK_PLAN.steps), 6, 7);
const ARRIVE = WALK0 + WALK_PLAN.steps * WALK_FPS; // the last step's weight-down frame: he turns his back to us
const HANDS = ARRIVE + 6; // both mitts meet the near end
const SQUAT0 = HANDS + 2; // anticipation
const PUSH0 = HANDS + 8;
const PUSH_PLAN = planWalk({x: PUSH_X, z: PUSH_Z}, {x: PUSH_X, z: PUSH_Z - GAP}, {stepM: 0.22, lift: 12});
const PUSH_FPS = 8;
const PUSH_DUR = PUSH_PLAN.steps * PUSH_FPS;
/** pushTravel's acceleration exponent (the push footfall cues are mapped through it) */
const PUSH_EXP = 1.55;
const THUNK = PUSH0 + PUSH_DUR; // the far end meets the wall
/** the push pose holds (settle) until RT, then his hands come off */
const RT = THUNK + 6;
const WOBBLE_END = THUNK + 8;

// after the push: the readout comes back with its last reading; one pulse (a little quicker than V12.1's) to W3; what
// scatters toward him stops on the partition's face
const LAY_CLOSED = movedLayout(GAP);
/** he steps back round to the hidden side (behind the closed partition as seen from the sensor) and turns to face us */
const HIDE = {x: 2.84, z: 1.42};
const stopOn = (a: P2, b: P2) => lerpP(a, b, firstOccluderHit(a, b, LAY_CLOSED, 0.03));
const onFace = (a: P2, b: P2): P2 => {
  const fx = LAY_CLOSED.occluder.x - LAY_CLOSED.occluder.thickness / 2;
  const u = (fx - a.x) / (b.x - a.x);
  return {x: fx, z: a.z + (b.z - a.z) * u};
};
const BLOCKED_PATH: P2[] = [S, W3, stopOn(W3, HIDE)];
assertPath(BLOCKED_PATH, LAY_CLOSED);
const BLOCKED_FACE = onFace(BLOCKED_PATH[1], BLOCKED_PATH[2]);
assertAroundTheEnd('V12.2 blocked pulse', [at3D(BLOCKED_PATH)], SV, {zoom: CAM.zoom, layout: LAY_CLOSED, allowFront: true});
const INSET2 = THUNK;
const PULSE2 = THUNK + 4;
const PULSE_SPEED = (1.5 * LEN3) / RT_DUR; // metres per frame
const SCHED2 = pathSchedule(BLOCKED_PATH, {start: PULSE2, dur: Math.round(pathLength(BLOCKED_PATH) / PULSE_SPEED)});
const STOP_END = Math.round(SCHED2.end);
/** the blob blinks off (off, on, off), then the screen empties; then it holds blank 0.5 s, nothing else moving */
const BLINK0 = STOP_END + 1;
const BLANK = BLINK0 + 4;
const BLANK_FULL = BLANK + 5;
const HOLD_END = BLANK_FULL + 15;
const INSET2_OUT = HOLD_END;
const PATHS2_OUT = BLANK_FULL;
const STEP0 = RT + 2;
const STEP_PLAN = planWalk({x: PUSH_X, z: PUSH_Z - GAP}, HIDE, {stepM: 0.26, lift: 14});
const STEP_FPS = 7;
const TURN_FRONT = STEP0 + STEP_PLAN.steps * STEP_FPS;
// J4: smug, her two-step stroll and lean, the take, the deflate, the cut
const SMUG0 = HOLD_END;
/** she sets off as he turns smug (her first frames barely move: the walk accelerates from rest) */
const C_WALK0 = SMUG0 - 1;
/** where she stops: just left of and in front of the closed partition's near end; leaning, her head clears it */
const C_SPOT = {x: 1.77, z: 1.62};
/** Director r2: her three steps at 9 frames a step (footfalls 8, 9 and a closing 7 apart; v1 D41 asked full steps >= 8,
 *  closing >= 7; at 8 a step the first came 7 after the second foot left) and she sets off one frame before his smug
 *  starts, so the lean, the take and the deflate keep their frames. (Two long strides were tried: a lunge, rejected.) */
const C_WALK_PLAN = planWalk({x: LAYOUT.operator.x, z: LAYOUT.operator.z}, C_SPOT, {stepM: 0.29, lift: 14, profile: 1});
const C_FPS = 9;
const C_LAST = 11;
/** her glance to the near end (fix r1, V2-R1-38): from the blank hold's last frame, as her walk starts from rest */
const GLANCE0 = C_WALK0;
const GLANCE_DUR = 7;
const LEAN0 = C_WALK0 + walkFrames(C_WALK_PLAN, C_FPS, C_LAST) + 1;
const SIGHT0 = LEAN0 + 2;
const OPEN = LEAN0 + 6;
const BUSTED = OPEN + 2;
const DEFLATE0 = BUSTED + 5;
const DEFLATE_DUR = 8;
/** Fix r1 (module load): her sight line fades as he deflates (it began 4 frames later, at BUSTED + 9; after the s37
 *  pause moved V12 by +45 frames the idle sway put his deflated head 0.002 inside the drawn-length check on the line's
 *  last, nearly faded frame, so the scene threw at load) */
const SIGHT_OUT = DEFLATE0;
const SIGHT_OUT_DUR = 6;

// the timing chain (module load): each beat after the one it answers, the blank alone for 0.5 s, the deflate settled
// before the cut
{
  const chain: [string, number][] = [
    ['P0', P0], ['flinch', FLINCH], ['echo', ECHO_END], ['lit', LIT], ['gulp', GULP], ['idea', IDEA], ['walk', WALK0], ['arrive', ARRIVE], ['hands', HANDS],
    ['push', PUSH0], ['thunk', THUNK], ['pulse2', PULSE2], ['stop', STOP_END], ['blank', BLANK], ['blankFull', BLANK_FULL], ['holdEnd', HOLD_END],
    ['lean', LEAN0], ['open', OPEN], ['busted', BUSTED], ['deflated', DEFLATE0 + DEFLATE_DUR],
  ];
  for (let i = 1; i < chain.length; i++) if (!(chain[i][1] > chain[i - 1][1])) throw new Error(`V12: ${chain[i][0]} (${chain[i][1]}) must come after ${chain[i - 1][0]} (${chain[i - 1][1]})`);
  if (!(P0 > K.start + 8 && ECHO_END + 4 <= K.giving + 6 && LIT + 12 <= K.to + 4)) throw new Error(`V12.1: the trip (${P0}..${ECHO_END}) and the clue (${LIT}) must fit n31`);
  if (!(TURN_FRONT <= BLANK_FULL)) throw new Error(`V12: he must face us (${TURN_FRONT}) before the blank holds (${BLANK_FULL})`);
  if (!(DEFLATE0 + DEFLATE_DUR + 4 <= K.end)) throw new Error(`V12: the deflate (${DEFLATE0 + DEFLATE_DUR}) must settle >= 4 frames before the cut (${K.end})`);
  if (!(WOBBLE_END <= PULSE2 + Math.round(SCHED2.vertexFrames[1] - PULSE2))) throw new Error('V12: the partition still wobbles when the pulse reaches it');
}

/* ================================================================== sound */

const GUESSER_STEPS = walkContacts(WALK0, WALK_PLAN, WALK_FPS);
/** The push's footfalls (director r1: walkContacts assumes walkDistance's schedule, but the push follows pushTravel's
 *  accelerating curve, so its cues landed 2-3 frames before the shoes did): each contact's travelled distance is mapped
 *  onto the frame where pushTravel reaches it. */
const pushFrameAt = (dist: number) => PUSH0 + Math.pow(clamp01(dist / GAP), 1 / PUSH_EXP) * PUSH_DUR;
const PUSH_STEPS = walkContacts(PUSH0, PUSH_PLAN, PUSH_FPS)
  .map((f) => Math.round(pushFrameAt(walkDistance(f, PUSH0, PUSH_PLAN, PUSH_FPS))))
  .filter((f) => f < THUNK - 2);
const STEP_CLEAR = walkContacts(STEP0, STEP_PLAN, STEP_FPS);
const CHECKER_STEPS = walkContacts(C_WALK0, C_WALK_PLAN, C_FPS, C_LAST);
// her stroll is unhurried (v1 D41: full steps >= 8 frames apart, the closing step >= 7), her last foot is down before she
// leans, and her feet are still through the blank hold
{
  const n = CHECKER_STEPS.length;
  const gaps = CHECKER_STEPS.slice(1).map((f, i) => f - CHECKER_STEPS[i]);
  if (gaps.some((d, i) => d < (i === n - 2 ? 7 : 8)) || CHECKER_STEPS[n - 1] >= LEAN0) throw new Error(`V12: her stroll's footfalls ${CHECKER_STEPS.join(', ')}: full steps >= 8 frames apart, the closing >= 7, all before the lean (${LEAN0})`);
  if (walkDistance(HOLD_END - 1, C_WALK0, C_WALK_PLAN, C_FPS, C_LAST) > 0) throw new Error('V12: she must not visibly move before the blank hold ends');
}

const SFX_CUES: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2, note: 'room tone for the scene'},
  // V12.1: the pulse motif once
  {f: P0, kind: 'sensor_pulse', gain: -2},
  {f: FLINCH, kind: 'bounce_tick', pitch: -2, gain: -4, note: 'the pulse reaches him'},
  {f: FLINCH + 1, kind: 'cloth_rustle', gain: -8, note: 'his flinch'},
  {f: ECHO_END, kind: 'echo_return'},
  {f: LIT, kind: 'readout_beep', gain: -3, note: 'the blob on the readout'},
  {f: GULP + 2, kind: 'cloth_rustle', gain: -9, pitch: -1, note: 'his gulp (shrink)'},
  // V12.2
  {f: IDEA, kind: 'cloth_rustle', gain: -7, pitch: 1, note: 'the idea'},
  ...GUESSER_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -6 - (i % 2), pitch: [0, -1, 0.5, -0.5][i % 4]})),
  {f: HANDS, kind: 'partition_thunk', gain: -10, note: 'mitts on the screen'},
  {f: PUSH0, kind: 'partition_scrape', dur: PUSH_DUR / 30},
  ...PUSH_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -9, pitch: -1 + (i % 2)})),
  {f: THUNK, kind: 'partition_thunk', gain: 2, note: 'the far end meets the wall'},
  {f: PULSE2, kind: 'sensor_pulse', gain: -4, pitch: 1},
  {f: STOP_END, kind: 'bounce_tick', pitch: -4, gain: -6, note: 'stopped at the partition'},
  {f: BLANK, kind: 'readout_off'},
  ...STEP_CLEAR.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -8, pitch: i % 2 ? -0.5 : 0.5})),
  {f: SMUG0 + 6, kind: 'smug_exhale'},
  ...CHECKER_STEPS.map((f, i) => ({f, kind: 'footstep_wood' as const, gain: -10, pitch: 1 + (i % 2) * 0.5})),
  {f: BUSTED, kind: 'uh_oh', gain: -2, note: 'J4: he opens his eyes and she is right there'},
];
export const SFX: Sfx[] = [...SFX_CUES].sort((a, b) => a.f - b.f);

/* ================================================================== helpers */

const roomToPx = (s: ViewState): ToPx => (p) => {
  const q = projectWith(s, {x: p.x, z: p.z, h: LIGHT_H});
  return {x: q.x, y: q.y};
};

/** Partition offset toward the wall (m): accelerates from rest and meets the wall at speed (an impact, not a glide). */
const pushTravel = (g: number) => {
  if (g <= PUSH0) return 0;
  if (g >= THUNK) return GAP;
  const u = (g - PUSH0) / PUSH_DUR;
  return GAP * Math.pow(u, PUSH_EXP);
};

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

type GuesserState = {plan: {x: number; z: number}; place: RigPlace; pose: Pose2; walk: WalkState | null; view: 'front' | 'back'; turn: number; inFront: boolean};

/** scaleX of a turn that swaps the view on frame `t` (the swap frame and the one before are narrowest) */
const turnSquash = (g: number, t: number) => 1 - 0.12 * clamp01(1 - Math.abs(g - (t - 0.5)) / 2.5);

/** hiding at H, at ease: paws up, a small smile, eyes on her side of the room */
const hidingFace: Partial<Pose2> = {lid: 0.18, eyes: 1, brows: 0.15, browAsym: 0.15, mouth: 'smile', lookX: -0.7, lookY: 0.05, tilt: -2, sweat: 0};

/** Seen from behind the face is covered (S9_BackHead): keep the rig's face quiet and drop the temple sweat drop. */
const BACK_FACE: Partial<Pose2> = {mouth: 'flat', lid: 0, brows: 0, browAsym: 0, lookX: 0, lookY: 0, sweat: 0, eyes: 1, pupil: 1};
const PUSH_SHIFT = -24;
const PUSH_SINK = 14;
const ELBOW_L: 1 | -1 = 1;
const ELBOW_R: 1 | -1 = -1;
const HAND_H = {L: 0.62, R: 0.92};
/** Where his mitts press on the partition's near end (world px): on its end face (z1), the outer hand low at his hip,
 *  the other (reaching across, hidden by his back) at chest height (S9's reviewed contact points). */
const handTargets = (s: ViewState, layout: Layout) => {
  const oc = layout.occluder;
  const L = projectWith(s, {x: oc.x, z: oc.z1, h: HAND_H.L});
  const R = projectWith(s, {x: oc.x + 0.01, z: oc.z1, h: HAND_H.R});
  return {L: {x: L.x, y: L.y}, R: {x: R.x, y: R.y}};
};

/** The push walk with the rig's ground line on his body's plan point (S9: he drives the screen, never dragged by it);
 *  the rear foot stays on its footprint by reaching below that line. */
const pushWalkAt = (d: number, tilt: number): WalkState => {
  const wk = walkAt(PUSH_PLAN, d, tilt, undefined, 0);
  const y = projectWith(viewAt(tilt), {x: wk.plan.x, z: wk.plan.z, h: 0}).y;
  const dl = (y - wk.y) / wk.scale;
  const ft = (f: Foot): Foot => ({...f, lift: (f.lift ?? 0) + dl});
  return {...wk, y, pose: {...wk.pose, feet: {L: ft(wk.pose.feet.L), R: ft(wk.pose.feet.R)}}};
};

/** The guesser's pose and place at frame g. */
const guesserAt = (g: number): GuesserState => {
  const tilt = TILT;
  const s = SV;
  // ---- V12.1 and the idea: at H
  if (g < WALK0) {
    const pl = rigAt(H.x, H.z, tilt);
    const place: RigPlace = {x: pl.x, y: pl.y, scale: pl.scale, frame: g, seed: GUESSER_SEED, life: 0.4};
    let pose: Pose2 = withPose({...IDLE2, ...ARMS.sneak, armsFront: 'both', hunch: 0.03}, hidingFace);
    // the pulse reaches him: a flinch (hop, wide eyes toward the wall), then he watches the light go back to her
    const fl = sp(g, FLINCH, SNAP);
    if (g >= FLINCH) {
      pose = withPose(pose, {eyes: 1.18, pupil: 0.8, brows: 0.85, browAsym: 0, mouth: 'o', lookX: -0.55, lookY: -0.55, lid: 0, tilt: -3}, Math.min(1, fl));
      pose = {...pose, bob: hop(g, FLINCH, 9, 9)};
      const watch = tw(g, FLINCH + 12, 12, E.inOut);
      if (watch > 0) pose = withPose(pose, {lookX: -0.85, lookY: 0.1, mouth: 'hmm', eyes: 1.08, brows: 0.6, sweat: 0.3}, watch);
    }
    // the blob lights on her readout: he gulps (a shrink, sweat) and peeks out past his side toward her sensor
    const worry = Math.min(tw(g, GULP, 8, E.inOut), 1 - tw(g, IDEA - 2, 8, E.inOut));
    if (worry > 0) pose = withPose(pose, {peek: -0.38, lookX: -1, lookY: 0.12, tilt: -6, eyes: 1.14, pupil: 0.82, brows: 0.8, browAsym: 0.1, sweat: 1, mouth: 'hmm'}, worry);
    const gulp = pulseAt(g, GULP + 2, 8);
    if (gulp > 0) pose = {...pose, hunch: (pose.hunch ?? 0) + 0.07 * gulp, sink: (pose.sink ?? 0) + 6 * gulp};
    // "To really hide": the idea (paws drop, he perks up, brows up, then a grin)
    const idea = sp(g, IDEA, SOFT);
    if (g >= IDEA) {
      const perk: Pose2 = {...IDLE2, armL: ARMS.sneak.armL, armR: reachLocal(84, -330, 1, 1), armsFront: 'L', hunch: 0, lid: 0, eyes: 1.14, pupil: 1, brows: 0.9, browAsym: 0.3, mouth: 'o', lookX: 0.1, lookY: -0.3, tilt: 5, sweat: 0.2};
      pose = mixPose2(pose, perk, Math.min(1, idea));
      const grin = tw(g, IDEA + 5, 5);
      if (grin > 0) pose = withPose(pose, {mouth: 'grin', lid: 0.3, brows: 0.2, browAsym: 0.7, lookX: -0.5, lookY: 0.45}, grin);
      const down = tw(g, WALK0 - 5, 5, E.inOut);
      if (down > 0) pose = mixPose2(pose, {...pose, armL: IDLE2.armL, armR: IDLE2.armR, armsFront: 'none'}, down);
    }
    return {plan: {x: H.x, z: H.z}, place, pose, walk: null, view: 'front', turn: 1, inFront: false};
  }
  // ---- the walk round to the near end (facing us); on the last step's weight-down frame he turns his back to us
  const grin: Partial<Pose2> = {mouth: 'grin', lid: 0.3, brows: 0.2, browAsym: 0.7, lookX: -0.45, lookY: 0.4, tilt: 3, sweat: 0};
  if (g < PUSH0) {
    const d = walkDistance(g, WALK0, WALK_PLAN, WALK_FPS);
    const wk = walkAt(WALK_PLAN, d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: g, seed: GUESSER_SEED, life: 0.3};
    const turn = turnSquash(g, ARRIVE);
    if (g < ARRIVE) {
      const pose: Pose2 = withPose({...IDLE2, ...wk.pose, armsFront: 'none'}, grin);
      return {plan: wk.plan, place, pose, walk: wk, view: 'front', turn, inFront: wk.plan.z > OCC.z1};
    }
    // his back to us: both mitts onto the near end's edge (contact at HANDS), then the anticipation squat
    const reachIn = tw(g, ARRIVE, HANDS - ARRIVE, E.inOut);
    const sq = tw(g, SQUAT0, PUSH0 - SQUAT0, E.inOut);
    const base: Pose2 = {...IDLE2, ...wk.pose, ...BACK_FACE, armsFront: 'none'};
    const prePush: Pose2 = {...base, lean: -5 * reachIn - sq, shift: PUSH_SHIFT * reachIn, sink: (base.sink ?? 0) + PUSH_SINK * sq, hunch: 0.03 * reachIn + 0.05 * sq};
    const tgt = handTargets(s, movedLayout(0));
    const restL = handWorld2(place, prePush, -1);
    const restR = handWorld2(place, prePush, 1);
    const armL = reach2(place, prePush, -1, lerp(restL.x, tgt.L.x, reachIn), lerp(restL.y, tgt.L.y, reachIn), ELBOW_L);
    const armR = reach2(place, prePush, 1, lerp(restR.x, tgt.R.x, reachIn), lerp(restR.y, tgt.R.y, reachIn), ELBOW_R);
    return {plan: wk.plan, place, pose: {...prePush, armL, armR}, walk: wk, view: 'back', turn, inFront: true};
  }
  // ---- the push: from behind, he walks the near end back to the wall with both mitts on its edge; then the settle
  if (g <= RT) {
    const d = pushTravel(g);
    const wk = pushWalkAt(d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: g, seed: GUESSER_SEED, life: 0.3};
    const jolt = g >= THUNK ? ring(g, THUNK, 0.9, 0.35) : 0;
    const surge = Math.sin(clamp01((g - PUSH0) / PUSH_DUR) * Math.PI);
    const ease = tw(g, THUNK + 1, 5, E.inOut);
    let pose: Pose2 = {
      ...IDLE2,
      ...wk.pose,
      ...BACK_FACE,
      sink: wk.pose.sink + PUSH_SINK * (1 - ease) + 3 * ease,
      hunch: 0.08 * (1 - ease) + 0.02 * surge,
      shift: PUSH_SHIFT,
      lean: -6 - 1.5 * surge + 3 * jolt + ease,
      tilt: -3 + 2 * ease,
      armsFront: 'none',
    };
    const tgt = handTargets(s, movedLayout(d));
    pose = {...pose, armL: reach2(place, pose, -1, tgt.L.x, tgt.L.y, ELBOW_L), armR: reach2(place, pose, 1, tgt.R.x, tgt.R.y, ELBOW_R)};
    return {plan: wk.plan, place, pose, walk: wk, view: 'back', turn: 1, inFront: true};
  }
  // ---- hands off, two steps round to the hidden side (his back still to us); he turns to face us on the last one
  if (g < TURN_FRONT) {
    const d = walkDistance(g, STEP0, STEP_PLAN, STEP_FPS);
    const wk = walkAt(STEP_PLAN, d, tilt);
    const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: g, seed: GUESSER_SEED, life: 0.3};
    let pose: Pose2 = {...IDLE2, ...wk.pose, ...BACK_FACE, tilt: 2, armsFront: 'none'};
    const off = tw(g, RT, 8, E.inOut);
    if (off < 1) {
      const last = guesserAt(RT).pose;
      pose = mixPose2({...last, feet: pose.feet, sink: pose.sink}, pose, off);
    }
    return {plan: wk.plan, place, pose, walk: wk, view: 'back', turn: turnSquash(g, TURN_FRONT), inFront: wk.plan.z > OCC.z1 - GAP};
  }
  // ---- facing us, behind the closed partition: pleased at the blank readout; smug; then she is there
  const p0 = rigAt(HIDE.x, HIDE.z, tilt);
  const place: RigPlace = {x: p0.x, y: p0.y, scale: p0.scale, frame: g, seed: GUESSER_SEED, life: 0.3};
  const pleased: Partial<Pose2> = {mouth: 'grin', lid: 0.35, brows: 0.1, browAsym: 0.5, lookX: -0.6, lookY: 0.15, tilt: 3, eyes: 1};
  let pose: Pose2 = withPose(IDLE2, pleased);
  // he turns smug: hands on hips, chin up, eyes shut
  const smug = tw(g, SMUG0, 10, E.inOut);
  if (smug > 0) {
    const sm: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), {lid: 0.97, tilt: 7, lookX: 0, lookY: -0.3, brows: -0.1, browAsym: 0.7, mouth: 'smirk'});
    pose = mixPose2(pose, sm, smug);
    pose = {...pose, bob: -3 * pulseAt(g, SMUG0 + 2, 10)}; // a small puff-up
  }
  // he opens his eyes: she is right there; the take
  const open = tw(g, OPEN, 3, E.out);
  if (open > 0) pose = withPose(pose, {lid: 0.05, lookX: -0.95, lookY: 0.05, tilt: 2}, open);
  if (g >= BUSTED) {
    const bust = sp(g, BUSTED, SNAP);
    pose = withPose(pose, {...EXPR.busted, lookX: -0.95, lookY: 0.05, tilt: -2}, Math.min(1, bust));
    pose = {...pose, bob: hop(g, BUSTED, 7, 6), blink: 1};
  }
  // he deflates: the puffed-up pose collapses (fists off the hips, shoulders down, a frown), eyes still on her
  const defl = tw(g, DEFLATE0, DEFLATE_DUR, E.inOut);
  if (defl > 0) {
    const flat: Pose2 = {...IDLE2, armL: {a: 6, b: 6}, armR: {a: 6, b: 6}, armsFront: 'none', hunch: 0.13, sink: 7, lean: 0, tilt: -7, lookX: -0.95, lookY: 0.12, brows: 0.45, browAsym: 0, lid: 0.42, eyes: 1, pupil: 0.95, mouth: 'frown', sweat: 1, blink: 1};
    pose = mixPose2(pose, flat, defl);
  }
  return {plan: {x: HIDE.x, z: HIDE.z}, place, pose, walk: null, view: 'front', turn: turnSquash(g, TURN_FRONT), inFront: false};
};

// Hands on props: from contact to the end of the push settle both mitts stay on the near end's edge (reach2 error)
{
  for (let f = HANDS; f <= RT; f++) {
    const gu = guesserAt(f);
    const tgt = handTargets(SV, movedLayout(f < PUSH0 ? 0 : pushTravel(f)));
    const eL = Math.hypot(handWorld2(gu.place, gu.pose, -1).x - tgt.L.x, handWorld2(gu.place, gu.pose, -1).y - tgt.L.y);
    const eR = Math.hypot(handWorld2(gu.place, gu.pose, 1).x - tgt.R.x, handWorld2(gu.place, gu.pose, 1).y - tgt.R.y);
    if (eL > 1 || eR > 1) throw new Error(`V12: at frame ${f} his mitts miss the partition's edge by ${eL.toFixed(1)} / ${eR.toFixed(1)} px`);
  }
}

// The PlanCard stays >= 20 px clear of him on every frame it is up (S9's per-frame check: his drawn right edge from the
// posed rig, both fists and elbows, the shoulder and the head with hair, + 4 px for idle drift)
{
  const rightPx = (f: number) => {
    const {place, pose} = guesserAt(f);
    const k = place.scale;
    const lean = ((pose.lean + (pose.peek ?? 0) * 6) * Math.PI) / 180;
    const xs: number[] = [];
    for (const side of [-1, 1] as const) {
      const hw = handWorld2(place, pose, side);
      const hp = handPos(side === -1 ? pose.armL : pose.armR, side);
      const ox = hp.ex - hp.hx;
      const oy = hp.ey - hp.hy;
      xs.push(hw.x + 22 * k, hw.x + (ox * Math.cos(lean) - oy * Math.sin(lean)) * k + 19 * k);
    }
    xs.push(place.x + ((pose.shift ?? 0) + 78) * k, eyesWorld(place, pose).x + 92 * k);
    return worldToScreen(CAM, Math.max(...xs), place.y).x + 4;
  };
  for (let f = CARD_IN; f <= CARD_OUT + CARD_OUT_DUR; f++) {
    const t = cardTAt(f);
    if (t <= 0) continue;
    const r = rightPx(f);
    if (r > cardLeftAt(t) - 20) throw new Error(`V12: at ${f} the PlanCard (left edge ${cardLeftAt(t).toFixed(0)}) would come within 20 px of him (his right edge ${r.toFixed(0)})`);
  }
  if (!(CARD_IN + CARD_IN_DUR <= P0 && CARD_OUT + CARD_OUT_DUR <= INSET0 && CARD_IN > K.start)) throw new Error('V12: the card must be in before the pulse leaves and gone before the readout');
  if (!(CARD.x >= 96 && CARD.x + CARD.w <= 1824 && CARD.y >= 54 && CARD.y + CARD.h + 11 <= 950)) throw new Error('V12: the PlanCard must sit inside the safe area');
}

type CheckerState = {plan: {x: number; z: number}; place: RigPlace; pose: Pose2; walk: WalkState | null};

/** Director r1 (v1 REVIEW_R3 N18, still present): Cast2 draws a shoe at side * (1 - |turn|) + 8 * turn from its ankle,
 *  and walkAt eases her profile `turn` in over the first half-step and out over the last, so a PLANTED shoe slid ~13 px
 *  along the floor in her closing step (9296-9302) and a little in the first. Offset each ankle by the change in that
 *  shoe-centre shift (relative to the standing turn, which the walk starts and ends on), so the drawn shoe stays on its
 *  footprint whatever the turn; the standing poses before and after the walk are unchanged. */
const STAND_TURN = -0.06;
const shoeShift = (side: -1 | 1, turn: number) => side * (1 - Math.abs(turn)) + 8 * turn;
const plantedShoes = (feet: {L: Foot; R: Foot}): {L: Foot; R: Foot} => {
  const fix = (f: Foot, side: -1 | 1): Foot => ({...f, x: f.x + shoeShift(side, STAND_TURN) - shoeShift(side, f.turn ?? 0)});
  return {L: fix(feet.L, -1), R: fix(feet.R, 1)};
};

const checkerAt = (g: number): CheckerState => {
  const tilt = TILT;
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
  // where she looks: the readout; him (a knowing glance as the blob lights, watching his push); the readout at the blank
  const know = Math.min(tw(g, LIT + 6, 8, E.inOut), 1 - tw(g, LIT + 34, 10, E.inOut));
  const watch = Math.min(tw(g, IDEA + 6, 8, E.inOut), 1 - tw(g, PULSE2, 8, E.inOut));
  // (fix r1, V2-R1-38: her brow settles as the screen empties, by BLANK_FULL, so nothing moves in the blank hold)
  const brow = Math.max(0.8 * know, 0.5 * Math.min(tw(g, THUNK, 6), 1 - tw(g, BLANK, BLANK_FULL - BLANK)));
  // the blank has read (0.5 s held, nothing moving): her eyes go from the readout to the partition's near end as she sets
  // off (fix r1, V2-R1-38: this glance began 8 frames into the hold, at BLANK_FULL + 8; it now starts at C_WALK0, the
  // hold's last frame, and eases from the readout look so the head never snaps; director r2)
  const toEnd = tw(g, GLANCE0, GLANCE_DUR, E.inOut);
  const endLook: Partial<Pose2> = {lookX: 0.9, lookY: 0.15, tilt: atHim.tilt};
  const lookK = Math.max(know, watch);
  const base: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'};
  if (g < C_WALK0) {
    const pl = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
    let pose = withPose(base, face(lookK, brow));
    if (toEnd > 0) pose = withPose(pose, endLook, toEnd);
    return {plan: {x: LAYOUT.operator.x, z: LAYOUT.operator.z}, place: {x: pl.x, y: pl.y, scale: pl.scale, frame: g, seed: CHECKER_SEED, life: 0.35}, pose, walk: null};
  }
  // she strolls to the near end, arms still crossed, and leans round it
  const d = walkDistance(g, C_WALK0, C_WALK_PLAN, C_FPS, C_LAST);
  const wk = walkAt(C_WALK_PLAN, d, tilt);
  const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: g, seed: CHECKER_SEED, life: 0.3};
  let pose: Pose2 = {...withPose(withPose(base, face(lookK, brow)), endLook, toEnd), feet: plantedShoes(wk.pose.feet), sink: wk.pose.sink};
  const lean = sp(g, LEAN0, SOFT);
  if (g >= LEAN0) pose = withPose(pose, {peek: 0.85, lean: 3, lookX: 1, lookY: 0.05, tilt: 2, lid: 0.4}, Math.min(1.04, lean));
  // no idle blink across the lean and the take: she just looks
  if (g >= LEAN0 - 4) pose = {...pose, blink: 1};
  return {plan: wk.plan, place, pose, walk: wk};
};

// Fix r1 (V2-R1-38): the blank reads first: from BLANK_FULL the readout holds blank for 0.5 s (to HOLD_END) and neither
// figure's pose, place or turn changes until then (only the rigs' own idle life); her glance and walk start on the hold's
// last frame (C_WALK0, where her walk has not yet moved her) and her head does not jump there
{
  if (!(HOLD_END - BLANK_FULL >= 15)) throw new Error(`V12: the blank must hold >= 0.5 s (${BLANK_FULL}..${HOLD_END})`);
  const still = (st: {place: RigPlace; pose: Pose2; turn?: number}) => JSON.stringify({...st.place, frame: 0, pose: st.pose, turn: st.turn ?? 1});
  const head = (p: Pose2) => [p.lookX, p.lookY, p.tilt, p.brows, p.browAsym, p.lid].map((v) => f2(v ?? 0)).join(',');
  const c0 = still(checkerAt(BLANK_FULL));
  const g0 = still(guesserAt(BLANK_FULL));
  for (let f = BLANK_FULL + 1; f < HOLD_END; f++) {
    if (still(guesserAt(f)) !== g0) throw new Error(`V12: he moves at ${f}, inside the blank hold (${BLANK_FULL}..${HOLD_END - 1})`);
    if (f < C_WALK0 ? still(checkerAt(f)) !== c0 : head(checkerAt(f).pose) !== head(checkerAt(BLANK_FULL).pose)) throw new Error(`V12: she moves at ${f}, inside the blank hold (${BLANK_FULL}..${HOLD_END - 1})`);
  }
}

/* ================================================================== J4: her line of sight */

/** S9's sight line (review D42): from her eyes toward his, drawn UNDER her rig (it comes out of her silhouette), over
 *  the partition and him, stopping just short of his head. */
const SIGHT_FROM = 92;
const SIGHT_TO = 80;
const sightLine = (ch: CheckerState, gu: GuesserState) => {
  const e0 = eyesWorld(ch.place, ch.pose);
  const e1 = eyesWorld(gu.place, gu.pose);
  const d = Math.hypot(e1.x - e0.x, e1.y - e0.y) || 1;
  const ua = (SIGHT_FROM * ch.place.scale) / d;
  const ub = 1 - (SIGHT_TO * gu.place.scale) / d;
  const pt = (u: number) => ({x: lerp(e0.x, e1.x, u), y: lerp(e0.y, e1.y, u)});
  return {e0, e1, d, ua, ub, a: pt(ua), b: pt(ub)};
};
/** A world-px point on an upright figure's billboard (plan depth z) back to plan metres and height. */
const billboardToPlan = (sv: ViewState, X: number, Y: number, z: number): PlanPt => {
  const dz = z - sv.pivot.z;
  return {x: sv.pivot.x + (X - sv.ax) / sv.ppm - sv.shear * dz, z, h: sv.pivot.h + (sv.floor * dz - (Y - sv.ay) / sv.ppm) / Math.max(1e-6, sv.height)};
};

// J4 honesty (module load): (1) from where she stood by the sensor, the closed partition blocks her eyes -> his at HIDE
// (why she has to go round); (2) from her lean, the line clears the closed partition by 5 cm in plan, and the drawn part
// is hidden neither by the partition (as drawn) nor by either figure; (3) the sensor itself cannot see him at HIDE.
{
  const ch0 = checkerAt(BLANK_FULL);
  const gu0 = guesserAt(SMUG0 + 4);
  const a0 = billboardToPlan(SV, eyesWorld(ch0.place, ch0.pose).x, eyesWorld(ch0.place, ch0.pose).y, ch0.plan.z);
  const b0 = billboardToPlan(SV, eyesWorld(gu0.place, gu0.pose).x, eyesWorld(gu0.place, gu0.pose).y, gu0.plan.z);
  if (!segmentBlocked(a0, b0, LAY_CLOSED)) throw new Error('V12: J4 needs the closed partition between her (by the sensor) and him at HIDE');
  if (!segmentBlocked(S, HIDE, LAY_CLOSED)) throw new Error('V12: the sensor must not see him directly at HIDE');
  for (const f of [OPEN, BUSTED, Math.min(K.end - 1, SIGHT_OUT + SIGHT_OUT_DUR - 1)]) {
    const ch = checkerAt(f);
    const gu = guesserAt(f);
    const L = sightLine(ch, gu);
    const A = billboardToPlan(SV, L.e0.x, L.e0.y, ch.plan.z);
    const B = billboardToPlan(SV, L.e1.x, L.e1.y, gu.plan.z);
    if (segmentBlocked(A, B, LAY_CLOSED, 0.05)) throw new Error(`V12: at ${f} her line of sight to him meets the closed partition (plan, 5 cm margin)`);
    if (!(L.ua < L.ub - 0.15)) throw new Error(`V12: at ${f} the drawn sight line is too short`);
    const figs = figuresHide(SV, LIGHT_H, [
      {z: ch.plan.z, place: ch.place},
      {z: gu.plan.z, place: gu.place},
    ]);
    for (let i = 0; i <= 24; i++) {
      const u = L.ua + ((L.ub - L.ua) * i) / 24;
      const p: PlanPt = {x: lerp(A.x, B.x, u), z: lerp(A.z, B.z, u), h: lerp(A.h!, B.h!, u)};
      if (partitionHides(SV, p.h!, {layout: LAY_CLOSED})(p)) throw new Error(`V12: at ${f} the sight line is drawn where the closed partition hides it (u ${u.toFixed(2)})`);
      if (figs(p)) throw new Error(`V12: at ${f} the drawn sight line passes behind a figure (u ${u.toFixed(2)})`);
    }
  }
}

/* ================================================================== the room shot */

const DIRS_W = scatterDirections({x: 0, z: 1}, 9, 4);
const DIRS_H3 = scatterDirections(sub(W3, H), 6, 9);
/** The magnified readout (screen px): upper left over the plant and the left wall, inside the safe area (S9's, D44). */
/** Fix r1 (V2-R1-38): as wide as the corner allows (was x 100, y 56, 416 x 358). On every frame the inset is up, her
 *  head's left edge is at x 539-550 for y 300-370 (idle sway) and her shoulder at x 521-536 from y about 425, so the
 *  inset (and its +8 / +12 shadow) ends at x 523 (531) and y 401 (413), >= 8 px clear of her (measured on the renders);
 *  25 % of the frame width (480 px) would cover the left of her head. The thinner bezel and the trimmed map window
 *  (V12_Readout) draw the reading itself 15 % larger (232.5 -> 268 px per metre). */
const INSET = {x: 96, y: 54, w: 427, h: 347};
/** its name, under it (48 px, secondary), fading with it; it never moves */
const INSET_LABEL = {x: INSET.x + 4, base: INSET.y + INSET.h + 50, size: 48};
/** the stopped-here cross: 17 px arms (S9's 13 was lost next to her pencil at phone size) */
const CROSS_V12 = 17;

export const V12Callback: React.FC = () => {
  const g = useG();
  const s = SV;
  const toPx = roomToPx(s);
  const cam = CAM;

  // the partition, pushed back
  const push = g < PUSH0 ? 0 : pushTravel(g);
  const lay = movedLayout(push);
  const box = boxOf(lay);
  const wobble = g >= THUNK ? 0.45 * ring(g, THUNK, 0.8, 0.3) * (1 - tw(g, THUNK + 4, 4)) : 0;

  const gu = guesserAt(g);
  const ch = checkerAt(g);
  const geo = standGeometry(TILT);
  const sightT = g >= SIGHT0 ? tw(g, SIGHT0, OPEN - SIGHT0, E.out) : 0;
  const sightOp = 1 - tw(g, SIGHT_OUT, SIGHT_OUT_DUR, E.inOut);
  const sight = sightT > 0 && sightOp > 0 ? sightLine(ch, gu) : null;

  /* ---- the readout (the sensor's own little screen, and its magnified view) */
  const blobT = tw(g, BLOB0, 18, E.out);
  // the blob blinks off (off, on, off) and stays off; then the whole screen empties
  const blinkOff = g < BLINK0 ? 0 : g < BLANK ? (Math.floor((g - BLINK0) / 2) % 2 === 0 ? 1 : 0) : 1;
  const blankT = tw(g, BLANK, BLANK_FULL - BLANK, E.inOut);
  const firing = Math.max(pulseAt(g, P0 - 3, 8), pulseAt(g, PULSE2 - 3, 8));
  const showMap = g >= INSET0 - 2;
  const sensor = showMap
    ? {screen: <V12MiniReadout w={52} h={34} blob={blobT * (1 - blinkOff)} blank={blankT} occZ0={lay.occluder.z0} />, led: g >= BLANK ? 0.15 : 1, firing}
    : {reveal: 1, led: 1, firing, bumpHighlight: pulseAt(g, ECHO_END, 14)};

  /* ---- hidden tests for overlay light: the partition as drawn (light is only drawn while it is at rest), both people
          (a W -> H leg ends at his outline), and the sensor box (a path starts inside it) */
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
  const rimT = tw(g, FLINCH - 1, 3) * (1 - tw(g, FLINCH + 6, 10));

  /* ---- the cast and the partition (one item, layered by hand, as S9) */
  const back = gu.view === 'back';
  const guesser = (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: gu.turn < 1 ? `scale(${f2(gu.turn * 1000) / 1000}, 1)` : undefined, transformOrigin: `${f2(gu.place.x)}px ${f2(gu.place.y)}px`}}>
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
      {back && <BackHead look={CAST.guesser} place={gu.place} pose={gu.pose} />}
    </div>
  );
  const walkShadow = (w: WalkState | null) =>
    w ? (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={f2(w.shadow.cx)} cy={f2(w.shadow.cy)} rx={f2(w.shadow.rx)} ry={f2(w.shadow.ry)} fill={C.shadow} />
      </svg>
    ) : null;
  const partition = <Partition tilt={TILT} wobble={wobble} layout={lay} />;
  const walkingIn = g >= WALK0 && g < ARRIVE;
  const behind = !gu.inFront && (walkingIn || behindBox(gu.plan.x, gu.plan.z, box, TILT));
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

  const sightPath = sight ? (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path
        d={`M ${f2(sight.e0.x)} ${f2(sight.e0.y)} L ${f2(lerp(sight.e0.x, sight.b.x, sightT))} ${f2(lerp(sight.e0.y, sight.b.y, sightT))}`}
        stroke={C.coral}
        strokeWidth={5}
        strokeDasharray="14 11"
        strokeLinecap="round"
        fill="none"
        opacity={f2(sightOp)}
      />
    </svg>
  ) : null;

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
          {sightPath}
          <Character2 look={CAST.checker} pose={ch.pose} frame={ch.place.frame!} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} shadow={!ch.walk} />
        </>
      ),
    },
    {key: 'stand', x: PTS.S.x, z: LAYOUT.operator.z + 0.04, w: 0.17, height: 1.4, node: <S9SensorStand tilt={TILT} sensor={sensor} />},
  ];

  /* ---- backdrop: the gap at the wall marked on the floor while the trip runs, and again from his walk until the push
          closes it; the lit wall spot */
  const gapT = Math.max(tw(g, GAP_IN, 10, E.out) * (1 - tw(g, GAP_OUT, 14)), g >= WALK0 - 4 ? tw(g, WALK0 - 4, 12) : 0);
  const pathsOp = 1 - tw(g, ECHO_END + 6, 14);
  const after = g >= PULSE2 - 1;
  const out2 = 1 - tw(g, PATHS2_OUT, 8);
  const backdrop = (
    <>
      <GapMarker tilt={TILT} t={gapT} layout={lay} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {g >= P0 && pathsOp > 0 && g < WALK0 && (
          <g opacity={pathsOp}>
            <WallSpot p={toPx(W3)} t={tw(g, VF3[1] - 2, 8)} hidden={behindPartition(W3)} />
          </g>
        )}
        {after && out2 > 0 && (
          <g opacity={out2}>
            <WallSpot p={toPx(W3)} t={tw(g, SCHED2.vertexFrames[1] - 2, 8)} hidden={behindPartition(W3)} />
          </g>
        )}
      </svg>
    </>
  );

  /* ---- overlays: the V12.1 round trip; the V12.2 blocked pulse */
  const vf2 = SCHED2.vertexFrames;
  const vEnd = vf2[vf2.length - 1];
  const crossT = g >= vEnd ? E.out(clamp01((g - vEnd) / 6)) : 0;
  const face = toPx(BLOCKED_FACE);
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {g >= P0 && pathsOp > 0 && g < WALK0 && (
        <g opacity={pathsOp}>
          <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.55} toPx={toPx} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} hidden={hidden} seed={5} />
          <ScatterFan asGroup origin={H} dirs={DIRS_H3} length={0.55} toPx={toPx} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} hidden={hidden} seed={8} width={3.5} color={C.saffron} />
          <LightPath asGroup points={PATH3} toPx={toPx} t={SCHED3.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} hidden={hidden} />
        </g>
      )}
      {after && out2 > 0 && (
        <g opacity={out2}>
          <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.5} toPx={toPx} t={tw(g, vf2[1], 10)} release={tw(g, vf2[1] + 14, 14)} layout={lay} hidden={hidden} seed={11} width={4} />
          <LightPath asGroup points={BLOCKED_PATH} toPx={toPx} t={SCHED2.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={lay} hidden={hidden} arrive="hide" />
          {crossT > 0.02 && <Cross x={face.x + 2 + CROSS_V12 * crossT} y={face.y} s={CROSS_V12 * crossT} />}
        </g>
      )}
    </svg>
  );

  /* ---- screen space: the magnified readout and the ring on the real sensor */
  const in1 = tw(g, INSET0, INSET_IN, E.out) * (1 - tw(g, INSET_OUT, INSET_OUT_DUR, E.inOut));
  const in2 = tw(g, INSET2, 8, E.out) * (1 - tw(g, INSET2_OUT, 8, E.inOut));
  const insetT = g < INSET2 ? in1 : in2;
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  const sensorScr = scr({x: (sb.x0 + sb.x1) / 2, y: (sb.y0 + sb.y1) / 2});
  const insetLit = g < INSET2 ? clamp01((g - LIT) / 18) : 0;

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={TILT} items={items} partition={false} backdrop={backdrop}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {insetT > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={f2(sensorScr.x)} cy={f2(sensorScr.y)} r={f2(50 * cam.zoom * (0.94 + 0.06 * insetT))} fill="none" stroke={C.teal} strokeWidth={5} opacity={f2(insetT)} />
        </svg>
      )}
      {cardTAt(g) > 0 && (
        <PlanCard
          x={CARD.x}
          y={CARD.y}
          t={cardTAt(g)}
          area={S9_CARD_AREA}
          view={CARD_VIEW}
          layout={lay}
          checker={{...ch.plan, facing: 85}}
          guesser={{...gu.plan, facing: -90}}
          sensor={{firing}}
          gap={gapT}
          light={(tp) =>
            g >= P0 && (
              <>
                <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.55} toPx={tp} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} seed={5} width={3.5 * CARD_K} />
                <ScatterFan asGroup origin={H} dirs={DIRS_H3} length={0.55} toPx={tp} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} seed={8} width={3 * CARD_K} color={C.saffron} />
                <LightPath asGroup points={PATH3} toPx={tp} t={SCHED3.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={CARD_LIGHT_W} pulseRadius={11 * CARD_K} lane={CARD_LANE} ringRadius={34 * CARD_K} />
              </>
            )
          }
          marks={(tp) => g >= P0 && <PlanSpot {...tp(W3)} t={tw(g, VF3[1] - 2, 8)} r={9 * CARD_K} />}
        />
      )}
      {/* `exiting` makes both the entry and the exit a calm grow/shrink-and-fade (no spring) */}
      <V12ReadoutInset x={INSET.x} y={INSET.y} w={INSET.w} h={INSET.h} t={insetT} exiting field={FIELD} blob={blobT * (1 - blinkOff)} lit={insetLit} blank={g < INSET2 ? 0 : blankT} led={g >= BLANK ? 0 : 1} occZ0={lay.occluder.z0} />
      {insetT > 0 && (
        <Label x={INSET_LABEL.x} y={INSET_LABEL.base} size={INSET_LABEL.size} opacity={f2(insetT)}>
          sensor readout
        </Label>
      )}
    </AbsoluteFill>
  );
};

/** Report numbers (module constants; printed by the QA script, never used in the picture). */
export const V12_TIMING = {P0, RT_DUR, FLINCH, ECHO_END, INSET0, BLOB0, LIT, GULP, IDEA, WALK0, WALK_FPS, ARRIVE, HANDS, PUSH0, THUNK, RT, PULSE2, STOP_END, BLINK0, BLANK, BLANK_FULL, HOLD_END, TURN_FRONT, SMUG0, C_WALK0, LEAN0, OPEN, BUSTED, DEFLATE0, end: K.end, steps: {guesser: GUESSER_STEPS, push: PUSH_STEPS, clear: STEP_CLEAR, checker: CHECKER_STEPS}};
// Framing fit (S9's CAM_W check): the pushed partition's far top corner (the highest thing drawn) and his shoes at the
// push start (the lowest) stay inside the frame
{
  const scrY = (p: PlanPt) => (projectWith(SV, p).y - CAM.cy) * CAM.zoom + 540;
  const top = scrY({x: OCC.x - OCC.thickness / 2, z: 0, h: partitionTopH(0, movedLayout(GAP))}) - 3;
  const shoes = scrY({x: PUSH_X, z: PUSH_Z, h: 0}) + 8 * rigAt(PUSH_X, PUSH_Z, TILT).scale * CAM.zoom;
  if (top < 6 || shoes > 1074) throw new Error(`V12: the framing cuts the pushed partition's top (${top.toFixed(0)}) or his shoes (${shoes.toFixed(0)})`);
}
