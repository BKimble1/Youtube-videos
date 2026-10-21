// 1280×720 thumbnail: the ship dropping into the open arms at dusk, low angle, one focal point, two words.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Frame} from '../assets/env';
import {ShipCatch} from '../kit/catch';
import {VEH_X} from '../assets/tower';
import {BigText, C, FONT} from '../kit/ui';

export const Thumb: React.FC<{variant?: 'A' | 'B'}> = ({variant = 'A'}) => {
  const s = {gap: 7.5, dx: 0.8, tilt: -1.5, open: 26, engines: 1, plumeLen: 30};
  const cam = variant === 'A' ? {x: VEH_X + 19, y: -95, z: 14.5, rot: -3} : {x: VEH_X - 4, y: -104, z: 13, rot: 0};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: 'scale(0.6667)', transformOrigin: '0 0', width: 1920, height: 1080}}>
        <AbsoluteFill style={{perspective: '1300px', overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `rotateX(10deg) scale(1.25)`, transformOrigin: '50% 100%'}}>
            <Frame>
              <ShipCatch t={1.3} cam={cam} light="dusk" s={s} catchPts={0} />
              <rect width={1920} height={1080} fill="url(#vignette)" />
            </Frame>
          </AbsoluteFill>
        </AbsoluteFill>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {variant === 'A' ? (
            <>
              <BigText text="CATCH" x={1500} y={470} size={200} anchor="middle" />
              <BigText text="BOTH?" x={1500} y={690} size={220} fill={C.yellow} anchor="middle" />
            </>
          ) : (
            <BigText text="CATCH BOTH?" x={960} y={180} size={150} fill={C.yellow} />
          )}
          <text x={1880} y={1050} textAnchor="end" fontFamily={FONT.ui} fontWeight={800} fontSize={26} fill="rgba(255,255,255,0.75)">ILLUSTRATION</text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
