import React from 'react';
import {C, OUTLINE} from '../../theme';

/**
 * S7 copy of the small 3×3-zone sensor box (the ams module behind the raw-echo plot and the U reconstruction):
 * a teal box seen face-on, a cream detector panel with a 3×3 dot grid, ONE round emitter window, a lighter top face and
 * a darker side face for depth (the same family as HandheldSensor). Centre at (x, y), `size` = front-face width (px).
 * Outlines stay 4 px at any size. Pure function of its props.
 */
export type ZoneBoxProps = {
  x: number;
  y: number;
  size?: number;
  /** 0..1: the emitter window lights (a pulse leaving) */
  firing?: number;
  /** 0..1: the 3×3 dots light teal (the zones listening) */
  listening?: number;
  opacity?: number;
  /** extra uniform scale about the centre (pop-in, squash) */
  scale?: number;
  asGroup?: boolean;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const f2 = (n: number) => Math.round(n * 100) / 100;

export const ZoneBox: React.FC<ZoneBoxProps> = ({x, y, size = 96, firing = 0, listening = 0, opacity = 1, scale = 1, asGroup}) => {
  const k = size / 96;
  const sw = Math.max(2.5, OUTLINE / k); // stroke in local units that renders at ~4 px
  const W = 96;
  const H = 74;
  const dx = 11;
  const dy = -12;
  const x0 = -W / 2;
  const y0 = -H / 2;
  const top = `M ${x0 + 3} ${y0 + 3} L ${x0 + 3 + dx} ${y0 + dy} L ${x0 + W + dx} ${y0 + dy} L ${x0 + W - 3} ${y0 + 3} Z`;
  const side = `M ${x0 + W - 3} ${y0 + 3} L ${x0 + W + dx} ${y0 + dy} L ${x0 + W + dx} ${y0 + H + dy - 3} L ${x0 + W - 3} ${y0 + H - 3} Z`;
  const fire = clamp01(firing);
  const lis = clamp01(listening);
  // detector panel (left) with the 3x3 zones
  const px0 = x0 + 10;
  const py0 = y0 + 11;
  const pw = 48;
  const ph = 52;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      dots.push(<circle key={`${r}${c}`} cx={px0 + 10 + c * 14} cy={py0 + 12 + r * 14} r={4.6} fill={mix(C.ink, C.teal, lis)} />);
  const g = (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(k * scale)})`} opacity={opacity}>
      <ellipse cx={4} cy={H / 2 + 8} rx={W * 0.55} ry={7} fill={C.shadow} />
      <path d={side} fill={C.tealDeep} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={top} fill={mix(C.teal, C.tealLight, 0.45)} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={x0} y={y0} width={W} height={H} rx={13} fill={C.teal} stroke={C.ink} strokeWidth={sw} />
      <rect x={px0} y={py0} width={pw} height={ph} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={sw * 0.75} />
      {dots}
      {/* the one emitter window */}
      <circle cx={x0 + 76} cy={y0 + 33} r={12} fill={mix(C.coral, C.saffronLight, fire * 0.8)} stroke={C.ink} strokeWidth={sw * 0.85} />
      <circle cx={x0 + 72.5} cy={y0 + 29.5} r={3.4} fill={C.cream} opacity={0.75} />
    </g>
  );
  return asGroup ? (
    g
  ) : (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {g}
    </svg>
  );
};
