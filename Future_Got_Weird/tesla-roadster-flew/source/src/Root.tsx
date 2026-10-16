import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {ShortMain, SHORT_FRAMES} from './short/ShortMain';
import {CompanionMain, COMPANION_FRAMES} from './companion/CompanionMain';
import {Thumbnail, THUMB_DEFAULTS} from './thumb/Thumbnail';
import {ShortV3, V3_FRAMES} from './short3/ShortV3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Short" component={ShortMain} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="ShortV3" component={ShortV3} durationInFrames={V3_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="Companion" component={CompanionMain} durationInFrames={COMPANION_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} defaultProps={THUMB_DEFAULTS} />
  </>
);
