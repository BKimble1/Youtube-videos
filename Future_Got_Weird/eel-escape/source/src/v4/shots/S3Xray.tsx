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
import {CARRY0, CARRY1, CARRY_PX, carryTail, KeepOut} from '../timing';

// ---------------------------------------------------------------- beats
/** the snout crosses the field's right edge: the beam catches (flash, edge flare, lamp). The sound goes here. */
export const XRAY_CHANGE_T = 4.0;
/** the whole fish (caudal tip included) is inside the field */
export const XRAY_ALL_IN_T = 4.86;
/** the full skeletal profile holds (on "X-ray", 4.94) until the push toward the stomach begins */
export const XRAY_PUSH0 = 5.12;
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
const FIELD = {x0: -58, x1: 58, y0: -58, y1: 27};
const TANK = {x0: -170, x1: 260, rim: -52, water: -45, floor: 16.5, bottom: 22, base: 26};
const EMIT = {x0: -64, x1: 64, y0: -84, y1: -58};
const DETECT = {x0: -64, x1: 64, y0: 27, y1: 38};
const BENCH_Y = 38;

// ---------------------------------------------------------------- the fish's glide
/** the fish's frame origin in tank units: it glides in from the right at ~130 u/s and coasts to rest at x = 0 */
const V_GLIDE = 130;
const GLIDE_STOP = 5.1;
const DECEL0 = 4.5;
const SNOUT_X = -51.2;
export const fishX = (t: number) => {
  // constant speed until DECEL0, then a linear deceleration to rest at GLIDE_STOP; position anchored so the snout
  // reaches the field edge at XRAY_CHANGE_T
  const dDec = (V_GLIDE * (GLIDE_STOP - DECEL0)) / 2;
  const xRest = 0;
  const xDec0 = xRest + dDec;
  if (t >= GLIDE_STOP) return xRest;
  if (t >= DECEL0) {
    const u = GLIDE_STOP - t;
    return xRest + (V_GLIDE * u * u) / (2 * (GLIDE_STOP - DECEL0));
  }
  return xDec0 + V_GLIDE * (DECEL0 - t);
};
// the snout crossing time follows from the glide (checked in the report); keep XRAY_CHANGE_T in step with it
const fishY = (t: number) => 0.25 * Math.sin(2 * Math.PI * 0.45 * (t - 3.6)) * (1 - ss(t, 4.6, 5.1));

const lookFor = (t: number): FishLook => ({
  t,
  gill: 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.9 * (t - 3.5))),
  finPhase: 2 * Math.PI * (1.6 * (t - 3.0) - 0.7 * ss(t, 4.6, 5.2)),
  startle: 0,
  prop: 0,
  look: 0,
});

// ---------------------------------------------------------------- the eel in the stomach (fish units)
const I0 = Math.round(N * (1 - 12 / EEL_L)); // = carryTail's i0
const SEG_B = EEL_L / N; // body sample spacing
const SEG_T = 12 / (N - I0); // the carried tail's sample spacing
/** the tail's root (sample I0) in fish units, fixed in the stomach */
const A_W: P = pt(-0.6, 7.0);
/** the body route from the tail's root back toward the head (control points, fish units): down-right along the
 *  stomach floor, up round its blind end, forward along its roof, a hairpin down, and back toward the blind end,
 *  so the head lies deepest with the eye toward the fish's tail */
