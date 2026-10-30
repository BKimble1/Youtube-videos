// HOOK 05: the defensive discharge. Each pulse leaves the abdominal tip as a packet of hot, pale yellowish-white droplets
// (a fine mist) and vapour; the packets decelerate in air and the vapour drifts and rises as a quinone haze. No fire:
// the palette stays within white, cream and pale quinone yellow, and the jet is a beaded mist, not a flame tongue.
import React from 'react';
import {add3, Basis, cross3, mul3, norm3, proj, V3} from '../shared/three';
import {hash} from '../shared/lib';
import {Item} from './core/draw3';
import {beetleRig, SPRAY_PULSES} from './scene';

const f2 = (n: number) => n.toFixed(2);
type Emit = {N: V3; D: V3; p1: V3; p2: V3};
const cache = new Map<number, Emit>();
const emitAt = (t: number): Emit => {
  const key = Math.round(t * 1000);
  const c = cache.get(key);
  if (c) return c;
  const R = beetleRig(t);
  const D = R.tipDirW;
  let p1 = cross3(D, [0, 0, 1]);
  if (Math.hypot(...p1) < 1e-4) p1 = [1, 0, 0];
  p1 = norm3(p1);
  const p2 = cross3(p1, D);
  const e = {N: R.tipEnd, D, p1, p2};
  cache.set(key, e);
  return e;
};
const gauss = (a: number, b: number) => Math.sqrt(-2 * Math.log(Math.max(1e-6, a))) * Math.cos(2 * Math.PI * b);

export const SprayDefs: React.FC<{ns: string}> = ({ns}) => (
  <defs>
    <radialGradient id={`${ns}drop`}>
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.45" stopColor="#FFF8DC" />
      <stop offset="0.8" stopColor="#F6E59A" stopOpacity="0.9" />
      <stop offset="1" stopColor="#E9D27A" stopOpacity="0" />
    </radialGradient>
    <radialGradient id={`${ns}vap`}>
      <stop offset="0" stopColor="#FFFDF2" stopOpacity="0.75" />
      <stop offset="0.5" stopColor="#FBF3D2" stopOpacity="0.4" />
      <stop offset="1" stopColor="#F2E6B0" stopOpacity="0" />
    </radialGradient>
    <radialGradient id={`${ns}core`}>
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
      <stop offset="0.6" stopColor="#FFF9E2" stopOpacity="0.6" />
      <stop offset="1" stopColor="#FFF3C6" stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** spray items (droplets, vapour, the jet core) at time t, depth-sorted with the animals */
export const sprayItems = (B: Basis, t: number, ns: string, gain = 1): Item[] => {
  const items: Item[] = [];
  for (const P of SPRAY_PULSES) {
    const a0 = t - P.t;
    if (a0 < 0 || a0 > 2.0) continue;
    const E = emitAt(P.t);
    const big = P.burst > 0;
    const nDrop = big ? 13 : 11;
    const v0 = big ? 105 : 80;
    const tau = 0.075;
    // the jet core: a short bright packet right at the opening, for the first frames of the pulse
    if (a0 < 0.07) {
      const L = Math.min(1, a0 / 0.03);
      const len = (big ? 2.4 : 1.6) * L;
      const c = add3(E.N, mul3(E.D, len * 0.5));
      const A = proj(B, E.N), Bq = proj(B, add3(E.N, mul3(E.D, len)));
      const C = proj(B, c);
      const ang = (Math.atan2(Bq.y - A.y, Bq.x - A.x) * 180) / Math.PI;
      const rx = Math.max(2, Math.hypot(Bq.x - A.x, Bq.y - A.y) * 0.55);
      const ry = 0.32 * C.s * (big ? 1 : 0.8);
      items.push({z: C.z - 0.3, el: <ellipse key={`c${P.k}`} cx={f2(C.x)} cy={f2(C.y)} rx={f2(rx)} ry={f2(ry)} transform={`rotate(${f2(ang)} ${f2(C.x)} ${f2(C.y)})`} fill={`url(#${ns}core)`} opacity={f2(gain * (1 - a0 / 0.07) * 0.95)} />});
    }
    // droplets
    for (let j = 0; j < nDrop; j++) {
      const h = (n: number) => hash(P.k * 31.7 + j * 7.13 + n * 1.91);
      const a = a0 - j * 0.003;
      const life = 0.32 + 0.22 * h(1);
      if (a < 0 || a > life) continue;
      const v = v0 * (0.75 + 0.5 * h(2));
      const dist = v * tau * (1 - Math.exp(-a / tau));
      const sp = big ? 0.085 : 0.07;
      const g1 = gauss(h(3), h(4)) * sp, g2 = gauss(h(5), h(6)) * sp;
      const spread = dist * (1 + 2.5 * a);
      let p = add3(E.N, mul3(E.D, dist));
      p = add3(p, add3(mul3(E.p1, spread * g1), mul3(E.p2, spread * g2)));
      p = add3(p, [0, 0, 0.9 * a * a + 0.3 * a]);
      const Q = proj(B, p);
      if (Q.z < 2) continue;
      const r = (0.055 + 0.06 * h(7)) * (1 - 0.5 * a / life) * Q.s;
      const o = Math.pow(1 - a / life, 1.2);
      items.push({z: Q.z, el: <circle key={`d${P.k}_${j}`} cx={f2(Q.x)} cy={f2(Q.y)} r={f2(Math.max(0.8, r * 1.7))} fill={`url(#${ns}drop)`} opacity={f2(gain * o)} />});
    }
    // vapour: rises, spreads and lingers as a haze
    const nVap = big ? 5 : 3;
    for (let j = 0; j < nVap; j++) {
      const h = (n: number) => hash(P.k * 13.3 + j * 3.77 + n * 2.71 + 50);
      const a = a0 - 0.01 * j;
      const life = (big ? 1.8 : 0.8) + 0.4 * h(1);
      if (a < 0 || a > life) continue;
      const tv = 0.13;
      const reach = (big ? 5.8 : 3.4) * (0.15 + 0.85 * ((j + h(2)) / nVap));
      const dist = reach * (1 - Math.exp(-a / tv));
      let p = add3(E.N, mul3(E.D, dist));
      p = add3(p, add3(mul3(E.p1, (h(3) - 0.5) * 1.6 * a), mul3(E.p2, (h(4) - 0.5) * 1.2 * a)));
      p = add3(p, [0.5 * a, 0.3 * a, 1.6 * a]);
      const Q = proj(B, p);
      if (Q.z < 2) continue;
      const r = (0.22 + 1.05 * Math.pow(a, 0.6)) * Q.s * (big ? 1 : 0.75);
      const o = (big ? 0.17 : 0.26) * Math.min(1, a / 0.04) * Math.pow(1 - a / life, 1.4);
      items.push({z: Q.z + 0.5, el: <circle key={`v${P.k}_${j}`} cx={f2(Q.x)} cy={f2(Q.y)} r={f2(r)} fill={`url(#${ns}vap)`} opacity={f2(gain * o)} />});
    }
  }
  return items;
};
