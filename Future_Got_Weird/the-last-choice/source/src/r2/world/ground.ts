// The battlefield's ground: one height function everyone uses to stand people and machines on the set.
//   groundH(x, z)  height in metres (street level = 0, sidewalks +0.15)
//   groundN(x, z)  unit surface normal
//   onGround(x, z) {x, y, z} on the surface
// Cheap and pure: no allocation beyond the result. Shapes (see plan.ts):
//   - the RIDGE: an irregular mound of broken concrete across the west end of the avenue (crest ≈ 4.5 m, a meandering
//     notched crest, a long east slope down to the van, a shorter west slope into the collapsed building's rubble floor)
//   - the CRATER: a bowl in the avenue with a raised, broken rim
//   - rubble spill and broken-asphalt heave around both; sidewalks raised 0.15 m behind kerbs at |z| = 14
import {V3, clamp, smooth} from '../../kit/math';
import {PLAN} from './plan';

// ---- 2D value noise (seeded, C1-ish via smoothstep)
const hash2 = (i: number, j: number, s: number) => {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
};
export const noise2 = (x: number, z: number, s = 0) => {
  const i = Math.floor(x), j = Math.floor(z);
  const fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j, s), b = hash2(i + 1, j, s), c = hash2(i, j + 1, s), d = hash2(i + 1, j + 1, s);
  return (a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w) * 2 - 1;
};
export const fbm2 = (x: number, z: number, s = 0) => noise2(x, z, s) * 0.55 + noise2(x * 2.07, z * 2.07, s + 3) * 0.3 + noise2(x * 4.3, z * 4.3, s + 7) * 0.15;
/** Blocky rubble noise: value noise with sharpened plateaus (reads as chunks, not hills). */
const blocky = (x: number, z: number, s: number) => {
  const n = noise2(x, z, s);
  return Math.sign(n) * Math.pow(Math.abs(n), 0.6);
};

const R = PLAN.ridge;
/** Crest x (meanders) and crest height along z. */
export const ridgeCrestX = (z: number) => 0.4 + 1.3 * noise2(z * 0.11, 3.7, 11) + 0.5 * noise2(z * 0.37, 1.1, 12);
export const ridgeCrestH = (z: number) => {
  const az = Math.abs(z);
  // full height through the middle, a lower shoulder along the west ruin's front, gone by |z| ≈ 34
  const env = az < 12 ? 1 : az < 20 ? 1 - 0.55 * smooth((az - 12) / 8) : az < 34 ? 0.45 * (1 - smooth((az - 20) / 14)) : 0;
  // notches and peaks along the crest
  return R.crestH * env * (1 + 0.16 * noise2(z * 0.5, 7.3, 13) + 0.1 * noise2(z * 1.3, 2.2, 14));
};

const ridgeH = (x: number, z: number) => {
  const xc = ridgeCrestX(z), hc = ridgeCrestH(z);
  if (hc <= 0.001) return 0;
  const east = R.eastFootX + 1.5 * noise2(z * 0.2, 9.1, 15), west = R.westFootX - 1.2 * noise2(z * 0.23, 4.4, 16);
  let h: number;
  if (x >= xc) {
    const s = clamp((x - xc) / (east - xc));
    h = hc * Math.pow(1 - s, 1.5) * (1 - 0.15 * s);
  } else {
    const s = clamp((xc - x) / (xc - west));
    h = hc * Math.pow(1 - s, 1.15);
  }
  // the crest is a broken edge, not a smooth top: flatten slightly then add blocky lumps
  const lumpK = clamp(h / 0.6);
  h += lumpK * (0.32 * blocky(x * 0.55, z * 0.55, 21) + 0.18 * blocky(x * 1.3, z * 1.3, 22));
  return Math.max(0, h);
};

const C = PLAN.crater;
const craterH = (x: number, z: number) => {
  const dx = x - C.center.x, dz = z - C.center.z;
  const r0 = Math.hypot(dx, dz);
  // a slightly irregular outline
  const a = Math.atan2(dz, dx);
  const rr = C.radius * (1 + 0.07 * Math.sin(a * 3 + 0.6) + 0.05 * Math.sin(a * 5 + 2.1));
  const r = r0 / rr;
  let h = 0;
  if (r < 1) h -= C.depth * Math.pow(1 - r * r, 0.9);
  // raised, broken rim
  h += C.rim * Math.exp(-(((r - 1.06) / 0.16) ** 2)) * (1 + 0.6 * blocky(x * 0.4, z * 0.4, 31));
  // rubble inside and on the rim
  if (r < 1.5) h += (1 - smooth((r - 0.9) / 0.6)) * 0.28 * blocky(x * 0.8, z * 0.8, 32);
  return h;
};

