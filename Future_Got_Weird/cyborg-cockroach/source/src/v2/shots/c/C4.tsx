// C4 (402-423, "watch as the"): the observer's feed is the operator's monitor. Adapted from group A's V2 C4 (shots/a/C4,
// copied, not shared): no pull-back any more. The cut lands on the finished framing: the portrait monitor on its stand
// big at the left, the feed on it continuing frame for frame from C3 (the medic walking ahead down the lane), and the
// operator at the right, close, his eyes on the screen, the remote in his near hand. The physical beats: his eyes
// follow the medic on the screen, he leans in a touch (a small nod forward), and his thumb comes down from its rest to
// hover just over the red button (not pressing; the status LED stays green, armed). The camera is still.
import React from 'react';
import {clamp, sr} from '../../../lib/ease';
import {INK} from '../../../lib/ink';
import {LabWall2, Bench2, LAB2} from '../../sets/Lab2';
import {Cam, Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {C3Feed} from './Feed';
import {OperatorA} from '../a/OperatorA';
import {feedMedicPose, lensAt, place} from './course';

export const C4_FROM = 402, C4_TO = 424;
/** the monitor's screen (scene px): centre and scale of the 1080 x 1920 feed */
export const C4_SCREEN = {x: 362, y: 930, k: 0.35};
const BEZEL = 22;
const BENCH_FAR = 1335;
const BENCH_FRONT = 1640;
const OP = {x: 845, y: 1405, scale: 1.45};
const D_WALL = 2.4;
/** the fixed framing (scene px at the subject plane) */
export const C4_CAM: Cam = {x: 575, y: 950, z: 1.28};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;

/** a flat portrait monitor on a desk stand (scene px): bezel, stand, glass sheen; `children` is the picture, drawn in
 *  a 1080 x 1920 box that is scaled into the screen */
export const Monitor2D: React.FC<{id: string; cx: number; cy: number; k: number; base: number; sheen?: number; children: React.ReactNode}> = ({id, cx, cy, k, base, sheen = 1, children}) => {
  const w = 1080 * k, h = 1920 * k;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const B = BEZEL;
  const neckW = 46;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sc`}>
          <rect x={x0} y={y0} width={w} height={h} />
        </clipPath>
        <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.04} />
          <stop offset="0.41" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-nk`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6E7C88" />
          <stop offset="0.45" stopColor="#8E9BA6" />
          <stop offset="1" stopColor="#56636E" />
        </linearGradient>
      </defs>
      <path d={`M${cx - neckW / 2},${cy + h * 0.1} H${cx + neckW / 2} V${base - 14} H${cx - neckW / 2} Z`} fill={`url(#${id}-nk)`} stroke={INK} strokeWidth={5} />
      <path d={rr(cx - 120, base - 22, cx + 120, base + 6, 12)} fill="#4B5863" stroke={INK} strokeWidth={5} />
      <path d={`M${cx - 104},${base - 16} H${cx + 104}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.22} strokeLinecap="round" />
      <ellipse cx={cx} cy={base + 10} rx={150} ry={10} fill="#1A2630" opacity={0.25} />
      <path d={rr(x0 - B, y0 - B, x0 + w + B, y0 + h + B, 26)} fill="#2A3036" stroke={INK} strokeWidth={6} />
      <path d={rr(x0 - B + 5, y0 - B + 5, x0 + w + B - 5, y0 + h + B - 5, 22)} fill="none" stroke="#56616B" strokeWidth={3} />
      <rect x={x0} y={y0} width={w} height={h} fill="#0E1820" />
      <g clipPath={`url(#${id}-sc)`}>
        <g transform={`translate(${x0} ${y0}) scale(${k})`}>{children}</g>
        <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id}-gl)`} opacity={sheen} />
      </g>
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#11171C" strokeWidth={3} />
      <circle cx={x0 + w - 8} cy={y0 + h + B / 2} r={3.5} fill="#7FE0A8" />
    </g>
  );
};

/** where the medic is on the monitor (scene px), for his eye line */
const medicOnScreen = (f: number) => {
  const t = f / 30;
  const L = lensAt(t, 1080, 1920);
  const m = feedMedicPose(t).frame.o;
  const p = place(L, [m[0], 10, m[2]]);
  const x = clamp(p.x, 120, 960), y = clamp(p.y, 700, 1500);
  return {x: C4_SCREEN.x + (x - 540) * C4_SCREEN.k, y: C4_SCREEN.y + (y - 960) * C4_SCREEN.k};
};

/** the thumb: from its rest (lifted) down to hover just over the cap through the shot (0 = pad on the cap) */
export const c4ThumbLift = (f: number) => 0.8 - 0.55 * sr(f, C4_FROM + 3, C4_TO - 2);

export const C4: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const id = `c4-${f}`;
  const g = medicOnScreen(f);
  const opProps = {
    x: OP.x, y: OP.y, scale: OP.scale, t, expr: 'focus' as const, thumbPress: 0, thumbLift: c4ThumbLift(f), led: 'armed' as const,
    gazeX: g.x, gazeY: g.y, benchTopY: BENCH_FAR, farHand: 'bench' as const, farHandX: 110, nod: 3 * sr(f, C4_FROM + 2, C4_TO - 4),
  };
  const cam = C4_CAM;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id={`${id}-bt`} x1="0" y1={BENCH_FAR} x2="0" y2={BENCH_FRONT} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LAB2.benchTop} />
          <stop offset="1" stopColor={LAB2.benchTopLit} />
        </linearGradient>
        <radialGradient id={`${id}-gw`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#BFE6FF" stopOpacity={0.22} />
          <stop offset="1" stopColor="#BFE6FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-wb)`}>
        <Layer cam={cam} depth={D_WALL}>
          <g transform="translate(-140 -40) scale(1.2)">
            <LabWall2 id={`${id}-w`} />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={1}>
        {/* the screen's cool light falls on the wall and on him */}
        <ellipse cx={C4_SCREEN.x + 160} cy={C4_SCREEN.y} rx={520} ry={560} fill={`url(#${id}-gw)`} />
        <OperatorA id={`${id}-ob`} layer="body" {...opProps} />
        <path d={`M-1500,${BENCH_FAR} H2600 V${BENCH_FRONT} H-1500 Z`} fill={`url(#${id}-bt)`} />
        <path d={`M-1500,${BENCH_FAR} H2600`} stroke={INK} strokeWidth={5} />
        <path d={`M-1500,${BENCH_FAR + 5} H2600`} stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />
        <path d={`M${C4_SCREEN.x + 30},${BENCH_FAR + 2} C${C4_SCREEN.x + 60},${BENCH_FAR + 30} ${C4_SCREEN.x + 150},${BENCH_FAR + 18} ${C4_SCREEN.x + 230},${BENCH_FAR + 4}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={`M${C4_SCREEN.x + 30},${BENCH_FAR + 2} C${C4_SCREEN.x + 60},${BENCH_FAR + 30} ${C4_SCREEN.x + 150},${BENCH_FAR + 18} ${C4_SCREEN.x + 230},${BENCH_FAR + 4}`} stroke="#3A444C" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Monitor2D id={`${id}-m`} cx={C4_SCREEN.x} cy={C4_SCREEN.y} k={C4_SCREEN.k} base={BENCH_FAR + 40}>
          <C3Feed f={f} w={1080} h={1920} id={`${id}-f`} />
        </Monitor2D>
        <OperatorA id={`${id}-oh`} layer="hands" {...opProps} />
        <Bench2 id={`${id}-b`} top={BENCH_FRONT} k={1.2} />
      </Layer>
    </svg>
  );
};
