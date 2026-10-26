// V3 beats A (0-4.31, the opening demonstration) and H (28.94-33.5, extension, apparatus reveal, return to the
// opening camera).
//   A  one setup, openCam(t) with openSt(t) (the loop clock): the leader climbs the cyan path from the rod tip in slow
//      motion, aligns with the prepared channel, connects at 1.75 (the guided section strengthens), restrikes on
//      "FOLLOWED" (3.52, 3.64, 3.83). OpenFx adds local light only; it is gone by 4.28, so B starts on the plain view.
//   H  (Open3_end.ts) H1: the tower's rod tip where G left the house rod's tip, then a tilt up the prepared channel as
//      it builds; one cut (30.74) low beside the composited telescope; packets leave on the payoff ticks; one crane up
//      the beam with them onto openCam(t) by 32.9; openSt from 32.9 (the field builds, the next leader incepts) so the
//      last frame runs into frame 0.
import React from 'react';
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {openCam} from './cams3';
import {openSt} from './states3';
import {B, tau3} from './timeline3';
import {St, View3} from './view3';
import {chTopH, CRANE1, endPulses, h1Cam, h2Cam, LOW, tickFlare} from './Open3_end';
import {ChannelGrow, exitScreen, OpenFx, openFxK, PlacedLaser, PulseBloom} from './Open3_fx';
import {lookAt} from '../v2/p3';

export const OpenA: React.FC<{t: number}> = ({t}) => {
  const cam = openCam(t);
  const st = openSt(t);
  return (
    <View3 cam={cam} st={st} t={t} tag="a">
      <OpenFx cam={cam} t={t} id="afx" corona={st.tipCorona} />
      <PulseBloom cam={cam} pulses={st.pulses} k={0.4 * openFxK(tau3(t))} id="apb" />
    </View3>
  );
};

/** H1 (28.94-30.74): quiet discharge state; the haze grows from the tip, packets climb the beam */
const h1St = (t: number): St => ({
  s: -1, core: 0, flash: 0, beam: 0.9, pulses: endPulses(t), channel: 0.9, channelTop: chTopH(t), tipCorona: 0,
});
/** H2 (30.74-32.9): the opening state on the loop clock (the field builds at the tip from 31.88) with H's packet
 *  clock and the haze finishing its growth; from 32.9 openSt itself (its inception light eased in, below) */
const h2St = (t: number): St => {
  const o = openSt(t);
  // (openSt eases its inception light in with the leader's first 16 m, so there is no whole-frame pop)
  if (t >= CRANE1) return o;
  return {...o, pulses: endPulses(t), channel: 0.8 + 0.1 * (1 - ss(t, 31.6, CRANE1)), channelTop: chTopH(t)};
};
const LOW_CAM = lookAt(LOW.pos, LOW.target, LOW.f);
const FZ0 = (() => {
  const e = exitScreen({...LOW_CAM, roll: LOW.roll});
  return LOW.f / e.z;
})();

export const EndH: React.FC<{t: number}> = ({t}) => {
  if (t < B.H2) {
    const cam = h1Cam(t);
    const st = h1St(t);
    return (
      <View3 cam={cam} st={st} t={t} tag="h1">
        <ChannelGrow cam={cam} t={t} top={st.channelTop ?? 0} id="h1g" />
      </View3>
    );
  }
  const cam = h2Cam(t);
  const st = h2St(t);
  const tick = tickFlare(t);
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag="h2">
        {t < CRANE1 && <ChannelGrow cam={cam} t={t} top={st.channelTop ?? 0} k={1 - ss(t, 31.6, CRANE1)} id="h2g" />}
        <OpenFx cam={cam} t={t} id="hfx" corona={st.tipCorona} />
        <PulseBloom cam={cam} pulses={st.pulses} k={0.4 * openFxK(tau3(t)) + 0.5 * (1 - ss(t, 32.2, CRANE1))} size={1 + 0.2 * (1 - ss(t, 32.2, CRANE1))} id="hpb" />
      </View3>
      <PlacedLaser cam={cam} k0={1.4} fz0={FZ0} flash={st.flash} fire={clamp(0.62 + 0.38 * tick)} tick={tick} t={t} id="h2l" />
    </g>
  );
};
