import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES} from './lib/core';
import {Geo} from './dev/Geo';
import {Thumb} from './Thumb';
import {FilmV2, SheetV2, StillV2} from './v2/FilmV2';
import {FilmV3, SheetV3, StillV3} from './v3/FilmV3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ScrollFilm" component={Film} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={1920} height={1080} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={1920} height={1080} defaultProps={{ts: [0], cols: 4}} />
    <Still id="Geo" component={Geo} width={1920} height={1080} />
    <Composition id="ScrollV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{captions: true}} />
    <Still id="StillV2" component={StillV2} width={1920} height={1080} defaultProps={{t: 0}} />
    <Still id="SheetV2" component={SheetV2} width={1920} height={1080} defaultProps={{ts: [0], cols: 4}} />
    <Composition id="ScrollV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{captions: true}} />
    <Composition id="ScrollV4" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{captions: true}} />
    <Still id="StillV3" component={StillV3} width={1920} height={1080} defaultProps={{t: 0}} />
    <Still id="SheetV3" component={SheetV3} width={1920} height={1080} defaultProps={{ts: [0], cols: 4}} />
    <Still id="Thumb" component={Thumb} width={1920} height={1080} />
  </>
);
