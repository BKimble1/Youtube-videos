// LB (3.40-13.67 s): THE REAL LAB DEMONSTRATION, the film's second payoff ("passing through the barrier").
// The real material is not a character (no eyes, no personality): a ~1 cm minifigure-shaped cast of MPTM (gallium +
// NdFeB microparticles) in a tiny lab cage on a lab stage. One continuous take in the lab world (src/v2/art/labset):
//   3.40-3.50  full-frame <ChromeSurface> (contract H1 -> LB), then the camera pulls OUT of the figure's chrome chest
//              (the surface pattern recedes with the pull and melts into the figure's own reflections), back through
//              the centre bar gap, arcing up-left to the figure standing in the cage ("Scientists locked it inside a
//              tiny cage"); the lid drops shut on "cage" (5.14), tag LAB DEMONSTRATION.
//   5.87-7.60  "But instead of breaking the bars...": the camera settles from the lid crane to the prisoner's eye level
//              (near-frontal medium, figure ~1/3 of the frame) as a permanent magnet on a slider slides in OUTSIDE the
//              cage at the front right, its N face aimed at the figure; it drags the SOLID figure toward us against the
//              front bars: knock (6.80), rebound + rock, a second harder tug knocks it again (7.31): rigid, it cannot
//              pass (a bar runs down its middle: gap 1.2 mm << torso 2.3 mm). The magnet is withdrawn along its axis.
//              (Not reported by the paper: kept short, staged as the magnet testing the rigid figure.)
//   7.55-10.1  "It MELTED": the AC induction coil under the stage energises (warm glow, field loops; tag AC FIELD
//              HEATS IT); the figure loses rigidity top/limbs first and collapses into a pool where it stands (one
//              continuous volume-conserving collapse, visibly softening from ~8.0 on "MELTED", pool pinned behind the
//              bars); one continuous push (6.3 -> 9.5, never reversing) medium -> close-up.
//   9.9-11.6   "Its entire body turned into liquid metal": the pool flattens and shimmers (ripples, drifting
//              reflections), the coil switches off, the camera rises to an ANGLED OVERHEAD (barrier, liquid,
//              destination and magnet all in view).
//   11.2-13.1  "Then it slipped straight through the bars": the magnet slides back in outside the bars, the liquid
//              elongates toward it, necks into three continuous streams through the bar gaps and collects outside;
//              tag EXTERNAL MAGNETIC CONTROL; the camera tracks the leading edge.
//   13.05-13.67 the puddle settles (stream disc -> living puddle), the magnet slides back, the camera lands on
//              LAB_HANDOFF.cam; from 13.43 every frame is exactly the hand-off (contract LB -> MS).
import React from 'react';
import {C} from '../../art/palette';
import {uid} from '../../core/ids';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {Cam3, P3} from '../../world';
import {T} from '../story2';
import {Tag} from '../Tag';
import {buildChrome, ChromeBody, ChromeSurface} from '../liquid/Chrome';
import {Prim, projectPrims} from '../liquid/sdf';
import {floorPrims} from '../liquid/flow';
import {labFigurePrims} from '../labFigure';
import {
  LAB, LAB_CAMS, LAB_ENV, LAB_HANDOFF, LAB_SHOTS, LAB_STREAM, LIQ_SHADE, LabHandoffPuddle, LabShot, LabStream, LabWorld,
  MagnetSpec, labFigureFloor, labLidClose, labMeltBase, labMeltBridgePrims, labProj, labProjPoly, labPuddleFloor, labRevealCam, labStreamFloor, shotCam,
} from '../art/labset';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
const f1 = (n: number) => n.toFixed(1);

