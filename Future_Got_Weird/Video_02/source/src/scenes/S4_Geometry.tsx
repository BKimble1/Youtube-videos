import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import layoutJson from '../data/layout.json';
import {C, OUTLINE} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {E, SNAP, SOFT, camPath, hop, kf, sp, tw} from '../lib/motion';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {CAM_PLAN_ACT, CAM_ROOM, HANDOFF} from '../lib/shots';
import {figureMix, projectWith, rigAt, rigStyle, tiltAt, tokenAt, viewAt} from '../lib/room';
import {LAYOUT, dist, pathSchedule, possibleCloud, sampleArc, type P2, type ScalarField} from '../lib/optics';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {Character2, EXPR, HANDS_ON_HIPS, IDLE2, settlePose, withPose, type Pose2} from '../components/v02/Cast2';
import {CheckerToken, GuesserToken} from '../components/v02/Tokens';
import {Band, LightPath, PossibleCloud, polyD} from '../components/v02/Optics';
import {facingOf} from '../components/v02/HandheldSensor';
import {Chip} from '../components/Text';
import {CAST} from '../components/cast';
import {rand} from '../lib/anim';
import {SensorStand} from '../components/v02/S4_Stand';
import {FaceInset} from '../components/v02/S4_Inset';
import {AssumptionCard, CheckMark, CrossMark, EchoCard, PhotoFrame, Pill, Ruler} from '../components/v02/S4_Parts';

/**
 * S4 · Timing becomes geometry (s17–s24). The film's central explanation, in the plan view of the one room.
 *
 *  S4.1 s17  room view (CAM_ROOM) → the signature fold to the plan (tilt 0→1, camera CAM_ROOM→CAM_PLAN_ACT);
 *            people and the sensor stand become tokens; chip "simplified picture (2D)"; the sensor flashes and listens
 *            at one wall spot (W1).
 *  S4.2 s18–19  a ruler swings out from W1 to |W1 H| and sweeps the candidate arc; ghost tokens along it; face inset:
 *            he relaxes and leans on the partition (J3a).
 *  S4.3 s20  W4: second flash, second ruler and arc; they cross at his token; camera rises to show the back halves
 *            crossing again behind the wall ("behind the wall: impossible"); inset: his smile drops (J3b).
 *  S4.4 s21  each arc splits (fuzzy timing) and thickens into a ±3.75 cm band; the overlap fills as a small patch.
 *  S4.5 s22  the two spots slide close (W2, W3): long, blurry patch; spread apart (W1, W4): it shrinks. The field is
 *            recomputed every frame from the interpolated spot positions.
 *  S4.6 s23  all four spots; seeded candidate positions scatter over the hidden side; each predicts echo times
 *            (comparison card: a miss, then a match); poor matches fade, survivors resample onto him; card
 *            "assumption: one small object".
 *  S4.7 s24  the cluster settles into the likely-location blob (the same four bands); a photo frame tries to frame
 *            him and is crossed out. Hand-off to S5: plan view, tilt 1, CAM_PLAN_ACT, tokens + blob, labels cleared.
 *
 * Geometry: every point, radius and band comes from src/data/layout.json (frame A, confocal simplification); the
 * numbers on screen are layout values (illustrative). Diagram strokes are drawn in world px scaled by 1/zoom so they
 * keep a constant on-screen weight while the camera moves; the room, tokens and sensor are world objects.
 */

/* ------------------------------------------------------------------ geometry (layout.json) */

const L = layoutJson;
const ROOM = {x0: L.room.x0, x1: L.room.x1, z0: L.room.z0, z1: L.room.z1};
const Hp: P2 = {x: L.hidden.x, z: L.hidden.z};
const Sp: P2 = {x: L.sensor.x, z: L.sensor.z};
const OPp: P2 = {x: L.operator.x, z: L.operator.z};
const WX: Record<string, number> = Object.fromEntries(L.wallSamples.map((w) => [w.id, w.x]));
const Wat = (x: number): P2 => ({x, z: L.relayWall.z});
const W1 = Wat(WX.W1);
const W2 = Wat(WX.W2);
const W3 = Wat(WX.W3);
const W4 = Wat(WX.W4);
const WALL = [W1, W2, W3, W4];
// the radii are the layout's confocal circle radii; they must equal |W H| (the arcs pass exactly through him)
const RADII = L.confocalA.map((c) => c.circle_radius_m);
WALL.forEach((w, i) => {
  if (Math.abs(dist(w, Hp) - RADII[i]) > 2e-3) throw new Error(`S4: confocalA[${i}] radius ${RADII[i]} != |W${i + 1}H| ${dist(w, Hp)}`);
});
const R1 = RADII[0];
const R4 = RADII[3];
const HW = L.bandHalfWidth.oneBin; // ±3.75 cm (one 250 ps bin), illustrative
const C_NS = L.c_m_per_ns;
const arrivalNs = (w: P2, p: P2) => (2 * dist(Sp, w) + 2 * dist(w, p)) / C_NS;
/** the mirror image of H behind the wall: where the two full circles cross again */
const Hm: P2 = {x: Hp.x, z: 2 * L.relayWall.z - Hp.z};
const AIM: P2 = {x: L.sensor.aimX, z: L.relayWall.z};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ cues (from the narration; nothing absolute) */

const K = {
  start: scene('S4').from,
  end: scene('S4').to,
  map: at('s17', 'map'),
  room: at('s17', 'room'),
  with_: at('s17', 'with'),
  simpl: at('s17', 'simplification'),
  sensor: at('s17', 'sensor'),
  flashes: at('s17', 'flashes'),
  listens: at('s17', 'listens'),
  spot17: at('s17', 'spot'),
  s18: seg('s18').from,
  measure: at('s18', 'measure'),
  how18: at('s18', 'how'),
  that18: at('s18', 'that'),
  not18: at('s18', 'not'),
  direction: at('s18', 'direction'),
  just18: at('s18', 'just'),
  far18b: at('s18', 'far', 2),
  anywhere: at('s19', 'anywhere'),
  arc19: at('s19', 'arc'),
  all19: at('s19', 'all'),
  dist19: at('s19', 'distance'),
  from19: at('s19', 'from'),
  spot19: at('s19', 'spot'),
  s19end: segEnd('s19'),
  s20: seg('s20').from,
  listen20: at('s20', 'listen'),
  second: at('s20', 'second'),
  another1: at('s20', 'another'),
  another2: at('s20', 'another', 2),
  on20: at('s20', 'on'),
  cross20: at('s20', 'cross'),
  one20: at('s20', 'one'),
  place20: at('s20', 'place'),
  s21: seg('s21').from,
  fuzzy: at('s21', 'fuzzy'),
  band21: at('s21', 'band'),
  overlap: at('s21', 'overlap'),
  small: at('s21', 'small'),
  s22: seg('s22').from,
  close: at('s22', 'close'),
  long_: at('s22', 'long'),
  spread: at('s22', 'spread'),
  shrinks: at('s22', 'shrinks'),
  s22end: segEnd('s22'),
  s23: seg('s23').from,
  weighs: at('s23', 'weighs'),
  trying: at('s23', 'trying'),
  keeping: at('s23', 'keeping'),
  predicted: at('s23', 'predicted'),
  match: at('s23', 'match'),
  assumptions: at('s23', 'assumptions'),
  kind: at('s23', 'kind'),
  s24: seg('s24').from,
  answer: at('s24', 'answer'),
  likely: at('s24', 'likely'),
  rough: at('s24', 'rough'),
  not24: at('s24', 'not'),
  photograph: at('s24', 'photograph'),
};

