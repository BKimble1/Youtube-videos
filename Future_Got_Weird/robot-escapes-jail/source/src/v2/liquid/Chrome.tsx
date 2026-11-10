// V2 liquid-metal engine: the toon-chrome body (FGW Weird Crew finish), drawn entirely from ONE signed-distance field.
//
// buildChrome() samples the smooth union of the prims (plus each group's own fold, a depth field and a "flat" field)
// on an adaptive lattice over the body's bounding box. From the field it derives a toon SURFACE NORMAL at every node
// (direction = the field gradient, tilt = 1 - insideDistance / rho: a rounded section of radius rho), looks the
// normal up in a stylised ENVIRONMENT (sky above, a dark navy horizon, a darker reflected floor below, a key light at
// the upper left) and quantises it into hard-edged toon regions, each marched into a crisp evenodd path:
//   base      the silhouette: cool blue-grey mid-tone + navy INK at constant on-screen width
//   sky/hot   the bright sky reflection on upward-facing surface (hard edge), white-hot where it faces the key light
//   band      the dark navy horizon line just below the equator of every section (bends with the shape)
//   floor/low the darker reflected floor below the horizon, lighter toward the lower edge (floor bounce)
//   core      a cool shadow overlay on the side away from the key light
//   rim / lip a thin bright rim on the lit edge, a thin cool lip on the lower edge
//   spec      sharp white glints where the normal meets the key light's half vector (a spot on a dome, a streak on a limb)
//   env       a coloured reflection (alarm red, lab blue) on the edge facing the env light; warm heat from below
// FLAT regions (prims with flat = 1: puddles / pools on the floor) are shaded as a floor MIRROR instead: dark
// reflected surroundings, a bright meniscus edge (hot on the far edge) and a few sky streaks.
// Rigid bodies built from several groups (robot parts) shade each part with its OWN field where it is the front-most
// part (hard reflection edges between parts) and get ink seams; all scaled by the group's `rigid` 0..1, so as a region
// softens it turns continuously into one liquid surface (no opacity fades). Every layer is an isoline of a field derived
// from the same SDF, so reflections stay glued to the deforming surface and every frame is valid geometry.
import React from 'react';
import {C, INK, INK_FEAT, INK_PX} from '../../art/palette';
import {uid} from '../../core/ids';
import {mix} from '../../core/color';
import {clamp, noise1} from '../../lib';
import {Box, Prim, primBox, primFlat, primZ, sdPrim, smin, sminW} from './sdf';
import {bilerp, cellFor, Lattice, lattice, loopsArea, loopsPath, marchLoops} from './march';

export type V = {x: number; y: number};
export const LIGHT: V = {x: -0.6, y: -0.8};
export const FRAME_BOX: Box = {x0: -60, y0: -60, x1: 1140, y1: 1980};

export type ChromeEnv = {tint: string; amt: number; dir?: V};
export type Glow = {x: number; y: number; r: number; color: string; amt: number};
export type DepthSplit = {d0: number; part: 'back' | 'front'; overlap?: number};
export type FloorOpts = {y: number; shadow?: number; reflect?: number; squash?: number; cx?: number; rx?: number};

export type ChromeOpts = {
  /** union blend radius (px) for prims without their own blend; also the default group blend */
  blend: number;
  /** blend (px) used when group g is folded into the union (ascending g) */
  groupBlend?: number[];
  /** per-group internal definition 0 (liquid) .. 1 (rigid part with seams + own shading). Default: none. */
  rigid?: number[];
  /** per-group section radius (px) of a rigid part's rounding; default R */
  groupR?: number[];
  /** per-group horizon strength 0..1 (default 1; 0: no dark horizon on that part, e.g. thin limbs) */
  groupBand?: number[];
  /** section radius (px) of the liquid surface's rounding (how domed it looks). Default from the body's area. */
  R?: number;
  cell?: number;
  light?: V;
  /** horizon band strength 0..1 (default 1) */
  band?: number;
  /** number of speculars 0..3 (default 2) */
  specs?: number;
  /** clip the evaluation box (default: the frame + 60 px) */
  clip?: Box;
  /** horizon height offset (normal units, + raises the horizon). Default 0 */
  horizon?: number;
  /** per-group horizon offset (normal units, - lowers the horizon / floor on that part, e.g. below a face's eyes) */
  groupHorizon?: number[];
};

export type ChromeGeo = {
  box: Box;
  L: Lattice;
  R: number;
  area: number;
  bbox: Box;
  sil: string;
  layers: {key: string; d: string}[];
  seams: {d: string; w: number; clip: string | null}[];
  zf: Float32Array | null;
  f: Float32Array;
  light: V;
  /** toon normal per node (x right, y UP), tilt 0 (facing the viewer) .. 1 (edge-on) */
  nx: Float32Array;
  ny: Float32Array;
  /** flat attribute per node (null: no flat prims) */
  fl: Float32Array | null;
};

// ---------------------------------------------------------------------------------------------------------------
type Term = {a: Float32Array; dx: number; dy: number; lv: number; s: 1 | -1};

const regionField = (L: Lattice, terms: Term[]): Float32Array => {
  const {nx, ny, cell} = L;
  const out = new Float32Array(nx * ny);
  out.fill(-1e9);
  for (const t of terms) {
    const oi = t.dx / cell, oj = t.dy / cell;
    const plain = Math.abs(oi) < 1e-6 && Math.abs(oj) < 1e-6;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const v = plain ? t.a[k] : sampX(t.a, L, i + oi, j + oj);
        const w = t.s * (v - t.lv);
        if (w > out[k]) out[k] = w;
      }
    }
  }
  return out;
};
/** bilinear sample at fractional node coords; outside the lattice the field keeps growing with the distance (px) */
const sampX = (a: Float32Array, L: Lattice, fi: number, fj: number) => {
  const {nx, ny, cell} = L;
  const ci = fi < 0 ? 0 : fi > nx - 1 ? nx - 1 : fi;
  const cj = fj < 0 ? 0 : fj > ny - 1 ? ny - 1 : fj;
  const v = bilerp(a, nx, ny, ci, cj);
  const ex = Math.hypot(fi - ci, fj - cj);
  return ex > 0 ? v + ex * cell : v;
};
const regionPath = (L: Lattice, terms: Term[], minArea = 2) => loopsPath(marchLoops(regionField(L, terms), L, 0), minArea);

