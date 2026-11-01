// City pieces shared by the hook street and the neighbourhood: a skyline whose buildings grow and change over time
// (f = 0 present-day city, f = 1 far future): brick and concrete blocks with window grids rise into tapered glass
// towers with light bands and spires; flying pods appear; the sky shifts. Everything is a continuous function of f.
import React from 'react';
import {mix} from '../core/color';
import {clamp, hash, lerp, sm} from '../lib';
import {INK, OUT} from './crew';

const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));

export type Bldg = {x: number; w: number; h0: number; h1: number; c0: string; c1: string; seed: number; delay: number};
export const makeSkyline = (n: number, x0: number, x1: number, seed: number, hmin: number, hmax: number, grow: number, palette0: string[], palette1: string[]): Bldg[] => {
  const out: Bldg[] = [];
  let x = x0;
  let i = 0;
  while (x < x1 && i < n) {
    const r = hash(seed + i * 7.3);
    const w = 70 + r * 110;
    const h0 = hmin + hash(seed + i * 3.1) * (hmax - hmin);
    out.push({x, w, h0, h1: h0 * (1.25 + grow * hash(seed + i * 5.7)), c0: palette0[i % palette0.length], c1: palette1[(i * 3) % palette1.length], seed: seed + i, delay: hash(seed + i * 9.9) * 0.35});
    x += w + 6 + hash(seed + i * 1.7) * 30;
    i++;
  }
  return out;
};

/** one building at time f, standing on y = base */
export const Building: React.FC<{b: Bldg; f: number; base: number; detail?: number; light?: number}> = ({b, f, base, detail = 1, light = 0}) => {
  const u = ss(f, b.delay, b.delay + 0.6); // this building's own renewal
  const h = lerp(b.h0, b.h1, u);
  const taper = 0.18 * u * b.w;
  const spire = 60 * u * (hash(b.seed * 2.2) > 0.45 ? 1 : 0.3);
  const col = mix(b.c0, b.c1, u);
  const top = base - h;
  const x0 = b.x, x1 = b.x + b.w;
  const r = 10 * u;
  const d = `M ${x0} ${base} L ${x0 + taper * 0.3} ${top + r} Q ${x0 + taper * 0.3} ${top} ${x0 + taper * 0.3 + r} ${top} L ${x1 - taper - r} ${top} Q ${x1 - taper} ${top} ${x1 - taper} ${top + r} L ${x1} ${base} Z`;
  const cols = Math.max(2, Math.floor(b.w / 26));
  const rows = Math.floor((h - 20) / 34);
  return (
    <g>
      {spire > 2 && <path d={`M ${(x0 + x1 - taper * 0.7) / 2} ${top} L ${(x0 + x1 - taper * 0.7) / 2} ${top - spire}`} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.85} />}
      {spire > 2 && <circle cx={(x0 + x1 - taper * 0.7) / 2} cy={top - spire} r={4} fill="#FFE7A6" opacity={u} />}
      <path d={d} fill={col} stroke={INK} strokeWidth={OUT * detail} strokeLinejoin="round" />
      {/* shadow side */}
      <path d={`M ${x1 - b.w * 0.22} ${base} L ${x1 - b.w * 0.22 - taper * 0.2} ${top + 2} L ${x1 - taper - 2} ${top + 2} L ${x1 - 2} ${base} Z`} fill={mix(col, '#1A2340', 0.25)} opacity={0.6} />
      {/* present-day windows fade as the light bands come in */}
      {detail > 0.4 && u < 0.98 && (
        <g opacity={1 - u}>
          {Array.from({length: rows}, (_, ry) =>
            Array.from({length: cols}, (_, cx) => {
              const wx = x0 + 10 + cx * ((b.w - 26) / Math.max(1, cols - 1));
              const lit = hash(b.seed * 13 + ry * 7 + cx) < 0.25 + light * 0.5;
              return <rect key={`${ry}-${cx}`} x={wx - 5} y={base - h + 16 + ry * 34} width={11} height={16} rx={2} fill={lit ? '#FFE7A6' : mix(col, '#2A3A5A', 0.45)} />;
            }),
          )}
        </g>
      )}
      {u > 0.02 && (
        <g opacity={u}>
          {Array.from({length: Math.floor(h / 46)}, (_, k) => {
            const y = base - h + 30 + k * 46;
            const inset = taper * (1 - (y - top) / h) * 0.7;
            return <rect key={k} x={x0 + 8 + inset * 0.3} y={y} width={b.w - 16 - inset} height={7} rx={3.5} fill={k % 3 === 0 ? '#BFF4F0' : '#E8FBFF'} opacity={0.85} />;
          })}
        </g>
      )}
    </g>
  );
};

