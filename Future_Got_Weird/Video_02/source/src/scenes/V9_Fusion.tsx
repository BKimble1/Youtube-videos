import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, segEnd} from '../lib/timeline';
import {E, SNAP, drop, hop, impact, kf, ring, sp, tw} from '../lib/motion';
import type {Cam} from '../lib/camera';
import {CAM_PLAN_ACT} from '../lib/shots';
import {LAYOUT, lerpP, possibleCloud, type P2} from '../lib/optics';
import {EXPR, IDLE2, withPose, type Pose2} from '../components/v02/Cast2';
import {FULL_GEO, bandsFor, lerpGeo, planToScreen, type PanelGeo} from '../components/v02/S6_PlanView';
import {LongExposurePhoto} from '../components/v02/S6_Photo';
import {Chip, SubLabel, TeachLabel} from '../components/v2k/Labels';
import {TRACK_GEOM} from '../components/v2k/RealTrackBoard';
import {
  AIM_A,
  AIM_B,
  BANDS_F1,
  BANDS_F2,
  CLOUD_A,
  CLOUD_AB,
  CLOUD_TRACK,
  HA,
  HB,
  HD,
  HW1,
  JIG_DEG,
  LOOPS_A,
  P,
  PF_FINAL,
  PlanStage,
  SA,
  SB,
  SMEAR2,
  SMEAR4,
  SMEAR_LEVELS,
  SMEAR4_LEVELS,
  SMEAR_MIN_AREA,
  TOKEN_PX,
  TRACK,
  WA,
  WB,
  WJ,
  aimTurned,
  pfDots,
  spotsTurned,
  type PlanState,
} from '../components/v2s/V9_Plan';
import {MiniTimeline, UCard, UnknownIcons, type UnknownState} from '../components/v2s/V9_Icons';
import {V9Inset} from '../components/v2s/V9_Inset';

/**
 * V9 · Motion-aware fusion (n19–n23), v2/SHOTPLAN_V2.md V9. Our room's plan (I1, illustrative), one change at a time.
 *
 *  V9.1 n19  The V8 hand-off frame (full-frame plan at CAM_PLAN_ACT: sensor on its stand at frame A, his token at H_A,
 *            chip "illustration" top-left). Face inset: he grins (his plan: keep moving). Frame 1: the sensor fires, the
 *            four listening spots light, a dashed route S → W1 → him and a mini timeline at the plan's lower edge (teal
 *            wall echo, his saffron echo). "He steps": the token steps H_A → H_B; on "shifts" his tick slides later,
 *            a dashed ghost where it was; "he moves → echo shifts" (48). Then the sensor head jiggles on its stand and
 *            settles turned 5°: its four spots slide to new wall places (dashed ghosts at the old ones); "sensor moves →
 *            spots move" (48).
 *  V9.2 n20  "Just add them up": frame 1's bands (round the old spots, through H_A, ghost token) and frame 2's (round
 *            the new spots, through H_B) stack; on "blur" they become one coral streak covering both (plain stacking of
 *            the 8 bands, ≈ 0.86 m long, measured at load); "just adding → smear" (48) · "illustrative" (30). On "long
 *            exposure", 1 s: the S6_Photo snapshot of the guesser mid-walk. The inset grin widens on "smear".
 *  V9.3 n21  Cut: three large icons "shape" · "position" · "sensor"; padlocks close on position and sensor (shape free),
 *            then position's lock opens and one drops on shape (position free); "one unknown at a time" (64).
 *  V9.4 n22  Cut: one full-frame plan, framed on CAM_F (V9.5's framing, so the cut on "person" keeps the room in place).
 *            A still object (a box) behind the partition, the long patch from frame A's
 *            bunched spots. The sensor rides a rail from frame A to frame B1 (no hand; a dashed ghost stays at A);
 *            "object still", "sensor on a rail, at known positions" (48). B1's spots appear and the patch shrinks
 *            about 30% (measured at load; a dashed outline of the old patch stays). On "the U": a framed thumbnail
 *            card of the real U board, header "Real data · same 3×3 sensor", top-right, 1.5 s.
 *  V9.5 n23  Cut on "person" (same framing), sensor on its stand. Frame 1 fires; its region (dashed) shows round him
 *            and the guesses (teal dots) are seeded inside it; he
 *            walks H_A → H_B → H_C → H_D; each frame the guesses drift, the misses fade, the survivors are copied, and
 *            the cloud follows him. "sensor still · person moves" (48); chip "handheld: shown only for locating the
 *            sensor itself (reported)" (30). Then two panels, one at a time: left alone 1 s "just adding → smear" (the
 *            four frames stacked), then right "tracking what moved → keeps up" (the guesses round his new position).
 *            Inset: he grins at the smear, deflates on "keeps up". The right panel grows to full frame, landing on
 *            CAM_F, where the sensor marker, wall line and partition sit where the kit's RealTrackBoard puts them in
 *            V10.1 (asserted at load, ±10 px): the match cut to the real data.
 */

