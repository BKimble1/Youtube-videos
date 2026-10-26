// The future rubble route at insect scale (the proposed rescue application): a low passage under a collapsed floor slab
// that opens into the daylit alcove where the trapped person lies. Everything is projected 3D geometry (world mm, floor
// y = 0) in the Weird Crew finish: ink contours, gradient fills from the fixed upper-left key light (rig/Gear lightW),
// plus a local light field (a daylight shaft through a crack, the alcove's glow) that keeps the passage dim and the
// alcove bright. Concrete pieces are prisms (irregular outline, inset top) with chipped edges and aggregate speckle
// anchored to their faces, so they hold up under a travelling camera; rebar is rusty ribbed bar; the floor carries light
// pools, grit and pebbles; dust motes drift slowly in the shafts. Palette = the alcove's ALC (sets/Alcove.tsx).
//
// World layout. The route is laid out in ROUTE coordinates (a, b, y): `a` along the route (positive = forward, toward the
// person), `b` across it (positive = to the right when facing forward), y up; rw(a, b, y) converts to world. The route is
// the alcove walk's line (shots/alcoveWorld.ts WALK_DIR): it runs through the GAP (a = 0, Alcove.tsx ALCOVE.gap) to her
// near fingertips (a = 330, ALCOVE.tips). The passage lies before the gap (a < 0): a low passage (the camera's) under a
// fallen slab whose lip is at a = LIP_A, then an open, daylit forecourt up to the gap. The person lies prone along world x,
// head toward +x, elbow midpoint at the world origin (left of the route, facing across it toward screen-right in S12).
// The numbers below copy Alcove.tsx (ALCOVE.gap, .tips, .sun) so the set never depends on that file at load time; S12
// checks in dev that they still agree.
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, Frame, add, sub, mul, dot, norm, cross, toW, toL, dirW, len, ypr} from '../lib/v3';
import {fmt, polyPath, convexHull, closedPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {clamp, rnd, noise1} from '../lib/ease';
import {lightW} from '../rig/Gear';

// ---------------------------------------------------------------------------------------------------------------
// Palette, daylight, route frame, the person's anchors
// ---------------------------------------------------------------------------------------------------------------
export const RUB = {
  concrete: '#9C9590',
  concreteDeep: '#7E7772',
  concreteLight: '#B8B0A6',
  crevice: '#3A3633',
  /** the deepest gaps: very dark warm, never black */
  void: '#241E1B',
  floor: '#A59C92',
  floorDeep: '#8C847B',
  rebar: '#8A4B2E',
  rebarLight: '#C07A52',
  rebarDeep: '#5B2F1E',
  dust: '#C9BFAF',
  day: '#FFE8B8',
  dayHot: '#FFF6E2',
};
/** the daylight's direction of travel (world) = Alcove.tsx ALCOVE.sun: down, from above-right in the S12 route view (and
 *  from above-right and behind in the S13 view) */
export const DAY: V3 = norm([-0.45, -1, -0.25]);
/** Alcove.tsx ALCOVE.gap and ALCOVE.tips (her near fingertips) */
export const GAP: V3 = [335, 0, 360];
export const TIPS: V3 = [255, 0, 40];
/** route forward (unit, world: from the gap toward her fingertips) and route right */
export const RF: V3 = norm([TIPS[0] - GAP[0], 0, TIPS[2] - GAP[2]]);
export const RR: V3 = [-RF[2], 0, RF[0]];
/** route coordinates -> world */
export const rw = (a: number, b: number, y = 0): V3 => [GAP[0] + RF[0] * a + RR[0] * b, y, GAP[2] + RF[2] * a + RR[2] * b];
/** world -> route coordinates [a, b, y] */
export const toRoute = (p: V3): V3 => {
  const d = sub(p, GAP);
  return [dot(d, RF), dot(d, RR), p[1]];
};
/** yaw (rig/roach convention: 0 = +x, body z = right) of an insect walking along the route (= the alcove walk's yaw) */
export const ROUTE_YAW = Math.atan2(-RF[2], RF[0]);

/** The trapped person (world mm). She lies PRONE along world x, propped on her forearms, head toward +x, facing +x
 *  (across the S12 route view toward screen-right, i.e. toward the gap the insect comes through). Values follow the Weird
 *  Crew survivor rig (crew/person/survivorRig.ts, 1 u = 3.745 mm) placed as Alcove.tsx places her (anchor = the floor
 *  point midway between her elbows = world origin): elbows on the floor at z = +-217 (right elbow +z), shoulders ~367 mm
 *  up and 45 mm behind the elbows, head centre ~640 mm up (radius ~217 mm), near fingertips at TIPS. `clear` is the
 *  volume S12 keeps free for her. */
export const PERSON = {
  anchor: [0, 0, 0] as V3,
  facing: [1, 0, 0] as V3,
  tips: TIPS,
  head: [60, 640, 0] as V3,
  headR: 217,
  shoulders: [[-45, 367, 232], [-45, 367, -232]] as V3[],
  elbows: [[0, 56, 217], [0, 56, -217]] as V3[],
  wrists: [[200, 56, 60], [190, 56, -40]] as V3[],
  pelvis: [-375, 100, 0] as V3,
  clear: {x: [-1200, 330], y: [0, 870], z: [-330, 330]},
  mmPerU: 3.745,
};
// ---------------------------------------------------------------------------------------------------------------
// Light field: ambient + daylight beams (through cracks) + glows. Values ~0 (dark crevice) .. 1 (fully lit) .. >1 (sun).
// ---------------------------------------------------------------------------------------------------------------
export type Beam = {key: string; crack: V3[]; dir?: V3; k: number; r?: number};
export type Glow = {p: V3; r: number; k: number};
export type Lights = {amb: number; beams: Beam[]; glows: Glow[]};
const cen3 = (ps: V3[]): V3 => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / ps.length);
const beamR = (b: Beam) => b.r ?? Math.max(...b.crack.map((p) => len(sub(p, cen3(b.crack))))) * 0.8;
/** 0..k: how much of the beam's light reaches p (gaussian across the axis, zero above the crack) */
export const beamAt = (b: Beam, p: V3) => {
  const d = sub(p, cen3(b.crack));
  const dir = b.dir ?? DAY;
  const t = dot(d, dir);
  if (t < -10) return 0;
  const perp = len(sub(d, mul(dir, t)));
  const r = beamR(b);
  return b.k * Math.exp(-((perp / r) ** 2) * 1.3) * clamp((t + 10) / 30);
};
export const lightAt = (L: Lights, p: V3) => {
  let l = L.amb;
  for (const b of L.beams) l += beamAt(b, p);
  for (const g of L.glows) l += g.k * Math.exp(-((len(sub(p, g.p)) / g.r) ** 2));
  return l;
};
const sunAt = (L: Lights, p: V3) => L.beams.reduce((s, b) => s + beamAt(b, p), 0);

/** colour of a surface with normal n at p: key light (upper-left, Weird Crew) times the local exposure, daylight warmth */
export const toneAt = (base: string, n: V3, p: V3, cam: Cam, L: Lights) => {
  const k = dot(n, lightW(cam));
  let c = k >= 0 ? lit(base, 0.3 * k) : shade(base, -0.46 * k);
  const l = lightAt(L, p);
  c = mix(RUB.void, c, clamp(0.1 + 0.9 * Math.min(1.05, l)));
  // light from the alcove and the open corridor is warm daylight
  if (l > 0.45) c = mix(c, '#E8D2B0', clamp((l - 0.45) * 0.35, 0, 0.18));
  const s = sunAt(L, p) * clamp(0.35 + 0.65 * dot(n, mul(DAY, -1)));
  if (s > 0.01) c = mix(c, RUB.dayHot, clamp(s * 0.42, 0, 0.62));
  return c;
};

// ---------------------------------------------------------------------------------------------------------------
// Near-plane clip that keeps world points (for gradients sampled in the world)
// ---------------------------------------------------------------------------------------------------------------
const NEAR = 3;
const clipW = (cam: Cam, pts: V3[]): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = depth(cam, a) - NEAR, db = depth(cam, b) - NEAR;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
};
const onScreen = (q: V2[], m = 60) => {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of q) (x0 = Math.min(x0, p[0])), (x1 = Math.max(x1, p[0])), (y0 = Math.min(y0, p[1])), (y1 = Math.max(y1, p[1]));
  return x1 > -m && x0 < 1080 + m && y1 > -m && y0 < 1920 + m;
};
export const inkWAt = (cam: Cam, p: V3, k = 0.22) => clamp(scaleAt(cam, p) * k, 0.7, 3.4);

