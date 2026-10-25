// Dev still: the room from any camera, the cast standing at their marks (for set and staging checks).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lookAt} from '../rig/draw';
import {v3} from '../rig/geo';
import {stand} from '../rig/poses';
import {B_L, B_O, B_P, LISTENER, OPERATOR, PASSERBY} from '../castLV';
import {cupHold, phoneHold, RoomScene} from '../Scene';
import {EAR0, LX, BZ, OPER, PASS0} from '../world';

export const C2Probe: React.FC<{pos: number[]; tgt: number[]; f: number; t: number; beam: number}> = ({pos, tgt, f, t, beam}) => {
  const cam = lookAt(v3(pos[0], pos[1], pos[2]), v3(tgt[0], tgt[1], tgt[2]), f);
  const actors = [
    {id: 'L', look: LISTENER, b: B_L, pose: stand(B_L), g: v3(LX, 0, BZ), h: 180},
    {id: 'O', look: OPERATOR, b: B_O, pose: stand(B_O), g: OPER, h: 90},
    {id: 'P', look: PASSERBY, b: B_P, pose: stand(B_P), g: PASS0, h: 200, holdR: phoneHold(), holdL: cupHold()},
  ];
  return (
    <AbsoluteFill>
      <RoomScene t={t} cam={cam} actors={actors} beam={beam ? {vis: beam, end: EAR0} : undefined} />
    </AbsoluteFill>
  );
};
