import React from 'react';
import {C} from '../theme';

// Super Heavy engine layout seen from below: 3 centre, 10 inner ring, 20 outer ring = 33 Raptors.
// `lit` selects which engines glow: 'center3', 'inner13' (centre + inner ring), 'all33', or none.
export const EngineMap: React.FC<{r: number; lit?: 'none' | 'center3' | 'inner13' | 'all33'; reveal?: number}> = ({r, lit = 'none', reveal = 1}) => {
  const rings: {n: number; rr: number; size: number; group: number}[] = [
    {n: 3, rr: 0.12, size: 0.1, group: 0},
    {n: 10, rr: 0.42, size: 0.1, group: 1},
    {n: 20, rr: 0.8, size: 0.095, group: 2},
  ];
  const isLit = (g: number) => (lit === 'all33' ? true : lit === 'inner13' ? g <= 1 : lit === 'center3' ? g === 0 : false);
  let k = 0;
  return (
    <g>
      <circle r={r} fill="#22262d" stroke={C.steel1} strokeWidth={r * 0.03} />
      {rings.map((ring) =>
        Array.from({length: ring.n}, (_, i) => {
          const a = (i / ring.n) * Math.PI * 2 + (ring.group === 2 ? 0.08 : 0.3);
          const x = Math.cos(a) * ring.rr * r;
          const y = Math.sin(a) * ring.rr * r;
          k += 1;
          const show = k / 33 <= reveal + 1e-6;
          if (!show) return null;
          return (
            <g key={`${ring.group}-${i}`}>
              <circle cx={x} cy={y} r={ring.size * r} fill={isLit(ring.group) ? C.flameMid : '#3c424b'} stroke="#0d0f12" strokeWidth={r * 0.012} />
              <circle cx={x} cy={y} r={ring.size * r * 0.55} fill={isLit(ring.group) ? C.flameCore : '#15181c'} />
            </g>
          );
        })
      )}
    </g>
  );
};
