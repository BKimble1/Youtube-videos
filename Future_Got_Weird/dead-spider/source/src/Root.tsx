import React from 'react';
import {Composition, Still} from 'remotion';
import {RigSheet} from './dev/RigSheet';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';
import './fonts';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DeadSpider" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="RigSheet" component={RigSheet} width={1080} height={1920} defaultProps={{es: [0, 0.5, 1]}} />
  </>
);
