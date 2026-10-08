import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, FIRM, SNAP, SOFT, camKick, drop, impact, ring, sp, tw, kf} from '../lib/motion';
import {rand} from '../lib/anim';
import {Camera, Layer, camLerp, type Cam} from '../lib/camera';
import {CAM_PLAN_ACT} from '../lib/shots';
import {TOKEN_R} from '../lib/room';
import layoutJson from '../data/layout.json';
import {
  LAYOUT,
  assertPath,
  extractContours,
  lerpP,
  possibleCloud,
  sub,
  type BandSpec,
  type GridSpec,
  type P2,
  type ScalarField,
} from '../lib/optics';
import {CAST} from '../components/cast';
import {Chip} from '../components/Text';
import {Character2, EXPR, IDLE2, reach2, withPose, type Pose2} from '../components/v02/Cast2';
import {HandheldSensor, SensorTop, facingOf, sensorPoint} from '../components/v02/HandheldSensor';
import {CheckerToken, GuesserToken} from '../components/v02/Tokens';
import {Band, CandidateArc, PulseDot, SensorGlyph, WallMarker, polyD} from '../components/v02/Optics';
import {GadgetIcons, GripFingers, MuseumLabel, MuseumSet, ReachArm, S5_SET_SW, S5_SHIFT, SENSOR_SPOT, VelvetRope} from '../components/v02/S6_Plinth';
import {GenericPhone, PHONE, PHONE_SCREEN, Padlock} from '../components/v02/S6_Phone';
import {ResearchModule} from '../components/v02/S6_ResearchModule';
import {SensorStand} from '../components/v02/S6_Stand';
import {CloudShape, FULL_GEO, PlanSvg, PlanView, averagedCloud, bandsFor, camOnPlan, cardGeo, lerpGeo, planPx, planToScreen, type PanelGeo} from '../components/v02/S6_PlanView';
import {LongExposurePhoto} from '../components/v02/S6_Photo';

/**
 * S6 · Small sensors, published 2026 (s30–s35).
 *  S6.1 s30  opens on S5's last framing (CAM_S5_END: the roped-off empty fourth plinth, the cheap-sensor stool and its
 *            2021 card at the right) and eases in to the empty plinth, the stool and card sliding out at the right; the
 *            checker's arm (coral sleeve) sets her small sensor on it (grip foot on the slab, her fist above it), lets go
 *            and leaves, then the sensor rocks once; plate "published 2026 / MIT + Dartmouth"; label "time-of-flight
 *            sensors (LiDAR)"; the readout wakes on "found".
 *  S6.2 s31  a generic phone slides in showing its raw data; a padlock drops and snaps shut on "private".
 *  S6.3 s32  the problems as three cards: a dim beam and a fainter echo; the team's own research module (a dot grid
 *            illustrating about 100 pixels; no grid size printed on it); the checker lifts her sensor off its stand and
 *            it jiggles.
 *  S6.4 s33  a burst of dim, noisy plan "frames" (night-mode analogy) stacks into one clearer estimate.
 *  S6.5 s34  that estimate card grows into the plan (CAM_PLAN_ACT): the sensor jiggles, he steps from H_A to hiddenB,
 *            and plainly averaging the two frames' bands smears the estimate; a long-exposure photo gag.
 *  S6.6 s35  the plan splits: left, the sensor moves A → B1 on known positions, B1's wall points add bands and the patch
 *            shrinks; right, the sensor stays still and he takes three steps along layout.json's illustrative track
 *            (H_A → hiddenB → H_C → H_D); the bands and the possible-locations cloud are recomputed at each position and
 *            catch up a few frames behind him, leaving a breadcrumb (dot + dashed outline of the old cloud) at each spot.
 * Every beat is cued from narration words (K); geometry, bands and clouds come from layout.json via lib/optics.
 */

/* ================================================================== cues (global frames, from the narration) */

const SC = scene('S6');
const K = {
  start: SC.from,
  end: SC.to,
  // s30
  s30: seg('s30').from,
  study: at('s30', 'study'),
  published: at('s30', 'published'),
  y2026: at('s30', '2026'),
  team: at('s30', 'team'),
  mit: at('s30', 'MIT'),
  tof: at('s30', 'time-of-flight'),
  lidar: at('s30', 'LiDAR'),
  found: at('s30', 'found'),
  phones: at('s30', 'phones'),
  gadgets: at('s30', 'gadgets'),
  s30end: segEnd('s30'),
  // s31
  s31: seg('s31').from,
  dont: at('s31', "Don't"),
  yet: at('s31', 'yet'),
  keep: at('s31', 'keep'),
  raw: at('s31', 'raw'),
  priv: at('s31', 'private'),
  // s32
  s32: seg('s32').from,
  tough: at('s32', 'tough'),
  weak: at('s32', 'Weak'),
  fainter: at('s32', 'fainter'),
  echoes: at('s32', 'echoes'),
  teams: at('s32', "team's"),
  grade: at('s32', 'smartphone-grade'),
  hundred: at('s32', 'hundred'),
  listening: at('s32', 'listening'),
  and: at('s32', 'And'),
  hold: at('s32', 'hold'),
  jiggles: at('s32', 'jiggles'),
  // s33
  s33: seg('s33').from,
  fix: at('s33', 'fix'),
  night: at('s33', 'night'),
  cameras: at('s33', 'cameras'),
  stack: at('s33', 'stack'),
  many: at('s33', 'many'),
  into: at('s33', 'into'),
  better: at('s33', 'better'),
  // s34
  s34: seg('s34').from,
  between: at('s34', 'between'),
  jig34: at('s34', 'jiggles'),
  person: at('s34', 'person'),
  moves: at('s34', 'moves'),
  plain: at('s34', 'Plain'),
  smear: at('s34', 'smear'),
  long: at('s34', 'long'),
  // s35
  s35: seg('s35').from,
  one: at('s35', 'one'),
  move: at('s35', 'Move'),
  known: at('s35', 'known'),
  listen35: at('s35', 'listening'),
  spread: at('s35', 'spread'),
  keep35: at('s35', 'Keep'),
  each: at('s35', 'each'),
  step: at('s35', 'step'),
  becomes: at('s35', 'becomes'),
  position: at('s35', 'position'),
  // S5's last cue still running at the cut: the cheap-sensor board's LED blink (S5_History LED = at('s29', 'cheap'))
  s5Led: at('s29', 'cheap'),
};

/** Shot boundaries (cuts and the two plan transitions). */
const CUT2 = K.s31 - 3; // museum → phone
const CUT3 = K.s32; // phone → problem cards
const CUT4 = K.s33 - 2; // cards → burst
const GROW0 = K.s34; // the estimate card grows into the plan
const GROW_DUR = Math.max(12, Math.min(24, K.between - K.s34 + 2));
const RESET0 = K.s35; // S6.6: the smear clears, he steps back to H_A
const SPLIT0 = K.s35 + Math.min(18, Math.round((K.one - K.s35) * 0.27));
const SPLIT_DUR = Math.max(14, Math.min(34, K.one - 6 - SPLIT0));

/* ------------------------------------------------------------------ S6.1 timing */
const S1K = 1.5; // sensor and hand scale in the close-up
const CONTACT = K.y2026; // the sensor's grip foot touches the plinth on "2026"
/** The hand-off from S5 (review r1 D30): S6 opens on S5's last framing (S5 CAM_WB {4620, 440, 0.8} in S6 world px) and
 *  eases to the plinth close-up, done before the arm comes in. */
const OPEN_DUR = Math.max(16, Math.min(24, CONTACT - 36 - K.start));
const OPEN_END = K.start + OPEN_DUR;
const ARM_IN = Math.max(OPEN_END + 6, CONTACT - 30);
const HOVER = CONTACT - 11;
const RELEASE = CONTACT + 5;
const RELEASE_END = RELEASE + 7;
const ARM_GONE = RELEASE_END + 24;
if (!(HOVER - ARM_IN >= 8)) throw new Error(`S6.1: the arm needs >= 8 frames to come in after the opening move (ARM_IN ${ARM_IN}, HOVER ${HOVER})`);
/** one push toward the sensor and its label as the narration names it (ends before the label lands) */
const PUSH0 = Math.max(ARM_GONE + 4, K.mit + 12);
const PUSH_DUR = Math.max(16, Math.min(44, K.tof - 2 - PUSH0));
const CAM_PLINTH_CLOSE: Cam = {cx: 1060, cy: 470, zoom: 1.12};
/** S5's end framing (S5_History CAM_WB {4620, 440, 0.8}) in S6 world px (S5 x − S5_SHIFT). */
const CAM_S5_END: Cam = {cx: 4620 - S5_SHIFT, cy: 440, zoom: 0.8};
/* ------------------------------------------------------------------ S6.2 timing */
/** the phone is already rising into view on the cut frame (starting it after the cut left 3 empty paper frames) */
const PHONE_IN = CUT2 - 5;
const PHONE_LAND = PHONE_IN + 16;
const LOCK_LAND = Math.max(K.keep + 6, Math.min(K.raw + 2, K.priv - 8));
const LABEL_PRIV = Math.min(LOCK_LAND + 4, CUT3 - 36);
/* ------------------------------------------------------------------ S6.3 timing */
/** All three cards are dealt on the cut ("tough customers": three problems); each lights up on its cue, the ones still
 *  to come wait dimmed, so the frame is never two-thirds empty and the eye knows which card is talking. */
