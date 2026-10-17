// Group C2 small props.
import React from 'react';
import {C} from '../../theme';
import {V2} from '../../kit/math';

/** A bent length of rebar (rusty), from a to b. */
export const Rebar: React.FC<{r: {a: V2; b: V2}; ink: number}> = ({r, ink}) => {
  const mx = (r.a.x + r.b.x) / 2, my = (r.a.y + r.b.y) / 2;
  const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y, L = Math.hypot(dx, dy) || 1;
  const bend = {x: mx - (dy / L) * 10, y: my + (dx / L) * 10};
  const d = `M ${r.a.x.toFixed(1)} ${r.a.y.toFixed(1)} Q ${bend.x.toFixed(1)} ${bend.y.toFixed(1)} ${r.b.x.toFixed(1)} ${r.b.y.toFixed(1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={14 + ink * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#8C4B30" strokeWidth={14} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#B0663F" strokeWidth={4} strokeLinecap="round" strokeDasharray="10 14" />
    </g>
  );
};
