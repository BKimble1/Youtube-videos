import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S13, S13Co} from '../shots/S13';
export const S13Test: React.FC<{f: number; cos: S13Co[]}> = ({f, cos}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {cos.map((co, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <S13 f={f} lf={0} n={1} co={co} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{i}</div>
      </div>
    ))}
  </AbsoluteFill>
);