const CARD_T = [CUT3 - 3, CUT3 + 1, CUT3 + 5]; // the first card is already rising on the cut frame
const CARD_ACT = [CUT3, K.teams - 6, K.and - 8];
const PULSE0 = K.weak;
const PULSE_DUR = Math.max(8, Math.min(13, K.fainter - K.weak - 2));
const ECHO0 = Math.max(PULSE0 + PULSE_DUR + 1, K.fainter - 6);
const ECHO_DUR = Math.max(10, Math.min(24, K.echoes + 10 - ECHO0));
const REACH0 = K.hold - 12;
const GRAB = K.hold + 2;
const LIFT_DUR = 12;
const JIG0 = K.jiggles - 2;
/* ------------------------------------------------------------------ S6.4 timing */
const N_FRAMES = 6;
/** the first shot pops 2 frames before the cut so the shot never opens on an empty frame */
const SHOT_T = Array.from({length: N_FRAMES}, (_, k) => Math.round(CUT4 - 2 + ((K.cameras - CUT4 + 2) * k) / (N_FRAMES - 1)));
const STACK0 = K.stack;
const MERGE0 = K.into;
/* ------------------------------------------------------------------ S6.5 timing */
const J5 = K.jig34 - 3;
const WALK0 = K.person - 2;
const WALK_DUR = Math.max(10, Math.min(20, K.plain - 4 - WALK0));
const SMEAR0 = K.plain + 4;
const PHOTO0 = K.long - 2;
/* ------------------------------------------------------------------ S6.6 timing */
const RAIL0 = K.move - 10;
const SLIDE0 = K.move + 2;
const SLIDE_DUR = Math.max(16, K.known - SLIDE0);
const ARCS0 = K.listen35 + 2;
const TIGHT0 = K.spread - 6;
/** Right panel (review r1 D08): three steps along the illustrative track at an even cadence, from "and each" to the
 *  last one landing on "new position", 8..10 frames each; the bands and the cloud follow CLOUD_LAG frames behind him.
 *  The last settle (cloud included) is >= 1 s before S7's wipe starts covering the panel (Main.tsx: S7 wipes in over
 *  12 frames centred on the scene boundary, i.e. from K.end − 6). */
const CLOUD_LAG = 4;
const S7_WIPE_IN = K.end - 6;
const STEP_FIRST = K.each - 6;
const STEP_LAST = Math.min(K.position - 10, S7_WIPE_IN - 30 - CLOUD_LAG - 10);
const STEP_DUR = Math.max(8, Math.min(10, Math.floor((STEP_LAST - STEP_FIRST) / 2) - 5));
const STEP_T = [STEP_FIRST, Math.round((STEP_FIRST + STEP_LAST) / 2), STEP_LAST];
if (!(STEP_T[1] - STEP_T[0] >= STEP_DUR + 3 && STEP_T[2] - STEP_T[1] >= STEP_DUR + 3)) throw new Error(`S6.6: the three steps overlap (${STEP_T.join(', ')}, ${STEP_DUR} f each)`);

/* ================================================================== geometry (layout.json, verified paths) */

type LayoutFrames = {frames: Record<'A' | 'B1', {sensor: [number, number]; aimX: number; wallX: number[]}>; hiddenB: {x: number; z: number}; bandHalfWidth: {oneBin: number; twoBins: number}};
const LJ = layoutJson as unknown as LayoutFrames & typeof layoutJson;
const P = (x: number, z: number, id?: string): P2 => ({x, z, id});
const SA = P(LJ.frames.A.sensor[0], LJ.frames.A.sensor[1], 'S_A');
const SB = P(LJ.frames.B1.sensor[0], LJ.frames.B1.sensor[1], 'S_B1');
const AIM_A = P(LJ.frames.A.aimX, 0);
const AIM_B = P(LJ.frames.B1.aimX, 0);
const WA = LJ.frames.A.wallX.map((x, i) => P(x, 0, `A.W${i + 1}`));
const WB = LJ.frames.B1.wallX.map((x, i) => P(x, 0, `B1.W${i + 1}`));
const HA = P(LJ.hidden.x, LJ.hidden.z, 'H_A');
const HB = P(LJ.hiddenB.x, LJ.hiddenB.z, 'H_B');
const OPER = P(LJ.operator.x, LJ.operator.z);
const HW1 = LJ.bandHalfWidth.oneBin;
const HW2 = LJ.bandHalfWidth.twoBins;
/** S6.6 right panel: layout.json's illustrative frame-to-frame track (hiddenTrack: H_A → hiddenB → H_C → H_D, checked in
 *  research/geometry/geometry_check.py; drawn under the panel's "illustrative" chip). */
type HiddenTrack = {hiddenTrack: {H_C: {x: number; z: number}; H_D: {x: number; z: number}}};
const LT = layoutJson as unknown as HiddenTrack;
const HC = P(LT.hiddenTrack.H_C.x, LT.hiddenTrack.H_C.z, 'H_C');
const HD = P(LT.hiddenTrack.H_D.x, LT.hiddenTrack.H_D.z, 'H_D');
const TRACK: P2[] = [HA, HB, HC, HD];
/** S6.5: frame 2's jiggle moves the sampled wall points this far along the wall (illustrative). */
const JIG_SHIFT = 0.03;
const WA_JIG = WA.map((w, i) => P(w.x + JIG_SHIFT, 0, `A'.W${i + 1}`));

// every light path the bands stand for must be clear of the partition (throws at load if the layout breaks it)
for (const w of WA) {
  assertPath([SA, w, HA, w, SA], LAYOUT);
  assertPath([SA, w, HB, w, SA], LAYOUT);
}
for (const w of WA_JIG) assertPath([SA, w, HB, w, SA], LAYOUT);
for (const H of [HC, HD]) for (const w of WA) assertPath([SA, w, H, w, SA], LAYOUT);
for (const w of WB) assertPath([SB, w, HA, w, SB], LAYOUT);

const GRID_H: GridSpec = {x0: 2.1, x1: 3.3, z0: 0.25, z1: 1.45, step: 0.008};
const GRID_S: GridSpec = {x0: 2.0, x1: 3.45, z0: 0.05, z1: 1.5, step: 0.008};
const GRID_L: GridSpec = {x0: 2.15, x1: 3.05, z0: 0.4, z1: 1.3, step: 0.008};
/** right panel: z0 0.3 (was 0.4) so H_D's cloud (outer level reaches z ≈ 0.38) is not cut by the grid edge */
const GRID_R: GridSpec = {x0: 2.2, x1: 3.15, z0: 0.3, z1: 1.35, step: 0.008};

