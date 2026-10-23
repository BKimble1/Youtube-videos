// V4 pose library: base poses and faces for the two Crew rigs, and a deep mixer (every field of a pose is numeric,
// so any two poses blend continuously).
import {Body4} from './cast6';
import {FACE0, Face4, Pose4} from './Crew6';
import {v3, V3} from './geo6';

type Any = number | string | boolean | undefined | Any[] | {[k: string]: Any};
const mixAny = (a: Any, b: Any, t: number): Any => {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => mixAny(x, b[i] ?? x, t));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o: {[k: string]: Any} = {};
    for (const k of Object.keys(a)) o[k] = k in b ? mixAny((a as {[k: string]: Any})[k], (b as {[k: string]: Any})[k], t) : (a as {[k: string]: Any})[k];
    for (const k of Object.keys(b)) if (!(k in o)) o[k] = (b as {[k: string]: Any})[k];
    return o;
  }
  return t < 0.5 ? a : b;
};
export const mix = <T,>(a: T, b: T, t: number): T => mixAny(a as unknown as Any, b as unknown as Any, t) as unknown as T;
/** Keyed pose track: keys [time, value]; cubic smoothstep in each segment unless the key carries its own easing. */
export const keyed = <T,>(t: number, keys: [number, T, ((x: number) => number)?][]): T => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1];
      const [t1, b, e] = keys[i];
      const u = (t - t0) / (t1 - t0 || 1);
      return mix(a, b, (e ?? ((x: number) => x * x * (3 - 2 * x)))(u));
    }
  }
  return keys[keys.length - 1][1];
};

export const face = (o: Partial<Face4>): Face4 => ({...FACE0, ...o});
export const FACES = {
  neutral: face({}),
  run: face({brow: 0.2, browIn: 0.5, mw: 11, curve: -0.2, open: 0.35, wide: 0.3}),
  alarm: face({brow: 0.8, browIn: 0.5, wide: 1, mw: 10, curve: -0.3, open: 0.6}),
  focus: face({brow: -0.3, browIn: -0.4, mw: 12, curve: -0.1, lid: 0.15}),
  hold: face({brow: 0.6, browIn: 0.8, wide: 0.9, mw: 8, curve: -0.25, blush: 0.6}),
  relief: face({brow: 0.3, browIn: 0.6, lid: 0.45, mw: 13, curve: 0.1, open: 0.15}),
  smug: face({brow: 0.1, browIn: -0.2, asym: 0.5, lid: 0.3, mw: 15, curve: 0.8, smirk: 0.6}),
  giggle: face({brow: 0.4, browIn: 0.5, squint: 0.6, mw: 14, curve: 0.9, blush: 0.7}),
  grin: face({brow: 0.4, squint: 0.4, mw: 18, curve: 1, open: 0.45, teeth: 1, blush: 0.4}),
  uhoh: face({brow: 0.9, browIn: 0.9, wide: 1, mw: 9, curve: -0.5, open: 0.25, sweat: 1}),
  // guard
  gSearch: face({brow: -0.4, browIn: -0.6, mw: 14, curve: -0.2, lid: 0.2}),
  gPuzzle: face({brow: 0.3, browIn: 0.2, asym: 0.8, mw: 12, curve: -0.3, smirk: -0.4}),
  gSquint: face({brow: -0.7, browIn: -0.7, lid: 0.45, squint: 0.3, mw: 10, curve: -0.2}),
  gShock: face({brow: 1, browIn: 0.3, wide: 1, mw: 11, curve: -0.2, open: 0.85}),
  gJaw: face({brow: 0.9, browIn: 0.1, wide: 0.7, mw: 12, curve: -0.1, open: 1}),
  gStern: face({brow: -0.8, browIn: -0.9, lid: 0.3, mw: 14, curve: -0.4}),
  gGotcha: face({brow: -0.5, browIn: -0.8, lid: 0.35, mw: 16, curve: 0.7, smirk: 0.5, teeth: 0}),
};

/** Standing pose for a body: feet at hip width, arms hanging (hands slightly forward and out). */
export const stand = (b: Body4, f: Face4 = FACES.neutral): Pose4 => ({
  pel: v3(0, b.hipY, 0), hipYaw: 0, pitch: 2, roll: 0, twist: 0, hy: 0, hp: 0, hr: 0,
  footL: v3(b.hipW + 2, 14, 2), footR: v3(-b.hipW - 2, 14, 2), toeL: 0, toeR: 0,
  armL: {hand: v3(b.shW + 16, b.hipY + b.spine - b.upper - b.fore + 12, 10)}, armR: {hand: v3(-b.shW - 16, b.hipY + b.spine - b.upper - b.fore + 12, 10)},
  face: f,
});
/** Deep crouch (her hiding pose): pelvis low, knees forward, back rounded over the thighs. */
export const crouch = (b: Body4, f: Face4 = FACES.focus): Pose4 => ({
  pel: v3(0, 74, -26), hipYaw: 0, pitch: 34, roll: 0, twist: 0, hy: 0, hp: -18, hr: 0,
  footL: v3(b.hipW + 8, 14, 22), footR: v3(-b.hipW - 8, 14, 4), toeL: 0, toeR: -12,
  armL: {hand: v3(70, 150, 96), shape: 'grip'}, armR: {hand: v3(-70, 150, 96), shape: 'grip'},
  face: f,
});
export const P0: V3 = v3(0, 0, 0);
