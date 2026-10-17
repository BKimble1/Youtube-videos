// Fire sources for the battlefield: every flame has a cause and a place (a burning floor, a wreck, a spill of
// burning debris), its own size, rhythm and colour, and the near ones light the set. atmos.tsx draws them; the
// lighting rig takes the near ones as point lights. Positions in metres (see plan.ts).
import {V3, noise, clamp} from '../../kit/math';
import {PointLight} from '../engine';
import {groundH} from './ground';

export type Fire = {
  id: string;
  pos: V3;
  /** flame height (m) at full burn */
  size: number;
  /** width / height of the flame mass */
  spread?: number;
  seed: number;
  /** burns from this film time (s); default always */
  from?: number;
  /** lights the set (near fires only) */
  light?: {power: number; radius: number};
  /** smoke column above it: thickness (0 = none) */
  smoke?: number;
  /** colour bias: 0 = orange, 1 = deep red (smouldering), -1 = yellow-white (fierce) */
  heat?: number;
  /** interior fire seen through an opening (drawn without ground scorch) */
  interior?: boolean;
  /** if set, pos.y is resolved as groundH(x, z) + this (fires on the ground / on wrecks) */
  ground?: number;
};

export const FIRES: Fire[] = [
  // the collapsed building west of the ridge (behind the Director as he faces east: smoke and warm rim behind him)
  {id: 'ruinW1', pos: {x: -22, y: 0, z: -7}, ground: 0.3, size: 4.2, spread: 1.6, seed: 1, light: {power: 1.15, radius: 26}, smoke: 1.3},
  {id: 'ruinW2', pos: {x: -27, y: 5.5, z: 10}, size: 3.0, spread: 1.3, seed: 2, interior: true, light: {power: 0.8, radius: 18}, smoke: 0.9},
  {id: 'ruinW3', pos: {x: -15, y: 0, z: 15}, ground: 0.25, size: 1.6, spread: 1.0, seed: 3, smoke: 0.5, heat: 0.6},
  // small fires in the ridge rubble
  {id: 'ridgeN', pos: {x: 2.5, y: 0, z: -11}, ground: 0.2, size: 1.0, spread: 1.2, seed: 4, light: {power: 0.55, radius: 9}, smoke: 0.35, heat: 0.3},
  {id: 'ridgeS', pos: {x: -1.5, y: 0, z: 13.5}, ground: 0.2, size: 0.8, spread: 1.1, seed: 5, smoke: 0.3, heat: 0.7},
  {id: 'spillE', pos: {x: 16, y: 0, z: -7}, ground: 0.2, size: 0.7, spread: 1.4, seed: 6, light: {power: 0.45, radius: 8}, smoke: 0.25, heat: 0.4},
  // the south flank: a burning facade spilled across the sidewalk
  {id: 'southA', pos: {x: 34, y: 0.8, z: 18.5}, size: 3.4, spread: 1.8, seed: 7, light: {power: 1.0, radius: 22}, smoke: 1.1},
  {id: 'southB', pos: {x: 47, y: 7.5, z: 21}, size: 4.5, spread: 1.4, seed: 8, interior: true, light: {power: 0.9, radius: 22}, smoke: 1.2, heat: -0.4},
  {id: 'southC', pos: {x: 58, y: 14.2, z: 21}, size: 3.2, spread: 1.2, seed: 9, interior: true, smoke: 0.8},
  {id: 'southD', pos: {x: 54, y: 0.6, z: 16}, size: 1.6, spread: 1.5, seed: 10, light: {power: 0.6, radius: 12}, smoke: 0.5, heat: 0.2},
  // the crater: burning debris and a car
  {id: 'craterCar', pos: {x: 57, y: 0, z: 4}, ground: 1.25, size: 2.2, spread: 1.6, seed: 11, light: {power: 0.85, radius: 16}, smoke: 0.9},
  {id: 'craterRim', pos: {x: 72, y: 0, z: -11}, ground: 0.25, size: 1.2, spread: 1.3, seed: 12, smoke: 0.4, heat: 0.5},
  // the taxi crushed under the girder, the bus wreck
  {id: 'taxi', pos: {x: 46.5, y: 0, z: -14.2}, ground: 0.75, size: 1.5, spread: 1.4, seed: 13, light: {power: 0.7, radius: 12}, smoke: 0.7},
  {id: 'bus', pos: {x: 92, y: 1.4, z: 9}, size: 3.0, spread: 2.2, seed: 14, light: {power: 0.9, radius: 18}, smoke: 1.2, heat: -0.2},
  // burning floors along the avenue (different heights, not every window)
  {id: 'bldN1', pos: {x: 26, y: 18, z: -21}, size: 3.6, spread: 1.6, seed: 15, interior: true, smoke: 1.0},
  {id: 'bldN2', pos: {x: 104, y: 31, z: -22}, size: 5.0, spread: 1.8, seed: 16, interior: true, smoke: 1.4},
  {id: 'bldS3', pos: {x: 140, y: 9, z: 22}, size: 4.0, spread: 1.5, seed: 17, interior: true, smoke: 1.0, heat: -0.3},
  {id: 'bldN4', pos: {x: 196, y: 44, z: -24}, size: 6.0, spread: 1.5, seed: 18, interior: true, smoke: 1.6},
  {id: 'bldS5', pos: {x: 300, y: 22, z: 24}, size: 7.0, spread: 1.6, seed: 19, interior: true, smoke: 1.7, heat: 0.2},
  {id: 'street6', pos: {x: 240, y: 0.8, z: -4}, size: 3.0, spread: 2.0, seed: 20, smoke: 1.0},
  // the wider city: blocks burning off the avenue (seen from the aerial and from the ridge)
  {id: 'city1', pos: {x: 180, y: 30, z: -140}, size: 14, spread: 1.8, seed: 21, smoke: 2.6},
  {id: 'city2', pos: {x: 330, y: 52, z: 170}, size: 16, spread: 1.6, seed: 22, smoke: 3.0},
  {id: 'city3', pos: {x: 470, y: 18, z: -60}, size: 12, spread: 2.2, seed: 23, smoke: 2.4},
  {id: 'city4', pos: {x: 560, y: 70, z: 90}, size: 18, spread: 1.5, seed: 24, smoke: 3.2, heat: -0.3},
  {id: 'city5', pos: {x: 90, y: 22, z: 160}, size: 12, spread: 1.7, seed: 25, smoke: 2.2},
  {id: 'city6', pos: {x: 700, y: 120, z: 260}, size: 22, spread: 1.4, seed: 26, smoke: 3.6},
  {id: 'city7', pos: {x: 980, y: 90, z: -180}, size: 26, spread: 1.6, seed: 27, smoke: 4.0, heat: 0.3},
  {id: 'city8', pos: {x: 1300, y: 160, z: 120}, size: 30, spread: 1.5, seed: 28, smoke: 4.4},
  {id: 'city9', pos: {x: 640, y: 40, z: -120}, size: 15, spread: 1.8, seed: 29, smoke: 2.8},
];

