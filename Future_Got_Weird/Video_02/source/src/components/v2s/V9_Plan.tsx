import React from 'react';
import layoutJson from '../../data/layout.json';
import {C} from '../../theme';
import {rand} from '../../lib/anim';
import type {Cam} from '../../lib/camera';
import {TOKEN_R} from '../../lib/room';
import {LAYOUT, assertPath, bandMembership, extractContours, lerpP, possibleCloud, sub, type BandSpec, type GridSpec, type P2, type ScalarField} from '../../lib/optics';
import {PlanSvg, PlanView, bandsFor, planPx, type PanelGeo} from '../v02/S6_PlanView';
import {Band, SensorGlyph, WallMarker, polyD} from '../v02/Optics';
import {GuesserToken} from '../v02/Tokens';

/**
 * V9 only: the plan of our room (layout.json, I1, illustrative) for the motion-aware fusion scene.
 *
 * Everything here is geometry, fields and drawing; the scene drives it from its cue constants. Built on the v1 S6 plan
 * machinery (components/v02/S6_PlanView: RoomSet at tilt 1 through a framed window and a camera) so the full-frame
 * plan at CAM_PLAN_ACT is the same picture as V8's last frame (the hand-off) and as S6.5.
 *
 *  - Sensor positions come from layout.json frames A and B1 only; the hidden track is H_A → H_B → H_C → H_D.
 *  - Frame 2 of V9.1/V9.2 (I1 frame B2: he steps H_A → H_B) also has the sensor head jiggled: it turns JIG_DEG on its
 *    stand, so its four zones land on new wall spots (zone edges of frame A turned about S_A). Every light path the
 *    bands stand for (S → W → H → W → S) is checked against the partition at module load (assertPath).
 *  - "Just adding" = plain stacking: each point scores the sum of its memberships in all the bands of the frames being
 *    added (the I1 "count votes" rule, with soft band edges); the drawn streak is that score's top quarter. Its length
 *    is measured at module load (≈ 0.86 m for the two frames, as I1 frame B2; asserted 0.75–0.97 m).
 *  - Tracking = a small particle filter (the released code's idea, illustrative numbers): every guess drifts by a
 *    random step (σ 7 cm per axis, the released config), the guesses outside the new frame's region fade, and the
 *    survivors are copied. Seeded, computed once at module load.
 */

/* ================================================================== layout */

type LJ = {
  frames: Record<'A' | 'B1', {sensor: [number, number]; aimX: number; zoneEdgesX: number[]; wallX: number[]}>;
  hidden: {x: number; z: number};
  hiddenB: {x: number; z: number};
  hiddenTrack: {H_C: {x: number; z: number}; H_D: {x: number; z: number}};
  bandHalfWidth: {oneBin: number; twoBins: number};
};
const L = layoutJson as unknown as LJ;
export const P = (x: number, z: number, id?: string): P2 => ({x, z, id});

export const SA = P(L.frames.A.sensor[0], L.frames.A.sensor[1], 'S_A');
export const SB = P(L.frames.B1.sensor[0], L.frames.B1.sensor[1], 'S_B1');
export const AIM_A = P(L.frames.A.aimX, 0);
export const AIM_B = P(L.frames.B1.aimX, 0);
export const WA = L.frames.A.wallX.map((x, i) => P(x, 0, `A.W${i + 1}`));
export const WB = L.frames.B1.wallX.map((x, i) => P(x, 0, `B1.W${i + 1}`));
export const HA = P(L.hidden.x, L.hidden.z, 'H_A');
export const HB = P(L.hiddenB.x, L.hiddenB.z, 'H_B');
export const HC = P(L.hiddenTrack.H_C.x, L.hiddenTrack.H_C.z, 'H_C');
export const HD = P(L.hiddenTrack.H_D.x, L.hiddenTrack.H_D.z, 'H_D');
export const TRACK: P2[] = [HA, HB, HC, HD];
export const HW1 = L.bandHalfWidth.oneBin;

/** The jiggle: the sensor head turns this many degrees on its stand (negative = the zones swing left along the wall). */
export const JIG_DEG = -5;
/** Frame A's four zones as wall spots for a head turned by `deg` (the zone edges' angles from S_A, turned; each spot is
 *  the midpoint of its zone's two edges on the wall, as layout.json's wallX are). deg 0 reproduces wallX within 1 cm. */
