import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {ramp} from './ui';
import {T} from './timeline';

/**
 * The spray when the front bursts on the wall: cream foam shapes (ink outlined) grow from the impact point until they cover the frame (f foamA -> foamB), the latitude scene is swapped
 * in underneath at the fullest cover, and the foam falls away and shrinks (foamB -> foamC) to reveal it. A physical shape carries the cut: no empty field, no dissolve.
 */
const N = 96;
const blobs = Array.from({length: N}).map((_, i) => ({x: rand(i + 3) * (W + 140) - 70, y: rand(i + 40) * H * 1.02 - 20, R: 70 + rand(i + 70) * 150, d: Math.floor(rand(i + 11) * 5), fall: 200 + rand(i + 22) * 900}));
export const Foam: React.FC<{f: number}> = ({f}) => {
  const peak = f >= T.foamB - 2 && f <= T.foamB + 1;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {peak && <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.cream} />}
      {blobs.map((b, i) => {
        const grow = ramp(f - b.d, T.foamA, T.foamB - 1, E.out);
        const away = ramp(f - b.d * 0.5, T.foamB, T.foamC, (x) => x * x);
        const r = b.R * grow * (1 - away * 0.85), y = b.y + b.fall * away * away;
        if (r < 2) return null;
        return <circle key={i} cx={b.x} cy={y} r={r} fill={i % 3 === 0 ? C.white : C.cream} stroke={C.ink} strokeWidth={5} />;
      })}
    </svg>
  );
};
void E;
