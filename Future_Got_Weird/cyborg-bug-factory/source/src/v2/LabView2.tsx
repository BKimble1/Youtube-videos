// The V2 lab seen through a camera at film time t (dark set, pools of light): bench, conveyor, carriers and their
// insects, the opening cyborg on its route, the arm and backpacks, tray, test passage, parked robot, arena; depth sorted,
// with items far behind the focus plane softened (shallow macro depth of field).
import React from 'react';
import {basis, Basis, Orbit, proj, sub3, V3} from '../core/three';
import {boxItem, Item, resetIds} from '../core/draw3';
import {frame} from '../core/frame';
import {cam} from '../camera';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {PACK_SEAT, RoachState} from '../roach/rig';
import {clamp, DUR} from '../lib';
import {armItems2} from './arm2';
import {Pack2, packParts2} from './pack2';
import {arenaItems2, benchEl2, carrierItems2, conveyorEls2, passageItems, ROBOT_PARK, robotItemsAt, TRAY2_SLOTS, trayItems2} from './lab2';
import {ambientBugs2, armAt2, bugAt2, carrierX2, CYCLES2, LOOP_K2, OBSTACLE, ocState, trayFull2} from './story2';

const sortDraw = (items: Item[], near = 25) => items.filter((it) => it.z > near).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
const onScreen = (B: Basis, p: V3, m = 500) => {
  const P = proj(B, p);
  return P.z > 30 && P.x > -m && P.x < 1080 + m && P.y > -m && P.y < 1920 + m;
};
const parts = (B: Basis, pack: Pack2, key: string) => packParts2(B, pack, key);
const RIM = {c: '#8FD6E6', k: 0.55};

export type LabOpts2 = {
  dof?: number;
  extra?: (B: Basis) => Item[];
  pronoOp?: (k: number | 'oc') => number | undefined;
  pulse?: (k: number) => Pack2['pulse'] | undefined;
  xray?: (k: number) => number;
  oc?: boolean; // draw the opening cyborg (default true)
  ocTau?: number; // its route time (default: t at the start, t - DUR at the end)
  obstacle?: number; // show the control demo's obstacle block (opacity)
  near?: number;
};