// =====================================================================================================================
// TIMING (film seconds, keyed to the measured words T)
// =====================================================================================================================
export const LB_T = {
  t0: 3.4,
  surface1: 3.5, // first frame of the pull-out (3 ChromeSurface frames before it)
  reveal1: 4.9, // the reveal pull-back lands (labRevealCam u = 1)
  lid: T.cage, // 5.145 the lid lands
  magIn: [5.95, 6.4] as const, // the magnet slides in outside the cage ("But instead...")
  pull0: 6.32, // the solid figure starts to slide toward the bars
  hit1: 6.8, // first knock (inside "the", before the stressed "bars")
  tug: 7.04, // the magnet is nudged closer: a second, harder pull
  hit2: 7.31, // second knock, at the very end of "bars" (7.33) into the pause
  magOut: [7.4, 7.84] as const, // the magnet is withdrawn (field off)
  coilOn: 7.62, // the induction coil energises (pause before "It")
  melt: [7.84, 10.0] as const, // "MELTED" 7.84 -> the pool ("turned into" 9.89)
  bridge: [10.0, 10.55] as const, // the melt-1 lump flattens into the stream's start disc
  coilOff: [10.0, 10.7] as const,
  magIn2: [10.85, 11.5] as const, // the magnet returns outside the bars (under "metal", before "Then" 11.64)
  stream: [11.66, 13.14] as const, // "slipped straight through the bars"
  settle: [13.14, 13.43] as const, // stream disc -> living puddle; magnet slides back
  handoff: 13.43, // from here on: exactly LAB_HANDOFF.cam + LabHandoffPuddle (>= 7 frames)
  t1: 13.67,
};
const S = LB_T;
/** heat tint on the sample while the coil is on (kept low: a strong warm layer reads as glowing "eyes" on the head) */
const LB_WARM = 0.12;

// =====================================================================================================================
// CAMERA: the reveal pull-back, then one Catmull-Rom (Hermite) spline through look-at keys (velocity carried)
// =====================================================================================================================
const splineKeys = (t: number, keys: [number, number][]): number => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t1, y1] = keys[i], [t2, y2] = keys[i + 1];
  const h = t2 - t1;
  const slope = (j: number) => (j <= 0 || j >= n - 1 ? 0 : (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]));
  const m1 = slope(i) * h, m2 = slope(i + 1) * h;
  const x = (t - t1) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * y1 + (x3 - 2 * x2 + x) * m1 + (-2 * x3 + 3 * x2) * y2 + (x3 - x2) * m2;
};
const shot = (p: [number, number, number], at: [number, number, number], f: number): LabShot => ({p: {x: p[0], h: p[1], d: p[2]}, at: {x: at[0], h: at[1], d: at[2]}, f});

/** camera keys after the reveal (film seconds) */
export const LB_CAM_KEYS: [number, LabShot][] = [
  [S.reveal1, LAB_SHOTS.reveal],
  // crane up to watch the lid drop shut on "cage": the whole tiny cage on the stage, locked
  [5.45, shot([-15.5, 21, -40], [0.2, 7.0, 4.6], 2380)],
  // after the lid lands, an orbit left (bars parallax across the figure) that opens the space in front of the cage
  // where the magnet arrives ("But instead of breaking the bars")
  // ... then settles down to the prisoner's eye level as the magnet slides in at the front right: a near-frontal
  // medium (the billboarded figure is honest from the front), the figure ~30 % of the frame, so the drag reads as the
  // figure lurching TOWARD us and stopping hard on bars narrower than its torso (the hook's frame-0 picture, for real)
  [6.3, shot([-8, 11.5, -40], [2.4, 3.9, 1.0], 2900)],
  // the knocks: a slow motivated push-in on the stakes (continues, same direction, into the melt framing)
  [7.4, shot([-9.2, 11.2, -38], [1.9, 4.3, 2.6], 3000)],
  // the melt: the same push continues (never reverses), medium -> close as the structure gives way
  // (shot from further back on a longer lens than LAB_SHOTS.meltMedium / meltClose, at the same figure scale: closer
  // cameras put the stage's key-light pool partly behind the lens, where labset's LabStage drops it for a frame-exact
  // pop at ~8.07 s and ~10.27 s)
  [8.5, shot([-12, 13, -44], [0.6, 4.8, 4.4], 3800)],
  [9.5, shot([-9, 9.5, -42], [0, 4.0, 5.6], 3800)],
  // rising: the pool shimmers ("its entire body turned into liquid metal")
  [10.45, shot([-8.4, 24, -27], [0, 1.5, 2.5], 2050)],
  // angled overhead: barrier, liquid, destination, magnet
  [11.55, shot([-7, 31, -25], [0, 0.8, -2.2], 2050)],
  // in on the bar gaps while the liquid necks through them
  [12.3, shot([-5, 29, -27.5], [0, 0.3, -4.0], 2250)],
  // tracking the leading edge out to where it collects
  [12.9, shot([-4.6, 30, -28.5], [0, 0.2, -5.6], 2150)],
  [S.handoff, LAB_SHOTS.handoff],
];
const camShotAt = (t: number): LabShot => {
  const K = LB_CAM_KEYS;
  const sp = (g: (s: LabShot) => number) => splineKeys(t, K.map(([tt, s]) => [tt, g(s)] as [number, number]));
  return {
    p: {x: sp((s) => s.p.x), h: sp((s) => s.p.h), d: sp((s) => s.p.d)},
    at: {x: sp((s) => s.at.x), h: sp((s) => s.at.h), d: sp((s) => s.at.d)},
    f: sp((s) => s.f),
  };
};
/** reveal progress (log-distance). H1 comes to rest on the chrome (6 frames of ChromeSurface), so the pull-out starts
 *  from rest: a short, controlled acceleration (~0.17 s) into a long soft landing. The velocity profile
 *  v(x) ~ ss(0, A, x) (1 - x)^P is integrated once into a table (deterministic); its peak is ~2.2x the mean speed
 *  (the old cubic ease-out started at 3x the mean from a standstill: a 26 %/frame zoom on frame 106, read as a cut). */
