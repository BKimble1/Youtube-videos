// The city: avenue frontage (detailed, damaged, interiors exposed where fires burn), the blocks behind it, the burnt
// skyline to the east, the west blocks behind the ridge, and the tower that fails in the opening. All generated once
// from seeds (deterministic); meshes are built per level of detail on first use and cached.
//   lod 0  (near)  windows per bay (one path per window material per facade CELL), fire escapes, storefronts (shutters,
//                  smashed shopfronts with dark interiors and glass shards, sign panels, awnings, blade signs),
//                  exposed floors, parapets, rooftop plant
//   lod 1  (mid)   a pattern per facade style (punched windows, ribbons, piers, curtain-wall grid), damage clusters
//   lod 2  (far)   volumes with a light pattern, setbacks, crowns
//
// R3 SPATIAL CONTRACT
//   - No two building volumes intersect, and no building enters the avenue (|z| < walkZ) or a cross street: the
//     generator places the frontage, the west flank and the skyline towers first and trims or drops block buildings
//     (and later towers) that would overlap them (tools/r3/city_check.mjs verifies it).
//   - Near facades (lod 0) are drawn as a grid of CELLS on bay and storey lines (shared vertices, no visible seams), so
//     each piece sorts by its own depth: a figure on the sidewalk sorts against the wall right behind it, not against
//     the middle of a 30 m facade. The ground-floor row (where people and machines stand next to the wall) is biased
//     back a little, and recesses/rooms behind openings further back, so anything standing in front of a wall draws
//     after it. Walls are never transparent.
//
// Exports used elsewhere: CITY(), bldgMesh(b, lod), lodFor, coneMesh, centerOf, dist2, Bldg, openingFor, bldgSteel.
import {V3, rnd, clamp, add3, mul3, sub3} from '../../kit/math';
import {Mesh, Face, Overlay, Prepped, prep, box, cylinder, merge, xfMesh} from '../engine';
import {PLAN, FIRE_SITES, A1_EVENTS} from './plan';
import {FIRES} from './fires';

export type Kind = 'brick' | 'limestone' | 'modern' | 'glass' | 'tower';
export type Side = 'N' | 'S' | 'E' | 'W';
export type Opening = {u0: number; u1: number; y0: number; y1: number; depth: number; /** which fire / site cut it */ by?: string; /** the wall it is in (default: the front) */ side?: Side};
/** facade pattern: punched windows, horizontal ribbons, vertical piers, curtain-wall grid */
export type Style = 'punched' | 'ribbon' | 'piers' | 'grid';
export type Top = 'flat' | 'parapet' | 'stepped' | 'pyramid' | 'spire' | 'slant' | 'mech';
export type Bldg = {
  id: string;
  x0: number; x1: number; z0: number; z1: number;
  h: number;
  kind: Kind;
  /** the facade that faces a street */
  front: Side;
  seed: number;
  /** broken top: the upper storeys survive only over part of the roof */
  crown?: {keep: [number, number][]; low: number};
  /** blown-out section of the front facade showing floors and rooms (the first room fire in this building) */
  opening?: Opening;
  /** further openings in the front facade (more room fires / fire sites) */
  holes?: Opening[];
  waterTower?: boolean;
  zone: 'front' | 'block' | 'far' | 'west';
  /** rubble lot instead of a building */
  rubble?: boolean;
  storey: number;
  // ---- R3 variety and damage (all optional; absent = the R2 look)
  style?: Style;
  /** setbacks: from height y up, the footprint is inset by `inset` m (cumulative) */
  tiers?: {y: number; inset: number}[];
  top?: Top;
  /** rooftop plant (boxes, vents, an antenna) */
  roofKit?: boolean;
  /** clusters of blown-out, scorched windows on the front facade (u, y in metres) */
  blown?: {u0: number; u1: number; y0: number; y1: number}[];
  /** a collapsed corner: the front's `end` ('lo' = smaller x / z end) lost from y0 up over width w, floors exposed */
  breach?: {end: 'lo' | 'hi'; w: number; y0: number};
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
    // (R3) a building next to a cross street ends at the street's edge (R2 forced ≥ 8 m and could enter the street)
    if (next) w = Math.max(3, next.x - next.w / 2 - 0.5 - x);
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

/** top of a building's full-width front wall (below its broken crown) */
const wallTop = (b: Bldg) => (b.crown ? b.crown.low : b.h);
/** the front facade's u coordinate of a world point, and the facade plane offset (outward +) */
const frontUV = (b: Bldg, p: V3) => {
  switch (b.front) {
    case 'S': return {u: p.x - b.x0, d: p.z - b.z1, W: b.x1 - b.x0};
    case 'N': return {u: b.x1 - p.x, d: b.z0 - p.z, W: b.x1 - b.x0};
    case 'E': return {u: b.z1 - p.z, d: p.x - b.x1, W: b.z1 - b.z0};
    default: return {u: p.z - b.z0, d: b.x0 - p.x, W: b.z1 - b.z0};
  }
};

/**
 * Cut an opening (a burning or burnt-out room seen through a blown-out facade) into the building nearest a fire / site
 * that can hold it: the storeys around `y` (pulled down under a broken crown or a low roof), a few bays wide.
 */
const cutRoom = (bs: Bldg[], p: V3, by: string, wBays?: number, nStoreys?: number) => {
  const cand = bs
    .filter((q) => !q.rubble && p.x >= q.x0 - 4 && p.x <= q.x1 + 4 && Math.abs(frontUV(q, p).d) < 6 && (q.front === 'S' ? p.z > (q.z0 + q.z1) / 2 : q.front === 'N' ? p.z < (q.z0 + q.z1) / 2 : true))
    // (a building tall enough for the room beats a nearer one too low for it; a broken crown is lifted to make room,
    // as in R2: the room is fitted under the building's full height)
    .map((q) => ({q, fit: q.h - q.storey * 1.2 >= p.y + q.storey ? 0 : 1, dx: p.x < q.x0 ? q.x0 - p.x : p.x > q.x1 ? p.x - q.x1 : 0}))
    .sort((a, b) => a.dx + a.fit * 20 - (b.dx + b.fit * 20));
  const b = cand[0]?.q;
  if (!b) return;
  const top = b.h - b.storey * 1.2;
  const ns = nStoreys ?? 2 + Math.floor(R(b.seed, 20) * 2);
  // above the shopfronts and their cornice on the avenue frontage
  const sMin = b.zone === 'front' ? 2 : 1;
  let s0 = Math.max(sMin, Math.floor(p.y / b.storey));
  while (s0 > sMin && s0 * b.storey + b.storey * Math.min(ns, 2) > top) s0--;
  const y0 = s0 * b.storey, y1 = Math.min(top, y0 + b.storey * ns);
  if (y1 <= y0 + 2) return;
  const {u: ucRaw, W} = frontUV(b, p);
  const uc = clamp(ucRaw, 2, W - 2);
  const bw = W > 20 ? 3.2 : 2.8;
  const nb = wBays ?? 2 + Math.round(R(b.seed, 21) * 2);
  const u0 = clamp(Math.round((uc - bw * nb * 0.5) / bw) * bw, Math.min(bw, W * 0.15), Math.max(bw, W - bw * (nb + 1)));
  const u1 = clamp(u0 + bw * nb, u0 + bw * 1.5, W - Math.min(bw, W * 0.12));
  if (u1 - u0 < 2.5) return;
  const o: Opening = {u0, u1, y0, y1, depth: 5 + R(b.seed, 22) * 3, by};
  // one opening may serve two fires (southB / southC in the same block): skip overlaps
  const all = [b.opening, ...(b.holes ?? [])].filter(Boolean) as Opening[];
  if (all.some((q) => (q.side ?? b.front) === b.front && q.u0 < o.u1 + 0.8 && o.u0 < q.u1 + 0.8 && q.y0 < o.y1 + 0.5 && o.y0 < q.y1 + 0.5)) return;
  if (!b.opening) b.opening = o;
  else (b.holes ??= []).push(o);
  // keep the crown damage away from the opening's storeys
  if (b.crown && b.crown.low < y1 + b.storey) b.crown.low = y1 + b.storey;
  if (b.crown && b.crown.low >= b.h - 0.5) b.crown = undefined;
};

/** Fit openings to the interior fires (FIRES, ATMOS) and the room / opening fire sites (FIRE_SITES, plan.ts). */
const placeOpenings = (bs: Bldg[], sitesOnly = false) => {
  if (!sitesOnly) FIRES.filter((f) => f.interior).forEach((f) => cutRoom(bs, f.pos, f.id));
  FIRE_SITES.filter((s) => s.kind === 'room').forEach((s) => cutRoom(bs, s.pos, s.id, s.bays, s.storeys));
};

const overlaps = (a: Bldg, b: Bldg, pad = 0.5) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > -pad && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > -pad;

/** the buildings flanking the collapse north and south of the ridge, and the west blocks behind it */
const flankBldgs = (): Bldg[] => {
  const flank: [number, number, number, number, number][] = [
    [-44, -14, -62, -40, 30], [-10, 12, -60, -38, 22], [-44, -16, 40, 64, 26], [-12, 12, 38, 60, 34],
    [-120, -60, -40, -12, 44], [-120, -64, 10, 38, 58], [-180, -130, -30, 20, 92], [-200, -140, 40, 80, 70],
  ];
  return flank.map(([x0, x1, z0, z1, h], k) => ({id: `W${k}`, x0, x1, z0, z1, h, kind: k % 3 === 0 ? 'limestone' : k % 3 === 1 ? 'brick' : 'modern', front: x1 < -40 ? 'E' : z0 < 0 ? 'S' : 'N', seed: 7000 + k, zone: 'west', storey: STOREY, crown: k % 2 === 0 ? {keep: [[0, 0.5]], low: h * 0.7} : undefined} as Bldg));
};

const blocks = (taken: Bldg[]): Bldg[] => {
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
          const b: Bldg = {
            id: `B${n}`, x0: x, x1: x + w,
            z0: side < 0 ? -zB : zA, z1: side < 0 ? -zA : zB,
            h, kind, front: side < 0 ? 'S' : 'N', seed: s, zone: x < -40 ? 'west' : 'block', storey: STOREY,
            crown: R(s, 6) < 0.3 ? {keep: [[0, 0.45 + R(s, 7) * 0.3]], low: h * (0.55 + R(s, 8) * 0.25)} : undefined,
            waterTower: kind === 'brick' && R(s, 9) < 0.35 && h < 50,
          };
          // (R3) trim the block back from anything already standing there (the west flank, a skyline tower):
          // keep the part on the avenue side if it is still a building, else drop it
          let ok = true;
          for (const q of taken) {
            if (!overlaps(b, q, -0.6)) continue;
            // the largest piece left beside it (in z or in x) that is still a building, else drop it
            const opts = [
              {x0: b.x0, x1: b.x1, z0: b.z0, z1: Math.min(b.z1, q.z0 - 1)}, {x0: b.x0, x1: b.x1, z0: Math.max(b.z0, q.z1 + 1), z1: b.z1},
              {x0: b.x0, x1: Math.min(b.x1, q.x0 - 1), z0: b.z0, z1: b.z1}, {x0: Math.max(b.x0, q.x1 + 1), x1: b.x1, z0: b.z0, z1: b.z1},
            ].filter((r) => r.x1 - r.x0 >= 10 && r.z1 - r.z0 >= 12).sort((r1, r2) => (r2.x1 - r2.x0) * (r2.z1 - r2.z0) - (r1.x1 - r1.x0) * (r1.z1 - r1.z0));
            if (!opts.length) { ok = false; break; }
            Object.assign(b, opts[0]);
          }
          if (ok && taken.some((q) => overlaps(b, q, -0.6))) ok = false;
          if (ok) out.push(b);
        }
        x += w + 1;
        n++;
      }
    }
  }
  return out;
};

