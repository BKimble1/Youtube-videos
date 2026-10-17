// C11 — the transfer, one continuous move. The Director jumps aboard as the friend hauls the lever; the basket lurches
// out over the gap and the camera travels with it. A drone dives at the cable; the swinging basket clips it and it
// breaks apart (the trolley judders: the strike has damaged it). A replacement slides in. On the landing the barrier
// arm starts to come down over the dock; the Director leaps the last of the gap, snatches a rebar and wedges the arm.
// The camera then pans back across the gap to the friend, alone at the lever.
import React from 'react';
import {Frame, Grade, Cam, smoothCam, shake} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, lerp, easeInOut, smooth} from '../../kit/math';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt, rebarAt} from './blocking';
import {BreakerAt, Drones, EscortWarden} from './machines';
import {BEAT, SHOT, basketU, trolleyX, M_ARRIVAL} from './world';
import {Rebar} from './props';

const camAt = (T: number): Cam => {
  const s = SHOT.C11.start;
  const bxT = trolleyX(basketU(T));
  // ride with the basket (a little ahead of it), widen for the leap, then pan back to the lever
  const ride = bxT + 260;
  const x = T < 100.0 ? (T < 98.3 ? lerp(10900, ride, smooth(clamp((T - s) / 1.4))) : lerp(trolleyX(basketU(98.3)) + 260, 12180, smooth(clamp((T - 98.3) / 1.2)))) : lerp(12180, 10330, easeInOut(clamp((T - 100.0) / (M_ARRIVAL - 100.0))));
  const y = keys(T, [[s, -1870], [98.3, -1880], [99.6, -1900], [M_ARRIVAL, -1890]]);
  const z = keys(T, [[s, 0.66], [98.0, 0.62], [99.6, 0.6], [M_ARRIVAL, 0.74, easeInOut]]);
  return {x, y, z};
};

export const C11: React.FC = () => {
  const {t, T} = useShot('C11');
  const cam0 = smoothCam(camAt, T, 0.25);
  const cam = shake(cam0, T, 6 * Math.max(0, 1 - Math.abs(T - BEAT.droneHit) / 0.35) + 3 * Math.max(0, 1 - Math.abs(T - BEAT.depart) / 0.3), 7);
  const ink = ik(cam);
  const slots = slotsOf(crewAt(T), ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    landing: <Rebar r={rebarAt(T)} ink={ink} />,
    air: <Drones T={T} ink={ink} far={false} />,
  });
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id="c11" slots={slots} haze={0.7} />
      <Grade vignette={0.42} id="c11vg" />
    </Frame>
  );
};
