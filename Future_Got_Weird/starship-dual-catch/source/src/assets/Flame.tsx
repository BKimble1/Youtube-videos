import React, {useId} from 'react';
import {C} from '../theme';
import {hash} from '../kit/ease';

// Rocket exhaust drawn from a nozzle exit at (0,0) pointing down the local +y axis.
// `len` and `w` are in vehicle units (0.1 m); `t` is the frame for deterministic flicker.
export const Flame: React.FC<{len: number; w: number; t: number; seed?: number; opacity?: number; diamonds?: boolean}> = ({
  len, w, t, seed = 0, opacity = 1, diamonds = true,
}) => {
  const id = useId().replace(/:/g, '');
  if (len <= 0.5 || opacity <= 0) return null;
  const fl = 1 + 0.06 * Math.sin(t * 1.9 + seed * 3) + 0.05 * (hash(Math.floor(t / 2) + seed * 17) - 0.5);
  const L = len * fl;
  const hw = w / 2;
  const outer = `M ${-hw} 0 C ${-hw * 1.5} ${L * 0.25}, ${-hw * 0.9} ${L * 0.7}, 0 ${L} C ${hw * 0.9} ${L * 0.7}, ${hw * 1.5} ${L * 0.25}, ${hw} 0 Z`;
  const core = `M ${-hw * 0.7} 0 C ${-hw * 0.9} ${L * 0.2}, ${-hw * 0.4} ${L * 0.5}, 0 ${L * 0.62} C ${hw * 0.4} ${L * 0.5}, ${hw * 0.9} ${L * 0.2}, ${hw * 0.7} 0 Z`;
  return (
    <g opacity={opacity} style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`fo${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.flameMid} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={C.flameOut} stopOpacity={0.75} />
          <stop offset="1" stopColor={C.flameOut} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`fc${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.flameCore} />
          <stop offset="0.6" stopColor={C.flameMid} stopOpacity={0.8} />
          <stop offset="1" stopColor={C.flameMid} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`fg${id}`} cx="0.5" cy="0.15" r="0.6">
          <stop offset="0" stopColor={C.flameMid} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.flameOut} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={L * 0.25} rx={hw * 3.2} ry={L * 0.55} fill={`url(#fg${id})`} />
      <path d={outer} fill={`url(#fo${id})`} />
      <path d={core} fill={`url(#fc${id})`} />
      {diamonds &&
        [0.16, 0.3, 0.43].map((p, i) => (
          <ellipse key={i} cx={0} cy={L * p} rx={hw * (0.55 - i * 0.12)} ry={hw * 0.22} fill={C.flameCore} opacity={0.75 - i * 0.2} />
        ))}
    </g>
  );
};
