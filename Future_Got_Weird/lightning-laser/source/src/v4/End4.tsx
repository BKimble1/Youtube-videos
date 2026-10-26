// V4 beat H (28.94-33.5): the extension, the whole system, and the loop into V4's opening.
//   H1 28.94-30.74  V3's H1: the match cut onto the tower's rod tip at (540, 820) (G -> H contract) and the tilt up the
//                   prepared channel as it extends from the tip (29.19-30.89); V3 finding GH-1 fixed: the channel grows
//                   from the tip along the axis as a band (End4_fx ChannelGrow4), never a round blob
//   H2 30.74-33.5   one cut ("into the SKY—") to the whole system, the shared framing W that is also the film's first
//                   frame (cams4_open.ts): the telescope firing low left (its exit glow, the light on its terrace and the
//                   packets leaving it on the four payoff ticks), the summit station beside the terrace, the tower on
//                   its own base, and the extended warm channel above the rod tip, made readable at this scale. It holds
//                   with a slow creep through "using the AIR ITSELF" to the last frame: the channel never leaves the
//                   frame and never fades; the field builds at the tip from 31.88. Every layer here carries on unchanged
//                   into A1 (Open4), so the film replays without a cut, a dive or a fade.
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
import {ChannelGrow4, ExitGlow4, LaunchLight4} from './End4_fx';
import {exitGlowK, exitTick, wideK4} from './Open4';

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
  // the wide's boosts (channel, packets, exit glow): on through the whole of H2 and across the seam (Open4 eases them
  // out during the crane)
  const wk = wideK4(t);
  const tick = exitTick(endClk(t));
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag}>
        <ChannelGrow4 cam={cam} t={t} top={st.channelTop ?? 0} k={wk} wS={3.3} gain={2} id={`${tag}-g`} />
        <OpenFx4 cam={cam} t={t} id={`${tag}-fx`} />
        <PulseBloom cam={cam} pulses={st.pulses} k={0.55 + 0.35 * wk} size={1 + 0.25 * wk} id={`${tag}-pb`} />
        <LaunchLight4 cam={cam} k={exitGlowK(t)} tick={tick} id={`${tag}-ll`} />
        <ExitGlow4 cam={cam} k={exitGlowK(t)} tick={tick} rMin={46 + 18 * wk} id={`${tag}-eg`} />
        <NearPackets4 cam={cam} pulses={st.pulses} k={1} id={`${tag}-np`} />
      </View3>
      <PlacedLaser4 cam={cam} flash={0} fire={clamp(0.7 + 0.3 * tick)} tick={tick} t={tau3(t)} id={`${tag}-l`} />
    </g>
  );
};
