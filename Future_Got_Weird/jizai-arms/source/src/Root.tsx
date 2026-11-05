import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {RigTest} from './dev/RigTest';
import {Film, Probe} from './film/Film';
import {DUR, FPS} from './film/cast';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="JizaiV1" component={Film} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="Probe" component={Probe} durationInFrames={64} fps={FPS} width={1080} height={1920} defaultProps={{times: [0]}} calculateMetadata={({props}) => ({durationInFrames: (props as {times: number[]}).times.length})} />
    <Composition id="RigTest" component={RigTest} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{yaw: 0}} />
  </>
);
