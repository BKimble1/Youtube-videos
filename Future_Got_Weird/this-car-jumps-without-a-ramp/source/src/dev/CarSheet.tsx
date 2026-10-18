// Model sheet for the vector car: static, cutaway with passive struts, cutaway with actuators working, airborne.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {SideCar} from '../car/side';

const cell = (i: number) => ({ox: (i % 2) * 960, oy: Math.floor(i / 2) * 540});
export const CarSheet: React.FC = () => {
  const z = 0.17; // px per mm
  const cells = [
    {label: 'static', p: {}},
    {label: 'cutaway, passive', p: {cutaway: 1}},
    {label: 'cutaway, actuators pushing', p: {cutaway: 1, actuator: 1, forceF: 1, forceR: 1, dz: 60, wf: 0, wr: 0}},
    {label: 'airborne (wheels at full droop)', p: {cutaway: 0.0, dz: 230, wf: 120, wr: 120}},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {cells.map((c, i) => {
          const {ox, oy} = cell(i);
          return (
            <g key={i}>
              <rect x={ox} y={oy} width={960} height={540} fill={i % 3 === 0 ? C.paper : C.paperDeep} />
              <line x1={ox} x2={ox + 960} y1={oy + 420} y2={oy + 420} stroke={C.inkSoft} strokeWidth={4} />
              <g transform={`translate(${ox + 480} ${oy + 420}) scale(${z} ${-z})`}>
                <SideCar x={0} px={z} id={`c${i}`} {...c.p} />
              </g>
              <text x={ox + 24} y={oy + 44} fontFamily={F.display} fontWeight={600} fontSize={30} fill={C.ink}>{c.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

import {FrontCar} from '../car/front';
export const FrontSheet: React.FC = () => {
  const z = 0.2;
  const cells = [
    {label: 'front, static', p: {}},
    {label: 'front, cutaway, passive roll 3.5°', p: {cutaway: 1, roll: 3.5, springGlow: 0.6}},
    {label: 'front, actuators opposing roll (0.8°)', p: {cutaway: 1, actuator: 1, roll: 0.8, forceL: 1, forceR: -0.7, ghost: [{roll: 3.5, dz: 0}]}},
    {label: 'front, wheels over bumps', p: {cutaway: 1, actuator: 1, wl: 60, wr: -20, roll: 0.5}},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {cells.map((c, i) => {
          const ox = (i % 2) * 960, oy = Math.floor(i / 2) * 540;
          return (
            <g key={i}>
              <rect x={ox} y={oy} width={960} height={540} fill={i % 3 === 0 ? C.paper : C.paperDeep} />
              <line x1={ox} x2={ox + 960} y1={oy + 450} y2={oy + 450} stroke={C.inkSoft} strokeWidth={4} />
              <g transform={`translate(${ox + 480} ${oy + 450}) scale(${z} ${-z})`}>
                <FrontCar px={z} id={`f${i}`} {...c.p} />
              </g>
              <text x={ox + 24} y={oy + 44} fontFamily={F.display} fontWeight={600} fontSize={30} fill={C.ink}>{c.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
