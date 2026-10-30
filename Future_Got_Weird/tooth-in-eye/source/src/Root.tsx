import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {ModelSheet} from './dev/ModelSheet';
import {FaceTest} from './dev/FaceTest';
import {ProfileTest} from './dev/ProfileTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ToothEyeV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v1' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 6, 12, 24, 40, 60, 70, 80, 90, 100, 115, 130, 150, 170, 190, 210], captions: true, cols: 4}} />
    <Composition id="ModelSheet" component={ModelSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="FaceTest" component={FaceTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{z: 36, x: -32, y: 0, reveal: 1, yaw: 0, smile: 0, brow: 0, open: 0, pocket: false}} />
    <Composition id="ProfileTest" component={ProfileTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{z: 34, x: 3, y: 0, mode: 'clear'}} />
  </>
);
