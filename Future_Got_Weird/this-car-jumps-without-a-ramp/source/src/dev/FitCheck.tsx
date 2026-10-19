// Overlay check: the illustrated side car laid over frame 8.00 s of the real footage at the measured scale.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Stage, World} from '../kit/stage';
import {SideCar} from '../car/side';
import {REF} from '../car/geom';
import {WHEEL_R} from '../car/geom';

const Z = REF.s;
const CAM = {x: (960 - REF.midX) / Z, y: WHEEL_R + (REF.axleY - 540) / Z, z: Z};
export const FitCheck: React.FC<{alpha?: number; ink?: boolean}> = ({alpha = 0.6}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Img src={staticFile('footage/fit_8.00.png')} style={{position: 'absolute', inset: 0, width: 1920, height: 1080}} />
    <AbsoluteFill style={{opacity: alpha}}>
      <Stage bg="transparent">
        <World cam={CAM}>
          <SideCar x={0} px={Z} shadow={0} id="fit" />
        </World>
      </Stage>
    </AbsoluteFill>
  </AbsoluteFill>
);
