// Canonical model sheet: the one implant renderer, every state and angle used in the film.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Implant} from '../implant';

const cells: {label: string; p: any}[] = [
  {label: 'block front', p: {piece: 'block', rot: {yaw: 0, pitch: 0, roll: 0}, hole: 0, cyl: 0}},
  {label: 'block 3/4', p: {piece: 'block', rot: {yaw: 35, pitch: 20, roll: 0}, hole: 0, cyl: 0}},
  {label: 'lamina drilled', p: {rot: {yaw: 30, pitch: 25, roll: 0}, hole: 1, cyl: 0, holeBg: '#2E6E73'}},
  {label: 'lamina + clear cyl', p: {rot: {yaw: 38, pitch: 22, roll: 0}, cylMode: 'clear'}},
  {label: 'back 3/4', p: {rot: {yaw: 150, pitch: 15, roll: 0}, cylMode: 'clear'}},
  {label: 'edge-on yaw 90', p: {rot: {yaw: 90, pitch: 0, roll: 0}, cylMode: 'clear'}},
  {label: 'in eye (front)', p: {rot: {yaw: 0, pitch: 0, roll: 0}, cylMode: 'eye'}},
  {label: 'tissue grown', p: {rot: {yaw: 20, pitch: 15, roll: 0}, cylMode: 'clear', tissue: 1, vessels: 1}},
];
export const ModelSheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#2E6E73'}}>
    <svg width={1080} height={1920}>
      {cells.map((c, i) => {
        const cx = 270 + (i % 2) * 540, cy = 240 + Math.floor(i / 2) * 480;
        return (
          <g key={i}>
            <Implant id={`m${i}`} x={cx} y={cy} s={22} px={1} {...c.p} />
            <text x={cx} y={cy + 200} fill="#fff" fontSize={26} textAnchor="middle" fontFamily="monospace">{c.label}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