// ---------------------------------------------------------------------------------------------------------------
// Concrete pieces: prisms (an outline in local x-z extruded along local y, the top an inset copy) with chipped edges
// and aggregate speckle. Non-convex outlines (jagged broken slab edges) are drawn side faces far-to-near, then the cap.
// ---------------------------------------------------------------------------------------------------------------
export type ChunkDef = {
  key: string;
  /** base centre, route coordinates (a, b, y) unless `w` is given */
  a?: number;
  b?: number;
  y?: number;
  /** base centre in world coordinates (overrides a, b, y) */
  w?: V3;
  /** yaw relative to the route (rad; or to world +x when `w` is given), pitch (nose up), roll (right side down) */
  yaw?: number;
  pitch?: number;
  roll?: number;
  /** explicit outline (local x forward, z right); otherwise generated from rx, rz, n, seed */
  outline?: [number, number][];
  rx?: number;
  rz?: number;
  n?: number;
  /** outline jaggedness (0 = convex hull of the jittered ring; > 0 keeps a ragged, non-convex edge) */
  jag?: number;
  h: number;
  /** top inset (1 = straight sides) and shift */
  k?: number;
  shift?: [number, number];
  seed: number;
  tone?: string;
  /** speckle density multiplier (0 = none) */
  tex?: number;
  /** number of chips along the cap edges */
  chips?: number;
  /** formwork board lines on the caps (slab undersides): spacing in mm along local z */
  boards?: number;
  /** draw the end caps (false for pieces stacked into one slab, whose caps are internal) */
  caps?: boolean;
  /** a broken, slanted top: the top's height changes by tilt[0] per mm of local x and tilt[1] per mm of local z */
  tilt?: [number, number];
  /** probability of a crack line drawn across each side face */
  cracks?: number;
  /** speckle budget per face (default 900) */
  speckMax?: number;
  /** size multiplier for the aggregate (smooth formed faces: < 1) */
  speckScale?: number;
};

type Speck = {p: V3; r: number; c: number};
type FaceL = {pts: V3[]; n: V3; specks: Speck[]; cap: 'top' | 'bot' | null; chips: V3[][]; boards: V3[][]; crack: V3[] | null};
type ChunkGeo = {faces: FaceL[]; h: number; base: V3[]};
const GEO = new Map<string, ChunkGeo>();

const polyArea2 = (p: [number, number][]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const inPoly2 = (q: [number, number], poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1] + 1e-12) + a[0]) c = !c;
  }
  return c;
};
/** an irregular outline: a jittered ring (convex hull unless jag > 0) */
export const ringOutline = (rx: number, rz: number, n: number, seed: number, jag = 0): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5 * (rnd(i, seed) - 0.5)) / n) * Math.PI * 2;
    const r = 1 - 0.22 * rnd(i, seed + 7) - jag * rnd(i, seed + 13);
    pts.push([rx * r * Math.cos(a), rz * r * Math.sin(a)]);
  }
  if (jag > 0) return pts;
  return convexHull(pts.map((p) => [p[0], p[1]] as V2)).map((p) => [p[0], p[1]] as [number, number]);
};

