// FGW Starship Dual Catch — V2 film. Shot list per section; all cues from the measured Test Voice narration.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Shot, Timeline} from './timeline';
import {s0s1Shots} from './shots/s0s1';
import {s2s3Shots} from './shots/s2s3';
import {s4s5s6Shots} from './shots/s4s5s6';
import {s7s8s9Shots} from './shots/s7s8s9';

export const allShotsV2 = (): Shot[] => [...s0s1Shots(), ...s2s3Shots(), ...s4s5s6Shots(), ...s7s8s9Shots()];

export const MainV2: React.FC<{audio?: string | false}> = ({audio = 'mix'}) => {
  const t = useCurrentFrame() / 30;
  const shots = React.useMemo(allShotsV2, []);
  return (
    <AbsoluteFill style={{background: '#05070a'}}>
      <Timeline shots={shots} t={t} />
      {audio === 'mix' ? <Audio src={staticFile('audio/v2/mix.wav')} /> : null}
      {audio === 'voice' ? <Audio src={staticFile('audio/v2/narration.wav')} /> : null}
    </AbsoluteFill>
  );
};
