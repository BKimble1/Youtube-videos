// SET-BAY-2D (V4): the bright product/production bay and its props, in the channel's light palette.
// Floor at y = 1000. Low-contrast background so the robots dominate.
import React from 'react';
import {C} from '../../theme';
import {rnd} from '../kit/scene';

export const BAY = {floor: 1000};
export const BCOL = {wall: '#EFE7D2', wall2: '#E6DCC2', win: '#CFE3F7', winD: '#B3CDEA', beam: '#9AA4AE', beamD: '#7E8A94', floor: '#DCDDD2', lane: '#F2C14B', ink: '#162A32',
  belt: '#3F4A55', beltTop: '#5E6C7A', frame: '#4F7CC9', frameD: '#3A5FA0', panel: '#8FA3B8', panelD: '#6F8399', tote: '#E8892B', toteD: '#B9661C', cart: '#7E8A94'};

export const BayBack: React.FC<{lw: number; dim?: number}> = ({lw, dim = 0}) => (
  <g>
    <rect x={-4000} y={-2000} width={9000} height={3000} fill={BCOL.wall} />
    <rect x={-4000} y={640} width={9000} height={360} fill={BCOL.wall2} />
    <line x1={-4000} y1={640} x2={5000} y2={640} stroke={BCOL.ink} strokeWidth={lw * 0.8} opacity={0.4} />
    {Array.from({length: 12}, (_, i) => {
      const x = -2600 + i * 560;
      return (
        <g key={i}>
          <rect x={x} y={-80} width={360} height={560} rx={8} fill={BCOL.win} stroke={BCOL.ink} strokeWidth={lw * 0.8} opacity={0.9} />
          <line x1={x + 180} y1={-80} x2={x + 180} y2={480} stroke={BCOL.ink} strokeWidth={lw * 0.6} opacity={0.6} />
          <line x1={x} y1={200} x2={x + 360} y2={200} stroke={BCOL.ink} strokeWidth={lw * 0.6} opacity={0.6} />
          <rect x={x + 420} y={-400} width={60} height={1400} fill={BCOL.beam} stroke={BCOL.ink} strokeWidth={lw * 0.8} />
        </g>
      );
    })}
    <rect x={-4000} y={-200} width={9000} height={50} fill={BCOL.beam} stroke={BCOL.ink} strokeWidth={lw * 0.8} />
    <rect x={-4000} y={BAY.floor} width={9000} height={1500} fill={BCOL.floor} />
    <line x1={-4000} y1={BAY.floor} x2={5000} y2={BAY.floor} stroke={BCOL.ink} strokeWidth={lw} />
    <path d={`M-4000 ${BAY.floor + 60} L5000 ${BAY.floor + 60}`} stroke={BCOL.lane} strokeWidth={lw * 3} />
    {dim > 0 ? <rect x={-4000} y={-2000} width={9000} height={4000} fill="#162A32" opacity={dim} /> : null}
  </g>
);

/** Studio plinth + soft spotlight for the model introduction. */
export const Plinth: React.FC<{x: number; lw: number; w?: number}> = ({x, lw, w = 520}) => (
  <g>
    <ellipse cx={x} cy={BAY.floor} rx={w / 2} ry={34} fill={C.paperDeep} stroke={BCOL.ink} strokeWidth={lw} />
    <ellipse cx={x} cy={BAY.floor - 4} rx={w / 2 - 30} ry={24} fill={C.paper} />
  </g>
);

