import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES} from './lib/core';
import {Geo} from './dev/Geo';
import {Thumb} from './Thumb';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ScrollFilm" component={Film} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={1920} height={1080} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={1920} height={1080} defaultProps={{ts: [0], cols: 4}} />
    <Still id="Geo" component={Geo} width={1920} height={1080} />
    <Still id="Thumb" component={Thumb} width={1920} height={1080} />
  </>
);
