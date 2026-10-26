// V4: which beat draws film time t. B, C1-C2, D+E and G are V3's beats, unchanged; A, F, H and C3 (V3's reveal with
// the V4 physically sized telescope, so it agrees with the summit station) are V4's. The summit
// station is provided to every site view (View3) through SiteExtras.
import React from 'react';
import {B4} from './timeline4';
import {OpenA4} from './Open4';
import {EndH4} from './End4';
import {DemoF4} from './Demo4';
import {Station4} from './Station4';
import {AirB} from '../v3/Air3';
import {MachineC} from '../v3/Machine3';
import {ChannelDE} from '../v3/Channel3';
import {RodG} from '../v3/Rod3';
import {SiteExtras} from '../v3/features3';
import {RevealC3V4} from './Open4_c3';

export const beatAt4 = (t: number) => (t < B4.B ? 'A' : t < B4.C ? 'B' : t < B4.D ? 'C' : t < B4.F ? 'DE' : t < B4.G ? 'F' : t < B4.H ? 'G' : 'H');
export const SceneV4: React.FC<{t: number}> = ({t}) => {
  const b = beatAt4(t);
  return (
    <SiteExtras.Provider value={Station4}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {b === 'A' ? <OpenA4 t={t} /> : b === 'B' ? <AirB t={t} /> : b === 'C' ? (t >= B4.C3 ? <RevealC3V4 t={t} /> : <MachineC t={t} />) : b === 'DE' ? <ChannelDE t={t} /> : b === 'F' ? <DemoF4 t={t} /> : b === 'G' ? <RodG t={t} /> : <EndH4 t={t} />}
      </svg>
    </SiteExtras.Provider>
  );
};