// ---------------------------------------------------------------------------------------------------------------
// sampling: union field, per-group folds, depth, flat
type Sampled = {L: Lattice; f: Float32Array; fg: Float32Array[]; z: Float32Array | null; fl: Float32Array | null; groups: number[]};

const sampleBody = (prims: Prim[], o: {blend: number; groupBlend?: number[]}, box: Box, cell: number, withZ: boolean, withGroups: boolean): Sampled => {
  const L = lattice(box, cell);
  const {nx, ny} = L;
  const groupIds = Array.from(new Set(prims.map((p) => p.g ?? 0))).sort((a, b) => a - b);
  const byG = groupIds.map((g) => prims.filter((p) => (p.g ?? 0) === g));
  const bxs = byG.map((ps) => ps.map(primBox));
  const fls = byG.map((ps) => ps.map(primFlat));
  const withF = prims.some((p) => primFlat(p) > 0.001);
  const N = nx * ny;
  const f = new Float32Array(N);
  const fg = withGroups ? groupIds.map(() => new Float32Array(N)) : [];
  const z = withZ ? new Float32Array(N) : null;
  const fl = withF ? new Float32Array(N) : null;
  const gb = groupIds.map((g) => o.groupBlend?.[g] ?? o.blend);
  for (let j = 0; j < ny; j++) {
    const y = L.y0 + j * L.cell;
    for (let i = 0; i < nx; i++) {
      const x = L.x0 + i * L.cell;
      let U = 1e9, Uz = 0, Uf = 0, first = true;
      for (let gi = 0; gi < byG.length; gi++) {
        const ps = byG[gi], bs = bxs[gi], ff = fls[gi];
        let A = 1e9, Az = 0, Af = 0, fa = true;
        for (let q = 0; q < ps.length; q++) {
          const p = ps[q];
          const k = p.blend ?? o.blend;
          const b = bs[q];
          if (!fa) {
            // cull: a lower bound of the prim distance is the distance to its bounds; a culled prim (d >= A + k) has
            // zero smooth-min weight, so attributes (depth, flat) are unaffected too
            const ddx = x < b.x0 ? b.x0 - x : x > b.x1 ? x - b.x1 : 0;
            const ddy = y < b.y0 ? b.y0 - y : y > b.y1 ? y - b.y1 : 0;
            if ((ddx > 0 || ddy > 0) && Math.hypot(ddx, ddy) >= A + k) continue;
          }
          const d = sdPrim(p, x, y);
          if (fa) {
            A = d;
            if (withZ) Az = primZ(p, x, y);
            if (withF) Af = ff[q];
            fa = false;
            continue;
          }
          if (withZ || withF) {
            const w = sminW(A, d, Math.max(k, 1e-3));
            if (withZ) Az += (primZ(p, x, y) - Az) * w;
            if (withF) Af += (ff[q] - Af) * w;
          }
          A = smin(A, d, k);
        }
        if (withGroups) fg[gi][j * nx + i] = A;
        if (first) {
          U = A;
          Uz = Az;
          Uf = Af;
          first = false;
        } else {
          if (withZ || withF) {
            const w = sminW(U, A, Math.max(gb[gi], 1e-3));
            if (withZ) Uz += (Az - Uz) * w;
            if (withF) Uf += (Af - Uf) * w;
          }
          U = smin(U, A, gb[gi]);
        }
      }
      f[j * nx + i] = U;
      if (z) z[j * nx + i] = Uz;
      if (fl) fl[j * nx + i] = Uf;
    }
  }
  return {L, f, fg, z, fl, groups: groupIds};
};

/** central-difference gradient of a lattice field (px / px) */
const gradOf = (a: Float32Array, L: Lattice) => {
  const {nx, ny, cell} = L;
  const gx = new Float32Array(nx * ny), gy = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const j0 = j > 0 ? j - 1 : j, j1 = j < ny - 1 ? j + 1 : j;
    for (let i = 0; i < nx; i++) {
      const i0 = i > 0 ? i - 1 : i, i1 = i < nx - 1 ? i + 1 : i;
      const k = j * nx + i;
      gx[k] = (a[j * nx + i1] - a[j * nx + i0]) / ((i1 - i0) * cell || 1);
      gy[k] = (a[j1 * nx + i] - a[j0 * nx + i]) / ((j1 - j0) * cell || 1);
    }
  }
  return {gx, gy};
};

// exact Euclidean distance transform (Felzenszwalb-Huttenlocher), squared distances in cells
const INF = 1e20;
const edt1 = (f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) => {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};
/** separable box blur (radius r nodes, clamp-to-edge), in place, `passes` times */
const boxBlur = (a: Float32Array, nx: number, ny: number, r: number, passes = 2) => {
  if (r < 1) return a;
  const tmp = new Float32Array(Math.max(nx, ny));
  const w = 2 * r + 1;
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < ny; j++) {
      const o = j * nx;
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += a[o + Math.min(nx - 1, Math.max(0, i))];
      for (let i = 0; i < nx; i++) {
        tmp[i] = acc / w;
        acc += a[o + Math.min(nx - 1, i + r + 1)] - a[o + Math.max(0, i - r)];
      }
      for (let i = 0; i < nx; i++) a[o + i] = tmp[i];
    }
    for (let i = 0; i < nx; i++) {
      let acc = 0;
      for (let j = -r; j <= r; j++) acc += a[Math.min(ny - 1, Math.max(0, j)) * nx + i];
      for (let j = 0; j < ny; j++) {
        tmp[j] = acc / w;
        acc += a[Math.min(ny - 1, j + r + 1) * nx + i] - a[Math.max(0, j - r) * nx + i];
      }
      for (let j = 0; j < ny; j++) a[j * nx + i] = tmp[j];
    }
  }
  return a;
};
/** the TRUE inside distance of the region a < 0 (px; negative outside = the field itself), lightly smoothed so the
 *  medial ridges round off: a smooth-min union's interior is not a distance (internal ridges between its prims) and
 *  would scatter the reflections; this is the clean "inflated" height the normals come from. */
