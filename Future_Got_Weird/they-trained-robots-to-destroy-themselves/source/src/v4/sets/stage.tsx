// SET-STAGE-2D (V4): the vector teaching stage. Same geography as the foundry (tower where the deck is, landing pad
// where the ladle is, target where the robot went in), so a pose and a position carry across every sim ↔ real beat.
// Conceptual illustration of simulation training in general, not Figure's simulator.
import React from 'react';
import {C} from '../../theme';
import {FD} from './foundry';

export const SCOL = {bg0: '#EEF4FD', bg1: '#D9E6F8', grid: '#BFD3F0', ink: '#2C4A80', tower: '#C7DAF6', towerTop: '#E3EDFB', towerSide: '#A9C2EA', pad: '#CFE0F8', padTop: '#EAF2FD', target: C.teal, targetD: C.tealDeep, coral: C.coral};
/** Target centre on the pad = where the robot entered the steel in the opening. */
export const TGT_X = 760;
const E = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;

export const StageBack: React.FC<{lw: number; grid?: number}> = ({lw, grid = 1}) => (
  <g>
    <defs>
      <linearGradient id="stBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SCOL.bg0} /><stop offset="1" stopColor={SCOL.bg1} /></linearGradient>
    </defs>
    <rect x={-3000} y={-1500} width={7000} height={4000} fill="url(#stBg)" />
    {grid > 0 ? (
      <g opacity={grid}>
        {Array.from({length: 60}, (_, i) => <line key={'v' + i} x1={-1800 + i * 100} y1={-1500} x2={-1800 + i * 100} y2={FD.floor} stroke={SCOL.grid} strokeWidth={lw * 0.5} />)}
        {Array.from({length: 26}, (_, i) => <line key={'h' + i} x1={-3000} y1={-1500 + i * 100} x2={4000} y2={-1500 + i * 100} stroke={SCOL.grid} strokeWidth={lw * 0.5} />)}
      </g>
    ) : null}
    {/* measured floor with tick marks */}
    <rect x={-3000} y={FD.floor} width={7000} height={1200} fill="#C9DAF3" />
    <line x1={-3000} y1={FD.floor} x2={4000} y2={FD.floor} stroke={SCOL.ink} strokeWidth={lw} />
    {Array.from({length: 50}, (_, i) => <line key={'t' + i} x1={-1800 + i * 100} y1={FD.floor} x2={-1800 + i * 100} y2={FD.floor + (i % 5 ? 14 : 28)} stroke={SCOL.ink} strokeWidth={lw * 0.6} />)}
  </g>
);

/** Launch tower (same footprint as the deck). */
export const Tower: React.FC<{lw: number; edge?: number; top?: number; x0?: number}> = ({lw, edge = FD.deck.edge, top = FD.deck.top, x0 = FD.deck.x0}) => (
  <g>
    {[x0 + 120, (x0 + edge) / 2, edge - 50].map((x) => <rect key={x} x={x - 14} y={top + 30} width={28} height={FD.floor - top - 30} fill={SCOL.towerSide} stroke={SCOL.ink} strokeWidth={lw} />)}
    <path d={`M${x0 + 120} ${top + 50} L${(x0 + edge) / 2} ${FD.floor - 20} M${(x0 + edge) / 2} ${top + 50} L${edge - 50} ${FD.floor - 20} M${(x0 + edge) / 2} ${top + 50} L${x0 + 120} ${FD.floor - 20} M${edge - 50} ${top + 50} L${(x0 + edge) / 2} ${FD.floor - 20}`} stroke={SCOL.towerSide} strokeWidth={lw * 2.5} />
    <path d={`M${x0} ${top - 16} L${edge - 6} ${top - 16} L${edge} ${top} L${x0} ${top} Z`} fill={SCOL.towerTop} stroke={SCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
    <rect x={x0} y={top} width={edge - x0} height={30} fill={SCOL.tower} stroke={SCOL.ink} strokeWidth={lw} />
    <path d={`M${edge - 70} ${top - 16} L${edge - 40} ${top - 16} L${edge - 36} ${top} L${edge - 66} ${top} Z`} fill={SCOL.target} />
    {Array.from({length: 7}, (_, i) => <line key={i} x1={edge - 30 - i * 100} y1={top} x2={edge - 30 - i * 100} y2={top + 30} stroke={SCOL.ink} strokeWidth={lw * 0.5} opacity={0.5} />)}
  </g>
);

/** Landing pad with the target (top ellipse = the ladle's molten-surface ellipse). */
export const Pad: React.FC<{lw: number; pulse?: number; bad?: boolean; target?: boolean; zone?: number; tk?: number}> = ({lw, pulse = 0, bad, target = true, zone = 1, tk = 1}) => {
  const L = FD.ladle;
  const col = bad ? SCOL.coral : SCOL.target;
  return (
    <g>
      <path d={`M${L.cx - L.srx - 20} ${L.surf} L${L.cx - L.srx + 10} ${FD.floor} L${L.cx + L.srx - 10} ${FD.floor} L${L.cx + L.srx + 20} ${L.surf} Z`} fill={SCOL.pad} stroke={SCOL.ink} strokeWidth={lw} strokeLinejoin="round" />
      <path d={E(L.cx, L.surf, L.srx + 20, L.sry + 6)} fill={SCOL.padTop} stroke={SCOL.ink} strokeWidth={lw} />
      {zone > 0 ? <path d={E(L.cx, L.surf, 150, 150 * (L.sry / L.srx))} fill="none" stroke={SCOL.ink} strokeWidth={lw * 0.8} strokeDasharray={`${lw * 4} ${lw * 3}`} opacity={0.5 * zone} /> : null}
      {target && tk > 0.01 ? (
        <g transform={`translate(${TGT_X} ${L.surf}) scale(${tk}) translate(${-TGT_X} ${-L.surf})`}>
          <path d={E(TGT_X, L.surf, 92 * (1 + 0.12 * pulse), 92 * (1 + 0.12 * pulse) * (L.sry / L.srx))} fill="none" stroke={col} strokeWidth={lw * 4.2} />
          <path d={E(TGT_X, L.surf, 46, 46 * (L.sry / L.srx))} fill="none" stroke={col} strokeWidth={lw * 3.4} />
          <path d={E(TGT_X, L.surf, 13, 13 * (L.sry / L.srx))} fill={col} />
          {pulse > 0 ? <path d={E(TGT_X, L.surf, 92 + 120 * (1 - pulse), (92 + 120 * (1 - pulse)) * (L.sry / L.srx))} fill="none" stroke={col} strokeWidth={lw * 2} opacity={pulse} /> : null}
        </g>
      ) : null}
    </g>
  );
};

/** Dashed trajectory, partially drawn (0..1). */
export const Arc: React.FC<{pts: {x: number; y: number}[]; k: number; color?: string; lw: number; dash?: boolean; width?: number; opacity?: number}> = ({pts, k, color = '#4F7CC9', lw, dash = true, width = 2.4, opacity = 1}) => {
  if (k <= 0) return null;
  const n = Math.max(2, Math.round(pts.length * Math.min(1, k)));
  const d = 'M' + pts.slice(0, n).map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L');
  return <path d={d} fill="none" stroke={color} strokeWidth={lw * width} strokeDasharray={dash ? `${lw * 5} ${lw * 4}` : undefined} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
};
