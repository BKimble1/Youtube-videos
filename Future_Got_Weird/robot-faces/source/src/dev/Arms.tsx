import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Visitor, VX} from '../art/Visitor';
import {Bench} from '../art/Lab';
const V: [number, number, number, number, number, number][] = [
  [-350, -20, 1, -350, 10, 1],
  [-340, -60, 1, -340, -30, 1],
  [-360, 0, 1, -360, 20, 1],
  // lTu, lTv, lElb, rTu, rTv, rElb
  [-200, 10, 1, -200, 20, 1],
  [-200, -30, 1, -195, 0, 1],
  [-190, 40, 1, -190, 40, 1],
  [-160, -60, -1, -160, -20, -1],
  [-210, -10, -1, -205, 10, -1],
  [-230, 20, 1, -230, 30, 1],
];
export const ArmSheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#EDE4D0'}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      {V.slice(0, 6).map((v, i) => {
        const x = 330 + (i % 3) * 630;
        const y = 200 + Math.floor(i / 3) * 520;
        return (
          <g key={i}>
            <Visitor id={`a${i}`} hx={x} hy={y} s={0.8} expr={VX.smile} pose={{lTu: v[0], lTv: v[1], lElb: v[2], rTu: v[3], rTv: v[4], rElb: v[5]}} />
            <rect x={x - 300} y={y + 300} width={600} height={30} fill="#C98F57" opacity={0.6} />
            <text x={x - 280} y={y - 100} fontSize={28} fontFamily="Nunito Variable">{i}: {v.join(', ')}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