/* ------------------------------------------------------------------ beats (derived from the cues) */

// S4.1 the fold: the camera starts rising on "room", lands by "with". A sine-like ease (not the kit's steep inOut):
// with the steep ease the whole rig -> token crossfade (tilt 0.45-0.8) happened in ~8 frames mid-fold and read as a
// pop; this spreads it over ~14 frames of a 60-frame move.
const FOLD0 = K.room - 6;
const FOLD_DUR = Math.max(36, Math.min(60, K.with_ - FOLD0));
const FOLD_END = FOLD0 + FOLD_DUR;
const FOLD_EASE = Easing.bezier(0.37, 0, 0.63, 1);
const LOOKUP = Math.min(K.map, FOLD0) - 2; // the guesser glances up as the camera starts to move
const CHIP_2D = Math.max(FOLD_END + 2, K.simpl);
const CHIP_2D_OFF = K.s22end + 4; // "simplified picture (2D)" held through s22
// one spot: the sensor flashes and listens at W1 (the shared, visibly slowed pulse speed)
const W1_POP = Math.max(FOLD_END + 4, K.sensor);
const SCH1 = pathSchedule([Sp, W1, Sp], {start: K.flashes});
const SCH1B = pathSchedule([Sp, W1, Sp], {start: Math.max(SCH1.end + 10, K.spot17 - 6)}); // and again: one spot
const FLASH_LBL = Math.max(SCH1.vertexFrames[1], K.listens);
const DELAY_LBL = Math.max(FLASH_LBL + 20, K.measure); // "measure the extra delay"
const DELAY1_NS = L.confocalA[0].delay_after_first_bounce_ns; // = 2|W1 H| / c

// S4.2 ruler 1, arc 1, inset (J3a)
// the ruler first swings out at 77°: between the sensor and the partition, its tip ~4 cm short of the partition (at 72°
// the tip sat on the partition and "1.33 m" read as the distance to the screen)
const TH0 = (77 * Math.PI) / 180;
/** "which way?": the ruler hesitates AWAY from him (77° -> 96° and back; it never points at his side of the screen) */
const WAG_MAX = (19 * Math.PI) / 180;
const INSET_OPEN = K.how18 - 16;
const R1_EXT0 = K.how18 - 2;
const R1_EXT_DUR = Math.max(12, Math.min(24, K.that18 - R1_EXT0 - 2));
const NUM1 = R1_EXT0 + R1_EXT_DUR + 2;
const WAG0 = K.not18;
const SWING0 = Math.max(WAG0 + 16, K.just18);
const SWING_DUR = Math.max(10, Math.min(16, K.far18b - SWING0 + 6));
const SWEEP0 = SWING0 + SWING_DUR;
const SWEEP1 = Math.max(SWEEP0 + 44, Math.min(SWEEP0 + 96, K.arc19));
const RETRACT_DUR = 14;
const GHOST_A = [12, 58, 92, 128, 145].map((d) => (d * Math.PI) / 180);
// "all the same distance from that spot": the same ruler length taps three of the ghosts in turn (145°, 92°, 58°),
// then retracts on "spot" (it used to retract at once and leave a 2 s hold under this line)
const HOP_DUR = 10;
const HOPS = (() => {
  const h0 = Math.max(SWEEP1 + 4, K.all19 - 2);
  const h1 = Math.max(h0 + HOP_DUR + 3, K.dist19 - 2);
  const h2 = Math.max(h1 + HOP_DUR + 3, K.from19 - 2);
  return [h0, h1, h2];
})();
const HOP_TO = [GHOST_A[4], GHOST_A[2], GHOST_A[1]];
const RETRACT0 = Math.min(Math.max(HOPS[2] + HOP_DUR + 4, K.spot19), seg('s20').from - RETRACT_DUR - 8);
const RELAX = K.direction; // the relieved sigh
const LEAN0 = K.just18 - 4;
const GHOSTS_OFF = K.s20 - 4;

// S4.3 the second spot, arc 2, the crossing; camera rises to show behind the wall
const W4_POP = K.listen20 - 6;
const SCH4 = pathSchedule([Sp, W4, Sp], {start: K.listen20 + 4});
const R4_EXT0 = Math.max(SCH4.end + 4, K.another1);
const R4_EXT_DUR = Math.max(10, Math.min(18, K.another2 - R4_EXT0 - 2));
const SWEEP4_0 = Math.max(R4_EXT0 + R4_EXT_DUR + 2, K.another2);
const SWING4_DUR = 8;
// ruler 2 swings straight out from W4 into the corridor between the partition's far end and him (at 108° it hugged the
// partition's end, 4 px clear); then it swings left and sweeps back right, drawing the arc
const TH4 = Math.PI / 2;
const SWEEP4_1 = Math.max(SWEEP4_0 + SWING4_DUR + 20, Math.min(K.on20 - 2, SWEEP4_0 + 40));
const RETRACT4_0 = SWEEP4_1 + 4;
const BACK0 = Math.max(RETRACT4_0, K.on20 - 2);
const BACK_DUR = 30;
const BH0 = BACK0 + Math.round(BACK_DUR * 0.6); // the back halves draw once the rising camera is settling
const BH_DUR = Math.max(14, Math.min(26, K.cross20 - BH0 - 2));
const BH_END = BH0 + BH_DUR;
const IMPOSSIBLE = Math.max(BH_END + 2, K.cross20 - 4);
const ONE = K.one20;
const RET0 = K.s21;
const RET_DUR = Math.max(20, Math.min(34, K.fuzzy - RET0 - 2));
const INSET_CLOSE = K.s21;
const CAM_BACK: Cam = (() => {
  const c = projectWith(viewAt(1), {x: 2.1, z: -0.1, h: 0});
  return {cx: c.x, cy: c.y, zoom: 1.42};
})();

// S4.4 fuzzy → bands → patch
const FUZZ0 = K.fuzzy;
const BAND0 = Math.max(FUZZ0 + 12, K.band21 - 22);
const BAND_DUR = 26;
const BAND_LBL = BAND0 + 18;
const PATCH0 = K.overlap;
const PATCH_DUR = 24;
const PATCH_RING = Math.max(PATCH0 + 8, K.small - 2); // a marker ring round the small patch

// S4.5 close spots vs spread spots
const SLIDE_IN0 = K.s22 - 8;
const SLIDE_IN_DUR = Math.max(14, Math.min(26, K.close - SLIDE_IN0 - 2));
const LBL_CLOSE = K.close + 2;
const LBL_LONG = Math.max(LBL_CLOSE + 8, K.long_ - 2);
const SPREAD0 = K.spread;
const SPREAD_DUR = Math.max(20, Math.min(40, K.shrinks - K.spread + 4));
const LBL_SPREAD = SPREAD0 + 6;
const LBL_SMALL = Math.max(LBL_SPREAD + 8, Math.max(SPREAD0 + SPREAD_DUR - 10, K.shrinks - 4));

