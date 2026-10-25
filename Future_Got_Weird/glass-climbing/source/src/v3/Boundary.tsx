// Glass Climbing V3: the foot of the wall in section, at the millimetre scale (the scale of the pad's contact layer):
// the curtain wall's glass above, its aluminium base channel, the brick plinth below. The glass face is one straight,
// smooth line; the brick's face is a broken profile of peaks and pits. The same scene as the pad close-ups (Press.tsx)
// without the pad: the two surfaces the pad will meet, one above the other.
import React from 'react';
import {lit, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {fmt, P, V} from '../dc/math';
import {Lin} from '../dc/shade';
import {Cam, Layer} from '../dc/camera';
import {brickMM} from './Press';

const BRICK = '#A9573D';
/** the channel's extent (mm): the glass above y = -40, the channel -40..0, the brick below 0 */
export const BoundaryContent: React.FC<{id: string; z: number}> = ({id, z}) => {
  const ink = 2.2 / Math.max(1e-6, z);
  const pts: V[] = [];
  for (let y = 0; y <= 1400; y += 1.5) pts.push({x: brickMM(y + 37), y});
  return (
    <g>
      <rect x={-2000} y={-2000} width={4000} height={4000} fill="#2B3E48" />
      {[[260, -500, 200], [420, 300, 160], [180, 760, 240]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.035} />
      ))}
      {/* glass above: smooth, its face one straight line */}
      <Lin id={`${id}-gl`} d="M-46,-2000 H0 V-40 H-46 Z" from={{x: -46, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#2F6A72'], [0.55, '#7DBDC0'], [0.92, '#B9E6E6'], [1, '#D9F6F5']]} />
      {[-700, -380, -160].map((y, i) => (
        <path key={i} d={`M-40,${y + 90} L-8,${y - 60} L-4,${y - 40} L-36,${y + 110} Z`} fill="#FFFFFF" opacity={0.18} />
      ))}
      <path d="M0,-2000 V-40" stroke="#F2FFFF" strokeWidth={fmt(ink * 1.2)} opacity={0.9} />
      {/* the base channel (aluminium) */}
      <Inked w={ink * 1.4}>
        <Lin id={`${id}-ch`} d="M-58,-46 H6 V0 H-58 Z" from={{x: 0, y: -46}} to={{x: 0, y: 0}} stops={[[0, '#E3E9ED'], [0.5, '#B8C4CC'], [1, '#8C9AA4']]} />
      </Inked>
      {/* brick below: rough, its face broken into peaks and pits */}
      <path d={`M-90,0 L${pts.map((p) => P(p)).join(' L')} L-90,1400 Z`} fill={BRICK} />
      <Lin id={`${id}-bs`} d="M-90,0 H0 V1400 H-90 Z" from={{x: -90, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#000000', 0.25], [1, '#FFFFFF', 0.06]]} />
      {Array.from({length: 60}).map((_, i) => (
        <circle key={i} cx={fmt(-8 - ((i * 37) % 76))} cy={fmt(10 + ((i * 251) % 1380))} r={fmt(0.9 + (i % 4) * 0.8)} fill={i % 3 ? shade(BRICK, 0.4) : lit(BRICK, 0.3)} opacity={0.7} />
      ))}
      <path d={`M${pts.map((p) => P(p)).join(' L')}`} fill="none" stroke={lit(BRICK, 0.35)} strokeWidth={fmt(ink * 1.4)} opacity={0.8} />
      <path d={`M${pts.map((p) => P(p)).join(' L')}`} fill="none" stroke={INK} strokeWidth={fmt(ink * 0.8)} opacity={0.7} />
    </g>
  );
};
export const BoundaryView: React.FC<{id: string; cam: Cam}> = ({id, cam}) => (
  <Layer cam={cam} depth={1}>
    <BoundaryContent id={id} z={cam.z} />
  </Layer>
);
