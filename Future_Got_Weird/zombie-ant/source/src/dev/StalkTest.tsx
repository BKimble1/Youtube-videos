// Stalk check: a mature stalk and cushion on ant #1, from three sides (dev only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {solve} from '../ant/rig';
import {Scene} from '../Scene';
import {at} from '../world/camera';
import {ascoma, stalkLine} from '../fungus/fungus';
import {ant1State, SP1} from '../world/story';

export const StalkTest: React.FC<{t: number; v: [number, number, number][]}> = ({t, v}) => {
  const c = ascoma(stalkLine(solve(ant1State(t)), SP1), 1, 1).c;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {v.map(([az, el, s], i) => (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <Scene t={t} fkey={`st${i}_`} captions={false} orbit={at(c, az, el, s, 960)} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