/** Frame A's bands on H_A and their possible-locations cloud (the crisp estimate). */
const BANDS_A = bandsFor(WA, HA, HW1);
const CLOUD_A = possibleCloud(GRID_H, BANDS_A);
const CLOUD_A_LOOPS = extractContours(CLOUD_A, 0.25); // the old patch's outer edge (drawn as a dashed ghost)
/** S6.4: six quick, dim frames: the same scene, each with its own timing noise (±3.5 cm) and wider bands. */
const DIM_BANDS: BandSpec[][] = Array.from({length: N_FRAMES}, (_, k) => BANDS_A.map((b, i) => ({W: b.W, r: b.r + (rand(k * 31 + i * 7 + 5) - 0.5) * 0.07, halfWidth: HW2})));
const DIM_CLOUDS: ScalarField[] = DIM_BANDS.map((bs) => possibleCloud(GRID_H, bs));
/** S6.5: frame 2 = sensor jiggled (wall points shifted) + person at hiddenB; plain averaging keeps the assumed points. */
const BANDS_F2_DRAWN = bandsFor(WA_JIG, HB, HW1);
const SMEAR = averagedCloud(GRID_S, [BANDS_A, bandsFor(WA, HB, HW1, WA_JIG)]);
/** S6.6 right: the cloud (and its outer edge, for the breadcrumbs) computed at each track position. */
const CLOUD_TRACK = TRACK.map((H) => possibleCloud(GRID_R, bandsFor(WA, H, HW1)));
const LOOPS_TRACK = CLOUD_TRACK.map((f) => extractContours(f, 0.25));
// the grid must hold every position's whole outer region (a cloud cut by the grid edge would draw a straight side)
CLOUD_TRACK.forEach((f, k) => {
  let edge = 0;
  for (let j = 0; j < f.nz; j++)
    for (let i = 0; i < f.nx; i++) if (i === 0 || j === 0 || i === f.nx - 1 || j === f.nz - 1) edge = Math.max(edge, f.values[j * f.nx + i]);
  if (edge >= 0.25) throw new Error(`S6.6: GRID_R clips the cloud at ${TRACK[k].id} (edge value ${edge.toFixed(3)})`);
});
/** S6.6 left: B1's bands on H_A (the person holds still), at their final width. */
const BANDS_B = bandsFor(WB, HA, HW1);
/** B1's markers are drawn as a second row just inside the wall edge: A and B1 sample nearly the same spots at x ≈ 1.55/1.58
 *  and 1.76 m, and coincident diamonds would hide each other (the bands themselves are centred on the wall, exactly). */
const B_ROW_Z = 0.075;

/* ================================================================== small helpers */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TOKEN_PX = 2 * TOKEN_R * 240; // token size on the plan board (world px)

/** A screen label: Nunito, optional cream pill backing, anchored by its centre. */
const Label: React.FC<{x: number; y: number; t: number; size?: number; color?: string; weight?: number; display?: boolean; backing?: boolean; align?: 'center' | 'left'; children: React.ReactNode}> = ({x, y, t, size = 38, color = C.ink, weight = 800, display, backing, align = 'center', children}) =>
  t <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${align === 'center' ? '-50%' : '0'}, -50%) scale(${0.94 + 0.06 * Math.min(1, t)})`,
        transformOrigin: align === 'center' ? '50% 50%' : '0 50%',
        opacity: Math.min(1, t * 1.8),
        fontFamily: display ? F.display : F.body,
        fontWeight: display ? 600 : weight,
        fontSize: size,
        lineHeight: 1.15,
        color,
        whiteSpace: 'nowrap',
        ...(backing ? {background: C.cream, padding: '6px 16px 8px', borderRadius: 14, border: `3px solid ${C.ink}`} : {}),
      }}
    >
      {children}
    </div>
  );

/* ================================================================== S6.1 · the empty fourth plinth */

/** The arm comes down from above the frame (shoulder off-screen up-right, ~38° from vertical at contact), so only a
 *  forearm-and-sleeve length of arm is on screen; a long arm from the side edge read as a pole. */
const S1_SHOULDER = {x: 1630, y: -380};
/** Her fist grips the grip this far (sensor px) above its usual hold point, so the grip foot shows below the fist and is
 *  what touches the slab (review r1 D32: with the fist at the hold point it hid the foot and stood in for it). The fist
 *  then sits just under the box (fingers span sensor y −HOLD ± 15; the box's bottom edge is at −50). */
const HOLD = 30;
/** The sensor's origin (its grip hold point) when the grip foot stands on the slab: the label leader and teeter pivot. */
const C_SENSOR = {x: SENSOR_SPOT.x, y: SENSOR_SPOT.y - 14 * S1K};
/** Her hand when the grip foot touches the slab. */
const C_HAND = {x: SENSOR_SPOT.x, y: SENSOR_SPOT.y - (14 + HOLD) * S1K};
const H_OUT = {x: 1250, y: -150};
const H_HOVER = {x: C_HAND.x + 30, y: C_HAND.y - 92};
/** letting go: straight right, clear of the box and its depth (+76 px) plus the mitt's half-width, then up and out */
const H_REL = {x: C_HAND.x + 110, y: C_HAND.y};
const H_GONE = {x: 1290, y: -170};
/** the opening framing: the empty plinth a little right of centre, the 2021 neighbour's plaque readable at the left */
const CAM_PLINTH_WIDE: Cam = {cx: 880, cy: 540, zoom: 1};

const handAt = (g: number) => ({
  x: kf(g, [[ARM_IN, H_OUT.x], [HOVER, H_HOVER.x, E.out], [CONTACT, C_HAND.x, E.inOut], [RELEASE, C_HAND.x], [RELEASE_END, H_REL.x, E.inOut], [ARM_GONE, H_GONE.x, E.in]]),
  y: kf(g, [[ARM_IN, H_OUT.y], [HOVER, H_HOVER.y, E.out], [CONTACT, C_HAND.y, E.inOut], [RELEASE, C_HAND.y], [RELEASE_END, H_REL.y, E.inOut], [ARM_GONE, H_GONE.y, E.in]]),
});

const ShotPlinth: React.FC<{g: number}> = ({g}) => {
  const hand = handAt(g);
  const held = g < CONTACT;
  // carried: the sensor hangs HOLD below her fist; set down: it stands on its grip foot (her fist still on it to RELEASE)
  const sp0 = held ? {x: hand.x, y: hand.y + HOLD * S1K} : C_SENSOR;
  const gripping = g < RELEASE;
  // she lets go and her hand clears it; only then does it rock once about the grip foot and settle (about ±4°)
  const teeter = 5.5 * ring(g, RELEASE_END, 0.8, 0.2);
  const foot = 14 * S1K;
  // the opening move from S5's last framing; the rope layer's parallax depth eases in with it (S5 draws it at depth 1)
  const open = tw(g, K.start, OPEN_DUR, E.inOut);
  const setSw = lerp(S5_SET_SW, OUTLINE, open);
  const s5Led = g >= K.s5Led && g < K.s5Led + 40 ? (Math.floor((g - K.s5Led) / 5) % 2 === 0 ? 1 : 0) : 0;
  const reveal = tw(g, K.found + 2, 24, E.inOut);
  const led = tw(g, K.found, 5);
  const tickT = g >= CONTACT && g < CONTACT + 7 ? 1 - (g - CONTACT) / 7 : 0;
  const armVisible = g >= ARM_IN && g <= ARM_GONE;
  const push = tw(g, PUSH0, PUSH_DUR, E.inOut);
  const c0 = camLerp(camLerp(CAM_S5_END, CAM_PLINTH_WIDE, open), CAM_PLINTH_CLOSE, push);
  const cam: Cam = {...c0, zoom: c0.zoom * camKick(g, [CONTACT], 0.01)};
  const boxRight = sensorPoint('boxRight', S1K);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer>
          <MuseumSet plate1={sp(g, CONTACT + 4, SOFT)} plate2={sp(g, K.mit, SOFT)} sw={setSw} stoolLed={s5Led} />
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {armVisible && <ReachArm hand={hand} shoulder={S1_SHOULDER} k={S1K} skin={CAST.checker.skin} sleeve={CAST.checker.overlayColor ?? C.coral} />}
            {/* she carries it in (parked above the frame until then: S5's end framing sees higher than the plinth shots) */}
            {g >= ARM_IN && (
              <g transform={`translate(${sp0.x} ${sp0.y}) rotate(${teeter.toFixed(3)} 0 ${foot})`}>
                <HandheldSensor scale={S1K} reveal={reveal} led={led} />
              </g>
            )}
            {/* her fingers round the grip while she holds it; on RELEASE they open and the mitt slides out from behind */}
            {armVisible && gripping && <GripFingers x={hand.x} y={hand.y} k={S1K} skin={CAST.checker.skin} />}
            {/* contact marks at the grip foot, on the slab line */}
            {tickT > 0 && (
              <g stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={tickT}>
                <path d={`M ${C_SENSOR.x - 24} ${SENSOR_SPOT.y - 4} L ${C_SENSOR.x - 44} ${SENSOR_SPOT.y - 14}`} />
                <path d={`M ${C_SENSOR.x + 24} ${SENSOR_SPOT.y - 4} L ${C_SENSOR.x + 44} ${SENSOR_SPOT.y - 14}`} />
              </g>
            )}
          </svg>
          <GadgetIcons tPhone={sp(g, K.phones, SNAP)} tGadget={sp(g, K.gadgets, SNAP)} />
          <MuseumLabel x={1214} y={232} w={600} line1="time-of-flight sensors" line2="(LiDAR)" t={sp(g, K.tof, SOFT)} t2={tw(g, K.lidar, 8)} leaderTo={{x: C_SENSOR.x + boxRight.x + 4, y: C_SENSOR.y + boxRight.y}} />
        </Layer>
        <Layer depth={lerp(1, 1.06, open)}>
          <VelvetRope sw={setSw} />
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

/* ================================================================== S6.2 · not on your phone (yet) */

const ShotPhone: React.FC<{g: number}> = ({g}) => {
  const slide = sp(g, PHONE_IN, SOFT);
  const px = 470;
  const py = 150 + (1 - slide) * 1000;
  const lockY = drop(g, LOCK_LAND, 560, 10);
  const shut = tw(g, K.priv - 3, 3, E.in);
  const sq = impact(g, K.priv, 0.1, 9);
  const veil = tw(g, LOCK_LAND, 10);
  const lockLocal = {x: PHONE_SCREEN.x + PHONE_SCREEN.w / 2, y: PHONE_SCREEN.y + 330};
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <GenericPhone x={px} y={py} veil={veil}>
          {g >= LOCK_LAND - 12 && <Padlock x={lockLocal.x} y={lockLocal.y + lockY} scale={1.2} shut={shut} squash={sq} />}
        </GenericPhone>
      </svg>
      <Label x={px + PHONE.w + 110} y={455} t={sp(g, K.yet, SOFT)} display size={60} align="left">
        not on your phone (yet):
      </Label>
      {/* lands with the padlock (not after the snap): it must be readable for > 1 s before the cut on s32 */}
      <Label x={px + PHONE.w + 110} y={545} t={sp(g, LABEL_PRIV, SOFT)} size={50} color={C.coralDeep} align="left">
        raw data kept private
      </Label>
    </AbsoluteFill>
  );
};

/* ================================================================== S6.3 · tough customers (three cards) */

const CARD = {w: 560, h: 660, y: 120, xs: [80, 680, 1280], art: 560};

const Card: React.FC<{i: number; g: number; label: React.ReactNode; children: React.ReactNode}> = ({i, g, label, children}) => {
  const e = sp(g, CARD_T[i], FIRM);
  if (e <= 0) return null;
  const act = tw(g, CARD_ACT[i], 8);
  return (
    <div style={{position: 'absolute', left: CARD.xs[i], top: CARD.y + (1 - e) * 760, width: CARD.w, height: CARD.h, opacity: Math.min(1, e * 3) * lerp(0.42, 1, act)}}>
      <div style={{position: 'absolute', left: 12, top: 14, width: CARD.w, height: CARD.h, borderRadius: 24, background: C.shadow}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: CARD.w, height: CARD.h, borderRadius: 24, overflow: 'hidden', background: C.cream}}>
        {children}
        <div style={{position: 'absolute', left: 0, top: CARD.art, width: CARD.w, height: CARD.h - CARD.art, background: C.paper, borderTop: `${OUTLINE}px solid ${C.ink}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 36, color: C.ink, lineHeight: 1.2}}>
          {label}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: CARD.w, height: CARD.h, borderRadius: 24, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
    </div>
  );
};