const skyline = (taken: Bldg[]): Bldg[] => {
  const out: Bldg[] = [];
  for (let n = 0; n < 110; n++) {
    const s = 9000 + n;
    const cx = 1450 + (R(s, 1) - 0.5) * 1700, cz = -100 + (R(s, 2) - 0.5) * 1600;
    if (Math.abs(cz) < 40) continue; // keep the avenue's corridor open toward the horizon
    if (Math.hypot(cx - PLAN.failingTower.base.x, cz - PLAN.failingTower.base.z) < 90) continue;
    const core = Math.exp(-(((cx - 1500) / 600) ** 2) - ((cz + 150) / 500) ** 2);
    const h = 60 + R(s, 3) * 120 + core * (120 + R(s, 4) * 200);
    const w = 22 + R(s, 5) * 30, d = 22 + R(s, 6) * 30;
    const b: Bldg = {id: `K${n}`, x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, h, kind: R(s, 7) < 0.4 ? 'glass' : 'tower', front: 'W', seed: s, zone: 'far', storey: 4};
    // (R3) never in the avenue's corridor (|z| < walkZ + 6) nor through the frontage, the flank or another tower
    if (Math.min(Math.abs(b.z0), Math.abs(b.z1)) < PLAN.avenue.walkZ + 6 || (b.z0 < 0 && b.z1 > 0)) continue;
    if ([...taken, ...out].some((q) => overlaps(b, q, 2))) continue;
    out.push(b);
  }
  return out;
};

// ------------------------------------------------------------------ variety and damage (deterministic per seed)
const DISTINCT: Record<string, Partial<Bldg>> = {
  // a few hero silhouettes in the skyline and the far city (no real buildings: generic NY types)
  K0: {top: 'spire'}, K2: {top: 'pyramid'}, K6: {top: 'slant'}, K11: {top: 'stepped'}, K14: {top: 'spire'}, K25: {top: 'pyramid'},
};

const decorate = (b: Bldg) => {
  const s = b.seed;
  const r = (k: number) => R(s, 200 + k);
  if (b.rubble) return;
  // facade pattern
  b.style = b.kind === 'brick' ? 'punched' : b.kind === 'limestone' ? (r(1) < 0.62 ? 'punched' : 'piers') : b.kind === 'modern' ? (r(1) < 0.55 ? 'ribbon' : 'piers') : b.kind === 'glass' ? (r(1) < 0.7 ? 'grid' : 'ribbon') : r(1) < 0.5 ? 'piers' : 'grid';
  const W = b.x1 - b.x0, D = b.z1 - b.z0;
  const nearAction = b.zone === 'front' && b.x0 < 130;
  // setbacks on tall buildings (wedding-cake towers), never on the frontage by the battle
  const holed = !!b.opening || !!b.holes?.length;
  if (!b.crown && !holed && !nearAction && b.h > 64 && Math.min(W, D) > 22 && r(2) < (b.zone === 'front' ? 0.35 : 0.7)) {
    const n = b.h > 140 && r(3) < 0.6 ? 2 : 1;
    b.tiers = Array.from({length: n}, (_, i) => ({y: Math.round((b.h * (0.5 + i * 0.22 + r(4 + i) * 0.12)) / b.storey) * b.storey, inset: Math.min(W, D) * (0.09 + r(6 + i) * 0.07)}));
  }
  // tops
  if (!b.crown) {
    const t = r(8);
    b.top = b.h > 90 ? (t < 0.2 ? 'stepped' : t < 0.36 ? 'pyramid' : t < 0.48 ? 'spire' : t < 0.6 ? 'slant' : t < 0.85 ? 'mech' : 'flat') : b.h > 30 ? (t < 0.45 ? 'mech' : t < 0.8 ? 'parapet' : 'flat') : t < 0.6 ? 'parapet' : 'flat';
    b.roofKit = r(9) < 0.75;
  }
  Object.assign(b, DISTINCT[b.id] ?? {});
  // window damage: clusters, denser away from the action (the battle's own buildings stay readable backdrops)
  const p = nearAction ? 0.3 : b.zone === 'front' ? 0.6 : b.zone === 'far' ? 0.35 : 0.45;
  if (r(10) < p && b.h > 10) {
    const n = 1 + (r(11) < 0.4 ? 1 : 0) + (r(12) < 0.15 ? 1 : 0);
    const Wf = b.front === 'N' || b.front === 'S' ? W : D;
    const top = wallTop(b) - b.storey;
    b.blown = Array.from({length: n}, (_, i) => {
      const w = Math.min(Wf * 0.6, 4 + r(13 + i) * 9), hh = b.storey * (1 + Math.floor(r(16 + i) * 3));
      const u0 = r(19 + i) * Math.max(0, Wf - w), y0 = Math.max(b.storey * 1.3, r(22 + i) * (top - hh));
      return {u0, u1: u0 + w, y0, y1: Math.min(top, y0 + hh)};
    }).filter((c) => c.y1 > c.y0 + 1.5);
  }
};

/** hand-placed structural damage: collapsed corners with exposed floors (clusters, away from the fighting) */
const BREACHES: Record<string, Bldg['breach']> = {
  FN6: {end: 'hi', w: 8, y0: 34}, // x 157–175: seen from the ridge, B4 and the aerial over the first cross street
  FN12: {end: 'lo', w: 9, y0: 31}, // x 293–313: the aerial's mid-ground
  FS9: {end: 'hi', w: 10, y0: 41}, // x 301–337
  FS20: {end: 'lo', w: 11, y0: 54}, // x 632–661 near the failing tower's line
  W1: {end: 'lo', w: 8, y0: 10}, // the flank block north of the ridge: in the final pullback, beside the Crew
  W3: {end: 'hi', w: 9, y0: 17}, // the flank block south of the ridge
};