const REVEAL_A = 0.13, REVEAL_P = 1.35, REVEAL_N = 400;
const REVEAL_TAB: number[] = (() => {
  const v = (x: number) => ss(x, 0, REVEAL_A) * (1 - x) ** REVEAL_P;
  const out = [0];
  for (let i = 1; i <= REVEAL_N; i++) out.push(out[i - 1] + v((i - 0.5) / REVEAL_N) / REVEAL_N);
  const tot = out[REVEAL_N];
  return out.map((y) => y / tot);
})();
const revealEase = (x: number) => {
  const q = clamp(x) * REVEAL_N, i = Math.min(REVEAL_N - 1, Math.floor(q));
  return lerp(REVEAL_TAB[i], REVEAL_TAB[i + 1], q - i);
};
const revealU = (t: number) => revealEase((t - S.surface1) / (S.reveal1 - S.surface1));
export const lbCam = (t: number): Cam3 => {
  if (t >= S.handoff) return LAB_HANDOFF.cam;
  if (t < S.reveal1) return labRevealCam(revealU(t));
  return shotCam(camShotAt(t));
};

// =====================================================================================================================
// THE FIGURE: solid (pull + knocks + rock), melt, bridge, stream, settle
// =====================================================================================================================
/** the solid figure's base (world) and its screen tilt (deg, + = top toward screen right) */
const solidPose = (t: number): {base: P3; tilt: number; knock: number} => {
  const from = LAB.HOME, to = LAB.AT_BARS;
  if (t <= S.hit1) {
    const x = clamp((t - S.pull0) / (S.hit1 - S.pull0));
    const e = x * x * (0.3 + 0.7 * x); // the pull grows as it nears the magnet: arrives at speed
    // a hint of lean into the drag (the feet slide, the top lags: tips back slightly toward the cage interior)
    return {base: {x: lerp(from.x, to.x, e), h: 0, d: lerp(from.d, to.d, e)}, tilt: 1.2 * Math.sin(Math.PI * e) * (x > 0 ? 1 : 0), knock: 0};
  }
  // after the first knock: rebound, settle, the second tug (pulls it in again harder), knock 2, rebound, rest
  const rb = (k: number, amp: number) => (k < 0 ? 0 : amp * Math.exp(-k / 0.07) * Math.abs(Math.sin(k * 34)));
  const k1 = t - S.hit1, k2 = t - S.hit2;
  // between the knocks it is held against the bars (the magnet is still pulling)
  const back = rb(k1, 0.42) * (t < S.hit2 ? 1 : 0) + rb(k2, 0.6) + (t > S.tug && t < S.hit2 ? 0.18 * Math.sin(Math.PI * clamp((t - S.tug) / (S.hit2 - S.tug))) * 0.6 : 0);
  // the rock: the magnet sits to the left, so the knock tips the rigid figure left, it rocks back on its heels
  const rock = (k: number, amp: number) => (k < 0 ? 0 : amp * Math.exp(-k / 0.22) * Math.sin(k * 15 + 0.25));
  const tilt = (rock(k1, 6) * (t < S.hit2 ? 1 : 0.35) + rock(k2, 8)) * (1 - ss(t, 7.5, 7.8));
  const knock = Math.max(k1 >= 0 && t < S.hit2 ? Math.exp(-k1 / 0.08) : 0, k2 >= 0 ? Math.exp(-k2 / 0.08) : 0);
  return {base: {...to, d: to.d + back}, tilt, knock};
};
/** rotate a screen prim about (ox, oy) by a (rad) */
const rotPrim = (p: Prim, ox: number, oy: number, a: number): Prim => {
  const c = Math.cos(a), s = Math.sin(a);
  const R = (x: number, y: number) => ({x: ox + (x - ox) * c - (y - oy) * s, y: oy + (x - ox) * s + (y - oy) * c});
  switch (p.k) {
    case 'c': {
      const q = R(p.x, p.y);
      return {...p, x: q.x, y: q.y};
    }
    case 'cap': {
      const A = R(p.ax, p.ay), B = R(p.bx, p.by);
      return {...p, ax: A.x, ay: A.y, bx: B.x, by: B.y};
    }
    case 'box':
    case 'ell':
    case 'trap':
    case 'sup': {
      const q = R(p.x, p.y);
      return {...p, x: q.x, y: q.y, rot: p.rot + a};
    }
    case 'aff': {
      const q = R(p.x, p.y);
      return {...p, x: q.x, y: q.y, ux: p.ux * c - p.uy * s, uy: p.ux * s + p.uy * c, vx: p.vx * c - p.vy * s, vy: p.vx * s + p.vy * c};
    }
    case 'mix':
      return {...p, a: rotPrim(p.a, ox, oy, a), b: rotPrim(p.b, ox, oy, a)};
  }
};
/** the rigid figure (LabFigure's exact look at melt 0) with a screen-space tilt about its foot edge */
const SolidFigure: React.FC<{cam: Cam3; t: number; base: P3; tilt: number; part: 'back' | 'front'}> = ({cam, t, base, tilt, part}) => {
  const L = labFigurePrims(cam, base, LAB.FIG_H, 0, t);
  const o = labProj(cam, base);
  let prims = L.prims;
  if (o && Math.abs(tilt) > 0.01) {
    // pivot on the foot edge it tips toward (figure half-width ~1.1 figure units)
    const px = o.x + Math.sign(tilt) * 1.05 * L.k;
    prims = prims.map((p) => rotPrim(p, px, o.y, (tilt * Math.PI) / 180));
  }
  return (
    <ChromeBody
      prims={prims}
      blend={L.blend}
      groupBlend={[L.blend, L.blend, L.blend, L.blend, L.blend]}
      rigid={[1, 1, 1, 1, 1]}
      groupR={[1.5, 0.6, 1.2, 0.45, 0.9].map((x) => x * L.k)}
      groupBand={[1, 0, 1, 0, 1]}
      R={1.6 * L.k}
      env={LAB_ENV}
      floor={labFigureFloor(cam, base)}
      depthSplit={{d0: LAB.CAGE.d0, part}}
    />
  );
};

