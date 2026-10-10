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
import {WALL_T} from '../lib/room';
import {EXPR, IDLE2, withPose, type Pose2} from '../components/v02/Cast2';
import {FULL_GEO, bandsFor, lerpGeo, planToScreen, type PanelGeo} from '../components/v02/S6_PlanView';
import {LongExposurePhoto} from '../components/v02/S6_Photo';
import {Chip, SubLabel, TeachLabel} from '../components/v2k/Labels';
import {ZoneBox} from '../components/v02/S3_ZoneBox';
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
import {MINI, MiniTimeline, UCARD, UCARD_SHADOW, UCard, UnknownIcons, type UnknownState} from '../components/v2s/V9_Icons';
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
 *            spots move" (48). Each change is framed up for its label (r1 V2-R1-34): the mini timeline card comes
 *            forward 1.5× before the tick slides, and the camera pushes in 2.5× on the wall spots after the jiggle.
 *  V9.2 n20  "Just add them up": frame 1's bands (round the old spots, through H_A, ghost token) and frame 2's (round
 *            the new spots, through H_B) stack; on "blur" they become one coral streak covering both (plain stacking of
 *            the 8 bands, ≈ 0.86 m long, measured at load); "just adding → smear" (48) · "illustrative" (30). On "long
 *            exposure", 1 s: the S6_Photo snapshot of the guesser mid-walk. The inset grin widens on "smear".
 *  V9.3 n21  Cut: three large icons "shape" · "position" · "sensor"; padlocks close on position and sensor (shape free),
 *            then position's lock opens and one drops on shape (position free); "one unknown at a time" (64).
 *  V9.4 n22  Cut: one full-frame plan, framed on CAM_F (V9.5's framing, so the cut on "person" keeps the room in place).
 *            A still object (a box) behind the partition, the long patch from frame A's
 *            bunched spots. The sensor rides a rail from frame A to frame B1 (no hand; a dashed ghost stays at A);
 *            "object still", "sensor on a rail, at known positions" (48). B1's spots appear on the wall line and the
 *            patch shrinks about 30% (measured at load; a dashed outline of the old patch stays). On "That's (how the
 *            U was made)": a framed portrait thumbnail card of the real U board, header "Real data · same 3×3 sensor",
 *            in the margin right of the room (off our plan), about 1.3 s; the rail sensor turns into the 3×3 zone box.
 *  V9.5 n23  Cut on "To (follow a person)" (same framing), sensor on its stand. On "person" frame 1 fires; its region
 *            (dashed) shows round him and the guesses (teal dots) are seeded inside it; he walks H_A → H_B → H_C → H_D;
 *            each frame the guesses drift, the misses fade, the survivors are copied, and the cloud follows him.
 *            "sensor still · person moves" (48); chip "handheld use: shown only for finding the sensor's own position
 *            (reported)" (40). Then two panels, one at a time: left alone 1 s "just adding → smear" (the four frames
 *            stacked), then right "tracking what moved → keeps up" (the guesses round his new position).
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
  thats: at('n22', "That's"),
  U: at('n22', 'U'),
  n22end: segEnd('n22'),
  // n23
  to23: at('n23', 'To'),
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
/** the U card: in on "That's (how the U was made)", so it gets about 1.3 s before V9.5 cuts in on n23's first word
 *  ("To follow a person"; v2 review r1 V2-R1-32: the cut used to lag that word by about half a second). On "the" it
 *  would get only 0.9 s. */
const CARD_IN = K.thats;
const CUT_WALK = K.to23 - 1;
if (!(CUT_WALK - CARD_IN >= 36)) throw new Error(`V9.4: the U card gets only ${CUT_WALK - CARD_IN} frames before the cut`);
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
const FRAME3 = K.land - 2; // the spots fire where they landed
/**
 * v2 review r1 (V2-R1-34): both changes were a few pixels at phone width, so each gets framed up for its label, one at
 * a time, after the change itself has played in the full view (the 11 cm step and the 5° jiggle stay true to scale).
 *  - Echo: once he has stepped, the mini timeline card comes forward (scales 1.5× about its lower-left corner, so it
 *    stays above the caption band and clear of his token) before his tick slides; the plan does not move.
 *  - Spots: once the jiggle has settled, the camera pushes in 2.5× on the wall spots (their dashed ghosts, the new
 *    places and the arrows between them) for "its listening spots land somewhere new", then pulls back to the
 *    hand-off framing before "Just add them up".
 */