let CITY_CACHE: Bldg[] | null = null;
export const CITY = (): Bldg[] => {
  if (CITY_CACHE) return CITY_CACHE;
  const f = [...frontage(-1), ...frontage(1)];
  // A1's peeling wall: the hole it leaves (the falling section itself is set.tsx's)
  const pe = A1_EVENTS.peel, fb = f.find((b) => b.id === pe.bld);
  if (fb) (fb.holes ??= []).push({u0: pe.u0, u1: pe.u1, y0: pe.y0, y1: pe.y1, depth: 6.5, by: 'a1_peel', side: pe.side});
  placeOpenings(f);
  const W = flankBldgs();
  placeOpenings(W, true);
  const K = skyline([...f, ...W]);
  const B = blocks([...W, ...K, ...f]);
  const all = [...f, ...B, ...W, ...K];
  all.forEach(decorate);
  all.forEach((b) => { const br = BREACHES[b.id]; if (br && !b.rubble) { b.breach = br; b.crown = undefined; b.tiers = undefined; b.top = 'flat'; } });
  CITY_CACHE = all;
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
const framesXZ = (x0: number, x1: number, z0: number, z1: number): Record<Side, Frame> => ({
  S: {O: {x: x0, y: 0, z: z1}, U: {x: 1, y: 0, z: 0}, N: {x: 0, y: 0, z: 1}, W: x1 - x0},
  N: {O: {x: x1, y: 0, z: z0}, U: {x: -1, y: 0, z: 0}, N: {x: 0, y: 0, z: -1}, W: x1 - x0},
  E: {O: {x: x1, y: 0, z: z1}, U: {x: 0, y: 0, z: -1}, N: {x: 1, y: 0, z: 0}, W: z1 - z0},
  W: {O: {x: x0, y: 0, z: z0}, U: {x: 0, y: 0, z: 1}, N: {x: -1, y: 0, z: 0}, W: z1 - z0},
});
const P = (F: Frame, u: number, y: number, d = 0): V3 => ({x: F.O.x + F.U.x * u + F.N.x * d, y, z: F.O.z + F.U.z * u + F.N.z * d});
const uOf = (F: Frame, p: V3) => (p.x - F.O.x) * F.U.x + (p.z - F.O.z) * F.U.z;

/** window layout of a facade style */
const winSpec = (b: Bldg) => {
  const st = b.style ?? (b.kind === 'glass' || b.kind === 'tower' ? 'grid' : b.kind === 'modern' ? 'ribbon' : 'punched');
  const glassy = b.kind === 'glass' || b.kind === 'tower';
  switch (st) {
    case 'grid': return {bay: 3.0, ww: 2.6, wh: 2.6, st};
    case 'ribbon': return {bay: 3.6, ww: 3.2, wh: 1.5, st};
    case 'piers': return {bay: glassy ? 3.0 : 2.6, ww: glassy ? 2.0 : 1.5, wh: 2.5, st};
    default: return {bay: b.kind === 'modern' ? 3.6 : 3.1, ww: b.kind === 'modern' ? 2.9 : 1.35, wh: b.kind === 'modern' ? 1.5 : 1.85, st};
  }
};

/** a blown-out window: irregular dark hole, slightly larger than the frame */
const brokenPoly = (F: Frame, cu: number, yy: number, ww: number, wh: number, d: number, seed: number) => {
  const j = (k: number) => (rnd(seed * 17 + k) - 0.5) * 0.3;
  return [P(F, cu - ww * (0.6 + j(1)), yy - 0.1, d), P(F, cu + ww * (0.55 + j(2)), yy + 0.05, d), P(F, cu + ww * (0.62 + j(3)), yy + wh * 0.8, d), P(F, cu + ww * (0.1 + j(4)), yy + wh + 0.25, d), P(F, cu - ww * (0.58 + j(5)), yy + wh * (0.9 + j(6)), d)];
};
/** soot licking up from a blown window (scorch, half-transparent, no ink) */
const scorchPoly = (F: Frame, cu: number, yTop: number, ww: number, d: number, seed: number) => {
  const h = 1.2 + rnd(seed * 7) * 1.8, w = ww * (0.9 + rnd(seed * 3) * 0.6);
  return [P(F, cu - w * 0.55, yTop - 0.1, d), P(F, cu + w * 0.55, yTop - 0.1, d), P(F, cu + w * 0.3, yTop + h * 0.6, d), P(F, cu + w * (0.05 + rnd(seed * 5) * 0.2), yTop + h, d), P(F, cu - w * 0.25, yTop + h * 0.7, d)];
};

type Holes = Opening[];
const inHole = (holes: Holes, cu: number, y: number, ww: number, wh: number) => holes.some((h) => cu + ww / 2 > h.u0 - 0.35 && cu - ww / 2 < h.u1 + 0.35 && y + wh > h.y0 - 0.5 && y < h.y1 + 0.5);
const inBlown = (b: Bldg, isFront: boolean, cu: number, y: number) => isFront && !!b.blown?.some((c) => cu > c.u0 && cu < c.u1 && y > c.y0 && y < c.y1);

/** Windows of a facade region (u0..u1, y0..y1), sorted into the window materials. */
const windowPolys = (b: Bldg, F: Frame, u0: number, u1: number, y0: number, y1: number, holes: Holes, isFront: boolean, groundF: number) => {
  const dark: V3[][] = [], sky: V3[][] = [], lit: V3[][] = [], broken: V3[][] = [], scorch: V3[][] = [];
  const {bay, ww, wh} = winSpec(b);
  const glassy = b.kind === 'glass' || b.kind === 'tower';
  const nb = Math.floor((u1 - u0 - 0.8) / bay);
  if (nb < 1) return {dark, sky, lit, broken, scorch};
  const off = u0 + (u1 - u0 - nb * bay) / 2;
  const d = 0.03;
  for (let y = groundF; y + wh < y1 - 0.6; y += b.storey) {
    if (y < y0) continue;
    for (let i = 0; i < nb; i++) {
      const cu = off + bay * (i + 0.5);
      const yy = y + (b.storey - wh) * 0.45;
      if (inHole(holes, cu, yy, ww, wh)) continue;
      const r = R(b.seed * 3 + Math.round(y * 7), i);
      const poly = [P(F, cu - ww / 2, yy, d), P(F, cu + ww / 2, yy, d), P(F, cu + ww / 2, yy + wh, d), P(F, cu - ww / 2, yy + wh, d)];
      const blownHere = inBlown(b, isFront, cu, yy);
      if (blownHere && r < 0.85) {
        broken.push(brokenPoly(F, cu, yy, ww, wh, d, b.seed + i * 13 + Math.round(y)));
        if (r < 0.55) scorch.push(scorchPoly(F, cu, yy + wh, ww, d * 0.5, b.seed + i * 7 + Math.round(y * 3)));
      } else if (r < 0.05 && b.zone !== 'far') {
        broken.push(brokenPoly(F, cu, yy, ww, wh, d, b.seed + i * 13 + Math.round(y)));
      } else if (r < 0.07) lit.push(poly);
      else if (r < (glassy ? 0.62 : 0.28) && y > 6) sky.push(poly);
      else dark.push(poly);
    }
  }
  return {dark, sky, lit, broken, scorch};
};

/** Mid-LOD facade pattern by style (a few dozen polygons at most): breaks the uniform striping of the far city. */
const patternPolys = (b: Bldg, F: Frame, yb: number, yt: number, lod: number, isFront: boolean) => {
  const out: {polys: V3[][]; mat: string; line?: number}[] = [];
  const st = winSpec(b).st;
  const glassy = b.kind === 'glass' || b.kind === 'tower';
  const d = 0.03, W = F.W;
  if (W < 3) return out;
  const y0 = Math.max(yb, b.zone === 'front' ? 4.6 : 0.8);
  const step = b.storey * (lod === 2 ? 3 : b.zone === 'far' ? 2 : 1);
  const wins: V3[][] = [];
  if (st === 'ribbon' || (lod === 2 && st === 'punched')) {
    const wh = glassy ? 2.2 : 1.6;
    for (let y = y0; y + wh < yt - 0.6; y += step) {
      const yy = y + (b.storey - wh) * 0.45;
      wins.push([P(F, 0.8, yy, d), P(F, W - 0.8, yy, d), P(F, W - 0.8, yy + wh, d), P(F, 0.8, yy + wh, d)]);
    }
    out.push({polys: wins, mat: glassy ? 'windowSky' : 'window'});
  } else if (st === 'piers') {
    const bay = lod === 2 ? 6 : 3.2, pw = bay * 0.52;
    const n = Math.max(1, Math.floor((W - 1.6) / bay));
    const off = (W - n * bay) / 2;
    for (let i = 0; i < n; i++) { const c = off + bay * (i + 0.5); wins.push([P(F, c - pw / 2, y0 + 0.6, d), P(F, c + pw / 2, y0 + 0.6, d), P(F, c + pw / 2, yt - 1.8, d), P(F, c - pw / 2, yt - 1.8, d)]); }
    out.push({polys: wins, mat: glassy ? 'windowSky' : 'window'});
    if (lod === 1) {
      // spandrels across the piers' windows every storey (a fine horizontal rhythm)
      const lines: V3[][] = [];
      for (let y = y0 + b.storey; y < yt - 2; y += b.storey * (b.zone === 'far' ? 2 : 1)) lines.push([P(F, off, y, d * 1.5), P(F, W - off, y, d * 1.5)]);
      out.push({polys: lines, mat: WALL[b.kind][Math.floor(R(b.seed, 40) * 3)], line: 0.45});
    }
  } else if (st === 'grid') {
    // curtain wall: the facade IS glass; mullions as a line grid
    const lines: V3[][] = [];
    const bay = lod === 2 ? 9 : 3.0, vstep = b.storey * (lod === 2 ? 4 : 2);
    for (let u = bay; u < W - 0.5; u += bay) lines.push([P(F, u, y0, d), P(F, u, yt - 0.6, d)]);
    for (let y = y0; y < yt - 0.6; y += vstep) lines.push([P(F, 0.3, y, d), P(F, W - 0.3, y, d)]);
    out.push({polys: [[P(F, 0.3, y0, d * 0.5), P(F, W - 0.3, y0, d * 0.5), P(F, W - 0.3, yt - 0.6, d * 0.5), P(F, 0.3, yt - 0.6, d * 0.5)]], mat: R(b.seed, 41) < 0.5 ? 'windowSky' : 'glassLight'});
    out.push({polys: lines, mat: 'steelDark', line: lod === 2 ? 0.5 : 0.18});
  } else if (lod === 1) {
    // punched: pairs of windows per storey (short segments with piers between)
    const pair = 6.2, pw = 3.6, wh = 1.7;
    const n = Math.max(1, Math.floor((W - 1) / pair));
    const off = (W - n * pair) / 2;
    for (let y = y0; y + wh < yt - 0.6; y += step) {
      const yy = y + (b.storey - wh) * 0.45;
      for (let i = 0; i < n; i++) { const c = off + pair * (i + 0.5); wins.push([P(F, c - pw / 2, yy, d), P(F, c + pw / 2, yy, d), P(F, c + pw / 2, yy + wh, d), P(F, c - pw / 2, yy + wh, d)]); }
    }
    out.push({polys: wins, mat: 'window'});
  }
  // damage clusters read at a distance: a dark burnt hole with soot above
  if (isFront && b.blown && lod === 1) {
    const holes: V3[][] = [], soot: V3[][] = [];
    b.blown.forEach((c, i) => {
      const cu = (c.u0 + c.u1) / 2, w = c.u1 - c.u0, h = c.y1 - c.y0;
      if (c.u1 > W || c.y0 < yb || c.y1 > yt) return;
      const j = (k: number) => rnd(b.seed * 31 + i * 7 + k);
      holes.push([P(F, c.u0 + w * 0.1 * j(1), c.y0 + h * 0.15, d * 2), P(F, c.u1 - w * 0.12 * j(2), c.y0, d * 2), P(F, c.u1, c.y0 + h * (0.6 + 0.3 * j(3)), d * 2), P(F, cu + w * 0.2 * j(4), c.y1, d * 2), P(F, c.u0, c.y1 - h * 0.2 * j(5), d * 2)]);
      soot.push([P(F, c.u0 + w * 0.15, c.y1 - 0.4, d * 1.5), P(F, c.u1 - w * 0.1, c.y1 - 0.4, d * 1.5), P(F, cu + w * 0.25, c.y1 + h * 0.9, d * 1.5), P(F, cu - w * 0.1, c.y1 + h * 1.3, d * 1.5)]);
    });
    if (soot.length) out.push({polys: soot, mat: 'scorch'});
    if (holes.length) out.push({polys: holes, mat: 'interiorDeep'});
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
  face(pts: V3[], mat: string, ov?: Overlay[], bias?: number) { this.faces.push({v: pts.map((p) => this.v(p)), mat, ov, bias}); }
  mesh(crease = 30): Mesh { return {verts: this.verts, faces: this.faces, crease}; }
}

// ------------------------------------------------------------------ storefronts (front facades, ground floor, lod 0)
type Shop = {u0: number; u1: number; kind: 'shutter' | 'smashed' | 'dark' | 'boarded'; sign?: string; awning?: string; blade?: boolean; hangSign?: boolean};
const SIGN_MATS = ['vanStripe', 'busStripe', 'carRed', 'taxiDark', 'girder', 'steelDark', 'limestoneDark'];
const shopsOf = (b: Bldg, W: number): Shop[] => {
  const out: Shop[] = [];
  const quiet = b.x0 < 125 && b.zone === 'front'; // the battle's own frontage: simple, readable backdrop
  let u = 0.6, k = 0;
  while (u < W - 3) {
    const w = Math.min(W - 0.6 - u, 4.8 + R(b.seed, 300 + k) * 4.4);
    if (w < 2.6) break;
    const r = R(b.seed, 320 + k);
    const kind: Shop['kind'] = quiet ? (r < 0.55 ? 'shutter' : 'dark') : r < 0.3 ? 'shutter' : r < 0.62 ? 'smashed' : r < 0.84 ? 'dark' : 'boarded';
    const s: Shop = {u0: u, u1: u + w, kind};
    if (R(b.seed, 340 + k) < (quiet ? 0.35 : 0.7)) s.sign = SIGN_MATS[Math.floor(R(b.seed, 360 + k) * SIGN_MATS.length)];
    if (!quiet && R(b.seed, 380 + k) < 0.3) s.awning = ['carRed', 'girder', 'vanStripe', 'busStripe'][Math.floor(R(b.seed, 400 + k) * 4)];
    if (!quiet && !s.awning && R(b.seed, 420 + k) < 0.22) s.blade = true;
    if (!quiet && s.sign && R(b.seed, 440 + k) < 0.18) s.hangSign = true;
    out.push(s);
    u += w + 0.7;
    k++;
  }
  return out;
};

/** A recess behind an opening in a facade (jambs, back wall, floor, ceiling), drawn behind the wall cells. */
const recess = (mb: MB, fr: Frame, o: {u0: number; u1: number; y0: number; y1: number}, depth: number, back = 'interiorDeep', bias = -2.2) => {
  const A = (u: number, y: number, dd: number) => P(fr, u, y, -dd);
  mb.face([A(o.u0, o.y0, 0), A(o.u0, o.y0, depth), A(o.u0, o.y1, depth), A(o.u0, o.y1, 0)], 'interior', undefined, bias);
  mb.face([A(o.u1, o.y0, 0), A(o.u1, o.y1, 0), A(o.u1, o.y1, depth), A(o.u1, o.y0, depth)], 'interior', undefined, bias);
  mb.face([A(o.u0, o.y1, depth), A(o.u1, o.y1, depth), A(o.u1, o.y1, 0), A(o.u0, o.y1, 0)], 'interiorDeep', undefined, bias);
  mb.face([A(o.u1, o.y0, 0), A(o.u1, o.y0, depth), A(o.u0, o.y0, depth), A(o.u0, o.y0, 0)], 'concreteDark', undefined, bias);
  mb.face([A(o.u1, o.y0, depth), A(o.u1, o.y1, depth), A(o.u0, o.y1, depth), A(o.u0, o.y0, depth)], back, undefined, bias - depth * 0.3);
};

/** glass shards left in a smashed frame (small triangles in the facade plane) */
const shards = (mb: MB, fr: Frame, o: {u0: number; u1: number; y0: number; y1: number}, seed: number) => {
  const n = 3 + Math.floor(rnd(seed) * 4);
  for (let i = 0; i < n; i++) {
    const top = rnd(seed * 3 + i) < 0.6;
    const u = o.u0 + 0.2 + rnd(seed * 5 + i) * (o.u1 - o.u0 - 0.4);
    const w = 0.25 + rnd(seed * 7 + i) * 0.5, h = 0.4 + rnd(seed * 11 + i) * 0.9;
    const y = top ? o.y1 : o.y0;
    const tip = top ? y - h : y + h;
    mb.face(top ? [P(fr, u - w / 2, y, 0.015), P(fr, u + w * 0.2, tip, 0.015), P(fr, u + w / 2, y, 0.015)] : [P(fr, u - w / 2, y, 0.015), P(fr, u + w / 2, y, 0.015), P(fr, u + w * (rnd(seed * 13 + i) - 0.5), tip, 0.015)], i % 2 ? 'glassLight' : 'windowSky', undefined, -0.6);
  }
};

/**
 * Exposed interior: a side where the building has been torn away. The face keeps the wall's material at its ragged
 * edges; a torn, jagged opening shows the dark rooms between the floor-slab edges and columns (and now and then a
 * warm glow). Reads as a wall ripped open, not as a dark glass box.
 */
const exposedOv = (F: Frame, yb: number, yt: number, storey: number, seed: number): Overlay[] => {
  const d = 0.03, W = F.W, H = yt - yb;
  const r = (k: number) => rnd(seed * 37 + k);
  // ragged outline: wall remnants along the bottom, both edges and (lower) the top corners
  const m = Math.min(2.4, W * 0.16);
  const left: {u: number; y: number}[] = [], right: {u: number; y: number}[] = [], top: {u: number; y: number}[] = [];
  const n = Math.max(3, Math.round(H / storey));
  for (let i = 0; i <= n; i++) {
    const y = yb + 0.35 + ((H - 0.6) * i) / n;
    left.push({u: m * (0.25 + r(i) * 1.9), y});
    right.push({u: W - m * (0.25 + r(40 + i) * 1.9), y});
  }
  const nt = Math.max(3, Math.round(W / 2.2));
  for (let i = nt; i >= 0; i--) top.push({u: m + ((W - 2 * m) * i) / nt, y: yt - 0.15 - (i % 2 ? (0.4 + r(80 + i)) * Math.min(3.4, H * 0.3) : r(80 + i) * 0.6)});
  // (left goes up, the top runs left → right, the right comes down)
  const torn = [...left, ...top.slice().sort((a, b) => a.u - b.u), ...right.slice().sort((a, b) => b.y - a.y)].map((q) => P(F, q.u, q.y, d));
  const uL = (y: number) => { let u = left[0].u; for (const q of left) if (q.y <= y) u = q.u; return u + 0.05; };
  const uR = (y: number) => { let u = right[0].u; for (const q of right) if (q.y <= y) u = q.u; return u - 0.05; };
  const slabs: V3[][] = [], cols: V3[][] = [], warm: V3[][] = [];
  for (let y = Math.ceil((yb + 0.4) / storey) * storey; y < yt - 0.8; y += storey) {
    const a = uL(y), b = uR(y);
    if (b - a < 1) continue;
    // slab edges, some broken back short of the opening's edge
    const a2 = a + (r(120 + y) < 0.3 ? r(130 + y) * (b - a) * 0.3 : 0), b2 = b - (r(140 + y) < 0.3 ? r(150 + y) * (b - a) * 0.3 : 0);
    // a slab edge in broken lengths (gaps where it has fallen, a sag at one break)
    let u = a2;
    let k = 0;
    while (u < b2 - 0.5) {
      const L = Math.min(b2 - u, 2.5 + r(160 + y * 3 + k) * 5);
      const sag = r(170 + y + k) < 0.3 ? 0.35 + r(175 + k) * 0.5 : 0;
      slabs.push([P(F, u, y - 0.38, d * 1.2), P(F, u + L, y - 0.38 - sag, d * 1.2), P(F, u + L, y - sag, d * 1.2), P(F, u, y, d * 1.2)]);
      u += L + (r(180 + y + k) < 0.4 ? 0.8 + r(185 + k) * 1.8 : 0.05);
      k++;
    }
  }
  for (let u = m * 2 + 2.5 + r(160) * 2; u < W - m * 2; u += 5.5 + r(170 + u) * 1.5) cols.push([P(F, u, yb + 0.4, d * 1.1), P(F, u, yt - 1.2 - r(180 + u) * 2, d * 1.1)]);
  if (r(190) < 0.45 && H > storey * 2.2) {
    const y = Math.ceil(yb / storey) * storey + storey, a = W * (0.25 + r(191) * 0.25);
    warm.push([P(F, a, y + 0.1, d * 1.1), P(F, a + W * 0.22, y + 0.1, d * 1.1), P(F, a + W * 0.22, y + storey * 0.45, d * 1.1), P(F, a, y + storey * 0.45, d * 1.1)]);
  }
  return [
    {polys: [torn], mat: 'interiorDeep'},
    ...(warm.length ? [{polys: warm, mat: 'interior'}] : []),
    {polys: slabs, mat: 'concreteEdge'},
    {polys: cols, mat: 'concreteDark', line: 0.4},
  ];
};

/** Clip an overlay to a facade cell [ua,ub]×[ya,yc] in facade space (u along the wall, y up; d interpolated). */
const clipOv = (o: Overlay, F: Frame, ua: number, ub: number, ya: number, yc: number): Overlay | null => {
  const toL = (p: V3) => ({u: uOf(F, p), y: p.y, d: (p.x - F.O.x) * F.N.x + (p.z - F.O.z) * F.N.z});
  const toW = (q: {u: number; y: number; d: number}) => P(F, q.u, q.y, q.d);
  type L = {u: number; y: number; d: number};
  const lerpL = (a: L, b: L, t: number): L => ({u: a.u + (b.u - a.u) * t, y: a.y + (b.y - a.y) * t, d: a.d + (b.d - a.d) * t});
  const inside = (q: L) => q.u >= ua - 1e-6 && q.u <= ub + 1e-6 && q.y >= ya - 1e-6 && q.y <= yc + 1e-6;
  const clipPoly = (Q: L[]): L[] => {
    let R0 = Q;
    const edges: [(q: L) => number][] = [[(q) => q.u - ua], [(q) => ub - q.u], [(q) => q.y - ya], [(q) => yc - q.y]];
    for (const [f] of edges) {
      const out: L[] = [];
      for (let i = 0; i < R0.length; i++) {
        const a = R0[i], b = R0[(i + 1) % R0.length];
        const fa = f(a), fb = f(b);
        if (fa >= 0) out.push(a);
        if ((fa >= 0) !== (fb >= 0)) out.push(lerpL(a, b, fa / (fa - fb)));
      }
      R0 = out;
      if (R0.length < 3) return [];
    }
    return R0;
  };
  const clipLine = (Q: L[]): L[][] => {
    const pieces: L[][] = [];
    for (let i = 0; i + 1 < Q.length; i++) {
      const a = Q[i], b = Q[i + 1];
      let t0 = 0, t1 = 1;
      const du = b.u - a.u, dy = b.y - a.y;
      const ok = [[-du, a.u - ua], [du, ub - a.u], [-dy, a.y - ya], [dy, yc - a.y]].every(([pp, qq]) => {
        if (Math.abs(pp) < 1e-9) return qq >= 0;
        const r = qq / pp;
        if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
        return true;
      });
      if (ok && t1 - t0 > 1e-4) pieces.push([lerpL(a, b, t0), lerpL(a, b, t1)]);
    }
    return pieces;
  };
  const groups = o.polys ?? (o.pts ? [o.pts] : []);
  const res: V3[][] = [];
  for (const G of groups) {
    const Q = G.map(toL);
    if (Q.every(inside)) { res.push(G); continue; }
    let u0 = 1e9, u1 = -1e9, y0 = 1e9, y1 = -1e9;
    Q.forEach((q) => { u0 = Math.min(u0, q.u); u1 = Math.max(u1, q.u); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    if (u1 < ua || u0 > ub || y1 < ya || y0 > yc) continue;
    if (o.line) clipLine(Q).forEach((pc) => res.push(pc.map(toW)));
    else { const C = clipPoly(Q); if (C.length >= 3) res.push(C.map(toW)); }
  }
  if (!res.length) return null;
  return {mat: o.mat, line: o.line, ink: o.ink, polys: res};
};

/** Row and column break lines of a facade at lod 0 (bay- and storey-aligned), plus hole edges. */
const cellBreaks = (b: Bldg, F: Frame, yb: number, yt: number, holes: Holes, groundF: number) => {
  const {bay} = winSpec(b);
  const nb = Math.floor((F.W - 0.8) / bay);
  const off = (F.W - Math.max(0, nb) * bay) / 2;
  const g = Math.max(1, Math.floor(6.6 / bay)); // cells ≤ ~6.6 m wide
  const us = new Set<number>([0, F.W]);
  for (let k = g; k < nb; k += g) us.add(off + k * bay);
  const ys = new Set<number>([yb, yt]);
  if (groundF > yb + 0.5 && groundF < yt - 0.5) ys.add(groundF - 0.1);
  // rows: two storeys at a time near the ground (where people and machines stand against the wall), four above
  // ~11 m (a figure's outline never reaches that high on the wall behind it; fewer cells to draw)
  for (let y = groundF; y < yt - 1; y += (y < 11 ? 2 : 4) * b.storey) if (y > yb + 0.5) ys.add(y);
  holes.forEach((h) => { us.add(h.u0); us.add(h.u1); if (h.y0 > yb && h.y0 < yt) ys.add(h.y0); if (h.y1 > yb && h.y1 < yt) ys.add(h.y1); });
  const U = [...us].filter((u) => u >= 0 && u <= F.W).sort((a, c) => a - c).filter((u, i, a) => i === 0 || u - a[i - 1] > 0.3);
  const Y = [...ys].filter((y) => y >= yb && y <= yt).sort((a, c) => a - c).filter((y, i, a) => i === 0 || y - a[i - 1] > 0.3);
  // the last break must be the edge itself
  U[U.length - 1] = F.W; Y[Y.length - 1] = yt;
  return {U, Y};
};

/** One volume: four walls (front may carry openings, shops, damage), roof; detail per LOD. `cut` = exposed sides. */
const volume = (mb: MB, b: Bldg, x0: number, x1: number, z0: number, z1: number, yb: number, yt: number, lod: number, wallMat: string, isMain: boolean, cut: Side[] = [], roofMat?: string, under: {x0: number; x1: number; z0: number; z1: number}[] = []) => {
  const F = framesXZ(x0, x1, z0, z1);
  const fullFront = Math.abs(x0 - b.x0) < 0.01 && Math.abs(x1 - b.x1) < 0.01 && Math.abs(z0 - b.z0) < 0.01 && Math.abs(z1 - b.z1) < 0.01;
  (['N', 'S', 'E', 'W'] as const).forEach((side) => {
    const fr = F[side];
    if (fr.W < 0.05) return;
    if (cut.includes(side)) {
      // exposed floors where the wall is gone (a dark interior with slab edges and columns)
      mb.face([P(fr, 0, yb), P(fr, fr.W, yb), P(fr, fr.W, yt), P(fr, 0, yt)], lod < 2 ? wallMat : 'interiorDeep', lod < 2 ? exposedOv(fr, yb, yt, b.storey, b.seed + side.charCodeAt(0) * 7 + Math.round(yb)) : undefined, -0.4);
      return;
    }
    const front = side === b.front;
    const isFront = front && fullFront && isMain;
    const holes: Holes = fullFront && isMain ? [b.opening, ...(b.holes ?? [])].filter((h): h is Opening => !!h && (h.side ?? b.front) === side && yb < h.y0 && yt > h.y1) : [];
    const groundF = isFront && b.zone === 'front' && yb === 0 ? 4.6 : 0.8;
    const ov: Overlay[] = [];
    const shops = isFront && yb === 0 && b.zone === 'front' && lod === 0 ? shopsOf(b, fr.W) : [];
    const shopHoles: Holes = shops.filter((s) => s.kind === 'smashed' || s.kind === 'dark').map((s) => ({u0: s.u0, u1: s.u1, y0: 0.15, y1: 3.6, depth: 2.6}));
    if (lod === 0 && b.zone !== 'far') {
      const w = windowPolys(b, fr, 0, fr.W, yb, yt, holes, isFront, groundF);
      if (w.dark.length) ov.push({polys: w.dark, mat: 'window'});
      if (w.sky.length) ov.push({polys: w.sky, mat: 'windowSky'});
      if (w.lit.length) ov.push({polys: w.lit, mat: 'windowLit'});
      if (w.scorch.length) ov.push({polys: w.scorch, mat: 'scorch'});
      if (w.broken.length) ov.push({polys: w.broken, mat: 'interiorDeep'});
      if (front && b.kind === 'brick' && fr.W > 12 && yt > 12 && b.zone === 'front') ov.push({polys: fireEscape(b, fr, fr.W * (0.18 + R(b.seed, 30) * 0.5), yt), mat: 'fireEscape', line: 0.07});
      if (front && yb === 0 && b.zone === 'front') {
        // cornice band over the shops, then per shop: shutters / boards / sign panels (no lettering, no logos)
        ov.push({pts: [P(fr, 0.2, 4.0, 0.04), P(fr, fr.W - 0.2, 4.0, 0.04), P(fr, fr.W - 0.2, 4.35, 0.04), P(fr, 0.2, 4.35, 0.04)], mat: b.kind === 'brick' ? 'limestoneDark' : 'concreteDark'});
        const shut: V3[][] = [], shutLines: V3[][] = [], boards: V3[][] = [];
        const signs = new Map<string, V3[][]>(), signIn: V3[][] = [];
        shops.forEach((s, k) => {
          if (s.kind === 'shutter') {
            const open = R(b.seed, 460 + k) < 0.3 ? 0.9 + R(b.seed, 470 + k) * 0.8 : 0; // a shutter jammed half-open
            shut.push([P(fr, s.u0, 0.15 + open, 0.03), P(fr, s.u1, 0.15 + open, 0.03), P(fr, s.u1, 3.6, 0.03), P(fr, s.u0, 3.6, 0.03)]);
            for (let y = 0.6 + open; y < 3.5; y += 0.45) shutLines.push([P(fr, s.u0 + 0.05, y, 0.035), P(fr, s.u1 - 0.05, y, 0.035)]);
            if (open > 0) ov.push({pts: [P(fr, s.u0 + 0.1, 0.15, 0.025), P(fr, s.u1 - 0.1, 0.15, 0.025), P(fr, s.u1 - 0.1, 0.15 + open, 0.025), P(fr, s.u0 + 0.1, 0.15 + open, 0.025)], mat: 'interiorDeep'});
          } else if (s.kind === 'boarded') {
            const n = Math.max(2, Math.round((s.u1 - s.u0) / 1.2));
            for (let i = 0; i < n; i++) {
              const a = s.u0 + ((s.u1 - s.u0) * i) / n + 0.05, c = s.u0 + ((s.u1 - s.u0) * (i + 1)) / n - 0.05;
              boards.push([P(fr, a, 0.3 + R(b.seed, 480 + i) * 0.3, 0.03), P(fr, c, 0.3 + R(b.seed, 490 + i) * 0.3, 0.03), P(fr, c, 3.3 + R(b.seed, 500 + i) * 0.2, 0.03), P(fr, a, 3.2 + R(b.seed, 510 + i) * 0.3, 0.03)]);
            }
          }
          if (s.sign && !s.hangSign) {
            const l = signs.get(s.sign) ?? [];
            const a = s.u0 + 0.3, c = s.u1 - 0.3;
            l.push([P(fr, a, 3.75, 0.05), P(fr, c, 3.75, 0.05), P(fr, c, 4.5, 0.05), P(fr, a, 4.5, 0.05)]);
            signs.set(s.sign, l);
            // a lighter inner panel: a sign's silhouette, never letters
            signIn.push([P(fr, a + 0.35, 3.95, 0.055), P(fr, c - 0.35 - (c - a) * 0.3 * R(b.seed, 520 + k), 3.95, 0.055), P(fr, c - 0.35 - (c - a) * 0.3 * R(b.seed, 520 + k), 4.3, 0.055), P(fr, a + 0.35, 4.3, 0.055)]);
          }
        });
        if (shut.length) ov.push({polys: shut, mat: 'steelDark'}, {polys: shutLines, mat: 'steel', line: 0.035});
        if (boards.length) ov.push({polys: boards, mat: 'dust'});
        signs.forEach((polys, mat) => ov.push({polys, mat}));
        if (signIn.length) ov.push({polys: signIn, mat: 'concrete'});
      }
    } else if (lod === 1 || (lod === 0 && b.zone === 'far')) {
      patternPolys(b, fr, yb, yt, 1, isFront).forEach((o) => { if (o.polys.length) ov.push({polys: o.polys, mat: o.mat, line: o.line}); });
    } else if (lod === 2 && fr.W > 12 && yt - yb > 25) {
      patternPolys(b, fr, yb, yt, 2, isFront).forEach((o) => { if (o.polys.length) ov.push({polys: o.polys, mat: o.mat, line: o.line}); });
    }
    const allHoles = [...holes, ...shopHoles];
    if (lod === 0 && b.zone !== 'far') {
      // the facade as a grid of cells on bay and storey lines (each sorts by its own depth)
      const {U, Y} = cellBreaks(b, fr, yb, yt, allHoles, groundF);
      for (let i = 0; i + 1 < U.length; i++) for (let j = 0; j + 1 < Y.length; j++) {
        const ua = U[i], ub = U[i + 1], ya = Y[j], yc = Y[j + 1];
        const um = (ua + ub) / 2, ym = (ya + yc) / 2;
        if (allHoles.some((h) => um > h.u0 && um < h.u1 && ym > h.y0 && ym < h.y1)) continue;
        // overlays clipped to the cell (a band, a shutter or a fire escape crossing cells is cut at the cell edges);
        // the top row also keeps what sticks up above the wall (soot over the last windows)
        // (2 cm past the cell's edges: pieces of a band or a sign cut by a cell line overlap, no hairline)
        const cellOv = ov.map((o) => clipOv(o, fr, ua - (o.line ? 0 : 0.02), ub + (o.line ? 0 : 0.02), ya - (o.line ? 0 : 0.02), (j + 2 === Y.length ? yc + 4 : yc) + (o.line ? 0 : 0.02))).filter((o): o is Overlay => !!o);
        // the ground row sorts a little behind: whoever stands on the sidewalk in front of it draws after it
        const bias = ya < 0.2 ? -Math.min(3, (ub - ua) * 0.5) : -0.4;
        mb.face([P(fr, ua, ya), P(fr, ub, ya), P(fr, ub, yc), P(fr, ua, yc)], wallMat, cellOv.length ? cellOv : undefined, bias);
      }
      // rooms behind fire openings: jambs, back wall, floor, a dark room; slabs broken and sagging out of the facade
      holes.forEach((hole) => {
        recess(mb, fr, hole, hole.depth, 'interiorDeep', -2 - hole.depth * 0.4);
        const A = (u: number, y: number, dd: number) => P(fr, u, y, -dd);
        for (let y = hole.y0 + b.storey; y < hole.y1 - 0.5; y += b.storey) {
          const sag = 0.4 + R(b.seed, Math.round(y)) * 0.8;
          const lip = 0.6 + R(b.seed, Math.round(y) + 3) * 0.8;
          const t = 0.3;
          const um = (hole.u0 + hole.u1) / 2 + (R(b.seed, Math.round(y) + 5) - 0.5) * 2;
          // inside part (behind the facade plane) and the broken lip hanging out in front of it (sorts in front)
          const inner = [A(hole.u0, y, hole.depth), A(hole.u0, y, 0), A(um, y - sag * 0.7, 0), A(hole.u1, y - sag * 0.3, 0), A(hole.u1, y, hole.depth)];
          const lipP = [A(hole.u0 + 0.2, y - 0.05, 0), A(um, y - sag, -lip), A(hole.u1 - 0.3, y - sag * 0.32, 0), A(um, y - sag * 0.7, 0)];
          [[inner, -1.2 - hole.depth * 0.3], [lipP, 0.25]].forEach(([top, bias]) => {
            const T = top as V3[];
            const bot = T.map((q) => ({...q, y: q.y - t}));
            mb.face(T, 'concreteDark', undefined, bias as number);
            mb.face(bot.slice().reverse(), 'concreteEdge', undefined, bias as number);
            for (let k = 0; k < T.length; k++) { const k2 = (k + 1) % T.length; mb.face([T[k], bot[k], bot[k2], T[k2]], 'concrete', undefined, bias as number); }
          });
        }
      });
      // shops: smashed and dark shopfronts are real recesses (a dark interior you can see into)
      shops.forEach((s, k) => {
        if (s.kind === 'smashed' || s.kind === 'dark') {
          const o = {u0: s.u0, u1: s.u1, y0: 0.15, y1: 3.6};
          recess(mb, fr, o, 2.6, 'interiorDeep', -3.2);
          if (s.kind === 'smashed') shards(mb, fr, o, b.seed * 7 + k);
        }
        if (s.awning) {
          const torn = R(b.seed, 540 + k) < 0.4;
          const a = s.u0 + 0.2, c = s.u1 - 0.2, out = 1.5;
          // torn: the frame's outer edge has dropped at one end and the cloth hangs in a ragged sheet
          const drop = torn ? 1.2 + R(b.seed, 550 + k) * 0.8 : 0;
          const sheet = torn
            ? [P(fr, a, 3.7, 0.05), P(fr, c, 3.7, 0.05), P(fr, c, 3.05 - drop, out * 0.6), P(fr, (a + c) / 2, 3.0 - drop * 0.4, out * 0.9), P(fr, a, 3.05, out)]
            : [P(fr, a, 3.7, 0.05), P(fr, c, 3.7, 0.05), P(fr, c, 3.05, out), P(fr, a, 3.05, out)];
          // both sides (seen from the street the underside shows; seen from above, the top)
          const under = sheet.map((p) => ({...p, y: p.y - 0.04}));
          mb.face(sheet.slice().reverse(), s.awning, undefined, 0.2);
          mb.face(under, s.awning, undefined, 0.18);
          if (!torn) mb.face([P(fr, a, 3.05, out), P(fr, a, 2.85, out), P(fr, c, 2.85, out), P(fr, c, 3.05, out)], s.awning, undefined, 0.22);
        }
        if (s.blade) {
          // a projecting blade sign on the pier between two shops (a plain panel, no lettering)
          const u = s.u1 + 0.35, mat = SIGN_MATS[Math.floor(R(b.seed, 560 + k) * SIGN_MATS.length)];
          const pan = (dd: number) => [P(fr, u, 4.8, dd), P(fr, u, 4.8, dd + 1.0), P(fr, u, 7.4, dd + 1.0), P(fr, u, 7.4, dd)];
          const q = pan(0.25);
          mb.face(q, mat, [{pts: [P(fr, u - 0.01, 5.2, 0.45), P(fr, u - 0.01, 5.2, 1.05), P(fr, u - 0.01, 7.0, 1.05), P(fr, u - 0.01, 7.0, 0.45)], mat: 'concrete'}], 0.3);
          mb.face(q.slice().reverse().map((p) => ({...p, x: p.x + fr.U.x * 0.08, z: p.z + fr.U.z * 0.08})), mat, undefined, 0.3);
        }
        if (s.hangSign && s.sign) {
          // a sign torn from one bracket, hanging diagonally in front of the cornice
          const a = s.u0 + 0.3, c = s.u1 - 0.3, L = c - a, ang = 0.35 + R(b.seed, 570 + k) * 0.35;
          const p0 = P(fr, a, 4.5, 0.12), dir = {u: Math.cos(ang), y: -Math.sin(ang)};
          const Q = (along: number, down: number) => P(fr, a + dir.u * along + Math.sin(ang) * down, 4.5 + dir.y * along - Math.cos(ang) * down, 0.12);
          void p0;
          const sg = [Q(0, 0), Q(L * 0.95, 0), Q(L * 0.95, 0.75), Q(0, 0.75)];
          mb.face(sg.slice().reverse(), s.sign, undefined, 0.35);
          mb.face(sg.map((p) => ({x: p.x - fr.N.x * 0.06, y: p.y, z: p.z - fr.N.z * 0.06})), 'steelDark', undefined, 0.33);
        }
      });
      // the side walls of an exposed front opening read as building edges; corners keep their ink (MB shares verts)
    } else if (allHoles.length) {
      // mid/far LOD: holes as dark overlays on a whole face
      allHoles.forEach((h) => ov.push({pts: [P(fr, h.u0, h.y0, 0.03), P(fr, h.u1, h.y0, 0.03), P(fr, h.u1, h.y1, 0.03), P(fr, h.u0, h.y1, 0.03)], mat: 'interiorDeep'}));
      mb.face([P(fr, 0, yb), P(fr, fr.W, yb), P(fr, fr.W, yt), P(fr, 0, yt)], wallMat, ov.length ? ov : undefined);
    } else {
      mb.face([P(fr, 0, yb), P(fr, fr.W, yb), P(fr, fr.W, yt), P(fr, 0, yt)], wallMat, ov.length ? ov : undefined);
    }
  });
  // roof: cells at lod 0 (≤ 12 m), one face otherwise; a parapet outline line
  const rm = roofMat ?? (b.kind === 'brick' ? 'roofTar' : 'roof');
  if (lod === 0 && b.zone !== 'far') {
    // breaks at the edges of anything standing on this roof (those cells are covered and skipped), ≤ 12 m apart
    const brk = (lo: number, hi: number, cuts: number[]) => {
      const c0 = [...new Set([lo, hi, ...cuts.filter((v) => v > lo + 0.3 && v < hi - 0.3)])].sort((p1, p2) => p1 - p2);
      const outB: number[] = [];
      for (let i = 0; i + 1 < c0.length; i++) { const n = Math.max(1, Math.ceil((c0[i + 1] - c0[i]) / 12)); for (let k = 0; k < n; k++) outB.push(c0[i] + ((c0[i + 1] - c0[i]) * k) / n); }
      outB.push(hi);
      return outB;
    };
    const XS = brk(x0, x1, under.flatMap((q) => [q.x0, q.x1])), ZS = brk(z0, z1, under.flatMap((q) => [q.z0, q.z1]));
    const nx = XS.length - 1, nz = ZS.length - 1;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a = XS[i], c = XS[i + 1], e = ZS[j], g = ZS[j + 1];
      if (under.some((q) => a >= q.x0 - 0.05 && c <= q.x1 + 0.05 && e >= q.z0 - 0.05 && g <= q.z1 + 0.05)) continue;
      const edge: V3[][] = [];
      if (i === 0) edge.push([{x: a + 0.5, y: yt + 0.02, z: e}, {x: a + 0.5, y: yt + 0.02, z: g}]);
      if (i === nx - 1) edge.push([{x: c - 0.5, y: yt + 0.02, z: e}, {x: c - 0.5, y: yt + 0.02, z: g}]);
      if (j === 0) edge.push([{x: a, y: yt + 0.02, z: e + 0.5}, {x: c, y: yt + 0.02, z: e + 0.5}]);
      if (j === nz - 1) edge.push([{x: a, y: yt + 0.02, z: g - 0.5}, {x: c, y: yt + 0.02, z: g - 0.5}]);
      mb.face([{x: a, y: yt, z: e}, {x: a, y: yt, z: g}, {x: c, y: yt, z: g}, {x: c, y: yt, z: e}], rm, edge.length && !roofMat ? [{polys: edge, mat: 'roof', line: 0.18}] : undefined);
    }
  } else {
    const roofOv: Overlay[] = lod === 1 && b.zone !== 'far' && !roofMat ? [{pts: [{x: x0 + 0.5, y: yt + 0.02, z: z0 + 0.5}, {x: x0 + 0.5, y: yt + 0.02, z: z1 - 0.5}, {x: x1 - 0.5, y: yt + 0.02, z: z1 - 0.5}, {x: x1 - 0.5, y: yt + 0.02, z: z0 + 0.5}, {x: x0 + 0.5, y: yt + 0.02, z: z0 + 0.5}], mat: 'roof', line: 0.18}] : [];
    mb.face([{x: x0, y: yt, z: z0}, {x: x0, y: yt, z: z1}, {x: x1, y: yt, z: z1}, {x: x1, y: yt, z: z0}], rm, roofOv.length ? roofOv : undefined);
  }
};

/** rooftop plant and tops (in the building's own seeded variety) on a roof rectangle at height y */
const roofTop = (b: Bldg, x0: number, x1: number, z0: number, z1: number, y: number, lod: number): Mesh[] => {
  const out: Mesh[] = [];
  const W = x1 - x0, D = z1 - z0;
  const r = (k: number) => R(b.seed, 600 + k);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const top = b.top ?? 'flat';
  if (top === 'stepped' && W > 14 && D > 14) {
    // two or three small setbacks: an art-deco crown (two at a distance)
    let a = 0.16, yy = y;
    for (let i = 0; i < (lod === 2 ? 2 : 3); i++) {
      const h = 4 + r(1 + i) * 5;
      const ix = (W * a) / 2, iz = (D * a) / 2;
      out.push(box({x: x0 + ix, y: yy, z: z0 + iz}, {x: x1 - ix, y: yy + h, z: z1 - iz}, [b.kind === 'glass' ? 'glassLight' : WALL[b.kind][0], 'roof', 'facadeGrey', 'facadeGrey', 'facadeGrey', 'facadeGrey']));
      yy += h; a += 0.18;
      if (W * (1 - a) < 6) break;
    }
    out.push(coneMesh(Math.min(W, D) * 0.06, 10 + r(5) * 16, 4, 'steel', {x: cx, y: yy, z: cz}));
  } else if (top === 'pyramid') {
    out.push(pyramid(x0 + W * 0.08, x1 - W * 0.08, z0 + D * 0.08, z1 - D * 0.08, y, Math.min(W, D) * (0.45 + r(6) * 0.4), b.kind === 'glass' ? 'steel' : 'roofTar'));
  } else if (top === 'spire') {
    const s = Math.min(W, D) * 0.28;
    out.push(box({x: cx - s, y, z: cz - s}, {x: cx + s, y: y + 6, z: cz + s}, 'facadeGrey'));
    out.push(coneMesh(s * 0.55, 22 + r(7) * 30, 6, 'steel', {x: cx, y: y + 6, z: cz}));
  } else if (top === 'slant') {
    // a sloped crown (a wedge rising toward one side)
    const h = Math.min(W, D) * (0.35 + r(8) * 0.3);
    out.push(wedge(x0, x1, z0, z1, y, h, r(9) < 0.5, b.kind === 'glass' ? 'glassLight' : 'roof'));
  } else if (top === 'mech' || (lod < 2 && top === 'parapet')) {
    if (W > 9 && D > 9) {
      const pw = W * (0.25 + r(10) * 0.25), pd = D * (0.25 + r(11) * 0.25);
      const px = x0 + 2 + r(12) * (W - pw - 4), pz = z0 + 2 + r(13) * (D - pd - 4);
      out.push(box({x: px, y, z: pz}, {x: px + pw, y: y + 3 + r(14) * 2.5, z: pz + pd}, ['roof', 'roof', 'concreteDark', 'concreteDark', 'concrete', 'concrete']));
    }
  }
  if (lod === 0 && b.roofKit && W > 8 && D > 8) {
    // small plant: AC boxes, a vent stack, an antenna mast
    const n = 1 + Math.floor(r(20) * 3);
    for (let i = 0; i < n; i++) {
      const w = 1.2 + r(21 + i) * 1.6, d = 1.2 + r(24 + i) * 1.2;
      const px = x0 + 1 + r(27 + i) * (W - w - 2), pz = z0 + 1 + r(30 + i) * (D - d - 2);
      out.push(box({x: px, y, z: pz}, {x: px + w, y: y + 0.9 + r(33 + i) * 0.8, z: pz + d}, ['steel', 'steel', 'steelDark', 'steelDark', 'steel', 'steel']));
    }
    if (r(36) < 0.45) {
      const ax = x0 + 1.5 + r(37) * (W - 3), az = z0 + 1.5 + r(38) * (D - 3);
      out.push(box({x: ax - 0.08, y, z: az - 0.08}, {x: ax + 0.08, y: y + 4 + r(39) * 7, z: az + 0.08}, 'steelDark'));
    }
  }
  return out;
};

const pyramid = (x0: number, x1: number, z0: number, z1: number, y: number, h: number, mat: string): Mesh => {
  const verts: V3[] = [{x: x0, y, z: z0}, {x: x1, y, z: z0}, {x: x1, y, z: z1}, {x: x0, y, z: z1}, {x: (x0 + x1) / 2, y: y + h, z: (z0 + z1) / 2}];
  return {verts, faces: [{v: [0, 4, 1], mat}, {v: [1, 4, 2], mat}, {v: [2, 4, 3], mat}, {v: [3, 4, 0], mat}], crease: 25};
};
const wedge = (x0: number, x1: number, z0: number, z1: number, y: number, h: number, alongX: boolean, mat: string): Mesh => {
  // high edge at x1 (alongX) or z1; slope down to x0 / z0
  const v: V3[] = alongX
    ? [{x: x0, y, z: z0}, {x: x1, y, z: z0}, {x: x1, y, z: z1}, {x: x0, y, z: z1}, {x: x1, y: y + h, z: z0}, {x: x1, y: y + h, z: z1}]
    : [{x: x0, y, z: z0}, {x: x1, y, z: z0}, {x: x1, y, z: z1}, {x: x0, y, z: z1}, {x: x1, y: y + h, z: z1}, {x: x0, y: y + h, z: z1}];
  const faces: Face[] = alongX
    ? [{v: [0, 3, 5, 4], mat}, {v: [1, 4, 5, 2], mat: 'facadeGrey'}, {v: [0, 4, 1], mat: 'facadeGrey'}, {v: [3, 2, 5], mat: 'facadeGrey'}]
    : [{v: [0, 5, 4, 1], mat}, {v: [3, 2, 4, 5], mat: 'facadeGrey'}, {v: [0, 3, 5], mat: 'facadeGrey'}, {v: [1, 4, 2], mat: 'facadeGrey'}];
  return {verts: v, faces, crease: 25};
};

/** the collapsed corner: the region lost (in world x/z) and the side walls exposed */
const breachRegion = (b: Bldg) => {
  const br = b.breach!;
  const alongX = b.front === 'N' || b.front === 'S';
  // 'lo' / 'hi' = the smaller / larger world coordinate end of the front
  if (alongX) return br.end === 'lo' ? {x0: b.x0, x1: b.x0 + br.w, z0: b.z0, z1: b.z1, keep: {x0: b.x0 + br.w, x1: b.x1, z0: b.z0, z1: b.z1}, cut: 'W' as Side} : {x0: b.x1 - br.w, x1: b.x1, z0: b.z0, z1: b.z1, keep: {x0: b.x0, x1: b.x1 - br.w, z0: b.z0, z1: b.z1}, cut: 'E' as Side};
  return br.end === 'lo' ? {x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z0 + br.w, keep: {x0: b.x0, x1: b.x1, z0: b.z0 + br.w, z1: b.z1}, cut: 'N' as Side} : {x0: b.x0, x1: b.x1, z0: b.z1 - br.w, z1: b.z1, keep: {x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 - br.w}, cut: 'S' as Side};
};

const buildMesh = (b: Bldg, lod: number): Mesh => {
  const mb = new MB();
  const wm = WALL[b.kind][Math.floor(R(b.seed, 40) * 3)];
  const extra: Mesh[] = [];
  if (b.rubble) {
    // a demolished lot: a low broken mound of wall pieces (handled as volumes for cheapness)
    const n = 5;
    for (let i = 0; i < n; i++) {
      const xa = b.x0 + ((b.x1 - b.x0) * i) / n, xb = xa + (b.x1 - b.x0) / n - 0.4;
      volume(mb, {...b, opening: undefined, holes: undefined}, xa, xb, b.z0 + R(b.seed, i) * 4, b.z1 - R(b.seed, i + 9) * 4, 0, 1.5 + R(b.seed, i + 20) * 4, 2, 'rubble', false);
    }
    // a stair core still standing on the lot (a vertical landmark in the rubble)
    const cx = b.x0 + (b.x1 - b.x0) * (0.3 + R(b.seed, 30) * 0.4), cz = (b.z0 + b.z1) / 2 + (R(b.seed, 31) - 0.5) * 8;
    volume(mb, {...b, opening: undefined, holes: undefined, kind: 'modern'}, cx - 2.6, cx + 2.6, cz - 2.6, cz + 2.6, 0, 9 + R(b.seed, 32) * 14, Math.max(1, lod), 'concrete', false, ['N', 'S'], 'rubbleDark');
    return mb.mesh();
  }
  if (b.breach) {
    const br = breachRegion(b);
    const yb = b.breach.y0;
    // below the breach: the whole footprint; above: the kept part plus stepped broken floors over the lost corner
    volume(mb, b, b.x0, b.x1, b.z0, b.z1, 0, yb, lod, wm, true, [], 'rubbleDark', [br.keep]);
    volume(mb, {...b, opening: undefined, holes: undefined}, br.keep.x0, br.keep.x1, br.keep.z0, br.keep.z1, yb, b.h, lod, wm, false, [br.cut]);
    // two stepped remnants over the lost corner (floors snapped off at different heights), their cut sides exposed
    const steps = 2;
    for (let i = 0; i < steps; i++) {
      const k0 = i / steps, k1 = (i + 1) / steps;
      const top = yb + (b.h - yb) * (i === 0 ? 0.55 + R(b.seed, 700) * 0.2 : 0.18 + R(b.seed, 701) * 0.15);
      const top2 = Math.round(top / b.storey) * b.storey;
      if (top2 <= yb + b.storey * 0.8) continue;
      // remnant i spans [k0, k1] of the breach width from the kept side toward the open end
      const along = br.cut === 'E' || br.cut === 'W';
      let r0: {x0: number; x1: number; z0: number; z1: number};
      if (along) {
        const w = br.x1 - br.x0;
        r0 = br.cut === 'E' ? {x0: br.x0 + w * k0, x1: br.x0 + w * k1, z0: b.z0, z1: b.z1} : {x0: br.x1 - w * k1, x1: br.x1 - w * k0, z0: b.z0, z1: b.z1};
      } else {
        const w = br.z1 - br.z0;
        r0 = br.cut === 'S' ? {x0: b.x0, x1: b.x1, z0: br.z0 + w * k0, z1: br.z0 + w * k1} : {x0: b.x0, x1: b.x1, z0: br.z1 - w * k1, z1: br.z1 - w * k0};
      }
      volume(mb, {...b, opening: undefined, holes: undefined}, r0.x0, r0.x1, r0.z0, r0.z1, yb, top2, lod, wm, false, [br.cut], 'rubbleDark');
    }
    if (lod < 2) {
      // slab lips sticking out of the exposed side (broken floors), and a pile of debris on the lower roof
      const along = br.cut === 'E' || br.cut === 'W';
      const sgn = br.cut === 'E' || br.cut === 'S' ? 1 : -1;
      for (let y = yb + b.storey; y < b.h * 0.85; y += b.storey) {
        if (R(b.seed, Math.round(y) + 710) < 0.45) continue;
        const L = 0.8 + R(b.seed, Math.round(y) + 720) * 2.2, droop = R(b.seed, Math.round(y) + 730) * 1.2;
        const cut = along ? (br.cut === 'E' ? br.keep.x1 : br.keep.x0) : br.cut === 'S' ? br.keep.z1 : br.keep.z0;
        const a0 = along ? b.z0 + (b.z1 - b.z0) * R(b.seed, Math.round(y) + 740) * 0.5 : b.x0 + (b.x1 - b.x0) * R(b.seed, Math.round(y) + 740) * 0.5;
        const a1 = a0 + (along ? (b.z1 - b.z0) : (b.x1 - b.x0)) * (0.25 + R(b.seed, Math.round(y) + 750) * 0.35);
        const pts = along
          ? [{x: cut, y, z: a0}, {x: cut, y, z: a1}, {x: cut + sgn * L, y: y - droop, z: a1 - 0.5}, {x: cut + sgn * L * 0.7, y: y - droop * 0.6, z: a0 + 0.4}]
          : [{x: a0, y, z: cut}, {x: a1, y, z: cut}, {x: a1 - 0.5, y: y - droop, z: cut + sgn * L}, {x: a0 + 0.4, y: y - droop * 0.6, z: cut + sgn * L * 0.7}];
        const top = pts.map((p) => ({...p, y: p.y + 0.02})), bot = pts.map((p) => ({...p, y: p.y - 0.32}));
        const sl: Mesh = {verts: [...top, ...bot], faces: [{v: [0, 1, 2, 3], mat: 'concreteDark'}, {v: [7, 6, 5, 4], mat: 'concreteEdge'}, ...[0, 1, 2, 3].map((k) => ({v: [k, k + 4, ((k + 1) % 4) + 4, (k + 1) % 4], mat: 'concrete'}))], crease: 30};
        extra.push(fixUp(sl, {x: (pts[0].x + pts[2].x) / 2, y: y - 0.15, z: (pts[0].z + pts[2].z) / 2}));
      }
      for (let i = 0; i < 5; i++) {
        const px = br.x0 + R(b.seed, 760 + i) * (br.x1 - br.x0), pz = br.z0 + R(b.seed, 770 + i) * (br.z1 - br.z0), s = 1 + R(b.seed, 780 + i) * 2.4;
        extra.push(box({x: px - s, y: yb, z: pz - s * 0.7}, {x: px + s, y: yb + s * 0.6, z: pz + s * 0.7}, ['rubble', 'rubble', 'rubbleDark', 'rubbleDark', 'concreteDark', 'concreteDark']));
      }
    }
  } else if (b.crown) {
    const keeps = b.crown.keep.map(([a, c], i) => {
      const zin = (b.z1 - b.z0) * (0.1 + R(b.seed, 60 + i) * 0.4);
      return {x0: b.x0 + (b.x1 - b.x0) * a, x1: b.x0 + (b.x1 - b.x0) * c, z0: b.front === 'S' ? b.z0 + zin * 0.5 : b.z0, z1: b.front === 'S' ? b.z1 : b.z1 - zin * 0.5};
    }).filter((q) => q.x1 - q.x0 >= 3);
    volume(mb, b, b.x0, b.x1, b.z0, b.z1, 0, b.crown.low, lod, wm, true, [], 'rubbleDark', keeps);
    b.crown.keep.forEach(([a, c], i) => {
      const xa = b.x0 + (b.x1 - b.x0) * a, xb = b.x0 + (b.x1 - b.x0) * c;
      if (xb - xa < 3) return;
      const top = b.crown!.low + (b.h - b.crown!.low) * (0.55 + 0.45 * R(b.seed, 50 + i));
      const zin = (b.z1 - b.z0) * (0.1 + R(b.seed, 60 + i) * 0.4);
      const za = b.front === 'S' ? b.z0 + zin * 0.5 : b.z0, zb = b.front === 'S' ? b.z1 : b.z1 - zin * 0.5;
      // the remnant's sides that face the lost storeys are exposed floors, not facades
      const cut: Side[] = [];
      if (xa > b.x0 + 0.2) cut.push('W');
      if (xb < b.x1 - 0.2) cut.push('E');
      if (za > b.z0 + 0.2) cut.push('N');
      if (zb < b.z1 - 0.2) cut.push('S');
      volume(mb, {...b, opening: undefined, holes: undefined}, xa, xb, za, zb, b.crown!.low, top, lod, wm, false, lod < 2 ? cut : []);
    });
  } else if (b.tiers && b.tiers.length) {
    let inset = 0, y = 0;
    const tiers = [...b.tiers, {y: b.h, inset: 0}];
    tiers.forEach((t, i) => {
      const yt = Math.min(b.h, t.y);
      const ni = inset + t.inset;
      if (yt > y + 1) volume(mb, i === 0 ? b : {...b, opening: undefined, holes: undefined}, b.x0 + inset, b.x1 - inset, b.z0 + inset, b.z1 - inset, y, yt, lod, wm, i === 0, [], undefined, i < tiers.length - 1 ? [{x0: b.x0 + ni, x1: b.x1 - ni, z0: b.z0 + ni, z1: b.z1 - ni}] : []);
      y = yt;
      inset += t.inset;
    });
    const ins = b.tiers.reduce((s, t) => s + t.inset, 0);
    extra.push(...roofTop(b, b.x0 + ins, b.x1 - ins, b.z0 + ins, b.z1 - ins, b.h, lod));
  } else {
    volume(mb, b, b.x0, b.x1, b.z0, b.z1, 0, b.h, lod, wm, true);
    extra.push(...roofTop(b, b.x0, b.x1, b.z0, b.z1, b.h, lod));
  }
  let m = mb.mesh();
  if (b.waterTower && lod < 2) {
    const roofY = b.crown ? b.crown.low : b.h;
    const cx = b.x0 + (b.x1 - b.x0) * (0.3 + R(b.seed, 70) * 0.4), cz = (b.z0 + b.z1) / 2;
    const tank = xfMesh(cylinder(1.7, 3.4, 8, 'waterTower', 'waterTower', 2.4), {pos: {x: cx, y: roofY, z: cz}});
    const cone = coneMesh(1.9, 1.2, 8, 'roofTar', {x: cx, y: roofY + 5.8, z: cz});
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => box({x: cx + a * 1.1 - 0.12, y: roofY, z: cz + c * 1.1 - 0.12}, {x: cx + a * 1.1 + 0.12, y: roofY + 2.4, z: cz + c * 1.1 + 0.12}, 'steelDark'));
    extra.push(tank, cone, ...legs);
  }
  if (extra.length) { m = merge(m, ...extra); }
  m.crease = 30;
  return m;
};

/** orient a small closed mesh outward from its centre */
const fixUp = (m: Mesh, c: V3): Mesh => ({
  ...m,
  faces: m.faces.map((f) => {
    const Pp = f.v.map((i) => m.verts[i]);
    let n = {x: 0, y: 0, z: 0};
    for (let i = 0; i < Pp.length; i++) { const a = Pp[i], q = Pp[(i + 1) % Pp.length]; n = {x: n.x + (a.y - q.y) * (a.z + q.z), y: n.y + (a.z - q.z) * (a.x + q.x), z: n.z + (a.x - q.x) * (a.y + q.y)}; }
    const fc = mul3(Pp.reduce((s, q) => add3(s, q), {x: 0, y: 0, z: 0}), 1 / Pp.length);
    return n.x * (fc.x - c.x) + n.y * (fc.y - c.y) + n.z * (fc.z - c.z) < 0 ? {...f, v: [...f.v].reverse()} : f;
  }),
});

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
  if (d < 95 + size * 0.55) return 0;
  if (d < 520 + size * 3) return 1;
  return 2;
};

/**
 * The opening (world rectangle on the facade plane, outward normal, depth) nearest a point — for attaching a room fire
 * to the geometry that was actually cut (ATMOS). null when no opening is within `maxD` m.
 */
export const openingFor = (p: V3, maxD = 12) => {
  let best: {d: number; b: Bldg; o: Opening} | null = null;
  for (const b of CITY()) for (const o of [b.opening, ...(b.holes ?? [])]) {
    if (!o) continue;
    const F = framesXZ(b.x0, b.x1, b.z0, b.z1)[o.side ?? b.front];
    const c = P(F, (o.u0 + o.u1) / 2, (o.y0 + o.y1) / 2);
    const d = Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z);
    if (d < maxD && (!best || d < best.d)) best = {d, b, o};
  }
  if (!best) return null;
  const {b, o} = best;
  const F = framesXZ(b.x0, b.x1, b.z0, b.z1)[o.side ?? b.front];
  return {bld: b.id, by: o.by, side: o.side ?? b.front, u0: o.u0, u1: o.u1, corners: [P(F, o.u0, o.y0), P(F, o.u1, o.y0), P(F, o.u1, o.y1), P(F, o.u0, o.y1)], center: P(F, (o.u0 + o.u1) / 2, (o.y0 + o.y1) / 2), normal: F.N, depth: o.depth, width: o.u1 - o.u0, height: o.y1 - o.y0};
};

