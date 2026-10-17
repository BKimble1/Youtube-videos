// The city: avenue frontage (detailed, damaged, interiors exposed where fires burn), the blocks behind it, the burnt
// skyline to the east, the west blocks behind the ridge, and the tower that fails in the opening. All generated once
// from seeds (deterministic); meshes are built per level of detail on first use and cached.
//   lod 0  (near)  individual windows (one path per window material per facade), fire escapes, storefronts, interiors
//   lod 1  (mid)   storey ribbons instead of windows
//   lod 2  (far)   plain volumes
import {V3, rnd, clamp, add3, mul3, sub3} from '../../kit/math';
import {Mesh, Face, Overlay, Prepped, prep, box, cylinder, merge, xfMesh} from '../engine';
import {PLAN} from './plan';
import {FIRES} from './fires';

export type Kind = 'brick' | 'limestone' | 'modern' | 'glass' | 'tower';
export type Opening = {u0: number; u1: number; y0: number; y1: number; depth: number};
export type Bldg = {
  id: string;
  x0: number; x1: number; z0: number; z1: number;
  h: number;
  kind: Kind;
  /** the facade that faces a street */
  front: 'N' | 'S' | 'E' | 'W';
  seed: number;
  /** broken top: the upper storeys survive only over part of the roof */
  crown?: {keep: [number, number][]; low: number};
  /** blown-out section of the front facade showing floors and rooms */
  opening?: Opening;
  waterTower?: boolean;
  zone: 'front' | 'block' | 'far' | 'west';
  /** rubble lot instead of a building */
  rubble?: boolean;
  storey: number;
};

const STOREY = 3.4;
const R = (s: number, k: number) => rnd(s * 9173 + k * 131);

// ------------------------------------------------------------------ layout
const kindFor = (x: number, s: number): Kind => {
  const r = R(s, 1);
  const glassK = clamp((x - 300) / 900) * 0.35;
  if (r < 0.42 - glassK * 0.5) return 'brick';
  if (r < 0.66 - glassK * 0.4) return 'limestone';
  if (r < 0.88 - glassK * 0.2) return 'modern';
  return 'glass';
};

const frontage = (side: -1 | 1): Bldg[] => {
  const out: Bldg[] = [];
  let x = 13.5;
  let n = 0;
  const z0f = PLAN.avenue.walkZ; // facade line
  while (x < 1380) {
    const cs = PLAN.crossStreets.find((c) => x + 4 > c.x - c.w / 2 && x < c.x + c.w / 2);
    if (cs) { x = cs.x + cs.w / 2 + 0.5; continue; }
    const s = (side === -1 ? 1000 : 2000) + n;
    let w = 14 + R(s, 2) * 22;
    const next = PLAN.crossStreets.find((c) => c.x - c.w / 2 > x && c.x - c.w / 2 < x + w + 8);
    if (next) w = Math.max(8, next.x - next.w / 2 - 0.5 - x);
    const depth = 20 + R(s, 3) * 14;
    const nearK = clamp((x - 20) / 260);
    const storeys = Math.round(4 + R(s, 4) * (8 + nearK * 18) + (R(s, 5) < 0.12 ? 10 : 0));
    const kind = kindFor(x, s);
    const h = storeys * STOREY + (kind === 'glass' ? 2 : 1.2);
    const b: Bldg = {
      id: `F${side < 0 ? 'N' : 'S'}${n}`,
      x0: x, x1: x + w,
      z0: side < 0 ? -z0f - depth : z0f, z1: side < 0 ? -z0f : z0f + depth,
      h, kind, front: side < 0 ? 'S' : 'N', seed: s, zone: 'front', storey: STOREY,
      waterTower: kind === 'brick' && R(s, 6) < 0.45 && storeys < 14,
      rubble: x > 60 && x < 900 && R(s, 7) < 0.07,
    };
    if (!b.rubble && R(s, 8) < 0.42 + 0.3 * (1 - nearK)) {
      const k1 = R(s, 9) * 0.5, k2 = clamp(k1 + 0.25 + R(s, 10) * 0.4);
      b.crown = {keep: [[k1 * 0.4, k1 + 0.15], [k2, Math.min(1, k2 + 0.2)]], low: Math.max(2, storeys - 1 - Math.floor(R(s, 11) * 4)) * STOREY};
    }
    out.push(b);
    x += w + 0.6 + (R(s, 12) < 0.08 ? 6 + R(s, 13) * 10 : 0);
    n++;
  }
  return out;
};

