// Caption placement. A caption never moves while it shows. For each caption, the protected region of the action (the
// board, the rider and his face, from each shot's focus box) is sampled at seven times across the caption's display,
// and the caption takes the first slot that stays clear of all of them: the lower third first, then the upper band.
// Slots sit inside the Shorts safe area (top 260 px and bottom 380 px clear of the interface).
import {CAPS} from './time';
import {shotAt} from './shots';

export const SLOTS = [1450, 1300, 400, 540, 1150];
const HALF = 88; // two lines of 70 px Nunito
const memo = new Map<number, number>();
const clearOf = (y: number, ts: number[]) => {
  let worst = 0;
  for (const t of ts) {
    const b = shotAt(t).focus?.(t);
    if (!b) continue;
    const ov = Math.max(0, Math.min(y + HALF, b.y1) - Math.max(y - HALF, b.y0)) * Math.max(0, Math.min(990, b.x1) - Math.max(90, b.x0));
    worst = Math.max(worst, ov);
  }
  return worst;
};
type Focus = (t: number) => {focus?: (t: number) => {x0: number; y0: number; x1: number; y1: number} | null};
/** V2: a placer for any shot list */
export const makePlacer = (shot: Focus) => {
  const m = new Map<number, number>();
  const clear = (y: number, ts: number[]) => {
    let worst = 0;
    for (const t of ts) {
      const b = shot(t).focus?.(t);
      if (!b) continue;
      const ov = Math.max(0, Math.min(y + HALF, b.y1) - Math.max(y - HALF, b.y0)) * Math.max(0, Math.min(990, b.x1) - Math.max(90, b.x0));
      worst = Math.max(worst, ov);
    }
    return worst;
  };
  const placeFor = (show: number, hide: number) => {
    const ts = Array.from({length: 7}, (_, i) => show + ((hide - show) * i) / 6);
    let best = SLOTS[0], bestOv = Infinity;
    for (const y of SLOTS) {
      const ov = clear(y, ts);
      if (ov === 0) return y;
      if (ov < bestOv) [best, bestOv] = [y, ov];
    }
    return best;
  };
  const capY = (i: number) => {
    if (!m.has(i)) m.set(i, placeFor(CAPS[i].show, CAPS[i].hide));
    return m.get(i)!;
  };
  return {placeFor, capY};
};
export const placeFor = (show: number, hide: number) => {
  const ts = Array.from({length: 7}, (_, i) => show + ((hide - show) * i) / 6);
  let best = SLOTS[0], bestOv = Infinity;
  for (const y of SLOTS) {
    const ov = clearOf(y, ts);
    if (ov === 0) return y;
    if (ov < bestOv) [best, bestOv] = [y, ov];
  }
  return best;
};
export const capY = (i: number): number => {
  if (!memo.has(i)) memo.set(i, placeFor(CAPS[i].show, CAPS[i].hide));
  return memo.get(i)!;
};
