import React from 'react';
import {Composition} from 'remotion';
import {JawTest} from './test/JawTest';
import {RoomTest} from './test/RoomTest';
import {Film} from './Film';
import {Film2} from './v2/film2';
import {Film2 as Film3} from './v3/film3';
import {FRAMES, FPS} from './lib';
import '@fontsource-variable/fredoka';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MouthPadV3" component={Film3} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: false as string | false}} />
    <Composition id="MouthPadV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: false as string | false}} />
    <Composition id="MouthPadV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: false as string | false}} />
    <Composition id="RoomTest" component={RoomTest} durationInFrames={6} fps={FPS} width={1080} height={1920} />
    <Composition id="JawTest" component={JawTest} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
