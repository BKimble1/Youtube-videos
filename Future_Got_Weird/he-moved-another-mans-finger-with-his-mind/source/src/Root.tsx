import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib/core';
import {CastSheet} from './dev/Cast';
import {FingerSheet} from './dev/FingerSheet';
import {Hands3} from './dev/Hands3';
import {FilmV2, SheetV2, StillV2} from './v2/FilmV2';
import {FilmV3, SheetV3, StillV3} from './v3/FilmV3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FingerFilm" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Composition id="FingerV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{captions: true}} />
    <Still id="StillV3" component={StillV3} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="SheetV3" component={SheetV3} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Composition id="FingerV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{captions: true}} />
    <Still id="StillV2" component={StillV2} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="SheetV2" component={SheetV2} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Still id="Hands3" component={Hands3} width={W} height={H} />
    <Still id="FingerSheet" component={FingerSheet} width={W} height={H} />
    <Still id="CastSheet" component={CastSheet} width={W} height={H} />
  </>
);
