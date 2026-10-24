import React from 'react';
import {Composition, Still} from 'remotion';
import {ModelSheet} from './ModelSheet';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';
import {ModelSheet2} from './v2/ModelSheet2';
import {Film2, FilmStill2, Sheet2} from './v2/Film2';
import {Film3, FilmStill3, Sheet3} from './v3/Film3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RealWebFluid" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{ts: [0, 1, 2, 3, 4, 5], captions: false}} />
    <Composition id="RealWebFluidV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="FilmStillV2" component={FilmStill2} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="SheetV2" component={Sheet2} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Composition id="RealWebFluidV3" component={Film3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Still id="FilmStillV3" component={FilmStill3} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="SheetV3" component={Sheet3} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="ModelSheetV2" component={ModelSheet2} width={W} height={H} defaultProps={{v: 1}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{}} />
  </>
);
