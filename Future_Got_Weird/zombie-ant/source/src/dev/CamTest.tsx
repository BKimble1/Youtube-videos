// Camera trials: the same moment from several orbits (dev only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp3} from '../core/three';
import {solve} from '../ant/rig';
import {Scene} from '../Scene';
import {at} from '../world/camera';
import {A1, ant1State} from '../world/story';
import {A2, ant2State} from '../world/story2';

const AZ1 = 77.6;
export const CamTest: React.FC<{t: number; v: [number, number, number, number][]; who?: number; base?: number}> = ({t, v, who = 1, base = AZ1 - 180}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {v.map(([daz, el, s, mix], i) => {
      const tg = who === 2 ? lerp3(solve(ant2State(t)).headC, A2(t).vein, mix) : lerp3(solve(ant1State(t)).headC, A1(t).vein, mix);
      void 0;
      return (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <Scene t={t} fkey={`c${i}_`} captions={false} orbit={at(tg, base + daz, el, s, 900)} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{`az${daz} el${el} s${s}`}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);
