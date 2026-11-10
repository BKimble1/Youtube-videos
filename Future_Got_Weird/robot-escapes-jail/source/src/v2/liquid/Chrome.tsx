// V2 liquid-metal engine: the toon-chrome body (FGW Weird Crew finish), drawn entirely from ONE signed-distance field.
//
// buildChrome() samples the smooth union of the prims (and each group's own fold, and a depth field) on an adaptive
// lattice over the body's bounding box, then derives every visual layer as a region of that field or of shifted copies
// of it ("region algebra": a layer is max_i s_i * (f(p + o_i) - l_i) < 0), marched into crisp evenodd paths:
//   silhouette     f < 0: base silver gradient + navy INK at constant on-screen width
//   sky band       inside f, outside f shifted up: the bright sky reflection along the upper edges
//   core shadow    inside f, outside f shifted away from the light (lower-right)
//   bounce         a thin cool strip on the lower-right edge (floor bounce)
//   horizon band   points whose distance to the lower edge lies in [s1, s2]: a dark band that bends with the shape
//   rim light      inside f, outside f shifted toward the light (upper-left): the crisp lit edge
//   speculars      inset crescents near the lit side, trimmed by perpendicular shifts (1-3 white glints)
//   env / warm     optional coloured rim from an env light (alarm red), warm heat crescent from below
// Rigid bodies built from several groups (robot parts) also get internal definition from each group's own field:
// seams (ink), part rim / core shadow / horizon band and occlusion shadows of the parts in front - all scaled by the
// group's `rigid` 0..1, so as a region softens its internal definition thins away continuously (no opacity fades)
// and only the union's liquid shading remains. Every layer is an isoline of the same field, so reflections and
// highlights deform coherently with the surface, and every frame is valid geometry.
import React from 'react';
import {C, INK, INK_FEAT, INK_PX} from '../../art/palette';
import {uid} from '../../core/ids';
import {mix} from '../../core/color';
import {clamp, noise1} from '../../lib';
import {Box, Prim, primBox, primZ, sdPrim, smin, sminW} from './sdf';
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
  /** per-group shading scale (px); default R */
  groupR?: number[];
  /** per-group horizon band strength 0..1 (default 1; 0 for thin vertical limbs) */
  groupBand?: number[];
  /** shading scale (px): widths of rim / bands / speculars. Default from the body's area. */
  R?: number;
  cell?: number;
  light?: V;
  /** horizon band strength 0..1 (default 1) */
  band?: number;
  /** number of speculars 0..3 (default 2) */
  specs?: number;
  /** clip the evaluation box (default: the frame + 60 px) */
  clip?: Box;
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
/** vertical position inside the local section: U = +1 at the lower edge, -1 at the upper edge (slanted by `sl`),
 *  from two far shifted copies of the field (smooth: no column scans); T = local section thickness (px) */
const vpos = (a: Float32Array, L: Lattice, s: number, sl = 0.12) => {
  const {nx, ny, cell} = L;
  const U = new Float32Array(nx * ny), T = new Float32Array(nx * ny);
  const oi = (sl * s) / cell, oj = s / cell;
  const s2 = 2 * Math.hypot(sl * s, s) / Math.hypot(sl, 1);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const fd = sampX(a, L, i + oi, j + oj), fu = sampX(a, L, i - oi, j - oj);
      const th = s2 - fd - fu;
      T[k] = th;
      U[k] = (fd - fu) / Math.max(th, 1e-3);
    }
  }
  return {U, T};
};
const regionPath = (L: Lattice, terms: Term[], minArea = 2) => loopsPath(marchLoops(regionField(L, terms), L, 0), minArea);

// ---------------------------------------------------------------------------------------------------------------
// sampling: union field, per-group folds, depth
type Sampled = {L: Lattice; f: Float32Array; fg: Float32Array[]; z: Float32Array | null; groups: number[]};

