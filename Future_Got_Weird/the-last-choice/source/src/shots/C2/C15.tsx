// C15 — the crossing falls. Low reverse wide from the waterfront road: the last of them stumble off the walkway onto the
// landing and lay the friend down; the weakened gantry's near leg gives (lurch), topples west onto the near deck and
// crushes the breaker (plates buckle, sparks, fluid), and the beam's end slams down after it. The crossing is gone.
// The machines on the near deck stop at the wreckage; the drone pulls back.
import React from 'react';
import {Frame, Grade, Cam, smoothCam, shake} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, easeInOut, easeOut} from '../../kit/math';
import {Warden, wardenWalker} from '../../mech';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt, rebarAt} from './blocking';
import {BreakerAt, Drones, EscortWarden, CollapseFx} from './machines';
import {BEAT, SHOT, DECK} from './world';
import {Rebar} from './props';

const camAt = (T: number): Cam => {
  const s = SHOT.C15.start;
  return {x: keys(T, [[s, 11420], [BEAT.crush, 11250, easeInOut], [SHOT.C15.end, 11200]]), y: keys(T, [[s, -1640], [SHOT.C15.end, -1600]]), z: keys(T, [[s, 0.4], [SHOT.C15.end, 0.415, easeInOut]])};
};

/** A second warden arriving behind the wreck, then both hold: a coordinated pause at the edge. */
const Arriving: React.FC<{T: number; ink: number}> = ({T, ink}) => {
  const d = keys(T, [[BEAT.slam + 0.2, 0], [BEAT.slam + 1.25, 520, easeOut]]);
  const p = wardenWalker(8100, d, 1, DECK, {t: T, s: 0.95, ink, seed: 9, lock: 0, z: -1});
  const scan = T > BEAT.slam + 1.3 ? Math.sin((T - BEAT.slam - 1.3) * 1.2) * 20 : 0;
  return T > BEAT.slam + 0.2 ? <Warden {...p} headYaw={scan} /> : null;
};

export const C15: React.FC = () => {
  const {t, T} = useShot('C15');
  const cam0 = smoothCam(camAt, T, 0.3);
  const hit = (tb: number, a: number) => (T > tb ? a * Math.exp(-4 * (T - tb)) : 0);
  const cam = shake(cam0, T, hit(BEAT.lurch, 6) + hit(BEAT.crush, 22) + hit(BEAT.slam, 26), 17, 10);
  const ink = ik(cam);
  const slots = slotsOf(crewAt(T), ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><Arriving T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    landing: <Rebar r={rebarAt(T)} ink={ink} />,
    air: <g><Drones T={T} ink={ink} far={false} only="B" /><CollapseFx T={T} ink={ink} /></g>,
  });
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id="c15" slots={slots} haze={0.9} />
      <Grade vignette={0.45} id="c15vg" flash={T > BEAT.crush ? 0.25 * clamp(1 - (T - BEAT.crush) / 0.12) : 0} />
    </Frame>
  );
};
