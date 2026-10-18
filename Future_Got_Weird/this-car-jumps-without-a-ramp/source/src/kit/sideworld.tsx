// Side-view road world: sky, far hills and trees (parallax, drawn in screen space), and the road band in world mm.
// The wheels touch y = road(x) along the middle of the band; the band's near and far edges are drawn a little below and
// above so the road reads as a surface seen from slightly above.
import React from 'react';
import {C} from '../theme';
import {Cam, toScreen} from './stage';
import {rand} from './util';

export type Sign = {x: number; kind: 'brake' | 'bend' | 'bumps'; opacity?: number};

const FAR_EDGE = 330;
const NEAR_EDGE = -700;

/** Road height under x (mm): flat, plus bumps in the uneven patches. */
export type Profile = (x: number) => number;
export const FLAT: Profile = () => 0;

export const SideWorld: React.FC<{cam: Cam; profile?: Profile; patches?: [number, number][]; signs?: Sign[]; stopLine?: number; sky?: string; groundTone?: number}> =
  ({cam, profile = FLAT, patches = [], signs = [], stopLine}) => {
    const g0 = toScreen(cam, 0, 0);
    const xl = cam.x - 980 / cam.z - 400, xr = cam.x + 980 / cam.z + 400;
    // depth factor for the far layers: they zoom much less than the road
    const dz = Math.pow(cam.z / 0.24, 0.25);
    const horizon = g0.y - 150 * dz;
    const par = (p: number, period: number) => (((-cam.x * cam.z * p) % period) + period) % period;
    const hills = (p: number, amp: number, base: number, fill: string, seed: number, period = 2400) => {
      const off = par(p, period);
      const pts: string[] = [];
      for (let sx = -period; sx <= 1920 + period; sx += 60) {
        const u = (sx - off) / period;
        const k = Math.floor(u);
        const f = u - k;
        const h0 = 0.4 + 0.6 * rand(seed + k), h1 = 0.4 + 0.6 * rand(seed + k + 1);
        const h = h0 + (h1 - h0) * (f * f * (3 - 2 * f));
        pts.push(`${sx},${horizon - base * dz - amp * dz * h * (0.75 + 0.25 * Math.sin(f * Math.PI))}`);
      }
      return <path d={`M -2400 1200 L ${pts.join(' L ')} L 4400 1200 Z`} fill={fill} stroke={C.ink} strokeWidth={3} strokeOpacity={0.35} />;
    };
    const trees = (p: number, seed: number) => {
      const period = 3200;
      const off = par(p, period);
      const out: React.ReactNode[] = [];
      for (let k = -1; k < 3; k++) {
        for (let j = 0; j < 4; j++) {
          const r = rand(seed + k * 7 + j * 31);
          if (r < 0.35) continue;
          const sx = off + k * period + j * 800 + r * 300;
          const s = (0.8 + 0.4 * rand(seed + j + k * 3)) * dz;
          const by = horizon + 6;
          out.push(
            <g key={`${k}-${j}`} transform={`translate(${sx} ${by}) scale(${s})`}>
              <rect x={-7} y={-60} width={14} height={60} fill="#8A6A4A" stroke={C.ink} strokeWidth={3} />
              <circle cx={0} cy={-92} r={46} fill="#5FB8A6" stroke={C.ink} strokeWidth={3} />
              <circle cx={-24} cy={-74} r={30} fill="#77C6B4" stroke={C.ink} strokeWidth={3} />
            </g>,
          );
        }
      }
      return out;
    };
    // road polylines (profile only shifts the contact line; the band edges stay level)
    const step = Math.max(40, 12 / cam.z);
    const contact: string[] = [];
    for (let x = xl; x <= xr; x += step) contact.push(`${x},${profile(x)}`);
    const dashes: React.ReactNode[] = [];
    const P = 5200;
    for (let k = Math.floor(xl / P) - 1; k <= Math.ceil(xr / P); k++) {
      dashes.push(<rect key={k} x={k * P} y={-330} width={2400} height={110} fill={C.cream} opacity={0.9} />);
    }
    return (
      <g>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CFE7E4" />
            <stop offset="1" stopColor="#FAF3DF" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#sky)" />
        <circle cx={1500 - par(0.02, 4000) * 0} cy={horizon - 330 * dz} r={70 * dz} fill={C.saffronLight} opacity={0.9} />
        {hills(0.05, 170, 40, '#BFE0D8', 11)}
        {hills(0.12, 120, 0, '#A6D6CB', 23, 1900)}
        {/* grass from the horizon down; the road band is drawn over it in world units */}
        <rect x={0} y={horizon} width={1920} height={1080} fill="#CFE3B8" />
        {trees(0.3, 5)}
        <g transform={`translate(960 540) scale(${cam.z} ${-cam.z}) translate(${-cam.x} ${-cam.y})`}>
          {/* verge beyond the road, kerb, road band, near verge */}

          <rect x={xl} y={FAR_EDGE} width={xr - xl} height={60} fill="#E2DAC4" />
          <rect x={xl} y={NEAR_EDGE} width={xr - xl} height={FAR_EDGE - NEAR_EDGE} fill="#8F999D" />
          <rect x={xl} y={NEAR_EDGE} width={xr - xl} height={(FAR_EDGE - NEAR_EDGE) * 0.42} fill="#86909A" opacity={0.6} />
          {patches.map(([a, b], i) => (
            <rect key={i} x={a} y={NEAR_EDGE + 80} width={b - a} height={FAR_EDGE - NEAR_EDGE - 160} rx={60} fill="#7A8389" stroke={C.ink} strokeWidth={2.5 / cam.z} strokeOpacity={0.5} />
          ))}
          {dashes}
          {stopLine !== undefined && <rect x={stopLine} y={NEAR_EDGE + 40} width={260} height={FAR_EDGE - NEAR_EDGE - 80} fill={C.cream} />}
          <rect x={xl} y={NEAR_EDGE - 50} width={xr - xl} height={50} fill="#E2DAC4" />
          <rect x={xl} y={NEAR_EDGE - 8000} width={xr - xl} height={7950} fill="#BFD9A8" />
          <line x1={xl} y1={FAR_EDGE + 60} x2={xr} y2={FAR_EDGE + 60} stroke={C.ink} strokeWidth={3 / cam.z} strokeOpacity={0.5} />
          <line x1={xl} y1={NEAR_EDGE - 50} x2={xr} y2={NEAR_EDGE - 50} stroke={C.ink} strokeWidth={3 / cam.z} strokeOpacity={0.5} />
          {/* raised bumps where the profile is above the road */}
          <path d={`M ${xl} 0 L ${contact.join(' L ')} L ${xr} 0 Z`} fill="#A3ACB0" stroke={C.ink} strokeWidth={3 / cam.z} strokeLinejoin="round" />
          {signs.map((s, i) => <RoadSign key={i} x={s.x} kind={s.kind} px={cam.z} opacity={s.opacity ?? 1} />)}
        </g>
      </g>
    );
  };