const TL_K = 1.5;
const TL_GROW0 = STEP0 + STEP_DUR + 6;
const TL_GROW_DUR = Math.min(14, SLIDE_TICK - 4 - TL_GROW0);
const PUSH_K = 2.5;
const PUSH0 = JIG0 + 22; // the wobble has decayed below 0.5°
const PUSH_DUR = 18;
const PULL0 = K.just - 16;
const PULL_DUR = 14;
const SPOTS_LBL = PUSH0 + PUSH_DUR + 2;
if (!(STEP0 + STEP_DUR + 4 <= FRAME2 + 4 && SLIDE_TICK + 12 < ECHO_OUT && ECHO_OUT + 8 <= JIG0)) throw new Error('V9.1: beats overlap');
if (!(TL_GROW_DUR >= 10 && PUSH0 + PUSH_DUR + 24 <= PULL0 - 6 && PULL0 + PULL_DUR <= K.just)) throw new Error(`V9.1: framing moves do not fit (${[TL_GROW0, TL_GROW_DUR, PUSH0, PULL0, K.just].join(', ')})`);

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

/** The camera that shows `cam`'s picture zoomed k× about the screen point F (a push in on F). */
const pushCam = (cam: Cam, k: number, F: {x: number; y: number}): Cam => ({
  cx: cam.cx + ((960 - F.x) * (1 - k)) / (k * cam.zoom),
  cy: cam.cy + ((540 - F.y) * (1 - k)) / (k * cam.zoom),
  zoom: cam.zoom * k,
});
const pushPt = (p: {x: number; y: number}, k: number, F: {x: number; y: number}) => ({x: F.x + k * (p.x - F.x), y: F.y + k * (p.y - F.y)});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a 0 → 1 → 0 flash for a sensor firing at f0 */
const flash = (g: number, f0: number, dur = 10) => (g < f0 || g > f0 + dur ? 0 : Math.sin(((g - f0) / dur) * Math.PI));
const tokenScreenR = (cam: Cam, s = 1) => (TOKEN_PX / 2) * cam.zoom * s;

/* ---------------------------------------------------------------- V9.1 framings (v2 review r1, V2-R1-34) */

/** the face inset of V9.1–V9.2 */
const INS1 = {cx: 1650, cy: 310, r: 140};
/** The mini timeline card comes forward TL_K× about its lower-left corner (screen), staying above the caption band,
 *  inside x 1824 and clear of his token at H_B; its label sits above the grown card. */
const TL_ANCHOR = {x: MINI.x, y: 933};
const TL_BIG = {
  x0: TL_ANCHOR.x + TL_K * (MINI.x - TL_ANCHOR.x),
  y0: TL_ANCHOR.y + TL_K * (MINI.y - TL_ANCHOR.y),
  x1: TL_ANCHOR.x + TL_K * (MINI.x + MINI.w - TL_ANCHOR.x),
  y1: TL_ANCHOR.y + TL_K * (MINI.y + MINI.h - TL_ANCHOR.y),
};
const ECHO_LBL = {x: 110, y: Math.round(TL_BIG.y0 - 24)};
{
  const tok = planToScreen(FULL_GEO, CAM_PLAN_ACT, HB);
  const R = tokenScreenR(CAM_PLAN_ACT);
  const shadowBottom = TL_ANCHOR.y + TL_K * (MINI.y + MINI.h + 12 - TL_ANCHOR.y);
  if (shadowBottom > 950 || TL_BIG.x1 + 10 * TL_K > 1824) throw new Error(`V9.1: the grown mini timeline leaves the safe area (${TL_BIG.x1.toFixed(0)}, ${shadowBottom.toFixed(0)})`);
  if (!(TL_BIG.y0 >= tok.y + R + 4)) throw new Error(`V9.1: the grown mini timeline (top ${TL_BIG.y0.toFixed(0)}) runs into his token at H_B (bottom ${(tok.y + R).toFixed(0)})`);
}
/** The push on the wall spots: CAM_PLAN_ACT zoomed PUSH_K× about PUSH_F, which puts the centre of the spots (the
 *  jiggled ones to frame A's last) at SPOTS_AT. At y 344 the partition's top end and his token are pushed off the
 *  bottom of the frame instead of sitting in the caption band for 2 s (G5 verify; asserted below). */
