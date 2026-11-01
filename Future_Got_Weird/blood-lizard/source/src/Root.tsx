import React from 'react';
import {Composition} from 'remotion';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {Test} from './Test';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BloodLizardV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 10, 20, 30], cols: 4}} />
    <Composition id="Test" component={Test as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{which: 'lizard', cx: 0, cy: -1, w: 14, p: {}}} />
  </>
);
