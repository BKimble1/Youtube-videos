// Cel lighting: a low sun, a cool ambient, warm fire lights with falloff, and distance haze. Each face gets one of
// three tones (shadow / mid / lit) plus a banded warm spill from nearby fires, then haze by distance. Characters and
// sprites ask `lightAt` for the same light so they sit in the scene's light.
import {V3, dot3, norm3, sub3, len3, clamp, noise} from '../../kit/math';
import {RGB, rgb, hex, mixRGB, tint, mulRGB} from './color';

export type Material = {
  base: string;
  /** 0 = ignore the sun bands (flat), 1 = full cel banding (default 1) */
  lit?: number;
  /** self-lit (fire, screens): no shading; still hazed unless fog = 0 */
  emissive?: boolean;
  /** haze multiplier (0 = none, default 1) */
  fog?: number;
  /** ink colour for this material's edges (default theme ink) */
  ink?: string;
  /** no ink edges for faces of this material */
  noInk?: boolean;
  /** ink width multiplier */
  inkW?: number;
  /** opacity (glass, dust sheets) */
  opacity?: number;
};

export type PointLight = {pos: V3; color: string; power: number; radius: number; flicker?: number; seed?: number};

export type LightRig = {
  /** unit vector pointing TOWARD the sun */
  sun: V3;
  sunColor: string;
  /** colour the shadow tone leans to */
  ambient: string;
  /** tone levels for shadow / mid / lit */
  levels?: [number, number, number];
  /** band thresholds on n·sun: lit above hi, shadow below lo */
  bands?: [number, number];
  lights: PointLight[];
  fogColor: string;
  fogStart: number;
  fogEnd: number;
  fogMax?: number;
  /** extra haze below this height (m) — smoke lying in the streets */
  groundHaze?: {height: number; amount: number; color?: string};
  skyTop: string;
  skyHorizon: string;
  /** glow behind the skyline (fires / sunset) */
  skyGlow?: {color: string; at: number; width: number};
  ink: string;
};

export type Lit = {band: 0 | 1 | 2; sunDot: number; fire: number; fireColor: RGB; fog: number};

const flick = (L: PointLight, t: number) => 1 + (L.flicker ?? 0.15) * (noise(t * 7 + (L.seed ?? 0), 31) * 0.7 + noise(t * 17 + (L.seed ?? 0), 77) * 0.3);

/** Light at a point with normal n (world). `camDist` for haze. */
export const lightAt = (rig: LightRig, p: V3, n: V3, camDist: number, t: number): Lit => {
  const sd = dot3(n, rig.sun);
  const [lo, hi] = rig.bands ?? [-0.05, 0.38];
  const band = (sd > hi ? 2 : sd > lo ? 1 : 0) as 0 | 1 | 2;
  let fire = 0;
  let fc: RGB = [255, 150, 60];
  let best = 0;
  for (const L of rig.lights) {
    const d = sub3(L.pos, p);
    const dist = len3(d);
    if (dist > L.radius) continue;
    const fall = Math.pow(1 - dist / L.radius, 2);
    const facing = clamp(dot3(n, norm3(d)) * 0.8 + 0.2, 0, 1);
    const e = L.power * fall * facing * flick(L, t);
    fire += e;
    if (e > best) { best = e; fc = rgb(L.color); }
  }
  const f0 = clamp((camDist - rig.fogStart) / Math.max(1, rig.fogEnd - rig.fogStart));
  let fog = Math.pow(f0, 0.85) * (rig.fogMax ?? 0.92);
  if (rig.groundHaze && p.y < rig.groundHaze.height) fog = Math.min(1, fog + rig.groundHaze.amount * (1 - p.y / rig.groundHaze.height) * clamp(camDist / 60));
  return {band, sunDot: sd, fire, fireColor: fc, fog};
};

const toneCache = new Map<string, [RGB, RGB, RGB]>();
/** The three cel tones of a base colour under this rig. */
export const tones = (rig: LightRig, base: string): [RGB, RGB, RGB] => {
  const key = `${base}|${rig.sunColor}|${rig.ambient}|${(rig.levels ?? []).join(',')}`;
  let t = toneCache.get(key);
  if (t) return t;
  const b = rgb(base);
  const [ls, lm, ll] = rig.levels ?? [0.58, 0.82, 1.02];
  const amb = rgb(rig.ambient), sun = rgb(rig.sunColor);
  const shadow = mixRGB(mulRGB(b, ls), mulRGB(amb, ls), 0.3);
  const mid = tint(mulRGB(b, lm), sun, 0.12);
  const litT = tint(mulRGB(b, ll), sun, 0.28);
  t = [shadow, mid, litT];
  toneCache.set(key, t);
  return t;
};

/** Final face colour. */
export const shade = (rig: LightRig, mat: Material, L: Lit): string => {
  let c: RGB;
  if (mat.emissive) c = rgb(mat.base);
  else {
    const tn = tones(rig, mat.base);
    const k = mat.lit ?? 1;
    c = k >= 1 ? tn[L.band] : mixRGB(tn[1], tn[L.band], k);
    // warm spill, banded so it reads as shapes of light, not gradients
    const fb = L.fire > 0.55 ? 0.42 : L.fire > 0.22 ? 0.24 : L.fire > 0.08 ? 0.1 : 0;
    if (fb > 0) c = mixRGB(c, mixRGB(L.fireColor, rgb(mat.base), 0.35), fb);
  }
  const fogK = L.fog * (mat.fog ?? 1);
  if (fogK > 0.002) c = mixRGB(c, rgb(rig.fogColor), fogK);
  return hex(c);
};

export const inkColor = (rig: LightRig, mat: Material | undefined, L: Lit) => {
  const base = rgb(mat?.ink ?? rig.ink);
  const fogK = L.fog * (mat?.fog ?? 1);
  return hex(mixRGB(base, rgb(rig.fogColor), Math.min(1, fogK * 1.05)));
};
