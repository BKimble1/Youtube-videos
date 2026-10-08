import React from 'react';
import {C, OUTLINE} from '../../theme';

/**
 * S3 copy of the small 3×3-zone sensor box (the ams module behind the raw-echo plot; S7 draws the same design for the
 * U reconstruction, see S7_ZoneBox): a teal box seen face-on, a cream detector panel with a 3×3 dot grid, ONE round
 * emitter window, a lighter top face and a darker side face for depth (the same family as HandheldSensor). Centre at
 * (x, y), `size` = front-face width (px). Outlines stay ~4 px at any size. Pure function of its props.
 *
 * S3 addition: `centre` (0..1) marks the centre zone (the zone whose histogram the S3.3 board plots) with a coral dot
 * and ring; `zoneCentre()` gives that dot's position for a leader line.
 */
export type ZoneBoxProps = {
  x: number;
  y: number;
  size?: number;
  /** 0..1: the emitter window lights (a pulse leaving) */
  firing?: number;
  /** 0..1: the 3×3 dots light teal (the zones listening) */
  listening?: number;
  /** 0..1: the centre zone is marked (coral dot + ring) */
  centre?: number;
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

// model geometry (local units, front face 96 wide, centred on 0,0)
const W = 96;
const H = 74;
const X0 = -W / 2;
const Y0 = -H / 2;
const PX0 = X0 + 10;
const PY0 = Y0 + 11;
const dotAt = (r: number, c: number) => ({x: PX0 + 10 + c * 14, y: PY0 + 12 + r * 14});

/** Screen position of the centre zone's dot for a box drawn at (x, y) with `size` (and `scale`). */
export const zoneCentre = (x: number, y: number, size = 96, scale = 1) => {
  const k = (size / 96) * scale;
  const d = dotAt(1, 1);
  return {x: x + d.x * k, y: y + d.y * k};
};

export const ZoneBox: React.FC<ZoneBoxProps> = ({x, y, size = 96, firing = 0, listening = 0, centre = 0, opacity = 1, scale = 1, asGroup}) => {
  const k = size / 96;
  const sw = Math.max(2.5, OUTLINE / (k * scale)); // stroke in local units that renders at ~4 px
  const dx = 11;
  const dy = -12;
  const top = `M ${X0 + 3} ${Y0 + 3} L ${X0 + 3 + dx} ${Y0 + dy} L ${X0 + W + dx} ${Y0 + dy} L ${X0 + W - 3} ${Y0 + 3} Z`;
  const side = `M ${X0 + W - 3} ${Y0 + 3} L ${X0 + W + dx} ${Y0 + dy} L ${X0 + W + dx} ${Y0 + H + dy - 3} L ${X0 + W - 3} ${Y0 + H - 3} Z`;
  const fire = clamp01(firing);
  const lis = clamp01(listening);
  const cen = clamp01(centre);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const p = dotAt(r, c);
      const isC = r === 1 && c === 1;
      dots.push(<circle key={`${r}${c}`} cx={p.x} cy={p.y} r={isC ? 4.6 + 0.8 * cen : 4.6} fill={isC ? mix(mix(C.ink, C.teal, lis), C.coral, cen) : mix(C.ink, C.teal, lis)} />);
    }
  const cp = dotAt(1, 1);
  const g = (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(k * scale)})`} opacity={opacity}>
      <ellipse cx={4} cy={H / 2 + 8} rx={W * 0.55} ry={7} fill={C.shadow} />
      <path d={side} fill={C.tealDeep} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={top} fill={mix(C.teal, C.tealLight, 0.45)} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={X0} y={Y0} width={W} height={H} rx={13} fill={C.teal} stroke={C.ink} strokeWidth={sw} />
      <rect x={PX0} y={PY0} width={48} height={52} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={sw * 0.75} />
      {dots}
      {cen > 0.01 && <circle cx={cp.x} cy={cp.y} r={8.5} fill="none" stroke={C.coralDeep} strokeWidth={sw * 0.55} opacity={cen} />}
      {/* the one emitter window */}
      <circle cx={X0 + 76} cy={Y0 + 33} r={12} fill={mix(C.coral, C.saffronLight, fire * 0.8)} stroke={C.ink} strokeWidth={sw * 0.85} />
      <circle cx={X0 + 72.5} cy={Y0 + 29.5} r={3.4} fill={C.cream} opacity={0.75} />
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
