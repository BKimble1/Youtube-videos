// V5 workstation view: V3's set, palette and depth of field; the repaired machine (rods, two-seat holder, level gripper
// whose fingers sort with the module they hold), one module model on every insect, shadows on the surface below.
import React from 'react';
import {basis, Basis, len3, Orbit, proj, sub3, V3} from '../core/three';
import {Item, resetIds} from '../core/draw3';
import {cam} from '../camera';
import {resetRoachIds} from '../roach/draw';
import {Pack2, packParts5 as packParts2} from './pack5';
import {benchEl2, conveyorEls2} from '../v2/lab2';
import {armItems5, holdF, holderItems5, stageItems5} from './machine5';
import {armAt5, bugAt5, Bug5, ground5, HOLD_SEATS, holderA5, holderB5, LOOP_K5, PLAT_H, prevLoopBug5, ROD_DEFS, rodsAt5, seat5, sledX5} from './story5';
import {cyborgGroup5, Grip, gripAroundTab} from './compose5';

const RIM = {c: '#8FD6E6', k: 0.55};
const parts = (B: Basis, pack: Pack2, key: string) => packParts2(B, pack, key);
const sortDraw = (items: Item[], near = 25) => items.filter((it) => it.z > near).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
const onScreen = (B: Basis, p: V3, m = 600) => {
  const P = proj(B, p);
  return P.z > 30 && P.x > -m && P.x < 1080 + m && P.y > -m && P.y < 1920 + m;
};
export type LabOpts5 = {
  dof?: number;
  pulse?: (k: number) => Pack2['pulse'] | undefined;
  xray?: (k: number) => number;
  pronoOp?: (k: number) => number | undefined;
};
/** the shadow plane under an insect: the platform top while it rides the platform, else the surface under its body */
const shadowZ = (b: Bug5) => {
  if (b.onSled) return PLAT_H;
  const o = b.st.body.o, f = b.st.body.f;
  let a = 0;
  for (const d of [-30, -15, 0, 15, 25]) a += ground5(o[0] + f[0] * d, o[1] + f[1] * d);
  return a / 5;
};

export const labItems5 = (B: Basis, t: number, o: LabOpts5 = {}, fkey = ''): {items: Item[]; flat: React.ReactNode[]} => {
  const items: Item[] = [];
  const flat: React.ReactNode[] = [benchEl2(B, `${fkey}bench`), ...conveyorEls2(B)];
  const sx = sledX5(t);
  items.push(...stageItems5(B, sx, rodsAt5(t), ROD_DEFS, 'stg'));
  const {arm, held} = armAt5(t);
  const A = armItems5(B, arm);
  items.push(...A.arm);
  const tool = A.tool;
  const grip: Grip = {items: A.grip, tool};
  const bugs: Bug5[] = [];
  for (let k = 0; k <= LOOP_K5; k++) { const b = bugAt5(k, t); if (b) bugs.push(b); }
  const pl = prevLoopBug5(t);
  if (pl) bugs.push({...pl, k: -1});
  // which module do the fingers belong to (for depth order)? the held one, else the nearest seated / parked one
  const heldPack: Pack2 | null = held !== null ? {F: tool, led: 0, hook: 0, batt: 0, xray: o.xray ? o.xray(held) : 0} : null;
  const heldOnBug = held !== null ? bugs.find((b) => b.k === held && b.onSled && len3(sub3(tool.o, seat5(b.st.body).o)) < 45) : undefined;
  let gripUsed = false;
  const near = (p: V3) => len3(sub3(tool.o, p)) < 30;
  bugs.forEach((b) => {
    if (!onScreen(B, b.st.body.o)) return;
    let pack: Pack2 | null = b.pack ? {...b.pack, pulse: o.pulse ? o.pulse(b.k) : undefined, xray: o.xray ? o.xray(b.k) : 0} : null;
    let g: Grip | undefined;
    if (heldOnBug && heldOnBug === b) { pack = heldPack; g = grip; gripUsed = true; }
    else if (pack && held === null && near(pack.F.o)) { g = grip; gripUsed = true; }
    items.push(cyborgGroup5(B, b.st, pack, `b${b.k}`, {parts, rim: RIM, pronoOp: o.pronoOp ? o.pronoOp(b.k) : undefined, shadowZ: shadowZ(b), grip: g}).item);
  });
  // the holder and its parked modules (each as one block; the fingers join the block they are closing on)
  holderItems5(B).forEach((it) => items.push(it));
  ([['A', holderA5(t)], ['B', holderB5(t)]] as const).forEach(([s, full]) => {
    if (!full) return;
    const F = holdF(HOLD_SEATS[s]);
    const {main, elec} = packParts2(B, {F, led: 0, hook: 0, batt: 0}, `hp${s}`);
    const block = [...main, ...elec];
    if (held === null && !gripUsed && near(F.o)) { block.push(...gripAroundTab(B, main, grip)); gripUsed = true; }
    items.push({z: proj(B, F.o).z, el: <g key={`hpg${s}`}>{sortDraw(block, 2)}</g>});
  });
  // the held module in the air: its parts and the fingers, sorted as one assembly
  if (heldPack && !heldOnBug) {
    const {main, elec} = packParts2(B, heldPack, 'ph');
    items.push(...main, ...elec, ...gripAroundTab(B, main, grip));
    gripUsed = true;
  }
  if (!gripUsed) items.push(...A.grip);
  return {items, flat};
};

export const LabView5: React.FC<{t: number; orbit: Orbit; fkey: string; o?: LabOpts5}> = ({t, orbit, fkey, o = {}}) => {
  resetIds(fkey);
  resetRoachIds(`${fkey}r`);
  const B = basis(cam(orbit));
  const {items, flat} = labItems5(B, t, o, fkey);
  const focusZ = proj(B, orbit.target).z;
  const blurPx = Math.min(12, (o.dof ?? 1) * 0.014 * focusZ);
  const far = items.filter((it) => it.z > focusZ * 1.8);
  const nearI = items.filter((it) => it.z <= focusZ * 1.8);
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
      {sortDraw(nearI)}
      <rect width={1080} height={1920} fill={`url(#${fkey}vig)`} />
    </svg>
  );
};