const ROUTE_CP: P[] = [
  A_W,
  pt(1.6, 8.45),
  pt(4.0, 9.0),
  pt(6.2, 8.15),
  pt(7.7, 6.35),
  pt(8.15, 4.35),
  pt(7.55, 2.35),
  pt(5.7, 0.75),
  pt(2.8, -0.35),
  pt(-0.6, -0.75),
  pt(-3.3, -0.2),
  pt(-4.4, 1.5),
  pt(-3.1, 3.0),
  pt(-0.4, 3.45),
  pt(2.4, 4.1),
  pt(4.6, 4.9),
  pt(6.6, 5.0),
  pt(8.6, 4.9),
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
/** the carried tail's root on screen, extrapolated (carryTail clamps its clock before CARRY0 - 0.2) */
const carryRoot = (t: number): P => {
  const a = carryTail(CLAMP0).pts[0], b = carryTail(CLAMP0 + 0.1).pts[0];
  const tc = Math.min(t, CARRY1 + 0.2);
  return pt(a.x + ((b.x - a.x) / 0.1) * (tc - CLAMP0), a.y + ((b.y - a.y) / 0.1) * (tc - CLAMP0));
};

/** the tail's own stirring before the hand-off: a slow sweep and a wave running to the tip (headings, rad) */
const ownHeadings = (t: number): number[] => {
  const n = N - I0;
  const out: number[] = [];
  const sweep = 0.2 * Math.sin(2 * Math.PI * 0.75 * (t - 3.9)) + 0.08 * noise1(t * 1.3, 4);
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * SEG_T;
    const f = a / 12;
    out.push((-150 * Math.PI) / 180 - 0.04 * a + sweep * Math.pow(f, 1.2) + 0.3 * Math.sin(2 * Math.PI * (1.5 * t - a / 8.5)) * f);
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
/** the establishing → full-profile camera (tank units) */
const camBase = (t: number): Cam => {
  const u = ss5(t, 3.78, 4.98);
  const drift = ss(t, 4.9, 5.7);
  return {
    x: lerp(52, 0, u) - 0.6 * (t - 3.6),
    y: lerp(-24, -7.5, u),
    s: LOGS(5.2, 8.75, u) * (1 + 0.04 * drift) * (1 + 0.012 * (t - 3.6)),
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
  // the gill gap shows only while the head is still outside the field (the exterior)
  const out: KeepOut = {eel: e};
  if (fx + SNOUT_X > FIELD.x1 - 30) {
    const G = opercGeom(lookFor(t));
    out.gap = G.gap.map((p) => toScreen(c, pt(p.x + fx, p.y + fy)));
  }
  return out;
};

// ---------------------------------------------------------------- the radiograph eel
const RX = EEL_R_MAX;
const scaleR = (k: number, add0 = 0) => RADII.map((r) => r * k + add0 * (r / RX));
/** the eel's centreline frame: unit tangents and left normals */
const frame = (pts: P[]) =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tg = nrm(sub(b, a));
    return {tg, n: perp(tg)};
  });
const XRayEel: React.FC<{pts: P[]; t: number; glow: number}> = ({pts, t, glow}) => {
  const F = frame(pts);
  // the glow and the body, as nested silhouettes (thickest at the centreline, as a cylinder shows on a radiograph)
  const halo2 = eelSilhouette(pts, scaleR(2.1, 0.5));
  const halo1 = eelSilhouette(pts, scaleR(1.45, 0.15));
  const body = eelSilhouette(pts, RADII);
  const mid = eelSilhouette(pts, scaleR(0.68));
  const core = eelSilhouette(pts, scaleR(0.36));
  const fin = eelSilhouette(pts, RADII, Math.round(N * 0.38), N, true, t, 1, 0.05);
  // the vertebral column: from behind the skull to near the tip, in short chunks that thin with the body
  const spine: {d: string; w: number}[] = [];
  const i0 = Math.round(N * 0.085);
  const i1 = Math.round(N * 0.975);
  for (let i = i0; i < i1; i += 6) {
    const j = Math.min(i1, i + 6);
    spine.push({d: open(pts.slice(i, j + 1), 0.5), w: 0.3 * RADII[Math.round((i + j) / 2)]});
  }
  // the skull: a dense lens over the head (snout → the neck), broader than the body behind it
  const nSk = Math.round(N * 0.1);
  const skW = (i: number) => {
    const u = i / N;
    const prof = u < 0.012 ? 0.45 + 0.35 * (u / 0.012) : u < 0.06 ? 0.8 + 0.08 * Math.sin(((u - 0.012) / 0.048) * Math.PI) : 0.8 * (1 - ss(u, 0.06, 0.1)) + 0.28;
    return RADII[i] * prof;
  };
  const skL: P[] = [], skR: P[] = [];
  for (let i = 0; i <= nSk; i++) {
    skL.push(add(pts[i], mul(F[i].n, skW(i))));
    skR.push(add(pts[i], mul(F[i].n, -skW(i))));
  }
  const snout = add(pts[0], mul(F[0].tg, -0.35));
  const skull = closed([snout, ...skL.slice(1), ...[...skR.slice(1)].reverse()], 0.9);
  // jaws: two dense lines from the snout tip back along the lower side
  const jawA = open([add(snout, mul(F[0].n, -0.15)), ...[2, 5, 8].map((i) => add(pts[i], mul(F[i].n, -RADII[i] * 0.55)))], 1);
  const jawB = open([add(snout, mul(F[0].n, 0.1)), ...[2, 4, 6].map((i) => add(pts[i], mul(F[i].n, -RADII[i] * 0.05)))], 1);
  // the eye: a bright bony ring (the orbit) round a darker eyeball with a dense lens
  const ie = Math.round(N * 0.03);
  const eyeR = 0.42 * EYE_SCALE;
  const ec = add(pts[ie], mul(F[ie].n, RADII[ie] * 0.18));
  // the pectoral girdle: a bright arc across the body just behind the head
  const ig = Math.round(N * 0.1);
  const gir = open([add(pts[ig], mul(F[ig].n, RADII[ig] * 0.95)), add(pts[ig + 1], mul(F[ig].n, 0)), add(pts[ig], mul(F[ig].n, -RADII[ig] * 0.95))], 1);
  return (
    <g>
      <path d={halo2} fill={EEL_HALO} fillOpacity={0.09 * glow} />
      <path d={halo1} fill={EEL_HALO} fillOpacity={0.16 * glow} />
      <path d={fin} fill={EEL_HALO} fillOpacity={0.16} />
      <path d={body} fill={EEL_BODY} fillOpacity={0.5} />
      <path d={mid} fill={EEL_BODY} fillOpacity={0.45} />
      <path d={core} fill={EEL_CORE} fillOpacity={0.4} />
      <path d={body} fill="none" stroke={EEL_CORE} strokeOpacity={0.55} strokeWidth={1.2} vectorEffect={NS} />
      {spine.map((sg, k) => (
        <path key={k} d={sg.d} fill="none" stroke={EEL_BONE} strokeOpacity={0.75} strokeWidth={sg.w} strokeDasharray="0.3 0.14" />
      ))}
      <path d={skull} fill={EEL_BONE} fillOpacity={0.62} stroke={EEL_BONE} strokeOpacity={0.9} strokeWidth={0.12} />
      <path d={jawA + jawB} fill="none" stroke={EEL_BONE} strokeOpacity={0.95} strokeWidth={0.13} strokeLinecap="round" />
      <path d={gir} fill="none" stroke={EEL_BONE} strokeOpacity={0.7} strokeWidth={0.16} strokeLinecap="round" />
      <circle cx={ec.x} cy={ec.y} r={eyeR * 0.9} fill={C.xrayBg0} fillOpacity={0.75} />
      <circle cx={ec.x} cy={ec.y} r={eyeR * 0.92} fill="none" stroke={EEL_BONE} strokeWidth={0.2} />
      <circle cx={ec.x - 0.08} cy={ec.y - 0.06} r={eyeR * 0.3} fill={EEL_BONE} fillOpacity={0.95} />
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

/** the dark lab behind the tank (drawn on a far layer) */
const LabBack: React.FC = () => (
  <g>
    {/* faint wall panels and a bench-height shelf of equipment silhouettes */}
    <rect x={-600} y={-400} width={1300} height={800} fill={LAB} />
    {[-300, -180, -60, 60, 180, 300, 420].map((x, i) => (
      <rect key={i} x={x} y={-260} width={112} height={250} fill={LAB_DEEP} fillOpacity={0.35} />
    ))}
    <rect x={-600} y={-12} width={1300} height={60} fill={LAB_DEEP} fillOpacity={0.5} />
  </g>
);

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

/** a boxy housing: front face, lit top face, the shadowed underside, ink; light from the upper left */
const Housing: React.FC<{x0: number; x1: number; y0: number; y1: number; depth: number; aperture: 'down' | 'up'; lamp: number}> = ({x0, x1, y0, y1, depth, aperture, lamp}) => {
  const top = poly([pt(x0, y0), pt(x0 + depth, y0 - depth * 0.55), pt(x1 + depth, y0 - depth * 0.55), pt(x1, y0)]);
  const side = poly([pt(x1, y0), pt(x1 + depth, y0 - depth * 0.55), pt(x1 + depth, y1 - depth * 0.55), pt(x1, y1)]);
  const h = y1 - y0;
  const ap = aperture === 'down' ? {y: y1 - 1.6, h: 1.6} : {y: y0, h: 1.6};
  const vents = Array.from({length: 7}, (_, i) => x0 + 8 + i * 2.6);
  return (
    <g>
      <path d={top} fill={METAL_LIT} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <path d={side} fill={METAL_SH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <rect x={x0} y={y0} width={x1 - x0} height={h} fill={METAL} />
      {/* a soft core shadow toward the lower right of the front face */}
      <rect x={x0} y={y0 + h * 0.62} width={x1 - x0} height={h * 0.38} fill={METAL_SH} fillOpacity={0.55} />
      <rect x={x0} y={y0} width={x1 - x0} height={0.9} fill={METAL_LIT} fillOpacity={0.8} />
      {/* the aperture strip (the beam window) */}
      <rect x={x0 + 4} y={ap.y} width={x1 - x0 - 8} height={ap.h} fill={METAL_DEEP} />
      <rect x={x0 + 4} y={ap.y + (aperture === 'down' ? ap.h - 0.5 : 0)} width={x1 - x0 - 8} height={0.5} fill={C.xrayEdge} fillOpacity={0.25 + 0.6 * lamp} />
      {/* vents and a panel seam */}
      {vents.map((x, i) => (
        <rect key={i} x={x} y={y0 + h * 0.25} width={1.1} height={h * 0.32} rx={0.5} fill={METAL_DEEP} fillOpacity={0.8} />
      ))}
      <path d={`M${x1 - 26} ${y0 + 1.2}V${y1 - 2.2}`} stroke={METAL_DEEP} strokeWidth={1.2} vectorEffect={NS} strokeOpacity={0.7} />
      {/* the indicator lamp (lights when the beam catches) */}
      <circle cx={x1 - 14} cy={y0 + h * 0.4} r={1.3} fill={mix(METAL_DEEP, LAMP, 0.25 + 0.75 * lamp)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
      {lamp > 0.02 && <circle cx={x1 - 14} cy={y0 + h * 0.4} r={3.2} fill={LAMP} fillOpacity={0.22 * lamp} />}
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
            <rect key={i} x={x - s.w / 2} y={F.y0} width={s.w} height={F.y1 - F.y0} fill={C.xrayEdge} fillOpacity={Math.min(1, s.a * (1 + 2.6 * flare * (k === 1 ? 1 : 0.5)))} />
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
  // the beam catches as the snout crosses the edge: a flash decaying over ~0.35 s
  const flash = t < XRAY_CHANGE_T ? 0 : Math.exp(-(t - XRAY_CHANGE_T) / 0.16);
  const lamp = ss(t, XRAY_CHANGE_T - 0.02, XRAY_CHANGE_T + 0.04);
  // the stomach is brought forward as the camera pushes toward it
  const toStom = ss(t, XRAY_PUSH0 - 0.1, XRAY_PUSH1);
  const id = {fClip: uid('xFieldClip'), oClip: uid('xOutClip'), sh: uid('xShadow')};
  const F = FIELD;
  const fieldD = `M${F.x0} ${F.y0}H${F.x1}V${F.y1}H${F.x0}Z`;
  const outD = `M-2000 -2000H2000V2000H-2000Z${fieldD}`;
  const fishT = `translate(${n4(fx)} ${n4(fy)})`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, background: LAB}}>
      <defs>
        <clipPath id={id.fClip}>
          <path d={fieldD} />
        </clipPath>
        <clipPath id={id.oClip}>
          <path d={outD} clipRule="evenodd" fillRule="evenodd" />
        </clipPath>
        <radialGradient id={id.sh} gradientUnits="userSpaceOnUse" cx={fx - 6} cy={TANK.floor + 0.6} r={44} gradientTransform={`translate(${fx - 6} ${TANK.floor + 0.6}) scale(1 0.09) translate(${-(fx - 6)} ${-(TANK.floor + 0.6)})`}>
          <stop offset="0" stopColor={C.bedShadow} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.bedShadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={camT(c, 160)}>
        <LabBack />
      </g>
      <g transform={camT(c, 0)}>
        {/* the emitter's mount (a gantry arm up out of frame) and the bench under the detector */}
        <rect x={-6} y={-400} width={12} height={400 + EMIT.y0} fill={METAL_SH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
        <rect x={-6} y={-400} width={3} height={400 + EMIT.y0} fill={METAL_LIT} fillOpacity={0.5} />
        <rect x={-400} y={BENCH_Y} width={900} height={4} fill={BENCH} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
        <rect x={-400} y={BENCH_Y} width={900} height={1} fill={METAL_LIT} fillOpacity={0.6} />
        <rect x={-400} y={BENCH_Y + 4} width={900} height={300} fill={LAB_DEEP} />
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
            {toStom > 0.001 && (
              <ellipse cx={STOMACH.c.x} cy={STOMACH.c.y} rx={STOMACH.rx} ry={STOMACH.ry} fill={C.xrayFlesh} fillOpacity={0.1 * toStom} stroke={C.xrayEdge} strokeOpacity={0.3 * toStom} strokeWidth={0.25} />
            )}
            <XRayFront s={s} opacity={0.8} />
            <XRayEel pts={pts} t={t} glow={1} />
            <XRayFront s={s} opacity={0.18} />
          </g>
          {flash > 0.005 && <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={F.y1 - F.y0} fill={C.xrayEdge} fillOpacity={0.3 * flash} />}
        </g>
        <FieldEdges flare={flash} />
        {/* the housings frame the field: the emitter above the tank, the detector below it */}
        <Housing {...EMIT} depth={5} aperture="down" lamp={lamp} />
        <Housing {...DETECT} depth={5} aperture="up" lamp={lamp} />
      </g>
    </svg>
  );
};
void CARRY1;
void clamp;