/** Conveyor belt (side elevation) from x0 to x1 with its top at y; rollers scroll with `offset`. */
export const Conveyor: React.FC<{x0: number; x1: number; y: number; lw: number; offset?: number; legs?: boolean}> = ({x0, x1, y, lw, offset = 0, legs = true}) => {
  const els: React.ReactNode[] = [];
  if (legs) for (let x = x0 + 60; x < x1 - 20; x += 260) els.push(<rect key={'l' + x} x={x - 10} y={y + 30} width={20} height={BAY.floor - y - 30} fill={BCOL.beamD} stroke={BCOL.ink} strokeWidth={lw} />);
  els.push(<rect key="body" x={x0} y={y} width={x1 - x0} height={36} rx={18} fill={BCOL.belt} stroke={BCOL.ink} strokeWidth={lw} />);
  els.push(<rect key="top" x={x0 + 8} y={y - 2} width={x1 - x0 - 16} height={10} rx={5} fill={BCOL.beltTop} />);
  for (let x = x0 + 30 - ((offset % 60) + 60) % 60; x < x1 - 20; x += 60) if (x > x0 + 10) els.push(<circle key={'r' + x} cx={x} cy={y + 20} r={lw * 2.2} fill={BCOL.beamD} stroke={BCOL.ink} strokeWidth={lw * 0.5} />);
  return <g>{els}</g>;
};

