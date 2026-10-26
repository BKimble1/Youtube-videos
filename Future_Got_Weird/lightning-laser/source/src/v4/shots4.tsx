// V4: which beat draws film time t. B, C, D+E and G are V3's beats, unchanged; A, F and H are V4's. C keeps V3's
// reveal (its own close telescope framing) and is drawn without the summit station (a V4 reveal with the physically
// sized telescope, v4/Open4_c3.tsx, broke the reveal's geography; kept for reference, not routed). The summit
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

export const beatAt4 = (t: number) => (t < B4.B ? 'A' : t < B4.C ? 'B' : t < B4.D ? 'C' : t < B4.F ? 'DE' : t < B4.G ? 'F' : t < B4.H ? 'G' : 'H');
export const SceneV4: React.FC<{t: number}> = ({t}) => {
  const b = beatAt4(t);
  return (
    <SiteExtras.Provider value={b === 'C' ? null : Station4}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {b === 'A' ? <OpenA4 t={t} /> : b === 'B' ? <AirB t={t} /> : b === 'C' ? <MachineC t={t} /> : b === 'DE' ? <ChannelDE t={t} /> : b === 'F' ? <DemoF4 t={t} /> : b === 'G' ? <RodG t={t} /> : <EndH4 t={t} />}
      </svg>
    </SiteExtras.Provider>
  );
};
