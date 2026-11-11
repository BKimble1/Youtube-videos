// The electronic backpack, in its own frame (x forward, y left, z up; mm; origin at the middle of the board's
// underside). Built from the NTU description: a small wireless stimulator board (microcontroller + radio), a tiny
// battery, a status LED, a pair of fine electrodes at the front (a bipolar pair that goes under the rear edge of the
// pronotum) and hook-like mounting branches at the back that grip the metathorax. About 13 x 15 mm (a fingernail
// patch, as wide as the middle of the thorax); 2.3 g in the paper. When seated, its frame is the body frame moved to
// PACK_SEAT, so it moves rigidly with the insect.
import React from 'react';
import {add3, Basis, lerp3, mul3, P2, proj, V3} from '../core/three';
import {capsuleItem, cylinderItem, Item} from '../core/draw3';
import {obbItem} from '../core/obb';
import {lit, mix, rgba} from '../core/color';
import {INK} from '../core/ink';
import {Frame, toW} from '../core/frame';

export const PACK = {hx: 6.4, hy: 7.4, hz: 0.55};
export const PCB = '#17795E';
export const PCB_TRACE = '#E7C15A';
export const CHIP = '#1D232B';
export const BATT = '#8FA9C4';
export const WIRE = '#D9DEE3';
export const PULSE = '#5CF2FF';
export const LED_ON = '#59FF9C';

const f2 = (n: number) => n.toFixed(2);

export type PackState = {
  F: Frame; // the pack frame
  led: number; // 0..1
  hook: number; // 0 open (flared) .. 1 clipped
  pulse?: {t: number; side: 1 | -1 | 0}; // pulse travel 0..1 along the electrode, which side
  glow?: number; // label highlight 0..1 on the components
};

const ELEC = (s: number, hook: number): V3[] => [
  [3.6, 2.3 * s, 0.1],
  [5.6, 2.3 * s, -0.4],
  [7.0, 2.2 * s, -2.2],
  [7.7 + 0.0 * hook, 2.2 * s, -3.6],
];
const HOOKP = (s: number, hook: number): V3[] => {
  const fl = 1 - hook;
  return [
    [-5.6, 6.6 * s, 0.0],
    [-5.8, (11.0 + 1.8 * fl) * s, -1.0],
    [-5.9, (13.6 + 2.6 * fl) * s, -3.4 + 1.2 * fl],
    [-5.6, (13.1 + 3.4 * fl) * s, -5.6 + 2.2 * fl],
  ];
};

/** world points along an electrode (for pulse effects and labels) */
export const electrodePts = (P: PackState, s: 1 | -1) => ELEC(s, P.hook).map((p) => toW(P.F, p));
export const packPt = (P: PackState, p: V3) => toW(P.F, p);
export const PACK_PTS = {chip: [1.6, 2.4, 1.2] as V3, batt: [-3.0, -2.6, 2.0] as V3, led: [4.4, -5.0, 1.0] as V3, elec: [7.2, 2.2, -2.6] as V3, ant: [-6.0, 5.4, 4.5] as V3, hook: [-5.9, 13.4, -3.0] as V3};

