import React from 'react';
import {C, MONO} from '../theme';

// Top-down schematic of the tower, the two arms and a vehicle cross-section (plan view).
// Units match the side views (0.1 m). Tower centred at (0,0); hinges on the tower face at x = 60;
// arms point along +x when closed and swing outward (+/- z, drawn as +/- y) when open.
export const PlanView: React.FC<{
  open: number; // 0..1 (1 = 45 degrees)
  vehicle: 'booster' | 'booster4' | 'ship';
  vx?: number; // vehicle centre x
  vz?: number; // vehicle centre z (lateral offset)
  armL?: number;
  ghost?: boolean; // dashed outline of the target position
  hl?: boolean;
  bad?: boolean; // draw contact points red
}> = ({open, vehicle, vx = 230, vz = 0, armL = 300, ghost, hl, bad}) => {
  const a = open * 45;
  const arm = (side: 1 | -1) => (
    <g transform={`translate(60 ${side * 56}) rotate(${side * a})`}>
      <path d={`M 0 -9 L ${armL} -5 L ${armL} 5 L 0 9 Z`} fill={C.arm} stroke="#11161c" strokeWidth={2} />
      <rect x={0} y={-2.5} width={armL} height={5} fill={hl ? C.accent : C.rail} opacity={0.9} />
      <circle r={12} fill={C.tower2} stroke="#11161c" strokeWidth={2} />
    </g>
  );
  const R = 45;
  return (
    <g>
      {ghost && <circle cx={230} cy={0} r={R + 2} fill="none" stroke={C.ok} strokeWidth={2.5} strokeDasharray="8 7" />}
      <rect x={-60} y={-60} width={120} height={120} fill={C.tower1} stroke="#11161c" strokeWidth={3} />
      {arm(-1)}
      <path d="M -60 -60 L 60 60 M 60 -60 L -60 60" stroke={C.tower2} strokeWidth={3} />
      <g transform={`translate(${vx} ${vz})`}>
        {vehicle === 'ship' && (
          <g>
            <path d={`M -42 -16 L -66 -11 L -66 11 L -42 16 Z`} fill={C.tile1} stroke={C.steel0} strokeWidth={1.5} />
            <path d={`M 42 -16 L 66 -11 L 66 11 L 42 16 Z`} fill={C.tile1} stroke={C.steel0} strokeWidth={1.5} />
          </g>
        )}
        {vehicle === 'booster' && (
          <g fill="#2c3139" stroke="#11161c" strokeWidth={1.5}>
            <rect x={-29} y={45} width={58} height={10} />
            <rect x={-29} y={-55} width={58} height={10} />
            <rect x={45} y={-29} width={10} height={58} />
          </g>
        )}
        {vehicle === 'booster4' && (
          <g fill="#2c3139" stroke="#11161c" strokeWidth={1.5}>
            {[45, 135, 225, 315].map((d) => (
              <rect key={d} x={44} y={-20} width={9} height={40} transform={`rotate(${d})`} />
            ))}
          </g>
        )}
        <circle r={R} fill={C.steel1} stroke="#2b2f36" strokeWidth={2} />
        {vehicle === 'ship' && <path d={`M -45 0 A 45 45 0 0 0 45 0 Z`} fill={C.tile0} transform="rotate(0)" />}
        <circle r={R} fill="none" stroke="#2b2f36" strokeWidth={2} />
        {/* catch points on the near and far sides */}
        {vehicle !== 'booster4' &&
          [-1, 1].map((s) => <rect key={s} x={-9} y={s * (R + 1) - (s > 0 ? 0 : 8)} width={18} height={8} rx={2} fill={bad ? C.danger : C.accent} stroke="#3a2400" strokeWidth={1} />)}
      </g>
      {arm(1)}
    </g>
  );
};

export const PlanLabel: React.FC<{x: number; y: number; text: string; color?: string; size?: number}> = ({x, y, text, color = '#e8eef4', size = 22}) => (
  <text x={x} y={y} fill={color} fontFamily={MONO} fontWeight={700} fontSize={size} letterSpacing={2} textAnchor="middle">
    {text}
  </text>
);
