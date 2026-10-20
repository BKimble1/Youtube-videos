// shot id -> component. Shots are grouped by world (café interior, inserts, exterior, macro).
import React from 'react';
import {Shot, ShotId} from '../plan4';
import {interiorShot} from './interiorShots';
import {macroShot} from './macroShots';
import {exteriorShot} from './exteriorShots';
import {insertShot} from './insertShots';

const INTERIOR: ShotId[] = ['intWide', 'intTwo', 'sendFalter', 'reality', 'sendReject', 'handCup', 'calmTwo', 'realize', 'recvRecog', 'withdraw', 'sendRegister', 'subjective', 'signal'];

export const renderShot = (id: ShotId, t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  if (INTERIOR.includes(id)) return interiorShot(id, t, f, lt, shot);
  if (id === 'extWide' || id === 'recvHey' || id === 'sendSmile') return exteriorShot(id, t, f, lt, shot);
  if (['neck', 'matchImplant', 'capture', 'cortex', 'decoder', 'redNeural', 'swarm', 'mechanism'].includes(id)) return insertShot(id, t, f, lt, shot);
  if (id === 'macro' || id === 'macroEnd') return macroShot(id, t, f, lt, shot);
  return (
    <g>
      <rect width={1080} height={1920} fill="#1E3A4C" />
      <text x={540} y={900} fontSize={70} fill="#fff" textAnchor="middle" fontFamily="monospace">{id}</text>
    </g>
  );
};
