import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '../fonts';
import {Captions2, INK} from './kit2';
import {Backdrop, OpenScene, ClaimCard} from './open';
import {Stage3, SourcePage} from './inspect';
import {Test4, Mail5} from './flow';
import {Close6} from './close';

export const Film2: React.FC<{captions?: boolean; audio?: boolean}> = ({captions = false, audio = true}) => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: INK}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <Backdrop g={g} />
        <OpenScene g={g} />
        <Stage3 g={g} />
        <SourcePage g={g} />
        <Test4 g={g} />
        <Mail5 g={g} />
        <Close6 g={g} />
        <ClaimCard g={g} />
        {captions && <Captions2 g={g} />}
      </svg>
      {audio && <Audio src={staticFile('audio/final_mix_v2.wav')} />}
    </AbsoluteFill>
  );
};
