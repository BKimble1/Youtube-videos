// Front set at chosen cameras (for checking).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, V3} from '../core/three';
import {FrontSet} from '../front';
import {resetIsoIds} from '../isopod';
import {Particles, WaterBg} from '../water';

export const FrontTest: React.FC<{eye: V3; target: V3; f: number; g: number; tongue: number; tuck: number}> = ({eye, target, f, g, tongue, tuck}) => {
  resetIsoIds('ft');
  const B = basis({eye, target, f});
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <WaterBg t={0} />
        <Particles B={B} t={0} box={[[-250, -120, -100], [-5, 120, 130]]} />
        <FrontSet s={{B, g, t: 0, fkey: 'ft', iso: {o: [4, 0, 0.1], fwd: [-1, 0, 0], up: [0, 0, 1], L: 30, k: 1, grip: 1, tongue, tuck}}} />
      </svg>
    </AbsoluteFill>
  );
};
