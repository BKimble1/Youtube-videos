import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fallState, StreetScene} from '../shots/StreetShots';

export const OpeningTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#DCEFF5'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <StreetScene id="op" st={fallState(f)} />
      </svg>
    </AbsoluteFill>
  );
};
