// One camera model for the film (from the Zombie Ant / Dead Spider camera): keyed orbits whose targets can follow moving
// things; each key blends in over its own C2 window, so a move never stops dead between keys and never jumps.
// f is fixed (a macro lens); framing is set by the orbit distance (px/mm at the target = F / d).
import {Cam3, lerp3, orbitCam, Orbit, V3} from './core/three';
import {ss5} from './lib';

export const F = 2600;
export type Key = {a: number; b: number; o: (t: number) => Orbit};
/** an orbit framed at s px/mm on its target */
export const at = (target: V3, az: number, el: number, s: number, cy = 960, roll = 0, cx = 540): Orbit => ({target, az, el, d: F / s, f: F, cx, cy, roll});
export const lerpO = (a: Orbit, b: Orbit, t: number): Orbit => ({
  target: lerp3(a.target, b.target, t),
  az: a.az + (b.az - a.az) * t,
  el: a.el + (b.el - a.el) * t,
  d: a.d * Math.pow(b.d / a.d, t),
  f: a.f,
  cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * t,
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});
export const chain = (t: number, first: (t: number) => Orbit, keys: Key[]): Orbit => {
  let o = first(t);
  for (const k of keys) {
    if (t <= k.a) break;
    o = lerpO(o, k.o(t), ss5(t, k.a, k.b));
  }
  return o;
};
export const cam = (o: Orbit): Cam3 => orbitCam(o);
