import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Journey} from '../shots/Journey';
import '../fonts';

export const JourneyTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#DCEFF5'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Journey id="jt" f={f} />
      </svg>
    </AbsoluteFill>
  );
};
