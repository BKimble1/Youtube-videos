// V4 beat A (0-4.31): the opening, one connected action in three visual beats on one camera (cams4_open.ts loopCam).
//   A1 0-0.3      "They fired a LASER": the shared framing W (the film's last frame too): the telescope low left is
//                 already firing (packets leave its exit window, which flares as each one leaves, and light its
//                 terrace), the thin cyan beam rises up-right past the summit station and the tower, on past the rod
//                 tip through the warm channel into the storm deck. The field crackles at the rod tip (the loop
//                 crackle, 0-1.75). A slow rise (no hold).
//   A2 0.3-2.4    "into a THUNDERSTORM": one crane up the beam with the packets onto openCam (V3's opening setup), the
//                 beam the travelling centre, the tower passing on the right, the storm deck opening over the tower
//                 top. At the crack (1.75) lightning flashes inside the deck (upper left, far from the beam and the
//                 tower): a thin white channel under its glow, one or two lobes lit for a few frames, local.
//   A3 2.4-4.31   "and the lightning FOLLOWED it": on openCam the field strengthens at the rod tip; the upward leader
//                 incepts there (2.47) and climbs the cyan path, the guided section taking most of the climb (to
//                 "FOLLOWED", 3.26); above it the leader leaves the line, branches and connects at 3.52 (the quiet
//                 crack): a stroke runs up the guided section, again on the re-strokes (3.64, 3.83). The warm prepared
//                 air stays readable outside the violet glow to about 4.1. From 3.9 the state blends into V3's openSt
//                 and the effects hand over to V3's OpenFx, so from 4.2 this is V3's OpenA exactly (A -> B contract).
import React from 'react';
import {clamp} from '../dc/math';
import {OpenA} from '../v3/Open3';
import {View3} from '../v3/view3';
import {OpenFx, openFxK, PulseBloom} from '../v3/Open3_fx';
import {CH_TOP, PULSE} from '../v3/Open3_end';
import {DUR, tau3} from '../v3/timeline3';
import {CR1, loopCam} from './cams4_open';
import {handK, HAND4, openSt4} from './states4_open';
import {PlacedLaser4} from './Open4_laser';
import {NearPackets4, OpenFx4} from './Open4_fx';
import {CloudFlash4} from './Open4_cloud';
import {ChannelGrow4, ExitGlow4, LaunchLight4} from './End4_fx';
import {ss} from '../lib';

/** the exit window's flare as each packet of the stream (clock clk) leaves it */
export const exitTick = (clk: number) => Math.exp(-PULSE.exitPhase(clk) / PULSE.SPEED / 0.09);
/** the shared framing's boosts (the channel widened and strengthened, the packets' bloom, the exit's light): full
 *  through H2 and A1, where the channel and the telescope are small on screen; out during the crane as the lens
 *  lengthens onto openCam */
export const wideK4 = (t: number) => {
  const tau = tau3(t);
  return tau < 0.6 ? 1 : 1 - ss(tau, 0.6, 1.6);
};
/** the exit window's light in W (ExitGlow4, LaunchLight4): the brightest point of the launch; out as the telescope
 *  leaves the frame during the crane */
export const exitGlowK = (t: number) => {
  const tau = tau3(t);
  return 0.85 * (tau < 0.75 ? 1 : 1 - ss(tau, 0.75, 1.3));
};

export const OpenA4: React.FC<{t: number}> = ({t}) => {
  if (t >= HAND4) return <OpenA t={t} />;
  const cam = loopCam(t);
  const st = openSt4(t);
  const tag = `a4-${Math.round(t * 30)}`;
  const h = handK(t);
  const tau = tau3(t);
  const tick = exitTick(tau);
  const wk = wideK4(t);
  const pb = 0.55 + 0.35 * wk;
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag}>
        {/* the H2 wide's channel, carried across the seam (the loop clock: t + DUR is H's time at the seam) */}
        {wk > 0.002 && <ChannelGrow4 cam={cam} t={t + DUR} top={CH_TOP} k={wk} wS={3.3} gain={2} id={`${tag}-g`} />}
        {t > 1.6 && t < 2.8 && <CloudFlash4 cam={cam} t={t} id={`${tag}-cf`} />}
        <OpenFx4 cam={cam} t={t} id={`${tag}-fx`} />
        {/* V3's own effects fade in for the hand-over; screen-blended as a group (an opacity group alone would
            composite its violet glows normally over the white core, which turned it lavender for a few frames, A4-8) */}
        {h > 0.001 && (
          <g opacity={h} style={{mixBlendMode: 'screen'}}>
            <OpenFx cam={cam} t={t} id={`${tag}-v3fx`} corona={0} />
          </g>
        )}
        <PulseBloom cam={cam} pulses={st.pulses} k={pb + (0.4 * openFxK(tau) - pb) * h} size={1 + 0.25 * wk} id={`${tag}-pb`} />
        {tau < CR1 && <LaunchLight4 cam={cam} k={exitGlowK(t)} tick={tick} id={`${tag}-ll`} />}
        {tau < CR1 && <ExitGlow4 cam={cam} k={exitGlowK(t)} tick={tick} rMin={46 + 18 * wk} id={`${tag}-eg`} />}
        {tau < CR1 && <NearPackets4 cam={cam} pulses={st.pulses} k={1} id={`${tag}-np`} />}
      </View3>
      <PlacedLaser4 cam={cam} flash={st.flash} fire={clamp(0.7 + 0.3 * tick)} tick={tick} t={tau} id={`${tag}-l`} />
    </g>
  );
};
