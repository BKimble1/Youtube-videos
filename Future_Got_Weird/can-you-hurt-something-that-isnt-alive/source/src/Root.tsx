import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Main, MAIN_FRAMES} from './Main';
import {Proto} from './Proto';
import {frames} from './lib/narration';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="Preview" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: false}} />
    <Composition id="Proto" component={Proto} durationInFrames={frames(54.1)} fps={30} width={1920} height={1080} />
  </>
);
