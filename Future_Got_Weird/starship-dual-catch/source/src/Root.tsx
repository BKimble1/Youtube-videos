import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Sheet} from './Sheet';
import {Main, MAIN_FRAMES} from './Main';
import {Thumb} from './Thumb';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as 'mix' | 'narration' | false}} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{variant: 0}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={3} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
  </>
);
