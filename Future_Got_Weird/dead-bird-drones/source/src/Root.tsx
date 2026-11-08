import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';

export const RemotionRoot: React.FC = () => (
  <>
    {/* V1 is kept as an id for old commands; the source now draws V2 (V1 lives in git history and exports/) */}
    <Composition id="DeadBirdDronesV3" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="DeadBirdDronesV2" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="DeadBirdDronesV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
  </>
);
