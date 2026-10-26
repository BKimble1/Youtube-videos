// V4 beat A (0-4.31): the opening, one connected action in three visual beats on one camera (cams4_open.ts loopCam).
//   A1 0-0.9      "They fired a LASER": the launch, close. The telescope on its terrace (large, low-left) is already
//                 firing: packets leave its exit window (the window flares as each one leaves) and the thin cyan beam
//                 rises up-right past the summit station's lit windows and the tower to its top. The field crackles at
//                 the rod tip (the loop crackle, 0-1.75). A slow rise.
//   A2 0.9-2.35   "into a THUNDERSTORM": one crane up the beam with the packets onto openCam (V3's opening setup), the
//                 storm deck opening over the tower top. At the crack (1.75) lightning flashes inside the deck (upper
//                 left, far from the beam and the tower): the lobes light locally, a short in-cloud channel glimpsed.
//   A3 2.35-4.31  "and the lightning FOLLOWED it": on openCam the field strengthens at the rod tip; the upward leader
//                 incepts there (2.47) and climbs the cyan path, the guided section taking most of the climb (to
//                 "FOLLOWED", 3.26); above it the leader leaves the line, branches and connects at 3.52 (the quiet
//                 crack): a stroke runs up the guided section, again on the re-strokes (3.64, 3.83). The warm prepared
//                 air stays readable outside the violet glow. From 3.9 the state blends into V3's openSt and the
//                 effects hand over to V3's OpenFx, so from 4.2 this is V3's OpenA exactly (A -> B contract).
import React from 'react';
import {clamp} from '../dc/math';
import {OpenA} from '../v3/Open3';
import {View3} from '../v3/view3';
import {OpenFx, openFxK, PulseBloom} from '../v3/Open3_fx';
import {PULSE} from '../v3/Open3_end';
import {tau3} from '../v3/timeline3';
import {loopCam} from './cams4_open';
import {handK, HAND4, openSt4} from './states4_open';
import {PlacedLaser4} from './Open4_laser';
import {NearPackets4, OpenFx4} from './Open4_fx';
import {CloudFlash4} from './Open4_cloud';
import {ExitGlow4} from './End4_fx';
import {ss} from '../lib';

/** the exit window's flare as each packet of the stream (clock clk) leaves it */
export const exitTick = (clk: number) => Math.exp(-PULSE.exitPhase(clk) / PULSE.SPEED / 0.09);
/** the exit window's extra glow (ExitGlow4): full in H2's wide, easing to a trace by the seam and through A */
export const exitGlowK = (t: number) => {
  const tau = tau3(t);
  return tau < 0 ? 1 - 0.7 * ss(tau, -1.2, -0.1) : 0.3;
};

export const OpenA4: React.FC<{t: number}> = ({t}) => {
  if (t >= HAND4) return <OpenA t={t} />;
  const cam = loopCam(t);
  const st = openSt4(t);
  const tag = `a4-${Math.round(t * 30)}`;
  const h = handK(t);
  const tick = exitTick(tau3(t));
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag}>
        {t > 1.6 && t < 2.8 && <CloudFlash4 cam={cam} t={t} id={`${tag}-cf`} />}
        <OpenFx4 cam={cam} t={t} id={`${tag}-fx`} />
        {h > 0.001 && (
          <g opacity={h}>
            <OpenFx cam={cam} t={t} id={`${tag}-v3fx`} corona={0} />
          </g>
        )}
        <PulseBloom cam={cam} pulses={st.pulses} k={0.55 + (0.4 * openFxK(tau3(t)) - 0.55) * h} id={`${tag}-pb`} />
        {t < 1.6 && <ExitGlow4 cam={cam} k={exitGlowK(t)} tick={tick} id={`${tag}-eg`} />}
        {t < 1.6 && <NearPackets4 cam={cam} pulses={st.pulses} k={1} id={`${tag}-np`} />}
      </View3>
      <PlacedLaser4 cam={cam} flash={st.flash} fire={clamp(0.7 + 0.3 * tick)} tick={tick} t={tau3(t)} id={`${tag}-l`} />
    </g>
  );
};