/** ripple rings on the pool (floor ellipses, under the front bars) */
const PoolRipples: React.FC<{cam: Cam3; t: number; c: P3; R: number; amt: number}> = ({cam, t, c, R, amt}) => {
  if (amt <= 0.01) return null;
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.7 + k / 3) % 1;
    const r = R * (0.18 + 0.62 * ph);
    const pts = Array.from({length: 40}, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return {x: c.x - 0.4 + Math.cos(a) * r, h: 0.25, d: c.d + 0.3 + Math.sin(a) * r};
    });
    const sp = labProjPoly(cam, pts);
    if (sp.length < 3) continue;
    out.push(<path key={k} d={'M' + sp.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill="none" stroke="#E8F4FF" strokeWidth={3.4} opacity={(amt * Math.sin(Math.PI * ph) * 0.75).toFixed(3)} />);
  }
  // a soft reflected light streak sliding across the mirror pool (the lab light, moving as the surface breathes)
  const sx = Math.sin(t * 0.9) * R * 0.35;
  const streak = labProjPoly(cam, [
    {x: c.x - R * 0.55 + sx, h: 0.26, d: c.d + R * 0.15}, {x: c.x - R * 0.05 + sx, h: 0.26, d: c.d + R * 0.32},
    {x: c.x + R * 0.0 + sx, h: 0.26, d: c.d + R * 0.22}, {x: c.x - R * 0.5 + sx, h: 0.26, d: c.d + R * 0.06},
  ]);
  if (streak.length > 2)
    out.push(<path key="st" d={'M' + streak.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill="#FFFFFF" opacity={(amt * 0.35).toFixed(3)} strokeLinejoin="round" stroke="#FFFFFF" strokeWidth={6} strokeOpacity={(amt * 0.2).toFixed(3)} />);
  return <g>{out}</g>;
};

/** the magnet's N face for the knock beat: outside the front bars, front-right, its N face aimed at the figure at the
 *  bars (so in the near-frontal view it is a whole, readable foreground prop beside the figure, not over its feet).
 *  It slides in / is withdrawn along its own axis. */
