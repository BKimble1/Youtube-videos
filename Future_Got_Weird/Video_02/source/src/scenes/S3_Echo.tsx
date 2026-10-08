import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene, seg, segEnd} from '../lib/timeline';
import {Camera, Layer, worldToScreen, type Cam} from '../lib/camera';
import {E, SNAP, camPath, frameRect, hop, kf, sp, tw} from '../lib/motion';
import {CAM_RAISED, RAISED_TILT} from '../lib/shots';
import {LAYOUT, projectWith, rigAt, rigStyle, viewAt, type ViewState} from '../lib/room';
import {
  LAYOUT as OLAYOUT,
  assertPath,
  confocalPath,
  firstOccluderHit,
  layoutPoints,
  lerpP,
  normalize,
  pathCumulative,
  pathLength,
  pathSchedule,
  scatterDirections,
  sub,
  timeNs,
  visibleIntervals,
  type P2,
} from '../lib/optics';
import {rand} from '../lib/anim';
import {CAST} from '../components/cast';
import {RoomSet, type RoomItem} from '../components/v02/RoomSet';
import {ScatterFan, mixHex, type ToPx} from '../components/v02/Optics';
import {Character2, EXPR, HANDS_ON_HIPS, IDLE2, eyesWorld, mixPose2, settlePose, withPose, type Pose2, type RigPlace} from '../components/v02/Cast2';
import {SensorStand, standGeometry} from '../components/v02/S3_SensorStand';
import {BlockCard, type BlockDrop} from '../components/v02/S3_BlockCard';
import {EchoBoard, EchoCard} from '../components/v02/S3_EchoBoard';

/**
 * S3 · The faint echo (s13–s16). Storyboard shots S3.1–S3.3.
 *
 *  S3.1 s13  raised room view (RAISED_TILT, the camera of S1.4–S1.7; no full fold): a cluster of 24 light dots leaves
 *            the sensor on "sensor" and reaches each stop on its word (wall, person, wall, sensor) at one constant,
 *            slowed speed. At each bounce most of the dots scatter away and fade; 8, then 3, then 1 carry on (seeded).
 *            A tally of the 24 greys out as they are lost. "Each bounce spreads the light": scatter fans at the wall
 *            spot and at him; "most of it is lost": they leave. Chip "slowed down · illustrative".
 *  S3.2 s14  pan to make room; an illustrative arrival card slides in: blocks drop into time slots, a tall stack
 *            "1 bounce · wall", then one small late block "3 bounces · him" ("tiny": he looks smug).
 *  S3.3 s15–s16  the evidence board slides over: the authors' released raw histogram (centre zone of the 3×3-zone
 *            sensor) on a linear axis; one tall spike ("the wall's big echo"); a bar magnifier slides over the tail and
 *            stretches its height ×1 → ×ZOOM ("zoom in to see"); "hundreds of times weaker (this capture)"; the bump is
 *            ringed ("That bump is the clue"), its time after the wall echo is measured ("timing") and turned into
 *            "≈ 1.1 m extra path" ("farther"). Every number comes from S3_EchoBoard's checks against the data file.
 *
 * Every beat is cued from narration words (K); gaps are clamped so the scene survives ±20 % timing changes.
 */

/* ================================================================== cues (narration words) */

