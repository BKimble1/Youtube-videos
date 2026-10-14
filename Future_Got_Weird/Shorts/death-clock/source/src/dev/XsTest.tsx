import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CrossSection, crossCam} from '../art/CrossSection';
import {inv} from '../lib/math';
import {SHOT, fS} from '../lib/timeline';

export const XsTest: React.FC = () => {
  const f = useCurrentFrame();
  const [s0, s1] = SHOT.s04;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <CrossSection id="xs" st={{f, cam: crossCam(f, s0, s1), needle: inv(fS('injecting') - 8, fS('injecting'), f), t0: fS('injecting')}} />
      </svg>
    </AbsoluteFill>
  );
};
