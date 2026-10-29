// A leaf right in front of the lens as the camera pushes through the foliage (the loop transition): so close it is
// out of focus, it sweeps across the frame and, for a few frames, covers it.
import React from 'react';
import {clamp} from '../lib';

const f2 = (n: number) => n.toFixed(1);
export const LENS = {t0: 30.1, t1: 30.48};
export const LensLeaf: React.FC<{t: number; ns: string}> = ({t, ns}) => {
  if (t < LENS.t0 || t > LENS.t1) return null;
  const u = clamp((t - LENS.t0) / (LENS.t1 - LENS.t0));
  // quick in and out, lingering across the middle of the frame (where it covers the closest part of the move)
  const x = 2 * u - 1;
  const e = 0.5 + 0.5 * Math.sign(x) * Math.abs(x) ** 1.7;
  // the leaf's centre travels from below-right to above-left, through the middle of the frame
  const cx = 1900 - 2760 * e, cy = 3600 - 5100 * e;
  const L = 4200, Wd = 2500;
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    const x = Math.cos(a) * L / 2;
    const w = Math.sin(a) * Wd / 2 * Math.pow(Math.abs(Math.cos(a / 2)) * 0.35 + 0.65, 1);
    pts.push(`${f2(x)},${f2(w * (1 - 0.25 * Math.cos(a)))}`);
  }
  const veins: string[] = [];
  for (let k = -5; k <= 5; k++) {
    if (k === 0) continue;
    const x0 = k * 230;
    veins.push(`M${f2(x0)},0 Q${f2(x0 + 200)},${f2(Math.sign(k) * 260)} ${f2(x0 + 380)},${f2(Math.sign(k) * 560)}`);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, filter: 'blur(7px)'}}>
      <defs>
        <linearGradient id={`${ns}lensg`} x1="0" y1="-0.5" x2="0" y2="1">
          <stop offset="0" stopColor="#A6CC86" />
          <stop offset="0.55" stopColor="#6FA65A" />
          <stop offset="1" stopColor="#3F7A3A" />
        </linearGradient>
      </defs>
      <g transform={`translate(${f2(cx)} ${f2(cy)}) rotate(-58)`}>
        <polygon points={pts.join(' ')} fill={`url(#${ns}lensg)`} />
        <path d={`M${f2(-L / 2)},0 L${f2(L / 2)},0`} stroke="#C9E0A4" strokeWidth="38" opacity="0.8" />
        {veins.map((d, k) => <path key={k} d={d} stroke="#BBD99A" strokeWidth="14" fill="none" opacity="0.55" />)}
      </g>
    </svg>
  );
};
