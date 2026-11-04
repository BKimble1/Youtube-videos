// V4 S3 XRAY (3.84 – 5.78, rendered 3.6 – 6.0): "Scientists filmed it on X-ray."
//
// A research tank in a dark lab. Between two boxy housings (the emitter above the tank, the detector below it) is
// the FIELD: a vertical band of the tank where everything shows as a radiograph (blue-black ground, glowing soft
// tissue, bright bones). The predator glides in from the right, head first; the part inside the field is V3's
// radiograph (XRayBack / XRayFront on the fish.tsx outline), the part outside is V3's painted exterior. The moment
// the snout crosses the field's edge the beam "catches" (a flash through the field, the edge flares, the emitter's
// lamp lights): XRAY_CHANGE_T. On "X-ray" (4.94) the whole fish is inside: the full skeletal profile, and in its
// stomach the swallowed eel, glowing with contrast agent, coiled with its head and eye deepest (toward the fish's
// tail) and its tail toward the esophagus. Then the camera pushes in toward the stomach following the eel's moving
// tail, and ends on hand-off 1: the eel's last 12 units lie on carryTail(t) for t in [CARRY0, CARRY1].
//
// World units: the predator's own frame (anatomy.ts), the fish facing -x. The tank is in the same units; the fish
// glides along y = 0 and comes to rest with its frame on the tank's origin, so after ~5.05 tank = fish coordinates.
import React from 'react';
import {add, closed, lerpP, mul, n4, nrm, open, P, perp, poly, pt, sub} from '../../core/geo';
import {uid} from '../../core/ids';
import {lit, mix} from '../../core/color';
import {clamp, hash, lerp, noise1, ss, ss5} from '../../lib';
import {C, INK, INK_PX, NS} from '../../art/palette';
import {STOMACH} from '../../anatomy';
import {FishBody, FishFar, FishLook, GillGap, opercGeom, Operculum, Pectoral} from '../../art/fish';
import {XRayBack, XRayFront} from '../../art/xray';
import {eelSilhouette} from '../../art/eelArt';
import {EEL_L, EEL_R_MAX, EYE_SCALE, N, RADII} from '../eelV4';
import {CARRY0, CARRY_PX, carryTail, KeepOut} from '../timing';

// ---------------------------------------------------------------- beats
/** the snout crosses the field's right edge: the beam catches (flash, edge flare, lamp). The sound goes here. */
export const XRAY_CHANGE_T = 3.96;
/** the full skeletal profile holds (on "X-ray", 4.94) until the push toward the stomach begins */
export const XRAY_PUSH0 = 5.06;
/** the push ends exactly on the carried tail (px per unit = CARRY_PX) */
export const XRAY_PUSH1 = CARRY0;

// ---------------------------------------------------------------- colours (derived from the palette)
const LAB = mix(INK, C.xrayBg1, 0.55);
const LAB_DEEP = mix(INK, C.xrayBg0, 0.6);
const LAB_GLOW = mix(LAB, C.waterMid, 0.22);
const METAL = mix(C.xraySoft, INK, 0.42);
const METAL_LIT = lit(mix(C.xraySoft, INK, 0.2), 0.18);
const METAL_SH = mix(METAL, INK, 0.5);
const METAL_DEEP = mix(METAL, INK, 0.75);
const TANK_TOP = mix(C.waterTop, C.haze, 0.35);
const TANK_LOW = mix(C.waterMid, C.waterDeep, 0.35);
const GLASS_HI = lit(C.waterTop, 0.65);
const TRIM = mix(INK, C.xrayBg1, 0.25);
const TRIM_LIT = mix(METAL, C.xrayEdge, 0.25);
const BENCH = mix(METAL, LAB, 0.35);
const LAMP = C.eyeIris;
/** the contrast-dyed eel on the radiograph: an aqua-white glow, distinct from the fish's white bone */
const EEL_HALO = mix(C.xrayEdge, C.waterTop, 0.45);
const EEL_BODY = mix(C.xrayEdge, C.waterTop, 0.22);
const EEL_CORE = lit(C.xrayEdge, 0.35);
const EEL_BONE = lit(C.xrayBone, 0.4);

// ---------------------------------------------------------------- the set (tank units)
const FIELD = {x0: -58, x1: 58, y0: -57, y1: 27};
const TANK = {x0: -170, x1: 260, rim: -51, water: -45, floor: 16.5, bottom: 22, base: 26};
const EMIT = {x0: -64, x1: 64, y0: -71, y1: -57};
const DETECT = {x0: -64, x1: 64, y0: 27, y1: 35};
const BENCH_Y = 35;

// ---------------------------------------------------------------- the fish's glide
/** the fish's frame origin in tank units: it glides in from the right at V_GLIDE u/s, its snout (the lower jaw's
 *  tip) reaching the field's right edge exactly at XRAY_CHANGE_T, then decelerates evenly to rest at x = 0 */
const V_GLIDE = 122;
const GLIDE_STOP = 5.1;
const SNOUT_X = -51.0;
const X_AT_CHANGE = 58 - SNOUT_X;
const DECEL0 = (2 * X_AT_CHANGE) / V_GLIDE + 2 * XRAY_CHANGE_T - GLIDE_STOP;
export const fishX = (t: number) => {
  if (t >= GLIDE_STOP) return 0;
  if (t >= DECEL0) {
    const u = GLIDE_STOP - t;
    return (V_GLIDE * u * u) / (2 * (GLIDE_STOP - DECEL0));
  }
  return X_AT_CHANGE - V_GLIDE * (t - XRAY_CHANGE_T);
};
/** the caudal fin's tip in fish units (its sway reaches ≈ 50.5) */
const CAUDAL_TIP_X = 50.5;
/** the whole fish (caudal tip included) is inside the field: before "X-ray" (4.94) */
export const XRAY_ALL_IN_T = (() => {
  const xIn = 58 - CAUDAL_TIP_X; // the fish's origin when its caudal tip reaches the edge (in the deceleration)
  return GLIDE_STOP - Math.sqrt((2 * (GLIDE_STOP - DECEL0) * xIn) / V_GLIDE);
})();
const fishY = (t: number) => 0.25 * Math.sin(2 * Math.PI * 0.45 * (t - 3.6)) * (1 - ss(t, 4.6, 5.1));

