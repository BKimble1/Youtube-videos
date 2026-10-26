// V5 shot B2 (6.31-7.81) "the flow of electricity". A hard cut on the caption change from V3's molecular view (the
// stalled streamer among the molecules) out to the storm scale: the cell seen side-on from far off, its dark base
// above, the ranges below. A stepped leader is already out of the base when we cut in; on each of the mix's
// crackle-and-stall attempts (6.35, 7.05) it forces a few crooked steps down through the ordinary air, forking at
// random, each step later and shorter than the last, then stalls, sputtering (probes that die), still far above the
// ground. Ordinary air makes lightning fight for every step. No laser in this shot (it sets up the easier path).
//   camera  one slow push toward the struggling tip (eased, never reversing); the deck and the leader share a plane,
//           the ranges sit nearer and drift a little more (2.5D layers)
//   cut     a hard cut to the machine at 7.81 (C1)
import React from 'react';
import {fmt} from '../dc/math';
import {ss5} from '../lib';
import {B5} from './timeline5';
import {LeaderB5, leaderLight5} from './Resist5_leader';
import {DeckB5, RainB5, RangeB5, SkyB5} from './Resist5_sky';

const T0 = B5.B2, T1 = B5.C;
/** the camera: zoom and centre (base-framing units) */
const camB2 = (t: number) => {
  const k = ss5(t, T0 - 0.15, T1 + 0.3);
  return {z: 1 + 0.14 * k, x: 540 - 36 * k, y: 960 + 40 * k};
};
/** a layer at parallax p (1 = the leader's plane) */
const layer = (c: {z: number; x: number; y: number}, p: number) => {
  const z = 1 + (c.z - 1) * p, x = 540 + (c.x - 540) * p, y = 960 + (c.y - 960) * p;
  return `translate(540 960) scale(${fmt(z)}) translate(${fmt(-x)} ${fmt(-y)})`;
};

export const ResistB5: React.FC<{t: number}> = ({t}) => {
  const frame = Math.round(t * 30);
  const tag = `b2-${frame}`;
  const c = camB2(t);
  const lt = leaderLight5(t);
  // the light the leader throws on its surroundings: a little all the time, a lot on each step
  const L = 0.22 + 0.55 * lt.recent + 0.6 * lt.flash + 0.2 * lt.probe;
  return (
    <g>
      <g transform={layer(c, 0.4)}>
        <SkyB5 tag={tag} flash={Math.min(1, lt.flash)} />
      </g>
      <g transform={layer(c, 0.75)}>
        <RangeB5 i={0} L={L * 0.5} />
      </g>
      <g transform={layer(c, 0.85)}>
        <RainB5 tag={tag} t={t} L={L} />
      </g>
      <g transform={layer(c, 1)}>
        <DeckB5 tag={tag} L={L} t={t} />
        <LeaderB5 t={t} tag={tag} />
      </g>
      <g transform={layer(c, 1.12)}>
        <RangeB5 i={1} L={L * 0.7} />
      </g>
      <g transform={layer(c, 1.25)}>
        <RangeB5 i={2} L={L * 0.5} />
      </g>
    </g>
  );
};
