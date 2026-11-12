// V5: V4's build, with every part resting on its support (V4's motors sat 0.7 mm inside the chassis, the battery,
// board and sensor floated 1-1.6 mm above theirs), parts entering from outside the frame fully formed (no fade-in in
// mid-air), and the V5 insect / module model after the match cut.
// V4 D (14.89-20.6): "So now, instead of building tiny robots from scratch... scientists can use actual living insects."
// No text. A miniature wheeled robot is assembled part by part with the camera tracking close on each part as it seats
// (chassis; gear motors; wheels; battery; controller; sensor), then a push onto the spinning wheel that match-cuts to
// the insect's legs mid-stride, followed close, then a pull back to the whole insect with its backpack.
import React from 'react';
import {add3, basis, Basis, P2, proj, sub3, V3} from '../core/three';
import {capsuleItem, cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame} from '../core/frame';
import {at, cam, chain} from '../camera';
import {clamp, ss} from '../lib';
import {Path, walkState} from '../roach/gait';
import {cyborgGroup5} from './compose5';
import {resetRoachIds} from '../roach/draw';
import {seat5} from './story5';
import {withPoles} from './gait5';
import {packParts5 as packParts2, Pack2} from './pack5';
import {benchEl2} from '../v2/lab2';
import {projPolyClip} from '../v2/clip';

export const D0_3 = 14.89, MC3 = 17.93;
export const RB: V3 = [0, 300, 0]; // where the robot is assembled
const f2 = (n: number) => n.toFixed(2);

type Part = {name: string; t: number; from: V3; draw: (B: Basis, o: V3, k: string, spin: number) => Item[]};
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
  cylinderItem(B, at3(o, [-9, side * 2, 7]), at3(o, [-9, side * 11, 7]), 3.5, '#C3CBD2', {key: `${k}m`}),
  obbItem(B, frame(at3(o, [-9, side * 1.7, 7]), [1, 0, 0], [0, 0, 1]), [3.2, 1.2, 3.5], '#C9A54A', {key: `${k}g`}),
];
export const PARTS: Part[] = [
  {name: 'chassis', t: 15.08, from: [0, 0, 26], draw: (B, o, k) => [obbItem(B, frame(at3(o, [0, 0, 2.6]), [1, 0, 0], [0, 0, 1]), [22, 11, 0.9], '#5E6E7C', {key: `${k}c`, top: '#7B8B98'})]},
  {name: 'motorL', t: 15.62, from: [-30, 40, 30], draw: motor(1)},
  {name: 'motorR', t: 15.5, from: [-30, -40, 30], draw: motor(-1)},
  {name: 'wheelL', t: 16.06, from: [-9, 60, 10], draw: wheel(1, -9)},
  {name: 'wheelR', t: 15.94, from: [-9, -60, 10], draw: wheel(-1, -9)},
  {name: 'caster', t: 16.3, from: [40, 0, -10], draw: (B, o, k) => [cylinderItem(B, at3(o, [16, 0, 2.7]), at3(o, [16, 0, 1]), 2.2, '#8D99A4', {key: `${k}k`}), cylinderItem(B, at3(o, [16, 0, 1.8]), at3(o, [16, 0, 0.2]), 1.6, '#C9D2D9', {key: `${k}b`})]},
  {name: 'battery', t: 16.5, from: [0, 0, 40], draw: (B, o, k) => [obbItem(B, frame(at3(o, [1.5, 0, 6.4]), [1, 0, 0], [0, 0, 1]), [7, 6, 2.9], '#3E5C8A', {key: `${k}bt`, top: '#5577AA'})]},
  {name: 'board', t: 16.8, from: [10, 0, 48], draw: (B, o, k) => [obbItem(B, frame(at3(o, [6, 0, 9.8]), [1, 0, 0], [0, 0, 1]), [9, 8, 0.5], '#17806E', {key: `${k}pc`}), obbItem(B, frame(at3(o, [6, 1.5, 10.7]), [1, 0, 0], [0, 0, 1]), [2.4, 2.4, 0.4], '#1A2028', {key: `${k}ch`})]},
  {name: 'sensor', t: 17.08, from: [50, 0, 20], draw: (B, o, k) => [obbItem(B, frame(at3(o, [20.6, 0, 5.7]), [1, 0, 0], [0, 0, 1]), [1.4, 6, 2.2], '#1A2028', {key: `${k}s`}), cylinderItem(B, at3(o, [22.0, 3, 5.7]), at3(o, [22.8, 3, 5.7]), 1.3, '#2E6C8A', {key: `${k}l1`}), cylinderItem(B, at3(o, [22.0, -3, 5.7]), at3(o, [22.8, -3, 5.7]), 1.3, '#2E6C8A', {key: `${k}l2`})]},
];
/** a part's offset from its seat at time t: flies in over 0.3 s with a small settle */
export const FLY = 0.4, FAR = 3.2;
export const partOff = (p: Part, t: number): V3 => {
  const u = clamp((t - (p.t - FLY)) / FLY);
  const e = 1 - Math.pow(1 - u, 3);
  // the seat bump: the part settles DOWN onto its support (never through it)
  const settle = t > p.t ? 0.6 * Math.exp(-(t - p.t) / 0.05) * Math.abs(Math.sin((t - p.t) * 60)) : 0;
  // every part drops in from above the frame (V4's side approaches could start behind the close camera and fly through it)
  return [0, 0, FAR * 30 * (1 - e) + settle];
};
const partAlpha = (p: Part, t: number) => (t >= p.t - FLY ? 1 : 0);

