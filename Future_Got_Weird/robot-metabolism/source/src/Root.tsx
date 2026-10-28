import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film} from './Film';
import {FRAMES, FPS} from './lib/time';
import {Sheet} from './dev/Sheet';
import {CamTest} from './dev/CamTest';
import {CamTest2} from './dev/CamTest2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RobotMetabolism" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{captions: true, audio: 'mix'}} />
    <Composition id="RobotMetabolismV2" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{captions: true, audio: 'mix_v2', v: 2}} />
    <Still id="FilmStill" component={Film} width={1080} height={1920} defaultProps={{captions: true, audio: '', frame: 0}} />
    <Still id="Sheet" component={Sheet} width={1080 * 4} height={1920 * 3} defaultProps={{frames: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110], captions: true}} />
    <Still id="CamTest" component={CamTest} width={1080} height={1920} defaultProps={{t: 0, eye: [0.9, 0.5, 0.8] as [number, number, number], target: [0.2, 0.05, 0] as [number, number, number], f: 1300, oy: 0}} />
    <Still id="CamTest2" component={CamTest2} width={1080} height={1920} defaultProps={{t: 0, eye: [0.9, 0.5, 0.8] as [number, number, number], target: [0.2, 0.05, 0] as [number, number, number], f: 1300, oy: 0, world: 'early'}} />
  </>
);
