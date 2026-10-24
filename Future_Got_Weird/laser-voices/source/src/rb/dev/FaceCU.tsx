// Dev: one big face for checking the close-up finish.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Face, E_STARTLE, E_REST, E_PUZZLED, E_AMAZED} from '../art/Face';
import {LISTENER, OPERATOR, PASSERBY} from '../cast';

export const RBFaceCU: React.FC<{who: number; turn: number; ex: number; gx: number}> = ({who, turn, ex, gx}) => {
  const look = [LISTENER, OPERATOR, PASSERBY][who];
  const e = [E_REST, E_STARTLE, E_PUZZLED, E_AMAZED][ex];
  return (
    <AbsoluteFill style={{background: '#16323B'}}>
      <svg width={1080} height={1920}>
        <Face id="cu" c={{x: 560, y: 900}} s={3.6} turn={turn} expr={{...e, gx}} look={look} />
      </svg>
    </AbsoluteFill>
  );
};
