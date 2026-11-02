import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {CharTest} from './dev/CharTest';
import {Film2, Sheet2} from './v2/Film2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TimeMachineV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v1' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
    <Composition id="CharTest" component={CharTest} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="TimeMachineV2" component={Film2} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Composition id="Sheet2" component={Sheet2} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
  </>
);