/** Two-part label whose second part fades in (space reserved, so the settled label never moves). */
const TwoPart: React.FC<{a: string; b: React.ReactNode; ta: number; tb: number}> = ({a, b, ta, tb}) => (
  <div style={{display: 'flex', gap: 12, whiteSpace: 'nowrap'}}>
    <span style={{opacity: clamp01(ta * 1.8)}}>{a}</span>
    <span style={{opacity: clamp01(tb * 1.8)}}>{b}</span>
  </div>
);

const CardBeam: React.FC<{g: number}> = ({g}) => {
  const beam = tw(g, K.weak - 4, 8);
  const u = tw(g, PULSE0, PULSE_DUR, E.linear);
  const v = tw(g, ECHO0, ECHO_DUR, E.linear);
  const sx = 152;
  const wx = 452;
  const cy = 284;
  const scat = g >= PULSE0 + PULSE_DUR ? 1 - tw(g, PULSE0 + PULSE_DUR, 12) : 0;
  return (
    <svg width={CARD.w} height={CARD.art} style={{position: 'absolute', left: 0, top: 0}}>
      {/* the relay wall (top view), the dim beam and its tiny echo */}
      <rect x={wx} y={48} width={48} height={470} rx={8} fill="#F5E4C6" stroke={C.ink} strokeWidth={OUTLINE} />
      {beam > 0 && <path d={`M ${sx} ${cy - 8} L ${wx} ${cy - 70} L ${wx} ${cy + 70} L ${sx} ${cy + 8} Z`} fill={C.saffronLight} opacity={0.55 * beam} />}
      {u > 0 && u < 1 && <PulseDot x={sx + (wx - 20 - sx) * u} y={cy} r={20} intensity={0.35} opacity={0.95} />}
      {scat > 0 && (
        <g stroke={C.saffron} strokeWidth={3.5} strokeLinecap="round" opacity={0.7 * scat}>
          {[-50, -25, 0, 25, 50].map((a) => {
            const r = (a * Math.PI) / 180;
            return <line key={a} x1={wx - 6} y1={cy} x2={wx - 6 - Math.cos(r) * 60} y2={cy + Math.sin(r) * 60} />;
          })}
        </g>
      )}
      {v > 0 && v < 1 && <PulseDot x={wx - 14 + (sx + 4 - (wx - 14)) * v} y={cy + 4} r={10} intensity={0} opacity={0.6} />}
      <SensorTop asGroup x={112} y={cy} size={120} facing={90 + 6 * ring(g, K.tough, 0.9, 0.17)} firing={u > 0 && u < 0.2 ? 0.4 : 0} />
    </svg>
  );
};

const CardModule: React.FC<{g: number}> = ({g}) => (
  <svg width={CARD.w} height={CARD.art} style={{position: 'absolute', left: 0, top: 0}}>
    <ResearchModule x={CARD.w / 2} y={278} dots={tw(g, K.hundred, 16, E.linear)} listen={tw(g, K.listening, 22, E.linear)} />
  </svg>
);

/** Card 3: the checker beside her sensor on its stand; on "hold" she lifts it, on "jiggles" it jiggles. */
const JIG_SEED = 0;
const CardJiggle: React.FC<{g: number}> = ({g}) => {
  const floorY = 528;
  const sc = 1.1;
  const ch = {x: 178, y: floorY, scale: sc, frame: g, seed: 4, life: 0.45};
  const G0 = {x: 352, y: 300};
  const G1 = {x: 334, y: 256};
  const glance = 1 - tw(g, JIG0 + 22, 10, E.inOut);
  const base: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, lookX: 0.6 * glance, lookY: 0.35 * glance, tilt: 2 * glance});
  const pose0: Pose2 = {...base, lid: (base.lid ?? 0) + 0.14 * sp(g, JIG0 + 20, SOFT)};
  // jiggle: a decaying shake that never quite stops while it is held
  const jt = g - JIG0;
  const env = jt < 0 ? 0 : clamp01(jt / 3) * (0.3 + 0.7 * Math.exp(-jt * 0.06));
  const jrot = env * 8 * Math.sin(jt * 1.9 + JIG_SEED);
  const jdx = env * 3.2 * Math.sin(jt * 2.7 + 0.5);
  const jdy = env * 2.4 * Math.sin(jt * 3.4 + 1.3);
  const lift = tw(g, GRAB + 2, LIFT_DUR, E.inOut);
  const target = {x: lerp(G0.x, G1.x, lift) + jdx, y: lerp(G0.y, G1.y, lift) + jdy};
  const grabbed = g >= GRAB;
  // elbow down: with the elbow up the forearm hid behind the box and the hand looked detached from the arm
  let armR = reach2(ch, pose0, 1, target.x, target.y, 1);
  if (!grabbed) {
    const r = tw(g, REACH0, GRAB - REACH0, E.inOut);
    const a1 = reach2(ch, pose0, 1, G0.x, G0.y, 1);
    armR = {a: lerp(IDLE2.armR.a, a1.a, r), b: lerp(IDLE2.armR.b, a1.b, r)};
  }
  const pose: Pose2 = {...pose0, armR};
  const sensorEl = <HandheldSensor scale={1} rotate={jrot} skin={CAST.checker.skin} led={1} reveal={1} />;
  const box = {x: target.x - 3 * sc, y: target.y - 79 * sc};
  const lines = env > 0.25 ? clamp01((env - 0.25) * 2.5) : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: CARD.w, height: CARD.art}}>
      <svg width={CARD.w} height={CARD.art} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={0} width={CARD.w} height={floorY - 24} fill="#F5E4C6" />
        <rect x={-10} y={floorY - 42} width={CARD.w + 20} height={18} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        <rect x={-10} y={floorY - 24} width={CARD.w + 20} height={200} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
        <SensorStand x={G0.x} y={G0.y + 14 * sc} floorY={floorY} k={sc} />
      </svg>
      <Character2 look={CAST.checker} pose={pose} frame={g} seed={ch.seed} x={ch.x} y={ch.y} scale={sc} life={ch.life} holdR={grabbed ? sensorEl : undefined} />
      <svg width={CARD.w} height={CARD.art} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {!grabbed && (
          <g transform={`translate(${G0.x} ${G0.y}) scale(${sc})`}>
            <HandheldSensor scale={1} led={1} reveal={1} />
          </g>
        )}
        {lines > 0 && (
          <g fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={lines}>
            <path d={`M ${box.x - 66} ${box.y - 22} Q ${box.x - 80} ${box.y} ${box.x - 66} ${box.y + 22}`} />
            <path d={`M ${box.x - 84} ${box.y - 14} Q ${box.x - 94} ${box.y} ${box.x - 84} ${box.y + 14}`} />
            <path d={`M ${box.x + 72} ${box.y - 22} Q ${box.x + 86} ${box.y} ${box.x + 72} ${box.y + 22}`} />
            <path d={`M ${box.x + 90} ${box.y - 14} Q ${box.x + 100} ${box.y} ${box.x + 90} ${box.y + 14}`} />
          </g>
        )}
      </svg>
    </div>
  );
};

