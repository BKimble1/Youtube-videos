// The V3 workstation seen through a camera at film time t (dark set from V2): bench with light pools, the slider rail,
// the fixation platform with rods A/B, the insect(s), the arm and the backpack it holds, the backpack holder; optional
// conceptual "repeat" ghosts. Depth of field as frame-bounded SVG filters (as in V2).
import React from 'react';
import {basis, Basis, Orbit, proj, sub3, V3} from '../core/three';
import {Item, resetIds} from '../core/draw3';
import {frame} from '../core/frame';
import {cam} from '../camera';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds, roachSilhouette} from '../roach/draw';
import {PACK_SEAT, solve} from '../roach/rig';
import {Pack2, packParts2} from '../v2/pack2';
import {benchEl2, conveyorEls2} from '../v2/lab2';
import {armItems3, HOLD_SEAT, holderItems, stageItems} from './machine3';
import {armAt3, bugAt3, Bug3, holderFull3, LOOP_K3, PLAT_H, prevLoopBug, rodsAt3, sledX3} from './story3';
import {standState} from '../roach/gait';

const RIM = {c: '#8FD6E6', k: 0.55};
const parts = (B: Basis, pack: Pack2, key: string) => packParts2(B, pack, key);
const sortDraw = (items: Item[], near = 25) => items.filter((it) => it.z > near).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
const onScreen = (B: Basis, p: V3, m = 600) => {
  const P = proj(B, p);
  return P.z > 30 && P.x > -m && P.x < 1080 + m && P.y > -m && P.y < 1920 + m;
};

export type LabOpts3 = {
  dof?: number;
  pulse?: (k: number) => Pack2['pulse'] | undefined;
  xray?: (k: number) => number;
  pronoOp?: (k: number) => number | undefined;
  ghosts?: number; // conceptual repetition (0..1)
  extra?: (B: Basis) => Item[];
};

export const labItems3 = (B: Basis, t: number, o: LabOpts3 = {}, fkey = ''): {items: Item[]; flat: React.ReactNode[]} => {
  const items: Item[] = [];
  const flat: React.ReactNode[] = [benchEl2(B, `${fkey}bench`), ...conveyorEls2(B)];
  const sx = sledX3(t);
  items.push(...stageItems(B, sx, rodsAt3(t), 'stg').items);
  const {arm, held} = armAt3(t);
  const bugs: Bug3[] = [];
  for (let k = 0; k <= LOOP_K3; k++) { const b = bugAt3(k, t); if (b) bugs.push(b); }
  const pl = prevLoopBug(t);
  if (pl) bugs.push({...pl, k: -1});
  bugs.forEach((b) => {
    if (!onScreen(B, b.st.body.o)) return;
    let pack: Pack2 | null = b.pack;
    if (pack) pack = {...pack, pulse: o.pulse ? o.pulse(b.k) : undefined, xray: o.xray ? o.xray(b.k) : 0};
    if (!pack && held === b.k && b.onSled) {
      const seat = sub3(arm.tcp, [sx, PACK_SEAT[0], PACK_SEAT[2] + PLAT_H]);
      if (Math.hypot(seat[0], seat[1], seat[2]) < 45) pack = {F: frame(arm.tcp, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0, xray: o.xray ? o.xray(b.k) : 0};
    }
    items.push(cyborgGroup(B, b.st, pack, `b${b.k}`, {parts, rim: RIM, pronoOp: o.pronoOp ? o.pronoOp(b.k) : undefined, shadowZ: b.onSled ? PLAT_H : 0}).item);
  });
  armItems3(B, arm).forEach((it) => items.push(it));
  if (held !== null) {
    const seat = sub3(arm.tcp, [sx, PACK_SEAT[0], PACK_SEAT[2] + PLAT_H]);
    const onBug = bugs.some((b) => b.k === held && b.onSled) && Math.hypot(seat[0], seat[1], seat[2]) < 45;
    if (!onBug) {
      const {main, elec} = packParts2(B, {F: frame(arm.tcp, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0}, 'ph');
      items.push(...main, ...elec);
    }
  }
  holderItems(B).forEach((it) => items.push(it));
  if (holderFull3(t)) {
    const {main, elec} = packParts2(B, {F: frame(HOLD_SEAT, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0}, 'hp');
    items.push({z: proj(B, HOLD_SEAT).z, el: <g key="hpg">{sortDraw([...main, ...elec], 2)}</g>});
  }
  // conceptual repetition: dashed outlines of the same cycle, one after another along the slider (labelled as an
  // illustration by the caller; the real system fixes one insect at a time)
  if ((o.ghosts ?? 0) > 0.01) {
    [-1, -2, -3].forEach((n, i) => {
      const st = standState({p: [n * 110, 0, PLAT_H], yaw: 90}, {antTw: [6, 6], antLift: [-14, -14], headPitch: 6, breathe: 0.5}, undefined, 1.06);
      const sil = roachSilhouette(B, solve(st));
      const c = proj(B, st.body.o);
      if (c.z < 30) return;
      const a = (o.ghosts ?? 0) * (0.95 - 0.22 * i);
      items.push({z: c.z, el: <g key={`gh${i}`} opacity={a}>{sil.map((d, j) => <path key={j} d={d} fill="#5CF2FF" fillOpacity={0.12} stroke="#5CF2FF" strokeWidth={3.2} strokeDasharray="8 6" />)}</g>});
    });
  }
  if (o.extra) items.push(...o.extra(B));
  return {items, flat};
};

export const LabView3: React.FC<{t: number; orbit: Orbit; fkey: string; o?: LabOpts3; overlay?: (B: Basis) => React.ReactNode}> = ({t, orbit, fkey, o = {}, overlay}) => {
  resetIds(fkey);
  resetRoachIds(`${fkey}r`);
  const B = basis(cam(orbit));
  const {items, flat} = labItems3(B, t, o, fkey);
  const focusZ = proj(B, orbit.target).z;
  const blurPx = Math.min(12, (o.dof ?? 1) * 0.014 * focusZ);
  const far = items.filter((it) => it.z > focusZ * 1.8);
  const near = items.filter((it) => it.z <= focusZ * 1.8);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${fkey}wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081019" /><stop offset="1" stopColor="#13222E" /></linearGradient>
        <radialGradient id={`${fkey}vig`} cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stopColor="#04090E" stopOpacity="0" /><stop offset="1" stopColor="#04090E" stopOpacity="0.62" /></radialGradient>
        <filter id={`${fkey}dofA`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation={(blurPx * 0.2).toFixed(2)} /></filter>
        <filter id={`${fkey}dofB`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation={(blurPx * 0.5).toFixed(2)} /></filter>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${fkey}wall)`} />
      <g filter={blurPx > 0.5 ? `url(#${fkey}dofA)` : undefined}>{flat}</g>
      <g filter={blurPx > 0.5 ? `url(#${fkey}dofB)` : undefined}>{sortDraw(far)}</g>
      {sortDraw(near)}
      <rect width={1080} height={1920} fill={`url(#${fkey}vig)`} />
      {overlay && overlay(B)}
    </svg>
  );
};
