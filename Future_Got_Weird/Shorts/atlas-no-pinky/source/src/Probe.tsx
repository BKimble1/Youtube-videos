import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {W, H, C} from './film/common';
import {OpenerWorld, OpenerHud} from './v2/opener';
import {Attrib} from './v2/hud';

export const Probe: React.FC = () => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <OpenerWorld t={g} />
        <OpenerHud t={g} />
        <Attrib lead="ATLAS HAND · Boston Dynamics" />
      </svg>
    </AbsoluteFill>
  );
};
