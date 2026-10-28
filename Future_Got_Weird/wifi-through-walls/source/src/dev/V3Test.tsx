// working still: V3 pieces at full size (the security camera's picture, the RF picture)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CamPicture, RfPicture} from '../v3/Lab3';
import {IdCtx} from '../lib';

export const V3Test: React.FC<{what: string; ts: number[]}> = ({what, ts}) => (
  <AbsoluteFill style={{backgroundColor: '#222'}}>
    <svg width={1080} height={1920}>
      {ts.map((t, i) => (
        <IdCtx.Provider key={i} value={`v${i}_`}>
          {what === 'cam' ? <CamPicture r={{x: 20, y: 20 + i * 470, w: 700, h: 443}} t={t} /> : <RfPicture r={{x: 20, y: 20 + i * 470, w: 580, h: 442}} t={t} />}
          <text x={760} y={60 + i * 470} fill="#ff0" fontSize={40}>{t}</text>
        </IdCtx.Provider>
      ))}
    </svg>
  </AbsoluteFill>
);