/** the integral of the smoothstep from 0 to x (x in units of the step's length) */
const ssInt = (x: number) => (x <= 0 ? 0 : x >= 1 ? 0.5 + (x - 1) : x ** 3 - x ** 4 / 2);
const lookFor = (t: number): FishLook => ({
  t,
  gill: 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.9 * (t - 3.5))),
  // the fins beat at 1.6 Hz while gliding, easing to 0.6 Hz as it coasts to rest (the phase never runs backward)
  finPhase: 2 * Math.PI * (1.6 * (t - 3.0) - 1.0 * 0.6 * ssInt((t - 4.6) / 0.6)),
  startle: 0,
  prop: 0,
  look: 0,
});

// ---------------------------------------------------------------- the eel in the stomach (fish units)
const I0 = Math.round(N * (1 - 12 / EEL_L)); // = carryTail's i0
const SEG_B = EEL_L / N; // body sample spacing
const SEG_T = 12 / (N - I0); // the carried tail's sample spacing
/** the tail's root (sample I0) in fish units, fixed in the stomach */
const A_W: P = pt(-2.4, 7.25);
/** the body route from the tail's root back toward the head (control points, fish units): down-right along the
 *  stomach floor, up round its blind end, forward along its roof, a hairpin down, and back toward the blind end,
 *  so the head lies deepest with the eye toward the fish's tail */
const ROUTE_CP: P[] = [
  A_W,
  pt(0.4, 8.95),
  pt(3.6, 9.3),
  pt(6.25, 8.2),
  pt(7.75, 6.3),
  pt(8.15, 4.3),
  pt(7.5, 2.3),
  pt(5.6, 0.7),
  pt(2.6, -0.4),
  pt(-1.0, -0.8),
  pt(-3.6, -0.4),
  pt(-5.0, 1.3),
  pt(-3.8, 3.1),
  pt(-1.0, 3.7),
  pt(1.0, 4.35),
  pt(3.4, 4.85),
  pt(5.4, 5.0),
  pt(7.4, 5.0),
];
/** Catmull-Rom sampled densely, with an arc-length table */
const dense = (cp: P[], per = 16) => {
  const out: P[] = [];
  const n = cp.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push(pt(f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y)));
    }
  }
  out.push(cp[n - 1]);
  const s = [0];
  for (let i = 1; i < out.length; i++) s.push(s[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
  return {p: out, s, len: s[s.length - 1]};
};
const ROUTE = dense(ROUTE_CP);
const routeAt = (s: number): P => {
  const q = ROUTE;
  if (s <= 0) return q.p[0];
  if (s >= q.len) {
    const a = q.p[q.p.length - 1], b = q.p[q.p.length - 2], l = Math.hypot(a.x - b.x, a.y - b.y) || 1, e = s - q.len;
    return pt(a.x + ((a.x - b.x) / l) * e, a.y + ((a.y - b.y) / l) * e);
  }
  let lo = 0, hi = q.p.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= s) lo = m; else hi = m;
  }
  return lerpP(q.p[lo], q.p[hi], (s - q.s[lo]) / (q.s[hi] - q.s[lo] || 1));
};
/** the route's direction at the root (toward the head) */
const ROUTE_DIR0 = Math.atan2(ROUTE.p[2].y - ROUTE.p[0].y, ROUTE.p[2].x - ROUTE.p[0].x);
const wrapA = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

/** the carried tail's segment headings (screen = world angles: the final camera does not roll), extrapolated
 *  linearly before carryTail's own clamp so the blend never sees a frozen pose */
const CLAMP0 = CARRY0 - 0.2;
const carryHeadings = (t: number): number[] => {
  const hd = (tt: number) => {
    const c = carryTail(tt).pts;
    return c.slice(1).map((p, k) => Math.atan2(p.y - c[k].y, p.x - c[k].x));
  };
  if (t >= CLAMP0) return hd(t);
  const a = hd(CLAMP0), b = hd(CLAMP0 + 0.02);
  return a.map((v, k) => v + (wrapA(b[k] - v) / 0.02) * (t - CLAMP0));
};
/** the carried tail's root on screen: carryTail's own for t >= CARRY0 - 0.2, extrapolated linearly before (where
 *  carryTail clamps its clock), so the push never aims at a frozen point */
const carryRoot = (t: number): P => {
  if (t >= CLAMP0) return carryTail(t).pts[0];
  const a = carryTail(CLAMP0).pts[0], b = carryTail(CLAMP0 + 0.02).pts[0];
  return pt(a.x + ((b.x - a.x) / 0.02) * (t - CLAMP0), a.y + ((b.y - a.y) / 0.02) * (t - CLAMP0));
};

/** the tail's own stirring before the hand-off: a slow sweep and a wave running to the tip (headings, rad) */
const ownHeadings = (t: number): number[] => {
  const n = N - I0;
  const out: number[] = [];
  const sweep = 0.27 * Math.sin(2 * Math.PI * 0.8 * (t - 3.9)) + 0.08 * noise1(t * 1.3, 4);
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * SEG_T;
    const f = a / 12;
    out.push((-150 * Math.PI) / 180 - 0.04 * a + sweep * Math.pow(f, 1.2) + 0.36 * Math.sin(2 * Math.PI * (1.6 * t - a / 8.5)) * f);
  }
  return out;
};
/** blend weight from the tail's own motion into the carried tail */
const carryW = (t: number) => ss5(t, CARRY0 - 0.3, CARRY0);

