// V3 beat C (7.81-11.42): the machine and the pulses. "But this MACHINE fired / a THOUSAND laser pulses / every second,"
//   C1 7.81-8.95  Machine3_shelter: the scientist presses FIRE (8.01), the machine comes up, one release
//   C2 8.95-9.67  Machine3_optics: the enclosure cutaway, the packet train through the optics and up the duct
//   C3 9.67-11.42 Machine3_reveal: the telescope sends the train up the beam past the tower; push into one packet
import React from 'react';
import {B} from './timeline3';
import {ShelterC} from './Machine3_shelter';
import {RevealC3} from './Machine3_reveal';
import {OpticsC2} from './Machine3_optics';

export const MachineC: React.FC<{t: number}> = ({t}) => (t < B.C2 ? <ShelterC t={t} /> : t < B.C3 ? <OpticsC2 t={t} /> : <RevealC3 t={t} />);