/** Fit openings to the interior fires so each burning floor is seen through a blown-out facade. */
const placeOpenings = (bs: Bldg[]) => {
  FIRES.filter((f) => f.interior).forEach((f) => {
    const b = bs.find((q) => !q.rubble && f.pos.x >= q.x0 - 1 && f.pos.x <= q.x1 + 1 && f.pos.z >= q.z0 - 4 && f.pos.z <= q.z1 + 4);
    if (!b) return;
    const storeyIdx = Math.max(1, Math.floor(f.pos.y / b.storey));
    const y0 = storeyIdx * b.storey, y1 = Math.min(b.h - b.storey * 1.2, y0 + b.storey * (2 + Math.floor(R(b.seed, 20) * 2)));
    if (y1 <= y0 + 2) return;
    const W = b.x1 - b.x0;
    const uc = b.front === 'S' ? f.pos.x - b.x0 : b.x1 - f.pos.x;
    const bw = W > 20 ? 3.2 : 2.8;
    const u0 = clamp(Math.round((uc - bw * 1.6) / bw) * bw, bw, W - bw * 3), u1 = clamp(u0 + bw * (2 + Math.round(R(b.seed, 21) * 2)), u0 + bw * 2, W - bw);
    b.opening = {u0, u1, y0, y1, depth: 5 + R(b.seed, 22) * 3};
    // keep the crown damage away from the opening's storeys
    if (b.crown && b.crown.low < y1 + b.storey) b.crown.low = y1 + b.storey;
    if (b.crown && b.crown.low >= b.h - 0.5) b.crown = undefined;
  });
};

const blocks = (): Bldg[] => {
  const out: Bldg[] = [];
  const xs = [-260, -120, ...PLAN.crossStreets.map((c) => c.x), 560, 700, 860, 1020, 1180, 1340];
  const zBands = [[56, 82], [98, 160], [176, 240], [256, 330]];
  let n = 0;
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i] + 10, bnd = xs[i + 1] - 10;
    if (bnd - a < 20) continue;
    for (const side of [-1, 1] as const) for (const [zA, zB] of zBands) {
      let x = a;
      while (x < bnd - 8) {
        const s = 5000 + n;
        const w = Math.min(bnd - x, 18 + R(s, 1) * 34);
        const far = x > 560;
        const hBase = far ? 40 + R(s, 2) * 110 : 14 + R(s, 2) * 42;
        const h = hBase + (R(s, 3) < 0.1 ? (far ? 60 + R(s, 4) * 90 : 18 + R(s, 4) * 30) : 0);
        const kind: Kind = far && h > 90 ? (R(s, 5) < 0.5 ? 'glass' : 'tower') : kindFor(x, s);
        // skip the ridge zone (the collapse fills it), the west ruin's footprint and the failing tower's lot
        const T = PLAN.failingTower;
        const zc = side < 0 ? -(zA + zB) / 2 : (zA + zB) / 2;
        const nearTower = Math.abs(x + w / 2 - T.base.x) < T.width / 2 + w / 2 + 6 && Math.abs(zc - T.base.z) < (zB - zA) / 2 + T.width / 2 + 4;
        if (!(x < 20 && x + w > -45 && zA < 40) && !nearTower) {
          out.push({
            id: `B${n}`, x0: x, x1: x + w,
            z0: side < 0 ? -zB : zA, z1: side < 0 ? -zA : zB,
            h, kind, front: side < 0 ? 'S' : 'N', seed: s, zone: x < -40 ? 'west' : 'block', storey: STOREY,
            crown: R(s, 6) < 0.3 ? {keep: [[0, 0.45 + R(s, 7) * 0.3]], low: h * (0.55 + R(s, 8) * 0.25)} : undefined,
            waterTower: kind === 'brick' && R(s, 9) < 0.35 && h < 50,
          });
        }
        x += w + 1;
        n++;
      }
    }
  }
  // buildings flanking the collapse north and south of the ridge, and the west blocks behind it
  const flank: [number, number, number, number, number][] = [
    [-44, -14, -62, -40, 30], [-10, 12, -60, -38, 22], [-44, -16, 40, 64, 26], [-12, 12, 38, 60, 34],
    [-120, -60, -40, -12, 44], [-120, -64, 10, 38, 58], [-180, -130, -30, 20, 92], [-200, -140, 40, 80, 70],
  ];
  flank.forEach(([x0, x1, z0, z1, h], k) => out.push({id: `W${k}`, x0, x1, z0, z1, h, kind: k % 3 === 0 ? 'limestone' : k % 3 === 1 ? 'brick' : 'modern', front: x1 < -40 ? 'E' : z0 < 0 ? 'S' : 'N', seed: 7000 + k, zone: 'west', storey: STOREY, crown: k % 2 === 0 ? {keep: [[0, 0.5]], low: h * 0.7} : undefined}));
  return out;
};