/** the eel's 121 samples (snout → tail tip) in FISH units at time t */
export const eelPts = (t: number): P[] => {
  // tail: integrate the (blended) headings from the root
  const own = ownHeadings(t);
  const w = carryW(t);
  const car = w > 0 ? carryHeadings(t) : own;
  const th = own.map((v, k) => v + w * wrapA(car[k] - v));
  const tail: P[] = [A_W];
  let x = A_W.x, y = A_W.y;
  for (const a of th) {
    x += Math.cos(a) * SEG_T;
    y += Math.sin(a) * SEG_T;
    tail.push(pt(x, y));
  }
  // body: along the route from the root, bent near the root so its direction meets the tail's first heading
  const want = wrapA(th[0] + Math.PI);
  const dTh = wrapA(want - ROUTE_DIR0);
  const K = 22;
  const body: P[] = [];
  for (let i = 0; i < I0; i++) {
    const s = (I0 - i) * SEG_B;
    let p = routeAt(s);
    // a slow peristaltic shiver along the coil (never at the root, so the tail section stays exact)
    const u = i / N;
    const q1 = routeAt(s - 0.3), q2 = routeAt(s + 0.3);
    const tg = nrm(sub(q2, q1)), nn = perp(tg);
    const amp = 0.09 * ss(I0 - i, 4, 16) * (0.6 + 0.4 * Math.sin(u * 9));
    p = add(p, mul(nn, amp * Math.sin(2 * Math.PI * (0.55 * t - u * 2.2))));
    // the bend at the root
    const f = ss(i, I0 - K, I0);
    if (f > 0) {
      const a = dTh * f;
      const d = sub(p, A_W), c = Math.cos(a), sn = Math.sin(a);
      p = add(A_W, pt(d.x * c - d.y * sn, d.x * sn + d.y * c));
    }
    body.push(p);
  }
  return [...body, ...tail];
};

// ---------------------------------------------------------------- the camera
type Cam = {x: number; y: number; s: number};
const LOGS = (a: number, b: number, u: number) => Math.exp(lerp(Math.log(a), Math.log(b), u));
/** the establishing → full-profile camera (tank units): a wide view of the rig with the fish entering at the right,
 *  then a pan and push with the fish until the field fills the width (the full skeletal profile) */
const CAMB0 = 3.6, CAMB1 = 4.98;
const camBase = (t: number): Cam => {
  // x: a Hermite pan that is already moving left at the cut (following the fish) and settles on the field's centre
  const T = CAMB1 - CAMB0;
  const tau = clamp((t - CAMB0) / T);
  const h00 = 2 * tau ** 3 - 3 * tau ** 2 + 1, h10 = tau ** 3 - 2 * tau ** 2 + tau;
  const x = t < CAMB0 ? 68 + 34 * (CAMB0 - t) : 68 * h00 - 34 * T * h10;
  const u = ss5(t, CAMB0, CAMB1);
  const drift = ss(t, 4.85, 5.7);
  return {
    x,
    y: lerp(-25, -20, u),
    s: LOGS(7.9, 8.75, u) * (1 + 0.035 * drift),
  };
};
/** the camera: base, then the push that follows the tail into the carried pose (scale CARRY_PX, the tail's root on
 *  carryTail's root). For t >= CARRY0 the screen tail is exactly carryTail(t). */
export const camAt = (t: number): Cam => {
  const b = camBase(t);
  const w = ss5(t, XRAY_PUSH0, XRAY_PUSH1);
  if (w <= 0) return b;
  const fx = fishX(t), fy = fishY(t);
  const root = pt(A_W.x + fx, A_W.y + fy);
  const sb = pt(540 + (root.x - b.x) * b.s, 960 + (root.y - b.y) * b.s);
  const sc = carryRoot(t);
  const s = LOGS(b.s, CARRY_PX, w);
  const S = lerpP(sb, sc, w);
  return {x: root.x - (S.x - 540) / s, y: root.y - (S.y - 960) / s, s};
};
const DIST = 2.2;
/** the scale of a layer at depth z (+ farther) */
const sAt = (c: Cam, z: number) => {
  const d = DIST * (1080 / c.s);
  return (c.s * d) / (d + z);
};
const camT = (c: Cam, z = 0) => `translate(540 960) scale(${sAt(c, z).toFixed(5)}) translate(${(-c.x).toFixed(4)} ${(-c.y).toFixed(4)})`;
const toScreen = (c: Cam, p: P, z = 0): P => {
  const s = sAt(c, z);
  return pt(540 + (p.x - c.x) * s, 960 + (p.y - c.y) * s);
};

// ---------------------------------------------------------------- keep-out (screen px)
export const keepOut = (t: number): KeepOut => {
  const c = camAt(t);
  const fx = fishX(t), fy = fishY(t);
  const e = eelPts(t).map((p, i) => {
    const q = toScreen(c, pt(p.x + fx, p.y + fy));
    return {x: q.x, y: q.y, r: RADII[i] * c.s};
  });
  // the gill gap (the exterior's dark opening under the cover) shows while it is still outside the field
  const out: KeepOut = {eel: e};
  const G = opercGeom(lookFor(t));
  if (Math.max(...G.gap.map((p) => p.x)) + fx > FIELD.x1) out.gap = G.gap.map((p) => toScreen(c, pt(p.x + fx, p.y + fy)));
  return out;
};

// ---------------------------------------------------------------- the radiograph eel
const RX = EEL_R_MAX;
/** radii scaled by k, plus a glow margin that shrinks toward the fine tail tip (sqrt of the local radius) */
const scaleR = (k: number, add0 = 0) => RADII.map((r) => r * k + add0 * Math.sqrt(r / RX));
/** the eel's centreline frame: unit tangents and left normals */
const frame = (pts: P[]) =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tg = nrm(sub(b, a));
    return {tg, n: perp(tg)};
  });
