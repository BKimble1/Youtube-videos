import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ZombieSnailV2" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 6, 9, 13, 18, 26, 34, 42, 50, 57, 64, 72, 80, 90, 100, 115], captions: true, cols: 4}} />
  </>
);
