import React from 'react';
import {Composition, Still} from 'remotion';
import {RigSheet} from './dev/RigSheet';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';
import './fonts';
import {Film2, Sheet2} from './v2/Film2';
import {FRAMES as FRAMES2} from './v2/lib2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DeadSpider" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Composition id="DeadSpiderV2" component={Film2} durationInFrames={FRAMES2} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="Sheet2" component={Sheet2} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="RigSheet" component={RigSheet} width={1080} height={1920} defaultProps={{es: [0, 0.5, 1]}} />
  </>
);
