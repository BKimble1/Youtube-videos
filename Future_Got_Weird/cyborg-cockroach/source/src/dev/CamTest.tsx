// Camera framing test: several candidate cameras for one shot frame, side by side at quarter size.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S01, CamOverride} from '../shots/S01';

export const CamTest: React.FC<{f: number; cams: CamOverride[]}> = ({f, cams}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {cams.map((co, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <S01 f={f} lf={f} n={57} co={co} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{i}</div>
      </div>
    ))}
  </AbsoluteFill>
);
