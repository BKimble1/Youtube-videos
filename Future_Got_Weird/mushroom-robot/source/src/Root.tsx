import React from 'react';
import {Composition, useCurrentFrame, AbsoluteFill} from 'remotion';
import './fonts';
import {RobotWorld} from './RobotWorld';
import {FRAMES, FPS} from './timing';
import {Film} from './Film';

const AOnly: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000'}}><RobotWorld t={f / FPS} /></AbsoluteFill>;
};
export const Root: React.FC = () => (
  <>
    <Composition id="MushroomRobotV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v1', captions: false}} />
    <Composition id="WorldA" component={AOnly} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
