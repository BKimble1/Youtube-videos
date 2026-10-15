// V6 splash: the crown rises and falls back into the liquid (no state swaps), droplets cool continuously and each one
// that lands back in the vessel leaves its own small ripple at the landing point. Centred on the entry point x.
import React from 'react';
import {FD, FCOL} from '../../v4/sets/foundry';
import {rnd} from '../../v4/kit/scene';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp01(k)).toString(16).padStart(2, '0')).join('');
};
/** droplet colour: white-hot → orange → dark red, continuously */
const dropCol = (u: number) => (u < 0.5 ? mixHex('#FFF2B8', '#FFB43A', u / 0.5) : mixHex('#FFB43A', '#D9541A', (u - 0.5) / 0.5));
const G = 1500;

export const Splash6: React.FC<{x: number; t: number; lw: number; part: 'back' | 'front'; scale?: number}> = ({x, t, lw, part, scale = 1}) => {
  if (t < 0) return null;
  const L = FD.ladle;
  const S = scale;
  const y = L.surf;
  const k = L.sry / L.srx;
  const els: React.ReactNode[] = [];
  const front = part === 'front';
  // ---------------------------------------------------------------- crown: up, then back down into the surface
  if (t < 1.0) {
    const H = 92 * S;
    const h = H * (1 - Math.exp(-t * 10)) * (1 - smooth((t - 0.28) / 0.66));
    const rx = (38 + 112 * (1 - Math.exp(-t * 5))) * S, ry = rx * k;
    const n = 16;
    const pts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (i / n);
      const ex = x - Math.cos(a) * rx * 1.22, ey = y + (front ? 1 : -1) * Math.sin(a) * ry * 1.22;
      const tip = 0.78 + 0.3 * Math.sin(a) + 0.16 * Math.sin(i * 2.31 + 1.7) * (i % 2 ? 0.6 : 1);
      pts.push(`${ex.toFixed(1)} ${(ey - h * tip).toFixed(1)}`);
    }
    for (let i = n; i >= 0; i--) {
      const a = Math.PI * (i / n);
      pts.push(`${(x - Math.cos(a) * rx * 0.74).toFixed(1)} ${(y + (front ? 1 : -1) * Math.sin(a) * ry * 0.74).toFixed(1)}`);
    }
    const op = 1 - smooth((t - 0.8) / 0.2);
    if (h > 0.5 && op > 0) {
      els.push(
        <g key="crown" opacity={op}>
          <path d={'M' + pts.join('L') + 'Z'} fill={front ? '#FFC24A' : '#F2861E'} stroke={FCOL.ink} strokeWidth={lw * 0.8} strokeLinejoin="round" />
          <path d={'M' + pts.slice(0, n + 1).join('L')} fill="none" stroke="#FFF6D0" strokeWidth={lw * 1.6} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    }
  }
  // ---------------------------------------------------------------- droplets (front part only) + their landing ripples
  if (front) {
    for (let i = 0; i < 24; i++) {
      const t0 = rnd(i * 5) * 0.16;
      const tt = t - t0;
      if (tt <= 0) continue;
      const ang = -Math.PI / 2 + (rnd(i * 7) - 0.5) * 2.0;
      const v = (300 + rnd(i * 11) * 380) * S;
      const vx = Math.cos(ang) * v * 0.9, vy = Math.sin(-ang) * v;
      const tImp = (vy + Math.sqrt(vy * vy + 4 * 0.5 * G * 10)) / G;   // back at the surface level
      if (tt < tImp) {
        const px = x + vx * tt, py = y - 10 - (vy * tt - 0.5 * G * tt * tt);
        const r = lw * (1.4 + rnd(i * 13) * 1.8) * S;
        els.push(<circle key={'d' + i} cx={px} cy={py} r={r} fill={dropCol(tt / tImp)} stroke={FCOL.ink} strokeWidth={lw * 0.35} />);
      } else {
        const ix = x + vx * tImp;
        const inside = Math.abs(ix - L.cx) < L.srx * 0.92;
        const d = tt - tImp;
        if (inside && d < 0.45) {
          const rr = (5 + 46 * smooth(d / 0.45)) * S;
          els.push(<ellipse key={'r' + i} cx={ix} cy={y} rx={rr} ry={rr * k} fill="none" stroke="#FFF2C8" strokeWidth={lw * 1.1} opacity={0.8 * (1 - d / 0.45)} />);
        }
      }
    }
    // contact flash ring
    if (t < 0.25) els.push(<ellipse key="flash" cx={x} cy={y} rx={(60 + 300 * t) * S} ry={(60 + 300 * t) * S * k * 1.1} fill="#FFF3C0" opacity={(1 - t / 0.25) * 0.75} />);
  }
  return <g>{els}</g>;
};
