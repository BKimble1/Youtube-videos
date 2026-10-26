// dev only: pose variants of the visitor close-up (not part of the film)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {VisitorCU} from './sets';
import {vis2} from './state2';
const VAR: any[] = [{}, {lTv: 120}, {lTv: -200}, {rTv: 100}, {rTv: -200}, {lTu: -150, lTv: 80}, {torso: 0, chest: 0}, {lW: 1, lWx: 1500, lWy: 1400}, {rW: 1, rWx: 700, rWy: 1500}];
export const Dev2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {VAR.map((p, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 3) * 640, top: Math.floor(i / 3) * 360, width: 1920, height: 1080, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={1920} height={1080}><VisitorCU id={`d${i}`} cam={{x: 960, y: 540, z: 1}} vis={vis2(75)} pose={p} /></svg>
        <div style={{position: 'absolute', left: 20, top: 16, fontSize: 60, color: '#FF0'}}>{JSON.stringify(p)}</div>
      </div>
    ))}
  </AbsoluteFill>
);
