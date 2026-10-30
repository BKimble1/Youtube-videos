// A 2D camera over a scene drawn in millimetres: the scene point (x, y) lands at the frame centre, z px per mm.
import {W, H} from './lib';

export type Cam = {x: number; y: number; z: number; rot?: number};
export const camT = (c: Cam) => `translate(${W / 2},${H / 2}) rotate(${c.rot ?? 0}) scale(${c.z}) translate(${-c.x},${-c.y})`;
/** scene -> screen */
export const toScreen = (c: Cam, x: number, y: number) => {
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z;
  return [W / 2 + dx * Math.cos(r) - dy * Math.sin(r), H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
};
/** geometric (log-space) zoom interpolation, so a push-in feels uniform */
export const lerpZ = (a: number, b: number, u: number) => a * Math.pow(b / a, u);
/** interpolate a camera so that the screen-space motion stays smooth through a large zoom change: the centre moves
 *  in proportion to log zoom */
export const lerpCam = (a: Cam, b: Cam, u: number): Cam => {
  const z = lerpZ(a.z, b.z, u);
  const k = Math.abs(Math.log(b.z / a.z)) < 1e-6 ? u : (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * u};
};