const skyline = (): Bldg[] => {
  const out: Bldg[] = [];
  for (let n = 0; n < 110; n++) {
    const s = 9000 + n;
    const cx = 1450 + (R(s, 1) - 0.5) * 1700, cz = -100 + (R(s, 2) - 0.5) * 1600;
    if (Math.abs(cz) < 40) continue; // keep the avenue's corridor open toward the horizon
    if (Math.hypot(cx - PLAN.failingTower.base.x, cz - PLAN.failingTower.base.z) < 90) continue;
    const core = Math.exp(-(((cx - 1500) / 600) ** 2) - ((cz + 150) / 500) ** 2);
    const h = 60 + R(s, 3) * 120 + core * (120 + R(s, 4) * 200);
    const w = 22 + R(s, 5) * 30, d = 22 + R(s, 6) * 30;
    out.push({id: `K${n}`, x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, h, kind: R(s, 7) < 0.4 ? 'glass' : 'tower', front: 'W', seed: s, zone: 'far', storey: 4});
  }
  return out;
};

let CITY_CACHE: Bldg[] | null = null;
export const CITY = (): Bldg[] => {
  if (CITY_CACHE) return CITY_CACHE;
  const f = [...frontage(-1), ...frontage(1)];
  placeOpenings(f);
  CITY_CACHE = [...f, ...blocks(), ...skyline()];
  return CITY_CACHE;
};

// ------------------------------------------------------------------ meshes
const WALL: Record<Kind, string[]> = {
  brick: ['brick', 'brickDark', 'brickLight'],
  limestone: ['limestone', 'limestoneDark', 'limestone'],
  modern: ['facadeGrey', 'concrete', 'concreteDark'],
  glass: ['glass', 'glassLight', 'glass'],
  tower: ['far', 'facadeGrey', 'limestoneDark'],
};

/** A facade frame: origin at the bottom-left corner seen from outside, U to the right, N outward, width W. */
type Frame = {O: V3; U: V3; N: V3; W: number};
const frames = (b: Bldg): Record<'N' | 'S' | 'E' | 'W', Frame> => ({
  S: {O: {x: b.x0, y: 0, z: b.z1}, U: {x: 1, y: 0, z: 0}, N: {x: 0, y: 0, z: 1}, W: b.x1 - b.x0},
  N: {O: {x: b.x1, y: 0, z: b.z0}, U: {x: -1, y: 0, z: 0}, N: {x: 0, y: 0, z: -1}, W: b.x1 - b.x0},
  E: {O: {x: b.x1, y: 0, z: b.z1}, U: {x: 0, y: 0, z: -1}, N: {x: 1, y: 0, z: 0}, W: b.z1 - b.z0},
  W: {O: {x: b.x0, y: 0, z: b.z0}, U: {x: 0, y: 0, z: 1}, N: {x: -1, y: 0, z: 0}, W: b.z1 - b.z0},
});
const P = (F: Frame, u: number, y: number, d = 0): V3 => ({x: F.O.x + F.U.x * u + F.N.x * d, y, z: F.O.z + F.U.z * u + F.N.z * d});

