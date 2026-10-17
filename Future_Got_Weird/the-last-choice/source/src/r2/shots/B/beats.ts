// Section B beats (film seconds): the Director's performance keys and the army's march clock. Pure constants — shared by
// director.ts, army.ts and cues.ts (the mixer bundle), so picture and sound use the same numbers.
import {M} from '../../timing';

/** The Director's keys (see director.ts). */
export const TB = {
  // B1: the hand comes out from under the slab and braces
  slideOut: 9.95, lift: 10.5, slap: 10.9, press: 11.55, strain: 11.9,
  // B2: the rise
  pull: 12.45, pullEnd: 13.05, push: 13.1, chestUp: 13.55, slabLand: 13.95,
  knee: 14.0, kneel: 14.6, rebar: 14.78, weight: 15.3, rise: 15.55, step: 16.0, release: 16.25, stood: 16.5,
  // B3: two steps down to the brink
  step1: 17.15, step1End: 17.62, step2: 17.7, step2End: 18.2, settle: 18.35,
  // B5: the strap
  look: 27.55, raise: 27.85, bite: 28.25, tug: 28.5, tugEnd: 28.72, letGo: 29.1, ready: 29.6,
};

/** The army's lockstep: H1 and H2 are consecutive footfalls of every machine. */
export const CADENCE = M.H2 - M.H1;
/** footfall k of the march (k = 0 at H1) */
export const beat = (k: number) => M.H1 + k * CADENCE;
/**
 * The halts (deceleration starts on a footfall and lasts two beats, so the last step plants exactly two beats later):
 * the vanguard starts to stop on H4 (still by 31.06), the main body plants its last step on H5a, the rear on H5b.
 */
export const HALT = {van: beat(28), main: beat(30), rear: beat(31)};
export const STOP = {van: beat(30), main: beat(32), rear: beat(33)};
