// The desert floor in late-afternoon light (units cm, y down; the subject plane's ground is y = 0). The camera looks
// down on it, so there is no horizon: the ground recedes up the frame, finer and hazier with distance. Drawn as depth
// layers (Scene.tsx places each through the pinhole dolly and softens it by distance from focus):
//   Far    hazy ground, soft creosote clumps and rocks
//   Mid    dry grass tufts, stones, a prickly pear
//   Ground the plane the animals stand on: sand, ripples, pebbles with their shadows, a few cracks
//   Fore   out-of-focus pebbles and grass blades nearest the lens
import React from 'react';
import {closed, pt} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {hash} from '../lib';

const D = {
  sandFar: '#EBD3A6', sand: '#DDBB86', sandNear: '#C99F6A', ripple: '#C59A63', rippleLit: '#F2DDB4',
  peb: ['#B08A62', '#9C7A58', '#C8A981', '#8B6B4E', '#D6BE98'], pebDk: '#6E5038', ink: '#5A4030',
  bush: '#7F8452', bushDk: '#5C6339', bushLit: '#A7A86B', grass: '#D9B56E', grassDk: '#A88445', cactus: '#7E9A57', cactusDk: '#55703A',
};
const X0 = -260, X1 = 160;

export const Far: React.FC = () => {
  const ids = {g: uid('dg')};
  const bushes = Array.from({length: 26}, (_, i) => {
    const x = X0 + hash(i * 3.3) * (X1 - X0), y = -70 + hash(i * 7.1) * 40, r = 6 + hash(i * 1.7) * 9;
    const pts = Array.from({length: 9}, (_, k) => {
      const a = (k / 9) * Math.PI * 2;
      const rr = r * (0.8 + 0.3 * hash(i * 13 + k));
      return pt(x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr * (a > Math.PI ? 0.75 : 0.35));
    });
    return (
      <g key={i}>
        <ellipse cx={x + 2} cy={y + r * 0.35} rx={r * 1.4} ry={r * 0.25} fill="#9C7E58" opacity={0.25} />
        <path d={closed(pts, 0.9)} fill={hash(i * 2.9) > 0.5 ? D.bush : D.bushDk} />
        <path d={closed(pts.map((q) => pt(q.x - 1, q.y - r * 0.12)), 0.9)} fill={D.bushLit} opacity={0.35} transform={`translate(${-r * 0.1} 0) scale(1 1)`} />
      </g>
    );
  });
  const rocks = Array.from({length: 18}, (_, i) => {
    const x = X0 + hash(i * 5.9) * (X1 - X0), y = -50 + hash(i * 2.2) * 50, r = 2 + hash(i * 8.1) * 5;
    return <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r * 0.6} fill={hash(i) > 0.5 ? '#C4A57E' : '#B0906A'} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={ids.g} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#F3E2C0" />
          <stop offset={0.45} stopColor={D.sandFar} />
          <stop offset={1} stopColor={D.sand} />
        </linearGradient>
      </defs>
      <rect x={-2000} y={-400} width={4000} height={900} fill={`url(#${ids.g})`} />
      {rocks}
      {bushes}
    </g>
  );
};

export const Mid: React.FC = () => {
  const tufts = Array.from({length: 30}, (_, i) => {
    const x = X0 + hash(i * 4.7) * (X1 - X0), y = -42 + hash(i * 9.3) * 30, h = 5 + hash(i * 2.1) * 7;
    const blades = Array.from({length: 9}, (_, k) => {
      const a = -Math.PI / 2 + (k - 4) * 0.18 + 0.1 * Math.sin(i + k);
      const l = h * (0.6 + 0.4 * hash(i * 3 + k));
      return <path key={k} d={`M${x + (k - 4) * 0.25} ${y} Q${x + Math.cos(a) * l * 0.5} ${y + Math.sin(a) * l * 0.6} ${x + Math.cos(a) * l} ${y + Math.sin(a) * l}`} stroke={k % 3 ? D.grass : D.grassDk} strokeWidth={0.45} fill="none" strokeLinecap="round" />;
    });
    return <g key={i}>{blades}</g>;
  });
  const stones = Array.from({length: 22}, (_, i) => {
    const x = X0 + hash(i * 6.3) * (X1 - X0), y = -36 + hash(i * 1.9) * 28, r = 0.8 + hash(i * 3.1) * 2.4;
    return (
      <g key={i}>
        <ellipse cx={x + r * 0.4} cy={y + r * 0.4} rx={r * 1.5} ry={r * 0.45} fill="#8C6A48" opacity={0.3} />
        <ellipse cx={x} cy={y} rx={r * 1.2} ry={r * 0.7} fill={D.peb[i % 5]} />
        <ellipse cx={x - r * 0.3} cy={y - r * 0.25} rx={r * 0.6} ry={r * 0.3} fill="#F1DDBA" opacity={0.4} />
      </g>
    );
  });
  // a prickly pear clump behind the action, to the right of frame centre
  const pads = [
    [-4, -40, 4.2, 5.6, 0], [-9, -46, 3.4, 4.6, -0.5], [0, -47, 3.0, 4.2, 0.45], [-6, -52, 2.6, 3.4, -0.2],
  ].map(([x, y, rx, ry, a], i) => (
    <g key={i} transform={`translate(${x + 46} ${y + 10}) rotate(${a * 57})`}>
      <ellipse rx={rx} ry={ry} fill={D.cactus} stroke={D.cactusDk} strokeWidth={0.3} />
      <ellipse cx={-rx * 0.3} cy={-ry * 0.3} rx={rx * 0.45} ry={ry * 0.45} fill="#A3BC78" opacity={0.5} />
      {Array.from({length: 7}, (_, k) => <circle key={k} cx={(hash(i * 9 + k) - 0.5) * rx * 1.4} cy={(hash(i * 5 + k) - 0.5) * ry * 1.4} r={0.18} fill="#E9DDB0" />)}
    </g>
  ));
  return (
    <g>
      {stones}
      {pads}
      {tufts}
    </g>
  );
};

