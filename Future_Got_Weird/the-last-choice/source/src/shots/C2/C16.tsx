// C16 — to the refuge. The music softens (M.SOFTEN). Two set-ups: (a) down the landing stairs, the refuge's warm glass
// and its teal aid symbol ahead across the esplanade; (b) along the esplanade to the entrance, which they reach as the
// shot ends on the final hit (M.FINAL_HIT), when D1 opens the doors.
import React from 'react';
import {Frame, Grade, Cam, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, easeInOut, lerp, smooth} from '../../kit/math';
import {CrossingScene, slotsOf, ik} from './scene';
import {descendAt, C16_CUT, DOOR_X} from './descend';
import {BEAT, SHOT} from './world';
import {Drones} from './machines';
import {Glow} from '../../fx/light';

const camA = (T: number): Cam => ({
  x: keys(T, [[SHOT.C16.start, 14100], [C16_CUT, 14420, easeInOut]]),
  y: keys(T, [[SHOT.C16.start, -880], [C16_CUT, -640, easeInOut]]),
  z: keys(T, [[SHOT.C16.start, 0.6], [C16_CUT, 0.64]]),
});
const camB = (T: number): Cam => ({
  x: keys(T, [[C16_CUT, 14780], [124.6, DOOR_X - 120, easeInOut], [SHOT.C16.end, DOOR_X - 100]]),
  y: keys(T, [[C16_CUT, -600], [SHOT.C16.end, -640]]),
  z: keys(T, [[C16_CUT, 0.72], [SHOT.C16.end, 0.84, easeInOut]]),
});

export const C16: React.FC = () => {
  const {t, T} = useShot('C16');
  const sub = T < C16_CUT ? 'a' : 'b';
  const cam = smoothCam(sub === 'a' ? camA : camB, T, 0.3);
  const ink = ik(cam);
  const slots = slotsOf(descendAt(T), ink, {air: <Drones T={T} ink={ink} far={false} only="B" />});
  const warm = smooth(clamp((T - BEAT.soften) / 4));
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id={`c16${sub}`} slots={slots} haze={0.5} />
      <Glow x={sub === 'a' ? 1700 : 1500} y={620} r={lerp(700, 1000, warm)} color="#FFE2A8" opacity={0.18 + 0.14 * warm} id={`c16${sub}w`} />
      <Grade vignette={lerp(0.42, 0.3, warm)} id={`c16${sub}vg`} />
    </Frame>
  );
};