/** Windows of a facade region (u0..u1, y0..y1), sorted into the three window materials. */
const windowPolys = (b: Bldg, F: Frame, u0: number, u1: number, y0: number, y1: number, skipHole?: Opening, isFront = false) => {
  const dark: V3[][] = [], sky: V3[][] = [], lit: V3[][] = [], broken: V3[][] = [];
  const glassy = b.kind === 'glass' || b.kind === 'tower';
  const bay = glassy ? 3.0 : b.kind === 'modern' ? 3.6 : 3.1;
  const ww = glassy ? 2.6 : b.kind === 'modern' ? 2.9 : 1.35, wh = glassy ? 2.6 : b.kind === 'modern' ? 1.5 : 1.85;
  const nb = Math.floor((u1 - u0 - 0.8) / bay);
  if (nb < 1) return {dark, sky, lit, broken};
  const off = u0 + (u1 - u0 - nb * bay) / 2;
  const groundF = isFront && b.zone === 'front' ? 4.6 : 0.8;
  const d = 0.03;
  for (let y = groundF; y + wh < y1 - 0.6; y += b.storey) {
    if (y < y0) continue;
    for (let i = 0; i < nb; i++) {
      const cu = off + bay * (i + 0.5);
      if (skipHole && cu > skipHole.u0 - 1 && cu < skipHole.u1 + 1 && y + wh > skipHole.y0 - 0.5 && y < skipHole.y1 + 0.5) continue;
      const r = R(b.seed * 3 + Math.round(y * 7), i);
      const yy = y + (b.storey - wh) * 0.45;
      const poly = [P(F, cu - ww / 2, yy, d), P(F, cu + ww / 2, yy, d), P(F, cu + ww / 2, yy + wh, d), P(F, cu - ww / 2, yy + wh, d)];
      if (r < 0.05 && b.zone !== 'far') {
        // broken / burnt-out window: irregular, deep dark
        broken.push([P(F, cu - ww * 0.6, yy - 0.1, d), P(F, cu + ww * 0.55, yy + 0.05, d), P(F, cu + ww * 0.62, yy + wh * 0.8, d), P(F, cu + ww * 0.1, yy + wh + 0.25, d), P(F, cu - ww * 0.58, yy + wh * 0.9, d)]);
      } else if (r < 0.07) lit.push(poly);
      else if (r < (glassy ? 0.62 : 0.28) && y > 6) sky.push(poly);
      else dark.push(poly);
    }
  }
  return {dark, sky, lit, broken};
};

/** Storey ribbons (mid LOD). */
const ribbonPolys = (b: Bldg, F: Frame, u0: number, u1: number, y1: number) => {
  const out: V3[][] = [];
  const wh = b.kind === 'glass' || b.kind === 'tower' ? 2.2 : 1.6;
  for (let y = 4.6; y + wh < y1 - 0.6; y += b.storey * (b.zone === 'far' ? 2 : 1)) {
    const yy = y + (b.storey - wh) * 0.45;
    out.push([P(F, u0 + 0.8, yy, 0.03), P(F, u1 - 0.8, yy, 0.03), P(F, u1 - 0.8, yy + wh, 0.03), P(F, u0 + 0.8, yy + wh, 0.03)]);
  }
  return out;
};

/** Fire escape zig-zags on a brick facade (lines). */
const fireEscape = (b: Bldg, F: Frame, u: number, y1: number): V3[][] => {
  const lines: V3[][] = [];
  const w = 4.2;
  let k = 0;
  for (let y = 4.4; y < y1 - b.storey * 0.8; y += b.storey) {
    lines.push([P(F, u, y, 0.75), P(F, u + w, y, 0.75)]);
    lines.push([P(F, u, y + 0.95, 0.75), P(F, u + w, y + 0.95, 0.75)]);
    const a = k % 2 === 0 ? u + 0.3 : u + w - 0.3, c = k % 2 === 0 ? u + w - 0.3 : u + 0.3;
    lines.push([P(F, a, y, 0.55), P(F, c, y + b.storey, 0.55)]);
    k++;
  }
  // brackets back to the wall
  for (let y = 4.4; y < y1 - b.storey * 0.8; y += b.storey * 2) {
    lines.push([P(F, u, y, 0.75), P(F, u, y, 0.02)]);
    lines.push([P(F, u + w, y, 0.75), P(F, u + w, y, 0.02)]);
  }
  return lines;
};

