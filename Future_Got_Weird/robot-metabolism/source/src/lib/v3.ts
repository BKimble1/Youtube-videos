// 3D vectors (world units: metres; y up).
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});
export const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return mul(a, 1 / l);
};
export const lerp = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));
export const dist = (a: V3, b: V3) => len(sub(a, b));
/** rotate p about the axis through o with unit direction k by angle a (rad) (Rodrigues) */
export const rotAxis = (p: V3, o: V3, k: V3, a: number): V3 => {
  const v = sub(p, o);
  const c = Math.cos(a), s = Math.sin(a);
  const r = add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
  return add(o, r);
};
export const rotY = (p: V3, a: number): V3 => ({x: p.x * Math.cos(a) + p.z * Math.sin(a), y: p.y, z: -p.x * Math.sin(a) + p.z * Math.cos(a)});
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** smoothstep on [a, b] */
export const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** smootherstep (zero velocity and acceleration at both ends) */
export const ss5 = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** ease-in (accelerating) on [a, b]: magnetic closing of the last centimetres */
export const easeIn = (a: number, b: number, x: number, p = 2.4) => Math.pow(clamp((x - a) / (b - a)), p);
/** distance from point p to segment ab */
export const segDist = (p: V3, a: V3, b: V3) => {
  const ab = sub(b, a);
  const t = clamp(dot(sub(p, a), ab) / (dot(ab, ab) || 1));
  return dist(p, add(a, mul(ab, t)));
};
/** closest distance between segments p1q1 and p2q2 */
export const segSegDist = (p1: V3, q1: V3, p2: V3, q2: V3) => {
  let best = Infinity;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    best = Math.min(best, segDist(lerp(p1, q1, t), p2, q2), segDist(lerp(p2, q2, t), p1, q1));
  }
  return best;
};
