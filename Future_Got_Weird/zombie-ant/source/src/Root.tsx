import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {RigSheet} from './dev/RigSheet';
import {CamTest} from './dev/CamTest';
import {StalkTest} from './dev/StalkTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ZombieAntV2" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: "mix_v2" as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 6, 9, 13, 18, 26, 34, 42, 50, 57, 64, 72, 80, 90, 100, 115], captions: true, cols: 4}} />
    <Composition id="CamTest" component={CamTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 0, v: [[0, -14, 120, 0.3]] as [number, number, number, number][]}} />
    <Composition id="StalkTest" component={StalkTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 2.2, v: [[0, 0, 60]] as [number, number, number][]}} />
    <Composition id="RigSheet" component={RigSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
