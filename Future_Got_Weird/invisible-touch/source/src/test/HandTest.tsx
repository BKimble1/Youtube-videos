import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PAL} from '../dc/color';
import {ProfileArm, H_POINT, H_FLAT, H_RELAX, H_CUP, H_FIST, HPose} from '../it/hand';
import {norm, rot} from '../dc/math';

const POSES: [string, HPose, number][] = [['POINT down 35', H_POINT, 35], ['POINT big', H_POINT, 50], ['FLAT', H_FLAT, 0], ['RELAX', H_RELAX, 0], ['CUP', H_CUP, 0], ['FIST', H_FIST, 0], ['POINT 70', {...H_POINT, wr: 25}, 45]];
export const HandTest: React.FC = () => (
  <AbsoluteFill style={{background: '#22384A'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {POSES.map(([name, p, a], i) => {
        const big = i === 1; const x = big ? 620 : 700, y = big ? 520 : 200 + (i > 1 ? i + 1 : i) * 250;
        const dir = norm(rot({x: -1, y: 0}, -a));
        return (
          <g key={i}>
            <ProfileArm id={`h${i}`} f={{W: {x, y}, dir, L: big ? 600 : 260}} pose={p} skin={PAL.skin} ink={big ? 7 : 5} elbow={{x: x + 260, y: y - 40}} />
            <text x={30} y={y + 120} fill="#fff" fontSize={28}>{name}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
