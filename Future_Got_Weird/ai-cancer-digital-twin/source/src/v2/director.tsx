// V2 director: the film is a list of shots on one timeline. Each shot draws a full world (its own opaque background
// and its own camera) for t in [t0, t1]. A shot that starts while the previous one is still running fades in over
// `fade` seconds on top of it (zoom-through handoffs keep both cameras locked during that window, so the dissolve
// reads as one continuous move); a shot with fade 0 is a hard cut, used only where a new thing is revealed.
import React from 'react';
import {Defs} from './defs';
import {W, H} from '../kit/cam';
import {xfade} from './rig';

export type Shot = {id: string; t0: number; t1: number; fade?: number; draw: (t: number) => React.ReactNode};

export const Director: React.FC<{t: number; shots: Shot[]; overlay?: (t: number) => React.ReactNode}> = ({t, shots, overlay}) => {
  const live = shots.filter((s) => t >= s.t0 && t < s.t1);
  // only the last shot that is fully faded in and everything above it need drawing
  let first = 0;
  live.forEach((s, i) => {
    if (xfade(t, s.t0, s.t0 + (s.fade ?? 0)) >= 1) first = i;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, background: '#000'}}>
      <Defs />
      {live.slice(first).map((s, i) => (
        <g key={s.id} opacity={i === 0 ? 1 : xfade(t, s.t0, s.t0 + (s.fade ?? 0))}>
          {s.draw(t)}
        </g>
      ))}
      {overlay?.(t)}
    </svg>
  );
};
