import React from 'react';
import {Item} from '../core/render';

let GID = 0;
export const RenderItems: React.FC<{items: Item[]}> = ({items}) => (
  <>
    {items.map((it, i) => {
      if (it.grad) {
        const id = `g${GID++}`;
        const g = it.grad;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={g.x1.toFixed(1)} y1={g.y1.toFixed(1)} x2={g.x2.toFixed(1)} y2={g.y2.toFixed(1)}>
                {g.stops.map(([o, c], k) => <stop key={k} offset={o.toFixed(4)} stopColor={c} />)}
              </linearGradient>
            </defs>
            <path d={it.d} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={it.sw ?? 0.9} strokeLinejoin="round" opacity={it.op} />
          </g>
        );
      }
      return (
        <path key={i} d={it.d} fill={it.fill ?? 'none'} opacity={it.op} stroke={it.stroke} strokeWidth={it.stroke ? it.sw ?? 1 : undefined}
          strokeLinejoin={it.round || it.stroke ? 'round' : undefined} strokeLinecap={it.round ? 'round' : undefined} />
      );
    })}
  </>
);
