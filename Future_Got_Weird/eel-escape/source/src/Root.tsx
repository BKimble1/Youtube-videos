import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {ProtoSheet} from './proto';
import {FilmV4, SheetV4} from './v4/FilmV4';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EelEscapeV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
    <Composition id="EelEscapeV4" component={FilmV4} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false, captions: true}} />
    <Composition id="SheetV4" component={SheetV4} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60], captions: true, cols: 4}} />
    <Composition id="ProtoSheet" component={ProtoSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ts: [0, 1, 2], cols: 5}} />
  </>
);
