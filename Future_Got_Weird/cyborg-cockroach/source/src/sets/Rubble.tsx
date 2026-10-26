// The future rubble route at insect scale (the proposed rescue application): a low passage under a collapsed floor slab,
// leading out into the daylit alcove where a trapped person lies. Everything is projected 3D geometry (world mm, floor
// y = 0) in the Weird Crew finish: ink contours, gradient fills from the fixed upper-left key light (rig/Gear lightW),
// plus a local light field (daylight shafts through cracks, the alcove's glow) that makes the passage dim and the alcove
// bright. Concrete pieces are prisms (irregular outline, inset top) with chipped edges and aggregate speckle anchored to
// their faces, so they hold up under a travelling camera; rebar is rusty ribbed bar; the floor carries light pools, grit
// and pebbles; dust motes drift slowly in the shafts.
//
// World layout. The route is laid out in ROUTE coordinates (a, b, y): `a` along the route (positive = forward, toward the
// person), `b` across it (positive = to the right when facing forward), y up. rw(a, b, y) converts to world. The route
// ends at the GAP (a = 0) = world [470, 0, -60] and heads toward world -x/+z (ROUTE_THETA = 25 deg off -x toward +z),
// i.e. it arrives at the gap from the +x side and the gap opens toward the person's near hand (SHOT_SPECS coordination
// note). The person (ALCOVE) lies prone along world x, head toward +x, elbow midpoint at the world origin.
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, Frame, add, sub, mul, dot, norm, cross, toW, toL, dirW, len, ypr} from '../lib/v3';
import {fmt, polyPath, convexHull, closedPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {clamp, rnd, noise1, smoother} from '../lib/ease';
import {lightW} from '../rig/Gear';

// ---------------------------------------------------------------------------------------------------------------
// Palette and light
// ---------------------------------------------------------------------------------------------------------------
export const RUB = {
  concrete: '#9C9590',
  concreteDeep: '#7E7772',
  concreteLight: '#B8B0A6',
  crevice: '#3A3633',
  /** the deepest gaps: very dark warm, never black */
  void: '#231D1A',
  floor: '#8E867E',
  rebar: '#8A4B2E',
  rebarLight: '#C07A52',
  rebarDeep: '#5B2F1E',
  dust: '#C9BFAF',
  day: '#FFE8B8',
  dayHot: '#FFF6E2',
};
/** the daylight's direction of travel (world): down, and in the S12 route view from above-right (also from above-right
 *  in a view from the person's right side looking -z) */
export const DAY: V3 = norm([-0.45, -1, 0.35]);

const DEG = Math.PI / 180;
export const ROUTE_THETA = 25 * DEG;
/** route forward (unit, world) and route right */
export const RF: V3 = [-Math.cos(ROUTE_THETA), 0, Math.sin(ROUTE_THETA)];
export const RR: V3 = [-RF[2], 0, RF[0]];
export const GAP: V3 = [470, 0, -60];
/** route coordinates -> world */
export const rw = (a: number, b: number, y = 0): V3 => [GAP[0] + RF[0] * a + RR[0] * b, y, GAP[2] + RF[2] * a + RR[2] * b];
/** world -> route coordinates [a, b, y] */
export const toRoute = (p: V3): V3 => {
  const d = sub(p, GAP);
  return [dot(d, RF), dot(d, RR), p[1]];
};
/** yaw (rig/roach convention: 0 = +x, body z = right) of an insect walking along the route */
export const ROUTE_YAW = Math.atan2(-RF[2], RF[0]);

/** The trapped person's alcove (world mm). She lies PRONE along world x, propped on her forearms, head toward +x, facing
 *  +x (toward the gap and the passage mouth the insect comes from). Values follow the Weird Crew survivor rig
 *  (crew/person/survivorRig.ts, 1 u = 3.745 mm): elbows on the floor at z = +-217 (right elbow +z), shoulders ~367 mm up
 *  and 45 mm behind the elbows, head centre ~640 mm up, head radius ~217 mm; right forearm straight ahead to the wrist at
 *  about [287, 56, 166], left forearm angled in to about [203, 56, -7]. `clear` is the volume S12 keeps free for her. */
export const ALCOVE = {
  anchor: [0, 0, 0] as V3, // floor point midway between her elbows (the rig's anchor)
  facing: [1, 0, 0] as V3,
  hand: [215, 0, 40] as V3, // coordination note's near-hand point (her right hand lies near [287, 0, 166] in the rig)
  head: [60, 640, 0] as V3,
  headR: 217,
  chin: [150, 430, 0] as V3,
  shoulders: [[-45, 367, 232], [-45, 367, -232]] as V3[],
  elbows: [[0, 56, 217], [0, 56, -217]] as V3[],
  wrists: [[287, 56, 166], [203, 56, -7]] as V3[],
  pelvis: [-375, 100, 0] as V3,
  gap: GAP,
  /** world-space box she occupies (x, y, z ranges) */
  clear: {x: [-1200, 330], y: [0, 870], z: [-330, 330]},
  mmPerU: 1000 / 267,
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
  let c = k >= 0 ? lit(base, 0.24 * k) : shade(base, -0.34 * k);
  const l = lightAt(L, p);
  c = mix(RUB.void, c, clamp(0.12 + 0.88 * Math.min(1.05, l)));
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
};

type Speck = {p: V3; r: number; c: number};
type FaceL = {pts: V3[]; n: V3; specks: Speck[]; cap: 'top' | 'bot' | null; chips: V3[][]};
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
  const T: V3[] = out.map(([x, z]) => [cx + k * (x - cx) + sx, d.h, cz + k * (z - cz) + sz]);
  const dens = (d.tex ?? 1) * 0.07; // speckles per mm^2 (before the cap)
  let sid = 0;
  const specks = (area: number, sample: (i: number) => V3 | null): Speck[] => {
    const N = Math.min(SPECK_MAX, Math.round(area * dens));
    const s: Speck[] = [];
    for (let i = 0; i < N * 1.6 && s.length < N; i++) {
      const p = sample(i);
      if (!p) continue;
      const q = rnd(i, d.seed * 3.1 + sid);
      const big = q > 0.86;
      s.push({p, r: big ? 0.55 + 1.3 * rnd(i, d.seed + sid + 5) : 0.18 + 0.32 * rnd(i, d.seed + sid + 9), c: big ? (q > 0.95 ? 2 : 1) : 0});
    }
    sid += 17;
    return s;
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
    faces.push({pts, n: nn, specks: sp, cap: null, chips: []});
  }
  const capSpecks = (P: V3[], y: number, seed: number) => {
    const xs = P.map((p) => p[0]), zs = P.map((p) => p[2]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const poly = P.map((p) => [p[0], p[2]] as [number, number]);
    const area = Math.abs(polyArea2(poly));
    return specks(area, (m) => {
      const q: [number, number] = [x0 + (x1 - x0) * rnd(m, seed), z0 + (z1 - z0) * rnd(m, seed + 1.7)];
      return inPoly2(q, poly) ? [q[0], y, q[1]] : null;
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
  faces.push({pts: T, n: [0, 1, 0], specks: capSpecks(T, d.h, d.seed + 50), cap: 'top', chips: chipsOn(T, 1, nc, d.seed + 60)});
  faces.push({pts: [...B].reverse(), n: [0, -1, 0], specks: capSpecks(B, 0, d.seed + 70), cap: 'bot', chips: chipsOn(B, 1, nc, d.seed + 80)});
  return {faces, h: d.h, base: B};
};
const geoOf = (d: ChunkDef) => {
  const k = `${d.key}|${d.seed}|${d.h}|${d.rx}|${d.rz}|${d.n}|${d.jag}|${d.k}|${d.tex}|${d.chips}|${d.outline ? d.outline.length : 0}`;
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
    if (f.cap === 'top' ? eL[1] <= g.h : f.cap === 'bot' ? eL[1] >= 0 : dot(f.n, sub(eL, f.pts[0])) <= 0) continue;
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
              if (q[0] < -20 || q[0] > 1100 || q[1] < -20 || q[1] > 1940) return null;
              const col = s.c === 0 ? shade(c1, 0.42) : s.c === 1 ? lit(c0, 0.28) : mix(c0, '#A4876F', 0.5);
              return <circle key={si} cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(Math.min(r, 40))} fill={col} opacity={s.c === 0 ? 0.55 : 0.7} />;
            })}
          </g>
        )}
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
export const DustShaft: React.FC<{cam: Cam; b: Beam; id: string; alpha?: number; toY?: number}> = ({cam, b, id, alpha = 0.34, toY = 0}) => {
  const {top, bottom} = beamPrism(b, toY);
  const all = [...top, ...bottom];
  if (all.some((p) => depth(cam, p) < NEAR + 2)) {
    // the camera is inside or next to the beam: draw it as a soft screen-space haze instead
    return null;
  }
  const S = all.map((p) => proj(cam, p));
  const hull = convexHull(S);
  if (!onScreen(hull, 200)) return null;
  const tc = proj(cam, cen3(top)), bc = proj(cam, cen3(bottom));
  const w = Math.max(...top.map((p) => len(sub(p, cen3(top))))) * scaleAt(cam, cen3(top));
  const blur = clamp(w * 0.28, 3, 40);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={fmt(tc[0])} y1={fmt(tc[1])} x2={fmt(bc[0])} y2={fmt(bc[1])}>
          <stop offset="0" stopColor={RUB.dayHot} stopOpacity={alpha} />
          <stop offset="0.55" stopColor={RUB.day} stopOpacity={alpha * 0.62} />
          <stop offset="1" stopColor={RUB.day} stopOpacity={alpha * 0.35} />
        </linearGradient>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={-400} y={-400} width={1880} height={2720}>
          <feGaussianBlur stdDeviation={fmt(blur)} />
        </filter>
      </defs>
      <path d={polyPath(hull)} fill={`url(#${id}-g)`} filter={`url(#${id}-f)`} />
      <path d={polyPath(convexHull([...top.map((p) => proj(cam, p)), ...top.map((p) => proj(cam, add(p, mul(b.dir ?? DAY, 60))))]))} fill={RUB.dayHot} opacity={alpha * 0.6} filter={`url(#${id}-f)`} />
    </g>
  );
};

