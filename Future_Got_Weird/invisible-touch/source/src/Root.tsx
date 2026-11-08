import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {HandTest} from './test/HandTest';
import {LabTest} from './test/LabTest';
import {FilmV2, SheetV2} from './v2/Film2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InvisibleTouch" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60], captions: true, cols: 4}} />
    <Composition id="InvisibleTouchV2" component={FilmV2} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="SheetV2" component={SheetV2} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60], captions: true, cols: 4}} />
    <Composition id="HandTest" component={HandTest} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="LabTest" component={LabTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{i: 0}} />
  </>
);
