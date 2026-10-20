// V4: what she reads in her lenses when the signal arrives: three thin lines of text-like bars in each lens (head
// space of Head4, drawn over the glasses), red-tinted, that fade as she looks up from them at him.
import React from 'react';
import {clamp, fmt, rad} from '../../lib/math';

export const lensA = (t: number) => {
  const up = clamp((t - 25.2) / 0.1);
  const down = 1 - clamp((t - 25.62) / 0.22);
  return up * down;
};

export const LensRead: React.FC<{yaw: number; a: number; f: number}> = ({yaw, a, f}) => {
  if (a <= 0.01) return null;
  const th = rad(yaw);
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const xN = 37 * cs - 90 * sn;
  const xF = -37 * cs - 90 * sn;
  const wN = Math.max(0.12, (37 * sn + 90 * cs) / 90);
  const wF = (-37 * sn + 90 * cs) / 90;
  const lens = (x: number, w: number, id: string) => (
    <g key={id} opacity={a}>
      <defs>
        <clipPath id={id}>
          <ellipse cx={fmt(x)} cy={-10} rx={fmt(Math.max(8, 28 * w))} ry={28} />
        </clipPath>
      </defs>
      <ellipse cx={fmt(x)} cy={-10} rx={fmt(Math.max(8, 28 * w))} ry={28} fill="#FF3340" opacity={0.28} />
      <g clipPath={`url(#${id})`}>
        {[-18, -6, 6].map((y, i) => (
          <rect key={i} x={fmt(x - 22 * w + ((i * 7 + Math.floor(f / 2)) % 5))} y={y} width={fmt((34 - i * 6) * w)} height={5} rx={2.5} fill={i === 0 ? '#FFFFFF' : '#FF8A95'} opacity={0.9} />
        ))}
      </g>
    </g>
  );
  return (
    <g>
      {wF > 0.12 && lens(xF, wF, 'lr-f')}
      {lens(xN, wN, 'lr-n')}
    </g>
  );
};
