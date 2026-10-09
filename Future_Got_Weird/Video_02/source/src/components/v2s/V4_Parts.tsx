import React from 'react';
import {C, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import {PointerStick} from './V3_Parts';

/**
 * V4.3 parts (screen px): the checker's arm with her telescopic pointer coming in from the frame edge to tap a point,
 * and the small GENERIC route icon (sensor → wall → hidden object → wall → sensor: no room, no person, no partition).
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type PointerPose = {tip: {x: number; y: number}; back: {x: number; y: number}; on: boolean; press: number};

/**
 * The tap, cued on its contact frame `hit`: the arm slides in along `back` (ease out) to just short of the target, a
 * small pull back (anticipation), the poke (contact at `hit`, a 4 px press), a hold, then it withdraws the way it came.
 */
export const pointerAt = (g: number, o: {target: {x: number; y: number}; back: {x: number; y: number}; hit: number; travel?: number; inDur?: number; hold?: number; outDur?: number}): PointerPose => {
  const travel = o.travel ?? 900;
  const inDur = o.inDur ?? 12;
  const hold = o.hold ?? 10;
  const outDur = o.outDur ?? 12;
  const n = Math.hypot(o.back.x, o.back.y) || 1;
  const d = {x: o.back.x / n, y: o.back.y / n};
  const t0 = o.hit - inDur - 4;
  const t1 = o.hit - 4;
  const t3 = o.hit + hold;
  const t4 = t3 + outDur;
  if (g < t0 || g > t4) return {tip: o.target, back: d, on: false, press: 0};
  let off: number;
  let press = 0;
  if (g < t1) {
    const u = (g - t0) / (t1 - t0);
    off = travel + (24 - travel) * (1 - Math.pow(1 - u, 3)) + 10 * Math.sin(Math.PI * clamp01((u - 0.66) / 0.34));
  } else if (g < o.hit) {
    const u = (g - t1) / 4;
    off = 24 * (1 - u * u);
  } else if (g <= t3) {
    const u = (g - o.hit) / Math.max(1, hold);
    press = u < 0.35 ? Math.sin((Math.PI * u) / 0.35) : 0;
    off = -4 * press;
  } else {
    const u = (g - t3) / outDur;
    off = travel * u * u;
  }
  return {tip: {x: o.target.x + d.x * off, y: o.target.y + d.y * off}, back: d, on: true, press};
};

/** Her arm and pointer (screen px): the stick from the tip back to her mitt, the cuff, the coral sleeve off frame. */
export const ScreenPointer: React.FC<{pose: PointerPose; stick?: number}> = ({pose, stick = 300}) => {
  if (!pose.on) return null;
  const {tip, back} = pose;
  const hand = {x: tip.x + back.x * stick, y: tip.y + back.y * stick};
  const cuff0 = {x: hand.x + back.x * 30, y: hand.y + back.y * 30};
  const cuff1 = {x: hand.x + back.x * 54, y: hand.y + back.y * 54};
  const sleeveEnd = {x: hand.x + back.x * 1500, y: hand.y + back.y * 1500};
  const ang = (Math.atan2(back.y, back.x) * 180) / Math.PI;
  const skin = CAST.checker.skin;
  const line = (a: {x: number; y: number}, b: {x: number; y: number}, w: number, col: string, cap: 'round' | 'butt' = 'round') => (
    <line x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)} stroke={col} strokeWidth={w} strokeLinecap={cap} />
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <g opacity={0.9} transform="translate(8 10)">
        {line(tip, hand, 14, C.shadow)}
        {line(cuff1, sleeveEnd, 66, C.shadow)}
      </g>
      {line(cuff1, sleeveEnd, 66 + OUTLINE * 2, C.ink)}
      {line(cuff1, sleeveEnd, 66, C.coral)}
      {line(cuff0, cuff1, 60 + OUTLINE * 2, C.ink, 'butt')}
      {line(cuff0, cuff1, 60, C.cream, 'butt')}
      <g transform={`translate(${f2(hand.x)} ${f2(hand.y)}) rotate(${f2(ang)})`}>
        <ellipse cx={8} cy={0} rx={34} ry={30} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
      </g>
      <PointerStick hand={hand} tip={tip} w={14} skin={skin} thumb={false} />
      <g transform={`translate(${f2(hand.x)} ${f2(hand.y)}) rotate(${f2(ang)})`}>
        <ellipse cx={-14} cy={-20} rx={14} ry={11} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
      </g>
    </svg>
  );
};

