// Model sheet for the vector car: static, cutaway with passive struts, cutaway with actuators working, airborne.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {SideCar} from '../car/side';

const cell = (i: number) => ({ox: (i % 2) * 960, oy: Math.floor(i / 2) * 540});
export const CarSheet: React.FC = () => {
  const z = 0.19;
  const cells: {label: string; p: Partial<React.ComponentProps<typeof SideCar>>; zoom?: number; cx?: number}[] = [
    {label: 'static', p: {}},
    {label: 'rear well: spring only', p: {wells: [{axle: 'r', open: 1, spring: 1, damper: 0.25, actuator: 0}]}, zoom: 0.52, cx: -1500},
    {label: 'rear well: spring + damper + actuator pushing', p: {wells: [{axle: 'r', open: 1, actuator: 1, force: 1}]}, zoom: 0.52, cx: -1500},
    {label: 'airborne, both wells open', p: {dz: 200, wf: 120, wr: 120, wells: [{axle: 'r', open: 1}, {axle: 'f', open: 1}]}},
  ];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {cells.map((c, i) => {
          const {ox, oy} = cell(i);
          const zz = c.zoom ?? z;
          const cx = c.cx ?? 0;
          return (
            <g key={i}>
              <defs><clipPath id={`cs${i}`}><rect x={ox} y={oy} width={960} height={540} /></clipPath></defs>
              <rect x={ox} y={oy} width={960} height={540} fill={i % 3 === 0 ? C.paper : C.paperDeep} />
              <g clipPath={`url(#cs${i})`}>
                <g transform={`translate(${ox + 480 - cx * zz} ${oy + (c.zoom ? 330 : 420) + (c.zoom ? 0 : 0) + (c.zoom ? 0 : 0)}) scale(${zz} ${-zz})`}>
                  <line x1={-6000} x2={6000} y1={0} y2={0} stroke={C.inkSoft} strokeWidth={4 / zz} />
                  <SideCar x={0} px={zz} id={`c${i}`} {...c.p} />
                </g>
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
    {label: 'front, corner windows, passive roll 3.5°', p: {wells: {open: 1, actuator: 0, springGlowL: 0.6}, roll: 3.5}},
    {label: 'front, actuators opposing roll (0.8°)', p: {wells: {open: 1, actuator: 1, forceL: 1, forceR: -0.7}, roll: 0.8, ghost: [{roll: 3.5, dz: 0}]}},
    {label: 'front, wheels over bumps', p: {wells: {open: 1, actuator: 1}, wl: 60, wr: -20, roll: 0.5}},
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
