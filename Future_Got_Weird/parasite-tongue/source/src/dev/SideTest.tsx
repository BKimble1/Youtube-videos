// Side set at chosen cameras and states (for checking).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, V3} from '../core/three';
import {resetIsoIds} from '../isopod';
import {SideSet, tongueSurfaceZ} from '../side';
import {Particles, WaterBg} from '../water';

export const SideTest: React.FC<{c: [number, number]; D: number; cut: number; flare: number; shrink: number; k: number; juv: V3 | null}> = ({c, D, cut, flare, shrink, k, juv}) => {
  resetIsoIds('st');
  const B = basis({eye: [c[0], -17 - D, c[1]], target: [c[0], 0, c[1]], f: 2400});
  const L = 8 + 22 * k;
  const hx = 13 - 9 * k;
  const inside = [{o: [hx, 0, tongueSurfaceZ(hx + 2, shrink) * (1 - k) + 0.3] as V3, fwd: [-1, 0, 0] as V3, up: [0, 0, 1] as V3, L, k, grip: 1, gut: 0.8}];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <WaterBg t={0} />
        <Particles B={B} t={0} box={[[-60, 20, -100], [180, 300, 140]]} />
        <SideSet s={{B, t: 0, g: 0.9, cut, flare, shrink, flowOn: 1, draw: 1, biteX: hx + 0.5, pale: 1 - shrink, inside, outside: juv ? [{o: juv, fwd: [-1, 0, 0.1], up: [0, 0, 1], L: 8, k: 0, swim: 1}] : [], fkey: 'st'}} />
        <Particles B={B} t={0} box={[[-60, -17 - D, -100], [180, -20, 140]]} n={30} seed={2} />
      </svg>
    </AbsoluteFill>
  );
};