const SC = scene('S3');
const K = {
  start: SC.from,
  end: SC.to,
  // s13
  follow: at('s13', 'follow'),
  path: at('s13', 'path'),
  sensorA: at('s13', 'sensor', 1),
  wallA: at('s13', 'wall', 1),
  person: at('s13', 'person'),
  wallB: at('s13', 'wall', 2),
  sensorB: at('s13', 'sensor', 2),
  each: at('s13', 'each'),
  spreads: at('s13', 'spreads'),
  most: at('s13', 'most'),
  lost: at('s13', 'lost'),
  s13End: segEnd('s13'),
  // s14
  s14: seg('s14').from,
  coming: at('s14', 'coming'),
  once: at('s14', 'once'),
  wall14: at('s14', 'wall'),
  our: at('s14', 'our'),
  echo14: at('s14', 'echo'),
  three: at('s14', 'three'),
  tiny: at('s14', 'tiny'),
  s14End: segEnd('s14'),
  // s15
  this15: at('s15', 'this'),
  same: at('s15', 'same'),
  sensor15: at('s15', 'sensor'),
  object: at('s15', 'object'),
  walls: at('s15', "wall's"),
  echo15: at('s15', 'echo'),
  then: at('s15', 'then'),
  later: at('s15', 'later'),
  bump15: at('s15', 'bump'),
  zoom: at('s15', 'zoom'),
  see: at('s15', 'see'),
  capture: at('s15', 'capture'),
  hundreds: at('s15', 'hundreds'),
  s15End: segEnd('s15'),
  // s16
  bump16: at('s16', 'bump'),
  clue: at('s16', 'clue'),
  timing: at('s16', 'timing'),
  farther: at('s16', 'farther'),
  s16End: segEnd('s16'),
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== geometry (same choices as S1.4–S1.7) */

const SENSOR_H = LAYOUT.sensor.h;
const {S, H, W} = layoutPoints(OLAYOUT);
const OCC = LAYOUT.occluder;

// Partition side face (camera-facing long face with the arched panel tops of components/v02/Partition), world px.
const ARCH = 0.09;
const FOOT_H = 0.07;
const topH = (z: number) => {
  const Lp = (OCC.z1 - OCC.z0) / 3;
  const v = (z - OCC.z0) / Lp;
  const u = clamp01(v - Math.floor(Math.min(2.9999, v)));
  return OCC.height - ARCH * (1 - Math.sin(Math.PI * u));
};
const faceX = OCC.x - OCC.thickness / 2;
const facePoly = (s: ViewState) => {
  const pts: {x: number; y: number}[] = [];
  for (let k = 0; k <= 40; k++) {
    const z = OCC.z0 + ((OCC.z1 - OCC.z0) * k) / 40;
    pts.push(projectWith(s, {x: faceX, z, h: topH(z)}));
  }
  pts.push(projectWith(s, {x: faceX, z: OCC.z1, h: FOOT_H}), projectWith(s, {x: faceX, z: OCC.z0, h: FOOT_H}));
  return pts;
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
const segDist = (q: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const u = clamp01(((q.x - a.x) * dx + (q.y - a.y) * dy) / l2);
  return Math.hypot(q.x - a.x - u * dx, q.y - a.y - u * dy);
};

/** CAM_RAISED tilted down a little (the rigs are drawn full height at RAISED_TILT): S1.4–S1.7's framing. */
const CAM_UP: Cam = {...CAM_RAISED, cy: CAM_RAISED.cy - 47};
/** S3.2: the room slides right to make room for the card on the left (S1.6's side framing). */
const CAM_SIDE: Cam = {cx: CAM_UP.cx - 280, cy: CAM_UP.cy, zoom: CAM_UP.zoom};
/**
 * S3.1: the same raised view, closer, so the dots read: both heads, the sensor, the wall spot and the partition's far
 * end (the W -> H leg passes it at the gap by the wall). Framed from the projected points.
 */
const CAM_TRIP: Cam = (() => {
  // Director fix: the first version framed down to the knees (zoom ≈ 1.95), which lost the floor between the
  // partition's far end and the wall, so the gap the light uses could not be seen. This framing keeps the raised view
  // readable as a room: both characters head to feet, the stand, and the floor gap (wall base -> the partition's far
  // foot), while still pushing in enough for the dot cluster to read.
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, RAISED_TILT);
  const gu = rigAt(H.x, H.z, RAISED_TILT);
  const s = viewAt(RAISED_TILT);
  const farFoot = projectWith(s, {x: OCC.x, z: OCC.z0, h: 0});
  const x0 = op.x - 150 * op.scale;
  const x1 = gu.x + 170 * gu.scale;
  const y0 = gu.y - 470 * gu.scale; // the tip of his hair
  const y1 = Math.max(op.y, gu.y, farFoot.y) + 30; // shoes (and the partition's far foot) in frame
  const c = frameRect(x0, y0, x1, y1, 30);
  const zoom = Math.min(1.6, c.zoom);
  // feet near the bottom edge; the headroom goes to the tally and the chip above the heads
  return {cx: c.cx, cy: y1 - (1040 - 540) / zoom, zoom};
})();

/**
 * The wall spot of the round trip: in plan the legs clear the partition (assertPath), and on screen at RAISED_TILT
 * every point of S -> W and W -> H stays outside the partition's drawn silhouette by MIN_CLEAR_PX, so the W -> H leg is
 * seen passing the partition's far end at the gap by the wall. W3 first (S1's choice), then W4. Throws if neither.
 */
const MIN_CLEAR_PX = 18;
const pickWall = () => {
  const s = viewAt(RAISED_TILT);
  const poly = facePoly(s);
  const report: string[] = [];
  for (const id of ['W3', 'W4']) {
    const w = W.find((p) => p.id === id)!;
    const path = confocalPath(S, w, H);
    assertPath(path, OLAYOUT);
    let minPx = Infinity;
    for (const [a, b] of [[S, w], [w, H]] as [P2, P2][]) {
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        const q = projectWith(s, {x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: SENSOR_H});
        if (inPoly(poly, q)) minPx = -1;
        else for (let k = 0; k < poly.length; k++) minPx = Math.min(minPx, segDist(q, poly[k], poly[(k + 1) % poly.length]) * CAM_RAISED.zoom);
      }
    }
    report.push(`${id}: ${minPx.toFixed(1)} px`);
    if (minPx >= MIN_CLEAR_PX) return {w, path};
  }
  throw new Error(`S3: no wall sample with a clear raised-view path (${report.join(', ')})`);
};
const PICK = pickWall();
const WP = PICK.w;
const PATH = PICK.path; // S, W, H, W, S
const CUM = pathCumulative(PATH);
const TOTAL = CUM[CUM.length - 1];

/* ================================================================== beats derived from the cues */

// S3.1 — push in, route preview, the cluster's trip, the recap fans
const PUSH0 = K.start + 4;
const PUSH_DUR = clamp(K.sensorA - 8 - PUSH0, 30, 56);
const ROUTE0 = K.path;
const ROUTE1 = Math.max(ROUTE0 + 18, Math.min(ROUTE0 + 36, K.sensorA - 4));
const LAUNCH = K.sensorA;
const ARRIVE = Math.max(LAUNCH + 72, K.sensorB);
const SCHED = pathSchedule(PATH, {start: LAUNCH, dur: ARRIVE - LAUNCH});
const VF = SCHED.vertexFrames; // S, W, H, W, S
const SPEED = TOTAL / (ARRIVE - LAUNCH); // metres per frame (slowed: illustrative)
const FANS0 = Math.max(ARRIVE + 10, K.spreads - 6);
const FANS_OUT = Math.max(FANS0 + 24, K.most);
const RELAX = Math.max(FANS_OUT, K.lost - 4); // he relaxes as the light is lost
const TAGS_OUT = K.s13End - 6;