const ShotCards: React.FC<{g: number}> = ({g}) => (
  <AbsoluteFill style={{background: C.paper}}>
    {/* the beam card is a schematic: same guard-rail chip, same place as in S6.4-S6.6 */}
    <div style={{position: 'absolute', right: 96, top: 46, opacity: tw(g, K.weak - 4, 8)}}>
      <Chip tone="paper" size={30}>
        illustrative
      </Chip>
    </div>
    <Card i={0} g={g} label={<TwoPart a="weak laser" b="→ fainter echo" ta={tw(g, K.weak + 2, 8)} tb={tw(g, K.fainter, 8)} />}>
      <CardBeam g={g} />
      <div style={{position: 'absolute', left: 22, top: 20, opacity: tw(g, K.weak - 4, 8)}}>
        <Chip tone="paper" size={30}>
          slowed down
        </Chip>
      </div>
    </Card>
    <Card
      i={1}
      g={g}
      label={
        <>
          <div style={{opacity: clamp01(tw(g, K.grade, 8) * 1.8)}}>smartphone-grade device</div>
          <div style={{opacity: clamp01(tw(g, K.hundred, 8) * 1.8)}}>
            (team's own) · <span style={{fontFamily: F.mono, fontWeight: 700}}>≈ 100</span> pixels
          </div>
        </>
      }
    >
      <CardModule g={g} />
    </Card>
    <Card i={2} g={g} label={<TwoPart a="held in hand" b="→ jiggles" ta={tw(g, K.hold, 8)} tb={tw(g, K.jiggles, 8)} />}>
      <CardJiggle g={g} />
    </Card>
  </AbsoluteFill>
);

/* ================================================================== the plan board content (S6.4–S6.6) */

type BandSet = {specs: BandSpec[]; opacity: number; fill?: number};
type PlanState = {
  sensor: P2;
  aim: P2;
  sensorRot?: number;
  sensorGhost?: number;
  checker: number;
  /** where the checker's token stands (default: the layout operator spot), its facing (deg), and how far her hand is
   *  on the sensor (1 = holding it, 0 = arm back at her side) */
  checkerPos?: P2;
  checkerFacing?: number;
  reachT?: number;
  guesser: P2 | null;
  guesserOpacity?: number;
  markersA: P2[];
  markersAT?: number;
  markersB?: number[];
  bands: BandSet[];
  arcsB?: number[];
  clouds: {field: ScalarField; t: number; tone: 'teal' | 'coral'}[];
  ghostLoops?: number;
  rail?: number;
  /** right panel: dashed outlines of the clouds computed at the positions he has left */
  ghosts?: {loops: P2[][]; t: number}[];
  /** right panel: breadcrumbs: a dotted line through the positions he has left to where he is, and a dot at each */
  crumbs?: {path: P2[]; dots: {p: P2; t: number}[]; t: number};
};

const rotDir = (d: P2, deg: number): P2 => {
  const r = (deg * Math.PI) / 180;
  return {x: d.x * Math.cos(r) - d.z * Math.sin(r), z: d.x * Math.sin(r) + d.z * Math.cos(r)};
};

/** RoomSet slots (world px of the plan board) for a plan state. */
const planLayers = (s: PlanState) => {
  const toPx = planPx;
  const op = planPx(s.checkerPos ?? OPER);
  const spx = planPx(s.sensor);
  const aimPx = planPx(s.aim);
  const dir = rotDir(sub(s.aim, s.sensor), s.sensorRot ?? 0);
  const railA = planPx(P(1.1, SA.z));
  const railB = planPx(P(1.82, SA.z));
  const backdrop = (
    <PlanSvg>
      {s.bands.map((b, k) =>
        b.opacity > 0.001 ? (
          <g key={k} opacity={b.opacity}>
            {b.specs.map((sp_, i) => (
              <Band key={i} asGroup center={sp_.W} r={sp_.r} halfWidth={sp_.halfWidth} toPx={toPx} t={1} clip={{x0: 0, x1: 4, z0: 0, z1: 3}} tone="blue" fillOpacity={b.fill ?? 0.2} />
            ))}
          </g>
        ) : null,
      )}
      {s.arcsB &&
        WB.map((w, i) => {
          if (s.arcsB![i] <= 0) return null;
          // a candidate arc segment through the hidden spot (±30° of arc), drawn on from the wall side
          // grown outward from the hidden spot both ways (drawn on from the wall end, the first stroke appeared far
          // from both the new listening spot and the person)
          const aH = Math.atan2(HA.z - w.z, HA.x - w.x);
          const half = 0.52 * s.arcsB![i];
          return <CandidateArc key={i} asGroup center={w} r={BANDS_B[i].r} a0={aH - half} a1={aH + half} toPx={toPx} t={1} clip={{x0: 0, x1: 4, z0: 0, z1: 3}} tone="blue" width={3} />;
        })}
      {(s.rail ?? 0) > 0.001 && (
        <g opacity={s.rail}>
          <rect x={railA.x} y={railA.y - 9} width={railB.x - railA.x} height={18} rx={9} fill={C.paperDeep} stroke={C.ink} strokeWidth={3} />
          {[SB, SA].map((p, i) => {
            const q = planPx(p);
            return <circle key={i} cx={q.x} cy={q.y} r={7} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />;
          })}
        </g>
      )}
    </PlanSvg>
  );
  const children = (
    <PlanSvg>
      {s.markersA.map((w, i) => (
        <WallMarker key={`a${i}`} asGroup p={w} toPx={toPx} t={s.markersAT ?? 1} active={0.75} size={9} />
      ))}
      {s.markersB &&
        WB.map((w, i) => (s.markersB![i] > 0 ? <WallMarker key={`b${i}`} asGroup p={P(w.x, B_ROW_Z)} toPx={toPx} t={s.markersB![i]} active={1} tone="teal" size={9} /> : null))}
      {/* right panel breadcrumbs UNDER his token: the dashed outlines of the clouds computed at the positions he has left
          and the dotted line through them to where he stands (over the token they cut across his hair and shirt) */}
      {s.ghosts?.map((gh, k) =>
        gh.t > 0.001 ? (
          <g key={`gh${k}`} opacity={gh.t} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 6">
            <path d={gh.loops.map((l) => polyD(l.map(toPx), true)).join(' ')} stroke={C.cream} strokeWidth={5.5} />
            <path d={gh.loops.map((l) => polyD(l.map(toPx), true)).join(' ')} stroke={C.ink} strokeWidth={2.5} />
          </g>
        ) : null,
      )}
      {s.crumbs && s.crumbs.t > 0.001 && s.crumbs.path.length > 1 && (
        <g opacity={s.crumbs.t} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={polyD(s.crumbs.path.map(toPx), false)} stroke={C.cream} strokeWidth={7} />
          <path d={polyD(s.crumbs.path.map(toPx), false)} stroke={C.ink} strokeWidth={3} strokeDasharray="1 6" />
        </g>
      )}
      {s.guesser && (s.guesserOpacity ?? 1) > 0.001 && <GuesserToken asGroup x={planPx(s.guesser).x} y={planPx(s.guesser).y} size={TOKEN_PX} facing={-90} opacity={s.guesserOpacity ?? 1} />}
      {s.clouds.map((c, i) => (c.t > 0 ? <CloudShape key={i} toPx={toPx} field={c.field} t={c.t} tone={c.tone} /> : null))}
      {/* the previous patch as a dashed ghost, and the followed position (on top, so the token never hides them) */}
      {s.ghostLoops && s.ghostLoops > 0 && (
        <path d={CLOUD_A_LOOPS.map((l) => polyD(l.map(toPx), true)).join(' ')} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray="5 6" strokeLinecap="round" opacity={s.ghostLoops} />
      )}
      {/* right panel breadcrumbs: the saffron dots at the positions he has left, over the token and the cloud with a
          cream halo (the latest one sits on his shoulder once he has moved on) */}
      {s.crumbs && s.crumbs.t > 0.001 && (
        <g opacity={s.crumbs.t}>
          {s.crumbs.dots.map((d, k) => {
            if (d.t <= 0.001) return null;
            const q = planPx(d.p);
            const r = 6 * Math.min(1, 0.6 + 0.4 * d.t);
            return (
              <g key={`dot${k}`} opacity={Math.min(1, d.t * 1.5)}>
                <circle cx={q.x} cy={q.y} r={r + 3} fill={C.cream} />
                <circle cx={q.x} cy={q.y} r={r} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
              </g>
            );
          })}
        </g>
      )}
      {s.checker > 0.001 && (() => {
        const rt = s.reachT ?? 1;
        // letting go: the hand comes back from the sensor toward her side, then the arm is gone (it is tucked under)
        const rest = {x: op.x + (spx.x - op.x) * 0.3, y: op.y + (spx.y - op.y) * 0.3};
        const reach = rt > 0.05 ? {x: lerp(rest.x, spx.x, rt), y: lerp(rest.y, spx.y, rt)} : undefined;
        return <CheckerToken asGroup x={op.x} y={op.y} size={TOKEN_PX} facing={s.checkerFacing ?? facingOf(aimPx.x - op.x, aimPx.y - op.y)} opacity={s.checker} reach={reach} />;
      })()}
      {(s.sensorGhost ?? 0) > 0.001 && (() => {
        const c = planPx(SA);
        const a = planPx(AIM_A);
        const deg = facingOf(a.x - c.x, a.y - c.y);
        const w = 0.24 * 240;
        return <rect x={-w / 2} y={-w / 4} width={w} height={w / 2} rx={6} transform={`translate(${c.x} ${c.y}) rotate(${deg})`} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray="5 5" opacity={s.sensorGhost} />;
      })()}
      <SensorGlyph asGroup p={s.sensor} dir={dir} toPx={toPx} size={0.24 * 240} />
    </PlanSvg>
  );
  return {backdrop, children};
};

const PlanWindow: React.FC<{geo: PanelGeo; cam: Cam; state: PlanState; veil?: React.ReactNode; opacity?: number; shadow?: number; rot?: number}> = ({geo, cam, state, veil, opacity, shadow, rot}) => {
  const {backdrop, children} = planLayers(state);
  return (
    <PlanView geo={geo} cam={cam} backdrop={backdrop} veil={veil} opacity={opacity} shadow={shadow} rot={rot}>
      {children}
    </PlanView>
  );
};

/** The plan as the estimate shows it at the end of S6.4 / start of S6.5 (frame A, crisp cloud on H_A). */
const baseState = (): PlanState => ({
  sensor: SA,
  aim: AIM_A,
  checker: 1,
  guesser: null,
  markersA: WA,
  bands: [{specs: BANDS_A, opacity: 1}],
  clouds: [{field: CLOUD_A, t: 1, tone: 'teal'}],
});

/* ================================================================== S6.4 · night mode (burst of dim frames) */

/** S6.4 layout: the six quick shots land scattered across the whole frame like a burst of tossed photos, slide together
 *  into one neat pile at the centre on "stack", and the pile becomes one larger, crisp card on "into one" (which then
 *  grows into the S6.5 plan). Each entry: top-left x, y and a small tilt (deg). */
const FW = 600;
const FH = (FW * 9) / 16;
const SCATTER = [
  {x: 110, y: 215, r: -4},
  {x: 660, y: 168, r: 3},
  {x: 1210, y: 222, r: -3},
  {x: 190, y: 570, r: 3},
  {x: 720, y: 600, r: -2},
  {x: 1215, y: 556, r: 4},
];
const PILE = {x: 660, y: 300};
const pileAt = (k: number) => ({x: PILE.x + (k - 2.5) * 7, y: PILE.y + (k - 2.5) * 6, r: (k % 2 === 0 ? -1 : 1) * 1.2});
const RESULT = {x: 500, y: 212, w: 920};
const GRAIN = Array.from({length: N_FRAMES}, (_, k) =>
  Array.from({length: 90}, (_, i) => ({u: rand(k * 977 + i * 3 + 1), v: rand(k * 571 + i * 5 + 2), r: 2.2 + 2.2 * rand(k * 131 + i * 7 + 3), a: 0.35 + 0.45 * rand(k * 71 + i * 11 + 4)})),
);

const Grain: React.FC<{k: number; w: number; h: number}> = ({k, w, h}) => (
  <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
    {GRAIN[k].map((d, i) => (
      <circle key={i} cx={d.u * w} cy={d.v * h} r={d.r} fill={i % 3 === 0 ? C.cream : C.inkSoft} opacity={d.a} />
    ))}
  </svg>
);

const dimState = (k: number): PlanState => ({
  ...baseState(),
  bands: [{specs: DIM_BANDS[k], opacity: 0.8, fill: 0.14}],
  clouds: [{field: DIM_CLOUDS[k], t: 1, tone: 'teal'}],
});

const MoonChip: React.FC<{t: number}> = ({t}) =>
  t <= 0 ? null : (
    <div style={{position: 'absolute', left: 960, top: 112, transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * Math.min(1, t)})`, opacity: Math.min(1, t * 1.8)}}>
      <Chip tone="paper" size={36} style={{color: C.ink, border: `3px solid ${C.ink}`}}>
        <svg width={34} height={34} viewBox="-17 -17 34 34" style={{flex: 'none'}}>
          <path d="M 6 -13 A 13 13 0 1 0 12 7 A 10 10 0 1 1 6 -13 Z" fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        </svg>
        our analogy: night mode
      </Chip>
    </div>
  );

const ShotBurst: React.FC<{g: number}> = ({g}) => {
  const out = 1 - tw(g, GROW0, 8);
  const RH = (RESULT.w * 9) / 16;
  const frames = Array.from({length: N_FRAMES}, (_, k) => {
    const pop = sp(g, SHOT_T[k], SNAP);
    if (pop <= 0) return null;
    const st = tw(g, STACK0 + k * 2, 16, E.inOut);
    const mg = tw(g, MERGE0 + (N_FRAMES - 1 - k), 16, E.inOut);
    const c = SCATTER[k];
    const pl = pileAt(k);
    const x0 = lerp(c.x, pl.x, st);
    const y0 = lerp(c.y, pl.y, st);
    const wBase = lerp(FW, RESULT.w, mg);
    const x = lerp(x0, RESULT.x, mg);
    const y = lerp(y0, RESULT.y, mg);
    const w = wBase * (0.9 + 0.1 * Math.min(1.05, pop));
    const rot = lerp(lerp(c.r, pl.r, st), 0, mg);
    const op = Math.min(1, (g - SHOT_T[k] + 1) / 3) * (1 - tw(g, MERGE0 + 12, 8));
    if (op <= 0) return null;
    const geo = cardGeo(x + (wBase - w) / 2, y + ((wBase - w) * 9) / 32, w, 14);
    return (
      <PlanWindow
        key={k}
        geo={geo}
        cam={CAM_PLAN_ACT}
        state={dimState(k)}
        opacity={op}
        shadow={1}
        rot={rot}
        veil={
          <>
            <div style={{position: 'absolute', left: 0, top: 0, width: geo.w, height: geo.h, background: C.paperDeep, opacity: 0.55}} />
            <Grain k={k} w={geo.w} h={geo.h} />
          </>
        }
      />
    );
  });
  const clearT = tw(g, MERGE0 + 10, 10);
  // after the last frame has settled on the pile (the label sat over a frame still sliding in)
  const pileLabel = Math.max(K.many, STACK0 + 2 * (N_FRAMES - 1) + 18);
  const resultLabel = Math.max(K.better, MERGE0 + 18);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {frames}
      {clearT > 0 && g < GROW0 && <PlanWindow geo={cardGeo(RESULT.x, RESULT.y, RESULT.w, 16)} cam={CAM_PLAN_ACT} state={baseState()} opacity={clearT} shadow={1} />}
      {/* stays put into S6.5, where GuardChips draws the same chip in the same place */}
      <div style={{position: 'absolute', right: 96, top: 46, opacity: tw(g, SHOT_T[0], 8)}}>
        <Chip tone="paper" size={30}>
          illustrative
        </Chip>
      </div>
      <div style={{opacity: out}}>
        <MoonChip t={sp(g, K.night, SOFT)} />
        <Label x={PILE.x + FW / 2} y={PILE.y + FH + 58} t={sp(g, pileLabel, SOFT) * (1 - tw(g, MERGE0, 8))} size={40}>
          many quick, dim frames
        </Label>
        <Label x={RESULT.x + RESULT.w / 2} y={RESULT.y + RH + 52} t={sp(g, resultLabel, SOFT)} size={42}>
          one better estimate
        </Label>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== S6.5 / S6.6 · the motion problem and the fix */

const CAM_L = camOnPlan(1.95, 0.51, 2);
/** panned 0.06 m right of centre on the left panel's framing (review r1 D08): H_D, the track's last position, keeps his
 *  token inside the 5 % margin (asserted below); the still sensor and the checker stay in the panel */
const CAM_R = camOnPlan(2.16, 0.51, 2);
const GEO_L0: PanelGeo = {x: 0, y: 0, w: 960, h: 1080, tx: 0, ty: 0, s: 1, radius: 0, border: 0};
const GEO_R0: PanelGeo = {x: 960, y: 0, w: 960, h: 1080, tx: 0, ty: 0, s: 1, radius: 0, border: 0};
const GEO_L1: PanelGeo = {x: 24, y: 200, w: 924, h: 730, tx: -474, ty: 25, s: 1, radius: 22, border: 1};
const GEO_R1: PanelGeo = {x: 972, y: 200, w: 924, h: 730, tx: 474, ty: 25, s: 1, radius: 22, border: 1};
/** 5 % safe margin (screen px) */
const SAFE_X1 = 1920 - 96;
// the right panel's track stays inside the panel and the 5 % margin: his token (facing −90, so its back edge, crown
// plus shadow, is about 0.34 of the token width right of its centre) and every position's cloud (outer level)
{
  const half = 0.34 * TOKEN_PX * CAM_R.zoom * GEO_R1.s;
  TRACK.forEach((H, k) => {
    const q = planToScreen(GEO_R1, CAM_R, H);
    if (q.x + half > SAFE_X1 || q.x - half < GEO_R1.x || q.y - half < GEO_R1.y || q.y + half > GEO_R1.y + GEO_R1.h) throw new Error(`S6.6: ${H.id}'s token leaves the right panel or the safe margin (${q.x.toFixed(0)}, ${q.y.toFixed(0)})`);
    const xs = LOOPS_TRACK[k].flat().map((p) => planToScreen(GEO_R1, CAM_R, p).x);
    if (Math.max(...xs) > SAFE_X1) throw new Error(`S6.6: the cloud at ${H.id} crosses the safe margin (x ${Math.max(...xs).toFixed(0)})`);
  });
}

