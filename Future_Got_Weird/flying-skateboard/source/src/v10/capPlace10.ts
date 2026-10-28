// Caption placement. A caption never moves while it shows. For each caption, the protected region of the action (the
// board, the rider and his face, from each shot's focus box) is sampled at seven times across the caption's display,
// and the caption takes the first slot that stays clear of all of them: the lower third first, then the upper band.
// Slots sit inside the Shorts safe area (top 260 px and bottom 380 px clear of the interface).
import {CAPS} from './time10';
import {shotAt} from '../story/shots';

// (V5: 1000 is a last resort, between a high rider and the water his air reaches)
export const SLOTS = [1450, 1300, 400, 540, 1150, 1000];
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
type Bx = {x0: number; y0: number; x1: number; y1: number};
type Focus = (t: number) => {focus?: (t: number) => Bx | Bx[] | null};
/** V2: a placer for any shot list */
export const makePlacer = (shot: Focus) => {
  const m = new Map<number, number>();
  const clear = (y: number, ts: number[]) => {
    let worst = 0;
    for (const t of ts) {
      const fb = shot(t).focus?.(t);
      if (!fb) continue;
      // V5: a shot may protect several regions (e.g. the rider and the patch of water his air reaches)
      let ov = 0;
      for (const b of Array.isArray(fb) ? fb : [fb]) ov += Math.max(0, Math.min(y + HALF, b.y1) - Math.max(y - HALF, b.y0)) * Math.max(0, Math.min(990, b.x1) - Math.max(90, b.x0));
      worst = Math.max(worst, ov);
    }
    return worst;
  };
  // (V5: sampled inside the caption's time on screen; captions now change on a nearby cut, so the first instant of the
  // nominal span can belong to the previous shot)
  const span = (show: number, hide: number) => {
    const a = hide - show > 0.3 ? show + 0.1 : show, b = hide - show > 0.3 ? hide - 0.05 : hide;
    return Array.from({length: 7}, (_, i) => a + ((b - a) * i) / 6);
  };
  const placeFor = (show: number, hide: number) => {
    const ts = span(show, hide);
    let best = SLOTS[0], bestOv = Infinity;
    for (const y of SLOTS) {
      const ov = clear(y, ts);
      if (ov === 0) return y;
      if (ov < bestOv) [best, bestOv] = [y, ov];
    }
    return best;
  };
  const capY = (i: number): number => {
    if (!m.has(i)) {
      // V5: keep the previous caption's place when it is clear for this one too (fewer jumps between captions)
      const ts = span(CAPS[i].show, CAPS[i].hide);
      const prev = i > 0 && CAPS[i].show - CAPS[i - 1].hide < 0.3 ? capY(i - 1) : null;
      m.set(i, prev !== null && clear(prev, ts) === 0 ? prev : placeFor(CAPS[i].show, CAPS[i].hide));
    }
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