/** Twisted steel and rebar at a building's broken edges (polylines for set.tsx to draw as sprites when near). */
export const bldgSteel = (b: Bldg): {pts: V3[]; w: number; color: string}[] => {
  const out: {pts: V3[]; w: number; color: string}[] = [];
  const add = (o: V3, dir: V3, n: number, len: number, seed: number, w = 0.05) => {
    for (let i = 0; i < n; i++) {
      const r = (k: number) => rnd(seed * 71 + i * 7 + k) - 0.5;
      const base = {x: o.x + r(1) * 3, y: o.y + r(2) * 0.4, z: o.z + r(3) * 3};
      const L = len * (0.5 + rnd(seed * 3 + i));
      const p1 = add3(base, mul3(dir, L * 0.5));
      const p2 = add3(p1, {x: (dir.x + r(4) * 1.4) * L * 0.5, y: (dir.y + r(5) - 0.6) * L * 0.5, z: (dir.z + r(6) * 1.4) * L * 0.5});
      out.push({pts: [base, p1, p2], w, color: i % 3 === 0 ? '#3E4448' : '#5E4436'});
    }
  };
  if (b.breach) {
    const br = breachRegion(b);
    const along = br.cut === 'E' || br.cut === 'W';
    const sgn = br.cut === 'E' || br.cut === 'S' ? 1 : -1;
    const cutC = along ? (br.cut === 'E' ? br.keep.x1 : br.keep.x0) : br.cut === 'S' ? br.keep.z1 : br.keep.z0;
    const dir = along ? {x: sgn, y: 0.15, z: 0} : {x: 0, y: 0.15, z: sgn};
    for (let k = 0; k < 4; k++) {
      const y = b.breach.y0 + (b.h - b.breach.y0) * (0.15 + 0.2 * k);
      const o = along ? {x: cutC, y, z: (b.z0 + b.z1) / 2 + (rnd(b.seed + k) - 0.5) * (b.z1 - b.z0) * 0.6} : {x: (b.x0 + b.x1) / 2 + (rnd(b.seed + k) - 0.5) * (b.x1 - b.x0) * 0.6, y, z: cutC};
      add(o, dir, 3, 2.2, b.seed * 5 + k, 0.06);
    }
    // a bent I-beam hanging out of the cut
    const yb = b.breach.y0 + (b.h - b.breach.y0) * 0.45;
    const o = along ? {x: cutC, y: yb, z: (b.z0 + b.z1) / 2} : {x: (b.x0 + b.x1) / 2, y: yb, z: cutC};
    out.push({pts: [o, add3(o, {x: dir.x * 3, y: -0.6, z: dir.z * 3}), add3(o, {x: dir.x * 4.2, y: -4.5, z: dir.z * 4.2 + 0.8})], w: 0.32, color: '#5A3A2C'});
  }
  if (b.crown && b.zone !== 'far') {
    const y = b.crown.low;
    b.crown.keep.forEach(([a, c], i) => {
      const x = b.x0 + (b.x1 - b.x0) * c;
      if (c < 0.98) add({x, y: y + 2, z: (b.z0 + b.z1) / 2}, {x: 0.6, y: 0.7, z: 0}, 3, 1.6, b.seed + i * 11);
      void a;
    });
  }
  return out;
};

