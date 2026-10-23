// V4 world layout (metres). The corridor runs along +Z; she flees toward +Z, the guard chases from -Z.
// The chase is one speed profile in "chase time" tau, which runs from the bolt at the end of the film
// (tau = 28.3 s - DUR, negative) through frame 0 to her stop at the hiding spot. Her bolt starts exactly two corridor
// modules behind the hiding spot (in the unwrapped coordinates of the opening), so the module length is set to half
// the distance she covers: that is what makes the last frame continue into the first.
import tl from '../data/timeline.json';

export const DUR = tl.duration;
export const BOLT = 28.3; // she bolts (film time)
export const TAU0 = BOLT - DUR; // chase time at the bolt (negative)
export const RUN = {v: 3.0, acc0: TAU0 + 0.12, acc1: TAU0 + 0.55, brake0: 1.3, brake1: 1.8};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** her speed along +Z in chase time */
export const herSpeed = (tau: number) => {
  if (tau < RUN.acc0) return 0;
  if (tau < RUN.acc1) return RUN.v * sm((tau - RUN.acc0) / (RUN.acc1 - RUN.acc0));
  if (tau < RUN.brake0) return RUN.v;
  if (tau < RUN.brake1) return RUN.v * (1 - sm((tau - RUN.brake0) / (RUN.brake1 - RUN.brake0)));
  return 0;
};
/** distance covered since the bolt (exact integral of herSpeed; smoothstep integrates to half its span) */
export const herDist = (tau: number) => {
  const v = RUN.v;
  const I = (a: number, b: number, x: number) => {
    // integral of smoothstep((s-a)/(b-a)) from a to x
    const L = b - a, u = Math.max(0, Math.min(1, (x - a) / L));
    return L * (u * u * u - u * u * u * u / 2);
  };
  let d = 0;
  d += v * I(RUN.acc0, RUN.acc1, Math.min(tau, RUN.acc1));
  if (tau > RUN.acc1) d += v * (Math.min(tau, RUN.brake0) - RUN.acc1);
  if (tau > RUN.brake0) {
    const x = Math.min(tau, RUN.brake1);
    d += v * (x - RUN.brake0) - v * I(RUN.brake0, RUN.brake1, x);
  }
  return d;
};
export const RUN_D = herDist(99);
export const LAY = {
  halfW: 1.3,
  height: 2.7,
  mod: RUN_D / 2,
  z0: 0,
  zp: 10.0, // her pelvis at the hiding spot (she faces -Z there)
  xp: 0.12,
  shieldGap: 0.34, // panel plane this far in front of her pelvis
  gx: -0.08, // the guard's lane
  endZ: 18.6,
};
