// Fire sources for the battlefield and the city. Every fire has a CAUSE and a PLACE — a wrecked vehicle, an exposed
// room behind a blown-out facade, a debris pile, a ruptured fuel spill, a block whose upper floors are burning — and
// its own size, rhythm, colour and smoke. atmos.tsx draws them (flames, plumes, embers); the lighting rig takes the
// near ones as point lights whose power follows the SAME energy curve that drives the flame height (fireEnergy).
// Positions in metres (see plan.ts).
//
// CONTRACT WITH THE CITY KIT (world/plan.ts FIRE_SITES + STREET_OBSTACLES, city.ts, set.tsx):
//   - FIRE_SITES (plan.ts, owned by CITY) are fire anchors built into the set; every site becomes a Fire here
//     (siteFire): 'room' → the burning room in the opening city.ts cut for it (matched by the opening's `by` = site
//     id), 'opening' → flames along an exposed floor edge facing `n`, 'vehicle' → along the STREET_OBSTACLES vehicle
//     named by `anchor`, 'debris' → a burning heap on the ground. `from` = the film second it catches.
//   - this file's own list (OWN): kind 'room' with interior: true makes city.ts cut an opening at pos (placeOpenings);
//     'vehicle' fires name their STREET_OBSTACLES vehicle in `anchor` (heading / length / height are read from it);
//     'block' gives only (x, z): atmos.tsx anchors it to the nearest CITY() building and burns its floors and roof;
//     'debris' / 'spill' sit on the ground (`ground` = height above groundH).
//   To add a fire for a new damaged set piece, add a FIRE_SITE (CITY) or an OWN entry (unused seed).
import {V3, noise, clamp, rnd, smooth} from '../../kit/math';
import {PointLight} from '../engine';
import {groundH} from './ground';
import {FIRE_SITES, FireSite, STREET_OBSTACLES} from './plan';

export type FireKind = 'debris' | 'spill' | 'vehicle' | 'room' | 'block' | 'opening';

export type Fire = {
  id: string;
  /** what is burning (default 'debris'; 'room' when interior) */
  kind?: FireKind;
  pos: V3;
  /** flame height (m) at full burn */
  size: number;
  /** width / height of the flame bed */
  spread?: number;
  seed: number;
  /** burns from this film time (s); default always */
  from?: number;
  /** seconds from `from` to full size (a fire catching and spreading); default 1.5 */
  grow?: number;
  /** lights the set (near fires only) */
  light?: {power: number; radius: number};
  /** smoke plume thickness (0 = none) */
  smoke?: number;
  /** smoke character: 0 = pale dust/steam .. 0.6 = grey-brown .. 1 = black oily (default by kind) */
  soot?: number;
  /** colour bias: 0 = orange, 1 = deep red (smouldering), -1 = yellow-white (fierce) */
  heat?: number;
  /** interior fire seen through an opening (city.ts cuts the opening) */
  interior?: boolean;
  /** if set, pos.y is resolved as groundH(x, z) + this (fires on the ground / on wrecks) */
  ground?: number;
  /** the set piece / building that burns (documentation and lookup) */
  anchor?: string;
  /** vehicle yaw (deg, Xf convention) and length (m) */
  heading?: number;
  len?: number;
  /** block fires: burning floors as fractions of the building height [lo, hi]; hi ≥ 0.98 = the roof burns too */
  floors?: [number, number];
  /** 'opening' fires (an exposed floor edge) and site rooms: the outward normal of the face they burn in */
  normal?: V3;
};