// S3.2 — pan, card, blocks
const PAN0 = K.s13End - 4;
const PAN_DUR = 30;
const CARD0 = Math.max(PAN0 + PAN_DUR - 10, K.s14 - 6); // after the camera has made room
const CARD_DUR = 16;
const WALL_N = 9;
const WALL0 = Math.max(CARD0 + CARD_DUR + 4, K.coming - 4);
const WALL_STEP = clamp((K.once - 2 - WALL0) / (WALL_N - 1), 2, 4);
const HIM_LAND = Math.max(WALL0 + WALL_STEP * (WALL_N - 1) + 14, K.echo14 + 6);
const WALL_LAST = Math.round(WALL0 + WALL_STEP * (WALL_N - 1));
const WALL_LABEL = Math.max(K.once - 2, WALL_LAST + 2);
const HIM_LABEL = Math.max(K.three - 2, HIM_LAND + 4);
const TINY = Math.max(K.tiny, HIM_LAND + 10);
const SMUG = TINY;

// S3.3 — the evidence board
const BOARD0 = Math.max(SMUG + 14, K.this15 - 2);
const BOARD_DUR = 14;
const LAND = BOARD0 + BOARD_DUR;
const DRAW_A0 = Math.max(LAND + 16, K.walls - 4);
const DRAW_A1 = Math.max(DRAW_A0 + 14, K.echo15);
const DRAW_B0 = Math.max(DRAW_A1 + 6, K.then);
const DRAW_B1 = Math.max(DRAW_B0 + 24, K.later + 8);
const LENS0 = Math.max(DRAW_B1 + 2, K.bump15 - 6);
const SLIDE0 = LENS0 + 8;
const SLIDE1 = Math.max(SLIDE0 + 14, K.zoom);
const ZOOM0 = SLIDE1 + 2;
const ZOOM1 = Math.max(ZOOM0 + 22, K.see + 12);
const RATIO0 = Math.max(ZOOM1 + 4, K.hundreds - 4);
const RING0 = Math.max(RATIO0 + 20, K.bump16 - 2);
const DIM0 = Math.max(RING0 + 18, K.timing - 2);
const EXTRA0 = Math.max(DIM0 + 14, K.farther - 4);

/* ================================================================== the light dots (S3.1) */

const NDOTS = 24;
/** Dot radius (world px): sized for CAM_TRIP's zoom so a dot is ~16 px on screen. */
const DOT_R = 10;
/** Dots carried on each leg (S->W, W->H, H->W, W->S): most are lost at every bounce (illustrative). */
const SURVIVE = [24, 8, 3, 1];
/** A seeded ranking: dot i survives leg L when RANK[i] < SURVIVE[L]. */
const RANK = (() => {
  const idx = Array.from({length: NDOTS}, (_, i) => i);
  idx.sort((a, b) => rand(7100 + a * 13) - rand(7100 + b * 13));
  const r = new Array<number>(NDOTS);
  idx.forEach((dot, k) => (r[dot] = k));
  return r;
})();
// spread of the cluster: along the path (m) and across it (px); the last survivor rides at the front
const LAG = Array.from({length: NDOTS}, (_, i) => (RANK[i] === 0 ? 0.01 : 0.03 + rand(7300 + i * 7) * 0.24));
const ACROSS = Array.from({length: NDOTS}, (_, i) => (RANK[i] === 0 ? 0 : (rand(7500 + i * 11) - 0.5) * 30));
/** Leg each dot is lost at (1..3 = the bounce at PATH[L]), or 4 for the one that comes home. */
const LOST_AT = RANK.map((r) => (r < SURVIVE[3] ? 4 : r < SURVIVE[2] ? 3 : r < SURVIVE[1] ? 2 : 1));
/** Scatter direction of each lost dot (cosine-weighted about the surface normal, seeded). */
const SCATTER: (P2 & {max: number})[] = (() => {
  const out: (P2 & {max: number})[] = new Array(NDOTS);
  for (const L of [1, 2, 3]) {
    const lost = Array.from({length: NDOTS}, (_, i) => i).filter((i) => LOST_AT[i] === L);
    const V = PATH[L];
    const normal = L === 2 ? normalize(sub(WP, H)) : {x: 0, z: 1};
    const dirs = scatterDirections(normal, lost.length, 40 + L, 0.9);
    // shuffle the directions over the lost dots so neighbours in the cluster do not fan in order
    const order = lost.map((_, k) => k).sort((a, b) => rand(7700 + L * 31 + a) - rand(7700 + L * 31 + b));
    lost.forEach((i, k) => {
      const d = dirs[order[k]];
      const reach = 0.7 + rand(7900 + i * 5) * 0.55;
      const end = {x: V.x + d.x * reach, z: V.z + d.z * reach};
      const hit = firstOccluderHit(V, end, OLAYOUT, 0.02);
      out[i] = {x: d.x, z: d.z, max: reach * hit};
    });
  }
  return out;
})();
const LEG_I = [1, 0.62, 0.42, 0.3]; // intensity per leg (thinner, paler later)