/** The swallowed eel as the radiograph shows it: dyed with contrast agent, it glows (an aqua halo and a dense body,
 *  brightest along its axis, as a cylinder is), with its own skeleton: a BROAD BRIGHT SKULL with jaws and the eye as
 *  a bony ring at the head end, the vertebral column thinning along the body, and a tail that tapers to a fine point
 *  inside the faint fringe of its ribbon fin. In fish units, inside the fish's transform. `glow` lifts the halo. */
const XRayEel: React.FC<{pts: P[]; t: number; glow: number; tail: number}> = ({pts, t, glow, tail}) => {
  const F = frame(pts);
  const halo2 = eelSilhouette(pts, scaleR(1.9, 0.75));
  const halo1 = eelSilhouette(pts, scaleR(1.3, 0.28));
  const body = eelSilhouette(pts, RADII);
  const mid = eelSilhouette(pts, scaleR(0.66));
  const core = eelSilhouette(pts, scaleR(0.32));
  const fin = eelSilhouette(pts, RADII, Math.round(N * 0.38), N, true, t, 1, 0.04);
  // the vertebral column: from behind the skull to near the tip, in short chunks that thin with the body
  const spine: {d: string; w: number}[] = [];
  const i0 = Math.round(N * 0.09);
  const i1 = Math.round(N * 0.975);
  for (let i = i0; i < i1; i += 6) {
    const j = Math.min(i1, i + 6);
    spine.push({d: open(pts.slice(i, j + 1), 0.5), w: 0.34 * RADII[Math.round((i + j) / 2)]});
  }
  // the skull: a dense lens over the head (snout → neck), as broad as the head
  const nSk = Math.round(N * 0.105);
  const skW = (i: number) => {
    const u = i / N;
    const prof = u < 0.014 ? 0.55 + 0.33 * (u / 0.014) : u < 0.07 ? 0.88 + 0.06 * Math.sin(((u - 0.014) / 0.056) * Math.PI) : 0.88 * (1 - ss(u, 0.07, 0.105)) + 0.3;
    return RADII[i] * prof;
  };
  const skL: P[] = [], skR: P[] = [];
  for (let i = 0; i <= nSk; i++) {
    skL.push(add(pts[i], mul(F[i].n, skW(i))));
    skR.push(add(pts[i], mul(F[i].n, -skW(i))));
  }
  const snout = add(pts[0], mul(F[0].tg, -0.3));
  const skull = closed([snout, ...skL.slice(1), ...[...skR.slice(1)].reverse()], 0.9);
  const skullIn = closed([add(snout, mul(F[0].tg, 0.5)), ...skL.slice(2, -1).map((q, k) => lerpP(q, pts[k + 2], 0.42)), ...[...skR.slice(2, -1).map((q, k) => lerpP(q, pts[k + 2], 0.42))].reverse()], 0.9);
  // jaws: dense lines from the snout tip back along the lower side
  const jaw = open([add(snout, mul(F[0].n, -0.12)), ...[2, 5, 8].map((i) => add(pts[i], mul(F[i].n, -RADII[i] * 0.6)))], 1);
  // the eye: a bright bony ring (the orbit) round the darker eyeball, a dense lens
  const ie = Math.round(N * 0.03);
  const eyeR = 0.46 * EYE_SCALE;
  const ec = add(pts[ie], mul(F[ie].n, RADII[ie] * 0.2));
  // the pectoral girdle: a bright arc across the body just behind the head
  const ig = Math.round(N * 0.105);
  const gir = open([add(pts[ig], mul(F[ig].n, RADII[ig] * 0.95)), add(pts[ig + 1], mul(F[ig].tg, 0.15)), add(pts[ig], mul(F[ig].n, -RADII[ig] * 0.95))], 1);
  // the head's own glow (the dense skull shines through the halo): a bright bulb that reads at phone size
  const hc = pts[Math.round(N * 0.04)];
  // the followed tail: its glow builds up from the rear third to the tip (overlapping sections: a soft onset)
  const tailHalo = tail > 0.002 ? [0.5, 0.6, 0.7, 0.8].map((u) => eelSilhouette(pts, scaleR(2.0, 0.5), Math.round(N * u), N)) : [];
  const tailCore = tail > 0.002 ? [0.58, 0.66, 0.74].map((u) => eelSilhouette(pts, scaleR(0.55), Math.round(N * u), N)) : [];
  return (
    <g>
      <path d={halo2} fill={EEL_HALO} fillOpacity={0.1 * glow * (1 - 0.4 * tail)} />
      <path d={halo1} fill={EEL_HALO} fillOpacity={0.2 * glow * (1 - 0.3 * tail)} />
      <circle cx={hc.x} cy={hc.y} r={3.3} fill={EEL_HALO} fillOpacity={0.1 * glow} />
      <circle cx={hc.x} cy={hc.y} r={2.4} fill={EEL_HALO} fillOpacity={0.16 * glow} />
      <circle cx={hc.x} cy={hc.y} r={1.7} fill={EEL_CORE} fillOpacity={0.14 * glow} />
      {tailHalo.map((d, k) => (
        <path key={k} d={d} fill={EEL_HALO} fillOpacity={0.07 * tail} />
      ))}
      <path d={fin} fill={EEL_HALO} fillOpacity={0.2 + 0.12 * tail} />
      <path d={body} fill={EEL_BODY} fillOpacity={0.72} />
      <path d={mid} fill={EEL_BODY} fillOpacity={0.55} />
      <path d={core} fill={EEL_CORE} fillOpacity={0.55} />
      {tailCore.map((d, k) => (
        <path key={k} d={d} fill={EEL_CORE} fillOpacity={0.15 * tail} />
      ))}
      <path d={body} fill="none" stroke={EEL_CORE} strokeOpacity={0.8} strokeWidth={1.4} vectorEffect={NS} />
      {spine.map((sg, k) => (
        <path key={k} d={sg.d} fill="none" stroke={EEL_BONE} strokeOpacity={0.55} strokeWidth={sg.w * 0.45} />
      ))}
      {spine.map((sg, k) => (
        <path key={`v${k}`} d={sg.d} fill="none" stroke={EEL_BONE} strokeOpacity={0.85} strokeWidth={sg.w} strokeDasharray="0.32 0.13" />
      ))}
      <path d={skull} fill={EEL_BONE} fillOpacity={0.8} />
      <path d={skullIn} fill={C.xrayBone} fillOpacity={0.75} />
      <path d={skull} fill="none" stroke={EEL_BONE} strokeWidth={1.3} vectorEffect={NS} />
      <path d={jaw} fill="none" stroke={C.xrayBone} strokeOpacity={1} strokeWidth={0.16} strokeLinecap="round" />
      <path d={gir} fill="none" stroke={EEL_BONE} strokeOpacity={0.85} strokeWidth={0.2} strokeLinecap="round" />
      <circle cx={ec.x} cy={ec.y} r={eyeR * 0.95} fill={C.xrayBg0} fillOpacity={0.82} />
      <circle cx={ec.x} cy={ec.y} r={eyeR * 0.95} fill="none" stroke={C.xrayBone} strokeWidth={0.22} />
      <circle cx={ec.x - 0.08} cy={ec.y - 0.06} r={eyeR * 0.32} fill={C.xrayBone} />
    </g>
  );
};

