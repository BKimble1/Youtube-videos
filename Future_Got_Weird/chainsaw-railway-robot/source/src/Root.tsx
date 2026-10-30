import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib/core';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ChainsawRobotV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: false as string | false}} />
    {/* V2: same composition, same narration and timing; the source is the V2 state of the project */}
    <Composition id="ChainsawRobotV2" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: false as string | false}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
  </>
);