type DotState = {p: P2; leg: number; op: number; r: number; I: number; across: number; scattering: boolean};
/** Where dot i is at frame g (null when not in flight). */
const dotAt = (i: number, g: number): DotState | null => {
  const d = SPEED * (g - LAUNCH) - LAG[i];
  if (d <= 0) return null;
  const lostAt = LOST_AT[i];
  const dEnd = CUM[lostAt];
  if (d < dEnd) {
    let L = 0;
    while (L < 3 && d >= CUM[L + 1]) L++;
    const u = (d - CUM[L]) / (CUM[L + 1] - CUM[L]);
    return {p: lerpP(PATH[L], PATH[L + 1], u), leg: L, op: 1, r: DOT_R * (0.75 + 0.25 * LEG_I[L]), I: LEG_I[L], across: ACROSS[i] * (0.6 + 0.4 * LEG_I[L]), scattering: false};
  }
  if (lostAt === 4) return null; // home: absorbed by the detector
  const sc = SCATTER[i];
  const s = d - dEnd;
  if (s >= sc.max) return null;
  const V = PATH[lostAt];
  const I = LEG_I[lostAt - 1];
  const fade = 1 - E.in(clamp01(s / sc.max));
  return {p: {x: V.x + sc.x * s, z: V.z + sc.z * s}, leg: lostAt - 1, op: fade, r: DOT_R * (0.75 + 0.25 * I) * (1 - 0.35 * clamp01(s / sc.max)), I, across: 0, scattering: true};
};
/** How many dots are still travelling the path (not lost) after frame g. */
const onPath = (g: number) => {
  let n = 0;
  for (let i = 0; i < NDOTS; i++) {
    const d = SPEED * (g - LAUNCH) - LAG[i];
    if (d < CUM[LOST_AT[i]] || LOST_AT[i] === 4) n++;
  }
  return n;
};
/** Frame at which dot i leaves the path (its bounce), or Infinity for the one that comes home. */
const lostFrame = (i: number) => (LOST_AT[i] === 4 ? Infinity : LAUNCH + (CUM[LOST_AT[i]] + LAG[i]) / SPEED);

/* ================================================================== S3.2 drops (illustrative slots from the room's geometry) */

const SLOT_NS = 1; // one slot per nanosecond on the card
const T_WALL = timeNs(2 * pathLength([S, WP]));
const T_HIM = timeNs(TOTAL);
const DROPS: BlockDrop[] = [
  ...Array.from({length: WALL_N}, (_, k) => ({slot: Math.floor(T_WALL / SLOT_NS), land: Math.round(WALL0 + k * WALL_STEP), tone: 'teal' as const})),
  {slot: Math.floor(T_HIM / SLOT_NS), land: HIM_LAND, tone: 'saffron' as const},
];

/* ================================================================== sound cue sheet */

export const SFX: Sfx[] = [
  {f: K.start, kind: 'amb_room', dur: (K.end - K.start) / 30, gain: -2},
  {f: LAUNCH, kind: 'sensor_pulse', gain: -4},
  {f: Math.round(VF[1]), kind: 'bounce_tick', pitch: 2, gain: -2},
  {f: Math.round(VF[2]), kind: 'bounce_tick', pitch: -1, gain: -4},
  {f: Math.round(VF[3]), kind: 'bounce_tick', pitch: 3, gain: -7},
  {f: Math.round(VF[4]), kind: 'echo_return', gain: -6},
  {f: CARD0 + CARD_DUR - 2, kind: 'paper_slide', gain: -4},
  {f: DROPS[0].land, kind: 'block_drop', gain: -2},
  {f: DROPS[5].land, kind: 'block_drop', pitch: 2, gain: -6},
  {f: DROPS[WALL_N - 1].land, kind: 'block_drop', pitch: 4, gain: -5},
  {f: HIM_LAND, kind: 'block_drop', pitch: -5, gain: -9},
  {f: SMUG + 4, kind: 'smug_exhale', gain: -3},
  {f: LAND, kind: 'paper_slap'},
  {f: SLIDE0, kind: 'magnifier_slide', gain: -3},
  {f: RING0, kind: 'marker_circle'},
];

/* ================================================================== helpers */

/** Room-view mapping for a plan point at the light paths' height (the 2D model's plane, h = sensor height). */
const roomToPx = (s: ViewState): ToPx => (p) => {
  const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
  return {x: q.x, y: q.y};
};
const pulseAt = (g: number, t0: number, dur: number) => (g < t0 || g > t0 + dur ? 0 : Math.sin(((g - t0) / dur) * Math.PI));

/* ================================================================== the cast */

const GUESSER_SEED = 22;
const CHECKER_SEED = 3;