export const spotsTurned = (deg: number): P2[] => {
  const ang = L.frames.A.zoneEdgesX.map((x) => Math.atan2(x - SA.x, SA.z));
  const r = (deg * Math.PI) / 180;
  const e = ang.map((a) => SA.x + SA.z * Math.tan(a + r));
  return [0, 1, 2, 3].map((i) => P((e[i] + e[i + 1]) / 2, 0, `A'.W${i + 1}`));
};
export const WJ = spotsTurned(JIG_DEG);
/** The aim point (centre of the field of view on the wall) for a head turn. */
export const aimTurned = (deg: number): P2 => {
  const a = Math.atan2(AIM_A.x - SA.x, SA.z) + (deg * Math.PI) / 180;
  return P(SA.x + SA.z * Math.tan(a), 0);
};
{
  const w0 = spotsTurned(0);
  w0.forEach((w, i) => {
    if (Math.abs(w.x - WA[i].x) > 0.01) throw new Error(`V9: spotsTurned(0) misses layout wallX[${i}] (${w.x.toFixed(4)} vs ${WA[i].x})`);
  });
}

// every light path the drawn bands stand for clears the partition (throws at load if the layout breaks it)
for (const w of WA) for (const H of TRACK) assertPath([SA, w, H, w, SA], LAYOUT);
for (const w of WJ) assertPath([SA, w, HB, w, SA], LAYOUT);
for (const w of WB) assertPath([SB, w, HA, w, SB], LAYOUT);
// V9.1's route: S → W1 → him (H_A, then H_B after his step); the segment sweeps between the two, all clear (convex)
assertPath([SA, WA[0], HA, WA[0], SA], LAYOUT);
assertPath([SA, WA[0], HB, WA[0], SA], LAYOUT);

/* ================================================================== fields */

const GRID_S: GridSpec = {x0: 2.0, x1: 3.4, z0: 0.0, z1: 1.45, step: 0.008};
const GRID_H: GridSpec = {x0: 2.15, x1: 3.2, z0: 0.3, z1: 1.35, step: 0.008};

/** Plain stacking: sum of band memberships over every band of every frame added, normalised to a peak of 1. */
export const votesField = (grid: GridSpec, bands: BandSpec[]): ScalarField => {
  const nx = Math.max(2, Math.floor((grid.x1 - grid.x0) / grid.step + 1e-9) + 1);
  const nz = Math.max(2, Math.floor((grid.z1 - grid.z0) / grid.step + 1e-9) + 1);
  const values = new Float32Array(nx * nz);
  let max = 0;
  let argmax: P2 = {x: grid.x0, z: grid.z0};
  for (let j = 0; j < nz; j++) {
    const z = grid.z0 + j * grid.step;
    for (let i = 0; i < nx; i++) {
      const x = grid.x0 + i * grid.step;
      let v = 0;
      for (const b of bands) v += bandMembership({x, z}, b.W, b.r, b.halfWidth, b.sharpness ?? 4);
      values[j * nx + i] = v;
      if (v > max) {
        max = v;
        argmax = {x, z};
      }
    }
  }
  if (max > 0) for (let k = 0; k < values.length; k++) values[k] /= max;
  return {spec: grid, nx, nz, values, max: max > 0 ? 1 : 0, argmax};
};

/** Bilinear sample of a field at a plan point (0 outside the grid). */
export const sampleField = (f: ScalarField, p: P2) => {
  const {x0, z0, step} = f.spec;
  const u = (p.x - x0) / step;
  const v = (p.z - z0) / step;
  if (u < 0 || v < 0 || u > f.nx - 1 || v > f.nz - 1) return 0;
  const i = Math.min(f.nx - 2, Math.floor(u));
  const j = Math.min(f.nz - 2, Math.floor(v));
  const a = u - i;
  const b = v - j;
  const at = (ii: number, jj: number) => f.values[jj * f.nx + ii];
  return (1 - a) * (1 - b) * at(i, j) + a * (1 - b) * at(i + 1, j) + (1 - a) * b * at(i, j + 1) + a * b * at(i + 1, j + 1);
};

/** Major-axis length (m) of a set of contour loops (PCA of their points). */
const majorLength = (loops: P2[][]) => {
  const pts = loops.flat();
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p.x, 0) / n;
  const cz = pts.reduce((s, p) => s + p.z, 0) / n;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const p of pts) {
    sxx += (p.x - cx) ** 2;
    szz += (p.z - cz) ** 2;
    sxz += (p.x - cx) * (p.z - cz);
  }
  const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const d = {x: Math.cos(ang), z: Math.sin(ang)};
  const proj = pts.map((p) => (p.x - cx) * d.x + (p.z - cz) * d.z);
  return Math.max(...proj) - Math.min(...proj);
};

/** The smear's drawn levels (of the normalised stacking score). */
export const SMEAR_LEVELS: [number, number] = [0.74, 0.86];
/** the four-frame smear is drawn a little lower: H_B sits off its main streak (score 0.65) */
export const SMEAR4_LEVELS: [number, number] = [0.62, 0.8];