/** Vertex-shared mesh builder (coplanar neighbours share edges, so no seams are inked). */
class MB {
  verts: V3[] = [];
  faces: Face[] = [];
  private map = new Map<string, number>();
  v(p: V3) {
    const k = `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)},${Math.round(p.z * 1000)}`;
    let i = this.map.get(k);
    if (i === undefined) { i = this.verts.length; this.verts.push(p); this.map.set(k, i); }
    return i;
  }
  face(pts: V3[], mat: string, ov?: Overlay[]) { this.faces.push({v: pts.map((p) => this.v(p)), mat, ov}); }
  mesh(crease = 30): Mesh { return {verts: this.verts, faces: this.faces, crease}; }
}

/** One volume: four walls (front may carry an opening), roof; windows per LOD. */
const volume = (mb: MB, b: Bldg, x0: number, x1: number, z0: number, z1: number, yb: number, yt: number, lod: number, wallMat: string, isMain: boolean) => {
  const sub: Bldg = {...b, x0, x1, z0, z1};
  const F = frames(sub);
  (['N', 'S', 'E', 'W'] as const).forEach((side) => {
    const fr = F[side];
    const front = side === b.front;
    const ov: Overlay[] = [];
    const hole = front && isMain && b.opening && yb < b.opening.y0 && yt > b.opening.y1 ? b.opening : undefined;
    if (lod === 0 && b.zone !== 'far') {
      const w = windowPolys(b, fr, 0, fr.W, yb, yt, hole, front && yb === 0);
      if (w.dark.length) ov.push({polys: w.dark, mat: 'window'});
      if (w.sky.length) ov.push({polys: w.sky, mat: 'windowSky'});
      if (w.lit.length) ov.push({polys: w.lit, mat: 'windowLit'});
      if (w.broken.length) ov.push({polys: w.broken, mat: 'interiorDeep'});
      if (front && b.kind === 'brick' && fr.W > 12 && yt > 12 && b.zone === 'front') ov.push({polys: fireEscape(b, fr, fr.W * (0.18 + R(b.seed, 30) * 0.5), yt), mat: 'fireEscape', line: 0.07});
      if (front && yb === 0 && b.zone === 'front') {
        // ground-floor storefront band (shutters / dark glass), no signage text
        ov.push({pts: [P(fr, 0.4, 0.15, 0.03), P(fr, fr.W - 0.4, 0.15, 0.03), P(fr, fr.W - 0.4, 3.9, 0.03), P(fr, 0.4, 3.9, 0.03)], mat: R(b.seed, 31) < 0.5 ? 'steelDark' : 'interior'});
        ov.push({pts: [P(fr, 0.2, 4.0, 0.04), P(fr, fr.W - 0.2, 4.0, 0.04), P(fr, fr.W - 0.2, 4.35, 0.04), P(fr, 0.2, 4.35, 0.04)], mat: b.kind === 'brick' ? 'limestoneDark' : 'concreteDark'});
      }
    } else if (lod === 1 || (lod === 0 && b.zone === 'far')) {
      const rb = ribbonPolys(b, fr, 0, fr.W, yt);
      if (rb.length) ov.push({polys: rb, mat: b.kind === 'glass' || b.kind === 'tower' ? 'windowSky' : 'window'});
    }
    if (hole) {
      // facade as a 3×3 grid around the opening (shared vertices, no T-junctions on the plane)
      const us = [0, hole.u0, hole.u1, fr.W], ys = [yb, hole.y0, hole.y1, yt];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) continue;
        const cellOv = ov.map((o) => ({...o, polys: o.polys?.filter((pp) => {
          const c = pp.reduce((s, q) => add3(s, q), {x: 0, y: 0, z: 0});
          const cc = mul3(c, 1 / pp.length);
          const u = (cc.x - fr.O.x) * fr.U.x + (cc.z - fr.O.z) * fr.U.z;
          return u >= us[i] && u < us[i + 1] && cc.y >= ys[j] && cc.y < ys[j + 1];
        })})).filter((o) => !o.polys || o.polys.length);
        mb.face([P(fr, us[i], ys[j]), P(fr, us[i + 1], ys[j]), P(fr, us[i + 1], ys[j + 1]), P(fr, us[i], ys[j + 1])], wallMat, cellOv.length ? cellOv : undefined);
      }
      // the opening: jambs, back wall, floors, a dark room
      const d = hole.depth;
      const A = (u: number, y: number, dd: number) => P(fr, u, y, -dd);
      mb.face([A(hole.u0, hole.y0, 0), A(hole.u0, hole.y0, d), A(hole.u0, hole.y1, d), A(hole.u0, hole.y1, 0)], 'interior'); // left jamb (faces +U)
      mb.face([A(hole.u1, hole.y0, 0), A(hole.u1, hole.y1, 0), A(hole.u1, hole.y1, d), A(hole.u1, hole.y0, d)], 'interior'); // right jamb (−U)
      mb.face([A(hole.u0, hole.y1, d), A(hole.u1, hole.y1, d), A(hole.u1, hole.y1, 0), A(hole.u0, hole.y1, 0)], 'interiorDeep'); // ceiling (−y)
      mb.face([A(hole.u1, hole.y0, 0), A(hole.u1, hole.y0, d), A(hole.u0, hole.y0, d), A(hole.u0, hole.y0, 0)], 'concreteDark'); // floor (+y)
      mb.face([A(hole.u1, hole.y0, d), A(hole.u1, hole.y1, d), A(hole.u0, hole.y1, d), A(hole.u0, hole.y0, d)], 'interiorDeep'); // back wall (+N)
      // intermediate floor slabs, broken and sagging out of the facade
      for (let y = hole.y0 + b.storey; y < hole.y1 - 0.5; y += b.storey) {
        const sag = 0.4 + R(b.seed, Math.round(y)) * 0.8;
        const lip = 0.6 + R(b.seed, Math.round(y) + 3) * 0.8;
        const t = 0.3;
        const um = (hole.u0 + hole.u1) / 2 + (R(b.seed, Math.round(y) + 5) - 0.5) * 2;
        const top = [A(hole.u0, y, d), A(hole.u0, y, 0), A(um, y - sag, -lip), A(hole.u1, y - sag * 0.3, 0), A(hole.u1, y, d)];
        const bot = top.map((q) => ({...q, y: q.y - t}));
        mb.face(top, 'concreteDark');
        mb.face(bot.slice().reverse(), 'concreteEdge');
        for (let k = 0; k < top.length; k++) {
          const k2 = (k + 1) % top.length;
          mb.face([top[k], bot[k], bot[k2], top[k2]], 'concrete');
        }
      }
    } else {
      mb.face([P(fr, 0, yb), P(fr, fr.W, yb), P(fr, fr.W, yt), P(fr, 0, yt)], wallMat, ov.length ? ov : undefined);
    }
  });
  // roof (+ parapet line)
  const roofOv: Overlay[] = lod === 0 && b.zone !== 'far' ? [{pts: [{x: x0 + 0.5, y: yt + 0.02, z: z0 + 0.5}, {x: x0 + 0.5, y: yt + 0.02, z: z1 - 0.5}, {x: x1 - 0.5, y: yt + 0.02, z: z1 - 0.5}, {x: x1 - 0.5, y: yt + 0.02, z: z0 + 0.5}, {x: x0 + 0.5, y: yt + 0.02, z: z0 + 0.5}], mat: 'roof', line: 0.18}] : [];
  mb.face([{x: x0, y: yt, z: z0}, {x: x0, y: yt, z: z1}, {x: x1, y: yt, z: z1}, {x: x1, y: yt, z: z0}], b.kind === 'brick' ? 'roofTar' : 'roof', roofOv.length ? roofOv : undefined);
};

