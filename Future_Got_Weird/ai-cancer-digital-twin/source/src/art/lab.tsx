// Laboratory and clinic props: a restrained lab mouse in a cage, the designed binder protein, the engineered immune
// cell's receptor, and the clinician's look (reuses the channel's cutout character rig).
import React from 'react';
import {C, M} from '../theme';
import {blob, clamp01, lerp, mixHex, noise, smooth} from '../kit/core';
import {Helix} from './molecules';
import type {Look} from '../components/Character';

const INK = C.ink;

export const CLINICIAN: Look = {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: C.tealLight, overlay: 'jacket', overlayColor: '#FFFFFF', pants: '#2E3F5C', shoes: '#2B2B33', accessories: ['glasses']};
export const RESEARCHER: Look = {skin: '#F2C9A8', hair: 'crop', hairColor: '#6B4A2B', shirt: C.blueLight, overlay: 'jacket', overlayColor: '#FFFFFF', pants: '#3F5560', shoes: '#2B2B33', accessories: []};
export const PERSON: Look = {skin: '#C98B5E', hair: 'curly', hairColor: '#2B1E16', shirt: C.saffron, pants: '#3F5560', shoes: '#2B2B33', accessories: []};

/** Lab mouse, side view, facing right; origin at the feet centre. tumor: flank bump size 0..1. sniff animates. */
export const Mouse: React.FC<{tumor?: number; t?: number; s?: number; seed?: number}> = ({tumor = 0.5, t = 0, s = 1, seed = 0}) => {
  const sniff = Math.sin(t * 9 + seed) * 1.5;
  const breathe = 1 + Math.sin(t * 4 + seed) * 0.015;
  return (
    <g transform={`scale(${s})`}>
      {/* tail */}
      <path d={`M -58 -20 C -100 -10 -110 ${-40 + noise(t, seed) * 6} -150 ${-28 + noise(t * 0.7, seed + 2) * 8}`} fill="none" stroke="#E7A9A3" strokeWidth={5} strokeLinecap="round" />
      <path d={`M -58 -20 C -100 -10 -110 ${-40 + noise(t, seed) * 6} -150 ${-28 + noise(t * 0.7, seed + 2) * 8}`} fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      {/* body */}
      <g transform={`scale(1 ${breathe})`}>
        <path d="M -66 -14 C -70 -52 -30 -70 10 -64 C 46 -60 62 -44 70 -30 C 74 -16 50 -6 20 -6 L -50 -6 C -62 -6 -66 -10 -66 -14 Z" fill="#F4F1EC" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* flank tumour (subcutaneous bump) */}
        {tumor > 0.01 && <path d={blob(-14, -50 - 6 * tumor, 9 + 16 * tumor, seed + 3, 0, 0.12, 10, 1.1, 0.8)} fill="#E8B4B0" stroke={INK} strokeWidth={3} />}
      </g>
      {/* head */}
      <g transform={`translate(58 -36) rotate(${sniff})`}>
        <path d="M -12 -22 C 10 -26 30 -14 40 -2 C 34 8 14 12 -4 10 C -16 6 -18 -14 -12 -22 Z" fill="#F4F1EC" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={-4} cy={-26} rx={12} ry={14} fill="#F4F1EC" stroke={INK} strokeWidth={4} />
        <ellipse cx={-4} cy={-26} rx={6} ry={8} fill="#F2B7B4" />
        <circle cx={14} cy={-8} r={3.5} fill={INK} />
        <circle cx={40} cy={-1} r={4} fill="#E58C8C" stroke={INK} strokeWidth={2} />
        {[-4, 0, 4].map((dy, i) => <line key={i} x1={36} y1={2 + dy * 0.4} x2={54} y2={dy * 2 + noise(t * 3 + i, seed) * 1.5} stroke={INK} strokeWidth={1.2} opacity={0.7} />)}
      </g>
      {/* feet */}
      {[-40, -16, 24, 44].map((x, i) => <ellipse key={i} cx={x} cy={-4} rx={8} ry={4} fill="#F2B7B4" stroke={INK} strokeWidth={2} />)}
    </g>
  );
};

