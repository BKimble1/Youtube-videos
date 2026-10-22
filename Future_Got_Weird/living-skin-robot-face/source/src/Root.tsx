import React from 'react';
import {Composition, Still} from 'remotion';
import {W, H, FPS, FRAMES} from './lib';
import {ArtTest} from './Test';
import {ArtTest2} from './v2/Test2';
import {ArtTest3} from './v3/Test3';
import {LivingSkinV3} from './v3/LivingSkinV3';
import {LivingSkinV4} from './v4/LivingSkinV4';
import {LivingSkinV2, FilmStill2} from './v2/LivingSkinV2';
import {LivingSkin, FilmStill, CoverStill} from './LivingSkin';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LivingSkin" component={LivingSkin} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="Cover" component={CoverStill} width={W} height={H} defaultProps={{z: 1.9}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0}} />
    <Composition id="LivingSkinV2" component={LivingSkinV2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStillV2" component={FilmStill2} width={W} height={H} defaultProps={{t: 0}} />
    <Composition id="LivingSkinV4" component={LivingSkinV4} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Composition id="LivingSkinV3" component={LivingSkinV3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="ArtTest3" component={ArtTest3} width={W} height={H} defaultProps={{yaw: -0.42, pitch: 0.07, s: 0.6, cam: {x: 0, y: 60, z: 1.15}, k: 0, tone: 0}} />
    <Still id="ArtTest2" component={ArtTest2} width={W} height={H} defaultProps={{yaw: -0.42, pitch: 0.07, s: 0.6, cam: {x: 0, y: 60, z: 1.15}, xc: 999, tone: 0}} />
    <Still id="ArtTest" component={ArtTest} width={W} height={H} defaultProps={{yaw: -0.3, pitch: 0.08, s: 0.6, cam: {x: 0, y: 60, z: 1.15}, win: 0, tone: 0}} />
  </>
);
