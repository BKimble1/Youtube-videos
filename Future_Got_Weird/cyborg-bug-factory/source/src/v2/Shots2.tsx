// V2 shot list: which scene draws film time t (cut points from the narration map, production/V2_NARRATION_MAP.md).
import React from 'react';
import {LabA_C2, LabG2} from './labShots2';
import {Terrain2, D0, G0} from './terrain2';

export const Shot2: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  if (t < D0) return <LabA_C2 t={t} fkey={fkey} />;
  if (t < G0) return <Terrain2 t={t} fkey={fkey} />;
  return <LabG2 t={t} fkey={fkey} />;
};
