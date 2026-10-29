// Caption placement: the centre height of each caption (by index in the timeline), chosen per shot so captions stay
// clear of the anatomy. A caption never moves while it shows, except across a cut.
import {CAPTIONS} from './lib';

const LOW = 1560, HIGH = 330;
const PLACE: number[] = CAPTIONS.map(() => LOW);
// V2 per-caption placements (index -> centre y); read by capPlace2
export const PLACE2: Record<number, number> = {3: HIGH, 4: HIGH};
export const capPlace = (i: number, f: number) => {
  void f;
  return PLACE[i] ?? LOW;
};
export const capPlace2 = (i: number) => PLACE2[i] ?? LOW;
// V3 per-caption placements (index -> centre y)
export const PLACE3: Record<number, number> = {};
export const capPlace3 = (i: number) => PLACE3[i] ?? LOW;
// V4 per-caption placements (index -> centre y)
export const PLACE4: Record<number, number> = {};
export const capPlace4 = (i: number) => PLACE4[i] ?? LOW;
// V5 per-caption placements (index -> centre y)
export const PLACE5: Record<number, number> = {};
export const capPlace5 = (i: number) => PLACE5[i] ?? LOW;
export {HIGH, LOW};
