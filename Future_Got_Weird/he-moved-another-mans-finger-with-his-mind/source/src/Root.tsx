import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib/core';
import {CastSheet} from './dev/Cast';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FingerFilm" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Still id="CastSheet" component={CastSheet} width={W} height={H} />
  </>
);