const MAG_KNOCK = {x: 2.7, d: -6.0, yaw: -12};
const MAG_AX = {x: Math.sin((MAG_KNOCK.yaw * Math.PI) / 180), d: Math.cos((MAG_KNOCK.yaw * Math.PI) / 180)};
/** magnet N face `back` units back along its axis from MAG_KNOCK (negative = closer to the cage) */
const magKnockAt = (back: number) => ({x: MAG_KNOCK.x - MAG_AX.x * back, d: MAG_KNOCK.d - MAG_AX.d * back});

// =====================================================================================================================
// STATE
// =====================================================================================================================
export const lbState = (t: number) => {
  const cam = lbCam(t);
  const lid = t < S.lid - 0.5 ? 0 : labLidClose(t, S.lid);
  const coil = ss(t, S.coilOn, S.coilOn + 0.22) * (1 - ss(t, S.coilOff[0], S.coilOff[1]));
  // top/limbs go first on "MELTED", the body sags through "Its entire body", the pool flattens on "turned"
  const melt = clamp(splineKeys(t, [[S.melt[0], 0], [8.12, 0.1], [8.5, 0.25], [9.3, 0.66], [S.melt[1], 1]]));
  const k = ss(t, S.bridge[0], S.bridge[1]);
  // it starts to stretch on "slipped" (visible by ~12.0), slows through the necking (the read), then drains out
  const u = clamp(splineKeys(t, [[S.stream[0], 0], [12.02, 0.1], [12.4, 0.3], [12.75, 0.5], [12.97, 0.8], [S.stream[1], 1]]));
  const settle = ss(t, S.settle[0], S.settle[1]);
  // the magnet
  let magnet: MagnetSpec | null = null;
  if (t >= S.magIn[0] - 0.05 && t < S.magOut[1]) {
    const tugD = 2.2 * ss(t, S.tug - 0.12, S.tug + 0.16);
    const back = t < S.magOut[0] ? keyS(t, [[S.magIn[0], 16], [S.magIn[1], 0]], (x) => 1 - (1 - x) ** 3) - tugD : keyS(t, [[S.magOut[0], -2.2], [S.magOut[1], 18]], (x) => x * x);
    const field = ss(t, S.magIn[0] + 0.15, S.magIn[1]) * (1 - ss(t, S.magOut[0], S.magOut[0] + 0.3));
    magnet = {...magKnockAt(back), yaw: MAG_KNOCK.yaw, field};
  } else if (t >= S.magIn2[0] && t < S.handoff) {
    const d =
      t < S.settle[0]
        ? keyS(t, [[S.magIn2[0], LAB.MAGNET_PULL.d - 13], [S.magIn2[1], LAB.MAGNET_PULL.d]], (x) => 1 - (1 - x) ** 3)
        : keyS(t, [[S.settle[0], LAB.MAGNET_PULL.d], [S.handoff, LAB_HANDOFF.magnet.d]]);
    const field = ss(t, S.magIn2[0] + 0.15, S.magIn2[1]) * (1 - ss(t, S.settle[0] - 0.1, S.handoff - 0.05));
    magnet = {x: LAB.MAGNET_PULL.x, d, field};
  } else if (t >= S.handoff) magnet = LAB_HANDOFF.magnet;
  const phase = t >= S.handoff ? 'handoff' : t >= S.settle[0] ? 'settle' : t >= S.stream[0] ? 'stream' : t >= S.bridge[1] ? 'pool' : t >= S.bridge[0] ? 'bridge' : melt > 0 ? 'melt' : 'solid';
  // the pool's edge breathes between the bridge and the stream (0 at both ends: exactly LabStream u = 0 there)
  const live = 0.7 * Math.sin(Math.PI * clamp((t - S.bridge[1]) / (S.stream[0] - 0.08 - S.bridge[1]))) ** 2;
  return {cam, lid, coil, melt, k, u, settle, magnet, phase, live};
};

