import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {TOTAL} from './lib/timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="TelepathyFlaw" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
  </>
);