const OWN: Fire[] = [
  // ---- THE WEST RUIN (the collapsed building behind the ridge): its wreckage burning on the rubble floor. The smoke
  //      and the warm rim behind the Director as he faces east come from here.
  {id: 'ruinW1', kind: 'debris', anchor: 'westRuin', pos: {x: -22, y: 0, z: -7}, ground: 0.3, size: 4.2, spread: 1.7, seed: 1, light: {power: 1.15, radius: 26}, smoke: 1.3, soot: 0.62},
  {id: 'ruinW2', kind: 'debris', anchor: 'westRuin', pos: {x: -27, y: 0, z: 15.5}, ground: 0.3, size: 3.0, spread: 1.4, seed: 2, light: {power: 0.8, radius: 18}, smoke: 0.9, soot: 0.58},
  {id: 'ruinW3', kind: 'debris', anchor: 'westRuin', pos: {x: -15, y: 0, z: 15}, ground: 0.25, size: 1.6, spread: 1.0, seed: 3, smoke: 0.5, heat: 0.6},
  // ---- the ridge rubble: small fires in broken timber and furniture
  {id: 'ridgeN', kind: 'debris', anchor: 'ridge', pos: {x: 2.5, y: 0, z: -11}, ground: 0.2, size: 1.0, spread: 1.2, seed: 4, light: {power: 0.55, radius: 9}, smoke: 0.35, heat: 0.3},
  {id: 'ridgeS', kind: 'debris', anchor: 'ridge', pos: {x: -1.5, y: 0, z: 13.5}, ground: 0.2, size: 0.8, spread: 1.1, seed: 5, smoke: 0.3, heat: 0.7},
  // ---- the overturned car east of the ridge (wreck_0) and its ruptured tank: a burning fuel spill on the asphalt
  {id: 'spillE', kind: 'spill', anchor: 'wreck_0', pos: {x: 20.6, y: 0, z: -8.3}, ground: 0.05, size: 0.8, spread: 2.4, seed: 6, light: {power: 0.5, radius: 9}, smoke: 0.35, soot: 0.92, heat: 0.15},
  {id: 'wreck0', kind: 'vehicle', anchor: 'wreck_0', pos: {x: 24, y: 0, z: -9}, ground: 0.75, heading: 140, len: 4.2, size: 1.3, spread: 1.6, seed: 36, smoke: 0.6, soot: 0.95, heat: 0.35},
  // ---- the south flank: a burning building whose facade spilled across the sidewalk; rooms burning behind it
  {id: 'southA', kind: 'debris', anchor: 'southFacadeSpill', pos: {x: 34, y: 0, z: 18.2}, ground: 0.5, size: 3.4, spread: 1.8, seed: 7, light: {power: 1.0, radius: 22}, smoke: 1.1, soot: 0.6},
  {id: 'southB', kind: 'room', interior: true, pos: {x: 47, y: 7.5, z: 21}, size: 4.5, spread: 1.4, seed: 8, light: {power: 0.9, radius: 22}, smoke: 1.2, heat: -0.4},
  {id: 'southC', kind: 'room', interior: true, pos: {x: 58, y: 14.2, z: 21}, size: 3.2, spread: 1.2, seed: 9, smoke: 0.8},
  {id: 'southD', kind: 'debris', anchor: 'southFacadeSpill', pos: {x: 54, y: 0, z: 16}, ground: 0.45, size: 1.6, spread: 1.5, seed: 10, light: {power: 0.6, radius: 12}, smoke: 0.5, heat: 0.2},
  // ---- the crater: the burnt car on its rim, burning debris on the far rim
  {id: 'craterCar', kind: 'vehicle', anchor: 'craterCar', pos: {x: 57, y: 0, z: 4}, ground: 1.1, heading: 32, len: 4.4, size: 2.2, spread: 1.5, seed: 11, light: {power: 0.85, radius: 16}, smoke: 0.9, soot: 0.95},
  {id: 'craterRim', kind: 'debris', anchor: 'crater', pos: {x: 72, y: 0, z: -11}, ground: 0.25, size: 1.2, spread: 1.3, seed: 12, smoke: 0.4, heat: 0.5},
  // ---- the taxi crushed under the girder; the bus wreck; burning wrecks down the avenue (the battle's path)
  {id: 'taxi', kind: 'vehicle', anchor: 'taxi', pos: {x: 46.5, y: 0, z: -14.2}, ground: 0.65, heading: 75, len: 4.2, size: 1.5, spread: 1.5, seed: 13, light: {power: 0.7, radius: 12}, smoke: 0.7, soot: 0.95},
  {id: 'bus', kind: 'vehicle', anchor: 'bus', pos: {x: 92, y: 0, z: 9}, ground: 2.2, heading: 75, len: 10.5, size: 3.0, spread: 1.1, seed: 14, light: {power: 0.9, radius: 18}, smoke: 1.2, soot: 0.9, heat: -0.2},
  {id: 'wreck2', kind: 'vehicle', anchor: 'wreck_2', pos: {x: 96, y: 0, z: -6}, ground: 0.8, heading: 200, len: 4.2, size: 1.6, spread: 1.5, seed: 37, light: {power: 0.5, radius: 10}, smoke: 0.7, soot: 0.95, heat: 0.1},
  {id: 'wreck5', kind: 'vehicle', anchor: 'wreck_5', pos: {x: 178, y: 0, z: 8}, ground: 0.8, heading: 250, len: 4.2, size: 1.1, spread: 1.4, seed: 38, smoke: 0.4, soot: 0.85, heat: 0.65},
  {id: 'wreck6', kind: 'vehicle', anchor: 'wreck_6', pos: {x: 215, y: 0, z: -10}, ground: 0.8, heading: 80, len: 4.2, size: 2.6, spread: 1.4, seed: 20, smoke: 1.0, soot: 0.95},
  {id: 'wreck7', kind: 'vehicle', anchor: 'wreck_7', pos: {x: 290, y: 0, z: 5}, ground: 0.8, heading: 120, len: 4.2, size: 2.2, spread: 1.4, seed: 39, smoke: 0.7, soot: 0.95, heat: -0.1},
  // ---- burning floors along the avenue frontage (different heights, not every window)
  {id: 'bldN1', kind: 'room', interior: true, pos: {x: 26, y: 18, z: -21}, size: 3.6, spread: 1.6, seed: 15, smoke: 1.0},
  {id: 'bldN2', kind: 'room', interior: true, pos: {x: 104, y: 31, z: -22}, size: 5.0, spread: 1.8, seed: 16, smoke: 1.4},
  {id: 'bldS3', kind: 'room', interior: true, pos: {x: 140, y: 9, z: 22}, size: 4.0, spread: 1.5, seed: 17, smoke: 1.0, heat: -0.3},
  {id: 'bldN4', kind: 'room', interior: true, pos: {x: 196, y: 44, z: -24}, size: 6.0, spread: 1.5, seed: 18, smoke: 1.6},
  {id: 'bldS5', kind: 'room', interior: true, pos: {x: 300, y: 22, z: 24}, size: 7.0, spread: 1.6, seed: 19, smoke: 1.7, heat: 0.2},
  // ---- the wider city: whole blocks burning (the aerial, the ridge's view east, the final pullback). A few are
  //      ENGULFED (upper floors and roof: the big readable ones), the rest burn on one or two floors or smoulder.
  //      size = flame height of the roof fire / window flames scale (m); smoke = plume thickness.
  // (placed so that no column drifts across the opening aerial's sightline to the failing tower: blocks south of that
  //  line drift away from it on the north-east wind, blocks north of it stay north, blocks beyond it are behind it)
  {id: 'blkE1', kind: 'block', pos: {x: 236, y: 0, z: 32}, floors: [0.42, 1], size: 16, seed: 40, smoke: 3.2, heat: -0.2},
  {id: 'blkE2', kind: 'block', pos: {x: 205, y: 0, z: 70}, floors: [0.3, 1], size: 18, seed: 31, smoke: 3.0},
  {id: 'blkE3', kind: 'block', pos: {x: 330, y: 0, z: -150}, floors: [0.35, 1], size: 20, seed: 32, smoke: 3.4, heat: -0.3},
  {id: 'blkE4', kind: 'block', pos: {x: 520, y: 0, z: 30}, floors: [0.5, 1], size: 22, seed: 33, smoke: 3.6},
  {id: 'blkE5', kind: 'block', pos: {x: 980, y: 0, z: -180}, floors: [0.45, 1], size: 34, seed: 27, smoke: 4.4, heat: 0.1},
  {id: 'blkP1', kind: 'block', pos: {x: 150, y: 0, z: -70}, floors: [0.55, 0.8], size: 8, seed: 30, smoke: 2.0},
  {id: 'blkP2', kind: 'block', pos: {x: 362, y: 0, z: -66}, floors: [0.3, 0.55], size: 8, seed: 35, smoke: 1.8, heat: 0.5},
  {id: 'blkP3', kind: 'block', pos: {x: 430, y: 0, z: 120}, floors: [0.6, 0.85], size: 11, seed: 34, smoke: 2.4, heat: -0.2},
  {id: 'blkP4', kind: 'block', pos: {x: 520, y: 0, z: -200}, floors: [0.4, 0.62], size: 12, seed: 41, smoke: 2.4},
  {id: 'city1', kind: 'block', pos: {x: 180, y: 0, z: -140}, floors: [0.6, 0.86], size: 12, seed: 21, smoke: 2.2},
  {id: 'city2', kind: 'block', pos: {x: 330, y: 0, z: 170}, floors: [0.5, 0.75], size: 14, seed: 22, smoke: 2.6},
  {id: 'city3', kind: 'block', pos: {x: 470, y: 0, z: -60}, floors: [0.55, 0.8], size: 12, seed: 23, smoke: 2.2, heat: 0.4},
  {id: 'city4', kind: 'block', pos: {x: 600, y: 0, z: 90}, floors: [0.6, 1], size: 18, seed: 24, smoke: 3.2, heat: -0.3},
  {id: 'city5', kind: 'block', pos: {x: 90, y: 0, z: 160}, floors: [0.5, 0.7], size: 10, seed: 25, smoke: 2.0},
  {id: 'city6', kind: 'block', pos: {x: 760, y: 0, z: 260}, floors: [0.55, 1], size: 22, seed: 26, smoke: 3.6},
  {id: 'city8', kind: 'block', pos: {x: 1300, y: 0, z: 120}, floors: [0.5, 0.8], size: 30, seed: 28, smoke: 4.0},
  {id: 'city9', kind: 'block', pos: {x: 700, y: 0, z: -120}, floors: [0.6, 0.85], size: 15, seed: 29, smoke: 2.8, heat: 0.3},
];

