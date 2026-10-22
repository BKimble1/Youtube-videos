import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Sheet} from './dev/Sheet';
import {Main, MAIN_FRAMES} from './Main';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
  </>
);
