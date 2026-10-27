// C4 (430-465, "moves into position."): the observer's camera feed (group C's C3Feed, continuing frame for frame
// from C3: the medic walking on through the foam course toward the pink target) fills the frame, then one eased pull
// back shows it is the picture on a flat portrait monitor standing on the bench, and the operator beside it watching
// intently, remote in his near hand, his thumb resting just behind the red button (the status LED green: armed, not
// fired). The wall parallaxes behind (it moves less).
import React from 'react';
import {clamp, smoother} from '../../../lib/ease';
import {INK} from '../../../lib/ink';
import {LabWall2, Bench2, LAB2} from '../../sets/Lab2';
import {Cam, Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {C3Feed} from '../c/Feed';
import {OperatorA} from './OperatorA';
import {C4R, FPS_A} from './timingA';

const T0 = C4R.from / FPS_A;
/** the pull-back: a short hold on the full-frame feed, then the move, settling before the cut */
export const C4_MOVE0 = T0 + 0.1;
export const C4_MOVE1 = T0 + 0.95;
/** the monitor's screen at rest (scene px): centre and scale of the 1080 x 1920 feed */
export const C4_SCREEN = {x: 300, y: 905, k: 0.34};
const BEZEL = 22;
const BENCH_FAR = 1335;
const BENCH_FRONT = 1770;
const OP = {x: 845, y: 1405, scale: 1.45};
const D_WALL = 2.4;

/** the framing the pull-back settles on */
const END = {x: 575, y: 1010, z: 1.12};
export const c4Cam = (t: number): Cam => {
  const u = smoother(clamp((t - C4_MOVE0) / (C4_MOVE1 - C4_MOVE0)));
  const Z0 = 1 / C4_SCREEN.k;
  // zoom in log space; the centre moves so the screen's centre travels straight across the frame
  const z = Math.exp(Math.log(Z0) + (Math.log(END.z) - Math.log(Z0)) * u);
  const w = (1 / z - 1 / Z0) / (1 / END.z - 1 / Z0);
  return {x: C4_SCREEN.x + (END.x - C4_SCREEN.x) * w, y: C4_SCREEN.y + (END.y - C4_SCREEN.y) * w, z};
};

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
      {/* stand: a neck behind the screen down to a flat foot on the bench */}
      <path d={`M${cx - neckW / 2},${cy + h * 0.1} H${cx + neckW / 2} V${base - 14} H${cx - neckW / 2} Z`} fill={`url(#${id}-nk)`} stroke={INK} strokeWidth={5} />
      <path d={rr(cx - 120, base - 22, cx + 120, base + 6, 12)} fill="#4B5863" stroke={INK} strokeWidth={5} />
      <path d={`M${cx - 104},${base - 16} H${cx + 104}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.22} strokeLinecap="round" />
      <ellipse cx={cx} cy={base + 10} rx={150} ry={10} fill="#1A2630" opacity={0.25} />
      {/* bezel */}
      <path d={rr(x0 - B, y0 - B, x0 + w + B, y0 + h + B, 26)} fill="#2A3036" stroke={INK} strokeWidth={6} />
      <path d={rr(x0 - B + 5, y0 - B + 5, x0 + w + B - 5, y0 + h + B - 5, 22)} fill="none" stroke="#56616B" strokeWidth={3} />
      {/* the picture */}
      <rect x={x0} y={y0} width={w} height={h} fill="#0E1820" />
      <g clipPath={`url(#${id}-sc)`}>
        <g transform={`translate(${x0} ${y0}) scale(${k})`}>{children}</g>
        <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id}-gl)`} opacity={sheen} />
      </g>
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#11171C" strokeWidth={3} />
      {/* a small power light on the bezel's bottom edge */}
      <circle cx={x0 + w - 8} cy={y0 + h + B / 2} r={3.5} fill="#7FE0A8" />
    </g>
  );
};

export const C4: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS_A;
  const cam = c4Cam(t);
  const pull = clamp((t - C4_MOVE0) / (C4_MOVE1 - C4_MOVE0));
  const opProps = {
    x: OP.x, y: OP.y, scale: OP.scale, t, expr: 'focus' as const, thumbPress: 0, thumbLift: 0.75, led: 'armed' as const,
    gazeX: C4_SCREEN.x + 40, gazeY: C4_SCREEN.y + 120, benchTopY: BENCH_FAR, farHand: 'bench' as const, farHandX: 110,
  };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={LAB2.wallBot} />
      <defs>
        <filter id="c4-wb" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="c4-bt" x1="0" y1={BENCH_FAR} x2="0" y2={BENCH_FRONT} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LAB2.benchTop} />
          <stop offset="1" stopColor={LAB2.benchTopLit} />
        </linearGradient>
      </defs>
      <g filter="url(#c4-wb)">
        <Layer cam={cam} depth={D_WALL}>
          <g transform="translate(-140 -40) scale(1.2)">
            <LabWall2 id="c4w" />
          </g>
        </Layer>
      </g>
      <Layer cam={cam} depth={1}>
        <OperatorA id="c4ob" layer="body" {...opProps} />
        <path d={`M-1500,${BENCH_FAR} H2600 V${BENCH_FRONT} H-1500 Z`} fill="url(#c4-bt)" />
        <path d={`M-1500,${BENCH_FAR} H2600`} stroke={INK} strokeWidth={5} />
        <path d={`M-1500,${BENCH_FAR + 5} H2600`} stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />
        {/* the monitor's cable trailing off the back of the bench */}
        <path d={`M${C4_SCREEN.x + 30},${BENCH_FAR + 2} C${C4_SCREEN.x + 60},${BENCH_FAR + 30} ${C4_SCREEN.x + 150},${BENCH_FAR + 18} ${C4_SCREEN.x + 230},${BENCH_FAR + 4}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={`M${C4_SCREEN.x + 30},${BENCH_FAR + 2} C${C4_SCREEN.x + 60},${BENCH_FAR + 30} ${C4_SCREEN.x + 150},${BENCH_FAR + 18} ${C4_SCREEN.x + 230},${BENCH_FAR + 4}`} stroke="#3A444C" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Monitor2D id="c4m" cx={C4_SCREEN.x} cy={C4_SCREEN.y} k={C4_SCREEN.k} base={BENCH_FAR + 40} sheen={pull}>
          <C3Feed f={f} w={1080} h={1920} id="c4f" />
        </Monitor2D>
        <OperatorA id="c4oh" layer="hands" {...opProps} />
        <Bench2 id="c4b" top={BENCH_FRONT} k={1.2} />
      </Layer>
    </svg>
  );
};
