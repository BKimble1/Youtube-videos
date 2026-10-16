import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {ShortMain, SHORT_FRAMES} from './short/ShortMain';
import {CompanionMain, COMPANION_FRAMES} from './companion/CompanionMain';
import {Thumbnail, THUMB_DEFAULTS} from './thumb/Thumbnail';
import {ShortV3, V3_FRAMES} from './short3/ShortV3';
import {ShortV4, V4_FRAMES} from './short4/ShortV4';
import {Board} from './companion2/Board';
import {Companion2, C2_FRAMES} from './companion2/Companion2';
import {Companion3, C3_FRAMES} from './companion3/Companion3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Short" component={ShortMain} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="ShortV4" component={ShortV4} durationInFrames={V4_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="ShortV3" component={ShortV3} durationInFrames={V3_FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: true}} />
    <Composition id="Companion" component={CompanionMain} durationInFrames={COMPANION_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="Companion2" component={Companion2} durationInFrames={C2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Still id="C2Board" component={Board} width={1920} height={1080} />
    <Composition id="Companion3" component={Companion3} durationInFrames={C3_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} defaultProps={THUMB_DEFAULTS} />
  </>
);