/** Shared S6.5 → S6.6 state at frame g (the full plan, and both panels until they diverge). */
const motionState = (g: number): PlanState => {
  // S6.5: the jiggle (the sampled wall points end up shifted) and his step to hiddenB; S6.6 resets both
  const reset = tw(g, RESET0 + 2, 16, E.inOut);
  const shift = JIG_SHIFT * tw(g, J5 + 6, 10, E.inOut) * (1 - reset);
  const jig = ring(g, J5, 1.5, 0.16);
  const walk = tw(g, WALK0, WALK_DUR, E.inOut) * (1 - reset);
  const f2 = tw(g, K.moves - 2, 10) * (1 - tw(g, RESET0, 12));
  const smear = tw(g, SMEAR0, 24) * (1 - tw(g, RESET0, 14));
  const crisp = Math.max(1 - tw(g, K.plain, 10), tw(g, RESET0 + 8, 10));
  const sensor = P(SA.x + 0.02 * ring(g, J5, 2.1, 0.16), SA.z + 0.012 * ring(g, J5 + 1, 2.6, 0.16));
  return {
    sensor,
    aim: P(AIM_A.x + shift, 0),
    sensorRot: 14 * jig,
    checker: 1,
    guesser: lerpP(HA, HB, walk),
    guesserOpacity: tw(g, GROW0 + 4, 12),
    markersA: WA.map((w) => P(w.x + shift, 0)),
    bands: [
      {specs: BANDS_A, opacity: 1},
      {specs: BANDS_F2_DRAWN, opacity: f2},
    ],
    clouds: [
      {field: CLOUD_A, t: crisp, tone: 'teal'},
      {field: SMEAR, t: smear, tone: 'coral'},
    ],
  };
};

