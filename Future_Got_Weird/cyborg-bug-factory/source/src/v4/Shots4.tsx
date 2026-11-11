// V4 shot list: V3's cuts and cameras (lab A-C 0-14.89, build D 14.89-20.6, earthquake F 20.6-26.74, ending G).
import React from 'react';
import {LabA_C4, LabG4} from './labShots4';
import {Build4, D0_3} from './build4';
import {Rubble4, F0_3, G0_3} from './rubble4';

export const Shot4: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  if (t < D0_3) return <LabA_C4 t={t} fkey={fkey} />;
  if (t < F0_3) return <Build4 t={t} fkey={fkey} />;
  if (t < G0_3) return <Rubble4 t={t} fkey={fkey} />;
  return <LabG4 t={t} fkey={fkey} />;
};
