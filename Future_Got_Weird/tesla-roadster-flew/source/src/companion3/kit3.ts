// Companion v3 kit: the companion v2 drawing kit (camera, arrows, colours) with cue lookup on the v3 narration.
import data from '../data/companion3_words.json';

export {World, WSvg, toScreen, camTrack, track, ramp, lerp, clamp, useT, Arrow, ArcArrow, rnd, E, FPS, FLOW, FLOW_LIGHT, FORCE, WEIGHT} from '../companion2/kit';
export type {Cam} from '../companion2/kit';

export const words = data.words as {w: string; s: number; e: number; p: string}[];
export const phrases = data.phrases as [string, number, number][];
const norm = (s: string) => s.replace(/[.,?!…]+$/, '').toLowerCase();

/** Start (or end) time in film seconds of the n-th occurrence of `w` within phrase `p` (or anywhere). */
export const cue = (w: string, p?: string, n = 0, end = false): number => {
  const hits = words.filter((x) => norm(x.w) === norm(w) && (!p || x.p === p));
  if (!hits[n]) throw new Error(`cue not found: ${w} ${p ?? ''} ${n}`);
  return end ? hits[n].e : hits[n].s;
};
export const phrase = (p: string) => {
  const ws = words.filter((x) => x.p === p);
  return {s: ws[0].s, e: ws[ws.length - 1].e};
};

/** 0 while a narration word is spoken (with a margin), rising to 1 in pauses: for ducking event sound. */
export const speechFree = (t: number, margin = 0.12, fade = 0.18) => {
  let d = Infinity;
  for (const w of words) {
    if (t >= w.s - margin && t <= w.e + margin) return 0;
    d = Math.min(d, Math.abs(t - (w.s - margin)), Math.abs(t - (w.e + margin)));
    if (w.s > t + 2) break;
  }
  return Math.min(1, d / fade);
};

/** Damped settle: 0 at t0, a single soft overshoot, then rest (for suspension and landings; never rubbery). */
export const settle = (t: number, t0: number, amp = 1, dur = 0.55) => {
  if (t < t0) return 0;
  const u = (t - t0) / dur;
  if (u >= 1.6) return 0;
  return amp * Math.exp(-3.2 * u) * Math.sin(Math.PI * Math.min(u, 1.6) * 1.15);
};

/** Event sound for a shot starting at film time s0: ducked under every word, full in the pauses. */
export const ev = (base: number, s0: number) => (ts: number) => base * (0.1 + 0.9 * speechFree(s0 + ts));