/** S6.6 left: the sensor goes on a rail of known positions, so the checker lets go and steps out of the panel (B1, the
 *  rail's far stop, is where she stands). */
const LETGO = RAIL0 + 2;
const EXIT0 = LETGO + 3;
const EXIT_DUR = 20;
const EXIT_TO = P(0.7, 1.15);
const leftState = (g: number): PlanState => {
  const base = motionState(g);
  const slide = tw(g, SLIDE0, SLIDE_DUR, E.inOut);
  const exit = tw(g, EXIT0, EXIT_DUR, E.inOut);
  const pos = lerpP(OPER, EXIT_TO, exit);
  const f0 = facingOf(planPx(AIM_A).x - planPx(OPER).x, planPx(AIM_A).y - planPx(OPER).y);
  const f1 = facingOf(planPx(EXIT_TO).x - planPx(OPER).x, planPx(EXIT_TO).y - planPx(OPER).y);
  const turn = tw(g, EXIT0 - 2, 8, E.inOut);
  const tight = tw(g, TIGHT0, 26, E.inOut);
  // the B1 bands fade in at their real width; the cloud tweens from "no B1 constraint" (a band so wide it accepts the
  // whole A patch) to the full one, so the patch visibly shrinks instead of popping
  const hwB = lerp(0.6, HW1, tight);
  const fieldBands = BANDS_B.map((b) => ({...b, halfWidth: hwB}));
  const cloudT = base.clouds[0].t;
  const field = tight > 0 ? possibleCloud(GRID_L, [...BANDS_A, ...fieldBands]) : CLOUD_A;
  return {
    ...base,
    checker: 1 - tw(g, EXIT0 + EXIT_DUR - 4, 4),
    checkerPos: pos,
    checkerFacing: f0 + (((f1 - f0 + 540) % 360) - 180) * turn,
    reachT: 1 - tw(g, LETGO, 6, E.inOut),
    sensor: lerpP(SA, SB, slide),
    aim: lerpP(AIM_A, AIM_B, slide),
    sensorGhost: 0.8 * tw(g, SLIDE0 + 6, 8),
    rail: tw(g, RAIL0, 10),
    markersB: WB.map((_, i) => tw(g, K.listen35 + 3 * i, 9)),
    arcsB: WB.map((_, i) => tw(g, ARCS0 + 3 * i, 20, E.inOut)),
    bands: [...base.bands, {specs: BANDS_B, opacity: tw(g, TIGHT0 - 6, 14), fill: 0.2}],
    ghostLoops: 0.85 * tw(g, TIGHT0 + 6, 8),
    clouds: [{field, t: cloudT, tone: 'teal'}, base.clouds[1]],
  };
};

/** Progress along the track at frame g: 0 at H_A … 3 at H_D (step k eases from k to k + 1). */
const trackU = (g: number) => STEP_T.reduce((u, t0) => u + tw(g, t0, STEP_DUR, E.inOut), 0);
const trackAt = (u: number): P2 => {
  const k = Math.min(TRACK.length - 2, Math.floor(u));
  return lerpP(TRACK[k], TRACK[k + 1], clamp01(u - k));
};

/** S6.6 right: the sensor and the checker stay still; he steps H_A → H_B → H_C → H_D; the bands and the cloud are
 *  recomputed at each position, CLOUD_LAG frames behind him (the estimate visibly catches up after each step); each
 *  position he leaves keeps a saffron dot and a dashed outline of the cloud computed there, joined by a dotted line. */
const rightState = (g: number): PlanState => {
  const base = motionState(g);
  if (g < STEP_T[0]) return base;
  const u = trackU(g);
  const uc = trackU(g - CLOUD_LAG);
  const pos = trackAt(u);
  const est = trackAt(uc);
  const bands = bandsFor(WA, est, HW1);
  const settled = Math.abs(uc - Math.round(uc)) < 1e-6;
  const left = STEP_T.filter((t0) => g >= t0).length; // positions he has left (0..3)
  return {
    ...base,
    guesser: pos,
    bands: [{specs: bands, opacity: 1}],
    clouds: [{field: settled ? CLOUD_TRACK[Math.round(uc)] : possibleCloud(GRID_R, bands), t: 1, tone: 'teal'}],
    ghosts: STEP_T.map((t0, k) => ({loops: LOOPS_TRACK[k], t: 0.5 * tw(g, t0 + CLOUD_LAG + 2, 8)})),
    crumbs: {
      path: [...TRACK.slice(0, left), pos],
      dots: STEP_T.map((t0, k) => ({p: TRACK[k], t: tw(g, t0 + 3, 6)})),
      t: tw(g, STEP_T[0] + 2, 6),
    },
  };
};