export type MoteField = {key: string; box: [V3, V3]; n: number; seed: number; drift: V3; L: Lights; size?: number; ambient?: number};
/** slowly drifting dust: bright where a beam lights it, faint elsewhere; positions wrap inside the box with a fade at its
 *  ends (no pops) */
export const DustMotes: React.FC<{cam: Cam; m: MoteField; t: number; id: string}> = ({cam, m, t, id}) => {
  const [lo, hi] = m.box;
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
    const p = add(lo, w);
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
// The route layout (S12; the alcove side is shared with the integrator's S13-S15 alcove)
// ---------------------------------------------------------------------------------------------------------------
/** passage ceiling: the underside height at route point (a, b); it slopes down toward the mouth (the lip) */
export const LIP_A = -200;
export const ceilingY = (a: number, b: number) => 100 + (LIP_A - a) * 0.085 - b * 0.05;
const CEIL_PITCH = -Math.atan(0.085), CEIL_ROLL = Math.atan(0.05);
/** ragged slab outline (local x forward, z right), with a broken front edge at x = front */
const slabOutline = (back: number, front: number, left: number, right: number, seed: number, rag = 14): [number, number][] => {
  const pts: [number, number][] = [];
  const nF = 11;
  pts.push([back, left], [back, right]);
  for (let i = 0; i <= nF; i++) {
    const z = right + ((left - right) * i) / nF;
    const dx = (rnd(i, seed) - 0.5) * 2 * rag + (i % 2 ? -rag * 0.4 : rag * 0.25);
    pts.push([front + dx, z]);
  }
  return pts;
};
/** the passage ceiling (the collapsed floor slab above): two slabs either side of a crack at a = -342 .. -326 */
export const CRACK_A = -334;
export const CEILING: ChunkDef[] = [
  {key: 'ceilA', a: -560, b: 0, y: ceilingY(-560, 0), pitch: CEIL_PITCH, roll: CEIL_ROLL, outline: slabOutline(-520, 214, -340, 320, 11, 6), h: 90, k: 1, seed: 101, tone: RUB.concreteDeep, tex: 0.32, chips: 4},
  {key: 'ceilB', a: -260, b: 0, y: ceilingY(-260, 0), pitch: CEIL_PITCH, roll: CEIL_ROLL, outline: slabOutline(-62, 60, -340, 320, 12, 12), h: 90, k: 1, seed: 102, tone: RUB.concreteDeep, tex: 0.4, chips: 5},
];
/** the daylight crack's opening over the right half of the passage (world), and the beam through it */
export const PASSAGE_BEAM: Beam = {
  key: 'pbeam',
  crack: [rw(CRACK_A - 6, 38, ceilingY(CRACK_A, 38)), rw(CRACK_A + 8, 46, ceilingY(CRACK_A, 46)), rw(CRACK_A + 10, 128, ceilingY(CRACK_A, 128)), rw(CRACK_A - 5, 122, ceilingY(CRACK_A, 122))],
  k: 0.95,
  r: 16,
};
/** the alcove's wide shaft: through a break in the high roof above the passage mouth onto her face and forearms */
export const ALCOVE_BEAM: Beam = {
  key: 'abeam',
  crack: [-150, -60, 60, 40].map((db, i) => {
    const c = add([200, 560, 30], mul(DAY, -560 / -DAY[1] * -1));
    void c;
    // a quad centred on the line through her face along DAY, at y = 1150
    const axisPt: V3 = [130, 470, 40];
    const top = add(axisPt, mul(DAY, -(1150 - axisPt[1]) / -DAY[1]));
    const u = norm(cross(DAY, [0, 1, 0]));
    const v = norm(cross(u, DAY));
    const da = i < 2 ? -1 : 1;
    return add(top, add(mul(u, db * 1.1), mul(v, da * 90)));
  }),
  k: 1.15,
  r: 170,
};

/** passage walls, forecourt piles and the gap (all drawn in front of the person) */
export const WALLS: ChunkDef[] = (() => {
  const L: ChunkDef[] = [];
  // left wall: big blocks and leaning pieces from a = -720 to the mouth
  const left: [number, number, number, number, number, number][] = [
    // a, b, rx, rz, h, yaw
    [-700, -150, 70, 60, 150, 0.3],
    [-610, -128, 50, 42, 128, -0.2],
    [-535, -122, 38, 34, 96, 0.5],
    [-470, -138, 52, 40, 132, 0.1],
    [-395, -116, 36, 30, 90, -0.4],
    [-330, -132, 48, 44, 126, 0.25],
    [-262, -120, 40, 34, 96, -0.15],
    [-205, -146, 52, 46, 118, 0.4],
  ];
  left.forEach(([a, b, rx, rz, h, yaw], i) => L.push({key: `wl${i}`, a, b, rx, rz, h, yaw, n: 9, seed: 200 + i * 11, k: 0.8, shift: [rnd(i, 5) * 6 - 3, 4], tone: i % 3 === 1 ? RUB.concreteDeep : RUB.concrete, chips: 3}));
  const right: [number, number, number, number, number, number][] = [
    [-690, 150, 60, 64, 140, -0.2],
    [-600, 126, 44, 40, 118, 0.35],
    [-528, 118, 34, 34, 86, -0.1],
    [-455, 130, 48, 44, 120, 0.2],
    [-382, 112, 30, 28, 70, 0.6],
    [-300, 134, 44, 38, 112, -0.3],
    [-236, 124, 34, 30, 84, 0.15],
  ];
  right.forEach(([a, b, rx, rz, h, yaw], i) => L.push({key: `wr${i}`, a, b, rx, rz, h, yaw, n: 9, seed: 300 + i * 13, k: 0.8, shift: [rnd(i, 6) * 6 - 3, -4], tone: i % 3 === 2 ? RUB.concreteDeep : RUB.concrete, chips: 3}));
  // forecourt piles beyond the mouth (left and right of the route), rising toward the alcove walls
  const piles: [number, number, number, number, number, number, number][] = [
    [-150, -180, 62, 50, 140, 0.2, 0],
    [-92, -236, 70, 60, 210, -0.3, 0],
    [-120, 196, 58, 54, 150, 0.4, 0],
    [-60, 262, 74, 66, 240, -0.1, 0],
    [60, -300, 110, 90, 380, 0.2, 0],
    [40, 330, 100, 90, 300, -0.2, 0],
  ];
  piles.forEach(([a, b, rx, rz, h, yaw], i) => L.push({key: `fp${i}`, a, b, rx, rz, h, yaw, n: 10, seed: 400 + i * 17, k: 0.74, tone: i % 2 ? RUB.concreteDeep : RUB.concrete, chips: 4, tex: 0.8}));
  // the gap: a low broken block either side of the route at a = 0
  L.push({key: 'gapL', a: 2, b: -100, rx: 52, rz: 48, h: 46, yaw: 0.15, n: 9, seed: 501, k: 0.78, shift: [0, 6], chips: 4});
  L.push({key: 'gapR', a: -6, b: 104, rx: 50, rz: 50, h: 62, yaw: -0.35, n: 9, seed: 502, k: 0.76, shift: [-4, -6], chips: 4, tone: RUB.concrete});
  return L;
})();

/** pebbles and small pieces on the passage floor (kept off the insect's track |b| < 40) */
export const PEBBLES: ChunkDef[] = (() => {
  const P: ChunkDef[] = [];
  let k = 0;
  for (let i = 0; i < 70; i++) {
    const a = -720 + 760 * rnd(i, 601);
    const side = rnd(i, 602) > 0.5 ? 1 : -1;
    const b = side * (44 + 70 * Math.pow(rnd(i, 603), 1.4));
    const s = 2.5 + 11 * Math.pow(rnd(i, 604), 2.2);
    P.push({key: `pb${k++}`, a, b, rx: s, rz: s * (0.6 + 0.5 * rnd(i, 605)), h: s * (0.45 + 0.5 * rnd(i, 606)), yaw: rnd(i, 607) * 3, roll: (rnd(i, 608) - 0.5) * 0.5, pitch: (rnd(i, 609) - 0.5) * 0.4, n: 6 + Math.floor(rnd(i, 610) * 3), seed: 700 + i * 7, k: 0.7, tex: 0.6, chips: 1, tone: rnd(i, 611) > 0.6 ? RUB.concreteLight : RUB.concrete});
  }
  return P;
})();

export const REBAR: RebarDef[] = [
  // from the mouth's lip, bent down on the left and on the right
  {key: 'rl1', pts: [rw(LIP_A - 24, -96, ceilingY(LIP_A - 24, -96) + 30), rw(LIP_A + 8, -100, ceilingY(LIP_A, -100) + 22), rw(LIP_A + 26, -108, 70), rw(LIP_A + 40, -112, 38)], r: 2.1},
  {key: 'rl2', pts: [rw(LIP_A - 30, -66, ceilingY(LIP_A, -66) + 40), rw(LIP_A + 2, -64, ceilingY(LIP_A, -64) + 46), rw(LIP_A + 22, -70, ceilingY(LIP_A, -64) + 70), rw(LIP_A + 30, -76, ceilingY(LIP_A, -64) + 110)], r: 1.8},
  {key: 'rr1', pts: [rw(LIP_A - 20, 92, ceilingY(LIP_A, 92) + 26), rw(LIP_A + 12, 94, ceilingY(LIP_A, 94) + 16), rw(LIP_A + 30, 104, 62), rw(LIP_A + 38, 112, 22)], r: 2.1},
  // along the crack (exposed in the break)
  {key: 'rc1', pts: [rw(CRACK_A - 3, -150, ceilingY(CRACK_A, -150) + 36), rw(CRACK_A + 4, -40, ceilingY(CRACK_A, -40) + 40), rw(CRACK_A - 8, 10, ceilingY(CRACK_A, 10) + 14), rw(CRACK_A - 12, 24, ceilingY(CRACK_A, 24) - 14)], r: 1.7},
  // lying on the floor along the left wall
  {key: 'rf1', pts: [rw(-640, -78, 2), rw(-560, -86, 2), rw(-470, -80, 2), rw(-430, -66, 10)], r: 1.7},
  // sticking out of a right wall block
  {key: 'rw1', pts: [rw(-470, 108, 70), rw(-430, 92, 80), rw(-400, 86, 104)], r: 1.6},
];

/** the alcove's walls and roof pieces behind and beside the person (drawn BEFORE her) */
export const ALCOVE_BACK: ChunkDef[] = [
  // the back: a big leaning slab behind her, and blocks beyond her shoulders
  {key: 'ab1', w: [-520, 0, 120], yaw: 0.3, pitch: 0.95, roll: 0.05, outline: slabOutline(-120, 640, -460, 440, 21, 24), h: 110, k: 1, seed: 801, tone: RUB.concreteDeep, tex: 0.25, chips: 5},
  {key: 'ab2', w: [-260, 0, -560], yaw: 0.6, rx: 210, rz: 160, h: 520, n: 10, seed: 802, k: 0.7, tex: 0.4, chips: 4},
  {key: 'ab3', w: [-140, 0, 560], yaw: -0.4, rx: 190, rz: 170, h: 470, n: 10, seed: 803, k: 0.72, tex: 0.4, chips: 4, tone: RUB.concreteDeep},
  {key: 'ab4', w: [180, 0, -520], yaw: 0.2, rx: 120, rz: 110, h: 260, n: 9, seed: 804, k: 0.74, tex: 0.6, chips: 4},
  {key: 'ab5', w: [260, 0, 470], yaw: 0.9, rx: 110, rz: 90, h: 200, n: 9, seed: 805, k: 0.74, tex: 0.6, chips: 4, tone: RUB.concreteLight},
  // high on the left: a slab end jutting in (the alcove roof's broken edge)
  {key: 'ab6', w: [-100, 880, -300], yaw: 0.4, pitch: -0.25, roll: 0.15, outline: slabOutline(-500, 220, -260, 300, 23, 30), h: 120, k: 1, seed: 806, tone: RUB.concreteDeep, tex: 0.25, chips: 5},
];

/** the S12 lights: low ambient in the passage, the crack's beam, the alcove's shaft and the alcove glow */
export const RUBBLE_LIGHTS: Lights = {
  amb: 0.4,
  beams: [PASSAGE_BEAM, ALCOVE_BEAM],
  glows: [
    {p: [160, 380, 20], r: 620, k: 0.55},
    {p: rw(-80, 0, 40), r: 220, k: 0.28},
  ],
};