/* ================================================================== cues */

const SC = scene('V9');
const K = {
  start: SC.from,
  end: SC.to,
  // n19
  catch: at('n19', 'catch'),
  things: at('n19', 'things'),
  move19: at('n19', 'move'),
  between: at('n19', 'between'),
  steps: at('n19', 'steps'),
  echo: at('n19', 'echo'),
  shifts: at('n19', 'shifts'),
  sensor19: at('n19', 'sensor'),
  jiggles: at('n19', 'jiggles'),
  spots19: at('n19', 'spots'),
  land: at('n19', 'land'),
  // n20
  just: at('n20', 'Just'),
  add: at('n20', 'add'),
  up: at('n20', 'up'),
  different: at('n20', 'different'),
  places: at('n20', 'places'),
  blur: at('n20', 'blur'),
  smear: at('n20', 'smear'),
  long: at('n20', 'long'),
  walking: at('n20', 'walking'),
  // n21
  so: at('n21', 'So'),
  model: at('n21', 'model'),
  solves: at('n21', 'solves'),
  one21: at('n21', 'one'),
  unknown: at('n21', 'unknown'),
  // n22
  to22: at('n22', 'To'),
  shape22: at('n22', 'shape'),
  object22: at('n22', 'object'),
  still22: at('n22', 'still'),
  step22: at('n22', 'step'),
  known: at('n22', 'known'),
  spreading: at('n22', 'spreading'),
  listening22: at('n22', 'listening'),
  the22: at('n22', 'the', 3),
  U: at('n22', 'U'),
  n22end: segEnd('n22'),
  // n23
  person: at('n23', 'person'),
  hold23: at('n23', 'hold'),
  still23: at('n23', 'still'),
  let: at('n23', 'let'),
  match: at('n23', 'match'),
  estimate: at('n23', 'estimate'),
  keeps: at('n23', 'keeps'),
  instead: at('n23', 'instead'),
};

/* ---------------------------------------------------------------- shot boundaries */
const CUT_ICONS = K.so - 2; // V9.2 → V9.3
const CUT_RAIL = K.to22 - 2; // V9.3 → V9.4
/** the U card: in on "the U", 1.5 s, and V9.5 cuts in as it ends (on "person") */
const CARD_IN = K.the22;
const CUT_WALK = Math.max(K.n22end + 6, Math.min(CARD_IN + 45, K.person));
/** V9.5's comparison: left panel alone for 1 s, then the right one, then the right grows to full frame */
const PANELS = K.match + 6;
const RIGHT_IN = Math.min(PANELS + 30, K.keeps - 4);
const GROW0 = Math.max(RIGHT_IN + 34, K.instead);
const GROW_DUR = Math.max(16, Math.min(26, K.end - 9 - GROW0));
if (!(CUT_ICONS < CUT_RAIL && CUT_RAIL < CARD_IN && CARD_IN < CUT_WALK && CUT_WALK < PANELS && PANELS < RIGHT_IN && RIGHT_IN < GROW0 && GROW0 + GROW_DUR <= K.end - 6))
  throw new Error(`V9: shot boundaries out of order (${[CUT_ICONS, CUT_RAIL, CARD_IN, CUT_WALK, PANELS, RIGHT_IN, GROW0, GROW0 + GROW_DUR, K.end].join(', ')})`);

/* ---------------------------------------------------------------- V9.1 timing */
const INSET1 = K.catch + 4; // he grins at "the catch": his plan is to keep moving
const FRAME1 = K.between; // frame 1: the sensor fires
const TL_IN = FRAME1;
const STEP0 = K.steps - 4;
const STEP_DUR = 10;
const FRAME2 = K.echo - 4; // frame 2 fires as he lands
const SLIDE_TICK = K.shifts - 4;
const ECHO_OUT = K.sensor19 - 6; // the echo demo fades as the sensor demo starts
const JIG0 = K.jiggles;
const SPOTS_LBL = K.spots19;
const FRAME3 = K.land - 2; // the spots fire where they landed
if (!(STEP0 + STEP_DUR + 4 <= FRAME2 + 4 && SLIDE_TICK + 12 < ECHO_OUT && ECHO_OUT + 8 <= JIG0)) throw new Error('V9.1: beats overlap');

/* ---------------------------------------------------------------- V9.2 timing */
const F1_IN = K.just;
const F2_IN = K.up; // "add them up": frame 2's bands stack onto frame 1's
const BLUR0 = K.blur - 2;
const PHOTO0 = K.long - 3;
const PHOTO_OUT = Math.min(PHOTO0 + 33, CUT_ICONS - 12);

/* ---------------------------------------------------------------- V9.3 timing */
const LOCK1 = [0, K.model + 4, K.solves]; // (shape free) position, sensor locks land
const UNLOCK = K.one21 - 3; // position's lock opens and lifts
const LOCK2 = K.unknown; // a lock lands on shape
const TITLE3 = K.one21 - 2;