// =====================================================================================================================
// THE SHOT
// =====================================================================================================================
/** context tags: top-left, above the caption band (y 250-420), clear of the subject in every phase */
export const TAG = {x: 48, y: 168, size: 38};
const CHEST: P3 = {x: 0, h: 5.6, d: LAB.HOME.d};
const RevealSurface: React.FC<{t: number; cam: Cam3}> = ({t, cam}) => {
  // the H1 ChromeSurface pattern, receding with the pull-back (scaled about the chest exactly as the camera zooms) and
  // clipped to the figure's silhouette: we come OUT of the same metal we went into. It stays fully opaque while the
  // chest still fills the frame (no mask, no early fade: frame 106 continues frame 105) and only dissolves into the
  // figure's own reflections once the torso reads as a figure (pattern scale 0.8 -> 0.3), so the change happens on a
  // small, receding chest rather than as a full-frame crossfade.
  const c = labProj(cam, CHEST);
  const c0 = labProj(labRevealCam(0), CHEST);
  if (!c || !c0) return null;
  const sc = c.s / c0.s;
  const a = 1 - ss(sc, REVEAL_FADE[0], REVEAL_FADE[1]);
  if (a <= 0.003) return null;
  const L = labFigurePrims(cam, LAB.HOME, LAB.FIG_H, 0, t);
  const geo = buildChrome(L.prims, {blend: L.blend});
  if (!geo) return null;
  const id = uid('lbRs'), gid = uid('lbRg'), mid = uid('lbRm');
  // the pattern is a frame-sized picture: once it is smaller than the frame its edges must not show. A radial feather
  // in the PATTERN's own coordinates grows in as it recedes (w 0 at scale 1: opaque to beyond the corners, so the first
  // pull frames are exactly the surface; w 1 by scale 0.72: a soft oval inside the picture, its edge never seen)
  const w = ss(sc, 1, 0.72);
  const gr = lerp(2400, 1000, w), k0 = lerp(0.99, 0.42, w);
  return (
    <g opacity={a.toFixed(3)}>
      <defs>
        <clipPath id={id}>
          <path d={geo.sil} clipRule="evenodd" />
        </clipPath>
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx="540" cy="960" r={f1(gr)}>
          <stop offset={k0.toFixed(3)} stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5080" height="5920">
          <rect x={-2000} y={-2000} width={5080} height={5920} fill={`url(#${gid})`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${f1(c.x)} ${f1(c.y)}) scale(${sc.toFixed(4)}) translate(-540 -960)`}>
          <g mask={`url(#${mid})`}>
            <ChromeSurface t={t} />
          </g>
        </g>
      </g>
    </g>
  );
};
/** the surface pattern's scale range over which it dissolves into the figure's own reflections */
const REVEAL_FADE = [0.8, 0.3] as const;

export const LB: React.FC<{t: number}> = ({t}) => {
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      {children}
    </svg>
  );
  if (t < S.surface1) return svg(<ChromeSurface t={t} />);
  const st = lbState(t);
  const {cam} = st;
  let body: (p: 'back' | 'front') => React.ReactNode;
  if (st.phase === 'handoff') body = (p) => p === 'front' && <LabHandoffPuddle t={t} />;
  else if (st.phase === 'settle') body = (p) => p === 'front' && <SettlePuddle t={t} cam={cam} settle={st.settle} />;
  else if (st.phase === 'pool')
    body = (p) => (
      <g>
        <LivePool t={t} cam={cam} live={st.live} part={p} />
        {p === 'back' && <PoolRipples cam={cam} t={t} c={LAB.MELT} R={LAB.POOL_R} amt={1 - 0.6 * ss(t, 11.2, S.stream[0])} />}
      </g>
    );
  else if (st.phase === 'stream') body = (p) => <LabStream cam={cam} t={t} u={st.u} part={p} />;
  else if (st.phase === 'bridge')
    body = (p) => (
      <g>
        <MeltBridge cam={cam} t={t} k={st.k} part={p} warm={st.coil * LB_WARM} />
        {p === 'back' && <PoolRipples cam={cam} t={t} c={LAB.MELT} R={LAB.POOL_R} amt={0.5 + 0.5 * ss(st.k, 0.3, 1)} />}
      </g>
    );
  else if (st.phase === 'melt') {
    const base = labMeltBase(st.melt, t);
    body = (p) => (
      <g>
        <ChromeMelt cam={cam} t={t} base={base} melt={st.melt} warm={st.coil * LB_WARM} part={p} />
        {p === 'back' && <PoolRipples cam={cam} t={t} c={base} R={LAB.POOL_R * ss(st.melt, 0.7, 1)} amt={0.5 * ss(st.melt, 0.82, 1)} />}
      </g>
    );
  } else {
    const sp = solidPose(t);
    body = (p) => <SolidFigure cam={cam} t={t} base={sp.base} tilt={sp.tilt} part={p} />;
  }
  // the stream-phase ripples ride on the remaining source pool
  const tags = (
    <>
      <Tag text="LAB DEMONSTRATION" t={t} t0={4.15} t1={6.25} x={TAG.x} y={TAG.y} tone="dark" size={TAG.size} />
      <Tag text="AC FIELD HEATS IT" t={t} t0={7.72} t1={9.75} x={TAG.x} y={TAG.y} tone="warm" size={TAG.size} />
      <Tag text="EXTERNAL MAGNETIC CONTROL" t={t} t0={11.7} t1={13.38} x={TAG.x} y={TAG.y} tone="field" size={TAG.size} />
    </>
  );
  return (
    <>
      {svg(
        <>
          <LabWorld cam={cam} t={t} lid={st.lid} coil={st.coil} magnet={st.magnet} body={body} />
          {t < S.reveal1 && <RevealSurface t={t} cam={cam} />}
        </>,
      )}
      {tags}
    </>
  );
};

