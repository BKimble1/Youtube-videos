import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {S1Cold} from './scenes/S1Cold';
import {S4Train, trainCues} from './scenes/S4Train';
import {SceneOffset} from './lib/SceneFrame';
import {at} from './lib/narration';

// Prototypes for stills and timing checks: the cold open (first ~25 s) and the training explanation.
export const PROTO_FRAMES = at('Start with the why') + 60;
export const Proto: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={PROTO_FRAMES}>
      <SceneOffset from={0}><S1Cold /></SceneOffset>
    </Sequence>
    {audio ? <Audio src={staticFile('audio/narration.mp3')} /> : null}
  </AbsoluteFill>
);

const T0 = trainCues().start;
export const PROTO_TRAIN_FRAMES = trainCues().end - T0;
export const ProtoTrain: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill>
    <SceneOffset from={T0}><S4Train /></SceneOffset>
    {audio ? <Audio src={staticFile('audio/narration.mp3')} startFrom={T0} /> : null}
  </AbsoluteFill>
);
