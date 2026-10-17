// C10 — the lever. Medium on the control box: the friend hauls the dead-man lever to release the basket's brake (it
// swings on its cables) while the others come up the ladder and board. The Director comes to take the lever; the friend
// shakes their head once and nods toward the basket: go.
import React from 'react';
import {Frame, Grade, Cam, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, lerp, smooth, easeInOut} from '../../kit/math';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt} from './blocking';
import {BreakerAt, Drones, EscortWarden} from './machines';
import {SHOT} from './world';

const camAt = (T: number): Cam => {
  const s = SHOT.C10.start;
  // open medium on the box and the swinging basket; push in to the two of them for the refusal
  const x = keys(T, [[s, 10400], [s + 1.2, 10420, easeInOut], [s + 2.1, 10270, easeInOut], [s + 3.6, 10250]]);
  const y = keys(T, [[s, -1880], [s + 2.1, -1860, easeInOut], [s + 3.6, -1850]]);
  const z = keys(T, [[s, 0.74], [s + 1.3, 0.78], [s + 2.3, 1.12, easeInOut], [s + 3.6, 1.18]]);
  return {x, y, z};
};

export const C10: React.FC = () => {
  const {t, T} = useShot('C10');
  const cam = smoothCam(camAt, T, 0.3);
  const ink = ik(cam);
  const slots = slotsOf(crewAt(T), ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    air: <Drones T={T} ink={ink} far={false} />,
  });
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id="c10" slots={slots} haze={0.7} />
      <Grade vignette={0.45} id="c10vg" />
      {void smooth}
    </Frame>
  );
};
