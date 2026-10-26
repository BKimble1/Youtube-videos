// V4 beat H (28.94-33.5): the extension, the whole system, and the loop into V4's opening.
//   H1 28.94-30.74  V3's H1: the match cut onto the tower's rod tip at (540, 820) (G -> H contract) and the tilt up the
//                   prepared channel as it extends from the tip (29.19-30.89); V3 finding GH-1 fixed: the channel grows
//                   from the tip along the axis as a band (End4_fx ChannelGrow4), never a round blob
//   H2 30.74-33.5   one cut ("into the SKY—") to the whole system from low on the summit's flank: the telescope's exit
//                   low-left (a local glow: the telescope is small at this distance), the summit station beside the
//                   terrace, the tower, and the extended warm channel above the rod tip, made readable at this scale;
//                   packets leave on the four payoff ticks (V3's fast packet clock, landing on the loop clock by 32.9);
//                   the field builds at the tip from 31.88. During "using the AIR ITSELF" the channel stays in frame
//                   while one eased, arcing push carries the camera in to the launch, decelerating into A1's drift at
//                   the seam (cams4_open.ts loopCam: one camera function on the loop clock), so the film replays.
import React from 'react';
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {B, tau3} from '../v3/timeline3';
import {St, View3} from '../v3/view3';
import {PulseBloom} from '../v3/Open3_fx';
import {chTopH, endClk, endPulses, h1Cam} from '../v3/Open3_end';
import {loopCam} from './cams4_open';
import {h2St4} from './states4_open';
import {PlacedLaser4} from './Open4_laser';
import {NearPackets4, OpenFx4} from './Open4_fx';
import {ChannelGrow4, ExitGlow4} from './End4_fx';
import {exitGlowK, exitTick} from './Open4';

/** H1: the quiet discharge state while the haze grows from the tip (V3's h1St, but see GH-1) */
const h1St = (t: number): St => {
  const top = chTopH(t);
  // (GH-1) V3's own haze in Beam3D is a ribbon 3 m wide blurred by up to 22 px: while the channel is short it is a
  // round blob, so it comes in only once the channel is a band (10 m+); until then ChannelGrow4 alone draws it
  return {s: -1, core: 0, flash: 0, beam: 0.9, pulses: endPulses(t), channel: 0.9 * ss(top, 60, 200), channelTop: top, tipCorona: 0};
};

export const EndH4: React.FC<{t: number}> = ({t}) => {
  const tag = `h4-${Math.round(t * 30)}`;
  if (t < B.H2) {
    const cam = h1Cam(t);
    const st = h1St(t);
    return (
      <View3 cam={cam} st={st} t={t} tag={tag}>
        <ChannelGrow4 cam={cam} t={t} top={st.channelTop ?? 0} id={`${tag}-g`} />
      </View3>
    );
  }
  const cam = loopCam(t);
  const st = h2St4(t);
  const tau = tau3(t);
  // the wide's boosts (channel, packets) ease back to the opening's levels during the push, gone by the seam
  const wideK = 1 - ss(tau, -1.3, -0.25);
  const tick = exitTick(endClk(t));
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag}>
        <ChannelGrow4 cam={cam} t={t} top={st.channelTop ?? 0} k={wideK} wS={3} gain={1.7} id={`${tag}-g`} />
        <OpenFx4 cam={cam} t={t} id={`${tag}-fx`} />
        <PulseBloom cam={cam} pulses={st.pulses} k={0.55 + 0.35 * wideK} size={1 + 0.25 * wideK} id={`${tag}-pb`} />
        <ExitGlow4 cam={cam} k={exitGlowK(t)} tick={tick} id={`${tag}-eg`} />
        {tau > -1.2 && <NearPackets4 cam={cam} pulses={st.pulses} k={1} id={`${tag}-np`} />}
      </View3>
      <PlacedLaser4 cam={cam} flash={0} fire={clamp(0.7 + 0.3 * tick)} tick={tick} t={tau3(t)} id={`${tag}-l`} />
    </g>
  );
};