/** A stamped door panel (side view) — a generic car-body part. */
export const DoorPanel: React.FC<{x: number; y: number; lw: number; rot?: number; w?: number}> = ({x, y, lw, rot = 0, w = 170}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M${-w / 2} 22 L${-w / 2 + 14} -38 Q0 -52 ${w / 2 - 20} -40 L${w / 2} 22 Z`} fill={BCOL.panel} stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
    <path d={`M${-w / 2 + 26} -24 L${w / 2 - 34} -26 L${w / 2 - 28} -4 L${-w / 2 + 22} -2 Z`} fill={BCOL.panelD} stroke={BCOL.ink} strokeWidth={lw * 0.6} />
    <rect x={w / 2 - 54} y={4} width={22} height={6} rx={3} fill={BCOL.ink} />
  </g>
);

/** Parts cart with a tote of panels standing on edge. */
export const PartsCart: React.FC<{x: number; lw: number; n?: number}> = ({x, lw, n = 3}) => (
  <g>
    <rect x={x - 110} y={BAY.floor - 330} width={220} height={18} fill={BCOL.cart} stroke={BCOL.ink} strokeWidth={lw} />
    {[-96, 96].map((dx) => <rect key={dx} x={x + dx - 8} y={BAY.floor - 312} width={16} height={290} fill={BCOL.beamD} stroke={BCOL.ink} strokeWidth={lw} />)}
    {[-80, 80].map((dx) => <circle key={'w' + dx} cx={x + dx} cy={BAY.floor - 14} r={14} fill={BCOL.ink} />)}
    <rect x={x - 100} y={BAY.floor - 420} width={200} height={92} rx={8} fill={BCOL.tote} stroke={BCOL.ink} strokeWidth={lw} />
    {Array.from({length: n}, (_, i) => <rect key={'p' + i} x={x - 70 + i * 24} y={BAY.floor - 470} width={12} height={70} rx={3} fill={BCOL.panel} stroke={BCOL.ink} strokeWidth={lw * 0.7} />)}
    <rect x={x - 100} y={BAY.floor - 420} width={200} height={40} fill={BCOL.toteD} stroke={BCOL.ink} strokeWidth={lw} />
  </g>
);

/** Generic car body-in-white (side view) on a skid, centre x, sitting on the conveyor top y. */
export const CarBody: React.FC<{x: number; y: number; lw: number; doorOn?: boolean}> = ({x, y, lw, doorOn}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-330 -10 L-320 -90 Q-300 -120 -240 -128 L-150 -134 Q-110 -200 -30 -206 L110 -206 Q170 -200 210 -140 L300 -130 Q336 -124 340 -90 L344 -10 Z" fill="#C9D3DC" stroke={BCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
    <path d="M-130 -140 Q-100 -192 -36 -194 L40 -194 L40 -140 Z M56 -140 L56 -194 L104 -194 Q160 -190 192 -140 Z" fill="#5E6C7A" stroke={BCOL.ink} strokeWidth={lw * 0.8} />
    {[-210, 220].map((wx) => <g key={wx}><circle cx={wx} cy={-12} r={56} fill={BCOL.wall2} stroke={BCOL.ink} strokeWidth={lw} /><circle cx={wx} cy={-12} r={34} fill="none" stroke={BCOL.beamD} strokeWidth={lw} strokeDasharray={`${lw * 3} ${lw * 3}`} /></g>)}
    <path d="M-34 -130 L52 -130 L56 -40 L-40 -40 Z" fill={doorOn ? BCOL.panel : '#2E3A44'} stroke={BCOL.ink} strokeWidth={lw * 0.8} />
  </g>
);

/** A retired-robot queue silhouette row (simple, recede to the left). */
export const QueueRow: React.FC<{x: number; n: number; lw: number; step?: number; t?: number}> = ({x, n, lw, step = 120, t = 0}) => (
  <g opacity={0.9}>
    {Array.from({length: n}, (_, i) => {
      const k = 1 - i * 0.05;
      const bx = x - i * step;
      const h = 560 * k;
      const by = BAY.floor - i * 6;
      return (
        <g key={i} transform={`translate(${bx} ${by}) scale(${k})`}>
          <rect x={-60} y={-12} width={120} height={12} rx={4} fill={BCOL.frameD} />
          <path d={`M-22 ${-h + 70} Q-30 ${-h + 10} 0 ${-h} Q30 ${-h + 10} 22 ${-h + 70} Z`} fill="#3A4048" stroke={BCOL.ink} strokeWidth={lw} />
          <path d={`M-58 ${-h + 100} L58 ${-h + 100} L44 ${-h + 300} L-44 ${-h + 300} Z`} fill="#3A4048" stroke={BCOL.ink} strokeWidth={lw} />
          <rect x={-40} y={-h + 300} width={30} height={h - 312} rx={10} fill="#2C3137" stroke={BCOL.ink} strokeWidth={lw} />
          <rect x={10} y={-h + 300} width={30} height={h - 312} rx={10} fill="#2C3137" stroke={BCOL.ink} strokeWidth={lw} />
          <rect x={-78} y={-h + 110} width={22} height={170} rx={10} fill="#2C3137" stroke={BCOL.ink} strokeWidth={lw} />
          <rect x={56} y={-h + 110} width={22} height={170} rx={10} fill="#2C3137" stroke={BCOL.ink} strokeWidth={lw} />
          <rect x={-10} y={-h + 28} width={20} height={34} rx={6} fill="#050607" />
        </g>
      );
    })}
    {void t}
  </g>
);

/** Wall calendar (world), month index. */
export const Calendar: React.FC<{x: number; y: number; lw: number; month: number; flip?: number}> = ({x, y, lw, month, flip = 0}) => {
  const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-80} y={-100} width={160} height={200} rx={8} fill="#FFFFFF" stroke={BCOL.ink} strokeWidth={lw} />
      <rect x={-80} y={-100} width={160} height={44} fill={C.coral} stroke={BCOL.ink} strokeWidth={lw} />
      <text x={0} y={40} textAnchor="middle" fontFamily='"Fredoka Variable", sans-serif' fontWeight={700} fontSize={64} fill={BCOL.ink}>{M[month % 12]}</text>
      {flip > 0 ? <path d={`M-80 -56 L80 -56 L80 ${-56 + 156 * (1 - flip)} L-80 ${-56 + 156 * (1 - flip)} Z`} fill="#F4F1EA" stroke={BCOL.ink} strokeWidth={lw * 0.7} /> : null}
    </g>
  );
};

export const Spot: React.FC<{x: number; y: number; r: number; k?: number}> = ({x, y, r, k = 1}) => (
  <g>
    <defs>
      <radialGradient id="bayspot" cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55 * k} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill="url(#bayspot)" />
  </g>
);
export {rnd};