// S4.6 candidates
const CLEAR0 = K.s23 - 4;
// "weighs many spots at once": a flash at each of the four spots, close together
const MANY_SCH = WALL.map((w, i) => pathSchedule([Sp, w, Sp], {start: K.weighs + i * 5}));
const DOTS0 = K.trying - 2;
const DOTS_DUR = Math.max(14, Math.min(26, K.keeping - K.trying));
const EX1 = K.keeping - 4;
const EX2 = Math.max(EX1 + 26, K.predicted - 4);
const CHECK = Math.max(EX2 + 16, K.match);
const CULL0 = CHECK + 6;
const CULL_SPAN = 24;
const CLUSTER0 = CULL0 + 20;
const CLUSTER_DUR = 40;
const ASSUME = K.assumptions;
const MODEL = Math.max(ASSUME + 10, K.kind - 4); // the assumed object (one small thing) outlined round the cluster
// "like what kind of object it's after": the dashed outline draws wide, then closes in to the one small object
const MODEL_SHRINK0 = MODEL + 12;
const MODEL_SHRINK_DUR = Math.max(16, Math.min(48, K.s24 - MODEL_SHRINK0));
const CARD_OFF = CULL0 + 14;

// S4.7 the likely location; the photo frame; hand-off
const BLOB0 = Math.min(K.likely - 6, Math.max(K.answer - 4, CLUSTER0 + CLUSTER_DUR + 10));
const BLOB_DUR = 26;
const LBL_LIKELY = K.likely + 2;
const LBL_ROUGH = K.rough;
const LBL_NOT = K.not24 + 2;
const CLEAR_E0 = K.end - 17; // everything but the blob and the board clears; the last 10 frames hold
const CLEAR_E_DUR = 7;
// the frame lands just before "Not" and is struck out ON "Not" (the scene ends ~19 frames after "photograph", so the
// struck frame needs every frame it can get); it drops away as the labels clear, before the 10-frame hand-off hold
const PHOTO_LAND = Math.min(K.not24 - 2, K.photograph - 8);
const PHOTO_IN = PHOTO_LAND - 16;
const CROSS0 = Math.max(PHOTO_LAND + 3, K.not24 + 2);
const CROSS_DUR = 7;
const PHOTO_OUT = Math.max(CROSS0 + CROSS_DUR + 3, CLEAR_E0 - 5);
const PHOTO_OUT_DUR = 12;

/* ------------------------------------------------------------------ candidates (seeded) */

type Dot = {p: P2; err: number; delay: number; keep: boolean; target: P2; id: number};
const errOf = (p: P2) => Math.sqrt(WALL.reduce((a, w, i) => a + (dist(p, w) - RADII[i]) ** 2, 0) / WALL.length);
const KEEP_ERR = 0.15;
const HIDDEN_BOX = {x0: L.occluder.x + 0.1, x1: ROOM.x1 - 0.08, z0: 0.06, z1: 1.62};

// the final likely-location field: all four spots, one-bin bands (the blob of S4.7 and the cluster targets)
const FINAL_FIELD: ScalarField = possibleCloud({x0: 2.2, x1: 3.0, z0: 0.5, z1: 1.2, step: 0.008}, WALL.map((w, i) => ({W: w, r: RADII[i], halfWidth: HW})));
const fieldAt = (f: ScalarField, p: P2) => {
  const i = Math.round((p.x - f.spec.x0) / f.spec.step);
  const j = Math.round((p.z - f.spec.z0) / f.spec.step);
  if (i < 0 || j < 0 || i >= f.nx || j >= f.nz) return 0;
  return f.values[j * f.nx + i];
};
const TARGETS: P2[] = (() => {
  const out: P2[] = [];
  for (let s = 0; out.length < 90 && s < 20000; s++) {
    const p = {x: 2.3 + rand(9001 + s * 2) * 0.6, z: 0.6 + rand(9002 + s * 2) * 0.5};
    if (fieldAt(FINAL_FIELD, p) > 0.45) out.push(p);
  }
  return out;
})();
const BAD_EX: P2 = {x: 3.35, z: 0.4};
const GOOD_EX: P2 = {x: Hp.x + 0.03, z: Hp.z - 0.02};
const DOTS: Dot[] = (() => {
  const n = 220;
  const out: Dot[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    const p = {x: lerp(HIDDEN_BOX.x0, HIDDEN_BOX.x1, rand(101 + i * 3)), z: lerp(HIDDEN_BOX.z0, HIDDEN_BOX.z1, rand(102 + i * 3))};
    const err = errOf(p);
    const keep = err < KEEP_ERR;
    out.push({p, err, delay: rand(103 + i * 3), keep, target: keep ? TARGETS[t++ % TARGETS.length] : p, id: i});
  }
  // the two worked examples
  out.push({p: BAD_EX, err: errOf(BAD_EX), delay: 0.2, keep: false, target: BAD_EX, id: n});
  out.push({p: GOOD_EX, err: errOf(GOOD_EX), delay: 0.4, keep: true, target: TARGETS[t++ % TARGETS.length], id: n + 1});
  return out;
})();
const SURVIVORS = DOTS.filter((d) => d.keep);
// resampling: each survivor spawns children that start on it and settle inside the likely region
const CHILDREN = SURVIVORS.flatMap((d, i) => [0, 1].map((c) => ({from: d, target: TARGETS[(SURVIVORS.length + i * 2 + c) % TARGETS.length], delay: rand(7001 + i * 5 + c)})));
const MEASURED = WALL.map((w) => arrivalNs(w, Hp));

/* ------------------------------------------------------------------ helpers */

const arcPts = (c: P2, r: number, a0: number, a1: number) => sampleArc(c, r, a0, a1, Math.max(2, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 120))));
const polar = (c: P2, r: number, a: number): P2 => ({x: c.x + r * Math.cos(a), z: c.z + r * Math.sin(a)});

/**
 * The camera during the fold: it pans with the rising room over the first 80 % of the tilt and zooms in over the last
 * 65 %, so the upright people (full height until they fade) stay in frame; it lands exactly on CAM_PLAN_ACT.
 */
const foldCam = (g: number): Cam => {
  const pp = E.inOut(tw(g, FOLD0, FOLD_DUR * 0.8, E.linear));
  const pz = E.inOut(tw(g, FOLD0 + FOLD_DUR * 0.35, FOLD_DUR * 0.65, E.linear));
  return {cx: lerp(CAM_ROOM.cx, CAM_PLAN_ACT.cx, pp), cy: lerp(CAM_ROOM.cy, CAM_PLAN_ACT.cy, pp), zoom: lerp(CAM_ROOM.zoom, CAM_PLAN_ACT.zoom, pz)};
};

