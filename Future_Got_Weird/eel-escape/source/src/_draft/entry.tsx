import React from 'react';
import {Composition, registerRoot} from 'remotion';
import '../fonts';
import {FRAMES} from '../lib';
import {Film, Sheet} from './Film';

const Root: React.FC = () => (
  <>
    <Composition id="Draft" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="DraftSheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30], captions: true, cols: 4}} />
  </>
);
registerRoot(Root);