// ---------------------------------------------------------------- the set pieces
const pebbles = (() => {
  const out: {c: P; rx: number; ry: number; a: number; k: number}[] = [];
  for (let i = 0; i < 150; i++) {
    const x = TANK.x0 + (TANK.x1 - TANK.x0) * hash(i * 3.17 + 0.5);
    const rx = 0.9 + 2.2 * hash(i * 5.3 + 1.1);
    const ry = rx * (0.5 + 0.25 * hash(i * 2.9));
    const y = TANK.floor + 0.6 + (TANK.bottom - TANK.floor - 1.2) * hash(i * 7.7 + 2.3);
    out.push({c: pt(x, y), rx, ry, a: (hash(i * 1.9) - 0.5) * 0.5, k: Math.floor(hash(i * 9.1) * 3)});
  }
  return out.sort((a, b) => a.c.y - b.c.y);
})();
const ellD = (c: P, rx: number, ry: number, a: number) => {
  const pts: P[] = [];
  for (let i = 0; i < 10; i++) {
    const g = (i / 10) * 2 * Math.PI;
    const x = Math.cos(g) * rx, y = Math.sin(g) * ry;
    pts.push(pt(c.x + x * Math.cos(a) - y * Math.sin(a), c.y + x * Math.sin(a) + y * Math.cos(a)));
  }
  return closed(pts, 1);
};
const PEB_COL = [C.pebbleA, C.pebbleB, C.pebbleC];

/** the dark lab behind the tank (a far layer): the wall in the tank's light, panel seams, a high shelf of equipment
 *  silhouettes; flat shapes in two deep tones */
const LabBack: React.FC = () => {
  const id = uid('xlPool');
  const boxes: [number, number, number, number][] = [
    [-250, -168, 34, 22], [-210, -176, 18, 30], [-186, -163, 40, 17], [-120, -171, 26, 25], [-88, -160, 14, 14],
    [70, -174, 30, 28], [106, -165, 44, 19], [160, -178, 16, 32], [182, -166, 30, 20], [240, -171, 38, 25],
  ];
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="10" cy="-30" r="190" gradientTransform="translate(10 -30) scale(1.3 1) translate(-10 30)">
          <stop offset="0" stopColor={LAB_GLOW} />
          <stop offset="0.6" stopColor={mix(LAB_GLOW, LAB, 0.6)} />
          <stop offset="1" stopColor={LAB} />
        </radialGradient>
      </defs>
      <rect x={-700} y={-500} width={1500} height={1000} fill={LAB} />
      <rect x={-700} y={-500} width={1500} height={1000} fill={`url(#${id})`} />
      {[-330, -230, -130, 150, 250, 350].map((x, i) => (
        <path key={i} d={`M${x} -400V160`} stroke={LAB_DEEP} strokeWidth={2.2} vectorEffect={NS} strokeOpacity={0.55} />
      ))}
      {/* the shelf and what stands on it */}
      <rect x={-300} y={-146} width={600} height={4} fill={LAB_DEEP} />
      <rect x={-300} y={-146} width={600} height={1} fill={LAB_GLOW} fillOpacity={0.7} />
      {boxes.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx={i % 3 === 0 ? 3 : 1} fill={LAB_DEEP} />
          <rect x={x} y={y} width={w * 0.22} height={h} rx={1} fill={LAB_GLOW} fillOpacity={0.35} />
        </g>
      ))}
    </g>
  );
};

