import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {ShortMain, SHORT_FRAMES} from './short/ShortMain';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Short" component={ShortMain} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
  </>
);
