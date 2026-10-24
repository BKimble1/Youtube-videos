// Dev only: an atrium test frame from an explicit camera.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, v3} from './rig/geo4';
import {lookCam} from './core4';
import {AtriumView, leadAt, friendAt} from './atriumScene4';
import {GUESSER, CLERK} from './rig/cast4';

export const TestV4: React.FC<{t: number; pos: number[]; at: number[]; f: number}> = ({t, pos, at, f}) => {
  const b = basis(lookCam(v3(pos[0], pos[1], pos[2]), v3(at[0], at[1], at[2]), f));
  return (
    <AbsoluteFill style={{background: '#21323A'}}>
      <svg width={1080} height={1920}>
        <AtriumView b={b} t={t} who={[{s: leadAt(t), look: GUESSER, id: 'lead'}, {s: friendAt(t), look: CLERK, id: 'fr', cup: 1}]} />
      </svg>
    </AbsoluteFill>
  );
};