/** the bench under the rig: a slab with a lit front edge and a cabinet of doors below (light from the upper left) */
const Bench: React.FC = () => {
  const y = BENCH_Y;
  const doors = [-360, -250, -140, -30, 80, 190, 300];
  return (
    <g>
      <rect x={-420} y={y + 5} width={960} height={300} fill={mix(LAB_DEEP, METAL_DEEP, 0.3)} />
      {doors.map((x, i) => (
        <g key={i}>
          <rect x={x + 2} y={y + 10} width={104} height={200} rx={1.5} fill={mix(LAB_DEEP, METAL_DEEP, 0.42)} stroke={INK} strokeWidth={INK_PX * 0.7} vectorEffect={NS} />
          <rect x={x + 2} y={y + 10} width={104} height={1.2} fill={METAL_SH} fillOpacity={0.6} />
          <rect x={x + 8} y={y + 18} width={22} height={2.2} rx={1.1} fill={METAL_SH} stroke={INK} strokeWidth={1.3} vectorEffect={NS} />
        </g>
      ))}
      {/* the slab */}
      <rect x={-420} y={y} width={960} height={5} fill={BENCH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      <rect x={-420} y={y} width={960} height={1.2} fill={METAL_LIT} fillOpacity={0.75} />
      {/* the rig's shadow on the slab, falling to the lower right */}
      <rect x={DETECT.x0 + 3} y={y + 0.4} width={DETECT.x1 - DETECT.x0 + 8} height={2.2} fill={INK} fillOpacity={0.35} />
    </g>
  );
};

/** the rig: the tank (back, water, gravel), drawn at the fish's depth; the field drawn separately */
const TankBack: React.FC<{t: number}> = ({t}) => {
  const id = {water: uid('xtWater'), shaft: uid('xtShaft')};
  const W = TANK;
  return (
    <g>
      <defs>
        <linearGradient id={id.water} gradientUnits="userSpaceOnUse" x1="0" y1={W.water} x2="0" y2={W.floor}>
          <stop offset="0" stopColor={TANK_TOP} />
          <stop offset="0.55" stopColor={C.waterMid} />
          <stop offset="1" stopColor={TANK_LOW} />
        </linearGradient>
        <linearGradient id={id.shaft} gradientUnits="userSpaceOnUse" x1="0" y1={W.water} x2="0" y2={W.floor}>
          <stop offset="0" stopColor={C.mote} stopOpacity={0.22} />
          <stop offset="1" stopColor={C.mote} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the air gap under the lid and the water */}
      <rect x={W.x0} y={W.rim} width={W.x1 - W.x0} height={W.water - W.rim} fill={mix(LAB_GLOW, C.haze, 0.25)} />
      <rect x={W.x0} y={W.water} width={W.x1 - W.x0} height={W.floor - W.water + 1} fill={`url(#${id.water})`} />
      {/* light shafts from the upper left */}
      {[-140, -90, -20, 70, 150, 210].map((x, i) => {
        const w = 10 + 8 * hash(i * 3.3);
        const sw = 0.3 * Math.sin(t * 0.8 + i);
        return <path key={i} d={poly([pt(x + sw, W.water), pt(x + w + sw, W.water), pt(x + w + 34, W.floor), pt(x + 26, W.floor)])} fill={`url(#${id.shaft})`} />;
      })}
      {/* the water line: a bright meniscus band */}
      <rect x={W.x0} y={W.water} width={W.x1 - W.x0} height={1.4} fill={GLASS_HI} fillOpacity={0.55} />
      <rect x={W.x0} y={W.water + 1.4} width={W.x1 - W.x0} height={2.5} fill={GLASS_HI} fillOpacity={0.12} />
      {/* gravel */}
      <rect x={W.x0} y={W.floor} width={W.x1 - W.x0} height={W.bottom - W.floor} fill={C.sand} />
      <rect x={W.x0} y={W.floor} width={W.x1 - W.x0} height={1.0} fill={lit(C.sand, 0.25)} />
      {pebbles.map((p, i) => (
        <path key={i} d={ellD(p.c, p.rx, p.ry, p.a)} fill={PEB_COL[p.k]} stroke={INK} strokeWidth={0.9} strokeOpacity={0.5} vectorEffect={NS} />
      ))}
    </g>
  );
};
/** the tank's trims (top rim, bottom base) and the glass edge highlights, drawn over the water */
const TankTrims: React.FC = () => {
  const W = TANK;
  return (
    <g>
      <rect x={W.x0} y={W.rim - 3} width={W.x1 - W.x0} height={3} fill={TRIM} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      <rect x={W.x0} y={W.rim - 3} width={W.x1 - W.x0} height={0.8} fill={TRIM_LIT} />
      <rect x={W.x0} y={W.bottom} width={W.x1 - W.x0} height={W.base - W.bottom} fill={TRIM} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
      <rect x={W.x0} y={W.bottom} width={W.x1 - W.x0} height={0.8} fill={TRIM_LIT} />
      {/* the front glass catches the light: a few long, faint diagonal glints */}
      {[-120, 95, 190].map((x, i) => (
        <path key={i} d={poly([pt(x, W.rim), pt(x + 7, W.rim), pt(x - 18, W.bottom), pt(x - 25, W.bottom)])} fill={GLASS_HI} fillOpacity={0.06} />
      ))}
    </g>
  );
};

/** a boxy housing: front face, lit top face, shadowed side, ink; light from the upper left. The emitter carries the
 *  X-ray tube (a capsule) on top; both have a beam window facing the field, vents and an indicator lamp. */
