// V3 beat stand-in (to be built): MachineC
import React from 'react';
import {Placeholder3} from './Placeholder3';

export const MachineC: React.FC<{t: number}> = ({t}) => <Placeholder3 label={`MachineC ${t.toFixed(2)}`} />;
