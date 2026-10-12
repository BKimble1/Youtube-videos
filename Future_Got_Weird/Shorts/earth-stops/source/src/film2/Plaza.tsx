import React from 'react';
import {C} from '../theme';
import {Puff} from '../v2/Fx2';
import {GYW} from '../v2/choreo2';
import {cl, sm} from './ui';

/**
 * Loose things for B03. Every one leaves at the SAME starting speed V0P (the ground's old speed); friction then takes each one down at its own rate (tau, frames).
 * Two small props and the bicycle: a chair that tips over backwards, a cardboard box that tumbles end over end, a bicycle that rolls on with its wheels spinning.
 */
export const V0P = 15; // world px per frame at the instant of the stop (about 16.5 px/frame on screen at the plaza camera)
export const OBJ_S = 1.5;
const OL = 4;
export const slideX = (x0: number, tau: number, t: number) => (t <= 0 ? x0 : x0 + V0P * tau * (1 - Math.exp(-t / tau)));

export const Chair: React.FC = () => (
  <g>
    <path d="M -36 -66 L -40 -128 Q -40 -136 -30 -136 L -22 -136 L -20 -66" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -36 -66 L -40 -128 Q -40 -136 -30 -136 L -22 -136 L -20 -66" fill="none" stroke={C.teal} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    <rect x={-44} y={-84} width={92} height={18} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={OL} />
    {[-36, 36].map((x) => <line key={x} x1={x} y1={-66} x2={x + (x < 0 ? -4 : 4)} y2={0} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />)}
    {[-36, 36].map((x) => <line key={x} x1={x} y1={-66} x2={x + (x < 0 ? -4 : 4)} y2={0} stroke={C.tealDeep} strokeWidth={3.5} strokeLinecap="round" />)}
  </g>
);
export const Box: React.FC = () => (
  <g>
    <rect x={-46} y={-76} width={92} height={76} fill={C.woodLight} stroke={C.ink} strokeWidth={OL} />
    <rect x={-8} y={-76} width={16} height={76} fill={C.cream} opacity={0.75} />
    <path d="M -46 -76 L -34 -88 L 58 -88 L 46 -76 Z" fill={C.wood} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M -30 -34 h 22 M -30 -22 h 14" stroke={C.woodDeep} strokeWidth={4} strokeLinecap="round" />
  </g>
);

export const PLAZA_OBJ = {
  chair: {x0: 2335, tau: 26, tip0: 5, tip1: 22},
  box: {x0: 2130, tau: 46, lift: 0},
  bike: {x0: 1750, tau: 420},
};

export const chairState = (t: number) => {
  const o = PLAZA_OBJ.chair;
  const x = slideX(o.x0, o.tau, t);
  const k = sm((t - o.tip0) / (o.tip1 - o.tip0));
  const bounce = t > o.tip1 ? 5 * Math.exp(-(t - o.tip1) / 5) * Math.abs(Math.sin((t - o.tip1) * 0.9)) : 0;
  return {x, rot: 84 * k + (t > o.tip1 ? -3 * Math.exp(-(t - o.tip1) / 8) * Math.sin((t - o.tip1) * 0.9) : 0), lift: bounce};
};
export const boxState = (t: number) => {
  const o = PLAZA_OBJ.box;
  const x = slideX(o.x0, o.tau, t);
  const rot = ((x - o.x0) / (92 * OBJ_S)) * 90; // rolls over one side per box width
  const r = (rot * Math.PI) / 180;
  const lift = t > 0 ? 38 * (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)) - 1) * Math.min(1, t / 6) : 0;
  return {x, rot, lift};
};
export const bikeState = (t: number) => {
  const o = PLAZA_OBJ.bike;
  const x = slideX(o.x0, o.tau, t);
  const wob = t > 0 ? 3.2 * Math.exp(-t / 24) * Math.sin(t * 0.42) : 0;
  return {x, ang: ((x - o.x0) / 92) * (180 / Math.PI), tilt: 6.5 * (1 - sm(t / 10)) + 1.5 + wob};
};

export const PlazaProps: React.FC<{t: number}> = ({t}) => {
  const ch = chairState(t), bx = boxState(t);
  const puffs: React.ReactNode[] = [];
  [['c', PLAZA_OBJ.chair.x0, 0], ['b', PLAZA_OBJ.box.x0, 1]].forEach(([k, x0, oi]) => {
    for (let e = 0; e < 26; e += 5) {
      const age = t - e;
      if (age < 0 || age > 20) continue;
      const px = slideX(x0 as number, k === 'c' ? PLAZA_OBJ.chair.tau : PLAZA_OBJ.box.tau, e) - 20;
      puffs.push(<g key={`p${k}${e}`} transform={`translate(${px} ${GYW - 14}) scale(0.62) translate(${-px} ${-(GYW - 14)})`}><Puff x={px} y={GYW - 14} age={age} seed={(oi as number) * 13 + e} /></g>);
    }
  });
  return (
    <g>
      {t > 0 && <path d={`M ${PLAZA_OBJ.chair.x0 - 20} ${GYW - 2} L ${ch.x - 20} ${GYW - 2}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={0.2 * cl(1 - t / 90)} />}
      {puffs}
      <g transform={`translate(${ch.x} ${GYW - ch.lift}) scale(${OBJ_S}) rotate(${ch.rot} 36 0)`}>
        <ellipse cx={0} cy={3} rx={54} ry={9} fill={C.shadow} />
        <Chair />
      </g>
      <g transform={`translate(${bx.x} ${GYW - OBJ_S * (38 + bx.lift)}) rotate(${bx.rot}) scale(${OBJ_S}) translate(0 38)`}>
        <Box />
      </g>
    </g>
  );
};