const insideDist = (a: Float32Array, L: Lattice, blurPx: number) => {
  const {nx, ny, cell} = L;
  const N = nx * ny;
  const sq = new Float64Array(N);
  for (let k = 0; k < N; k++) sq[k] = a[k] < 0 ? INF : 0;
  const n = Math.max(nx, ny);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) f[j] = sq[j * nx + i];
    edt1(f, ny, d, v, z);
    for (let j = 0; j < ny; j++) sq[j * nx + i] = d[j];
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) f[i] = sq[j * nx + i];
    edt1(f, nx, d, v, z);
    for (let i = 0; i < nx; i++) sq[j * nx + i] = d[i];
  }
  const g = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const fv = -a[k];
    if (fv <= 0) {
      g[k] = fv;
      continue;
    }
    const ge = Math.sqrt(sq[k]) * cell - 0.5 * cell;
    const u = Math.min(1, Math.max(0, (fv - cell) / (2 * cell)));
    const w = u * u * (3 - 2 * u);
    g[k] = fv + (Math.max(ge, fv * 0.5) - fv) * w;
  }
  return boxBlur(g, nx, ny, Math.round(blurPx / cell), 2);
};

// ---------------------------------------------------------------------------------------------------------------
// the stylised environment (normal units; y up). E = "reflected elevation": + sky, 0 horizon, - floor.
export const ENV = {
  sky: 0.3, // E above: sky
  hot: 0.6, // E above (and lit): white-hot sky
  band0: -0.27, // horizon band [band0, band1]
  band1: -0.07,
  low: -0.66, // E below: the lighter near floor
  core: -0.36, // n.L below: core shadow
};

// ---------------------------------------------------------------------------------------------------------------
// cache (back + front passes of one body in one frame share the geometry; pure, so caching is safe)
const CACHE = new Map<string, ChromeGeo>();
const r2 = (n: number) => Math.round(n * 100) / 100;
const keyOf = (prims: Prim[], o: ChromeOpts, extra: string) =>
  prims.map((p) => Object.entries(p).map(([k, v]) => k + (typeof v === 'number' ? r2(v) : typeof v === 'object' ? JSON.stringify(v) : v)).join(',')).join('|') + '#' + JSON.stringify(o) + extra;

const inter = (a: Box, b: Box): Box => ({x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1)});
const boundsOf = (prims: Prim[]): Box => {
  let bb: Box = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
  for (const p of prims) {
    const b = primBox(p);
    bb = {x0: Math.min(bb.x0, b.x0), y0: Math.min(bb.y0, b.y0), x1: Math.max(bb.x1, b.x1), y1: Math.max(bb.y1, b.y1)};
  }
  return bb;
};

