// V3 shot list (cut points from the narration map). Lab A-C (0-14.89), the build comparison D (14.89-20.6), the
// earthquake F (20.6-26.74), the factory ending G (26.74-end).
import React from 'react';
import {LabA_C3, LabG3} from './labShots3';
import {Build3, D0_3} from './build3';
import {Rubble3, F0_3, G0_3} from './rubble3';

export const Shot3: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  if (t < D0_3) return <LabA_C3 t={t} fkey={fkey} />;
  if (t < F0_3) return <Build3 t={t} fkey={fkey} />;
  if (t < G0_3) return <Rubble3 t={t} fkey={fkey} />;
  return <LabG3 t={t} fkey={fkey} />;
};
