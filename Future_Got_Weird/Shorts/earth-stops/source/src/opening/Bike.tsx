import React from 'react';
import {C, H, W} from '../theme';
import {X0, camX, hipX, vHip} from './choreo';

/**
 * Optional loose bicycle (variant test). Parked in the road lane, it shares the hero's ground-frame velocity (everything not
 * attached to the Earth keeps its speed). Its wheels were not turning; friction with the stopped road spins them up over ~20 frames.
 */
const R = 62;
const BY = 1560; // wheel contact line
const BX0 = 640; // world x of the bike's centre at frame 0 (screen = world - camera)
const spin = (f: number) => {
  let a = 0;
  for (let t = 0; t < f; t++) {
    const k = Math.min(1, t / 20);
    a += ((vHip(t) / R) * 180) / Math.PI * (k * k * (3 - 2 * k));
  }
  return a;
};
export const bikeX = (f: number) => BX0 + (hipX(f) - X0);

export const Bike: React.FC<{f: number}> = ({f}) => {
  const x = bikeX(f) - camX(f);
  const ang = spin(f);
  const hubR = {x: -1.05 * R, y: -R};
  const hubF = {x: 1.05 * R, y: -R};
  const bb = {x: -0.02 * R, y: -0.82 * R};
  const seat = {x: -0.4 * R, y: -1.78 * R};
  const head = {x: 0.78 * R, y: -1.72 * R};
  const tube = (a: {x: number; y: number}, b: {x: number; y: number}, key: string) => (
    <g key={key}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={17} strokeLinecap="round" />
    </g>
  );
  const tubeIn = (a: {x: number; y: number}, b: {x: number; y: number}, key: string) => (
    <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.coral} strokeWidth={9} strokeLinecap="round" />
  );
  const segs: [{x: number; y: number}, {x: number; y: number}, string][] = [
    [hubR, bb, 'cs'], [bb, seat, 'st'], [seat, head, 'tt'], [bb, head, 'dt'], [head, hubF, 'fk'], [hubR, seat, 'ss'],
  ];
  const wheel = (cx: number, cy: number, key: string) => (
    <g key={key} transform={`translate(${cx} ${cy})`}>
      <circle r={R} fill="none" stroke={C.ink} strokeWidth={13} />
      <circle r={R - 9} fill="none" stroke={C.cream} strokeWidth={6} />
      <g transform={`rotate(${ang})`}>
        {Array.from({length: 8}).map((_, i) => (
          <line key={i} x1={0} y1={0} x2={(R - 10) * Math.cos((i * Math.PI) / 4)} y2={(R - 10) * Math.sin((i * Math.PI) / 4)} stroke={C.inkSoft} strokeWidth={3} />
        ))}
      </g>
      <circle r={8} fill={C.ink} />
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <ellipse cx={x} cy={BY + 4} rx={R * 2.1} ry={11} fill={C.shadow} />
      <g transform={`translate(${x} ${BY})`}>
        {wheel(hubR.x, hubR.y, 'wr')}
        {wheel(hubF.x, hubF.y, 'wf')}
        {segs.map(([a, b, k]) => tube(a, b, `o${k}`))}
        {segs.map(([a, b, k]) => tubeIn(a, b, `i${k}`))}
        <path d={`M ${head.x} ${head.y} L ${head.x + 0.05 * R} ${head.y - 0.32 * R} L ${head.x - 0.3 * R} ${head.y - 0.36 * R}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={seat.x - 0.38 * R} y={seat.y - 0.16 * R} width={0.8 * R} height={0.2 * R} rx={8} fill={C.ink} />
      </g>
    </svg>
  );
};