/* ---------------------------------------------------------------- V9.4 timing */
const FRAME_A = K.shape22; // frame A fires: the long patch from its bunched spots
const SLIDE0 = K.step22 + 2;
const SLIDE_DUR = Math.max(16, Math.min(34, K.known - SLIDE0));
const SPOTS_B = K.spreading + 2;
const TIGHT0 = Math.max(SPOTS_B + 14, K.listening22);
const TIGHT_DUR = Math.max(14, Math.min(26, CARD_IN - 6 - TIGHT0));

/* ---------------------------------------------------------------- V9.5 timing */
const WALK0 = K.let;
const WALK_END = K.match + 2;
const PER = (WALK_END - WALK0) / 3;
const STEP_T = [0, 1, 2].map((k) => Math.round(WALK0 + k * PER));
const PF_DELAY = 8; // the guesses start moving this long after he lands
const PF_DUR = Math.max(16, Math.round(PER) - 12);
if (!(PER >= 26)) throw new Error(`V9.5: ${PER.toFixed(1)} frames per step is too short for step, drift, check and copy`);
const LBL5 = K.still23;
const FIRE5 = K.person; // frame 1 of the walk: the sensor fires, its region (dashed) shows round him
const DOTS_IN = FIRE5 + 8; // the guesses fill that region
const REGION0_OUT = WALK0 - 8; // frame 1's region goes as he starts walking
const INSET2 = PANELS + 12;
const DEFLATE = K.keeps;
const INSET2_OUT = GROW0 - 12;

/* ================================================================== framings */

/**
 * CAM_F: the V9.4–V9.5 plan framing, set so the V10 kit board's sensor marker, wall line and partition land where
 * RealTrackBoard puts them (TRACK_GEOM, column 0, no push): the wall (z = 0) on y 200 and S_A on the marker's row
 * (y 610), at 410 px / 0.9 m. Our sensor-to-partition distance (0.35 m = 159 px) is 9 px longer than the kit plot's
 * (150 px), so the frame is shifted left by half of that: the sensor lands about 4.7 px left of the kit marker and the
 * partition's centre line about 4.7 px right of the kit's line, instead of 0 and 9.4 (the coral line is the element
 * the eye follows across the cut). Our partition starts 0.65 m from the wall and the kit plots it at 0.65 m with K 500,
 * so with the sensor and wall matched its top end sits about 29 px higher; no single scale fixes that.
 */
