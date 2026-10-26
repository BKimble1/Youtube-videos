// V5 beat H (28.94-31.88): "But these scientists EXTENDED one / into the SKY—".
//   H1 28.94-30.78  the comparison in one split frame (End5_split.tsx): the ordinary rod on the left, its lightning
//                   coming all the way down and meeting the metal only at its tip; the tower on the right, the same
//                   storm and horizon, its rod tip at the same height and size, the laser's channel extending its reach
//                   high into the sky and a guided leader running up it
//   H2 30.78-31.88  the payoff (End5_wide.tsx, End5_cloud.tsx): a long-lens view of the whole extended channel from
//                   the rod tip up into the storm deck, tilting up with the packets; the guided leader has reached the
//                   base at the cut and the discharge spreads through the base of the cell, lighting it from within,
//                   brightest on "SKY" (a surge on the 31.14 tick), then fading to a dim glow; packets pass the tip on
//                   the payoff ticks; cut at 31.88 to the loop shot (Loop5, inside the control room)
// Cameras and timing: End5_cam.ts.
import React from 'react';
import {H_PAY} from './End5_cam';
import {SplitH5} from './End5_split';
import {PayoffH5} from './End5_wide';

export const EndH5: React.FC<{t: number}> = ({t}) => (t < H_PAY ? <SplitH5 t={t} /> : <PayoffH5 t={t} />);
