// Internal reference board (not in the film): the illustrated Roadster's two drawn views at the angles the companion
// uses, for comparison against the footage stills (qa/reference/roadster_board.jpg).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Roadster, PROFILE} from '../short3/Roadster';
import {RoadsterRear} from './RoadsterRear';
import {C, F} from '../theme';

const LEN = PROFILE.xMax - PROFILE.xMin;

export const Board: React.FC = () => {
  const k = 0.62;
  const pitch = [0, 45, 90, 170];
  const rolls = [0, 45, 90, 135, 180];
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080}>
        {pitch.map((p, i) => {
          const cx = 250 + i * 470, cy = 300;
          return (
            <g key={p} transform={`rotate(${-p} ${cx} ${cy})`}>
              <Roadster x={cx - (LEN * k) / 2} y={cy + 40} k={k} />
            </g>
          );
        })}
        {rolls.map((r, i) => (
          <RoadsterRear key={r} x={230 + i * 365} y={860} k={0.55} roll={r} id={`b${i}`} />
        ))}
      </svg>
      {pitch.map((p, i) => (
        <div key={p} style={{position: 'absolute', left: 150 + i * 470, top: 470, fontFamily: F.body, fontWeight: 800, fontSize: 26, color: C.ink}}>side · pitch {p}°</div>
      ))}
      {rolls.map((r, i) => (
        <div key={r} style={{position: 'absolute', left: 150 + i * 365, top: 900, fontFamily: F.body, fontWeight: 800, fontSize: 26, color: C.ink}}>rear · roll {r}°</div>
      ))}
    </AbsoluteFill>
  );
};
