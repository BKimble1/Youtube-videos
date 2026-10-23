// Small shared drawings: hands, shoes, the paper cup and the sheet of paper.
import React from 'react';
import {Pt, f3} from '../lib3';
import {C} from '../theme3';

// a relaxed hand at `p` (wrist end), pointing along `ang` degrees (0 = +x); `side` mirrors the thumb
export const Hand: React.FC<{p: Pt; ang: number; skin: string; deep: string; s?: number; side?: 1 | -1; grip?: number}> = ({p, ang, skin, deep, s = 1, side = 1, grip = 0}) => (
  <g transform={`translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(ang)}) scale(${s} ${s * side})`}>
    <path d={`M-6 -26 C30 -34 66 -26 ${78 - 14 * grip} -8 C${84 - 16 * grip} 8 ${70 - 12 * grip} 28 40 30 C14 32 -8 26 -12 10 C-14 -4 -12 -18 -6 -26 Z`} fill={skin} stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
    <path d={`M18 -24 C34 -46 58 -46 ${60 - 8 * grip} -30`} fill={skin} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M40 4 C52 8 62 10 70 8" fill="none" stroke={deep} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
  </g>
);

// a shoe whose ankle is at `a`, toe toward `dir` (+1 right, -1 left), pitched by `pitch` degrees about the ankle
export const Shoe: React.FC<{a: Pt; dir: 1 | -1; pitch?: number; fill: string; sole?: string; s?: number}> = ({a, dir, pitch = 0, fill, sole = '#E2DCCF', s = 1}) => (
  <g transform={`translate(${f3(a.x)} ${f3(a.y)}) rotate(${f3(pitch * dir)}) scale(${dir * s} ${s})`}>
    <path d="M-52 -34 C-30 -52 40 -48 92 -26 C140 -10 158 18 150 44 L-58 44 C-70 20 -66 -18 -52 -34 Z" fill={fill} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
    <path d="M-60 34 L152 34 L150 46 C100 54 -10 54 -58 46 Z" fill={sole} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M20 -40 C34 -26 50 -22 66 -24" fill="none" stroke={C.ink} strokeWidth={2.6} opacity={0.5} strokeLinecap="round" />
  </g>
);

// the Crew paper cup (from the Contacts train table: cream cup with a teal band), base centre at the origin
export const Cup: React.FC<{p: Pt; ang?: number; s?: number}> = ({p, ang = 0, s = 1}) => (
  <g transform={`translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(ang)}) scale(${s})`}>
    <path d="M-62 -150 L62 -150 L50 0 L-50 0 Z" fill="#F4EFE3" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-59 -118 L59 -118 L56 -84 L-56 -84 Z" fill={C.teal} />
    <path d="M-66 -158 L66 -158 L64 -146 L-64 -146 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
    <path d="M-40 -136 L-32 -16" stroke="#FFFFFF" strokeWidth={8} opacity={0.6} strokeLinecap="round" />
  </g>
);
