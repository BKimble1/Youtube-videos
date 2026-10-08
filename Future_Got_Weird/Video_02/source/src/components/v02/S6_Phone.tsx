import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {SensorReadout} from './HandheldSensor';

/**
 * S6.2 props: a generic phone (no brand, no logo) whose screen shows the sensor's "raw data" as a grid of tiny
 * arrival-time readouts, and a padlock that drops onto it and snaps shut. SVG groups in the parent's px.
 */

const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Phone geometry relative to its top-left corner. */
export const PHONE = {w: 380, h: 740, bezel: 20, r: 58};
/** The screen rectangle (phone-local). */
export const PHONE_SCREEN = {x: PHONE.bezel, y: PHONE.bezel, w: PHONE.w - 2 * PHONE.bezel, h: PHONE.h - 2 * PHONE.bezel};

/** Seeded bars for one tile of the raw-data grid: a first-bounce peak somewhere early, a small bump later. */
const tileBars = (i: number) => {
  const n = 9;
  const p = 1 + Math.floor(rand(i * 17 + 3) * 2);
  const late = 5 + Math.floor(rand(i * 29 + 5) * 3);
  return Array.from({length: n}, (_, k) => {
    if (k === p) return 0.9 + 0.1 * rand(i * 7 + k);
    if (k === p + 1) return 0.35 + 0.15 * rand(i * 11 + k);
    if (k === late) return 0.18 + 0.12 * rand(i * 13 + k);
    return 0.04 + 0.08 * rand(i * 19 + k);
  });
};

/** The raw-data screen: header plus a 4 × 5 grid of tiny readouts. `veil` greys it out (0..1). */
const RawDataScreen: React.FC<{veil: number}> = ({veil}) => {
  const s = PHONE_SCREEN;
  const cols = 4;
  const rows = 5;
  const tile = 66;
  const gap = 10;
  const gx = s.x + (s.w - (cols * tile + (cols - 1) * gap)) / 2;
  const gy = s.y + 120;
  return (
    <g>
      <text x={s.x + s.w / 2} y={s.y + 70} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={50} fill={C.ink}>
        raw data
      </text>
      {Array.from({length: rows * cols}, (_, i) => {
        const cx = gx + (i % cols) * (tile + gap);
        const cy = gy + Math.floor(i / cols) * (tile + gap);
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <rect x={0} y={0} width={tile} height={tile} rx={8} fill={C.paper} stroke={C.inkMuted} strokeWidth={2.5} />
            <g transform="translate(3 10)">
              <SensorReadout bars={tileBars(i)} bumpFrom={5} width={tile - 6} height={tile - 16} />
            </g>
          </g>
        );
      })}
      {veil > 0 && <rect x={s.x} y={s.y + 110} width={s.w} height={rows * (tile + gap) + 20} fill={C.cream} opacity={0.72 * clamp01(veil)} />}
    </g>
  );
};

/** A generic phone at (x, y) (top-left), screen showing the raw data. */
export const GenericPhone: React.FC<{x: number; y: number; veil?: number; children?: React.ReactNode}> = ({x, y, veil = 0, children}) => {
  const s = PHONE_SCREEN;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={14} y={18} width={PHONE.w} height={PHONE.h} rx={PHONE.r} fill={C.shadow} />
      {/* side buttons */}
      <rect x={-10} y={150} width={16} height={70} rx={6} fill={C.blueDeep} {...ink} strokeWidth={3} />
      <rect x={-10} y={240} width={16} height={110} rx={6} fill={C.blueDeep} {...ink} strokeWidth={3} />
      <rect x={PHONE.w - 6} y={200} width={16} height={100} rx={6} fill={C.blueDeep} {...ink} strokeWidth={3} />
      <rect x={0} y={0} width={PHONE.w} height={PHONE.h} rx={PHONE.r} fill={C.blue} {...ink} />
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={PHONE.r - PHONE.bezel} fill={C.cream} {...ink} strokeWidth={3} />
      {/* front camera and speaker slot */}
      <rect x={PHONE.w / 2 - 44} y={s.y + 16} width={88} height={14} rx={7} fill={C.inkSoft} />
      <RawDataScreen veil={veil} />
      {/* home bar */}
      <rect x={PHONE.w / 2 - 70} y={s.y + s.h - 30} width={140} height={10} rx={5} fill={C.inkMuted} />
      {children}
    </g>
  );
};

/**
 * A padlock centred at (x, y) (centre of its body). `shut` 0 = shackle up (open), 1 = shackle down (locked).
 * `squash` = [sx, sy] for the snap.
 */
export const Padlock: React.FC<{x: number; y: number; scale?: number; shut: number; squash?: [number, number]}> = ({x, y, scale = 1, shut, squash = [1, 1]}) => {
  const lift = -38 * (1 - clamp01(shut));
  const bw = 150;
  const bh = 120;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * squash[0]} ${scale * squash[1]})`}>
      <ellipse cx={8} cy={bh / 2 + 10} rx={bw * 0.55} ry={12} fill={C.shadow} />
      {/* shackle: an ink-outlined U; its right leg slides into the body as it shuts */}
      <g transform={`translate(0 ${lift})`}>
        <path d={`M ${-bw * 0.3} ${-bh * 0.2} L ${-bw * 0.3} ${-bh * 0.62} A ${bw * 0.3} ${bw * 0.3} 0 0 1 ${bw * 0.3} ${-bh * 0.62} L ${bw * 0.3} ${-bh * 0.2}`} fill="none" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
        <path d={`M ${-bw * 0.3} ${-bh * 0.2} L ${-bw * 0.3} ${-bh * 0.62} A ${bw * 0.3} ${bw * 0.3} 0 0 1 ${bw * 0.3} ${-bh * 0.62} L ${bw * 0.3} ${-bh * 0.2}`} fill="none" stroke={C.inkMuted} strokeWidth={20} strokeLinecap="round" />
      </g>
      <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={20} fill={C.saffron} {...ink} />
      <rect x={-bw / 2 + 12} y={-bh / 2 + 12} width={bw - 24} height={16} rx={8} fill={C.saffronLight} />
      <circle cx={0} cy={-4} r={15} fill={C.ink} />
      <path d="M -6 0 L 6 0 L 9 30 L -9 30 Z" fill={C.ink} />
    </g>
  );
};