/** build the chrome body geometry (all paths). withZ: also sample the depth field (for depthSplit clip paths). */
export const buildChrome = (prims: Prim[], o: ChromeOpts, withZ = false): ChromeGeo | null => {
  if (!prims.length) return null;
  const key = keyOf(prims, o, withZ ? 'z' : '');
  const hit = CACHE.get(key);
  if (hit) return hit;
  const bb = boundsOf(prims);
  const size = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
  const R0 = o.R ?? Math.max(6, Math.sqrt((bb.x1 - bb.x0) * (bb.y1 - bb.y0)) * 0.35);
  const pad = Math.max(12, R0 * 0.25 + 10);
  let box: Box = {x0: bb.x0 - pad, y0: bb.y0 - pad, x1: bb.x1 + pad, y1: bb.y1 + pad};
  box = inter(box, o.clip ?? FRAME_BOX);
  if (box.x1 - box.x0 < 4 || box.y1 - box.y0 < 4) return null;
  const cell = o.cell ?? cellFor(Math.min(size, Math.max(box.x1 - box.x0, box.y1 - box.y0)));
  const withGroups = !!o.rigid && o.rigid.some((r) => r > 0.01);
  const S = sampleBody(prims, o, box, cell, withZ, withGroups);
  const L = S.L;
  const N = L.nx * L.ny;
  const silLoops = marchLoops(S.f, L, 0);
  const area = loopsArea(silLoops);
  const R = o.R ?? Math.max(6, Math.sqrt(area / Math.PI) * 0.9);
  const lt = o.light ?? LIGHT;
  const ln = Math.hypot(lt.x, lt.y) || 1;
  const lx = lt.x / ln, ly = lt.y / ln;
  const Lux = lx, Luy = -ly; // the key light in y-up normal space
  const f = S.f;
  const rig = o.rigid ?? [];
  const rhoG = S.groups.map((g) => (withGroups ? clamp(rig[g] ?? 0) : 0));
  const RG = S.groups.map((g) => o.groupR?.[g] ?? R);
  const BG = S.groups.map((g) => clamp(o.groupBand?.[g] ?? 1));
  const HG = S.groups.map((g) => o.groupHorizon?.[g] ?? 0);
  // ---- toon normals from the smoothed true inside distance: the union's, or (rigid parts) the front-most part's own
  const blurOf = (rho: number) => Math.max(cell * 2, Math.min(0.2 * rho, 44));
  const gUd = insideDist(f, L, blurOf(R));
  const gU = gradOf(gUd, L);
  const gGd = S.groups.map((_, gi) => (rhoG[gi] > 0.02 ? insideDist(S.fg[gi], L, blurOf(RG[gi])) : null));
  const gG = gGd.map((a) => (a ? gradOf(a, L) : null));
  const NX = new Float32Array(N), NY = new Float32Array(N), G = new Float32Array(N), BK = new Float32Array(N), RH = new Float32Array(N), HZ = new Float32Array(N);
  const bandAll = clamp(o.band ?? 1);
  for (let k = 0; k < N; k++) {
    let gin = gUd[k], gx = -gU.gx[k], gy = -gU.gy[k], rho = R, bk = bandAll, hzg = 0;
    if (withGroups) {
      let ow = -1;
      for (let gi = S.groups.length - 1; gi >= 0; gi--) {
        if (S.fg[gi][k] < 0) {
          ow = gi;
          break;
        }
      }
      if (ow >= 0 && rhoG[ow] > 0.02 && gG[ow]) {
        const r = rhoG[ow], gq = gG[ow]!;
        gin += (gGd[ow]![k] - gin) * r;
        gx += (-gq.gx[k] - gx) * r;
        gy += (-gq.gy[k] - gy) * r;
        rho += (RG[ow] - rho) * r;
        bk += (BG[ow] - bk) * r;
        hzg += (HG[ow] - hzg) * r;
      }
    }
    const gl = Math.hypot(gx, gy);
    if (gl > 1) {
      gx /= gl;
      gy /= gl;
    }
    const tl = clamp(1 - gin / Math.max(rho, 1e-3));
    // a round section: the normal's screen part grows toward the edge (between a cone and a dome)
    const tk = Math.sqrt(tl) * 0.35 + tl * 0.65;
    NX[k] = gx * tk;
    NY[k] = -gy * tk;
    G[k] = -f[k];
    BK[k] = bk;
    RH[k] = rho;
    HZ[k] = hzg;
  }
  // ---- environment fields (scaled to ~px by R so they combine with distance terms)
  const hz = o.horizon ?? 0;
  const mk = (fn: (k: number) => number) => {
    const out = new Float32Array(N);
    for (let k = 0; k < N; k++) out[k] = fn(k);
    return out;
  };
  const nL = (k: number) => NX[k] * Lux + NY[k] * Luy;
  // reflected elevation: up-facing -> sky, down-facing -> horizon / floor; the lit side reaches a little higher (only
  // the lit side: a vertical limb's shadow side is a clean darker mid-tone, never a ragged piece of horizon)
  const E = (k: number) => NY[k] * 0.95 + 0.16 * Math.max(0, nL(k)) - hz;
  const Ef = mk(E);
  // the horizon / floor elevation: weak-horizon parts (thin limbs) sit higher (a clean mid-tone unless clearly
  // facing down), and a part's own horizon offset moves its band (e.g. below the eyes on the face)
  const Eb = mk((k) => Ef[k] + (1 - BK[k]) * 0.14 - HZ[k]);
  const Lf = mk(nL);
  const fl = S.fl;
  const notFlat = fl ? mk((k) => (fl[k] - 0.5) * R) : null;
  const isFlat = fl ? mk((k) => (0.5 - fl[k]) * R) : null;
  const T = (a: Float32Array, lv: number, s: 1 | -1): Term => ({a, dx: 0, dy: 0, lv, s});
  const IN = (a: Float32Array, lv = 0) => T(a, lv, 1); // a < lv
  const OUT = (a: Float32Array, lv = 0) => T(a, lv, -1); // a > lv
  const sc = (a: Float32Array, k: number) => {
    const out = new Float32Array(N);
    for (let q = 0; q < N; q++) out[q] = a[q] * k;
    return out;
  };
  const Es = sc(Ef, R), Ls = sc(Lf, R), Ebs = sc(Eb, R);
  const body: Term[] = notFlat ? [IN(f), IN(notFlat)] : [IN(f)];
  const layers: {key: string; d: string}[] = [];
  const minArea = Math.max(4, area * 0.0004);
  const add = (key: string, terms: Term[], minA = minArea) => {
    const d = regionPath(L, terms, minA);
    if (d) layers.push({key, d});
  };
  // horizon strength: the band's width scales with the local band factor (thin limbs get a thin line or none)
  const bandLo = mk((k) => (ENV.band0 + (1 - BK[k]) * 0.12 - Eb[k]) * R); // < 0: E > band0'
  const bandHi = mk((k) => (Eb[k] - ENV.band1) * R); // < 0: E < band1
  // ---- body (rounded) layers, drawn in this order
  add('floor', [...body, IN(Ebs, ENV.band1 * R)]);
  add('low', [...body, IN(Ebs, ENV.low * R)]);
  add('band', [...body, IN(bandLo), IN(bandHi)]);
  add('sky', [...body, OUT(Es, ENV.sky * R)]);
  add('hot', [...body, OUT(Es, ENV.hot * R), OUT(Ls, 0.05 * R)]);
  add('core', [...body, IN(Ls, ENV.core * R)]);
  // occlusion: a part in front darkens a thin strip of the part behind it (rigid only)
  const seams: {d: string; w: number; clip: string | null}[] = [];
  if (withGroups) {
    const n = S.groups.length;
    const fronts: (Float32Array | null)[] = S.groups.map(() => null);
    let acc: Float32Array | null = null;
    for (let gi = n - 1; gi >= 0; gi--) {
      fronts[gi] = acc;
      const a = S.fg[gi];
      if (!acc) acc = a.slice();
      else {
        const m: Float32Array = acc.slice();
        for (let k = 0; k < m.length; k++) if (a[k] < m[k]) m[k] = a[k];
        acc = m;
      }
    }
    for (let gi = 0; gi < n; gi++) {
      const g = S.groups[gi];
      const rho = rhoG[gi];
      if (rho < 0.02) continue;
      const a = S.fg[gi];
      const Rg = RG[gi];
      const fr = fronts[gi];
      const own = new Float32Array(N);
      const eps = 0.08 * Rg;
      for (let q = 0; q < N; q++) own[q] = a[q] - f[q] - eps;
      const notFront = fr ? [OUT(fr), IN(own)] : [IN(own)];
      if (fr) {
        const sh = {a: fr, dx: lx * 0.14 * Rg * rho, dy: ly * 0.14 * Rg * rho, lv: 0, s: 1 as const};
        add(`g${g}occ`, [IN(a), sh, ...notFront]);
      }
      const sd = loopsPath(marchLoops(a, L, -0.5), 2);
      const clip = regionPath(L, notFront, 2) || null;
      if (sd) seams.push({d: sd, w: INK_FEAT * 1.15 * rho, clip});
    }
  }
  // thin edge lights (px widths, clamped so they stay crisp lines at any scale)
  const rimW = Math.min(0.07 * R, 7) + 1.2;
  add('lip', [...body, IN(G, Math.min(0.06 * R, 6) + 1), IN(mk((k) => NY[k] + 0.3), 0)]);
  add('rim', [...body, IN(G, rimW), OUT(Ls, 0.22 * R)]);
  // speculars: where the normal meets the key light's half vector (crisp spots / streaks)
  const nSpec = o.specs ?? 2;
  const H3 = (() => {
    const hx = Lux * 0.62, hy = Luy * 0.62, hz3 = 1;
    const l = Math.hypot(hx, hy, hz3);
    return {x: hx / l, y: hy / l, z: hz3 / l};
  })();
  const nH = mk((k) => {
    const x = NX[k], y = NY[k];
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    return x * H3.x + y * H3.y + z * H3.z;
  });
  const sp = sc(nH, R);
  if (nSpec >= 1) add('spec', [...body, OUT(sp, 0.985 * R), IN(G, 0.92 * R)]);
  if (nSpec >= 2) {
    // a second, smaller glint: the key light's reflection in the lower-right flank (bounce window)
    const H2 = {x: -H3.x * 0.8, y: -0.55, z: 0.7};
    const l2 = Math.hypot(H2.x, H2.y, H2.z);
    const n2 = mk((k) => {
      const x = NX[k], y = NY[k];
      const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      return (x * H2.x + y * H2.y + z * H2.z) / l2;
    });
    add('spec2', [...body, OUT(sc(n2, R), 0.988 * R), IN(G, 0.3 * R)]);
  }
  if (nSpec >= 3) add('spec', [...body, OUT(sp, 0.96 * R), IN(sp, 0.972 * R)]);
  // ---- flat (floor mirror) layers
  if (isFlat && fl) {
    const fb: Term[] = [IN(f), IN(isFlat)];
    add('fBase', fb);
    // pool extent (flat part only) for the sky streaks, from area MOMENTS (not the bounding box): a small island
    // appearing / vanishing hardly moves the streaks
    let m0 = 0, mx = 0, my = 0, mxx = 0, myy = 0;
    for (let j = 0; j < L.ny; j++)
      for (let i = 0; i < L.nx; i++) {
        const k = j * L.nx + i;
        if (f[k] < 0 && fl[k] > 0.5) {
          const x = L.x0 + i * L.cell, y = L.y0 + j * L.cell;
          m0++;
          mx += x;
          my += y;
          mxx += x * x;
          myy += y * y;
        }
      }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    if (m0 > 3) {
      mx /= m0;
      my /= m0;
      const sx = Math.sqrt(Math.max(0, mxx / m0 - mx * mx)), sy = Math.sqrt(Math.max(0, myy / m0 - my * my));
      x0 = mx - 2 * sx;
      x1 = mx + 2 * sx;
      y0 = my - 2 * sy;
      y1 = my + 2 * sy;
    }
    if (isFinite(x0) && x1 - x0 > 4 && y1 - y0 > 2) {
      const W = x1 - x0, Hh = y1 - y0;
      const strk = (cxk: number, cyk: number, a: number, b: number, slope: number) =>
        mk((k) => {
          const i = k % L.nx, j = (k / L.nx) | 0;
          const x = L.x0 + i * L.cell, y = L.y0 + j * L.cell;
          const cx = x0 + cxk * W, cy = y0 + cyk * Hh;
          const u = (x - cx) / (a * W), v = (y - cy + slope * (x - cx)) / Math.max(1.5, b * Hh);
          return (Math.hypot(u, v) - 1) * Math.min(a * W, 40);
        });
      const inset = Math.min(0.12 * Math.min(W, Hh * 3), 24) + 3;
      add('fStreak', [...fb, OUT(G, inset), IN(strk(0.42, 0.34, 0.34, 0.055, -0.1))]);
      add('fStreak', [...fb, OUT(G, inset), IN(strk(0.62, 0.52, 0.2, 0.04, -0.1))]);
      add('fStreak2', [...fb, OUT(G, inset), IN(strk(0.3, 0.62, 0.14, 0.03, -0.1))]);
    }
    const eW = Math.min(0.1 * R, 9) + 1.5;
    add('fEdge', [...fb, IN(G, eW)]);
    add('fHot', [...fb, IN(G, eW * 0.9), IN(mk((k) => 0.25 - NY[k]))]);
  }
  const geo: ChromeGeo = {box, L, R, area, bbox: bb, sil: loopsPath(silLoops, 1), layers, seams, zf: S.z, f, light: {x: lx, y: ly}, nx: NX, ny: NY, fl};
  void RH;
  CACHE.set(key, geo);
  if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value as string);
  return geo;
};

