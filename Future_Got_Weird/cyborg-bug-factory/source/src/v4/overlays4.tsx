// V4's only on-screen graphic besides the captions: the verified cycle time. "68" stays fixed (no count-up from small
// numbers); a ring around it sweeps once while the sped-up cycle plays, fixing -> release (Lin et al. 2025: "The
// entire automatic assembly, from initially fixing insect to finally releasing insect, spanned 68 s."), and closes on
// the release.
import React from 'react';
import {clamp, ss} from '../lib';

const CYAN = '#5CF2FF';
const YEL = '#FFD84A';

export const Badge68: React.FC<{t: number; t0: number; t1: number; out: number; cx?: number; cy?: number}> = ({t, t0, t1, out, cx = 540, cy = 360}) => {
  const a = ss(t, t0 - 0.2, t0) * (1 - ss(t, out, out + 0.22));
  if (a <= 0.005) return null;
  const u = clamp((t - t0) / (t1 - t0));
  const R = 168;
  const C = 2 * Math.PI * R;
  const done = ss(t, t1 - 0.02, t1 + 0.1);
  const pop = 1 + 0.06 * (t > t1 ? Math.exp(-(t - t1) / 0.12) : 0);
  const sc = (0.92 + 0.08 * ss(t, t0 - 0.2, t0 + 0.05)) * pop;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <g transform={`translate(${cx},${cy}) scale(${sc.toFixed(4)})`}>
        <circle r={R + 30} fill="rgba(6,14,22,0.72)" />
        <circle r={R} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={14} />
        <circle r={R} fill="none" stroke={done > 0.5 ? YEL : CYAN} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={`${(C * u).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90)" />
        <text y={34} textAnchor="middle" fill="#FFFFFF" style={{fontFamily: '"Fredoka Variable", sans-serif', fontWeight: 600, fontSize: 150}}>68</text>
        <text y={98} textAnchor="middle" fill={done > 0.5 ? YEL : '#FFFFFF'} style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 36, letterSpacing: '0.12em'}}>SECONDS</text>
      </g>
    </svg>
  );
};
