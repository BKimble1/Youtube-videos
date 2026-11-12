// V5 shot list: V4's cuts and pacing (lab A-C 0-14.89, build D 14.89-20.6, earthquake F 20.6-26.74, ending G).
import React from 'react';
import {LabA_C5, LabG5} from './labShots5';
import {Build5, D0_3} from './build5';
import {Rubble5, F0_3, G0_3} from './rubble5';

export const Shot5: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  if (t < D0_3) return <LabA_C5 t={t} fkey={fkey} />;
  if (t < F0_3) return <Build5 t={t} fkey={fkey} />;
  if (t < G0_3) return <Rubble5 t={t} fkey={fkey} />;
  return <LabG5 t={t} fkey={fkey} />;
};