const guesserState = (g: number, tilt: number, cluster: {x: number; y: number} | null) => {
  const place0 = rigAt(H.x, H.z, tilt);
  const place: RigPlace = {x: place0.x, y: place0.y, scale: place0.scale, frame: g, seed: GUESSER_SEED, life: 0.45};
  // wary at the start (S1/S2 left him uneasy), hands on hips
  const wary: Pose2 = withPose(withPose(HANDS_ON_HIPS, {lid: 0.12, eyes: 1.06, brows: 0.4, browAsym: 0.2, mouth: 'hmm', lookX: -0.6, lookY: -0.4, tilt: -3}), settlePose(1, -1));
  let pose: Pose2 = wary;
  // his eyes follow the light while it travels
  const follow = Math.min(tw(g, LAUNCH - 6, 8, E.inOut), 1 - tw(g, ARRIVE + 4, 12, E.inOut));
  if (follow > 0 && cluster) {
    const eye = eyesWorld(place, pose);
    const lx = clamp((cluster.x - eye.x) / 260, -1, 1);
    const ly = clamp((cluster.y - eye.y) / 220, -1, 1);
    pose = {...pose, lookX: lerp(pose.lookX, lx, follow), lookY: lerp(pose.lookY, ly, follow)};
  }
  // the light reaches him: a flinch (blink, wide eyes, small hop), then wary again
  const hit = VF[2];
  const fl = pulseAt(g, hit - 1, 16);
  if (fl > 0) pose = mixPose2(pose, {...pose, eyes: 1.2, pupil: 0.7, brows: 0.95, mouth: 'o', lid: 0, tilt: -6, hunch: 0.05}, fl);
  if (g >= hit - 1 && g < hit + 2) pose = {...pose, blink: 0.1};
  if (fl > 0) pose = {...pose, bob: hop(g, hit, 6, 8)};
  // "most of it is lost": relief, smug again
  const relax = tw(g, RELAX, 16, E.inOut);
  if (relax > 0) {
    const smug: Pose2 = withPose(withPose(HANDS_ON_HIPS, {...EXPR.smug, lookX: -0.5, lookY: -0.15}), settlePose(1, -1));
    pose = mixPose2(pose, smug, relax);
  }
  // S3.2: watches the card (left)
  const card = tw(g, CARD0 + 4, 12, E.inOut);
  if (card > 0) pose = mixPose2(pose, {...pose, lookX: -0.95, lookY: 0.1, tilt: 2}, card);
  // "tiny": the smuggest he gets (chin up, eyes closed a moment, smirk)
  const sm = tw(g, SMUG, 10, E.out);
  if (sm > 0) {
    const ex = pulseAt(g, SMUG + 2, 26);
    const very: Pose2 = withPose(withPose(HANDS_ON_HIPS, {...EXPR.smug, lid: 0.55 + 0.4 * ex, browAsym: 0.8, tilt: 8, lookX: -0.7, lookY: -0.2, mouth: 'smirk'}), settlePose(1.1, -1));
    pose = mixPose2(pose, very, sm);
  }
  return {pose, place};
};

const checkerState = (g: number, tilt: number) => {
  const op = rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt);
  const place: RigPlace = {x: op.x, y: op.y, scale: op.scale, frame: g, seed: CHECKER_SEED, life: 0.35};
  const atReadout = {lookX: 0.62, lookY: 0.32, tilt: 3};
  const atWall = {lookX: 0.25, lookY: -0.75, tilt: -2};
  const atCard = {lookX: -0.85, lookY: 0.15, tilt: -2};
  const atHim = {lookX: 0.95, lookY: -0.05, tilt: -1};
  // she glances up at the wall spot as the light goes out, back to her readout for the return
  const up = Math.min(tw(g, VF[1] - 10, 10, E.inOut), 1 - tw(g, VF[3] + 2, 10, E.inOut));
  const card = Math.min(tw(g, CARD0 + 10, 12, E.inOut), 1 - tw(g, SMUG + 2, 8, E.inOut));
  const him = tw(g, SMUG + 2, 8, E.inOut);
  const mixL = (a: number, b: number, c: number, d: number) => {
    let v = a;
    v = lerp(v, b, up);
    v = lerp(v, c, card);
    v = lerp(v, d, him);
    return v;
  };
  const look = {
    lookX: mixL(atReadout.lookX, atWall.lookX, atCard.lookX, atHim.lookX),
    lookY: mixL(atReadout.lookY, atWall.lookY, atCard.lookY, atHim.lookY),
    tilt: mixL(atReadout.tilt, atWall.tilt, atCard.tilt, atHim.tilt),
  };
  // a raised brow when the one dot comes home
  const brow = sp(g, ARRIVE + 2, SNAP) * (1 - tw(g, ARRIVE + 30, 14));
  const pose: Pose2 = withPose({...IDLE2, armsFront: 'R'}, {...EXPR.deadpan, ...look, brows: -0.05 + 0.35 * brow + 0.15 * him, browAsym: 0.45 * brow + 0.35 * him});
  return {pose, place};
};

/* ================================================================== the room shot (S3.1, S3.2) */

