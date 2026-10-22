// Core helpers for the Digital Twin / Molecular Attack episode. Every timing in the film comes from the narration's
// measured word timings (data/narration_words.json, built by tools/stitch_narration.py) through T()/TE(); scenes never
// hand-type seconds for a spoken event.
import data from '../data/narration_words.json';

export const FPS = 30;
type Word = {text: string; start: number; end: number};
const D = data as unknown as {duration: number; words: Word[]; script_words: Word[]};
export const WORDS: Word[] = D.script_words;
export const DURATION = D.duration;
export const NARR_END = D.words[D.words.length - 1].end;
const norm = (s: string) => s.replace(/[’“”]/g, (c) => (c === '’' ? "'" : '')).toLowerCase().replace(/[^a-z0-9']/g, '');

const find = (phrase: string, nth: number) => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return [i, i + want.length - 1];
    }
  }
  throw new Error(`phrase not found: "${phrase}" (#${nth})`);
};
/** Start (s) of the nth occurrence of a spoken phrase. */
export const T = (phrase: string, nth = 1) => WORDS[find(phrase, nth)[0]].start;
/** End (s) of the last word of the nth occurrence of a spoken phrase. */
export const TE = (phrase: string, nth = 1) => WORDS[find(phrase, nth)[1]].end;

// ------------------------------------------------------------------------------------------------ easing / ranges
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 as t goes a→b (clamped, linear). */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const smoother = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const u = clamp01(x);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
/** Overshooting ease (a settle with a small bounce). */
export const backOut = (x: number, k = 1.6) => {
  const u = clamp01(x) - 1;
  return 1 + u * u * ((k + 1) * u + k);
};
/** 1 inside [a,b] with ramps of length r on both sides. */
export const win = (t: number, a: number, b: number, rin = 0.25, rout = rin) => Math.min(smooth(seg(t, a - rin, a)), 1 - smooth(seg(t, b, b + rout)));
/** Smooth pulse peaking at t0 with half-width w. */
export const pulse = (t: number, t0: number, w = 0.2) => Math.exp(-((t - t0) * (t - t0)) / (2 * w * w));

// ------------------------------------------------------------------------------------------------ noise
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Smooth 1D value noise in [-1, 1]. */
export const noise = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = rand(i * 7919 + seed * 104729) * 2 - 1, b = rand((i + 1) * 7919 + seed * 104729) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
/** Two-octave drift in [-1, 1], period ~p seconds. */
export const drift = (t: number, seed = 0, p = 3) => 0.7 * noise(t / p, seed) + 0.3 * noise((t / p) * 2.3, seed + 31);

// ------------------------------------------------------------------------------------------------ colour
const hex = (c: string) => {
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), u = clamp01(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join('');
};

// ------------------------------------------------------------------------------------------------ geometry
export type P = [number, number];
/** Closed Catmull-Rom spline through points → SVG path. */
export const closedPath = (pts: P[], tension = 1) => {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: P = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: P = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};
/** Open Catmull-Rom spline. */
export const openPath = (pts: P[], tension = 1) => {
  const n = pts.length;
  if (n < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1: P = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: P = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};
/** Points of an organic blob: radius r, n points, wobble amplitude amp (fraction), animated by time t. */
export const blobPts = (cx: number, cy: number, r: number, seed: number, t = 0, amp = 0.08, n = 14, sx = 1, sy = 1): P[] => {
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + amp * (0.65 * noise(i * 0.9 + t * 0.35, seed) + 0.35 * Math.sin(a * 3 + seed + t * 0.5));
    pts.push([cx + Math.cos(a) * r * k * sx, cy + Math.sin(a) * r * k * sy]);
  }
  return pts;
};
export const blob = (cx: number, cy: number, r: number, seed: number, t = 0, amp = 0.08, n = 14, sx = 1, sy = 1) => closedPath(blobPts(cx, cy, r, seed, t, amp, n, sx, sy));