const sampleBody = (prims: Prim[], o: {blend: number; groupBlend?: number[]}, box: Box, cell: number, withZ: boolean, withGroups: boolean): Sampled => {
  const L = lattice(box, cell);
  const {nx, ny} = L;
  const groupIds = Array.from(new Set(prims.map((p) => p.g ?? 0))).sort((a, b) => a - b);
  const byG = groupIds.map((g) => prims.filter((p) => (p.g ?? 0) === g));
  const bxs = byG.map((ps) => ps.map(primBox));
  const N = nx * ny;
  const f = new Float32Array(N);
  const fg = withGroups ? groupIds.map(() => new Float32Array(N)) : [];
  const z = withZ ? new Float32Array(N) : null;
  const gb = groupIds.map((g) => o.groupBlend?.[g] ?? o.blend);
  for (let j = 0; j < ny; j++) {
    const y = L.y0 + j * L.cell;
    for (let i = 0; i < nx; i++) {
      const x = L.x0 + i * L.cell;
      let U = 1e9, Uz = 0, first = true;
      for (let gi = 0; gi < byG.length; gi++) {
        const ps = byG[gi], bs = bxs[gi];
        let A = 1e9, Az = 0, fa = true;
        for (let q = 0; q < ps.length; q++) {
          const p = ps[q];
          const k = p.blend ?? o.blend;
          const b = bs[q];
          if (!fa && !withZ) {
            // cull: a lower bound of the prim distance is the distance to its bounds
            const ddx = x < b.x0 ? b.x0 - x : x > b.x1 ? x - b.x1 : 0;
            const ddy = y < b.y0 ? b.y0 - y : y > b.y1 ? y - b.y1 : 0;
            if ((ddx > 0 || ddy > 0) && Math.hypot(ddx, ddy) >= A + k) continue;
          }
          const d = sdPrim(p, x, y);
          if (fa) {
            A = d;
            if (withZ) Az = primZ(p, x, y);
            fa = false;
            continue;
          }
          if (withZ) Az += (primZ(p, x, y) - Az) * sminW(A, d, Math.max(k, 1e-3));
          A = smin(A, d, k);
        }
        if (withGroups) fg[gi][j * nx + i] = A;
        if (first) {
          U = A;
          Uz = Az;
          first = false;
        } else {
          if (withZ) Uz += (Az - Uz) * sminW(U, A, Math.max(gb[gi], 1e-3));
          U = smin(U, A, gb[gi]);
        }
      }
      f[j * nx + i] = U;
      if (z) z[j * nx + i] = Uz;
    }
  }
  return {L, f, fg, z, groups: groupIds};
};

