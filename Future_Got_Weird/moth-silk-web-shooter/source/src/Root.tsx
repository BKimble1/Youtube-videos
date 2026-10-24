import React from 'react';
import {Composition, Still} from 'remotion';
import {ModelSheet} from './ModelSheet';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RealWebFluid" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{ts: [0, 1, 2, 3, 4, 5], captions: false}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{}} />
  </>
);