const SPOTS_AT = {x: 900, y: 344};
const SPOTS_SRC = (() => {
  const a = planToScreen(FULL_GEO, CAM_PLAN_ACT, WJ[0]);
  const b = planToScreen(FULL_GEO, CAM_PLAN_ACT, WA[3]);
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
})();
const PUSH_F = {x: (SPOTS_AT.x - PUSH_K * SPOTS_SRC.x) / (1 - PUSH_K), y: (SPOTS_AT.y - PUSH_K * SPOTS_SRC.y) / (1 - PUSH_K)};
const CAM_SPOTS = pushCam(CAM_PLAN_ACT, PUSH_K, PUSH_F);
/** "sensor moves → spots move" in the pushed framing: bottom-right, right of the field-of-view wedge, under the inset */
const SPOTS_LBL_AT = {x: 1790, y: 640};
{
  // every spot (old and new) inside the safe area and left of the face inset, in the pushed framing; the camera
  // formula agrees with the screen-space push
  for (const w of [...WA, ...WJ]) {
    const q = planToScreen(FULL_GEO, CAM_SPOTS, w);
    if (q.x < 140 || q.x > INS1.cx - INS1.r - 60 || q.y < 120 || q.y > 950) throw new Error(`V9.1: spot ${w.id} lands at (${q.x.toFixed(0)}, ${q.y.toFixed(0)}) in the push`);
    const r = pushPt(planToScreen(FULL_GEO, CAM_PLAN_ACT, w), PUSH_K, PUSH_F);
    if (Math.hypot(r.x - q.x, r.y - q.y) > 0.5) throw new Error('V9.1: pushCam disagrees with the screen-space push');
  }
  // nothing of the room's floor plan below the spots shows in the caption band: the partition's top end (outline
  // included) and his token at H_B (drawn half-extent with shadow ≈ 0.51 TOKEN_PX, measured) are below the frame
  const partTop = planToScreen(FULL_GEO, CAM_SPOTS, P(LAYOUT.occluder.x, LAYOUT.occluder.z0)).y - 6 * CAM_SPOTS.zoom;
  if (partTop < 1080) throw new Error(`V9.1: the partition's top end shows at y ${partTop.toFixed(0)} in the push`);
  const tokB = planToScreen(FULL_GEO, CAM_SPOTS, HB);
  const tokR = 0.53 * TOKEN_PX * CAM_SPOTS.zoom;
  if (tokB.y - tokR < 1080 && tokB.x - tokR < 1920) throw new Error(`V9.1: his token shows in the push (${tokB.x.toFixed(0)}, ${tokB.y.toFixed(0)})`);
}

/** The illustration chip, top-left (the V8 hand-off frame has it in the same place); a paper backing hides the plan's
 *  wall ruler tick under it (v1 D27). 40 px (v2 review r1, V2-R1-14: 30 px chips were about 6 px at phone width), with
 *  a slimmer vertical padding so the chip box ends at y 110 and its backing at y 116, above the top wall's outer face in
 *  the hand-off framing (y ≈ 118 at CAM_PLAN_ACT); the backing fades while the camera is pushed in on the wall (V9.1).
 *  Box, padding and backing are V8's HANDOFF_CHIP (V8_Plan, G4 fix round), so nothing changes at the V8 → V9 cut. */
