// Light and materials for the battlefield, evolving with the drama (film seconds, see r2/timing.ts):
//   A/B/C  dusk gold: a low sun in the west behind the Crew, warm haze, the skyline glowing
//   D      the light drains: lower, redder sun, darker sky, heavier smoke haze — the fires take over
//   E/F/G  sober grey-blue after the death: the sun gone behind the smoke, cool haze, fires still burning
// Values are kept so faces and costumes read: shadow tones never go below ~55 % of the base, and the set's palette is
// desaturated against the cast's saturated colours.
import {V3, smooth, norm3, lerp} from '../../kit/math';
import {LightRig, Material, PointLight, mix} from '../engine';
import {SUN_TOWARD} from './plan';
import {fireLights} from './fires';

/** Set materials. Restrained, slightly desaturated; cast colours stay the most saturated things in frame. */
export const MATS: Record<string, Material> = {
  // ground
  asphalt: {base: '#4C4846'},
  asphaltWorn: {base: '#5A5450'},
  asphaltBroken: {base: '#57514C'},
  sidewalk: {base: '#8E877E'},
  kerb: {base: '#A29A8F'},
  rubble: {base: '#8C8277'},
  rubbleDark: {base: '#6B625A'},
  dust: {base: '#A3988A'},
  scorched: {base: '#4A423E'},
  dirt: {base: '#6E5E50'},
  paintW: {base: '#CFC8B9', lit: 0.6},
  paintY: {base: '#C9A246', lit: 0.6},
  crack: {base: '#26211F', noInk: true},
  scorch: {base: '#2E2826', noInk: true, opacity: 0.75},
  stain: {base: '#3A3330', noInk: true, opacity: 0.5},
  manhole: {base: '#3B3836'},
  // concrete and structure
  concrete: {base: '#A0988D'},
  concreteDark: {base: '#7E766D'},
  concreteEdge: {base: '#8A8178'},
  rebar: {base: '#5E4436'},
  rust: {base: '#7C4B33'},
  steel: {base: '#545C62'},
  steelDark: {base: '#3E4448'},
  girder: {base: '#46594E'},
  girderRust: {base: '#6A4A36'},
  // buildings
  brick: {base: '#8C5242'},
  brickDark: {base: '#6F4236'},
  brickLight: {base: '#9E6A55'},
  limestone: {base: '#B3A790'},
  limestoneDark: {base: '#968A75'},
  glass: {base: '#5F6F7A'},
  glassLight: {base: '#8C9DA6'},
  facadeGrey: {base: '#8D8A86'},
  roof: {base: '#5D5752'},
  roofTar: {base: '#3F3B39'},
  window: {base: '#2C2B30', noInk: true},
  windowLit: {base: '#C8873F', emissive: true, noInk: true},
  windowGlow: {base: '#E9A04F', emissive: true, noInk: true},
  windowSky: {base: '#7C8C99', noInk: true},
  interior: {base: '#3D3430'},
  interiorDeep: {base: '#262120', noInk: true},
  fireEscape: {base: '#2A2624'},
  waterTower: {base: '#6B5340'},
  far: {base: '#77707A'},
  farLit: {base: '#E39A52', emissive: true, noInk: true},
  // vehicles
  van: {base: '#D2CBBE'},
  vanStripe: {base: '#4C6F84'},
  vanDark: {base: '#2F2D2E'},
  vanFloor: {base: '#5A5450'},
  tire: {base: '#2A2828'},
  taxi: {base: '#D9A52E'},
  taxiDark: {base: '#8C6A22'},
  bus: {base: '#BFC1BB'},
  busStripe: {base: '#365E83'},
  burnt: {base: '#3A3431'},
  carGrey: {base: '#6F7478'},
  carRed: {base: '#7E3B33'},
  // radio (R1's RadioSmall look: battered red-brown body, dark grille, warm dial)
  radio: {base: '#8A4330'},
  radioDark: {base: '#3A2723'},
  radioMetal: {base: '#9A9590'},
  dialOff: {base: '#5A4A38', noInk: true},
  dialOn: {base: '#FFD27A', emissive: true, noInk: true},
  // glow
  fireGlow: {base: '#FF9A3D', emissive: true, noInk: true},
};

