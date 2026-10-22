import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Sheet} from './dev/Sheet';
import {Main, MAIN_FRAMES} from './Main';
import {V2Dev} from './v2/Dev';
import {MainV2, MAINV2_FRAMES} from './v2/MainV2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="MainV2" component={MainV2} durationInFrames={MAINV2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="MainV3" component={MainV2} durationInFrames={MAINV2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix3' as const}} />
    <Composition id="PreviewV2" component={MainV2} durationInFrames={MAINV2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="V2Dev" component={V2Dev} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
  </>
);