/** a flying pod (future traffic) */
export const Pod: React.FC<{x: number; y: number; s?: number; c?: string; dir?: 1 | -1}> = ({x, y, s = 1, c = '#EF6B55', dir = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
    <ellipse cx={-34} cy={6} rx={22} ry={4} fill="#BFF4F0" opacity={0.7} />
    <path d="M -28 6 Q -30 -14 0 -16 Q 30 -14 34 4 Q 30 14 0 14 Q -26 14 -28 6 Z" fill={c} stroke={INK} strokeWidth={3.5} />
    <path d="M -6 -14 Q 14 -14 22 0 L -4 0 Z" fill="#D3E1F8" stroke={INK} strokeWidth={2.5} />
  </g>
);

export const skyTop = (f: number) => mix('#8ECFE6', '#7AA9DD', f);
export const skyBot = (f: number) => mix('#E9F6F3', '#F3E3EF', f);

/** the hook street (world = screen pixels at zoom 1). f = city time */
export const Street: React.FC<{f: number; t: number; id: string}> = ({f, t, id}) => {
  const far = React.useMemo(() => makeSkyline(20, -400, 1500, 11, 320, 620, 1.3, ['#A9BCD0', '#B8C6D6', '#9EB1C7'], ['#B9E4EC', '#CFE9F7', '#A8D8E6']), []);
  const mid = React.useMemo(() => makeSkyline(14, -300, 1400, 37, 260, 520, 0.9, ['#C77E5E', '#D9A066', '#B9967C', '#8FA3B8'], ['#E8F4F6', '#CFE3F3', '#F5E9D8', '#BFE3E8']), []);
  const base = 1440;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop(f)} />
          <stop offset="1" stopColor={skyBot(f)} />
        </linearGradient>
      </defs>
      <rect x={-1500} y={-1500} width={4080} height={4920} fill={`url(#${id}-sky)`} />
      {/* sun trails: each day's pass leaves an arc, as in a long exposure; they stack up while the years race */}
      {Array.from({length: 8}, (_, k) => (
        <path key={k} d={`M -200 ${980 - k * 26} Q 540 ${40 - k * 38} 1280 ${980 - k * 26}`} fill="none" stroke="#FFF4CC" strokeWidth={6} strokeLinecap="round" opacity={0.32 * clamp(f * 9 - k * 0.9)} />
      ))}
      {/* the sun races across the sky, one day after another, its newest arc still glowing behind it */}
      {f > 0.002 && f < 0.995 && (() => {
        const days = f * 14;
        const u = days % 1;
        const k = Math.floor(days) % 8;
        const y0 = 980 - k * 26, yc = 40 - k * 38;
        const x = (1 - u) * (1 - u) * -200 + 2 * (1 - u) * u * 540 + u * u * 1280;
        const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y0;
        return (
          <g>
            <path d={`M -200 ${y0} Q 540 ${yc} 1280 ${y0}`} fill="none" stroke="#FFF1B8" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${u * 1900} 4000`} opacity={0.55} />
            <circle cx={x} cy={y} r={46} fill="#FFF6D6" opacity={0.45} />
            <circle cx={x} cy={y} r={30} fill="#FFE07A" stroke="#F2B634" strokeWidth={4} />
          </g>
        );
      })()}
      {/* clouds drift */}
      {[0, 1, 2].map((k) => {
        const x = ((k * 520 + t * 30) % 1700) - 300;
        return <path key={k} d={`M ${x} ${300 + k * 120} q 30 -40 70 -10 q 30 -40 80 0 q 40 0 30 30 l -190 0 q -20 -20 10 -20 Z`} fill="#FFFFFF" opacity={0.75} />;
      })}
      <g opacity={0.9}>{far.map((b, i) => <Building key={i} b={b} f={f} base={base - 60} detail={0.6} />)}</g>
      {/* flying pods */}
      {[0, 1, 2, 3].map((k) => {
        const sp = 140 + k * 60;
        const x = ((k * 400 + t * sp) % 1800) - 300;
        return <g key={k} opacity={ss(f, 0.3 + k * 0.08, 0.55 + k * 0.08)}><Pod x={k % 2 ? 1080 - x : x} y={520 + k * 110} s={0.7 + 0.15 * k} c={['#EF6B55', '#FFC744', '#1CA7A0', '#4F7CC9'][k]} dir={k % 2 ? -1 : 1} /></g>;
      })}
      {mid.map((b, i) => <Building key={i} b={b} f={f} base={base} />)}
      {/* street level */}
      <rect x={-1500} y={base} width={4080} height={70} fill={mix('#6E7884', '#5E6E86', f)} stroke={INK} strokeWidth={OUT} />
      <rect x={-1500} y={base + 70} width={4080} height={2000} fill={mix('#D9D2C3', '#E3E6EA', f)} stroke={INK} strokeWidth={OUT} />
      {Array.from({length: 14}, (_, k) => <line key={k} x1={-400 + k * 160} y1={base + 70} x2={-460 + k * 190} y2={base + 600} stroke={INK} strokeWidth={3} opacity={0.18} />)}
      <line x1={-1500} y1={base + 120} x2={2580} y2={base + 120} stroke={INK} strokeWidth={3} opacity={0.18} />
      {/* the guide strip in the future pavement */}
      <rect x={-1500} y={base + 92} width={4080} height={8} fill="#7FE3DC" opacity={ss(f, 0.5, 0.9) * 0.8} />
      {/* street lamp: a classic lamp becomes a slim light blade */}
      <g transform="translate(990 0)">
        <path d={`M 0 ${base + 90} L 0 ${lerp(1000, 940, f)}`} stroke={INK} strokeWidth={lerp(18, 12, f) + 8} strokeLinecap="round" />
        <path d={`M 0 ${base + 90} L 0 ${lerp(1000, 940, f)}`} stroke={mix('#2E3F5C', '#E8F0F5', f)} strokeWidth={lerp(18, 12, f)} strokeLinecap="round" />
        <path d={`M 0 ${lerp(1000, 940, f)} q ${lerp(-60, -90, f)} ${lerp(-10, -4, f)} ${lerp(-80, -130, f)} ${lerp(20, 4, f)}`} fill="none" stroke={INK} strokeWidth={lerp(12, 10, f) + 8} strokeLinecap="round" />
        <path d={`M 0 ${lerp(1000, 940, f)} q ${lerp(-60, -90, f)} ${lerp(-10, -4, f)} ${lerp(-80, -130, f)} ${lerp(20, 4, f)}`} fill="none" stroke={mix('#2E3F5C', '#E8F0F5', f)} strokeWidth={lerp(12, 10, f)} strokeLinecap="round" />
        <ellipse cx={lerp(-80, -130, f)} cy={lerp(1026, 950, f)} rx={lerp(22, 34, f)} ry={lerp(14, 5, f)} fill={mix('#FFE7A6', '#BFF4F0', f)} stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};