/** A FIRE_SITE as a Fire (its look and smoke chosen by kind and size). */
const siteFire = (s: FireSite, i: number): Fire => {
  const seed = 101 + i * 3;
  const grow = s.from !== undefined ? (s.kind === 'room' ? 2.5 : 5) : undefined;
  const base = {id: s.id, size: s.size, seed, from: s.from, grow, anchor: s.anchor};
  switch (s.kind) {
    case 'room': return {...base, kind: 'room', pos: s.pos, normal: s.n, spread: 1.4, smoke: clamp(s.size / 4, 0.7, 2.2)};
    // (the stump's broken top: its smoke is the stump's big column, drawn with the tower in atmos.tsx)
    case 'opening': return {...base, kind: 'opening', pos: s.pos, normal: s.n, spread: 1.7, smoke: s.anchor === 'towerStump' ? 0 : clamp(s.size / 4, 0.6, 2.6), soot: 0.68};
    case 'vehicle': return {...base, kind: 'vehicle', pos: {...s.pos, y: 0}, spread: 1.4, smoke: clamp(s.size / 3, 0.5, 1.4), soot: 0.94, light: s.size >= 3 ? {power: 0.5, radius: 14} : undefined};
    default: return {...base, kind: 'debris', pos: {...s.pos, y: 0}, ground: 0.3, spread: 1.5, smoke: clamp(s.size / 3.2, 0.4, 1.6), soot: 0.6};
  }
};