// resolve ground-relative fires once
FIRES.forEach((f) => { if (f.ground !== undefined) f.pos = {...f.pos, y: groundH(f.pos.x, f.pos.z) + f.ground}; });

/** Burn intensity 0..1.3 at time t (slow breathing + flicker), 0 before `from`. */
export const burn = (f: Fire, t: number) => {
  if (f.from !== undefined && t < f.from) return 0;
  const ramp = f.from !== undefined ? clamp((t - f.from) / 1.5) : 1;
  return ramp * (0.9 + 0.12 * noise(t * 0.35 + f.seed * 3.1, f.seed) + 0.08 * noise(t * 2.3 + f.seed, f.seed + 9));
};

const COL = {orange: '#FF8A3A', red: '#E2552E', yellow: '#FFC266'};
/** The near fires as point lights for the cel shader (plus any extra lights a shot adds). */
export const fireLights = (t: number, extra: PointLight[] = []): PointLight[] => [
  ...FIRES.filter((f) => f.light).map((f) => ({
    pos: {x: f.pos.x, y: f.pos.y + f.size * 0.4, z: f.pos.z},
    color: (f.heat ?? 0) > 0.4 ? COL.red : (f.heat ?? 0) < -0.2 ? COL.yellow : COL.orange,
    power: f.light!.power * burn(f, t),
    radius: f.light!.radius,
    flicker: 0.18,
    seed: f.seed,
  })),
  ...extra,
];
