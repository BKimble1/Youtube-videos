// The shot list: which scene draws film time t. Deliberate cuts only where the place changes: lab -> split comparison
// (14.89), comparison -> factory overhead (20.6), overhead -> disaster zone (22.27), disaster zone -> lab close-up (26.74).
import React from 'react';
import {LabA_C} from './labShots';
import {Compare, D0} from './compare';
import {LabE, LabG, E0, G0} from './labShots2';
import {Rubble, F0} from './rubble';

export const Shot: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  if (t < D0) return <LabA_C t={t} fkey={fkey} />;
  if (t < E0) return <Compare t={t} fkey={fkey} />;
  if (t < F0) return <LabE t={t} fkey={fkey} />;
  if (t < G0) return <Rubble t={t} fkey={fkey} />;
  return <LabG t={t} fkey={fkey} />;
};
