// The desert floor in late-afternoon light (units cm, y down; the subject plane's ground is y = 0). The camera looks
// down on it, so there is no horizon: the ground recedes up the frame, finer and hazier with distance.
// V2: every layer is exactly periodic along x with PERIOD, the distance the lizard escapes. The camera ends the film one
// period to the left of where it starts, so the last frame matches frame 0 (Scene.tsx moves all layers by the same
// world x before their depth scale).
//   Far    hazy ground, soft creosote clumps and rocks
//   Mid    dry grass tufts and stones
//   Ground the plane the animals stand on: sand, ripples, pebbles with their shadows, a crack
//   Fore   out-of-focus pebbles and grass blades nearest the lens
import React from 'react';
import {closed, pt} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {hash} from '../lib';

export const PERIOD = 45;
const REPS = Array.from({length: 16}, (_, k) => k - 10);
const tile = (make: (x0: number) => React.ReactNode) => REPS.map((k) => <g key={k}>{make(k * PERIOD)}</g>);
const D = {
  sandFar: '#EBD3A6', sand: '#DDBB86', sandNear: '#C99F6A', ripple: '#C59A63', rippleLit: '#F2DDB4',
  peb: ['#B08A62', '#9C7A58', '#C8A981', '#8B6B4E', '#D6BE98'], pebDk: '#6E5038', ink: '#5A4030',
  bush: '#7F8452', bushDk: '#5C6339', bushLit: '#A7A86B', grass: '#D9B56E', grassDk: '#A88445',
};

export const Far: React.FC = () => {
  const ids = {g: uid('dg')};
  const one = (x0: number) => (
    <g>
      {[0, 1].map((i) => {
        const x = x0 + (i + hash(i * 3.3) * 0.6) * (PERIOD / 2), y = -64 + hash(i * 7.1) * 26, r = 4 + hash(i * 1.7) * 4;
        const pts = Array.from({length: 9}, (_, k) => {
          const a = (k / 9) * Math.PI * 2, rr = r * (0.8 + 0.3 * hash(i * 13 + k));
          return pt(x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr * (a > Math.PI ? 0.75 : 0.35));
        });
        return (
          <g key={i}>
            <ellipse cx={x + 2} cy={y + r * 0.35} rx={r * 1.4} ry={r * 0.25} fill="#9C7E58" opacity={0.25} />
            <path d={closed(pts, 0.9)} fill={i ? D.bushDk : D.bush} />
            <path d={closed(pts.map((q) => pt(q.x - 1, q.y - r * 0.12)), 0.9)} fill={D.bushLit} opacity={0.35} />
          </g>
        );
      })}
      {[0, 1, 2].map((i) => {
        const x = x0 + hash(i * 5.9 + 2) * PERIOD, y = -46 + hash(i * 2.2) * 40, r = 1.5 + hash(i * 8.1) * 3;
        return <ellipse key={'r' + i} cx={x} cy={y} rx={r * 1.4} ry={r * 0.6} fill={i % 2 ? '#C4A57E' : '#B0906A'} />;
      })}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={ids.g} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#F3E2C0" />
          <stop offset={0.45} stopColor={D.sandFar} />
          <stop offset={1} stopColor={D.sand} />
        </linearGradient>
      </defs>
      <rect x={-3000} y={-400} width={6000} height={900} fill={`url(#${ids.g})`} />
      {tile(one)}
    </g>
  );
};

export const Mid: React.FC = () => {
  const one = (x0: number) => (
    <g>
      {[0, 1, 2].map((i) => {
        const x = x0 + hash(i * 6.3 + 1) * PERIOD, y = -36 + hash(i * 1.9) * 28, r = 0.8 + hash(i * 3.1) * 2.2;
        return (
          <g key={'s' + i}>
            <ellipse cx={x + r * 0.4} cy={y + r * 0.4} rx={r * 1.5} ry={r * 0.45} fill="#8C6A48" opacity={0.3} />
            <ellipse cx={x} cy={y} rx={r * 1.2} ry={r * 0.7} fill={D.peb[i % 5]} />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.25} rx={r * 0.6} ry={r * 0.3} fill="#F1DDBA" opacity={0.4} />
          </g>
        );
      })}
      {[0, 1, 2, 3].map((i) => {
        const x = x0 + (i + hash(i * 4.7)) * (PERIOD / 4), y = -40 + hash(i * 9.3) * 28, h = 5 + hash(i * 2.1) * 6;
        return (
          <g key={'t' + i}>
            {Array.from({length: 9}, (_, k) => {
              const a = -Math.PI / 2 + (k - 4) * 0.18 + 0.1 * Math.sin(i + k), l = h * (0.6 + 0.4 * hash(i * 3 + k));
              return <path key={k} d={`M${x + (k - 4) * 0.25} ${y} Q${x + Math.cos(a) * l * 0.5} ${y + Math.sin(a) * l * 0.6} ${x + Math.cos(a) * l} ${y + Math.sin(a) * l}`} stroke={k % 3 ? D.grass : D.grassDk} strokeWidth={0.45} fill="none" strokeLinecap="round" />;
            })}
          </g>
        );
      })}
    </g>
  );
  return <g>{tile(one)}</g>;
};

