import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {ColdOpen} from './scenes/Cold';
import {Display} from './scenes/Display';
import {frames, T} from './lib/narration';

// Prototype: the opening two scenes only, for stills and timing checks.
export const Proto: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={frames(T('Picture'))}><ColdOpen /></Sequence>
    <Sequence from={frames(T('Picture'))} durationInFrames={frames(T('So why not')) - frames(T('Picture'))}><Display /></Sequence>
  </AbsoluteFill>
);