const buildMesh = (b: Bldg, lod: number): Mesh => {
  const mb = new MB();
  const wm = WALL[b.kind][Math.floor(R(b.seed, 40) * 3)];
  if (b.rubble) {
    // a demolished lot: a low broken mound of wall pieces (handled as volumes for cheapness)
    const n = 5;
    for (let i = 0; i < n; i++) {
      const xa = b.x0 + ((b.x1 - b.x0) * i) / n, xb = xa + (b.x1 - b.x0) / n - 0.4;
      volume(mb, {...b, opening: undefined}, xa, xb, b.z0 + R(b.seed, i) * 4, b.z1 - R(b.seed, i + 9) * 4, 0, 1.5 + R(b.seed, i + 20) * 4, 2, 'rubble', false);
    }
    return mb.mesh();
  }
  if (b.crown) {
    volume(mb, b, b.x0, b.x1, b.z0, b.z1, 0, b.crown.low, lod, wm, true);
    b.crown.keep.forEach(([a, c], i) => {
      const xa = b.x0 + (b.x1 - b.x0) * a, xb = b.x0 + (b.x1 - b.x0) * c;
      if (xb - xa < 3) return;
      const top = b.crown!.low + (b.h - b.crown!.low) * (0.55 + 0.45 * R(b.seed, 50 + i));
      const zin = (b.z1 - b.z0) * (0.1 + R(b.seed, 60 + i) * 0.4);
      const za = b.front === 'S' ? b.z0 + zin * 0.5 : b.z0, zb = b.front === 'S' ? b.z1 : b.z1 - zin * 0.5;
      volume(mb, {...b, opening: undefined}, xa, xb, za, zb, b.crown!.low, top, lod, wm, false);
    });
  } else {
    volume(mb, b, b.x0, b.x1, b.z0, b.z1, 0, b.h, lod, wm, true);
  }
  let m = mb.mesh();
  if (b.waterTower && lod < 2) {
    const roofY = b.crown ? b.crown.low : b.h;
    const cx = b.x0 + (b.x1 - b.x0) * (0.3 + R(b.seed, 70) * 0.4), cz = (b.z0 + b.z1) / 2;
    const tank = xfMesh(cylinder(1.7, 3.4, 8, 'waterTower', 'waterTower', 2.4), {pos: {x: cx, y: roofY, z: cz}});
    const cone = coneMesh(1.9, 1.2, 8, 'roofTar', {x: cx, y: roofY + 5.8, z: cz});
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => box({x: cx + a * 1.1 - 0.12, y: roofY, z: cz + c * 1.1 - 0.12}, {x: cx + a * 1.1 + 0.12, y: roofY + 2.4, z: cz + c * 1.1 + 0.12}, 'steelDark'));
    m = merge(m, tank, cone, ...legs);
    m.crease = 30;
  }
  return m;
};

