import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Profile, EYE0} from '../profile';
import {camT} from '../cam';

export const ProfileTest: React.FC<{z: number; x: number; y: number; mode: string}> = ({z, x, y, mode}) => {
  const eye = mode === 'scar' ? {...EYE0, scar: 1, irisLens: 1, mucosa: 0, implant: 0, trephine: 0, seat: 0, tissue: 0, lidFwd: 0, rays: 'scatter' as const, rayT: 0.9, haze: 0.6}
    : mode === 'donor' ? {...EYE0, scar: 0.6, irisLens: 1, mucosa: 0, implant: 0, trephine: 0, seat: 0, tissue: 0, lidFwd: 0, donor: 1, donorCloud: 0.5, rays: 'none' as const}
    : {...EYE0, rays: 'clear' as const, rayT: 1, glow: 1};
  return (
    <AbsoluteFill style={{backgroundColor: '#24323F'}}>
      <svg width={1080} height={1920}>
        <g transform={camT({x, y, z})}>
          <Profile eye={eye} jaw={{open: mode === 'jaw' ? 1 : 0, cut: 0.6, out: 0, hideCanine: false}} px={1 / z} id="p" eyeWin={1} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