export const Ground: React.FC = () => {
  const ids = {g: uid('gg')};
  const one = (x0: number) => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 56; i++) {
      const x = x0 + hash(i * 2.71) * PERIOD, y = -26 + hash(i * 5.13) * 64;
      const far = (26 + Math.min(0, y)) / 26;
      const r = (0.12 + hash(i * 7.7) ** 2 * 0.9) * (y < 0 ? 0.5 + 0.5 * far : 1);
      const c = D.peb[Math.floor(hash(i * 3.9) * 5)];
      out.push(
        <g key={i}>
          <ellipse cx={x + r * 0.45} cy={y + r * 0.35} rx={r * 1.3} ry={r * 0.5} fill={D.pebDk} opacity={0.32} />
          <ellipse cx={x} cy={y} rx={r * 1.15} ry={r * 0.72} fill={c} />
          <ellipse cx={x - r * 0.35} cy={y - r * 0.25} rx={r * 0.5} ry={r * 0.26} fill="#FFF3DA" opacity={0.45} />
        </g>,
      );
    }
    for (let i = 0; i < 7; i++) {
      const x = x0 + hash(i * 8.3) * PERIOD, y = -24 + hash(i * 4.4) * 60, l = 6 + hash(i * 1.1) * 10;
      out.push(
        <g key={'r' + i} opacity={0.5}>
          <path d={`M${x} ${y} q${l / 2} ${-0.8} ${l} ${0.2}`} stroke={D.ripple} strokeWidth={0.35} fill="none" strokeLinecap="round" />
          <path d={`M${x} ${y - 0.35} q${l / 2} ${-0.8} ${l} ${0.2}`} stroke={D.rippleLit} strokeWidth={0.25} fill="none" strokeLinecap="round" />
        </g>,
      );
    }
    const cx = x0 + hash(12.7) * PERIOD, cyy = 6 + hash(6.6) * 20;
    out.push(<path key="c" d={`M${cx} ${cyy} l3 1.2 l2.4 -0.6 l3.6 1.4 m-6 -0.8 l-0.8 2.2`} stroke={mix(D.ripple, D.ink, 0.4)} strokeWidth={0.22} fill="none" opacity={0.5} />);
    return <g>{out}</g>;
  };
  return (
    <g>
      <defs>
        <linearGradient id={ids.g} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={D.sandFar} stopOpacity={0} />
          <stop offset={0.12} stopColor={D.sand} stopOpacity={1} />
          <stop offset={0.6} stopColor={D.sand} />
          <stop offset={1} stopColor={D.sandNear} />
        </linearGradient>
      </defs>
      <rect x={-3000} y={-34} width={6000} height={110} fill={`url(#${ids.g})`} />
      <rect x={-3000} y={75} width={6000} height={400} fill={D.sandNear} />
      {tile(one)}
    </g>
  );
};

export const Fore: React.FC = () => (
  <g>
    {tile((x0) => (
      <g>
        {[0, 1].map((i) => {
          const x = x0 + hash(i * 9.9) * PERIOD, y = 18 + hash(i * 3.5) * 14, r = 1 + hash(i * 6.2) * 1.8;
          return <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r * 0.7} fill={D.peb[i % 5]} />;
        })}
        {Array.from({length: 5}, (_, k) => {
          const x = x0 + hash(4.2) * PERIOD;
          return <path key={k} d={`M${x + k * 0.5} 26 q${-1 + k * 0.6} -5 ${-2 + k * 1.2} -9`} stroke={k % 2 ? D.grass : D.grassDk} strokeWidth={0.5} fill="none" strokeLinecap="round" />;
        })}
      </g>
    ))}
  </g>
);