export const FIRES: Fire[] = [...OWN, ...FIRE_SITES.map(siteFire)];

// resolve ground-relative fires; vehicle fires take their vehicle's place, heading, length and height (STREET_OBSTACLES)
FIRES.forEach((f) => {
  if (f.kind === 'vehicle' && f.anchor) {
    const o = STREET_OBSTACLES.find((q) => q.id === f.anchor);
    if (o) {
      f.pos = {x: o.x, y: 0, z: o.z};
      f.heading = o.heading;
      f.len = o.len * 0.9;
      f.ground = o.h * (o.flipped ? 0.55 : o.kind === 'truck' || o.kind === 'bus' ? 0.62 : 0.5);
    }
  }
  if (f.kind === 'vehicle' && f.ground === undefined) f.ground = 0.8;
  if (f.ground !== undefined) f.pos = {...f.pos, y: groundH(f.pos.x, f.pos.z) + f.ground};
});

export const kindOf = (f: Fire): FireKind => f.kind ?? (f.interior ? 'room' : 'debris');
/** Smoke character of a fire (0 pale dust .. 1 black oily). */
export const sootOf = (f: Fire) => f.soot ?? ({debris: 0.55, spill: 0.9, vehicle: 0.92, room: 0.7, block: 0.72, opening: 0.68} as const)[kindOf(f)];