/** Clear lab cage with bedding (local origin = bottom centre). Children render inside. */
export const Cage: React.FC<{w?: number; h?: number; children?: React.ReactNode; tag?: string}> = ({w = 420, h = 230, children, tag}) => (
  <g>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={14} fill="#DDEFF2" opacity={0.55} stroke={INK} strokeWidth={5} />
    <path d={`M ${-w / 2 + 8} -6 Q ${-w / 4} -26 0 -16 Q ${w / 4} -28 ${w / 2 - 8} -8 L ${w / 2 - 8} -4 L ${-w / 2 + 8} -4 Z`} fill="#E9D2A0" stroke={INK} strokeWidth={3} />
    {children}
    {/* lid bars */}
    <rect x={-w / 2 - 10} y={-h - 18} width={w + 20} height={22} rx={8} fill="#8FA3AD" stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <line key={i} x1={-w / 2 + 20 + i * ((w - 40) / 8)} y1={-h - 14} x2={-w / 2 + 20 + i * ((w - 40) / 8)} y2={-h + 2} stroke={INK} strokeWidth={3} />)}
    <rect x={-w / 2} y={-h} width={w} height={h} rx={14} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={3} transform="translate(6 6) scale(0.97)" />
    {tag && <rect x={w / 2 - 74} y={-h + 18} width={56} height={40} rx={6} fill={tag} stroke={INK} strokeWidth={4} />}
  </g>
);

/** A small designed binder protein: three short helices in a bundle with loops (yellow), local origin at centre.
 *  morph varies the helix lengths/angles (design iterations). */