/** a coloured edge reflection facing direction dir (screen, y down): where the normal points toward dir */
const tintPath = (g: ChromeGeo, dir: V, thr: number) => {
  const n = Math.hypot(dir.x, dir.y) || 1;
  const ex = dir.x / n, ey = -dir.y / n;
  const N = g.f.length;
  const v = new Float32Array(N);
  for (let k = 0; k < N; k++) v[k] = (thr - (g.nx[k] * ex + g.ny[k] * ey)) * g.R;
  const terms: Term[] = [{a: g.f, dx: 0, dy: 0, lv: 0, s: 1}, {a: v, dx: 0, dy: 0, lv: 0, s: 1}];
  if (g.fl) {
    const fl = g.fl;
    terms.push({a: fl.map((x) => (x - 0.5) * g.R), dx: 0, dy: 0, lv: 0, s: 1});
  }
  return regionPath(g.L, terms);
};
/** clip path of a depth split: 'front' = z < d0 + overlap (nearer the viewer, who is on the -d side) */
const splitPath = (g: ChromeGeo, s: DepthSplit) => {
  if (!g.zf) return '';
  const ov = s.overlap ?? 0.12;
  const v = s.part === 'front' ? g.zf.map((z) => z - s.d0 - ov) : g.zf.map((z) => s.d0 - z);
  return loopsPath(marchLoops(v, g.L, 0), 0.5);
};

/** area (px^2) of the smooth union of prims (volume bookkeeping); cell defaults to body size / 90 */
export const fieldArea = (prims: Prim[], blend: number, cell?: number, groupBlend?: number[]) => {
  if (!prims.length) return 0;
  const bb = boundsOf(prims);
  const size = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
  const c = cell ?? Math.max(0.02, size / 90);
  const pad = c * 2;
  const S = sampleBody(prims, {blend, groupBlend}, {x0: bb.x0 - pad, y0: bb.y0 - pad, x1: bb.x1 + pad, y1: bb.y1 + pad}, c, false, false);
  return loopsArea(marchLoops(S.f, S.L, 0));
};

