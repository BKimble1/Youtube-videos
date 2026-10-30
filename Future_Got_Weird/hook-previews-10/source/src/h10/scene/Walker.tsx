// HOOK 10: the front-wheeled walker (rollator-style frame): two side frames (an inverted U each: rear leg with a glide,
// top rail with a foam grip, front leg with a wheel), a lower brace, and the cross bars that join the sides in front of
// him. The near frame is drawn in front of the participant, the far frame (offset up and screen-left, as the body's
// far side in this 3/4 view) behind him. The wheels turn with the distance rolled.
import React from 'react';
import {lit, mix, shade} from '../rig/color';
import {INK, Inked, InkLine} from '../rig/ink';
import {Capsule} from '../rig/shade';
import {add, fmt, P, V} from '../rig/math';

export const FRAME = {
  rear: 54, // rear leg x relative to the grip centre
  front: -200,
  topY: 16, // top rail below the grip centre
  wheelR: 33,
};
const TUBE = '#AEBBC4';

/** side frame for grip centre G (world). far: drawn darker. roll: distance rolled (wheel turn). */
export const WalkerSide: React.FC<{id: string; G: V; far?: boolean; roll: number; ink: number}> = ({id, G, far, roll, ink}) => {
  const c = far ? shade(TUBE, 0.28) : TUBE;
  const grip = far ? shade('#2E363D', 0.2) : '#2E363D';
  const r = 7.5;
  const topR = {x: G.x + FRAME.rear, y: G.y + FRAME.topY};
  const topF = {x: G.x + FRAME.front, y: G.y + FRAME.topY + 4};
  const footR = {x: G.x + FRAME.rear + 12, y: -12};
  const axle = {x: G.x + FRAME.front - 14, y: -FRAME.wheelR};
  const braceA = {x: G.x + FRAME.rear + 7, y: -250};
  const braceB = {x: G.x + FRAME.front - 9, y: -250};
  const ang = (roll / FRAME.wheelR) * (180 / Math.PI);
  return (
    <g>
      <Inked w={ink}>
        {/* wheel */}
        <circle cx={fmt(axle.x)} cy={fmt(axle.y)} r={FRAME.wheelR} fill={far ? '#20282E' : '#2A3238'} />
      </Inked>
      <g transform={`rotate(${fmt(-ang)} ${fmt(axle.x)} ${fmt(axle.y)})`}>
        <circle cx={fmt(axle.x)} cy={fmt(axle.y)} r={FRAME.wheelR - 8} fill={far ? '#4A555E' : '#66737D'} />
        {[0, 60, 120].map((a) => (
          <rect key={a} x={fmt(axle.x - 2.5)} y={fmt(axle.y - FRAME.wheelR + 9)} width={5} height={(FRAME.wheelR - 9) * 2} fill={far ? '#39434B' : '#4E5A63'} transform={`rotate(${a} ${fmt(axle.x)} ${fmt(axle.y)})`} />
        ))}
        <circle cx={fmt(axle.x)} cy={fmt(axle.y)} r={8} fill={far ? '#8C99A3' : '#C6D0D6'} stroke={INK} strokeWidth={ink * 0.5} />
      </g>
      <path d={`M${fmt(axle.x - FRAME.wheelR + 6)},${fmt(axle.y - 12)} A${FRAME.wheelR - 6} ${FRAME.wheelR - 6} 0 0 1 ${fmt(axle.x + 4)},${fmt(axle.y - FRAME.wheelR + 6)}`} fill="none" stroke="#FFFFFF" strokeOpacity={far ? 0.08 : 0.16} strokeWidth={4} strokeLinecap="round" />
      <Inked w={ink}>
        {/* legs, top rail, brace: one aluminium contour */}
        <Capsule id={`${id}-rl`} a={topR} b={footR} ra={r} rb={r} color={c} spec={far ? 0.1 : 0.35} />
        <Capsule id={`${id}-fl`} a={topF} b={axle} ra={r} rb={r} color={c} spec={far ? 0.1 : 0.35} />
        <Capsule id={`${id}-tr`} a={topR} b={topF} ra={r} rb={r} color={c} spec={far ? 0.1 : 0.35} />
        <Capsule id={`${id}-br`} a={braceA} b={braceB} ra={r * 0.8} rb={r * 0.8} color={shade(c, 0.08)} spec={far ? 0.08 : 0.25} />
        {/* fork round the wheel */}
        <Capsule id={`${id}-fk`} a={add(axle, {x: 0, y: -46})} b={axle} ra={r * 1.1} rb={r * 0.9} color={shade(c, 0.12)} />
      </Inked>
      <Inked w={ink}>
        {/* rear glide */}
        <path d={`M${fmt(footR.x - 13)},${fmt(footR.y - 16)} L${fmt(footR.x + 13)},${fmt(footR.y - 16)} L${fmt(footR.x + 15)},${fmt(-1)} Q${fmt(footR.x)},${fmt(2)} ${fmt(footR.x - 15)},${fmt(-1)} Z`} fill={far ? '#3B454D' : '#56636D'} />
        {/* foam grip on the top rail */}
        <Capsule id={`${id}-gp`} a={{x: G.x + 46, y: G.y + 4}} b={{x: G.x - 52, y: G.y + 6}} ra={12.5} rb={12.5} color={grip} spec={far ? 0.05 : 0.18} k={0.8} />
      </Inked>
      {!far && (
        <g>
          <InkLine d={`M${P({x: G.x + 20, y: G.y - 7})} L${P({x: G.x - 30, y: G.y - 6})}`} w={ink * 0.4} opacity={0.3} />
          <ellipse cx={fmt(G.x - 6)} cy={fmt(G.y - 3)} rx={30} ry={3} fill={lit(grip, 0.6)} opacity={0.3} />
        </g>
      )}
      {/* cross bar stubs toward the far side (the bars that join the two frames) */}
      <Inked w={ink}>
        <Capsule id={`${id}-xb`} a={{x: topF.x + 2, y: topF.y + 40}} b={{x: topF.x + (far ? 34 : -34), y: topF.y + (far ? 44 : 36)}} ra={r * 0.8} rb={r * 0.8} color={mix(c, '#8FA0AC', 0.3)} />
      </Inked>
    </g>
  );
};
