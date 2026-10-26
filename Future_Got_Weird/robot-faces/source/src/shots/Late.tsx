// "But getting the mouth shape right leaves another problem. When should the face move? Imagine telling someone good
// news. They stare at you. You finish smiling. Then their smile switches on. Even a well-drawn expression can feel
// awkward when it arrives late." Back to the opening interaction (same set and geometry): the visitor tells his news,
// the robot stares, his smile completes, and only then does the robot's arrive, fast. A strip below plots the two
// smiles as they were animated, so the lag is visible as a gap.
import React from 'react';
import {Notebook} from '../art/Lab';
import {Tag, UI} from '../art/Ui';
import {INK} from '../dc/ink';
import {clamp, fmt} from '../dc/math';
import {camPath} from '../lib/cam';
import {pr} from '../lib/core';
import {K, robotAt, visitorAt} from '../state';
import {INT, IntSet} from './IntSet';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** a plot of the two smile values over a window (the film's own animation, not a measurement) */
export const SmilePlot: React.FC<{f: number; t0: number; t1: number; k: number; x: number; y: number; w: number; h: number; marks?: {t: number; label: string; color: string}[]; robotSmile?: (f: number) => number; personSmile?: (f: number) => number}> = ({f, t0, t1, k, x, y, w, h, marks = [], robotSmile, personSmile}) => {
  if (k <= 0.001) return null;
  const now = f / 30;
  const rs = robotSmile ?? ((ff: number) => robotAt(ff).smile);
  const ps = personSmile ?? ((ff: number) => visitorAt(ff).expr.smile);
  const row = (fn: (ff: number) => number, yy: number, color: string, lo: number, hi: number) => {
    const pts: string[] = [];
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const tt = t0 + ((t1 - t0) * i) / n;
      if (tt > now) break;
      const v = clamp((fn(Math.round(tt * 30)) - lo) / (hi - lo));
      pts.push(`${fmt(x + 170 + ((w - 190) * i) / n)},${fmt(yy - v * h)}`);
    }
    return pts.length > 1 ? <path d={`M${pts.join(' L')}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null;
  };
  const tx = (tt: number) => x + 170 + ((w - 190) * (tt - t0)) / (t1 - t0);
  return (
    <g opacity={k}>
      <rect x={x} y={y - 2 * h - 70} width={w} height={2 * h + 110} rx={18} fill={UI.paper} stroke={INK} strokeWidth={3} opacity={0.95} />
      <text x={x + 24} y={y - h - 40} fontFamily="Nunito Variable" fontWeight={800} fontSize={24} fill={INK}>Person</text>
      <text x={x + 24} y={y + 4} fontFamily="Nunito Variable" fontWeight={800} fontSize={24} fill={INK}>Robot</text>
      <line x1={x + 170} y1={y - h - 30} x2={x + w - 20} y2={y - h - 30} stroke="#D8D0BE" strokeWidth={2} />
      <line x1={x + 170} y1={y + 10} x2={x + w - 20} y2={y + 10} stroke="#D8D0BE" strokeWidth={2} />
      {row(ps, y - h - 30, UI.coral, 0.1, 1)}
      {row(rs, y + 10, UI.blue, 0.04, 0.96)}
      {marks.map((m, i) => (now >= m.t ? (
        <g key={i}>
          <line x1={fmt(tx(m.t))} y1={y - 2 * h - 50} x2={fmt(tx(m.t))} y2={y + 26} stroke={m.color} strokeWidth={3} strokeDasharray="7 6" />
          <text x={fmt(tx(m.t) + 8)} y={y - 2 * h - 30} fontFamily="Nunito Variable" fontWeight={800} fontSize={20} fill={m.color}>{m.label}</text>
        </g>
      ) : null))}
    </g>
  );
};

export const Late: React.FC<{f: number}> = ({f}) => {
  const cam = camPath(
    f,
    [
      [K.another, {x: 985, y: 410, z: 1.34}],
      [K.awkward, {x: 990, y: 440, z: 1.42}],
      [K.study24, {x: 990, y: 470, z: 1.3}],
    ],
    ease,
  );
  const plotK = pr(f, K.awkward - 0.2, K.awkward + 0.3);
  return (
    <g>
      <IntSet id="lt" cam={cam} robot={robotAt(f)} vis={visitorAt(f)} onBench={<Notebook x={1180} y={INT.benchY + 40} rot={-6} />} />
      <Tag x={70} y={90} text="Illustration" k={pr(f, K.news - 0.3, K.news + 0.1)} size={26} />
      <SmilePlot f={f} t0={K.news - 0.5} t1={K.study24 - 0.3} k={plotK} x={330} y={1010} w={1260} h={60} marks={[{t: K.switchOn + 0.55, label: 'late', color: UI.coral}]} />
    </g>
  );
};
