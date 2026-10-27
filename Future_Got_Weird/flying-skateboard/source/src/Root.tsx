import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RigTest} from './dev/RigTest';
import {H, W} from './eng/v3';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES} from './story/time';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FlyingSkateboardV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v1' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="Sheet" component={Sheet} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Still id="RigTest" component={RigTest} width={W} height={H} defaultProps={{}} />
  </>
);