const SPECK_MAX = 900;
const buildGeo = (d: ChunkDef): ChunkGeo => {
  let out = d.outline ?? ringOutline(d.rx ?? 20, d.rz ?? 20, d.n ?? 8, d.seed, d.jag ?? 0);
  if (polyArea2(out) < 0) out = [...out].reverse();
  const n = out.length;
  const cx = out.reduce((s, p) => s + p[0], 0) / n, cz = out.reduce((s, p) => s + p[1], 0) / n;
  const k = d.k ?? 0.86, [sx, sz] = d.shift ?? [0, 0];
  const B: V3[] = out.map(([x, z]) => [x, 0, z]);
  const [tx, tz] = d.tilt ?? [0, 0];
  const T: V3[] = out.map(([x, z]) => {
    const X = cx + k * (x - cx) + sx, Z = cz + k * (z - cz) + sz;
    return [X, Math.max(d.h * 0.25, d.h + tx * (X - cx) + tz * (Z - cz)), Z];
  });
  const dens = (d.tex ?? 1) * 0.07; // speckles per mm^2 (before the cap)
  let sid = 0;
  const specks = (area: number, sample: (i: number) => V3 | null): Speck[] => {
    const N = Math.min(d.speckMax ?? SPECK_MAX, Math.round(area * dens));
    const s: Speck[] = [];
    for (let i = 0; i < N * 1.6 && s.length < N; i++) {
      const p = sample(i);
      if (!p) continue;
      const q = rnd(i, d.seed * 3.1 + sid);
      const big = q > 0.86;
      const sc = d.speckScale ?? 1;
      s.push({p, r: sc * (big ? 0.55 + 1.3 * rnd(i, d.seed + sid + 5) : 0.18 + 0.32 * rnd(i, d.seed + sid + 9)), c: big ? (q > 0.95 ? 2 : 1) : 0});
    }
    sid += 17;
    // pits first, so aggregate stones sit over them
    return s.sort((p, q) => (p.c === 0 ? 0 : 1) - (q.c === 0 ? 0 : 1));
  };
  const faces: FaceL[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pts = [B[i], B[j], T[j], T[i]];
    let nn = norm(cross(sub(B[j], B[i]), sub(T[i], B[i])));
    const e = [out[j][0] - out[i][0], out[j][1] - out[i][1]];
    const o2: [number, number] = [e[1], -e[0]]; // outward in x-z for a positive-area outline
    if (nn[0] * o2[0] + nn[2] * o2[1] < 0) nn = mul(nn, -1);
    const L = Math.hypot(e[0], e[1]);
    const area = L * d.h;
    const sp = specks(area, (m) => {
      const u = 0.04 + 0.92 * rnd(m, d.seed + i * 7.7), v = 0.05 + 0.9 * rnd(m, d.seed + i * 3.3 + 1);
      const p0 = add(B[i], mul(sub(B[j], B[i]), u)), p1 = add(T[i], mul(sub(T[j], T[i]), u));
      return add(p0, mul(sub(p1, p0), v));
    });
    // a crack wandering across the face, sometimes
    let crack: V3[] | null = null;
    if (rnd(i, d.seed + 31) < (d.cracks ?? 0.3) && area > 300) {
      const at = (u: number, v: number) => {
        const p0 = add(B[i], mul(sub(B[j], B[i]), u)), p1 = add(T[i], mul(sub(T[j], T[i]), u));
        return add(p0, mul(sub(p1, p0), v));
      };
      // from the top edge, running down and sideways (a broken corner's fracture), 3-4 kinks
      const dir = rnd(i, d.seed + 35) > 0.5 ? 1 : -1;
      const u0 = dir > 0 ? 0.1 + 0.3 * rnd(i, d.seed + 32) : 0.6 + 0.3 * rnd(i, d.seed + 32), v0 = 0.97;
      crack = [at(u0, v0)];
      let u = u0, v = v0;
      const nk = 3 + Math.floor(rnd(i, d.seed + 36) * 2);
      for (let m = 0; m < nk; m++) {
        u = Math.min(0.94, Math.max(0.06, u + dir * (0.08 + 0.14 * rnd(m + i * 5, d.seed + 33))));
        v -= 0.07 + 0.12 * rnd(m + i * 5, d.seed + 34);
        crack.push(at(u, Math.max(0.05, v)));
      }
    }
    faces.push({pts, n: nn, specks: sp, cap: null, chips: [], boards: [], crack});
  }
  const capY = (P: V3[], q: [number, number]) => {
    // height of the (planar) cap at local (x, z): from its first three corners
    const [a, b, c] = [P[0], P[1], P[2 % P.length]];
    const n2 = cross(sub(b, a), sub(c, a));
    if (Math.abs(n2[1]) < 1e-9) return a[1];
    return a[1] - (n2[0] * (q[0] - a[0]) + n2[2] * (q[1] - a[2])) / n2[1];
  };
  const capSpecks = (P: V3[], y: number, seed: number) => {
    const xs = P.map((p) => p[0]), zs = P.map((p) => p[2]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const poly = P.map((p) => [p[0], p[2]] as [number, number]);
    const area = Math.abs(polyArea2(poly));
    return specks(area, (m) => {
      const q: [number, number] = [x0 + (x1 - x0) * rnd(m, seed), z0 + (z1 - z0) * rnd(m, seed + 1.7)];
      return inPoly2(q, poly) ? [q[0], y === 0 ? 0 : capY(P, q), q[1]] : null;
    });
  };
  const chipsOn = (P: V3[], inward: number, count: number, seed: number) => {
    const res: V3[][] = [];
    const c = cen3(P);
    for (let m = 0; m < count; m++) {
      const i = Math.floor(rnd(m, seed) * P.length);
      const a = P[i], b = P[(i + 1) % P.length];
      const L = len(sub(b, a));
      const t = 0.15 + 0.7 * rnd(m, seed + 2);
      const w = Math.min(L * 0.3, (0.05 + 0.08 * rnd(m, seed + 3)) * L + 1.5);
      const p0 = add(a, mul(sub(b, a), t - w / (2 * L))), p1 = add(a, mul(sub(b, a), t + w / (2 * L)));
      const mid = add(a, mul(sub(b, a), t));
      const toC = norm(sub(c, mid));
      const p2 = add(mid, mul(toC, w * (0.45 + 0.4 * rnd(m, seed + 4)) * inward));
      res.push([p0, p1, p2]);
    }
    return res;
  };
  const nc = d.chips ?? 3;
  // board lines across a cap: runs of a line z = const that lie inside the outline (sampled, so ragged outlines work)
  const boardsOn = (P: V3[], y: number) => {
    if (!d.boards) return [];
    const poly = P.map((p) => [p[0], p[2]] as [number, number]);
    const xs = P.map((p) => p[0]), zs = P.map((p) => p[2]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const res: V3[][] = [];
    for (let z = z0 + d.boards * 0.5; z < z1; z += d.boards) {
      const zz = z + (rnd(Math.round(z), d.seed + 90) - 0.5) * d.boards * 0.15;
      let run: V3[] = [];
      const n = Math.max(8, Math.ceil((x1 - x0) / 6));
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        if (inPoly2([x, zz], poly)) run.push([x, y, zz]);
        else if (run.length) (run.length > 1 && res.push(run), (run = []));
      }
      if (run.length > 1) res.push(run);
    }
    return res;
  };
  const nTop = norm(cross(sub(T[2 % n], T[0]), sub(T[1], T[0])));
  faces.push({pts: T, n: nTop[1] < 0 ? mul(nTop, -1) : nTop, specks: capSpecks(T, d.h, d.seed + 50), cap: 'top', chips: chipsOn(T, 1, nc, d.seed + 60), boards: boardsOn(T, d.h), crack: null});
  faces.push({pts: [...B].reverse(), n: [0, -1, 0], specks: capSpecks(B, 0, d.seed + 70), cap: 'bot', chips: chipsOn(B, 1, nc, d.seed + 80), boards: boardsOn(B, 0), crack: null});
  return {faces, h: d.h, base: B};
};
const geoOf = (d: ChunkDef) => {
  const k = `${d.key}|${d.seed}|${d.speckMax}|${d.speckScale}|${d.h}|${d.rx}|${d.rz}|${d.n}|${d.jag}|${d.k}|${d.tex}|${d.chips}|${d.boards}|${d.tilt}|${d.cracks}|${d.outline ? d.outline.map((p) => p.join(',')).join(';') : 0}`;
  let g = GEO.get(k);
  if (!g) {
    g = buildGeo(d);
    GEO.set(k, g);
  }
  return g;
};
export const chunkFrame = (d: ChunkDef): Frame =>
  d.w ? ypr(d.w, d.yaw ?? 0, d.pitch ?? 0, d.roll ?? 0) : ypr(rw(d.a ?? 0, d.b ?? 0, d.y ?? 0), ROUTE_YAW + (d.yaw ?? 0), d.pitch ?? 0, d.roll ?? 0);
/** depth used to sort a chunk among other items: its nearest base corner (objects standing on the floor) */
export const chunkDepth = (cam: Cam, d: ChunkDef) => {
  const F = chunkFrame(d);
  const g = geoOf(d);
  let m = 1e9;
  for (const p of g.base) m = Math.min(m, depth(cam, toW(F, p)));
  return Math.max(m, depth(cam, F.o) - 0.5 * (d.rx ?? 20));
};
export const chunkCentre = (d: ChunkDef): V3 => toW(chunkFrame(d), [0, d.h / 2, 0]);

export const Chunk: React.FC<{cam: Cam; d: ChunkDef; L: Lights; id: string; ink?: number}> = ({cam, d, L, id, ink}) => {
  const F = chunkFrame(d);
  const g = geoOf(d);
  const eL = toL(F, cam.eye);
  const base = d.tone ?? RUB.concrete;
  const vis: {f: FaceL; z: number}[] = [];
  for (const f of g.faces) {
    if (f.cap && d.caps === false) continue;
    if (f.cap === 'bot' ? eL[1] >= 0 : dot(f.n, sub(eL, f.pts[0])) <= 0) continue;
    const z = depth(cam, toW(F, cen3(f.pts)));
    vis.push({f, z: f.cap ? -1e9 : z});
  }
  vis.sort((p, q) => q.z - p.z);
  const els: React.ReactNode[] = [];
  vis.forEach(({f}, fi) => {
    const W = clipW(cam, f.pts.map((p) => toW(F, p)));
    if (W.length < 3) return;
    const S = W.map((p) => proj(cam, p));
    if (!onScreen(S)) return;
    const nW = dirW(F, f.n);
    // gradient between the face's brightest and darkest corner in the light field (plus the key light's own direction)
    const ls = W.map((p) => lightAt(L, p));
    let i0 = 0, i1 = 0;
    ls.forEach((l, i) => {
      if (l > ls[i0]) i0 = i;
      if (l < ls[i1]) i1 = i;
    });
    const c0 = toneAt(base, nW, W[i0], cam, L), c1 = toneAt(base, nW, W[i1], cam, L);
    let g0 = S[i0], g1 = S[i1];
    if (Math.hypot(g1[0] - g0[0], g1[1] - g0[1]) < 4) {
      const xs = S.map((p) => p[0]), ys = S.map((p) => p[1]);
      g0 = [Math.min(...xs), Math.min(...ys)];
      g1 = [Math.max(...xs), Math.max(...ys)];
    }
    const cen = cen3(W);
    const iw = ink ?? inkWAt(cam, cen);
    const gid = `${id}-f${fi}`;
    const d0 = polyPath(S);
    const sc = scaleAt(cam, cen);
    els.push(
      <g key={fi}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(g0[0])} y1={fmt(g0[1])} x2={fmt(g1[0])} y2={fmt(g1[1])}>
            <stop offset="0" stopColor={lit(c0, 0.05)} />
            <stop offset="1" stopColor={shade(c1, 0.06)} />
          </linearGradient>
        </defs>
        <path d={d0} fill={`url(#${gid})`} stroke={INK} strokeWidth={fmt(iw)} strokeLinejoin="round" />
        {sc * 0.18 > 0.35 && (
          <g>
            {f.specks.map((s, si) => {
              const pw = toW(F, s.p);
              const dz = depth(cam, pw);
              if (dz < NEAR + 0.5) return null;
              const r = (s.r * cam.f) / dz;
              if (r < 0.42) return null;
              const q = proj(cam, pw);
              if (q[0] < -60 || q[0] > 1140 || q[1] < -60 || q[1] > 1980) return null;
              const col = s.c === 0 ? shade(c1, 0.42) : s.c === 1 ? lit(c0, 0.22) : mix(c0, '#A4876F', 0.45);
              if (r < 5 || s.c === 0) return <circle key={si} cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(Math.min(r, 14))} fill={col} opacity={s.c === 0 ? 0.55 : 0.7} />;
              // close up, an aggregate stone: an irregular rounded polygon set in the matrix, a dark rim on its lower
              // right (it sits in a slight pit) and a lit upper-left edge
              const rr = Math.min(r, 60);
              const pts: V2[] = [];
              const nv = 6;
              for (let m = 0; m < nv; m++) {
                const ang = (m / nv) * Math.PI * 2 + rnd(si, 3.3) * 2;
                const k2 = 0.62 + 0.38 * rnd(si * 7 + m, 4.4);
                pts.push([q[0] + rr * k2 * Math.cos(ang), q[1] + rr * k2 * Math.sin(ang) * 0.86]);
              }
              const dpath = closedPath(pts);
              return (
                <g key={si}>
                  <path d={dpath} fill={shade(c1, 0.5)} opacity={0.5} transform={`translate(${fmt(rr * 0.14)} ${fmt(rr * 0.16)})`} />
                  <path d={dpath} fill={col} opacity={0.9} />
                  <path d={dpath} fill="none" stroke={lit(col, 0.35)} strokeWidth={fmt(Math.max(0.8, rr * 0.1))} opacity={0.55} strokeDasharray={`${fmt(rr * 1.4)} ${fmt(rr * 9)}`} strokeDashoffset={fmt(rr * 3.2)} />
                </g>
              );
            })}
          </g>
        )}
        {f.crack && (() => {
          const W2 = f.crack.map((p) => toW(F, p));
          if (W2.some((p) => depth(cam, p) < NEAR + 1)) return null;
          const S2 = W2.map((p) => proj(cam, p));
          const dd = `M${S2.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join(' L')}`;
          return (
            <g>
              <path d={dd} fill="none" stroke={lit(c0, 0.25)} strokeWidth={fmt(Math.max(0.7, iw * 0.6))} strokeLinejoin="round" opacity={0.5} transform="translate(-0.8 0.9)" />
              <path d={dd} fill="none" stroke={RUB.crevice} strokeWidth={fmt(Math.max(0.6, iw * 0.55))} strokeLinejoin="round" opacity={0.75} />
            </g>
          );
        })()}
        {f.boards.length > 0 &&
          f.boards.map((run, bi) => {
            const W2 = run.map((p) => toW(F, p)).filter((p) => depth(cam, p) > NEAR + 1);
            if (W2.length < 2) return null;
            const S2 = W2.map((p) => proj(cam, p));
            return <path key={`b${bi}`} d={`M${S2.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join(' L')}`} fill="none" stroke={shade(c1, 0.35)} strokeWidth={fmt(Math.max(0.6, iw * 0.45))} opacity={0.45} />;
          })}
        {f.cap &&
          f.chips.map((ch, ci) => {
            const cw = clipW(cam, ch.map((p) => toW(F, p)));
            if (cw.length < 3) return null;
            const cs = cw.map((p) => proj(cam, p));
            return (
              <g key={`c${ci}`}>
                <path d={polyPath(cs)} fill={shade(c1, 0.3)} stroke={INK} strokeWidth={fmt(iw * 0.6)} strokeLinejoin="round" />
                <path d={`M${fmt(cs[0][0])} ${fmt(cs[0][1])} L${fmt(cs[2][0])} ${fmt(cs[2][1])}`} stroke={lit(c0, 0.3)} strokeWidth={fmt(iw * 0.7)} strokeLinecap="round" opacity={0.75} />
              </g>
            );
          })}
        {f.cap === 'top' && (
          <path d={d0} fill="none" stroke={lit(c0, 0.32)} strokeWidth={fmt(iw * 0.9)} strokeLinejoin="round" opacity={0.45} transform={`translate(${fmt(iw * 0.6)} ${fmt(iw * 0.6)})`} />
        )}
      </g>,
    );
  });
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------------------------------------------
// Rebar: rusty ribbed bar along a 3D polyline
// ---------------------------------------------------------------------------------------------------------------
export type RebarDef = {key: string; pts: V3[]; r: number};
export const rebarDepth = (cam: Cam, d: RebarDef) => Math.min(...d.pts.map((p) => depth(cam, p)));
export const Rebar: React.FC<{cam: Cam; d: RebarDef; L: Lights}> = ({cam, d, L}) => {
  // resample, clip to the near plane, project
  const P: V3[] = [];
  for (let i = 0; i < d.pts.length - 1; i++) {
    const a = d.pts[i], b = d.pts[i + 1];
    const n = Math.max(2, Math.ceil(len(sub(b, a)) / 6));
    for (let k = 0; k < n; k++) P.push(add(a, mul(sub(b, a), k / n)));
  }
  P.push(d.pts[d.pts.length - 1]);
  const runs: {s: V2; w: number; p: V3}[][] = [];
  let cur: {s: V2; w: number; p: V3}[] = [];
  for (const p of P) {
    if (depth(cam, p) > NEAR + 1) cur.push({s: proj(cam, p), w: d.r * scaleAt(cam, p), p});
    else if (cur.length) (runs.push(cur), (cur = []));
  }
  if (cur.length) runs.push(cur);
  const els: React.ReactNode[] = [];
  runs.forEach((run, ri) => {
    if (run.length < 2) return;
    const mid = run[Math.floor(run.length / 2)];
    const l = clamp(lightAt(L, mid.p));
    const body = mix(RUB.void, RUB.rebar, 0.25 + 0.75 * l);
    const hi = mix(RUB.void, RUB.rebarLight, 0.2 + 0.8 * l);
    // draw as consecutive segments so the width follows depth
    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i], b = run[i + 1];
      const w = (a.w + b.w);
      const seg = `M${fmt(a.s[0])} ${fmt(a.s[1])} L${fmt(b.s[0])} ${fmt(b.s[1])}`;
      els.push(<path key={`i${ri}-${i}`} d={seg} stroke={INK} strokeWidth={fmt(w + 2 * inkWAt(cam, a.p, 0.2))} strokeLinecap="round" />);
    }
    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i], b = run[i + 1];
      const w = a.w + b.w;
      const seg = `M${fmt(a.s[0])} ${fmt(a.s[1])} L${fmt(b.s[0])} ${fmt(b.s[1])}`;
      els.push(<path key={`b${ri}-${i}`} d={seg} stroke={body} strokeWidth={fmt(w)} strokeLinecap="round" />);
    }
    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i], b = run[i + 1];
      const w = a.w + b.w;
      // highlight on the upper-left of the bar, and rib ticks across it
      const dx = b.s[0] - a.s[0], dy = b.s[1] - a.s[1];
      const L2 = Math.hypot(dx, dy) || 1;
      let nx = -dy / L2, ny = dx / L2;
      if (nx * -0.62 + ny * -0.78 < 0) (nx = -nx), (ny = -ny);
      const o = w * 0.22;
      els.push(<path key={`h${ri}-${i}`} d={`M${fmt(a.s[0] + nx * o)} ${fmt(a.s[1] + ny * o)} L${fmt(b.s[0] + nx * o)} ${fmt(b.s[1] + ny * o)}`} stroke={hi} strokeWidth={fmt(w * 0.28)} strokeLinecap="round" opacity={0.8} />);
      if (w > 2.2 && i % 1 === 0) {
        const mx = (a.s[0] + b.s[0]) / 2, my = (a.s[1] + b.s[1]) / 2;
        els.push(<path key={`r${ri}-${i}`} d={`M${fmt(mx - nx * w * 0.5 + dx / L2 * w * 0.12)} ${fmt(my - ny * w * 0.5 + dy / L2 * w * 0.12)} L${fmt(mx + nx * w * 0.5 - dx / L2 * w * 0.12)} ${fmt(my + ny * w * 0.5 - dy / L2 * w * 0.12)}`} stroke={shade(body, 0.45)} strokeWidth={fmt(Math.max(0.6, w * 0.13))} opacity={0.7} />);
      }
    }
  });
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------------------------------------------
// Floor: the slab under the rubble (y = 0) with light pools, dust drifts, grit and fine chips
// ---------------------------------------------------------------------------------------------------------------
const circleOnFloor = (c: V3, r: number, n = 30, sq = 1): V3[] => Array.from({length: n}, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return [c[0] + r * Math.cos(a), 0.05, c[2] + r * sq * Math.sin(a)] as V3;
});
export type Pool = {c: V3; r: number; color: string; a: number; sq?: number};
export type GritField = {a0: number; a1: number; b0: number; b1: number; n: number; seed: number; clearB?: [number, number]};