/** Frame 1 (sensor A, him at H_A) and frame 2 (head jiggled, him at H_B): their bands as drawn. */
export const BANDS_F1 = bandsFor(WA, HA, HW1);
export const BANDS_F2 = bandsFor(WJ, HB, HW1);
/** V9.2: the two frames stacked as they are. */
export const SMEAR2 = votesField(GRID_S, [...BANDS_F1, ...BANDS_F2]);
/** V9.5 left panel: all four frames of his walk stacked (sensor still). */
export const SMEAR4 = votesField(GRID_S, TRACK.flatMap((H) => bandsFor(WA, H, HW1)));
/** loops of the stacking score smaller than this (m²) are not drawn */
export const SMEAR_MIN_AREA = 0.0008;
export const SMEAR2_LENGTH = majorLength(extractContours(SMEAR2, SMEAR_LEVELS[0], {minArea: SMEAR_MIN_AREA}));
if (!(SMEAR2_LENGTH > 0.8 && SMEAR2_LENGTH < 0.95)) throw new Error(`V9: the two-frame smear is ${SMEAR2_LENGTH.toFixed(3)} m long (I1 frame B2: about 0.86 m)`);
{
  // the streaks cover the positions they were stacked from
  for (const H of [HA, HB]) if (sampleField(SMEAR2, H) < SMEAR_LEVELS[0]) throw new Error(`V9: the two-frame smear misses ${H.id}`);
  for (const H of TRACK) if (sampleField(SMEAR4, H) < SMEAR4_LEVELS[0]) throw new Error(`V9: the four-frame smear misses ${H.id}`);
}

/** Frame A's region (the long patch) and frames A + B1 stacked (the object held still, so adding is legitimate). */
export const CLOUD_A = possibleCloud(GRID_H, bandsFor(WA, HA, HW1));
export const CLOUD_AB = possibleCloud(GRID_H, [...bandsFor(WA, HA, HW1), ...bandsFor(WB, HA, HW1)]);
export const LOOPS_A = extractContours(CLOUD_A, 0.25);
export const PATCH_A_LENGTH = majorLength(LOOPS_A);
export const PATCH_AB_LENGTH = majorLength(extractContours(CLOUD_AB, 0.25));
export const SHRINK = 1 - PATCH_AB_LENGTH / PATCH_A_LENGTH;
// the evidence brief: about 30% shorter, real but modest, never a dot
if (!(SHRINK > 0.2 && SHRINK < 0.4)) throw new Error(`V9: the A → A + B1 patch shrinks ${(SHRINK * 100).toFixed(0)}% (I1: about 30%)`);

/** The region of each frame of his walk (sensor still, frame A's spots). */
export const CLOUD_TRACK = TRACK.map((H) => possibleCloud(GRID_H, bandsFor(WA, H, HW1)));
CLOUD_TRACK.forEach((f, k) => {
  if (sampleField(f, TRACK[k]) < 0.6) throw new Error(`V9: frame ${k}'s region does not contain ${TRACK[k].id}`);
});

/* ================================================================== the particle filter (V9.5) */

