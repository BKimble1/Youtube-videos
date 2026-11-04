import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {ProtoSheet} from './proto';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EelEscapeV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
    <Composition id="ProtoSheet" component={ProtoSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ts: [0, 1, 2], cols: 5}} />
  </>
);
