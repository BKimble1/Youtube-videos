// C9 — the signature wide: the broken span, the gantry and its basket, the landing and stairs, the refuge glowing on
// the waterfront. The Crew comes along the catwalk under the deck with the machines behind; on the hit (M.HIT_RUN) the
// friend breaks for the ladder and the control box; the Director follows and hoists the teammate up.
import React from 'react';
import {Frame, Grade, Cam, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {lerp, smooth, clamp} from '../../kit/math';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt} from './blocking';
import {BreakerAt, Drones, EscortWarden} from './machines';
import {SHOT} from './world';

const camAt = (T: number): Cam => {
  const u = clamp((T - SHOT.C9.start) / (SHOT.C9.end - SHOT.C9.start));
  return {x: lerp(12420, 12280, smooth(u)), y: lerp(-1300, -1340, smooth(u)), z: lerp(0.292, 0.305, smooth(u))};
};

export const C9: React.FC = () => {
  const {t, T} = useShot('C9');
  const cam = smoothCam(camAt, T, 0.4);
  const ink = ik(cam);
  const slots = slotsOf(crewAt(T), ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    air: <Drones T={T} ink={ink} />,
  });
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id="c9" slots={slots} />
      <Grade vignette={0.42} id="c9vg" />
    </Frame>
  );
};
