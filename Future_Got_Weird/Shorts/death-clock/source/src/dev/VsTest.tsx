import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {VesselRide, vesselCam} from '../art/Vessel';
import {SHOT, fS} from '../lib/timeline';

export const VsTest: React.FC = () => {
  const f = useCurrentFrame();
  const a = SHOT.s05[0];
  const b = SHOT.s06[0];
  const c = SHOT.s06[1];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <VesselRide id="vs" st={{f, cam: vesselCam(f, a, b, c), a, b, c, decayAt: fS('decay')}} />
      </svg>
    </AbsoluteFill>
  );
};