export const PF_N = 56;
const PF_SIGMA = 0.07;
const PF_KEEP = 0.25;
const gauss = (seed: number) => {
  const u = Math.max(1e-9, rand(seed));
  const v = rand(seed + 7919);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
export type PfStep = {
  /** positions before the step (the previous frame's guesses) */
  from: P2[];
  /** after the random drift */
  drift: P2[];
  /** kept (inside the new frame's region) */
  keep: boolean[];
  /** the refilled set: survivors stay at their drifted spot, the copies sit next to a parent */
  next: P2[];
  /** for each entry of `next`, the index (into drift) it comes from */
  parent: number[];
};
/** Seed of the drawn run: picked (with PF_N) so each frame's copied cloud is centred within 5 cm of him. Most seeds
 *  show the same behaviour with the cloud lagging a few cm behind him on some frames, as a random-walk filter does. */
export const PF_SEED = 0;
/** Initial guesses (inside frame A's region round H_A) and the three frames of his walk. */
export const runPF = (n: number, seed: number) => {
  const init: P2[] = [];
  let s = 101 + seed * 977;
  const s0 = s;
  while (init.length < n && s < s0 + 40000) {
    const p = P(HA.x + 0.22 * (rand(s) * 2 - 1), HA.z + 0.14 * (rand(s + 1) * 2 - 1));
    s += 2;
    if (sampleField(CLOUD_TRACK[0], p) >= 0.35) init.push(p);
  }
  if (init.length < n) throw new Error('V9: could not seed the guesses');
  const steps: PfStep[] = [];
  const offsets: number[] = [];
  let cur = init;
  for (let k = 1; k < TRACK.length; k++) {
    const sk = seed * 100003 + 1000 * k;
    const drift = cur.map((p, i) => P(p.x + PF_SIGMA * gauss(sk + 13 * i + 1), p.z + PF_SIGMA * gauss(sk + 13 * i + 5)));
    const w = drift.map((p) => sampleField(CLOUD_TRACK[k], p));
    const keep = w.map((v) => v >= PF_KEEP);
    const order = drift.map((_, i) => i).filter((i) => keep[i]).sort((a, b) => w[b] - w[a]);
    if (order.length < 1) return {init, steps, offsets: [...offsets, 9], survivors: steps.map((st) => st.keep.filter(Boolean).length)};
    const next: P2[] = [];
    const parent: number[] = [];
    for (const i of order) {
      next.push(drift[i]);
      parent.push(i);
    }
    // copies in proportion to score³ (the released code's resampling exponent), systematic and seeded
    const sc = order.map((i) => w[i] ** 3);
    const tot = sc.reduce((a, b) => a + b, 0);
    const M = n - order.length;
    let acc = 0;
    let oi = 0;
    for (let c = 0; c < M; c++) {
      const target = ((c + 0.5) / M) * tot;
      while (oi < order.length - 1 && acc + sc[oi] < target) acc += sc[oi++];
      const i = order[oi];
      next.push(P(drift[i].x + 0.02 * gauss(sk + 5000 + 31 * c + 3), drift[i].z + 0.02 * gauss(sk + 5000 + 31 * c + 9)));
      parent.push(i);
    }
    steps.push({from: cur, drift, keep, next, parent});
    const cx = next.reduce((a, p) => a + p.x, 0) / next.length;
    const cz = next.reduce((a, p) => a + p.z, 0) / next.length;
    offsets.push(Math.hypot(cx - TRACK[k].x, cz - TRACK[k].z));
    cur = next;
  }
  return {init, steps, offsets, survivors: steps.map((st) => st.keep.filter(Boolean).length)};
};
const PF_RUN = runPF(PF_N, PF_SEED);
// each frame: at least 4 survivors, and the copied cloud is centred within 6 cm of where he now stands
if (!(globalThis as {PF_SEARCH?: boolean}).PF_SEARCH) PF_RUN.offsets.forEach((o, k) => {
  if (!(o <= 0.06) || PF_RUN.survivors[k] < 4) throw new Error(`V9: frame ${k + 1}: ${PF_RUN.survivors[k]} guesses survive, cloud ${o.toFixed(3)} m from ${TRACK[k + 1].id}`);
});
export const PF_INIT = PF_RUN.init;
export const PF_STEPS = PF_RUN.steps;
export const PF_OFFSETS = PF_RUN.offsets;

/* ================================================================== drawing */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** token width on the plan board (world px), as S4/S6 */
export const TOKEN_PX = 2 * TOKEN_R * 240;
const SENSOR_PX = 0.24 * 240;
const ROOM_CLIP = {x0: 0, x1: 4, z0: 0, z1: 3};

/** The sensor's tripod seen from above (copied from S6_Small PlanStand, review r2 N08): three legs at 90/210/330°
 *  (screen angles), grey legs in an ink outline, ink feet, the sensor glyph's down-right drop shadow. */
const STAND_LEG_M = 0.17;
const STAND_ANGLES = [90, 210, 330];
const STAND_LEG_W = 9;
const STAND_CORE = 4.5;
const STAND_FOOT_R = 6;
const STAND_SHADOW = {x: 3, y: 5};
export const PlanStand: React.FC<{at: P2; opacity?: number}> = ({at, opacity = 1}) => {
  const c = planPx(at);
  const feet = STAND_ANGLES.map((a) => planPx(P(at.x + Math.cos((a * Math.PI) / 180) * STAND_LEG_M, at.z + Math.sin((a * Math.PI) / 180) * STAND_LEG_M)));
  const leg = (f: {x: number; y: number}, dx = 0, dy = 0) => ({x1: c.x + dx, y1: c.y + dy, x2: f.x + dx, y2: f.y + dy});
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity} strokeLinecap="round">
      {feet.map((f, i) => (
        <g key={`s${i}`}>
          <line {...leg(f, STAND_SHADOW.x, STAND_SHADOW.y)} stroke={C.shadow} strokeWidth={STAND_LEG_W} />
          <circle cx={f.x + STAND_SHADOW.x} cy={f.y + STAND_SHADOW.y} r={STAND_FOOT_R} fill={C.shadow} />
        </g>
      ))}
      {feet.map((f, i) => (
        <line key={`o${i}`} {...leg(f)} stroke={C.ink} strokeWidth={STAND_LEG_W} />
      ))}
      {feet.map((f, i) => (
        <line key={`c${i}`} {...leg(f)} stroke={C.inkSoft} strokeWidth={STAND_CORE} />
      ))}
      {feet.map((f, i) => (
        <circle key={`f${i}`} cx={f.x} cy={f.y} r={STAND_FOOT_R} fill={C.ink} />
      ))}
    </g>
  );
};

