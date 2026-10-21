// FGW Starship Dual Catch — V4 film: announcement-led opening, tightened narration, rebuilt site in one perspective.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Shot, Timeline} from './timeline';
import {openShots} from './shots/open';
import {mechShots} from './shots/mech';
import {flipShots} from './shots/flip';
import {endShots} from './shots/end';
export {FILM_END as FILM_END_V4} from './time';

export const allShotsV4 = (): Shot[] => [...openShots(), ...mechShots(), ...flipShots(), ...endShots()];

export const MainV4: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const t = useCurrentFrame() / 30;
  const shots = React.useMemo(allShotsV4, []);
  return (
    <AbsoluteFill style={{background: '#05070a'}}>
      <Timeline shots={shots} t={t} />
      {audio === 'mix' ? <Audio src={staticFile('audio/v4/mix.wav')} /> : null}
      {audio === 'voice' ? <Audio src={staticFile('audio/v4/narration.wav')} /> : null}
    </AbsoluteFill>
  );
};
