import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES, FPS} from './lib';
import {Film, Sheet} from './Film';
import {FishTest} from './test/FishTest';
import {WaterTest} from './test/WaterTest';
import {HeartTest} from './test/HeartTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HeartFishV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [0, 60, 120], captions: true, cols: 3}} />
    <Composition id="FishTest" component={FishTest} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="WaterTest" component={WaterTest} durationInFrames={360} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="HeartTest" component={HeartTest} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
