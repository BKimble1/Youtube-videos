import React from 'react';
import {C, OUTLINE} from '../../theme';
import type {Look} from '../Character';

/**
 * S8 only: overhead (top-down) token for a cast look without accessories, in the style of components/v02/Tokens.tsx
 * (shoulders, sleeves, head, a bob seen from above). Copied from dev/KitWarehouse.tsx's dev token, because Tokens.tsx
 * has no generic person token. Centred on (x, y); `size` is the width across shoulders and sleeves (px); `facing` is
 * in degrees clockwise from screen-up (180 = walking down the screen, toward +z in the plan). Returns an SVG <g>.
 */
export const S8PersonTokenG: React.FC<{x: number; y: number; size: number; look: Look; facing?: number; scale?: number; opacity?: number}> = ({x, y, size: S, look, facing = 0, scale = 1, opacity = 1}) => {
  const sw = Math.max(2, Math.min(OUTLINE, S * 0.032));
  const ink = {stroke: C.ink, strokeWidth: sw, strokeLinejoin: 'round' as const};
  const shY = 0.05 * S;
  const a = ((135 - facing) * Math.PI) / 180;
  const off = {x: S * 0.07 * Math.sin(a), y: -S * 0.07 * Math.cos(a)};
  const rx = S * 0.29;
  const ry = S * 0.28;
  const ha = (52 * Math.PI) / 180;
  const sx = rx * Math.sin(ha);
  const sy = -ry * Math.cos(ha) + 0.02 * S;
  const bob = `M ${-sx} ${sy} A ${rx} ${ry} 0 1 0 ${sx} ${sy} Q ${sx * 0.45} ${-S * 0.215} 0 ${-S * 0.18} Q ${-sx * 0.45} ${-S * 0.215} ${-sx} ${sy} Z`;
  if (opacity <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${facing}) scale(${scale})`} opacity={opacity}>
      <g transform={`translate(${off.x} ${off.y})`} fill={C.shadow}>
        <ellipse cx={0} cy={shY} rx={S * 0.5} ry={S * 0.23} />
        <circle r={S * 0.285} />
      </g>
      <circle cx={-S * 0.395} cy={shY + S * 0.015} r={S * 0.1} fill={look.shirt} {...ink} />
      <circle cx={S * 0.395} cy={shY + S * 0.015} r={S * 0.1} fill={look.shirt} {...ink} />
      <ellipse cx={0} cy={shY} rx={S * 0.42} ry={S * 0.215} fill={look.shirt} {...ink} />
      <ellipse cx={0} cy={-S * 0.26} rx={S * 0.045} ry={S * 0.055} fill={look.skin} {...ink} />
      <ellipse cx={-S * 0.245} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <ellipse cx={S * 0.245} cy={S * 0.01} rx={S * 0.04} ry={S * 0.065} fill={look.skin} {...ink} />
      <circle r={S * 0.245} fill={look.skin} {...ink} />
      <path d={bob} fill={look.hairColor} {...ink} />
    </g>
  );
};