/** the stream's final pool (a disc of area pi POOL_R^2 centred where labStreamFloor(u = 1) leaves it, ~1.2 mm short of
 *  LAB.DEST) carried on to the hand-off puddle: it keeps drifting toward the magnet and comes to rest exactly on
 *  LAB_HANDOFF.puddle while its edge comes alive (labPuddleFloor settle 0 -> 1). At settle 1 it is exactly
 *  <LabHandoffPuddle t/> (same prims, blend, shading and ripples). */
const streamEndCentre = (t: number) => {
  const st = labStreamFloor(1, t);
  let best: Prim | null = null;
  for (const q of st.prims) if (q.k === 'c' && (!best || (best.k === 'c' && q.r > best.r))) best = q;
  return best && best.k === 'c' ? {x: best.x, d: best.y} : {x: LAB.DEST.x, d: LAB.DEST.d};
};
const SettlePuddle: React.FC<{t: number; cam: Cam3; settle: number}> = ({t, cam, settle}) => {
  const P = LAB_HANDOFF.puddle;
  const c0 = streamEndCentre(t);
  const e = 1 - (1 - clamp(settle)) ** 2; // still moving at the stream's speed, comes to rest
  const x = lerp(c0.x, P.x, e), d = lerp(c0.d, P.d, e);
  const pd = labPuddleFloor({x, d, R: P.rx, t, seed: P.seed, settle});
  const prims = projectPrims(cam, floorPrims(pd.prims, 0, LAB_STREAM.thick));
  const sc = labProj(cam, {x, h: 0, d})?.s ?? 40;
  const rip = 0.6 * clamp(settle);
  const rings: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.55 + k / 3) % 1;
    const r = P.rx * (0.15 + 0.6 * ph);
    const pts = Array.from({length: 40}, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return {x: x - 0.4 + Math.cos(a) * r, h: LAB_STREAM.thick + 0.02, d: d - 0.3 + Math.sin(a) * r};
    });
    const sp = labProjPoly(cam, pts);
    if (sp.length > 2) rings.push(<path key={k} d={'M' + sp.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={(rip * Math.sin(Math.PI * ph) * 0.5).toFixed(3)} />);
  }
  return (
    <ChromeBody prims={prims} blend={pd.blend * sc} R={LIQ_SHADE.R * sc} specs={2} env={LAB_ENV} band={LIQ_SHADE.band}>
      {rings}
    </ChromeBody>
  );
};

/** the melted pool inside the cage between the bridge and the stream: area pi POOL_R^2 at LAB.MELT, its edge alive
 *  (labPuddleFloor settle = live, 0 = the plain disc LabStream u = 0 starts from), shaded like LabStream */
const LivePool: React.FC<{t: number; cam: Cam3; live: number; part: 'back' | 'front'}> = ({t, cam, live, part}) => {
  if (live <= 0.002) return <LabStream cam={cam} t={t} u={0} part={part} />;
  const pd = labPuddleFloor({x: LAB.MELT.x, d: LAB.MELT.d, R: LAB.POOL_R, t, seed: 5, settle: live});
  const prims = projectPrims(cam, floorPrims(pd.prims, 0, LAB_STREAM.thick));
  const sc = labProj(cam, {x: 0, h: 0, d: 0})?.s ?? 40;
  return <ChromeBody prims={prims} blend={lerp(LAB_STREAM.blend, pd.blend, ss(live, 0, 0.3)) * sc} R={LIQ_SHADE.R * sc} specs={2} env={LAB_ENV} band={LIQ_SHADE.band} depthSplit={{d0: LAB.CAGE.d0, part}} />;
};

