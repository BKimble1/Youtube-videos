// V3 beat G: the night storm round the house: the V3 sky gradient, cloud deck and ridges (Scene3_sky.tsx, the same
// weather as the other beats), a distant strike far beyond the ridges with its glow, the far flicker lighting the
// cloud deck on the right at the end, and the rain (V3's 3D rain, split into the drops behind the house and the drops
// in front of it).
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {Cam3, projector, Proj, v3, V3} from '../v2/p3';
import {Clouds, LOOP, Ranges, SkyGrad} from './Scene3_sky';
import {HOUSE} from './Rod3_cam';

// ------------------------------------------------------------------ the distant strike
/** far beyond the ridges, to the right of the house (about 7 km out): its foot is hidden by the hills */
const AZ = 21 * (Math.PI / 180);
const DIST = 6800;
const BASE = v3(HOUSE.x + DIST * Math.sin(AZ), HOUSE.y - 40, HOUSE.z + DIST * Math.cos(AZ));
const TOPH = 1900;
/** the channel: a jagged path from the cloud base down to the ground, plus two short branches (world, metres) */
const FAR: V3[] = (() => {
  const n = 18;
  const pts: V3[] = [];
  let x = 0, z = 0;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    if (i > 0) {
      x += (hash(i, 611) - 0.5) * 150 + 40 * Math.sin(i * 1.7);
      z += (hash(i, 613) - 0.5) * 60;
    }
    pts.push(v3(BASE.x + x * Math.cos(AZ), BASE.y + TOPH * (1 - k), BASE.z - x * Math.sin(AZ) + z));
  }
  return pts;
})();
const BRANCH = (i0: number, dir: number, n: number, seed: number): V3[] => {
  const p0 = FAR[i0];
  const out: V3[] = [p0];
  let x = 0, y = 0;
  for (let i = 1; i <= n; i++) {
    x += dir * (60 + 50 * hash(i, seed));
    y -= 70 + 40 * hash(i, seed + 1);
    out.push(v3(p0.x + x * Math.cos(AZ), p0.y + y, p0.z - x * Math.sin(AZ)));
  }
  return out;
};
const FAR_BR = [BRANCH(4, 1, 4, 621), BRANCH(8, -1, 3, 631)];
export const FAR_GLOW_AT = v3(BASE.x, BASE.y + TOPH * 0.55, BASE.z);
/** the faint far flicker (28.25): inside the storm to the right, nearer than the strike, so from the settled close-up
 *  on the rod its light reaches the cloud deck in the upper right of the frame */
const FLICK_AZ = 14 * (Math.PI / 180);
export const FLICK_AT = v3(HOUSE.x + 4200 * Math.sin(FLICK_AZ), HOUSE.y + 950, HOUSE.z + 4200 * Math.cos(FLICK_AZ));

const path = (P: (p: V3) => Proj, pts: V3[]) => {
  const q = pts.map(P);
  if (q.some((p) => !p.ok)) return '';
  return q.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
};
/** the bolt itself (drawn before the clouds, so the nearer cloud masses hide its top) */
export const FarBolt: React.FC<{cam: Cam3; k: number}> = ({cam, k}) => {
  if (k < 0.04) return null;
  const P = projector(cam);
  const main = path(P, FAR);
  const brs = FAR_BR.map((b) => path(P, b)).join(' ');
  const a = clamp(k);
  return (
    <g style={{mixBlendMode: 'screen'}} fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={main} stroke="#6C78FF" strokeOpacity={0.22 * a} strokeWidth={14} />
      <path d={main} stroke="#B4C2FF" strokeOpacity={0.6 * a} strokeWidth={4.5} />
      <path d={brs} stroke="#B4C2FF" strokeOpacity={0.45 * a} strokeWidth={2.6} />
      <path d={main} stroke="#FFFFFF" strokeOpacity={0.95 * a} strokeWidth={2} />
      <path d={brs} stroke="#EEF0FF" strokeOpacity={0.7 * a} strokeWidth={1.2} />
    </g>
  );
};
/** the strike's light on the sky and the cloud bases round it (screen blend, under the ridges, so the hills stay dark
 *  silhouettes against it) */
export const FarGlow: React.FC<{cam: Cam3; k: number; id: string; at?: V3; size?: number}> = ({cam, k, id, at = FAR_GLOW_AT, size = 1}) => {
  if (k < 0.02) return null;
  const P = projector(cam);
  const g = P(at);
  if (!g.ok) return null;
  const r = size * clamp((cam.f * 2600) / g.z, 300, 1400);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" cx={fmt(g.x)} cy={fmt(g.y)} r={fmt(r)} gradientTransform={`translate(${fmt(g.x)},${fmt(g.y)}) scale(1,0.8) translate(${fmt(-g.x)},${fmt(-g.y)})`}>
          <stop offset="0" stopColor="#A7B2F2" stopOpacity={clamp(0.62 * k)} />
          <stop offset="0.25" stopColor="#8892DA" stopOpacity={clamp(0.34 * k)} />
          <stop offset="0.6" stopColor="#5E68B4" stopOpacity={clamp(0.12 * k)} />
          <stop offset="1" stopColor="#4A5498" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={`url(#${id}-fg)`} />
    </g>
  );
};

