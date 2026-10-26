// V5 shots 13.33-16.92 (CHANNEL), three setups cut on the caption changes:
//   D3 13.33-14.64 "and HEATING a narrow channel"  Channel5_cross.tsx: the pulse train forming the channel, in a
//                                                  side cross-section of the air along the beam
//   D4 14.64-15.83 "through the sky"               Channel5_storm.tsx: the wide storm view, the channel from the rod
//                                                  tip into the cloud deck
//   E1 15.83-16.92 "That gave electricity"         Channel5_tip.tsx: from the rod tip up the channel; the leader
//                                                  leaps off the tip and climbs it, ending where E2's begins
import React from 'react';
import {CrossD3, D3_T1} from './Channel5_cross';
import {D4_T1, StormD4} from './Channel5_storm';
import {TipE1} from './Channel5_tip';

export const ChannelD5: React.FC<{t: number}> = ({t}) => (t >= D4_T1 ? <TipE1 t={t} /> : t >= D3_T1 ? <StormD4 t={t} /> : <CrossD3 t={t} />);
