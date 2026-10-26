// V3: which beat draws film time t (boundaries in timeline3.ts B). Each beat owns its own file and its incoming
// transition: B starts from openCam(4.31); D starts on C3's packet; F starts on E's pull-out; H starts on G's tip.
import React from 'react';
import {B} from './timeline3';
import {OpenA, EndH} from './Open3';
import {AirB} from './Air3';
import {MachineC} from './Machine3';
import {ChannelDE} from './Channel3';
import {DemoF} from './Demo3';
import {RodG} from './Rod3';

export const beatAt = (t: number) => (t < B.B ? 'A' : t < B.C ? 'B' : t < B.D ? 'C' : t < B.F ? 'DE' : t < B.G ? 'F' : t < B.H ? 'G' : 'H');
export const SceneV3: React.FC<{t: number}> = ({t}) => {
  const b = beatAt(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {b === 'A' ? <OpenA t={t} /> : b === 'B' ? <AirB t={t} /> : b === 'C' ? <MachineC t={t} /> : b === 'DE' ? <ChannelDE t={t} /> : b === 'F' ? <DemoF t={t} /> : b === 'G' ? <RodG t={t} /> : <EndH t={t} />}
    </svg>
  );
};