export const RubbleFloor: React.FC<{cam: Cam; id: string; L: Lights; pools: Pool[]; grit: GritField[]; extent?: [number, number, number, number]}> = ({cam, id, L, pools, grit, extent = [-1400, 1400, -900, 1100]}) => {
  const [a0, a1, b0, b1] = extent;
  const poly = clipW(cam, [rw(a0, b0), rw(a1, b0), rw(a1, b1), rw(a0, b1)]);
  const base = toneAt(RUB.floor, [0, 1, 0], add(cam.eye, mul(cam.fwd, 300)), cam, {...L, beams: [], glows: []});
  const S = poly.length >= 3 ? poly.map((p) => proj(cam, p)) : null;
  // grit and fine chips, anchored on the floor
  const chips: React.ReactNode[] = [];
  const up: V3 = [0, 1, 0];
  grit.forEach((G, gi) => {
    for (let i = 0; i < G.n; i++) {
      const a = G.a0 + (G.a1 - G.a0) * rnd(i, G.seed), b = G.b0 + (G.b1 - G.b0) * rnd(i, G.seed + 1.3);
      if (G.clearB && b > G.clearB[0] && b < G.clearB[1] && rnd(i, G.seed + 9) > 0.25) continue;
      const p = rw(a, b, 0.2);
      const dz = depth(cam, p);
      if (dz < 8 || dz > 2600) continue;
      const sc = cam.f / dz;
      const sz = (0.35 + 2.4 * Math.pow(rnd(i, G.seed + 2.1), 3)) * sc;
      if (sz < 0.55) continue;
      const q = proj(cam, p);
      if (q[0] < -30 || q[0] > 1110 || q[1] < -30 || q[1] > 1950) continue;
      // foreshortening of a flat chip: the sine of the view's grazing angle
      const sq = clamp(Math.abs(dot(norm(sub(cam.eye, p)), up)), 0.18, 1);
      const nv = 5;
      const pts: V2[] = [];
      const rot = rnd(i, G.seed + 3) * Math.PI;
      for (let k = 0; k < nv; k++) {
        const ang = rot + (k / nv) * Math.PI * 2;
        const rr = sz * (0.55 + 0.45 * rnd(i * 7 + k, G.seed + 4));
        pts.push([q[0] + rr * Math.cos(ang), q[1] + rr * Math.sin(ang) * sq]);
      }
      const l = lightAt(L, p);
      const tone = rnd(i, G.seed + 5);
      const col = mix(RUB.void, tone > 0.7 ? RUB.concreteLight : tone > 0.3 ? RUB.concrete : RUB.concreteDeep, clamp(0.2 + 0.85 * Math.min(1.1, l)));
      const lift = sz * 0.35 * (1 - sq * 0.5);
      chips.push(
        <g key={`${gi}-${i}`}>
          <path d={polyPath(pts.map((pp) => [pp[0] + sz * 0.25, pp[1] + sz * 0.2] as V2))} fill="#1E1916" opacity={0.45} />
          <path d={polyPath(pts.map((pp) => [pp[0], pp[1] - lift] as V2))} fill={col} stroke={sz > 3 ? INK : 'none'} strokeWidth={sz > 3 ? fmt(clamp(sz * 0.08, 0.5, 1.6)) : 0} strokeLinejoin="round" />
        </g>,
      );
    }
  });
  return (
    <g>
      <defs>
        <filter id={`${id}-pb`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={18} />
        </filter>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={1920}>
          <stop offset="0" stopColor={shade(base, 0.25)} />
          <stop offset="1" stopColor={base} />
        </linearGradient>
      </defs>
      {S && <path d={polyPath(S)} fill={`url(#${id}-fg)`} />}
      <g filter={`url(#${id}-pb)`}>
        {pools.map((pl, i) => {
          const rings = 4;
          return Array.from({length: rings}, (_, k) => {
            const ring = clipW(cam, circleOnFloor(pl.c, pl.r * (1 - (k / rings) * 0.75), 32, pl.sq ?? 1));
            if (ring.length < 3) return null;
            return <path key={`${i}-${k}`} d={polyPath(ring.map((p) => proj(cam, p)))} fill={pl.color} opacity={pl.a / rings} />;
          });
        })}
      </g>
      {chips}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Daylight shaft (soft-edged beam through a crack) and dust motes
// ---------------------------------------------------------------------------------------------------------------
/** the beam's world prism: the crack polygon and its trace on the floor (or at `toY`) */
export const beamPrism = (b: Beam, toY = 0) => {
  const dir = b.dir ?? DAY;
  const bottom = b.crack.map((p) => add(p, mul(dir, (p[1] - toY) / -dir[1])));
  return {top: b.crack, bottom};
};
export const beamDepth = (cam: Cam, b: Beam) => {
  const {top, bottom} = beamPrism(b);
  return depth(cam, mul(add(cen3(top), cen3(bottom)), 0.5));
};
export const DustShaft: React.FC<{cam: Cam; b: Beam; id: string; alpha?: number; toY?: number; streaks?: number}> = ({cam, b, id, alpha = 0.34, toY = 0, streaks = 0}) => {
  const {top, bottom} = beamPrism(b, toY);
  // the prism's edges clipped to the near plane: the hull of what is in front of the lens (a camera inside the beam sees
  // it fill the frame, with no pop when it enters)
  const n = top.length;
  const edges: [V3, V3][] = [];
  for (let i = 0; i < n; i++) edges.push([top[i], top[(i + 1) % n]], [bottom[i], bottom[(i + 1) % n]], [top[i], bottom[i]]);
  const pts: V2[] = [];
  for (const [p, q] of edges) {
    const dp = depth(cam, p) - NEAR - 1, dq = depth(cam, q) - NEAR - 1;
    if (dp >= 0) pts.push(proj(cam, p));
    if (dq >= 0) pts.push(proj(cam, q));
    if (dp >= 0 !== dq >= 0) pts.push(proj(cam, add(p, mul(sub(q, p), dp / (dp - dq)))));
  }
  if (pts.length < 3) return null;
  const hull = convexHull(pts);
  if (!onScreen(hull, 200)) return null;
  const tcW = cen3(top), bcW = cen3(bottom);
  const tc = depth(cam, tcW) > NEAR + 1 ? proj(cam, tcW) : hull[0];
  const bc = depth(cam, bcW) > NEAR + 1 ? proj(cam, bcW) : hull[Math.floor(hull.length / 2)];
  const span = Math.max(...hull.map((p) => Math.hypot(p[0] - tc[0], p[1] - tc[1])));
  const wW = Math.max(...top.map((p) => len(sub(p, tcW))));
  const w = wW * scaleAt(cam, mul(add(tcW, bcW), 0.5));
  const blur = clamp(w * 0.3, 3, 40);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={fmt(tc[0])} y1={fmt(tc[1])} x2={fmt(bc[0])} y2={fmt(bc[1])}>
          <stop offset="0" stopColor={RUB.dayHot} stopOpacity={alpha} />
          <stop offset="0.55" stopColor={RUB.day} stopOpacity={alpha * 0.62} />
          <stop offset="1" stopColor={RUB.day} stopOpacity={alpha * 0.32} />
        </linearGradient>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={-400} y={-400} width={1880} height={2720}>
          <feGaussianBlur stdDeviation={fmt(blur)} />
        </filter>
        <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={fmt(tc[0])} y1={fmt(tc[1])} x2={fmt(bc[0])} y2={fmt(bc[1])}>
          <stop offset="0" stopColor={RUB.dayHot} stopOpacity={alpha} />
          <stop offset="0.6" stopColor={RUB.day} stopOpacity={alpha * 0.5} />
          <stop offset="0.92" stopColor={RUB.day} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-f2`} filterUnits="userSpaceOnUse" x={-400} y={-400} width={1880} height={2720}>
          <feGaussianBlur stdDeviation={fmt(blur * 0.35)} />
        </filter>
      </defs>
      <path d={polyPath(hull)} fill={`url(#${id}-g)`} filter={`url(#${id}-f)`} opacity={span > 4000 ? 0.6 : 1} />
      {streaks > 0 &&
        [0.3, 0.55, 0.78].slice(0, streaks).map((u, k) => {
          // thin brighter rays inside the beam, along its direction (from points across the crack)
          const a0 = add(mul(top[0], 1 - u), mul(top[2 % n], u));
          const a1 = add(mul(bottom[0], 1 - u), mul(bottom[2 % n], u));
          const da = depth(cam, a0) - NEAR - 1, db = depth(cam, a1) - NEAR - 1;
          if (da < 0 && db < 0) return null;
          const p0 = da >= 0 ? a0 : add(a0, mul(sub(a1, a0), da / (da - db)));
          const p1 = db >= 0 ? a1 : add(a0, mul(sub(a1, a0), da / (da - db)));
          const q0 = proj(cam, p0), q1 = proj(cam, p1);
          return <path key={k} d={`M${fmt(q0[0])} ${fmt(q0[1])} L${fmt(q1[0])} ${fmt(q1[1])}`} stroke={`url(#${id}-s)`} strokeWidth={fmt(Math.max(2, w * (0.16 - 0.04 * k)))} strokeLinecap="butt" filter={`url(#${id}-f2)`} opacity={0.9} />;
        })}
    </g>
  );
};

/** the warm footprint where a beam lands on the floor (soft-edged) */
export const BeamPatch: React.FC<{cam: Cam; b: Beam; id: string; alpha?: number}> = ({cam, b, id, alpha = 0.85}) => {
  const {bottom} = beamPrism(b, 0.1);
  const c = cen3(bottom);
  // the footprint itself, grown a little about its centre (drawn smooth, so its corners round off)
  const ring: V3[] = [];
  for (let i = 0; i < bottom.length; i++) {
    const p = bottom[i], q = bottom[(i + 1) % bottom.length];
    for (const u of [0, 0.5]) ring.push(add(c, mul(sub(add(p, mul(sub(q, p), u)), c), 1.12)));
  }
  const W = clipW(cam, ring);
  if (W.length < 3) return null;
  const S = W.map((p) => proj(cam, p));
  if (!onScreen(S)) return null;
  const blur = clamp(4 * scaleAt(cam, c) * 0.4, 1.5, 14);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-bp`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={fmt(blur)} />
        </filter>
      </defs>
      <path d={closedPath(S)} fill="#E9C89A" opacity={alpha * 0.42} filter={`url(#${id}-bp)`} />
      <path d={closedPath(S)} fill={RUB.day} opacity={alpha * 0.22} filter={`url(#${id}-bp)`} />
    </g>
  );
};

export type MoteField = {key: string; box: [V3, V3]; n: number; seed: number; drift: V3; L: Lights; size?: number; ambient?: number; map?: (p: V3) => V3};
/** slowly drifting dust: bright where a beam lights it, faint elsewhere; positions wrap inside the box with a fade at its
 *  ends (no pops) */
export const DustMotes: React.FC<{cam: Cam; m: MoteField; t: number; id: string}> = ({cam, m, t, id}) => {
  const lo: V3 = [0, 1, 2].map((k) => Math.min(m.box[0][k], m.box[1][k])) as unknown as V3;
  const hi: V3 = [0, 1, 2].map((k) => Math.max(m.box[0][k], m.box[1][k])) as unknown as V3;
  const ext = sub(hi, lo);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < m.n; i++) {
    const u: V3 = [rnd(i, m.seed), rnd(i, m.seed + 1), rnd(i, m.seed + 2)];
    const sp = 0.6 + 0.8 * rnd(i, m.seed + 3);
    const raw: V3 = [
      u[0] * ext[0] + m.drift[0] * sp * t + 3 * noise1(t * 0.4 + i, m.seed + 4),
      u[1] * ext[1] + m.drift[1] * sp * t + 3 * noise1(t * 0.35 + i * 1.7, m.seed + 5),
      u[2] * ext[2] + m.drift[2] * sp * t + 3 * noise1(t * 0.3 + i * 2.3, m.seed + 6),
    ];
    const w: V3 = [0, 1, 2].map((k) => ((raw[k] % ext[k]) + ext[k]) % ext[k]) as unknown as V3;
    const edge = Math.min(...[0, 1, 2].map((k) => Math.min(w[k], ext[k] - w[k]) / (ext[k] * 0.12)));
    const fade = clamp(edge);
    const p = m.map ? m.map(add(lo, w)) : add(lo, w);
    const dz = depth(cam, p);
    if (dz < 6) continue;
    const sun = clamp(sunAt(m.L, p));
    const vis = (m.ambient ?? 0.12) + 0.88 * sun;
    if (vis * fade < 0.04) continue;
    const r = Math.max(0.7, (m.size ?? 0.22) * (0.6 + 0.8 * rnd(i, m.seed + 7)) * (cam.f / dz));
    const q = proj(cam, p);
    if (q[0] < -20 || q[0] > 1100 || q[1] < -20 || q[1] > 1940) continue;
    els.push(<circle key={i} cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(Math.min(r, 9))} fill={`url(#${id}-m)`} opacity={fmt(clamp(vis * fade))} />);
  }
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-m`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.45" stopColor={RUB.day} stopOpacity={0.6} />
          <stop offset="1" stopColor={RUB.day} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};

/** a screen-space glow at a world point (light spilling from the alcove; scattering in dusty air) */
export const AirGlow: React.FC<{cam: Cam; p: V3; r: number; id: string; color?: string; alpha?: number; ry?: number}> = ({cam, p, r, id, color = RUB.day, alpha = 0.35, ry}) => {
  if (depth(cam, p) < 10) return null;
  const q = proj(cam, p);
  const R = r * scaleAt(cam, p);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-ag`}>
          <stop offset="0" stopColor={color} stopOpacity={alpha} />
          <stop offset="0.4" stopColor={color} stopOpacity={alpha * 0.45} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(q[0])} cy={fmt(q[1])} rx={fmt(R)} ry={fmt((ry ?? r) * scaleAt(cam, p))} fill={`url(#${id}-ag)`} />
    </g>
  );
};