// ---------------------------------------------------------------------------------------------------------------
/** the toon-chrome palette: cool blue-grey mid-tones, a white-hot sky, a dark navy horizon, a dark steel floor */
export const CHROME = {
  base0: '#BFCBD9', // lit side of the mid-tone
  base1: '#9AA9BD',
  base2: '#7F8FA6',
  base3: '#66768F', // shadow side of the mid-tone
  sky: '#E4EDF6',
  hot: '#FFFFFF',
  core: '#2A3A57',
  bounce: '#A6B9CF',
  band0: '#0F1B30', // the horizon (darkest)
  band1: '#1D2E4C',
  floor0: '#465874', // reflected floor (upper / far)
  floor1: '#34445F',
  low: '#6D809B', // reflected floor near the lower edge
  rim: '#FFFFFF',
  spec: '#FFFFFF',
  flat0: '#1E2C45', // floor mirror (far: the dark surroundings)
  flat1: '#3A4B68', // floor mirror (near)
  flatEdge: '#C9D8E8',
};

export type ChromeLook = {
  ink?: number;
  env?: ChromeEnv;
  warm?: number;
  glows?: Glow[];
  floor?: FloorOpts;
  depthSplit?: DepthSplit;
  /** extra content drawn on top of the body inside the same depth clip (decals) */
  children?: React.ReactNode;
  /** 0..1 overall darken (body in shadow) */
  dim?: number;
};

const f1 = (n: number) => n.toFixed(1);