const RoadSign: React.FC<{x: number; kind: Sign['kind']; px: number; opacity: number}> = ({x, kind, px, opacity}) => {
  const sw = 4 / px;
  const y0 = FAR_EDGE + 30;
  return (
    <g opacity={opacity}>
      <rect x={x - 30} y={y0} width={60} height={1700} fill="#B8C2C8" stroke={C.ink} strokeWidth={sw} />
      <g transform={`translate(${x} ${y0 + 2000})`}>
        {kind === 'brake' && (
          <g>
            <polygon points="-330,-140 -140,-330 140,-330 330,-140 330,140 140,330 -140,330 -330,140" fill={C.coral} stroke={C.ink} strokeWidth={sw} />
            <g transform={`scale(${1 / px} ${-1 / px})`}>
              <text x={0} y={0} dy={0.35 * 0} textAnchor="middle" dominantBaseline="central" fontFamily="'Fredoka Variable'" fontWeight={700} fontSize={150 * px} fill={C.white}>BRAKE</text>
            </g>
          </g>
        )}
        {kind === 'bend' && (
          <g>
            <polygon points="0,380 380,0 0,-380 -380,0" fill={C.saffron} stroke={C.ink} strokeWidth={sw} />
            <path d="M -60 -200 L -60 40 C -60 140 20 180 120 180" fill="none" stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
            <polygon points="100,260 220,180 100,100" fill={C.ink} />
          </g>
        )}
        {kind === 'bumps' && (
          <g>
            <polygon points="0,380 380,0 0,-380 -380,0" fill={C.saffron} stroke={C.ink} strokeWidth={sw} />
            <path d="M -220 -110 L -150 -110 C -110 20 -40 20 0 -110 C 40 20 110 20 150 -110 L 220 -110" fill="none" stroke={C.ink} strokeWidth={60} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
    </g>
  );
};
