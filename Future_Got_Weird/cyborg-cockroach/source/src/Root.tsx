import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RigSheet, WalkStrip} from './dev/RigSheet';
import {CamTest} from './dev/CamTest';
import {OpTest} from './dev/OpTest';
import {S13Test} from './dev/S13Test';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, W, H} from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CyborgCockroachV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: false as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="CamTest" component={CamTest} width={W} height={H} defaultProps={{f: 0, cams: []}} />
    <Still id="OpTest" component={OpTest} width={W} height={H} defaultProps={{t: 3.5, cams: []}} />
    <Still id="S13Test" component={S13Test} width={W} height={H} defaultProps={{f: 840, cos: []}} />
    <Composition id="RigSheet" component={RigSheet} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{}} />
    <Composition id="WalkStrip" component={WalkStrip} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}} />
  </>
);