/**
 * A piece of a building's front facade (u0..u1 × y0..y1, 0.45 m thick) with the same windows / pattern the building
 * shows at `lod`, in world space on the facade plane — the section that peels away in A1, the glazing a blast removes.
 */
export const facadePanel = (b: Bldg, u0: number, u1: number, y0: number, y1: number, lod: number, side: Side = b.front): Mesh => {
  const F = framesXZ(b.x0, b.x1, b.z0, b.z1)[side];
  const wm = WALL[b.kind][Math.floor(R(b.seed, 40) * 3)];
  const raw: Overlay[] = [];
  if (lod === 0) {
    const w = windowPolys({...b, blown: undefined}, F, 0, F.W, Math.max(0, y0 - b.storey), y1 + b.storey, [], false, b.zone === 'front' ? 4.6 : 0.8);
    if (w.dark.length) raw.push({polys: w.dark, mat: 'window'});
    if (w.sky.length) raw.push({polys: w.sky, mat: 'windowSky'});
    if (w.lit.length) raw.push({polys: w.lit, mat: 'windowLit'});
  } else patternPolys(b, F, 0, wallTop(b), lod, false).forEach((o) => raw.push({polys: o.polys, mat: o.mat, line: o.line}));
  const ov = raw.map((o) => clipOv(o, F, u0, u1, y0, y1)).filter((o): o is Overlay => !!o);
  const mb = new MB();
  const t = 0.45;
  mb.face([P(F, u0, y0), P(F, u1, y0), P(F, u1, y1), P(F, u0, y1)], wm, ov.length ? ov : undefined);
  mb.face([P(F, u0, y0, -t), P(F, u0, y1, -t), P(F, u1, y1, -t), P(F, u1, y0, -t)], 'concrete');
  const E = (a: [number, number], c: [number, number]) => mb.face([P(F, a[0], a[1]), P(F, a[0], a[1], -t), P(F, c[0], c[1], -t), P(F, c[0], c[1])], 'concreteEdge');
  E([u1, y0], [u0, y0]); E([u0, y1], [u1, y1]); E([u0, y0], [u0, y1]); E([u1, y1], [u1, y0]);
  // every face outward from the slab's centre (the front keeps its overlays)
  return fixUp(mb.mesh(), P(F, (u0 + u1) / 2, (y0 + y1) / 2, -t / 2));
};
/**
 * The window grid exactly as lod 0 draws it on a wall (for burning windows that sit on the drawn ones, ATMOS): bay
 * width, window size, the bays' offset along the wall, the first window storey's floor and the storey height. Windows
 * are at u = off + bay·(i + ½) (i < nb), y = groundF + k·storey + (storey − wh)·0.45 (k ≥ 0) up to the wall's top.
 */
export const windowGrid = (b: Bldg, side: Side = b.front) => {
  const F = framesXZ(b.x0, b.x1, b.z0, b.z1)[side];
  const {bay, ww, wh, st} = winSpec(b);
  const nb = Math.max(0, Math.floor((F.W - 0.8) / bay));
  return {bay, ww, wh, nb, off: (F.W - nb * bay) / 2, groundF: side === b.front && b.zone === 'front' ? 4.6 : 0.8, storey: b.storey, style: st, W: F.W};
};
/** a wall's frame (O = bottom-left seen from outside, U along the wall, N outward; default the front) */
export const wallFrame = (b: Bldg, side: Side = b.front) => framesXZ(b.x0, b.x1, b.z0, b.z1)[side];
/** a point on a wall: u along it, y up, d outward */
export const wallPoint = (b: Bldg, side: Side, u: number, y: number, d = 0) => P(wallFrame(b, side), u, y, d);

export const centerOf = (b: Bldg): V3 => ({x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2});
export const dist2 = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export {sub3};
