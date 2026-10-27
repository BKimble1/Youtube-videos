// Editorial foreground wipes between separate demonstrations (the brief: a moving foreground object and a smooth
// transition, never implying one continuous route). A dark rock spur sweeps across the frame close to the lens; the
// cut happens while it fully covers the frame. Mist (the canyon's morning cloud) does the same on the way back.
import React from 'react';
import {f2} from '../eng/draw';
import {noise1} from '../dc/math';

/** progress p: 0 = spur entering at the right edge, 0.5 = covering the frame, 1 = gone off the left edge */
export const RockWipe: React.FC<{p: number}> = ({p}) => {
  if (p <= 0 || p >= 1) return null;
  const e = p < 0.5 ? 1 - Math.pow(1 - p * 2, 2) : 1 + Math.pow(p * 2 - 1, 2);
  const x = 1080 * 1.05 - e * 1080 * 1.6;
  const wd = 1700;
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = -100 + (i / 24) * 2120;
    pts.push(`${f2(x + 60 * noise1(i * 0.7, 3) + 40 * Math.sin(i * 1.3))},${f2(y)}`);
  }
  for (let i = 24; i >= 0; i--) {
    const y = -100 + (i / 24) * 2120;
    pts.push(`${f2(x + wd + 60 * noise1(i * 0.6, 4))},${f2(y)}`);
  }
  const ed = pts.slice(0, 25).join(' L');
  return (
    <g>
      <defs>
        <linearGradient id="rw-g" gradientUnits="userSpaceOnUse" x1={f2(x)} y1="0" x2={f2(x + 500)} y2="0">
          <stop offset="0" stopColor="#5E5244" />
          <stop offset="0.25" stopColor="#3B332B" />
          <stop offset="1" stopColor="#241F1A" />
        </linearGradient>
      </defs>
      <path d={`M${pts.join(' L')} Z`} fill="url(#rw-g)" />
      <path d={`M${ed}`} fill="none" stroke="#8C7B65" strokeWidth={10} opacity={0.7} strokeLinejoin="round" />
      <path d={`M${ed}`} fill="none" stroke="#172B3A" strokeWidth={4} strokeLinejoin="round" />
      {[0.2, 0.45, 0.7].map((k, i) => (
        <path key={i} d={`M${f2(x + 120 + i * 90)},${f2(200 + k * 1500)} q 140,40 260,-30`} stroke="#6B5D4C" strokeWidth={6} fill="none" opacity={0.5} />
      ))}
    </g>
  );
};

/** soft mist bank: billows sweep left to right; covers the frame at p = 0.5 */
export const MistWipe: React.FC<{p: number}> = ({p}) => {
  if (p <= 0 || p >= 1) return null;
  const e = p < 0.5 ? 1 - Math.pow(1 - p * 2, 2) : 1 + Math.pow(p * 2 - 1, 2);
  const x = -1700 + e * 1080 * 1.6;
  const blobs = Array.from({length: 22}, (_, i) => ({u: (i % 4) * 330 + noise1(i, 6) * 80, v: Math.floor(i / 4) * 380 + noise1(i, 7) * 90, r: 360 + 120 * noise1(i, 8)}));
  return (
    <g>
      <rect x={f2(x + 260)} y={-60} width={1200} height={2040} fill="#EEF3F3" />
      {blobs.map((b, i) => (
        <circle key={i} cx={f2(x + 1460 + b.u * 0.35)} cy={f2(b.v)} r={f2(b.r * 0.8)} fill={i % 3 ? '#F4F7F7' : '#E3EBEC'} />
      ))}
      {blobs.map((b, i) => (
        <circle key={`l${i}`} cx={f2(x + 260 - b.u * 0.12)} cy={f2(b.v)} r={f2(b.r * 0.6)} fill="#F2F6F6" />
      ))}
    </g>
  );
};