// ------------------------------------------------------------------ sky, clouds, ridges
/** the storm behind the house. `flash` is the strike's general lift of the sky (small); the cloud drift runs on a
 *  local clock round zero, where V3's periodic drift moves at its full (slow) speed */
export const RodSky: React.FC<{cam: Cam3; flash: number; strike: number; glow: number; flicker?: number; drift: number; id: string}> = ({cam, flash, strike, glow, flicker = 0, drift, id}) => {
  const P = projector(cam);
  return (
    <g>
      <SkyGrad cam={cam} flash={flash} id={`${id}-sky`} />
      <FarBolt cam={cam} k={strike} />
      <Clouds cam={cam} P={P} flash={flash} s={0} drift={drift} id={`${id}-cl`} />
      <FarGlow cam={cam} k={glow} id={id} />
      <FarGlow cam={cam} k={flicker} id={`${id}-fl`} at={FLICK_AT} size={0.55} />
      <Ranges cam={cam} P={P} flash={flash} />
    </g>
  );
};

// ------------------------------------------------------------------ rain (V3's 3D rain, from Sky3D)
/** drops in world cells round the camera, each drawn as its projected fall streak; `front` picks the drops between
 *  the camera and the facade (drawn over the house) or those beyond it (drawn behind). Drops over the caption band
 *  and near the rod tip are held back. The field reaches farther for a longer lens (with the square root of the focal
 *  length), so the settled close-up still shows about as many streaks as the wide instead of thinning to a few; the
 *  farthest drops fade out with depth, so nothing pops in as the reach grows or the camera's cell changes. */
export const RodRain: React.FC<{cam: Cam3; rainT: number; front: boolean; flash: number; quiet?: {x: number; y: number; r: number}; k?: number}> = ({cam, rainT, front, flash, quiet, k = 1}) => {
  if (k <= 0) return null;
  const P = projector(cam);
  const RC = 9;
  const dFar = 78 * Math.sqrt(cam.f / 1360);
  const izMax = Math.ceil(dFar / RC) + 1;
  // drops grouped by (quantized) opacity
  const drops = new Map<number, string[]>();
  const op = [0.24, 0.15, 0.07];
  const cxi = Math.floor(cam.pos.x / RC), cyi = Math.floor(cam.pos.y / RC), czi = Math.floor(cam.pos.z / RC);
  for (let ix = -5; ix <= 5; ix++) for (let iy = -3; iy <= 4; iy++) for (let iz = -1; iz <= izMax; iz++) {
    const gx = cxi + ix, gy = cyi + iy, gz = czi + iz;
    const key = ((gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)) | 0;
    for (let m = 0; m < 2; m++) {
      const hx = hash(key + m * 7, 311), hzz = hash(key + m * 7, 313), hy = hash(key + m * 7, 315);
      const sp = (28 + Math.floor(hash(key + m, 317) * 11)) / LOOP;
      const fall = (hy * RC + rainT * 9 * sp) % RC;
      const w = v3((gx + hx) * RC, (gy + 1) * RC - fall, (gz + hzz) * RC);
      if ((w.z < HOUSE.z) !== front) continue;
      if (w.y < HOUSE.y) continue; // below the ground
      const p0 = P(w), p1 = P(v3(w.x - 0.25, w.y - 1.1, w.z));
      if (!p0.ok || !p1.ok || p0.z < 2.5) continue;
      const far = clamp((dFar - p0.z) / 22);
      if (far <= 0) continue;
      if (p0.x < -40 || p0.x > 1120 || p0.y < -40 || p0.y > 1960) continue;
      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (L < 6 || L > 120) continue;
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
      const band = my > 1530 && my < 1790 ? 2 : my > 1470 && my < 1850 ? 1 : 0;
      const nearQ = quiet && Math.hypot(mx - quiet.x, my - quiet.y) < quiet.r ? 2 : 0;
      const o = Math.round(100 * op[Math.max(band, nearQ)] * far * k);
      if (o <= 0) continue;
      const list = drops.get(o);
      const d = `M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`;
      if (list) list.push(d);
      else drops.set(o, [d]);
    }
  }
  const c = mix('#8FA6BC', '#C8D2F0', clamp(flash) * 0.4);
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={front ? 2.2 : 1.8}>
      {[...drops.entries()].sort((a, b) => a[0] - b[0]).map(([o, d]) => <path key={o} d={d.join(' ')} stroke={c} strokeOpacity={o / 100} />)}
    </g>
  );
};