// ---------------------------------------------------------------------------------------------------------------
// cache (back + front passes of one body in one frame share the geometry; pure, so caching is safe)
const CACHE = new Map<string, ChromeGeo>();
const r2 = (n: number) => Math.round(n * 100) / 100;
const keyOf = (prims: Prim[], o: ChromeOpts, extra: string) =>
  prims.map((p) => Object.entries(p).map(([k, v]) => k + (typeof v === 'number' ? r2(v) : v)).join(',')).join('|') + '#' + JSON.stringify(o) + extra;

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
  const pad = Math.max(12, R0 * 0.75 + 10);
  let box: Box = {x0: bb.x0 - pad, y0: bb.y0 - pad, x1: bb.x1 + pad, y1: bb.y1 + pad};
  box = inter(box, o.clip ?? FRAME_BOX);
  if (box.x1 - box.x0 < 4 || box.y1 - box.y0 < 4) return null;
  const cell = o.cell ?? cellFor(Math.min(size, Math.max(box.x1 - box.x0, box.y1 - box.y0)));
  const withGroups = !!o.rigid && o.rigid.some((r) => r > 0.01);
  const S = sampleBody(prims, o, box, cell, withZ, withGroups);
  const L = S.L;
  const silLoops = marchLoops(S.f, L, 0);
  const area = loopsArea(silLoops);
  const R = o.R ?? Math.max(6, Math.sqrt(area / Math.PI) * 0.9);
  const lt = o.light ?? LIGHT;
  const ln = Math.hypot(lt.x, lt.y) || 1;
  const lx = lt.x / ln, ly = lt.y / ln;
  const px = -ly, py = lx; // perpendicular to the light
  const f = S.f;
  const T = (a: Float32Array, dx: number, dy: number, lv: number, s: 1 | -1): Term => ({a, dx, dy, lv, s});
  const IN = (a: Float32Array, dx = 0, dy = 0, lv = 0) => T(a, dx, dy, lv, 1);
  const OUT = (a: Float32Array, dx = 0, dy = 0, lv = 0) => T(a, dx, dy, lv, -1);
  const layers: {key: string; d: string}[] = [];
  const add = (key: string, terms: Term[], minA = 2) => {
    const d = regionPath(L, terms, minA);
    if (d) layers.push({key, d});
  };
  // horizon band (dark, crisp) + ground reflection below it, placed at a fraction of the local section height so it
  // sits right on any part (a sphere gets the classic lens-shaped horizon), bending with the shape
  const addBand = (pre: string, a: Float32Array, Rb: number, k: number, extra: Term[]) => {
    if (k < 0.02) return;
    const {U, T} = vpos(a, L, 1.7 * Rb);
    const N = U.length;
    const mk = (fn: (u: number, th: number) => number) => {
      const out = new Float32Array(N);
      for (let q = 0; q < N; q++) out[q] = fn(U[q], T[q]);
      return out;
    };
    // only where the local section is a plausible "body" section (not a whole standing figure)
    const thick = mk((u, th) => Math.max(0.3 * Rb - th, th - 2.6 * Rb));
    const u0 = 0.2, u1 = 0.2 + 0.2 * k, u2 = u1 + 0.25 * k;
    add(pre + 'ground', [IN(a, 0, 0, -0.02 * Rb), IN(mk((u, th) => (u1 - u) * th * 0.5)), IN(thick), ...extra]);
    add(pre + 'ground', [IN(a, 0, 0, -0.02 * Rb), IN(mk((u, th) => (u1 - u) * th * 0.5)), IN(mk((u, th) => (u - u2) * th * 0.5)), IN(thick), ...extra]);
    add(pre + 'band', [IN(a, 0, 0, -0.03 * Rb), IN(mk((u, th) => (u0 - u) * th * 0.5)), IN(mk((u, th) => (u - u1) * th * 0.5)), IN(thick), ...extra]);
  };
  const rig = o.rigid ?? [];
  const avgRigid = withGroups && S.groups.length ? S.groups.reduce((s, g) => s + clamp(rig[g] ?? 0), 0) / S.groups.length : 0;
  const bandK = (o.band ?? 1) * (1 - avgRigid);
  // ---- union layers
  add('sky', [IN(f), OUT(f, 0.12 * R, -0.42 * R)]);
  add('core', [IN(f), OUT(f, -lx * 0.4 * R, -ly * 0.4 * R)]);
  if (bandK > 0.02) addBand('', f, R, bandK, []);
  add('bounce', [IN(f), OUT(f, -lx * 0.075 * R, -ly * 0.075 * R), IN(f, 0.25 * R * lx, 0.25 * R * ly)]);
  add('rim', [IN(f), OUT(f, lx * 0.085 * R, ly * 0.085 * R)]);
  // ---- group internal definition (rigid parts)
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
      const rho = clamp(rig[g] ?? 0);
      if (rho < 0.02) continue;
      const a = S.fg[gi];
      const Rg = o.groupR?.[g] ?? R;
      const fr = fronts[gi];
      // the group shows its own definition only where it IS the surface (its field ~ the union's) and nothing in
      // front covers it: a liquid mass flowing over a still-rigid part hides that part's seams and shading
      const own = new Float32Array(a.length);
      const eps = 0.12 * Rg;
      for (let q = 0; q < a.length; q++) own[q] = a[q] - f[q] - eps;
      const notFront = fr ? [OUT(fr), IN(own)] : [IN(own)];
      add(`g${g}core`, [IN(a), OUT(a, -lx * 0.34 * Rg * rho, -ly * 0.34 * Rg * rho), ...notFront]);
      addBand(`g${g}`, a, Rg, rho * (o.groupBand?.[g] ?? 1), notFront);
      if (fr) add(`g${g}occ`, [IN(a), IN(fr, lx * 0.16 * Rg * rho, ly * 0.16 * Rg * rho), ...notFront]);
      add(`g${g}rim`, [IN(a), OUT(a, lx * 0.1 * Rg * rho, ly * 0.1 * Rg * rho), ...notFront]);
      const sd = loopsPath(marchLoops(a, L, -0.5), 2);
      const clip = regionPath(L, notFront, 2) || null;
      if (sd) seams.push({d: sd, w: INK_FEAT * 1.15 * rho, clip});
    }
  }
  // ---- speculars
  const nSpec = o.specs ?? 2;
  if (nSpec >= 1) add('spec', [IN(f, lx * 0.13 * R, ly * 0.13 * R), OUT(f, lx * 0.24 * R, ly * 0.24 * R), IN(f, px * 0.42 * R, py * 0.42 * R), IN(f, -px * 0.42 * R, -py * 0.42 * R)]);
  if (nSpec >= 2) add('spec', [IN(f, lx * 0.34 * R, ly * 0.34 * R), OUT(f, lx * 0.43 * R, ly * 0.43 * R), IN(f, px * 0.62 * R, py * 0.62 * R), IN(f, -px * 0.62 * R, -py * 0.62 * R)]);
  if (nSpec >= 3) add('spec', [IN(f, -lx * 0.5 * R, -ly * 0.5 * R), OUT(f, -lx * 0.56 * R, -ly * 0.56 * R), IN(f, px * 0.5 * R, py * 0.5 * R), IN(f, -px * 0.5 * R, -py * 0.5 * R)]);
  const geo: ChromeGeo = {box, L, R, area, bbox: bb, sil: loopsPath(silLoops, 1), layers, seams, zf: S.z, f, light: {x: lx, y: ly}};
  CACHE.set(key, geo);
  if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value as string);
  return geo;
};

