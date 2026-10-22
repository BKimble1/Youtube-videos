import React, {useId} from 'react';
import {C} from '../theme';

// Launch-and-catch tower ("Mechazilla"), side view: the tower is at x = 0, the launch mount and catch point to the right.
// Local units 0.1 m, ground at y = 0. The two catch arms ("chopsticks") hang from a carriage that rides the tower;
// each arm pivots about a vertical hinge on the tower face. Seen from the side, an open arm swings toward (near arm)
// or away from (far arm) the camera, so its projected length shrinks with cos(open).
// V3 infrastructure: shorter arms, electromechanical main actuators (per SpaceX's V3 update as reported).
export const TOWER_H = 1460;
export const TOWER_W = 120;
export const CATCH_X = 230; // centre line of the launch mount / catch position
export const ARM_L = 300; // V3 arm length (shorter than the V1 arms)
export const ARM_L_V1 = 380;

export type TowerProps = {
  armY: number; // y of the arm top rail (negative, up)
  open?: number; // 0 = closed (parallel), 1 = fully open (~45 degrees)
  armL?: number;
  layer: 'back' | 'front';
  mount?: boolean;
  qd?: number; // quick-disconnect arm swing, 0 retracted .. 1 extended
  hl?: boolean; // highlight the arm rails
};

const Arm: React.FC<{y: number; L: number; near: boolean; hl?: boolean}> = ({y, L, near, hl}) => {
  const k = near ? 1.06 : 0.94;
  const dy = near ? 2 : -2;
  const h0 = 74 * k;
  const h1 = 30 * k;
  const x0 = 60;
  const x1 = 60 + L;
  const top = y + dy;
  const p = `M ${x0} ${top} L ${x1} ${top} L ${x1} ${top + h1} L ${x0} ${top + h0} Z`;
  const n = Math.max(2, Math.round(L / 45));
  return (
    <g opacity={near ? 1 : 0.92}>
      <path d={p} fill={near ? C.arm : '#2b333e'} stroke="#151a21" strokeWidth={1.5} />
      {Array.from({length: n}, (_, i) => {
        const xa = x0 + (L * i) / n;
        const xb = x0 + (L * (i + 1)) / n;
        const ha = h0 + ((h1 - h0) * i) / n;
        const hb = h0 + ((h1 - h0) * (i + 1)) / n;
        return (
          <g key={i} stroke={near ? '#5d6a79' : '#46505d'} strokeWidth={2}>
            <line x1={xa} y1={top + 6} x2={xb} y2={top + hb - 4} />
            <line x1={xb} y1={top + 6} x2={xb} y2={top + hb - 4} />
            <line x1={xa} y1={top + ha - 4} x2={xa} y2={top + 6} />
          </g>
        );
      })}
      <rect x={x0} y={top - 5} width={L} height={6} rx={2} fill={hl ? C.accent : C.rail} />
    </g>
  );
};

export const Tower: React.FC<TowerProps> = ({armY, open = 0, armL = ARM_L, layer, mount = true, qd = 0, hl}) => {
  const id = useId().replace(/:/g, '');
  const Lp = armL * Math.cos(Math.min(open, 1.9) * (Math.PI / 4));
  if (layer === 'front') return <Arm y={armY} L={Lp} near hl={hl} />;
  const panels = Math.floor(TOWER_H / 60);
  return (
    <g>
      <defs>
        <linearGradient id={`tw${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.tower0} />
          <stop offset="0.7" stopColor={C.tower1} />
          <stop offset="1" stopColor={C.tower2} />
        </linearGradient>
      </defs>
      {/* launch mount */}
      {mount && (
        <g>
          {[-52, -20, 20, 52].map((dx) => (
            <rect key={dx} x={CATCH_X + dx - 7} y={-150} width={14} height={150} fill={C.tower1} stroke="#151a21" />
          ))}
          <rect x={CATCH_X - 72} y={-170} width={144} height={24} rx={3} fill={C.tower2} stroke="#151a21" />
          <rect x={CATCH_X - 72} y={-170} width={144} height={5} fill={C.towerHi} />
        </g>
      )}
      {/* lattice tower */}
      <rect x={-60} y={-TOWER_H} width={120} height={TOWER_H} fill={`url(#tw${id})`} opacity={0.18} />
      <g stroke={C.tower1} strokeWidth={6}>
        <line x1={-56} y1={0} x2={-56} y2={-TOWER_H} />
        <line x1={56} y1={0} x2={56} y2={-TOWER_H} stroke={C.tower2} />
      </g>
      <g stroke={C.tower1} strokeWidth={2.6}>
        {Array.from({length: panels}, (_, i) => {
          const y0 = -i * 60;
          const y1 = -(i + 1) * 60;
          return (
            <g key={i}>
              <line x1={-56} y1={y1} x2={56} y2={y1} />
              <line x1={-56} y1={y0} x2={56} y2={y1} />
              <line x1={56} y1={y0} x2={-56} y2={y1} />
            </g>
          );
        })}
      </g>
      <line x1={58} y1={0} x2={58} y2={-TOWER_H} stroke={C.towerHi} strokeWidth={1.5} opacity={0.7} />
      {/* top: crane and lightning mast */}
      <rect x={-64} y={-TOWER_H - 16} width={128} height={16} fill={C.tower1} />
      <line x1={0} y1={-TOWER_H - 16} x2={0} y2={-TOWER_H - 120} stroke={C.tower2} strokeWidth={4} />
      <path d={`M 40 ${-TOWER_H - 16} L 40 ${-TOWER_H - 60} L 150 ${-TOWER_H - 40}`} stroke={C.tower2} strokeWidth={4} fill="none" />
      {/* quick-disconnect arm (ship propellant and power connection) */}
      <g transform={`translate(60 ${-1180}) scale(${0.25 + 0.75 * qd} 1)`}>
        <path d="M 0 0 L 110 6 L 110 26 L 0 34 Z" fill={C.tower1} stroke="#151a21" strokeWidth={1.5} />
      </g>
      {/* far arm, then carriage */}
      <Arm y={armY} L={Lp} near={false} hl={hl} />
      <rect x={-72} y={armY - 18} width={144} height={128} rx={4} fill={C.carriage} stroke="#12171d" strokeWidth={2} />
      <rect x={-72} y={armY - 18} width={144} height={8} fill={C.tower2} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-60} y={armY + 6 + i * 32} width={120} height={14} rx={2} fill="#1a2028" />
      ))}
      {/* electromechanical actuator housings at the hinges */}
      <circle cx={60} cy={armY + 30} r={13} fill={C.tower2} stroke="#12171d" strokeWidth={2} />
      <circle cx={60} cy={armY + 30} r={5} fill={C.towerHi} />
    </g>
  );
};
