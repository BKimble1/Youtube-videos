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
  // open on the group at the ladder (the handover, the pursuers behind), then pull back and pan east to the signature
  // wide as the friend makes for the lever: the gap, the gantry, the landing, the refuge entrance
  const s = SHOT.C9.start;
  const u = smooth(clamp((T - (s + 1.15)) / 2.2));
  const z = Math.exp(lerp(Math.log(0.6), Math.log(0.3), u));
  return {x: lerp(9830, 12260, u) + 60 * clamp((T - s) / 1.2), y: lerp(-1640, -1330, u), z: z * (1 + 0.012 * clamp((T - s - 3.4) / 0.6))};
};

export const C9: React.FC = () => {
  const {t, T} = useShot('C9');
  const cam = smoothCam(camAt, T, 0.25);
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
