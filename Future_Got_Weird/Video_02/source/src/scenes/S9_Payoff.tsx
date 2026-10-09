import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, SOFT, camPath, hop, ring, sp, tw} from '../lib/motion';
import {CAM_ROOM, RAISED_TILT} from '../lib/shots';
import {LAYOUT, PTS, assertAroundTheEnd, partitionHides, partitionTopH, projectWith, rigAt, tiltAt, viewAt, type Layout, type PlanPt, type ViewState} from '../lib/room';
import {
  LAYOUT as OLAYOUT,
  assertPath,
  confocalPath,
  firstOccluderHit,
  layoutPoints,
  segmentBlocked,
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
  eyesWorld,
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
import {handPos, reachLocal, type Arm} from '../components/Character';
import {S9SensorStand, behindBox, boxOf, movedLayout, planWalk, standGeometry, walkAt, walkContacts, walkDistance, walkFrames, type WalkState} from '../components/v02/S9_Room';
import {MiniReadout, ReadoutInset} from '../components/v02/S9_Readout';
import {EndCard} from '../components/v02/S9_EndCard';
import {BackHead} from '../components/v02/S9_BackHead';
import {PLAN_AREA, PLAN_VIEW, PlanCard, PlanSpot, planCardSize, viewForArea} from '../components/v02/PlanCard';

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
/** The readout (and its "likely location" label) holds well past the clue (review r1 D40: it left ~0.8 s after it lit,
 *  on the end of the sentence) and clears just before he sets off on "he'd": the takeaway image gets its settle. */
const INSET_OUT = Math.max(LIT + 40, K.hed - 10);
/** the label's exit (8 frames, a calm shrink-and-fade) starts this long before the inset's */
const LABEL_LEAD = 6;
const LABEL_OUT_DUR = 8;
/** the inset's exit (a calm shrink-and-fade, S9_Readout `exiting`) */
const INSET_OUT_DUR = 10;
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
/** Review r2 N12 (lead R2-L3): S9.2 restates the film's core idea, so its card is 1.22x lib/shots PLAN_CARD_AREA
 *  (520 x 437 instead of 432 x 372; S1.4's is 704 wide), top right inside the 5 % margin (right edge 1824, top 74, the
 *  tape inside the margin too). CAM_W is locked for R4, so the card grows into the free wall and doorway on the right,
 *  never over him (his right elbow is drawn at x ~1278, 26 px from the card; the per-frame check below keeps >= 20). */
const S9_CARD_AREA = {w: 488, h: 359};
const S9_CARD_SIZE = planCardSize(S9_CARD_AREA);
const CARD = {x: Math.round(1920 * 0.95) - S9_CARD_SIZE.w, y: Math.ceil(1080 * 0.05) + 20, ...S9_CARD_SIZE};
/** the card's light strokes (designed for the default PLAN_AREA card) scale with its plan area */
const S9_CARD_K = S9_CARD_AREA.w / PLAN_AREA.w;
// linear in: PlanCard applies the only ease to its slide and fade (review r1 D16: E.out here made it a near-pop)
const cardTAt = (g: number) => tw(g, CARD_IN, CARD_IN_DUR, E.linear) * (1 - tw(g, CARD_OUT, CARD_OUT_DUR, E.inOut));
/** the card's drawn left edge (screen px) at card t: PlanCard slides it in from 56 px to the right */
const cardLeftAt = (t: number) => CARD.x + (1 - E.out(clamp01(t))) * 56;
if (!(CARD.x >= 1920 * 0.05 && CARD.x + CARD.w <= 1920 * 0.95 && CARD.y >= 1080 * 0.05 && CARD.y + CARD.h + 11 <= 1080 * 0.88)) throw new Error(`S9: the PlanCard (${CARD.x}, ${CARD.y}, ${CARD.w} x ${CARD.h}) must sit inside the 5 % margin and above the caption band`);

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
// D40: the readout settles on the lit clue (>= 40 frames, label up throughout), and it and its ring are gone well before
// his hands meet the partition (R4 has no overlays)
if (!(INSET_OUT - LABEL_LEAD - LIT >= 34 && INSET_OUT + INSET_OUT_DUR <= HANDS - 8)) throw new Error(`S9: the readout must hold the lit clue (${LIT}..${INSET_OUT}) and be gone (${INSET_OUT + INSET_OUT_DUR}) 8 frames before R4 (${HANDS})`);

// S9.3 after the push: blank readout, he steps back round the near end and turns to face us, smug; the lean (J4).
// Offsets shrink if the hold gets shorter.
const CARD0 = K.future - 10; // the end card wipes in; the wordmark lands on "Future"
/** The post-push chain at full length (frames from R4's end to the wipe): the blocked pulse, the blank readout, his step
 *  clear, the dust-off and the smug beat, her stroll and lean, the take (~72 frames, as before), then the reaction and
 *  its settle (review r1 D43, lead L11: the s47 pause grew 0.8 s for it, so 105 + 24). On the measured timeline KK = 1;
 *  a quicker narration compresses the settle along with everything else instead of eating it alone. */
const HOLD_NOM = 105 + 24;
const KK = clamp((CARD0 - RT) / HOLD_NOM, 0.6, 1);
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
/** her deadpan stroll (review r1 D41: 4 footfalls in 21 frames, one every ~5, read as a scurry): the same three short
 *  steps (the chibi rig's legs can't take 0.42 m strides without dropping into a lunge), 9-frame full steps, and (review
 *  r2 D41) a slower last step into the stop (C_LAST below), so the closing half-step lands >= 7 frames after the third
 *  footfall on screen (it was 5); she sets off as her screen goes blank (KK = 1) */
const C_FPS = Math.max(6, Math.round(9 * KK));
/** where she ends up: just left of and in front of the near end; once she leans, her head clears both the near end and
 *  the sensor on its stand (a stop further left puts the sensor right beside her ear) */
const C_SPOT = {x: 1.73, z: 1.62};
if (!(HIDE.z < OCC.z1 - GAP && HIDE.x > OCC.x + 0.4)) throw new Error('S9: after the push he must end up behind the closed partition, clear of its near end');
// (the PlanCard stays >= 20 px clear of him while it is up: checked per frame below, after guesserAt)
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
const C_WALK0 = BLANK; // she sets off as her screen goes blank (review r2 D41: was BLANK + 2, given back to the last step)
/** Her steps cross the screen to the right (and a little toward us): with the shoes facing the camera the frontal
 *  rig's legs crossed into an X whenever a foot landed ahead of the other; she walks in profile (S9_Room planWalk
 *  `profile`: shoes 3/4 to the right, knees that way, the near leg on top), Cast2's sideways-walk convention. */
const C_WALK_PLAN = planWalk({x: LAYOUT.operator.x, z: LAYOUT.operator.z}, C_SPOT, {stepM: 0.27, lift: 14, profile: 1});
/** her lean -> his eyes open -> the take */
const LEAN_OPEN = Math.round(15 * KK);
const OPEN_TAKE = 3;
/** the latest take the reaction and its settle allow (the D43 budget, asserted below) */
const TAKE_BY = Math.min(CARD0 - Math.floor(45 * KK), K.s48 - Math.floor(40 * KK));
/** Review r2 D41: her last step (S9_Room's opt-in lastStepFrames) takes 13 frames on the measured timeline (KK = 1;
 *  footfalls 8, 10, 8 frames apart); with a quicker narration it shrinks with KK and gives up its extra frames to the
 *  take's budget first (the J4 chain is BLANK -> walk -> lean -> take) */
const C_LAST = C_FPS + clamp(TAKE_BY - (C_WALK0 + walkFrames(C_WALK_PLAN, C_FPS) + 1 + LEAN_OPEN + OPEN_TAKE), 0, Math.max(0, Math.round(13 * KK) - C_FPS));
const LEAN0 = C_WALK0 + walkFrames(C_WALK_PLAN, C_FPS, C_LAST) + 1;
const OPEN = LEAN0 + LEAN_OPEN;
const BUSTED = OPEN + OPEN_TAKE;
// D42: her line of sight, drawn on as she leans round the near end, reaches his face as he opens his eyes (no cross:
// nothing is in the way now; S1.1's stopped on the partition); held through the take, then it fades before his reaction
const SIGHT0 = LEAN0 + 2;
const SIGHT_OUT = Math.min(BUSTED + Math.round(14 * KK), CARD0 - 8);
const SIGHT_OUT_DUR = 8;
// D43: the take, then the reaction and a settle before the narrator and the wipe (offsets shrink with a quicker take
// window): a guilty grin, a tiny paw wave at her (S9.1's sheepish wave), the paw back down; she does one slow blink
const KR = clamp((CARD0 - BUSTED) / 52, 0.5, 1);
const rk = (n: number) => Math.round(n * KR);
const GRIN0 = BUSTED + rk(16);
const PAW0 = BUSTED + rk(18);
// review r2 N13: the paw rises and falls by way of his chest (drawn in front of the torso), 9 frames up and 10 down,
// both E.inOut; the wag is 7 frames (it was 11) so the settle keeps its frames after D41's later lean
const PAW_UP = Math.max(6, rk(9));
const WAG0 = PAW0 + PAW_UP;
const PAW_DN = Math.max(6, rk(10));
/** the paw is back on his hip by "This" (the narrator's s48) and >= 6 frames before the wipe: a quicker narration
 *  shortens the wag first, not the settle */
const SETTLE_BY = Math.min(CARD0 - 6, K.s48);
const PAW1 = Math.max(WAG0, Math.min(WAG0 + rk(7), SETTLE_BY - PAW_DN));
const SETTLE0 = PAW1 + PAW_DN; // the paw is back on his hip: he holds the guilty grin to the wipe
const C_BLINK0 = BUSTED + rk(25);
const C_BLINK_DUR = 14; // 5 closing, 3 shut, 6 opening
// D43: the take gets a reaction and a settle: >= 45 frames from the take to the wipe and >= 40 before the narrator's s48
// (57 and 48 on the measured timeline; a quicker narration scales both with KK), the paw is back down >= 6 frames
// before the wipe, her blink is over, and the sight line has faded before the wipe and after the take has landed
if (!(CARD0 - BUSTED >= Math.floor(45 * KK) && K.s48 >= BUSTED + Math.floor(40 * KK))) throw new Error(`S9: the take (${BUSTED}) needs ${Math.floor(45 * KK)} frames before the wipe (${CARD0}) and ${Math.floor(40 * KK)} before s48 (${K.s48})`);
if (!(SETTLE0 + 6 <= CARD0 && C_BLINK0 + C_BLINK_DUR <= CARD0 && SIGHT_OUT >= BUSTED + 8 && SIGHT_OUT + SIGHT_OUT_DUR <= CARD0)) throw new Error(`S9: the reaction (settle ${SETTLE0}, blink ${C_BLINK0}, sight line out ${SIGHT_OUT}) must be over before the wipe (${CARD0})`);

/* ================================================================== sound */

const GUESSER_STEPS = walkContacts(WALK0, WALK_PLAN, WALK_FPS);
const PUSH_STEPS = walkContacts(PUSH0, PUSH_PLAN, PUSH_FPS).filter((f) => f < THUNK - 2); // the last one is under the thunk
const CHECKER_STEPS = walkContacts(C_WALK0, C_WALK_PLAN, C_FPS, C_LAST);
// D41: an unhurried stroll: on the measured timeline (KK = 1) her full steps land >= 8 frames apart and the closing
// half-step >= 8 computed (walkContacts reads ~1 frame late on the last landing, so >= 7 on screen; review r2 D41); a
// quicker narration compresses both with the rest of the chain; the last lands by the lean
{
  const gaps = CHECKER_STEPS.slice(1).map((f, i) => f - CHECKER_STEPS[i]);
  const full = gaps.slice(0, -1);
  const minFull = Math.floor(8 * KK);
  const minClose = Math.floor(8 * KK);
  if (Math.min(...full) < minFull || gaps[gaps.length - 1] < minClose || CHECKER_STEPS[CHECKER_STEPS.length - 1] > LEAN0) throw new Error(`S9: her stroll's footfalls (${CHECKER_STEPS.join(', ')}) must be >= ${minFull} frames apart (closing half-step >= ${minClose}) and land by the lean (${LEAN0})`);
}
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
  // the reaction, then the settle (review r1 D43): the take holds, then a guilty grin at her (still caught: brows up,
  // the sweat drop) and a tiny paw wave (S9.1's sheepish wave, his far hand), the paw back on his hip; he holds the grin
  const guilty = tw(g, GRIN0, 6, E.inOut);
  if (guilty > 0) pose = withPose(pose, {mouth: 'grin', eyes: 1.1, pupil: 0.92, brows: 0.75, browAsym: 0.25, lid: 0.14, tilt: 4, lookX: -0.92, lookY: 0.12}, guilty);
  const paw = pawAt(g);
  if (paw > 0) {
    const wag = g >= WAG0 && g < PAW1 ? Math.sin((g - WAG0) * 0.75) * Math.min(1, (PAW1 - g) / 3) : 0;
    pose = {...pose, ...pawArm(pose.armR, paw, wag)};
  }
  const life = g < BUSTED ? 0.35 : 0.12 + 0.18 * tw(g, GRIN0, 12, E.inOut);
  return {plan: {x: HIDE.x, z: HIDE.z}, place: {...place, life}, pose, life, walk: null, view: 'front', turn: turnSquash(g, TURN_FRONT), inFront: false};
};

