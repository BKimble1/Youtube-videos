// Checkpoint — the coordination system's collection gate at the west end of the avenue (x ≈ −3000): two pylons with a
// scanning arch and light bars, queue railings funnelling east → west into the gate, a holding pen behind it, and
// side-street barriers that slide shut (close 0 … 1). Pale ordered panels and a cyan sensor that turns amber when the
// gate commits. The system mark is small and restrained. No text.
import React from 'react';
import {f2, range, polyPath, INK, K, noise, SysMarkLocal, Glow} from './cityKit';

export type CheckpointProps = {x?: number; y?: number; t: number; ink?: number; close?: number; lock?: number; barriers?: {x: number; w: number}[]; scan?: number};

/** Positions along the queue (east of the gate) where figures stand in line, front first. */
export const queueSpots = (x = -3000, n = 6) => range(n).map((i) => ({x: x + 520 + i * 260, y: 0}));
/** The gate's passage point (where a figure is processed) and the split exits behind it. */
export const gatePoints = (x = -3000) => ({gate: {x, y: 0}, exitA: {x: x - 700, y: 0}, exitB: {x: x - 520, y: 0}});

export const Checkpoint: React.FC<CheckpointProps> = ({x = -3000, y = 0, t, ink = 6, close = 0, lock = 0, barriers = [{x: -1700, w: 900}, {x: -4400, w: 900}], scan = 1}) => {
  const sensor = lock > 0.5 ? K.sysLock : K.sysSensor;
  const scanY = y - 200 - (0.5 + 0.5 * Math.sin(t * 2.2)) * 700 * scan;
  return (
    <g>
      {/* holding pen fence behind the gate */}
      <rect x={x - 1400} y={y - 520} width={1100} height={520} fill={K.sysShade} opacity={0.35} stroke={INK} strokeWidth={ink * 0.6} />
      {range(12).map((i) => <line key={`pen${i}`} x1={x - 1400 + i * 100} y1={y - 520} x2={x - 1400 + i * 100} y2={y} stroke={K.sysSlate} strokeWidth={ink * 0.8} />)}
      {/* side-street barriers (slide in from the left of each opening) */}
      {barriers.map((b, i) => (
        <g key={`bar${i}`}>
          <rect x={b.x - 40} y={y - 760} width={b.w + 80} height={30} fill={K.sysSlate} stroke={INK} strokeWidth={ink * 0.8} />
          <rect x={b.x} y={y - 730} width={b.w * close} height={730} fill={K.sysPanel} stroke={INK} strokeWidth={ink} />
          {close > 0.05 && <rect x={b.x + 30} y={y - 420} width={Math.max(0, b.w * close - 60)} height={22} fill={sensor} opacity={0.85} />}
          {close > 0.05 && <SysMarkLocal x={b.x + b.w * close - 110} y={y - 590} r={44} />}
        </g>
      ))}
      {/* pylons and arch */}
      {[-1, 1].map((s) => (
        <g key={`py${s}`}>
          <rect x={x + s * 360 - 70} y={y - 1180} width={140} height={1180} rx={20} fill={K.sysPanel} stroke={INK} strokeWidth={ink} />
          <rect x={x + s * 360 - 22} y={y - 1080} width={44} height={900} rx={14} fill={K.sysDark} />
          <rect x={x + s * 360 - 12} y={y - 1060} width={24} height={860} rx={10} fill={sensor} opacity={0.75 + 0.25 * noise(t * 3, s + 4)} />
        </g>
      ))}
      <path d={`M ${f2(x - 430)} ${f2(y - 1180)} Q ${f2(x)} ${f2(y - 1460)} ${f2(x + 430)} ${f2(y - 1180)} L ${f2(x + 430)} ${f2(y - 1100)} Q ${f2(x)} ${f2(y - 1360)} ${f2(x - 430)} ${f2(y - 1100)} Z`} fill={K.sysShade} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <circle cx={x} cy={y - 1290} r={70} fill={K.sysDark} stroke={INK} strokeWidth={ink} />
      <circle cx={x} cy={y - 1290} r={40} fill={sensor} />
      <circle cx={x} cy={y - 1290} r={16} fill="#FFFFFF" opacity={0.9} />
      <SysMarkLocal x={x + 360} y={y - 1110} r={26} color="#7FB9C9" />
      {/* scanning plane */}
      <rect x={x - 290} y={scanY} width={580} height={14} fill={sensor} opacity={0.55} />
      <Glow id={`cpg${Math.round(x)}`} cx={x} cy={scanY} rx={420} ry={120} color={sensor} op={0.25} />
      {/* queue railings (east of the gate) */}
      {[-1, 1].map((s) => (
        <g key={`q${s}`}>
          <rect x={x + 300} y={y - 260 + (s > 0 ? 40 : 0)} width={1700} height={16} rx={8} fill={K.sysSlate} stroke={INK} strokeWidth={ink * 0.6} opacity={s > 0 ? 1 : 0.6} />
          {range(7).map((i) => <rect key={i} x={x + 320 + i * 270} y={y - 260 + (s > 0 ? 40 : 0)} width={22} height={260 - (s > 0 ? 40 : 0)} fill={K.sysSlate} opacity={s > 0 ? 1 : 0.6} />)}
        </g>
      ))}
      <path d={polyPath([{x: x - 600, y}, {x: x + 2100, y}, {x: x + 2100, y: y + 40}, {x: x - 600, y: y + 40}])} fill="#5C6670" opacity={0.5} />
    </g>
  );
};
