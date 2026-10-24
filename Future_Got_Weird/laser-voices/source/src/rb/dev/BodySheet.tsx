// Dev sheet: the three characters in profile and three-quarter, standing and gesturing.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E_REST, E_LISTEN, E_STARTLE, E_PUZZLED} from '../art/Face';
import {Person, Pose} from '../art/Person';
import {HAND_RELAXED, HAND_CLUTCH, HAND_BRACE} from '../art/Hand';
import {LISTENER, LISTENER_FIT, OPERATOR, OPERATOR_FIT, PASSERBY, PASSERBY_FIT} from '../cast';

export const stand = (x: number, gy: number, s: number, o: Partial<Pose> = {}, flip = false): Pose => {
  const fx = flip ? -1 : 1;
  const legY = gy - 46 * s - 0.982 * (400 + 392) * s;
  return {
    x, y: legY, s, yaw: 0, head: 1, lean: 2, chest: 2, nod: 0, roll: 0, shrug: 0,
    nU: -14, nV: 520, fU: 20, fV: 520, nElb: 1, fElb: 1, nWr: 6, fWr: 6,
    nAx: x - fx * 10 * s, nAy: gy - 46 * s, fAx: x + fx * 40 * s, fAy: gy - 46 * s,
    ...o,
  };
};

export const RBBodySheet: React.FC<{row: number}> = ({row}) => {
  const casts = [
    {look: LISTENER, fit: LISTENER_FIT},
    {look: OPERATOR, fit: OPERATOR_FIT},
    {look: PASSERBY, fit: PASSERBY_FIT},
  ];
  const s = 0.5;
  const gy = 900;
  const items: React.ReactNode[] = [];
  if (row === 0) {
    casts.forEach((c, i) => items.push(<Person key={i} id={`p${i}`} pose={stand(200 + i * 340, gy, s)} look={c.look} fit={c.fit} expr={E_REST} ground={gy} />));
    casts.forEach((c, i) => items.push(<Person key={`q${i}`} id={`q${i}`} pose={stand(200 + i * 340, 1800, s, {yaw: 1, head: 0.45})} flip={i === 1} look={c.look} fit={c.fit} expr={E_LISTEN} ground={1800} />));
  } else {
    // gestures: hand to the ear (listener), hand on the device (operator), phone (passerby)
    items.push(<Person key="a" id="a" pose={stand(220, gy, s, {yaw: 0.7, head: 0.55, nU: 40, nV: -40, nElb: 1, nWr: -40, shrug: 0.5})} look={LISTENER} fit={LISTENER_FIT} expr={E_STARTLE} nHand={HAND_BRACE} ground={gy} />);
    items.push(<Person key="b" id="b" pose={stand(560, gy, s, {yaw: 0.6, head: 0.6, nU: 250, nV: 300, nElb: 1, nWr: 10, fU: 230, fV: 320})} flip look={OPERATOR} fit={OPERATOR_FIT} expr={E_REST} nHand={HAND_CLUTCH} ground={gy} />);
    items.push(<Person key="c" id="c" pose={stand(900, gy, s, {yaw: 0.8, head: 0.35, nod: 18, nU: 170, nV: 250, nElb: 1, fU: 150, fV: 270, fElb: 1})} look={PASSERBY} fit={PASSERBY_FIT} expr={E_PUZZLED} nHand={HAND_CLUTCH} fHand={HAND_CLUTCH} ground={gy} />);
    // a big listener in three-quarter for detail
    items.push(<Person key="d" id="d" pose={stand(540, 1900 + 300, 1.0, {yaw: 1, head: 0.35, nU: 60, nV: 470, fU: 40, fV: 480})} look={LISTENER} fit={LISTENER_FIT} expr={E_LISTEN} ground={2300} />);
  }
  return (
    <AbsoluteFill style={{background: '#1E3B44'}}>
      <svg width={1080} height={1920}>{items}</svg>
    </AbsoluteFill>
  );
};
