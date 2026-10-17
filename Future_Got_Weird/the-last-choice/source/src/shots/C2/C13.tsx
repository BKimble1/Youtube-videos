// C13 — the blast, wide. The basket docks; the friend lets go and runs onto the gantry walkway; the breaker fires; the
// charge hits the walkway just behind them (BEAT.blast, on a Portals accent): flash, a thrown silhouette, the walkway
// severs and its far piece swings down; the friend slides off the end and catches the lip. On the landing everyone
// ducks; the Director turns back.
import React from 'react';
import {Frame, Grade, Cam, smoothCam, shake} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, lerp, easeInOut, easeOut} from '../../kit/math';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt, rebarAt} from './blocking';
import {BreakerAt, Drones, EscortWarden, BlastFx} from './machines';
import {BEAT, SHOT} from './world';
import {Rebar} from './props';
import {Glow} from '../../fx/light';

const camAt = (T: number): Cam => {
  const s = SHOT.C13.start;
  const x = keys(T, [[s, 11380], [BEAT.blast, 11300, easeInOut], [SHOT.C13.end, 11050, easeInOut]]);
  const z = keys(T, [[s, 0.44], [BEAT.blast, 0.45], [SHOT.C13.end, 0.5, easeInOut]]);
  return {x, y: keys(T, [[s, -1760], [SHOT.C13.end, -1700]]), z};
};

export const C13: React.FC = () => {
  const {t, T} = useShot('C13');
  const cam0 = smoothCam(camAt, T, 0.3);
  const a = T - BEAT.blast;
  const cam = shake(cam0, T, a > 0 ? 26 * Math.exp(-3.2 * a) : 0, 13, 11);
  const ink = ik(cam);
  const slots = slotsOf(crewAt(T), ink, {
    deckBack: <g><EscortWarden T={T} ink={ink} /><BreakerAt T={T} ink={ink} /></g>,
    landing: <Rebar r={rebarAt(T)} ink={ink} />,
    air: <g><Drones T={T} ink={ink} far={false} only="B" /><BlastFx T={T} ink={ink} /></g>,
  });
  const flash = a > 0 ? clamp(1 - a / 0.14) * 0.75 : 0;
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id="c13" slots={slots} haze={0.8} />
      {a > 0 && a < 1.6 && <Glow x={lerp(380, 520, clamp(a))} y={560} r={900} color="#FF9A3C" opacity={0.35 * Math.exp(-1.5 * a)} id="c13lit" />}
      <Grade vignette={0.42} id="c13vg" flash={flash} />
      {void easeOut}
    </Frame>
  );
};