export const Ground: React.FC = () => {
  const ids = {g: uid('gg')};
  const pebbles: React.ReactNode[] = [];
  for (let i = 0; i < 340; i++) {
    const x = X0 + hash(i * 2.71) * (X1 - X0), y = -26 + hash(i * 5.13) * 64;
    const far = (26 + Math.min(0, y)) / 26; // smaller further back
    const r = (0.12 + hash(i * 7.7) ** 2 * 0.9) * (y < 0 ? 0.5 + 0.5 * far : 1);
    const c = D.peb[Math.floor(hash(i * 3.9) * 5)];
    pebbles.push(
      <g key={i}>
        <ellipse cx={x + r * 0.45} cy={y + r * 0.35} rx={r * 1.3} ry={r * 0.5} fill={D.pebDk} opacity={0.32} />
        <ellipse cx={x} cy={y} rx={r * 1.15} ry={r * 0.72} fill={c} />
        <ellipse cx={x - r * 0.35} cy={y - r * 0.25} rx={r * 0.5} ry={r * 0.26} fill="#FFF3DA" opacity={0.45} />
      </g>,
    );
  }
  const ripples = Array.from({length: 46}, (_, i) => {
    const x = X0 + hash(i * 8.3) * (X1 - X0), y = -24 + hash(i * 4.4) * 60, l = 6 + hash(i * 1.1) * 12;
    return (
      <g key={i} opacity={0.5}>
        <path d={`M${x} ${y} q${l / 2} ${-0.8} ${l} ${0.2}`} stroke={D.ripple} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        <path d={`M${x} ${y - 0.35} q${l / 2} ${-0.8} ${l} ${0.2}`} stroke={D.rippleLit} strokeWidth={0.25} fill="none" strokeLinecap="round" />
      </g>
    );
  });
  const cracks = Array.from({length: 7}, (_, i) => {
    const x = X0 + hash(i * 12.7) * (X1 - X0), y = 4 + hash(i * 6.6) * 24;
    return <path key={i} d={`M${x} ${y} l3 1.2 l2.4 -0.6 l3.6 1.4 m-6 -0.8 l-0.8 2.2`} stroke={mix(D.ripple, D.ink, 0.4)} strokeWidth={0.22} fill="none" opacity={0.5} />;
  });
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
      <rect x={-2000} y={-34} width={4000} height={110} fill={`url(#${ids.g})`} />
      <rect x={-2000} y={75} width={4000} height={400} fill={D.sandNear} />
      {ripples}
      {cracks}
      {pebbles}
    </g>
  );
};

export const Fore: React.FC = () => (
  <g>
    {Array.from({length: 14}, (_, i) => {
      const x = X0 + hash(i * 9.9) * (X1 - X0), y = 18 + hash(i * 3.5) * 14, r = 1 + hash(i * 6.2) * 1.8;
      return <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r * 0.7} fill={D.peb[i % 5]} />;
    })}
    {Array.from({length: 6}, (_, i) => {
      const x = X0 + hash(i * 4.2 + 1) * (X1 - X0), y = 26;
      return (
        <g key={i}>
          {Array.from({length: 5}, (_, k) => (
            <path key={k} d={`M${x + k * 0.5} ${y} q${-1 + k * 0.6} -5 ${-2 + k * 1.2} -9`} stroke={k % 2 ? D.grass : D.grassDk} strokeWidth={0.5} fill="none" strokeLinecap="round" />
          ))}
        </g>
      );
    })}
  </g>
);
