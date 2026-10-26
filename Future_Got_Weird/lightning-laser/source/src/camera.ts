// Camera keys for the shots: position eases per segment, zoom interpolates in log space (an even sense of speed).
import {clamp} from './dc/math';
import {Cam} from './dc/camera';

type Ease = (x: number) => number;
export const sm5: Ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
export const inOut: Ease = (x) => x * x * (3 - 2 * x);
export const outC: Ease = (x) => 1 - (1 - x) ** 3;
export const inC: Ease = (x) => x * x * x;
export type CamKey = [number, number, number, number, Ease?]; // frame, x, y, z, ease into this key
export const camAt = (f: number, keys: CamKey[]): Cam => {
  if (f <= keys[0][0]) return {x: keys[0][1], y: keys[0][2], z: keys[0][3]};
  for (let i = 1; i < keys.length; i++) {
    const [f1, x1, y1, z1, e] = keys[i];
    if (f <= f1) {
      const [f0, x0, y0, z0] = keys[i - 1];
      const u = (e ?? sm5)(clamp((f - f0) / (f1 - f0)));
      return {x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, z: Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * u)};
    }
  }
  const l = keys[keys.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};
/** contour scale for a zoom: lines thin as the camera closes in, so a close-up keeps a cartoon line */
export const kOf = (z: number) => 1 / Math.sqrt(Math.max(0.4, z));

/** a zoom between two framings that keeps the motion even on screen: the centre moves in proportion to 1/z, so a
 *  deep zoom out leaves its start point steady while it is still close and travels once the view is wide */
export const camZoom = (f: number, f0: number, f1: number, p0: {x: number; y: number}, z0: number, p1: {x: number; y: number}, z1: number, ease: Ease = sm5): Cam => {
  const u = ease(clamp((f - f0) / (f1 - f0)));
  const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * u);
  const w = Math.abs(z0 / z1 - 1) < 1e-9 ? u : (z0 / z - 1) / (z0 / z1 - 1);
  return {x: p0.x + (p1.x - p0.x) * w, y: p0.y + (p1.y - p0.y) * w, z};
};