const RoomShot: React.FC<{g: number}> = ({g}) => {
  const tilt = RAISED_TILT;
  const s = viewAt(tilt);
  const toPx = roomToPx(s);
  const cam: Cam = camPath(g, CAM_UP, [
    {at: PUSH0, dur: PUSH_DUR, to: CAM_TRIP},
    {at: PAN0, dur: PAN_DUR, to: CAM_SIDE},
  ]);

  /* ---- dots now */
  const dots: (DotState & {i: number})[] = [];
  for (let i = 0; i < NDOTS; i++) {
    const st = dotAt(i, g);
    if (st) dots.push({...st, i});
  }
  const flying = dots.filter((d) => !d.scattering);
  const clusterPx = flying.length ? (() => {
    const q = flying.map((d) => toPx(d.p));
    return {x: q.reduce((a, p) => a + p.x, 0) / q.length, y: q.reduce((a, p) => a + p.y, 0) / q.length};
  })() : null;

  const gu = guesserState(g, tilt, clusterPx);
  const ch = checkerState(g, tilt);
  const geo = standGeometry(tilt);

  /* ---- hiding things behind the partition, the stand and the people */
  const poly = facePoly(s);
  const box = geo.box;
  const hidden = (p: P2) => {
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    if (p.x > faceX && inPoly(poly, q)) return true;
    if (Math.hypot(p.x - S.x, p.z - S.z) < 0.25 && q.x > box.x0 - 2 && q.x < box.x1 + 2 && q.y > box.y0 - 2 && q.y < box.y1 + 2) return true;
    return false;
  };
  const rigHides = (pl: {x: number; y: number; scale: number}, q: {x: number; y: number}) => {
    const lx = (q.x - pl.x) / pl.scale;
    const ly = (q.y - pl.y) / pl.scale;
    if ((lx / 92) ** 2 + ((ly + 388) / 100) ** 2 < 1) return true; // head and hair
    if (Math.abs(lx) < 82 && ly > -300 && ly < -140) return true; // torso
    return Math.abs(lx) < 60 && ly >= -140 && ly < 0; // legs
  };
  const hiddenScatter = (p: P2) => {
    if (hidden(p)) return true;
    const q = projectWith(s, {x: p.x, z: p.z, h: SENSOR_H});
    return (p.z < LAYOUT.operator.z && rigHides(ch.place, q)) || (p.z < H.z + 0.05 && rigHides(gu.place, q));
  };

  /* ---- readout: bars; the late bump lights when the one dot comes home */
  const homeHl = sp(g, ARRIVE, SNAP) * (1 - tw(g, ARRIVE + 50, 20));
  const firing = pulseAt(g, LAUNCH - 3, 9);

  const items: RoomItem[] = [
    {
      key: 'checker',
      x: LAYOUT.operator.x,
      z: LAYOUT.operator.z,
      w: 0.3,
      node: <Character2 look={CAST.checker} pose={ch.pose} frame={g} seed={CHECKER_SEED} x={ch.place.x} y={ch.place.y} scale={ch.place.scale} life={ch.place.life} style={rigStyle(tilt, ch.place.scale)} />,
    },
    {
      key: 'stand',
      x: S.x,
      z: LAYOUT.operator.z + 0.04,
      w: 0.17,
      height: 1.4,
      node: <SensorStand tilt={tilt} sensor={{reveal: 1, bumpHighlight: homeHl, led: 1, firing}} />,
    },
    {
      key: 'guesser',
      x: H.x,
      z: H.z,
      w: 0.3,
      node: <Character2 look={CAST.guesser} pose={gu.pose} frame={g} seed={GUESSER_SEED} x={gu.place.x} y={gu.place.y} scale={gu.place.scale} life={gu.place.life} style={rigStyle(tilt, gu.place.scale)} />,
    },
  ];

  /* ---- overlay: route preview, recap fans, the dots */
  const route = tw(g, ROUTE0, ROUTE1 - ROUTE0, E.inOut);
  const routeOp = 0.9 * (1 - 0.5 * tw(g, LAUNCH, 10)) * (1 - tw(g, PAN0, 12));
  const fanT = tw(g, FANS0, 14);
  const fanOut = tw(g, FANS_OUT, 22, E.inOut);
  const dirsW = scatterDirections({x: 0, z: 1}, 9, 4);
  const dirsH = scatterDirections(sub(WP, H), 7, 9);
  const lanePx = 7;
  const legNrm = PATH.slice(0, -1).map((a, k) => {
    const pa = toPx(a);
    const pb = toPx(PATH[k + 1]);
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    return {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
  });
  const overlay = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {route > 0 && routeOp > 0 && <Route points={[S, WP, H]} head={route * pathLength([S, WP, H])} toPx={toPx} hidden={hidden} opacity={routeOp} />}
      {fanT > 0 && fanOut < 1 && (
        // both fans only reach the partition from behind its camera-facing face (the wall fan stays within the gap,
        // z < the partition's far end), so the partition's silhouette mask clips them exactly
        <g mask="url(#s3occ)">
          <ScatterFan asGroup origin={WP} dirs={dirsW} length={0.6} toPx={toPx} t={fanT} release={fanOut} layout={OLAYOUT} hidden={hiddenScatter} seed={5} />
          <ScatterFan asGroup origin={H} dirs={dirsH} length={0.5} toPx={toPx} t={tw(g, FANS0 + 5, 14)} release={fanOut} layout={OLAYOUT} hidden={hiddenScatter} seed={8} width={3.5} color={C.saffron} />
        </g>
      )}
      {[1, 2, 3, 4].map((v) => (
        <StopRing key={v} center={PATH[v]} g={g} at={VF[v]} toPx={toPx} I={v === 4 ? 0.5 : LEG_I[v - 1]} hidden={hiddenScatter} />
      ))}
      {/* Dots on his side of the partition (x beyond its camera-facing face) are clipped by the partition's drawn
          silhouette (face polygon grown by its outline), so a dot whose lane offset pushes it onto the partition's top
          corner is not drawn over it (director fix). */}
      <defs>
        <mask id="s3occ" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={10000} height={10000}>
          <rect x={-4000} y={-4000} width={10000} height={10000} fill="#fff" />
          <polygon points={poly.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="#000" stroke="#000" strokeWidth={12} strokeLinejoin="round" />
        </mask>
      </defs>
      {[false, true].map((behind) => (
        <g key={behind ? 'behind' : 'front'} mask={behind ? 'url(#s3occ)' : undefined}>
          {dots.map((d) => {
            if (d.p.x > faceX !== behind) return null;
            if (d.scattering ? hiddenScatter(d.p) : hidden(d.p)) return null;
            const q = toPx(d.p);
            const n = d.scattering ? {x: 0, y: 0} : legNrm[d.leg];
            const off = d.scattering ? 0 : lanePx + d.across;
            const x = q.x + n.x * off;
            const y = q.y + n.y * off;
            return (
              <g key={d.i} opacity={f2(d.op)}>
                <circle cx={f2(x)} cy={f2(y)} r={f2(d.r)} fill={mixHex(C.saffron, C.paper, (1 - d.I) * 0.55)} stroke={C.ink} strokeWidth={2.5} />
                {!d.scattering && d.I > 0.5 && <circle cx={f2(x - d.r * 0.3)} cy={f2(y - d.r * 0.3)} r={f2(d.r * 0.3)} fill={C.cream} opacity={0.7} />}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );

  /* ---- screen-space: stop tags, tally, chip */
  const scr = (p: {x: number; y: number}) => worldToScreen(cam, p.x, p.y);
  const tagOut = 1 - tw(g, TAGS_OUT, 10);
  // stop names (screen px offsets from world anchors; the camera holds still while they are up)
  const headC = {x: gu.place.x, y: gu.place.y - 385 * gu.place.scale};
  const tags: {text: string; at: number; again?: number; p: {x: number; y: number}; dx: number; dy: number}[] = [
    {text: 'sensor', at: K.sensorA, again: K.sensorB, p: {x: geo.box.x1, y: (geo.box.y0 + geo.box.y1) / 2}, dx: 96, dy: 6},
    {text: 'wall', at: K.wallA, again: K.wallB, p: toPx(WP), dx: 96, dy: -66},
    {text: 'person', at: K.person, p: headC, dx: 232, dy: 10},
  ];
  const chipT = tw(g, LAUNCH - 8, 10) * (1 - tw(g, PAN0 + 4, 10));
  const tallyT = tw(g, LAUNCH - 4, 10) * (1 - tw(g, PAN0, 10));

  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} items={items}>
            {overlay}
          </RoomSet>
        </Layer>
      </Camera>
      {tagOut > 0 &&
        tags.map((tg) => {
          const k = sp(g, tg.at - 2, SNAP);
          if (k <= 0) return null;
          const again = tg.again ? pulseAt(g, tg.again - 2, 12) : 0;
          const q = scr(tg.p);
          return (
            <div
              key={tg.text}
              style={{
                position: 'absolute',
                left: f2(q.x + tg.dx),
                top: f2(q.y + tg.dy),
                transform: `translate(-50%, -50%) scale(${f2(Math.min(1.08, k) * (1 + 0.12 * again))})`,
                opacity: clamp01(k * 2) * tagOut,
                padding: '6px 18px 8px',
                borderRadius: 999,
                background: again > 0.05 ? mixHex(C.cream, C.saffronLight, again) : C.cream,
                border: `3px solid ${C.ink}`,
                fontFamily: F.body,
                fontWeight: 800,
                fontSize: 36,
                color: C.ink,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {tg.text}
            </div>
          );
        })}
      {tallyT > 0 && <Tally g={g} t={tallyT} />}
      {chipT > 0 && (
        <div style={{position: 'absolute', right: 96, top: 60, opacity: chipT, transform: `translateY(${f2((1 - E.out(chipT)) * -10)}px)`}}>
          <div style={{padding: '9px 24px 11px', borderRadius: 999, background: C.saffron, border: `3px solid ${C.saffronDeep}`, fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink, lineHeight: 1, whiteSpace: 'nowrap'}}>
            slowed down · illustrative
          </div>
        </div>
      )}
      <BlockCard g={g} drops={DROPS} t={{enter: tw(g, CARD0, CARD_DUR), wallLabel: tw(g, WALL_LABEL, 10), himLabel: tw(g, HIM_LABEL, 10), tiny: tw(g, TINY, 10)}} />
    </AbsoluteFill>
  );
};

/**
 * A ring that spreads on the floor plane (at the path's height) where the light touches a stop: a circle in plan,
 * projected, kept to the room side of the wall (z >= 0), so a ring at a wall spot never runs into the wall.
 */
const StopRing: React.FC<{center: P2; g: number; at: number; toPx: ToPx; I: number; hidden?: (p: P2) => boolean}> = ({center, g, at: t0, toPx, I, hidden}) => {
  const dur = 18;
  if (g < t0 || g > t0 + dur) return null;
  const u = (g - t0) / dur;
  const r = 0.06 + 0.3 * E.out(u);
  const runs: string[] = [];
  let cur: string[] = [];
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const p = {x: center.x + Math.cos(a) * r, z: center.z + Math.sin(a) * r};
    const ok = p.z >= 0 && !(hidden && hidden(p));
    if (ok) {
      const q = toPx(p);
      cur.push(`${f2(q.x)} ${f2(q.y)}`);
    } else if (cur.length) {
      if (cur.length > 1) runs.push('M ' + cur.join(' L '));
      cur = [];
    }
  }
  if (cur.length > 1) runs.push('M ' + cur.join(' L '));
  return (
    <g opacity={f2((1 - u) * 0.9)}>
      {runs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={mixHex(C.saffronDeep, C.paper, (1 - I) * 0.5)} strokeWidth={f2(5 * (1 - 0.5 * u))} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** The 24 dots of one flash: each greys out when its dot leaves the path. */
const Tally: React.FC<{g: number; t: number}> = ({g, t}) => {
  const n = onPath(g);
  const order = Array.from({length: NDOTS}, (_, i) => i).sort((a, b) => RANK[a] - RANK[b]); // survivors first
  return (
    <div style={{position: 'absolute', left: 60, top: 50, opacity: t, transform: `translateY(${f2((1 - E.out(t)) * -10)}px)`}}>
      <div style={{padding: '12px 20px 12px', borderRadius: 20, background: C.cream, border: `3px solid ${C.ink}`, boxShadow: `6px 7px 0 ${C.shadow}`}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: F.body, fontWeight: 800, fontSize: 34, color: C.inkSoft, lineHeight: 1}}>
          <span>light still on the path</span>
          <span style={{fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: C.ink, minWidth: 54, textAlign: 'right'}}>{n}</span>
        </div>
        <svg width={12 * 25} height={2 * 25 + 4} style={{display: 'block', marginTop: 10}}>
          {order.map((dot, k) => {
            const lf = lostFrame(dot);
            const gone = clamp01((g - lf) / 8);
            const cx = 12.5 + (k % 12) * 25;
            const cy = 12.5 + Math.floor(k / 12) * 25;
            const r = 9 * (1 - 0.25 * gone);
            return <circle key={dot} cx={cx} cy={cy + 4 * E.out(gone)} r={f2(r)} fill={mixHex(C.saffron, C.paperLine, gone)} stroke={gone > 0.5 ? C.inkMuted : C.ink} strokeWidth={2.5} />;
          })}
        </svg>
      </div>
    </div>
  );
};

/** A dashed route along a plan polyline, drawn on up to `head` metres; stretches the camera cannot see are skipped. */
const Route: React.FC<{points: P2[]; head: number; toPx: ToPx; hidden: (p: P2) => boolean; opacity: number}> = ({points, head, toPx, hidden, opacity}) => {
  assertPath(points, OLAYOUT);
  const runs: string[] = [];
  let s0 = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k];
    const b = points[k + 1];
    const L = pathLength([a, b]);
    const uMax = clamp01((head - s0) / L);
    s0 += L;
    if (uMax <= 0) break;
    for (const [u0, u1] of visibleIntervals(a, b, hidden, 48)) {
      const e = Math.min(u1, uMax);
      if (e <= u0) continue;
      const p = toPx(lerpP(a, b, u0));
      const q = toPx(lerpP(a, b, e));
      runs.push(`M ${f2(p.x)} ${f2(p.y)} L ${f2(q.x)} ${f2(q.y)}`);
    }
  }
  return (
    <g opacity={opacity}>
      {runs.map((d, i) => (
        <path key={i} d={d} stroke={C.saffronDeep} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" fill="none" />
      ))}
    </g>
  );
};

/* ================================================================== the evidence board (S3.3) */

const BoardShot: React.FC<{g: number}> = ({g}) => {
  const slide = tw(g, BOARD0, BOARD_DUR, E.out);
  const drawNs = g < DRAW_A0 ? -99 : kf(g, [
    [DRAW_A0, -2.7],
    [DRAW_A1, 0.35, E.inOut],
    [DRAW_B0, 0.35],
    [DRAW_B1, 8.6, E.inOut],
  ]);
  return (
    <AbsoluteFill style={{transform: `translateX(${f2((1 - slide) * -1960)}px)`}}>
      <EchoCard>
        <EchoBoard
          t={{
            content: 1,
            axes: tw(g, LAND + 2, 14),
            chip: tw(g, K.same - 2, 10),
            source: tw(g, K.same + 8, 10),
            box: tw(g, K.sensor15 - 4, 14),
            boxCentre: tw(g, Math.max(K.object, K.sensor15 + 10), 12),
            drawNs,
            spikeLabel: tw(g, DRAW_A1 + 2, 10),
            lens: tw(g, LENS0, 10),
            lensSlide: tw(g, SLIDE0, SLIDE1 - SLIDE0, E.linear),
            zoom: tw(g, ZOOM0, ZOOM1 - ZOOM0, E.inOut),
            ratio: tw(g, RATIO0, 14),
            ring: tw(g, RING0, 16, E.inOut),
            dim: tw(g, DIM0, 18),
            extra: tw(g, EXTRA0, 14),
          }}
        />
      </EchoCard>
    </AbsoluteFill>
  );
};

/* ================================================================== the scene */

export const S3Echo: React.FC = () => {
  const g = useG();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {g < LAND + 1 && <RoomShot g={g} />}
      {g >= BOARD0 && <BoardShot g={g} />}
    </AbsoluteFill>
  );
};
