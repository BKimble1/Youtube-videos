// The film: shot list from every section, narration + mix, all timing derived from the measured narration.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './kit/anim';
import {Shot, Timeline} from './kit/timeline';
import {hookShots} from './shots/Hook';
import {stackShots} from './shots/Stack';
import {boosterShots} from './shots/BoosterSec';
import {orbitShots} from './shots/OrbitSec';
import {towerShots} from './shots/TowerSec';
import {endShots} from './shots/EndSec';

export const allShots = (): Shot[] => [...hookShots(), ...stackShots(), ...boosterShots(), ...orbitShots(), ...towerShots(), ...endShots()];

export const Main: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const t = useCurrentFrame() / FPS;
  const shots = React.useMemo(allShots, []);
  return (
    <AbsoluteFill style={{background: '#05070a'}}>
      <Timeline shots={shots} t={t} />
      {audio === 'mix' ? <Audio src={staticFile('audio/mix.wav')} /> : null}
      {audio === 'voice' ? <Audio src={staticFile('audio/narration_review.wav')} /> : null}
    </AbsoluteFill>
  );
};
