import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {EarTest} from './dev/EarTest';
import {Pose} from './dev/Pose';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EarForearmV4" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600, 630, 644], captions: true, cols: 6}} />
    <Composition id="EarTest" component={EarTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{z: [5, 2.5, 1.2, 0.6], blur: 2.4, depth: 2.2}} />
    <Composition id="Pose" component={Pose} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{v: [[520, 960, 1, 0]] as [number, number, number, number][]}} />
  </>
);