// the insect after the match cut: walks +x along the bench, the camera on its right side
const BUGP: Path = {p0: [-80, 0, 0], yaw0: 0, segs: [{len: 4000}]};
const bugS = (t: number) => 34 * Math.max(0, t - 17.3);
export const bugD = (t: number) => {
  const st = walkState(BUGP, bugS(t), {antTw: [20 + 6 * Math.sin(t * 2.6), 20 - 6 * Math.sin(t * 2.6)], antLift: [16, 14], headPitch: -4, breathe: 0.5});
  return {st: withPoles(st), pack: {F: seat5(st.body), led: 0.9, hook: 1, batt: 0} as Pack2};
};

// close tracking on each part as it seats; the robot is ~46 mm long, framed at 18-30 px/mm
export const camBuild = (t: number) => chain(t, () => at(add3(RB, [0, 0, 3]), 40, 36, 20, 1000), [
  {a: 15.22, b: 15.62, o: () => at(add3(RB, [-8, -8, 6]), 30, 24, 31, 1000)}, // gear motors
  {a: 15.7, b: 16.1, o: () => at(add3(RB, [-9, -13, 6]), 18, 16, 30, 1000)}, // wheels
  {a: 16.2, b: 16.62, o: () => at(add3(RB, [0, -2, 9]), 52, 40, 25, 1000)}, // battery, controller
  {a: 16.78, b: 17.12, o: () => at(add3(RB, [12, -2, 8]), 76, 30, 22, 1000)}, // sensor, the whole robot
  {a: 17.2, b: 17.93, o: () => at(add3(RB, [-9, -16, 7]), 22, 10, 30, 960)}, // onto the spinning wheel
]);
// after the match cut: close on the near legs mid-stride, travelling with the insect, then back to the whole insect
const camBug = (t: number) => chain(t, (tt) => at(add3(bugD(tt).st.body.o, [2, -14, 5]), 0, 8, 30, 960), [
  {a: 18.55, b: 19.9, o: (tt) => at(add3(bugD(tt).st.body.o, [0, 0, 8]), 14, 30, 10.5, 1000)},
]);

/** a brief glint where a part seats (no text) */
const glint = (B: Basis, p: V3, t: number, t0: number, k: string): Item | null => {
  const u = (t - t0) / 0.22;
  if (u < 0 || u > 1) return null;
  const P = proj(B, p);
  const r = (10 + 40 * u) * Math.min(1.4, P.s / 20);
  return {z: P.z - 50, el: <circle key={k} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={r.toFixed(1)} fill="none" stroke="#E8F6FF" strokeWidth={(5 * (1 - u) + 1).toFixed(1)} opacity={(0.8 * (1 - u)).toFixed(2)} />};
};
const SEATPT: Record<string, V3> = {chassis: [0, 0, 3.5], motorL: [-9, 11, 7], motorR: [-9, -11, 7], wheelL: [-9, 16.8, 7], wheelR: [-9, -16.8, 7], battery: [1.5, 0, 9.3], board: [6, 0, 10.3], sensor: [22, 0, 5.7]};

export const Build5: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  resetRoachIds(fkey + 'r');
  const isBuild = t < MC3;
  const O = isBuild ? camBuild(t) : camBug(t);
  const B = basis(cam(O));
  const items: Item[] = [];
  if (isBuild) {
    const spin = t > 17.2 ? (t - 17.2) * 14 : 0;
    PARTS.forEach((p) => {
      const a = partAlpha(p, t);
      if (a <= 0.01) return;
      const o = add3(RB, partOff(p, t));
      p.draw(B, o, p.name, spin).forEach((it) => items.push({z: it.z, el: <g key={`${p.name}${items.length}`} opacity={a}>{it.el}</g>}));
    });
    PARTS.forEach((p) => { const sp = SEATPT[p.name]; const g = sp && glint(B, add3(RB, sp), t, p.t, `gl${p.name}`); if (g) items.push(g); });
  } else {
    const b = bugD(t);
    items.push(cyborgGroup5(B, b.st, b.pack, 'bd', {parts: (BB, p: Pack2, k) => packParts2(BB, p, k), rim: {c: '#8FD6E6', k: 0.55}}).item);
  }
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${fkey}wl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081019" /><stop offset="1" stopColor="#13222E" /></linearGradient>
          <radialGradient id={`${fkey}vg`} cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stopColor="#04090E" stopOpacity="0" /><stop offset="1" stopColor="#04090E" stopOpacity="0.62" /></radialGradient>
          <filter id={`${fkey}sb`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${fkey}wl)`} />
        {benchEl2(B, `${fkey}bench`)}
        {isBuild && t > 14.95 && <path d={projPolyClip(B, [[-25, -19, 0.1], [26, -19, 0.1], [26, 19, 0.1], [-25, 19, 0.1]].map((q) => add3(RB, q as V3)), 4)} fill="#02060A" opacity={(0.45 * ss(t, 14.95, 15.1)).toFixed(2)} filter={`url(#${fkey}sb)`} />}
        {items.filter((i) => i.z > 8).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
        <rect width={1080} height={1920} fill={`url(#${fkey}vg)`} />
      </svg>
    </div>
  );
};
export {P2, capsuleItem, sub3};