/**
 * Burn energy at film time t: 0 before `from`, a growth ramp, a slow per-source breathing and a faster per-source
 * flicker (rates and phases from the seed, never one loop for every fire). ~0.75..1.2 when burning. Flame height,
 * flame brightness and the light the fire casts all follow this one curve.
 */
export const fireEnergy = (f: Fire, t: number) => {
  if (f.from !== undefined && t < f.from) return 0;
  const g = f.from !== undefined ? smooth((t - f.from) / (f.grow ?? 1.5)) : 1;
  const s = f.seed;
  const rb = 0.18 + rnd(s * 7 + 1) * 0.22, rf = 1.7 + rnd(s * 11 + 2) * 1.5;
  const breathe = noise(t * rb + s * 3.1, s);
  const flick = noise(t * rf + s * 1.7, s + 9) * 0.65 + noise(t * rf * 2.3 + s * 5.3, s + 19) * 0.35;
  return g * (0.94 + 0.13 * breathe + 0.1 * flick);
};
/** (R2 name) burn intensity — the same curve as fireEnergy. */
export const burn = fireEnergy;

const COL = {orange: '#FF8A3A', red: '#E2552E', yellow: '#FFC266'};
export const fireLightColor = (f: Fire) => ((f.heat ?? 0) > 0.4 ? COL.red : (f.heat ?? 0) < -0.2 ? COL.yellow : COL.orange);

/**
 * The near fires as point lights for the cel shader (plus any extra lights a shot adds). The light sits in the
 * flame's lower third and its power follows fireEnergy, so the spill on the set brightens and dims with the flames;
 * only a little extra shimmer is left to the engine's own flicker.
 */
export const fireLights = (t: number, extra: PointLight[] = []): PointLight[] => [
  ...FIRES.filter((f) => f.light).map((f) => {
    const e = fireEnergy(f, t);
    return {
      pos: {x: f.pos.x, y: f.pos.y + f.size * 0.35, z: f.pos.z},
      color: fireLightColor(f),
      power: f.light!.power * clamp(e * e, 0, 1.6),
      radius: f.light!.radius * (0.92 + 0.08 * e),
      flicker: 0.05,
      seed: f.seed,
    };
  }),
  ...extra,
];