/** a soft contact shadow under a piece, on the floor */
export const FloorAO: React.FC<{cam: Cam; c: V3; rx: number; rz: number; yaw?: number; a?: number; id: string}> = ({cam, c, rx, rz, yaw = 0, a = 0.5, id}) => {
  const pts: V3[] = Array.from({length: 24}, (_, i) => {
    const t = (i / 24) * Math.PI * 2;
    const x = rx * Math.cos(t), z = rz * Math.sin(t);
    return [c[0] + x * Math.cos(yaw) + z * Math.sin(yaw), 0.08, c[2] - x * Math.sin(yaw) + z * Math.cos(yaw)] as V3;
  });
  const W = clipW(cam, pts);
  if (W.length < 3) return null;
  const S = W.map((p) => proj(cam, p));
  if (!onScreen(S)) return null;
  const blur = clamp(Math.min(rx, rz) * scaleAt(cam, c) * 0.35, 2, 30);
  return (
    <g>
      <defs>
        <filter id={`${id}-ao`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={fmt(blur)} />
        </filter>
      </defs>
      <path d={closedPath(S)} fill="#17120F" opacity={a} filter={`url(#${id}-ao)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The route layout (S12). Route coordinates; the alcove beyond the gap is Alcove.tsx's (alcovePieces).
// The camera's low passage runs under a fallen slab to its broken lip at LIP_A; beyond it a narrow rubble corridor,
// open above to the alcove's daylight, leads to the gap (a = 0) and her hand (a = 330).
// ---------------------------------------------------------------------------------------------------------------
/** the low slab's broken front edge (the passage mouth) */
export const LIP_A = -450;
/** the low ceiling's underside height at route point (a, b): lowering toward the mouth, a little higher on the left */
export const ceilingY = (a: number, b: number) => 84 + (LIP_A - a) * 0.1 - b * 0.04;
const CEIL_PITCH = -Math.atan(0.1), CEIL_ROLL = Math.atan(0.04);
/** ragged slab outline (local x forward, z right) with a broken front edge at x = front (and a back edge at x = back,
 *  ragged too when ragB > 0) */
export const slabOutline = (back: number, front: number, left: number, right: number, seed: number, rag = 14, ragB = 0, nF = 11): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= nF; i++) {
    const z = left + ((right - left) * i) / nF;
    const dx = ragB ? (rnd(i, seed + 40) - 0.5) * 2 * ragB + (i % 2 ? ragB * 0.4 : -ragB * 0.25) : 0;
    pts.push([back + dx, z]);
  }
  for (let i = 0; i <= nF; i++) {
    const z = right + ((left - right) * i) / nF;
    const dx = (rnd(i, seed) - 0.5) * 2 * rag + (i % 2 ? -rag * 0.4 : rag * 0.25);
    pts.push([front + dx, z]);
  }
  return pts;
};
/** the crack across the low ceiling (between two slabs) */
export const CRACK_A: [number, number] = [-515, -503];
const slabAt = (key: string, a0: number, a1: number, seed: number, ragF: number, ragB: number, nF = 11): ChunkDef => {
  const ac = (a0 + a1) / 2;
  return {key, a: ac, b: 0, y: ceilingY(ac, 0), pitch: CEIL_PITCH, roll: CEIL_ROLL, outline: slabOutline(a0 - ac, a1 - ac, -280, 280, seed, ragF, ragB, nF), h: 80, k: 1, seed, tone: RUB.concreteDeep, tex: 0.7, chips: 8, boards: 30, speckScale: 0.45};
};
export const CEILING: ChunkDef[] = [slabAt('ceilA', -1100, CRACK_A[0], 101, 5, 0), slabAt('ceilB', CRACK_A[1], LIP_A, 102, 10, 4, 15)];
/** the narrow daylight shaft through the crack's right-hand end (falls from above-right, lands at the track's right) */
export const PASSAGE_BEAM: Beam = {
  key: 'pbeam',
  crack: [rw(CRACK_A[0] + 2, 22, ceilingY(CRACK_A[0], 22) + 1), rw(CRACK_A[1] - 2, 25, ceilingY(CRACK_A[1], 25) + 1), rw(CRACK_A[1] - 1, 58, ceilingY(CRACK_A[1], 58) + 1), rw(CRACK_A[0] + 3, 55, ceilingY(CRACK_A[0], 55) + 1)],
  k: 1.0,
  r: 14,
};
/** the alcove's broad shaft: from a break in the high roof (out of frame), across her face and forearms */
export const ALCOVE_BEAM: Beam = (() => {
  const axisPt: V3 = [150, 470, 20]; // between her face and her hands
  const top = add(axisPt, mul(DAY, -(1250 - axisPt[1]) / -DAY[1]));
  const u = norm(cross(DAY, [0, 1, 0]));
  const v = norm(cross(u, DAY));
  const q = (su: number, sv: number) => add(top, add(mul(u, su * 230), mul(v, sv * 150)));
  return {key: 'abeam', crack: [q(-1, -1), q(1, -1), q(1, 1), q(-1, 1)], k: 1.0, r: 210};
})();
/** a daylight shaft falling into the corridor (through the open roof above it) */
export const CORRIDOR_BEAM: Beam = (() => {
  const axisPt = rw(-300, 10, 0);
  const top = add(axisPt, mul(DAY, -900 / -DAY[1]));
  const u = norm(cross(DAY, [0, 1, 0]));
  const v = norm(cross(u, DAY));
  const q = (su: number, sv: number) => add(top, add(mul(u, su * 46), mul(v, sv * 30)));
  return {key: 'cbeam', crack: [q(-1, -1), q(1, -1), q(1, 1), q(-1, 1)], k: 0.75, r: 44};
})();

/** walls (all in front of the person): rubble piled against the passage sides, bigger blocks low, smaller broken pieces
 *  on top; beyond the lip the corridor's rubble banks, and the mounds that rise toward the alcove's walls */
type W6 = [number, number, number, number, number, number];
const piece = (key: string, [a, b, rx, rz, h, yaw]: W6, seed: number, extra: Partial<ChunkDef> = {}): ChunkDef => ({
  key, a, b, rx, rz, h, yaw, n: 6 + Math.floor(rnd(seed, 3) * 3), seed, k: 0.74, shift: [rnd(seed, 5) * 6 - 3, b < 0 ? 3 : -3], chips: 3, cracks: 0.22,
  tilt: [(rnd(seed, 11) - 0.5) * 0.9 * Math.min(1, h / Math.max(rx, 1)), (rnd(seed, 12) - 0.5) * 0.9 * Math.min(1, h / Math.max(rz, 1))],
  tone: rnd(seed, 9) > 0.66 ? RUB.concreteDeep : rnd(seed, 9) > 0.2 ? RUB.concrete : RUB.concreteLight, ...extra,
});
export const WALLS: ChunkDef[] = (() => {
  const L: ChunkDef[] = [];
  // the low passage (under the slab): bottom course, left then right (a, b, rx, rz, h, yaw)
  const lb: W6[] = [
    [-980, -146, 60, 50, 100, 0.3], [-890, -136, 50, 40, 96, -0.2], [-810, -134, 44, 36, 92, 0.5], [-735, -146, 52, 42, 98, 0.1],
    [-662, -138, 40, 32, 92, -0.4], [-610, -158, 44, 38, 96, 0.25], [-552, -140, 36, 30, 88, -0.15], [-500, -130, 40, 34, 84, 0.4],
  ];
  const rb: W6[] = [
    [-975, 128, 58, 52, 100, -0.2], [-880, 112, 44, 36, 94, 0.35], [-800, 108, 36, 32, 90, -0.1], [-722, 118, 48, 42, 98, 0.2],
    [-650, 100, 32, 28, 80, 0.6], [-596, 114, 42, 36, 96, -0.3], [-540, 106, 36, 30, 88, 0.15], [-496, 112, 40, 34, 86, -0.25],
  ];
  // the mouth's jambs and pieces closer in near the camera's path (they pass the frame edges)
  lb.push([-472, -104, 26, 22, 84, 0.3], [-530, -114, 22, 18, 70, -0.5]);
  rb.push([-468, 84, 24, 20, 82, -0.4], [-544, 86, 20, 18, 64, 0.6]);
  lb.forEach((w, i) => L.push(piece(`wl${i}`, w, 200 + i * 11)));
  rb.forEach((w, i) => L.push(piece(`wr${i}`, w, 300 + i * 13)));
  // small pieces at the foot of the passage walls
  const lf: W6[] = [[-860, -100, 16, 12, 14, 0.4], [-700, -104, 20, 14, 16, -0.6], [-618, -100, 12, 10, 10, 1.1], [-520, -94, 16, 12, 13, 0.2]];
  const rf: W6[] = [[-840, 82, 18, 13, 15, -0.3], [-690, 78, 14, 12, 12, 0.8], [-610, 76, 13, 10, 11, 0.3], [-512, 74, 15, 12, 12, -0.7]];
  // the camera's own floor: pebbles it passes over (they slide out under the bottom of the frame)
  for (let i = 0; i < 14; i++) {
    const a = -600 + 130 * rnd(i, 271), b = -96 + 116 * rnd(i, 272);
    if (Math.abs(b) < 36) continue;
    const s0 = 2.5 + 5 * rnd(i, 273);
    L.push(piece(`cp${i}`, [a, b, s0, s0 * (0.7 + 0.4 * rnd(i, 274)), s0 * (0.5 + 0.5 * rnd(i, 275)), rnd(i, 276) * 3], 280 + i * 3, {n: 6, k: 0.55, tex: 0.8, chips: 1, pitch: (rnd(i, 277) - 0.5) * 0.6, roll: (rnd(i, 278) - 0.5) * 0.6, cracks: 0}));
  }
  lf.forEach((w, i) => L.push(piece(`wlf${i}`, w, 260 + i * 5, {n: 7, k: 0.6, tex: 0.9, pitch: (rnd(i, 261) - 0.5) * 0.5, roll: (rnd(i, 262) - 0.5) * 0.5})));
  rf.forEach((w, i) => L.push(piece(`wrf${i}`, w, 360 + i * 5, {n: 7, k: 0.6, tex: 0.9, pitch: (rnd(i, 361) - 0.5) * 0.5, roll: (rnd(i, 362) - 0.5) * 0.5})));
  // the corridor beyond the lip: rubble banks either side of the track, made of broken slabs and chunks: flat pieces
  // lying at the track's edge, slabs leaning in against compact chunks, heavier chunks and tilted slabs behind
  for (const side of [-1, 1] as const) {
    let a = LIP_A + 6 + rnd(side + 3, 501) * 10;
    let i = 0;
    while (a < -70) {
      const sd = 520 + i * 13 + (side > 0 ? 400 : 0);
      const r = (k: number) => rnd(i * 5 + k, sd);
      // inner course: a flat broken piece lying at the track's edge, or a small chunk
      if (r(1) > 0.2) {
        const flat = r(2) > 0.45;
        const s0 = flat ? 14 + 14 * r(3) : 8 + 10 * r(3);
        L.push(piece(`ci${side}_${i}`, [a + 12 * r(4), side * (44 + s0 * 0.9 + 6 * r(5)), s0, s0 * (0.6 + 0.4 * r(6)), flat ? 4 + 4 * r(7) : s0 * (0.7 + 0.6 * r(7)), r(8) * 3], sd + 1,
          {n: 6 + Math.floor(r(9) * 2), k: flat ? 0.92 : 0.55 + 0.25 * r(10), pitch: (r(11) - 0.5) * (flat ? 0.5 : 0.7), roll: (r(12) - 0.5) * (flat ? 0.5 : 0.7), tex: 0.9, tone: r(13) > 0.6 ? RUB.concreteLight : RUB.concrete}));
      }
      // middle course: a compact chunk, sometimes with a slab leaning on it toward the track
      const s1 = 18 + 16 * r(14);
      L.push(piece(`cm${side}_${i}`, [a + 16 * r(15), side * (88 + 18 * r(16)), s1, s1 * (0.75 + 0.35 * r(17)), 26 + 34 * r(18), r(19) * 3], sd + 2,
        {k: 0.5 + 0.3 * r(20), pitch: (r(21) - 0.5) * 0.5, roll: (r(22) - 0.5) * 0.5, tone: r(23) > 0.55 ? RUB.concreteDeep : RUB.concrete}));
      if (r(24) > 0.4) {
        const rz = 24 + 18 * r(25), roll = 0.55 + 0.45 * r(26);
        L.push({key: `cs${side}_${i}`, a: a + 10 + 20 * r(27), b: side * (82 + 10 * r(28)), y: rz * Math.sin(roll) * 0.85, yaw: (r(29) - 0.5) * 0.7, roll: side * -roll, pitch: (r(30) - 0.5) * 0.4,
          outline: ringOutline(30 + 22 * r(31), rz, 7, sd + 3, 0.1), h: 8 + 5 * r(32), k: 0.96, seed: sd + 3, tone: r(33) > 0.5 ? RUB.concreteDeep : RUB.concrete, tex: 0.7, chips: 4, cracks: 0.3});
      }
      // back course: a heavy chunk with a broken top, or a big slab tilted up against the mound
      if (r(34) > 0.5) {
        const s2 = 32 + 26 * r(35);
        L.push(piece(`cb${side}_${i}`, [a + 16 * r(36), side * (138 + 20 * r(37)), s2, s2 * (0.8 + 0.3 * r(38)), 60 + 60 * r(39), r(40) * 3], sd + 4,
          {k: 0.45 + 0.25 * r(41), chips: 4, tone: RUB.concreteDeep, pitch: (r(42) - 0.5) * 0.4, roll: (r(43) - 0.5) * 0.4}));
      } else {
        const rz = 40 + 26 * r(44), roll = 0.75 + 0.4 * r(45);
        L.push({key: `ct${side}_${i}`, a: a + 20 * r(46), b: side * (136 + 14 * r(47)), y: rz * Math.sin(roll) * 0.88, yaw: (r(48) - 0.5) * 0.5, roll: side * -roll, pitch: (r(49) - 0.5) * 0.3,
          outline: ringOutline(46 + 26 * r(50), rz, 8, sd + 5, 0.12), h: 12 + 6 * r(51), k: 0.96, seed: sd + 5, tone: RUB.concreteDeep, tex: 0.6, chips: 5, cracks: 0.3});
      }
      a += 40 + 26 * r(52);
      i++;
    }
  }
  // the mounds that rise toward the alcove's sides
  const mounds: W6[] = [[-380, -260, 80, 64, 230, 0.2], [-250, -280, 90, 72, 290, -0.3], [-370, 262, 76, 64, 220, 0.4], [-246, 286, 92, 74, 280, -0.1]];
  mounds.forEach((w, i) => L.push(piece(`fm${i}`, w, 400 + i * 17, {n: 10, k: 0.72, chips: 4, tex: 0.8})));
  return L;
})();

/** pebbles and small pieces on the floor (kept off the insect's track, |b| < 40) */
export const PEBBLES: ChunkDef[] = (() => {
  const P: ChunkDef[] = [];
  for (let i = 0; i < 90; i++) {
    const a = -760 + 700 * rnd(i, 601);
    const side = rnd(i, 602) > 0.5 ? 1 : -1;
    const b = side * (40 + 40 * Math.pow(rnd(i, 603), 1.3));
    const s = 1.6 + 8 * Math.pow(rnd(i, 604), 2.4);
    const flat = rnd(i, 612) > 0.75;
    P.push({key: `pb${i}`, a, b, rx: s, rz: s * (0.6 + 0.5 * rnd(i, 605)), h: s * (flat ? 0.22 : 0.45 + 0.5 * rnd(i, 606)), yaw: rnd(i, 607) * 3, roll: (rnd(i, 608) - 0.5) * 0.7, pitch: (rnd(i, 609) - 0.5) * 0.6, n: 5 + Math.floor(rnd(i, 610) * 4), seed: 700 + i * 7, k: flat ? 0.92 : 0.38 + 0.35 * rnd(i, 613), shift: [(rnd(i, 614) - 0.5) * s * 0.5, (rnd(i, 615) - 0.5) * s * 0.5], tex: 0.6, chips: 1, tone: rnd(i, 611) > 0.6 ? RUB.concreteLight : RUB.concrete});
  }
  return P;
})();

export const REBAR: RebarDef[] = [
  // out of the mouth's lip: bent down on the left and on the right, and short cut stubs
  {key: 'rl1', pts: [rw(LIP_A - 30, -92, ceilingY(LIP_A, -92) + 28), rw(LIP_A + 4, -94, ceilingY(LIP_A, -94) + 16), rw(LIP_A + 16, -100, 60), rw(LIP_A + 22, -106, 36)], r: 1.4},
  {key: 'rr1', pts: [rw(LIP_A - 26, 66, ceilingY(LIP_A, 66) + 24), rw(LIP_A + 8, 68, ceilingY(LIP_A, 68) + 10), rw(LIP_A + 20, 76, 58), rw(LIP_A + 26, 82, 30)], r: 1.4},
  {key: 'rs1', pts: [rw(LIP_A - 10, 44, ceilingY(LIP_A, 44) + 20), rw(LIP_A + 14, 47, ceilingY(LIP_A, 47) + 8)], r: 1.2},
  {key: 'rs2', pts: [rw(LIP_A - 10, 112, ceilingY(LIP_A, 112) + 22), rw(LIP_A + 10, 116, ceilingY(LIP_A, 116) + 26)], r: 1.2},
  // exposed in the crack (left part)
  {key: 'rc1', pts: [rw(CRACK_A[0] - 4, 150, ceilingY(CRACK_A[0], 150) + 34), rw(CRACK_A[0] + 6, 100, ceilingY(CRACK_A[0], 100) + 34), rw(CRACK_A[0] + 3, 76, ceilingY(CRACK_A[0], 76) + 12), rw(CRACK_A[0] + 1, 68, ceilingY(CRACK_A[0], 68) - 7)], r: 1.1},
  // lying on the floor along the left wall, and out of a right-hand block
  {key: 'rf1', pts: [rw(-800, -92, 1.4), rw(-730, -98, 1.4), rw(-650, -92, 1.4), rw(-615, -84, 7)], r: 1.3},
  {key: 'rw1', pts: [rw(-735, 96, 86), rw(-700, 82, 92), rw(-680, 74, 102)], r: 1.3},
  // from the corridor's banks
  {key: 'rm1', pts: [rw(-392, 120, 60), rw(-372, 100, 74), rw(-362, 92, 96)], r: 1.6},
  {key: 'rm2', pts: [rw(-240, 150, 120), rw(-262, 126, 150), rw(-280, 120, 196)], r: 2.0},
  {key: 'rm3', pts: [rw(-200, -84, 60), rw(-180, -64, 70), rw(-170, -58, 92)], r: 1.4},
];

/** the S12 light field: low ambient in the passage, the crack's shaft, the corridor and alcove shafts, the daylit
 *  corridor and alcove */
export const RUBBLE_LIGHTS: Lights = {
  amb: 0.24,
  beams: [PASSAGE_BEAM, CORRIDOR_BEAM, ALCOVE_BEAM],
  glows: [
    {p: [180, 320, 260], r: 720, k: 0.62},
    {p: rw(-200, 0, 100), r: 200, k: 0.32},
  ],
};
/** floor light pools for S12 (the corridor and the alcove) */
export const RUBBLE_POOLS: Pool[] = [
  {c: [230, 0, 30], r: 330, color: RUB.day, a: 0.8},
  {c: rw(-220, 0, 0), r: 220, color: '#D9C6A6', a: 0.55},
];
export const RUBBLE_GRIT: GritField[] = [
  {a0: -900, a1: -470, b0: -110, b1: 110, n: 2600, seed: 41, clearB: [-34, 34]},
  {a0: -490, a1: 140, b0: -150, b1: 150, n: 2800, seed: 42, clearB: [-34, 34]},
];

// ---------------------------------------------------------------------------------------------------------------
// The assembled environment
// ---------------------------------------------------------------------------------------------------------------
export type RubbleItem = {z: number; el: React.ReactNode};
/** the void behind everything and the far, dusty glow of daylight */
export const RubbleBackdrop: React.FC<{cam: Cam; id: string}> = ({cam, id}) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill={RUB.void} />
    <AirGlow cam={cam} p={[200, 700, 100]} r={1100} id={`${id}ag0`} alpha={0.3} color="#C9A97F" />
  </g>
);

/** The rubble route through any camera, drawn in depth bands so a composited person and insects sit right:
 *  backdrop, floor (light pools, grit, the shafts' footprints, contact shadows), the alcove's pieces behind the person,
 *  the person, the alcove's shaft and dust, whatever rises above the low ceiling's plane beyond its lip (alcove pieces
 *  in front of her, tall rubble, high rebar), the low ceiling, then everything under it or low enough to be seen under
 *  it (walls, pebbles, rebar, the passage and corridor shafts with their dust, and `items`), sorted far to near; `front`
 *  last. `alcove` takes Alcove.tsx's pieces (alcovePieces(cam)); they are split at the person's anchor depth and graded
 *  into this set's exposure. */
export const RubblePassage: React.FC<{cam: Cam; id: string; t: number; L?: Lights; alcove?: RubbleItem[]; person?: React.ReactNode; items?: RubbleItem[]; front?: React.ReactNode}> = ({
  cam, id, t, L = RUBBLE_LIGHTS, alcove = [], person, items = [], front,
}) => {
  const dA = depth(cam, PERSON.anchor);
  const back: RubbleItem[] = alcove.filter((it) => it.z > dA).sort((p, q) => q.z - p.z);
  const grade = (it: RubbleItem, k: number) => ({z: it.z, el: <g key={`alc${k}`} filter={`url(#${id}-alc)`}>{it.el}</g>});
  const high: RubbleItem[] = alcove.filter((it) => it.z <= dA).map(grade);
  const low: RubbleItem[] = [...items];
  const isHigh = (a: number, b: number, top: number) => a > LIP_A + 4 && top > ceilingY(a, b) - 4;
  for (const d of [...WALLS, ...PEBBLES]) {
    if (depth(cam, rw(d.a!, d.b!, 0)) < -(d.rx ?? 20) * 2) continue;
    const it = {z: chunkDepth(cam, d), el: <Chunk key={d.key} cam={cam} d={d} L={L} id={`${id}${d.key}`} />};
    (isHigh(d.a!, d.b!, (d.y ?? 0) + d.h) ? high : low).push(it);
  }
  for (const d of REBAR) {
    const r0 = toRoute(d.pts[0]);
    const top = Math.max(...d.pts.map((p) => p[1]));
    const it = {z: rebarDepth(cam, d), el: <Rebar key={d.key} cam={cam} d={d} L={L} />};
    (isHigh(r0[0], r0[1], top) ? high : low).push(it);
  }
  const crackMid = (CRACK_A[0] + CRACK_A[1]) / 2;
  const routeMap = (q: V3) => rw(q[0], q[1], q[2]);
  low.push({
    z: beamDepth(cam, PASSAGE_BEAM),
    el: (
      <g key="pbeam">
        <DustShaft cam={cam} b={PASSAGE_BEAM} id={`${id}pb`} alpha={0.62} streaks={3} />
        <DustMotes cam={cam} id={`${id}pm`} t={t} m={{key: 'pm', box: [[crackMid - 14, -6, 4], [crackMid + 40, 62, 92]], map: routeMap, n: 120, seed: 31, drift: [1.2, -1.4, -2.0], L, size: 0.24, ambient: 0.04}} />
      </g>
    ),
  });
  low.push({
    z: beamDepth(cam, CORRIDOR_BEAM),
    el: (
      <g key="cbeam">
        <DustShaft cam={cam} b={CORRIDOR_BEAM} id={`${id}cb`} alpha={0.16} streaks={1} />
        <DustMotes cam={cam} id={`${id}cm`} t={t} m={{key: 'cm', box: [[-360, -60, 10], [-220, 70, 160]], map: routeMap, n: 70, seed: 33, drift: [-1.4, 1.2, -1.6], L, size: 0.3, ambient: 0.03}} />
      </g>
    ),
  });
  high.sort((p, q) => q.z - p.z);
  low.sort((p, q) => q.z - p.z);
  return (
    <g>
      <defs>
        <filter id={`${id}-alc`} x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix type="matrix" values="0.8 0 0 0 0.02  0 0.77 0 0 0.012  0 0 0.7 0 0  0 0 0 1 0" />
        </filter>
      </defs>
      <RubbleBackdrop cam={cam} id={id} />
      <RubbleFloor cam={cam} id={`${id}fl`} L={L} pools={RUBBLE_POOLS} grit={RUBBLE_GRIT} />
      <BeamPatch cam={cam} b={PASSAGE_BEAM} id={`${id}bp`} />
      <BeamPatch cam={cam} b={CORRIDOR_BEAM} id={`${id}cp`} alpha={0.45} />
      {WALLS.filter((d) => d.h > 30 && !d.y).map((d) => {
        const c = rw(d.a!, d.b!, 0);
        if (depth(cam, c) < 10) return null;
        return <FloorAO key={`ao${d.key}`} cam={cam} c={c} rx={(d.rx ?? 20) * 1.15} rz={(d.rz ?? 20) * 1.15} yaw={ROUTE_YAW + (d.yaw ?? 0)} a={0.55} id={`${id}ao${d.key}`} />;
      })}
      <g filter={`url(#${id}-alc)`}>{back.map((it) => it.el)}</g>
      <AirGlow cam={cam} p={[160, 460, 60]} r={520} id={`${id}ag1`} alpha={0.16} />
      {person}
      <DustShaft cam={cam} b={ALCOVE_BEAM} id={`${id}ab`} alpha={0.26} />
      <DustMotes cam={cam} id={`${id}am`} t={t} m={{key: 'am', box: [[-100, 40, -150], [460, 900, 360]], n: 80, seed: 37, drift: [-2, 3, 1.5], L, size: 0.9, ambient: 0.05}} />
      {high.map((it) => it.el)}
      {[...CEILING].reverse().map((d) => <Chunk key={d.key} cam={cam} d={d} L={L} id={`${id}${d.key}`} />)}
      {low.map((it) => it.el)}
      {front}
    </g>
  );
};