/** paint a built chrome geometry */
export const ChromePaint: React.FC<{geo: ChromeGeo} & ChromeLook> = ({geo, ink = INK_PX, env, warm = 0, glows, floor, depthSplit, children, dim = 0}) => {
  const g = geo;
  const ids = {base: uid('chB'), band: uid('chH'), core: uid('chC'), sky: uid('chS'), clip: uid('chK'), warm: uid('chW'), sh: uid('chF'), body: uid('chY'), rf: uid('chR'), seam: uid('chM'), fl: uid('chG'), flat: uid('chP')};
  const b = g.bbox;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const ext = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2;
  const L = g.light;
  const R = g.R;
  const split = depthSplit ? splitPath(g, depthSplit) : '';
  // a requested depth pass with nothing in it draws nothing (never the whole body)
  if (depthSplit && !split) return null;
  const fill = (key: string) => {
    switch (key) {
      case 'floor':
        return `url(#${ids.fl})`;
      case 'low':
        return CHROME.low;
      case 'band':
        return `url(#${ids.band})`;
      case 'sky':
        return `url(#${ids.sky})`;
      case 'hot':
        return CHROME.hot;
      case 'core':
        return `url(#${ids.core})`;
      case 'lip':
        return CHROME.bounce;
      case 'rim':
        return CHROME.rim;
      case 'fBase':
        return `url(#${ids.flat})`;
      case 'fStreak':
      case 'fStreak2':
        return CHROME.sky;
      case 'fEdge':
        return CHROME.flatEdge;
      case 'fHot':
        return '#FFFFFF';
    }
    if (key.endsWith('occ')) return CHROME.core;
    return CHROME.spec;
  };
  const op = (key: string) => {
    switch (key) {
      case 'floor':
        return 1;
      case 'low':
        return 0.9;
      case 'band':
        return 1;
      case 'sky':
        return 1;
      case 'hot':
        return 1;
      case 'core':
        return 0.42;
      case 'lip':
        return 0.85;
      case 'rim':
        return 0.95;
      case 'fBase':
        return 1;
      case 'fStreak':
        return 0.8;
      case 'fStreak2':
        return 0.55;
      case 'fEdge':
        return 0.9;
      case 'fHot':
        return 1;
    }
    if (key.endsWith('occ')) return 0.32;
    return 1;
  };
  const tintD = env && env.amt > 0.01 ? tintPath(g, env.dir ?? {x: 0.75, y: -0.65}, 0.88 - 0.12 * clamp(env.amt)) : '';
  const warmK = clamp(warm);
  const warmD = warmK > 0.01 ? tintPath(g, {x: 0.1, y: 1}, 0.62 - 0.4 * warmK) : '';
  const fy = floor?.y ?? 0;
  const shK = floor ? clamp(floor.shadow ?? 0.8) : 0;
  const rfK = floor ? clamp(floor.reflect ?? 0) : 0;
  const shRx = floor?.rx ?? (b.x1 - b.x0) * 0.62;
  const gr = (id: string, c0: string, c1: string, c2?: string) => (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
      <stop offset="0" stopColor={c0} />
      {c2 ? <stop offset="0.5" stopColor={c2} /> : null}
      <stop offset="1" stopColor={c1} />
    </linearGradient>
  );
  return (
    <g>
      <defs>
        <linearGradient id={ids.base} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
          <stop offset="0" stopColor={CHROME.base0} />
          <stop offset="0.38" stopColor={CHROME.base1} />
          <stop offset="0.75" stopColor={CHROME.base2} />
          <stop offset="1" stopColor={CHROME.base3} />
        </linearGradient>
        {gr(ids.band, CHROME.band1, CHROME.band0)}
        {gr(ids.fl, CHROME.floor0, CHROME.floor1)}
        {gr(ids.core, CHROME.base3, CHROME.core)}
        {gr(ids.sky, CHROME.hot, '#C9D7E6', CHROME.sky)}
        <linearGradient id={ids.flat} gradientUnits="userSpaceOnUse" x1="0" y1={f1(b.y0)} x2="0" y2={f1(b.y1)}>
          <stop offset="0" stopColor={CHROME.flat0} />
          <stop offset="1" stopColor={CHROME.flat1} />
        </linearGradient>
        <linearGradient id={ids.warm} gradientUnits="userSpaceOnUse" x1="0" y1={f1(b.y1)} x2="0" y2={f1(b.y1 - 1.2 * R)}>
          <stop offset="0" stopColor={C.heat} />
          <stop offset="0.6" stopColor={C.heat} stopOpacity={0.8} />
          <stop offset="1" stopColor={C.yellow} stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={ids.sh}>
          <stop offset="0" stopColor={C.navy0} stopOpacity={0.6} />
          <stop offset="0.6" stopColor={C.navy0} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={ids.rf} gradientUnits="userSpaceOnUse" x1="0" y1={f1(fy)} x2="0" y2={f1(fy + (b.y1 - b.y0) * 0.6)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        {glows && glows.length > 0 && (
          <clipPath id={ids.body}>
            <path d={g.sil} clipRule="evenodd" />
          </clipPath>
        )}
        {glows?.map((q, i) => (
          <radialGradient key={i} id={`${ids.body}g${i}`}>
            <stop offset="0" stopColor={q.color} stopOpacity={clamp(q.amt)} />
            <stop offset="0.45" stopColor={q.color} stopOpacity={clamp(q.amt) * 0.35} />
            <stop offset="1" stopColor={q.color} stopOpacity={0} />
          </radialGradient>
        ))}
        {split && (
          <clipPath id={ids.clip}>
            <path d={split} clipRule="evenodd" />
          </clipPath>
        )}
        {g.seams.map((s, i) =>
          s.clip ? (
            <clipPath key={i} id={`${ids.seam}${i}`}>
              <path d={s.clip} clipRule="evenodd" />
            </clipPath>
          ) : null,
        )}
      </defs>
      <g clipPath={split ? `url(#${ids.clip})` : undefined}>
        {floor && shK > 0.01 && (
          <ellipse cx={f1(floor.cx ?? cx)} cy={f1(fy)} rx={f1(shRx)} ry={f1(shRx * (floor.squash ?? 0.16))} fill={`url(#${ids.sh})`} opacity={shK} />
        )}
        {floor && rfK > 0.01 && <path d={g.sil} transform={`matrix(1 0 0 -1 0 ${f1(2 * fy)})`} fill={`url(#${ids.rf})`} opacity={rfK} fillRule="evenodd" />}
        <path d={g.sil} fill={`url(#${ids.base})`} stroke={INK} strokeWidth={f1(ink * 2 * (1 + 0.7 * clamp((R - 60) / 260)))} strokeLinejoin="round" fillRule="evenodd" style={{paintOrder: 'stroke'}} />
        {g.layers.map((l, i) => (
          <path key={i} d={l.d} fill={fill(l.key)} opacity={op(l.key)} fillRule="evenodd" />
        ))}
        {tintD && <path d={tintD} fill={env!.tint} opacity={0.45 + 0.45 * clamp(env!.amt)} fillRule="evenodd" />}
        {warmD && <path d={warmD} fill={`url(#${ids.warm})`} opacity={0.85 * warmK} fillRule="evenodd" />}
        {g.seams.map((s, i) => (
          <path key={'s' + i} d={s.d} fill="none" stroke={INK} strokeWidth={f1(s.w)} strokeLinejoin="round" clipPath={s.clip ? `url(#${ids.seam}${i})` : undefined} />
        ))}
        {glows && glows.length > 0 && (
          <g clipPath={`url(#${ids.body})`}>
            {glows.map((q, i) => (
              <circle key={i} cx={f1(q.x)} cy={f1(q.y)} r={f1(q.r)} fill={`url(#${ids.body}g${i})`} style={{mixBlendMode: 'screen'}} />
            ))}
          </g>
        )}
        {dim > 0.01 && <path d={g.sil} fill={C.navy0} opacity={clamp(dim) * 0.6} fillRule="evenodd" />}
        {children}
      </g>
    </g>
  );
};

export type ChromeBodyProps = {
  prims: Prim[];
  blend: number;
  /** accepted for API symmetry: the body is a pure function of its prims */
  t?: number;
  cell?: number;
  light?: V;
  R?: number;
  groupBlend?: number[];
  rigid?: number[];
  groupR?: number[];
  groupBand?: number[];
  band?: number;
  specs?: number;
  clip?: Box;
  horizon?: number;
  groupHorizon?: number[];
} & ChromeLook;

/** the toon-chrome liquid / solid body */
export const ChromeBody: React.FC<ChromeBodyProps> = (p) => {
  const geo = buildChrome(
    p.prims,
    {blend: p.blend, groupBlend: p.groupBlend, rigid: p.rigid, groupR: p.groupR, groupBand: p.groupBand, groupHorizon: p.groupHorizon, R: p.R, cell: p.cell, light: p.light, band: p.band, specs: p.specs, clip: p.clip, horizon: p.horizon},
    !!p.depthSplit,
  );
  if (!geo) return null;
  return (
    <ChromePaint geo={geo} ink={p.ink} env={p.env} warm={p.warm} glows={p.glows} floor={p.floor} depthSplit={p.depthSplit} dim={p.dim}>
      {p.children}
    </ChromePaint>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// HandoffBlob: the MS -> FU hand-off (centre (540, 1100), r ~ 110 px, gentle deterministic wobble)
export const HANDOFF = {x: 540, y: 1100, r: 110};
export const handoffPrims = (t: number): Prim[] => {
  const {x, y, r} = HANDOFF;
  const out: Prim[] = [{k: 'c', x, y, r: r * 0.78}];
  // four lobes orbiting slowly; they breathe in antiphase (two grow while two shrink) so the outline wobbles, area holds
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3 * Math.sin(t * 0.9 + i) + t * 0.25;
    const br = 0.05 * Math.sin(t * 2.1 + i * Math.PI);
    const rr = r * (0.5 + br);
    const dd = r * (0.4 - 0.5 * br) + 3 * noise1(t * 0.8, i + 3);
    out.push({k: 'c', x: x + Math.cos(a) * dd, y: y + Math.sin(a) * dd * 0.94, r: rr});
  }
  return out;
};
export const HandoffBlob: React.FC<{t: number}> = ({t}) => <ChromeBody prims={handoffPrims(t)} blend={HANDOFF.r * 0.6} R={HANDOFF.r} cell={3} specs={2} />;

// ---------------------------------------------------------------------------------------------------------------
// ChromeSurface: full-frame chrome close-up (H1 -> LB match cut): we are pressed right against polished metal. The
// same environment as the bodies (white-hot sky, cool mid-tone, a dark navy horizon, the darker reflected floor), as
// isolines of ONE slowly drifting height field h(x, y, t) (a broad convex surface with slow undulations), plus a SHARP
// reflected window highlight: the key light's window drawn in reflection coordinates (screen x bent by the surface
// slope, h), so it is distorted by the same undulations and drifts as the camera glides over the surface.
export const surfaceHeight = (x: number, y: number, t: number) => {
  const u = x / 1080, v = y / 1920;
  const bend = 0.26 * (u - 0.42) ** 2 - 0.08 * (v - 0.45) ** 2;
  const w1 = 0.028 * Math.sin(4.6 * u + 1.8 * v + 0.6 * t);
  const w2 = 0.02 * Math.sin(-2.7 * u + 5.1 * v - 0.45 * t + 1.3);
  const w3 = 0.01 * Math.sin(8.0 * u - 3.0 * v + 0.9 * t + 2.2);
  return v + bend + w1 + w2 + w3 + 0.012 * t;
};
/** horizontal slope of the undulations (reflection bend) */
const surfaceSlopeU = (x: number, y: number, t: number) => {
  const u = x / 1080, v = y / 1920;
  return 0.028 * 4.6 * Math.cos(4.6 * u + 1.8 * v + 0.6 * t) - 0.02 * 2.7 * Math.cos(-2.7 * u + 5.1 * v - 0.45 * t + 1.3) + 0.01 * 8 * Math.cos(8.0 * u - 3.0 * v + 0.9 * t + 2.2) + 0.52 * (u - 0.42);
};
export const ChromeSurface: React.FC<{t: number; tint?: number}> = ({t, tint = 0}) => {
  const L = lattice({x0: -40, y0: -40, x1: 1120, y1: 1960}, 10);
  const N = L.nx * L.ny;
  const hv = new Float32Array(N), pv = new Float32Array(N);
  for (let j = 0; j < L.ny; j++)
    for (let i = 0; i < L.nx; i++) {
      const x = L.x0 + i * L.cell, y = L.y0 + j * L.cell;
      hv[j * L.nx + i] = surfaceHeight(x, y, t);
      pv[j * L.nx + i] = x / 1080 + 0.9 * surfaceSlopeU(x, y, t);
    }
  // reflected elevation (same units as the bodies' E): sky above ~0.33, the horizon around h ~ 0.66, floor below
  const Ek = (h: number) => (0.55 - h) * 2.1;
  const region = (fn: (q: number) => number, minA = 4) => {
    const a = new Float32Array(N);
    for (let q = 0; q < N; q++) a[q] = fn(q);
    return loopsPath(marchLoops(a, L, 0), minA);
  };
  const above = (e: number) => region((q) => (e - Ek(hv[q])) * 400);
  const below = (e: number) => region((q) => (Ek(hv[q]) - e) * 400);
  const between = (e0: number, e1: number) => region((q) => Math.max(e0 - Ek(hv[q]), Ek(hv[q]) - e1) * 400);
  // the window glint (reflection coords p = bent screen x, h): a rounded pane pair with a mullion, drifting
  const gx = 0.36 + 0.05 * Math.sin(0.55 * t + 0.4), gy = 0.25 + 0.014 * Math.sin(0.45 * t + 1);
  const rbox = (p: number, h: number, cx: number, cy: number, a: number, b: number, r: number) => {
    const qx = Math.abs(p - cx) - (a - r), qy = Math.abs(h - cy) - (b - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  const glint = region((q) => {
    const p = pv[q], h = hv[q];
    const w = rbox(p, h, gx, gy, 0.2, 0.085, 0.025);
    const mull = Math.min(Math.abs(p - gx + 0.01 * (h - gy)) - 0.01, Math.abs(h - gy - 0.004) - 0.007);
    return Math.max(w, -mull) * 1080;
  }, 6);
  const glint2 = region((q) => rbox(pv[q], hv[q], gx + 0.4, gy + 0.035, 0.06, 0.026, 0.014) * 1080, 6);
  const k = clamp(tint);
  const cool = (c: string) => mix(c, C.field, 0.3 * k);
  const ids = {a: uid('csA'), b: uid('csB'), v: uid('csV'), g: uid('csG'), s: uid('csS')};
  return (
    <g>
      <defs>
        <linearGradient id={ids.a} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="1920">
          <stop offset="0" stopColor={cool(CHROME.base0)} />
          <stop offset="0.5" stopColor={cool(CHROME.base1)} />
          <stop offset="1" stopColor={cool(CHROME.base2)} />
        </linearGradient>
        <linearGradient id={ids.s} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="800">
          <stop offset="0" stopColor={CHROME.hot} />
          <stop offset="0.55" stopColor={cool(CHROME.sky)} />
          <stop offset="1" stopColor={cool('#C9D7E6')} />
        </linearGradient>
        <linearGradient id={ids.b} gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="1080" y2="1300">
          <stop offset="0" stopColor={CHROME.band1} />
          <stop offset="1" stopColor={CHROME.band0} />
        </linearGradient>
        <linearGradient id={ids.g} gradientUnits="userSpaceOnUse" x1="0" y1="1150" x2="0" y2="1920">
          <stop offset="0" stopColor={cool(CHROME.floor0)} />
          <stop offset="1" stopColor={cool(CHROME.floor1)} />
        </linearGradient>
        <radialGradient id={ids.v} gradientUnits="userSpaceOnUse" cx="480" cy="860" r="1300">
          <stop offset="0.62" stopColor={C.navy0} stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.a})`} />
      <path d={below(ENV.band1)} fill={`url(#${ids.g})`} fillRule="evenodd" />
      <path d={below(ENV.low)} fill={cool(CHROME.low)} opacity={0.9} fillRule="evenodd" />
      <path d={between(ENV.band0, ENV.band1)} fill={`url(#${ids.b})`} fillRule="evenodd" />
      <path d={between(ENV.band1 + 0.015, ENV.band1 + 0.04)} fill="#FFFFFF" opacity={0.55} fillRule="evenodd" />
      <path d={above(ENV.sky)} fill={`url(#${ids.s})`} fillRule="evenodd" />
      <path d={above(ENV.hot + 0.25)} fill={CHROME.hot} fillRule="evenodd" />
      <path d={between(0.12, 0.15)} fill={CHROME.sky} opacity={0.7} fillRule="evenodd" />
      {/* sharp reflected window highlights */}
      <path d={glint} fill="#FFFFFF" fillRule="evenodd" />
      <path d={glint2} fill="#FFFFFF" opacity={0.9} fillRule="evenodd" />
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.v})`} />
    </g>
  );
};
