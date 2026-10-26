// Mouth shapes shared by the robot rig and the visitor's head, and timed tracks through them. A track is a list of
// [seconds, viseme] keys; between keys the shape blends over a short co-articulation window, so mouths change
// continuously (never a one-frame snap).
import {Expr} from '../dc/Head';
import {RobotState} from '../art/Robot';
import {clamp, smooth} from '../dc/math';
import ENV from '../data/env.json';

export type Vis = 'rest' | 'B' | 'A' | 'N' | 'W' | 'E' | 'O';
type RV = Pick<RobotState, 'open' | 'round' | 'press' | 'wide' | 'smile'>;
type HV = Pick<Expr, 'open' | 'wide' | 'smile' | 'teeth'>;
export const RVIS: Record<Vis, RV> = {
  rest: {open: 0.02, round: 0, press: 0, wide: 0, smile: 0.05},
  B: {open: 0, round: 0, press: 1, wide: -0.05, smile: 0},
  A: {open: 0.55, round: 0, press: 0, wide: 0.05, smile: 0.05},
  N: {open: 0.16, round: 0, press: 0, wide: 0.15, smile: 0.08},
  W: {open: 0.14, round: 1, press: 0, wide: -0.4, smile: 0},
  E: {open: 0.14, round: 0, press: 0, wide: 0.85, smile: 0.3},
  O: {open: 0.38, round: 0.7, press: 0, wide: -0.25, smile: 0},
};
export const HVIS: Record<Vis, HV> = {
  rest: {open: 0.02, wide: 1, smile: 0.12, teeth: 0},
  B: {open: 0, wide: 0.86, smile: 0, teeth: 0},
  A: {open: 0.56, wide: 0.95, smile: 0.05, teeth: 0.3},
  N: {open: 0.2, wide: 1.0, smile: 0.1, teeth: 0.45},
  W: {open: 0.22, wide: 0.55, smile: 0, teeth: 0},
  E: {open: 0.13, wide: 1.32, smile: 0.4, teeth: 0.42},
  O: {open: 0.4, wide: 0.7, smile: 0, teeth: 0.1},
};
export type Track = [number, Vis][];
/** blend weights of a track at time t (co-articulation window w seconds) */
const at = <T extends Record<string, number>>(t: number, tr: Track, table: Record<Vis, T>, w = 0.07): T => {
  let i = 0;
  while (i < tr.length - 1 && tr[i + 1][0] <= t) i++;
  const cur = table[tr[i][1]];
  if (i + 1 >= tr.length) return {...cur};
  const [tn, vn] = tr[i + 1];
  const k = smooth(clamp((t - (tn - w)) / w));
  const nxt = table[vn];
  const o = {} as T;
  (Object.keys(cur) as (keyof T)[]).forEach((key) => ((o as any)[key] = (cur[key] as number) + ((nxt[key] as number) - (cur[key] as number)) * k));
  return o;
};
export const robotVis = (t: number, tr: Track, w?: number) => at(t, tr, RVIS, w);
export const humanVis = (t: number, tr: Track, w?: number) => at(t, tr, HVIS, w);
/** "banana" as spoken in the narration (syllables measured on the take: b-closure 33.30-33.39 s, then ba-na-na) */
export const BANANA: Track = [
  [32.0, 'rest'],
  [33.27, 'B'],
  [33.41, 'A'],
  [33.63, 'N'],
  [33.74, 'A'],
  [33.83, 'N'],
  [33.88, 'A'],
  [34.02, 'rest'],
];
/** loudness of the narration at time t, 0..1 (-50 dB -> 0, -12 dB -> 1) */
export const loud = (t: number) => {
  const i = Math.floor(t * 100);
  const db = (ENV.db as number[])[Math.max(0, Math.min(ENV.db.length - 1, i))];
  return clamp((db + 50) / 38);
};
/** a slightly smoothed loudness (jaw inertia: 60 ms) */
export const loudSm = (t: number) => (loud(t) * 0.5 + loud(t - 0.03) * 0.3 + loud(t - 0.06) * 0.2);
