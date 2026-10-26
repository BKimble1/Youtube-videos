// V3 working still: the contract cameras (openCam / demoCam) at given film times, 4 per sheet (half scale)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {View3} from './view3';
import {demoSt, openSt} from './states3';
import {demoCam, MICRO_ANG, openCam, P0_SCREEN} from './cams3';

export const CamSeq3: React.FC<{items: {which: string; t: number}[]}> = ({items}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {items.map((it, i) => {
      const cam = it.which === 'open' ? openCam(it.t) : demoCam(it.t);
      const st = it.which === 'open' ? openSt(it.t) : demoSt(it.t);
      return (
        <div key={i} style={{position: 'absolute', left: (i % 2) * 540, top: Math.floor(i / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <View3 cam={cam} st={{...st, apparatus: true}} t={it.t} tag={`cs${i}`} />
            <text x={30} y={100} fontSize={60} fill="#FF0">{`${it.which} ${it.t}  P0 ${P0_SCREEN.x.toFixed(0)},${P0_SCREEN.y.toFixed(0)} ang ${MICRO_ANG.toFixed(1)}`}</text>
          </svg>
        </div>
      );
    })}
  </AbsoluteFill>
);
