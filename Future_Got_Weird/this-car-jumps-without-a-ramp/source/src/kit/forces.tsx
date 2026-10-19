// Whole-car force diagram for the side view. Only external forces act on the car as a whole: gravity at the centre of
// mass, and the road's force on the tyres at the two contact patches. The actuator's force is internal (equal and
// opposite on body and wheels), so it never appears here. Road-force arrows exist only while the tyres are loaded.
import React from 'react';
import {C} from '../theme';
import {Arrow} from '../car/parts';

export const LW = 450; // length (mm) of the weight arrow; the two road arrows sum to it at rest

export const ContactPatch: React.FC<{cx: number; chord: number; px: number; opacity?: number; y?: number}> = ({cx, chord, px, opacity = 1, y = 0}) => {
  if (opacity <= 0.001) return null;
  const w = Math.max(chord, 150);
  return <rect x={cx - w / 2} y={y - 16} width={w} height={32} rx={16} fill={C.teal} stroke={C.ink} strokeWidth={3 / px} opacity={0.95 * opacity} />;
};

export const ComMarker: React.FC<{x: number; y: number; px: number; opacity?: number}> = ({x, y, px, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={58} fill={C.white} stroke={C.ink} strokeWidth={3.5 / px} />
    <path d={`M ${x} ${y} L ${x + 58} ${y} A 58 58 0 0 1 ${x} ${y + 58} Z M ${x} ${y} L ${x - 58} ${y} A 58 58 0 0 1 ${x} ${y - 58} Z`} fill={C.ink} />
  </g>
);

export type ForceProps = {
  px: number;
  com: [number, number];
  axles: [number, number]; // x of rear and front contact patches
  n: number; // road force per axle, in units of total weight (N / 2 / W); 0 once the tyres are off the road
  v: number; // vertical velocity of the body (m/s), + up
  road: number; // 0..1 visibility of the road arrows (also gated by n)
  gravity: number;
  motion: number;
  pair: number; // visibility of the "tyres push on road" reaction arrows
  groundY?: number;
};

/** MOTION is the body's vertical velocity (dashed, 200 mm per m/s): up while rising, shorter toward the apex, down while falling. */
export const MOTION_LIFT = 1100; // the velocity arrow rides above the roof so it never crosses the car
export const motionLen = (v: number) => v * 200;

export const CarForces: React.FC<ForceProps> = ({px, com, axles, n, v, road, gravity, motion, pair, groundY = 0}) => {
  const grounded = n > 0.01;
  return (
    <g>
      {gravity > 0 && (
        <g opacity={gravity}>
          <ComMarker x={com[0]} y={com[1]} px={px} />
          <Arrow x={com[0]} y={com[1] - 70} dx={0} dy={-(LW - 70)} px={px} color={C.blue} width={16} />
        </g>
      )}
      {grounded && road > 0 && axles.map((x, i) => <Arrow key={i} x={x + 70} y={groundY - n * LW - 10} dx={0} dy={n * LW} px={px} color={C.teal} width={16} opacity={road} />)}
      {grounded && pair > 0 && axles.map((x, i) => <Arrow key={`p${i}`} x={x - 90} y={groundY - 6} dx={0} dy={-n * LW} px={px} color={C.inkMuted} width={12} opacity={pair} />)}
      {motion > 0 && Math.abs(v) > 0.05 && <Arrow x={com[0]} y={com[1] + MOTION_LIFT} dx={0} dy={motionLen(v)} px={px} color={C.saffronDeep} kind="motion" width={16} opacity={motion} />}
    </g>
  );
};