/** J4's paw wave (review r2 N13), 0 = fist on the hip .. 1 = raised beside his head: 9 frames up, a 7-frame wag, 10 down. */
const pawAt = (g: number) => Math.min(tw(g, PAW0, PAW_UP, E.inOut), 1 - tw(g, PAW1, PAW_DN, E.inOut));
/** The paw on his chest, halfway (rig-local, elbow down): S9.1's sneak paw. */
const PAW_CHEST = reachLocal(46, -262, 1, -1);
/** The raised paw beside his head (S9.1's sheepish wave), `wag` -1..1. */
const pawHigh = (wag: number) => reachLocal(112 + 9 * wag, -346, 1, 1);
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t)});
/** Paw-wave right arm (review r2 N13): a straight angle blend from the hip to the raised paw put the hand inside the
 *  torso outline, drawn behind it, for a frame each way (a sleeve stub with no hand). Two legs instead, hip -> chest ->
 *  raised, with the arm drawn in front of the torso while the paw is over it, up to where it is out past his shoulder
 *  (paw 0.75; S9.1's wave also draws the arm in front until it is up), and behind it once raised. */
const PAW_FRONT = 0.75;
/** his torso's half-width (rig px, arm frame) at height y, between the shoulders (76) and the waist (66 at y -150) */
const torsoEdge = (y: number) => (y < -290 ? 76 : 76 - (10 * (y + 290)) / 140);
const pawArm = (hip: Arm, paw: number, wag: number): Pick<Pose2, 'armR' | 'armsFront'> => {
  const armR = paw < 0.5 ? mixArm(hip, PAW_CHEST, paw / 0.5) : mixArm(PAW_CHEST, pawHigh(wag), (paw - 0.5) / 0.5);
  // the layer switch falls on a moving frame: the arm stays behind (as in the hands-on-hips pose) while the fist's centre
  // is still outside the torso outline at his hip, so the sleeve does not pop over his shoulder before the paw moves
  const h = handPos(armR, 1);
  const atHip = h.hy > -230 && h.hx >= torsoEdge(h.hy);
  return {armR, armsFront: paw < PAW_FRONT && !atHip ? 'R' : 'none'};
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

// The PlanCard (screen space, top right) stays >= 20 px clear of him on every frame it is up (S9.2, at H; review r2
// N12 made it 1.22x). His drawn right edge per frame, from the posed rig: both fists (hand + 20 px mitt + outline),
// both elbows (+ half the sleeve + outline), the torso's shoulder (76 + outline) and the head with ears and hair (the
// ±92 px of lib Cast2 rigCovers), through the camera of that frame; plus 4 px for the idle drift. (It replaced a flat
// 150-rig-px bound that put him ~46 px further right than he is drawn: his widest is the sneak paw's elbow, ~114 px.)
{
  const rightPx = (f: number) => {
    const tilt = RAISED_TILT * tiltAt(f, RISE0, RISE_DUR);
    const cam = camPath(f, CAM_ROOM, [{at: RISE0, dur: RISE_DUR, to: CAM_W}]);
    const gu = guesserAt(f, tilt, cam);
    const {place, pose} = gu;
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
    return worldToScreen(cam, Math.max(...xs), place.y).x + 4;
  };
  for (let f = CARD_IN; f <= CARD_OUT + CARD_OUT_DUR; f++) {
    const t = cardTAt(f);
    if (t <= 0) continue;
    const r = rightPx(f);
    if (r > cardLeftAt(t) - 20) throw new Error(`S9: at ${f} the PlanCard (left edge ${cardLeftAt(t).toFixed(0)}) would come within 20 px of him (his right edge ${r.toFixed(0)})`);
  }
}

// Review r2 N13: through J4's reaction his right hand is never drawn behind the torso while inside its outline (the
// handless sleeve stub): whenever the right arm is not in front, the hand's centre is outside the torso (rig-local:
// half-width 76 at the shoulders narrowing to 66 at the waist, y -314..-150), so at least half the fist shows; and
// the paw is back on the hip >= 6 frames before the wipe (and before "This")
{
  for (let f = BUSTED; f < CARD0; f++) {
    const p = guesserAt(f, RAISED_TILT, CAM_W).pose;
    if (p.armsFront === 'R' || p.armsFront === 'both') continue;
    const h = handPos(p.armR, 1);
    if (h.hy > -314 && h.hy < -150 && h.hx < torsoEdge(h.hy)) throw new Error(`S9: at ${f} his paw (${h.hx.toFixed(0)}, ${h.hy.toFixed(0)}) is drawn behind his torso, inside its outline`);
  }
  if (!(pawAt(SETTLE0) === 0 && SETTLE0 + 6 <= CARD0 && SETTLE0 <= K.s48)) throw new Error(`S9: the paw must be back on his hip (${SETTLE0}) >= 6 frames before the wipe (${CARD0}) and by "This" (${K.s48})`);
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
  const d = walkDistance(g, C_WALK0, C_WALK_PLAN, C_FPS, C_LAST);
  const wk = walkAt(C_WALK_PLAN, d, tilt);
  const place: RigPlace = {x: wk.x, y: wk.y, scale: wk.scale, frame: gr, seed: CHECKER_SEED, life: 0.3};
  let pose: Pose2 = {...withPose(base, face(1)), feet: wk.pose.feet, sink: wk.pose.sink, lookX: 0.9, lookY: 0.15};
  const lean = sp(g, LEAN0, SOFT);
  if (g >= LEAN0) pose = withPose(pose, {peek: 0.85, lean: 3, lookX: 1, lookY: 0.05, tilt: 2, lid: 0.4}, Math.min(1.04, lean));
  // his wave gets one slow, deadpan blink (review r1 D43); no idle blink near it
  if (g >= C_BLINK0 - 14 && g < C_BLINK0 + C_BLINK_DUR + 14) {
    const u = g - C_BLINK0;
    const open = u < 0 ? 1 : u < 5 ? 1 - E.inOut(u / 5) : u < 8 ? 0 : u < C_BLINK_DUR ? E.inOut((u - 8) / (C_BLINK_DUR - 8)) : 1;
    pose = {...pose, blink: open};
  }
  return {plan: wk.plan, place, pose, walk: wk};
};

/* ================================================================== J4: her line of sight (review r1 D42) */

/** The sight line runs from her eyes toward his and is drawn UNDER her rig (her head, hair and the pencil behind her
 *  ear cover its start, so it comes out of her silhouette and never crosses her face), over the partition and him, and
 *  stops just short of his head (outside his ear: it reaches his face, never crosses it). SIGHT_FROM: rig px from her
 *  eyes beyond which it is surely clear of her head (the load-time tests check the line from there); SIGHT_TO: rig px
 *  short of his eyes where it stops. S1.1's line stopped on the partition with a cross; this one meets nothing. */
const SIGHT_FROM = 92;
const SIGHT_TO = 80;

/** J4's sight line at frame g (world px): her eyes, his eyes, and the drawn part a -> b (fractions ua..ub of e0 -> e1). */
const sightLine = (ch: CheckerState, gu: GuesserState) => {
  const e0 = eyesWorld(ch.place, ch.pose);
  const e1 = eyesWorld(gu.place, gu.pose);
  const d = Math.hypot(e1.x - e0.x, e1.y - e0.y) || 1;
  const ua = (SIGHT_FROM * ch.place.scale) / d;
  const ub = 1 - (SIGHT_TO * gu.place.scale) / d;
  const at = (u: number) => ({x: lerp(e0.x, e1.x, u), y: lerp(e0.y, e1.y, u)});
  return {e0, e1, d, ua, ub, a: at(ua), b: at(ub)};
};

/** A world-px point on an upright figure's billboard (plan depth z) back to plan metres and height (lib/room's
 *  projection inverted at that depth). */
const billboardToPlan = (sv: ViewState, X: number, Y: number, z: number): PlanPt => {
  const dz = z - sv.pivot.z;
  return {x: sv.pivot.x + (X - sv.ax) / sv.ppm - sv.shear * dz, z, h: sv.pivot.h + (sv.floor * dz - (Y - sv.ay) / sv.ppm) / Math.max(1e-6, sv.height)};
};

// D42 hidden tests (module load). The J4 line is honest: (1) from where she stood by the sensor, the line from her eyes
// to his at HIDE is blocked by the closed partition (why she has to walk round); (2) from her lean, the 3D line from her
// eyes to his clears the closed partition in plan, no point of it is hidden by the partition as drawn (partitionHides,
// LAY_CLOSED), and the drawn part is behind neither figure (figuresHide), through the take to the fade.
{
  const sv = viewAt(RAISED_TILT);
  const ch0 = checkerAt(C_LOOK, RAISED_TILT);
  const gu0 = guesserAt(SMUG0 + 2, RAISED_TILT, CAM_W);
  const a0 = billboardToPlan(sv, eyesWorld(ch0.place, ch0.pose).x, eyesWorld(ch0.place, ch0.pose).y, ch0.plan.z);
  const b0 = billboardToPlan(sv, eyesWorld(gu0.place, gu0.pose).x, eyesWorld(gu0.place, gu0.pose).y, gu0.plan.z);
  if (!segmentBlocked(a0, b0, LAY_CLOSED)) throw new Error('S9: J4 needs the closed partition between her (by the sensor) and him at HIDE');
  for (const f of [OPEN, BUSTED, SIGHT_OUT + SIGHT_OUT_DUR - 1]) {
    const ch = checkerAt(f, RAISED_TILT);
    const gu = guesserAt(f, RAISED_TILT, CAM_W);
    const L = sightLine(ch, gu);
    const A = billboardToPlan(sv, L.e0.x, L.e0.y, ch.plan.z);
    const B = billboardToPlan(sv, L.e1.x, L.e1.y, gu.plan.z);
    if (segmentBlocked(A, B, LAY_CLOSED, 0.05)) throw new Error(`S9: at ${f} her line of sight to him meets the closed partition (plan)`);
    if (!(L.ua < L.ub - 0.15)) throw new Error(`S9: at ${f} the drawn sight line is too short (${(L.d * (L.ub - L.ua)).toFixed(0)} px)`);
    const figs = figuresHide(sv, LIGHT_H, [
      {z: ch.plan.z, place: ch.place},
      {z: gu.plan.z, place: gu.place},
    ]);
    for (let i = 0; i <= 24; i++) {
      const u = L.ua + ((L.ub - L.ua) * i) / 24;
      const p: PlanPt = {x: lerp(A.x, B.x, u), z: lerp(A.z, B.z, u), h: lerp(A.h!, B.h!, u)};
      if (partitionHides(sv, p.h!, {layout: LAY_CLOSED})(p)) throw new Error(`S9: at ${f} the sight line is drawn where the closed partition hides it (u ${u.toFixed(2)})`);
      if (figs(p)) throw new Error(`S9: at ${f} the drawn sight line passes behind a figure (u ${u.toFixed(2)})`);
    }
  }
}

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
  // J4: her line of sight draws on as she leans and reaches his face as he opens his eyes; it fades after the take
  const sightT = g >= SIGHT0 ? tw(g, SIGHT0, OPEN - SIGHT0, E.out) : 0;
  const sightOp = 1 - tw(g, SIGHT_OUT, SIGHT_OUT_DUR, E.inOut);
  const sight = sightT > 0 && sightOp > 0 ? sightLine(ch, gu) : null;

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

  // J4: her line of sight past the near end to his face (S1.1's dashed coral line), under her rig (see SIGHT_FROM)
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
  // in: the inset pops in as before (S9_Readout's E.back); out (review r1 D40): a calm shrink-and-fade (`exiting`),
  // not E.back run backwards (a swell, then a snap)
  const insetExiting = g >= (g < RT ? INSET_OUT : INSET2_OUT);
  const insetT = g < RT ? tw(g, INSET0, 12, E.out) * (1 - tw(g, INSET_OUT, INSET_OUT_DUR, E.inOut)) : tw(g, INSET2, 8, E.out) * (1 - tw(g, INSET2_OUT, 8, E.inOut));
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  const sensorScr = scr({x: (sb.x0 + sb.x1) / 2, y: (sb.y0 + sb.y1) / 2});
  // the ring links the inset to the real sensor; after the push it goes before she walks past the stand; it pops in
  // with the inset and leaves with a fade (like the inset's exit)
  const ringOut = g < RT ? tw(g, INSET_OUT, INSET_OUT_DUR, E.inOut) : tw(g, Math.min(INSET2_OUT, C_WALK0) - 6, 6, E.inOut);
  const ringIn = g < RT ? tw(g, INSET0, 12, E.out) : tw(g, INSET2, 8, E.out);
  const ringT = ringIn * (1 - ringOut);
  // the "likely location" label: in on the clue (the pop as before), out just before the inset (8 frames, a 6 % shrink
  // and a fade)
  const labelIn = g < RT ? tw(g, LIT, 10, E.out) : 0;
  const labelOut = tw(g, INSET_OUT - LABEL_LEAD, LABEL_OUT_DUR, E.inOut);
  const labelT = labelIn * (1 - labelOut);
  const chipT = Math.max(tw(g, P3_0 - 4, 8) * (1 - tw(g, ECHO_END + 8, 10)), g >= RT ? tw(g, PULSE2 - 2, 6) * (1 - tw(g, sched2[0].end + 10, 8)) : 0);
  const blobShown = g < RT ? blobT : 1;
  const insetLit = g < RT ? clamp01((g - LIT) / 18) : 0;
  const cardT = cardTAt(g);
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
          <circle
            cx={f2(sensorScr.x)}
            cy={f2(sensorScr.y)}
            r={f2(Math.max(0, 50 * cam.zoom * (ringOut > 0 ? 0.94 + 0.06 * (1 - ringOut) : E.back(clamp01(ringIn)))))}
            fill="none"
            stroke={C.teal}
            strokeWidth={5}
            opacity={ringOut > 0 ? f2(1 - ringOut) : 1}
          />
        </svg>
      )}
      {cardT > 0 && (
        <PlanCard
          x={CARD.x}
          y={CARD.y}
          t={cardT}
          area={S9_CARD_AREA}
          view={CARD_VIEW}
          layout={lay}
          checker={{...ch.plan, facing: 85}}
          guesser={{...gu.plan, facing: -90}}
          sensor={{firing}}
          gap={gapT}
          light={(tp) =>
            g >= P3_0 && (
              <>
                <ScatterFan asGroup origin={W3} dirs={DIRS_W} length={0.55} toPx={tp} t={tw(g, VF3[1], 12)} release={tw(g, VF3[1] + 14, 16)} layout={OLAYOUT} seed={5} width={3.5 * S9_CARD_K} />
                <ScatterFan asGroup origin={W4} dirs={DIRS_W} length={0.5} toPx={tp} t={tw(g, VF4[1], 12)} release={tw(g, VF4[1] + 14, 16)} layout={OLAYOUT} seed={7} width={3 * S9_CARD_K} />
                <ScatterFan asGroup origin={H} dirs={DIRS_H3} length={0.55} toPx={tp} t={tw(g, VF3[2], 10)} release={tw(g, VF3[2] + 12, 14)} layout={OLAYOUT} seed={8} width={3 * S9_CARD_K} color={C.saffron} />
                <LightPath asGroup points={PATH3} toPx={tp} t={SCHED3.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={CARD_LIGHT_W} pulseRadius={11 * S9_CARD_K} lane={CARD_LANE} ringRadius={34 * S9_CARD_K} />
                <LightPath asGroup points={PATH4} toPx={tp} t={SCHED4.progress(g)} pulses={3} pulseGap={0.09} intensityFalloff={0.6} layout={OLAYOUT} width={CARD_LIGHT_W} pulseRadius={11 * S9_CARD_K} lane={CARD_LANE} ringRadius={34 * S9_CARD_K} />
              </>
            )
          }
          marks={(tp) =>
            g >= P3_0 && (
              <>
                <PlanSpot {...tp(W3)} t={tw(g, VF3[1] - 2, 8)} r={9 * S9_CARD_K} />
                <PlanSpot {...tp(W4)} t={tw(g, VF4[1] - 2, 8)} r={9 * S9_CARD_K} />
              </>
            )
          }
        />
      )}
      <ReadoutInset x={INSET.x} y={INSET.y} w={INSET.w} h={INSET.h} t={insetT} exiting={insetExiting} field={FIELD} blob={blobShown * (1 - blinkOff)} lit={insetLit} blank={insetBlank} led={g >= BLANK && g >= RT ? 0 : 1} occZ0={lay.occluder.z0} />
      {labelT > 0 && (
        <div
          style={{
            position: 'absolute',
            left: INSET.x + INSET.w / 2,
            top: INSET.y + INSET.h + LABEL_GAP,
            transform: `translateX(-50%) scale(${f2(labelOut > 0 ? 1 - 0.06 * labelOut : E.back(clamp01(labelIn)))})`,
            transformOrigin: '50% 0',
            opacity: labelOut > 0 ? f2(1 - labelOut) : 1,
          }}
        >
          <Pill tone="teal" size={44}>
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

/** The magnified readout's place (screen px): upper left, over the plant and the left wall, inside the 5 % safe margin
 *  (review r1 D44: it was {96, 28, 420, 386}, its bezel 26 px above the y 54 line). At CAM_W, the only framing it is
 *  shown in, the plant's highest leaf tip is at y ~286, well under the bezel's top (the old note's "y ≈ 38" was
 *  stale), so no leaf pokes out over it. Its bottom edge (y 414) is unchanged. */
const INSET = {x: 100, y: 56, w: 416, h: 358};
/** gap between the inset's bottom edge and the "likely location" label */
const LABEL_GAP = 22;
/** the "seen from above" card's plan framing in S9_CARD_AREA (the default PLAN_VIEW, scaled to that area) */
const CARD_VIEW = viewForArea(PLAN_VIEW, S9_CARD_AREA);
/** the card's main light stroke (px): 6 px at the default card scaled with it (6.5 px) still read thin at phone size
 *  (0.4 scale), so 8 px, as review r2 N12 allows; the out-and-back lanes open up with it (14 px apart, a 6 px gap) */
const CARD_LIGHT_W = 8;
const CARD_LANE = 14;

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