/** Debris spill at the ridge's east foot and heave around the crater (low, lumpy). */
const spillH = (x: number, z: number) => {
  let h = 0;
  // east foot spill (fans out onto the avenue)
  if (x > 4 && x < 30 && Math.abs(z) < 24) {
    const k = (1 - smooth((x - 8) / 20)) * (1 - smooth((Math.abs(z) - 12) / 12));
    h += k * Math.max(0, 0.45 * blocky(x * 0.7, z * 0.7, 41) + 0.25);
  }
  // general street debris / buckled asphalt between ridge and crater
  if (x > 10 && x < 110 && Math.abs(z) < 14) h += 0.07 * Math.max(0, fbm2(x * 0.35, z * 0.35, 42));
  return h;
};

/** West ruin floor: the collapsed building's rubble bed (the Crew arrive across it). */
const ruinH = (x: number, z: number) => {
  const W = PLAN.westRuin;
  if (x > W.x1 + 4 || x < W.x0 - 6 || z < W.z0 - 6 || z > W.z1 + 6) return 0;
  const k = (1 - smooth((x - W.x1) / 4)) * (1 - smooth((W.x0 - x) / 6)) * (1 - smooth((W.z0 - z) / 6)) * (1 - smooth((z - W.z1) / 6));
  return k * (1.1 + 0.6 * blocky(x * 0.45, z * 0.45, 51) + 0.25 * blocky(x * 1.1, z * 1.1, 52));
};

/** Sidewalk lift behind the kerbs (|z| between roadZ and walkZ, east of the ridge spill). */
export const sidewalkH = (x: number, z: number) => {
  const az = Math.abs(z);
  if (x < 12 || az < PLAN.avenue.roadZ || az > PLAN.avenue.walkZ + 0.01) return 0;
  // cross streets: no sidewalk across the intersection
  for (const cs of PLAN.crossStreets) if (Math.abs(x - cs.x) < cs.w / 2) return 0;
  return 0.15;
};

/** Ground height (m). */
export const groundH = (x: number, z: number): number => {
  let h = 0;
  if (x < 40) h = Math.max(h, ridgeH(x, z));
  if (x < -6) h = Math.max(h, ruinH(x, z));
  if (Math.abs(x - C.center.x) < C.radius * 1.8 && Math.abs(z - C.center.z) < C.radius * 1.8) h += craterH(x, z);
  h += spillH(x, z);
  // a near-level patch at the ridge's east foot for the van, the death slab and the radio (low rubble only)
  const dv = Math.hypot(x - FOOT.x, z - FOOT.z);
  if (dv < FOOT.r + 3) {
    const k = 1 - smooth((dv - FOOT.r) / 3);
    h = h * (1 - k) + k * (0.18 + 0.06 * noise2(x * 1.7, z * 1.7, 61));
  }
  // kerbed sidewalks sit at least 0.15 m up (only where there is a sidewalk: the crater bowl stays below 0)
  const sw = sidewalkH(x, z);
  if (sw > 0) h = Math.max(h, sw);
  return h;
};
/** The level patch at the ridge's east foot (van, death slab, radio). */
export const FOOT = {x: 7.6, z: 2.4, r: 3.0};

/** Surface normal by central differences (e = 0.25 m). */
export const groundN = (x: number, z: number): V3 => {
  const e = 0.25;
  const dx = (groundH(x + e, z) - groundH(x - e, z)) / (2 * e);
  const dz = (groundH(x, z + e) - groundH(x, z - e)) / (2 * e);
  const l = Math.hypot(dx, 1, dz);
  return {x: -dx / l, y: 1 / l, z: -dz / l};
};

export const onGround = (x: number, z: number): V3 => ({x, y: groundH(x, z), z});

/**
 * Areas the set keeps clear of loose debris meshes so characters can be animated there (radius in metres): the
 * Director's burial spot and stand on the crest, the death position by the van, the path down the east slope.
 */
export const CLEAR_ZONES: {x: number; z: number; r: number}[] = [
  {x: PLAN.directorBuried.x, z: PLAN.directorBuried.z, r: 1.6},
  {x: PLAN.directorStand.x, z: PLAN.directorStand.z, r: 1.4},
  {x: PLAN.deathPos.x, z: PLAN.deathPos.z, r: 1.3},
  {x: 5, z: 2, r: 2.2},
  {x: -4, z: 0, r: 2.5}, // where the Crew come up the west slope
  {x: PLAN.directorStand.x - 3.2, z: PLAN.directorStand.z + 1.2, r: 2.6}, // camera corridor behind his stand
  {x: PLAN.van.pos.x, z: PLAN.van.pos.z, r: 3.4}, // the van
];
export const isClear = (x: number, z: number, pad = 0) => CLEAR_ZONES.every((c) => Math.hypot(x - c.x, z - c.z) > c.r + pad);
