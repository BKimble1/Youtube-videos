// Fixed props of the V2 lab (world cm), each with a signed-distance function for the clearance audit.
import {V3} from '../lib';
import {PATH_CENTROID} from './robot';
export type Prop = {name: string; sdf: (p: V3) => number};
/** a glass beaker standing outside the walked loop (parallax in the reveal) */
export const BEAKER = {c: [PATH_CENTROID[0] + 27, 0, PATH_CENTROID[2] - 19] as V3, r: 3.3, h: 8.5};
const cyl = (c: V3, r: number, h: number) => (p: V3) => {
  const dr = Math.hypot(p[0] - c[0], p[2] - c[2]) - r, dy = Math.max(-p[1], p[1] - h);
  return Math.max(dr, dy) > 0 ? Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) : Math.max(dr, dy);
};
// V2: no props on the mat (the beaker was removed: the camera's moves pass too close to every useful spot for it)
export const PROPS: Prop[] = [];
void cyl;
