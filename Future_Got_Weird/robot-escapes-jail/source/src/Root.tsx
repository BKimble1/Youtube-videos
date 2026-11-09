import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RobotJail" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60, 90], captions: true, cols: 4}} />
  </>
);
