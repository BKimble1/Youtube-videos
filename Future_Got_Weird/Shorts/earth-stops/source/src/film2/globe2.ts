import {SPIN} from '../v2/GlobeH';
import {RW0, RW1, RWK, INSET} from '../v2/choreoH';
import {T} from './timeline';

/**
 * The inset globe (cause cue), top right, across the street scenes. f is the V2 film frame.
 *   f 0-2   the planet is still spinning (blurred) when the film opens, f 3: it stops dead on one frame (the clouds keep sliding and slow down)
 *   f 55-79 the rewind (the H1 rewind, T.D frames earlier); then it spins again (the "before": everything moving) until "Stop" (T.stopF), where it stops dead again
 */
export {INSET};
const TH_STOP = -25; // H1: surfaceAngle(5)
const fH = (f: number) => f + T.D;
const thRewind = (f: number) => TH_STOP + SPIN * RWK * (fH(f) - RW0); // f in [RW0 - D, RW1 - D)
const thFwd = (f: number) => TH_STOP + SPIN * RWK * (RW1 - RW0) - SPIN * (fH(f) - RW1);
export const insetSpin = (f: number) => {
  const stopF = T.stopF;
  if (f < T.globeStop) return {th: TH_STOP + SPIN * (T.globeStop - f), thc: TH_STOP + SPIN * (T.globeStop - f), blurS: 9, blurC: 9};
  if (fH(f) < RW0) { const e = 1 - Math.exp(-(f - T.globeStop) / 4); return {th: TH_STOP, thc: TH_STOP - SPIN * 4 * e, blurS: 0, blurC: Math.min(12, SPIN * Math.exp(-(f - T.globeStop) / 4) * 1.19)}; }
  if (fH(f) < RW1) return {th: thRewind(f), thc: thRewind(f), blurS: 7, blurC: 7};
  if (f < stopF) return {th: thFwd(f), thc: thFwd(f), blurS: 8, blurC: 8};
  const e = 1 - Math.exp(-(f - stopF) / 4);
  return {th: thFwd(stopF), thc: thFwd(stopF) - SPIN * 4 * e, blurS: 0, blurC: Math.min(12, SPIN * Math.exp(-(f - stopF) / 4) * 1.19)};
};
