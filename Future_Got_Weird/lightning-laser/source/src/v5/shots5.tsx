// V5: which shot draws film time t. V5 owns the hook (A), B2, C1, the channel shots (D3-E1), G, H and the loop shot;
// V3's B (to 6.31), C2-C3, D1-D2 and E2 and V4's F are reused unchanged. The summit station (V4) is provided to every
// site view except V3's C, as in V4.
import React from 'react';
import {B5} from './timeline5';
import {HookA5} from './Hook5';
import {ResistB5} from './Resist5';
import {MachineC5} from './Machine5';
import {ChannelD5} from './Channel5';
import {RodG5} from './Rod5';
import {EndH5} from './End5';
import {LoopH5} from './Loop5';
import {AirB} from '../v3/Air3';
import {MachineC} from '../v3/Machine3';
import {ChannelDE} from '../v3/Channel3';
import {DemoF4} from '../v4/Demo4';
import {Station4} from '../v4/Station4';
import {SiteExtras} from '../v3/features3';

export const shotAt5 = (t: number) =>
  t < B5.B ? 'A' : t < B5.B2 ? 'B' : t < B5.C ? 'B2' : t < B5.C2 ? 'C1' : t < B5.D ? 'C' : t < B5.D3 ? 'D' : t < B5.E2 ? 'D3' : t < B5.F ? 'E2' : t < B5.G ? 'F' : t < B5.H ? 'G' : t < B5.H3 ? 'H' : 'H3';
export const SceneV5: React.FC<{t: number}> = ({t}) => {
  const s = shotAt5(t);
  const el =
    s === 'A' ? <HookA5 t={t} /> : s === 'B' ? <AirB t={t} /> : s === 'B2' ? <ResistB5 t={t} /> : s === 'C1' ? <MachineC5 t={t} /> : s === 'C' ? <MachineC t={t} /> :
    s === 'D' ? <ChannelDE t={t} /> : s === 'D3' ? <ChannelD5 t={t} /> : s === 'E2' ? <ChannelDE t={t} /> : s === 'F' ? <DemoF4 t={t} /> : s === 'G' ? <RodG5 t={t} /> :
    s === 'H' ? <EndH5 t={t} /> : <LoopH5 t={t} />;
  return (
    <SiteExtras.Provider value={s === 'C' || s === 'C1' ? null : Station4}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {el}
      </svg>
    </SiteExtras.Provider>
  );
};