const F_PPM = (TRACK_GEOM.sensor.y - TRACK_GEOM.wallY) / SA.z;
const X_BAL = ((LAYOUT.occluder.x - SA.x) * F_PPM - (TRACK_GEOM.partition.x - TRACK_GEOM.sensor.x)) / 2;
const CAM_F: Cam = (() => {
  const zoom = F_PPM / 240;
  // plan world px of S_A: (960 + 240·(x − 2), 540 + 240·(z − 1.5)); worldToScreen: 960 + (wx − 960)·z + (960 − cx)·z
  const wx = 960 + 240 * (SA.x - 2);
  const wy = 540 + 240 * (SA.z - 1.5);
  const sx = TRACK_GEOM.sensor.x - X_BAL;
  return {cx: 960 - (sx - 960 - (wx - 960) * zoom) / zoom, cy: 540 - (TRACK_GEOM.sensor.y - 540 - (wy - 540) * zoom) / zoom, zoom};
})();
/** where the V9 → V10 match lands (asserted against the kit board's geometry, ±10 px) */
export const V9_MATCH = (() => {
  const s = planToScreen(FULL_GEO, CAM_F, SA);
  const wall = planToScreen(FULL_GEO, CAM_F, P(SA.x, 0));
  const partNear = planToScreen(FULL_GEO, CAM_F, P(LAYOUT.occluder.x - LAYOUT.occluder.thickness / 2, LAYOUT.occluder.z0));
  const partMid = planToScreen(FULL_GEO, CAM_F, P(LAYOUT.occluder.x, LAYOUT.occluder.z0));
  const r = {sensor: s, wallY: wall.y, partitionNearX: partNear.x, partitionMidX: partMid.x, partitionTopY: partNear.y};
  const bad: string[] = [];
  if (Math.hypot(s.x - TRACK_GEOM.sensor.x, s.y - TRACK_GEOM.sensor.y) > 10) bad.push(`sensor (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
  if (Math.abs(wall.y - TRACK_GEOM.wallY) > 10) bad.push(`wall y ${wall.y.toFixed(1)}`);
  if (Math.abs(partNear.x - TRACK_GEOM.partition.x) > 10 || Math.abs(partMid.x - TRACK_GEOM.partition.x) > 10) bad.push(`partition x ${partNear.x.toFixed(1)}..${partMid.x.toFixed(1)}`);
  if (bad.length) throw new Error(`V9 → V10 match: ${bad.join('; ')} off the kit board's geometry by more than 10 px`);
  return r;
})();

/** V9.5 panels (screen px): each is a crop of the CAM_F frame at full scale (x 300–1140, y 152–712: sensor and stand,
 *  wall, partition, his whole walk); the right one grows back to the full frame by uncropping. */
const PANEL_CROP = {x: 300, y: 152, w: 840, h: 560};
const panelGeo = (x: number): PanelGeo => ({x, y: 200, w: PANEL_CROP.w, h: PANEL_CROP.h, tx: x - PANEL_CROP.x, ty: 200 - PANEL_CROP.y, s: 1, radius: 22, border: 1});
const GEO_L = panelGeo(96);
const GEO_R = panelGeo(984);

/* ================================================================== helpers */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a 0 → 1 → 0 flash for a sensor firing at f0 */
const flash = (g: number, f0: number, dur = 10) => (g < f0 || g > f0 + dur ? 0 : Math.sin(((g - f0) / dur) * Math.PI));
const tokenScreenR = (cam: Cam, s = 1) => (TOKEN_PX / 2) * cam.zoom * s;

/** The illustration chip, top-left (the V8 hand-off frame has it in the same place); a paper backing hides the plan's
 *  wall ruler tick under it (v1 D27). */
const IllustrationChip: React.FC<{t?: number}> = ({t = 1}) =>
  t <= 0.001 ? null : (
    <>
      <div style={{position: 'absolute', left: 90, top: 38, width: 236, height: 76, background: C.paper, opacity: t}} />
      <Chip x={96} y={54} size={30} opacity={t}>
        illustration
      </Chip>
    </>
  );

/* ================================================================== the guesser's face (insets) */

const GRIN: Partial<Pose2> = {...EXPR.smug, mouth: 'grin', lid: 0.42, lookX: -0.35, lookY: 0.05};

const face1 = (g: number): {pose: Pose2; lean: number; bob: number} => {
  let p: Pose2 = withPose(IDLE2, GRIN);
  // he glances at his own echo as it slides, then back
  p = withPose(p, {lookX: -0.6, lookY: 0.45}, tw(g, SLIDE_TICK, 8) * (1 - tw(g, ECHO_OUT, 10)));
  // "smear": the grin widens
  const wide = tw(g, K.smear - 2, 8);
  p = withPose(p, {lid: 0.62, brows: -0.35, browAsym: 0.9, tilt: 9, lookX: -0.2, lookY: 0}, wide);
  return {pose: {...p, bob: hop(g, K.smear - 2, 10, 8)}, lean: 1, bob: 0};
};

const face2 = (g: number): {pose: Pose2; lean: number} => {
  let p: Pose2 = withPose(IDLE2, {...GRIN, lookX: -0.5, lookY: 0.2});
  const d = tw(g, DEFLATE - 2, 10);
  p = withPose(p, {mouth: 'frown', lid: 0.28, eyes: 1.05, brows: 0.55, browAsym: 0, tilt: -5, lookX: -0.15, lookY: 0.4, hunch: 0.14, sweat: 0.6}, d);
  return {pose: {...p, bob: hop(g, DEFLATE - 2, 10, -6)}, lean: 1 - d};
};

/* ================================================================== V9.1 + V9.2 · the motion problem, the smear */

/** The head's turn (deg) at g: a jiggle (decaying wobble) that settles at JIG_DEG. */
const headDeg = (g: number) => JIG_DEG * tw(g, JIG0, 16, E.out) + 7 * ring(g, JIG0, 1.0, 0.13);

const stateMotion = (g: number): PlanState => {
  const deg = headDeg(g);
  const spotsNow = deg === 0 ? WA : spotsTurned(deg);
  // a small weight shift back (anticipation), then the step, landing with a hair of settle
  const step = kf(g, [[STEP0 - 5, 0], [STEP0, -0.1, E.inOut], [STEP0 + STEP_DUR, 1.03, E.inOut], [STEP0 + STEP_DUR + 5, 1, E.inOut]]);
  const him = lerpP(HA, HB, step);
  const routeT = tw(g, FRAME1 + 4, 10) * (1 - tw(g, ECHO_OUT, 8));
  const f1 = tw(g, F1_IN, 8);
  const f2 = tw(g, F2_IN, 8);
  const smear = tw(g, BLUR0, 18, E.inOut);
  return {
    sensor: SA,
    aim: aimTurned(deg),
    firing: Math.max(flash(g, FRAME1), flash(g, FRAME2), flash(g, FRAME3)),
    fov: {deg, t: tw(g, FRAME1, 8) * (1 - tw(g, F1_IN, 10))},
    stand: 1,
    // the four listening spots: saffron while listening (distinct from the dashed ghosts of where they were), larger
    // than elsewhere so their slide reads at phone size; they brighten when a frame fires
    spots: spotsNow.map((p, i) => ({p, t: tw(g, FRAME1 + 2 + 2 * i, 8), active: Math.max(0.6, 0.9 * Math.max(flash(g, FRAME1 + 2, 12), flash(g, FRAME2 + 2, 12), flash(g, FRAME3 + 2, 12)))})),
    spotSize: 10,
    ghostSpots: WA.map((p) => ({p, t: tw(g, JIG0 + 2, 6)})),
    spotArrows: WA.map((p, i) => ({from: p, to: WJ[i], t: tw(g, JIG0 + 18, 8) * (1 - tw(g, F1_IN + 4, 8))})),
    guesser: him,
    // "things move": he shifts his weight from foot to foot (a couple of small turns), then steps
    guesserFacing: -90 + 13 * ring(g, K.move19 - 2, 0.42, 0.075),
    ghostToken: {p: HA, t: 0.9 * f1},
    // "different places": where each frame's bands cross (frame 1: H_A, frame 2: H_B), gone into the smear
    marks: [
      {p: HA, t: sp(g, K.different - 2, SNAP) * (1 - tw(g, BLUR0 + 6, 10))},
      {p: HB, t: sp(g, K.places - 2, SNAP) * (1 - tw(g, BLUR0 + 6, 10))},
    ],
    route: {W: WA[0], H: him, t: routeT},
    bands: [
      {specs: BANDS_F1, opacity: f1 * lerp(1, 0.4, smear), fill: 0.22, around: HA, half: 0.5},
      {specs: BANDS_F2, opacity: f2 * lerp(1, 0.4, smear), fill: 0.22, around: HB, half: 0.5},
    ],
    clouds: [{field: SMEAR2, t: smear, tone: 'coral', levels: SMEAR_LEVELS, minArea: SMEAR_MIN_AREA}],
  };
};

const ShotMotion: React.FC<{g: number}> = ({g}) => {
  const st = stateMotion(g);
  // inset (V9.1 → V9.2)
  const INS = {cx: 1650, cy: 310, r: 140};
  const open = sp(g, INSET1, SNAP);
  const f = face1(g);
  const tok = planToScreen(FULL_GEO, CAM_PLAN_ACT, st.guesser ?? HA);
  // mini timeline
  const tlT = tw(g, TL_IN, 8) * (1 - tw(g, ECHO_OUT, 8));
  const echoLbl = tw(g, K.shifts, 6, E.linear) * (1 - tw(g, ECHO_OUT, 8));
  const spotsLbl = tw(g, SPOTS_LBL, 6, E.linear) * (1 - tw(g, F1_IN - 4, 8));
  const smearLbl = tw(g, K.smear, 6, E.linear);
  // the photo gag
  const photoIn = sp(g, PHOTO0, SNAP);
  const photoOut = tw(g, PHOTO_OUT, 8, E.in);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage geo={FULL_GEO} cam={CAM_PLAN_ACT} state={st} />
      <IllustrationChip />
      <MiniTimeline t={tlT} wall={tw(g, TL_IN + 8, 8)} his={tw(g, TL_IN + 14, 6)} tick={tw(g, SLIDE_TICK, 12, E.inOut)} ghost={tw(g, SLIDE_TICK + 2, 6)} />
      <SubLabel x={110} y={766} opacity={echoLbl}>
        he moves → echo shifts
      </SubLabel>
      <SubLabel x={110} y={790} opacity={spotsLbl}>
        sensor moves → spots move
      </SubLabel>
      <SubLabel x={980} y={772} opacity={smearLbl}>
        just adding → smear
      </SubLabel>
      <Chip x={980} y={798} size={30} opacity={tw(g, K.smear + 4, 6, E.linear)}>
        illustrative
      </Chip>
      <V9Inset cx={INS.cx} cy={INS.cy} r={INS.r} open={open} frame={g} pose={f.pose} lean={f.lean} tail={{x: tok.x, y: tok.y, r: tokenScreenR(CAM_PLAN_ACT)}} />
      {photoIn > 0 && photoOut < 1 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${photoOut * 120}px)`, opacity: 1 - photoOut}}>
          <LongExposurePhoto x={420} y={640} rot={-4} t={photoIn} frame={g} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ================================================================== V9.3 · one unknown at a time */

const lockState = (g: number, land: number, unlock?: number): Pick<UnknownState, 'lockDrop' | 'lockShut' | 'lockT' | 'squash'> => {
  if (land <= 0 || g < land - 10) return {lockDrop: -60, lockShut: 0, lockT: 0};
  const dropY = drop(g, land, 70, 8);
  const shut = tw(g, land + 1, 3, E.out);
  let lockT = tw(g, land - 10, 4, E.linear);
  let lift = 0;
  let open = 0;
  if (unlock !== undefined && g >= unlock) {
    open = tw(g, unlock, 4, E.out);
    lift = -90 * tw(g, unlock + 3, 8, E.in);
    lockT *= 1 - tw(g, unlock + 5, 6, E.linear);
  }
  return {lockDrop: dropY + lift, lockShut: shut * (1 - open), lockT, squash: impact(g, land, 0.14, 9)};
};

const ShotIcons: React.FC<{g: number}> = ({g}) => {
  const freeShape = tw(g, LOCK1[2] + 3, 6) * (1 - tw(g, UNLOCK, 5));
  const freePos = tw(g, LOCK2 + 2, 6);
  const states: UnknownState[] = [
    {t: 1, ...lockState(g, LOCK2), free: freeShape, hop: hop(g, LOCK1[2] + 3, 10, 10)},
    {t: 1, ...lockState(g, LOCK1[1], UNLOCK), free: freePos, hop: hop(g, LOCK2 + 2, 10, 10)},
    {t: 1, ...lockState(g, LOCK1[2]), free: 0},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <UnknownIcons states={states} />
      <TeachLabel x={960} y={210} anchor="middle" opacity={tw(g, TITLE3, 6, E.linear)}>
        one unknown at a time
      </TeachLabel>
    </AbsoluteFill>
  );
};

/* ================================================================== V9.4 · build a shape: object still, sensor on a rail */

const B_ROW_Z = 0.1; // B1's diamonds sit a row below the wall line: A and B1 share spots at x ≈ 1.55–1.58 and 1.76 m

const stateRail = (g: number): PlanState => {
  const slide = tw(g, SLIDE0, SLIDE_DUR, E.inOut);
  const tight = tw(g, TIGHT0, TIGHT_DUR, E.inOut);
  const hwB = lerp(0.6, HW1, tight);
  const bandsB = bandsFor(WB, HA, HW1);
  const field = tight <= 0 ? CLOUD_A : tight >= 1 ? CLOUD_AB : possibleCloud({x0: 2.15, x1: 3.2, z0: 0.3, z1: 1.35, step: 0.008}, [...bandsFor(WA, HA, HW1), ...bandsB.map((b) => ({...b, halfWidth: hwB}))]);
  const bFire = flash(g, SPOTS_B - 2, 12);
  // frame A: on "shape" the sensor fires at A, its spots light, and its bands and the long patch come in
  const aFire = flash(g, FRAME_A, 12);
  const aIn = tw(g, FRAME_A + 3, 10);
  return {
    sensor: lerpP(SA, SB, slide),
    aim: lerpP(AIM_A, AIM_B, slide),
    firing: Math.max(aFire, bFire),
    rail: 1,
    carriage: true,
    sensorGhost: {at: SA, aim: AIM_A, t: 0.8 * tw(g, SLIDE0 + 6, 8)},
    spotSize: 10,
    spots: [
      ...WA.map((p) => ({p, t: 1, active: Math.max(0.35, flash(g, FRAME_A + 2, 12))})),
      ...WB.map((p, i) => ({p: P(p.x, B_ROW_Z), t: tw(g, SPOTS_B + 3 * i, 8), active: 1, tone: 'teal' as const})),
    ],
    box: 1,
    bands: [
      {specs: bandsFor(WA, HA, HW1), opacity: 0.7 * aIn, fill: 0.2, around: HA, half: 0.5},
      {specs: bandsB, opacity: tw(g, SPOTS_B + 6, 12), fill: 0.2, tone: 'teal', around: HA, half: 0.5},
    ],
    clouds: [{field, t: aIn, tone: 'teal'}],
    ghostLoops: {loops: LOOPS_A, t: 0.85 * tw(g, TIGHT0 + 6, 8)},
  };
};

/** V9.4 is framed on CAM_F, the framing V9.5 walks in and V9 ends on, so the cut on "person" keeps the room in place
 *  (rail and box out, stand and person in) instead of jumping the whole plan sideways. */
const BOX_PX = planToScreen(FULL_GEO, CAM_F, HA);
/** above the rail, under the wall spots, and above the partition's top end (y 496), which the second line would
 *  otherwise crowd: the room left of the partition is only 470 px wide in this framing */
const RAIL_LBL = {x: 110, y0: 402, dy: 58};
const ShotRail: React.FC<{g: number}> = ({g}) => {
  const railLbl = tw(g, K.known, 6, E.linear);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage geo={FULL_GEO} cam={CAM_F} state={stateRail(g)} />
      <IllustrationChip />
      <SubLabel x={BOX_PX.x + 84} y={BOX_PX.y + 18} opacity={tw(g, K.object22, 6, E.linear)}>
        object still
      </SubLabel>
      {/* 48 px on two lines (one line would cross the partition) */}
      <SubLabel x={RAIL_LBL.x} y={RAIL_LBL.y0} opacity={railLbl}>
        sensor on a rail,
      </SubLabel>
      <SubLabel x={RAIL_LBL.x} y={RAIL_LBL.y0 + RAIL_LBL.dy} opacity={railLbl}>
        at known positions
      </SubLabel>
      <UCard t={tw(g, CARD_IN, 5, E.linear)} dy={-10 * (1 - tw(g, CARD_IN, 7, E.out))} />
    </AbsoluteFill>
  );
};

/* ================================================================== V9.5 · follow a person: sensor still, guesses drift */

/** progress of the guesses (0..3) and his position at g */
const walkU = (g: number) => STEP_T.reduce((u, t0) => u + tw(g, t0 + PF_DELAY, PF_DUR, E.linear), 0);
const himAt = (g: number): P2 => {
  let p = TRACK[0];
  STEP_T.forEach((t0, k) => {
    const s = tw(g, t0, 10, E.inOut);
    if (s > 0) p = lerpP(TRACK[k], TRACK[k + 1], s);
  });
  return p;
};
/** within step k: the check phase (the new frame's region shows, the misses fade) */
const checkT = (g: number, k: number) => {
  const t0 = STEP_T[k] + PF_DELAY + Math.round(0.3 * PF_DUR);
  return tw(g, t0 - 2, 5) * (1 - tw(g, t0 + Math.round(0.55 * PF_DUR), 8));
};
const checkFrame = (k: number) => STEP_T[k] + PF_DELAY + Math.round(0.3 * PF_DUR) - 2;

const stateWalk = (g: number): PlanState => {
  const u = walkU(g);
  // frame 1 (on "person"): its region round him, dashed; the guesses are seeded inside it, then it goes as he walks
  const region0 = {field: CLOUD_TRACK[0], t: tw(g, FIRE5 + 3, 6) * (1 - tw(g, REGION0_OUT, 8)), tone: 'teal' as const, levels: [0.25, 0.6] as [number, number], dashed: true};
  const regions = [region0, ...[0, 1, 2].map((k) => ({field: CLOUD_TRACK[k + 1], t: checkT(g, k), tone: 'teal' as const, levels: [0.25, 0.6] as [number, number], dashed: true}))];
  const him = himAt(g);
  const left = STEP_T.filter((t0) => g >= t0).length;
  const fires = [FIRE5, ...[0, 1, 2].map((k) => checkFrame(k))];
  return {
    sensor: SA,
    aim: AIM_A,
    stand: 1,
    firing: Math.max(...fires.map((f) => flash(g, f))),
    spots: WA.map((p) => ({p, t: 1, active: 0.75 * Math.max(0.35, ...fires.map((f) => flash(g, f + 2, 12)))})),
    guesser: him,
    crumbs: {path: [...TRACK.slice(0, left), him], dots: TRACK.slice(0, left), t: tw(g, STEP_T[0] + 2, 6)},
    clouds: regions,
    dots: pfDots(u).map((d, i) => ({...d, t: d.t * tw(g, DOTS_IN + (i % 14) * 1.3, 6)})),
  };
};

const stateSmearPanel = (): PlanState => ({
  sensor: SA,
  aim: AIM_A,
  stand: 1,
  spots: WA.map((p) => ({p, t: 1, active: 0.35})),
  guesser: HD,
  bands: TRACK.map((H) => ({specs: bandsFor(WA, H, HW1), opacity: 0.35, fill: 0.16, around: H, half: 0.55})),
  clouds: [{field: SMEAR4, t: 1, tone: 'coral', levels: SMEAR4_LEVELS, minArea: SMEAR_MIN_AREA}],
});

const stateKeepsUp = (): PlanState => ({
  sensor: SA,
  aim: AIM_A,
  stand: 1,
  spots: WA.map((p) => ({p, t: 1, active: 0.35})),
  guesser: HD,
  crumbs: {path: TRACK, dots: TRACK.slice(0, 3), t: 1},
  clouds: [{field: CLOUD_TRACK[3], t: 1, tone: 'teal', levels: [0.25, 0.6], dashed: true}],
  dots: PF_FINAL.map((p) => ({p, t: 1})),
});

const ShotWalk: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: C.paper}}>
    <PlanStage geo={FULL_GEO} cam={CAM_F} state={stateWalk(g)} />
    <IllustrationChip />
    <SubLabel x={640} y={812} opacity={tw(g, LBL5, 6, E.linear)}>
      sensor still · person moves
    </SubLabel>
    {/* two lines, under the label and inside the room (one line would run across the room's right wall) */}
    <Chip x={640} y={836} valign="top" size={30} maxWidth={600} opacity={tw(g, LBL5 + 10, 6, E.linear)}>
      handheld: shown only for locating the sensor itself (reported)
    </Chip>
  </AbsoluteFill>
);

const ShotPanels: React.FC<{g: number}> = ({g}) => {
  const grow = tw(g, GROW0, GROW_DUR, E.inOut);
  const rIn = tw(g, RIGHT_IN, 2, E.linear); // the right panel cuts in (no washed-out fade)
  const titles = 1 - tw(g, GROW0, 8, E.linear); // the titles go as the right panel starts to grow over the left
  const geoR = lerpGeo(GEO_R, FULL_GEO, grow);
  // inset: he grins at the smear, deflates on "keeps up", gone before the grow
  const INS = {cx: 1700, cy: 812, r: 118};
  const open = sp(g, INSET2, SNAP) * (1 - tw(g, INSET2_OUT, 8, E.in));
  const fc = face2(g);
  const tok = planToScreen(geoR, CAM_F, HD);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage geo={GEO_L} cam={CAM_F} state={stateSmearPanel()} />
      <SubLabel x={GEO_L.x + GEO_L.w / 2} y={172} anchor="middle" opacity={titles}>
        just adding → smear
      </SubLabel>
      {rIn > 0 && <PlanStage geo={geoR} cam={CAM_F} state={stateKeepsUp()} opacity={rIn} />}
      <SubLabel x={GEO_R.x + GEO_R.w / 2} y={172} anchor="middle" opacity={rIn * titles}>
        tracking what moved → keeps up
      </SubLabel>
      <IllustrationChip />
      {/* no tail while the left panel is alone (his token in the right panel is not there yet) */}
      <V9Inset cx={INS.cx} cy={INS.cy} r={INS.r} open={open} frame={g} pose={fc.pose} lean={fc.lean} tail={rIn >= 1 ? {x: tok.x, y: tok.y, r: tokenScreenR(CAM_F, geoR.s)} : undefined} />
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const V9Fusion: React.FC = () => {
  const g = useG();
  let shot: React.ReactNode;
  if (g < CUT_ICONS) shot = <ShotMotion g={g} />;
  else if (g < CUT_RAIL) shot = <ShotIcons g={g} />;
  else if (g < CUT_WALK) shot = <ShotRail g={g} />;
  else if (g < PANELS) shot = <ShotWalk g={g} />;
  else shot = <ShotPanels g={g} />;
  return <AbsoluteFill style={{background: C.paper}}>{shot}</AbsoluteFill>;
};

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, note: 'V9 room tone (our plan)'},
  // V9.1
  {f: FRAME1, kind: 'sensor_pulse', gain: -8, note: 'frame 1: the sensor fires'},
  {f: TL_IN + 14, kind: 'echo_return', gain: -10, note: "frame 1: his echo lands on the mini timeline"},
  {f: STEP0 + STEP_DUR - 1, kind: 'footstep_wood', gain: -8, note: 'he steps H_A → H_B'},
  {f: FRAME2, kind: 'sensor_pulse', gain: -9, pitch: 1, note: 'frame 2: the sensor fires'},
  {f: SLIDE_TICK + 10, kind: 'echo_return', gain: -11, pitch: -1, note: 'his echo lands later'},
  {f: JIG0, kind: 'partition_wobble', gain: -10, pitch: 9, note: 'the sensor head jiggles on its stand'},
  {f: FRAME3, kind: 'sensor_pulse', gain: -11, pitch: 2, note: 'the spots fire where they landed'},
  // V9.2
  {f: BLUR0, kind: 'paper_swish', gain: -9, note: 'the smear swish (the only one)'},
  {f: PHOTO0 + 1, kind: 'shutter_click', gain: -6, note: 'long-exposure snapshot'},
  // V9.3
  {f: LOCK1[1], kind: 'lock_click', gain: -6, note: 'padlock on "position"'},
  {f: LOCK1[2], kind: 'lock_click', gain: -6, pitch: 2, note: 'padlock on "sensor"'},
  {f: UNLOCK, kind: 'lock_click', gain: -12, pitch: -4, note: 'position unlocks'},
  {f: LOCK2, kind: 'lock_click', gain: -6, pitch: 1, note: 'padlock on "shape"'},
  // V9.4
  {f: FRAME_A, kind: 'sensor_pulse', gain: -10, note: 'frame A: the sensor fires at A'},
  {f: SLIDE0, kind: 'book_slide', gain: -10, pitch: 4, dur: SLIDE_DUR / 30, note: 'the sensor rides the rail A → B1'},
  {f: SLIDE0 + SLIDE_DUR, kind: 'tiny_clink', gain: -10, note: 'the carriage stops at B1'},
  {f: SPOTS_B - 2, kind: 'sensor_pulse', gain: -10, pitch: -1, note: "B1's listening spots"},
  {f: CARD_IN, kind: 'card_flick', gain: -8, note: 'the U thumbnail card'},
  // V9.5
  {f: FIRE5, kind: 'sensor_pulse', gain: -11, pitch: 1, note: 'frame 1 of the walk: the sensor fires; the guesses fill its region'},
  ...STEP_T.map((t0, i): Sfx => ({f: t0 + 9, kind: 'footstep_wood', gain: -10, pitch: [1, -1, 2][i], note: `he steps to ${TRACK[i + 1].id}`})),
  ...STEP_T.map((_, i): Sfx => ({f: checkFrame(i), kind: 'sensor_pulse', gain: -12, pitch: [0, 1, -1][i], note: `frame ${i + 2}: the guesses are checked`})),
  {f: DEFLATE, kind: 'uh_oh', gain: -10, note: 'he deflates: the estimate keeps up'},
];
