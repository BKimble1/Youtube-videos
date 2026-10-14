// SET-SIM: the virtual training world. Light blue, a measured grid, a launch platform and a target ring.
// Conceptual illustration of simulation training in general, not Figure's simulator.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, norm} from '../engine/math';
import {Env, Item, box, circle3, line3, quad} from '../engine/prims';
import {polyClosed} from '../engine/draw';

export const SIM_ENV: Env = {light: norm([-0.4, 0.85, 0.45]), ambient: 0.8, ink: '#2C4A80', lineW: 2.2};
export const SIM = {platTop: 150, platEdgeX: -214, target: [70, 0, 0] as V3, targetR: 62};

export const SimBg: React.FC<{id?: string}> = ({id = 'simbg'}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F7FAFF" />
        <stop offset="1" stopColor="#DCE8FA" />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill={`url(#${id})`} />
  </g>
);

export type SimGeo = {floorY: number; platTop: number; edgeX: number; target: V3; platW?: number};
export const SIM_DEFAULT: SimGeo = {floorY: 0, platTop: SIM.platTop, edgeX: SIM.platEdgeX, target: SIM.target};
/** The foundry jump rebuilt as a virtual copy: walkway → platform, steel surface → floor with a target ring. */
export const SIM_FOUNDRY: SimGeo = {floorY: 322, platTop: 600, edgeX: -214, target: [-18, 322, 0], platW: 520};

export const simWorld = (pr: Proj, env: Env, opts: {lane?: number; platform?: boolean; target?: boolean; grid?: number; key?: string; ringPulse?: number; ringColor?: string; geo?: SimGeo; floor?: boolean} = {}): Item[] => {
  const k = opts.key ?? '';
  const g0 = opts.geo ?? SIM_DEFAULT;
  const fy = g0.floorY;
  const dz = opts.lane ?? 0;
  const items: Item[] = [];
  if (opts.floor !== false) {
    const fl = quad(pr, env, 'simFloor' + k, [[-2600, fy, dz - 1400], [2600, fy, dz - 1400], [2600, fy, dz + 1400], [-2600, fy, dz + 1400]], '#E6EFFC', {flat: true, stroke: false});
    if (fl) items.push({...fl, z: 1e6 + 1});
  }
  const g = opts.grid ?? 1;
  if (g > 0) {
    for (let i = -24; i <= 24; i++) {
      items.push({...line3(pr, `gx${k}${i}`, [[i * 100, fy + 0.5, dz - 1400], [i * 100, fy + 0.5, dz + 1400]], '#9DBBEA', i % 5 === 0 ? 2.4 : 1.2, {opacity: g}), z: 1e6 + 0.5});
    }
    for (let i = -14; i <= 14; i++) {
      items.push({...line3(pr, `gz${k}${i}`, [[-2600, fy + 0.5, dz + i * 100], [2600, fy + 0.5, dz + i * 100]], '#9DBBEA', i % 5 === 0 ? 2.4 : 1.2, {opacity: g}), z: 1e6 + 0.5});
    }
  }
  if (opts.platform !== false) {
    const w = g0.platW ?? 260;
    const h = g0.platTop - fy;
    items.push(...box(pr, env, 'plat' + k, {c: [g0.edgeX - w / 2, fy + h / 2, dz], size: [w, h, 220], color: '#C7DAF6', top: '#DCE9FB'}));
    items.push({...line3(pr, 'platEdge' + k, [[g0.edgeX, g0.platTop + 0.5, dz - 110], [g0.edgeX, g0.platTop + 0.5, dz + 110]], '#4F7CC9', 5), z: pr.p([g0.edgeX, g0.platTop, dz]).z - 1});
  }
  if (opts.target !== false) {
    const c: V3 = [g0.target[0], fy + 0.8, g0.target[2] + dz];
    const pulse = opts.ringPulse ?? 0;
    const ring = circle3(c, SIM.targetR * (1 + 0.15 * pulse), 48).slice(0, 48).map((q) => pr.p(q));
    const inner = circle3(c, SIM.targetR * 0.62, 48).slice(0, 48).map((q) => pr.p(q));
    const dot = circle3(c, 12, 24).slice(0, 24).map((q) => pr.p(q));
    const col = opts.ringColor ?? '#1CA7A0';
    const zc = pr.p(c).z + 30;
    items.push({z: zc, key: 'ring' + k, el: (
      <g key={'ring' + k}>
        <path d={polyClosed(ring) + polyClosed(inner)} fillRule="evenodd" fill={col} fillOpacity={0.9} stroke="#0F6E68" strokeWidth={2} />
        <path d={polyClosed(dot)} fill={col} />
      </g>
    )});
  }
  return items;
};

/** Dashed 3D trajectory (e.g. the pelvis path of a jump). `upto` 0..1 draws a portion. */
export const arc3 = (pr: Proj, key: string, pts: V3[], color: string, opts: {upto?: number; width?: number; dash?: string; opacity?: number} = {}): Item => {
  const n = Math.max(2, Math.round(pts.length * (opts.upto ?? 1)));
  const it = line3(pr, key, pts.slice(0, n), color, opts.width ?? 5, {smooth: true, dash: opts.dash ?? '14 12', opacity: opts.opacity ?? 0.9});
  return {...it, z: it.z - 50};
};