/** The rail of known positions (V9.4): a floor track from just left of B1 to just right of A, with a saffron stop at
 *  each known position. World px of the plan board. */
export const RAIL = {x0: SB.x - 0.16, x1: SA.x + 0.17, z: SA.z};
export const PlanRail: React.FC<{opacity?: number; stops?: [number, number]}> = ({opacity = 1, stops = [1, 1]}) => {
  if (opacity <= 0.001) return null;
  const a = planPx(P(RAIL.x0, RAIL.z));
  const b = planPx(P(RAIL.x1, RAIL.z));
  return (
    <g opacity={opacity}>
      <rect x={a.x + 3} y={a.y - 9 + 5} width={b.x - a.x} height={18} rx={9} fill={C.shadow} />
      <rect x={a.x} y={a.y - 9} width={b.x - a.x} height={18} rx={9} fill={C.paperDeep} stroke={C.ink} strokeWidth={3} />
      <line x1={a.x + 10} y1={a.y} x2={b.x - 10} y2={b.y} stroke={C.inkMuted} strokeWidth={2.5} strokeLinecap="round" />
      {[SB, SA].map((p, i) => {
        const q = planPx(p);
        const t = stops[i];
        return t > 0.001 ? <circle key={i} cx={q.x} cy={q.y + 17} r={6.5 * Math.min(1, t)} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} opacity={Math.min(1, t)} /> : null;
      })}
    </g>
  );
};