/** horizon-band strength while it melts: the rigid figure keeps the full chrome horizon; as it slumps the dark band
 *  is eased down (on the rounded, slumping lump the full band breaks into dark rings that read like eye sockets) */
const MELT_BAND_LOW = 0.55, MELT_HORIZON = -0.2;
const meltBand = (melt: number) => lerp(1, MELT_BAND_LOW, ss(melt, 0.05, 0.3));
/** melt -> stream bridge (labset's labMeltBridgePrims, shaded continuously from ChromeMelt(melt 1) to LabStream(u 0)) */
const MeltBridge: React.FC<{cam: Cam3; t: number; k: number; warm: number; part: 'back' | 'front'}> = ({cam, t, k, warm, part}) => {
  if (k <= 0) return <ChromeMelt cam={cam} t={t} base={LAB.MELT} melt={1} warm={warm} part={part} />;
  if (k >= 1) return <LabStream cam={cam} t={t} u={0} part={part} warm={warm} />;
  const b = labMeltBridgePrims(cam, t, k, LAB.MELT);
  const e = clamp(k);
  return (
    <ChromeBody prims={b.prims} blend={b.blend} R={b.R} band={lerp(MELT_BAND_LOW, LIQ_SHADE.band, e)} horizon={lerp(MELT_HORIZON, 0, e)} specs={2} env={LAB_ENV} warm={warm} floor={labFigureFloor(cam, LAB.MELT, 0.45 * (1 - ss(k, 0.1, 0.8)))} depthSplit={{d0: LAB.CAGE.d0, part}} />
  );
};

/** the melting figure (LabFigure's look; warm tint kept low so the material stays silver) */
const ChromeMelt: React.FC<{cam: Cam3; t: number; base: P3; melt: number; warm: number; part: 'back' | 'front'}> = ({cam, t, base, melt, warm, part}) => {
  const L = labFigurePrims(cam, base, LAB.FIG_H, melt, t);
  const r = L.rigid;
  return (
    <ChromeBody
      prims={L.prims}
      blend={L.blend}
      groupBlend={[L.blend, L.blend, L.blend, L.blend, L.blend]}
      rigid={[r, r, r, r, r]}
      groupR={[1.5, 0.6, 1.2, 0.45, 0.9].map((x) => x * L.k)}
      groupBand={[1, 0, 1, 0, 1].map((b) => b * meltBand(melt))}
      band={meltBand(melt)}
      horizon={MELT_HORIZON * ss(melt, 0.05, 0.3)}
      R={lerp(1.6, 2.4, ss(melt, 0.3, 1)) * L.k}
      warm={warm}
      env={LAB_ENV}
      floor={labFigureFloor(cam, base)}
      depthSplit={{d0: LAB.CAGE.d0, part}}
    />
  );
};

// =====================================================================================================================
// SOUND
// =====================================================================================================================
export const CUES_LB = (): Cue[] => [
  // the lid drops shut on "cage" (latch)
  {t: S.lid + 0.01, kind: 'lock', gain: -2},
  // the magnet arrives (soft swell, under "But instead")
  {t: S.magIn[0] + 0.05, kind: 'field', gain: -5, dur: 1.4},
  // the two knocks against the bars
  {t: S.hit1, kind: 'clunk', gain: -2},
  {t: S.hit2, kind: 'clunk', gain: 1},
  // the coil energises in the pause before "It MELTED"
  {t: S.coilOn - 0.03, kind: 'ac_on', gain: -1, dur: 1.2},
  // the collapse (sizzle + descending goop), then the pool settling
  {t: S.melt[0] + 0.25, kind: 'melt', gain: -2, dur: 1.9},
  // the magnet returns (pause after "metal"); a glint off the shimmering pool in the same pause
  {t: S.magIn2[0] + 0.05, kind: 'field', gain: -3, dur: 1.6},
  {t: 11.33, kind: 'glint', gain: -7},
  // the liquid elongates and streams out; the squelch where it necks through the gaps
  {t: S.stream[0] + 0.28, kind: 'stream', gain: -2, dur: 1.35},
  // (in the gap between "straight" and "through", where the necks form in the bar gaps)
  {t: 12.565, kind: 'squeeze', gain: -5, dur: 0.5},
  // it collects outside (pause after "bars")
  {t: 13.33, kind: 'drip', gain: -4},
];
void C;
void LAB_CAMS;
