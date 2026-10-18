// Section B beats (film seconds): the Director's performance keys, the cuts, the army's march clock and the sentry
// drone. Pure constants — shared by director.ts, army.ts, cams.ts and cues.ts (the mixer bundle), so picture and sound
// use the same numbers.
import {M} from '../../timing';

/** The Director's keys (see director.ts). */
export const TB = {
  // B1: the hand comes out from under the slab, slaps down, presses, claws and slips back an inch
  slideOut: 9.95, lift: 10.5, slap: 10.9, press: 11.55, strain: 11.9, slip: 12.12,
  // B2: the rise — drag, chest up, a knee under him, kneel, the bar, weight forward, the right foot under him, the
  // drive up, a half step to catch himself, let go
  pull: 12.45, pullEnd: 13.05, push: 13.1, chestUp: 13.55, slabLand: 13.95,
  knee: 14.0, kneel: 14.6, rebar: 14.78, weight: 15.1, step: 15.45, rise: 15.5, up: 15.95,
  stagger: 16.02, staggerEnd: 16.26, release: 16.25, stood: 16.5,
  // B3: two steps down to the brink
  step1: 17.15, step1End: 17.62, step2: 17.7, step2End: 18.2, settle: 18.35,
  // B5a: the heavy has turned its head to him — he knows it has picked him out (the breath catches), then he sets
  see: 24.62, set: 25.45,
  // B5b: the strap
  look: 27.25, raise: 27.55, bite: 27.95, tug: 28.2, tugEnd: 28.42, letGo: 28.8, ready: 29.3,
  // B6b: the sentry comes at him: the plate comes up and he leans into it (he stays); down again as it backs off
  guard: 33.7, guardUp: 34.02, guardDown: 35.08, guardLow: 35.62,
};

/** The cuts (film seconds). */
export const CUT = {
  b1: M.SOLO, b2: 12.4, b3: M.ORCH, b4: 21.4, b5a: 24.4, b5b: 26.3, b6a: M.H4, b6b: 32.9, end: M.BASS_OUT,
};

/** The army's lockstep: H1 and H2 are consecutive footfalls of every machine. */
export const CADENCE = M.H2 - M.H1;
/** footfall k of the march (k = 0 at H1) */
export const beat = (k: number) => M.H1 + k * CADENCE;
/**
 * The halts (deceleration starts on a footfall and lasts two beats, so the last step plants exactly two beats later):
 * the vanguard starts to stop on H4 (the cut to B6a: it takes two slowing steps and plants at 31.06, feet together, on
 * the count), the main body plants its last step on H5a, the rear on H5b.
 */
export const HALT = {van: beat(28), main: beat(30), rear: beat(31)};
export const STOP = {van: beat(30), main: beat(32), rear: beat(33)};

/**
 * The sentry (B6a/B6b): one drone of the screen over the vanguard (army.ts SENTRY_B) leaves its place as the vanguard
 * plants, darts across the crater at him, brakes and holds ~12 m in front of his face, marks him (an amber beam), its
 * gimbal flicks past him to the ruin behind him, and it backs away to its place in the screen (home before the Crew
 * arrive; it is drawn by armyB in C too).
 */
export const SENTRY_T = {go: 31.12, lock: 31.3, arrive: 34.1, mark0: 34.16, mark1: 34.92, past: 34.84, back: 35.02, home: 38.6};
