import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {FRAMES3} from './v3/story3';
import {FRAMES4} from './v4/story4';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AnkleKnee" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="AnkleKneeV2" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true, v2: true}} />
    <Composition id="SheetV2" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0], captions: true, cols: 4, v2: true}} />
    <Composition id="AnkleKneeV3" component={Film} durationInFrames={FRAMES3} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true, v3: true}} />
    <Composition id="SheetV3" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0], captions: true, cols: 4, v3: true}} />
    <Composition id="AnkleKneeV4" component={Film} durationInFrames={FRAMES4} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true, v4: true}} />
    <Composition id="SheetV4" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0], captions: true, cols: 4, v4: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
  </>
);
