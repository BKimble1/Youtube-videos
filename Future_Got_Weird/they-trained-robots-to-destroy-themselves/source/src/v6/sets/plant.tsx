// SET-PLANT (V5): a generic car-parts line in the channel's light palette (no real plant or brand is depicted).
// An overhead hanger line runs left → right at HOOK_Y; door panels hang from it by a tab. Floor at 1000.
import React from 'react';
import {C} from '../../theme';
import {BCOL} from '../../v4/sets/bay';

export const PL = {floor: 1000, railY: 290};
const INK = BCOL.ink;

/** A door panel standing upright, drawn around its centre; the hanging tab (with its hole) is at the top. */
export const PANEL = {w: 96, h: 168, tab: 22};
export const Panel: React.FC<{x: number; y: number; lw: number; rot?: number; tone?: number}> = ({x, y, lw, rot = 0, tone = 0}) => {
  const {w, h, tab} = PANEL;
  const body = `M${-w / 2 + 6} ${-h / 2} L${w / 2 - 4} ${-h / 2} Q${w / 2 + 2} ${-h / 2 + 4} ${w / 2} ${-h / 2 + 14} L${w / 2 + 6} ${h / 2 - 16} Q${w / 2 + 6} ${h / 2} ${w / 2 - 12} ${h / 2} L${-w / 2 + 10} ${h / 2} Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 12} L${-w / 2} ${-h / 2 + 8} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-9} y={-h / 2 - tab} width={18} height={tab + 6} rx={5} fill={BCOL.panelD} stroke={INK} strokeWidth={lw} />
      <circle cx={0} cy={-h / 2 - tab + 8} r={4} fill={INK} />
      <path d={body} fill={tone > 0 ? '#9FB3C7' : BCOL.panel} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      <path d={`M${-w / 2 + 12} ${-h / 2 + 12} L${w / 2 - 12} ${-h / 2 + 12} L${w / 2 - 6} ${-h / 2 + 62} L${-w / 2 + 12} ${-h / 2 + 62} Z`} fill="#5E6C7A" stroke={INK} strokeWidth={lw * 0.7} strokeLinejoin="round" />
      <path d={`M${-w / 2 + 8} ${8} L${w / 2 - 4} ${8}`} stroke={BCOL.panelD} strokeWidth={lw * 1.4} />
      <rect x={w / 2 - 26} y={-2} width={16} height={6} rx={3} fill={INK} />
    </g>
  );
};

/** Overhead hanger line: rail, trolleys and hooks. `hooks` are hook-tip x positions. */
export const HookLine: React.FC<{x0: number; x1: number; lw: number; hooks: number[]; hookY: number}> = ({x0, x1, lw, hooks, hookY}) => (
  <g>
    <rect x={x0} y={PL.railY - 12} width={x1 - x0} height={24} rx={6} fill={BCOL.beamD} stroke={INK} strokeWidth={lw} />
    {Array.from({length: Math.ceil((x1 - x0) / 420)}, (_, i) => <rect key={'h' + i} x={x0 + 120 + i * 420} y={-600} width={14} height={PL.railY - 12 + 600} fill={BCOL.beam} stroke={INK} strokeWidth={lw * 0.7} />)}
    {hooks.map((hx, i) => (hx < x0 - 60 || hx > x1 + 60 ? null : (
      <g key={i}>
        <rect x={hx - 16} y={PL.railY - 18} width={32} height={20} rx={5} fill="#5E6C7A" stroke={INK} strokeWidth={lw * 0.8} />
        <line x1={hx} y1={PL.railY} x2={hx} y2={hookY - 14} stroke={INK} strokeWidth={lw * 1.4} />
        <path d={`M${hx} ${hookY - 16} q0 16 10 18 q10 -2 10 -14`} fill="none" stroke={INK} strokeWidth={lw * 2} strokeLinecap="round" />
      </g>
    )))}
  </g>
);

/** Parts tote on a stand (the panels stand in it). `top` = rim height. */
export const Tote: React.FC<{x: number; top: number; lw: number; w?: number; front?: boolean}> = ({x, top, lw, w = 190, front}) => {
  const bot = top + 150;
  if (front) {
    return (
      <g>
        <path d={`M${x - w / 2} ${top} L${x + w / 2} ${top} L${x + w / 2 - 10} ${bot} L${x - w / 2 + 10} ${bot} Z`} fill={BCOL.tote} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
        <rect x={x - w / 2} y={top} width={w} height={26} fill={BCOL.toteD} stroke={INK} strokeWidth={lw} />
        <rect x={x - 34} y={top + 60} width={68} height={16} rx={8} fill={BCOL.toteD} stroke={INK} strokeWidth={lw * 0.7} />
      </g>
    );
  }
  return (
    <g>
      {[-w / 2 + 16, w / 2 - 16].map((dx) => <rect key={dx} x={x + dx - 9} y={bot} width={18} height={PL.floor - bot} fill={BCOL.beamD} stroke={INK} strokeWidth={lw} />)}
      <rect x={x - w / 2 - 10} y={bot - 4} width={w + 20} height={14} rx={4} fill={BCOL.cart} stroke={INK} strokeWidth={lw} />
      <path d={`M${x - w / 2 + 6} ${top - 6} L${x + w / 2 - 6} ${top - 6} L${x + w / 2 - 14} ${bot} L${x - w / 2 + 14} ${bot} Z`} fill={BCOL.toteD} stroke={INK} strokeWidth={lw} />
    </g>
  );
};

/** Assembly jig on the floor (where the F.03 sets a panel). */
export const Jig: React.FC<{x: number; lw: number; top: number}> = ({x, lw, top}) => (
  <g>
    <rect x={x - 80} y={PL.floor - 26} width={160} height={26} rx={6} fill={BCOL.frameD} stroke={INK} strokeWidth={lw} />
    {[-58, 58].map((dx) => <rect key={dx} x={x + dx - 8} y={top} width={16} height={PL.floor - 26 - top} fill={BCOL.frame} stroke={INK} strokeWidth={lw} />)}
    <rect x={x - 66} y={top - 8} width={132} height={14} rx={6} fill={C.saffron} stroke={INK} strokeWidth={lw * 0.8} />
  </g>
);

/** Hand truck (dolly) seen from the side, its toe plate at (x, floor); `tilt` deg leans it back on its wheel. */
export const Dolly: React.FC<{x: number; lw: number; tilt?: number; h?: number}> = ({x, lw, tilt = 0, h = 560}) => (
  <g transform={`rotate(${-tilt} ${x - 30} ${PL.floor - 30})`}>
    <rect x={x - 70} y={PL.floor - 14} width={110} height={12} rx={4} fill={BCOL.beamD} stroke={INK} strokeWidth={lw} />
    <rect x={x - 70} y={PL.floor - h} width={14} height={h} rx={6} fill={C.coral} stroke={INK} strokeWidth={lw} />
    <path d={`M${x - 63} ${PL.floor - h} q-30 -10 -40 -40`} fill="none" stroke={INK} strokeWidth={lw * 2.2} strokeLinecap="round" />
    <circle cx={x - 40} cy={PL.floor - 30} r={30} fill="#2B2B33" stroke={INK} strokeWidth={lw} />
    <circle cx={x - 40} cy={PL.floor - 30} r={11} fill={BCOL.beam} />
  </g>
);

/** Power-down sparks / service sparks at a point (deterministic). */
export const Sparks: React.FC<{x: number; y: number; t: number; k: number; lw: number}> = ({x, y, t, k, lw}) => {
  if (k <= 0) return null;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const ph = ((t * 3.1 + i * 0.137) % 1);
    const a = -Math.PI / 2 + (((i * 73) % 100) / 100 - 0.5) * 2.6;
    const v = 90 + ((i * 37) % 60);
    const px = x + Math.cos(a) * v * ph, py = y + Math.sin(a) * v * ph + 160 * ph * ph;
    els.push(<line key={i} x1={px} y1={py} x2={px - Math.cos(a) * 10} y2={py - Math.sin(a) * 10} stroke={ph < 0.5 ? '#FFF2B8' : C.saffron} strokeWidth={lw * 1.2} strokeLinecap="round" opacity={k * (1 - ph)} />);
  }
  return <g>{els}</g>;
};
