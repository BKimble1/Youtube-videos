import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {ShortMain, SHORT_FRAMES} from './short/ShortMain';
import {CompanionMain, COMPANION_FRAMES} from './companion/CompanionMain';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Short" component={ShortMain} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="Companion" component={CompanionMain} durationInFrames={COMPANION_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
  </>
);
