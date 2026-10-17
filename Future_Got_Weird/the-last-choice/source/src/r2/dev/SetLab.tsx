// Set check: the battlefield from the reference cameras (page prop). Not part of the film.
//   0 (a) opening aerial, AERIAL.from → to over 6.6 s (the tower starts to fail on M.LOW_HIT)
//   1 (b) low on the ridge crest behind the Director's stand, looking east (the lonely-silhouette framing)
//   2 (c) the crater fight, medium-wide from the south-west rim
//   3 (d) low three-quarter at the girder flank
//   4 (e) the death position: slab, van and radio in one frame
//   5 (f) the final pullback test: one continuous path from 1 m off his face up to ~250 m over the avenue
//   6     figure depth-sort test: stand-ins on the ridge crest and slopes, low camera orbiting
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, Cam3, figureView, headingVec} from '../engine';
import {setItems} from '../world/set';
import {atmosItems} from '../world/atmos';
import {lightFor, MATS} from '../world/lighting';
import {groundH} from '../world/ground';
import {PLAN, AERIAL} from '../world/plan';
import {RADIO} from '../world/props';
import {Actor} from '../../rig/actor';
import {CAST} from '../../rig/looks';
import {V3, lerp3, smooth, clamp, add3, mul3} from '../../kit/math';

const standIn = (key: string, x: number, z: number, heading: number, t: number, look = CAST.clerkC): Item => {
  const pos = {x, y: groundH(x, z), z};
  return {
    kind: 'sprite', key, pos,
    draw: (c) => {
      const fv = figureView(c.view, pos, heading);
      return <Actor look={look} t={t} x={fv.x} y={fv.y} s={fv.s250} yaw={fv.yaw} ink={clamp(fv.s250 * 4, 0.8, 4)} />;
    },
  };
};

/** Catmull-Rom through points (u in 0..1). */
const spline = (P: V3[], u: number): V3 => {
  const n = P.length - 1;
  const x = clamp(u) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const f = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f);
  return {x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y), z: c(p0.z, p1.z, p2.z, p3.z)};
};

export const PULLBACK = (() => {
  const d = PLAN.deathPos;
  const hd = headingVec(PLAN.deathHeading);
  const face = {x: d.x + hd.x * 0.25, y: groundH(d.x, d.z) + 0.95, z: d.z + hd.z * 0.25};
  const pos: V3[] = [
    add3(face, add3(mul3(hd, 1.0), {x: 0, y: 0.08, z: 0})),
    add3(face, add3(mul3(hd, 2.2), {x: 0.8, y: 0.7, z: -0.6})),
    {x: 16, y: 7, z: -2},
    {x: 34, y: 26, z: -10},
    {x: 70, y: 70, z: -18},
    {x: 120, y: 150, z: -10},
    {x: 160, y: 250, z: 10},
  ];
  const tgt: V3[] = [
    face,
    lerp3(face, RADIO.pos, 0.45),
    {x: 7.6, y: 0.6, z: 4.2},
    {x: 7, y: 0, z: 3.6},
    {x: 30, y: 0, z: 0},
    {x: 300, y: 0, z: -20},
    {x: 1500, y: 90, z: -120},
  ];
  return {pos, tgt, face};
})();

const camFor = (page: number, f: number): {cam: Cam3; t: number} => {
  const st = PLAN.directorStand;
  const sy = groundH(st.x, st.z);
  switch (page) {
    case 0: {
      const u = smooth(f / 198);
      return {cam: {pos: lerp3(AERIAL.from.pos, AERIAL.to.pos, u), target: lerp3(AERIAL.from.target, AERIAL.to.target, u), fov: 44}, t: f / 30};
    }
    case 1: return {cam: {pos: {x: st.x - 3.4, y: sy + 0.9, z: st.z + 1.6}, target: {x: 70, y: 3, z: -4}, fov: 36}, t: 20 + f / 30};
    case 2: return {cam: {pos: {x: 43 + f * 0.01, y: 3.6, z: 17}, target: {x: 64, y: -0.5, z: -2}, fov: 42}, t: 100 + f / 30};
    case 3: return {cam: {pos: {x: 49, y: 1.3, z: -1 - f * 0.005}, target: {x: 60, y: 3.5, z: -14}, fov: 44}, t: 110 + f / 30};
    case 4: return {cam: {pos: {x: 12.6, y: 1.45, z: 0.6}, target: {x: 7.9, y: 0.75, z: 4.6}, fov: 42}, t: 190 + f / 30};
    case 5: {
      const u = smooth(f / 299);
      return {cam: {pos: spline(PULLBACK.pos, u), target: spline(PULLBACK.tgt, u), fov: lerp(36, 46, u)}, t: 200 + f / 30};
    }
    default: {
      const a = (f / 300) * 360;
      const c = {x: 2, y: 2, z: 1};
      const r = 9;
      return {cam: {pos: {x: c.x + Math.sin((a * Math.PI) / 180) * r, y: 1.2, z: c.z - Math.cos((a * Math.PI) / 180) * r}, target: {x: c.x, y: 2.6, z: c.z}, fov: 50}, t: 30};
    }
  }
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const SetLab: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const {cam, t} = camFor(page, f);
  const view = makeView(cam);
  const light = lightFor(t);
  const st = PLAN.directorStand;
  const figs: Item[] = [];
  if (page === 1) figs.push(standIn('dir', st.x, st.z, 90, t));
  if (page === 4 || page === 5) figs.push(standIn('dir', PLAN.deathPos.x, PLAN.deathPos.z, PLAN.deathHeading, t));
  if (page === 2) [[52, 6, 70], [55, 2, 80], [58, -4, 100], [47, 9, 60]].forEach(([x, z, h], i) => figs.push(standIn(`c${i}`, x, z, h, t, [CAST.clerkC, CAST.clerkA, CAST.honest, CAST.guesser][i])));
  if (page === 3) figs.push(standIn('g1', 54, -8, 20, t, CAST.clerkA), standIn('g2', 52, -4, 40, t, CAST.honest));
  if (page === 6) [[st.x, st.z], [3.5, -2], [5.5, 3], [-2.5, 1], [7.5, -6], [0.5, -5]].forEach(([x, z], i) => figs.push(standIn(`r${i}`, x, z, 90 + i * 40, t, Object.values(CAST)[i])));
  const items: Item[] = [
    ...setItems(view, t, {radioOn: page === 5 ? clamp(f / 20) : 0}),
    ...atmosItems(view, t),
    ...figs,
  ];
  return <Scene view={view} light={light} mats={MATS} items={items} t={t} />;
};
