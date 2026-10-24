// Dev sheet: heads at several turns and expressions (row 0..), for checking the rig in stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Face, E_REST, E_STARTLE, E_PUZZLED, E_LISTEN, E_AMAZED, E_GRIN, E_BLANK, E_FOCUS, E_LOST} from '../art/Face';
import {LISTENER, OPERATOR, PASSERBY} from '../cast';

export const RBSheet: React.FC<{row: number}> = ({row}) => {
  const looks = [LISTENER, OPERATOR, PASSERBY];
  const turns = [0, 0.3, 0.55, 0.8, 1];
  const exprs = [E_REST, E_STARTLE, E_PUZZLED, E_LISTEN, E_AMAZED, E_GRIN, E_BLANK, E_FOCUS, E_LOST];
  const items: React.ReactNode[] = [];
  if (row < 3) {
    turns.forEach((t, i) => {
      items.push(<Face key={`a${i}`} id={`a${i}`} c={{x: 270 + (i % 2) * 540, y: 230 + Math.floor(i / 2) * 560}} s={1.55} turn={t} expr={E_REST} look={looks[row]} />);
    });
    items.push(<Face key="fl" id="fl" c={{x: 810, y: 1350}} s={1.55} turn={0.55} flip expr={E_LISTEN} look={looks[row]} />);
  } else {
    exprs.forEach((ex, i) => {
      items.push(<Face key={`e${i}`} id={`e${i}`} c={{x: 180 + (i % 3) * 360, y: 300 + Math.floor(i / 3) * 560}} s={1.2} turn={0.3} expr={ex} look={looks[row - 3]} />);
    });
  }
  return (
    <AbsoluteFill style={{background: '#1E3B44'}}>
      <svg width={1080} height={1920}>{items}</svg>
    </AbsoluteFill>
  );
};
