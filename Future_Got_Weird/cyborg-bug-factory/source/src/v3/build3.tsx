// V3 D (14.89-20.6): "So now, instead of building tiny robots from scratch... scientists can use actual living insects."
// The engineering idea, without performance claims: a miniature wheeled robot has to be built part by part (chassis,
// two gear motors, wheels, a caster, battery, controller, sensor: they fly in and seat one after another); its
// spinning wheel match-cuts to an insect's jointed leg mid-stride (six legs, a walking gait the insect already has);
// the camera pulls back to show how small the added part is: one 2.3 g backpack.
import React from 'react';
import {add3, basis, Basis, P2, proj, V3} from '../core/three';
import {capsuleItem, cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame} from '../core/frame';
import {at, cam, chain} from '../camera';
import {clamp, ss} from '../lib';
import {Path, walkState} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';
import {packParts2, Pack2} from '../v2/pack2';
import {benchEl2} from '../v2/lab2';
import {Callout, Tag} from '../scenes/overlays';

export const D0_3 = 14.89, MC3 = 17.93;
const RB: V3 = [0, 300, 0]; // where the robot is assembled
const f2 = (n: number) => n.toFixed(2);

type Part = {name: string; label?: string; t: number; from: V3; draw: (B: Basis, o: V3, k: string, spin: number) => Item[]};
const at3 = (o: V3, p: V3): V3 => add3(o, p);
const wheel = (side: number, xoff: number) => (B: Basis, o: V3, k: string, spin: number): Item[] => {
  const c = at3(o, [xoff, side * 14, 7]);
  const a = at3(c, [0, -side * 2.2, 0]), b = at3(c, [0, side * 2.2, 0]);
  const it: Item[] = [cylinderItem(B, a, b, 7, '#22282E', {key: `${k}t`, cap: '#3B444D'}), cylinderItem(B, b, at3(b, [0, side * 0.6, 0]), 4.2, '#C9D2D9', {key: `${k}h`})];
  const P = proj(B, at3(b, [0, side * 0.7, 0]));
  const r = 6.2 * P.s;
  it.push({z: P.z - 1, el: <g key={`${k}sp`}>{[0, 1, 2, 3, 4].map((q) => { const an = spin + (q * 2 * Math.PI) / 5; return <line key={q} x1={f2(P.x + Math.cos(an) * r * 0.3)} y1={f2(P.y + Math.sin(an) * r * 0.3)} x2={f2(P.x + Math.cos(an) * r * 0.66)} y2={f2(P.y + Math.sin(an) * r * 0.66)} stroke="#8D99A4" strokeWidth={f2(Math.max(1.5, 0.5 * P.s))} strokeLinecap="round" />; })}</g>});
  return it;
};
const motor = (side: number) => (B: Basis, o: V3, k: string): Item[] => [
  cylinderItem(B, at3(o, [-9, side * 2, 7]), at3(o, [-9, side * 11, 7]), 3.2, '#C3CBD2', {key: `${k}m`}),
  obbItem(B, frame(at3(o, [-9, side * 1.2, 7]), [1, 0, 0], [0, 0, 1]), [3.2, 1.6, 3.2], '#C9A54A', {key: `${k}g`}),
];
const PARTS: Part[] = [
  {name: 'chassis', t: 15.05, from: [0, 0, 26], draw: (B, o, k) => [obbItem(B, frame(at3(o, [0, 0, 3.6]), [1, 0, 0], [0, 0, 1]), [22, 11, 0.9], '#5E6E7C', {key: `${k}c`, top: '#7B8B98'})]},
  {name: 'motorL', label: 'GEAR MOTORS', t: 15.4, from: [-30, 40, 30], draw: motor(1)},
  {name: 'motorR', t: 15.5, from: [-30, -40, 30], draw: motor(-1)},
  {name: 'wheelL', label: 'WHEELS', t: 15.85, from: [-9, 60, 10], draw: wheel(1, -9)},
  {name: 'wheelR', t: 15.95, from: [-9, -60, 10], draw: wheel(-1, -9)},
  {name: 'caster', t: 16.25, from: [40, 0, -10], draw: (B, o, k) => [cylinderItem(B, at3(o, [16, 0, 2.7]), at3(o, [16, 0, 1]), 2.2, '#8D99A4', {key: `${k}k`}), cylinderItem(B, at3(o, [16, 0, 1.8]), at3(o, [16, 0, 0.2]), 1.6, '#C9D2D9', {key: `${k}b`})]},
  {name: 'battery', label: 'BATTERY', t: 16.55, from: [0, 0, 40], draw: (B, o, k) => [obbItem(B, frame(at3(o, [-4, 0, 7.4]), [1, 0, 0], [0, 0, 1]), [7, 6, 2.9], '#3E5C8A', {key: `${k}bt`, top: '#5577AA'})]},
  {name: 'board', label: 'CONTROLLER', t: 16.9, from: [10, 0, 48], draw: (B, o, k) => [obbItem(B, frame(at3(o, [6, 0, 11.4]), [1, 0, 0], [0, 0, 1]), [9, 8, 0.5], '#17806E', {key: `${k}pc`}), obbItem(B, frame(at3(o, [6, 1.5, 12.3]), [1, 0, 0], [0, 0, 1]), [2.4, 2.4, 0.4], '#1A2028', {key: `${k}ch`})]},
  {name: 'sensor', label: 'SENSORS', t: 17.15, from: [50, 0, 20], draw: (B, o, k) => [obbItem(B, frame(at3(o, [21, 0, 7.2]), [1, 0, 0], [0, 0, 1]), [1.4, 6, 2.2], '#1A2028', {key: `${k}s`}), cylinderItem(B, at3(o, [22.4, 3, 7.2]), at3(o, [23.2, 3, 7.2]), 1.3, '#2E6C8A', {key: `${k}l1`}), cylinderItem(B, at3(o, [22.4, -3, 7.2]), at3(o, [23.2, -3, 7.2]), 1.3, '#2E6C8A', {key: `${k}l2`})]},
];
/** a part's offset from its seat at time t: flies in over 0.3 s with a small settle */
const partOff = (p: Part, t: number): V3 => {
  const u = clamp((t - (p.t - 0.32)) / 0.32);
  const e = 1 - Math.pow(1 - u, 3);
  const settle = t > p.t ? 0.8 * Math.exp(-(t - p.t) / 0.05) * Math.sin((t - p.t) * 60) : 0;
  return [p.from[0] * (1 - e), p.from[1] * (1 - e), p.from[2] * (1 - e) + settle];
};
const partAlpha = (p: Part, t: number) => ss(t, p.t - 0.45, p.t - 0.3);