export const Binder: React.FC<{s?: number; morph?: number; seed?: number; color?: string; t?: number}> = ({s = 1, morph = 0, seed = 0, color = M.car, t = 0}) => {
  const L = (i: number) => 64 + 18 * Math.sin(morph * 3 + i * 2 + seed);
  const ang = (i: number) => -8 + 10 * Math.sin(morph * 2.3 + i + seed);
  const deep = mixHex(color, '#B07A10', 0.6);
  return (
    <g transform={`scale(${s})`}>
      <path d={`M ${-L(0) / 2 + 2} -20 C -52 -6 -52 6 ${-L(1) / 2 + 2} 2 M ${L(1) / 2 - 2} 2 C 52 10 52 22 ${L(2) / 2 - 2} 24`} fill="none" stroke={deep} strokeWidth={5} strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${-L(i) / 2} ${-20 + i * 22}) rotate(${ang(i)} ${L(i) / 2} 0)`}>
          <Helix L={L(i)} d={18} phase={t * 0.2 + i} fill={color} deep={deep} lw={2} />
        </g>
      ))}
    </g>
  );
};

/** The engineered immune-cell receptor (CAR) on a membrane at y = 0 (outside = up): stalk + designed binder tip. */
export const CarReceptor: React.FC<{s?: number; t?: number; seed?: number; bound?: number}> = ({s = 1, t = 0, seed = 0, bound = 0}) => {
  const sway = noise(t * 0.6, seed) * 8 * (1 - bound);
  return (
    <g transform={`scale(${s})`}>
      <rect x={-3.5} y={-12} width={7} height={34} rx={3.5} fill={M.tcellDeep} stroke={INK} strokeWidth={1.4} />
      <g transform={`rotate(${sway} 0 -10)`}>
        <rect x={-4} y={-46} width={8} height={36} rx={4} fill={M.tcell} stroke={INK} strokeWidth={1.4} />
        <g transform="translate(0 -62) rotate(90) scale(0.42)"><Binder seed={seed} /></g>
      </g>
      {/* intracellular signalling tail */}
      <rect x={-6} y={20} width={12} height={20} rx={5} fill={mixHex(M.tcellDeep, M.signal, bound)} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

/** A tumour-surface antigen for the CAR (distinct shape: a rounded knob on a stalk). */
export const Antigen: React.FC<{s?: number; t?: number; seed?: number}> = ({s = 1, t = 0, seed = 0}) => (
  <g transform={`scale(${s}) rotate(${noise(t * 0.5, seed) * 6})`}>
    <rect x={-3.5} y={-14} width={7} height={30} rx={3.5} fill={M.tumorDeep} stroke={INK} strokeWidth={1.4} />
    <path d={blob(0, -30, 14, seed + 4, t, 0.12, 9)} fill="#E58FB0" stroke={INK} strokeWidth={1.6} />
  </g>
);

/** Lab bench with a few instruments (local origin at the bench-top centre). */
export const Bench: React.FC<{w?: number}> = ({w = 1400}) => (
  <g>
    <rect x={-w / 2} y={0} width={w} height={36} rx={8} fill="#B9C6CC" stroke={INK} strokeWidth={5} />
    <rect x={-w / 2 + 30} y={36} width={w - 60} height={300} fill="#93A5AE" stroke={INK} strokeWidth={5} />
  </g>
);

/** A pipette + tube rack, quick lab dressing (local origin at the base). */
export const TubeRack: React.FC<{t?: number}> = ({t = 0}) => (
  <g>
    <rect x={-80} y={-36} width={160} height={36} rx={6} fill="#4F7CC9" stroke={INK} strokeWidth={4} />
    {[-54, -18, 18, 54].map((x, i) => (
      <g key={i}>
        <rect x={x - 10} y={-96} width={20} height={70} rx={10} fill="#FFFFFF" fillOpacity={0.8} stroke={INK} strokeWidth={3} />
        <rect x={x - 7} y={-60} width={14} height={30} rx={7} fill={[M.dna, M.peptide, M.dna, M.wire][i]} />
      </g>
    ))}
  </g>
);

export const mixC = mixHex;
export const sm = smooth;
export const c01 = clamp01;
export const lp = lerp;

import {Character, Pose} from '../components/Character';
/** The channel's cutout character placed inside an SVG world: ground point at (x, y), height ≈ 440·scale. */
export const Person: React.FC<{look: Look; pose: Pose; t: number; x: number; y: number; scale?: number; seed?: number; flip?: boolean; life?: number}> = ({look, pose, t, x, y, scale = 1, seed = 1, flip = false, life = 1}) => (
  <g transform={`translate(${x - 200 * scale} ${y - 500 * scale}) scale(${scale})`}>
    <Character look={look} pose={pose} frame={Math.round(t * 30)} seed={seed} flip={flip} life={life} style={{position: 'static'}} />
  </g>
);

/** IV infusion: bag on a pole, drip chamber with falling drops, line to a taped cannula on a forearm (local origin =
 *  the cannula). */
export const Infusion: React.FC<{t: number; s?: number}> = ({t, s = 1}) => {
  const drop = (t * 1.6) % 1;
  return (
    <g transform={`scale(${s})`}>
      {/* pole and bag */}
      <line x1={-520} y1={-760} x2={-520} y2={260} stroke="#8FA3AD" strokeWidth={14} />
      <path d="M -600 -740 L -440 -740 L -440 -560 Q -440 -500 -520 -490 Q -600 -500 -600 -560 Z" fill="#E8F3FF" fillOpacity={0.9} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -596 -640 L -444 -640 L -444 -560 Q -444 -504 -520 -496 Q -596 -504 -596 -560 Z" fill={M.antibodyLight} />
      <rect x={-560} y={-720} width={80} height={44} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      {/* drip chamber */}
      <rect x={-540} y={-470} width={40} height={90} rx={14} fill="#FFFFFF" fillOpacity={0.7} stroke={INK} strokeWidth={5} />
      <circle cx={-520} cy={-460 + drop * 70} r={7} fill={M.antibodyLight} stroke={INK} strokeWidth={2} />
      <path d="M -520 -380 C -520 -200 -300 -160 -200 -120 C -100 -80 -40 -20 2 20" fill="none" stroke="#FFFFFF" strokeWidth={14} />
      <path d="M -520 -380 C -520 -200 -300 -160 -200 -120 C -100 -80 -40 -20 2 20" fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
      {/* forearm resting on an armrest: sleeve, forearm, hand */}
      <g transform="translate(-20 -10) scale(1.6)">
      <rect x={-420} y={120} width={980} height={70} rx={30} fill="#5B7A8A" stroke={INK} strokeWidth={6} />
      <path d="M -330 30 C -150 10 140 6 330 22 C 360 26 372 96 340 104 C 150 116 -150 124 -330 128 Z" fill="#C98B5E" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 330 18 C 380 4 440 10 470 34 C 492 52 490 92 466 106 C 430 124 372 120 336 104 Z" fill="#C98B5E" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 380 18 C 400 -6 432 -8 446 8" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M -420 6 L -300 16 L -290 136 L -420 146 Z" fill={C.saffron} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-46} y={-4} width={96} height={52} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={4} transform="rotate(-4)" />
      <circle cx={2} cy={20} r={8} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};