/** A paper backing behind a chip that knocks out the plan's wall ruler ticks under it (review r1 D27: in S6.5 the ticks
 *  ran through the chips). Inside the chip's opacity wrapper, so it fades with the chip and the ticks come back with it. */
const Knock: React.FC<{knock: number; children: React.ReactNode}> = ({knock, children}) => (
  <div style={{position: 'relative'}}>
    {knock > 0.001 && <div style={{position: 'absolute', left: -6, right: -6, top: -10, bottom: -16, background: C.paper, opacity: Math.min(1, knock)}} />}
    <div style={{position: 'relative'}}>{children}</div>
  </div>
);

const GuardChips: React.FC<{t: number; tRight?: number; knock?: number}> = ({t, tRight = t, knock = 0}) => (
    <>
      <div style={{position: 'absolute', left: 96, top: 46, opacity: t}}>
        <Knock knock={knock}>
          <Chip tone="paper" size={30}>
            simplified picture (2D)
          </Chip>
        </Knock>
      </div>
      <div style={{position: 'absolute', right: 96, top: 46, opacity: tRight}}>
        <Knock knock={knock}>
          <Chip tone="paper" size={30}>
            illustrative
          </Chip>
        </Knock>
      </div>
    </>
  );

const ShotPlan: React.FC<{g: number}> = ({g}) => {
  const grow = tw(g, GROW0, GROW_DUR, E.inOut);
  const split = tw(g, SPLIT0, SPLIT_DUR, E.inOut);
  // the right panel waits, dimmed, while the left one is being described; it lights up on "Keep"
  const dimR = tw(g, K.move - 8, 10) * (1 - tw(g, K.keep35 - 6, 10));
  const ui = tw(g, GROW0 + GROW_DUR - 4, 8);
  const st = motionState(g);
  // S6.5 labels
  const frameChip = g < K.plain ? tw(g, GROW0 + GROW_DUR, 8) * (1 - tw(g, K.plain, 8)) : 0;
  const frameNo = g < K.person ? 1 : 2;
  const smearLabel = sp(g, K.smear, SOFT) * (1 - tw(g, RESET0, 10));
  const photoIn = sp(g, PHOTO0, SNAP);
  const photoOut = tw(g, RESET0 - 2, 12, E.in);
  // S6.6 labels (placed from the panels' final framing)
  const lWall = planToScreen(GEO_L1, CAM_L, P((WB[0].x + WA[3].x) / 2, 0));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {split <= 0 ? (
        <PlanWindow geo={lerpGeo(cardGeo(RESULT.x, RESULT.y, RESULT.w, 16), FULL_GEO, grow)} cam={CAM_PLAN_ACT} state={st} shadow={1 - grow} />
      ) : (
        <>
          <PlanWindow geo={lerpGeo(GEO_L0, GEO_L1, split)} cam={camLerp(CAM_PLAN_ACT, CAM_L, split)} state={leftState(g)} />
          <PlanWindow
            geo={lerpGeo(GEO_R0, GEO_R1, split)}
            cam={camLerp(CAM_PLAN_ACT, CAM_R, split)}
            state={rightState(g)}
            veil={dimR > 0.001 ? <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: C.paper, opacity: 0.55 * dimR}} /> : undefined}
          />
        </>
      )}
      {/* the full plan's wall ruler runs under the chips until the split drops the panels below them */}
      <GuardChips t={ui} tRight={1} knock={1 - split} />
      {frameChip > 0 && (
        <div style={{position: 'absolute', left: 96, top: 846, opacity: frameChip}}>
          <Chip tone="ink" size={34} style={{fontFamily: F.mono, fontWeight: 700}}>
            frame {frameNo}
          </Chip>
        </div>
      )}
      <Label x={1010} y={782} t={smearLabel} size={40} align="left" backing>
        plain averaging → smear <span style={{fontWeight: 700, color: C.inkSoft, fontSize: 34}}>(illustrative)</span>
      </Label>
      {photoIn > 0 && photoOut < 1 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateX(${photoOut * 760}px)`, opacity: 1 - photoOut}}>
          <LongExposurePhoto x={1650} y={392} rot={-4} t={photoIn} frame={g} />
        </div>
      )}
      {/* S6.6 */}
      <Label x={960} y={74} t={sp(g, K.one, SNAP)} display size={50} backing>
        one unknown at a time
      </Label>
      <Label x={486} y={164} t={sp(g, K.move, SOFT)} size={38}>
        move the sensor through known positions
      </Label>
      <Label x={1434} y={164} t={sp(g, K.keep35, SOFT)} size={38}>
        keep the sensor still
      </Label>
      <Label x={lWall.x} y={lWall.y - 66} t={sp(g, K.listen35, SOFT)} size={34} color={C.tealDeep} backing>
        listening spots
      </Label>
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S6Small: React.FC = () => {
  const g = useG();
  let shot: React.ReactNode;
  if (g < CUT2) shot = <ShotPlinth g={g} />;
  else if (g < CUT3) shot = <ShotPhone g={g} />;
  else if (g < CUT4) shot = <ShotCards g={g} />;
  else if (g < GROW0) shot = <ShotBurst g={g} />;
  else shot = <ShotPlan g={g} />;
  return <AbsoluteFill style={{background: C.paper}}>{shot}</AbsoluteFill>;
};

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_museum', dur: (K.end - K.start) / 30, note: 'S6 room tone (history shelf act)'},
  // S6.1
  {f: CONTACT, kind: 'tiny_clink', note: 'sensor set down on the fourth plinth'},
  {f: K.found + 2, kind: 'readout_beep', gain: -6, note: 'the readout wakes'},
  {f: K.phones, kind: 'pop_tick', gain: -12, note: 'phone icon'},
  {f: K.gadgets, kind: 'pop_tick', gain: -12, pitch: 2, note: 'gadget icon'},
  // S6.2
  {f: PHONE_LAND, kind: 'paper_slide', gain: -8, note: 'phone slides in'},
  {f: LOCK_LAND, kind: 'thud_soft', gain: -8, note: 'padlock lands on the screen'},
  {f: K.priv, kind: 'lock_click', note: 'padlock snaps shut'},
  // S6.3
  {f: PULSE0, kind: 'sensor_pulse', gain: -8, note: 'dim pulse'},
  {f: ECHO0 + ECHO_DUR, kind: 'echo_return', gain: -12, note: 'faint echo back'},
  {f: GRAB, kind: 'tiny_clink', gain: -8, pitch: 3, note: 'lifted off the stand'},
  {f: JIG0, kind: 'partition_wobble', gain: -6, pitch: 8, note: 'jiggle rattle (small)'},
  // S6.4
  ...SHOT_T.map((t, i): Sfx => ({f: Math.max(t, CUT4), kind: 'shutter_click', gain: -4 - (i % 2) * 2, pitch: (i % 3) - 1, note: `burst frame ${i + 1}`})),
  {f: MERGE0 + 16, kind: 'pop_tick', gain: -6, note: 'frames merge into one estimate'},
  // S6.5
  {f: J5, kind: 'partition_wobble', gain: -10, pitch: 9, note: 'sensor jiggles (plan)'},
  {f: WALK0 + WALK_DUR - 2, kind: 'footstep_wood', gain: -10, note: 'he steps to hiddenB'},
  {f: PHOTO0 + 6, kind: 'card_flick', gain: -6, note: 'long-exposure photo lands'},
  // S6.6
  {f: K.one, kind: 'chip_pop', gain: -8, note: 'one unknown at a time'},
  {f: SLIDE0, kind: 'book_slide', gain: -10, pitch: 4, dur: SLIDE_DUR / 30, note: 'sensor slides along the rail'},
  {f: ARCS0, kind: 'arc_draw', gain: -8, dur: 0.8, note: 'B1 arcs draw'},
  ...STEP_T.map((t0, i): Sfx => ({f: t0 + STEP_DUR - 2, kind: 'footstep_wood', gain: -14, pitch: [1, -1, 2][i], note: `he steps to ${TRACK[i + 1].id}; the cloud follows`})),
];