// the insect after the match cut: walks +x along the bench, the camera on its right side
const BUGP: Path = {p0: [-80, 0, 0], yaw0: 0, segs: [{len: 4000}]};
const bugS = (t: number) => 34 * Math.max(0, t - 17.3);
export const bugD = (t: number) => {
  const st = walkState(BUGP, bugS(t), {antTw: [20 + 6 * Math.sin(t * 2.6), 20 - 6 * Math.sin(t * 2.6)], antLift: [16, 14], headPitch: -4, breathe: 0.5});
  return {st, pack: {F: seatFrame(st.body, PACK_SEAT), led: 0.9, hook: 1, batt: 1} as Pack2};
};

const camBuild = (t: number) => chain(t, () => at(add3(RB, [2, 0, 6]), 36, 30, 13, 1000), [
  {a: 15.4, b: 17.1, o: () => at(add3(RB, [2, 0, 6]), 62, 26, 14.5, 1000)},
  {a: 17.15, b: 17.93, o: () => at(add3(RB, [-9, -16, 7]), 22, 10, 30, 960)},
]);
const camBug = (t: number) => chain(t, (tt) => at(add3(bugD(tt).st.body.o, [2, -14, 5]), 0, 8, 30, 960), [
  {a: 18.85, b: 20.3, o: (tt) => at(add3(bugD(tt).st.body.o, [0, 0, 9]), 12, 36, 9.5, 1000)},
]);

export const Build3: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  resetRoachIds(fkey + 'r');
  const isBuild = t < MC3;
  const O = isBuild ? camBuild(t) : camBug(t);
  const B = basis(cam(O));
  const items: Item[] = [];
  let labelEl: React.ReactNode = null;
  if (isBuild) {
    const spin = t > 17.2 ? (t - 17.2) * 14 : 0;
    PARTS.forEach((p) => {
      const a = partAlpha(p, t);
      if (a <= 0.01) return;
      const o = add3(RB, partOff(p, t));
      p.draw(B, o, p.name, spin).forEach((it) => items.push({z: it.z, el: <g key={`${p.name}${items.length}`} opacity={a}>{it.el}</g>}));
    });
    // the current part's label
    const cur = [...PARTS].reverse().find((p) => p.label && t >= p.t - 0.05 && t < p.t + 0.42);
    if (cur) {
      const anchor = proj(B, add3(RB, [cur.name === 'battery' ? -4 : cur.name === 'board' ? 6 : cur.name === 'sensor' ? 22 : -9, cur.name.startsWith('wheel') || cur.name.startsWith('motor') ? 14 : 0, 9]));
      labelEl = <Callout p={anchor} to={{x: anchor.x + (anchor.x < 540 ? 120 : -120), y: anchor.y - 300}} text={cur.label!} a={ss(t, cur.t - 0.05, cur.t + 0.08) * (1 - ss(t, cur.t + 0.3, cur.t + 0.42))} color="#8FB3E8" align={anchor.x < 540 ? 'left' : 'right'} />;
    }
  } else {
    const b = bugD(t);
    items.push(cyborgGroup(B, b.st, b.pack, 'bd', {parts: (BB, p: Pack2, k) => packParts2(BB, p, k), rim: {c: '#8FD6E6', k: 0.55}}).item);
    if (t > 19.0) {
      const pk = proj(B, add3(b.st.body.o, [0, 0, 16]));
      labelEl = <Callout p={pk} to={{x: pk.x - 60, y: pk.y - 330}} text="ADDED: ONE 2.3 g BACKPACK" a={ss(t, 19.25, 19.5) * (1 - ss(t, 20.4, 20.58))} color="#FFD84A" align="right" />;
    }
  }
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${fkey}wl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081019" /><stop offset="1" stopColor="#13222E" /></linearGradient>
          <radialGradient id={`${fkey}vg`} cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stopColor="#04090E" stopOpacity="0" /><stop offset="1" stopColor="#04090E" stopOpacity="0.62" /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${fkey}wl)`} />
        {benchEl2(B, `${fkey}bench`)}
        {items.filter((i) => i.z > 8).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
        <rect width={1080} height={1920} fill={`url(#${fkey}vg)`} />
      </svg>
      {labelEl}
      <Tag text="A TINY ROBOT" sub="every moving part built from scratch" a={ss(t, D0_3 + 0.1, D0_3 + 0.35) * (1 - ss(t, MC3 - 0.3, MC3 - 0.05))} y={200} color="#8FB3E8" />
      <Tag text="A LIVING INSECT" sub="six jointed legs, already built" a={ss(t, MC3 + 0.05, MC3 + 0.3) * (1 - ss(t, 20.4, 20.58))} y={200} color="#FFD84A" />
    </div>
  );
};
export {P2, capsuleItem};
