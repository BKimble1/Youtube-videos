import React from 'react';
import {C} from '../theme';
import {BIKE_R as R, BIKE_Y, bikeSpin, bikeTilt, bikeX} from './choreo2';

/** The one extra loose object: a bicycle on the back line of the sidewalk. Same ground-frame speed as the hero; wheels spin up from rest as the stopped road grips them. */
export const BikeWorld: React.FC<{f: number}> = ({f}) => {
  const x = bikeX(f), y = BIKE_Y, ang = bikeSpin(f), tilt = bikeTilt(f);
  const hubR = {x: -1.05 * R, y: -R}, hubF = {x: 1.05 * R, y: -R};
  const bb = {x: 0, y: -0.86 * R}, seat = {x: -0.4 * R, y: -1.78 * R}, head = {x: 0.78 * R, y: -1.72 * R};
  const segs: [typeof hubR, typeof hubR][] = [[hubR, bb], [bb, seat], [seat, head], [bb, head], [head, hubF], [hubR, seat]];
  const wheel = (c: typeof hubR, k: string) => (
    <g key={k} transform={`translate(${c.x} ${c.y})`}>
      <circle r={R} fill="none" stroke={C.ink} strokeWidth={14} />
      <circle r={R - 10} fill="none" stroke={C.cream} strokeWidth={6} />
      <g transform={`rotate(${ang})`}>
        {Array.from({length: 10}).map((_, i) => <line key={i} x1={0} y1={0} x2={(R - 12) * Math.cos((i * Math.PI) / 5)} y2={(R - 12) * Math.sin((i * Math.PI) / 5)} stroke={C.inkSoft} strokeWidth={3} />)}
      </g>
      <circle r={9} fill={C.ink} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt} ${-1.05 * R} 0)`}>
      <ellipse cx={0} cy={4} rx={R * 2.1} ry={11} fill={C.shadow} transform={`rotate(${-tilt} ${-1.05 * R} 0)`} />
      {wheel(hubR, 'wr')}
      {wheel(hubF, 'wf')}
      {segs.map(([a, b], i) => <line key={`o${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={19} strokeLinecap="round" />)}
      {segs.map(([a, b], i) => <line key={`i${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.teal} strokeWidth={10} strokeLinecap="round" />)}
      <circle cx={bb.x} cy={bb.y} r={13} fill={C.ink} />
      <path d={`M ${head.x} ${head.y} L ${head.x + 0.05 * R} ${head.y - 0.34 * R} L ${head.x - 0.32 * R} ${head.y - 0.38 * R}`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={seat.x - 0.4 * R} y={seat.y - 0.17 * R} width={0.82 * R} height={0.2 * R} rx={9} fill={C.ink} />
    </g>
  );
};