const ILLU_CHIP = {x: 96, y: 54, size: 40, padding: '5px 28px', backing: {left: 90, top: 38, width: 290, height: 78}};
const IllustrationChip: React.FC<{t?: number; backing?: number}> = ({t = 1, backing = 1}) =>
  t <= 0.001 ? null : (
    <>
      {backing > 0.001 && <div style={{position: 'absolute', ...ILLU_CHIP.backing, background: C.paper, opacity: t * backing}} />}
      <Chip x={ILLU_CHIP.x} y={ILLU_CHIP.y} size={ILLU_CHIP.size} opacity={t} style={{padding: ILLU_CHIP.padding}}>
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
  // the push in on the wall spots (zoom eased in log scale, so it reads as an even push), and back out
  const push = tw(g, PUSH0, PUSH_DUR, E.inOut) * (1 - tw(g, PULL0, PULL_DUR, E.inOut));
  const cam = push > 0.0005 ? pushCam(CAM_PLAN_ACT, Math.pow(PUSH_K, push), PUSH_F) : CAM_PLAN_ACT;
  // inset (V9.1 → V9.2); its tail fades while the push takes his token out of frame
  const INS = INS1;
  const open = sp(g, INSET1, SNAP);
  const f = face1(g);
  const tok = planToScreen(FULL_GEO, cam, st.guesser ?? HA);
  const tailT = 1 - Math.min(1, push * 4);
  // mini timeline: comes forward once he has stepped, before his tick slides
  const tlT = tw(g, TL_IN, 8) * (1 - tw(g, ECHO_OUT, 8));
  const tlS = 1 + (TL_K - 1) * tw(g, TL_GROW0, TL_GROW_DUR, E.inOut);
  const echoLbl = tw(g, K.shifts, 6, E.linear) * (1 - tw(g, ECHO_OUT, 8));
  const spotsLbl = tw(g, SPOTS_LBL, 6, E.linear) * (1 - tw(g, PULL0 - 6, 6, E.linear));
  const smearLbl = tw(g, K.smear, 6, E.linear);
  // the photo gag
  const photoIn = sp(g, PHOTO0, SNAP);
  const photoOut = tw(g, PHOTO_OUT, 8, E.in);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage geo={FULL_GEO} cam={cam} state={st} />
      <IllustrationChip backing={1 - push} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${tlS.toFixed(4)})`, transformOrigin: `${TL_ANCHOR.x}px ${TL_ANCHOR.y}px`}}>
        <MiniTimeline t={tlT} wall={tw(g, TL_IN + 8, 8)} his={tw(g, TL_IN + 14, 6)} tick={tw(g, SLIDE_TICK, 12, E.inOut)} ghost={tw(g, SLIDE_TICK + 2, 6)} />
      </div>
      <SubLabel x={ECHO_LBL.x} y={ECHO_LBL.y} opacity={echoLbl}>
        he moves → echo shifts
      </SubLabel>
      <SubLabel x={SPOTS_LBL_AT.x} y={SPOTS_LBL_AT.y} anchor="end" opacity={spotsLbl}>
        sensor moves → spots move
      </SubLabel>
      <SubLabel x={980} y={772} opacity={smearLbl}>
        just adding → smear
      </SubLabel>
      <Chip x={980} y={798} size={30} opacity={tw(g, K.smear + 4, 6, E.linear)}>
        illustrative
      </Chip>
      <V9Inset cx={INS.cx} cy={INS.cy} r={INS.r} open={open} frame={g} pose={f.pose} lean={f.lean} tail={tailT > 0.001 ? {x: tok.x, y: tok.y, r: tokenScreenR(cam)} : undefined} tailOpacity={tailT} />
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

/**
 * v2 review r1 (V2-R1-07): B1's spots sit ON the wall's inner face, at the same y as frame A's, and the two sets differ
 * by colour only (A pale saffron, B1 teal). They share wall places: B1.W4 lands on A.W2 (both x ≈ 1.76 m) and B1.W3 is
 * 3.7 cm from A.W1, so the markers of each such pair are drawn nudged apart along the wall, symmetrically, to SPOT_SEP
 * (43 px in this framing, so the two diamonds of a pair stand apart with paper between them, not overlapping or
 * touching: G5 verify). The
 * nudge is a drawing offset of at most 5 cm on 18 cm zones (asserted); the bands stay centred on the true layout
 * spots. A's markers are nudged from frame A on, so nothing moves when B1's land.
 */
const SPOT_SEP = 0.095;
const [MARK_A, MARK_B] = (() => {
  const a = WA.map((p) => p.x);
  const b = WB.map((p) => p.x);
  b.forEach((bx, i) =>
    a.forEach((ax, j) => {
      if (Math.abs(bx - ax) >= SPOT_SEP) return;
      const mid = (bx + ax) / 2;
      const side = Math.sign(ax - bx) || 1;
      b[i] = mid - (side * SPOT_SEP) / 2;
      a[j] = mid + (side * SPOT_SEP) / 2;
    }),
  );
  const xs = [...a, ...b].sort((u, v) => u - v);
  xs.slice(1).forEach((x, i) => {
    if (x - xs[i] < SPOT_SEP - 1e-6) throw new Error(`V9.4: wall spot markers ${xs[i].toFixed(3)} and ${x.toFixed(3)} m overlap`);
  });
  [...a.map((x, i) => x - WA[i].x), ...b.map((x, i) => x - WB[i].x)].forEach((d) => {
    if (Math.abs(d) > 0.05) throw new Error(`V9.4: a wall spot marker is nudged ${(d * 100).toFixed(1)} cm (max 5)`);
  });
  return [a.map((x, i) => P(x, 0, WA[i].id)), b.map((x, i) => P(x, 0, WB[i].id))];
})();

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
      ...MARK_A.map((p) => ({p, t: 1, active: Math.max(0.35, flash(g, FRAME_A + 2, 12))})),
      ...MARK_B.map((p, i) => ({p, t: tw(g, SPOTS_B + 3 * i, 8), active: 1, tone: 'teal' as const})),
    ],
    box: 1,
    // while the U card shows, the 3×3 zone box stands in for the rail sensor (drawn by ShotRail)
    sensorOpacity: 1 - tw(g, CARD_IN, 5, E.linear),
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
/**
 * v2 review r1 (V2-R1-08): the U card stands in the margin outside the room (right of the plan's right wall), and while
 * it shows, the rail's sensor token becomes the 3×3 zone box of the real boards (the U's sensor), so the real U never
 * sits beside the drawing of the off-the-shelf kit. Checked at load: the card clears the right wall's outer face and
 * its drop shadow, and card + shadow stay inside the safe area.
 */
const RAIL_ZONEBOX = 92;
{
  const wallOuter = planToScreen(FULL_GEO, CAM_F, P(LAYOUT.room.x1 + WALL_T, 0)).x;
  const wallShadow = 10 * CAM_F.zoom; // the room set's drop shadow, 10 world px right of the wall
  if (UCARD.x < wallOuter + wallShadow + 6) throw new Error(`V9.4: the U card (x ${UCARD.x}) is not clear of the room's right wall (${(wallOuter + wallShadow).toFixed(0)})`);
  if (UCARD.x + UCARD.w + UCARD_SHADOW.dx > 1824 || UCARD.y < 54 || UCARD.y + UCARD.h + UCARD_SHADOW.dy > 950) throw new Error('V9.4: the U card leaves the safe area');
}
const ShotRail: React.FC<{g: number}> = ({g}) => {
  const railLbl = tw(g, K.known, 6, E.linear);
  const swap = tw(g, CARD_IN, 5, E.linear);
  const sens = planToScreen(FULL_GEO, CAM_F, lerpP(SA, SB, tw(g, SLIDE0, SLIDE_DUR, E.inOut)));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <PlanStage geo={FULL_GEO} cam={CAM_F} state={stateRail(g)} />
      {swap > 0.001 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ZoneBox asGroup x={sens.x} y={sens.y - 4} size={RAIL_ZONEBOX} listening={0.15} opacity={swap} />
        </svg>
      )}
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

/** baseline of "sensor still · person moves" (raised from 812 so the 40 px chip under it clears the caption band) */
const WALK_LBL_Y = 790;
const ShotWalk: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: C.paper}}>
    <PlanStage geo={FULL_GEO} cam={CAM_F} state={stateWalk(g)} />
    <IllustrationChip />
    <SubLabel x={640} y={WALK_LBL_Y} opacity={tw(g, LBL5, 6, E.linear)}>
      sensor still · person moves
    </SubLabel>
    {/* v2 review r1 (V2-R1-33): plain wording at 40 px (it backs claim P05: handheld use was shown only for locating
        the sensor, with a reflective patch); two lines under the label, inside the room and above the caption band */}
    <Chip x={640} y={WALK_LBL_Y + 14} valign="top" size={40} maxWidth={820} opacity={tw(g, LBL5 + 10, 6, E.linear)}>
      handheld use: shown only for finding the sensor's own position (reported)
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
