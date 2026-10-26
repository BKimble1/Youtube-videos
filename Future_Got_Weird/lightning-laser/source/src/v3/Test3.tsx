// V3 working still: up to four 3D views on one sheet (half scale), each with a camera [px,py,pz, tx,ty,tz, f, roll]
// and a state ('open' | 'demo' | 'quiet') at film time t.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lookAt, v3} from '../v2/p3';
import {View3} from './view3';
import {demoSt, openSt, quietSt} from './states3';

export const CamTest3: React.FC<{items: {cam: number[]; st: string; t: number; label?: string}[]}> = ({items}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {items.map((it, i) => {
      const c = {...lookAt(v3(it.cam[0], it.cam[1], it.cam[2]), v3(it.cam[3], it.cam[4], it.cam[5]), it.cam[6]), roll: it.cam[7] ?? 0};
      const st = it.st === 'open' ? openSt(it.t) : it.st === 'demo' ? demoSt(it.t) : quietSt(it.t);
      return (
        <div key={i} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <View3 cam={c} st={{...st, apparatus: true}} t={it.t} tag={`ct${i}`} />
            <text x={30} y={100} fontSize={64} fill="#FF0">{`${i} ${it.label ?? it.st} ${it.t}`}</text>
          </svg>
        </div>
      );
    })}
  </AbsoluteFill>
);
