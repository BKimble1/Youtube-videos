import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';
import {PoseTest} from './dev/PoseTest';
import {CrouchTest} from './dev/CrouchTest';
import {V3Test} from './dev/V3Test';
import {WalkTest} from './dev/WalkTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WiFiWallsV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="V3Test" component={V3Test} width={W} height={H} defaultProps={{what: "cam", ts: [0]}} />
    <Still id="CrouchTest" component={CrouchTest} width={W} height={H} defaultProps={{variants: []}} />
    <Still id="PoseTest" component={PoseTest} width={W} height={H} defaultProps={{variants: [{}], hand: undefined}} />
    <Still id="WalkTest" component={WalkTest} width={W} height={H} defaultProps={{g: {x0: 0, v: 560, T: 0.95}, ts: [0], farBehind: true}} />
  </>
);
