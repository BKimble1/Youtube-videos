// Lofted shells (copied from the Cyborg Cockroach episode's lib/loft.ts, trimmed to what the flat rig needs): a
// superelliptic cross-section swept along local x with profile functions.
import {V3} from './v3';

export type LoftDef = {
  x0: number; // rear end (local x)
  x1: number; // front end
  w: (u: number) => number; // half width at u = (x - x0)/(x1 - x0)
  ht: (u: number) => number; // dome height above the margin
  hb: (u: number) => number; // depth below the margin
  yc: (u: number) => number; // margin height
  n?: number; // horizontal exponent of the section (2 = ellipse, larger = boxier)
};

const spow = (c: number, e: number) => Math.sign(c) * Math.pow(Math.abs(c), e);

/** local point at (u, theta): theta = 0 is the right margin (z+), pi/2 the top, pi the left margin, 3pi/2 underneath */
export const loftLocal = (d: LoftDef, u: number, th: number): V3 => {
  const x = d.x0 + (d.x1 - d.x0) * u;
  const n = d.n ?? 2.2;
  const c = Math.cos(th), s = Math.sin(th);
  const z = d.w(u) * spow(c, 2 / n);
  const y = d.yc(u) + (s >= 0 ? d.ht(u) : d.hb(u)) * spow(s, 1);
  return [x, y, z];
};