/** The carriage the sensor rides on along the rail (seen from above, under the glyph). */
export const RailCarriage: React.FC<{at: P2}> = ({at}) => {
  const c = planPx(at);
  return (
    <g>
      <rect x={c.x - 30 + 3} y={c.y - 16 + 5} width={60} height={32} rx={8} fill={C.shadow} />
      <rect x={c.x - 30} y={c.y - 16} width={60} height={32} rx={8} fill={C.inkSoft} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/** A still object behind the partition (V9.4): a cardboard box seen from above, at H_A. */
export const PlanBox: React.FC<{at: P2; opacity?: number}> = ({at, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const c = planPx(at);
  const s = 0.2 * 240;
  return (
    <g opacity={opacity} transform={`translate(${c.x} ${c.y}) rotate(-8)`}>
      <rect x={-s / 2 + 4} y={-s / 2 + 6} width={s} height={s} rx={6} fill={C.shadow} />
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={6} fill={C.woodLight} stroke={C.ink} strokeWidth={3} />
      <line x1={0} y1={-s / 2 + 2} x2={0} y2={s / 2 - 2} stroke={C.wood} strokeWidth={7} />
      <line x1={-s / 2 + 8} y1={-s / 6} x2={s / 2 - 8} y2={-s / 6} stroke={C.wood} strokeWidth={2.5} strokeOpacity={0.7} />
    </g>
  );
};

/** A dashed outline of a wall spot (where frame 1 listened). */
const GhostSpot: React.FC<{p: P2; t: number; size?: number}> = ({p, t, size = 9}) => {
  if (t <= 0.001) return null;
  const c = planPx(p);
  const s = size;
  return <path d={`M ${c.x} ${c.y - s} L ${c.x + s} ${c.y} L ${c.x} ${c.y + s} L ${c.x - s} ${c.y} Z`} fill={C.paper} stroke={C.inkSoft} strokeWidth={2.2} strokeDasharray="3 3" opacity={t} />;
};

/** A dashed ghost of his token (where he stood in frame 1). */
const GhostToken: React.FC<{p: P2; t: number}> = ({p, t}) => {
  if (t <= 0.001) return null;
  const c = planPx(p);
  return <circle cx={c.x} cy={c.y} r={TOKEN_PX * 0.36} fill="none" stroke={C.inkSoft} strokeWidth={2.5} strokeDasharray="6 5" opacity={t} />;
};

export type Dot = {p: P2; t: number; tone?: 'teal' | 'grey'};

export type PlanState = {
  /** sensor position and the point it aims at on the wall (the head's facing) */
  sensor: P2;
  aim: P2;
  firing?: number;
  /** pale field of view: sensor → its four zones' span on the wall, for a head turn of `deg` (frame A's zones) */
  fov?: {deg: number; t: number};
  /** tripod under the sensor (0..1); the rail and its carriage instead in V9.4 */
  stand?: number;
  rail?: number;
  railStops?: [number, number];
  carriage?: boolean;
  /** a dashed ghost of the sensor at a previous position */
  sensorGhost?: {at: P2; aim: P2; t: number};
  /** 0..1 the sensor glyph (default 1); V9.4 fades it while the scene draws the 3×3 zone box in its place */
  sensorOpacity?: number;
  /** wall spots: each with its own pop-in, highlight and position (and, optionally, its own marker size) */
  spots?: {p: P2; t: number; active?: number; tone?: 'saffron' | 'teal'; size?: number}[];
  /** wall-spot marker size (plan board px, default 9); V9.1/V9.2 draw them larger so the slide reads at phone size */
  spotSize?: number;
  ghostSpots?: {p: P2; t: number}[];
  /** small arrows along the wall from where a spot was to where it is now */
  spotArrows?: {from: P2; to: P2; t: number}[];
  guesser?: P2 | null;
  guesserOpacity?: number;
  /** token facing (deg, clockwise from screen-up; default −90: facing the partition) */
  guesserFacing?: number;
  /** saffron marks where a frame's bands cross (drawn over everything on the floor) */
  marks?: {p: P2; t: number}[];
  ghostToken?: {p: P2; t: number};
  /** the path he has walked: dotted line and saffron dots at the positions he left */
  crumbs?: {path: P2[]; dots: P2[]; t: number};
  box?: number;
  /** V9.1's route S → W → him, dashed saffron (0..1 opacity) */
  route?: {W: P2; H: P2; t: number};
  /** bands: each drawn only over a window of ±`half` rad round the direction from its wall spot to `around` */
  bands?: {specs: BandSpec[]; opacity: number; fill?: number; tone?: 'blue' | 'teal' | 'saffron'; around?: P2; half?: number}[];
  /** regions drawn under his token / the box */
  under?: Region[];
  /** regions drawn over everything on the floor */
  clouds?: Region[];
  /** dashed outline of an earlier region */
  ghostLoops?: {loops: P2[][]; t: number};
  dots?: Dot[];
};

export type Region = {field: ScalarField; t: number; tone: 'teal' | 'coral'; levels?: [number, number]; minArea?: number; dashed?: boolean};

export const toPx = planPx;

/** A region from a field: pale outer level, denser inner level, cream rim and ink outline (the S6 CloudShape look),
 *  with loops smaller than `minArea` (m²) dropped; or, `dashed`, only a dashed outline of the outer level. */
const RegionShape: React.FC<{r: Region}> = ({r}) => {
  if (r.t <= 0.001) return null;
  const [lo, hi] = r.levels ?? [0.25, 0.6];
  const minArea = r.minArea ?? 0.0004;
  const d = (lv: number) =>
    extractContours(r.field, lv, {minArea})
      .map((l) => polyD(l.map(toPx), true))
      .join(' ');
  const col = r.tone === 'teal' ? {main: C.teal, deep: C.tealDeep, light: C.tealLight} : {main: C.coral, deep: C.coralDeep, light: C.coralLight};
  const outer = d(lo);
  if (r.dashed)
    return (
      <g opacity={Math.min(1, r.t)} fill="none" strokeLinejoin="round">
        <path d={outer} stroke={C.cream} strokeWidth={6} />
        <path d={outer} stroke={col.deep} strokeWidth={3} strokeDasharray="6 5" />
      </g>
    );
  const inner = d(hi);
  return (
    <g opacity={Math.min(1, r.t)}>
      <path d={outer} fill="none" stroke={C.cream} strokeWidth={7.5} strokeLinejoin="round" />
      <path d={outer} fill={col.light} fillOpacity={0.9} fillRule="evenodd" />
      <path d={inner} fill={col.main} fillOpacity={0.95} fillRule="evenodd" />
      <path d={inner} fill="none" stroke={col.deep} strokeWidth={2} strokeLinejoin="round" />
      <path d={outer} fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
};

/** The field of view on the wall for a head turn (deg): the outer zone edges of frame A, turned about S_A. */
export const fovEdges = (deg: number): [P2, P2] => {
  const ang = L.frames.A.zoneEdgesX.map((x) => Math.atan2(x - SA.x, SA.z));
  const r = (deg * Math.PI) / 180;
  const e = [ang[0], ang[ang.length - 1]].map((a) => P(SA.x + SA.z * Math.tan(a + r), 0));
  return [e[0], e[1]];
};

/** RoomSet slots (world px of the plan board) for a plan state. */
const planLayers = (s: PlanState) => {
  const backdrop = (
    <PlanSvg>
      {s.fov && s.fov.t > 0.001 && (() => {
        const [e0, e1] = fovEdges(s.fov.deg);
        const a = planPx(s.sensor);
        return <path d={polyD([a, planPx(e0), planPx(e1)], true)} fill={C.saffronLight} opacity={0.75 * s.fov.t} />;
      })()}
      {(s.bands ?? []).map((b, k) =>
        b.opacity > 0.001 ? (
          <g key={k} opacity={b.opacity}>
            {b.specs.map((sp, i) => {
              const c = b.around ? Math.atan2(b.around.z - sp.W.z, b.around.x - sp.W.x) : Math.PI / 2;
              const h = b.around ? (b.half ?? 0.42) : Math.PI / 2;
              return <Band key={i} asGroup center={sp.W} r={sp.r} halfWidth={sp.halfWidth} toPx={toPx} t={1} a0={c - h} a1={c + h} clip={ROOM_CLIP} tone={b.tone ?? 'blue'} fillOpacity={b.fill ?? 0.2} />;
            })}
          </g>
        ) : null,
      )}
      {s.route && s.route.t > 0.001 && (() => {
        const a = planPx(s.sensor);
        const w = planPx(s.route.W);
        const h = planPx(s.route.H);
        return (
          <g opacity={s.route.t} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={polyD([a, w, h])} stroke={C.cream} strokeWidth={7} />
            <path d={polyD([a, w, h])} stroke={C.saffronDeep} strokeWidth={3.5} strokeDasharray="9 7" />
          </g>
        );
      })()}
      {s.rail !== undefined && <PlanRail opacity={s.rail} stops={s.railStops} />}
    </PlanSvg>
  );
  const children = (
    <PlanSvg>
      {(s.ghostSpots ?? []).map((g, i) => (
        <GhostSpot key={`gs${i}`} p={g.p} t={g.t} size={s.spotSize ?? 9} />
      ))}
      {(s.spots ?? []).map((w, i) => (
        <WallMarker key={`w${i}`} asGroup p={w.p} toPx={toPx} t={w.t} active={w.active ?? 0.75} tone={w.tone ?? 'saffron'} size={w.size ?? s.spotSize ?? 9} />
      ))}
      {(s.spotArrows ?? []).map((ar, i) => {
        if (ar.t <= 0.001) return null;
        const y = planPx(P(0, 0.085)).y;
        const x0 = planPx(ar.from).x;
        const x1 = planPx(ar.to).x;
        const dir = Math.sign(x1 - x0) || 1;
        const tip = x1 - dir * 1;
        const d = `M ${x0} ${y} L ${tip} ${y} M ${tip - dir * 7} ${y - 6} L ${tip} ${y} L ${tip - dir * 7} ${y + 6}`;
        return (
          <g key={`ar${i}`} opacity={ar.t} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke={C.cream} strokeWidth={7.5} />
            <path d={d} stroke={C.saffronDeep} strokeWidth={3.6} />
          </g>
        );
      })}
      {s.crumbs && s.crumbs.t > 0.001 && s.crumbs.path.length > 1 && (
        <g opacity={s.crumbs.t} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={polyD(s.crumbs.path.map(toPx), false)} stroke={C.cream} strokeWidth={7} />
          <path d={polyD(s.crumbs.path.map(toPx), false)} stroke={C.ink} strokeWidth={3} strokeDasharray="1 6" />
        </g>
      )}
      {s.crumbs && s.crumbs.t > 0.001 &&
        s.crumbs.dots.map((p, i) => {
          const q = planPx(p);
          return (
            <g key={`cr${i}`} opacity={s.crumbs!.t}>
              <circle cx={q.x} cy={q.y} r={8} fill={C.cream} />
              <circle cx={q.x} cy={q.y} r={5.5} fill={C.saffron} stroke={C.ink} strokeWidth={2} />
            </g>
          );
        })}
      {s.ghostToken && <GhostToken p={s.ghostToken.p} t={s.ghostToken.t} />}
      {(s.under ?? []).map((r, i) => (
        <RegionShape key={`u${i}`} r={r} />
      ))}
      {s.box !== undefined && <PlanBox at={HA} opacity={s.box} />}
      {s.guesser && (s.guesserOpacity ?? 1) > 0.001 && <GuesserToken asGroup x={planPx(s.guesser).x} y={planPx(s.guesser).y} size={TOKEN_PX} facing={s.guesserFacing ?? -90} opacity={s.guesserOpacity ?? 1} />}
      {(s.clouds ?? []).map((r, i) => (
        <RegionShape key={`c${i}`} r={r} />
      ))}
      {s.ghostLoops && s.ghostLoops.t > 0.001 && (
        <g opacity={s.ghostLoops.t} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={s.ghostLoops.loops.map((l) => polyD(l.map(toPx), true)).join(' ')} stroke={C.cream} strokeWidth={6} />
          <path d={s.ghostLoops.loops.map((l) => polyD(l.map(toPx), true)).join(' ')} stroke={C.ink} strokeWidth={3} strokeDasharray="5 5" />
        </g>
      )}
      {(s.marks ?? []).map((m, i) => {
        if (m.t <= 0.001) return null;
        const q = planPx(m.p);
        const k = Math.min(1.15, m.t);
        return (
          <g key={`mk${i}`} opacity={Math.min(1, m.t * 2)} transform={`translate(${q.x} ${q.y}) scale(${k})`}>
            <circle r={13} fill={C.cream} />
            <circle r={10} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
      {(s.dots ?? []).map((d, i) => {
        if (d.t <= 0.001) return null;
        const q = planPx(d.p);
        const grey = d.tone === 'grey';
        const r = 5.6 * Math.min(1, 0.55 + 0.45 * d.t);
        return (
          <g key={`d${i}`} opacity={Math.min(1, d.t)}>
            <circle cx={q.x} cy={q.y} r={r + 1.8} fill={C.cream} />
            <circle cx={q.x} cy={q.y} r={r} fill={grey ? C.paperLine : C.teal} stroke={grey ? C.inkMuted : C.ink} strokeWidth={1.6} />
          </g>
        );
      })}
      {s.stand !== undefined && <PlanStand at={s.sensor} opacity={s.stand} />}
      {s.carriage && <RailCarriage at={s.sensor} />}
      {s.sensorGhost && s.sensorGhost.t > 0.001 && (() => {
        const c = planPx(s.sensorGhost.at);
        const a = planPx(s.sensorGhost.aim);
        const deg = (Math.atan2(a.x - c.x, -(a.y - c.y)) * 180) / Math.PI;
        const w = SENSOR_PX;
        return <rect x={-w / 2} y={-w / 4} width={w} height={w / 2} rx={6} transform={`translate(${c.x} ${c.y}) rotate(${deg})`} fill="none" stroke={C.ink} strokeWidth={2.5} strokeDasharray="5 5" opacity={s.sensorGhost.t} />;
      })()}
      {(s.sensorOpacity ?? 1) > 0.001 && <SensorGlyph asGroup p={s.sensor} dir={sub(s.aim, s.sensor)} toPx={toPx} size={SENSOR_PX} firing={s.firing ?? 0} opacity={s.sensorOpacity ?? 1} />}
    </PlanSvg>
  );
  return {backdrop, children};
};

export const PlanStage: React.FC<{geo: PanelGeo; cam: Cam; state: PlanState; opacity?: number; shadow?: number}> = ({geo, cam, state, opacity, shadow}) => {
  const {backdrop, children} = planLayers(state);
  return (
    <PlanView geo={geo} cam={cam} backdrop={backdrop} opacity={opacity} shadow={shadow}>
      {children}
    </PlanView>
  );
};

/* ================================================================== the particle cloud at a frame */

/**
 * The guesses during his walk. `u` runs 0 (all at PF_INIT) → 3 (after the third frame); within step k (u in k−1..k)
 * the phases are: 0–0.3 drift, 0.3–0.6 check (the misses fade grey and go), 0.6–1 copy (copies slide out of their
 * parent). Returns the dots to draw.
 */
export const pfDots = (u: number): Dot[] => {
  if (u <= 0) return PF_INIT.map((p) => ({p, t: 1}));
  const k = Math.min(PF_STEPS.length - 1, Math.floor(u));
  const f = u >= PF_STEPS.length ? 1 : u - k;
  const st = PF_STEPS[k];
  const dr = clamp01(f / 0.3);
  const ck = clamp01((f - 0.3) / 0.3);
  const cp = clamp01((f - 0.6) / 0.4);
  const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
  if (f < 0.6) {
    return st.from.map((p, i) => {
      const q = lerpP(p, st.drift[i], ease(dr));
      if (st.keep[i] || ck <= 0) return {p: q, t: 1};
      return {p: q, t: 1 - ck, tone: ck > 0.15 ? 'grey' : 'teal'};
    });
  }
  return st.next.map((p, j) => {
    const par = st.drift[st.parent[j]];
    const isSurvivor = j < st.keep.filter(Boolean).length;
    if (isSurvivor) return {p, t: 1};
    return {p: lerpP(par, p, ease(cp)), t: clamp01(cp * 2.2)};
  });
};

/** The guesses' state after all of his steps (for the right panel and the final frame). */
export const PF_FINAL: P2[] = PF_STEPS[PF_STEPS.length - 1].next;

export {lerp, clamp01};
