// The assembly cell seen through a camera at film time t: bench, conveyor, carriers, insects, backpacks, tray, arm,
// vision post and arena, depth sorted. Items far behind the focus plane are drawn in a softened layer (shallow macro
// depth of field). Used by the hook, the reveal, the time-lapse, the attach close-ups, the factory overhead and the loop.
import React from 'react';
import {basis, Basis, dot3, Orbit, proj, sub3, V3} from '../core/three';
import {Item, resetIds} from '../core/draw3';
import {cam} from '../camera';
import {armItems} from '../kit/arm';
import {packItems, PackState, packParts} from '../kit/backpack';
import {arenaItems, benchEl, carrierItems, conveyorEls, trayItems, TRAY_SLOTS, visionItems} from '../kit/lab';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {ambientBugs, armAt, bugAt, carrierX, CYCLES, LOOP_K, trayFull} from '../story';
import {frame} from '../core/frame';
import {clamp, DUR} from '../lib';
import {PACK_SEAT} from '../roach/rig';

const sortDraw = (items: Item[]) => items.filter((it) => it.z > 25).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
const onScreen = (B: Basis, p: V3, m = 500) => {
  const P = proj(B, p);
  return P.z > 3 && P.x > -m && P.x < 1080 + m && P.y > -m && P.y < 1920 + m;
};

export type LabOpts = {dof?: number; extra?: (B: Basis) => Item[]; hidePacksInTray?: boolean; pulse?: (k: number) => PackState['pulse'] | undefined; glowPack?: number; pronoOp?: (k: number) => number | undefined};

export const labItems = (B: Basis, t: number, o: LabOpts = {}): {items: Item[]; flat: React.ReactNode[]} => {
  const items: Item[] = [];
  const flat: React.ReactNode[] = [];
  flat.push(benchEl(B));
  conveyorEls(B).forEach((it) => flat.push(<React.Fragment key={`cv${flat.length}`}>{it.el}</React.Fragment>));
  const {arm, held} = armAt(t);
  // carriers and their insects
  for (let k = -2; k <= LOOP_K + 2; k++) {
    const x = carrierX(k, t);
    if (Math.abs(x) > 700) continue;
    const C = CYCLES[k === LOOP_K ? 0 : k];
    const tt = k === LOOP_K ? t - DUR : t;
    const open = k < 0 ? 1 : C ? clamp((tt - C.open) / 0.22) : 0;
    carrierItems(B, x, k === LOOP_K ? 0 : open, `c${k}`).forEach((it) => (it.z > 1e6 ? flat.push(<React.Fragment key={`cf${k}${flat.length}`}>{it.el}</React.Fragment>) : items.push(it)));
    if (k < 0) continue;
    const bug = bugAt(k, t);
    if (!onScreen(B, bug.st.body.o, 700)) continue;
    let pack: PackState | null = bug.pack;
    if (pack && o.pulse) pack = {...pack, pulse: o.pulse(k)};
    // the pack still in the gripper joins the insect's group once it is close to the seat
    let heldHere = false;
    if (!pack && held === k) {
      const F = frame(arm.tcp, [0, 1, 0], [0, 0, 1]);
      const seat = sub3(arm.tcp, [x, PACK_SEAT[0], PACK_SEAT[2]]);
      if (Math.hypot(seat[0], seat[1], seat[2]) < 45) {
        pack = {F, led: 0, hook: 0};
        heldHere = true;
      }
    }
    const g = cyborgGroup(B, bug.st, pack, `b${k}`, {pronoOp: o.pronoOp ? o.pronoOp(k) : undefined});
    items.push(g.item);
    void heldHere;
  }
  ambientBugs(t).forEach((a, i) => {
    if (onScreen(B, a.st.body.o, 300) && proj(B, a.st.body.o).z > 40) items.push(cyborgGroup(B, a.st, a.pack, `am${i}`, {}).item);
  });
  // the arm and a pack in transit
  armItems(B, arm).forEach((it) => items.push(it));
  if (held !== null) {
    const x = carrierX(held, t);
    const seat = sub3(arm.tcp, [x, PACK_SEAT[0], PACK_SEAT[2]]);
    if (Math.hypot(seat[0], seat[1], seat[2]) >= 45) packItems(B, {F: frame(arm.tcp, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0}, 'ph').forEach((it) => items.push(it));
  }
  // tray and its packs
  trayItems(B).forEach((it) => items.push(it));
  TRAY_SLOTS.forEach((p, i) => {
    if (o.hidePacksInTray || !trayFull(i, t)) return;
    const {main, elec} = packParts(B, {F: frame(p, [0, 1, 0], [0, 0, 1]), led: 0, hook: 0}, `tp${i}`);
    const z = proj(B, p).z;
    items.push({z, el: <g key={`tpg${i}`}>{sortDraw([...main, ...elec])}</g>});
  });
  visionItems(B).forEach((it) => items.push(it));
  arenaItems(B).forEach((it) => items.push(it));
  if (o.extra) o.extra(B).forEach((it) => items.push(it));
  return {items, flat};
};

export const LabView: React.FC<{t: number; orbit: Orbit; fkey: string; o?: LabOpts; overlay?: (B: Basis) => React.ReactNode}> = ({t, orbit, fkey, o = {}, overlay}) => {
  resetIds(fkey);
  resetRoachIds(`${fkey}r`);
  const B = basis(cam(orbit));
  const {items, flat} = labItems(B, t, o);
  const focusZ = proj(B, orbit.target).z;
  const dof = o.dof ?? 1;
  // depth of field: items well behind the focus plane go to a softened layer
  const far = items.filter((it) => it.z > focusZ * 1.9);
  const near = items.filter((it) => it.z <= focusZ * 1.9);
  const blurPx = Math.min(10, dof * 0.012 * focusZ);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${fkey}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24394A" />
          <stop offset="1" stopColor="#3E5A6C" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${fkey}wall)`} />
      <g style={{filter: blurPx > 0.5 ? `blur(${(blurPx * 0.6).toFixed(1)}px)` : undefined}}>{flat}</g>
      <g style={{filter: blurPx > 0.5 ? `blur(${blurPx.toFixed(1)}px)` : undefined}}>{sortDraw(far)}</g>
      {sortDraw(near)}
      {overlay && overlay(B)}
    </svg>
  );
};
export {dot3};
