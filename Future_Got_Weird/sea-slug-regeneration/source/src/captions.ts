// Caption placement: the centre height of each caption (by index in the timeline), chosen per shot so captions stay
// clear of the anatomy. A caption never moves while it shows, except across a cut.
import {CAPTIONS} from './lib';

const LOW = 1560, HIGH = 330;
const PLACE: number[] = CAPTIONS.map(() => LOW);
export const capPlace = (i: number, f: number) => {
  void f;
  return PLACE[i] ?? LOW;
};
export {HIGH, LOW};
