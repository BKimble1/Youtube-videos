// HOOK 02 camera: the insect and its suit are drawn through the canonical orthographic view (rig/ortho.ts) so the rig
// reads exactly as in Cyborg Cockroach V5; the flooded tunnel around it is drawn through a matching pinhole camera that
// shares the same axes, scale and target (a world point at the target's depth lands exactly where the ortho view puts
// it), so the floor under the feet agrees with the insect while near rubble and the far wall get real parallax.
import {V2, V3, dot, sub} from './rig/v3';
import {View, viewAt} from './rig/ortho';

export type Cam = {v: View; T: V3; C: V2; D0: number; s: number};

export const makeCam = (az: number, el: number, s: number, T: V3, cx: number, cy: number): Cam => {
  const v = viewAt(az, el, s, T, cx, cy);
  return {v, T, C: [cx, cy], D0: 2600 / s, s};
};
/** depth toward the viewer relative to the target (mm) */
export const depth = (c: Cam, p: V3) => dot(sub(p, c.T), c.v.F);
/** perspective scale factor at a point (1 at the target's depth); Infinity behind the near plane */
export const kAt = (c: Cam, p: V3) => {
  const d = depth(c, p);
  return d >= c.D0 * 0.92 ? Infinity : c.D0 / (c.D0 - d);
};
/** project a world point through the perspective camera */
export const Q = (c: Cam, p: V3): V2 => {
  const d = sub(p, c.T);
  const k = c.D0 / Math.max(c.D0 * 0.08, c.D0 - dot(d, c.v.F));
  return [c.C[0] + c.s * dot(d, c.v.R) * k, c.C[1] - c.s * dot(d, c.v.U) * k];
};
