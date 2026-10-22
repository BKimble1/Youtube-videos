import React from 'react';
import {Composition, Still} from 'remotion';
import {W, H, FPS, FRAMES} from './lib';
import {ArtTest} from './Test';
import {LivingSkin, FilmStill, CoverStill} from './LivingSkin';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LivingSkin" component={LivingSkin} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="Cover" component={CoverStill} width={W} height={H} defaultProps={{z: 1.9}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0}} />
    <Still id="ArtTest" component={ArtTest} width={W} height={H} defaultProps={{yaw: -0.3, pitch: 0.08, s: 0.6, cam: {x: 0, y: 60, z: 1.15}, win: 0, tone: 0}} />
  </>
);