export const packItems = (B: Basis, P: PackState, key = 'pk'): Item[] => {
  const {main, elec} = packParts(B, P, key);
  return [...main, ...elec];
};
/** the pack split into its body (board, parts, hooks, pulse) and the electrodes (which tuck under the pronotum) */
export const packParts = (B: Basis, P: PackState, key = 'pk', o: {camera?: boolean} = {}): {main: Item[]; elec: Item[]} => {
  const F = P.F;
  const W = (p: V3) => toW(F, p);
  const items: Item[] = [];
  const elec: Item[] = [];
  // board: a thin box, top face green with gold traces and pads
  const board = obbItem(B, {...F, o: W([0, 0, PACK.hz])}, [PACK.hx, PACK.hy, PACK.hz], PCB, {key: `${key}b`});
  const traces: V3[][] = [
    [[-5.5, 5.8, 1.12], [-1.0, 5.8, 1.12], [0.4, 4.4, 1.12]],
    [[5.6, 0.6, 1.12], [3.6, 0.6, 1.12], [3.0, 0.0, 1.12], [-0.6, 0.0, 1.12]],
    [[5.6, -0.6, 1.12], [4.2, -2.4, 1.12], [4.2, -4.4, 1.12]],
    [[-5.8, -6.0, 1.12], [-0.4, -6.0, 1.12]],
    [[2.4, -1.0, 1.12], [2.4, -6.4, 1.12]],
  ];
  const s0 = proj(B, W([0, 0, 1])).s;
  items.push({
    z: board.z,
    el: (
      <g key={`${key}bg`}>
        {board.el}
        {traces.map((tr, i) => (
          <path key={i} d={`M${tr.map((p) => P2(proj(B, W(p)))).join(' L')}`} fill="none" stroke={PCB_TRACE} strokeWidth={f2(Math.max(0.7, 0.32 * s0))} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        ))}
        {[[5.7, 2.3], [5.7, -2.3], [-5.4, 6.4], [-5.4, -6.4]].map(([x, y], i) => {
          const c = proj(B, W([x, y, 1.12]));
          return <circle key={`p${i}`} cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(1, 0.55 * s0))} fill={lit(PCB_TRACE, 0.2)} stroke={INK} strokeWidth={f2(Math.max(0.5, 0.12 * s0))} />;
        })}
      </g>
    ),
  });
  // chip (microcontroller + radio), with its pins
  const chip = obbItem(B, {...F, o: W([1.6, 2.4, 1.55])}, [2.7, 2.7, 0.45], CHIP, {key: `${key}c`});
  const dot = proj(B, W([0.0, 3.8, 2.02]));
  items.push({z: chip.z - 0.01, el: <g key={`${key}cg`}>{chip.el}<circle cx={f2(dot.x)} cy={f2(dot.y)} r={f2(Math.max(0.6, 0.3 * s0))} fill="#55606C" /></g>});
  // small passives
  [[-1.6, -6.0], [4.6, 4.9], [-4.6, 1.6]].forEach(([x, y], i) => items.push(obbItem(B, {...F, o: W([x, y, 1.45])}, [0.7, 0.45, 0.35], i === 1 ? '#C8B48A' : '#3A4652', {key: `${key}r${i}`})));
  // battery (a tiny pouch cell)
  items.push(obbItem(B, {...F, o: W([-3.0, -2.6, 2.05])}, [2.9, 3.3, 0.95], BATT, {key: `${key}bt`, top: lit(BATT, 0.25)}));
  // status LED
  const ledC = W([4.4, -5.0, 1.35]);
  const lp = proj(B, ledC);
  const ledCol = mix('#2E5A3E', LED_ON, P.led);
  items.push({
    z: lp.z - 0.05,
    el: (
      <g key={`${key}led`}>
        {P.led > 0.02 && <circle cx={f2(lp.x)} cy={f2(lp.y)} r={f2(lp.s * 4.2)} fill={rgba(LED_ON, 0.28 * P.led)} style={{filter: `blur(${f2(lp.s * 1.2)}px)`}} />}
        {obbItem(B, {...F, o: ledC}, [0.8, 0.55, 0.38], ledCol, {key: `${key}ledb`}).el}
        {P.led > 0.02 && <circle cx={f2(lp.x)} cy={f2(lp.y - lp.s * 0.2)} r={f2(lp.s * 0.6)} fill="#FFFFFF" opacity={0.85 * P.led} />}
      </g>
    ),
  });
  // antenna whip: up from the back corner, swept back
  const ant: V3[] = [[-5.6, 5.4, 1.1], [-6.2, 5.6, 4.2], [-9.0, 5.8, 6.0], [-14.0, 6.0, 6.6]];
  for (let i = 0; i < ant.length - 1; i++) items.push(capsuleItem(B, W(ant[i]), W(ant[i + 1]), 0.32, 0.3, '#2B3138', {key: `${key}an${i}`, spec: 0.5}));
  // electrodes (fine silver wires, bipolar pair) and mounting hooks
  ([1, -1] as const).forEach((s) => {
    const e = ELEC(s, P.hook);
    for (let i = 0; i < e.length - 1; i++) elec.push(capsuleItem(B, W(e[i]), W(e[i + 1]), 0.34, 0.24, WIRE, {key: `${key}e${s}${i}`, spec: 0.8}));
    const h = HOOKP(s, P.hook);
    for (let i = 0; i < h.length - 1; i++) items.push(capsuleItem(B, W(h[i]), W(h[i + 1]), 0.5, 0.42, '#C7CDD3', {key: `${key}h${s}${i}`, spec: 0.7}));
  });
  // a pulse travelling down an electrode toward its tip
  if (P.pulse && P.pulse.t > 0 && P.pulse.t < 1.25) {
    const sides: (1 | -1)[] = P.pulse.side === 0 ? [1, -1] : [P.pulse.side];
    sides.forEach((s) => {
      const e = ELEC(s, P.hook).map(W);
      const u = Math.min(1, P.pulse!.t);
      const seg = u * (e.length - 1);
      const k = Math.min(e.length - 2, Math.floor(seg));
      const p = lerp3(e[k], e[k + 1], seg - k);
      const q = proj(B, p);
      const fade = P.pulse!.t > 1 ? 1 - (P.pulse!.t - 1) / 0.25 : 1;
      const tip = proj(B, e[e.length - 1]);
      elec.push({
        z: q.z - 3,
        el: (
          <g key={`${key}pz${s}`} opacity={fade}>
            <path d={`M${e.slice(0, k + 1).map((w) => P2(proj(B, w))).join(' L')} L${P2(q)}`} fill="none" stroke={PULSE} strokeWidth={f2(q.s * 0.7)} strokeLinecap="round" opacity={0.9} style={{filter: `drop-shadow(0 0 ${f2(q.s * 1.4)}px ${PULSE})`}} />
            <circle cx={f2(q.x)} cy={f2(q.y)} r={f2(q.s * 1.1)} fill="#FFFFFF" style={{filter: `drop-shadow(0 0 ${f2(q.s * 2)}px ${PULSE})`}} />
            {P.pulse!.t >= 0.95 && <circle cx={f2(tip.x)} cy={f2(tip.y)} r={f2(tip.s * (1.5 + 3 * Math.min(1, (P.pulse!.t - 0.95) / 0.3)))} fill="none" stroke={PULSE} strokeWidth={f2(tip.s * 0.5)} opacity={0.8 * fade} />}
          </g>
        ),
      });
    });
  }
  // first-generation field backpack: a tiny forward-looking camera module (the Myanmar units carried IR cameras)
  if (o.camera) {
    items.push(obbItem(B, {...F, o: W([3.4, -3.2, 2.2])}, [2.0, 1.8, 1.1], '#1A1F25', {key: `${key}cm`}));
    items.push(cylinderItem(B, W([5.3, -3.2, 2.3]), W([6.2, -3.2, 2.3]), 0.9, '#0D1115', {key: `${key}cl`, cap: '#B0402F'}));
  }
  return {main: items, elec};
};
/** the pack frame seated on a roach body frame */
export const seatFrame = (body: Frame, seat: V3, scale = 1): Frame => ({...body, o: toW(body, mul3(seat, scale))});
export {add3};