type Phase = {
  sunY: number; sunColor: string; ambient: string; skyTop: string; skyHorizon: string; fogColor: string;
  fogStart: number; fogEnd: number; fogMax: number; glow: string; glowAt: number; haze: number; hazeColor: string;
  levels: [number, number, number];
};
const DUSK: Phase = {
  sunY: 0.2, sunColor: '#FFC58F', ambient: '#4C5A7A', skyTop: '#2F2B46', skyHorizon: '#D98B5E', fogColor: '#A88779',
  fogStart: 45, fogEnd: 1700, fogMax: 0.86, glow: '#FF9C55', glowAt: 0.38, haze: 0.16, hazeColor: '#A88779', levels: [0.57, 0.83, 1.04],
};
const BATTLE: Phase = {
  sunY: 0.13, sunColor: '#FFA26E', ambient: '#4B4766', skyTop: '#261F33', skyHorizon: '#BC6347', fogColor: '#8E685B',
  fogStart: 35, fogEnd: 1300, fogMax: 0.88, glow: '#FF7A40', glowAt: 0.42, haze: 0.26, hazeColor: '#8E685B', levels: [0.56, 0.82, 1.03],
};
const LATE: Phase = {
  sunY: 0.08, sunColor: '#FF8E62', ambient: '#45405E', skyTop: '#201A2C', skyHorizon: '#9E4A38', fogColor: '#7A5A52',
  fogStart: 30, fogEnd: 1150, fogMax: 0.9, glow: '#FF6A34', glowAt: 0.45, haze: 0.32, hazeColor: '#7A5A52', levels: [0.56, 0.82, 1.02],
};
const AFTER: Phase = {
  sunY: 0.06, sunColor: '#C9B4B0', ambient: '#566480', skyTop: '#272C3B', skyHorizon: '#7E7E8E', fogColor: '#7D7E8A',
  fogStart: 40, fogEnd: 1400, fogMax: 0.88, glow: '#E07A4E', glowAt: 0.2, haze: 0.24, hazeColor: '#7D7E8A', levels: [0.62, 0.84, 0.98],
};

const mixPhase = (a: Phase, b: Phase, k: number): Phase => ({
  sunY: lerp(a.sunY, b.sunY, k), sunColor: mix(a.sunColor, b.sunColor, k), ambient: mix(a.ambient, b.ambient, k),
  skyTop: mix(a.skyTop, b.skyTop, k), skyHorizon: mix(a.skyHorizon, b.skyHorizon, k), fogColor: mix(a.fogColor, b.fogColor, k),
  fogStart: lerp(a.fogStart, b.fogStart, k), fogEnd: lerp(a.fogEnd, b.fogEnd, k), fogMax: lerp(a.fogMax, b.fogMax, k),
  glow: mix(a.glow, b.glow, k), glowAt: lerp(a.glowAt, b.glowAt, k), haze: lerp(a.haze, b.haze, k), hazeColor: mix(a.hazeColor, b.hazeColor, k),
  levels: [lerp(a.levels[0], b.levels[0], k), lerp(a.levels[1], b.levels[1], k), lerp(a.levels[2], b.levels[2], k)],
});

/** The phase at film time t: dusk → battle (60–95 s) → late (150–186 s) → after (186–200 s). */
export const phaseAt = (t: number): Phase => {
  if (t < 60) return DUSK;
  if (t < 95) return mixPhase(DUSK, BATTLE, smooth((t - 60) / 35));
  if (t < 150) return BATTLE;
  if (t < 186) return mixPhase(BATTLE, LATE, smooth((t - 150) / 36));
  if (t < 200) return mixPhase(LATE, AFTER, smooth((t - 186) / 14));
  return AFTER;
};

export type LightOpts = {
  /** extra point lights (muzzle flashes, sparks, the radio dial…) */
  extra?: PointLight[];
  /** scale all fire light (e.g. 0 for a clean model check) */
  fireK?: number;
  /** override the phase time (to light a shot as another moment) */
  phaseT?: number;
};

/** The light rig for film time t. */
export const lightFor = (t: number, o: LightOpts = {}): LightRig => {
  const p = phaseAt(o.phaseT ?? t);
  const sun: V3 = norm3({x: SUN_TOWARD.x, y: p.sunY, z: SUN_TOWARD.z});
  const fk = o.fireK ?? 1;
  return {
    sun,
    sunColor: p.sunColor,
    ambient: p.ambient,
    levels: p.levels,
    lights: fireLights(t, o.extra ?? []).map((l) => ({...l, power: l.power * (l.color ? fk : 1)})),
    fogColor: p.fogColor,
    fogStart: p.fogStart,
    fogEnd: p.fogEnd,
    fogMax: p.fogMax,
    groundHaze: {height: 5, amount: p.haze, color: p.hazeColor},
    skyTop: p.skyTop,
    skyHorizon: p.skyHorizon,
    skyGlow: {color: p.glow, at: p.glowAt, width: 0.9},
    ink: '#162A32',
  };
};

/** Character-facing summary of the light (for 2D figures): sun direction and colour, ambient, rim (sky glow). */
export const figureLight = (t: number) => {
  const p = phaseAt(t);
  return {sun: norm3({x: SUN_TOWARD.x, y: p.sunY, z: SUN_TOWARD.z}), sunColor: p.sunColor, ambient: p.ambient, fog: p.fogColor, rim: p.glow};
};