export const coneMesh = (r: number, h: number, seg: number, mat: string, base: V3): Mesh => {
  const verts: V3[] = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; verts.push({x: base.x + Math.cos(a) * r, y: base.y, z: base.z + Math.sin(a) * r}); }
  verts.push({x: base.x, y: base.y + h, z: base.z});
  const faces: Face[] = [];
  for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; faces.push({v: [i, seg, j], mat}); }
  faces.push({v: Array.from({length: seg}, (_, i) => i), mat});
  return {verts, faces, crease: 50};
};

const CACHE = new Map<string, Prepped>();
export const bldgMesh = (b: Bldg, lod: number): Prepped => {
  const k = `${b.id}:${lod}`;
  let m = CACHE.get(k);
  if (!m) { m = prep(buildMesh(b, lod)); CACHE.set(k, m); }
  return m;
};

/** LOD for a building at distance d from the camera, given its size. */
export const lodFor = (b: Bldg, d: number) => {
  const size = Math.max(b.h, b.x1 - b.x0);
  if (b.zone === 'far') return d < 600 ? 1 : 2;
  if (d < 110 + size * 0.6) return 0;
  if (d < 520 + size * 3) return 1;
  return 2;
};

export const centerOf = (b: Bldg): V3 => ({x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2});
export const dist2 = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export {sub3};