/** One spot's ruler + arc state at a frame: ruler angle and length (m), arc drawn from 0 to `arc` (rad). */
type RulerState = {angle: number; len: number; arc: number; arcFrom?: number; on: boolean};
const ruler1 = (g: number): RulerState => {
  const ext = E.out(tw(g, R1_EXT0, R1_EXT_DUR, E.linear));
  let angle = TH0;
  if (g >= WAG0 && g < SWING0) {
    const D = SWING0 - WAG0;
    // 'which way?': two hesitant rocks toward the open floor (away from him), back to TH0 for the swing
    angle = kf(g, [
      [WAG0, TH0],
      [WAG0 + 0.3 * D, TH0 + WAG_MAX],
      [WAG0 + 0.55 * D, TH0 + 0.35 * WAG_MAX],
      [WAG0 + 0.8 * D, TH0 + 0.8 * WAG_MAX],
      [SWING0, TH0],
    ]);
  } else if (g >= SWING0 && g < SWEEP0) {
    angle = TH0 * (1 - E.inOut(tw(g, SWING0, SWING_DUR, E.linear)));
  } else if (g >= SWEEP0 && g < SWEEP1) {
    angle = Math.PI * E.inOut(tw(g, SWEEP0, SWEEP1 - SWEEP0, E.linear));
  } else if (g >= SWEEP1) {
    angle = kf(g, [
      [HOPS[0], Math.PI],
      [HOPS[0] + HOP_DUR, HOP_TO[0]],
      [HOPS[1], HOP_TO[0]],
      [HOPS[1] + HOP_DUR, HOP_TO[1]],
      [HOPS[2], HOP_TO[1]],
      [HOPS[2] + HOP_DUR, HOP_TO[2]],
    ]);
  }
  const arc = g >= SWEEP1 ? Math.PI : g >= SWEEP0 ? angle : 0;
  const len = R1 * ext * (1 - E.in(tw(g, RETRACT0, RETRACT_DUR, E.linear)));
  return {angle, len, arc, on: g >= R1_EXT0 && g < RETRACT0 + RETRACT_DUR};
};
const ruler4 = (g: number): RulerState => {
  const ext = E.out(tw(g, R4_EXT0, R4_EXT_DUR, E.linear));
  let angle = TH4;
  if (g >= SWEEP4_0 && g < SWEEP4_0 + SWING4_DUR) angle = lerp(TH4, Math.PI, E.inOut(tw(g, SWEEP4_0, SWING4_DUR, E.linear)));
  else if (g >= SWEEP4_0 + SWING4_DUR) angle = Math.PI * (1 - E.inOut(tw(g, SWEEP4_0 + SWING4_DUR, SWEEP4_1 - SWEEP4_0 - SWING4_DUR, E.linear)));
  // the arc is drawn from the left end (pi) back to the ruler
  const sweeping = g >= SWEEP4_0 + SWING4_DUR;
  const len = R4 * ext * (1 - E.in(tw(g, RETRACT4_0, RETRACT_DUR, E.linear)));
  return {angle, len, arc: sweeping ? Math.PI : 0, arcFrom: sweeping ? angle : Math.PI, on: g >= R4_EXT0 && g < RETRACT4_0 + RETRACT_DUR};
};

/** The two listening spots (x on the wall) through s21–s22: W1/W4, slide close to W2/W3, spread back. */
const spotXs = (g: number): [number, number] => [
  kf(g, [[SLIDE_IN0, W1.x], [SLIDE_IN0 + SLIDE_IN_DUR, W2.x, E.inOut], [SPREAD0, W2.x], [SPREAD0 + SPREAD_DUR, W1.x, E.inOut]]),
  kf(g, [[SLIDE_IN0, W4.x], [SLIDE_IN0 + SLIDE_IN_DUR, W3.x, E.inOut], [SPREAD0, W3.x], [SPREAD0 + SPREAD_DUR, W4.x, E.inOut]]),
];
const sliding = (g: number) => g >= SLIDE_IN0 && g < SPREAD0 + SPREAD_DUR;

/* ------------------------------------------------------------------ the guesser's face (inset) */

const guesserFace = (g: number): {pose: Pose2; lean: number} => {
  let p: Pose2 = withPose(IDLE2, {...EXPR.smug, lookX: -0.2});
  // "you know how far he is": nervous, eyes toward the wall
  const nerv = tw(g, K.how18 - 4, 10) * (1 - tw(g, RELAX, 10));
  p = withPose(p, {lid: 0, eyes: 1.12, pupil: 0.85, brows: 0.5, browAsym: 0, mouth: 'flat', tilt: 0, lookX: -0.75, lookY: -0.15, sweat: 0.45}, nerv);
  // "not which direction": relief (eyes shut on the exhale), then the smug lean on the partition
  const relief = tw(g, RELAX, 8) * (1 - tw(g, RELAX + 18, 8));
  p = withPose(p, {mouth: 'smile', hunch: 0.07, brows: 0.15, lookX: 0}, relief);
  const lean = sp(g, LEAN0, SOFT);
  p = withPose(p, {...EXPR.smug, lean: -7, tilt: -8, lid: 0.5, lookX: 0.3, lookY: 0.05, sweat: 0}, Math.min(1, lean));
  // s20 "a second spot": alert; "another arc": the smile goes
  const alert = tw(g, K.second - 4, 10);
  p = withPose(p, {lid: 0.12, brows: 0.35, browAsym: 0.1, lookX: -0.65, lookY: -0.1, tilt: -4}, alert);
  const flat = tw(g, K.another2, 10);
  p = withPose(p, {mouth: 'flat', lean: -4, eyes: 1.06}, flat);
  // "one place": busted, straightens up off the partition
  const busted = sp(g, ONE - 2, SNAP);
  p = withPose(p, {...EXPR.busted, lean: 0, tilt: -3, lookX: -0.4, lookY: 0}, Math.min(1.05, busted));
  p = {...p, bob: hop(g, ONE - 2, 10, 8)};
  if (g >= RELAX + 2 && g < RELAX + 16) p = {...p, blink: 0};
  const handOn = clamp01(lean) * (1 - clamp01(busted * 1.4));
  return {pose: p, lean: handOn};
};

/* ------------------------------------------------------------------ the scene */

