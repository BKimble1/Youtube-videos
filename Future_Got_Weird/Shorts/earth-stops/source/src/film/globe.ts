import {SPIN, surfaceAngle} from '../v2/GlobeH';
import {INSET, RW0, RW1, RWK} from '../v2/choreoH';
import {T} from './timeline';

/**
 * The globe across the film. In the hook it is driven by H1 (stops dead at f5, rewinds, spins again). From the iris (f 176) this module continues the SAME
 * surface angle: the spin eases from the hook's 9 deg/frame down to a readable CRUISE, the surface carries the B02 icons, and at "Stop" (f 312) it halts on one frame
 * exactly as in the hook while its clouds keep drifting and slow down (the loose layer).
 */
export const CRUISE = 3; // deg per frame in B02/B03 before the stop
const TAU_C = 4;
const thHook = (f: number) => (f < RW0 ? surfaceAngle(f) : f < RW1 ? surfaceAngle(RW0) + SPIN * RWK * (f - RW0) : surfaceAngle(RW0) + SPIN * RWK * (RW1 - RW0) - SPIN * (f - RW1));
export const speedAt = (f: number) => (f < T.irisA ? SPIN : f < T.stopF ? CRUISE + (SPIN - CRUISE) * Math.exp(-(f - T.irisA) / 6) : 0);
const tab: number[] = (() => {
  const a = [thHook(T.irisA)];
  for (let f = T.irisA; f < 1100; f++) a.push(a[a.length - 1] - speedAt(f + 0.5));
  return a;
})();
export const filmTh = (f: number) => {
  if (f <= T.irisA) return thHook(f);
  const i = Math.floor(f - T.irisA), fr = f - T.irisA - i;
  return tab[Math.min(i, tab.length - 2)] * (1 - fr) + tab[Math.min(i + 1, tab.length - 1)] * fr;
};
export const filmThc = (f: number) => (f <= T.stopF ? filmTh(f) : filmTh(T.stopF) - CRUISE * TAU_C * (1 - Math.exp(-(f - T.stopF) / TAU_C)));
export const cloudSpeedAt = (f: number) => (f < T.stopF ? speedAt(f) : CRUISE * Math.exp(-(f - T.stopF) / TAU_C));
export const spinFor = (f: number) => ({th: filmTh(f), thc: filmThc(f), blurS: Math.min(9, speedAt(f)), blurC: f < T.stopF ? Math.min(9, speedAt(f)) : Math.min(12, cloudSpeedAt(f) * 1.19)});

export const BIG = {cx: 540, cy: 980, R: 340};
export {INSET};