export const labItems2 = (B: Basis, t: number, o: LabOpts2 = {}, fkey = ''): {items: Item[]; flat: React.ReactNode[]} => {
  const items: Item[] = [];
  const flat: React.ReactNode[] = [benchEl2(B, `${fkey}bench`), ...conveyorEls2(B)];
  const {arm, held} = armAt2(t);
  for (let k = -3; k <= LOOP_K2 + 7; k++) {
    const x = carrierX2(k, t);
    if (Math.abs(x) > 700) continue;
    const C = CYCLES2[k === LOOP_K2 ? 0 : k];
    const tt = k === LOOP_K2 ? t - DUR : t;
    const open = k < 0 ? 1 : C ? clamp((tt - C.open) / 0.22) : 0;
    const cr = carrierItems2(B, x, k === LOOP_K2 ? 0 : open, `c${k}`);
    flat.push(cr.flat);
    items.push(...cr.items);
    if (k < 0) continue;
    const bug = bugAt2(k, t);
    if (!onScreen(B, bug.st.body.o, 700)) continue;
    let pack: Pack2 | null = bug.pack;
    if (pack) pack = {...pack, pulse: o.pulse ? o.pulse(k) : undefined, xray: o.xray ? o.xray(k) : 0};
    if (!pack && held === k) {
      const seat = sub3(arm.tcp, [x, PACK_SEAT[0], PACK_SEAT[2]]);
      if (Math.hypot(seat[0], seat[1], seat[2]) < 45) pack = {F: frame(arm.tcp, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0, xray: o.xray ? o.xray(k) : 0};
    }
    items.push(cyborgGroup(B, bug.st, pack, `b${k}`, {parts, rim: RIM, pronoOp: o.pronoOp ? o.pronoOp(k) : undefined}).item);
  }
  ambientBugs2(t).forEach((a, i) => {
    if (onScreen(B, a.st.body.o, 300)) items.push(cyborgGroup(B, a.st, a.pack, `am${i}`, {parts, rim: RIM}).item);
  });
  if (o.oc !== false && (o.ocTau !== undefined || t < 4.3 || t > DUR - 5)) {
    const tau = o.ocTau ?? (t < DUR / 2 ? t : t - DUR);
    const oc = ocState(tau);
    if (onScreen(B, oc.st.body.o, 600)) items.push(cyborgGroup(B, oc.st, oc.pack, 'oc', {parts, rim: RIM, pronoOp: o.pronoOp ? o.pronoOp('oc') : undefined}).item);
  }
  armItems2(B, arm).forEach((it) => items.push(it));
  if (held !== null) {
    const x = carrierX2(held, t);
    const seat = sub3(arm.tcp, [x, PACK_SEAT[0], PACK_SEAT[2]]);
    if (Math.hypot(seat[0], seat[1], seat[2]) >= 45) {
      const {main, elec} = packParts2(B, {F: frame(arm.tcp, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0}, 'ph');
      items.push(...main, ...elec);
    }
  }
  trayItems2(B).forEach((it) => items.push(it));
  TRAY2_SLOTS.forEach((p, i) => {
    if (!trayFull2(i, t)) return;
    const {main, elec} = packParts2(B, {F: frame(p, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0, batt: 0}, `tp${i}`);
    items.push({z: proj(B, p).z, el: <g key={`tpg${i}`}>{sortDraw([...main, ...elec], 2)}</g>});
  });
  passageItems(B).forEach((it) => items.push(it));
  items.push(...robotItemsAt(B, ROBOT_PARK, 235, 0, 0, 'park', 0.2));
  if ((o.obstacle ?? 0) > 0.01) items.push(boxItem(B, add(OBSTACLE, [0, 0, 7]), [11, 9, 7], '#8E9CA8', {key: 'obs', opacity: o.obstacle}));
  if (o.extra) items.push(...o.extra(B));
  return {items, flat};
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const LabView2: React.FC<{t: number; orbit: Orbit; fkey: string; o?: LabOpts2; overlay?: (B: Basis) => React.ReactNode; under?: (B: Basis) => React.ReactNode}> = ({t, orbit, fkey, o = {}, overlay, under}) => {
  resetIds(fkey);
  resetRoachIds(`${fkey}r`);
  const B = basis(cam(orbit));
  const {items, flat} = labItems2(B, t, o, fkey);
  const focusZ = proj(B, orbit.target).z;
  const dof = o.dof ?? 1;
  const far = items.filter((it) => it.z > focusZ * 1.8);
  const near = items.filter((it) => it.z <= focusZ * 1.8);
  const blurPx = Math.min(12, dof * 0.014 * focusZ);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${fkey}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081019" />
          <stop offset="1" stopColor="#13222E" />
        </linearGradient>
        <radialGradient id={`${fkey}vig`} cx="0.5" cy="0.45" r="0.78">
          <stop offset="0.5" stopColor="#04090E" stopOpacity="0" />
          <stop offset="1" stopColor="#04090E" stopOpacity="0.62" />
        </radialGradient>
        {/* depth of field as SVG filters whose region is the frame (CSS blur on layers that extend far off-frame
            made headless Chrome fail to composite a few frames) */}
        <filter id={`${fkey}dofA`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation={(blurPx * 0.2).toFixed(2)} /></filter>
        <filter id={`${fkey}dofB`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation={(blurPx * 0.5).toFixed(2)} /></filter>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${fkey}wall)`} />
      <g filter={blurPx > 0.5 ? `url(#${fkey}dofA)` : undefined}>{flat}</g>
      {under && under(B)}
      <g filter={blurPx > 0.5 ? `url(#${fkey}dofB)` : undefined}>{sortDraw(far, o.near)}</g>
      {sortDraw(near, o.near)}
      <rect width={1080} height={1920} fill={`url(#${fkey}vig)`} />
      {overlay && overlay(B)}
    </svg>
  );
};
export type {RoachState};