export const S4Geometry: React.FC = () => {
  const g = useG();
  const tilt = tiltAt(g, FOLD0, FOLD_DUR, FOLD_EASE);
  const cam = g < FOLD_END ? foldCam(g) : camPath(g, CAM_PLAN_ACT, [
    {at: BACK0, dur: BACK_DUR, to: CAM_BACK},
    {at: RET0, dur: RET_DUR, to: HANDOFF.S4S5.cam},
  ]);
  const st = viewAt(tilt);
  const k = 1 / cam.zoom; // world px per screen px
  const toW = (p: P2) => {
    const q = projectWith(st, {x: p.x, z: p.z, h: 0});
    return {x: q.x, y: q.y};
  };
  const toS = (p: P2) => {
    const w = toW(p);
    const s = worldToScreen(cam, w.x, w.y);
    return {x: s.x, y: s.y};
  };
  const ppm = st.ppm;
  const mix = figureMix(tilt);
  const endClear = 1 - tw(g, CLEAR_E0, CLEAR_E_DUR, E.inOut);

  /* ---- people (room view) */
  const op = rigAt(OPp.x, OPp.z, tilt);
  const gu = rigAt(Hp.x, Hp.z, tilt);
  const chkPose: Pose2 = withPose({...IDLE2}, {...EXPR.deadpan, lookX: 0.6, lookY: 0.32, tilt: 3});
  let guPose: Pose2 = withPose(withPose(HANDS_ON_HIPS, EXPR.smug), settlePose(1, 1));
  guPose = withPose(guPose, {lookY: -0.8, lookX: -0.15, brows: 0.45, browAsym: 0.15, lid: 0.12, mouth: 'flat', tilt: 2}, tw(g, LOOKUP, 10, E.inOut));

  /* ---- pulses */
  const PULSES = [
    {sch: SCH1, w: W1},
    {sch: SCH1B, w: W1},
    {sch: SCH4, w: W4},
    ...MANY_SCH.map((sch, i) => ({sch, w: WALL[i]})),
  ];
  const fire = (s: number) => Math.max(0, 1 - Math.abs(g - s) / 5);
  const firing = Math.max(...PULSES.map((q) => fire(q.sch.start)));
  const lastMany = MANY_SCH[MANY_SCH.length - 1];
  const slowedOn = Math.max(
    tw(g, SCH1.start - 8, 8) * (1 - tw(g, SCH1B.end + 22, 10)),
    tw(g, SCH4.start - 8, 8) * (1 - tw(g, SCH4.end + 22, 10)),
    tw(g, MANY_SCH[0].start - 8, 8) * (1 - tw(g, lastMany.end + 22, 10)),
  );

  /* ---- spots (diamonds on the wall) */
  const [ax, bx] = spotXs(g);
  const slide = sliding(g);
  const popAt = (t0: number) => (g < t0 ? 0 : E.back(clamp01((g - t0) / 12)));
  // W2/W3 get their own markers only for the four-spot flash (s23); in s22 the two lit spots slide there and back, and
  // static W2/W3 markers under them only doubled the diamonds (six on the wall, overlapping mid-slide)
  const markerPop = [popAt(W1_POP), popAt(MANY_SCH[1].start - 3), popAt(MANY_SCH[2].start - 3), popAt(W4_POP)];
  const lit1 = tw(g, SCH1.vertexFrames[1], 6);
  const lit4 = tw(g, SCH4.vertexFrames[1], 6);
  const litMany = (i: number) => tw(g, MANY_SCH[i].vertexFrames[1], 6);
  const markerLit = [slide ? 0 : Math.max(lit1, litMany(0)), litMany(1), litMany(2), slide ? 0 : Math.max(lit4, litMany(3))];

  /* ---- arcs, bands, patch */
  const r1 = ruler1(g);
  const r4 = ruler4(g);
  const arcsOut = 1 - tw(g, CLEAR0, 16);
  const arcW = lerp(6, 3.5, tw(g, BAND0, BAND_DUR)) * k;
  const fuzz = 0.032 * E.out(tw(g, FUZZ0, 14)) * (1 - tw(g, BAND0 + BAND_DUR - 8, 12));
  const hw = HW * E.out(tw(g, BAND0, BAND_DUR, E.linear));
  const spots: P2[] = [Wat(ax), Wat(bx)];
  const spotR = spots.map((w) => dist(w, Hp));
  const patchT = tw(g, PATCH0, PATCH_DUR) * arcsOut;
  const field = g >= PATCH0 && patchT > 0 ? possibleCloud({x0: 1.85, x1: 3.45, z0: 0.0, z1: 1.75, step: 0.012}, spots.map((w, i) => ({W: w, r: spotR[i], halfWidth: Math.max(hw, 0.004)}))) : null;
  // back halves (behind the wall)
  const bh = E.inOut(tw(g, BH0, BH_DUR, E.linear));
  const bhGrey = tw(g, IMPOSSIBLE + 8, 14);
  const bhOut = 1 - tw(g, RET0, 18);

  /* ---- candidates */
  const dotsIn = (d: Dot) => sp(g, DOTS0 + d.delay * DOTS_DUR, SNAP);
  const cullT = (d: Dot) => {
    if (d.keep) return 0;
    if (d.id === DOTS.length - 2) return tw(g, EX1 + 20, 10);
    return tw(g, CULL0 + (1 - clamp01(d.err / 0.9)) * CULL_SPAN * 0.7 + d.delay * CULL_SPAN * 0.3, 10);
  };
  const clusterT = (d: {delay: number}) => E.inOut(tw(g, CLUSTER0 + d.delay * 10, CLUSTER_DUR - 10, E.linear));
  const dotsFade = 1 - tw(g, BLOB0 + 6, 18);
  const blobT = tw(g, BLOB0, BLOB_DUR);

  /* ---- tokens */
  const tokOp = tokenAt(OPp.x, OPp.z, tilt);
  const tokH = tokenAt(Hp.x, Hp.z, tilt);
  const sW = projectWith(st, {x: Sp.x, z: Sp.z, h: L.sensor.h});
  const opFacing = facingOf(sW.x - tokOp.x, sW.y - tokOp.y);
  const ghostT = (a: number, i: number) => {
    // a ghost appears once the ruler tip has passed its angle (and not before "anywhere")
    const passed = r1.arc >= a ? 1 : 0;
    return passed * tw(g, K.anywhere - 6 + i * 3, 10) * (1 - tw(g, GHOSTS_OFF, 14));
  };

  /* ---- items standing in the room */
  const items: RoomItem[] = [
    {
      key: 'checker',
      x: OPp.x,
      z: OPp.z,
      w: 0.3,
      node: mix.rig > 0.001 ? <Character2 look={CAST.checker} pose={chkPose} frame={g} seed={3} x={op.x} y={op.y} scale={op.scale} life={0.35} style={rigStyle(tilt, op.scale)} /> : null,
    },
    {
      key: 'guesser',
      x: Hp.x,
      z: Hp.z,
      w: 0.3,
      node: mix.rig > 0.001 ? <Character2 look={CAST.guesser} pose={guPose} frame={g} seed={5} x={gu.x} y={gu.y} scale={gu.scale} life={0.5} style={rigStyle(tilt, gu.scale)} /> : null,
    },
    {key: 'stand', x: Sp.x, z: Sp.z, w: 0.24, height: 1.35, node: <SensorStand tilt={tilt} aim={AIM} firing={firing} />},
  ];

  /* ---- floor drawings (under the standing things): tokens, then the diagram over them */
  const roomClip = polyD([toW({x: ROOM.x0, z: ROOM.z0}), toW({x: ROOM.x1, z: ROOM.z0}), toW({x: ROOM.x1, z: ROOM.z1}), toW({x: ROOM.x0, z: ROOM.z1})], true);
  const arcLine = (c: P2, r: number, a0: number, a1: number, width: number, color: string, op = 1, dash?: string) =>
    a1 - a0 > 1e-3 ? <path d={polyD(arcPts(c, r, a0, a1).map(toW))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={op} strokeDasharray={dash} /> : null;

  const diamond = (p: P2, pop: number, lit: number, key: string) => {
    if (pop <= 0.001) return null;
    const c = toW(p);
    const s = 16 * k * pop * (1 + 0.18 * lit);
    return <path key={key} d={`M ${c.x} ${c.y - s} L ${c.x + s} ${c.y} L ${c.x} ${c.y + s} L ${c.x - s} ${c.y} Z`} fill={lit > 0 ? mixColor(C.cream, C.saffron, lit) : C.cream} stroke={C.ink} strokeWidth={OUTLINE * k} strokeLinejoin="round" />;
  };

  // the rulers lie on the floor with the rest of the diagram: under the partition, the plant, the sensor and the
  // operator token (like the arcs), so a swing past them reads as passing beneath, not as a measurement through them
  const rulerEl = (w: P2, s: RulerState) => (s.on && s.len > 0.005 ? <Ruler o={toW(w)} angle={s.angle} len={s.len * ppm} ppm={ppm} k={k} /> : null);

  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="s4room">
          <path d={roomClip} />
        </clipPath>
      </defs>
      {/* tokens (they fade in as the rigs fade out) */}
      {mix.token > 0.001 && (
        <g>
          <GuesserToken asGroup x={tokH.x} y={tokH.y} size={2 * tokH.r} scale={tokH.scale} opacity={tokH.opacity} facing={200} />
        </g>
      )}
      {/* "anywhere on this arc": faint ghosts of him along the first arc */}
      {GHOST_A.map((a, i) => {
        const t = ghostT(a, i);
        if (t <= 0.001) return null;
        const p = toW(polar(W1, R1, a));
        // the ghost the ruler's tip is resting on ("all the same distance") firms up a little
        const touch = g >= SWEEP1 && r1.on ? clamp01(1 - Math.abs(r1.angle - a) / 0.12) * clamp01(r1.len / R1) : 0;
        return <GuesserToken key={`gh${i}`} asGroup x={p.x} y={p.y} size={2 * tokH.r} scale={0.62 + 0.08 * E.back(clamp01(t))} opacity={(0.32 + 0.3 * touch) * t} facing={200} shadow={false} />;
      })}
      {/* back halves: the same circles continue behind the wall and cross again there */}
      {bh > 0 && bhOut > 0 && (
        <g opacity={bhOut}>
          {arcLine(W1, R1, Math.PI, Math.PI + Math.PI * bh, 5 * k, mixColor(C.blue, C.inkMuted, bhGrey), lerp(0.85, 0.45, bhGrey), `${14 * k} ${11 * k}`)}
          {arcLine(W4, R4, Math.PI, Math.PI + Math.PI * bh, 5 * k, mixColor(C.blue, C.inkMuted, bhGrey), lerp(0.85, 0.45, bhGrey), `${14 * k} ${11 * k}`)}
        </g>
      )}
      <g clipPath="url(#s4room)" opacity={arcsOut}>
        {/* bands (s21–s22): from the current spot positions */}
        {hw > 0.0005 &&
          spots.map((w, i) => <Band key={`b${i}`} asGroup center={w} r={spotR[i]} halfWidth={hw} toPx={toW} t={1} tone="blue" fillOpacity={0.24} />)}
        {/* arcs: 1 (W1) and 2 (W4) as drawn by the rulers; from s21 on, from the current spots */}
        {g < FUZZ0 ? (
          <>
            {arcLine(W1, R1, 0, r1.arc, arcW, C.blue)}
            {arcLine(W4, R4, r4.arcFrom ?? 0, r4.arc, arcW, C.blue)}
          </>
        ) : (
          spots.map((w, i) => (
            <g key={`a${i}`}>
              {fuzz > 0.0005 && arcLine(w, spotR[i] - fuzz, 0, Math.PI, 3 * k, C.blue, 0.55)}
              {fuzz > 0.0005 && arcLine(w, spotR[i] + fuzz, 0, Math.PI, 3 * k, C.blue, 0.55)}
              {arcLine(w, spotR[i], 0, Math.PI, arcW, C.blue)}
            </g>
          ))
        )}
        {/* the overlap patch */}
        {field && <PossibleCloud asGroup toPx={toW} field={field} t={patchT} tone="teal" />}
      </g>
      {/* candidate positions (s23) */}
      {g >= DOTS0 && dotsFade > 0 && (
        <g opacity={dotsFade}>
          {DOTS.map((d) => {
            const a = dotsIn(d);
            if (a <= 0.001) return null;
            const c = cullT(d);
            if (c >= 1) return null;
            const ct = d.keep ? clusterT(d) : 0;
            const p = toW({x: lerp(d.p.x, d.target.x, ct), z: lerp(d.p.z, d.target.z, ct)});
            const r = 7.5 * k * Math.min(1.1, a) * (1 - 0.5 * c) * (d.keep && g >= CULL0 ? 1.15 : 1);
            return <circle key={`d${d.id}`} cx={p.x} cy={p.y} r={r} fill={c > 0 ? mixColor(C.teal, C.paperLine, c) : C.teal} stroke={C.ink} strokeWidth={2.5 * k} opacity={1 - c} />;
          })}
          {CHILDREN.map((ch, i) => {
            const t0 = CLUSTER0 + ch.delay * 12;
            const a = sp(g, t0, SNAP);
            if (a <= 0.001) return null;
            const ct = E.inOut(tw(g, t0, CLUSTER_DUR - 4, E.linear));
            const from = ch.from.target; // children leave from where their parent is heading
            const pp = {x: lerp(lerp(ch.from.p.x, from.x, clusterT(ch.from)), ch.target.x, ct), z: lerp(lerp(ch.from.p.z, from.z, clusterT(ch.from)), ch.target.z, ct)};
            const p = toW(pp);
            return <circle key={`c${i}`} cx={p.x} cy={p.y} r={7.5 * k * Math.min(1.1, a)} fill={C.teal} stroke={C.ink} strokeWidth={2.5 * k} />;
          })}
        </g>
      )}
      {/* the likely location (s24): the same four bands */}
      {blobT > 0 && <PossibleCloud asGroup toPx={toW} field={FINAL_FIELD} t={blobT} tone="teal" />}
      {/* light pulses: flash and listen at one spot */}
      {PULSES.map((q, i) => {
        const prog = q.sch.progress(g);
        const trail = g >= q.sch.start ? 1 - tw(g, q.sch.end + 4, 12) : 0;
        return trail > 0 && prog > 0 ? <LightPath key={`lp${i}`} asGroup points={[Sp, q.w, Sp]} toPx={toW} t={prog} layout={LAYOUT} opacity={trail} width={7 * k} pulseRadius={13 * k} ringRadius={52 * k} lane={12 * k} clearPx={0} /> : null;
      })}
      {/* wall spots */}
      <g opacity={endClear}>
        {WALL.map((w, i) => {
          // while a lit spot slides off (or back onto) W1/W4, the home marker shows only once the lit one has cleared
          // it, so the two never sit half-overlapped as a doubled diamond
          const near = slide && (i === 0 || i === 3) ? Math.abs((i === 0 ? ax : bx) - w.x) * ppm * cam.zoom : 1e9;
          const op = clamp01((near - 14) / 16);
          return op > 0.001 ? (
            <g key={`w${i}`} opacity={op}>
              {diamond(w, markerPop[i], markerLit[i], `wd${i}`)}
            </g>
          ) : null;
        })}
        {slide && spots.map((w, i) => diamond(w, 1, 1, `m${i}`))}
      </g>
      {rulerEl(W1, r1)}
      {rulerEl(W4, r4)}
    </svg>
  );

  /* ---- overlays on top of the set (world space): crossing marks */
  const crossRing = sp(g, ONE - 4, SNAP) * (1 - tw(g, K.s21 + 4, 14));
  const patchRing = tw(g, PATCH_RING, 12, E.inOut);
  const patchRingOut = 1 - tw(g, SLIDE_IN0, 10);
  const modelRing = tw(g, MODEL, 14, E.inOut);
  const modelR = lerp(0.44, 0.26, tw(g, MODEL_SHRINK0, MODEL_SHRINK_DUR, E.inOut));
  const modelRingOut = 1 - tw(g, BLOB0 + 4, 14);
  const markerCircle = (r: number, t: number, color: string, op: number, dash?: string) => {
    if (t <= 0.001 || op <= 0.001) return null;
    const circ = 2 * Math.PI * r;
    return (
      <g opacity={op}>
        <circle cx={hW.x} cy={hW.y} r={r} fill="none" stroke={color} strokeWidth={6 * k} strokeLinecap="round" strokeDasharray={dash ?? `${circ * t} ${circ}`} transform={`rotate(-120 ${hW.x} ${hW.y})`} opacity={dash ? t : 1} />
      </g>
    );
  };
  const hW = toW(Hp);
  const top = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* the operator token stands above the floor diagram (only the hidden one is under it: the crossing must show) */}
      {mix.token > 0.001 && <CheckerToken asGroup x={tokOp.x} y={tokOp.y} size={2 * tokOp.r} scale={tokOp.scale} opacity={tokOp.opacity} facing={opFacing} />}
      {markerCircle(0.3 * ppm, patchRing, C.tealDeep, patchRingOut)}
      {markerCircle(modelR * ppm, modelRing, C.saffronDeep, modelRingOut, `${12 * k} ${10 * k}`)}
      {crossRing > 0.001 && <circle cx={hW.x} cy={hW.y} r={(0.2 + 0.12 * Math.min(1.1, crossRing)) * ppm} fill="none" stroke={C.tealDeep} strokeWidth={7 * k} opacity={Math.min(1, crossRing)} />}
    </svg>
  );

  /* ---- screen-space overlay: labels, chips, inset, cards */
  const sH = toS(Hp);
  const tokRpx = tokH.r * cam.zoom;
  const face = guesserFace(g);
  const insetOpen = sp(g, INSET_OPEN, SNAP) * (1 - E.in(tw(g, INSET_CLOSE, 12, E.linear)));
  const lblPop = (t0: number, t1 = 1e7, d = 10) => (g < t0 ? 0 : E.back(clamp01((g - t0) / d)) * (1 - tw(g, t1, 8)));
  const lblOp = (t0: number, t1 = 1e7) => tw(g, t0, 6) * (1 - tw(g, t1, 8));
  const w1S = toS(W1);
  // the reading rides the ruler's tip (it wavers on 'not which direction') and leaves before the swing
  const tip1 = toS(polar(W1, Math.max(0.01, r1.len), r1.angle));
  const NUM1_OFF = SWING0 - 6;
  const mirrorS = toS(Hm);
  const xMark = tw(g, IMPOSSIBLE - 4, 10) * bhOut;
  // examples
  const ex = g < EX2 ? DOTS[DOTS.length - 2] : DOTS[DOTS.length - 1];
  const exPos = ex.keep ? {x: lerp(ex.p.x, ex.target.x, clusterT(ex)), z: lerp(ex.p.z, ex.target.z, clusterT(ex))} : ex.p;
  const exS = toS(exPos);
  const cardOp = tw(g, EX1 - 2, 8) * (1 - tw(g, CARD_OFF, 10));
  const reveal = g < EX2 ? tw(g, EX1 + 4, 12) * (1 - tw(g, EX2 - 5, 5)) : tw(g, EX2 + 2, 12);
  const verdict: -1 | 1 = g < EX2 ? -1 : 1;
  const vt = g < EX2 ? tw(g, EX1 + 17, 8) * (1 - tw(g, EX2 - 5, 5)) : tw(g, CHECK, 8);
  const exRing = cardOp * (g < EX2 ? tw(g, EX1, 6) * (1 - tw(g, EX1 + 26, 4)) : tw(g, EX2, 6));
  const CARD = {x: 1250, y: 766, w: 560};
  // photo frame
  const phIn = E.out(tw(g, PHOTO_IN, PHOTO_LAND - PHOTO_IN, E.linear));
  const phOut = E.in(tw(g, PHOTO_OUT, PHOTO_OUT_DUR, E.linear));
  const phCross = E.out(tw(g, CROSS0, CROSS_DUR, E.linear));
  const blobS = sH;

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} items={items} backdrop={backdrop}>
            {top}
          </RoomSet>
        </Layer>
      </Camera>

      {/* labels on the board (screen px; settled labels do not move) */}
      <div style={{position: 'absolute', inset: 0, opacity: endClear}}>
        {/* S4.1 */}
        <Pill x={w1S.x - 44} y={w1S.y + 118} align="right" size={36} pop={lblPop(FLASH_LBL, DELAY_LBL - 6)} opacity={lblOp(FLASH_LBL, DELAY_LBL - 6)}>
          flashes and listens
        </Pill>
        <Pill x={w1S.x - 44} y={w1S.y + 170} align="right" size={36} pop={lblPop(FLASH_LBL + 3, DELAY_LBL - 6)} opacity={lblOp(FLASH_LBL + 3, DELAY_LBL - 6)}>
          at one spot
        </Pill>
        <Pill x={w1S.x - 44} y={w1S.y + 118} align="right" size={36} pop={lblPop(DELAY_LBL, SWING0)} opacity={lblOp(DELAY_LBL, SWING0)}>
          extra delay
        </Pill>
        <Pill x={w1S.x - 44} y={w1S.y + 172} align="right" size={40} mono pop={lblPop(DELAY_LBL + 3, SWING0)} opacity={lblOp(DELAY_LBL + 3, SWING0)}>
          {DELAY1_NS.toFixed(2)} ns
        </Pill>
        {/* S4.2 */}
        <Pill x={tip1.x - 34} y={tip1.y + 4} align="right" mono size={40} pop={lblPop(NUM1, NUM1_OFF)} opacity={lblOp(NUM1, NUM1_OFF)}>
          {R1.toFixed(2)} m
        </Pill>
        <Pill x={1625} y={330} size={40} pop={lblPop(NUM1 + 2, K.s20)} opacity={lblOp(NUM1 + 2, K.s20)}>
          distance known
        </Pill>
        <Pill x={1625} y={392} size={40} color={C.coralDeep} pop={lblPop(K.direction, K.s20)} opacity={lblOp(K.direction, K.s20)}>
          direction unknown
        </Pill>
        {/* S4.3 */}
        <Pill x={mirrorS.x + 48} y={mirrorS.y} align="left" size={36} color={C.inkSoft} pop={lblPop(IMPOSSIBLE, RET0)} opacity={lblOp(IMPOSSIBLE, RET0)}>
          behind the wall: impossible
        </Pill>
        {/* S4.4 */}
        <Pill x={350} y={872} size={34} pop={lblPop(BAND_LBL, CLEAR0)} opacity={lblOp(BAND_LBL, CLEAR0)} border={C.blue}>
          illustrative band (±3.75 cm)
        </Pill>
        {/* S4.5 */}
        <Pill x={1586} y={520} size={40} pop={lblPop(LBL_CLOSE, SPREAD0 + 2)} opacity={lblOp(LBL_CLOSE, SPREAD0 + 2)}>
          close → <span style={{opacity: tw(g, LBL_LONG, 8)}}>long and blurry</span>
        </Pill>
        <Pill x={1586} y={520} size={40} pop={lblPop(LBL_SPREAD, CLEAR0)} opacity={lblOp(LBL_SPREAD, CLEAR0)}>
          spread out → <span style={{opacity: tw(g, LBL_SMALL, 8)}}>smaller</span>
        </Pill>
        {/* S4.7 */}
        <Pill x={1410} y={466} align="left" size={44} color={C.tealDeep} pop={lblPop(LBL_LIKELY)} opacity={lblOp(LBL_LIKELY)}>
          likely location
        </Pill>
        <Pill x={1410} y={532} align="left" size={44} pop={lblPop(LBL_ROUGH)} opacity={lblOp(LBL_ROUGH)}>
          rough shape
        </Pill>
        <Pill x={1410} y={598} align="left" size={44} color={C.coralDeep} pop={lblPop(LBL_NOT)} opacity={lblOp(LBL_NOT)}>
          not a photograph
        </Pill>
      </div>

      {/* leaders, marks and the photo frame (screen px) */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: endClear}}>
        {lblOp(LBL_LIKELY) > 0 && <path d={`M 1402 466 L ${blobS.x + 62} ${blobS.y - 52}`} stroke={C.tealDeep} strokeWidth={4} strokeLinecap="round" opacity={lblOp(LBL_LIKELY)} />}
        {lblOp(BAND_LBL, CLEAR0) > 0 && (() => {
          const b = toS(polar(spots[0], spotR[0], (128 * Math.PI) / 180));
          return <path d={`M 300 846 L ${b.x} ${b.y + 18}`} stroke={C.blue} strokeWidth={4} strokeLinecap="round" opacity={lblOp(BAND_LBL, CLEAR0)} />;
        })()}
        {xMark > 0 && <CrossMark x={mirrorS.x} y={mirrorS.y} r={26} t={xMark} />}
        {exRing > 0.001 && (
          <g opacity={exRing}>
            <path d={`M ${CARD.x + (g < EX2 ? 300 : 120)} ${CARD.y} L ${exS.x} ${exS.y + 24}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <circle cx={exS.x} cy={exS.y} r={22} fill="none" stroke={C.saffronDeep} strokeWidth={6} />
          </g>
        )}
        {phIn > 0 && phOut < 1 && (
          <PhotoFrame
            x={lerp(sH.x + 90, sH.x, phIn)}
            y={lerp(-240, sH.y + 6, phIn) + 340 * phOut}
            rot={lerp(14, -5, phIn) + 24 * phOut}
            scale={lerp(0.8, 1, phIn)}
            cross={phCross}
            opacity={Math.min(1, phIn * 2) * (1 - phOut)}
          />
        )}
      </svg>

      {/* the comparison card and the assumption card */}
      <div style={{position: 'absolute', inset: 0}}>
        <EchoCard x={CARD.x} y={CARD.y} w={CARD.w} measured={MEASURED} predicted={WALL.map((w) => arrivalNs(w, ex.p))} range={[12.5, 19]} reveal={reveal} verdict={verdict} vt={vt} opacity={cardOp} pop={0.94 + 0.06 * E.back(clamp01(tw(g, EX1 - 2, 10)))} />
        <AssumptionCard x={1468} y={852} pop={g < ASSUME ? 0 : E.back(clamp01((g - ASSUME) / 12)) * (1 + 0.06 * Math.sin(Math.PI * tw(g, MODEL, 10, E.linear)))} opacity={1 - tw(g, BLOB0 + 4, 12)} />
      </div>

      {/* J3: the face inset */}
      <FaceInset cx={1655} cy={640} r={165} open={insetOpen} frame={g} pose={face.pose} lean={face.lean} tail={{x: sH.x, y: sH.y, r: tokRpx}} />

      {/* guard-rail chips */}
      <div style={{position: 'absolute', left: 96, top: 54, display: 'flex', gap: 14, opacity: endClear}}>
        <div style={{opacity: lblOp(CHIP_2D, CHIP_2D_OFF)}}>
          <Chip tone="paper" size={30}>simplified picture (2D)</Chip>
        </div>
        <div style={{opacity: lblOp(CHIP_2D + 6)}}>
          <Chip tone="paper" size={30}>illustrative</Chip>
        </div>
        <div style={{opacity: slowedOn}}>
          <Chip tone="paper" size={30}>slowed down</Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** #rrggbb mix (t = 0 → a, 1 → b). */
function mixColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const u = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, note: 'room tone, whole scene'},
  {f: FOLD_END - 2, kind: 'paper_flap', gain: -4, note: 'the room settles flat into the plan'},
  {f: CHIP_2D, kind: 'chip_pop', gain: -6, note: 'chip: simplified picture (2D)'},
  {f: SCH1.start, kind: 'sensor_pulse', note: 'flash at W1'},
  {f: Math.round(SCH1.vertexFrames[1]), kind: 'bounce_tick', note: 'W1'},
  {f: Math.round(SCH1.end), kind: 'echo_return', gain: -3, note: 'listens'},
  {f: SCH1B.start, kind: 'sensor_pulse', gain: -2, pitch: -1, note: 'flash at W1 again'},
  {f: Math.round(SCH1B.vertexFrames[1]), kind: 'bounce_tick', gain: -2, pitch: -1, note: 'W1'},
  {f: Math.round(SCH1B.end), kind: 'echo_return', gain: -5, note: 'listens'},
  {f: R1_EXT0, kind: 'ruler_extend', note: 'ruler out to |W1 H|'},
  {f: RELAX + 2, kind: 'relief_sigh', note: 'J3a: not which direction'},
  {f: SWEEP0, kind: 'arc_draw', dur: (SWEEP1 - SWEEP0) / 30, note: 'arc 1 sweep'},
  ...HOPS.map((h, i) => ({f: h + HOP_DUR - 1, kind: 'pop_tick' as const, gain: -10 - i, pitch: 2 - i, note: 'ruler tip taps a ghost: same distance'})),
  {f: SCH4.start, kind: 'sensor_pulse', pitch: 2, note: 'flash at W4'},
  {f: Math.round(SCH4.vertexFrames[1]), kind: 'bounce_tick', pitch: 3, note: 'W4'},
  {f: Math.round(SCH4.end), kind: 'echo_return', gain: -3, pitch: 1, note: 'listens'},
  {f: R4_EXT0, kind: 'ruler_extend', pitch: 2, gain: -2, note: 'ruler out to |W4 H|'},
  {f: SWEEP4_0 + SWING4_DUR, kind: 'arc_draw', dur: (SWEEP4_1 - SWEEP4_0 - SWING4_DUR) / 30, pitch: 2, note: 'arc 2 sweep'},
  {f: IMPOSSIBLE - 2, kind: 'pop_tick', gain: -4, note: 'behind the wall: crossed out'},
  {f: K.place20, kind: 'uh_oh', note: 'J3b: one place'},
  {f: BAND_LBL, kind: 'chip_pop', gain: -8, note: 'illustrative band label'},
  ...MANY_SCH.map((q, i) => ({f: q.start, kind: 'sensor_pulse' as const, gain: -5 - i, pitch: i, note: `flash at W${i + 1} (many spots)`})),
  {f: PATCH_RING, kind: 'marker_circle', gain: -6, note: 'ring round the small patch'},
  {f: MODEL, kind: 'marker_circle', gain: -8, pitch: 2, note: 'the assumed object outlined'},
  {f: EX1 + 17, kind: 'indicator_no', gain: -4, note: 'candidate mismatch'},
  {f: CHECK, kind: 'indicator_yes', gain: -4, note: 'candidate match'},
  {f: CULL0 + 2, kind: 'prob_tick', pitch: 0, gain: -6, note: 'thinning'},
  {f: CULL0 + 9, kind: 'prob_tick', pitch: -2, gain: -7, note: 'thinning'},
  {f: CULL0 + 16, kind: 'prob_tick', pitch: -4, gain: -8, note: 'thinning'},
  {f: ASSUME, kind: 'card_flick', gain: -4, note: 'assumption card'},
  {f: PHOTO_LAND, kind: 'card_flick', pitch: -2, gain: -3, note: 'photo frame lands'},
  {f: CROSS0, kind: 'stamp_light', gain: -3, note: 'crossed out'},
  {f: PHOTO_OUT, kind: 'paper_swish', gain: -6, note: 'frame drops away'},
];
