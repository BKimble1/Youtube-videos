import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, FilmStill} from './Film';
import {FPS, FRAMES, H, W} from './world';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InvisibilityShield" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false} as {t: number; captions: boolean}} />
  </>
);