/** A quick ring from a contact point (the tap), r grows and fades over t 0..1. */
export const TapRing: React.FC<{x: number; y: number; t: number; r?: number}> = ({x, y, t, r = 30}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <circle cx={f2(x)} cy={f2(y)} r={f2(8 + r * (1 - Math.pow(1 - t, 2)))} fill="none" stroke={C.ink} strokeWidth={f2(5 * (1 - 0.6 * t))} opacity={f2(1 - t)} />
    </svg>
  );
};

/* ------------------------------------------------------------------ the generic route icon */

/** Icon centres along the strip (local px, y = 0), each icon about 64 px. */
export const ROUTE_ICON = {xs: [0, 104, 208, 312, 416], w: 416 + 64} as const;

const SensorGlyph: React.FC<{flip?: boolean}> = ({flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <rect x={-30} y={-22} width={56} height={44} rx={9} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={16} y={-12} width={14} height={24} rx={5} fill={C.coral} stroke={C.ink} strokeWidth={3} />
    <circle cx={-8} cy={0} r={9} fill={C.cream} stroke={C.ink} strokeWidth={3} />
  </g>
);
const WallGlyph: React.FC = () => (
  <g>
    <rect x={-14} y={-38} width={28} height={76} rx={5} fill={C.paperLine} stroke={C.ink} strokeWidth={OUTLINE} />
    <circle cx={0} cy={0} r={7} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
  </g>
);
/** A neutral hidden object: a grey block (not a person, not our room's guesser). */
const ObjectGlyph: React.FC = () => (
  <g>
    <path d="M -24 -14 L -12 -26 L 28 -26 L 28 12 L 16 24 L -24 24 Z" fill="#C3CDD2" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <path d="M -24 -14 L 16 -14 L 28 -26 M 16 -14 L 16 24" fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

/** The generic route strip at (x, y) = its left icon's centre, scaled by k; `t` 0..1 fades it in. */
export const RouteIcon: React.FC<{x: number; y: number; t: number; k?: number}> = ({x, y, t, k = 1}) => {
  if (t <= 0) return null;
  const xs = ROUTE_ICON.xs;
  const arrows = [0, 1, 2, 3].map((i) => {
    const a = xs[i] + 36;
    const b = xs[i + 1] - 36;
    const w = [5, 4.5, 4, 3.5][i];
    return (
      <g key={i}>
        <path d={`M ${a} 0 L ${b} 0`} stroke={C.ink} strokeWidth={w} strokeDasharray={`${w * 2.2} ${w * 2}`} strokeLinecap="round" fill="none" />
        <path d={`M ${b - 11} -8 L ${b} 0 L ${b - 11} 8`} stroke={C.ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    );
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={f2(clamp01(t))}>
      <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(k)})`}>
        {arrows}
        <g transform={`translate(${xs[0]} 0)`}>
          <SensorGlyph />
        </g>
        <g transform={`translate(${xs[1]} 0)`}>
          <WallGlyph />
        </g>
        <g transform={`translate(${xs[2]} 0)`}>
          <ObjectGlyph />
        </g>
        <g transform={`translate(${xs[3]} 0)`}>
          <WallGlyph />
        </g>
        <g transform={`translate(${xs[4]} 0)`}>
          <SensorGlyph flip />
        </g>
      </g>
    </svg>
  );
};
