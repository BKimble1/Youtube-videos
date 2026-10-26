// V5 shot B2 (6.31-7.81) "the flow of electricity". A hard cut on the caption change from V3's molecular view (the
// stalled streamer among the molecules) out to the storm scale, on the same stalled tip: on B2's first frame the tip
// of a leader climbing out of a summit sits exactly where B's streamer tip was, heading the same way (up and to the
// right), so the cut reads "same struggle, wider view". On each of the mix's crackle-and-stall attempts (6.35, 7.05)
// it forces a run of short, jerky steps up through the ordinary air, each shorter than the last; between them it
// strains (streamer brushes flaring ahead of the tip and collapsing back), probes sideways (sparks that die back) and
// sags, and it ends stalled and fading well below the storm base it is reaching for. Ordinary air makes lightning
// fight for every step. No laser in this shot (it sets up the easier path).
//   camera  one slow push, tilting up a little with the tip (eased, never reversing); the deck, the summit and the
//           leader share a plane, the far ridge sits behind and the near one in front (2.5D layers)
//   cut     a hard cut to the machine at 7.81 (C1)
import React from 'react';
import {clamp} from '../dc/math';
import {camB2, fromScreen, layerXf, leaderLight5, LeaderB5, mainTip, toScreen} from './Resist5_leader';
import {baseY, DeckB5, PeakB5, RainB5, RangeB5, SkyB5} from './Resist5_sky';

export const ResistB5: React.FC<{t: number}> = ({t}) => {
  const frame = Math.round(t * 30);
  const tag = `b2-${frame}`;
  const c = camB2(t);
  const lt = leaderLight5(t);
  const tip = mainTip(t);
  // the light the leader throws on its surroundings: a little all the time, a lot on each step, strain and probe
  const L = 0.2 + 0.5 * lt.recent + 0.6 * lt.flash + 0.25 * lt.probe + 0.3 * lt.push;
  // the base above the tip catches more of it the nearer the tip gets (that is the gap it cannot close)
  const gap = Math.max(40, tip.y - baseY(tip.x));
  const near = Math.pow(220 / (gap + 60), 1.25);
  const tipRain = fromScreen(c, 0.85, toScreen(c, 1, tip));
  return (
    <g>
      <g transform={layerXf(c, 0.4)}>
        <SkyB5 tag={tag} flash={Math.min(1, lt.flash)} />
      </g>
      <g transform={layerXf(c, 0.75)}>
        <RangeB5 tag={tag} i={0} L={L * 0.4} />
      </g>
      <g transform={layerXf(c, 0.85)}>
        <RainB5 tag={tag} t={t} L={clamp(L * 0.9)} tip={tipRain} />
      </g>
      <g transform={layerXf(c, 1)}>
        <DeckB5 tag={tag} Lb={L * near} Li={L * (0.4 + 0.6 * near)} t={t} tip={tip} />
        <PeakB5 tag={tag} L={0.35 * lt.body + 0.3 * lt.flash} />
        <LeaderB5 t={t} tag={tag} />
      </g>
      <g transform={layerXf(c, 1.25)}>
        <RangeB5 tag={tag} i={1} L={L * 0.3} />
      </g>
    </g>
  );
};