const Housing: React.FC<{x0: number; x1: number; y0: number; y1: number; depth: number; kind: 'emitter' | 'detector'; lamp: number; beam: number}> = ({x0, x1, y0, y1, depth, kind, lamp, beam}) => {
  const dy = depth * 0.55;
  const top = poly([pt(x0, y0), pt(x0 + depth, y0 - dy), pt(x1 + depth, y0 - dy), pt(x1, y0)]);
  const side = poly([pt(x1, y0), pt(x1 + depth, y0 - dy), pt(x1 + depth, y1 - dy), pt(x1, y1)]);
  const h = y1 - y0;
  const win = kind === 'emitter' ? {y: y1 - 1.8, h: 1.8} : {y: y0, h: 1.5};
  const vents = Array.from({length: 6}, (_, i) => x0 + 7 + i * 2.6);
  const tube = kind === 'emitter';
  const tc = {x0: -34, x1: 34, y: y0 - dy - 3.2, r: 3.4};
  return (
    <g>
      {tube && (
        <g>
          <rect x={tc.x0} y={tc.y - tc.r} width={tc.x1 - tc.x0} height={2 * tc.r} rx={tc.r} fill={METAL} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
          <rect x={tc.x0 + 2} y={tc.y - tc.r + 0.9} width={tc.x1 - tc.x0 - 4} height={1.3} rx={0.65} fill={METAL_LIT} />
          <rect x={tc.x0 + 2} y={tc.y + tc.r * 0.25} width={tc.x1 - tc.x0 - 4} height={tc.r * 0.6} rx={0.8} fill={METAL_SH} fillOpacity={0.7} />
          {[-24, 24].map((x, i) => (
            <rect key={i} x={x - 2.4} y={tc.y - tc.r - 0.6} width={4.8} height={2 * tc.r + 1.2} rx={0.8} fill={METAL_SH} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
          ))}
        </g>
      )}
      <path d={top} fill={METAL_LIT} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <path d={side} fill={METAL_SH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <rect x={x0} y={y0} width={x1 - x0} height={h} fill={METAL} />
      <rect x={x0} y={y0 + h * 0.6} width={x1 - x0} height={h * 0.4} fill={METAL_SH} fillOpacity={0.5} />
      <rect x={x0} y={y0} width={x1 - x0} height={0.9} fill={METAL_LIT} fillOpacity={0.85} />
      {/* the beam window, glowing faintly (and brightly when the beam catches) */}
      <rect x={x0 + 4} y={win.y} width={x1 - x0 - 8} height={win.h} fill={METAL_DEEP} />
      <rect x={x0 + 4} y={kind === 'emitter' ? win.y + win.h - 0.6 : win.y} width={x1 - x0 - 8} height={0.6} fill={C.xrayEdge} fillOpacity={0.3 + 0.65 * beam} />
      {vents.map((x, i) => (
        <rect key={i} x={x} y={y0 + h * 0.22} width={1.1} height={h * 0.36} rx={0.5} fill={METAL_DEEP} fillOpacity={0.85} />
      ))}
      <path d={`M${x1 - 24} ${y0 + 1}V${y1 - (kind === 'emitter' ? 2.4 : 1.8)}`} stroke={METAL_DEEP} strokeWidth={1.3} vectorEffect={NS} strokeOpacity={0.8} />
      {/* the indicator lamp */}
      <circle cx={x1 - 13} cy={y0 + h * 0.42} r={1.25} fill={mix(METAL_DEEP, LAMP, 0.15 + 0.85 * lamp)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
      {lamp > 0.02 && <circle cx={x1 - 13} cy={y0 + h * 0.42} r={3.4} fill={LAMP} fillOpacity={0.24 * lamp} />}
      {lamp > 0.02 && <circle cx={x1 - 13.35} cy={y0 + h * 0.42 - 0.35} r={0.4} fill={C.mote} fillOpacity={0.9 * lamp} />}
      <rect x={x0} y={y0} width={x1 - x0} height={h} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
    </g>
  );
};

/** the radiograph ground of the field, with the tank's rims and gravel as the beam sees them */
const FieldGround: React.FC<{flash: number}> = ({flash}) => {
  const id = {g: uid('xfG')};
  const F = FIELD;
  return (
    <g>
      <defs>
        <radialGradient id={id.g} gradientUnits="userSpaceOnUse" cx="0" cy="-6" r="72" gradientTransform="translate(0 -6) scale(1.15 1) translate(0 6)">
          <stop offset="0" stopColor={mix(C.xrayBg1, C.xraySoft, 0.12 + 0.3 * flash)} />
          <stop offset="0.6" stopColor={mix(C.xrayBg1, C.xrayBg0, 0.4)} />
          <stop offset="1" stopColor={C.xrayBg0} />
        </radialGradient>
      </defs>
      <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={F.y1 - F.y0} fill={`url(#${id.g})`} />
      {/* the glass rim and base (dense: faint bright bands), the water line (a faint step) */}
      <rect x={F.x0} y={TANK.rim - 3} width={F.x1 - F.x0} height={3} fill={C.xraySoft} fillOpacity={0.3} />
      <rect x={F.x0} y={TANK.bottom} width={F.x1 - F.x0} height={TANK.base - TANK.bottom} fill={C.xraySoft} fillOpacity={0.32} />
      <rect x={F.x0} y={TANK.water} width={F.x1 - F.x0} height={TANK.floor - TANK.water} fill={C.xraySoft} fillOpacity={0.06} />
      {/* gravel: pebbles bright with their dense rims */}
      <rect x={F.x0} y={TANK.floor} width={F.x1 - F.x0} height={TANK.bottom - TANK.floor} fill={C.xraySoft} fillOpacity={0.12} />
      {pebbles.filter((p) => p.c.x > F.x0 - 4 && p.c.x < F.x1 + 4).map((p, i) => (
        <path key={i} d={ellD(p.c, p.rx, p.ry, p.a)} fill={C.xrayFlesh} fillOpacity={0.22 + 0.1 * p.k} stroke={C.xrayEdge} strokeOpacity={0.35} strokeWidth={0.18} />
      ))}
    </g>
  );
};
/** the field's edges: scintillating soft bands (layered translucent strips; no blur) */
const FieldEdges: React.FC<{flare: number}> = ({flare}) => {
  const F = FIELD;
  const strips = [
    {w: 3.2, a: 0.05},
    {w: 1.6, a: 0.08},
    {w: 0.7, a: 0.16},
    {w: 0.22, a: 0.55},
  ];
  return (
    <g>
      {[F.x0, F.x1].map((x, k) => (
        <g key={k}>
          {strips.map((s, i) => (
            <rect key={i} x={x - (s.w / 2) * (1 + 1.6 * flare * (k === 1 ? 1 : 0.3))} y={F.y0} width={s.w * (1 + 1.6 * flare * (k === 1 ? 1 : 0.3))} height={F.y1 - F.y0} fill={C.xrayEdge} fillOpacity={Math.min(1, s.a * (1 + 3 * flare * (k === 1 ? 1 : 0.4)))} />
          ))}
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- the frame
export const S3Xray: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const fx = fishX(t), fy = fishY(t);
  const s = lookFor(t);
  const pts = eelPts(t);
  // the beam catches as the snout crosses the edge: a quick flash through the field, the edge flares, the lamps light
  const dtc = t - XRAY_CHANGE_T;
  const flash = dtc < 0 ? 0 : Math.exp(-dtc / 0.13);
  const flare = dtc < -0.04 ? 0 : dtc < 0 ? (dtc + 0.04) / 0.04 : Math.exp(-dtc / 0.3);
  const lamp = ss(t, XRAY_CHANGE_T - 0.02, XRAY_CHANGE_T + 0.03);
  const beam = 0.25 + 0.75 * flare;
  // the stomach: established in the full profile, then brought forward as the camera pushes toward it
  const stomA = ss(t, 4.62, 4.98);
  const toStom = ss(t, XRAY_PUSH0 + 0.05, XRAY_PUSH1 + 0.15);
  const id = {fClip: uid('xFieldClip'), oClip: uid('xOutClip'), sh: uid('xShadow'), vig: uid('xVig'), fl: uid('xFlash')};
  const F = FIELD;
  const fieldD = `M${F.x0} ${F.y0}H${F.x1}V${F.y1}H${F.x0}Z`;
  const outD = `M-2000 -2000H2000V2000H-2000Z${fieldD}`;
  const fishT = `translate(${n4(fx)} ${n4(fy)})`;
  const ST = STOMACH;
  const vr = ST.ry * 1.9;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, background: LAB}}>
      <defs>
        <clipPath id={id.fClip}>
          <path d={fieldD} />
        </clipPath>
        <clipPath id={id.oClip}>
          <path d={outD} clipRule="evenodd" fillRule="evenodd" />
        </clipPath>
        <radialGradient id={id.sh} gradientUnits="userSpaceOnUse" cx={fx - 6} cy={TANK.floor + 0.6} r={44} gradientTransform={`translate(${n4(fx - 6)} ${TANK.floor + 0.6}) scale(1 0.09) translate(${n4(-(fx - 6))} ${-(TANK.floor + 0.6)})`}>
          <stop offset="0" stopColor={C.bedShadow} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.bedShadow} stopOpacity={0} />
        </radialGradient>
        {flash > 0.005 && (
          <linearGradient id={id.fl} gradientUnits="userSpaceOnUse" x1={FIELD.x1} y1="0" x2={FIELD.x0} y2="0">
            <stop offset="0" stopColor={C.xrayEdge} stopOpacity={0.42 * flash} />
            <stop offset="0.3" stopColor={C.xrayEdge} stopOpacity={0.16 * flash} />
            <stop offset="1" stopColor={C.xrayEdge} stopOpacity={0.07 * flash} />
          </linearGradient>
        )}
        {toStom > 0.001 && (
          <radialGradient id={id.vig} gradientUnits="userSpaceOnUse" cx={ST.c.x} cy={ST.c.y} r={vr} gradientTransform={`translate(${ST.c.x} ${ST.c.y}) scale(${(ST.rx / ST.ry) * 0.92} 1) translate(${-ST.c.x} ${-ST.c.y})`}>
            <stop offset="0" stopColor={C.xrayBg0} stopOpacity={0} />
            <stop offset="0.5" stopColor={C.xrayBg0} stopOpacity={0} />
            <stop offset="0.68" stopColor={C.xrayBg0} stopOpacity={0.38 * toStom} />
            <stop offset="1" stopColor={C.xrayBg0} stopOpacity={0.62 * toStom} />
          </radialGradient>
        )}
      </defs>
      <g transform={camT(c, 160)}>
        <LabBack />
      </g>
      <g transform={camT(c, 0)}>
        {/* the emitter's gantry arm (up out of frame) and the bench under the detector */}
        <rect x={-5} y={-420} width={10} height={420 + EMIT.y0 - 10} fill={METAL_SH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
        <rect x={-5} y={-420} width={2.6} height={420 + EMIT.y0 - 10} fill={METAL_LIT} fillOpacity={0.45} />
        <Bench />
        {/* the tank outside the field */}
        <g clipPath={`url(#${id.oClip})`}>
          <TankBack t={t} />
          <rect x={TANK.x0} y={TANK.floor - 2} width={TANK.x1 - TANK.x0} height={5} fill={`url(#${id.sh})`} />
          <g transform={fishT}>
            <FishFar s={s} />
            <FishBody s={s} />
            <GillGap s={s} />
            <Operculum s={s} />
            <Pectoral s={s} />
          </g>
          <TankTrims />
        </g>
        {/* the field: the radiograph */}
        <g clipPath={`url(#${id.fClip})`}>
          <FieldGround flash={flash} />
          <g transform={fishT}>
            <XRayBack s={s} />
            {stomA > 0.001 && (
              <g>
                <ellipse cx={ST.c.x} cy={ST.c.y} rx={ST.rx} ry={ST.ry} fill={C.xrayFlesh} fillOpacity={0.08 * stomA + 0.08 * toStom} />
                <ellipse cx={ST.c.x} cy={ST.c.y} rx={ST.rx} ry={ST.ry} fill="none" stroke={C.xrayEdge} strokeOpacity={0.22 * stomA + 0.2 * toStom} strokeWidth={1.6} vectorEffect={NS} />
              </g>
            )}
            <XRayFront s={s} opacity={0.8 - 0.2 * toStom} />
            {toStom > 0.001 && <rect x={-80} y={-60} width={160} height={120} fill={`url(#${id.vig})`} />}
            <XRayEel pts={pts} t={t} glow={1} tail={toStom} />
            <XRayFront s={s} opacity={0.16 * (1 - 0.5 * toStom)} />
          </g>
          {flash > 0.005 && <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={F.y1 - F.y0} fill={`url(#${id.fl})`} />}
        </g>
        <FieldEdges flare={flare} />
        {/* the housings frame the field: the emitter (with its tube) above the tank, the detector below it */}
        <Housing {...EMIT} depth={5} kind="emitter" lamp={lamp} beam={beam} />
        <Housing {...DETECT} depth={5} kind="detector" lamp={lamp} beam={beam} />
      </g>
    </svg>
  );
};
