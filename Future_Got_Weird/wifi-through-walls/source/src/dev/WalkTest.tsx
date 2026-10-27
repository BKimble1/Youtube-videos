// working still: 8 phases of a walk (or any pose function) side by side at a readable size, with the ankle targets
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person} from '../art/person';
import {walk, Gait} from '../art/walk';
import {Outfit} from '../dc/Man';

export const WalkTest: React.FC<{g: Gait; ts: number[]; outfit?: Outfit; farBehind?: boolean}> = ({g, ts, outfit, farBehind = true}) => (
  <AbsoluteFill style={{backgroundColor: '#E4E9EC'}}>
    <svg width={1080} height={1920}>
      {ts.map((t, i) => {
        const p = walk(g, t);
        const cx = (i % 4) * 270 + 150, cy = Math.floor(i / 4) * 960 + 880;
        const k = 0.42;
        return (
          <g key={i}>
            <line x1={(i % 4) * 270} y1={cy} x2={(i % 4) * 270 + 270} y2={cy} stroke="#9AA" />
            <g transform={`translate(${-p.x * k} 0)`}>
              <Person id={`wt${i}`} cd={{x: cx, y: cy, k, depth: 1}} p={p} look={{outfit}} farBehind={farBehind} />
              <circle cx={cx + p.lAx! * k} cy={cy + p.lAy! * k} r={4} fill="#E33" />
              <circle cx={cx + p.rAx! * k} cy={cy + p.rAy! * k} r={4} fill="#36E" />
            </g>
            <text x={(i % 4) * 270 + 8} y={Math.floor(i / 4) * 960 + 30} fontSize={22}>{t.toFixed(3)}</text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
