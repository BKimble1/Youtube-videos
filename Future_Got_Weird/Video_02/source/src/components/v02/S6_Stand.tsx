import React from 'react';
import {C, OUTLINE} from '../../theme';

/**
 * The small tripod stand the kit sensor sits on in acts 1-3 (S6.3 close-up): a clamp plate on a short centre column,
 * three splayed legs with rubber feet. Drawn with its plate top at (x, y) (where the sensor's grip foot rests) and its
 * feet on the floor line `floorY`. `k` scales the hardware (1 ≈ the rig at scale 1). SVG group, parent px.
 */
export const SensorStand: React.FC<{x: number; y: number; floorY: number; k?: number}> = ({x, y, floorY, k = 1}) => {
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const hubY = y + 26 * k + (floorY - y) * 0.18;
  const spread = 62 * k;
  const legs: [number, number][] = [
    [x - spread, floorY],
    [x + spread, floorY],
    [x + 10 * k, floorY + 7 * k],
  ];
  const legW = 9 * k;
  return (
    <g>
      <ellipse cx={x + 6 * k} cy={floorY + 4 * k} rx={spread * 1.25} ry={9 * k} fill={C.shadow} />
      {/* the back leg first (behind the column), then the column, then the two front legs */}
      {[legs[2], legs[0], legs[1]].map(([fx, fy], i) => (
        <g key={i}>
          <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={C.ink} strokeWidth={legW + OUTLINE * 2} strokeLinecap="round" />
          <line x1={x} y1={hubY} x2={fx} y2={fy} stroke={i === 0 ? C.inkMuted : C.inkSoft} strokeWidth={legW} strokeLinecap="round" />
          <ellipse cx={fx} cy={fy - 2 * k} rx={9 * k} ry={6 * k} fill={C.ink} />
        </g>
      ))}
      {/* centre column, hub collar and clamp plate */}
      <rect x={x - 7 * k} y={y + 6 * k} width={14 * k} height={hubY - y} rx={5 * k} fill={C.inkSoft} {...ink} />
      <rect x={x - 15 * k} y={hubY - 9 * k} width={30 * k} height={18 * k} rx={6 * k} fill={C.inkMuted} {...ink} strokeWidth={3} />
      <rect x={x - 24 * k} y={y} width={48 * k} height={12 * k} rx={4 * k} fill={C.inkMuted} {...ink} strokeWidth={3} />
      <rect x={x + 22 * k} y={y + 2 * k} width={12 * k} height={8 * k} rx={3 * k} fill={C.coral} stroke={C.ink} strokeWidth={2.5} />
    </g>
  );
};