const tintPath = (g: ChromeGeo, dir: V, w: number) => {
  const n = Math.hypot(dir.x, dir.y) || 1;
  return regionPath(g.L, [{a: g.f, dx: 0, dy: 0, lv: 0, s: 1}, {a: g.f, dx: (dir.x / n) * w, dy: (dir.y / n) * w, lv: 0, s: -1}]);
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
export const CHROME = {
  base0: '#E8EEF4',
  base1: C.silver,
  base2: C.silverMid,
  base3: '#7A899D',
  sky: '#FBFDFF',
  core: C.silverDark,
  bounce: '#C9D7E6',
  band0: '#22385A',
  band1: '#4A5D78',
  rim: '#FFFFFF',
  spec: '#FFFFFF',
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
  const ids = {base: uid('chB'), band: uid('chH'), core: uid('chC'), sky: uid('chS'), clip: uid('chK'), warm: uid('chW'), sh: uid('chF'), body: uid('chY'), rf: uid('chR'), seam: uid('chM'), ground: uid('chG')};
  const b = g.bbox;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const ext = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2;
  const L = g.light;
  const R = g.R;
  const split = depthSplit ? splitPath(g, depthSplit) : '';
  // a requested depth pass with nothing in it draws nothing (never the whole body)
  if (depthSplit && !split) return null;
  const fill = (key: string) => {
    if (key === 'sky') return `url(#${ids.sky})`;
    if (key.endsWith('core')) return `url(#${ids.core})`;
    if (key.endsWith('band')) return `url(#${ids.band})`;
    if (key.endsWith('ground')) return `url(#${ids.ground})`;
    if (key === 'bounce') return CHROME.bounce;
    if (key.endsWith('occ')) return C.silverDeep;
    if (key.endsWith('rim')) return CHROME.rim;
    return CHROME.spec;
  };
  const op = (key: string) => {
    if (key === 'sky') return 0.78;
    if (key.endsWith('core')) return key === 'core' ? 0.62 : 0.5;
    if (key.endsWith('band')) return 0.92;
    if (key.endsWith('ground')) return 0.55;
    if (key === 'bounce') return 0.85;
    if (key.endsWith('occ')) return 0.38;
    if (key.endsWith('rim')) return key === 'rim' ? 0.95 : 0.8;
    return 0.97;
  };
  const tintD = env && env.amt > 0.01 ? tintPath(g, env.dir ?? {x: 0.75, y: -0.65}, 0.1 * R) : '';
  const warmK = clamp(warm);
  const warmD = warmK > 0.01 ? tintPath(g, {x: 0.1, y: 1}, (0.1 + 0.16 * warmK) * R) : '';
  const fy = floor?.y ?? 0;
  const shK = floor ? clamp(floor.shadow ?? 0.8) : 0;
  const rfK = floor ? clamp(floor.reflect ?? 0) : 0;
  const shRx = floor?.rx ?? (b.x1 - b.x0) * 0.62;
  return (
    <g>
      <defs>
        <linearGradient id={ids.base} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
          <stop offset="0" stopColor={CHROME.base0} />
          <stop offset="0.38" stopColor={CHROME.base1} />
          <stop offset="0.75" stopColor={CHROME.base2} />
          <stop offset="1" stopColor={CHROME.base3} />
        </linearGradient>
        <linearGradient id={ids.band} gradientUnits="userSpaceOnUse" x1={f1(cx - ext)} y1={f1(cy - ext)} x2={f1(cx + ext)} y2={f1(cy + ext)}>
          <stop offset="0" stopColor={CHROME.band1} />
          <stop offset="0.45" stopColor={CHROME.band0} />
          <stop offset="1" stopColor={CHROME.band0} />
        </linearGradient>
        <linearGradient id={ids.ground} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
          <stop offset="0" stopColor={C.silver} />
          <stop offset="0.55" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDark} />
        </linearGradient>
        <linearGradient id={ids.core} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
          <stop offset="0" stopColor={C.silverMid} />
          <stop offset="0.6" stopColor={CHROME.core} />
          <stop offset="1" stopColor={C.silverDeep} />
        </linearGradient>
        <linearGradient id={ids.sky} gradientUnits="userSpaceOnUse" x1={f1(cx + L.x * ext)} y1={f1(cy + L.y * ext)} x2={f1(cx - L.x * ext)} y2={f1(cy - L.y * ext)}>
          <stop offset="0" stopColor={CHROME.sky} />
          <stop offset="0.7" stopColor={C.chrome} />
          <stop offset="1" stopColor={C.silver} />
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
        <path d={g.sil} fill={`url(#${ids.base})`} stroke={INK} strokeWidth={ink * 2} strokeLinejoin="round" fillRule="evenodd" style={{paintOrder: 'stroke'}} />
        {g.layers.map((l, i) => (
          <path key={i} d={l.d} fill={fill(l.key)} opacity={op(l.key)} fillRule="evenodd" />
        ))}
        {g.seams.map((s, i) => (
          <path key={'s' + i} d={s.d} fill="none" stroke={INK} strokeWidth={f1(s.w)} strokeLinejoin="round" clipPath={s.clip ? `url(#${ids.seam}${i})` : undefined} />
        ))}
        {tintD && <path d={tintD} fill={env!.tint} opacity={clamp(env!.amt) * 0.7} fillRule="evenodd" />}
        {warmD && <path d={warmD} fill={`url(#${ids.warm})`} opacity={0.8 * warmK} fillRule="evenodd" />}
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
} & ChromeLook;

/** the toon-chrome liquid / solid body */
export const ChromeBody: React.FC<ChromeBodyProps> = (p) => {
  const geo = buildChrome(
    p.prims,
    {blend: p.blend, groupBlend: p.groupBlend, rigid: p.rigid, groupR: p.groupR, groupBand: p.groupBand, R: p.R, cell: p.cell, light: p.light, band: p.band, specs: p.specs, clip: p.clip},
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
// ChromeSurface: full-frame chrome close-up (H1 -> LB match cut): we are right against polished metal. The same finish
// as the bodies (silver base, bright sky, dark navy horizon band with a bright lip, crisp white glints, cool bounce),
// as isolines of ONE slowly drifting height field h(x, y, t), so the reflections slide and bend together as if the
// camera were gliding over a curved polished surface.
export const surfaceHeight = (x: number, y: number, t: number) => {
  const u = x / 1080, v = y / 1920;
  // a broad convex surface seen from very close: reflections are horizontal-ish bands that bend with the curvature,
  // plus slow drifting undulations (the camera gliding over the polished metal)
  const bend = 0.26 * (u - 0.42) ** 2 - 0.08 * (v - 0.45) ** 2;
  const w1 = 0.028 * Math.sin(4.6 * u + 1.8 * v + 0.6 * t);
  const w2 = 0.02 * Math.sin(-2.7 * u + 5.1 * v - 0.45 * t + 1.3);
  const w3 = 0.01 * Math.sin(8.0 * u - 3.0 * v + 0.9 * t + 2.2);
  return v + bend + w1 + w2 + w3 + 0.012 * t;
};
export const ChromeSurface: React.FC<{t: number; tint?: number}> = ({t, tint = 0}) => {
  const L = lattice({x0: -40, y0: -40, x1: 1120, y1: 1960}, 12);
  const hv = new Float32Array(L.nx * L.ny);
  for (let j = 0; j < L.ny; j++) for (let i = 0; i < L.nx; i++) hv[j * L.nx + i] = surfaceHeight(L.x0 + i * L.cell, L.y0 + j * L.cell, t);
  const band = (a: number, b: number, minA = 4) => loopsPath(marchLoops(hv.map((h) => Math.max(a - h, h - b)), L, 0), minA);
  // the key light's hot spot: an elliptical glint on the upper left that drifts and breathes with the surface
  const gx = 300 + 40 * Math.sin(0.5 * t), gy = 520 + 30 * Math.sin(0.4 * t + 1);
  const spot = (sx: number, sy: number, k: number) =>
    loopsPath(marchLoops(new Float32Array(L.nx * L.ny).map((_, q) => {
      const x = L.x0 + (q % L.nx) * L.cell, y = L.y0 + Math.floor(q / L.nx) * L.cell;
      const h = hv[q];
      return Math.hypot((x - gx) / sx, (y - gy - (h - y / 1920) * 900) / sy) - k;
    }), L, 0), 4);
  const k = clamp(tint);
  const cool = (c: string) => mix(c, C.field, 0.3 * k);
  const ids = {a: uid('csA'), b: uid('csB'), v: uid('csV'), g: uid('csG')};
  return (
    <g>
      <defs>
        <linearGradient id={ids.a} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="1920">
          <stop offset="0" stopColor={cool(CHROME.base0)} />
          <stop offset="0.4" stopColor={cool(C.silver)} />
          <stop offset="1" stopColor={cool(C.silverMid)} />
        </linearGradient>
        <linearGradient id={ids.b} gradientUnits="userSpaceOnUse" x1="0" y1="900" x2="0" y2="1200">
          <stop offset="0" stopColor={CHROME.band0} />
          <stop offset="0.7" stopColor={CHROME.band1} />
          <stop offset="1" stopColor={C.silverDark} />
        </linearGradient>
        <linearGradient id={ids.g} gradientUnits="userSpaceOnUse" x1="0" y1="1100" x2="0" y2="1920">
          <stop offset="0" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDark} />
        </linearGradient>
        <radialGradient id={ids.v} gradientUnits="userSpaceOnUse" cx="480" cy="860" r="1300">
          <stop offset="0.62" stopColor={C.navy0} stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.a})`} />
      {/* sky reflection (bright), the ground below the horizon (mid), the dark horizon band with a bright lip */}
      <path d={band(-1, 0.3)} fill={CHROME.sky} opacity={0.75} fillRule="evenodd" />
      <path d={band(-1, 0.18)} fill="#FFFFFF" opacity={0.5} fillRule="evenodd" />
      <path d={band(0.6, 2)} fill={`url(#${ids.g})`} opacity={0.7} fillRule="evenodd" />
      <path d={band(0.5, 0.6)} fill={`url(#${ids.b})`} opacity={0.95} fillRule="evenodd" />
      <path d={band(0.612, 0.628)} fill="#FFFFFF" opacity={0.55} fillRule="evenodd" />
      <path d={band(0.82, 0.9)} fill={C.silverDeep} opacity={0.35} fillRule="evenodd" />
      {/* crisp glints */}
      <path d={spot(250, 64, 1)} fill="#FFFFFF" opacity={0.75} fillRule="evenodd" />
      <path d={band(0.335, 0.347)} fill="#FFFFFF" opacity={0.85} fillRule="evenodd" />
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.v})`} />
    </g>
  );
};
